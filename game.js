// Luồng chơi MỞ QUÁN ĐI!: tình huống → chọn → đêm bán hàng 3D → thẻ À HA!
const $ = s => document.querySelector(s);
const wait = ms => new Promise(r => setTimeout(r, ms));
const pick = a => a[Math.random() * a.length | 0];
const Sc = Scene3D;

const S = { cups: 0, zalo: 0, miss: 0, learned: [], gender: 'm', shop: 'Quán Nhà Làm', voice: true, sound: true };

// ---------- giọng đọc: mp3 sinh sẵn (audio/manifest.js), dự phòng Web Speech vi-VN ----------
let cur = null, gen = 0;
function play(who, text, g) {
  return new Promise(res => {
    if (!S.voice || g !== gen) return res();
    const said = spoken(text), file = window.TTS && window.TTS[`${who}|${said}`];
    const done = () => { if (cur && cur.res === done) cur = null; res(); };
    setTimeout(done, 15000); // không bao giờ để game kẹt vì âm thanh
    if (file) {
      const a = new Audio(`audio/${file}`);
      cur = { a, res: done }; a.onended = a.onerror = done; a.play().catch(done);
    } else if (window.speechSynthesis) {
      const v = speechSynthesis.getVoices().find(x => /^vi/i.test(x.lang));
      if (!v) return res();
      const u = new SpeechSynthesisUtterance(said); u.voice = v; u.lang = v.lang;
      cur = { res: done }; u.onend = u.onerror = done; speechSynthesis.speak(u);
    } else res();
  });
}
function stopVoice() {
  gen++;
  if (cur) { if (cur.a) cur.a.pause(); if (window.speechSynthesis) speechSynthesis.cancel(); cur.res(); }
}
const speak = (who, text) => { stopVoice(); return play(who, text, gen); };

// ---------- hiệu ứng âm thanh (tổng hợp, không cần file) ----------
let AC;
function sfx(type) {
  if (!S.sound) return;
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    const a = AC, t = a.currentTime;
    const tone = (f0, f1, dur, vol, wave = 'sine', delay = 0) => {
      const o = a.createOscillator(), g = a.createGain(); o.type = wave;
      o.frequency.setValueAtTime(f0, t + delay); o.frequency.exponentialRampToValueAtTime(f1, t + delay + dur);
      g.gain.setValueAtTime(vol, t + delay); g.gain.exponentialRampToValueAtTime(.001, t + delay + dur);
      o.connect(g).connect(a.destination); o.start(t + delay); o.stop(t + delay + dur);
    };
    ({
      blip: () => tone(900, 900, .05, .06, 'triangle'),
      coin: () => { tone(1300, 1300, .07, .1, 'square'); tone(1750, 1750, .12, .08, 'square', .07); },
      good: () => { tone(660, 990, .18, .14, 'triangle'); tone(990, 1320, .25, .12, 'triangle', .12); },
      bad: () => tone(260, 120, .35, .12, 'square'),
      aha: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, f, .35, .12, 'triangle', i * .09)),
      whoosh: () => tone(200, 1200, .4, .08, 'sawtooth'),
    })[type]();
  } catch (_) { /* trình duyệt chặn âm thanh: bỏ qua */ }
}

// ---------- HUD ----------
function hud() {
  $('#hudCups').textContent = `🧋 ${S.cups}`;
  $('#hudZalo').textContent = `👥 Nhóm Zalo: ${S.zalo}`;
}
function floatText(text, ok = true) {
  const s = document.createElement('span');
  s.className = ok ? 'ok' : 'bad'; s.textContent = text;
  $('#float').appendChild(s); setTimeout(() => s.remove(), 1800);
}
function renderDict() {
  $('#dictBody').innerHTML = S.learned.length
    ? S.learned.map(i => `<section><h3>${AHA[i].term}</h3><small>${AHA[i].en}</small><p>${rich(AHA[i].means)}</p></section>`).join('')
    : '<p class="empty">Chưa có từ nào. Cứ bán đi, từ sẽ tự đến!</p>';
}
$('#btnDict').onclick = () => { renderDict(); $('#dict').hidden = !$('#dict').hidden; };
$('#btnSound').onclick = e => {
  S.sound = !S.sound; e.currentTarget.textContent = S.sound ? '🔊' : '🔇';
  e.currentTarget.setAttribute('aria-label', S.sound ? 'Tắt hiệu ứng âm thanh' : 'Bật hiệu ứng âm thanh');
};
$('#btnVoice').onclick = e => {
  S.voice = !S.voice; if (!S.voice) stopVoice();
  e.currentTarget.classList.toggle('off', !S.voice);
  e.currentTarget.setAttribute('aria-label', S.voice ? 'Tắt giọng đọc' : 'Bật giọng đọc');
};
const rich = s => s.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');

// ---------- thoại ----------
const youKey = () => (S.gender === 'w' ? 'w_worker' : 'm_worker');
function avatar(who) {
  const src = Sc.portrait(who === 'you' ? youKey() : who), c = who === 'you' ? '#f5a524' : CHARS[who].color;
  return `<span class="ava" style="--c:${c}">${src ? `<img src="${src}" alt="">` : ''}</span>`;
}
function head(who, text) {
  const n = who === 'you' ? { name: 'Bạn', role: S.shop, color: '#f5a524' } : CHARS[who];
  return `${avatar(who)}<div class="dl-body" style="--c:${n.color}"><div class="dl-name">${n.name}<span>${n.role}</span></div><p class="dl-text">${rich(text)}</p></div>`;
}
// lines: [[who, text], ...]
function talk(lines) {
  const box = $('#dialog');
  return new Promise(res => {
    let i = 0;
    const show = () => {
      const [who, text] = lines[i];
      box.innerHTML = `${head(who, text)}<button class="next">${i < lines.length - 1 ? 'Tiếp ▸' : 'OK ▸'}</button>`;
      box.hidden = false; box.querySelector('.next').focus();
      speak(who, text);
      if (Sc.named[who]) Sc.sayOver(who, '💬', 1800);
    };
    box.onclick = () => {
      sfx('blip');
      if (++i < lines.length) return show();
      box.hidden = true; box.onclick = null; stopVoice(); res();
    };
    show();
  });
}
function choose(text, opts, who = 'you') {
  if (HOST && who === 'you') return voteRound(text, opts);
  const box = $('#dialog');
  box.innerHTML = `${head(who, text)}<div class="choices">${opts.map((o, i) => `<button data-i="${i}">${o}</button>`).join('')}</div>`;
  box.hidden = false; box.classList.add('choice');
  box.querySelector('button').focus();
  if (who !== 'you') speak(who, text);
  return new Promise(res => {
    box.onclick = e => {
      const b = e.target.closest('button[data-i]'); if (!b) return;
      box.hidden = true; box.onclick = null; box.classList.remove('choice'); stopVoice(); sfx('blip'); res(+b.dataset.i);
    };
  });
}

// ---------- màn phủ, bảng ----------
function screen(html, cls = '') {
  const s = $('#screen');
  s.className = `on ${cls}`; s.innerHTML = html;
  return new Promise(res => {
    const b = s.querySelector('[data-go]');
    b.focus();
    b.onclick = () => { stopVoice(); sfx('blip'); s.className = ''; s.innerHTML = ''; res(); };
  });
}
function card(big, small, ms = 1800) {
  const s = $('#screen');
  s.className = 'on flash'; s.innerHTML = `<div class="card"><h1>${big}</h1>${small ? `<p>${small}</p>` : ''}</div>`;
  sfx('whoosh');
  return Promise.race([wait(ms), new Promise(r => { s.onclick = r; })]).then(() => { s.onclick = null; s.className = ''; s.innerHTML = ''; });
}
const panel = html => { const p = $('#panel'); p.innerHTML = html; p.hidden = false; return p; };
const closePanel = () => { $('#panel').hidden = true; $('#panel').innerHTML = ''; };
const btnWait = (el, sel = '[data-go]') => new Promise(r => { const b = el.querySelector(sel); b.focus(); b.onclick = () => { sfx('blip'); r(); }; });

async function chapter(n, title) {
  $('#hudCh').textContent = `Đêm ${n}/8 · ${title}`;
  await card(`Đêm ${n}`, title);
}
function fail(text) { S.miss++; sfx('bad'); return card('💥 Toang!', text, 2600); }

// ---------- đêm bán hàng ----------
async function sell(cfg, label = '🌙 Đêm bán hàng') {
  const bar = panel(`<div class="night"><b>${label}</b><button class="ghost" id="ff">⏩ Tua nhanh</button></div>`);
  bar.classList.add('slim');
  bar.querySelector('#ff').onclick = e => { const on = e.currentTarget.classList.toggle('on'); Sc.speed(on ? 3 : 1); };
  const sold = await Sc.crowd({ ...cfg, onSale: () => { S.cups++; if (cfg.zalo) S.zalo++; hud(); sfx('coin'); } });
  Sc.speed(1); bar.classList.remove('slim'); closePanel();
  floatText(`Đêm nay: ${sold} ly`, sold > 0);
  await wait(700);
  return sold;
}

// ---------- thẻ À HA! ----------
async function aha(i) {
  const a = AHA[i];
  if (!S.learned.includes(i)) S.learned.push(i);
  sfx('aha');
  $('#btnDict').classList.add('pulse'); setTimeout(() => $('#btnDict').classList.remove('pulse'), 2500);
  const p = screen(`<div class="aha">
    <div class="aha-burst">À HA!</div>
    <p class="aha-lead">Việc bạn vừa làm, dân startup gọi là:</p>
    <h2>${a.term}</h2><small>${a.en}</small>
    <p>${rich(a.means)}</p>
    <div class="aha-video">📺 <b>Trong video:</b> ${a.video}</div>
    <div class="aha-who">${avatar('duc')}<span>Nhật Đức giải thích</span></div>
    <button data-go>Hiểu rồi! ▸</button></div>`, 'aha-screen');
  speak(...a.say);
  await p;
}

// ---------- chế độ chiếu lớp (?host): cả lớp vote bằng điện thoại ----------
const HOST = new URLSearchParams(location.search).has('host');
const Room = { code: '', online: 0, n: 0 };
const roomPath = p => `rooms/${Room.code}/${p}`;
function voteUrl() {
  const base = window.VOTE_URL || (/^https?:/.test(location.protocol) ? new URL('vote.html', location.href).href : '');
  return base ? `${base.split('?')[0]}?r=${Room.code}` : '';
}
const loadQR = () => window.QRCode ? Promise.resolve() : new Promise((res, rej) => {
  const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
  s.onload = res; s.onerror = rej; document.head.appendChild(s);
});
async function showRoom(first) {
  const url = voteUrl();
  const p = screen(`<div class="aha room-card">
    <p class="aha-lead">Cả lớp cùng chọn! Quét QR hoặc mở link:</p>
    <div id="qr"></div>
    ${url ? `<p class="room-url"><a href="${url}" target="_blank" rel="noopener">${url.replace(/^https?:\/\//, '')}</a></p>
      <button class="ghost" id="copy">📋 Sao chép link</button>` : '<p class="warn">Chưa có link: mở game bằng http(s) hoặc điền VOTE_URL trong firebase-config.js.</p>'}
    <p>Mã phòng <b class="code">${Room.code}</b> · <span id="roomN">${Room.online}</span> người đã vào</p>
    ${Net.mode === 'local' ? '<p class="warn">Chưa cấu hình Firebase: chỉ vote được giữa các tab trên máy này.</p>' : ''}
    <button data-go>${first ? 'Mọi người vào đủ rồi, bắt đầu ▸' : 'Đóng ▸'}</button></div>`, 'room-screen');
  if (url) {
    $('#copy').onclick = e => { navigator.clipboard && navigator.clipboard.writeText(url).then(() => { e.target.textContent = '✓ Đã sao chép'; }); };
    loadQR().then(() => new QRCode($('#qr'), { text: url, width: 240, height: 240, correctLevel: QRCode.CorrectLevel.M })).catch(() => {});
  }
  await p;
}
async function openRoom() {
  try { Room.code = sessionStorage.getItem('mqd-room') || ''; } catch (_) { /* bỏ qua */ }
  if (!Room.code) {
    Room.code = Array.from({ length: 4 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.random() * 32 | 0]).join('');
    try { sessionStorage.setItem('mqd-room', Room.code); } catch (_) { /* bỏ qua */ }
  }
  Net.set(roomPath('q'), null);
  const chip = $('#hudRoom'); chip.hidden = false; chip.onclick = () => showRoom(false);
  Net.on(roomPath('online'), v => {
    Room.online = v ? Object.keys(v).length : 0;
    chip.textContent = `📱 ${Room.code} · ${Room.online}`;
    const n = $('#roomN'); if (n) n.textContent = Room.online;
  });
  await showRoom(true);
}
// Trả về chỉ số được chọn (max=1) hoặc mảng chỉ số (max>1). onLive(top) gọi mỗi khi có phiếu mới.
function voteRound(text, opts, max = 1, onLive) {
  const id = `q${++Room.n}${Date.now().toString(36)}`;
  Net.set(roomPath('q'), { id, text, opts, max, open: true });
  const box = $('#dialog');
  box.innerHTML = `${head('you', text)}<div class="vote">
    ${opts.map((o, i) => `<button data-i="${i}" class="bar"><span class="fill"></span><span class="lbl">${o}</span><b>0</b></button>`).join('')}
    <div class="vote-foot"><span id="vt">Người mở game bấm Chốt khi đủ phiếu</span><span id="vn">0 phiếu</span><button class="next" id="vclose">Chốt ▸</button></div></div>`;
  box.querySelector('.dl-name').innerHTML = `📱 Cả lớp vote<span>Phòng ${Room.code}</span>`;
  box.hidden = false; box.classList.add('choice');
  let counts = opts.map(() => 0), voters = 0;
  const top = () => counts.map((c, i) => [c, Math.random(), i]).filter(x => x[0] > 0).sort((a, b) => b[0] - a[0] || a[1] - b[1]).slice(0, max).map(x => x[2]);
  const draw = () => {
    const most = Math.max(1, ...counts);
    box.querySelectorAll('.bar').forEach((b, i) => {
      b.querySelector('.fill').style.width = `${counts[i] / most * 100}%`; b.querySelector('b').textContent = counts[i];
    });
    $('#vn').textContent = `${voters}/${Room.online} người đã vote`;
  };
  const off = Net.on(roomPath(`votes/${id}`), v => {
    counts = opts.map(() => 0); voters = 0;
    for (const a of Object.values(v || {})) { voters++; Object.values(a || {}).forEach(i => { if (counts[i] !== undefined) counts[i]++; }); }
    draw(); if (onLive) onLive(top());
    $('#vt').textContent = voters && voters >= Room.online ? '✓ Cả lớp đã vote xong' : 'Người mở game bấm Chốt khi đủ phiếu';
  });
  return new Promise(res => {
    const finish = win => {
      off(); box.onclick = null;
      Net.set(roomPath('q'), { id, text, opts, max, open: false, win });
      box.querySelectorAll('.bar').forEach((b, i) => b.classList.toggle('win', win.includes(i)));
      sfx('good');
      setTimeout(() => { box.hidden = true; box.classList.remove('choice'); res(max > 1 ? win : win[0]); }, 1400);
    };
    box.onclick = e => {
      // chỉ người mở game kết thúc lượt vote
      if (e.target.closest('#vclose')) {
        const w = top();
        if (w.length || max > 1) finish(w); else $('#vt').textContent = 'Chưa có phiếu: bấm 1 lựa chọn để chọn thay lớp';
        return;
      }
      const b = e.target.closest('.bar');
      if (b && max === 1 && !voters) finish([+b.dataset.i]); // chưa ai vote: người chiếu chọn thay
    };
  });
}

// ---------- các chương ----------
async function ch1() {
  await chapter(1, 'Mở hay chờ?');
  Sc.setSign([S.shop.toUpperCase()]);
  await Promise.all([Sc.enter('va', { x: 2.1, z: 1.9 }), Sc.enter('tung', { x: 3.1, z: 1.6 })]);
  await talk(C.open);
  for (;;) {
    const i = await choose('Bạn chọn sao?', ['🧋 Mở luôn tối nay, chỉ 1 món', '⏳ Chờ 6 tháng cho hoàn hảo']);
    if (i === 0) break;
    await card('⏳ 6 tháng sau…', 'Xe inox đã sắm. Menu 20 món… vẫn đang làm.', 2600);
    Sc.setDormLights(.04); Sc.setRival(RIVAL_NOTES[1]);
    await sell({ n: 3, every: 2, buy: 0, think: () => pick(['KTX nghỉ hè rồi mà…', 'Mai mình về quê rồi.', 'Quán mới hả? Thôi.']) }, '☀️ Kỳ nghỉ hè');
    await talk(C.wait);
    await fail('0 ly. Đợi hoàn hảo thì lỡ mất đêm khách cần mình nhất.');
    await card('⏪ Quay lại tối hôm đó', '', 1400);
    Sc.setDormLights(.7); Sc.setRival(RIVAL_NOTES[0]);
  }
  await Promise.all([Sc.exit('va'), Sc.exit('tung')]);
  await sell({ n: 9, buy: .7, think: (i, b) => (b ? pick(['Ngon!', 'Trân châu hơi cứng nha', 'Đúng lúc đang khát!']) : null) });
  await talk(C.sold1);
  await aha(0);
}

async function signBuilder() {
  if (HOST) {
    const show = idx => Sc.setSign([S.shop.toUpperCase(), ...idx.map(i => SIGN_CARDS[i].t)]);
    const idx = await voteRound('🪧 Biển hiệu ghi gì? Chọn tối đa 5 mảnh', SIGN_CARDS.map(c => c.t), 5, show);
    if (idx.length) { show(idx); return idx.map(i => SIGN_CARDS[i]); }
  }
  const sel = new Set(), p = panel(`<div class="builder"><h3>🪧 Làm biển hiệu <small>chọn tối đa 5 mảnh</small></h3>
    <div class="chips">${SIGN_CARDS.map((c, i) => `<button data-i="${i}" aria-pressed="false">${c.t}</button>`).join('')}</div>
    <button data-go disabled>Treo biển ▸</button></div>`);
  const go = p.querySelector('[data-go]');
  const sync = () => {
    Sc.setSign([S.shop.toUpperCase(), ...[...sel].map(i => SIGN_CARDS[i].t)]);
    p.querySelectorAll('.chips button').forEach(b => {
      const on = sel.has(+b.dataset.i); b.setAttribute('aria-pressed', on); b.disabled = !on && sel.size >= 5;
    });
    go.disabled = sel.size < 3; go.textContent = sel.size < 3 ? `Chọn thêm ${3 - sel.size} mảnh` : 'Treo biển ▸';
  };
  p.querySelector('.chips').onclick = e => {
    const b = e.target.closest('button'); if (!b) return;
    const i = +b.dataset.i; sel.has(i) ? sel.delete(i) : sel.add(i); sfx('blip'); sync();
  };
  sync();
  return new Promise(r => { go.onclick = () => { sfx('good'); closePanel(); r([...sel].map(i => SIGN_CARDS[i])); }; });
}
async function ch2() {
  await chapter(2, 'Tấm biển hiệu');
  await Sc.enter('bb');
  await talk(C.sign);
  for (;;) {
    const cards = await signBuilder();
    const good = cards.filter(c => c.ok), bad = cards.length - good.length;
    const missing = SIGN_CARDS.filter(c => c.ok && !cards.includes(c)).map(c => c.k);
    await sell({ n: 9, buy: good.length / 5 * .85, think: (i, b) => b ? pick(['Rõ ràng ghê, mua!', '15k rẻ nè!', 'Quét QR đặt luôn!'])
      : bad && Math.random() < .5 ? 'Nâng tầm… là sao? 🤔' : missing.length ? SIGN_ASK[pick(missing)] : null });
    if (good.length >= 4 && !bad) break;
    await talk(C.signBad);
    S.miss++;
  }
  await Sc.exit('bb');
  await aha(1);
}

async function ch3() {
  await chapter(3, 'Món mới: ai thử trước?');
  await Promise.all([Sc.enter('va', { x: 2.1, z: 1.9 }), Sc.enter('bb', { x: 3.1, z: 1.6 })]);
  await talk(C.taste);
  for (;;) {
    const i = await choose('Món mới, chưa ai uống thử…', ['👭 Mời Vân Anh & Bình Bình uống thử, nhờ chê thật', '🚀 Bán thẳng cho cả KTX luôn']);
    if (i === 0) break;
    await sell({ n: 7, buy: .8, think: (i, b) => (b ? pick(['Ngọt khé cổ!', 'Vị như… kem đánh răng?', '1 sao.']) : null) });
    floatText('⭐ 1.6 / 5', false);
    await talk(C.tasteBad);
    await fail('Khách lạ thử món lỗi, và họ không quay lại nữa.');
  }
  Sc.act('va', 'Interact', true); await Sc.act('bb', 'Interact', true);
  await talk(C.tasteFriends);
  const p = panel(`<div class="builder center"><h3>🔧 Sửa công thức</h3><p>Bớt đường · Thêm khoai môn thật</p><button data-go>Sửa xong ▸</button></div>`);
  await btnWait(p); closePanel(); sfx('good');
  await Promise.all([Sc.exit('va'), Sc.exit('bb')]);
  await sell({ n: 8, buy: .75, think: (i, b) => (b ? pick(['Ngon nha!', 'Khoai môn thơm ghê', 'Mai mua tiếp']) : null) });
  await aha(2);
}

async function ch4() {
  await chapter(4, 'Đặt xe ở đâu?');
  await Promise.all([Sc.enter('tung', { x: 2.1, z: 1.9 }), Sc.enter('va', { x: 3.1, z: 1.6 })]);
  await talk(C.where);
  for (;;) {
    const i = await choose('Tối nay đẩy xe đi đâu?', ['🏮 Phố đi bộ cuối tuần', '🏠 Ngay trước nhà', '🌙 Cổng KTX, đêm trước thi']);
    if (i === 2) break;
    if (i === 0) {
      Sc.setPlace('pho');
      await sell({ n: 12, every: .6, buy: .12, think: (i, b) => (b ? 'Uống thử xem' : Math.random() < .5 ? pick(['Vừa uống trà sữa quán kia rồi', 'Đang đi chơi, no lắm', 'Nhiều quán quá…']) : null) }, '🏮 Phố đi bộ');
      await talk(C.wherePho);
      await fail('Đông người, nhưng chẳng ai đang cần bạn.');
    } else {
      Sc.setPlace('nha');
      await sell({ n: 2, every: 3, buy: 0, think: () => pick(['Ơ, bán gì ở đây?', '…']) }, '🏠 Trước nhà');
      await talk(C.whereNha);
      await fail('Không ai đi qua thì không ai mua.');
    }
    Sc.setPlace('ktx');
  }
  await Promise.all([Sc.exit('tung'), Sc.exit('va')]);
  Sc.setDormLights(.97);
  await card('📚 Đêm trước thi', '23:00 · Cả KTX còn thức', 2000);
  await sell({ n: 16, every: .45, run: true, buy: .9, think: (i, b) => (b ? pick(['Cứu! Còn 3 chương!', 'Cho 2 ly, thức tới sáng!', 'May quá có quán!', 'Đêm nay không ngủ!']) : null) });
  await aha(3);
}

function feed(post, likes, comments) {
  return panel(`<div class="phone"><div class="ph-top">👥 Group KTX Khu B · 8.000 thành viên</div>
    <div class="post"><div class="post-h">${avatar('you')}<b>${S.shop}</b></div><p>${post}</p>
    <div class="likes">👍 <span id="likes">0</span></div><ul id="cmts"></ul></div>
    <button data-go hidden>Tiếp ▸</button></div>`, likes, comments);
}
async function runFeed(p, likes, comments) {
  const el = p.querySelector('#likes'), ul = p.querySelector('#cmts');
  for (let k = 1; k <= 20; k++) { el.textContent = Math.round(likes * k / 20); await wait(40); }
  for (const [who, c, mine] of comments) {
    await wait(650);
    const li = document.createElement('li'); if (mine) li.className = 'mine';
    li.innerHTML = `<b>${who}</b> ${c}`; ul.appendChild(li); ul.scrollTop = ul.scrollHeight; sfx('blip');
  }
  const go = p.querySelector('[data-go]'); go.hidden = false;
  await btnWait(p); closePanel();
}
async function ch5() {
  await chapter(5, 'Đăng bài lên group KTX');
  await Sc.enter('bb');
  await talk(C.post);
  const AD = '🎉🎉 CHÍNH THỨC RA MẮT thương hiệu trà sữa cao cấp, nâng tầm trải nghiệm!!! Inbox ngay!!!';
  const REAL = 'Chào mọi người, mình là sinh viên phòng 304. Mình mới mở xe trà sữa nhỏ ở cổng KTX, 15k/ly. Lần đầu làm, mọi người uống thử rồi chê giúp mình nha!';
  for (;;) {
    const i = await choose('Viết bài thế nào?', [`📢 "${AD}"`, `🙋 "${REAL}"`]);
    if (i === 1) break;
    await runFeed(feed(AD), 3, [['Minh', 'Spam à?'], ['Hà', 'Admin ơi duyệt bài kiểu gì vậy'], ['Quân', 'Lại quảng cáo…']]);
    await sell({ n: 6, buy: .15, think: (i, b) => (!b && Math.random() < .5 ? pick(['Spam à?', 'Lại quảng cáo…']) : null) });
    await talk(C.postAd);
    await fail('Viết như quảng cáo, cộng đồng lướt qua ngay.');
  }
  await runFeed(feed(REAL), 312, [['Linh', 'Phòng 304 à, tối xuống ủng hộ!'], ['Khoa', 'Có ít đường không bạn?'], ['Hà', 'Bán tới mấy giờ vậy?']]);
  for (;;) {
    const i = await choose('Có 3 bình luận hỏi. Giờ sao?', ['💬 Trả lời từng bình luận', '😴 Đăng xong đi ngủ']);
    if (i === 0) break;
    await sell({ n: 8, buy: .4, think: (i, b) => (!b ? 'Hỏi mà chẳng ai trả lời…' : null) });
    await talk(C.postSleep);
    await fail('Đăng xong bỏ đó, khách hỏi không ai đáp.');
  }
  await runFeed(feed(REAL), 512, [['Khoa', 'Có ít đường không bạn?'], [S.shop, 'Có nha, bạn dặn 50% đường là được!', true],
    ['Hà', 'Bán tới mấy giờ vậy?'], [S.shop, '20h tới 24h nha, cổng KTX!', true], ['Linh', 'Rep nhanh ghê, tối xuống liền!']]);
  await Sc.exit('bb');
  await sell({ n: 14, every: .6, buy: .8, think: (i, b) => (b ? pick(['Đọc bài phòng 304 nè!', 'Thấy bạn rep nên ghé', 'Ủng hộ người thật!']) : null) });
  await aha(4);
}

async function ch6() {
  await chapter(6, 'Lời mời 20 triệu');
  await Sc.enter('bb', { x: 3.1, z: 1.6 });
  await talk([C.tiktok[0]]);
  await Sc.enter('trang', { x: 2.1, z: 1.9 });
  await talk([C.tiktok[1]]);
  for (;;) {
    const i = await choose('Quảng bá kiểu gì?', ['💸 Trả 20 triệu cho TikToker 20 triệu follow', '✉️ Nhắn riêng Trang và các bạn hay review, mời uống thử']);
    if (i === 1) break;
    const p = panel(`<div class="builder center"><h3>📈 Lượt xem clip</h3><div class="big" id="views">0</div><button data-go hidden>Tiếp ▸</button></div>`);
    for (let k = 1; k <= 30; k++) { p.querySelector('#views').textContent = Math.round(2e6 * k / 30).toLocaleString('vi-VN'); await wait(45); }
    p.querySelector('[data-go]').hidden = false; await btnWait(p); closePanel();
    floatText('−20.000.000đ', false);
    await sell({ n: 4, buy: .25, think: () => pick(['Xem clip ở Cà Mau, ship không?', 'Ủa quán ở đâu vậy?']) });
    await talk(C.tiktokPaid);
    await fail('Hai triệu lượt xem, vài ly trà sữa. Lượt xem không phải khách.');
  }
  await Sc.act('trang', 'Interact', true);
  Sc.sayOver('trang', '😋 Ngon thật nè!', 2000);
  await talk(C.trangYes);
  await Promise.all([Sc.exit('trang'), Sc.exit('bb')]);
  await card('📲 Trang và 12 bạn review', 'đã đăng bài về quán', 1800);
  await sell({ n: 14, every: .55, buy: .85, think: (i, b) => (b ? pick(['Thấy Trang review nên ghé!', 'Bạn mình bảo ngon lắm', 'Review chuẩn ghê']) : null) });
  await aha(5);
}

async function ch7() {
  await chapter(7, 'Khách quen');
  await Sc.enter('vd');
  await talk(C.regular);
  for (;;) {
    const i = await choose('Việt Dương muốn được báo món mới…', ['🙂 Ừ, nhớ mặt cậu rồi', '📱 Lập nhóm Zalo khách quen, mời mọi người vào']);
    if (i === 1) break;
    await Sc.exit('vd');
    await card('Tuần sau…', 'Quán ra món mới: trà đào cam sả', 1800);
    await sell({ n: 8, buy: .3, think: (i, b) => (!b ? pick(['Có món mới hả? Không biết luôn', 'Hôm nay quán mở à?']) : null) });
    await Sc.enter('vd');
    await talk(C.regularForget);
    await fail('Không có danh sách khách, mỗi lần ra món lại bắt đầu từ số 0.');
  }
  await Sc.exit('vd');
  $('#hudZalo').hidden = false; S.zalo = 1; hud();
  await sell({ n: 10, buy: .8, zalo: true, think: (i, b) => (b ? 'Vào nhóm Zalo nha!' : null) }, '📱 Mỗi khách mua = 1 thành viên nhóm');
  for (;;) {
    const i = await choose('Tuần sau có trà đào cam sả. Báo sao đây?', ['📣 Nhắn nhóm: "Có món mới nha"', '🎟️ Cho đặt trước, ai mời thêm bạn được giảm 5k']);
    if (i === 1) break;
    await sell({ n: 9, buy: .6, zalo: true, think: (i, b) => (b ? 'Thấy tin nhắn nè!' : null) });
    await talk(C.regularPlain);
  }
  for (let k = 0; k < 3; k++) { S.zalo = Math.round(S.zalo * 1.8); hud(); floatText(`🎟️ Mời bạn! 👥 ${S.zalo}`); sfx('good'); await wait(700); }
  await sell({ n: 18, every: .4, buy: .9, zalo: true, think: (i, b) => (b ? pick(['Bạn mình mời nè!', 'Đặt trước rồi, lấy thôi', 'Giảm 5k nhờ rủ bạn!']) : null) });
  await aha(6);
}

async function ch8() {
  await chapter(8, 'Mỗi tuần một món');
  await talk(C.weekly);
  for (let w = 0; w < 4; w++) {
    await card(`Tuần ${w + 1}`, '', 1200);
    if (w === 2) {
      const lazy = await choose('Tuần thứ 3 rồi, hơi mệt…', ['🆕 Ra món mới tiếp', '😌 Thôi, bán món cũ cho nhàn']);
      if (lazy) {
        await sell({ n: 8, buy: .3, think: (i, b) => (!b ? pick(['Lại món cũ à?', 'Tuần này nghỉ']) : null) });
        await talk(C.lazy);
        await fail('Không có gì mới, khách quen cũng thôi ghé.');
      }
    }
    const item = MENU[w][await choose('Món mới tuần này?', MENU[w])];
    Sc.setSign([S.shop.toUpperCase(), `MỚI: ${item.replace(/^\S+\s/, '')}`, '15.000đ · 20h–24h', 'Quét QR đặt trước']);
    floatText('📣 Đã báo nhóm Zalo');
    Sc.setRival(RIVAL_NOTES[Math.min(w + 1, 4)]);
    Sc.hhSay(C.hhWeek[w][1], 3000); speak(...C.hhWeek[w]);
    await sell({ n: 6 + w * 4, every: .6 - w * .08, buy: .88, zalo: true,
      think: (i, b) => (b ? pick([`Thử ${item.replace(/^\S+\s/, '')}!`, 'Tuần này có gì mới?', 'Thấy trong nhóm Zalo!']) : null) }, `📅 Tuần ${w + 1}: ${item}`);
  }
  await aha(7);
}

// ---------- màn cuối: ghép việc ↔ thuật ngữ ----------
async function bridge() {
  $('#hudCh').textContent = 'Màn cuối · Từ quán ra startup';
  await card('Màn cuối', 'Từ quán trà sữa ra startup');
  await talk(C.bridge);
  const order = AHA.map((_, i) => i).sort(() => Math.random() - .5);
  const p = panel(`<div class="match"><h3>Ghép việc ở quán ↔ từ của startup</h3>
    <div class="cols"><div class="col" id="mL">${DEEDS.map((d, i) => `<button data-l="${i}">${d}</button>`).join('')}</div>
    <div class="col" id="mR">${order.map(i => `<button data-r="${i}">${AHA[i].term}</button>`).join('')}</div></div>
    <p class="hint">Bấm 1 việc bên trái, rồi bấm từ tương ứng bên phải.</p></div>`);
  p.classList.add('wide');
  let L = null, left = AHA.length;
  await new Promise(res => {
    p.onclick = e => {
      const b = e.target.closest('button'); if (!b || b.classList.contains('done')) return;
      if (b.dataset.l) { p.querySelectorAll('[data-l]').forEach(x => x.classList.remove('sel')); b.classList.add('sel'); L = b; sfx('blip'); return; }
      if (!L) return;
      if (b.dataset.r === L.dataset.l) {
        [L, b].forEach(x => { x.classList.remove('sel'); x.classList.add('done'); }); L = null; sfx('good');
        if (!--left) setTimeout(res, 600);
      } else { b.classList.add('shake'); setTimeout(() => b.classList.remove('shake'), 400); sfx('bad'); }
    };
  });
  closePanel();
}

async function ending() {
  if (HOST) Net.set(roomPath('q'), { id: 'end', end: true, text: 'Hết game! Cảm ơn cả lớp đã cùng mở quán 🧋', opts: [] });
  Sc.setRival('TẠM HOÃN KHAI TRƯƠNG');
  await talk(C.end);
  const [, rank, note] = RANKS.find(r => S.miss <= r[0]);
  await screen(`<div class="end">
    <p class="end-k">Hết game · ${S.shop}</p>
    <h1>${rank}</h1><p>${note}</p>
    <div class="stats"><div><b>${S.cups}</b>ly đã bán</div><div><b>${S.zalo}</b>khách trong nhóm Zalo</div><div><b>${S.miss}</b>lần vấp</div></div>
    <h3>📖 Từ điển founder đã mở khoá</h3>
    <ol class="dict-end">${AHA.map((a, i) => `<li><b>${a.term}</b> ← ${DEEDS[i]}</li>`).join('')}</ol>
    <p class="credit">Dựa trên video YC "How to launch (again and again)" — Kat Mañalac · Nhân vật 3D: Quaternius (CC0)</p>
    <button data-go>🔁 Chơi lại</button></div>`, 'end-screen');
  location.reload();
}

// ---------- màn mở đầu ----------
async function title() {
  const s = $('#screen');
  s.className = 'on title-screen';
  s.innerHTML = `<div class="title">
    <h1>MỞ QUÁN ĐI!</h1>
    <p class="tag">Một xe trà sữa ở cổng KTX. 8 đêm bán hàng.<br>Và mọi bài học <b>launch</b> của Y Combinator, học bằng cách <b>tự làm</b>.</p>
    <div id="load"><div class="bar"><i></i></div><span>Đang gọi khách tới…</span></div>
    <div id="setup" hidden>
      <div class="pick" role="radiogroup" aria-label="Chọn nhân vật">
        <button data-g="m" role="radio" aria-checked="true"><img alt=""><span>Chủ quán nam</span></button>
        <button data-g="w" role="radio" aria-checked="false"><img alt=""><span>Chủ quán nữ</span></button>
      </div>
      <label>Tên quán <input id="shopName" maxlength="22" value="${S.shop}"></label>
      <button data-go>🧋 Mở quán!</button>
    </div></div>`;
  await Sc.load(f => { s.querySelector('#load i').style.width = `${f * 100}%`; });
  Sc.start();
  s.querySelector('#load').hidden = true; s.querySelector('#setup').hidden = false;
  const pk = s.querySelector('.pick');
  pk.querySelector('[data-g=m] img').src = Sc.portrait('m_worker');
  pk.querySelector('[data-g=w] img').src = Sc.portrait('w_worker');
  pk.onclick = e => {
    const b = e.target.closest('button'); if (!b) return;
    S.gender = b.dataset.g; sfx('blip');
    pk.querySelectorAll('button').forEach(x => x.setAttribute('aria-checked', x === b));
  };
  await new Promise(r => { s.querySelector('[data-go]').onclick = r; });
  S.shop = s.querySelector('#shopName').value.trim() || 'Quán Nhà Làm';
  s.className = ''; s.innerHTML = '';
  Sc.you(S.gender);
  $('#hud').hidden = false; hud();
  if (HOST) await openRoom();
}

async function main() {
  await title();
  for (const ch of [ch1, ch2, ch3, ch4, ch5, ch6, ch7, ch8, bridge]) await ch();
  await ending();
}
main();
