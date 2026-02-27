// ── Turnstile site key ──────────────────────────────────────────────────────
// 실제 배포 키: DevPlay 쿠폰 페이지에서 추출한 키
// localhost 테스트 시에는 아래 테스트 키로 교체 (항상 통과, 실제 토큰 발급):
//   const TURNSTILE_SITE_KEY = '1x00000000000000000000AA';
const TURNSTILE_SITE_KEY = '1x00000000000000000000AA';

// ── 쿠폰 목록 URL ────────────────────────────────────────────────────────────
// 관리자가 관리하는 JSON URL. 여기만 수정하면 모든 사용자에게 자동 반영됩니다.
// 형식: [{ "code": "SPRING2026", "validFrom": "2026-02-01", "validTo": "2026-03-31" }, ...]
const COUPON_LIST_URL = 'https://gist.githubusercontent.com/keemsir/a4671382e9e80502da3a658f104a8dd4/raw/ckc_code_update.txt';

// ── Storage helpers ─────────────────────────────────────────────────────────
const Storage = {
    getAccounts() {
        try { return JSON.parse(localStorage.getItem('ckk_accounts') || '[]'); }
        catch { return []; }
    },
    saveAccounts(list) {
        localStorage.setItem('ckk_accounts', JSON.stringify(list));
    },
};

// ── Account type detection ──────────────────────────────────────────────────
function detectAccountType(id) {
    if (/^GUEST-[A-Z]{5}[0-9]{5}$/.test(id)) return 'guest';
    if (/^[A-Z]{5}[0-9]{4}$/.test(id)) return 'mid';
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(id)) return 'email';
    return null;
}

// ── <account-manager> ───────────────────────────────────────────────────────
class AccountManager extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._accounts = Storage.getAccounts();
        this._render();
    }

    connectedCallback() {
        this._bindEvents();
    }

    disconnectedCallback() {
        // Event listeners are on shadow DOM nodes; they GC automatically
    }

    _render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host { display: block; }
                h3 { margin: 0 0 1rem; font-size: 1.1rem; color: #5d4037; }
                .card { background: #fff; border-radius: 12px; padding: 1.2rem;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.12); height: 100%; box-sizing: border-box; }
                .add-row { display: flex; gap: 0.5rem; margin-bottom: 1rem; flex-wrap: wrap; }
                .add-row input { flex: 1; min-width: 80px; padding: 0.5rem 0.7rem;
                    border: 2px solid #ddd; border-radius: 8px; font-family: 'Jua', sans-serif;
                    font-size: 0.9rem; transition: border-color 0.2s; }
                .add-row input:focus { border-color: #ffc107; outline: none; }
                .add-row button { padding: 0.5rem 1rem; background: #ff7043; color: #fff;
                    border: none; border-radius: 8px; font-family: 'Jua', sans-serif;
                    font-size: 0.9rem; cursor: pointer; transition: background 0.2s; white-space: nowrap; }
                .add-row button:hover { background: #ff5722; }
                .error { color: #c62828; font-size: 0.85rem; margin-bottom: 0.5rem; min-height: 1.1rem; }
                .account-list { display: flex; flex-direction: column; gap: 0.5rem; }
                .account-item { display: flex; align-items: center; gap: 0.5rem; padding: 0.6rem 0.8rem;
                    background: #fafafa; border-radius: 8px; border: 1px solid #eee; }
                .account-item input[type="checkbox"] { accent-color: #ff7043; width: 16px; height: 16px; cursor: pointer; }
                .account-label { flex: 1; font-size: 0.95rem; }
                .account-id { font-size: 0.8rem; color: #888; }
                .badge { font-size: 0.7rem; padding: 0.15rem 0.45rem; border-radius: 99px;
                    font-weight: bold; text-transform: uppercase; }
                .badge-mid { background: #fff3e0; color: #e65100; }
                .badge-email { background: #e3f2fd; color: #1565c0; }
                .badge-guest { background: #f3e5f5; color: #6a1b9a; }
                .delete-btn { background: none; border: none; cursor: pointer; color: #bbb;
                    font-size: 1.1rem; padding: 0 0.2rem; transition: color 0.2s; }
                .delete-btn:hover { color: #c62828; }
                .empty { color: #aaa; font-size: 0.9rem; text-align: center; padding: 1rem 0; }
            </style>
            <div class="card">
                <h3>계정 관리</h3>
                <div class="add-row">
                    <input type="text" id="inp-label" placeholder="별명 (예: 본계)" />
                    <input type="text" id="inp-id" placeholder="MID / 이메일 / GUEST-MID" />
                    <button id="btn-add">추가</button>
                </div>
                <div class="error" id="err-msg"></div>
                <div class="account-list" id="list"></div>
            </div>
        `;
        this._updateList();
    }

    _bindEvents() {
        this.shadowRoot.querySelector('#btn-add').addEventListener('click', () => this._addAccount());
        this.shadowRoot.querySelector('#inp-id').addEventListener('keydown', e => {
            if (e.key === 'Enter') this._addAccount();
        });
    }

    _addAccount() {
        const label = this.shadowRoot.querySelector('#inp-label').value.trim();
        const id = this.shadowRoot.querySelector('#inp-id').value.trim().toUpperCase();
        const errEl = this.shadowRoot.querySelector('#err-msg');

        if (!id) { errEl.textContent = 'ID를 입력해주세요.'; return; }

        const type = detectAccountType(id);
        if (!type) {
            errEl.textContent = '올바른 MID (ABCDE1234), 이메일, 또는 GUEST-MID 형식이어야 합니다.';
            return;
        }

        if (this._accounts.find(a => a.id === id)) {
            errEl.textContent = '이미 등록된 계정입니다.';
            return;
        }

        errEl.textContent = '';
        this._accounts.push({ id, type, label: label || id });
        Storage.saveAccounts(this._accounts);
        this.shadowRoot.querySelector('#inp-label').value = '';
        this.shadowRoot.querySelector('#inp-id').value = '';
        this._updateList();
        this._dispatchChange();
    }

    _deleteAccount(id) {
        this._accounts = this._accounts.filter(a => a.id !== id);
        Storage.saveAccounts(this._accounts);
        this._updateList();
        this._dispatchChange();
    }

    _updateList() {
        const list = this.shadowRoot.querySelector('#list');
        if (!list) return;
        if (this._accounts.length === 0) {
            list.innerHTML = '<div class="empty">저장된 계정이 없습니다.</div>';
            return;
        }
        list.innerHTML = this._accounts.map(acc => `
            <div class="account-item" data-id="${acc.id}">
                <input type="checkbox" class="acc-check" data-id="${acc.id}" />
                <span class="account-label">${this._esc(acc.label)}</span>
                <span class="account-id">${this._esc(acc.id)}</span>
                <span class="badge badge-${acc.type}">${acc.type}</span>
                <button class="delete-btn" data-id="${acc.id}" title="삭제">✕</button>
            </div>
        `).join('');

        list.querySelectorAll('.acc-check').forEach(cb => {
            cb.addEventListener('change', () => this._dispatchChange());
        });
        list.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', e => this._deleteAccount(e.currentTarget.dataset.id));
        });
    }

    _dispatchChange() {
        const checked = Array.from(this.shadowRoot.querySelectorAll('.acc-check:checked'))
            .map(cb => this._accounts.find(a => a.id === cb.dataset.id))
            .filter(Boolean);
        this.dispatchEvent(new CustomEvent('accounts-changed', {
            detail: { selected: checked }, bubbles: true, composed: true
        }));
    }

    _esc(str) {
        return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }
}

// ── <coupon-list> ────────────────────────────────────────────────────────────
// Coupons are fetched from a remote JSON URL (server-managed).
// Expected JSON format:
// [{ "code": "SPRING2026", "validFrom": "2026-02-01", "validTo": "2026-03-01" }, ...]
class CouponList extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._coupons = [];
        this._selected = null;
        this._render();
    }

    connectedCallback() {
        this._bindEvents();
        this._fetch();
    }

    _render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host { display: block; }
                .card { background: #fff; border-radius: 12px; padding: 1.2rem;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.12); height: 100%; box-sizing: border-box; }
                .card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.8rem; }
                h3 { margin: 0; font-size: 1.1rem; color: #5d4037; }
                .refresh-btn { background: none; border: none; cursor: pointer; font-size: 1rem;
                    color: #aaa; padding: 0.2rem 0.4rem; border-radius: 6px; transition: color 0.2s; }
                .refresh-btn:hover { color: #ff7043; }
                .refresh-btn:disabled { opacity: 0.4; cursor: not-allowed; }
                .status { font-size: 0.8rem; color: #888; margin-bottom: 0.8rem; min-height: 1rem; }
                .status.err { color: #c62828; }
                .coupon-list { display: flex; flex-direction: column; gap: 0.5rem; }
                .coupon-item { display: flex; align-items: center; gap: 0.5rem; padding: 0.6rem 0.8rem;
                    background: #fafafa; border-radius: 8px; border: 2px solid transparent;
                    cursor: pointer; transition: border-color 0.2s, background 0.2s; }
                .coupon-item:hover:not(.expired) { background: #fff8e1; }
                .coupon-item.selected { border-color: #ffc107; background: #fffde7; }
                .coupon-item.expired { opacity: 0.4; cursor: default; }
                .coupon-code { flex: 1; font-size: 0.95rem; font-weight: bold; letter-spacing: 0.04em; }
                .coupon-dates { font-size: 0.75rem; color: #888; }
                .badge { font-size: 0.7rem; padding: 0.15rem 0.45rem; border-radius: 99px; font-weight: bold; }
                .badge-valid { background: #e8f5e9; color: #2e7d32; }
                .badge-expired { background: #ffebee; color: #c62828; }
                .empty { color: #aaa; font-size: 0.9rem; text-align: center; padding: 1.5rem 0; }
            </style>
            <div class="card">
                <div class="card-header">
                    <h3>쿠폰 목록</h3>
                    <button class="refresh-btn" id="btn-refresh" title="새로고침">↻</button>
                </div>
                <div class="status" id="status">불러오는 중…</div>
                <div class="coupon-list" id="list"></div>
            </div>
        `;
    }

    _bindEvents() {
        this.shadowRoot.querySelector('#btn-refresh').addEventListener('click', () => this._fetch());
    }

    async _fetch() {
        const btn = this.shadowRoot.querySelector('#btn-refresh');
        const status = this.shadowRoot.querySelector('#status');
        if (btn) btn.disabled = true;
        status.className = 'status';
        status.textContent = '불러오는 중…';

        if (!COUPON_LIST_URL || COUPON_LIST_URL === 'YOUR_COUPON_JSON_URL_HERE') {
            status.className = 'status err';
            status.textContent = 'main.js의 COUPON_LIST_URL을 설정해주세요.';
            if (btn) btn.disabled = false;
            return;
        }

        try {
            const resp = await fetch(COUPON_LIST_URL);
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const data = await resp.json();
            if (!Array.isArray(data)) throw new Error('JSON 배열 형식이 아닙니다');
            this._coupons = data;
            status.textContent = `${data.length}개 쿠폰`;
        } catch (err) {
            this._coupons = [];
            status.className = 'status err';
            status.textContent = `로드 실패: ${err.message}`;
        }

        if (btn) btn.disabled = false;
        this._selected = null;
        this._dispatchSelect(null);
        this._updateList();
    }

    _selectCoupon(code) {
        const coupon = this._coupons.find(c => c.code === code);
        if (!coupon || this._isExpired(coupon)) return;
        this._selected = (this._selected === code) ? null : code;
        this._updateList();
        this._dispatchSelect(this._selected ? coupon : null);
    }

    _isExpired(coupon) {
        if (!coupon.validTo) return false;
        return new Date(coupon.validTo) < new Date(new Date().toDateString());
    }

    _updateList() {
        const list = this.shadowRoot.querySelector('#list');
        if (!list) return;
        if (this._coupons.length === 0) {
            list.innerHTML = '<div class="empty">쿠폰이 없습니다.</div>';
            return;
        }
        list.innerHTML = this._coupons.map(c => {
            const expired = this._isExpired(c);
            const sel = this._selected === c.code;
            return `
                <div class="coupon-item ${expired ? 'expired' : ''} ${sel ? 'selected' : ''}" data-code="${this._esc(c.code)}">
                    <span class="coupon-code">${this._esc(c.code)}</span>
                    <span class="coupon-dates">${c.validFrom || '—'} ~ ${c.validTo || '—'}</span>
                    <span class="badge ${expired ? 'badge-expired' : 'badge-valid'}">${expired ? '만료' : '유효'}</span>
                </div>
            `;
        }).join('');

        list.querySelectorAll('.coupon-item').forEach(el => {
            el.addEventListener('click', () => this._selectCoupon(el.dataset.code));
        });
    }

    _dispatchSelect(coupon) {
        this.dispatchEvent(new CustomEvent('coupon-selected', {
            detail: { coupon }, bubbles: true, composed: true
        }));
    }

    _esc(str) {
        return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }
}

// ── <apply-panel> ────────────────────────────────────────────────────────────
class ApplyPanel extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._selectedAccounts = [];
        this._selectedCoupon = null;
        this._running = false;
        this._render();
    }

    connectedCallback() {
        document.addEventListener('accounts-changed', e => {
            this._selectedAccounts = e.detail.selected;
            this._updateSummary();
        });
        document.addEventListener('coupon-selected', e => {
            this._selectedCoupon = e.detail.coupon;
            this._updateSummary();
        });
        this.shadowRoot.querySelector('#btn-apply').addEventListener('click', () => this._apply());
        this._mountTurnstile();
    }

    _render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host { display: block; }
                .card { background: #fff; border-radius: 12px; padding: 1.5rem;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.12); }
                h3 { margin: 0 0 1rem; font-size: 1.1rem; color: #5d4037; }
                .summary { display: flex; gap: 1.5rem; flex-wrap: wrap; margin-bottom: 1.2rem;
                    padding: 0.8rem 1rem; background: #fafafa; border-radius: 8px; border: 1px solid #eee; }
                .summary-item { font-size: 0.9rem; }
                .summary-item span { font-weight: bold; color: #e65100; }
                .turnstile-wrap { margin-bottom: 1rem; min-height: 65px; }
                button#btn-apply { padding: 0.8rem 2.5rem; background: #ff7043; color: #fff;
                    border: none; border-radius: 8px; font-family: 'Jua', sans-serif;
                    font-size: 1.1rem; cursor: pointer; transition: background 0.2s, opacity 0.2s;
                    box-shadow: 0 3px 8px rgba(0,0,0,0.15); }
                button#btn-apply:hover:not(:disabled) { background: #ff5722; }
                button#btn-apply:disabled { opacity: 0.5; cursor: not-allowed; }
                .results { margin-top: 1.5rem; }
                table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
                th { background: #ffc107; color: #fff; padding: 0.5rem 0.8rem; text-align: left; }
                td { padding: 0.5rem 0.8rem; border-bottom: 1px solid #eee; }
                tr:last-child td { border-bottom: none; }
                .ok { color: #2e7d32; font-weight: bold; }
                .fail { color: #c62828; font-weight: bold; }
                .pending { color: #888; }
                .progress { font-size: 0.85rem; color: #888; margin-top: 0.5rem; }
            </style>
            <div class="card">
                <h3>쿠폰 적용</h3>
                <div class="summary" id="summary">
                    <div class="summary-item">선택된 계정: <span id="s-accounts">0개</span></div>
                    <div class="summary-item">선택된 쿠폰: <span id="s-coupon">없음</span></div>
                </div>
                <div class="turnstile-wrap">
                    <slot name="turnstile"></slot>
                </div>
                <button id="btn-apply" disabled>쿠폰 적용하기</button>
                <div class="progress" id="progress"></div>
                <div class="results" id="results"></div>
            </div>
        `;
    }

    _mountTurnstile() {
        // Turnstile은 Shadow DOM 내부에서 동작하지 않으므로
        // light DOM에 컨테이너를 만들고 slot으로 투영합니다.
        const container = document.createElement('div');
        container.slot = 'turnstile';
        this.appendChild(container);

        const deadline = Date.now() + 8000;
        const tryMount = () => {
            if (window.turnstile) {
                window.turnstile.render(container, {
                    sitekey: TURNSTILE_SITE_KEY,
                    callback: token => { window.turnstileToken = token; },
                    'expired-callback': () => { window.turnstileToken = null; },
                });
            } else if (Date.now() < deadline) {
                setTimeout(tryMount, 500);
            } else {
                container.innerHTML = '<p style="font-size:0.8rem;color:#c62828;">Turnstile 위젯 로드 실패. 인터넷 연결을 확인하세요.</p>';
            }
        };
        tryMount();
    }

    _updateSummary() {
        const sAccounts = this.shadowRoot.querySelector('#s-accounts');
        const sCoupon = this.shadowRoot.querySelector('#s-coupon');
        const btn = this.shadowRoot.querySelector('#btn-apply');
        if (sAccounts) sAccounts.textContent = `${this._selectedAccounts.length}개`;
        if (sCoupon) sCoupon.textContent = this._selectedCoupon ? this._selectedCoupon.code : '없음';
        if (btn) btn.disabled = this._running || !this._selectedCoupon || this._selectedAccounts.length === 0;
    }

    async _apply() {
        if (this._running) return;
        if (!this._selectedCoupon || this._selectedAccounts.length === 0) return;

        this._running = true;
        this._updateSummary();

        const results = this.shadowRoot.querySelector('#results');
        const progress = this.shadowRoot.querySelector('#progress');

        results.innerHTML = `
            <table>
                <thead><tr><th>계정</th><th>결과</th><th>메시지</th></tr></thead>
                <tbody id="result-body"></tbody>
            </table>
        `;
        const tbody = this.shadowRoot.querySelector('#result-body');

        for (let i = 0; i < this._selectedAccounts.length; i++) {
            const acc = this._selectedAccounts[i];
            progress.textContent = `처리 중… ${i + 1} / ${this._selectedAccounts.length}`;

            // Add pending row
            const rowId = `row-${i}`;
            tbody.insertAdjacentHTML('beforeend', `
                <tr id="${rowId}">
                    <td>${this._esc(acc.label)} (${this._esc(acc.id)})</td>
                    <td class="pending">대기 중…</td>
                    <td></td>
                </tr>
            `);

            // Wait for Turnstile token
            const token = await this._waitForToken();
            if (!token) {
                this._updateRow(rowId, false, 'CAPTCHA 토큰을 가져오지 못했습니다.');
                continue;
            }

            const body = {
                game_code: 'ck',
                coupon_code: this._selectedCoupon.code,
                token,
            };
            if (acc.type === 'email') {
                body.email = acc.id;
            } else {
                body.mid = acc.id;
            }

            let ok = false;
            let msg = '';
            try {
                const resp = await fetch('https://coupon.devplay.com/v1/coupon/ck', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body),
                });
                const data = await resp.json().catch(() => ({}));
                ok = resp.ok;
                msg = data.message || data.msg || (ok ? '성공' : `오류 ${resp.status}`);
            } catch (err) {
                msg = err.message || '네트워크 오류';
            }

            this._updateRow(rowId, ok, msg);
            window.turnstileToken = null;

            if (i < this._selectedAccounts.length - 1) {
                // Reset Turnstile and wait for next token before proceeding
                if (window.turnstile) window.turnstile.reset();
                await new Promise(r => setTimeout(r, 500));
            }
        }

        progress.textContent = '완료!';
        this._running = false;
        this._updateSummary();
    }

    _waitForToken(maxWait = 30000) {
        return new Promise(resolve => {
            if (window.turnstileToken) { resolve(window.turnstileToken); return; }
            const start = Date.now();
            const poll = setInterval(() => {
                if (window.turnstileToken) {
                    clearInterval(poll);
                    resolve(window.turnstileToken);
                } else if (Date.now() - start > maxWait) {
                    clearInterval(poll);
                    resolve(null);
                }
            }, 300);
        });
    }

    _updateRow(rowId, ok, msg) {
        const row = this.shadowRoot.querySelector(`#${rowId}`);
        if (!row) return;
        const cells = row.querySelectorAll('td');
        cells[1].className = ok ? 'ok' : 'fail';
        cells[1].textContent = ok ? '성공 ✓' : '실패 ✗';
        cells[2].textContent = msg;
    }

    _esc(str) {
        return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }
}

// ── Register custom elements ─────────────────────────────────────────────────
customElements.define('account-manager', AccountManager);
customElements.define('coupon-list', CouponList);
customElements.define('apply-panel', ApplyPanel);
