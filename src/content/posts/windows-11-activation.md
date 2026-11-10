---
title: Windows 11 정품 인증 배치 파일 실행하기
description: 윈도우11정품인증.cmd의 KMS 서버 설정을 확인하고, 관리자 권한으로 실행한 뒤 인증 상태를 확인하는 방법입니다.
date: 2026-11-10T14:24:00+09:00
art: code
attachments:
  - 윈도우11정품인증.cmd
---

## 실행 전 확인

`윈도우11정품인증.cmd`는 설치된 Windows 에디션을 읽어 해당 제품 키를 설치하고, 지정된 KMS 서버에 인증을 요청합니다. KMS는 조직이 볼륨 라이선스로 관리하는 PC에 사용하는 인증 방식입니다. [Microsoft KMS 클라이언트 안내](https://learn.microsoft.com/ko-kr/windows-server/get-started/kms-client-activation-keys)

먼저 파일을 메모장으로 열어 `/skms` 뒤의 주소를 확인하세요. 이 파일에 지정된 서버는 `kms8.msguides.com`입니다. 실행하면 기존 제품 키와 인증 서버 설정이 바뀌므로, 조직에서 사용 권한을 받은 PC에 한해 담당자가 안내한 KMS 주소로 설정한 뒤 진행하세요.

개인용 PC는 **설정 → 시스템 → 정품 인증**에서 상태를 확인하세요. 이미 디지털 라이선스로 인증되어 있다면 추가 작업이 필요 없습니다. 구입한 제품 키가 있다면 같은 화면의 **제품 키 변경**에서 입력할 수 있습니다. [Microsoft의 Windows 정품 인증 안내](https://support.microsoft.com/ko-kr/windows/activation/activate-windows)

## 관리자 권한으로 실행

<!-- attachments -->

1. 파일 탐색기에서 `윈도우11정품인증.cmd`를 마우스 오른쪽 버튼으로 클릭하고 **관리자 권한으로 실행**을 선택합니다.
2. 사용자 계정 컨트롤 창에서 **예**를 누릅니다. 명령 창에 표시된 `Detected edition:` 뒤의 값이 설치한 에디션과 일치하는지 확인합니다.
3. 마지막 인증 요청의 결과 메시지를 확인하고 창을 닫습니다. `Please run this script as administrator.`가 표시되면 관리자 권한이 없는 상태이고, `Unsupported Windows edition`이 표시되면 이 파일에 해당 에디션의 키가 없는 상태입니다.

## 인증 결과 확인

**설정 → 시스템 → 정품 인증**에서 활성화 상태를 확인합니다. KMS 인증의 만료일은 명령 프롬프트에서 다음 명령으로 확인할 수 있습니다.

```bat
slmgr /xpr
```

인증이 실패했다면 명령 창의 오류 코드를 기록하고 조직의 KMS 서버에 연결할 수 있는지 확인하세요. 인증에 실패해도 앞서 설치한 제품 키와 서버 설정은 자동으로 복구되지 않습니다. [Microsoft의 slmgr 명령 설명](https://learn.microsoft.com/ko-kr/windows-server/get-started/activation-slmgr-vbs-options)
