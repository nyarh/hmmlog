---
slug: cpp-core-guidelines-01-reading-guide
title: C++ Core Guidelines 1. 목적과 읽는 순서
description: C++ Core Guidelines의 역할과 규칙을 읽고 적용하는 기준
date: 2026-11-19
category: 개발/C++/Core Guidelines
art: code
---

C++ Core Guidelines는 C++ 코드를 설계하고 구현할 때 참고하는 지침이다. 타입 오류와 자원 관리 실수를 줄이고, 코드의 의도를 드러내는 방법을 다룬다. 함수, 클래스, 포인터의 기본 문법을 아는 독자를 대상으로 설명한다.

1부는 규칙을 읽고 적용하는 기준을 네 편으로 나눈다.

| 회차 | 주제 |
| --- | --- |
| 1 | 목적과 읽는 순서 |
| [2](/posts/cpp-core-guidelines-02-intent-and-types/) | 의도와 단위를 타입으로 표현하기 |
| [3](/posts/cpp-core-guidelines-03-checks-and-errors/) | 컴파일 시점 검사와 실행 중 검사 |
| [4](/posts/cpp-core-guidelines-04-libraries-and-tools/) | 표준 라이브러리와 도구 활용 |

## 표준과 가이드라인의 역할

ISO C++ 표준은 언어와 표준 라이브러리의 동작을 정의한다. 가이드라인은 그 기능을 사용하는 방식을 권고한다. 문법에 맞는 코드라도 실수가 잦은 방식이면 다른 방법을 제안할 수 있다. 표준 위원회가 승인한 규범 문서는 아니며, 새 언어 기능을 제안하는 문서도 아니다.<sup>[FAQ.6](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#faq-iso) · [FAQ.9](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#faq-language-extensions)</sup>

코드는 ISO 표준 C++의 기능으로 작성하는 게 좋다. 시스템 자원에 접근하기 위해 표준 밖의 기능이 필요하면, 그 코드를 별도의 인터페이스 안에 모아 다른 환경에서 교체할 수 있게 한다.<sup>[P.2](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#rp-cplusplus)</sup>

표준 C++을 사용해도 모든 환경에서 같은 동작이 보장되지는 않는다. 정수 타입의 크기처럼 구현에 따라 달라지는 조건이 있고, 배열 범위를 벗어난 접근처럼 동작을 보장하지 않는 코드도 있다. 동적 메모리 할당을 제한하는 실시간 시스템에는 별도의 프로젝트 규칙이 필요하다.

## 규칙은 이유와 예외까지 읽는다

규칙 번호의 문자는 주제를 나타낸다. `P.1`의 `P`는 설계 철학, `F`는 함수, `R`은 자원 관리, `ES`는 식과 문장을 뜻한다. 번호는 원문에서 규칙을 찾는 식별자다.

규칙의 제목은 짧아서 적용 조건을 모두 담지 못한다. 본문에서 다음 내용을 함께 확인한다.

| 항목 | 읽을 내용 |
| --- | --- |
| Reason | 어떤 오류나 비용을 줄이려는가 |
| Example, Alternative | 문제가 생기는 코드와 제안하는 대안 |
| Exception, Note | 예외와 적용 조건 |
| Enforcement | 컴파일러, 분석 도구, 리뷰로 확인할 방법 |
| Discussion | 제목과 짧은 예제만으로 부족한 설명 |

원문의 예제는 규칙의 뜻을 보여 주는 데 필요한 부분만 제시한다. 주변 선언이나 오류 처리가 생략될 수 있다. 예제를 실제 코드에 옮길 때는 호출 조건과 실패 처리도 확인해야 한다.

## 필요한 규칙부터 적용한다

작업 중인 문제에서 관련 규칙을 찾아 읽을 수 있다. 함수 인자를 자주 뒤바꾼다면 인터페이스와 타입 규칙을, 메모리가 해제된 뒤에도 포인터를 사용한다면 수명 규칙을 살펴본다. 분석 도구의 경고에서 연결된 규칙을 찾아가는 방법도 있다.

규칙은 현재 프로그램에 미치는 영향을 이해한 뒤 적용하는 게 좋다.<sup>[In.0](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#r0)</sup> 기존 코드에서는 변경할 함수나 모듈을 정하고 동작을 확인하면서 적용 범위를 넓힌다. 외부 API와의 호환성 때문에 바꾸기 어려운 부분은 그 제약을 남기고 경계를 정한다.

Enforcement에는 현재 가능한 검사와 앞으로 도구가 지원하기를 바라는 아이디어가 함께 있다. 적힌 항목을 모든 분석 도구가 검사한다고 받아들이면 안 된다. 실제 지원 범위와 오탐을 확인해야 한다.

관련 규칙을 묶은 프로필도 있다. `type`은 타입 사용, `bounds`는 배열 범위, `lifetime`은 객체 수명과 자원 관리를 다룬다. 이 분류는 도구가 검사할 범위를 정하거나 사람이 관련 규칙을 찾을 때 쓸 수 있다. 문서의 구성과 검사 방침은 [Introduction](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#s-introduction)에 정리돼 있다.

## 원문과 프로젝트

가이드라인은 표준 C++의 사용 지침을 공개적으로 관리하는 프로젝트다.<sup>[FAQ.1](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#faq-aims)</sup> Bjarne Stroustrup이 CppCon 2015에서 처음 발표했고, Stroustrup과 Herb Sutter가 초기 저자와 유지 관리자로 참여했다.<sup>[FAQ.2](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#faq-announced) · [FAQ.3](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#faq-maintainers)</sup> 저장소 이름의 `isocpp`는 Standard C++ Foundation을 뜻한다.<sup>[FAQ.7](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#faq-isocpp)</sup>

원문은 계속 수정되며 미완성 항목도 있다. 현재 소개문은 C++17과 C++20을 중심으로 범위를 설명한다. C++98이나 C++11용 지침을 따로 나누어 제공하지는 않는다.<sup>[FAQ.8](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#faq-cpp98)</sup> 개별 기능을 사용할 수 있는 표준 버전은 별도로 확인해야 한다.

내용에 문제가 있거나 설명을 보완하려면 저장소의 기여 지침에 따라 제안할 수 있다. 편집과 유지 관리 참여는 지속적인 기여와 그 품질에 대한 인정을 바탕으로 한다.<sup>[FAQ.4](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#faq-contribute) · [FAQ.5](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#faq-maintainer)</sup> 문서 형식은 CommonMark와 HTML 앵커를 사용하며, 이 글의 첨자 링크는 원문의 해당 항목으로 연결된다.<sup>[FAQ.10](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#faq-markdown)</sup>

다음 글: [2. 의도와 단위를 타입으로 표현하기](/posts/cpp-core-guidelines-02-intent-and-types/)
