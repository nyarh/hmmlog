---
title: Windows 11 정품 인증 배치 파일 실행하기
description: Windows 11 KMS 인증 배치 파일의 관리자 권한 실행과 오류별 조치
date: 2026-11-10T14:24:00+09:00
art: code
attachments:
  - 윈도우11정품인증.cmd
---

## 실행 전 확인

`윈도우11정품인증.cmd`는 설치된 Windows 에디션을 읽어 해당 제품 키를 설치하고, 지정된 KMS 서버에 인증을 요청합니다. KMS는 조직이 볼륨 라이선스로 관리하는 PC에 사용하는 인증 방식입니다. [Microsoft KMS 클라이언트 안내](https://learn.microsoft.com/ko-kr/windows-server/get-started/kms-client-activation-keys)

## 관리자 권한으로 실행

<!-- attachments -->

1. 파일 탐색기에서 `윈도우11정품인증.cmd`를 마우스 오른쪽 버튼으로 클릭하고 **관리자 권한으로 실행**을 선택합니다.
2. 사용자 계정 컨트롤 창에서 **예**를 누릅니다. 명령 창에 표시된 `Detected edition:` 뒤의 값이 설치한 에디션과 일치하는지 확인합니다.
3. 인증 요청의 결과를 확인하고 창을 닫습니다.

### 실행 오류

- `Please run this script as administrator.` — 관리자 권한이 필요합니다. 파일을 우클릭하고 **관리자 권한으로 실행**을 선택하세요.
- `Unsupported Windows edition` — 이 파일에 해당 Windows 에디션의 제품 키가 없습니다. 사용 중인 에디션에 맞는 인증 방법을 확인하세요.

## 인증 결과 확인

**설정 → 시스템 → 정품 인증**에서 활성화 상태를 확인합니다.
