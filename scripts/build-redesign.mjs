import { readFile, writeFile, mkdir, cp, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = process.env.REDESIGN_SOURCE_DIR ? path.resolve(process.env.REDESIGN_SOURCE_DIR) : root;
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const decode = value => String(value).replace(/<[^>]*>/g, '').replace(/&#(x[0-9a-f]+|\d+);/gi, (_, n) => { const point = n[0].toLowerCase() === 'x' ? parseInt(n.slice(1),16) : Number(n); return point > 0 && point <= 0x10ffff ? String.fromCodePoint(point) : ''; }).replace(/&(amp|quot|apos|lt|gt|nbsp|rsquo|lsquo|ndash|mdash);/g, (_, n) => ({amp:'&',quot:'"',apos:"'",lt:'<',gt:'>',nbsp:' ',rsquo:'’',lsquo:'‘',ndash:'–',mdash:', '}[n]));
const pinned = {link:'https://vanshea.com/blog/human-agency-design/',title:{rendered:'Human Agency Design'}};
function valid(post) { try {const url = new URL(post.link);return ['https:'].includes(url.protocol) && ['vanshea.com','www.vanshea.com'].includes(url.hostname) && url.pathname.startsWith('/blog/') && typeof post.title?.rendered === 'string';} catch {return false;} }
let posts = JSON.parse(await readFile(path.join(source, 'src/writing-fallback.json'), 'utf8'));
if (!process.argv.includes('--offline')) {
  try {
    const response = await fetch('https://www.vanshea.com/blog/wp-json/wp/v2/posts?per_page=7&orderby=date&order=desc&_fields=link,title,date', { signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const fetched = await response.json();
    if (!Array.isArray(fetched) || fetched.length < 6 || !fetched.every(valid)) throw new Error('Invalid blog response');
    posts = fetched;
    console.log('Writing: retrieved latest WordPress titles.');
  } catch (error) { console.warn(`Writing: using committed fallback (${error.message}).`); }
} else console.log('Writing: using committed fallback (offline).');
const seen = new Set(['/blog/human-agency-design/']);
posts = [pinned, ...posts.filter(valid).filter(post => {const key = new URL(post.link).pathname.replace(/\/?$/, '/');if(seen.has(key)) return false;seen.add(key);return true;})].slice(0,6);
if (posts.length !== 6) throw new Error('Exactly six writing entries are required.');
const links = posts.map(post => `<a href="${escape(post.link)}"><span>${escape(decode(post.title.rendered).replaceAll('—', ', '))}</span></a>`).join('\n');
const indexPath = path.join(source, 'index.html');
const html = await readFile(indexPath,'utf8');
if (!html.includes('<!-- WRITING_START -->')) throw new Error('Redesigned homepage is not installed.');
await writeFile(indexPath, html.replace(/<!-- WRITING_START -->[\s\S]*?<!-- WRITING_END -->/, `<!-- WRITING_START -->\n${links}\n<!-- WRITING_END -->`));
const outputArg = process.argv.find(arg => arg.startsWith('--output='));
if (outputArg) {
  const output = path.resolve(outputArg.slice(9));
  const relative = path.relative(root, output);
  if (!relative || !relative.startsWith('..')) throw new Error('Output must be outside the repository to protect existing variants.');
  await mkdir(output,{recursive:true});
  for (const name of ['index.html','src','about','art']) await cp(path.join(source,name),path.join(output,name),{recursive:true});
  for (const name of ['assets','case-studies','styles.css','script.js','analytics.js','experience.html']) await cp(path.join(root,name),path.join(output,name),{recursive:true,filter:src=>!['originals','backups','.DS_Store'].includes(path.basename(src))});
  // Preserve the already materialized experiment routes without changing prototypes.
  await cp(path.join(root,'livesite/aidesign'),path.join(output,'aidesign'),{recursive:true});
  const navigation = '<nav id="siteNav" class="nav" aria-label="Main navigation">' + [['/#work','Work'],['/#writing','Writing'],['/about/','About'],['/#contact','Contact']].map(([url,label]) => `<a href="${url}">${label}</a>`).join('') + '</nav>';
  async function finalizeLegacyPages(directory) {
    for (const entry of await readdir(directory,{withFileTypes:true})) {
      const file = path.join(directory,entry.name);
      if (entry.isDirectory()) await finalizeLegacyPages(file);
      else if (entry.name.endsWith('.html')) {
        const original = await readFile(file,'utf8');
        await writeFile(file,original.replace(/<nav id="siteNav"[\s\S]*?<\/nav>/,navigation).replace(/<script[^>]+src="[^"]*analytics\.js[^"]*"[^>]*><\/script>/g, '').replace(/<aside[^>]*id="consentBanner"[\s\S]*?<\/aside>/g, ''));
      }
    }
  }
  await finalizeLegacyPages(path.join(output,'aidesign'));
  await finalizeLegacyPages(path.join(output,'case-studies'));
  const experiencePath = path.join(output,'experience.html');
  await writeFile(experiencePath,(await readFile(experiencePath,'utf8')).replace(/<script[^>]+src="[^"]*analytics\.js[^"]*"[^>]*><\/script>/g, '').replace(/<aside[^>]*id="consentBanner"[\s\S]*?<\/aside>/g, ''));
  const legacyScript = path.join(output,'script.js');
  await writeFile(legacyScript,(await readFile(legacyScript,'utf8')).replace('fetch("assets/footer-animation-log.json"', 'fetch("/assets/footer-animation-log.json"'));
  console.log(`Static site written to ${output}. WordPress remains separately deployed.`);
}
