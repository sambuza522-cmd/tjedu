# tjedu — 하네스 설치 안내

이 폴더(`D:/manhattan/fat-man/_apps/tjedu/.claude`)는 `D:/manhattan/fat-man/harness/tools/harness-install.py` 가 깔았다.
절차는 하네스 저장소의 `.claude/skills/harness-install/SKILL.md` 에 있다.

## 1. 깔린 것

| 자리 | 내용 |
|---|---|
| `skills/` | 절차 5종, 파일 6건 |
| `workflows/` | 워크플로 4건 |
| `hq-gate.json` | transfer-gate 프로젝트 선언(관측 모드) |
| `settings.json` | `permissions.deny` 7건 + `hooks.PreToolUse` 등록 1건 |
| `rail-write-guard.py` | 레일 7종 쓰기를 막는 PreToolUse 훅 |
| `harness-sync.py` | 원본↔사본 갈라짐 확인 도구 |
| `README.md` | 이 파일 |

안 깐 워크플로 — 대상 트리 밖 절대경로 상수를 들고 있어 이 자리에서 돌지 않는다.

- `ppt-deck.js` — ppt-deck.js:14: const PPTOR = 'D:/manhattan/fat-man/_tools/decker'

## 2. 검문 범위(guarded)

- `docs/**/*.{md,markdown,txt,json}`
- `docs/**/*.{md,markdown,txt,json}.bak*`

제외 세그먼트: `handoffs`

설치 시점에 이 글롭이 대상 실재 파일 1건을 덮었다 — `transfer-gate.py` 의 `compile_guard()` 를 호출해 잰 값이고, `hq-gate.json` 의 `_measured` 에도 같은 수가 있다.
매치가 0건이면 설치가 아무것도 만들지 않고 멈춘다(빈 껍데기 금지).

## 3. settings.json 이 막는 것과 못 막는 것

막는 것 — 아래 7건의 `Edit` 호출:

- `Edit(**/.claude/agents/**)`
- `Edit(**/.claude/skills/**)`
- `Edit(**/settings*.json)`
- `Edit(**/transfer-gate.py)`
- `Edit(**/hq-gate.json)`
- `Edit(**/install-global.py)`
- `Edit(**/agent-registry.json)`

Permission rules are enforced by Claude Code, not by the model.

위 7건은 `Edit` 만 건다. `Write`·`Bash`·`PowerShell` 구멍은 `hooks.PreToolUse` 에 등록한
`rail-write-guard.py` 가 메운다 — 같은 7종 경로에 대한 `Write`·`Edit`·`MultiEdit`·`NotebookEdit`,
그리고 리다이렉트·`tee`·`sed -i`·`cp`(도착지)·`mv`·`rm`·`Set-Content`·`Add-Content`·`Out-File`·`New-Item` 등
쓰기성 명령을 exit 2 로 거부한다. 읽기(`cat`·`grep`·`sed -n`)는 막지 않는다.

못 막는 것 — 문자열 패턴으로 보는 훅이라 한계가 있다:

- 경로를 변수·조립·스크립트 파일 안에 숨긴 쓰기(`python 편집스크립트.py` 등)는 못 본다.
- 훅이 깨지거나 입력을 못 읽으면 통과시킨다(fail-open).
- 훅 파일 `rail-write-guard.py` 자신은 7종에 들어 있지 않아 보호되지 않는다.
- 사용자가 직접 치는 파워셸은 훅 밖이다. 훅은 도구 호출만 본다.

## 4. 차단 스위치 — 사용자가 직접 켠다

지금은 관측 모드다. 판정이 쌓이기만 하고 도구 호출은 막히지 않는다.
차단으로 바꾸려면 아래 한 줄을 파워셸에서 친다. 설치 러너는 이 파일을 만들지 않는다.

```powershell
New-Item -ItemType File -Path D:/manhattan/fat-man/_apps/tjedu/.claude/hq-gate-deny.on
```

되돌리려면 그 파일을 지운다(사용자가 직접).

## 5. 갈라졌는지 보기

```
python D:/manhattan/fat-man/_apps/tjedu/.claude/harness-sync.py --check
```

불일치가 있으면 exit 1 이다. `--check` 를 빼면 원본을 사본에 반영한다.

## 6. 아직 재지 않은 것

- 이 자리에서 `settings.json` deny 7건과 훅이 실제로 거부를 내는지 — 카나리아 미실행.
- 관측 모드 판정이 실제로 로그에 쌓이는지 — 이 설치에서 확인하지 않았다.
