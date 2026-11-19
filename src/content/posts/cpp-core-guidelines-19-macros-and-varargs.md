---
title: C++ Core Guidelines 19편 매크로와 C식 가변 인자의 대안 찾기
description: 텍스트 치환과 타입 없는 가변 인자를 상수와 함수 및 템플릿으로 바꾸는 기준
date: 2026-11-19
category: 개발/C++/Core Guidelines
art: code
---

[전체 연재 목차](/posts/cpp-core-guidelines/) · 2부 변수와 표현식부터 안전하게

함수처럼 생긴 매크로 호출도 전처리를 거치면 다른 코드가 된다. 매크로는 인자를 텍스트로 치환하므로, 작성한 식이 몇 번 평가되는지 치환 결과를 따라가야 한다. ES.30~31은 이런 텍스트 조작과 상수·함수를 대신하는 매크로를 피하도록 권한다.

상수와 함수, 템플릿을 쓰면 컴파일러의 타입 검사와 언어의 평가 규칙을 활용할 수 있다. C식 가변 인자를 다루는 ES.34와 F.55도 타입 검사를 유지하는 대안을 권한다.

## 괄호만 잘 쳐도 해결되지 않는 문제

아래 매크로는 인자를 두 번 치환한다. 문제를 설명하기 위한 조각이며 실행하면 안 된다.

```cpp
#define DEMO_SQUARE(x) ((x) * (x))

int value{3};
int result = DEMO_SQUARE(value++);
```

매크로 치환 뒤에는 `((value++) * (value++))`가 된다. 괄호로 우선순위를 보호했지만 인자를 두 번 평가하는 문제는 남는다. 이 두 변경은 서로 순서화되지 않으므로 C++20에서도 정의되지 않은 동작이다.

일반 함수에 인자로 쓴 `value++`는 한 번 평가된다. 여러 인자를 전달할 때 어느 인자가 먼저 평가될지는 별도 문제다. 항상 왼쪽부터라는 보장은 없으므로 [15편](/posts/cpp-core-guidelines-15-expressions-and-order/)의 기준을 함께 적용한다.

## 이름 있는 상수와 타입 있는 함수를 사용한다

아래 전체 프로그램은 매크로를 상수와 함수로 바꾼 예다. 출력 함수의 템플릿에는 C++17 폴드 표현식을 써서 인자마다 출력 연산을 연결했다.

```cpp
#include <iostream>

namespace demo {
inline constexpr int retry_limit{3};

constexpr int square(int value)
{
    return value * value;
}

template<class... Args>
void print_line(const Args&... args)
{
    (std::cout << ... << args) << '\n';
}
}

int main()
{
    int value{3};
    const int result{demo::square(value++)};
    demo::print_line("square=", result, " next=", value);
    demo::print_line("retry_limit=", demo::retry_limit);
    demo::print_line();
}
```

출력의 마지막 줄은 빈 줄이다.

```text
square=9 next=4
retry_limit=3

```

`square`에 넘기는 `value++`는 한 번 평가되어 원본이 4가 된다. 함수는 전달받은 3으로 계산한다. 다만 `value * value`가 `int` 범위에 들어간다는 전제는 계속 필요하므로, 함수로 바꿨더라도 다른 입력에서는 오버플로를 확인해야 한다.

`retry_limit`는 타입과 네임스페이스를 가진 상수다. 헤더에 정의해 여러 번 포함하는 경우를 고려해 C++17의 `inline` 변수로 선언했다. 함수에서의 `inline`도 호출 제거와 성능을 보장하는 표시는 아니다. 예제의 `constexpr` 함수는 암시적으로 `inline`이 된다.

## 가변 인자의 타입을 보존한다

C식 `...` 매개변수와 `va_arg`를 쓰는 함수는 전달된 값의 타입을 읽는 쪽이 맞혀야 한다. 기본 인자 승격으로 `float`가 `double`이 되는 등의 규칙도 알아야 한다. 잘못된 타입으로 꺼내거나 전달하지 않은 인자를 읽으면 정의되지 않은 동작으로 이어질 수 있다.

`printf` 같은 익숙한 함수에도 형식 문자열과 실제 인자 타입을 맞춰야 한다는 조건이 있다. 컴파일러의 형식 경고는 도움이 되지만 일반적인 사용자 정의 가변 함수의 모든 계약을 대신 검사해 주지는 않는다.

`Args...`로 받은 인자는 각각의 타입이 컴파일러에 남는다. 해당 타입의 `operator<<`가 없으면 컴파일 오류다. 빈 인자 목록은 초기값 `std::cout`으로 처리해 줄바꿈만 출력한다. C식 가변 인자처럼 읽을 타입을 호출자와 따로 약속할 필요가 없다.

이 출력 함수는 설명용으로, 출력 실패 처리와 여러 스레드의 메시지 단위 출력을 보장하지 않는다. 실제 로깅에 사용하려면 이런 요구를 더 검토해야 한다. 폴드 표현식 문법과 완전 전달은 템플릿을 다루는 9부에서 설명한다.

인자 형태가 몇 개로 정해져 있다면 오버로드가 더 단순할 수 있다. 같은 타입의 여러 값에는 `std::initializer_list<T>`나 범위가 어울리고, 정해진 여러 타입 중 하나를 받는다면 `std::variant`를 검토할 수 있다. F.55가 권하는 대안 중 인터페이스에 맞는 것을 고른다.

## 남겨야 하는 매크로는 알아볼 수 있게 한다

ES.30은 조건부 컴파일과 헤더 가드처럼 전처리 단계에 필요한 매크로는 허용한다. 다음은 헤더 가드의 설명용 골격이다.

```cpp
#ifndef DEMO_WIDGET_HPP_INCLUDED
#define DEMO_WIDGET_HPP_INCLUDED

// 헤더 선언

#endif
```

ES.32와 NL.9는 매크로에 대문자 이름을 써서 일반 상수·열거자와 구분하라고 권한다. ES.33은 이름 충돌을 줄이기 위해 충분히 긴 접두어를 붙이도록 한다. 매크로는 네임스페이스 범위 규칙을 따르지 않으므로, 대문자여도 짧고 흔한 이름은 충돌할 수 있다.

`#`로 문자열을 만들거나 `##`로 이름을 합치는 매크로도 컴파일러와 도구가 읽는 코드를 바꾼다. 꼭 필요한 생성 작업인지, 함수와 템플릿으로 표현할 수 있는지 확인한다. C식 `...` 역시 실제 인자를 읽지 않는 일부 오버로드·메타프로그래밍 기법에서는 사용될 수 있지만, 그것이 `va_arg`로 타입을 추측하는 인터페이스의 근거는 아니다.

## 검증한 내용

Linux의 GCC 14.2.0에서 C++20으로 실행 예제를 확인했다. 폴드 표현식과 `inline` 변수 때문에 C++17 이상이 필요하다.

```sh
g++ -std=c++20 -Wall -Wextra -Wpedantic -Wconversion -Werror macros.cpp -o macros
./macros
```

인자가 한 번 평가되는 결과와 빈 인자 목록을 확인했다. 출력 연산이 없는 타입을 전달한 변형은 컴파일에 실패했다. 위험한 매크로와 잘못된 `va_arg` 호출은 실행하지 않았다.

지역 변수에서 시작해 식과 제어 흐름까지 살펴봤다. 3부에서는 이 코드를 함수로 나누며 이름, 매개변수, 반환값에 호출 조건과 의도를 담는 방법을 다룬다.

<!-- series-source-and-navigation -->

관련 원문 항목은 **ES.30, ES.31, ES.32, ES.33, ES.34, F.55, NL.9**다. 아래 문서에서 권고의 이유와 예외를 확인할 수 있다.

<div class="source-card">
  <a href="https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#res-macros" target="_blank" rel="noopener">
    <svg class="card-outline" aria-hidden="true" focusable="false"><rect x="1" y="1" rx="7" pathLength="1"></rect></svg>
    <strong>매크로와 C식 가변 인자의 대안 찾기 관련 지침</strong>
    <small>C++ Core Guidelines · isocpp.github.io</small>
    <span role="img" aria-label="새 탭에서 열기">↗</span>
  </a>
</div>

[이전 글: 조기 반환과 break로 제어 흐름 정리하기](/posts/cpp-core-guidelines-18-early-return/) · [전체 목차](/posts/cpp-core-guidelines/)

다음 글은 **20편 함수 하나가 맡을 일과 이름 정하기**로 이어진다.
