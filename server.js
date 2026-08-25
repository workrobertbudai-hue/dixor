import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
import http from 'http';
import { startJobsPoller } from './server/jobs-poller.mjs';
import { JobsStore } from './server/jobs-store.mjs';
import { Server } from 'socket.io';

const PORT = process.env.PORT || 3001;

const app = express();
app.get('/health', (req, res) => res.json({ ok: true }));
app.use(express.static(path.join(__dirname, 'dist')));
app.get('/api/jobs', (req, res) => res.json(JobsStore.data));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: true, methods: ['GET', 'POST'] },
});

const names = new Map(); // socketId -> handle
const rooms = new Map(); // topicId -> Set(socketId)
const lastMsg = new Map(); // socketId -> timestamp ( egyszeru rate-limit )

function roomCounts() {
  const o = {};
  for (const [k, set] of rooms) if (set.size > 0) o[k] = set.size;
  return o;
}

function broadcastAll() {
  io.emit('presence', { count: names.size });
  io.emit('rooms', roomCounts());
}

io.on('connection', (socket) => {
  names.set(socket.id, 'Guest');
  broadcastAll();

  socket.on('hello', (d) => {
    const h = d && typeof d.handle === 'string' ? d.handle.slice(0, 24) : 'Guest';
    names.set(socket.id, h);
  });

  socket.on('room:join', (d) => {
    const tid = String((d && d.topicId) || '');
    if (!tid) return;
    for (const [, set] of rooms) set.delete(socket.id);
    if (!rooms.has(tid)) rooms.set(tid, new Set());
    rooms.get(tid).add(socket.id);
    socket.join('t:' + tid);
    socket.to('t:' + tid).emit('system', {
      topicId: tid,
      type: 'join',
      who: names.get(socket.id),
    });
    broadcastAll();
  });

  socket.on('room:leave', (d) => {
    const tid = String((d && d.topicId) || '');
    const set = rooms.get(tid);
    if (set) set.delete(socket.id);
    broadcastAll();
  });

  socket.on('typing', (d) => {
    const tid = String((d && d.topicId) || '');
    if (!tid || !rooms.has(tid)) return;
    socket.to('t:' + tid).emit('typing', {
      topicId: tid,
      who: names.get(socket.id),
    });
  });

  socket.on('chat:message', (d) => {
    const tid = String((d && d.topicId) || '');
    const txt = String((d && d.text) || '').slice(0, 240).trim();
    if (!tid || !txt) return;

    const now = Date.now();
    const prev = lastMsg.get(socket.id) || 0;
    if (now - prev < 250) return; // flood-vedelem
    lastMsg.set(socket.id, now);

    const set = rooms.get(tid);
    if (!set || !set.has(socket.id)) return;

    io.to('t:' + tid).emit('chat', {
      topicId: tid,
      from: names.get(socket.id),
      text: txt,
      at: now,
    });
  });

  socket.on('disconnect', () => {
    names.delete(socket.id);
    lastMsg.delete(socket.id);
    for (const [, set] of rooms) set.delete(socket.id);
    broadcastAll();
  });
});

server.listen(PORT, () => {
  console.log('DIXOR live server: http://localhost:' + PORT);
});