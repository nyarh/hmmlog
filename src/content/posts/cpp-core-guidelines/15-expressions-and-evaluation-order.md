---
slug: cpp-core-guidelines-15-expressions-and-evaluation-order
title: C++ Core Guidelines 15. 복잡한 식과 평가 순서 풀어 읽기
description: 대입이 섞인 식, 연산자 우선순위, 부수 효과와 함수 인자 평가 순서, 상수에 이름 붙이기
date: 2026-11-21T12:01:07Z
category: 개발/C++/Core Guidelines
art: code
---

주문의 결제 금액을 구할 때 상품 합계에 배송비를 더하고 할인액을 뺀다고 하자. 배송비와 할인액을 변수에 저장하는 일까지 한 식에 넣으면, 값을 구하는 과정과 변수를 바꾸는 과정이 섞인다. 식을 읽을 때는 계산 결과뿐 아니라 어떤 값이 언제 바뀌는지도 따라가야 한다.

## 대입과 금액 계산을 분리한다

`subtotal`은 상품 합계다. `shipping_fee`와 `discount_amount`는 이 합계를 받아 각각 배송비와 할인액을 반환한다. 여기서는 두 함수가 공유 상태를 바꾸지 않고, 금액 계산도 `int` 범위 안에 있다고 가정한다.

```cpp
int shipping{};
int discount{};
int total = subtotal + (shipping = shipping_fee(subtotal))
                     - (discount = discount_amount(subtotal));
```

이 식에는 함수 호출, 두 변수에 대한 대입, 최종 금액 계산이 함께 들어 있다. 복잡한 식은 피하는 게 좋다. 여러 동작이 겹치면 대입을 놓치거나 우선순위를 잘못 읽기 쉽다.<sup>[ES.40](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#res-complicated)</sup>

다음처럼 각 금액을 먼저 구하면 대입을 계산식 안에서 찾을 필요가 없다.

```cpp
const int shipping = shipping_fee(subtotal);
const int discount = discount_amount(subtotal);
const int total = subtotal + shipping - discount;
```

배송비를 구하고, 할인액을 구하고, 합계를 계산하는 순서도 문장 순서로 드러난다. 다만 마지막 산술식까지 연산 하나마다 나눌 필요는 없다. 기본적인 산술식을 지나치게 쪼개면 임시 변수 사이에서 원래 계산을 다시 조합해야 한다.

## 우선순위가 헷갈리면 괄호를 붙인다

파일의 쓰기 권한을 비트로 저장한다고 하자. `write_flag`는 쓰기 권한을 나타내는 비트이고, `permissions`는 현재 권한이다. 다음 코드는 쓰기 권한이 있는지 검사하려는 식이다.

```cpp
constexpr unsigned int write_flag{2u};
unsigned int permissions{write_flag};
bool can_write = permissions & write_flag != 0;
```

이 식은 `permissions & (write_flag != 0)`으로 묶인다. `!=`의 우선순위가 비트 AND인 `&`보다 높기 때문이다. 비교 결과인 `true`가 정수 1로 변환되어 `2 & 1`을 계산하므로, 쓰기 권한이 있는데도 `can_write`는 거짓이 된다.

연산자 우선순위가 분명하지 않다면 괄호로 묶는 게 좋다. 특히 비트 연산과 비교 연산을 섞을 때 계산하려는 부분을 드러낸다.<sup>[ES.41](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#res-parens)</sup>

```cpp
bool can_write = (permissions & write_flag) != 0;
```

이제 쓰기 권한 비트가 켜져 있으면 참이 된다. 덧셈과 곱셈처럼 익숙한 기본 우선순위까지 모든 항에 괄호를 붙일 필요는 없다.

## 괄호는 평가 순서를 정하지 않는다

우선순위는 식이 어떻게 묶이는지를 정한다. 평가 순서는 각 부분의 값을 구하고 변수에 변경을 반영하는 순서다. 괄호로 식을 묶었다고 그 부분이 다른 부분보다 먼저 실행되는 것은 아니다.

온도 측정값 중 0번과 1번 원소를 더하면서, 현재 위치를 1번으로 옮긴다고 하자. 다음 식은 왼쪽 원소를 읽은 뒤 인덱스를 올리고, 오른쪽 원소를 읽을 것으로 보인다.

```cpp
int readings[]{21, 23, 22};
int index{0};
int sum = readings[index++] + readings[index];  // 정의되지 않은 동작
```

하지만 기본 `+` 연산자는 두 피연산자 사이의 평가 순서를 보장하지 않는다. `index++`가 `index`를 바꾸는 동작과 오른쪽에서 `index`를 읽는 동작 사이에 순서가 정해져 있지 않다. 같은 객체의 변경과 읽기가 이렇게 충돌하면 정의되지 않은 동작이 된다. 이런 식은 피하는 게 좋다.<sup>[ES.43](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#res-order)</sup>

의도한 순서는 별도 문장으로 나눈다. 앞의 식을 다음 코드로 바꾸면 0번 원소를 읽고 인덱스를 증가시킨 뒤 1번 원소를 읽는다.

```cpp
const int first = readings[index];
++index;
const int sum = first + readings[index];
```

주어진 배열과 초기 인덱스에서는 합계가 44이고 마지막 인덱스는 1이다. 괄호를 추가한 `(readings[index++]) + (readings[index])`로는 같은 효과를 얻을 수 없다. 서로 다른 참조 이름을 사용하더라도 두 참조가 같은 객체를 가리킨다면 변경과 읽기가 충돌할 수 있다.

C++17이 모든 식을 왼쪽부터 평가하도록 바꾼 것은 아니다. 기본 연산자의 주요 규칙은 다음과 같다.

| 연산 | 평가 순서 |
| --- | --- |
| `a + b` | 두 피연산자 사이의 순서를 보장하지 않는다. |
| `a && b` | `a`를 먼저 평가하고, 거짓이면 `b`를 평가하지 않는다. |
| `a \|\| b` | `a`를 먼저 평가하고, 참이면 `b`를 평가하지 않는다. |
| `a = b` | C++17부터 오른쪽 피연산자를 왼쪽 피연산자보다 먼저 평가한다. |

평가 순서가 정해져 있는 연산도 한 식에 변경을 여러 개 겹치면 읽기 어려울 수 있다. 문장을 나누면 어떤 순서에 의존하는지 확인하기 쉽다.

## 함수 인자는 왼쪽부터 평가된다고 가정하지 않는다

두 작업에 연속된 번호를 붙이는 `assign_ids` 함수가 있다고 하자. 첫 번째 매개변수는 첫 작업의 번호, 두 번째 매개변수는 둘째 작업의 번호다. `next_id`는 마지막으로 사용한 번호다.

```cpp
void assign_ids(int first, int second);
int next_id{0};

assign_ids(++next_id, ++next_id);
```

C++17 이전에는 같은 변수에 대한 두 변경의 순서가 보장되지 않아 정의되지 않은 동작이다. C++17부터는 한 인자에 따른 매개변수 초기화가 끝난 뒤 다른 쪽을 초기화하므로 이 호출 자체에 그 문제는 없다. 그래도 어느 인자를 먼저 평가할지는 정해져 있지 않다. 따라서 `(1, 2)` 또는 `(2, 1)`로 호출될 수 있다.

함수 인자의 평가 순서에 의존하지 않는 게 좋다.<sup>[ES.44](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#res-order-fct)</sup> 첫 작업에 1, 둘째 작업에 2를 주려면 앞의 호출을 다음 세 문장으로 바꾼다.

```cpp
const int first_id = ++next_id;
const int second_id = ++next_id;
assign_ids(first_id, second_id);
```

이 코드는 `next_id`가 0에서 시작하면 항상 `(1, 2)`를 전달한다. 앞선 호출의 결과를 다음 인자에서 읽거나, 같은 입력 스트림을 두 인자에서 연달아 읽는 경우도 순서를 명시해야 한다. 반면 인자들이 서로 독립적이고 평가 순서가 결과에 영향을 주지 않는다면 호출 전에 모두 임시 변수로 옮길 필요는 없다.

## 상수에는 역할과 단위를 드러내는 이름을 붙인다

통신 패킷의 앞 8바이트가 헤더이고, 나머지가 본문인 형식을 처리한다고 하자. 패킷 크기에서 숫자 8을 빼기만 하면 그 숫자가 헤더 길이인지 다른 제한인지 코드를 읽는 사람이 알아내야 한다. 의미가 있는 상수에는 이름을 붙이는 게 좋다.<sup>[ES.45](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#res-magic)</sup>

`packet`은 바이트들을 담은 `std::vector<unsigned char>`다. 헤더 길이를 이름으로 나타내고, 뺄셈 전에 패킷이 그만큼 긴지 확인한다.

```cpp
constexpr std::size_t header_bytes{8};

if (packet.size() < header_bytes)
    throw std::invalid_argument{"헤더보다 짧은 패킷이다"};

const auto payload_bytes = packet.size() - header_bytes;
```

`header_bytes`는 값의 역할과 단위가 바이트임을 드러낸다. 길이 검사는 부호 없는 크기에서 더 큰 값을 빼는 일도 막는다.

상수가 필요하지 않게 표현할 수도 있다. 배열의 모든 원소를 처리한다면 원소 개수를 상수로 두고 반복하는 대신 범위 기반 `for`를 사용한다. 첫 인덱스의 0이나 한 칸 증가의 1처럼 뜻이 분명한 값까지 기계적으로 이름 붙일 필요는 없다.

이전 글: [14. 타입 변환이 필요한 곳과 위험해지는 곳](/posts/cpp-core-guidelines-14-type-conversions-and-casts/)
