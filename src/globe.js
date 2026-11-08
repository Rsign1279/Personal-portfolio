import { ParticleField, fitCanvas, loopWhileVisible, reducedMotion } from './particles.js';
import landRaw from './data/land.json';

const DEG = Math.PI / 180;
const TILT = 0.38; // tip the north pole toward the viewer

function toVec(lat, lon) {
  const la = lat * DEG, lo = lon * DEG;
  return [Math.cos(la) * Math.sin(lo), Math.sin(la), Math.cos(la) * Math.cos(lo)];
}

function slerp(a, b, t) {
  const dot = Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]));
  const om = Math.acos(dot);
  if (om < 1e-4) return a.slice();
  const s = Math.sin(om);
  const k1 = Math.sin((1 - t) * om) / s, k2 = Math.sin(t * om) / s;
  return [a[0] * k1 + b[0] * k2, a[1] * k1 + b[1] * k2, a[2] * k1 + b[2] * k2];
}

// Rotated + tilted 3D point -> [x, y, z] in unit-sphere view space (z toward viewer).
function rotate(v, rot, out) {
  const c = Math.cos(rot), s = Math.sin(rot);
  const x = v[0] * c + v[2] * s;
  const z1 = -v[0] * s + v[2] * c;
  const ct = Math.cos(TILT), st = Math.sin(TILT);
  out[0] = x;
  out[1] = v[1] * ct - z1 * st;
  out[2] = v[1] * st + z1 * ct;
  return out;
}

export function initGlobe(canvas, labelLayer, { pins, reach, home = 'bentonville' }) {
  // ---- points -------------------------------------------------------------
  const land = [];
  for (let i = 0; i < landRaw.length; i += 2) land.push(toVec(landRaw[i], landRaw[i + 1]));

  const OCEAN = 2600;
  const ocean = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < OCEAN; i++) {
    const y = 1 - (i / (OCEAN - 1)) * 2, r = Math.sqrt(1 - y * y), t = golden * i;
    ocean.push([Math.cos(t) * r, y, Math.sin(t) * r]);
  }
  const pts = land.concat(ocean);
  const nLand = land.length;
  const field = new ParticleField(pts.length);
  field.radius = 56;
  field.push = 2.2;
  // Small per-point brightness noise reads like cloud cover / terrain.
  const tone = new Float32Array(pts.length).map(() => Math.random());
  const depth = new Float32Array(pts.length);

  // ---- pins, arcs, labels -------------------------------------------------
  const homePin = pins.find((p) => p.id === home);
  const homeVec = toVec(homePin.lat, homePin.lon);
  const pinData = pins.map((p) => ({ ...p, v: toVec(p.lat, p.lon), screen: [0, 0, 0] }));
  const arcs = [];
  const makeArc = (to, labelled) => {
    const b = toVec(to[0], to[1]);
    const ang = Math.acos(Math.max(-1, Math.min(1, homeVec[0] * b[0] + homeVec[1] * b[1] + homeVec[2] * b[2])));
    const lift = Math.min(0.22, 0.06 + ang * 0.12);
    const seg = 48;
    const path = [];
    for (let i = 0; i <= seg; i++) {
      const t = i / seg;
      const v = slerp(homeVec, b, t);
      const h = 1 + lift * Math.sin(Math.PI * t);
      path.push([v[0] * h, v[1] * h, v[2] * h]);
    }
    arcs.push({ path, labelled, speed: 0.00018 + Math.random() * 0.00016, phase: Math.random() });
  };
  pins.filter((p) => p.id !== home).forEach((p) => makeArc([p.lat, p.lon], true));
  reach.forEach((r) => makeArc(r, false));

  // DOM labels
  const labelEls = pinData.map((p) => {
    const el = document.createElement('div');
    el.className = `globe-label side-${p.side}`;
    el.innerHTML = `<span class="gl-kicker">${p.kicker}</span><strong>${p.title}</strong><span class="gl-body">${p.body}</span>`;
    labelLayer.appendChild(el);
    return el;
  });

  // ---- layout -------------------------------------------------------------
  let w = 0, h = 0, cx = 0, cy = 0, R = 0;
  let slots = [];
  function layout() {
    const fit = fitCanvas(canvas);
    w = fit.w; h = fit.h;
    const narrow = w < 820;
    canvas.parentElement.classList.toggle('narrow', narrow);
    const size = labelEls.map((el) => [el.offsetWidth || 200, el.offsetHeight || 80]);
    const cl = (x, y, i) => [
      Math.max(10, Math.min(w - size[i][0] - 10, x)),
      Math.max(10, Math.min(h - size[i][1] - 10, y)),
    ];
    if (narrow) {
      R = Math.min(w * 0.42, h * 0.3);
      cx = w * 0.5; cy = h * 0.5;
      field.radius = Math.max(34, R * 0.2);
      slots = size.map(([lw, lh], i) => cl(
        i % 2 ? w - lw - 12 : 12,
        i < 2 ? cy - R - lh - 34 : cy + R + 34, i));
    } else {
      R = Math.min(h * 0.36, w * 0.27);
      cx = w * 0.63; cy = h * 0.5;
      field.radius = Math.max(40, R * 0.16);
      slots = [
        cl(cx - R * 0.8 - size[0][0] / 2, cy - R - size[0][1] - 22, 0),
        cl(cx + R + 18, cy - R * 0.5, 1),
        cl(cx - R * 0.75 - size[2][0] / 2, cy + R + 22, 2),
        cl(cx + R * 0.45, cy - R - size[3][1] - 22, 3),
      ];
    }
    labelEls.forEach((el, i) => {
      const [x, y] = slots[i % slots.length];
      el.style.transform = `translate(${x}px, ${y}px)`;
    });
  }
  new ResizeObserver(layout).observe(canvas);
  layout();

  // ---- interaction --------------------------------------------------------
  const local = (e) => {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const onGlobe = (p) => Math.hypot(p.x - cx, p.y - cy) < R * 1.04;
  canvas.addEventListener('pointermove', (e) => {
    const p = local(e);
    field.setPointer(p.x, p.y, true);
    canvas.style.cursor = onGlobe(p) ? 'pointer' : 'default';
  });
  canvas.addEventListener('pointerleave', () => field.setPointer(-1e5, -1e5, false));
  canvas.addEventListener('pointerdown', (e) => {
    const p = local(e);
    if (onGlobe(p)) field.explode(p.x, p.y, Math.max(44, R * 0.2));
  });

  // ---- render -------------------------------------------------------------
  // Start just east of home so North America swings into view.
  let rot = -homePin.lon * DEG - 0.55;
  const tmp = [0, 0, 0];

  function project(v, out) {
    rotate(v, rot, tmp);
    out[0] = cx + tmp[0] * R;
    out[1] = cy - tmp[1] * R;
    out[2] = tmp[2];
    return out;
  }

  loopWhileVisible(canvas, (dt, time) => {
    const ctx = canvas.getContext('2d');
    // Ease the spin while home base faces the viewer so the callouts can be read.
    rotate(homeVec, rot, tmp);
    const facing = Math.max(0, tmp[2]);
    const base = reducedMotion ? 0.0006 : 0.0032;
    rot += base * (1 - 0.82 * facing * facing) * Math.min(2.5, dt);

    // Homes for this frame
    const { hx, hy, ox, oy, active } = field;
    for (let i = 0; i < pts.length; i++) {
      rotate(pts[i], rot, tmp);
      hx[i] = cx + tmp[0] * R;
      hy[i] = cy - tmp[1] * R;
      depth[i] = tmp[2];
      active[i] = tmp[2] > -0.05 ? 1 : 0;
    }
    field.step(dt);

    ctx.clearRect(0, 0, w, h);

    // Deep glow behind the planet
    const glow = ctx.createRadialGradient(cx, cy, R * 0.6, cx, cy, R * 1.9);
    glow.addColorStop(0, 'rgba(40, 90, 255, 0.55)');
    glow.addColorStop(0.45, 'rgba(25, 60, 220, 0.18)');
    glow.addColorStop(1, 'rgba(10, 20, 80, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);

    // Planet body: lit from the upper left like the reference
    const body = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.1, cx, cy, R);
    body.addColorStop(0, '#2f6bff');
    body.addColorStop(0.55, '#1238c9');
    body.addColorStop(1, '#06135a');
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fillStyle = body;
    ctx.fill();

    // Ocean particles (dim), then land particles (bright)
    ctx.fillStyle = 'rgb(120, 160, 255)';
    for (let i = nLand; i < pts.length; i++) {
      const z = depth[i];
      if (z <= 0) continue;
      ctx.globalAlpha = 0.12 + z * 0.22;
      const s = 0.9 + z * 0.9;
      ctx.fillRect(hx[i] + ox[i] - s / 2, hy[i] + oy[i] - s / 2, s, s);
    }
    for (let i = 0; i < nLand; i++) {
      const z = depth[i];
      if (z <= 0) continue;
      const lit = 0.35 + z * 0.65;
      const t = tone[i];
      ctx.globalAlpha = Math.min(1, lit * (0.7 + t * 0.45));
      ctx.fillStyle = t > 0.82 ? '#ffffff' : t > 0.4 ? '#cfe0ff' : '#8fb3ff';
      const s = (R / 230) * (1.3 + z * 1.1);
      ctx.fillRect(hx[i] + ox[i] - s / 2, hy[i] + oy[i] - s / 2, s, s);
    }
    ctx.globalAlpha = 1;

    // Atmosphere rim
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, R * 1.004, 0, Math.PI * 2);
    ctx.lineWidth = Math.max(2, R * 0.012);
    ctx.strokeStyle = 'rgba(255, 214, 150, 0.85)';
    ctx.shadowColor = 'rgba(255, 200, 120, 0.9)';
    ctx.shadowBlur = R * 0.08;
    ctx.stroke();
    ctx.restore();
    const rim = ctx.createRadialGradient(cx, cy, R * 0.92, cx, cy, R * 1.12);
    rim.addColorStop(0, 'rgba(130, 180, 255, 0)');
    rim.addColorStop(0.45, 'rgba(160, 200, 255, 0.35)');
    rim.addColorStop(1, 'rgba(60, 110, 255, 0)');
    ctx.fillStyle = rim;
    ctx.beginPath();
    ctx.arc(cx, cy, R * 1.12, 0, Math.PI * 2);
    ctx.fill();

    // Arcs with travelling pulses
    const pt = [0, 0, 0];
    const visible = (q) => q[2] > 0 || Math.hypot(q[0] - cx, q[1] - cy) > R;
    ctx.lineCap = 'round';
    for (const a of arcs) {
      ctx.beginPath();
      let pen = false;
      for (const v of a.path) {
        project(v, pt);
        if (visible(pt)) {
          if (!pen) { ctx.moveTo(pt[0], pt[1]); pen = true; } else ctx.lineTo(pt[0], pt[1]);
        } else pen = false;
      }
      ctx.strokeStyle = a.labelled ? 'rgba(255,255,255,0.75)' : 'rgba(190,215,255,0.35)';
      ctx.lineWidth = a.labelled ? 1.4 : 1;
      ctx.stroke();

      const t = ((time * a.speed) + a.phase) % 1;
      const v = a.path[Math.floor(t * (a.path.length - 1))];
      project(v, pt);
      if (visible(pt)) {
        ctx.beginPath();
        ctx.arc(pt[0], pt[1], a.labelled ? 3 : 2.2, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.shadowColor = '#9cc2ff';
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    // Pins + callout leader lines
    const pulse = (time % 1600) / 1600;
    pinData.forEach((p, i) => {
      const s = project(p.v, p.screen);
      const vis = Math.max(0, Math.min(1, (s[2] - 0.05) * 4));
      const el = labelEls[i];
      el.style.opacity = vis.toFixed(3);
      el.style.pointerEvents = vis > 0.5 ? 'auto' : 'none';
      if (vis <= 0) return;

      ctx.globalAlpha = vis;
      ctx.beginPath();
      ctx.arc(s[0], s[1], 4, 0, Math.PI * 2);
      ctx.fillStyle = p.id === 'waterloo' ? '#ffd76a' : '#ffffff';
      ctx.shadowColor = '#bcd4ff';
      ctx.shadowBlur = 14;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(s[0], s[1], 4 + pulse * 14, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255,255,255,${(1 - pulse) * 0.7})`;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Leader line from the pin to the nearest point on its callout
      const [lx, ly] = slots[i % slots.length];
      const lw = el.offsetWidth, lh = el.offsetHeight;
      const ax = Math.max(lx, Math.min(lx + lw, s[0]));
      const ay = Math.max(ly, Math.min(ly + lh, s[1]));
      if (ax !== s[0] || ay !== s[1]) {
        ctx.beginPath();
        ctx.moveTo(s[0], s[1]);
        ctx.lineTo(ax, ay);
        ctx.strokeStyle = 'rgba(255,255,255,0.6)';
        ctx.setLineDash([3, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.arc(ax, ay, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    });
  });
}
