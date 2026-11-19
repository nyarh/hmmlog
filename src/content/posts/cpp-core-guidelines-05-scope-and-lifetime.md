---
title: C++ Core Guidelines 5편 변수가 필요한 곳과 살아 있는 범위
description: 선언 위치와 이름 가림을 정리하고 변수의 범위와 객체 수명을 구분하는 기준
date: 2026-11-19
category: 개발/C++/Core Guidelines
art: code
---

[전체 연재 목차](/posts/cpp-core-guidelines/) · 2부 변수와 표현식부터 안전하게

함수 첫 줄에 변수를 모두 선언해 두면 준비물을 한눈에 볼 수 있다. 하지만 실제로 쓰는 곳까지 내려가는 동안 그 값이 바뀌었는지, 아직 채워지지 않았는지 확인해야 한다. 변수 하나를 이해하려고 읽을 코드가 길어지는 셈이다.

ES.5와 ES.21은 이름이 필요한 범위를 작게 만들고 처음 쓰는 곳 가까이에서 선언하라고 권한다. 변수의 개수를 줄이는 것보다 **각 변수가 담당하는 일을 짧고 분명하게 만드는 것**이 목적이다.

## 검색 결과는 검색을 처리하는 동안만 둔다

재고를 찾는 다음 프로그램을 보자. 완전한 실행 예제다.

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

`found`는 `if`의 초기화 부분에서 만든다. 조건식과 양쪽 분기에서는 사용할 수 있지만 `if`문이 끝난 뒤에는 사용할 수 없다. 재고가 0인 상태와 항목 자체가 없는 상태도 구분한다. 검색 실패 때 반복자를 역참조하지 않는 것이 핵심이다.

`attempt` 역시 `for` 안에서만 필요하다. ES.6의 방식으로 초기화 부분에 선언하면 반복이 끝난 다음 다른 용도로 쓰지 못한다. `for` 초기화 선언은 오래전부터 가능하며, 위의 `if (초기화; 조건)` 문법에는 C++17 이상이 필요하다.

## 값을 알게 된 지점에서 이름을 만든다

ES.22는 초기값을 정할 수 있을 때 선언하라고 한 걸음 더 나아간다. 다음은 차이를 보여주는 설명용 조각이다.

```cpp
// 선언과 값의 결정이 떨어져 있다.
int total;
// 중간 작업들...
total = unit_price * quantity;

// 값이 준비된 곳에서 선언한다.
const int order_total{unit_price * quantity};
```

두 번째 형태에서는 `order_total`이 처음부터 어떤 값을 갖는지 알 수 있다. 다만 곱셈 결과가 `int` 범위에 들어가는지는 별도로 확인해야 한다. 선언 위치를 바꿨다고 산술 오류까지 해결되지는 않는다.

클래스 객체에서는 기본 생성 후 대입하는 대신 처음부터 필요한 상태로 생성할 수도 있다. 실제 비용 차이는 타입에 따라 달라진다. NR.1이 함수 맨 위에 모든 선언을 모으는 관행을 권하지 않는 이유도 사용 지점과 초기값을 가까이 두기 위해서다.

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

서로 다른 개념이라면 `retry_count`, `item_count`처럼 이름도 나누는 편이 읽기 쉽다. 같은 변수에 처음에는 재시도 횟수, 나중에는 상품 개수를 담는 것도 ES.26이 피하라는 방식이다. 이전 값이 남았는지 확인해야 하고 이름 하나에 뜻이 두 개 생긴다.

버퍼 할당을 줄이기 위해 저장 공간을 재사용하는 경우는 있다. 그때도 유효한 길이와 초기화 범위를 매번 확인해야 한다. 상속에서 같은 함수 이름을 사용하는 문제는 별도의 오버로드·이름 탐색 규칙이 얽히므로 59편에서 다룬다.

## 이름의 범위와 객체의 수명은 다르다

범위는 이름을 찾아 사용할 수 있는 코드 영역이다. 수명은 객체가 생성되어 유효하게 존재하는 기간이다. 보통 자동 지역 객체는 블록을 떠날 때 소멸하므로 둘이 비슷해 보이지만 항상 같지는 않다.

- 지역 `static` 객체는 블록 밖에서 그 이름을 쓸 수 없어도 이후 호출까지 살아 있다.
- 동적으로 만든 객체는 그것을 가리키는 지역 포인터의 범위가 끝났다고 자동으로 사라지지 않는다.
- 참조와 포인터의 이름이 보인다고 대상 객체가 살아 있다는 보장은 없다.

파일이나 잠금을 관리하는 지역 객체의 범위를 줄이면 자원을 놓는 시점도 앞당길 수 있다. 단, 자원 수명에 맞게 정리하는 타입을 사용했을 때의 이야기다. 그 연결을 만드는 RAII는 32편에서 자세히 살펴본다.

## 예제 확인

Linux의 GCC 14.2.0에서 아래 명령으로 컴파일했다. 세 가지 재고 조회와 두 번의 반복 출력을 확인했고, `if` 뒤에서 `found`를 사용하도록 바꾼 코드는 컴파일에 실패하는 것도 확인했다.

```sh
g++ -std=c++20 -Wall -Wextra -Wpedantic -Wconversion -Werror scope.cpp -o scope
./scope
```

리뷰할 때는 선언에서 첫 사용까지 얼마나 떨어져 있는지, 반복이 끝난 변수를 다시 사용하는지, 안쪽 이름이 바깥 이름을 가리는지 살펴보면 된다. GCC의 `-Wshadow`는 이름 가림을 찾는 데 도움이 되지만, 서로 다른 일을 같은 변수로 처리하는지는 코드의 뜻을 읽어야 한다.

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
