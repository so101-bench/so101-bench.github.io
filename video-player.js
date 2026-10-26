'use strict';
(() => {
 const videos = [...document.querySelectorAll('video')];
 const players = new Map();
 const icons = {
  play: '<path d="m9 5 11 7-11 7z"/>',
  pause: '<path d="M8 5h3v14H8zM15 5h3v14h-3z"/>',
  expand: '<path d="M9 4H4v5m11-5h5v5M4 15v5h5m11-5v5h-5"/>',
  fullscreen: '<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  back: '<path d="M7 8H3V4m0 4a9 9 0 1 1 0 8"/><path d="M10 8h5v4h-5v4h5"/>',
  captions: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M10 9H7v6h3m7-6h-3v6h3"/>'
 };
 const svg = name => `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${icons[name]}</svg>`;
 const stamp = seconds => {
  if (!Number.isFinite(seconds)) return '--:--';
  const value = Math.max(0, Math.floor(seconds));
  return `${Math.floor(value/60)}:${String(value%60).padStart(2,'0')}`;
 };
 const button = (name, label, className='') => {
  const el = document.createElement('button');
  el.type = 'button'; el.className = `media-button ${className}`;
  el.innerHTML = svg(name); el.title = label; el.setAttribute('aria-label',label);
  return el;
 };
 let theater;
 let restoreTheater;
 function expand(video) {
  const player = players.get(video);
  if (!player) return;
  if (theater?.open) {
   if (theater.contains(player.shell)) return;
   theater.addEventListener('close',()=>expand(video),{once:true});
   theater.close(); return;
  }
  if (!theater) {
   theater = document.createElement('dialog'); theater.className='media-theater';
   const header = document.createElement('div'); header.className='media-theater-header';
   const title = document.createElement('p'); title.id='media-theater-title';
   theater.setAttribute('aria-labelledby',title.id);
   const close = button('close','Close expanded view (Esc)');
   close.addEventListener('click',()=>theater.close());
   header.append(title,close); theater.append(header); document.body.append(theater);
   theater.addEventListener('close',()=>{ restoreTheater?.(); restoreTheater=null; });
   theater.addEventListener('click',event=>{ if(event.target===theater) {
    const rect=theater.getBoundingClientRect();
    if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom) theater.close();
   }});
  }
  const placeholder=document.createElement('div'); placeholder.className='media-placeholder';
  placeholder.style.height=`${player.shell.getBoundingClientRect().height}px`;
  const focused=document.activeElement;
  player.shell.replaceWith(placeholder);
  theater.querySelector('p').textContent=video.getAttribute('aria-label')||'Video';
  theater.append(player.shell);
  restoreTheater=()=>{ placeholder.replaceWith(player.shell); document.body.classList.remove('media-theater-open'); focused?.focus?.({preventScroll:true}); };
  document.body.classList.add('media-theater-open'); theater.showModal();
 }
 async function metadata(video) {
  if (video.readyState>=1 && Number.isFinite(video.duration)) return;
  await new Promise((resolve,reject)=>{
   const done=()=>{cleanup();resolve();}; const fail=()=>{cleanup();reject(new Error('Video could not load.'));};
   const cleanup=()=>{video.removeEventListener('loadedmetadata',done);video.removeEventListener('error',fail);};
   video.addEventListener('loadedmetadata',done,{once:true}); video.addEventListener('error',fail,{once:true});
   video.preload='metadata'; if(!video.currentSrc||video.networkState===3) video.load();
  });
 }
 async function play(video) {
  const p=players.get(video);
  try { await video.play(); }
  catch(error) {
   if(error.name==='NotAllowedError') p?.notice('Press Play to start the video.',false);
   else if(error.name!=='AbortError') p?.notice('Video could not start. Try again.',true);
  }
 }
 async function seek(video, seconds, resume=false) {
  try {
   await metadata(video);
   video.currentTime=Math.max(0,Math.min(video.duration,Number(seconds)||0));
   players.get(video)?.update(); if(resume) await play(video);
  } catch { players.get(video)?.notice('Video could not load. Try again.',true); }
 }
 videos.forEach(video=>{
  const group=video.closest('[data-pair]');
  const startTime=Math.max(0,Number(video.dataset.startTime)||0);
  const initialPosition=()=>{if(startTime)video.currentTime=Math.min(startTime,video.duration||startTime);};
  if(video.readyState>=1) initialPosition();
  else video.addEventListener('loadedmetadata',initialPosition,{once:true});
  const shell=document.createElement('div'); shell.className='media-player is-paused';
  shell.tabIndex=0; shell.setAttribute('role','group');
  shell.setAttribute('aria-label',video.getAttribute('aria-label')||'Video player');
  const stage=document.createElement('div'); stage.className='media-stage';
  video.before(shell); stage.append(video); shell.append(stage);
  const big=button('play','Play video','media-big-play'); stage.append(big);
  const status=document.createElement('div'); status.className='media-notice'; status.setAttribute('role','status');
  const message=document.createElement('span');
  const retry=document.createElement('button'); retry.type='button';retry.textContent='Try again';retry.hidden=true;
  retry.addEventListener('click',()=>{ video.load();play(video); });
  status.append(message,retry); stage.append(status);
  const controls=document.createElement('div');controls.className='media-controls';
  const range=document.createElement('input'); range.type='range';range.className='media-seek';
  range.min='0';range.max='0';range.step='.1';range.value='0';range.disabled=true;range.setAttribute('aria-label','Seek through video');
  const row=document.createElement('div');row.className='media-control-row';
  const toggle=button('play','Play video','media-play');
  const replay=button('back','Replay from the beginning','media-replay');
  const time=document.createElement('span');time.className='media-time';time.textContent='0:00 / --:--';
  const speed=document.createElement('select');speed.className='media-speed';speed.setAttribute('aria-label','Playback speed');
  const defaultRate=Number(video.dataset.defaultPlaybackRate)||1;
 video.defaultPlaybackRate=defaultRate;video.playbackRate=defaultRate;
 [.5,.75,1,1.25,1.5,2,5,10].forEach(rate=>{const option=document.createElement('option');option.value=String(rate);option.textContent=`${rate}×`;option.selected=rate===defaultRate;speed.append(option);});
  const captions=button('captions','Show captions','media-captions');captions.setAttribute('aria-pressed','false');
  captions.hidden=!video.querySelector('track[kind="captions"]');
  const enlarge=button('expand','Expand video (T)','media-expand');
  const expandLabel=document.createElement('span');expandLabel.className='media-expand-label';expandLabel.textContent='Expand';enlarge.append(expandLabel);
  const fullscreen=button('fullscreen','Fullscreen (F)','media-fullscreen');
  fullscreen.hidden=!shell.requestFullscreen&&!video.webkitEnterFullscreen;
  row.append(toggle,replay,time,speed,captions,enlarge,fullscreen);controls.append(range,row);shell.append(controls);
  let dragging=false;
  const notice=(value,error)=>{message.textContent=value;shell.classList.toggle('has-error',error);shell.classList.toggle('has-notice',!error);retry.hidden=!error;};
  const update=()=>{
   const duration=video.duration,current=dragging?Number(range.value):(video.currentTime||0),paused=video.paused||video.ended;
   shell.classList.toggle('is-paused',paused);
   toggle.innerHTML=svg(paused?'play':'pause'); toggle.setAttribute('aria-label',paused?'Play video':'Pause video'); toggle.title=paused?'Play video':'Pause video';
   big.setAttribute('aria-label',video.ended?'Replay video':'Play video');
   time.textContent=`${stamp(current)} / ${stamp(duration)}`;
   const known=Number.isFinite(duration)&&duration>0;
   range.disabled=!known;range.max=known?String(duration):'0';
   if(!dragging) range.value=String(current);
   range.style.setProperty('--played',`${known?current/duration*100:0}%`);
   range.setAttribute('aria-valuetext',`${stamp(current)} of ${stamp(duration)}`);
   speed.value=String(video.playbackRate);
  };
  const player={shell,group,update,notice};players.set(video,player);
  const togglePlay=()=>{ if(video.paused||video.ended){ if(video.ended)video.currentTime=startTime;play(video); }else video.pause(); };
  big.addEventListener('click',togglePlay);toggle.addEventListener('click',togglePlay);
  video.addEventListener('click',togglePlay);video.addEventListener('dblclick',()=>expand(video));
  replay.addEventListener('click',()=>seek(video,startTime,true));
  const commitScrub=()=>{
   if(!dragging) return;
   const target=Number(range.value);dragging=false;
   seek(video,target);
  };
  range.addEventListener('pointerdown',event=>{
   dragging=true;range.setPointerCapture?.(event.pointerId);
  });
  range.addEventListener('pointerup',commitScrub);
  range.addEventListener('pointercancel',()=>{dragging=false;update();});
  range.addEventListener('blur',commitScrub);
  range.addEventListener('change',()=>{if(dragging)commitScrub();else seek(video,Number(range.value));});
  range.addEventListener('input',()=>{
   if(dragging) update();
   else seek(video,Number(range.value));
  });
  range.addEventListener('keydown',event=>{if(['ArrowLeft','ArrowRight'].includes(event.key)){event.preventDefault();seek(video,video.currentTime+(event.key==='ArrowRight'?5:-5));}});
  speed.addEventListener('change',()=>{video.playbackRate=Number(speed.value);});
  const toggleCaptions=()=>{
   const on=captions.getAttribute('aria-pressed')!=='true';
   [...video.textTracks].filter(track=>track.kind==='captions').forEach(track=>{track.mode=on?'showing':'hidden';});
   captions.setAttribute('aria-pressed',String(on));captions.setAttribute('aria-label',on?'Hide captions':'Show captions');
  };
  captions.addEventListener('click',toggleCaptions);enlarge.addEventListener('click',()=>expand(video));
  const toggleFullscreen=async()=>{
   try {
    if(document.fullscreenElement) await document.exitFullscreen();
    else if(shell.requestFullscreen) await shell.requestFullscreen();
    else if(video.webkitEnterFullscreen) video.webkitEnterFullscreen();
   } catch { expand(video); }
  };
  fullscreen.addEventListener('click',toggleFullscreen);
  shell.addEventListener('keydown',event=>{
   if(event.target.closest('input,select') || (event.target.closest('button,a')&&[' ','Enter'].includes(event.key))) return;
   if([' ','k'].includes(event.key)){event.preventDefault();togglePlay();}
   else if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();seek(video,video.currentTime+(event.key==='ArrowRight'?5:-5));}
   else if(event.key==='f'){event.preventDefault();toggleFullscreen();}
   else if(event.key==='t'){event.preventDefault();expand(video);}
   else if(event.key==='c'&&!captions.hidden){event.preventDefault();toggleCaptions();}
  });
  ['loadedmetadata','durationchange','timeupdate','play','pause','ended','seeked','ratechange'].forEach(name=>video.addEventListener(name,update));
  video.addEventListener('play',()=>{
   shell.classList.remove('has-notice','has-error');
   videos.forEach(other=>{ if(other!==video&&(!group||players.get(other)?.group!==group)) other.pause(); });
  });
  video.addEventListener('waiting',()=>{if(!shell.classList.contains('has-error'))message.textContent='Loading video…';shell.classList.add('is-loading');});
  ['playing','canplay','pause','ended'].forEach(name=>video.addEventListener(name,()=>shell.classList.remove('is-loading')));
  video.addEventListener('error',()=>{shell.classList.remove('is-loading');notice('Video could not load. Try again.',true);});
  video.addEventListener('webkitbeginfullscreen',()=>{video.controls=true;});
  video.addEventListener('webkitendfullscreen',()=>{video.controls=false;});
  // Keep native controls if JS fails before the accessible controls are ready.
  video.controls=false;video.preload='metadata';video.tabIndex=-1;update();
 });
 window.SO101Players={seek,expand};
})();
