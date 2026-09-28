"""Apply shared semantics to the static Build pages without changing their content."""
from pathlib import Path
import re

BUILD = Path(__file__).resolve().parents[1]
RADIOS = (
    '<fieldset class="theme-control"><legend>Color theme</legend>'
    '<label><input type="radio" name="color-theme" value="theme1"><span>Clear</span></label>'
    '<label><input type="radio" name="color-theme" value="theme2"><span>Tinted</span></label>'
    '<label><input type="radio" name="color-theme" value="theme3"><span>High Contrast</span></label>'
    '<label><input type="radio" name="color-theme" value="theme4"><span>Wild</span></label>'
    '</fieldset>'
)
OLD_ASSETS = [
    r'<link rel="stylesheet" href="/build/assets/home-2027/site\.css[^"]*">',
    r'<script src="/build/assets/home-2027/site\.js[^"]*" defer></script>',
    r'<script src="/build/assets/home-2027/wave-header-02\.js[^"]*" defer></script>',
    r'<script src="/build/assets/home-2027/home\.js[^"]*" defer></script>',
]

for file in sorted(BUILD.rglob('*.html')):
    if 'assets' in file.relative_to(BUILD).parts:
        continue
    s = file.read_text()
    for old in OLD_ASSETS:
        s = re.sub(old, '', s)
    s = s.replace('aria-label="Van Shea Creative home"', 'aria-label="Van Shea Creative, Human Agency Design home"')
    s = s.replace('src="/build/assets/home-2027/wave-05-static.svg" alt=""',
                  'src="/build/assets/home-2027/wave-05-static.svg" alt="" aria-hidden="true"')
    s = re.sub(r'<div class="theme-control"><label for="home-theme">Theme</label><select id="home-theme" name="theme">.*?</select></div>',
               RADIOS, s, count=1)
    s = re.sub(r'<main\b([^>]*)>', lambda m: '<main' + (
        re.sub(r'\bid="[^"]*"', 'id="main"', m.group(1)) if 'id=' in m.group(1)
        else m.group(1) + ' id="main"'
    ) + '>', s, count=1)
    if re.search(r'<a class="skip" href="#main">', s):
        s = s.replace('<a class="skip" href="#main">Skip to content</a>',
                      '<a class="skip" href="#main">Skip to main content</a>', 1)
    else:
        s = re.sub(r'(<body\b[^>]*>)',
                   r'\1<a class="skip" href="#main">Skip to main content</a>',
                   s, count=1)
    rel = file.relative_to(BUILD)
    if rel.name in {'home.html', 'home-2.html', 'home-3.html', 'index.html'} and len(rel.parts) == 1:
        current = '/build/'
    elif rel == Path('work.html'):
        current = '/build/work.html'
    elif rel.parts[0] == 'case-studies':
        current = '/build/case-studies/'
    elif rel.parts[0] == 'aidesign':
        current = '/build/aidesign/'
    elif rel == Path('experience.html'):
        current = '/build/experience.html'
    else:
        current = None
    if current:
        if current == '/build/' and 'class="home-brand"' in s:
            s = re.sub(r'(<a class="home-brand"[^>]*)(>)',
                       lambda m: m.group(1) + m.group(2) if 'aria-current' in m.group(1) else m.group(1) + ' aria-current="page"' + m.group(2),
                       s, count=1)
        if 'class="home-nav"' in s:
            s = re.sub(r'(<nav class="home-nav"[^>]*>)(.*?)(</nav>)',
                       lambda m: m.group(1) + m.group(2).replace(
                           '<a href="' + current + '">', '<a href="' + current + '" aria-current="page">'
                       ) + m.group(3), s, count=1, flags=re.S)
    # Only presentation of the label changes; the destination stays the same.
    s = s.replace('>About Van</a>', '>Experience</a>')
    s = re.sub(r'<a\b(?=[^>]*target="_blank")[^>]*>[\s\S]*?</a>',
               lambda m: m.group(0) if 'opens in a new tab' in m.group(0) else m.group(0).replace(
                   '</a>', '<span class="sr-only"> (opens in a new tab)</span></a>'
               ), s)
    file.write_text(s)
