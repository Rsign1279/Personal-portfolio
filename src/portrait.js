import { ParticleField, fitCanvas, loopWhileVisible, reducedMotion } from './particles.js';

// Pixel-particle portrait sampled from a background-removed photo.
export function initPortrait(canvas, src, { region, surface }) {
  const img = new Image();
  img.src = src;

  let field = null;
  let buckets = [];     // [{ color, idx: Int32Array }]
  let size = 4;         // drawn square size
  let hit = null;       // { mask, cols, rows, step, x0, y0 } for click tests
  let w = 0, h = 0;
  let first = true;

  function build() {
    const fit = fitCanvas(canvas);
    w = fit.w; h = fit.h;
    if (!img.complete || !img.naturalWidth) return;

    // The figure sits inside `region` (anchored to its bottom, centred); the canvas
    // itself covers the whole hero so exploding particles are never clipped.
    const cr = canvas.getBoundingClientRect();
    const rr = region.getBoundingClientRect();
    const rx = rr.left - cr.left, ry = rr.top - cr.top;
    const aspect = img.naturalWidth / img.naturalHeight;
    let dh = rr.height, dw = dh * aspect;
    if (dw > rr.width) { dw = rr.width; dh = dw / aspect; }
    const x0 = rx + (rr.width - dw) / 2, y0 = ry + rr.height - dh;

    // Grid step: chunky enough to read as pixels, fine enough to keep the likeness.
    const step = Math.max(3, Math.min(4.6, dh / 140));
    const cols = Math.floor(dw / step), rows = Math.floor(dh / step);

    const off = document.createElement('canvas');
    off.width = cols; off.height = rows;
    const octx = off.getContext('2d', { willReadFrequently: true });
    octx.imageSmoothingEnabled = true;
    octx.imageSmoothingQuality = 'high';
    octx.drawImage(img, 0, 0, cols, rows);
    const data = octx.getImageData(0, 0, cols, rows).data;

    const homes = [];
    const groups = new Map();
    const mask = new Uint8Array(cols * rows);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const o = (r * cols + c) * 4;
        if (data[o + 3] < 140) continue;
        mask[r * cols + c] = 1;
        // Posterize a touch for the pixel-art look, with a slight contrast lift.
        const q = (v) => {
          const c = Math.min(255, Math.max(0, (v - 128) * 1.08 + 128));
          return Math.min(255, Math.round(c / 10) * 10);
        };
        const key = `rgb(${q(data[o])},${q(data[o + 1])},${q(data[o + 2])})`;
        const id = homes.length / 2;
        homes.push(x0 + c * step + step / 2, y0 + r * step + step / 2);
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(id);
      }
    }

    const n = homes.length / 2;
    const prev = field;
    field = new ParticleField(n);
    field.radius = Math.max(42, Math.min(70, dh * 0.11));
    for (let i = 0; i < n; i++) { field.hx[i] = homes[i * 2]; field.hy[i] = homes[i * 2 + 1]; }
    if (first && !reducedMotion) { field.scatter(Math.max(w, h) * 0.9); first = false; }
    else if (prev) field.pointer = prev.pointer;

    buckets = [...groups].map(([color, ids]) => ({ color, idx: Int32Array.from(ids) }));
    size = Math.max(2, step - 0.55);
    hit = { mask, cols, rows, step, x0, y0 };
  }

  function isOnFigure(x, y) {
    if (!hit) return false;
    const c = Math.floor((x - hit.x0) / hit.step);
    const r = Math.floor((y - hit.y0) / hit.step);
    for (let dr = -2; dr <= 2; dr++) for (let dc = -2; dc <= 2; dc++) {
      const cc = c + dc, rr = r + dr;
      if (cc >= 0 && rr >= 0 && cc < hit.cols && rr < hit.rows && hit.mask[rr * hit.cols + cc]) return true;
    }
    return false;
  }

  function local(e) {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  // The canvas ignores pointer events (so links underneath stay clickable);
  // we listen on the surrounding section instead.
  surface.addEventListener('pointermove', (e) => {
    if (!field) return;
    const p = local(e);
    field.setPointer(p.x, p.y, true);
    region.style.cursor = isOnFigure(p.x, p.y) ? 'pointer' : '';
  });
  surface.addEventListener('pointerleave', () => field?.setPointer(-1e5, -1e5, false));
  surface.addEventListener('pointerdown', (e) => {
    if (!field || e.target.closest('a, button')) return;
    const p = local(e);
    if (isOnFigure(p.x, p.y)) explodeAt(p.x, p.y);
  });

  function explodeAt(x, y) {
    if (!field) return;
    field.explode(x, y, Math.max(60, Math.min(110, h * 0.16)));
  }

  img.onload = build;
  if (img.complete) build();
  const ro = new ResizeObserver(build);
  ro.observe(canvas);
  ro.observe(region);

  loopWhileVisible(canvas, (dt) => {
    if (!field) return;
    field.step(dt);
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, w, h);
    const { hx, hy, ox, oy } = field;
    const s = size, half = s / 2;
    for (const b of buckets) {
      ctx.fillStyle = b.color;
      const idx = b.idx;
      for (let j = 0; j < idx.length; j++) {
        const i = idx[j];
        ctx.fillRect(hx[i] + ox[i] - half, hy[i] + oy[i] - half, s, s);
      }
    }
  });

  return {
    // Explode from the middle of the figure (used by the badge button).
    explode() {
      if (!hit) return;
      explodeAt(hit.x0 + (hit.cols * hit.step) / 2, hit.y0 + hit.rows * hit.step * 0.4);
    },
  };
}
