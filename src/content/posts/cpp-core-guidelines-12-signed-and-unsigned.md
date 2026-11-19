---
title: C++ Core Guidelines 12편 signed와 unsigned를 섞을 때 생기는 일
description: 부호 혼합 비교와 unsigned 순환을 이해하고 인덱스 경계를 확인하는 방법
date: 2026-11-19
category: 개발/C++/Core Guidelines
art: code
---

[전체 연재 목차](/posts/cpp-core-guidelines/) · 2부 변수와 표현식부터 안전하게

인덱스는 음수가 아니니 `unsigned`로 두면 안전할 것 같다. 하지만 음수를 전달해도 자동으로 거부되는 것은 아니다. 부호 없는 타입으로 변환되어 큰 양수가 될 수 있다. ES.106은 음수를 막겠다는 이유만으로 `unsigned`를 선택하지 말라고 권한다.

ES.100과 ES.102는 일반적인 산술에서 부호 있는 타입을 사용하고 부호 있는 값과 없는 값을 섞지 않도록 한다. 뺄셈 결과가 음수일 수 있다는 평소의 기대를 코드에서도 유지하기 위해서다.

## 비교 전에 값이 변할 수 있다

`-1 < 1u`는 거짓이다. 여기서는 `int`와 `unsigned int`를 비교하므로 -1이 부호 없는 값으로 변환된다. 수학에서 생각한 두 정수를 그대로 비교하지 않는다.

모든 혼합 연산이 무조건 `unsigned`로 바뀌는 것은 아니다. 정수 승격과 통상 산술 변환 규칙에 따라 타입의 순위와 표현 범위를 함께 따진다. 더 큰 부호 있는 타입이 상대의 모든 값을 표현할 수 있는 경우에는 결과가 다르다. ‘이번에는 우연히 잘 된다’는 조합에 기대기보다 타입을 맞추거나 비교 도구를 쓰는 편이 명확하다.

다음은 C++20의 정수 비교 함수와 범위 검사를 사용하는 완전한 예제다.

```cpp
#include <cstddef>
#include <initializer_list>
#include <iostream>
#include <iterator>
#include <limits>
#include <utility>
#include <vector>

void print_at(const std::vector<int>& values, int index)
{
    if (index < 0 || !std::cmp_less(index, values.size())) {
        std::cout << index << ":invalid\n";
        return;
    }
    std::cout << index << ':'
              << values[static_cast<std::size_t>(index)] << '\n';
}

int main()
{
    const std::vector<int> values{10, 20, 30};
    for (const int index : {-1, 0, 2, 3}) {
        print_at(values, index);
    }

    std::cout << std::boolalpha
              << "safe comparison=" << std::cmp_less(-1, 1u) << '\n';
    const unsigned int wrapped{0u - 1u};
    std::cout << "wrapped to max="
              << (wrapped == std::numeric_limits<unsigned int>::max())
              << '\n';

    std::cout << "reverse:";
    for (auto remaining = std::ssize(values); remaining > 0; --remaining) {
        std::cout << ' '
                  << values[static_cast<std::size_t>(remaining - 1)];
    }
    std::cout << '\n';
}
```

```text
-1:invalid
0:10
2:30
3:invalid
safe comparison=true
wrapped to max=true
reverse: 30 20 10
```

`std::cmp_less`는 지원하는 정수 타입 사이에서 부호 차이 때문에 비교 의미가 바뀌는 일을 피한다. 음수인지와 크기보다 작은지를 확인한 뒤, 컨테이너가 요구하는 인덱스 타입으로 변환했다. 이 캐스트의 안전성은 앞의 검사에서 나온다.

## unsigned의 순환은 정의되어 있지만 목적과 다를 수 있다

부호 없는 연산은 해당 타입의 값 범위를 기준으로 순환한다. 예제의 `0u - 1u`는 `unsigned int`의 최댓값이다. 동작이 언어에 정의되어 있다는 것과 프로그램에서 올바른 결과라는 것은 다르다.

특히 `for (unsigned i = ...; i >= 0; --i)`는 조건이 항상 참이다. 0 다음에 음수로 내려가지 않기 때문이다. 빈 컨테이너의 `size() - 1`도 처음부터 큰 값이 될 수 있다. 예제는 남은 개수가 0보다 클 때만 하나를 빼서 이 경계를 분명하게 했다.

`unsigned char`처럼 작은 타입은 산술 전에 `int`로 승격될 수도 있다. 작은 부호 없는 타입으로 선언했다고 모든 중간 계산까지 그 타입에서 순환하는 것은 아니다. 비트 수와 승격 규칙도 함께 봐야 한다.

## 인덱스가 꼭 필요한지도 확인한다

원소를 순서대로 읽기만 한다면 범위 `for`나 표준 알고리즘으로 인덱스를 없앨 수 있다. 역순 순회도 역방향 반복자나 범위 도구로 표현할 수 있다. 예제는 부호 있는 인덱스의 경계를 설명하려고 직접 반복문을 사용했다.

ES.107은 인덱스에 충분한 크기의 부호 있는 타입인 `gsl::index`를 권한다. 이는 표준 라이브러리 타입이 아니라 Guidelines Support Library의 타입이다. 표준 컨테이너의 `size()`와 인덱스 타입이 부호 없는 타입이라는 현실까지 사라지지는 않는다.

예제의 `std::ssize`는 크기를 부호 있는 타입으로 얻는 C++20 도구다. 이 예제의 작은 벡터에서는 충분하다. 극단적으로 큰 컨테이너의 크기가 반환 타입에 표현 가능한지는 별도 조건이며, `ssize`가 원소 접근의 범위를 검사해 주는 것도 아니다.

## 비트 연산에는 unsigned가 어울린다

ES.101은 비트 마스크처럼 비트 패턴을 다룰 때 부호 없는 타입을 권한다. [11편의 권한 조합](/posts/cpp-core-guidelines-11-enum-values/)이 그런 경우다. 의도한 모듈러 산술에서도 사용할 수 있다. 순환에 기대는 코드라면 그 목적을 주석이나 타입으로 드러낸다.

일반 수량의 입력에서 음수를 금지하고 싶다면 입력을 검증하거나 유효한 범위만 만드는 타입을 설계한다. `unsigned`로 바꾸는 작업은 그 검증의 대체재가 아니다.

Linux의 GCC 14.2.0에서 다음 명령으로 실행 예제를 확인했다. 빈 벡터와 원소 하나인 벡터도 검사해 역순 반복이 범위를 벗어나지 않는 것을 확인했다.

```sh
g++ -std=c++20 -Wall -Wextra -Wpedantic -Wconversion -Werror signed_example.cpp -o signed_example
./signed_example
```

<!-- series-source-and-navigation -->

관련 원문 항목은 **ES.100, ES.101, ES.102, ES.106, ES.107**다. 아래 문서에서 권고의 이유와 예외를 확인할 수 있다.

<div class="source-card">
  <a href="https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#res-mix" target="_blank" rel="noopener">
    <svg class="card-outline" aria-hidden="true" focusable="false"><rect x="1" y="1" rx="7" pathLength="1"></rect></svg>
    <strong>signed와 unsigned를 섞을 때 생기는 일 관련 지침</strong>
    <small>C++ Core Guidelines · isocpp.github.io</small>
    <span role="img" aria-label="새 탭에서 열기">↗</span>
  </a>
</div>

[이전 글: 열거형의 연산과 값, 기반 타입 정하기](/posts/cpp-core-guidelines-11-enum-values/) · [전체 목차](/posts/cpp-core-guidelines/) · [다음 글: 정수의 범위와 산술 오류 다루기](/posts/cpp-core-guidelines-13-integer-arithmetic/)
