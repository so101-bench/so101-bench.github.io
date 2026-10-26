'use strict';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
$$('[data-pair]').forEach(pair=>{
 const videos=[...pair.querySelectorAll('video')],button=pair.querySelector('[data-pair-play]');
 const update=()=>{const playing=videos.some(v=>!v.paused);button.textContent=playing?'Pause both Ⅱ':'Play both ▷';button.setAttribute('aria-pressed',String(playing));};
 const pause=()=>{videos.forEach(v=>v.pause());update();};
 if(reducedMotion)videos.forEach(v=>{v.autoplay=false;v.pause();});
 videos.forEach(v=>{v.addEventListener('play',update);v.addEventListener('pause',update);v.addEventListener('ended',update);});
 button.addEventListener('click',()=>{if(videos.some(v=>!v.paused))pause();else Promise.allSettled(videos.map(v=>v.play())).then(update);});
 const restart=pair.querySelector('[data-pair-restart]');if(restart)restart.addEventListener('click',()=>{videos.forEach(v=>{v.pause();v.currentTime=0;});Promise.allSettled(videos.map(v=>v.play())).then(update);});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
 update();
});

const navbar=$('.site-navbar');if(navbar){const updateNavbar=()=>navbar.classList.toggle('is-solid',window.scrollY>24);window.addEventListener('scroll',updateNavbar,{passive:true});updateNavbar();}

$$('[data-sol-seek]').forEach(button=>button.addEventListener('click',()=>{const video=$('#sol-recovery-video');if(!video)return;if(window.SO101Players){window.SO101Players.seek(video,Number(button.dataset.solSeek),true);return;}const seek=()=>{video.currentTime=Number(button.dataset.solSeek);video.play().catch(()=>{});};if(video.readyState>=1)seek();else{video.addEventListener('loadedmetadata',seek,{once:true});video.load();}}));

const copyCitation=document.querySelector('#copy-citation');
if(copyCitation)copyCitation.addEventListener('click',async()=>{
 const code=document.querySelector('#citation-bibtex'),status=document.querySelector('#citation-status');
 try{
  await navigator.clipboard.writeText(code.textContent+'\n');
  status.textContent='Citation copied.';
 }catch{
  const range=document.createRange();range.selectNodeContents(code);
  const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);
  code.closest('pre').focus();status.textContent='Citation selected. Press Ctrl+C or ⌘C to copy.';
 }
});
// Sim2real gallery: one task pair at a time (all four stay visible without JavaScript).
(()=>{const gallery=$('.transfer-task-gallery'),tabs=gallery&&gallery.querySelector('.transfer-tabs');if(!tabs)return;
 const buttons=[...tabs.querySelectorAll('[role="tab"]')],panels=[...gallery.querySelectorAll('.transfer-task')];
 const show=i=>{buttons.forEach((b,j)=>{b.setAttribute('aria-selected',String(i===j));b.tabIndex=i===j?0:-1;});
  panels.forEach((p,j)=>{p.hidden=i!==j;if(i!==j)p.querySelectorAll('video').forEach(v=>v.pause());});};
 buttons.forEach((b,i)=>{b.addEventListener('click',()=>show(i));
  b.addEventListener('keydown',e=>{const d=e.key==='ArrowRight'?1:e.key==='ArrowLeft'?-1:0;if(d){const k=(i+d+buttons.length)%buttons.length;show(k);buttons[k].focus();}});});
 tabs.hidden=false;show(0);})();
