---
title: C++ Core Guidelines 19편 매크로와 C식 가변 인자의 대안 찾기
description: 텍스트 치환과 타입 없는 가변 인자를 상수와 함수 및 템플릿으로 바꾸는 기준
date: 2026-11-19
category: 개발/C++/Core Guidelines
art: code
---

[전체 연재 목차](/posts/cpp-core-guidelines/) · 2부 변수와 표현식부터 안전하게

매크로로 함수를 흉내 내면 인자의 타입과 개수에 덜 얽매이는 것처럼 보인다. 대신 호출한 코드와 컴파일러가 실제로 처리하는 코드가 달라진다. ES.30~31은 프로그램 텍스트를 바꾸거나 상수와 함수를 대신하는 매크로를 피하라고 권한다.

이번 글은 타입 검사와 평가 규칙을 유지하는 대안을 살펴본다. C식 가변 인자에 대한 ES.34와 F.55도 같은 관점에서 읽을 수 있다.

## 괄호만 잘 쳐도 해결되지 않는 문제

다음은 위험을 설명하는 조각이며 실행 예제가 아니다.

```cpp
#define DEMO_SQUARE(x) ((x) * (x))

int value{3};
int result = DEMO_SQUARE(value++);
```

매크로 치환 뒤에는 `((value++) * (value++))`가 된다. 괄호로 우선순위를 보호했지만 인자를 두 번 평가하는 문제는 남는다. 이 두 변경은 서로 순서화되지 않으므로 C++20에서도 정의되지 않은 동작이다.

일반 함수에 `value++`를 한 번 전달하면 그 인자는 한 번 평가된다. 그렇다고 함수의 여러 인자가 항상 왼쪽부터 평가되는 것은 아니다. 여러 인자의 순서 문제는 [15편](/posts/cpp-core-guidelines-15-expressions-and-order/)의 기준을 함께 적용한다.

## 이름 있는 상수와 타입 있는 함수를 사용한다

다음은 완전한 실행 프로그램이다. 템플릿 부분은 C++17의 폴드 표현식으로 인자마다 출력 연산을 연결한다.

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

`square`는 전달된 정수 값을 사용한다. `value++`는 한 번 평가되어 원본은 4가 된다. 다만 `value * value`가 `int` 범위에 들어간다는 전제가 있으며, 매크로를 함수로 바꾼 것만으로 오버플로가 해결되지는 않는다. 이 예제에서는 3을 사용했다.

`retry_limit`는 타입과 네임스페이스를 가진 상수다. 헤더에 정의해 여러 번 포함할 상황을 고려한 C++17의 `inline` 변수 예시다. `inline`이 함수 호출을 반드시 없애거나 성능을 보장한다는 뜻은 아니다. 이 코드의 `constexpr` 함수도 암시적으로 `inline`이다.

## 가변 인자의 타입을 보존한다

C식 `...` 매개변수와 `va_arg`를 쓰는 함수는 전달된 값의 타입을 읽는 쪽이 맞혀야 한다. 기본 인자 승격으로 `float`가 `double`이 되는 등의 규칙도 알아야 한다. 잘못된 타입으로 꺼내거나 전달하지 않은 인자를 읽으면 정의되지 않은 동작으로 이어질 수 있다.

`printf` 같은 익숙한 함수에도 형식 문자열과 실제 인자 타입을 맞춰야 한다는 조건이 있다. 컴파일러의 형식 경고는 도움이 되지만 일반적인 사용자 정의 가변 함수의 모든 계약을 대신 검사해 주지는 않는다.

예제의 `Args...`는 C식 가변 인자와 다르다. 각 인자의 타입을 컴파일러가 알고 있으며 그 타입에 맞는 `operator<<`가 있는지 검사한다. 빈 인자 목록도 초기값인 `std::cout`으로 처리하고 줄바꿈만 출력한다. 출력할 수 없는 타입은 컴파일 오류다.

이 함수는 설명용 출력 도구다. 출력 실패 처리나 여러 스레드의 메시지 단위 출력까지 보장하는 로깅 라이브러리는 아니다. 폴드 표현식의 문법과 완전 전달은 템플릿을 다루는 9부에서 다시 살펴본다.

필요한 인자 모양이 몇 개뿐이면 오버로드가 더 단순할 수 있다. 같은 타입의 여러 값을 받는다면 `std::initializer_list<T>`나 범위, 정해진 여러 타입 중 하나라면 `std::variant`를 검토할 수 있다. F.55는 모든 문제를 가변 템플릿 하나로 풀라는 규칙이 아니다.

## 남겨야 하는 매크로는 알아볼 수 있게 한다

조건부 컴파일과 헤더 가드처럼 전처리 단계에서 처리해야 하는 용도까지 ES.30이 금지하는 것은 아니다. 다음은 헤더의 설명용 골격이다.

```cpp
#ifndef DEMO_WIDGET_HPP_INCLUDED
#define DEMO_WIDGET_HPP_INCLUDED

// 헤더 선언

#endif
```

ES.32와 NL.9는 매크로 이름에 대문자를 사용하고 일반 상수와 열거자는 구분하라고 권한다. ES.33은 충돌을 줄이도록 충분히 긴 접두어를 붙이라고 한다. 대문자만 사용해도 충돌이 사라지지는 않는다. 매크로는 네임스페이스 범위 규칙을 따르지 않으므로 짧고 흔한 이름을 피한다.

`#`로 문자열을 만들거나 `##`로 이름을 합치는 매크로도 컴파일러와 도구가 읽는 코드를 바꾼다. 꼭 필요한 생성 작업인지, 함수와 템플릿으로 표현할 수 있는지 확인한다. C식 `...` 역시 실제 인자를 읽지 않는 일부 오버로드·메타프로그래밍 기법에서는 사용될 수 있지만, 그것이 `va_arg`로 타입을 추측하는 인터페이스의 근거는 아니다.

## 검증한 내용

Linux의 GCC 14.2.0에서 C++20으로 실행 예제를 확인했다. 폴드 표현식과 `inline` 변수 때문에 C++17 이상이 필요하다.

```sh
g++ -std=c++20 -Wall -Wextra -Wpedantic -Wconversion -Werror macros.cpp -o macros
./macros
```

인자가 한 번 평가되는 결과와 빈 인자 목록을 확인했다. 출력 연산이 없는 타입을 전달한 변형은 컴파일에 실패했다. 위험한 매크로와 잘못된 `va_arg` 호출은 실행하지 않았다.

2부에서는 지역 변수 한 개에서 시작해 식과 제어 흐름을 읽기 쉽게 만드는 기준을 다뤘다. 다음 3부에서는 이 코드를 함수로 나눌 때 이름, 매개변수, 반환값에 어떤 약속을 담을지 살펴본다.

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
