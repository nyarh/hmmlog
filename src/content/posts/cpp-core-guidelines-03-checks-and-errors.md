---
title: C++ Core Guidelines 3편 컴파일할 때 잡을 오류와 실행할 때 확인할 조건
description: static_assert와 입력 검증 예제로 구분하는 컴파일 시간 검사와 실행 시간 검사의 역할
date: 2026-11-19
category: 개발/C++/Core Guidelines
art: code
---

[전체 연재 목차](/posts/cpp-core-guidelines/) · 1부 가이드라인을 읽는 기준

프로그램이 한 번에 처리할 수 있는 작업 수가 정해져 있다고 해보자. 코드에 적은 최대 작업 수가 0보다 커야 한다는 조건은 빌드할 때 확인할 수 있다. 사용자가 오늘 입력할 작업 수가 그 범위 안에 있는지는 프로그램을 실행해야 알 수 있다.

오류를 빨리 발견하려면 모든 조건을 같은 곳에서 검사하기보다, **그 조건을 판단할 정보가 언제 준비되는지** 살펴보는 편이 좋다. 이번 글에서는 P.5, P.6, P.7을 이 순서로 연결한다.

## 코드에 고정된 조건은 컴파일할 때 확인한다

`static_assert`는 컴파일 시간에 조건을 검사한다. 조건이 거짓이면 실행 파일을 만드는 과정에서 오류가 발생한다.

다음은 그 검사만 보여주는 예다. `max_jobs`가 0이므로 의도적으로 컴파일에 실패한다.

```cpp
constexpr int max_jobs = 0;
static_assert(max_jobs > 0, "max_jobs must be positive");
```

이 조건을 프로그램이 시작될 때 `if`로 검사할 수도 있다. 하지만 이미 코드에 값이 정해져 있으므로 실행 시점까지 기다릴 이유가 없다. P.5는 이렇게 컴파일할 때 확인할 수 있는 조건을 먼저 처리하도록 권한다.

`static_assert`에 사용할 식은 컴파일 시간에 판단할 수 있어야 한다. 키보드로 입력받은 값을 여기에 넣을 수는 없다. `constexpr`가 붙었다고 실행 중에 들어올 정보까지 미리 알 수 있는 것도 아니다.

## 외부 입력은 값을 읽은 뒤 확인한다

아래 프로그램은 한 줄에 입력된 정수 하나를 읽고 1부터 8까지 허용한다. 숫자가 아니거나, 숫자 뒤에 다른 문자가 붙거나, 범위를 벗어나면 실제 작업을 시작하기 전에 종료한다.

```cpp
#include <array>
#include <cstddef>
#include <iostream>
#include <sstream>
#include <string>

constexpr int max_jobs = 8;
static_assert(max_jobs > 0, "max_jobs must be positive");

int main()
{
    std::string line;
    if (!std::getline(std::cin, line)) {
        std::cerr << "input is required\n";
        return 1;
    }

    std::istringstream input{line};
    int requested = 0;
    char extra = '\0';
    if (!(input >> requested) || (input >> extra)
        || requested < 1 || requested > max_jobs) {
        std::cerr << "enter one integer from 1 to " << max_jobs << '\n';
        return 1;
    }

    std::array<int, max_jobs> jobs{};
    for (int i = 0; i < requested; ++i) {
        jobs.at(static_cast<std::size_t>(i)) = i + 1;
    }

    std::cout << "prepared=" << requested << '\n';
}
```

`std::istringstream`은 문자열에서 값을 읽기 위한 스트림이다. `input >> requested`가 정수 읽기에 실패하면 첫 번째 조건이 참이 된다. 정수를 읽은 뒤에도 공백 이외의 문자가 남아 있으면 `input >> extra`가 성공하므로 역시 거절한다. 그 뒤에 허용 범위를 확인한다.

조건문의 `||`는 앞에서 참이 된 항목이 있으면 뒤의 식을 평가하지 않는다. 정수를 읽지 못했을 때 뒤의 범위 검사에 기대어 입력 성공 여부를 판단하는 구조가 아니다.

## 검사를 가능하게 하는 정보도 남겨야 한다

P.6는 실행 시간에 검사해야 하는 조건을 실제로 검사할 수 있도록 설계하자는 원칙이다. 검사 코드를 추가하려 해도 필요한 정보가 사라져 있으면 판단하기 어렵다.

예제의 `jobs`는 크기를 알고 있는 `std::array`다. 요청 개수를 검사하는 코드도 같은 `max_jobs`를 사용한다. 배열의 크기는 8인데 검사에서는 실수로 10까지 허용하는 식으로 숫자를 따로 관리할 필요가 없다.

반면 함수가 첫 원소를 가리키는 포인터만 받으면 그 포인터가 가리키는 배열의 길이를 일반적으로 알아낼 수 없다. 길이를 전달하거나, 길이를 함께 가진 타입으로 인터페이스를 만들어야 검사를 할 근거가 생긴다. 연속된 데이터를 전달하는 방법은 24편에서 자세히 다룬다.

크기를 가진 타입을 쓴다는 사실과 모든 접근에서 자동으로 범위를 검사한다는 사실도 구분해야 한다. 이 예제의 `at()`는 범위를 검사하지만 `std::array`의 `operator[]`는 같은 검사를 보장하지 않는다. C++20의 `std::span`도 크기를 전달한다고 해서 `operator[]`의 범위 검사가 보장되는 것은 아니다.

루프에서는 `i`가 0부터 시작하고 검사한 요청 개수보다 작은 동안만 접근한다. `std::size_t`로 바꾸는 지점에서도 음수가 아니라는 조건이 먼저 확보된다. 형 변환 자체가 잘못된 값을 올바르게 만들어주는 것은 아니다.

## 오류는 사용하기 전에 발견한다

P.7은 실행 시간 오류를 일찍 발견하도록 권한다. 예제에서는 입력을 확인한 다음 배열을 채운다. 범위를 벗어난 값을 여러 함수에 전달한 뒤 어딘가에서 실패하게 두면 원래 원인을 찾기가 어려워진다.

여기서 “일찍”은 프로그램 시작 시 모든 데이터를 무조건 검사하라는 뜻은 아니다. 큰 파일 전체를 여러 번 검사하거나, 거의 사용하지 않는 값의 검사를 위해 매번 많은 비용을 지불할 필요는 없을 수 있다. 해당 값을 사용하기 전에 필요한 조건을 확보하면서, 이미 검증한 정보를 계속 활용할 방법을 찾는 편이 좋다.

실제 프로그램에서는 검증한 요청을 별도 타입으로 표현할 수도 있다. 이후 함수가 그 타입을 받으면 어느 지점에서 조건을 보장했는지 더 분명해진다. 앞 글에서 횟수와 시간을 다른 타입으로 구분했던 생각을 값의 유효성까지 확장하는 것이다.

## 실행 결과를 확인한다

프로그램을 `check_jobs.cpp`로 저장한다. Linux의 GCC 14.2.0에서 C++20으로 다음 입력들을 확인했다. 예제 자체에 쓰인 기능은 C++11부터 사용할 수 있다.

```sh
g++ -std=c++20 -Wall -Wextra -Wpedantic -Wconversion check_jobs.cpp -o check_jobs
printf '3\n' | ./check_jobs
```

| 입력 | 결과 | 종료 코드 |
| --- | --- | ---: |
| `3` | `prepared=3` 출력 | 0 |
| `8` | `prepared=8` 출력 | 0 |
| `0`, `-1`, `9` | 허용 범위 안내 | 1 |
| `abc`, `3abc`, `3 4` | 정수 하나를 입력하라는 안내 | 1 |
| 입력 없이 종료 | `input is required` 출력 | 1 |

`max_jobs`를 0으로 바꾸면 앞에서 본 `static_assert`가 실패한다. 잘못된 입력이 들어오는 경우는 정상적으로 빌드된 프로그램이 실행 중 거절한다. 두 검사는 발생하는 시점과 확인하는 정보가 다르다.

원문의 **P.5, P.6, P.7**은 컴파일 시간 검사, 실행 시간에 검사 가능한 설계, 오류를 발견할 시점을 각각 다룬다.

<div class="source-card">
  <a href="https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#rp-compile-time" target="_blank" rel="noopener">
    <svg class="card-outline" aria-hidden="true" focusable="false"><rect x="1" y="1" rx="7" pathLength="1"></rect></svg>
    <strong>컴파일 시간과 실행 시간의 오류 검사</strong>
    <small>C++ Core Guidelines · isocpp.github.io</small>
    <span role="img" aria-label="새 탭에서 열기">↗</span>
  </a>
</div>

입력을 받는 함수 하나를 골라 조건을 두 칸에 나누어 적어보자. 코드와 타입만 보고 확인할 수 있는 조건, 실행 중 값을 알아야 확인할 수 있는 조건이다. 후자의 조건에는 필요한 정보가 함수에 함께 전달되는지도 확인하면 좋다.

[이전 글: 의도와 타입](/posts/cpp-core-guidelines-02-intent-and-types/) · [전체 목차](/posts/cpp-core-guidelines/) · [다음 글: 라이브러리와 도구 활용](/posts/cpp-core-guidelines-04-libraries-and-tools/)
