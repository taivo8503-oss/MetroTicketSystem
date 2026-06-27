/**
 * khach-hang.js — Logic cho khach-hang.html
 */

let currentUser = requireRole("khach_hang");
let buyType = "luot";
let monthlySelected = "normal";
let pendingPayment = null;
let voucherDiscount = 0;
let selectedRating = 0;

const FAQ_DATA = [
  { q: "Giờ hoạt động của tàu Metro số 1 là khi nào?", a: "Tàu chạy hàng ngày từ 5h00 đến 22h00, tần suất 8-12 phút/chuyến (giờ thường) và 5-6 phút/chuyến (giờ cao điểm)." },
  { q: "Giá vé lượt được tính như thế nào?", a: "Giá vé lượt dao động từ 7.000đ đến 20.000đ tùy theo số ga đi qua giữa ga đi và ga đến." },
  { q: "Tôi có thể mang xe đạp lên tàu không?", a: "Hiện tại tàu chưa cho phép mang xe đạp thông thường lên tàu, ngoại trừ xe đạp gấp được bọc túi kín ở một số toa nhất định." },
  { q: "Ai được miễn phí vé?", a: "Người có công với cách mạng, người khuyết tật, người từ 60 tuổi trở lên và trẻ em dưới 6 tuổi đi kèm người lớn." },
  { q: "Vé tháng có thể chuyển nhượng cho người khác không?", a: "Có, bạn có thể yêu cầu chuyển nhượng vé tháng đứng tên người khác tại mục Vé của tôi, cần xác minh danh tính." },
  { q: "Nếu đi quá ga thì phải làm sao?", a: "Bạn cần mua vé bổ sung phần chênh lệch tại quầy hoặc máy bán vé tự động trước khi ra cổng soát vé." },
];

document.addEventListener("DOMContentLoaded", () => {
  if (!currentUser) return;
  renderUserChip(currentUser);
  fillStationSelects();
  renderHome();
  renderProfileForm();
  renderStationList();
  renderPromotions();
  renderNotifications();
  renderMyTickets();
  renderHistory();
  renderFAQ();
  renderMyFeedback();
  renderMyLostFound();
  setupRatingStars();
  document.getElementById("buyDate").valueAsDate = new Date();
});

// ---------------- STATION SELECTS ----------------
function fillStationSelects() {
  const stations = DB.getStations();
  const selectIds = ["quickFrom", "quickTo", "routeFrom", "routeTo", "buyFrom", "buyTo", "groupFrom", "groupTo", "scheduleStation", "lfStation"];
  selectIds.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = stations.map(s => `<option value="${s.name}">${s.id}. ${s.name}</option>`).join("");
  });
  document.getElementById("quickTo").value = stations[stations.length - 1].name;
  document.getElementById("routeTo").value = stations[stations.length - 1].name;
  document.getElementById("buyTo").value = stations[stations.length - 1].name;
  document.getElementById("groupTo").value = stations[stations.length - 1].name;

  document.getElementById("quickFrom").addEventListener("change", updateQuickFare);
  document.getElementById("quickTo").addEventListener("change", updateQuickFare);
  document.getElementById("buyFrom").addEventListener("change", updateBuyFare);
  document.getElementById("buyTo").addEventListener("change", updateBuyFare);
  document.getElementById("groupFrom").addEventListener("change", calcGroupFare);
  document.getElementById("groupTo").addEventListener("change", calcGroupFare);
  updateQuickFare();
  updateBuyFare();
  calcGroupFare();
}

function updateQuickFare() {
  const from = document.getElementById("quickFrom").value;
  const to = document.getElementById("quickTo").value;
  const fare = DB.calcFare(from, to);
  document.getElementById("quickFare").textContent = from === to ? "—" : money(fare);
}
function goToBuyWithRoute() {
  document.getElementById("buyFrom").value = document.getElementById("quickFrom").value;
  document.getElementById("buyTo").value = document.getElementById("quickTo").value;
  updateBuyFare();
  showTab("tab-buy", document.querySelector('[data-tab="tab-buy"]'));
}

// ---------------- HOME ----------------
function renderHome() {
  const tickets = DB.getTicketsByUser(currentUser.id);
  const active = tickets.filter(t => t.status === "Còn hiệu lực");
  const tx = DB.getTransactionsByUser(currentUser.id);
  const spent = tx.reduce((s, t) => s + t.amount, 0);
  const notifs = DB.getNotifications().filter(n => !n.read);

  document.getElementById("homeActiveTickets").textContent = active.length;
  document.getElementById("homeWallet").textContent = money(currentUser.wallet);
  document.getElementById("homeSpent").textContent = money(spent);
  document.getElementById("homeNotifCount").textContent = notifs.length;
  document.getElementById("notifCount").textContent = notifs.length ? `(${notifs.length})` : "";

  const alertBox = document.getElementById("homeAlerts");
  alertBox.innerHTML = DB.getNotifications().slice(0, 3).map(n => `
    <div class="card" style="padding:12px 14px; box-shadow:none; border-color: var(--line-soft);">
      <div class="flex-between"><strong class="text-sm">${n.title}</strong><span class="text-sm text-muted">${n.date}</span></div>
      <div class="text-sm text-muted mt-8">${n.message}</div>
    </div>
  `).join("") || `<div class="empty-state"><div class="ico">✅</div><strong>Không có cảnh báo</strong></div>`;

  const recentBox = document.getElementById("homeRecentTickets");
  const recent = tickets.slice(-3).reverse();
  recentBox.innerHTML = recent.length ? recent.map(t => ticketRowHTML(t)).join("") :
    `<div class="empty-state"><div class="ico">🎫</div><strong>Bạn chưa có vé nào</strong><div class="text-sm">Hãy mua vé đầu tiên của bạn!</div></div>`;
}

function ticketRowHTML(t) {
  const statusBadge = t.status === "Còn hiệu lực" ? "badge-ok" : t.status === "Đã hủy" ? "badge-danger" : "badge-info";
  return `
    <div class="ticket-list-card" style="padding:14px 0; border-top: 1px solid var(--line-soft);">
      <div>
        <strong>${t.type}</strong>
        <div class="text-sm text-muted">${t.from} → ${t.to} · ${t.date}</div>
      </div>
      <div class="flex gap-12" style="align-items:center;">
        <span class="badge ${statusBadge}">${t.status}</span>
        <strong>${money(t.price)}</strong>
        <button class="btn btn-ghost btn-sm" onclick="viewTicket('${t.id}')">Xem</button>
      </div>
    </div>
  `;
}

// ---------------- PROFILE ----------------
function renderProfileForm() {
  document.getElementById("pfName").value = currentUser.name;
  document.getElementById("pfEmail").value = currentUser.email;
  document.getElementById("pfPhone").value = currentUser.phone;
  document.getElementById("pfType").value = currentUser.type || "Phổ thông";
}
function saveProfile(e) {
  e.preventDefault();
  const patch = {
    name: document.getElementById("pfName").value.trim(),
    phone: document.getElementById("pfPhone").value.trim(),
    type: document.getElementById("pfType").value,
  };
  DB.updateUser(currentUser.id, patch);
  currentUser = DB.currentUser();
  renderUserChip(currentUser);
  toast("Đã cập nhật thông tin cá nhân.", "ok");
}
function confirmDeleteAccount() {
  if (confirm("Bạn chắc chắn muốn xóa tài khoản? Hành động này không thể hoàn tác.")) {
    DB.deleteUser(currentUser.id);
    toast("Tài khoản đã được xóa.", "ok");
    setTimeout(logoutAndRedirect, 800);
  }
}
function changePassword(e) {
  e.preventDefault();
  const cur = document.getElementById("curPass").value;
  const next = document.getElementById("newPass2").value;
  if (cur !== currentUser.password) { toast("Mật khẩu hiện tại không đúng.", "error"); return; }
  DB.updateUser(currentUser.id, { password: next });
  toast("Đổi mật khẩu thành công.", "ok");
  e.target.reset();
}

// ---------------- ROUTE ----------------
function renderRoute() {
  const from = document.getElementById("routeFrom").value;
  const to = document.getElementById("routeTo").value;
  const stations = DB.getStations();
  const a = stations.find(s => s.name === from);
  const b = stations.find(s => s.name === to);
  if (a.id === b.id) { toast("Vui lòng chọn 2 ga khác nhau.", "error"); return; }
  const lo = Math.min(a.id, b.id), hi = Math.max(a.id, b.id);
  const path = stations.filter(s => s.id >= lo && s.id <= hi);
  const ordered = a.id <= b.id ? path : path.reverse();
  const stops = ordered.length - 1;
  const minutes = Math.max(6, stops * 2.3 | 0);

  document.getElementById("routeResultBox").style.display = "block";
  document.getElementById("routeTime").textContent = "~" + minutes + " phút";
  document.getElementById("routeStops").textContent = stops + " ga";
  document.getElementById("routeFare").textContent = money(DB.calcFare(from, to));

  document.getElementById("routeTrack").innerHTML = ordered.map((s, i) => `
    <div class="route-stop">
      <div class="dot-col"><div class="dot" style="${i===0||i===ordered.length-1?'background:var(--teal-400);':''}"></div><div class="bar"></div></div>
      <div class="label"><strong>${s.name}</strong><span>${s.zone} · ${s.district}</span></div>
    </div>
  `).join("");
}

// ---------------- STATIONS ----------------
function renderStationList(query) {
  const stations = DB.getStations().filter(s => !query || s.name.toLowerCase().includes(query.toLowerCase()));
  document.getElementById("stationListBox").innerHTML = stations.map(s => `
    <div class="station-mini-card" onclick="openStationDetail(${s.id})">
      <div class="station-num">${s.id}</div>
      <div>
        <strong>${s.name}</strong>
        <div class="text-sm text-muted">${s.zone} · ${s.district}</div>
      </div>
    </div>
  `).join("");
}
function openStationDetail(id) {
  const s = DB.getStations().find(x => x.id === id);
  alert(`Ga ${s.name}\nKhu vực: ${s.zone}\nQuận: ${s.district}\nTiện ích: ${s.facilities.join(", ")}`);
}

// ---------------- SCHEDULE ----------------
function renderSchedule() {
  const name = document.getElementById("scheduleStation").value;
  const times = ["05:00", "05:10", "05:20", "...", "21:40", "21:50", "22:00"];
  document.getElementById("scheduleResult").innerHTML = `
    <div class="card" style="box-shadow:none; padding:14px;">
      <strong>${name}</strong>
      <div class="text-sm text-muted mt-8">Chuyến đầu: 05:00 · Chuyến cuối: 22:00</div>
      <div class="text-sm text-muted">Tần suất: 8-12 phút (thường) / 5-6 phút (cao điểm)</div>
    </div>
  `;
}

// ---------------- BUY TICKET ----------------
function selectBuyType(type, el) {
  buyType = type;
  document.querySelectorAll("#buyTypeTabs .pill-tab").forEach(t => t.classList.remove("active"));
  el.classList.add("active");
  ["luot", "ngay", "ba_ngay", "thang", "nhom"].forEach(t => {
    document.getElementById("buyPanel-" + t).style.display = t === type ? "block" : "none";
  });
}
function selectMonthly(kind) {
  monthlySelected = kind;
  document.getElementById("monthlyNormal").classList.toggle("active", kind === "normal");
  document.getElementById("monthlyHssv").classList.toggle("active", kind === "hssv");
}
function updateBuyFare() {
  const from = document.getElementById("buyFrom").value;
  const to = document.getElementById("buyTo").value;
  document.getElementById("buyFare").textContent = from === to ? "—" : money(DB.calcFare(from, to));
}
function calcGroupFare() {
  const from = document.getElementById("groupFrom").value;
  const to = document.getElementById("groupTo").value;
  const qty = parseInt(document.getElementById("groupQty").value) || 1;
  const base = DB.calcFare(from, to);
  let total = base * qty;
  if (qty >= 4) total = Math.round(total * 0.9);
  document.getElementById("groupFare").textContent = money(total);
}
function applyVoucher() {
  const code = document.getElementById("voucherCode").value.trim().toUpperCase();
  if (code === "METRO30") {
    voucherDiscount = 0.3;
    document.getElementById("voucherMsg").textContent = "Áp dụng thành công: giảm 30% tổng tiền.";
    toast("Áp dụng voucher thành công!", "ok");
  } else if (!code) {
    voucherDiscount = 0;
    document.getElementById("voucherMsg").textContent = "";
  } else {
    voucherDiscount = 0;
    document.getElementById("voucherMsg").textContent = "Mã giảm giá không hợp lệ hoặc đã hết hạn.";
    toast("Mã giảm giá không hợp lệ.", "error");
  }
}

function buildPendingOrder() {
  if (buyType === "luot") {
    const from = document.getElementById("buyFrom").value, to = document.getElementById("buyTo").value;
    if (from === to) { toast("Vui lòng chọn 2 ga khác nhau.", "error"); return null; }
    return { type: "Vé lượt", from, to, price: DB.calcFare(from, to) };
  }
  if (buyType === "ngay") return { type: "Vé ngày", from: "-", to: "-", price: TICKET_PRICES.ngay };
  if (buyType === "ba_ngay") return { type: "Vé 3 ngày", from: "-", to: "-", price: TICKET_PRICES.ba_ngay };
  if (buyType === "thang") {
    const isHssv = monthlySelected === "hssv";
    return { type: isHssv ? "Vé tháng HSSV" : "Vé tháng", from: "-", to: "-", price: isHssv ? TICKET_PRICES.thang_hssv : TICKET_PRICES.thang };
  }
  if (buyType === "nhom") {
    const from = document.getElementById("groupFrom").value, to = document.getElementById("groupTo").value;
    const qty = parseInt(document.getElementById("groupQty").value) || 1;
    let total = DB.calcFare(from, to) * qty;
    if (qty >= 4) total = Math.round(total * 0.9);
    return { type: "Vé nhóm (" + qty + " vé)", from, to, price: total, qty };
  }
  return null;
}

function proceedToPayment() {
  const order = buildPendingOrder();
  if (!order) return;
  if (voucherDiscount > 0) order.price = Math.round(order.price * (1 - voucherDiscount));
  pendingPayment = order;
  document.getElementById("paymentAmount").textContent = money(order.price);
  openModal("paymentModal");
}

function confirmPayment() {
  const method = document.querySelector('input[name="payMethod"]:checked').value;
  const order = pendingPayment;
  if (!order) return;

  if (method === "Ví nội bộ") {
    const res = DB.deductWallet(currentUser.id, order.price);
    if (!res.ok) { toast(res.msg, "error"); return; }
    currentUser = DB.currentUser();
  }

  const qty = order.qty || 1;
  let lastTicket;
  for (let i = 0; i < qty; i++) {
    lastTicket = DB.buyTicket({ userId: currentUser.id, type: qty > 1 ? "Vé lượt" : order.type, from: order.from, to: order.to, price: qty > 1 ? Math.round(order.price / qty) : order.price });
  }
  DB.addTransaction({ userId: currentUser.id, ticketId: lastTicket.id, amount: order.price, method });

  closeModal("paymentModal");
  toast("Thanh toán thành công! Vé đã được thêm vào tài khoản của bạn.", "ok");
  voucherDiscount = 0;
  document.getElementById("voucherCode").value = "";
  document.getElementById("voucherMsg").textContent = "";
  renderHome();
  renderMyTickets();
  renderHistory();
}

// ---------------- MY TICKETS ----------------
let ticketFilter = "all";
function filterTickets(f, el) {
  ticketFilter = f;
  document.querySelectorAll("#ticketFilterTabs .pill-tab").forEach(t => t.classList.remove("active"));
  el.classList.add("active");
  renderMyTickets();
}
function renderMyTickets() {
  let tickets = DB.getTicketsByUser(currentUser.id).slice().reverse();
  if (ticketFilter === "active") tickets = tickets.filter(t => t.status === "Còn hiệu lực");
  if (ticketFilter === "used") tickets = tickets.filter(t => t.status !== "Còn hiệu lực");
  const box = document.getElementById("myTicketsBox");
  if (!tickets.length) {
    box.innerHTML = `<div class="empty-state"><div class="ico">🎫</div><strong>Không có vé nào trong mục này</strong></div>`;
    return;
  }
  box.innerHTML = tickets.map(t => `
    <div class="card qr-ticket-card">
      <div class="qr-box">${t.qr}</div>
      <div style="flex:1;">
        <div class="flex-between">
          <strong>${t.type}</strong>
          <span class="badge ${t.status === "Còn hiệu lực" ? "badge-ok" : t.status === "Đã hủy" ? "badge-danger" : "badge-info"}">${t.status}</span>
        </div>
        <div class="text-sm text-muted mt-8">${t.from} → ${t.to} · Mua ngày ${t.date}${t.expiry ? " · HSD: " + t.expiry : ""}</div>
        <div class="flex gap-8 mt-16 flex-wrap">
          <strong style="margin-right:auto;">${money(t.price)}</strong>
          ${t.status === "Còn hiệu lực" ? `<button class="btn btn-ghost btn-sm" onclick="changeTicketDate('${t.id}')">Đổi thời gian</button>
          <button class="btn btn-ghost btn-sm" onclick="cancelTicketAction('${t.id}')">Hủy vé</button>` : ""}
          ${t.status === "Đã hủy" ? `<button class="btn btn-ghost btn-sm" onclick="refundAction('${t.id}')">Yêu cầu hoàn tiền</button>` : ""}
          <button class="btn btn-primary btn-sm" onclick="viewTicket('${t.id}')">Xem QR</button>
        </div>
      </div>
    </div>
  `).join("");
}
function viewTicket(id) {
  const t = DB.getTicketsByUser(currentUser.id).find(x => x.id === id);
  document.getElementById("ticketDetailBody").innerHTML = `
    <div class="qr-ticket-card">
      <div class="qr-box" style="width:160px; height:160px; font-size:0.7rem;">${t.qr}</div>
      <div>
        <strong style="font-size:1.05rem;">${t.type}</strong>
        <div class="text-sm text-muted mt-8">${t.from} → ${t.to}</div>
        <div class="text-sm text-muted">Mã vé: ${t.id}</div>
        <div class="badge badge-ok mt-8">${t.status}</div>
      </div>
    </div>
    <p class="text-sm text-muted mt-16">Đưa mã QR này vào đầu đọc tại cổng soát vé để vào/ra ga.</p>
  `;
  openModal("ticketDetailModal");
}
function changeTicketDate(id) {
  const newDate = prompt("Nhập ngày đi mới (YYYY-MM-DD):");
  if (!newDate) return;
  DB.updateTicket(id, { date: newDate });
  toast("Đã cập nhật thời gian đi.", "ok");
  renderMyTickets();
}
function cancelTicketAction(id) {
  if (!confirm("Xác nhận hủy vé này?")) return;
  DB.cancelTicket(id);
  toast("Đã hủy vé.", "ok");
  renderMyTickets();
  renderHome();
}
function refundAction(id) {
  DB.refund(id);
  toast("Đã gửi yêu cầu hoàn tiền, xử lý trong 3-5 ngày làm việc.", "ok");
  renderMyTickets();
}

// ---------------- HISTORY ----------------
function renderHistory() {
  const tx = DB.getTransactionsByUser(currentUser.id).slice().reverse();
  document.getElementById("historyTableBody").innerHTML = tx.map(t => `
    <tr>
      <td>${t.id}</td><td>${t.ticketId}</td><td>${money(t.amount)}</td><td>${t.method}</td>
      <td><span class="badge badge-ok">${t.status}</span></td><td>${t.date}</td>
      <td><button class="btn btn-ghost btn-sm" onclick="alert('Hóa đơn PDF: ${t.id} - đã gửi đến email của bạn (demo).')">Xuất PDF</button></td>
    </tr>
  `).join("") || `<tr><td colspan="7" class="text-center text-muted" style="padding:24px;">Chưa có giao dịch nào</td></tr>`;

  document.getElementById("invoiceTableBody").innerHTML = tx.map(t => `
    <tr><td>INV-${t.id}</td><td>${t.date}</td><td>${money(t.amount)}</td>
    <td><button class="btn btn-ghost btn-sm" onclick="alert('Đã xuất hóa đơn PDF cho ${t.id} (demo).')">Xuất PDF</button></td></tr>
  `).join("") || `<tr><td colspan="4" class="text-center text-muted" style="padding:24px;">Chưa có hóa đơn nào</td></tr>`;
}

// ---------------- WALLET ----------------
function topUp() {
  const amount = parseInt(document.getElementById("topupAmount").value);
  if (!amount || amount <= 0) { toast("Vui lòng nhập số tiền hợp lệ.", "error"); return; }
  DB.topUpWallet(currentUser.id, amount);
  currentUser = DB.currentUser();
  document.getElementById("walletBalance").textContent = money(currentUser.wallet);
  document.getElementById("topupAmount").value = "";
  toast("Nạp tiền thành công!", "ok");
  renderHome();
}
function refreshWalletDisplay() {
  document.getElementById("walletBalance").textContent = money(currentUser.wallet);
}

// ---------------- PROMOTIONS ----------------
function renderPromotions() {
  const promos = DB.getPromotions().filter(p => p.active);
  document.getElementById("promoListBox").innerHTML = promos.map(p => `
    <div class="card">
      <div class="badge badge-info mb-8">Đang áp dụng</div>
      <div class="card-title">${p.name}</div>
      <div class="text-sm text-muted">${p.desc}</div>
    </div>
  `).join("");
}

// ---------------- NOTIFICATIONS ----------------
function renderNotifications() {
  const notifs = DB.getNotifications();
  document.getElementById("notifListBox").innerHTML = notifs.map(n => `
    <div class="card" style="box-shadow:none; padding:14px; ${n.read ? "opacity:0.6;" : ""}" onclick="DB.markNotificationRead('${n.id}'); renderNotifications(); renderHome();">
      <div class="flex-between"><strong class="text-sm">${n.title}</strong><span class="text-sm text-muted">${n.date}</span></div>
      <div class="text-sm text-muted mt-8">${n.message}</div>
      ${!n.read ? '<span class="badge badge-info mt-8">Mới</span>' : ""}
    </div>
  `).join("") || `<div class="empty-state"><div class="ico">🔔</div><strong>Không có thông báo</strong></div>`;
}
function markAllRead() {
  DB.getNotifications().forEach(n => DB.markNotificationRead(n.id));
  renderNotifications();
  renderHome();
  toast("Đã đánh dấu tất cả là đã đọc.", "ok");
}

// ---------------- SUPPORT / CHAT ----------------
function sendChat() {
  const input = document.getElementById("chatInput");
  const msg = input.value.trim();
  if (!msg) return;
  const win = document.getElementById("chatWindow");
  win.insertAdjacentHTML("beforeend", `<div class="chat-msg user">${escapeHtml(msg)}</div>`);
  input.value = "";
  win.scrollTop = win.scrollHeight;
  setTimeout(() => {
    win.insertAdjacentHTML("beforeend", `<div class="chat-msg agent">Cảm ơn bạn đã liên hệ. Nhân viên CSKH sẽ phản hồi trong vài phút. Bạn có thể tham khảo mục FAQ để biết thêm chi tiết.</div>`);
    win.scrollTop = win.scrollHeight;
  }, 700);
}
function escapeHtml(s) { const d = document.createElement("div"); d.textContent = s; return d.innerHTML; }

function submitBugReport(e) {
  e.preventDefault();
  toast("Đã gửi báo cáo lỗi, cảm ơn bạn đã phản hồi!", "ok");
  e.target.reset();
}

// ---------------- FEEDBACK ----------------
function setupRatingStars() {
  document.querySelectorAll("#ratingStars span").forEach(star => {
    star.addEventListener("click", () => {
      selectedRating = parseInt(star.dataset.v);
      document.querySelectorAll("#ratingStars span").forEach(s => s.classList.toggle("active", parseInt(s.dataset.v) <= selectedRating));
    });
  });
}
function submitFeedback(e) {
  e.preventDefault();
  if (!selectedRating) { toast("Vui lòng chấm sao đánh giá.", "error"); return; }
  DB.addFeedback({ userId: currentUser.id, subject: "Đánh giá chuyến đi", message: document.getElementById("fbMessage").value, rating: selectedRating });
  toast("Cảm ơn bạn đã đánh giá!", "ok");
  document.getElementById("fbMessage").value = "";
  selectedRating = 0;
  document.querySelectorAll("#ratingStars span").forEach(s => s.classList.remove("active"));
  renderMyFeedback();
}
function renderMyFeedback() {
  const fbs = DB.getFeedback().filter(f => f.userId === currentUser.id).reverse();
  document.getElementById("myFeedbackBox").innerHTML = fbs.map(f => `
    <div class="card" style="box-shadow:none; padding:14px;">
      <div>${"★".repeat(f.rating)}${"☆".repeat(5 - f.rating)}</div>
      <div class="text-sm mt-8">${f.message || "(không có nhận xét)"}</div>
      <div class="text-sm text-muted mt-8">${f.date}</div>
    </div>
  `).join("") || `<div class="empty-state"><div class="ico">⭐</div><strong>Bạn chưa có đánh giá nào</strong></div>`;
}

// ---------------- LOST & FOUND ----------------
function submitLostItem(e) {
  e.preventDefault();
  DB.addLostItem({ userId: currentUser.id, item: document.getElementById("lfItem").value, station: document.getElementById("lfStation").value });
  toast("Đã gửi yêu cầu báo mất đồ.", "ok");
  e.target.reset();
  renderMyLostFound();
}
function renderMyLostFound() {
  const items = DB.getLostFoundByUser(currentUser.id).reverse();
  document.getElementById("myLostFoundBox").innerHTML = items.map(l => `
    <div class="card" style="box-shadow:none; padding:14px;">
      <div class="flex-between"><strong class="text-sm">${l.item}</strong><span class="badge badge-warn">${l.status}</span></div>
      <div class="text-sm text-muted mt-8">Tại ga ${l.station} · ${l.date}</div>
    </div>
  `).join("") || `<div class="empty-state"><div class="ico">🧳</div><strong>Bạn chưa gửi yêu cầu nào</strong></div>`;
}

// ---------------- FAQ ----------------
function renderFAQ() {
  document.getElementById("faqListBox").innerHTML = FAQ_DATA.map((f, i) => `
    <div class="faq-item" onclick="this.classList.toggle('open')">
      <strong>❓ ${f.q}</strong>
      <div class="faq-a">${f.a}</div>
    </div>
  `).join("");
}

// ---------------- ACCESSIBILITY ----------------
function toggleAccessibility(on) {
  document.body.style.fontSize = on ? "1.1rem" : "";
  document.body.style.filter = on ? "contrast(1.05)" : "";
  toast(on ? "Đã bật chế độ hỗ trợ người khuyết tật." : "Đã tắt chế độ hỗ trợ.", "ok");
}

// init wallet display once loaded
document.addEventListener("DOMContentLoaded", refreshWalletDisplay);
