# 쿠키런: 킹덤 쿠폰 페이지

쿠키런: 킹덤 게임의 쿠폰 코드를 입력하고 사용할 수 있는 웹 애플리케이션입니다.

## 기술 스택

- **HTML / CSS / JavaScript** — 프레임워크 없는 순수 웹 표준
- **Web Components (Shadow DOM)** — `CouponForm` 컴포넌트
- **Google Fonts** — Jua 폰트

## 실행 방법

별도의 빌드 과정 없이 바로 실행할 수 있습니다.

```bash
python3 -m http.server 3000 --bind 0.0.0.0
```

브라우저에서 `http://localhost:3000` 접속

## 파일 구조

```
├── index.html     # 진입점
├── main.js        # CouponForm Web Component
├── style.css      # 전역 스타일
└── blueprint.md   # 설계 문서
```
