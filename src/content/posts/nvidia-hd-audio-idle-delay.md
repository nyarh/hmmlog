---
title: HDMI·DisplayPort 오디오에서 무음 뒤 첫 소리가 잘릴 때
description: NVIDIA High Definition Audio 유휴 상태로 인한 재생 지연과 레지스트리 설정 방법
date: 2026-11-14
art: code
---

내 PC는 HDMI/DisplayPort로 소리를 출력한다. 한동안 조용하다가 다시 재생하면 몇 초가 지나서야 소리가 들렸다. 재생을 시작한 직후의 소리가 통째로 빠지는 식이었다.

내 경우에는 NVIDIA 오디오 장치의 유휴 전원 설정을 레지스트리에서 바꾸자 증상이 사라졌다.

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

## 같은 조건으로 소리 확인하기

평소 증상이 나타날 만큼 소리를 멈췄다가 첫마디를 아는 영상을 처음부터 재생해 본다. 내 PC에서는 설정을 바꾼 뒤 무음 다음에도 첫 소리부터 들렸다.

NVIDIA 그래픽 드라이버를 업데이트하면 이 값들이 기본값으로 돌아갈 수 있다. 업데이트 뒤 같은 증상이 생기면 `DriverDesc`로 장치를 다시 찾고 세 값을 확인하면 된다. [NVIDIA 공식 안내와 스크린샷 원문](https://nvidia.custhelp.com/app/answers/detail/a_id/5441)
