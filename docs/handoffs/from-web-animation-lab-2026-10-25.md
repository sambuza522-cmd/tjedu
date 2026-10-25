# 인계 — 유학원(TJEDU) 랜딩 시제품 (web-animation-lab → tjedu, 2026-10-25)

결론: 파일 8개를 **바이트 그대로** 이 프로젝트 `public/` 에 옮긴다. 옮긴 뒤 지문(sha256)이 하나라도 다르면 옮김 실패다. 내용은 고치지 않는다.

## 1. 무엇

- 타지키스탄 학생·학부모를 위한 한국 유학원 랜딩. 주소 tjedu.kr. 운영 (주)중앙솔루션.
- **나라 확장형**: 틀(index.html·app.js·style.css)은 나라를 모른다. 나라는 `data/<코드>.js` 한 파일, 러시아어 원고 `data/ru.js` 는 다섯 나라 공용, 회사·여섯 사이트는 `data/common.js`. 우즈벡 등은 `data/uz.js` 를 더하고 `node check-country.mjs uz` 가 통과하면 붙는다(키 집합·출처 키·글꼴 글자·색 대비까지 검사, 지금 tj = PASS 31).
- 주소: `?c=tj&l=tg`(기본) · `?c=tj&l=ru`. 키 컬러는 나라 파일의 국기색(tj = 초록 #197B30, 기본 화면에 보임).
- 랜딩: 출발판(큰 D-2 + 입학·대학·비용·단계 네 칸) → 대학(정부 IEQAS 다섯 등급) → 비용(대학 공시 값만) → 서류·비자(조건 고르면 물을 곳) → 질문(초안이 써져 메신저로) → 우리를 확인하세요 → 바닥글.

## 2. 옮길 것

묶음: `docs/handoffs/from-web-animation-lab-2026-10-25-tjedu-landing/payload/` · 지문 목록: 같은 폴더 `SHA256SUMS.txt`

| 묶음 안 → 둘 자리 | 바이트 | sha256 |
|---|---|---|
| `public/index.html` | 6420 | e3d7dcbdb8f0b719a70f1e4ce9348d64f643821bdafe8ca799d65a2c17410a93 |
| `public/app.js` | 57281 | 1746a06adf349520565c1f843dac9c877a966a0e58716aba52445c0f346acdf4 |
| `public/style.css` | 27275 | ae8fcbdb0e82b00eea4f56a26a7659f587f1c0c1c6b6c6799714aa86c5b391fd |
| `public/data/common.js` | 2375 | a08201a2510bd92651d3ede1b53a420bc3a7a67b98fa3d27a0fdfaebf2be601a |
| `public/data/ru.js` | 7988 | 893cf5cae37313cab0408f6d376245f55358826e4371a29f31f821f676ee435f |
| `public/data/tj.js` | 15997 | e87b70471b17d5348447a353971a45a93f28a492d028e6dd8b52b8f6081ee0bf |
| `public/data/README.txt` | 2495 | 6cd62ed0f5d21ea229f17a2200bed03a8b1d5b44ef80bb3dbb70b32cb4a3599f |
| `public/check-country.mjs` | 23177 | 20928a582a0c10558cecc4c6857c020d6d332ade8f9a0e19a7127015e050d0ef |

원본: `D:/manhattan/fat-man/_apps/web-animation-lab/public/labs/caedu/` (같은 지문). 파일끼리 상대 경로로만 부르므로 같은 구조로 두면 그대로 돈다. `check-country.mjs` 는 `data/` 옆에 있어야 한다(웹 화면과 무관한 검사기). `public/data/` 가 이 프로젝트 표준에 없는 이름이면 규격에 등록한다 — 옮기면 경로가 바뀐다.

## 3. 옮기고 확인하기 (PowerShell)

```powershell
$h="D:\manhattan\fat-man\_apps\tjedu\docs\handoffs\from-web-animation-lab-2026-10-25-tjedu-landing"; Copy-Item -Recurse -Force "$h\payload\public\*" "D:\manhattan\fat-man\_apps\tjedu\public\"
```

```powershell
$r="D:\manhattan\fat-man\_apps\tjedu"; Get-Content "$r\docs\handoffs\from-web-animation-lab-2026-10-25-tjedu-landing\SHA256SUMS.txt" | ForEach-Object { $h,$p = $_ -split ' \*',2; $a=(Get-FileHash -Algorithm SHA256 (Join-Path $r $p)).Hash.ToLower(); if ($a -eq $h) { "OK   $p" } else { "DIFF $p" } }
```

```powershell
node D:\manhattan\fat-man\_apps\tjedu\public\check-country.mjs tj
```

여덟 줄 모두 `OK`, 검사기는 `RESULT PASS` 여야 한다. 그림 파일이 없어 `file://` 로도 열린다.

## 4. 바깥 의존 (버전 고정 — 바꾸면 화면이 바뀐다)

GSAP `3.13.0`(jsDelivr, gsap.min.js · ScrollTrigger.min.js) · Google Fonts(IBM Plex Sans · Geist Mono · IBM Plex Sans KR — 한글은 회사 이름·주소 글자만 `text=` 로 받는다). 글꼴 목록은 나라 파일이 정한다.

## 5. 되돌리지 말 것 — 사용자 결정 (원문)

| 결정 | 사용자 말 |
|---|---|
| 중앙아시아 나라 확장형, 타지키스탄부터 | 「유학원은 중아 다른 국가로 확장할 수 있게 만들어야 해. 완벽하게」「타지부터 제대로 만들어」 |
| 나라마다 그 나라 말 + 러시아어, 색도 나라 국기색 | 「다른 나라들은 그 나라 언어로? 색도 나라마다 정해야 하는 거 아니야?」 |
| 키 컬러가 첫 화면에 보임 · 아이콘 직접 그린 SVG · 무료 문구 0 · 1920 전체 폭 · 햄버거 | 이웃 사이트에서 정한 것을 그대로 따름(「금색 쓰기로 햇잖아 왜 검정이야?」「이모지 같은 것은 내장 쓰면 안되고」「무료를 굳이 넣지마」) |
| 바닥글 「운영: (주)중앙솔루션」 + 실제 회사 정보 + 여섯 사이트 | 「(주)중앙솔루션이 운영하는 거야」 · 사업자등록번호 456-88-02999·주소·+82 2-6403-1588·이메일 · 「cabridge.kr, vatan.kr, helpers.co.kr, ca.saasmate.dev(데이터허브주소), martinmart.co.kr(마트인마트) 까지 넣어」 |
| 사실은 출처 있는 값만(대학 등급 = 교육부·법무부 IEQAS 2026-02-12), 비용 숫자는 지어내지 않음 | 「어느 정부?」 확인 |

## 6. 남은 것

- 메신저 계정(텔레그램·왓츠앱) 미정 — 질문 보내기는 지금 공유 링크로 열린다.
- 타지크어 문안은 모어 검수 전. 비용 값·유학원 등록(교육부 코드)·대표자 이름은 출처가 없어 「공개 전」으로 남아 있다.
- 바닥글의 바탄·헬퍼스 링크는 이 프로젝트 로컬(localhost·file)에서 랩 경로로 바뀌어 안 열리는 것이 정상이다.
- 설계 정본: `D:/manhattan/fat-man/_workspace/tj-three-sites/2026-10-24/sites/tjedu.md`
