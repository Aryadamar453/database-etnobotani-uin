@echo off
cd /d "%~dp0"
python impor_foto.py
if errorlevel 1 pause
