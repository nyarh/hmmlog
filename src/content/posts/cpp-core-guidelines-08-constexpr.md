---
title: C++ Core Guidelines 8편 constexpr로 계산 시점 표현하기
description: constexpr 변수와 함수의 차이 및 컴파일 시점 계산을 요구하는 문맥의 구분
date: 2026-11-19
category: 개발/C++/Core Guidelines
art: code
---

[전체 연재 목차](/posts/cpp-core-guidelines/) · 2부 변수와 표현식부터 안전하게

사용자가 입력한 숫자도 한 번 읽은 뒤 계속 같은 값으로 쓸 수 있다. `const`는 이런 변경 제한을 표현한다. 그 숫자를 프로그램 실행 전에 알 수 있는지는 별개의 조건이다.

Con.5는 컴파일 시점에 구할 상수에 `constexpr`를 쓰도록 권한다. F.4는 상수 표현식 계산에 사용할 함수에 `constexpr`를 붙이도록 권한다. 변수에 붙였을 때와 함수에 붙였을 때 요구하는 조건이 다르다.

## 같은 함수를 두 문맥에서 사용한다

물건을 네 개씩 담을 때 필요한 묶음 수를 구하는 프로그램이다. 고정된 개수와 사용자가 입력한 개수에 같은 계산 함수를 사용한다.

```cpp
#include <iostream>
#include <sstream>
#include <string>

constexpr int groups_of_four(int count)
{
    return count / 4 + (count % 4 != 0 ? 1 : 0);
}

int main()
{
    constexpr int planned_groups{groups_of_four(10)};
    static_assert(planned_groups == 3, "ten items need three groups");

    std::string line;
    if (!std::getline(std::cin, line)) {
        std::cerr << "invalid count\n";
        return 1;
    }

    std::istringstream input{line};
    int count{};
    std::string extra;
    if (!(input >> count) || (input >> extra) || count < 0) {
        std::cerr << "invalid count\n";
        return 1;
    }

    const int actual_groups{groups_of_four(count)};
    std::cout << "planned=" << planned_groups
              << " actual=" << actual_groups << '\n';
}
```

`5`를 입력하면 `planned=3 actual=2`를 출력한다. `planned_groups`의 초기화는 상수 표현식이어야 한다. 조건을 만족하지 못하면 컴파일 오류다. `static_assert` 역시 컴파일할 때 결과를 검사한다.

`count`는 실행 중에 읽으므로, 이 값을 넘긴 `groups_of_four` 호출은 상수 표현식이 될 수 없다. 함수의 `constexpr`는 조건이 맞는 호출을 상수 표현식으로 쓸 수 있게 한다. 모든 호출을 컴파일 시점으로 옮기지는 않는다.

## 함수의 입력 조건은 여전히 필요하다

`groups_of_four`는 0 이상의 `int`를 받는 함수로 작성했다. 입력을 읽는 쪽에서 음수를 거부해야 이 전제가 유지된다. `constexpr`를 붙여도 입력 범위와 업무 규칙은 직접 검사해야 한다.

흔히 올림 나눗셈을 `(count + 3) / 4`로 쓰지만, `count`가 `int`의 최댓값에 가까우면 덧셈부터 넘칠 수 있다. 예제는 몫과 나머지를 이용해 그 문제를 피했다. 여기서는 몫의 최댓값에도 1을 안전하게 더할 수 있다. 다른 식으로 바꾸면 다시 범위를 따져야 한다.

상수 표현식을 평가하다가 금지된 연산을 만나면 컴파일러가 거부한다. 같은 함수를 실행 중 호출할 때는 이런 자동 검사에 기대지 않고 입력을 확인해야 한다.

## const와 constexpr, consteval의 역할

| 표기 | 의도 |
| --- | --- |
| `const int n{read_value()};` | 실행 중 정해져도 이후 바꾸지 않을 값 |
| `constexpr int n{compute(10)};` | 초기화에 상수 표현식을 요구하는 값 |
| `constexpr int compute(int n)` | 조건이 맞는 호출을 상수 표현식에서 사용할 수 있는 함수 |
| `consteval int compute(int n)` | 일반적인 호출이 상수 표현식이어야 하는 즉시 함수 |

`read_value`와 `compute`는 표의 의미를 보여주는 가상 함수 이름이다. `constexpr` 변수는 `const`이기도 하다. 다만 `const int n{3};`처럼 `const` 정수도 조건에 따라 상수 표현식에 쓸 수 있으므로, 두 키워드를 ‘런타임 전용’과 ‘컴파일타임 전용’으로 나누면 정확하지 않다.

C++20의 `consteval`은 F.4의 기본 권고를 이해한 뒤 비교할 수 있는 보충 기능이다. 이 글의 입력 계산처럼 실행 중 호출도 필요한 함수에는 맞지 않는다. `constexpr` 함수의 본문에 허용되는 문법은 표준 버전에 따라 넓어졌으며, 예제의 간단한 반환식은 C++11 규칙으로도 작성할 수 있다.

## 계산을 미리 해야 하는 이유를 먼저 정한다

고정 크기나 타입의 매개변수를 정하고 컴파일 시점 검사를 수행할 때는 상수 표현식이 필요하다. 이런 곳에 제공할 계산이라면 `constexpr`가 호출하는 쪽에서 의지할 인터페이스의 약속이 된다.

실행 중 설정이나 외부 서비스에 의존할 계산에는 `constexpr`를 붙일지 신중히 정한다. 나중에 상수 표현식으로 쓸 수 없게 바뀌면 호출하는 코드도 수정해야 한다. F.4는 이런 의존성이 예상되는 API에 일괄 적용하지 말라고 설명한다.

컴파일러는 일반 계산도 최적화할 수 있으므로 `constexpr` 하나의 성능 효과를 단정할 수는 없다. 이 예제에서는 성능을 측정하지 않았고, 상수 표현식이 요구되는 문맥을 확인했다.

## 입력과 컴파일 실패 확인

Linux의 GCC 14.2.0에서 C++20으로 확인했다.

```sh
g++ -std=c++20 -Wall -Wextra -Wpedantic -Wconversion -Werror constexpr_example.cpp -o constexpr_example
./constexpr_example
```

0·4·5·10과 이 환경의 `int` 최댓값을 입력해 결과를 확인했다. 음수·문자·빈 입력·정수 뒤의 불필요한 토큰은 거부했다. `actual_groups`를 `constexpr`로 바꾼 경우에는 실행 중 입력인 `count`를 상수 표현식에서 사용할 수 없어 컴파일에 실패했다.

값을 선언할 때는 이후 바꿀 필요가 있는지와 컴파일 시점에 알아야 하는지를 따로 확인한다. 그 조건에 맞춰 `const`와 `constexpr`를 고르면 된다.

<!-- series-source-and-navigation -->

관련 원문 항목은 **Con.5, F.4**다. 아래 문서에서 권고의 이유와 예외를 확인할 수 있다.

<div class="source-card">
  <a href="https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#rf-constexpr" target="_blank" rel="noopener">
    <svg class="card-outline" aria-hidden="true" focusable="false"><rect x="1" y="1" rx="7" pathLength="1"></rect></svg>
    <strong>constexpr로 계산 시점 표현하기 관련 지침</strong>
    <small>C++ Core Guidelines · isocpp.github.io</small>
    <span role="img" aria-label="새 탭에서 열기">↗</span>
  </a>
</div>

[이전 글: const로 변경 가능한 범위를 줄이기](/posts/cpp-core-guidelines-07-const/) · [전체 목차](/posts/cpp-core-guidelines/) · [다음 글: auto를 쓰면 무엇이 추론되고 무엇이 달라질까](/posts/cpp-core-guidelines-09-auto/)
