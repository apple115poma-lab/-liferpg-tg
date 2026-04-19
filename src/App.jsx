import { useState, useEffect } from "react";

/* ─── XP / Level ─────────────────────────────────────────────────────────── */
const XP_FOR = (l) => Math.floor(120 * Math.pow(1.45, l - 1));
const getLvl  = (xp) => { let l=1,r=xp; while(r>=XP_FOR(l)){r-=XP_FOR(l);l++;} return {level:l,xpIn:r,xpTo:XP_FOR(l)}; };
const cumulXP = (l) => { let t=0; for(let i=1;i<l;i++) t+=XP_FOR(i); return t; };

const LVL_NAMES = [
  "🌱 Новобранец","📜 Послушник","🗡 Ученик","⚔️ Воин","🛡 Защитник",
  "🏹 Лучник","🔱 Страж","💫 Искусник","🌟 Рыцарь","⚡ Паладин",
  "🔮 Чародей","🌑 Теневой Клинок","🦅 Сокол","🏆 Чемпион","👑 Лорд",
  "🌊 Адмирал","🔥 Берсерк-лорд","💎 Кристальный Маг","🌌 Архимаг","⚜️ Герой",
  "🗺 Первопроходец","🌠 Повелитель","🔱 Страж Времени","👁 Провидец","🌟 Бессмертный",
  "🌑 Тёмный Владыка","🌌 Небожитель","⚡ Полубог","🔮 Верховный Маг","👑 Легенда",
];
const getLvlName = (l) => LVL_NAMES[Math.min(l-1, LVL_NAMES.length-1)];

/* ─── Classes ─────────────────────────────────────────────────────────────── */
const CLASSES = [
  { id:"legend",    name:"⚜️ Легенда",        color:"#ffd700", desc:"Ты вдохновляешь других самим фактом своего существования",         bonus:"+15% XP ко всему",                       mult:{all:1.15}, check:(_s,_c,lv)=>lv>=30 },
  { id:"ocean",     name:"🌊 Океан Воли",     color:"#38bdf8", desc:"21 день без остановки. Это не сила воли — это характер",           bonus:"+35% XP, комбо нельзя сбросить",         mult:{all:1.35}, check:(_s,c)=>c>=21 },
  { id:"shadow",    name:"🌑 Теневой",         color:"#a78bfa", desc:"Дисциплина стала второй натурой. Ты живёшь системой",             bonus:"+30% XP ко всему",                       mult:{all:1.30}, check:(_s,c)=>c>=14 },
  { id:"champion",  name:"🏆 Чемпион",         color:"#fbbf24", desc:"Каждый стат прокачан. Ты прошёл путь — и это видно",              bonus:"+10% XP, +5G за квест",                 mult:{all:1.10}, check:(s)=>Object.values(s).every(v=>v>=15) },
  { id:"berserker", name:"🔥 Берсерк",         color:"#f97316", desc:"В потоке — ты неудержим. Чем дольше серия — тем сильнее",         bonus:"+20% XP пока держишь комбо",            mult:{all:1.20}, check:(_s,c)=>c>=7 },
  { id:"mind_mage", name:"🔮 Маг Разума",      color:"#c084fc", desc:"Редкое сочетание: думаешь глубоко и мудро одновременно",          bonus:"+20% XP за Учёбу и Развитие",           mult:{study:1.20,dev:1.20}, check:(s)=>s.INT>=10&&s.WIS>=10&&s.INT>s.STR+3 },
  { id:"iron_monk", name:"💥 Железный Монах",  color:"#fb923c", desc:"Тело — храм. Строишь его методично, день за днём",               bonus:"+20% XP за Спорт, +2 HP/тренировку",   mult:{sport:1.20}, check:(s)=>s.STR>=10&&s.VIT>=10&&s.STR>s.INT+3 },
  { id:"sniper",    name:"🎯 Снайпер",          color:"#22d3ee", desc:"Точность важнее грубой силы. Интеллект и знание — твоё оружие",   bonus:"+15% XP за Учёбу, Языки, Развитие",    mult:{study:1.15,dev:1.15}, check:(s)=>s.INT>=8&&s.WIS>=8&&s.LNG>=8&&s.STR<s.INT-2 },
  { id:"polyglot",  name:"🌍 Полиглот",         color:"#4ade80", desc:"Язык — это мир. Ты открываешь их один за другим",                bonus:"+20% XP за Языки",                      mult:{dev:1.20}, check:(s)=>s.LNG>=12 },
  { id:"erudite",   name:"📖 Эрудит",           color:"#818cf8", desc:"Читаешь и думаешь без остановки. Знание — твоя стихия",          bonus:"+15% XP за Развитие",                   mult:{dev:1.15}, check:(s)=>s.WIS>=8&&s.LNG>=8 },
  { id:"sage",      name:"📚 Мудрец",            color:"#c084fc", desc:"Знание ради знания. Ты копаешь глубже, чем другие",              bonus:"+15% XP за Развитие",                   mult:{dev:1.15}, check:(s)=>s.WIS>s.STR+2&&s.WIS>s.INT+2 },
  { id:"scholar",   name:"🧠 Мыслитель",        color:"#60a5fa", desc:"Анализ и детали — твоя среда. Голова — главное оружие",          bonus:"+15% XP за Учёбу",                      mult:{study:1.15}, check:(s)=>s.INT>s.STR+2&&s.INT>s.WIS+2 },
  { id:"athlete",   name:"💪 Атлет",             color:"#f87171", desc:"Тело — твой главный инструмент. Строишь его осознанно",          bonus:"+15% XP за Спорт, +1 HP/тренировку",   mult:{sport:1.15}, check:(s)=>s.STR>s.INT+2&&s.STR>s.WIS+2 },
  { id:"balanced",  name:"⚖️ Универсал",         color:"#fbbf24", desc:"Гармоничная личность без явных слабостей. Редкость в наше время",bonus:"+5% XP ко всему, иммунитет к 1 провалу",mult:{all:1.05}, check:(s)=>{const v=Object.values(s),a=v.reduce((x,y)=>x+y)/v.length;return v.every(x=>Math.abs(x-a)<4)&&a>5;} },
  { id:"marathon",  name:"⚡ Марафонец",         color:"#facc15", desc:"Выносливость и стабильность — твой стиль. Медленно и уверенно",  bonus:"+15% XP за Спорт и Активность",        mult:{sport:1.15}, check:(s)=>s.VIT>s.INT+2&&s.VIT>s.WIS+2 },
  { id:"seeker",    name:"🌱 Искатель",          color:"#94a3b8", desc:"Ты только начинаешь. Впереди — всё возможно",                    bonus:"Выбери путь — стат за статом",          mult:{}, check:()=>true },
];
const getClass = (s,c,lv) => CLASSES.find(cl=>cl.check(s,c,lv));

/* ─── Default data ────────────────────────────────────────────────────────── */
const DEF_DAILY = [
  {id:"s1",title:"Учебная сессия",desc:"45+ мин активного обучения",xp:50,stat:"INT",cat:"study",icon:"📖"},
  {id:"s2",title:"Повторение",desc:"Повторить пройденный материал",xp:25,stat:"INT",cat:"study",icon:"🔁"},
  {id:"g1",title:"Тренировка",desc:"Полноценная тренировка в зале",xp:80,stat:"STR",cat:"sport",icon:"💪"},
  {id:"g2",title:"Активность",desc:"7 000+ шагов или кардио",xp:30,stat:"VIT",cat:"sport",icon:"🏃"},
  {id:"d1",title:"Чтение",desc:"Читать книгу 20+ мин",xp:40,stat:"WIS",cat:"dev",icon:"📚"},
  {id:"d2",title:"Английский",desc:"Практика английского 20+ мин",xp:40,stat:"LNG",cat:"dev",icon:"🌍"},
  {id:"d3",title:"Хард скилл",desc:"Работа над профессиональным навыком",xp:50,stat:"WIS",cat:"dev",icon:"⚙️"},
];
const DEF_BOSS = [
  {id:"b1",title:"Академик",desc:"Завершить полную тему/главу",xp:200,stat:"INT",pen:30,icon:"🎓"},
  {id:"b2",title:"Железный",desc:"5 тренировок за неделю",xp:300,stat:"STR",pen:50,icon:"🏋️"},
  {id:"b3",title:"Мудрец",desc:"50+ страниц за неделю",xp:250,stat:"WIS",pen:40,icon:"📜"},
];
const DEF_SHOP = [
  {id:"r1",name:"Читмил 🍕",cost:50,icon:"🍕"},{id:"r2",name:"Вечер сериала 📺",cost:40,icon:"📺"},
  {id:"r3",name:"Игровой вечер 🎮",cost:60,icon:"🎮"},{id:"r4",name:"Прогулка / кафе ☕",cost:30,icon:"☕"},
  {id:"r5",name:"Новая книга 📘",cost:80,icon:"📘"},
];
const EVENTS = [
  {txt:"⚡ Двойной опыт за следующий квест!",type:"x2"},
  {txt:"🍀 Удача! +50 Gold найдено",type:"gold",val:50},
  {txt:"🌊 Прилив сил! +15 HP",type:"hp",val:15},
  {txt:"😴 Лёгкая усталость... -10% XP сегодня",type:"debuff",val:-0.1},
  {txt:"💰 Бонус за стабильность! +30 Gold",type:"gold",val:30},
  {txt:"🛡 Щит комбо — провал босса не сбросит серию!",type:"shield"},
  {txt:"⚔️ Испытание: выполни все дейли — +150 XP!",type:"challenge",val:150},
];
const OVERPERF = [
  {id:"exact",label:"✓ По цели",mult:1.0,color:"#22c55e",sub:"выполнено"},
  {id:"over", label:"🚀 Перевыполнил!",mult:1.5,color:"#fbbf24",sub:"+50% XP"},
  {id:"crush",label:"💥 Разорвал шаблон!",mult:2.0,color:"#f97316",sub:"×2 XP"},
];
const HABIT_MS = [
  {days:3,gold:30,hp:0,xp:0,icon:"🥉"},{days:7,gold:50,hp:10,xp:100,icon:"🥈"},
  {days:14,gold:100,hp:0,xp:200,icon:"🥇"},{days:30,gold:200,hp:15,xp:400,icon:"💎"},
  {days:60,gold:350,hp:0,xp:700,icon:"👑"},{days:90,gold:600,hp:25,xp:1000,icon:"🌟"},
];
const DIFF = [{id:"easy",label:"Лёгкий",xp:25,gold:5},{id:"medium",label:"Средний",xp:50,gold:10},{id:"hard",label:"Сложный",xp:100,gold:20},{id:"epic",label:"Эпик",xp:200,gold:40}];
const CATS={study:"Учёба",sport:"Спорт",dev:"Развитие",custom:"Свои"};
const CCLR={study:"#60a5fa",sport:"#f87171",dev:"#c084fc",custom:"#fbbf24"};
const SLBL={STR:"Сила",INT:"Интеллект",WIS:"Мудрость",LNG:"Языки",VIT:"Выносливость"};
const SICN={STR:"💪",INT:"🧠",WIS:"📚",LNG:"🌍",VIT:"⚡"};
const SCLR={STR:"#f87171",INT:"#60a5fa",WIS:"#c084fc",LNG:"#4ade80",VIT:"#fbbf24"};

const today=()=>new Date().toDateString();
const weekN=()=>{const d=new Date(),s=new Date(d.getFullYear(),0,1);return Math.ceil(((d-s)/864e5+s.getDay()+1)/7);};
const nowStr=()=>new Date().toLocaleTimeString("ru",{hour:"2-digit",minute:"2-digit"});
const rndEv=()=>EVENTS[Math.floor(Math.random()*EVENTS.length)];
const fresh=()=>({
  name:"Герой",totalXp:0,gold:50,hp:100,maxHp:100,combo:0,
  stats:{STR:1,INT:1,WIS:1,LNG:1,VIT:1},
  daily:{},boss:{},custom:[],questEdits:{},shop:[...DEF_SHOP],purchases:[],
  lastDay:"",lastDayXp:0,restWeek:0,weekStart:"",
  log:[],weekXP:Array(7).fill(0),
  event:null,eventDone:false,nextDouble:false,shield:false,immunityUsed:false,
  habits:[{id:"h-void",name:"Воздержание",icon:"🛡",streak:0,longest:0,lastCheck:"",claimedMs:[]}],
});

/* ─── Main Component ─────────────────────────────────────────────────────── */
export default function App() {
  const [gs, setGs]           = useState(null);
  const [tab, setTab]         = useState("quests");
  const [sub, setSub]         = useState("daily");
  const [toast, setToast]     = useState(null);
  const [lvlUp, setLvlUp]     = useState(false);
  const [showLevels, setShowLevels] = useState(false);
  const [showClasses, setShowClasses] = useState(false);
  const [pendingQ, setPendingQ] = useState(null);
  const [editingQ, setEditingQ] = useState(null);
  const [editBuf, setEditBuf]   = useState({});
  const [undoSnap, setUndoSnap] = useState(null);
  const [undoSecs, setUndoSecs] = useState(0);
  const [editName, setEditName] = useState(false);
  const [tmpName, setTmpName]   = useState("");
  const [qForm, setQForm]       = useState({show:false,title:"",desc:"",stat:"INT",diff:"medium",aiXP:null,loading:false});
  const [sForm, setSForm]       = useState({show:false,name:"",cost:50});
  const [showExport, setShowExport] = useState(false);
  const [importTxt, setImportTxt]   = useState("");

  useEffect(()=>{ load(); },[]);
  useEffect(()=>{
    if(!undoSnap) return;
    const iv = setInterval(()=>{
      const rem = Math.ceil((undoSnap.exp - Date.now())/1000);
      if(rem<=0){setUndoSnap(null);setUndoSecs(0);clearInterval(iv);}
      else setUndoSecs(rem);
    },500);
    return ()=>clearInterval(iv);
  },[undoSnap]);

  const load = async () => {
    try {
      const r = await window.storage.get("liferpg-v5");
      if(r?.value){
        const s = JSON.parse(r.value);
        if(!s.questEdits) s.questEdits={};
        if(!s.habits)     s.habits=fresh().habits;
        if(!s.weekXP)     s.weekXP=Array(7).fill(0);
        if(!s.shop)       s.shop=[...DEF_SHOP];
        if(!s.purchases)  s.purchases=[];
        if(!s.custom)     s.custom=[];
        const tod=today(), wk=String(weekN());
        if(s.lastDay!==tod){
          const earned=s.totalXp-(s.lastDayXp||s.totalXp);
          s.weekXP=[...(s.weekXP||[]).slice(-6),Math.max(0,earned)];
          s.daily={}; s.lastDay=tod; s.lastDayXp=s.totalXp;
          s.event=rndEv(); s.eventDone=false; s.nextDouble=false;
          s.custom=s.custom.map(q=>({...q,done:false}));
        }
        if(s.weekStart!==wk){s.boss={};s.restWeek=0;s.immunityUsed=false;s.weekStart=wk;}
        if(!s.event){s.event=rndEv();s.eventDone=false;}
        setGs(s);
      } else {
        const s=fresh(); s.lastDay=today(); s.weekStart=String(weekN()); s.event=rndEv(); s.lastDayXp=0;
        setGs(s);
      }
    } catch { const s=fresh(); s.lastDay=today(); s.weekStart=String(weekN()); s.event=rndEv(); setGs(s); }
  };

  const save = async(s)=>{ try{ await window.storage.set("liferpg-v5",JSON.stringify(s)); }catch(e){console.error(e);} };
  const pop  = (msg,ok=true)=>{ setToast({msg,ok}); setTimeout(()=>setToast(null),2800); };
  const upd  = (fn)=>setGs(prev=>{ const s=fn(prev); save(s); return s; });

  /* ── Quest complete ─────────────────────────────────────────────────────── */
  const completeQuest = (q, ovMult=1.0, isCustom=false, isBoss=false) => {
    upd(prev=>{
      const lvi = getLvl(prev.totalXp);
      const cls = getClass(prev.stats,prev.combo,lvi.level);
      let mult = 1 + prev.combo*0.1;
      const cm = cls.mult||{};
      mult *= (cm[q.cat]||cm.all||1);
      if(prev.nextDouble) mult*=2;
      if(prev.event?.type==="debuff"&&prev.eventDone) mult*=(1+(prev.event.val||0));
      mult*=ovMult;

      const baseXP = q.xp||50;
      const xp    = Math.floor(baseXP*mult);
      const gold  = (isBoss?Math.floor(baseXP/5):Math.floor(baseXP/10))+(cls.id==="champion"?5:0);
      const newXp = prev.totalXp+xp;
      const oldLv = getLvl(prev.totalXp).level;
      if(getLvl(newXp).level>oldLv) setTimeout(()=>{setLvlUp(true);setTimeout(()=>setLvlUp(false),3200);},80);

      let newDaily=prev.daily, newCustom=prev.custom, newBoss=prev.boss;
      let dStat = isBoss?3:1;
      let newStats={...prev.stats,[q.stat]:prev.stats[q.stat]+dStat};

      if(isCustom)    newCustom=prev.custom.map(c=>c.id===q.id?{...c,done:true}:c);
      else if(isBoss) newBoss={...prev.boss,[q.id]:"done"};
      else            newDaily={...prev.daily,[q.id]:true};

      const merged={...prev.daily,[q.id]:true};
      const allDone=!isCustom&&!isBoss&&DEF_DAILY.every(d=>merged[d.id]);

      let hp=prev.hp;
      if((cls.id==="athlete"||cls.id==="iron_monk")&&q.cat==="sport")
        hp=Math.min(prev.maxHp,hp+(cls.id==="iron_monk"?2:1));

      let bonusXP=0;
      if(allDone&&prev.event?.type==="challenge"&&prev.eventDone) bonusXP=prev.event.val||0;

      const ovTag=ovMult>=2?" 💥×2!":ovMult>=1.5?" 🚀×1.5!":"";
      if(allDone) pop("🔥 Все дейли выполнены! Комбо растёт!");
      else if(isBoss) pop(`⚔️ Босс пал!${ovTag} +${xp} XP +${gold}G`);
      else pop(`+${xp} XP${ovTag} +${gold}G — ${q.title}`);

      // Save undo snapshot (30s window)
      const snap=JSON.parse(JSON.stringify(prev));
      setUndoSnap({snap,exp:Date.now()+30000}); setUndoSecs(30);

      return {
        ...prev,totalXp:newXp+bonusXP,gold:prev.gold+gold,hp,stats:newStats,
        combo:allDone?prev.combo+1:prev.combo,
        daily:newDaily,custom:newCustom,boss:newBoss,nextDouble:false,
        log:[{id:Date.now(),txt:q.title+(bonusXP?` (+${bonusXP}bXP)`:"")+ovTag,xp:xp+bonusXP,gold,t:isBoss?"boss":"ok",time:nowStr()},...prev.log.slice(0,79)],
      };
    });
    setPendingQ(null);
  };

  const doUndo = ()=>{
    if(!undoSnap) return;
    const s=undoSnap.snap; setGs(s); save(s);
    setUndoSnap(null); setUndoSecs(0); pop("↩️ Отменено!");
  };

  const clickQuest=(q,isCustom=false,isBoss=false)=>{
    if(!isCustom&&!isBoss&&gs.daily[q.id]) return;
    if(isCustom&&q.done) return;
    if(isBoss&&gs.boss[q.id]) return;
    setPendingQ({q,isCustom,isBoss});
  };

  const failBoss=(q)=>upd(prev=>{
    const shielded=prev.shield||(getClass(prev.stats,prev.combo,getLvl(prev.totalXp).level).id==="balanced"&&!prev.immunityUsed)||getClass(prev.stats,prev.combo,getLvl(prev.totalXp).level).id==="ocean";
    pop(`💀 Провал! -${q.pen} HP${shielded?" (Комбо защищён!)":""}`,false);
    return {
      ...prev,hp:Math.max(0,prev.hp-q.pen),
      combo:shielded?prev.combo:0,
      immunityUsed:shielded&&getClass(prev.stats,prev.combo,getLvl(prev.totalXp).level).id==="balanced"?true:prev.immunityUsed,
      shield:false,boss:{...prev.boss,[q.id]:"fail"},
      log:[{id:Date.now(),txt:`💀 Провал: ${q.title}`,xp:-q.pen,gold:0,t:"fail",time:nowStr()},...prev.log.slice(0,79)],
    };
  });

  const takeRest=()=>upd(prev=>{
    if(prev.daily.REST){pop("Сегодня уже день отдыха",false);return prev;}
    const first=prev.restWeek===0;
    const goldΔ=first?30:-20;
    pop(first?"😴 Отдыхай! +30G, +10 HP, комбо цел":"😓 Второй выходной: -20G, -1 комбо",first);
    return {...prev,gold:Math.max(0,prev.gold+goldΔ),combo:first?prev.combo:Math.max(0,prev.combo-1),
      hp:Math.min(prev.maxHp,prev.hp+10),restWeek:prev.restWeek+1,daily:{...prev.daily,REST:true},
      log:[{id:Date.now(),txt:first?"😴 День отдыха":"😓 Второй отдых за неделю",xp:0,gold:goldΔ,t:first?"rest":"fail",time:nowStr()},...prev.log.slice(0,79)]};
  });

  const claimEvent=()=>upd(prev=>{
    if(prev.eventDone) return prev;
    const ev=prev.event; let s={...prev,eventDone:true};
    if(ev.type==="gold") s.gold=prev.gold+(ev.val||0);
    else if(ev.type==="hp") s.hp=Math.min(prev.maxHp,prev.hp+(ev.val||0));
    else if(ev.type==="x2") s.nextDouble=true;
    else if(ev.type==="shield") s.shield=true;
    pop(ev.txt); return s;
  });

  /* ── Habits ─────────────────────────────────────────────────────────────── */
  const habitHold=(hid)=>upd(prev=>{
    const tod=today();
    return {...prev,habits:prev.habits.map(h=>{
      if(h.id!==hid) return h;
      if(h.lastCheck===tod){pop("Сегодня уже отмечено ✓");return h;}
      const newStreak=h.streak+1;
      const longest=Math.max(newStreak,h.longest);
      pop(`🛡 Держишься! ${newStreak} ${declDay(newStreak)}`);
      return {...h,streak:newStreak,longest,lastCheck:tod};
    })};
  });

  const habitFail=(hid)=>upd(prev=>({
    ...prev,hp:Math.max(0,prev.hp-15),
    habits:prev.habits.map(h=>{
      if(h.id!==hid) return h;
      pop(`💔 Срыв. Серия ${h.streak} сброшена. -15 HP`,false);
      return {...h,streak:0,lastCheck:today()};
    }),
    log:[{id:Date.now(),txt:"💔 Срыв привычки",xp:0,gold:-0,t:"fail",time:nowStr()},...prev.log.slice(0,79)],
  }));

  const claimHabitMs=(hid,days)=>upd(prev=>{
    const ms=HABIT_MS.find(m=>m.days===days);
    if(!ms) return prev;
    return {
      ...prev,gold:prev.gold+ms.gold,totalXp:prev.totalXp+ms.xp,
      hp:Math.min(prev.maxHp,prev.hp+ms.hp),
      habits:prev.habits.map(h=>h.id!==hid?h:{...h,claimedMs:[...(h.claimedMs||[]),days]}),
      log:[{id:Date.now(),txt:`${ms.icon} Веха привычки: ${days} дней!`,xp:ms.xp,gold:ms.gold,t:"ok",time:nowStr()},...prev.log.slice(0,79)],
    };
  });

  const addHabit=()=>{
    const name=prompt("Название привычки (что хочешь перестать делать):");
    if(!name?.trim()) return;
    upd(prev=>({...prev,habits:[...prev.habits,{id:`h-${Date.now()}`,name:name.trim(),icon:"🔒",streak:0,longest:0,lastCheck:"",claimedMs:[]}]}));
  };

  /* ── Custom quests ──────────────────────────────────────────────────────── */
  const askAI=async()=>{
    if(!qForm.title.trim()){pop("Введи название",false);return;}
    setQForm(f=>({...f,loading:true}));
    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:50,
          messages:[{role:"user",content:`Оцени сложность задания для личной геймификации. Ответь ТОЛЬКО числом 10-300 (XP):\n"${qForm.title}${qForm.desc?"\n"+qForm.desc:""}"\nТолько число:`}]})});
      const d=await res.json();
      const n=parseInt(d.content?.[0]?.text?.trim());
      const xp=isNaN(n)?50:Math.max(10,Math.min(300,n));
      setQForm(f=>({...f,aiXP:xp,loading:false}));
      pop(`🤖 ИИ оценил: ${xp} XP`);
    }catch{pop("Ошибка ИИ — выбери вручную",false);setQForm(f=>({...f,loading:false}));}
  };

  const addQuest=()=>{
    if(!qForm.title.trim()){pop("Введи название",false);return;}
    const df=DIFF.find(x=>x.id===qForm.diff)||DIFF[1];
    const xp=qForm.aiXP??df.xp;
    upd(prev=>({...prev,custom:[...prev.custom,{id:`cq-${Date.now()}`,title:qForm.title.trim(),desc:qForm.desc.trim()||qForm.title.trim(),xp,gold:Math.floor(xp/5),stat:qForm.stat,cat:"custom",icon:"⚡",done:false}]}));
    setQForm({show:false,title:"",desc:"",stat:"INT",diff:"medium",aiXP:null,loading:false});
    pop(`✅ Квест добавлен! ${qForm.aiXP??DIFF.find(x=>x.id===qForm.diff).xp} XP`);
  };

  const delQuest=(id)=>upd(prev=>({...prev,custom:prev.custom.filter(q=>q.id!==id)}));

  /* ── Quest edit ─────────────────────────────────────────────────────────── */
  const openEdit=(q)=>{ setEditingQ(q.id); setEditBuf({title:q.title,desc:q.desc,xp:q.xp,pen:q.pen}); };
  const saveEdit=()=>{
    upd(prev=>({...prev,questEdits:{...prev.questEdits,[editingQ]:{...editBuf,xp:parseInt(editBuf.xp)||50,pen:parseInt(editBuf.pen)||30}}}));
    setEditingQ(null); pop("✅ Квест обновлён!");
  };
  const mergeQ=(def)=>({...def,...(gs?.questEdits?.[def.id]||{})});

  /* ── Shop ────────────────────────────────────────────────────────────────── */
  const buyItem=(item)=>upd(prev=>{
    if(prev.gold<item.cost){pop("Мало Gold! 💸",false);return prev;}
    pop(`🛒 ${item.name} — куплено!`);
    return {...prev,gold:prev.gold-item.cost,
      purchases:[{id:Date.now(),name:item.name,cost:item.cost,time:nowStr()},...(prev.purchases||[])],
      log:[{id:Date.now(),txt:`🛒 ${item.name}`,xp:0,gold:-item.cost,t:"shop",time:nowStr()},...prev.log.slice(0,79)]};
  });

  const addShopItem=()=>{
    if(!sForm.name.trim()){pop("Введи название",false);return;}
    upd(prev=>({...prev,shop:[...prev.shop,{id:`sh-${Date.now()}`,name:sForm.name.trim(),cost:sForm.cost,icon:"⭐"}]}));
    setSForm({show:false,name:"",cost:50}); pop("Награда добавлена!");
  };

  /* ── Name, export/import ─────────────────────────────────────────────────── */
  const saveName=()=>{ upd(prev=>({...prev,name:tmpName||prev.name})); setEditName(false); };

  const doImport=()=>{
    try{
      const s=JSON.parse(importTxt);
      if(!s.totalXp&&s.totalXp!==0) throw new Error();
      setGs(s); save(s); setShowExport(false); setImportTxt(""); pop("✅ Данные импортированы!");
    }catch{pop("Ошибка! Проверь формат JSON",false);}
  };

  /* ─── Render ─────────────────────────────────────────────────────────────── */
  if(!gs) return <div style={S.center}><span style={{color:"#fbbf24",fontSize:18}}>⚔️ Загрузка...</span></div>;

  const lvi=getLvl(gs.totalXp);
  const cls=getClass(gs.stats,gs.combo,lvi.level);
  const xpP=(lvi.xpIn/lvi.xpTo)*100;
  const hpP=(gs.hp/gs.maxHp)*100;
  const doneN=DEF_DAILY.filter(q=>gs.daily[q.id]).length;
  const multS=gs.combo>0?`×${(1+gs.combo*0.1).toFixed(1)}`:null;

  return (
    <div style={S.root}>
      <style>{CSS}</style>

      {/* ── LvlUp overlay ── */}
      {lvlUp&&<div style={S.overlay}><div style={{textAlign:"center",animation:"popIn .4s ease"}}>
        <div style={{fontSize:80}}>⚡</div>
        <div style={{fontSize:44,fontWeight:900,color:"#fbbf24",textShadow:"0 0 30px #fbbf24",fontFamily:"Georgia,serif"}}>LEVEL UP!</div>
        <div style={{fontSize:28,color:"#e2e8f0",marginTop:8}}>Уровень {lvi.level}</div>
        <div style={{fontSize:16,color:cls.color,marginTop:4}}>{getLvlName(lvi.level)}</div>
        <div style={{fontSize:14,color:cls.color,marginTop:2}}>{cls.name}</div>
      </div></div>}

      {/* ── Overperf modal ── */}
      {pendingQ&&<div style={S.overlay} onClick={()=>setPendingQ(null)}>
        <div style={{background:"#0e1320",border:"1px solid #4c1d95",borderRadius:18,padding:24,width:"min(340px,90vw)",boxShadow:"0 0 40px #4c1d9560"}} onClick={e=>e.stopPropagation()}>
          <div style={{fontWeight:800,color:"#fbbf24",fontSize:15,marginBottom:6,fontFamily:"Georgia"}}>⚡ {pendingQ.q.title}</div>
          <div style={{fontSize:13,color:"#64748b",marginBottom:18}}>Как ты выполнил это задание?</div>
          {OVERPERF.map(op=>(
            <button key={op.id} onClick={()=>completeQuest(pendingQ.q,op.mult,pendingQ.isCustom,pendingQ.isBoss)}
              style={{width:"100%",background:`${op.color}12`,border:`1px solid ${op.color}50`,borderRadius:12,padding:"12px 16px",marginBottom:8,cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{color:op.color,fontWeight:700,fontSize:14}}>{op.label}</span>
              <span style={{color:"#64748b",fontSize:12}}>{op.sub} • {Math.floor((pendingQ.q.xp||50)*op.mult*(1+gs.combo*0.1))} XP</span>
            </button>
          ))}
          <button onClick={()=>setPendingQ(null)} style={{...S.bGray,width:"100%",padding:"10px",marginTop:4}}>Отмена</button>
        </div>
      </div>}

      {/* ── Levels modal ── */}
      {showLevels&&<div style={S.overlay} onClick={()=>setShowLevels(false)}>
        <div style={{background:"#0a0f1e",border:"1px solid #1e293b",borderRadius:18,padding:20,width:"min(360px,92vw)",maxHeight:"80vh",overflow:"auto"}} onClick={e=>e.stopPropagation()}>
          <div style={{fontWeight:900,color:"#fbbf24",fontSize:16,marginBottom:16,fontFamily:"Georgia"}}>⚔️ Все уровни</div>
          {LVL_NAMES.map((name,i)=>{
            const lNum=i+1, req=cumulXP(lNum), isCur=lvi.level===lNum, isPast=lvi.level>lNum;
            return <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"9px 12px",borderRadius:10,marginBottom:4,background:isCur?"#1e103a":isPast?"#0a1a0a":"transparent",border:isCur?"1px solid #7c3aed":"1px solid transparent"}}>
              <div style={{width:28,height:28,borderRadius:6,background:isCur?"#7c3aed":isPast?"#14532d":"#1e293b",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:isCur?"#fff":isPast?"#4ade80":"#475569",flexShrink:0}}>{lNum}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:isCur?800:500,color:isCur?"#c4b5fd":isPast?"#e2e8f0":"#475569"}}>{name}</div>
                <div style={{fontSize:10,color:"#334155"}}>{lNum===1?"Начало пути":`${req.toLocaleString()} XP всего`}</div>
              </div>
              {isCur&&<span style={{fontSize:12,color:"#a78bfa",fontWeight:700}}>← ты</span>}
              {isPast&&<span style={{color:"#22c55e",fontSize:14}}>✓</span>}
            </div>;
          })}
        </div>
      </div>}

      {/* ── Classes modal ── */}
      {showClasses&&<div style={S.overlay} onClick={()=>setShowClasses(false)}>
        <div style={{background:"#0a0f1e",border:"1px solid #1e293b",borderRadius:18,padding:20,width:"min(380px,92vw)",maxHeight:"80vh",overflow:"auto"}} onClick={e=>e.stopPropagation()}>
          <div style={{fontWeight:900,color:"#fbbf24",fontSize:16,marginBottom:16,fontFamily:"Georgia"}}>🔮 Все классы</div>
          {CLASSES.map(cl=>{
            const isCur=cls.id===cl.id;
            return <div key={cl.id} style={{background:isCur?`${cl.color}14`:"#0e1320",border:`1px solid ${isCur?cl.color:"#1e293b"}`,borderRadius:12,padding:"12px 14px",marginBottom:8}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                <span style={{fontSize:15,fontWeight:800,color:cl.color}}>{cl.name}</span>
                {isCur&&<span style={{fontSize:10,background:cl.color+"30",color:cl.color,borderRadius:6,padding:"2px 8px",fontWeight:700}}>ТЕКУЩИЙ</span>}
              </div>
              <div style={{fontSize:12,color:"#94a3b8",marginBottom:4,fontStyle:"italic"}}>{cl.desc}</div>
              <div style={{fontSize:12,color:"#fbbf24"}}>▸ {cl.bonus}</div>
            </div>;
          })}
        </div>
      </div>}

      {/* ── Export/Import modal ── */}
      {showExport&&<div style={S.overlay} onClick={()=>setShowExport(false)}>
        <div style={{background:"#0a0f1e",border:"1px solid #1e293b",borderRadius:18,padding:20,width:"min(380px,92vw)"}} onClick={e=>e.stopPropagation()}>
          <div style={{fontWeight:800,color:"#fbbf24",fontSize:15,marginBottom:14}}>💾 Сохранение прогресса</div>
          <div style={{fontSize:12,color:"#64748b",marginBottom:12}}>Скопируй JSON — это твои данные. Для восстановления — вставь обратно и нажми Импорт.</div>
          <textarea readOnly value={JSON.stringify(gs,null,2)} style={{...S.inp,height:140,fontSize:10,fontFamily:"monospace",resize:"none",marginBottom:12}} onClick={e=>e.target.select()}/>
          <textarea value={importTxt} onChange={e=>setImportTxt(e.target.value)} placeholder="Вставь сохранённый JSON сюда для восстановления..." style={{...S.inp,height:80,fontSize:11,fontFamily:"monospace",resize:"none",marginBottom:10}}/>
          <div style={{display:"flex",gap:8}}>
            <button onClick={doImport} style={{...S.bWin,flex:1,padding:"10px"}}>📥 Импортировать</button>
            <button onClick={()=>setShowExport(false)} style={{...S.bGray,padding:"10px 14px"}}>✗</button>
          </div>
        </div>
      </div>}

      {/* ── Toast ── */}
      {toast&&<div style={{...S.toast,background:toast.ok?"#052e16":"#450a0a",borderColor:toast.ok?"#22c55e":"#ef4444"}}>{toast.msg}</div>}

      {/* ── Undo bar ── */}
      {undoSnap&&<div style={{background:"#0a0f1e",borderBottom:"1px solid #1e3a5f",padding:"8px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span style={{fontSize:12,color:"#94a3b8"}}>Квест выполнен. Случайно нажал?</span>
        <button onClick={doUndo} style={{...S.bFail,padding:"5px 12px",fontSize:12}}>↩️ Отмена ({undoSecs}с)</button>
      </div>}

      {/* ══ HEADER ══ */}
      <div style={S.header}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
          <div>
            {editName?<div style={{display:"flex",gap:6}}>
              <input value={tmpName} onChange={e=>setTmpName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&saveName()} autoFocus style={S.nameIn}/>
              <button onClick={saveName} style={S.bGreen}>✓</button>
              <button onClick={()=>setEditName(false)} style={S.bGray}>✗</button>
            </div>:<div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:21,fontWeight:900,color:"#fbbf24",fontFamily:"Georgia,serif"}}>{gs.name}</span>
              <button onClick={()=>{setTmpName(gs.name);setEditName(true);}} style={{background:"none",border:"none",cursor:"pointer",color:"#475569",fontSize:13,padding:0}}>✏️</button>
            </div>}
            <button onClick={()=>setShowLevels(true)} style={{background:"none",border:"1px solid #1e293b",borderRadius:8,cursor:"pointer",color:"#94a3b8",fontSize:11,padding:"3px 8px",marginTop:4,display:"block"}}>
              {getLvlName(lvi.level)} • Ур. {lvi.level} ▸
            </button>
          </div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",justifyContent:"flex-end"}}>
            <div style={{...S.badge,border:"1px solid #92400e",color:"#fbbf24",background:"#1a1208"}}>💰 {gs.gold}G</div>
            {multS&&<div style={{...S.badge,border:"1px solid #7c3aed",color:"#e9d5ff",background:"#1e103a"}}>🔥{multS}</div>}
            <button onClick={()=>setShowExport(true)} style={{...S.badge,background:"#0a0f1e",border:"1px solid #1e293b",color:"#475569",cursor:"pointer",fontSize:12}}>💾</button>
          </div>
        </div>

        {/* Class bar — clickable */}
        <button onClick={()=>setShowClasses(true)} style={{background:`${cls.color}12`,border:`1px solid ${cls.color}35`,borderRadius:8,padding:"6px 12px",marginBottom:12,display:"flex",alignItems:"center",gap:8,width:"100%",cursor:"pointer",textAlign:"left"}}>
          <span style={{fontSize:13,fontWeight:700,color:cls.color}}>{cls.name}</span>
          <span style={{fontSize:11,color:"#64748b"}}>|</span>
          <span style={{fontSize:11,color:"#94a3b8",flex:1}}>{cls.bonus}</span>
          <span style={{fontSize:10,color:"#475569"}}>все ▸</span>
        </button>

        <Bar label="⚡ ОПЫТ"   right={`${lvi.xpIn}/${lvi.xpTo} XP`} pct={xpP} color="linear-gradient(90deg,#3b82f6,#7c3aed)" h={10} glo="#7c3aed"/>
        <Bar label="❤️ ЖИЗНИ" right={`${gs.hp}/${gs.maxHp}`} pct={hpP} color={hpP>60?"#22c55e":hpP>30?"#f59e0b":"#ef4444"} h={7} glo={hpP>60?"#22c55e":"#ef4444"}/>

        <div style={{display:"flex",alignItems:"center",gap:8,marginTop:8}}>
          <span style={{fontSize:11,color:"#64748b",whiteSpace:"nowrap"}}>Дейли {doneN}/{DEF_DAILY.length}</span>
          <div style={{flex:1,height:3,background:"#1e293b",borderRadius:2}}>
            <div style={{height:"100%",width:`${(doneN/DEF_DAILY.length)*100}%`,background:"#fbbf24",borderRadius:2,transition:"width .4s"}}/>
          </div>
          <span style={{fontSize:11,color:"#fbbf24",fontWeight:700}}>{gs.totalXp.toLocaleString()} XP</span>
        </div>
      </div>

      {/* Event bar */}
      {gs.event&&<div style={{background:"#06090f",borderBottom:"1px solid #1e3a5f",padding:"9px 14px",display:"flex",alignItems:"center",gap:10}}>
        <div style={{flex:1}}>
          <div style={{fontSize:10,color:"#334155",letterSpacing:1,marginBottom:1}}>🎲 СОБЫТИЕ ДНЯ</div>
          <div style={{fontSize:12,color:"#e2e8f0"}}>{gs.event.txt}</div>
        </div>
        {!gs.eventDone?<button onClick={claimEvent} style={{...S.bWin,padding:"6px 12px",fontSize:12,flexShrink:0}}>Принять</button>
          :<span style={{color:"#22c55e",fontWeight:700,fontSize:13,flexShrink:0}}>✓</span>}
      </div>}

      {/* ══ TABS ══ */}
      <div style={S.tabs}>
        {[["quests","⚔️ Квесты"],["habits","🛡 Привычки"],["shop","🛒 Магазин"],["stats","📊 Статы"],["log","📜 Журнал"]].map(([t,l])=>(
          <button key={t} onClick={()=>setTab(t)} style={{...S.tab,color:tab===t?"#fbbf24":"#64748b",borderBottom:`2px solid ${tab===t?"#fbbf24":"transparent"}`,fontWeight:tab===t?700:500}}>{l}</button>
        ))}
      </div>

      {/* ══ QUESTS ══ */}
      {tab==="quests"&&<div>
        <div style={{display:"flex",background:"#08090f",borderBottom:"1px solid #1a2030",padding:"0 12px",gap:2}}>
          {[["daily","Дейли"],["boss","Боссы"],["custom","Свои"],["rest","Отдых"]].map(([t,l])=>(
            <button key={t} onClick={()=>setSub(t)} style={{background:"none",border:"none",cursor:"pointer",color:sub===t?"#a78bfa":"#475569",fontWeight:sub===t?700:400,fontSize:12,padding:"10px 8px 8px",borderBottom:`2px solid ${sub===t?"#a78bfa":"transparent"}`}}>{l}</button>
          ))}
        </div>
        <div style={S.body}>

          {/* Daily */}
          {sub==="daily"&&["study","sport","dev"].map(cat=>(
            <div key={cat} style={{marginBottom:20}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                <div style={{width:4,height:18,background:CCLR[cat],borderRadius:2,boxShadow:`0 0 8px ${CCLR[cat]}50`}}/>
                <span style={{fontSize:12,fontWeight:800,color:CCLR[cat],textTransform:"uppercase",letterSpacing:"1px"}}>{CATS[cat]}</span>
              </div>
              {DEF_DAILY.filter(q=>q.cat===cat).map(def=>{
                const q=mergeQ(def);
                const done=gs.daily[q.id];
                const isEditing=editingQ===q.id;
                const bXP=multS?Math.floor(q.xp*(1+gs.combo*0.1)):q.xp;
                return <div key={q.id}>
                  {isEditing?<div style={{background:"#0e1320",border:`1px solid ${CCLR[cat]}`,borderRadius:12,padding:14,marginBottom:8}}>
                    <div style={{fontSize:12,color:CCLR[cat],fontWeight:700,marginBottom:10}}>✏️ Редактировать квест</div>
                    <input value={editBuf.title||""} onChange={e=>setEditBuf(b=>({...b,title:e.target.value}))} placeholder="Название" style={{...S.inp,marginBottom:8}}/>
                    <input value={editBuf.desc||""} onChange={e=>setEditBuf(b=>({...b,desc:e.target.value}))} placeholder="Описание / цель" style={{...S.inp,marginBottom:8}}/>
                    <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:10}}>
                      <input type="number" value={editBuf.xp||50} onChange={e=>setEditBuf(b=>({...b,xp:e.target.value}))} style={{...S.inp,width:80}} placeholder="XP"/>
                      <span style={{color:"#64748b",fontSize:12}}>XP за выполнение</span>
                    </div>
                    <div style={{display:"flex",gap:8}}>
                      <button onClick={saveEdit} style={{...S.bWin,flex:1,padding:"9px"}}>✓ Сохранить</button>
                      <button onClick={()=>setEditingQ(null)} style={{...S.bGray,padding:"9px 14px"}}>✗</button>
                    </div>
                  </div>:
                  <div style={{background:done?"#0a1f10":"#0e1320",border:`1px solid ${done?"#14532d":"#1e293b"}`,borderRadius:12,padding:"11px 12px",marginBottom:7,display:"flex",alignItems:"center",gap:10,opacity:done?.65:1,transition:"all .2s"}}
                    onMouseEnter={e=>{if(!done){e.currentTarget.style.borderColor=CCLR[cat];e.currentTarget.style.transform="translateX(2px)";}}}
                    onMouseLeave={e=>{if(!done){e.currentTarget.style.borderColor="#1e293b";e.currentTarget.style.transform="none";}}}>
                    <span style={{fontSize:26,cursor:done?"default":"pointer"}} onClick={()=>!done&&clickQuest(q)}>{q.icon}</span>
                    <div style={{flex:1,cursor:done?"default":"pointer"}} onClick={()=>!done&&clickQuest(q)}>
                      <div style={{fontWeight:700,fontSize:13,color:done?"#4ade80":"#e2e8f0",textDecoration:done?"line-through":"none"}}>{q.title}</div>
                      <div style={{fontSize:11,color:"#475569",marginTop:1}}>{q.desc}</div>
                      <div style={{fontSize:11,marginTop:3,display:"flex",gap:8}}>
                        <span style={{color:"#fbbf24",fontWeight:600}}>+{bXP} XP</span>
                        {multS&&!done&&<span style={{color:"#a78bfa"}}>{multS}</span>}
                        <span style={{color:"#64748b"}}>• {SICN[q.stat]} {SLBL[q.stat]}</span>
                      </div>
                    </div>
                    <button onClick={()=>openEdit(q)} style={{background:"none",border:"none",cursor:"pointer",color:"#334155",fontSize:14,padding:"4px",flexShrink:0}} title="Редактировать">✏️</button>
                    <div onClick={()=>!done&&clickQuest(q)} style={{width:32,height:32,borderRadius:8,border:`2px solid ${done?"#22c55e":CCLR[cat]}`,background:done?"#166534":"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,color:done?"#4ade80":CCLR[cat],flexShrink:0,cursor:done?"default":"pointer",transition:"all .2s"}}>
                      {done?"✓":""}
                    </div>
                  </div>}
                </div>;
              })}
            </div>
          ))}

          {/* Boss */}
          {sub==="boss"&&DEF_BOSS.map(def=>{
            const q=mergeQ(def), st=gs.boss[q.id];
            const isEditing=editingQ===q.id;
            return <div key={q.id}>
              {isEditing?<div style={{background:"#0e1320",border:"1px solid #4c1d95",borderRadius:12,padding:14,marginBottom:12}}>
                <div style={{fontSize:12,color:"#c4b5fd",fontWeight:700,marginBottom:10}}>✏️ Редактировать босса</div>
                <input value={editBuf.title||""} onChange={e=>setEditBuf(b=>({...b,title:e.target.value}))} placeholder="Название" style={{...S.inp,marginBottom:8}}/>
                <input value={editBuf.desc||""} onChange={e=>setEditBuf(b=>({...b,desc:e.target.value}))} placeholder="Цель / условие победы" style={{...S.inp,marginBottom:8}}/>
                <div style={{display:"flex",gap:8,marginBottom:10}}>
                  <div style={{flex:1}}><div style={{fontSize:11,color:"#64748b",marginBottom:4}}>XP за победу</div><input type="number" value={editBuf.xp||200} onChange={e=>setEditBuf(b=>({...b,xp:e.target.value}))} style={S.inp}/></div>
                  <div style={{flex:1}}><div style={{fontSize:11,color:"#64748b",marginBottom:4}}>HP штраф</div><input type="number" value={editBuf.pen||30} onChange={e=>setEditBuf(b=>({...b,pen:e.target.value}))} style={S.inp}/></div>
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={saveEdit} style={{...S.bWin,flex:1,padding:"9px"}}>✓ Сохранить</button>
                  <button onClick={()=>setEditingQ(null)} style={{...S.bGray,padding:"9px 14px"}}>✗</button>
                </div>
              </div>:
              <div style={{background:st==="done"?"#0a1f10":st==="fail"?"#1f0808":"#110818",border:`1px solid ${st==="done"?"#14532d":st==="fail"?"#7f1d1d":"#4c1d95"}`,borderRadius:14,padding:"13px 14px",marginBottom:12,boxShadow:!st?"0 0 14px #4c1d9530":""}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                  <span style={{fontSize:32}}>{q.icon}</span>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:800,fontSize:14,color:st==="done"?"#4ade80":st==="fail"?"#f87171":"#c4b5fd",fontFamily:"Georgia"}}>{q.title}</div>
                    <div style={{fontSize:12,color:"#94a3b8",marginTop:2}}>{q.desc}</div>
                  </div>
                  {!st&&<button onClick={()=>openEdit(q)} style={{background:"none",border:"none",cursor:"pointer",color:"#334155",fontSize:14,padding:"4px"}}>✏️</button>}
                </div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div style={{display:"flex",gap:10}}>
                    <span style={{color:"#fbbf24",fontSize:13,fontWeight:700}}>+{q.xp} XP</span>
                    <span style={{color:"#ef4444",fontSize:12}}>⚠️ -{q.pen} HP</span>
                  </div>
                  {!st&&<div style={{display:"flex",gap:8}}>
                    <button onClick={()=>clickQuest(q,false,true)} style={S.bWin}>✓ Победа</button>
                    <button onClick={()=>failBoss(q)} style={S.bFail}>✗ Провал</button>
                  </div>}
                  {st==="done"&&<span style={{color:"#4ade80",fontWeight:800}}>⚔️ ПОБЕДА</span>}
                  {st==="fail"&&<span style={{color:"#f87171",fontWeight:800}}>💀 ПРОВАЛ</span>}
                </div>
              </div>}
            </div>;
          })}

          {/* Custom */}
          {sub==="custom"&&<div>
            <button onClick={()=>setQForm(f=>({...f,show:!f.show}))} style={{...S.bWin,width:"100%",padding:"12px",fontSize:14,textAlign:"center",marginBottom:14}}>
              {qForm.show?"✗ Закрыть":"+ Создать свой квест"}
            </button>
            {qForm.show&&<div style={{background:"#0e1320",border:"1px solid #1e3a5f",borderRadius:14,padding:16,marginBottom:16}}>
              <div style={{fontWeight:700,color:"#fbbf24",fontSize:13,marginBottom:12}}>⚡ НОВЫЙ КВЕСТ</div>
              <input value={qForm.title} onChange={e=>setQForm(f=>({...f,title:e.target.value}))} placeholder="Название квеста..." style={{...S.inp,marginBottom:8}}/>
              <input value={qForm.desc} onChange={e=>setQForm(f=>({...f,desc:e.target.value}))} placeholder="Описание (опционально)..." style={{...S.inp,marginBottom:10}}/>
              <div style={{display:"flex",gap:8,marginBottom:12}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:11,color:"#64748b",marginBottom:4}}>Стат</div>
                  <select value={qForm.stat} onChange={e=>setQForm(f=>({...f,stat:e.target.value}))} style={S.sel}>
                    {Object.entries(SLBL).map(([k,v])=><option key={k} value={k}>{SICN[k]} {v}</option>)}
                  </select>
                </div>
              </div>
              <div style={{display:"flex",gap:5,marginBottom:12}}>
                {DIFF.map((d,i)=>{const c=["#4ade80","#fbbf24","#f87171","#c084fc"][i];const a=qForm.diff===d.id&&!qForm.aiXP;return(
                  <button key={d.id} onClick={()=>setQForm(f=>({...f,diff:d.id,aiXP:null}))} style={{flex:1,background:a?`${c}18`:"#0f1829",border:`1px solid ${a?c:"#1e3a5f"}`,borderRadius:8,padding:"8px 2px",cursor:"pointer",color:c,fontSize:11,fontWeight:a?700:400,lineHeight:1.4}}>
                    {d.label}<br/><span style={{color:"#64748b",fontSize:10}}>{d.xp} XP</span>
                  </button>);})}
              </div>
              <button onClick={askAI} disabled={qForm.loading||!qForm.title.trim()} style={{...S.bGreen,width:"100%",padding:"10px",marginBottom:8,fontSize:13,opacity:qForm.loading||!qForm.title.trim()?.4:1}}>
                {qForm.loading?"🤖 Думаю...":qForm.aiXP?`🤖 ИИ: ${qForm.aiXP} XP (пересчитать)`:"🤖 Пусть ИИ оценит XP"}
              </button>
              <button onClick={addQuest} style={{...S.bWin,width:"100%",padding:"12px",fontSize:14}}>✓ Добавить квест</button>
            </div>}
            {gs.custom.filter(q=>!q.done).length===0&&!qForm.show&&<div style={{textAlign:"center",color:"#475569",paddingTop:50}}>
              <div style={{fontSize:50,marginBottom:10}}>⚡</div><div>Нет активных квестов</div>
            </div>}
            {gs.custom.filter(q=>!q.done).map(q=>(
              <div key={q.id} style={{background:"#0e1320",border:"1px solid #1e3a5f",borderRadius:12,padding:"11px 12px",marginBottom:8,display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontSize:22}}>⚡</span>
                <div style={{flex:1,cursor:"pointer"}} onClick={()=>clickQuest(q,true)}>
                  <div style={{fontWeight:700,fontSize:13,color:"#e2e8f0"}}>{q.title}</div>
                  <div style={{fontSize:11,color:"#475569",marginTop:1}}>{q.desc}</div>
                  <div style={{fontSize:11,color:"#fbbf24",marginTop:2}}>+{q.xp} XP • +{q.gold}G • {SICN[q.stat]}</div>
                </div>
                <button onClick={()=>delQuest(q.id)} style={{...S.bFail,padding:"6px 10px",fontSize:12}}>🗑</button>
              </div>
            ))}
            {gs.custom.filter(q=>q.done).length>0&&<div style={{marginTop:14}}>
              <div style={{fontSize:11,color:"#334155",letterSpacing:1,marginBottom:6}}>ВЫПОЛНЕННЫЕ</div>
              {gs.custom.filter(q=>q.done).map(q=><div key={q.id} style={{background:"#0a1f10",border:"1px solid #14532d",borderRadius:9,padding:"7px 12px",marginBottom:5,display:"flex",justifyContent:"space-between",opacity:.55}}>
                <span style={{fontSize:12,color:"#4ade80",textDecoration:"line-through"}}>{q.title}</span><span style={{color:"#4ade80"}}>✓</span>
              </div>)}
            </div>}
          </div>}

          {/* Rest */}
          {sub==="rest"&&<div>
            <div style={{background:"#0e1320",border:"1px solid #1e293b",borderRadius:16,padding:22,marginBottom:14,textAlign:"center"}}>
              <div style={{fontSize:60,marginBottom:10}}>😴</div>
              <div style={{fontWeight:800,fontSize:17,color:"#e2e8f0",fontFamily:"Georgia",marginBottom:8}}>День Отдыха</div>
              <div style={{fontSize:13,color:"#94a3b8",lineHeight:1.9,marginBottom:16}}>
                <span style={{color:"#4ade80"}}>1-й отдых за неделю</span>: +30G, комбо цел, +10 HP<br/>
                <span style={{color:"#f87171"}}>2-й+ отдых</span>: -20G, -1 комбо, +10 HP<br/>
                <span style={{color:"#64748b",fontSize:12}}>Использовано: {gs.restWeek}/2 этой недели</span>
              </div>
              {gs.daily.REST?<div style={{color:"#60a5fa",fontWeight:700,fontSize:15}}>✓ Сегодня день отдыха</div>
                :<button onClick={takeRest} style={{...S.bWin,width:"100%",padding:"13px",fontSize:15}}>😴 Взять день отдыха</button>}
            </div>
          </div>}
        </div>
      </div>}

      {/* ══ HABITS ══ */}
      {tab==="habits"&&<div style={S.body}>
        <div style={{fontSize:13,color:"#64748b",marginBottom:14,lineHeight:1.7}}>
          Привычки которые хочешь <span style={{color:"#f87171"}}>искоренить</span>. Каждый день отмечай что держишься. Срыв — штраф. Долгие серии — большие награды.
        </div>
        {gs.habits.map(h=>{
          const tod=today();
          const checkedToday=h.lastCheck===tod;
          const avMs=HABIT_MS.filter(m=>h.streak>=m.days&&!(h.claimedMs||[]).includes(m.days));
          return <div key={h.id} style={{background:"#0e1320",border:"1px solid #1e293b",borderRadius:16,padding:16,marginBottom:14}}>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
              <span style={{fontSize:36}}>{h.icon}</span>
              <div style={{flex:1}}>
                <div style={{fontWeight:800,fontSize:15,color:"#e2e8f0"}}>{h.name}</div>
                <div style={{fontSize:12,color:"#64748b",marginTop:2}}>Рекорд: {h.longest} {declDay(h.longest)}</div>
              </div>
              <div style={{textAlign:"center"}}>
                <div style={{fontSize:36,fontWeight:900,color:h.streak>0?"#22c55e":"#64748b",fontFamily:"Georgia",lineHeight:1,textShadow:h.streak>0?"0 0 12px #22c55e50":""}}>{h.streak}</div>
                <div style={{fontSize:10,color:"#475569"}}>дней</div>
              </div>
            </div>

            {/* Streak progress */}
            <div style={{display:"flex",gap:4,marginBottom:14}}>
              {HABIT_MS.map(m=>{
                const done=(h.claimedMs||[]).includes(m.days);
                const reached=h.streak>=m.days;
                return <div key={m.days} style={{flex:1,textAlign:"center"}}>
                  <div style={{fontSize:16,marginBottom:2,opacity:reached?1:0.3}}>{m.icon}</div>
                  <div style={{fontSize:9,color:done?"#4ade80":reached?"#fbbf24":"#334155",fontWeight:reached?700:400}}>{m.days}д</div>
                </div>;
              })}
            </div>

            {/* Claim milestones */}
            {avMs.length>0&&<div style={{marginBottom:12}}>
              {avMs.map(m=><button key={m.days} onClick={()=>claimHabitMs(h.id,m.days)} style={{...S.bWin,width:"100%",padding:"9px",marginBottom:6,fontSize:13}}>
                {m.icon} Получить награду за {m.days} дней! +{m.gold}G {m.xp>0?`+${m.xp} XP`:""} {m.hp>0?`+${m.hp} HP`:""}
              </button>)}
            </div>}

            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>habitHold(h.id)} disabled={checkedToday} style={{...S.bWin,flex:2,padding:"11px",fontSize:13,opacity:checkedToday?.5:1,cursor:checkedToday?"default":"pointer"}}>
                {checkedToday?"✓ Отмечено сегодня":"🛡 Держусь сегодня"}
              </button>
              <button onClick={()=>{ if(window.confirm("Зафиксировать срыв? Серия будет сброшена.")) habitFail(h.id); }} style={{...S.bFail,padding:"11px 14px",fontSize:13}}>
                💔 Срыв
              </button>
            </div>
          </div>;
        })}
        <button onClick={addHabit} style={{...S.bGray,width:"100%",padding:"12px",fontSize:14,borderRadius:12,marginTop:4}}>
          + Добавить привычку
        </button>
      </div>}

      {/* ══ SHOP ══ */}
      {tab==="shop"&&<div style={S.body}>
        <div style={{background:"#0e1320",border:"1px solid #92400e",borderRadius:12,padding:"12px 16px",marginBottom:14,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{color:"#94a3b8",fontSize:13}}>Баланс</span>
          <span style={{color:"#fbbf24",fontSize:26,fontWeight:900,fontFamily:"Georgia"}}>💰 {gs.gold}G</span>
        </div>
        {gs.shop.map(item=>(
          <div key={item.id} style={{background:"#0e1320",border:"1px solid #1e293b",borderRadius:12,padding:"11px 14px",marginBottom:9,display:"flex",alignItems:"center",gap:12}}>
            <span style={{fontSize:28}}>{item.icon}</span>
            <div style={{flex:1}}>
              <div style={{fontWeight:600,fontSize:14,color:"#e2e8f0"}}>{item.name}</div>
              <div style={{fontSize:12,color:"#fbbf24",marginTop:2}}>💰 {item.cost}G</div>
            </div>
            <button onClick={()=>buyItem(item)} disabled={gs.gold<item.cost} style={{...S.bWin,padding:"8px 14px",opacity:gs.gold<item.cost?.4:1,cursor:gs.gold<item.cost?"not-allowed":"pointer"}}>Купить</button>
          </div>
        ))}
        <button onClick={()=>setSForm(f=>({...f,show:!f.show}))} style={{...S.bGray,width:"100%",padding:"11px",fontSize:13,borderRadius:10,marginTop:4,marginBottom:10}}>
          {sForm.show?"✗ Закрыть":"+ Добавить свою награду"}
        </button>
        {sForm.show&&<div style={{background:"#0e1320",border:"1px solid #1e3a5f",borderRadius:12,padding:14,marginBottom:14}}>
          <input value={sForm.name} onChange={e=>setSForm(f=>({...f,name:e.target.value}))} placeholder="Название награды..." style={{...S.inp,marginBottom:8}}/>
          <div style={{display:"flex",gap:8,marginBottom:10,alignItems:"center"}}>
            <input type="number" value={sForm.cost} onChange={e=>setSForm(f=>({...f,cost:Math.max(1,parseInt(e.target.value)||50)}))} style={{...S.inp,flex:1}}/>
            <span style={{color:"#64748b",fontSize:13}}>Gold</span>
          </div>
          <button onClick={addShopItem} style={{...S.bWin,width:"100%",padding:"10px"}}>Добавить</button>
        </div>}
        {(gs.purchases||[]).length>0&&<div style={{marginTop:14}}>
          <div style={{fontSize:11,color:"#334155",letterSpacing:1,marginBottom:8}}>ИСТОРИЯ</div>
          {gs.purchases.slice(0,15).map(p=><div key={p.id} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:"1px solid #1a2030",fontSize:13}}>
            <span style={{color:"#94a3b8"}}>{p.name}</span><span style={{color:"#f87171"}}>-{p.cost}G</span>
          </div>)}
        </div>}
      </div>}

      {/* ══ STATS ══ */}
      {tab==="stats"&&<div style={S.body}>
        <div style={{...S.card,marginBottom:14}}>
          <div style={S.cT}>📈 XP ЗА 7 ДНЕЙ</div>
          <WeekChart data={gs.weekXP||Array(7).fill(0)}/>
        </div>
        <div style={{...S.card,marginBottom:14}}>
          <div style={S.cT}>📊 ХАРАКТЕРИСТИКИ</div>
          {Object.entries(gs.stats).map(([st,val])=>(
            <div key={st} style={{marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                <span style={{fontSize:13,color:"#cbd5e1"}}>{SICN[st]} {SLBL[st]}</span>
                <span style={{fontSize:14,fontWeight:800,color:SCLR[st],fontFamily:"Georgia"}}>Ур. {val}</span>
              </div>
              <div style={{height:8,background:"#0f172a",borderRadius:4,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${Math.min(100,(val/50)*100)}%`,background:SCLR[st],borderRadius:4,transition:"width .6s",boxShadow:`0 0 6px ${SCLR[st]}60`}}/>
              </div>
            </div>
          ))}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
          {[["⚡","XP",gs.totalXp.toLocaleString(),"#fbbf24"],["🏆","Уровень",lvi.level,"#a855f7"],["🔥","Комбо",gs.combo,"#f97316"],["💰","Gold",gs.gold,"#fbbf24"],["❤️","Жизни",gs.hp,"#ef4444"],["📅","Отдых/нед",gs.restWeek,"#60a5fa"]].map(([i,l,v,c])=>(
            <div key={l} style={{...S.card,textAlign:"center",padding:"12px 8px",marginBottom:0}}>
              <div style={{fontSize:18}}>{i}</div>
              <div style={{fontSize:22,fontWeight:900,color:c,fontFamily:"Georgia"}}>{v}</div>
              <div style={{fontSize:10,color:"#64748b",marginTop:2}}>{l}</div>
            </div>
          ))}
        </div>
        <div style={S.card}>
          <div style={S.cT}>🏅 ДОСТИЖЕНИЯ</div>
          {[
            {c:gs.totalXp>=100,ico:"⭐",n:"Первые шаги",d:"100+ XP"},
            {c:gs.totalXp>=1000,ico:"🌟",n:"Тысячник",d:"1 000+ XP"},
            {c:gs.totalXp>=5000,ico:"💫",n:"5 тысяч",d:"5 000+ XP"},
            {c:gs.totalXp>=20000,ico:"🔮",n:"20 тысяч",d:"20 000+ XP"},
            {c:gs.combo>=3,ico:"🔥",n:"На волне",d:"Комбо 3+ дня"},
            {c:gs.combo>=7,ico:"💎",n:"Неделя силы",d:"Комбо 7 дней → Берсерк"},
            {c:gs.combo>=14,ico:"🌑",n:"Две недели",d:"Комбо 14 дней → Теневой"},
            {c:gs.combo>=21,ico:"🌊",n:"Океан Воли",d:"Комбо 21 день"},
            {c:lvi.level>=5,ico:"⚔️",n:"Ученик",d:"Уровень 5"},
            {c:lvi.level>=10,ico:"🗡",n:"Паладин",d:"Уровень 10"},
            {c:lvi.level>=20,ico:"⚜️",n:"Герой",d:"Уровень 20"},
            {c:gs.stats.STR>=10,ico:"💪",n:"Железо",d:"Сила 10+"},
            {c:gs.stats.INT>=10,ico:"🧠",n:"Умник",d:"Интеллект 10+"},
            {c:gs.stats.WIS>=10,ico:"📚",n:"Мудрец",d:"Мудрость 10+"},
            {c:gs.stats.LNG>=12,ico:"🌍",n:"Полиглот",d:"Языки 12+ → класс"},
            {c:gs.gold>=200,ico:"💰",n:"Богач",d:"200+ Gold"},
            {c:(gs.habits||[]).some(h=>h.streak>=7),ico:"🛡",n:"Железная воля",d:"7 дней без срыва"},
            {c:(gs.habits||[]).some(h=>h.streak>=30),ico:"🗿",n:"Несгибаемый",d:"30 дней без срыва"},
          ].map(a=>(
            <div key={a.n} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 0",borderBottom:"1px solid #1a2030",opacity:a.c?1:0.3}}>
              <span style={{fontSize:18}}>{a.ico}</span>
              <div style={{flex:1}}>
                <div style={{fontSize:12,fontWeight:600,color:a.c?"#e2e8f0":"#64748b"}}>{a.n}</div>
                <div style={{fontSize:11,color:"#475569"}}>{a.d}</div>
              </div>
              {a.c&&<span style={{color:"#22c55e",fontWeight:800,fontSize:12}}>✓</span>}
            </div>
          ))}
        </div>
      </div>}

      {/* ══ LOG ══ */}
      {tab==="log"&&<div style={S.body}>
        {gs.log.length===0?<div style={{textAlign:"center",color:"#475569",paddingTop:60}}>
          <div style={{fontSize:50,marginBottom:12}}>📜</div><div style={{fontFamily:"Georgia",fontSize:15}}>Журнал пуст</div>
        </div>:gs.log.map(e=>(
          <div key={e.id} style={{background:"#0e1320",border:`1px solid ${e.t==="fail"?"#450a0a":e.t==="boss"?"#1e1040":e.t==="rest"?"#0c1a2e":e.t==="shop"?"#1a0e0e":"#1e293b"}`,borderRadius:10,padding:"9px 13px",marginBottom:7,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{fontSize:13,color:e.t==="fail"?"#f87171":e.t==="boss"?"#c4b5fd":e.t==="rest"?"#60a5fa":"#e2e8f0",fontWeight:500}}>{e.txt}</div>
              <div style={{fontSize:11,color:"#334155",marginTop:1}}>{e.time}</div>
            </div>
            <div style={{textAlign:"right"}}>
              {e.xp!==0&&<div style={{fontWeight:800,fontSize:13,color:e.xp>0?"#fbbf24":"#ef4444",fontFamily:"Georgia"}}>{e.xp>0?"+":""}{e.xp} XP</div>}
              {e.gold!==0&&<div style={{fontSize:11,color:e.gold>0?"#4ade80":"#f87171"}}>{e.gold>0?"+":""}{e.gold}G</div>}
            </div>
          </div>
        ))}
      </div>}
    </div>
  );
}

/* ─── Sub-components ─────────────────────────────────────────────────────── */
function Bar({label,right,pct,color,h,glo}) {
  return <div style={{marginBottom:9}}>
    <div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:3}}>
      <span style={{fontWeight:700,color:"#94a3b8"}}>{label}</span>
      <span style={{color:"#64748b"}}>{right}</span>
    </div>
    <div style={{height:h,background:"#0f172a",borderRadius:h/2,overflow:"hidden"}}>
      <div style={{height:"100%",width:`${pct}%`,background:color,borderRadius:h/2,transition:"width .6s",boxShadow:`0 0 8px ${glo}80`}}/>
    </div>
  </div>;
}

function WeekChart({data}) {
  const max=Math.max(...data,1);
  const days=["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];
  return <div style={{display:"flex",alignItems:"flex-end",gap:5,height:90,marginTop:6}}>
    {data.map((v,i)=>(
      <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
        <div style={{fontSize:9,color:"#64748b",height:14,display:"flex",alignItems:"flex-end"}}>{v>0?v:""}</div>
        <div style={{width:"100%",background:v>0?"#7c3aed":"#1e293b",borderRadius:"4px 4px 0 0",height:`${Math.max(4,(v/max)*60)}px`,transition:"height .5s",boxShadow:v>0?"0 0 6px #7c3aed60":""}}/>
        <div style={{fontSize:9,color:"#475569"}}>{days[i]}</div>
      </div>
    ))}
  </div>;
}

function declDay(n) {
  const m=n%100; if(m>=11&&m<=19) return"дней";
  const r=n%10; if(r===1) return"день"; if(r>=2&&r<=4) return"дня"; return"дней";
}

/* ─── Styles ─────────────────────────────────────────────────────────────── */
const S = {
  root:   {background:"#060911",minHeight:"100vh",color:"#e2e8f0",fontFamily:"'Segoe UI',system-ui,sans-serif",maxWidth:520,margin:"0 auto",position:"relative"},
  center: {background:"#060911",height:"100vh",display:"flex",alignItems:"center",justifyContent:"center"},
  overlay:{position:"fixed",inset:0,background:"rgba(0,0,0,.88)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:16},
  toast:  {position:"fixed",top:14,left:"50%",transform:"translateX(-50%)",zIndex:150,border:"1px solid",padding:"9px 20px",borderRadius:14,color:"#fff",fontWeight:700,fontSize:13,whiteSpace:"nowrap",boxShadow:"0 8px 32px rgba(0,0,0,.7)"},
  header: {background:"linear-gradient(160deg,#060e1a 0%,#0d0a20 100%)",padding:"16px 14px 12px",borderBottom:"1px solid #1a2030"},
  tabs:   {display:"flex",background:"#08090f",borderBottom:"1px solid #1a2030"},
  tab:    {flex:1,padding:"10px 0",background:"none",border:"none",borderBottom:"2px solid transparent",cursor:"pointer",fontSize:11,transition:"all .2s"},
  body:   {padding:"14px 13px 50px"},
  card:   {background:"#0e1320",border:"1px solid #1a2030",borderRadius:14,padding:14,marginBottom:12},
  cT:     {fontWeight:800,color:"#fbbf24",marginBottom:12,fontSize:11,letterSpacing:"1px",textTransform:"uppercase"},
  badge:  {borderRadius:8,padding:"4px 9px",fontSize:12,fontWeight:700},
  nameIn: {background:"#0f1829",border:"1px solid #3b82f6",borderRadius:8,color:"#fff",padding:"4px 10px",fontSize:15,width:130},
  bGreen: {background:"#14532d",border:"1px solid #22c55e",borderRadius:8,color:"#4ade80",padding:"4px 10px",cursor:"pointer",fontWeight:700,fontSize:13},
  bGray:  {background:"#1e293b",border:"1px solid #334155",borderRadius:8,color:"#94a3b8",padding:"4px 10px",cursor:"pointer",fontSize:13},
  bWin:   {background:"#052e16",border:"1px solid #22c55e",borderRadius:9,color:"#4ade80",padding:"7px 14px",cursor:"pointer",fontSize:13,fontWeight:700},
  bFail:  {background:"#450a0a",border:"1px solid #ef4444",borderRadius:9,color:"#f87171",padding:"7px 14px",cursor:"pointer",fontSize:13,fontWeight:700},
  inp:    {width:"100%",background:"#0f1829",border:"1px solid #1e3a5f",borderRadius:8,color:"#e2e8f0",padding:"9px 11px",fontSize:13,outline:"none"},
  sel:    {width:"100%",background:"#0f1829",border:"1px solid #1e3a5f",borderRadius:8,color:"#e2e8f0",padding:"8px 10px",fontSize:13,outline:"none"},
};
const CSS=`
  @keyframes popIn{from{transform:scale(.5);opacity:0}to{transform:scale(1);opacity:1}}
  *{box-sizing:border-box}
  ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-track{background:#060911}::-webkit-scrollbar-thumb{background:#1e293b;border-radius:2px}
  select option{background:#0f1829}
`;
