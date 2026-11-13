---
title: Windows 11 정품 인증 배치 파일 실행하기
description: Windows 11 KMS 인증 배치 파일의 관리자 권한 실행과 오류별 조치
date: 2026-11-10T14:24:00+09:00
art: code
attachments:
  - 윈도우11정품인증.cmd
---

## 실행 전 확인

KMS(키 관리 서비스)는 조직에서 볼륨 라이선스로 관리하는 PC를 인증할 때 쓴다.

<div class="source-card">
  <a href="https://learn.microsoft.com/ko-kr/windows-server/get-started/kms-client-activation-keys">
    <strong>Windows KMS 클라이언트 정품 인증 키</strong>
    <small>Microsoft Learn · learn.microsoft.com</small>
    <span aria-hidden="true">↗</span>
  </a>
</div>

첨부한 `윈도우11정품인증.cmd`는 웹에서 쉽게 찾아볼 수 있는 KMS 클라이언트 키를 이용해 인증 절차를 한 번에 실행할 수 있도록 만든 배치 파일이다. 실행하면 PC의 Windows 에디션을 확인해 그에 맞는 키를 설치한 뒤, 파일에 지정된 외부 KMS 서버에 인증을 요청한다.

실행하기 전에 이 PC가 조직의 KMS 인증 대상인지 확인하는 게 좋다. 파일 사용에 따른 책임은 사용자에게 있다.

## 관리자 권한으로 실행

<!-- attachments -->

1. 파일 탐색기에서 `윈도우11정품인증.cmd`를 마우스 오른쪽 버튼으로 눌러 **관리자 권한으로 실행**을 선택한다.
2. 사용자 계정 컨트롤 창에서 **예**를 누른다. 명령 창이 열리면 `Detected edition:` 뒤에 나온 이름이 이 PC의 Windows 에디션과 같은지 확인한다.
3. 명령 창에서 인증 요청 결과를 읽고 창을 닫는다.

### 실행 오류

- `Please run this script as administrator.`가 뜨면 파일을 마우스 오른쪽 버튼으로 누르고 **관리자 권한으로 실행**을 선택해 다시 연다.
- `Unsupported Windows edition`은 이 파일에 해당 에디션의 제품 키가 없다는 뜻이다. 이때는 사용 중인 에디션에 맞는 인증 방법을 확인하는 게 좋다.

## 인증 결과 확인

Windows의 **설정 → 시스템 → 정품 인증**을 열면 이 PC의 활성화 상태를 확인할 수 있다.
