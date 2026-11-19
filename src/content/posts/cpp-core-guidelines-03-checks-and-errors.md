---
title: C++ Core Guidelines 3편 컴파일할 때 잡을 오류와 실행할 때 확인할 조건
description: static_assert와 입력 검증 예제로 구분하는 컴파일 시간 검사와 실행 시간 검사의 역할
date: 2026-11-19
category: 개발/C++/Core Guidelines
art: code
---

[전체 연재 목차](/posts/cpp-core-guidelines/) · 1부 가이드라인을 읽는 기준

한 번에 처리할 수 있는 작업 수가 정해진 프로그램을 생각해 보자. 코드에 적은 최대 작업 수가 0보다 큰지는 빌드할 때 확인할 수 있다. 사용자가 입력할 작업 수가 허용 범위에 드는지는 실행 중 값을 읽은 뒤에야 알 수 있다.

P.5, P.6, P.7은 검사를 어디에 둘지 판단하는 기준이 된다. 판단에 필요한 정보가 준비되는 시점에 맞춰 검사하면 오류를 더 일찍 찾을 수 있다.

## 코드에 고정된 조건은 컴파일할 때 확인한다

`static_assert`는 컴파일 시간에 조건을 검사한다. 조건이 거짓이면 실행 파일을 만드는 과정에서 오류가 발생한다.

다음은 그 검사만 보여주는 예다. `max_jobs`가 0이므로 의도적으로 컴파일에 실패한다.

```cpp
constexpr int max_jobs = 0;
static_assert(max_jobs > 0, "max_jobs must be positive");
```

값이 코드에 정해져 있으므로 시작 시점의 `if` 검사까지 기다릴 필요가 없다. P.5는 이런 조건을 컴파일할 때 확인하도록 권한다.

`static_assert`에 사용할 식은 컴파일 시간에 판단할 수 있어야 한다. 키보드로 입력받은 값을 여기에 넣을 수는 없다. `constexpr`가 붙었다고 실행 중에 들어올 정보까지 미리 알 수 있는 것도 아니다.

## 외부 입력은 값을 읽은 뒤 확인한다

아래 프로그램은 한 줄에 입력된 정수 하나를 읽고 1부터 8까지 허용한다. 숫자가 아니거나, 숫자 뒤에 다른 문자가 붙거나, 범위를 벗어나면 실제 작업을 시작하기 전에 종료한다.

```cpp
#include <array>
#include <cstddef>
#include <iostream>
#include <sstream>
#include <string>

constexpr int max_jobs = 8;
static_assert(max_jobs > 0, "max_jobs must be positive");

int main()
{
    std::string line;
    if (!std::getline(std::cin, line)) {
        std::cerr << "input is required\n";
        return 1;
    }

    std::istringstream input{line};
    int requested = 0;
    char extra = '\0';
    if (!(input >> requested) || (input >> extra)
        || requested < 1 || requested > max_jobs) {
        std::cerr << "enter one integer from 1 to " << max_jobs << '\n';
        return 1;
    }

    std::array<int, max_jobs> jobs{};
    for (int i = 0; i < requested; ++i) {
        jobs.at(static_cast<std::size_t>(i)) = i + 1;
    }

    std::cout << "prepared=" << requested << '\n';
}
```

`std::istringstream`은 문자열에서 값을 읽기 위한 스트림이다. `input >> requested`가 정수 읽기에 실패하면 첫 번째 조건이 참이 된다. 정수를 읽은 뒤에도 공백 이외의 문자가 남아 있으면 `input >> extra`가 성공하므로 역시 거절한다. 그 뒤에 허용 범위를 확인한다.

조건문의 `||`는 앞 항목이 참이면 뒤의 식을 평가하지 않는다. 정수를 읽는 데 실패하면 그 자리에서 거절하고, 읽기에 성공했을 때만 뒤의 범위 검사로 넘어간다.

## 검사를 가능하게 하는 정보도 남겨야 한다

P.6는 실행 중 검사에 필요한 정보를 설계에 남기라고 권한다. 검사 코드를 쓰려는 지점에서 배열의 길이나 값의 출처를 알 수 있어야 한다.

예제에서는 `std::array`인 `jobs`의 크기와 요청 개수 검사에 같은 `max_jobs`를 사용한다. 크기를 8로 정해 놓고 검사에서는 10까지 허용하는 식의 불일치를 피할 수 있다.

반면 함수가 첫 원소를 가리키는 포인터만 받으면 그 포인터가 가리키는 배열의 길이를 일반적으로 알아낼 수 없다. 길이를 전달하거나, 길이를 함께 가진 타입으로 인터페이스를 만들어야 검사를 할 근거가 생긴다. 연속된 데이터를 전달하는 방법은 24편에서 자세히 다룬다.

크기를 가진 타입을 쓴다는 사실과 모든 접근에서 자동으로 범위를 검사한다는 사실도 구분해야 한다. 이 예제의 `at()`는 범위를 검사하지만 `std::array`의 `operator[]`는 같은 검사를 보장하지 않는다. C++20의 `std::span`도 크기를 전달한다고 해서 `operator[]`의 범위 검사가 보장되는 것은 아니다.

루프의 `i`는 0에서 시작해 검사한 요청 개수보다 작은 동안만 배열에 접근한다. `std::size_t`로 변환하기 전에 음수가 아니라는 조건이 확보된다. 이 안전성은 변환 연산이 아니라 앞의 검사와 루프 조건에서 나온다.

## 오류는 사용하기 전에 발견한다

P.7은 실행 시간 오류를 일찍 발견하도록 권한다. 예제에서는 입력을 확인한 다음 배열을 채운다. 범위를 벗어난 값을 여러 함수에 전달한 뒤 어딘가에서 실패하게 두면 원래 원인을 찾기가 어려워진다.

검사는 값을 사용하기 전에 필요한 조건을 확보하는 곳에 둔다. 큰 파일 전체를 여러 번 훑거나, 드물게 쓰는 값 때문에 매번 비싼 검사를 할 필요가 있는지는 따져봐야 한다. 한 번 검증한 정보를 다음 작업에서도 활용하면 중복 검사를 줄일 수 있다.

검증을 마친 요청을 별도 타입으로 만들어 이후 함수에 전달할 수도 있다. 그러면 어느 지점에서 값의 조건을 보장했는지 분명해진다. 앞 글의 횟수와 시간 구분을 값의 유효성까지 넓힌 방법이다.

## 실행 결과를 확인한다

프로그램을 `check_jobs.cpp`로 저장한다. Linux의 GCC 14.2.0에서 C++20으로 다음 입력들을 확인했다. 예제 자체에 쓰인 기능은 C++11부터 사용할 수 있다.

```sh
g++ -std=c++20 -Wall -Wextra -Wpedantic -Wconversion check_jobs.cpp -o check_jobs
printf '3\n' | ./check_jobs
```

| 입력 | 결과 | 종료 코드 |
| --- | --- | ---: |
| `3` | `prepared=3` 출력 | 0 |
| `8` | `prepared=8` 출력 | 0 |
| `0`, `-1`, `9` | 허용 범위 안내 | 1 |
| `abc`, `3abc`, `3 4` | 정수 하나를 입력하라는 안내 | 1 |
| 입력 없이 종료 | `input is required` 출력 | 1 |

`max_jobs`를 0으로 바꾸면 `static_assert`가 빌드를 막는다. 잘못된 입력은 빌드에 성공한 프로그램이 실행 중 거절한다. 코드에 고정된 조건과 입력값의 조건을 각각 알 수 있는 시점에 검사한 결과다.

원문의 **P.5, P.6, P.7**은 컴파일 시간 검사, 실행 시간에 검사 가능한 설계, 오류를 발견할 시점을 각각 다룬다.

<div class="source-card">
  <a href="https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#rp-compile-time" target="_blank" rel="noopener">
    <svg class="card-outline" aria-hidden="true" focusable="false"><rect x="1" y="1" rx="7" pathLength="1"></rect></svg>
    <strong>컴파일 시간과 실행 시간의 오류 검사</strong>
    <small>C++ Core Guidelines · isocpp.github.io</small>
    <span role="img" aria-label="새 탭에서 열기">↗</span>
  </a>
</div>

입력을 받는 함수에서 코드와 타입만으로 확인할 조건, 실행 중 값을 읽어야 확인할 조건을 나눠보자. 실행 중 검사할 조건에는 배열의 길이처럼 필요한 정보가 함께 전달되는지도 살핀다.

[이전 글: 의도와 타입](/posts/cpp-core-guidelines-02-intent-and-types/) · [전체 목차](/posts/cpp-core-guidelines/) · [다음 글: 라이브러리와 도구 활용](/posts/cpp-core-guidelines-04-libraries-and-tools/)
