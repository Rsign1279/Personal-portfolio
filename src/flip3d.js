// "Flip" scene: glossy metal objects on dark pedestals, each one a link.
//   Coin   -> LinkedIn (spins on a coin stack)
//   Card   -> Résumé PDF (flips between a mini résumé and a download face)
//   Cube   -> GitHub (tumbles; faces engraved with GitHub, @, CV, in)
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const GITHUB_PATH = 'M12 1C5.923 1 1 5.923 1 12c0 4.867 3.149 8.979 7.521 10.436.55.096.756-.233.756-.522 0-.262-.013-1.128-.013-2.049-2.764.509-3.479-.674-3.699-1.292-.124-.317-.66-1.293-1.127-1.554-.385-.207-.936-.715-.014-.729.866-.014 1.485.797 1.691 1.128.99 1.663 2.571 1.196 3.204.907.096-.715.385-1.196.701-1.471-2.448-.275-5.005-1.224-5.005-5.432 0-1.196.426-2.186 1.128-2.956-.111-.275-.496-1.402.11-2.915 0 0 .921-.288 3.024 1.128a10.193 10.193 0 0 1 2.75-.371c.936 0 1.871.123 2.75.371 2.104-1.43 3.025-1.128 3.025-1.128.605 1.513.221 2.64.111 2.915.701.77 1.127 1.747 1.127 2.956 0 4.222-2.571 5.157-5.019 5.432.399.344.743 1.004.743 2.035 0 1.471-.014 2.654-.014 3.025 0 .289.206.632.756.522C19.851 20.979 23 16.854 23 12c0-6.077-4.922-11-11-11Z';

const METAL = '#cfd6ff';
const ENGRAVE = '#5d67b3';

function canvasTex(size, draw, { bump = false } = {}) {
  const c = document.createElement('canvas');
  c.width = size[0]; c.height = size[1];
  const ctx = c.getContext('2d');
  draw(ctx, c.width, c.height, bump);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = bump ? THREE.NoColorSpace : THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

// An engraved metal face: light metal with a darker recessed symbol (+ matching bump map).
function engraved(drawSymbol, { circle = false, rotate = 0 } = {}) {
  const make = (bump) => canvasTex([512, 512], (ctx, w, h) => {
    ctx.fillStyle = bump ? '#fff' : METAL;
    ctx.fillRect(0, 0, w, h);
    if (!bump) {
      // brushed-metal grain
      for (let i = 0; i < 900; i++) {
        ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.08})`;
        ctx.fillRect(0, Math.random() * h, w, 1);
      }
    }
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.rotate(rotate);
    ctx.translate(-w / 2, -h / 2);
    if (circle) {
      ctx.strokeStyle = bump ? '#000' : ENGRAVE;
      ctx.lineWidth = 14;
      ctx.beginPath(); ctx.arc(w / 2, h / 2, w * 0.42, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.fillStyle = bump ? '#000' : ENGRAVE;
    ctx.strokeStyle = bump ? '#000' : ENGRAVE;
    drawSymbol(ctx, w, h);
    ctx.restore();
  }, { bump });
  return { map: make(false), bumpMap: make(true) };
}

const sym = {
  linkedin(ctx, w, h) {
    ctx.font = `700 ${w * 0.5}px Geist, Arial, sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('in', w / 2, h / 2 + w * 0.02);
  },
  monogram(ctx, w, h) {
    ctx.font = `500 ${w * 0.36}px Unbounded, Arial, sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('RV', w / 2, h / 2 + w * 0.02);
  },
  github(ctx, w) {
    const s = w * 0.6 / 24;
    ctx.save();
    ctx.translate(w * 0.2, w * 0.2);
    ctx.scale(s, s);
    ctx.fill(new Path2D(GITHUB_PATH));
    ctx.restore();
  },
  at(ctx, w, h) {
    ctx.font = `500 ${w * 0.6}px Geist, Arial, sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('@', w / 2, h / 2 + w * 0.02);
  },
  cv(ctx, w, h) {
    ctx.font = `400 ${w * 0.36}px "Pixelify Sans", monospace`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('CV', w / 2, h / 2);
  },
  ai(ctx, w, h) {
    ctx.font = `300 ${w * 0.38}px Unbounded, Arial, sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('AI', w / 2, h / 2);
  },
};

// Résumé front: a miniature of the real one-page résumé.
function resumeFront() {
  return canvasTex([600, 776], (ctx, w, h) => {
    ctx.fillStyle = '#f7f8ff'; ctx.fillRect(0, 0, w, h);
    const pad = 44;
    ctx.fillStyle = '#111';
    ctx.textAlign = 'center';
    ctx.font = '700 40px Geist, Arial'; ctx.fillText('Rahul Viswanath', w / 2, 76);
    ctx.font = '400 15px Geist, Arial'; ctx.fillStyle = '#444';
    ctx.fillText('rahul.n.viswanath@gmail.com · linkedin.com/in/rahulnviswanath', w / 2, 104);
    ctx.textAlign = 'left';
    let y = 140;
    const section = (title, rows) => {
      ctx.fillStyle = '#111'; ctx.font = '700 17px Geist, Arial';
      ctx.fillText(title, pad, y); y += 8;
      ctx.fillRect(pad, y, w - pad * 2, 2); y += 22;
      for (const r of rows) {
        if (typeof r === 'string') {
          ctx.font = '600 14px Geist, Arial'; ctx.fillStyle = '#111'; ctx.fillText(r, pad, y); y += 18;
        } else {
          for (let i = 0; i < r; i++) {
            ctx.fillStyle = '#c3c8e6';
            ctx.fillRect(pad + 12, y - 8, (w - pad * 2 - 12) * (i === r - 1 ? 0.55 + Math.random() * 0.3 : 0.92 + Math.random() * 0.08), 6);
            y += 13;
          }
          y += 6;
        }
      }
      y += 6;
    };
    section('EDUCATION', ['Bentonville High School · GPA 4.42 · Rank 11/867', 1]);
    section('EXPERIENCE', [
      'Infrastructure Engineering Intern · Thorbole', 4,
      'Founder & Technical Lead · PATHOS', 4,
      'Chief AI Officer · EverGreen', 2,
      'Marketing Intern & Tech Lead · WIT+', 1,
    ]);
    section('AWARDS', ['10th Nationally · SkillsUSA NLSC 2026', 1]);
    section('SKILLS', ['Python · PyTorch · Computer Vision · MCP · CUDA', 2]);
  });
}

function resumeBack() {
  return canvasTex([600, 776], (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#dfe4ff'); g.addColorStop(1, '#9aa6ff');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#1b2266';
    ctx.textAlign = 'center';
    ctx.font = '400 120px "Pixelify Sans", monospace';
    ctx.fillText('CV', w / 2, h * 0.42);
    ctx.font = '600 38px Geist, Arial';
    ctx.fillText('Download résumé', w / 2, h * 0.58);
    ctx.font = '400 22px Geist, Arial';
    ctx.fillText('One page · PDF', w / 2, h * 0.64);
    ctx.lineWidth = 6; ctx.strokeStyle = '#1b2266';
    ctx.beginPath();
    ctx.moveTo(w / 2, h * 0.7); ctx.lineTo(w / 2, h * 0.82);
    ctx.moveTo(w / 2 - 28, h * 0.78); ctx.lineTo(w / 2, h * 0.82); ctx.lineTo(w / 2 + 28, h * 0.78);
    ctx.stroke();
  });
}

const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export async function initFlip(stage, labelLayer, links) {
  await document.fonts.ready;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  stage.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.55;

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);

  // Lights: cool key from upper left, blue rim from behind.
  const key = new THREE.DirectionalLight(0xdfe6ff, 2.6);
  key.position.set(-4, 9, 5);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6 });
  key.shadow.bias = -0.0005;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x4d6bff, 3);
  rim.position.set(4, 5, -6);
  scene.add(rim);
  scene.add(new THREE.HemisphereLight(0x6f86ff, 0x05060f, 0.6));

  // Pedestals
  const pedMat = new THREE.MeshStandardMaterial({ color: 0x14182e, metalness: 0.75, roughness: 0.32 });
  const pedestal = (w, h, d, x, z) => {
    const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, 0.04), pedMat);
    m.position.set(x, h / 2, z);
    m.castShadow = true; m.receiveShadow = true;
    scene.add(m);
    return h;
  };
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.ShadowMaterial({ opacity: 0.55, color: 0x000010 }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const hA = pedestal(2.2, 1.3, 2.2, -2.0, 0.1);   // cube
  const hB = pedestal(2.2, 2.4, 2.2, 1.35, -0.9);  // coin
  const hC = pedestal(2.2, 0.55, 1.9, -0.15, 2.2); // résumé card

  const metal = (opts = {}) => new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 1, roughness: 0.22, bumpScale: 2.2, ...opts });
  const edgeMetal = metal({ color: 0xc6ceff, roughness: 0.28 });

  // ---- Cube (GitHub) ------------------------------------------------------
  const faces = [sym.github, sym.at, sym.cv, sym.ai, sym.linkedin, sym.monogram].map((s) => {
    const t = engraved(s);
    return metal({ map: t.map, bumpMap: t.bumpMap });
  });
  const cube = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.1, 1.1), faces);
  cube.castShadow = true;
  cube.userData = { href: links.github, label: 'GitHub' };
  const cubeBase = new THREE.Vector3(-2.0, hA + 0.55, 0.1);
  cube.position.copy(cubeBase);
  scene.add(cube);

  // ---- Coin stack + spinning coin (LinkedIn) ------------------------------
  const R = 0.62;
  for (let i = 0; i < 4; i++) {
    const s = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.98, R * 0.98, 0.09, 64), edgeMetal);
    s.position.set(1.35 + (i % 2 ? 0.02 : -0.02), hB + 0.045 + i * 0.092, -0.9 + (i % 2 ? -0.015 : 0.015));
    s.castShadow = true; s.receiveShadow = true;
    scene.add(s);
  }
  const front = engraved(sym.linkedin, { circle: true, rotate: -Math.PI / 2 });
  const back = engraved(sym.monogram, { circle: true, rotate: -Math.PI / 2 });
  const coinGeo = new THREE.CylinderGeometry(R, R, 0.11, 72);
  coinGeo.rotateX(Math.PI / 2); // caps face ±Z
  const coin = new THREE.Mesh(coinGeo, [
    edgeMetal,
    metal({ map: front.map, bumpMap: front.bumpMap }),
    metal({ map: back.map, bumpMap: back.bumpMap }),
  ]);
  coin.castShadow = true;
  coin.userData = { href: links.linkedin, label: 'LinkedIn' };
  const coinBase = new THREE.Vector3(1.35, hB + 4 * 0.092 + R + 0.02, -0.9);
  coin.position.copy(coinBase);
  scene.add(coin);

  // ---- Résumé card --------------------------------------------------------
  const cardW = 1.05, cardH = 1.36;
  const card = new THREE.Mesh(new RoundedBoxGeometry(cardW, cardH, 0.05, 2, 0.02), edgeMetal);
  // RoundedBoxGeometry has no face groups, so the two faces are thin planes on top.
  const faceF = new THREE.Mesh(new THREE.PlaneGeometry(cardW * 0.94, cardH * 0.95), new THREE.MeshStandardMaterial({ map: resumeFront(), roughness: 0.55, metalness: 0.05 }));
  faceF.position.z = 0.0265;
  const faceB = new THREE.Mesh(new THREE.PlaneGeometry(cardW * 0.94, cardH * 0.95), new THREE.MeshStandardMaterial({ map: resumeBack(), roughness: 0.3, metalness: 0.35 }));
  faceB.position.z = -0.0265;
  faceB.rotation.y = Math.PI;
  const cardGroup = new THREE.Group();
  cardGroup.add(card, faceF, faceB);
  card.castShadow = true;
  const cardBase = new THREE.Vector3(-0.15, hC + cardH / 2 + 0.08, 2.2);
  cardGroup.position.copy(cardBase);
  cardGroup.rotation.y = -0.35;
  for (const m of [card, faceF, faceB]) m.userData = { href: links.resume, label: 'Résumé' };
  scene.add(cardGroup);

  // ---- labels -------------------------------------------------------------
  const targets = [
    { obj: coin, label: 'LinkedIn', sub: 'Coin · spins', offset: new THREE.Vector3(0, R + 0.35, 0), href: links.linkedin },
    { obj: cube, label: 'GitHub', sub: 'Cube · tumbles', offset: new THREE.Vector3(0, 0.95, 0), href: links.github },
    { obj: cardGroup, label: 'Résumé', sub: 'Card · flips', offset: new THREE.Vector3(0, cardH / 2 + 0.3, 0), href: links.resume },
  ];
  for (const t of targets) {
    const a = document.createElement('a');
    a.className = 'flip-label';
    a.href = t.href;
    if (!t.href.startsWith('/')) { a.target = '_blank'; a.rel = 'noopener'; }
    a.innerHTML = `<strong>${t.label} ↗</strong><span>${t.sub}</span>`;
    labelLayer.appendChild(a);
    t.el = a;
  }

  // ---- sizing -------------------------------------------------------------
  const target = new THREE.Vector3(-0.1, 3.35, 0.4);
  function resize() {
    const w = stage.clientWidth, h = stage.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Pull back on narrow screens so all three objects stay in frame.
    const narrow = Math.max(1, 1.35 / camera.aspect);
    const dist = 15.5 * Math.pow(narrow, 0.62);
    const aim = target.clone();
    aim.y += (narrow - 1) * 1.15; // tall screens: push the objects lower, below the copy
    const dir = new THREE.Vector3(0.62, 0.52, 1).normalize();
    camera.position.copy(aim).addScaledVector(dir, dist);
    camera.lookAt(aim);
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(stage);
  resize();

  // ---- interaction --------------------------------------------------------
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2(9, 9);
  const pickables = [coin, cube, card, faceF, faceB];
  let hovered = null;
  const pointer = { x: 0, y: 0 };
  stage.addEventListener('pointermove', (e) => {
    const r = stage.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    pointer.x = ndc.x; pointer.y = ndc.y;
  });
  stage.addEventListener('pointerleave', () => { ndc.set(9, 9); pointer.x = 0; pointer.y = 0; });
  stage.addEventListener('click', () => {
    if (!hovered) return;
    const href = hovered.userData.href;
    if (href.startsWith('/')) window.open(href, '_blank');
    else window.open(href, '_blank', 'noopener');
  });

  // ---- animation ----------------------------------------------------------
  let visible = false;
  new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; }, { rootMargin: '120px' }).observe(stage);
  const clock = new THREE.Clock();
  const v = new THREE.Vector3();
  let coinSpin = 0, cubeSpin = 0, hoverAmt = { coin: 0, cube: 0, card: 0 };

  renderer.setAnimationLoop(() => {
    if (!visible) { clock.getDelta(); return; }
    const dt = Math.min(0.05, clock.getDelta());
    const t = clock.elapsedTime;
    const speed = reduced ? 0.25 : 1;

    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(pickables, false)[0];
    hovered = hit ? hit.object : null;
    stage.style.cursor = hovered ? 'pointer' : '';
    const hv = hovered?.userData.label;
    for (const [k, name] of [['coin', 'LinkedIn'], ['cube', 'GitHub'], ['card', 'Résumé']]) {
      hoverAmt[k] += ((hv === name ? 1 : 0) - hoverAmt[k]) * Math.min(1, dt * 8);
    }

    // Coin: spins on its stack like the reference, faster on hover.
    coinSpin += dt * (1.6 + hoverAmt.coin * 5) * speed;
    coin.rotation.y = coinSpin;
    coin.position.y = coinBase.y + Math.sin(t * 2) * 0.03 + hoverAmt.coin * 0.12;

    // Cube: slow tumble with a gentle bob.
    cubeSpin += dt * (0.5 + hoverAmt.cube * 2.4) * speed;
    cube.rotation.set(0.35 + Math.sin(cubeSpin * 0.7) * 0.35, cubeSpin, Math.sin(cubeSpin * 0.5) * 0.18);
    cube.position.y = cubeBase.y + 0.12 + Math.sin(t * 1.4) * 0.07 + hoverAmt.cube * 0.15;

    // Card: hold, flip, hold, flip back. Hover holds it on the download side.
    const cycle = 5.2, flipT = 0.9;
    const ph = (t * speed) % cycle;
    let side;
    if (ph < cycle / 2 - flipT) side = 0;
    else if (ph < cycle / 2) side = ease((ph - (cycle / 2 - flipT)) / flipT);
    else if (ph < cycle - flipT) side = 1;
    else side = 1 - ease((ph - (cycle - flipT)) / flipT);
    cardGroup.userData.side = THREE.MathUtils.lerp(cardGroup.userData.side ?? 0, hoverAmt.card > 0.5 ? 1 : side, hoverAmt.card > 0.5 ? dt * 6 : 1);
    cardGroup.rotation.y = -0.35 + cardGroup.userData.side * Math.PI;
    cardGroup.rotation.x = -0.06;
    cardGroup.position.y = cardBase.y + Math.sin(t * 1.8 + 1) * 0.04 + hoverAmt.card * 0.12;

    // Subtle parallax with the pointer.
    scene.rotation.y += ((pointer.x * 0.08) - scene.rotation.y) * Math.min(1, dt * 3);

    renderer.render(scene, camera);

    // Labels follow their objects.
    const w = stage.clientWidth, h = stage.clientHeight;
    for (const tg of targets) {
      v.copy(tg.obj.position).add(tg.offset);
      scene.localToWorld(v);
      v.project(camera);
      tg.el.style.transform = `translate(${(v.x * 0.5 + 0.5) * w}px, ${(-v.y * 0.5 + 0.5) * h}px) translate(-50%, -100%)`;
    }
  });
}
