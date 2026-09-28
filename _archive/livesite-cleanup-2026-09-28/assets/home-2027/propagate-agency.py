from pathlib import Path
import re

B = Path(__file__).resolve().parents[2]

HEADER = """<header class="home-header"><div class="container header-inner">
  <a class="home-brand" href="/build/" aria-label="Van Shea Creative home"><img src="/build/assets/home-2027/large-logo-horizontal.svg" width="215" height="61" alt="Van Shea Creative"></a>
  <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="home-nav">Menu</button>
  <nav class="home-nav" id="home-nav" aria-label="Main navigation">
    <a href="/build/">Home</a><a href="/build/work.html">Work</a><a href="/build/case-studies/">Case Studies</a><a href="/build/aidesign/">AI Design</a><a href="/build/experience.html">Experience</a><a href="https://vanshea.com/blog/">Blog</a>
  </nav>
</div></header>"""
WAVE = '<div class="page-wave-stage" aria-hidden="true"><img src="/build/assets/home-2027/wave-05-static.svg" alt="" width="1265" height="313"></div>'
FOOTER = """<footer class="home-footer"><div class="container view-controls" aria-label="Display preferences"><div class="theme-control"><label for="home-theme">Theme</label><select id="home-theme" name="theme"><option value="theme1">Clear</option><option value="theme2">Tinted</option><option value="theme3">High Contrast</option><option value="theme4" selected>Wild</option></select></div></div><div class="container footer-inner"><p>© 2026 Van Shea Sedita · Human Agency Design</p><nav class="footer-links" aria-label="Footer"><a href="/build/experience.html">About Van</a><a href="/build/work.html">Work</a><a href="https://vanshea.com/blog/">Blog</a><a href="https://www.linkedin.com/in/vanshea/" target="_blank" rel="noopener noreferrer">LinkedIn</a></nav></div></footer>"""
ASSETS = '<link rel="stylesheet" href="/build/assets/home-2027/agency-home.css?v=20260923-agency"><link rel="stylesheet" href="/build/assets/home-2027/agency-site.css?v=20260923-agency"><script src="/build/assets/home-2027/agency-home.js?v=20260923-agency" defer></script>'

def replace_chrome(s):
    s = re.sub(r'<header\b[^>]*class="ws-header"[^>]*>[\s\S]*?</header>', HEADER, s, count=1)
    s = re.sub(r'<div class="ws-wave">[\s\S]*?</div>', WAVE, s, count=1)
    s = re.sub(r'<footer\b[^>]*class="ws-footer"[^>]*>[\s\S]*?</footer>', FOOTER, s, count=1)
    s = s.replace('</head>', ASSETS + '</head>', 1)
    s = s.replace('<html class="ws-site"', '<html class="agency-site"')
    s = s.replace('<body>', '<body class="agency-site">', 1)
    s = s.replace('class="ws-content"', 'class="agency-content"')
    s = s.replace('<main>', '<main class="agency-main">', 1)
    s = s.replace('<main id="top">', '<main id="top" class="agency-main">', 1)
    return s

for p in B.rglob('*.html'):
    rel = p.relative_to(B)
    if 'assets' in rel.parts or p.name in {'home.html', 'home-2.html', 'home-3.html'} or p == B / 'index.html':
        continue
    s = p.read_text()
    if 'class="ws-header"' in s:
        p.write_text(replace_chrome(s))

home = B / 'index.html'
s = home.read_text()
s = s.replace('<a href="/build/aidesign/">AI Design</a>\n        <a href="https://vanshea.com/blog/">Blog</a>',
              '<a href="/build/aidesign/">AI Design</a>\n        <a href="/build/experience.html">Experience</a>\n        <a href="https://vanshea.com/blog/">Blog</a>')
s = s.replace('agency-home.css?v=1', 'agency-home.css?v=20260923-agency')
s = s.replace('agency-home.js?v=1', 'agency-home.js?v=20260923-agency')
home.write_text(s)
print("Propagated the current homepage shell across Build pages.")
