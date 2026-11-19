---
title: C++ Core Guidelines 2. 의도와 단위를 타입으로 표현하기
description: 이름과 타입으로 인자의 의미와 단위를 구분하는 방법
date: 2026-11-19
category: 개발/C++/Core Guidelines
art: code
---

재시도 횟수와 대기 시간을 모두 같은 정수 타입으로 받으면 인자를 뒤바꿔도 컴파일될 수 있다. 호출부의 숫자만 보고는 시간 단위도 알기 어렵다.

[P.1](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#rp-direct)과 [P.3](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#rp-what)은 코드에 의도를 직접 표현하도록 권한다. 이름으로 뜻을 알리고, 서로 혼동하면 안 되는 값에는 구분되는 타입을 사용한다.

## 정수 두 개가 숨기는 의미

다음은 인터페이스를 비교하기 위한 선언이다. 대기 시간의 단위는 주석에만 있다.

```cpp
void retry(int count, int delay); // delay is in milliseconds
```

`retry(3, 500)`과 `retry(500, 3)`은 모두 같은 타입 조합이다. 매개변수 이름과 주석은 읽는 사람을 돕지만, 인자의 순서가 의도와 일치하는지 컴파일러가 판단할 근거는 부족하다.

`using RetryCount = int;`처럼 별칭만 붙여도 새로운 타입이 되지는 않는다. 잘못된 혼합을 막으려면 별개의 타입이 필요하다.

## 횟수와 시간을 구분한 예제

재시도 횟수는 작은 구조체로, 대기 시간은 표준 라이브러리의 시간 타입으로 표현한다. 다음 프로그램은 설정을 출력하는 예제이며 실제 재시도나 대기는 수행하지 않는다.

```cpp
#include <chrono>
#include <iostream>

struct RetryCount {
    int value;
};

void show_policy(RetryCount retries, std::chrono::milliseconds delay)
{
    std::cout << "retries: " << retries.value << '\n';
    std::cout << "delay_ms: " << delay.count() << '\n';
}

int main()
{
    show_policy(RetryCount{3}, std::chrono::milliseconds{500});
}
```

`policy.cpp`로 저장한 뒤 다음 명령으로 빌드한다. Linux의 GCC 14.2.0에서 확인했다.

```sh
g++ -std=c++20 -Wall -Wextra -Wpedantic -Wconversion -Werror policy.cpp -o policy
./policy
```

```text
retries: 3
delay_ms: 500
```

호출부를 다음과 같이 바꾸면 타입이 맞지 않아 컴파일에 실패한다.

```cpp
show_policy(std::chrono::milliseconds{500}, RetryCount{3});
```

`std::chrono::milliseconds`에는 밀리초라는 단위가 포함된다. `std::chrono::seconds{1}`을 전달하면 밀리초로 변환돼 출력값은 1000이 된다. 단위 변환을 직접 계산할 필요가 줄어든다.

## 타입으로 보장할 수 있는 범위

[P.4](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#rp-typesafe)는 가능한 한 컴파일 시점에 타입 안전성을 확보하는 것을 목표로 한다. 예제의 두 타입은 횟수와 시간을 섞는 실수를 막는다.

`RetryCount{-1}`은 여전히 생성할 수 있다. 음수를 금지하려면 생성자나 입력 경계에서 값을 검사해야 한다. 시간 타입도 음수나 업무상 지나치게 큰 시간을 자동으로 거부하지 않는다.

강제 변환을 남용하면 타입 검사의 효과가 줄어든다. 먼저 매개변수 설계를 살펴보고, 변환이 필요한 곳에는 허용 범위를 명시한다. 배열 범위와 객체 수명 역시 타입 검사만으로 모두 보장되지는 않는다.

P.4는 union, 캐스트, 배열에서 포인터로의 변환, 범위 오류, 정보가 줄어드는 축소 변환을 주요 문제 영역으로 꼽는다. 서로 다른 타입 중 하나를 저장할 때는 C++17의 표준 variant 같은 대안을 검토할 수 있다. 포인터와 원소 수를 함께 다루는 방식은 다음 글에서 설명한다.

## 반복되는 저수준 처리를 모으기

[P.11](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#rp-library)은 복잡한 저수준 처리를 인터페이스 안에 모으도록 권한다. 외부 API가 시간을 정수 밀리초로 요구한다면, 시간 타입을 정수로 바꾸는 작업을 API 경계에 둘 수 있다. 이때 대상 정수 타입의 범위와 음수 허용 여부도 함께 검사한다.

[ES.2](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#res-abstr)는 프로그램의 개념에 맞는 추상화를 권한다. 타입이나 함수가 의미를 표현하고 반복되는 처리와 오류 가능성을 줄이는지 살핀다.

이름이 있는 표준 알고리즘도 의도를 표현한다. 원소 하나를 찾는 코드라면 탐색 알고리즘을 사용하고, 모든 원소를 읽기만 한다면 수정하지 않는 참조로 순회할 수 있다. 목적이 드러나는 인터페이스와 불필요한 캐스트가 없는지 함께 검토한다.

이전 글: [1. 목적과 읽는 순서](/posts/cpp-core-guidelines-01-reading-guide/) · 다음 글: [3. 컴파일 시점 검사와 실행 중 검사](/posts/cpp-core-guidelines-03-checks-and-errors/)
