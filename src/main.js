import './style.css';
import { profile, heroStats, heroCards, globePins, globeReach, globeFeed, mapNodes, mapEdges, experience, skills } from './content.js';
import { initPortrait } from './portrait.js';
import { initGlobe } from './globe.js';
import { initMindMap } from './mindmap.js';

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ---- hero content ----
$('#hero-stats').innerHTML = heroStats
  .map((s) => `<div class="stat"><span class="stat-v px">${esc(s.value)}</span><span class="stat-l">${esc(s.label)}</span></div>`)
  .join('');
$('#mini-cards').innerHTML = heroCards
  .map((c, i) => `<a href="#map" class="mini" style="--tint:${c.tint};--i:${i}"><span class="mini-tag">${esc(c.tag)}</span><strong>${esc(c.title)}</strong></a>`)
  .join('');

// ---- portrait ----
const portrait = initPortrait($('#portrait'), '/me.png', { region: $('#portrait-region'), surface: $('#top') });
$('#explode-btn').addEventListener('click', () => portrait.explode());

// ---- globe ----
initGlobe($('#globe'), $('#globe-labels'), { pins: globePins, reach: globeReach });
$('#globe-feed ul').innerHTML = globeFeed
  .map((f, i) => `<li><span class="gf-dot ${i === 0 ? 'on' : ''}"></span><div><strong>${esc(f.label)}</strong><span>${esc(f.meta)}</span></div></li>`)
  .join('');

// ---- mind map ----
initMindMap($('#mindmap'), { nodes: mapNodes, edges: mapEdges });

// ---- experience ----
$('#exp-list').innerHTML = experience
  .map((e) => `<li><span class="when">${esc(e.when)}</span><div><strong>${esc(e.role)}</strong><span>${esc(e.org)}</span></div></li>`)
  .join('');
$('#skills').innerHTML = skills.map((s) => `<span>${esc(s)}</span>`).join('');

// ---- contact ----
$('#mail-link').href = `mailto:${profile.email}`;
$('#li-link').href = profile.linkedin;
$('#gh-link').href = profile.github;
$('#flip-li').href = profile.linkedin;

// ---- 3D flip scene (three.js is loaded only when the section gets close) ----
const flipStage = $('#flip-stage');
const flipIO = new IntersectionObserver((entries) => {
  if (!entries.some((e) => e.isIntersecting)) return;
  flipIO.disconnect();
  import('./flip3d.js')
    .then(({ initFlip }) => initFlip(flipStage, $('#flip-labels'), { linkedin: profile.linkedin, github: profile.github, resume: profile.resume }))
    .catch(() => flipStage.classList.add('no-webgl'));
}, { rootMargin: '600px' });
flipIO.observe(flipStage);
$('#year').textContent = new Date().getFullYear();
