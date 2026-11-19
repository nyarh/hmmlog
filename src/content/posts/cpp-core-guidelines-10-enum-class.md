---
title: C++ Core Guidelines 10편 관련 있는 상수를 enum class로 묶기
description: 숫자와 매크로로 표현한 상태를 열거형으로 묶고 잘못된 조합을 타입으로 구분하는 방법
date: 2026-11-19
category: 개발/C++/Core Guidelines
art: code
---

[전체 연재 목차](/posts/cpp-core-guidelines/) · 2부 변수와 표현식부터 안전하게

주문 상태를 0·1·2로 기록하면 처음에는 간단하다. 그런데 함수에 1을 넘기는 코드를 읽을 때마다 그것이 주문 상태인지 배송 방식인지 찾아봐야 한다. 두 값이 모두 `int`라면 잘못 섞어도 컴파일러는 구분할 수 없다.

Enum.1~3은 관련 있는 이름들을 열거형으로 묶고, 가능하면 `enum class`를 사용하라고 권한다. 숫자에 설명을 붙이는 데서 그치지 않고 서로 다른 개념을 타입으로 나눈다.

## 같은 이름도 소속에 따라 구분한다

다음은 완전한 실행 예제다. 주문 상태와 배송 방식을 별개의 타입으로 만든다.

```cpp
#include <initializer_list>
#include <iostream>
#include <string_view>

enum class OrderState { waiting, paid, shipped };
enum class Delivery { standard, express };

std::string_view label(OrderState state)
{
    switch (state) {
    case OrderState::waiting:
        return "waiting";
    case OrderState::paid:
        return "paid";
    case OrderState::shipped:
        return "shipped";
    }
    return "unknown";
}

int main()
{
    for (const auto state : {OrderState::waiting,
                             OrderState::paid,
                             OrderState::shipped}) {
        std::cout << label(state) << '\n';
    }
}
```

```text
waiting
paid
shipped
```

`OrderState::paid`는 소속 타입까지 보여준다. 같은 이름을 다른 열거형 안에 두어도 소속으로 구분할 수 있다. 전통적인 비범위 열거형인 `enum`과 달리, `enum class`는 정수로 암시적으로 변환되지 않는다.

따라서 `label(1)`이나 `label(Delivery::express)`는 거부된다. 둘 다 호출자가 주문 상태를 전달했다는 근거가 없기 때문이다. `enum class`는 C++11부터 사용할 수 있다.

## 묶음에 이름을 붙일 수 있는지 살핀다

Enum.2의 기준은 상수들이 서로 관련 있는가다. 주문의 가능한 상태는 하나의 열거형이 어울린다. 반면 재시도 상한 3과 기본 여백 16은 우연히 정수라는 공통점만 있다. 그런 값은 각자 의미에 맞는 `constexpr` 상수로 두면 된다.

Enum.6은 이름 없는 열거형으로 정수 상수를 흩뿌리는 방식도 피하라고 권한다. 다음은 두 가지 의도를 구분하는 설명용 조각이다.

```cpp
enum class ConnectionState { disconnected, connecting, connected };
constexpr int retry_limit{3};
```

열거형은 가능한 선택지의 묶음이고, `retry_limit`는 계산에 사용할 수량이다. 숫자 상수를 모두 열거형에 넣을 필요는 없다. 서로 다른 선택지를 조합하는 비트 플래그는 다음 글에서 별도로 살펴본다.

## 매크로를 이름 있는 값으로 바꾼다

`#define PAID 1` 같은 매크로는 C++의 타입과 범위 규칙을 따르지 않는다. 전처리 단계에서 이름이 치환되어 함수 매개변수의 의미를 검사할 타입도 남지 않는다. Enum.1이 매크로보다 열거형이나 이름 있는 상수를 권하는 이유다.

Enum.5는 열거자 이름을 `PAID`처럼 전부 대문자로 쓰지 말라고 한다. 매크로와 충돌하기 쉽기 때문이다. `OrderState::PAID`라고 소속을 붙여도 전처리기는 `PAID` 토큰을 매크로로 치환할 수 있다. 네임스페이스나 `enum class`가 매크로 치환을 막아주지는 않는다.

대문자 이름은 매크로를 알아보는 표지로 남기고, 일반 상수와 열거자는 프로젝트의 일반 이름 규칙을 따르면 된다. 매크로를 남겨야 할 경우의 이름과 대안은 19편에서 다룬다.

## 열거자를 다 적었다고 모든 값이 검증되지는 않는다

예제의 `switch`는 선언한 세 열거자를 모두 처리한다. 새 상태를 추가했는데 `case`를 추가하지 않으면 컴파일러 경고로 빠진 분기를 찾는 데 도움이 된다. GCC에서는 `-Wswitch-enum`으로 이 확인을 강화할 수 있다.

그렇지만 열거형이 외부 숫자 입력을 자동으로 검증하는 것은 아니다. 고정된 기반 타입을 가진 열거형에는 선언된 이름이 없는 값도 들어갈 수 있다. 예제의 마지막 `return "unknown";`은 그런 값에 대한 방어적 처리다. 입력에서 숫자를 바로 캐스트해도 된다는 뜻은 아니다.

특히 네트워크나 파일의 숫자를 받을 때는 허용한 코드인지 먼저 확인해야 한다. 열거형의 값과 기반 타입을 명시할 때의 기준은 다음 글로 이어진다.

## 확인한 결과

Linux의 GCC 14.2.0에서 C++20으로 빌드했다. `std::string_view`에는 C++17 이상이 필요하다.

```sh
g++ -std=c++20 -Wall -Wextra -Wpedantic -Wconversion -Wswitch-enum -Werror enum_class.cpp -o enum_class
./enum_class
```

세 상태의 출력을 확인했다. 다른 열거형과 정수를 전달한 변형은 컴파일에 실패했고, `shipped` 분기를 뺀 변형은 열거자 누락 경고를 오류로 처리해 거부됐다. 타입을 나누는 효과와 분기 검사 효과를 각각 확인한 것이다.

<!-- series-source-and-navigation -->

관련 원문 항목은 **Enum.1, Enum.2, Enum.3, Enum.5, Enum.6**다. 아래 문서에서 권고의 이유와 예외를 확인할 수 있다.

<div class="source-card">
  <a href="https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#s-enum" target="_blank" rel="noopener">
    <svg class="card-outline" aria-hidden="true" focusable="false"><rect x="1" y="1" rx="7" pathLength="1"></rect></svg>
    <strong>관련 있는 상수를 enum class로 묶기 관련 지침</strong>
    <small>C++ Core Guidelines · isocpp.github.io</small>
    <span role="img" aria-label="새 탭에서 열기">↗</span>
  </a>
</div>

[이전 글: auto를 쓰면 무엇이 추론되고 무엇이 달라질까](/posts/cpp-core-guidelines-09-auto/) · [전체 목차](/posts/cpp-core-guidelines/) · [다음 글: 열거형의 연산과 값, 기반 타입 정하기](/posts/cpp-core-guidelines-11-enum-values/)
