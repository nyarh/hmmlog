@echo off
setlocal EnableExtensions

rem Windows 관리자 권한 확인
powershell.exe -NoProfile -NonInteractive -Command ^
  "if (([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) { exit 0 } else { exit 1 }"

if errorlevel 1 (
    echo Please run this script as administrator.
    exit /b 1
)

rem Windows EditionID 읽기
set "edition="
for /f "tokens=2,*" %%A in ('reg query "HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion" /v EditionID 2^>nul') do (
    if /i "%%A"=="REG_SZ" set "edition=%%B"
)

if not defined edition (
    echo Failed to read Windows EditionID.
    exit /b 1
)

rem 에디션별 제품 키 선택
set "key="

if /i "%edition%"=="Core"                     set "key=TX9XD-98N7V-6WMQ6-BX7FG-H8Q99"
if /i "%edition%"=="CoreN"                    set "key=3KHY7-WNT83-DGOKR-F7HPR-844BM"
if /i "%edition%"=="Professional"             set "key=W269N-WFGWX-YVC9B-4J6C9-T83GX"
if /i "%edition%"=="ProfessionalN"            set "key=MH37W-N47XK-V7XM9-C7227-GCQG9"
if /i "%edition%"=="ProfessionalWorkstation"  set "key=NRG8B-VKK3Q-CXVCJ-9G2XF-6Q84J"
if /i "%edition%"=="ProfessionalWorkstationN" set "key=9FNHH-K3HBT-3W4TD-6383H-6XYWF"
if /i "%edition%"=="Enterprise"               set "key=NPPR9-FWDCX-D2C8J-H872K-2YT43"
if /i "%edition%"=="EnterpriseN"              set "key=DPH2V-TTNVB-4X9Q3-TJR4H-KHJW4"
if /i "%edition%"=="EnterpriseG"              set "key=YYVX9-NTFWV-6MDM3-9PT4T-4M68B"
if /i "%edition%"=="EnterpriseGN"             set "key=44RPN-FTY23-9VTTB-MP9BX-T84FV"

if not defined key (
    echo Unsupported Windows edition: %edition%
    exit /b 1
)

echo Detected edition: %edition%

rem 제품 키 설치
cscript.exe //Nologo "%SystemRoot%\System32\slmgr.vbs" /ipk %key%
if errorlevel 1 exit /b 1

rem KMS 서버 설정
cscript.exe //Nologo "%SystemRoot%\System32\slmgr.vbs" /skms kms8.msguides.com
if errorlevel 1 exit /b 1

rem 정품 인증
cscript.exe //Nologo "%SystemRoot%\System32\slmgr.vbs" /ato
set "result=%errorlevel%"

pause
exit /b %result%