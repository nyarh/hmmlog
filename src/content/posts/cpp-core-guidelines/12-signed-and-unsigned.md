---
slug: cpp-core-guidelines-12-signed-and-unsigned
title: C++ Core Guidelines 12. signed와 unsigned를 섞을 때 생기는 일
description: 부호가 다른 정수의 계산과 변환, 음수 입력 검사, 비트 연산과 안전한 역순 순회
date: 2026-11-21T03:01:34Z
category: 개발/C++/Core Guidelines
art: code
---

물품의 현재 재고가 3개이고 목표 재고가 5개라고 하자. 현재 수량에서 목표 수량을 빼면 부족한 수량을 -2로 표현할 수 있다. 그런데 목표 수량을 `unsigned int`로 선언하면 같은 뺄셈이 큰 양수를 만든다. 정수의 부호 여부는 저장 범위뿐 아니라 계산 방식에도 영향을 준다.

## 계산 전에 두 값의 타입이 맞춰진다

`int`는 음수와 0, 양수를 표현하는 부호 있는 정수 타입이다. `unsigned int`는 0 이상의 값을 표현하는 부호 없는 정수 타입이다. 다음 코드에서 `current`는 현재 재고, `target`은 목표 재고다.

```cpp
int current{3};
unsigned int target{5};
auto difference = current - target;
```

`int`와 `unsigned int`를 함께 빼면 `int` 쪽이 `unsigned int`로 변환된 뒤 계산된다. 따라서 `difference`도 `unsigned int`다. `unsigned int`가 32비트인 환경에서는 결과가 -2 대신 4294967294가 된다.

계산에 부호 있는 타입과 부호 없는 타입을 섞지 않는 게 좋다. 같은 숫자라도 변환된 타입에 따라 결과가 달라지기 때문이다.<sup>[ES.100](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#res-mix)</sup>

비교에도 같은 문제가 생긴다. `-1 < 1u`에서 접미사 `u`가 붙은 `1u`는 `unsigned int`다. -1이 `unsigned int`의 최댓값으로 변환되므로 비교 결과는 거짓이다. 다만 모든 혼합 연산이 반드시 부호 없는 타입이 되는 것은 아니다. 다른 정수 타입의 조합에서는 정수 승격과 타입의 순위, 표현 범위에 따라 공통 타입이 결정된다.

수량의 차이처럼 음수가 자연스러운 산술에는 부호 있는 타입을 사용하는 게 좋다.<sup>[ES.102](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#res-signed)</sup> 두 수량을 모두 `int`로 표현하면 의도한 차이를 얻는다.

```cpp
int current{3};
int target{5};
auto difference = current - target;  // int, -2
```

결과를 받을 변수만 바꿔서는 계산 타입이 달라지지 않는다. 첫 예제에서 `difference`를 더 큰 부호 있는 타입으로 선언하더라도, `current - target`은 여전히 `unsigned int`로 계산된 뒤 대입된다. 피연산자의 타입부터 정해야 한다. 부호 있는 타입을 선택해도 결과가 그 타입의 표현 범위를 벗어나는 계산은 피해야 한다.

## unsigned는 음수 입력을 거부하지 않는다

주문 함수가 수량을 `unsigned int`로 받는다고 하자. 음수 주문을 막으려는 의도라도, 매개변수 타입만으로 음수를 거부하지는 못한다.

```cpp
void place_order(unsigned int count);

int requested{-1};
place_order(requested);
```

호출할 때 -1이 `unsigned int`의 최댓값으로 변환된다. 함수 안에서는 이미 큰 양수가 됐으므로 원래 입력이 음수였는지 알 수 없다. 음수를 막기 위한 수단으로 `unsigned`를 선택하지 않는 게 좋다.<sup>[ES.106](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#res-nonnegative)</sup>

입력값은 부호 있는 타입으로 받아 음수인지 검사한다. 기존 API가 부호 없는 타입을 요구한다면 검사 후에 변환한다. 앞의 `requested`가 `int`인 경우, 0 이상의 값은 모두 `unsigned int`로 표현할 수 있다.

```cpp
if (requested < 0)
    throw std::invalid_argument{"주문 수량은 음수일 수 없다"};

place_order(static_cast<unsigned int>(requested));
```

이 검사는 음수만 거른다. 한 번에 주문할 수 있는 최대 수량이 있다면 그 조건도 검사해야 한다. 여러 함수에서 같은 조건을 요구한다면, 생성할 때 허용 범위를 확인하는 별도의 수량 타입으로 묶을 수 있다.

## 비트를 다룰 때는 부호 없는 타입을 쓴다

파일에 대한 읽기와 쓰기 권한을 각각 하나의 비트로 저장한다고 하자. 이런 비트 조작에는 부호 없는 타입을 사용하는 게 좋다. 부호 비트의 영향을 피하면서 값을 비트들의 조합으로 다룰 수 있다.<sup>[ES.101](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#res-unsigned)</sup>

`read_bit`와 `write_bit`는 각 권한의 위치이고, `permissions`는 현재 권한이다. `|`는 비트를 켜는 데 쓰고, `&`와 `~`를 함께 쓰면 특정 비트를 끌 수 있다.

```cpp
constexpr unsigned int read_bit = 1u << 0;
constexpr unsigned int write_bit = 1u << 1;

unsigned int permissions = read_bit | write_bit;
permissions &= ~write_bit;  // 쓰기 권한을 끄고 읽기 권한은 유지
```

`1u`는 부호 없는 정수이므로 이동 연산과 마스크 계산의 타입을 맞출 수 있다. 다만 `unsigned char`나 `unsigned short` 같은 작은 정수 타입은 계산 전에 `int`로 승격될 수 있다. 변수에 `unsigned`가 붙었다고 모든 중간 계산까지 같은 타입으로 진행되는 것은 아니다.

## 값이 순환해야 할 때는 그 의도를 남긴다

부호 없는 정수 연산은 표현 범위를 벗어나면 그 범위 안으로 값이 순환한다. 값 비트가 N개인 타입이라면 계산 결과를 2의 N제곱으로 나눈 나머지에 해당한다. 32비트 부호 없는 정수에서 3 - 5가 4294967294가 되는 것도 이 규칙 때문이다.

최댓값 다음에 0으로 돌아가는 순번이 필요하다면 이 동작을 사용할 수 있다. 이런 모듈러 연산을 의도한 경우에는 부호 없는 타입이 적합하다. 순환에 의존한다는 사실을 주석으로 남기는 게 좋다.<sup>[ES.101](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#res-unsigned) · [ES.102](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#res-signed)</sup>

```cpp
unsigned int next_sequence(unsigned int sequence)
{
    // unsigned int의 최댓값 다음에는 0으로 순환한다.
    return sequence + 1u;
}
```

이 순번은 순환 주기 안에서만 구분된다. 계속 증가하는 고유 번호가 필요하다면 같은 방식으로 값을 재사용해서는 안 된다. 부호 있는 정수의 범위 초과에는 이 순환 규칙을 적용할 수 없다.

## 인덱스의 감소와 컨테이너 크기를 함께 살핀다

온도 측정값을 저장한 `std::vector<int>`를 마지막 값부터 처리한다고 하자. `process`는 측정값 하나를 처리하는 함수다. 다음 반복문은 인덱스가 0 아래로 내려가면 끝날 것으로 보이지만 그렇게 동작하지 않는다.

```cpp
void process(int reading);
std::vector<int> readings{21, 23, 22};

for (std::size_t i = readings.size() - 1; i >= 0; --i)
    process(readings[i]);
```

`std::size_t`는 부호 없는 정수 타입이므로 `i >= 0`은 항상 참이다. 0에서 한 번 더 감소하면 최댓값으로 순환하고, 다음 접근은 컨테이너 범위를 벗어난다. 빈 컨테이너에서는 초기화할 때부터 `i`가 큰 값이 된다. 이처럼 `size()`가 부호 없는 크기를 반환한다고 해서 인덱스도 부호 없는 타입으로 맞추면 감소 연산에서 문제가 생긴다.

인덱스에는 충분한 범위의 부호 있는 타입을 사용하고, `gsl::index`를 우선하는 게 좋다.<sup>[ES.107](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#res-subscripts)</sup> `gsl::index`는 C++ 표준 라이브러리의 타입이 아니라 Guidelines Support Library의 인덱스 타입이다. Microsoft GSL에서는 `std::ptrdiff_t`의 별칭으로 정의한다. 단순히 `auto i = 0`으로 바꾸면 `int`가 되므로, 큰 컨테이너를 다룰 때 충분한 범위인지 확인해야 한다.

표준 라이브러리만 사용할 때는 C++20의 `<iterator>`가 제공하는 `std::ssize`로 부호 있는 크기를 얻을 수 있다. 다음 코드는 크기에서 시작해 0보다 클 때만 감소시킨 뒤 접근한다.

```cpp
for (auto i = std::ssize(readings); i > 0; ) {
    --i;
    process(readings[i]);
}
```

빈 컨테이너에서는 본문을 실행하지 않고, 그 밖에는 마지막 원소부터 0번 원소까지 처리한다. 단, 컨테이너 크기가 `std::ssize`의 반환 타입으로 표현 가능해야 한다. `std::ssize`는 그 범위를 검사하는 함수는 아니다. 부호 있는 인덱스도 음수나 범위 밖의 접근을 자동으로 막아 주지는 않는다.

원소의 위치가 필요하지 않다면 인덱스 계산 자체를 생략할 수 있다. 같은 역순 처리를 역방향 반복자로 표현하면 크기를 빼거나 부호가 다른 정수를 비교할 필요가 없다.<sup>[ES.107](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#res-subscripts)</sup>

```cpp
for (auto it = readings.rbegin(); it != readings.rend(); ++it)
    process(*it);
```

순방향으로 값만 처리할 때는 범위 기반 `for`를, 이미 제공되는 처리 방식이 있다면 표준 알고리즘을 사용할 수 있다.

이전 글: [11. 열거형의 연산과 값, 기반 타입 정하기](/posts/cpp-core-guidelines-11-enum-operations-values-and-underlying-types/)
