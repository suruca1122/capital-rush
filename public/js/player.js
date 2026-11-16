const socket = io();
const $ = (id) => document.getElementById(id);

const params = new URLSearchParams(location.search);
let session = JSON.parse(localStorage.getItem('cr-player') || 'null');   // { code, playerId, name, avatar, acc }
let me = { avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)], acc: '' };
let timer = null;
let currentQ = null;
let answered = false;

// ---------- Selector de avatar ----------
if (session) { me.avatar = session.avatar || me.avatar; me.acc = session.acc || ''; $('name').value = session.name || ''; }
$('code').value = (params.get('c') || (session && session.code) || '').toUpperCase();
if (params.get('c') && session && session.code !== params.get('c').toUpperCase()) session = null;

function renderPicker() {
  $('preview').innerHTML = avatarHTML(me.avatar, me.acc);
  $('avatarGrid').innerHTML = AVATARS.map((a) => `<button type="button" class="${a === me.avatar ? 'sel' : ''}" data-a="${a}">${a}</button>`).join('');
  $('accGrid').innerHTML = ACCESSORIES.map((a) => `<button type="button" class="${a.e === me.acc ? 'sel' : ''} ${a.e ? '' : 'none'}" data-e="${a.e}" title="${a.label}">${a.e || 'Nada'}</button>`).join('');
}
$('avatarGrid').onclick = (e) => { const b = e.target.closest('button'); if (!b) return; me.avatar = b.dataset.a; renderPicker(); Sfx.unlock(); Sfx.pop(); };
$('accGrid').onclick = (e) => { const b = e.target.closest('button'); if (!b) return; me.acc = b.dataset.e; renderPicker(); Sfx.unlock(); Sfx.pop(); };
renderPicker();

// ---------- Unirse ----------
function join(auto = false) {
  const code = $('code').value.trim().toUpperCase();
  const name = $('name').value.trim();
  if (!auto) {
    if (code.length !== 4) return ($('joinErr').textContent = 'El código tiene 4 caracteres');
    if (!name) return ($('joinErr').textContent = 'Escribe tu nombre');
  }
  const playerId = session && session.code === code ? session.playerId : null;
  $('joinBtn').disabled = true;
  socket.emit('player:join', { code, name, avatar: me.avatar, acc: me.acc, playerId }, (res) => {
    $('joinBtn').disabled = false;
    if (!res.ok) {
      if (auto) { localStorage.removeItem('cr-player'); session = null; show('join'); return; }
      $('joinErr').textContent = res.error;
      return;
    }
    $('joinErr').textContent = '';
    me = { ...me, ...res.player };
    session = { code, playerId: res.playerId, name: res.player.name, avatar: res.player.avatar, acc: res.player.acc };
    localStorage.setItem('cr-player', JSON.stringify(session));
    $('waitAvatar').innerHTML = avatarHTML(me.avatar, me.acc);
    $('waitName').textContent = me.name;
    if (res.state === 'lobby') show('wait');
    else if (res.state === 'finished') showFinal(res.position, res.total);
    else if (res.state === 'reveal') { show('wait'); }
    // si está en 'question', el servidor reenvía la pregunta
  });
}
$('joinBtn').onclick = () => { Sfx.unlock(); join(false); };
$('name').addEventListener('keydown', (e) => e.key === 'Enter' && join(false));
$('code').addEventListener('input', (e) => (e.target.value = e.target.value.toUpperCase()));

socket.on('connect', () => {
  $('conn').classList.add('hidden');
  if (session && session.playerId) join(true);
});
socket.on('disconnect', () => $('conn').classList.remove('hidden'));
socket.on('kicked', () => {
  localStorage.removeItem('cr-player'); session = null;
  show('join'); $('joinErr').textContent = 'El profe te ha sacado de la partida';
});
socket.on('lobby', (l) => {
  if (l.state === 'lobby' && !$('join').classList.contains('active') && !$('wait').classList.contains('active')) show('wait');
});

// ---------- Pregunta ----------
socket.on('question', (q) => {
  currentQ = q;
  answered = !!q.alreadyAnswered;
  if (answered) { showSent(null, null); return; }
  $('pRound').textContent = 'P' + q.round;
  const t = $('pTopic'); t.style.setProperty('--tc', q.topicColor); t.textContent = `${q.topicIcon} ${q.topicName}`;
  $('pText').innerHTML = q.text;
  $('pOpts').innerHTML = q.options.map((o, i) => `<button class="p-opt opt-${LETTERS[i]}" data-i="${i}"><span class="letter">${LETTERS[i]}</span><span>${o}</span></button>`).join('');
  show('question');
  window.scrollTo(0, 0);
  runTimer(q.duration, q.remaining);
  if (navigator.vibrate) navigator.vibrate(80);
});

$('pOpts').onclick = (e) => {
  const b = e.target.closest('.p-opt');
  if (!b || answered) return;
  answered = true;
  const idx = Number(b.dataset.i);
  socket.emit('player:answer', idx, (res) => {
    if (res && res.ok) showSent(idx, res.time);
    else showSent(idx, null, true);
  });
  Sfx.unlock(); Sfx.pop();
};

function showSent(idx, time, late = false) {
  clearInterval(timer);
  const box = $('sentOpt');
  if (idx !== null && currentQ) {
    box.className = `sent-opt opt-${LETTERS[idx]}`;
    box.innerHTML = `<span class="letter">${LETTERS[idx]}</span>${currentQ.options[idx]}`;
    box.classList.remove('hidden');
  } else box.classList.add('hidden');
  $('sentTime').textContent = late ? '⏰ Fuera de tiempo' : time != null ? `⏱️ Respondiste en ${fmtSec(time)}` : '✅ Respuesta registrada';
  document.querySelector('#sent h2').textContent = '¡Respuesta enviada!';
  document.querySelector('#sent .sent-ico').textContent = '🚀';
  show('sent');
}

function runTimer(duration, remaining) {
  clearInterval(timer);
  const end = Date.now() + remaining;
  const fill = $('tbarFill'), txt = $('pTime');
  const tick = () => {
    const left = Math.max(0, end - Date.now());
    fill.style.transform = `scaleX(${left / duration})`;
    const s = Math.ceil(left / 1000);
    txt.textContent = s;
    txt.classList.toggle('warn', s <= 5);
    if (left <= 0) {
      clearInterval(timer);
      if (!answered) {
        answered = true;
        $('sentOpt').classList.add('hidden');
        $('sentTime').textContent = '¡No te ha dado tiempo!';
        document.querySelector('#sent h2').textContent = '⏰ ¡Tiempo!';
        document.querySelector('#sent .sent-ico').textContent = '⌛';
        show('sent');
      }
    }
  };
  tick();
  timer = setInterval(tick, 100);
}

// ---------- Resultado ----------
socket.on('result', (r) => {
  clearInterval(timer);
  const box = $('result');
  box.classList.toggle('ok', r.correct);
  box.classList.toggle('ko', !r.correct);
  if (r.correct) {
    $('resIco').textContent = r.fastest ? '⚡' : '✅';
    $('resTitle').textContent = pickOne(['¡Correcto!', '¡Bien hecho!', '¡Crack!', '¡Máquina!', '¡A tope!']);
    $('resGain').textContent = `+${r.advance} m`;
    Sfx.correct();
    if (navigator.vibrate) navigator.vibrate([60, 40, 60]);
  } else {
    $('resIco').textContent = r.answered ? '❌' : '💤';
    $('resTitle').textContent = r.answered ? pickOne(['¡Ups!', '¡Casi!', 'Esta no…', '¡Fallo!']) : 'Sin respuesta';
    $('resGain').textContent = 'Te quedas en el sitio';
    Sfx.wrong();
    if (navigator.vibrate) navigator.vibrate(300);
  }
  $('resFast').classList.toggle('hidden', !r.fastest);
  $('resCorrect').innerHTML = `${LETTERS[r.correctIndex]}) ${r.correctText}`;
  $('resSteps').innerHTML = `${r.formula}<br>${r.steps}`;
  $('mtMe').innerHTML = avatarHTML(me.avatar, me.acc);
  const fromPct = (r.from / r.track) * 100, toPct = (r.pos / r.track) * 100;
  $('mtFill').style.transition = 'none'; $('mtMe').style.transition = 'none';
  $('mtFill').style.width = fromPct + '%'; $('mtMe').style.left = fromPct + '%';
  $('mtPos').textContent = `${r.position}º de ${r.total}`;
  $('mtMeters').textContent = `${r.pos} / ${r.track} m`;
  show('result');
  requestAnimationFrame(() => requestAnimationFrame(() => {
    $('mtFill').style.transition = ''; $('mtMe').style.transition = '';
    $('mtFill').style.width = toPct + '%'; $('mtMe').style.left = toPct + '%';
  }));
  if (r.finished) setTimeout(() => showFinal(r.position, r.total), 5000);
});

socket.on('gameover', (g) => showFinal(g.position, g.total));

function showFinal(position, total) {
  const medals = { 1: '🥇', 2: '🥈', 3: '🥉' };
  $('finalMedal').textContent = medals[position] || '🏁';
  $('finalTitle').textContent = position === 1 ? '¡HAS GANADO!' : position <= 3 ? '¡Al podio!' : '¡Carrera terminada!';
  $('finalAvatar').innerHTML = avatarHTML(me.avatar, me.acc);
  $('finalTxt').innerHTML = `Has quedado <b>${position}º</b> de ${total}`;
  show('final');
  if (position === 1) { Sfx.fanfare(); confetti(5000); }
}

const pickOne = (a) => a[Math.floor(Math.random() * a.length)];
