---
title: C++ Core Guidelines 11편 열거형의 연산과 값, 기반 타입 정하기
description: 외부 코드와 비트 플래그를 예로 살펴보는 열거형 값의 검증과 연산 설계
date: 2026-11-19
category: 개발/C++/Core Guidelines
art: code
---

[전체 연재 목차](/posts/cpp-core-guidelines/) · 2부 변수와 표현식부터 안전하게

열거형의 `waiting = 0, paid = 1, shipped = 2`처럼 기본값과 같은 숫자를 나열할 필요는 대개 없다. 숫자가 외부 형식과 연결되지 않는다면 반복해서 적는 셈이고, 항목을 추가하거나 복사하다가 값이 겹칠 여지도 생긴다.

Enum.7과 Enum.8은 기반 타입과 열거자 값에 별도 요구가 있을 때 명시하도록 권한다. Enum.4는 정수 변환을 사용하는 곳마다 반복하지 않도록, 열거형에 필요한 연산을 정의하라고 권한다.

## 숫자가 외부 약속이라면 값을 명시한다

읽기 명령은 16, 쓰기 명령은 32라고 약속한 프로그램이다. 설명을 위해 만든 가상의 코드이며 실제 장치나 공개 프로토콜과는 관계없다.

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

`static_cast<Command>(raw)`부터 수행하면 허용한 명령인지 확인할 기회를 놓칠 수 있다. 17은 기반 타입에 들어가지만 이름 붙인 명령은 아니고, 큰 정수는 변환 중 값이 바뀔 수도 있다. 원래 입력을 검사한 뒤 열거자로 바꾼다.

## 기반 타입의 크기와 저장 형식은 구분한다

`enum class`는 기반 타입을 생략하면 `int`를 사용한다. 예제는 작은 코드 값을 담으려고 `unsigned char`를 선택했다. 다만 `unsigned char`의 크기가 모든 환경에서 정확히 8비트인 것은 아니다. 정확한 폭이 필요하면 해당 환경의 `std::uint8_t` 제공 여부를 확인한다.

파일이나 네트워크의 저장 형식에는 기반 타입 외에도 다중 바이트 값의 바이트 순서, 메시지 구조와 버전 처리를 정해야 한다. 기반 타입 지정만으로 객체의 바이트를 그대로 전송할 근거가 생기지는 않는다. 내부에서만 쓰는 평범한 상태 값에는 기본 기반 타입이면 충분할 수 있다.

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

정수 캐스트를 연산 구현 안에 모으면 호출하는 코드는 권한의 합집합과 포함 관계로 읽힌다. `contains_all(value, Permission::none)`은 요구하는 비트가 없으므로 참이다. 이 경계 동작도 API의 일부로 정해 두어야 한다.

외부 비트 마스크에는 모르는 비트가 들어올 수 있어 입력 검사가 따로 필요하다. 요일이나 상태 전이를 다룬다면 마지막 값 다음의 동작과 금지할 전이도 정해야 한다. Enum.4는 이런 판단을 연산 안에 모아, 정수에 1을 더하고 다시 캐스트하는 코드를 여러 곳에 복사하지 않도록 한다.

## 확인과 점검 기준

Linux의 GCC 14.2.0에서 C++20으로 실행 프로그램과 권한 선언을 검사했다.

```sh
g++ -std=c++20 -Wall -Wextra -Wpedantic -Wconversion -Werror enum_values.cpp -o enum_values
./enum_values
```

알려진 두 명령과 이름 없는 코드, 음수, 기반 타입 경계를 넘는 입력을 넣어 각각 기대한 경로로 처리되는지 확인했다. 권한은 조합된 경우와 필요한 권한이 빠진 경우를 검사했다. 실제 코드를 검토할 때도 불필요한 연속 번호와 중복 값, 반복된 캐스트를 찾아보면 좋다.

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
