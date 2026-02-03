@echo off
chcp 65001 >nul
echo ========================================
echo   PP-New-API Docker 镜像构建推送脚本
echo ========================================
echo.

cd /d D:\Admin\Desktop\NEW_API\new-api

echo [1/5] 读取版本号...
set /p VERSION=<VERSION
echo 版本号: %VERSION%
echo.

echo [2/5] 检查关键文件...
if not exist "VERSION" (
    echo 错误: VERSION 文件不存在
    pause
    exit /b 1
)
if not exist "Dockerfile" (
    echo 错误: Dockerfile 不存在
    pause
    exit /b 1
)
if not exist "web\package.json" (
    echo 错误: web\package.json 不存在
    pause
    exit /b 1
)
echo 文件检查通过!
echo.

echo [3/5] 构建 Docker 镜像 (linux/amd64)...
echo 这可能需要 10-15 分钟，请耐心等待...
echo (包含前端编译 + Go 编译)
echo.
set DOCKER_BUILDKIT=0
docker build --no-cache --platform linux/amd64 -t spp417833515/pp-new-api:latest -t spp417833515/pp-new-api:%VERSION% .

if %errorlevel% neq 0 (
    echo.
    echo Docker 构建失败! 请检查错误信息。
    pause
    exit /b 1
)

echo.
echo [4/5] 推送镜像到 Docker Hub...
echo 推送 latest 标签...
docker push spp417833515/pp-new-api:latest
if %errorlevel% neq 0 (
    echo.
    echo 推送 latest 失败! 请先执行 docker login 登录。
    pause
    exit /b 1
)

echo 推送 %VERSION% 标签...
docker push spp417833515/pp-new-api:%VERSION%
if %errorlevel% neq 0 (
    echo.
    echo 推送 %VERSION% 失败!
    pause
    exit /b 1
)

echo.
echo [5/5] 清理本地镜像缓存 (可选)...
echo 跳过清理，保留本地镜像用于调试
echo.

echo ========================================
echo   构建推送完成! 版本: %VERSION%
echo ========================================
echo.
echo Docker Hub 地址:
echo https://hub.docker.com/r/spp417833515/pp-new-api
echo.
echo 服务器部署命令:
echo docker pull spp417833515/pp-new-api:latest
echo docker-compose up -d
echo.
pause
