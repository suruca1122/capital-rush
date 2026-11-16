const socket = io();
const $ = (id) => document.getElementById(id);

let info = { ips: [], port: 3000, topics: {} };
let room = null;          // { code, token }
let players = [];         // lista pública de jugadores
let track = 1000;
let roomState = 'lobby';
let timerRAF = null;
let answeredIds = new Set();
let lastPodium = null;

// ---------- Fondo con billetes flotantes ----------
(function floaters() {
  const fx = document.querySelector('.bg-fx');
  const icons = ['💸', '💰', '📈', '🪙', '💶', '%'];
  for (let i = 0; i < 14; i++) {
    const s = document.createElement('span');
    s.className = 'float';
    s.textContent = icons[i % icons.length];
    s.style.left = Math.random() * 100 + 'vw';
    s.style.animationDuration = 14 + Math.random() * 18 + 's';
    s.style.animationDelay = -Math.random() * 30 + 's';
    fx.appendChild(s);
  }
})();

// ---------- Configuración ----------
fetch('/api/info').then((r) => r.json()).then((d) => {
  info = d;
  $('topicPick').innerHTML = Object.entries(d.topics).map(([k, t]) => `
    <input type="checkbox" id="tp-${k}" value="${k}" checked>
    <label for="tp-${k}" style="--tc:${t.color}"><span class="ic">${t.icon}</span>${t.name}</label>`).join('');
});

$('createBtn').onclick = () => {
  Sfx.unlock(); Sfx.pop();
  const topics = [...document.querySelectorAll('#topicPick input:checked')].map((i) => i.value);
  if (!topics.length) return alert('Elige al menos un tema');
  socket.emit('host:create', { topics, time: $('time').value, rounds: $('rounds').value, difficulty: $('difficulty').value }, (res) => {
    if (!res.ok) return;
    room = { code: res.code, token: res.token };
    sessionStorage.setItem('cr-host', JSON.stringify(room));
    applyLobby(res.lobby);
    showLobby();
  });
};

// Reconexión del profesor (si recarga la página)
function tryRejoin() {
  const saved = JSON.parse(sessionStorage.getItem('cr-host') || 'null');
  if (!saved) return;
  socket.emit('host:rejoin', saved, (res) => {
    if (!res.ok) { sessionStorage.removeItem('cr-host'); return; }
    room = saved;
    applyLobby(res.lobby);
    if (res.lobby.state === 'lobby') showLobby();
    else { show('game'); buildLanes(); $('nextBtn').classList.remove('hidden'); $('skipBtn').classList.add('hidden'); }
  });
}
socket.on('connect', () => { if (room) socket.emit('host:rejoin', room, () => {}); else tryRejoin(); });

function joinUrl() {
  const local = ['localhost', '127.0.0.1', '::1'].includes(location.hostname);
  if (local && info.ips.length) return `http://${info.ips[0]}:${location.port || info.port}`;
  return location.origin;
}

function showLobby() {
  roomState = 'lobby';
  show('lobby');
  const url = joinUrl();
  $('joinUrl').textContent = url.replace(/^https?:\/\//, '');
  $('roomCode').textContent = room.code;
  $('qr').src = '/qr?text=' + encodeURIComponent(`${url}/?c=${room.code}`);
  renderLobby();
}

// ---------- Estado de la sala ----------
function applyLobby(l) {
  const before = new Set(players.map((p) => p.id));
  players = l.players;
  track = l.track;
  roomState = l.state;
  if (l.state === 'lobby' && players.some((p) => !before.has(p.id)) && before.size >= 0 && document.getElementById('lobby').classList.contains('active')) Sfx.pop();
}

socket.on('lobby', (l) => {
  applyLobby(l);
  if ($('lobby').classList.contains('active')) renderLobby();
  if ($('game').classList.contains('active')) updateLaneLabels();
});

function renderLobby() {
  $('playerCount').textContent = players.length;
  $('startBtn').disabled = players.length < 2;
  $('startHint').textContent = players.length < 2 ? 'Se necesitan al menos 2 jugadores' : '¡Todo listo! Pulsa para arrancar';
  const box = $('lobbyPlayers');
  const existing = new Map([...box.children].map((el) => [el.dataset.id, el]));
  players.forEach((p) => {
    let el = existing.get(p.id);
    if (!el) {
      el = document.createElement('div');
      el.className = 'lp card';
      el.dataset.id = p.id;
      box.appendChild(el);
    }
    el.classList.toggle('off', !p.connected);
    el.innerHTML = `<button class="kick" title="Expulsar">✕</button>${avatarHTML(p.avatar, p.acc)}<div class="nm">${esc(p.name)}</div>`;
    el.querySelector('.kick').onclick = () => { if (confirm(`¿Expulsar a ${p.name}?`)) socket.emit('host:kick', p.id); };
    existing.delete(p.id);
  });
  existing.forEach((el) => el.remove());
}

$('startBtn').onclick = async () => {
  Sfx.unlock();
  await countdown();
  socket.emit('host:start', (res) => { if (!res.ok) alert(res.error); });
};

function countdown() {
  return new Promise((resolve) => {
    const el = $('countdown');
    el.classList.remove('hidden');
    const seq = ['3', '2', '1', '¡YA!'];
    let i = 0;
    const step = () => {
      if (i === seq.length) { el.classList.add('hidden'); return resolve(); }
      el.innerHTML = `<span>${seq[i]}</span>`;
      i === seq.length - 1 ? Sfx.go() : Sfx.tock();
      i++;
      setTimeout(step, i === seq.length ? 700 : 850);
    };
    step();
  });
}

// ---------- Pista ----------
function buildLanes() {
  const lanes = $('lanes');
  lanes.style.setProperty('--n', players.length);
  lanes.innerHTML = players.map((p) => `
    <div class="lane" data-id="${p.id}">
      <div class="lane-label"><span class="rk"></span><span class="nm">${esc(p.name)}</span><span class="m"></span></div>
      <div class="lane-road"><div class="runner" style="--p:${Math.min(p.pos, track) / track}">
        <span class="trail"></span>${avatarHTML(p.avatar, p.acc)}
      </div></div>
    </div>`).join('');
  sizeLanes();
  updateLaneLabels();
}
function sizeLanes() {
  const lanes = $('lanes');
  if (!players.length) return;
  const h = Math.min(90, lanes.clientHeight / players.length);
  lanes.style.setProperty('--lh', h + 'px');
}
window.addEventListener('resize', sizeLanes);

function updateLaneLabels() {
  const sorted = [...players].sort((a, b) => b.pos - a.pos);
  const leaderPos = sorted[0] ? sorted[0].pos : 0;
  players.forEach((p) => {
    const lane = document.querySelector(`.lane[data-id="${p.id}"]`);
    if (!lane) return;
    const rank = sorted.findIndex((x) => x.id === p.id) + 1;
    lane.querySelector('.rk').textContent = p.pos > 0 ? rank + 'º' : '–';
    lane.querySelector('.m').textContent = Math.min(p.pos, track) + ' m';
    lane.classList.toggle('off', !p.connected);
    lane.querySelector('.runner').classList.toggle('leader', p.pos > 0 && p.pos === leaderPos);
  });
}

// ---------- Pregunta ----------
socket.on('question', (q) => {
  if (q.round === 1 || !$('game').classList.contains('active') || $('lanes').children.length !== players.length) { show('game'); buildLanes(); }
  roomState = 'question';
  answeredIds = new Set();
  document.querySelectorAll('.runner .done').forEach((e) => e.remove());
  $('roundChip').textContent = `Pregunta ${q.round}`;
  $('answeredChip').textContent = `0 / ${players.filter((p) => p.connected).length} han respondido`;
  const tc = $('topicChip');
  tc.style.setProperty('--tc', q.topicColor);
  tc.textContent = `${q.topicIcon} ${q.topicName}`;
  $('qText').innerHTML = '<div>' + q.text + '</div>';
  $('qOpts').innerHTML = q.options.map((o, i) => `
    <div class="q-opt opt-${LETTERS[i]}"><span class="bar"></span><span class="letter">${LETTERS[i]}</span><span>${o}</span><span class="cnt"></span></div>`).join('');
  document.querySelector('.q-main').classList.remove('revealed');
  $('explain').classList.add('hidden');
  $('nextBtn').classList.add('hidden');
  $('skipBtn').classList.remove('hidden');
  startTimer(q.duration, q.remaining);
  Sfx.whoosh();
});

function startTimer(duration, remaining) {
  cancelAnimationFrame(timerRAF);
  const end = performance.now() + remaining;
  const ring = $('timerRing'), txt = $('timerTxt'), box = $('timer');
  let lastSec = null;
  const C = 276.5;
  const frame = (now) => {
    const left = Math.max(0, end - now);
    ring.style.strokeDashoffset = C * (1 - left / duration);
    const sec = Math.ceil(left / 1000);
    txt.textContent = sec;
    box.classList.toggle('warn', sec <= 5);
    if (sec !== lastSec && sec <= 5 && sec > 0) Sfx.tick();
    lastSec = sec;
    if (left > 0) timerRAF = requestAnimationFrame(frame);
  };
  timerRAF = requestAnimationFrame(frame);
}
function stopTimer() { cancelAnimationFrame(timerRAF); $('timer').classList.remove('warn'); }

socket.on('answered', ({ id, count }) => {
  answeredIds.add(id);
  $('answeredChip').textContent = `${count} / ${players.filter((p) => p.connected).length} han respondido`;
  const runner = document.querySelector(`.lane[data-id="${id}"] .runner`);
  if (runner && !runner.querySelector('.done')) {
    const d = document.createElement('span'); d.className = 'done'; d.textContent = '✔';
    runner.appendChild(d);
  }
  Sfx.pop();
});

// ---------- Resolución ----------
socket.on('reveal', (r) => {
  stopTimer();
  roomState = r.finished ? 'finished' : 'reveal';
  $('timerTxt').textContent = '0';
  $('skipBtn').classList.add('hidden');
  const main = document.querySelector('.q-main');
  main.classList.add('revealed');
  const total = r.counts.reduce((a, b) => a + b, 0) || 1;
  document.querySelectorAll('.q-opt').forEach((el, i) => {
    el.classList.add(i === r.correctIndex ? 'right' : 'wrong');
    el.querySelector('.cnt').textContent = r.counts[i];
    setTimeout(() => (el.querySelector('.bar').style.width = (r.counts[i] / total) * 100 + '%'), 50);
  });
  $('exFormula').innerHTML = r.formula;
  $('exSteps').innerHTML = r.steps;
  const fastId = r.order[0];
  const fast = r.players.find((p) => p.id === fastId);
  $('exFast').innerHTML = fast
    ? `⚡ Más rápido: ${avatarHTML(fast.avatar, fast.acc)} <b>${esc(fast.name)}</b> (${fmtSec(r.results[fastId].time)})`
    : '😱 ¡Nadie ha acertado!';
  $('explain').classList.remove('hidden');
  Sfx.reveal();

  // Animar la carrera
  setTimeout(() => {
    players = players.map((p) => ({ ...p, ...(r.players.find((x) => x.id === p.id) || {}) }));
    let anyMove = false;
    r.players.forEach((p) => {
      const res = r.results[p.id];
      const runner = document.querySelector(`.lane[data-id="${p.id}"] .runner`);
      if (!runner || !res) return;
      runner.querySelector('.done')?.remove();
      const g = document.createElement('span');
      if (res.correct) {
        anyMove = true;
        runner.style.setProperty('--p', Math.min(p.pos, track) / track);
        runner.classList.add('moving');
        setTimeout(() => runner.classList.remove('moving'), 2300);
        g.className = 'float-gain';
        g.textContent = `+${res.advance} m${res.fastest ? ' ⚡' : ''}`;
      } else {
        g.className = 'float-gain miss';
        g.textContent = res.answered ? '✖' : '💤';
      }
      runner.appendChild(g);
      setTimeout(() => g.remove(), 2700);
    });
    if (anyMove) Sfx.whoosh();
    setTimeout(updateLaneLabels, 2300);
    if (r.finished) {
      lastPodium = r.podium;
      setTimeout(() => showPodium(r.podium), 3600);
    } else {
      setTimeout(() => $('nextBtn').classList.remove('hidden'), 1200);
    }
  }, 1800);
});

$('nextBtn').onclick = () => { $('nextBtn').classList.add('hidden'); socket.emit('host:next'); };
$('skipBtn').onclick = () => socket.emit('host:skip');
$('endBtn').onclick = () => { if (confirm('¿Terminar la carrera ahora? Ganará quien vaya primero.')) socket.emit('host:end'); };
$('muteBtn').onclick = () => { $('muteBtn').textContent = Sfx.toggle() ? '🔇' : '🔊'; };
document.addEventListener('keydown', (e) => {
  if ((e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight') && !$('nextBtn').classList.contains('hidden') && $('game').classList.contains('active')) {
    e.preventDefault(); $('nextBtn').click();
  }
});

// ---------- Podio ----------
socket.on('podium', (d) => showPodium(d.players));

function showPodium(list) {
  if ($('podium').classList.contains('active')) return;
  stopTimer();
  show('podium');
  const top = list.slice(0, 3);
  const order = [1, 0, 2].filter((i) => top[i]);
  $('podiumWrap').innerHTML = order.map((i) => {
    const p = top[i];
    return `<div class="pod p${i + 1}">
      ${avatarHTML(p.avatar, p.acc)}<div class="nm">${i === 0 ? '👑 ' : ''}${esc(p.name)}</div>
      <div class="meta">${Math.min(p.pos, track)} m · ${p.correct} aciertos</div>
      <div class="block">${i + 1}</div></div>`;
  }).join('');
  $('restList').innerHTML = list.slice(3).map((p, i) => `<div class="ri"><span class="muted">${i + 4}º</span>${avatarHTML(p.avatar, p.acc)}${esc(p.name)} <span class="muted">${Math.min(p.pos, track)} m</span></div>`).join('');
  Sfx.fanfare();
  setTimeout(() => confetti(6000), 1200);
}

$('againBtn').onclick = () => {
  socket.emit('host:restart');
  $('podium').classList.remove('active');
  showLobby();
};
$('newBtn').onclick = () => { sessionStorage.removeItem('cr-host'); location.reload(); };
