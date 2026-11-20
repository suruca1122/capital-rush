const express = require('express');
const http = require('http');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const QRCode = require('qrcode');
const { Server } = require('socket.io');
const { generateQuestion, TOPICS } = require('./questions');

const PORT = process.env.PORT || 3000;
const TRACK = 1000;           // longitud de la pista (metros)
const MAX_PLAYERS = 14;
const MIN_PLAYERS = 2;

const app = express();
const server = http.createServer(app);
const io = new Server(server, { pingInterval: 10000, pingTimeout: 20000 });

app.use(express.static(path.join(__dirname, 'public')));
app.get('/profe', (_, res) => res.sendFile(path.join(__dirname, 'public', 'host.html')));
app.get('/qr', async (req, res) => {
  try {
    const svg = await QRCode.toString(String(req.query.text || ''), { type: 'svg', margin: 1, color: { dark: '#0b0420', light: '#ffffff' } });
    res.type('image/svg+xml').send(svg);
  } catch { res.status(400).end(); }
});
app.get('/api/info', (_, res) => {
  const ips = [];
  for (const list of Object.values(os.networkInterfaces())) {
    for (const n of list || []) if (n.family === 'IPv4' && !n.internal) ips.push(n.address);
  }
  res.json({ ips, port: PORT, topics: Object.fromEntries(Object.entries(TOPICS).map(([k, t]) => [k, { name: t.name, icon: t.icon, color: t.color, group: t.group }])) });
});

// ---------------------------------------------------------------------
const rooms = new Map();

function newCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let c;
  do { c = Array.from({ length: 4 }, () => chars[crypto.randomInt(chars.length)]).join(''); } while (rooms.has(c));
  return c;
}

const publicPlayer = (p) => ({ id: p.id, name: p.name, avatar: p.avatar, acc: p.acc, pos: p.pos, connected: p.connected, correct: p.correct, streak: p.streak });

function ranking(room) {
  return [...room.players.values()].sort((a, b) => b.pos - a.pos || b.correct - a.correct || a.totalTime - b.totalTime);
}

function lobbyState(room) {
  return { code: room.code, state: room.state, settings: room.settings, round: room.round, track: TRACK, players: [...room.players.values()].map(publicPlayer) };
}

function emitLobby(room) {
  io.to(room.code).emit('lobby', lobbyState(room));
}

function clearTimers(room) {
  clearTimeout(room.timer); clearTimeout(room.earlyTimer);
}

function nextQuestion(room) {
  clearTimers(room);
  room.round++;
  const q = generateQuestion(room.settings.topics, room.settings.difficulty, room.recent, room.used);
  room.recent = [...room.recent.slice(-4), q.sig];
  room.question = q;
  room.answers = new Map();
  room.state = 'question';
  room.qStart = Date.now();
  const duration = room.settings.time * 1000;
  const payload = {
    round: room.round, topic: q.topic, topicName: q.topicName, topicIcon: q.topicIcon, topicColor: q.topicColor, group: q.group,
    text: q.text, options: q.options, duration, remaining: duration,
  };
  io.to(room.code).emit('question', payload);
  room.timer = setTimeout(() => reveal(room), duration + 300);
}

function reveal(room) {
  if (room.state !== 'question') return;
  clearTimers(room);
  room.state = 'reveal';
  const q = room.question;
  const duration = room.settings.time * 1000;
  const unit = TRACK / room.settings.rounds;   // avance máximo por pregunta
  const correctOnes = [...room.answers.entries()].filter(([, a]) => a.idx === q.correctIndex).sort((a, b) => a[1].time - b[1].time);
  const results = {};
  const counts = [0, 0, 0, 0];
  for (const a of room.answers.values()) counts[a.idx]++;

  for (const p of room.players.values()) {
    const a = room.answers.get(p.id);
    const r = { answered: !!a, correct: false, advance: 0, time: a ? a.time : null, fastest: false, from: p.pos };
    if (a && a.idx === q.correctIndex) {
      const speed = Math.max(0, 1 - a.time / duration);       // 1 = instantáneo, 0 = último segundo
      r.advance = Math.round(unit * (0.4 + 0.6 * speed));
      r.correct = true;
      p.correct++; p.streak++;
      p.totalTime += a.time;
    } else {
      p.streak = 0;
    }
    results[p.id] = r;
  }
  if (correctOnes.length) {
    const fid = correctOnes[0][0];
    results[fid].fastest = true;
    results[fid].advance += Math.round(unit * 0.15);          // bonus al más rápido
  }
  for (const p of room.players.values()) {
    p.pos += results[p.id].advance;
    results[p.id].to = Math.min(p.pos, TRACK);
  }

  const rank = ranking(room);
  const finished = rank.some((p) => p.pos >= TRACK);
  if (finished) room.state = 'finished';

  const order = correctOnes.map(([id]) => id);
  const payload = {
    round: room.round, correctIndex: q.correctIndex, formula: q.formula, steps: q.steps, counts,
    results, order, finished, track: TRACK,
    players: rank.map(publicPlayer),
    podium: finished ? rank.map((p) => ({ ...publicPlayer(p) })) : null,
  };
  io.to(room.hostRoom).emit('reveal', payload);
  for (const p of room.players.values()) {
    if (!p.socketId) continue;
    const position = rank.findIndex((x) => x.id === p.id) + 1;
    io.to(p.socketId).emit('result', {
      ...results[p.id], correctIndex: q.correctIndex, correctText: q.options[q.correctIndex],
      formula: q.formula, steps: q.steps, position, total: rank.length, pos: Math.min(p.pos, TRACK), track: TRACK,
      finished, winner: finished ? publicPlayer(rank[0]) : null, streak: p.streak,
    });
  }
}

function endGame(room) {
  clearTimers(room);
  room.state = 'finished';
  const rank = ranking(room);
  io.to(room.hostRoom).emit('podium', { players: rank.map(publicPlayer), track: TRACK });
  rank.forEach((p, i) => p.socketId && io.to(p.socketId).emit('gameover', { position: i + 1, total: rank.length, winner: publicPlayer(rank[0]) }));
}

// ---------------------------------------------------------------------
io.on('connection', (socket) => {
  // ---------- PROFESOR ----------
  socket.on('host:create', (settings, cb) => {
    const code = newCode();
    const token = crypto.randomBytes(16).toString('hex');
    const topics = (settings.topics || []).filter((t) => TOPICS[t]);
    const room = {
      code, token, hostRoom: 'host:' + code,
      settings: {
        topics: topics.length ? topics : Object.keys(TOPICS),
        time: Math.min(180, Math.max(10, Number(settings.time) || 60)),
        rounds: Math.min(30, Math.max(4, Number(settings.rounds) || 10)),
        difficulty: ['basic', 'mix', 'advanced'].includes(settings.difficulty) ? settings.difficulty : 'mix',
      },
      players: new Map(), state: 'lobby', round: 0, recent: [], used: new Set(), answers: new Map(), created: Date.now(), lastActivity: Date.now(),
    };
    rooms.set(code, room);
    socket.join(code); socket.join(room.hostRoom);
    socket.data = { role: 'host', code };
    cb({ ok: true, code, token, lobby: lobbyState(room) });
  });

  socket.on('host:rejoin', ({ code, token }, cb) => {
    const room = rooms.get(code);
    if (!room || room.token !== token) return cb({ ok: false });
    socket.join(code); socket.join(room.hostRoom);
    socket.data = { role: 'host', code };
    cb({ ok: true, code, token, lobby: lobbyState(room) });
  });

  const hostRoom = () => {
    const d = socket.data || {};
    if (d.role !== 'host') return null;
    const room = rooms.get(d.code);
    if (room) room.lastActivity = Date.now();
    return room;
  };

  socket.on('host:start', (cb) => {
    const room = hostRoom(); if (!room) return;
    if (room.players.size < MIN_PLAYERS) return cb && cb({ ok: false, error: `Se necesitan al menos ${MIN_PLAYERS} jugadores` });
    for (const p of room.players.values()) { p.pos = 0; p.correct = 0; p.streak = 0; p.totalTime = 0; }
    room.round = 0; room.used = new Set();
    emitLobby(room);
    nextQuestion(room);
    cb && cb({ ok: true });
  });
  socket.on('host:next', () => { const room = hostRoom(); if (room && room.state === 'reveal') nextQuestion(room); });
  socket.on('host:skip', () => { const room = hostRoom(); if (room && room.state === 'question') reveal(room); });
  socket.on('host:end', () => { const room = hostRoom(); if (room && room.state !== 'lobby') endGame(room); });
  socket.on('host:podium', () => { const room = hostRoom(); if (room) endGame(room); });
  socket.on('host:restart', () => {
    const room = hostRoom(); if (!room) return;
    clearTimers(room);
    room.state = 'lobby'; room.round = 0;
    for (const p of room.players.values()) { p.pos = 0; p.correct = 0; p.streak = 0; p.totalTime = 0; }
    emitLobby(room);
  });
  socket.on('host:kick', (id) => {
    const room = hostRoom(); if (!room) return;
    const p = room.players.get(id); if (!p) return;
    if (p.socketId) io.to(p.socketId).emit('kicked');
    room.players.delete(id);
    emitLobby(room);
  });

  // ---------- ALUMNOS ----------
  socket.on('player:join', ({ code, name, avatar, acc, playerId }, cb) => {
    code = String(code || '').toUpperCase().trim();
    const room = rooms.get(code);
    if (!room) return cb({ ok: false, error: 'No existe ninguna partida con ese código' });
    name = String(name || '').trim().slice(0, 14);
    let p = playerId && room.players.get(playerId);
    if (!p) {
      if (!name) return cb({ ok: false, error: 'Escribe tu nombre' });
      if (room.state !== 'lobby') return cb({ ok: false, error: 'La partida ya ha empezado' });
      if (room.players.size >= MAX_PLAYERS) return cb({ ok: false, error: `La partida está llena (máx. ${MAX_PLAYERS})` });
      if ([...room.players.values()].some((x) => x.name.toLowerCase() === name.toLowerCase())) return cb({ ok: false, error: 'Ese nombre ya está cogido' });
      p = { id: crypto.randomBytes(8).toString('hex'), name, avatar: String(avatar || '🦙').slice(0, 8), acc: String(acc || '').slice(0, 8), pos: 0, correct: 0, streak: 0, totalTime: 0 };
      room.players.set(p.id, p);
    } else if (room.state === 'lobby' && name) {
      p.name = name; p.avatar = String(avatar || p.avatar).slice(0, 8); p.acc = String(acc ?? p.acc).slice(0, 8);
    }
    p.socketId = socket.id; p.connected = true;
    socket.join(code);
    socket.data = { role: 'player', code, id: p.id };
    room.lastActivity = Date.now();
    const position = ranking(room).findIndex((x) => x.id === p.id) + 1;
    cb({ ok: true, playerId: p.id, player: publicPlayer(p), state: room.state, position, total: room.players.size, track: TRACK });
    emitLobby(room);
    // Si se reconecta en mitad de una pregunta, se la reenviamos
    if (room.state === 'question') {
      const q = room.question;
      const duration = room.settings.time * 1000;
      socket.emit('question', {
        round: room.round, topic: q.topic, topicName: q.topicName, topicIcon: q.topicIcon, topicColor: q.topicColor, group: q.group,
        text: q.text, options: q.options, duration, remaining: Math.max(0, duration - (Date.now() - room.qStart)),
        alreadyAnswered: room.answers.has(p.id),
      });
    }
  });

  socket.on('player:answer', (idx, cb) => {
    const d = socket.data || {};
    const room = rooms.get(d.code);
    if (!room || d.role !== 'player' || room.state !== 'question') return cb && cb({ ok: false });
    if (room.answers.has(d.id)) return cb && cb({ ok: false });
    idx = Number(idx);
    if (!(idx >= 0 && idx < 4)) return;
    const time = Date.now() - room.qStart;
    if (time > room.settings.time * 1000 + 500) return cb && cb({ ok: false, late: true });
    room.answers.set(d.id, { idx, time });
    cb && cb({ ok: true, time });
    io.to(room.hostRoom).emit('answered', { id: d.id, count: room.answers.size });
    const active = [...room.players.values()].filter((p) => p.connected);
    if (active.every((p) => room.answers.has(p.id))) {
      clearTimeout(room.earlyTimer);
      room.earlyTimer = setTimeout(() => reveal(room), 1200);
    }
  });

  socket.on('disconnect', () => {
    const d = socket.data || {};
    if (d.role !== 'player') return;
    const room = rooms.get(d.code);
    const p = room && room.players.get(d.id);
    if (p && p.socketId === socket.id) {
      p.connected = false; p.socketId = null;
      if (room.state === 'question') {
        const active = [...room.players.values()].filter((x) => x.connected);
        if (active.length && active.every((x) => room.answers.has(x.id))) { clearTimeout(room.earlyTimer); room.earlyTimer = setTimeout(() => reveal(room), 1200); }
      }
      if (room.state === 'lobby') {
        // en la sala de espera, damos 60 s para volver antes de borrar
        setTimeout(() => { if (!p.connected && room.state === 'lobby') { room.players.delete(p.id); emitLobby(room); } }, 60000);
      }
      emitLobby(room);
    }
  });
});

// Limpieza de partidas abandonadas (3 h sin actividad)
setInterval(() => {
  const now = Date.now();
  for (const [code, room] of rooms) if (now - room.lastActivity > 3 * 3600e3) { clearTimers(room); rooms.delete(code); }
}, 10 * 60e3);

server.listen(PORT, () => {
  console.log(`\n👑 LA CARRERA DEL REY en marcha`);
  console.log(`   Profesor:  http://localhost:${PORT}/profe`);
  for (const list of Object.values(os.networkInterfaces())) for (const n of list || []) if (n.family === 'IPv4' && !n.internal) console.log(`   Alumnos:   http://${n.address}:${PORT}`);
  console.log('');
});
