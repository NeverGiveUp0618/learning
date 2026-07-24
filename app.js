(function () {
  "use strict";
  const $ = s => document.querySelector(s);
  const todayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  const read = (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key) || "null") || fallback; } catch (_) { return fallback; }
  };
  const JOURNEY_KEY="sharedLearningJourney_v1",BACKUP_AT_KEY="learningLastBackup_v1";
  const SCREEN_NAMES={home:"首页",map:"地图",unit:"单元",study:"学单词",review:"复习",arcade:"游戏厅",phonics:"自然拼读",reward:"奖励屋",design:"设计工坊",reading:"阅读书架",reader:"阅读答题",stop:"城市",cards:"知识卡",write:"写作练习",idea:"脑洞",gems:"宝库",essay:"作文",essayWrite:"作文写作",station:"数学站点",core:"课内夯实",extend:"课外拓展",challenge:"思维挑战",challengeRun:"挑战答题",exam:"阶段测验",rewards:"数学宝库"};
  const MATH_WONDERS = 9;   // 数学奇境的文明总数（收集进度分母）
  function snapshot() {
    const wallet = read("sharedWallet_v1", { coins: 0, tickets: 0 });
    const en = read("magicEnglish_v1", {}), cn = read("treasureWriting_v1", {}), ma = read("mathQuest_v1", {});
    const ed = en.daily && en.daily.date === todayStr() ? en.daily : {};
    const cd = cn.daily && cn.daily.date === todayStr() ? cn.daily : {};
    const english = [ed.t1, ed.t2, ed.t3, ed.t4].filter(Boolean).length;
    const chinese = [cd.quests >= 1, cd.ideas >= 1 || cd.quests >= 2, cd.gems >= 1].filter(Boolean).length;
    // 数学不设每天打卡：用「今天做对题数」当鼓励、用「已收集奇观」当长期进度
    const mathToday = ma.daily && ma.daily.date === todayStr() ? (Number(ma.daily.correct) || 0) : 0;
    const mathWonders = ma.wonders ? Object.keys(ma.wonders).length : 0;
    return { coins: Number(wallet.coins) || 0, tickets: Number(wallet.tickets) || 0, english, chinese, mathToday, mathWonders };
  }
  function paint() {
    const s = snapshot();
    $("#coins").textContent = s.coins;
    $("#tickets").textContent = s.tickets;
    $("#englishToday").textContent = s.english === 4 ? "星星收集好啦 ✓" : s.english ? `今天发现 ${s.english} 颗星` : "等你来玩 ✦";
    $("#chineseToday").textContent = s.chinese === 3 ? "宝物都找到啦 ✓" : s.chinese ? `今天找到 ${s.chinese} 件宝物` : "等你来寻宝 ✦";
    $("#englishAction").textContent = s.english === 4 ? "回去看看我的伙伴" : s.english ? "继续我的魔法冒险" : "去魔法学院玩一会儿";
    $("#chineseAction").textContent = s.chinese === 3 ? "回去看看探险护照" : s.chinese ? "继续和白白寻宝" : "和白白出发寻宝";
    $("#englishProgress").style.width = `${s.english / 4 * 100}%`;
    $("#chineseProgress").style.width = `${s.chinese / 3 * 100}%`;
    $("#mathToday").textContent = s.mathToday ? `今天做对 ${s.mathToday} 题` : "等你来探险 ✦";
    $("#mathAction").textContent = s.mathWonders ? "继续穿越数学史" : "出发去古埃及";
    $("#mathProgress").style.width = `${s.mathWonders / MATH_WONDERS * 100}%`;
    const backup=backupHealth(),due=backup.days===null||backup.days>=5;
    $("#parentEntry").textContent=due?"🛡️ 该备份了":"🔐 家长中心";
  }
  const fmt = sec => sec < 60 ? `${Math.round(sec)}秒` : `${Math.floor(sec/60)}分${Math.round(sec%60)}秒`;
  const dayKey = offset => { const d=new Date();d.setDate(d.getDate()+offset);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; };
  function parentData(){
    const en=read("magicEnglish_v1",{}),cn=read("treasureWriting_v1",{}),ma=read("mathQuest_v1",{}),wallet=read("sharedWallet_v1",{coins:0,tickets:0});
    const days=Array.from({length:7},(_,i)=>dayKey(i-6));
    const enSec=k=>Number((en.history||{})[k]?.mins||0)*60;
    const cnSec=k=>Object.values((cn.timeLog||{})[k]||{}).reduce((a,v)=>a+(Number(v)||0),0);
    const maSec=k=>Object.values((ma.timeLog||{})[k]||{}).reduce((a,v)=>a+(Number(v)||0),0);
    const total=(fn)=>days.reduce((a,k)=>a+fn(k),0),today=days[6];
    return {en,cn,ma,wallet,days,enSec,cnSec,maSec,subjects:[
      {id:"en",icon:"🏰",name:"英语",today:enSec(today),week:total(enSec),main:`${Object.keys(en.srs||{}).length} 个词进入学习`,extra:`错词 ${Object.keys(en.wrong||{}).length} 个 · 阶段卷 ${Object.keys(en.stageExams||{}).length} 次`,next:Object.keys(en.wrong||{}).length?"先看错词本":"按当前单元继续即可",url:"https://nevergiveup0618.github.io/English/?parent=1"},
      {id:"cn",icon:"🗺️",name:"语文",today:cnSec(today),week:total(cnSec),main:`${Object.keys(cn.essays||{}).length} 篇作文记录`,extra:`宝库 ${(cn.gems||[]).length} 条 · 阅读 ${Object.keys(cn.readings||{}).filter(k=>cn.readings[k]?.done).length}/200`,next:Object.values(cn.essays||{}).some(x=>x.done&&!x.reviewed)?"有作文等待家长批阅":"继续阅读与仿写迁移",url:"https://nevergiveup0618.github.io/Chinese/?parent=1"},
      {id:"ma",icon:"🔭",name:"数学",today:maSec(today),week:total(maSec),main:`累计做对 ${Number(ma.totalRight)||0} 题`,extra:`奇观 ${Object.keys(ma.wonders||{}).length}/9 · 待复习 ${Object.values(ma.srs||{}).filter(x=>x.due<=today).length}`,next:Object.values(ma.srs||{}).some(x=>x.due<=today)?"先走个性化复习路线":"可自由探索思维挑战",url:"https://nevergiveup0618.github.io/Math/?parent=1"}
    ]};
  }
  function journeyData(){const cutoff=Date.now()-14*86400000,rows=read(JOURNEY_KEY,[]).filter(x=>x&&x.at>=cutoff&&["en","cn","ma"].includes(x.subject));const by={en:{},cn:{},ma:{}};rows.forEach(x=>{const k=SCREEN_NAMES[x.screen]||x.screen||"其他",v=by[x.subject][k]||(by[x.subject][k]={visits:0,seconds:0,quick:0});v.visits++;v.seconds+=Number(x.seconds)||0;if((Number(x.seconds)||0)<12)v.quick++});const top=s=>Object.entries(by[s]).sort((a,b)=>b[1].seconds-a[1].seconds).slice(0,3);return{rows,by,top,last:rows.reduce((m,x)=>Math.max(m,Number(x.at)||0),0)};}
  function safeParse(key){try{const raw=localStorage.getItem(key);return raw?{ok:true,value:JSON.parse(raw),bytes:raw.length}:{ok:false,value:null,bytes:0}}catch(e){return{ok:false,value:null,bytes:0}}}
  function backupHealth(){const keys=["magicEnglish_v1","treasureWriting_v1","mathQuest_v1","sharedWallet_v1"],parts=keys.map(safeParse),last=Number(localStorage.getItem(BACKUP_AT_KEY)||0),days=last?Math.floor((Date.now()-last)/86400000):null;return{ok:parts.filter(x=>x.ok).length,total:keys.length,bytes:parts.reduce((a,x)=>a+x.bytes,0),last,days};}
  function hashText(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return(h>>>0).toString(16).padStart(8,"0")}
  function makeBackup(){const keys=["magicEnglish_v1","treasureWriting_v1","mathQuest_v1","sharedWallet_v1","sharedCardDaily_v1"],data={};keys.forEach(k=>{const p=safeParse(k);if(p.ok)data[k]=p.value});if(data.magicEnglish_v1?.pet)data.magicEnglish_v1.pet.pics={};const body=JSON.stringify(data),pack={version:1,createdAt:new Date().toISOString(),checksum:hashText(body),data};return JSON.stringify(pack)}
  function backupCode(raw){return btoa(unescape(encodeURIComponent(raw)))}
  async function compactBackupCode(raw){
    if(typeof CompressionStream==="undefined")return backupCode(raw);
    const stream=new Blob([raw]).stream().pipeThrough(new CompressionStream("gzip"));
    const bytes=new Uint8Array(await new Response(stream).arrayBuffer());
    let binary="";for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));
    return "GZ1."+btoa(binary);
  }
  function restoreBackup(code){try{const raw=decodeURIComponent(escape(atob(code.trim()))),pack=JSON.parse(raw),body=JSON.stringify(pack.data),allowed=new Set(["magicEnglish_v1","treasureWriting_v1","mathQuest_v1","sharedWallet_v1","sharedCardDaily_v1"]);if(pack.version!==1||pack.checksum!==hashText(body)||!pack.data||typeof pack.data!=="object"||!pack.data.magicEnglish_v1||!pack.data.treasureWriting_v1||!pack.data.mathQuest_v1)return false;Object.entries(pack.data).forEach(([k,v])=>{if(allowed.has(k))localStorage.setItem(k,JSON.stringify(v))});localStorage.setItem(BACKUP_AT_KEY,String(Date.now()));return true}catch(e){return false}}
  async function restoreAnyBackup(code){
    const clean=String(code||"").replace(/\s+/g,"");
    if(!clean.startsWith("GZ1."))return restoreBackup(clean);
    try{const binary=atob(clean.slice(4)),bytes=Uint8Array.from(binary,c=>c.charCodeAt(0)),stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip")),raw=await new Response(stream).text();return restoreBackup(backupCode(raw))}catch(e){return false}
  }
  const PARENT_AUTH_KEY="learningParentAuth_v1";
  let parentOK=sessionStorage.getItem(PARENT_AUTH_KEY)==="1";
  function renderParent(){
    const body=$("#parentBody");
    if(!parentOK){body.innerHTML=`<div class="parentGate"><div style="font-size:38px">🔐</div><h2>家长验证</h2><p style="color:#8b7f92;font-size:13px;line-height:1.7">验证一次后，本次浏览器会话内往返三科不再重复输入。</p><input id="parentPin" type="password" inputmode="numeric" maxlength="6" autocomplete="off" placeholder="••••••"><button class="parentBtn" id="parentGo">进入家长中心</button><div id="parentMsg" style="color:#c06f82;font-size:12px;margin-top:10px"></div></div>`;const go=()=>{if($("#parentPin").value==="223826"){parentOK=true;sessionStorage.setItem(PARENT_AUTH_KEY,"1");renderParent()}else $("#parentMsg").textContent="密码不正确"};$("#parentGo").onclick=go;$("#parentPin").onkeydown=e=>{if(e.key==="Enter")go()};return;}
    const d=parentData(),j=journeyData(),health=backupHealth(),all=d.subjects.reduce((a,x)=>a+x.week,0),daily=d.days.map(k=>d.enSec(k)+d.cnSec(k)+d.maSec(k)),max=Math.max(60,...daily);
    const insight=d.subjects.map(s=>{const rows=j.top(s.id),visits=Object.values(j.by[s.id]).reduce((a,x)=>a+x.visits,0),quick=Object.values(j.by[s.id]).reduce((a,x)=>a+x.quick,0);return `<div class="journeySubject"><b>${s.icon} ${s.name}</b><small>${visits?`近14天进入 ${visits} 次 · 快速退出 ${Math.round(quick/visits*100)}%`:"还没有足够的使用记录"}</small>${rows.length?rows.map(([n,x])=>`<span>${n}<i>${fmt(x.seconds)} · ${x.visits}次</i></span>`).join(""):""}</div>`}).join("");
    body.innerHTML=`<div class="reportGrid">${d.subjects.map(s=>`<article class="reportCard"><div class="subjectHead"><h3>${s.icon} ${s.name}</h3><span>${fmt(s.today)}</span></div><div class="big">${fmt(s.week)}</div><div class="sub">最近7天有效学习时间</div><div class="metric"><span>学习成果</span><b>${s.main}</b></div><div class="metric"><span>学习档案</span><b>${s.extra}</b></div><div class="metric"><span>建议关注</span><b>${s.next}</b></div><a href="${s.url}">进入${s.name}详细后台 →</a></article>`).join("")}</div>
      <div class="walletAdmin"><div class="walletNums"><small>三科共享钱包</small><br><b>🪙 ${d.wallet.coins||0}　🎟️ ${d.wallet.tickets||0}</b></div><div class="walletButtons"><button data-coin="10">+10金币</button><button data-coin="50">+50金币</button><button data-coin="-10">−10金币</button><button data-ticket="1">+1转盘券</button></div></div>
      <div class="archive"><div class="archiveHead"><div><b>🎨 英语设计工坊娱乐时间</b><div class="sub">完成当天英语任务后可使用，修改后下次进入工坊立即生效。</div></div></div><div class="backupActions">${[5,10,20,30].map(v=>`<button class="parentBtn ${Number(d.en.designMinutes||30)===v?"":"ghost"}" data-design-minutes="${v}">${v} 分钟</button>`).join("")}</div></div>
      <div class="archive"><div class="archiveHead"><div><b>最近7天学习档案</b><div class="sub">三科合计 ${fmt(all)}，只记录有效前台时间</div></div><button class="parentBtn ghost" id="saveReport">保存报告图片</button></div><div class="weekBars">${d.days.map((k,i)=>`<div class="dayBar"><i style="height:${Math.max(4,daily[i]/max*76)}px"></i>${k.slice(5)}<br>${fmt(daily[i])}</div>`).join("")}</div></div>
      <div class="archive"><div class="archiveHead"><div><b>🔎 真实使用观察</b><div class="sub">只保存在本机，不记录答案和作文内容；快速退出表示停留不足12秒。</div></div></div><div class="journeyGrid">${insight}</div><div class="parentAdvice">${j.rows.length?"先看孩子愿意停留最久的模块；快速退出较多的入口，连续观察几次后再决定是否调整。":"使用几天后，这里会出现真实的模块偏好和容易退出的位置。"}</div></div>
      <div class="archive"><div class="archiveHead"><div><b>🧪 内容与运行健康</b><div class="sub">本次发版已通过英语、语文、数学自动内容检查；家长无需逐题校对。</div></div></div><div class="healthGrid"><span><b>英语</b><small>417词 · 50单元 · 音频清单</small></span><span><b>语文</b><small>200篇阅读 · 30城 · 技巧防错判</small></span><span><b>数学</b><small>九册内容 · 题目与答案结构</small></span><span><b>慢设备</b><small>长列表延迟渲染 · 图片按需加载</small></span></div></div>
      <div class="archive backupCenter"><div class="archiveHead"><div><b>🛟 三科数据保险箱</b><div class="sub">${health.ok}/${health.total} 份核心存档正常 · ${(health.bytes/1024).toFixed(1)}KB · ${health.last?(health.days===0?"今天已备份":`${health.days}天前备份`):"还没有做过三科总备份"}</div></div></div><div class="backupActions"><button class="parentBtn" id="downloadBackup">保存三科备份文件</button><button class="parentBtn ghost" id="copyBackup">复制压缩备份码</button><button class="parentBtn ghost" id="openRestore">恢复旧备份</button></div><div class="restoreBox" id="restoreBox" hidden><label class="backupFile">选择备份文件<input id="restoreFile" type="file" accept="application/json,.json"></label><span>或者粘贴备份码</span><textarea id="restoreCode" placeholder="点击这里，再粘贴三科备份码" autocomplete="off"></textarea><button class="parentBtn" id="restoreNow">确认恢复三科进度</button><small id="restoreMsg"></small></div><div class="parentAdvice">${health.days===null||health.days>=5?"建议现在保存一次；以后每 5 天提醒一次。":"备份状态正常。到第 5 天会再提醒。"} 清缓存、换手机或系统升级前也建议备份。</div></div>`;
    body.querySelectorAll("[data-coin]").forEach(b=>b.onclick=()=>adjustWallet(Number(b.dataset.coin),0));body.querySelectorAll("[data-ticket]").forEach(b=>b.onclick=()=>adjustWallet(0,Number(b.dataset.ticket)));$("#saveReport").onclick=saveReportImage;$("#downloadBackup").onclick=downloadBackup;$("#copyBackup").onclick=copyBackup;$("#openRestore").onclick=()=>{$("#restoreBox").hidden=!$("#restoreBox").hidden};$("#restoreFile").onchange=e=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=()=>{$("#restoreCode").value=backupCode(String(r.result||""));$("#restoreMsg").textContent="备份文件已读取，点击确认恢复"};r.readAsText(f)};$("#restoreNow").onclick=async()=>{const msg=$("#restoreMsg"),code=$("#restoreCode").value.trim();if(!code){msg.textContent="请先选择备份文件或粘贴备份码";return}msg.textContent="正在检查备份……";if(await restoreAnyBackup(code)){msg.textContent="恢复成功，重新打开三个学科即可看到进度";paint()}else msg.textContent="备份码不完整或已损坏，请重新复制"};
  }
  function adjustWallet(coins,tickets){const w=read("sharedWallet_v1",{coins:0,tickets:0});w.coins=Math.max(0,(Number(w.coins)||0)+coins);w.tickets=Math.max(0,(Number(w.tickets)||0)+tickets);localStorage.setItem("sharedWallet_v1",JSON.stringify(w));paint();renderParent();}
  function markBackedUp(){localStorage.setItem(BACKUP_AT_KEY,String(Date.now()))}
  function downloadBackup(){const raw=makeBackup(),a=document.createElement("a");a.href=URL.createObjectURL(new Blob([raw],{type:"application/json"}));a.download=`三科学习备份-${todayStr()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);markBackedUp();renderParent()}
  async function copyBackup(){const code=await compactBackupCode(makeBackup()),done=()=>{markBackedUp();renderParent()};if(navigator.clipboard?.writeText)navigator.clipboard.writeText(code).then(done).catch(()=>fallbackCopy(code,done));else fallbackCopy(code,done)}
  function fallbackCopy(code,done){const t=document.createElement("textarea");t.value=code;t.style.position="fixed";t.style.opacity="0";document.body.appendChild(t);t.select();try{document.execCommand("copy");done()}catch(e){}t.remove()}
  function saveReportImage(){const d=parentData(),c=document.createElement("canvas");c.width=1200;c.height=1500;const x=c.getContext("2d"),line=(t,y,size=32,color="#493f55",bold=false)=>{x.fillStyle=color;x.font=`${bold?"700 ":""}${size}px PingFang SC, sans-serif`;x.fillText(t,90,y)};const g=x.createLinearGradient(0,0,1200,1500);g.addColorStop(0,"#fff8f5");g.addColorStop(1,"#eee9ff");x.fillStyle=g;x.fillRect(0,0,c.width,c.height);line("我的学习星球 · 三科学习报告",100,44,"#493f55",true);line(`生成日期 ${todayStr()}`,150,24,"#8b7f92");let y=250;d.subjects.forEach(s=>{x.fillStyle="rgba(255,255,255,.78)";x.beginPath();x.roundRect(70,y-55,1060,250,28);x.fill();line(`${s.icon} ${s.name}`,y,34,"#695675",true);line(`今天 ${fmt(s.today)}　最近7天 ${fmt(s.week)}`,y+55,28);line(s.main,y+110,26,"#765f7d");line(s.extra,y+155,24,"#8b7f92");y+=285});line(`共享钱包　金币 ${d.wallet.coins||0}　转盘券 ${d.wallet.tickets||0}`,y+20,30,"#8a682f",true);line("不比较，不催进度；看见兴趣，也看见一点点积累。",y+90,26,"#8b7f92");const url=c.toDataURL("image/png");const a=document.createElement("a");a.href=url;a.download=`三科学习报告-${todayStr()}.png`;a.click();}
  const h = new Date().getHours();
  $("#greeting").textContent = h < 11 ? "早上好，今天想发现什么？" : h < 18 ? "欢迎回来，选个喜欢的冒险吧" : "晚上好，来玩一小会儿吧";
  $("#refreshBtn").onclick = paint;
  $("#parentEntry").onclick=()=>{$("#parentOverlay").classList.add("on");renderParent()};
  $("#parentBody").addEventListener("click",e=>{const b=e.target.closest("[data-design-minutes]");if(!b)return;const en=read("magicEnglish_v1",{});en.designMinutes=Number(b.dataset.designMinutes);localStorage.setItem("magicEnglish_v1",JSON.stringify(en));renderParent()});
  $("#parentClose").onclick=()=>$("#parentOverlay").classList.remove("on");
  if(new URLSearchParams(location.search).get("parent")==="1"){$("#parentOverlay").classList.add("on");renderParent();}
  document.querySelectorAll(".portal").forEach(portal => portal.addEventListener("click", () => {
    $("#openingText").textContent = portal.dataset.opening || "正在打开冒险";
    $("#openingMask").classList.add("on");
  }));
  window.addEventListener("pageshow", () => $("#openingMask").classList.remove("on"));
  window.addEventListener("storage", paint);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) paint(); });
  paint();
  if (navigator.serviceWorker) window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
  window.learningHub = { snapshot, paint, todayStr, journeyData, makeBackup, backupCode, compactBackupCode, restoreBackup, restoreAnyBackup };
}());
