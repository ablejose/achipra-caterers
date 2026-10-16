@echo off
title Achipra Caters
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed. Install the LTS version from https://nodejs.org and run this again.
  pause
  exit /b 1
)
start "" http://localhost:8080
node --no-warnings server.mjs
pause
