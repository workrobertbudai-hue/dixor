import { fetchLiveJobs } from '../work/livejobs.js';
import JOBS_MOCK from '../data/jobs.json';
import VOCAB from '../data/vocab.json';

function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function dayKey(ms){var x=new Date(ms);return x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0');}

var KIND_META = {
  ENTER_FIRST:   ['FIRST ENTRY',        '#ffffff'],
  LEARN_SESSION: ['LEARNING SESSION',   '#9d8cff'],
  JOB_TRACKED:   ['APPLICATION TRACKED','#57e6d9'],
  SKILL_FOUND:   ['SKILL DISCOVERED',   '#7fe3b2'],
  RADAR_ON:      ['RADAR ACTIVATED',    '#ffd479'],
  INTERVIEW_PRAC:['INTERVIEW PRACTICE', '#7aa2ff'],
  CAREER_STEP:   ['CAREER STEP',        '#ffd479'],
  CHAT_JOINED:   ['COMMUNITY VOICE',    '#6fc9ff'],
  DISCOVERY:     ['DISCOVERY SAVED',    '#c9d1e0'],
  CREATION:      ['CREATION MADE',      '#ff9e9e'],
  APPLICATION:   ['ORIGINAL OPENED',    '#57e6d9'],
  CHAT:          ['MESSAGE SENT',       '#6fc9ff']
};

export class TimelineView {
  constructor(opts) {
    this.stateStore = opts.stateStore;

    this.el = document.createElement('aside');
    this.el.className = 'dx-jobs dx-timeline';
    this.el.style.display = 'none';
    document.body.appendChild(this.el);

    var wrap = document.createElement('div');
    wrap.className = 'dx-tlbtn';
    var b = document.createElement('button');
    b.innerHTML = '&#128214;';
    b.title = 'Your Timeline';
    var self = this;
    b.addEventListener('click', function(){ self.open(); });
    wrap.appendChild(b);
    document.body.appendChild(wrap);

    document.addEventListener('keydown', function(e){
      if (!self.isOpen) return;
      if (e.key === 'Escape') { e.stopPropagation(); self.close(); }
    }, true);
  }

  get isOpen() { return this.el.classList.contains('is-open'); }

  open() { this.render(); this.el.style.display = ''; requestAnimationFrame(function(){ /* noop */ }); this.el.classList.add('is-open'); }
  close() {
    var self = this;
    this.el.classList.remove('is-open');
    setTimeout(function(){ if (!self.isOpen) self.el.style.display = 'none'; }, 260);
  }

  async collect() {
    var st = this.stateStore;
    var items = [];

    st.getKV('constellation', []).forEach(function(c){
      items.push({ at: c.at, kind: c.t, label: '' });
    });

    var liveTitles = null;
    try {
      var lj = await fetchLiveJobs();
      if (lj) {
        liveTitles = {};
        lj.jobs.forEach(function(j){ liveTitles[j.id] = j.title; });
      }
    } catch(e) {}

    st.getApplications().forEach(function(a){
      var t = 'Opportunity';
      var mock = JOBS_MOCK.jobs.find(function(j){ return j.id === a.id; });
      if (mock) t = mock.title;
      else if (liveTitles && liveTitles[a.id]) t = liveTitles[a.id];
      items.push({ at: a.at || Date.now(), kind: 'APPLICATION', label: t });
    });

    Object.keys(st.getKV('chatLog', {})).forEach(function(tid){
      st.getChatLog(tid).forEach(function(m){
        items.push({ at: m.at, kind: 'CHAT', label: m.text });
      });
    });

    st.getKV('discoveryJournal', []).forEach(function(d){
      items.push({ at: d.at, kind: 'DISCOVERY', label: d.q });
    });

    items.sort(function(a,b){ return b.at - a.at; });
    return items.slice(0, 120);
  }

  async render() {
    var self = this;
    this.el.innerHTML =
      '<header class="dx-jobs__head">' +
        '<div><span class="dx-jobs__chip">PERSONAL &#183; TEMPORAL</span>' +
        '<h2 class="dx-jobs__title">YOUR JOURNEY</h2></div>' +
        '<button class="dx-jobs__close">&#10005;</button>' +
      '</header>' +
      '<div class="dx-apps__empty">WEAVING YOUR TIMELINE&#8230;</div>';
    this.el.querySelector('.dx-jobs__close').addEventListener('click', function(){ self.close(); });

    var items = await this.collect();

    var since = this.stateStore.memberSince();
    var days = since ? Math.max(1, Math.floor((Date.now()-since)/86400000)+1) : 1;
    var stars = items.filter(function(i){ return KIND_META[i.kind] && i.kind!=='CHAT' && i.kind!=='APPLICATION'; }).length;
    var lp = this.stateStore.getLearnProgress();
    var words = 0;
    VOCAB.languages.forEach(function(L){ words += (lp[L.id] && lp[L.id].known.length) || 0; });
    var apps = this.stateStore.getApplications().length;

    var groups = [];
    var curDay = null;
    items.forEach(function(it){
      var k = dayKey(it.at);
      if (k !== curDay){ curDay = k; groups.push({ day: k, items: [] }); }
      groups[groups.length-1].items.push(it);
    });

    var todayK = dayKey(Date.now());
    var yestK = dayKey(Date.now() - 86400000);

    var html = groups.map(function(g){
      var label = g.day===todayK ? 'TODAY' : (g.day===yestK ? 'YESTERDAY' :
        new Date(g.day).toLocaleDateString('en-GB',{day:'2-digit',month:'short'}).toUpperCase());
      var rows = g.items.map(function(it){
        var meta = KIND_META[it.kind] || ['EVENT','#c9d1e0'];
        var time = new Date(it.at).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});
        return '<li style="--c:'+meta[1]+'"><b>'+time+'</b><span><i>'+meta[0]+'</i>'+
               (it.label ? ' &#183; '+esc(it.label) : '')+'</span></li>';
      }).join('');
      return '<div class="dx-tlg"><h4>'+label+' &#183; '+g.items.length+'</h4><ul class="dx-tl">'+rows+'</ul></div>';
    }).join('');

    this.el.innerHTML =
      '<header class="dx-jobs__head">' +
        '<div><span class="dx-jobs__chip">PERSONAL &#183; TEMPORAL</span>' +
        '<h2 class="dx-jobs__title">YOUR JOURNEY</h2></div>' +
        '<button class="dx-jobs__close">&#10005;</button>' +
      '</header>' +
      '<div class="dx-jobs__meta">'+days+' DAYS ON YOUR JOURNEY &#183; '+stars+' STARS &#183; '+words+' WORDS &#183; '+apps+' TRACKED</div>' +
      '<div class="dx-timeline__scroll">'+
        (html || '<div class="dx-apps__empty">YOUR STORY STARTS NOW - EXPLORE AND ACT.</div>')+
      '</div>'+
      '<footer class="dx-apps__note">NOT WHAT HAPPENED - HOW YOU GOT HERE (&#167;10)</footer>';

    this.el.querySelector('.dx-jobs__close').addEventListener('click', function(){ self.close(); });
  }
}