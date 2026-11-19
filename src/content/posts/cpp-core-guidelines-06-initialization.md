---
title: C++ Core Guidelines 6편 초기화와 대입, 중괄호와 소괄호의 차이
description: 미초기화 값을 피하고 중괄호 초기화와 생성자 선택의 차이를 확인하는 방법
date: 2026-11-19
category: 개발/C++/Core Guidelines
art: code
---

[전체 연재 목차](/posts/cpp-core-guidelines/) · 2부 변수와 표현식부터 안전하게

`int count;`를 선언하고 나중에 값을 넣는 코드는, 중간에 조건문을 추가하다가 대입을 빠뜨릴 수 있다. ES.20은 객체를 만들 때 초기화해 이런 경로를 줄이라고 권한다. 초기화는 객체를 처음 만드는 일이고 대입은 이미 만든 객체의 값을 바꾸는 일이다.

`int count = 3;`는 선언과 함께 첫 값을 주므로 초기화다. 이후의 `count = 4;`는 대입이다. 둘 다 `=`를 쓰지만 객체를 만드는 시점인지에 따라 역할이 다르다.

## 선언 하나에 이름 하나를 둔다

다음은 문법 차이를 보여주는 조각이다.

```cpp
int* first, second;  // first만 포인터이고 second는 int다.
int* position{nullptr};
int count{0};
```

ES.10과 NL.21은 선언마다 이름을 하나씩 쓰도록 권한다. `*`가 모든 이름에 적용된다고 착각하는 일을 줄이고, 각 값에 맞는 초기화와 설명을 붙일 수 있다. 함수 매개변수 목록과 C++17의 구조적 바인딩처럼 여러 이름을 함께 소개하도록 설계된 문법은 예외다.

자동 지역 정수 `int count;`에는 0이 보장되지 않는다. C++20에서 값을 넣기 전에 읽으면 정의되지 않은 동작으로 이어진다. 반면 `std::string name;`은 기본 생성자가 빈 문자열을 만든다. 초기값을 직접 적었는지와 함께, 해당 타입의 생성 방식이 유효한 초기 상태를 만드는지 살펴야 한다.

## 중괄호가 막는 오류와 바꾸는 의미

ES.23은 `{}` 초기화를 우선 권한다. 정수에 소수를 넣는 축소 변환을 막고, `Widget item();`처럼 객체를 만들려다가 함수를 선언하는 문법적 혼동도 피할 수 있다.

컨테이너는 괄호를 바꾸면 만드는 원소도 달라질 수 있다. 아래 전체 프로그램을 실행하면 두 생성 방식의 차이를 확인할 수 있다.

```cpp
#include <iostream>
#include <vector>

int main()
{
    const std::vector<int> repeated(3, 7);
    const std::vector<int> listed{3, 7};
    const int retry_limit = [] {
        constexpr bool offline{true};
        if (offline) {
            return 1;
        }
        return 3;
    }();

    std::cout << "repeated:";
    for (const int value : repeated) {
        std::cout << ' ' << value;
    }
    std::cout << "\nlisted:";
    for (const int value : listed) {
        std::cout << ' ' << value;
    }
    std::cout << "\nretry_limit=" << retry_limit << '\n';
}
```

```text
repeated: 7 7 7
listed: 3 7
retry_limit=1
```

`vector<int>(3, 7)`은 값이 7인 원소 세 개를 만든다. `vector<int>{3, 7}`은 3과 7이라는 원소 두 개를 만든다. 중괄호가 원소 목록을 받는 생성자를 선택하기 때문이다. 크기로 만들고 싶은지, 실제 원소를 나열하는지 구분해야 한다. 이 차이는 ES.64의 `T{e}` 생성 표기 권고에도 함께 나오는 예외다.

`int total{a + b};`에서는 `a + b`를 계산한 뒤 초기화한다. 덧셈이 이미 오버플로했다면 중괄호로 막을 수 없다. 산술 연산의 범위는 축소 변환과 따로 검사해야 한다.

## 여러 단계로 정해도 처음부터 const로 만든다

예제의 `[] { ... }()`는 람다를 정의한 뒤 즉시 호출하는 표현식이다. 뒤의 `()`가 호출이고, 람다에서 반환한 값이 `retry_limit`의 초기값이 된다. ES.28은 이런 방식으로 초기화에 필요한 조건과 임시 변수를 한곳에 모으라고 권한다.

람다에서 값을 완성해 반환하면 처음부터 `const` 객체로 받을 수 있다. 외부 값이 필요하면 해당 이름만 캡처하고, 여러 곳에서 쓰는 계산은 이름 있는 함수로 옮긴다. 예제의 `offline`은 분기를 보여주기 위해 고정한 값이다.

## 초기화 표기를 고르는 기준

| 표현 | 의미와 주의할 점 |
| --- | --- |
| `int n{};` | 정수를 0으로 초기화 |
| `int n{3};` | 정해진 타입으로 초기화하며 축소 변환 제한 |
| `auto n = 3;` | 초기값에서 `int` 추론 |
| `T value{};` | 객체 생성이며 함수 선언과 구분 가능 |
| `T value = {};` | 복사 목록 초기화로 `explicit` 생성자 선택 시 오류 가능 |
| `std::vector<int> v(3);` | 값이 0인 원소 세 개 생성 |
| `std::vector<int> v{3};` | 값이 3인 원소 한 개 생성 |

날짜 타입이 2월 30일을 거부하는지는 생성자 구현에 달려 있다. `T{e}` 표기만으로 업무상 유효한 값까지 보장되지는 않는다. 값의 의미를 정한 뒤 그 의도에 맞는 생성 방식과 표기를 고른다.

곧바로 입력으로 덮어쓸 큰 버퍼는 초기화를 생략할 수 있다는 예외도 원문에 나온다. 이때는 입력이 일부만 들어와도 나머지 영역을 읽지 않는다는 점을 확인해야 한다. 초기화 비용이 문제인지 확인하지 않았다면 유효한 상태로 만들어 두는 편이 관리하기 쉽다.

## 컴파일러가 거부하는 경우도 확인한다

아래 블록은 의도적으로 컴파일에 실패하는 완전한 프로그램이다.

```cpp
int main()
{
    const int count{2.5};
    return count;
}
```

실행 예제를 `initialization.cpp`로 저장하고 Linux의 GCC 14.2.0에서 C++20으로 확인했다. 두 벡터의 원소와 람다의 양쪽 분기 결과가 예상과 일치했다. 축소 변환 예제는 컴파일 오류를 냈다. 목록 초기화와 람다는 C++11부터 사용할 수 있다.

```sh
g++ -std=c++20 -Wall -Wextra -Wpedantic -Wconversion -Werror initialization.cpp -o initialization
./initialization
```

<!-- series-source-and-navigation -->

관련 원문 항목은 **ES.10, ES.20, ES.23, ES.28, ES.64, NL.21**다. 아래 문서에서 권고의 이유와 예외를 확인할 수 있다.

<div class="source-card">
  <a href="https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#res-always" target="_blank" rel="noopener">
    <svg class="card-outline" aria-hidden="true" focusable="false"><rect x="1" y="1" rx="7" pathLength="1"></rect></svg>
    <strong>초기화와 대입, 중괄호와 소괄호의 차이 관련 지침</strong>
    <small>C++ Core Guidelines · isocpp.github.io</small>
    <span role="img" aria-label="새 탭에서 열기">↗</span>
  </a>
</div>

[이전 글: 변수가 필요한 곳과 살아 있는 범위](/posts/cpp-core-guidelines-05-scope-and-lifetime/) · [전체 목차](/posts/cpp-core-guidelines/) · [다음 글: const로 변경 가능한 범위를 줄이기](/posts/cpp-core-guidelines-07-const/)
