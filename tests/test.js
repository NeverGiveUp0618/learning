const { JSDOM } = require("jsdom");
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");
let pass = 0, fail = 0;
const ok = (cond, msg) => { cond ? pass++ : fail++; console.log(`  ${cond ? "✓" : "✗ FAIL"} ${msg}`); };
const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8").replace('<script src="app.js"></script>', "");
const app = fs.readFileSync(path.join(ROOT, "app.js"), "utf8");
const dom = new JSDOM(html, { runScripts: "dangerously", url: "https://nevergiveup0618.github.io/learning/", pretendToBeVisual: true });
const { window: w } = dom;
Object.defineProperty(w.navigator, "serviceWorker", { value: null, configurable: true });
w.localStorage.setItem("sharedWallet_v1", JSON.stringify({ coins: 321, tickets: 7 }));
const today = new Date(), key = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;
w.localStorage.setItem("magicEnglish_v1", JSON.stringify({ daily: { date:key,t1:true,t2:true,t3:false,t4:false } }));
w.localStorage.setItem("treasureWriting_v1", JSON.stringify({ daily: { date:key,quests:1,ideas:1,gems:1 } }));
w.localStorage.setItem("mathQuest_v1", JSON.stringify({ daily: { date:key, correct:5 }, wonders: { egypt:true, greece:true } }));
w.localStorage.setItem("sharedLearningJourney_v1",JSON.stringify([{subject:"en",screen:"study",day:key,seconds:180,at:Date.now()},{subject:"cn",screen:"reader",day:key,seconds:240,at:Date.now()},{subject:"ma",screen:"challenge",day:key,seconds:8,at:Date.now()}]));
w.eval(app);
const $ = s => w.document.querySelector(s);

console.log("学习大厅真实 DOM 测试");
ok($("#englishPortal").href === "https://nevergiveup0618.github.io/English/?v=66", "英语入口指向当前缓存版本");
ok($("#chinesePortal").href === "https://nevergiveup0618.github.io/Chinese/?v=44", "语文入口指向当前缓存版本");
$("#englishPortal").addEventListener("click", e => e.preventDefault(), {once:true});
$("#englishPortal").dispatchEvent(new w.MouseEvent("click", {bubbles:true,cancelable:true}));
ok($("#openingMask").classList.contains("on") && $("#openingText").textContent.includes("英语"), "★ 点击入口立即显示正在打开，不再像没点中");
ok(!!$(".baibai") && $(".baibai").getAttribute("src").includes("baibai-base.png"), "语文入口使用按实物照片重建的白白母版");
ok($("#coins").textContent === "321" && $("#tickets").textContent === "7", "只读展示 sharedWallet_v1 钱包");
ok($("#englishToday").textContent.includes("2 颗星"), "把英语进度表达成发现星星，不催任务");
ok($("#chineseToday").textContent.includes("宝物都找到啦"), "把语文完成度表达成找到宝物");
ok($("#englishProgress").style.width === "50%", "英语进度条正确");
ok($("#chineseProgress").style.width === "100%", "语文进度条正确");
ok($("#chineseAction").textContent.includes("探险护照"), "完成后给出有吸引力的返回文案");
ok($("#mathPortal").href === "https://nevergiveup0618.github.io/Math/?v=15", "数学入口指向数学奇境当前缓存版本");
ok($("#mathToday").textContent.includes("做对 5 题"), "数学显示今天做对题数（不设打卡）");
ok($("#mathAction").textContent.includes("继续穿越数学史"), "已收集奇观时给出继续文案");
ok(!!$(".pyramid") && $(".pyramid").getAttribute("aria-label") === "金色金字塔", "数学入口使用金字塔主题形象");
/* ⚠️ 分母＝数学站的 CIVS 数量（现在 13 站）。曾经写死 9，数学站扩站后没跟着改，
   进度条一路错。改数学站站点数时，MATH_WONDERS 和这条断言要一起改。 */
ok(Math.abs(parseFloat($("#mathProgress").style.width) - 2 / 13 * 100) < 0.5, "数学进度按已收集奇观 2/13 计算");
const hubSrc = app;
ok(/const MATH_WONDERS = 13\b/.test(hubSrc), "★ 奇观分母与数学站 13 个文明站对得上");
ok(["pk","pkRun","think","thinkGame","pinyin","pinyinLevel","pinyinQuiz"].every(k => new RegExp("\\b" + k + ':"').test(hubSrc)), "★ 新板块的屏幕都有中文名（家长报告不会显示英文 id）");
ok(hubSrc.includes("cd.pinyin"), "★ 语文看板认拼音闯关");
$("#parentEntry").click();
ok($("#parentOverlay").classList.contains("on") && $("#parentPin"), "导航页打开统一家长中心且输入框不自动聚焦");
$("#parentPin").value="223826";$("#parentGo").click();
ok($("#parentBody").textContent.includes("英语") && $("#parentBody").textContent.includes("语文") && $("#parentBody").textContent.includes("数学"), "统一后台同页汇总三科");
ok($("#parentBody").textContent.includes("保存报告图片") && $("#parentBody").textContent.includes("共享钱包"), "统一后台支持图片报告和钱包管理");
ok($("#parentBody").textContent.includes("真实使用观察") && $("#parentBody").textContent.includes("快速退出"), "统一后台展示本机使用路径与退出观察");
ok($("#parentBody").textContent.includes("学单词") && $("#parentBody").textContent.includes("阅读答题") && $("#parentBody").textContent.includes("思维挑战"),"三科使用路径会翻译成家长看得懂的模块名称");
ok($("#parentBody").textContent.includes("内容与运行健康") && $("#parentBody").textContent.includes("长列表延迟渲染"), "统一后台展示内容自检和慢设备优化状态");
ok($("#downloadBackup") && $("#copyBackup") && $("#openRestore"), "统一后台可保存、复制和恢复三科总备份");
ok(w.document.querySelectorAll("[data-design-minutes]").length===4 && $("#parentBody").textContent.includes("设计工坊娱乐时间"), "统一家长后台显示5/10/20/30分钟选项");
w.document.querySelector("[data-design-minutes='10']").click();
ok(JSON.parse(w.localStorage.getItem("magicEnglish_v1")).designMinutes===10, "统一家长后台修改英语工坊时间并保存");
$("#openRestore").click();ok(!$("#restoreBox").hidden && w.document.activeElement!==$("#restoreCode"), "恢复区按需展开且不自动弹出键盘");
const backup=w.learningHub.backupCode(w.learningHub.makeBackup());w.localStorage.setItem("sharedWallet_v1",JSON.stringify({coins:1,tickets:0}));
ok(w.learningHub.restoreBackup(backup) && JSON.parse(w.localStorage.getItem("sharedWallet_v1")).coins===321,"三科总备份通过校验后可完整恢复共享数据");
ok(!w.learningHub.restoreBackup(backup.slice(0,-4)+"xxxx"),"损坏或不完整的三科备份会被拒绝");

/* ⚠️ 2026-09-15：备份原来只含 5 个 key，漏掉了白白的造型（sharedPet_v1）——
   孩子在英语衣橱里搭了一身装扮，一恢复备份全没了。这里做一次真往返验证。 */
w.localStorage.setItem("sharedPet_v1", JSON.stringify({ v:1, name:"白白", body:"https://nevergiveup0618.github.io/English/assets/baibai-base.png",
  items:[{ art:"https://nevergiveup0618.github.io/English/assets/outfits/cape-red.svg", x:50, y:60, s:1.2, r:0, base:.4 }] }));
w.localStorage.setItem("sharedSubjectBalance_v1", JSON.stringify({ date:"2026-09-15", en:true, cn:true, ma:false, two:true, three:false }));
w.localStorage.setItem("sharedLearningJourney_v1", JSON.stringify([{ subject:"ma", screen:"pk", day:"2026-09-15", seconds:120, at:Date.now() }]));
const bk2 = w.learningHub.backupCode(w.learningHub.makeBackup());
w.localStorage.removeItem("sharedPet_v1");
w.localStorage.removeItem("sharedSubjectBalance_v1");
w.localStorage.removeItem("sharedLearningJourney_v1");
ok(w.learningHub.restoreBackup(bk2), "含白白造型的备份能通过校验");
const pet = JSON.parse(w.localStorage.getItem("sharedPet_v1") || "null");
ok(pet && pet.items && pet.items.length === 1 && pet.items[0].art.includes("cape-red"),
   "★ 恢复后白白身上的装扮还在（曾经整份丢失）");
ok(JSON.parse(w.localStorage.getItem("sharedSubjectBalance_v1") || "null")?.two === true,
   "★ 三科均衡标记一起恢复（否则当天能重复领 +20 金币）");
ok((JSON.parse(w.localStorage.getItem("sharedLearningJourney_v1") || "[]")).length === 1,
   "★ 学习足迹一起恢复（家长报告的「最近14天去过哪儿」靠它）");

/* 自定义底图是 base64，动辄 1MB+，会把备份码撑到复制不动 */
w.localStorage.setItem("sharedPet_v1", JSON.stringify({ v:1, name:"白白", body:"data:image/png;base64," + "A".repeat(200000), items:[{ e:"🎩", x:50, y:20, s:1, r:0, base:.3 }] }));
const big = w.learningHub.makeBackup();
ok(!JSON.parse(big).data.sharedPet_v1.body.startsWith("data:"), "★ 超大自定义底图不进备份码（保留装扮，底图用默认）");
ok(JSON.parse(big).data.sharedPet_v1.items.length === 1, "剔掉底图但装扮照样保留");
ok(!w.localStorage.getItem("sharedPet_v1").startsWith("{\"v\":1,\"name\":\"白白\",\"body\":\"\"}"), "makeBackup 不改写本地存档");

const JOURNEY_LONG = Array.from({ length: 400 }, (_, i) => ({ subject:"cn", screen:"pinyin", day:"2026-09-15", seconds:5, at: Date.now() + i }));
w.localStorage.setItem("sharedLearningJourney_v1", JSON.stringify(JOURNEY_LONG));
ok(JSON.parse(w.learningHub.makeBackup()).data.sharedLearningJourney_v1.length === 200, "★ 学习足迹只备份最近 200 条，备份码不会越滚越大");

w.localStorage.setItem("sharedWallet_v1", "损坏的存档");
w.localStorage.removeItem("magicEnglish_v1");
w.localStorage.removeItem("treasureWriting_v1");
w.localStorage.removeItem("mathQuest_v1");
w.learningHub.paint();
ok($("#coins").textContent === "0" && $("#englishToday").textContent.includes("等你来玩"), "缺失或损坏存档时轻松邀请，不白屏");
ok($("#mathToday").textContent.includes("等你来探险"), "数学缺档时轻松邀请");
ok(!app.includes('setItem("treasureWriting_v1"') && !app.includes('setItem("mathQuest_v1"'), "导航页除家长明确设定的英语工坊时间外，不改写学习存档");
ok(fs.readFileSync(path.join(ROOT,"sw.js"),"utf8").includes("learning-planet-v19"), "缓存号已升级");
ok(fs.readFileSync(path.join(ROOT,"sw.js"),"utf8").includes('fallback || fresh'), "★ 慢网络优先显示缓存页并在后台更新");
ok(!w.document.body.textContent.includes("辛苦") && !w.document.body.textContent.includes("未完成"), "★ 导航页不使用制造压力的文案");

console.log(`\n结果: ${pass} 通过, ${fail} 失败`);
if (fail) process.exit(1);
