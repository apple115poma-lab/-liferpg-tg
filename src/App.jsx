import { useState, useEffect, useRef } from "react";

const DATA_VERSION = 8;

/* ─── XP ─────────────────────────────────────────────────────────────────── */
const XP_FOR = (l) => {
  if (l <= 5)  return Math.floor(300  * Math.pow(1.35, l-1));
  if (l <= 10) return Math.floor(1100 * Math.pow(1.28, l-6));
  if (l <= 20) return Math.floor(4000 * Math.pow(1.22, l-11));
  return Math.floor(25000 * Math.pow(1.18, l-21));
};
const getLvl  = (xp) => { let l=1,r=xp; while(r>=XP_FOR(l)){r-=XP_FOR(l);l++;} return {level:l,xpIn:r,xpTo:XP_FOR(l)}; };
const cumulXP = (l) => { let t=0; for(let i=1;i<l;i++) t+=XP_FOR(i); return t; };
const MAX_XP_MULT = 2.5; // XP cap multiplier

/* ─── Level Names ─────────────────────────────────────────────────────────── */
const LVL_NAMES = [
  "🌱 Новобранец","🗡 Послушник","⚔️ Воин тени","🛡 Страж врат","🏹 Охотник",
  "🔱 Хранитель","💀 Теневой клинок","🌑 Ночной страж","🌟 Рыцарь бездны","⚡ Паладин крови",
  "🔮 Тёмный маг","👁 Видящий","🦅 Вестник судьбы","🏆 Владыка арены","👑 Лорд теней",
  "🌊 Покоритель бездны","🔥 Берсерк-лорд","💎 Архимаг тьмы","🌌 Повелитель хаоса","⚜️ Легендарный герой",
  "🗺 Первопроходец вечности","🌠 Небесный владыка","🔱 Страж времени","👁 Провидец судеб","🌟 Бессмертный",
  "🌑 Тёмный властелин","🌌 Небожитель","⚡ Полубог","🔮 Верховный архимаг","👑 ЛЕГЕНДА",
];
const getLvlName = (l) => LVL_NAMES[Math.min(l-1,LVL_NAMES.length-1)];

/* ─── Fantasy Names ───────────────────────────────────────────────────────── */
const FANTASY_NAMES = [
  "Берсерк","Страж","Гладиатор","Рыцарь","Мудрец",
  "Алхимик","Ассасин","Монах","Пророк","Инквизитор",
  "Хранитель","Странник","Маг","Гоблин","Герой",
];

/* ─── Stats ───────────────────────────────────────────────────────────────── */
const STATS = {
  telo:    { name:"Тело",    icon:"💪", color:"#e05555", desc:"Физическое развитие. Качается за тренировки, активность, питание, режим." },
  razum:   { name:"Разум",   icon:"🧠", color:"#5588e0", desc:"Знания и аналитика. Качается за учёбу, чтение, языки, программирование." },
  vliyanie:{ name:"Влияние", icon:"🗣", color:"#9955e0", desc:"Публичность и коммуникация. Качается за посты, нетворкинг, выступления." },
  volya:   { name:"Воля",    icon:"🔥", color:"#e07730", desc:"Ментальная сила. Качается за медитацию, холодный душ, дневник." },
  delo:    { name:"Дело",    icon:"💼", color:"#44bb66", desc:"Реальные результаты. Качается за проекты, фриланс, портфолио, финансы." },
};

/* ─── Classes ─────────────────────────────────────────────────────────────── */
const CLASSES = [
  { id:"ocean",     name:"🌊 Океан Воли",    color:"#38bdf8",
    motivation:"Ты стал Океаном Воли — редчайший класс. Твоя воля больше не требует усилий — она стала твоей природой. Дисциплина — это не борьба, это просто то, кем ты являешься.",
    bonus:"+35% XP, комбо нельзя сбросить", check:(_s,c)=>c>=21 },
  { id:"shadow",    name:"🌑 Теневой",        color:"#a78bfa",
    motivation:"Ты Теневой — человек, сделавший дисциплину невидимой частью жизни. Пока другие борются с собой, ты просто делаешь. Тень не устаёт. Тень движется вперёд в любой темноте.",
    bonus:"+30% XP", check:(_s,c)=>c>=14 },
  { id:"champion",  name:"🏆 Чемпион",        color:"#fbbf24",
    motivation:"Ты Чемпион — человек без слабых сторон. Пока большинство качает одно и игнорирует остальное, ты строил себя равномерно. Это редкость. Это настоящая сила.",
    bonus:"+10% XP, +5G за квест", check:(s)=>Object.values(s).every(v=>v>=15) },
  { id:"berserker", name:"🔥 Берсерк",        color:"#f97316",
    motivation:"Ты Берсерк — в потоке ты неудержим. Каждый день ты разжигаешь огонь и не даёшь ему погаснуть. Чем дольше серия — тем сильнее ты становишься.",
    bonus:"+20% XP", check:(_s,c)=>c>=7 },
  { id:"monkWarrior",name:"⚡ Монах-Воин",   color:"#fb923c",
    motivation:"Ты Монах-Воин — редчайшее сочетание железного тела и несгибаемого духа. Физическая мощь без воли — зверь. Воля без тела — призрак. Ты — и то, и другое.",
    bonus:"+20% Тело и Воля", check:(s)=>s.telo>=10&&s.volya>=10&&s.telo>s.razum+3 },
  { id:"scholar",   name:"🧠 Мыслитель",      color:"#60a5fa",
    motivation:"Ты Мыслитель — строишь своё будущее через знание. Пока другие действуют импульсивно, ты анализируешь и растёшь системно. Каждый час учёбы — кирпич в фундаменте, который другие никогда не заложат.",
    bonus:"+20% Разум", check:(s)=>s.razum>s.telo+3&&s.razum>s.volya+2 },
  { id:"leader",    name:"👑 Лидер",           color:"#fbbf24",
    motivation:"Ты Лидер — твои слова и действия влияют на других. Мир меняют не самые умные и не самые сильные, а те за кем идут. Ты строишь это влияние день за днём.",
    bonus:"+20% Влияние", check:(s)=>s.vliyanie>s.telo+3&&s.vliyanie>s.razum+2 },
  { id:"monk",      name:"🗿 Монах",            color:"#94a3b8",
    motivation:"Ты Монах — там где другие сдаются, ты продолжаешь. Каждый отказ от соблазна, каждая медитация делает тебя тем, кем 99% людей никогда не станут.",
    bonus:"+20% Воля", check:(s)=>s.volya>s.telo+2&&s.volya>s.razum+2 },
  { id:"builder",   name:"⚒️ Строитель",       color:"#4ade80",
    motivation:"Ты Строитель — превращаешь идеи в реальные результаты. Пока другие мечтают, ты делаешь. Каждый завершённый проект — доказательство что слова ничто без действия.",
    bonus:"+20% Дело", check:(s)=>s.delo>s.telo+2&&s.delo>s.razum+2 },
  { id:"archmage",  name:"🔮 Архимаг",         color:"#c084fc",
    motivation:"Ты Архимаг — соединение интеллекта и воли. Знание без воли — бесплодная мудрость. Воля без знания — слепая сила. Ты объединил их. Это комбинация, меняющая жизни.",
    bonus:"+15% Разум и Воля", check:(s)=>s.razum>=8&&s.volya>=8&&s.razum>s.telo+2 },
  { id:"influencer",name:"🌟 Инфлюенсер",     color:"#f472b6",
    motivation:"Ты Инфлюенсер — умный человек, умеющий доносить идеи до людей. Одна из самых ценных комбинаций в современном мире. Ты не просто знаешь — ты умеешь передавать знание так, чтобы другие хотели слушать.",
    bonus:"+15% Разум и Влияние", check:(s)=>s.razum>=8&&s.vliyanie>=8&&s.razum>s.telo+2 },
  { id:"elite",     name:"💎 Элита",           color:"#ffd700",
    motivation:"Ты Элита — гармоничная личность без слабых сторон. В мире специализации ты выбрал путь мастера во всём. Это не случайность — это результат осознанных решений каждый день.",
    bonus:"+5% всё, иммунитет к 1 провалу", check:(s)=>{ const v=Object.values(s),a=v.reduce((x,y)=>x+y)/v.length; return v.every(x=>Math.abs(x-a)<4)&&a>6; } },
  { id:"seeker",    name:"🌱 Искатель",        color:"#94a3b8",
    motivation:"Ты Искатель — твой путь только начинается. Каждый великий воин когда-то был новобранцем. Вопрос не в том где ты сейчас — а в том куда ты идёшь. Иди своим путём.",
    bonus:"Иди своим путём", check:()=>true },
];
const getClass = (s,c) => CLASSES.find(cl=>cl.check(s,c));

/* ─── Spheres ─────────────────────────────────────────────────────────────── */
const SPHERES = [
  { id:"gym",      stat:"telo",     name:"Тренажёрный зал",    icon:"🏋️", quests:[{title:"Тренировка",desc:"Полноценная тренировка",xp:80},{title:"Активность",desc:"7 000+ шагов",xp:30}]},
  { id:"run",      stat:"telo",     name:"Бег / кардио",        icon:"🏃", quests:[{title:"Пробежка",desc:"Бег 20+ минут",xp:60},{title:"Активность",desc:"7 000+ шагов",xp:30}]},
  { id:"martial",  stat:"telo",     name:"Боевые искусства",    icon:"🥋", quests:[{title:"Тренировка",desc:"Занятие боевыми искусствами",xp:80},{title:"Разминка",desc:"Растяжка 15+ мин",xp:25}]},
  { id:"diet",     stat:"telo",     name:"Питание",             icon:"🥗", quests:[{title:"Чистое питание",desc:"День без вредной еды",xp:40},{title:"Вода",desc:"2+ литра воды",xp:20}]},
  { id:"sleep",    stat:"telo",     name:"Режим сна",           icon:"😴", quests:[{title:"Ранний подъём",desc:"Встать до 8:00",xp:40},{title:"Режим",desc:"Лечь до 23:00",xp:30}]},
  { id:"study",    stat:"razum",    name:"Учёба",               icon:"📖", quests:[{title:"Учебная сессия",desc:"45+ мин обучения",xp:60},{title:"Повторение",desc:"Повторить материал",xp:30}]},
  { id:"code",     stat:"razum",    name:"Программирование",    icon:"💻", quests:[{title:"Код",desc:"1+ час программирования",xp:70},{title:"Обучение",desc:"Изучить новую концепцию",xp:40}]},
  { id:"reading",  stat:"razum",    name:"Чтение книг",         icon:"📚", quests:[{title:"Чтение",desc:"Читать книгу 30+ мин",xp:50}]},
  { id:"lang",     stat:"razum",    name:"Иностранный язык",    icon:"🌍", quests:[{title:"Язык",desc:"Практика 20+ мин",xp:50},{title:"Словарь",desc:"10+ новых слов",xp:25}]},
  { id:"courses",  stat:"razum",    name:"Онлайн-курсы",        icon:"🎓", quests:[{title:"Урок",desc:"Пройти урок курса",xp:55}]},
  { id:"social",   stat:"vliyanie", name:"Ведение соцсетей",    icon:"📱", quests:[{title:"Пост",desc:"Опубликовать контент",xp:50},{title:"Создание",desc:"Создать материал",xp:40}]},
  { id:"video",    stat:"vliyanie", name:"TikTok / YouTube",    icon:"🎬", quests:[{title:"Видео",desc:"Снять и смонтировать",xp:70},{title:"Идея",desc:"Записать идеи",xp:25}]},
  { id:"speaking", stat:"vliyanie", name:"Публичные выступления",icon:"🎤", quests:[{title:"Практика речи",desc:"10+ мин практики",xp:50}]},
  { id:"network",  stat:"vliyanie", name:"Нетворкинг",          icon:"🤝", quests:[{title:"Знакомство",desc:"Новый контакт",xp:60}]},
  { id:"meditate", stat:"volya",    name:"Медитация",           icon:"🧘", quests:[{title:"Медитация",desc:"10+ мин",xp:45}]},
  { id:"journal",  stat:"volya",    name:"Дневник",             icon:"📔", quests:[{title:"Дневник",desc:"Запись мыслей",xp:35}]},
  { id:"shower",   stat:"volya",    name:"Холодный душ",        icon:"🚿", quests:[{title:"Холодный душ",desc:"Завершить холодной водой",xp:40}]},
  { id:"freelance",stat:"delo",     name:"Фриланс",             icon:"💸", quests:[{title:"Работа",desc:"2+ часа работы",xp:70}]},
  { id:"project",  stat:"delo",     name:"Свой проект",         icon:"🚀", quests:[{title:"Проект",desc:"1+ час работы",xp:65}]},
  { id:"portfolio",stat:"delo",     name:"Портфолио",           icon:"🗂", quests:[{title:"Портфолио",desc:"Улучшить / дополнить",xp:55}]},
  { id:"finance",  stat:"delo",     name:"Финансы",             icon:"💰", quests:[{title:"Бюджет",desc:"Записать доходы/расходы",xp:35}]},
];
const SPHERE_CATS = [
  { id:"telo",     name:"💪 Тело",    color:"#e05555" },
  { id:"razum",    name:"🧠 Разум",   color:"#5588e0" },
  { id:"vliyanie", name:"🗣 Влияние", color:"#9955e0" },
  { id:"volya",    name:"🔥 Воля",    color:"#e07730" },
  { id:"delo",     name:"💼 Дело",    color:"#44bb66" },
];

const DEFAULT_HABITS = [
  { id:"h-void",  name:"Воздержание",              icon:"🛡" },
  { id:"h-smoke", name:"Не курить",                icon:"🚭" },
  { id:"h-alco",  name:"Не употреблять алкоголь",  icon:"🍷" },
  { id:"h-phone", name:"Не листать соцсети с утра",icon:"📵" },
  { id:"h-food",  name:"Не есть фастфуд / вредную еду",icon:"🍔" },
];

const MINI_BOSSES = [
  { id:"mb1",name:"💀 Демон Лени",         condition:"Выполни 5 квестов",         req:{type:"any",count:5},      xp:250,gold:40,stat:"telo",  pen:20 },
  { id:"mb2",name:"🔥 Страж Боли",         condition:"Все квесты Тела",           req:{type:"stat",stat:"telo"}, xp:200,gold:35,stat:"telo",  pen:20 },
  { id:"mb3",name:"🧊 Лорд Прокрастинации",condition:"Все квесты Разума",         req:{type:"stat",stat:"razum"},xp:180,gold:30,stat:"razum", pen:20 },
  { id:"mb4",name:"👁 Тень Забвения",        condition:"Выполни все дейли",         req:{type:"all"},              xp:400,gold:70,stat:"volya", pen:40 },
  { id:"mb5",name:"🌑 Король Срывов",        condition:"Все квесты Воли",           req:{type:"stat",stat:"volya"},xp:150,gold:25,stat:"volya", pen:20 },
  { id:"mb6",name:"🐉 Дракон Слабости",      condition:"Выполни 3+ квеста",         req:{type:"any",count:3},      xp:200,gold:35,stat:"razum", pen:25 },
];
const shouldSpawnBoss = () => Math.random() < 0.43;
const randomBoss = () => MINI_BOSSES[Math.floor(Math.random()*MINI_BOSSES.length)];

/* ─── Boss Quest Templates ────────────────────────────────────────────────── */
const BOSS_TEMPLATES = {
  telo: [
    {title:"5 тренировок за неделю",    stat:"telo"},
    {title:"Не пропустить ни одной тренировки", stat:"telo"},
    {title:"Пробежать 30+ км за неделю", stat:"telo"},
    {title:"7 дней правильного питания", stat:"telo"},
  ],
  razum: [
    {title:"Завершить тему / главу в учёбе", stat:"razum"},
    {title:"Прочитать книгу целиком",        stat:"razum"},
    {title:"10 часов обучения за неделю",    stat:"razum"},
    {title:"Завершить модуль курса",         stat:"razum"},
  ],
  volya: [
    {title:"7 дней медитации без пропуска",  stat:"volya"},
    {title:"7 дней холодного душа",          stat:"volya"},
    {title:"Неделя без соцсетей до полудня", stat:"volya"},
  ],
  vliyanie: [
    {title:"Опубликовать 5 постов за неделю",stat:"vliyanie"},
    {title:"Снять и выложить 3 видео",       stat:"vliyanie"},
    {title:"Познакомиться с 3 новыми людьми",stat:"vliyanie"},
  ],
  delo: [
    {title:"Завершить ключевую задачу проекта",stat:"delo"},
    {title:"Найти первого клиента",            stat:"delo"},
    {title:"Обновить портфолио",               stat:"delo"},
  ],
};

const BOSS_PENALTIES = [
  {hp:15,label:"Мягкий",   color:"#4ade80"},
  {hp:30,label:"Стандартный",color:"#fbbf24"},
  {hp:50,label:"Жёсткий",  color:"#f87171"},
];

const SPRINT_DURATIONS = [
  {days:14,label:"2 недели"},{days:21,label:"3 недели"},
  {days:30,label:"1 месяц"},{days:45,label:"1.5 мес."},{days:60,label:"2 месяца"},
];
const SPRINT_PENALTIES = [
  {hp:15,label:"Мягкий",color:"#4ade80"},
  {hp:25,label:"Стандартный",color:"#fbbf24"},
  {hp:40,label:"Жёсткий",color:"#f87171"},
];
const OVERPERF = [
  {id:"exact",label:"✓ По цели",      mult:1.0,color:"#4ade80"},
  {id:"over", label:"🚀 Сделал больше",mult:1.5,color:"#fbbf24"},
  {id:"crush",label:"💥 Превзошёл себя",mult:2.0,color:"#f97316"},
];
const HABIT_MS = [
  {days:3,gold:30,hp:0,xp:0,icon:"🥉"},{days:7,gold:50,hp:10,xp:100,icon:"🥈"},
  {days:14,gold:100,hp:0,xp:200,icon:"🥇"},{days:30,gold:200,hp:15,xp:400,icon:"💎"},
  {days:60,gold:350,hp:0,xp:700,icon:"👑"},{days:90,gold:600,hp:25,xp:1000,icon:"🌟"},
];

// Shop items - renamed to "Магазин разрешений"
const DEF_SHOP = [
  {id:"r1",name:"Читмил",         cost:60, icon:"🍕"},
  {id:"r2",name:"Вечер сериала",  cost:50, icon:"📺"},
  {id:"r3",name:"Игровой вечер",  cost:70, icon:"🎮"},
  {id:"r4",name:"Час скроллинга", cost:35, icon:"📱"},
  {id:"r5",name:"Новая книга",    cost:70, icon:"📘"},
  {id:"r6",name:"Давно желанная покупка",cost:150,icon:"🎁"},
];

const today  = () => new Date().toDateString();
const weekN  = () => { const d=new Date(),s=new Date(d.getFullYear(),0,1); return Math.ceil(((d-s)/864e5+s.getDay()+1)/7); };
const nowStr = () => new Date().toLocaleTimeString("ru",{hour:"2-digit",minute:"2-digit"});
const declDay= (n) => { const m=n%100; if(m>=11&&m<=19)return"дней"; const r=n%10; if(r===1)return"день"; if(r>=2&&r<=4)return"дня"; return"дней"; };
const daysLeft=(end) => Math.max(0,Math.ceil((new Date(end)-new Date())/864e5));
const daysSince=(d) => Math.floor((new Date()-new Date(d))/864e5);

/* ─── CloudStorage ────────────────────────────────────────────────────────── */
const SAVE_KEYS = ["rpg8-char","rpg8-state","rpg8-quests","rpg8-habits","rpg8-shop","rpg8-sprint"];
const CS = {
  async get(k){return new Promise(r=>{const tg=window.Telegram?.WebApp;if(tg?.CloudStorage)tg.CloudStorage.getItem(k,(e,v)=>{if(e||!v)r(localStorage.getItem(k));else{localStorage.setItem(k,v);r(v);}});else r(localStorage.getItem(k));});},
  async set(k,v){localStorage.setItem(k,v);return new Promise(r=>{const tg=window.Telegram?.WebApp;if(tg?.CloudStorage)tg.CloudStorage.setItem(k,v,()=>r());else r();});},
  async del(k){localStorage.removeItem(k);return new Promise(r=>{const tg=window.Telegram?.WebApp;if(tg?.CloudStorage)tg.CloudStorage.removeItem(k,()=>r());else r();});}
};

const saveState = async(gs)=>{
  const char={version:DATA_VERSION,name:gs.name,totalXp:gs.totalXp,gold:gs.gold,hp:gs.hp,combo:gs.combo,stats:gs.stats,lastDay:gs.lastDay,lastDayXp:gs.lastDayXp,restWeek:gs.restWeek,weekStart:gs.weekStart,weekXP:gs.weekXP,deathCount:gs.deathCount,goal:gs.goal,selectedSpheres:gs.selectedSpheres,prevClassId:gs.prevClassId,createdAt:gs.createdAt,statLastUpdate:gs.statLastUpdate||{}};
  const state={daily:gs.daily,miniBoss:gs.miniBoss,bossQuests:gs.bossQuests,customBossQuests:gs.customBossQuests||[],nextDouble:gs.nextDouble,immunityUsed:gs.immunityUsed};
  await Promise.all([
    CS.set("rpg8-char",  JSON.stringify(char)),
    CS.set("rpg8-state", JSON.stringify(state)),
    CS.set("rpg8-quests",JSON.stringify({customDaily:gs.customDaily||[],customOnce:gs.customOnce||[],questEdits:gs.questEdits||{}})),
    CS.set("rpg8-habits",JSON.stringify(gs.habits||[])),
    CS.set("rpg8-shop",  JSON.stringify({shop:gs.shop,purchases:(gs.purchases||[]).slice(0,20)})),
    CS.set("rpg8-sprint",JSON.stringify({sprints:gs.sprints||[],log:(gs.log||[]).slice(0,60),weeklyReports:gs.weeklyReports||[]})),
  ]);
};

const loadState = async()=>{
  const [cS,sS,qS,hS,shS,spS]=await Promise.all(SAVE_KEYS.map(k=>CS.get(k)));
  // try old versions
  if(!cS){
    for(const k of["rpg7-char","rpg-char","liferpg-v5"]){
      const old=localStorage.getItem(k);
      if(old) return migrate(JSON.parse(old));
    }
    return null;
  }
  const char=JSON.parse(cS), state=JSON.parse(sS||"{}"), quests=JSON.parse(qS||"{}");
  const habits=JSON.parse(hS||"[]"), shopD=JSON.parse(shS||"{}"), spD=JSON.parse(spS||"{}");
  return migrate({...char,...state,...quests,habits,shop:shopD.shop||[...DEF_SHOP],purchases:shopD.purchases||[],sprints:spD.sprints||[],log:spD.log||[],weeklyReports:spD.weeklyReports||[]});
};

const migrate=(s)=>{
  if(!s.stats||!s.stats.telo) s.stats={telo:s.stats?.STR||1,razum:s.stats?.INT||1,vliyanie:s.stats?.LNG||1,volya:s.stats?.WIS||1,delo:s.stats?.VIT||1};
  const fields={habits:[],sprints:[],log:[],weeklyReports:[],shop:DEF_SHOP,purchases:[],customDaily:[],customOnce:[],questEdits:{},bossQuests:{},customBossQuests:[],weekXP:Array(7).fill(0),deathCount:0,goal:"",selectedSpheres:[],prevClassId:"",createdAt:today(),nextDouble:false,immunityUsed:false,statLastUpdate:{}};
  Object.keys(fields).forEach(k=>{if(s[k]===undefined)s[k]=fields[k];});
  if(!s.maxHp) s.maxHp=100;
  s.version=DATA_VERSION;
  return s;
};

const freshChar=(name,sphereIds,habitId,goal)=>{
  const sels=SPHERES.filter(s=>sphereIds.includes(s.id));
  const customDaily=sels.flatMap(sp=>sp.quests.map((q,i)=>({id:`init-${sp.id}-${i}`,title:q.title,desc:q.desc,xp:q.xp,stat:sp.stat,catId:sp.stat,icon:sp.icon})));
  const habitDef=DEFAULT_HABITS.find(h=>h.id===habitId);
  const habits=habitDef?[{...habitDef,streak:0,longest:0,lastCheck:"",claimedMs:[]}]:[];
  return migrate({name,totalXp:0,gold:100,hp:100,combo:0,stats:{telo:1,razum:1,vliyanie:1,volya:1,delo:1},daily:{},miniBoss:null,nextDouble:false,immunityUsed:false,bossQuests:{},customBossQuests:[],lastDay:today(),lastDayXp:0,restWeek:0,weekStart:String(weekN()),weekXP:Array(7).fill(0),deathCount:0,goal,selectedSpheres:sphereIds,customDaily,habits,shop:[...DEF_SHOP],purchases:[],sprints:[],log:[],weeklyReports:[],customOnce:[],questEdits:{},prevClassId:"seeker",createdAt:today(),version:DATA_VERSION});
};

/* ─── Weekly Report Generator ─────────────────────────────────────────────── */
const generateWeeklyReport=(gs,prevGs)=>{
  const totalQ=Object.keys(gs.daily||{}).filter(k=>k!=="REST").length;
  const totalXpEarned=(gs.weekXP||[]).reduce((a,b)=>a+b,0);
  const bestDay=Math.max(...(gs.weekXP||[0]));
  const statGrowth={};
  Object.keys(STATS).forEach(k=>{ statGrowth[k]=(gs.stats[k]||1)-(prevGs?.stats?.[k]||1); });
  return {
    week:weekN(),date:today(),totalQuests:totalQ,totalXp:totalXpEarned,
    bestDay,combo:gs.combo,statGrowth,weekXP:[...(gs.weekXP||[])],
    level:getLvl(gs.totalXp).level,gold:gs.gold,
  };
};

/* ─── Animated Counter ────────────────────────────────────────────────────── */
function AnimCounter({value,color,size=28,duration=1000}) {
  const [display,setDisplay]=useState(0);
  const start=useRef(0);
  const frame=useRef(null);
  useEffect(()=>{
    start.current=Date.now();
    const target=parseInt(value)||0;
    if(target===0){setDisplay(0);return;}
    const tick=()=>{
      const elapsed=Date.now()-start.current;
      const progress=Math.min(elapsed/duration,1);
      const ease=1-Math.pow(1-progress,3);
      setDisplay(Math.round(ease*target));
      if(progress<1) frame.current=requestAnimationFrame(tick);
    };
    frame.current=requestAnimationFrame(tick);
    return()=>{ if(frame.current) cancelAnimationFrame(frame.current); };
  },[value]);
  return <span style={{color:color||"#fff",fontFamily:"Rajdhani,sans-serif",fontWeight:900,fontSize:size}}>{display.toLocaleString()}</span>;
}

/* ─── Ring Chart ──────────────────────────────────────────────────────────── */
function RingChart({stat,value,max=50,size=70}) {
  const st=STATS[stat]; if(!st) return null;
  const safeVal=Math.max(0,parseInt(value)||0);
  const r=28,cx=size/2,cy=size/2,circ=2*Math.PI*r;
  const pct=Math.min(1,safeVal/max);
  const dash=pct*circ;
  return (
    <div style={{textAlign:"center",position:"relative",width:size,height:size}}>
      <svg width={size} height={size} style={{transform:"rotate(-90deg)"}}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1a0a2e" strokeWidth="6"/>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={st.color} strokeWidth="6"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{filter:`drop-shadow(0 0 4px ${st.color}80)`,transition:"stroke-dasharray 1s ease"}}/>
      </svg>
      <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
        <div style={{fontSize:10}}>{st.icon}</div>
        <div style={{fontSize:13,fontWeight:900,color:st.color,fontFamily:"Rajdhani,sans-serif",lineHeight:1}}>{safeVal}</div>
      </div>
    </div>
  );
}

/* ─── Radar Chart ─────────────────────────────────────────────────────────── */
function RadarChart({stats,size=180}) {
  const cx=size/2,cy=size/2,r=size*0.36;
  const keys=Object.keys(STATS),n=keys.length;
  const angle=(i)=>(Math.PI*2/n)*i-Math.PI/2;
  const pt=(i,val)=>{const a=angle(i),ratio=Math.min(1,val/50)*0.88+0.08;return[cx+Math.cos(a)*r*ratio,cy+Math.sin(a)*r*ratio];};
  const gridPts=(ratio)=>keys.map((_,i)=>{const a=angle(i);return[cx+Math.cos(a)*r*ratio,cy+Math.sin(a)*r*ratio];});
  const vals=keys.map(k=>stats[k]||1);
  const poly=vals.map((v,i)=>pt(i,v));
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{overflow:"visible"}}>
      {[0.25,0.5,0.75,1].map(ratio=>(
        <polygon key={ratio} points={gridPts(ratio).map(p=>p.join(",")).join(" ")} fill="none" stroke="#1a0a2e" strokeWidth={ratio===1?1.5:0.8} strokeDasharray={ratio<1?"4,4":""}/>
      ))}
      {keys.map((_,i)=>{const a=angle(i);return<line key={i} x1={cx} y1={cy} x2={cx+Math.cos(a)*r} y2={cy+Math.sin(a)*r} stroke="#1a0a2e" strokeWidth="1"/>;}) }
      <polygon points={poly.map(p=>p.join(",")).join(" ")} fill="#7c3aed18" stroke="#7c3aed" strokeWidth="2" style={{filter:"drop-shadow(0 0 8px #7c3aed60)"}}/>
      {poly.map((p,i)=><circle key={i} cx={p[0]} cy={p[1]} r={4} fill={Object.values(STATS)[i].color} style={{filter:`drop-shadow(0 0 5px ${Object.values(STATS)[i].color})`}}/>)}
      {keys.map((k,i)=>{const a=angle(i),lx=cx+Math.cos(a)*(r+20),ly=cy+Math.sin(a)*(r+20);const st=STATS[k];return<text key={k} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fontSize="11" fill={st.color} fontWeight="700">{st.icon}</text>;})}
    </svg>
  );
}

/* ─── XP Line Chart ───────────────────────────────────────────────────────── */
function LineChart({data,color="#7c3aed",height=80}) {
  const safeData=(data||[]).filter(v=>typeof v==="number"&&isFinite(v));
  if(safeData.length<2) return (
    <svg width="100%" viewBox="0 0 280 80" style={{overflow:"visible"}}>
      <text x="140" y="45" fill="#2a1f4a" textAnchor="middle" fontSize="11" fontFamily="Rajdhani,sans-serif">Данных пока нет</text>
    </svg>
  );
  const w=280,h=height,pad=10;
  const max=Math.max(...safeData,1);
  const pts=safeData.map((v,i)=>[pad+i*(w-2*pad)/(safeData.length-1),h-pad-(v/max)*(h-2*pad)]);
  const path=pts.map((p,i)=>`${i===0?"M":"L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area=`${path} L${pts[pts.length-1][0].toFixed(1)},${h} L${pts[0][0].toFixed(1)},${h} Z`;
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{overflow:"visible"}}>
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={area} fill="url(#lg)"/>
      <path d={path} fill="none" stroke={color} strokeWidth="2" style={{filter:`drop-shadow(0 0 4px ${color}80)`}}/>
      {pts.map((p,i)=><circle key={i} cx={p[0]} cy={p[1]} r={3} fill={color} style={{filter:`drop-shadow(0 0 4px ${color})`}}/>)}
    </svg>
  );
}

/* ─── Weekly Bar Chart ────────────────────────────────────────────────────── */
function BarChart({data}) {
  const max=Math.max(...data,1);
  const days=["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];
  return (
    <div style={{display:"flex",alignItems:"flex-end",gap:5,height:90,marginTop:6}}>
      {data.map((v,i)=>(
        <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
          <div style={{fontSize:9,color:"#2a1f4a",height:14,display:"flex",alignItems:"flex-end",fontFamily:"Rajdhani,sans-serif"}}>{v>0?v:""}</div>
          <div style={{width:"100%",background:v>0?"linear-gradient(180deg,#7c3aed,#5a3fa0)":"#1a0a2e",borderRadius:"3px 3px 0 0",height:`${Math.max(4,(v/max)*60)}px`,transition:"height .6s",boxShadow:v>0?"0 0 8px #7c3aed60":""}}/>
          <div style={{fontSize:9,color:"#2a1f4a",fontFamily:"Rajdhani,sans-serif"}}>{days[i]}</div>
        </div>
      ))}
    </div>
  );
}

/* ─── Diagnostics Panel ───────────────────────────────────────────────────── */
function DiagnosticsPanel({gs,lvi}) {
  const tod=today();
  const allDaily=gs.customDaily||[];
  const doneToday=allDaily.filter(q=>gs.daily[q.id]).length;
  const warnings=[];

  // Stat inactivity warnings
  Object.keys(STATS).forEach(k=>{
    const last=gs.statLastUpdate?.[k];
    if(!last) return;
    const days=Math.floor((new Date(tod)-new Date(last))/864e5);
    if(days>=5) warnings.push({level:"danger",stat:k,days,msg:`Стат ${STATS[k].name} не рос ${days} дней — риск деградации!`,icon:"🔴"});
    else if(days>=3) warnings.push({level:"warn",stat:k,days,msg:`Стат ${STATS[k].name} не тренировался ${days} дня — потеря темпа`,icon:"🟡"});
  });

  // HP warning
  if(gs.hp<30) warnings.push({level:"danger",stat:null,days:0,msg:`HP критически низкий (${gs.hp}) — выполни хотя бы один квест сегодня!`,icon:"❤️"});
  else if(gs.hp<50) warnings.push({level:"warn",stat:null,days:0,msg:`HP ниже 50 (${gs.hp}) — не пропускай дейли`,icon:"❤️"});

  // Combo at risk
  if(gs.combo>0&&doneToday===0&&allDaily.length>0) warnings.push({level:"warn",stat:null,days:0,msg:`Комбо ${gs.combo} дней под угрозой — выполни дейли сегодня!`,icon:"🔥"});

  // No quests configured
  if(allDaily.length===0) warnings.push({level:"info",stat:null,days:0,msg:"Нет активных дейли-квестов. Добавь сферы в Настройках.",icon:"ℹ️"});

  // Sprint deadline warning
  const activeSprints=(gs.sprints||[]).filter(s=>s.active&&!s.completed&&!s.failed);
  activeSprints.forEach(sp=>{
    const d=Math.max(0,Math.ceil((new Date(sp.endDate)-new Date())/864e5));
    if(d<=3&&d>0) warnings.push({level:"warn",stat:null,days:0,msg:`Спринт "${sp.name}" заканчивается через ${d} дн.`,icon:"🎯"});
    else if(d===0) warnings.push({level:"danger",stat:null,days:0,msg:`Спринт "${sp.name}" истёк! Отметь результат.`,icon:"⚠️"});
  });

  if(warnings.length===0) return (
    <div style={{background:"#071407",border:"1px solid #1a3a1a",borderRadius:12,padding:"11px 14px",marginBottom:12,display:"flex",alignItems:"center",gap:10}}>
      <span style={{fontSize:18}}>✅</span>
      <div style={{flex:1}}>
        <div style={{fontSize:11,fontWeight:700,color:"#4ade80",fontFamily:"Cinzel,serif"}}>Всё в порядке</div>
        <div style={{fontSize:10,color:"#2a5a2a",fontFamily:"Rajdhani,sans-serif"}}>Нет тревожных сигналов. Продолжай в том же духе.</div>
      </div>
    </div>
  );

  return (
    <div style={{marginBottom:12}}>
      {warnings.map((w,i)=>{
        const isDanger=w.level==="danger";
        const isInfo=w.level==="info";
        const bg=isDanger?"#1a0808":isInfo?"#07060d":"#1a1005";
        const border=isDanger?"#5a1a1a":isInfo?"#1a0a2e":"#4a3800";
        const color=isDanger?"#f87171":isInfo?"#5a3fa0":"#fbbf24";
        const statSt=w.stat?STATS[w.stat]:null;
        return (
          <div key={i} style={{background:bg,border:`1px solid ${statSt?statSt.color+"30":border}`,borderRadius:11,padding:"9px 13px",marginBottom:6,display:"flex",alignItems:"center",gap:10,animation:isDanger?"pulse .8s infinite":"none"}}>
            <span style={{fontSize:16,flexShrink:0}}>{w.icon}</span>
            <div style={{flex:1}}>
              <div style={{fontSize:11,fontWeight:700,color:statSt?statSt.color:color,fontFamily:"Rajdhani,sans-serif",lineHeight:1.4}}>{w.msg}</div>
              {w.stat&&statSt&&<div style={{fontSize:9,color:"#2a1f4a",marginTop:2,fontFamily:"Rajdhani,sans-serif"}}>Квесты категории {statSt.icon} {statSt.name} → вкладка Квесты</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Share Card ──────────────────────────────────────────────────────────── */
function ShareCard({gs,cls,lvi,onClose}) {
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.97)",zIndex:400,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{background:"linear-gradient(135deg,#0a0714,#1a0a2e,#0a0714)",border:"1px solid #5a3fa0",borderRadius:20,padding:24,width:"min(340px,90vw)",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:8,left:8,width:18,height:18,borderTop:"2px solid #d4a017",borderLeft:"2px solid #d4a017"}}/>
        <div style={{position:"absolute",top:8,right:8,width:18,height:18,borderTop:"2px solid #d4a017",borderRight:"2px solid #d4a017"}}/>
        <div style={{position:"absolute",bottom:8,left:8,width:18,height:18,borderBottom:"2px solid #d4a017",borderLeft:"2px solid #d4a017"}}/>
        <div style={{position:"absolute",bottom:8,right:8,width:18,height:18,borderBottom:"2px solid #d4a017",borderRight:"2px solid #d4a017"}}/>
        <div style={{textAlign:"center",marginBottom:14}}>
          <div style={{fontSize:10,color:"#5a3fa0",letterSpacing:3,marginBottom:4,fontFamily:"Cinzel,serif"}}>LIFE RPG</div>
          <div style={{fontSize:24,fontWeight:900,color:"#d4a017",fontFamily:"Cinzel,serif",textShadow:"0 0 20px #d4a01760"}}>{gs.name}</div>
          <div style={{fontSize:11,color:cls.color,marginTop:2,fontFamily:"Cinzel,serif"}}>{cls.name} • {getLvlName(lvi.level)}</div>
        </div>
        <div style={{display:"flex",justifyContent:"center",marginBottom:12}}>
          <RadarChart stats={gs.stats} size={140}/>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:5,marginBottom:12}}>
          {Object.entries(STATS).map(([k,st])=>(
            <div key={k} style={{textAlign:"center",background:"#0a0714",border:`1px solid ${st.color}30`,borderRadius:8,padding:"6px 2px"}}>
              <div style={{fontSize:13}}>{st.icon}</div>
              <div style={{fontSize:13,fontWeight:900,color:st.color,fontFamily:"Rajdhani,sans-serif"}}>{gs.stats[k]||1}</div>
            </div>
          ))}
        </div>
        <div style={{display:"flex",justifyContent:"space-around",background:"#0a0714",borderRadius:10,padding:"8px 0",border:"1px solid #2a1f4a"}}>
          {[["⚡","Ур.",lvi.level,"#d4a017"],["🔥","Комбо",gs.combo,"#f97316"],["❤️","HP",gs.hp,"#e05555"],["💰","Gold",gs.gold,"#d4a017"]].map(([i,l,v,c])=>(
            <div key={l} style={{textAlign:"center"}}>
              <div style={{fontSize:9,color:"#5a3fa0",fontFamily:"Cinzel,serif"}}>{i} {l}</div>
              <div style={{fontSize:17,fontWeight:900,color:c,fontFamily:"Rajdhani,sans-serif"}}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{textAlign:"center",marginTop:10,fontSize:8,color:"#2a1f4a",letterSpacing:2,fontFamily:"Cinzel,serif"}}>LIFE RPG • ТЁМНОЕ ФЭНТЕЗИ</div>
      </div>
      <div style={{marginTop:12,fontSize:12,color:"#5a3fa0",textAlign:"center"}}>Сделай скриншот ⚔️</div>
      <button onClick={onClose} style={{marginTop:10,...S.bGray,padding:"9px 22px"}}>Закрыть</button>
    </div>
  );
}

/* ─── Death Animation ─────────────────────────────────────────────────────── */
function DeathScreen({deathCount,gold,onRevive}) {
  const [phase,setPhase]=useState(0); // 0=dark 1=skull 2=text 3=button
  useEffect(()=>{
    const t1=setTimeout(()=>setPhase(1),300);
    const t2=setTimeout(()=>setPhase(2),1200);
    const t3=setTimeout(()=>setPhase(3),2200);
    return()=>{clearTimeout(t1);clearTimeout(t2);clearTimeout(t3);};
  },[]);
  return (
    <div style={{position:"fixed",inset:0,background:"#000",zIndex:500,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20}}>
      <style>{`
        @keyframes skullAppear{from{transform:scale(0) rotate(-20deg);opacity:0}to{transform:scale(1) rotate(0deg);opacity:1}}
        @keyframes textReveal{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes bloodDrip{0%{height:0;opacity:0}100%{height:60px;opacity:0.6}}
        @keyframes reviveGlow{0%,100%{box-shadow:0 0 10px #8b1a1a}50%{box-shadow:0 0 30px #e05555}}
      `}</style>
      {phase>=1&&<div style={{fontSize:90,animation:"skullAppear 0.8s cubic-bezier(0.34,1.56,0.64,1)",filter:"drop-shadow(0 0 40px #8b1a1a)",marginBottom:20}}>💀</div>}
      {phase>=2&&<div style={{textAlign:"center",animation:"textReveal 0.6s ease"}}>
        <div style={{fontSize:36,fontWeight:900,color:"#e05555",fontFamily:"Cinzel,serif",textShadow:"0 0 40px #e05555",marginBottom:8}}>ГЕРОЙ ПАЛ В БОЮ</div>
        <div style={{fontSize:13,color:"#5a3fa0",lineHeight:1.9,marginBottom:8}}>Бездействие опустило HP до нуля</div>
        <div style={{background:"#1a0808",border:"1px solid #3a0a0a",borderRadius:12,padding:14,marginBottom:20,display:"inline-block"}}>
          <div style={{fontSize:11,color:"#5a3fa0",marginBottom:4}}>Возрождение #{deathCount+1}</div>
          <div style={{fontSize:11,color:"#7c6a9a"}}>Уровень, XP и статы сброшены</div>
          <div style={{fontSize:14,fontWeight:700,color:"#d4a017",marginTop:4}}>💰 {Math.floor(gold*0.5)}G сохраняется</div>
        </div>
      </div>}
      {phase>=3&&<button onClick={onRevive} style={{background:"#1a0808",border:"2px solid #e05555",borderRadius:14,color:"#e05555",padding:"14px 36px",fontSize:16,fontWeight:700,cursor:"pointer",fontFamily:"Cinzel,serif",letterSpacing:1,animation:"reviveGlow 2s infinite"}}>⚔️ Возродиться</button>}
    </div>
  );
}

/* ─── Rebirth Animation ───────────────────────────────────────────────────── */
function RebirthScreen({name,onDone}) {
  const [phase,setPhase]=useState(0);
  useEffect(()=>{
    const t1=setTimeout(()=>setPhase(1),400);
    const t2=setTimeout(()=>setPhase(2),1200);
    const t3=setTimeout(()=>setPhase(3),2200);
    const t4=setTimeout(()=>onDone(),3500);
    return()=>{clearTimeout(t1);clearTimeout(t2);clearTimeout(t3);clearTimeout(t4);};
  },[]);
  return (
    <div style={{position:"fixed",inset:0,background:"#000",zIndex:500,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
      <style>{`
        @keyframes dawn{from{background:radial-gradient(ellipse at center,#1a0a2e 0%,#000 100%)}to{background:radial-gradient(ellipse at center,#2a1f4a 0%,#0a0714 100%)}}
        @keyframes rise{from{transform:translateY(40px);opacity:0}50%{opacity:1}to{transform:translateY(0);opacity:1}}
        @keyframes sparkle{0%,100%{opacity:0;transform:scale(0)}50%{opacity:1;transform:scale(1)}}
      `}</style>
      <div style={{position:"absolute",inset:0,background:phase>=2?"radial-gradient(ellipse at center,#2a1f4a 0%,#0a0714 100%)":"#000",transition:"background 1s ease"}}/>
      {phase>=1&&<div style={{fontSize:80,animation:"rise 0.8s ease",position:"relative",zIndex:1,filter:"drop-shadow(0 0 30px #7c3aed)"}}>⚡</div>}
      {phase>=2&&<div style={{textAlign:"center",animation:"rise 0.6s ease",position:"relative",zIndex:1,marginTop:16}}>
        <div style={{fontSize:32,fontWeight:900,color:"#d4a017",fontFamily:"Cinzel,serif",textShadow:"0 0 30px #d4a017"}}>ВОЗРОЖДЕНИЕ</div>
        <div style={{fontSize:16,color:"#7c6a9a",marginTop:8,fontFamily:"Cinzel,serif"}}>{name}</div>
      </div>}
      {phase>=3&&<div style={{fontSize:13,color:"#5a3fa0",marginTop:20,fontFamily:"Cinzel,serif",letterSpacing:2,animation:"rise 0.5s ease",position:"relative",zIndex:1}}>ПУТЬ НАЧИНАЕТСЯ ЗАНОВО</div>}
    </div>
  );
}

/* ─── Onboarding ──────────────────────────────────────────────────────────── */
function Onboarding({onFinish}) {
  const [step,setStep]=useState(0);
  const [name,setName]=useState("");
  const [customName,setCustomName]=useState("");
  const [useCustom,setUseCustom]=useState(false);
  const [selected,setSelected]=useState([]);
  const [habitId,setHabitId]=useState(null);
  const [goal,setGoal]=useState("");
  const toggleSphere=(id)=>{if(selected.includes(id))setSelected(s=>s.filter(x=>x!==id));else if(selected.length<3)setSelected(s=>[...s,id]);};
  const finalName=useCustom?customName.trim():name;
  return (
    <div style={{background:"#07060d",minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20,fontFamily:"'Segoe UI',system-ui,sans-serif",color:"#e2d5f0"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Rajdhani:wght@400;500;600;700&display=swap');*{box-sizing:border-box}input,select,textarea{outline:none}`}</style>
      {step===0&&<div style={{width:"100%",maxWidth:400,textAlign:"center"}}>
        <div style={{fontSize:64,marginBottom:12,filter:"drop-shadow(0 0 20px #7c3aed)"}}>⚔️</div>
        <div style={{fontSize:32,fontWeight:900,color:"#d4a017",fontFamily:"Cinzel,serif",marginBottom:4,textShadow:"0 0 30px #d4a01750"}}>LIFE RPG</div>
        <div style={{fontSize:11,color:"#5a3fa0",marginBottom:8,letterSpacing:3}}>СИСТЕМА УПРАВЛЕНИЯ РЕАЛЬНОСТЬЮ</div>
        <div style={{fontSize:12,color:"#7c6a9a",marginBottom:28,lineHeight:1.7}}>Твоя жизнь — это RPG. Каждое действие качает персонажа.<br/>XP — это твой рост. Gold — право на отдых.</div>
        <div style={{fontSize:11,color:"#5a3fa0",marginBottom:8,textAlign:"left",fontFamily:"Cinzel,serif",letterSpacing:1}}>ВЫБЕРИ ИМЯ ГЕРОЯ</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:12}}>
          {FANTASY_NAMES.map(n=>(
            <button key={n} onClick={()=>{setName(n);setUseCustom(false);}} style={{background:name===n&&!useCustom?"#1a0a2e":"#0a0714",border:`1px solid ${name===n&&!useCustom?"#7c3aed":"#1a0a2e"}`,borderRadius:8,padding:"6px 11px",cursor:"pointer",color:name===n&&!useCustom?"#c4b5fd":"#5a3fa0",fontSize:12,fontWeight:700,fontFamily:"Cinzel,serif",boxShadow:name===n&&!useCustom?"0 0 8px #7c3aed40":""}}>
              {n}
            </button>
          ))}
        </div>
        <div style={{fontSize:10,color:"#2a1f4a",marginBottom:6,textAlign:"center"}}>— или введи своё —</div>
        <input value={customName} onChange={e=>{setCustomName(e.target.value);setUseCustom(true);setName("");}} placeholder="Своё имя..." style={{width:"100%",background:"#0a0714",border:`1px solid ${useCustom&&customName?"#7c3aed":"#1a0a2e"}`,borderRadius:10,color:"#e2d5f0",padding:"11px 14px",fontSize:14,marginBottom:14,fontFamily:"Cinzel,serif"}}/>
        <button onClick={()=>finalName&&setStep(1)} disabled={!finalName} style={{width:"100%",background:finalName?"#1a0a2e":"#0a0714",border:`1px solid ${finalName?"#7c3aed":"#1a0a2e"}`,borderRadius:12,color:finalName?"#c4b5fd":"#2a1f4a",padding:"13px",fontSize:14,fontWeight:700,cursor:finalName?"pointer":"default",fontFamily:"Cinzel,serif",letterSpacing:1,boxShadow:finalName?"0 0 15px #7c3aed20":""}}>
          {finalName?`Продолжить, ${finalName} →`:"Выбери имя"}
        </button>
      </div>}
      {step===1&&<div style={{width:"100%",maxWidth:400}}>
        <div style={{textAlign:"center",marginBottom:18}}>
          <div style={{fontSize:10,color:"#5a3fa0",marginBottom:4,letterSpacing:2,fontFamily:"Cinzel,serif"}}>ШАГ 1 ИЗ 3</div>
          <div style={{fontSize:19,fontWeight:700,color:"#e2d5f0",fontFamily:"Cinzel,serif"}}>Выбери свой путь</div>
          <div style={{fontSize:11,color:"#5a3fa0",marginTop:5}}>До 3 сфер. Потом можно добавить больше.</div>
        </div>
        {SPHERE_CATS.map(cat=>{
          const sps=SPHERES.filter(s=>s.stat===cat.id);
          return <div key={cat.id} style={{marginBottom:12}}>
            <div style={{fontSize:10,fontWeight:800,color:cat.color,textTransform:"uppercase",letterSpacing:2,marginBottom:6,fontFamily:"Cinzel,serif"}}>{cat.name}</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
              {sps.map(sp=>{const isSel=selected.includes(sp.id),dis=!isSel&&selected.length>=3;return(
                <button key={sp.id} onClick={()=>!dis&&toggleSphere(sp.id)} style={{background:isSel?`${cat.color}18`:"#0a0714",border:`1px solid ${isSel?cat.color:"#1a0a2e"}`,borderRadius:9,padding:"6px 10px",cursor:dis?"not-allowed":"pointer",color:isSel?cat.color:"#5a3fa0",fontSize:11,fontWeight:isSel?700:400,opacity:dis?.35:1,boxShadow:isSel?`0 0 8px ${cat.color}30`:""}}>
                  {sp.icon} {sp.name}
                </button>);})}
            </div>
          </div>;
        })}
        {selected.length>0&&<div style={{background:"#0a0714",border:"1px solid #1a0a2e",borderRadius:11,padding:11,marginTop:6,marginBottom:12}}>
          <div style={{fontSize:10,color:"#5a3fa0",marginBottom:6,fontFamily:"Cinzel,serif",letterSpacing:1}}>КВЕСТЫ КАЖДЫЙ ДЕНЬ:</div>
          {SPHERES.filter(s=>selected.includes(s.id)).flatMap(sp=>sp.quests.map((q,i)=>(
            <div key={`${sp.id}-${i}`} style={{fontSize:11,color:"#7c6a9a",padding:"3px 0",borderBottom:"1px solid #1a0a2e"}}>{sp.icon} {q.title} — <span style={{color:"#d4a017"}}>+{q.xp}XP</span></div>
          )))}
        </div>}
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>setStep(0)} style={S.bGray}>←</button>
          <button onClick={()=>selected.length>0&&setStep(2)} disabled={selected.length===0} style={{flex:1,background:"#1a0a2e",border:`1px solid ${selected.length>0?"#7c3aed":"#1a0a2e"}`,borderRadius:11,color:selected.length>0?"#c4b5fd":"#2a1f4a",padding:"12px",fontSize:13,fontWeight:700,cursor:selected.length>0?"pointer":"default",fontFamily:"Cinzel,serif"}}>
            {selected.length===0?"Выбери сферу":`Далее (${selected.length}/3) →`}
          </button>
        </div>
      </div>}
      {step===2&&<div style={{width:"100%",maxWidth:400}}>
        <div style={{textAlign:"center",marginBottom:18}}>
          <div style={{fontSize:10,color:"#5a3fa0",marginBottom:4,letterSpacing:2,fontFamily:"Cinzel,serif"}}>ШАГ 2 ИЗ 3</div>
          <div style={{fontSize:19,fontWeight:700,color:"#e2d5f0",fontFamily:"Cinzel,serif"}}>Твой главный враг</div>
          <div style={{fontSize:11,color:"#5a3fa0",marginTop:5}}>Привычка которую хочешь искоренить. Каждый день без срыва — победа.</div>
        </div>
        {DEFAULT_HABITS.map(h=>{const isSel=habitId===h.id;return(
          <button key={h.id} onClick={()=>setHabitId(isSel?null:h.id)} style={{width:"100%",background:isSel?"#1a0a2e":"#0a0714",border:`1px solid ${isSel?"#7c3aed":"#1a0a2e"}`,borderRadius:12,padding:"12px 15px",marginBottom:7,cursor:"pointer",display:"flex",alignItems:"center",gap:11,textAlign:"left",boxShadow:isSel?"0 0 10px #7c3aed20":""}}>
            <span style={{fontSize:22}}>{h.icon}</span>
            <span style={{fontSize:13,fontWeight:isSel?700:400,color:isSel?"#c4b5fd":"#7c6a9a"}}>{h.name}</span>
            {isSel&&<span style={{marginLeft:"auto",color:"#7c3aed",fontWeight:800}}>✓</span>}
          </button>);})}
        <div style={{display:"flex",gap:8,marginTop:8}}>
          <button onClick={()=>setStep(1)} style={S.bGray}>←</button>
          <button onClick={()=>setStep(3)} style={{flex:1,background:"#1a0a2e",border:"1px solid #7c3aed",borderRadius:11,color:"#c4b5fd",padding:"12px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"Cinzel,serif"}}>
            {habitId?"Далее →":"Пропустить →"}
          </button>
        </div>
      </div>}
      {step===3&&<div style={{width:"100%",maxWidth:400}}>
        <div style={{textAlign:"center",marginBottom:18}}>
          <div style={{fontSize:10,color:"#5a3fa0",marginBottom:4,letterSpacing:2,fontFamily:"Cinzel,serif"}}>ШАГ 3 ИЗ 3</div>
          <div style={{fontSize:19,fontWeight:700,color:"#e2d5f0",fontFamily:"Cinzel,serif"}}>Ради чего всё это?</div>
          <div style={{fontSize:11,color:"#5a3fa0",marginTop:5}}>Напиши свою цель. Она будет напоминать тебе каждый день.</div>
        </div>
        <textarea value={goal} onChange={e=>setGoal(e.target.value)} placeholder="Стать лучшей версией себя..." style={{width:"100%",background:"#0a0714",border:"1px solid #1a0a2e",borderRadius:12,color:"#e2d5f0",padding:"13px",fontSize:13,minHeight:100,resize:"none",marginBottom:14,fontFamily:"Rajdhani,sans-serif"}}/>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>setStep(2)} style={S.bGray}>←</button>
          <button onClick={()=>onFinish(finalName,selected,habitId,goal.trim())} style={{flex:1,background:"#1a0a2e",border:"1px solid #d4a017",borderRadius:11,color:"#d4a017",padding:"12px",fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"Cinzel,serif",letterSpacing:1,boxShadow:"0 0 20px #d4a01720"}}>
            ⚔️ Начать путь
          </button>
        </div>
      </div>}
    </div>
  );
}

/* ─── Goal Window ─────────────────────────────────────────────────────────── */
function GoalWindow({goal,onClose,onEdit}) {
  const [editing,setEditing]=useState(!goal);
  const [buf,setBuf]=useState(goal||"");
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.94)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{background:"linear-gradient(135deg,#0a0714,#1a0a2e,#0a0714)",border:"1px solid #5a3fa0",borderRadius:20,padding:28,width:"min(380px,95vw)",textAlign:"center",position:"relative"}}>
        <div style={{position:"absolute",top:10,left:10,width:14,height:14,borderTop:"2px solid #d4a017",borderLeft:"2px solid #d4a017"}}/>
        <div style={{position:"absolute",top:10,right:10,width:14,height:14,borderTop:"2px solid #d4a017",borderRight:"2px solid #d4a017"}}/>
        <div style={{position:"absolute",bottom:10,left:10,width:14,height:14,borderBottom:"2px solid #d4a017",borderLeft:"2px solid #d4a017"}}/>
        <div style={{position:"absolute",bottom:10,right:10,width:14,height:14,borderBottom:"2px solid #d4a017",borderRight:"2px solid #d4a017"}}/>
        <div style={{fontSize:32,marginBottom:8,filter:"drop-shadow(0 0 12px #d4a01780)"}}>🌟</div>
        <div style={{fontSize:10,color:"#5a3fa0",letterSpacing:3,marginBottom:12,fontFamily:"Cinzel,serif"}}>МОЯ ЦЕЛЬ</div>
        {editing?<>
          <textarea value={buf} onChange={e=>setBuf(e.target.value)} style={{width:"100%",background:"#0a0714",border:"1px solid #2a1f4a",borderRadius:10,color:"#e2d5f0",padding:12,fontSize:13,minHeight:90,resize:"none",marginBottom:12,fontFamily:"Rajdhani,sans-serif"}}/>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>{onEdit(buf);setEditing(false);onClose();}} style={{flex:1,background:"#1a0a2e",border:"1px solid #d4a017",borderRadius:10,color:"#d4a017",padding:"10px",cursor:"pointer",fontWeight:700,fontFamily:"Cinzel,serif"}}>✓ Сохранить</button>
            {goal&&<button onClick={()=>{setBuf(goal);setEditing(false);}} style={{...S.bGray,padding:"10px 14px"}}>✗</button>}
          </div>
        </>:<>
          <div style={{fontSize:15,color:"#d4a017",fontFamily:"Rajdhani,sans-serif",lineHeight:1.8,marginBottom:22,fontStyle:"italic"}}>"{goal}"</div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>setEditing(true)} style={{flex:1,...S.bGray,padding:"11px",fontSize:12}}>✏️ Изменить</button>
            <button onClick={onClose} style={{flex:2,background:"#1a0a2e",border:"1px solid #d4a017",borderRadius:12,color:"#d4a017",padding:"11px",cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:"Cinzel,serif"}}>Вперёд ⚔️</button>
          </div>
        </>}
      </div>
    </div>
  );
}

/* ─── Class Notif ─────────────────────────────────────────────────────────── */
function ClassNotif({cls,onClose}) {
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.95)",zIndex:250,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{background:`linear-gradient(135deg,#0a0714,${cls.color}12,#0a0714)`,border:`1px solid ${cls.color}`,borderRadius:20,padding:28,width:"min(380px,95vw)",textAlign:"center",animation:"popIn .4s ease",boxShadow:`0 0 40px ${cls.color}25`}}>
        <div style={{fontSize:10,color:cls.color,letterSpacing:3,marginBottom:6,fontFamily:"Cinzel,serif"}}>НОВЫЙ КЛАСС</div>
        <div style={{fontSize:30,fontWeight:900,color:cls.color,fontFamily:"Cinzel,serif",textShadow:`0 0 20px ${cls.color}80`,marginBottom:6}}>{cls.name}</div>
        <div style={{background:"#0a0714",border:`1px solid ${cls.color}25`,borderRadius:12,padding:14,marginBottom:18,textAlign:"left"}}>
          <div style={{fontSize:13,color:"#e2d5f0",lineHeight:1.8,fontFamily:"Rajdhani,sans-serif"}}>{cls.motivation}</div>
        </div>
        <div style={{background:`${cls.color}15`,border:`1px solid ${cls.color}40`,borderRadius:9,padding:"7px 14px",marginBottom:16,fontSize:12,color:cls.color}}>▸ {cls.bonus}</div>
        <button onClick={onClose} style={{background:"#1a0a2e",border:`1px solid ${cls.color}`,borderRadius:12,color:cls.color,padding:"12px 28px",cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:"Cinzel,serif"}}>Принять</button>
      </div>
    </div>
  );
}

/* ─── HP Tooltip ──────────────────────────────────────────────────────────── */
function HpTooltip({onClose}) {
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.8)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={onClose}>
      <div style={{background:"#0e0b1a",border:"1px solid #2a1f4a",borderRadius:16,padding:20,width:"min(320px,90vw)"}} onClick={e=>e.stopPropagation()}>
        <div style={{fontSize:12,color:"#d4a017",fontWeight:700,marginBottom:12,fontFamily:"Cinzel,serif",letterSpacing:1}}>❤️ КАК РАБОТАЕТ HP</div>
        <div style={{fontSize:12,color:"#7c6a9a",lineHeight:2.0,fontFamily:"Rajdhani,sans-serif"}}>
          Каждое утро система оценивает вчерашний день:<br/>
          <span style={{color:"#e05555"}}>◆ Ничего не сделал → -10 HP</span><br/>
          <span style={{color:"#4ade80"}}>◆ Все дейли выполнены → +5 HP</span><br/>
          <span style={{color:"#60a5fa"}}>◆ День отдыха → +10 HP</span>
        </div>
        <div style={{background:"#1a0808",border:"1px solid #3a0a0a",borderRadius:10,padding:12,marginTop:12,marginBottom:14}}>
          <div style={{fontSize:11,color:"#e05555",fontWeight:700,marginBottom:4,fontFamily:"Cinzel,serif"}}>⚠️ При 0 HP — СМЕРТЬ ПЕРСОНАЖА</div>
          <div style={{fontSize:11,color:"#7c6a9a",lineHeight:1.7,fontFamily:"Rajdhani,sans-serif"}}>Уровень, XP и все статы сбрасываются до нуля. Сохраняется только 50% накопленного Gold и все твои привычки. Путь начинается заново.</div>
        </div>
        <button onClick={onClose} style={{...S.bGray,width:"100%",padding:"9px",fontSize:12}}>Понял ⚔️</button>
      </div>
    </div>
  );
}

/* ─── Weekly Report Modal ─────────────────────────────────────────────────── */
function WeeklyReportModal({report,onClose}) {
  if(!report) return null;
  const days=["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];
  const max=Math.max(...(report.weekXP||[0]));
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.93)",zIndex:250,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={onClose}>
      <div style={{background:"#0a0714",border:"1px solid #5a3fa0",borderRadius:20,padding:20,width:"min(380px,92vw)",maxHeight:"85vh",overflow:"auto"}} onClick={e=>e.stopPropagation()}>
        <div style={{textAlign:"center",marginBottom:16}}>
          <div style={{fontSize:10,color:"#5a3fa0",letterSpacing:2,fontFamily:"Cinzel,serif"}}>ОТЧЁТ НЕДЕЛИ</div>
          <div style={{fontSize:20,fontWeight:900,color:"#d4a017",fontFamily:"Cinzel,serif",marginTop:4}}>Неделя #{report.week}</div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:16}}>
          {[["⚡","XP заработано",report.totalXp,"#d4a017"],["⚔️","Квестов",report.totalQuests,"#c4b5fd"],["🔥","Комбо",report.combo,"#f97316"],["❤️","Лучший день XP",report.bestDay,"#e05555"],["🏆","Уровень",report.level,"#7c3aed"],["💰","Gold",report.gold,"#d4a017"]].map(([i,l,v,c])=>(
            <div key={l} style={{background:"#0e0b1a",border:`1px solid ${c}20`,borderRadius:10,padding:"10px 6px",textAlign:"center"}}>
              <div style={{fontSize:15}}>{i}</div>
              <AnimCounter value={v} color={c} size={20} duration={800}/>
              <div style={{fontSize:9,color:"#2a1f4a",marginTop:2,fontFamily:"Cinzel,serif"}}>{l.toUpperCase()}</div>
            </div>
          ))}
        </div>
        <div style={{marginBottom:14}}>
          <div style={{fontSize:10,color:"#5a3fa0",letterSpacing:1,marginBottom:8,fontFamily:"Cinzel,serif"}}>XP ПО ДНЯМ</div>
          <LineChart data={report.weekXP||Array(7).fill(0)}/>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
            {days.map(d=><div key={d} style={{fontSize:9,color:"#2a1f4a",fontFamily:"Rajdhani,sans-serif"}}>{d}</div>)}
          </div>
        </div>
        {report.statGrowth&&<div style={{marginBottom:14}}>
          <div style={{fontSize:10,color:"#5a3fa0",letterSpacing:1,marginBottom:8,fontFamily:"Cinzel,serif"}}>РОСТ СТАТОВ ЗА НЕДЕЛЮ</div>
          {Object.entries(STATS).map(([k,st])=>{
            const g=report.statGrowth[k]||0;
            return g>0?<div key={k} style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
              <span style={{fontSize:12}}>{st.icon}</span>
              <span style={{fontSize:11,color:"#7c6a9a",flex:1,fontFamily:"Rajdhani,sans-serif"}}>{st.name}</span>
              <span style={{fontSize:12,color:st.color,fontWeight:700,fontFamily:"Rajdhani,sans-serif"}}>+{g}</span>
            </div>:null;
          })}
        </div>}
        <button onClick={onClose} style={{...S.bGray,width:"100%",padding:"11px",borderRadius:12,fontFamily:"Cinzel,serif"}}>Закрыть летопись</button>
      </div>
    </div>
  );
}

/* ─── Boss Reflection ─────────────────────────────────────────────────────── */
function BossReflection({title,onSubmit,onSkip}) {
  const [text,setText]=useState("");
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.92)",zIndex:250,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{background:"#0e0b1a",border:"1px solid #d4a017",borderRadius:18,padding:22,width:"min(380px,95vw)"}}>
        <div style={{fontSize:26,textAlign:"center",marginBottom:8}}>⚔️</div>
        <div style={{fontWeight:700,fontSize:15,color:"#d4a017",textAlign:"center",fontFamily:"Cinzel,serif",marginBottom:6}}>Победа над боссом</div>
        <div style={{fontSize:12,color:"#5a3fa0",textAlign:"center",marginBottom:14,fontFamily:"Rajdhani,sans-serif"}}>{title}</div>
        <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Опиши свой путь к победе... (опционально)" style={{width:"100%",background:"#07060d",border:"1px solid #2a1f4a",borderRadius:10,color:"#e2d5f0",padding:"10px",fontSize:12,minHeight:70,resize:"none",marginBottom:12,fontFamily:"Rajdhani,sans-serif"}}/>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>onSubmit(text.trim()||null)} style={{flex:2,...S.bWin,padding:"10px",fontFamily:"Cinzel,serif"}}>
            {text.trim()?"⚔️ Записать в летопись":"⚔️ Принять победу"}
          </button>
          <button onClick={onSkip} style={{flex:1,...S.bGray,padding:"10px"}}>Пропустить</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Sprint Reflection ───────────────────────────────────────────────────── */
function SprintReflection({sprint,type,onSubmit,onCancel}) {
  const [text,setText]=useState("");
  const isWin=type==="win";
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.92)",zIndex:250,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{background:"#0e0b1a",border:`1px solid ${isWin?"#d4a017":"#8b1a1a"}`,borderRadius:18,padding:22,width:"min(380px,95vw)"}}>
        <div style={{fontSize:26,textAlign:"center",marginBottom:8}}>{isWin?"🏆":"💔"}</div>
        <div style={{fontWeight:700,fontSize:14,color:isWin?"#d4a017":"#e05555",textAlign:"center",fontFamily:"Cinzel,serif",marginBottom:4}}>{isWin?"Спринт завершён":"Спринт провален"}</div>
        <div style={{fontSize:11,color:"#5a3fa0",textAlign:"center",marginBottom:14}}>"{sprint?.name}"</div>
        <textarea value={text} onChange={e=>setText(e.target.value)} placeholder={isWin?"Как ты это сделал? Что помогло?":"Почему не получилось? Что сделаешь иначе?"} style={{width:"100%",background:"#07060d",border:`1px solid ${isWin?"#2a1f4a":"#3a0a0a"}`,borderRadius:10,color:"#e2d5f0",padding:"10px",fontSize:12,minHeight:80,resize:"none",marginBottom:12,fontFamily:"Rajdhani,sans-serif"}}/>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>text.trim()&&onSubmit(text.trim())} disabled={!text.trim()} style={{flex:2,background:"#1a0a2e",border:`1px solid ${text.trim()?isWin?"#d4a017":"#e05555":"#1a0a2e"}`,borderRadius:10,color:text.trim()?isWin?"#d4a017":"#e05555":"#2a1f4a",padding:"10px",cursor:text.trim()?"pointer":"default",fontWeight:700,fontSize:12,fontFamily:"Cinzel,serif"}}>
            {text.trim()?"Записать →":"Напиши хотя бы пару слов"}
          </button>
          <button onClick={onCancel} style={{...S.bGray,padding:"10px 14px"}}>✗</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main App ────────────────────────────────────────────────────────────── */
export default function App() {
  const [gs,setGs]               = useState(null);
  const [loading,setLoading]     = useState(true);
  const [showOnboarding,setShowOnboarding] = useState(false);
  const [showGoal,setShowGoal]   = useState(false);
  const [showShare,setShowShare] = useState(false);
  const [showHpTip,setShowHpTip] = useState(false);
  const [showLevels,setShowLevels]   = useState(false);
  const [showClasses,setShowClasses] = useState(false);
  const [showSettings,setShowSettings] = useState(false);
  const [showWeeklyReport,setShowWeeklyReport] = useState(null);
  const [showStatInfo,setShowStatInfo] = useState(null);
  const [deathScreen,setDeathScreen] = useState(false);
  const [rebirthScreen,setRebirthScreen] = useState(false);
  const [resetStep,setResetStep] = useState(0);
  const [tab,setTab]             = useState("quests");
  const [sub,setSub]             = useState("daily");
  const [toast,setToast]         = useState(null);
  const [lvlUp,setLvlUp]         = useState(null);
  const [classNotif,setClassNotif]   = useState(null);
  const [bossReflection,setBossReflection] = useState(null);
  const [sprintReflection,setSprintReflection] = useState(null);
  const [pendingQ,setPendingQ]   = useState(null);
  const [undoSnap,setUndoSnap]   = useState(null);
  const [undoSecs,setUndoSecs]   = useState(0);
  const [editingQ,setEditingQ]   = useState(null);
  const [editBuf,setEditBuf]     = useState({});
  const [editName,setEditName]   = useState(false);
  const [tmpName,setTmpName]     = useState("");
  const [editingH,setEditingH]   = useState(null);
  const [editHBuf,setEditHBuf]   = useState({});
  const [editingShop,setEditingShop] = useState(null);
  const [editShopBuf,setEditShopBuf] = useState({});
  const [showAddQ,setShowAddQ]   = useState(false);
  const [addQBuf,setAddQBuf]     = useState({title:"",desc:"",xp:50,stat:"telo"});
  const [sForm,setSForm]         = useState({show:false,name:"",cost:50,icon:"⭐"});
  const [showSprintForm,setShowSprintForm] = useState(false);
  const [sprintBuf,setSprintBuf] = useState({name:"",duration:14,reward:"",penaltyHp:25});
  const [showAddBoss,setShowAddBoss] = useState(false);
  const [bossBuf,setBossBuf]     = useState({title:"",stat:"telo",xp:250,pen:40});
  const [showBossTemplates,setShowBossTemplates] = useState(false);
  const [sphereUnlockNotif,setSphereUnlockNotif] = useState(null);

  useEffect(()=>{ initApp(); },[]);
  useEffect(()=>{
    if(!undoSnap) return;
    const iv=setInterval(()=>{ const r=Math.ceil((undoSnap.exp-Date.now())/1000); if(r<=0){setUndoSnap(null);setUndoSecs(0);clearInterval(iv);}else setUndoSecs(r); },500);
    return()=>clearInterval(iv);
  },[undoSnap]);

  const initApp = async()=>{
    try{
      const tg=window.Telegram?.WebApp; if(tg){tg.ready();tg.expand();}
      let s=await loadState();
      if(!s){ setShowOnboarding(true); setLoading(false); return; }
      const tod=today(), wk=String(weekN());

      if(s.lastDay!==tod){
        // Daily HP change
        const done=Object.keys(s.daily||{}).filter(k=>k!=="REST").length;
        const total=(s.customDaily||[]).length;
        let hpΔ=0;
        if(done===0&&total>0)       hpΔ=-10;
        else if(done>=total&&total>0) hpΔ=5;
        s.hp=Math.max(0,Math.min(100,s.hp+hpΔ));
        // Sprint deadlines
        s.sprints=(s.sprints||[]).map(sp=>sp.completed||sp.failed?sp:daysLeft(sp.endDate)===0?{...sp,failed:true}:sp);
        // Mini boss penalty
        if(s.miniBoss?.accepted&&!s.miniBoss?.completed){s.hp=Math.max(0,s.hp-s.miniBoss.pen);s.combo=0;}
        // Weekly report
        if(s.weekStart!==wk){
          const report=generateWeeklyReport(s,null);
          s.weeklyReports=[report,...(s.weeklyReports||[]).slice(0,11)];
        }
        if(s.hp<=0) s.deathPending=true;
        const earned=s.totalXp-(s.lastDayXp||s.totalXp);
        s.weekXP=[...(s.weekXP||[]).slice(-6),Math.max(0,earned)];
        s.daily={}; s.lastDay=tod; s.lastDayXp=s.totalXp;
        s.miniBoss=shouldSpawnBoss()?{...randomBoss(),accepted:false,completed:false}:null;
      }
      if(s.weekStart!==wk){s.bossQuests={};s.restWeek=0;s.immunityUsed=false;s.weekStart=wk;}

      // Sphere unlock notifications
      const daysOld=daysSince(s.createdAt||s.lastDay);
      if(daysOld>=7&&(s.selectedSpheres||[]).length<4&&!s.sphere4Notified){
        s.sphere4Notified=true;
        setTimeout(()=>setSphereUnlockNotif(4),2000);
      }
      if(daysOld>=30&&(s.selectedSpheres||[]).length<5&&!s.sphere5Notified){
        s.sphere5Notified=true;
        setTimeout(()=>setSphereUnlockNotif(5),2000);
      }

      setGs(s); setLoading(false);
      if(s.deathPending) setDeathScreen(true);
      else if(s.goal) setTimeout(()=>setShowGoal(true),500);
    }catch(e){console.error(e);setShowOnboarding(true);setLoading(false);}
  };

  const pop=(msg,ok=true)=>{setToast({msg,ok});setTimeout(()=>setToast(null),2800);};
  const upd=(fn)=>setGs(prev=>{
    const s=fn(prev);
    const oldCls=getClass(prev.stats,prev.combo);
    const newCls=getClass(s.stats,s.combo);
    if(newCls.id!==oldCls.id&&newCls.id!==s.prevClassId){s.prevClassId=newCls.id;setTimeout(()=>setClassNotif(newCls),300);}
    saveState(s); return s;
  });

  const finishOnboarding=(name,sphereIds,habitId,goal)=>{
    const s=freshChar(name,sphereIds,habitId,goal);
    setGs(s); saveState(s); setShowOnboarding(false);
    setTimeout(()=>setShowGoal(true),500);
  };

  /* ── Quest ──────────────────────────────────────────────────────────────── */
  const completeQuest=(q,ovMult=1.0,isBoss=false)=>{
    upd(prev=>{
      const lvi=getLvl(prev.totalXp);
      const cls=getClass(prev.stats,prev.combo);
      const clsM=cls.id==="champion"?1.10:cls.id==="ocean"?1.35:cls.id==="shadow"?1.30:cls.id==="berserker"?1.20:(cls.id==="monkWarrior"&&(q.stat==="telo"||q.stat==="volya"))?1.20:(cls.id==="scholar"&&q.stat==="razum")?1.20:(cls.id==="leader"&&q.stat==="vliyanie")?1.20:(cls.id==="monk"&&q.stat==="volya")?1.20:(cls.id==="builder"&&q.stat==="delo")?1.20:(cls.id==="archmage"&&(q.stat==="razum"||q.stat==="volya"))?1.15:(cls.id==="influencer"&&(q.stat==="razum"||q.stat==="vliyanie"))?1.15:cls.id==="elite"?1.05:1;
      const rawMult=Math.min(MAX_XP_MULT,(1+prev.combo*0.1)*clsM*ovMult);
      const xp=Math.floor((q.xp||50)*rawMult);
      const gold=isBoss?Math.floor((q.xp||50)/4):Math.floor((q.xp||50)/8);
      const newXp=prev.totalXp+xp;
      if(getLvl(newXp).level>lvi.level) setTimeout(()=>{setLvlUp(getLvl(newXp).level);setTimeout(()=>setLvlUp(null),3500);},80);

      let newDaily=prev.daily, newBoss=prev.bossQuests;
      const newStats={...prev.stats,[q.stat]:(prev.stats[q.stat]||1)+(isBoss?3:1)};
      if(isBoss) newBoss={...prev.bossQuests,[q.id]:"done"};
      else       newDaily={...prev.daily,[q.id]:true};

      const merged={...prev.daily,[q.id]:true};
      const total=(prev.customDaily||[]).length;
      const allDone=!isBoss&&total>0&&(prev.customDaily||[]).every(d=>merged[d.id]);

      let mb=prev.miniBoss;
      if(mb?.accepted&&!mb.completed){
        const r=mb.req;
        const done=(r.type==="any"&&Object.keys(merged).filter(k=>k!=="REST").length>=r.count)||(r.type==="stat"&&(prev.customDaily||[]).filter(q2=>q2.stat===r.stat).every(q2=>merged[q2.id]))||(r.type==="all"&&total>0&&(prev.customDaily||[]).every(q2=>merged[q2.id]));
        if(done) mb={...mb,completed:true};
      }
      const bB=mb?.completed&&!prev.miniBoss?.completed?{xp:mb.xp,gold:mb.gold}:{xp:0,gold:0};
      if(bB.xp) setTimeout(()=>pop(`💀 Мини-босс повержен! +${mb.xp}XP`),400);

      const ovTag=ovMult>=2?" 💥×2!":ovMult>=1.5?" ×1.5!":"";
      if(allDone) pop("🔥 Все дейли! Комбо растёт!");
      else if(isBoss) pop(`⚔️ Босс пал!${ovTag} +${xp}XP`);
      else pop(`+${xp}XP${ovTag} — ${q.title}`);

      setUndoSnap({snap:JSON.parse(JSON.stringify(prev)),exp:Date.now()+30000}); setUndoSecs(30);
      return{...prev,totalXp:newXp+bB.xp,gold:Math.min(9999,prev.gold+gold+bB.gold),stats:newStats,combo:allDone?prev.combo+1:prev.combo,daily:newDaily,bossQuests:newBoss,nextDouble:false,miniBoss:mb,statLastUpdate:{...(prev.statLastUpdate||{}),[q.stat]:today()},log:[{id:Date.now(),txt:q.title+ovTag,xp,gold,t:isBoss?"boss":"ok",time:nowStr()},...(prev.log||[]).slice(0,59)]};
    });
    setPendingQ(null);
  };

  const doUndo=()=>{ if(!undoSnap)return; const s=undoSnap.snap; setGs(s); saveState(s); setUndoSnap(null); setUndoSecs(0); pop("↩️ Отменено!"); };
  const clickBossWin=(q)=>setBossReflection({q});
  const confirmBossWin=(q,reflection)=>{
    setBossReflection(null);
    if(reflection) upd(prev=>({...prev,log:[{id:Date.now(),txt:`⚔️ "${q.title}": ${reflection}`,xp:0,gold:0,t:"boss",time:nowStr()},...(prev.log||[]).slice(0,59)]}));
    setPendingQ({q,isBoss:true});
  };
  const failBossQ=(q)=>upd(prev=>({...prev,hp:Math.max(0,prev.hp-(q.pen||40)),combo:0,bossQuests:{...prev.bossQuests,[q.id]:"fail"},log:[{id:Date.now(),txt:`💀 Провал: ${q.title}`,xp:-(q.pen||40),gold:0,t:"fail",time:nowStr()},...(prev.log||[]).slice(0,59)]}));

  /* ── Mini Boss ──────────────────────────────────────────────────────────── */
  const acceptBoss=()=>upd(prev=>({...prev,miniBoss:{...prev.miniBoss,accepted:true}}));
  const retreatBoss=()=>upd(prev=>({...prev,miniBoss:null}));
  const claimBoss=()=>upd(prev=>{ const mb=prev.miniBoss; if(!mb?.completed)return prev; pop(`🏆 +${mb.xp}XP +${mb.gold}G!`); return{...prev,totalXp:prev.totalXp+mb.xp,gold:prev.gold+mb.gold,stats:{...prev.stats,[mb.stat]:(prev.stats[mb.stat]||1)+2},miniBoss:{...mb,claimed:true},log:[{id:Date.now(),txt:`⚔️ МИНИ-БОСС: ${mb.name}`,xp:mb.xp,gold:mb.gold,t:"boss",time:nowStr()},...(prev.log||[]).slice(0,59)]}; });

  /* ── Rest ───────────────────────────────────────────────────────────────── */
  const takeRest=()=>upd(prev=>{
    if(prev.daily.REST){pop("Сегодня уже день отдыха",false);return prev;}
    const first=prev.restWeek===0; const goldΔ=first?30:-20;
    pop(first?"😴 +30G, +10 HP":"😓 -20G",first);
    return{...prev,gold:Math.max(0,prev.gold+goldΔ),combo:first?prev.combo:Math.max(0,prev.combo-1),hp:Math.min(100,prev.hp+10),restWeek:prev.restWeek+1,daily:{...prev.daily,REST:true},log:[{id:Date.now(),txt:first?"😴 День отдыха":"😓 Второй отдых",xp:0,gold:goldΔ,t:"rest",time:nowStr()},...(prev.log||[]).slice(0,59)]};
  });

  /* ── Habits ─────────────────────────────────────────────────────────────── */
  const habitHold=(hid)=>upd(prev=>{const tod=today();return{...prev,habits:prev.habits.map(h=>{if(h.id!==hid)return h;if(h.lastCheck===tod){pop("Уже отмечено ✓");return h;}const ns=h.streak+1;pop(`🛡 ${ns} ${declDay(ns)}!`);return{...h,streak:ns,longest:Math.max(ns,h.longest),lastCheck:tod};})};});
  const habitFail=(hid)=>upd(prev=>({...prev,hp:Math.max(0,prev.hp-10),habits:prev.habits.map(h=>{if(h.id!==hid)return h;pop(`💔 Серия ${h.streak} сброшена. -10HP`,false);return{...h,streak:0,lastCheck:today()};}),log:[{id:Date.now(),txt:"💔 Срыв привычки",xp:0,gold:0,t:"fail",time:nowStr()},...(prev.log||[]).slice(0,59)]}));
  const claimHabitMs=(hid,days)=>upd(prev=>{const ms=HABIT_MS.find(m=>m.days===days);if(!ms)return prev;return{...prev,gold:prev.gold+ms.gold,totalXp:prev.totalXp+ms.xp,hp:Math.min(100,prev.hp+ms.hp),habits:prev.habits.map(h=>h.id!==hid?h:{...h,claimedMs:[...(h.claimedMs||[]),days]}),log:[{id:Date.now(),txt:`${ms.icon} Веха ${days} дней!`,xp:ms.xp,gold:ms.gold,t:"ok",time:nowStr()},...(prev.log||[]).slice(0,59)]};});
  const saveHabit=()=>{upd(prev=>({...prev,habits:prev.habits.map(h=>h.id!==editingH?h:{...h,...editHBuf})}));setEditingH(null);pop("✅");};
  const deleteHabit=(hid)=>upd(prev=>({...prev,habits:prev.habits.filter(h=>h.id!==hid)}));
  const addHabitFromList=(h)=>{if(gs.habits.find(x=>x.id===h.id)){pop("Уже добавлена",false);return;}upd(prev=>({...prev,habits:[...prev.habits,{...h,streak:0,longest:0,lastCheck:"",claimedMs:[]}]}));pop(`✅ "${h.name}"!`);};

  /* ── Sprints ────────────────────────────────────────────────────────────── */
  const createSprint=()=>{
    if(!sprintBuf.name.trim()){pop("Введи название",false);return;}
    const active=(gs.sprints||[]).filter(s=>s.active&&!s.completed&&!s.failed).length;
    if(active>=1){pop("Сначала завершите текущий спринт",false);return;}
    const end=new Date(); end.setDate(end.getDate()+parseInt(sprintBuf.duration));
    const sp={id:`sp-${Date.now()}`,name:sprintBuf.name.trim(),duration:parseInt(sprintBuf.duration),startDate:today(),endDate:end.toDateString(),reward:sprintBuf.reward.trim(),penaltyHp:parseInt(sprintBuf.penaltyHp)||25,active:true,completed:false,failed:false};
    upd(prev=>({...prev,sprints:[...(prev.sprints||[]),sp]}));
    setShowSprintForm(false); setSprintBuf({name:"",duration:14,reward:"",penaltyHp:25});
    pop(`🎯 "${sp.name}" начат!`);
  };
  const completeSprint=(id)=>setSprintReflection({sprintId:id,type:"win"});
  const failSprint=(id)=>setSprintReflection({sprintId:id,type:"fail"});
  const submitSprintReflection=(text)=>{
    const sp=(gs.sprints||[]).find(s=>s.id===sprintReflection.sprintId);
    if(!sp){setSprintReflection(null);return;}
    const isWin=sprintReflection.type==="win";
    upd(prev=>({...prev,sprints:(prev.sprints||[]).map(s=>s.id===sp.id?{...s,completed:isWin,failed:!isWin,reflection:text}:s),hp:isWin?prev.hp:Math.max(0,prev.hp-sp.penaltyHp),totalXp:isWin?prev.totalXp+300:prev.totalXp,gold:isWin?prev.gold+50:prev.gold,log:[{id:Date.now(),txt:`${isWin?"🏆":"💔"} Спринт "${sp.name}": ${text}`,xp:isWin?300:0,gold:isWin?50:0,t:isWin?"boss":"fail",time:nowStr()},...(prev.log||[]).slice(0,59)]}));
    pop(isWin?"🏆 +300XP +50G!":"💔 Записано.",isWin);
    setSprintReflection(null);
  };
  const deleteSprint=(id)=>upd(prev=>({...prev,sprints:(prev.sprints||[]).filter(s=>s.id!==id)}));

  /* ── Boss Quests ────────────────────────────────────────────────────────── */
  const addBossFromTemplate=(tmpl)=>{
    const q={id:`bq-${Date.now()}`,title:tmpl.title,desc:"Недельный вызов",stat:tmpl.stat,xp:250,pen:40,icon:"⚔️",custom:true};
    upd(prev=>({...prev,customBossQuests:[...(prev.customBossQuests||[]),q]}));
    setShowBossTemplates(false); pop(`✅ "${tmpl.title}" добавлен!`);
  };
  const addCustomBoss=()=>{
    if(!bossBuf.title.trim()){pop("Введи название",false);return;}
    const q={id:`bq-${Date.now()}`,title:bossBuf.title.trim(),desc:"Недельный вызов",stat:bossBuf.stat,xp:parseInt(bossBuf.xp)||250,pen:parseInt(bossBuf.pen)||40,icon:"⚔️",custom:true};
    upd(prev=>({...prev,customBossQuests:[...(prev.customBossQuests||[]),q]}));
    setShowAddBoss(false); setBossBuf({title:"",stat:"telo",xp:250,pen:30}); pop("✅ Босс добавлен!");
  };
  const delCustomBoss=(id)=>upd(prev=>({...prev,customBossQuests:(prev.customBossQuests||[]).filter(q=>q.id!==id)}));

  /* ── Quests ─────────────────────────────────────────────────────────────── */
  const mergeQ=(q)=>({...q,...((gs?.questEdits||{})[q.id]||{})});
  const saveQEdit=()=>{upd(prev=>({...prev,questEdits:{...(prev.questEdits||{}),[editingQ]:{...editBuf,xp:Math.min(200,parseInt(editBuf.xp)||50)}}}));setEditingQ(null);pop("✅");};
  const addCustomDaily=()=>{
    if(!addQBuf.title.trim()){pop("Введи название",false);return;}
    const xp=Math.min(200,parseInt(addQBuf.xp)||50);
    const q={id:`cdq-${Date.now()}`,title:addQBuf.title.trim(),desc:addQBuf.desc||addQBuf.title.trim(),xp,stat:addQBuf.stat,catId:addQBuf.stat,icon:"⚡"};
    upd(prev=>({...prev,customDaily:[...(prev.customDaily||[]),q]}));
    setShowAddQ(false); setAddQBuf({title:"",desc:"",xp:50,stat:"telo"}); pop("✅ Квест добавлен!");
  };

  /* ── Shop ───────────────────────────────────────────────────────────────── */
  const buyItem=(item)=>upd(prev=>{
    if(prev.gold<item.cost){pop("Мало Gold!",false);return prev;}
    pop(`✅ Ты заработал это: ${item.name}`);
    return{...prev,gold:prev.gold-item.cost,purchases:[{id:Date.now(),name:item.name,cost:item.cost,time:nowStr()},...(prev.purchases||[])],log:[{id:Date.now(),txt:`🛒 ${item.name}`,xp:0,gold:-item.cost,t:"shop",time:nowStr()},...(prev.log||[]).slice(0,59)]};
  });
  const saveShopItem=()=>{upd(prev=>({...prev,shop:prev.shop.map(i=>i.id!==editingShop?i:{...i,...editShopBuf,cost:parseInt(editShopBuf.cost)||50})}));setEditingShop(null);pop("✅");};
  const deleteShopItem=(id)=>upd(prev=>({...prev,shop:prev.shop.filter(i=>i.id!==id)}));

  /* ── Death ──────────────────────────────────────────────────────────────── */
  const handleDeath=()=>{
    const gold=gs.gold, name=gs.name;
    setDeathScreen(false);
    setTimeout(()=>{
      const s=freshChar(name,[],[],gs.goal);
      s.gold=Math.floor(gold*0.5); s.deathCount=(gs.deathCount||0)+1;
      s.habits=gs.habits; s.shop=gs.shop; s.deathPending=false;
      setGs(s); saveState(s);
      setRebirthScreen(true);
    },200);
  };

  /* ── Reset ──────────────────────────────────────────────────────────────── */
  const doReset=async()=>{
    for(const k of SAVE_KEYS) await CS.del(k);
    setGs(null); setResetStep(0); setShowSettings(false); setShowOnboarding(true);
  };

  if(loading) return <div style={{background:"#07060d",height:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:12}}>
    <style>{`@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Rajdhani:wght@400;500;600;700&display=swap');@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}`}</style>
    <div style={{fontSize:48,animation:"float 2s ease-in-out infinite",filter:"drop-shadow(0 0 20px #7c3aed)"}}>⚔️</div>
    <div style={{color:"#d4a017",fontFamily:"Cinzel,serif",fontSize:13,letterSpacing:3}}>ЗАГРУЗКА...</div>
  </div>;
  if(showOnboarding) return <Onboarding onFinish={finishOnboarding}/>;
  if(!gs) return null;

  const lvi=getLvl(gs.totalXp);
  const cls=getClass(gs.stats,gs.combo);
  const xpP=(lvi.xpIn/lvi.xpTo)*100;
  const hpP=(gs.hp/100)*100;
  const allDaily=gs.customDaily||[];
  const doneN=allDaily.filter(q=>gs.daily[q.id]).length;
  const multS=gs.combo>0?`×${Math.min(MAX_XP_MULT,(1+gs.combo*0.1)).toFixed(1)}`:null;
  const mb=gs.miniBoss;
  const activeSprints=(gs.sprints||[]).filter(s=>s.active&&!s.completed&&!s.failed);
  const allBossQuests=[...(gs.customBossQuests||[])];

  return (
    <div style={S.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Rajdhani:wght@400;500;600;700&display=swap');
        ${CSS}
      `}</style>

      {deathScreen&&<DeathScreen deathCount={gs.deathCount||0} gold={gs.gold} onRevive={handleDeath}/>}
      {rebirthScreen&&<RebirthScreen name={gs.name} onDone={()=>setRebirthScreen(false)}/>}
      {showGoal&&<GoalWindow goal={gs.goal} onClose={()=>setShowGoal(false)} onEdit={(g)=>upd(prev=>({...prev,goal:g}))}/>}
      {showShare&&<ShareCard gs={gs} cls={cls} lvi={lvi} onClose={()=>setShowShare(false)}/>}
      {showHpTip&&<HpTooltip onClose={()=>setShowHpTip(false)}/>}
      {lvlUp&&<div style={S.overlay}><div style={{textAlign:"center",animation:"popIn .4s ease"}}>
        <div style={{fontSize:80,filter:"drop-shadow(0 0 30px #d4a017)"}}>⚡</div>
        <div style={{fontSize:42,fontWeight:900,color:"#d4a017",fontFamily:"Cinzel,serif",textShadow:"0 0 40px #d4a01780"}}>LEVEL UP!</div>
        <div style={{fontSize:26,color:"#e2d5f0",marginTop:8,fontFamily:"Rajdhani,sans-serif"}}>Уровень {lvlUp}</div>
        <div style={{fontSize:15,color:cls.color,marginTop:4,fontFamily:"Cinzel,serif"}}>{getLvlName(lvlUp)}</div>
      </div></div>}
      {classNotif&&<ClassNotif cls={classNotif} onClose={()=>setClassNotif(null)}/>}
      {pendingQ&&<div style={S.overlay} onClick={()=>setPendingQ(null)}>
        <div style={{background:"#0e0b1a",border:"1px solid #5a3fa0",borderRadius:20,padding:22,width:"min(340px,92vw)",boxShadow:"0 0 40px #7c3aed15"}} onClick={e=>e.stopPropagation()}>
          <div style={{fontWeight:700,fontSize:15,color:"#d4a017",marginBottom:6,fontFamily:"Cinzel,serif"}}>⚔️ {pendingQ.q.title}</div>
          <div style={{fontSize:11,color:"#5a3fa0",marginBottom:14,fontFamily:"Rajdhani,sans-serif"}}>Насколько хорошо выполнено?</div>
          {OVERPERF.map(op=>(
            <button key={op.id} onClick={()=>completeQuest(pendingQ.q,op.mult,pendingQ.isBoss)}
              style={{width:"100%",background:`${op.color}0e`,border:`1px solid ${op.color}40`,borderRadius:12,padding:"12px 14px",marginBottom:7,cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",boxShadow:`0 0 8px ${op.color}08`}}>
              <span style={{color:op.color,fontWeight:700,fontSize:14,fontFamily:"Rajdhani,sans-serif"}}>{op.label}</span>
              <span style={{color:"#5a3fa0",fontSize:11,fontFamily:"Rajdhani,sans-serif"}}>~{Math.min(Math.floor((pendingQ.q.xp||50)*MAX_XP_MULT),Math.floor((pendingQ.q.xp||50)*op.mult*(1+gs.combo*0.1)))} XP</span>
            </button>
          ))}
          <button onClick={()=>setPendingQ(null)} style={{...S.bGray,width:"100%",padding:"10px",marginTop:3}}>Отмена</button>
        </div>
      </div>}
      {bossReflection&&<BossReflection title={bossReflection.q.title} onSubmit={(t)=>confirmBossWin(bossReflection.q,t)} onSkip={()=>{confirmBossWin(bossReflection.q,null);setBossReflection(null);}}/>}
      {sprintReflection&&<SprintReflection sprint={(gs.sprints||[]).find(s=>s.id===sprintReflection.sprintId)} type={sprintReflection.type} onSubmit={submitSprintReflection} onCancel={()=>setSprintReflection(null)}/>}
      {showWeeklyReport&&<WeeklyReportModal report={showWeeklyReport} onClose={()=>setShowWeeklyReport(null)}/>}

      {/* Sphere unlock notification */}
      {sphereUnlockNotif&&<div style={S.overlay} onClick={()=>setSphereUnlockNotif(null)}>
        <div style={{background:"linear-gradient(135deg,#0a0714,#1a0a2e)",border:"1px solid #d4a017",borderRadius:20,padding:28,width:"min(360px,92vw)",textAlign:"center",animation:"popIn .4s ease"}} onClick={e=>e.stopPropagation()}>
          <div style={{fontSize:48,marginBottom:12,filter:"drop-shadow(0 0 15px #d4a017)"}}>🔓</div>
          <div style={{fontSize:22,fontWeight:900,color:"#d4a017",fontFamily:"Cinzel,serif",marginBottom:8}}>НОВАЯ СФЕРА</div>
          <div style={{fontSize:13,color:"#7c6a9a",lineHeight:1.8,marginBottom:20,fontFamily:"Rajdhani,sans-serif"}}>
            Ты достаточно окреп на своём пути.<br/>Теперь можешь добавить <span style={{color:"#d4a017",fontWeight:700}}>{sphereUnlockNotif}-ю сферу развития</span>.<br/>Сделай это в Настройках.
          </div>
          <button onClick={()=>{setSphereUnlockNotif(null);setShowSettings(true);}} style={{...S.bWin,padding:"12px 24px",fontSize:14,fontFamily:"Cinzel,serif",letterSpacing:1}}>Открыть настройки</button>
        </div>
      </div>}

      {/* Stat Info */}
      {showStatInfo&&<div style={S.overlay} onClick={()=>setShowStatInfo(null)}>
        <div style={{background:"#0e0b1a",border:`1px solid ${STATS[showStatInfo]?.color}40`,borderRadius:16,padding:20,width:"min(320px,92vw)"}} onClick={e=>e.stopPropagation()}>
          <div style={{fontSize:28,textAlign:"center",marginBottom:8}}>{STATS[showStatInfo]?.icon}</div>
          <div style={{fontSize:18,fontWeight:700,color:STATS[showStatInfo]?.color,textAlign:"center",fontFamily:"Cinzel,serif",marginBottom:12}}>{STATS[showStatInfo]?.name}</div>
          <div style={{fontSize:13,color:"#7c6a9a",lineHeight:1.8,marginBottom:12,fontFamily:"Rajdhani,sans-serif"}}>{STATS[showStatInfo]?.desc}</div>
          <div style={{background:"#07060d",borderRadius:10,padding:12,marginBottom:14}}>
            <div style={{fontSize:11,color:"#5a3fa0",marginBottom:6,fontFamily:"Cinzel,serif",letterSpacing:1}}>КАК КАЧАЕТСЯ</div>
            <div style={{fontSize:11,color:"#7c6a9a",fontFamily:"Rajdhani,sans-serif",lineHeight:1.7}}>
              +1 за каждый выполненный квест этой категории<br/>
              +3 за победу над боссом<br/>
              +2 за победу над мини-боссом<br/>
              Влияет на класс персонажа
            </div>
          </div>
          <button onClick={()=>setShowStatInfo(null)} style={{...S.bGray,width:"100%",padding:"9px"}}>Закрыть</button>
        </div>
      </div>}

      {/* Levels */}
      {showLevels&&<div style={S.overlay} onClick={()=>setShowLevels(false)}>
        <div style={{background:"#0a0714",border:"1px solid #2a1f4a",borderRadius:20,padding:20,width:"min(360px,92vw)",maxHeight:"80vh",overflow:"auto"}} onClick={e=>e.stopPropagation()}>
          <div style={{fontWeight:900,color:"#d4a017",fontSize:15,marginBottom:16,fontFamily:"Cinzel,serif",letterSpacing:1}}>⚔️ ПУТЬ ГЕРОЯ</div>
          {LVL_NAMES.map((name,i)=>{
            const lNum=i+1,isCur=lvi.level===lNum,isPast=lvi.level>lNum;
            return <div key={i} style={{display:"flex",alignItems:"center",gap:9,padding:"7px 9px",borderRadius:9,marginBottom:3,background:isCur?"#1a0a2e":isPast?"#0a1a0a":"transparent",border:isCur?"1px solid #7c3aed":"1px solid transparent"}}>
              <div style={{width:24,height:24,borderRadius:6,background:isCur?"#7c3aed":isPast?"#1a3a1a":"#1a0a2e",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:isCur?"#fff":isPast?"#4ade80":"#2a1f4a",flexShrink:0,fontFamily:"Rajdhani,sans-serif"}}>{lNum}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:11,fontWeight:isCur?700:400,color:isCur?"#c4b5fd":isPast?"#7c6a9a":"#2a1f4a",fontFamily:isCur?"Cinzel,serif":"inherit"}}>{name}</div>
                <div style={{fontSize:9,color:"#1a0a2e",fontFamily:"Rajdhani,sans-serif"}}>{lNum===1?"Начало пути":cumulXP(lNum).toLocaleString()+" XP"}</div>
              </div>
              {isCur&&<span style={{fontSize:10,color:"#7c3aed",fontWeight:700}}>← ты</span>}
              {isPast&&<span style={{color:"#1a5a1a",fontSize:12}}>✓</span>}
            </div>;
          })}
        </div>
      </div>}

      {/* Classes */}
      {showClasses&&<div style={S.overlay} onClick={()=>setShowClasses(false)}>
        <div style={{background:"#0a0714",border:"1px solid #2a1f4a",borderRadius:20,padding:20,width:"min(380px,92vw)",maxHeight:"80vh",overflow:"auto"}} onClick={e=>e.stopPropagation()}>
          <div style={{fontWeight:900,color:"#d4a017",fontSize:15,marginBottom:14,fontFamily:"Cinzel,serif",letterSpacing:1}}>🔮 КЛАССЫ ГЕРОЕВ</div>
          {CLASSES.map(cl=>{const isCur=cls.id===cl.id;return(
            <div key={cl.id} style={{background:isCur?`${cl.color}0e`:"#0e0b1a",border:`1px solid ${isCur?cl.color:"#1a0a2e"}`,borderRadius:12,padding:"11px 13px",marginBottom:7,boxShadow:isCur?`0 0 12px ${cl.color}15`:""}}>
              <div style={{display:"flex",gap:7,marginBottom:3,alignItems:"center"}}>
                <span style={{fontSize:13,fontWeight:800,color:cl.color,fontFamily:"Cinzel,serif"}}>{cl.name}</span>
                {isCur&&<span style={{fontSize:9,background:cl.color+"20",color:cl.color,borderRadius:5,padding:"2px 6px",fontWeight:700,letterSpacing:1}}>ТЕКУЩИЙ</span>}
              </div>
              <div style={{fontSize:11,color:"#5a3fa0",marginBottom:3,fontFamily:"Rajdhani,sans-serif",fontStyle:"italic"}}>{cl.motivation.slice(0,80)}...</div>
              <div style={{fontSize:11,color:"#d4a017",fontFamily:"Rajdhani,sans-serif"}}>▸ {cl.bonus}</div>
            </div>);})}
        </div>
      </div>}

      {/* Settings */}
      {showSettings&&<div style={S.overlay} onClick={()=>{setShowSettings(false);setResetStep(0);}}>
        <div style={{background:"#0a0714",border:"1px solid #2a1f4a",borderRadius:20,padding:20,width:"min(380px,92vw)",maxHeight:"85vh",overflow:"auto"}} onClick={e=>e.stopPropagation()}>
          <div style={{fontWeight:900,color:"#d4a017",fontSize:15,marginBottom:16,fontFamily:"Cinzel,serif",letterSpacing:1}}>⚙️ НАСТРОЙКИ</div>
          <div style={S.settCard}>
            <div style={S.settTitle}>🌟 Моя цель</div>
            <div style={{fontSize:12,color:"#5a3fa0",marginBottom:10,fontStyle:"italic",fontFamily:"Rajdhani,sans-serif"}}>"{gs.goal||"Не задана"}"</div>
            <button onClick={()=>{setShowSettings(false);setTimeout(()=>setShowGoal(true),200);}} style={{...S.bGray,width:"100%",padding:"9px",fontSize:12}}>✏️ Изменить цель</button>
          </div>
          <div style={S.settCard}>
            <div style={S.settTitle}>📤 Поделиться прогрессом</div>
            <button onClick={()=>{setShowSettings(false);setTimeout(()=>setShowShare(true),200);}} style={{...S.bWin,width:"100%",padding:"10px",fontSize:13,fontFamily:"Cinzel,serif"}}>⚔️ Карточка персонажа</button>
          </div>
          <div style={S.settCard}>
            <div style={S.settTitle}>🔄 Сферы развития</div>
            <div style={{fontSize:11,color:"#5a3fa0",marginBottom:8,fontFamily:"Rajdhani,sans-serif"}}>Активно: {(gs.selectedSpheres||[]).length}/5</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:8}}>
              {SPHERES.map(sp=>{
                const isSel=(gs.selectedSpheres||[]).includes(sp.id);
                const cat=SPHERE_CATS.find(c=>c.id===sp.stat);
                const maxSpheres=gs.sphere5Notified?5:gs.sphere4Notified?4:3;
                const canAdd=!isSel&&(gs.selectedSpheres||[]).length<maxSpheres;
                return <button key={sp.id} onClick={()=>{
                  if(isSel) upd(prev=>({...prev,selectedSpheres:(prev.selectedSpheres||[]).filter(x=>x!==sp.id),customDaily:(prev.customDaily||[]).filter(q=>!q.id.startsWith(`init-${sp.id}`))}));
                  else if(canAdd){
                    const newQs=sp.quests.map((q,i)=>({id:`init-${sp.id}-${i}-${Date.now()}`,title:q.title,desc:q.desc,xp:q.xp,stat:sp.stat,catId:sp.stat,icon:sp.icon}));
                    upd(prev=>({...prev,selectedSpheres:[...(prev.selectedSpheres||[]),sp.id],customDaily:[...(prev.customDaily||[]),...newQs]}));
                    pop(`✅ "${sp.name}" добавлена!`);
                  } else if(!canAdd&&!isSel) pop(`Разблокируется позже (текущий лимит: ${maxSpheres})`,false);
                }} style={{background:isSel?`${cat?.color||"#7c3aed"}15`:"#07060d",border:`1px solid ${isSel?cat?.color||"#7c3aed":"#1a0a2e"}`,borderRadius:8,padding:"5px 9px",cursor:"pointer",color:isSel?cat?.color||"#7c3aed":"#5a3fa0",fontSize:10,fontWeight:isSel?700:400,opacity:!isSel&&!canAdd?.35:1}}>
                  {sp.icon} {sp.name} {isSel?"✓":""}
                </button>;
              })}
            </div>
            <div style={{fontSize:10,color:"#2a1f4a",fontFamily:"Rajdhani,sans-serif"}}>4-я сфера открывается через 7 дней • 5-я через 30 дней</div>
          </div>
          <div style={S.settCard}>
            <div style={S.settTitle}>🛡 Добавить привычку</div>
            {DEFAULT_HABITS.filter(h=>!gs.habits.find(x=>x.id===h.id)).map(h=>(
              <button key={h.id} onClick={()=>addHabitFromList(h)} style={{width:"100%",background:"#07060d",border:"1px solid #1a0a2e",borderRadius:9,padding:"9px 12px",marginBottom:5,cursor:"pointer",display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontSize:18}}>{h.icon}</span>
                <span style={{fontSize:12,color:"#7c6a9a",fontFamily:"Rajdhani,sans-serif"}}>{h.name}</span>
                <span style={{marginLeft:"auto",color:"#4ade80",fontSize:11}}>+</span>
              </button>
            ))}
            {DEFAULT_HABITS.every(h=>gs.habits.find(x=>x.id===h.id))&&<div style={{fontSize:11,color:"#2a1f4a",textAlign:"center"}}>Все привычки добавлены</div>}
          </div>
          <div style={{...S.settCard,border:"1px solid #3a0a0a"}}>
            <div style={{...S.settTitle,color:"#e05555"}}>💀 Начать заново</div>
            <div style={{fontSize:11,color:"#5a3fa0",marginBottom:10,fontFamily:"Rajdhani,sans-serif"}}>Полное удаление всего. Персонаж, статы, достижения — всё стирается навсегда.</div>
            {resetStep===0&&<button onClick={()=>setResetStep(1)} style={{...S.bFail,width:"100%",padding:"10px",fontSize:12}}>Начать заново...</button>}
            {resetStep===1&&<div>
              <div style={{fontSize:12,color:"#e05555",marginBottom:10,textAlign:"center",fontFamily:"Cinzel,serif"}}>⚠️ Это необратимо</div>
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>setResetStep(2)} style={{...S.bFail,flex:1,padding:"10px",fontSize:12}}>Да, стереть всё</button>
                <button onClick={()=>setResetStep(0)} style={{...S.bGray,padding:"10px 14px"}}>Нет</button>
              </div>
            </div>}
            {resetStep===2&&<div>
              <div style={{fontSize:12,color:"#e05555",marginBottom:10,textAlign:"center",fontFamily:"Cinzel,serif"}}>⚠️ Последнее предупреждение</div>
              <div style={{display:"flex",gap:8}}>
                <button onClick={doReset} style={{background:"#3a0a0a",border:"2px solid #e05555",borderRadius:9,color:"#e05555",padding:"11px",flex:1,cursor:"pointer",fontSize:13,fontWeight:800,fontFamily:"Cinzel,serif"}}>💀 УНИЧТОЖИТЬ ВСЁ</button>
                <button onClick={()=>setResetStep(0)} style={{...S.bGray,padding:"11px 14px"}}>Нет</button>
              </div>
            </div>}
          </div>
          <button onClick={()=>{setShowSettings(false);setResetStep(0);}} style={{...S.bGray,width:"100%",padding:"11px",fontSize:13,borderRadius:12,fontFamily:"Cinzel,serif",marginTop:4}}>Закрыть</button>
        </div>
      </div>}

      {/* Toast */}
      {toast&&<div style={{...S.toast,background:toast.ok?"#0a1a0a":"#1a0a0a",borderColor:toast.ok?"#4ade80":"#e05555"}}>{toast.msg}</div>}

      {/* Undo */}
      {undoSnap&&<div style={{background:"#0a0714",borderBottom:"1px solid #1a0a2e",padding:"7px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span style={{fontSize:11,color:"#5a3fa0",fontFamily:"Rajdhani,sans-serif"}}>Случайно нажал?</span>
        <button onClick={doUndo} style={{...S.bFail,padding:"4px 11px",fontSize:11}}>↩️ Отмена ({undoSecs}с)</button>
      </div>}

      {/* ══ HEADER ══ */}
      <div style={S.header}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
          <div>
            {editName?<div style={{display:"flex",gap:5}}>
              <input value={tmpName} onChange={e=>setTmpName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&(upd(p=>({...p,name:tmpName||p.name})),setEditName(false))} autoFocus style={S.nameIn}/>
              <button onClick={()=>{upd(p=>({...p,name:tmpName||p.name}));setEditName(false);}} style={S.bGreen}>✓</button>
              <button onClick={()=>setEditName(false)} style={S.bGray}>✗</button>
            </div>:<div style={{display:"flex",alignItems:"center",gap:7}}>
              <span style={{fontSize:22,fontWeight:900,color:"#d4a017",fontFamily:"Cinzel,serif",textShadow:"0 0 15px #d4a01750"}}>{gs.name}</span>
              {gs.deathCount>0&&<span style={{fontSize:10,color:"#e05555",border:"1px solid #3a0a0a",borderRadius:5,padding:"1px 5px",fontFamily:"Rajdhani,sans-serif"}}>💀×{gs.deathCount}</span>}
              <button onClick={()=>{setTmpName(gs.name);setEditName(true);}} style={{background:"none",border:"none",cursor:"pointer",color:"#2a1f4a",fontSize:11,padding:0}}>✏️</button>
            </div>}
            <div style={{display:"flex",gap:5,marginTop:5,flexWrap:"wrap"}}>
              <button onClick={()=>setShowLevels(true)} style={{background:"none",border:"1px solid #1a0a2e",borderRadius:6,cursor:"pointer",color:"#7c6a9a",fontSize:10,padding:"2px 7px",fontFamily:"Cinzel,serif"}}>{getLvlName(lvi.level)} ▸</button>
            </div>
          </div>
          <div style={{display:"flex",gap:5,flexWrap:"wrap",justifyContent:"flex-end"}}>
            <div style={{...S.badge,border:"1px solid #5a3a0a",color:"#d4a017",background:"#1a1005",fontFamily:"Rajdhani,sans-serif"}}>💰 {gs.gold}</div>
            {multS&&<div style={{...S.badge,border:"1px solid #5a2a00",color:"#f97316",background:"#1a0a00",fontFamily:"Rajdhani,sans-serif"}}>🔥{multS}</div>}
            <button onClick={()=>setShowHpTip(true)} style={{...S.badge,border:`1px solid ${hpP<30?"#8b1a1a":"#1a3a1a"}`,color:hpP<30?"#e05555":"#4ade80",background:hpP<30?"#1a0808":"#081a08",cursor:"pointer",animation:hpP<30?"pulse .8s infinite":"none",fontFamily:"Rajdhani,sans-serif"}}>❤️ {gs.hp}</button>
            <button onClick={()=>setShowSettings(true)} style={{...S.badge,background:"#0e0b1a",border:"1px solid #1a0a2e",color:"#5a3fa0",cursor:"pointer",fontSize:14}}>⚙️</button>
          </div>
        </div>

        {/* Class */}
        <button onClick={()=>setShowClasses(true)} style={{background:`${cls.color}08`,border:`1px solid ${cls.color}25`,borderRadius:8,padding:"5px 10px",marginBottom:9,display:"flex",alignItems:"center",gap:7,width:"100%",cursor:"pointer",textAlign:"left"}}>
          <span style={{fontSize:12,fontWeight:700,color:cls.color,fontFamily:"Cinzel,serif"}}>{cls.name}</span>
          <span style={{fontSize:9,color:"#2a1f4a"}}>|</span>
          <span style={{fontSize:10,color:"#5a3fa0",flex:1,fontFamily:"Rajdhani,sans-serif"}}>{cls.bonus}</span>
          <span style={{fontSize:9,color:"#2a1f4a"}}>все ▸</span>
        </button>

        {/* Goal */}
        {gs.goal&&<button onClick={()=>setShowGoal(true)} style={{background:"#0a0814",border:"1px solid #d4a01718",borderRadius:8,padding:"5px 10px",marginBottom:9,width:"100%",cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:7}}>
          <span style={{fontSize:13}}>🌟</span>
          <span style={{fontSize:11,color:"#d4a01770",fontStyle:"italic",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1,fontFamily:"Rajdhani,sans-serif"}}>{gs.goal}</span>
        </button>}

        {/* XP */}
        <div style={{marginBottom:8}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:10,marginBottom:3}}>
            <span style={{color:"#5a3fa0",fontWeight:700,letterSpacing:1,fontFamily:"Cinzel,serif"}}>ОПЫТ</span>
            <span style={{color:"#7c6a9a",fontFamily:"Rajdhani,sans-serif"}}>{lvi.xpIn.toLocaleString()} / {lvi.xpTo.toLocaleString()}</span>
          </div>
          <div style={{height:10,background:"#0a0714",borderRadius:5,overflow:"hidden",border:"1px solid #1a0a2e"}}>
            <div style={{height:"100%",width:`${xpP}%`,background:"linear-gradient(90deg,#5a3fa0,#7c3aed,#a855f7)",borderRadius:5,transition:"width .6s",boxShadow:"0 0 10px #7c3aed80"}}/>
          </div>
        </div>

        {/* Daily progress */}
        <div style={{display:"flex",alignItems:"center",gap:7}}>
          <span style={{fontSize:10,color:"#2a1f4a",whiteSpace:"nowrap",fontFamily:"Rajdhani,sans-serif"}}>КВЕСТЫ {doneN}/{allDaily.length}</span>
          <div style={{flex:1,height:3,background:"#1a0a2e",borderRadius:2}}>
            <div style={{height:"100%",width:`${allDaily.length>0?(doneN/allDaily.length)*100:0}%`,background:"#d4a017",borderRadius:2,transition:"width .4s",boxShadow:"0 0 6px #d4a01780"}}/>
          </div>
          <span style={{fontSize:10,color:"#d4a017",fontWeight:700,fontFamily:"Rajdhani,sans-serif"}}>{gs.totalXp.toLocaleString()} XP</span>
        </div>
      </div>

      {/* Mini Boss */}
      {mb&&!mb.claimed&&<div style={{background:mb.completed?"#081a08":mb.accepted?"#0a0514":"#07060d",borderBottom:`1px solid ${mb.completed?"#1a5a1a":mb.accepted?"#5a1a5a":"#3a2a6a"}`,padding:"9px 13px"}}>
        <div style={{display:"flex",alignItems:"center",gap:9}}>
          <div style={{flex:1}}>
            <div style={{fontSize:9,color:mb.completed?"#4ade80":mb.accepted?"#e05555":"#7c3aed",letterSpacing:2,marginBottom:2,fontWeight:700,fontFamily:"Cinzel,serif"}}>
              {mb.completed?"✓ ВРАГ ПОВЕРЖЕН":mb.accepted?"⚔️ АКТИВНЫЙ ВРАГ":"💀 ЯВИЛСЯ ВРАГ"}
            </div>
            <div style={{fontSize:13,fontWeight:800,color:"#e2d5f0",fontFamily:"Cinzel,serif"}}>{mb.name}</div>
            {!mb.completed&&<div style={{fontSize:10,color:"#5a3fa0",marginTop:1,fontFamily:"Rajdhani,sans-serif"}}>{mb.condition} • +{mb.xp}XP • -{mb.pen}HP провал</div>}
          </div>
          {!mb.accepted&&!mb.completed&&<div style={{display:"flex",gap:5,flexShrink:0}}>
            <button onClick={acceptBoss} style={{...S.bWin,padding:"5px 9px",fontSize:11}}>⚔️</button>
            <button onClick={retreatBoss} style={{...S.bFail,padding:"5px 9px",fontSize:11}}>🏳️</button>
          </div>}
          {mb.accepted&&!mb.completed&&<span style={{color:"#f59e0b",fontSize:11,fontFamily:"Rajdhani,sans-serif"}}>В бою...</span>}
          {mb.completed&&<button onClick={claimBoss} style={{...S.bWin,padding:"5px 9px",fontSize:11,flexShrink:0}}>🏆</button>}
        </div>
      </div>}

      {/* Sprint banners */}
      {activeSprints.map(sp=><div key={sp.id} style={{background:"#07060d",borderBottom:"1px solid #1a0a2e",padding:"6px 13px",display:"flex",alignItems:"center",gap:9}}>
        <span style={{fontSize:12}}>🎯</span>
        <div style={{flex:1}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
            <span style={{fontSize:11,fontWeight:700,color:"#e2d5f0",fontFamily:"Cinzel,serif"}}>{sp.name}</span>
            <span style={{fontSize:10,color:daysLeft(sp.endDate)<=3?"#f59e0b":"#5a3fa0",fontFamily:"Rajdhani,sans-serif"}}>{daysLeft(sp.endDate)} дн.</span>
          </div>
          <div style={{height:3,background:"#1a0a2e",borderRadius:2}}>
            <div style={{height:"100%",width:`${Math.max(5,Math.round(((sp.duration-daysLeft(sp.endDate))/sp.duration)*100))}%`,background:"linear-gradient(90deg,#5a3fa0,#7c3aed)",borderRadius:2,boxShadow:"0 0 5px #7c3aed50"}}/>
          </div>
        </div>
      </div>)}

      {/* ══ TABS ══ */}
      <div style={S.tabs}>
        {[["quests","⚔️ Квесты"],["sprints","🎯 Спринты"],["habits","🛡 Привычки"],["shop","🔓 Разрешения"],["chronicles","📊 Статистика"]].map(([t,l])=>(
          <button key={t} onClick={()=>setTab(t)} style={{...S.tab,color:tab===t?"#d4a017":"#2a1f4a",borderBottom:`2px solid ${tab===t?"#d4a017":"transparent"}`,fontWeight:tab===t?700:500,fontFamily:tab===t?"Cinzel,serif":"inherit",fontSize:tab===t?10:9}}>{l}</button>
        ))}
      </div>

      {/* ══ QUESTS ══ */}
      {tab==="quests"&&<div>
        <div style={{display:"flex",background:"#07060d",borderBottom:"1px solid #1a0a2e",padding:"0 10px",gap:1}}>
          {[["daily","Дейли"],["boss","Боссы"],["once","Разовые"],["rest","Отдых"]].map(([t,l])=>(
            <button key={t} onClick={()=>setSub(t)} style={{background:"none",border:"none",cursor:"pointer",color:sub===t?"#d4a017":"#2a1f4a",fontWeight:sub===t?700:400,fontSize:11,padding:"9px 8px 8px",borderBottom:`2px solid ${sub===t?"#d4a017":"transparent"}`,fontFamily:sub===t?"Cinzel,serif":"inherit"}}>{l}</button>
          ))}
        </div>
        <div style={S.body}>

          {sub==="daily"&&<div>
            {SPHERE_CATS.map(cat=>{
              const catQs=allDaily.filter(q=>q.catId===cat.id||q.stat===cat.id);
              if(catQs.length===0) return null;
              const st=STATS[cat.id];
              return <div key={cat.id} style={{marginBottom:20}}>
                <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:9}}>
                  <div style={{width:3,height:20,background:st.color,borderRadius:2,boxShadow:`0 0 8px ${st.color}60`}}/>
                  <span style={{fontSize:11,fontWeight:800,color:st.color,textTransform:"uppercase",letterSpacing:"2px",fontFamily:"Cinzel,serif"}}>{st.icon} {st.name}</span>
                </div>
                {catQs.map(def=>{
                  const q=mergeQ(def),done=gs.daily[q.id],isEd=editingQ===q.id;
                  const bXP=Math.min(Math.floor((q.xp||50)*MAX_XP_MULT),multS?Math.floor((q.xp||50)*(1+gs.combo*0.1)):(q.xp||50));
                  return <div key={q.id}>
                    {isEd?<div style={{background:"#0e0b1a",border:`1px solid ${st.color}50`,borderRadius:12,padding:12,marginBottom:8}}>
                      <input value={editBuf.title||""} onChange={e=>setEditBuf(b=>({...b,title:e.target.value}))} placeholder="Название" style={{...S.inp,marginBottom:6}}/>
                      <input value={editBuf.desc||""} onChange={e=>setEditBuf(b=>({...b,desc:e.target.value}))} placeholder="Описание" style={{...S.inp,marginBottom:6}}/>
                      <div style={{display:"flex",gap:7,alignItems:"center",marginBottom:8}}>
                        <input type="number" value={editBuf.xp||50} onChange={e=>setEditBuf(b=>({...b,xp:Math.min(200,parseInt(e.target.value)||50)}))} style={{...S.inp,width:70}}/>
                        <span style={{color:"#5a3fa0",fontSize:11,fontFamily:"Rajdhani,sans-serif"}}>XP (макс 200)</span>
                      </div>
                      <div style={{display:"flex",gap:7}}>
                        <button onClick={saveQEdit} style={{...S.bWin,flex:1,padding:"7px"}}>✓</button>
                        <button onClick={()=>{upd(prev=>({...prev,customDaily:(prev.customDaily||[]).filter(x=>x.id!==q.id)}));setEditingQ(null);}} style={{...S.bFail,padding:"7px 11px"}}>🗑</button>
                        <button onClick={()=>setEditingQ(null)} style={{...S.bGray,padding:"7px 11px"}}>✗</button>
                      </div>
                    </div>:<div style={{background:done?"#081a08":"#0e0b1a",border:`1px solid ${done?"#1a5a1a":"#1a0a2e"}`,borderRadius:11,padding:"9px 10px",marginBottom:5,display:"flex",alignItems:"center",gap:8,opacity:done?.6:1,transition:"all .2s"}}
                      onMouseEnter={e=>{if(!done){e.currentTarget.style.borderColor=st.color+"50";e.currentTarget.style.transform="translateX(2px)";}}}
                      onMouseLeave={e=>{if(!done){e.currentTarget.style.borderColor="#1a0a2e";e.currentTarget.style.transform="none";}}}>
                      <span style={{fontSize:22,cursor:done?"default":"pointer"}} onClick={()=>!done&&setPendingQ({q,isBoss:false})}>{q.icon||"⚡"}</span>
                      <div style={{flex:1,cursor:done?"default":"pointer"}} onClick={()=>!done&&setPendingQ({q,isBoss:false})}>
                        <div style={{fontWeight:700,fontSize:12,color:done?"#4ade80":"#e2d5f0",textDecoration:done?"line-through":"none",fontFamily:"Rajdhani,sans-serif"}}>{q.title}</div>
                        <div style={{fontSize:10,color:"#2a1f4a",marginTop:1,fontFamily:"Rajdhani,sans-serif"}}>{q.desc}</div>
                        <div style={{fontSize:10,marginTop:2,display:"flex",gap:6}}>
                          <span style={{color:"#d4a017",fontWeight:600,fontFamily:"Rajdhani,sans-serif"}}>+{bXP} XP</span>
                          {multS&&!done&&<span style={{color:st.color,fontSize:10,fontFamily:"Rajdhani,sans-serif"}}>{multS}</span>}
                        </div>
                      </div>
                      <button onClick={()=>{setEditingQ(q.id);setEditBuf({title:q.title,desc:q.desc,xp:q.xp});}} style={{background:"none",border:"none",cursor:"pointer",color:"#2a1f4a",fontSize:12,padding:"2px"}}>✏️</button>
                      <div onClick={()=>!done&&setPendingQ({q,isBoss:false})} style={{width:28,height:28,borderRadius:7,border:`2px solid ${done?"#4ade80":st.color}`,background:done?"#0a2a0a":"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:done?"#4ade80":st.color,flexShrink:0,cursor:done?"default":"pointer",boxShadow:done?"0 0 8px #4ade8025":""}}>
                        {done?"✓":""}
                      </div>
                    </div>}
                  </div>;
                })}
              </div>;
            })}
            {showAddQ?<div style={{background:"#0e0b1a",border:"1px solid #2a1f4a",borderRadius:12,padding:13,marginBottom:10}}>
              <div style={{fontSize:12,color:"#d4a017",fontWeight:700,marginBottom:10,fontFamily:"Cinzel,serif"}}>+ НОВЫЙ ДЕЙЛИ КВЕСТ</div>
              <input value={addQBuf.title} onChange={e=>setAddQBuf(b=>({...b,title:e.target.value}))} placeholder="Название..." style={{...S.inp,marginBottom:6}}/>
              <input value={addQBuf.desc} onChange={e=>setAddQBuf(b=>({...b,desc:e.target.value}))} placeholder="Описание..." style={{...S.inp,marginBottom:7}}/>
              <div style={{display:"flex",gap:8,marginBottom:9}}>
                <div style={{flex:1}}><div style={{fontSize:10,color:"#5a3fa0",marginBottom:3,fontFamily:"Cinzel,serif"}}>Стат</div>
                  <select value={addQBuf.stat} onChange={e=>setAddQBuf(b=>({...b,stat:e.target.value}))} style={S.sel}>
                    {SPHERE_CATS.map(c=><option key={c.id} value={c.id}>{STATS[c.id]?.icon} {STATS[c.id]?.name}</option>)}
                  </select>
                </div>
                <div style={{flex:1}}><div style={{fontSize:10,color:"#5a3fa0",marginBottom:3,fontFamily:"Cinzel,serif"}}>XP (макс 200)</div>
                  <input type="number" value={addQBuf.xp} onChange={e=>setAddQBuf(b=>({...b,xp:Math.min(200,parseInt(e.target.value)||50)}))} style={S.inp}/>
                </div>
              </div>
              <div style={{display:"flex",gap:7}}>
                <button onClick={addCustomDaily} style={{...S.bWin,flex:1,padding:"8px",fontFamily:"Cinzel,serif"}}>✓ Добавить</button>
                <button onClick={()=>setShowAddQ(false)} style={{...S.bGray,padding:"8px 11px"}}>✗</button>
              </div>
            </div>:<button onClick={()=>setShowAddQ(true)} style={{...S.bGray,width:"100%",padding:"10px",fontSize:12,borderRadius:10,marginBottom:6}}>+ Добавить дейли квест</button>}
          </div>}

          {sub==="boss"&&<div>
            <div style={{background:"#07060d",border:"1px solid #1a0a2e",borderRadius:10,padding:"10px 13px",marginBottom:12,fontSize:11,color:"#5a3fa0",lineHeight:1.7,fontFamily:"Rajdhani,sans-serif"}}>
              ⚔️ Боссы — недельные вызовы. Добавляй из шаблонов или создавай свои. Честно отмечай победу или провал.
            </div>
            {allBossQuests.map(q=>{
              const status=gs.bossQuests?.[q.id];
              const isEd=editingQ===q.id;
              const merged=mergeQ(q);
              return <div key={q.id}>
                {isEd?<div style={{background:"#0e0b1a",border:"1px solid #5a3fa0",borderRadius:12,padding:13,marginBottom:11}}>
                  <input value={editBuf.title||""} onChange={e=>setEditBuf(b=>({...b,title:e.target.value}))} placeholder="Название" style={{...S.inp,marginBottom:6}}/>
                  <div style={{display:"flex",gap:8,marginBottom:8}}>
                    <div style={{flex:1}}><div style={{fontSize:10,color:"#5a3fa0",marginBottom:3}}>XP</div><input type="number" value={editBuf.xp||250} onChange={e=>setEditBuf(b=>({...b,xp:e.target.value}))} style={S.inp}/></div>
                  </div>
                  <div style={{fontSize:11,color:"#5a3fa0",marginBottom:6,fontFamily:"Cinzel,serif"}}>ШТРАФ ЗА ПРОВАЛ</div>
                  <div style={{display:"flex",gap:5,marginBottom:8}}>
                    {BOSS_PENALTIES.map(p=>(
                      <button key={p.hp} onClick={()=>setEditBuf(b=>({...b,pen:p.hp}))} style={{flex:1,background:(editBuf.pen||30)===p.hp?`${p.color}12`:"#07060d",border:`1px solid ${(editBuf.pen||30)===p.hp?p.color:"#1a0a2e"}`,borderRadius:9,padding:"7px 4px",cursor:"pointer",color:p.color,fontSize:10,fontWeight:(editBuf.pen||30)===p.hp?700:400,textAlign:"center",lineHeight:1.4,fontFamily:"Rajdhani,sans-serif"}}>
                        {p.label}<br/><span style={{fontSize:9,color:"#5a3fa0"}}>-{p.hp}HP</span>
                      </button>
                    ))}
                  </div>
                  <div style={{display:"flex",gap:7}}>
                    <button onClick={saveQEdit} style={{...S.bWin,flex:1,padding:"8px"}}>✓</button>
                    <button onClick={()=>setEditingQ(null)} style={{...S.bGray,padding:"8px 11px"}}>✗</button>
                  </div>
                </div>:<div style={{background:status==="done"?"#081a08":status==="fail"?"#1a0808":"#0e0b1a",border:`1px solid ${status==="done"?"#1a5a1a":status==="fail"?"#5a1a1a":"#3a2a6a"}`,borderRadius:13,padding:"11px 13px",marginBottom:10}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                    <span style={{fontSize:26}}>{q.icon}</span>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:800,fontSize:13,color:status==="done"?"#4ade80":status==="fail"?"#e05555":"#c4b5fd",fontFamily:"Cinzel,serif"}}>{merged.title}</div>
                      <div style={{fontSize:10,color:STATS[q.stat]?.color,marginTop:2,fontFamily:"Rajdhani,sans-serif"}}>{STATS[q.stat]?.icon} {STATS[q.stat]?.name}</div>
                    </div>
                    {!status&&<div style={{display:"flex",gap:5}}>
                      <button onClick={()=>{setEditingQ(q.id);setEditBuf({title:merged.title,xp:merged.xp,pen:merged.pen||40});}} style={{background:"none",border:"none",cursor:"pointer",color:"#2a1f4a",fontSize:12,padding:"2px"}}>✏️</button>
                      <button onClick={()=>delCustomBoss(q.id)} style={{background:"none",border:"none",cursor:"pointer",color:"#3a0a0a",fontSize:12,padding:"2px"}}>🗑</button>
                    </div>}
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div style={{display:"flex",gap:9}}>
                      <span style={{color:"#d4a017",fontSize:12,fontWeight:700,fontFamily:"Rajdhani,sans-serif"}}>+{merged.xp} XP</span>
                      <span style={{color:"#e05555",fontSize:11,fontFamily:"Rajdhani,sans-serif"}}>⚠️ -{merged.pen||40} HP</span>
                    </div>
                    {!status&&<div style={{display:"flex",gap:6}}>
                      <button onClick={()=>clickBossWin(merged)} style={S.bWin}>✓ Победа</button>
                      <button onClick={()=>failBossQ(merged)} style={S.bFail}>✗ Провал</button>
                    </div>}
                    {status==="done"&&<span style={{color:"#4ade80",fontWeight:800,fontSize:12,fontFamily:"Cinzel,serif"}}>⚔️ ПОБЕДА</span>}
                    {status==="fail"&&<span style={{color:"#e05555",fontWeight:800,fontSize:12,fontFamily:"Cinzel,serif"}}>💀 ПРОВАЛ</span>}
                  </div>
                </div>}
              </div>;
            })}
            {allBossQuests.length===0&&<div style={{textAlign:"center",color:"#2a1f4a",padding:"30px 0",fontFamily:"Cinzel,serif",fontSize:13}}>Нет боссов. Добавь из шаблонов!</div>}
            {showBossTemplates&&<div style={{background:"#0e0b1a",border:"1px solid #2a1f4a",borderRadius:14,padding:14,marginBottom:12}}>
              <div style={{fontSize:12,color:"#d4a017",fontWeight:700,marginBottom:12,fontFamily:"Cinzel,serif"}}>📋 ШАБЛОНЫ</div>
              {Object.entries(BOSS_TEMPLATES).map(([stat,templates])=>(
                <div key={stat} style={{marginBottom:10}}>
                  <div style={{fontSize:10,color:STATS[stat]?.color,fontWeight:700,marginBottom:6,fontFamily:"Cinzel,serif",letterSpacing:1}}>{STATS[stat]?.icon} {STATS[stat]?.name}</div>
                  {templates.map((t,i)=>(
                    <button key={i} onClick={()=>addBossFromTemplate(t)} style={{width:"100%",background:"#07060d",border:"1px solid #1a0a2e",borderRadius:9,padding:"8px 12px",marginBottom:4,cursor:"pointer",textAlign:"left",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <span style={{fontSize:12,color:"#7c6a9a",fontFamily:"Rajdhani,sans-serif"}}>{t.title}</span>
                      <span style={{color:STATS[stat]?.color,fontSize:11}}>+</span>
                    </button>
                  ))}
                </div>
              ))}
              <button onClick={()=>setShowBossTemplates(false)} style={{...S.bGray,width:"100%",padding:"8px",marginTop:4}}>Закрыть</button>
            </div>}
            {!showBossTemplates&&!showAddBoss&&<div style={{display:"flex",gap:8,marginTop:4}}>
              <button onClick={()=>setShowBossTemplates(true)} style={{...S.bWin,flex:1,padding:"10px",fontSize:12,fontFamily:"Cinzel,serif"}}>📋 Из шаблонов</button>
              <button onClick={()=>setShowAddBoss(true)} style={{...S.bGray,flex:1,padding:"10px",fontSize:12}}>+ Свой босс</button>
            </div>}
            {showAddBoss&&<div style={{background:"#0e0b1a",border:"1px solid #2a1f4a",borderRadius:12,padding:13,marginTop:8}}>
              <input value={bossBuf.title} onChange={e=>setBossBuf(b=>({...b,title:e.target.value}))} placeholder="Название босс-квеста..." style={{...S.inp,marginBottom:7}}/>
              <div style={{display:"flex",gap:8,marginBottom:9}}>
                <div style={{flex:1}}><div style={{fontSize:10,color:"#5a3fa0",marginBottom:3}}>Стат</div>
                  <select value={bossBuf.stat} onChange={e=>setBossBuf(b=>({...b,stat:e.target.value}))} style={S.sel}>
                    {SPHERE_CATS.map(c=><option key={c.id} value={c.id}>{STATS[c.id]?.icon} {STATS[c.id]?.name}</option>)}
                  </select>
                </div>
                <div style={{flex:1}}><div style={{fontSize:10,color:"#5a3fa0",marginBottom:3}}>XP</div><input type="number" value={bossBuf.xp} onChange={e=>setBossBuf(b=>({...b,xp:e.target.value}))} style={S.inp}/></div>
              </div>
              <div style={{fontSize:11,color:"#5a3fa0",marginBottom:6,fontFamily:"Cinzel,serif"}}>ШТРАФ ЗА ПРОВАЛ</div>
              <div style={{display:"flex",gap:6,marginBottom:9}}>
                {BOSS_PENALTIES.map(p=>(
                  <button key={p.hp} onClick={()=>setBossBuf(b=>({...b,pen:p.hp}))} style={{flex:1,background:bossBuf.pen===p.hp?`${p.color}12`:"#07060d",border:`1px solid ${bossBuf.pen===p.hp?p.color:"#1a0a2e"}`,borderRadius:9,padding:"8px 4px",cursor:"pointer",color:p.color,fontSize:11,fontWeight:bossBuf.pen===p.hp?700:400,textAlign:"center",lineHeight:1.4,fontFamily:"Rajdhani,sans-serif"}}>
                    {p.label}<br/><span style={{fontSize:10,color:"#5a3fa0"}}>-{p.hp}HP</span>
                  </button>
                ))}
              </div>
              <div style={{display:"flex",gap:7}}>
                <button onClick={addCustomBoss} style={{...S.bWin,flex:1,padding:"8px",fontFamily:"Cinzel,serif"}}>✓ Добавить</button>
                <button onClick={()=>setShowAddBoss(false)} style={{...S.bGray,padding:"8px 11px"}}>✗</button>
              </div>
            </div>}
          </div>}

          {sub==="once"&&<div>
            {!showAddQ?<button onClick={()=>setShowAddQ(true)} style={{...S.bWin,width:"100%",padding:"11px",fontSize:13,marginBottom:12,fontFamily:"Cinzel,serif"}}>+ Разовый квест</button>
            :<div style={{background:"#0e0b1a",border:"1px solid #2a1f4a",borderRadius:12,padding:13,marginBottom:12}}>
              <input value={addQBuf.title} onChange={e=>setAddQBuf(b=>({...b,title:e.target.value}))} placeholder="Название..." style={{...S.inp,marginBottom:7}}/>
              <div style={{display:"flex",gap:8,marginBottom:9}}>
                <div style={{flex:1}}><div style={{fontSize:10,color:"#5a3fa0",marginBottom:3}}>Стат</div>
                  <select value={addQBuf.stat} onChange={e=>setAddQBuf(b=>({...b,stat:e.target.value}))} style={S.sel}>
                    {SPHERE_CATS.map(c=><option key={c.id} value={c.id}>{STATS[c.id]?.icon} {STATS[c.id]?.name}</option>)}
                  </select>
                </div>
                <div style={{flex:1}}><div style={{fontSize:10,color:"#5a3fa0",marginBottom:3}}>Сложность</div>
                  <select value={addQBuf.xp} onChange={e=>setAddQBuf(b=>({...b,xp:parseInt(e.target.value)}))} style={S.sel}>
                    <option value={25}>Лёгкий (25)</option><option value={50}>Средний (50)</option>
                    <option value={100}>Сложный (100)</option><option value={200}>Эпик (200)</option>
                  </select>
                </div>
              </div>
              <div style={{display:"flex",gap:7}}>
                <button onClick={()=>{if(!addQBuf.title.trim()){pop("Введи название",false);return;}const q={id:`once-${Date.now()}`,title:addQBuf.title.trim(),desc:addQBuf.title.trim(),xp:addQBuf.xp,stat:addQBuf.stat,icon:"⚡"};upd(prev=>({...prev,customOnce:[...(prev.customOnce||[]),q]}));setShowAddQ(false);pop("✅");}} style={{...S.bWin,flex:1,padding:"8px"}}>✓</button>
                <button onClick={()=>setShowAddQ(false)} style={{...S.bGray,padding:"8px 11px"}}>✗</button>
              </div>
            </div>}
            {(gs.customOnce||[]).filter(q=>!gs.daily[q.id]).map(q=>(
              <div key={q.id} style={{background:"#0e0b1a",border:"1px solid #1a0a2e",borderRadius:10,padding:"9px 11px",marginBottom:6,display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:20}}>⚡</span>
                <div style={{flex:1,cursor:"pointer"}} onClick={()=>setPendingQ({q:{...q,catId:q.stat},isBoss:false})}>
                  <div style={{fontWeight:700,fontSize:12,color:"#e2d5f0",fontFamily:"Rajdhani,sans-serif"}}>{q.title}</div>
                  <div style={{fontSize:10,color:"#d4a017",marginTop:1,fontFamily:"Rajdhani,sans-serif"}}>+{q.xp} XP • {STATS[q.stat]?.icon}</div>
                </div>
                <button onClick={()=>upd(prev=>({...prev,customOnce:(prev.customOnce||[]).filter(c=>c.id!==q.id)}))} style={{...S.bFail,padding:"4px 8px",fontSize:11}}>🗑</button>
              </div>
            ))}
          </div>}

          {sub==="rest"&&<div style={{background:"#0e0b1a",border:"1px solid #1a0a2e",borderRadius:14,padding:20,textAlign:"center"}}>
            <div style={{fontSize:52,marginBottom:8}}>😴</div>
            <div style={{fontWeight:800,fontSize:15,color:"#e2d5f0",fontFamily:"Cinzel,serif",marginBottom:12}}>День Отдыха</div>
            <div style={{fontSize:12,color:"#7c6a9a",marginBottom:16,fontFamily:"Rajdhani,sans-serif",lineHeight:1.9}}>
              <span style={{color:"#4ade80"}}>1-й за неделю</span>: +30G, комбо цел, +10 HP<br/>
              <span style={{color:"#e05555"}}>2-й+</span>: -20G, -1 комбо, +10 HP<br/>
              <span style={{color:"#60a5fa",fontSize:11}}>◆ Все дейли → +5 HP | Ничего не делал → -10 HP</span><br/>
              <span style={{color:"#2a1f4a",fontSize:11}}>Использовано: {gs.restWeek}/2</span>
            </div>
            {gs.daily.REST?<div style={{color:"#60a5fa",fontWeight:700,fontFamily:"Cinzel,serif"}}>✓ Сегодня день отдыха</div>
              :<button onClick={takeRest} style={{...S.bWin,width:"100%",padding:"13px",fontSize:14,fontFamily:"Cinzel,serif",letterSpacing:1}}>😴 Взять день отдыха</button>}
          </div>}
        </div>
      </div>}

      {/* ══ SPRINTS ══ */}
      {tab==="sprints"&&<div style={S.body}>
        <div style={{fontSize:12,color:"#5a3fa0",marginBottom:12,lineHeight:1.7,fontFamily:"Rajdhani,sans-serif"}}>
          Спринт — большая цель на несколько недель. Цель описываешь сам. Перед завершением нужно написать рефлексию.
        </div>
        {(gs.sprints||[]).map(sp=>{
          const days=daysLeft(sp.endDate),elapsed=sp.duration-days;
          const pct=Math.min(100,Math.round((elapsed/sp.duration)*100));
          const sc=sp.completed?"#4ade80":sp.failed?"#e05555":days<=3?"#f59e0b":"#7c3aed";
          const st=sp.completed?"✓ ЗАВЕРШЁН":sp.failed?"✗ ПРОВАЛЕН":days<=3?`⚠️ ${days}д`:`${days}д`;
          return <div key={sp.id} style={{background:sp.completed?"#081a08":sp.failed?"#1a0808":"#0e0b1a",border:`1px solid ${sc}25`,borderRadius:16,padding:16,marginBottom:14,boxShadow:`0 0 15px ${sc}08`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
              <div style={{flex:1}}>
                <div style={{fontWeight:800,fontSize:14,color:"#e2d5f0",fontFamily:"Cinzel,serif"}}>{sp.name}</div>
                {sp.reward&&<div style={{fontSize:11,color:"#4ade80",marginTop:3,fontFamily:"Rajdhani,sans-serif"}}>🎁 {sp.reward}</div>}
                {sp.reflection&&<div style={{fontSize:11,color:"#5a3fa0",marginTop:3,fontStyle:"italic",fontFamily:"Rajdhani,sans-serif"}}>"{sp.reflection}"</div>}
              </div>
              <div style={{display:"flex",gap:5,alignItems:"center"}}>
                <div style={{background:`${sc}12`,border:`1px solid ${sc}35`,borderRadius:7,padding:"3px 8px",fontSize:11,fontWeight:700,color:sc,fontFamily:"Cinzel,serif"}}>{st}</div>
                {(sp.completed||sp.failed)&&<button onClick={()=>deleteSprint(sp.id)} style={{background:"none",border:"none",cursor:"pointer",color:"#2a1f4a",fontSize:13}}>🗑</button>}
              </div>
            </div>
            <div style={{marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                <span style={{fontSize:10,color:"#5a3fa0",fontFamily:"Cinzel,serif",letterSpacing:1}}>ПРОГРЕСС</span>
                <span style={{fontSize:11,fontWeight:700,color:sc,fontFamily:"Rajdhani,sans-serif"}}>{elapsed}/{sp.duration} дней</span>
              </div>
              <div style={{height:8,background:"#07060d",borderRadius:4,overflow:"hidden",border:"1px solid #1a0a2e"}}>
                <div style={{height:"100%",width:`${pct}%`,background:sp.completed?"#4ade80":sp.failed?"#e05555":"linear-gradient(90deg,#5a3fa0,#7c3aed)",borderRadius:4,boxShadow:`0 0 8px ${sc}30`}}/>
              </div>
            </div>
            <div style={{display:"flex",gap:2,marginBottom:12,flexWrap:"wrap"}}>
              {Array.from({length:sp.duration},(_,i)=>{const d=new Date(sp.startDate);d.setDate(d.getDate()+i);const isToday=d.toDateString()===today(),isPast=d<new Date()&&!isToday;return<div key={i} style={{width:10,height:10,borderRadius:2,background:isToday?"#7c3aed":isPast?sp.completed?"#1a5a1a":"#2a1f4a":"#07060d",border:isToday?"1px solid #7c3aed":"none"}}/>;}) }
            </div>
            <div style={{background:"#07060d",borderRadius:9,padding:"8px 12px",display:"flex",gap:8,justifyContent:"space-between",marginBottom:!sp.completed&&!sp.failed?10:0,border:"1px solid #1a0a2e"}}>
              <div style={{textAlign:"center"}}><div style={{fontSize:9,color:"#2a1f4a",fontFamily:"Cinzel,serif"}}>ШТРАФ</div><div style={{fontSize:11,fontWeight:700,color:"#e05555",fontFamily:"Rajdhani,sans-serif"}}>-{sp.penaltyHp}HP</div></div>
              <div style={{width:1,background:"#1a0a2e"}}/>
              <div style={{textAlign:"center"}}><div style={{fontSize:9,color:"#2a1f4a",fontFamily:"Cinzel,serif"}}>СРОК</div><div style={{fontSize:11,fontWeight:700,color:"#7c6a9a",fontFamily:"Rajdhani,sans-serif"}}>{sp.duration}д</div></div>
              <div style={{width:1,background:"#1a0a2e"}}/>
              <div style={{textAlign:"center"}}><div style={{fontSize:9,color:"#2a1f4a",fontFamily:"Cinzel,serif"}}>БОНУС</div><div style={{fontSize:11,fontWeight:700,color:"#d4a017",fontFamily:"Rajdhani,sans-serif"}}>+300XP +50G</div></div>
            </div>
            {!sp.completed&&!sp.failed&&<div style={{display:"flex",gap:8}}>
              <button onClick={()=>completeSprint(sp.id)} style={{...S.bWin,flex:1,padding:"9px",fontSize:12,fontFamily:"Cinzel,serif"}}>✓ Выполнил</button>
              <button onClick={()=>failSprint(sp.id)} style={{...S.bFail,flex:1,padding:"9px",fontSize:12,fontFamily:"Cinzel,serif"}}>✗ Не выполнил</button>
            </div>}
          </div>;
        })}
        {!showSprintForm?<button onClick={()=>setShowSprintForm(true)} style={{...S.bWin,width:"100%",padding:"13px",fontSize:14,fontFamily:"Cinzel,serif",letterSpacing:1}}>🎯 Создать спринт</button>
        :<div style={{background:"#0e0b1a",border:"1px solid #2a1f4a",borderRadius:14,padding:16}}>
          <div style={{fontWeight:700,color:"#d4a017",fontSize:13,marginBottom:12,fontFamily:"Cinzel,serif",letterSpacing:1}}>🎯 НОВЫЙ СПРИНТ</div>
          <input value={sprintBuf.name} onChange={e=>setSprintBuf(b=>({...b,name:e.target.value}))} placeholder="Чего хочешь достичь? Например: Выучить основы Python..." style={{...S.inp,marginBottom:9}}/>
          <div style={{fontSize:11,color:"#5a3fa0",marginBottom:5,fontFamily:"Cinzel,serif"}}>ТВОЯ РЕАЛЬНАЯ НАГРАДА</div>
          <input value={sprintBuf.reward} onChange={e=>setSprintBuf(b=>({...b,reward:e.target.value}))} placeholder="Например: Куплю новые кроссовки..." style={{...S.inp,marginBottom:10}}/>
          <div style={{fontSize:11,color:"#5a3fa0",marginBottom:6,fontFamily:"Cinzel,serif"}}>СРОК</div>
          <div style={{display:"flex",gap:5,marginBottom:10,flexWrap:"wrap"}}>
            {SPRINT_DURATIONS.map(d=>(
              <button key={d.days} onClick={()=>setSprintBuf(b=>({...b,duration:d.days}))} style={{background:sprintBuf.duration===d.days?"#1a0a2e":"#07060d",border:`1px solid ${sprintBuf.duration===d.days?"#7c3aed":"#1a0a2e"}`,borderRadius:8,padding:"6px 10px",cursor:"pointer",color:sprintBuf.duration===d.days?"#c4b5fd":"#5a3fa0",fontSize:11,fontWeight:sprintBuf.duration===d.days?700:400,fontFamily:"Rajdhani,sans-serif"}}>
                {d.label}
              </button>
            ))}
          </div>
          <div style={{fontSize:11,color:"#5a3fa0",marginBottom:6,fontFamily:"Cinzel,serif"}}>ШТРАФ ЗА ПРОВАЛ</div>
          <div style={{display:"flex",gap:6,marginBottom:14}}>
            {SPRINT_PENALTIES.map(p=>(
              <button key={p.hp} onClick={()=>setSprintBuf(b=>({...b,penaltyHp:p.hp}))} style={{flex:1,background:sprintBuf.penaltyHp===p.hp?`${p.color}12`:"#07060d",border:`1px solid ${sprintBuf.penaltyHp===p.hp?p.color:"#1a0a2e"}`,borderRadius:9,padding:"8px 4px",cursor:"pointer",color:p.color,fontSize:11,fontWeight:sprintBuf.penaltyHp===p.hp?700:400,textAlign:"center",lineHeight:1.4,fontFamily:"Rajdhani,sans-serif"}}>
                {p.label}<br/><span style={{fontSize:10,color:"#5a3fa0"}}>-{p.hp}HP</span>
              </button>
            ))}
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={createSprint} style={{...S.bWin,flex:1,padding:"11px",fontSize:13,fontFamily:"Cinzel,serif",letterSpacing:1}}>🎯 Начать</button>
            <button onClick={()=>setShowSprintForm(false)} style={{...S.bGray,padding:"11px 14px"}}>✗</button>
          </div>
        </div>}
      </div>}

      {/* ══ HABITS ══ */}
      {tab==="habits"&&<div style={S.body}>
        <div style={{fontSize:12,color:"#5a3fa0",marginBottom:12,fontFamily:"Rajdhani,sans-serif"}}>Привычки которые хочешь <span style={{color:"#e05555"}}>искоренить</span>. Срыв: -10 HP.</div>
        {(gs.habits||[]).map(h=>{
          const checkedToday=h.lastCheck===today();
          const avMs=HABIT_MS.filter(m=>h.streak>=m.days&&!(h.claimedMs||[]).includes(m.days));
          const isEd=editingH===h.id;
          return <div key={h.id} style={{background:"#0e0b1a",border:"1px solid #1a0a2e",borderRadius:14,padding:14,marginBottom:12}}>
            {isEd?<div>
              <input value={editHBuf.name||""} onChange={e=>setEditHBuf(b=>({...b,name:e.target.value}))} style={{...S.inp,marginBottom:7}}/>
              <div style={{display:"flex",gap:5,marginBottom:10,flexWrap:"wrap"}}>
                {["🛡","🔒","🚫","💪","🧘","🥗","📵","🚭","💊","🎯"].map(ico=>(
                  <button key={ico} onClick={()=>setEditHBuf(b=>({...b,icon:ico}))} style={{fontSize:18,background:editHBuf.icon===ico?"#1a0a2e":"transparent",border:`1px solid ${editHBuf.icon===ico?"#7c3aed":"#1a0a2e"}`,borderRadius:8,padding:"4px 7px",cursor:"pointer"}}>{ico}</button>
                ))}
              </div>
              <div style={{display:"flex",gap:7}}>
                <button onClick={saveHabit} style={{...S.bWin,flex:1,padding:"8px"}}>✓</button>
                <button onClick={()=>{deleteHabit(h.id);}} style={{...S.bFail,padding:"8px 11px"}}>🗑</button>
                <button onClick={()=>setEditingH(null)} style={{...S.bGray,padding:"8px 11px"}}>✗</button>
              </div>
            </div>:<>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:11}}>
                <span style={{fontSize:32,filter:`drop-shadow(0 0 8px ${h.streak>0?"#4ade8030":"#1a0a2e"})`}}>{h.icon}</span>
                <div style={{flex:1}}>
                  <div style={{fontWeight:800,fontSize:13,color:"#e2d5f0",fontFamily:"Cinzel,serif"}}>{h.name}</div>
                  <div style={{fontSize:11,color:"#2a1f4a",marginTop:1,fontFamily:"Rajdhani,sans-serif"}}>Рекорд: {h.longest} {declDay(h.longest)}</div>
                </div>
                <div style={{textAlign:"center",marginRight:4}}>
                  <div style={{fontSize:30,fontWeight:900,color:h.streak>0?"#4ade80":"#2a1f4a",fontFamily:"Rajdhani,sans-serif",lineHeight:1,textShadow:h.streak>0?"0 0 15px #4ade8050":""}}>{h.streak}</div>
                  <div style={{fontSize:9,color:"#2a1f4a",fontFamily:"Rajdhani,sans-serif"}}>дней</div>
                </div>
                <button onClick={()=>{setEditingH(h.id);setEditHBuf({name:h.name,icon:h.icon});}} style={{background:"none",border:"none",cursor:"pointer",color:"#2a1f4a",fontSize:13,padding:"2px"}}>✏️</button>
              </div>
              <div style={{display:"flex",gap:3,marginBottom:10}}>
                {HABIT_MS.map(m=>{const done=(h.claimedMs||[]).includes(m.days),reached=h.streak>=m.days;return(
                  <div key={m.days} style={{flex:1,textAlign:"center"}}>
                    <div style={{fontSize:13,marginBottom:1,opacity:reached?1:0.2,filter:reached?`drop-shadow(0 0 4px ${done?"#4ade80":"#d4a017"})`:""}}>{m.icon}</div>
                    <div style={{fontSize:9,color:done?"#4ade80":reached?"#d4a017":"#1a0a2e",fontWeight:reached?700:400,fontFamily:"Rajdhani,sans-serif"}}>{m.days}д</div>
                  </div>);})}
              </div>
              {avMs.map(m=>(
                <button key={m.days} onClick={()=>claimHabitMs(h.id,m.days)} style={{...S.bWin,width:"100%",padding:"7px",marginBottom:6,fontSize:11,fontFamily:"Cinzel,serif"}}>
                  {m.icon} Веха {m.days} дней! +{m.gold}G {m.xp>0?`+${m.xp}XP`:""} {m.hp>0?`+${m.hp}HP`:""}
                </button>
              ))}
              <div style={{display:"flex",gap:7}}>
                <button onClick={()=>habitHold(h.id)} disabled={checkedToday} style={{...S.bWin,flex:2,padding:"10px",fontSize:12,opacity:checkedToday?.5:1,cursor:checkedToday?"default":"pointer",fontFamily:"Cinzel,serif"}}>
                  {checkedToday?"✓ Держусь сегодня":"🛡 Держусь сегодня"}
                </button>
                <button onClick={()=>{habitFail(h.id);}} style={{...S.bFail,padding:"10px 12px",fontSize:12}}>💔 Срыв</button>
              </div>
            </>}
          </div>;
        })}
        <button onClick={()=>setShowSettings(true)} style={{...S.bGray,width:"100%",padding:"10px",fontSize:12,borderRadius:11,fontFamily:"Cinzel,serif"}}>+ Добавить привычку</button>
      </div>}

      {/* ══ SHOP (renamed) ══ */}
      {tab==="shop"&&<div style={S.body}>
        <div style={{background:"#0e0b1a",border:"1px solid #5a3a0a",borderRadius:12,padding:"12px 16px",marginBottom:12,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{fontSize:10,color:"#5a3a0a",letterSpacing:2,fontFamily:"Cinzel,serif"}}>МАГАЗИН РАЗРЕШЕНИЙ</div>
            <div style={{fontSize:11,color:"#5a3fa0",fontFamily:"Rajdhani,sans-serif"}}>Заработай право на отдых</div>
          </div>
          <span style={{color:"#d4a017",fontSize:26,fontWeight:900,fontFamily:"Rajdhani,sans-serif",textShadow:"0 0 15px #d4a01740"}}>💰 {gs.gold}</span>
        </div>
        {(gs.shop||[]).map(item=>(
          <div key={item.id} style={{background:"#0e0b1a",border:"1px solid #1a0a2e",borderRadius:12,padding:"10px 12px",marginBottom:7}}>
            {editingShop===item.id?<div>
              <div style={{display:"flex",gap:7,marginBottom:7}}>
                <input value={editShopBuf.name||""} onChange={e=>setEditShopBuf(b=>({...b,name:e.target.value}))} placeholder="Название" style={{...S.inp,flex:1}}/>
                <input value={editShopBuf.icon||""} onChange={e=>setEditShopBuf(b=>({...b,icon:e.target.value}))} placeholder="🎁" style={{...S.inp,width:50}}/>
              </div>
              <div style={{display:"flex",gap:8,marginBottom:8,alignItems:"center"}}>
                <input type="number" value={editShopBuf.cost||50} onChange={e=>setEditShopBuf(b=>({...b,cost:e.target.value}))} style={{...S.inp,flex:1}}/>
                <span style={{color:"#5a3fa0",fontSize:12,fontFamily:"Rajdhani,sans-serif"}}>Gold</span>
              </div>
              <div style={{display:"flex",gap:7}}>
                <button onClick={saveShopItem} style={{...S.bWin,flex:1,padding:"7px"}}>✓</button>
                <button onClick={()=>deleteShopItem(item.id)} style={{...S.bFail,padding:"7px 10px"}}>🗑</button>
                <button onClick={()=>setEditingShop(null)} style={{...S.bGray,padding:"7px 10px"}}>✗</button>
              </div>
            </div>:<div style={{display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontSize:26}}>{item.icon}</span>
              <div style={{flex:1}}>
                <div style={{fontWeight:600,fontSize:13,color:"#e2d5f0",fontFamily:"Rajdhani,sans-serif"}}>{item.name}</div>
                <div style={{fontSize:11,color:"#d4a017",marginTop:1,fontFamily:"Rajdhani,sans-serif"}}>💰 {item.cost}G</div>
              </div>
              <button onClick={()=>{setEditingShop(item.id);setEditShopBuf({name:item.name,cost:item.cost,icon:item.icon});}} style={{background:"none",border:"none",cursor:"pointer",color:"#2a1f4a",fontSize:13}}>✏️</button>
              <button onClick={()=>buyItem(item)} disabled={gs.gold<item.cost} style={{...S.bWin,padding:"7px 13px",opacity:gs.gold<item.cost?.3:1,cursor:gs.gold<item.cost?"not-allowed":"pointer",fontSize:12,fontFamily:"Cinzel,serif"}}>Купить</button>
            </div>}
          </div>
        ))}
        <button onClick={()=>setSForm(f=>({...f,show:!f.show}))} style={{...S.bGray,width:"100%",padding:"10px",fontSize:12,borderRadius:10,marginTop:4,marginBottom:8,fontFamily:"Cinzel,serif"}}>
          {sForm.show?"✗ Закрыть":"+ Добавить разрешение"}
        </button>
        {sForm.show&&<div style={{background:"#0e0b1a",border:"1px solid #2a1f4a",borderRadius:12,padding:13}}>
          <div style={{display:"flex",gap:7,marginBottom:7}}>
            <input value={sForm.name} onChange={e=>setSForm(f=>({...f,name:e.target.value}))} placeholder="Название..." style={{...S.inp,flex:1}}/>
            <input value={sForm.icon} onChange={e=>setSForm(f=>({...f,icon:e.target.value}))} placeholder="🎁" style={{...S.inp,width:50}}/>
          </div>
          <div style={{display:"flex",gap:8,marginBottom:9,alignItems:"center"}}>
            <input type="number" value={sForm.cost} onChange={e=>setSForm(f=>({...f,cost:Math.max(1,parseInt(e.target.value)||50)}))} style={{...S.inp,flex:1}}/>
            <span style={{color:"#5a3fa0",fontSize:12,fontFamily:"Rajdhani,sans-serif"}}>Gold</span>
          </div>
          <button onClick={()=>{if(!sForm.name.trim()){pop("Введи название",false);return;}upd(prev=>({...prev,shop:[...prev.shop,{id:`sh-${Date.now()}`,name:sForm.name.trim(),cost:sForm.cost,icon:sForm.icon}]}));setSForm({show:false,name:"",cost:50,icon:"⭐"});pop("Добавлено!");}} style={{...S.bWin,width:"100%",padding:"9px",fontFamily:"Cinzel,serif"}}>Добавить</button>
        </div>}
      </div>}

      {/* ══ STATS / CHRONICLES ══ */}
      {tab==="chronicles"&&<div style={S.body}>
        {/* Hero Card */}
        <div style={{background:"linear-gradient(135deg,#0a0714,#1a0a2e,#0a0714)",border:`1px solid ${cls.color}30`,borderRadius:18,padding:20,marginBottom:12,position:"relative",overflow:"hidden",boxShadow:`0 0 20px ${cls.color}08`}}>
          <div style={{position:"absolute",top:8,left:8,width:14,height:14,borderTop:"2px solid #d4a017",borderLeft:"2px solid #d4a017"}}/>
          <div style={{position:"absolute",top:8,right:8,width:14,height:14,borderTop:"2px solid #d4a017",borderRight:"2px solid #d4a017"}}/>
          <div style={{position:"absolute",bottom:8,left:8,width:14,height:14,borderBottom:"2px solid #d4a017",borderLeft:"2px solid #d4a017"}}/>
          <div style={{position:"absolute",bottom:8,right:8,width:14,height:14,borderBottom:"2px solid #d4a017",borderRight:"2px solid #d4a017"}}/>

          <div style={{textAlign:"center",marginBottom:12}}>
            <div style={{fontSize:10,color:"#5a3fa0",letterSpacing:3,marginBottom:4,fontFamily:"Cinzel,serif"}}>ГЕРОЙ</div>
            <div style={{fontSize:22,fontWeight:900,color:"#d4a017",fontFamily:"Cinzel,serif",textShadow:"0 0 20px #d4a01750"}}>{gs.name}</div>
            <div style={{fontSize:11,color:"#7c6a9a",fontFamily:"Cinzel,serif",marginTop:2}}>{getLvlName(lvi.level)}</div>
            <div style={{fontSize:12,color:cls.color,marginTop:2,fontFamily:"Cinzel,serif"}}>{cls.name}</div>
          </div>

          {/* Radar */}
          <div style={{display:"flex",justifyContent:"center",marginBottom:14}}>
            <RadarChart stats={gs.stats||{telo:1,razum:1,vliyanie:1,volya:1,delo:1}} size={170}/>
          </div>

          {/* Class description */}
          <div style={{background:"#07060d",border:`1px solid ${cls.color}18`,borderRadius:10,padding:"10px 13px",marginBottom:14}}>
            <div style={{fontSize:10,color:cls.color,fontWeight:700,marginBottom:6,letterSpacing:1,fontFamily:"Cinzel,serif"}}>ТВОЙ КЛАСС</div>
            <div style={{fontSize:12,color:"#7c6a9a",lineHeight:1.7,fontFamily:"Rajdhani,sans-serif"}}>{cls.motivation}</div>
            <div style={{fontSize:11,color:cls.color,marginTop:6,fontFamily:"Rajdhani,sans-serif"}}>▸ {cls.bonus}</div>
          </div>

          {/* XP progress */}
          <div style={{marginBottom:4}}>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:10,marginBottom:3}}>
              <span style={{color:"#5a3fa0",fontFamily:"Cinzel,serif",letterSpacing:1}}>ДО УР.{lvi.level+1}</span>
              <span style={{color:"#7c6a9a",fontFamily:"Rajdhani,sans-serif"}}>{lvi.xpIn.toLocaleString()} / {lvi.xpTo.toLocaleString()}</span>
            </div>
            <div style={{height:6,background:"#07060d",borderRadius:3,overflow:"hidden",border:"1px solid #1a0a2e"}}>
              <div style={{height:"100%",width:`${xpP}%`,background:"linear-gradient(90deg,#5a3fa0,#7c3aed)",borderRadius:3,boxShadow:"0 0 8px #7c3aed60"}}/>
            </div>
          </div>
        </div>

        {/* Diagnostics */}
        <div style={{background:"#0e0b1a",border:"1px solid #1a0a2e",borderRadius:14,padding:16,marginBottom:12}}>
          <div style={S.cT}>🧭 ДИАГНОСТИКА</div>
          <DiagnosticsPanel gs={gs} lvi={lvi}/>
        </div>

        {/* Ring Charts */}
        <div style={{background:"#0e0b1a",border:"1px solid #1a0a2e",borderRadius:14,padding:16,marginBottom:12}}>
          <div style={S.cT}>⚡ СТАТЫ</div>
          <div style={{display:"flex",justifyContent:"space-around",marginBottom:12}}>
            {Object.keys(STATS).map(k=>(
              <button key={k} onClick={()=>setShowStatInfo(k)} style={{background:"none",border:"none",cursor:"pointer",padding:0}}>
                <RingChart stat={k} value={(gs.stats||{})[k]||1} size={68}/>
              </button>
            ))}
          </div>
          <div style={{fontSize:10,color:"#2a1f4a",textAlign:"center",fontFamily:"Rajdhani,sans-serif"}}>Нажми на кольцо чтобы узнать как качается стат</div>
        </div>

        {/* Numbers */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:12}}>
          {[["⚡","XP",(gs.totalXp||0),"#d4a017"],["🏆","Уровень",lvi.level,"#7c3aed"],["🔥","Комбо",(gs.combo||0),"#f97316"],["💰","Gold",(gs.gold||0),"#d4a017"],["❤️","HP",(gs.hp||0),"#e05555"],["💀","Смерти",(gs.deathCount||0),"#5a3fa0"]].map(([i,l,v,c])=>(
            <div key={l} style={{background:"#0e0b1a",border:`1px solid ${c}15`,borderRadius:12,padding:"11px 8px",textAlign:"center",boxShadow:`0 0 8px ${c}05`}}>
              <div style={{fontSize:16}}>{i}</div>
              <AnimCounter value={v} color={c} size={20} duration={800}/>
              <div style={{fontSize:9,color:"#2a1f4a",marginTop:1,fontFamily:"Cinzel,serif",letterSpacing:1}}>{l.toUpperCase()}</div>
            </div>
          ))}
        </div>

        {/* XP Line chart */}
        <div style={{background:"#0e0b1a",border:"1px solid #1a0a2e",borderRadius:14,padding:16,marginBottom:12}}>
          <div style={S.cT}>📈 XP ЗА 7 ДНЕЙ</div>
          <LineChart data={gs.weekXP||Array(7).fill(0)}/>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
            {["Пн","Вт","Ср","Чт","Пт","Сб","Вс"].map(d=><div key={d} style={{fontSize:9,color:"#2a1f4a",fontFamily:"Rajdhani,sans-serif"}}>{d}</div>)}
          </div>
        </div>

        {/* Weekly Reports */}
        <div style={{background:"#0e0b1a",border:"1px solid #1a0a2e",borderRadius:14,padding:16,marginBottom:12}}>
          <div style={S.cT}>📜 ЕЖЕНЕДЕЛЬНЫЕ ХРОНИКИ</div>
          {(gs.weeklyReports||[]).length===0?<div style={{textAlign:"center",color:"#2a1f4a",padding:"20px 0",fontFamily:"Rajdhani,sans-serif",fontSize:12}}>Первый отчёт появится в конце недели</div>
          :(gs.weeklyReports||[]).slice(0,6).map((r,i)=>(
            <button key={i} onClick={()=>setShowWeeklyReport(r)} style={{width:"100%",background:"#07060d",border:"1px solid #1a0a2e",borderRadius:10,padding:"10px 13px",marginBottom:7,cursor:"pointer",textAlign:"left",display:"flex",justifyContent:"space-between",alignItems:"center",transition:"all .2s"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor="#2a1f4a";}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor="#1a0a2e";}}>
              <div>
                <div style={{fontSize:12,fontWeight:700,color:"#e2d5f0",fontFamily:"Cinzel,serif"}}>Неделя #{r.week}</div>
                <div style={{fontSize:11,color:"#5a3fa0",marginTop:2,fontFamily:"Rajdhani,sans-serif"}}>{r.totalQuests} квестов • {r.totalXp} XP</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:14,fontWeight:900,color:"#d4a017",fontFamily:"Rajdhani,sans-serif"}}>{(r.totalXp||0).toLocaleString()}</div>
                <div style={{fontSize:9,color:"#2a1f4a",fontFamily:"Cinzel,serif"}}>XP</div>
              </div>
            </button>
          ))}
        </div>

        {/* Achievements */}
        <div style={{background:"#0e0b1a",border:"1px solid #1a0a2e",borderRadius:14,padding:16,marginBottom:12}}>
          <div style={S.cT}>🏅 ЛЕТОПИСЬ ПОДВИГОВ</div>
          {[
            {c:gs.totalXp>=500,ico:"⭐",n:"Первые шаги",d:"500+ XP"},
            {c:gs.totalXp>=5000,ico:"🌟",n:"На пути",d:"5 000+ XP"},
            {c:gs.totalXp>=20000,ico:"💫",n:"Ветеран",d:"20 000+ XP"},
            {c:gs.combo>=7,ico:"💎",n:"Неделя воли",d:"Комбо 7 дней"},
            {c:gs.combo>=14,ico:"🌑",n:"Теневой",d:"14 дней"},
            {c:gs.combo>=21,ico:"🌊",n:"Океан Воли",d:"21 день"},
            {c:lvi.level>=5,ico:"⚔️",n:"Воин",d:"Уровень 5"},
            {c:lvi.level>=10,ico:"🗡",n:"Паладин",d:"Уровень 10"},
            {c:lvi.level>=20,ico:"⚜️",n:"Легендарный",d:"Уровень 20"},
            {c:lvi.level>=30,ico:"👑",n:"ЛЕГЕНДА",d:"Уровень 30 — конец пути"},
            {c:(gs.habits||[]).some(h=>h.streak>=7),ico:"🛡",n:"Железная воля",d:"7 дней привычки"},
            {c:(gs.habits||[]).some(h=>h.streak>=30),ico:"🗿",n:"Несгибаемый",d:"30 дней привычки"},
            {c:(gs.sprints||[]).some(s=>s.completed),ico:"🎯",n:"Спринтер",d:"Спринт завершён"},
            {c:(gs.deathCount||0)>=1,ico:"💀",n:"Возрождённый",d:"Пережил смерть"},
          ].map(a=>(
            <div key={a.n} style={{display:"flex",alignItems:"center",gap:9,padding:"6px 0",borderBottom:"1px solid #1a0a2e",opacity:a.c?1:0.2}}>
              <span style={{fontSize:15,filter:a.c?"drop-shadow(0 0 4px #d4a01750)":""}}>{a.ico}</span>
              <div style={{flex:1}}>
                <div style={{fontSize:11,fontWeight:600,color:a.c?"#e2d5f0":"#2a1f4a",fontFamily:a.c?"Cinzel,serif":"inherit"}}>{a.n}</div>
                <div style={{fontSize:10,color:"#2a1f4a",fontFamily:"Rajdhani,sans-serif"}}>{a.d}</div>
              </div>
              {a.c&&<span style={{color:"#d4a017",fontWeight:800,fontSize:12}}>✓</span>}
            </div>
          ))}
        </div>

        {/* Log */}
        {(gs.log||[]).length>0&&<div style={{background:"#0e0b1a",border:"1px solid #1a0a2e",borderRadius:14,padding:16}}>
          <div style={S.cT}>📜 ЛЕТОПИСЬ</div>
          {(gs.log||[]).slice(0,30).map(e=>(
            <div key={e.id} style={{padding:"6px 0",borderBottom:"1px solid #1a0a2e",display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div style={{flex:1,paddingRight:8}}>
                <div style={{fontSize:11,color:e.t==="fail"?"#e05555":e.t==="boss"?"#d4a017":e.t==="rest"?"#60a5fa":"#7c6a9a",fontFamily:"Rajdhani,sans-serif"}}>{e.txt}</div>
                <div style={{fontSize:9,color:"#1a0a2e",marginTop:1,fontFamily:"Rajdhani,sans-serif"}}>{e.time}</div>
              </div>
              <div style={{textAlign:"right",flexShrink:0}}>
                {e.xp!==0&&<div style={{fontSize:11,fontWeight:700,color:e.xp>0?"#d4a017":"#e05555",fontFamily:"Rajdhani,sans-serif"}}>{e.xp>0?"+":""}{e.xp}XP</div>}
                {e.gold!==0&&<div style={{fontSize:10,color:e.gold>0?"#4ade80":"#e05555",fontFamily:"Rajdhani,sans-serif"}}>{e.gold>0?"+":""}{e.gold}G</div>}
              </div>
            </div>
          ))}
        </div>}
      </div>}
    </div>
  );
}

const S={
  root:     {background:"#07060d",minHeight:"100vh",color:"#e2d5f0",fontFamily:"'Segoe UI',system-ui,sans-serif",maxWidth:520,margin:"0 auto",position:"relative"},
  overlay:  {position:"fixed",inset:0,background:"rgba(0,0,0,.94)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:16},
  toast:    {position:"fixed",top:14,left:"50%",transform:"translateX(-50%)",zIndex:400,border:"1px solid",padding:"8px 18px",borderRadius:12,color:"#e2d5f0",fontWeight:700,fontSize:12,whiteSpace:"nowrap",boxShadow:"0 8px 32px rgba(0,0,0,.8)",fontFamily:"Rajdhani,sans-serif"},
  header:   {background:"linear-gradient(160deg,#0a0714 0%,#120a1e 100%)",padding:"14px 13px 12px",borderBottom:"1px solid #1a0a2e"},
  tabs:     {display:"flex",background:"#07060d",borderBottom:"1px solid #1a0a2e"},
  tab:      {flex:1,padding:"10px 0",background:"none",border:"none",borderBottom:"2px solid transparent",cursor:"pointer",fontSize:9,transition:"all .2s"},
  body:     {padding:"12px 12px 60px"},
  card:     {background:"#0e0b1a",border:"1px solid #1a0a2e",borderRadius:13,padding:13},
  cT:       {fontWeight:800,color:"#d4a017",marginBottom:10,fontSize:10,letterSpacing:"2px",textTransform:"uppercase",fontFamily:"Cinzel,serif"},
  badge:    {borderRadius:7,padding:"4px 8px",fontSize:11,fontWeight:700},
  nameIn:   {background:"#0e0b1a",border:"1px solid #7c3aed",borderRadius:8,color:"#e2d5f0",padding:"3px 9px",fontSize:14,width:120,fontFamily:"Cinzel,serif"},
  bGreen:   {background:"#081a08",border:"1px solid #4ade80",borderRadius:8,color:"#4ade80",padding:"3px 9px",cursor:"pointer",fontWeight:700,fontSize:12},
  bGray:    {background:"#1a0a2e",border:"1px solid #2a1f4a",borderRadius:8,color:"#5a3fa0",padding:"3px 9px",cursor:"pointer",fontSize:12},
  bWin:     {background:"#081a08",border:"1px solid #4ade80",borderRadius:9,color:"#4ade80",padding:"7px 13px",cursor:"pointer",fontSize:12,fontWeight:700},
  bFail:    {background:"#1a0808",border:"1px solid #e05555",borderRadius:9,color:"#e05555",padding:"7px 13px",cursor:"pointer",fontSize:12,fontWeight:700},
  inp:      {width:"100%",background:"#07060d",border:"1px solid #2a1f4a",borderRadius:8,color:"#e2d5f0",padding:"8px 10px",fontSize:12,outline:"none",fontFamily:"Rajdhani,sans-serif"},
  sel:      {width:"100%",background:"#07060d",border:"1px solid #2a1f4a",borderRadius:8,color:"#e2d5f0",padding:"7px 9px",fontSize:12,outline:"none"},
  settCard: {background:"#0e0b1a",border:"1px solid #1a0a2e",borderRadius:12,padding:14,marginBottom:12},
  settTitle:{fontWeight:700,color:"#d4a017",marginBottom:8,fontSize:12,fontFamily:"Cinzel,serif",letterSpacing:1},
};
const CSS=`
  @keyframes popIn{from{transform:scale(.4);opacity:0}to{transform:scale(1);opacity:1}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
  @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
  *{box-sizing:border-box}
  ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-track{background:#07060d}::-webkit-scrollbar-thumb{background:#2a1f4a;border-radius:2px}
  select option{background:#07060d;color:#e2d5f0}
  button:active{transform:scale(.97)}
`;
