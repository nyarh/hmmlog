---
slug: cpp-core-guidelines-10-related-constants-and-enum-class
title: C++ Core Guidelines 10. 관련 있는 상수를 enum class로 묶기
description: 로그 수준을 예로 보는 열거형의 타입 구분, 매크로와 이름 충돌, 상수의 분류
date: 2026-11-20T21:02:56Z
category: 개발/C++/Core Guidelines
art: code
---

로그를 남길 때 각 항목을 정보, 경고, 오류로 구분한다고 하자. 함수에 숫자 0, 1, 2를 전달하면 각 숫자가 어떤 수준인지 따로 기억해야 한다. 숫자에 이름을 붙이고, 로그 수준이라는 하나의 타입으로 묶으면 호출하는 코드에서 의미를 읽을 수 있다.

서로 관련된 이름 있는 상수의 집합은 열거형으로 표현하는 게 좋다. 같은 종류의 값이라는 관계를 드러내고, 그 집합에 타입 이름을 부여할 수 있다.<sup>[Enum.2](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#renum-set)</sup>

## 같은 선택지에 속하는 값을 묶는다

`LogLevel`은 로그 수준이고, `write_log`는 해당 수준의 로그를 기록하는 함수다.

```cpp
enum class LogLevel { info, warning, error };

void write_log(LogLevel level);

write_log(LogLevel::warning);
```

`info`, `warning`, `error`를 열거자라고 한다. `LogLevel::warning`은 `LogLevel` 타입의 경고 수준을 뜻한다. `enum class`는 C++11부터 사용할 수 있다.

함수의 매개변수가 `LogLevel`이므로, `write_log(1)`처럼 정수만 넘길 수는 없다. 로그 수준을 요구하는 자리에 아무 정수나 들어오는 실수를 줄인다.

같은 프로그램에 속한 상수라고 해서 모두 하나의 열거형으로 묶지는 않는다. 로그 수준은 로그 항목을 어떻게 분류할지 나타낸다. 로그 한 줄을 읽는 버퍼의 크기와 시간 표시 여부는 서로 다른 설정이므로 각각 적절한 타입의 상수로 둔다.

## enum class는 정수로 자동 변환되지 않는다

기존 코드에서 로그 수준을 일반 열거형 `LegacyLevel`로 정의했다고 하자. `set_line_limit`는 화면에 표시할 최대 줄 수를 정수로 받는 함수다.

```cpp
enum LegacyLevel { legacy_info, legacy_warning, legacy_error };
void set_line_limit(int count);

set_line_limit(legacy_error);
```

이 호출은 허용된다. 일반 열거형의 값이 정수로 자동 변환되기 때문이다. 이 예제의 `legacy_error`는 2로 변환되므로, 로그 수준을 잘못 넘겼는데도 줄 수가 2로 설정된다.

이런 암시적 정수 변환을 피하려면 일반 `enum`보다 `enum class`를 우선하는 게 좋다.<sup>[Enum.3](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#renum-class)</sup> 앞의 `LogLevel`을 사용한 `set_line_limit(LogLevel::error)`는 오류가 된다.

서로 다른 열거형도 구분된다. 로그를 출력할 위치를 `OutputTarget`으로 정의하면, 출력 위치를 로그 수준 자리에 잘못 넣는 호출을 막을 수 있다.

```cpp
enum class OutputTarget { console, file };

write_log(OutputTarget::file);  // 오류: LogLevel과 다른 타입
```

열거형을 숫자로 다루어야 하는 곳은 변환이 필요한 이유를 따로 확인한다. 변환을 추가해 호출을 통과시키는 것만으로는 서로 다른 값의 의미가 맞아지지 않는다.

## 매크로 대신 언어의 타입과 범위를 사용한다

로그 수준을 `#define LOG_WARNING 1`처럼 매크로로 정의할 수도 있다. 이 경우 전처리기는 `LOG_WARNING`을 숫자 1로 바꾼다. 컴파일러가 보는 것은 로그 수준 타입이 없는 정수다.

정수 상수를 나타내는 매크로보다 열거형을 사용하는 게 좋다. 매크로는 C++의 이름 범위와 타입 규칙을 따르지 않으며, 다른 헤더의 정의와 충돌할 수 있다.<sup>[Enum.1](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#renum-macro)</sup> 열거형의 타입과 열거자 이름은 컴파일러가 구분하므로 오류 진단과 디버깅에서도 의미를 추적하기 쉽다.

`enum class`의 열거자에는 타입 이름을 붙여 접근한다. 따라서 로그 수준에 `error`가 있고, 파일 처리 결과를 나타내는 다른 열거형에도 `error`가 있어도 구분할 수 있다. 예를 들어 `LogLevel::error`와 `FileResult::error`는 각 타입에 속한 별개의 이름이다.

선택지 집합이 아닌 개별 상수에는 `constexpr`를 사용할 수 있다. 헤더에서 여러 소스 파일이 공유할 변수를 정의하려는 경우에는 C++17의 `inline` 변수도 고려한다. 열거형과 상수 변수 중 값의 역할에 맞는 것을 고른다.

## 열거자 이름을 모두 대문자로 쓰지 않는다

외부 헤더에 `ERROR`라는 매크로가 정의돼 있다고 하자. 열거자의 이름을 대문자 `ERROR`로 쓰면 전처리 단계에서 충돌할 수 있다.

```cpp
#define ERROR 2
enum class LogLevel { INFO, WARNING, ERROR };  // 전처리 후 문법 오류
```

전처리기는 `ERROR`가 열거자 이름인지 판단하지 않고 2로 치환한다. 결과적으로 열거자 이름이 있어야 할 자리에 숫자가 들어간다. `enum class`로 범위를 나눴더라도 매크로 치환을 막지는 못한다.

매크로와의 충돌을 줄이려면 열거자에 `ALL_CAPS` 형태의 이름을 쓰지 않는 게 좋다.<sup>[Enum.5](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#renum-caps)</sup> 앞의 `info`, `warning`, `error`처럼 프로젝트의 일반 이름 규칙을 적용한다. 소문자 이름도 같은 이름의 매크로가 있으면 충돌할 수 있으므로, 전처리기와 C++의 이름 범위를 같은 것으로 보아서는 안 된다.

## 관련 없는 상수는 따로 선언한다

로그 한 줄을 읽는 버퍼의 크기와 화면에 시간을 표시할지를 정한다고 하자. 다음과 같이 이름 없는 열거형에 두 상수를 넣으면 서로 다른 역할을 한 묶음으로 취급하게 된다.

```cpp
enum { max_line_bytes = 4096, show_timestamp = 1 };
```

버퍼 크기는 바이트 수이고, 시간 표시 여부는 참과 거짓의 선택이다. 이 경우에는 각각 상수로 선언하는 편이 뜻을 드러낸다.

```cpp
constexpr std::size_t max_line_bytes{4096};
constexpr bool show_timestamp{true};
```

이름 없는 열거형은 피하고, 관련 없는 값은 `constexpr` 상수 등으로 나누는 게 좋다.<sup>[Enum.6](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#renum-unnamed)</sup> 관련 있는 선택지라면 `LogLevel`처럼 그 관계를 설명하는 타입 이름을 붙인다.

## switch에서 빠진 선택지를 확인한다

로그 수준을 화면에 표시할 문자열로 바꾸는 `level_name` 함수를 만든다고 하자. 각 수준을 `switch`의 분기로 나타내면 어떤 값을 처리하는지 확인할 수 있다.

```cpp
const char* level_name(LogLevel level)
{
    switch (level) {
    case LogLevel::info:    return "정보";
    case LogLevel::warning: return "경고";
    case LogLevel::error:   return "오류";
    }
    return "알 수 없음";
}
```

열거자를 추가한 뒤 기존 `switch`의 처리를 빠뜨릴 수 있다. 열거형의 분기 누락을 검사하는 컴파일러 경고를 활용하면 이런 변경을 찾는 데 도움이 된다.<sup>[Enum.2](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#renum-set)</sup>

일부 수준만 별도로 처리하고 나머지에 공통 동작을 적용하려면 `default`로 그 의도를 드러낼 수 있다. 모든 수준을 각각 처리하려는 함수라면 빠진 분기가 없는지 살핀다. `default`가 있다는 사실만으로 각 수준의 처리를 모두 구현했다고 볼 수는 없다.

`enum class`를 쓴다고 모든 값이 반드시 선언한 열거자 중 하나가 되는 것은 아니다. 명시적 형 변환 등으로 이름이 붙지 않은 값이 들어올 수도 있다. 위 함수의 마지막 반환문은 그런 값에 대한 처리를 남긴 것이다. 외부 숫자를 로그 수준으로 변환할 때는 입력 경계에서 허용된 값인지 확인해야 한다.

이전 글: [9. auto를 쓰면 무엇이 추론되고 무엇이 달라질까](/posts/cpp-core-guidelines-09-auto-type-deduction/)

다음 글: [11. 열거형의 연산과 값, 기반 타입 정하기](/posts/cpp-core-guidelines-11-enum-operations-values-and-underlying-types/)
