// Eclipr shared page script — guarded so the page works even if CDNs fail.
(function(){
  // Loader
  var loader=document.querySelector('.loader'),bar=document.querySelector('.ldr-bar i');
  function hideLoader(){ if(!loader) return; loader.style.transition='opacity .6s ease';loader.style.opacity='0';setTimeout(function(){loader.style.display='none';},650); }
  if(bar){ bar.animate?bar.animate([{width:'0%'},{width:'100%'}],{duration:900,easing:'cubic-bezier(.16,1,.3,1)',fill:'forwards'}):(bar.style.width='100%'); }
  window.addEventListener('load',function(){ setTimeout(hideLoader,700); });
  setTimeout(hideLoader,2600); // safety net

  var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion:reduce)').matches;

  // Smooth scroll (Lenis) + GSAP scroll-bg, only if libs present and motion allowed
  function boot(){
    if(reduce) return;
    var hasG=window.gsap&&window.ScrollTrigger;
    if(hasG) gsap.registerPlugin(ScrollTrigger);
    if(window.Lenis){
      var lenis=new Lenis({lerp:.1,smoothWheel:true});
      function raf(t){lenis.raf(t);requestAnimationFrame(raf);} requestAnimationFrame(raf);
      if(hasG){ lenis.on('scroll',ScrollTrigger.update); ScrollTrigger.config({ignoreMobileResize:true}); }
    }
    var bg=document.querySelector('.scrollbg');
    if(hasG&&bg){
      gsap.to(bg,{keyframes:{backgroundColor:['#05060B','#070C1C','#04120F','#0E0A04','#12060E','#05060B'],easeEach:'none'},ease:'none',
        scrollTrigger:{trigger:document.documentElement,start:'top top',end:'bottom bottom',scrub:0.6,invalidateOnRefresh:true}});
    }
    // Reveal on scroll
    var els=document.querySelectorAll('.reveal');
    if(hasG&&els.length){
      els.forEach(function(el){
        gsap.fromTo(el,{y:26,opacity:0},{y:0,opacity:1,duration:.8,ease:'power3.out',
          scrollTrigger:{trigger:el,start:'top 86%'}});
      });
    }
  }
  if(document.readyState!=='loading') boot(); else document.addEventListener('DOMContentLoaded',boot);
})();
