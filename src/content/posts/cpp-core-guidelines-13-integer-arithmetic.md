---
title: C++ Core Guidelines 13편 정수의 범위와 산술 오류 다루기
description: 덧셈 전 범위 검사와 나눗셈의 예외 조건으로 정수 오버플로를 피하는 방법
date: 2026-11-19
category: 개발/C++/Core Guidelines
art: code
---

[전체 연재 목차](/posts/cpp-core-guidelines/) · 2부 변수와 표현식부터 안전하게

부호 있는 정수를 더한 뒤 결과가 작아졌는지 보는 방식으로는 오버플로를 검사할 수 없다. 범위를 넘는 덧셈 자체가 정의되지 않은 동작이어서, 비교할 결과가 기대한 방식으로 나온다는 보장이 없기 때문이다.

ES.103~105는 정수의 상한과 하한을 넘는 연산, 정수 0으로 나누기를 피하라고 권한다. 덧셈과 나눗셈 앞에 검사를 두어 잘못된 연산이 실행되지 않게 만들어 보자.

## 검사식 자체도 범위를 넘지 않아야 한다

아래 전체 프로그램은 `int` 덧셈과 나눗셈의 조건을 확인하고, 계산할 수 없으면 `std::nullopt`를 반환한다. 호출하는 쪽에서 오류 종류까지 알아야 한다면 그 정보를 담는 결과 타입이 필요하다.

```cpp
#include <iostream>
#include <limits>
#include <optional>
#include <string_view>

std::optional<int> checked_add(int left, int right)
{
    constexpr int lowest{std::numeric_limits<int>::min()};
    constexpr int highest{std::numeric_limits<int>::max()};
    if (right > 0 && left > highest - right) {
        return std::nullopt;
    }
    if (right < 0 && left < lowest - right) {
        return std::nullopt;
    }
    return left + right;
}

std::optional<int> checked_divide(int dividend, int divisor)
{
    if (divisor == 0) {
        return std::nullopt;
    }
    if (dividend == std::numeric_limits<int>::min() && divisor == -1) {
        return std::nullopt;
    }
    return dividend / divisor;
}

void print_result(std::string_view label, std::optional<int> result)
{
    std::cout << label << '=';
    if (result) {
        std::cout << *result;
    } else {
        std::cout << "invalid";
    }
    std::cout << '\n';
}

int main()
{
    constexpr int lowest{std::numeric_limits<int>::min()};
    constexpr int highest{std::numeric_limits<int>::max()};
    print_result("sum", checked_add(20, 22));
    print_result("cancel", checked_add(lowest, highest));
    print_result("above", checked_add(highest, 1));
    print_result("below", checked_add(lowest, -1));
    print_result("quotient", checked_divide(7, 2));
    print_result("zero", checked_divide(7, 0));
    print_result("min/-1", checked_divide(lowest, -1));
}
```

```text
sum=42
cancel=-1
above=invalid
below=invalid
quotient=3
zero=invalid
min/-1=invalid
```

`right`가 양수일 때는 `highest - right`를 기준으로 덧셈할 여유를 검사한다. 음수일 때는 `left`가 `lowest - right`보다 작으면 하한을 벗어난다. 각 분기의 뺄셈은 해당 조건 아래에서 `int` 범위에 들어가며, 두 검사를 통과한 뒤에만 `left + right`를 계산한다.

검사식에서 `-right`를 먼저 계산하지 않는 이유도 범위 때문이다. 정수 최솟값에 단항 마이너스를 적용하면 양수 범위를 넘을 수 있다. 오버플로를 확인하려는 식 자체도 안전하게 계산되어야 한다.

## 정수 나눗셈에는 두 경계가 있다

정수 0으로 나누기와 나머지 연산 `%`는 정의되지 않은 동작이다. 항상 예외를 던지거나 특정 오류 코드를 돌려준다고 기대할 수 없으므로 연산 전에 막아야 한다.

0 이외에도 최솟값을 -1로 나누는 경우가 있다. C++20의 부호 있는 정수 범위는 음수 쪽에 값 하나가 더 있어 그 몫을 같은 타입으로 표현할 수 없다. 예제는 이 조합을 별도로 거부한다. 같은 조합의 `%`도 피해야 한다.

정수 나눗셈은 소수 부분을 0 방향으로 버린다. `7 / 2`는 3이고 `-7 / 2`는 -3이다. 반올림이나 올림이 필요한 업무라면 나눗셈이 성공했다는 사실과 별개로 계산 정책을 구현해야 한다.

## 큰 타입으로 받는 것만으로 충분하지 않다

다음은 원리를 보여주는 조각이다. `count`와 `price`가 `int`라고 가정한다.

```cpp
long long total = count * price;
```

오른쪽은 `int`끼리 곱한 뒤 결과를 큰 타입에 넣는다. 곱셈부터 넓은 타입에서 하려면 피연산자를 먼저 변환해야 한다. 넓힌 타입에도 한계는 있으므로 곱셈·뺄셈·누적 합계에 필요한 범위는 계속 확인해야 한다.

인덱스를 0 아래로 내리는 상황도 ES.104와 함께 살펴볼 문제다. 부호 없는 값은 정의된 규칙으로 순환하더라도 그 결과를 배열 인덱스로 쓰면 범위를 벗어날 수 있다. 아주 작은 부동소수점 값이 0에 가까워지는 언더플로는 여기서 다루는 정수 하한 초과와 다른 개념이다.

## 직접 검사할지 도구에 맡길지

검사식이 반복되면 프로젝트에서 사용하는 범위 검사 정수 타입이나 검증된 연산 도구를 검토할 수 있다. 오류를 예외로 알릴지, 결과 타입으로 돌려줄지, 특정 연산에서만 의도적으로 순환할지는 호출하는 코드의 요구에 맞춰 정한다.

컴파일러 경고로 입력에 따른 모든 오버플로를 찾을 수는 없다. 실행 중 검사 도구도 실행한 경로까지만 확인한다. 예제에서는 경계 입력을 넣어 검사 함수의 반환값을 확인했으며, 잘못된 연산 자체를 실행해 결과를 관찰하지는 않았다.

Linux의 GCC 14.2.0에서 C++20으로 검증했다. `std::optional`과 `std::string_view`는 C++17 기능이다.

```sh
g++ -std=c++20 -Wall -Wextra -Wpedantic -Wconversion -Werror arithmetic.cpp -o arithmetic
./arithmetic
```

최솟값·최댓값·0·양수·음수의 조합으로 검사 함수를 확인했다. 정상 범위에서는 수학적 결과와 일치했고, 범위를 벗어나거나 정의되지 않은 나눗셈이 될 조합은 연산 전에 거부했다.

<!-- series-source-and-navigation -->

관련 원문 항목은 **ES.103, ES.104, ES.105**다. 아래 문서에서 권고의 이유와 예외를 확인할 수 있다.

<div class="source-card">
  <a href="https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#res-overflow" target="_blank" rel="noopener">
    <svg class="card-outline" aria-hidden="true" focusable="false"><rect x="1" y="1" rx="7" pathLength="1"></rect></svg>
    <strong>정수의 범위와 산술 오류 다루기 관련 지침</strong>
    <small>C++ Core Guidelines · isocpp.github.io</small>
    <span role="img" aria-label="새 탭에서 열기">↗</span>
  </a>
</div>

[이전 글: signed와 unsigned를 섞을 때 생기는 일](/posts/cpp-core-guidelines-12-signed-and-unsigned/) · [전체 목차](/posts/cpp-core-guidelines/) · [다음 글: 타입 변환이 필요한 곳과 위험해지는 곳](/posts/cpp-core-guidelines-14-conversions/)
