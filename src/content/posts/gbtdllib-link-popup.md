---
title: 앱을 다운로드하여 이 'gbtdllib' 링크를 여세요 해결법
description: GIGABYTE Control Center 재설치로 해결한 gbtdllib 링크 팝업
date: 2026-11-10T16:52:00+09:00
art: blocks
---

어느 날부터인가 Windows에 “앱을 다운로드하여 이 'gbtdllib' 링크를 여세요”라는 팝업이 뜨기 시작했습니다.

<img src="/images/posts/gbtdllib-popup.png" width="743" height="404" alt="gbtdllib 링크를 열 수 있는 앱이 없다며 Microsoft Store 검색을 제안하는 Windows 팝업" />

## GIGABYTE Control Center 재설치

제 PC에서 이 팝업의 원인은 **GIGABYTE Control Center**(GCC)였습니다. 아래 순서로 GCC를 삭제하고 다시 설치했습니다.

1. Windows **설정 → 앱 → 설치된 앱**에서 **GIGABYTE Control Center**를 찾아 **제거**를 선택합니다.
2. GCC 설치 파일을 내려받아 다시 설치합니다. [GIGABYTE Control Center 공식 다운로드](https://www.gigabyte.com/Consumer/Software/GIGABYTE-Control-Center/global/)

재설치를 마친 뒤에는 `gbtdllib` 팝업이 더 이상 뜨지 않았습니다.
