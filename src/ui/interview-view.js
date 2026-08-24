import BANK from '../data/interview-questions.json';

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * INTERVIEW PREPARATION - kerdesbank + gyakorlas-kovetes (Section 27).
 * A STAR-emlekezteto es a hanyaszer-gyakoroltad szamlalo perzisztensen mukodik.
 */
export class InterviewView {
  constructor({ stateStore }) {
    this.stateStore = stateStore;
    this.cat = BANK.categories[0].id;

    this.el = document.createElement('aside');
    this.el.className = 'dx-jobs dx-interview';
    this.el.style.display = 'none';
    document.body.appendChild(this.el);

    document.addEventListener('keydown', (e) => {
      if (!this.isOpen) return;
      if (e.key === 'Escape') { e.stopPropagation(); this.close(); }
    }, true);
  }

  get isOpen() { return this.el.classList.contains('is-open'); }

  open() {
    this.render();
    this.el.style.display = '';
    requestAnimationFrame(() => this.el.classList.add('is-open'));
  }

  close() {
    this.el.classList.remove('is-open');
    setTimeout(() => { if (!this.isOpen) this.el.style.display = 'none'; }, 260);
  }

  #rec() { return this.stateStore.getKV('interviewPractice', {}); }

  render() {
    this.el.innerHTML =
      '<header class="dx-jobs__head">' +
        '<div>' +
          '<span class="dx-jobs__chip">WORK &#183; FUNCTION</span>' +
          '<h2 class="dx-jobs__title">INTERVIEW PREPARATION</h2>' +
        '</div>' +
        '<button class="dx-jobs__close" aria-label="close">&#10005;</button>' +
      '</header>' +
      '<div class="dx-star">' +
        '<span>S</span><b>Situation</b><span>T</span><b>Task</b><span>A</span><b>Action</b><span>R</span><b>Result</b>' +
      '</div>' +
      '<div class="dx-chat__layout">' +
        '<div class="dx-chat__rooms" id="dx-catlist"></div>' +
        '<div class="dx-chat__main" id="dx-qmain"></div>' +
      '</div>' +
      '<footer class="dx-apps__note">ANSWER OUT LOUD - READING IS NOT PRACTICE (&#167;27)</footer>';

    this.el.querySelector('.dx-jobs__close').addEventListener('click', () => this.close());
    this.#renderCats();
    this.#renderQs();
  }

  #renderCats() {
    const list = this.el.querySelector('#dx-catlist');
    const rec = this.#rec();

    list.innerHTML =
      '<div class="dx-chat__sechead">QUESTION BANK</div>' +
      BANK.categories.map((c) => {
        const total = c.questions.length;
        const touched = c.questions.filter((q) => rec[q.id] && rec[q.id].times > 0).length;
        const pct = Math.round((touched / total) * 100);
        return (
          '<button class="dx-room' + (c.id === this.cat ? ' is-active' : '') + '" data-c="' + c.id + '">' +
            '<b>' + c.label + '</b>' +
            '<span>' + touched + '/' + total + ' practiced</span>' +
            '<i class="dx-iq__mini"><u style="width:' + pct + '%"></u></i>' +
          '</button>');
      }).join('');

    list.querySelectorAll('.dx-room').forEach((b) =>
      b.addEventListener('click', () => { this.cat = b.dataset.c; this.render(); }));
  }

  #renderQs() {
    const main = this.el.querySelector('#dx-qmain');
    const cat = BANK.categories.find((c) => c.id === this.cat);
    const rec = this.#rec();

    const rows = cat.questions.map((q) => {
      const r = rec[q.id] || { times: 0 };
      return (
        '<div class="dx-iq">' +
          '<p>' + esc(q.q) + '</p>' +
          '<span class="dx-iq__hint">&#9755; ' + esc(q.hint) + '</span>' +
          '<div class="dx-iq__row">' +
            '<em>' + (r.times ? 'PRACTICED x' + r.times : 'NOT PRACTICED YET') + '</em>' +
            '<button class="dx-btn" data-practice="' + q.id + '">' +
              (r.times ? 'AGAIN' : 'MARK PRACTICED') + '</button>' +
          '</div>' +
        '</div>');
    }).join('');

    main.innerHTML =
      '<div class="dx-chat__roomhead">' +
        '<b>' + cat.label + '</b>' +
        '<span>' + cat.questions.length + ' QUESTIONS</span>' +
      '</div>' +
      '<div class="dx-chat__stream" id="dx-qstream">' + rows + '</div>';

    main.querySelectorAll('[data-practice]').forEach((b) =>
      b.addEventListener('click', () => {
        const store = this.#rec();
        const cur = store[b.dataset.practice] || { times: 0 };
        cur.times += 1;
        cur.last = Date.now();
        store[b.dataset.practice] = cur;
        this.stateStore.setKV('interviewPractice', store);
        this.render();
      }));

    main.scrollTop = 0;
  }
}