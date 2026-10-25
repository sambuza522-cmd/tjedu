#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""harness-sync — 원본(하네스)과 이 사본이 갈라졌는지 한 명령으로 본다.

이 파일은 harness-install.py 가 이 대상에 맞춰 찍은 것이다.
원본: D:/manhattan/fat-man/harness/.claude/
사본: D:/manhattan/fat-man/_apps/tjedu/.claude/

install-global.py 의 해시 대조 계약을 따른다 — sha256 대조, --check 는 보고만 하고
불일치가 있으면 exit 1. 심볼릭 링크는 쓰지 않는다.
하네스 저장소 파일은 어느 모드에서도 읽기만 한다.

사용:
  python D:/manhattan/fat-man/_apps/tjedu/.claude/harness-sync.py
  python D:/manhattan/fat-man/_apps/tjedu/.claude/harness-sync.py --check
"""
from __future__ import annotations

import argparse
import hashlib
import sys
from pathlib import Path

SRC_ROOT = Path("D:/manhattan/fat-man/harness") / ".claude"
DST_ROOT = Path("D:/manhattan/fat-man/_apps/tjedu") / ".claude"

PATCH_OLD = '(harness: `D:/manhattan/fat-man/harness`)'
PATCH_NEW = "(이 사본: `D:/manhattan/fat-man/_apps/tjedu` · 원본: harness `D:/manhattan/fat-man/harness`)"

FILES = [
    "skills/harness-checklist/SKILL.md",
    "skills/harness-install/SKILL.md",
    "skills/lessons-record/SKILL.md",
    "skills/workflow-launch/references/template-args.md",
    "skills/workflow-launch/SKILL.md",
    "skills/workflow-retry/SKILL.md",
    "workflows/hq-audit.js",
    "workflows/hq-build.js",
    "workflows/hq-design.js",
    "workflows/hq-understand.js",
]


def want_bytes(src: Path) -> bytes | None:
    if not src.is_file():
        return None
    raw = src.read_bytes()
    if PATCH_OLD.encode("utf-8") not in raw:
        return raw
    return raw.decode("utf-8").replace(PATCH_OLD, PATCH_NEW).encode("utf-8")


def h(b: bytes | None) -> str | None:
    return None if b is None else hashlib.sha256(b).hexdigest()[:16]


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true", help="보고만, 쓰기 없음")
    a = ap.parse_args()

    drift = 0
    for rel in FILES:
        src, dst = SRC_ROOT / rel, DST_ROOT / rel
        want = want_bytes(src)
        have = dst.read_bytes() if dst.is_file() else None
        hw, hh = h(want), h(have)
        state = ("원본없음" if hw is None else
                 "사본없음" if hh is None else
                 "동일" if hw == hh else "다름")
        print(f"[{state:8}] {rel}  ({hw} / {hh})")
        if hw is None or hw != hh:
            drift += 1
            if hw is not None and not a.check:
                dst.parent.mkdir(parents=True, exist_ok=True)
                dst.write_bytes(want)
                print(f"           반영함 ({hw} -> {dst})")

    print(f"대상 {len(FILES)}건 / 불일치 {drift}건")
    if a.check:
        return 1 if drift else 0
    return 0


if __name__ == "__main__":
    sys.exit(main())
