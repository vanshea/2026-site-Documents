from pathlib import Path
import re,html,json,sys
B=Path(__file__).resolve().parents[2]
A=B/'assets/home-2027'
# Preserve the selected homepage and original work page as Build-only source templates.
if not (A/'selected-home.html').exists(): (A/'selected-home.html').write_text((B/'home-3.html').read_text())
if not (B/'work.html').exists(): (B/'work.html').write_text((B/'index.html').read_text())
header='''<header class="ws-header"><div class="ws-header-inner"><a class="ws-brand" href="/build/" aria-label="Van Shea Creative home"><img src="/build/assets/web_logomark_240_dark.png" alt="" width="34" height="34"><span>VAN SHEA CREATIVE</span></a><button class="ws-menu" aria-expanded="false" aria-controls="ws-nav" type="button">Menu</button><nav class="ws-nav" id="ws-nav" aria-label="Main navigation"><a href="/build/">Home</a><a href="/build/work.html">Work</a><a href="/build/case-studies/">Case Studies</a><a href="/build/aidesign/">AI Design Lab</a><a href="/build/experience.html">Experience</a><a href="https://vanshea.com/blog/">Writing</a><a class="ws-talk" href="/build/#contact">Let’s talk</a></nav></div></header>'''
footer='''<footer class="ws-footer"><div class="ws-footer-inner"><div class="ws-footer-top"><div><h2>Tell me about the mandate<br>and where it’s stuck.</h2><p>Strategy, service systems, and human agency.</p></div><a class="ws-button" href="https://calendly.com/van-shea/30min" target="_blank" rel="noopener noreferrer">Start a conversation</a></div><div class="ws-footer-bottom"><span>© 2026 Van Shea Sedita · Human Agency Design</span><nav class="ws-footer-links" aria-label="Footer"><a href="/build/experience.html">About Van</a><a href="https://www.linkedin.com/in/vanshea/" target="_blank" rel="noopener noreferrer">LinkedIn</a><a href="/build/aidesign/">AI Design Lab</a></nav></div></div></footer>'''
wave='''<div class="ws-wave"><ocean-wave-02 speed="0.10" amplitude="20" height="140px" aria-hidden="true"></ocean-wave-02><button class="motion-toggle" type="button" aria-pressed="false">Pause wave</button></div>'''
assets='''<link rel="stylesheet" href="/build/assets/home-2027/site.css?v=1"><script src="/build/assets/home-2027/site.js?v=1" defer></script>'''
motion='''<script src="/build/assets/home-2027/wave-header-02.js" defer></script><script src="/build/assets/home-2027/home.js" defer></script>'''
def chrome(s):
 s=re.sub(r'<header\b[^>]*class="site-header"[^>]*>[\s\S]*?</header>',header,s,count=1)
 s=re.sub(r'<footer\b[^>]*class="(?:site-footer|wrap footer)"[^>]*>[\s\S]*?</footer>',footer,s,count=1)
 return s
# The selected homepage owns all home entry points. Its standalone theme is
# deliberately independent of the legacy Working System shell below.
home=(A/'selected-home.html').read_text()
if 'class="agency-home"' not in home:
 home=re.sub(r'<nav class="options wrap"[\s\S]*?</nav>','',home)
 home=chrome(home).replace('<html lang="en">','<html lang="en" class="ws-site">')
 home=home.replace('</head>',assets+'</head>').replace('Home 3 |','Home |').replace('/build/index.html#work','/build/work.html#work').replace('href="/build/index.html"','href="/build/work.html"')
for name in ['index.html','home.html','home-2.html','home-3.html']: (B/name).write_text(home)
if '--home-only' in sys.argv:
 print('Updated the four Build homepage entry points.')
 sys.exit(0)
processed=[]
for p in list(B.rglob('*.html')):
 if 'assets' in p.relative_to(B).parts or p.name in ['home.html','home-2.html','home-3.html'] or p==B/'index.html': continue
 s=p.read_text()
 if 'ws-header' in s: continue
 if re.search(r'<header\b[^>]*class="site-header"',s):
  s=chrome(s)
  s=re.sub(r'<html\b([^>]*)>',r'<html class="ws-site"\1>',s,count=1)
  s=re.sub(r'<body([^>]*)>',r'<body\1>',s,count=1)
  s=s.replace('</head>',assets+motion+'</head>')
  # Wrap only the public main, leaving lightboxes and their scripts at body level.
  s=s.replace('<main ','<div class="ws-content"><main ',1).replace('</main>','</main></div>',1)
  s=s.replace('</header>','</header>'+wave,1)
  s=s.replace('href="/build/#work"','href="/build/work.html#work"').replace('href="/blog/"','href="https://vanshea.com/blog/"')
  (p).write_text(s)
 else:
  # Keep app internals intact. Top-level demos get website chrome; iframe uses load the original app directly.
  rel=p.relative_to(B);name='--'.join(rel.parts);raw=A/'demos'/name;raw.parent.mkdir(exist_ok=True)
  base='/build/'+str(rel.parent)+'/'
  raw.write_text(re.sub(r'(<head[^>]*>)',lambda m:m.group(1)+'<base href="'+base+'">',s,count=1))
  title=re.search(r'<title>([\s\S]*?)</title>',s)
  title=html.unescape(title.group(1)) if title else p.stem
  if title=='Bundled Page':title={'self_care':'Self Care','partner':'Partner','meeting_coach_demo':'Meeting Coach Demo','Contact Prototype (standalone)':'Contact'}.get(p.stem,p.stem)
  url='/build/assets/home-2027/demos/'+name
  redirect='if(window.self!==window.top)location.replace('+json.dumps(url)+'+location.search+location.hash);'
  p.write_text('<!doctype html><html lang="en" class="ws-site"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+html.escape(title)+' | Van Shea Creative</title><script>'+redirect+'</script>'+assets+motion+'</head><body>'+header+wave+'<main><div class="ws-demo-intro"><a href="/build/aidesign/">Back to AI Design Lab</a><h1>'+html.escape(title)+'</h1></div><iframe class="ws-demo-frame" src="'+html.escape(url,quote=True)+'" title="'+html.escape(title,quote=True)+'" allow="fullscreen; clipboard-write" allowfullscreen></iframe></main>'+footer+'</body></html>')
 processed.append(str(p.relative_to(B)))
print('Applied Working System to '+str(len(processed)+4)+' Build pages.')
