# CLAUDE.md — tjedu

## _apps 표준

이 프로젝트는 `_apps` 표준을 따른다.
정본: `D:/manhattan/fat-man/harness/docs/apps-standard/STANDARD.md` (v2)

### 고정 골격 18자리

있고 없고를 떠나 37곳에 같은 자리를 깐다. 내용이 없으면 빈 폴더로 두고 `.gitkeep` 을 넣는다.
자리 목록의 정본은 `D:/manhattan/fat-man/harness/docs/apps-standard/items.json` 의 `skeleton` 배열 하나다.
아래 18자리는 그 배열과 같은 자리들이고, 읽기 쉽게 파일 먼저·폴더 나중으로 묶어 놓았다 — 자리 구성은 같고 나열 순서만 다르다.
검사기가 보는 순서는 items.json 쪽이다.

파일 5자리

1. `README.md`
2. `CLAUDE.md`
3. `.gitignore`
4. `.claude/hq-gate.json`
5. `docs/README.md`

폴더 13자리

6. `docs/`
7. `docs/research/`
8. `docs/brand/`
9. `docs/handoffs/` — 세션 인계 기록. 다른 곳에서 넘어온 인계·요청 글은 `from-(보낸 곳)-YYYY-MM-DD.md` 로 둔다. 이 프로젝트가 남기는 마감 기록에는 `from-` 을 붙이지 않는다.
10. `docs/decisions/`
11. `docs/decks/`
12. `docs/design/`
13. `public/`
14. `public/images/`
15. `public/videos/`
16. `public/fonts/`
17. `legacy/`
18. `raw/` — 사용자가 손으로 가져온 원자료를 그대로 두는 곳. 도구는 여기에 쓰지 않고, 안의 글자를 고치지 않고, 읽어서 다른 자리로 옮겨 적는다.

모노레포처럼 골격이 저장소 루트가 아닌 하위 폴더에 있는 프로젝트는 items.json 의 `base_path` 가 그 기준 경로를 정한다(예: `bubu` = `apps/web`). 검사기도 같은 값을 읽는다.

코드 자리(`src/` · `supabase/` · `supabase/migrations/` · `scripts/` · `tests/` · `logs/`)는 새로 만들지 않는다. 프레임워크가 만든다. 있으면 이 이름만 쓴다.

### 자리 판별 — 한 줄

웹 주소로 열리면 `public/`, 사람이 읽거나 작업하면 `docs/`, 둘 다 아니면 `legacy/`.

- `public/` 아래는 `images` · `videos` · `fonts` 셋뿐이다.
- `docs/` 아래는 폴더 여섯(`research` · `brand` · `handoffs` · `decisions` · `decks` · `design`)과 안내 파일 `README.md` 하나다.
- `assets/` 는 쓰지 않는다. 내용물을 이미지·동영상·폰트·디자인 원본으로 갈라 위 자리로 넣는다.
- 런타임이 쓰는 별도 자리(예: 업로드 폴더)가 필요하면 규격에 이름을 적어 등록한다. 등록되지 않은 이름은 게이트가 걸러 낸다.

### 이름 규칙

- 폴더·파일 이름은 소문자 영문 + 하이픈으로 쓴다. 대문자·언더스코어·한글·공백은 쓰지 않는다.
- 자산 폴더는 복수형으로 고정한다 — `images` · `videos` · `decks` · `docs`.
- `Images` · `img` · `image` · `photos` 는 `public/images/` 로, `deck` · `ppt` · `slides` 는 `docs/decks/` 로 모은다.

### legacy 규칙

- 위 18자리에 들어갈 자리가 없는 것은 `legacy/` 로 옮긴다. 지우지 않는다.
- 보관성 폴더(`old` · `bak` · `backup` · `archive` · `_archive` · `tmp` · `deprecated`)는 `legacy/` 아래로 합친다.
- 옮기기 전에 참조 검사를 한다. 참조가 잡히면 옮기지 않고 목록에만 남긴다.

  ```bash
  grep -rlF --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=.next -- "옮기려는-폴더-이름" .
  ```

- 옮긴 기록은 move-log 와 되돌림 파일(`undo.json`)로 남긴다.

### 위반 확인

```bash
python D:/manhattan/fat-man/harness/tools/apps-unify.py \
  --stage skeleton,content,rename,assets,legacy --only tjedu
```

`--apply` 를 붙이지 않으면 드라이런이라 아무것도 쓰지 않는다. 출력은 골격 18자리 누락, 이름 교정 대상,
`legacy/` 로 옮길 잔여물을 단계별로 나눠 보여 준다. 기준 경로(`base_path`)와 폐지된 이름 목록도 머리말에 찍힌다.

이전에 이 자리에 있던 `apps-root-check.py` 는 루트 파일 존재 여부만 보고 골격·이름·legacy 를 판정하지 않았다.
확인했다고 말하지만 확인하지 않는 명령이라 2026-09-20 에 교체했다(반증 R2).

---

### 대답 규칙

사용자에게 답할 때 지킨다.

- 여덟 줄을 넘기지 않는다. 표·목록·빈 줄도 줄로 센다.
- 쉬운 우리말만 쓴다. 영어 낱말·전문용어를 쓰지 않는다.
- 파일 경로·명령어·도구 이름을 답에 넣지 않는다. 사용자가 실행할 명령만 예외다.
- 결론을 먼저 말한다. 한 문장에 한 가지만 담는다.
- 보고는 셋뿐이다 — 된 것, 안 된 것, 다음에 할 일.

## 프로젝트 고유

여기부터는 이 프로젝트에만 해당하는 내용이다. 위 표준 절과 충돌하는 내용은 적지 않는다.

기존 `CLAUDE.md` 에 있던 프로젝트별 내용(줄 수 13~1236으로 제각각이던 것)은 버리지 않고 이 절 아래로 그대로 옮겨 보존한다. 옮기고 나서 표준 절과 겹치는 문장만 지운다.

**덮기 전에 `CLAUDE.md.bak-pre-unify` 를 남긴다.** 이 템플릿으로 기존 `CLAUDE.md` 를 덮는 도구는
덮기 직전 원본을 같은 폴더에 `CLAUDE.md.bak-pre-unify` 로 복사해 둔다. 백업이 있는데 이 절이 비어 있으면
옮겨 담아야 할 내용을 흘린 것이므로 위반으로 본다(CONTENT-RULES.md 규칙 C7, 반증 R4).

- 스택:
- 배포:
- 주의:

<!-- 이전 CLAUDE.md 내용을 이 아래로 옮긴다 -->
