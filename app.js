'use strict';
(()=>{
const START='2026-10-12', END='2026-12-31', days=['Понедельник','Вторник','Среда','Четверг','Пятница','Суббота'],shortDays=['ПН','ВТ','СР','ЧТ','ПТ','СБ'],months=['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
const lessons=window.MARATKYZY_LESSONS||[];
const $=id=>document.getElementById(id);
const parseISO=d=>new Date(d+'T12:00:00');
const iso=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
const addDays=(date,days)=>{const d=parseISO(date);d.setDate(d.getDate()+days);return iso(d)};
const dateNice=d=>{const x=parseISO(d);return `${x.getDate()} ${months[x.getMonth()]}`};
const escapeHtml=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const weekDates=Array.from({length:12},(_,i)=>Array.from({length:6},(_,day)=>addDays(START,i*7+day)).filter(d=>d<=END));
const current=iso(new Date());
const todayIndex=Math.max(0,Math.min(11,Math.floor((parseISO(current)-parseISO(START))/(864e5*7))));
const initialDay=weekDates[todayIndex].includes(current)?weekDates[todayIndex].indexOf(current):0;
const storeKey='maratkyzy-pwa-status-v1';const themeKey='maratkyzy-pwa-theme-v1';
function loadStore(){try{return JSON.parse(localStorage.getItem(storeKey)||'{}')||{}}catch{return {}}}
let data=loadStore();let theme='dark';try{theme=localStorage.getItem(themeKey)||'dark'}catch{}
let state={week:todayIndex,day:initialDay,view:'day',query:'',type:'all',noteFor:null};
let toastTimer;
const dateKey=(date,lesson)=>date+'__'+lesson.id;
function save(){try{localStorage.setItem(storeKey,JSON.stringify(data));return true}catch{toast('Не удалось сохранить в этом браузере');return false}}
function toast(s){const el=$('toast');el.textContent=s;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2600)}
const lessonDate=()=>weekDates[state.week][state.day];
const lessonsForDay=day=>lessons.filter(l=>l.day===day).sort((a,b)=>a.minutes-b.minutes);
const kindClass=k=>k==='Лекция'?'lecture':(k==='Практика'||k==='Семинар')?'practice':k==='Лабораторная'?'lab':'srsp';
const palette={lecture:'#9eacff',practice:'#70dcbc',lab:'#caa5fb',srsp:'#efc58b'};
function renderWeekToolbar(){
 let w=weekDates[state.week];$('weekNumber').textContent=`${String(state.week+1).padStart(2,'0')} / 12`;
 $('weekRange').textContent=`${dateNice(w[0])} — ${dateNice(w[w.length-1])}`;
 $('prevWeek').disabled=state.week===0;$('nextWeek').disabled=state.week===11;
 $('weekSelect').value=String(state.week);
}
function renderDays(){
 $('dayStrip').innerHTML=weekDates[state.week].map((d,i)=>`<button type="button" class="day-pill ${state.day===i?'active':''} ${current===d?'today':''}" data-day="${i}" aria-label="${days[i]}, ${dateNice(d)}" aria-pressed="${state.day===i}"><span class="shortday">${shortDays[i]}</span><span class="datenum">${parseISO(d).getDate()}</span></button>`).join('');
}
function renderDay(){
 const date=lessonDate(),base=lessonsForDay(state.day);const filtered=base.filter(l=>(state.type==='all'||l.kind===state.type)&&[l.subject,l.short,l.teacher,l.room,l.kind].join(' ').toLowerCase().includes(state.query.toLowerCase()));
 $('dateLongLabel').textContent=`${days[state.day].toUpperCase()} / ${dateNice(date).toUpperCase()}`;
 $('dayTitle').textContent=days[state.day];$('dayCount').textContent=base.length;
 $('daySubtitle').textContent=base.length?`${base.length} ${base.length===1?'пара':base.length<5?'пары':'пар'} · ${base[0].start} — ${base.at(-1).end}`:'Занятий нет';
 $('lessonList').innerHTML=filtered.length?filtered.map((l,i)=>{
 const key=dateKey(date,l),obj=data[key]||{},cls=kindClass(l.kind),color=palette[cls];
 const begins=new Date(date+'T'+l.start+':00+05:00').getTime(), ends=new Date(date+'T'+l.end+':00+05:00').getTime(),now=Date.now();
 const isNow=now>=begins&&now<=ends;
 return `<div class="lesson-line"><div class="lesson-time"><strong>${l.start}</strong><small>${l.end}</small></div><article class="lesson-card ${obj.status==='attended'?'is-attended':obj.status==='missed'?'is-missed':''}" style="--card-accent:${color}"><div class="lesson-card-top"><div><div class="kind-tag">${escapeHtml(l.kind)}</div><h3>${escapeHtml(l.short)}</h3></div>${isNow?'<span class="lesson-badge now">Сейчас</span>':`<span class="lesson-badge">№ ${i+1}</span>`}</div><div class="details"><span class="detail"><span class="detail-icon">⌖</span>${escapeHtml(l.room)}</span><span class="detail"><span class="detail-icon">♙</span>${escapeHtml(l.teacher)}</span></div>${l.needsClarification?'<div class="schedule-warning">Уточнить: в исходной таблице на 10:00 указаны две пары.</div>':''}${obj.note?`<div class="lesson-note">${escapeHtml(obj.note)}</div>`:''}<div class="lesson-actions"><button type="button" class="mini-action ${obj.status==='attended'?'marked':''}" data-status="attended" data-key="${key}" aria-pressed="${obj.status==='attended'}">✓ Был${obj.status==='attended'?' ·':''}</button><button type="button" class="mini-action ${obj.status==='missed'?'missed':''}" data-status="missed" data-key="${key}" aria-pressed="${obj.status==='missed'}">✕ Пропуск</button><button type="button" class="mini-action" data-note="${key}">✎ ${obj.note?'Изменить заметку':'Заметка'}</button></div></article></div>`;
 }).join(''):(base.length?'<div class="empty-state"><b>Ничего не найдено</b>Попробуй другой предмет или отключи фильтр.</div>':'<div class="empty-state"><b>Занятий нет</b>В исходной таблице этот день свободен.</div>');
}
function renderWeek(){
 $('weekCards').innerHTML=weekDates[state.week].map((d,i)=>{const ls=lessonsForDay(i);return `<button class="week-day-card" type="button" data-open-day="${i}"><div class="week-card-header"><div><div class="week-card-name">${days[i]}</div><div class="week-card-date">${dateNice(d)}</div></div><span class="week-card-count">${ls.length} ${ls.length===1?'пара':ls.length<5?'пары':'пар'}</span></div>${ls.map(l=>`<div class="week-mini-item"><span class="week-mini-time">${l.start}</span><span>${escapeHtml(l.short)}</span></div>`).join('')}<span class="week-open">СМОТРЕТЬ ДЕНЬ →</span></button>`}).join('');
}
function renderView(){
 ['day','week','settings'].forEach(v=>{
  $(v+'View').classList.toggle('hidden',state.view!==v);
  document.querySelectorAll(`[data-view="${v}"]`).forEach(b=>{b.classList.toggle('active',state.view===v);b.setAttribute('aria-current',state.view===v?'page':'false')});
 });
}
function render(){renderWeekToolbar();renderDays();renderDay();renderWeek();renderView()}
function setView(view){state.view=view;renderView();if(view==='week')renderWeek();window.scrollTo({top:0,behavior:'smooth'})}
function changeWeek(delta){let w=Math.max(0,Math.min(11,state.week+delta));state.week=w;state.day=Math.min(state.day,weekDates[w].length-1);render()}
function goToday(){let idx=weekDates.findIndex(w=>w.includes(current));if(idx<0){toast('Сегодня вне периода расписания');idx=current<START?0:11};state.week=idx;state.day=weekDates[idx].indexOf(current);if(state.day<0)state.day=0;state.view='day';state.query='';state.type='all';$('searchInput').value='';$('typeFilter').value='all';render();window.scrollTo({top:0,behavior:'smooth'})}
function updateTheme(){document.body.classList.toggle('light',theme==='light');document.querySelectorAll('[data-theme]').forEach(b=>b.classList.toggle('active',b.dataset.theme===theme));let meta=document.querySelector('meta[name="theme-color"]');if(meta)meta.content=theme==='light'?'#f3f5fa':'#0d111c'}
function openNote(key){const [date,id]=key.split('__');const lesson=lessons.find(l=>String(l.id)===id);if(!lesson)return;state.noteFor=key;$('noteTitle').textContent=lesson.short+' · '+dateNice(date);$('noteInput').value=(data[key]||{}).note||'';const dialog=$('noteDialog');if(dialog.showModal)dialog.showModal();else dialog.setAttribute('open','');$('noteInput').focus()}
function closeNote(){const dialog=$('noteDialog');if(dialog.close)dialog.close();else dialog.removeAttribute('open');state.noteFor=null}
function exportData(){const payload={app:'Маратқызы Д.',version:1,exportedAt:new Date().toISOString(),data};const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='Maratkyzy-заметки.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);toast('Файл заметок подготовлен')}
function initialize(){
 $('weekSelect').innerHTML=weekDates.map((w,i)=>`<option value="${i}">${dateNice(w[0])} — ${dateNice(w.at(-1))}</option>`).join('');
 document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));
 $('prevWeek').addEventListener('click',()=>changeWeek(-1));$('nextWeek').addEventListener('click',()=>changeWeek(1));
 $('weekSelect').addEventListener('change',e=>{state.week=Number(e.target.value);state.day=Math.min(state.day,weekDates[state.week].length-1);render()});
 $('dayStrip').addEventListener('click',e=>{const b=e.target.closest('[data-day]');if(!b)return;state.day=Number(b.dataset.day);render()});
 $('weekCards').addEventListener('click',e=>{const b=e.target.closest('[data-open-day]');if(!b)return;state.day=Number(b.dataset.openDay);setView('day');render()});
 $('todayBtn').addEventListener('click',goToday);
 $('searchInput').addEventListener('input',e=>{state.query=e.target.value.trim();renderDay()});
 $('typeFilter').addEventListener('change',e=>{state.type=e.target.value;renderDay()});
 $('lessonList').addEventListener('click',e=>{
  const btn=e.target.closest('button');if(!btn)return;
  if(btn.dataset.note){openNote(btn.dataset.note);return}
  if(btn.dataset.status){const key=btn.dataset.key;const obj=data[key]||{};obj.status=obj.status===btn.dataset.status?'':btn.dataset.status;data[key]=obj;save();renderDay();toast(obj.status==='attended'?'Посещение отмечено':obj.status==='missed'?'Пропуск отмечен':'Отметка снята')}
 });
 $('closeDialog').addEventListener('click',closeNote);
 $('noteForm').addEventListener('submit',e=>{e.preventDefault();if(!state.noteFor)return;data[state.noteFor]={...data[state.noteFor],note:$('noteInput').value.trim()};save();closeNote();renderDay();toast('Заметка сохранена')});
 $('removeNote').addEventListener('click',()=>{if(!state.noteFor)return;data[state.noteFor]={...data[state.noteFor],note:''};save();closeNote();renderDay();toast('Заметка удалена')});
 $('noteDialog').addEventListener('close',()=>{state.noteFor=null});
 $('noticeDismiss').addEventListener('click',()=>{$('notice').classList.add('hidden')});
 document.querySelectorAll('[data-theme]').forEach(b=>b.addEventListener('click',()=>{theme=b.dataset.theme;try{localStorage.setItem(themeKey,theme)}catch{}updateTheme()}));
 $('exportData').addEventListener('click',exportData);
 $('clearData').addEventListener('click',()=>{if(window.confirm('Удалить все твои заметки и отметки посещения на этом устройстве?')){data={};save();renderDay();toast('Данные очищены')}});
 updateTheme();render();
 if('serviceWorker' in navigator && (location.protocol==='https:'||location.hostname==='localhost')){
  window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js',{scope:'./'}).catch(err=>console.warn('PWA offline unavailable:',err)));
 }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initialize);else initialize();
})();
