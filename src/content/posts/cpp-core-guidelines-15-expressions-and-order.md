---
title: C++ Core Guidelines 15편 복잡한 식과 평가 순서 풀어 읽기
description: 연산자 우선순위와 평가 순서를 구분하고 상태 변경을 읽기 쉽게 분리하는 방법
date: 2026-11-19
category: 개발/C++/Core Guidelines
art: code
---

[전체 연재 목차](/posts/cpp-core-guidelines/) · 2부 변수와 표현식부터 안전하게

계산하면서 값을 증가시키고 함수까지 호출하는 식은 실행 순서를 따라 읽기 어렵다. ES.40은 이런 복잡한 식을 피하도록 권한다. ES.41은 혼동하기 쉬운 우선순위에 괄호를 쓰고, ES.43~44는 보장되지 않은 평가 순서에 기대지 말라고 설명한다.

## 괄호가 정하는 것과 정하지 않는 것

우선순위는 식을 묶는 방법을 정한다. `a + b * c`를 `a + (b * c)`로 해석하는 규칙이다. `a`, `b`, `c`가 복잡한 계산이라면 각각을 언제 평가하는지까지 이 묶음만으로 알 수는 없다.

비트 연산과 비교를 섞을 때는 괄호가 특히 도움이 된다. 다음은 설명용 조각이다.

```cpp
if ((flags & ready_mask) != 0u) {
    // 준비 비트가 켜져 있다.
}
```

`flags & ready_mask != 0u`는 비교가 먼저 묶여 `flags & (ready_mask != 0u)`가 된다. 준비 비트를 확인하려던 계산과 달라진다. 이런 혼동을 막는 곳에 괄호를 쓰되, 단순한 곱셈과 덧셈까지 겹겹이 둘러싸 읽기 어렵게 만들 필요는 없다.

## 인자 두 개를 왼쪽부터 계산한다고 가정하지 않는다

다음은 실행 결과에 의존하면 안 되는 설명용 조각이다. `record`는 두 정수를 받는 함수라고 가정한다.

```cpp
int sequence{1};
record(sequence++, sequence++);
```

C++17 이후에는 한 인자의 평가가 끝난 다음 다른 인자를 평가하지만, 어느 쪽이 먼저인지는 정하지 않는다. 따라서 C++20에서 이 표현은 그 이유만으로 정의되지 않은 동작은 아니어도, `record`에 1과 2가 전달되는 순서에 의존하면 안 된다. C++14와 그 이전에는 두 변경이 순서화되지 않으므로 정의되지 않은 동작이다.

다음 식은 또 다르다.

```cpp
// 설명용: 실행하면 안 되는 예다.
int sequence{1};
int total = sequence++ + sequence++;
```

`+`의 두 피연산자 사이에는 이 변경들을 순서화하는 보장이 없다. 이 식은 C++20에서도 정의되지 않은 동작이며 괄호를 붙여도 달라지지 않는다. 함수 인자에 적용되는 평가 규칙을 모든 연산자로 넓혀 해석해서는 안 된다.

## 순서가 의미라면 문장으로 드러낸다

증가 연산을 각각의 문장으로 나누고, 두 값을 준비한 뒤 호출하는 전체 프로그램이다.

```cpp
#include <iostream>

void record(int first, int second)
{
    std::cout << "record=" << first << ',' << second << '\n';
}

int main()
{
    int sequence{1};
    const int first{sequence++};
    const int second{sequence++};
    record(first, second);

    constexpr unsigned ready_mask{1u << 2};
    const unsigned flags{ready_mask | 1u};
    const bool ready{(flags & ready_mask) != 0u};

    constexpr int seconds_per_minute{60};
    const int minutes{3};
    const int seconds{minutes * seconds_per_minute};
    std::cout << "next=" << sequence << '\n';
    std::cout << std::boolalpha << "ready=" << ready << '\n';
    std::cout << "seconds=" << seconds << '\n';
}
```

```text
record=1,2
next=3
ready=true
seconds=180
```

각 문장이 끝난 뒤 다음 문장을 수행하므로 두 증가의 순서가 정해진다. 함수 호출은 이미 만들어진 두 값을 읽기만 한다. 중간 값의 이름을 통해 역할도 확인할 수 있다.

여러 상태를 바꾸는 식, 같은 대상을 별칭으로 수정하는 식, 복잡한 우선순위에 의존하는 식부터 나누면 된다. 순수한 짧은 계산은 한 식으로 두어도 읽기 쉽다.

## 숫자에는 필요한 의미만 붙인다

ES.45는 이유를 알기 어려운 숫자를 이름 있는 상수로 바꾸라고 권한다. `60`은 시간 변환일 수도 있고 최대 요청 수일 수도 있다. `seconds_per_minute`라는 이름이 있으면 계산의 단위를 읽을 수 있다.

반복의 시작값 0이나 한 칸 이동을 뜻하는 1은 문맥에서 의미가 드러난다. 이런 값은 그대로 두어도 읽기 쉽다. 숫자만 보아서는 뜻을 알기 어려운 곳에 이름을 붙인다.

`minutes * seconds_per_minute`에 필요한 산술 범위 검사는 별도로 남는다. 예제의 3분은 범위 안에 있지만, 입력을 받아 계산하도록 바꾸면 [13편](/posts/cpp-core-guidelines-13-integer-arithmetic/)처럼 허용 범위를 확인해야 한다.

## 확인 결과를 해석하는 범위

Linux의 GCC 14.2.0에서 C++20으로 실행 프로그램의 출력과 준비 비트가 없는 경우를 확인했다.

```sh
g++ -std=c++20 -Wall -Wextra -Wpedantic -Wconversion -Werror expressions.cpp -o expressions
./expressions
```

정의되지 않은 동작을 설명한 조각은 실행하지 않았다. 평가 순서가 지정되지 않은 호출도 특정 출력이 맞는지 검사하지 않았다. 한 컴파일러에서 관찰한 순서로 언어가 보장하는 동작을 판단할 수 없기 때문이다.

한 식에서 같은 값을 두 번 바꾸는지, 인자 평가 순서를 가정하는지, 비트 연산과 비교의 묶음이 맞는지 확인한다. 경고와 정적 분석으로 일부 패턴을 찾을 수 있다. 어떤 순서여야 올바른지는 그 코드가 하려는 일을 보고 판단해야 한다.

<!-- series-source-and-navigation -->

관련 원문 항목은 **ES.40, ES.41, ES.43, ES.44, ES.45**다. 아래 문서에서 권고의 이유와 예외를 확인할 수 있다.

<div class="source-card">
  <a href="https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#res-complicated" target="_blank" rel="noopener">
    <svg class="card-outline" aria-hidden="true" focusable="false"><rect x="1" y="1" rx="7" pathLength="1"></rect></svg>
    <strong>복잡한 식과 평가 순서 풀어 읽기 관련 지침</strong>
    <small>C++ Core Guidelines · isocpp.github.io</small>
    <span role="img" aria-label="새 탭에서 열기">↗</span>
  </a>
</div>

[이전 글: 타입 변환이 필요한 곳과 위험해지는 곳](/posts/cpp-core-guidelines-14-conversions/) · [전체 목차](/posts/cpp-core-guidelines/) · [다음 글: if와 switch로 분기 의도 드러내기](/posts/cpp-core-guidelines-16-branches/)
