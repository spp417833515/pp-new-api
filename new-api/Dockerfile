FROM oven/bun:latest AS builder

WORKDIR /build
COPY web/package.json .
COPY web/bun.lock .
RUN bun install
COPY ./web .
COPY ./VERSION .
RUN DISABLE_ESLINT_PLUGIN='true' VITE_REACT_APP_VERSION=$(cat VERSION) bun run build

FROM golang:alpine AS builder2
ENV GO111MODULE=on CGO_ENABLED=0

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

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates tzdata libasan8 wget docker.io \
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
