'use strict';
(() => {
 const cards = [...document.querySelectorAll('[data-hybrid-explainer]')];
 if (!cards.length) return;
 const videos = cards.map(card => card.querySelector('video'));
 const stamp = seconds => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
 document.addEventListener('visibilitychange', () => { if (document.hidden) videos.forEach(video => video.pause()); });
 fetch('data/sol-explainers.json', { cache: 'no-cache' }).then(response => {
  if (!response.ok) throw new Error('Chapter metadata unavailable');
  return response.json();
 }).then(records => {
  cards.forEach(card => {
   const record = records.find(row => row.kind === card.dataset.hybridExplainer);
   if (!record) return;
   const video = card.querySelector('video');
   const chapters = card.querySelector('.explainer-chapters');
   const buttons = record.chapters.map(chapter => {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.seconds = chapter.seconds;
    const time = document.createElement('time');
    time.textContent = stamp(chapter.seconds);
    const title = document.createElement('span');
    title.textContent = chapter.title;
    button.append(time, title);
    button.addEventListener('click', () => {
     card.querySelector('.explainer-chapter-menu')?.removeAttribute('open');
     if(window.SO101Players){window.SO101Players.seek(video,chapter.seconds,true);return;}
     const seek = () => { video.currentTime = chapter.seconds; video.play().catch(() => {}); };
     if (video.readyState >= 1) seek();
     else { video.addEventListener('loadedmetadata', seek, { once: true }); video.load(); }
    });
    chapters.append(button);
    return button;
   });
   const update = () => {
    let active = -1;
    record.chapters.forEach((chapter, index) => { if (chapter.seconds <= video.currentTime + .1) active = index; });
    buttons.forEach((button, index) => button.setAttribute('aria-current', String(index === active)));
    const summary=card.querySelector('.explainer-chapter-menu summary');
    if(summary)summary.textContent=active<0?'Chapters':`Chapters · ${record.chapters[active].title}`;
   };
   video.addEventListener('timeupdate', update);
   video.addEventListener('loadedmetadata', update);
   update();
  });
 }).catch(() => {
  // Native playback, captions and download links remain available without metadata.
 });
})();
