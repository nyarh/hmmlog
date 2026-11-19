---
slug: cpp-core-guidelines-04-libraries-and-tools
title: C++ Core Guidelines 4. 표준 라이브러리와 도구 활용
description: 이름 탐색을 예로 보는 라이브러리 선택과 검사 도구의 역할
date: 2026-11-19
category: 개발/C++/Core Guidelines
art: code
---

사용자 이름 목록에 특정 이름이 있는지 확인하는 기능을 만든다고 하자. 반복문으로 이름을 하나씩 비교할 수도 있고, 표준 라이브러리의 탐색 함수를 사용할 수도 있다. 탐색 함수를 쓰면 반복 조건을 직접 관리하는 코드가 줄고 무엇을 찾는지 드러난다.

## 탐색을 라이브러리에 맡긴다

표준 라이브러리가 필요한 기능을 제공한다면 우선 사용하는 게 좋다.<sup>[ES.1](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#res-lib) · [SL.2](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#rsl-sl)</sup> 아래 코드는 사용자 이름 목록에 `ji`가 있는지 확인한다.

```cpp
const std::vector<std::string> users{"min", "ji", "sol"};
const auto found = std::ranges::find(users, "ji");
const bool has_user = found != users.end();
```

`std::ranges::find`는 C++20부터 제공된다. 탐색할 범위와 값을 받아 첫 번째 일치 항목을 가리키는 반복자를 반환한다. 찾지 못하면 끝 반복자를 반환하므로 `users.end()`와 비교한다. 목록이 비어 있을 때도 `has_user`는 `false`가 된다.

찾은 원소를 읽으려면 끝 반복자가 아닌지 먼저 확인해야 한다. 또 탐색 후 컨테이너를 변경하면 반복자가 무효가 되는 경우가 있다. 결과를 오래 보관할 때는 해당 연산의 무효화 조건을 확인한다.

표준 라이브러리의 이름과 사용 방식은 여러 프로젝트에서 통한다. 직접 만든 탐색 함수를 읽고 동작을 파악하는 비용이 줄고, 함수의 전제 조건과 복잡도도 표준 라이브러리 문서에서 확인할 수 있다.

## 요구사항에 맞는 라이브러리를 고른다

필요에 맞는 라이브러리가 있다면 활용하는 게 좋다.<sup>[SL.1](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#rsl-lib)</sup> 직접 구현할 때 드는 테스트와 유지 비용을 줄이고, 라이브러리의 개선을 여러 사용자가 공유할 수 있다.

라이브러리를 선택할 때는 기능뿐 아니라 문서와 유지 관리 상태도 확인한다.<sup>[P.13](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#rp-lib)</sup> 프로젝트에서 이미 쓰는 라이브러리로 요구사항을 충족할 수 있는지 살피고, 부족하면 해당 분야의 라이브러리를 검토한다. 가이드라인 적용을 돕는 GSL(Guidelines Support Library)도 있으며, ISO C++ 표준 라이브러리와는 별개의 지원 라이브러리다.

동적 메모리 할당을 제한하는 실시간·임베디드 환경에서는 `std::vector` 같은 컨테이너를 그대로 쓰기 어려울 수 있다. 이 경우에는 크기가 고정된 저장 공간이나 허용된 할당 방식을 사용하는 컨테이너를 검토한다.<sup>[ES.1](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#res-lib)</sup> 표준 알고리즘은 컨테이너와 구분해서 판단한다. 필요한 반복자와 연산을 제공하는 저장 공간이라면 같은 탐색 알고리즘을 사용할 수 있다.

성능이 중요한 경로는 요구되는 복잡도와 실제 입력을 기준으로 살핀다. 라이브러리를 사용한다는 사실만으로 특정 구현에서의 실행 시간을 알 수는 없다.

## 반복적인 검사는 도구에 맡긴다

코드가 늘어나면 같은 실수를 사람이 매번 찾기 어렵다. 반복적으로 확인할 수 있는 오류는 목적에 맞는 도구로 검사하는 게 좋다.<sup>[P.12](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#rp-tools)</sup>

| 방법 | 확인하는 내용 | 한계 |
| --- | --- | --- |
| 컴파일러와 경고 | 타입 오류와 의심스러운 언어 사용 | 프로그램의 요구사항까지 판단하지 못한다 |
| 정적 분석 | 실행 없이 찾을 수 있는 결함과 규칙 위반 | 검사별 지원 범위와 오탐을 확인해야 한다 |
| 테스트 | 주어진 입력에 대한 동작 | 다루지 않은 경우의 동작은 보장하지 않는다 |
| 실행 중 검사 도구 | 실행한 경로의 일부 메모리 오류와 정의되지 않은 동작 | 도구와 설정에 따라 탐지 범위가 다르다 |

가이드라인의 Enforcement 항목을 보고 필요한 검사를 고를 수 있다. 도구가 경고한 위치에서는 해당 규칙의 이유와 예외를 읽고 수정 여부를 판단한다. 경고가 없더라도 기능이 요구사항에 맞는지, 라이브러리의 전제 조건을 지키는지는 별도로 검토한다.

전용 분석 도구를 도입할 때는 지원하는 운영체제와 컴파일러도 확인한다. 특정 도구가 없는 환경에서도 기본 빌드를 할 수 있게 구성하면, 분석 도구 때문에 코드의 사용 환경이 불필요하게 제한되는 일을 줄일 수 있다.

이전 글: [3. 컴파일 시점 검사와 실행 중 검사](/posts/cpp-core-guidelines-03-checks-and-errors/) · [1부 목차](/posts/cpp-core-guidelines-01-reading-guide/)
