#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
NEW_API 开发环境 GUI 启动器
功能：图形界面管理前端和后端服务
"""

import subprocess
import threading
import os
import sys
import tkinter as tk
from tkinter import ttk, scrolledtext
from datetime import datetime
import queue

# 项目路径配置
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(PROJECT_ROOT, "new-api")
FRONTEND_DIR = os.path.join(PROJECT_ROOT, "new-api", "web")

class DevLauncherGUI:
    def __init__(self, root):
        self.root = root
        self.root.title("NEW_API 开发环境启动器")
        self.root.geometry("900x600")
        self.root.minsize(800, 500)

        # 进程存储
        self.processes = {
            "backend": None,
            "frontend": None
        }

        # 日志队列
        self.log_queue = queue.Queue()

        # 状态变量
        self.backend_status = tk.StringVar(value="已停止")
        self.frontend_status = tk.StringVar(value="已停止")

        self.setup_ui()
        self.process_log_queue()

    def setup_ui(self):
        # 主框架
        main_frame = ttk.Frame(self.root, padding="10")
        main_frame.pack(fill=tk.BOTH, expand=True)

        # 标题
        title_label = ttk.Label(main_frame, text="NEW_API 开发环境启动器", font=("Microsoft YaHei", 16, "bold"))
        title_label.pack(pady=(0, 10))

        # 状态和控制区域
        control_frame = ttk.LabelFrame(main_frame, text="服务控制", padding="10")
        control_frame.pack(fill=tk.X, pady=(0, 10))

        # 后端控制
        backend_frame = ttk.Frame(control_frame)
        backend_frame.pack(fill=tk.X, pady=5)

        ttk.Label(backend_frame, text="后端服务 (Go:3050)", width=20).pack(side=tk.LEFT)
        self.backend_status_label = ttk.Label(backend_frame, textvariable=self.backend_status, width=10)
        self.backend_status_label.pack(side=tk.LEFT, padx=10)

        self.btn_backend_start = ttk.Button(backend_frame, text="启动", command=self.start_backend, width=8)
        self.btn_backend_start.pack(side=tk.LEFT, padx=2)

        self.btn_backend_stop = ttk.Button(backend_frame, text="停止", command=self.stop_backend, width=8, state=tk.DISABLED)
        self.btn_backend_stop.pack(side=tk.LEFT, padx=2)

        self.btn_backend_restart = ttk.Button(backend_frame, text="重启", command=self.restart_backend, width=8)
        self.btn_backend_restart.pack(side=tk.LEFT, padx=2)

        # 前端控制
        frontend_frame = ttk.Frame(control_frame)
        frontend_frame.pack(fill=tk.X, pady=5)

        ttk.Label(frontend_frame, text="前端服务 (Vite:5173)", width=20).pack(side=tk.LEFT)
        self.frontend_status_label = ttk.Label(frontend_frame, textvariable=self.frontend_status, width=10)
        self.frontend_status_label.pack(side=tk.LEFT, padx=10)

        self.btn_frontend_start = ttk.Button(frontend_frame, text="启动", command=self.start_frontend, width=8)
        self.btn_frontend_start.pack(side=tk.LEFT, padx=2)

        self.btn_frontend_stop = ttk.Button(frontend_frame, text="停止", command=self.stop_frontend, width=8, state=tk.DISABLED)
        self.btn_frontend_stop.pack(side=tk.LEFT, padx=2)

        self.btn_frontend_restart = ttk.Button(frontend_frame, text="重启", command=self.restart_frontend, width=8)
        self.btn_frontend_restart.pack(side=tk.LEFT, padx=2)

        # 快捷操作
        quick_frame = ttk.Frame(control_frame)
        quick_frame.pack(fill=tk.X, pady=(10, 0))

        ttk.Button(quick_frame, text="全部启动", command=self.start_all, width=12).pack(side=tk.LEFT, padx=5)
        ttk.Button(quick_frame, text="全部停止", command=self.stop_all, width=12).pack(side=tk.LEFT, padx=5)
        ttk.Button(quick_frame, text="全部重启", command=self.restart_all, width=12).pack(side=tk.LEFT, padx=5)
        ttk.Button(quick_frame, text="强制清理", command=self.force_kill_all, width=12).pack(side=tk.LEFT, padx=5)
        ttk.Button(quick_frame, text="清空日志", command=self.clear_logs, width=12).pack(side=tk.LEFT, padx=5)
        ttk.Button(quick_frame, text="打开浏览器", command=self.open_browser, width=12).pack(side=tk.LEFT, padx=5)

        # 日志区域
        log_frame = ttk.LabelFrame(main_frame, text="运行日志", padding="5")
        log_frame.pack(fill=tk.BOTH, expand=True)

        # 日志文本框
        self.log_text = scrolledtext.ScrolledText(log_frame, wrap=tk.WORD, font=("Consolas", 9))
        self.log_text.pack(fill=tk.BOTH, expand=True)

        # 配置日志标签颜色
        self.log_text.tag_configure("backend", foreground="#2E7D32")
        self.log_text.tag_configure("frontend", foreground="#1565C0")
        self.log_text.tag_configure("system", foreground="#6A1B9A")
        self.log_text.tag_configure("error", foreground="#C62828")
        self.log_text.tag_configure("info", foreground="#37474F")

        # 状态栏
        status_bar = ttk.Frame(main_frame)
        status_bar.pack(fill=tk.X, pady=(5, 0))

        ttk.Label(status_bar, text=f"项目路径: {PROJECT_ROOT}", font=("Microsoft YaHei", 8)).pack(side=tk.LEFT)

        # 关闭窗口时停止所有服务
        self.root.protocol("WM_DELETE_WINDOW", self.on_closing)

    def log(self, message, tag="info"):
        timestamp = datetime.now().strftime("%H:%M:%S")
        self.log_queue.put((f"[{timestamp}] {message}\n", tag))

    def process_log_queue(self):
        try:
            while True:
                message, tag = self.log_queue.get_nowait()
                self.log_text.insert(tk.END, message, tag)
                self.log_text.see(tk.END)
        except queue.Empty:
            pass
        self.root.after(100, self.process_log_queue)

    def stream_output(self, process, name, tag):
        """实时读取进程输出并显示到日志"""
        try:
            while process.poll() is None:
                line = process.stdout.readline()
                if line:
                    # 清理 ANSI 转义序列
                    import re
                    clean_line = re.sub(r'\x1b\[[0-9;]*m', '', line)
                    self.log_queue.put((f"[{name}] {clean_line}", tag))
            # 读取剩余输出
            remaining = process.stdout.read()
            if remaining:
                import re
                for line in remaining.splitlines():
                    clean_line = re.sub(r'\x1b\[[0-9;]*m', '', line)
                    self.log_queue.put((f"[{name}] {clean_line}\n", tag))
        except Exception as e:
            self.log_queue.put((f"[{name}] 日志读取错误: {e}\n", "error"))

    def update_status(self, service, running):
        if service == "backend":
            if running:
                self.backend_status.set("运行中")
                self.btn_backend_start.config(state=tk.DISABLED)
                self.btn_backend_stop.config(state=tk.NORMAL)
            else:
                self.backend_status.set("已停止")
                self.btn_backend_start.config(state=tk.NORMAL)
                self.btn_backend_stop.config(state=tk.DISABLED)
        elif service == "frontend":
            if running:
                self.frontend_status.set("运行中")
                self.btn_frontend_start.config(state=tk.DISABLED)
                self.btn_frontend_stop.config(state=tk.NORMAL)
            else:
                self.frontend_status.set("已停止")
                self.btn_frontend_start.config(state=tk.NORMAL)
                self.btn_frontend_stop.config(state=tk.DISABLED)

    def start_backend(self):
        if self.processes["backend"] and self.processes["backend"].poll() is None:
            self.log("后端服务已在运行中", "system")
            return

        self.log("正在启动后端服务...", "system")
        try:
            self.processes["backend"] = subprocess.Popen(
                ["go", "run", ".", "-port", "3050"],
                cwd=BACKEND_DIR,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                bufsize=1,
                encoding='utf-8',
                errors='replace',
                creationflags=subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0
            )
            thread = threading.Thread(
                target=self.stream_output,
                args=(self.processes["backend"], "后端", "backend"),
                daemon=True
            )
            thread.start()
            self.update_status("backend", True)
            self.log(f"后端服务已启动 (PID: {self.processes['backend'].pid})", "system")
        except Exception as e:
            self.log(f"启动后端失败: {e}", "error")

    def start_frontend(self):
        if self.processes["frontend"] and self.processes["frontend"].poll() is None:
            self.log("前端服务已在运行中", "system")
            return

        self.log("正在启动前端服务...", "system")
        try:
            npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"
            self.processes["frontend"] = subprocess.Popen(
                [npm_cmd, "run", "dev"],
                cwd=FRONTEND_DIR,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                bufsize=1,
                encoding='utf-8',
                errors='replace',
                creationflags=subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0
            )
            thread = threading.Thread(
                target=self.stream_output,
                args=(self.processes["frontend"], "前端", "frontend"),
                daemon=True
            )
            thread.start()
            self.update_status("frontend", True)
            self.log(f"前端服务已启动 (PID: {self.processes['frontend'].pid})", "system")
        except Exception as e:
            self.log(f"启动前端失败: {e}", "error")

    def stop_backend(self):
        proc = self.processes.get("backend")
        if proc and proc.poll() is None:
            self.log("正在停止后端服务...", "system")
            try:
                if sys.platform == "win32":
                    # 强制终止进程树
                    subprocess.run(["taskkill", "/F", "/T", "/PID", str(proc.pid)],
                                   capture_output=True, creationflags=subprocess.CREATE_NO_WINDOW)
                    # 额外清理可能残留的 go 进程
                    subprocess.run(["taskkill", "/F", "/IM", "new-api.exe"],
                                   capture_output=True, creationflags=subprocess.CREATE_NO_WINDOW)
                else:
                    proc.terminate()
                proc.wait(timeout=5)
            except:
                proc.kill()
            self.processes["backend"] = None
            self.update_status("backend", False)
            self.log("后端服务已停止", "system")
        else:
            # 即使进程记录为空，也尝试清理残留进程
            if sys.platform == "win32":
                subprocess.run(["taskkill", "/F", "/IM", "new-api.exe"],
                               capture_output=True, creationflags=subprocess.CREATE_NO_WINDOW)
            self.processes["backend"] = None
            self.update_status("backend", False)
            self.log("后端服务未运行", "system")

    def stop_frontend(self):
        proc = self.processes.get("frontend")
        if proc and proc.poll() is None:
            self.log("正在停止前端服务...", "system")
            try:
                if sys.platform == "win32":
                    # 强制终止进程树
                    subprocess.run(["taskkill", "/F", "/T", "/PID", str(proc.pid)],
                                   capture_output=True, creationflags=subprocess.CREATE_NO_WINDOW)
                else:
                    proc.terminate()
                proc.wait(timeout=5)
            except:
                proc.kill()
            self.processes["frontend"] = None
            self.update_status("frontend", False)
            self.log("前端服务已停止", "system")
        else:
            self.processes["frontend"] = None
            self.update_status("frontend", False)
            self.log("前端服务未运行", "system")

    def restart_backend(self):
        self.stop_backend()
        self.root.after(1000, self.start_backend)

    def restart_frontend(self):
        self.stop_frontend()
        self.root.after(1000, self.start_frontend)

    def start_all(self):
        self.start_backend()
        self.root.after(2000, self.start_frontend)

    def stop_all(self):
        self.stop_frontend()
        self.stop_backend()

    def restart_all(self):
        self.log("正在重启所有服务...", "system")
        self.stop_all()
        self.root.after(1500, self.start_all)

    def clear_logs(self):
        self.log_text.delete(1.0, tk.END)

    def force_kill_all(self):
        """强制清理所有相关进程"""
        self.log("正在强制清理所有进程...", "system")
        if sys.platform == "win32":
            # 清理 Go 后端进程
            subprocess.run(["taskkill", "/F", "/IM", "go.exe"],
                           capture_output=True, creationflags=subprocess.CREATE_NO_WINDOW)
            subprocess.run(["taskkill", "/F", "/IM", "new-api.exe"],
                           capture_output=True, creationflags=subprocess.CREATE_NO_WINDOW)
            # 清理 Node 前端进程
            subprocess.run(["taskkill", "/F", "/IM", "node.exe"],
                           capture_output=True, creationflags=subprocess.CREATE_NO_WINDOW)
        else:
            subprocess.run(["pkill", "-f", "go run"], capture_output=True)
            subprocess.run(["pkill", "-f", "node"], capture_output=True)

        # 重置状态
        self.processes["backend"] = None
        self.processes["frontend"] = None
        self.update_status("backend", False)
        self.update_status("frontend", False)
        self.log("所有进程已强制清理", "system")

    def open_browser(self):
        import webbrowser
        webbrowser.open("http://localhost:5173")
        self.log("已打开浏览器: http://localhost:5173", "system")

    def on_closing(self):
        self.log("正在关闭...", "system")
        self.stop_all()
        self.root.after(500, self.root.destroy)

def main():
    root = tk.Tk()

    # 设置主题样式
    style = ttk.Style()
    style.theme_use('clam')

    app = DevLauncherGUI(root)
    root.mainloop()

if __name__ == "__main__":
    main()
