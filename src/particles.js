// Shared particle physics used by the portrait and the globe.
// Every particle has a "home" (set by its owner each frame) and an offset from
// that home. The offset is driven by a stiff, damped spring, so particles snap
// back fast and fluidly after the cursor pushes them or a click blows them apart.

export class ParticleField {
  constructor(count) {
    this.n = count;
    this.hx = new Float32Array(count); // home x (css px)
    this.hy = new Float32Array(count); // home y
    this.ox = new Float32Array(count); // offset from home
    this.oy = new Float32Array(count);
    this.vx = new Float32Array(count);
    this.vy = new Float32Array(count);
    this.active = new Uint8Array(count).fill(1); // 0 = ignore (e.g. far side of globe)

    this.stiffness = 0.085;
    this.damping = 0.8;
    this.burst = 0; // frames of looser damping after an explosion
    this.pointer = { x: -1e5, y: -1e5, inside: false };
    this.radius = 60;
    this.push = 2.4;
  }

  setPointer(x, y, inside) {
    this.pointer.x = x;
    this.pointer.y = y;
    this.pointer.inside = inside;
  }

  // Scatter every particle away from (cx, cy).
  explode(cx, cy, power = 46) {
    const { n, hx, hy, ox, oy, vx, vy } = this;
    for (let i = 0; i < n; i++) {
      let dx = hx[i] + ox[i] - cx;
      let dy = hy[i] + oy[i] - cy;
      let d = Math.hypot(dx, dy) || 1;
      dx /= d; dy /= d;
      const a = (Math.random() - 0.5) * 0.9; // a little angular spread
      const ca = Math.cos(a), sa = Math.sin(a);
      const ex = dx * ca - dy * sa;
      const ey = dx * sa + dy * ca;
      const s = power * (0.35 + Math.random() * 0.9) * (0.6 + Math.min(1, 140 / (d + 40)));
      vx[i] += ex * s;
      vy[i] += ey * s;
    }
    this.burst = 14;
  }

  // Random starting offsets so particles assemble on load.
  scatter(spread) {
    for (let i = 0; i < this.n; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = spread * (0.3 + Math.random());
      this.ox[i] = Math.cos(a) * r;
      this.oy[i] = Math.sin(a) * r;
      this.vx[i] = 0;
      this.vy[i] = 0;
    }
  }

  step(dtScale = 1) {
    const { n, hx, hy, ox, oy, vx, vy, active } = this;
    const f = Math.min(2.5, Math.max(0.25, dtScale));
    const k = this.stiffness * f * (this.burst > 0 ? 0.35 : 1);
    const damp = Math.pow(this.burst > 0 ? 0.86 : this.damping, f);
    if (this.burst > 0) this.burst -= f;

    const p = this.pointer;
    const R = this.radius, R2 = R * R;
    const push = this.push * f;
    const usePointer = p.inside;

    for (let i = 0; i < n; i++) {
      if (!active[i]) { ox[i] *= 0.9; oy[i] *= 0.9; vx[i] = 0; vy[i] = 0; continue; }
      if (usePointer) {
        const dx = hx[i] + ox[i] - p.x;
        const dy = hy[i] + oy[i] - p.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < R2) {
          const d = Math.sqrt(d2) || 0.001;
          const s = (1 - d / R) * push;
          vx[i] += (dx / d) * s * 3;
          vy[i] += (dy / d) * s * 3;
        }
      }
      vx[i] = (vx[i] - ox[i] * k) * damp;
      vy[i] = (vy[i] - oy[i] * k) * damp;
      ox[i] += vx[i] * f;
      oy[i] += vy[i] * f;
    }
  }
}

// Canvas helper: sizes a canvas to its CSS box with a capped device pixel ratio.
export function fitCanvas(canvas) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const rect = canvas.getBoundingClientRect();
  const w = Math.max(1, Math.round(rect.width));
  const h = Math.max(1, Math.round(rect.height));
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w, h, dpr };
}

// Runs `frame(dtScale, time)` only while `el` is on screen.
export function loopWhileVisible(el, frame) {
  let raf = 0, last = 0, visible = false;
  const tick = (t) => {
    const dt = last ? (t - last) / (1000 / 60) : 1;
    last = t;
    frame(dt, t);
    raf = visible ? requestAnimationFrame(tick) : 0;
  };
  const io = new IntersectionObserver((entries) => {
    visible = entries[entries.length - 1].isIntersecting;
    if (visible && !raf) { last = 0; raf = requestAnimationFrame(tick); }
  }, { rootMargin: '100px' });
  io.observe(el);
}

export const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
