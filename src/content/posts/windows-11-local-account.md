---
title: Windows 11 설치 중 로컬 계정 만들기
description: Windows 11 설치 화면에서 명령 프롬프트를 이용한 로컬 계정 생성
date: 2026-11-10T13:58:00+09:00
art: code
---

## 설치 중 계정 만들기

Windows 11 빌드에 따라 초기 설정 중에 로컬 계정을 만들 수 있다. **Microsoft 계정 로그인 화면**에서 `Shift + F10`을 누르면 명령 프롬프트가 열린다. 여기에 아래 명령을 입력하고 `Enter`를 누른다.

```bat
start ms-cxh:localonly
```

로컬 계정 생성 창이 뜨면 이 PC에서 쓸 **사용자 이름**을 입력한다. 이어서 화면 안내에 따라 암호를 정하고 남은 설치 단계를 마친다.

## 계정 생성 창이 열리지 않을 때

명령을 입력해도 창이 뜨지 않는다면 설치 중인 빌드에서 이 기능을 지원하지 않을 수 있다. Microsoft는 일부 Insider Preview 빌드에서 초기 설정 중 로컬 계정을 만드는 명령을 제거한다고 안내했다.

<div class="source-card">
  <a href="https://blogs.windows.com/windows-insider/2025/10/06/announcing-windows-11-insider-preview-build-26220-6772-dev-channel/">
    <strong>Windows 11 Insider Preview 빌드 26220.6772 변경 사항</strong>
    <small>Windows Insider Blog · blogs.windows.com</small>
    <span aria-hidden="true">↗</span>
  </a>
</div>

이 경우에는 Microsoft 계정으로 설치를 마친 뒤 로컬 계정으로 바꿀 수 있다. Windows **설정 → 계정 → 사용자 정보**에서 **대신 로컬 계정으로 로그인**을 선택한다.

<div class="source-card">
  <a href="https://support.microsoft.com/ko-kr/accounts-billing/manage/change-from-a-local-account-to-a-microsoft-account-in-windows">
    <strong>Windows에서 Microsoft 계정과 로컬 계정 간 전환</strong>
    <small>Microsoft 지원 · support.microsoft.com</small>
    <span aria-hidden="true">↗</span>
  </a>
</div>
