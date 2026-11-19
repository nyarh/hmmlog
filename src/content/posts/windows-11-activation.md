---
title: Windows 11 정품 인증 배치 파일 실행하기
description: Windows 11 KMS 인증 배치 파일의 관리자 권한 실행과 오류별 조치
date: 2026-11-10T14:24:00+09:00
art: code
attachments:
  - 윈도우11정품인증.cmd
---

## 실행 방식과 조건

KMS(키 관리 서비스)는 조직에서 볼륨 라이선스로 관리하는 PC를 인증하는 데 사용합니다.

첨부한 `윈도우11정품인증.cmd`는 공개된 KMS 클라이언트 키로 인증 절차를 실행하는 배치 파일입니다. PC의 Windows 에디션을 확인해 해당 키를 설치하고, 파일에 지정된 외부 KMS 서버에 인증을 요청합니다.

실행 전에 해당 PC가 조직의 KMS 인증 대상인지 확인합니다. 파일 사용에 따른 책임은 사용자에게 있습니다.

<div class="source-card">
  <a href="https://learn.microsoft.com/ko-kr/windows-server/get-started/kms-client-activation-keys" target="_blank" rel="noopener">
    <svg class="card-outline" aria-hidden="true" focusable="false">
      <rect x="1" y="1" rx="7" pathLength="1"></rect>
    </svg>
    <strong>Windows KMS 클라이언트 정품 인증 키</strong>
    <small>Microsoft Learn · learn.microsoft.com</small>
    <span role="img" aria-label="새 탭에서 열기">↗</span>
  </a>
</div>

## 관리자 권한으로 실행

<!-- attachments -->

1. 파일 탐색기에서 `윈도우11정품인증.cmd`를 마우스 오른쪽 버튼으로 누르고 관리자 권한으로 실행을 선택합니다.
2. 사용자 계정 컨트롤 창에서 예를 누릅니다. 명령 창의 `Detected edition:` 뒤에 표시된 이름이 PC의 Windows 에디션과 일치하는지 확인합니다.
3. 인증 요청 결과를 확인하고 창을 닫습니다.

### 실행 오류

- `Please run this script as administrator.`가 표시되면 파일을 마우스 오른쪽 버튼으로 누르고 관리자 권한으로 실행을 선택해 다시 엽니다.
- `Unsupported Windows edition`은 파일에 해당 에디션의 제품 키가 없다는 뜻입니다. 사용 중인 에디션에 맞는 인증 방법을 확인합니다.

## 인증 결과 확인

Windows 설정 → 시스템 → 정품 인증에서 PC의 활성화 상태를 확인합니다.
