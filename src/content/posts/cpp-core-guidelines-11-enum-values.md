---
title: C++ Core Guidelines 11편 열거형의 연산과 값, 기반 타입 정하기
description: 외부 코드와 비트 플래그를 예로 살펴보는 열거형 값의 검증과 연산 설계
date: 2026-11-19
category: 개발/C++/Core Guidelines
art: code
---

[전체 연재 목차](/posts/cpp-core-guidelines/) · 2부 변수와 표현식부터 안전하게

열거형에 `waiting = 0, paid = 1, shipped = 2`를 적으면 값이 더 분명해 보인다. 하지만 숫자 자체에 외부 의미가 없다면 기본값과 같은 내용을 반복할 뿐이다. 항목을 끼워 넣거나 복사하는 과정에서 값이 겹칠 수도 있다.

Enum.7과 Enum.8은 기반 타입과 열거자 값을 필요한 경우에만 명시하라고 권한다. Enum.4는 열거형에 필요한 연산을 정의해 사용하는 곳마다 정수 변환을 반복하지 않도록 한다.

## 숫자가 외부 약속이라면 값을 명시한다

아래 프로그램은 설명을 위해 만든 가상의 명령 코드를 읽는다. 16은 읽기, 32는 쓰기를 뜻한다고 정했다. 실제 장치나 공개 프로토콜의 코드는 아니다.

```cpp
#include <initializer_list>
#include <iostream>
#include <optional>

enum class Command : unsigned char {
    read = 0x10,
    write = 0x20
};

std::optional<Command> decode_command(int raw)
{
    switch (raw) {
    case 0x10:
        return Command::read;
    case 0x20:
        return Command::write;
    default:
        return std::nullopt;
    }
}

constexpr bool changes_data(Command command)
{
    return command == Command::write;
}

int main()
{
    for (const int raw : {16, 32, 17, -1, 256}) {
        if (const auto command = decode_command(raw)) {
            std::cout << raw << " write=" << std::boolalpha
                      << changes_data(*command) << '\n';
        } else {
            std::cout << raw << " invalid\n";
        }
    }
}
```

```text
16 write=false
32 write=true
17 invalid
-1 invalid
256 invalid
```

숫자를 먼저 검사하고 허용한 열거자만 반환한다. `std::optional`은 값이 있거나 없다는 결과를 표현하는 C++17 타입이다. `if`에서 존재를 확인한 뒤에만 `*command`로 값을 읽는다.

`static_cast<Command>(raw)`를 먼저 하는 방식은 검증을 대신하지 못한다. 예를 들어 17은 기반 타입에 들어가도 이름 붙인 명령은 아니다. 큰 정수는 기반 타입으로 변환되는 동안 값이 달라질 수도 있다. 변환 전에 원래 입력을 검사해야 한다.

## 기반 타입의 크기와 저장 형식은 구분한다

`enum class`의 기반 타입을 생략하면 `int`다. 위 예제는 작은 코드임을 보여주려고 `unsigned char`를 선택했다. `unsigned char`가 모든 환경에서 정확히 8비트라는 뜻은 아니다. 정확한 8비트 타입이 필요한 환경에서는 제공 여부를 확인해 `std::uint8_t`를 검토할 수 있다.

기반 타입을 지정했다고 객체의 바이트를 그대로 파일이나 네트워크로 보내도 되는 것은 아니다. 다중 바이트 값의 바이트 순서, 메시지 구조, 버전 처리는 별도 약속이다. 평범한 프로그램 내부 상태라면 이 문제를 만들지 않고 기본 기반 타입을 사용하면 된다.

전방 선언에도 차이가 있다. `enum class State;`는 기본 기반 타입인 `int`를 사용해 선언할 수 있다. 비범위 열거형을 정의 없이 선언하려면 `enum Flags : unsigned;`처럼 기반 타입이 필요하다. 원문의 Enum.7 주석은 전방 선언과 기반 타입의 관계를 넓게 설명하므로 두 문법을 구분해 읽어야 한다.

## 조합 가능한 값에는 의미 있는 연산을 붙인다

읽기와 쓰기 권한을 함께 담는 비트 플래그에서는 1·2처럼 서로 다른 비트를 명시할 이유가 있다. 다음은 별도로 컴파일해 확인한 선언과 검사 예제다. 실행할 `main` 함수는 없다.

```cpp
enum class Permission : unsigned {
    none = 0,
    read = 1u << 0,
    write = 1u << 1
};

constexpr Permission operator|(Permission left, Permission right)
{
    return static_cast<Permission>(
        static_cast<unsigned>(left) | static_cast<unsigned>(right));
}

constexpr bool contains_all(Permission value, Permission required)
{
    return (static_cast<unsigned>(value) & static_cast<unsigned>(required))
        == static_cast<unsigned>(required);
}

static_assert(contains_all(Permission::read | Permission::write,
                           Permission::write));
static_assert(!contains_all(Permission::read, Permission::write));
```

호출하는 쪽은 권한의 합집합과 포함 관계를 읽는다. 정수 캐스트는 작은 구현 안에 모인다. `contains_all(value, Permission::none)`은 요구하는 비트가 없으므로 참이다. 이런 경계 의미도 API를 만들 때 정해야 한다.

외부 비트 마스크에는 알려지지 않은 비트가 들어올 수 있으므로 이 연산만으로 입력이 검증되지는 않는다. 요일의 다음 값, 상태 전이처럼 다른 도메인에서는 마지막 값 다음의 동작과 허용하지 않는 전이부터 정한다. 정수에 1을 더하고 다시 캐스트하는 코드를 여러 곳에 복사하지 않는 것이 Enum.4의 요지다.

## 확인과 점검 기준

Linux의 GCC 14.2.0에서 C++20으로 실행 프로그램과 권한 선언을 검사했다.

```sh
g++ -std=c++20 -Wall -Wextra -Wpedantic -Wconversion -Werror enum_values.cpp -o enum_values
./enum_values
```

알려진 두 코드, 이름 없는 코드, 음수, 기반 타입 경계를 넘는 예시 입력이 각각 기대한 경로로 들어갔다. 권한 검사는 두 권한의 조합과 누락된 권한을 확인했다. 리뷰에서는 불필요한 연속 번호 지정, 중복 값, 여러 곳에 반복된 정수 캐스트를 살펴보면 된다.

<!-- series-source-and-navigation -->

관련 원문 항목은 **Enum.4, Enum.7, Enum.8**다. 아래 문서에서 권고의 이유와 예외를 확인할 수 있다.

<div class="source-card">
  <a href="https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#renum-oper" target="_blank" rel="noopener">
    <svg class="card-outline" aria-hidden="true" focusable="false"><rect x="1" y="1" rx="7" pathLength="1"></rect></svg>
    <strong>열거형의 연산과 값, 기반 타입 정하기 관련 지침</strong>
    <small>C++ Core Guidelines · isocpp.github.io</small>
    <span role="img" aria-label="새 탭에서 열기">↗</span>
  </a>
</div>

[이전 글: 관련 있는 상수를 enum class로 묶기](/posts/cpp-core-guidelines-10-enum-class/) · [전체 목차](/posts/cpp-core-guidelines/) · [다음 글: signed와 unsigned를 섞을 때 생기는 일](/posts/cpp-core-guidelines-12-signed-and-unsigned/)
