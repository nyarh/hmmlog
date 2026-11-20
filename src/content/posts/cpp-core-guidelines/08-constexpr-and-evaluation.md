---
slug: cpp-core-guidelines-08-constexpr-and-evaluation
title: C++ Core Guidelines 8. constexpr로 계산 시점 표현하기
description: constexpr 변수와 함수의 차이, 상수식이 필요한 위치와 실행 중 계산의 경계
date: 2026-11-20T09:08:13Z
category: 개발/C++/Core Guidelines
art: code
---

로그 화면이 한 페이지에 표시할 기본 줄 수를 20으로 정했다고 하자. 이 기본값은 소스 코드만으로 알 수 있다. 사용자가 설정 파일에 저장한 페이지당 줄 수는 프로그램이 실행돼 파일을 읽어야 알 수 있다. 두 값을 모두 변경하지 않더라도, 값을 결정할 수 있는 시점은 다르다.

컴파일할 때 계산할 수 있는 상수에는 `constexpr`를 사용하는 게 좋다. 초기값이 상수식인지 컴파일러가 확인하게 하고, 컴파일 시점의 값이 필요한 곳에서도 사용할 수 있다.<sup>[Con.5](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#rconst-constexpr)</sup>

## constexpr 변수는 상수식으로 초기화한다

`read_page_size()`가 설정 파일에서 페이지당 줄 수를 읽어 `std::size_t`로 반환한다고 하자. 고정된 기본값과 설정에서 읽은 값은 다음처럼 구분한다.

```cpp
constexpr std::size_t default_page_size{20};
const std::size_t page_size = read_page_size();
```

`constexpr` 변수는 초기값을 상수식으로 구할 수 있어야 한다. 상수식은 언어가 허용한 규칙에 따라 컴파일 중 평가할 수 있는 식이다. 리터럴뿐 아니라 상수 간의 연산과 조건을 충족하는 함수 호출도 포함한다. `constexpr`로 선언한 객체에는 `const`도 적용된다.

`const`는 초기화 후 변경을 제한한다. 위의 `page_size`처럼 실행 중에 값을 받아 초기화해도 된다. 이 선언을 `constexpr`로 바꾸면 설정 파일을 읽는 호출을 상수식으로 평가할 수 없어 오류가 된다.

`const`인 값이 모두 상수식에서 제외되는 것은 아니다. 예를 들어 `const int size = 20;`은 상수식으로 초기화한 정수이므로 배열 크기 같은 곳에 사용할 수 있다. 그래도 컴파일 시점의 상수라는 의도를 직접 표현하려면 `constexpr`가 명확하다.

## constexpr 함수는 컴파일 중에도 계산할 수 있다

로그를 여러 페이지로 나눠 보여 주려면 전체 줄 수에서 페이지 수를 계산해야 한다. `line_count`는 전체 줄 수이고, `page_size`는 한 페이지에 넣을 줄 수다. 여기서는 `page_size`가 1 이상이라는 전제로 계산한다.

```cpp
constexpr std::size_t page_count(std::size_t line_count,
                                 std::size_t page_size)
{
    return line_count / page_size + (line_count % page_size != 0);
}
```

나눈 몫에 나머지가 있으면 1을 더한다. 45줄을 20줄씩 나누면 세 페이지이고, 0줄이면 페이지도 0개다. 이 방식은 나누기 전에 전체 줄 수에 값을 더하지 않으므로, 올림 계산을 위한 덧셈에서 정수 범위를 넘는 문제를 피한다.

컴파일 시점에 호출할 필요가 있는 함수에는 `constexpr`를 붙인다.<sup>[F.4](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#rf-constexpr)</sup> `constexpr` 변수와 이런 단일 반환문 형태의 `constexpr` 함수는 C++11부터 사용할 수 있다.

함수의 `constexpr`는 모든 호출을 컴파일할 때 처리한다는 뜻이 아니다. 인자와 실행되는 연산이 상수식의 조건을 충족하면 컴파일 중에도 평가할 수 있다는 뜻이다.

## 같은 함수가 실행 중 입력도 처리한다

고정된 45줄의 페이지 수는 미리 계산할 수 있다. 실제 파일의 줄 수는 파일을 읽은 뒤에야 알 수 있다. 아래의 `read_line_count()`는 파일을 읽어 줄 수를 `std::size_t`로 반환하는 함수다.

```cpp
constexpr auto example_pages = page_count(45, 20);

const auto total_lines = read_line_count();
const auto actual_pages = page_count(total_lines, 20);
```

`example_pages`는 상수식으로 초기화해야 하므로 `page_count(45, 20)`을 컴파일 시점에 평가한다. `actual_pages`는 실행 중에 얻은 줄 수로 계산한다. 두 경우 모두 같은 함수를 사용한다.

`actual_pages` 선언을 `constexpr`로 바꾸면 오류가 된다. `total_lines`가 `const`여도 파일을 읽어서 얻은 값이라는 점은 달라지지 않는다.

일반 변수의 초기값으로 `page_count(45, 20)`을 사용하는 경우에는 컴파일러가 최적화로 미리 계산할 수도 있다. 그러나 코드에서 상수식 평가를 요구한 것은 아니다. 컴파일 시점의 계산을 요구하려면 `constexpr` 변수의 초기값처럼 상수식이 필요한 위치에 사용한다.<sup>[F.4](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#rf-constexpr)</sup>

## 크기와 조건을 컴파일할 때 확인한다

고정된 기본 페이지의 줄을 담는 `std::array`를 만든다고 하자. `std::array`는 크기가 타입의 일부이므로 원소 개수에 상수식이 필요하다.

```cpp
constexpr std::size_t default_page_size{20};
std::array<std::string, default_page_size> page;
```

`page`는 문자열 20개를 담는다. 크기를 정하는 값이 `constexpr`라고 해서 배열 자체까지 읽기 전용이 되는 것은 아니다. 이 배열의 각 문자열에는 실행 중에 읽은 로그 줄을 넣을 수 있다.

페이지 크기를 설정 파일에서 읽는다면 그 값으로 `std::array`의 크기를 정할 수 없다. 실행 중에 크기를 정해야 할 때는 `std::vector` 같은 컨테이너를 사용한다.

`static_assert`도 상수식이 필요한 위치다. 페이지 계산이 지켜야 할 조건을 다음처럼 표현할 수 있다.

```cpp
static_assert(page_count(40, 20) == 2, "full pages");
static_assert(page_count(45, 20) == 3, "partial page");
```

조건이 거짓이거나 상수식으로 평가할 수 없으면 컴파일이 실패한다. 이 두 조건을 통과했다고 모든 입력에서 계산이 올바르다는 뜻은 아니다. 페이지 크기가 양수여야 한다는 전제도 별도로 지켜야 한다.

## 계산 경로가 상수식의 조건을 충족해야 한다

앞의 함수에 페이지 크기 0을 전달하면 나눗셈을 할 수 없다. 이 호출은 상수식으로 사용할 수 없다.

```cpp
constexpr auto invalid_pages = page_count(45, 0);  // 오류: 0으로 나눔
```

실행 중에 설정에서 읽은 크기를 넘길 때도 1 이상인지 먼저 확인해야 한다. `constexpr`를 붙였다고 실행 중 호출에 입력 검사가 자동으로 추가되지는 않는다.

함수 안의 모든 지역 변수가 상수일 필요는 없다. C++14부터는 `constexpr` 함수 안에서 지역 변수의 값을 바꾸거나 반복문을 사용할 수도 있다. 컴파일 중 평가되는 경로에서 허용된 연산만 수행해야 한다는 조건은 그대로다. 사용할 수 있는 연산과 라이브러리 함수는 C++ 표준 버전에 따라 다르다.

상수식 평가에 사용하는 함수는 호출 위치에서 정의를 확인할 수 있어야 한다. 여러 소스 파일에서 컴파일 시점 계산에 쓸 함수는 보통 헤더에 정의한다. 선언만 헤더에 두고 구현을 다른 소스 파일에 숨기면, 호출하는 쪽에서 그 계산을 상수식으로 평가할 수 없다.

## 실행 중 정책을 읽는 함수와 계산을 구분한다

모든 함수를 `constexpr`로 만들 필요는 없다. 파일을 읽거나 사용자의 입력을 받는 작업은 실행 중에 일어난다. 그런 입력에 의존하는 결과는 컴파일할 때 결정할 수 없다.<sup>[F.4](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#rf-constexpr)</sup>

지금은 고정된 숫자를 반환하더라도, 나중에 설정이나 업무 정책에 따라 달라질 API라면 `constexpr`로 약속하지 않는 게 좋다. 호출자가 그 값을 배열 크기나 다른 상수식에 사용하기 시작하면, 실행 중 설정으로 바꿀 때 호출하는 코드도 수정해야 한다.

페이지 크기를 설정에서 읽는 함수와, 전달받은 숫자로 페이지 수를 계산하는 함수를 분리하면 이런 변경을 다루기 쉽다. 설정을 읽는 쪽은 실행 중에 동작하고, `page_count`는 고정된 값과 실행 중 입력 양쪽에 사용할 수 있다.

이전 글: [7. const로 변경 가능한 범위를 줄이기](/posts/cpp-core-guidelines-07-const-and-mutation/)
