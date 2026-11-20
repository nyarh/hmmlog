---
slug: cpp-core-guidelines-05-scope-and-lifetime
title: C++ Core Guidelines 5. 변수가 필요한 곳과 살아 있는 범위
description: 로그 처리 예시로 보는 변수의 선언 위치, 스코프와 객체 수명
date: 2026-11-20
category: 개발/C++/Core Guidelines
art: code
---

로그에서 오류가 있는 줄만 모으는 함수를 만든다고 하자. 한 줄을 담는 문자열은 읽는 동안 필요하고, 모은 오류 목록은 함수를 호출한 곳에 돌려줘야 한다. 각 변수를 어디에 선언하느냐에 따라 사용할 수 있는 범위가 달라진다.

변수는 필요한 범위 안에 선언하는 게 좋다. 사용이 끝난 값을 다른 곳에서 실수로 참조할 가능성을 줄이고, 파일이나 잠금 같은 자원을 필요 이상으로 오래 보유하지 않게 한다.<sup>[ES.5](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#res-scope)</sup>

## 반복문과 조건문 안에서만 쓰는 변수

스코프는 이름을 사용할 수 있는 범위다. 반복문 안에서만 쓰는 변수는 반복문에 선언한다.<sup>[ES.6](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#res-cond)</sup> 아래 함수에서 `input`은 로그를 읽는 입력 스트림이다. `ERROR`로 시작하는 줄을 오류로 분류한다.

```cpp
std::vector<std::string> read_errors(std::istream& input)
{
    std::vector<std::string> errors;
    for (std::string line; std::getline(input, line); ) {
        if (line.starts_with("ERROR")) {
            errors.push_back(line);
        }
    }
    return errors;
}
```

`line`은 `for`의 초기화 부분에 선언했으므로 조건과 반복문 본문에서 사용할 수 있다. 반복문이 끝난 뒤에는 이 이름을 사용할 수 없다. `errors`는 결과를 반환할 때도 필요하므로 반복문을 감싸는 함수 본문에 둔다. 문자열의 `starts_with`는 C++20부터 제공된다.

`read_errors`가 반환한 목록을 `errors`에 담았다고 하자. 오류 개수가 허용치인 `limit`을 넘을 때 경고 문자열을 만들려면, 개수를 조건문 안에 선언할 수 있다.

```cpp
std::string warning;
if (const auto count = errors.size(); count > limit) {
    warning = std::to_string(count) + "개의 오류";
}
```

C++17부터 사용할 수 있는 `if` 초기화문으로 `count`를 선언했다. `count`는 조건과 분기 안에서만 사용할 수 있으며, `else`가 있다면 그 안에서도 사용할 수 있다. `warning`은 분기가 끝난 뒤 표시할 값이므로 바깥에 둔다. 오류 개수가 한도 이하면 빈 문자열을 유지한다.

## 값이 준비된 곳에서 선언한다

함수 시작에 모든 변수를 모아 선언할 필요는 없다.<sup>[NR.1](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#rnr-top)</sup> 실제로 사용할 곳 가까이에서 선언하면 선언과 사용 사이에 읽어야 할 코드가 줄어든다.<sup>[ES.21](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#res-introduce)</sup>

로그를 여는 함수에서 `path`가 읽을 파일의 경로라고 하자. 파일을 열지 못하면 처리를 끝내고, 열었을 때만 오류 목록을 만든다.

```cpp
std::ifstream input{path};
if (!input) {
    return;
}
const auto errors = read_errors(input);
```

오류 목록을 미리 빈 상태로 선언했다가 나중에 대입할 필요가 없다. 초기화할 값이 준비된 시점에 선언하면 값이 설정되기 전에 사용하는 실수도 줄어든다.<sup>[ES.22](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#res-init)</sup>

빈 값으로 시작하는 것이 자연스러운 경우도 있다. 첫 예제의 `errors`는 빈 목록에 줄을 하나씩 추가하고, `line`은 입력을 받는 문자열이다. 둘 다 빈 상태가 작업의 시작 상태다. 복잡한 분기에서 초기값을 계산해야 한다면 값을 반환하는 함수로 계산을 묶을 수 있다.

## 이름의 범위와 객체의 수명

스코프는 이름에 관한 범위이고, 수명은 객체가 존재하는 기간이다. 일반적인 자동 지역 객체는 초기화를 마친 뒤 수명이 시작되고, 선언된 블록을 벗어날 때 소멸한다. 위 코드의 `line`은 반복마다 내용을 바꾸는 하나의 문자열이며, `for`가 끝날 때 소멸한다.

`errors.push_back(line)`은 문자열 값을 목록에 복사한다. 따라서 `line`의 수명이 끝나도 목록에 모은 문자열은 남는다. 오류 목록도 값으로 반환하므로 호출한 곳에서 계속 사용할 수 있다.

파일 스트림은 소멸할 때 파일을 닫는다. 앞의 호출 코드에서는 `input`을 선언한 블록 끝까지 파일이 열려 있다. `read_errors`는 스트림을 참조로 받으므로 이 함수가 반환해도 파일을 닫지 않는다.

파일 읽기가 끝난 뒤 긴 후속 처리가 이어진다면, 열기와 읽기를 별도 함수로 묶고 필요한 데이터만 반환할 수 있다. 그러면 후속 처리 동안 파일을 계속 열어 둘 필요가 없다.<sup>[ES.5](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#res-scope)</sup>

모든 객체의 수명이 이름의 스코프와 함께 끝나는 것은 아니다. `static` 지역 객체는 블록을 벗어나도 살아 있으며, `new`로 만든 객체는 포인터 변수의 스코프가 끝났다는 이유만으로 해제되지 않는다. 자원을 언제 반환하는지는 객체의 저장 방식과 소유 관계도 함께 봐야 한다.

## 안쪽 선언으로 바깥 변수를 가리지 않는다

오류 목록의 크기를 `error_count`에 저장하려는 코드에서 안쪽에 같은 이름을 다시 선언하면 다른 변수가 생긴다.

```cpp
std::size_t error_count = 0;
if (!errors.empty()) {
    const auto error_count = errors.size();
}
```

안쪽의 `error_count`가 바깥 이름을 가리므로, 분기가 끝난 뒤 바깥 변수는 여전히 0이다. 중첩된 범위에서 같은 이름을 다시 쓰는 일은 피하는 게 좋다.<sup>[ES.12](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#res-reuse)</sup> 이 경우에는 `const auto error_count = errors.size();`로 바로 초기화하면 된다.

멤버 변수와 같은 이름을 지역 변수에 붙일 때도 같은 혼동이 생긴다. 컴파일러의 이름 가리기 경고를 활용하고, 각 변수가 맡은 역할이 드러나는 이름을 쓴다.

상속한 함수와 같은 이름으로 오버로드를 추가하는 경우는 별도로 살핀다. 기반 클래스의 오버로드가 가려지면 의도한 함수를 찾지 못할 수 있다. 기반 클래스가 `Base`이고 함수가 `f`라면, 필요할 때 파생 클래스 안에 `using Base::f;`를 선언해 기존 오버로드를 가져온다.

## 한 변수를 다른 역할로 돌려 쓰지 않는다

여러 로그 파일을 처리할 때 오류 개수를 담던 변수를 나중에 파일 목록의 인덱스로 재사용하면, 같은 이름이 가리키는 의미가 중간에 바뀐다. 오류 개수와 파일 인덱스에는 각각 별도의 변수를 두는 게 좋다.<sup>[ES.26](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#res-recycle)</sup> 반복문의 인덱스는 그 반복문에 선언하고, 오류 개수는 필요한 곳에서 따로 계산한다.

첫 예제의 `line`은 반복마다 새 줄을 담지만 역할은 계속 같다. 할당 비용을 줄이기 위해 작업 버퍼를 재사용할 수도 있다. 이때도 사용 범위를 좁게 유지하고, 이전 데이터가 다음 처리에 섞이지 않도록 내용을 지우거나 덮어쓰는 방식을 확인한다.

이전 글: [4. 표준 라이브러리와 도구 활용](/posts/cpp-core-guidelines-04-libraries-and-tools/)
