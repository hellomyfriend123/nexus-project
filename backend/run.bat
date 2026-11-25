@echo off
setlocal
if exist "C:\Program Files\Java\jdk-25.0.5.0.2" (
    set "JAVA_HOME=C:\Program Files\Java\jdk-25.0.5.0.2"
    set "PATH=C:\Program Files\Java\jdk-25.0.5.0.2\bin;%PATH%"
)
if exist "C:\Program Files\Java\apache-maven-3.9.14\bin" (
    set "PATH=C:\Program Files\Java\apache-maven-3.9.14\bin;%PATH%"
)
if exist "%~dp0.m2repo" (
    set "MAVEN_OPTS=-Dmaven.repo.local="%~dp0.m2repo""
) else if exist "%~dp0..\.m2repo" (
    set "MAVEN_OPTS=-Dmaven.repo.local="%~dp0..\.m2repo""
)
cd /d "%~dp0"
echo =====================================================================
echo  PROJECT NEXUS BACKEND - Spring Boot 4 + Swagger UI
echo =====================================================================
echo  Swagger UI se mo tai: http://localhost:8080/swagger-ui.html
echo  Dang chay backend... (nhan Ctrl+C de dung)
echo =====================================================================
call mvn -f pom.xml -DskipTests install -pl "!:nexus-app"
call mvn -f nexus-app\pom.xml spring-boot:run
pause
