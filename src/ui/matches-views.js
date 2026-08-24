import { computeMatches } from '../work/matching.js';

/** Kozos kartya-render az ACTIVE MATCHES es OPEN TO ME nezetekhez. */
function cardHtml(job, stateStore) {
  const delta = job.dynScore - job.matchScore;
  const deltaHtml =
    delta !== 0
      ? '<i class="dx-match__delta ' + (delta > 0 ? 'is-up' : 'is-dn') + '">' +
        (delta > 0 ? '+' : '') + delta + ' VS BASELINE</i>'
      : '';

  const applied = stateStore.hasApplied(job.id);
  const reasons = job.reasons.map((r) => '<li>' + r + '</li>').join('');

  return (
    '<article class="dx-job" data-job-id="' + job.id + '">' +
      '<div class="dx-job__head-btn dx-job__head-btn--static">' +
        '<span class="dx-job__match">' + job.dynScore + '<small>%</small></span>' +
        '<span class="dx-job__idblock">' +
          '<span class="dx-job__title">' + job.title + deltaHtml + '</span>' +
          '<span class="dx-job__company">' + job.company +
            (job.verified ? ' <i class="dx-job__verified">&#10003; VERIFIED</i>' : '') +
          '</span>' +
          '<span class="dx-job__facts">' + job.location + ' &#183; ' + job.salary + ' &#183; ' + job.type + '</span>' +
        '</span>' +
      '</div>' +
      '<div class="dx-match__reasons"><ul>' + reasons + '</ul></div>' +
      '<div class="dx-job__foot" style="padding:0 14px 12px;">' +
        '<span class="dx-job__posted">POSTED ' + job.postedDaysAgo + 'D AGO</span>' +
        '<button class="dx-job__apply" data-job-id="' + job.id + '">' + (applied ? 'APPLIED &#10003;' : 'APPLY') + '</button>' +
      '</div>' +
    '</article>'
  );
}

function bindCards(root, stateStore) {
  root.querySelectorAll('.dx-job__apply').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.jobId;
      if (!stateStore.hasApplied(id)) stateStore.addApplication(id);
      btn.textContent = 'APPLIED \u2713';
      btn.disabled = true;
      btn.classList.add('is-applied');
    });
  });
}

class MatchesPanelBase {
  constructor(stateStore) {
    this.stateStore = stateStore;

    this.el = document.createElement('aside');
    this.el.className = 'dx-jobs';
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
}

/** ACTIVE MATCHES - elo illeszkedes a sajat profil alapjan. */
export class ActiveMatchesView extends MatchesPanelBase {
  constructor(opts) { super(opts.stateStore); }

  render() {
    const jobs = computeMatches(this.stateStore);

    this.el.innerHTML =
      '<header class="dx-jobs__head">' +
        '<div>' +
          '<span class="dx-jobs__chip">WORK &#183; FUNCTION</span>' +
          '<h2 class="dx-jobs__title">ACTIVE MATCHES</h2>' +
        '</div>' +
        '<button class="dx-jobs__close" aria-label="close">&#10005;</button>' +
      '</header>' +
      '<div class="dx-jobs__meta">COMPUTED LIVE FROM YOUR DIXOR PROFILE</div>' +
      '<div class="dx-jobs__list">' +
        jobs.map((j) => cardHtml(j, this.stateStore)).join('') +
      '</div>' +
      '<footer class="dx-apps__note">TWO-SIDED MATCHING &#183; EXPLAINED, NOT HIDDEN</footer>';

    this.el.querySelector('.dx-jobs__close').addEventListener('click', () => this.close());
    bindCards(this.el, this.stateStore);
  }
}

/** OPEN TO ME - munkaadok, akik nyiltak a potenciallis jeloltekre. */
export class OpenToMeView extends MatchesPanelBase {
  constructor(opts) { super(opts.stateStore); }

  render() {
    const all = computeMatches(this.stateStore);
    const jobs = all.filter((j) => j.openToPotential);

    this.el.innerHTML =
      '<header class="dx-jobs__head">' +
        '<div>' +
          '<span class="dx-jobs__chip">WORK &#183; FUNCTION</span>' +
          '<h2 class="dx-jobs__title">OPEN TO ME</h2>' +
        '</div>' +
        '<button class="dx-jobs__close" aria-label="close">&#10005;</button>' +
      '</header>' +
      '<div class="dx-jobs__meta">' + jobs.length + ' EMPLOYERS ACCEPT NON-LINEAR PATHS</div>' +
      '<div class="dx-apps__empty" style="margin-top:12px;padding:16px;">' +
        'THESE EMPLOYERS EXPLICITLY WELCOME<br>CAREER CHANGERS AND TRANSFERABLE SKILLS.' +
      '</div>' +
      '<div class="dx-jobs__list">' +
        jobs.map((j) => cardHtml(j, this.stateStore)).join('') +
      '</div>' +
      '<footer class="dx-apps__note">POTENTIAL OVER PAPERWORK</footer>';

    this.el.querySelector('.dx-jobs__close').addEventListener('click', () => this.close());
    bindCards(this.el, this.stateStore);
  }
}