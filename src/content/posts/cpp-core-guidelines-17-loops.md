---
title: C++ Core Guidelines 17편 범위 for와 반복 조건 선택하기
description: 원소 순회와 횟수 반복 및 입력 반복에 맞는 루프를 고르고 종료 조건을 확인하는 방법
date: 2026-11-19
category: 개발/C++/Core Guidelines
art: code
---

[전체 연재 목차](/posts/cpp-core-guidelines/) · 2부 변수와 표현식부터 안전하게

반복문을 읽을 때는 무엇이 달라지고 언제 끝나는지 찾게 된다. 원소를 하나씩 보는 반복, 정해진 횟수의 반복, 입력이 성공하는 동안의 반복은 그 기준이 다르다. ES.71~75는 기준이 코드의 앞부분에 잘 보이는 문법을 고르라고 권한다.

## 반복의 기준을 세 가지로 나눠 본다

다음은 세 반복을 비교하는 완전한 프로그램이다. 입력 파일 대신 문자열 스트림을 사용하므로 같은 입력을 쉽게 재현할 수 있다.

```cpp
#include <iostream>
#include <sstream>
#include <string>
#include <vector>

int main()
{
    const std::vector<std::string> names{"pen", "paper"};
    for (const auto& name : names) {
        std::cout << "item=" << name << '\n';
    }

    constexpr int attempt_limit{2};
    for (int attempt{0}; attempt < attempt_limit; ++attempt) {
        std::cout << "attempt=" << attempt + 1 << '\n';
    }

    std::istringstream input{"10 20 x"};
    int value{};
    while (input >> value) {
        std::cout << "value=" << value << '\n';
    }
    if (!input.eof()) {
        std::cout << "invalid token\n";
    }
}
```

```text
item=pen
item=paper
attempt=1
attempt=2
value=10
value=20
invalid token
```

원소를 모두 읽는 첫 반복에는 범위 `for`가 맞는다. 인덱스와 마지막 위치를 직접 관리하지 않는다. 두 번째 반복에는 횟수를 제어하는 변수가 있으므로 초기값·종료 조건·증감을 한곳에 적는 `for`가 읽기 쉽다. ES.74처럼 변수도 초기화 부분에서 선언해 반복 밖으로 노출하지 않는다.

세 번째 반복은 입력 성공 여부가 기준이다. 별도의 횟수 변수를 꾸며 넣지 않고 `while` 조건에 읽기 연산을 둔다. `while (!input.eof())`처럼 읽기 전에 EOF만 확인하면 마지막 실패 뒤에도 오래된 값을 처리할 수 있다.

## 원소를 복사할지 참조할지 고른다

범위 `for`를 쓴다고 복사 비용까지 사라지는 것은 아니다. `for (auto name : names)`는 매번 문자열을 복사한다. 읽기만 하려면 `const auto&`, 원소 자체를 고치려면 `auto&`가 의도를 더 잘 드러낸다.

작은 정수처럼 값 복사가 자연스러운 타입은 `for (const int value : values)`로 받으면 된다. 무조건 참조를 붙이는 규칙은 아니다. 수정하려고 복사본만 바꾸는 실수와 필요 없는 큰 복사를 구분해 살펴본다.

순회 도중 컨테이너 구조를 바꾸는 것도 주의한다. 벡터에 `push_back`을 하면 재할당으로 반복자와 참조가 무효화될 수 있고, 재할당이 없어도 끝 반복자가 바뀐다. 범위 `for`는 반복에 필요한 끝 위치를 보관하므로 원소 추가를 안전하게 처리해 주지 않는다. 별도 결과 컨테이너를 만들거나 무효화 규칙에 맞는 다른 방식을 선택한다.

## 카운터를 두 군데에서 움직이지 않는다

ES.86은 `for`의 증감식과 본문에서 같은 제어 변수를 각각 바꾸지 말라고 권한다. 다음은 문제를 보여주는 설명용 조각이다.

```cpp
for (int i{0}; i < limit; ++i) {
    if (skip_next) {
        ++i;
    }
    // 다음 반복에서 어느 원소를 읽을지 추적하기 어려워진다.
}
```

일부 항목을 건너뛴다면 그 조건과 이동량이 한곳에 드러나게 구조를 바꾼다. 탐색이 끝났다면 카운터를 상한으로 덮어써서 탈출하기보다 `break`나 탐색 함수를 쓰는 편이 뜻을 전달하기 쉽다. 복잡한 반복에서는 알고리즘으로 표현할 수 있는지도 살펴본다.

## 처음 한 번의 실행도 요구 사항이다

`do` 반복은 조건을 마지막에 확인하므로 본문을 최소 한 번 실행한다. 빈 목록에서는 아무 일도 하지 않아야 하는 코드에 적용하면 첫 실행부터 잘못될 수 있다. ES.75는 이 종료 조건이 눈에 덜 띄는 점도 이유로 든다.

반드시 한 번 수행한 결과로 다음 반복을 결정하는 경우에는 `do`가 의도를 잘 표현할 수 있다. 그럴 때도 첫 실행의 입력이 유효한지, 조건 평가에 필요한 값이 모든 경로에서 준비되는지 확인한다.

## 입력 실패의 종류까지 자동으로 구분되지는 않는다

예제의 `!input.eof()` 검사는 고정한 입력에서 마지막 `x`를 보여주기 위한 것이다. 모든 숫자 파싱 오류를 분류하는 완전한 파서는 아니다. 예를 들어 범위를 벗어난 큰 숫자를 읽다가 실패하면서 EOF에도 도달하면 오류 상태와 EOF가 함께 켜질 수 있다. EOF를 곧 정상 입력 완료로 해석해서는 안 된다.

정확한 오류 구분이 필요하면 먼저 토큰이나 한 줄을 읽고, 그 전체가 유효한 숫자인지 검사하는 단계를 분리한다. [8편](/posts/cpp-core-guidelines-08-constexpr/)의 한 줄 입력 검사처럼 입력 계약에 맞춰 구조를 정한다.

Linux의 GCC 14.2.0에서 C++20으로 예제를 확인했다. 범위 `for`와 이 예제의 핵심 반복 문법은 C++11에서도 사용할 수 있다. 빈 목록·원소 하나·반복 횟수 0·정상 입력 종료·빈 입력·잘못된 토큰을 각각 확인했다.

```sh
g++ -std=c++20 -Wall -Wextra -Wpedantic -Wconversion -Werror loops.cpp -o loops
./loops
```

<!-- series-source-and-navigation -->

관련 원문 항목은 **ES.71, ES.72, ES.73, ES.74, ES.75, ES.86**다. 아래 문서에서 권고의 이유와 예외를 확인할 수 있다.

<div class="source-card">
  <a href="https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#res-for-range" target="_blank" rel="noopener">
    <svg class="card-outline" aria-hidden="true" focusable="false"><rect x="1" y="1" rx="7" pathLength="1"></rect></svg>
    <strong>범위 for와 반복 조건 선택하기 관련 지침</strong>
    <small>C++ Core Guidelines · isocpp.github.io</small>
    <span role="img" aria-label="새 탭에서 열기">↗</span>
  </a>
</div>

[이전 글: if와 switch로 분기 의도 드러내기](/posts/cpp-core-guidelines-16-branches/) · [전체 목차](/posts/cpp-core-guidelines/) · [다음 글: 조기 반환과 break로 제어 흐름 정리하기](/posts/cpp-core-guidelines-18-early-return/)
