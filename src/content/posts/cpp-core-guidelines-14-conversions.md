---
title: C++ Core Guidelines 14편 타입 변환이 필요한 곳과 위험해지는 곳
description: 값의 범위를 검사한 뒤 변환하고 캐스트가 보장하지 않는 조건을 구분하는 방법
date: 2026-11-19
category: 개발/C++/Core Guidelines
art: code
---

[전체 연재 목차](/posts/cpp-core-guidelines/) · 2부 변수와 표현식부터 안전하게

컴파일러가 변환 경고를 내면 `static_cast`를 붙여 조용하게 만들고 싶어진다. 하지만 경고가 사라져도 값이 목적 타입에 들어간다는 보장은 생기지 않는다. 캐스트는 변환을 요청하는 표현이고, 범위 검사는 변환이 허용되는 입력인지 판단하는 작업이다.

ES.46은 정보를 잃는 산술 변환을 피하라고 권한다. ES.48은 캐스트 자체를 줄이고, ES.49는 꼭 필요한 캐스트라면 목적이 드러나는 이름 있는 형태를 사용하라고 권한다.

## 범위를 확인한 다음 변환한다

외부 정수를 0~255 범위의 8비트 값으로 바꾸는 완전한 예제다. `std::uint8_t`가 제공되는 환경을 전제로 한다. 예제를 확인한 Linux 환경에서는 이 타입을 제공한다.

```cpp
#include <cstdint>
#include <initializer_list>
#include <iostream>
#include <optional>
#include <utility>

std::optional<std::uint8_t> to_byte(int value)
{
    if (!std::in_range<std::uint8_t>(value)) {
        return std::nullopt;
    }
    return static_cast<std::uint8_t>(value);
}

int main()
{
    for (const int value : {-1, 0, 42, 255, 256}) {
        std::cout << value << ':';
        if (const auto byte = to_byte(value)) {
            std::cout << static_cast<unsigned int>(*byte);
        } else {
            std::cout << "invalid";
        }
        std::cout << '\n';
    }
}
```

```text
-1:invalid
0:0
42:42
255:255
256:invalid
```

`std::in_range`는 C++20에서 지원하는 정수 타입 사이의 표현 가능 범위를 확인한다. 이 검사 뒤의 `static_cast`는 검증한 값을 변환한다. 출력할 때의 캐스트는 8비트 타입이 문자처럼 출력되는 일을 피하고 숫자 출력을 선택하기 위한 것이다.

`static_cast`만 남기면 -1이나 256이 거부되지 않는다. 여기서는 부호 없는 8비트 타입의 범위로 변환되어 각각 255와 0이 된다. 원래 값이 잘못 들어왔다는 정보는 사라진다.

## 중괄호와 검사 함수는 다른 곳에서 쓰인다

[6편](/posts/cpp-core-guidelines-06-initialization/)에서 본 `int n{2.5};`는 축소 변환이므로 컴파일 오류다. 하지만 실행 중 입력의 실제 값이 범위 안에 있는지는 중괄호가 검사하지 않는다. `std::uint8_t byte{value};`처럼 타입만으로 안전성을 보장할 수 없는 정수 변환은 값이 우연히 42여도 거부된다.

실행 중 범위가 달라지는 입력은 먼저 검사하고 변환한다. 원문의 GSL 도구도 역할이 나뉜다. `gsl::narrow_cast<T>`는 축소를 의도했다는 표시이며 본질적으로 `static_cast`와 같다. `gsl::narrow<T>`는 정보 손실을 검사해 실패를 알리는 도구다. 이들은 표준 라이브러리가 아니며, 적용할 변환과 사용 중인 구현의 조건을 확인해야 한다.

부동소수점에서 정수로 바꾸는 경우에는 소수 부분이 잘릴 뿐 아니라 변환 후 값이 정수 범위를 벗어나면 정의되지 않은 동작이 될 수 있다. NaN과 무한대도 별도로 고려해야 한다. 정수에서 부호 없는 정수로 바꿀 때의 순환 규칙을 여기에 적용하면 안 된다. 위 예제의 `std::in_range`도 부동소수점 입력을 위한 검사 함수가 아니다.

## 캐스트 이름이 알려주는 것과 알려주지 않는 것

| 형태 | 드러내는 의도와 한계 |
| --- | --- |
| `static_cast` | 허용된 명시적 변환을 수행하며 일반적인 범위 검사는 하지 않음 |
| `dynamic_cast` | 다형적 클래스 계층에서 런타임 타입 관계를 확인하는 용도 |
| `const_cast` | `const` 등의 한정자를 바꾸며 대상의 수정 가능성은 보장하지 않음 |
| `reinterpret_cast` | 저수준 표현이나 포인터 변환이며 대상 접근의 적법성은 별도 조건 |

C 스타일 `(T)value`는 문맥에 따라 여러 변환을 선택할 수 있어 검토하기 어렵다. 이름 있는 캐스트는 검색과 리뷰에 도움이 되지만, 이름이 길다고 안전한 것은 아니다. `std::move`와 `std::forward`도 원문에서는 의도가 드러나는 변환 도구로 함께 다룬다. 객체를 실제로 이동하는 동작과는 구분하며 후속 글에서 설명한다.

캐스트가 계속 늘어난다면 함수의 매개변수 타입, 오버로드, 템플릿이나 `std::variant` 같은 표현 방식부터 다시 살펴볼 수 있다. 같은 타입으로 되돌리는 캐스트나 원래 암시적으로 가능한 포인터 변환도 대개 필요하지 않다. `[[nodiscard]]` 경고를 `(void)` 캐스트로 숨기기 전에 결과를 처리해야 하는 이유부터 확인한다.

## const를 제거해도 수정 권한이 생기지 않는다

ES.50은 `const`를 캐스트로 제거하지 말라고 권한다. 실제로 `const`로 만든 객체를 그런 경로로 수정하면 정의되지 않은 동작이다. 원래 수정 가능한 객체를 `const` 참조로 보고 있던 경우와 구분해야 한다.

예전 라이브러리가 읽기만 하면서도 수정 가능한 포인터를 요구하는 경우는 있다. 원문은 인터페이스를 고칠 수 없을 때 변환을 작은 래퍼 안에 가두는 예외를 설명한다. 이때 실제로 쓰기가 없다는 API 계약을 확인해야 한다. 캐스트를 추가해서 시험 실행에 성공했다는 사실만으로 그 조건을 증명할 수는 없다.

## 검증한 범위

Linux의 GCC 14.2.0에서 C++20으로 예제를 실행했다.

```sh
g++ -std=c++20 -Wall -Wextra -Wpedantic -Wconversion -Werror conversion.cpp -o conversion
./conversion
```

하한·상한·범위 안의 값과 양쪽 범위 밖의 값을 확인했다. 실행 중 정수를 중괄호로 바로 축소하는 변형은 컴파일에 실패했다. 잘못된 `const` 수정이나 범위 밖 부동소수점 변환은 실행하지 않았다. 이 글에서 결과를 명시한 검증 대상은 정수 범위 검사와 변환이다.

<!-- series-source-and-navigation -->

관련 원문 항목은 **ES.46, ES.48, ES.49, ES.50**다. 아래 문서에서 권고의 이유와 예외를 확인할 수 있다.

<div class="source-card">
  <a href="https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#res-narrowing" target="_blank" rel="noopener">
    <svg class="card-outline" aria-hidden="true" focusable="false"><rect x="1" y="1" rx="7" pathLength="1"></rect></svg>
    <strong>타입 변환이 필요한 곳과 위험해지는 곳 관련 지침</strong>
    <small>C++ Core Guidelines · isocpp.github.io</small>
    <span role="img" aria-label="새 탭에서 열기">↗</span>
  </a>
</div>

[이전 글: 정수의 범위와 산술 오류 다루기](/posts/cpp-core-guidelines-13-integer-arithmetic/) · [전체 목차](/posts/cpp-core-guidelines/) · [다음 글: 복잡한 식과 평가 순서 풀어 읽기](/posts/cpp-core-guidelines-15-expressions-and-order/)
