---
slug: cpp-core-guidelines-07-const-and-mutation
title: C++ Core Guidelines 7. const로 변경 가능한 범위를 줄이기
description: 지역 변수, 참조와 포인터, 멤버 함수에 const를 적용하는 기준과 예외
date: 2026-11-20
category: 개발/C++/Core Guidelines
art: code
---

로그 화면에 오류를 최대 몇 줄까지 표시할지 설정에서 읽는다고 하자. 표시 한도는 출력하는 동안 유지하지만, 이미 표시한 줄 수는 한 줄을 출력할 때마다 늘어난다. 두 값 중 바뀔 필요가 없는 것은 표시 한도다.

변경할 필요가 없는 데이터는 불변으로 두는 게 좋다. 값을 읽을 때마다 중간에 바뀌었는지 확인할 필요가 줄고, 실수로 덮어쓰는 코드도 막을 수 있다.<sup>[P.10](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#rp-mutable)</sup>

## 초기화한 뒤 바꾸지 않는 값에 const를 붙인다

`read_display_limit()`이 설정에서 표시 한도를 읽어 `std::size_t`로 반환한다고 하자. `displayed`는 현재까지 표시한 줄 수다.

```cpp
const std::size_t limit = read_display_limit();
std::size_t displayed{0};
```

`limit`은 초기화한 뒤 다시 대입하거나 증가시킬 수 없다. `displayed`는 출력할 때마다 증가해야 하므로 변경할 수 있게 둔다.

객체는 기본적으로 `const`로 선언하고, 값을 바꿔야 할 때 변경을 허용하는 게 좋다.<sup>[Con.1](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#rconst-immutable) · [Con.4](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#rconst-const) · [ES.25](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#res-const)</sup> 나중에 `limit`을 바꾸는 코드가 추가되면 컴파일러가 거부하므로, 변경이 필요한지 선언부터 다시 검토하게 된다.

`const`라고 해서 값이 컴파일할 때 정해져야 하는 것은 아니다. 위의 `limit`은 프로그램이 실행될 때 설정에서 읽은 값이다. 컴파일 시점의 상수가 필요한 경우에는 `constexpr`를 검토한다. 두 키워드는 같은 뜻이 아니며, `constexpr`의 조건은 다음 회차에서 다룬다.

## 읽기만 하는 함수는 const 참조로 받는다

로그 줄을 담은 목록에서 오류 개수만 세는 함수와 빈 줄을 지우는 함수는 원본을 다루는 방식이 다르다. 개수만 세는 함수는 목록을 바꾸지 않으며, 빈 줄을 지우는 함수는 원본 목록을 수정한다.

```cpp
std::size_t count_errors(const std::vector<std::string>& lines);
void remove_empty_lines(std::vector<std::string>& lines);
```

`const std::vector<std::string>&`는 목록을 복사하지 않고 참조하되, 그 참조를 통해 목록이나 그 안의 문자열을 바꾸지 못하게 한다. `count_errors` 안에서 `lines.clear()`를 호출하면 오류가 된다. 원본을 읽기만 하는 참조와 포인터에는 참조 대상의 `const`를 붙이는 게 좋다.<sup>[Con.3](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#rconst-ref)</sup>

`remove_empty_lines`처럼 원본 수정이 함수의 역할이라면 일반 참조를 사용한다. 호출하는 쪽에서도 `T&`나 `T*`를 받는 함수는 전달한 객체를 바꿀 수 있다고 생각하고 읽는다.

작은 정수처럼 값으로 전달하는 인자는 별개다. `void set_limit(std::size_t limit);`의 `limit`은 함수가 받는 복사본이므로, 함수 안에서 이 정수를 바꿔도 호출자의 정수는 바뀌지 않는다. 값 매개변수에까지 일률적으로 `const`를 강제하지는 않는다.<sup>[Con.1](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#rconst-immutable)</sup>

## 포인터 자체와 가리키는 대상을 구분한다

로그 한 줄을 `std::string`에 담고 포인터로 접근한다고 하자. 포인터가 다른 문자열을 가리키게 하는 것과, 가리키는 문자열의 내용을 바꾸는 것은 서로 다른 변경이다.

| 포인터 타입 | 다른 문자열을 가리키도록 변경 | 포인터로 문자열 내용 변경 |
| --- | --- | --- |
| `const std::string*` | 가능 | 불가 |
| `std::string* const` | 불가 | 가능 |
| `const std::string* const` | 불가 | 불가 |

읽기 전용 입력을 전달할 때 필요한 것은 보통 첫 번째 타입이다. 별표 앞의 `const`는 가리키는 문자열에, 별표 뒤의 `const`는 포인터 자체에 적용된다. 포인터를 고정하는 것만으로는 문자열 수정을 막지 못한다.

`const`는 포인터가 유효한지, null인지, 대상 객체가 언제까지 살아 있는지를 보장하지 않는다. 이런 조건은 별도로 확인해야 한다.

## const 참조로 받아도 원본은 바뀔 수 있다

한 문자열을 일반 변수와 읽기 전용 참조로 함께 접근할 수 있다. 다음 코드에서 `view`는 `line`을 읽기 위한 참조다.

```cpp
std::string line{"ERROR: disk full"};
const std::string& view = line;

line.clear();
```

`view`를 통해 문자열을 지울 수는 없지만, `line`은 변경 가능한 객체이므로 직접 지울 수 있다. 두 이름은 같은 문자열을 가리켜서 이 코드가 실행된 뒤에는 `view`로 읽어도 빈 문자열이다. `const` 참조가 당시의 값을 따로 보관하지는 않는다.

읽기 전용 참조를 받은 함수가 데이터를 읽는 동안 다른 스레드가 원본을 바꿀 수 있다면, 접근을 동기화해야 한다. 실제로 변하지 않는 데이터는 데이터 경쟁을 피하는 데 도움이 되지만, `const` 참조 하나를 추가했다고 전체 프로그램의 동시 접근이 안전해지지는 않는다.<sup>[P.10](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#rp-mutable)</sup>

## 조회하는 멤버 함수에도 const를 붙인다

오류 개수를 관리하는 `ErrorCounter`를 만든다고 하자. `add()`는 오류를 하나 추가하고, `value()`는 현재 개수를 읽는다.

```cpp
class ErrorCounter {
public:
    void add() { ++value_; }
    std::size_t value() const { return value_; }

private:
    std::size_t value_{0};
};
```

멤버 함수의 매개변수 목록 뒤에 붙인 `const`는 읽기 전용 객체에서도 그 함수를 호출할 수 있음을 나타낸다. 외부에서 관찰하는 객체의 상태를 바꾸지 않는 멤버 함수에는 `const`를 붙이는 게 좋다.<sup>[Con.2](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#rconst-fct)</sup>

`const ErrorCounter&`로 전달받은 객체에서도 `value()`를 호출할 수 있다. `value()`에 `const`가 없으면 실제 구현이 값을 읽기만 하더라도 그 참조를 통해 호출할 수 없다. 값을 증가시키는 `add()`는 일반 멤버 함수로 남긴다.

다만 `const` 멤버 함수가 모든 메모리 변경을 막는 것은 아니다. `T*` 형태의 포인터 멤버가 가리키는 별도 객체나 `mutable`로 선언한 멤버는 수정할 수 있다. 포인터의 대상까지 보호하려면 `const T*`처럼 대상에도 `const`가 필요하다. `const`는 연결된 객체 전체에 자동으로 전파되지 않는다.

예를 들어 로그 통계를 문자열로 만드는 비용이 커서 결과를 캐시에 저장할 수 있다. 통계 자체는 그대로이고 표현 문자열만 저장하는 것이라면 캐시를 `mutable` 멤버로 둘 수 있다. 이때도 캐시 변경이 클래스가 약속한 의미를 훼손하지 않아야 한다. 여러 스레드가 같은 객체를 조회하면 캐시 쓰기에도 동기화가 필요하다.

## 값을 반환하는 지역 변수에는 예외가 있다

로그 화면의 필터 이름을 `std::vector<std::string>`으로 반환하는 함수에서, 결과 목록을 지역 변수에 만들었다고 하자.

```cpp
std::vector<std::string> labels{"오류", "경고"};
return labels;
```

`labels`를 생성 후 수정하지 않더라도, 값으로 반환하는 지역 변수에는 `const`를 붙이지 않는 편이 나을 수 있다. 복사보다 이동이 저렴한 타입이라면 `const`가 이동을 막고 복사를 유발할 수 있다.<sup>[Con.1](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#rconst-immutable)</sup>

컴파일러는 이처럼 이름 있는 지역 객체를 반환할 때 복사나 이동을 생략할 수 있다. 이를 NRVO라고 한다. 생략되지 않으면 일반 지역 변수에서는 이동이 가능하지만, `const` 벡터에서는 보통 복사가 필요하다. `const`가 항상 복사를 일으킨다는 뜻은 아니다.

## const를 없애서 인터페이스 문제를 숨기지 않는다

오래된 라이브러리는 문자열을 읽기만 하면서도 변경 가능한 포인터를 요구할 수 있다. 이 경우 읽기 전용 데이터를 그대로 전달할 수 없어 인터페이스가 맞지 않는다.

수정할 수 있는 라이브러리라면 매개변수를 읽기 전용 포인터로 고친다. 수정할 수 없다면 실제로 데이터를 변경하지 않는지 확인하고, 호환 처리를 별도 함수에 모으는 방식을 검토한다. 일반 호출부에서 `const`를 제거하는 형 변환을 반복하는 것은 피한다.<sup>[Con.2](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#rconst-fct) · [Con.3](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#rconst-ref)</sup>

예를 들어 `const int`로 만든 정수의 값을 형 변환을 거쳐 수정하면 정의되지 않은 동작이 된다. 형 변환으로 호출이 가능해졌다는 사실은 그 함수가 읽기만 한다는 근거가 되지 않는다.

이전 글: [6. 초기화와 대입, 중괄호와 소괄호의 차이](/posts/cpp-core-guidelines-06-initialization-and-assignment/)
