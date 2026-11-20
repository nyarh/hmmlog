---
slug: cpp-core-guidelines-03-checks-and-errors
title: C++ Core Guidelines 3. 컴파일 시점 검사와 실행 중 검사
description: 고정된 조건과 입력값을 각 시점에 검사하고 범위 정보를 유지하는 방법
date: 2026-11-19T19:13:52Z
category: 개발/C++/Core Guidelines
art: code
---

사용자가 입력한 개수만큼 화면의 표시등을 켜는 기능을 만든다고 하자. 표시등은 네 개이고, 입력에는 1~4만 허용한다. 표시등의 전체 개수는 코드를 작성할 때 알 수 있지만, 사용자가 넣을 값은 프로그램을 실행해야 알 수 있다.

표시등 개수가 양수라는 조건은 컴파일할 때 확인하고, 입력값의 범위는 표시등의 상태를 바꾸기 전에 확인한다.

## 고정된 조건은 컴파일할 때 검사한다

표시등 개수를 상수로 두고, 그 값이 양수여야 한다는 조건을 함께 적는다.

```cpp
constexpr int light_count = 4;
static_assert(light_count > 0, "light_count must be positive");
```

상수를 0이나 음수로 바꾸면 `static_assert`에서 컴파일 오류가 난다. 이 조건을 프로그램 실행 때마다 검사할 필요가 없다. 컴파일할 때 확인할 수 있는 조건은 그때 검사하는 게 좋다.<sup>[P.5](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#rp-compile-time)</sup>

`static_assert`는 실행 중 입력을 검사할 수 없다. 사용자가 정할 개수에는 별도의 조건문이 필요하다.

## 검사에 필요한 크기를 함께 전달한다

표시등의 상태는 정수 배열로 저장한다. 0은 꺼짐, 1은 켜짐을 뜻한다. 이 배열을 처리 함수에 넘길 때 `int*`만 전달하면 함수는 원소가 몇 개인지 알 수 없다. 포인터와 개수를 따로 전달하면 실제 배열과 다른 개수를 넘길 수도 있다.

실행 중에도 범위를 검사할 수 있도록 원소 수를 함께 유지하는 게 좋다.<sup>[P.6](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#rp-run-time)</sup> C++20의 `std::span`은 연속된 원소의 위치와 개수를 함께 전달하는 뷰다.

```cpp
std::array<int, light_count> lights{};
std::span<int> all_lights{lights};
```

배열에서 뷰를 만들면 배열 크기를 다시 적지 않아도 된다. 위 코드의 `lights`는 원소가 모두 0인 배열이며, `all_lights`는 그 네 원소를 가리킨다.

## 입력값은 사용하기 전에 검사한다

다음 함수는 앞에서부터 지정한 개수의 표시등을 켠다. 나머지 표시등의 상태는 바꾸지 않는다. 개수는 크기를 나타낼 때 쓰는 부호 없는 정수 타입인 `std::size_t`로 받는다. 입력 문자열을 정수로 읽는 과정과 음수 거부는 호출 전에 처리한다고 가정한다.

```cpp
bool turn_on(std::span<int> lights, std::size_t count)
{
    if (count == 0 || count > lights.size()) {
        return false;
    }

    for (int& light : lights.first(count)) {
        light = 1;
    }
    return true;
}
```

개수가 0이거나 전체 크기보다 크면 배열을 바꾸기 전에 `false`를 반환한다. 호출자는 반환값을 보고 잘못된 입력을 알릴 수 있다. 잘못된 값은 다른 상태를 손상하기 전에 발견하는 게 좋다.<sup>[P.7](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#rp-early)</sup>

앞서 만든 배열에서 두 개를 켜는 호출은 다음과 같다. `accepted`는 입력을 받아들였는지 나타낸다.

```cpp
const bool accepted = turn_on(all_lights, 2);
```

`first(count)`는 앞의 `count`개 원소를 가리키는 뷰를 만든다. C++20에서는 개수가 범위를 넘었을 때 이 함수가 자동으로 예외를 던진다고 기대할 수 없다. 호출 전에 크기 조건을 확인해야 한다.

`std::span`은 원소를 소유하지 않는다. 원래 배열이 살아 있는 동안 사용해야 한다. 잘못된 포인터와 길이로 뷰를 만들었다면 뷰만 보고 실제 저장 공간의 크기를 복구할 수도 없다. 예제에서는 배열에서 전체 뷰를 만든 뒤 허용 범위 안에서 앞부분을 선택한다.

## 같은 검사를 불필요하게 반복하지 않는다

날짜를 입력받는 기능에서는 입력 단계에서 유효성을 확인한 뒤 날짜 객체를 다음 함수에 전달할 수 있다. 날짜를 문자열로 바꿔 전달하고 다음 함수에서 다시 해석하면 형식 변환과 유효성 검사가 반복된다.

검사를 앞당길 때는 중복과 비용도 고려해야 한다.<sup>[P.7](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#rp-early)</sup> 사용하지 않을 값까지 비싼 검사를 수행할 필요는 없다. 한 번의 조회로 끝나는 작업에 전체 데이터를 순회하는 검사를 붙이면 입력 크기에 따라 비용이 크게 달라질 수 있다. 값이 들어오는 경계와 실제로 사용하는 위치를 함께 보고 검사 범위를 정한다.

이전 글: [2. 의도와 단위를 타입으로 표현하기](/posts/cpp-core-guidelines-02-intent-and-types/) · 다음 글: [4. 표준 라이브러리와 도구 활용](/posts/cpp-core-guidelines-04-libraries-and-tools/)
