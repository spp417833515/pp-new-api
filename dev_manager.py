#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
NEW_API 开发环境管理器
功能：启动/停止/重启 前端和后端服务，实时查看日志
"""

import subprocess
import threading
import os
import sys
import signal
import time
from datetime import datetime

# 项目路径配置
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(PROJECT_ROOT, "new-api")
FRONTEND_DIR = os.path.join(PROJECT_ROOT, "new-api", "web")

# 进程存储
processes = {
    "backend": None,
    "frontend": None
}

# 日志颜色
class Colors:
    RESET = "\033[0m"
    RED = "\033[91m"
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    BLUE = "\033[94m"
    CYAN = "\033[96m"

def log(msg, color=Colors.RESET):
    timestamp = datetime.now().strftime("%H:%M:%S")
    print(f"{color}[{timestamp}] {msg}{Colors.RESET}")

def stream_output(process, name, color):
    """实时输出进程日志"""
    try:
        for line in iter(process.stdout.readline, ''):
            if line:
                print(f"{color}[{name}]{Colors.RESET} {line}", end='')
    except:
        pass

def start_backend():
    """启动后端服务"""
    if processes["backend"] and processes["backend"].poll() is None:
        log("后端服务已在运行中", Colors.YELLOW)
        return

    log("正在启动后端服务...", Colors.CYAN)
    try:
        processes["backend"] = subprocess.Popen(
            ["go", "run", "."],
            cwd=BACKEND_DIR,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
            creationflags=subprocess.CREATE_NEW_PROCESS_GROUP if sys.platform == "win32" else 0
        )
        thread = threading.Thread(
            target=stream_output,
            args=(processes["backend"], "后端", Colors.GREEN),
            daemon=True
        )
        thread.start()
        log("后端服务已启动 (PID: {})".format(processes["backend"].pid), Colors.GREEN)
    except Exception as e:
        log(f"启动后端失败: {e}", Colors.RED)

def start_frontend():
    """启动前端服务"""
    if processes["frontend"] and processes["frontend"].poll() is None:
        log("前端服务已在运行中", Colors.YELLOW)
        return

    log("正在启动前端服务...", Colors.CYAN)
    try:
        # Windows 使用 npm.cmd
        npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"
        processes["frontend"] = subprocess.Popen(
            [npm_cmd, "run", "dev"],
            cwd=FRONTEND_DIR,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
            creationflags=subprocess.CREATE_NEW_PROCESS_GROUP if sys.platform == "win32" else 0
        )
        thread = threading.Thread(
            target=stream_output,
            args=(processes["frontend"], "前端", Colors.BLUE),
            daemon=True
        )
        thread.start()
        log("前端服务已启动 (PID: {})".format(processes["frontend"].pid), Colors.BLUE)
    except Exception as e:
        log(f"启动前端失败: {e}", Colors.RED)

def stop_process(name):
    """停止指定进程"""
    proc = processes.get(name)
    if proc and proc.poll() is None:
        log(f"正在停止{name}服务...", Colors.YELLOW)
        try:
            if sys.platform == "win32":
                # Windows: 使用 taskkill 终止进程树
                subprocess.run(
                    ["taskkill", "/F", "/T", "/PID", str(proc.pid)],
                    capture_output=True
                )
            else:
                os.killpg(os.getpgid(proc.pid), signal.SIGTERM)
            proc.wait(timeout=5)
        except:
            proc.kill()
        processes[name] = None
        log(f"{name}服务已停止", Colors.GREEN)
    else:
        log(f"{name}服务未运行", Colors.YELLOW)

def stop_all():
    """停止所有服务"""
    stop_process("frontend")
    stop_process("backend")

def restart_all():
    """重启所有服务"""
    log("正在重启所有服务...", Colors.CYAN)
    stop_all()
    time.sleep(1)
    start_backend()
    start_frontend()

def restart_backend():
    """重启后端服务"""
    stop_process("backend")
    time.sleep(1)
    start_backend()

def restart_frontend():
    """重启前端服务"""
    stop_process("frontend")
    time.sleep(1)
    start_frontend()

def show_status():
    """显示服务状态"""
    print("\n" + "=" * 50)
    print("服务状态:")
    print("=" * 50)

    for name, proc in processes.items():
        if proc and proc.poll() is None:
            status = f"{Colors.GREEN}运行中 (PID: {proc.pid}){Colors.RESET}"
        else:
            status = f"{Colors.RED}已停止{Colors.RESET}"
        print(f"  {name}: {status}")
    print("=" * 50 + "\n")

def show_help():
    """显示帮助信息"""
    print("""
╔══════════════════════════════════════════════════════════════╗
║              NEW_API 开发环境管理器                           ║
╠══════════════════════════════════════════════════════════════╣
║  命令:                                                       ║
║    1 / start    - 启动所有服务                               ║
║    2 / stop     - 停止所有服务                               ║
║    3 / restart  - 重启所有服务                               ║
║    4 / rb       - 仅重启后端                                 ║
║    5 / rf       - 仅重启前端                                 ║
║    6 / status   - 查看服务状态                               ║
║    7 / help     - 显示帮助                                   ║
║    0 / quit     - 退出程序                                   ║
╚══════════════════════════════════════════════════════════════╝
""")

def main():
    """主函数"""
    # 设置控制台编码
    if sys.platform == "win32":
        os.system("chcp 65001 >nul 2>&1")

    print(f"""
{Colors.CYAN}
╔══════════════════════════════════════════════════════════════╗
║              NEW_API 开发环境管理器 v1.0                      ║
║                                                              ║
║  项目路径: {PROJECT_ROOT[:40]:<40} ║
╚══════════════════════════════════════════════════════════════╝
{Colors.RESET}
""")

    show_help()

    # 自动启动服务
    log("自动启动所有服务...", Colors.CYAN)
    start_backend()
    time.sleep(2)  # 等待后端启动
    start_frontend()

    # 命令循环
    while True:
        try:
            cmd = input(f"\n{Colors.YELLOW}输入命令 (help 查看帮助): {Colors.RESET}").strip().lower()

            if cmd in ["1", "start"]:
                start_backend()
                start_frontend()
            elif cmd in ["2", "stop"]:
                stop_all()
            elif cmd in ["3", "restart"]:
                restart_all()
            elif cmd in ["4", "rb"]:
                restart_backend()
            elif cmd in ["5", "rf"]:
                restart_frontend()
            elif cmd in ["6", "status"]:
                show_status()
            elif cmd in ["7", "help", "?"]:
                show_help()
            elif cmd in ["0", "quit", "exit", "q"]:
                log("正在退出...", Colors.YELLOW)
                stop_all()
                break
            elif cmd == "":
                continue
            else:
                log(f"未知命令: {cmd}", Colors.RED)

        except KeyboardInterrupt:
            print()
            log("检测到 Ctrl+C，正在退出...", Colors.YELLOW)
            stop_all()
            break
        except EOFError:
            break

    log("程序已退出", Colors.GREEN)

if __name__ == "__main__":
    main()
