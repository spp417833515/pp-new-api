@echo off
chcp 65001 >nul
title NEW-API 开发环境启动器

echo ========================================
echo    NEW-API 开发环境启动器
echo ========================================
echo.

:: 设置路径
set PROJECT_DIR=%~dp0
set GO_PATH=D:\Apps\Go\bin\go.exe
set WEB_DIR=%PROJECT_DIR%web

:: 检查 Go 是否存在
if not exist "%GO_PATH%" (
    echo [错误] Go 未找到: %GO_PATH%
    echo 请修改脚本中的 GO_PATH 变量
    pause
    exit /b 1
)

:: 菜单
:menu
cls
echo ========================================
echo    NEW-API 开发环境启动器
echo ========================================
echo.
echo  [1] 完整启动 (编译后端 + 启动前后端)
echo  [2] 仅启动后端 (不重新编译)
echo  [3] 仅启动前端
echo  [4] 仅编译后端
echo  [5] 编译并启动后端
echo  [6] 退出
echo.
set /p choice=请选择操作 [1-6]:

if "%choice%"=="1" goto full_start
if "%choice%"=="2" goto backend_only
if "%choice%"=="3" goto frontend_only
if "%choice%"=="4" goto build_only
if "%choice%"=="5" goto build_and_backend
if "%choice%"=="6" exit /b 0
goto menu

:: 完整启动
:full_start
echo.
echo [1/3] 编译后端...
cd /d "%PROJECT_DIR%"
"%GO_PATH%" build -o new-api.exe .
if errorlevel 1 (
    echo [错误] 后端编译失败
    pause
    goto menu
)
echo [√] 后端编译成功

echo.
echo [2/3] 启动后端服务...
start "NEW-API Backend" cmd /k "cd /d %PROJECT_DIR% && new-api.exe"

echo.
echo [3/3] 启动前端开发服务器...
timeout /t 2 >nul
start "NEW-API Frontend" cmd /k "cd /d %WEB_DIR% && npm run dev"

echo.
echo ========================================
echo  启动完成!
echo  - 后端: http://localhost:3000
echo  - 前端: http://localhost:5173
echo ========================================
echo.
pause
goto menu

:: 仅启动后端
:backend_only
echo.
if not exist "%PROJECT_DIR%new-api.exe" (
    echo [警告] new-api.exe 不存在，先编译...
    "%GO_PATH%" build -o new-api.exe .
)
echo 启动后端服务...
start "NEW-API Backend" cmd /k "cd /d %PROJECT_DIR% && new-api.exe"
echo [√] 后端已启动: http://localhost:3000
pause
goto menu

:: 仅启动前端
:frontend_only
echo.
echo 启动前端开发服务器...
start "NEW-API Frontend" cmd /k "cd /d %WEB_DIR% && npm run dev"
echo [√] 前端已启动: http://localhost:5173
pause
goto menu

:: 仅编译后端
:build_only
echo.
echo 编译后端...
cd /d "%PROJECT_DIR%"
"%GO_PATH%" build -o new-api.exe .
if errorlevel 1 (
    echo [错误] 编译失败
) else (
    echo [√] 编译成功: new-api.exe
)
pause
goto menu

:: 编译并启动后端
:build_and_backend
echo.
echo [1/2] 编译后端...
cd /d "%PROJECT_DIR%"
"%GO_PATH%" build -o new-api.exe .
if errorlevel 1 (
    echo [错误] 后端编译失败
    pause
    goto menu
)
echo [√] 后端编译成功

echo.
echo [2/2] 启动后端服务...
start "NEW-API Backend" cmd /k "cd /d %PROJECT_DIR% && new-api.exe"
echo [√] 后端已启动: http://localhost:3000
pause
goto menu
