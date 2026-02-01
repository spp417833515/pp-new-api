#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Claude Code Hook - 关键词触发 + API 动态获取规则
"""

import io
import json
import os
import sys
import urllib.request

# Windows 编码修复
sys.stdin = io.TextIOWrapper(sys.stdin.buffer, encoding="utf-8", errors="replace")
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")


# ╔══════════════════════════════════════════════════════════════╗
# ║  配置区                                                       ║
# ╚══════════════════════════════════════════════════════════════╝

# 关键词规则 (触发关键词 → 请求对应规则类型)
RULES = [
    {
        "keywords": ["bug","修复","错误","报错","失败","异常","严重","存在","还是","有"],
        "min_hits": 2,
        "rule_type": "testRules",  # 错误分析规则
        "label": "错误分析规则",
    },
    {
        "keywords": ["审查", "审核", "review", "检查"],
        "min_hits": 1,
        "rule_type": "reviewRules",  # 审查规则
        "label": "代码审查规则",
    },
    {
        "keywords": ["编码", "风格", "格式", "命名", "编写", "开始", "代码"],
        "min_hits": 2,
        "rule_type": "codeStyle",  # 编码风格
        "label": "编码风格规则",
    },
    {
        "keywords": ["开始", "进行", "准备", "测试", "单元", "用例", "test", "覆盖率"],
        "min_hits": 2,
        "rule_type": "unitTests",  # 代码测试
        "label": "代码测试规则",
    },
]

# 绕过词列表
BYPASS = [
    "补充",
    "确定",
    "确认",
    "继续",
    "好的",
    "可以",
    "ok",
    "yes",
    "hi",
    "hello",
    "你好",
]


# ╔══════════════════════════════════════════════════════════════╗
# ║  API 请求函数                                                  ║
# ╚══════════════════════════════════════════════════════════════╝


def load_ppdocs_config():
    """读取 .ppdocs 配置"""
    config_path = os.path.join(os.getcwd(), ".ppdocs")
    if not os.path.exists(config_path):
        return None
    try:
        with open(config_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except:
        return None


def fetch_rules(api_base: str, project_id: str, key: str, rule_type: str) -> list:
    """通过 HTTP API 获取指定类型的规则"""
    url = f"{api_base}/api/{project_id}/{key}/rules/{rule_type}"
    try:
        req = urllib.request.Request(url, method="GET")
        req.add_header("Content-Type", "application/json")
        with urllib.request.urlopen(req, timeout=3) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            if data.get("success") and data.get("data"):
                return data["data"]
    except:
        pass
    return []


# ╔══════════════════════════════════════════════════════════════╗
# ║  匹配逻辑                                                      ║
# ╚══════════════════════════════════════════════════════════════╝


def count_hits(text: str, keywords: list) -> int:
    """计算关键词命中数量"""
    return sum(1 for kw in keywords if kw.lower() in text)


def match_rule(text: str):
    """匹配规则，返回 (rule, matched)"""
    for rule in RULES:
        hits = count_hits(text, rule["keywords"])
        if hits >= rule.get("min_hits", 1):
            return rule, True
    return None, False


def format_rules(items: list, label: str) -> str:
    """格式化规则输出"""
    if not items:
        return ""
    lines = [f"# {label}\n"]
    for item in items:
        lines.append(f"- {item}")
    return "\n".join(lines)


# ╔══════════════════════════════════════════════════════════════╗
# ║  主入口                                                        ║
# ╚══════════════════════════════════════════════════════════════╝


def main():
    try:
        data = json.load(sys.stdin)
    except:
        return

    if data.get("hook_event_name") != "UserPromptSubmit":
        return

    user_input = data.get("prompt", "").strip()
    if not user_input:
        return

    user_input_lower = user_input.lower()

    # 短输入包含绕过词 → 跳过
    if len(user_input) <= 15:
        for word in BYPASS:
            if word.lower() in user_input_lower:
                return

    # 读取配置
    config = load_ppdocs_config()
    if not config:
        return

    api_base = config.get("api", "http://localhost:20001")
    project_id = config.get("projectId", "")
    key = config.get("key", "")

    if not project_id or not key:
        return

    output_parts = []

    # 1. 强制获取 userStyles (用户沟通规则)
    user_styles = fetch_rules(api_base, project_id, key, "userStyles")
    if user_styles:
        output_parts.append(format_rules(user_styles, "用户沟通规则"))

    # 2. 根据关键词匹配额外规则
    rule, matched = match_rule(user_input_lower)
    if matched and rule["rule_type"] != "userStyles":
        extra_rules = fetch_rules(api_base, project_id, key, rule["rule_type"])
        if extra_rules:
            output_parts.append(format_rules(extra_rules, rule["label"]))

    # 输出
    if output_parts:
        print("\n\n".join(output_parts))


if __name__ == "__main__":
    main()
