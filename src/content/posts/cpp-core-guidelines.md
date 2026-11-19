---
title: C++ Core Guidelines 쉽게 읽기 전체 목차
description: 기초 코드 작성부터 클래스 설계와 동시성까지 이어지는 C++ Core Guidelines 120편의 학습 순서와 규칙별 찾아보기
date: 2026-11-19
category: 개발/C++/Core Guidelines
art: code
attachments:
  - rule-index.csv
---

C++ 문법을 배웠다면 이제 같은 일을 하는 여러 코드 중 어떤 것을 선택할지 고민하게 된다. 이 연재는 C++ Core Guidelines를 바탕으로 선택의 이유와 적용할 조건을 작은 예제로 설명한다.

**본편 120편과 참고글 3개**로 구성하며, 현재는 1부와 2부의 1~19편을 읽을 수 있다. 아래 목차에서 링크가 있는 항목은 작성된 글이고 나머지는 이어서 다룰 주제다. 글이 추가되거나 설명을 나눌 필요가 생기면 목차도 갱신한다.

## 읽기 전에

함수·클래스·포인터의 기본 문법을 알고 있다는 전제로 설명한다. 처음 등장하는 개념은 예제에서 풀어 쓰고, 한 편을 읽은 뒤 자기 코드에서 확인할 질문을 남긴다. 앞부분은 순서대로 읽되 이미 익숙한 내용은 필요한 글로 바로 이동해도 된다.

실행 예제는 C++20을 기본으로 삼고 각 글에서 검증한 컴파일러와 필요한 표준 버전을 적는다. 원문의 권고, 원문에서 미완성으로 남은 내용, 이해를 돕기 위한 보충 설명도 구분한다.

연재의 기준은 아래 공식 문서다. 각 글에는 다루는 규칙 번호와 관련 원문 위치를 함께 적는다.

<div class="source-card">
  <a href="https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines" target="_blank" rel="noopener">
    <svg class="card-outline" aria-hidden="true" focusable="false"><rect x="1" y="1" rx="7" pathLength="1"></rect></svg>
    <strong>C++ Core Guidelines 원문</strong>
    <small>C++ Core Guidelines · isocpp.github.io</small>
    <span role="img" aria-label="새 탭에서 열기">↗</span>
  </a>
</div>

## 1부 가이드라인을 읽는 기준

1. [C++ Core Guidelines의 목적과 읽는 순서](/posts/cpp-core-guidelines-01-reading-guide/)
2. [의도와 단위를 코드의 타입으로 표현하기](/posts/cpp-core-guidelines-02-intent-and-types/)
3. [컴파일할 때 잡을 오류와 실행할 때 확인할 조건](/posts/cpp-core-guidelines-03-checks-and-errors/)
4. [표준 라이브러리와 도구를 활용하는 출발점](/posts/cpp-core-guidelines-04-libraries-and-tools/)

## 2부 변수와 표현식부터 안전하게

5. [변수가 필요한 곳과 살아 있는 범위](/posts/cpp-core-guidelines-05-scope-and-lifetime/)
6. [초기화와 대입, 중괄호와 소괄호의 차이](/posts/cpp-core-guidelines-06-initialization/)
7. [const로 변경 가능한 범위를 줄이기](/posts/cpp-core-guidelines-07-const/)
8. [constexpr로 계산 시점 표현하기](/posts/cpp-core-guidelines-08-constexpr/)
9. [auto를 쓰면 무엇이 추론되고 무엇이 달라질까](/posts/cpp-core-guidelines-09-auto/)
10. [관련 있는 상수를 enum class로 묶기](/posts/cpp-core-guidelines-10-enum-class/)
11. [열거형의 연산과 값, 기반 타입 정하기](/posts/cpp-core-guidelines-11-enum-values/)
12. [signed와 unsigned를 섞을 때 생기는 일](/posts/cpp-core-guidelines-12-signed-and-unsigned/)
13. [정수의 범위와 산술 오류 다루기](/posts/cpp-core-guidelines-13-integer-arithmetic/)
14. [타입 변환이 필요한 곳과 위험해지는 곳](/posts/cpp-core-guidelines-14-conversions/)
15. [복잡한 식과 평가 순서 풀어 읽기](/posts/cpp-core-guidelines-15-expressions-and-order/)
16. [if와 switch로 분기 의도 드러내기](/posts/cpp-core-guidelines-16-branches/)
17. [범위 for와 반복 조건 선택하기](/posts/cpp-core-guidelines-17-loops/)
18. [조기 반환과 break로 제어 흐름 정리하기](/posts/cpp-core-guidelines-18-early-return/)
19. [매크로와 C식 가변 인자의 대안 찾기](/posts/cpp-core-guidelines-19-macros-and-varargs/)

## 3부 함수와 인터페이스

20. 함수 하나가 맡을 일과 이름 정하기
21. 입력과 수정 의도에 따라 인자 전달하기
22. 반환값으로 결과를 전달하고 여러 결과 묶기
23. 값이 없을 수도 있는 인자 표현하기
24. 연속된 데이터는 크기와 함께 전달하기
25. 돌려준 포인터와 참조는 언제까지 유효할까
26. 기본 인자와 오버로드 선택하기
27. 람다와 함수 객체로 작은 동작 전달하기
28. 람다 캡처와 this의 수명 확인하기
29. 잘못 호출하기 어려운 함수 만들기
30. 전역 상태와 싱글턴의 의존성 드러내기
31. 사전 조건과 사후 조건을 코드에 남기기

## 4부 수명과 자원 소유권

32. RAII로 자원 정리를 객체 수명에 연결하기
33. 소유하는 포인터와 빌려 쓰는 포인터 구분하기
34. 동적 할당과 해제를 관리 객체 안에 모으기
35. 한 곳에서 소유할 객체에 unique_ptr 사용하기
36. 공유 소유권과 weak_ptr로 순환 참조 다루기
37. 함수 인자로 소유권을 넘기거나 교체하기
38. shared_ptr 인자의 의미와 별칭 문제 살펴보기
39. std::move와 반환값 최적화 이해하기

## 5부 클래스와 객체의 생애

40. struct와 class를 불변식으로 구분하기
41. 멤버 공개 범위와 구현 세부사항 정리하기
42. 값처럼 쓰기 좋은 타입 설계하기
43. 생성자가 보장해야 하는 유효한 상태
44. 기본 생성과 멤버 기본값 정하기
45. 멤버 선언 순서와 실제 초기화 순서
46. explicit과 생성자 재사용 이해하기
47. 소멸자가 정리해야 하는 것과 실패 처리
48. Rule of Zero와 Rule of Five 적용하기
49. 복사 생성과 복사 대입의 의미 맞추기
50. 이동 후 상태와 이동 연산 설계하기
51. swap이 객체의 안전한 교체를 돕는 방법
52. 동등 비교와 해시의 의미 맞추기
53. 객체에 memcpy와 memset을 적용하기 전 확인할 것
54. 컨테이너를 직접 만들 때 갖춰야 할 동작

## 6부 상속과 다형성

55. 상속이 필요한 관계와 구현 재사용 구분하기
56. 추상 클래스로 인터페이스 분리하기
57. 가상 소멸자와 override의 역할
58. 객체 잘림과 다형적 복사 다루기
59. 다중 상속과 가상 상속, 이름 가림 이해하기
60. 상속 구조에서 데이터 접근 범위 정하기
61. 생성 중 가상 호출과 팩터리 설계
62. dynamic_cast와 가상 함수 사이에서 선택하기
63. 연산자 오버로드와 변환의 의미 지키기
64. union과 variant로 여러 형태의 값 표현하기

## 7부 오류 처리와 실패 시 상태

65. 오류 처리 방침과 예외를 쓸 상황 정하기
66. noexcept가 보장하는 것과 실패했을 때의 동작
67. 예외 타입, 던지기와 잡기의 규칙
68. 예외를 처리할 경계 정하기
69. 예외를 사용할 수 없는 환경의 오류 처리

## 8부 표준 라이브러리 활용

70. array와 vector를 기준으로 컨테이너 고르기
71. 컨테이너의 범위와 참조 무효화 확인하기
72. string과 string_view의 소유권과 수명
73. C 문자열, 문자 하나, 바이트 배열 구분하기
74. 문자열 리터럴과 로케일 이해하기
75. 입력 실패를 고려한 스트림 사용
76. 출력 버퍼, endl과 입출력 동기화

## 9부 템플릿과 제네릭 프로그래밍

77. 템플릿으로 공통 동작과 자료구조 표현하기
78. concepts로 템플릿 인자 조건 표현하기
79. 문법과 의미를 함께 담는 concept 설계
80. 제약 조건의 조합과 과도한 요구 피하기
81. 알고리즘에 연산을 전달하는 방법
82. 별칭과 타입 추론으로 템플릿 사용 단순화하기
83. 템플릿의 이름 탐색과 커스터마이징 지점
84. 템플릿의 의존성과 매개변수 줄이기
85. 특수화와 태그 디스패치 선택하기
86. 가변 인자 템플릿과 완벽 전달 이해하기
87. concepts 이전 코드의 enable_if 읽기
88. 컴파일 시간에 타입과 값 계산하기
89. 템플릿과 상속, 타입 소거를 함께 설계하기

## 10부 성능을 판단하고 개선하기

90. 측정으로 최적화할 지점 찾기
91. 타입과 컴파일 시간 계산으로 최적화 돕기
92. 별칭과 간접 참조가 성능에 미치는 영향
93. 할당과 해제 비용을 줄이는 설계
94. 데이터 배치, 메모리 접근과 실행 경로

## 11부 동시성과 병렬 실행

95. 여러 스레드에서 공유 상태를 다룰 때 생기는 문제
96. 잠금과 보호할 데이터를 함께 관리하기
97. 여러 mutex와 콜백에서 교착 피하기
98. 스레드의 종료와 참조 대상 수명 맞추기
99. 스레드 사이에 값과 소유권 전달하기
100. 조건 변수의 대기 조건과 깨우기
101. 작업 단위로 생각하고 future로 결과 받기
102. 스레드 생성 비용과 잠금 구간 줄이기
103. 코루틴의 중단 지점과 객체 수명
104. 락 프리와 이중 검사 잠금의 어려움
105. volatile과 시그널, 병렬화 관련 빈칸 읽기

## 12부 파일 구성과 라이브러리 경계

106. 헤더와 소스에 선언과 정의 배치하기
107. 독립적으로 읽히는 헤더와 include 관리
108. 네임스페이스와 이름의 공개 범위
109. 파일과 라이브러리의 순환 의존성 끊기
110. C와 C++ 코드를 연결하는 인터페이스
111. ABI 안정성과 Pimpl 적용하기
112. 변경이 잦은 부분과 규칙 예외를 경계 안에 모으기

## 13부 읽기 좋은 코드와 실제 도입

113. 코드를 보완하는 주석과 설명 쓰기
114. 이름과 리터럴을 읽기 쉽게 정하기
115. 일관된 배치와 표기 선택하기
116. 타입 안전성 프로필로 관련 규칙 묶어 적용하기
117. 범위와 수명 안전성 프로필 적용하기
118. GSL의 역할과 표준 라이브러리와의 관계
119. 정적 분석 도구로 규칙 확인하기
120. 기존 코드의 관행을 점검하고 점진적으로 개선하기

## 함께 갱신할 참고글

아래 참고글은 준비 중이다. 본편을 읽는 중에 필요한 용어와 추가 자료를 찾고, 원문이 바뀌었을 때 달라진 내용을 확인하는 용도로 구성한다.

| 참고글 | 다룰 내용 |
| --- | --- |
| 표준 라이브러리의 추가 영역과 자료 안내 | 정규식·시간 등 원문에서 미완성인 영역과 추가 학습 자료 |
| 용어집과 참고 자료 | 한글·영문 용어, 관련 회차와 원문의 참고문헌 |
| 원문 변경 이력과 미완성 항목 | 추가·수정·삭제된 규칙과 연재에 반영한 변경 |

## 규칙 번호로 찾아보기

현재 작성된 글의 규칙은 다음과 같다. 표의 번호는 원문에서 해당 설명을 찾기 위한 식별자다.

| 원문 항목 | 읽을 글 |
| --- | --- |
| In.0, P.2, FAQ.1~10 | [1편 목적과 읽는 순서](/posts/cpp-core-guidelines-01-reading-guide/) |
| P.1, P.3, P.4, P.11, ES.2 | [2편 의도와 타입](/posts/cpp-core-guidelines-02-intent-and-types/) |
| P.5, P.6, P.7 | [3편 오류를 확인할 시점](/posts/cpp-core-guidelines-03-checks-and-errors/) |
| P.12, P.13, ES.1, SL.1, SL.2 | [4편 라이브러리와 도구 활용](/posts/cpp-core-guidelines-04-libraries-and-tools/) |
| ES.5, ES.6, ES.12, ES.21, ES.22, ES.26, NR.1 | [5편 변수가 필요한 곳과 살아 있는 범위](/posts/cpp-core-guidelines-05-scope-and-lifetime/) |
| ES.10, ES.20, ES.23, ES.28, ES.64, NL.21 | [6편 초기화와 대입, 중괄호와 소괄호의 차이](/posts/cpp-core-guidelines-06-initialization/) |
| P.10, Con.1, Con.2, Con.3, Con.4, ES.25 | [7편 const로 변경 가능한 범위를 줄이기](/posts/cpp-core-guidelines-07-const/) |
| Con.5, F.4 | [8편 constexpr로 계산 시점 표현하기](/posts/cpp-core-guidelines-08-constexpr/) |
| ES.11 | [9편 auto를 쓰면 무엇이 추론되고 무엇이 달라질까](/posts/cpp-core-guidelines-09-auto/) |
| Enum.1, Enum.2, Enum.3, Enum.5, Enum.6 | [10편 관련 있는 상수를 enum class로 묶기](/posts/cpp-core-guidelines-10-enum-class/) |
| Enum.4, Enum.7, Enum.8 | [11편 열거형의 연산과 값, 기반 타입 정하기](/posts/cpp-core-guidelines-11-enum-values/) |
| ES.100, ES.101, ES.102, ES.106, ES.107 | [12편 signed와 unsigned를 섞을 때 생기는 일](/posts/cpp-core-guidelines-12-signed-and-unsigned/) |
| ES.103, ES.104, ES.105 | [13편 정수의 범위와 산술 오류 다루기](/posts/cpp-core-guidelines-13-integer-arithmetic/) |
| ES.46, ES.48, ES.49, ES.50 | [14편 타입 변환이 필요한 곳과 위험해지는 곳](/posts/cpp-core-guidelines-14-conversions/) |
| ES.40, ES.41, ES.43, ES.44, ES.45 | [15편 복잡한 식과 평가 순서 풀어 읽기](/posts/cpp-core-guidelines-15-expressions-and-order/) |
| ES.70, ES.78, ES.79, ES.87 | [16편 if와 switch로 분기 의도 드러내기](/posts/cpp-core-guidelines-16-branches/) |
| ES.71, ES.72, ES.73, ES.74, ES.75, ES.86 | [17편 범위 for와 반복 조건 선택하기](/posts/cpp-core-guidelines-17-loops/) |
| F.56, ES.76, ES.77, ES.85, NR.2 | [18편 조기 반환과 break로 제어 흐름 정리하기](/posts/cpp-core-guidelines-18-early-return/) |
| ES.30, ES.31, ES.32, ES.33, ES.34, F.55, NL.9 | [19편 매크로와 C식 가변 인자의 대안 찾기](/posts/cpp-core-guidelines-19-macros-and-varargs/) |

전체 규칙 배정은 아래 CSV에서 검색할 수 있다. 준비 중인 회차는 글 주소를 비워 두었으며, 원문의 초안·미완성·삭제 상태도 표시했다. 원문 확인 기준일은 2026년 11월 19일이다.

<!-- attachments -->
