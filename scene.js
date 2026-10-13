// Cảnh 3D: cổng KTX ban đêm, xe trà sữa, quán Hoàn Hảo đối diện, khách là model Quaternius (CC0).
const Scene3D = (() => {
  const canvas = document.getElementById('scene');
  const R = new THREE.WebGLRenderer({ canvas, antialias: true });
  R.setPixelRatio(Math.min(devicePixelRatio, 2));
  R.outputEncoding = THREE.sRGBEncoding;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0e1830);
  scene.fog = new THREE.Fog(0x0e1830, 18, 46);
  const cam = new THREE.PerspectiveCamera(42, 1, .1, 120);
  const clock = new THREE.Clock();
  // đồng hồ cảnh: tua nhanh được (speed), mọi chờ đợi trong cảnh dùng sleep() thay vì setTimeout
  let simT = 0, tscale = 1; const timers = [];
  const sleep = ms => new Promise(r => timers.push({ at: simT + ms / 1000, r }));

  scene.add(new THREE.HemisphereLight(0x9fb4ff, 0x30283a, .75));
  const moon = new THREE.DirectionalLight(0xbfd0ff, .55); moon.position.set(-6, 10, 8); scene.add(moon);

  const mat = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: .85, flatShading: true, ...o });
  const box = (w, h, d, c, x, y, z, parent = scene, o) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), typeof c === 'number' ? mat(c, o) : c);
    m.position.set(x, y, z); parent.add(m); return m;
  };
  const cyl = (r, h, c, x, y, z, parent = scene, seg = 8) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), typeof c === 'number' ? mat(c) : c);
    m.position.set(x, y, z); parent.add(m); return m;
  };
  const canvasTex = (w, h, draw) => {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4; return t;
  };
  const signMat = tex => new THREE.MeshBasicMaterial({ map: tex, toneMapped: false });

  // ---------- mặt đất ----------
  box(80, .1, 60, 0x2a2f3a, 0, -.05, 0);
  box(80, .12, 5.2, 0x59606d, 0, .01, .6);                       // vỉa hè
  box(80, .16, .18, 0x8a8f99, 0, .03, 3.2);                       // bó vỉa
  for (let x = -30; x < 30; x += 3) box(1.4, .02, .14, 0xd8d2a0, x, .01, 6.2);
  for (let x = -30; x < 30; x += 1.6) box(.02, .125, 5.2, 0x4d535f, x, .012, .6); // ron gạch

  // ---------- 3 địa điểm: KTX / phố đi bộ / trước nhà ----------
  const places = { ktx: new THREE.Group(), pho: new THREE.Group(), nha: new THREE.Group() };
  Object.values(places).forEach(g => scene.add(g));

  let dormLit = .7;
  const dormTex = canvasTex(1024, 512, () => {});
  function drawDorm() {
    const c = dormTex.image, g = c.getContext('2d');
    g.fillStyle = '#3a4152'; g.fillRect(0, 0, c.width, c.height);
    let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let r = 0; r < 6; r++) for (let k = 0; k < 18; k++) {
      const on = rnd() < dormLit, warm = rnd() < .6;
      g.fillStyle = on ? (warm ? '#ffd27a' : '#bfe3ff') : '#1c2230';
      g.fillRect(14 + k * 56, 20 + r * 80, 34, 46);
      if (on && rnd() < .25) { g.fillStyle = 'rgba(40,40,60,.55)'; g.fillRect(14 + k * 56, 20 + r * 80, 34, 20); }
    }
    dormTex.needsUpdate = true;
  }
  drawDorm();
  const dorm = new THREE.Mesh(new THREE.BoxGeometry(34, 13, 3), [mat(0x3a4152), mat(0x3a4152), mat(0x3a4152), mat(0x3a4152),
    new THREE.MeshBasicMaterial({ map: dormTex, toneMapped: false }), mat(0x3a4152)]);
  dorm.position.set(0, 6.5, -9); places.ktx.add(dorm);
  box(34, .4, .4, 0x7b8496, 0, 1.2, -3.2, places.ktx);            // tường rào thấp
  for (let x = -16; x <= 16; x += 2) if (x < -6 || x > -2) cyl(.03, 1.6, 0x7b8496, x, .8, -3.2, places.ktx, 5);
  [-6.3, -1.7].forEach(x => box(.6, 3.4, .6, 0xa3473d, x, 1.7, -3.2, places.ktx));
  const gateTex = canvasTex(1024, 160, (g, w, h) => {
    g.fillStyle = '#a3473d'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#ffe9a8'; g.font = 'bold 92px "Be Vietnam Pro", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('KÝ TÚC XÁ · KHU B', w / 2, h / 2 + 4);
  });
  const gateSign = new THREE.Mesh(new THREE.PlaneGeometry(5.2, .8), signMat(gateTex));
  gateSign.position.set(-4, 3.6, -2.88); places.ktx.add(gateSign);
  box(5.2, .9, .3, 0x6d2f29, -4, 3.6, -3.06, places.ktx);

  // phố đi bộ: dãy mặt tiền nhiều màu + dây đèn lồng
  ['#e0525a', '#3fa7a0', '#e6a23c', '#7a62d6', '#d9578d', '#4a8fd9', '#9bbf3b'].forEach((col, i) => {
    const x = -15 + i * 5;
    box(4.6, 6 + (i % 3), 2, new THREE.Color(col).getHex(), x, 3 + (i % 3) / 2, -7, places.pho);
    const t = canvasTex(256, 64, (g, w, h) => { g.fillStyle = '#111'; g.fillRect(0, 0, w, h); g.fillStyle = '#fff'; g.font = 'bold 34px sans-serif';
      g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(['TRÀ SỮA', 'BÁNH TRÁNG', 'KEM', 'TRÀ CHANH', 'ỐC', 'XIÊN BẨN', 'CHÈ'][i], w / 2, h / 2); });
    const s = new THREE.Mesh(new THREE.PlaneGeometry(3.2, .8), signMat(t)); s.position.set(x, 2.6, -5.98); places.pho.add(s);
  });
  for (let x = -16; x <= 16; x += .8) {
    const b = new THREE.Mesh(new THREE.SphereGeometry(.12, 6, 4), new THREE.MeshBasicMaterial({ color: [0xff5a5a, 0xffd25a, 0x5affc8][Math.abs(x * 10) % 3 | 0] }));
    b.position.set(x, 4.2 + Math.sin(x * .8) * .25, -2.5); places.pho.add(b);
  }
  // trước nhà: vài căn nhà ống tối đèn
  for (let i = 0; i < 6; i++) {
    const x = -14 + i * 5.5, h = 5 + (i % 2) * 2;
    box(5.2, h, 3, 0x41454f, x, h / 2, -7, places.nha);
    box(1.2, 2, .1, 0x2a2016, x, 1, -5.45, places.nha);
    if (i % 3 === 1) box(1, .8, .1, 0xffcf7a, x + 1.5, h - 1.5, -5.45, places.nha, { emissive: 0x6b4a10 });
  }
  function setPlace(p) {
    Object.entries(places).forEach(([k, g]) => { g.visible = k === p; });
    hemi(p === 'nha' ? .35 : p === 'pho' ? .95 : .75);
    scene.background.set(p === 'pho' ? 0x1c1838 : 0x0e1830);
  }
  const hemiL = scene.children[0];
  const hemi = v => { hemiL.intensity = v; };

  // ---------- cây, đèn đường ----------
  [[-11, -1.6], [5, -1.8], [13, -1.6]].forEach(([x, z]) => {
    cyl(.14, 1.6, 0x5a3d26, x, .8, z);
    const c = new THREE.Mesh(new THREE.ConeGeometry(1.1, 2.6, 7), mat(0x2f6b3c)); c.position.set(x, 2.8, z); scene.add(c);
  });
  [-7.5, 9.5].forEach(x => {
    cyl(.07, 4.4, 0x2b2f38, x, 2.2, 2.9);
    box(.9, .1, .3, 0x2b2f38, x - .4, 4.4, 2.9);
    const bulb = box(.4, .08, .22, 0xfff1c2, x - .7, 4.33, 2.9, scene, { emissive: 0xffe7a0 });
    const l = new THREE.PointLight(0xffd9a0, 1.1, 12, 1.6); l.position.set(x - .7, 4.1, 2.9); scene.add(l);
    bulb.userData.light = l;
  });

  // ---------- xe trà sữa ----------
  const CART = { x: 0, z: .4 };
  const cart = new THREE.Group(); cart.position.set(CART.x, 0, CART.z); scene.add(cart);
  box(2.6, .9, 1.1, 0xd08a3c, 0, .75, 0, cart);
  box(2.7, .08, 1.2, 0xf4ead8, 0, 1.24, 0, cart);
  box(2.62, .22, 1.12, 0x8a4f22, 0, .38, 0, cart);
  [-1, 1].forEach(x => { const w = cyl(.28, .1, 0x222222, x, .28, .58, cart, 12); w.rotation.x = Math.PI / 2; });
  [[-1.25, -.5], [1.25, -.5], [-1.25, .5], [1.25, .5]].forEach(([x, z]) => cyl(.035, 1.4, 0xdedede, x, 1.95, z, cart, 5));
  const awnTex = canvasTex(256, 64, (g, w, h) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#fff4e0' : '#e8505b'; g.fillRect(i * 32, 0, 32, h); } });
  const awn = box(2.9, .1, 1.5, new THREE.MeshStandardMaterial({ map: awnTex, roughness: .9 }), 0, 2.68, .05, cart);
  awn.rotation.x = .12;
  for (let i = 0; i < 9; i++) {
    const b = new THREE.Mesh(new THREE.SphereGeometry(.05, 6, 4), new THREE.MeshBasicMaterial({ color: 0xffe08a }));
    b.position.set(-1.3 + i * .325, 2.52 - Math.sin(i / 8 * Math.PI) * .12, .82); cart.add(b);
  }
  const cartLight = new THREE.PointLight(0xffc27a, 1.6, 7, 1.4); cartLight.position.set(0, 2.3, 1.2); cart.add(cartLight);
  // ly + nồi trên quầy
  cyl(.22, .45, 0xb7bcc4, -.85, 1.5, -.15, cart, 10);
  for (let i = 0; i < 4; i++) cyl(.07, .2, 0xe9d3b0, -.25 + i * .2, 1.38, .25, cart, 8);
  // biển hiệu (canvas) — game gọi setSign()
  const signTex = canvasTex(1024, 384, () => {});
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 1.05), signMat(signTex));
  sign.position.set(0, 3.35, .55); sign.rotation.x = -.08; cart.add(sign);
  box(2.9, 1.15, .06, 0x5a3417, 0, 3.35, .5, cart).rotation.x = -.08;
  function setSign(items) {
    const c = signTex.image, g = c.getContext('2d');
    g.fillStyle = '#fbf3df'; g.fillRect(0, 0, c.width, c.height);
    g.strokeStyle = '#8a4f22'; g.lineWidth = 14; g.strokeRect(7, 7, c.width - 14, c.height - 14);
    g.textAlign = 'center'; g.textBaseline = 'middle';
    if (!items.length) { g.fillStyle = '#c9bfa8'; g.font = 'bold 60px "Be Vietnam Pro", sans-serif'; g.fillText('(biển trống)', 512, 192); }
    const rows = items.length, lh = Math.min(110, 330 / Math.max(rows, 1));
    items.forEach((t, i) => {
      g.fillStyle = i === 0 ? '#c0392b' : '#3b2a1a';
      let size = i === 0 ? lh * .82 : lh * .62;
      g.font = `bold ${size}px "Be Vietnam Pro", sans-serif`;
      while (g.measureText(t).width > 960 && size > 18) { size -= 2; g.font = `bold ${size}px "Be Vietnam Pro", sans-serif`; }
      g.fillText(t, 512, 192 + (i - (rows - 1) / 2) * lh);
    });
    signTex.needsUpdate = true;
  }
  setSign([]);

  // ---------- quán Hoàn Hảo Coffee (đang sửa mãi) ----------
  const rival = new THREE.Group(); rival.position.set(10.5, 0, -3.2); rival.rotation.y = -.35; scene.add(rival);
  box(5, 4, 3.4, 0x6f6a5f, 0, 2, 0, rival);
  box(3.2, 2.4, .1, 0x1a1d24, 0, 1.3, 1.72, rival);
  for (let x = -2.6; x <= 2.6; x += 1.3) cyl(.04, 4.8, 0xb0b6be, x, 2.4, 2.1, rival, 5);
  for (let y = 1.2; y < 4.8; y += 1.2) { const p = cyl(.035, 5.4, 0xb0b6be, 0, y, 2.1, rival, 5); p.rotation.z = Math.PI / 2; }
  let rivalNote = 'SẮP KHAI TRƯƠNG';
  const rivalTex = canvasTex(1024, 256, () => {});
  function setRival(note) {
    rivalNote = note;
    const g = rivalTex.image.getContext('2d');
    g.fillStyle = '#14161c'; g.fillRect(0, 0, 1024, 256);
    g.fillStyle = '#e7c35a'; g.font = 'bold 96px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('HOÀN HẢO COFFEE', 512, 90);
    g.fillStyle = '#fff'; g.font = 'bold 54px "Be Vietnam Pro", sans-serif'; g.fillText(note, 512, 196);
    rivalTex.needsUpdate = true;
  }
  setRival(rivalNote);
  const rs = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 1.15), signMat(rivalTex)); rs.position.set(0, 3.4, 2.25); rival.add(rs);

  // ---------- model nhân vật ----------
  const GL = {}, CLIPS = {};
  const CAST = { tung: 'm_beachcharacter', va: 'w_animatedwoman2', bb: 'm_hoodiecharacter', vd: 'm_casualcharacter',
    trang: 'w_animatedwoman', duc: 'm_businessman', hh: 'm_king' };
  const CROWD = ['m_adventurer', 'm_astronaut', 'm_farmer', 'm_punk', 'm_swat', 'w_adventurer', 'w_medieval', 'w_punk',
    'w_scificharacter', 'w_soldier', 'w_witch', 'w_suit'];
  const shadowMat = new THREE.MeshBasicMaterial({ color: 0, transparent: true, opacity: .35, depthWrite: false });
  const shadowGeo = new THREE.CircleGeometry(.38, 16).rotateX(-Math.PI / 2);
  const cupMat = [mat(0xe9d3b0), mat(0xf6f6f6), mat(0x40281a)];

  async function load(onProgress) {
    const L = new THREE.GLTFLoader(); L.setMeshoptDecoder(MeshoptDecoder);
    await MeshoptDecoder.ready;
    const keys = Object.keys(MODELS);
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i], bin = atob(MODELS[k]), u8 = new Uint8Array(bin.length);
      for (let j = 0; j < bin.length; j++) u8[j] = bin.charCodeAt(j);
      GL[k] = await new Promise((res, rej) => L.parse(u8.buffer, '', res, rej));
      onProgress && onProgress((i + 1) / keys.length);
    }
    CLIPS.m = GL[ANIM_SRC.m].animations; CLIPS.w = GL[ANIM_SRC.w].animations;
  }

  const actors = new Set();
  function make(key) {
    const o = THREE.SkeletonUtils.clone(GL[key].scene);
    const mixer = new THREE.AnimationMixer(o), acts = {};
    CLIPS[key[0]].forEach(c => { acts[c.name] = mixer.clipAction(c); });
    const sh = new THREE.Mesh(shadowGeo, shadowMat); sh.position.y = .02; o.add(sh);
    const a = { key, o, mixer, acts, cur: null, target: null, bubble: null, speed: 1.3 };
    play(a, 'Idle'); actors.add(a); scene.add(o);
    return a;
  }
  function remove(a) { if (a.bubble) a.bubble.el.remove(); scene.remove(a.o); actors.delete(a); a.mixer.stopAllAction(); }
  function play(a, name, once) {
    const next = a.acts[name]; if (!next) return Promise.resolve();
    if (a.cur !== next) {
      next.reset(); next.setLoop(once ? THREE.LoopOnce : THREE.LoopRepeat); next.clampWhenFinished = !!once;
      next.play(); if (a.cur) a.cur.crossFadeTo(next, .2, false); a.cur = next;
    }
    return once ? sleep(next.getClip().duration * 1000 - 150) : Promise.resolve();
  }
  function walkTo(a, x, z, run) {
    return new Promise(res => {
      a.target = { x, z, res, speed: run ? 3.4 : a.speed };
      play(a, run ? 'Run' : 'Walk');
    });
  }
  const face = (a, x, z) => { a.faceTo = Math.atan2(x - a.o.position.x, z - a.o.position.z); };
  function giveCup(a) {
    const wrist = a.o.getObjectByName('WristR'); if (!wrist || a.cup) return;
    const g = new THREE.Group();
    const c = new THREE.Mesh(new THREE.CylinderGeometry(.045, .035, .14, 8), cupMat[0]); g.add(c);
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(.048, .048, .015, 8), cupMat[1]); lid.position.y = .075; g.add(lid);
    const straw = new THREE.Mesh(new THREE.CylinderGeometry(.006, .006, .12, 4), cupMat[2]); straw.position.y = .13; g.add(straw);
    wrist.updateMatrixWorld(true);
    const s = wrist.getWorldScale(new THREE.Vector3()).x;
    g.scale.setScalar(1 / s); g.position.set(0, .08 / s, .04 / s);
    wrist.add(g); a.cup = g;
  }

  // ---------- bong bóng suy nghĩ (DOM) ----------
  const bubbles = document.getElementById('bubbles');
  function bubble(a, text, ms = 2400, kind = '') {
    if (a.bubble) a.bubble.el.remove();
    const el = document.createElement('div'); el.className = `bub ${kind}`; el.textContent = text; bubbles.appendChild(el);
    const b = { el }; a.bubble = b;
    return sleep(ms).then(() => { if (a.bubble === b) { el.remove(); a.bubble = null; } });
  }
  const v3 = new THREE.Vector3();
  function placeBubbles() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    for (const a of actors) if (a.bubble) {
      v3.set(a.o.position.x, 2.05, a.o.position.z).project(cam);
      const st = a.bubble.el.style;
      st.left = `${(v3.x + 1) / 2 * w}px`; st.top = `${(1 - v3.y) / 2 * h}px`;
      st.visibility = v3.z < 1 ? 'visible' : 'hidden';
    }
  }

  // ---------- nhân vật có tên ----------
  const named = {};
  const SPOT = { x: 2.1, z: 1.9 };
  function you(gender) {
    if (named.you) remove(named.you);
    const a = make(gender === 'w' ? 'w_worker' : 'm_worker');
    a.o.position.set(CART.x + .3, 0, CART.z - .95); a.o.rotation.y = 0; named.you = a; return a;
  }
  async function enter(id, spot = SPOT) {
    let a = named[id];
    if (!a) { a = named[id] = make(CAST[id]); a.o.position.set(9.5, 0, spot.z + .6); }
    await walkTo(a, spot.x, spot.z);
    face(a, CART.x, CART.z + 1.6); play(a, 'Idle');
  }
  async function exit(id) {
    const a = named[id]; if (!a) return;
    delete named[id];
    await walkTo(a, 10, a.o.position.z + .8);
    remove(a);
  }
  const act = (id, name, once) => named[id] && play(named[id], name, once);
  const sayOver = (id, text, ms) => named[id] && bubble(named[id], text, ms, 'say');

  // ---------- đám đông khách ----------
  let crowdGen = 0;
  const slots = [-.9, -.3, .3, .9].map(dx => ({ x: CART.x + dx, busy: false }));
  const pick = a => a[Math.random() * a.length | 0];
  // buy(i): khách thứ i có mua không; think(i, mua): câu bong bóng (hoặc null)
  function crowd({ n = 8, every = 1.2, buy = .5, think = null, run = false, pool = CROWD, onSale = null }) {
    const my = ++crowdGen; let sold = 0;
    const alive = () => my === crowdGen;
    const one = async i => {
      await sleep(i * every * 1000 * (.7 + Math.random() * .6));
      if (!alive()) return;
      const side = Math.random() < .5 ? -1 : 1, lane = 2.5 + Math.random() * 1.3;
      const a = make(pick(pool)); a.speed = 1.2 + Math.random() * .35;
      a.o.position.set(side * 9.5, 0, lane);
      const wants = typeof buy === 'function' ? buy(i) : Math.random() < buy;
      const say = think ? think(i, wants) : null;
      const slot = wants && slots.find(s => !s.busy);
      if (slot) {
        slot.busy = true;
        await walkTo(a, slot.x + side * .4, lane - .6, run); if (!alive()) return remove(a);
        await walkTo(a, slot.x, CART.z + 1.15, run); if (!alive()) return remove(a);
        face(a, slot.x, CART.z); await play(a, 'Interact', true);
        giveCup(a); sold++; onSale && onSale(sold);
        if (say) bubble(a, say, 2200, 'happy');
        await play(a, 'Wave', true);
        slot.busy = false;
      } else {
        const gx = CART.x + (Math.random() - .5) * 2.4;
        await walkTo(a, gx, lane, run); if (!alive()) return remove(a);
        if (say) {
          face(a, CART.x, CART.z); play(a, wants ? 'Idle' : 'Idle_Neutral');
          await bubble(a, wants ? 'Đông quá, thôi…' : say, 2000);
          if (!alive()) return remove(a);
        }
      }
      await walkTo(a, -side * 10, lane + (Math.random() - .5), run);
      remove(a);
    };
    return Promise.all(Array.from({ length: n }, (_, i) => one(i))).then(() => sold);
  }
  function stopCrowd() {
    crowdGen++; slots.forEach(s => { s.busy = false; });
    for (const a of [...actors]) if (!Object.values(named).includes(a) && a !== hh) remove(a);
  }

  // Ông Hoàn Hảo đứng trước quán của ông
  let hh = null;
  function hhIdle() {
    if (!hh) { hh = make(CAST.hh); hh.o.position.set(8.4, 0, -.6); hh.o.rotation.y = -.9; }
    return hh;
  }
  const hhSay = (text, ms) => bubble(hhIdle(), text, ms, 'say');

  // ---------- chân dung (avatar 2D chụp từ model) ----------
  const PR = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  PR.setSize(160, 160); PR.outputEncoding = THREE.sRGBEncoding;
  const pScene = new THREE.Scene(), pCam = new THREE.PerspectiveCamera(24, 1, .1, 10);
  pScene.add(new THREE.HemisphereLight(0xffffff, 0x556070, 1.1));
  const pl = new THREE.DirectionalLight(0xffffff, .8); pl.position.set(1, 2, 3); pScene.add(pl);
  pCam.position.set(0, 1.66, 1.35); pCam.lookAt(0, 1.6, 0);
  const pCache = {};
  function portrait(id) {
    const key = CAST[id] || id;
    if (pCache[key]) return pCache[key];
    if (!GL[key]) return null;
    const o = THREE.SkeletonUtils.clone(GL[key].scene);
    const m = new THREE.AnimationMixer(o); m.clipAction(CLIPS[key[0]].find(c => c.name === 'Idle')).play(); m.update(.01);
    pScene.add(o); PR.render(pScene, pCam); pScene.remove(o);
    return (pCache[key] = PR.domElement.toDataURL());
  }

  // ---------- vòng lặp ----------
  function resize() {
    const w = innerWidth, h = innerHeight, asp = w / h;
    R.setSize(w, h, false); cam.aspect = asp;
    const far = asp < 1 ? 1 + (1 - asp) * 1.3 : 1;
    cam.position.set(3.4 * far, 4 * far, 12.5 * far); cam.lookAt(2.2, 1.6, 0);
    cam.updateProjectionMatrix();
  }
  addEventListener('resize', resize); resize();
  let t = 0;
  function loop() {
    const dt = Math.min(clock.getDelta(), .05) * tscale; t += dt; simT += dt;
    for (let i = timers.length - 1; i >= 0; i--) if (timers[i].at <= simT) timers.splice(i, 1)[0].r();
    for (const a of actors) {
      const tg = a.target, p = a.o.position;
      if (tg) {
        const dx = tg.x - p.x, dz = tg.z - p.z, d = Math.hypot(dx, dz), step = tg.speed * dt;
        a.faceTo = Math.atan2(dx, dz);
        if (d <= step) { p.x = tg.x; p.z = tg.z; a.target = null; play(a, 'Idle'); tg.res(); }
        else { p.x += dx / d * step; p.z += dz / d * step; }
      }
      if (a.faceTo !== undefined) {
        let da = a.faceTo - a.o.rotation.y; da = Math.atan2(Math.sin(da), Math.cos(da));
        a.o.rotation.y += da * Math.min(1, dt * 10);
      }
      a.mixer.update(dt);
    }
    cartLight.intensity = 1.5 + Math.sin(t * 3) * .08;
    placeBubbles();
    R.render(scene, cam);
    requestAnimationFrame(loop);
  }

  function start() { setPlace('ktx'); hhIdle(); loop(); }
  const setDormLights = f => { dormLit = f; drawDorm(); };

  const speed = k => { tscale = k; };
  return { load, start, speed, sleep, setSign, setRival, setPlace, setDormLights, you, enter, exit, act, sayOver, crowd, stopCrowd,
    hhSay, portrait, CAST, get named() { return named; } };
})();
