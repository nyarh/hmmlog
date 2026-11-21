---
slug: cpp-core-guidelines-13-integer-ranges-and-arithmetic-errors
title: C++ Core Guidelines 13. 정수의 범위와 산술 오류 다루기
description: 계산 전 범위 검사, 배열 경계, 정수 나눗셈과 나머지 연산의 오류 조건
date: 2026-11-21T06:04:34Z
category: 개발/C++/Core Guidelines
art: code
---

이미지의 전체 픽셀 수는 가로와 세로 크기를 곱해 구한다. 가로와 세로가 각각 50,000이면 픽셀 수는 2,500,000,000이다. 각 크기는 32비트 `int`에 들어가지만 곱한 결과는 들어가지 않는다. 입력값이 타입의 범위 안에 있다는 사실만으로 계산 결과까지 안전해지지는 않는다.

## 결과를 담을 변수보다 계산 타입을 먼저 정한다

`width`와 `height`는 이미지의 가로와 세로 픽셀 수다. 다음 예시는 `int`가 32비트인 환경을 전제로 한다.

```cpp
int width{50000};
int height{50000};
long long pixels = width * height;  // int 곱셈에서 범위를 벗어난다
```

`width * height`의 두 피연산자는 모두 `int`이므로 곱셈도 `int`로 진행된다. 결과를 담는 변수가 `long long`이어도 곱셈 타입은 바뀌지 않는다.

부호 있는 정수의 계산 결과가 표현 범위를 벗어나지 않게 해야 한다.<sup>[ES.103](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#res-overflow)</sup> 이런 범위 초과는 정의되지 않은 동작이다. 항상 음수가 되거나 예외가 발생한다고 기대할 수 없으며, 언어가 이후 동작을 보장하지 않는다.

이 예제에서는 곱하기 전에 한쪽을 `long long`으로 변환하면 다른 쪽도 같은 타입으로 변환되어 계산된다.

```cpp
long long pixels = static_cast<long long>(width) * height;
```

두 값이 각각 50,000일 때의 곱은 `long long`으로 표현할 수 있다. 반면 `static_cast<long long>(width * height)`는 이미 `int`로 곱한 뒤 변환하므로 문제를 해결하지 못한다. 더 큰 타입을 쓸 때도 그 타입이 실제 입력과 중간 결과의 범위를 담을 수 있는지 확인한다.

## 범위 검사는 곱셈 전에 한다

기존 함수가 픽셀 수를 `int`로 반환해야 한다고 하자. 이 함수는 가로와 세로에 0을 허용하며, 음수나 `int`로 표현할 수 없는 픽셀 수는 오류로 처리한다.

`width * height`를 먼저 구한 다음 최댓값과 비교하면 검사 도중에 범위를 벗어날 수 있다. 음수가 아닌 두 정수의 곱은 나눗셈으로 상한을 확인한 뒤 계산할 수 있다.

```cpp
int pixel_count(int width, int height)
{
    if (width < 0 || height < 0)
        throw std::invalid_argument{"이미지 크기는 음수일 수 없다"};

    const int limit = std::numeric_limits<int>::max();
    if (height != 0 && width > limit / height)
        throw std::overflow_error{"픽셀 수가 int 범위를 벗어난다"};

    return width * height;
}
```

`<limits>`의 `std::numeric_limits<int>::max()`는 `int`의 최댓값이다. `height`가 양수일 때 `width`가 `limit / height`보다 크면 두 값의 곱은 `limit`을 넘는다. `&&`는 왼쪽 조건이 거짓이면 오른쪽을 계산하지 않으므로, `height`가 0일 때는 나누지 않고 곱셈 결과 0을 반환한다.

이 검사는 두 입력이 음수가 아니라는 앞선 조건에 의존한다. 음수까지 허용하는 일반 곱셈에 그대로 적용할 수는 없다. 덧셈이나 곱셈 후에 결과의 부호를 보고 오류를 찾는 방식도 부호 있는 정수의 범위 초과를 검사하는 수단으로 사용할 수 없다.

여러 종류의 산술을 반복해서 검사해야 한다면 범위를 검사하는 정수 타입이나 라이브러리를 고려할 수 있다. 오류를 놓쳤을 때의 영향과 검사 비용을 함께 판단한다.<sup>[ES.103](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#res-overflow)</sup>

## 최솟값과 배열의 아래쪽 경계도 확인한다

`std::numeric_limits<int>::min()`은 `int`의 최솟값이다. 이 값에서 1을 더 빼는 계산도 표현 범위를 벗어난다. 값을 줄일 때는 최솟값 아래로 내려가지 않도록 해야 한다.<sup>[ES.104](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#res-underflow)</sup>

배열 접근에서는 정수의 표현 범위와 별도로 원소의 위치를 검사해야 한다. 온도 측정값 세 개가 있고, 현재 위치 바로 앞의 측정값을 읽는다고 하자. 현재 위치가 0이면 `index - 1`은 -1이다. -1은 `int`로 표현할 수 있지만 배열의 유효한 인덱스는 아니다.

```cpp
constexpr int count{3};
int readings[count]{21, 23, 22};
int index{0};

if (index <= 0 || index >= count)
    throw std::out_of_range{"이전 측정값을 읽을 수 없는 위치다"};

int previous = readings[index - 1];
```

이 코드는 현재 위치가 배열 안에 있고 그 앞에도 원소가 있을 때만 접근한다. `index`가 0인 경우에는 오류로 처리한다. 원소가 `count`개인 배열의 인덱스는 0부터 `count - 1`까지다. 일반적인 `readings[index]` 접근을 검사하면서 `index <= count`까지 허용하면 배열 끝을 한 칸 넘게 된다.<sup>[ES.103](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#res-overflow) · [ES.104](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#res-underflow)</sup>

부호 없는 타입의 값이 범위 안에서 순환하는 동작을 의도했다면 모듈러 연산을 사용할 수 있다.<sup>[ES.103](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#res-overflow) · [ES.104](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#res-underflow)</sup> 다만 배열의 크기나 위치를 계산하다 값이 순환하면 원래 계산하려던 수와 달라진다. 타입을 `unsigned`로 바꾸는 것만으로 경계 검사를 대신할 수는 없다.

## 나눗셈과 나머지 연산은 같은 조건을 검사한다

작업 수를 작업자 수로 나누면 한 사람당 맡을 몫과 남은 작업 수를 구할 수 있다. 작업자가 0명일 때는 어느 연산도 수행할 수 없다. 정수의 `/`와 `%`는 모두 두 번째 피연산자가 0이면 정의되지 않은 동작이 된다. 나누기 전에 0인지 검사해야 한다.<sup>[ES.105](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#res-zero)</sup>

일반적인 정수 나눗셈 함수는 몫이 타입의 범위에 들어가는지도 확인해야 한다. C++20의 2의 보수 표현에서는 부호 있는 정수의 최솟값의 절댓값이 최댓값보다 1 크다. 따라서 `int`의 최솟값을 -1로 나눈 양수 몫은 `int`로 표현할 수 없다.

`divide`는 나누어지는 수 `numerator`와 나누는 수 `denominator`를 받아 두 조건을 검사한다.

```cpp
int divide(int numerator, int denominator)
{
    if (denominator == 0)
        throw std::invalid_argument{"0으로 나눌 수 없다"};

    if (numerator == std::numeric_limits<int>::min()
        && denominator == -1)
        throw std::overflow_error{"몫이 int 범위를 벗어난다"};

    return numerator / denominator;
}
```

두 검사를 통과한 뒤에만 정수 몫을 구한다. 정수 나눗셈은 소수 부분을 버리므로 `7 / 2`는 3, `-7 / 2`는 -3이다. 부호를 바꿔 확인하려고 먼저 `-numerator`를 계산하면, 최솟값을 입력받았을 때 그 계산부터 범위를 벗어날 수 있다.

같은 입력으로 나머지를 구하는 함수도 두 조건을 검사해야 한다. 최솟값을 -1로 나눈 나머지가 수학적으로 0이어도, 몫을 결과 타입으로 표현할 수 없으면 C++의 `%` 역시 정의되지 않은 동작이다.

정수 계산을 `double`로 바꾸면 소수 부분과 정밀도를 포함해 계산의 의미가 달라진다. IEEE 754 부동소수점 환경에서는 0으로 나눈 결과가 무한대나 NaN이 될 수 있지만, 그 값이 프로그램에서 허용되는 결과인지 따로 판단해야 한다. 정수 몫을 구하려는 함수라면 입력 조건과 범위를 검사한다.

이전 글: [12. signed와 unsigned를 섞을 때 생기는 일](/posts/cpp-core-guidelines-12-signed-and-unsigned/)
