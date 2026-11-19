---
title: C++ Core Guidelines 16편 if와 switch로 분기 의도 드러내기
description: 분기 조건과 switch의 누락된 case 및 의도한 fallthrough를 구분하는 기준
date: 2026-11-19
category: 개발/C++/Core Guidelines
art: code
---

[전체 연재 목차](/posts/cpp-core-guidelines/) · 2부 변수와 표현식부터 안전하게

하나의 상태를 여러 상수와 비교하는 `if`가 이어지면 빠진 경우를 찾기 어렵다. ES.70은 `switch`로 표현할 수 있는 선택에서 `switch`를 우선 고려하라고 권한다. 한 값의 선택지가 모여 보이고, 누락된 열거자도 검사하기 쉽다.

값의 범위를 비교하거나 서로 다른 조건을 조합할 때는 `if`가 자연스럽다. 무엇을 기준으로 분기하는지에 맞춰 구조를 고른다.

## case를 처리한 뒤 어디로 가는지 보이게 한다

아래 전체 프로그램은 알림 종류에 따라 상태·로그·경고를 출력한다. 한 분기에서 다음 분기의 동작까지 수행하려는 곳에 `[[fallthrough]]`를 표시했다.

```cpp
#include <iostream>

enum class Notice { info, warning, error };

void show(Notice notice, bool enabled)
{
    if (!enabled) {
        return;
    }

    switch (notice) {
    case Notice::info:
        std::cout << "status\n";
        break;
    case Notice::warning:
        std::cout << "log\n";
        [[fallthrough]];
    case Notice::error:
        std::cout << "alert\n";
        break;
    }
}

int main()
{
    show(Notice::info, true);
    show(Notice::warning, true);
    show(Notice::error, true);
    show(Notice::error, false);
}
```

```text
status
log
alert
alert
```

`warning`은 로그를 남긴 뒤 `error`의 알림 동작도 수행한다. C++17의 `[[fallthrough]]`는 그 위치에서 다음 레이블로 이어지는 흐름이 의도임을 나타낸다. 흐름 자체를 새로 만드는 문법은 아니며, 일반 주석보다 의도를 분명하게 표시한다.

ES.78은 내용이 있는 `case`를 실수로 다음 분기까지 실행하지 않도록 하라고 권한다. 보통 `break`로 끝내고, 함수의 일을 마쳤다면 `return`, 오류를 전달한다면 `throw`도 흐름을 끝낸다. 의도한 fallthrough는 드물게 명시해서 사용한다. 여러 빈 `case` 레이블이 하나의 동작을 공유하는 경우와도 구분한다.

## default가 의미하는 정책을 정한다

ES.79는 `default`를 나머지 경우의 공통 동작에 사용하라고 설명한다. 일부 상태만 특별하게 처리하고 나머지는 그대로 둔다면, `default`에 아무 일도 하지 않는다는 주석과 `break`를 남길 수 있다.

열거자마다 개별 동작이 필요하면 각각의 `case`를 써서 누락을 드러낸다. 예제도 세 알림을 모두 명시했다. 나머지를 같은 방식으로 처리하는 `default`를 무조건 붙이면 새 열거자에 필요한 변경을 놓칠 수 있다.

GCC의 `-Wswitch-enum`은 `default`가 있어도 빠진 열거자를 경고할 수 있다. 다만 경고 옵션은 도구마다 다르며 모든 입력의 의미를 검사하지는 않는다. 외부 숫자로 만든 이름 없는 열거형 값은 [11편](/posts/cpp-core-guidelines-11-enum-values/)처럼 경계에서 검증한다. 이 예제의 `show`는 선언된 `Notice` 값이 들어온다는 전제이며, 그 외의 값에는 출력하지 않는다.

## bool과 수량을 같은 방식으로 줄이지 않는다

ES.87은 `if (enabled == true)`나 `if (pointer != nullptr)`처럼 중복되는 비교를 줄이도록 권한다. `if (enabled)`, `if (pointer)`는 각각 참인지, 포인터가 비어 있지 않은지 관용적으로 읽힌다. 반대 조건은 `!enabled`, `!pointer`로 표현할 수 있다.

정수에서는 비교할 값과 관계가 조건의 의미를 결정한다. 아래는 수량과 오류 코드를 검사하는 설명용 조각이다.

```cpp
if (remaining > 0) {
    // 남은 수량이 있을 때만 처리한다.
}

if (error_code == 0) {
    // 이 API에서는 0이 성공 코드다.
}
```

`remaining`에 음수가 들어올 수 있다면 `if (remaining)`과 `if (remaining > 0)`은 다르다. 오류 코드 0이 성공인지 실패인지도 API 계약에 달려 있다. 정수에는 두 가지 이상의 의미 있는 값이 있으므로 실제 조건을 적는다.

## 분기 구조를 선택할 때 남는 판단

문자열이나 실수 구간, 여러 객체의 상태를 조합하는 분기는 단순한 `switch`에 담기 어렵다. 이때는 `if`의 조건을 이름 있는 함수나 값으로 나눌 수 있다. 정수 상수 비교에서도 선택한 구조가 조건을 잘 드러내는지 살핀다.

원문은 `switch`의 최적화 가능성도 설명하지만, 항상 `if`보다 빠르다고 보장하지는 않는다. 여기서는 속도를 측정하지 않았다. 가능한 선택지와 각 분기가 끝나는 지점을 읽기 쉬운지 확인했다.

Linux의 GCC 14.2.0에서 C++20으로 모든 알림과 비활성 상태를 확인했다. `[[fallthrough]]`를 빼거나 열거자 분기를 누락한 변형에서는 경고를 오류로 처리해 실패를 확인했다.

```sh
g++ -std=c++20 -Wall -Wextra -Wpedantic -Wconversion -Wswitch-enum -Wimplicit-fallthrough -Werror branches.cpp -o branches
./branches
```

<!-- series-source-and-navigation -->

관련 원문 항목은 **ES.70, ES.78, ES.79, ES.87**다. 아래 문서에서 권고의 이유와 예외를 확인할 수 있다.

<div class="source-card">
  <a href="https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#res-switch-if" target="_blank" rel="noopener">
    <svg class="card-outline" aria-hidden="true" focusable="false"><rect x="1" y="1" rx="7" pathLength="1"></rect></svg>
    <strong>if와 switch로 분기 의도 드러내기 관련 지침</strong>
    <small>C++ Core Guidelines · isocpp.github.io</small>
    <span role="img" aria-label="새 탭에서 열기">↗</span>
  </a>
</div>

[이전 글: 복잡한 식과 평가 순서 풀어 읽기](/posts/cpp-core-guidelines-15-expressions-and-order/) · [전체 목차](/posts/cpp-core-guidelines/) · [다음 글: 범위 for와 반복 조건 선택하기](/posts/cpp-core-guidelines-17-loops/)
