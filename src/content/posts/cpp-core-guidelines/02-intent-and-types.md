---
slug: cpp-core-guidelines-02-intent-and-types
title: C++ Core Guidelines 2. 의도와 단위를 타입으로 표현하기
description: 재시도 설정을 예로 보는 이름과 타입의 역할
date: 2026-11-19T19:13:51Z
category: 개발/C++/Core Guidelines
art: code
---

네트워크 요청이 일시적으로 실패하면 잠시 기다린 뒤 다시 시도하도록 만들 수 있다. 이 기능에는 최대 재시도 횟수와 시도 사이의 대기 시간이 필요하다. 두 값을 함수에 전달할 때 의미와 단위를 어떻게 구분할지 정해야 한다.

## 같은 정수 타입으로 받는 경우

재시도 설정을 저장하는 함수가 두 값을 정수로 받는다고 하자. 첫 인자는 최대 재시도 횟수이고, 둘째 인자는 밀리초 단위의 대기 시간이다.

```cpp
void set_retry_policy(int max_retries, int delay_ms);

set_retry_policy(3, 500);
set_retry_policy(500, 3);
```

첫 호출은 최대 3번 재시도하고 그 사이에 500밀리초를 기다린다는 뜻이다. 둘째 호출은 두 값을 뒤바꿨지만 인자의 타입은 여전히 `int`, `int`다. 컴파일러는 호출자가 어느 설정을 의도했는지 알 수 없다.

매개변수 이름은 선언을 읽을 때 도움이 된다. 호출부의 숫자만 보면 의미와 단위를 다시 확인해야 한다. 코드의 의도는 이름과 타입으로 직접 드러내는 게 좋다.<sup>[P.1](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#rp-direct) · [P.3](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#rp-what)</sup>

## 횟수와 시간을 다른 타입으로 표현한다

재시도 횟수는 별도의 타입으로, 대기 시간은 표준 라이브러리의 시간 타입으로 표현한다. 타입은 프로그램에서 다루는 개념에 맞게 정한다.<sup>[ES.2](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#res-abstr)</sup>

```cpp
struct RetryCount {
    int value;
};

void set_retry_policy(RetryCount max_retries,
                      std::chrono::milliseconds delay);

set_retry_policy(RetryCount{3}, std::chrono::milliseconds{500});
```

호출부에 횟수와 시간 단위가 드러난다. 두 인자를 뒤바꾸면 요구하는 타입과 맞지 않아 컴파일 오류가 난다. `using RetryCount = int;`처럼 별칭만 붙이는 방식은 새로운 타입을 만들지 않으므로 같은 효과가 없다.

`std::chrono::milliseconds`는 C++11부터 제공된다. 시간 값을 단위와 함께 표현하므로 함수마다 밀리초인지 초인지 따로 약속할 필요가 줄어든다. 초 단위인 `std::chrono::seconds{1}`을 전달하면 밀리초로 변환된다.

## 타입 검사가 보장하는 범위

컴파일러가 타입 사용 오류를 최대한 찾아낼 수 있도록 설계하는 게 좋다.<sup>[P.4](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#rp-typesafe)</sup> 위 예제에서 구분한 것은 횟수와 시간이다. 각 값이 프로그램에서 허용되는 범위에 속하는지는 아직 보장하지 않는다.

`RetryCount{-1}`은 만들 수 있다. 음수를 금지하려면 입력을 받는 곳이나 객체를 만드는 생성자에서 검사해야 한다. 시간 타입도 음수나 업무상 지나치게 긴 시간을 자동으로 거부하지 않는다.

캐스트로 다른 타입을 억지로 맞추면 타입 검사의 효과가 줄어든다. 값이 들어갈 범위를 줄이는 축소 변환, 배열을 포인터로 바꾸면서 길이 정보를 잃는 상황도 살펴야 한다. 서로 다른 타입이 저장 공간을 공유하는 `union`과 배열 범위 오류도 주의할 부분이다.<sup>[P.4](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#rp-typesafe)</sup> 여러 타입 중 하나의 값을 저장할 때는 현재 저장된 타입을 관리하는 C++17의 `std::variant`를 대안으로 검토할 수 있다.

## 복잡한 변환은 경계에 모은다

외부 통신 라이브러리가 대기 시간을 정수 밀리초로만 받는 경우가 있다. 프로그램 내부에서는 시간 타입을 쓰고, 외부 API를 호출하는 함수에서 정수로 변환할 수 있다. 대상 정수 타입에 값이 들어가는지와 음수가 허용되는지도 그곳에서 확인한다.

복잡한 저수준 처리는 인터페이스 안에 모으는 게 좋다.<sup>[P.11](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#rp-library)</sup> 호출하는 곳마다 시간 변환과 범위 검사를 반복하면 한 곳에서 조건을 빠뜨리기 쉽다. 변환을 맡는 함수에 모으면 API의 조건이 바뀔 때 수정할 위치도 분명해진다.

이전 글: [1. 목적과 읽는 순서](/posts/cpp-core-guidelines-01-reading-guide/) · 다음 글: [3. 컴파일 시점 검사와 실행 중 검사](/posts/cpp-core-guidelines-03-checks-and-errors/)
