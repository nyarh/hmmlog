---
slug: cpp-core-guidelines-14-type-conversions-and-casts
title: C++ Core Guidelines 14. 타입 변환이 필요한 곳과 위험해지는 곳
description: 숫자 변환의 정보 손실, 범위 검사, 이름 있는 캐스트와 const를 제거할 때의 조건
date: 2026-11-21T09:03:26Z
category: 개발/C++/Core Guidelines
art: code
---

설정 파일에서 지연 시간을 7.9초로 읽었는데, 타이머 API는 정수 초만 받는다고 하자. 실수를 정수에 대입하면 7초가 된다. 0.9초를 버릴지, 반올림할지, 정수 초가 아닌 설정을 거부할지는 프로그램이 정해야 한다. 캐스트를 붙이는 것만으로 이 선택이 분명해지지는 않는다.

## 숫자가 변환될 때 무엇을 잃는지 확인한다

`seconds`는 설정에서 읽은 지연 시간이고, `delay`는 타이머에 전달할 정수 초다.

```cpp
double seconds{7.9};
int delay = seconds;  // 7
```

실수에서 정수로 변환하면 소수 부분을 버린다. `static_cast<int>(seconds)`나 `(int)seconds`라고 적어도 결과는 7이다. 값이나 정밀도를 잃는 산술 변환은 피하는 게 좋다.<sup>[ES.46](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#res-narrowing)</sup> 정수끼리 변환할 때도 대상 타입의 범위가 좁으면 값이 보존되지 않을 수 있다. 큰 정수를 부동소수점으로 바꿀 때는 일부 정수를 정확히 표현하지 못해 정밀도를 잃을 수 있다.

정보 손실을 허용하지 않는 초기화에는 중괄호를 사용할 수 있다. 다음 초기화는 실수에서 정수로의 축소 변환을 거부한다.

```cpp
int delay{seconds};  // 오류: double에서 int로의 축소 변환
```

중괄호가 모든 값의 의미를 검사하는 것은 아니다. 이 예시에서는 변환을 금지할 뿐, 7.9초를 어떻게 처리할지 결정해 주지는 않는다. 반대로 `float` 값을 `double`로 옮기는 것처럼 정보를 잃지 않는 변환에는 중괄호 초기화를 쓸 수 있다.<sup>[ES.49](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#res-casts-named)</sup>

포인터가 널인지 확인하는 `if (ptr)`처럼 조건식에서 참과 거짓으로 바꾸는 변환은 허용한다. 이런 문맥에 따른 `bool` 변환까지 손실을 피하라는 권고로 금지하는 것은 아니다.<sup>[ES.46](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#res-narrowing)</sup>

## 손실을 허용하는 변환과 검사하는 변환을 구분한다

Guidelines Support Library인 GSL은 변환 의도를 구분하는 함수를 제공한다. `gsl::narrow_cast`는 손실을 허용한다는 표시이며, 내부적으로 `static_cast`를 수행한다. `gsl::narrow`는 값이 보존되지 않으면 `gsl::narrowing_error` 예외를 던진다.<sup>[ES.46](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#res-narrowing)</sup> GSL은 별도로 사용하는 라이브러리이며 C++ 표준 라이브러리에 포함되지 않는다.

앞의 7.9초를 정수로 바꾸면 두 함수의 차이가 드러난다.

```cpp
auto truncated = gsl::narrow_cast<int>(seconds);  // 7
auto exact = gsl::narrow<int>(seconds);          // narrowing_error
```

`narrow_cast`에는 범위 검사 기능이 없다. 실수에서 `int`나 `unsigned int`로 변환할 때는 소수 부분을 버린 값이 대상 타입으로 표현 가능해야 한다. 그 범위를 벗어나거나 NaN, 무한대가 들어오면 일반적인 캐스트의 동작은 정의되지 않는다. 예를 들어 -7.9를 부호 없는 정수로 직접 바꾸는 것은 정수 -7을 부호 없는 정수로 바꾸는 경우와 다르다. 실수 변환에 정수의 순환 규칙을 적용해서는 안 된다.

정수 사이의 범위 검사는 C++20의 `<utility>`에 있는 `std::in_range`로도 할 수 있다. 컨테이너의 원소 개수를 `int`로 받는 기존 API에 전달해야 한다고 하자. `api_count`는 `std::size_t`로 받은 개수가 `int`로 표현되는지 확인한 뒤 변환한다.

```cpp
int api_count(std::size_t count)
{
    if (!std::in_range<int>(count))
        throw std::out_of_range{"원소 개수가 API의 int 범위를 벗어난다"};

    return static_cast<int>(count);
}
```

이 코드에서 안전성을 확보하는 부분은 캐스트 앞의 검사다. `std::in_range`는 이처럼 정수 타입 사이에서 사용하며, 실수의 소수 부분을 검사하는 함수는 아니다.

## 캐스트가 반복되면 인터페이스를 살핀다

불필요한 캐스트는 피하는 게 좋다. 타입이 맞지 않는 이유를 그대로 둔 채 변환만 추가하면 컴파일러가 찾을 수 있었던 오류를 숨길 수 있다.<sup>[ES.48](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#res-casts)</sup>

호출마다 개수를 `int`로 바꾸고 있다면 함수가 실제로 `int`만 받아야 하는지 확인한다. 여러 타입에 같은 처리를 적용한다면 함수 템플릿이나 오버로드를 사용할 수 있다. 서로 다른 몇 가지 타입 중 하나를 저장해야 한다면 C++17의 `std::variant`로 타입 정보를 유지하는 방법도 있다.

포인터 사이에 안전한 암시적 변환이 있다면 캐스트를 추가할 필요가 없다. 예를 들어 `T*`를 `const T*`로 바꾸는 변환이나, 공개적이고 모호하지 않은 상속 관계에서 파생 클래스 포인터를 기반 클래스 포인터로 바꾸는 변환이 그렇다.

반대로 `double` 객체의 주소를 `long long*`로 바꿔 역참조하는 것은 숫자 변환이 아니다. 원래 객체를 다른 타입의 객체인 것처럼 접근하는 코드다. 주소를 캐스트했다고 그 타입으로 접근할 권한이 생기지는 않는다.

## 캐스트가 필요하면 변환 종류를 이름에 드러낸다

변환이 필요하다면 C 스타일의 `(Type)value`보다 목적에 맞는 이름 있는 캐스트를 사용하는 게 좋다. 변환 종류를 구분할 수 있고, 그 종류에 맞지 않는 코드를 컴파일러가 거부할 수 있다.<sup>[ES.49](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#res-casts-named)</sup>

| 캐스트 | 쓰는 곳과 확인할 조건 |
| --- | --- |
| `static_cast` | 언어가 정한 명시적 변환에 사용한다. 숫자의 범위나 기반 클래스 포인터가 실제로 가리키는 객체의 종류를 실행 중에 검사해 주지는 않는다. |
| `dynamic_cast` | 다형적 클래스 계층에서 객체의 실제 타입을 확인하며 변환할 때 쓴다. 검사에 실패하면 포인터 변환은 널을 반환하고 참조 변환은 `std::bad_cast`를 던진다. |
| `reinterpret_cast` | 서로 다른 포인터 타입이나 정수와 포인터 사이의 저수준 변환 등에 쓴다. 정렬, 객체 수명, 해당 타입으로 접근할 수 있는지 등의 조건은 별도로 지켜야 한다. |
| `const_cast` | 포인터나 참조가 가리키는 대상의 `const` 등 한정자를 바꾼다. 원래 객체가 실제로 변경 가능한지는 보장하지 않는다. |

장치 레지스터의 주소를 포인터로 만드는 저수준 작업처럼 캐스트가 필요한 경우에도 주소와 접근 조건은 해당 시스템의 규약에 따라 확인해야 한다.

`Type(value)` 형태의 함수식 캐스트도 축소 변환을 숨길 수 있다. 값을 보존하는 초기화가 목적이면 `Type{value}`를 우선한다. 이때도 중괄호가 거부하는 변환을 다시 캐스트로 감싸 통과시키면 원래의 검사를 우회하게 된다.<sup>[ES.48](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#res-casts) · [ES.49](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#res-casts-named)</sup>

`std::move`와 `std::forward`도 값의 취급 방식을 명시하는 도구다. `std::move` 자체가 자원을 옮기지는 않으며, 이후의 생성자나 대입 연산자가 이동을 수행할 수 있게 한다. `std::forward`는 템플릿에서 전달받은 인자가 lvalue인지 rvalue인지에 맞춰 전달할 때 쓴다.

반환값을 버릴 때 쓰는 `(void)` 캐스트도 피한다. 특히 C++17의 `[[nodiscard]]`가 붙은 결과는 먼저 왜 확인해야 하는지 살핀다. 결과를 무시해도 된다는 판단을 검토했다면 `<tuple>`의 `std::ignore =`를 사용해 의도를 남긴다.<sup>[ES.48](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#res-casts)</sup>

## const를 제거해도 원본의 성질은 바뀌지 않는다

설정값을 변경하지 않도록 `const`로 선언했다고 하자. 참조에서 `const`를 제거해도 원래 객체가 변경 가능한 객체로 바뀌지는 않는다.

```cpp
const int limit{10};
int& writable = const_cast<int&>(limit);
writable = 20;  // 정의되지 않은 동작
```

`const`를 제거해 수정하지 않는 게 좋다. 실제로 `const`로 정의된 객체를 수정하면 정의되지 않은 동작이 된다.<sup>[ES.50](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#res-casts-const)</sup> 원본이 일반 `int`이고 그 값을 `const int&`로 보고 있었던 경우라면 원본 자체는 변경 가능하다. 그래도 읽기용으로 받은 참조를 몰래 수정하면 호출자가 기대한 동작과 달라진다.

`const` 멤버 함수와 일반 멤버 함수의 구현이 비슷하다는 이유로 캐스트를 추가하지 않는다. 공통 처리를 객체 참조를 받는 함수 템플릿으로 옮기면 객체의 `const` 여부를 추론해 유지할 수 있다. 타입에 의존하지 않는 큰 계산은 별도의 일반 함수로 분리하면 템플릿 인스턴스마다 코드가 중복되는 것도 줄일 수 있다.

읽기 작업 중 계산 결과를 캐시해야 한다면 캐시를 `mutable` 멤버로 두거나 별도 객체로 관리할 수 있다. `mutable`은 `const` 객체에서도 그 멤버의 변경을 허용한다. 여러 스레드가 같은 캐시를 사용한다면 동기화는 별도로 필요하다.<sup>[ES.50](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#res-casts-const)</sup>

## 읽기용 API가 const를 빠뜨렸다면 한곳에서 감싼다

구형 API가 문자열을 읽기만 하면서도 매개변수를 `char*`로 받는 경우가 있다. 실제로 내용을 수정하지 않는다는 계약을 확인했다면, 변환을 한 함수 안에 모으고 호출자에게는 읽기용 인터페이스를 제공할 수 있다.<sup>[ES.50](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#res-casts-const)</sup>

다음 예시의 `legacy_print`는 전달받은 문자열을 수정하지 않는다고 가정한다.

```cpp
void legacy_print(char* text);

inline void print_text(const char* text)
{
    legacy_print(const_cast<char*>(text));
}
```

외부 함수가 내용을 수정할 가능성이 있다면 변경 가능한 복사본을 전달하거나 API를 고쳐야 한다.

이전 글: [13. 정수의 범위와 산술 오류 다루기](/posts/cpp-core-guidelines-13-integer-ranges-and-arithmetic-errors/)
