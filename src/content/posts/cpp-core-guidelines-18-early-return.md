---
title: C++ Core Guidelines 18편 조기 반환과 break로 제어 흐름 정리하기
description: 불필요한 중첩을 줄이고 반복 탈출과 자원 정리의 경계를 드러내는 방법
date: 2026-11-19
category: 개발/C++/Core Guidelines
art: code
---

[전체 연재 목차](/posts/cpp-core-guidelines/) · 2부 변수와 표현식부터 안전하게

입력·권한·대상을 차례로 확인할 때마다 조건문을 감싸면 실제 처리 코드가 깊은 들여쓰기 안에 놓인다. F.56은 불필요한 중첩을 줄여 주요 동작을 따라 읽기 쉽게 만들라고 권한다.

NR.2는 함수의 `return`을 반드시 하나로 제한할 필요가 없다고 설명한다. 더 진행할 수 없는 조건을 앞에서 반환하면 정상 처리 경로를 덜 중첩된 형태로 쓸 수 있다.

## 처리할 수 없는 경우를 먼저 끝낸다

아래 전체 프로그램은 주문 번호와 권한을 검사한 뒤 대상을 찾는다. `Trace`는 지역 객체의 생성과 소멸 시점을 출력하는 교육용 타입이며 실제 자원은 관리하지 않는다.

```cpp
#include <algorithm>
#include <iostream>
#include <string>
#include <string_view>
#include <vector>

class Trace {
public:
    explicit Trace(std::string_view id) : id_{id}
    {
        std::cout << "open " << id_ << '\n';
    }
    ~Trace() { std::cout << "close " << id_ << '\n'; }

private:
    std::string id_;
};

bool process(std::string_view id, bool authorized,
             const std::vector<std::string>& pending)
{
    if (id.empty() || !authorized) {
        return false;
    }

    const Trace trace{id};
    const auto found = std::ranges::find(pending, id);
    if (found == pending.end()) {
        return false;
    }

    std::cout << "process " << *found << '\n';
    return true;
}

int main()
{
    const std::vector<std::string> pending{"A", "B"};
    const bool first{process("A", true, pending)};
    const bool missing{process("C", true, pending)};
    const bool denied{process("B", false, pending)};
    std::cout << std::boolalpha
              << "results=" << first << ',' << missing << ',' << denied
              << '\n';
}
```

```text
open A
process A
close A
open C
close C
results=true,false,false
```

입력이나 권한이 잘못되면 작업용 객체를 만들기 전에 반환한다. 검색에 실패했을 때는 이미 만든 `trace`가 정리된 뒤 함수가 끝난다. 처리에 성공해 반환할 때도 같은 정리가 이루어진다.

RAII 타입은 파일·메모리·잠금 같은 자원의 정리를 객체 수명에 연결한다. 이런 타입을 쓰면 반환 위치마다 해제 코드를 복사할 필요가 줄어든다. 지역 원시 포인터만으로는 대상이 자동 해제되지 않으며, 프로그램을 즉시 종료하는 모든 경로에서 지역 객체의 소멸자가 실행되는 것도 아니다.

## return 뒤의 else가 필요한지 살핀다

앞 조건에서 반환했다면 이후는 그 조건을 통과한 코드다. 다시 `else`로 감싸지 않아도 되는 경우가 많다. 반환을 끝으로 모으려고 결과 변수를 여러 중첩 조건에서 바꾸면 오히려 읽기 복잡해질 수 있다.

대등한 두 결과를 고르는 짧은 `if`와 `else`는 그대로 읽기 좋다. 정상 동작과 실패 조건을 어느 위치에 두어야 흐름이 잘 보이는지 판단한다.

## 반복을 끝내는 방법은 종료 범위로 고른다

ES.77은 복잡한 루프 곳곳에 흩어진 `break`와 `continue`를 줄이도록 권한다. 필요하면 사용하되 어느 반복을 끝내거나 건너뛰는지 쉽게 보이게 둔다.

| 문장 | 끝내거나 건너뛰는 범위 |
| --- | --- |
| `break` | 가장 안쪽 반복문 또는 `switch` 종료 |
| `continue` | 가장 안쪽 반복문의 다음 반복으로 이동 |
| `return` | 현재 함수 종료 |

`switch`가 반복문 안에 있으면 그 안의 `break`는 보통 `switch`만 끝낸다. 중첩 반복에서 안쪽 `break`로 바깥 반복까지 종료되지도 않는다. 원하는 종료 범위가 다르면 탐색을 별도 함수로 분리해 반환하거나 표준 알고리즘을 사용할 수 있다.

예제의 `std::ranges::find`는 첫 일치 항목을 찾는다. 직접 루프를 쓴다면 발견했을 때 `break`로 끝낼 수 있어, 카운터를 상한으로 덮어쓰는 방식보다 종료 의도가 분명하다. 짧은 루프 앞부분에서 처리 대상이 아닌 항목을 거를 때는 `continue`도 도움이 된다.

## goto와 빈 문장은 의도를 숨기기 쉽다

ES.76은 `goto`를 피하도록 권한다. 원문에는 중첩 반복 전체를 빠져나가 바로 뒤로 이동하는 전방 점프를 예외로 설명한다. 그 경우에도 함수 분리로 더 쉽게 읽히는지 먼저 살펴볼 수 있다. 자원 해제를 위해 여러 레이블로 점프하는 코드라면 수명에 정리를 맡길 수 있는 타입이 있는지도 확인한다.

ES.85는 빈 문장을 보이게 쓰라고 한다. 다음은 설명용 조각이다.

```cpp
while (discard_one()) {
    // 조건식에서 항목 하나를 버린다. 본문에는 할 일이 없다.
}
```

`discard_one`은 항목 하나를 버렸으면 참을 반환하는 가상 함수다. 조건식이 작업을 맡아 본문이 비어 있다는 설명을 남기면, 실수로 세미콜론을 붙인 `if (ready);` 같은 코드와 구분하기 쉽다. 빈 반복으로 대기하는 동시성 코드에는 별도의 동기화 검토가 필요하므로 이 예시만으로 판단해서는 안 된다.

Linux의 GCC 14.2.0에서 C++20으로 확인했다. `std::ranges::find` 때문에 C++20을 사용한다.

```sh
g++ -std=c++20 -Wall -Wextra -Wpedantic -Wconversion -Werror early_return.cpp -o early_return
./early_return
```

성공·대상 없음·권한 없음·빈 번호의 경로에서 결과를 확인하고, 생성된 지역 객체의 정리 순서도 살폈다. 실제 파일이나 잠금으로 검사한 결과는 아니다. 소유권과 예외를 포함한 자원 관리 조건은 4부에서 이어간다.

<!-- series-source-and-navigation -->

관련 원문 항목은 **F.56, ES.76, ES.77, ES.85, NR.2**다. 아래 문서에서 권고의 이유와 예외를 확인할 수 있다.

<div class="source-card">
  <a href="https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#f-nesting" target="_blank" rel="noopener">
    <svg class="card-outline" aria-hidden="true" focusable="false"><rect x="1" y="1" rx="7" pathLength="1"></rect></svg>
    <strong>조기 반환과 break로 제어 흐름 정리하기 관련 지침</strong>
    <small>C++ Core Guidelines · isocpp.github.io</small>
    <span role="img" aria-label="새 탭에서 열기">↗</span>
  </a>
</div>

[이전 글: 범위 for와 반복 조건 선택하기](/posts/cpp-core-guidelines-17-loops/) · [전체 목차](/posts/cpp-core-guidelines/) · [다음 글: 매크로와 C식 가변 인자의 대안 찾기](/posts/cpp-core-guidelines-19-macros-and-varargs/)
