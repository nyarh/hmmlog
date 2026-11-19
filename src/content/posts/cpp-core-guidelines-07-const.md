---
title: C++ Core Guidelines 7편 const로 변경 가능한 범위를 줄이기
description: 변경하지 않는 값과 읽기 전용 인터페이스를 const로 표현하고 한계를 구분하는 기준
date: 2026-11-19
category: 개발/C++/Core Guidelines
art: code
---

[전체 연재 목차](/posts/cpp-core-guidelines/) · 2부 변수와 표현식부터 안전하게

배송비를 계산하는 함수가 주문 내용을 받아 놓고 상품 이름까지 바꾸면 호출하는 쪽은 당황한다. 읽기만 하는 함수인지 값을 바꾸는 함수인지 선언에서 알 수 있으면 확인할 범위가 줄어든다.

P.10과 Con.1은 변하지 않는 데이터를 기본으로 삼도록 권한다. 처음 정한 뒤 바꾸지 않을 값은 `const`로 두고, 변경이 필요한 곳에만 변경 권한을 남긴다. ES.25와 Con.4도 같은 판단을 변수 선언에 적용한다.

## 읽는 함수와 바꾸는 함수를 구분한다

다음은 완전한 실행 예제다. 금액은 설명용 정수 단위이며 입력 범위와 통화 처리를 구현한 금융 코드는 아니다.

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

`amount() const`의 마지막 `const`는 멤버 함수가 객체를 관찰하는 연산임을 드러낸다. 덕분에 `const Order`에도 호출할 수 있다. Con.2는 관찰 가능한 상태를 바꾸지 않는 멤버 함수에 이 표시를 붙이라고 권한다.

`has_free_shipping`은 `const Order&`로 받는다. 객체를 복사하지 않으면서 이 참조를 통해 수정할 수 없게 한다. Con.3의 기본 선택이다. 반대로 주문 금액을 바꾸는 함수라면 수정 가능한 참조를 받는 것이 의도에 맞다.

## const 참조는 값을 얼린 복사본이 아니다

출력에서 `view.amount()`는 20000에서 35000으로 바뀐다. `view`는 원본 `order`에 붙인 읽기 전용 접근 경로다. `order`라는 다른 경로를 통한 변경까지 막지는 않는다.

이 구분은 포인터에서도 중요하다. 다음 표에서 `p`는 이미 유효한 객체를 가리킨다고 가정한다.

| 선언 형태 | 막는 변경 | 허용하는 변경 |
| --- | --- | --- |
| `const T* p` | `p`를 통한 대상 수정 | 다른 대상을 가리키도록 `p` 변경 |
| `T* const p` | 포인터 `p` 자체 변경 | `p`를 통한 대상 수정 |
| `const T* const p` | 두 변경 모두 | 다른 별칭을 통한 수정 가능성은 별도 |
| `const T& ref` | 참조를 통한 대상 수정 | 원래부터 수정 가능한 대상의 다른 경로 변경 |

`const`를 하나 붙였다고 연결된 모든 객체가 재귀적으로 불변이 되는 것은 아니다. 클래스의 포인터 멤버가 가리키는 대상이나 `mutable` 멤버는 `const` 멤버 함수에서도 수정할 수 있다. 캐시를 갱신하려고 `mutable`을 쓰기도 하지만, 관찰 가능한 의미를 유지할 책임은 클래스에 있다.

따라서 `const` 멤버 함수라는 사실만으로 여러 스레드가 동시에 불러도 안전하다고 판단할 수 없다. 내부 캐시 변경이나 다른 별칭을 통한 쓰기가 있다면 동기화가 필요하다.

## 변경이 필요한 값까지 억지로 막지는 않는다

누적 합계, 반복 변수, 실제로 갱신하는 주문은 변경 가능한 것이 자연스럽다. 이름 뒤에 `const`가 얼마나 많이 붙었는지를 세는 규칙이 아니다. 변경이 필요한 이유가 코드에 있는지 확인한다.

값으로 반환할 지역 객체에도 주의한다. 다음은 설명용 함수다.

```cpp
std::vector<int> make_values()
{
    std::vector<int> values{1, 2, 3};
    return values;
}
```

`values`에 `const`를 붙이면 반환값 최적화가 적용되지 않을 때 이동 대신 복사가 필요해질 수 있다. `const` 때문에 항상 복사된다는 뜻은 아니다. Con.1은 이런 반환 지역 변수와 값으로 받는 매개변수까지 기계적으로 강제하지 말라고 설명한다. 반환과 이동은 39편에서 다시 다룬다.

## 검증과 코드 리뷰에서 볼 곳

Linux의 GCC 14.2.0에서 위 주문 프로그램을 확인했다. C++20으로 빌드했으며 코드의 자릿수 구분 기호는 C++14 기능이다.

```sh
g++ -std=c++20 -Wall -Wextra -Wpedantic -Wconversion -Werror const_example.cpp -o const_example
./const_example
```

무료 배송 기준 아래·경계·위의 결과와 별칭을 통한 값의 변화를 확인했다. `fixed.set_amount(1)`을 추가한 경우에는 컴파일에 실패했다. 읽기 전용 매개변수가 수정 함수에 전달되는지도 컴파일러가 확인할 수 있다.

리뷰할 때는 값이 바뀌지 않는 지역 변수, 읽기만 하는 멤버 함수, 수정하지 않으면서 `T&`로 받는 매개변수를 찾아보면 좋다. 각각을 `const`로 표현하면 앞으로 실수로 추가되는 변경도 더 이른 단계에서 드러난다.

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
