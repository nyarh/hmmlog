---
title: C++ Core Guidelines 4. 표준 라이브러리와 도구 활용
description: 표준 알고리즘과 컨테이너를 선택하고 도구로 확인하는 기준
date: 2026-11-19
category: 개발/C++/Core Guidelines
art: code
---

표준 탐색 알고리즘에는 찾을 범위와 값을 전달한다. 직접 루프의 반복 조건과 종료 위치를 관리하는 코드가 줄고, 찾은 결과를 처리하는 부분이 드러난다.

[ES.1](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#res-lib)과 [SL.2](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#rsl-sl)는 표준 라이브러리를 우선 사용하도록 권한다. 널리 알려진 인터페이스를 사용하면 읽는 사람도 동작을 파악하기 쉽다.

## 컨테이너와 알고리즘 사용

다음 프로그램은 사용자 이름 목록에서 `ji`를 찾는다. `std::vector`가 원소의 저장 공간과 수명을 관리하고, `std::ranges::find`가 탐색을 수행한다.

```cpp
#include <algorithm>
#include <iostream>
#include <string>
#include <vector>

int main()
{
    const std::vector<std::string> users{"min", "ji", "sol"};
    const auto found = std::ranges::find(users, "ji");

    if (found == users.end()) {
        std::cout << "not found\n";
        return 0;
    }

    std::cout << *found << '\n';
}
```

`find-user.cpp`로 저장한 뒤 다음 명령으로 빌드한다. `std::ranges::find`는 C++20부터 제공되며, Linux의 GCC 14.2.0에서 확인했다.

```sh
g++ -std=c++20 -Wall -Wextra -Wpedantic -Wconversion -Werror find-user.cpp -o find-user
./find-user
```

```text
ji
```

찾지 못하면 결과는 끝 반복자인 `users.end()`와 같다. 이 경우 원소를 읽으면 안 되므로 먼저 비교한다. 목록이 비어 있어도 같은 경로로 `not found`를 출력한다. 같은 이름이 여러 개 있으면 첫 번째 일치 항목을 찾는다.

예제는 탐색 결과를 사용하는 동안 컨테이너를 변경하지 않는다. 컨테이너를 수정하면 반복자가 무효가 되는 경우가 있으므로, 찾은 결과를 오래 보관할 때는 해당 연산의 무효화 조건을 확인해야 한다.

## 라이브러리를 선택하는 기준

[SL.1](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#rsl-lib)은 사용할 수 있는 라이브러리를 활용하도록 권한다. [P.13](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#rp-lib)은 문서와 유지 관리가 갖춰진 지원 라이브러리를 선택하는 원칙이다. 직접 구현한 코드의 테스트와 유지 비용도 선택에 포함한다.

표준 라이브러리로 요구사항을 충족할 수 없다면 프로젝트의 기반 라이브러리나 해당 분야의 라이브러리를 검토한다. GSL(Guidelines Support Library)은 가이드라인 적용을 돕는 지원 라이브러리이며 ISO C++ 표준 라이브러리와는 구분한다.

동적 메모리 할당이 제한된 실시간·임베디드 환경에서는 `std::vector` 같은 컨테이너를 그대로 쓰기 어려울 수 있다. 저장 공간을 고정하거나 허용된 할당 방식을 사용하는 컨테이너를 검토한다. 표준 알고리즘은 이런 저장 방식과 별도로 사용할 수 있는 경우가 많다.

알고리즘을 선택할 때는 요구되는 결과와 복잡도를 먼저 확인한다. 실행 시간은 입력과 구현에 따라 달라지므로, 성능이 중요한 경로는 실제 입력으로 측정한다.

## 도구마다 확인하는 범위

[P.12](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#rp-tools)는 반복적인 검사를 도구에 맡기도록 권한다. 검사의 목적에 따라 도구를 선택한다.

| 방법 | 확인하는 내용 | 한계 |
| --- | --- | --- |
| 컴파일러와 경고 옵션 | 타입 오류와 의심스러운 언어 사용 | 업무 규칙의 정확성까지 판단하지 못함 |
| 정적 분석 | 실행 없이 찾을 수 있는 결함 패턴과 규칙 위반 | 검사별 지원 범위와 오탐 확인 필요 |
| 테스트 | 주어진 입력에 대한 결과 | 실행하지 않은 경우를 보장하지 못함 |
| 실행 중 검사 도구 | 실행한 경로의 일부 메모리 오류와 정의되지 않은 동작 | 도구와 설정에 따라 탐지 범위가 다름 |

위 빌드 명령의 `-Werror`는 발생한 경고를 오류로 처리한다. 모든 종류의 경고를 켜거나 프로그램의 안전성을 보장하는 옵션은 아니다. 새로 검사할 코드의 경고를 먼저 정리하고, 프로젝트에 맞는 분석 항목을 추가할 수 있다.

특정 환경에서만 동작하는 검사 도구는 기본 빌드 절차와 분리할 수 있다. 도구에 대한 의존성 때문에 다른 환경에서 코드 자체를 빌드하기 어려워지지 않는지 확인한다.

## 예제에서 확인할 경계

탐색 예제는 기본 목록, 빈 목록, 원소 하나인 목록, 대상이 없는 목록으로 컴파일하고 실행 결과를 확인했다. 원소를 찾은 경로와 찾지 못한 경로를 모두 검사했다.

실제 프로그램에서는 라이브러리 함수의 전제 조건과 실패 처리도 살펴야 한다. 어떤 함수는 크기 조건을 요구하고, 어떤 컨테이너는 메모리 할당에 실패할 수 있다. 도구 결과와 라이브러리 사용 조건을 코드 리뷰에서 함께 확인한다.

이전 글: [3. 컴파일 시점 검사와 실행 중 검사](/posts/cpp-core-guidelines-03-checks-and-errors/) · [1부 목차](/posts/cpp-core-guidelines-01-reading-guide/)
