---
title: C++ 리팩터링 1편 동작을 유지하며 함수 분리하기
description: C++ 주문 금액 계산 예제로 익히는 리팩터링의 의미와 회귀 테스트 및 함수 추출 과정
date: 2026-11-19T12:00:00+09:00
art: code
---

주문 금액을 계산하는 함수에 할인과 배송비 규칙이 들어 있다. 계산은 맞는데, 무료 배송 기준을 확인하려면 함수 전체를 읽어야 한다. 이런 코드를 만났을 때 어디부터 고치면 좋을까.

먼저 현재 결과를 테스트로 확인하고, 계산 단계에 이름을 붙여 함수로 나눠본다. 예제는 C++17 기준이며 구조체와 함수, `std::vector`를 읽을 수 있으면 따라갈 수 있다.

## 리팩터링에서 유지해야 하는 것

리팩터링은 외부에서 관찰할 수 있는 동작을 유지하면서 코드의 내부 구조를 바꾸는 작업이다. Martin Fowler도 이 기준으로 리팩터링을 정의한다.

<div class="source-card">
  <a href="https://refactoring.com/" target="_blank" rel="noopener">
    <svg class="card-outline" aria-hidden="true" focusable="false">
      <rect x="1" y="1" rx="7" pathLength="1"></rect>
    </svg>
    <strong>리팩터링의 정의와 작업 방식</strong>
    <small>Martin Fowler · refactoring.com</small>
    <span role="img" aria-label="새 탭에서 열기">↗</span>
  </a>
</div>

이번 예제에서는 같은 주문을 넣었을 때 같은 금액이 나와야 한다. 파일을 저장하거나 메시지를 보내는 코드라면 반환값 외에 저장 내용과 전송 횟수도 확인해야 한다.

무료 배송 기준을 바꾸거나 할인 계산 오류를 수정하는 일은 동작을 바꾼다. 그런 변경은 리팩터링과 커밋을 나누면 결과가 달라진 이유를 추적하기 쉽다.

## 계산 규칙이 한 함수에 모여 있는 코드

아래 코드는 학습용 주문 계산 예제다. 금액의 단위는 원이고, `unitPrice`는 단가, `quantity`는 수량이다.

```cpp
#include <cstdint>
#include <vector>

struct OrderItem {
    std::int64_t unitPrice;
    int quantity;
};

std::int64_t calculateTotal(
    const std::vector<OrderItem>& items,
    bool isMember)
{
    if (items.empty()) {
        return 0;
    }

    std::int64_t subtotal = 0;
    for (const auto& item : items) {
        subtotal += item.unitPrice * item.quantity;
    }

    std::int64_t discountedSubtotal = subtotal;
    if (isMember) {
        discountedSubtotal -= subtotal / 10;
    }

    std::int64_t shippingFee = 3000;
    if (discountedSubtotal >= 50000) {
        shippingFee = 0;
    }

    return discountedSubtotal + shippingFee;
}
```

적용하는 규칙은 다음과 같다.

- 주문 항목이 없으면 배송비 없이 0원을 반환한다.
- 회원은 상품 합계에서 10%를 할인한다. 할인액의 원 미만 금액은 버린다.
- 할인 후 상품 금액이 50,000원 이상이면 무료 배송이고, 그보다 적으면 배송비 3,000원을 더한다.

단가는 0원 이상 100만 원 이하, 수량은 1개 이상 100개 이하, 주문 항목은 1,000개 이하라고 가정한다. 입력 검증은 호출 전에 마친 상태로 두어 계산 구조에 집중한다. 이 범위의 곱셈과 합계는 `std::int64_t`에 들어간다.

함수가 아주 길지는 않지만 상품 합계, 회원 할인, 배송비 계산이 한곳에 있다. 할인 규칙을 읽다가 배송비 조건까지 함께 살펴보게 된다.

## 고치기 전에 결과부터 확인하기

테스트는 변경 전 코드에서 먼저 실행한다. 리팩터링을 마친 뒤에도 같은 테스트를 실행해 기존 동작이 유지되는지 확인한다. 이런 확인을 회귀 테스트라고 한다.

아래 코드를 앞의 함수 아래에 붙이면 별도 테스트 라이브러리 없이 실행할 수 있다.

```cpp
#include <cassert>

int main()
{
    assert(calculateTotal({}, false) == 0);
    assert(calculateTotal({}, true) == 0);
    assert(calculateTotal({{10000, 1}}, false) == 13000);
    assert(calculateTotal({{10000, 1}}, true) == 12000);
    assert(calculateTotal({{49999, 1}}, false) == 52999);
    assert(calculateTotal({{50000, 1}}, false) == 50000);
    assert(calculateTotal({{55554, 1}}, true) == 52999);
    assert(calculateTotal({{55555, 1}}, true) == 50000);
    assert(calculateTotal({{10001, 1}}, true) == 12001);
    assert(calculateTotal({{10000, 2}, {15000, 2}}, true) == 48000);
}
```

GCC가 설치되어 있다면 파일을 `order.cpp`로 저장하고 다음과 같이 빌드할 수 있다.

```sh
g++ -std=c++17 -Wall -Wextra -pedantic order.cpp -o order_test
```

생성된 실행 파일을 실행한다. Windows PowerShell에서는 `./order_test.exe`, Linux와 macOS에서는 `./order_test`다. 모든 검사를 통과하면 출력 없이 종료한다. `assert`는 `NDEBUG`가 정의되면 검사를 생략하므로 이 예제를 확인할 때는 해당 매크로를 정의하지 않는다.

50,000원 전후의 테스트는 무료 배송 경계를 확인한다. 회원 주문의 55,554원과 55,555원도 할인 후 금액이 각각 49,999원과 50,000원이 되는 경계다.

10,001원 테스트에는 계산 순서를 유지하려는 의도가 있다. 현재 코드는 할인액 `10001 / 10`에서 소수점 아래를 버려 1,000원을 할인한다. 할인 후 상품 금액을 `10001 * 90 / 100`으로 계산하면 결과가 9,001원에서 9,000원으로 달라진다. 비슷해 보이는 식도 정수 나눗셈을 거치면 결과가 달라질 수 있다.

이 테스트들이 모든 입력을 검증하지는 않는다. 실제 코드에 적용할 때는 허용하는 입력 범위와 오류 처리도 확인해야 한다.

## 상품 합계부터 함수로 추출하기

반복문은 각 항목의 금액을 합산하는 일을 한다. 이 부분을 `calculateSubtotal`로 옮긴다.

```cpp
std::int64_t calculateSubtotal(const std::vector<OrderItem>& items)
{
    std::int64_t subtotal = 0;
    for (const auto& item : items) {
        subtotal += item.unitPrice * item.quantity;
    }
    return subtotal;
}
```

이 함수를 `calculateTotal`보다 앞에 두고, 기존 합산 부분을 다음 한 줄로 바꾼다.

```cpp
const auto subtotal = calculateSubtotal(items);
```

주문 목록은 `const` 참조로 받아 복사하지 않고 읽는다. 합산 중에만 필요했던 지역 변수는 새 함수 안에 남는다. 호출한 쪽은 결과만 받으므로 `const`로 선언할 수 있다.

여기서 다시 빌드하고 앞의 테스트를 실행한다. 한 단계씩 확인하면 실패했을 때 방금 옮긴 코드부터 살펴볼 수 있다.

이처럼 의미 있는 작업을 함수로 옮기는 기법을 함수 추출이라고 한다.

<div class="source-card">
  <a href="https://refactoring.com/catalog/extractFunction.html" target="_blank" rel="noopener">
    <svg class="card-outline" aria-hidden="true" focusable="false">
      <rect x="1" y="1" rx="7" pathLength="1"></rect>
    </svg>
    <strong>함수 추출 Extract Function</strong>
    <small>Martin Fowler 리팩터링 카탈로그 · refactoring.com</small>
    <span role="img" aria-label="새 탭에서 열기">↗</span>
  </a>
</div>

## 할인과 배송비도 분리하기

같은 방식으로 할인 계산을 옮긴 뒤 테스트하고, 배송비 계산을 옮긴 뒤 다시 테스트한다. 계산식과 조건은 그대로 둔다. 아래는 분리를 마친 전체 계산 코드다. 처음 코드와 교체하고 같은 `main`으로 확인할 수 있다.

```cpp
#include <cstdint>
#include <vector>

struct OrderItem {
    std::int64_t unitPrice;
    int quantity;
};

std::int64_t calculateSubtotal(const std::vector<OrderItem>& items)
{
    std::int64_t subtotal = 0;
    for (const auto& item : items) {
        subtotal += item.unitPrice * item.quantity;
    }
    return subtotal;
}

std::int64_t applyMemberDiscount(std::int64_t subtotal, bool isMember)
{
    std::int64_t discountedSubtotal = subtotal;
    if (isMember) {
        discountedSubtotal -= subtotal / 10;
    }
    return discountedSubtotal;
}

std::int64_t calculateShippingFee(std::int64_t discountedSubtotal)
{
    std::int64_t shippingFee = 3000;
    if (discountedSubtotal >= 50000) {
        shippingFee = 0;
    }
    return shippingFee;
}

std::int64_t calculateTotal(
    const std::vector<OrderItem>& items,
    bool isMember)
{
    if (items.empty()) {
        return 0;
    }

    const auto subtotal = calculateSubtotal(items);
    const auto discountedSubtotal = applyMemberDiscount(subtotal, isMember);
    const auto shippingFee = calculateShippingFee(discountedSubtotal);

    return discountedSubtotal + shippingFee;
}
```

`calculateTotal`을 읽으면 상품 합계를 구하고, 할인을 적용하고, 배송비를 더하는 순서가 보인다. 무료 배송 조건을 확인하려면 `calculateShippingFee`를 읽으면 된다.

빈 주문을 처리하는 조건은 여전히 맨 앞에 있다. 이 조건까지 없애면 빈 주문에도 배송비 3,000원이 붙는다. 함수를 추출할 때는 옮길 코드뿐 아니라 남겨야 할 조건도 살펴야 한다.

## 어디까지 나눌지 판단하기

함수를 나누면 호출을 따라가며 읽어야 할 곳도 늘어난다. `item.unitPrice * item.quantity`처럼 뜻이 바로 보이는 식까지 모두 별도 함수로 만들 필요는 없다. 이번에는 할인과 배송비처럼 각각 설명할 수 있는 계산 규칙을 분리했다.

배송비 규칙이 한 군데에 있고 추가 정보도 필요하지 않으므로 지금은 함수로 충분하다. 배송 방식마다 규칙이 달라지고 외부 요금 조회까지 필요해진다면 그때 책임과 의존성을 다시 살펴볼 수 있다.

코드 줄 수는 늘었다. 대신 할인 규칙을 바꿀 때 읽을 부분이 분명해졌다. 변경 전후의 테스트가 통과하면 이 상태를 한 커밋으로 남기고, 실제 정책 변경은 다음 작업에서 진행한다.

## 시리즈에서 이어갈 내용

C++ 리팩터링 시리즈는 다음 순서로 이어갈 예정이다.

1. 동작을 유지하며 함수 분리하기: 현재 글
2. 이름과 타입으로 의도 드러내기: 숫자 상수와 `bool` 매개변수 정리
3. 중첩 조건문 줄이기: 조기 반환과 조건의 평가 순서
4. 중복 코드와 책임 분리하기: 함께 바뀌는 규칙을 묶는 기준
5. 자원 관리 정리하기: 수동 해제를 RAII로 바꾸고 소유권 확인하기
