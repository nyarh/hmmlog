# C++ Core Guidelines 1부

2026년 11월 19일 한다체·간결하고 건조한 문체를 기준으로 새로 작성한 1~4편이다. 1편에 1부 목차를 두고 각 글을 이전·다음 링크로 연결한다.

| 회차 | 파일 | 원문 범위 |
| --- | --- | --- |
| 1 | `src/content/posts/series/cpp-core-guidelines/01-reading-guide.md` | Introduction, In.0, P.2, FAQ.1~10 |
| 2 | `src/content/posts/series/cpp-core-guidelines/02-intent-and-types.md` | P.1, P.3, P.4, P.11, ES.2 |
| 3 | `src/content/posts/series/cpp-core-guidelines/03-checks-and-errors.md` | P.5, P.6, P.7 |
| 4 | `src/content/posts/series/cpp-core-guidelines/04-libraries-and-tools.md` | P.12, P.13, ES.1, SL.1, SL.2 |

## 파일 위치와 게시 주소

원고는 `src/content/posts/series/cpp-core-guidelines/`에서 관리한다. 각 글의 frontmatter에 기존 게시 주소의 식별자를 `slug`로 지정했으므로 폴더 이동과 파일명 변경 후에도 URL은 같다. 예를 들어 `01-reading-guide.md`의 주소는 `/posts/cpp-core-guidelines-01-reading-guide/`다.

`validation-part1.json`의 파일 경로와 해시는 최초 발행 당시의 기록이다. 현재 원고의 위치는 위 표를 기준으로 한다. 폴더 정리 과정에서는 본문을 바꾸지 않았으며, `slug`만 메타데이터에 추가했다.

## 원문

[isocpp/CppCoreGuidelines](https://github.com/isocpp/CppCoreGuidelines)의 `CppCoreGuidelines.md`를 GitHub 연결 도구로 가져와 확인했다. 파일의 blob SHA는 `b4065b4d7ecb11d6e13b4e3738344452ccccc252`이며, 원문에 표시된 날짜는 2026년 6월 14일이다. 규칙의 이유와 예외, 검사 방법을 함께 읽고 본문에 해당 규칙 링크를 달았다.

## 검증

게시할 Markdown에서 완전한 C++ 프로그램을 추출해 Linux의 GCC 14.2.0으로 검사했다. 기본 옵션은 `-std=c++20 -Wall -Wextra -Wpedantic -Wconversion -Werror`다.

- 2편: 기본 출력, 초 단위의 밀리초 변환, 음수 횟수를 허용하는 타입의 한계를 확인했다. 뒤바뀐 타입과 타입으로 감싸지 않은 횟수는 컴파일 실패로 확인했다.
- 3편: 1~4, 주변 공백, 음수·0·상한 초과·정수 범위 초과·숫자 외 문자·여분 토큰·빈 입력을 확인했다. 0인 용량은 컴파일 실패로 확인했다. 양 끝 입력은 UndefinedBehaviorSanitizer를 켠 실행에서도 확인했다.
- 4편: 기본 목록, 빈 목록, 원소 하나인 목록의 성공·실패, 여러 원소가 있지만 대상이 없는 목록을 확인했다.

컴파일·실행 검사 38건이 기대한 결과를 냈다. 본문의 명령과 결과는 이 검사에 대응한다. 네트워크 재시도와 실제 대기는 수행하지 않으며, 예제에서 성능을 측정하지 않았다.

Humanizer v4.0.0 지침에 따라 초고 전체를 읽고 반복, 불필요한 대조, 형식적인 문장을 다듬었다. 네 편의 도입과 소제목별 본문 21개 구간을 모두 검토했다. 퇴고 전후의 코드·명령·메타데이터·링크를 대조한 결과와 빌드 검증은 `validation-part1.json`에 기록한다.
