// Kho dữ liệu chung cho chế độ vote: Firebase Realtime DB nếu có cấu hình, không thì localStorage (các tab cùng máy).
// API: set(path, val), on(path, cb) → huỷ, online(path) (tự xoá khi đóng trang).
const Net = (() => {
  const cfg = window.FIREBASE_CONFIG;
  const SDK = 'https://www.gstatic.com/firebasejs/10.12.2/';
  const loadJs = src => new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); });

  if (cfg && cfg.databaseURL) {
    const ready = loadJs(SDK + 'firebase-app-compat.js').then(() => loadJs(SDK + 'firebase-database-compat.js'))
      .then(() => { firebase.initializeApp(cfg); return firebase.database(); });
    return {
      mode: 'online', ready,
      set: (p, v) => ready.then(db => db.ref(p).set(v)),
      on: (p, cb) => { let off = () => {}; ready.then(db => { const r = db.ref(p), f = s => cb(s.val()); r.on('value', f); off = () => r.off('value', f); }); return () => off(); },
      // điện thoại khoá màn hình sẽ rớt kết nối: mỗi lần nối lại thì báo có mặt lại
      online: p => ready.then(db => db.ref('.info/connected').on('value', s => {
        if (!s.val()) return;
        const r = db.ref(p); r.onDisconnect().remove(); r.set(true);
      })),
    };
  }

  // dự phòng: 1 object JSON trong localStorage, tab khác nghe sự kiện 'storage'
  const KEY = 'mqd-net', subs = new Set();
  const read = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (_) { return {}; } };
  const get = (o, p) => p.split('/').reduce((a, k) => (a == null ? a : a[k]), o) ?? null;
  const emit = () => { const o = read(); subs.forEach(s => s.cb(get(o, s.p))); };
  addEventListener('storage', e => { if (e.key === KEY) emit(); });
  function set(p, v) {
    const o = read(), ks = p.split('/'), last = ks.pop();
    const parent = ks.reduce((a, k) => (a[k] && typeof a[k] === 'object' ? a[k] : (a[k] = {})), o);
    if (v === null) delete parent[last]; else parent[last] = v;
    try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (_) { /* hết chỗ: bỏ qua */ }
    emit(); return Promise.resolve();
  }
  return {
    mode: 'local', ready: Promise.resolve(),
    set,
    on: (p, cb) => { const s = { p, cb }; subs.add(s); cb(get(read(), p)); return () => subs.delete(s); },
    online: p => { addEventListener('pagehide', () => set(p, null)); return set(p, true); },
  };
})();
