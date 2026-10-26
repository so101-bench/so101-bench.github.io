'use strict';
(() => {
 const pair=document.querySelector('[data-pair="correspondence"]');if(!pair)return;
 const videos=[...pair.querySelectorAll('video')];
 const key='so101-correspondence-crops-v1';
 const defaults=[{zoom:640/480,x:128,y:120},{zoom:640/448,x:160,y:144}];
 let saved;try{saved=JSON.parse(localStorage.getItem(key));}catch{}
 const states=defaults.map((d,i)=>({...d,...saved?.[i]}));
 const toggle=document.createElement('button');toggle.type='button';toggle.textContent='Adjust crops';toggle.setAttribute('aria-expanded','false');pair.querySelector('.pair-toolbar').append(toggle);
 const panel=document.createElement('div');panel.className='crop-editor';panel.hidden=true;
 const note=document.createElement('p');note.textContent='Adjust each original camera view. Changes save in this browser; Reset restores the reference framing.';panel.append(note);
 const grid=document.createElement('div');grid.className='crop-editor-grid';panel.append(grid);
 const controls=[];
 function apply(i){
  const v=videos[i],stage=v.closest('.media-stage');if(!stage)return;
  const c=states[i];c.zoom=Math.max(1,Math.min(3,Number(c.zoom)||1));const width=640/c.zoom,height=480/c.zoom;
  c.x=Math.max(0,Math.min(640-width,Number(c.x)||0));c.y=Math.max(0,Math.min(480-height,Number(c.y)||0));
  stage.classList.add('manual-crop-stage');v.style.width=`${640/width*100}%`;v.style.left=`${-c.x/width*100}%`;v.style.top=`${-(c.y+50)/height*100}%`;
  const ui=controls[i];if(ui){ui.zoom.input.value=c.zoom;ui.x.input.max=640-width;ui.y.input.max=480-height;ui.x.input.value=c.x;ui.y.input.value=c.y;ui.zoom.out.value=c.zoom.toFixed(2)+'×';ui.x.out.value=Math.round(c.x)+' px';ui.y.out.value=Math.round(c.y)+' px';}
 }
 function persist(){try{localStorage.setItem(key,JSON.stringify(states));}catch{}}
 function original(i){
  const v=videos[i],source=v.querySelector('source'),url=i?'assets/videos/correspondence-ep594-sim-1x.mp4':'assets/videos/correspondence-ep594-real-1x-trim7.mp4';
  if(source.getAttribute('src')===url){apply(i);return;}
  const time=v.currentTime||Number(v.dataset.startTime)||0,playing=!v.paused;v.pause();source.src=url;v.removeAttribute('poster');
  v.addEventListener('loadedmetadata',()=>{v.currentTime=Math.min(time,v.duration);apply(i);if(playing)v.play().catch(()=>{});},{once:true});v.load();apply(i);
 }
 videos.forEach((v,i)=>{
  const caption=document.createElement('figcaption');caption.className='crop-camera-label';caption.textContent=(i?'Simulation · sim-only':'Real robot · real-only')+' · NVIDIA GR00T N1.6-3B';v.closest('figure').prepend(caption);
  const group=document.createElement('fieldset'),legend=document.createElement('legend');legend.textContent=i?'Simulation crop':'Real-robot crop';group.append(legend);const ui={};controls.push(ui);
  for(const [name,label,min,max,step] of [['zoom','Zoom',1,3,.01],['x','Horizontal',0,640,1],['y','Vertical',0,480,1]]){
   const line=document.createElement('label'),text=document.createElement('span'),input=document.createElement('input'),out=document.createElement('output');text.textContent=label;input.type='range';input.min=min;input.max=max;input.step=step;input.setAttribute('aria-label',`${legend.textContent}: ${label}`);line.append(text,input,out);group.append(line);ui[name]={input,out};
   input.addEventListener('input',()=>{states[i][name]=Number(input.value);original(i);apply(i);persist();});
  }
  const reset=document.createElement('button');reset.type='button';reset.textContent='Reset crop';reset.addEventListener('click',()=>{states[i]={...defaults[i]};original(i);apply(i);persist();});group.append(reset);grid.append(group);
 });
 const download=document.createElement('button');download.type='button';download.textContent='Download crop settings';
 download.addEventListener('click',()=>{
  const settings=states.map((c,i)=>{const w=640/c.zoom,h=480/c.zoom;return {domain:i?'sim':'real',crop:[Math.round(c.x),Math.round(c.y),Math.round(c.x+w),Math.round(c.y+h)],coordinates:'xyxy in original 640×480 camera image, excluding header'};});
  const a=document.createElement('a');a.href='data:application/json;charset=utf-8,'+encodeURIComponent(JSON.stringify(settings,null,2));a.download='correspondence-crop-settings.json';a.click();
 });panel.append(download);
 pair.querySelector('.hero-film').after(panel);
 toggle.addEventListener('click',()=>{panel.hidden=!panel.hidden;toggle.setAttribute('aria-expanded',String(!panel.hidden));toggle.textContent=panel.hidden?'Adjust crops':'Hide crop controls';if(!panel.hidden)videos.forEach((v,i)=>original(i));});
 if(saved)videos.forEach((v,i)=>original(i));
})();
