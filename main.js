class CouponForm extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.innerHTML = `
            <style>
                .coupon-wrapper {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }
                input[type="text"] {
                    width: 80%;
                    padding: 1rem;
                    margin-bottom: 1rem;
                    border: 2px solid #ddd;
                    border-radius: 8px;
                    font-size: 1.2rem;
                    font-family: 'Jua', sans-serif;
                    text-align: center;
                    transition: border-color 0.3s ease, box-shadow 0.3s ease;
                }
                input[type="text"]:focus {
                    border-color: #ffc107;
                    box-shadow: 0 0 8px rgba(255, 193, 7, 0.5);
                    outline: none;
                }
                button {
                    background-color: #ff7043;
                    color: white;
                    padding: 1rem 2rem;
                    border: none;
                    border-radius: 8px;
                    font-size: 1.2rem;
                    font-family: 'Jua', sans-serif;
                    cursor: pointer;
                    transition: background-color 0.3s ease, transform 0.2s ease;
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
                }
                button:hover {
                    background-color: #ff5722;
                    transform: translateY(-2px);
                }
                #result {
                    margin-top: 1.5rem;
                    font-size: 1.2rem;
                    font-weight: bold;
                }
            </style>
            <div class="coupon-wrapper">
                <form id="coupon-form">
                    <input type="text" id="coupon-code" placeholder="쿠폰 번호를 입력하세요">
                    <button type="submit">쿠폰 사용</button>
                </form>
                <p id="result"></p>
            </div>
        `;

        this._form = this.shadowRoot.querySelector('#coupon-form');
        this._input = this.shadowRoot.querySelector('#coupon-code');
        this._result = this.shadowRoot.querySelector('#result');
        this._handleSubmit = this._handleSubmit.bind(this);
    }

    connectedCallback() {
        this._form.addEventListener('submit', this._handleSubmit);
    }

    disconnectedCallback() {
        this._form.removeEventListener('submit', this._handleSubmit);
    }

    _handleSubmit(e) {
        e.preventDefault();
        const couponCode = this._input.value;
        if (couponCode.trim() === '') {
            this._result.textContent = '쿠폰 번호를 입력해주세요.';
            this._result.style.color = 'red';
        } else if (couponCode.toUpperCase() === 'TEST-COUPON') {
            this._result.textContent = '쿠폰이 성공적으로 사용되었습니다!';
            this._result.style.color = 'green';
        } else {
            this._result.textContent = '유효하지 않은 쿠폰 번호입니다.';
            this._result.style.color = 'red';
        }
    }
}

customElements.define('coupon-form', CouponForm);
