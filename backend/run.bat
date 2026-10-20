@echo off
setlocal
rem =====================================================================
rem  Chay backend o che do dev (Spring Boot) + Swagger UI.
rem  - Tim .m2repo o backend/ hoac thu muc cha (may build hien tai);
rem    neu khong co thi dung ~/.m2 mac dinh cua Maven.
rem  - -am: Maven tu build cac module phu thuoc (nexus-common, ...).
rem =====================================================================
if exist "%~dp0.m2repo" set "MAVEN_OPTS=-Dmaven.repo.local=%~dp0.m2repo"
if exist "%~dp0..\.m2repo" set "MAVEN_OPTS=-Dmaven.repo.local=%~dp0..\.m2repo"
if exist "%~dp0..\..\.m2repo" set "MAVEN_OPTS=-Dmaven.repo.local=%~dp0..\..\.m2repo"
cd /d "%~dp0"
echo =====================================================================
echo  PROJECT NEXUS BACKEND - Spring Boot 4 + Swagger UI
echo =====================================================================
echo  Swagger UI: http://localhost:8080/swagger-ui.html
echo  Dang chay backend... (nhan Ctrl+C de dung)
echo =====================================================================
mvn -f pom.xml -pl nexus-app -am spring-boot:run
pause
