import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.join(__dirname, 'live-jobs.json');

export const JobsStore = {
  data: { updatedAt: null, jobs: [] },

  load() {
    try {
      if (fs.existsSync(FILE)) {
        this.data = JSON.parse(fs.readFileSync(FILE, 'utf8'));
      }
    } catch (e) { console.error('[store] load failed', e.message); }
    return this.data;
  },

  save(jobs) {
    this.data = { updatedAt: Date.now(), jobs };
    try {
      fs.writeFileSync(FILE, JSON.stringify(this.data));
      console.log('[store] saved', jobs.length, 'jobs');
    } catch (e) { console.error('[store] save failed', e.message); }
    return this.data;
  },
};