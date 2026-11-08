// Draggable mind map of projects and goals, connected with elbow lines.

const ICONS = {
  pulse: '<path d="M3 12h4l2-5 4 10 2-5h6"/>',
  leaf: '<path d="M5 19c0-8 6-14 15-14 0 9-6 15-14 15"/><path d="M5 19l7-7"/>',
  search: '<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/>',
  plug: '<path d="M9 3v5M15 3v5M6 8h12v3a6 6 0 0 1-12 0zM12 17v4"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  chip: '<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/>',
  spark: '<path d="M12 3v5M12 16v5M3 12h5M16 12h5M6 6l3 3M15 15l3 3M18 6l-3 3M9 15l-3 3"/>',
  flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
  heart: '<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
  bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
};

const icon = (name, color) => {
  const dark = color === '#111111';
  return `<span class="mm-icon" style="background:${color};color:${dark ? '#fff' : '#111'}">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ''}</svg>
  </span>`;
};

// Mobile layout: core on top, others in two columns.
function mobilePositions(nodes) {
  const pos = {};
  const rest = nodes.filter((n) => n.type !== 'core');
  const projects = rest.filter((n) => n.type === 'project');
  const goals = rest.filter((n) => n.type === 'goal');
  const order = [...goals, ...projects];
  const rows = Math.ceil(order.length / 2);
  pos.me = { x: 50, y: 4 };
  order.forEach((n, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    pos[n.id] = { x: col ? 74 : 26, y: 14 + (row / Math.max(1, rows - 1)) * 82 };
  });
  return pos;
}

function curve(a, b) {
  const dx = b.x - a.x, dy = b.y - a.y;
  if (Math.abs(dx) >= Math.abs(dy)) {
    return `M${a.x},${a.y} C${a.x + dx * 0.5},${a.y} ${b.x - dx * 0.5},${b.y} ${b.x},${b.y}`;
  }
  return `M${a.x},${a.y} C${a.x},${a.y + dy * 0.5} ${b.x},${b.y - dy * 0.5} ${b.x},${b.y}`;
}

export function initMindMap(root, { nodes, edges }) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.classList.add('mm-lines');
  root.appendChild(svg);

  const els = {};
  const custom = {}; // dragged positions (in %), per layout
  for (const n of nodes) {
    const el = document.createElement('div');
    el.className = `mm-node mm-${n.type}`;
    el.dataset.id = n.id;
    if (n.type === 'core') {
      el.innerHTML = `<span class="mm-core-dot"></span><strong>${n.title}</strong><span>${n.sub}</span>`;
    } else {
      el.innerHTML = `
        <div class="mm-head">${icon(n.icon, n.color)}
          <div><strong>${n.title}</strong><span class="mm-sub">${n.sub}</span></div>
          ${n.type === 'goal' ? '<span class="mm-badge">Goal</span>' : ''}
        </div>
        <p>${n.body}</p>`;
    }
    root.appendChild(el);
    els[n.id] = el;
  }

  const paths = edges.map(([a, b]) => {
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.dataset.a = a; p.dataset.b = b;
    if (a !== 'me' && b !== 'me') p.classList.add('mm-cross');
    svg.appendChild(p);
    return p;
  });

  let mobile = false;
  let base = {};

  function pos(id) {
    const key = mobile ? 'm' : 'd';
    return custom[key]?.[id] || base[id];
  }

  function render() {
    const W = root.clientWidth, H = root.clientHeight;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    for (const n of nodes) {
      const p = pos(n.id);
      els[n.id].style.left = `${p.x}%`;
      els[n.id].style.top = `${p.y}%`;
    }
    for (const path of paths) {
      const a = pos(path.dataset.a), b = pos(path.dataset.b);
      path.setAttribute('d', curve({ x: (a.x / 100) * W, y: (a.y / 100) * H }, { x: (b.x / 100) * W, y: (b.y / 100) * H }));
    }
  }

  function relayout() {
    mobile = root.clientWidth < 760;
    base = mobile ? mobilePositions(nodes) : Object.fromEntries(nodes.map((n) => [n.id, { x: n.x, y: n.y }]));
    render();
  }
  new ResizeObserver(relayout).observe(root);
  relayout();

  // Highlight the connections of whatever is hovered / focused.
  function highlight(id) {
    root.classList.toggle('mm-focus', !!id);
    for (const p of paths) p.classList.toggle('on', !!id && (p.dataset.a === id || p.dataset.b === id));
    for (const [k, el] of Object.entries(els)) {
      const linked = id && (k === id || edges.some(([a, b]) => (a === id && b === k) || (b === id && a === k)));
      el.classList.toggle('linked', !!linked);
    }
  }

  // Dragging (desktop + touch). A tap without movement toggles the details.
  for (const [id, el] of Object.entries(els)) {
    el.addEventListener('pointerenter', () => highlight(id));
    el.addEventListener('pointerleave', () => { if (!drag) highlight(null); });
    el.addEventListener('pointerdown', (e) => {
      drag = { id, el, sx: e.clientX, sy: e.clientY, start: { ...pos(id) }, moved: false };
      el.setPointerCapture(e.pointerId);
      highlight(id);
    });
  }
  let drag = null;
  root.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
    if (!drag.moved && Math.hypot(dx, dy) < 5) return;
    drag.moved = true;
    drag.el.classList.add('dragging');
    const key = mobile ? 'm' : 'd';
    custom[key] ||= {};
    custom[key][drag.id] = {
      x: Math.max(4, Math.min(96, drag.start.x + (dx / root.clientWidth) * 100)),
      y: Math.max(3, Math.min(97, drag.start.y + (dy / root.clientHeight) * 100)),
    };
    render();
  });
  const end = () => {
    if (!drag) return;
    if (!drag.moved) drag.el.classList.toggle('open');
    drag.el.classList.remove('dragging');
    drag = null;
  };
  root.addEventListener('pointerup', end);
  root.addEventListener('pointercancel', end);
}
