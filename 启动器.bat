@echo off
chcp 65001 >nul 2>&1
title NEW_API 开发环境启动器
cd /d "%~dp0"
pythonw dev_launcher_gui.py
