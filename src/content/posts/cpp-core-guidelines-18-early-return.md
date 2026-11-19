---
title: C++ Core Guidelines 18편 조기 반환과 break로 제어 흐름 정리하기
description: 불필요한 중첩을 줄이고 반복 탈출과 자원 정리의 경계를 드러내는 방법
date: 2026-11-19
category: 개발/C++/Core Guidelines
art: code
---

[전체 연재 목차](/posts/cpp-core-guidelines/) · 2부 변수와 표현식부터 안전하게

입력이 있고, 권한이 있고, 대상이 있을 때만 실행하는 함수는 조건문이 계속 안쪽으로 들어가기 쉽다. 결국 중요한 동작이 여러 겹의 들여쓰기 뒤에 놓인다. F.56은 불필요한 조건 중첩을 줄이고 핵심 동작이 잘 보이게 하라고 권한다.

NR.2는 함수를 반드시 하나의 `return`으로 끝내야 한다는 관행도 권하지 않는다. 일찍 끝낼 조건을 앞에서 처리하면 정상 경로를 더 곧게 읽을 수 있다.

## 처리할 수 없는 경우를 먼저 끝낸다

다음은 주문 번호를 받아 처리 가능한지 확인하는 완전한 프로그램이다. `Trace`는 지역 객체가 언제 정리되는지 보여주기 위한 교육용 타입이며 실제 자원을 관리하지 않는다.

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

입력과 권한 검사를 통과하지 못하면 작업용 객체를 만들기 전에 끝낸다. 검색에 실패한 경우에는 이미 만든 `trace`를 정리하고 반환한다. 성공한 경우에도 함수가 끝나며 같은 정리가 이루어진다.

파일·메모리·잠금을 정리하는 실제 타입도 객체 수명에 정리를 연결하면 반환 위치마다 해제 코드를 복사할 필요가 줄어든다. 이것이 RAII로 이어지는 이유다. 다만 원시 포인터를 지역 변수로 선언했다고 그 대상이 자동 해제되는 것은 아니며, 프로그램을 즉시 종료하는 모든 경로에서 지역 소멸자가 실행되는 것도 아니다.

## return 뒤의 else가 필요한지 살핀다

앞 조건에서 이미 반환했다면 이후 코드는 그 조건을 통과한 경로다. 같은 내용을 `else`로 한 번 더 감쌀 필요가 없는 경우가 많다. 결과 변수를 만든 뒤 여러 겹의 조건에서 값을 바꾸고 마지막에 반환하는 구조도 더 복잡해질 수 있다.

반대로 서로 대등한 두 결과를 선택하는 짧은 `if`와 `else`는 자연스럽다. 반환문을 많이 만드는 것 자체가 목표는 아니다. 정상 동작과 실패 조건이 어느 위치에 있을 때 가장 쉽게 읽히는지 판단한다.

## 반복을 끝내는 방법은 종료 범위로 고른다

ES.77은 복잡한 루프 안에 `break`와 `continue`가 흩어지면 흐름을 놓치기 쉬우므로 사용을 줄이라고 권한다. 필요할 때까지 금지하는 규칙은 아니다.

| 문장 | 끝내거나 건너뛰는 범위 |
| --- | --- |
| `break` | 가장 안쪽 반복문 또는 `switch` 종료 |
| `continue` | 가장 안쪽 반복문의 다음 반복으로 이동 |
| `return` | 현재 함수 종료 |

`switch`가 반복문 안에 있으면 그 안의 `break`는 보통 `switch`만 끝낸다. 중첩 반복에서 안쪽 `break`로 바깥 반복까지 종료되지도 않는다. 원하는 종료 범위가 다르면 탐색을 별도 함수로 분리해 반환하거나 표준 알고리즘을 사용할 수 있다.

예제는 첫 일치 항목을 찾는 일을 `std::ranges::find`로 표현했다. 직접 반복한다면 발견 즉시 `break`로 끝낼 수 있다. 종료하려고 카운터를 상한값으로 덮어쓰는 방식보다 의도가 분명하다. `continue`도 짧은 루프 앞부분에서 처리 대상이 아닌 항목을 거르는 데는 도움이 된다.

## goto와 빈 문장은 의도를 숨기기 쉽다

ES.76은 `goto`를 피하도록 권한다. 원문에는 중첩 반복 전체를 빠져나가 바로 뒤로 이동하는 전방 점프를 예외로 설명한다. 그 경우에도 함수 분리로 더 쉽게 읽히는지 먼저 살펴볼 수 있다. 자원 해제를 위해 여러 레이블로 점프하는 코드라면 수명에 정리를 맡길 수 있는 타입이 있는지도 확인한다.

ES.85는 빈 문장을 보이게 쓰라고 한다. 다음은 설명용 조각이다.

```cpp
while (discard_one()) {
    // 조건식에서 항목 하나를 버린다. 본문에는 할 일이 없다.
}
```

`discard_one`은 항목을 버렸으면 참을 반환하는 가상 함수다. 의도적으로 빈 본문은 이렇게 이유를 남길 수 있다. `if (ready);`처럼 조건 뒤에 실수로 세미콜론이 붙은 상황과 구분하기 쉬워진다. 빈 반복으로 대기하는 동시성 코드는 별도의 동기화 문제이므로 이 예시로 정당화하지 않는다.

Linux의 GCC 14.2.0에서 C++20으로 확인했다. `std::ranges::find` 때문에 C++20을 사용한다.

```sh
g++ -std=c++20 -Wall -Wextra -Wpedantic -Wconversion -Werror early_return.cpp -o early_return
./early_return
```

성공·대상 없음·권한 없음·빈 번호를 검사했고, 생성한 지역 객체가 각 반환 경로에서 정리되는 순서를 확인했다. 실제 파일이나 잠금을 사용한 검사는 아니다. 소유권과 예외가 섞이는 자원 관리의 전체 조건은 4부에서 이어간다.

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
