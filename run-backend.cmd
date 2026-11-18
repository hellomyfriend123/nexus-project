@echo off
setlocal EnableExtensions EnableDelayedExpansion

REM ============================================================================
REM  PROJECT NEXUS - Backend launcher (Windows CMD)
REM
REM  Chay duoc backend ma KHONG phai sua bat ky file nao trong backend\
REM
REM  Script nay xu ly 4 nguyen nhan lam backend "khong chay duoc" tren may nay:
REM    1) lenh "java" tren PATH la Java 8 (javapath shim) -> UnsupportedClassVersionError
REM       => ep dung JDK 21/25 qua JAVA_HOME + PATH cua rieng tien trinh nay
REM    2) cong 8080 tung bi dich vu EDB PEMHTTPD-x64 (Apache) chiem
REM       => script kiem tra cong truoc khi chay; neu bi chiem se bao ro cach xu ly
REM          (tren may nay dich vu do da duoc tat: Stop-Service PEMHTTPD-x64)
REM    3) ~/.m2 khong ghi duoc, Maven mac dinh dung C:\Users\<user>\.m2\repository
REM       => tro local repository ve <repo>\.m2repo qua MAVEN_OPTS
REM    4) backend\run.bat luu kieu LF (cmd.exe doc sai) + khong set JAVA_HOME
REM       => script nay dung CRLF, khong dung run.bat
REM
REM  Cach dung:
REM     run-backend.cmd              -> chay o cong 8080
REM     run-backend.cmd 8085         -> chay o cong 8085 (neu 8080 dang bi chiem)
REM     run-backend.cmd 8080 build   -> build lai jar truoc khi chay
REM ============================================================================

set "ROOT_DIR=%~dp0"
if "%ROOT_DIR:~-1%"=="\" set "ROOT_DIR=%ROOT_DIR:~0,-1%"
set "BACKEND_DIR=%ROOT_DIR%\backend"
set "MAVEN_REPO=%ROOT_DIR%\.m2repo"
set "APP_JAR=%BACKEND_DIR%\nexus-app\target\nexus-app-1.0.0-SNAPSHOT.jar"

set "PORT=%~1"
if "%PORT%"=="" set "PORT=8080"
set "DO_BUILD=%~2"

if not exist "%BACKEND_DIR%\pom.xml" (
    echo [LOI] Khong tim thay backend\pom.xml
    echo       Dat script nay o thu muc goc cua repo.
    goto :fail
)

REM ---------------------------------------------------------------------------
REM  1. Chon JDK 21+ (project dat maven.compiler.release=25)
REM ---------------------------------------------------------------------------
set "JDK_HOME="
call :try_jdk "%JAVA_HOME%"
if not defined JDK_HOME call :try_jdk "C:\Program Files\Java\jdk-25.0.4.1"
if not defined JDK_HOME call :try_jdk "C:\Program Files\Java\jdk-21.0.12.1"
if not defined JDK_HOME call :try_jdk "C:\Program Files\Eclipse Adoptium\jdk-21.0.5.11-hotspot"
if not defined JDK_HOME call :try_jdk "C:\Program Files\Microsoft\jdk-21.0.5.11-hotspot"
if not defined JDK_HOME (
    echo [LOI] Khong tim thay JDK 21 tro len.
    echo       Cai JDK 21/25 roi dat bien JAVA_HOME tro toi thu muc JDK do.
    goto :fail
)

set "JAVA_HOME=%JDK_HOME%"
set "PATH=%JDK_HOME%\bin;%PATH%"
echo [1/4] JDK       : %JDK_HOME%

REM ---------------------------------------------------------------------------
REM  2. Maven local repository (~/.m2 khong ghi duoc tren may nay)
REM ---------------------------------------------------------------------------
set "MAVEN_OPTS=-Dmaven.repo.local=%MAVEN_REPO%"
echo [2/4] Maven repo: %MAVEN_REPO%

REM ---------------------------------------------------------------------------
REM  3. Kiem tra cong trong
REM ---------------------------------------------------------------------------
set "PORT_BUSY="
for /f "tokens=*" %%l in ('netstat -ano -p TCP ^| findstr /R /C:":%PORT% .*LISTENING"') do set "PORT_BUSY=1"
if defined PORT_BUSY (
    echo [LOI] Cong %PORT% dang bi mot tien trinh khac chiem.
    echo       Xem tien trinh chiem cong:  netstat -ano ^| findstr :%PORT%
    echo       Doi cong:                   run-backend.cmd 8085
    goto :fail
)

REM ---------------------------------------------------------------------------
REM  4. Build (neu thieu jar hoac co tham so "build")
REM ---------------------------------------------------------------------------
if /I "%DO_BUILD%"=="build" goto :do_build
if not exist "%APP_JAR%" goto :do_build
echo [3/4] Jar       : da co san (%APP_JAR%)
goto :run

:do_build
echo [3/4] Jar       : build lai bang Maven (mvn -DskipTests clean package)
pushd "%BACKEND_DIR%"
call mvn -B -ntp -DskipTests clean package
set "BUILD_RC=%errorlevel%"
popd
if not "%BUILD_RC%"=="0" (
    echo [LOI] Build that bai [exit=%BUILD_RC%]
    goto :fail
)

:run
if not exist "%APP_JAR%" (
    echo [LOI] Khong tim thay jar: %APP_JAR%
    goto :fail
)

echo [4/4] Chay backend o cong %PORT%
echo ----------------------------------------------------------------------------
echo   Swagger UI : http://localhost:%PORT%/swagger-ui.html
echo   Health     : http://localhost:%PORT%/actuator/health
echo   OpenAPI    : http://localhost:%PORT%/v3/api-docs
echo   Nhan Ctrl+C de dung
echo ----------------------------------------------------------------------------

REM backend\.env co SERVER_PORT=8080; bien moi truong o day duoc uu tien hon
REM (xem NexusApplication.loadDotenv: chi set System property khi bien chua ton tai)
set "SERVER_PORT=%PORT%"
pushd "%BACKEND_DIR%"
"%JDK_HOME%\bin\java.exe" -jar "%APP_JAR%"
set "RUN_RC=%errorlevel%"
popd

if not "%RUN_RC%"=="0" (
    echo [LOI] Backend thoat voi ma %RUN_RC%
    goto :fail
)
endlocal
exit /b 0

REM ===========================================================================
REM  Subroutine: try_jdk <thu muc JDK> -> dat JDK_HOME neu la JDK >= 21
REM ===========================================================================
:try_jdk
if "%~1"=="" goto :eof
if not exist "%~1\bin\java.exe" goto :eof
if not exist "%~1\release" goto :eof
set "REL_VER="
REM /R voi ^JAVA_VERSION= de KHONG khop nham dong JAVA_VERSION_DATE
for /f "tokens=2 delims==" %%a in ('findstr /R /C:"^JAVA_VERSION=" "%~1\release"') do set "REL_VER=%%a"
if not defined REL_VER goto :eof
set "REL_VER=!REL_VER:"=!"
for /f "tokens=1 delims=." %%b in ("!REL_VER!") do set "REL_MAJOR=%%b"
if not defined REL_MAJOR goto :eof
if !REL_MAJOR! GEQ 21 set "JDK_HOME=%~1"
goto :eof

:fail
endlocal
exit /b 1
