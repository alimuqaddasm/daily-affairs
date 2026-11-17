/* Daily Affairs: one page over one private JSON file (data/life.json in a private GitHub repo).
   Money, Khums, Wajibat and Wasiyat all read the same state, so khums, debts and dues are stored once. */
(() => {
"use strict";

/* ================= constants ================= */
const CURRENCIES = [["PKR","Pakistani rupee"],["USD","US dollar"],["GBP","UK pound"],["EUR","Euro"],["SAR","Saudi riyal"],["IQD","Iraqi dinar"],["IRT","Iranian toman"],["KRW","Korean won"],["AED","UAE dirham"]];
const CUR_UR = {PKR:"روپے",KRW:"کوریائی وون",SAR:"سعودی ریال",USD:"امریکی ڈالر",AED:"اماراتی درہم",IRT:"ایرانی تومان",IQD:"عراقی دینار",GBP:"برطانوی پاؤنڈ",EUR:"یورو"};
const CATS = ["Food","Groceries","Transport","Bills & subs","Phone & internet","Household","Personal","Books & study","Family","Charity","Wajibat","Savings","Other"];
const MEALS = {nashta:"Nashta",dinner:"Dinner",snack:"Snack"};
const MEAL_COLOR = {nashta:"var(--nashta)",dinner:"var(--dinner)",snack:"var(--snack)",other:"var(--food-other)"};
const CAT_COLOR = {"Food":"var(--nashta)","Bills & subs":"var(--dinner)","Savings":"var(--accent)","Wajibat":"var(--due)"};
const PRAYERS = [["fajr","Fajr","نمازِ صبح"],["zohar","Zohar","نمازِ ظہر"],["asr","Asr","نمازِ عصر"],["maghrib","Maghrib","نمازِ مغرب"],["esha","Esha","نمازِ عشاء"],
  ["zohar_q","Zohar (qasr)","نمازِ ظہر (قصر)"],["asr_q","Asr (qasr)","نمازِ عصر (قصر)"],["esha_q","Esha (qasr)","نمازِ عشاء (قصر)"]];
const DAY = ["fajr","zohar","asr","maghrib","esha"];
const TYPES = {kaffara:["Kaffara","کفارہ"],fidya:["Fidya","فدیہ"],khums:["Khums (other)","خمس"],nazr:["Nazr (vow)","نذر"],radd:["Radd-e-mazalim","ردِ مظالم"],amanat:["Amanat (trust held)","امانت"],other:["Other","دیگر"]};
const RELIGIOUS = ["kaffara","fidya","khums","nazr","radd"];
const FROM_THIRD = ["kaffara","fidya","nazr"];
const A = "https://www.sistani.org/arabic/book/";
const RULES = [
 {topic:"A written will counts",ref:"Masa'il Muntakhaba 1291",url:A+"13/688/",summary:"No spoken words are needed. A writing of the deceased that he clearly meant to be acted on after death is enough."},
 {topic:"What must be arranged",ref:"Masa'il Muntakhaba 1292; Minhaj 1337",url:A+"13/688/",summary:"Return trusts or tell their owners. Secure payment of debts and of khums, zakat and mazalim. Secure making up of prayers, fasts and kaffara, by will if one has wealth, or by telling someone reliable such as the eldest son. Tell heirs of property held by others or hidden. When one is not sure of time, qaza and kaffara become urgent."},
 {topic:"Whole estate",ref:"Muntakhaba 1293; Minhaj 1389",url:A+"15/848/",summary:"Debts, khums, zakat, mazalim and obligatory hajj come from the whole estate, willed or not. Kaffara and nazr do not."},
 {topic:"Nothing beyond that without a will",ref:"Muntakhaba 1294",url:A+"13/688/",summary:"Without a will, heirs need not spend anything on kaffara, nazr or hired prayers and fasts. This is why they must be written in the wasiyat."},
 {topic:"The one-third limit",ref:"Muntakhaba 1295 to 1297",url:A+"13/688/",summary:"Bequests other than hajj and financial dues are limited to one third unless heirs permit more. Within it: debts, then hired prayers and fasts, then recommended acts."},
 {topic:"If the third runs short",ref:"Muntakhaba 1298; Minhaj 1397",url:A+"15/848/",summary:"Obligations that are not from the whole estate are cut in proportion, unless the will gives an order of priority. The wasiyat therefore states one."},
 {topic:"The executor",ref:"Muntakhaba 1310 to 1316; Minhaj 1437, 1441",url:A+"13/688/",summary:"Must be sane, trustworthy and (obligatory precaution) Muslim. A backup executor may be named. A supervisor (nazir) may be appointed. The executor may delegate, such as handing kaffara to someone who knows the poor."},
 {topic:"Witnesses",ref:"Muntakhaba 1318",url:A+"13/688/",summary:"A bequest of wealth is proven by two just Muslim men (or the listed alternatives). Executorship and guardianship of children are proven only by two just men."},
 {topic:"Eldest son",ref:"Islamic Laws 1370, 1374",url:"https://www.sistani.org/english/book/48/2267/",summary:"By obligatory precaution he makes up his father's qaza prayers, except those deliberately abandoned. A valid will to hire someone lifts his duty."},
 {topic:"Qaza order and qasr",ref:"Islamic Laws 1360, 1353",url:"https://www.sistani.org/english/book/48/2266/",summary:"No order needed except Zohar before Asr and Maghrib before Esha of one day. Travel prayers are made up as two rakat."},
 {topic:"Kaffara of a Ramadhan fast",ref:"Islamic Laws 1630",url:"https://www.sistani.org/english/book/48/2292/",summary:"Two months of fasting, or sixty poor people fed or given one mudd (about 750 g) of food each."}
];

/* ================= helpers ================= */
const $ = id => document.getElementById(id);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const pad = n => String(n).padStart(2,"0");
const iso = d => d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate());
const todayIso = () => iso(new Date());
const parse = s => { const [y,m,d] = String(s).split("-").map(Number); return new Date(y, m-1, d); };
const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate()+n); return iso(d); };
const dayDiff = (a, b) => Math.round((parse(b) - parse(a)) / 86400000);
const fmt = n => (Math.round(n) || 0).toLocaleString("en-PK");
const fmtC = (n, c) => !c || c === "PKR" ? "PKR " + fmt(n) : c + " " + (+n).toLocaleString("en-PK", {maximumFractionDigits: Math.abs(+n) >= 1000 ? 0 : 2});
const nice = s => parse(s).toLocaleDateString("en-GB", {weekday:"short", day:"numeric", month:"short"});
const longDate = s => parse(s).toLocaleDateString("en-GB", {day:"numeric", month:"long", year:"numeric"});
const uid = p => (p||"x") + "-" + Date.now().toString(36) + Math.random().toString(36).slice(2,6);
const clone = o => JSON.parse(JSON.stringify(o));
const nfEn = new Intl.NumberFormat("en-US");
let nfUr; try { nfUr = new Intl.NumberFormat("ur-PK-u-nu-arabext", {useGrouping:false, maximumFractionDigits:2}); } catch(e) { nfUr = nfEn; }
const urDigits = s => String(s ?? "").replace(/[0-9]/g, d => "۰۱۲۳۴۵۶۷۸۹"[d]);
const urDate = s => { try { return parse(s).toLocaleDateString("ur-PK-u-nu-arabext", {day:"numeric", month:"long", year:"numeric"}); } catch(e) { return s; } };
function toast(m){ const t = $("toast"); t.textContent = m; t.hidden = false; clearTimeout(toast._t); toast._t = setTimeout(() => t.hidden = true, 2600); }

/* ================= connection + store ================= */
const LS = "dailyAffairs.conn.v1";
let conn = {owner:"alimuqaddasm", repo:"life", path:"data/life.json", branch:"", token:""};
try { Object.assign(conn, JSON.parse(localStorage.getItem(LS)) || {}); } catch(e) {}
const saveConn = () => { try { localStorage.setItem(LS, JSON.stringify(conn)); } catch(e) {} };

const API = "https://api.github.com";
let base = null, D = null, sha = null, etag = null, pending = [], lastSync = null, syncErr = "", flushT = null, flushing = false;

const fileUrl = () => API + "/repos/" + encodeURIComponent(conn.owner) + "/" + encodeURIComponent(conn.repo) + "/contents/" + conn.path.split("/").map(encodeURIComponent).join("/");
const hdr = extra => Object.assign({Authorization: "Bearer " + conn.token, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28"}, extra || {});
const b64dec = s => new TextDecoder().decode(Uint8Array.from(atob(s.replace(/\s/g, "")), c => c.charCodeAt(0)));
const b64enc = str => { const b = new TextEncoder().encode(str); let s = ""; for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000)); return btoa(s); };
function httpErr(r){
  const m = r.status === 401 ? "GitHub rejected the token" : r.status === 404 ? "Data file or repo not found (check the token can see the repo)" :
            r.status === 403 ? "GitHub refused (token permission or rate limit)" : "GitHub error " + r.status;
  const e = new Error(m); e.status = r.status; return e;
}
async function fetchRemote(useEtag){
  const q = conn.branch ? "?ref=" + encodeURIComponent(conn.branch) : "";
  const r = await fetch(fileUrl() + q, {headers: hdr(useEtag && etag ? {"If-None-Match": etag} : {}), cache: "no-store"});
  if (r.status === 304) return null;
  if (!r.ok) throw httpErr(r);
  const tag = r.headers.get("ETag");
  const j = await r.json();
  let text;
  if (j.content) text = b64dec(j.content);
  else { const r2 = await fetch(fileUrl() + q, {headers: hdr({Accept: "application/vnd.github.raw+json"}), cache: "no-store"}); if (!r2.ok) throw httpErr(r2); text = await r2.text(); }
  return {data: JSON.parse(text), sha: j.sha, etag: tag};
}
async function putRemote(data, message){
  const body = {message, content: b64enc(JSON.stringify(data, null, 1) + "\n"), sha};
  if (conn.branch) body.branch = conn.branch;
  const r = await fetch(fileUrl(), {method: "PUT", headers: hdr({"Content-Type": "application/json"}), body: JSON.stringify(body)});
  if (r.status === 409 || r.status === 422) { const e = new Error("conflict"); e.conflict = true; throw e; }
  if (!r.ok) throw httpErr(r);
  const j = await r.json(); sha = j.content.sha; etag = null;
}
function rebuild(){ D = clone(base); pending.forEach(p => p.fn(D)); }
/* Every change is a small function applied to the state. On a conflict it is re-applied to the newest copy, so two devices never overwrite each other. */
function change(fn, label){
  if (!base) { toast("Not connected yet. Open Settings to connect."); return; }
  pending.push({fn, label}); fn(D); renderAll(); setSync();
  clearTimeout(flushT); flushT = setTimeout(flush, 700);
}
async function flush(){
  if (flushing || !pending.length) return;
  flushing = true; setSync();
  const n = pending.length, labels = [...new Set(pending.slice(0, n).map(p => p.label))].join(", ");
  try {
    for (let attempt = 0; attempt < 4; attempt++) {
      const next = clone(base); pending.slice(0, n).forEach(p => p.fn(next));
      next.updatedAt = new Date().toISOString();
      try { await putRemote(next, labels.slice(0, 120)); base = next; pending.splice(0, n); syncErr = ""; lastSync = new Date(); break; }
      catch (e) { if (!e.conflict || attempt === 3) throw e; const r = await fetchRemote(false); base = r.data; sha = r.sha; etag = r.etag; }
    }
  } catch (e) { syncErr = e.message || "Save failed"; }
  flushing = false; rebuild(); renderAll(); setSync();
  if (pending.length && !syncErr) flush();
}
async function pull(quiet){
  if (!conn.token) { setSync(); return; }
  if (pending.length || flushing) { if (syncErr && !flushing) flush(); return; }
  try {
    const r = await fetchRemote(!!base);
    if (r) { base = r.data; sha = r.sha; etag = r.etag; rebuild(); renderAll(); }
    lastSync = new Date(); syncErr = "";
  } catch (e) { syncErr = e.message; if (!quiet) toast(e.message); }
  setSync();
}
function setSync(){
  const el = $("sync");
  if (!conn.token) { el.textContent = "Not connected · open Settings"; el.dataset.state = "warn"; return; }
  if (syncErr) { el.textContent = syncErr + (pending.length ? " · " + pending.length + " change(s) not saved yet" : ""); el.dataset.state = "bad"; return; }
  if (flushing || pending.length) { el.textContent = "Saving to GitHub…"; el.dataset.state = "warn"; return; }
  if (!base) { el.textContent = "Loading…"; el.dataset.state = ""; return; }
  el.textContent = "Live · synced " + (lastSync ? lastSync.toLocaleTimeString("en-GB", {hour:"2-digit", minute:"2-digit"}) : ""); el.dataset.state = "ok";
}
window.addEventListener("beforeunload", e => { if (pending.length) { e.preventDefault(); e.returnValue = ""; } });
document.addEventListener("visibilitychange", () => { if (!document.hidden) pull(true); });
setInterval(() => { if (!document.hidden) pull(true); }, 60000);

/* ================= derived state ================= */
const F = () => D.finance, C = () => D.finance.config;
const rate = c => !c || c === "PKR" ? 1 : (C().rates?.[c] || 0);
const toPkr = (amt, c) => (+amt || 0) * rate(c);
function cycleTxns(){ const c = C().cycle; return F().txns.filter(t => t.date >= c.start && t.date < c.nextPay); }
function compute(){
  const c = C().cycle, tx = cycleTxns();
  const spent = tx.reduce((s,t) => s + (t.pkr || 0), 0), left = (c.opening || 0) - spent, t = todayIso();
  const daysLeft = Math.max(1, dayDiff(t, c.nextPay));
  const spentToday = tx.filter(x => x.date === t).reduce((s,x) => s + (x.pkr||0), 0);
  const len = Math.max(1, dayDiff(c.start, c.nextPay));
  return {tx, spent, left, daysLeft, spentToday, allowToday: (left + spentToday) / daysLeft, perDay: left / daysLeft, len,
          elapsed: Math.min(1, Math.max(0, (dayDiff(c.start, t) + 0.5) / len))};
}
function savings(){ return (C().savingsBase||0) + F().txns.filter(t => t.category === "Savings").reduce((s,t)=>s+t.pkr,0); }
function debtStatus(d){
  const paid = (d.payments||[]).reduce((s,p) => s + toPkr(p.amount, p.currency), 0), total = toPkr(d.amount, d.currency), left = total - paid;
  const r = rate(d.currency), leftNative = r ? left / r : 0;
  return {paid, total, left, leftNative, open: d.status !== "cleared" && left > 0.5};
}
const openDebts = () => D.debts.filter(d => debtStatus(d).open);
function itemStatus(it){
  const paid = (it.payments||[]).reduce((s,p) => s + (p.currency === it.currency ? +p.amount : (rate(it.currency) ? toPkr(p.amount,p.currency)/rate(it.currency) : 0)), 0);
  const left = it.amount == null ? null : Math.max(0, it.amount - paid);
  return {paid, left};
}
const pendingItems = () => D.wajibat.items.filter(i => i.status === "pending");
/* The one khums model every tab reads. */
function khums(){
  const kh = D.khums.settings || {}, k = compute();
  const fx = (C().foreignCash||[]).reduce((s,f) => s + toPkr(f.amount, f.currency), 0);
  let recv = 0, pay = 0;
  D.debts.forEach(d => { const st = debtStatus(d); if (st.open && !d.khumsPaid) { if (d.direction === "owed_to_me") recv += st.left; else pay += st.left; } });
  const held = savings() + Math.max(0, k.left) + fx + recv - pay;
  const hasCarry = typeof kh.carryPkr === "number", taxable = held - (hasCarry ? kh.carryPkr : 0);
  const years = [...D.khums.years].sort((a,b) => String(b.year).localeCompare(String(a.year))).map(y => {
    const c = y.currency || "PKR";
    const paid = (y.payments||[]).reduce((s,p) => s + (p.currency === c ? +p.amount : (rate(c) ? toPkr(p.amount,p.currency)/rate(c) : 0)), 0);
    return {...y, c, paid, unpaid: Math.max(0, (y.khumsDue||0) - paid)};
  });
  const unpaid = years.filter(y => y.unpaid > 0.5);
  const daysTo = kh.next ? dayDiff(todayIso(), kh.next) : null;
  return {kh, held, hasCarry, est: Math.max(0, taxable) / 5, taxable, years, unpaid, daysTo, fx, recv, pay};
}

/* ================= rendering: shared ================= */
function renderAll(){
  if (!D) return;
  renderToday(); renderPlanner(); renderMoney(); renderKhums(); renderWajibat(); renderWasiyat(); renderSettingsChip();
}
const tile = (label, val, sub, cls, href) => `<${href?'a href="'+href+'"':'div'} class="tile ${cls||""}"><span>${label}</span><b class="${String(val).length > 9 && !/^<small/.test(val) ? "word" : ""}">${val}</b><span>${sub||""}</span></${href?"a":"div"}>`;
const ringSvg = (frac, color, size, track, inner) => {
  const C0 = 326.7, off = (C0 * (1 - Math.max(0, Math.min(1, frac)))).toFixed(1);
  return `<div class="ring" style="width:${size}px;height:${size}px"><svg width="${size}" height="${size}" viewBox="0 0 120 120" role="img" aria-label="${Math.round(frac*100)} percent"><circle cx="60" cy="60" r="52" fill="none" stroke="${track}" stroke-width="11"/><circle cx="60" cy="60" r="52" fill="none" stroke="${color}" stroke-width="11" stroke-linecap="round" stroke-dasharray="${C0}" stroke-dashoffset="${off}" transform="rotate(-90 60 60)"/></svg><div class="lbl">${inner}</div></div>`;
};
const PICON = {
  fajr: '<path d="M3 17h1m16 0h1m-15.4 -6.4l.7 .7m12.1 -.7l-.7 .7m-9.7 5.7a4 4 0 0 1 8 0"/><path d="M3 21l18 0"/><path d="M12 9v-6l3 3m-6 0l3 -3"/>',
  zohar: '<path d="M12 12m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0"/><path d="M3 12h1m8 -9v1m8 8h1m-9 8v1m-6.4 -15.4l.7 .7m12.1 -.7l-.7 .7m0 11.4l.7 .7m-12.1 -.7l-.7 .7"/>',
  asr: '<path d="M12 12m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0"/><path d="M4 12h.01"/><path d="M12 4v.01"/><path d="M20 12h.01"/><path d="M12 20v.01"/><path d="M6.31 6.31l-.01 -.01"/><path d="M17.71 6.31l-.01 -.01"/><path d="M17.7 17.7l.01 .01"/><path d="M6.3 17.7l.01 .01"/>',
  maghrib: '<path d="M3 13h1"/><path d="M20 13h1"/><path d="M5.6 6.6l.7 .7"/><path d="M18.4 6.6l-.7 .7"/><path d="M8 13a4 4 0 1 1 8 0"/><path d="M3 17h18"/><path d="M7 20h5"/><path d="M16 20h1"/><path d="M12 5v-1"/>',
  esha: '<path d="M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313 -12.454z"/>'
};
/* qaza prayed today = net qaza logged as offered today for that prayer */
function prayedToday(k){ const t = todayIso(); return -(D.wajibat.log||[]).filter(l => l.at && iso(new Date(l.at)) === t).reduce((s,l) => s + ((l.changes||{})[k]||0), 0) - (qPending[k]||0); }
/* what a signed copy must still match: people, debts, dues and unpaid khums (qaza counts only ever go down, so they do not void a copy) */
function willKey(){
  const p = {...(D.wajibat.profile||{})}; delete p.signedAt; delete p.signedKey; delete p.updatedAt;
  const kh = khums();
  const str = JSON.stringify([p, openDebts().map(d => [d.id, Math.round(debtStatus(d).leftNative)]), pendingItems().map(i => [i.id, itemStatus(i).left]), kh.unpaid.map(y => [y.year, Math.round(y.unpaid)])]);
  let h = 0; for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0; return String(h);
}
function qazaFinish(perDay){ const c = D.wajibat.qaza.counts||{}; const days = Math.ceil(Math.max(0, ...DAY.map(k => +c[k]||0)) / perDay); return {days, date: addDays(todayIso(), days)}; }
/* khums status wording shared by every tab */
function khumsStatus(kh){
  if (kh.unpaid.length) return {cls:"warn", word:"Unpaid", short:"Owed: " + kh.unpaid.map(y => y.year + " " + fmtC(y.unpaid, y.c)).join(", ")};
  const due = kh.daysTo == null ? "date not set" : kh.daysTo < 0 ? "date passed, close the year" : "payable 23 Ramadan, in " + kh.daysTo + " days";
  return {cls:"ok", word:"Nothing owed", short:due};
}
function lastYearNote(kh){ const y = kh.years[0]; if (!y) return ""; return y.year + ": " + (!(y.khumsDue > 0) ? "none was due" : y.unpaid <= 0.5 ? "paid in full" : fmtC(y.unpaid, y.c) + " unpaid"); }
function usuals(){
  const since = addDays(todayIso(), -150), g = {};
  F().txns.forEach(t => {
    if (t.category !== "Food" || t.date < since || !t.note || t.importedFrom === undefined && !t.vendor && t.note.indexOf(":") < 0) return;
    const vendor = (t.vendor || t.note.split(":")[0]).replace(/\s*\(WhatsApp\)\s*$/i, "").replace(/\s+-\s+.*$/, "").trim();
    if (!vendor || vendor.length > 40) return;
    const m = MEALS[t.meal] ? t.meal : "other", key = vendor + "|" + m;
    (g[key] = g[key] || {vendor, meal: m, xs: [], src: t.source || "Cash"}).xs.push(t.pkr);
  });
  return Object.values(g).filter(x => x.xs.length >= 2).sort((a,b) => b.xs.length - a.xs.length).slice(0, 8)
    .map(x => { const s = [...x.xs].sort((a,b) => a-b); return {...x, amount: Math.round(s[Math.floor(s.length/2)]), n: x.xs.length}; });
}
/* next due date of a bill: from its due day of month, else 30 days after last payment */
function billDue(b){
  const t = todayIso();
  if (b.dueDay){
    const td = parse(t); let d = new Date(td.getFullYear(), td.getMonth(), Math.min(b.dueDay, 28));
    const due = iso(d), paidFor = b.lastPaid && dayDiff(b.lastPaid, due) <= 6 && dayDiff(due, b.lastPaid) <= 20;
    const done = b.paidBy === "mentor" ? (b.remindedAt && dayDiff(b.remindedAt, due) <= 10 && dayDiff(due, b.remindedAt) <= 20) : paidFor;
    if (due < t || done) d = new Date(td.getFullYear(), td.getMonth() + 1, Math.min(b.dueDay, 28));
    return iso(d);
  }
  return b.lastPaid ? addDays(b.lastPaid, 30) : C().cycle.nextPay;
}
const myBills = () => F().bills.filter(b => b.paidBy !== "mentor");
let USUALS = [], lastUsual = null, qPending = {}, qT = null;

function renderToday(){
  const k = compute(), kh = khums(), ks = khumsStatus(kh), cfg = C();
  const rem = k.allowToday - k.spentToday, frac = k.allowToday > 0 ? rem / k.allowToday : 0;
  const now = new Date();
  $("todayDate").textContent = now.toLocaleDateString("en-GB", {weekday:"long", day:"numeric", month:"long", year:"numeric"});
  $("todayCycle").textContent = "Cycle day " + Math.min(k.len, dayDiff(cfg.cycle.start, todayIso()) + 1) + " of " + k.len + " · pay " + nice(cfg.cycle.nextPay);
  const rc = rem >= k.allowToday * 0.25 ? "#2dd4bf" : rem >= 0 ? "#fbbf24" : "#f87171";
  $("todayHero").innerHTML = ringSvg(frac, rc, 148, "rgba(255,255,255,.12)", `<small>today</small>${Math.max(0, Math.round(frac*100))}%`) +
    `<div class="hero-copy"><span class="eyebrow">Safe to spend today</span><b class="big">PKR ${fmt(Math.max(0, rem))}</b>` +
    `<span class="soft">PKR ${fmt(k.left)} left for the cycle · PKR ${fmt(k.spentToday)} spent today</span>` +
    `<span class="chip-status ${rem >= 0 ? "ok" : "bad"}" style="${rem >= 0 ? "" : "background:rgba(248,113,113,.2);color:#fca5a5"}">${rem >= 0 ? "On track" : "PKR " + fmt(-rem) + " over today"}</span></div>`;
  const third = pendingItems().filter(i => RELIGIOUS.includes(i.type));
  const kaf = third.reduce((s,i) => s + toPkr(itemStatus(i).left || 0, i.currency), 0);
  const nextBill = myBills().map(b => ({b, d: billDue(b)})).sort((a,b) => a.d.localeCompare(b.d))[0];
  const done = DAY.reduce((s,kk) => s + (prayedToday(kk) > 0 ? 1 : 0), 0);
  $("todayTiles").innerHTML =
    tile("Qaza owed", nfEn.format(qazaTotal()), done + " of 5 prayed with today's prayers", "due", "#wajibat") +
    tile("Khums", ks.word, ks.short, ks.cls, "#khums") +
    tile(third.length === 1 ? third[0].type === "kaffara" ? "Kaffara" : "Dues open" : "Dues open", third.length ? "<small>PKR</small>" + fmt(kaf) : "None", third.length ? "still open" : "nothing pending", third.length ? "warn" : "ok", "#money") +
    (nextBill ? tile("Next bill", esc(nextBill.b.name.replace(/\s*\(.*\)/, "")), fmtC(nextBill.b.amount, nextBill.b.currency) + " · " + nice(nextBill.d), "", "#money") : tile("Bills", "None", ""));
  const qc = D.wajibat.qaza.counts || {};
  const qTile = ([kk,en,ur], small) => {
    const n = +qc[kk] || 0, p = Math.max(0, prayedToday(kk)), base = kk.replace("_q", "");
    return `<div class="ptile${p ? " done" : ""}${small ? " small" : ""}"><button type="button" class="ptap" data-today-q="${kk}" ${n ? "" : "disabled"} aria-label="Prayed one ${esc(en)} qaza"><span class="top"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${PICON[base]}</svg><b>${nfEn.format(n)}</b></span><span class="nm"><b>${esc(en)}</b><span class="ur" lang="ur">${esc(ur)}</span></span></button>` +
      `<span class="st">${p ? `<button type="button" class="pminus" data-today-undo="${kk}" aria-label="Undo one ${esc(en)} qaza">−</button> ${p} prayed today` : (n ? "Tap for each one prayed" : "None owed")}</span></div>`;
  };
  const qasr = PRAYERS.slice(5).filter(([kk]) => (+qc[kk]||0) > 0 || prayedToday(kk) > 0);
  $("qazaToday").innerHTML = PRAYERS.slice(0, 5).map(x => qTile(x)).join("") + (qasr.length ? `<div class="qasr-row"><span class="eyebrow">Qasr (two rakat)</span>${qasr.map(x => qTile(x, true)).join("")}</div>` : "");
  const per = +$("qPace").value || 1, fin = qazaFinish(per);
  $("qPaceVal").textContent = per; $("qPaceDate").textContent = longDate(fin.date);
  USUALS = usuals();
  $("usuals").innerHTML = USUALS.length ? USUALS.map((u, i) => `<button type="button" class="usual" data-usual="${i}"><span class="mchip ${u.meal}">${u.meal === "other" ? "Food" : MEALS[u.meal]}</span><b>${esc(u.vendor)}</b><span class="muted">PKR ${fmt(u.amount)} · ${u.n} orders</span></button>`).join("") : '<div class="empty">Usuals appear once you have ordered from a place twice.</div>';
  renderAfford();
  const tl = [];
  tl.push({d: cfg.cycle.nextPay, cls: "", t: nice(cfg.cycle.nextPay) + " · Pay day", s: "PKR " + fmt(cfg.payAmount)});
  F().bills.forEach(b => { const d = billDue(b); if (dayDiff(todayIso(), d) <= 35) tl.push({d, cls: b.paidBy === "mentor" ? "" : "bill", t: nice(d) + " · " + b.name, s: b.paidBy === "mentor" ? "Paid by your mentor: send him a reminder" : fmtC(b.amount, b.currency) + ", about PKR " + fmt(toPkr(b.amount, b.currency))}); });
  if (kh.kh.next) tl.push({d: kh.kh.next, cls: "kh", t: nice(kh.kh.next) + " · 23 Ramadan", s: "Khums " + (kh.kh.label||"") + " becomes payable, about PKR " + fmt(kh.est)});
  $("timeline").innerHTML = tl.sort((a,b) => a.d.localeCompare(b.d)).map(x => `<li><span class="rail"><span class="dot ${x.cls}"></span><i></i></span><div class="body"><b>${esc(x.t)}</b><div>${esc(x.s)}</div></div></li>`).join("");
}
function renderAfford(){
  if (!D) return;
  const k = compute(), safe = k.allowToday - k.spentToday, amt = +$("afford").value || 0, h = $("affordHead"), b = $("affordBody");
  if (!(amt > 0)) { h.className = "chip-status"; h.textContent = "Type a price"; b.textContent = "See whether it fits today before you order."; return; }
  const after = safe - amt, rest = k.left - amt;
  if (after >= 0) { h.className = "chip-status ok"; h.textContent = "Yes, it fits"; b.textContent = "Leaves PKR " + fmt(after) + " for the rest of today."; }
  else if (rest >= 0) { h.className = "chip-status warn"; h.textContent = "Over today by PKR " + fmt(-after); b.textContent = "The cycle can take it, but each remaining day drops to about PKR " + fmt(rest / Math.max(1, k.daysLeft - 1)) + "."; }
  else { h.className = "chip-status bad"; h.textContent = "Not this cycle"; b.textContent = "That is PKR " + fmt(-rest) + " more than is left until pay day."; }
}

/* ================= planners ================= */
function wasiyatChecks(){
  const p = D.wajibat.profile || {}, signed = p.signedAt;
  const stale = signed && p.signedKey && p.signedKey !== willKey();
  return [
    {ok: !!(p.name_en && p.name_ur), t: "Your name, English and Urdu", s: p.name_en || "Add it in Wajibat, Wasiyat details", go: "#wajibat"},
    {ok: !!(p.father_en && p.father_ur), t: "Father's name", s: p.father_en || "Missing", go: "#wajibat"},
    {ok: !!(p.wasi_en && p.wasi_ur), t: "Executor named", s: p.wasi_en || "Missing", go: "#wajibat"},
    {ok: !!p.wasi_contact, t: "Executor's contact", s: p.wasi_contact ? "Saved" : "Missing", go: "#wajibat"},
    {ok: !!(p.wasi_email || p.wasi2_email), t: "Executors' email", s: [p.wasi_email, p.wasi2_email].filter(Boolean).join(", ") || "Add them to send the wasiyat by email", go: "#wajibat"},
    {ok: !!p.wasi2_en, t: "Backup executor", s: p.wasi2_en || "Needed if the executor cannot act", go: "#wajibat"},
    {ok: !!p.nazir_en, t: "Supervisor (nazir)", s: p.nazir_en || "Optional, guards the executor", go: "#wajibat"},
    {ok: !D.wajibat.items.some(i => i.status === "unclear"), t: "No unclear items", s: "Unclear items stay out of the wasiyat", go: "#wajibat"},
    {ok: !!signed && !stale, t: "Printed and signed, two witnesses", s: !signed ? "Never recorded" : stale ? "Signed " + longDate(signed) + ", records changed since" : "Signed " + longDate(signed), sign: true}
  ];
}
function renderPlanner(){
  const kh = khums(), ks = khumsStatus(kh), extra = +$("plExtra").value || 0;
  const st = $("plKhStatus"); st.className = "chip-status " + ks.cls; st.textContent = ks.word === "Nothing owed" ? "Nothing owed now" : ks.short;
  const ly = kh.years[0];
  $("plKhLine").innerHTML = `<div class="node"><span></span>${esc(ly ? ly.year : "Last year")}<br>${esc(ly ? (!(ly.khumsDue > 0) ? "none due" : ly.unpaid <= .5 ? "paid" : "unpaid") : "")}</div><span class="seg"></span><div class="node now"><span></span>Today<br>${esc(nice(todayIso()))}</div><span class="seg dash"></span><div class="node due"><span></span>23 Ramadan<br>${esc(kh.kh.next ? nice(kh.kh.next) : "set date")}</div>`;
  $("plKhNote").textContent = (kh.kh.label || "This year") + " becomes payable " + (kh.daysTo != null && kh.daysTo >= 0 ? "in " + kh.daysTo + " days" : "on 23 Ramadan") + ". Until then this is a running estimate that moves with your savings.";
  const held = kh.held + extra, tax = Math.max(0, held - (kh.hasCarry ? kh.kh.carryPkr : 0));
  $("plExtraVal").textContent = "PKR " + fmt(extra); $("plHeld").textContent = fmt(held); $("plTax").textContent = fmt(tax); $("plKh").textContent = "PKR " + fmt(tax / 5);
  const third = pendingItems().filter(i => FROM_THIRD.includes(i.type)), open = third.reduce((s,i) => s + toPkr(itemStatus(i).left || 0, i.currency), 0);
  $("plKafOpen").textContent = open ? "PKR " + fmt(open) + " open" : "Nothing open";
  const per = +$("plPer").value || 6000, n = open ? Math.ceil(open / per) : 0;
  $("plPerVal").textContent = "PKR " + fmt(per);
  $("plKafRing").innerHTML = ringSvg(open ? Math.min(1, per / open) : 1, "#d97706", 120, "var(--line)", `${n}<small>${n === 1 ? "pay" : "pays"}</small>`);
  $("plClear").textContent = n ? longDate(addDays(C().cycle.nextPay, 28 * (n - 1))) : "already clear";
  const c = D.wajibat.qaza.counts || {}, q = +$("plQ").value || 1, mx = Math.max(1, ...DAY.map(k => +c[k]||0));
  $("plQazaOwed").textContent = nfEn.format(qazaTotal()) + " owed"; $("plQVal").textContent = q;
  $("plQBars").innerHTML = PRAYERS.slice(0, 5).map(([k,en]) => { const v = +c[k]||0; return `<div class="b"><b>${esc(en)}</b><div><i style="width:${v / mx * 100}%"></i></div><span>${v ? nice(addDays(todayIso(), Math.ceil(v / q))) : "done"}</span></div>`; }).join("");
  $("plQAll").textContent = longDate(qazaFinish(q).date);
  const ch = wasiyatChecks(), okN = ch.filter(x => x.ok).length;
  $("plWRing").innerHTML = ringSvg(okN / ch.length, "#0d9488", 96, "var(--line)", Math.round(okN / ch.length * 100) + "%");
  $("plWMissing").textContent = okN === ch.length ? "Ready. Print and sign again after big changes." : (ch.length - okN) + " thing" + (ch.length - okN === 1 ? "" : "s") + " left before it is ready to sign.";
  $("plChecks").innerHTML = ch.map(x => `<div class="check${x.ok ? "" : " miss"}"><span class="box">${x.ok ? '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true" style="width:14px;height:14px;stroke-width:3"><path d="M5 12l5 5l10 -10"/></svg>' : ""}</span><span class="tx"><b>${esc(x.t)}</b><span>${esc(x.s)}</span></span>${x.sign ? '<button class="btn small ghost" type="button" data-signed>Signed today</button>' : x.ok ? "" : '<a class="btn small ghost" href="' + x.go + '">Fix</a>'}</div>`).join("");
}
function renderSettingsChip(){ const c = $("connChip"); if (!c) return; c.className = "chip-status " + (base ? "ok" : ""); c.textContent = base ? "Connected" : "Not connected"; }

/* ================= money ================= */
let meal = "";
function renderMoney(){
  const cfg = C(), c = cfg.cycle, k = compute();
  $("cycleLabel").textContent = "Cycle " + nice(c.start) + " to " + nice(addDays(c.nextPay, -1));
  $("left").innerHTML = "<small>PKR</small>" + fmt(k.left); $("left").style.color = k.left < 0 ? "var(--bad)" : "";
  $("leftSub").textContent = "of PKR " + fmt(c.opening) + " opening, " + fmt(k.spent) + " spent";
  $("perDay").innerHTML = "<small>PKR</small>" + fmt(Math.max(0, k.perDay));
  $("perDaySub").textContent = "for " + k.daysLeft + " day" + (k.daysLeft === 1 ? "" : "s") + " incl. today";
  $("today").innerHTML = "<small>PKR</small>" + fmt(k.spentToday);
  const rem = k.allowToday - k.spentToday;
  const pill = rem >= k.allowToday * 0.25 ? ["good", "PKR " + fmt(rem) + " left today"] : rem >= 0 ? ["warn", "PKR " + fmt(rem) + " left today"] : ["bad", "PKR " + fmt(-rem) + " over today"];
  $("todayPill").innerHTML = '<span class="pill '+pill[0]+'">'+pill[1]+'</span>';
  const dTo = dayDiff(todayIso(), c.nextPay);
  $("payIn").textContent = dTo <= 0 ? "Due" : dTo + (dTo === 1 ? " day" : " days");
  $("payDate").textContent = nice(c.nextPay) + " · PKR " + fmt(cfg.payAmount);
  const spentPct = c.opening > 0 ? Math.min(100, k.spent / c.opening * 100) : 0, ahead = spentPct > k.elapsed*100 + 8;
  $("spentBar").style.width = spentPct + "%"; $("spentBar").style.background = ahead ? "var(--warn)" : "var(--accent)";
  $("timeMark").style.left = (k.elapsed*100) + "%";
  $("paceText").textContent = Math.round(spentPct) + "% of the money spent, " + Math.round(k.elapsed*100) + "% of the cycle gone. " + (ahead ? "Spending is running ahead of the calendar." : "You are on pace.");
  renderMeals(k); renderChart(); renderPlan(); renderWajDues(); renderDebts(); renderBills(); renderBalances(k); renderTx(k); renderCapHint();
}
function renderMeals(k){
  const caps = C().caps || {}, food = k.tx.filter(t => t.category === "Food");
  $("foodTotal").textContent = "PKR " + fmt(food.reduce((s,t)=>s+t.pkr,0)) + " on food this cycle";
  $("meals").innerHTML = Object.keys(MEALS).map(m => {
    const rows = food.filter(t => t.meal === m), avg = rows.length ? rows.reduce((s,t)=>s+t.pkr,0)/rows.length : 0;
    const over = rows.filter(t => t.pkr > (caps[m]||0)).length;
    const cls = !rows.length ? "" : avg <= caps[m] ? "good" : avg <= caps[m]*1.15 ? "warn" : "bad";
    return '<div class="meal"><div class="name"><i style="background:'+MEAL_COLOR[m]+'"></i>'+MEALS[m]+'</div><div class="mid"><small>cap</small>'+fmt(caps[m]||0)+'</div>' +
      '<div class="muted sm">'+(rows.length ? 'Avg <span class="num">'+fmt(avg)+'</span> over '+rows.length+' order'+(rows.length===1?'':'s') : 'No orders yet this cycle')+'</div>' +
      (rows.length ? '<span class="pill '+cls+'">'+(over ? over+' over cap' : 'All within cap')+'</span>' : '') + '</div>';
  }).join("");
}
function foodPlan(cfg){
  const caps = cfg.caps || {}, mp = cfg.mealsPerCycle || {nashta:28, dinner:28, snack:0};
  return {mp, total: (mp.nashta||0)*(caps.nashta||0) + (mp.dinner||0)*(caps.dinner||0) + (mp.snack||0)*(caps.snack||0) + (cfg.otherFood||0)};
}
function renderChart(){
  const dailyCap = Math.round(foodPlan(C()).total / 28), days = [];
  for (let i = 13; i >= 0; i--) days.push(addDays(todayIso(), -i));
  const data = days.map(d => { const r = {d, nashta:0, dinner:0, snack:0, other:0};
    F().txns.filter(t => t.date === d && t.category === "Food").forEach(t => { r[MEALS[t.meal] ? t.meal : "other"] += t.pkr; });
    r.total = r.nashta + r.dinner + r.snack + r.other; return r; });
  const maxV = Math.max(dailyCap * 1.25, ...data.map(r => r.total), 100), step = maxV > 4000 ? 1000 : maxV > 1600 ? 500 : 250, top = Math.ceil(maxV / step) * step;
  const W = 700, H = 230, L = 48, R = 10, T = 12, B = 34, iw = W-L-R, ih = H-T-B, bw = iw / data.length, y = v => T + ih - v / top * ih;
  let s = '<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Food spending per day for the last 14 days">';
  for (let v = 0; v <= top; v += step) s += '<line x1="'+L+'" x2="'+(W-R)+'" y1="'+y(v)+'" y2="'+y(v)+'" stroke="var(--line)"/><text x="'+(L-6)+'" y="'+(y(v)+4)+'" text-anchor="end" font-size="11" fill="var(--muted)" font-family="JetBrains Mono, monospace">'+fmt(v)+'</text>';
  data.forEach((r, i) => {
    const x = L + i*bw + bw*0.18, w = bw*0.64; let acc = 0;
    ["nashta","dinner","snack","other"].forEach(m => { if (!r[m]) return; const y1 = y(acc + r[m]), h = y(acc) - y1;
      s += '<rect x="'+x+'" y="'+y1+'" width="'+w+'" height="'+Math.max(0,h-1)+'" rx="2" fill="'+MEAL_COLOR[m]+'"><title>'+(MEALS[m]||"Other food")+': PKR '+fmt(r[m])+'</title></rect>'; acc += r[m]; });
    const dd = parse(r.d), isT = r.d === todayIso();
    s += '<text x="'+(x+w/2)+'" y="'+(H-B+15)+'" text-anchor="middle" font-size="10.5" fill="'+(isT?'var(--fg)':'var(--muted)')+'" font-weight="'+(isT?'700':'400')+'">'+dd.getDate()+'</text>';
    if (i === 0 || dd.getDate() === 1) s += '<text x="'+(x+w/2)+'" y="'+(H-B+28)+'" text-anchor="middle" font-size="10" fill="var(--muted)">'+dd.toLocaleDateString("en-GB",{month:"short"})+'</text>';
    if (r.total) s += '<text x="'+(x+w/2)+'" y="'+(y(r.total)-4)+'" text-anchor="middle" font-size="9.5" fill="var(--muted)" font-family="JetBrains Mono, monospace">'+fmt(r.total)+'</text>';
  });
  if (dailyCap) s += '<line x1="'+L+'" x2="'+(W-R)+'" y1="'+y(dailyCap)+'" y2="'+y(dailyCap)+'" stroke="var(--fg)" stroke-width="1.5" stroke-dasharray="5 4"/>';
  $("chart").innerHTML = s + '</svg>';
}
function renderPlan(){
  const cfg = C(), inc = cfg.payAmount || 0;
  const billRows = myBills().map(b => ({label: b.name, v: toPkr(b.amount, b.currency), color: "var(--dinner)", note: fmtC(b.amount, b.currency)}));
  const fpl = foodPlan(cfg), save = cfg.savePerCycle || 0, waj = cfg.wajibatPerCycle || 0;
  const wajLeft = pendingItems().filter(i => RELIGIOUS.includes(i.type)).reduce((s,i) => { const st = itemStatus(i); return s + (st.left ? toPkr(st.left, i.currency) : 0); }, 0);
  const used = billRows.reduce((s,r)=>s+r.v,0) + fpl.total + save + waj, buffer = inc - used;
  const rows = [...billRows,
    {label: "Savings", v: save, color: "var(--accent)", note: "emergency fund first"},
    ...(waj || wajLeft ? [{label: "Wajibat set-aside", v: waj, color: "var(--due)", note: waj ? "PKR " + fmt(wajLeft) + " of kaffara and dues open, about " + Math.ceil(wajLeft / waj) + " cycle(s) to clear" : "PKR " + fmt(wajLeft) + " open. Set an amount in Settings"}] : []),
    {label: "Food (28 days)", v: fpl.total, color: "var(--nashta)", note: fpl.mp.nashta + " nashta, " + fpl.mp.dinner + " dinners, " + fpl.mp.snack + " snacks at cap, plus PKR " + fmt(cfg.otherFood||0) + " other food"},
    {label: buffer >= 0 ? "Everything else" : "Short by", v: Math.abs(buffer), color: buffer >= 0 ? "var(--food-other)" : "var(--bad)", note: buffer >= 0 ? "transport, phone, family, extras" : "plan costs more than the pay"}];
  $("planIncome").textContent = "PKR " + fmt(inc) + " per 4 weeks";
  const total = Math.max(inc, used), op = i => i < billRows.length ? (1 - i*0.25) : 1;
  $("planStack").innerHTML = rows.map((r,i) => '<i style="width:'+(r.v/total*100)+'%;background:'+r.color+';opacity:'+op(i)+'"></i>').join("");
  $("planList").innerHTML = rows.map((r,i) => '<li><i style="background:'+r.color+';opacity:'+op(i)+'"></i><span>'+esc(r.label)+' <span class="muted sm">'+esc(r.note)+'</span></span><span class="num">'+fmt(r.v)+'</span><span class="pct num">'+(inc? Math.round(r.v/inc*100):0)+'%</span></li>').join("");
  const billShare = inc ? Math.round(billRows.reduce((s,r)=>s+r.v,0)/inc*100) : 0;
  $("planNote").textContent = "Bills take " + billShare + "% of each pay. Bills are monthly and pay is every 4 weeks, so about once a year a cycle has no bill in it: send that whole amount to savings.";
}
function curOptions(sel){ return CURRENCIES.map(([c]) => '<option value="'+c+'"'+(c===sel?' selected':'')+'>'+c+'</option>').join(""); }
function renderWajDues(){
  const items = pendingItems().filter(i => RELIGIOUS.includes(i.type));
  $("wajDues").innerHTML = items.length ? items.map(i => {
    const st = itemStatus(i), ty = TYPES[i.type] || TYPES.other;
    const pays = (i.payments||[]).map(p => fmtC(p.amount,p.currency)+" on "+nice(p.date)).join(", ");
    return '<li><div style="display:grid;gap:2px"><span class="pill due">'+esc(ty[0])+'</span><span style="font-weight:700">'+esc(i.title)+'</span>' +
      '<span class="sub">'+(i.amount != null ? fmtC(i.amount, i.currency) + " in all" : "Amount not set") + (pays ? ". Paid: " + esc(pays) : "") + '</span></div>' +
      '<div class="mid" style="font-size:1.05rem;text-align:right">'+(st.left != null ? fmtC(st.left, i.currency) : "-")+'</div>' +
      (st.left ? '<form class="inline-form" data-payitem="'+esc(i.id)+'"><input type="number" step="any" min="0" value="'+Math.round(st.left)+'" aria-label="Amount paid" required><select aria-label="Currency">'+curOptions(i.currency||"PKR")+'</select><button class="btn small ghost" type="submit">Paid, log it</button></form>' : '') + '</li>';
  }).join("") : '<li class="empty">No kaffara, fidya, nazr or mazalim open.</li>';
}
function renderDebts(){
  const list = [...D.debts].sort((a,b) => (debtStatus(b).open - debtStatus(a).open));
  const open = list.filter(d => debtStatus(d).open), closed = list.filter(d => !debtStatus(d).open);
  const row = d => {
    const st = debtStatus(d), inbound = d.direction === "owed_to_me";
    const pays = (d.payments||[]).map(p => fmtC(p.amount,p.currency)+" on "+nice(p.date)).join(", ");
    return '<li><div style="display:grid;gap:2px"><span class="dir '+(inbound?'in':'out')+'">'+(inbound?'Owes you':'You owe')+'</span>' +
      '<span style="font-weight:700">'+esc(d.person)+(d.person_ur ? ' <span class="ur muted" lang="ur">'+esc(d.person_ur)+'</span>' : '')+'</span>' +
      '<span class="sub">'+fmtC(d.amount,d.currency)+(pays ? '. Repaid: '+esc(pays) : '')+(d.note ? '. '+esc(d.note) : '')+'</span>' +
      (d.khumsPaid ? '<span class="pill good">Khums already paid</span>' : '') + '</div>' +
      '<div style="text-align:right"><div class="mid" style="font-size:1.05rem">'+(st.open ? 'PKR '+fmt(st.left) : 'Settled')+'</div>' +
      (st.open && d.currency !== "PKR" ? '<div class="sub num">≈ '+fmtC(st.leftNative, d.currency)+' left</div>' : '') + '</div>' +
      (st.open ? '<form class="inline-form" data-debt="'+esc(d.id)+'"><input type="number" step="any" min="0" placeholder="Repayment" aria-label="Repayment amount" required><select aria-label="Repayment currency">'+curOptions(d.currency)+'</select><button class="btn small ghost" type="submit">Record</button><button class="btn small ghost" type="button" data-settle="'+esc(d.id)+'">Mark settled</button></form>' : '') + '</li>';
  };
  $("debts").innerHTML = (open.map(row).join("") || '<li class="empty">No open loans.</li>') +
    (closed.length ? '<li style="display:block"><details><summary class="sm">Settled ('+closed.length+')</summary><ul class="items">'+closed.map(row).join("")+'</ul></details></li>' : "");
}
function renderBills(){
  const row = b => {
    const due = billDue(b), mentor = b.paidBy === "mentor", paid = !mentor && b.lastPaid && b.lastPaid >= C().cycle.start;
    const sub = fmtC(b.amount,b.currency) + " a month" + (mentor ? "" : " ≈ PKR " + fmt(toPkr(b.amount,b.currency))) + " · due " + nice(due) +
      (mentor ? (b.remindedAt ? " · reminded " + nice(b.remindedAt) : "") : (b.lastPaid ? " · last paid " + nice(b.lastPaid) : ""));
    const act = mentor ? '<button class="btn small ghost" data-remind-bill="'+esc(b.id)+'">Reminded</button>' :
      paid ? '<span class="pill good">Paid this cycle</span>' : '<button class="btn small ghost" data-pay-bill="'+esc(b.id)+'">Paid</button>';
    return '<li><div><div style="font-weight:700">'+esc(b.name)+(mentor ? ' <span class="pill due">Paid by mentor</span>' : '')+'</div><div class="sub">'+sub+'</div></div>' + act + '</li>';
  };
  const mine = myBills(), theirs = F().bills.filter(b => b.paidBy === "mentor");
  $("bills").innerHTML = (mine.map(row).join("") || '<li class="empty">No bills yet.</li>') +
    (theirs.length ? '<li style="display:block;border-top:1px solid var(--line);padding-top:12px"><span class="eyebrow">On your account, paid by your mentor (not in your budget)</span></li>' + theirs.map(row).join("") : "");
}
function renderBalances(k){
  const cfg = C(), saved = savings();
  const fx = (cfg.foreignCash||[]).map(f => '<li><div><div style="font-weight:700">'+esc(f.currency)+' cash</div><div class="sub">≈ PKR '+fmt(toPkr(f.amount,f.currency))+(f.note?' · '+esc(f.note):'')+'</div></div><span class="mid" style="font-size:1.05rem">'+fmtC(f.amount,f.currency)+'</span></li>').join("");
  const months = cfg.payAmount ? saved / (cfg.payAmount - (cfg.savePerCycle||0)) : 0;
  $("balances").innerHTML =
    '<li><div><div style="font-weight:700">Savings</div><div class="sub">Covers about '+(Math.round(months*10)/10)+' of a cycle. Aim for 3 cycles.</div></div><span class="mid" style="font-size:1.05rem">PKR '+fmt(saved)+'</span></li>' +
    '<li><div><div style="font-weight:700">Spending money</div><div class="sub">Left in this cycle</div></div><span class="mid" style="font-size:1.05rem">PKR '+fmt(k.left)+'</span></li>' + fx;
}
function renderTx(k){
  const rows = [...k.tx].sort((a,b) => (b.date+(b.createdAt||"")).localeCompare(a.date+(a.createdAt||"")));
  $("txCount").textContent = rows.length + " entr" + (rows.length===1?"y":"ies");
  if (!rows.length){ $("txWrap").innerHTML = '<div class="empty">Nothing logged in this cycle yet. Add a spend on the Today tab.</div>'; return; }
  $("txWrap").innerHTML = '<table><thead><tr><th>Date</th><th>What</th><th>Category</th><th>Paid by</th><th class="r">Amount</th><th class="r">PKR</th><th><span style="position:absolute;left:-9999px">Delete</span></th></tr></thead><tbody>' +
    rows.map(t => '<tr><td>'+nice(t.date)+'</td><td>'+(t.meal && MEALS[t.meal] ? '<span class="tag"><i style="background:'+MEAL_COLOR[t.meal]+'"></i>'+MEALS[t.meal]+'</span> ' : '')+esc(t.note||"")+'</td>' +
      '<td><span class="tag"><i style="background:'+(CAT_COLOR[t.category]||"var(--food-other)")+'"></i>'+esc(t.category)+'</span></td><td class="muted">'+esc(t.source||"")+'</td>' +
      '<td class="r num">'+(t.currency==="PKR"?"":fmtC(t.amount,t.currency))+'</td><td class="r num">'+fmt(t.pkr)+'</td>' +
      '<td class="r"><button class="x" data-del="'+esc(t.id)+'" aria-label="Delete entry">✕</button></td></tr>').join("") + '</tbody></table>';
}
function renderCapHint(){
  const el = $("capHint"), amt = +$("fAmount").value, cur = $("fCur").value;
  if (!D) return;
  if (!amt){ el.textContent = meal ? "Cap for " + MEALS[meal] + ": PKR " + fmt(C().caps?.[meal]||0) : ""; el.className = "hint"; return; }
  const pkr = toPkr(amt, cur) + (+$("fDel").value || 0);
  if (meal){
    const cap = C().caps?.[meal] || 0, diff = cap - pkr;
    el.textContent = (cur!=="PKR" ? "≈ PKR "+fmt(pkr)+". " : "") + (diff >= 0 ? "PKR " + fmt(diff) + " under the " + MEALS[meal].toLowerCase() + " cap." : "PKR " + fmt(-diff) + " over the " + MEALS[meal].toLowerCase() + " cap.");
    el.className = "hint " + (diff >= 0 ? "good" : diff > -cap*0.15 ? "warn" : "bad");
  } else {
    const k = compute(), after = k.allowToday - k.spentToday - pkr;
    el.textContent = (cur!=="PKR" ? "≈ PKR "+fmt(pkr)+". " : "") + (after >= 0 ? "Leaves PKR " + fmt(after) + " for the rest of today." : "Takes you PKR " + fmt(-after) + " past today's safe amount.");
    el.className = "hint " + (after >= 0 ? "good" : "warn");
  }
}

/* ================= khums ================= */
function renderKhums(){
  const m = khums(), kh = m.kh;
  const ks = khumsStatus(m);
  const st = $("khStatus"); st.className = "chip-status " + ks.cls; st.textContent = ks.word === "Nothing owed" ? "Nothing owed today" : ks.short;
  $("khLast").textContent = lastYearNote(m); $("khLast").hidden = !m.years.length;
  $("khPayable").textContent = "Payable on 23 Ramadan " + (kh.label || "") + (m.daysTo != null && m.daysTo >= 0 ? " · in " + m.daysTo + " days" : "");
  $("khEst").innerHTML = "<small>about PKR</small>" + fmt(m.est);
  $("khEstSub").textContent = !m.hasCarry ? "Running estimate before subtracting mukhamas, so likely too high" : m.taxable > 0 ? "Running estimate: one fifth of PKR " + fmt(m.taxable) + " you hold above the mukhamas. It moves with your savings until the day." : "Holdings are below the mukhamas, so none would be due at this rate";
  $("khDate").textContent = kh.next ? "About " + longDate(kh.next) + ", depends on moon sighting" : "Set the date in Settings";
  const sv = savings(), kl = Math.max(0, compute().left), owe = m.pay;
  const row = (l, v, cls) => `<div class="${cls||""}"><span>${l}</span><span>${v}</span></div>`;
  $("khCalc").innerHTML = row("Savings", "PKR " + fmt(sv)) + row("Spending money left this cycle", "PKR " + fmt(kl)) +
    (m.fx ? row("Foreign cash", "PKR " + fmt(m.fx)) : "") + row("Owed to you (khums not yet paid on it)", "PKR " + fmt(m.recv)) +
    (owe ? row("Less what you owe", "- PKR " + fmt(owe), "neg") : "") + row("Held now", "PKR " + fmt(m.held), "sum") +
    (m.hasCarry ? row("Less mukhamas carried in", "- PKR " + fmt(kh.carryPkr), "dim") : "") + row("Surplus above mukhamas", "PKR " + fmt(Math.max(0, m.taxable)), "sum");
  const b = $("khUnpaid");
  b.hidden = !m.unpaid.length;
  b.textContent = m.unpaid.length ? "Unpaid khums: " + m.unpaid.map(y => y.year + " " + fmtC(y.unpaid, y.c)).join(", ") + ". This is listed in the wasiyat as a debt on the whole estate until recorded as paid." : "";
  $("khTable").innerHTML = !m.years.length ? '<div class="empty">No khums years recorded yet.</div>' :
    '<table><thead><tr><th>Year</th><th>23 Ramadan</th><th class="r">Savings</th><th class="r">Mukhamas in</th><th class="r">Khums due</th><th class="r">Mukhamas out</th><th>Paid</th></tr></thead><tbody>' +
    m.years.map(y => {
      const c = y.c, n = v => typeof v === "number" ? fmtC(v, c) : '<span class="muted">not recorded</span>', due = y.khumsDue || 0;
      const st = due <= 0 ? '<span class="pill good">None due</span>' : y.unpaid <= 0.5 ? '<span class="pill good">Paid</span>' : (y.payments||[]).length ? '<span class="pill warn">' + fmtC(y.unpaid, c) + ' left</span>' : '<span class="pill warn">Payment not recorded</span>';
      const plist = (y.payments||[]).map(p => esc(p.share) + ': ' + fmtC(p.amount,p.currency) + ' on ' + nice(p.date) + (p.to ? ' to ' + esc(p.to) : '')).join('<br>');
      return '<tr><td><strong>' + esc(y.year) + '</strong><div class="muted" style="font-size:.78rem">' + esc(y.period||"") + '</div>' + (y.gregorian ? '<div style="font-size:.78rem;font-weight:600">' + esc(y.gregorian) + '</div>' : '') + '</td><td>' + (y.date ? nice(y.date) : "") + '</td>' +
        '<td class="r num">' + n(y.savings) + '</td><td class="r num">' + n(y.mukhamasIn) + '</td><td class="r num">' + (typeof y.khumsDue === "number" ? fmtC(y.khumsDue, c) : "") + '</td><td class="r num">' + n(y.mukhamasOut) + '</td>' +
        '<td>' + st + (plist ? '<div class="muted" style="font-size:.78rem;margin-top:4px">' + plist + '</div>' : '') + (y.note ? '<div class="muted" style="font-size:.78rem;margin-top:4px">' + esc(y.note) + '</div>' : '') + '</td></tr>';
    }).join("") + '</tbody></table>';
  const sel = $("kYear"), cur = sel.value;
  sel.innerHTML = m.years.map(y => '<option value="' + esc(y.id) + '">' + esc(y.year) + '</option>').join("");
  if (cur) sel.value = cur; else if (m.unpaid[0]) sel.value = m.unpaid[0].id;
}

/* ================= wajibat ================= */
const qazaTotal = () => { const c = D.wajibat.qaza.counts || {}; return PRAYERS.reduce((a,[k]) => a + (+c[k]||0), 0); };
function renderWajibat(){
  const q = D.wajibat.qaza, c = q.counts || {}, kh = khums(), pend = pendingItems();
  const relOpen = pend.filter(i => RELIGIOUS.includes(i.type)).length + kh.unpaid.length;
  const ks = khumsStatus(kh);
  $("wajTiles").innerHTML = tile("Qaza prayers", nfEn.format(qazaTotal()), "done by " + nice(qazaFinish(1).date) + " at one a prayer", "due") +
    tile("Qaza fasts", nfEn.format(+q.roza||0), (+q.roza ? "still owed" : "none owed")) +
    tile("Owed now", relOpen ? nfEn.format(relOpen) : "None", relOpen ? pend.filter(i => RELIGIOUS.includes(i.type)).map(i => (TYPES[i.type]||TYPES.other)[0]).concat(kh.unpaid.map(y => "khums " + y.year)).join(", ") : "nothing pending", relOpen ? "warn" : "ok") +
    tile("Khums", ks.word, ks.short, ks.cls, "#khums") +
    tile("Debts", openDebts().filter(d => d.direction !== "owed_to_me").length + " / " + openDebts().filter(d => d.direction === "owed_to_me").length, "I owe / owed to me", "", "#money");
  $("prayers").innerHTML = PRAYERS.map(([k,en,ur]) => { const n = +c[k]||0; return `<div class="prayer"><div class="name">${esc(en)}<span class="ur" lang="ur">${esc(ur)}</span></div>
    <div class="count${n?"":" zero"}">${nfEn.format(n)}</div><div class="acts"><button class="btn ghost" type="button" data-k="${k}" data-d="-1" ${n?"":"disabled"}>✓ Offered</button><button class="btn ghost" type="button" data-k="${k}" data-d="1">+ Missed</button></div></div>`; }).join("");
  $("rozaCount").textContent = nfEn.format(+q.roza||0);
  const name = k => k === "roza" ? "Roza" : (PRAYERS.find(p => p[0] === k) || [0,k])[1];
  const log = (D.wajibat.log||[]).slice(0, 8);
  $("log").innerHTML = log.length ? log.map(l => `<li>${esc(new Date(l.at).toLocaleString("en-GB",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"}))}: ${Object.entries(l.changes||{}).map(([k,d]) => `${esc(name(k))} ${d<0?"offered "+(-d):"missed +"+d}`).join(", ")}</li>`).join("") : "<li>No changes logged yet.</li>";
  const items = D.wajibat.items, order = {unclear:0, pending:1, cleared:2};
  const open = items.filter(i => i.status !== "cleared").sort((a,b) => order[a.status]-order[b.status] || a.type.localeCompare(b.type));
  const done = items.filter(i => i.status === "cleared");
  $("itemsList").innerHTML = open.length ? open.map(itemCard).join("") : '<div class="empty">Nothing pending.</div>';
  $("clearedItems").innerHTML = done.map(itemCard).join("") || '<div class="empty">No cleared items yet.</div>';
  $("clearedSummary").textContent = "Cleared items (" + done.length + ")";
  const un = items.filter(i => i.status === "unclear"), b = $("unclearBanner");
  b.hidden = !un.length; b.textContent = un.length ? un.length + " item(s) need confirming before they enter the wasiyat: " + un.map(i => i.title).join(", ") + "." : "";
  const f = $("profileForm"), p = D.wajibat.profile || {};
  for (const el of f.elements) if (el.name && document.activeElement !== el && !f.dataset.dirty) el.value = p[el.name] || "";
}
function itemCard(it){
  const ty = TYPES[it.type] || TYPES.other, st = itemStatus(it);
  return `<div class="item${it.status==="cleared"?" is-cleared":""}"><div class="t">${esc(it.title)}${it.title_ur?`<span class="ur" lang="ur">${esc(it.title_ur)}</span>`:""}</div>
    <div class="amt">${it.amount != null ? esc(fmtC(st.left, it.currency)) + (st.paid ? `<div class="muted sm">of ${esc(fmtC(it.amount, it.currency))}</div>` : "") : ""}</div>
    <div class="meta"><span class="pill type">${esc(ty[0])}</span><span class="pill ${it.status==="cleared"?"good":it.status==="unclear"?"due":"warn"}">${esc(it.status)}</span>${it.contact?`<span dir="ltr">${esc(it.contact)}</span>`:""}
      <span style="flex:1"></span>${it.status!=="cleared"?`<button class="btn small ghost" type="button" data-clear="${esc(it.id)}">Mark cleared</button>`:""}<button class="btn small ghost" type="button" data-edit="${esc(it.id)}">Edit</button></div>
    ${it.note?`<div class="note">${esc(it.note)}</div>`:""}</div>`;
}
function itemForm(it){
  const isNew = !it; it = it || {type:"kaffara", status:"pending", currency:"PKR"};
  const opt = (o,v) => Object.entries(o).map(([k,l]) => `<option value="${k}"${k===v?" selected":""}>${esc(Array.isArray(l)?l[0]:l)}</option>`).join("");
  $("formSlot").innerHTML = `<form class="panel" id="itemForm" autocomplete="off">
    <label>Type<select name="type">${opt(TYPES,it.type)}</select></label>
    <label>Status<select name="status">${opt({pending:"pending",cleared:"cleared",unclear:"unclear (keep out of wasiyat)"},it.status)}</select></label>
    <label>Title (English)<input name="title" required value="${esc(it.title||"")}"></label>
    <label>Title (Urdu)<input name="title_ur" class="ur" dir="rtl" lang="ur" value="${esc(it.title_ur||"")}"></label>
    <label>Amount<input name="amount" inputmode="decimal" value="${it.amount??""}"></label>
    <label>Currency<select name="currency">${curOptions(it.currency||"PKR")}</select></label>
    <label>Contact<input name="contact" dir="ltr" value="${esc(it.contact||"")}"></label>
    <label class="full">Note (English)<textarea name="note">${esc(it.note||"")}</textarea></label>
    <label class="full">Note (Urdu, optional)<textarea name="note_ur" class="ur" dir="rtl" lang="ur">${esc(it.note_ur||"")}</textarea></label>
    <div class="full toolbar"><button class="btn" type="submit">${isNew?"Add":"Save changes"}</button><button class="btn ghost" type="button" id="f_cancel">Cancel</button>${isNew?"":`<span style="flex:1"></span><button class="btn ghost" type="button" id="f_delete">Delete</button>`}</div></form>`;
  const f = $("itemForm"); f.scrollIntoView({block:"nearest"});
  $("f_cancel").onclick = () => $("formSlot").innerHTML = "";
  if (!isNew){ let armed = false; $("f_delete").onclick = e => { if (!armed){ armed = true; e.target.textContent = "Tap again to delete"; return; }
    const id = it.id; change(d => { d.wajibat.items = d.wajibat.items.filter(x => x.id !== id); }, "Delete obligation"); $("formSlot").innerHTML = ""; }; }
  f.onsubmit = ev => { ev.preventDefault(); const fd = Object.fromEntries(new FormData(f)), amt = String(fd.amount||"").replace(/,/g,"").trim();
    if (amt !== "" && !isFinite(+amt)) { toast("Amount must be a number."); return; }
    const out = {...it, ...fd, amount: amt === "" ? null : +amt, updatedAt: new Date().toISOString()};
    if (isNew) out.id = uid(fd.type);
    change(d => { const i = d.wajibat.items.findIndex(x => x.id === out.id); if (i < 0) d.wajibat.items.push(out); else d.wajibat.items[i] = {...d.wajibat.items[i], ...out, payments: d.wajibat.items[i].payments}; }, isNew ? "Add obligation" : "Edit obligation");
    $("formSlot").innerHTML = ""; };
}

/* ================= wasiyat ================= */
const blank = (v, label) => v ? esc(v) : `<span class="blank">[${esc(label)}]</span>`;
function wasiyatModel(){
  const c = D.wajibat.qaza.counts || {}, p = D.wajibat.profile || {}, pend = pendingItems();
  const withLeft = i => ({...i, amount: itemStatus(i).left});
  const debtAsItem = d => { const st = debtStatus(d); return {title: d.person, title_ur: d.person_ur, amount: st.leftNative >= 1000 ? Math.round(st.leftNative) : Math.round(st.leftNative*100)/100, currency: d.currency, contact: d.contact,
    note: [d.note, (d.payments||[]).length ? "Original amount " + fmtC(d.amount, d.currency) + ", repaid so far " + (d.payments||[]).map(x => fmtC(x.amount, x.currency)).join(" + ") : ""].filter(Boolean).join(". "), note_ur: d.note_ur}; };
  const kh = khums();
  return {p, prayers: PRAYERS.filter(([k]) => +c[k] > 0).map(([k,en,ur]) => ({k,en,ur,n:+c[k]})), total: qazaTotal(), roza: +D.wajibat.qaza.roza||0,
    whole: pend.filter(i => RELIGIOUS.includes(i.type) && !FROM_THIRD.includes(i.type)).map(withLeft),
    third: pend.filter(i => FROM_THIRD.includes(i.type)).map(withLeft),
    owe: openDebts().filter(d => d.direction !== "owed_to_me").map(debtAsItem),
    due: openDebts().filter(d => d.direction === "owed_to_me").map(debtAsItem),
    amanat: pend.filter(i => i.type === "amanat"), other: pend.filter(i => i.type === "other"),
    kh, asOf: D.updatedAt || new Date().toISOString()};
}
const amtEn = it => it.amount == null || it.amount === "" ? "" : fmtC(it.amount, it.currency);
const amtUr = it => it.amount == null || it.amount === "" ? "" : nfUr.format(it.amount) + " " + (CUR_UR[it.currency] || it.currency || "");
function khumsClauseUr(m){
  const kh = m.kh, N = n => nfUr.format(Math.round(n));
  let h = "";
  if (kh.unpaid.length) h += `<p>ذیل کے سالوں کا خمس ابھی ادا نہیں ہوا، یہ میرے ذمے قرض ہے اور ترکے کی تقسیم سے پہلے پورے ترکے سے ادا کیا جائے:</p><ul>${kh.unpaid.map(y => `<li>سال <bdi>${esc(urDigits(y.year))}</bdi>: <bdi>${esc(nfUr.format(Math.round(y.unpaid*100)/100) + " " + (CUR_UR[y.c]||y.c))}</bdi></li>`).join("")}</ul>`;
  const asc = [...kh.years].reverse(), paidYears = asc.filter(y => (y.khumsDue||0) > 0 && y.unpaid <= 0.5).map(y => y.year), noneYears = asc.filter(y => !(y.khumsDue > 0)).map(y => y.year);
  if (paidYears.length) h += `<p>سال <bdi>${esc(urDigits(paidYears.join("، ")))}</bdi> کا خمس مکمل ادا ہو چکا ہے۔${noneYears.length ? ` سال <bdi>${esc(urDigits(noneYears.join("، ")))}</bdi> میں بچت مخمس مال سے کم رہی، اس لیے ان پر خمس واجب نہ ہوا۔` : ""}</p>`;
  h += `<p>میرا خمس کا سال ماہِ رمضان المبارک کی تئیسویں تاریخ کو مکمل ہوتا ہے۔ موجودہ خمس کا سال <bdi>${esc(urDigits(kh.kh.label||""))}</bdi> ہے${kh.kh.next ? ` جو تقریباً ${esc(urDate(kh.kh.next))} کو مکمل ہوگا` : ""}۔ نیچے درج تاریخ تک میرے حساب کے مطابق اس سال کا تخمینی خمس <bdi>${N(kh.est)} روپے</bdi> ہے۔ اگر وفات کے وقت کسی مال کا خمس ادا نہ ہوا ہو تو میرا وصی میرے حساب کی بنیاد پر اسے معلوم کر کے اصل ترکے سے ادا کرے۔</p>`;
  return h;
}
function khumsClauseEn(m){
  const kh = m.kh;
  let h = "";
  if (kh.unpaid.length) h += `<p>Khums for the following years has not yet been paid. It is a debt on me and is to be paid from the whole estate before it is divided:</p><ul>${kh.unpaid.map(y => `<li>${esc(y.year)}: ${esc(fmtC(y.unpaid, y.c))}</li>`).join("")}</ul>`;
  const asc = [...kh.years].reverse(), paidYears = asc.filter(y => (y.khumsDue||0) > 0 && y.unpaid <= 0.5).map(y => y.year), noneYears = asc.filter(y => !(y.khumsDue > 0)).map(y => y.year);
  if (paidYears.length) h += `<p>Khums for ${esc(paidYears.join(", "))} has been paid in full.${noneYears.length ? ` In ${esc(noneYears.join(", "))} my savings stayed below the mukhamas, so no khums was due.` : ""}</p>`;
  h += `<p>My khums year ends on the 23rd of the month of Ramadhan. The current khums year is ${esc(kh.kh.label||"")}${kh.kh.next ? `, ending about ${esc(longDate(kh.kh.next))}` : ""}. As of the date below my records estimate the khums for this year at PKR ${fmt(kh.est)}. Any khums unpaid at my death is to be worked out by my executor from my records and paid from the whole estate.</p>`;
  return h;
}
function wasiyatUr(){
  const m = wasiyatModel(), p = m.p, N = n => nfUr.format(n);
  const li = it => `<li>${esc(it.title_ur||it.title)}${amtUr(it)?`: <bdi>${esc(amtUr(it))}</bdi>`:""}${it.contact?` (رابطہ: <bdi dir="ltr">${esc(it.contact)}</bdi>)`:""}${it.note_ur?`۔ ${esc(it.note_ur)}۔`:""}</li>`;
  let n = 0; const cl = t => `<p><span class="clause">${N(++n)}۔ ${t}</span></p>`;
  let h = `<div class="bism">بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ</div><h3>وصیت نامہ</h3>`;
  h += `<p>میں، ${blank(p.name_ur,"اپنا نام")} ولد ${blank(p.father_ur,"والد کا نام")}، اپنے پورے ہوش و حواس اور اپنی آزاد مرضی سے یہ وصیت کرتا ہوں۔</p>`;
  h += `<p>میں گواہی دیتا ہوں کہ اللہ کے سوا کوئی معبود نہیں، وہ یکتا ہے اور اس کا کوئی شریک نہیں؛ اور حضرت محمد صلی اللہ علیہ وآلہ وسلم اس کے بندے اور رسول اور خاتم النبیین ہیں؛ اور امیر المومنین حضرت علی ابن ابی طالب علیہ السلام اور ان کی اولاد میں سے گیارہ ائمہ معصومین علیہم السلام اللہ کی حجتیں ہیں، جن میں آخری حضرت امام مہدی عجل اللہ تعالیٰ فرجہ الشریف ہیں۔ موت حق ہے، قبر کا سوال حق ہے، قیامت حق ہے، اور جنت و دوزخ حق ہیں۔</p>`;
  h += `<p>میں آیت اللہ العظمیٰ سید علی حسینی سیستانی دام ظلہ العالی کا مقلد ہوں، اور میری یہ وصیت انہی کے فتاویٰ کے مطابق نافذ کی جائے۔ یہ تحریر میری وصیت ہے اور میری وفات کے بعد اس پر عمل کیا جائے۔ اس سے پہلے کی میری ہر وصیت منسوخ ہے۔</p>`;
  h += cl("قضا نمازیں");
  h += m.total ? `<p>آج کی تاریخ تک میرے ذمے کل <bdi>${N(m.total)}</bdi> قضا نمازیں باقی ہیں:</p><ul>${m.prayers.map(x => `<li>${esc(x.ur)}: <bdi>${N(x.n)}</bdi></li>`).join("")}</ul><p>قصر نمازیں قصر ہی کی صورت میں ادا کی جائیں۔ اگر یہ نمازیں میری زندگی میں ادا نہ ہو سکیں تو میرا وصی میرے ترکے کے ایک تہائی حصے سے کسی قابلِ اعتماد مومن کو اجرت دے کر انہیں ادا کروائے، جیسا کہ آگے ترتیب درج ہے۔ یہ تعداد یقینی ہے۔ میرا وصی اس وقت تک مطمئن نہ ہو جب تک یہ نمازیں حقیقتاً ادا نہ ہو جائیں؛ اگر اجیر فوت ہو جائے یا ادا نہ کرے تو کسی اور کو اجیر بنائے۔ اس وصیت سے میرا مقصد یہ ہے کہ یہ نمازیں میرے ترکے سے ادا ہوں اور میرے بڑے بیٹے پر ان کا بوجھ نہ رہے؛ البتہ اگر وہ خود یا اجرت کے ذریعے انہیں ادا کر دے تو یہ بھی کافی ہے۔</p>` : `<p>الحمد للہ، میرے ذمے کوئی قضا نماز باقی نہیں۔</p>`;
  h += cl("قضا روزے");
  h += m.roza ? `<p>میرے ذمے <bdi>${N(m.roza)}</bdi> قضا روزے باقی ہیں۔ ان کی ادائیگی بھی اسی طرح ایک تہائی ترکے سے کروائی جائے۔</p>` : `<p>الحمد للہ، میرے ذمے کوئی قضا روزہ باقی نہیں۔</p>`;
  h += cl("کفارہ، فدیہ اور نذر");
  h += m.third.length ? `<ul>${m.third.map(li).join("")}</ul><p>میں وصیت کرتا ہوں کہ یہ میرے ترکے کے ایک تہائی حصے سے ادا کیے جائیں۔ کفارہ کھانے کی صورت میں ادا کیا جائے: ہر روزے کے بدلے ساٹھ فقیروں میں سے ہر ایک کو ایک مُد (تقریباً ساڑھے سات سو گرام) گندم، آٹا یا اس جیسی غذا۔ کھانے کے بدلے نقد رقم نہ دی جائے؛ میرا وصی خود کھانا خرید کر تقسیم کرے، یا فقیر کو وکیل بنا کر رقم دے کہ وہ کفارے کی طرف سے کھانا خریدے اور پھر خود اس کا مالک بنے۔</p>` : `<p>اس وقت کوئی کفارہ، فدیہ یا نذر باقی نہیں۔</p>`;
  h += cl("ایک تہائی ترکے سے ادائیگی کی ترتیب");
  h += `<p>ایک تہائی کا حساب کفن دفن کے واجب اخراجات، قرضوں اور شرعی حقوق کی ادائیگی کے بعد باقی ترکے پر کیا جائے۔ اس ایک تہائی سے پہلے کفارہ اور نذر ادا کیے جائیں، پھر قضا نمازیں اور قضا روزے اجرت پر ادا کروائے جائیں۔ اگر ایک تہائی کافی نہ ہو تو میں اپنے ورثا سے التماس کرتا ہوں کہ وہ باقی ادائیگی کی اجازت دیں۔</p>`;
  h += cl("ایک تہائی ترکے کا باقی حصہ: امامِ زمانہ عجل اللہ تعالیٰ فرجہ الشریف کے نام");
  h += `<p>شرعی حقوق اور قرضوں کی ادائیگی کے بعد ترکے کے دو تہائی حصے میرے ورثا کا حق ہیں، جو ان کے شرعی حصوں کے مطابق ان میں تقسیم ہوں۔ میرے ترکے کے ایک تہائی حصے میں سے کفارے، نذر اور قضا عبادات کی ادائیگی کے بعد جو کچھ باقی بچے، اس سب کے بارے میں میری وصیت ہے کہ وہ حضرت امامِ زمانہ عجل اللہ تعالیٰ فرجہ الشریف کے نام پر یتیمانِ آلِ محمد علیہم السلام کی تعلیم و تعلّم میں صرف کیا جائے۔ اس مال کو خرچ کرنے کا اختیار میرے وصی ${blank(p.wasi_ur,"وصی کا نام")} کو ہے؛ یتیمانِ آلِ محمد علیہم السلام سے کون مراد ہیں، کس ادارے یا کس طریقے سے یہ تعلیم ہو، اور کتنا کب خرچ ہو، یہ سب ان کی صوابدید پر ہے، وہ چاہیں تو اسے کسی حلال طریقے سے سرمایہ کاری میں لگا کر اس کا منافع اسی مقصد میں صرف کریں، یا اصل مال ہی خرچ کر دیں، اور اس کے خرچ میں تاخیر بھی کر سکتے ہیں؛ یہ مکمل طور پر ان کی صوابدید پر ہے۔ اگر کسی وقت یہ مقصد ممکن نہ رہے تو یہ مال امامِ زمانہ عجل اللہ تعالیٰ فرجہ الشریف کے نام پر اس کے قریب ترین نیک کام میں صرف کیا جائے، جسے میرا وصی طے کرے؛ یہ مال میراث میں واپس نہ جائے۔</p>`;
  h += cl("خمس اور دیگر شرعی حقوق");
  if (m.whole.length) h += `<ul>${m.whole.map(li).join("")}</ul><p>یہ حقوق ترکے کی تقسیم سے پہلے پورے ترکے سے ادا کیے جائیں۔</p>`;
  h += khumsClauseUr(m);
  h += cl("حجۃ الاسلام");
  h += `<p>اب تک مجھ پر حجۃ الاسلام واجب نہیں ہوا۔ اگر میری زندگی میں یہ واجب ہو جائے اور میں اسے ادا کیے بغیر فوت ہو جاؤں تو یہ میرے پورے ترکے سے، تاخیر کے بغیر، ادا کروایا جائے۔ اگر ترکہ سب کے لیے کافی نہ ہو تو پہلے لوگوں کے قرض، پھر حج، پھر ذمے میں باقی خمس ادا کیا جائے۔</p>`;
  h += cl("وہ قرض جو میرے ذمے ہیں");
  h += m.owe.length ? `<ul>${m.owe.map(li).join("")}</ul><p>یہ قرض ترکے کی تقسیم سے پہلے اصل ترکے سے ادا کیے جائیں۔</p>` : `<p>اس وقت میرے ذمے کسی کا کوئی قرض نہیں۔</p>`;
  if (m.amanat.length) h += cl("امانتیں") + `<ul>${m.amanat.map(li).join("")}</ul><p>یہ امانتیں ان کے مالکان کو لوٹا دی جائیں؛ یہ میرے ترکے کا حصہ نہیں۔</p>`;
  h += cl("وہ قرض جو دوسروں کے ذمے میرے ہیں");
  h += m.due.length ? `<ul>${m.due.map(li).join("")}</ul><p>میرا وصی یہ رقوم وصول کر کے ترکے میں شامل کرے۔</p>` : `<p>اس وقت کسی کے ذمے میرا کوئی قرض نہیں۔</p>`;
  if (m.other.length) h += cl("دیگر") + `<ul>${m.other.map(li).join("")}</ul>`;
  if (p.hidden_ur) h += cl("وہ مال جو دوسروں کے پاس ہے یا ورثا کے علم میں نہیں") + `<p>${esc(p.hidden_ur).replace(/\n/g,"<br>")}</p>`;
  h += cl("وصی");
  h += `<p>میں ${blank(p.wasi_ur,"وصی کا نام")} ${p.wasi_contact?`(رابطہ: <bdi dir="ltr">${esc(p.wasi_contact)}</bdi>) `:""}کو اپنا وصی مقرر کرتا ہوں۔${p.wasi2_ur?` اگر ان کا انتقال ہو جائے یا وہ وصایت انجام نہ دے سکیں تو ${esc(p.wasi2_ur)} میرے وصی ہوں گے۔`:""}${p.nazir_ur?` ${esc(p.nazir_ur)} وصی کے کام پر ناظر اور نگران ہوں گے، اور وصی ہر کام ان کے علم میں لا کر انجام دے گا۔`:""}</p><p>وصی کی ذمہ داریاں یہ ہیں: میری تجہیز و تکفین، میرے قرض ادا کرنا اور مجھے واجب الادا رقوم وصول کرنا، امانتیں ان کے مالکان کو لوٹانا، شرعی حقوق ادا کرنا، ایک تہائی ترکے کو اس وصیت کے مطابق صرف کرنا، اور اس وصیت کی ہر شق پر عمل کرنا۔ وصی یہ کام بغیر اجرت کے انجام دیں گے اور ہر ادائیگی کی رسید محفوظ رکھیں گے۔ وہ کاموں کے لیے قابلِ اعتماد وکیل مقرر کر سکتے ہیں، مگر وصایت کسی اور کو منتقل نہیں کر سکتے۔</p>`;
  if (p.qayyim_ur) h += cl("نابالغ اولاد کی سرپرستی") + `<p>میں ${esc(p.qayyim_ur)} کو اپنی نابالغ اولاد اور ان کے مال کا سرپرست (قیّم) مقرر کرتا ہوں۔</p>`;
  if (p.extra_ur) h += cl("دیگر ہدایات") + `<p>${esc(p.extra_ur).replace(/\n/g,"<br>")}</p>`;
  h += `<p>میں اپنے ورثا اور مومنین سے دعا کی التماس کرتا ہوں۔</p>`;
  h += `<div class="sig"><div>دستخط وصیت کنندہ اور تاریخ</div><div>گواہ اول (عادل مسلمان مرد): نام، دستخط</div><div>گواہ دوم (عادل مسلمان مرد): نام، دستخط</div></div>`;
  h += `<div class="stamp">Records as of ${esc(longDate(iso(new Date(m.asOf))))}${p.city?" · "+esc(p.city):""}</div>`;
  return h;
}
function wasiyatEn(){
  const m = wasiyatModel(), p = m.p, N = n => nfEn.format(n);
  const li = it => `<li>${esc(it.title)}${amtEn(it)?`: ${esc(amtEn(it))}`:""}${it.contact?` (contact: ${esc(it.contact)})`:""}${it.note?`. ${esc(it.note)}`:""}</li>`;
  let n = 0; const cl = t => `<p><span class="clause">${++n}. ${t}</span></p>`;
  let h = `<div class="bism">بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ</div><h3>Last Will (Wasiyat Nama)</h3>`;
  h += `<p>I, ${blank(p.name_en,"your name")}, son of ${blank(p.father_en,"father's name")}, being of sound mind and acting of my own free will, make this will.</p>`;
  h += `<p>I bear witness that there is no god but Allah, One, without partner; that Muhammad, peace and blessings of Allah be upon him and his progeny, is His servant, His Messenger and the Seal of the Prophets; and that Amir al-Mu'minin Ali ibn Abi Talib, peace be upon him, and the eleven infallible Imams from his descendants, peace be upon them, are the proofs of Allah, the last of them being Imam al-Mahdi, may Allah hasten his reappearance. Death is true, the questioning in the grave is true, the Resurrection is true, and Paradise and Hell are true.</p>`;
  h += `<p>I follow Ayatullah al-Uzma Sayyid Ali al-Husaini al-Sistani, may his shadow endure, and this will is to be carried out according to his rulings. This written document is my will and is to be acted upon after my death. It revokes every earlier will of mine.</p>`;
  h += cl("Qaza prayers");
  h += m.total ? `<p>As of the date below, ${N(m.total)} qaza prayers remain owed by me:</p><ul>${m.prayers.map(x => `<li>${esc(x.en)}: ${N(x.n)}</li>`).join("")}</ul><p>Prayers missed while travelling are to be made up in their shortened (qasr) form. If they are not completed in my lifetime, my executor is to hire a trustworthy believer to perform them, paying from one third of my estate in the order set out below. These counts are certain. My executor is not to consider them done until they are actually performed; if a hired person dies or fails to perform them, he is to hire another. By this will I intend these prayers to be paid for from my estate so that the burden does not fall on my eldest son; if he nonetheless performs them himself or through a hired person, that also suffices.</p>` : `<p>Praise be to Allah, I owe no qaza prayers.</p>`;
  h += cl("Qaza fasts");
  h += m.roza ? `<p>${N(m.roza)} qaza fasts remain owed by me; they are to be arranged in the same way from one third of my estate.</p>` : `<p>Praise be to Allah, I owe no qaza fasts.</p>`;
  h += cl("Kaffara, fidya and nazr");
  h += m.third.length ? `<ul>${m.third.map(li).join("")}</ul><p>I direct that these be paid from one third of my estate. Kaffara is to be given as food: for each fast, one mudd (about 750 grams) of wheat, flour or similar food to each of sixty poor people. Cash is not to be given in place of food: my executor is to buy and distribute the food himself, or give the money to a poor person as an agent to buy the food on behalf of the kaffara and then take ownership of it.</p>` : `<p>No kaffara, fidya or nazr is outstanding.</p>`;
  h += cl("Order of payment from the one third");
  h += `<p>The one third is to be reckoned on what remains after the obligatory burial costs, debts and religious dues are paid. From that one third, my kaffara and nazr are to be paid first, then my qaza prayers and fasts are to be performed by hired persons. If one third is not enough, I ask my heirs to permit the rest to be paid.</p>`;
  h += cl("The rest of the one third: in the name of Imam-e-Zamana, may Allah hasten his reappearance");
  h += `<p>After religious dues and debts are paid, two thirds of my estate belong to my heirs, to be divided according to their shares in the shariah. From the one third of my estate, whatever remains after my kaffara, nazr and qaza worship are paid for, I bequeath in its entirety in the name of Imam-e-Zamana, may Allah hasten his reappearance, to be spent wholly on the education (taleem o taallum) of the orphans of Aal-e-Muhammad, peace be upon them. My executor, ${blank(p.wasi_en,"executor's name")}, has full discretion over this: who the orphans of Aal-e-Muhammad are, through which institution or means they are taught, and how much is spent and when. He may invest it in a halal way and spend the profit on this purpose, or spend the capital itself, and he may delay spending; this is entirely at his discretion. If this purpose ever becomes impossible, the property is to be spent, in the name of Imam-e-Zamana, may Allah hasten his reappearance, on the good work nearest to it, as my executor decides; it is not to return to the inheritance.</p>`;
  h += cl("Khums and other religious dues");
  if (m.whole.length) h += `<ul>${m.whole.map(li).join("")}</ul><p>These are to be paid from the whole estate before it is divided among the heirs.</p>`;
  h += khumsClauseEn(m);
  h += cl("Hajj al-Islam");
  h += `<p>Hajj al-Islam has not yet become obligatory on me. If it becomes obligatory in my lifetime and I die without performing it, it is to be performed on my behalf from my whole estate without delay. If the estate does not cover everything, people's debts come first, then the hajj, then any khums owed.</p>`;
  h += cl("Debts I owe");
  h += m.owe.length ? `<ul>${m.owe.map(li).join("")}</ul><p>These are to be repaid from the whole estate before it is divided.</p>` : `<p>I owe no debts at present.</p>`;
  if (m.amanat.length) h += cl("Trusts (amanat) I hold") + `<ul>${m.amanat.map(li).join("")}</ul><p>These are to be returned to their owners; they are not part of my estate.</p>`;
  h += cl("Debts owed to me");
  h += m.due.length ? `<ul>${m.due.map(li).join("")}</ul><p>My executor is to collect these and add them to the estate.</p>` : `<p>Nobody owes me anything at present.</p>`;
  if (m.other.length) h += cl("Other") + `<ul>${m.other.map(li).join("")}</ul>`;
  if (p.hidden_en) h += cl("Property held by others or unknown to my heirs") + `<p>${esc(p.hidden_en).replace(/\n/g,"<br>")}</p>`;
  h += cl("Executor");
  h += `<p>I appoint ${blank(p.wasi_en,"executor's name")}${p.wasi_contact?` (contact: ${esc(p.wasi_contact)})`:""} as my executor (wasi).${p.wasi2_en?` If he dies or cannot act, ${esc(p.wasi2_en)} is to be my executor.`:""}${p.nazir_en?` ${esc(p.nazir_en)} is to supervise the executor (nazir), and the executor is to act with his knowledge.`:""}</p><p>The executor's duties are: my burial and shrouding; paying my debts and collecting what is owed to me; returning trusts to their owners; paying religious dues; spending the one third as this will directs; and carrying out every clause of this will. He is to act without a fee and keep a receipt for every payment. He may appoint trustworthy agents for tasks, but may not hand the executorship itself to anyone else.</p>`;
  if (p.qayyim_en) h += cl("Guardian of minor children") + `<p>I appoint ${esc(p.qayyim_en)} as guardian (qayyim) of my minor children and their property.</p>`;
  if (p.extra_en) h += cl("Further instructions") + `<p>${esc(p.extra_en).replace(/\n/g,"<br>")}</p>`;
  h += `<p>I ask my heirs and the believers to remember me in their prayers.</p>`;
  h += `<div class="sig"><div>Signature of testator and date</div><div>First witness (a just Muslim man): name, signature</div><div>Second witness (a just Muslim man): name, signature</div></div>`;
  h += `<div class="stamp">Records as of ${esc(longDate(iso(new Date(m.asOf))))}${p.city?" · "+esc(p.city):""}</div>`;
  return h;
}
function renderWasiyat(){
  $("leafUr").innerHTML = wasiyatUr(); $("leafEn").innerHTML = wasiyatEn();
  const ch = wasiyatChecks(), sig = ch[ch.length - 1], miss = ch.filter(x => !x.ok).length, b = $("signedBanner");
  b.className = "banner" + (miss ? "" : " ok");
  b.innerHTML = (sig.ok ? "Last signed copy: " + esc(sig.s.replace(/^Signed /, "")) + ". " : "No signed copy recorded yet. Print it and sign with two just Muslim men as witnesses. ") +
    (miss ? miss + " item" + (miss === 1 ? "" : "s") + " still to complete. <a href=\"#planner\">See the checkup</a>." : "Everything is complete.");
}
function leafText(el){
  const c = el.cloneNode(true);
  c.querySelectorAll("bdi[dir=ltr]").forEach(b => b.textContent = "⁦" + b.textContent + "⁩");
  c.querySelectorAll("li").forEach(l => l.textContent = "• " + l.textContent);
  c.querySelectorAll("p,li,h3,div").forEach(e => e.append("\n"));
  return c.textContent.replace(/\n{3,}/g, "\n\n").trim();
}

/* ================= events ================= */
// tabs
const VIEWS = ["today","planner","money","khums","wajibat","wasiyat","settings"];
function route(){
  let v = location.hash.slice(1); if (!VIEWS.includes(v)) v = conn.token ? "today" : "settings";
  VIEWS.forEach(x => $("v-" + x).hidden = x !== v);
  document.querySelectorAll("#tabs a").forEach(a => a.setAttribute("aria-current", a.getAttribute("href") === "#" + v ? "page" : "false"));
  document.querySelectorAll("[data-bn]").forEach(a => a.classList.toggle("on", a.dataset.bn === v));
  if (v === "settings") fillSettings();
}
window.addEventListener("hashchange", () => { route(); window.scrollTo(0, 0); });

// log spending
$("mealChips").addEventListener("click", e => {
  const b = e.target.closest(".chip"); if (!b) return;
  meal = b.dataset.meal;
  document.querySelectorAll("#mealChips .chip").forEach(x => x.setAttribute("aria-pressed", x === b ? "true" : "false"));
  if (meal){ $("fCat").value = "Food"; if ($("fSrc").value === "Cash") $("fSrc").value = "Foodpanda"; }
  renderCapHint(); $("fAmount").focus();
});
["fAmount","fCur"].forEach(id => $(id).addEventListener("input", renderCapHint));
$("fDel").addEventListener("change", () => { if (+$("fDel").value) $("fSrc").value = "Direct order"; renderCapHint(); });
$("fCat").addEventListener("change", () => { if ($("fCat").value !== "Food" && meal){ meal = ""; document.querySelectorAll("#mealChips .chip").forEach(x => x.setAttribute("aria-pressed", x.dataset.meal === "" ? "true" : "false")); renderCapHint(); } });
$("addForm").addEventListener("submit", e => {
  e.preventDefault(); if (!D) { toast("Not connected yet."); return; }
  const amount = +$("fAmount").value, currency = $("fCur").value;
  if (!(amount > 0)) return;
  if (!rate(currency)){ toast("Set a rate for " + currency + " in Settings first."); return; }
  const delOpt = $("fDel").selectedOptions[0], del = +$("fDel").value || 0, vendor = delOpt?.dataset.v || "";
  const doc = {id: uid("t"), date: $("fDate").value || todayIso(), amount: currency === "PKR" ? amount + del : amount, currency,
    pkr: Math.round((toPkr(amount, currency) + del)*100)/100, deliveryFee: del, category: $("fCat").value,
    meal: $("fCat").value === "Food" ? (meal || "other") : "", source: $("fSrc").value,
    note: [$("fPlace").value.trim() || vendor, $("fNote").value.trim(), del ? "incl. delivery " + del : ""].filter(Boolean).join(": ").slice(0, 140), createdAt: new Date().toISOString()};
  change(d => { d.finance.txns.unshift(doc); }, "Log PKR " + fmt(doc.pkr) + " " + doc.category);
  toast("Added PKR " + fmt(doc.pkr)); closeSheet();
  $("fAmount").value = ""; $("fNote").value = ""; $("fPlace").value = ""; $("fDel").value = "0"; $("placeHint").innerHTML = ""; renderCapHint();
});
/* places and dishes learned from past entries ("Place: 1x Dish, 2x Dish") */
function menuBook(){
  const book = {};
  F().txns.forEach(t => {
    if (t.category !== "Food" || !t.note) return;
    const i = t.note.indexOf(":"); if (i < 0) return;
    const place = t.note.slice(0, i).replace(/\s*\(WhatsApp\)\s*$/i, "").replace(/\s*\(usual\)\s*$/i, "").trim();
    if (!place || place.length > 50) return;
    let rest = t.note.slice(i + 1).split(/\. (Food|total|paid|late|inDrive|website|guests|lunch)/)[0];
    const e = book[place] = book[place] || {n: 0, xs: [], items: {}}; e.n++; e.xs.push(t.pkr);
    rest.split(/,\s*/).map(x => x.replace(/^\s*\d+x\s*/i, "").replace(/\s+/g, " ").trim()).filter(x => x && x.length < 60 && !/^incl\./.test(x))
      .forEach(x => e.items[x] = (e.items[x] || 0) + 1);
  });
  return book;
}
function fillPlaces(){
  const book = menuBook();
  $("placeList").innerHTML = Object.entries(book).sort((a,b) => b[1].n - a[1].n).map(([k,v]) => `<option value="${esc(k)}">${v.n} orders</option>`).join("");
  return book;
}
function onPlace(){
  const book = menuBook(), e = book[$("fPlace").value.trim()], h = $("placeHint");
  if (!e) { $("dishList").innerHTML = ""; h.innerHTML = ""; return; }
  const items = Object.entries(e.items).sort((a,b) => b[1] - a[1]);
  $("dishList").innerHTML = items.map(([k]) => `<option value="${esc(k)}"></option>`).join("");
  const xs = [...e.xs].sort((a,b) => a-b), med = Math.round(xs[Math.floor(xs.length/2)]);
  h.innerHTML = `<span class="muted sm">Usually PKR ${fmt(med)} here.</span> <button type="button" class="btn small ghost" data-fill-amt="${med}">Use PKR ${fmt(med)}</button>` +
    items.slice(0, 6).map(([k]) => ` <button type="button" class="chip dish" data-dish="${esc(k)}">${esc(k)}</button>`).join("");
  if (!meal && $("fCat").value !== "Food") { $("fCat").value = "Food"; }
}
$("fPlace").addEventListener("input", onPlace); $("fPlace").addEventListener("change", onPlace);
$("placeHint").addEventListener("click", e => {
  const a = e.target.closest("[data-fill-amt]"); if (a) { $("fAmount").value = a.dataset.fillAmt; renderCapHint(); return; }
  const d = e.target.closest("[data-dish]"); if (d) { const cur = $("fNote").value.trim(); $("fNote").value = cur ? cur + ", " + d.dataset.dish : d.dataset.dish; }
});

/* add-spending sheet */
function openSheet(){ if (!D) { toast("Not connected yet. Open Settings to connect."); return; } fillPlaces(); $("sheet").hidden = false; $("fDate").value = todayIso(); setTimeout(() => $("fAmount").focus(), 50); }
function closeSheet(){ $("sheet").hidden = true; }
$("sheetClose").onclick = closeSheet;
$("sheet").addEventListener("click", e => { if (e.target === $("sheet")) closeSheet(); });
document.addEventListener("keydown", e => { if (e.key === "Escape" && !$("sheet").hidden) closeSheet(); });
["qPace","plExtra","plPer","plQ"].forEach(id => $(id).addEventListener("input", () => { if (D) { renderToday(); renderPlanner(); } }));
$("afford").addEventListener("input", renderAfford);
$("plSavePer").onclick = () => { const v = +$("plPer").value; change(d => { d.finance.config.wajibatPerCycle = v; }, "Wajibat set-aside"); toast("PKR " + fmt(v) + " a pay is now in your budget plan"); };
$("usualUndo").onclick = () => { if (!lastUsual) return; const id = lastUsual; lastUsual = null; change(d => { d.finance.txns = d.finance.txns.filter(t => t.id !== id); }, "Undo usual"); $("usualToast").hidden = true; };
document.addEventListener("click", e => {
  const del = e.target.closest("[data-del]");
  if (del){
    if (del.dataset.armed !== "1"){ del.dataset.armed = "1"; del.textContent = "Delete?"; setTimeout(() => { del.dataset.armed = ""; del.textContent = "✕"; }, 3000); return; }
    const id = del.dataset.del; change(d => { d.finance.txns = d.finance.txns.filter(t => t.id !== id); }, "Delete entry"); return;
  }
  const pb = e.target.closest("[data-pay-bill]");
  if (pb){
    const b = F().bills.find(x => x.id === pb.dataset.payBill); if (!b) return;
    const dt = todayIso(), t = {id: uid("t"), date: dt, amount: b.amount, currency: b.currency, pkr: Math.round(toPkr(b.amount,b.currency)), category: "Bills & subs", meal: "", source: "Card", note: b.name, createdAt: new Date().toISOString()};
    change(d => { d.finance.txns.unshift(t); const x = d.finance.bills.find(y => y.id === b.id); if (x) x.lastPaid = dt; }, "Bill paid: " + b.name); return;
  }
  const st = e.target.closest("[data-settle]");
  if (st){ const id = st.dataset.settle; change(d => { const x = d.debts.find(y => y.id === id); if (x) x.status = "cleared"; }, "Debt settled"); return; }
  const qb = e.target.closest("button[data-k]");
  if (qb){ bump({[qb.dataset.k]: +qb.dataset.d}); return; }
  if (e.target.closest("[data-fullday]")){ bump(Object.fromEntries(DAY.map(k => [k,-1]))); return; }
  if (e.target.closest("[data-open-add]")) { openSheet(); return; }
  const us = e.target.closest("[data-usual]");
  if (us){ const u = USUALS[+us.dataset.usual]; if (!u) return;
    const t = {id: uid("t"), date: todayIso(), amount: u.amount, currency: "PKR", pkr: u.amount, category: "Food", meal: u.meal === "other" ? "other" : u.meal, source: u.src, note: u.vendor + " (usual)", createdAt: new Date().toISOString()};
    change(d => { d.finance.txns.unshift(t); }, "Usual: " + u.vendor); lastUsual = t.id;
    $("usualToastText").textContent = "Logged " + u.vendor + ", PKR " + fmt(u.amount); $("usualToast").hidden = false; clearTimeout(renderAfford._u); renderAfford._u = setTimeout(() => $("usualToast").hidden = true, 8000); return; }
  const tq = e.target.closest("[data-today-q]");
  if (tq){ bump({[tq.dataset.todayQ]: -1}); return; }
  const tu = e.target.closest("[data-today-undo]");
  if (tu){ const k = tu.dataset.todayUndo; if (prayedToday(k) > 0) bump({[k]: 1}); return; }
  const rb = e.target.closest("[data-remind-bill]");
  if (rb){ const id = rb.dataset.remindBill, dt = todayIso(); change(d => { const x = d.finance.bills.find(y => y.id === id); if (x) x.remindedAt = dt; }, "Reminded mentor"); toast("Marked: reminder sent to your mentor"); return; }
  if (e.target.closest("[data-signed]")) { const dt = todayIso(); const key = willKey(); change(d => { d.wajibat.profile = {...d.wajibat.profile, signedAt: dt, signedKey: key}; }, "Wasiyat signed"); toast("Recorded: wasiyat signed today"); return; }
  const ed = e.target.closest("[data-edit]"); if (ed){ itemForm(D.wajibat.items.find(i => i.id === ed.dataset.edit)); return; }
  const clr = e.target.closest("[data-clear]");
  if (clr){ const id = clr.dataset.clear; change(d => { const x = d.wajibat.items.find(y => y.id === id); if (x){ x.status = "cleared"; x.updatedAt = new Date().toISOString(); } }, "Obligation cleared"); }
});
document.addEventListener("submit", e => {
  const f = e.target.closest("[data-debt]");
  if (f){ e.preventDefault(); const id = f.dataset.debt, amt = +f.querySelector("input").value, cur = f.querySelector("select").value;
    if (!(amt > 0)) return; const p = {date: todayIso(), amount: amt, currency: cur};
    change(d => { const x = d.debts.find(y => y.id === id); if (x){ x.payments = [...(x.payments||[]), p]; if (!debtStatus(x).open) x.status = "cleared"; } }, "Debt repayment"); return; }
  const pi = e.target.closest("[data-payitem]");
  if (pi){ e.preventDefault(); const id = pi.dataset.payitem, amt = +pi.querySelector("input").value, cur = pi.querySelector("select").value;
    if (!(amt > 0) || !rate(cur)) return;
    const it = D.wajibat.items.find(i => i.id === id); if (!it) return;
    const dt = todayIso(), t = {id: uid("t"), date: dt, amount: amt, currency: cur, pkr: Math.round(toPkr(amt, cur)), category: "Wajibat", meal: "", source: "Cash", note: it.title, itemId: id, createdAt: new Date().toISOString()};
    change(d => { d.finance.txns.unshift(t); const x = d.wajibat.items.find(y => y.id === id); if (x){ x.payments = [...(x.payments||[]), {date: dt, amount: amt, currency: cur, txnId: t.id}]; if (itemStatus(x).left === 0) x.status = "cleared"; x.updatedAt = new Date().toISOString(); } }, "Paid: " + it.title);
  }
});

// qaza
function bump(ch){
  if (!D) return;
  const c = D.wajibat.qaza.counts, real = {};
  for (const [k, d] of Object.entries(ch)){
    const cur = k === "roza" ? (+D.wajibat.qaza.roza||0) : (+c[k]||0), nv = Math.max(0, cur + d);
    if (nv !== cur) real[k] = nv - cur;
  }
  if (!Object.keys(real).length) return;
  for (const [k, d] of Object.entries(real)) qPending[k] = (qPending[k]||0) + d;
  change(dd => { for (const [k, d] of Object.entries(real)){ if (k === "roza") dd.wajibat.qaza.roza = Math.max(0, (+dd.wajibat.qaza.roza||0) + d); else dd.wajibat.qaza.counts[k] = Math.max(0, (+dd.wajibat.qaza.counts[k]||0) + d); } dd.wajibat.qaza.updatedAt = new Date().toISOString(); }, "Qaza count");
  clearTimeout(qT); qT = setTimeout(() => { const changes = qPending; qPending = {}; const at = new Date().toISOString();
    change(dd => { dd.wajibat.log = [{at, changes}, ...(dd.wajibat.log||[])].slice(0, 200); }, "Qaza log"); }, 500);
}
$("rozaMinus").onclick = () => bump({roza:-1}); $("rozaPlus").onclick = () => bump({roza:1});
$("addItem").onclick = () => { if (D) itemForm(null); };
$("profileForm").addEventListener("input", () => $("profileForm").dataset.dirty = "1");
$("profileForm").onsubmit = e => { e.preventDefault(); const data = {...Object.fromEntries(new FormData(e.target)), updatedAt: new Date().toISOString()};
  delete e.target.dataset.dirty; change(d => { d.wajibat.profile = {...d.wajibat.profile, ...data}; }, "Wasiyat details"); toast("Saved"); };

// debts form
$("debtForm").innerHTML = `<label>Person (English)<input name="person" required></label><label>Person (Urdu)<input name="person_ur" class="ur" dir="rtl" lang="ur"></label>
  <label>Direction<select name="direction"><option value="i_owe">I owe them</option><option value="owed_to_me">They owe me</option></select></label>
  <label>Amount<input name="amount" type="number" step="any" min="0" required></label><label>Currency<select name="currency">${curOptions("PKR")}</select></label>
  <label>Contact<input name="contact" dir="ltr"></label><label class="full">Note<input name="note"></label><label class="full">Note (Urdu)<input name="note_ur" class="ur" dir="rtl" lang="ur"></label>
  <label class="full" style="display:flex;gap:8px;align-items:center"><input type="checkbox" name="khumsPaid" style="width:auto"> Khums already paid on this money</label>
  <div class="full"><button class="btn" type="submit">Add</button></div>`;
$("debtForm").onsubmit = e => { e.preventDefault(); const fd = Object.fromEntries(new FormData(e.target));
  const d0 = {id: uid("debt"), person: fd.person, person_ur: fd.person_ur, direction: fd.direction, amount: +fd.amount, currency: fd.currency, payments: [], contact: fd.contact, note: fd.note, note_ur: fd.note_ur, khumsPaid: !!fd.khumsPaid, status: "open"};
  change(d => { d.debts.push(d0); }, "Add debt"); e.target.reset(); };

// khums
$("khPayForm").addEventListener("submit", e => { e.preventDefault();
  const id = $("kYear").value, amt = +$("kAmt").value; if (!id || !(amt > 0)) return;
  const p = {date: $("kDate").value || todayIso(), amount: amt, currency: $("kCur").value, share: $("kShare").value, to: $("kTo").value.trim()};
  change(d => { const y = d.khums.years.find(x => x.id === id); if (y) y.payments = [...(y.payments||[]), p]; }, "Khums payment " + id);
  $("kAmt").value = ""; $("kTo").value = ""; toast("Khums payment saved"); });
$("khCloseForm").addEventListener("submit", e => { e.preventDefault();
  const year = $("kcYear").value.trim(); if (!year) return;
  const n = id => $(id).value === "" ? null : +$(id).value, kh = D.khums.settings || {};
  const y = {id: year, year, date: $("kcDate").value, currency: $("kcCur").value, savings: n("kcSav"), khumsDue: n("kcDue") ?? 0, mukhamasOut: n("kcOut"),
    mukhamasIn: kh.carryPkr ?? null, gregorian: kh.gregorian || "", period: "", payments: []};
  const nextLabel = $("kcNextLabel").value.trim(), next = $("kcNext").value;
  change(d => { d.khums.years = d.khums.years.filter(x => x.id !== year).concat([y]);
    d.khums.settings = {...d.khums.settings, label: nextLabel || d.khums.settings.label, next: next || d.khums.settings.next, carryPkr: y.currency === "PKR" && y.mukhamasOut != null ? y.mukhamasOut : d.khums.settings.carryPkr, gregorian: ""}; }, "Close khums year " + year);
  toast("Year " + year + " closed"); e.target.reset(); });

// wasiyat buttons
async function copy(el){ const t = leafText(el); try { await navigator.clipboard.writeText(t); toast("Copied"); } catch(e){ const r = document.createRange(); r.selectNodeContents(el); const s = getSelection(); s.removeAllRanges(); s.addRange(r); toast("Selected. Use copy on your device."); } }
$("copyUr").onclick = () => copy($("leafUr")); $("copyEn").onclick = () => copy($("leafEn"));
$("printW").onclick = () => window.print();
$("sendW").onclick = async () => {
  if (!D) return;
  const p = D.wajibat.profile || {}, to = [p.wasi_email, p.wasi2_email].filter(Boolean);
  const subject = "Wasiyat of " + (p.name_en || "me") + ", updated " + longDate(todayIso());
  const text = "Assalamu alaikum,\n\nPlease keep this copy of my wasiyat. It is the latest version, as of " + longDate(todayIso()) + ".\n\n" + leafText($("leafUr")) + "\n\n----------\n\n" + leafText($("leafEn"));
  if (!to.length && !navigator.share) { toast("Add the executors' email addresses under Wajibat, Wasiyat details"); location.hash = "#wajibat"; return; }
  if (navigator.share && matchMedia("(max-width:760px)").matches) { try { await navigator.share({title: subject, text}); return; } catch(e) { if (e && e.name === "AbortError") return; } }
  if (!to.length) { toast("Add the executors' email addresses under Wajibat, Wasiyat details"); location.hash = "#wajibat"; return; }
  location.href = "mailto:" + to.map(encodeURIComponent).join(",") + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(text);
};
$("dlWasiyat").onclick = () => {
  const css = [...document.styleSheets].map(s => { try { return [...s.cssRules].map(r => r.cssText).join("\n"); } catch(e) { return ""; } }).join("\n");
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Wasiyat ${todayIso()}</title><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;600&family=Amiri:wght@400;700&family=Source+Serif+4:opsz,wght@8..60,500;8..60,650&display=swap"><style>${css}
body{background:#fff;color:#111}.leaf{border:none;page-break-after:always}.wasiyat{display:block}</style></head><body><div class="wrap"><div class="wasiyat"><article class="leaf ur-leaf" lang="ur" dir="rtl">${$("leafUr").innerHTML}</article><article class="leaf en-leaf" lang="en">${$("leafEn").innerHTML}</article></div></div></body></html>`;
  const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([html], {type: "text/html"})); a.download = "wasiyat-" + todayIso() + ".html"; document.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
};
$("rules").innerHTML = `<ul>${RULES.map(r => `<li><b>${esc(r.topic)}</b>: ${esc(r.summary)} <span class="muted">(${esc(r.ref)})</span> <a href="${esc(r.url)}" target="_blank" rel="noopener">source</a></li>`).join("")}</ul>`;

// settings
function fillSettings(){
  $("cOwner").value = conn.owner; $("cRepo").value = conn.repo; $("cPath").value = conn.path; $("cBranch").value = conn.branch; $("cToken").value = conn.token ? "••••••••" : "";
  if (!D) return;
  const cfg = C(), kh = D.khums.settings || {};
  $("rateRow").innerHTML = CURRENCIES.filter(([c]) => c !== "PKR").map(([c,n]) => '<label>'+n+' ('+c+')<input class="num" id="rate-'+c+'" type="number" step="any" min="0" value="'+(cfg.rates?.[c]??"")+'"></label>').join("");
  const set = (id, v) => $(id).value = v ?? "";
  set("cNashta", cfg.caps?.nashta); set("cDinner", cfg.caps?.dinner); set("cSnack", cfg.caps?.snack);
  set("cNashtaN", cfg.mealsPerCycle?.nashta); set("cDinnerN", cfg.mealsPerCycle?.dinner); set("cSnackN", cfg.mealsPerCycle?.snack);
  set("cOtherFood", cfg.otherFood); set("cPay", cfg.payAmount); set("cSave", cfg.savePerCycle); set("cWaj", cfg.wajibatPerCycle);
  set("cOpen", cfg.cycle.opening); set("cStart", cfg.cycle.start); set("cNext", cfg.cycle.nextPay);
  set("pAmount", cfg.payAmount); set("pDate", todayIso());
  set("kLabel", kh.label); set("kGreg", kh.gregorian); set("kNext", kh.next); set("kCarry", kh.carryPkr);
  payPreview();
}
function payPreview(){ if (!D) return; const k = compute(), amt = +$("pAmount").value || 0, dt = $("pDate").value || todayIso();
  $("payPreview").textContent = "New cycle opens with PKR " + fmt(Math.max(0,k.left) + amt) + " (PKR " + fmt(Math.max(0,k.left)) + " carried over + PKR " + fmt(amt) + "). Next pay expected " + nice(addDays(dt, C().cycleDays || 28)) + "."; }
["pAmount","pDate"].forEach(id => $(id).addEventListener("input", payPreview));
$("payForm").onsubmit = e => { e.preventDefault(); const k = compute(), amt = +$("pAmount").value || 0, dt = $("pDate").value || todayIso();
  const cyc = {start: dt, nextPay: addDays(dt, C().cycleDays || 28), opening: Math.round(Math.max(0, k.left) + amt)};
  change(d => { d.finance.config.cycle = cyc; d.finance.config.lastPaid = {date: dt, amount: amt}; }, "New pay cycle"); $("payDetails").open = false; toast("New cycle started"); };
$("rateForm").onsubmit = e => { e.preventDefault(); const rates = {}; CURRENCIES.forEach(([c]) => { if (c === "PKR") return; const v = +($("rate-"+c)?.value); if (v > 0) rates[c] = v; });
  change(d => { d.finance.config.rates = rates; d.finance.config.ratesUpdated = todayIso(); }, "Exchange rates"); toast("Rates saved"); };
$("capForm").onsubmit = e => { e.preventDefault(); const n = id => +$(id).value || 0;
  const v = {caps: {nashta: n("cNashta"), dinner: n("cDinner"), snack: n("cSnack")}, mealsPerCycle: {nashta: n("cNashtaN"), dinner: n("cDinnerN"), snack: n("cSnackN")},
    otherFood: n("cOtherFood"), payAmount: n("cPay"), savePerCycle: n("cSave"), wajibatPerCycle: n("cWaj"), cycle: {opening: n("cOpen"), start: $("cStart").value, nextPay: $("cNext").value}};
  change(d => { Object.assign(d.finance.config, v); }, "Budget settings"); toast("Settings saved"); };
$("khSetForm").onsubmit = e => { e.preventDefault(); const v = $("kCarry").value;
  const s = {label: $("kLabel").value.trim(), gregorian: $("kGreg").value.trim(), next: $("kNext").value, carryPkr: v === "" ? null : +v};
  change(d => { d.khums.settings = {...d.khums.settings, ...s}; }, "Khums settings"); toast("Khums settings saved"); };
$("connForm").onsubmit = async e => { e.preventDefault();
  conn.owner = $("cOwner").value.trim(); conn.repo = $("cRepo").value.trim(); conn.path = $("cPath").value.trim() || "data/life.json"; conn.branch = $("cBranch").value.trim();
  const tk = $("cToken").value.trim(); if (tk && !tk.startsWith("•")) conn.token = tk;
  saveConn(); base = null; D = null; etag = null; $("connMsg").textContent = "Connecting…";
  await pull(false); $("connMsg").textContent = base ? "Connected." : (syncErr || "Could not load.");
  if (base){ fillSettings(); location.hash = "#today"; } };
$("forget").onclick = () => { conn.token = ""; saveConn(); base = D = null; pending = []; setSync(); fillSettings(); $("connMsg").textContent = "Token removed from this device."; };

/* ================= boot ================= */
$("fCur").innerHTML = curOptions("PKR"); $("kCur").innerHTML = curOptions("PKR"); $("kcCur").innerHTML = curOptions("PKR");
$("fCat").innerHTML = CATS.map(c => '<option>'+c+'</option>').join(""); $("fCat").value = "Other";
$("fDate").value = todayIso(); $("kDate").value = todayIso();
route(); setSync(); pull(false);
})();
