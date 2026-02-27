# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A framework-less web app for Cookie Run: Kingdom coupon code redemption. Built with vanilla HTML, CSS, and JavaScript — no build tools, no bundler, no package manager.

## Running the App

The preview server uses Python's built-in HTTP server (configured in `.idx/dev.nix`):

```bash
python3 -m http.server 3000 --bind 0.0.0.0
```

Open `index.html` directly in a browser, or use the Firebase Studio preview panel. There is no build step.

## Architecture

Three files, each with a distinct role:

- **`index.html`** — Entry point. Uses `<coupon-form>` as a custom element tag; the component is registered in `main.js`.
- **`main.js`** — Defines the `CouponForm` Web Component class with Shadow DOM. All component HTML structure and scoped CSS live inside the shadow root string. Event listeners are attached/removed via `connectedCallback`/`disconnectedCallback`.
- **`style.css`** — Global styles only (body, header, `coupon-form` host element). Component-internal styles are in `main.js`'s shadow root.
- **`blueprint.md`** — Living design document. Update it whenever features or design decisions change; it is the source of truth for current app state.

## Key Conventions

- **Web Components with Shadow DOM** are the pattern for all UI components. Styles scoped to a component go inside the `attachShadow` template string in `main.js`, not in `style.css`.
- **No external frameworks or npm.** For third-party libraries, use CDN links with SRI hashes. If a `package.json` is added, run `npm install` after modifying it.
- **ES Modules** are preferred for splitting JavaScript across multiple files.
- **Korean (`ko`)** is the page language (`<html lang="ko">`); user-facing strings are in Korean.
- **`blueprint.md`** must be updated before or alongside any feature change to reflect the new plan and current state.

## Firebase Integration

Firebase MCP is pre-configured in `.idx/mcp.json` via `firebase-tools` npx. To add Firebase SDKs to the app, include them from the CDN and initialize with a config object in `main.js`.
