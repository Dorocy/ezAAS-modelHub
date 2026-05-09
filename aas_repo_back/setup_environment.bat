@echo off
setlocal enabledelayedexpansion

REM AAS Repository Backend - Windows Environment Setup Script
echo.
echo [INFO] AAS Repository Backend - Windows Environment Setup
echo [INFO] =================================================
echo.

REM 색상 설정 (Windows 10/11에서 지원)
for /f %%i in ('echo prompt $E ^| cmd') do set "ESC=%%i"
set "GREEN=%ESC%[32m"
set "YELLOW=%ESC%[33m"
set "RED=%ESC%[31m"
set "BLUE=%ESC%[34m"
set "NC=%ESC%[0m"

REM Chocolatey 설치 확인 및 설치
echo [INFO] Checking Chocolatey package manager...
choco --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('choco --version 2^>^&1') do set "choco_version=%%i"
    echo [SUCCESS] Chocolatey already installed: !choco_version!
) else (
    echo [INFO] Installing Chocolatey package manager...
    powershell -Command "Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))"
    if %errorlevel% equ 0 (
        echo [SUCCESS] Chocolatey installed successfully
        REM PATH 새로고침
        call refreshenv
    ) else (
        echo [ERROR] Failed to install Chocolatey
        echo [INFO] Please install manually from: https://chocolatey.org/install
        pause
        exit /b 1
    )
)

REM Python 3.13 무조건 설치
echo [INFO] Installing Python 3.13...
echo [INFO] Installing Python 3.13 via Chocolatey...
choco install python313 -y
if %errorlevel% equ 0 (
    echo [SUCCESS] Python 3.13 installed successfully
    REM PATH 새로고침
    call refreshenv
) else (
    echo [WARNING] Failed to install Python 3.13 via Chocolatey, trying alternative method...
    echo [INFO] Downloading Python 3.13 directly from python.org...
    powershell -Command "Invoke-WebRequest -Uri 'https://www.python.org/ftp/python/3.13.1/python-3.13.1-amd64.exe' -OutFile 'python-3.13.1-installer.exe'"
    if exist "python-3.13.1-installer.exe" (
        echo [INFO] Installing Python 3.13 from downloaded installer...
        python-3.13.1-installer.exe /quiet InstallAllUsers=1 PrependPath=1
        del python-3.13.1-installer.exe
        call refreshenv
        echo [SUCCESS] Python 3.13 installed successfully
    ) else (
        echo [ERROR] Failed to download Python 3.13 installer
        echo [INFO] Please install manually from: https://www.python.org/downloads/windows/
        pause
        exit /b 1
    )
)

REM Visual C++ Redistributable 설치 확인 및 설치
echo [INFO] Checking Visual C++ Redistributable...
reg query "HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\VisualStudio\14.0\VC\Runtimes\x64" >nul 2>&1
if %errorlevel% equ 0 (
    echo [SUCCESS] Visual C++ Redistributable found
) else (
    echo [INFO] Installing Visual C++ Redistributable via Chocolatey...
    choco install vcredist-all -y
    if %errorlevel% equ 0 (
        echo [SUCCESS] Visual C++ Redistributable installed successfully
    ) else (
        echo [WARNING] Failed to install Visual C++ Redistributable via Chocolatey
        echo [INFO] Please install manually from: https://aka.ms/vs/17/release/vc_redist.x64.exe
    )
)

REM Visual C++ Build Tools 설치 확인 및 설치
echo [INFO] Checking Visual C++ Build Tools...
reg query "HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\VisualStudio\SxS\VS7" >nul 2>&1
if %errorlevel% equ 0 (
    echo [SUCCESS] Visual C++ Build Tools found
) else (
    echo [INFO] Installing Visual C++ Build Tools via Chocolatey...
    choco install visualstudio2022buildtools -y
    if %errorlevel% equ 0 (
        echo [SUCCESS] Visual C++ Build Tools installed successfully
    ) else (
        echo [WARNING] Failed to install Visual C++ Build Tools via Chocolatey
        echo [INFO] Please install manually from: https://visualstudio.microsoft.com/visual-cpp-build-tools/
    )
)

REM Git 설치 확인 및 설치
echo [INFO] Checking Git installation...
git --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('git --version 2^>^&1') do set "git_version=%%i"
    echo [SUCCESS] Git already installed: !git_version!
) else (
    echo [INFO] Installing Git via Chocolatey...
    choco install git -y
    if %errorlevel% equ 0 (
        echo [SUCCESS] Git installed successfully
        REM PATH 새로고침
        call refreshenv
    ) else (
        echo [WARNING] Failed to install Git via Chocolatey
        echo [INFO] Please install manually from: https://git-scm.com/download/win
    )
)

REM PostgreSQL 클라이언트 설치 확인 및 설치
echo [INFO] Checking PostgreSQL client...
psql --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('psql --version 2^>^&1') do set "psql_version=%%i"
    echo [SUCCESS] PostgreSQL client found: !psql_version!
) else (
    echo [INFO] Installing PostgreSQL client via Chocolatey...
    choco install postgresql --params '/Password:postgres' -y
    if %errorlevel% equ 0 (
        echo [SUCCESS] PostgreSQL client installed successfully
        REM PATH 새로고침
        call refreshenv
    ) else (
        echo [WARNING] Failed to install PostgreSQL client via Chocolatey
        echo [INFO] Please install manually from: https://www.postgresql.org/download/windows/
    )
)

REM 가상환경 생성 (Python 3.13으로) - 무조건 새로 생성
echo [INFO] Setting up Python 3.13 virtual environment...
if exist "venv" (
    echo [INFO] Removing existing virtual environment...
    rmdir /s /q venv
    if %errorlevel% equ 0 (
        echo [SUCCESS] Existing virtual environment removed
    ) else (
        echo [WARNING] Failed to remove existing virtual environment, continuing...
    )
)

echo [INFO] Creating new virtual environment with Python 3.13...
python -m venv venv
if %errorlevel% equ 0 (
    echo [SUCCESS] Virtual environment created with Python 3.13
) else (
    echo [ERROR] Failed to create virtual environment
    pause
    exit /b 1
)

REM 가상환경 활성화
echo [INFO] Activating virtual environment...
call venv\Scripts\activate.bat
if %errorlevel% equ 0 (
    echo [SUCCESS] Virtual environment activated
) else (
    echo [ERROR] Failed to activate virtual environment
    pause
    exit /b 1
)

REM pip 업그레이드
echo [INFO] Upgrading pip...
python -m pip install --upgrade pip
if %errorlevel% equ 0 (
    echo [SUCCESS] pip upgraded successfully
) else (
    echo [WARNING] Failed to upgrade pip
)

REM requirements 파일 설치
echo [INFO] Installing Python packages...
if exist "requirements.txt" (
    echo [INFO] Installing packages from requirements.txt...
    pip install -r requirements.txt
    if %errorlevel% equ 0 (
        echo [SUCCESS] Python packages installed successfully
    ) else (
        echo [ERROR] Failed to install some packages
        echo [INFO] You may need to install Visual C++ Build Tools
        echo [INFO] Download from: https://visualstudio.microsoft.com/visual-cpp-build-tools/
    )
) else (
    echo [WARNING] requirements.txt not found
)

REM JDK 확인
echo [INFO] Checking project JDK...
if exist "jdk\windows\openjdk-17.0.2" (
    echo [SUCCESS] Project JDK found in jdk\windows\openjdk-17.0.2
) else (
    echo [WARNING] Project JDK directory not found
    echo [INFO] Expected path: jdk\windows\openjdk-17.0.2
)

REM 환경 확인
echo.
echo [INFO] Environment verification:
echo [INFO] =========================

REM Python 확인
for /f "tokens=*" %%i in ('python --version 2^>^&1') do echo [SUCCESS] Python: %%i

REM pip 확인
for /f "tokens=*" %%i in ('pip --version 2^>^&1') do echo [SUCCESS] pip: %%i

REM 가상환경 확인
if exist "venv" (
    echo [SUCCESS] Virtual environment: Created
) else (
    echo [ERROR] Virtual environment: Not found
)

REM 프로젝트 JDK 확인
if exist "jdk\windows\openjdk-17.0.2" (
    echo [SUCCESS] Project JDK: Found
) else (
    echo [WARNING] Project JDK: Not found
)

echo.
echo [SUCCESS] Windows environment setup completed!
echo.
echo [INFO] To activate the virtual environment, run:
echo [INFO] venv\Scripts\activate.bat
echo.
echo [INFO] To start the application, run:
echo [INFO] uvicorn main:app --host 0.0.0.0 --port 8000
echo.
pause
