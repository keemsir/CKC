# **Project Blueprint: Cookie Run Kingdom 쿠폰 매니저**

## **Overview**

A multi-account coupon management tool for Cookie Run: Kingdom. Users can store multiple DevPlay account IDs (MID, email, or GUEST-MID), manage a list of coupons with expiry dates, and apply a selected coupon to selected accounts via the real DevPlay API.

API endpoint: `POST https://us-central1-kingdom-coupon.cloudfunctions.net/couponProxy` (Firebase Functions CORS proxy → `coupon.devplay.com/v1/coupon/ck`)
Request body: `{ mid, email, game_code: "ck", coupon_code, token }`
CAPTCHA: Cloudflare Turnstile (site key stored in `TURNSTILE_SITE_KEY` constant in `main.js`)

## **Data Structures (localStorage)**

```js
// key: 'ckk_accounts'
[{ id: 'ABCDE1234', type: 'mid', label: '본계' }, ...]

// key: 'ckk_coupons'
[{ code: 'SPRING2026', validFrom: '2026-02-01', validTo: '2026-03-01' }, ...]
```

Account type validation:
- MID: `[A-Z]{5}[0-9]{4}`
- email: standard email format
- GUEST-MID: `GUEST-[A-Z]{5}[0-9]{5}`

## **UI Layout**

```
┌─────────────────────────────┐
│           HEADER            │
├──────────────┬──────────────┤
│  계정 관리   │   쿠폰 목록  │
│  (accounts)  │  (coupons)   │
├──────────────┴──────────────┤
│      쿠폰 적용 패널          │
│  선택된 계정 + 쿠폰 + CAPTCHA│
│       결과 테이블            │
└─────────────────────────────┘
```

## **Web Components**

### `<account-manager>`
- Renders list of saved accounts with checkbox, label, type badge, delete button
- Input row: label field + ID field + Add button
- Validates MID / email / GUEST-MID format
- Dispatches `accounts-changed` custom event when selection changes
- Reads/writes `ckk_accounts` in localStorage

### `<coupon-list>`
- Renders list of coupons: code, validity period, status badge (유효/만료)
- Input row: coupon code + 유효기간 시작/종료 date inputs + Add button
- Expired coupons shown with muted style (auto-detected via current date)
- Dispatches `coupon-selected` custom event when a coupon is selected
- Reads/writes `ckk_coupons` in localStorage

### `<apply-panel>`
- Listens for `accounts-changed` and `coupon-selected` events from siblings
- Embeds Cloudflare Turnstile widget (`<div class="cf-turnstile">`)
- Apply button triggers sequential submission loop:
  1. Get token from `window.turnstileToken`
  2. POST to API for current account
  3. Show row result (성공 ✓ / 실패 ✗ + error message)
  4. Call `turnstile.reset()`, wait for new token
  5. Move to next account
- Results table: 계정 | 결과 | 메시지

## **Current Plan**

The multi-account coupon manager is fully implemented with:
1. `index.html` — Turnstile CDN script, three component tags in a 2-column + bottom-panel layout
2. `main.js` — `Storage` helpers + three Web Component classes with Shadow DOM
3. `style.css` — 2-column grid layout, card styles, result table

## **Architecture: Firebase Proxy**

브라우저에서 `coupon.devplay.com`으로 직접 POST하면 CORS 차단이 발생하므로, Firebase Functions로 서버사이드 프록시를 구성했다.

- `functions/index.js` — `couponProxy` HTTP 함수: `Access-Control-Allow-Origin: *` 헤더 추가 후 요청을 `coupon.devplay.com`으로 전달
- `firebase.json` — functions(source: `functions/`) + hosting(public: `.`) 설정
- `.firebaserc` — default project: `kingdom-coupon`
- `.github/workflows/deploy.yml` — `main` 브랜치 push 시 자동 배포 (requires `FIREBASE_TOKEN` secret)

**주의**: Firebase Functions에서 외부 URL로 outbound 요청하려면 Blaze(종량제) 플랜 필요.
