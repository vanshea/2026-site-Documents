import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
const deps = process.env.VSC_A11Y_DEPS || '/private/tmp/vsc-a11y/node_modules';
const { default: puppeteer } = await import(path.join(deps, 'puppeteer-core/lib/puppeteer/puppeteer-core.js'));

const root = path.resolve(import.meta.dirname, '../..');
const build = path.join(root, 'build');
const out = path.join(build, 'qa');
const label = process.argv[2] || 'after';
const axe = fs.readFileSync(path.join(deps, 'axe-core/axe.min.js'), 'utf8');
const themes = ['theme1', 'theme2', 'theme3', 'theme4'];
const pages = [];
function collect(dir) {
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    if (item.name === 'assets' || item.name === 'qa') continue;
    const file = path.join(dir, item.name);
    if (item.isDirectory()) collect(file);
    else if (item.name.endsWith('.html')) pages.push(path.relative(root, file));
  }
}
collect(build);
pages.sort();
fs.mkdirSync(out, { recursive: true });

const server = spawn('python3', ['-m', 'http.server', '18765', '--bind', '127.0.0.1'], { cwd: root, stdio: 'ignore' });
let browser;
try {
  await new Promise(resolve => setTimeout(resolve, 400));
  browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-gpu'],
  });
  const results = [];
  for (const file of pages) {
    for (const theme of themes) {
      const page = await browser.newPage();
      await page.setViewport({ width: 1360, height: 900 });
      if (process.env.VSC_COLOR_SCHEME === 'dark') {
        await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }]);
      }
      await page.evaluateOnNewDocument(selected => {
        localStorage.setItem('vsc-site-theme-v2', selected);
        localStorage.setItem('vsc-site-theme', selected);
      }, theme);
      const url = 'http://127.0.0.1:18765/' + file.replace(/index\.html$/, '');
      let result;
      try {
        const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await page.evaluate(axe);
        const scan = await page.evaluate(async () => {
          return axe.run(document, {
            runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] },
          });
        });
        result = {
          page: file,
          theme,
          status: response?.status() ?? null,
          violations: scan.violations.map(v => ({
            id: v.id, impact: v.impact, description: v.help,
            nodes: v.nodes.map(n => ({ target: n.target, summary: n.failureSummary })),
          })),
          incomplete: scan.incomplete.map(v => ({ id: v.id, nodes: v.nodes.map(n => ({ target: n.target, summary: n.failureSummary })) })),
        };
        if (theme === 'theme4' && ['build/index.html','build/work.html','build/case-studies/index.html','build/case-studies/nami-delaware-988-campaign/index.html','build/aidesign/index.html'].includes(file)) {
          await page.screenshot({ path: path.join(out, label + '-' + file.replaceAll('/', '-').replace('.html', '.png')), fullPage: false });
        }
      } catch (error) {
        result = { page: file, theme, error: String(error) };
      }
      results.push(result);
      console.log(file, theme, result.error || result.violations.length);
      await page.close();
    }
  }
  fs.writeFileSync(path.join(out, 'axe-' + label + '.json'), JSON.stringify(results, null, 2));
} finally {
  if (browser) await browser.close();
  server.kill('SIGTERM');
}
