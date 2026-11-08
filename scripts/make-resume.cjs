// Renders scripts/resume.html to public/resume.pdf (phone number intentionally omitted).
// Run: node scripts/make-resume.cjs
const path = require('path');
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.goto('file://' + path.join(__dirname, 'resume.html'));
  await p.pdf({ path: path.join(__dirname, '..', 'public', 'resume.pdf'), format: 'Letter', printBackground: true, preferCSSPageSize: true });
  await b.close();
  console.log('wrote public/resume.pdf');
})();
