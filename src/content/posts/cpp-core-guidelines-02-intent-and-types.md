---
title: C++ Core Guidelines 2편 의도와 단위를 코드의 타입으로 표현하기
description: 재시도 횟수와 시간 간격 예제로 이해하는 타입 안전성과 의도를 드러내는 인터페이스 설계
date: 2026-11-19
category: 개발/C++/Core Guidelines
art: code
---

[전체 연재 목차](/posts/cpp-core-guidelines/) · 1부 가이드라인을 읽는 기준

네트워크 요청을 다시 시도하려면 횟수와 대기 간격을 정해야 한다. 두 값을 정수로 받는 함수는 쉽게 만들 수 있다. 다만 호출할 때마다 어느 숫자가 횟수이고 어느 숫자가 시간인지 확인해야 한다.

P.1과 P.3는 함수 이름과 타입에서 의도를 읽을 수 있게 하라고 권한다. 재시도 설정에 이 원칙을 적용하면서 P.4의 타입 안전성, P.11과 ES.2의 추상화도 함께 살펴본다.

## 정수 두 개가 서로 바뀌어도 컴파일된다

아래는 함수 선언과 호출 형태만 보여주는 코드다.

```cpp
void configure_retry(int retries, int interval_ms);

// 호출하는 함수 안에서 사용하는 예
// configure_retry(3, 500);
// configure_retry(500, 3);
```

두 인자의 타입이 모두 `int`여서 컴파일러는 순서가 뒤집혔는지 알 수 없다. `configure_retry(500, 3)`도 타입 관점에서는 올바른 호출이다. 재시도를 500번 해야 하는 상황일 수도 있기 때문이다.

인자 이름과 주석은 사람에게 차이를 설명한다. 그 차이를 컴파일러도 검사하게 하려면, 섞여서는 안 되는 값에 서로 다른 타입을 줄 수 있다.

## 횟수와 시간 간격에 서로 다른 타입을 준다

다음 프로그램은 재시도 정책을 만들고 그 값을 출력한다. 실제 네트워크 요청이나 대기는 수행하지 않는다.

```cpp
#include <chrono>
#include <iostream>

struct RetryCount {
    int value;
};

struct RetryPolicy {
    RetryCount retries;
    std::chrono::milliseconds interval;
};

void print_policy(const RetryPolicy& policy)
{
    std::cout << "retries=" << policy.retries.value
              << ", interval=" << policy.interval.count()
              << "ms\n";
}

int main()
{
    const RetryPolicy policy{
        RetryCount{3},
        std::chrono::milliseconds{500}
    };
    print_policy(policy);
}
```

출력은 다음과 같다.

```text
retries=3, interval=500ms
```

`RetryCount`는 재시도 횟수에 붙인 새 타입이다. `std::chrono::milliseconds`는 밀리초 단위를 가진 표준 라이브러리 타입이다. `RetryPolicy`는 두 값이 하나의 정책을 이룬다는 관계를 표현한다.

`const RetryPolicy&`는 함수가 정책을 참조해서 읽도록 하는 매개변수다. 여기서는 정책을 복사하거나 수정하지 않고 출력한다는 의도를 읽을 수 있다. 값과 참조를 선택하는 자세한 기준은 함수 편에서 다룬다.

이제 초기화 순서를 다음처럼 바꾸면 컴파일에 실패한다. 위 프로그램의 `policy` 선언을 바꿔 확인할 수 있다.

```cpp
const RetryPolicy policy{
    std::chrono::milliseconds{500},
    RetryCount{3}
};
```

첫 번째 멤버에 필요한 `RetryCount` 대신 시간 타입이 전달되어 실패한다. 앞의 정수 두 개를 받는 선언에서는 잡지 못했던 순서 오류를 컴파일러가 찾아낸다.

## 이름만 바꾸는 별칭과 새 타입은 다르다

`using RetryCount = int;`처럼 별칭을 선언하면 코드에서 의미 있는 이름을 쓸 수 있다. 하지만 원래 타입은 여전히 `int`다. 서로 다른 의미의 정수를 구분해 잘못된 전달을 막으려는 목적에는 별도의 타입이 필요하다.

함수 안에서 잠깐 쓰는 반복 횟수까지 구조체로 감싸면 이해해야 할 타입 이름이 늘어난다. 다음처럼 값의 의미가 혼동되기 쉬운 경계부터 별도 타입을 검토하면 좋다.

- 같은 기본 타입의 인자가 나란히 있고 순서를 자주 확인한다.
- 초와 밀리초, 원과 달러처럼 단위를 혼동할 수 있다.
- 여러 값을 항상 함께 전달하며 그 묶음에 이름을 붙일 수 있다.

## 타입을 만들었다고 값까지 검증되는 것은 아니다

지금의 `RetryCount`에는 `RetryCount{-1}`도 넣을 수 있다. `std::chrono::milliseconds{-500}`도 유효한 시간 간격 표현이다. 두 타입은 횟수와 시간을 구분하지만, 재시도 정책에서 허용할 범위까지 검사하지는 않는다.

음수나 지나치게 큰 값이 들어오면 안 되는 프로그램이라면 별도의 검증이 필요하다. 입력을 읽는 지점에서 확인할 수도 있고, 생성자나 팩터리 함수를 통해 유효한 값만 가진 객체를 만들 수도 있다.

잘못된 형 변환, 수명이 끝난 객체의 참조, 범위를 벗어난 접근도 따로 살펴야 한다. P.4는 이런 오류가 생길 여지를 줄이는 타입과 인터페이스를 선택하도록 권한다.

## 복잡한 변환은 경계 안에 모은다

이미 사용하는 외부 API가 `int retries, int interval_ms`를 요구할 수도 있다. 그렇다면 프로그램의 모든 호출 지점에서 `.value`와 `.count()`를 꺼내기보다, 해당 API를 부르는 작은 함수 안에 변환을 모을 수 있다.

변환을 맡은 함수에서 횟수와 시간 범위를 검사한 뒤 외부 API에 전달한다. 이때 `count()`의 반환 타입이 API의 `int`와 같은지, 값이 그 범위에 들어가는지도 확인해야 한다. 호출하는 곳마다 이런 변환을 반복하지 않아도 되도록 한곳에 모은다.

P.11과 ES.2의 추상화를 적용하면 호출하는 쪽이 알아야 할 내부 사정이 줄어든다. API를 부를 때마다 변환 순서와 단위 계산을 직접 챙겨야 한다면 그 작업을 맡길 함수가 더 필요한지 살펴볼 수 있다.

관련 규칙은 P.1, P.3, P.4, P.11, ES.2다. 원문의 철학과 표현식 장에서 이유와 적용 예를 확인할 수 있다.

<div class="source-card">
  <a href="https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#s-philosophy" target="_blank" rel="noopener">
    <svg class="card-outline" aria-hidden="true" focusable="false"><rect x="1" y="1" rx="7" pathLength="1"></rect></svg>
    <strong>의도와 타입 안전성에 관한 Core Guidelines</strong>
    <small>C++ Core Guidelines · isocpp.github.io</small>
    <span role="img" aria-label="새 탭에서 열기">↗</span>
  </a>
</div>

## 예제 실행과 적용

완전한 프로그램을 `retry_policy.cpp`로 저장하면 다음과 같이 실행할 수 있다. Linux의 GCC 14.2.0에서 C++20으로 출력과 잘못된 초기화의 컴파일 실패를 확인했다. 이 예제 자체에 쓰인 기능은 C++11부터 사용할 수 있다.

```sh
g++ -std=c++20 -Wall -Wextra -Wpedantic -Wconversion retry_policy.cpp -o retry_policy
./retry_policy
```

기본 타입 인자가 나란히 있는 함수를 하나 찾아, 순서를 바꾸어도 컴파일되는지 확인해 보자. 단위나 역할이 서로 다르다면 타입을 나눌 후보가 된다. 다음 글에서는 타입 검사로 확인할 조건과 실행 중 값을 읽어야 확인할 조건을 다룬다.

[이전 글: 목적과 읽는 순서](/posts/cpp-core-guidelines-01-reading-guide/) · [전체 목차](/posts/cpp-core-guidelines/) · [다음 글: 오류를 확인할 시점](/posts/cpp-core-guidelines-03-checks-and-errors/)
