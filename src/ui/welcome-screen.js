/** WELCOME SCREEN â€” belÃ©pÃ©si Ã©lmÃ©ny: nem weboldal, hanem kÃ¶rnyezet. */
export class WelcomeScreen {
  constructor({ onEnter }) {
    this.onEnter = onEnter;

    this.el = document.createElement('div');
    this.el.className = 'dx-welcome';
    this.el.innerHTML = `
      <div class="dx-welcome__hairline dx-welcome__hairline--top"></div>
      <div class="dx-welcome__content">
        <div class="dx-welcome__kicker">INTELLIGENT INTERFACE</div>
        <h1 class="dx-welcome__title">DIXOR</h1>
        <p class="dx-welcome__sub">NAVIGATE&nbsp;&middot;&nbsp;DISCOVER&nbsp;&middot;&nbsp;UNDERSTAND&nbsp;&middot;&nbsp;ACT</p>
        <button class="dx-welcome__enter">ENTER DIXOR</button>
        <p class="dx-welcome__hint">The intelligence stays in the background &mdash; you navigate.</p>
        <div class="dx-welcome__credit">CREATED&nbsp;BY <span class="dx-credit-name">ROBERT&nbsp;BUDAI</span></div>
      </div>
      <div class="dx-welcome__hairline dx-welcome__hairline--bottom"></div>
      <div class="dx-welcome__footer">v0.1.0 &mdash; CONCEPT BUILD</div>`;
    document.body.appendChild(this.el);

    this.enterBtn = this.el.querySelector('.dx-welcome__enter');
    this.enterBtn.addEventListener('click', () => this.enter());

    window.addEventListener('keydown', (e) => {
      if (this.isOpen && e.key === 'Enter') this.enter();
    });
  }

  /** Personalization: visszatÃ©rÅ‘ lÃ¡togatÃ³nÃ¡l mÃ¡s felirat. */
  setButtonLabel(text) { this.enterBtn.textContent = text; }

  get isOpen() { return !this.el.classList.contains('is-gone'); }

  enter() {
    if (this.entering) return;
    this.entering = true;
    this.el.classList.add('is-leaving');
    this.onEnter?.();
    setTimeout(() => this.el.classList.add('is-gone'), 1000);
  }
}