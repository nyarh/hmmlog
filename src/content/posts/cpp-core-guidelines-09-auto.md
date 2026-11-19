---
title: C++ Core Guidelines 9편 auto를 쓰면 무엇이 추론되고 무엇이 달라질까
description: auto의 값과 참조 추론을 구분하고 복사와 타입 변환 의도를 드러내는 방법
date: 2026-11-19
category: 개발/C++/Core Guidelines
art: code
---

[전체 연재 목차](/posts/cpp-core-guidelines/) · 2부 변수와 표현식부터 안전하게

길게 중첩된 컨테이너 타입을 두 번 적으면 오타가 날 자리가 늘어난다. ES.11은 이런 중복을 줄이는 데 `auto`를 사용하라고 권한다. 하지만 `auto`는 ‘초기값과 모든 성질이 같은 변수’를 만드는 표기가 아니다. 참조를 붙였는지에 따라 복사 여부도 달라진다.

## 값을 받는 선언과 참조를 받는 선언

다음은 타입과 실행 결과를 함께 확인하는 완전한 프로그램이다. `std::is_same_v`는 두 타입이 같은지 확인하며 C++17부터 제공된다.

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

`auto copied_limit = limit;`은 값을 복사한다. 초기값의 최상위 `const`와 참조 성질은 이 값 추론에서 유지되지 않는다. 그래서 복사본을 바꿀 수 있다. 원본을 바꾸지 않겠다는 뜻이라면 `const auto`를, 원본을 참조하겠다면 `auto&`나 `const auto&`를 선언에 직접 표현한다.

문자열에서도 `copied_name`은 별도의 `std::string`이고 `shared_name`은 원본의 참조다. 복사에 비용이 드는 타입이라면 이 차이는 동작뿐 아니라 비용에도 영향을 준다. 비용 크기는 타입과 상황에 따라 다르다.

## 포인터의 const까지 전부 사라지는 것은 아니다

예제의 `"note"`는 문자열 리터럴이다. 값으로 추론하는 과정에서 배열이 포인터로 변환되므로 `auto text = "note";`의 타입은 `const char*`가 된다. `std::string`을 만드는 표현은 아니다.

예제는 `const auto`로 선언했으므로 포인터 자체도 바꿀 수 없는 `const char* const`가 된다. 문자가 `const`라는 성질과 포인터 자체가 `const`라는 성질을 구분해야 한다. 값 추론이 제거하는 최상위 `const`를 ‘모든 const 제거’로 기억하면 틀린다.

원하는 타입이 분명하다면 `std::string text{"note"};`처럼 직접 적으면 된다. `auto`를 쓰기 위해 불필요하게 표현식을 복잡하게 만들 이유는 없다.

## 타입을 선택하는 곳에서는 명시한다

ES.11은 정확한 목표 타입과 변환이 필요할 때까지 `auto`를 강제하지 않는다. 예를 들어 `auto ratio = 1 / 2;`의 타입은 `int`이고 값은 0이다. 왼쪽을 `double ratio`로 바꿔도 오른쪽 정수 나눗셈은 먼저 끝나므로 0.0이 된다. 실수 계산이 목적이라면 `1.0 / 2`처럼 연산에 참여하는 타입부터 맞춰야 한다.

| 선언 | C++20에서의 타입 |
| --- | --- |
| `auto n = 3;` | `int` |
| `auto n = 3u;` | `unsigned int` |
| `auto n{3};` | `int` |
| `auto values = {3, 4};` | `std::initializer_list<int>` |
| `auto values{3, 4};` | 여러 값으로 직접 목록 추론을 하므로 오류 |

`auto`와 중괄호의 조합은 표기를 조금 바꿔도 타입이 달라진다. 원문은 초기화 목록에 무심코 `auto`를 쓰지 말라고 권한다. 목록이 필요한 경우 타입과 의도를 분명하게 남기고, 단일 값은 `auto n = expression;`처럼 읽기 쉬운 형식을 선택할 수 있다.

## auto로 받은 값이 항상 독립된 복사본인 것은 아니다

`auto copied_name = name;`은 문자열을 복사하지만, 모든 초기식이 이런 객체를 반환하지는 않는다. 반복자나 `std::string_view`는 복사해도 같은 대상에 접근한다. `std::vector<bool>`의 원소 접근처럼 참조 역할을 하는 작은 대리 객체를 반환하는 경우도 있다.

그런 객체를 `auto`로 받으면 대리 객체 자체의 타입이 추론된다. 값 하나를 떼어 보관하려는 의도라면 `bool enabled = flags[0];`처럼 실제 목표 타입을 적는 편이 맞을 수 있다. 이 조각은 `flags`가 비어 있지 않다는 전제다. 참조·뷰·반복자를 보관할 때는 대상의 수명도 확인해야 한다.

C++20에서는 `std::integral auto count = 3;`처럼 콘셉트로 추론 결과의 조건을 제한할 수도 있다. 이는 임의의 초기값을 정수로 변환하라는 뜻이 아니다. 콘셉트와 템플릿의 관계는 9부에서 다룬다.

## 확인한 범위

Linux의 GCC 14.2.0에서 C++20으로 프로그램의 `static_assert`와 출력을 확인했다. `auto`를 이용한 지역 변수 추론 자체는 C++11부터 가능하다.

```sh
g++ -std=c++20 -Wall -Wextra -Wpedantic -Wconversion -Werror auto_example.cpp -o auto_example
./auto_example
```

추가로 표의 목록 추론과 정수 나눗셈을 컴파일 검사했고, 여러 값을 직접 중괄호로 초기화한 `auto` 선언은 거부되는 것을 확인했다. 리뷰에서는 타입 이름이 반복되는지와 함께, 그 줄이 값을 복사하려는 것인지 대상을 참조하려는 것인지 읽어 보면 된다.

<!-- series-source-and-navigation -->

관련 원문 항목은 **ES.11**다. 아래 문서에서 권고의 이유와 예외를 확인할 수 있다.

<div class="source-card">
  <a href="https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#res-auto" target="_blank" rel="noopener">
    <svg class="card-outline" aria-hidden="true" focusable="false"><rect x="1" y="1" rx="7" pathLength="1"></rect></svg>
    <strong>auto를 쓰면 무엇이 추론되고 무엇이 달라질까 관련 지침</strong>
    <small>C++ Core Guidelines · isocpp.github.io</small>
    <span role="img" aria-label="새 탭에서 열기">↗</span>
  </a>
</div>

[이전 글: constexpr로 계산 시점 표현하기](/posts/cpp-core-guidelines-08-constexpr/) · [전체 목차](/posts/cpp-core-guidelines/) · [다음 글: 관련 있는 상수를 enum class로 묶기](/posts/cpp-core-guidelines-10-enum-class/)
