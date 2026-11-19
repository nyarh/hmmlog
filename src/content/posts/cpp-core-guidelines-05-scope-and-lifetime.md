---
title: C++ Core Guidelines 5편 변수가 필요한 곳과 살아 있는 범위
description: 선언 위치와 이름 가림을 정리하고 변수의 범위와 객체 수명을 구분하는 기준
date: 2026-11-19
category: 개발/C++/Core Guidelines
art: code
---

[전체 연재 목차](/posts/cpp-core-guidelines/) · 2부 변수와 표현식부터 안전하게

함수 첫 줄에 변수를 모아 선언하면 이름은 한눈에 보인다. 그 대신 실제 사용하는 줄까지 내려가며 값이 채워졌는지, 중간에 바뀌지는 않았는지 추적해야 한다. 쓰는 곳과 선언이 멀수록 변수 하나를 이해하려고 읽어야 할 코드도 늘어난다.

ES.5와 ES.21은 이름을 필요한 범위 안에 두고 처음 쓰는 곳 가까이에서 선언하라고 권한다. 각 변수가 맡은 일과 사용 기간이 짧게 드러나도록 만드는 방법이다.

## 검색 결과는 검색을 처리하는 동안만 둔다

재고 조회 프로그램에서 검색 결과를 어디에 선언하는지 보자. 아래 코드는 그대로 컴파일해 실행할 수 있다.

```cpp
#include <iostream>
#include <map>
#include <string>

void print_stock(const std::map<std::string, int>& stock,
                 const std::string& item)
{
    if (const auto found = stock.find(item); found != stock.end()) {
        std::cout << item << '=' << found->second << '\n';
    } else {
        std::cout << item << "=missing\n";
    }
}

int main()
{
    const std::map<std::string, int> stock{
        {"pen", 3}, {"paper", 0}
    };
    print_stock(stock, "pen");
    print_stock(stock, "paper");
    print_stock(stock, "book");

    for (int attempt{1}; attempt <= 2; ++attempt) {
        std::cout << "attempt=" << attempt << '\n';
    }
}
```

출력은 다음과 같다.

```text
pen=3
paper=0
book=missing
attempt=1
attempt=2
```

`found`는 `if`의 초기화 부분에서 선언한다. 조건식과 양쪽 분기에서 사용할 수 있고, `if`문이 끝나면 사용할 수 없다. 검색 성공 여부를 먼저 확인하므로 실패한 반복자를 역참조하지 않으며, 재고 0과 항목 없음도 구분한다.

`attempt` 역시 `for` 안에서만 필요하다. ES.6의 방식으로 초기화 부분에 선언하면 반복이 끝난 다음 다른 용도로 쓰지 못한다. `for` 초기화 선언은 오래전부터 가능하며, 위의 `if (초기화; 조건)` 문법에는 C++17 이상이 필요하다.

## 값을 알게 된 지점에서 이름을 만든다

ES.22는 초기값을 정할 수 있는 지점에서 선언하라고 권한다. 아래 조각은 선언과 값의 결정을 가까이 둔 경우를 비교한다.

```cpp
// 선언과 값의 결정이 떨어져 있다.
int total;
// 중간 작업들...
total = unit_price * quantity;

// 값이 준비된 곳에서 선언한다.
const int order_total{unit_price * quantity};
```

두 번째 형태의 `order_total`은 선언한 줄에서 초기값을 알 수 있다. 곱셈 결과가 `int` 범위에 들어가는지는 별도로 검사해야 한다. 선언 위치를 옮기는 작업과 산술 범위를 확인하는 작업은 따로 필요하다.

클래스 객체도 처음부터 필요한 상태로 만들면 기본 생성 후 대입하는 단계를 피할 수 있다. 비용 차이는 타입에 따라 달라진다. NR.1은 사용 지점과 초기값을 가까이 두기 위해 모든 선언을 함수 맨 위에 모으지 말라고 설명한다.

## 같은 이름과 같은 변수를 재활용하지 않는다

안쪽 블록에서 바깥과 같은 이름을 선언하면 바깥 이름이 가려진다. ES.12가 경계하는 이름 가림이다.

```cpp
// 설명용: 안쪽 count는 바깥 count와 다른 변수다.
int count{0};
{
    int count{3};
    // 여기서 count를 바꿔도 바깥 count는 바뀌지 않는다.
}
```

`retry_count`, `item_count`처럼 서로 다른 개념에는 다른 이름을 붙인다. 재시도 횟수를 담던 변수에 나중에는 상품 개수를 넣으면 이름의 뜻이 바뀌고, 이전 값이 남았는지도 확인해야 한다. ES.26은 이런 재사용을 피하라고 권한다.

버퍼 할당을 줄이기 위해 저장 공간을 재사용하는 경우는 있다. 그때도 유효한 길이와 초기화 범위를 매번 확인해야 한다. 상속에서 같은 함수 이름을 사용하는 문제는 별도의 오버로드·이름 탐색 규칙이 얽히므로 59편에서 다룬다.

## 이름의 범위와 객체의 수명은 다르다

범위는 이름을 찾아 사용할 수 있는 코드 영역이다. 수명은 객체가 생성되어 유효하게 존재하는 기간이다. 보통 자동 지역 객체는 블록을 떠날 때 소멸하므로 둘이 비슷해 보이지만 항상 같지는 않다.

- 지역 `static` 객체는 블록 밖에서 그 이름을 쓸 수 없어도 이후 호출까지 살아 있다.
- 동적으로 만든 객체는 그것을 가리키는 지역 포인터의 범위가 끝났다고 자동으로 사라지지 않는다.
- 참조와 포인터의 이름이 보인다고 대상 객체가 살아 있다는 보장은 없다.

파일이나 잠금을 수명에 맞게 정리하는 타입을 쓰면, 지역 객체의 범위를 줄여 자원을 놓는 시점도 앞당길 수 있다. 객체의 수명에 자원 정리를 연결하는 RAII는 32편에서 다룬다.

## 예제 확인

Linux의 GCC 14.2.0에서 아래 명령으로 컴파일했다. 세 가지 재고 조회와 두 번의 반복 출력을 확인했고, `if` 뒤에서 `found`를 사용하도록 바꾼 코드는 컴파일에 실패하는 것도 확인했다.

```sh
g++ -std=c++20 -Wall -Wextra -Wpedantic -Wconversion -Werror scope.cpp -o scope
./scope
```

리뷰에서는 선언과 첫 사용 사이가 긴 변수, 반복 뒤에 다른 용도로 쓰는 변수, 바깥 이름을 가리는 선언을 찾아본다. GCC의 `-Wshadow`로 이름 가림을 찾을 수 있지만, 한 변수에 서로 다른 일을 맡겼는지는 코드의 뜻을 읽어야 한다.

<!-- series-source-and-navigation -->

관련 원문 항목은 **ES.5, ES.6, ES.12, ES.21, ES.22, ES.26, NR.1**다. 아래 문서에서 권고의 이유와 예외를 확인할 수 있다.

<div class="source-card">
  <a href="https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#res-scope" target="_blank" rel="noopener">
    <svg class="card-outline" aria-hidden="true" focusable="false"><rect x="1" y="1" rx="7" pathLength="1"></rect></svg>
    <strong>변수가 필요한 곳과 살아 있는 범위 관련 지침</strong>
    <small>C++ Core Guidelines · isocpp.github.io</small>
    <span role="img" aria-label="새 탭에서 열기">↗</span>
  </a>
</div>

[이전 글: 표준 라이브러리와 도구를 활용하는 출발점](/posts/cpp-core-guidelines-04-libraries-and-tools/) · [전체 목차](/posts/cpp-core-guidelines/) · [다음 글: 초기화와 대입, 중괄호와 소괄호의 차이](/posts/cpp-core-guidelines-06-initialization/)
