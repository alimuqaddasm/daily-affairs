/* Daily Affairs, new look. Design: "Daily Affairs, unslopped" (E rich, white paper), made with unslop by Damir Sokolovsky (@heydamir), CC BY 4.0. Rendering: Preact (MIT). Built by unslop/build.py. */
(function(){

const $h = preact.h;
function $G(sc, path){ const ps = path.split("."); let o = sc[ps[0]]; for (let i = 1; i < ps.length && o != null; i++) o = o[ps[i]]; return o; }
const $S = x => x == null || x === false ? "" : String(x);
const $T = x => !!x && x !== "false" && !(Array.isArray(x) && !x.length);
const $A = x => Array.isArray(x) ? x : [];
const $B = x => x === true || x === "true" || (typeof x === "string" && x !== "" && x !== "false");
const $V = x => x == null ? "" : x;
function switchView(v){ try { localStorage.setItem("dailyAffairs.view", v); } catch(e) {} location.href = v === "classic" ? "../?classic=1" : "./"; }
/* ===== Daily Affairs prototype logic (embedded in Main.dc.html). State lives in memory and localStorage only. ===== */
const SNAP_URL = "./snapshot.json";
let TODAY = localIso(new Date());
function localIso(d){ return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
function refreshToday(){ TODAY = localIso(new Date()); }
const LSK = "dailyAffairs.unslopped.v1";
const CURRENCIES = [["PKR","Pakistani rupee"],["USD","US dollar"],["GBP","UK pound"],["EUR","Euro"],["SAR","Saudi riyal"],["IQD","Iraqi dinar"],["IRT","Iranian toman"],["KRW","Korean won"],["AED","UAE dirham"]];
const CUR_UR = {PKR:"روپے",KRW:"کوریائی وون",SAR:"سعودی ریال",USD:"امریکی ڈالر",AED:"اماراتی درہم",IRT:"ایرانی تومان",IQD:"عراقی دینار",GBP:"برطانوی پاؤنڈ",EUR:"یورو"};
const CATS = ["Food","Groceries","Transport","Bills & subs","Phone & internet","Household","Personal","Books & study","Family","Charity","Wajibat","Savings","Other"];
const SOURCES = ["Cash","Foodpanda","Direct order","Card","JazzCash","Easypaisa","Bank transfer"];
/* refunds, guest shares, platform credit and vouchers */
const isRefund = t => t.kind === "refund";
const myPkr = t => (t.pkr || 0) - (t.guestPkr || 0);
const CREDIT_LABEL = {foodpanda: "Foodpanda credit"};
function credits(D){
  const c = {};
  F(D).txns.forEach(t => {
    if (isRefund(t) && (t.refundTo || "").startsWith("credit:")) { const k = t.refundTo.slice(7); c[k] = (c[k] || 0) + Math.abs(t.pkr || 0); }
    if ((t.paidFrom || "").startsWith("credit:")) { const k = t.paidFrom.slice(7); c[k] = (c[k] || 0) - (t.pkr || 0); }
  });
  Object.keys(c).forEach(k => c[k] = Math.round(c[k] * 100) / 100);
  return c;
}
const openVouchers = D => (F(D).vouchers || []).filter(v => !v.usedOn && !(v.expires && v.expires < TODAY));
function itemsNote(items){ return items.map(i => (i.qty > 1 ? i.qty + "x " : "") + i.name + (i.guest ? " (guest)" : "")).join(", "); }
const DELIVERY = [["0","","None or in amount"],["50","Rox Burger","Rox Burger +50"],["100","Haji Fresh Juice","Haji Fresh Juice +100"],["100b","Angaara","Angaara +100"],["140","Hadia's Kitchen","Hadia's Kitchen +140"]];
const MEALS = {nashta:"Nashta",dinner:"Dinner",snack:"Snack"};
const PRAYERS = [["fajr","Fajr","نمازِ صبح"],["zohar","Zohar","نمازِ ظہر"],["asr","Asr","نمازِ عصر"],["maghrib","Maghrib","نمازِ مغرب"],["esha","Esha","نمازِ عشاء"],
  ["zohar_q","Zohar (qasr)","نمازِ ظہر (قصر)"],["asr_q","Asr (qasr)","نمازِ عصر (قصر)"],["esha_q","Esha (qasr)","نمازِ عشاء (قصر)"]];
const DAY = ["fajr","zohar","asr","maghrib","esha"];
const TYPES = {kaffara:["Kaffara","کفارہ"],fidya:["Fidya","فدیہ"],khums:["Khums (other)","خمس"],nazr:["Nazr (vow)","نذر"],radd:["Radd-e-mazalim","ردِ مظالم"],amanat:["Amanat (trust held)","امانت"],other:["Other","دیگر"]};
const RELIGIOUS = ["kaffara","fidya","khums","nazr","radd"];
const FROM_THIRD = ["kaffara","fidya","nazr"];
const RATE = {love:["Loved it","love"], ok:["It was fine","ok"], no:["Not again","no"]};
const SA = "https://www.sistani.org/arabic/book/";
const RULES = [
 {topic:"A written will counts",ref:"Masa'il Muntakhaba 1291",url:SA+"13/688/",summary:"No spoken words are needed. A writing of the deceased that he clearly meant to be acted on after death is enough."},
 {topic:"What must be arranged",ref:"Masa'il Muntakhaba 1292; Minhaj 1337",url:SA+"13/688/",summary:"Return trusts or tell their owners. Secure payment of debts and of khums, zakat and mazalim. Secure making up of prayers, fasts and kaffara, by will if one has wealth, or by telling someone reliable such as the eldest son. Tell heirs of property held by others or hidden. When one is not sure of time, qaza and kaffara become urgent."},
 {topic:"Whole estate",ref:"Muntakhaba 1293; Minhaj 1389",url:SA+"15/848/",summary:"Debts, khums, zakat, mazalim and obligatory hajj come from the whole estate, willed or not. Kaffara and nazr do not."},
 {topic:"Nothing beyond that without a will",ref:"Muntakhaba 1294",url:SA+"13/688/",summary:"Without a will, heirs need not spend anything on kaffara, nazr or hired prayers and fasts. This is why they must be written in the wasiyat."},
 {topic:"The one-third limit",ref:"Muntakhaba 1295 to 1297",url:SA+"13/688/",summary:"Bequests other than hajj and financial dues are limited to one third unless heirs permit more. Within it: debts, then hired prayers and fasts, then recommended acts."},
 {topic:"If the third runs short",ref:"Muntakhaba 1298; Minhaj 1397",url:SA+"15/848/",summary:"Obligations that are not from the whole estate are cut in proportion, unless the will gives an order of priority. The wasiyat therefore states one."},
 {topic:"The executor",ref:"Muntakhaba 1310 to 1316; Minhaj 1437, 1441",url:SA+"13/688/",summary:"Must be sane, trustworthy and (obligatory precaution) Muslim. A backup executor may be named. A supervisor (nazir) may be appointed. The executor may delegate, such as handing kaffara to someone who knows the poor."},
 {topic:"Witnesses",ref:"Muntakhaba 1318",url:SA+"13/688/",summary:"A bequest of wealth is proven by two just Muslim men (or the listed alternatives). Executorship and guardianship of children are proven only by two just men."},
 {topic:"Eldest son",ref:"Islamic Laws 1370, 1374",url:"https://www.sistani.org/english/book/48/2267/",summary:"By obligatory precaution he makes up his father's qaza prayers, except those deliberately abandoned. A valid will to hire someone lifts his duty."},
 {topic:"Qaza order and qasr",ref:"Islamic Laws 1360, 1353",url:"https://www.sistani.org/english/book/48/2266/",summary:"No order needed except Zohar before Asr and Maghrib before Esha of one day. Travel prayers are made up as two rakat."},
 {topic:"Kaffara of a Ramadhan fast",ref:"Islamic Laws 1630",url:"https://www.sistani.org/english/book/48/2292/",summary:"Two months of fasting, or sixty poor people fed or given one mudd (about 750 g) of food each."}
];
const AC_CATS_ORDER = null;
const PROFILE_FIELDS = [
 ["name_en","Your full name (English)"],["name_ur","Your full name (Urdu)","ur"],["father_en","Father's name (English)"],["father_ur","Father's name (Urdu)","ur"],
 ["wasi_en","Executor (wasi), English"],["wasi_ur","Executor (wasi), Urdu","ur"],["wasi_contact","Executor's contact","ltr"],["wasi_email","Executor's email","ltr"],
 ["wasi2_email","Backup executor's email","ltr"],["wasi2_en","Backup executor, English"],["wasi2_ur","Backup executor, Urdu","ur"],
 ["nazir_en","Supervisor (nazir), English (optional)"],["nazir_ur","Supervisor (nazir), Urdu","ur"],["qayyim_en","Guardian of minor children, English (optional)"],["qayyim_ur","Guardian of minor children, Urdu","ur"],
 ["city","City"],["hidden_en","Property held by others or unknown to heirs, English","area"],["hidden_ur","Same in Urdu","urarea"],["extra_en","Additional instructions, English","area"],["extra_ur","Additional instructions, Urdu","urarea"]];

/* helpers */
const pad = n => String(n).padStart(2,"0");
const iso = d => d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate());
const parse = s => { const [y,m,d] = String(s).split("-").map(Number); return new Date(y, m-1, d); };
const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate()+n); return iso(d); };
const dayDiff = (a, b) => Math.round((parse(b) - parse(a)) / 86400000);
const fmt = n => (Math.round(n) || 0).toLocaleString("en-US");
const fmt2 = v => Math.abs(+v || 0).toLocaleString("en-US", {minimumFractionDigits:2, maximumFractionDigits:2});
const fmtC = (n, c) => !c || c === "PKR" ? "PKR " + fmt(n) : c + " " + (+n).toLocaleString("en-US", {maximumFractionDigits: Math.abs(+n) >= 1000 ? 0 : 2});
const nice = s => parse(s).toLocaleDateString("en-GB", {weekday:"short", day:"numeric", month:"short"});
const longDate = s => parse(s).toLocaleDateString("en-GB", {day:"numeric", month:"long", year:"numeric"});
const uid = p => (p||"x") + "-" + Date.now().toString(36) + Math.random().toString(36).slice(2,6);
const clone = o => JSON.parse(JSON.stringify(o));
const nfEn = new Intl.NumberFormat("en-US");
let nfUr; try { nfUr = new Intl.NumberFormat("ur-PK-u-nu-arabext", {useGrouping:false, maximumFractionDigits:2}); } catch(e) { nfUr = nfEn; }
const urDigits = s => String(s ?? "").replace(/[0-9]/g, d => "۰۱۲۳۴۵۶۷۸۹"[d]);
const urDate = s => { try { return parse(s).toLocaleDateString("ur-PK-u-nu-arabext", {day:"numeric", month:"long", year:"numeric"}); } catch(e) { return s; } };
const nowAt = () => TODAY + "T" + new Date().toISOString().slice(11);
const lsGet = () => { try { const v = localStorage.getItem(LSK); return v ? JSON.parse(v) : null; } catch(e) { return null; } };
const lsSet = v => { try { if (v) localStorage.setItem(LSK, JSON.stringify(v)); else localStorage.removeItem(LSK); } catch(e) {} };
const plural = (n, a, b) => n + " " + (n === 1 ? a : b);

/* derived state, ported from the live app */
const C = D => D.finance.config, F = D => D.finance;
const rate = (D, c) => !c || c === "PKR" ? 1 : (C(D).rates?.[c] || 0);
const toPkr = (D, amt, c) => (+amt || 0) * rate(D, c);
function cycleTxns(D){ const c = C(D).cycle; return F(D).txns.filter(t => t.date >= c.start && t.date < c.nextPay); }
function compute(D){
  const c = C(D).cycle, tx = cycleTxns(D);
  const spent = tx.reduce((s,t) => s + (t.pkr || 0), 0), left = (c.opening || 0) - spent, t = TODAY;
  const daysLeft = Math.max(1, dayDiff(t, c.nextPay));
  const spentToday = tx.filter(x => x.date === t).reduce((s,x) => s + (x.pkr||0), 0);
  const len = Math.max(1, dayDiff(c.start, c.nextPay));
  return {tx, spent, left, daysLeft, spentToday, allowToday: (left + spentToday) / daysLeft, perDay: left / daysLeft, len,
          elapsed: Math.min(1, Math.max(0, (dayDiff(c.start, t) + 0.5) / len))};
}
const savings = D => (C(D).savingsBase||0) + F(D).txns.filter(t => t.category === "Savings").reduce((s,t)=>s+t.pkr,0);
function debtStatus(D, d){
  const paid = (d.payments||[]).reduce((s,p) => s + toPkr(D, p.amount, p.currency), 0), total = toPkr(D, d.amount, d.currency), left = total - paid;
  const r = rate(D, d.currency), leftNative = r ? left / r : 0;
  return {paid, total, left, leftNative, open: d.status !== "cleared" && left > 0.5};
}
const openDebts = D => D.debts.filter(d => debtStatus(D, d).open);
function itemStatus(D, it){
  const paid = (it.payments||[]).reduce((s,p) => s + (p.currency === it.currency ? +p.amount : (rate(D, it.currency) ? toPkr(D, p.amount,p.currency)/rate(D, it.currency) : 0)), 0);
  return {paid, left: it.amount == null ? null : Math.max(0, it.amount - paid)};
}
const pendingItems = D => D.wajibat.items.filter(i => i.status === "pending");
function khums(D){
  const kh = D.khums.settings || {}, k = compute(D);
  const fx = (C(D).foreignCash||[]).reduce((s,f) => s + toPkr(D, f.amount, f.currency), 0);
  let recv = 0, pay = 0;
  D.debts.forEach(d => { const st = debtStatus(D, d); if (st.open && !d.khumsPaid) { if (d.direction === "owed_to_me") recv += st.left; else pay += st.left; } });
  const held = savings(D) + Math.max(0, k.left) + fx + recv - pay;
  const hasCarry = typeof kh.carryPkr === "number", taxable = held - (hasCarry ? kh.carryPkr : 0);
  const years = [...D.khums.years].sort((a,b) => String(b.year).localeCompare(String(a.year))).map(y => {
    const c = y.currency || "PKR";
    const paid = (y.payments||[]).reduce((s,p) => s + (p.currency === c ? +p.amount : (rate(D, c) ? toPkr(D, p.amount,p.currency)/rate(D, c) : 0)), 0);
    return {...y, c, paid, unpaid: Math.max(0, (y.khumsDue||0) - paid)};
  });
  const unpaid = years.filter(y => y.unpaid > 0.5);
  const daysTo = kh.next ? dayDiff(TODAY, kh.next) : null;
  return {kh, held, hasCarry, est: Math.max(0, taxable) / 5, taxable, years, unpaid, daysTo, fx, recv, pay};
}
/* one wording for the khums state on every tab. Nothing is owed before 23 Ramadan. */
function khumsStatus(kh){
  if (kh.unpaid.length) return {tone:"warn", word:"Unpaid", line:"Owed for " + kh.unpaid.map(y => y.year + ", " + fmtC(y.unpaid, y.c)).join("; ")};
  const due = kh.daysTo == null ? "Khums date not set" : kh.daysTo < 0 ? "23 Ramadan has passed, close the year" : "Payable on 23 Ramadan, in " + kh.daysTo + " days";
  return {tone: kh.daysTo != null && kh.daysTo < 0 ? "warn" : "ok", word:"Nothing owed now", line: due};
}
function lastYearNote(kh){ const y = kh.years[0]; if (!y) return ""; return y.year + ": " + (!(y.khumsDue > 0) ? "none was due" : y.unpaid <= 0.5 ? "paid in full" : fmtC(y.unpaid, y.c) + " unpaid"); }
function placeOf(t){ const i = (t.note||"").indexOf(":"); return (i < 0 ? t.note||"" : t.note.slice(0, i)).replace(/\s*\((WhatsApp|usual)\)\s*$/i, "").trim(); }
function dishesOf(t){ if (Array.isArray(t.items) && t.items.length) return t.items.filter(i => !i.guest).map(i => i.name); const i = (t.note||"").indexOf(":"); return i < 0 ? [] : t.note.slice(i + 1).split(/,\s*/).map(x => x.replace(/^\s*\d+x\s*/i, "").replace(/\s+/g, " ").trim()).filter(x => x && !/^incl\./.test(x)); }
function placeReviews(D, place){
  const rows = F(D).txns.filter(t => t.category === "Food" && !isRefund(t) && (t.rating || t.review || (t.items || []).some(i => i.rating)) && placeOf(t) === place).sort((a,b) => (b.date + (b.createdAt||"")).localeCompare(a.date + (a.createdAt||"")));
  const n = {love:0, ok:0, no:0}, dish = {};
  rows.forEach(t => { (t.items || []).forEach(i => { if (i.rating && !i.guest) { n[i.rating]++; if (!dish[i.name]) dish[i.name] = i.rating; } }); if (t.rating) { n[t.rating]++; dishesOf(t).forEach(d => { if (!dish[d]) dish[d] = t.rating; }); } });
  return {rows, n, dish};
}
function usuals(D){
  const since = addDays(TODAY, -150), g = {};
  F(D).txns.forEach(t => {
    if (t.category !== "Food" || isRefund(t) || t.guestPkr || t.date < since || !t.note || t.importedFrom === undefined && !t.vendor && t.note.indexOf(":") < 0) return;
    const vendor = (t.vendor || t.note.split(":")[0]).replace(/\s*\(WhatsApp\)\s*$/i, "").replace(/\s+-\s+.*$/, "").trim();
    if (!vendor || vendor.length > 40) return;
    const m = MEALS[t.meal] ? t.meal : "other", key = vendor + "|" + m;
    (g[key] = g[key] || {vendor, meal: m, xs: [], src: t.source || "Cash"}).xs.push(t.pkr);
  });
  return Object.values(g).filter(x => x.xs.length >= 2).sort((a,b) => b.xs.length - a.xs.length).slice(0, 8)
    .map(x => { const s = [...x.xs].sort((a,b) => a-b); return {...x, amount: Math.round(s[Math.floor(s.length/2)]), n: x.xs.length}; });
}
function billDue(D, b){
  const t = TODAY;
  if (b.dueDay){
    const td = parse(t); let d = new Date(td.getFullYear(), td.getMonth(), Math.min(b.dueDay, 28));
    const due = iso(d), paidFor = b.lastPaid && dayDiff(b.lastPaid, due) <= 6 && dayDiff(due, b.lastPaid) <= 20;
    const done = b.paidBy === "mentor" ? (b.remindedAt && dayDiff(b.remindedAt, due) <= 10 && dayDiff(due, b.remindedAt) <= 20) : paidFor;
    if (due < t || done) d = new Date(td.getFullYear(), td.getMonth() + 1, Math.min(b.dueDay, 28));
    return iso(d);
  }
  return b.lastPaid ? addDays(b.lastPaid, 30) : C(D).cycle.nextPay;
}
const myBills = D => F(D).bills.filter(b => b.paidBy !== "mentor");
function prayedToday(D, k){ return -(D.wajibat.log||[]).filter(l => l.at && l.at.slice(0,10) === TODAY).reduce((s,l) => s + ((l.changes||{})[k]||0), 0); }
const qazaTotal = D => { const c = D.wajibat.qaza.counts || {}; return PRAYERS.reduce((a,[k]) => a + (+c[k]||0), 0); };
function qazaFinish(D, perDay){ const c = D.wajibat.qaza.counts||{}; const days = Math.ceil(Math.max(0, ...DAY.map(k => +c[k]||0)) / perDay); return {days, date: addDays(TODAY, days)}; }
function willKey(D){
  const p = {...(D.wajibat.profile||{})}; delete p.signedAt; delete p.signedKey; delete p.updatedAt;
  const kh = khums(D);
  const str = JSON.stringify([p, openDebts(D).map(d => [d.id, Math.round(debtStatus(D, d).leftNative)]), pendingItems(D).map(i => [i.id, itemStatus(D, i).left]), kh.unpaid.map(y => [y.year, Math.round(y.unpaid)])]);
  let h = 0; for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0; return String(h);
}
function wasiyatChecks(D){
  const p = D.wajibat.profile || {}, signed = p.signedAt, stale = signed && p.signedKey && p.signedKey !== willKey(D);
  return [
    {ok: !!(p.name_en && p.name_ur), t: "Your name, English and Urdu", s: p.name_en || "Add it in Wajibat, Wasiyat details"},
    {ok: !!(p.father_en && p.father_ur), t: "Father's name", s: p.father_en || "Missing"},
    {ok: !!(p.wasi_en && p.wasi_ur), t: "Executor named", s: p.wasi_en || "Missing"},
    {ok: !!p.wasi_contact, t: "Executor's contact", s: p.wasi_contact ? "Saved" : "Missing"},
    {ok: !!(p.wasi_email || p.wasi2_email), t: "Executors' email", s: [p.wasi_email, p.wasi2_email].filter(Boolean).join(", ") || "Add them to send the wasiyat by email"},
    {ok: !!p.wasi2_en, t: "Backup executor", s: p.wasi2_en || "Needed if the executor cannot act"},
    {ok: !!p.nazir_en, t: "Supervisor (nazir)", s: p.nazir_en || "Optional, guards the executor"},
    {ok: !D.wajibat.items.some(i => i.status === "unclear"), t: "No unclear items", s: "Unclear items stay out of the wasiyat"},
    {ok: !!signed && !stale, t: "Printed and signed, two witnesses", s: !signed ? "Never recorded" : stale ? "Signed " + longDate(signed) + ", records changed since" : "Signed " + longDate(signed), sign: true}
  ];
}
function menuBook(D){
  const book = {};
  F(D).txns.forEach(t => {
    if (t.category !== "Food" || isRefund(t) || !t.note) return;
    const i0 = t.note.indexOf(":"), i = i0 < 0 ? t.note.length : i0;
    const place = t.note.slice(0, i).replace(/\s*\(WhatsApp\)\s*$/i, "").replace(/\s*\(usual\)\s*$/i, "").trim();
    if (!place || place.length > 50) return;
    const rest = t.note.slice(i + 1).split(/\. (Food|total|paid|late|inDrive|website|guests|lunch)/)[0];
    const e = book[place] = book[place] || {n: 0, xs: [], items: {}}; e.n++; if (!t.guestPkr) e.xs.push(t.pkr);
    if (Array.isArray(t.items) && t.items.length) { t.items.forEach(x => e.items[x.name] = (e.items[x.name] || 0) + 1); return; }
    rest.split(/,\s*/).map(x => x.replace(/^\s*\d+x\s*/i, "").replace(/\s+/g, " ").trim()).filter(x => x && x.length < 60 && !/^incl\./.test(x)).forEach(x => e.items[x] = (e.items[x] || 0) + 1);
  });
  return book;
}
function foodPlan(cfg){
  const caps = cfg.caps || {}, mp = cfg.mealsPerCycle || {nashta:28, dinner:28, snack:0};
  return {mp, total: (mp.nashta||0)*(caps.nashta||0) + (mp.dinner||0)*(caps.dinner||0) + (mp.snack||0)*(caps.snack||0) + (cfg.otherFood||0)};
}
function mpEaten(D, date, slot){
  const tx = F(D).txns.filter(t => t.date === date && t.category === "Food");
  return tx.find(t => t.plan === date + "|" + slot) || tx.find(t => !t.plan && t.meal === slot) || null;
}

/* wasiyat as blocks of segments, so the template can isolate Latin and number runs without raw HTML */
const T = t => ({t: String(t ?? "")}), L = t => ({t: String(t ?? ""), ltr: true}), I = t => ({t: String(t ?? ""), iso: true}), B = t => ({t: "[" + t + "]", blank: true});
const bl = (v, label) => v ? T(v) : B(label);
const P = (...segs) => ({p: true, segs: segs.flat()});
const UL = items => ({ul: true, items: items.map(segs => ({segs: segs.flat()}))});
const CL = (n, t) => ({clause: true, segs: [T(n + t)]});
function wasiyatModel(D){
  const c = D.wajibat.qaza.counts || {}, p = D.wajibat.profile || {}, pend = pendingItems(D);
  const withLeft = i => ({...i, amount: itemStatus(D, i).left});
  const debtAsItem = d => { const st = debtStatus(D, d); return {title: d.person, title_ur: d.person_ur, amount: st.leftNative >= 1000 ? Math.round(st.leftNative) : Math.round(st.leftNative*100)/100, currency: d.currency, contact: d.contact,
    note: [d.note, (d.payments||[]).length ? "Original amount " + fmtC(d.amount, d.currency) + ", repaid so far " + (d.payments||[]).map(x => fmtC(x.amount, x.currency)).join(" + ") : ""].filter(Boolean).join(". "), note_ur: d.note_ur}; };
  return {p, prayers: PRAYERS.filter(([k]) => +c[k] > 0).map(([k,en,ur]) => ({k,en,ur,n:+c[k]})), total: qazaTotal(D), roza: +D.wajibat.qaza.roza||0,
    whole: pend.filter(i => RELIGIOUS.includes(i.type) && !FROM_THIRD.includes(i.type)).map(withLeft),
    third: pend.filter(i => FROM_THIRD.includes(i.type)).map(withLeft),
    owe: openDebts(D).filter(d => d.direction !== "owed_to_me").map(debtAsItem),
    due: openDebts(D).filter(d => d.direction === "owed_to_me").map(debtAsItem),
    amanat: pend.filter(i => i.type === "amanat"), other: pend.filter(i => i.type === "other"),
    kh: khums(D), asOf: (D.updatedAt || TODAY).slice(0, 10)};
}
const amtEn = it => it.amount == null || it.amount === "" ? "" : fmtC(it.amount, it.currency);
const amtUr = it => it.amount == null || it.amount === "" ? "" : nfUr.format(it.amount) + " " + (CUR_UR[it.currency] || it.currency || "");
function wasiyatUr(D){
  const m = wasiyatModel(D), p = m.p, N = n => nfUr.format(n), b = [];
  let n = 0; const cl = t => b.push(CL(N(++n) + "۔ ", t));
  const li = it => [T(it.title_ur || it.title), amtUr(it) ? [T(": "), I(amtUr(it))] : [], it.contact ? [T(" (رابطہ: "), L(urDigits(it.contact)), T(")")] : [], it.note_ur ? T("۔ " + it.note_ur + "۔") : []];
  b.push({bism: true, segs: [T("بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ")]}, {h3: true, segs: [T("وصیت نامہ")]});
  b.push(P(T("میں، "), bl(p.name_ur, "اپنا نام"), T(" ولد "), bl(p.father_ur, "والد کا نام"), T("، اپنے پورے ہوش و حواس اور اپنی آزاد مرضی سے یہ وصیت کرتا ہوں۔")));
  b.push(P(T("میں گواہی دیتا ہوں کہ اللہ کے سوا کوئی معبود نہیں، وہ یکتا ہے اور اس کا کوئی شریک نہیں؛ اور حضرت محمد صلی اللہ علیہ وآلہ وسلم اس کے بندے اور رسول اور خاتم النبیین ہیں؛ اور امیر المومنین حضرت علی ابن ابی طالب علیہ السلام اور ان کی اولاد میں سے گیارہ ائمہ معصومین علیہم السلام اللہ کی حجتیں ہیں، جن میں آخری حضرت امام مہدی عجل اللہ تعالیٰ فرجہ الشریف ہیں۔ موت حق ہے، قبر کا سوال حق ہے، قیامت حق ہے، اور جنت و دوزخ حق ہیں۔")));
  b.push(P(T("میں آیت اللہ العظمیٰ سید علی حسینی سیستانی دام ظلہ العالی کا مقلد ہوں، اور میری یہ وصیت انہی کے فتاویٰ کے مطابق نافذ کی جائے۔ یہ تحریر میری وصیت ہے اور میری وفات کے بعد اس پر عمل کیا جائے۔ اس سے پہلے کی میری ہر وصیت منسوخ ہے۔")));
  cl("قضا نمازیں");
  if (m.total) { b.push(P(T("آج کی تاریخ تک میرے ذمے کل "), I(N(m.total)), T(" قضا نمازیں باقی ہیں:")), UL(m.prayers.map(x => [T(x.ur + ": "), I(N(x.n))])),
    P(T("قصر نمازیں قصر ہی کی صورت میں ادا کی جائیں۔ اگر یہ نمازیں میری زندگی میں ادا نہ ہو سکیں تو میرا وصی میرے ترکے کے ایک تہائی حصے سے کسی قابلِ اعتماد مومن کو اجرت دے کر انہیں ادا کروائے، جیسا کہ آگے ترتیب درج ہے۔ یہ تعداد یقینی ہے۔ میرا وصی اس وقت تک مطمئن نہ ہو جب تک یہ نمازیں حقیقتاً ادا نہ ہو جائیں؛ اگر اجیر فوت ہو جائے یا ادا نہ کرے تو کسی اور کو اجیر بنائے۔ اس وصیت سے میرا مقصد یہ ہے کہ یہ نمازیں میرے ترکے سے ادا ہوں اور میرے بڑے بیٹے پر ان کا بوجھ نہ رہے؛ البتہ اگر وہ خود یا اجرت کے ذریعے انہیں ادا کر دے تو یہ بھی کافی ہے۔"))); }
  else b.push(P(T("الحمد للہ، میرے ذمے کوئی قضا نماز باقی نہیں۔")));
  cl("قضا روزے");
  b.push(m.roza ? P(T("میرے ذمے "), I(N(m.roza)), T(" قضا روزے باقی ہیں۔ ان کی ادائیگی بھی اسی طرح ایک تہائی ترکے سے کروائی جائے۔")) : P(T("الحمد للہ، میرے ذمے کوئی قضا روزہ باقی نہیں۔")));
  cl("کفارہ، فدیہ اور نذر");
  if (m.third.length) b.push(UL(m.third.map(li)), P(T("میں وصیت کرتا ہوں کہ یہ میرے ترکے کے ایک تہائی حصے سے ادا کیے جائیں۔ کفارہ کھانے کی صورت میں ادا کیا جائے: ہر روزے کے بدلے ساٹھ فقیروں میں سے ہر ایک کو ایک مُد (تقریباً ساڑھے سات سو گرام) گندم، آٹا یا اس جیسی غذا۔ کھانے کے بدلے نقد رقم نہ دی جائے؛ میرا وصی خود کھانا خرید کر تقسیم کرے، یا فقیر کو وکیل بنا کر رقم دے کہ وہ کفارے کی طرف سے کھانا خریدے اور پھر خود اس کا مالک بنے۔")));
  else b.push(P(T("اس وقت کوئی کفارہ، فدیہ یا نذر باقی نہیں۔")));
  cl("ایک تہائی ترکے سے ادائیگی کی ترتیب");
  b.push(P(T("ایک تہائی کا حساب کفن دفن کے واجب اخراجات، قرضوں اور شرعی حقوق کی ادائیگی کے بعد باقی ترکے پر کیا جائے۔ اس ایک تہائی سے پہلے کفارہ اور نذر ادا کیے جائیں، پھر قضا نمازیں اور قضا روزے اجرت پر ادا کروائے جائیں۔ اگر ایک تہائی کافی نہ ہو تو میں اپنے ورثا سے التماس کرتا ہوں کہ وہ باقی ادائیگی کی اجازت دیں۔")));
  cl("ایک تہائی ترکے کا باقی حصہ: امامِ زمانہ عجل اللہ تعالیٰ فرجہ الشریف کے نام");
  b.push(P(T("شرعی حقوق اور قرضوں کی ادائیگی کے بعد ترکے کے دو تہائی حصے میرے ورثا کا حق ہیں، جو ان کے شرعی حصوں کے مطابق ان میں تقسیم ہوں۔ میرے ترکے کے ایک تہائی حصے میں سے کفارے، نذر اور قضا عبادات کی ادائیگی کے بعد جو کچھ باقی بچے، اس سب کے بارے میں میری وصیت ہے کہ وہ حضرت امامِ زمانہ عجل اللہ تعالیٰ فرجہ الشریف کے نام پر یتیمانِ آلِ محمد علیہم السلام کی تعلیم و تعلّم میں صرف کیا جائے۔ اس مال کو خرچ کرنے کا اختیار میرے وصی "), bl(p.wasi_ur, "وصی کا نام"), T(" کو ہے؛ یتیمانِ آلِ محمد علیہم السلام سے کون مراد ہیں، کس ادارے یا کس طریقے سے یہ تعلیم ہو، اور کتنا کب خرچ ہو، یہ سب ان کی صوابدید پر ہے، وہ چاہیں تو اسے کسی حلال طریقے سے سرمایہ کاری میں لگا کر اس کا منافع اسی مقصد میں صرف کریں، یا اصل مال ہی خرچ کر دیں، اور اس کے خرچ میں تاخیر بھی کر سکتے ہیں؛ یہ مکمل طور پر ان کی صوابدید پر ہے۔ اگر کسی وقت یہ مقصد ممکن نہ رہے تو یہ مال امامِ زمانہ عجل اللہ تعالیٰ فرجہ الشریف کے نام پر اس کے قریب ترین نیک کام میں صرف کیا جائے، جسے میرا وصی طے کرے؛ یہ مال میراث میں واپس نہ جائے۔")));
  cl("خمس اور دیگر شرعی حقوق");
  if (m.whole.length) b.push(UL(m.whole.map(li)), P(T("یہ حقوق ترکے کی تقسیم سے پہلے پورے ترکے سے ادا کیے جائیں۔")));
  const kh = m.kh;
  if (kh.unpaid.length) b.push(P(T("ذیل کے سالوں کا خمس ابھی ادا نہیں ہوا، یہ میرے ذمے قرض ہے اور ترکے کی تقسیم سے پہلے پورے ترکے سے ادا کیا جائے:")), UL(kh.unpaid.map(y => [T("سال "), I(urDigits(y.year)), T(": "), I(nfUr.format(Math.round(y.unpaid*100)/100) + " " + (CUR_UR[y.c]||y.c))])));
  const asc = [...kh.years].reverse(), paidYears = asc.filter(y => (y.khumsDue||0) > 0 && y.unpaid <= 0.5).map(y => y.year), noneYears = asc.filter(y => !(y.khumsDue > 0)).map(y => y.year);
  if (paidYears.length) b.push(P(T("سال "), I(urDigits(paidYears.join("، "))), T(" کا خمس مکمل ادا ہو چکا ہے۔"), noneYears.length ? [T(" سال "), I(urDigits(noneYears.join("، "))), T(" میں بچت مخمس مال سے کم رہی، اس لیے ان پر خمس واجب نہ ہوا۔")] : []));
  b.push(P(T("میرا خمس کا سال ماہِ رمضان المبارک کی تئیسویں تاریخ کو مکمل ہوتا ہے۔ موجودہ خمس کا سال "), I(urDigits(kh.kh.label||"")), T(" ہے" + (kh.kh.next ? " جو تقریباً " + urDate(kh.kh.next) + " کو مکمل ہوگا" : "") + "۔ نیچے درج تاریخ تک میرے حساب کے مطابق اس سال کا تخمینی خمس "), I(nfUr.format(Math.round(kh.est)) + " روپے"), T(" ہے۔ اگر وفات کے وقت کسی مال کا خمس ادا نہ ہوا ہو تو میرا وصی میرے حساب کی بنیاد پر اسے معلوم کر کے اصل ترکے سے ادا کرے۔")));
  cl("حجۃ الاسلام");
  b.push(P(T("اب تک مجھ پر حجۃ الاسلام واجب نہیں ہوا۔ اگر میری زندگی میں یہ واجب ہو جائے اور میں اسے ادا کیے بغیر فوت ہو جاؤں تو یہ میرے پورے ترکے سے، تاخیر کے بغیر، ادا کروایا جائے۔ اگر ترکہ سب کے لیے کافی نہ ہو تو پہلے لوگوں کے قرض، پھر حج، پھر ذمے میں باقی خمس ادا کیا جائے۔")));
  cl("وہ قرض جو میرے ذمے ہیں");
  if (m.owe.length) b.push(UL(m.owe.map(li)), P(T("یہ قرض ترکے کی تقسیم سے پہلے اصل ترکے سے ادا کیے جائیں۔"))); else b.push(P(T("اس وقت میرے ذمے کسی کا کوئی قرض نہیں۔")));
  if (m.amanat.length) { cl("امانتیں"); b.push(UL(m.amanat.map(li)), P(T("یہ امانتیں ان کے مالکان کو لوٹا دی جائیں؛ یہ میرے ترکے کا حصہ نہیں۔"))); }
  cl("وہ قرض جو دوسروں کے ذمے میرے ہیں");
  if (m.due.length) b.push(UL(m.due.map(li)), P(T("میرا وصی یہ رقوم وصول کر کے ترکے میں شامل کرے۔"))); else b.push(P(T("اس وقت کسی کے ذمے میرا کوئی قرض نہیں۔")));
  if (m.other.length) { cl("دیگر"); b.push(UL(m.other.map(li))); }
  if (p.hidden_ur) { cl("وہ مال جو دوسروں کے پاس ہے یا ورثا کے علم میں نہیں"); b.push(P(T(p.hidden_ur))); }
  cl("وصی");
  b.push(P(T("میں "), bl(p.wasi_ur, "وصی کا نام"), p.wasi_contact ? [T(" (رابطہ: "), L(urDigits(p.wasi_contact)), T(")")] : [], T(" کو اپنا وصی مقرر کرتا ہوں۔" + (p.wasi2_ur ? " اگر ان کا انتقال ہو جائے یا وہ وصایت انجام نہ دے سکیں تو " + p.wasi2_ur + " میرے وصی ہوں گے۔" : "") + (p.nazir_ur ? " " + p.nazir_ur + " وصی کے کام پر ناظر اور نگران ہوں گے، اور وصی ہر کام ان کے علم میں لا کر انجام دے گا۔" : ""))));
  b.push(P(T("وصی کی ذمہ داریاں یہ ہیں: میری تجہیز و تکفین، میرے قرض ادا کرنا اور مجھے واجب الادا رقوم وصول کرنا، امانتیں ان کے مالکان کو لوٹانا، شرعی حقوق ادا کرنا، ایک تہائی ترکے کو اس وصیت کے مطابق صرف کرنا، اور اس وصیت کی ہر شق پر عمل کرنا۔ وصی یہ کام بغیر اجرت کے انجام دیں گے اور ہر ادائیگی کی رسید محفوظ رکھیں گے۔ وہ کاموں کے لیے قابلِ اعتماد وکیل مقرر کر سکتے ہیں، مگر وصایت کسی اور کو منتقل نہیں کر سکتے۔")));
  if (p.qayyim_ur) { cl("نابالغ اولاد کی سرپرستی"); b.push(P(T("میں " + p.qayyim_ur + " کو اپنی نابالغ اولاد اور ان کے مال کا سرپرست (قیّم) مقرر کرتا ہوں۔"))); }
  if (p.extra_ur) { cl("دیگر ہدایات"); b.push(P(T(p.extra_ur))); }
  b.push(P(T("میں اپنے ورثا اور مومنین سے دعا کی التماس کرتا ہوں۔")));
  b.push({sig: true, lines: [{t:"دستخط وصیت کنندہ اور تاریخ"},{t:"گواہ اول (عادل مسلمان مرد): نام، دستخط"},{t:"گواہ دوم (عادل مسلمان مرد): نام، دستخط"}]});
  b.push({stamp: true, segs: [T("ریکارڈ بتاریخ " + urDate(m.asOf) + (p.city ? "، " + (p.city === "Lahore" ? "لاہور" : p.city) : ""))]});
  return b;
}
function wasiyatEn(D){
  const m = wasiyatModel(D), p = m.p, N = n => nfEn.format(n), b = [];
  let n = 0; const cl = t => b.push(CL(++n + ". ", t));
  const li = it => [T(it.title + (amtEn(it) ? ": " + amtEn(it) : "") + (it.contact ? " (contact: " + it.contact + ")" : "") + (it.note ? ". " + it.note : ""))];
  b.push({bism: true, segs: [T("بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ")]}, {h3: true, segs: [T("Last Will (Wasiyat Nama)")]});
  b.push(P(T("I, "), bl(p.name_en, "your name"), T(", son of "), bl(p.father_en, "father's name"), T(", being of sound mind and acting of my own free will, make this will.")));
  b.push(P(T("I bear witness that there is no god but Allah, One, without partner; that Muhammad, peace and blessings of Allah be upon him and his progeny, is His servant, His Messenger and the Seal of the Prophets; and that Amir al-Mu'minin Ali ibn Abi Talib, peace be upon him, and the eleven infallible Imams from his descendants, peace be upon them, are the proofs of Allah, the last of them being Imam al-Mahdi, may Allah hasten his reappearance. Death is true, the questioning in the grave is true, the Resurrection is true, and Paradise and Hell are true.")));
  b.push(P(T("I follow Ayatullah al-Uzma Sayyid Ali al-Husaini al-Sistani, may his shadow endure, and this will is to be carried out according to his rulings. This written document is my will and is to be acted upon after my death. It revokes every earlier will of mine.")));
  cl("Qaza prayers");
  if (m.total) b.push(P(T("As of the date below, " + N(m.total) + " qaza prayers remain owed by me:")), UL(m.prayers.map(x => [T(x.en + ": " + N(x.n))])),
    P(T("Prayers missed while travelling are to be made up in their shortened (qasr) form. If they are not completed in my lifetime, my executor is to hire a trustworthy believer to perform them, paying from one third of my estate in the order set out below. These counts are certain. My executor is not to consider them done until they are actually performed; if a hired person dies or fails to perform them, he is to hire another. By this will I intend these prayers to be paid for from my estate so that the burden does not fall on my eldest son; if he nonetheless performs them himself or through a hired person, that also suffices.")));
  else b.push(P(T("Praise be to Allah, I owe no qaza prayers.")));
  cl("Qaza fasts");
  b.push(P(T(m.roza ? N(m.roza) + " qaza fasts remain owed by me; they are to be arranged in the same way from one third of my estate." : "Praise be to Allah, I owe no qaza fasts.")));
  cl("Kaffara, fidya and nazr");
  if (m.third.length) b.push(UL(m.third.map(li)), P(T("I direct that these be paid from one third of my estate. Kaffara is to be given as food: for each fast, one mudd (about 750 grams) of wheat, flour or similar food to each of sixty poor people. Cash is not to be given in place of food: my executor is to buy and distribute the food himself, or give the money to a poor person as an agent to buy the food on behalf of the kaffara and then take ownership of it.")));
  else b.push(P(T("No kaffara, fidya or nazr is outstanding.")));
  cl("Order of payment from the one third");
  b.push(P(T("The one third is to be reckoned on what remains after the obligatory burial costs, debts and religious dues are paid. From that one third, my kaffara and nazr are to be paid first, then my qaza prayers and fasts are to be performed by hired persons. If one third is not enough, I ask my heirs to permit the rest to be paid.")));
  cl("The rest of the one third: in the name of Imam-e-Zamana, may Allah hasten his reappearance");
  b.push(P(T("After religious dues and debts are paid, two thirds of my estate belong to my heirs, to be divided according to their shares in the shariah. From the one third of my estate, whatever remains after my kaffara, nazr and qaza worship are paid for, I bequeath in its entirety in the name of Imam-e-Zamana, may Allah hasten his reappearance, to be spent wholly on the education (taleem o taallum) of the orphans of Aal-e-Muhammad, peace be upon them. My executor, "), bl(p.wasi_en, "executor's name"), T(", has full discretion over this: who the orphans of Aal-e-Muhammad are, through which institution or means they are taught, and how much is spent and when. He may invest it in a halal way and spend the profit on this purpose, or spend the capital itself, and he may delay spending; this is entirely at his discretion. If this purpose ever becomes impossible, the property is to be spent, in the name of Imam-e-Zamana, may Allah hasten his reappearance, on the good work nearest to it, as my executor decides; it is not to return to the inheritance.")));
  cl("Khums and other religious dues");
  if (m.whole.length) b.push(UL(m.whole.map(li)), P(T("These are to be paid from the whole estate before it is divided among the heirs.")));
  const kh = m.kh;
  if (kh.unpaid.length) b.push(P(T("Khums for the following years has not yet been paid. It is a debt on me and is to be paid from the whole estate before it is divided:")), UL(kh.unpaid.map(y => [T(y.year + ": " + fmtC(y.unpaid, y.c))])));
  const asc = [...kh.years].reverse(), paidYears = asc.filter(y => (y.khumsDue||0) > 0 && y.unpaid <= 0.5).map(y => y.year), noneYears = asc.filter(y => !(y.khumsDue > 0)).map(y => y.year);
  if (paidYears.length) b.push(P(T("Khums for " + paidYears.join(", ") + " has been paid in full." + (noneYears.length ? " In " + noneYears.join(", ") + " my savings stayed below the mukhamas, so no khums was due." : ""))));
  b.push(P(T("My khums year ends on the 23rd of the month of Ramadhan. The current khums year is " + (kh.kh.label||"") + (kh.kh.next ? ", ending about " + longDate(kh.kh.next) : "") + ". As of the date below my records estimate the khums for this year at PKR " + fmt(kh.est) + ". Any khums unpaid at my death is to be worked out by my executor from my records and paid from the whole estate.")));
  cl("Hajj al-Islam");
  b.push(P(T("Hajj al-Islam has not yet become obligatory on me. If it becomes obligatory in my lifetime and I die without performing it, it is to be performed on my behalf from my whole estate without delay. If the estate does not cover everything, people's debts come first, then the hajj, then any khums owed.")));
  cl("Debts I owe");
  if (m.owe.length) b.push(UL(m.owe.map(li)), P(T("These are to be repaid from the whole estate before it is divided."))); else b.push(P(T("I owe no debts at present.")));
  if (m.amanat.length) { cl("Trusts (amanat) I hold"); b.push(UL(m.amanat.map(li)), P(T("These are to be returned to their owners; they are not part of my estate."))); }
  cl("Debts owed to me");
  if (m.due.length) b.push(UL(m.due.map(li)), P(T("My executor is to collect these and add them to the estate."))); else b.push(P(T("Nobody owes me anything at present.")));
  if (m.other.length) { cl("Other"); b.push(UL(m.other.map(li))); }
  if (p.hidden_en) { cl("Property held by others or unknown to my heirs"); b.push(P(T(p.hidden_en))); }
  cl("Executor");
  b.push(P(T("I appoint "), bl(p.wasi_en, "executor's name"), T((p.wasi_contact ? " (contact: " + p.wasi_contact + ")" : "") + " as my executor (wasi)." + (p.wasi2_en ? " If he dies or cannot act, " + p.wasi2_en + " is to be my executor." : "") + (p.nazir_en ? " " + p.nazir_en + " is to supervise the executor (nazir), and the executor is to act with his knowledge." : ""))));
  b.push(P(T("The executor's duties are: my burial and shrouding; paying my debts and collecting what is owed to me; returning trusts to their owners; paying religious dues; spending the one third as this will directs; and carrying out every clause of this will. He is to act without a fee and keep a receipt for every payment. He may appoint trustworthy agents for tasks, but may not hand the executorship itself to anyone else.")));
  if (p.qayyim_en) { cl("Guardian of minor children"); b.push(P(T("I appoint " + p.qayyim_en + " as guardian (qayyim) of my minor children and their property."))); }
  if (p.extra_en) { cl("Further instructions"); b.push(P(T(p.extra_en))); }
  b.push(P(T("I ask my heirs and the believers to remember me in their prayers.")));
  b.push({sig: true, lines: [{t:"Signature of testator and date"},{t:"First witness (a just Muslim man): name, signature"},{t:"Second witness (a just Muslim man): name, signature"}]});
  b.push({stamp: true, segs: [T("Records as of " + longDate(m.asOf) + (p.city ? ", " + p.city : ""))]});
  return b;
}
const blockText = blocks => blocks.map(x => x.ul ? x.items.map(i => "• " + i.segs.map(s => s.t).join("")).join("\n") : x.sig ? x.lines.map(l => l.t).join("\n") : (x.segs||[]).map(s => s.t).join("")).join("\n\n");
const FIELD_DEFAULTS = {
  add_amount:"", add_cat:"Other", add_src:"Cash", add_cur:"PKR", add_del:"0", add_date:TODAY, add_place:"", add_note:"", add_review:"",
  add_disc:"", add_vch:"", rf_amt:"", rf_tx:"", rf_to:"credit:foodpanda", rf_date:TODAY, rf_note:"", vc_amt:"", vc_where:"Foodpanda", vc_exp:"", vc_note:"",
  rate_review:"", afford:"", ac_search:"", ac_month:"",
  sl_qpace:"1", sl_extra:"0", sl_per:"6000", sl_q:"1",
  debt_person:"", debt_person_ur:"", debt_direction:"i_owe", debt_amount:"", debt_currency:"PKR", debt_contact:"", debt_note:"", debt_note_ur:"", debt_khumsPaid:false,
  kp_year:"", kp_share:"Sahm-e-Imam", kp_amt:"", kp_cur:"PKR", kp_date:TODAY, kp_to:"",
  kc_year:"", kc_date:"", kc_sav:"", kc_due:"", kc_out:"", kc_cur:"PKR", kc_next:"", kc_nextLabel:"",
  it_type:"kaffara", it_status:"pending", it_title:"", it_title_ur:"", it_amount:"", it_currency:"PKR", it_contact:"", it_note:"", it_note_ur:"",
  c_owner:"alimuqaddasm", c_repo:"life", c_path:"data/life.json", c_branch:"", c_token:"",
  p_amount:"", p_date:"", s_nashta:"", s_dinner:"", s_snack:"", s_nashtaN:"", s_dinnerN:"", s_snackN:"", s_other:"", s_pay:"", s_save:"", s_waj:"", s_open:"", s_start:"", s_next:"",
  k_label:"", k_greg:"", k_next:"", k_carry:""
};

/* ===== prayer times: intime.ir's method (praytimes.org formulas, two passes), Sistani preset.
   Verified against intime.ir, 90 of 90 times for Lahore, 20 to 24 Nov 2026. Library from the user's intime-prayer-times folder. ===== */
/*!
 * prayertimes.js: prayer times with intime.ir's method (praytimes.org formulas, two passes).
 * Reproduces intime.ir exactly (90 of 90 times checked, Lahore, 20 to 24 Nov 2026, all 18 columns).
 *
 * Presets: PrayerTimes.TEHRAN (intime.ir default) and PrayerTimes.SISTANI (same angles; the night runs
 * from sunset to true dawn, as in Minhaj al-Salihin mas'ala 502, instead of to 19.5 deg).
 *
 * Usage (browser):  <script src="prayertimes.js"></script>
 *   var t = PrayerTimes.compute(2027, 1, 1, 31.5204, 74.3587, 5, PrayerTimes.TEHRAN);  // hours, local clock
 *   PrayerTimes.hm(PrayerTimes.toMin(t.fajr))  // "05:37"
 * Usage (Node):     const PrayerTimes = require('./prayertimes.js');
 * Columns: imsak fajr fajrPrayer fajrEnd sunrise dhuhr q2 q4 q6 mithl mithlayn sunset maghrib isha
 *          travellerEnd ishaEnd midnight duaEnd.  tz = UTC offset in hours for that date.
 */
(function (root) {
  'use strict';
  var DR = Math.PI / 180;
  function sin(d) { return Math.sin(d * DR); } function cos(d) { return Math.cos(d * DR); } function tan(d) { return Math.tan(d * DR); }
  function asin(x) { return Math.asin(x) / DR; } function acos(x) { return Math.acos(x) / DR; }
  function atan2(y, x) { return Math.atan2(y, x) / DR; } function acot(x) { return Math.atan(1 / x) / DR; }
  function fix(a, b) { a = a - b * Math.floor(a / b); return a < 0 ? a + b : a; }
  function julian(y, m, d) {
    if (m <= 2) { y -= 1; m += 12; }
    var A = Math.floor(y / 100), B = 2 - A + Math.floor(A / 4);
    return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5;
  }
  function sunPos(jd) {
    var D = jd - 2451545.0, g = fix(357.529 + 0.98560028 * D, 360), q = fix(280.459 + 0.98564736 * D, 360);
    var L = fix(q + 1.915 * sin(g) + 0.020 * sin(2 * g), 360), e = 23.439 - 0.00000036 * D;
    var RA = atan2(cos(e) * sin(L), cos(L)) / 15;
    return { decl: asin(sin(e) * sin(L)), eqt: q / 15 - fix(RA, 24) };
  }
  var NIGHT_COLS = { travellerEnd: 1 / 4, ishaEnd: 1 / 3, midnight: 1 / 2, duaEnd: 'dua' };
  var TEHRAN = {
    angles: { imsak: 19.5, fajr: 17.7, fajrPrayer: 15, fajrEnd: 12, maghrib: 4.5, isha: 13 },
    nights: { travellerEnd: [0, 19.5], ishaEnd: [0, 19.5], midnight: [0, 19.5], duaEnd: [0, 19.5] }
  };
  // Ayatullah al-Sistani: the night runs from sunset to true dawn (Minhaj al-Salihin, mas'ala 502), so the night ends
  // at the dawn angle in use (17.7) instead of intime's 19.5. Angles are unchanged: his texts give no degrees.
  // The night ends at the FOLLOWING morning's dawn (nightNext), which is what "sunset to dawn" means physically;
  // intime.ir itself uses the same date's value, so TEHRAN keeps that convention to match it exactly.
  var SISTANI = {
    angles: { imsak: 19.5, fajr: 17.7, fajrPrayer: 15, fajrEnd: 12, maghrib: 4.5, isha: 13 },
    nights: { travellerEnd: [0, 17.7], ishaEnd: [0, 17.7], midnight: [0, 17.7], duaEnd: [0, 17.7] },
    nightNext: true
  };
  function compute(y, m, d, lat, lng, tz, E) {
    var jd = julian(y, m, d) - lng / (15 * 24);
    function midday(t, J) { return fix(12 - sunPos((J || jd) + t).eqt, 24); }
    function angleT(a, t, ccw, J) {
      var decl = sunPos((J || jd) + t).decl, noon = midday(t, J);
      var x = (-sin(a) - sin(decl) * sin(lat)) / (cos(decl) * cos(lat));
      if (!(x >= -1 && x <= 1)) return NaN;
      var tt = acos(x) / 15; return ccw ? noon - tt : noon + tt;
    }
    function shadowT(f, t) {
      var decl = sunPos(jd + t).decl, noon = midday(t), a = acot(f + tan(Math.abs(lat - decl)));
      var x = (sin(a) - sin(decl) * sin(lat)) / (cos(decl) * cos(lat));
      if (!(x >= -1 && x <= 1)) return NaN;
      return noon + acos(x) / 15;
    }
    // [key, angle, morning?, first guess (hours)]
    var A = E.angles, spec = [
      ['imsak', A.imsak, true, 5], ['fajr', A.fajr, true, 5], ['fajrPrayer', A.fajrPrayer, true, 5], ['fajrEnd', A.fajrEnd, true, 6],
      ['sunrise', 0.833, true, 6], ['sunset', 0.833, false, 18], ['maghrib', A.maghrib, false, 18], ['isha', A.isha, false, 18]];
    Object.keys(NIGHT_COLS).forEach(function (k) {
      var n = E.nights[k], s = n[0] > 0 ? n[0] : 0.833;      // 0 = sunset, with the true 0.833
      spec.push(['nS' + s, s, false, 18]); spec.push(['nE' + n[1], n[1], true, 5, E.nightNext ? jd + 1 : jd]);
    });
    var shadows = { q2: 2 / 7, q4: 4 / 7, q6: 6 / 7, mithl: 1, mithlayn: 2 };
    var t = { dhuhr: 12 }; spec.forEach(function (s) { t[s[0]] = s[3]; }); for (var sk in shadows) t[sk] = 13;
    for (var i = 0; i < 2; i++) {
      var p = {}; for (var k in t) p[k] = t[k] / 24;
      var nt = { dhuhr: midday(p.dhuhr) };
      spec.forEach(function (s) { nt[s[0]] = angleT(s[1], p[s[0]], s[2], s[4]); });
      for (var sk2 in shadows) nt[sk2] = shadowT(shadows[sk2], p[sk2]);
      t = nt;
    }
    var adj = tz - lng / 15; for (var k2 in t) t[k2] += adj;
    // Where true dawn does not occur (high latitudes in summer), times defined from dawn do not exist either.
    if (!isFinite(t.fajr)) { t.fajrPrayer = NaN; t.fajrEnd = NaN; }
    Object.keys(NIGHT_COLS).forEach(function (k) {
      var n = E.nights[k], s = n[0] > 0 ? n[0] : 0.833;
      var start = t['nS' + s], len = (t['nE' + n[1]] + 24) - start;
      t[k] = NIGHT_COLS[k] === 'dua' ? start + len / 2 + len / 12 : start + len * NIGHT_COLS[k];
    });
    return t;
  }
  function toMin(h) { if (!isFinite(h)) return NaN; var x = fix(h + 0.5 / 60, 24); return Math.floor(x) * 60 + Math.floor((x - Math.floor(x)) * 60); }
  function hm(mins) { if (!isFinite(mins)) return 'n/a'; mins = ((mins % 1440) + 1440) % 1440; return String(Math.floor(mins / 60)).padStart(2, '0') + ':' + String(mins % 60).padStart(2, '0'); }

  var api = { compute: compute, toMin: toMin, hm: hm, TEHRAN: TEHRAN, SISTANI: SISTANI, NIGHT_COLS: NIGHT_COLS };
  if (typeof module === 'object' && module.exports) module.exports = api; else root.PrayerTimes = api;
})(typeof self !== 'undefined' ? self : this);

const LAHORE = {lat: 31.5204, lng: 74.3587, tz: 5};
/* the five times the app shows, as Sistani's texts define their start: true dawn (17.7), solar noon,
   Asr fadila at 2 qadam, Maghrib once the eastern redness has gone (4.5), Isha fadila when the western redness goes (13) */
function prayTimes(dateIso, loc){
  loc = loc || LAHORE; const [Y, M, Dd] = dateIso.split("-").map(Number);
  const PT = (typeof self !== "undefined" && self.PrayerTimes) || (typeof window !== "undefined" && window.PrayerTimes);
  const t = PT.compute(Y, M, Dd, loc.lat, loc.lng, loc.tz, PT.SISTANI), h = x => PT.toMin(x) / 60;
  return {fajr: h(t.fajr), fajrSafe: h(t.fajrPrayer), sunrise: h(t.sunrise), zohar: h(t.dhuhr), asr: h(t.q2), sunset: h(t.sunset),
    maghrib: h(t.maghrib), esha: h(t.isha), midnight: h(t.midnight)};
}
const hhmm = h => { const t = Math.round(h * 60), H = Math.floor(t / 60), Mi = t % 60; return (H > 12 ? H - 12 : H) + ":" + pad(Mi); };
function lahoreNow(){ try { const p = new Intl.DateTimeFormat("en-GB", {timeZone: "Asia/Karachi", hour: "2-digit", minute: "2-digit", hour12: false}).formatToParts(new Date()); const g = k => +p.find(x => x.type === k).value; return g("hour") + g("minute") / 60; } catch(e) { const d = new Date(); return d.getHours() + d.getMinutes() / 60; } }
/* smooth path through points */
function smoothPath(pts){ if (!pts.length) return ""; let d = "M" + pts[0][0].toFixed(1) + " " + pts[0][1].toFixed(1);
  for (let i = 1; i < pts.length; i++) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], c = (x1 - x0) / 2; d += " C" + (x0 + c).toFixed(1) + " " + y0.toFixed(1) + " " + (x1 - c).toFixed(1) + " " + y1.toFixed(1) + " " + x1.toFixed(1) + " " + y1.toFixed(1); }
  return d; }
/* numbers count to their new value: elements carry data-count, the script owns their text */
const COUNT_SEEN = new WeakMap();
function runCounters(){
  let still = false; try { still = matchMedia("(prefers-reduced-motion: reduce)").matches; } catch(e) {}
  document.querySelectorAll("[data-count]").forEach(el => {
    const target = el.getAttribute("data-count") || "", prev = COUNT_SEEN.get(el);
    if (prev === target) return; COUNT_SEEN.set(el, target);
    const m = /^([^0-9-]*)(-?[0-9][0-9,]*(?:\.[0-9]+)?)(.*)$/.exec(target);
    const pm = prev != null ? /(-?[0-9][0-9,]*(?:\.[0-9]+)?)/.exec(prev) : null;
    if (!m || !pm || still) { el.textContent = target; return; }
    const to = +m[2].replace(/,/g, ""), from = +pm[1].replace(/,/g, ""), dec = (m[2].split(".")[1] || "").length;
    if (from === to) { el.textContent = target; return; }
    const t0 = performance.now(), dur = 420, ease = x => 1 - Math.pow(1 - x, 3);
    const step = now => { if (COUNT_SEEN.get(el) !== target) return; const k = Math.min(1, (now - t0) / dur), v = from + (to - from) * ease(k);
      el.textContent = m[1] + v.toLocaleString("en-US", {minimumFractionDigits: dec, maximumFractionDigits: dec}) + m[3]; if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  });
}
/* charts drawn from one data attribute, so no SVG attribute ever holds a template placeholder */
const SVG_SEEN = new WeakMap();
function runSvgs(){ document.querySelectorAll("svg[data-svg]").forEach(el => { const v = el.getAttribute("data-svg") || ""; if (SVG_SEEN.get(el) === v || v.indexOf("{{") === 0) return; SVG_SEEN.set(el, v); el.innerHTML = v; }); }

/* ===== Prayer times tab: the 18 times of the user's intime prayer-times page, with the Sistani notes ===== */
const PT_COLS = [
  {k: "imsak", name: "Imsak", hue: "fajr", title: "Imsak (stop eating for the fast)", set: "angle", def: "Stop eating for the fast. A precaution before the earliest likely dawn."},
  {k: "fajr", name: "Fajr", hue: "fajr", title: "Fajr adhan (true dawn)", set: "angle", prayer: true, def: "True dawn (fajr sadiq). The time for the Fajr prayer begins."},
  {k: "fajrPrayer", name: "Fajr prayer", hue: "fajr", title: "Fajr prayer (safe time)", set: "angle", def: "A safe time to pray Fajr, after the latest likely dawn."},
  {k: "fajrEnd", name: "End of Fajr virtue", hue: "fajr", title: "End of Fajr's virtuous time", set: "angle", def: "The best (virtuous) time for Fajr ends as the dawn light spreads across the sky."},
  {k: "sunrise", name: "Sunrise", hue: "sun", title: "Sunrise", sun: true, def: "Sunrise. The last moment for the Fajr prayer."},
  {k: "dhuhr", name: "Dhuhr", hue: "zohar", title: "Dhuhr (solar noon)", prayer: true, def: "Solar noon (zawal). Dhuhr begins; Asr follows after praying Dhuhr."},
  {k: "q2", name: "2 qadam", hue: "asr", title: "2 qadam (shadow + 2/7)", def: "A shadow has grown by 2/7 of the object's height since noon. The virtuous time of Asr begins."},
  {k: "q4", name: "4 qadam", hue: "zohar", title: "4 qadam (shadow + 4/7)", def: "The shadow has grown by 4/7 of the height. The virtuous time of Dhuhr ends."},
  {k: "q6", name: "6 qadam", hue: "asr", title: "6 qadam (shadow + 6/7)", def: "The shadow has grown by 6/7 of the height. The virtuous time of Asr ends."},
  {k: "mithl", name: "Mithl", hue: "zohar", title: "Mithl (shadow + height)", def: "The shadow has grown by the full height. In intense heat, Dhuhr's virtuous time extends to just after this point."},
  {k: "mithlayn", name: "Mithlayn", hue: "asr", title: "Mithlayn (shadow + 2 x height)", def: "The shadow has grown by twice the height. In intense heat, Asr's virtuous time extends to just after this point."},
  {k: "sunset", name: "Sunset", hue: "sun", title: "Sunset", sun: true, def: "Sunset. The end of the time for Asr."},
  {k: "maghrib", name: "Maghrib", hue: "maghrib", title: "Maghrib", set: "angle", prayer: true, def: "The redness in the eastern sky has gone. Maghrib begins and the fast is opened."},
  {k: "isha", name: "Isha", hue: "esha", title: "End of Maghrib virtue, start of Isha virtue", set: "angle", prayer: true, def: "The western twilight has faded. The virtuous time of Maghrib ends and that of Isha begins."},
  {k: "travellerEnd", name: "End of Maghrib virtue (traveller)", hue: "maghrib", title: "End of Maghrib's virtuous time for a traveller", set: "night", def: "A quarter of the night has passed. For a traveller, the virtuous time of Maghrib lasts until here."},
  {k: "ishaEnd", name: "End of Isha virtue", hue: "esha", title: "End of Isha's virtuous time", set: "night", def: "A third of the night has passed. The virtuous time for Isha ends."},
  {k: "midnight", name: "Midnight", hue: "esha", title: "Midnight (half the night)", set: "night", def: "Half of the night (shar'i midnight). The end of the time for Maghrib and Isha."},
  {k: "duaEnd", name: "End of du'a time", hue: "esha", title: "First sixth of the night's second half", set: "night", def: "The end of the first sixth of the night's second half, which starts at midnight. Imam al-Sadiq, peace be upon him, said in a narration in al-Kafi that a believer who prays and supplicates in this hour is answered."}
];
const PT_SIS = {
  imsak: "Not his ruling. Fasting begins at true dawn and he requires no precautionary stop before it (Q&A 23421). A convenience only.",
  fajr: "Dawn is the white light spreading across the horizon (Minhaj 501). He gives no degree; pray only once sure it has appeared.",
  fajrPrayer: "In line with his precaution to wait while unsure that dawn has appeared. His office's calendar adds 13 minutes as a precaution, not needed if one trusts the table (Q&A 23216).",
  fajrEnd: "Fajr's virtuous time lasts until the light spreads across the sky (Minhaj 504). The 12 degrees is an astronomer's estimate.",
  sunrise: "Matches: the end of the time for Fajr.",
  dhuhr: "Matches: zawal, midway between sunrise and sunset (Minhaj 502).",
  q2: "Matches: Asr's virtuous time begins at 2/7 (Minhaj 504).",
  q4: "Matches: Dhuhr's virtuous time ends at 4/7 (Minhaj 504).",
  q6: "Matches: Asr's virtuous time ends at 6/7 (Minhaj 504).",
  mithl: "Matches: in intense heat (al-qayz) the virtuous time of Dhuhr extends to just after the mithl. He ties it to the heat, not to particular months, and Asr's virtuous time still begins at 2/7 (Minhaj 504).",
  mithlayn: "Matches: in intense heat the virtuous time of Asr extends to just after the mithlayn (Minhaj 504).",
  sunset: "Matches: the end of the time for Dhuhr and Asr. For Maghrib, see below.",
  maghrib: "Waiting for the eastern redness to go is an obligatory precaution (ihtiyat wajib) (Minhaj 502). The 4.5 degrees is an estimate.",
  isha: "Maghrib's virtue ends and Isha's begins when the western redness (shafaq) goes (Minhaj 504). He says that in places like his this falls about three quarters of an hour after Maghrib (Q&A 10410).",
  travellerEnd: "A quarter of the night, counting the night from sunset to true dawn (Minhaj 504). The Sistani preset changes this time.",
  ishaEnd: "A third of the night, counting from sunset to true dawn (Minhaj 504). The Sistani preset changes this time.",
  midnight: "Midway between sunset and true dawn (Minhaj 502). The Sistani preset changes this time. Someone delayed by sleep, forgetfulness or menstruation may still pray Maghrib and Isha until dawn.",
  duaEnd: "From a narration, not one of his rulings. The Sistani preset applies his night here too."
};
const PT_ALL = PT_COLS.map(c => c.k);
const PT_INTIME = ["imsak","fajr","fajrPrayer","fajrEnd","sunrise","dhuhr","q2","sunset","maghrib","isha","ishaEnd","midnight"];
const PT_PRAYERS = ["fajr","sunrise","dhuhr","sunset","maghrib","isha","midnight"];
const PT_LSK = "dailyAffairs.unslopped.prayertimes.v1";
const PT_DEFAULT = {method: "sistani", shown: PT_ALL.slice(), loc: {name: "Lahore", lat: 31.5204, lng: 74.3587, tz: "Asia/Karachi"}, custom: null};
function ptLoad(){ try { const v = JSON.parse(localStorage.getItem(PT_LSK)); if (v && v.loc) return Object.assign({}, PT_DEFAULT, v); } catch(e) {} return JSON.parse(JSON.stringify(PT_DEFAULT)); }
function ptSave(v){ try { localStorage.setItem(PT_LSK, JSON.stringify(v)); } catch(e) {} }
function ptLib(){ return (typeof self !== "undefined" && self.PrayerTimes) || (typeof window !== "undefined" && window.PrayerTimes); }
function ptEngine(cfg){ const P = ptLib(); if (cfg.method === "custom" && cfg.custom) return cfg.custom; return cfg.method === "tehran" ? P.TEHRAN : P.SISTANI; }
function ptZoneParts(date, tz){ const f = new Intl.DateTimeFormat("en-US", {timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit"});
  const o = {}; f.formatToParts(date).forEach(p => { o[p.type] = p.value; }); return {y: +o.year, m: +o.month, d: +o.day, h: +o.hour % 24, mi: +o.minute, s: +o.second}; }
function ptOffset(y, m, d, tz){ try { const noon = Date.UTC(y, m - 1, d, 12), p = ptZoneParts(new Date(noon), tz); return (Date.UTC(p.y, p.m - 1, p.d, p.h, p.mi, p.s) - noon) / 3600000; } catch(e) { return 5; } }
/* one day: minutes on the clock for every column, absolute minutes from that date's 00:00, and the difference from intime.ir */
function ptDay(y, m, d, cfg){
  const P = ptLib(), tz = ptOffset(y, m, d, cfg.loc.tz), E = ptEngine(cfg), t = P.compute(y, m, d, cfg.loc.lat, cfg.loc.lng, tz, E), out = {_abs: {}, _d: {}};
  PT_COLS.forEach(c => { out[c.k] = P.toMin(t[c.k]); out._abs[c.k] = isFinite(t[c.k]) ? Math.floor((t[c.k] + 0.5 / 60) * 60) : NaN; });
  if (E !== P.TEHRAN) { const b = P.compute(y, m, d, cfg.loc.lat, cfg.loc.lng, tz, P.TEHRAN);
    PT_COLS.forEach(c => { let x = out[c.k] - P.toMin(b[c.k]); if (!isFinite(x)) return; if (x > 720) x -= 1440; if (x < -720) x += 1440; if (x) out._d[c.k] = x; }); }
  return out;
}
function ptHm(mins){ const P = ptLib(); return P.hm(mins); }
function ptDelta(x){ return (x > 0 ? "+" : "−") + Math.abs(x); }
function ptFmt(y, m, d, opts){ try { return new Intl.DateTimeFormat("en-GB", Object.assign({timeZone: "UTC"}, opts)).format(new Date(Date.UTC(y, m - 1, d, 12))); } catch(e) { return ""; } }
function ptAdd(y, m, d, n){ const t = new Date(Date.UTC(y, m - 1, d + n)); return {y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate()}; }
/* live countdown: elements carry the target as absolute minutes on the pinned date; ticks every second without re-rendering */
let PT_TIMER = null;
function runCountdowns(){
  const els = document.querySelectorAll("[data-countdown]");
  if (!els.length) { if (PT_TIMER) { clearInterval(PT_TIMER); PT_TIMER = null; } return; }
  const upd = () => { document.querySelectorAll("[data-countdown]").forEach(el => {
    const tz = el.getAttribute("data-tz") || "Asia/Karachi", target = +el.getAttribute("data-countdown"); if (!isFinite(target)) return;
    const n = ptZoneParts(new Date(), tz), secs = Math.max(0, Math.round(target * 60 - (n.h * 3600 + n.mi * 60 + n.s)));
    const h = Math.floor(secs / 3600), mi = Math.floor(secs % 3600 / 60), s = secs % 60;
    el.textContent = [h, mi, s].map(v => String(v).padStart(2, "0")).join(":"); }); };
  upd(); if (!PT_TIMER) PT_TIMER = setInterval(upd, 1000);
}
/* "5h 20m 03s", "7m 12s", "40s" */
function fmtLeft(s){ s = Math.max(0, Math.round(s)); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return h ? h + "h " + m + "m " + String(x).padStart(2, "0") + "s" : m ? m + "m " + String(x).padStart(2, "0") + "s" : x + "s"; }

/* sky art for the prayer clock, one per time of day; a phase without art keeps the plain night panel */
const SKY_ART = {"sky-dawn": "sky/fajr.webp", "sky-morning": "sky/morning.webp", "sky-noon": "sky/noon.webp", "sky-afternoon": "sky/afternoon.webp", "sky-dusk": "sky/maghrib.webp", "sky-night": "sky/night.webp"};

/* ===== Live store: the same private GitHub file and token as the classic view. Every change is a small
   function; on a conflict it is replayed on the newest copy, so two devices never overwrite each other. ===== */
const Store = (() => {
  const API = "https://api.github.com", CONN_KEY = "dailyAffairs.conn.v1";
  let conn = {}; try { conn = JSON.parse(localStorage.getItem(CONN_KEY) || "{}"); } catch(e) {}
  let base = null, sha = null, etag = null, pending = [], lastSync = null, err = "", flushT = null, flushing = false, subs = [], pollT = null;
  const emit = ev => subs.forEach(f => { try { f(ev); } catch(e) { console.error(e); } });
  const enc = p => p.split("/").map(encodeURIComponent).join("/");
  const url = path => API + "/repos/" + encodeURIComponent(conn.owner) + "/" + encodeURIComponent(conn.repo) + "/contents/" + enc(path);
  const q = () => conn.branch ? "?ref=" + encodeURIComponent(conn.branch) : "";
  const hdr = x => Object.assign({Authorization: "Bearer " + conn.token, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28"}, x || {});
  const b64dec = s => new TextDecoder().decode(Uint8Array.from(atob(s.replace(/\s/g, "")), c => c.charCodeAt(0)));
  const b64enc = str => { const b = new TextEncoder().encode(str); let s = ""; for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000)); return btoa(s); };
  const httpErr = r => { const e = new Error(r.status === 401 ? "GitHub rejected the token" : r.status === 404 ? "Data file or repo not found" : r.status === 403 ? "GitHub refused (token permission or rate limit)" : "GitHub error " + r.status); e.status = r.status; return e; };
  async function fetchMain(useEtag){
    const r = await fetch(url(conn.path || "data/life.json") + q(), {headers: hdr(useEtag && etag ? {"If-None-Match": etag} : {}), cache: "no-store"});
    if (r.status === 304) return null;
    if (!r.ok) throw httpErr(r);
    const tag = r.headers.get("ETag"), j = await r.json();
    let text = j.content ? b64dec(j.content) : null;
    if (text == null) { const r2 = await fetch(url(conn.path || "data/life.json") + q(), {headers: hdr({Accept: "application/vnd.github.raw+json"}), cache: "no-store"}); if (!r2.ok) throw httpErr(r2); text = await r2.text(); }
    return {data: JSON.parse(text), sha: j.sha, etag: tag};
  }
  async function fetchStatements(){
    const path = (conn.path || "data/life.json").replace(/[^/]*$/, "statements.json");
    const r = await fetch(url(path) + q(), {headers: hdr({Accept: "application/vnd.github.raw+json"}), cache: "no-store"});
    if (!r.ok) return null; return JSON.parse(await r.text());
  }
  async function putMain(data, message){
    const body = {message, content: b64enc(JSON.stringify(data, null, 1) + "\n"), sha};
    if (conn.branch) body.branch = conn.branch;
    const r = await fetch(url(conn.path || "data/life.json"), {method: "PUT", headers: hdr({"Content-Type": "application/json"}), body: JSON.stringify(body)});
    if (r.status === 409 || r.status === 422) { const e = new Error("conflict"); e.conflict = true; throw e; }
    if (!r.ok) throw httpErr(r);
    const j = await r.json(); sha = j.content.sha; etag = null;
  }
  const clone = x => JSON.parse(JSON.stringify(x));
  function rebuild(){ S.D = clone(base); pending.forEach(p => p.fn(S.D)); }
  async function flush(){
    if (flushing || !pending.length) return; flushing = true;
    try {
      for (let attempt = 0; attempt < 4; attempt++) {
        const n = pending.length, next = clone(base); pending.slice(0, n).forEach(p => p.fn(next));
        const labels = pending.slice(0, n).map(p => p.label).join("; ");
        try { await putMain(next, labels.slice(0, 120)); base = next; pending.splice(0, n); err = ""; lastSync = new Date(); break; }
        catch (e) { if (!e.conflict || attempt === 3) throw e; const r = await fetchMain(false); base = r.data; sha = r.sha; etag = r.etag; }
      }
      rebuild(); emit({data: true, status: true});
    } catch (e) { err = e.message; emit({status: true}); }
    flushing = false; if (pending.length) flushT = setTimeout(flush, 1500);
  }
  async function pull(){
    if (!conn.token || flushing || pending.length) return;
    try { const r = await fetchMain(!!base); if (r) { base = r.data; sha = r.sha; etag = r.etag; rebuild(); emit({data: true}); } err = ""; lastSync = new Date(); emit({status: true}); }
    catch (e) { err = e.message; emit({status: true}); }
  }
  const S = {
    D: null, ST: null, get conn(){ return conn; },
    on(f){ subs.push(f); },
    async start(){
      if (!conn.token || !conn.owner || !conn.repo) { err = "Not connected. Add your token in Settings."; emit({status: true}); return; }
      await pull();
      if (S.D) { fetchStatements().then(st => { if (st) { S.ST = st; emit({st: true}); } }).catch(() => {}); }
      clearInterval(pollT); pollT = setInterval(pull, 60000);
      document.addEventListener("visibilitychange", () => { if (!document.hidden) pull(); });
    },
    change(fn, label){ if (!base) return; pending.push({fn, label}); fn(S.D); emit({status: true}); clearTimeout(flushT); flushT = setTimeout(flush, 700); },
    setConn(c){ conn = c; try { localStorage.setItem(CONN_KEY, JSON.stringify(c)); } catch(e) {} base = null; S.D = null; etag = null; S.start(); },
    status(){ if (!conn.token) return {text: "Not connected", cls: "warn"}; if (err) return {text: err + (pending.length ? ". " + pending.length + " change(s) not saved yet" : ""), cls: "bad"};
      if (pending.length) return {text: "Saving " + pending.length + " change(s)", cls: "busy"};
      return {text: "Live, synced " + (lastSync ? lastSync.toLocaleTimeString("en-GB", {hour: "2-digit", minute: "2-digit"}) : ""), cls: "ok"}; },
    errText(){ return err; }
  };
  window.addEventListener("beforeunload", e => { if (pending.length) { e.preventDefault(); e.returnValue = ""; } });
  return S;
})();

function TPL(v){return $h("div",{"class":"da almanac final rich opt-b "+($G(v,"theme")==="dark"?"":"paper-white ")+$S($G(v,"rootCls")),"data-theme":$S($G(v,"theme"))},$h("div",{"class":"scroll"},$h("div",{"class":"shell"},$h("aside",{"class":"side rail","aria-label":"Menu"},$h("div",{"class":"side-in"},$h("div",{"class":"brand"},$h("b",{},"Daily Affairs"),$h("span",{"class":"ur","lang":"ur","dir":"rtl"},"روزمرہ امور")),$h("button",{"class":"btn pri","type":"button","onClick":$G(v,"openAdd")},$h("svg",{"class":"ic","viewBox":"0 0 24 24","aria-hidden":"true"},$h("path",{"d":"M5 12h14"}),$h("path",{"d":"M12 5v14"})),"Add spending"),$h("nav",{"class":"nav","aria-label":"Sections"},$h("button",{"class":"navbtn "+$S($G(v,"nav.today")),"type":"button","onClick":$G(v,"go.today")},$h("svg",{"class":"ic","viewBox":"0 0 24 24","aria-hidden":"true"},$h("rect",{"width":"18","height":"18","x":"3","y":"4","rx":"2"}),$h("path",{"d":"M16 2v4"}),$h("path",{"d":"M8 2v4"}),$h("path",{"d":"M3 10h18"})),"Today"),$h("button",{"class":"navbtn "+$S($G(v,"nav.prayers")),"type":"button","onClick":$G(v,"go.prayers")},$h("svg",{"class":"ic","viewBox":"0 0 24 24","aria-hidden":"true"},$h("path",{"d":"M12 2v8"}),$h("path",{"d":"m4.93 10.93 1.41 1.41"}),$h("path",{"d":"M2 18h2"}),$h("path",{"d":"M20 18h2"}),$h("path",{"d":"m19.07 10.93-1.41 1.41"}),$h("path",{"d":"M22 22H2"}),$h("path",{"d":"m8 6 4-4 4 4"}),$h("path",{"d":"M16 18a4 4 0 0 0-8 0"})),"Prayer times",$h("span",{"class":"ur","lang":"ur","dir":"rtl"},"اوقاتِ نماز")),$h("button",{"class":"navbtn "+$S($G(v,"nav.planner")),"type":"button","onClick":$G(v,"go.planner")},$h("svg",{"class":"ic","viewBox":"0 0 24 24","aria-hidden":"true"},$h("path",{"d":"M21 4h-7"}),$h("path",{"d":"M10 4H3"}),$h("path",{"d":"M21 12h-9"}),$h("path",{"d":"M8 12H3"}),$h("path",{"d":"M21 20h-5"}),$h("path",{"d":"M12 20H3"}),$h("path",{"d":"M14 2v4"}),$h("path",{"d":"M8 10v4"}),$h("path",{"d":"M16 18v4"})),"Planners"),$h("button",{"class":"navbtn "+$S($G(v,"nav.money")),"type":"button","onClick":$G(v,"go.money")},$h("svg",{"class":"ic","viewBox":"0 0 24 24","aria-hidden":"true"},$h("path",{"d":"M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"}),$h("path",{"d":"M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"})),"Money"),$h("button",{"class":"navbtn "+$S($G(v,"nav.accounts")),"type":"button","onClick":$G(v,"go.accounts")},$h("svg",{"class":"ic","viewBox":"0 0 24 24","aria-hidden":"true"},$h("path",{"d":"M3 22h18"}),$h("path",{"d":"M6 18v-7"}),$h("path",{"d":"M10 18v-7"}),$h("path",{"d":"M14 18v-7"}),$h("path",{"d":"M18 18v-7"}),$h("path",{"d":"M12 2l8 5H4z"})),"Accounts"),$h("button",{"class":"navbtn "+$S($G(v,"nav.khums")),"type":"button","onClick":$G(v,"go.khums")},$h("svg",{"class":"ic","viewBox":"0 0 24 24","aria-hidden":"true"},$h("path",{"d":"m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"}),$h("path",{"d":"m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"}),$h("path",{"d":"M7 21h10"}),$h("path",{"d":"M12 3v18"}),$h("path",{"d":"M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"})),"Khums",$h("span",{"class":"ur","lang":"ur","dir":"rtl"},"خمس")),$h("button",{"class":"navbtn "+$S($G(v,"nav.wajibat")),"type":"button","onClick":$G(v,"go.wajibat")},$h("svg",{"class":"ic","viewBox":"0 0 24 24","aria-hidden":"true"},$h("path",{"d":"m3 17 2 2 4-4"}),$h("path",{"d":"m3 7 2 2 4-4"}),$h("path",{"d":"M13 6h8"}),$h("path",{"d":"M13 12h8"}),$h("path",{"d":"M13 18h8"})),"Wajibat",$h("span",{"class":"ur","lang":"ur","dir":"rtl"},"واجبات")),$h("button",{"class":"navbtn "+$S($G(v,"nav.wasiyat")),"type":"button","onClick":$G(v,"go.wasiyat")},$h("svg",{"class":"ic","viewBox":"0 0 24 24","aria-hidden":"true"},$h("path",{"d":"M15 12h-5"}),$h("path",{"d":"M15 8h-5"}),$h("path",{"d":"M19 17V5a2 2 0 0 0-2-2H4"}),$h("path",{"d":"M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3"})),"Wasiyat",$h("span",{"class":"ur","lang":"ur","dir":"rtl"},"وصیت")),$h("button",{"class":"navbtn "+$S($G(v,"nav.settings")),"type":"button","onClick":$G(v,"go.settings")},$h("svg",{"class":"ic","viewBox":"0 0 24 24","aria-hidden":"true"},$h("circle",{"cx":"12","cy":"12","r":"3"}),$h("path",{"d":"M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"})),"Settings")),$h("div",{"class":"side-foot"},$h("p",{},$S($G(v,"sync.text")))))),$h("main",{"class":"main"},$h("div",{"class":"mtop"},$h("div",{"class":"brand"},$h("b",{},"Daily Affairs"),$h("span",{"class":"ur","lang":"ur","dir":"rtl"},"روزمرہ امور")),$h("button",{"class":"iconbtn","type":"button","aria-label":"Open the menu","onClick":$G(v,"openMenu")},$h("svg",{"class":"ic","viewBox":"0 0 24 24","aria-hidden":"true"},$h("path",{"d":"M4 6h16"}),$h("path",{"d":"M4 12h16"}),$h("path",{"d":"M4 18h16"})))),($T($G(v,"loading"))?[$h("div",{"class":"page"},$h("p",{"class":"sub"},"Loading your data"))]:null),($T($G(v,"loadErr"))?[$h("div",{"class":"page"},$h("div",{"class":"banner warn"},$S($G(v,"err"))))]:null),($T($G(v,"tabs.today"))?[$h("div",{"class":"page pg-today t4"},$h("h1",{"class":"sr"},"Today"),$h("div",{"class":"t5"},$h("section",{"class":"t5-band","aria-label":"Today"},$h("div",{"class":"t5-date"},$h("div",{"class":"mast-date"},$h("span",{"class":"mast-day"},$S($G(v,"al.day"))),$h("span",{"class":"mast-meta"},$h("b",{},$S($G(v,"al.weekday"))),$h("span",{},$S($G(v,"al.monthYear"))),$h("span",{"class":"hijri","title":$S($G(v,"al.hijriNote"))},$S($G(v,"al.hijri"))),$h("span",{"class":"ur hijri-ur","lang":"ur","dir":"rtl"},$S($G(v,"al.hijriUr")))))),$h("div",{"class":"t5-safe"},$h("div",{"class":"mast-safe"},$h("div",{"class":"lbl"},"Safe to spend today"),$h("div",{"class":"mast-fig"},$h("span",{"class":"cur"},"PKR"),$h("span",{"class":"total","data-count":$S($G(v,"td.safe"))})),$h("div",{"class":"safe-line"},$h("span",{},$h("b",{"data-count":$S($G(v,"td.left"))})," left in the cycle"),$h("span",{},$h("b",{"data-count":$S($G(v,"td.spentToday"))})," spent today"),$h("span",{"class":$S($G(v,"td.statusCls"))},$S($G(v,"td.status")))),$h("p",{"class":"cap"},"Cycle day "+$S($G(v,"td.cycleDay"))+" of "+$S($G(v,"td.cycleLen"))+", pay on "+$S($G(v,"td.payOn"))))),$h("div",{"class":"t5-clockwrap mx-neon "+$S($G(v,"tk.lvl"))+" "+$S($G(v,"tk.hue"))},$h("div",{"class":"t5-clock mx-beam "+$S($G(v,"tk.lvl"))+" "+$S($G(v,"tk.hue"))+" "+$S($G(v,"tk.sky")),"role":"timer","aria-label":$S($G(v,"tk.aria"))},$h("span",{"class":"t5-sun","aria-hidden":"true","style":"left:"+$S($G(v,"tk.sunX"))+"%;bottom:"+$S($G(v,"tk.sunY"))+"%"}),$h("span",{"class":"mx-meteors","aria-hidden":"true"},$h("i",{}),$h("i",{}),$h("i",{}),$h("i",{}),$h("i",{}),$h("i",{})),$h("div",{"class":"t5-kick"},$h("span",{"class":"mx-ripple","aria-hidden":"true"},$h("i",{}),$h("i",{}),$h("i",{}),$h("span",{"class":"t5-kic"},($T($G(v,"tk.ic.urgent"))?[$h("svg",{"class":"ic","viewBox":"0 0 24 24","aria-hidden":"true"},$h("path",{"d":"M5 13a7 7 0 1 0 14 0a7 7 0 1 0 -14 0"}),$h("path",{"d":"M12 10l0 3l2 0"}),$h("path",{"d":"M7 4l-2.75 2"}),$h("path",{"d":"M17 4l2.75 2"}))]:null),($T($G(v,"tk.ic.calm"))?[$h("svg",{"class":"ic","viewBox":"0 0 24 24","aria-hidden":"true"},$h("path",{"d":"M6.5 7h11"}),$h("path",{"d":"M6 20v-2a6 6 0 1 1 12 0v2a1 1 0 0 1 -1 1h-10a1 1 0 0 1 -1 -1"}),$h("path",{"d":"M6 4v2a6 6 0 1 0 12 0v-2a1 1 0 0 0 -1 -1h-10a1 1 0 0 0 -1 1"}))]:null),($T($G(v,"tk.ic.rest"))?[$h("svg",{"class":"ic","viewBox":"0 0 24 24","aria-hidden":"true"},$h("path",{"d":"M3 21h7v-2a2 2 0 1 1 4 0v2h7"}),$h("path",{"d":"M4 21v-10"}),$h("path",{"d":"M20 21v-10"}),$h("path",{"d":"M4 16h3v-3h10v3h3"}),$h("path",{"d":"M17 13a5 5 0 0 0 -10 0"}),$h("path",{"d":"M12 2a2 2 0 1 0 2 2"}),$h("path",{"d":"M12 6v2"}))]:null))),$h("span",{},$S($G(v,"tk.kicker")))),$h("p",{"class":"t5-say"},($T($G(v,"tk.pre"))?[$h("span",{"class":"t5-pre"},$S($G(v,"tk.pre")))]:null),$h("b",{"class":"t5-cd "+$S($G(v,"tk.cdCls")),"data-t2":$S($G(v,"tk.target"))},$h("span",{"class":"cu cu-h"},$h("span",{"data-u":"h"},$S($G(v,"tk.ch"))),$h("i",{},"h")),$h("span",{"class":"cu"},$h("span",{"data-u":"m"},$S($G(v,"tk.cm"))),$h("i",{},"m")),$h("span",{"class":"cu"},$h("span",{"data-u":"s"},$S($G(v,"tk.cs"))),$h("i",{},"s"))),($T($G(v,"tk.post"))?[$h("span",{"class":"t5-post"},$S($G(v,"tk.post")))]:null)),$h("div",{"class":"t5-fuse","aria-hidden":"true"},$h("i",{"style":"width:"+$S($G(v,"tk.rem"))+"%"})),$h("p",{"class":"t5-sub"},$S($G(v,"tk.sub"))),$h("div",{"class":"t5-wins"},$A($G(v,"tk.wins")).map(function(it,ix){var v1=Object.create(v);v1["x"]=it;return [$h("div",{"class":"t5-win "+$S($G(v1,"x.cls"))},$h("span",{"class":"mx-shine","aria-hidden":"true"}),$h("span",{"class":"t5-wn"},$h("span",{"class":"t5-wic"},($T($G(v1,"x.ic.fajr"))?[$h("svg",{"class":"ic","viewBox":"0 0 24 24","aria-hidden":"true"},$h("path",{"d":"M3 17h1m16 0h1m-15.4 -6.4l.7 .7m12.1 -.7l-.7 .7m-9.7 5.7a4 4 0 0 1 8 0"}),$h("path",{"d":"M3 21l18 0"}),$h("path",{"d":"M12 9v-6l3 3m-6 0l3 -3"}))]:null),($T($G(v1,"x.ic.zoharain"))?[$h("svg",{"class":"ic","viewBox":"0 0 24 24","aria-hidden":"true"},$h("path",{"d":"M8 12a4 4 0 1 0 8 0a4 4 0 1 0 -8 0"}),$h("path",{"d":"M3 12h1m8 -9v1m8 8h1m-9 8v1m-6.4 -15.4l.7 .7m12.1 -.7l-.7 .7m0 11.4l.7 .7m-12.1 -.7l-.7 .7"}))]:null),($T($G(v1,"x.ic.maghribain"))?[$h("svg",{"class":"ic","viewBox":"0 0 24 24","aria-hidden":"true"},$h("path",{"d":"M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313 -12.454l0 .008"}),$h("path",{"d":"M17 4a2 2 0 0 0 2 2a2 2 0 0 0 -2 2a2 2 0 0 0 -2 -2a2 2 0 0 0 2 -2"}),$h("path",{"d":"M19 11h2m-1 -1v2"}))]:null)),$h("b",{},$S($G(v1,"x.en"))),$h("span",{"class":"ur","lang":"ur","dir":"rtl"},$S($G(v1,"x.ur")))),$h("span",{"class":"t5-wt"},$h("span",{},$S($G(v1,"x.start"))),$h("span",{"class":"t5-arrow","aria-hidden":"true"}),$h("span",{"class":"t5-q"},$S($G(v1,"x.end")))),$h("span",{"class":"t5-ws"},$S($G(v1,"x.state"))),$h("span",{"class":"t5-wbar","aria-hidden":"true"},$h("i",{"style":"width:"+$S($G(v1,"x.done"))+"%"})))];}))))),$h("div",{"class":"t7-grid"},$h("div",{"class":"t7-col t7-left"},$h("section",{"class":"card ml-card","aria-labelledby":"mlH"},$h("div",{"class":"card-h"},$h("h2",{"id":"mlH"},"Meals"),$h("span",{"class":"aside ml-step"},$h("button",{"type":"button","class":"iconbtn","aria-label":"Previous day","disabled":$B($G(v,"ml.noPrev")),"onClick":$G(v,"ml.prev")},$h("svg",{"class":"ic","viewBox":"0 0 24 24","aria-hidden":"true"},$h("path",{"d":"m15 18-6-6 6-6"}))),$h("span",{"class":"ml-day","aria-live":"polite"},$S($G(v,"ml.dayLabel"))),$h("button",{"type":"button","class":"iconbtn","aria-label":"Next day","disabled":$B($G(v,"ml.noNext")),"onClick":$G(v,"ml.next")},$h("svg",{"class":"ic","viewBox":"0 0 24 24","aria-hidden":"true"},$h("path",{"d":"m9 18 6-6-6-6"}))))),($T($G(v,"ml.notToday"))?[$h("button",{"type":"button","class":"linkbtn ml-back","onClick":$G(v,"ml.toToday")},"Back to today")]:null),$h("div",{"class":"ml-boxes"},$A($G(v,"ml.boxes")).map(function(it,ix){var v1=Object.create(v);v1["m"]=it;return [($T($G(v1,"m.empty"))?[$h("button",{"type":"button","class":"ml-box empty","aria-label":$S($G(v1,"m.aria")),"onClick":$G(v1,"m.open")},$h("span",{"class":"ml-k"},$S($G(v1,"m.name"))),$h("span",{"class":"ml-none"},"Nothing logged"),$h("span",{"class":"ml-cap"},$S($G(v1,"m.upTo"))),($T($G(v1,"m.refundedOnly"))?[$h("span",{"class":"ml-cap"},"1 order refunded in full")]:null),$h("span",{"class":"ml-plus"},$h("svg",{"class":"ic","viewBox":"0 0 24 24","aria-hidden":"true"},$h("path",{"d":"M5 12h14"}),$h("path",{"d":"M12 5v14"}))))]:null),($T($G(v1,"m.logged"))?[$h("div",{"class":"ml-box logged "+$S($G(v1,"m.cls"))},$h("span",{"class":"ml-k"},$S($G(v1,"m.name"))),$A($G(v1,"m.orders")).map(function(it,ix){var v2=Object.create(v1);v2["o"]=it;return [$h("div",{"class":"ml-o"},$h("b",{},$S($G(v2,"o.vendor"))),($T($G(v2,"o.dishes"))?[$h("span",{"class":"ml-d"},$S($G(v2,"o.dishes")))]:null),($T($G(v2,"o.multi"))?[$h("span",{"class":"ml-d"},"PKR "+$S($G(v2,"o.pkr")))]:null))];}),($T($G(v1,"m.more"))?[$h("span",{"class":"ml-d"},$S($G(v1,"m.more")))]:null),$h("span",{"class":"ml-cost"},"PKR "+$S($G(v1,"m.mine"))),$A($G(v1,"m.lines")).map(function(it,ix){var v2=Object.create(v1);v2["l"]=it;return [$h("span",{"class":"ml-line"},$S($G(v2,"l.t")))];}),($T($G(v1,"m.credit"))?[$h("span",{"class":"cat-tag t-transport"},"Paid from Foodpanda credit")]:null),$h("span",{"class":"ml-capline "+$S($G(v1,"m.capCls"))},$S($G(v1,"m.capLine"))),$h("span",{"class":"ml-meter","aria-hidden":"true"},$h("i",{"style":"width:"+$S($G(v1,"m.fill"))+"%"})),$h("div",{"class":"ml-acts"},($T($G(v1,"m.rate.has"))?[$h("button",{"type":"button","class":"rate-chip","onClick":$G(v1,"m.rate.open")},($T($G(v1,"m.rate.label"))?[$h("b",{"class":$S($G(v1,"m.rate.cls"))},$S($G(v1,"m.rate.label")))]:null),($T($G(v1,"m.rate.review"))?[$h("span",{},"\""+$S($G(v1,"m.rate.review"))+"\"")]:null))]:null),($T($G(v1,"m.rate.none"))?[$h("button",{"type":"button","class":"linkbtn","onClick":$G(v1,"m.rate.open")},"How was it?")]:null),$h("button",{"type":"button","class":"linkbtn ml-another","onClick":$G(v1,"m.open")},$h("svg",{"class":"ic","viewBox":"0 0 24 24","aria-hidden":"true"},$h("path",{"d":"M5 12h14"}),$h("path",{"d":"M12 5v14"})),"Add another")))]:null)];})),($T($G(v,"ml.foot"))?[$h("p",{"class":"cap"},$S($G(v,"ml.foot")))]:null)),$h("section",{"class":"card cal-card","aria-label":"This pay cycle as a calendar"},$h("div",{"class":"card-h"},$h("h2",{},"This pay cycle"),$h("span",{"class":"aside"},$h("span",{"class":"circ-key"}),"Circled: pay day and bills you pay")),$h("div",{"class":"cal-grid"},$A($G(v,"al.wk")).map(function(it,ix){var v1=Object.create(v);v1["w"]=it;return [$h("span",{"class":"cal-wk"},$S($G(v1,"w")))];}),$A($G(v,"al.cells")).map(function(it,ix){var v1=Object.create(v);v1["c"]=it;return [$h("button",{"type":"button","class":"cal "+$S($G(v1,"c.cls")),"title":$S($G(v1,"c.title")),"aria-label":$S($G(v1,"c.title")),"onClick":$G(v1,"c.pick")},$h("span",{"class":"cal-n"},$S($G(v1,"c.n"))),$h("span",{"class":"cal-amt "+$S($G(v1,"c.over"))},$S($G(v1,"c.amt"))),$h("span",{"class":"cal-bar"},$h("i",{"class":"grow-x","style":"width:"+$S($G(v1,"c.fill"))+"%"})))];})),$h("p",{"class":"cap"},"Each day shows what was spent. The bar fills against PKR "+$S($G(v,"al.perPlan"))+", the opening balance spread evenly"))),$h("div",{"class":"t7-col t7-mid"},$h("section",{"class":"card qd-card mx-beam soft","aria-labelledby":"qdH"},$h("div",{"class":"card-h"},$h("h2",{"id":"qdH"},"Qaza ",$h("span",{"class":"ur","lang":"ur","dir":"rtl"},"قضا نمازیں")),$h("span",{"class":"aside"},$h("b",{"class":"qd-total","data-count":$S($G(v,"qd.total"))})," to make up")),$h("div",{"class":"qd-mix","aria-label":$S($G(v,"qd.mixAria"))},$A($G(v,"qd.mix")).map(function(it,ix){var v1=Object.create(v);v1["m"]=it;return [$h("i",{"class":"h-"+$S($G(v1,"m.k")),"style":"flex:"+$S($G(v1,"m.n")),"title":$S($G(v1,"m.t"))})];})),$h("div",{"class":"qd-dials"},$A($G(v,"qd.rows")).map(function(it,ix){var v1=Object.create(v);v1["q"]=it;return [$h("div",{"class":"qd h-"+$S($G(v1,"q.hk"))+" "+$S($G(v1,"q.cls"))},$h("div",{"class":"qd-face"},$h("svg",{"class":"qd-ring","viewBox":"0 0 100 100","aria-hidden":"true","data-svg":$S($G(v1,"q.ring"))}),$h("span",{"class":"qd-mid"},$h("span",{"class":"qd-ic"},($T($G(v1,"q.ic.fajr"))?[$h("svg",{"class":"ic","viewBox":"0 0 24 24","aria-hidden":"true"},$h("path",{"d":"M3 17h1m16 0h1m-15.4 -6.4l.7 .7m12.1 -.7l-.7 .7m-9.7 5.7a4 4 0 0 1 8 0"}),$h("path",{"d":"M3 21l18 0"}),$h("path",{"d":"M12 9v-6l3 3m-6 0l3 -3"}))]:null),($T($G(v1,"q.ic.zohar"))?[$h("svg",{"class":"ic","viewBox":"0 0 24 24","aria-hidden":"true"},$h("path",{"d":"M8 12a4 4 0 1 0 8 0a4 4 0 1 0 -8 0"}),$h("path",{"d":"M3 12h1m8 -9v1m8 8h1m-9 8v1m-6.4 -15.4l.7 .7m12.1 -.7l-.7 .7m0 11.4l.7 .7m-12.1 -.7l-.7 .7"}))]:null),($T($G(v1,"q.ic.asr"))?[$h("svg",{"class":"ic","viewBox":"0 0 24 24","aria-hidden":"true"},$h("path",{"d":"M8 12a4 4 0 1 0 8 0a4 4 0 1 0 -8 0"}),$h("path",{"d":"M4 12h.01"}),$h("path",{"d":"M12 4v.01"}),$h("path",{"d":"M20 12h.01"}),$h("path",{"d":"M12 20v.01"}),$h("path",{"d":"M6.31 6.31l-.01 -.01"}),$h("path",{"d":"M17.71 6.31l-.01 -.01"}),$h("path",{"d":"M17.7 17.7l.01 .01"}),$h("path",{"d":"M6.3 17.7l.01 .01"}))]:null),($T($G(v1,"q.ic.maghrib"))?[$h("svg",{"class":"ic","viewBox":"0 0 24 24","aria-hidden":"true"},$h("path",{"d":"M3 13h1"}),$h("path",{"d":"M20 13h1"}),$h("path",{"d":"M5.6 6.6l.7 .7"}),$h("path",{"d":"M18.4 6.6l-.7 .7"}),$h("path",{"d":"M8 13a4 4 0 1 1 8 0"}),$h("path",{"d":"M3 17h18"}),$h("path",{"d":"M7 20h5"}),$h("path",{"d":"M16 20h1"}),$h("path",{"d":"M12 5v-1"}))]:null),($T($G(v1,"q.ic.esha"))?[$h("svg",{"class":"ic","viewBox":"0 0 24 24","aria-hidden":"true"},$h("path",{"d":"M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313 -12.454l0 .008"}),$h("path",{"d":"M17 4a2 2 0 0 0 2 2a2 2 0 0 0 -2 2a2 2 0 0 0 -2 -2a2 2 0 0 0 2 -2"}),$h("path",{"d":"M19 11h2m-1 -1v2"}))]:null)),$h("span",{"class":"qd-n","data-count":$S($G(v1,"q.n"))}))),$h("span",{"class":"qd-name"},$h("b",{},$S($G(v1,"q.en"))),$h("span",{"class":"ur","lang":"ur","dir":"rtl"},$S($G(v1,"q.ur")))),($T($G(v1,"q.today"))?[$h("span",{"class":"qd-today"},$S($G(v1,"q.today")))]:null),$h("div",{"class":"qd-acts"},$h("button",{"type":"button","class":"qd-b qd-made "+$S($G(v1,"q.pulse")),"aria-disabled":$S($G(v1,"q.madeDis")),"aria-label":$S($G(v1,"q.madeAria")),"title":"Made up: one qaza prayed","onClick":$G(v1,"q.made")},$h("svg",{"class":"ic","viewBox":"0 0 24 24","aria-hidden":"true"},$h("path",{"d":"M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0"}),$h("path",{"d":"M9 12l2 2l4 -4"})),$h("span",{},"Made up")),$h("button",{"type":"button","class":"qd-b qd-miss","aria-label":$S($G(v1,"q.missAria")),"title":"Missed: add one qaza","onClick":$G(v1,"q.miss")},$h("svg",{"class":"ic","viewBox":"0 0 24 24","aria-hidden":"true"},$h("path",{"d":"M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0"}),$h("path",{"d":"M9 12h6"}),$h("path",{"d":"M12 9v6"})),$h("span",{},"Missed"))))];})),($T($G(v,"pq.undo"))?[$h("div",{"class":"undo-bar","role":"status"},$h("span",{},$S($G(v,"pq.undo"))),$h("button",{"class":"btn sm","type":"button","onClick":$G(v,"pq.undoIt")},"Undo"))]:null),$h("div",{"class":"qd-log"},$h("span",{"class":"lbl"},"Made up, last 14 days"),$h("div",{"class":"qd-days"},$A($G(v,"qd.days")).map(function(it,ix){var v1=Object.create(v);v1["d"]=it;return [$h("span",{"class":"qd-day "+$S($G(v1,"d.cls")),"title":$S($G(v1,"d.t"))},$h("i",{"style":"height:"+$S($G(v1,"d.h"))+"%"}),$h("small",{},$S($G(v1,"d.l"))))];})),$h("span",{"class":"qd-streak"},($T($G(v,"qd.hot"))?[$h("svg",{"class":"ic","viewBox":"0 0 24 24","aria-hidden":"true"},$h("path",{"d":"M12 10.941c2.333 -3.308 .167 -7.823 -1 -8.941c0 3.395 -2.235 5.299 -3.667 6.706c-1.43 1.408 -2.333 3.294 -2.333 5.588c0 3.704 3.134 6.706 7 6.706c3.866 0 7 -3.002 7 -6.706c0 -1.712 -1.232 -4.403 -2.333 -5.588c-2.084 3.353 -3.257 3.353 -4.667 2.235"}))]:null),$S($G(v,"qd.streak")))),$h("details",{"class":"pq-qasr more"},$h("summary",{},$h("svg",{"class":"ic","viewBox":"0 0 24 24","aria-hidden":"true"},$h("path",{"d":"m9 18 6-6-6-6"})),$h("span",{},"Qasr, two rakat ",$h("span",{"class":"ur","lang":"ur","dir":"rtl"},"قصر")),$h("span",{"class":"pq-qsum"},$S($G(v,"pq.qasrSummary")))),$h("div",{"class":"pq-rows"},$A($G(v,"pq.qasr")).map(function(it,ix){var v1=Object.create(v);v1["r"]=it;return [$h("div",{"class":"pq-row h-"+$S($G(v1,"r.hk"))+" "+$S($G(v1,"r.state"))},$h("span",{"class":"pq-bar","aria-hidden":"true"}),$h("span",{"class":"pq-ic"},($T($G(v1,"r.ic.fajr"))?[$h("svg",{"class":"ic","viewBox":"0 0 24 24","aria-hidden":"true"},$h("path",{"d":"M12 2v8"}),$h("path",{"d":"m4.93 10.93 1.41 1.41"}),$h("path",{"d":"M2 18h2"}),$h("path",{"d":"M20 18h2"}),$h("path",{"d":"m19.07 10.93-1.41 1.41"}),$h("path",{"d":"M22 22H2"}),$h("path",{"d":"m8 6 4-4 4 4"}),$h("path",{"d":"M16 18a4 4 0 0 0-8 0"}))]:null),($T($G(v1,"r.ic.zohar"))?[$h("svg",{"class":"ic","viewBox":"0 0 24 24","aria-hidden":"true"},$h("circle",{"cx":"12","cy":"12","r":"4"}),$h("path",{"d":"M12 2v2"}),$h("path",{"d":"M12 20v2"}),$h("path",{"d":"m4.93 4.93 1.41 1.41"}),$h("path",{"d":"m17.66 17.66 1.41 1.41"}),$h("path",{"d":"M2 12h2"}),$h("path",{"d":"M20 12h2"}),$h("path",{"d":"m6.34 17.66-1.41 1.41"}),$h("path",{"d":"m19.07 4.93-1.41 1.41"}))]:null),($T($G(v1,"r.ic.asr"))?[$h("svg",{"class":"ic","viewBox":"0 0 24 24","aria-hidden":"true"},$h("circle",{"cx":"12","cy":"12","r":"4"}),$h("path",{"d":"M12 4h.01"}),$h("path",{"d":"M20 12h.01"}),$h("path",{"d":"M12 20h.01"}),$h("path",{"d":"M4 12h.01"}),$h("path",{"d":"M17.66 6.34h.01"}),$h("path",{"d":"M17.66 17.66h.01"}),$h("path",{"d":"M6.34 17.66h.01"}),$h("path",{"d":"M6.34 6.34h.01"}))]:null),($T($G(v1,"r.ic.maghrib"))?[$h("svg",{"class":"ic","viewBox":"0 0 24 24","aria-hidden":"true"},$h("path",{"d":"M12 10V2"}),$h("path",{"d":"m4.93 10.93 1.41 1.41"}),$h("path",{"d":"M2 18h2"}),$h("path",{"d":"M20 18h2"}),$h("path",{"d":"m19.07 10.93-1.41 1.41"}),$h("path",{"d":"M22 22H2"}),$h("path",{"d":"m16 6-4 4-4-4"}),$h("path",{"d":"M16 18a4 4 0 0 0-8 0"}))]:null),($T($G(v1,"r.ic.esha"))?[$h("svg",{"class":"ic","viewBox":"0 0 24 24","aria-hidden":"true"},$h("path",{"d":"M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"}))]:null)),$h("span",{"class":"pq-nm"},$h("span",{"class":"pq-nm1"},$h("b",{},$S($G(v1,"r.en"))),$h("span",{"class":"ur","lang":"ur","dir":"rtl"},$S($G(v1,"r.ur"))),($T($G(v1,"r.tag"))?[$h("span",{"class":"pq-tag"},$S($G(v1,"r.tag")))]:null)),($T($G(v1,"r.chips"))?[$h("span",{"class":"pq-chips"},$S($G(v1,"r.chips")))]:null)),$h("span",{"class":"pq-time pq-rakat"},"2 rakat"),$h("span",{"class":"pq-n "+$S($G(v1,"r.nCls")),"aria-label":$S($G(v1,"r.nLabel"))},$S($G(v1,"r.n"))),$h("button",{"type":"button","class":"pq-btn pq-miss","aria-label":$S($G(v1,"r.missAria")),"onClick":$G(v1,"r.miss")},$h("svg",{"class":"ic","viewBox":"0 0 24 24","aria-hidden":"true"},$h("path",{"d":"M5 12h14"}),$h("path",{"d":"M12 5v14"})),$h("span",{},"Missed")),$h("button",{"type":"button","class":"pq-btn pq-made","aria-disabled":$S($G(v1,"r.madeDis")),"aria-label":$S($G(v1,"r.madeAria")),"onClick":$G(v1,"r.made")},$h("svg",{"class":"ic","viewBox":"0 0 24 24","aria-hidden":"true"},$h("path",{"d":"M20 6 9 17l-5-5"})),$h("span",{},"Made up")))];}))),$h("p",{"class":"pq-foot"},"At "+$S($G(v,"td.qPace"))+" a prayer a day, all done by ",$h("b",{},$S($G(v,"td.qDone"))),". ",$h("button",{"type":"button","class":"linkbtn","onClick":$G(v,"go.planner")},"Change pace")))),$h("div",{"class":"t7-col t7-right"},$h("section",{"class":"card nd-card","aria-labelledby":"ndH"},$h("div",{"class":"card-h"},$h("h2",{"id":"ndH"},"Next 30 days")),($T($G(v,"td.hasOpen"))?[$h("div",{"class":"lbl"},"Open now"),$h("div",{"class":"nd-open"},$A($G(v,"td.openNow")).map(function(it,ix){var v1=Object.create(v);v1["o"]=it;return [$h("button",{"type":"button","class":"nd-o","onClick":$G(v1,"o.go")},$h("span",{"class":"nd-sq","aria-hidden":"true"}),$h("span",{},$h("b",{},$S($G(v1,"o.t"))),$h("span",{"class":"s"},$S($G(v1,"o.s")))))];}))]:null),$h("ol",{"class":"timeline datelist"},$A($G(v,"td.timeline")).map(function(it,ix){var v1=Object.create(v);v1["x"]=it;return [$h("li",{},$h("span",{"class":"dmark "+$S($G(v1,"x.mark"))},$h("b",{},$S($G(v1,"x.dn"))),$h("span",{},$S($G(v1,"x.wd"))+" "+$S($G(v1,"x.mon")))),$h("div",{},$h("b",{},$S($G(v1,"x.t"))),$h("div",{"class":"s"},$S($G(v1,"x.s")))))];})))))))]:null),($T($G(v,"tabs.prayers"))?[$h("div",{"class":"page pg-prayers"},$h("div",{"class":"head"},$h("div",{},$h("h1",{},"Prayer times ",$h("span",{"class":"ur","lang":"ur","dir":"rtl"},"اوقاتِ نماز")),$h("p",{"class":"meta"},$S($G(v,"pt.place"))+" · "+$S($G(v,"pt.coords"))+" · "+$S($G(v,"pt.methodName")))),$h("div",{"class":"pt-dates"},$h("span",{},$h("b",{},$S($G(v,"pt.greg")))),$h("span",{},"Solar Hijri ",$h("b",{},$S($G(v,"pt.solar")))),$h("span",{},"Hijri ",$h("b",{},$S($G(v,"pt.hijri")))))),$h("section",{"class":"card pt-board"},$h("div",{"class":"card-h"},$h("h2",{},"Today ",$h("span",{"class":"mut"},$S($G(v,"pt.greg")))),$h("span",{"class":"aside"},$S($G(v,"pt.nowText"))+". Next: ",$h("b",{},$S($G(v,"pt.nextName")))," "+$S($G(v,"pt.nextAt")))),$h("div",{"class":"pt-groups"},$A($G(v,"pt.groups")).map(function(it,ix){var v1=Object.create(v);v1["g"]=it;return [$h("div",{"class":"pt-group "+$S($G(v1,"g.cls"))},$h("div",{"class":"pt-gh"},$h("b",{},$S($G(v1,"g.en"))),$h("span",{"class":"ur","lang":"ur","dir":"rtl"},$S($G(v1,"g.ur")))),$h("ol",{"class":"pt-kts"},$A($G(v1,"g.rows")).map(function(it,ix){var v2=Object.create(v1);v2["r"]=it;return [$h("li",{"class":$S($G(v2,"r.cls")),"title":$S($G(v2,"r.title"))},$h("span",{"class":"kt-time"},$S($G(v2,"r.time")),($T($G(v2,"r.hasD"))?[$h("span",{"class":"pt-dl","title":$S($G(v2,"r.dTitle"))},$S($G(v2,"r.d")))]:null)),$h("span",{"class":"kt-l"},$h("b",{},$S($G(v2,"r.label"))),($T($G(v2,"r.sub"))?[$h("span",{},$S($G(v2,"r.sub")))]:null)))];})))];})),($T($G(v,"pt.hasMissing"))?[$h("p",{"class":"cap"},"Shown as n/a today: "+$S($G(v,"pt.missing"))+". Ayatullah al-Sistani has separate rulings for places where the sun does not go far enough below the horizon")]:null),$h("div",{"class":"pt-extras"},$h("span",{"class":"lbl"},"More times"),$h("div",{"class":"cats pt-cols","role":"group","aria-label":"Show more times"},$A($G(v,"pt.cols")).map(function(it,ix){var v1=Object.create(v);v1["c"]=it;return [$h("button",{"type":"button","class":$S($G(v1,"c.cls")),"aria-pressed":$S($G(v1,"c.pressed")),"onClick":$G(v1,"c.pick")},$S($G(v1,"c.label")))];})),$h("div",{"class":"pt-presets"},$h("button",{"class":"btn sm","type":"button","onClick":$G(v,"pt.showAll")},"Show all"),$h("button",{"class":"btn sm","type":"button","onClick":$G(v,"pt.showIntime")},"Add intime.ir's times"),$h("button",{"class":"btn sm","type":"button","onClick":$G(v,"pt.showPrayers")},"Key times only")))),$h("section",{"class":"card pt-sis "+$S($G(v,"pt.sisCls"))},$h("button",{"type":"button","class":"pt-toggle","role":"switch","aria-checked":$S($G(v,"pt.sisPressed")),"onClick":$G(v,"pt.toggleSis")},$h("span",{"class":"pt-track","aria-hidden":"true"}),$h("span",{"class":"pt-swt"},$h("b",{},"Sistani's night"),$h("span",{},"Night runs from sunset to true dawn, as in Minhaj al-Salihin, mas'ala 502"))),$h("p",{"class":"sub","role":"status"},$S($G(v,"pt.sisSummary")))),$h("section",{"class":"card"},$h("div",{"class":"card-h"},$h("h2",{},"This week"),$h("span",{"class":"aside"},"Prayer starts in colour, Fridays marked, times rounded as intime.ir rounds them")),$h("div",{"class":"pt-scroll"},$h("table",{"class":"pt-t","style":$S($G(v,"pt.minW"))},$h("thead",{},$h("tr",{},$h("th",{"class":"dayc"},"Day"),$A($G(v,"pt.head")).map(function(it,ix){var v1=Object.create(v);v1["h"]=it;return [$h("th",{"class":$S($G(v1,"h.cls")),"title":$S($G(v1,"h.title"))},$S($G(v1,"h.label")))];}))),$h("tbody",{},$A($G(v,"pt.week")).map(function(it,ix){var v1=Object.create(v);v1["r"]=it;return [$h("tr",{"class":$S($G(v1,"r.cls"))},$h("td",{"class":"dayc"},$S($G(v1,"r.day")),$h("small",{},$S($G(v1,"r.sub")))),$A($G(v1,"r.cells")).map(function(it,ix){var v2=Object.create(v1);v2["c"]=it;return [$h("td",{"class":$S($G(v2,"c.cls"))},$S($G(v2,"c.t")),($T($G(v2,"c.hasD"))?[$h("span",{"class":"pt-dl"},$S($G(v2,"c.d")))]:null))];}))];}))))),$h("section",{"class":"card"},$h("div",{"class":"card-h"},$h("h2",{},$S($G(v,"pt.monthLabel"))),$h("span",{"class":"aside pt-mnav"},($T($G(v,"pt.notThisM"))?[$h("button",{"class":"btn sm","type":"button","onClick":$G(v,"pt.thisM")},"This month")]:null),$h("button",{"class":"btn sm","type":"button","aria-label":"Previous month","onClick":$G(v,"pt.prevM")},$h("svg",{"class":"ic","viewBox":"0 0 24 24","aria-hidden":"true"},$h("path",{"d":"m15 18-6-6 6-6"})),"Previous"),$h("button",{"class":"btn sm","type":"button","aria-label":"Next month","onClick":$G(v,"pt.nextM")},"Next",$h("svg",{"class":"ic","viewBox":"0 0 24 24","aria-hidden":"true"},$h("path",{"d":"m9 18 6-6-6-6"}))))),$h("div",{"class":"pt-scroll pt-month"},$h("table",{"class":"pt-t","style":$S($G(v,"pt.minW"))},$h("thead",{},$h("tr",{},$h("th",{"class":"dayc"},"Day"),$A($G(v,"pt.head")).map(function(it,ix){var v1=Object.create(v);v1["h"]=it;return [$h("th",{"class":$S($G(v1,"h.cls")),"title":$S($G(v1,"h.title"))},$S($G(v1,"h.label")))];}))),$h("tbody",{},$A($G(v,"pt.month")).map(function(it,ix){var v1=Object.create(v);v1["r"]=it;return [$h("tr",{"class":$S($G(v1,"r.cls"))},$h("td",{"class":"dayc"},$S($G(v1,"r.day")),$h("small",{},$S($G(v1,"r.sub")))),$A($G(v1,"r.cells")).map(function(it,ix){var v2=Object.create(v1);v2["c"]=it;return [$h("td",{"class":$S($G(v2,"c.cls"))},$S($G(v2,"c.t")),($T($G(v2,"c.hasD"))?[$h("span",{"class":"pt-dl"},$S($G(v2,"c.d")))]:null))];}))];}))))),$h("section",{"class":"card"},$h("div",{"class":"card-h"},$h("h2",{},"Times and method"),($T($G(v,"pt.hasMsg"))?[$h("span",{"class":"aside ok-t","role":"status"},$S($G(v,"pt.msg")))]:null)),$h("div",{"class":"lbl"},"Calculation method"),$h("div",{"class":"seg","role":"group","aria-label":"Calculation method"},$A($G(v,"pt.methods")).map(function(it,ix){var v1=Object.create(v);v1["m"]=it;return [$h("button",{"type":"button","aria-pressed":$S($G(v1,"m.pressed")),"onClick":$G(v1,"m.pick")},$S($G(v1,"m.label")))];})),$h("p",{"class":"cap"},"intime.ir means its Tehran Geophysics settings. Angles are degrees of the sun below the horizon. The Sistani preset keeps intime's angles, since his texts give no degrees, and ends the night at the following morning's true dawn (17.7) instead of 19.5. That moves the traveller's Maghrib virtue, the end of Isha virtue, midnight and du'a time. Choose Custom to set anything yourself. A night start of 0 means sunset."),$h("details",{"class":"more"},$h("summary",{},$h("svg",{"class":"ic","viewBox":"0 0 24 24","aria-hidden":"true"},$h("path",{"d":"m9 18 6-6-6-6"})),$h("span",{},"Angles")),$h("div",{"class":"pt-angles"},$A($G(v,"pt.angles")).map(function(it,ix){var v1=Object.create(v);v1["a"]=it;return [$h("div",{"class":"pt-arow"},$h("span",{},$S($G(v1,"a.title"))),($T($G(v1,"a.isAngle"))?[$h("span",{"class":"pt-ain"},$h("input",{"type":$S($G(v1,"T.num")),"step":"0.1","min":"0","max":"30","aria-label":$S($G(v1,"a.title"))+", degrees","value":$V($G(v1,"a.a.v")),"onInput":$G(v1,"a.a.on"),"disabled":$B($G(v1,"a.dis"))}),$h("span",{"class":"cap"},"degrees"))]:null),($T($G(v1,"a.isNight"))?[$h("span",{"class":"pt-ain"},$h("span",{"class":"cap"},"Night from"),$h("input",{"type":$S($G(v1,"T.num")),"step":"0.1","min":"0","max":"30","aria-label":$S($G(v1,"a.title"))+", night start","value":$V($G(v1,"a.ns.v")),"onInput":$G(v1,"a.ns.on"),"disabled":$B($G(v1,"a.dis"))}),$h("span",{"class":"cap"},"to"),$h("input",{"type":$S($G(v1,"T.num")),"step":"0.1","min":"0","max":"30","aria-label":$S($G(v1,"a.title"))+", night end","value":$V($G(v1,"a.ne.v")),"onInput":$G(v1,"a.ne.on"),"disabled":$B($G(v1,"a.dis"))}))]:null),$h("span",{"class":"num"},$S($G(v1,"a.today"))))];})),($T($G(v,"pt.isCustom"))?[$h("button",{"class":"btn pri sm","type":"button","onClick":$G(v,"pt.saveCustom")},"Save angles")]:null)),$h("div",{"class":"lbl rule"},"Location"),$h("div",{"class":"form pt-loc"},$h("label",{"class":"field"},"Place name",$h("input",{"type":"text","value":$V($G(v,"pt.name.v")),"onInput":$G(v,"pt.name.on")})),$h("label",{"class":"field"},"Latitude",$h("input",{"type":$S($G(v,"T.num")),"step":"0.0001","value":$V($G(v,"pt.lat.v")),"onInput":$G(v,"pt.lat.on")})),$h("label",{"class":"field"},"Longitude",$h("input",{"type":$S($G(v,"T.num")),"step":"0.0001","value":$V($G(v,"pt.lng.v")),"onInput":$G(v,"pt.lng.on")}))),$h("div",{"class":"pt-presets"},$h("button",{"class":"btn pri sm","type":"button","onClick":$G(v,"pt.saveLoc")},"Save location"),$h("button",{"class":"btn sm","type":"button","onClick":$G(v,"pt.useLahore")},"Use Lahore"),$h("span",{"class":"cap"},"To find coordinates, long-press your spot in Google Maps and copy the two numbers, latitude first. Times use Pakistan time"))),$h("div",{"class":"row"},$h("section",{"class":"card"},$h("div",{"class":"card-h"},$h("h2",{},"What each time means")),$h("dl",{"class":"pt-defs"},$A($G(v,"pt.defs")).map(function(it,ix){var v1=Object.create(v);v1["d"]=it;return [$h("dt",{"class":$S($G(v1,"d.cls"))},$S($G(v1,"d.name"))),$h("dd",{},$S($G(v1,"d.def")),$h("span",{"class":"pt-sis-n"},$h("b",{},"Sistani")," "+$S($G(v1,"d.sis"))))];}))),$h("div",{"class":"stack"},$h("section",{"class":"card"},$h("div",{"class":"card-h"},$h("h2",{},"How it works")),$h("ol",{"class":"pt-how"},$h("li",{},$h("b",{},"Where the sun is.")," For each day the page works out the sun's declination and the equation of time from the date and the longitude."),$h("li",{},$h("b",{},"Noon.")," Dhuhr is when the sun crosses the meridian: 12:00 adjusted by the equation of time and the distance from the time zone's centre line."),$h("li",{},$h("b",{},"Angles below the horizon.")," 19.5 for imsak, 17.7 for dawn, 15 for the Fajr prayer, 12 for the end of Fajr's virtue, 4.5 for Maghrib, 13 for Isha. Sunrise and sunset use 0.833, for the air bending light and the sun's width."),$h("li",{},$h("b",{},"Shadows.")," The qadam and mithl times are when a vertical stick's shadow has grown past its noon length by 2/7, 4/7, 6/7, one or two times its height."),$h("li",{},$h("b",{},"The night.")," A quarter, a third and half of it give the traveller's end of Maghrib virtue, the end of Isha virtue and midnight. The end of du'a time is midnight plus a sixth of the second half."),$h("li",{},$h("b",{},"Same recipe as intime.ir.")," The praytimes.org formulas intime.ir is built on, refined in two passes and rounded to the minute."))),$h("section",{"class":"card"},$h("div",{"class":"card-h"},$h("h2",{},"Checked against intime.ir")),$h("p",{"class":"pt-check"},$h("b",{},"90 of 90"),$h("span",{},"times matched intime.ir for a point in Lahore, 20 to 24 November 2026, all 18 columns, Tehran Geophysics settings. This page uses the Lahore city centre, so times can differ by up to a minute")),$h("p",{"class":"cap"},"The times are worked out here, so they need no connection.")))))]:null),($T($G(v,"tabs.planner"))?[$h("div",{"class":"page pg-planners"},$h("div",{"class":"head"},$h("div",{},$h("h1",{},"Planners and checkups"),$h("p",{"class":"meta"},"Move a slider and the dates and amounts follow"))),$h("div",{"class":"row"},$h("section",{"class":"card"},$h("div",{"class":"card-h"},$h("h2",{},"Khums ",$h("span",{"class":"ur","lang":"ur","dir":"rtl"},"خمس")),$h("span",{"class":"aside "+$S($G(v,"pl.khCls"))},$S($G(v,"pl.khStatus")))),$h("div",{"class":"kstrip sm","aria-hidden":"true"},$h("span",{"class":"ks-track"}),$h("span",{"class":"ks-fill grow-x","style":"width:"+$S($G(v,"al.todayPos"))+"%"}),$A($G(v,"al.months")).map(function(it,ix){var v1=Object.create(v);v1["m"]=it;return [$h("span",{"class":"ks-m "+$S($G(v1,"m.alt")),"style":"left:"+$S($G(v1,"m.pos"))+"%"},$S($G(v1,"m.short")))];}),$h("span",{"class":"ks-today","style":"left:"+$S($G(v,"al.todayPos"))+"%"},$h("span",{},"Today")),$h("span",{"class":"ks-end"})),$h("p",{"class":"note"},$S($G(v,"pl.khNote"))),$h("div",{"class":"slider"},$h("label",{"for":"plExtra"},$h("span",{},"If I save this much more before then"),$h("b",{},"PKR "+$S($G(v,"pl.extra")))),$h("input",{"id":"plExtra","class":"range","type":"range","min":"0","max":"200000","step":"5000","value":$V($G(v,"f.sl_extra.v")),"onInput":$G(v,"f.sl_extra.on")})),$h("div",{"class":"trio rule"},$h("div",{"class":"stat"},$h("span",{"class":"lbl"},"Held then"),$h("span",{"class":"fig"},$S($G(v,"pl.held")))),$h("div",{"class":"stat"},$h("span",{"class":"lbl"},"Above mukhamas"),$h("span",{"class":"fig"},$S($G(v,"pl.tax")))),$h("div",{"class":"stat key"},$h("span",{"class":"lbl"},"Khums on the day"),$h("span",{"class":"fig","data-count":$S($G(v,"pl.kh"))})))),$h("section",{"class":"card"},$h("div",{"class":"card-h"},$h("h2",{},"Kaffara payoff ",$h("span",{"class":"ur","lang":"ur","dir":"rtl"},"کفارہ")),$h("span",{"class":"aside"},$S($G(v,"pl.kafOpen")))),$h("div",{"class":"slider"},$h("label",{"for":"plPer"},$h("span",{},"Set aside each pay"),$h("b",{},"PKR "+$S($G(v,"pl.per")))),$h("input",{"id":"plPer","class":"range","type":"range","min":"1000","max":"18000","step":"1000","value":$V($G(v,"f.sl_per.v")),"onInput":$G(v,"f.sl_per.on")})),$h("div",{"class":"trio rule"},$h("div",{"class":"stat"},$h("span",{"class":"lbl"},"Pays needed"),$h("span",{"class":"fig"},$S($G(v,"pl.npay")))),$h("div",{"class":"stat"},$h("span",{"class":"lbl"},"Each pay covers"),$h("span",{"class":"fig"},$S($G(v,"pl.cover")))),$h("div",{"class":"stat key"},$h("span",{"class":"lbl"},"Cleared by"),$h("span",{"class":"bigdate"},$h("b",{"class":"circled-n"},$S($G(v,"pl.clearDn"))),$h("span",{},$S($G(v,"pl.clearMy")))))),$h("div",{},$h("button",{"class":"btn sm","type":"button","onClick":$G(v,"pl.saveWajPer")},"Use this in my budget")),$h("p",{"class":"note"},"Pay it as food: one mudd (about 750 g) to each of 60 poor people per fast"))),$h("div",{"class":"row"},$h("section",{"class":"card"},$h("div",{"class":"card-h"},$h("h2",{},"Qaza plan ",$h("span",{"class":"ur","lang":"ur","dir":"rtl"},"قضا نمازیں")),$h("span",{"class":"aside"},$S($G(v,"pl.qOwed")))),$h("div",{"class":"slider"},$h("label",{"for":"plQ"},$h("span",{},"With each prayer, qaza a day"),$h("b",{},$S($G(v,"pl.q")))),$h("input",{"id":"plQ","class":"range","type":"range","min":"1","max":"4","step":"1","value":$V($G(v,"f.sl_q.v")),"onInput":$G(v,"f.sl_q.on")})),$h("div",{"class":"bars"},$A($G(v,"pl.qBars")).map(function(it,ix){var v1=Object.create(v);v1["b"]=it;return [$h("div",{"class":"bar "+$S($G(v1,"b.cls"))},$h("span",{},$S($G(v1,"b.en"))),$h("span",{"class":"track"},$h("i",{"style":"width:"+$S($G(v1,"b.w"))+"%"})),$h("span",{},$S($G(v1,"b.d"))))];})),$h("div",{"class":"rule allclear"},$h("span",{"class":"lbl"},"All clear by"),$h("span",{"class":"bigdate"},$h("b",{"class":"circled-n"},$S($G(v,"pl.qAllDn"))),$h("span",{},$S($G(v,"pl.qAllMy")))))),$h("section",{"class":"card"},$h("div",{"class":"card-h"},$h("h2",{},"Wasiyat checkup ",$h("span",{"class":"ur","lang":"ur","dir":"rtl"},"وصیت")),$h("span",{"class":"aside"},$S($G(v,"pl.wOk"))+" of "+$S($G(v,"pl.wN"))+" ready")),$h("div",{"class":"progress","role":"img","aria-label":$S($G(v,"pl.wPct"))+" percent ready"},$h("i",{"style":"width:"+$S($G(v,"pl.wPct"))+"%"})),$h("p",{"class":"sub"},$S($G(v,"pl.wMissing"))),$h("div",{"class":"checks"},$A($G(v,"pl.checks")).map(function(it,ix){var v1=Object.create(v);v1["c"]=it;return [$h("div",{"class":"chk "+$S($G(v1,"c.cls"))},$h("span",{"class":"box"},($T($G(v1,"c.ok"))?[$h("svg",{"class":"ic","viewBox":"0 0 24 24","aria-hidden":"true"},$h("path",{"d":"M20 6 9 17l-5-5"}))]:null)),$h("span",{"class":"ctx"},$h("b",{},$S($G(v1,"c.t"))),$h("span",{},$S($G(v1,"c.s")))),$h("span",{},($T($G(v1,"c.sign"))?[$h("button",{"class":"btn sm","type":"button","onClick":$G(v1,"c.signed")},"Signed today")]:null),($T($G(v1,"c.fix"))?[$h("button",{"class":"btn sm quiet","type":"button","onClick":$G(v1,"c.goFix")},"Fix")]:null)))];})))))]:null),($T($G(v,"tabs.money"))?[$h("div",{"class":"page pg-money"},$h("div",{"class":"head"},$h("div",{},$h("h1",{},"Money ",$h("span",{"class":"mut"},$S($G(v,"mo.cycle")))),$h("p",{"class":"meta"},"Pay cycle, next pay "+$S($G(v,"mo.paySub")))),$h("button",{"class":"btn pri","type":"button","onClick":$G(v,"openAdd")},$h("svg",{"class":"ic","viewBox":"0 0 24 24","aria-hidden":"true"},$h("path",{"d":"M5 12h14"}),$h("path",{"d":"M12 5v14"})),"Add spending")),$h("section",{"class":"card"},$h("div",{"class":"stats"},$h("div",{"class":"stat"},$h("span",{"class":"lbl"},"Left to spend"),$h("span",{"class":"fig "+$S($G(v,"mo.leftCls"))},$h("span",{"class":"total"},$h("span",{"class":"cur"},"PKR"),$h("span",{"data-count":$S($G(v,"mo.left"))}))),$h("span",{"class":"sub"},$S($G(v,"mo.leftSub")))),$h("div",{"class":"stat"},$h("span",{"class":"lbl"},"Safe per day"),$h("span",{"class":"fig"},$h("span",{"class":"cur"},"PKR"),$S($G(v,"mo.perDay"))),$h("span",{"class":"sub"},$S($G(v,"mo.perDaySub")))),$h("div",{"class":"stat"},$h("span",{"class":"lbl"},"Spent today"),$h("span",{"class":"fig"},$h("span",{"class":"cur"},"PKR"),$S($G(v,"mo.today"))),$h("span",{"class":"sub "+$S($G(v,"mo.todayCls"))},$S($G(v,"mo.todaySub")))),$h("div",{"class":"stat"},$h("span",{"class":"lbl"},"Next pay"),$h("span",{"class":"fig"},$S($G(v,"mo.payIn"))),$h("span",{"class":"sub"},$S($G(v,"mo.paySub"))))),$h("div",{"class":"pace rule"},$h("div",{"class":"ptrack","aria-hidden":"true"},$h("i",{"class":$S($G(v,"mo.aheadCls")),"style":"width:"+$S($G(v,"mo.spentPct"))+"%"}),$h("b",{"style":"inset-inline-start:"+$S($G(v,"mo.elapsedPct"))+"%"})),$h("span",{"class":"sub"},$S($G(v,"mo.paceText"))))),$h("section",{"class":"card cal-card big","aria-label":"The pay cycle day by day"},$h("div",{"class":"card-h"},$h("h2",{},"Day by day"),$h("span",{"class":"aside"},$h("span",{"class":"circ-key"}),"Circled: pay day and bills you pay. Grey ring: paid by your mentor")),$h("div",{"class":"cal-grid"},$A($G(v,"al.wk")).map(function(it,ix){var v1=Object.create(v);v1["w"]=it;return [$h("span",{"class":"cal-wk"},$S($G(v1,"w")))];}),$A($G(v,"al.cells")).map(function(it,ix){var v1=Object.create(v);v1["c"]=it;return [$h("div",{"class":"cal "+$S($G(v1,"c.cls")),"title":$S($G(v1,"c.title"))},$h("span",{"class":"cal-n"},$S($G(v1,"c.n"))),$h("span",{"class":"cal-amt "+$S($G(v1,"c.over"))},$S($G(v1,"c.amt"))),$h("span",{"class":"cal-bar"},$h("i",{"class":"grow-x","style":"width:"+$S($G(v1,"c.fill"))+"%"})),$h("span",{"class":"cal-mark"},$S($G(v1,"c.mark"))))];}))),$h("div",{"class":"row wl"},$h("section",{"class":"card"},$h("div",{"class":"card-h"},$h("h2",{},"Food per order"),$h("span",{"class":"aside"},$S($G(v,"mo.foodTotal")))),$h("div",{"class":"meals3"},$A($G(v,"mo.meals")).map(function(it,ix){var v1=Object.create(v);v1["m"]=it;return [$h("div",{"class":"stat"},$h("span",{"class":"lbl"},$S($G(v1,"m.name"))+" cap"),$h("span",{"class":"fig"},$h("span",{"class":"cur"},"PKR"),$S($G(v1,"m.cap"))),$h("span",{"class":"sub"},$S($G(v1,"m.line"))),$h("span",{"class":"cap "+$S($G(v1,"m.stCls"))},$S($G(v1,"m.st"))))];})),$h("div",{},$h("div",{"class":"chart","role":"img","aria-label":"Food spending per day for the last 14 days"},$A($G(v,"mo.grid")).map(function(it,ix){var v1=Object.create(v);v1["g"]=it;return [$h("div",{"class":"grid","style":"bottom:"+$S($G(v1,"g.pct"))+"%"},$h("span",{},$S($G(v1,"g.label"))))];}),$h("div",{"class":"capline","style":"bottom:"+$S($G(v,"mo.capPct"))+"%"}),$h("div",{"class":"cols"},$A($G(v,"mo.cols")).map(function(it,ix){var v1=Object.create(v);v1["c"]=it;return [$h("div",{"class":"col grow "+$S($G(v1,"c.cls")),"title":$S($G(v1,"c.title"))},($T($G(v1,"c.total"))?[$h("span",{"class":"tot","style":"bottom:calc("+$S($G(v1,"c.pct"))+"% + 4px)"},$S($G(v1,"c.total")))]:null),$A($G(v1,"c.segs")).map(function(it,ix){var v2=Object.create(v1);v2["sg"]=it;return [$h("i",{"class":$S($G(v2,"sg.k")),"style":"height:"+$S($G(v2,"sg.pct"))+"%"})];}))];}))),$h("div",{"class":"chart-x","aria-hidden":"true"},$A($G(v,"mo.cols")).map(function(it,ix){var v1=Object.create(v);v1["c"]=it;return [$h("span",{"class":$S($G(v1,"c.cls"))},$S($G(v1,"c.day")))];}))),$h("div",{"class":"legend"},$h("span",{},$h("i",{"class":"nashta"}),"Nashta"),$h("span",{},$h("i",{"class":"dinner"}),"Dinner"),$h("span",{},$h("i",{"class":"snack"}),"Snack"),$h("span",{},$h("i",{"class":"other"}),"Other food"),$h("span",{},$h("i",{"class":"today"}),"Today"),$h("span",{},$h("i",{"class":"capk"}),"Daily food budget, PKR "+$S($G(v,"mo.dailyCap"))))),$h("section",{"class":"card"},$h("div",{"class":"card-h"},$h("h2",{},"Where each pay goes"),$h("span",{"class":"aside num"},$S($G(v,"mo.income")))),$h("div",{"class":"ranked"},$A($G(v,"mo.plan")).map(function(it,ix){var v1=Object.create(v);v1["r"]=it;return [$h("div",{"class":"rk "+$S($G(v1,"r.cls"))},$h("span",{"class":"nm"},$S($G(v1,"r.label")),$h("small",{},$S($G(v1,"r.note")))),$h("span",{"class":"v"},$S($G(v1,"r.v"))),$h("span",{"class":"p"},$S($G(v1,"r.pct"))),$h("span",{"class":"track"},$h("i",{"style":"width:"+$S($G(v1,"r.w"))+"%"})))];})),$h("p",{"class":"note rule"},$S($G(v,"mo.planNote"))))),$h("div",{"class":"row"},$h("section",{"class":"card"},$h("div",{"class":"card-h"},$h("h2",{},"Wajibat to pay"),$h("span",{"class":"aside"},"Linked to the wasiyat")),$h("div",{"class":"list"},$A($G(v,"mo.dues")).map(function(it,ix){var v1=Object.create(v);v1["i"]=it;return [$h("div",{"class":"li"},$h("div",{},$h("span",{"class":"kind"},$S($G(v1,"i.type"))),$h("div",{"class":"t"},$S($G(v1,"i.title"))),$h("div",{"class":"sub"},$S($G(v1,"i.meta")))),$h("div",{"class":"r"},$h("span",{"class":"num"},$S($G(v1,"i.left"))),$h("span",{"class":"cap"},"left")),($T($G(v1,"i.canPay"))?[$h("div",{"class":"full inline"},$h("input",{"type":$S($G(v1,"T.num")),"step":"any","min":"0","aria-label":"Amount paid","value":$V($G(v1,"i.amt.v")),"onInput":$G(v1,"i.amt.on")}),$h("select",{"aria-label":"Currency","value":$V($G(v1,"i.cur.v")),"onChange":$G(v1,"i.cur.on")},$A($G(v1,"curs")).map(function(it,ix){var v2=Object.create(v1);v2["c"]=it;return [$h("option",{"value":$V($G(v2,"c"))},$S($G(v2,"c")))];})),$h("button",{"class":"btn sm","type":"button","onClick":$G(v1,"i.pay")},"Paid, log it"))]:null))];}),($T($G(v,"mo.noDues"))?[$h("div",{"class":"empty"},"No kaffara, fidya, nazr or mazalim open")]:null))),$h("section",{"class":"card"},$h("div",{"class":"card-h"},$h("h2",{},"Loans and debts"),$h("span",{"class":"aside"},"Linked to the wasiyat")),$h("div",{"class":"list"},$A($G(v,"mo.debtsOpen")).map(function(it,ix){var v1=Object.create(v);v1["d"]=it;return [$h("div",{"class":"li"},$h("div",{},$h("span",{"class":"kind "+$S($G(v1,"d.dirCls"))},$S($G(v1,"d.dir"))),$h("div",{"class":"t"},$S($G(v1,"d.person")),($T($G(v1,"d.ur"))?[$h("span",{"class":"ur","lang":"ur","dir":"rtl"},$S($G(v1,"d.ur")))]:null)),$h("div",{"class":"sub"},$S($G(v1,"d.meta"))),($T($G(v1,"d.note"))?[$h("p",{"class":"cap"},$S($G(v1,"d.note")))]:null)),$h("div",{"class":"r"},$h("span",{"class":"num"},$S($G(v1,"d.left"))),($T($G(v1,"d.native"))?[$h("span",{"class":"cap"},$S($G(v1,"d.native")))]:null)),$h("div",{"class":"full inline"},$h("input",{"type":$S($G(v1,"T.num")),"step":"any","min":"0","placeholder":"Repayment","aria-label":"Repayment amount","value":$V($G(v1,"d.amt.v")),"onInput":$G(v1,"d.amt.on")}),$h("select",{"aria-label":"Repayment currency","value":$V($G(v1,"d.cur.v")),"onChange":$G(v1,"d.cur.on")},$A($G(v1,"curs")).map(function(it,ix){var v2=Object.create(v1);v2["c"]=it;return [$h("option",{"value":$V($G(v2,"c"))},$S($G(v2,"c")))];})),$h("button",{"class":"btn sm","type":"button","onClick":$G(v1,"d.record")},"Record"),$h("button",{"class":"btn sm quiet","type":"button","onClick":$G(v1,"d.settle")},"Mark settled")))];}),($T($G(v,"mo.noDebts"))?[$h("div",{"class":"empty"},"No open loans")]:null)),($T($G(v,"mo.hasClosed"))?[$h("details",{"class":"more"},$h("summary",{},$h("svg",{"class":"ic","viewBox":"0 0 24 24","aria-hidden":"true"},$h("path",{"d":"m9 18 6-6-6-6"})),$h("span",{},"Settled ("+$S($G(v,"mo.closedN"))+")")),$h("div",{"class":"list"},$A($G(v,"mo.debtsClosed")).map(function(it,ix){var v1=Object.create(v);v1["d"]=it;return [$h("div",{"class":"li"},$h("div",{},$h("span",{"class":"kind"},$S($G(v1,"d.dir"))),$h("div",{"class":"t"},$S($G(v1,"d.person")),($T($G(v1,"d.ur"))?[$h("span",{"class":"ur","lang":"ur","dir":"rtl"},$S($G(v1,"d.ur")))]:null)),$h("div",{"class":"sub"},$S($G(v1,"d.meta"))),($T($G(v1,"d.note"))?[$h("p",{"class":"cap"},$S($G(v1,"d.note")))]:null)),$h("div",{"class":"r"},$h("span",{"class":"num"},$S($G(v1,"d.left")))))];})))]:null),$h("details",{"class":"more"},$h("summary",{},$h("svg",{"class":"ic","viewBox":"0 0 24 24","aria-hidden":"true"},$h("path",{"d":"m9 18 6-6-6-6"})),"Add a loan or debt"),$h("div",{"class":"form"},$h("label",{"class":"field"},"Person (English)",$h("input",{"value":$V($G(v,"f.debt_person.v")),"onInput":$G(v,"f.debt_person.on")})),$h("label",{"class":"field"},"Person (Urdu)",$h("input",{"class":"ur","dir":"rtl","lang":"ur","value":$V($G(v,"f.debt_person_ur.v")),"onInput":$G(v,"f.debt_person_ur.on")})),$h("label",{"class":"field"},"Direction",$h("select",{"value":$V($G(v,"f.debt_direction.v")),"onChange":$G(v,"f.debt_direction.on")},$h("option",{"value":"i_owe"},"I owe them"),$h("option",{"value":"owed_to_me"},"They owe me"))),$h("label",{"class":"field"},"Amount",$h("input",{"type":$S($G(v,"T.num")),"step":"any","min":"0","value":$V($G(v,"f.debt_amount.v")),"onInput":$G(v,"f.debt_amount.on")})),$h("label",{"class":"field"},"Currency",$h("select",{"value":$V($G(v,"f.debt_currency.v")),"onChange":$G(v,"f.debt_currency.on")},$A($G(v,"curs")).map(function(it,ix){var v1=Object.create(v);v1["c"]=it;return [$h("option",{"value":$V($G(v1,"c"))},$S($G(v1,"c")))];}))),$h("label",{"class":"field"},"Contact",$h("input",{"dir":"ltr","value":$V($G(v,"f.debt_contact.v")),"onInput":$G(v,"f.debt_contact.on")})),$h("label",{"class":"field full"},"Note",$h("input",{"value":$V($G(v,"f.debt_note.v")),"onInput":$G(v,"f.debt_note.on")})),$h("label",{"class":"field full"},"Note (Urdu)",$h("input",{"class":"ur","dir":"rtl","lang":"ur","value":$V($G(v,"f.debt_note_ur.v")),"onInput":$G(v,"f.debt_note_ur.on")})),$h("label",{"class":"check-row full"},$h("input",{"type":"checkbox","checked":$B($G(v,"f.debt_khumsPaid.v")),"onChange":$G(v,"f.debt_khumsPaid.on")}),"Khums already paid on this money"),$h("div",{"class":"full"},$h("button",{"class":"btn pri","type":"button","onClick":$G(v,"mo.addDebt")},"Add")))))),$h("div",{"class":"row"},$h("section",{"class":"card"},$h("div",{"class":"card-h"},$h("h2",{},"Monthly bills"),$h("span",{"class":"aside"},"Tap Paid when the card is charged")),$h("div",{"class":"list"},$A($G(v,"mo.bills")).map(function(it,ix){var v1=Object.create(v);v1["b"]=it;return [$h("div",{"class":"li"},$h("div",{},$h("div",{"class":"t"},$S($G(v1,"b.name"))),$h("div",{"class":"sub"},$S($G(v1,"b.meta")))),$h("div",{"class":"r"},($T($G(v1,"b.paid"))?[$h("span",{"class":"sub ok-t"},"Paid this cycle")]:null),($T($G(v1,"b.canPay"))?[$h("button",{"class":"btn sm","type":"button","onClick":$G(v1,"b.pay")},"Paid")]:null)))];}),($T($G(v,"mo.noBills"))?[$h("div",{"class":"empty"},"No bills yet")]:null)),($T($G(v,"mo.hasMentor"))?[$h("div",{"class":"cap rule"},"On your account, paid by your mentor, not in your budget"),$h("div",{"class":"list"},$A($G(v,"mo.mentorBills")).map(function(it,ix){var v1=Object.create(v);v1["b"]=it;return [$h("div",{"class":"li"},$h("div",{},$h("div",{"class":"t"},$S($G(v1,"b.name"))),$h("div",{"class":"sub"},$S($G(v1,"b.meta")))),$h("div",{"class":"r"},$h("button",{"class":"btn sm","type":"button","onClick":$G(v1,"b.remind")},"Reminded")))];}))]:null)),$h("section",{"class":"card"},$h("div",{"class":"card-h"},$h("h2",{},"What you hold")),$h("div",{"class":"list"},$A($G(v,"mo.hold")).map(function(it,ix){var v1=Object.create(v);v1["h"]=it;return [$h("div",{"class":"li"},$h("div",{},$h("div",{"class":"t"},$S($G(v1,"h.t"))),$h("div",{"class":"sub"},$S($G(v1,"h.s")))),$h("div",{"class":"r"},$h("span",{"class":"num"},$S($G(v1,"h.v")))))];})))),$h("section",{"class":"card"},$h("div",{"class":"card-h"},$h("h2",{},"Entries this cycle"),$h("span",{"class":"aside"},$S($G(v,"mo.txCount")))),($T($G(v,"mo.noTx"))?[$h("div",{"class":"empty"},"Nothing logged in this cycle yet")]:null),($T($G(v,"mo.hasTx"))?[$h("div",{"class":"table-box"},$h("table",{"class":"t"},$h("thead",{},$h("tr",{},$h("th",{},"Date"),$h("th",{},"What"),$h("th",{},"Category"),$h("th",{},"Paid by"),$h("th",{"class":"r"},"Amount"),$h("th",{"class":"r"},"PKR"),$h("th",{"class":"r"},$h("span",{"class":"cap"},"Delete")))),$h("tbody",{},$A($G(v,"mo.tx")).map(function(it,ix){var v1=Object.create(v);v1["t"]=it;return [$h("tr",{"class":$S($G(v1,"t.leaving"))},$h("td",{"class":"mono"},$S($G(v1,"t.date"))),$h("td",{},($T($G(v1,"t.meal"))?[$h("span",{"class":"cap"},$S($G(v1,"t.meal"))+". ")]:null),$S($G(v1,"t.note")),($T($G(v1,"t.food"))?[$h("div",{},($T($G(v1,"t.rate.has"))?[$h("button",{"type":"button","class":"rate-chip","onClick":$G(v1,"t.rate.open")},($T($G(v1,"t.rate.label"))?[$h("b",{"class":$S($G(v1,"t.rate.cls"))},$S($G(v1,"t.rate.label")))]:null),($T($G(v1,"t.rate.review"))?[$h("span",{},"\""+$S($G(v1,"t.rate.review"))+"\"")]:null))]:null),($T($G(v1,"t.rate.none"))?[$h("button",{"type":"button","class":"rate-chip","onClick":$G(v1,"t.rate.open")},"How was it?")]:null))]:null)),$h("td",{},$S($G(v1,"t.cat"))),$h("td",{"class":"sub"},$S($G(v1,"t.src"))),$h("td",{"class":"r mono"},$S($G(v1,"t.amt"))),$h("td",{"class":"r mono"},$h("b",{},$S($G(v1,"t.pkr")))),$h("td",{"class":"r"},$h("button",{"type":"button","class":$S($G(v1,"t.delCls")),"aria-label":"Delete entry","onClick":$G(v1,"t.del")},$h("svg",{"class":"ic","viewBox":"0 0 24 24","aria-hidden":"true"},$h("path",{"d":"M3 6h18"}),$h("path",{"d":"M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"}),$h("path",{"d":"M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"})),$S($G(v1,"t.delLabel")))))];}))))]:null)))]:null),($T($G(v,"tabs.accounts"))?[$h("div",{"class":"page pg-accounts"},$h("div",{"class":"head"},$h("div",{},$h("h1",{},"Accounts ",$h("span",{"class":"mut"},$S($G(v,"ac.periodLabel")))),$h("p",{"class":"meta"},"From your NayaPay and bank statements, account numbers left out · "+$S($G(v,"ac.stamp"))))),$h("section",{"class":"card acct-wallet"},$h("div",{"class":"cards-stage","aria-label":"Your accounts"},$A($G(v,"ac.cards")).map(function(it,ix){var v1=Object.create(v);v1["a"]=it;return [$h("button",{"type":"button","class":"acard acard-"+$S($G(v1,"a.i"))+" "+$S($G(v1,"a.kind"))+" "+$S($G(v1,"a.on")),"aria-pressed":$S($G(v1,"a.pressed")),"aria-label":$S($G(v1,"a.aria")),"onClick":$G(v1,"a.pick")}," ",$h("span",{"class":"acard-top"},$h("span",{"class":"acard-brand"},$S($G(v1,"a.brand"))),$h("span",{"class":"acard-chip","aria-hidden":"true"}))," ",$h("span",{"class":"acard-mid"},$h("span",{"class":"acard-cap"},"Balance"),$h("span",{"class":"acard-bal"},$h("span",{"class":"cur"},"PKR"),$S($G(v1,"a.bal"))))," ",$h("span",{"class":"acard-foot"},$h("span",{},$S($G(v1,"a.holder"))),$h("span",{},$S($G(v1,"a.type"))))," ")];})),$h("div",{"class":"acct-list"},$A($G(v,"ac.cards")).map(function(it,ix){var v1=Object.create(v);v1["a"]=it;return [$h("div",{"class":"acct-li "+$S($G(v1,"a.on"))},$h("div",{"class":"acct-li-h"},$h("b",{},$S($G(v1,"a.title"))),$h("span",{"class":"num"},"PKR "+$S($G(v1,"a.bal")))),$h("div",{"class":"tagrow"},$A($G(v1,"a.tags")).map(function(it,ix){var v2=Object.create(v1);v2["g"]=it;return [$h("span",{"class":"cat-tag "+$S($G(v2,"g.c"))},$S($G(v2,"g.t")))];})))];}),$h("p",{"class":"cap"},"Tap a card to show only its transactions. Account numbers are left out."))),($T($G(v,"ac.hasMissing"))?[$h("section",{"class":"card"},$h("div",{"class":"card-h"},$h("h2",{},"On the statement, not in the app"),$h("span",{"class":"aside"},"This pay cycle. Log it to add what you had")),$h("div",{"class":"list"},$A($G(v,"ac.missing")).map(function(it,ix){var v1=Object.create(v);v1["m"]=it;return [$h("div",{"class":"li"},$h("div",{},$h("div",{"class":"t"},$S($G(v1,"m.party"))),$h("div",{"class":"sub"},$S($G(v1,"m.meta")))),$h("div",{"class":"r"},$h("span",{"class":"num"},"PKR "+$S($G(v1,"m.amt"))),$h("button",{"class":"btn sm","type":"button","onClick":$G(v1,"m.log")},"Log it")))];})))]:null),$h("section",{"class":"card"},$h("div",{"class":"card-h"},$h("h2",{},"By month or period"),$h("label",{"class":"aside field","style":"min-width:220px"},$h("span",{"class":"cap"},"Period"),$h("select",{"value":$V($G(v,"f.ac_month.v")),"onChange":$G(v,"f.ac_month.on")},$h("optgroup",{"label":"Periods"},$h("option",{"value":"r3"},"Last 3 months"),$h("option",{"value":"r6"},"Last 6 months"),$h("option",{"value":"r12"},"Last 12 months (full year)")),$h("optgroup",{"label":"Single month"},$A($G(v,"ac.monthOpts")).map(function(it,ix){var v1=Object.create(v);v1["o"]=it;return [$h("option",{"value":$V($G(v1,"o.v"))},$S($G(v1,"o.l")))];}))))),($T($G(v,"ac.noRows"))?[$h("div",{"class":"empty"},"Nothing on the statements in this period")]:null),($T($G(v,"ac.hasRows"))?[$h("div",{"class":"figs"},$h("div",{"class":"stat"},$h("span",{"class":"lbl"},"In"),$h("span",{"class":"fig"},$h("span",{"class":"cur"},"PKR"),$S($G(v,"ac.inn")))),$h("div",{"class":"stat"},$h("span",{"class":"lbl"},"Out"),$h("span",{"class":"fig"},$h("span",{"class":"cur"},"PKR"),$S($G(v,"ac.out")))),$h("div",{"class":"stat"},$h("span",{"class":"lbl"},"Net"),$h("span",{"class":"fig "+$S($G(v,"ac.netCls"))},$h("span",{"class":"total"},$h("span",{"class":"cur"},"PKR"),$h("span",{"data-count":$S($G(v,"ac.net"))})))),($T($G(v,"ac.hasAvg"))?[$h("div",{"class":"stat"},$h("span",{"class":"lbl"},"Average out a month"),$h("span",{"class":"fig"},$h("span",{"class":"cur"},"PKR"),$S($G(v,"ac.avg"))))]:null),($T($G(v,"ac.hasOwn"))?[$h("div",{"class":"stat"},$h("span",{"class":"lbl"},"Moved between your accounts"),$h("span",{"class":"fig"},$h("span",{"class":"cur"},"PKR"),$S($G(v,"ac.own"))))]:null)),($T($G(v,"ac.range"))?[$h("div",{"class":"months"},$A($G(v,"ac.bars")).map(function(it,ix){var v1=Object.create(v);v1["m"]=it;return [$h("button",{"type":"button","class":"mo","aria-label":$S($G(v1,"m.label")),"onClick":$G(v1,"m.open")},$h("span",{"class":"bb grow"},$h("i",{"class":"in","style":"height:"+$S($G(v1,"m.ih"))+"%"}),$h("i",{"class":"out","style":"height:"+$S($G(v1,"m.oh"))+"%"})),$h("b",{},$S($G(v1,"m.mon"))),$h("small",{},$S($G(v1,"m.net"))))];})),$h("div",{"class":"legend"},$h("span",{},$h("i",{"class":"in"}),"In"),$h("span",{},$h("i",{"class":"out"}),"Out"),$h("span",{},"Tap a month to open it"))]:null),$h("div",{"class":"split rule"},$h("div",{"class":"ranked"},$A($G(v,"ac.cats")).map(function(it,ix){var v1=Object.create(v);v1["c"]=it;return [$h("div",{"class":"rk "+$S($G(v1,"c.cls"))},$h("span",{"class":"nm"},$S($G(v1,"c.c"))),$h("span",{"class":"v"},$S($G(v1,"c.v"))),$h("span",{"class":"p"},$S($G(v1,"c.pct"))),$h("span",{"class":"track"},$h("i",{"style":"width:"+$S($G(v1,"c.w"))+"%"})))];})),$h("div",{},$h("div",{"class":"cap"},"Where it went"),$h("ul",{"class":"toplist"},$A($G(v,"ac.top")).map(function(it,ix){var v1=Object.create(v);v1["t"]=it;return [$h("li",{},$h("span",{},$S($G(v1,"t.p"))),$h("span",{"class":"num"},"PKR "+$S($G(v1,"t.v"))))];}))))]:null)),$h("section",{"class":"card"},$h("div",{"class":"card-h"},$h("h2",{},"Transactions"),$h("span",{"class":"aside"},$S($G(v,"ac.count")))),$h("div",{"class":"filters"},$h("div",{"class":"seg","role":"group","aria-label":"Account"},$A($G(v,"ac.acct")).map(function(it,ix){var v1=Object.create(v);v1["a"]=it;return [$h("button",{"type":"button","aria-pressed":$S($G(v1,"a.pressed")),"onClick":$G(v1,"a.pick")},$S($G(v1,"a.label")))];})),$h("div",{"class":"search"},$h("svg",{"class":"ic","viewBox":"0 0 24 24","aria-hidden":"true"},$h("circle",{"cx":"11","cy":"11","r":"8"}),$h("path",{"d":"m21 21-4.3-4.3"})),$h("input",{"type":"search","placeholder":"Search all months","aria-label":"Search a name, restaurant or note across all months","value":$V($G(v,"f.ac_search.v")),"onInput":$G(v,"f.ac_search.on")}))),$h("div",{"class":"cats","role":"group","aria-label":"Category"},$A($G(v,"ac.catChips")).map(function(it,ix){var v1=Object.create(v);v1["c"]=it;return [$h("button",{"type":"button","class":$S($G(v1,"c.cls")),"aria-pressed":$S($G(v1,"c.pressed")),"onClick":$G(v1,"c.pick")},$S($G(v1,"c.label")))];})),$h("div",{},$A($G(v,"ac.groups")).map(function(it,ix){var v1=Object.create(v);v1["g"]=it;return [$h("div",{"class":"dayhead dmark-row"},$h("b",{},$S($G(v1,"g.dn"))),$h("span",{},$S($G(v1,"g.rest"))),$h("span",{"class":"hj"},$S($G(v1,"g.hj")))),$A($G(v1,"g.rows")).map(function(it,ix){var v2=Object.create(v1);v2["r"]=it;return [$h("div",{"class":"tx tx2 "+$S($G(v2,"r.cls"))},$h("span",{"class":"tx-dot "+$S($G(v2,"r.tagCls")),"aria-hidden":"true"}),$h("div",{},$h("b",{},$S($G(v2,"r.party"))),$h("div",{"class":"tagrow"},$A($G(v2,"r.tags")).map(function(it,ix){var v3=Object.create(v2);v3["g2"]=it;return [$h("span",{"class":"cat-tag "+$S($G(v3,"g2.c"))},$S($G(v3,"g2.t")))];})),$A($G(v2,"r.notes")).map(function(it,ix){var v3=Object.create(v2);v3["n"]=it;return [$h("div",{"class":"nt"},$S($G(v3,"n.n")))];})),$h("div",{"class":"amt"},$h("span",{"class":"num"},$S($G(v2,"r.amt"))),$h("small",{},$S($G(v2,"r.bal")))),($T($G(v2,"r.inApp"))?[$h("div",{"class":"inapp"},$h("span",{"class":"cat-tag t-money-in"},"In the app"),$h("span",{},$S($G(v2,"r.appNote"))),($T($G(v2,"r.food"))?[($T($G(v2,"r.rate.has"))?[$h("button",{"type":"button","class":"rate-chip","onClick":$G(v2,"r.rate.open")},($T($G(v2,"r.rate.label"))?[$h("b",{"class":$S($G(v2,"r.rate.cls"))},$S($G(v2,"r.rate.label")))]:null),($T($G(v2,"r.rate.review"))?[$h("span",{},"\""+$S($G(v2,"r.rate.review"))+"\"")]:null))]:null),($T($G(v2,"r.rate.none"))?[$h("button",{"type":"button","class":"rate-chip","onClick":$G(v2,"r.rate.open")},"How was it?")]:null)]:null))]:null),($T($G(v2,"r.canLog"))?[$h("div",{"class":"inapp"},$h("button",{"class":"btn sm","type":"button","onClick":$G(v2,"r.log")},"Log it in the app"))]:null))];})];}),($T($G(v,"ac.empty"))?[$h("div",{"class":"empty"},"Nothing matches")]:null))))]:null),($T($G(v,"tabs.khums"))?[$h("div",{"class":"page pg-khums"},$h("div",{"class":"head"},$h("div",{},$h("h1",{},"Khums ",$h("span",{"class":"ur","lang":"ur","dir":"rtl"},"خمس")),$h("p",{"class":"meta"},"Sayyid al-Sistani · the year ends on 23 Ramadan · feeds the wasiyat"))),$h("div",{"class":"row"},$h("section",{"class":"card"},$h("div",{"class":"card-h"},$h("h2",{},"This year's estimate"),$h("span",{"class":"aside "+$S($G(v,"km.statusCls"))},$h("span",{"class":"dot"}),$S($G(v,"km.status")))),$h("div",{"class":"khfig"},$h("span",{"class":"sub"},$S($G(v,"km.payable"))),$h("span",{"class":"hero-fig"},$h("span",{"class":"cur"},"about PKR"),$h("span",{"data-count":$S($G(v,"km.est"))})),$h("p",{"class":"note"},$S($G(v,"km.estSub"))),$h("p",{"class":"cap"},$S($G(v,"km.date"))),$h("p",{"class":"cap"},"Last year, "+$S($G(v,"km.last"))))),$h("section",{"class":"card"},$h("div",{"class":"card-h"},$h("h2",{},"How the estimate is worked out")),$h("div",{"class":"calc"},$A($G(v,"km.calc")).map(function(it,ix){var v1=Object.create(v);v1["c"]=it;return [$h("div",{"class":"c "+$S($G(v1,"c.cls"))},$h("span",{},$S($G(v1,"c.l"))),$h("span",{},$S($G(v1,"c.v"))))];})),$h("p",{"class":"cap"},"This estimate leaves out unused items and kitchen stock. Add those on the day, as in past years."))),$h("section",{"class":"card"},$h("div",{"class":"card-h"},$h("h2",{},"The khums year"),$h("span",{"class":"aside"},$S($G(v,"al.daysTo")))),$h("div",{"class":"kstrip","role":"img","aria-label":$S($G(v,"km.payable"))},$h("span",{"class":"ks-track"}),$h("span",{"class":"ks-fill grow-x","style":"width:"+$S($G(v,"al.todayPos"))+"%"}),$A($G(v,"al.months")).map(function(it,ix){var v1=Object.create(v);v1["m"]=it;return [$h("span",{"class":"ks-m "+$S($G(v1,"m.alt")),"style":"left:"+$S($G(v1,"m.pos"))+"%"},$S($G(v1,"m.short")))];}),$h("span",{"class":"ks-today","style":"left:"+$S($G(v,"al.todayPos"))+"%"},$h("span",{},"Today")),$h("span",{"class":"ks-end","aria-hidden":"true"})),$h("div",{"class":"ks-ends"},$h("span",{},$S($G(v,"al.yearStart"))),$h("span",{"class":"circled-t"},$S($G(v,"al.yearEnd")))),$h("p",{"class":"cap"},"Nothing is owed during the year. On 23 Ramadan the year closes and one fifth of the surplus becomes payable")),($T($G(v,"km.unpaid"))?[$h("div",{"class":"banner warn"},$S($G(v,"km.unpaid")))]:null),$h("section",{"class":"card"},$h("div",{"class":"card-h"},$h("h2",{},"Khums years")),($T($G(v,"km.noYears"))?[$h("div",{"class":"empty"},"No khums years recorded yet")]:null),($T($G(v,"km.hasYears"))?[$h("div",{"class":"table-box"},$h("table",{"class":"t"},$h("thead",{},$h("tr",{},$h("th",{},"Year"),$h("th",{},"23 Ramadan"),$h("th",{"class":"r"},"Savings"),$h("th",{"class":"r"},"Mukhamas in"),$h("th",{"class":"r"},"Khums due"),$h("th",{"class":"r"},"Mukhamas out"),$h("th",{},"Paid"))),$h("tbody",{},$A($G(v,"km.years")).map(function(it,ix){var v1=Object.create(v);v1["y"]=it;return [$h("tr",{},$h("td",{"class":"yr"},$h("b",{},$S($G(v1,"y.year"))),$h("div",{"class":"cap"},$S($G(v1,"y.period"))),$h("div",{"class":"cap"},$S($G(v1,"y.greg")))),$h("td",{"class":"mono"},$S($G(v1,"y.date"))),$h("td",{"class":"r mono"},$S($G(v1,"y.sav"))),$h("td",{"class":"r mono"},$S($G(v1,"y.min"))),$h("td",{"class":"r mono"},$S($G(v1,"y.due"))),$h("td",{"class":"r mono"},$S($G(v1,"y.mout"))),$h("td",{"style":"min-width:240px"},$h("span",{"class":$S($G(v1,"y.stCls"))},$S($G(v1,"y.st"))),$A($G(v1,"y.pays")).map(function(it,ix){var v2=Object.create(v1);v2["p"]=it;return [$h("div",{"class":"cap"},$S($G(v2,"p.t")))];}),($T($G(v1,"y.note"))?[$h("div",{"class":"cap"},$S($G(v1,"y.note")))]:null)))];}))))]:null)),$h("div",{"class":"row"},$h("section",{"class":"card"},$h("div",{"class":"card-h"},$h("h2",{},"Record a khums payment")),$h("div",{"class":"form"},$h("label",{"class":"field"},"Khums year",$h("select",{"value":$V($G(v,"f.kp_year.v")),"onChange":$G(v,"f.kp_year.on")},$A($G(v,"km.yearOpts")).map(function(it,ix){var v1=Object.create(v);v1["o"]=it;return [$h("option",{"value":$V($G(v1,"o.v"))},$S($G(v1,"o.l")))];}))),$h("label",{"class":"field"},"Share",$h("select",{"value":$V($G(v,"f.kp_share.v")),"onChange":$G(v,"f.kp_share.on")},$h("option",{},"Sahm-e-Imam"),$h("option",{},"Sahm-e-Sadat"),$h("option",{},"Both halves"))),$h("label",{"class":"field"},"Amount",$h("input",{"type":$S($G(v,"T.num")),"step":"any","min":"0","value":$V($G(v,"f.kp_amt.v")),"onInput":$G(v,"f.kp_amt.on")})),$h("label",{"class":"field"},"Currency",$h("select",{"value":$V($G(v,"f.kp_cur.v")),"onChange":$G(v,"f.kp_cur.on")},$A($G(v,"curs")).map(function(it,ix){var v1=Object.create(v);v1["c"]=it;return [$h("option",{"value":$V($G(v1,"c"))},$S($G(v1,"c")))];}))),$h("label",{"class":"field"},"Date",$h("input",{"type":$S($G(v,"T.date")),"value":$V($G(v,"f.kp_date.v")),"onInput":$G(v,"f.kp_date.on")})),$h("label",{"class":"field full"},"Paid to",$h("input",{"maxlength":"120","placeholder":"Office, representative or recipient","value":$V($G(v,"f.kp_to.v")),"onInput":$G(v,"f.kp_to.on")})),$h("div",{"class":"full"},$h("button",{"class":"btn pri","type":"button","onClick":$G(v,"km.savePay")},"Save payment")))),$h("section",{"class":"card"},$h("div",{"class":"card-h"},$h("h2",{},"Close the year on 23 Ramadan")),$h("p",{"class":"note"},"Enter the figures worked out on the day. The year joins the table, its mukhamas becomes next year's carry, and the wasiyat picks up anything left unpaid."),$h("div",{"class":"form"},$h("label",{"class":"field"},"Year",$h("input",{"maxlength":"20","value":$V($G(v,"f.kc_year.v")),"onInput":$G(v,"f.kc_year.on")})),$h("label",{"class":"field"},"Date",$h("input",{"type":$S($G(v,"T.date")),"value":$V($G(v,"f.kc_date.v")),"onInput":$G(v,"f.kc_date.on")})),$h("label",{"class":"field"},"Savings counted",$h("input",{"type":$S($G(v,"T.num")),"step":"any","min":"0","value":$V($G(v,"f.kc_sav.v")),"onInput":$G(v,"f.kc_sav.on")})),$h("label",{"class":"field"},"Khums due",$h("input",{"type":$S($G(v,"T.num")),"step":"any","min":"0","value":$V($G(v,"f.kc_due.v")),"onInput":$G(v,"f.kc_due.on")})),$h("label",{"class":"field"},"Mukhamas out",$h("input",{"type":$S($G(v,"T.num")),"step":"any","min":"0","value":$V($G(v,"f.kc_out.v")),"onInput":$G(v,"f.kc_out.on")})),$h("label",{"class":"field"},"Currency",$h("select",{"value":$V($G(v,"f.kc_cur.v")),"onChange":$G(v,"f.kc_cur.on")},$A($G(v,"curs")).map(function(it,ix){var v1=Object.create(v);v1["c"]=it;return [$h("option",{"value":$V($G(v1,"c"))},$S($G(v1,"c")))];}))),$h("label",{"class":"field"},"Next khums date",$h("input",{"type":$S($G(v,"T.date")),"value":$V($G(v,"f.kc_next.v")),"onInput":$G(v,"f.kc_next.on")})),$h("label",{"class":"field"},"Next year label",$h("input",{"maxlength":"20","value":$V($G(v,"f.kc_nextLabel.v")),"onInput":$G(v,"f.kc_nextLabel.on")})),$h("div",{"class":"full"},$h("button",{"class":"btn pri","type":"button","onClick":$G(v,"km.closeYear")},"Close the year"))))))]:null),($T($G(v,"tabs.wajibat"))?[$h("div",{"class":"page pg-wajibat"},$h("div",{"class":"head"},$h("div",{},$h("h1",{},"Wajibat ",$h("span",{"class":"ur","lang":"ur","dir":"rtl"},"واجبات")),$h("p",{"class":"meta"},"Qaza, dues and trusts")),$h("button",{"class":"btn pri","type":"button","onClick":$G(v,"wj.fullDay")},$h("svg",{"class":"ic","viewBox":"0 0 24 24","aria-hidden":"true"},$h("path",{"d":"M20 6 9 17l-5-5"})),"Offered a full day (5 prayers)")),$h("div",{"class":"stats five"},$A($G(v,"wj.stats")).map(function(it,ix){var v1=Object.create(v);v1["x"]=it;return [$h("div",{"class":"tile"},$h("span",{"class":"sub"},$S($G(v1,"x.label"))),$h("span",{"class":"fig "+$S($G(v1,"x.cls"))},$S($G(v1,"x.value"))),$h("span",{"class":"cap"},$S($G(v1,"x.sub"))))];})),$h("section",{"class":"card"},$h("div",{"class":"card-h"},$h("h2",{},"Qaza namaz ",$h("span",{"class":"ur","lang":"ur","dir":"rtl"},"قضا نمازیں")),$h("span",{"class":"aside"},"Offered takes one off. Missed adds one")),$h("div",{"class":"qlist"},$A($G(v,"wj.prayers")).map(function(it,ix){var v1=Object.create(v);v1["p"]=it;return [$h("div",{"class":"qrow"},$h("div",{"class":"nm"},$h("b",{},$S($G(v1,"p.en"))),$h("span",{"class":"ur","lang":"ur","dir":"rtl"},$S($G(v1,"p.ur")))),$h("span",{"class":"n "+$S($G(v1,"p.zero"))},$S($G(v1,"p.n"))),$h("div",{"class":"acts"},$h("button",{"class":"btn sm","type":"button","disabled":$B($G(v1,"p.noneOwed")),"onClick":$G(v1,"p.offered")},$h("svg",{"class":"ic","viewBox":"0 0 24 24","aria-hidden":"true"},$h("path",{"d":"M20 6 9 17l-5-5"})),"Offered"),$h("button",{"class":"btn sm","type":"button","onClick":$G(v1,"p.missed")},$h("svg",{"class":"ic","viewBox":"0 0 24 24","aria-hidden":"true"},$h("path",{"d":"M5 12h14"}),$h("path",{"d":"M12 5v14"})),"Missed")))];})),$h("div",{"class":"inline rule"},$h("span",{"class":"sub","style":"flex:1"},"Roza qaza"),$h("button",{"class":"btn sm","type":"button","onClick":$G(v,"wj.rozaMinus")},"Kept one"),$h("span",{"class":"num","style":"min-width:32px;text-align:center"},$S($G(v,"wj.roza"))),$h("button",{"class":"btn sm","type":"button","onClick":$G(v,"wj.rozaPlus")},"Missed one")),$h("div",{},$h("div",{"class":"cap","style":"margin-bottom:8px"},"Recent changes"),($T($G(v,"wj.hasLog"))?[$h("ul",{"class":"log"},$A($G(v,"wj.log")).map(function(it,ix){var v1=Object.create(v);v1["l"]=it;return [$h("li",{},$h("span",{"class":"num"},$S($G(v1,"l.when"))),$S($G(v1,"l.what")))];}))]:null),($T($G(v,"wj.noLog"))?[$h("p",{"class":"sub"},"No changes logged yet")]:null))),$h("div",{"class":"row"},$h("section",{"class":"card"},$h("div",{"class":"card-h"},$h("h2",{},"Dues and trusts ",$h("span",{"class":"ur","lang":"ur","dir":"rtl"},"مالی واجبات اور امانتیں"))),($T($G(v,"wj.unclear"))?[$h("div",{"class":"banner warn"},$S($G(v,"wj.unclear")))]:null),$h("p",{"class":"note"},"Khums comes live from the Khums tab and debts from Money, so they are not repeated here."),$h("div",{},$h("button",{"class":"btn","type":"button","onClick":$G(v,"wj.addItem")},$h("svg",{"class":"ic","viewBox":"0 0 24 24","aria-hidden":"true"},$h("path",{"d":"M5 12h14"}),$h("path",{"d":"M12 5v14"})),"Add an obligation")),($T($G(v,"wj.form"))?[$h("div",{"class":"form","style":"padding:16px;border:1px solid var(--line2);border-radius:8px"},$h("label",{"class":"field"},"Type",$h("select",{"value":$V($G(v,"f.it_type.v")),"onChange":$G(v,"f.it_type.on")},$A($G(v,"wj.typeOpts")).map(function(it,ix){var v1=Object.create(v);v1["o"]=it;return [$h("option",{"value":$V($G(v1,"o.v"))},$S($G(v1,"o.l")))];}))),$h("label",{"class":"field"},"Status",$h("select",{"value":$V($G(v,"f.it_status.v")),"onChange":$G(v,"f.it_status.on")},$A($G(v,"wj.statusOpts")).map(function(it,ix){var v1=Object.create(v);v1["o"]=it;return [$h("option",{"value":$V($G(v1,"o.v"))},$S($G(v1,"o.l")))];}))),$h("label",{"class":"field"},"Title (English)",$h("input",{"value":$V($G(v,"f.it_title.v")),"onInput":$G(v,"f.it_title.on")})),$h("label",{"class":"field"},"Title (Urdu)",$h("input",{"class":"ur","dir":"rtl","lang":"ur","value":$V($G(v,"f.it_title_ur.v")),"onInput":$G(v,"f.it_title_ur.on")})),$h("label",{"class":"field"},"Amount",$h("input",{"inputmode":"decimal","value":$V($G(v,"f.it_amount.v")),"onInput":$G(v,"f.it_amount.on")})),$h("label",{"class":"field"},"Currency",$h("select",{"value":$V($G(v,"f.it_currency.v")),"onChange":$G(v,"f.it_currency.on")},$A($G(v,"curs")).map(function(it,ix){var v1=Object.create(v);v1["c"]=it;return [$h("option",{"value":$V($G(v1,"c"))},$S($G(v1,"c")))];}))),$h("label",{"class":"field"},"Contact",$h("input",{"dir":"ltr","value":$V($G(v,"f.it_contact.v")),"onInput":$G(v,"f.it_contact.on")})),$h("label",{"class":"field full"},"Note (English)",$h("textarea",{"value":$V($G(v,"f.it_note.v")),"onInput":$G(v,"f.it_note.on")})),$h("label",{"class":"field full"},"Note (Urdu, optional)",$h("textarea",{"class":"ur","dir":"rtl","lang":"ur","value":$V($G(v,"f.it_note_ur.v")),"onInput":$G(v,"f.it_note_ur.on")})),$h("div",{"class":"full inline"},($T($G(v,"wj.formNew"))?[$h("button",{"class":"btn pri","type":"button","onClick":$G(v,"wj.saveItem")},"Add")]:null),($T($G(v,"wj.formOld"))?[$h("button",{"class":"btn pri","type":"button","onClick":$G(v,"wj.saveItem")},"Save changes")]:null),$h("button",{"class":"btn","type":"button","onClick":$G(v,"wj.cancelItem")},"Cancel"),($T($G(v,"wj.formOld"))?[$h("button",{"class":"btn quiet danger","type":"button","style":"margin-inline-start:auto","onClick":$G(v,"wj.delItem")},$S($G(v,"wj.delLabel")))]:null)))]:null),$h("div",{"class":"list"},$A($G(v,"wj.items")).map(function(it,ix){var v1=Object.create(v);v1["it"]=it;return [$h("div",{"class":"li"},$h("div",{},$h("div",{"class":"t"},$S($G(v1,"it.title")),($T($G(v1,"it.titleUr"))?[$h("span",{"class":"ur","lang":"ur","dir":"rtl"},$S($G(v1,"it.titleUr")))]:null)),$h("div",{"class":"cap"},$S($G(v1,"it.meta"))),($T($G(v1,"it.note"))?[$h("p",{"class":"note","style":"margin-top:4px"},$S($G(v1,"it.note")))]:null)),$h("div",{"class":"r"},$h("span",{"class":"num"},$S($G(v1,"it.amt"))),($T($G(v1,"it.of"))?[$h("span",{"class":"cap"},$S($G(v1,"it.of")))]:null)),$h("div",{"class":"full inline"},($T($G(v1,"it.canClear"))?[$h("button",{"class":"btn sm","type":"button","onClick":$G(v1,"it.clear")},"Mark cleared")]:null),$h("button",{"class":"btn sm quiet","type":"button","onClick":$G(v1,"it.edit")},"Edit")))];}),($T($G(v,"wj.noItems"))?[$h("div",{"class":"empty"},"Nothing pending")]:null)),$h("details",{"class":"more"},$h("summary",{},$h("svg",{"class":"ic","viewBox":"0 0 24 24","aria-hidden":"true"},$h("path",{"d":"m9 18 6-6-6-6"})),$h("span",{},"Cleared items ("+$S($G(v,"wj.clearedN"))+")")),$h("div",{"class":"list"},$A($G(v,"wj.cleared")).map(function(it,ix){var v1=Object.create(v);v1["it"]=it;return [$h("div",{"class":"li"},$h("div",{},$h("div",{"class":"t"},$S($G(v1,"it.title"))),$h("div",{"class":"cap"},$S($G(v1,"it.meta")))),$h("div",{"class":"r"},$h("span",{"class":"num"},$S($G(v1,"it.amt")))),$h("div",{"class":"full inline"},$h("button",{"class":"btn sm quiet","type":"button","onClick":$G(v1,"it.edit")},"Edit")))];}),($T($G(v,"wj.noCleared"))?[$h("div",{"class":"empty"},"No cleared items yet")]:null)))),$h("section",{"class":"card"},$h("div",{"class":"card-h"},$h("h2",{},"Wasiyat details ",$h("span",{"class":"ur","lang":"ur","dir":"rtl"},"وصیت کی تفصیلات"))),$h("div",{"class":"form"},$A($G(v,"wj.profile")).map(function(it,ix){var v1=Object.create(v);v1["p"]=it;return [$h("label",{"class":$S($G(v1,"p.full")),"for":$S($G(v1,"p.id"))},$S($G(v1,"p.label")),($T($G(v1,"p.plain"))?[$h("input",{"id":$S($G(v1,"p.id")),"autocomplete":"off","value":$V($G(v1,"p.v")),"onInput":$G(v1,"p.on")})]:null),($T($G(v1,"p.ur"))?[$h("input",{"id":$S($G(v1,"p.id")),"class":"ur","dir":"rtl","lang":"ur","autocomplete":"off","value":$V($G(v1,"p.v")),"onInput":$G(v1,"p.on")})]:null),($T($G(v1,"p.ltr"))?[$h("input",{"id":$S($G(v1,"p.id")),"dir":"ltr","autocomplete":"off","value":$V($G(v1,"p.v")),"onInput":$G(v1,"p.on")})]:null),($T($G(v1,"p.area"))?[$h("textarea",{"id":$S($G(v1,"p.id")),"value":$V($G(v1,"p.v")),"onInput":$G(v1,"p.on")})]:null),($T($G(v1,"p.urarea"))?[$h("textarea",{"id":$S($G(v1,"p.id")),"class":"ur","dir":"rtl","lang":"ur","value":$V($G(v1,"p.v")),"onInput":$G(v1,"p.on")})]:null))];}),$h("div",{"class":"full"},$h("button",{"class":"btn pri","type":"button","onClick":$G(v,"wj.saveProfile")},"Save details"))))))]:null),($T($G(v,"tabs.wasiyat"))?[$h("div",{"class":"page pg-wasiyat"},$h("div",{"class":"head"},$h("div",{},$h("h1",{},"Wasiyat nama ",$h("span",{"class":"ur","lang":"ur","dir":"rtl"},"وصیت نامہ")),$h("p",{"class":"meta"},"Rebuilt live from qaza, dues, debts and the khums ledger")),$h("div",{"class":"actions"},$h("button",{"class":"btn","type":"button","onClick":$G(v,"ws.copyUr")},$h("svg",{"class":"ic","viewBox":"0 0 24 24","aria-hidden":"true"},$h("rect",{"width":"14","height":"14","x":"8","y":"8","rx":"2"}),$h("path",{"d":"M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"})),"Copy Urdu"),$h("button",{"class":"btn","type":"button","onClick":$G(v,"ws.copyEn")},$h("svg",{"class":"ic","viewBox":"0 0 24 24","aria-hidden":"true"},$h("rect",{"width":"14","height":"14","x":"8","y":"8","rx":"2"}),$h("path",{"d":"M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"})),"Copy English"),$h("button",{"class":"btn","type":"button","onClick":$G(v,"ws.download")},$h("svg",{"class":"ic","viewBox":"0 0 24 24","aria-hidden":"true"},$h("path",{"d":"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"}),$h("path",{"d":"m7 10 5 5 5-5"}),$h("path",{"d":"M12 15V3"})),"Download"),$h("button",{"class":"btn","type":"button","onClick":$G(v,"ws.print")},$h("svg",{"class":"ic","viewBox":"0 0 24 24","aria-hidden":"true"},$h("path",{"d":"M6 9V2h12v7"}),$h("path",{"d":"M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"}),$h("rect",{"width":"12","height":"8","x":"6","y":"14"})),"Print to sign"),$h("button",{"class":"btn pri","type":"button","onClick":$G(v,"ws.send")},$h("svg",{"class":"ic","viewBox":"0 0 24 24","aria-hidden":"true"},$h("path",{"d":"m22 2-7 20-4-9-9-4Z"}),$h("path",{"d":"M22 2 11 13"})),"Send to executors"))),$h("div",{"class":$S($G(v,"ws.bannerCls"))},$S($G(v,"ws.banner"))+" ",($T($G(v,"ws.hasMiss"))?[$h("button",{"class":"linkbtn","type":"button","onClick":$G(v,"ws.goCheck")},"See the checkup")]:null)),$h("div",{"class":"leaves"},$h("article",{"class":"leaf ur-leaf","lang":"ur","dir":"rtl"},$A($G(v,"ws.ur")).map(function(it,ix){var v1=Object.create(v);v1["b"]=it;return [($T($G(v1,"b.bism"))?[$h("div",{"class":"bism","lang":"ar"},$S($G(v1,"b.text")))]:null),($T($G(v1,"b.h3"))?[$h("h3",{},$S($G(v1,"b.text")))]:null),($T($G(v1,"b.clause"))?[$h("p",{},$h("span",{"class":"clause"},$S($G(v1,"b.text"))))]:null),($T($G(v1,"b.p"))?[$h("p",{},$A($G(v1,"b.segs")).map(function(it,ix){var v2=Object.create(v1);v2["s"]=it;return [($T($G(v2,"s.plain"))?[$S($G(v2,"s.t"))]:null),($T($G(v2,"s.ltr"))?[$h("bdi",{"dir":"ltr"},$S($G(v2,"s.t")))]:null),($T($G(v2,"s.iso"))?[$h("bdi",{},$S($G(v2,"s.t")))]:null),($T($G(v2,"s.blank"))?[$h("span",{"class":"blank"},$S($G(v2,"s.t")))]:null)];}))]:null),($T($G(v1,"b.ul"))?[$h("ul",{},$A($G(v1,"b.items")).map(function(it,ix){var v2=Object.create(v1);v2["it"]=it;return [$h("li",{},$A($G(v2,"it.segs")).map(function(it,ix){var v3=Object.create(v2);v3["s"]=it;return [($T($G(v3,"s.plain"))?[$S($G(v3,"s.t"))]:null),($T($G(v3,"s.ltr"))?[$h("bdi",{"dir":"ltr"},$S($G(v3,"s.t")))]:null),($T($G(v3,"s.iso"))?[$h("bdi",{},$S($G(v3,"s.t")))]:null),($T($G(v3,"s.blank"))?[$h("span",{"class":"blank"},$S($G(v3,"s.t")))]:null)];}))];}))]:null),($T($G(v1,"b.sig"))?[$h("div",{"class":"sig"},$A($G(v1,"b.lines")).map(function(it,ix){var v2=Object.create(v1);v2["l"]=it;return [$h("div",{},$S($G(v2,"l.t")))];}))]:null),($T($G(v1,"b.stamp"))?[$h("div",{"class":"stamp"},$S($G(v1,"b.text")))]:null)];})),$h("article",{"class":"leaf en-leaf","lang":"en"},$A($G(v,"ws.en")).map(function(it,ix){var v1=Object.create(v);v1["b"]=it;return [($T($G(v1,"b.bism"))?[$h("div",{"class":"bism","lang":"ar","dir":"rtl"},$S($G(v1,"b.text")))]:null),($T($G(v1,"b.h3"))?[$h("h3",{},$S($G(v1,"b.text")))]:null),($T($G(v1,"b.clause"))?[$h("p",{},$h("span",{"class":"clause"},$S($G(v1,"b.text"))))]:null),($T($G(v1,"b.p"))?[$h("p",{},$A($G(v1,"b.segs")).map(function(it,ix){var v2=Object.create(v1);v2["s"]=it;return [($T($G(v2,"s.plain"))?[$S($G(v2,"s.t"))]:null),($T($G(v2,"s.ltr"))?[$h("bdi",{"dir":"ltr"},$S($G(v2,"s.t")))]:null),($T($G(v2,"s.iso"))?[$h("bdi",{},$S($G(v2,"s.t")))]:null),($T($G(v2,"s.blank"))?[$h("span",{"class":"blank"},$S($G(v2,"s.t")))]:null)];}))]:null),($T($G(v1,"b.ul"))?[$h("ul",{},$A($G(v1,"b.items")).map(function(it,ix){var v2=Object.create(v1);v2["it"]=it;return [$h("li",{},$A($G(v2,"it.segs")).map(function(it,ix){var v3=Object.create(v2);v3["s"]=it;return [($T($G(v3,"s.plain"))?[$S($G(v3,"s.t"))]:null),($T($G(v3,"s.blank"))?[$h("span",{"class":"blank"},$S($G(v3,"s.t")))]:null)];}))];}))]:null),($T($G(v1,"b.sig"))?[$h("div",{"class":"sig"},$A($G(v1,"b.lines")).map(function(it,ix){var v2=Object.create(v1);v2["l"]=it;return [$h("div",{},$S($G(v2,"l.t")))];}))]:null),($T($G(v1,"b.stamp"))?[$h("div",{"class":"stamp"},$S($G(v1,"b.text")))]:null)];}))),$h("section",{"class":"card"},$h("div",{"class":"card-h"},$h("h2",{},"Rulings this follows ",$h("span",{"class":"ur","lang":"ur","dir":"rtl"},"مسائل، آیت اللہ العظمیٰ سید علی حسینی سیستانی دام ظلہ العالی"))),$h("ul",{"class":"rules"},$A($G(v,"ws.rules")).map(function(it,ix){var v1=Object.create(v);v1["r"]=it;return [$h("li",{},$h("b",{},$S($G(v1,"r.topic"))),": "+$S($G(v1,"r.summary"))+" ",$h("span",{"class":"mut"},"("+$S($G(v1,"r.ref"))+")")," ",$h("a",{"href":$S($G(v1,"r.url")),"target":"_blank","rel":"noopener"},"Source"))];}))))]:null),($T($G(v,"tabs.settings"))?[$h("div",{"class":"page pg-settings"},$h("div",{"class":"head"},$h("div",{},$h("h1",{},"Settings"),$h("p",{"class":"meta"},"Connection, pay cycle, rates, khums year"))),$h("div",{"class":"row"},$h("div",{"class":"stack"},$h("section",{"class":"card"},$h("div",{"class":"card-h"},$h("h2",{},"Private data connection"),$h("span",{"class":"aside mut"},"Same connection as the classic view")),$h("div",{"class":"form"},$h("label",{"class":"field"},"Owner",$h("input",{"autocomplete":"off","value":$V($G(v,"f.c_owner.v")),"onInput":$G(v,"f.c_owner.on")})),$h("label",{"class":"field"},"Private data repo",$h("input",{"autocomplete":"off","value":$V($G(v,"f.c_repo.v")),"onInput":$G(v,"f.c_repo.on")})),$h("label",{"class":"field"},"File path",$h("input",{"autocomplete":"off","value":$V($G(v,"f.c_path.v")),"onInput":$G(v,"f.c_path.on")})),$h("label",{"class":"field"},"Branch, blank for default",$h("input",{"autocomplete":"off","value":$V($G(v,"f.c_branch.v")),"onInput":$G(v,"f.c_branch.on")})),$h("label",{"class":"field full"},"GitHub token",$h("input",{"type":"password","autocomplete":"off","placeholder":"github_pat_","value":$V($G(v,"f.c_token.v")),"onInput":$G(v,"f.c_token.on")})),$h("p",{"class":"full cap"},"Fine-grained token: only the data repo, permission Contents read and write. Kept in this browser only. Use Forget on shared devices."),$h("div",{"class":"full inline"},$h("button",{"class":"btn pri","type":"button","onClick":$G(v,"se.connect")},"Connect"),$h("button",{"class":"btn","type":"button","onClick":$G(v,"se.forget")},"Forget token on this device"))))),$h("section",{"class":"card"},$h("div",{"class":"card-h"},$h("h2",{},"Money and khums settings")),$h("details",{"class":"more"},$h("summary",{},$h("svg",{"class":"ic","viewBox":"0 0 24 24","aria-hidden":"true"},$h("path",{"d":"m9 18 6-6-6-6"})),"I got paid, start a new cycle"),$h("div",{"class":"form"},$h("label",{"class":"field"},"Amount received (PKR)",$h("input",{"type":$S($G(v,"T.num")),"min":"0","step":"any","value":$V($G(v,"f.p_amount.v")),"onInput":$G(v,"f.p_amount.on")})),$h("label",{"class":"field"},"Received on",$h("input",{"type":$S($G(v,"T.date")),"value":$V($G(v,"f.p_date.v")),"onInput":$G(v,"f.p_date.on")})),$h("p",{"class":"full note"},$S($G(v,"se.payPreview"))),($T($G(v,"se.payEarly"))?[$h("p",{"class":"full note warn-t"},$S($G(v,"se.payEarly")))]:null),$h("div",{"class":"full"},$h("button",{"class":"btn pri","type":"button","onClick":$G(v,"se.startCycle")},$S($G(v,"se.payLabel")))))),$h("details",{"class":"more"},$h("summary",{},$h("svg",{"class":"ic","viewBox":"0 0 24 24","aria-hidden":"true"},$h("path",{"d":"m9 18 6-6-6-6"})),"Exchange rates, PKR per 1 unit"),$h("div",{"class":"form"},$A($G(v,"se.rates")).map(function(it,ix){var v1=Object.create(v);v1["r"]=it;return [$h("label",{"class":"field","for":$S($G(v1,"r.id"))},$S($G(v1,"r.n")),$h("input",{"id":$S($G(v1,"r.id")),"type":$S($G(v1,"T.num")),"step":"any","min":"0","value":$V($G(v1,"r.v")),"onInput":$G(v1,"r.on")}))];}),$h("p",{"class":"full cap"},"Entries keep the PKR value at the rate in force when logged."),$h("div",{"class":"full"},$h("button",{"class":"btn pri","type":"button","onClick":$G(v,"se.saveRates")},"Save rates")))),$h("details",{"class":"more"},$h("summary",{},$h("svg",{"class":"ic","viewBox":"0 0 24 24","aria-hidden":"true"},$h("path",{"d":"m9 18 6-6-6-6"})),"Budget caps, savings and wajibat set-aside"),$h("div",{"class":"form"},$h("label",{"class":"field"},"Nashta cap per order",$h("input",{"type":$S($G(v,"T.num")),"min":"0","value":$V($G(v,"f.s_nashta.v")),"onInput":$G(v,"f.s_nashta.on")})),$h("label",{"class":"field"},"Dinner cap per order",$h("input",{"type":$S($G(v,"T.num")),"min":"0","value":$V($G(v,"f.s_dinner.v")),"onInput":$G(v,"f.s_dinner.on")})),$h("label",{"class":"field"},"Snack cap per order",$h("input",{"type":$S($G(v,"T.num")),"min":"0","value":$V($G(v,"f.s_snack.v")),"onInput":$G(v,"f.s_snack.on")})),$h("label",{"class":"field"},"Nashta orders per cycle",$h("input",{"type":$S($G(v,"T.num")),"min":"0","value":$V($G(v,"f.s_nashtaN.v")),"onInput":$G(v,"f.s_nashtaN.on")})),$h("label",{"class":"field"},"Dinner orders per cycle",$h("input",{"type":$S($G(v,"T.num")),"min":"0","value":$V($G(v,"f.s_dinnerN.v")),"onInput":$G(v,"f.s_dinnerN.on")})),$h("label",{"class":"field"},"Snacks per cycle",$h("input",{"type":$S($G(v,"T.num")),"min":"0","value":$V($G(v,"f.s_snackN.v")),"onInput":$G(v,"f.s_snackN.on")})),$h("label",{"class":"field"},"Other food per cycle (PKR)",$h("input",{"type":$S($G(v,"T.num")),"min":"0","value":$V($G(v,"f.s_other.v")),"onInput":$G(v,"f.s_other.on")})),$h("label",{"class":"field"},"Pay per 4 weeks (PKR)",$h("input",{"type":$S($G(v,"T.num")),"min":"0","value":$V($G(v,"f.s_pay.v")),"onInput":$G(v,"f.s_pay.on")})),$h("label",{"class":"field"},"Save per cycle (PKR)",$h("input",{"type":$S($G(v,"T.num")),"min":"0","value":$V($G(v,"f.s_save.v")),"onInput":$G(v,"f.s_save.on")})),$h("label",{"class":"field"},"Wajibat set-aside per cycle (PKR)",$h("input",{"type":$S($G(v,"T.num")),"min":"0","value":$V($G(v,"f.s_waj.v")),"onInput":$G(v,"f.s_waj.on")})),$h("label",{"class":"field"},"Cycle opening balance (PKR)",$h("input",{"type":$S($G(v,"T.num")),"min":"0","value":$V($G(v,"f.s_open.v")),"onInput":$G(v,"f.s_open.on")})),$h("label",{"class":"field"},"Cycle started",$h("input",{"type":$S($G(v,"T.date")),"value":$V($G(v,"f.s_start.v")),"onInput":$G(v,"f.s_start.on")})),$h("label",{"class":"field"},"Next pay date",$h("input",{"type":$S($G(v,"T.date")),"value":$V($G(v,"f.s_next.v")),"onInput":$G(v,"f.s_next.on")})),$h("div",{"class":"full"},$h("button",{"class":"btn pri","type":"button","onClick":$G(v,"se.saveCaps")},"Save settings")))),$h("details",{"class":"more"},$h("summary",{},$h("svg",{"class":"ic","viewBox":"0 0 24 24","aria-hidden":"true"},$h("path",{"d":"m9 18 6-6-6-6"})),"Khums year, date and mukhamas carried in"),$h("div",{"class":"form"},$h("label",{"class":"field"},"Current khums year",$h("input",{"maxlength":"20","value":$V($G(v,"f.k_label.v")),"onInput":$G(v,"f.k_label.on")})),$h("label",{"class":"field"},"Gregorian span",$h("input",{"maxlength":"40","value":$V($G(v,"f.k_greg.v")),"onInput":$G(v,"f.k_greg.on")})),$h("label",{"class":"field"},"Khums date (23 Ramadan)",$h("input",{"type":$S($G(v,"T.date")),"value":$V($G(v,"f.k_next.v")),"onInput":$G(v,"f.k_next.on")})),$h("label",{"class":"field"},"Mukhamas carried in (PKR)",$h("input",{"type":$S($G(v,"T.num")),"step":"any","min":"0","value":$V($G(v,"f.k_carry.v")),"onInput":$G(v,"f.k_carry.on")})),$h("div",{"class":"full"},$h("button",{"class":"btn pri","type":"button","onClick":$G(v,"se.saveKh")},"Save khums settings")))))))]:null)))),$h("nav",{"class":"bnav","aria-label":"Quick"},$h("button",{"type":"button","class":$S($G(v,"nav.today")),"onClick":$G(v,"go.today")},$h("svg",{"class":"ic","viewBox":"0 0 24 24","aria-hidden":"true"},$h("rect",{"width":"18","height":"18","x":"3","y":"4","rx":"2"}),$h("path",{"d":"M16 2v4"}),$h("path",{"d":"M8 2v4"}),$h("path",{"d":"M3 10h18"})),"Today"),$h("button",{"type":"button","class":$S($G(v,"nav.money")),"onClick":$G(v,"go.money")},$h("svg",{"class":"ic","viewBox":"0 0 24 24","aria-hidden":"true"},$h("path",{"d":"M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"}),$h("path",{"d":"M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"})),"Money"),$h("button",{"type":"button","class":"add","aria-label":"Add spending","onClick":$G(v,"openAdd")},$h("svg",{"class":"ic","viewBox":"0 0 24 24","aria-hidden":"true"},$h("path",{"d":"M5 12h14"}),$h("path",{"d":"M12 5v14"}))),$h("button",{"type":"button","class":$S($G(v,"nav.wajibat")),"onClick":$G(v,"go.wajibat")},$h("svg",{"class":"ic","viewBox":"0 0 24 24","aria-hidden":"true"},$h("path",{"d":"m3 17 2 2 4-4"}),$h("path",{"d":"m3 7 2 2 4-4"}),$h("path",{"d":"M13 6h8"}),$h("path",{"d":"M13 12h8"}),$h("path",{"d":"M13 18h8"})),"Wajibat"),$h("button",{"type":"button","class":$S($G(v,"bnavPlan")),"onClick":$G(v,"go.planner")},$h("svg",{"class":"ic","viewBox":"0 0 24 24","aria-hidden":"true"},$h("path",{"d":"M21 4h-7"}),$h("path",{"d":"M10 4H3"}),$h("path",{"d":"M21 12h-9"}),$h("path",{"d":"M8 12H3"}),$h("path",{"d":"M21 20h-5"}),$h("path",{"d":"M12 20H3"}),$h("path",{"d":"M14 2v4"}),$h("path",{"d":"M8 10v4"}),$h("path",{"d":"M16 18v4"})),"Plan")),($T($G(v,"menu"))?[$h("div",{"class":"overlay menu","onClick":$G(v,"menuBack")},$h("div",{"class":"menu-sheet","role":"dialog","aria-modal":"true","aria-label":"Menu"},$h("div",{"class":"sheet-h"},$h("div",{"class":"brand","style":"padding:0 8px"},$h("b",{},"Daily Affairs"),$h("span",{"class":"ur","lang":"ur","dir":"rtl"},"روزمرہ امور")),$h("button",{"class":"iconbtn","type":"button","aria-label":"Close the menu","onClick":$G(v,"closeMenu")},$h("svg",{"class":"ic","viewBox":"0 0 24 24","aria-hidden":"true"},$h("path",{"d":"M18 6 6 18"}),$h("path",{"d":"m6 6 12 12"})))),$h("nav",{"class":"nav","aria-label":"Sections"},$h("button",{"class":"navbtn "+$S($G(v,"nav.today")),"type":"button","onClick":$G(v,"go.today")},"Today"),$h("button",{"class":"navbtn "+$S($G(v,"nav.prayers")),"type":"button","onClick":$G(v,"go.prayers")},"Prayer times",$h("span",{"class":"ur","lang":"ur","dir":"rtl"},"اوقاتِ نماز")),$h("button",{"class":"navbtn "+$S($G(v,"nav.planner")),"type":"button","onClick":$G(v,"go.planner")},"Planners"),$h("button",{"class":"navbtn "+$S($G(v,"nav.money")),"type":"button","onClick":$G(v,"go.money")},"Money"),$h("button",{"class":"navbtn "+$S($G(v,"nav.accounts")),"type":"button","onClick":$G(v,"go.accounts")},"Accounts"),$h("button",{"class":"navbtn "+$S($G(v,"nav.khums")),"type":"button","onClick":$G(v,"go.khums")},"Khums",$h("span",{"class":"ur","lang":"ur","dir":"rtl"},"خمس")),$h("button",{"class":"navbtn "+$S($G(v,"nav.wajibat")),"type":"button","onClick":$G(v,"go.wajibat")},"Wajibat",$h("span",{"class":"ur","lang":"ur","dir":"rtl"},"واجبات")),$h("button",{"class":"navbtn "+$S($G(v,"nav.wasiyat")),"type":"button","onClick":$G(v,"go.wasiyat")},"Wasiyat",$h("span",{"class":"ur","lang":"ur","dir":"rtl"},"وصیت")),$h("button",{"class":"navbtn "+$S($G(v,"nav.settings")),"type":"button","onClick":$G(v,"go.settings")},"Settings")),$h("div",{"class":"side-foot"},$h("p",{},$S($G(v,"sync.text"))))))]:null),($T($G(v,"sheetAdd"))?[$h("div",{"class":"overlay","onClick":$G(v,"add.back")},$h("div",{"class":"sheet","role":"dialog","aria-modal":"true","aria-label":"Add spending"},$h("div",{"class":"sheet-h"},$h("h2",{},$S($G(v,"add.title"))),$h("button",{"class":"btn sm quiet","type":"button","onClick":$G(v,"add.close")},"Cancel")),$h("div",{"class":"choices seg","role":"group","aria-label":"Kind of entry"},$A($G(v,"add.modes")).map(function(it,ix){var v1=Object.create(v);v1["m"]=it;return [$h("button",{"type":"button","class":"choice","aria-pressed":$S($G(v1,"m.pressed")),"onClick":$G(v1,"m.pick")},$S($G(v1,"m.label")))];})),($T($G(v,"add.mSpend"))?[$h("div",{"class":"amount"},$h("span",{},$S($G(v,"f.add_cur.v"))),$h("input",{"id":"fAmount","type":$S($G(v,"T.num")),"inputmode":"decimal","min":"0","step":"any","placeholder":"0","aria-label":"You paid","value":$V($G(v,"f.add_amount.v")),"onInput":$G(v,"f.add_amount.on")})),$h("div",{"class":"choices","role":"group","aria-label":"What was it"},$A($G(v,"add.meals")).map(function(it,ix){var v1=Object.create(v);v1["m"]=it;return [$h("button",{"type":"button","class":"choice","aria-pressed":$S($G(v1,"m.pressed")),"onClick":$G(v1,"m.pick")},$S($G(v1,"m.label")))];})),$h("div",{"class":"form"},$h("label",{"class":"field"},"Category",$h("select",{"id":"fCat","value":$V($G(v,"f.add_cat.v")),"onChange":$G(v,"f.add_cat.on")},$A($G(v,"add.cats")).map(function(it,ix){var v1=Object.create(v);v1["c"]=it;return [$h("option",{"value":$V($G(v1,"c"))},$S($G(v1,"c")))];}))),$h("label",{"class":"field"},"Paid by",$h("select",{"id":"fSrc","value":$V($G(v,"f.add_src.v")),"onChange":$G(v,"f.add_src.on")},$A($G(v,"add.srcs")).map(function(it,ix){var v1=Object.create(v);v1["c"]=it;return [$h("option",{"value":$V($G(v1,"c"))},$S($G(v1,"c")))];}))),$h("label",{"class":"field"},"Currency",$h("select",{"id":"fCur","value":$V($G(v,"f.add_cur.v")),"onChange":$G(v,"f.add_cur.on")},$A($G(v,"curs")).map(function(it,ix){var v1=Object.create(v);v1["c"]=it;return [$h("option",{"value":$V($G(v1,"c"))},$S($G(v1,"c")))];}))),$h("label",{"class":"field"},"Delivery",$h("select",{"id":"fDel","value":$V($G(v,"f.add_del.v")),"onChange":$G(v,"f.add_del.on")},$A($G(v,"add.dels")).map(function(it,ix){var v1=Object.create(v);v1["o"]=it;return [$h("option",{"value":$V($G(v1,"o.v"))},$S($G(v1,"o.l")))];}))),$h("label",{"class":"field"},"Date",$h("input",{"id":"fDate","type":$S($G(v,"T.date")),"value":$V($G(v,"f.add_date.v")),"onInput":$G(v,"f.add_date.on")})),$h("label",{"class":"field full"},"Restaurant or shop",$h("input",{"id":"fPlace","list":"placeList","maxlength":"50","placeholder":"Rox Burger","autocomplete":"off","value":$V($G(v,"f.add_place.v")),"onInput":$G(v,"f.add_place.on")}))),$h("datalist",{"id":"placeList"},$A($G(v,"add.places")).map(function(it,ix){var v1=Object.create(v);v1["o"]=it;return [$h("option",{"value":$V($G(v1,"o.v"))},$S($G(v1,"o.l")))];})),$h("datalist",{"id":"dishList"},$A($G(v,"add.dishes")).map(function(it,ix){var v1=Object.create(v);v1["o"]=it;return [$h("option",{"value":$V($G(v1,"o.v"))})];})),($T($G(v,"add.known"))?[$h("div",{"class":"place-hint"},$h("span",{},"Usually PKR "+$S($G(v,"add.med"))+" here"),$h("button",{"type":"button","class":"btn sm","onClick":$G(v,"add.useMed")},$h("span",{},"Use PKR "+$S($G(v,"add.med")))),$A($G(v,"add.chips")).map(function(it,ix){var v1=Object.create(v);v1["c"]=it;return [$h("button",{"type":"button","class":$S($G(v1,"c.cls")),"onClick":$G(v1,"c.pick")},$S($G(v1,"c.mark"))+$S($G(v1,"c.label")))];})),($T($G(v,"add.reviews"))?[$h("p",{"class":"cap"},$S($G(v,"add.reviews")))]:null),($T($G(v,"add.lastReview"))?[$h("p",{"class":"cap"},$S($G(v,"add.lastReview")))]:null)]:null),($T($G(v,"add.isNew"))?[$h("p",{"class":"cap"},"New place, saved for next time once you add it")]:null),($T($G(v,"add.food"))?[$h("fieldset",{"class":"fieldset items-ed"},$h("legend",{},"What you had ",$h("span",{},"One line per item, with its price. Mark what a guest ate so it stays out of your food stats")),$A($G(v,"add.items")).map(function(it,ix){var v1=Object.create(v);v1["it"]=it;return [$h("div",{"class":"item-row"},$h("input",{"class":"it-name","list":"dishList","maxlength":"60","placeholder":"Item, like Pathoray nashta","autocomplete":"off","aria-label":"Item","value":$V($G(v1,"it.name")),"onInput":$G(v1,"it.onName")}),$h("input",{"class":"it-qty","type":$S($G(v1,"T.num")),"inputmode":"numeric","min":"1","step":"1","aria-label":"How many","value":$V($G(v1,"it.qty")),"onInput":$G(v1,"it.onQty")}),$h("input",{"class":"it-price","type":$S($G(v1,"T.num")),"inputmode":"decimal","min":"0","step":"any","placeholder":"Price","aria-label":"Price each","value":$V($G(v1,"it.price")),"onInput":$G(v1,"it.onPrice")}),$h("button",{"type":"button","class":"choice sm guest","aria-pressed":$S($G(v1,"it.guest")),"onClick":$G(v1,"it.toggleGuest")},"Guest"),$h("div",{"class":"it-rate","role":"group","aria-label":"How was this item"},$A($G(v1,"it.rates")).map(function(it,ix){var v2=Object.create(v1);v2["r"]=it;return [$h("button",{"type":"button","class":"choice sm "+$S($G(v2,"r.cls")),"aria-pressed":$S($G(v2,"r.pressed")),"title":$S($G(v2,"r.title")),"onClick":$G(v2,"r.pick")},$S($G(v2,"r.label")))];})),$h("button",{"type":"button","class":"iconbtn it-del","aria-label":"Remove item","onClick":$G(v1,"it.remove")},$h("svg",{"class":"ic","viewBox":"0 0 24 24","aria-hidden":"true"},$h("path",{"d":"M18 6 6 18"}),$h("path",{"d":"m6 6 12 12"}))))];}),$h("div",{"class":"items-foot"},$h("button",{"type":"button","class":"btn sm","onClick":$G(v,"add.addItem")},$h("svg",{"class":"ic","viewBox":"0 0 24 24","aria-hidden":"true"},$h("path",{"d":"M5 12h14"}),$h("path",{"d":"M12 5v14"})),"Add item"),($T($G(v,"add.sumText"))?[$h("span",{"class":"cap"},$S($G(v,"add.sumText")))]:null)),$h("div",{"class":"form"},$h("label",{"class":"field"},"Discount, PKR",$h("input",{"type":$S($G(v,"T.num")),"inputmode":"decimal","min":"0","step":"any","placeholder":"0","value":$V($G(v,"f.add_disc.v")),"onInput":$G(v,"f.add_disc.on")})),$h("label",{"class":"field"},"Voucher used",$h("select",{"value":$V($G(v,"f.add_vch.v")),"onChange":$G(v,"f.add_vch.on")},$h("option",{"value":""},"None"),$A($G(v,"add.vouchers")).map(function(it,ix){var v1=Object.create(v);v1["o"]=it;return [$h("option",{"value":$V($G(v1,"o.v"))},$S($G(v1,"o.l")))];})))),($T($G(v,"add.totalText"))?[$h("div",{"class":"place-hint"},$h("span",{},$S($G(v,"add.totalText"))),$h("button",{"type":"button","class":"btn sm","onClick":$G(v,"add.useTotal")},$h("span",{},"Use it as what you paid")))]:null),($T($G(v,"add.guestText"))?[$h("p",{"class":"cap"},$S($G(v,"add.guestText")))]:null))]:null),($T($G(v,"add.food"))?[$h("fieldset",{"class":"fieldset"},$h("legend",{},"How was the order? ",$h("span",{},"Optional. Rate single items above, or the whole order here")),$h("div",{"class":"choices","role":"group","aria-label":"How was it"},$A($G(v,"add.rates")).map(function(it,ix){var v1=Object.create(v);v1["r"]=it;return [$h("button",{"type":"button","class":"choice","aria-pressed":$S($G(v1,"r.pressed")),"onClick":$G(v1,"r.pick")},$S($G(v1,"r.label")))];})),$h("input",{"id":"fReview","maxlength":"160","placeholder":"Comment, like naan was cold, karahi spot on","aria-label":"Comment","value":$V($G(v,"f.add_review.v")),"onInput":$G(v,"f.add_review.on")}))]:null)]:null),($T($G(v,"add.mRefund"))?[$h("div",{"class":"amount"},$h("span",{},"PKR"),$h("input",{"type":$S($G(v,"T.num")),"inputmode":"decimal","min":"0","step":"any","placeholder":"0","aria-label":"Refund amount","value":$V($G(v,"f.rf_amt.v")),"onInput":$G(v,"f.rf_amt.on")})),$h("div",{"class":"form"},$h("label",{"class":"field full"},"Which order",$h("select",{"value":$V($G(v,"f.rf_tx.v")),"onChange":$G(v,"f.rf_tx.on")},$h("option",{"value":""},"Pick the order"),$A($G(v,"add.rfOrders")).map(function(it,ix){var v1=Object.create(v);v1["o"]=it;return [$h("option",{"value":$V($G(v1,"o.v"))},$S($G(v1,"o.l")))];}))),$h("label",{"class":"field"},"Refund went to",$h("select",{"value":$V($G(v,"f.rf_to.v")),"onChange":$G(v,"f.rf_to.on")},$h("option",{"value":"credit:foodpanda"},"Foodpanda wallet, as credit"),$h("option",{"value":"card"},"Back to my card or wallet"))),$h("label",{"class":"field"},"Date",$h("input",{"type":$S($G(v,"T.date")),"value":$V($G(v,"f.rf_date.v")),"onInput":$G(v,"f.rf_date.on")})),$h("label",{"class":"field full"},"Why",$h("input",{"maxlength":"80","placeholder":"Complaint, missing item","value":$V($G(v,"f.rf_note.v")),"onInput":$G(v,"f.rf_note.on")}))),$h("p",{"class":"cap"},"The refund comes off your spending. If it went to Foodpanda credit, choose Foodpanda credit under Paid by when you spend it.")]:null),($T($G(v,"add.mVoucher"))?[$h("div",{"class":"amount"},$h("span",{},"PKR"),$h("input",{"type":$S($G(v,"T.num")),"inputmode":"decimal","min":"0","step":"any","placeholder":"0","aria-label":"Voucher value","value":$V($G(v,"f.vc_amt.v")),"onInput":$G(v,"f.vc_amt.on")})),$h("div",{"class":"form"},$h("label",{"class":"field"},"Where it works",$h("input",{"maxlength":"30","placeholder":"Foodpanda","value":$V($G(v,"f.vc_where.v")),"onInput":$G(v,"f.vc_where.on")})),$h("label",{"class":"field"},"Expires, optional",$h("input",{"type":$S($G(v,"T.date")),"value":$V($G(v,"f.vc_exp.v")),"onInput":$G(v,"f.vc_exp.on")})),$h("label",{"class":"field full"},"Note",$h("input",{"maxlength":"80","placeholder":"Given for a complaint, minimum order 500","value":$V($G(v,"f.vc_note.v")),"onInput":$G(v,"f.vc_note.on")}))),$h("p",{"class":"cap"},"Open vouchers show under What you hold on Money, and a dated one shows on Today before it expires.")]:null),$h("div",{"class":$S($G(v,"add.hintCls")),"aria-live":"polite"},$S($G(v,"add.hint"))),$h("button",{"id":"addSave","class":"btn pri lg wide","type":"button","onClick":$G(v,"add.save")},$S($G(v,"add.saveLabel")))))]:null),($T($G(v,"sheetRate"))?[$h("div",{"class":"overlay","onClick":$G(v,"rt.back")},$h("div",{"class":"sheet","role":"dialog","aria-modal":"true","aria-label":"How was it"},$h("div",{"class":"sheet-h"},$h("h2",{},"How was it?"),$h("button",{"class":"btn sm quiet","type":"button","onClick":$G(v,"rt.close")},"Cancel")),$h("p",{"class":"sub"},$S($G(v,"rt.what"))),$h("div",{"class":"choices","role":"group","aria-label":"How was it"},$A($G(v,"rt.rates")).map(function(it,ix){var v1=Object.create(v);v1["r"]=it;return [$h("button",{"type":"button","class":"choice","aria-pressed":$S($G(v1,"r.pressed")),"onClick":$G(v1,"r.pick")},$S($G(v1,"r.label")))];})),$h("input",{"id":"rReview","maxlength":"160","placeholder":"Comment, like too oily, order the large next time","aria-label":"Comment","value":$V($G(v,"f.rate_review.v")),"onInput":$G(v,"f.rate_review.on")}),$h("button",{"id":"rateSave","class":"btn pri lg wide","type":"button","onClick":$G(v,"rt.save")},"Save")))]:null),($T($G(v,"toast"))?[$h("div",{"class":"toast","role":"status"},$S($G(v,"toast")))]:null));}
class Component extends preact.Component {
  render(){ return TPL(this.renderVals()); }
  constructor(props){
    super(props);
    this.state = {data:null, st:null, err:"", tab:"today", f:Object.assign({}, FIELD_DEFAULTS), meal:"", rateSel:"", rate2:"", rateTx:null,
      sheet:null, menu:false, toast:"", mpDay:null, acAcct:"all", acCat:"", lastUsual:null, usualMsg:"", armed:{}, itemForm:null, stmtPending:null, payArmed:false, pt: ptLoad(), ptView: null, ptMsg: ""};
    this._on = {};
  }
  componentDidMount(){
    Store.on(ev => {
      if (ev.data) { const first = !this.state.data; this.setState({data: Store.D, err: "", sync: Store.status()}, () => { if (first) { this.fillProfile(Store.D); this.fillConn(); } }); }
      if (ev.st) this.setState({st: Store.ST}, () => this.fillAcMonth());
      if (ev.status) this.setState({sync: Store.status(), err: Store.D ? "" : Store.errText()});
    });
    Store.start();
    this._clock = setInterval(() => { refreshToday(); this.setState({tick: Date.now()}); }, 60000);
  }
  componentDidUpdate(){ try { runCounters(); runSvgs(); runCountdowns(); } catch(e) {}
    if (!this._t2) this._t2 = setInterval(() => { let due = false; document.querySelectorAll("[data-t2]").forEach(el => { const t = +el.getAttribute("data-t2"); if (!isFinite(t)) return; const left = Math.round((t - Date.now()) / 1000); if (left <= 0) due = true; const L = Math.max(0, left), set = (u, v) => { const x = el.querySelector('[data-u="' + u + '"]'); if (x) x.textContent = v; else el.textContent = fmtLeft(L); };
        set("h", String(Math.floor(L / 3600))); set("m", String(Math.floor(L % 3600 / 60)).padStart(L >= 3600 ? 2 : 1, "0")); set("s", String(L % 60).padStart(2, "0")); el.classList.toggle("noh", L < 3600); }); if (due) this.setState({tick: Date.now()}); }, 1000); }
  componentWillUnmount(){ try { window.removeEventListener("storage", this._storage); } catch(e) {} clearTimeout(this._tt); clearInterval(this._clock); }

  /* ---- state plumbing ---- */
  setF(key, val, extra){ this.setState(s => ({f: Object.assign({}, s.f, {[key]: val}, extra || {})})); }
  onF(key){
    if (!this._on[key]) this._on[key] = e => {
      const t = e.target, v = t.type === "checkbox" ? t.checked : t.value, s = this.state, x = {};
      if (key === "add_cat" && v !== "Food" && s.meal) this.setState({meal: ""});
      if (key === "add_del") { const fee = parseInt(v, 10) || 0; if (fee) x.add_src = "Direct order"; }
      if (key === "add_place" && v.trim().length > 1 && !s.meal && s.f.add_cat !== "Food") x.add_cat = "Food";
      this.setF(key, v, x);
    };
    return this._on[key];
  }
  fv(key, def){ const v = this.state.f[key]; return {v: v === undefined ? (def === undefined ? "" : def) : v, on: this.onF(key)}; }
  toast(text){ clearTimeout(this._tt); this.setState({toast: text}); this._tt = setTimeout(() => this.setState({toast: ""}), 2600); }
  change(fn, msg){
    if (!Store.D) { this.toast("Not connected yet. Open Settings to connect."); return; }
    Store.change(d => { fn(d); d.updatedAt = nowAt(); }, msg || "Update"); this.setState({data: Store.D}); if (msg) this.toast(msg);
  }
  go(tab){
    this.setState({tab, menu: false});
    if (tab === "settings") this.fillSettings();
    if (tab === "prayers") this.fillPt();
    try { const sc = this._root && this._root.closest ? null : null; window.scrollTo(0, 0); } catch(e) {}
  }
  fillConn(){ const c = Store.conn; this.setState(s => ({f: Object.assign({}, s.f, {c_owner: c.owner || "", c_repo: c.repo || "", c_path: c.path || "data/life.json", c_branch: c.branch || "", c_token: c.token ? "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" : ""})})); }
  reset(){
    if (!this.snap) return;
    lsSet(null); const data = clone(this.snap);
    this.setState({data, mpDay: null, itemForm: null, lastUsual: null, usualMsg: "", armed: {}, sheet: null, menu: false});
    this.fillProfile(data); this.toast("Reloaded");
  }
  fillProfile(D){ const p = D.wajibat.profile || {}, x = {}; PROFILE_FIELDS.forEach(([k]) => x["pf_" + k] = p[k] || ""); this.setState(s => ({f: Object.assign({}, s.f, x)})); }
  fillAcMonth(){ const st = this.state.st; if (!st || !Array.isArray(st.rows)) return; const ms = [...new Set(st.rows.map(r => r.date.slice(0, 7)))].sort().reverse(); this.setF("ac_month", ms[0]); }
  fillSettings(){
    const D = this.state.data; if (!D) return; const cfg = C(D), kh = D.khums.settings || {}, x = {};
    const set = (k, v) => x[k] = v == null ? "" : String(v);
    set("s_nashta", cfg.caps?.nashta); set("s_dinner", cfg.caps?.dinner); set("s_snack", cfg.caps?.snack);
    set("s_nashtaN", cfg.mealsPerCycle?.nashta); set("s_dinnerN", cfg.mealsPerCycle?.dinner); set("s_snackN", cfg.mealsPerCycle?.snack);
    set("s_other", cfg.otherFood); set("s_pay", cfg.payAmount); set("s_save", cfg.savePerCycle); set("s_waj", cfg.wajibatPerCycle);
    set("s_open", cfg.cycle.opening); set("s_start", cfg.cycle.start); set("s_next", cfg.cycle.nextPay);
    set("p_amount", cfg.payAmount); set("p_date", cfg.cycle.nextPay);
    set("k_label", kh.label); set("k_greg", kh.gregorian); set("k_next", kh.next); set("k_carry", kh.carryPkr);
    CURRENCIES.forEach(([c]) => { if (c !== "PKR") set("rt_" + c, cfg.rates?.[c]); });
    this.setState(s => ({f: Object.assign({}, s.f, x), payArmed: false}));
  }

  /* ---- add spending ---- */
  openAdd(pre){
    const x = Object.assign({add_amount:"", add_cat:"Other", add_src:"Cash", add_cur:"PKR", add_del:"0", add_date:TODAY, add_place:"", add_note:"", add_review:"", add_disc:"", add_vch:"",
      rf_amt:"", rf_tx:"", rf_to:"credit:foodpanda", rf_date:TODAY, rf_note:"", vc_amt:"", vc_where:"Foodpanda", vc_exp:"", vc_note:""}, (pre && pre.f) || {});
    this.setState(s => ({sheet: "add", menu: false, addMode: (pre && pre.mode) || "spend", items: [{name: "", qty: "1", price: "", guest: false, rating: ""}], amountTouched: false, meal: (pre && pre.meal) || "", rateSel: "", stmtPending: (pre && pre.stmt) || null, f: Object.assign({}, s.f, x)}));
  }
  pickMeal(m){
    const s = this.state, x = {};
    if (m) { x.add_cat = "Food"; if (s.f.add_src === "Cash") x.add_src = "Foodpanda"; }
    this.setState({meal: m}); this.setF("add_cat", x.add_cat || s.f.add_cat, x);
  }
  itemsCalc(){
    const s = this.state, its = (s.items || []).filter(i => i.name.trim() && +i.price > 0).map(i => ({name: i.name.trim(), qty: Math.max(1, parseInt(i.qty, 10) || 1), price: +i.price, guest: !!i.guest, rating: i.rating || ""}));
    const sub = its.reduce((a, i) => a + i.qty * i.price, 0), guestSub = its.filter(i => i.guest).reduce((a, i) => a + i.qty * i.price, 0);
    const v = (F(s.data).vouchers || []).find(x => x.id === s.f.add_vch), disc = (+s.f.add_disc || 0) + (v ? +v.amount || 0 : 0);
    const dl = DELIVERY.find(x => x[0] === s.f.add_del) || DELIVERY[0], del = parseInt(dl[0], 10) || 0;
    return {its, sub, guestSub, disc, del, total: Math.max(0, Math.round((sub + del - disc) * 100) / 100), voucher: v};
  }
  saveRefund(){
    const s = this.state, D = s.data, f = s.f, amt = +f.rf_amt, orig = F(D).txns.find(t => t.id === f.rf_tx);
    if (!(amt > 0)) { this.toast("Type the refund amount"); return; }
    if (!orig) { this.toast("Pick the order that was refunded"); return; }
    const doc = {id: uid("t"), kind: "refund", date: f.rf_date || TODAY, amount: -amt, currency: "PKR", pkr: -amt, category: orig.category, meal: "", source: orig.source || "", refundOf: orig.id, refundTo: f.rf_to,
      note: "Refund: " + (orig.note || "order") + (f.rf_note.trim() ? ". " + f.rf_note.trim() : ""), createdAt: nowAt()};
    this.change(d => { d.finance.txns.unshift(doc); }, "Refund of PKR " + fmt(amt) + (f.rf_to.startsWith("credit:") ? " added to " + (CREDIT_LABEL[f.rf_to.slice(7)] || "credit") : " logged"));
    this.setState({sheet: null});
  }
  saveVoucher(){
    const f = this.state.f, amt = +f.vc_amt; if (!(amt > 0)) { this.toast("Type the voucher value"); return; }
    const v = {id: uid("v"), platform: (f.vc_where || "Foodpanda").trim(), amount: amt, expires: f.vc_exp || "", note: f.vc_note.trim(), addedOn: TODAY};
    this.change(d => { d.finance.vouchers = d.finance.vouchers || []; d.finance.vouchers.push(v); }, "Voucher of PKR " + fmt(amt) + " saved");
    this.setState({sheet: null});
  }
  saveAdd(){
    if (this.state.addMode === "refund") return this.saveRefund();
    if (this.state.addMode === "voucher") return this.saveVoucher();
    const ic = this.itemsCalc();
    const s = this.state, D = s.data, f = s.f, amount = +f.add_amount || (ic.its.length && f.add_cat === "Food" ? ic.total : 0), currency = f.add_cur;
    if (!(amount > 0)) { this.toast("Type an amount first"); return; }
    if (!rate(D, currency)) { this.toast("Set a rate for " + currency + " in Settings first"); return; }
    const dl = DELIVERY.find(x => x[0] === f.add_del) || DELIVERY[0], itemized = ic.its.length > 0 && f.add_cat === "Food", del = itemized ? 0 : (parseInt(dl[0], 10) || 0), vendor = dl[1];
    const fromCredit = f.add_src === "Foodpanda credit";
    const doc = {id: uid("t"), date: f.add_date || TODAY, amount: currency === "PKR" ? amount + del : amount, currency,
      pkr: Math.round((toPkr(D, amount, currency) + del) * 100) / 100, deliveryFee: del, category: f.add_cat,
      meal: f.add_cat === "Food" ? (s.meal || "other") : "", source: f.add_src,
      note: [f.add_place.trim() || vendor, itemized ? itemsNote(ic.its) : f.add_note.trim(), del ? "incl. delivery " + del : ""].filter(Boolean).join(": ").slice(0, 200), createdAt: nowAt()};
    if (fromCredit) { doc.source = "Foodpanda"; doc.paidFrom = "credit:foodpanda"; }
    if (itemized) {
      doc.items = ic.its; if (ic.del) doc.deliveryFee = (parseInt(dl[0], 10) || 0); if (ic.disc) doc.discount = Math.round(ic.disc * 100) / 100;
      if (ic.guestSub > 0 && ic.sub > 0) doc.guestPkr = Math.round(doc.pkr * ic.guestSub / ic.sub * 100) / 100;
      const mine = ic.its.filter(i => !i.guest && i.rating); if (!s.rateSel && mine.length === 1) doc.rating = mine[0].rating;
      if (ic.voucher) doc.voucherId = ic.voucher.id;
    }
    if (s.stmtPending) doc.stmtId = s.stmtPending;
    if (doc.category === "Food") { const rv = (f.add_review || "").trim(); if (s.rateSel) doc.rating = s.rateSel; if (rv) doc.review = rv; }
    this.change(d => { d.finance.txns.unshift(doc); if (doc.voucherId) { const v = (d.finance.vouchers || []).find(x => x.id === doc.voucherId); if (v) v.usedOn = doc.date; } }, "Added PKR " + fmt(doc.pkr) + (doc.guestPkr ? ", PKR " + fmt(doc.guestPkr) + " of it for a guest" : "") + (fromCredit ? ", paid from Foodpanda credit" : ""));
    this.setState({sheet: null, stmtPending: null, rateSel: ""});
  }
  capHint(){
    const s = this.state, D = s.data, f = s.f, amt = +f.add_amount, cur = f.add_cur, meal = s.meal;
    if (!amt) return {t: meal ? "Cap for " + MEALS[meal] + ": PKR " + fmt(C(D).caps?.[meal] || 0) + (this.itemsCalc().guestSub > 0 ? ", counted on your share only" : "") : "", c: ""};
    const dl = DELIVERY.find(x => x[0] === f.add_del) || DELIVERY[0], ic0 = this.itemsCalc(), full = toPkr(D, amt, cur) + (ic0.its.length ? 0 : (parseInt(dl[0], 10) || 0)), pkr = ic0.guestSub > 0 && ic0.sub > 0 ? full * (1 - ic0.guestSub / ic0.sub) : full;
    const pre = cur !== "PKR" ? "About PKR " + fmt(pkr) + ". " : "";
    if (meal) { const cap = C(D).caps?.[meal] || 0, diff = cap - pkr;
      return {t: pre + (diff >= 0 ? "PKR " + fmt(diff) + " under the " + MEALS[meal].toLowerCase() + " cap" : "PKR " + fmt(-diff) + " over the " + MEALS[meal].toLowerCase() + " cap"), c: diff >= 0 ? "good" : diff > -cap * 0.15 ? "warn" : "bad"}; }
    const k = compute(D), after = k.allowToday - k.spentToday - pkr;
    return {t: pre + (after >= 0 ? "Leaves PKR " + fmt(after) + " for the rest of today" : "Takes you PKR " + fmt(-after) + " past today's safe amount"), c: after >= 0 ? "good" : "warn"};
  }
  /* ---- rating ---- */
  openRate(id){ const t = F(this.state.data).txns.find(x => x.id === id); if (!t) return; this.setState(s => ({sheet: "rate", rateTx: id, rate2: t.rating || "", f: Object.assign({}, s.f, {rate_review: t.review || ""})})); }
  saveRate(){
    const s = this.state, id = s.rateTx, r = s.rate2, rv = (s.f.rate_review || "").trim(); if (!id) return;
    this.change(d => { const t = d.finance.txns.find(x => x.id === id); if (!t) return; if (r) t.rating = r; else delete t.rating; if (rv) t.review = rv; else delete t.review; }, r ? RATE[r][0] + ", saved" : "Saved");
    this.setState({sheet: null, rateTx: null});
  }
  rateVm(t){
    if (!t) return {has: false, none: false};
    const has = !!(t.rating || t.review);
    return {has, none: !has, label: t.rating ? RATE[t.rating][0] : "", cls: t.rating ? RATE[t.rating][1] : "", review: t.review || "", open: () => this.openRate(t.id)};
  }
  /* ---- qaza ---- */
  qaza(k, d){
    try { if (navigator.vibrate) navigator.vibrate(d < 0 ? [12, 40, 12] : 20); } catch(e) {}
    const D = this.state.data, before = +(D.wajibat.qaza.counts[k] || 0); if (d < 0 && !before) { const p = PRAYERS.find(x => x[0] === k); this.toast("No " + (p ? p[1] : k) + " qaza owed"); return; }
    const now = Date.now(); if (this._qLast && this._qLast.k === k && this._qLast.d === d && now - this._qLast.t < 500) return; this._qLast = {k, d, t: now};
    this.bump({[k]: d}); const p = PRAYERS.find(x => x[0] === k), after = Math.max(0, before + d);
    clearTimeout(this._qT); this.setState({qUndo: {k, d, text: (p ? p[1] : k) + ": one qaza " + (d > 0 ? "added" : "made up") + ", " + nfEn.format(after) + " owed"}});
    this._qT = setTimeout(() => this.setState({qUndo: null}), 6000);
  }
  bump(ch){
    const D = this.state.data, c = D.wajibat.qaza.counts, real = {};
    for (const [k, d] of Object.entries(ch)) { const cur = k === "roza" ? (+D.wajibat.qaza.roza||0) : (+c[k]||0), nv = Math.max(0, cur + d); if (nv !== cur) real[k] = nv - cur; }
    if (!Object.keys(real).length) return;
    const at = nowAt();
    this.change(dd => { for (const [k, d] of Object.entries(real)) { if (k === "roza") dd.wajibat.qaza.roza = Math.max(0, (+dd.wajibat.qaza.roza||0) + d); else dd.wajibat.qaza.counts[k] = Math.max(0, (+dd.wajibat.qaza.counts[k]||0) + d); }
      dd.wajibat.qaza.updatedAt = at; dd.wajibat.log = [{at, changes: real}, ...(dd.wajibat.log||[])].slice(0, 200); });
  }
  arm(key){ this.setState(s => ({armed: Object.assign({}, s.armed, {[key]: true})})); setTimeout(() => this.setState(s => { const a = Object.assign({}, s.armed); delete a[key]; return {armed: a}; }), 3000); }

  /* ---- view model ---- */

  /* ---- prayer times tab ---- */
  setPt(next, msg){ const pt = Object.assign({}, this.state.pt, next); ptSave(pt); this.setState({pt, ptMsg: msg || ""}); }
  fillPt(){ const pt = this.state.pt, P = ptLib(), E = ptEngine(pt), x = {pt_name: pt.loc.name, pt_lat: String(pt.loc.lat), pt_lng: String(pt.loc.lng)};
    PT_COLS.forEach(c => { if (c.set === "angle") x["pt_a_" + c.k] = String(E.angles[c.k]); if (c.set === "night") { x["pt_ns_" + c.k] = String(E.nights[c.k][0]); x["pt_ne_" + c.k] = String(E.nights[c.k][1]); } });
    this.setState(s => ({f: Object.assign({}, s.f, x)})); }
  ptVM(){
    const self = this, s = this.state, cfg = s.pt, P = ptLib(); if (!P) return {ok: false};
    const [Y, M, Dd] = TODAY.split("-").map(Number), T = ptDay(Y, M, Dd, cfg), yd = ptAdd(Y, M, Dd, -1), Yd = ptDay(yd.y, yd.m, yd.d, cfg);
    const tm = ptAdd(Y, M, Dd, 1), Tm = ptDay(tm.y, tm.m, tm.d, cfg);
    let nowMin = 0; try { const n = ptZoneParts(new Date(), cfg.loc.tz); nowMin = n.h * 60 + n.mi; } catch(e) {}
    /* ten key times always show; the rest are extras the user switches on */
    const PT_FIXED = {fajr: 1, fajrEnd: 1, dhuhr: 1, q4: 1, q6: 1, sunset: 1, maghrib: 1, isha: 1, ishaEnd: 1, midnight: 1};
    const EXTRAS = Array.isArray(cfg.extras) ? cfg.extras : [];
    const vis = PT_COLS.filter(c => PT_FIXED[c.k] || EXTRAS.indexOf(c.k) >= 0);
    const NIGHT = {travellerEnd: 1, ishaEnd: 1, midnight: 1, duaEnd: 1}, dawn = isFinite(T._abs.fajr) ? T._abs.fajr : T._abs.sunrise;
    const view = {}; PT_COLS.forEach(c => { let a = T._abs[c.k], d = T._d[c.k];
      if (NIGHT[c.k] && isFinite(dawn) && nowMin < dawn && isFinite(Yd._abs[c.k]) && Yd._abs[c.k] >= 1440) { a = Yd._abs[c.k] - 1440; d = Yd._d[c.k]; }
      view[c.k] = {abs: a, d}; });
    let next = null; vis.forEach(c => { const a = view[c.k].abs; if (isFinite(a) && a > nowMin && (!next || a < next.abs)) next = {k: c.k, abs: a}; });
    let tomorrow = false;
    if (!next) { vis.forEach(c => { const a = Tm._abs[c.k]; if (isFinite(a) && (!next || a < next.abs)) next = {k: c.k, abs: a}; }); if (next) { next = {k: next.k, abs: next.abs + 1440}; tomorrow = true; } }
    const nextCol = next ? PT_COLS.find(c => c.k === next.k) : null;
    const pt = {ok: true};
    pt.place = cfg.loc.name || "Custom location"; pt.coords = cfg.loc.lat.toFixed(4) + ", " + cfg.loc.lng.toFixed(4);
    pt.methodName = {tehran: "intime.ir (Tehran Geophysics)", sistani: "Sistani preset", custom: "Custom settings"}[cfg.method];
    pt.greg = ptFmt(Y, M, Dd, {weekday: "long", day: "numeric", month: "long", year: "numeric"});
    pt.solar = ptFmt(Y, M, Dd, {calendar: "persian", day: "numeric", month: "long", year: "numeric"});
    pt.hijri = ptFmt(Y, M, Dd, {calendar: "islamic-umalqura", day: "numeric", month: "long", year: "numeric"});
    pt.hasNext = !!next; pt.nextName = nextCol ? nextCol.name + (tomorrow ? " (tomorrow)" : "") : "No upcoming time";
    pt.nextAt = next ? "at " + ptHm(next.abs) : ""; pt.nextAbs = next ? String(next.abs) : ""; pt.tz = cfg.loc.tz;
    pt.nextCls = nextCol ? "h-" + nextCol.hue : "";
    pt.nowText = "Local time in " + cfg.loc.tz.replace("_", " ") + ", " + ptHm(nowMin);
    pt.slots = vis.map(c => { const x = view[c.k], past = isFinite(x.abs) && x.abs <= nowMin;
      return {label: c.name, time: ptHm(x.abs), title: c.def, hasD: !!x.d, d: x.d ? ptDelta(x.d) : "", dTitle: x.d ? Math.abs(x.d) + " min " + (x.d > 0 ? "later" : "earlier") + " than intime.ir" : "",
        cls: ["pslot", "h-" + c.hue, c.prayer ? "prayer" : "", c.sun ? "sun" : "", past ? "past" : "", next && c.k === next.k ? "is-next" : "", x.d ? "changed" : ""].filter(Boolean).join(" ")}; });
    pt.missing = vis.filter(c => !isFinite(view[c.k].abs)).map(c => c.name).join(", "); pt.hasMissing = !!pt.missing;
    pt.nowMin = nowMin; pt.five = {fajr: view.fajr.abs, dhuhr: view.dhuhr.abs, asr: view.q2.abs, maghrib: view.maghrib.abs, isha: view.isha.abs, sunrise: view.sunrise.abs, sunset: view.sunset.abs, midnight: view.midnight.abs};
    const KL = {fajr: ["Fajr begins", "True dawn"], fajrEnd: ["Fajr fazilat ends", ""], sunrise: ["Sunrise", "Fajr becomes qaza"],
      dhuhr: ["Zoharain begin", "Zawal, solar noon"], q4: ["Zohar fazilat ends", "4 qadam"], q6: ["Asr fazilat ends", "6 qadam"], sunset: ["Zoharain become qaza", "Sunset"],
      maghrib: ["Maghribain begin", "Eastern redness gone"], isha: ["Maghrib fazilat ends", "Esha fazilat begins"], ishaEnd: ["Esha fazilat ends", "A third of the night"], midnight: ["Midnight", "Maghribain become qaza"]};
    const GROUPS = [["Fajr", "نمازِ فجر", "h-fajr", ["imsak","fajr","fajrPrayer","fajrEnd","sunrise"]], ["Zoharain", "ظہرین", "h-zohar", ["dhuhr","q2","q4","q6","mithl","mithlayn","sunset"]], ["Maghribain", "مغربین", "h-maghrib", ["maghrib","isha","travellerEnd","ishaEnd","midnight","duaEnd"]]];
    pt.groups = GROUPS.map(([en, ur, hue, keys]) => ({en, ur, cls: hue, rows: keys.filter(k => PT_FIXED[k] || EXTRAS.indexOf(k) >= 0).map(k => { const c = PT_COLS.find(x => x.k === k), x = view[k], past = isFinite(x.abs) && x.abs <= nowMin, kl = KL[k] || [c.name, ""];
      return {time: ptHm(x.abs), label: kl[0], sub: kl[1], title: c.def, hasD: !!x.d, d: x.d ? ptDelta(x.d) : "", dTitle: x.d ? Math.abs(x.d) + " min " + (x.d > 0 ? "later" : "earlier") + " than intime.ir" : "",
        cls: ["kt", PT_FIXED[k] ? "fixed" : "extra", /begin/.test(kl[0]) ? "begin" : "", (k === "sunset" || k === "midnight" || k === "sunrise") ? "qaza" : "", /fazilat/.test(kl[0]) ? "fz" : "", past ? "past" : "", next && k === next.k ? "is-next" : ""].filter(Boolean).join(" ")}; })}));
    /* the day strip: night, twilight, daylight, now, with the five prayer starts marked */
    const pc = m => Math.max(0, Math.min(100, m / 1440 * 100)).toFixed(2), seg = (a, b) => isFinite(a) && isFinite(b) && b > a ? "left:" + pc(a) + "%;width:" + (pc(b) - pc(a)).toFixed(2) + "%" : "display:none";
    pt.segTw1 = seg(T.fajr, T.sunrise); pt.segDay = seg(T.sunrise, T.sunset); pt.segTw2 = seg(T.sunset, T.isha); pt.nowLeft = "left:calc(" + pc(nowMin) + "% - 1px)";
    pt.marks = [["fajr","Fajr"],["dhuhr","Dhuhr"],["maghrib","Maghrib"],["isha","Isha"]].map(([k, n]) => ({k, n, t: ptHm(T[k]), style: "left:" + pc(T[k]) + "%", cls: "pmark h-" + PT_COLS.find(c => c.k === k).hue}));
    pt.ticks = [0, 6, 12, 18, 24].map(h => ({t: String(h % 24).padStart(2, "0") + ":00", style: "left:" + (h / 24 * 100) + "%" + (h === 0 ? ";transform:none" : h === 24 ? ";transform:translateX(-100%)" : "")}));
    /* Sistani switch */
    const ch = PT_COLS.filter(c => T._d[c.k]);
    pt.sisOn = cfg.method === "sistani"; pt.sisCls = pt.sisOn ? "pt-switch on" : "pt-switch"; pt.sisPressed = pt.sisOn ? "true" : "false";
    pt.toggleSis = () => self.setPt({method: cfg.method === "sistani" ? "tehran" : "sistani"}, cfg.method === "sistani" ? "Showing intime.ir's Tehran Geophysics times" : "Using the Sistani preset. Changed times are marked in green");
    pt.sisSummary = pt.sisOn ? "On. Today " + ch.length + " time" + (ch.length === 1 ? "" : "s") + " differ from intime.ir: " + (ch.map(c => c.name + " " + ptHm(T[c.k]) + " (" + ptDelta(T._d[c.k]) + " min)").join(", ") || "none") + ". Every other time is the same"
      : cfg.method === "custom" ? "Custom settings are in use" + (ch.length ? ", " + ch.length + " time" + (ch.length === 1 ? "" : "s") + " differ from intime.ir today" : ", identical to intime.ir today")
      : "Off. Showing intime.ir's Tehran Geophysics times. Switch on to see which times change under Sistani's definition of the night";
    /* tables */
    const head = vis.map(c => ({label: c.name, title: c.def, cls: c.prayer ? "prayer h-" + c.hue : ""}));
    const row = (dd, cls) => { const t = ptDay(dd.y, dd.m, dd.d, cfg), wd = new Date(Date.UTC(dd.y, dd.m - 1, dd.d)).getUTCDay();
      return {day: ptFmt(dd.y, dd.m, dd.d, {weekday: "short", day: "numeric", month: "short"}), sub: ptFmt(dd.y, dd.m, dd.d, {calendar: "islamic-umalqura", day: "numeric", month: "short"}),
        cls: [cls, wd === 5 ? "friday" : ""].filter(Boolean).join(" "),
        cells: vis.map(c => ({t: ptHm(t[c.k]), cls: [c.prayer ? "prayer h-" + c.hue : "", t._d[c.k] ? "changed" : ""].filter(Boolean).join(" "), hasD: !!t._d[c.k], d: t._d[c.k] ? ptDelta(t._d[c.k]) : ""}))}; };
    pt.head = head; pt.week = []; for (let i = 0; i < 7; i++) pt.week.push(row(ptAdd(Y, M, Dd, i), i === 0 ? "is-today" : ""));
    const pv = s.ptView || {y: Y, m: M}, nDays = new Date(Date.UTC(pv.y, pv.m, 0)).getUTCDate();
    pt.month = []; for (let d = 1; d <= nDays; d++) pt.month.push(row({y: pv.y, m: pv.m, d}, pv.y === Y && pv.m === M && d === Dd ? "is-today" : ""));
    pt.monthLabel = ptFmt(pv.y, pv.m, 1, {month: "long", year: "numeric"});
    pt.prevM = () => self.setState({ptView: pv.m === 1 ? {y: pv.y - 1, m: 12} : {y: pv.y, m: pv.m - 1}});
    pt.nextM = () => self.setState({ptView: pv.m === 12 ? {y: pv.y + 1, m: 1} : {y: pv.y, m: pv.m + 1}});
    pt.thisM = () => self.setState({ptView: null}); pt.notThisM = pv.y !== Y || pv.m !== M;
    pt.minW = "min-width:" + Math.max(420, 140 + vis.length * 68) + "px";
    /* columns and method */
    pt.cols = PT_COLS.filter(c => !PT_FIXED[c.k]).map(c => { const on = EXTRAS.indexOf(c.k) >= 0; return {label: c.name, pressed: on ? "true" : "false", cls: "choice h-" + c.hue,
      pick: () => self.setPt({extras: on ? EXTRAS.filter(k => k !== c.k) : PT_ALL.filter(k => !PT_FIXED[k] && (k === c.k || EXTRAS.indexOf(k) >= 0))})}; });
    pt.showAll = () => self.setPt({extras: PT_ALL.filter(k => !PT_FIXED[k])}, "Showing all 18 times");
    pt.showIntime = () => self.setPt({extras: PT_INTIME.filter(k => !PT_FIXED[k])}, "Added intime.ir's other default times");
    pt.showPrayers = () => self.setPt({extras: []}, "Showing the ten key times only");
    pt.methods = [["tehran", "intime.ir"], ["sistani", "Sistani"], ["custom", "Custom"]].map(([k, l]) => ({label: l, pressed: cfg.method === k ? "true" : "false",
      pick: () => { const nx = {method: k}; if (k === "custom" && !cfg.custom) nx.custom = JSON.parse(JSON.stringify(ptEngine(cfg))); self.setPt(nx, k === "custom" ? "Custom: change the angles, then save" : ""); setTimeout(() => self.fillPt(), 0); }}));
    pt.isCustom = cfg.method === "custom";
    pt.angles = PT_COLS.filter(c => c.set).map(c => ({title: c.title, isAngle: c.set === "angle", isNight: c.set === "night", today: ptHm(T[c.k]),
      a: self.fv("pt_a_" + c.k), ns: self.fv("pt_ns_" + c.k), ne: self.fv("pt_ne_" + c.k), dis: !pt.isCustom}));
    pt.saveCustom = () => { const f = self.state.f, E = JSON.parse(JSON.stringify(cfg.custom || ptEngine(cfg)));
      for (const c of PT_COLS) { if (c.set === "angle") { const a = parseFloat(f["pt_a_" + c.k]); if (!(a >= 0 && a <= 30)) return self.setState({ptMsg: c.title + ": enter an angle between 0 and 30"}); E.angles[c.k] = a; }
        if (c.set === "night") { const a = parseFloat(f["pt_ns_" + c.k]), b = parseFloat(f["pt_ne_" + c.k]); if (!(a >= 0 && a <= 30 && b >= 0 && b <= 30)) return self.setState({ptMsg: c.title + ": enter night angles between 0 and 30"}); E.nights[c.k] = [a, b]; } }
      self.setPt({method: "custom", custom: E}, "Custom angles saved"); };
    /* location */
    pt.name = self.fv("pt_name"); pt.lat = self.fv("pt_lat"); pt.lng = self.fv("pt_lng");
    pt.saveLoc = () => { const f = self.state.f, la = parseFloat(f.pt_lat), lo = parseFloat(f.pt_lng);
      if (!(la >= -89 && la <= 89)) return self.setState({ptMsg: "Latitude must be a number between -89 and 89"});
      if (!(lo >= -180 && lo <= 180)) return self.setState({ptMsg: "Longitude must be a number between -180 and 180"});
      self.setPt({loc: {name: (f.pt_name || "").trim(), lat: la, lng: lo, tz: cfg.loc.tz}}, "Location saved"); };
    pt.useLahore = () => { self.setPt({loc: Object.assign({}, PT_DEFAULT.loc)}, "Back to Lahore"); setTimeout(() => self.fillPt(), 0); };
    pt.msg = s.ptMsg; pt.hasMsg = !!s.ptMsg;
    pt.defs = PT_COLS.map(c => ({name: c.name, def: c.def, sis: PT_SIS[c.k] || "", cls: "h-" + c.hue}));
    return pt;
  }

  renderVals(){
    const s = this.state, self = this;
    const theme = this.props.theme || "auto", device = !!this.props.device;
    const go = {}; ["today","prayers","planner","money","accounts","khums","wajibat","wasiyat","settings"].forEach(t => go[t] = () => self.go(t));
    const nav = {}; Object.keys(go).forEach(t => nav[t] = s.tab === t ? "on" : "");
    const tabs = {}; Object.keys(go).forEach(t => tabs[t] = !!s.data && s.tab === t);
    const base = {theme, rootCls: device ? "is-device" : "", T: {num: "number", date: "date"}, go, nav, tabs, loading: !s.data && !s.err, loadErr: !!s.err, err: s.err, toast: s.toast,
      menu: s.menu, openMenu: () => this.setState({menu: true}), closeMenu: () => this.setState({menu: false}), menuBack: e => { if (e.target === e.currentTarget) this.setState({menu: false}); },
      openAdd: () => this.openAdd(), resetSnap: () => switchView("classic"), sync: s.sync || {text: "", cls: ""}, sheetAdd: false, sheetRate: false, curs: CURRENCIES.map(c => c[0]), bnavPlan: s.tab === "planner" ? "on" : ""};
    if (!s.data) return base;
    const D = s.data, cfg = C(D), k = compute(D), kh = khums(D), ks = khumsStatus(kh);
    const f = {}; Object.keys(FIELD_DEFAULTS).forEach(key => f[key] = this.fv(key));
    PROFILE_FIELDS.forEach(([key]) => f["pf_" + key] = this.fv("pf_" + key));
    CURRENCIES.forEach(([c]) => f["rt_" + c] = this.fv("rt_" + c));
    const third = pendingItems(D).filter(i => RELIGIOUS.includes(i.type));
    const kaf = third.reduce((a,i) => a + toPkr(D, itemStatus(D, i).left || 0, i.currency), 0);

    /* ===== today ===== */
    const td = {};
    const rem = k.allowToday - k.spentToday, cyc = cfg.cycle;
    td.date = parse(TODAY).toLocaleDateString("en-GB", {weekday:"long", day:"numeric", month:"long", year:"numeric"});
    td.dayName = parse(TODAY).toLocaleDateString("en-GB", {weekday:"long"}); td.dayDate = parse(TODAY).toLocaleDateString("en-GB", {day:"numeric", month:"long"});
    td.cycleDay = Math.min(k.len, dayDiff(cyc.start, TODAY) + 1); td.cycleLen = k.len; td.payOn = nice(cyc.nextPay);
    td.safe = fmt(Math.max(0, rem)); td.left = fmt(k.left); td.spentToday = fmt(k.spentToday);
    td.status = rem >= 0 ? "On track, " + Math.max(0, Math.round(k.allowToday > 0 ? rem / k.allowToday * 100 : 0)) + "% of today's amount left" : "PKR " + fmt(-rem) + " over today";
    td.statusCls = rem >= k.allowToday * 0.25 ? "ok-t" : rem >= 0 ? "warn-t" : "neg-t";
    const perDayPlan = (cyc.opening || 0) / k.len, daySp = [];
    for (let i = 0; i < k.len; i++) { const d = addDays(cyc.start, i); daySp.push({d, v: k.tx.filter(t => t.date === d).reduce((a,t) => a + (t.pkr||0), 0)}); }
    const dmax = Math.max(perDayPlan * 1.6, ...daySp.map(x => x.v), 1);
    td.days = daySp.map(x => ({cls: x.d === TODAY ? "today" : x.d > TODAY ? "future" : "", h: Math.round(x.v / dmax * 100), n: parse(x.d).getDate(), title: nice(x.d) + ": PKR " + fmt(x.v)}));
    td.avgPct = Math.round(perDayPlan / dmax * 100);
    td.ledgerLabel = "Spending per day this cycle, today PKR " + fmt(k.spentToday);
    const nextBill = myBills(D).map(b => ({b, d: billDue(D, b)})).sort((a,b) => a.d.localeCompare(b.d))[0];
    const doneToday = DAY.reduce((a,kk) => a + (prayedToday(D, kk) > 0 ? 1 : 0), 0);
    td.tiles = [
      {label: "Qaza owed", value: nfEn.format(qazaTotal(D)), sub: doneToday + " of 5 prayed today", go: go.wajibat},
      {label: "Khums", value: ks.word, cls: "word", sub: ks.line, go: go.khums},
      {label: third.length === 1 && third[0].type === "kaffara" ? "Kaffara" : "Dues open", value: third.length ? fmt(kaf) : "None", cur: !!third.length, cls: third.length ? "" : "word", sub: third.length ? "Still open" : "Nothing pending", go: go.money},
      nextBill ? {label: "Next bill", value: nextBill.b.name, cls: "word", sub: fmtC(nextBill.b.amount, nextBill.b.currency) + ", due " + nice(nextBill.d), go: go.money} : {label: "Bills", value: "None", cls: "word", sub: "", go: go.money}
    ];
    const qc = D.wajibat.qaza.counts || {};
    const qTile = ([kk, en, ur]) => { const n = +qc[kk] || 0, p = Math.max(0, prayedToday(D, kk)), b = kk.replace("_q", "");
      return {k: kk, hk: b, en, ur, n: nfEn.format(n), p, cls: p ? "done" : "", disabled: !n, aria: "Prayed one " + en + " qaza", undoAria: "Undo one " + en + " qaza",
        status: p ? p + " prayed today" : n ? "Tap after each one" : "None owed", tap: () => self.bump({[kk]: -1}), undo: () => { if (prayedToday(self.state.data, kk) > 0) self.bump({[kk]: 1}); },
        ic: {fajr: b === "fajr", zohar: b === "zohar", asr: b === "asr", maghrib: b === "maghrib", esha: b === "esha"}}; };
    td.prayers = PRAYERS.slice(0, 5).map(qTile); td.qTotal = nfEn.format(PRAYERS.reduce((a, [kk]) => a + (+qc[kk] || 0), 0));
    td.qasr = PRAYERS.slice(5).filter(([kk]) => (+qc[kk]||0) > 0 || prayedToday(D, kk) > 0).map(qTile); td.hasQasr = td.qasr.length > 0;
    const qPace = +s.f.sl_qpace || 1; td.qPace = qPace; td.qDone = longDate(qazaFinish(D, qPace).date);
    const US = usuals(D);
    td.usuals = US.map(u => { const rv = placeReviews(D, u.vendor), lr = rv.rows.find(t => t.rating);
      return {meal: u.meal === "other" ? "Food" : MEALS[u.meal], vendor: u.vendor, amount: fmt(u.amount), n: u.n, rated: lr ? ", " + RATE[lr.rating][0].toLowerCase() : "",
        log: () => { const t = {id: uid("t"), date: TODAY, amount: u.amount, currency: "PKR", pkr: u.amount, category: "Food", meal: u.meal === "other" ? "other" : u.meal, source: u.src, note: u.vendor + " (usual)", createdAt: nowAt()};
          self.change(d => { d.finance.txns.unshift(t); }); self.setState({lastUsual: t.id, usualMsg: "Logged " + u.vendor + ", PKR " + fmt(u.amount)}); clearTimeout(self._ut); self._ut = setTimeout(() => self.setState({usualMsg: ""}), 8000); }}; });
    td.hasUsuals = US.length > 0; td.noUsuals = !US.length; td.usualMsg = s.usualMsg;
    const amt = +s.f.afford || 0, safeNow = k.allowToday - k.spentToday;
    if (!(amt > 0)) { td.affordHead = "Type a price"; td.affordBody = "See whether it fits today before you order"; td.affordCls = "mut"; }
    else { const after = safeNow - amt, rest = k.left - amt;
      if (after >= 0) { td.affordHead = "Yes, it fits"; td.affordBody = "Leaves PKR " + fmt(after) + " for the rest of today"; td.affordCls = "ok-t"; }
      else if (rest >= 0) { td.affordHead = "Over today by PKR " + fmt(-after); td.affordBody = "The cycle can take it, but each remaining day drops to about PKR " + fmt(rest / Math.max(1, k.daysLeft - 1)); td.affordCls = "warn-t"; }
      else { td.affordHead = "Not this cycle"; td.affordBody = "That is PKR " + fmt(-rest) + " more than is left until pay day"; td.affordCls = "neg-t"; } }
    const tl = [{d: cyc.nextPay, t: "Pay day", s: "PKR " + fmt(cfg.payAmount), mark: "circled"}];
    F(D).bills.forEach(b => { const d = billDue(D, b); if (dayDiff(TODAY, d) <= 35) tl.push({d, t: b.name, mark: b.paidBy === "mentor" ? "ringed" : "circled", s: b.paidBy === "mentor" ? "Mentor pays, send a reminder" : fmtC(b.amount, b.currency) + ", about PKR " + fmt(toPkr(D, b.amount, b.currency))}); });
    openVouchers(D).filter(v => v.expires && dayDiff(TODAY, v.expires) <= 35).forEach(v => tl.push({d: v.expires, mark: "circled", t: v.platform + " voucher expires", s: "PKR " + fmt(v.amount) + " off, use it before then"}));
    if (kh.kh.next) tl.push({d: kh.kh.next, mark: "circled", t: "23 Ramadan", s: "Khums " + (kh.kh.label || "") + " becomes payable, about PKR " + fmt(kh.est)});
    td.timeline = tl.sort((a,b) => a.d.localeCompare(b.d)).map(x => ({when: nice(x.d), t: x.t, s: x.s, dn: parse(x.d).getDate(), wd: parse(x.d).toLocaleDateString("en-GB", {weekday: "short"}), mon: parse(x.d).toLocaleDateString("en-GB", {month: "short"}), mark: x.mark || ""}));

    /* meal plan */
    const mp = {show: false}, mpl = F(D).mealPlan;
    if (mpl && (mpl.days||[]).length) {
      mp.show = true; const days = mpl.days;
      const sel = s.mpDay && days.some(d => d.date === s.mpDay) ? s.mpDay : days.some(d => d.date === TODAY) ? TODAY : days[0].date;
      let planned = 0, eatenPlan = 0, eatenActual = 0, leftPlan = 0;
      const state = days.map(d => { const r = {date: d.date};
        ["nashta","dinner"].forEach(sl => { const p = d[sl]; if (!p) { r[sl] = "none"; return; }
          planned += p.price; const e = mpEaten(D, d.date, sl);
          if (e) { eatenPlan += p.price; eatenActual += e.pkr; r[sl] = e.pkr > p.price * 1.1 ? "over" : "done"; }
          else { if (d.date >= TODAY) leftPlan += p.price; r[sl] = d.date < TODAY ? "missed" : "open"; } });
        return r; });
      mp.title = mpl.title || ""; const fits = k.left >= leftPlan;
      mp.fit = fits ? "Plan fits, PKR " + fmt(k.left - leftPlan) + " spare" : "Plan is PKR " + fmt(leftPlan - k.left) + " more than you have"; mp.fitCls = fits ? "ok-t" : "warn-t";
      mp.days = state.map(r => { const dd = parse(r.date), on = r.date === sel;
        return {wd: dd.toLocaleDateString("en-GB", {weekday:"short"}), dn: dd.getDate(), cls: (on ? "sel " : "") + (r.date === TODAY ? "today" : ""), pressed: on ? "true" : "false", a: r.nashta, b: r.dinner, pick: () => self.setState({mpDay: r.date})}; });
      const day = days.find(d => d.date === sel);
      mp.slots = ["nashta","dinner"].filter(sl => day[sl]).map(sl => { const p = day[sl], e = mpEaten(D, day.date, sl), past = day.date < TODAY, key = day.date + "|" + sl;
        const meta = [(p.est ? "about " : "") + "PKR " + fmt(p.price), p.source, p.delivery ? "incl. " + p.delivery + " delivery" : "", p.tip || ""].filter(Boolean).join(" · ");
        const o = {meal: MEALS[sl], vendor: p.vendor, item: p.item, meta, open: !e, logged: !!e, swapped: false, logLabel: (past ? "Log it" : "Ordered") + ", PKR " + fmt(p.price), rate: this.rateVm(e),
          log: () => { const tx = {id: uid("t"), date: day.date, amount: p.price, currency: "PKR", pkr: p.price, deliveryFee: p.delivery || 0, category: "Food", meal: sl, source: p.source || "Cash", note: (p.vendor + ": " + p.item).slice(0, 140), plan: key, createdAt: nowAt()};
            self.change(d => { d.finance.txns.unshift(tx); }, "Logged " + p.vendor + ", PKR " + fmt(p.price)); },
          other: () => self.openAdd({meal: sl, f: {add_date: day.date, add_cat: "Food", add_src: "Foodpanda"}})};
        if (e) { const onPlan = e.plan === key, diff = e.pkr - p.price;
          o.loggedText = onPlan ? "Logged, PKR " + fmt(e.pkr) : "Logged, PKR " + fmt(Math.abs(diff)) + (diff >= 0 ? " over" : " under") + " plan"; o.loggedCls = e.pkr > p.price * 1.1 ? "warn-t" : "ok-t";
          if (!onPlan) { o.swapped = true; o.planVendor = p.vendor; o.vendor = placeOf(e) || "Something else"; o.item = dishesOf(e).join(", "); o.meta = ["PKR " + fmt(e.pkr), e.source || ""].filter(Boolean).join(" · "); } }
        return o; });
      mp.planned = fmt(planned); mp.eaten = fmt(eatenActual); mp.eatenPlan = fmt(eatenPlan); mp.eatenCls = eatenActual > eatenPlan * 1.05 ? "warn-t" : ""; mp.leftPlan = fmt(leftPlan); mp.note = mpl.note || "";
    }

    /* ===== planner ===== */
    const pl = {}, extra = +s.f.sl_extra || 0, ly = kh.years[0];
    pl.khStatus = ks.word; pl.khCls = ks.tone === "warn" ? "warn-t" : "ok-t";
    pl.ly1 = ly ? ly.year : "Last year"; pl.ly2 = ly ? (!(ly.khumsDue > 0) ? "none due" : ly.unpaid <= .5 ? "paid" : "unpaid") : "";
    pl.today = nice(TODAY); pl.due = kh.kh.next ? nice(kh.kh.next) : "set date";
    pl.khNote = (kh.kh.label || "This year") + " becomes payable " + (kh.daysTo != null && kh.daysTo >= 0 ? "in " + kh.daysTo + " days" : "on 23 Ramadan") + ". Until then nothing is owed and this is a running estimate that moves with your savings.";
    const heldX = kh.held + extra, taxX = Math.max(0, heldX - (kh.hasCarry ? kh.kh.carryPkr : 0));
    pl.extra = fmt(extra); pl.held = fmt(heldX); pl.tax = fmt(taxX); pl.kh = fmt(taxX / 5);
    const thirdF = pendingItems(D).filter(i => FROM_THIRD.includes(i.type)), open = thirdF.reduce((a,i) => a + toPkr(D, itemStatus(D, i).left || 0, i.currency), 0);
    const per = +s.f.sl_per || 6000, npay = open ? Math.ceil(open / per) : 0;
    pl.kafOpen = open ? "PKR " + fmt(open) + " open" : "Nothing open"; pl.per = fmt(per); pl.npay = npay; pl.cover = open ? Math.min(100, Math.round(per / open * 100)) + "%" : "All";
    pl.clear = npay ? longDate(addDays(cyc.nextPay, 28 * (npay - 1))) : "Already clear"; { const cd = npay ? addDays(cyc.nextPay, 28 * (npay - 1)) : null; pl.clearDn = cd ? parse(cd).getDate() : ""; pl.clearMy = cd ? parse(cd).toLocaleDateString("en-GB", {month: "long", year: "numeric"}) : "Already clear"; }
    pl.saveWajPer = () => { const v = +self.state.f.sl_per || 6000; self.change(d => { d.finance.config.wajibatPerCycle = v; }, "PKR " + fmt(v) + " a pay is now in your budget plan"); };
    const q = +s.f.sl_q || 1, mx = Math.max(1, ...DAY.map(kk => +qc[kk]||0)), lead = DAY.reduce((a,kk) => (+qc[kk]||0) > (+qc[a]||0) ? kk : a, "fajr");
    pl.qOwed = nfEn.format(qazaTotal(D)) + " owed"; pl.q = q;
    pl.qBars = PRAYERS.slice(0, 5).map(([kk, en]) => { const v = +qc[kk]||0; return {en, w: Math.round(v / mx * 100), cls: kk === lead && v ? "lead" : "", d: v ? nice(addDays(TODAY, Math.ceil(v / q))) : "Done", n: v}; });
    pl.qAll = longDate(qazaFinish(D, q).date); { const qd = qazaFinish(D, q).date; pl.qAllDn = parse(qd).getDate(); pl.qAllMy = parse(qd).toLocaleDateString("en-GB", {month: "long", year: "numeric"}); }
    const ch = wasiyatChecks(D), okN = ch.filter(x => x.ok).length;
    pl.wOk = okN; pl.wN = ch.length; pl.wPct = Math.round(okN / ch.length * 100);
    pl.wMissing = okN === ch.length ? "Ready. Print and sign again after big changes" : (ch.length - okN) + " " + (ch.length - okN === 1 ? "thing" : "things") + " left before it is ready to sign";
    pl.checks = ch.map(x => ({ok: x.ok, cls: x.ok ? "ok" : "miss", t: x.t, s: x.s, sign: !!x.sign, fix: !x.ok && !x.sign, goFix: go.wajibat,
      signed: () => { const key = willKey(self.state.data); self.change(d => { d.wajibat.profile = Object.assign({}, d.wajibat.profile, {signedAt: TODAY, signedKey: key}); }, "Recorded, wasiyat signed today"); }}));

    /* ===== money ===== */
    const mo = {};
    mo.cycle = nice(cyc.start) + " to " + nice(addDays(cyc.nextPay, -1));
    mo.left = fmt(k.left); mo.leftCls = k.left < 0 ? "neg-t" : ""; mo.leftSub = "of PKR " + fmt(cyc.opening) + " opening, " + fmt(k.spent) + " spent";
    mo.perDay = fmt(Math.max(0, k.perDay)); mo.perDaySub = "for " + plural(k.daysLeft, "day", "days") + " including today";
    mo.today = fmt(k.spentToday); mo.todaySub = rem >= 0 ? "PKR " + fmt(rem) + " left today" : "PKR " + fmt(-rem) + " over today"; mo.todayCls = rem >= k.allowToday * 0.25 ? "ok-t" : rem >= 0 ? "warn-t" : "neg-t";
    const dTo = dayDiff(TODAY, cyc.nextPay); mo.payIn = dTo <= 0 ? "Due" : plural(dTo, "day", "days"); mo.paySub = nice(cyc.nextPay) + ", PKR " + fmt(cfg.payAmount);
    const spentPct = cyc.opening > 0 ? Math.min(100, k.spent / cyc.opening * 100) : 0, ahead = spentPct > k.elapsed * 100 + 8;
    mo.spentPct = Math.round(spentPct * 10) / 10; mo.elapsedPct = Math.round(k.elapsed * 1000) / 10; mo.aheadCls = ahead ? "ahead" : "";
    mo.paceText = Math.round(spentPct) + "% of the money spent, " + Math.round(k.elapsed * 100) + "% of the cycle gone. " + (ahead ? "Spending is running ahead of the calendar" : "You are on pace");
    const caps = cfg.caps || {}, food = k.tx.filter(t => t.category === "Food");
    mo.foodTotal = "PKR " + fmt(food.reduce((a,t) => a + t.pkr, 0)) + " on food this cycle";
    mo.meals = Object.keys(MEALS).map(m => { const rows = food.filter(t => t.meal === m && !isRefund(t)), avg = rows.length ? rows.reduce((a,t) => a + myPkr(t), 0) / rows.length : 0, over = rows.filter(t => myPkr(t) > (caps[m]||0)).length;
      return {name: MEALS[m], cap: fmt(caps[m]||0), line: rows.length ? "Avg " + fmt(avg) + ", " + plural(rows.length, "order", "orders") : "No orders yet", st: rows.length ? (over ? over + " over cap" : "Within cap") : "", stCls: over ? "warn-t" : "ok-t"}; });
    const dailyCap = Math.round(foodPlan(cfg).total / 28), cd = [];
    for (let i = 13; i >= 0; i--) cd.push(addDays(TODAY, -i));
    const cdata = cd.map(d => { const r = {d, nashta:0, dinner:0, snack:0, other:0}; F(D).txns.filter(t => t.date === d && t.category === "Food").forEach(t => { r[MEALS[t.meal] ? t.meal : "other"] += t.pkr; }); r.total = r.nashta + r.dinner + r.snack + r.other; return r; });
    const maxV = Math.max(dailyCap * 1.25, ...cdata.map(r => r.total), 100), step = maxV > 4000 ? 1000 : maxV > 1600 ? 500 : 250, top = Math.ceil(maxV / step) * step;
    mo.grid = []; for (let v = 0; v <= top; v += step) mo.grid.push({pct: v / top * 100, label: fmt(v)});
    mo.capPct = dailyCap / top * 100; mo.dailyCap = fmt(dailyCap);
    mo.cols = cdata.map((r, i) => { const dd = parse(r.d), isT = r.d === TODAY;
      return {cls: isT ? "today" : "", day: (i === 0 || dd.getDate() === 1) ? dd.getDate() + " " + dd.toLocaleDateString("en-GB", {month:"short"}) : String(dd.getDate()), total: r.total ? fmt(r.total) : "", pct: r.total / top * 100,
        title: nice(r.d) + ": " + (r.total ? ["nashta","dinner","snack","other"].filter(m => r[m]).map(m => (MEALS[m] || "Other food") + " PKR " + fmt(r[m])).join(", ") : "nothing"),
        segs: ["other","snack","dinner","nashta"].filter(m => r[m]).map(m => ({k: m, pct: r[m] / Math.max(1, r.total) * 100}))}; });
    mo.cols.forEach(c => { c.segPctOf = c.pct; c.segs.forEach(x => x.pct = x.pct * c.pct / 100); });
    const inc = cfg.payAmount || 0, billRows = myBills(D).map(b => ({label: b.name, v: toPkr(D, b.amount, b.currency), note: fmtC(b.amount, b.currency)}));
    const fpl = foodPlan(cfg), save = cfg.savePerCycle || 0, waj = cfg.wajibatPerCycle || 0;
    const wajLeft = third.reduce((a,i) => { const st = itemStatus(D, i); return a + (st.left ? toPkr(D, st.left, i.currency) : 0); }, 0);
    const used = billRows.reduce((a,r) => a + r.v, 0) + fpl.total + save + waj, buffer = inc - used;
    const prow = [...billRows, {label: "Savings", v: save, note: "Emergency fund first", lead: true},
      ...(waj || wajLeft ? [{label: "Wajibat set-aside", v: waj, note: waj ? "PKR " + fmt(wajLeft) + " of kaffara and dues open, about " + Math.ceil(wajLeft / waj) + " cycles to clear" : "PKR " + fmt(wajLeft) + " open, set an amount in Settings"}] : []),
      {label: "Food (28 days)", v: fpl.total, note: fpl.mp.nashta + " nashta, " + fpl.mp.dinner + " dinners, " + fpl.mp.snack + " snacks at cap, plus PKR " + fmt(cfg.otherFood||0) + " other food"},
      {label: buffer >= 0 ? "Everything else" : "Short by", v: Math.abs(buffer), note: buffer >= 0 ? "Transport, phone, family, extras" : "The plan costs more than the pay", neg: buffer < 0}];
    const pmax = Math.max(1, ...prow.map(r => r.v));
    mo.income = "PKR " + fmt(inc) + " per 4 weeks";
    mo.plan = prow.map(r => ({label: r.label, note: r.note, v: fmt(r.v), pct: (inc ? Math.round(r.v / inc * 100) : 0) + "%", w: r.v / pmax * 100, cls: r.neg ? "neg" : r.lead ? "lead" : ""}));
    mo.planNote = "Bills take " + (inc ? Math.round(billRows.reduce((a,r) => a + r.v, 0) / inc * 100) : 0) + "% of each pay. Bills are monthly and pay is every 4 weeks, so about once a year a cycle has no bill in it: send that whole amount to savings.";
    mo.dues = third.map(i => { const st = itemStatus(D, i), ty = TYPES[i.type] || TYPES.other, id = i.id;
      return {type: ty[0], title: i.title, meta: [i.amount != null ? fmtC(i.amount, i.currency) + " in all" : "Amount not set", ...(i.payments||[]).map(p => "paid " + fmtC(p.amount, p.currency) + " on " + nice(p.date))].join(", "),
        left: st.left != null ? fmtC(st.left, i.currency) : "Not set", canPay: !!st.left, amt: this.fv("ip_amt_" + id, String(Math.round(st.left || 0))), cur: this.fv("ip_cur_" + id, i.currency || "PKR"),
        pay: () => { const a = +self.fv("ip_amt_" + id, String(Math.round(st.left || 0))).v, c = self.fv("ip_cur_" + id, i.currency || "PKR").v; const DD = self.state.data;
          if (!(a > 0) || !rate(DD, c)) return; const t = {id: uid("t"), date: TODAY, amount: a, currency: c, pkr: Math.round(toPkr(DD, a, c)), category: "Wajibat", meal: "", source: "Cash", note: i.title, itemId: id, createdAt: nowAt()};
          self.change(d => { d.finance.txns.unshift(t); const x = d.wajibat.items.find(y => y.id === id); if (x) { x.payments = [...(x.payments||[]), {date: TODAY, amount: a, currency: c, txnId: t.id}]; if (itemStatus(d, x).left === 0) x.status = "cleared"; x.updatedAt = nowAt(); } }, "Paid: " + i.title); }}; });
    mo.noDues = !mo.dues.length;
    const debtVm = d => { const st = debtStatus(D, d), inb = d.direction === "owed_to_me", id = d.id;
      return {dir: inb ? "Owes you" : "You owe", dirCls: inb ? "ok" : "warn", person: d.person, ur: d.person_ur || "", meta: [fmtC(d.amount, d.currency), ...(d.payments||[]).map(p => "repaid " + fmtC(p.amount, p.currency) + " on " + nice(p.date)), d.khumsPaid ? "khums already paid" : ""].filter(Boolean).join(", "),
        note: d.note || "", left: st.open ? "PKR " + fmt(st.left) : "Settled", native: st.open && d.currency !== "PKR" ? "About " + fmtC(st.leftNative, d.currency) + " left" : "", open: st.open,
        amt: this.fv("dr_amt_" + id, ""), cur: this.fv("dr_cur_" + id, d.currency),
        record: () => { const a = +self.state.f["dr_amt_" + id], c = self.state.f["dr_cur_" + id] || d.currency; if (!(a > 0)) { self.toast("Type the repayment first"); return; }
          self.change(dd => { const x = dd.debts.find(y => y.id === id); if (x) { x.payments = [...(x.payments||[]), {date: TODAY, amount: a, currency: c}]; if (!debtStatus(dd, x).open) x.status = "cleared"; } }, "Repayment recorded"); self.setF("dr_amt_" + id, ""); },
        settle: () => self.change(dd => { const x = dd.debts.find(y => y.id === id); if (x) x.status = "cleared"; }, "Marked settled")}; };
    const dl = [...D.debts].sort((a,b) => debtStatus(D, b).open - debtStatus(D, a).open);
    mo.debtsOpen = dl.filter(d => debtStatus(D, d).open).map(debtVm); mo.debtsClosed = dl.filter(d => !debtStatus(D, d).open).map(debtVm);
    mo.noDebts = !mo.debtsOpen.length; mo.hasClosed = mo.debtsClosed.length > 0; mo.closedN = mo.debtsClosed.length;
    mo.addDebt = () => { const ff = self.state.f; if (!ff.debt_person.trim() || !(+ff.debt_amount > 0)) { self.toast("Add a name and an amount"); return; }
      const d0 = {id: uid("debt"), person: ff.debt_person.trim(), person_ur: ff.debt_person_ur, direction: ff.debt_direction, amount: +ff.debt_amount, currency: ff.debt_currency, payments: [], contact: ff.debt_contact, note: ff.debt_note, note_ur: ff.debt_note_ur, khumsPaid: !!ff.debt_khumsPaid, status: "open"};
      self.change(d => { d.debts.push(d0); }, "Added"); const x = {}; ["debt_person","debt_person_ur","debt_amount","debt_contact","debt_note","debt_note_ur"].forEach(kk => x[kk] = ""); x.debt_khumsPaid = false; self.setState(st => ({f: Object.assign({}, st.f, x)})); };
    const billVm = b => { const due = billDue(D, b), mentor = b.paidBy === "mentor", paid = !mentor && b.lastPaid && b.lastPaid >= cyc.start;
      return {name: b.name, mentor, meta: [fmtC(b.amount, b.currency) + " a month", mentor ? "" : "about PKR " + fmt(toPkr(D, b.amount, b.currency)), "due " + nice(due), mentor ? (b.remindedAt ? "reminded " + nice(b.remindedAt) : "") : (b.lastPaid ? "last paid " + nice(b.lastPaid) : "")].filter(Boolean).join(", "),
        paid: !!paid, canPay: !mentor && !paid, canRemind: mentor,
        pay: () => { const t = {id: uid("t"), date: TODAY, amount: b.amount, currency: b.currency, pkr: Math.round(toPkr(self.state.data, b.amount, b.currency)), category: "Bills & subs", meal: "", source: "Card", note: b.name, createdAt: nowAt()};
          self.change(d => { d.finance.txns.unshift(t); const x = d.finance.bills.find(y => y.id === b.id); if (x) x.lastPaid = TODAY; }, "Bill paid: " + b.name); },
        remind: () => self.change(d => { const x = d.finance.bills.find(y => y.id === b.id); if (x) x.remindedAt = TODAY; }, "Marked, reminder sent to your mentor")}; };
    mo.bills = myBills(D).map(billVm); mo.mentorBills = F(D).bills.filter(b => b.paidBy === "mentor").map(billVm); mo.hasMentor = mo.mentorBills.length > 0; mo.noBills = !mo.bills.length;
    const saved = savings(D), months = cfg.payAmount ? saved / (cfg.payAmount - (cfg.savePerCycle||0)) : 0;
    mo.hold = [{t: "Savings", s: "Covers about " + (Math.round(months * 10) / 10) + " of a cycle. Aim for 3 cycles", v: "PKR " + fmt(saved)}, {t: "Spending money", s: "Left in this cycle", v: "PKR " + fmt(k.left)},
      ...(cfg.foreignCash||[]).map(x => ({t: x.currency + " cash", s: "About PKR " + fmt(toPkr(D, x.amount, x.currency)) + (x.note ? ". " + x.note : ""), v: fmtC(x.amount, x.currency)})),
      ...Object.entries(credits(D)).filter(([, v]) => Math.abs(v) >= 1).map(([kk, v]) => ({t: CREDIT_LABEL[kk] || kk, s: "From refunds. Choose it under Paid by when you order", v: "PKR " + fmt(v)})),
      ...openVouchers(D).map(v => ({t: v.platform + " voucher", s: (v.expires ? "Use by " + nice(v.expires) : "No expiry noted") + (v.note ? ". " + v.note : ""), v: "PKR " + fmt(v.amount)}))];
    const txr = [...k.tx].sort((a,b) => (b.date + (b.createdAt||"")).localeCompare(a.date + (a.createdAt||"")));
    mo.txCount = plural(txr.length, "entry", "entries"); mo.hasTx = txr.length > 0; mo.noTx = !txr.length;
    mo.tx = txr.map(t => ({date: nice(t.date), meal: t.meal && MEALS[t.meal] ? MEALS[t.meal] : "", note: (t.note || "") + (t.guestPkr ? ". Your share PKR " + fmt(myPkr(t)) : "") + (t.discount ? ". Discount PKR " + fmt(t.discount) : ""), food: t.category === "Food" && !isRefund(t), rate: this.rateVm(t), cat: isRefund(t) ? "Refund" : t.category,
      src: isRefund(t) ? ((t.refundTo || "").startsWith("credit:") ? "To " + (CREDIT_LABEL[t.refundTo.slice(7)] || "credit") : "Back to card") : (t.paidFrom || "").startsWith("credit:") ? CREDIT_LABEL[t.paidFrom.slice(7)] || "Credit" : t.source || "", amt: t.currency === "PKR" ? "" : fmtC(t.amount, t.currency), pkr: fmt(t.pkr),
      armed: !!s.armed["del_" + t.id], delCls: s.armed["del_" + t.id] ? "del armed" : "del", delLabel: s.armed["del_" + t.id] ? "Delete?" : "",
      leaving: s.leaving === t.id ? "leaving" : "",
      del: () => { if (!self.state.armed["del_" + t.id]) { self.arm("del_" + t.id); return; } self.setState({leaving: t.id}); setTimeout(() => { self.setState({leaving: null}); self.change(d => { d.finance.txns = d.finance.txns.filter(x => x.id !== t.id); }, "Entry deleted"); }, 220); }}));

    /* ===== accounts ===== */
    const ac = {ready: !!s.st};
    if (s.st) {
      const ST = s.st, byId = {}, byStmt = {};
      F(D).txns.forEach(t => { byId[t.id] = t; if (t.stmtId) byStmt[t.stmtId] = t; });
      const link = r => byStmt[r.id] || (r.txId && byId[r.txId]) || null;
      ac.stamp = "Updated " + nice(ST.generated);
      ac.cards = Object.entries(ST.accounts).map(([kk, a], i) => ({i, kind: kk, title: a.title, bal: fmt2(a.balance), holder: a.holder, brand: kk === "nayapay" ? "NayaPay" : "Bank", type: kk === "nayapay" ? "Wallet and Visa card" : (a.kind || "Savings"),
        on: s.acAcct === kk ? "on" : "", pressed: s.acAcct === kk ? "true" : "false", aria: (s.acAcct === kk ? "Show both accounts" : "Show only " + a.title) + ", balance PKR " + fmt2(a.balance),
        pick: () => self.setState({acAcct: self.state.acAcct === kk ? "all" : kk}),
        tags: [{t: "As of " + nice(a.asOf.slice(0, 10)), c: "t-transport"}, {t: ST.rows.filter(r => r.acct === kk).length + " transactions", c: ""}, {t: "Since " + nice(a.from), c: ""}, {t: a.holder, c: ""}]}));
      const logStmt = r => () => { const food = r.cat === "Food", hr = +r.ts.slice(11, 13), x = {add_date: r.date, add_amount: String(Math.abs(r.amount))}; let meal = "";
        if (food) { meal = hr >= 4 && hr < 15 ? "nashta" : "dinner"; x.add_cat = "Food"; x.add_src = r.party === "Foodpanda" ? "Foodpanda" : "Direct order"; }
        else { x.add_cat = r.cat === "Transport" ? "Transport" : "Other"; x.add_src = "Card"; }
        if (r.party !== "Foodpanda" && !/^Paid the rider/.test((r.notes || [""])[0])) x.add_place = r.party;
        self.openAdd({meal, f: x, stmt: r.id}); self.toast("Add what you had, then Save"); };
      const miss = ST.rows.filter(r => r.amount < 0 && r.date >= cyc.start && r.cat !== "Own accounts" && r.cat !== "Fees" && !link(r));
      ac.hasMissing = miss.length > 0;
      ac.missing = miss.map(r => ({party: r.party, meta: nice(r.date) + ", " + r.ts.slice(11) + " · " + r.via + " · " + r.cat, amt: fmt2(r.amount), log: logStmt(r)}));
      const ms = [...new Set(ST.rows.map(r => r.date.slice(0, 7)))].sort().reverse();
      ac.monthOpts = ms.map(m => ({v: m, l: new Date(m + "-01T12:00").toLocaleDateString("en-GB", {month:"long", year:"numeric"})}));
      const pv = s.f.ac_month || ms[0]; let months2 = [pv], range = false;
      if (/^r\d+$/.test(pv)) { range = true; const nn = +pv.slice(1), last = ST.rows.reduce((m, r) => r.date > m ? r.date : m, "").slice(0, 7); months2 = []; let [y, mo2] = last.split("-").map(Number);
        for (let i = 0; i < nn; i++) { months2.unshift(y + "-" + pad(mo2)); if (--mo2 === 0) { mo2 = 12; y--; } } }
      const inP = r => months2.includes(r.date.slice(0, 7)), mr = ST.rows.filter(r => inP(r) && (s.acAcct === "all" || r.acct === s.acAcct));
      const ext = mr.filter(r => r.cat !== "Own accounts"), inn = ext.filter(r => r.amount > 0).reduce((a,r) => a + r.amount, 0), out = -ext.filter(r => r.amount < 0).reduce((a,r) => a + r.amount, 0);
      const byCat = {}; ext.filter(r => r.amount < 0).forEach(r => byCat[r.cat] = (byCat[r.cat] || 0) - r.amount);
      const cats = Object.entries(byCat).sort((a,b) => b[1] - a[1]), cmax = Math.max(1, ...cats.map(c => c[1]));
      const byParty = {}; ext.filter(r => r.amount < 0).forEach(r => byParty[r.party] = (byParty[r.party] || 0) - r.amount);
      const own = mr.filter(r => r.cat === "Own accounts").reduce((a,r) => a + Math.abs(r.amount), 0) / 2;
      ac.hasRows = mr.length > 0; ac.noRows = !mr.length;
      ac.inn = fmt2(inn); ac.out = fmt2(out); ac.net = (inn - out >= 0 ? "+" : "-") + fmt2(inn - out); ac.netCls = inn - out >= 0 ? "ok-t" : "neg-t";
      ac.avg = range ? fmt2(out / months2.length) : ""; ac.hasAvg = range; ac.own = own ? fmt2(own) : ""; ac.hasOwn = !!own;
      ac.range = range; ac.periodLabel = range ? "Last " + months2.length + " months" : new Date(pv + "-01T12:00").toLocaleDateString("en-GB", {month:"long", year:"numeric"});
      if (range) { const mm = months2.map(m => { const xs = mr.filter(r => r.date.slice(0, 7) === m && r.cat !== "Own accounts"); return {m, i: xs.filter(r => r.amount > 0).reduce((a,r) => a + r.amount, 0), o: -xs.filter(r => r.amount < 0).reduce((a,r) => a + r.amount, 0)}; });
        const mmx = Math.max(1, ...mm.map(x => Math.max(x.i, x.o)));
        ac.bars = mm.map(x => ({ih: x.i / mmx * 100, oh: x.o / mmx * 100, mon: new Date(x.m + "-01T12:00").toLocaleDateString("en-GB", {month:"short"}), net: (x.i - x.o >= 0 ? "+" : "-") + fmt(Math.abs(x.i - x.o) / 1000) + "k",
          label: new Date(x.m + "-01T12:00").toLocaleDateString("en-GB", {month:"long", year:"numeric"}) + ": in PKR " + fmt2(x.i) + ", out PKR " + fmt2(x.o), open: () => self.setF("ac_month", x.m)})); }
      ac.cats = cats.map(([c, v], i) => ({c, v: fmt2(v), pct: Math.round(v / Math.max(1, out) * 100) + "%", w: v / cmax * 100, cls: i === 0 ? "lead" : ""}));
      ac.top = Object.entries(byParty).sort((a,b) => b[1] - a[1]).slice(0, 6).map(([p, v]) => ({p, v: fmt2(v)}));
      ac.acct = ["all","nayapay","bank"].map(a => ({label: a === "all" ? "Both accounts" : a === "nayapay" ? "NayaPay" : "Bank", pressed: s.acAcct === a ? "true" : "false", pick: () => self.setState({acAcct: a})}));
      const allCats = [...new Set(ST.rows.map(r => r.cat))].sort();
      ac.catChips = [{label: "All", cls: "choice", pressed: !s.acCat ? "true" : "false", pick: () => self.setState({acCat: ""})}, ...allCats.map(c => ({label: c, cls: "choice t-" + String(c).toLowerCase().replace(/[^a-z]+/g, "-"), pressed: s.acCat === c ? "true" : "false", pick: () => self.setState({acCat: c})}))];
      const qq = (s.f.ac_search || "").trim().toLowerCase();
      let list = ST.rows.filter(r => (s.acAcct === "all" || r.acct === s.acAcct) && (!s.acCat || r.cat === s.acCat));
      list = qq ? list.filter(r => { const t = link(r); return [r.party, r.via, r.cat, (r.notes || []).join(" "), t ? t.note + " " + (t.review || "") : ""].join(" ").toLowerCase().includes(qq); }) : list.filter(inP);
      list = list.slice().reverse();
      ac.count = list.length + " shown" + (qq ? " across all months" : list.length > 600 ? ", newest 600 listed" : "");
      const groups = []; let last = "";
      list.slice(0, 600).forEach(r => { if (r.date !== last) { last = r.date; { const dd = new Date(r.date + "T12:00"); let hj = ""; try { const pp = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", {day: "numeric", month: "long"}).formatToParts(dd); hj = pp.find(p => p.type === "day").value + " " + pp.find(p => p.type === "month").value; } catch(e) {} groups.push({day: dd.toLocaleDateString("en-GB", {weekday:"short", day:"numeric", month:"short", year:"numeric"}), dn: dd.getDate(), rest: dd.toLocaleDateString("en-GB", {weekday:"long"}) + ", " + dd.toLocaleDateString("en-GB", {month:"long", year:"numeric"}), hj, rows: []}); } }
        const t = link(r), meal = t && MEALS[t.meal] ? MEALS[t.meal] : "";
        const tg = (t2, c2) => t2 ? {t: t2, c: c2 || ""} : null;
        groups[groups.length - 1].rows.push({party: r.party, cls: r.amount > 0 ? "in" : "out", tag: r.cat || "",
          tags: [tg(r.via), r.acct === "bank" ? tg("Bank", "t-bills") : null, tg(r.cat, "t-" + String(r.cat || "other").toLowerCase().replace(/[^a-z]+/g, "-")), r.fx ? tg(r.fx, "t-transport") : null, meal ? tg(meal, "t-food") : null, r.acct === "nayapay" ? tg(r.ts.slice(11)) : null].filter(Boolean), tagCls: "t-" + String(r.cat || "other").toLowerCase().replace(/[^a-z]+/g, "-"), meta: [r.via, r.acct === "bank" ? "Bank" : "", r.fx || "", meal, r.acct === "nayapay" ? r.ts.slice(11) : ""].filter(Boolean).join(" · "),
          notes: (r.notes || []).map(n => ({n})), inApp: !!t, appNote: t ? t.note || "" : "", food: !!(t && t.category === "Food"), rate: this.rateVm(t),
          canLog: !t && r.amount < 0 && ["Food","Transport","Shopping","Transfers out"].includes(r.cat) && r.date >= cyc.start, log: logStmt(r),
          amt: (r.amount > 0 ? "+" : "-") + fmt2(r.amount), bal: "Balance " + fmt2(r.balance)}); });
      ac.groups = groups; ac.empty = !groups.length;
    }

    /* ===== khums ===== */
    const km = {};
    km.status = ks.word; km.statusCls = ks.tone === "warn" ? "warn-t" : "ok-t"; km.last = lastYearNote(kh);
    km.payable = "Payable on 23 Ramadan " + (kh.kh.label || "") + (kh.daysTo != null && kh.daysTo >= 0 ? ", in " + kh.daysTo + " days" : "");
    km.est = fmt(kh.est);
    km.estSub = !kh.hasCarry ? "Running estimate before subtracting mukhamas, so likely too high" : kh.taxable > 0 ? "Running estimate: one fifth of the PKR " + fmt(kh.taxable) + " you hold above the mukhamas. It moves with your savings until the day." : "Holdings are below the mukhamas, so none would be due at this rate";
    km.date = kh.kh.next ? "About " + longDate(kh.kh.next) + ", depends on moon sighting" : "Set the date in Settings";
    km.calc = [{l: "Savings", v: "PKR " + fmt(savings(D))}, {l: "Spending money left this cycle", v: "PKR " + fmt(Math.max(0, k.left))}, ...(kh.fx ? [{l: "Foreign cash", v: "PKR " + fmt(kh.fx)}] : []),
      {l: "Owed to you (khums not yet paid on it)", v: "PKR " + fmt(kh.recv)}, ...(kh.pay ? [{l: "Less what you owe", v: "-PKR " + fmt(kh.pay), cls: "neg"}] : []), {l: "Held now", v: "PKR " + fmt(kh.held), cls: "sum"},
      ...(kh.hasCarry ? [{l: "Less mukhamas carried in", v: "-PKR " + fmt(kh.kh.carryPkr), cls: "dim"}] : []), {l: "Surplus above mukhamas", v: "PKR " + fmt(Math.max(0, kh.taxable)), cls: "sum total"}];
    km.unpaid = kh.unpaid.length ? "Unpaid khums: " + kh.unpaid.map(y => y.year + " " + fmtC(y.unpaid, y.c)).join(", ") + ". This is listed in the wasiyat as a debt on the whole estate until recorded as paid." : "";
    km.hasYears = kh.years.length > 0; km.noYears = !kh.years.length;
    km.years = kh.years.map(y => { const c = y.c, n = v => typeof v === "number" ? fmtC(v, c) : "Not recorded", due = y.khumsDue || 0;
      return {year: y.year, period: y.period || "", greg: y.gregorian || "", date: y.date ? nice(y.date) : "", sav: n(y.savings), min: n(y.mukhamasIn), due: typeof y.khumsDue === "number" ? fmtC(y.khumsDue, c) : "", mout: n(y.mukhamasOut),
        st: due <= 0 ? "None due" : y.unpaid <= 0.5 ? "Paid" : (y.payments||[]).length ? fmtC(y.unpaid, c) + " left" : "Payment not recorded", stCls: due <= 0 || y.unpaid <= 0.5 ? "ok-t" : "warn-t",
        pays: (y.payments||[]).map(p => ({t: p.share + ": " + fmtC(p.amount, p.currency) + " on " + nice(p.date) + (p.to ? " to " + p.to : "")})), note: y.note || ""}; });
    km.yearOpts = kh.years.map(y => ({v: y.id, l: y.year}));
    if (!s.f.kp_year && kh.years.length) f.kp_year = {v: (kh.unpaid[0] || kh.years[0]).id, on: this.onF("kp_year")};
    km.savePay = () => { const ff = self.state.f, id = ff.kp_year || (kh.unpaid[0] || kh.years[0] || {}).id, a = +ff.kp_amt; if (!id || !(a > 0)) { self.toast("Pick a year and type the amount"); return; }
      const p = {date: ff.kp_date || TODAY, amount: a, currency: ff.kp_cur, share: ff.kp_share, to: (ff.kp_to || "").trim()};
      self.change(d => { const y = d.khums.years.find(x => x.id === id); if (y) y.payments = [...(y.payments||[]), p]; }, "Khums payment saved"); self.setF("kp_amt", "", {kp_to: ""}); };
    km.closeYear = () => { const ff = self.state.f, year = (ff.kc_year || "").trim(); if (!year) { self.toast("Type the year first"); return; }
      const n = kk => ff[kk] === "" ? null : +ff[kk], ks0 = self.state.data.khums.settings || {};
      const y = {id: year, year, date: ff.kc_date, currency: ff.kc_cur, savings: n("kc_sav"), khumsDue: n("kc_due") ?? 0, mukhamasOut: n("kc_out"), mukhamasIn: ks0.carryPkr ?? null, gregorian: ks0.gregorian || "", period: "", payments: []};
      const nextLabel = (ff.kc_nextLabel || "").trim(), next = ff.kc_next;
      self.change(d => { d.khums.years = d.khums.years.filter(x => x.id !== year).concat([y]);
        d.khums.settings = Object.assign({}, d.khums.settings, {label: nextLabel || d.khums.settings.label, next: next || d.khums.settings.next, carryPkr: y.currency === "PKR" && y.mukhamasOut != null ? y.mukhamasOut : d.khums.settings.carryPkr, gregorian: ""}); }, "Year " + year + " closed");
      const x = {}; ["kc_year","kc_date","kc_sav","kc_due","kc_out","kc_next","kc_nextLabel"].forEach(kk => x[kk] = ""); self.setState(st => ({f: Object.assign({}, st.f, x)})); };

    /* ===== wajibat ===== */
    const wj = {}, q2 = D.wajibat.qaza, pend = pendingItems(D), relOpen = pend.filter(i => RELIGIOUS.includes(i.type)).length + kh.unpaid.length;
    wj.fullDay = () => self.bump(Object.fromEntries(DAY.map(kk => [kk, -1])));
    wj.stats = [{label: "Qaza prayers", value: nfEn.format(qazaTotal(D)), sub: "Done " + nice(qazaFinish(D, 1).date) + " at 1 a prayer"},
      {label: "Qaza fasts", value: nfEn.format(+q2.roza||0), sub: +q2.roza ? "Still owed" : "None owed"},
      {label: "Owed now", value: relOpen ? nfEn.format(relOpen) : "None", cls: relOpen ? "" : "word", sub: relOpen ? pend.filter(i => RELIGIOUS.includes(i.type)).map(i => (TYPES[i.type]||TYPES.other)[0]).concat(kh.unpaid.map(y => "Khums " + y.year)).join(", ") : "Nothing pending"},
      {label: "Khums", value: ks.word, cls: "word", sub: ks.line},
      {label: "Debts open", value: nfEn.format(openDebts(D).length), sub: openDebts(D).filter(d => d.direction !== "owed_to_me").length + " you owe, " + openDebts(D).filter(d => d.direction === "owed_to_me").length + " owed to you"}];
    wj.prayers = PRAYERS.map(([kk, en, ur]) => { const n = +qc[kk]||0; return {en, ur, n: nfEn.format(n), zero: n ? "" : "zero", noneOwed: !n, offered: () => self.bump({[kk]: -1}), missed: () => self.bump({[kk]: 1})}; });
    wj.roza = nfEn.format(+q2.roza||0); wj.rozaMinus = () => self.bump({roza: -1}); wj.rozaPlus = () => self.bump({roza: 1});
    const pname = kk => kk === "roza" ? "Roza" : (PRAYERS.find(p => p[0] === kk) || [0, kk])[1];
    wj.log = (D.wajibat.log||[]).slice(0, 8).map(l => ({when: (l.at ? nice(l.at.slice(0, 10)) + ", " + l.at.slice(11, 16) : ""), what: Object.entries(l.changes||{}).map(([kk, d]) => pname(kk) + " " + (d < 0 ? "offered " + (-d) : "missed, +" + d)).join(", ")}));
    wj.hasLog = wj.log.length > 0; wj.noLog = !wj.log.length;
    const items = D.wajibat.items, order = {unclear:0, pending:1, cleared:2};
    const itemVm = it => { const ty = TYPES[it.type] || TYPES.other, st = itemStatus(D, it), id = it.id;
      return {title: it.title, titleUr: it.title_ur || "", amt: it.amount != null ? fmtC(st.left, it.currency) : "", of: it.amount != null && st.paid ? "of " + fmtC(it.amount, it.currency) : "",
        meta: [ty[0], it.status, it.contact || ""].filter(Boolean).join(" · "), note: it.note || "", canClear: it.status !== "cleared",
        clear: () => self.change(d => { const x = d.wajibat.items.find(y => y.id === id); if (x) { x.status = "cleared"; x.updatedAt = nowAt(); } }, "Marked cleared"),
        edit: () => self.openItem(it)}; };
    wj.items = items.filter(i => i.status !== "cleared").sort((a,b) => order[a.status] - order[b.status] || a.type.localeCompare(b.type)).map(itemVm);
    wj.cleared = items.filter(i => i.status === "cleared").map(itemVm); wj.clearedN = wj.cleared.length; wj.noItems = !wj.items.length; wj.noCleared = !wj.cleared.length;
    const un = items.filter(i => i.status === "unclear"); wj.unclear = un.length ? un.length + " item(s) need confirming before they enter the wasiyat: " + un.map(i => i.title).join(", ") : "";
    wj.addItem = () => self.openItem(null);
    wj.form = !!s.itemForm; wj.formNew = !!(s.itemForm && s.itemForm.isNew); wj.formOld = !!(s.itemForm && !s.itemForm.isNew);
    wj.typeOpts = Object.entries(TYPES).map(([v, l]) => ({v, l: l[0]})); wj.statusOpts = [{v:"pending", l:"Pending"},{v:"cleared", l:"Cleared"},{v:"unclear", l:"Unclear (keep out of the wasiyat)"}];
    wj.saveItem = () => self.saveItem(); wj.cancelItem = () => self.setState({itemForm: null});
    wj.delArmed = !!s.armed.itemdel; wj.delLabel = s.armed.itemdel ? "Tap again to delete" : "Delete";
    wj.delItem = () => { if (!self.state.armed.itemdel) { self.arm("itemdel"); return; } const id = self.state.itemForm.id; self.change(d => { d.wajibat.items = d.wajibat.items.filter(x => x.id !== id); }, "Deleted"); self.setState({itemForm: null}); };
    wj.profile = PROFILE_FIELDS.map(([key, label, kind]) => ({key, label, v: f["pf_" + key].v, on: f["pf_" + key].on, plain: !kind, ur: kind === "ur", ltr: kind === "ltr", area: kind === "area", urarea: kind === "urarea", full: kind === "area" || kind === "urarea" ? "field full" : "field", id: "pf-" + key}));
    wj.saveProfile = () => { const ff = self.state.f, data = {updatedAt: nowAt()}; PROFILE_FIELDS.forEach(([kk]) => data[kk] = ff["pf_" + kk] || ""); self.change(d => { d.wajibat.profile = Object.assign({}, d.wajibat.profile, data); }, "Saved"); };

    /* ===== wasiyat ===== */
    const norm = b => { const segs = (b.segs || []).map(x => ({t: x.t, ltr: !!x.ltr, iso: !!x.iso, blank: !!x.blank, plain: !x.ltr && !x.iso && !x.blank}));
      return Object.assign({}, b, {segs, text: segs.map(x => x.t).join(""), items: (b.items || []).map(it => ({segs: it.segs.map(x => ({t: x.t, ltr: !!x.ltr, iso: !!x.iso, blank: !!x.blank, plain: !x.ltr && !x.iso && !x.blank}))}))}); };
    const wur = wasiyatUr(D), wen = wasiyatEn(D), ws = {ur: wur.map(norm), en: wen.map(norm)};
    const sig = ch[ch.length - 1], missN = ch.filter(x => !x.ok).length;
    ws.bannerCls = missN ? "banner warn" : "banner ok";
    ws.banner = (sig.ok ? "Last signed copy: " + sig.s.replace(/^Signed /, "") + ". " : "No signed copy recorded yet. Print it and sign with two just Muslim men as witnesses. ") + (missN ? missN + " " + (missN === 1 ? "item" : "items") + " still to complete." : "Everything is complete.");
    ws.hasMiss = missN > 0; ws.goCheck = go.planner;
    const copy = (blocks, label) => () => { const txt = blockText(blocks); try { navigator.clipboard.writeText(txt).then(() => self.toast(label + " copied"), () => self.toast("Copy is blocked here, select the text instead")); } catch(e) { self.toast("Copy is blocked here, select the text instead"); } };
    ws.copyUr = copy(wur, "Urdu text"); ws.copyEn = copy(wen, "English text");
    ws.download = () => { try { const html = "<!doctype html><meta charset=utf-8><title>Wasiyat " + TODAY + "</title><pre dir=rtl lang=ur style='font:16px/2 serif;white-space:pre-wrap'>" + blockText(wur).replace(/</g, "&lt;") + "</pre><hr><pre style='font:15px/1.6 serif;white-space:pre-wrap'>" + blockText(wen).replace(/</g, "&lt;") + "</pre>";
      const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([html], {type: "text/html"})); a.download = "wasiyat-" + TODAY + ".html"; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); self.toast("Download started"); } catch(e) { self.toast("Downloads are blocked in this preview"); } };
    ws.print = () => { try { window.print(); } catch(e) { self.toast("Printing is blocked in this preview"); } };
    ws.send = () => { const p = D.wajibat.profile || {}, to = [p.wasi_email, p.wasi2_email].filter(Boolean); if (!to.length) { self.toast("Add the executors' email addresses under Wajibat, Wasiyat details"); return; } const subject = "Wasiyat of " + (p.name_en || "") + ", " + nice(TODAY); const text = blockText(wur) + "\n\n" + blockText(wen); if (navigator.share && matchMedia("(pointer:coarse)").matches) { navigator.share({title: subject, text}).catch(() => {}); return; } location.href = "mailto:" + to.join(",") + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(text.slice(0, 1800) + (text.length > 1800 ? "\n\n(Full text in the attached copy: use Download and attach it.)" : "")); };
    ws.rules = RULES;

    /* ===== settings ===== */
    const se = {};
    se.connect = () => { const f = self.state.f, tok = /^\u2022+$/.test(f.c_token) ? Store.conn.token : f.c_token.trim(); Store.setConn({owner: f.c_owner.trim(), repo: f.c_repo.trim(), path: f.c_path.trim() || "data/life.json", branch: f.c_branch.trim(), token: tok}); self.toast("Connecting"); };
    se.forget = () => { Store.setConn(Object.assign({}, Store.conn, {token: ""})); self.setF("c_token", ""); self.toast("Token removed from this device"); };
    const pAmt = +s.f.p_amount || 0, pDt = s.f.p_date || cyc.nextPay, early = dayDiff(pDt, cyc.nextPay);
    se.payPreview = "New cycle opens on " + nice(pDt) + " with PKR " + fmt(Math.max(0, k.left) + pAmt) + " (PKR " + fmt(Math.max(0, k.left)) + " carried over and PKR " + fmt(pAmt) + " pay). Next pay expected " + nice(addDays(pDt, cfg.cycleDays || 28)) + ".";
    se.payEarly = early > 2 ? "This ends the current cycle " + early + " days early. Your pay is expected on " + nice(cyc.nextPay) + "." : "";
    se.payLabel = s.payArmed ? "Tap again to confirm" : "Start new cycle";
    se.startCycle = () => { if (!self.state.payArmed) { self.setState({payArmed: true}); setTimeout(() => self.setState({payArmed: false}), 6000); return; }
      const DD = self.state.data, kk = compute(DD), a = +self.state.f.p_amount || 0, dt = self.state.f.p_date || C(DD).cycle.nextPay;
      const cy = {start: dt, nextPay: addDays(dt, C(DD).cycleDays || 28), opening: Math.round(Math.max(0, kk.left) + a)};
      self.change(d => { d.finance.config.cycle = cy; d.finance.config.lastPaid = {date: dt, amount: a}; }, "New cycle started"); self.setState({payArmed: false}); };
    se.rates = CURRENCIES.filter(([c]) => c !== "PKR").map(([c, n]) => ({c, n: n + " (" + c + ")", v: f["rt_" + c].v, on: f["rt_" + c].on, id: "rt-" + c}));
    se.saveRates = () => { const r = {}; CURRENCIES.forEach(([c]) => { if (c === "PKR") return; const v = +self.state.f["rt_" + c]; if (v > 0) r[c] = v; }); self.change(d => { d.finance.config.rates = r; d.finance.config.ratesUpdated = TODAY; }, "Rates saved"); };
    se.saveCaps = () => { const ff = self.state.f, n = kk => +ff[kk] || 0;
      const v = {caps: {nashta: n("s_nashta"), dinner: n("s_dinner"), snack: n("s_snack")}, mealsPerCycle: {nashta: n("s_nashtaN"), dinner: n("s_dinnerN"), snack: n("s_snackN")}, otherFood: n("s_other"), payAmount: n("s_pay"), savePerCycle: n("s_save"), wajibatPerCycle: n("s_waj"), cycle: {opening: n("s_open"), start: ff.s_start, nextPay: ff.s_next}};
      self.change(d => { Object.assign(d.finance.config, v); }, "Settings saved"); };
    se.saveKh = () => { const ff = self.state.f, v = ff.k_carry; const x = {label: (ff.k_label || "").trim(), gregorian: (ff.k_greg || "").trim(), next: ff.k_next, carryPkr: v === "" ? null : +v};
      self.change(d => { d.khums.settings = Object.assign({}, d.khums.settings, x); }, "Khums settings saved"); };


    /* ===== dusk direction: the day panorama, spend curve, account mirror ===== */
    const dk = {};
    const pt = prayTimes(TODAY), H0 = 4, H1 = 21, X = h => Math.max(0, Math.min(100, (h - H0) / (H1 - H0) * 100));
    const stops = [[H0, "#10142a"], [pt.fajr - 0.4, "#1d2448"], [pt.fajr, "#2e3563"], [(pt.fajr + pt.sunrise) / 2, "#7d6a8f"], [pt.sunrise, "#d99a8a"], [pt.sunrise + 1.4, "#efcf9c"],
      [pt.zohar, "#f3e8cc"], [pt.asr, "#efd6a2"], [pt.sunset - 0.9, "#e7a866"], [pt.sunset, "#d36c4c"], [pt.maghrib, "#7a4f78"], [pt.esha, "#2a2c52"], [pt.esha + 1, "#161b36"], [H1, "#10142a"]];
    dk.skyStyle = "background:linear-gradient(90deg," + stops.map(([h, c]) => c + " " + X(h).toFixed(1) + "%").join(",") + ")";
    const pkeys = {fajr: pt.fajr, zohar: pt.zohar, asr: pt.asr, maghrib: pt.maghrib, esha: pt.esha};
    const SHORT = {fajr: "فجر", zohar: "ظہر", asr: "عصر", maghrib: "مغرب", esha: "عشاء"};
    const posArr = td.prayers.map(q => X(pkeys[q.k])); for (let i = 1; i < posArr.length; i++) posArr[i] = Math.max(posArr[i], posArr[i - 1] + 10);
    const over = posArr[posArr.length - 1] - 94; if (over > 0) for (let i = posArr.length - 1; i > 0; i--) { posArr[i] -= over; if (posArr[i] - posArr[i - 1] >= 10) break; }
    dk.sky = td.prayers.map((q, i) => Object.assign({}, q, {pos: posArr[i].toFixed(2), posEven: 10 + i * 20, time: hhmm(pkeys[q.k]), ur: SHORT[q.k]}));
    const nowH = lahoreNow(); dk.showSun = nowH > H0 + 0.3 && nowH < H1 - 0.3; dk.sunPos = X(nowH).toFixed(2);
    const sunAlt = Math.max(0, Math.sin(Math.PI * Math.max(0, Math.min(1, (nowH - pt.sunrise) / (pt.sunset - pt.sunrise)))));
    dk.sunTop = Math.round(140 - sunAlt * 100); dk.nowLabel = hhmm(nowH) + (nowH >= 12 ? " pm" : " am");
    const nextP = ["fajr","zohar","asr","maghrib","esha"].find(kk => pkeys[kk] > nowH);
    dk.next = nextP ? "Next, " + PRAYERS.find(p => p[0] === nextP)[1] + " at " + hhmm(pkeys[nextP]) : "All five prayer times have passed today";
    dk.timesNote = "Lahore, by intime.ir\u2019s method with the Sistani preset: Fajr at true dawn (safe from " + hhmm(pt.fajrSafe) + "), Asr from 2 qadam. Sunrise " + hhmm(pt.sunrise) + ", sunset " + hhmm(pt.sunset) + ", midnight " + hhmm(pt.midnight) + " (sunset to dawn)";
    dk.ledger = td.days.map((d, i) => Object.assign({}, d, {delay: i * 30}));
    /* spend curve: this cycle against even pace, last cycle mirrored below */
    const len = k.len, W = 860, ctop = 24, mid = 176, bottom = 296, Lx = 44, ox = i => Lx + i * (W - Lx - 12) / Math.max(1, len - 1);
    const cumAt = (from, n) => { const out = []; let acc = 0; for (let i = 0; i < n; i++) { const dd = addDays(from, i); acc += F(D).txns.filter(t => t.date === dd).reduce((a, t) => a + (t.pkr || 0), 0); out.push(acc); } return out; };
    const elapsedDays = Math.min(len, dayDiff(cyc.start, TODAY) + 1), cur = cumAt(cyc.start, elapsedDays), last = cumAt(addDays(cyc.start, -len), len);
    const ymax = Math.max(cyc.opening || 1, ...cur, 1), lmax = Math.max(1, ...last), yUp = v => mid - v / ymax * (mid - ctop), yDn = v => mid + 12 + v / lmax * (bottom - mid - 24);
    dk.curve = smoothPath(cur.map((v, i) => [ox(i), yUp(v)]));
    dk.curveFill = dk.curve ? dk.curve + " L" + ox(cur.length - 1).toFixed(1) + " " + mid + " L" + ox(0).toFixed(1) + " " + mid + " Z" : "";
    dk.lastCurve = smoothPath(last.map((v, i) => [ox(i), yDn(v)]));
    dk.evenX1 = ox(0); dk.evenY1 = yUp(0); dk.evenX2 = ox(len - 1); dk.evenY2 = yUp(cyc.opening || 0);
    dk.dotX = ox(cur.length - 1).toFixed(1); dk.dotY = yUp(cur[cur.length - 1] || 0).toFixed(1); dk.dotLabel = "PKR " + fmt(cur[cur.length - 1] || 0) + " spent by today";
    dk.dotLabelX = Math.min(W - 180, +dk.dotX + 10);
    dk.gridUp = [0, 0.5, 1].map(f => ({y: yUp(ymax * f).toFixed(1), label: fmt(ymax * f / 1000) + "k"}));
    dk.mid = mid; dk.mid6 = mid + 6; dk.lastTotal = "Last cycle, PKR " + fmt(last[last.length - 1] || 0) + " in all, mirrored on its own scale";
    dk.xlabels = Array.from({length: len}, (_, i) => i).filter(i => i % 2 === 0 || i === elapsedDays - 1).map(i => { const dd = addDays(cyc.start, i); return {x: ox(i).toFixed(1), t: String(parse(dd).getDate()), cls: dd === TODAY ? "today" : ""}; });
    /* meal plan sliding highlight */
    if (mp.show) { const idx = mp.days.findIndex(d => d.pressed === "true"); mp.selIdx = idx < 0 ? 0 : idx; mp.n = mp.days.length; mp.selStyle = "width:calc((100% - " + ((mp.n - 1) * 4) + "px) / " + mp.n + ");transform:translateX(calc(" + mp.selIdx + " * (100% + 4px)))"; }
    /* accounts: in above, out mirrored below, by month */
    if (s.st) {
      const ST = s.st, msAll = [...new Set(ST.rows.map(r => r.date.slice(0, 7)))].sort();
      const pv = s.f.ac_month || msAll[msAll.length - 1], n = /^r\d+$/.test(pv) ? +pv.slice(1) : 8, months = msAll.slice(-n);
      const series = months.map(m => { const xs = ST.rows.filter(r => r.date.slice(0, 7) === m && r.cat !== "Own accounts" && (s.acAcct === "all" || r.acct === s.acAcct));
        return {m, i: xs.filter(r => r.amount > 0).reduce((a, r) => a + r.amount, 0), o: -xs.filter(r => r.amount < 0).reduce((a, r) => a + r.amount, 0)}; });
      const MW = 760, Mmid = 110, mmx = Math.max(1, ...series.map(x => Math.max(x.i, x.o))), mx = i => 24 + i * (MW - 48) / Math.max(1, series.length - 1);
      dk.mirIn = smoothPath(series.map((x, i) => [mx(i), Mmid - 8 - x.i / mmx * 90])); dk.mirOut = smoothPath(series.map((x, i) => [mx(i), Mmid + 8 + x.o / mmx * 90]));
      dk.mirMid = Mmid;
      dk.mirPts = series.map((x, i) => ({x: mx(i).toFixed(1), yi: (Mmid - 8 - x.i / mmx * 90).toFixed(1), yo: (Mmid + 8 + x.o / mmx * 90).toFixed(1), on: x.m === pv ? "on" : "",
        mon: new Date(x.m + "-01T12:00").toLocaleDateString("en-GB", {month: "short"}), label: new Date(x.m + "-01T12:00").toLocaleDateString("en-GB", {month: "long", year: "numeric"}) + ": in PKR " + fmt2(x.i) + ", out PKR " + fmt2(x.o),
        open: () => self.setF("ac_month", x.m)}));
      dk.mirW = MW;
    }

    const E = x => String(x).replace(/&/g, "&amp;").replace(/</g, "&lt;");
    dk.curveSvg = dk.gridUp.map(g => '<line x1="44" x2="860" y1="' + g.y + '" y2="' + g.y + '" class="gl"/><text x="36" y="' + g.y + '" dy="4" class="gt" text-anchor="end">' + g.label + '</text>').join("") +
      '<line x1="44" x2="860" y1="' + dk.mid6 + '" y2="' + dk.mid6 + '" class="gl strong"/>' + (dk.lastCurve ? '<path d="' + dk.lastCurve + '" class="last draw"/>' : "") +
      '<line x1="' + dk.evenX1 + '" y1="' + dk.evenY1 + '" x2="' + dk.evenX2 + '" y2="' + dk.evenY2 + '" class="even"/>' + (dk.curve ? '<path d="' + dk.curveFill + '" class="fill"/><path d="' + dk.curve + '" class="spent draw"/>' : "") +
      '<circle cx="' + dk.dotX + '" cy="' + dk.dotY + '" r="5" class="dot"/><text x="' + dk.dotLabelX + '" y="' + dk.dotY + '" dy="-12" class="dl">' + E(dk.dotLabel) + '</text>' +
      dk.xlabels.map(x => '<text x="' + x.x + '" y="316" class="gt ' + x.cls + '" text-anchor="middle">' + x.t + '</text>').join("");
    if (dk.mirIn) dk.mirSvg = '<line x1="0" x2="760" y1="' + dk.mirMid + '" y2="' + dk.mirMid + '" class="gl strong"/><path d="' + dk.mirIn + '" class="in draw"/><path d="' + dk.mirOut + '" class="out draw"/>' +
      dk.mirPts.map(p => '<circle cx="' + p.x + '" cy="' + p.yi + '" r="' + (p.on ? 6 : 3.5) + '" class="pi"/><circle cx="' + p.x + '" cy="' + p.yo + '" r="' + (p.on ? 6 : 3.5) + '" class="po"/>').join("");

    /* ===== almanac direction: masthead, prayer column, cycle calendar, khums year strip ===== */
    const al = {};
    const hp = (iso, opts, loc) => { try { return new Intl.DateTimeFormat((loc || "en") + "-u-ca-islamic-umalqura" + (loc === "ur-PK" ? "-nu-arabext" : ""), opts).formatToParts(parse(iso)); } catch(e) { return []; } };
    const hget = (parts, t) => (parts.find(p => p.type === t) || {}).value || "";
    const hT = hp(TODAY, {day: "numeric", month: "long", year: "numeric"});
    al.day = parse(TODAY).getDate(); al.weekday = td.dayName; al.monthYear = parse(TODAY).toLocaleDateString("en-GB", {month: "long", year: "numeric"});
    al.hijri = hget(hT, "day") + " " + hget(hT, "month") + " " + hget(hT, "year");
    try { al.hijriUr = new Intl.DateTimeFormat("ur-PK-u-ca-islamic-umalqura-nu-arabext", {day: "numeric", month: "long", year: "numeric"}).format(parse(TODAY)).replace(/،/g, ""); } catch(e) { al.hijriUr = ""; }
    al.hijriNote = "Hijri date by the Umm al-Qura calendar, local moon sighting may differ by a day";
    al.prayers = dk.sky.map(q => Object.assign({}, q, {urFull: (PRAYERS.find(p => p[0] === q.k) || [])[2], cls: (q.cls || "") + " pk-" + q.k + ((dk.next || "").indexOf(q.en) >= 0 ? " next" : "")}));
    al.nowLabel = dk.nowLabel; al.next = dk.next;
    /* prayer bar: today's five, ticked when prayed on time */
    const pb = {}, PORD = ["fajr","zohar","asr","maghrib","esha"], daily = ((D.wajibat.daily || {})[TODAY]) || {};
    const nextK = PORD.find(kk => pkeys[kk] > nowH), curK = [...PORD].reverse().find(kk => pkeys[kk] <= nowH);
    pb.items = PORD.map((kk, i) => { const en = PRAYERS[i][1], done = !!daily[kk], past = pkeys[kk] <= nowH, isNext = kk === nextK, isNow = kk === curK && !done, mins = Math.round((pkeys[kk] - nowH) * 60);
      const st = done ? "Prayed" : isNext ? (mins >= 60 ? "In " + Math.floor(mins / 60) + "h " + (mins % 60) + "m" : "In " + mins + " min") : isNow ? "Time now" : past ? "Not ticked" : "Later";
      return {k: kk, en, ur: SHORT[kk], time: hhmm(pkeys[kk]), done: done ? "true" : "false", st,
        cls: [done ? "done" : "", isNext ? "next" : "", isNow ? "now" : "", past && !done && !isNow ? "missed" : "", !past ? "later" : ""].filter(Boolean).join(" "),
        ic: {fajr: kk === "fajr", zohar: kk === "zohar", asr: kk === "asr", maghrib: kk === "maghrib", esha: kk === "esha"},
        aria: (done ? "Untick " : "Tick ") + en + ", prayed today at " + hhmm(pkeys[kk]),
        toggle: () => self.change(d => { d.wajibat.daily = d.wajibat.daily || {}; const day = Object.assign({}, d.wajibat.daily[TODAY]); if (day[kk]) delete day[kk]; else day[kk] = nowAt(); d.wajibat.daily[TODAY] = day;
          const cut = addDays(TODAY, -60); Object.keys(d.wajibat.daily).forEach(x => { if (x < cut) delete d.wajibat.daily[x]; }); }, (done ? "Unticked " : "Ticked ") + en)}; });
    const nDone = PORD.filter(kk => daily[kk]).length;
    pb.summary = nDone + " of 5 prayed" + (nextK ? ", next " + PRAYERS[PORD.indexOf(nextK)][1] + " at " + hhmm(pkeys[nextK]) : "");
    { const seg = 100 / PORD.length; let pos = 0;
      if (nowH < pkeys.fajr) pos = Math.max(0, seg / 2 * (nowH / pkeys.fajr));
      else if (nowH >= pkeys.esha) pos = Math.min(100, seg * 4.5 + seg / 2 * Math.min(1, (nowH - pkeys.esha) / Math.max(0.5, 24 - pkeys.esha)));
      else { const i = PORD.findIndex((kk, j) => j < 4 && nowH >= pkeys[kk] && nowH < pkeys[PORD[j + 1]]); pos = seg * (i + 0.5) + seg * (nowH - pkeys[PORD[i]]) / (pkeys[PORD[i + 1]] - pkeys[PORD[i]]); }
      pb.nowPos = pos.toFixed(1); }
    /* the pay cycle as calendar weeks, Monday first, running to the week after pay day */
    const dow = iso => (parse(iso).getDay() + 6) % 7, gStart = addDays(cyc.start, -dow(cyc.start)), gEnd0 = addDays(cyc.nextPay, 6 - dow(cyc.nextPay));
    const billMap = {}; F(D).bills.forEach(b => { const d = billDue(D, b); (billMap[d] = billMap[d] || []).push(b); });
    const perPlan = (cyc.opening || 0) / k.len, cells = []; const pickDay = d => () => { if (d >= cyc.start && d <= TODAY) self.setState({mlDay: d}); };
    for (let d = gStart; d <= gEnd0; d = addDays(d, 1)) {
      const inCyc = d >= cyc.start && d < cyc.nextPay, sp = F(D).txns.filter(t => t.date === d).reduce((a, t) => a + (t.pkr || 0), 0), past = d <= TODAY;
      const bills = billMap[d] || [], pay = d === cyc.nextPay, mine = bills.filter(b => b.paidBy !== "mentor"), mentor = bills.filter(b => b.paidBy === "mentor");
      const marks = [pay ? "Pay day" : "", ...mine.map(b => b.name), ...mentor.map(b => b.name + ", mentor")].filter(Boolean);
      cells.push({pick: pickDay(d), n: parse(d).getDate(), cls: [inCyc ? "in" : "out", d === TODAY ? "today" : "", d > TODAY ? "future" : "", pay || mine.length ? "circled" : mentor.length ? "ringed" : ""].join(" "),
        amt: inCyc && past ? (sp ? fmt(sp) : "0") : "", over: inCyc && past && sp > perPlan ? "over" : "", fill: inCyc && past ? Math.min(100, Math.round(sp / Math.max(1, perPlan) * 100)) : 0,
        mark: marks.join(", "), title: nice(d) + (inCyc && past ? ": PKR " + fmt(sp) + " spent" : "") + (marks.length ? ". " + marks.join(", ") : "")});
    }
    al.cells = cells; al.wk = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]; al.perPlan = fmt(perPlan);
    /* khums year as a strip of Hijri months from the last 23 Ramadan to the next */
    const lastY = kh.years[0], ks0 = lastY && lastY.date ? lastY.date : addDays(kh.kh.next || TODAY, -354), ke0 = kh.kh.next || addDays(ks0, 354), span = Math.max(1, dayDiff(ks0, ke0));
    const mons = []; let prevM = "";
    for (let i = 0; i <= span; i += 1) { const d = addDays(ks0, i), m = hget(hp(d, {month: "long"}), "month"); if (m && m !== prevM) { mons.push({pos: (i / span * 100).toFixed(2), m}); prevM = m; } }
    al.months = mons.map((x, i) => Object.assign(x, {short: x.m.replace(/^(Jumada|Rabiʻ?)\s/, "$1 ").split(" ").map((w, j) => j ? w : w.slice(0, 3)).join(" "), alt: i % 2 ? "alt" : ""}));
    al.todayPos = Math.max(0, Math.min(100, dayDiff(ks0, TODAY) / span * 100)).toFixed(2);
    al.yearStart = lastY ? "23 Ramadan " + lastY.year + ", " + nice(ks0) : nice(ks0); al.yearEnd = "23 Ramadan " + (kh.kh.label || "") + ", " + nice(ke0);
    al.daysTo = kh.daysTo != null && kh.daysTo >= 0 ? kh.daysTo + " days to go" : "";
    al.timeline = td.timeline;

    /* ===== sheets ===== */
    const add = {};
    add.meals = [["nashta","Nashta"],["dinner","Dinner"],["snack","Snack"],["","Not food"]].map(([m, l]) => ({label: l, pressed: s.meal === m ? "true" : "false", pick: () => self.pickMeal(m)}));
    add.cats = CATS; add.srcs = SOURCES; add.dels = DELIVERY.map(([v, , l]) => ({v, l}));
    add.close = () => self.setState({sheet: null, stmtPending: null}); add.back = e => { if (e.target === e.currentTarget) self.setState({sheet: null, stmtPending: null}); };
    add.save = () => self.saveAdd(); add.food = s.f.add_cat === "Food";
    const mode = s.addMode || "spend";
    add.modes = [["spend", "Spending"], ["refund", "Refund"], ["voucher", "Voucher"]].map(([m, l]) => ({label: l, pressed: mode === m ? "true" : "false", pick: () => self.setState({addMode: m})}));
    add.mSpend = mode === "spend"; add.mRefund = mode === "refund"; add.mVoucher = mode === "voucher";
    add.title = mode === "refund" ? "Add a refund" : mode === "voucher" ? "Add a voucher" : "Add spending";
    add.saveLabel = mode === "refund" ? "Save refund" : mode === "voucher" ? "Save voucher" : "Save";
    const cr = credits(D);
    add.srcs = SOURCES.concat(Object.keys(cr).filter(k => cr[k] > 0.5).map(k => CREDIT_LABEL[k] || k));
    add.vouchers = openVouchers(D).map(v => ({v: v.id, l: v.platform + ", PKR " + fmt(v.amount) + (v.expires ? ", until " + nice(v.expires) : "")}));
    add.rfOrders = F(D).txns.filter(t => !isRefund(t) && t.pkr > 0 && t.date >= addDays(TODAY, -45)).slice(0, 40).map(t => ({v: t.id, l: nice(t.date) + ", " + (t.note || t.category).slice(0, 60) + ", PKR " + fmt(t.pkr)}));
    const setItem = (i, patch) => self.setState(st => { const items = (st.items || []).map((x, j) => j === i ? Object.assign({}, x, patch) : x); return {items}; });
    add.items = (s.items || []).map((it, i) => ({name: it.name, qty: it.qty, price: it.price, guest: it.guest ? "true" : "false",
      onName: e => setItem(i, {name: e.target.value}), onQty: e => setItem(i, {qty: e.target.value}), onPrice: e => setItem(i, {price: e.target.value}),
      toggleGuest: () => setItem(i, {guest: !it.guest}),
      rates: Object.entries(RATE).map(([kk, r]) => ({label: kk === "love" ? "\u2665" : kk === "ok" ? "~" : "\u2715", title: r[0], cls: "r-" + kk, pressed: it.rating === kk ? "true" : "false", pick: () => setItem(i, {rating: it.rating === kk ? "" : kk})})),
      remove: () => self.setState(st => { const items = (st.items || []).filter((x, j) => j !== i); return {items: items.length ? items : [{name: "", qty: "1", price: "", guest: false, rating: ""}]}; })}));
    add.addItem = () => self.setState(st => ({items: (st.items || []).concat([{name: "", qty: "1", price: "", guest: false, rating: ""}])}));
    const ic = this.itemsCalc();
    add.sumText = ic.its.length ? "Items PKR " + fmt(ic.sub) : "";
    add.totalText = ic.its.length ? "Items " + fmt(ic.sub) + (ic.del ? " + delivery " + ic.del : "") + (ic.disc ? " - discount " + fmt(ic.disc) : "") + " = PKR " + fmt(ic.total) : "";
    add.useTotal = () => self.setF("add_amount", String(ic.total));
    const paid = +s.f.add_amount || ic.total;
    add.guestText = ic.guestSub > 0 && ic.sub > 0 ? "Guest share about PKR " + fmt(paid * ic.guestSub / ic.sub) + ", yours about PKR " + fmt(paid - paid * ic.guestSub / ic.sub) + ". The whole amount comes off your budget; only your share counts in meal caps and averages" : "";
    add.rates = Object.entries(RATE).map(([kk, r]) => ({label: r[0], pressed: s.rateSel === kk ? "true" : "false", pick: () => self.setState({rateSel: self.state.rateSel === kk ? "" : kk})}));
    const hint = this.capHint(); add.hint = hint.t; add.hintCls = "hint " + (hint.c || "");
    const book = s.sheet === "add" ? menuBook(D) : {};
    add.places = Object.entries(book).sort((a,b) => b[1].n - a[1].n).map(([kk, v]) => ({v: kk, l: v.n + " orders"}));
    const pe = book[(s.f.add_place || "").trim()];
    add.dishes = []; add.known = !!pe; add.isNew = !pe && (s.f.add_place || "").trim().length > 1;
    if (pe) { const its = Object.entries(pe.items).sort((a,b) => b[1] - a[1]), xs = [...pe.xs].sort((a,b) => a - b), med = Math.round(xs[Math.floor(xs.length / 2)]), rv = placeReviews(D, s.f.add_place.trim());
      add.dishes = its.map(([kk]) => ({v: kk})); add.med = fmt(med); add.useMed = () => self.setF("add_amount", String(med));
      add.chips = its.slice(0, 6).map(([kk]) => { const r = rv.dish[kk]; return {label: kk, cls: "dish" + (r ? " r-" + r : ""), mark: r ? RATE[r][0] + ": " : "", pick: () => { const cur = (self.state.f.add_note || "").trim(); self.setF("add_note", cur ? cur + ", " + kk : kk); }}; });
      add.reviews = Object.keys(RATE).filter(kk => rv.n[kk]).map(kk => RATE[kk][0] + " " + rv.n[kk] + " times").join(", ");
      const lastRv = rv.rows.find(t => t.review); add.lastReview = lastRv ? "Last note, " + nice(lastRv.date) + ": \"" + lastRv.review + "\"" : ""; }
    const rtx = s.rateTx ? F(D).txns.find(x => x.id === s.rateTx) : null;
    const rt = {what: rtx ? (rtx.note || "Food") + ", " + nice(rtx.date) + ", PKR " + fmt(rtx.pkr) : "", close: () => self.setState({sheet: null, rateTx: null}), back: e => { if (e.target === e.currentTarget) self.setState({sheet: null, rateTx: null}); },
      save: () => self.saveRate(), rates: Object.entries(RATE).map(([kk, r]) => ({label: r[0], pressed: s.rate2 === kk ? "true" : "false", pick: () => self.setState({rate2: self.state.rate2 === kk ? "" : kk})}))};

    const ptv = s.tab === "prayers" || s.tab === "today" ? this.ptVM() : {ok: false};
    /* Prayers and qaza, on the same engine as the Prayer times tab */
    const pq = {}; {
      const P5 = ptv.ok ? ptv.five : null, nowM = ptv.ok ? ptv.nowMin : 0, ST5 = ["fajr","dhuhr","asr","maghrib","isha"], KEY = {fajr: "fajr", zohar: "dhuhr", asr: "asr", maghrib: "maghrib", esha: "isha"};
      const todayLog = (D.wajibat.log || []).filter(l => l.at && l.at.slice(0, 10) === TODAY);
      const qt = kk => { let made = 0, missed = 0; todayLog.forEach(l => { const v = (l.changes || {})[kk] || 0; if (v < 0) made -= v; else missed += v; }); return {made, missed}; };
      let cur = null, nxt = null;
      if (P5) { ST5.forEach(sk => { const a = P5[sk]; if (isFinite(a) && a <= nowM) cur = sk; if (isFinite(a) && a > nowM && !nxt) nxt = sk; });
        if (cur === "isha" && isFinite(P5.midnight) && nowM >= P5.midnight) cur = null; if (!nxt) nxt = "fajr"; }
      const row = ([kk, en, ur], qasr) => { const b = kk.replace("_q", ""), n = +(qc[kk] || 0), q = qt(kk), sk = KEY[b], st = qasr || !P5 ? "" : sk === cur ? "current" : sk === nxt ? "next" : isFinite(P5[sk]) && P5[sk] <= nowM ? "passed" : "later";
        const chips = [q.made ? q.made + " made up today" : "", q.missed ? q.missed + " missed today" : ""].filter(Boolean).join(", ");
        return {k: kk, hk: b, en, ur: qasr ? "قصر" : (SHORT[b] || ur), time: P5 && sk ? ptHm(P5[sk]) : "", state: st, tag: st === "current" ? "Now" : st === "next" ? "Next" : "", chips,
          n: nfEn.format(n), nCls: n ? "" : "zero", nLabel: n ? n + " " + en + " qaza owed" : "None owed", madeDis: n ? "false" : "true",
          missAria: "Missed " + en + ", add one qaza. " + n + " owed", madeAria: "Made up one " + en + " qaza. " + n + " owed",
          miss: () => self.qaza(kk, 1), made: () => self.qaza(kk, -1), ic: {fajr: b === "fajr", zohar: b === "zohar", asr: b === "asr", maghrib: b === "maghrib", esha: b === "esha"}}; };
      pq.rows = PRAYERS.slice(0, 5).map(p => row(p, false));
      pq.qasr = PRAYERS.slice(5).map(p => row(p, true));
      const qs = PRAYERS.slice(5).map(([kk, en]) => [en.replace(" (qasr)", ""), +(qc[kk] || 0)]).filter(x => x[1]);
      pq.qasrSummary = qs.length ? qs.map(x => x[0] + " " + x[1]).join(", ") : "None owed";
      pq.undo = s.qUndo ? s.qUndo.text : ""; pq.undoIt = () => { const u = self.state.qUndo; if (!u) return; clearTimeout(self._qT); self.bump({[u.k]: -u.d}); self.setState({qUndo: null}); self.toast("Undone"); };
      if (ptv.ok) { pq.marks = [["fajr","Fajr","fajr"],["dhuhr","Zohar","zohar"],["asr","Asr","asr"],["maghrib","Maghrib","maghrib"],["isha","Esha","esha"]].map(([sk, n, h]) => ({n, t: ptHm(P5[sk]), style: "left:" + Math.max(0, Math.min(100, P5[sk] / 1440 * 100)).toFixed(2) + "%", cls: "pmark h-" + h}));
        pq.stripAria = "Day at a glance: dawn " + ptHm(P5.fajr) + ", sunrise " + ptHm(P5.sunrise) + ", sunset " + ptHm(P5.sunset) + ", night from " + ptHm(P5.isha) + ". Now " + ptHm(nowM) + ".";
        pq.tickAria = "Next, " + ptv.nextName + " " + ptv.nextAt; }
    }
    /* the band's clock: which window is open, how long until it turns qaza */
    const tk = {}; let W5open = null; if (ptv.ok) {
      const P5 = ptv.five, nowM = ptv.nowMin; let nowS = nowM * 60; try { const z = ptZoneParts(new Date(), ptv.tz); nowS = z.h * 3600 + z.mi * 60 + z.s; } catch(e) {}
      let mid = P5.midnight; if (isFinite(mid) && mid < P5.maghrib) mid += 1440;
      const W = [{k: "fajr", en: "Fajr", ur: "فجر", hue: "h-fajr", a: P5.fajr, b: P5.sunrise, endWord: "sunrise"}, {k: "zoharain", en: "Zoharain", ur: "ظہرین", hue: "h-zohar", a: P5.dhuhr, b: P5.sunset, endWord: "sunset"}, {k: "maghribain", en: "Maghribain", ur: "مغربین", hue: "h-maghrib", a: P5.maghrib, b: mid, endWord: "midnight"}];
      const nowF = nowS / 60; let open = W.find(x => nowF >= x.a && nowF < x.b); W5open = open;
      if (!open && mid > 1440 && nowF + 1440 < mid) open = Object.assign({}, W[2], {a: W[2].a - 1440, b: mid - 1440});
      const nextW = open ? null : (W.find(x => x.a > nowF) || Object.assign({}, W[0], {a: W[0].a + 1440, b: W[0].b + 1440, tomorrow: true}));
      const target = open ? open.b : nextW.a, left = Math.max(0, target * 60 - nowS), lm = left / 60;
      tk.target = String(Date.now() + left * 1000); tk.cdText = fmtLeft(left);
      { const L = Math.round(left); tk.ch = String(Math.floor(L / 3600)); tk.cm = String(Math.floor(L % 3600 / 60)).padStart(L >= 3600 ? 2 : 1, "0"); tk.cs = String(L % 60).padStart(2, "0"); tk.cdCls = L >= 3600 ? "" : "noh"; }
      if (open) { const plural = open.k !== "fajr", word = open.en, end = ptHm(open.b % 1440);
        tk.hue = open.hue; tk.lvl = lm <= 30 ? "urgent" : lm <= 90 ? "warn" : "calm"; tk.rem = (Math.max(0, Math.min(1, (open.b - nowF) / (open.b - open.a))) * 100).toFixed(1);
        tk.kicker = word + (plural ? " are open now" : " is open now");
        if (lm <= 30) { tk.pre = "Only "; tk.post = " before " + word + (plural ? " become" : " becomes") + " qaza"; }
        else { tk.pre = ""; tk.post = " left for " + word; }
        tk.sub = word + (plural ? " become" : " becomes") + " qaza at " + open.endWord + ", " + end + ".";
        tk.aria = tk.kicker + ". " + tk.sub; }
      else { const word = nextW.en, plural = nextW.k !== "fajr";
        tk.hue = nextW.hue; tk.lvl = "rest"; tk.rem = (Math.max(0, Math.min(1, 1 - lm / 360)) * 100).toFixed(1);
        tk.kicker = "Between prayers"; tk.pre = word + (plural ? " begin in " : " begins in "); tk.post = "";
        tk.sub = word + (plural ? " begin at " : " begins at ") + ptHm(nextW.a % 1440) + (nextW.tomorrow ? " tomorrow" : "") + ".";
        tk.aria = tk.pre + fmtLeft(left) + ". " + tk.sub; }
      { const sr = P5.sunrise, ss = P5.sunset, f = P5.fajr, mg = P5.maghrib, is = P5.isha, as = P5.asr;
        tk.phase = nowF < f - 40 || nowF >= is + 30 ? "sky-night" : nowF < sr + 20 ? "sky-dawn" : nowF < P5.dhuhr - 90 ? "sky-morning" : nowF < as ? "sky-noon" : nowF < ss - 50 ? "sky-afternoon" : nowF < is + 30 ? "sky-dusk" : "sky-night"; tk.sky = SKY_ART[tk.phase] ? tk.phase + " has-art" : "";
        tk.sunX = (Math.max(0, Math.min(1, (nowF - sr) / Math.max(1, ss - sr))) * 100).toFixed(1); tk.sunY = (Math.sin(Math.PI * Math.max(0, Math.min(1, (nowF - sr) / Math.max(1, ss - sr)))) * 70).toFixed(1); }
      tk.ic = {urgent: tk.lvl === "urgent", calm: tk.lvl === "calm" || tk.lvl === "warn", rest: tk.lvl === "rest"};
      tk.wins = W.map(x => { const isOpen = open && open.k === x.k, past = !isOpen && nowF >= x.b && !(x.k === "maghribain" && open && open.k === "maghribain");
        return {ic: {fajr: x.k === "fajr", zoharain: x.k === "zoharain", maghribain: x.k === "maghribain"}, en: x.en, ur: x.ur, start: ptHm(x.a % 1440), end: "qaza " + ptHm(x.b % 1440), cls: [x.hue, isOpen ? "open" : past ? "past" : "ahead"].join(" "),
          state: isOpen ? "Open now" : past ? "Time over" : "Starts " + ptHm(x.a % 1440), done: isOpen ? ((nowF - x.a) / (x.b - x.a) * 100).toFixed(1) : past ? "100" : "0"}; });
    }
    /* the qaza card: dials, today, the last 14 days */
    const qd = {}; {
      const logs = D.wajibat.log || [], counts = PRAYERS.slice(0, 5).map(([kk]) => +(qc[kk] || 0)), mx = Math.max(1, ...counts);
      qd.total = nfEn.format(PRAYERS.reduce((a2, [kk]) => a2 + (+qc[kk] || 0), 0));
      qd.mix = PRAYERS.slice(0, 5).map(([kk, en], i) => ({k: kk, n: counts[i], t: en + " " + counts[i]})).filter(x => x.n > 0);
      qd.mixAria = "Qaza by prayer: " + PRAYERS.slice(0, 5).map(([kk, en], i) => en + " " + counts[i]).join(", ");
      const dayOf = kk => { let made = 0, missed = 0; logs.filter(l => l.at && l.at.slice(0, 10) === TODAY).forEach(l => { const v = (l.changes || {})[kk] || 0; if (v < 0) made -= v; else missed += v; }); return {made, missed}; };
      const last = s.qUndo ? s.qUndo.k + (s.qUndo.d > 0 ? " up" : " down") : "";
      const openK = tk.wins ? ({fajr: ["fajr"], zoharain: ["zohar", "asr"], maghribain: ["maghrib", "esha"]}[(W5open || {}).k] || []) : [];
      qd.rows = PRAYERS.slice(0, 5).map(([kk, en, ur], i) => { const n = counts[i], q = dayOf(kk), C = 2 * Math.PI * 30, frac = n / mx;
        return {k: kk, hk: kk, en, ur: SHORT[kk] || ur, n: nfEn.format(n), cls: [n ? "" : "zero", last === kk + " up" ? "bump-up" : last === kk + " down" ? "bump-down" : ""].join(" "),
          ring: (() => { const R = 42, Cc = 2 * Math.PI * R, sweep = 0.75 * Cc, val = Math.max(0.02, frac) * sweep;
            return '<circle cx="50" cy="50" r="42" fill="none" stroke-width="9" stroke-linecap="round" class="trk" transform="rotate(135 50 50)" stroke-dasharray="' + sweep.toFixed(1) + ' ' + Cc.toFixed(1) + '"></circle>' +
              '<circle cx="50" cy="50" r="42" fill="none" stroke-width="9" stroke-linecap="round" class="arc" transform="rotate(135 50 50)" stroke-dasharray="' + (n ? val : 0).toFixed(1) + ' ' + Cc.toFixed(1) + '" style="--len:' + (n ? val : 0).toFixed(1) + '"></circle>'; })(),
          ic: {fajr: kk === "fajr", zohar: kk === "zohar", asr: kk === "asr", maghrib: kk === "maghrib", esha: kk === "esha"}, pulse: openK.indexOf(kk) >= 0 && n ? "mx-pulse" : "",
          today: [q.made ? q.made + " made up today" : "", q.missed ? q.missed + " missed today" : ""].filter(Boolean).join(", "),
          madeDis: n ? "false" : "true", missAria: "Missed " + en + ", add one qaza. " + n + " owed", madeAria: "Made up one " + en + " qaza. " + n + " owed",
          miss: () => self.qaza(kk, 1), made: () => self.qaza(kk, -1)}; });
      const madeOn = d => logs.filter(l => l.at && l.at.slice(0, 10) === d).reduce((a2, l) => a2 + Object.entries(l.changes || {}).filter(([kk]) => kk !== "roza").reduce((b2, [, v]) => b2 + (v < 0 ? -v : 0), 0), 0);
      const ds = []; for (let i = 13; i >= 0; i--) { const d = addDays(TODAY, -i); ds.push({d, n: madeOn(d)}); }
      const dmx = Math.max(1, ...ds.map(x => x.n));
      qd.days = ds.map(x => ({h: x.n ? Math.max(18, x.n / dmx * 100).toFixed(0) : "0", cls: (x.n ? "on" : "") + (x.d === TODAY ? " today" : ""), l: parse(x.d).toLocaleDateString("en-GB", {weekday: "narrow"}), t: nice(x.d) + ": " + x.n + " made up"}));
      let streak = 0; for (let i = ds.length - 1; i >= 0; i--) { if (ds[i].n) streak++; else if (i === ds.length - 1) continue; else break; }
      const tot14 = ds.reduce((a2, x) => a2 + x.n, 0);
      qd.hot = streak > 1;
      qd.streak = tot14 ? tot14 + " made up in 14 days" + (streak > 1 ? ", " + streak + " days in a row" : "") : "None made up in the last 14 days yet";
    }
    /* Meals: three boxes for one day, against the per meal caps */
    const ml = {}; {
      const mday = s.mlDay && s.mlDay >= cyc.start && s.mlDay <= TODAY ? s.mlDay : TODAY;
      ml.dayLabel = (mday === TODAY ? "Today, " : "") + parse(mday).toLocaleDateString("en-GB", {weekday: "short", day: "numeric", month: "short"});
      ml.notToday = mday !== TODAY; ml.noPrev = mday <= cyc.start; ml.noNext = mday >= TODAY;
      ml.prev = () => self.setState({mlDay: addDays(mday, -1)}); ml.next = () => self.setState({mlDay: addDays(mday, 1)}); ml.toToday = () => self.setState({mlDay: null});
      const caps = cfg.caps || {}, dayTx = F(D).txns.filter(t => t.date === mday && t.category === "Food"), refunds = F(D).txns.filter(t => isRefund(t));
      let sumMine = 0, capSum = 0;
      ml.boxes = ["nashta","dinner","snack"].map(mk => { const cap = +(caps[mk] || 0); capSum += cap;
        const orders = dayTx.filter(t => !isRefund(t) && t.meal === mk);
        const net = o => { const rf = refunds.filter(r => r.refundOf === o.id).reduce((a, r) => a + Math.abs(r.pkr || 0), 0), mine = myPkr(o); return {mine: Math.max(0, mine - (o.pkr ? rf * mine / o.pkr : 0)), rf, refundTo: (refunds.find(r => r.refundOf === o.id) || {}).refundTo || ""}; };
        const ns = orders.map(o => Object.assign({o}, net(o))), live = ns.filter(x => x.mine > 0.5), mine = live.reduce((a, x) => a + x.mine, 0); sumMine += mine;
        const open = () => self.openAdd({meal: mk, f: {add_date: mday, add_cat: "Food", add_src: "Foodpanda"}});
        const base = {k: mk, name: MEALS[mk], open, upTo: cap ? "Up to PKR " + fmt(cap) : "No cap set", aria: "Log " + MEALS[mk].toLowerCase() + " for " + parse(mday).toLocaleDateString("en-GB", {weekday: "long", day: "numeric", month: "long"}) + (cap ? ". Up to PKR " + fmt(cap) : "")};
        if (!live.length) return Object.assign(base, {empty: true, logged: false, refundedOnly: ns.length > 0});
        const left = cap - mine, last = live[live.length - 1].o;
        const lines = []; live.forEach(x => { if (x.o.guestPkr) lines.push({t: "Bill PKR " + fmt(x.o.pkr) + ", guest PKR " + fmt(x.o.guestPkr)}); if (x.rf) lines.push({t: "Refund PKR " + fmt(x.rf) + (x.refundTo.startsWith("credit:") ? ", to Foodpanda credit" : ", back to card")}); });
        return Object.assign(base, {empty: false, logged: true, cls: cap && left < 0 ? "over" : "",
          orders: live.slice(0, 2).map((x, i) => ({vendor: placeOf(x.o) || "Food", dishes: i === 0 ? dishesOf(x.o).join(", ") : "", multi: live.length > 1, pkr: fmt(x.mine)})),
          more: live.length > 2 ? "+" + (live.length - 2) + " more order" + (live.length - 2 === 1 ? "" : "s") : "", mine: fmt(mine), lines,
          credit: live.some(x => (x.o.paidFrom || "").startsWith("credit:")),
          capLine: !cap ? "No cap set" : left > 0.5 ? "PKR " + fmt(left) + " left of " + fmt(cap) : left >= -0.5 ? "Right at the " + fmt(cap) + " cap" : "PKR " + fmt(-left) + " over the " + fmt(cap) + " cap",
          capCls: cap && left < -0.5 ? "neg-t" : "ok-t", fill: cap ? Math.min(100, mine / cap * 100).toFixed(1) : "0", rate: this.rateVm(last)}); });
      const other = dayTx.filter(t => !isRefund(t) && !MEALS[t.meal]).reduce((a, t) => a + (t.pkr || 0), 0);
      ml.foot = sumMine > 0 || other > 0 ? "Food on this day PKR " + fmt(sumMine) + " of PKR " + fmt(capSum) + " in caps" + (other > 0 ? ". Other food PKR " + fmt(other) : "") : "";
    }
    /* Next 30 days: undated dues on top */
    td.openNow = []; if (third.length) td.openNow.push({t: third.length === 1 && third[0].type === "kaffara" ? "Kaffara" : "Dues open", s: "PKR " + fmt(kaf) + " still open", go: go.money});
    if (ks.word === "Unpaid") td.openNow.push({t: "Khums", s: ks.line, go: go.khums}); td.hasOpen = td.openNow.length > 0;
    return Object.assign(base, {pt: ptv, pb, pq, ml, tk, qd, al, dk, f, td, mp, pl, mo, ac, km, wj, ws, se, add, rt, sheetAdd: s.sheet === "add", sheetRate: s.sheet === "rate", undoUsual: () => { const id = self.state.lastUsual; if (!id) return; self.change(d => { d.finance.txns = d.finance.txns.filter(t => t.id !== id); }, "Removed"); self.setState({lastUsual: null, usualMsg: ""}); }});
  }
  openItem(it){
    const x = {it_type: "kaffara", it_status: "pending", it_title: "", it_title_ur: "", it_amount: "", it_currency: "PKR", it_contact: "", it_note: "", it_note_ur: ""};
    if (it) Object.keys(x).forEach(kk => { const v = it[kk.slice(3)]; if (v != null) x[kk] = String(v); });
    this.setState(s => ({itemForm: it ? {id: it.id, isNew: false} : {isNew: true}, f: Object.assign({}, s.f, x)}));
  }
  saveItem(){
    const s = this.state, ff = s.f, form = s.itemForm; if (!form) return;
    const amt = String(ff.it_amount || "").replace(/,/g, "").trim();
    if (!ff.it_title.trim()) { this.toast("Add a title"); return; }
    if (amt !== "" && !isFinite(+amt)) { this.toast("Amount must be a number"); return; }
    const old = form.isNew ? {} : (s.data.wajibat.items.find(i => i.id === form.id) || {});
    const out = Object.assign({}, old, {type: ff.it_type, status: ff.it_status, title: ff.it_title.trim(), title_ur: ff.it_title_ur, amount: amt === "" ? null : +amt, currency: ff.it_currency, contact: ff.it_contact, note: ff.it_note, note_ur: ff.it_note_ur, updatedAt: nowAt()});
    if (form.isNew) out.id = uid(ff.it_type);
    this.change(d => { const i = d.wajibat.items.findIndex(x => x.id === out.id); if (i < 0) d.wajibat.items.push(out); else d.wajibat.items[i] = Object.assign({}, d.wajibat.items[i], out, {payments: d.wajibat.items[i].payments}); }, form.isNew ? "Obligation added" : "Changes saved");
    this.setState({itemForm: null});
  }
}

const mq = matchMedia("(prefers-color-scheme: dark)");
function mount(){ preact.render($h(Component, {theme: mq.matches ? "dark" : "light", device: false}), document.getElementById("app")); }
mount(); try { mq.addEventListener("change", mount); } catch(e) {}
})();
