import {assessMonarchOuting, seasonChapter, habitatAdvice} from './field-guide-logic.js';

const byId = id => document.getElementById(id);
const seasons=['spring','summer','fall','winter'];
const sites=['shoreline','meadow','garden'];
let latest=null;
let latestName='';
let selectedSeason='fall';
let selectedSite='shoreline';
let note='';

function renderSeason(){
  const chapter=seasonChapter(selectedSeason,latest);
  byId('fieldSeasonTitle').textContent=chapter.title;
  byId('fieldSeasonStory').textContent=chapter.story;
  byId('fieldSeasonTiming').textContent=chapter.local;
  byId('fieldSeasonType').textContent=latest?.population==='west'
    ? 'WESTERN SEASONAL CONTEXT':'EASTERN SEASONAL CONTEXT';
  for(const button of document.querySelectorAll('[data-monarch-season]')){
    const active=button.dataset.monarchSeason===selectedSeason;
    button.classList.toggle('active',active);
    button.setAttribute('aria-selected',String(active));
    button.tabIndex=active?0:-1;
  }
}

function renderHabitat(){
  byId('fieldSiteAdvice').textContent=habitatAdvice(selectedSite,latest);
  for(const button of document.querySelectorAll('[data-monarch-site]')){
    const active=button.dataset.monarchSite===selectedSite;
    button.classList.toggle('active',active);
    button.setAttribute('aria-pressed',String(active));
  }
}

function renderGuide(data,label){
  latest=data;
  latestName=label || 'Selected location';
  const plan=assessMonarchOuting(data);
  const tag=byId('fieldVerdictTag');
  tag.textContent=plan.tag;
  tag.className='field-verdict field-verdict--'+plan.tone;
  byId('fieldPlanTitle').textContent=plan.title;
  byId('fieldPlanSummary').textContent=plan.summary;
  byId('fieldPlanCaveat').textContent=plan.caveat;
  byId('fieldPlanPlace').textContent=latestName;
  byId('fieldEvidence').replaceChildren(...plan.evidence.map(item=>{
    const row=document.createElement('div');
    row.className='field-evidence-row';
    const labelEl=document.createElement('span');
    labelEl.textContent=item.label;
    const valueEl=document.createElement('strong');
    valueEl.textContent=item.value;
    row.append(labelEl,valueEl);
    return row;
  }));
  note='Monarch Migration Live — '+latestName+'\n'+plan.tag+': '+plan.title+'\n'+plan.summary+'\n'+
    plan.evidence.map(item=>item.label+': '+item.value).join('\n')+'\n'+plan.caveat+
    '\nSource: https://chrisizworski.com/national-tools/monarch-migration-live';
  byId('fieldCopy').disabled=false;
  byId('fieldCopyStatus').textContent='';
  renderSeason();
  renderHabitat();
}

function selectSeason(name,focus=false){
  if(!seasons.includes(name))return;
  selectedSeason=name;
  renderSeason();
  if(focus) document.querySelector('[data-monarch-season="'+name+'"]')?.focus();
}
for(const button of document.querySelectorAll('[data-monarch-season]')){
  button.addEventListener('click',()=>selectSeason(button.dataset.monarchSeason));
  button.addEventListener('keydown',event=>{
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
    event.preventDefault();
    const index=seasons.indexOf(button.dataset.monarchSeason);
    const next=event.key==='Home'?0:event.key==='End'?3:
      (index+(event.key==='ArrowRight'?1:3))%4;
    selectSeason(seasons[next],true);
  });
}
for(const button of document.querySelectorAll('[data-monarch-site]')){
  button.addEventListener('click',()=>{selectedSite=button.dataset.monarchSite;renderHabitat();});
}

byId('fieldCopy').addEventListener('click',async()=>{
  if(!note)return;
  try{
    if(!navigator.clipboard?.writeText)throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText(note);
    byId('fieldCopyStatus').textContent='Field note copied.';
  }catch{
    byId('fieldCopyStatus').textContent='Clipboard not available in this browser. You can select the local readout above.';
  }
});

document.addEventListener('monarch:context',event=>{
  if(event.detail?.data)renderGuide(event.detail.data,event.detail.label);
});

// Meaningful static state while sources are loading or location permission is denied.
renderSeason();
renderHabitat();
