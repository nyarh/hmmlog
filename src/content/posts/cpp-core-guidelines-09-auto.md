---
title: C++ Core Guidelines 9편 auto를 쓰면 무엇이 추론되고 무엇이 달라질까
description: auto의 값과 참조 추론을 구분하고 복사와 타입 변환 의도를 드러내는 방법
date: 2026-11-19
category: 개발/C++/Core Guidelines
art: code
---

[전체 연재 목차](/posts/cpp-core-guidelines/) · 2부 변수와 표현식부터 안전하게

길게 중첩된 컨테이너 타입을 반복해서 적으면 읽기 번거롭고 오타가 나기도 쉽다. ES.11은 이런 중복에 `auto`를 사용하라고 권한다. 다만 `auto`가 초기값의 모든 성질을 그대로 옮기는 것은 아니다. 선언에 참조를 붙이는지에 따라 복사 여부도 달라진다.

## 값을 받는 선언과 참조를 받는 선언

정수와 문자열을 각각 값과 참조로 받아 비교해 보자. 아래 프로그램은 C++17부터 제공되는 `std::is_same_v`로 추론한 타입을 검사하고, 원본과 복사본의 변화를 출력한다.

```cpp
#include <iostream>
#include <string>
#include <type_traits>

int main()
{
    const int limit{3};
    auto copied_limit = limit;
    const auto& limit_view = limit;

    static_assert(std::is_same_v<decltype(copied_limit), int>);
    static_assert(std::is_same_v<decltype(limit_view), const int&>);

    std::string name{"pen"};
    auto copied_name = name;
    auto& shared_name = name;
    copied_name += " copy";
    shared_name += " edited";
    ++copied_limit;

    const auto text = "note";
    static_assert(std::is_same_v<decltype(text), const char* const>);

    std::cout << "limit=" << limit << " copy=" << copied_limit << '\n';
    std::cout << name << '\n' << copied_name << '\n';
    std::cout << text << '\n';
}
```

```text
limit=3 copy=4
pen edited
pen copy
note
```

`auto copied_limit = limit;`은 값을 복사하면서 초기값의 최상위 `const`와 참조 성질을 유지하지 않는다. 그래서 복사본을 바꿀 수 있다. 복사본도 바꾸지 않으려면 `const auto`로 선언한다. 원본을 참조하려면 수정 의도에 맞게 `auto&`나 `const auto&`를 사용한다.

`copied_name`은 별도의 `std::string`이고 `shared_name`은 원본을 참조한다. 큰 객체를 복사하는 타입에서는 이 차이가 비용에도 영향을 준다. 실제 비용은 타입과 사용 상황에 따라 다르다.

## 포인터의 const까지 전부 사라지는 것은 아니다

예제의 `"note"`는 문자열 리터럴이다. 값으로 추론하는 과정에서 배열이 포인터로 변환되므로 `auto text = "note";`의 타입은 `const char*`가 된다. `std::string`을 만드는 표현은 아니다.

예제의 `const auto`는 포인터 자체의 변경도 막아 `const char* const`가 된다. 대상 문자가 `const`인지와 포인터 자체가 `const`인지를 따로 봐야 한다. 값 추론에서 빠지는 것은 최상위 `const`이며, 대상의 한정자까지 모두 사라지지는 않는다.

문자열 객체가 필요하다면 `std::string text{"note"};`처럼 원하는 타입을 직접 적으면 된다. 이 경우에는 `auto`를 쓸 수 있게 식을 바꾸는 편이 더 번거로울 수 있다.

## 타입을 선택하는 곳에서는 명시한다

목표 타입을 직접 고르거나 변환해야 하는 곳은 ES.11에서도 `auto`를 강제하지 않는다. `auto ratio = 1 / 2;`는 `int`이며 값은 0이다. 왼쪽을 `double ratio`로 바꿔도 정수 나눗셈이 먼저 끝나 0.0이 된다. 실수 계산을 원하면 `1.0 / 2`처럼 연산에 참여하는 타입부터 맞춰야 한다.

| 선언 | C++20에서의 타입 |
| --- | --- |
| `auto n = 3;` | `int` |
| `auto n = 3u;` | `unsigned int` |
| `auto n{3};` | `int` |
| `auto values = {3, 4};` | `std::initializer_list<int>` |
| `auto values{3, 4};` | 여러 값으로 직접 목록 추론을 하므로 오류 |

`auto`와 중괄호의 조합은 표기를 조금 바꿔도 타입이 달라진다. 원문은 초기화 목록에 무심코 `auto`를 쓰지 말라고 권한다. 목록이 필요한 경우 타입과 의도를 분명하게 남기고, 단일 값은 `auto n = expression;`처럼 읽기 쉬운 형식을 선택할 수 있다.

## auto로 받은 값이 항상 독립된 복사본인 것은 아니다

`auto copied_name = name;`에서는 문자열이 복사된다. 하지만 반복자와 `std::string_view`는 복사해도 같은 대상을 가리킨다. `std::vector<bool>`의 원소 접근은 참조 역할을 하는 작은 대리 객체를 반환한다. 따라서 초기식이 어떤 타입의 값을 돌려주는지 알아야 복사의 의미도 판단할 수 있다.

대리 객체를 `auto`로 받으면 그 객체의 타입이 추론된다. 값 하나를 독립적으로 보관하려면 `bool enabled = flags[0];`처럼 목표 타입을 적는 편이 맞을 수 있다. 이 조각에서는 `flags`가 비어 있지 않아야 한다. 참조·뷰·반복자를 보관할 때는 대상이 언제까지 살아 있는지도 확인한다.

C++20에서는 `std::integral auto count = 3;`처럼 콘셉트로 추론 결과의 조건을 제한할 수도 있다. 이는 임의의 초기값을 정수로 변환하라는 뜻이 아니다. 콘셉트와 템플릿의 관계는 9부에서 다룬다.

## 확인한 범위

Linux의 GCC 14.2.0에서 C++20으로 프로그램의 `static_assert`와 출력을 확인했다. `auto`를 이용한 지역 변수 추론 자체는 C++11부터 가능하다.

```sh
g++ -std=c++20 -Wall -Wextra -Wpedantic -Wconversion -Werror auto_example.cpp -o auto_example
./auto_example
```

표의 목록 추론과 정수 나눗셈도 컴파일 검사로 확인했다. 여러 값을 직접 중괄호에 넣은 `auto` 선언은 거부됐다. 선언을 검토할 때는 타입 이름의 중복뿐 아니라 값을 복사할지, 원본을 참조할지도 함께 읽어야 한다.

<!-- series-source-and-navigation -->

관련 원문은 ES.11이다. 타입 이름의 중복을 줄이는 이유와 명시적 타입을 유지할 예외를 설명한다.

<div class="source-card">
  <a href="https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#res-auto" target="_blank" rel="noopener">
    <svg class="card-outline" aria-hidden="true" focusable="false"><rect x="1" y="1" rx="7" pathLength="1"></rect></svg>
    <strong>auto를 쓰면 무엇이 추론되고 무엇이 달라질까 관련 지침</strong>
    <small>C++ Core Guidelines · isocpp.github.io</small>
    <span role="img" aria-label="새 탭에서 열기">↗</span>
  </a>
</div>

[이전 글: constexpr로 계산 시점 표현하기](/posts/cpp-core-guidelines-08-constexpr/) · [전체 목차](/posts/cpp-core-guidelines/) · [다음 글: 관련 있는 상수를 enum class로 묶기](/posts/cpp-core-guidelines-10-enum-class/)
