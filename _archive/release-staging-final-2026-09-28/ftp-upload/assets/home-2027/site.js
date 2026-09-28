(() => {
 const path=location.pathname.replace(/index\.html$/, '');
 document.querySelectorAll('.ws-nav a').forEach(a=>{const target=new URL(a.href);if(target.origin!==location.origin||target.hash)return;const route=target.pathname;const home=['/build/','/build/home.html','/build/home-2.html','/build/home-3.html'].includes(path);if((route==='/build/'&&home)||(route!=='/build/'&&(path===route||route.endsWith('/')&&path.startsWith(route))))a.setAttribute('aria-current','page')});
 document.querySelectorAll('.ws-brand img').forEach(img=>{img.src='/build/assets/home-2027/large-logo-horizontal.svg';img.alt='Van Shea Creative';});
 const header=document.querySelector('.ws-header'); const syncHeader=()=>header?.classList.toggle('is-scrolled',scrollY>24); addEventListener('scroll',syncHeader,{passive:true}); syncHeader();
 const demo=document.querySelector('.ws-demo-frame');if(demo&&(location.search||location.hash))demo.src=demo.getAttribute('src')+location.search+location.hash;
 const toggle=document.querySelector('.ws-menu'),nav=document.querySelector('.ws-nav');
 toggle?.addEventListener('click',()=>{const open=toggle.getAttribute('aria-expanded')!=='true';toggle.setAttribute('aria-expanded',String(open));toggle.textContent=open?'Close':'Menu';nav.classList.toggle('is-open',open)});
 nav?.addEventListener('click',e=>{if(e.target.closest('a')){toggle.setAttribute('aria-expanded','false');toggle.textContent='Menu';nav.classList.remove('is-open')}});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&toggle?.getAttribute('aria-expanded')==='true'){toggle.click();toggle.focus()}});
})();
