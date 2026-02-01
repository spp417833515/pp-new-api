@echo off
chcp 65001 >nul 2>&1
title NEW_API 开发环境管理器
cd /d "%~dp0"
python dev_manager.py
pause
