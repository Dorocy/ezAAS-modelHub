#!/bin/bash

# AAS Repository Backend - 환경 설정 스크립트
# 운영체제를 자동으로 감지하여 필요한 시스템 라이브러리를 설치합니다.

set -e  # 오류 발생 시 스크립트 종료

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 로그 함수들
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 운영체제 감지
detect_os() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if command -v apt-get &> /dev/null; then
            OS="ubuntu"
        elif command -v yum &> /dev/null; then
            OS="centos"
        elif command -v dnf &> /dev/null; then
            OS="fedora"
        else
            OS="linux"
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
        OS="windows"
    else
        OS="unknown"
    fi
    
    log_info "Detected OS: $OS"
}

# Ubuntu/Debian 환경 설정
setup_ubuntu() {
    log_info "Setting up Ubuntu/Debian environment..."
    
    # 시스템 업데이트
    log_info "Updating system packages..."
    sudo apt-get update
    
    # Python 3.13 설치 확인 및 설치
    if ! command -v python3.13 &> /dev/null; then
        log_info "Installing Python 3.13..."
        sudo apt-get install -y software-properties-common
        sudo add-apt-repository -y ppa:deadsnakes/ppa
        sudo apt-get update
        
        # Python 3.13 기본 패키지 설치 (python3.13-venv가 없을 수도 있음)
        set +e
        sudo apt-get install -y python3.13 python3.13-dev
        PYTHON_INSTALL_STATUS=$?
        set -e
        
        if [ $PYTHON_INSTALL_STATUS -ne 0 ]; then
            log_error "Failed to install Python 3.13"
            log_info "Trying to use available Python 3.x version..."
            # Python 3.13 설치 실패 시 더 낮은 버전 사용 안내
            log_warning "Python 3.13 installation failed. The script will try to use available Python 3.x version."
        else
            # python3.13-venv 설치 시도 (없어도 venv 모듈은 Python에 포함되어 있을 수 있음)
            set +e
            sudo apt-get install -y python3.13-venv 2>/dev/null
            set -e
        fi
        
        # python3.13-pip 패키지가 있으면 설치, 없으면 경고만 (pip는 가상환경에서 설치 가능)
        set +e
        if sudo apt-get install -y python3.13-pip 2>/dev/null; then
            log_success "Python 3.13-pip installed"
        else
            log_warning "python3.13-pip package not available, will use ensurepip in virtual environment"
        fi
        set -e
    else
        log_success "Python 3.13 already installed"
    fi
    
    # 시스템 라이브러리 설치 (필요한 것만)
    log_info "Checking and installing required system libraries..."
    
    # 패키지 목록 정의
    packages=(
        "build-essential"
        "libssl-dev"
        "libffi-dev"
        "libxml2-dev"
        "libxslt1-dev"
        "libpq-dev"
        "postgresql-client"
        "pkg-config"
        "autoconf"
        "automake"
        "libtool"
        "zlib1g-dev"
        "libbz2-dev"
        "liblzma-dev"
        "curl"
        "libreadline-dev"
        "libncurses5-dev"
    )
    
    # 설치할 패키지 목록 생성
    packages_to_install=()
    for package in "${packages[@]}"; do
        if ! dpkg -l | grep -q "^ii  $package "; then
            packages_to_install+=("$package")
        else
            log_success "$package already installed"
        fi
    done
    
    # 필요한 패키지만 설치
    if [ ${#packages_to_install[@]} -gt 0 ]; then
        log_info "Installing missing packages: ${packages_to_install[*]}"
        sudo apt-get install -y "${packages_to_install[@]}"
    else
        log_success "All required packages already installed"
    fi
    
    # JDK 확인 (프로젝트에 포함되어 있음)
    log_info "JDK is managed within the project (jdk/linux/openjdk-17.0.2) - no system installation needed"
    
    log_success "Ubuntu/Debian environment setup completed!"
}

# CentOS/RHEL 환경 설정
setup_centos() {
    log_info "Setting up CentOS/RHEL environment..."
    
    # EPEL 저장소 활성화
    if ! rpm -q epel-release &> /dev/null; then
        log_info "Installing EPEL repository..."
        sudo yum install -y epel-release
    else
        log_success "EPEL repository already installed"
    fi
    
    # Development Tools 설치 확인
    if ! yum grouplist installed | grep -q "Development Tools"; then
        log_info "Installing Development Tools..."
        sudo yum groupinstall -y "Development Tools"
    else
        log_success "Development Tools already installed"
    fi
    
    # Python 3 설치 확인 및 설치
    if ! command -v python3 &> /dev/null; then
        log_info "Installing Python 3..."
        sudo yum install -y python3 python3-pip python3-devel
    else
        log_success "Python 3 already installed"
    fi
    
    # 시스템 라이브러리 설치 (필요한 것만)
    log_info "Checking and installing required system libraries..."
    
    # 패키지 목록 정의
    packages=(
        "openssl-devel"
        "libffi-devel"
        "libxml2-devel"
        "libxslt-devel"
        "postgresql-devel"
        "postgresql"
        "pkgconfig"
        "autoconf"
        "automake"
        "libtool"
        "zlib-devel"
        "bzip2-devel"
        "xz-devel"
        "curl"
        "readline-devel"
        "ncurses-devel"
    )
    
    # 설치할 패키지 목록 생성
    packages_to_install=()
    for package in "${packages[@]}"; do
        if ! rpm -q "$package" &> /dev/null; then
            packages_to_install+=("$package")
        else
            log_success "$package already installed"
        fi
    done
    
    # 필요한 패키지만 설치
    if [ ${#packages_to_install[@]} -gt 0 ]; then
        log_info "Installing missing packages: ${packages_to_install[*]}"
        sudo yum install -y "${packages_to_install[@]}"
    else
        log_success "All required packages already installed"
    fi
    
    # JDK 확인 (프로젝트에 포함되어 있음)
    log_info "JDK is managed within the project (jdk/linux/openjdk-17.0.2) - no system installation needed"
    
    log_success "CentOS/RHEL environment setup completed!"
}

# Fedora 환경 설정
setup_fedora() {
    log_info "Setting up Fedora environment..."
    
    # Python 3.13 설치 확인 및 설치
    if ! command -v python3.13 &> /dev/null; then
        log_info "Installing Python 3.13..."
        sudo dnf install -y python3.13 python3.13-pip python3.13-devel
    else
        log_success "Python 3.13 already installed"
    fi
    
    # 시스템 라이브러리 설치 (필요한 것만)
    log_info "Checking and installing required system libraries..."
    
    # 패키지 목록 정의
    packages=(
        "gcc"
        "gcc-c++"
        "make"
        "openssl-devel"
        "libffi-devel"
        "libxml2-devel"
        "libxslt-devel"
        "postgresql-devel"
        "postgresql"
        "pkgconfig"
        "autoconf"
        "automake"
        "libtool"
        "zlib-devel"
        "bzip2-devel"
        "xz-devel"
        "curl"
        "readline-devel"
        "ncurses-devel"
    )
    
    # 설치할 패키지 목록 생성
    packages_to_install=()
    for package in "${packages[@]}"; do
        if ! rpm -q "$package" &> /dev/null; then
            packages_to_install+=("$package")
        else
            log_success "$package already installed"
        fi
    done
    
    # 필요한 패키지만 설치
    if [ ${#packages_to_install[@]} -gt 0 ]; then
        log_info "Installing missing packages: ${packages_to_install[*]}"
        sudo dnf install -y "${packages_to_install[@]}"
    else
        log_success "All required packages already installed"
    fi
    
    # JDK 확인 (프로젝트에 포함되어 있음)
    log_info "JDK is managed within the project (jdk/linux/openjdk-17.0.2) - no system installation needed"
    
    log_success "Fedora environment setup completed!"
}

# macOS 환경 설정
setup_macos() {
    log_info "Setting up macOS environment..."
    
    # Xcode Command Line Tools 설치 확인
    if ! xcode-select -p &> /dev/null; then
        log_info "Installing Xcode Command Line Tools..."
        xcode-select --install
        log_warning "Please complete Xcode Command Line Tools installation and run this script again."
        exit 1
    else
        log_success "Xcode Command Line Tools already installed"
    fi
    
    # Homebrew 설치 확인
    if ! command -v brew &> /dev/null; then
        log_info "Installing Homebrew..."
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        
        # M1/M2 Mac의 경우 PATH 설정
        if [[ $(uname -m) == "arm64" ]]; then
            echo 'export PATH="/opt/homebrew/bin:$PATH"' >> ~/.zshrc
            export PATH="/opt/homebrew/bin:$PATH"
        fi
    else
        log_success "Homebrew already installed"
    fi
    
    # Python 3.13 설치 확인 및 설치
    if ! command -v python3.13 &> /dev/null; then
        log_info "Installing Python 3.13..."
        brew install python@3.13
    else
        log_success "Python 3.13 already installed"
    fi
    
    # 시스템 라이브러리 설치 (필요한 것만)
    log_info "Checking and installing required system libraries..."
    
    # 패키지 목록 정의
    packages=(
        "openssl"
        "libffi"
        "libxml2"
        "libxslt"
        "postgresql"
        "sqlite"
        "pkg-config"
        "autoconf"
        "automake"
        "libtool"
        "zlib"
        "bzip2"
        "xz"
        "curl"
        "readline"
        "ncurses"
    )
    
    # 설치할 패키지 목록 생성
    packages_to_install=()
    for package in "${packages[@]}"; do
        if ! brew list "$package" &> /dev/null; then
            packages_to_install+=("$package")
        else
            log_success "$package already installed"
        fi
    done
    
    # 필요한 패키지만 설치
    if [ ${#packages_to_install[@]} -gt 0 ]; then
        log_info "Installing missing packages: ${packages_to_install[*]}"
        brew install "${packages_to_install[@]}"
    else
        log_success "All required packages already installed"
    fi
    
    # JDK 확인 (프로젝트에 포함되어 있음)
    log_info "JDK is managed within the project (jdk/mac/openjdk-17.0.2) - no system installation needed"
    
    log_success "macOS environment setup completed!"
}

# Windows 환경 설정 (bat 파일 안내)
setup_windows() {
    log_error "Windows native environment detected."
    log_warning "This script is designed for Unix-like systems (Linux/macOS)."
    log_info ""
    log_info "For Windows, please use the dedicated batch file:"
    log_info "setup_environment.bat"
    log_info ""
    log_info "To run the Windows setup:"
    log_info "1. Double-click setup_environment.bat"
    log_info "2. Or run from command prompt: setup_environment.bat"
    log_info ""
    log_info "The Windows batch file will:"
    log_info "- Check and install required system libraries"
    log_info "- Set up Python virtual environment"
    log_info "- Install Python packages from requirements.txt"
    log_info "- Verify the environment setup"
    log_info ""
    
    exit 1
}

# WSL 환경에서 Windows 호스트 시스템 라이브러리 확인
setup_wsl_windows_dependencies() {
    log_info "Checking Windows host system dependencies for WSL..."
    
    # WSL에서 Windows 호스트 시스템 확인
    if [[ -f /proc/version ]] && grep -q Microsoft /proc/version; then
        log_info "WSL environment detected. Checking Windows host dependencies..."
        
        # Windows 호스트에서 필요한 라이브러리들 확인
        log_warning "The following Windows host system libraries may be required:"
        log_info ""
        log_info "1. Visual C++ Redistributable (필수)"
        log_info "   - https://aka.ms/vs/17/release/vc_redist.x64.exe"
        log_info "   - Python 패키지들의 Windows 호환성에 필요"
        log_info ""
        log_info "2. Visual C++ Build Tools (선택사항, 개발용)"
        log_info "   - https://visualstudio.microsoft.com/visual-cpp-build-tools/"
        log_info "   - 일부 Python 패키지 컴파일에 필요할 수 있음"
        log_info ""
        log_info "3. Windows SDK (선택사항)"
        log_info "   - https://developer.microsoft.com/en-us/windows/downloads/windows-sdk/"
        log_info ""
        log_info "Note: WSL 내부에서는 Linux 패키지 매니저로 라이브러리를 설치하지만,"
        log_info "일부 Python 패키지들이 Windows 호스트 시스템의 라이브러리를 참조할 수 있습니다."
        log_info ""
        
        # Windows 호스트 시스템 라이브러리 확인 시도
        if command -v powershell.exe &> /dev/null; then
            log_info "Checking Windows host system libraries..."
            
            # PowerShell을 통해 Windows 시스템 확인
            if powershell.exe -Command "Get-WmiObject -Class Win32_Product | Where-Object { \$_.Name -like '*Visual C++*' } | Select-Object -First 1" &> /dev/null; then
                log_success "Visual C++ Redistributable found on Windows host"
            else
                log_warning "Visual C++ Redistributable not found on Windows host"
                log_info "Please install from: https://aka.ms/vs/17/release/vc_redist.x64.exe"
            fi
        else
            log_info "Cannot check Windows host system (powershell.exe not available)"
        fi
    else
        log_info "Not running in WSL environment"
    fi
}

# Python 버전 자동 감지
detect_python_version() {
    local versions=("3.13" "3.12" "3.11" "3.10" "3.9")
    local python_cmd=""
    
    for version in "${versions[@]}"; do
        if command -v "python${version}" &> /dev/null; then
            python_cmd="python${version}"
            # 로그는 stderr로 출력하여 echo 출력과 분리
            log_success "Found Python ${version}: $(command -v ${python_cmd})" >&2
            echo "$python_cmd"
            return 0
        fi
    done
    
    # python3 명령어 확인
    if command -v python3 &> /dev/null; then
        python_cmd="python3"
        # 로그는 stderr로 출력하여 echo 출력과 분리
        log_info "Using python3: $(python3 --version 2>&1)" >&2
        echo "$python_cmd"
        return 0
    fi
    
    log_error "No suitable Python version found (3.9+ required)" >&2
    return 1
}

# uv 설치 확인 및 설치
check_and_install_uv() {
    log_info "Checking for uv package manager..."
    
    # PATH 업데이트 (일반적인 uv 설치 위치들 추가)
    export PATH="$HOME/.cargo/bin:$HOME/.local/bin:/usr/local/bin:/opt/homebrew/bin:$PATH"
    
    # 쉘 프로파일에서 PATH 로드 시도
    if [ -f "$HOME/.bashrc" ]; then
        source "$HOME/.bashrc" 2>/dev/null || true
    fi
    if [ -f "$HOME/.zshrc" ]; then
        source "$HOME/.zshrc" 2>/dev/null || true
    fi
    if [ -f "$HOME/.profile" ]; then
        source "$HOME/.profile" 2>/dev/null || true
    fi
    
    # 여러 방법으로 uv 찾기
    UV_CMD=""
    UV_PATH=""
    
    # 1. command -v로 PATH에서 찾기
    if command -v uv &> /dev/null; then
        UV_PATH=$(command -v uv)
        UV_CMD="uv"
        log_success "Found uv in PATH: $UV_PATH"
    # 2. 일반적인 설치 위치에서 직접 찾기
    elif [ -f "$HOME/.cargo/bin/uv" ]; then
        UV_PATH="$HOME/.cargo/bin/uv"
        export PATH="$HOME/.cargo/bin:$PATH"
        UV_CMD="uv"
        log_success "Found uv: $UV_PATH"
    elif [ -f "$HOME/.local/bin/uv" ]; then
        UV_PATH="$HOME/.local/bin/uv"
        export PATH="$HOME/.local/bin:$PATH"
        UV_CMD="uv"
        log_success "Found uv: $UV_PATH"
    elif [ -f "/usr/local/bin/uv" ]; then
        UV_PATH="/usr/local/bin/uv"
        export PATH="/usr/local/bin:$PATH"
        UV_CMD="uv"
        log_success "Found uv: $UV_PATH"
    elif [ -f "/opt/homebrew/bin/uv" ]; then
        UV_PATH="/opt/homebrew/bin/uv"
        export PATH="/opt/homebrew/bin:$PATH"
        UV_CMD="uv"
        log_success "Found uv: $UV_PATH"
    # 3. find 명령어로 시스템 전체 검색 (느릴 수 있음)
    else
        log_info "Searching for uv in common locations..."
        UV_PATH=$(find "$HOME" -name "uv" -type f -executable 2>/dev/null | grep -E "(cargo|local|\.uv)" | head -1)
        if [ -n "$UV_PATH" ]; then
            UV_DIR=$(dirname "$UV_PATH")
            export PATH="$UV_DIR:$PATH"
            UV_CMD="uv"
            log_success "Found uv: $UV_PATH"
        fi
    fi
    
    # uv를 찾았는지 확인하고 실행 가능한지 테스트
    if [ -n "$UV_CMD" ] && [ -n "$UV_PATH" ]; then
        # uv 실행 테스트
        if "$UV_PATH" --version &>/dev/null; then
            log_success "uv is working: $UV_PATH"
            echo "$UV_CMD"
            return 0
        else
            log_warning "Found uv at $UV_PATH but it's not executable, will reinstall..."
            UV_CMD=""
            UV_PATH=""
        fi
    fi
    
    # uv가 없으면 설치
    if [ -z "$UV_CMD" ] || ! command -v uv &> /dev/null; then
        log_info "uv not found. Installing uv..."
        
        # curl 확인
        if ! command -v curl &> /dev/null; then
            log_error "curl is required to install uv. Please install curl first."
            log_info "On Ubuntu/Debian: sudo apt-get install -y curl"
            return 1
        fi
        
        # set -e를 일시적으로 비활성화하여 설치 실패 시에도 계속 진행
        set +e
        
        # 임시 파일로 설치 스크립트 다운로드 (오류 확인용)
        INSTALL_SCRIPT=$(mktemp)
        log_info "Downloading uv installation script..."
        
        if curl -LsSf https://astral.sh/uv/install.sh -o "$INSTALL_SCRIPT" 2>&1; then
            log_info "Installation script downloaded successfully"
            chmod +x "$INSTALL_SCRIPT"
            
            # 설치 스크립트 실행
            log_info "Running uv installation script..."
            if bash "$INSTALL_SCRIPT"; then
                INSTALL_SUCCESS=true
                log_info "Installation script executed successfully"
            else
                INSTALL_SUCCESS=false
                log_error "Installation script execution failed"
            fi
            
            # 임시 파일 삭제
            rm -f "$INSTALL_SCRIPT"
        else
            INSTALL_SUCCESS=false
            log_error "Failed to download uv installation script"
            log_error "Please check your internet connection"
            rm -f "$INSTALL_SCRIPT"
        fi
        
        set -e
        
        if [ "$INSTALL_SUCCESS" = true ]; then
            # 설치 후 잠시 대기 (파일 시스템 동기화)
            sleep 1
            
            # PATH에 추가할 수 있는 위치들 확인
            POSSIBLE_PATHS=(
                "$HOME/.cargo/bin/uv"
                "$HOME/.local/bin/uv"
                "/usr/local/bin/uv"
                "/opt/homebrew/bin/uv"
            )
            
            # PATH 업데이트 (설치 스크립트가 PATH에 추가했을 수 있음)
            export PATH="$HOME/.cargo/bin:$HOME/.local/bin:/usr/local/bin:/opt/homebrew/bin:$PATH"
            
            # 쉘 프로파일 다시 로드
            if [ -f "$HOME/.bashrc" ]; then
                source "$HOME/.bashrc" 2>/dev/null || true
            fi
            if [ -f "$HOME/.zshrc" ]; then
                source "$HOME/.zshrc" 2>/dev/null || true
            fi
            if [ -f "$HOME/.profile" ]; then
                source "$HOME/.profile" 2>/dev/null || true
            fi
            
            UV_FOUND=false
            # 1. PATH에서 먼저 확인
            if command -v uv &> /dev/null; then
                UV_PATH=$(command -v uv)
                UV_CMD="uv"
                log_success "Found uv in PATH: $UV_PATH"
                UV_FOUND=true
            # 2. 일반적인 설치 위치에서 확인
            else
                for UV_PATH in "${POSSIBLE_PATHS[@]}"; do
                    if [ -f "$UV_PATH" ] && [ -x "$UV_PATH" ]; then
                        UV_DIR=$(dirname "$UV_PATH")
                        export PATH="$UV_DIR:$PATH"
                        UV_CMD="uv"
                        log_success "uv installed successfully to $UV_DIR"
                        UV_FOUND=true
                        break
                    fi
                done
            fi
            
            # 3. 여전히 못 찾으면 find로 검색
            if [ "$UV_FOUND" = false ]; then
                log_info "Searching for uv using find command..."
                FOUND_UV=$(find "$HOME" -maxdepth 4 -name "uv" -type f -executable 2>/dev/null | grep -E "(cargo|local|\.uv|bin)" | head -1)
                if [ -n "$FOUND_UV" ]; then
                    UV_DIR=$(dirname "$FOUND_UV")
                    export PATH="$UV_DIR:$PATH"
                    UV_CMD="uv"
                    log_success "Found uv: $FOUND_UV"
                    UV_FOUND=true
                fi
            fi
            
            # 최종 확인
            if [ "$UV_FOUND" = false ] || ! command -v uv &> /dev/null; then
                log_warning "uv installation completed but binary not found"
                log_info "Searched in: ${POSSIBLE_PATHS[*]}"
                log_info "Current PATH: $PATH"
                log_info "Please add uv to your PATH manually or restart your shell"
                return 1
            fi
        else
            log_warning "Primary uv installation method failed, trying alternative method..."
            
            # 대체 방법: pip를 통한 설치 시도
            if command -v pip3 &> /dev/null || command -v pip &> /dev/null; then
                log_info "Trying to install uv via pip..."
                set +e
                if command -v pip3 &> /dev/null; then
                    pip3 install uv 2>&1 | grep -v "WARNING:" || true
                else
                    pip install uv 2>&1 | grep -v "WARNING:" || true
                fi
                PIP_INSTALL_STATUS=$?
                set -e
                
                if [ $PIP_INSTALL_STATUS -eq 0 ] && command -v uv &> /dev/null; then
                    UV_CMD="uv"
                    log_success "uv installed successfully via pip"
                else
                    log_error "Failed to install uv via pip as well"
                    log_info "Please install uv manually:"
                    log_info "  curl -LsSf https://astral.sh/uv/install.sh | sh"
                    log_info "  Or: pip install uv"
                    return 1
                fi
            else
                log_error "Failed to install uv and pip is not available"
                log_info "Please install uv manually:"
                log_info "  curl -LsSf https://astral.sh/uv/install.sh | sh"
                return 1
            fi
        fi
    fi
    
    # uv 버전 확인 및 최종 검증
    if [ -n "$UV_CMD" ]; then
        # PATH에 uv가 있는지 다시 확인
        if ! command -v uv &> /dev/null; then
            # UV_PATH가 있으면 직접 사용
            if [ -n "$UV_PATH" ] && [ -x "$UV_PATH" ]; then
                export PATH="$(dirname "$UV_PATH"):$PATH"
            else
                log_error "uv command not available after installation"
                log_info "Current PATH: $PATH"
                return 1
            fi
        fi
        
        # uv 실행 테스트
        if uv --version &>/dev/null; then
            UV_VERSION=$(uv --version 2>&1 || echo "unknown")
            log_success "uv is working! Version: $UV_VERSION"
            echo "$UV_CMD"
            return 0
        else
            log_error "uv found but not executable or broken"
            return 1
        fi
    else
        log_error "uv command not available"
        return 1
    fi
}

# Python 가상환경 설정 (uv 필수 사용)
setup_python_venv() {
    log_info "Setting up Python virtual environment with uv..."
    
    # uv 설치 확인 및 설치 (필수)
    log_info "Installing/checking uv package manager (required)..."
    set +e
    UV_CMD=$(check_and_install_uv)
    UV_INSTALLED=$?
    set -e
    
    if [ $UV_INSTALLED -ne 0 ] || [ -z "$UV_CMD" ] || ! command -v uv &> /dev/null; then
        log_error "uv is required but installation failed."
        log_error "Please install uv manually: curl -LsSf https://astral.sh/uv/install.sh | sh"
        log_error "Or check your internet connection and try again."
        exit 1
    fi
    
    log_info "Using uv for virtual environment setup..."
    
    # 가상환경 생성 (이미 존재하는지 확인)
    if [[ -d "venv" ]]; then
        log_success "Virtual environment already exists"
    else
        log_info "Creating virtual environment with uv..."
        uv venv venv
        if [ $? -ne 0 ]; then
            log_error "Failed to create virtual environment with uv"
            exit 1
        fi
        log_success "Virtual environment created with uv"
    fi
    
    # 가상환경 활성화
    source venv/bin/activate
    
    # requirements 파일 설치 (uv pip 사용)
    if [[ "$OS" == "macos" ]] && [[ -f "requirements_mac.txt" ]]; then
        log_info "Installing Python packages from requirements_mac.txt using uv..."
        uv pip install -r requirements_mac.txt
    elif [[ -f "requirements.txt" ]]; then
        log_info "Installing Python packages from requirements.txt using uv..."
        uv pip install -r requirements.txt
    else
        log_warning "No requirements file found. Please install packages manually."
    fi
    
    log_success "Python virtual environment setup completed with uv!"
}

# 환경 확인
verify_environment() {
    log_info "Verifying environment setup..."
    
    # uv 확인
    if command -v uv &> /dev/null; then
        log_success "uv: $(uv --version 2>&1)"
    elif [ -f "$HOME/.cargo/bin/uv" ] || [ -f "$HOME/.local/bin/uv" ]; then
        log_success "uv: installed (in ~/.cargo/bin or ~/.local/bin)"
    else
        log_warning "uv not found"
    fi
    
    # Python 확인 (여러 버전 확인)
    PYTHON_FOUND=false
    for version in "3.13" "3.12" "3.11" "3.10" "3.9"; do
        if command -v "python${version}" &> /dev/null; then
            log_success "Python ${version}: $(python${version} --version 2>&1)"
            PYTHON_FOUND=true
            break
        fi
    done
    
    if [ "$PYTHON_FOUND" = false ]; then
        if command -v python3 &> /dev/null; then
            log_success "Python 3: $(python3 --version 2>&1)"
        else
            log_error "Python 3 not found"
        fi
    fi
    
    # JDK 확인 (프로젝트 내 JDK)
    if [[ -d "jdk" ]]; then
        log_success "Project JDK found in jdk/ directory"
    else
        log_warning "Project JDK directory not found"
    fi
    
    # PostgreSQL 확인
    if command -v psql &> /dev/null; then
        log_success "PostgreSQL: $(psql --version)"
    else
        log_warning "PostgreSQL not found"
    fi
    
    # 가상환경 확인
    if [[ -d "venv" ]]; then
        log_success "Virtual environment created successfully"
    else
        log_error "Virtual environment not created"
    fi
}

# 메인 실행 함수
main() {
    log_info "AAS Repository Backend - Environment Setup Script"
    log_info "=================================================="
    
    # 운영체제 감지
    detect_os
    
    # 운영체제별 환경 설정
    case $OS in
        "ubuntu")
            setup_ubuntu
            ;;
        "centos")
            setup_centos
            ;;
        "fedora")
            setup_fedora
            ;;
        "macos")
            setup_macos
            ;;
        "windows")
            setup_windows
            ;;
        *)
            log_error "Unsupported operating system: $OS"
            exit 1
            ;;
    esac
    
    # WSL 환경에서 Windows 호스트 시스템 라이브러리 확인
    setup_wsl_windows_dependencies
    
    # Python 가상환경 설정
    setup_python_venv
    
    # 환경 확인
    verify_environment
    
    log_success "Environment setup completed successfully!"
    log_info "To activate the virtual environment, run: source venv/bin/activate"
    log_info "To start the application, run: uvicorn main:app --host 0.0.0.0 --port 8000"
}

# 스크립트 실행
main "$@"
