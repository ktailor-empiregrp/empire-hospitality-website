(function(){
if (typeof window.gsap === 'undefined' || typeof window.ScrollTrigger === 'undefined') {
  var pre = document.getElementById('preloader');
  if (pre) pre.classList.add('is-hidden');
  document.documentElement.classList.add('animation-fallback');
  return;
}
document.documentElement.classList.add('animations-ready');
gsap.registerPlugin(ScrollTrigger);


/* ---------- Local brand image fallback (no inline event handlers) ---------- */
document.querySelectorAll('.brand-mark-box img').forEach(function(img){
  function markMissing(){
    var box=img.closest('.brand-mark-box');
    if(box) box.classList.add('asset-missing');
  }
  img.addEventListener('error', markMissing, {once:true});
  if(img.complete && !img.naturalWidth) markMissing();
});

/* ---------- Respect reduced-motion preference ---------- */
var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (prefersReducedMotion) {
  gsap.globalTimeline.timeScale(20); // fast-forward all animations instead of fighting every tween
}

/* ---------- Lenis smooth (inertia) scrolling, synced to ScrollTrigger ---------- */
(function(){
  if (prefersReducedMotion || typeof Lenis === 'undefined') return;
  var lenis = new Lenis({
    duration: 1.15,
    easing: function(t){ return 1 - Math.pow(1 - t, 4); },
    smoothWheel: true,
    wheelMultiplier: 1
  });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(function(time){ lenis.raf(time * 1000); });
  gsap.ticker.lagSmoothing(0);
  window._empireLenis = lenis;
})();

/* ---------- Ambient cursor glow (desktop, motion allowed) ---------- */
(function(){
  if (prefersReducedMotion || ('ontouchstart' in window)) return;
  var glow = document.createElement('div');
  glow.className = 'cursor-glow';
  document.body.appendChild(glow);
  gsap.set(glow, {xPercent:-50, yPercent:-50, x:window.innerWidth/2, y:window.innerHeight/2});
  window.addEventListener('mousemove', function(e){
    gsap.to(glow, {x:e.clientX, y:e.clientY, duration:.7, ease:'power3.out'});
  });
})();

/* ---------- Preloader grid ---------- */
(function(){
  var preloader=document.getElementById('preloader');
  var grid=document.getElementById('pre-grid');
  if(!preloader || !grid){ runHeroIntro(); return; }

  for(var i=0;i<25;i++){var cell=document.createElement('span');grid.appendChild(cell);}
  var spans=grid.querySelectorAll('span');
  gsap.timeline()
    .to(spans,{opacity:1,backgroundColor:'#C9A96E',duration:.22,stagger:{each:.012,from:'center'}})
    .to(spans,{opacity:.25,backgroundColor:'rgba(201,169,110,0.35)',duration:.18,stagger:{each:.008,from:'edges'}});

  var finished=false;
  function finish(){
    if(finished) return;
    finished=true;
    gsap.to(preloader,{
      opacity:0,duration:.32,ease:'power2.inOut',
      onComplete:function(){
        preloader.classList.add('is-hidden');
        runHeroIntro();
        requestAnimationFrame(function(){ ScrollTrigger.refresh(); });
      }
    });
  }

  // Never wait for every image/font/network asset. The page is interactive immediately.
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded', function(){ setTimeout(finish, 220); }, {once:true});
  } else {
    setTimeout(finish, 220);
  }
  // Hard safety fallback independent of image and font loading.
  setTimeout(finish, 1000);
})();

/* ---------- Keep ScrollTrigger positions accurate as layout settles ----------
   Web fonts swapping in, images loading without reserved dimensions, and the
   split-heading rewrite below all change page height AFTER triggers are first
   calculated. Left uncorrected, elements further down the page (like the 3rd
   card in a row) can end up with a stale trigger window and never animate in. */
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(function(){ ScrollTrigger.refresh(); });
}
window.addEventListener('load', function(){ ScrollTrigger.refresh(); });

/* ---------- Scroll-spy: highlight current section's nav link ---------- */
(function(){
  var links = Array.prototype.slice.call(document.querySelectorAll('#navLinks a[href^="#"]'));
  if(!links.length) return;

  var map = links.map(function(link){
    var id = link.getAttribute('href').slice(1);
    var section = document.getElementById(id);
    return section ? {link:link, section:section} : null;
  }).filter(Boolean);

  function setActive(link){
    links.forEach(function(l){ l.classList.remove('active'); });
    if(link) link.classList.add('active');
  }

  map.forEach(function(entry){
    ScrollTrigger.create({
      trigger: entry.section,
      start: 'top 45%',
      end: 'bottom 45%',
      onEnter: function(){ setActive(entry.link); },
      onEnterBack: function(){ setActive(entry.link); }
    });
  });
})();

/* ---------- Header scroll state ---------- */
var header=document.getElementById('siteHeader');
ScrollTrigger.create({
  start:'top -60',
  onUpdate:function(self){ header.classList.toggle('scrolled', self.scroll()>60); }
});

/* ---------- Mobile menu ---------- */
var burgerBtn = document.getElementById('burger');
var navLinksEl = document.getElementById('navLinks');
var mobileMenuQuery = window.matchMedia('(max-width:900px)');

// Toggle a class instead of writing inline styles -- inline styles beat the
// CSS breakpoint rules and were permanently hiding the desktop nav after any
// link click. The class only ever does anything below the 900px breakpoint
// (see .nav-links.open in styles.css), so desktop is never affected.
function setMenuOpen(open){
  navLinksEl.classList.toggle('open', open);
  burgerBtn.classList.toggle('active', open);
  burgerBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
}
burgerBtn.addEventListener('click', function(){
  setMenuOpen(!navLinksEl.classList.contains('open'));
});
navLinksEl.addEventListener('click', function(e){
  // Only auto-close the drawer on mobile; on desktop this must be a no-op
  // or it wipes out the always-visible nav.
  if(e.target.tagName === 'A' && mobileMenuQuery.matches) setMenuOpen(false);
});
document.addEventListener('keydown', function(e){
  if(e.key === 'Escape') setMenuOpen(false);
});
// If the viewport crosses the breakpoint while the drawer is open, reset it
// so the class doesn't linger and fight the desktop layout.
mobileMenuQuery.addEventListener('change', function(){ setMenuOpen(false); });

/* ---------- Hero text intro ---------- */
function runHeroIntro(){
  gsap.set('.hero h1 .line span', {yPercent:110});
  gsap.timeline({defaults:{ease:'power4.out'}})
    .to('.hero h1 .line span', {yPercent:0, duration:1.1, stagger:.12})
    .from('.hero-sub', {opacity:0, y:20, duration:.9}, '-=.5')
    .from('.hero-actions', {opacity:0, y:20, duration:.9}, '-=.6')
    .from('.hero-pillars .pillar-chip', {opacity:0, x:20, duration:.6, stagger:.1}, '-=.7')
    .from('.hero-tag', {opacity:0, y:10, duration:.6}, '-=1.3');
}

/* ---------- Generic reveal on scroll (replays every pass, both directions) ---------- */
gsap.utils.toArray('.reveal').forEach(function(el){
  gsap.to(el, {
    opacity:1, y:0, duration:1, ease:'power3.out',
    scrollTrigger:{ trigger:el, start:'top 85%', toggleActions:'restart reverse restart reverse' }
  });
});

/* ---------- Trusted Brands — scroll-tied reveal, alternating from left/right ---------- */
(function(){
  var cards = document.querySelectorAll('#brandsStage .brand-card');
  if (!cards.length) return;

  cards.forEach(function(card, i){
    var fromSide = (i % 2 === 0) ? -110 : 110; // even index enters from left, odd from right
    gsap.set(card, {opacity:0, x:fromSide, y:16, scale:.94});

    gsap.to(card, {
      opacity:1, x:0, y:0, scale:1, duration:.9, ease:'power3.out',
      scrollTrigger:{
        trigger:card, start:'top 88%',
        toggleActions:'restart reverse restart reverse'
      },
      delay:i*0.08,
      onStart:function(){
        card.classList.remove('floating');
        card.classList.add('is-lit', 'sweeping');
      },
      onComplete:function(){
        card.classList.remove('sweeping');
        card.classList.add('floating');
      },
      onReverseComplete:function(){
        // Reset fully so the sweep/glow feel fresh next time it scrolls in
        card.classList.remove('is-lit', 'sweeping', 'floating');
      }
    });
  });
})();

/* ---------- Verticals card stagger ---------- */
/* Each card now gets its OWN trigger (was one shared trigger for the whole
   grid). Sharing a single trigger meant that if its calculated position drifted
   even slightly -- e.g. after web fonts swap in and reflow the page -- a card
   could miss its animation window entirely and never appear. Per-card triggers
   are self-correcting and also replay on every scroll pass. */
gsap.utils.toArray('.v-card').forEach(function(card){
  gsap.fromTo(card, {opacity:0, y:50}, {
    opacity:1, y:0, duration:.9, ease:'power3.out',
    scrollTrigger:{ trigger:card, start:'top 85%', toggleActions:'restart reverse restart reverse' }
  });
});

/* ---------- Counters (recount every time they scroll into view) ---------- */
gsap.utils.toArray('.stat-num').forEach(function(el){
  var target = +el.getAttribute('data-count');
  ScrollTrigger.create({
    trigger: el, start:'top 88%', end:'bottom top',
    onEnter:function(){ runCount(); },
    onEnterBack:function(){ runCount(); },
    onLeave:function(){ el.textContent = '0'; },
    onLeaveBack:function(){ el.textContent = '0'; }
  });
  function runCount(){
    var obj={val:0};
    gsap.to(obj,{val:target, duration:1.8, ease:'power2.out', onUpdate:function(){ el.textContent = Math.floor(obj.val); }});
  }
});

/* ---------- Mart parallax ---------- */
gsap.to('.mart-media img', {
  yPercent:14, ease:'none',
  scrollTrigger:{ trigger:'.mart', start:'top bottom', end:'bottom top', scrub:true }
});

/* ---------- Hero canvas: lightweight animated dot lattice ---------- */
(function(){
  var canvas=document.getElementById('hero-canvas');
  if(!canvas) return;
  var ctx=canvas.getContext('2d');
  if(!ctx) return;
  var w,h,dots=[],rafId=null,isVisible=true;
  var dpr=Math.min(window.devicePixelRatio || 1, 1.6);
  var coarse=window.matchMedia('(pointer:coarse)').matches;
  var cols=coarse ? 12 : 18, rows=coarse ? 7 : 10;
  var mouse={x:0,y:0},t=0;

  function resize(){
    dpr=Math.min(window.devicePixelRatio || 1, 1.6);
    var rect=canvas.getBoundingClientRect();
    w=Math.max(1,Math.round(rect.width*dpr));
    h=Math.max(1,Math.round(rect.height*dpr));
    if(canvas.width!==w) canvas.width=w;
    if(canvas.height!==h) canvas.height=h;
    mouse.x=w/2; mouse.y=h/2;
    buildDots();
  }
  function buildDots(){
    dots=[];
    var spacingX=w/cols, spacingY=h/rows;
    for(var i=0;i<=cols;i++){
      for(var j=0;j<=rows;j++){
        dots.push({baseX:i*spacingX,baseY:j*spacingY,phase:Math.random()*Math.PI*2});
      }
    }
  }
  function onPointer(e){
    var r=canvas.getBoundingClientRect();
    mouse.x=(e.clientX-r.left)*dpr;
    mouse.y=(e.clientY-r.top)*dpr;
  }
  function draw(){
    if(!isVisible || document.hidden){ rafId=null; return; }
    t+=0.006;
    ctx.clearRect(0,0,w,h);
    for(var i=0;i<dots.length;i++){
      var d=dots[i];
      var dx=d.baseX-mouse.x, dy=d.baseY-mouse.y;
      var dist=Math.sqrt(dx*dx+dy*dy);
      var influence=Math.max(0,1-dist/(280*dpr));
      var wob=Math.sin(t*2+d.phase)*3*dpr;
      var px=d.baseX+dx*influence*0.06;
      var py=d.baseY+dy*influence*0.06+wob;
      var alpha=0.12+influence*0.5;
      var size=(influence>0.05?1.6:1.1)*dpr;
      ctx.beginPath();
      ctx.arc(px,py,size,0,Math.PI*2);
      ctx.fillStyle='rgba(201,169,110,'+alpha.toFixed(2)+')';
      ctx.fill();
    }
    rafId=requestAnimationFrame(draw);
  }
  function ensureRunning(){ if(isVisible && !document.hidden && !rafId) rafId=requestAnimationFrame(draw); }

  resize();
  window.addEventListener('resize', resize, {passive:true});
  if(!coarse) canvas.addEventListener('pointermove', onPointer, {passive:true});
  document.addEventListener('visibilitychange', ensureRunning);

  if('IntersectionObserver' in window){
    new IntersectionObserver(function(entries){
      isVisible=entries[0].isIntersecting;
      ensureRunning();
    },{rootMargin:'120px'}).observe(canvas);
  }
  ensureRunning();
})();

/* ---------- Split heading words + reveal ---------- */
document.querySelectorAll('.split-heading').forEach(function(h){
  var words = h.textContent.trim().split(/\s+/);
  h.innerHTML = words.map(function(w){
    return '<span class="sh-wrap"><span class="sh-word">'+w+'&nbsp;</span></span>';
  }).join('');
});
gsap.utils.toArray('.split-heading .sh-word').forEach(function(w){ gsap.set(w,{yPercent:110}); });
document.querySelectorAll('.split-heading').forEach(function(h){
  gsap.to(h.querySelectorAll('.sh-word'), {
    yPercent:0, duration:.9, stagger:.045, ease:'power4.out',
    scrollTrigger:{ trigger:h, start:'top 88%', toggleActions:'restart reverse restart reverse' }
  });
});

/* ---------- Magnetic buttons ---------- */
document.querySelectorAll('.btn-primary, .nav-cta').forEach(function(el){
  el.addEventListener('mousemove', function(e){
    var r=el.getBoundingClientRect();
    var x=e.clientX-r.left-r.width/2, y=e.clientY-r.top-r.height/2;
    gsap.to(el,{x:x*0.35,y:y*0.45,duration:.4,ease:'power2.out'});
  });
  el.addEventListener('mouseleave', function(){
    gsap.to(el,{x:0,y:0,duration:.6,ease:'elastic.out(1,0.4)'});
  });
});

/* ---------- 3D tilt on vertical cards ---------- */
document.querySelectorAll('.v-card').forEach(function(card){
  card.addEventListener('mousemove', function(e){
    var r=card.getBoundingClientRect();
    var x=(e.clientX-r.left)/r.width-0.5, y=(e.clientY-r.top)/r.height-0.5;
    gsap.to(card,{rotateY:x*8, rotateX:-y*8, transformPerspective:700, duration:.5, ease:'power2.out'});
  });
  card.addEventListener('mouseleave', function(){
    gsap.to(card,{rotateY:0, rotateX:0, duration:.7, ease:'power3.out'});
  });
});

/* ---------- Icon draw-in (vertical icons) ---------- */
gsap.utils.toArray('.v-card').forEach(function(card){
  var shapes = card.querySelectorAll('.v-icon path, .v-icon rect, .v-icon line');
  gsap.fromTo(shapes, {strokeDashoffset:230}, {
    strokeDashoffset:0, duration:1.1, ease:'power2.out',
    scrollTrigger:{ trigger:card, start:'top 85%', toggleActions:'restart reverse restart reverse' }
  });
});

/* ---------- Mart curtain reveal ---------- */
gsap.fromTo('.mart-media', {clipPath:'inset(0 100% 0 0)'}, {
  clipPath:'inset(0 0% 0 0)', duration:1.5, ease:'power4.inOut',
  scrollTrigger:{ trigger:'.mart', start:'top 75%', toggleActions:'restart reverse restart reverse' }
});

/* mark loaded in case window.load already fired before script executed */
if(document.readyState==='complete'){ window.dispatchEvent(new Event('load')); }
})();
