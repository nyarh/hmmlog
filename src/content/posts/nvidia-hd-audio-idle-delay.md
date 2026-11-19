---
title: PC 소리가 몇 초 늦게 나오는 문제 해결법
description: NVIDIA 오디오 재생 지연 해결을 위한 레지스트리 설정과 Sound Keeper 사용법
date: 2026-11-14
art: code
---

NVIDIA 그래픽카드에 모니터를 HDMI로 연결해 내장 스피커를 사용했습니다. 한동안 소리를 재생하지 않다가 영상을 틀면 처음 몇 초 동안 소리가 들리지 않았습니다.

레지스트리에서 NVIDIA 오디오 장치의 절전 설정을 변경한 뒤에는 영상 재생과 함께 소리가 나왔습니다. 다른 제조사의 그래픽카드에서는 확인하지 않았습니다.

일부 HDMI 오디오 출력 장치는 신호가 한동안 들어오지 않으면 절전을 위해 유휴 상태로 전환됩니다. 재생을 시작하면 장치가 깨어나는 동안에도 영상은 계속 진행됩니다. 이 과정에서 처음 몇 초의 소리가 들리지 않을 수 있습니다.

## NVIDIA 오디오 장치 확인

`Win + R`을 눌러 `regedit`을 실행합니다. 레지스트리 편집기의 주소 표시줄에 다음 경로를 입력하고 Enter를 누릅니다.

```text
HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\Class\{4d36e96c-e325-11ce-bfc1-08002be10318}
```

왼쪽의 `0000`, `0001`, `0002` 같은 번호를 하나씩 선택합니다. 오른쪽에서 DriverDesc 데이터가 NVIDIA High Definition Audio인 키를 찾습니다. 예시에서는 `0001`이며, 번호는 PC마다 다릅니다.

<img src="/images/posts/nvidia-hd-audio-device.jpg" width="891" height="390" alt="NVIDIA 공식 예시. 0001 키의 DriverDesc에 NVIDIA High Definition Audio가 표시된 모습" />

## PowerSettings 변경

찾은 장치 키를 펼쳐 PowerSettings를 선택합니다. 수정 전에 왼쪽의 `PowerSettings`를 마우스 오른쪽 버튼으로 누르고 내보내기로 백업합니다. 원래 설정을 복원하려면 레지스트리 편집기의 파일 → 가져오기에서 백업 파일을 선택합니다.

오른쪽에서 다음 세 값을 각각 더블클릭합니다. 모두 종류가 `REG_BINARY`인 이진 값입니다.

- `ConservationIdleTime`
- `PerformanceIdleTime`
- `IdlePowerState`

세 항목에서 값 데이터의 첫 바이트만 `00`으로 바꿉니다. 화면 맨 왼쪽의 `00000000`은 위치 표시이며, 그 오른쪽 빨간 테두리 안의 두 자리가 첫 바이트입니다. 나머지 바이트는 그대로 두고 확인을 누릅니다.

해당 장치 키에 세 항목이 보이지 않으면 값을 새로 만들거나 다른 장치 키를 수정하지 않습니다.

<img src="/images/posts/nvidia-hd-audio-edit-byte.jpg" width="1009" height="506" alt="NVIDIA 공식 예시. PerformanceIdleTime의 이진 값 편집 창에서 위치 표시 오른쪽의 첫 바이트 00이 빨간 테두리로 강조된 모습" />

<div class="source-card">
  <a href="https://nvidia.custhelp.com/app/answers/detail/a_id/5441" target="_blank" rel="noopener">
    <svg class="card-outline" aria-hidden="true" focusable="false">
      <rect x="1" y="1" rx="7" pathLength="1"></rect>
    </svg>
    <strong>NVIDIA 오디오 절전 설정과 레지스트리 화면</strong>
    <small>NVIDIA 지원 · nvidia.custhelp.com</small>
    <span role="img" aria-label="새 탭에서 열기">↗</span>
  </a>
</div>

## 드라이버 업데이트 후 확인

NVIDIA 그래픽 드라이버를 업데이트하면 변경한 세 값이 기본값으로 돌아갈 수 있습니다. 업데이트 후 값을 확인하고, 초기화됐다면 같은 절차로 다시 설정합니다.

## Sound Keeper 사용

레지스트리를 변경하지 않고 오디오 출력을 유지하려면 Sound Keeper를 사용할 수 있습니다. 실행 중에는 기본 출력 장치에 귀에 들리지 않는 신호를 계속 보내 장치의 유휴 상태 전환을 막습니다.

<div class="source-card">
  <a href="https://veg.by/en/projects/soundkeeper/" target="_blank" rel="noopener">
    <svg class="card-outline" aria-hidden="true" focusable="false">
      <rect x="1" y="1" rx="7" pathLength="1"></rect>
    </svg>
    <strong>Sound Keeper 다운로드 및 사용법</strong>
    <small>개발자 공식 페이지 · veg.by</small>
    <span role="img" aria-label="새 탭에서 열기">↗</span>
  </a>
</div>

1. Windows 소리 설정에서 사용하는 HDMI 또는 DisplayPort 장치를 기본 출력으로 선택합니다.
2. 공식 페이지에서 압축 파일을 받아 풀고 Windows에 맞는 실행 파일을 엽니다. 일반적인 x64 PC에서는 `SoundKeeper64.exe`를 실행합니다. 별도 창 없이 백그라운드에서 동작합니다.
3. 한동안 소리를 재생하지 않은 상태로 뒀다가 영상의 첫 대사가 바로 들리는지 확인합니다.
4. 자동 실행하려면 `Win + R`에서 `shell:startup`을 열고 실행 파일의 바로 가기를 넣습니다. 다음 로그인부터 실행됩니다.
