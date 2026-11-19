---
title: C++ Core Guidelines 7편 const로 변경 가능한 범위를 줄이기
description: 변경하지 않는 값과 읽기 전용 인터페이스를 const로 표현하고 한계를 구분하는 기준
date: 2026-11-19
category: 개발/C++/Core Guidelines
art: code
---

[전체 연재 목차](/posts/cpp-core-guidelines/) · 2부 변수와 표현식부터 안전하게

배송비를 계산하라고 넘긴 주문에서 상품 이름까지 바뀌면, 호출하는 쪽은 예상하지 못한 변경을 추적해야 한다. 함수 선언에서 읽기만 하는지 수정도 하는지 알 수 있으면 이런 확인이 쉬워진다.

P.10과 Con.1은 변하지 않는 데이터를 기본으로 삼도록 권한다. 처음 정한 뒤 바꾸지 않을 값은 `const`로 두고, 변경이 필요한 곳에만 변경 권한을 남긴다. ES.25와 Con.4도 같은 판단을 변수 선언에 적용한다.

## 읽는 함수와 바꾸는 함수를 구분한다

아래 전체 프로그램은 주문 금액을 읽는 연산과 바꾸는 연산을 나눈다. 금액은 설명용 정수로 표현했으며, 실제 금융 코드에 필요한 입력 범위 검사와 통화 처리는 생략했다.

```cpp
#include <iostream>

class Order {
public:
    explicit Order(int amount) : amount_{amount} {}

    int amount() const { return amount_; }
    void set_amount(int amount) { amount_ = amount; }

private:
    int amount_;
};

bool has_free_shipping(const Order& order)
{
    constexpr int free_shipping_threshold{30'000};
    return order.amount() >= free_shipping_threshold;
}

int main()
{
    Order order{20'000};
    const Order& view{order};
    std::cout << std::boolalpha;
    std::cout << view.amount() << ' ' << has_free_shipping(view) << '\n';

    order.set_amount(35'000);
    std::cout << view.amount() << ' ' << has_free_shipping(view) << '\n';

    const Order fixed{30'000};
    std::cout << fixed.amount() << ' ' << has_free_shipping(fixed) << '\n';
}
```

```text
20000 false
35000 true
30000 true
```

`amount() const`의 마지막 `const`는 객체를 관찰하는 멤버 함수라는 표시다. 이 함수는 `const Order`에서도 호출할 수 있다. Con.2는 관찰 가능한 상태를 바꾸지 않는 멤버 함수에 이 표시를 붙이도록 권한다.

`has_free_shipping`은 `const Order&`를 받아 복사 없이 주문을 읽고, 이 참조를 통한 수정은 허용하지 않는다. Con.3이 권하는 기본 선택이다. 주문 금액을 바꾸는 함수라면 수정 가능한 참조를 받는 편이 맞다.

## const 참조는 값을 얼린 복사본이 아니다

출력에서 `view.amount()`는 20000에서 35000으로 바뀐다. `view`는 원본 `order`에 붙인 읽기 전용 접근 경로다. `order`라는 다른 경로를 통한 변경까지 막지는 않는다.

포인터는 대상의 수정과 포인터 자체의 변경을 구분한다. 아래 표는 `p`가 유효한 객체를 가리킨다고 가정한다.

| 선언 형태 | 막는 변경 | 허용하는 변경 |
| --- | --- | --- |
| `const T* p` | `p`를 통한 대상 수정 | 다른 대상을 가리키도록 `p` 변경 |
| `T* const p` | 포인터 `p` 자체 변경 | `p`를 통한 대상 수정 |
| `const T* const p` | 두 변경 모두 | 다른 별칭을 통한 수정 가능성은 별도 |
| `const T& ref` | 참조를 통한 대상 수정 | 원래부터 수정 가능한 대상의 다른 경로 변경 |

`const`는 연결된 모든 객체에 재귀적으로 적용되지는 않는다. 포인터 멤버가 가리키는 대상이나 `mutable` 멤버는 `const` 멤버 함수에서도 수정할 수 있다. 캐시 갱신에 `mutable`을 쓰기도 하며, 그 변경이 관찰 가능한 의미를 바꾸지 않도록 클래스가 관리해야 한다.

여러 스레드가 `const` 멤버 함수를 동시에 호출하더라도 내부 캐시를 갱신하거나 다른 별칭으로 쓰는 데이터가 있다면 동기화가 필요하다. 함수 선언만 보고 동시 호출의 안전성을 판단할 수는 없다.

## 변경이 필요한 값까지 억지로 막지는 않는다

누적 합계나 반복 변수, 갱신할 주문에는 변경이 필요하다. 값을 바꾸는 이유를 확인하고, 바꾸지 않을 객체에 `const`를 붙인다.

값으로 반환할 지역 객체에도 주의한다. 다음은 설명용 함수다.

```cpp
std::vector<int> make_values()
{
    std::vector<int> values{1, 2, 3};
    return values;
}
```

`values`에 `const`를 붙이면 반환값 최적화가 적용되지 않는 경우 이동 대신 복사가 필요할 수 있다. 최적화가 적용되는 경우도 있으므로 `const`가 언제나 복사를 일으키는 것은 아니다. Con.1도 값을 반환할 지역 변수와 값으로 받는 매개변수에는 일괄 적용하지 말라고 설명한다. 반환과 이동은 39편에서 다룬다.

## 검증과 코드 리뷰에서 볼 곳

Linux의 GCC 14.2.0에서 위 주문 프로그램을 확인했다. C++20으로 빌드했으며 코드의 자릿수 구분 기호는 C++14 기능이다.

```sh
g++ -std=c++20 -Wall -Wextra -Wpedantic -Wconversion -Werror const_example.cpp -o const_example
./const_example
```

무료 배송 기준 아래·경계·위의 결과와 별칭을 통한 값의 변화를 확인했다. `fixed.set_amount(1)`을 추가한 경우에는 컴파일에 실패했다. 읽기 전용 매개변수가 수정 함수에 전달되는지도 컴파일러가 확인할 수 있다.

수정하지 않는 지역 변수와 읽기만 하는 멤버 함수부터 확인해 보자. `T&`로 받지만 대상을 수정하지 않는 매개변수도 후보가 된다. 의도를 `const`로 남기면 이후 실수로 변경 코드를 추가했을 때 컴파일러가 알려줄 수 있다.

<!-- series-source-and-navigation -->

관련 원문 항목은 **P.10, Con.1, Con.2, Con.3, Con.4, ES.25**다. 아래 문서에서 권고의 이유와 예외를 확인할 수 있다.

<div class="source-card">
  <a href="https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#s-const" target="_blank" rel="noopener">
    <svg class="card-outline" aria-hidden="true" focusable="false"><rect x="1" y="1" rx="7" pathLength="1"></rect></svg>
    <strong>const로 변경 가능한 범위를 줄이기 관련 지침</strong>
    <small>C++ Core Guidelines · isocpp.github.io</small>
    <span role="img" aria-label="새 탭에서 열기">↗</span>
  </a>
</div>

[이전 글: 초기화와 대입, 중괄호와 소괄호의 차이](/posts/cpp-core-guidelines-06-initialization/) · [전체 목차](/posts/cpp-core-guidelines/) · [다음 글: constexpr로 계산 시점 표현하기](/posts/cpp-core-guidelines-08-constexpr/)
