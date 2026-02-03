FROM oven/bun:latest AS builder

WORKDIR /build
COPY web/package.json .
COPY web/bun.lock .
# 使用阿里云 npm 镜像加速
RUN bun config set registry https://registry.npmmirror.com && bun install
COPY ./web .
COPY ./VERSION .
RUN DISABLE_ESLINT_PLUGIN='true' VITE_REACT_APP_VERSION=$(cat VERSION) bun run build

FROM golang:alpine AS builder2
ENV GO111MODULE=on CGO_ENABLED=0
# 使用七牛云 Go 代理加速
ENV GOPROXY=https://goproxy.cn,direct

ARG TARGETOS
ARG TARGETARCH
ENV GOOS=${TARGETOS:-linux} GOARCH=${TARGETARCH:-amd64}
ENV GOEXPERIMENT=greenteagc

WORKDIR /build

ADD go.mod go.sum ./
RUN go mod download

COPY . .
COPY --from=builder /build/dist ./web/dist
RUN go build -ldflags "-s -w -X 'github.com/QuantumNous/new-api/common.Version=$(cat VERSION)'" -o new-api

FROM debian:bookworm-slim

# 安装基础依赖 + Docker CLI (从官方源获取最新版)
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates tzdata libasan8 wget curl gnupg \
    && install -m 0755 -d /etc/apt/keyrings \
    && curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg \
    && chmod a+r /etc/apt/keyrings/docker.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian bookworm stable" > /etc/apt/sources.list.d/docker.list \
    && apt-get update \
    && apt-get install -y --no-install-recommends docker-ce-cli \
    && rm -rf /var/lib/apt/lists/* \
    && update-ca-certificates

# 创建应用目录结构
RUN mkdir -p /app/bin /app/public /data

# 复制二进制文件和前端文件
COPY --from=builder2 /build/new-api /app/bin/new-api
COPY --from=builder /build/dist /app/public
COPY ./VERSION /app/VERSION

# 创建启动脚本
RUN echo '#!/bin/sh\nexec /app/bin/new-api "$@"' > /app/entrypoint.sh \
    && chmod +x /app/entrypoint.sh /app/bin/new-api

# 支持 --version 参数
RUN echo '#!/bin/sh\nif [ "$1" = "--version" ]; then cat /app/VERSION; exit 0; fi\nexec /app/bin/new-api "$@"' > /app/entrypoint.sh

EXPOSE 3000
WORKDIR /data
ENTRYPOINT ["/app/entrypoint.sh"]
