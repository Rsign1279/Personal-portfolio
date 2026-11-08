// Generates src/data/land.json: evenly spaced points on a sphere that fall on land.
// Run once with `npm run gen:land`; the output is committed.
import { readFileSync, writeFileSync } from 'node:fs';
import { feature } from 'topojson-client';
import { geoContains } from 'd3-geo';

const topo = JSON.parse(readFileSync(new URL('../node_modules/world-atlas/land-110m.json', import.meta.url)));
const land = feature(topo, topo.objects.land);

const N = 26000;
const golden = Math.PI * (3 - Math.sqrt(5));
const out = [];
for (let i = 0; i < N; i++) {
  const y = 1 - (i / (N - 1)) * 2;
  const r = Math.sqrt(1 - y * y);
  const t = golden * i;
  const lat = Math.asin(y) * 180 / Math.PI;
  const lon = ((Math.atan2(Math.sin(t) * r, Math.cos(t) * r) * 180 / Math.PI));
  if (lat < -60) continue; // skip Antarctica for a cleaner silhouette
  if (geoContains(land, [lon, lat])) out.push(+lat.toFixed(2), +lon.toFixed(2));
}
writeFileSync(new URL('../src/data/land.json', import.meta.url), JSON.stringify(out));
console.log('land points:', out.length / 2);
