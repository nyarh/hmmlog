---
title: C++ Core Guidelines 15편 복잡한 식과 평가 순서 풀어 읽기
description: 연산자 우선순위와 평가 순서를 구분하고 상태 변경을 읽기 쉽게 분리하는 방법
date: 2026-11-19
category: 개발/C++/Core Guidelines
art: code
---

[전체 연재 목차](/posts/cpp-core-guidelines/) · 2부 변수와 표현식부터 안전하게

한 줄에 계산과 증가, 함수 호출까지 모으면 코드가 짧아진다. 하지만 읽는 사람은 무엇이 먼저 실행되는지까지 머릿속에서 풀어야 한다. ES.40은 복잡한 식을 피하라고 권한다. 필요한 괄호를 쓰라는 ES.41과 평가 순서에 기대지 말라는 ES.43~44도 같은 문제를 서로 다른 방향에서 다룬다.

## 괄호가 정하는 것과 정하지 않는 것

연산자 우선순위는 식을 어떻게 묶어 해석하는지 정한다. `a + b * c`는 `a + (b * c)`로 묶인다. 이것만으로 `a`, `b`, `c`에 해당하는 복잡한 계산들이 모두 어떤 시간 순서로 평가되는지 정해지는 것은 아니다.

비트 연산과 비교를 섞을 때는 괄호가 특히 도움이 된다. 다음은 설명용 조각이다.

```cpp
if ((flags & ready_mask) != 0u) {
    // 준비 비트가 켜져 있다.
}
```

괄호 없이 `flags & ready_mask != 0u`라고 쓰면 비교가 먼저 묶여 `flags & (ready_mask != 0u)`가 된다. 의도한 비트 마스크 검사가 아니다. 반면 단순한 곱셈과 덧셈마다 괄호를 겹겹이 씌우면 오히려 읽기 어려워진다. 혼동할 만한 경계를 드러내는 데 사용한다.

## 인자 두 개를 왼쪽부터 계산한다고 가정하지 않는다

다음은 실행 결과에 의존하면 안 되는 설명용 조각이다. `record`는 두 정수를 받는 함수라고 가정한다.

```cpp
int sequence{1};
record(sequence++, sequence++);
```

C++17 이후에는 두 인자의 평가가 서로 뒤섞이지 않도록 순서가 정해지지만, 어느 인자가 먼저 평가될지는 지정되지 않는다. C++20에서 이 표현은 그 이유만으로 정의되지 않은 동작은 아니지만, `record`에 1과 2가 어느 순서로 전달될지 기대해서는 안 된다. C++14와 그 이전에는 두 변경이 서로 순서화되지 않아 정의되지 않은 동작이다.

다음 식은 또 다르다.

```cpp
// 설명용: 실행하면 안 되는 예다.
int sequence{1};
int total = sequence++ + sequence++;
```

`+`의 피연산자 사이에는 이 두 변경을 안전하게 순서화하는 보장이 없으므로 C++20에서도 정의되지 않은 동작이다. 함수 인자 규칙의 개선을 모든 연산자에 적용하면 안 된다. 괄호를 추가해도 이 문제는 해결되지 않는다.

## 순서가 의미라면 문장으로 드러낸다

다음은 순서를 분명하게 만든 완전한 실행 프로그램이다.

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

각 문장이 끝난 뒤 다음 문장을 수행하므로 두 증가의 순서가 분명하다. 함수 호출 시점에는 이미 완성된 두 값을 읽기만 한다. 이름은 줄 수를 늘리지만 값의 역할과 실행 순서를 남긴다.

그렇다고 모든 덧셈마다 임시 변수를 만들 필요는 없다. 여러 상태를 바꾸거나, 같은 대상을 별칭으로 수정하거나, 복잡한 우선순위에 기대는 지점부터 나누면 된다. 순수한 짧은 계산은 한 식으로 두는 편이 자연스럽다.

## 숫자에는 필요한 의미만 붙인다

ES.45는 이유를 알기 어려운 숫자를 이름 있는 상수로 바꾸라고 권한다. `60`은 시간 변환일 수도 있고 최대 요청 수일 수도 있다. `seconds_per_minute`라는 이름이 있으면 계산의 단위를 읽을 수 있다.

반대로 모든 0과 1에 긴 이름을 붙일 필요는 없다. 반복 시작값 0이나 한 칸 이동을 뜻하는 1처럼 문맥에서 뜻이 분명한 값은 그대로 읽기 쉽다. 이름을 붙일 기준은 숫자의 희귀함보다 의미가 숨겨져 있는지다.

상수 이름을 붙여도 `minutes * seconds_per_minute`의 오버플로가 사라지지는 않는다. 예제의 3분은 범위 안이지만 입력을 받는 계산으로 바꾸면 [13편](/posts/cpp-core-guidelines-13-integer-arithmetic/)처럼 허용 범위를 확인해야 한다.

## 확인 결과를 해석하는 범위

Linux의 GCC 14.2.0에서 C++20으로 실행 프로그램의 출력과 준비 비트가 없는 경우를 확인했다.

```sh
g++ -std=c++20 -Wall -Wextra -Wpedantic -Wconversion -Werror expressions.cpp -o expressions
./expressions
```

정의되지 않은 동작의 조각은 실행하지 않았다. 순서가 지정되지 않은 호출도 특정 출력이 나온다는 테스트로 정당화하지 않았다. 컴파일러 하나에서 관찰한 순서는 언어의 보장이 아니기 때문이다.

리뷰에서는 한 식이 같은 값을 두 번 변경하는지, 함수 인자의 평가 순서를 가정하는지, 비트 연산과 비교가 섞이는지 찾아보면 된다. 경고와 정적 분석은 이런 패턴 일부를 찾지만, 결과가 어느 순서여야 하는지는 프로그램의 의도를 읽어야 한다.

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
