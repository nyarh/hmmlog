---
slug: cpp-core-guidelines-06-initialization-and-assignment
title: C++ Core Guidelines 6. 초기화와 대입, 중괄호와 소괄호의 차이
description: 변수를 만들 때 값을 정하는 방법과 중괄호 초기화의 장점·예외
date: 2026-11-20T03:01:39Z
category: 개발/C++/Core Guidelines
art: code
---

로그 파일의 오류를 세는 `error_count`는 0에서 시작한다. 선언과 함께 0으로 초기화할 수도 있고, 먼저 선언한 뒤 0을 대입할 수도 있다. 두 방식은 값이 정해지는 시점이 다르다.

객체는 만들 때 초기화하는 게 좋다. 나중에 값을 넣겠다는 전제로 선언하면, 그 사이에 값을 읽는 코드가 들어오기 쉽다.<sup>[ES.20](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#res-always)</sup>

## 초기화와 대입을 구분한다

함수 안에서 오류 개수를 다음과 같이 선언했다고 하자.

```cpp
int error_count;
error_count = 0;
```

첫 줄의 지역 변수에는 사용할 수 있는 초기값이 정해지지 않는다. 두 번째 줄은 이미 존재하는 변수에 값을 대입한다. 지금은 바로 다음 줄에서 대입하지만, 두 줄 사이에 코드가 추가되면 값이 설정되기 전에 읽을 수 있다. 처음부터 0으로 초기화하면 이 간격이 생기지 않는다.

```cpp
int error_count{0};
```

`int error_count = 0;`도 초기화다. `=` 기호만 보고 대입이라고 판단하지 않는다. 선언하면서 첫 값을 정하는지, 이미 만들어진 객체의 값을 바꾸는지를 구분한다.

타입에 따라 초기값을 정하는 방식도 다르다. 로그 한 줄을 담는 `std::string line;`은 기본 생성자가 빈 문자열로 초기화하므로 그대로 사용해도 된다. 클래스 객체를 선언해 놓고 나중에 대입하면, 기본 생성 후 대입이 이어질 수 있다. 선언을 먼저 한다고 생성 비용이 사라지는 것은 아니다.

오류 목록을 이미 구했다면 그 크기로 바로 초기화할 수 있다. `errors`가 오류 줄을 담은 목록일 때 `auto error_count = errors.size();`는 그 개수로 시작한다. 실제로 필요한 값이 준비돼 있는데 임시로 0을 넣었다가 다시 바꿀 필요는 없다.

초기화 원칙은 클래스의 데이터 멤버에도 적용한다. 정수 멤버가 선언부의 초기값이나 생성자 초기화 목록에서 빠지지 않았는지 확인한다. 기본 생성자가 있다는 사실만으로 모든 멤버에 적절한 값이 들어간다고 볼 수는 없다.

## 선언마다 이름을 하나씩 둔다

로그의 전체 줄 수와 오류 줄 수를 함께 세더라도 변수는 각각 선언하는 게 좋다.<sup>[ES.10](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#res-name-one) · [NL.21](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#rl-dcl)</sup>

```cpp
int line_count{0};
int error_count{0};
```

`int line_count, error_count{0};`처럼 합치면 0은 `error_count`에만 적용된다. 선언을 나누면 각 변수의 초기값을 확인하기 쉽다. 포인터와 배열처럼 선언 문법이 복잡해질 때는 타입을 잘못 읽는 실수도 줄어든다.

함수 선언의 매개변수 목록은 이 제한에 포함하지 않는다. C++17의 구조적 바인딩도 예외다. 하나의 반환값이나 객체를 구성 요소별 이름으로 나눠 받기 위해 마련된 문법이므로, 여러 이름을 함께 선언한다.

## 중괄호는 축소 변환을 막는다

초기화에는 중괄호를 우선 사용하는 게 좋다. 값을 잃을 수 있는 축소 변환을 제한하고, 객체를 만드는 코드가 함수 선언으로 해석되는 모호함을 피할 수 있다.<sup>[ES.23](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#res-list)</sup> 이 형태의 중괄호 초기화는 C++11부터 사용할 수 있다.

로그에서 계산한 평균 응답 시간이 `7.9`밀리초라고 하자. 이를 정수 변수에 넣으면 소수 부분이 사라진다.

```cpp
double average_ms{7.9};
int truncated_ms = average_ms;  // 7
int checked_ms{average_ms};     // 오류: double에서 int로 축소 변환
```

중괄호가 자동으로 반올림하거나 범위를 검사해 주는 것은 아니다. 허용하지 않는 타입 변환을 컴파일 단계에서 거부한다. 소수 부분이 필요하면 실수 타입을 유지하고, 정수로 바꿔야 한다면 반올림 방식과 표현 범위를 별도로 정한다.

빈 문자열을 만들 때도 괄호에 따라 의미가 달라진다.

```cpp
std::string line();  // 문자열을 반환하는 함수 선언
```

이 코드는 빈 문자열 객체를 만들지 않는다. `line`이라는 이름의 함수를 선언하며, 이 함수는 인자가 없고 문자열을 반환한다. 빈 문자열 객체가 필요하면 `std::string line{};`로 쓴다. 정수의 경우 `int error_count{};`는 0으로 초기화한다.

## 컨테이너의 원소와 크기를 구분한다

로그 파일 세 개의 오류 개수를 저장할 `std::vector<int>`를 만든다고 하자. 원소 세 개를 모두 0으로 시작하려면 소괄호를 사용한다.

```cpp
std::vector<int> counts(3);        // 원소 3개: 0, 0, 0
std::vector<int> one_count{3};     // 원소 1개: 3
std::vector<int> known_counts{3, 1, 0};
```

이 경우 중괄호는 원소 목록을 받는 생성자를 선택한다. `counts(3)`의 3은 크기이고, `one_count{3}`의 3은 원소 값이다. 크기와 각 원소의 초깃값을 함께 주는 `std::vector<int> counts(3, 1);`은 값이 1인 원소 세 개를 만든다. 같은 자리에 `{3, 1}`을 쓰면 값이 3과 1인 원소 두 개가 된다.

컨테이너에서 원소를 나열할 때는 중괄호, 개수를 지정할 때는 소괄호를 사용하는 관례가 있다.<sup>[ES.23](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#res-list) · [ES.64](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#res-construct)</sup> 따라서 기존 코드의 소괄호를 모두 중괄호로 바꾸면 안 된다. 원소 목록 생성자가 있는지와 그 목록으로 해석할 수 있는 타입인지에 따라 선택되는 생성자가 달라진다.

## 이름 없는 값도 생성할 타입을 드러낸다

로그 파일의 앞부분만 보여 주는 기능에서, 읽을 범위를 행 번호로 묶는다고 하자. `first`와 `last`는 읽을 첫 행과 마지막 행이다.

```cpp
struct LineRange {
    int first;
    int last;
};

void read_lines(LineRange range);

read_lines(LineRange{1, 20});
```

`LineRange{1, 20}`은 별도 변수 이름 없이 값을 만들어 전달한다. 이처럼 식 안에서 값을 만들 때는 `T{...}` 형태로 생성할 타입을 드러내는 게 좋다. 중괄호의 축소 변환 제한도 적용된다.<sup>[ES.64](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#res-construct)</sup> 다만 행 번호가 유효한지 같은 의미상의 조건은 따로 확인해야 한다.

앞의 평균 응답 시간을 `int(average_ms)`나 `(int)average_ms`로 바꾸면 축소 변환을 허용한다. 중괄호에서 거부된다는 이유로 이런 표기로 바꾸기보다, 변환이 필요한지와 값의 범위를 먼저 확인한다.

## 중괄호 앞의 등호도 의미를 바꾼다

`{...}` 앞에 `=`를 붙이는지도 구분한다. `T value{...};`는 직접 리스트 초기화이고, `T value = {...};`는 복사 리스트 초기화다. 후자는 `explicit` 생성자가 선택되면 오류가 된다. `explicit`은 의도하지 않은 암시적 변환을 막기 위해 생성자에 붙이는 표시다. 특별한 이유가 없다면 `T value{...};` 형태를 우선한다.<sup>[ES.23](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#res-list)</sup> 여기서 ‘복사’라는 이름이 반드시 객체 복사를 뜻하지는 않는다.

타입을 추론하는 `auto`에도 차이가 있다. C++17 기준으로 `auto count{3};`는 `int`이고, `auto counts = {3};`는 원소 하나를 가진 `std::initializer_list<int>`다. 정수 하나가 필요한지 목록이 필요한지에 맞춰 쓴다.

## 초기값을 계산하는 과정이 길다면 묶는다

로그 화면의 제목에 파일 이름을 표시하되, 표준 입력으로 읽을 때는 별도 문구를 사용한다고 하자. `from_stdin`은 표준 입력을 읽는지 나타내고, `path`는 파일 입력일 때 사용할 `std::filesystem::path`다. 파일 이름을 얻지 못하면 기본 제목을 쓴다.

제목을 빈 문자열로 선언한 뒤 여러 분기에서 대입하는 대신, 계산을 람다에 모아 반환값으로 초기화할 수 있다. 특히 계산이 끝난 뒤 바뀌지 않아야 하는 값에 유용하다.<sup>[ES.28](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#res-lambda-init)</sup>

```cpp
const std::string title = [&from_stdin, &path] {
    if (from_stdin) {
        return std::string{"표준 입력"};
    }
    auto name = path.filename().string();
    if (name.empty()) {
        return std::string{"로그 파일"};
    }
    return name;
}();
```

`[&from_stdin, &path]`는 바깥의 두 변수를 참조로 사용한다는 뜻이다. 끝의 `()`가 람다를 즉시 호출하고, 반환한 문자열로 `title`을 초기화한다. 각 반환문은 모두 `std::string`을 돌려준다. 계산 중에만 필요한 `name`은 람다 안에 머물며, `title`은 처음부터 `const`로 선언할 수 있다. 예제의 `std::filesystem`은 C++17부터 제공된다.

선택지가 단순하면 조건식으로 충분하다. 여러 곳에서 같은 계산을 쓰거나 별도의 작업으로 이름 붙일 만하다면 함수로 분리한다. 람다는 해당 위치에서만 필요한 초기화 과정을 묶을 때 사용한다.

## 입력 버퍼에는 예외가 있지만 읽는 범위를 제한한다

로그를 큰 배열에 한꺼번에 읽어 들인다면, 모든 원소를 먼저 0으로 채우는 비용이 문제가 될 수 있다. 선언 직후 입력 데이터로 덮어쓸 배열은 초기화 원칙의 예외가 될 수 있다.<sup>[ES.20](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#res-always)</sup>

다만 읽기 요청이 배열 전체를 채운다고 가정해서는 안 된다. 파일 끝에 도달하거나 입력이 실패하면 일부만 기록될 수 있다. 초기화를 생략하려면 입력 결과를 확인하고 실제로 채워진 범위만 처리해야 한다. 뒤에 남은 원소를 읽을 가능성이 있다면 생략할 수 없다.

정수 변수 하나를 나중에 입력받는다는 이유로 초기화하지 않는 것은 이 예외에 해당하지 않는다. 의미 있는 초기값을 정하고, 입력이 성공했는지 확인한 뒤 사용한다.

이전 글: [5. 변수가 필요한 곳과 살아 있는 범위](/posts/cpp-core-guidelines-05-scope-and-lifetime/)

다음 글: [7. const로 변경 가능한 범위를 줄이기](/posts/cpp-core-guidelines-07-const-and-mutation/)
