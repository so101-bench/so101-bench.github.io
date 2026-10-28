'use strict';
const primaryMetricLabels={score:'Benchmark score',ROBUST:'ROBUST',PLAN:'PLAN',MEM:'MEM',unseen_unseen_class:'Unseen class'};
const policyReleasePages = [
 ['GPT-6.1 Sol', 'https://openai.com/index/introducing-gpt-6-1-sol/'],
 ['DeepSeek V4.1 Flash', 'https://www.deepseek.com/en/news/deepseek-v4-1-flash/'],
 ['InternW0-', 'https://internrobotics.github.io/InternW0-Delta/'],
 ['Galaxea 0.5', 'https://opengalaxea.github.io/G05/'],
 ['NVIDIA GR00T N1.7', 'https://github.com/NVIDIA/Isaac-GR00T/releases/tag/n1.7-release'],
 ['ImageWAM', 'https://zhangwenyao1.github.io/ImageWAM/'],
 ['Physical Intelligence π0.5', 'https://www.pi.website/blog/pi05'],
 ['LaWAM', 'https://rlinf.github.io/LaWAM/'],
 ['Ai2 MolmoAct2-SO100_101', 'https://huggingface.co/allenai/MolmoAct2-SO100_101'],
 ['Ai2 MolmoAct2 (base)', 'https://allenai.org/blog/molmoact2'],
 ['FLUX 3 Action', 'https://bfl.ai/models/flux-3-action']
];
const policyLogos = [
 ['GPT-6.1 Sol','openai.png'],['DeepSeek V4.1 Flash','deepseek.png'],
 ['InternW0-','internw0.png'],['Galaxea 0.5','galaxea.png'],
 ['NVIDIA GR00T','nvidia.png'],['ImageWAM','imagewam.svg'],
 ['Physical Intelligence','pi.png'],['LaWAM','rlinf.svg'],
 ['Ai2 MolmoAct2','ai2.png'],['FLUX 3 Action','bfl.png']
];
function addPolicyLogo(name, label) {
 const asset=policyLogos.find(([prefix])=>label.startsWith(prefix))?.[1];
 if(!asset)return;
 const logo=element('img','policy-logo'+(asset==='galaxea.png'?' policy-logo-wide':''));
 logo.src='/assets/brands/policies/'+asset;logo.alt='';logo.setAttribute('aria-hidden','true');
 logo.width=asset==='galaxea.png'?48:22;logo.height=22;logo.decoding='async';
 name.prepend(logo);
}
function releaseLink(label, url, className='policy-name') {
 const link=element('a',className,label);link.href=url;link.target='_blank';link.rel='noopener noreferrer';
 link.title=label+' — official release (opens in new tab)';return link;
}
let results=[],filter='all',metric='score';
const expandedPolicies=new Set();
const cellSplits=[['seen','Seen'],['unseen_seen_class','New instance'],['unseen_unseen_class','New class']];
const cellTasks=[['bin_1','1-object bin'],['bin_4','4-object bin'],['next_to','Next to'],['between','Between'],['move','Move']];
function metricValue(row,key){return key==='score'?row.score:(row.rates[key]?.rate??-1)*100;}
function element(tag,className,text){const el=document.createElement(tag);if(className)el.className=className;if(text!==undefined)el.textContent=text;return el;}
function cellBreakdown(row,id){
 const detail=element('tr','cell-breakdown');detail.id=id;detail.hidden=!expandedPolicies.has(row.policy);
 const container=element('td');container.colSpan=11;
 const panel=element('div','cell-panel'),table=element('table','cell-matrix');
 table.append(element('caption','',row.policy+' · 15 task × object-split cells'));
 const head=element('thead'),header=element('tr');header.append(element('th','','Object split / task'));
 for(const [,label] of cellTasks)header.append(element('th','',label));
 for(const th of header.children)th.scope='col';head.append(header);table.append(head);
 const body=element('tbody');
 for(const [split,label] of cellSplits){
  const tr=element('tr'),heading=element('th','',label);heading.scope='row';tr.append(heading);
  for(const [task] of cellTasks){
   const rate=row.cells?.[split+'/'+task],td=element('td','cell-result');
   const available=rate?.n>0&&rate.rate!=null;
   td.append(element('strong','',available?(rate.rate*100).toFixed(1)+'%':'—'),element('small','',available?`${rate.successes} / ${rate.n}`:'No episodes'));
   if(available)td.style.setProperty('--cell-strength',String(rate.rate));
   td.title=available?`${rate.successes} successes in ${rate.n} episodes`:'No evaluated episodes';tr.append(td);
  }
  body.append(tr);
 }
 table.append(body);panel.append(table,element('p','cell-explanation','Each cell shows success rate and successes / evaluated episodes. The benchmark score weights all 15 cells equally.'));
 container.append(panel);detail.append(container);return detail;
}
function renderResults(){
 const body=$('#leaderboard-body'),focused=document.activeElement?.dataset.policyToggle;
 body.replaceChildren();
 const visible=results.filter(r=>filter==='all'||(filter==='agents'?r.type.startsWith('LLM'):!r.type.startsWith('LLM'))).sort((a,b)=>metricValue(b,metric)-metricValue(a,metric));
 visible.forEach((r,index)=>{
  const tr=element('tr','policy-row'+(r.type.startsWith('LLM')?' agent-row':''));
  tr.append(element('td','',String(index+1).padStart(2,'0')));
  const fullName=r.policy.replace('InternW0-Delta','InternW0-Δ').replace(' (PyRUA)','');
  const parts=fullName.split(' + PyRUA-Lean '),policy=element('td','policy-cell');policy.title=fullName;
  const release=policyReleasePages.find(([prefix])=>fullName.startsWith(prefix))?.[1];
  const name=release?releaseLink(parts[0],release):element('span','policy-name',parts[0]);
  addPolicyLogo(name,fullName);
  policy.append(name,element('span','policy-type',r.type.startsWith('LLM')?'AGENT':r.type));
  if(parts.length>1){
   const harness=element('small','policy-harness'),version=parts[1].split(' + Galaxea 0.5')[0];
   harness.append(releaseLink('PyRUA-Lean '+version,'https://dagroup-pku.github.io/PyRUA-Lean/',''),document.createTextNode(' + '),releaseLink('Galaxea 0.5','https://opengalaxea.github.io/G05/',''));policy.append(harness);
  }
  const detailId='policy-cells-'+results.indexOf(r),toggle=element('button','cell-toggle');toggle.type='button';toggle.dataset.policyToggle=r.policy;
  const detail=cellBreakdown(r,detailId);
  const syncToggle=()=>{
   const open=expandedPolicies.has(r.policy);detail.hidden=!open;toggle.setAttribute('aria-expanded',String(open));toggle.textContent=(open?'−':'＋')+' 15 cells';
  };
  toggle.setAttribute('aria-controls',detailId);toggle.setAttribute('aria-label','Show or hide 15 task by object-split cells for '+fullName);
  toggle.addEventListener('click',()=>{if(expandedPolicies.has(r.policy))expandedPolicies.delete(r.policy);else expandedPolicies.add(r.policy);syncToggle();});syncToggle();policy.append(toggle);tr.append(policy);
  tr.append(element('td','finetuning-cell','36 hrs'),element('td','finetuning-cell','4×A100'));
  const score=element('td','score-cell'+(metric==='score'?' current':''));
  score.append(element('strong','',r.score==null?'—':r.score.toFixed(1)),element('small','',r.ci_lo==null?'':`[${r.ci_lo.toFixed(1)}, ${r.ci_hi.toFixed(1)}]`));
  const track=element('div','score-track'),fill=element('span');fill.style.width=(r.score??0)+'%';track.append(fill);score.append(track);tr.append(score);
  for(const key of ['seen','unseen_seen_class','unseen_unseen_class','ROBUST','PLAN','MEM']){
   const rate=r.rates[key]??{rate:null,successes:0,n:0},td=element('td','metric-cell'+(metric===key?' current':''),rate.rate==null?'—':(rate.rate*100).toFixed(0)+'%');
   td.title=`${rate.successes}/${rate.n} successes`;td.setAttribute('aria-label',rate.rate==null?'No evaluated episodes':`${(rate.rate*100).toFixed(1)} percent, ${rate.successes} successes in ${rate.n} episodes`);tr.append(td);
  }
  body.append(tr,detail);
 });
 if(focused)[...body.querySelectorAll('.cell-toggle')].find(button=>button.dataset.policyToggle===focused)?.focus({preventScroll:true});
 $('#table-note').textContent=(metric==='score'?'':`Sorted by ${primaryMetricLabels[metric]} raw success. `)+'Score: equal-weight cell mean · 95% CI. Expand “15 cells” for task × object-split results.';
}
$$('[data-filter]').forEach(button=>button.addEventListener('click',()=>{filter=button.dataset.filter;$$('[data-filter]').forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-pressed',String(b===button));});renderResults();}));
$('#rank-metric').addEventListener('change',e=>{metric=e.target.value;renderResults();});
let refreshing=false;
async function refreshUpdates(){
 const list=$('#leaderboard-update-log');
 try{
  const response=await fetch('/data/leaderboard-updates.json',{cache:'no-store'});
  if(!response.ok)throw Error('Updates unavailable');
  const updates=await response.json();
  const entries=[...updates].sort((a,b)=>Date.parse(b.timestamp)-Date.parse(a.timestamp)).map(update=>{
   const item=element('li');
   const date=new Date(update.timestamp),time=element('time','',new Intl.DateTimeFormat(undefined,{year:'numeric',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit',timeZoneName:'short'}).format(date));
   time.dateTime=update.timestamp;
   item.append(time,element('span','',update.message));return item;
  });
  list.replaceChildren(...entries);
 }catch{if(!list.querySelector('time'))list.replaceChildren(element('li','','Updates could not be loaded. Try Refresh.'));}
}
async function refreshResults(){
 if(refreshing)return;refreshing=true;const button=$('#refresh-results');button.disabled=true;
 try{const response=await fetch('/data/live-leaderboard.json',{cache:'no-store'});if(!response.ok)throw Error('Results unavailable');const data=await response.json();results=data.rows;renderResults();$('#live-updated').textContent=`${results.length} policies · ${data.episodes} episodes · Updated ${data.updated}`;}
 catch{if(!results.length)$('#leaderboard-body').innerHTML='<tr><td colspan="11">Results could not be loaded. Try Refresh or download the CSV.</td></tr>';$('#live-updated').textContent='Could not refresh published results. Displayed data is retained.';}
 finally{await refreshUpdates();refreshing=false;button.disabled=false;}
}
$('#refresh-results').addEventListener('click',refreshResults);refreshResults();setInterval(()=>{if(!document.hidden)refreshResults();},60000);
