# 쿠키런: 킹덤 멀티 계정 쿠폰 매니저

여러 DevPlay 계정에 쿠키런: 킹덤 쿠폰을 한 번에 적용할 수 있는 웹 애플리케이션입니다.

## 배포 URL

- **서비스**: https://ckc.keemsir.workers.dev/
- **Cloudflare 대시보드**: https://dash.cloudflare.com/

## 쿠폰 등록 방법 (관리자)

쿠폰 목록은 GitHub Gist로 관리합니다. 코드 수정 없이 Gist만 편집하면 모든 사용자에게 자동 반영됩니다.

**Gist URL**: https://gist.github.com/keemsir/a4671382e9e80502da3a658f104a8dd4

### 쿠폰 추가/수정 방법

1. 위 Gist 링크 접속
2. 오른쪽 상단 **Edit** 버튼 클릭
3. 아래 JSON 형식으로 쿠폰 추가/수정:

```json
[
  { "code": "SPRING2026", "validFrom": "2026-02-01", "validTo": "2026-03-31" },
  { "code": "EASTER2026", "validFrom": "2026-03-01", "validTo": "2026-04-01" }
]
```

| 필드 | 설명 | 예시 |
|------|------|------|
| `code` | 쿠폰 코드 (대문자) | `"SPRING2026"` |
| `validFrom` | 유효기간 시작 (생략 가능) | `"2026-02-01"` |
| `validTo` | 유효기간 종료 (생략 가능) | `"2026-03-31"` |

4. **Update public gist** 클릭
5. 앱에서 페이지 새로고침 or ↻ 버튼 → 즉시 반영

> `validTo`가 오늘 이전이면 앱에서 자동으로 **만료** 표시됩니다.

## 기술 스택

- **HTML / CSS / JavaScript** — 프레임워크 없는 순수 웹 표준
- **Web Components (Shadow DOM)** — `AccountManager`, `CouponList`, `ApplyPanel`
- **Cloudflare Turnstile** — CAPTCHA
- **GitHub Gist** — 쿠폰 목록 원격 관리

## 로컬 실행

```bash
python3 -m http.server 3000 --bind 0.0.0.0
```

`http://localhost:3000` 접속. 로컬 테스트 시 `main.js`의 `TURNSTILE_SITE_KEY`를 테스트 키로 교체:

```js
const TURNSTILE_SITE_KEY = '1x00000000000000000000AA';
```

## 파일 구조

```
├── index.html     # 진입점
├── main.js        # Web Components + TURNSTILE_SITE_KEY, COUPON_LIST_URL 상수
├── style.css      # 전역 스타일
└── blueprint.md   # 설계 문서
```
