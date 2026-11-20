---
slug: cpp-core-guidelines-09-auto-type-deduction
title: C++ Core Guidelines 9. auto를 쓰면 무엇이 추론되고 무엇이 달라질까
description: 초기값에서 타입을 추론하는 방식과 복사·참조·타입 지정의 구분
date: 2026-11-20T12:04:28Z
category: 개발/C++/Core Guidelines
art: code
---

로그를 한 줄씩 `std::vector<std::string>`에 담았다고 하자. 이 목록의 첫 위치를 가리키는 반복자를 얻으려면 `begin()`을 호출한다. 반환 타입을 매번 `std::vector<std::string>::iterator`라고 적는 대신, 컴파일러가 이미 알고 있는 타입을 사용할 수 있다.

초기값에서 타입을 알 수 있다면 `auto`로 타입 이름의 불필요한 반복을 줄이는 게 좋다. 긴 이름을 잘못 적거나 반환 타입과 다른 타입을 쓰는 실수도 줄어든다.<sup>[ES.11](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#res-auto)</sup>

## 타입은 컴파일할 때 정해진다

`lines`는 로그 문자열 목록이고, `it`는 첫 원소의 위치, `count`는 목록의 크기다.

```cpp
std::vector<std::string> lines{"ERROR: disk full"};
auto it = lines.begin();
const auto count = lines.size();
```

`it`의 타입은 `begin()`의 반환 타입으로 정해진다. `count`도 `size()`의 반환 타입을 사용하며, 앞에 붙인 `const`로 값 변경을 제한한다. 크기를 무조건 `int`에 담는 것과 달리, 다른 정수 타입으로 변환하면서 값을 잃을 가능성을 피한다.

이처럼 초기값에서 타입을 추론하는 `auto`는 C++11부터 사용할 수 있다. 실행할 때마다 타입이 바뀌는 변수라는 뜻은 아니다. `auto number = 3;`의 `number`는 `int`이며, 나중에 문자열을 대입할 수 없다. 일반 지역 변수를 `auto number;`처럼 초기값 없이 선언할 수도 없다.

람다처럼 타입 이름을 직접 적을 수 없는 객체도 `auto`로 받을 수 있다. 타입이 생략돼 보이더라도, 컴파일러는 그 객체의 구체적인 타입을 알고 있다.

## 복사할지 참조할지는 따로 정한다

앞의 `lines`에 원소가 있다고 하자. `front()`는 첫 문자열의 참조를 반환하지만, 이를 `auto`로 받는 방식에 따라 새 문자열을 만들 수도 있고 원본을 참조할 수도 있다.

```cpp
auto copy = lines.front();
auto& original = lines.front();
const auto& read_only = lines.front();
```

| 선언 | 이 예제에서의 타입 | 동작 |
| --- | --- | --- |
| `auto copy` | `std::string` | 문자열을 복사한다. |
| `auto& original` | `std::string&` | 원본 문자열을 참조한다. |
| `const auto& read_only` | `const std::string&` | 원본을 참조하되 이 참조로 수정하지 않는다. |

`copy.clear()`는 복사한 문자열만 지운다. `original.clear()`는 목록의 첫 문자열을 지운다. `read_only.clear()`는 허용되지 않는다. `auto`가 참조 반환을 그대로 보존해 줄 것이라고 생각하면 의도하지 않은 복사가 생길 수 있다.

값으로 받을 때는 원본 객체 자체의 `const`가 복사본에 붙지 않는다. 원본 문자열 `source`가 `const std::string`일 때 `auto copy = source;`로 받으면 변경 가능한 문자열 복사본이 된다. 복사본까지 변경하지 않으려면 `const auto`를 쓴다.

참조로 받을 때는 원본의 `const`를 유지한다. 원본이 읽기 전용이면 `auto&`로 받아도 읽기 전용 참조가 된다. 포인터가 가리키는 대상의 `const`도 보존된다. `const std::string*`를 `auto`로 받아도 그 포인터로 문자열을 수정할 수는 없다.

로그 목록을 순회할 때도 같은 구분이 적용된다. `for (auto line : lines)`는 매번 문자열을 복사한다. 문자열을 읽기만 한다면 `for (const auto& line : lines)`로 참조해서 사용할 수 있다. 목록이 소멸하거나 원소가 삭제·재할당되면 참조가 무효가 될 수 있다는 점도 함께 확인한다.

## 필요한 타입이 정해져 있으면 직접 쓴다

`auto`는 초기화 식의 타입을 따른다. 개발자가 계산 결과에 기대하는 타입을 추측하지 않는다. 로그 10건 중 오류가 3건일 때, 비율을 정수 나눗셈으로 계산하면 소수 부분이 사라진다.

```cpp
const int error_count{3};
const int total_count{10};
const auto ratio = error_count / total_count;
const double fraction = static_cast<double>(error_count) / total_count;
```

`ratio`는 `const int`이며 값은 0이다. 두 정수를 먼저 나누기 때문이다. `fraction`은 나누기 전에 한 피연산자를 `double`로 변환하므로 소수 비율을 얻는다. `ratio`의 선언 타입만 `double`로 바꿔도 정수 나눗셈은 이미 끝났으므로 값은 0.0이다. 실제 입력으로 나눌 때는 전체 건수가 0인지도 먼저 확인해야 한다.

정확히 원하는 타입이 있거나 초기값을 그 타입으로 변환해야 한다면 타입을 직접 적는 게 좋다.<sup>[ES.11](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#res-auto)</sup> `auto`를 쓰기 전에 계산 자체가 어떤 타입으로 수행되는지도 확인한다.

`auto`로 받은 객체가 항상 독립된 값의 복사본인 것도 아니다. 로그의 선택 상태를 저장하는 `std::vector<bool>`은 원소 접근에 별도의 대리 객체를 사용한다.

```cpp
std::vector<bool> selected{false};
auto flag = selected[0];
bool snapshot = selected[0];
```

`flag`는 실제 비트를 대신 읽고 쓰는 객체다. `flag = true;`는 `selected[0]`을 바꾼다. `snapshot`은 당시의 `bool` 값을 복사했으므로 목록과 별도로 유지된다. 호출 결과가 참조인지, 값인지, 이런 대리 객체인지에 따라 `auto`의 효과가 달라진다.

## 중괄호와 등호가 추론 결과를 바꾼다

페이지당 표시할 줄 수를 20으로 두거나, 여러 후보를 목록으로 보관한다고 하자. 중괄호 주변의 문법에 따라 타입이 달라진다. 다음은 C++17 기준이다.

```cpp
auto count{20};
auto list = {20};
std::vector<int> choices{10, 20, 50};
```

`count`는 `int`이고, `list`는 원소 하나를 가진 `std::initializer_list<int>`다. 이 초기화 목록의 원소는 읽기 전용이며, 원소를 추가하는 기능도 없다. `choices`처럼 벡터가 필요하다면 그 타입을 직접 지정한다.

`auto count{10, 20};`처럼 직접 중괄호 초기화에 여러 값을 넣을 수는 없다. `auto list = {10, 20};`은 초기화 목록으로 추론된다. 초기화 목록에서는 `auto`를 무심코 적용하지 말고 필요한 타입을 명확히 하는 게 좋다.<sup>[ES.11](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#res-auto)</sup>

## 여러 반환값에는 각각 이름을 붙인다

중복된 오류 코드를 한 번씩만 저장하려고 `std::set<int>`를 사용한다고 하자. `insert()`는 원소의 위치와 새로 삽입했는지를 함께 반환한다. C++17의 구조적 바인딩으로 각 결과에 이름을 붙일 수 있다.

```cpp
std::set<int> error_codes{1001, 1002};
const auto [position, inserted] = error_codes.insert(1003);
```

`position`은 삽입한 원소를 가리키는 반복자이고, `inserted`는 새 원소를 넣었으면 `true`다. 이미 같은 코드가 있었다면 `position`은 기존 원소를 가리키고 `inserted`는 `false`가 된다. 반환된 `std::pair`의 긴 타입 이름을 적지 않고 두 결과의 역할을 드러낼 수 있다.

이미 존재하는 객체를 분해할 때는 복사 여부도 구분한다. `auto [a, b] = existing;`은 원본을 복사한 객체의 구성 요소에 이름을 붙인다. 원본의 구성 요소를 참조하려면 `auto& [a, b] = existing;`처럼 참조를 명시한다.

## 추론할 타입의 조건을 붙일 수도 있다

알고리즘이 같은 구간을 여러 번 순회해야 한다면, 받은 반복자가 그 동작을 지원해야 한다. C++20부터는 `auto` 앞에 콘셉트를 붙여 추론된 타입이 요구 조건을 만족하는지 검사할 수 있다.

```cpp
std::forward_iterator auto it = lines.begin();
```

`std::forward_iterator`는 여러 번 순회할 수 있는 전방 반복자의 조건을 나타낸다. 타입은 여전히 `begin()`의 결과에서 추론하지만, 조건을 만족하지 않으면 오류가 된다. 구체적인 타입 이름을 반복하지 않으면서 필요한 성질을 선언에 남길 수 있다.<sup>[ES.11](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#res-auto)</sup>

## 함수 선언의 auto는 위치를 함께 읽는다

함수에서는 `auto f() -> Result;`처럼 반환 타입을 뒤에 적을 수 있다. 이 선언의 반환 타입은 이미 `Result`로 지정돼 있다. 앞의 `auto`만 보고 반환 타입을 본문에서 추론한다고 판단하면 안 된다.

클래스 템플릿의 멤버 함수를 밖에서 정의할 때도 이 형태를 쓸 수 있다. 예를 들어 `Container<T>` 안에 `Iterator`라는 타입이 있다면, 반환 타입을 뒤에 두는 `auto Container<T>::first() -> Iterator` 형태로 긴 타입 이름의 반복을 줄일 수 있다.<sup>[ES.11](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#res-auto)</sup>

이전 글: [8. constexpr로 계산 시점 표현하기](/posts/cpp-core-guidelines-08-constexpr-and-evaluation/)
