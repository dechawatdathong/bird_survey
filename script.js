/* ============ FIREBASE ============ */
const FB_READY = typeof firebaseConfig!=='undefined' && firebaseConfig.projectId && !/วางค่า/.test(firebaseConfig.projectId);
let db = null;
if(FB_READY){
  firebase.initializeApp(firebaseConfig);
  db = firebase.firestore();
}
const esc = v => String(v ?? '').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const responsesRef = () => db.collection(RESPONSES_COLLECTION);
function withTimeout(promise, ms){
  return Promise.race([promise, new Promise((_,rej)=>setTimeout(()=>rej(new Error('timeout')), ms))]);
}

/* ============ DATA ============ */
const WETLAND_TYPES = [
 {v:"coastal", t:"พื้นที่ชุ่มน้ำชายฝั่งทะเล", h:"เช่น หาดเลน หาดทราย ป่าชายเลน ปากแม่น้ำ ชายฝั่งน้ำตื้น"},
 {v:"inland", t:"พื้นที่ชุ่มน้ำภายในแผ่นดิน", h:"เช่น แม่น้ำ หนอง บึงน้ำจืด พรุน้ำจืด ลำธาร ทะเลสาบน้ำจืด"},
 {v:"manmade", t:"พื้นที่ชุ่มน้ำที่มนุษย์สร้างขึ้น", h:"เช่น นาเกลือ บ่อเพาะเลี้ยงสัตว์น้ำ นาข้าว อ่างเก็บน้ำ"},
];
const THREATS_HUMAN = [
 {v:"landuse", t:"การใช้ประโยชน์พื้นที่", h:"เช่น เกษตรกรรม การทำประมง อุตสาหกรรม"},
 {v:"pollution", t:"การปล่อยมลพิษ", h:"เช่น ขยะ น้ำเสีย สารเคมีการเกษตร ฝุ่นควัน"},
 {v:"activity", t:"กิจกรรมของมนุษย์", h:"เช่น การท่องเที่ยว การล่า การบุกรุกพื้นที่"},
 {v:"invasive", t:"ชนิดต่างถิ่นที่รุกราน", h:"เช่น ปลาหมอคางดำ ธูปฤาษี ผักตบชวา"},
 {v:"infra", t:"การพัฒนาโครงสร้างพื้นฐาน", h:"เช่น การถมทะเล/พื้นที่ชุ่มน้ำ ทำถนน สร้างเขื่อน กำแพงกันคลื่น"},
 {v:"other", t:"อื่น ๆ", h:"เช่น การปลูกป่าชายเลนในพื้นที่หาดเลนหรือหาดโคลน"},
];
const THREATS_NATURE = [
 {v:"climate", t:"การเปลี่ยนแปลงสภาพภูมิอากาศ", h:"เช่น ภัยแล้ง ระดับน้ำทะเลสูงขึ้น สภาพอากาศรุนแรง การกัดเซาะชายฝั่ง"},
 {v:"other", t:"อื่น ๆ", h:""},
];
const BIRD_GROUPS = [
 {g:"shorebird", label:"4.1 ตัวอย่างกลุ่มนกชายเลน"},
 {g:"heron", label:"4.2 ตัวอย่างกลุ่มนกกระสาและนกยาง"},
 {g:"duck", label:"4.3 ตัวอย่างกลุ่มเป็ดหรือห่าน"},
 {g:"sea", label:"4.4 ตัวอย่างกลุ่มนกทะเล"},
];
const STATUS_TXT = {CR:"ใกล้สูญพันธุ์อย่างยิ่ง",EN:"ใกล้สูญพันธุ์",VU:"มีแนวโน้มใกล้สูญพันธุ์",NT:"ใกล้ถูกคุกคาม",LC:"กังวลน้อยที่สุด"};
/* BIRDS array injected below */
const BIRDS = [{"id": "b1", "g": "shorebird", "n": "นกชายเลนปากช้อน", "s": "CR", "d": "assets/birds/b1.jpg"}, {"id": "b2", "g": "shorebird", "n": "นกทะเลขาเขียวลายจุด", "s": "EN", "d": "assets/birds/b2.jpg"}, {"id": "b3", "g": "shorebird", "n": "นกอีก๋อยตะโพกสีน้ำตาล", "s": "EN", "d": "assets/birds/b3.jpg"}, {"id": "b4", "g": "shorebird", "n": "นกน็อตใหญ่", "s": "EN", "d": "assets/birds/b4.jpg"}, {"id": "b5", "g": "shorebird", "n": "นกชายเลนปากโค้ง", "s": "VU", "d": "assets/birds/b5.jpg"}, {"id": "b6", "g": "shorebird", "n": "นกทะเลขาแดงธรรมดา", "s": "LC", "d": "assets/birds/b6.jpg"}, {"id": "b7", "g": "shorebird", "n": "นกชายเลนปากกว้าง", "s": "VU", "d": "assets/birds/b7.jpg"}, {"id": "b8", "g": "shorebird", "n": "นกชายเลนกระหม่อมแดง", "s": "VU", "d": "assets/birds/b8.jpg"}, {"id": "b9", "g": "shorebird", "n": "นกหัวโตสีเทา", "s": "VU", "d": "assets/birds/b9.jpg"}, {"id": "b10", "g": "heron", "n": "นกยางโทนน้อย", "s": "LC", "d": "assets/birds/b10.jpg"}, {"id": "b11", "g": "heron", "n": "นกกระสาปากเหลือง", "s": "EN", "d": "assets/birds/b11.jpg"}, {"id": "b12", "g": "heron", "n": "นกปากช้อนหน้าดำ", "s": "VU", "d": "assets/birds/b12.jpg"}, {"id": "b13", "g": "heron", "n": "นกยางจีน", "s": "VU", "d": "assets/birds/b13.jpg"}, {"id": "b14", "g": "heron", "n": "นกยางโทนใหญ่", "s": "LC", "d": "assets/birds/b14.jpg"}, {"id": "b15", "g": "heron", "n": "นกกระทุง", "s": "NT", "d": "assets/birds/b15.jpg"}, {"id": "b16", "g": "heron", "n": "นกอ้ายงั่ว", "s": "LC", "d": "assets/birds/b16.jpg"}, {"id": "b17", "g": "heron", "n": "นกกระสาแดง", "s": "LC", "d": "assets/birds/b17.jpg"}, {"id": "b18", "g": "duck", "n": "ห่านหน้าผากขาวเล็ก", "s": "VU", "d": "assets/birds/b18.jpg"}, {"id": "b19", "g": "duck", "n": "นกเป็ดผีหงอนเหลือง", "s": "VU", "d": "assets/birds/b19.jpg"}, {"id": "b20", "g": "duck", "n": "เป็ดดำหัวดำ", "s": "CR", "d": "assets/birds/b20.jpg"}, {"id": "b21", "g": "duck", "n": "เป็ดโปชาร์ดหลังขาว", "s": "VU", "d": "assets/birds/b21.jpg"}, {"id": "b22", "g": "duck", "n": "เป็ดหงส์", "s": "EN", "d": "assets/birds/b22.jpg"}, {"id": "b23", "g": "duck", "n": "เป็ดลาย", "s": "VU", "d": "assets/birds/b23.jpg"}, {"id": "b24", "g": "duck", "n": "เป็ดผีเล็ก", "s": "LC", "d": "assets/birds/b24.jpg"}, {"id": "b25", "g": "sea", "n": "นกนางนวลแกลบจีน", "s": "CR", "d": "assets/birds/b25.jpg"}, {"id": "b26", "g": "sea", "n": "นกนางนวลแกลบอะลูเชียน", "s": "VU", "d": "assets/birds/b26.jpg"}, {"id": "b27", "g": "sea", "n": "นกจมูกหลอดคอขาว", "s": "VU", "d": "assets/birds/b27.jpg"}, {"id": "b28", "g": "sea", "n": "นกนางนวลแกลบสีกุหลาบ", "s": "EN", "d": "assets/birds/b28.jpg"}, {"id": "b29", "g": "sea", "n": "นกคิตติเวกขาดำ", "s": "VU", "d": "assets/birds/b29.jpg"}, {"id": "b30", "g": "sea", "n": "นกกรีดน้ำ", "s": "EN", "d": "assets/birds/b30.jpg"}, {"id": "b31", "g": "sea", "n": "นกโจรสลัดเกาะคริสต์มาส", "s": "VU", "d": "assets/birds/b31.jpg"}];

/* ============ STATE ============ */
let selBirds = {}; // id -> count
let otherBirdCount = 0;

function pickRadio(el, group){
  el.parentElement.querySelectorAll('.choice').forEach(c=>c.classList.remove('selected'));
  el.classList.add('selected');
  el.dataset.group = group;
}
function toggleSub(id, show){ document.getElementById(id).style.display = show ? 'block' : 'none'; }

function renderChoiceGroup(containerId, items, groupName){
  const c = document.getElementById(containerId);
  c.innerHTML = items.map(it=>`<button class="choice" onclick="pickRadio(this,'${groupName}')"><span class="icon"></span><span class="text">${it.t}${it.h?`<span class="hint">${it.h}</span>`:''}</span></button>`).join('');
  items.forEach((it,i)=>{ c.children[i].dataset.value = it.v; });
}

function renderThreats(containerId, items){
  const c = document.getElementById(containerId);
  c.innerHTML = items.map(it=>`
    <div class="threat" data-key="${it.v}">
      <div class="threat-head">
        <div><div class="threat-name">${it.t}</div>${it.h?`<div class="threat-hint">${it.h}</div>`:''}</div>
        <div class="yn">
          <button type="button" class="on-yes" onclick="setThreat(this,true)">มี</button>
          <button type="button" class="on-no" onclick="setThreat(this,false)">ไม่มี</button>
        </div>
      </div>
      <textarea placeholder="ระบุรายละเอียด / ผลกระทบที่เกิดขึ้นในพื้นที่"></textarea>
    </div>`).join('');
}
function setThreat(btn, hasIt){
  const box = btn.closest('.threat');
  box.querySelectorAll('.yn button').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  box.classList.toggle('show-detail', hasIt);
  box.dataset.has = hasIt ? '1':'0';
}

function renderBirds(){
  const wrap = document.getElementById('bird-groups');
  wrap.innerHTML = BIRD_GROUPS.map(grp=>{
    const items = BIRDS.filter(b=>b.g===grp.g);
    const cards = items.map(b=>`
      <div class="bird-card" id="card-${b.id}" onclick="toggleBird('${b.id}')">
        <img src="${b.d}" alt="${b.n}" loading="lazy">
        <div class="bird-info">
          <div class="bird-name">${b.n}</div>
          <span class="status-pill st-${b.s}">${b.s} · ${STATUS_TXT[b.s]}</span>
          <div class="bird-count"><input type="text" inputmode="numeric" placeholder="จำนวนที่พบ (ตัว)" onclick="event.stopPropagation()" oninput="selBirds['${b.id}']=this.value"></div>
        </div>
      </div>`).join('');
    return `<div class="section-title">${grp.label}</div><div class="bird-grid">${cards}</div>`;
  }).join('');
}
function toggleBird(id){
  const el = document.getElementById('card-'+id);
  const on = el.classList.toggle('selected');
  if(on){ if(!(id in selBirds)) selBirds[id]=''; } else { delete selBirds[id]; }
}

function addOtherBird(){
  otherBirdCount++;
  const wrap = document.getElementById('other-birds');
  const row = document.createElement('div');
  row.className = 'other-row';
  row.innerHTML = `<input type="text" placeholder="ชื่อไทย"><input type="text" placeholder="ชื่อสามัญ"><input type="text" inputmode="numeric" placeholder="จำนวน (ตัว)"><button type="button" onclick="this.parentElement.remove()">ลบ</button>`;
  wrap.appendChild(row);
}

/* ============ NAV ============ */
function currentPanel(){ return parseInt(document.querySelector('#main-view .panel.active')?.dataset.panel || '1'); }
function go(n){
  const curN = currentPanel();
  if(n > curN){
    // ตรวจทุกขั้นตอนที่ต้องผ่าน หยุดที่ขั้นแรกที่ยังไม่ครบ
    for(let i=curN;i<n;i++){
      if(collectErrors([i]).length){
        if(i!==curN) actuallyGo(i, false);
        showErrors([i]);
        return;
      }
    }
  }
  clearErrors();
  actuallyGo(n);
}
function actuallyGo(n, scroll=true){
  document.querySelectorAll('#main-view .step-btn').forEach(t=>{
    t.classList.remove('active','done');
    if(t.dataset.tab==n) t.classList.add('active');
    else if(t.dataset.tab<n) t.classList.add('done');
  });
  document.querySelectorAll('#main-view .panel').forEach(p=>p.classList.toggle('active', p.dataset.panel==n));
  if(scroll){
    // เลื่อนให้แถบขั้นตอนอยู่บนสุด เห็นคำถามแรกของขั้นตอนทันที
    const y = document.getElementById('steps-sentinel').getBoundingClientRect().top + window.scrollY;
    window.scrollTo({top: window.scrollY > y ? y : Math.min(window.scrollY, y), behavior:smoothOrAuto()});
  }
}
function smoothOrAuto(){ return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'; }

/* ============ VALIDATION ============ */
const STEP_NAMES = {1:'ข้อมูลพื้นที่',2:'ภัยคุกคาม',3:'นกน้ำอพยพ',4:'การมีส่วนร่วม'};
let errScope = null; // ขั้นตอนที่กำลังแสดงข้อผิดพลาด (อัปเดตสดเมื่อผู้ใช้แก้)

function hiddenBySub(el){ // ซ่อนโดย toggleSub (display:none) ของตัวเองหรือพาเรนต์
  for(let e=el; e && !e.classList?.contains('panel'); e=e.parentElement){ if(e.style && e.style.display==='none') return true; }
  return false;
}
function val(id){ return document.getElementById(id).value.trim(); }
function hasSel(sel){ return !!document.querySelector(sel+' .choice.selected'); }

function collectErrors(panels){
  const errs = [];
  const add = (panel, label, msg, wrap, focus) => errs.push({panel, label, msg, wrap, focus: focus || wrap});
  const fieldOf = id => document.getElementById(id).closest('.field');
  const req = (panel, id, label, msg='กรุณากรอก') => { if(!val(id)) add(panel, label, msg, fieldOf(id), document.getElementById(id)); };

  if(panels.includes(1)){
    req(1,'f-date','วันที่เก็บข้อมูล','กรุณาเลือกวันที่');
    req(1,'f-name','ชื่อ-นามสกุล');
    req(1,'f-areaname','1.1 ชื่อพื้นที่');
    if(val('f-areaname')==='__other__') req(1,'f-areaname-other','1.1 ระบุชื่อพื้นที่');
    req(1,'f-location','1.2 ที่ตั้งตามเขตการปกครอง');
    const size = val('f-size').replace(/,/g,'');
    if(!size) add(1,'1.3 ขนาดพื้นที่','กรุณากรอก',fieldOf('f-size'),document.getElementById('f-size'));
    else if(!/^\d+(\.\d+)?$/.test(size)) add(1,'1.3 ขนาดพื้นที่','กรุณาระบุเป็นตัวเลข เช่น 250 หรือ 12.5',fieldOf('f-size'),document.getElementById('f-size'));
    if(!hasSel('#wetland-choices')){
      const c=document.getElementById('wetland-choices');
      add(1,'1.5 ประเภทของพื้นที่ชุ่มน้ำ','กรุณาเลือก 1 ข้อ',c.closest('.field'),c.querySelector('.choice'));
    }
  }
  if(panels.includes(2)){
    if(!hasSel('#status-choices')){
      const c=document.getElementById('status-choices');
      add(2,'2.1 สถานภาพของพื้นที่','กรุณาเลือก 1 ข้อ',c.closest('.card'),c.querySelector('.choice'));
    }
    [['threats-human','3.1'],['threats-nature','3.2']].forEach(([cid,no])=>{
      document.querySelectorAll('#'+cid+' .threat').forEach(box=>{
        const name = box.querySelector('.threat-name').textContent;
        if(!box.dataset.has) add(2,`${no} ${name}`,'กรุณาเลือก มี หรือ ไม่มี',box,box.querySelector('.yn button'));
        else if(box.dataset.has==='1' && !box.querySelector('textarea').value.trim())
          add(2,`${no} ${name}`,'เลือกว่า "มี" แล้ว กรุณาระบุรายละเอียด',box,box.querySelector('textarea'));
      });
    });
  }
  if(panels.includes(3)){
    const otherRows=[...document.querySelectorAll('#other-birds .other-row')];
    const namedOthers = otherRows.filter(r=>{const i=r.querySelectorAll('input'); return i[0].value.trim()||i[1].value.trim();});
    if(!Object.keys(selBirds).length && !namedOthers.length){
      const card=document.getElementById('bird-groups').closest('.card');
      add(3,'นกน้ำอพยพที่พบในพื้นที่','กรุณาเลือกนกที่พบอย่างน้อย 1 ชนิด หรือระบุในข้อ 4.5',card,document.querySelector('#bird-groups .bird-card'));
    }
    otherRows.forEach((r,idx)=>{
      const i=r.querySelectorAll('input');
      if(!i[0].value.trim() && !i[1].value.trim() && i[2].value.trim())
        add(3,`4.5 นกน้ำอื่น ๆ แถวที่ ${idx+1}`,'ใส่จำนวนแล้ว กรุณาระบุชื่อนก',r,i[0]);
    });
  }
  if(panels.includes(4)){
    const pc=document.getElementById('participate-choices');
    if(!hasSel('#participate-choices')) add(4,'5.1 การมีส่วนร่วมกับกิจกรรมอนุรักษ์','กรุณาเลือก 1 ข้อ',pc.closest('.card'),pc.querySelector('.choice'));
    else if(!hiddenBySub(document.getElementById('knoworg-choices'))){
      const kc=document.getElementById('knoworg-choices');
      if(!hasSel('#knoworg-choices')) add(4,'5.2 ท่านทราบหน่วยงานผู้จัดกิจกรรม CEPA หรือไม่','กรุณาเลือก 1 ข้อ',document.getElementById('cepa-sub'),kc.querySelector('.choice'));
      else if(!hiddenBySub(document.getElementById('f-orgname')) && !val('f-orgname'))
        add(4,'5.2 ชื่อหน่วยงานผู้จัด','กรุณากรอก',fieldOf('f-orgname'),document.getElementById('f-orgname'));
    }
  }
  return errs;
}

function clearErrors(){
  document.querySelectorAll('#main-view .invalid').forEach(e=>e.classList.remove('invalid'));
  errScope=null;
}

// ข้อที่ไม่ครบ: ไฮไลต์สีแดง + แจ้งข้อความเดียว แล้วเลื่อนไปยังข้อแรกที่ขาด
function showErrors(panels, {scroll=true} = {}){
  const errs = collectErrors(panels);
  document.querySelectorAll('#main-view .invalid').forEach(e=>e.classList.remove('invalid'));
  if(!errs.length){ clearErrors(); return 0; }
  errScope = panels;
  errs.forEach(e=>e.wrap.classList.add('invalid'));
  if(scroll){
    showToast('กรุณากรอกข้อมูลให้ครบถ้วน', 'error');
    const first = errs.find(e=>e.panel===currentPanel()) || errs[0];
    if(currentPanel()!==first.panel) actuallyGo(first.panel,false);
    first.wrap.scrollIntoView({behavior:smoothOrAuto(), block:'center'});
  }
  return errs.length;
}
// เอาสีแดงออกทันทีเมื่อกรอกครบ
['input','change','click'].forEach(ev=>document.getElementById('main-view').addEventListener(ev, ()=>{
  if(!errScope) return;
  setTimeout(()=>{ if(errScope) showErrors(errScope,{scroll:false}); },0);
}));

function showToast(msg, type){
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.toggle('error', type==='error'); t.classList.add('show');
  clearTimeout(window._tt); window._tt = setTimeout(()=>t.classList.remove('show'), 2600);
}

/* ============ SUBMIT ============ */
function getRadioValue(containerSelector){
  const el = document.querySelector(containerSelector+' .choice.selected');
  return el ? el.dataset.value : '';
}
function collectThreats(containerId){
  const out = [];
  document.querySelectorAll('#'+containerId+' .threat').forEach(box=>{
    if(box.dataset.has){ out.push({key:box.dataset.key, has: box.dataset.has==='1', detail: box.querySelector('textarea').value.trim()}); }
  });
  return out;
}
function collectOtherBirds(){
  const out = [];
  document.querySelectorAll('#other-birds .other-row').forEach(r=>{
    const ins = r.querySelectorAll('input');
    if(ins[0].value.trim()||ins[1].value.trim()) out.push({th:ins[0].value.trim(), common:ins[1].value.trim(), count:ins[2].value.trim()});
  });
  return out;
}
function submitSurvey(){
  if(collectErrors([1,2,3,4]).length){
    actuallyGo(collectErrors([1,2,3,4])[0].panel,false);
    showErrors([1,2,3,4]);
    return;
  }
  clearErrors();
  const response = {
    ts: new Date().toISOString(),
    date: document.getElementById('f-date').value,
    name: document.getElementById('f-name').value.trim(),
    network: document.getElementById('f-network').value.trim(),
    areaName: val('f-areaname')==='__other__' ? val('f-areaname-other') : val('f-areaname'),
    location: document.getElementById('f-location').value.trim(),
    size: document.getElementById('f-size').value.trim(),
    sizeUnit: document.getElementById('f-size-unit').value,
    physical: document.getElementById('f-physical').value.trim(),
    wetlandType: getRadioValue('#wetland-choices'),
    agency: document.getElementById('f-agency').value.trim(),
    areaStatus: getRadioValue('#status-choices'),
    threatsHuman: collectThreats('threats-human'),
    threatsNature: collectThreats('threats-nature'),
    birds: Object.entries(selBirds).map(([id,count])=>({id,count})),
    otherBirds: collectOtherBirds(),
    participate: getRadioValue('#participate-choices'),
    knowOrg: hiddenBySub(document.getElementById('knoworg-choices')) ? '' : getRadioValue('#knoworg-choices'),
    orgName: hiddenBySub(document.getElementById('f-orgname')) ? '' : document.getElementById('f-orgname').value.trim(),
    suggestion: document.getElementById('f-suggestion').value.trim(),
  };
  if(!FB_READY){ showToast('ยังไม่ได้ตั้งค่า Firebase ในไฟล์ firebase-config.js'); return; }
  const btn = document.getElementById('submit-btn');
  btn.disabled = true; btn.textContent = 'กำลังส่ง...';
  response.createdAt = firebase.firestore.FieldValue.serverTimestamp();
  withTimeout(responsesRef().add(response), 20000)
    .then(()=>{ document.getElementById('success-overlay').classList.add('show'); })
    .catch(err=>{
      console.error(err);
      showToast(err.message==='timeout'
        ? 'ส่งไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ตแล้วกดส่งอีกครั้ง'
        : 'ส่งไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    })
    .finally(()=>{ btn.disabled = false; btn.textContent = 'ส่งแบบสำรวจ'; });
}
function restartSurvey(){
  document.getElementById('success-overlay').classList.remove('show');
  document.querySelectorAll('#main-view input[type=text],#main-view input[type=date],#main-view textarea').forEach(i=>i.value='');
  document.querySelectorAll('#main-view .choice.selected').forEach(c=>c.classList.remove('selected'));
  document.querySelectorAll('#main-view .bird-card.selected').forEach(c=>c.classList.remove('selected'));
  document.querySelectorAll('#main-view .threat').forEach(b=>{delete b.dataset.has; b.classList.remove('show-detail'); b.querySelectorAll('.yn button').forEach(x=>x.classList.remove('active'));});
  document.getElementById('other-birds').innerHTML='';
  addOtherBird(); addOtherBird();
  document.getElementById('f-date').valueAsDate = new Date();
  selBirds = {}; otherBirdCount = 0;
  clearErrors();
  toggleSub('cepa-sub',false); toggleSub('org-name-wrap',false);
  document.getElementById('f-areaname').selectedIndex=0; toggleSub('areaname-other-wrap',false);
  actuallyGo(1);
}

/* ============ ADMIN ============ */
let adminData = [];
async function fetchResponses(){
  const snap = await responsesRef().orderBy('ts').get();
  return snap.docs.map(d=>({_id:d.id, ...d.data()}));
}
function openAdmin(){
  document.getElementById('main-view').style.display='none';
  document.getElementById('admin-view').style.display='block';
  window.scrollTo(0,0);
  if(!FB_READY){ document.getElementById('admin-sub').textContent='ยังไม่ได้ตั้งค่า Firebase ในไฟล์ firebase-config.js'; return; }
  document.getElementById('admin-sub').textContent='ข้อมูลจากฐานข้อมูลกลาง';
  renderAdmin();
}
function closeAdmin(){
  document.getElementById('admin-view').style.display='none';
  document.getElementById('main-view').style.display='block';
  if(location.hash==='#admin') history.replaceState(null,'',location.pathname+location.search);
}
// หน้าผู้ดูแลระบบ: เปิดโดยเติม #admin ท้ายลิงก์เว็บ
function checkAdminHash(){ if(location.hash==='#admin') openAdmin(); }
window.addEventListener('hashchange', checkAdminHash);
function aggBox(id, counts, labelFn){
  const el = document.getElementById(id);
  const entries = Object.entries(counts).sort((a,b)=>b[1]-a[1]);
  if(!entries.length){ el.innerHTML='<p class="admin-empty">ยังไม่มีข้อมูล</p>'; return; }
  const max = entries[0][1];
  el.innerHTML = entries.map(([k,v])=>`<div class="agg-row"><span class="label">${esc(labelFn?labelFn(k):k)}</span><div class="bar"><div style="width:${Math.round(v/max*100)}%"></div></div><span class="count">${esc(v)}</span></div>`).join('');
}
async function renderAdmin(){
  try{ adminData = await fetchResponses(); }
  catch(e){
    console.error(e);
    document.getElementById('admin-table-wrap').innerHTML = `<p class="admin-empty">${e.code==='permission-denied'
      ? 'ไม่มีสิทธิ์อ่านข้อมูล (ตรวจสอบ Firestore Rules ว่าวางและ Publish แล้ว)'
      : 'โหลดข้อมูลไม่สำเร็จ กรุณากดรีเฟรช'}</p>`;
    return;
  }
  renderAdminView();
}

const WET_LABEL = {coastal:'ชายฝั่งทะเล', inland:'ภายในแผ่นดิน', manmade:'มนุษย์สร้างขึ้น'};
const BIRD_BY_ID = Object.fromEntries(BIRDS.map(b=>[b.id,b]));
const THREAT_H = Object.fromEntries(THREATS_HUMAN.map(t=>[t.v,t.t]));
const THREAT_N = Object.fromEntries(THREATS_NATURE.map(t=>[t.v,t.t]));
const EMPTY = '<p class="admin-empty">ยังไม่มีข้อมูล</p>';
const toNum = v => { const n = parseFloat(String(v??'').replace(/,/g,'')); return isFinite(n) ? n : null; };
const fmt = n => n.toLocaleString('th-TH');

function barRows(entries, {sub}={}){
  if(!entries.length) return EMPTY;
  const max = Math.max(...entries.map(e=>e.n));
  return entries.map(e=>`<div class="agg-row"><span class="label">${esc(e.label)}${e.extra?` <span class="agg-extra">${e.extra}</span>`:''}</span><div class="bar"><div style="width:${Math.round(e.n/max*100)}%"></div></div><span class="count">${fmt(e.n)}</span></div>`).join('');
}
function countBy(list, keyFn){
  const m = new Map();
  list.forEach(x=>{ const k = keyFn(x); if(k) m.set(k,(m.get(k)||0)+1); });
  return [...m.entries()].sort((a,b)=>b[1]-a[1]);
}
// ภัยคุกคาม: สุ่มตัวอย่างจากผู้ตอบไม่เกิน 3 ตัวอย่างต่อหัวข้อ (สุ่มใหม่ทุกครั้งที่เปิด/รีเฟรช)
function threatBlock(all, field, labels){
  return Object.entries(labels).map(([key,label])=>{
    const hits = [];
    all.slice().reverse().forEach(r=>(r[field]||[]).forEach(t=>{ if(t.key===key && t.has && (t.detail||'').trim()) hits.push({area:r.areaName, detail:t.detail.trim()}); }));
    for(let i=hits.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [hits[i],hits[j]]=[hits[j],hits[i]]; }
    const picked = hits.slice(0,3);
    if(!picked.length) return `<div class="threat-agg" data-empty><div class="threat-agg-head"><span class="label">${esc(label)}</span><span class="none">ไม่มี</span></div></div>`;
    return `<div class="threat-agg">
      <div class="threat-agg-head"><span class="label">${esc(label)}</span></div>
      <ul class="detail-list">${picked.map(h=>`<li><span class="who">${esc(h.area||'ไม่ระบุพื้นที่')}</span>${esc(h.detail)}</li>`).join('')}</ul>
    </div>`;
  }).join('');
}
function answerCard(r){
  const threats = (list, labels) => {
    const yes = (list||[]).filter(t=>t.has);
    return yes.length ? yes.map(t=>`<li><b>${esc(labels[t.key]||t.key)}</b>${t.detail?` — ${esc(t.detail)}`:''}</li>`).join('') : '<li class="muted">ไม่มี</li>';
  };
  const birds = (r.birds||[]).map(b=>`<li>${esc(BIRD_BY_ID[b.id]?.n||b.id)}${b.count?` <span class="muted">(${esc(b.count)} ตัว)</span>`:''}</li>`).join('');
  const others = (r.otherBirds||[]).map(o=>`<li>${esc(o.th||o.common)}${o.th&&o.common?` <span class="muted">${esc(o.common)}</span>`:''}${o.count?` <span class="muted">(${esc(o.count)} ตัว)</span>`:''}</li>`).join('');
  const row = (k,v) => v ? `<div class="kv"><span>${k}</span><span>${esc(v)}</span></div>` : '';
  return `<details class="resp">
    <summary><span class="resp-area">${esc(r.areaName||'-')}</span><span class="resp-meta">${esc(r.name||'-')} · ${esc(r.date||'')}</span></summary>
    <div class="resp-body">
      <h4>ข้อมูลผู้กรอกและพื้นที่</h4>
      ${row('ชื่อ-นามสกุล',r.name)}${row('เครือข่าย',r.network)}${row('วันที่เก็บข้อมูล',r.date)}
      ${row('ที่ตั้ง',r.location)}${row('ขนาดพื้นที่',r.size?`${r.size} ${r.sizeUnit||''}`:'')}
      ${row('ประเภทพื้นที่ชุ่มน้ำ',WET_LABEL[r.wetlandType]||r.wetlandType)}${row('หน่วยงานรับผิดชอบ',r.agency)}
      ${row('สถานภาพพื้นที่',r.areaStatus)}${row('ลักษณะกายภาพ',r.physical)}
      <h4>ภัยคุกคามจากมนุษย์</h4><ul>${threats(r.threatsHuman,THREAT_H)}</ul>
      <h4>ภัยคุกคามจากธรรมชาติ</h4><ul>${threats(r.threatsNature,THREAT_N)}</ul>
      <h4>นกน้ำอพยพที่พบ</h4><ul>${birds||'<li class="muted">ไม่ได้เลือก</li>'}${others}</ul>
      <h4>CEPA</h4>
      ${row('5.1 มีส่วนร่วม',r.participate)}${row('5.2 ทราบหน่วยงานผู้จัด',r.knowOrg)}${row('หน่วยงานผู้จัด',r.orgName)}
      ${r.suggestion?`<h4>ข้อเสนอแนะ</h4><p class="resp-text">${esc(r.suggestion)}</p>`:''}
    </div>
  </details>`;
}

// เวิร์ดคลาวด์นกน้ำ: ขนาดตามจำนวนคำตอบที่พบ สีตามสถานภาพ ตัวเลขรวมอยู่ด้านหลัง
function birdCloud(all){
  const stats = new Map();
  const add = (key, label, status, count) => {
    const s = stats.get(key) || {label, status, n:0, total:0};
    s.n++; const c = toNum(count); if(c!==null) s.total += c; stats.set(key, s);
  };
  all.forEach(r=>{
    (r.birds||[]).forEach(b=>{ const bd = BIRD_BY_ID[b.id]; add(b.id, bd?bd.n:b.id, bd?bd.s:'OT', b.count); });
    (r.otherBirds||[]).forEach(o=>{ const k=(o.th||o.common||'').trim(); if(k) add('o:'+k, k, 'OT', o.count); });
  });
  if(!stats.size) return EMPTY;
  // ขนาดชื่อตามจำนวนตัวที่นับได้ (ชนิดที่ไม่ได้ระบุจำนวนจะเล็กที่สุด)
  const items = [...stats.values()].sort((a,b)=>b.total-a.total || b.n-a.n);
  const total = items.reduce((t,i)=>t+i.total,0);
  const max = items[0].total, min = items[items.length-1].total;
  const size = v => max===min ? 20 : Math.round(14 + (Math.sqrt(v)-Math.sqrt(min))/(Math.sqrt(max)-Math.sqrt(min))*20);
  // วางชื่อที่ใหญ่ที่สุดไว้ตรงกลาง แล้วสลับซ้าย-ขวาออกไป
  const arranged = [];
  items.forEach((it,i)=> i%2 ? arranged.push(it) : arranged.unshift(it));
  const words = arranged.map((it,i)=>`<span class="cw st-c-${it.status}" style="font-size:${size(it.total)}px;--fs:${size(it.total)}px;--d:${(i*0.37)%2.6}s;--r:${i%2?-1:1}" title="พบ ${it.n} คำตอบ${it.total?` · ${fmt(it.total)} ตัว`:''}">${esc(it.label)}${it.total?` <span class="cw-n">(${fmt(it.total)})</span>`:''}</span>`).join('');
  return `<div class="bird-cloud">
    <div class="cloud-total" aria-hidden="true"><b>${fmt(total)}</b><span>ตัว</span></div>
    <div class="cloud-words">${words}</div>
  </div>
  <p class="cloud-caption">นับได้รวม <b>${fmt(total)}</b> ตัว จาก <b>${fmt(items.length)}</b> ชนิด · ตัวเลขในวงเล็บคือจำนวนตัวที่นับได้</p>`;
}

function renderAdminView(){
  const all = adminData;
  const set = (id, html) => document.getElementById(id).innerHTML = html;

  document.getElementById('stat-total').textContent = fmt(all.length);
  document.getElementById('stat-areas').textContent = fmt(new Set(all.map(r=>r.areaName).filter(Boolean)).size);
  document.getElementById('stat-species').textContent = fmt(new Set(all.flatMap(r=>(r.birds||[]).map(b=>b.id))).size);

  set('agg-area', barRows(countBy(all, r=>r.areaName).map(([k,n])=>({label:k,n}))));
  set('agg-wetland', barRows(countBy(all, r=>r.wetlandType).map(([k,n])=>({label:WET_LABEL[k]||k,n}))));
  set('agg-threat-human', all.length ? threatBlock(all,'threatsHuman',THREAT_H) : EMPTY);
  set('agg-threat-nature', all.length ? threatBlock(all,'threatsNature',THREAT_N) : EMPTY);

  set('agg-birds', birdCloud(all));

  set('agg-cepa', barRows(countBy(all, r=>r.participate).map(([k,n])=>({label:k,n}))));
  set('agg-knoworg', barRows(countBy(all, r=>r.knowOrg).map(([k,n])=>({label:k,n}))));
  set('agg-orgs', barRows(countBy(all, r=>(r.orgName||'').trim()).map(([k,n])=>({label:k,n}))));

  const sug = all.filter(r=>r.suggestion).slice().reverse();
  set('agg-suggest', sug.length ? `<ul class="detail-list">${sug.map(r=>`<li><span class="who">${esc(r.areaName||'-')} · ${esc(r.name||'-')}</span>${esc(r.suggestion)}</li>`).join('')}</ul>` : EMPTY);

  set('admin-table-wrap', all.length ? all.slice().reverse().map(answerCard).join('') : EMPTY);
}
async function resetAll(){
  if(!confirm('ยืนยันลบคำตอบทั้งหมดในฐานข้อมูลกลาง? ข้อมูลของทุกคนจะหายและเรียกคืนไม่ได้')) return;
  try{
    const snap = await responsesRef().get();
    for(let i=0;i<snap.docs.length;i+=400){
      const batch = db.batch();
      snap.docs.slice(i,i+400).forEach(d=>batch.delete(d.ref));
      await batch.commit();
    }
    showToast('ลบข้อมูลแล้ว');
  }catch(e){ console.error(e); alert('ลบข้อมูลไม่สำเร็จ'); }
  renderAdmin();
}
function exportExcel(){
  const all = adminData;
  if(!all.length){ alert('ยังไม่มีข้อมูลให้ดาวน์โหลด'); return; }
  const thr = (list, key) => { const t=(list||[]).find(x=>x.key===key); return !t ? '' : t.has ? ('มี'+(t.detail?`: ${t.detail}`:'')) : 'ไม่มี'; };
  const header = ['วันที่บันทึก','วันที่เก็บข้อมูล','ชื่อ-นามสกุล','เครือข่าย','1.1 ชื่อพื้นที่','1.2 ที่ตั้ง','1.3 ขนาดพื้นที่','1.4 ลักษณะกายภาพ','1.5 ประเภทพื้นที่ชุ่มน้ำ','1.6 หน่วยงานรับผิดชอบ','2.1 สถานภาพพื้นที่',
    ...THREATS_HUMAN.map(t=>'3.1 '+t.t), ...THREATS_NATURE.map(t=>'3.2 '+t.t),
    'นกน้ำอพยพที่พบ','นกน้ำอื่น ๆ (4.5)','5.1 มีส่วนร่วม CEPA','5.2 ทราบหน่วยงานผู้จัด','หน่วยงานผู้จัด','ข้อเสนอแนะ'];
  const rows=[header];
  all.forEach(r=>rows.push([
    r.ts ? new Date(r.ts).toLocaleString('th-TH') : '', r.date||'', r.name||'', r.network||'', r.areaName||'', r.location||'',
    r.size ? `${r.size} ${r.sizeUnit||''}` : '', r.physical||'', WET_LABEL[r.wetlandType]||r.wetlandType||'', r.agency||'', r.areaStatus||'',
    ...THREATS_HUMAN.map(t=>thr(r.threatsHuman,t.v)), ...THREATS_NATURE.map(t=>thr(r.threatsNature,t.v)),
    (r.birds||[]).map(b=>(BIRD_BY_ID[b.id]?.n||b.id)+(b.count?` (${b.count} ตัว)`:'')).join(', '),
    (r.otherBirds||[]).map(o=>(o.th||o.common)+(o.count?` (${o.count} ตัว)`:'')).join(', '),
    r.participate||'', r.knowOrg||'', r.orgName||'', r.suggestion||''
  ]));
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(rows); ws['!cols'] = header.map(()=>({wch:24}));
  XLSX.utils.book_append_sheet(wb, ws, 'คำตอบทั้งหมด');
  const birdStats=new Map();
  all.forEach(r=>(r.birds||[]).forEach(b=>{const s=birdStats.get(b.id)||{n:0,total:0}; s.n++; const c=toNum(b.count); if(c!==null) s.total+=c; birdStats.set(b.id,s);}));
  const wc=[['ชนิดนก','สถานภาพ','จำนวนคำตอบที่พบ','จำนวนตัวรวม']];
  [...birdStats.entries()].sort((a,b)=>b[1].n-a[1].n).forEach(([id,s])=>{const b=BIRD_BY_ID[id]; wc.push([b?b.n:id, b?b.s:'', s.n, s.total||'']);});
  const ws2 = XLSX.utils.aoa_to_sheet(wc); ws2['!cols']=[{wch:28},{wch:10},{wch:16},{wch:14}];
  XLSX.utils.book_append_sheet(wb, ws2, 'สรุปนกน้ำ');
  const dt = new Date();
  XLSX.writeFile(wb, `แบบสำรวจนกน้ำอพยพ-${dt.getFullYear()}${String(dt.getMonth()+1).padStart(2,'0')}${String(dt.getDate()).padStart(2,'0')}.xlsx`);
}

/* ============ INIT ============ */
renderChoiceGroup('wetland-choices', WETLAND_TYPES, 'wetland');
renderThreats('threats-human', THREATS_HUMAN);
renderThreats('threats-nature', THREATS_NATURE);
renderBirds();
addOtherBird(); addOtherBird();
document.getElementById('f-date').valueAsDate = new Date();
checkAdminHash();
// แถบขั้นตอนติดด้านบนเมื่อเลื่อนลง
new IntersectionObserver(([e])=>{
  document.querySelector('#main-view .steps').classList.toggle('stuck', !e.isIntersecting && e.boundingClientRect.top < 0);
}).observe(document.getElementById('steps-sentinel'));
