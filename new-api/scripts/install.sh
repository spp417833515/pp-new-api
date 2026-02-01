#!/bin/bash
#
# PP-New-API 一键安装脚本
# 用法: curl -fsSL https://raw.githubusercontent.com/spp417833515/pp-new-api/master/new-api/scripts/install.sh | bash
# 或者: wget -qO- https://raw.githubusercontent.com/spp417833515/pp-new-api/master/new-api/scripts/install.sh | bash
#

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
INSTALL_DIR="/opt/pp-new-api"
DOCKER_IMAGE="spp417833515/pp-new-api"
CONTAINER_NAME="pp-new-api"

echo -e "${BLUE}"
echo "========================================"
echo "   PP-New-API 一键安装脚本"
echo "========================================"
echo -e "${NC}"

# 检查是否为 root 用户
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}请使用 root 用户运行此脚本${NC}"
    echo "sudo bash install.sh"
    exit 1
fi

# 检查 Docker 是否安装
echo -e "${YELLOW}[1/7] 检查 Docker 环境...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker 未安装，正在安装...${NC}"
    curl -fsSL https://get.docker.com | bash
    systemctl enable docker
    systemctl start docker
    echo -e "${GREEN}Docker 安装完成${NC}"
else
    echo -e "${GREEN}Docker 已安装: $(docker --version)${NC}"
fi

# 检查 Docker Compose 是否安装
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}Docker Compose 未安装，正在安装...${NC}"
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    echo -e "${GREEN}Docker Compose 安装完成${NC}"
else
    echo -e "${GREEN}Docker Compose 已安装${NC}"
fi

# 端口配置
echo -e "${YELLOW}[2/7] 配置服务端口...${NC}"
read -p "请输入服务端口 (默认 3000): " INPUT_PORT
PORT=${INPUT_PORT:-3000}

# 检查端口是否被占用
if netstat -tuln 2>/dev/null | grep -q ":${PORT} " || ss -tuln 2>/dev/null | grep -q ":${PORT} "; then
    echo -e "${RED}警告: 端口 ${PORT} 已被占用${NC}"
    read -p "是否继续? (y/n): " confirm
    if [ "$confirm" != "y" ]; then
        echo "已取消安装"
        exit 1
    fi
fi
echo -e "${GREEN}服务端口: ${PORT}${NC}"

# 创建安装目录
echo -e "${YELLOW}[3/7] 创建安装目录...${NC}"
mkdir -p ${INSTALL_DIR}/{data,logs}
cd ${INSTALL_DIR}
echo -e "${GREEN}安装目录: ${INSTALL_DIR}${NC}"

# 生成随机密码
echo -e "${YELLOW}[4/7] 生成安全配置...${NC}"
DB_PASSWORD=$(openssl rand -base64 16 | tr -dc 'a-zA-Z0-9' | head -c 16)
SESSION_SECRET=$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 32)
echo -e "${GREEN}已生成随机数据库密码和会话密钥${NC}"

# 创建 docker-compose.yml
echo -e "${YELLOW}[5/7] 创建配置文件...${NC}"
cat > docker-compose.yml << EOF
# PP-New-API Docker Compose 配置
# 自动生成于 $(date '+%Y-%m-%d %H:%M:%S')

version: '3.4'

services:
  new-api:
    image: ${DOCKER_IMAGE}:latest
    container_name: ${CONTAINER_NAME}
    restart: unless-stopped
    command: --log-dir /app/logs
    ports:
      - "${PORT}:3000"
    volumes:
      - ./data:/data
      - ./logs:/app/logs
      - app_bin:/app/bin
      - app_public:/app/public
      - /var/run/docker.sock:/var/run/docker.sock
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    environment:
      - SQL_DSN=postgresql://root:${DB_PASSWORD}@postgres:5432/new-api
      - REDIS_CONN_STRING=redis://redis
      - SESSION_SECRET=${SESSION_SECRET}
      - TZ=Asia/Shanghai
      - ERROR_LOG_ENABLED=true
      - BATCH_UPDATE_ENABLED=true
      - DOCKER_IMAGE=${DOCKER_IMAGE}
      - DOCKER_CONTAINER=${CONTAINER_NAME}
    depends_on:
      - redis
      - postgres
    healthcheck:
      test: ["CMD-SHELL", "wget -q -O - http://localhost:3000/api/status | grep -o '\"success\":\\s*true' || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3

  redis:
    image: redis:latest
    container_name: ${CONTAINER_NAME}-redis
    restart: always
    logging:
      driver: "json-file"
      options:
        max-size: "5m"
        max-file: "2"

  postgres:
    image: postgres:15
    container_name: ${CONTAINER_NAME}-postgres
    restart: always
    environment:
      POSTGRES_USER: root
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: new-api
    volumes:
      - pg_data:/var/lib/postgresql/data
    logging:
      driver: "json-file"
      options:
        max-size: "5m"
        max-file: "2"

volumes:
  pg_data:
  app_bin:
  app_public:
EOF

echo -e "${GREEN}配置文件已创建${NC}"

# 保存密码信息
cat > .credentials << EOF
# PP-New-API 凭据信息 (请妥善保管)
# 生成时间: $(date '+%Y-%m-%d %H:%M:%S')

服务端口: ${PORT}
数据库密码: ${DB_PASSWORD}
会话密钥: ${SESSION_SECRET}
EOF
chmod 600 .credentials
echo -e "${GREEN}凭据已保存到 ${INSTALL_DIR}/.credentials${NC}"

# 拉取镜像并启动
echo -e "${YELLOW}[6/7] 拉取镜像并启动服务...${NC}"
docker-compose pull
docker-compose up -d

# 等待服务启动
echo -e "${YELLOW}等待服务启动...${NC}"
sleep 10

# 检查服务状态
echo -e "${YELLOW}[7/7] 检查服务状态...${NC}"
if docker-compose ps | grep -q "Up"; then
    echo -e "${GREEN}"
    echo "========================================"
    echo "   安装完成!"
    echo "========================================"
    echo -e "${NC}"
    echo ""
    echo -e "访问地址: ${BLUE}http://$(hostname -I | awk '{print $1}'):${PORT}${NC}"
    echo -e "默认账号: ${YELLOW}root${NC}"
    echo -e "默认密码: ${YELLOW}123456${NC}"
    echo ""
    echo -e "${RED}重要: 请立即登录并修改默认密码!${NC}"
    echo ""
    echo "常用命令:"
    echo "  查看状态: cd ${INSTALL_DIR} && docker-compose ps"
    echo "  查看日志: cd ${INSTALL_DIR} && docker-compose logs -f"
    echo "  重启服务: cd ${INSTALL_DIR} && docker-compose restart"
    echo "  停止服务: cd ${INSTALL_DIR} && docker-compose down"
    echo ""
else
    echo -e "${RED}服务启动失败，请检查日志:${NC}"
    docker-compose logs
    exit 1
fi
