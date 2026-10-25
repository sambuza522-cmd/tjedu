#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""rail-write-guard — 레일 파일 7종에 대한 쓰기를 PreToolUse 에서 막는다.

harness-install.py 가 찍은 파일이다. settings.json 의 hooks.PreToolUse 에 등록돼 있다.
막는 것: Write/Edit/MultiEdit/NotebookEdit 가 레일 경로를 겨눌 때, 그리고 Bash/PowerShell
명령이 같은 경로를 쓰기성 동작(리다이렉트·tee·sed -i·cp·mv·rm·Set-Content 등)으로 건드릴 때.
읽기(cat·grep·sed -n)는 막지 않는다. 막으면 사유 1줄을 stderr 에 내고 exit 2.
이 훅 자신이 깨지면(입력 파싱 실패 등) 통과시킨다(fail-open).
"""
import json
import re
import sys

PATH_RAIL = re.compile(
    r"(?:^|/)(?:\.claude/(?:agents|skills)/"
    r"|settings[^/]*\.json$"
    r"|(?:transfer-gate\.py|hq-gate\.json|install-global\.py|agent-registry\.json)$)")
CMD_RAIL = (r"(?:\.claude/(?:agents|skills)(?![\w.-])"
            r"|(?<![\w.-])settings[\w.-]*\.json"
            r"|(?<![\w.-])(?:transfer-gate\.py|hq-gate\.json|install-global\.py|agent-registry\.json))")
RAIL_IN_CMD = re.compile(CMD_RAIL)
REDIR = re.compile(r">>?\s*[\"']?[^\s;|&<>]*?" + CMD_RAIL)
WRITE_WORD = re.compile(
    r"(?<![\w-])(?:tee|rm|rmdir|mv|move|ren|truncate|shred|ln|touch|dd|patch|set-content|add-content|"
    r"out-file|new-item|remove-item|move-item|rename-item|clear-content|set-itemproperty|"
    r"git\s+(?:apply|restore|checkout))(?![\w-])")
SED_I = re.compile(r"(?<![\w-])(?:sed|perl)\b.*\s(?:-[a-z]*i|--in-place)")
COPY_WORD = re.compile(r"(?<![\w-])(?:cp|copy|copy-item|install|xcopy|robocopy)(?![\w-])")
PY_WRITE = re.compile(r"open\([^)]*,\s*[\"'](?:[wax]|r\+)|mode\s*=\s*[\"'][wax]|write_text|write_bytes")


def deny(why: str) -> int:
    sys.stderr.buffer.write(("[레일 보호] " + why + "\n").encode("utf-8"))
    return 2


def check_command(cmd: str):
    c = cmd.replace("\\", "/").lower()
    if RAIL_IN_CMD.search(c) and PY_WRITE.search(c):
        return "레일 파일을 파이썬 쓰기로 건드리는 명령이다. 사용자가 직접 고친다."
    for seg in re.split(r"\n|;|&&|\|\|?", c):
        if not RAIL_IN_CMD.search(seg):
            continue
        if REDIR.search(seg):
            return "레일 파일로 리다이렉트하는 명령이다. 사용자가 직접 고친다."
        if WRITE_WORD.search(seg) or SED_I.search(seg):
            return "레일 파일을 쓰기·삭제·이동하는 명령이다. 사용자가 직접 고친다."
        if COPY_WORD.search(seg):
            toks = seg.split()
            tail = toks[-1].strip("\"'") if toks else ""
            if RAIL_IN_CMD.search(tail) or re.search(r"-destination\s+\S*" + CMD_RAIL, seg):
                return "레일 파일을 덮어쓰는 복사 명령이다. 사용자가 직접 고친다."
    return None


def main() -> int:
    try:
        data = json.loads(sys.stdin.buffer.read().decode("utf-8"))
        name = data.get("tool_name", "")
        ti = data.get("tool_input") or {}
        if name in ("Write", "Edit", "MultiEdit", "NotebookEdit"):
            p = str(ti.get("file_path") or ti.get("notebook_path") or "").replace("\\", "/").lower()
            if p and PATH_RAIL.search(p):
                return deny(f"레일 파일은 {name} 로 쓸 수 없다: {p} — 사용자가 직접 고친다.")
        elif name in ("Bash", "PowerShell"):
            why = check_command(str(ti.get("command") or ""))
            if why:
                return deny(why)
    except Exception:
        return 0
    return 0


if __name__ == "__main__":
    sys.exit(main())
