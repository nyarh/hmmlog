---
slug: cpp-core-guidelines-11-enum-operations-values-and-underlying-types
title: C++ Core Guidelines 11. 열거형의 연산과 값, 기반 타입 정하기
description: 요일을 바꾸는 연산, 열거자 값을 지정할 조건, 기반 타입과 전방 선언의 차이
date: 2026-11-21T00:05:01Z
category: 개발/C++/Core Guidelines
art: code
---

주간 작업의 실행 요일을 고르는 설정 화면을 만든다고 하자. 버튼을 누를 때마다 다음 요일로 바꾸고, 일요일 다음에는 월요일로 돌아간다. 요일을 열거형으로 표현하면 선택지는 분명해지지만, 다음 요일을 구하는 동작은 따로 정의해야 한다.

## 반복하는 변환을 연산으로 묶는다

요일을 나타내는 `Day`를 월요일부터 일요일 순서로 선언한다. `enum class`는 C++11부터 사용할 수 있다.

```cpp
enum class Day { mon, tue, wed, thu, fri, sat, sun };
```

`Day`에는 기본으로 제공되는 `++` 연산이 없다. 정수로 바꿔 1을 더하는 식을 여러 곳에서 반복하면, 일요일에서 월요일로 돌아가는 처리를 빠뜨리기 쉽다. 열거형을 안전하고 간단하게 쓰는 데 필요한 연산을 함께 제공하는 게 좋다.<sup>[Enum.4](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#renum-oper)</sup>

`next_day`는 선언된 일곱 요일 중 하나를 받아 다음 요일을 반환한다. 값은 선언 순서대로 0부터 6까지 붙으므로, 일요일을 제외하면 정수 값에 1을 더해 다음 요일을 구할 수 있다.

```cpp
Day next_day(Day day)
{
    if (day == Day::sun)
        return Day::mon;

    return static_cast<Day>(static_cast<int>(day) + 1);
}

Day selected{Day::sun};
selected = next_day(selected);  // 월요일로 변경
```

호출하는 쪽은 요일과 정수 사이의 변환을 반복하지 않는다. `next_day`는 호출부의 변수를 바꾸지 않으므로, 선택을 바꾸려면 반환값을 `selected`에 대입한다. 원본을 한 단계 바꾸는 사용법이 필요하다면 `++` 연산자를 정의할 수도 있다.

이 구현은 요일의 값이 연속이고 입력이 유효하다는 전제에 의존한다. 값을 듬성듬성 지정하면 덧셈 대신 각 요일의 다음 값을 대응시켜야 한다. 파일이나 네트워크에서 읽은 숫자는 허용된 요일인지 먼저 확인한다. `static_cast`가 이름 있는 열거자에 해당하는지 검사해 주지는 않는다.

## 숫자에 별도 의미가 없으면 자동으로 정한다

열거자 값을 생략하면 첫 값은 0이고, 이후 값은 앞선 값보다 1씩 커진다. 요일을 프로그램 안에서 구분하기만 한다면 `mon = 0, tue = 1`처럼 모든 값을 적을 필요가 없다.

필요한 경우에만 열거자 값을 지정하는 게 좋다. 자동으로 정해지는 값을 쓰면 선언이 짧아지고, 값을 직접 적다가 같은 숫자를 두 번 쓰는 실수를 줄인다.<sup>[Enum.8](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#renum-value)</sup>

예를 들어 `tue = 1, wed = 1`로 잘못 적어도 선언 자체는 허용된다. 두 이름은 같은 값을 나타내므로 비교하면 같고, 값만 받아서는 어느 이름으로 전달했는지 구분할 수 없다. 두 값을 각각 `switch`의 `case`로 쓰면 중복된 분기가 되어 오류가 난다.

자동 값은 선언 순서에 따라 달라진다. 파일에 숫자로 저장하거나 외부 시스템과 주고받는 값이라면, 열거자 순서를 바꿨을 때 기존 데이터의 의미도 달라질 수 있다. 이런 경우에는 저장 형식에 맞는 값을 고정하거나 별도의 변환 함수를 둔다.

## 관례나 비트 조합에는 값을 지정한다

달을 숫자로 표현할 때는 보통 1월을 1, 12월을 12로 쓴다. 이 관례에 맞추려면 첫 값만 1로 정하면 된다.

```cpp
enum class Month {
    jan = 1, feb, mar, apr, may, jun,
    jul, aug, sep, oct, nov, dec
};
```

파일의 읽기, 쓰기, 실행 권한처럼 여러 선택을 함께 저장할 때는 각 권한에 서로 다른 비트를 배정한다. 이 경우 0, 1, 2, 3이라는 연속된 값으로는 각 권한을 독립적으로 표현할 수 없다. 관례에 맞는 숫자나 비트 위치가 필요하면 값을 직접 지정한다.<sup>[Enum.8](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#renum-value)</sup>

1을 왼쪽으로 이동시키는 `<<` 연산으로 각 권한의 비트 위치를 정한다. `none`은 아무 권한도 없는 상태다.

```cpp
enum class Permission {
    none = 0,
    read = 1 << 0,
    write = 1 << 1,
    execute = 1 << 2
};
```

`read`, `write`, `execute`는 각각 1, 2, 4다. 읽기와 쓰기를 함께 허용하려면 두 비트를 합친 3을 사용한다. `enum class`에는 기본 비트 OR 연산이 없으므로, 조합에 필요한 연산도 정의한다.

```cpp
Permission operator|(Permission left, Permission right)
{
    return static_cast<Permission>(
        static_cast<int>(left) | static_cast<int>(right));
}

Permission allowed = Permission::read | Permission::write;
```

이렇게 정의하면 호출부에서 권한 이름을 유지한 채 조합할 수 있다.<sup>[Enum.4](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#renum-oper)</sup> `allowed`의 값 3에 해당하는 열거자 이름은 없지만, 이 타입에서는 읽기와 쓰기의 조합으로 사용한다.

## 기반 타입은 저장 조건이 있을 때 지정한다

기반 타입은 열거형의 값을 표현하는 정수 타입이다. `enum class`에서 생략하면 `int`가 된다. 따라서 앞의 `Day`에 `: int`를 붙여도 기반 타입은 달라지지 않는다. 일반 `enum`에서 기반 타입을 생략했을 때는 열거자 값들을 표현할 수 있는 정수 타입을 구현이 정한다.

크기나 표현 범위에 요구 사항이 있을 때만 기반 타입을 명시하는 게 좋다.<sup>[Enum.7](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#renum-underlying)</sup> 예를 들어 많은 격자 칸에 이동 방향을 하나씩 저장하고, 그 배열의 메모리 사용량을 줄이려는 경우다.

```cpp
enum class Direction : unsigned char {
    north, south, east, west
};
```

`Direction`은 `unsigned char`와 같은 크기와 정렬 요구 사항을 가진다. `int`가 `unsigned char`보다 큰 환경이라면 방향 배열의 크기를 줄일 수 있다. 작은 기반 타입을 썼다는 이유만으로 모든 연산이 빨라지는 것은 아니다.

정확히 32비트인 정수 표현이 필요하다면 `<cstdint>`의 `std::uint32_t`처럼 폭이 정해진 타입을 기반 타입으로 지정할 수 있다. 이 타입은 해당 폭의 정수 타입을 제공하는 구현에서 사용할 수 있다. 기반 타입을 고정해도 여러 바이트의 저장 순서까지 정해지는 것은 아니므로, 파일이나 통신 형식으로 내보낼 때는 그 형식에 맞게 변환해야 한다.

## 전방 선언은 enum과 enum class를 구분한다

함수 선언에서 요일 타입을 사용하되 열거자 목록은 나중에 제공할 수 있다. `enum class`는 기본 기반 타입이 `int`로 정해져 있으므로 다음과 같이 선언할 수 있다.

```cpp
enum class Day;
void schedule(Day day);
```

나중에 정의할 때도 같은 기반 타입을 사용해야 한다. 앞서 선언한 `Day`를 뒤에서 `enum class Day : unsigned char`로 바꾸면 서로 맞지 않는다.

일반 `enum`은 열거자 목록 없이 선언할 때 기반 타입을 반드시 적는다. 예를 들어 `enum LegacyMode : unsigned char;`처럼 쓴다. `enum class`도 기본값인 `int` 외의 타입을 사용한다면 첫 선언부터 그 타입을 명시한다.<sup>[열거형 선언](https://eel.is/c++draft/dcl.enum)</sup>

이전 글: [10. 관련 있는 상수를 enum class로 묶기](/posts/cpp-core-guidelines-10-related-constants-and-enum-class/)
