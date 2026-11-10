---
title: Windows 11 설치 중 로컬 계정 만들기
description: Microsoft 계정 로그인 화면에서 Shift + F10으로 명령 프롬프트를 열고 로컬 계정을 만드는 방법입니다.
date: 2026-11-10T13:58:00+09:00
art: code
---

## 설치 중 계정 만들기

Windows 11 초기 설정에서 **Microsoft 계정 로그인 화면**이 나오면 `Shift + F10`을 눌러 명령 프롬프트(cmd)를 엽니다. 아래 명령을 입력하고 `Enter`를 누릅니다.

```bat
start ms-cxh:localonly
```

로컬 계정 생성 창이 열리면 이 PC에서 사용할 **사용자 이름**을 입력합니다. 화면 안내에 따라 암호를 설정하고 남은 설치 단계를 마칩니다.

## 계정 생성 창이 열리지 않을 때

이 명령의 동작 여부는 Windows 11 빌드에 따라 다릅니다. Microsoft는 일부 Insider Preview 빌드에서 초기 설정 중 로컬 계정을 만드는 명령을 제거한다고 안내했습니다. [Windows Insider 변경 사항](https://blogs.windows.com/windows-insider/2025/10/06/announcing-windows-11-insider-preview-build-26220-6772-dev-channel/)

명령이 동작하지 않으면 Microsoft 계정으로 초기 설정을 마친 뒤, **설정 → 계정 → 사용자 정보 → 대신 로컬 계정으로 로그인**을 선택해 전환할 수 있습니다. [Microsoft 계정 전환 안내](https://support.microsoft.com/ko-kr/accounts-billing/manage/change-from-a-local-account-to-a-microsoft-account-in-windows)
