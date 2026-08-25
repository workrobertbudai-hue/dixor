import Parser from 'rss-parser';
import { JobsStore } from './jobs-store.mjs';

const parser = new Parser({ timeout: 15000 });

/* angol nyelvu + europai fokuszu ingyenes feedek */
const FEEDS = [
  'https://weworkremotely.com/categories/remote-customer-support-jobs.rss',
  'https://weworkremotely.com/categories/remote-programming-jobs.rss',
  'https://remotive.com/remote-jobs/customer-support/feed',
  'https://remotive.com/remote-jobs/software-dev/feed',
];

function clean(html) {
  return String(html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 320);
}

function guessLocation(item) {
  const t = item.title + ' ' + (item.contentSnippet || '');
  const eu = ['Germany','Netherlands','Poland','Spain','France','Portugal','Ireland','Czech','Hungary','Romania','Italy','Sweden','Austria','Denmark','Greece','Finland','Belgium'];
  for (const c of eu) if (t.includes(c)) return c;
  if (/remote|anywhere/i.test(t)) return 'Remote (EU-friendly)';
  return 'Europe';
}

function toJob(item, source) {
  const id = (item.guid || item.link || item.title || Math.random().toString()).slice(0, 120);
  return {
    id: 'live-' + Buffer.from(id).toString('base64').slice(0, 24),
    title: String(item.title || 'Untitled role').trim().slice(0, 110),
    company: (item.creator || source).trim().slice(0, 60),
    verified: true,
    location: guessLocation(item),
    salary: 'See posting',
    type: /part[- ]time/i.test(item.contentSnippet || '') ? 'Part-time' : 'Full-time',
    postedDaysAgo: item.isoDate ? Math.max(0, Math.floor((Date.now() - new Date(item.isoDate)) / 86400000)) : 7,
    summary: clean(item.contentSnippet || item.content),
    link: item.link || '',
    matchScore: null,
    source,
  };
}

async function refresh() {
  const all = [];
  const seen = new Set();

  for (const url of FEEDS) {
    try {
      const feed = await parser.parseURL(url);
      const source = (feed.title || 'Job Feed').split(/[|-]/)[0].trim();
      for (const it of (feed.items || []).slice(0, 25)) {
        const j = toJob(it, source);
        if (!seen.has(j.id)) { seen.add(j.id); all.push(j); }
      }
      console.log('[poller]', source, 'OK');
    } catch (e) {
      console.log('[poller] FAIL:', url.slice(0, 50), e.message);
    }
  }

  if (all.length) {
    /* uj elore, max 200 tarolva */
    all.sort((a, b) => a.postedDaysAgo - b.postedDaysAgo);
    JobsStore.save(all.slice(0, 200));
  } else {
    console.log('[poller] no results this round');
  }
}

export function startJobsPoller() {
  JobsStore.load();
  console.log('[poller] starting in 5s…');
  setTimeout(() => { refresh(); setInterval(refresh, 3600000); }, 5000);
}