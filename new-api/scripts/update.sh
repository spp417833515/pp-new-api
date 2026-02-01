#!/bin/bash
#
# PP-New-API 手动更新脚本
# 用法: /opt/pp-new-api/update.sh [版本号]
#

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

INSTALL_DIR="/opt/pp-new-api"
DOCKER_IMAGE="spp417833515/pp-new-api"

cd ${INSTALL_DIR}

echo -e "${BLUE}"
echo "========================================"
echo "   PP-New-API 更新脚本"
echo "========================================"
echo -e "${NC}"

# 获取当前版本
CURRENT_VERSION=$(docker exec pp-new-api cat /app/VERSION 2>/dev/null || echo "未知")
echo -e "当前版本: ${YELLOW}${CURRENT_VERSION}${NC}"

# 目标版本
if [ -n "$1" ]; then
    TARGET_VERSION="$1"
else
    TARGET_VERSION="latest"
fi
echo -e "目标版本: ${YELLOW}${TARGET_VERSION}${NC}"
echo ""

# 确认更新
read -p "确认更新? (y/n): " confirm
if [ "$confirm" != "y" ]; then
    echo "已取消"
    exit 0
fi

echo ""
echo -e "${YELLOW}[1/3] 拉取新镜像...${NC}"
docker pull ${DOCKER_IMAGE}:${TARGET_VERSION}

echo ""
echo -e "${YELLOW}[2/3] 重启服务...${NC}"
docker-compose down
docker-compose up -d

echo ""
echo -e "${YELLOW}[3/3] 检查服务状态...${NC}"
sleep 5

if docker-compose ps | grep -q "Up"; then
    NEW_VERSION=$(docker exec pp-new-api cat /app/VERSION 2>/dev/null || echo "未知")
    echo -e "${GREEN}"
    echo "========================================"
    echo "   更新完成!"
    echo "========================================"
    echo -e "${NC}"
    echo -e "版本: ${YELLOW}${CURRENT_VERSION}${NC} → ${GREEN}${NEW_VERSION}${NC}"
else
    echo -e "${RED}更新失败，正在回滚...${NC}"
    docker-compose down
    docker pull ${DOCKER_IMAGE}:${CURRENT_VERSION}
    docker-compose up -d
    echo -e "${YELLOW}已回滚到 ${CURRENT_VERSION}${NC}"
    exit 1
fi
