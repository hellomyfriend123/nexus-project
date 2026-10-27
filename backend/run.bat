@echo off
setlocal
set "MAVEN_OPTS=-Dmaven.repo.local=%~dp0..\.m2repo"
cd /d "%~dp0"
echo =====================================================================
echo  PROJECT NEXUS BACKEND — Spring Boot 4 + Swagger UI
echo =====================================================================
echo  Swagger UI se mo tai: http://localhost:8080/swagger-ui.html
echo  Dang chay backend... (nhan Ctrl+C de dung)
echo =====================================================================
mvn -f pom.xml spring-boot:run -pl nexus-app
pause
