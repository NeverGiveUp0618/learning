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
  function snapshot() {
    const wallet = read("sharedWallet_v1", { coins: 0, tickets: 0 });
    const en = read("magicEnglish_v1", {}), cn = read("treasureWriting_v1", {});
    const ed = en.daily && en.daily.date === todayStr() ? en.daily : {};
    const cd = cn.daily && cn.daily.date === todayStr() ? cn.daily : {};
    const english = [ed.t1, ed.t2, ed.t3, ed.t4].filter(Boolean).length;
    const chinese = [cd.quests >= 1, cd.ideas >= 1 || cd.quests >= 2, cd.gems >= 1].filter(Boolean).length;
    return { coins: Number(wallet.coins) || 0, tickets: Number(wallet.tickets) || 0, english, chinese };
  }
  function paint() {
    const s = snapshot();
    $("#coins").textContent = s.coins;
    $("#tickets").textContent = s.tickets;
    $("#englishToday").textContent = s.english === 4 ? "星星收集好啦 ✓" : s.english ? `今天发现 ${s.english} 颗星` : "等你来玩 ✦";
    $("#chineseToday").textContent = s.chinese === 3 ? "宝物都找到啦 ✓" : s.chinese ? `今天找到 ${s.chinese} 件宝物` : "等你来寻宝 ✦";
    $("#englishAction").textContent = s.english === 4 ? "回去看看我的伙伴" : s.english ? "继续我的魔法冒险" : "去魔法学院玩一会儿";
    $("#chineseAction").textContent = s.chinese === 3 ? "回去看看探险护照" : s.chinese ? "继续和小獾寻宝" : "和小獾出发寻宝";
    $("#englishProgress").style.width = `${s.english / 4 * 100}%`;
    $("#chineseProgress").style.width = `${s.chinese / 3 * 100}%`;
  }
  const h = new Date().getHours();
  $("#greeting").textContent = h < 11 ? "早上好，今天想发现什么？" : h < 18 ? "欢迎回来，选个喜欢的冒险吧" : "晚上好，来玩一小会儿吧";
  $("#refreshBtn").onclick = paint;
  window.addEventListener("storage", paint);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) paint(); });
  paint();
  if (navigator.serviceWorker) window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
  window.learningHub = { snapshot, paint, todayStr };
}());
