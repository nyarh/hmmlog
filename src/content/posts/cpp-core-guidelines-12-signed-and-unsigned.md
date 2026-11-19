---
title: C++ Core Guidelines 12편 signed와 unsigned를 섞을 때 생기는 일
description: 부호 혼합 비교와 unsigned 순환을 이해하고 인덱스 경계를 확인하는 방법
date: 2026-11-19
category: 개발/C++/Core Guidelines
art: code
---

[전체 연재 목차](/posts/cpp-core-guidelines/) · 2부 변수와 표현식부터 안전하게

`unsigned` 인덱스에 음수를 넘겨도 자동으로 거부되지 않는다. 부호 없는 타입으로 변환되면서 큰 양수가 될 수 있다. ES.106은 음수를 금지하려는 목적만으로 `unsigned`를 선택하지 말라고 권한다.

수량의 차이를 구하면 결과가 음수일 수 있다. ES.100과 ES.102는 이런 일반 산술에 부호 있는 타입을 사용하고, 부호가 다른 타입을 섞는 연산은 피하도록 권한다.

## 비교 전에 값이 변할 수 있다

`-1 < 1u`의 결과는 거짓이다. `int`와 `unsigned int`를 비교하기 전에 -1이 큰 부호 없는 값으로 변환되기 때문이다. 코드에 보이는 두 수의 수학적 대소 관계와 결과가 달라진다.

혼합 연산의 타입은 정수 승격과 통상 산술 변환 규칙에 따라 정해진다. 타입의 순위와 표현 범위를 함께 따지므로, 더 큰 부호 있는 타입이 상대의 모든 값을 표현할 수 있으면 `unsigned`로 바뀌지 않는 경우도 있다. 사용하는 타입에 따라 의미가 달라지는 비교는 타입을 맞추거나 비교 도구로 의도를 드러내는 편이 읽기 쉽다.

아래 전체 프로그램은 C++20의 정수 비교 함수를 사용해 인덱스 범위를 확인한다. 역순 반복과 부호 없는 뺄셈의 결과도 함께 출력한다.

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

`std::cmp_less`는 지원하는 정수 타입 사이의 부호 차이를 고려해 대소를 비교한다. 인덱스가 음수가 아니고 컨테이너 크기보다 작은지 확인한 뒤에 필요한 인덱스 타입으로 변환한다. 이 검사 때문에 뒤의 캐스트와 접근이 안전하다.

## unsigned의 순환은 정의되어 있지만 목적과 다를 수 있다

부호 없는 연산은 타입의 값 범위를 기준으로 순환한다. `0u - 1u`가 `unsigned int`의 최댓값이 되는 것은 언어가 정한 동작이다. 다만 이 큰 값을 남은 개수나 인덱스로 사용하면 프로그램의 의도와 달라질 수 있다.

특히 `for (unsigned i = ...; i >= 0; --i)`는 조건이 항상 참이다. 0 다음에 음수로 내려가지 않기 때문이다. 빈 컨테이너의 `size() - 1`도 처음부터 큰 값이 될 수 있다. 예제는 남은 개수가 0보다 클 때만 하나를 빼서 이 경계를 분명하게 했다.

`unsigned char`처럼 작은 타입은 산술 전에 `int`로 승격될 수 있다. 중간 계산이 어느 타입에서 이루어지는지는 비트 수와 승격 규칙을 함께 확인해야 한다. 선언한 작은 부호 없는 타입에서만 계산이 순환한다고 가정해서는 안 된다.

## 인덱스가 꼭 필요한지도 확인한다

원소를 순서대로 읽기만 한다면 범위 `for`나 표준 알고리즘으로 인덱스를 없앨 수 있다. 역순 순회도 역방향 반복자나 범위 도구로 표현할 수 있다. 예제는 부호 있는 인덱스의 경계를 설명하려고 직접 반복문을 사용했다.

ES.107은 충분한 크기의 부호 있는 인덱스 타입인 `gsl::index`를 권한다. Guidelines Support Library가 제공하는 타입으로, 표준 라이브러리에는 속하지 않는다. 표준 컨테이너의 `size()`와 인덱스는 여전히 부호 없는 타입이므로 그 경계에서 변환을 살펴야 한다.

`std::ssize`는 컨테이너 크기를 부호 있는 타입으로 얻는 C++20 도구다. 예제의 작은 벡터 크기는 충분히 표현할 수 있다. 매우 큰 컨테이너라면 반환 타입에 크기가 들어가는지 따져야 하며, `ssize` 자체가 원소 접근의 범위를 검사하지는 않는다.

## 비트 연산에는 unsigned가 어울린다

ES.101은 비트 마스크처럼 비트 패턴을 다룰 때 부호 없는 타입을 권한다. [11편의 권한 조합](/posts/cpp-core-guidelines-11-enum-values/)이 그런 경우다. 의도한 모듈러 산술에서도 사용할 수 있다. 순환에 기대는 코드라면 그 목적을 주석이나 타입으로 드러낸다.

음수가 허용되지 않는 수량은 입력에서 검사하거나 유효한 범위만 생성할 수 있는 타입으로 표현한다. `unsigned`로의 변환 전에 이 조건을 확인해야 한다.

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
