@echo off
chcp 65001 >nul
title DiskVerdict
cd /d "%~dp0"
where node >nul 2>&1
if errorlevel 1 (
  echo Node.js bulunamadi. https://nodejs.org adresinden kurun.
  pause
  exit /b 1
)
node server.js
if errorlevel 1 pause
