---
slug: cpp-core-guidelines-03-checks-and-errors
title: C++ Core Guidelines 3. 컴파일 시점 검사와 실행 중 검사
description: static_assert와 입력 검사로 잘못된 상태를 사용 전에 차단하는 방법
date: 2026-11-19
category: 개발/C++/Core Guidelines
art: code
---

배열 크기를 상수로 정했다면 빌드할 때 검사할 수 있다. 사용자가 입력한 개수는 프로그램을 실행해야 알 수 있다. 검사는 조건을 확인할 수 있는 시점과 그 값을 사용하는 위치에 맞춰 배치한다.

[P.5](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#rp-compile-time)는 컴파일 시점 검사를 우선하고, [P.6](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#rp-run-time)은 실행 중 검사에 필요한 정보를 유지하도록 권한다. [P.7](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#rp-early)은 잘못된 값이 문제를 일으키기 전에 발견하는 원칙이다.

## 고정된 조건은 static_assert로 검사

`static_assert`는 컴파일 시점에 알 수 있는 조건을 검사한다. 슬롯 수가 양수여야 한다면 상수를 선언한 곳에 그 조건을 둔다. 상수를 0으로 바꾸면 실행 파일을 만들기 전에 오류가 난다.

사용자 입력처럼 실행 중에 정해지는 값은 일반 조건문으로 검사한다.

## 입력을 검사한 뒤 범위 전달

다음 프로그램은 슬롯 4개 중 앞에서 몇 개를 활성화할지 입력받는다. 입력은 한 줄의 정수 하나이며 1~4만 허용한다. 슬롯의 초기값은 0이고, 선택한 슬롯을 1로 바꾼다.

```cpp
#include <array>
#include <cstddef>
#include <iostream>
#include <span>
#include <sstream>
#include <string>

constexpr int capacity = 4;
static_assert(capacity > 0, "capacity must be positive");

void enable(std::span<int> slots)
{
    for (int& slot : slots) {
        slot = 1;
    }
}

int main()
{
    std::string line;
    if (!std::getline(std::cin, line)) {
        std::cerr << "missing input\n";
        return 1;
    }

    std::istringstream input{line};
    int count{};
    if (!(input >> count) || !(input >> std::ws).eof()
        || count < 1 || count > capacity) {
        std::cerr << "expected one integer from 1 to 4\n";
        return 1;
    }

    std::array<int, capacity> slots{};
    const auto selected = std::span<int>{slots}.first(
        static_cast<std::size_t>(count));
    enable(selected);

    for (const int slot : slots) {
        std::cout << slot;
    }
    std::cout << '\n';
}
```

`slots.cpp`로 저장한 뒤 다음 명령으로 확인한다. `std::span`은 C++20부터 제공되며, Linux의 GCC 14.2.0에서 실행했다.

```sh
g++ -std=c++20 -Wall -Wextra -Wpedantic -Wconversion -Werror slots.cpp -o slots
printf '2\n' | ./slots
```

```text
1100
```

정수를 읽은 뒤 `std::ws`로 남은 공백을 넘기고 줄 끝인지 확인한다. 따라서 `2x`나 `2 3`은 거부한다. 빈 입력, 음수, 0, 5 이상과 정수 타입의 범위를 넘는 입력도 처리 전에 거부한다. 정상 범위의 양 끝인 1과 4는 각각 1000과 1111을 출력한다.

## span이 전달하는 정보

`std::span<int>`는 연속된 원소를 가리키는 위치와 개수를 함께 전달하는 뷰다. `enable`은 원소 수를 별도 매개변수로 받지 않고 범위를 순회한다. 위치와 개수를 독립적인 인자로 넘겨 서로 맞지 않게 전달할 가능성을 줄인다.

이 예제는 배열에서 전체 범위를 만들고, 검사한 개수만큼 앞부분을 선택한다. `first`는 개수가 배열 크기를 넘지 않는다고 확인한 뒤 호출한다.

C++20의 `std::span`이 범위를 벗어난 모든 사용을 자동으로 검사하거나 예외로 보고하는 것은 아니다. `first`와 원소 접근에는 호출자가 지켜야 할 범위 조건이 있다. 포인터와 잘못된 길이로 뷰를 만들면 원래 배열의 크기를 복구해 주지도 않는다.

`span`은 원소를 소유하지 않는다. 예제에서는 지역 배열이 살아 있는 동안 `enable`을 호출하므로 뷰가 유효하다. 배열이 소멸한 뒤에도 뷰를 사용하도록 저장해서는 안 된다.

## 검사 위치와 중복 검사

입력 검사를 통과한 뒤에만 슬롯을 변경하므로 오류가 난 입력은 부분적으로 반영되지 않는다. 문자열을 읽는 곳에서 형식과 범위를 검사하고, 처리 함수에는 검사에 필요한 크기가 포함된 범위를 전달한다.

P.7은 중복 검사의 비용도 다룬다. 유효한 날짜 객체를 문자열로 바꿔 전달하고 다시 해석하는 식의 반복은 피한다. 검사 비용이 크면 실제로 필요한 정보와 검사 시점을 따진다. 평균 상수 시간인 작업에 선형 시간 검사를 추가하면 인터페이스의 비용이 달라질 수 있다.

이전 글: [2. 의도와 단위를 타입으로 표현하기](/posts/cpp-core-guidelines-02-intent-and-types/) · 다음 글: [4. 표준 라이브러리와 도구 활용](/posts/cpp-core-guidelines-04-libraries-and-tools/)
