'use strict';
(() => {
  const root=document.documentElement;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  root.classList.add('js');
  root.classList.toggle('motion',!reduced.matches);
  const $=selector=>document.querySelector(selector);
  const $$=selector=>[...document.querySelectorAll(selector)];
  const records=window.TEZERI_MEDIA||[];
  const tabs=$$('[data-media]');
  const panel=$('#media-panel');
  let current=0, variant=false;
  const names={project:['Другой ракурс','Первый ракурс'],glazing:['Посмотреть смету','Вернуться к чертежу'],materials:['Документ для бригады','Вернуться к материалам'],analytics:['Крупнее: показатели','Полный экран отчёта']};
  function showMedia(id,focus=false){
    current=Math.max(0,records.findIndex(item=>item.id===id));
    variant=false;
    render();
    if(focus)tabs[current].focus({preventScroll:true});
  }
  function render(){
    const record=records[current];
    if(!record)return;
    tabs.forEach((tab,index)=>{tab.setAttribute('aria-selected',String(index===current));tab.tabIndex=index===current?0:-1;});
    panel.className='media-panel '+record.format;
    panel.setAttribute('aria-labelledby','media-tab-'+record.id);
    $('#media-title').textContent=record.title;
    $('#media-description').textContent=record.description;
    const file=variant&&record.second?record.second:record.image;
    const image=$('#media-image');
    image.src='assets/media/'+file;
    image.alt=variant?'Второй фрагмент настоящего интерфейса: '+record.label:record.alt;
    const dimensions=(window.TEZERI_MEDIA_DIMENSIONS||{})[file];
    if(dimensions){image.width=dimensions[0];image.height=dimensions[1];}
    const second=$('#media-second');
    second.hidden=record.format!=='finance';
    if(record.format==='finance'){second.src='assets/media/'+record.second;second.alt='Фрагмент той же карточки: себестоимость, внесённые расходы и маржа';}
    else second.src='assets/media/order-costs.webp';
    $('#media-original').href='assets/media/'+file;
    $('#media-note').textContent=record.note;
    $('#media-variant').hidden=!record.second||record.format==='finance';
    const labels=names[record.id]||['Другой фрагмент','Первый фрагмент'];
    $('#media-variant').textContent=labels[variant?1:0];
  }
  tabs.forEach((tab,index)=>{
    tab.addEventListener('click',()=>showMedia(tab.dataset.media));
    tab.addEventListener('keydown',event=>{
      let next=index;
      if(['ArrowRight','ArrowDown'].includes(event.key))next=(index+1)%tabs.length;
      else if(['ArrowLeft','ArrowUp'].includes(event.key))next=(index+tabs.length-1)%tabs.length;
      else if(event.key==='Home')next=0;
      else if(event.key==='End')next=tabs.length-1;
      else return;
      event.preventDefault();showMedia(tabs[next].dataset.media,true);
      tabs[next].scrollIntoView({block:'nearest',inline:'nearest',behavior:'auto'});
    });
  });
  $('#media-variant').addEventListener('click',()=>{variant=!variant;render();});
  $$('[data-product-link]').forEach(link=>link.addEventListener('click',event=>{
    event.preventDefault();showMedia(link.dataset.productLink==='glazing'?'glazing':'project');
    $('#story').scrollIntoView({behavior:'auto'});tabs[current].focus({preventScroll:true});
  }));
  $$('[data-step-link]').forEach(link=>link.addEventListener('click',event=>{
    event.preventDefault();const ids=['order','glazing','materials','money'];
    showMedia(ids[Number(link.dataset.stepLink)]||'order');$('#story').scrollIntoView({behavior:'auto'});tabs[current].focus({preventScroll:true});
  }));
  const orientation=()=>$('.program-tabs').setAttribute('aria-orientation',innerWidth<=850?'horizontal':'vertical');
  orientation();showMedia('order');

  const merge=$('#merge'),sticky=$('.merge-sticky'),canvas=$('.merge-canvas'),final=$('.merge-final');
  let manual=null,queued=false,lastProgress=0;
  function smooth(a,b,x){const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);}
  function paint(progress){
    if(reduced.matches)progress=1;
    lastProgress=progress;
    const gather=smooth(.02,.64,progress),fade=smooth(.48,.7,progress),reveal=smooth(.63,.9,progress);
    canvas.style.setProperty('--g',gather.toFixed(4));canvas.style.setProperty('--fade',fade.toFixed(4));canvas.style.setProperty('--reveal',reveal.toFixed(4));
    final.inert=reveal<.9;
    final.setAttribute('aria-hidden',String(reveal<.9));
    $('#merge-toggle').textContent=progress>.7?'Показать 4 инструмента':'Показать объединение';
    $('#merge-toggle').setAttribute('aria-pressed',String(progress>.7));
    $('#merge-caption').textContent=progress>.7?'Проект, расчёт, материалы и оплаты — в контексте одного заказа.':'Листайте: отдельные инструменты собираются в один заказ.';
  }
  function update(){
    queued=false;
    if(manual!==null){paint(manual);return;}
    if(reduced.matches){paint(1);return;}
    const top=merge.getBoundingClientRect().top;
    const pinTop=innerWidth<=640?66:innerWidth<=850?72:80;
    const travel=Math.max(1,merge.offsetHeight-sticky.offsetHeight);
    paint(Math.max(0,Math.min(1,(pinTop-top)/travel)));
  }
  $('#merge-toggle').addEventListener('click',()=>{manual=lastProgress>.7?0:1;canvas.classList.add('manual-motion');paint(manual);});
  function resumeScroll(){manual=null;canvas.classList.remove('manual-motion');if(!queued){queued=true;requestAnimationFrame(update);}}
  addEventListener('wheel',resumeScroll,{passive:true});addEventListener('touchmove',resumeScroll,{passive:true});
  addEventListener('scroll',()=>{if(!queued){queued=true;requestAnimationFrame(update);}},{passive:true});
  addEventListener('resize',()=>{orientation();update();},{passive:true});
  reduced.addEventListener('change',()=>{root.classList.toggle('motion',!reduced.matches);manual=null;update();});
  update();
  const videos=$$('video');
  videos.forEach(video=>video.addEventListener('play',()=>videos.forEach(other=>{if(other!==video)other.pause();})));
  document.addEventListener('visibilitychange',()=>{if(document.hidden)videos.forEach(video=>video.pause());});
})();
