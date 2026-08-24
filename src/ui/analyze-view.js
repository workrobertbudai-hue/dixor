import JOBS from '../data/jobs.json';

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * ANALYZE / COMPARE - ket lehetoseg egymas mellett (Section 31).
 * Dontestamogatas: soronkent kiemeljuk, melyik erosebb, es javaslatot teszunk.
 */
export class AnalyzeView {
  constructor() {
    this.a = JOBS.jobs[0].id;
    this.b = JOBS.jobs[1].id;

    this.el = document.createElement('aside');
    this.el.className = 'dx-jobs dx-cmp';
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

  #job(id) { return JOBS.jobs.find((j) => j.id === id); }

  #options(sel) {
    return JOBS.jobs.map((j) =>
      '<option value="' + j.id + '"' + (j.id === sel ? ' selected' : '') + '>' +
        j.title + ' - ' + j.company +
      '</option>').join('');
  }

  #row(label, va, vb, win) {
    const cell = (v, isWin) =>
      '<td class="' + (win === 0 && isWin ? 'is-win' : '') + '">' + v + '</td>';
    return '<tr><th>' + label + '</th>' + cell(va, true) + cell(vb, false) + '</tr>';
  }

  render() {
    let A = this.#job(this.a);
    let B = this.#job(this.b);
    if (!A || !B || A.id === B.id) {
      if (!A) A = JOBS.jobs[0];
      if (!B) B = JOBS.jobs[1] || JOBS.jobs[0];
    }

    const salaryNum = (s) => parseInt(String(s).replace(/[^0-9]/g, '').slice(0, 3), 10) || 0;
    const wins = { a: 0, b: 0 };

    const rows = [];
    rows.push(this.#row('MATCH SCORE', A.matchScore + '%', B.matchScore + '%',
      A.matchScore > B.matchScore ? 0 : (B.matchScore > A.matchScore ? 1 : -1)));
    rows.push(this.#row('SALARY', esc(A.salary), esc(B.salary),
      salaryNum(A.salary) > salaryNum(B.salary) ? 0 : (salaryNum(B.salary) > salaryNum(A.salary) ? 1 : -1)));
    rows.push(this.#row('LOCATION', esc(A.location), esc(B.location), -1));
    rows.push(this.#row('TYPE', esc(A.type), esc(B.type), -1));
    rows.push(this.#row('VERIFIED', A.verified ? '&#10003;' : '-', B.verified ? '&#10003;' : '-',
      A.verified !== B.verified ? (A.verified ? 0 : 1) : -1));
    rows.push(this.#row('OPEN TO POTENTIAL', A.openToPotential ? '&#10003;' : '-', B.openToPotential ? '&#10003;' : '-',
      A.openToPotential !== B.openToPotential ? (A.openToPotential ? 0 : 1) : -1));
    rows.push(this.#row('POSTED', A.postedDaysAgo + 'D AGO', B.postedDaysAgo + 'D AGO',
      A.postedDaysAgo < B.postedDaysAgo ? 0 : (B.postedDaysAgo < A.postedDaysAgo ? 1 : -1)));
    rows.push(this.#row('WHY SUMMARY',
      A.why.strongMatches + ' strong / ' + A.why.missingRequirements + ' missing',
      B.why.strongMatches + ' strong / ' + B.why.missingRequirements + ' missing',
      A.why.strongMatches > B.why.strongMatches ? 0 : (B.why.strongMatches > A.why.strongMatches ? 1 : -1)));

    const html = rows.join('');
    wins.a = (html.match(/class=""/g) || []).length; /* nem hasznalt - egyszeru szamlalas helyett: */
    const countWin = (side) => (html.match(new RegExp('<td class="is-win">', 'g')) || []).length;

    /* gyoztes szamlalas a DOM-bol biztonsagosan */
    this.el.innerHTML =
      '<header class="dx-jobs__head">' +
        '<div>' +
          '<span class="dx-jobs__chip">ANALYZE &#183; FUNCTION</span>' +
          '<h2 class="dx-jobs__title">COMPARE</h2>' +
        '</div>' +
        '<button class="dx-jobs__close" aria-label="close">&#10005;</button>' +
      '</header>' +
      '<div class="dx-cmp__pick">' +
        '<label>OPTION A<select class="dx-field" id="dx-sela">' + this.#options(A.id) + '</select></label>' +
        '<label>OPTION B<select class="dx-field" id="dx-selb">' + this.#options(B.id) + '</select></label>' +
      '</div>' +
      '<table class="dx-cmp__table"><tbody>' + html + '</tbody></table>' +
      '<div class="dx-cmp__verdict" id="dx-verdict"></div>' +
      '<footer class="dx-apps__note">DECISION SUPPORT - EXPLAINED, NOT DECIDED FOR YOU (&#167;31)</footer>';

    this.el.querySelector('.dx-jobs__close').addEventListener('click', () => this.close());

    const sela = this.el.querySelector('#dx-sela');
    const selb = this.el.querySelector('#dx-selb');
    sela.addEventListener('change', () => { this.a = sela.value; this.render(); });
    selb.addEventListener('change', () => { this.b = selb.value; this.render(); });

    /* verdikt: hany sor volt nyertes oldalon */
    const wa = [...this.el.querySelectorAll('.dx-cmp__table td')].filter((td, i) => i % 2 === 0).filter((td) => td.classList.contains('is-win')).length;
    const wb = [...this.el.querySelectorAll('.dx-cmp__table td')].filter((td, i) => i % 2 === 1).filter((td) => td.classList.contains('is-win')).length;

    const v = this.el.querySelector('#dx-verdict');
    if (wa === wb) {
      v.innerHTML = '&#9670; TOO CLOSE TO CALL - BOTH OPTIONS HAVE MERITS.';
    } else {
      const w = wa > wb ? A : B;
      v.innerHTML = '&#9670; CURRENT SIGNALS FAVOR: <b>' + esc(w.title.toUpperCase()) + '</b>';
    }
  }
}