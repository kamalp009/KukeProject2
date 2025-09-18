@echo off
REM ZAP Windows Automation Script
REM This batch script provides multiple ways to run ZAP automation scans on Windows

setlocal enabledelayedexpansion

REM Configuration - Adjust these paths according to your ZAP installation
set "ZAP_HOME=C:\Program Files\OWASP\Zed Attack Proxy"
set "ZAP_BAT=%ZAP_HOME%\zap.bat"
set "CONFIG_FILE=zap-automation-windows.yaml"
set "REPORTS_DIR=reports"
set "TARGET_URL=https://your-website.com"

REM Colors for output (Windows 10+)
set "RED=[91m"
set "GREEN=[92m"
set "YELLOW=[93m"
set "BLUE=[94m"
set "NC=[0m"

REM Function to print colored output
:print_status
echo %BLUE%[INFO]%NC% %~1
goto :eof

:print_success  
echo %GREEN%[SUCCESS]%NC% %~1
goto :eof

:print_warning
echo %YELLOW%[WARNING]%NC% %~1
goto :eof

:print_error
echo %RED%[ERROR]%NC% %~1
goto :eof

REM Main script starts here
if "%1"=="" (
    call :print_error "No command specified"
    call :show_usage
    exit /b 1
)

if "%1"=="help" (
    call :show_usage
    exit /b 0
)

if "%1"=="check" (
    call :check_zap_installation
    exit /b 0
)

if "%1"=="scan" (
    call :run_zap_scan %2 %3 %4 %5 %6
    exit /b 0
)

if "%1"=="templates" (
    call :generate_templates
    exit /b 0
)

if "%1"=="validate" (
    call :validate_config %2
    exit /b 0
)

call :print_error "Unknown command: %1"
call :show_usage
exit /b 1

REM Function to check ZAP installation
:check_zap_installation
call :print_status "Checking ZAP installation..."

if exist "%ZAP_BAT%" (
    call :print_success "ZAP found at: %ZAP_BAT%"
    
    REM Test if ZAP can run
    call :print_status "Testing ZAP execution..."
    "%ZAP_BAT%" -version >nul 2>&1
    if !errorlevel! equ 0 (
        call :print_success "ZAP is working correctly"
    ) else (
        call :print_warning "ZAP found but may have issues running"
    )
) else (
    call :print_error "ZAP not found at: %ZAP_BAT%"
    call :print_status "Please check your ZAP installation or update ZAP_HOME path"
    call :print_status "Default installation paths:"
    echo   - C:\Program Files\OWASP\Zed Attack Proxy\zap.bat
    echo   - C:\Program Files (x86)\ZAP\Zed Attack Proxy\zap.bat
    echo   - C:\ZAP_2.x.x\zap.bat
)
goto :eof

REM Function to create reports directory
:create_reports_dir
if not exist "%REPORTS_DIR%" (
    mkdir "%REPORTS_DIR%"
    call :print_status "Created reports directory: %REPORTS_DIR%"
)
goto :eof

REM Function to update target URL in config file
:update_target_url
set "new_url=%~1"
if "%new_url%"=="" (
    call :print_warning "No target URL provided. Using default from config file."
    goto :eof
)

if exist "%CONFIG_FILE%" (
    call :print_status "Updating target URL to: %new_url%"
    
    REM Create backup
    copy "%CONFIG_FILE%" "%CONFIG_FILE%.bak" >nul
    
    REM Replace URL using PowerShell (more reliable than findstr/replace)
    powershell -Command "(Get-Content '%CONFIG_FILE%') -replace 'https://your-website.com', '%new_url%' | Set-Content '%CONFIG_FILE%'"
    
    if !errorlevel! equ 0 (
        call :print_status "Target URL updated successfully"
    ) else (
        call :print_error "Failed to update target URL"
        REM Restore backup
        move "%CONFIG_FILE%.bak" "%CONFIG_FILE%" >nul
    )
) else (
    call :print_error "Configuration file %CONFIG_FILE% not found!"
    exit /b 1
)
goto :eof

REM Function to run ZAP automation scan
:run_zap_scan
set "url=%~1"
set "config=%CONFIG_FILE%"
set "daemon_mode="

REM Parse parameters
:parse_params
if "%~1"=="" goto :end_parse
if "%~1"=="-u" (
    set "url=%~2"
    shift
    shift
    goto :parse_params
)
if "%~1"=="--url" (
    set "url=%~2"
    shift
    shift
    goto :parse_params
)
if "%~1"=="-c" (
    set "config=%~2"
    shift
    shift
    goto :parse_params
)
if "%~1"=="--config" (
    set "config=%~2"
    shift
    shift
    goto :parse_params
)
if "%~1"=="-d" (
    set "daemon_mode=-daemon"
    shift
    goto :parse_params
)
if "%~1"=="--daemon" (
    set "daemon_mode=-daemon"
    shift
    goto :parse_params
)
shift
goto :parse_params

:end_parse

call :print_status "Starting ZAP automation scan..."
call :print_status "Configuration file: %config%"
call :print_status "Target URL: %url%"

REM Check ZAP installation
call :check_zap_installation
if !errorlevel! neq 0 goto :eof

REM Create reports directory
call :create_reports_dir

REM Validate configuration
call :validate_config "%config%"

REM Update target URL if provided
if not "%url%"=="" (
    call :update_target_url "%url%"
)

REM Build and execute ZAP command
set "zap_cmd=%ZAP_BAT% -cmd %daemon_mode% -autorun %config%"
call :print_status "Executing: %zap_cmd%"

REM Execute the scan
%zap_cmd%

if !errorlevel! equ 0 (
    call :print_success "ZAP scan completed successfully!"
    call :list_generated_reports
) else (
    call :print_error "ZAP scan failed with exit code: !errorlevel!"
    exit /b 1
)
goto :eof

REM Function to generate ZAP configuration templates
:generate_templates
call :print_status "Generating ZAP configuration templates..."

if not exist "%ZAP_BAT%" (
    call :print_error "ZAP not found. Cannot generate templates."
    goto :eof
)

call :print_status "Generating minimal template..."
"%ZAP_BAT%" -cmd -autogenmin "zap-template-minimal.yaml"

call :print_status "Generating complete template..."
"%ZAP_BAT%" -cmd -autogenmax "zap-template-complete.yaml"

if exist "zap-template-minimal.yaml" (
    call :print_success "Generated templates:"
    call :print_status "  - zap-template-minimal.yaml (required options only)"
)
if exist "zap-template-complete.yaml" (
    call :print_status "  - zap-template-complete.yaml (all available options)"
)
goto :eof

REM Function to list generated reports
:list_generated_reports
call :print_status "Generated reports:"
if exist "%REPORTS_DIR%" (
    for %%f in ("%REPORTS_DIR%\*.html" "%REPORTS_DIR%\*.xml" "%REPORTS_DIR%\*.json") do (
        if exist "%%f" (
            call :print_status "  - %%f"
        )
    )
) else (
    call :print_warning "Reports directory not found"
)
goto :eof

REM Function to validate configuration file
:validate_config
set "config_file=%~1"

if "%config_file%"=="" (
    set "config_file=%CONFIG_FILE%"
)

if not exist "%config_file%" (
    call :print_error "Configuration file %config_file% not found!"
    exit /b 1
)

call :print_status "Validating configuration file: %config_file%"

REM Basic validation - check if file contains required sections
findstr /c:"env:" "%config_file%" >nul
if !errorlevel! neq 0 (
    call :print_error "Configuration file missing 'env:' section"
    exit /b 1
)

findstr /c:"jobs:" "%config_file%" >nul
if !errorlevel! neq 0 (
    call :print_error "Configuration file missing 'jobs:' section"
    exit /b 1
)

call :print_success "Configuration file appears valid"
goto :eof

REM Function to show usage
:show_usage
echo.
echo ZAP Windows Automation Script
echo.
echo Usage: %~nx0 [COMMAND] [OPTIONS]
echo.
echo Commands:
echo   scan              Run ZAP automation scan
echo   check             Check ZAP installation
echo   templates         Generate configuration templates
echo   validate          Validate configuration file
echo   help              Show this help message
echo.
echo Options for 'scan' command:
echo   -u, --url URL     Target URL to scan
echo   -c, --config FILE Configuration file (default: %CONFIG_FILE%)
echo   -d, --daemon      Run in daemon mode
echo.
echo Examples:
echo   %~nx0 check
echo   %~nx0 scan -u https://example.com
echo   %~nx0 scan -u https://example.com -d
echo   %~nx0 templates
echo   %~nx0 validate zap-automation-windows.yaml
echo.
echo Configuration:
echo   Edit ZAP_HOME variable in this script to match your ZAP installation path
echo   Current ZAP_HOME: %ZAP_HOME%
echo.
goto :eof

REM End of scripta
