---
title: HDMI·DisplayPort로 연결했을 때 소리가 몇 초 늦게 나오는 문제
description: NVIDIA 오디오 재생 지연 해결을 위한 레지스트리 설정과 Sound Keeper 사용법
date: 2026-11-14
art: code
---

내 PC는 HDMI/DisplayPort로 소리를 출력한다. 한동안 아무 소리도 재생하지 않다가 영상을 틀면 처음 몇 초 동안 소리가 들리지 않았다. 내 경우에는 레지스트리에서 NVIDIA 오디오 장치의 절전 설정을 바꾸자 영상을 틀었을 때 바로 소리가 났다.

## NVIDIA 오디오 장치 찾기

`Win + R`을 눌러 `regedit`을 실행한다. 레지스트리 편집기 위쪽 주소 표시줄에 아래 경로를 붙여 넣고 Enter를 누른다.

```text
HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\Class\{4d36e96c-e325-11ce-bfc1-08002be10318}
```

왼쪽에 있는 `0000`, `0001`, `0002` 같은 번호를 하나씩 선택한다. 오른쪽의 **DriverDesc** 데이터가 **NVIDIA High Definition Audio**인 곳을 찾는다. 아래 예시에서는 `0001`이지만 번호는 PC마다 다르다.

<img src="/images/posts/nvidia-hd-audio-device.jpg" width="891" height="390" alt="NVIDIA 공식 예시. 0001 키의 DriverDesc에 NVIDIA High Definition Audio가 표시된 모습" />

## PowerSettings의 첫 바이트 바꾸기

찾은 번호를 펼쳐 **PowerSettings**를 선택한다. 수정하기 전에 왼쪽의 `PowerSettings`를 우클릭해 **내보내기**로 백업한다. 나중에 원래 설정으로 돌리려면 레지스트리 편집기의 **파일 → 가져오기**에서 이 파일을 선택하면 된다.

오른쪽에서 다음 세 값을 각각 더블클릭한다. 세 항목 모두 종류가 `REG_BINARY`인 이진 값이다.

- `ConservationIdleTime`
- `PerformanceIdleTime`
- `IdlePowerState`

**값 데이터의 첫 바이트만 `00`으로 바꾼다.** 아래 화면에서 맨 왼쪽의 `00000000`은 위치를 표시하는 숫자다. 그 오른쪽 빨간 테두리 안의 두 자리가 첫 바이트다. 나머지 바이트는 그대로 두고 **확인**을 누른다. 해당 장치 키에 세 항목이 보이지 않으면 값을 새로 만들거나 다른 장치 키를 수정하지 않는다.

<img src="/images/posts/nvidia-hd-audio-edit-byte.jpg" width="1009" height="506" alt="NVIDIA 공식 예시. PerformanceIdleTime의 이진 값 편집 창에서 위치 표시 오른쪽의 첫 바이트 00이 빨간 테두리로 강조된 모습" />

## 드라이버 업데이트 후 다시 설정하기

**NVIDIA 그래픽 드라이버를 업데이트하면 위에서 바꾼 세 값이 기본값으로 돌아갈 수 있다.** 이 방법을 계속 쓰려면 드라이버를 업데이트할 때마다 `DriverDesc`로 장치를 다시 찾는다. `PowerSettings`에서 세 값을 열어 첫 바이트가 초기화된 항목만 다시 `00`으로 바꾼다. [NVIDIA 공식 안내와 스크린샷 원문](https://nvidia.custhelp.com/app/answers/detail/a_id/5441)

## Sound Keeper로 오디오 출력 유지하기

업데이트할 때마다 레지스트리를 손보는 게 번거롭다면 **Sound Keeper**를 쓸 수 있다. 실행 중에는 기본 출력 장치로 귀에 들리지 않는 신호를 계속 보내서 오디오 장치가 유휴 상태로 들어가는 것을 막는다. [Sound Keeper 공식 다운로드 및 사용법](https://veg.by/en/projects/soundkeeper/)

1. Windows 소리 설정에서 평소 쓰는 HDMI 또는 DisplayPort 장치를 기본 출력으로 선택한다.
2. 공식 페이지에서 압축 파일을 받아 풀고 Windows에 맞는 실행 파일을 연다. 일반적인 x64 PC에서는 `SoundKeeper64.exe`를 실행한다. 별도 창은 뜨지 않고 백그라운드에서 동작한다.
3. 한동안 소리를 재생하지 않은 상태로 뒀다가 영상의 첫 대사가 바로 들리는지 확인한다. 계속 쓰려면 `Win + R`에서 `shell:startup`을 열고 실행 파일의 바로 가기를 넣어 둔다. 다음 로그인부터 자동으로 실행된다.
