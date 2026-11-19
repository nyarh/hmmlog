---
title: C++ Core Guidelines 6편 초기화와 대입, 중괄호와 소괄호의 차이
description: 미초기화 값을 피하고 중괄호 초기화와 생성자 선택의 차이를 확인하는 방법
date: 2026-11-19
category: 개발/C++/Core Guidelines
art: code
---

[전체 연재 목차](/posts/cpp-core-guidelines/) · 2부 변수와 표현식부터 안전하게

`int count;` 다음 줄에서 값을 넣을 생각이었다가 조건문 하나가 추가되면, 값을 넣지 않은 경로가 생길 수 있다. ES.20은 이런 추적을 줄이기 위해 객체를 초기화해서 사용하라고 권한다. 초기화는 객체를 처음 만드는 일이고 대입은 이미 존재하는 객체의 값을 바꾸는 일이다.

`int count = 3;`도 선언하면서 처음 값을 주므로 초기화다. 이후에 쓰는 `count = 4;`가 대입이다. `=` 기호의 유무보다 객체를 지금 만드는지, 이미 만든 객체를 바꾸는지 구분한다.

## 선언 하나에 이름 하나를 둔다

다음은 문법 차이를 보여주는 조각이다.

```cpp
int* first, second;  // first만 포인터이고 second는 int다.
int* position{nullptr};
int count{0};
```

ES.10과 NL.21은 선언마다 이름을 하나씩 쓰도록 권한다. `*`가 모든 이름에 적용된다고 착각하는 일을 줄이고, 각 값에 맞는 초기화와 설명을 붙일 수 있다. 함수 매개변수 목록과 C++17의 구조적 바인딩처럼 여러 이름을 함께 소개하도록 설계된 문법은 예외다.

지역 정수 `int count;`는 자동으로 0이 되지 않는다. C++20에서 값을 넣기 전에 읽으면 정의되지 않은 동작으로 이어진다. 반면 `std::string name;`은 기본 생성자가 빈 문자열을 만든다. 모든 세미콜론 앞에 초기값 문자가 있어야 한다는 뜻은 아니다. **그 타입의 생성 방식이 유효한 초기 상태를 만드는지**를 확인한다.

## 중괄호가 막는 오류와 바꾸는 의미

ES.23은 `{}` 초기화를 우선 권한다. 정수에 소수를 넣는 축소 변환을 막고, `Widget item();`처럼 객체를 만들려다가 함수를 선언하는 문법적 혼동도 피할 수 있다.

그렇다고 소괄호를 전부 중괄호로 치환하면 안 된다. 다음은 완전한 실행 예제다.

```cpp
#include <iostream>
#include <vector>

int main()
{
    const std::vector<int> repeated(3, 7);
    const std::vector<int> listed{3, 7};
    const int retry_limit = [] {
        constexpr bool offline{true};
        if (offline) {
            return 1;
        }
        return 3;
    }();

    std::cout << "repeated:";
    for (const int value : repeated) {
        std::cout << ' ' << value;
    }
    std::cout << "\nlisted:";
    for (const int value : listed) {
        std::cout << ' ' << value;
    }
    std::cout << "\nretry_limit=" << retry_limit << '\n';
}
```

```text
repeated: 7 7 7
listed: 3 7
retry_limit=1
```

`vector<int>(3, 7)`은 값이 7인 원소 세 개를 만든다. `vector<int>{3, 7}`은 3과 7이라는 원소 두 개를 만든다. 중괄호가 원소 목록을 받는 생성자를 선택하기 때문이다. 크기로 만들고 싶은지, 실제 원소를 나열하는지 구분해야 한다. 이 차이는 ES.64의 `T{e}` 생성 표기 권고에도 함께 나오는 예외다.

중괄호 안의 계산 자체까지 검사해 주는 것은 아니다. `int total{a + b};`에서 `a + b`가 먼저 오버플로한다면 중괄호가 막아주지 못한다. 축소 변환 검사와 산술 범위 검사는 별개다.

## 여러 단계로 정해도 처음부터 const로 만든다

예제의 `[] { ... }()`는 람다를 정의한 뒤 즉시 호출하는 표현식이다. 뒤의 `()`가 호출이고, 람다에서 반환한 값이 `retry_limit`의 초기값이 된다. ES.28은 이런 방식으로 초기화에 필요한 조건과 임시 변수를 한곳에 모으라고 권한다.

조건에 따라 값을 몇 번 대입한 다음 ‘이제부터 안 바꾼다’고 약속하는 대신, 완성된 값으로 `const` 객체를 만들 수 있다. 외부 값을 읽어야 하면 필요한 이름만 캡처하고, 같은 계산을 여러 곳에서 쓴다면 이름 있는 함수로 옮기는 편이 알맞다. 예제에서는 분기를 보여주기 위해 `offline`을 고정했다.

## 초기화 표기를 고르는 기준

| 표현 | 의미와 주의할 점 |
| --- | --- |
| `int n{};` | 정수를 0으로 초기화 |
| `int n{3};` | 정해진 타입으로 초기화하며 축소 변환 제한 |
| `auto n = 3;` | 초기값에서 `int` 추론 |
| `T value{};` | 객체 생성이며 함수 선언과 구분 가능 |
| `T value = {};` | 복사 목록 초기화로 `explicit` 생성자 선택 시 오류 가능 |
| `std::vector<int> v(3);` | 값이 0인 원소 세 개 생성 |
| `std::vector<int> v{3};` | 값이 3인 원소 한 개 생성 |

`T{e}`가 모든 타입의 업무상 유효성을 보장하지도 않는다. 날짜 타입이 2월 30일을 막는지는 생성자 설계에 달려 있다. 먼저 값의 의미를 정하고 그 의도를 표현하는 표기를 고른다.

원문은 곧바로 입력으로 덮어쓸 큰 버퍼를 초기화하지 않는 예외도 언급한다. 이런 최적화에서는 입력이 일부만 채워졌을 때 남은 영역을 읽지 않는지 증명해야 한다. 비용을 확인하지 않았다면 유효한 초기 상태를 만드는 쪽이 관리하기 쉽다.

## 컴파일러가 거부하는 경우도 확인한다

아래 블록은 의도적으로 컴파일에 실패하는 완전한 프로그램이다.

```cpp
int main()
{
    const int count{2.5};
    return count;
}
```

실행 예제를 `initialization.cpp`로 저장해 다음 명령으로 확인했다. Linux의 GCC 14.2.0과 C++20을 사용했다. 벡터의 두 생성 결과와 람다의 양쪽 분기를 확인했으며, 축소 변환 예제는 컴파일 오류를 확인했다. 목록 초기화와 람다는 C++11부터 사용할 수 있다.

```sh
g++ -std=c++20 -Wall -Wextra -Wpedantic -Wconversion -Werror initialization.cpp -o initialization
./initialization
```

<!-- series-source-and-navigation -->

관련 원문 항목은 **ES.10, ES.20, ES.23, ES.28, ES.64, NL.21**다. 아래 문서에서 권고의 이유와 예외를 확인할 수 있다.

<div class="source-card">
  <a href="https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#res-always" target="_blank" rel="noopener">
    <svg class="card-outline" aria-hidden="true" focusable="false"><rect x="1" y="1" rx="7" pathLength="1"></rect></svg>
    <strong>초기화와 대입, 중괄호와 소괄호의 차이 관련 지침</strong>
    <small>C++ Core Guidelines · isocpp.github.io</small>
    <span role="img" aria-label="새 탭에서 열기">↗</span>
  </a>
</div>

[이전 글: 변수가 필요한 곳과 살아 있는 범위](/posts/cpp-core-guidelines-05-scope-and-lifetime/) · [전체 목차](/posts/cpp-core-guidelines/) · [다음 글: const로 변경 가능한 범위를 줄이기](/posts/cpp-core-guidelines-07-const/)
