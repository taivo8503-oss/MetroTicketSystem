/**
 * nhan-vien.js — Logic cho nhan-vien.html
 */

let staffUser = requireRole("nhan_vien");
let sellType = "luot";
let soldThisSession = [];
let clockedIn = false;
let clockInTime = null;

document.addEventListener("DOMContentLoaded", () => {
  if (!staffUser) return;
  renderUserChip(staffUser);
  fillStaffSelects();
  renderStaffHome();
  renderShiftTable();
  renderShiftHistory();
  renderAttendanceHistory();
  renderLostFoundStaff();
  renderStaffProfile();
  updateSellFare();
});

function fillStaffSelects() {
  const stations = DB.getStations();
  ["sellFrom", "sellTo", "extraOriginalTo", "extraActualTo"].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = stations.map(s => `<option value="${s.name}">${s.id}. ${s.name}</option>`).join("");
  });
  document.getElementById("sellTo").value = stations[stations.length - 1].name;
  document.getElementById("extraActualTo").value = stations[stations.length - 1].name;

  document.getElementById("sellFrom").addEventListener("change", updateSellFare);
  document.getElementById("sellTo").addEventListener("change", updateSellFare);
  document.getElementById("sellPassengerType").addEventListener("change", updateSellFare);
}

// ---------------- HOME ----------------
function renderStaffHome() {
  const shifts = DB.getShiftsByUser(staffUser.id);
  const today = shifts[0];
  document.getElementById("staffTicketsToday").textContent = (today ? today.ticketsSold : 0) + soldThisSession.length;
  document.getElementById("staffRevenueToday").textContent = money((today ? today.revenue : 0) + soldThisSession.reduce((s, t) => s + t.price, 0));
  document.getElementById("staffStation").textContent = staffUser.station;
  document.getElementById("staffShiftTime").textContent = today ? today.time : "—";

  document.getElementById("staffAlerts").innerHTML = DB.getNotifications().slice(0, 3).map(n => `
    <div class="card" style="padding:12px 14px; box-shadow:none; border-color: var(--line-soft);">
      <strong class="text-sm">${n.title}</strong>
      <div class="text-sm text-muted mt-8">${n.message}</div>
    </div>
  `).join("");
}

// ---------------- SELL TICKET ----------------
function selectSellType(type, el) {
  sellType = type;
  document.querySelectorAll("#sellTypeTabs .pill-tab").forEach(t => t.classList.remove("active"));
  el.classList.add("active");
  document.getElementById("sellRouteFields").style.display = type === "luot" ? "block" : "none";
  updateSellFare();
}
function updateSellFare() {
  const passengerType = document.getElementById("sellPassengerType").value;
  let fare = 0;
  if (sellType === "luot") {
    const from = document.getElementById("sellFrom").value, to = document.getElementById("sellTo").value;
    fare = DB.calcFare(from, to);
  } else if (sellType === "ngay") fare = TICKET_PRICES.ngay;
  else if (sellType === "ba_ngay") fare = TICKET_PRICES.ba_ngay;

  if (passengerType === "free") fare = 0;
  document.getElementById("sellFare").textContent = money(fare);
}
function staffSellTicket() {
  const passengerType = document.getElementById("sellPassengerType").value;
  let type = sellType === "luot" ? "Vé lượt" : sellType === "ngay" ? "Vé ngày" : "Vé 3 ngày";
  let from = "-", to = "-";
  let fare = 0;
  if (sellType === "luot") {
    from = document.getElementById("sellFrom").value;
    to = document.getElementById("sellTo").value;
    fare = DB.calcFare(from, to);
    if (from === to) { toast("Vui lòng chọn 2 ga khác nhau.", "error"); return; }
  } else if (sellType === "ngay") fare = TICKET_PRICES.ngay;
  else fare = TICKET_PRICES.ba_ngay;

  if (passengerType === "free") { fare = 0; type += " (Miễn phí)"; }

  // Tạo "vé khách lẻ" gắn với 1 user ẩn danh đại diện khách mua tại quầy
  const guestId = "GUEST";
  const ticket = DB.buyTicket({ userId: guestId, type, from, to, price: fare });
  const method = document.getElementById("sellPayMethod").value;
  DB.addTransaction({ userId: guestId, ticketId: ticket.id, amount: fare, method });

  soldThisSession.unshift(ticket);
  renderRecentSold();
  renderStaffHome();
  toast("Bán vé thành công! Mã vé: " + ticket.id, "ok");
}
function renderRecentSold() {
  document.getElementById("recentSoldBox").innerHTML = soldThisSession.slice(0, 8).map(t => `
    <div class="card" style="box-shadow:none; padding:12px 14px; display:flex; justify-content:space-between; align-items:center;">
      <div>
        <strong class="text-sm">${t.type}</strong>
        <div class="text-sm text-muted">${t.from} → ${t.to} · ${t.id}</div>
      </div>
      <strong>${money(t.price)}</strong>
    </div>
  `).join("") || `<div class="empty-state"><div class="ico">🎫</div><strong>Chưa bán vé nào trong ca này</strong></div>`;
}

// ---------------- VÉ BỔ SUNG ----------------
function calcExtraFare() {
  const originalTo = document.getElementById("extraOriginalTo").value;
  const actualTo = document.getElementById("extraActualTo").value;
  const fareOriginal = DB.calcFare(document.getElementById("sellFrom") ? document.getElementById("sellFrom").value : "Bến Thành", originalTo);
  const fareActual = DB.calcFare(document.getElementById("sellFrom") ? document.getElementById("sellFrom").value : "Bến Thành", actualTo);
  const diff = Math.max(0, fareActual - fareOriginal);
  document.getElementById("extraFare").textContent = money(diff);
}

// ---------------- SCAN / VERIFY ----------------
function verifyTicketAction() {
  const code = document.getElementById("manualQrInput").value.trim();
  if (!code) { toast("Vui lòng nhập mã vé.", "error"); return; }
  const res = DB.verifyTicket(code);
  const box = document.getElementById("verifyResultBox");
  if (res.ok) {
    box.innerHTML = `<div class="verify-result ok"><strong>✅ VÉ HỢP LỆ</strong><div class="text-sm mt-8">${res.ticket.type} · ${res.ticket.from} → ${res.ticket.to}</div></div>`;
    if (res.ticket.type === "Vé lượt") DB.updateTicket(res.ticket.id, { status: "Đã dùng" });
    toast("Vé hợp lệ, cho phép qua cổng.", "ok");
  } else {
    box.innerHTML = `<div class="verify-result error"><strong>❌ VÉ KHÔNG HỢP LỆ</strong><div class="text-sm mt-8">${res.msg}</div></div>`;
    toast(res.msg, "error");
  }
  document.getElementById("manualQrInput").value = "";
}

// ---------------- SHIFT ----------------
function renderShiftTable() {
  const shifts = DB.getShiftsByUser(staffUser.id);
  document.getElementById("myShiftTableBody").innerHTML = shifts.map(s => `
    <tr><td>${s.date}</td><td>${s.time}</td><td>${s.station}</td>
    <td><span class="badge badge-info">Đã lên lịch</span></td></tr>
  `).join("") || `<tr><td colspan="4" class="text-center text-muted" style="padding:24px;">Chưa có lịch phân ca</td></tr>`;
}

// ---------------- SHIFT REPORT ----------------
function submitShiftReport() {
  const count = soldThisSession.length;
  const revenue = soldThisSession.reduce((s, t) => s + t.price, 0);
  document.getElementById("reportTicketCount").textContent = count;
  document.getElementById("reportRevenue").textContent = money(revenue);
  if (!count) { toast("Chưa có vé nào để báo cáo trong ca này.", "error"); return; }

  const data = JSON.parse(localStorage.getItem("metro_shift_reports") || "[]");
  data.push({ date: new Date().toISOString().slice(0, 10), time: new Date().toLocaleTimeString("vi-VN"), staff: staffUser.name, count, revenue });
  localStorage.setItem("metro_shift_reports", JSON.stringify(data));

  soldThisSession = [];
  renderRecentSold();
  renderShiftHistory();
  toast("Đã gửi báo cáo cuối ca cho quản lý!", "ok");
}
function renderShiftHistory() {
  const data = JSON.parse(localStorage.getItem("metro_shift_reports") || "[]").filter(r => r.staff === staffUser.name).reverse();
  document.getElementById("shiftHistoryBody").innerHTML = data.map(r => `
    <tr><td>${r.date}</td><td>${r.time}</td><td>${r.count}</td><td>${money(r.revenue)}</td></tr>
  `).join("") || `<tr><td colspan="4" class="text-center text-muted" style="padding:24px;">Chưa có báo cáo nào</td></tr>`;
}

// ---------------- ATTENDANCE ----------------
function clockIn() {
  if (clockedIn) { toast("Bạn đã chấm công vào ca rồi.", "error"); return; }
  clockedIn = true;
  clockInTime = new Date();
  document.getElementById("attendanceStatus").textContent = "Đang trong ca";
  toast("Chấm công vào ca thành công lúc " + clockInTime.toLocaleTimeString("vi-VN"), "ok");
}
function clockOut() {
  if (!clockedIn) { toast("Bạn chưa chấm công vào ca.", "error"); return; }
  const outTime = new Date();
  const data = JSON.parse(localStorage.getItem("metro_attendance") || "[]");
  data.push({ date: outTime.toISOString().slice(0, 10), staff: staffUser.name, in: clockInTime.toLocaleTimeString("vi-VN"), out: outTime.toLocaleTimeString("vi-VN") });
  localStorage.setItem("metro_attendance", JSON.stringify(data));
  clockedIn = false;
  document.getElementById("attendanceStatus").textContent = "Chưa chấm công";
  renderAttendanceHistory();
  toast("Chấm công kết thúc ca lúc " + outTime.toLocaleTimeString("vi-VN"), "ok");
}
function renderAttendanceHistory() {
  const data = JSON.parse(localStorage.getItem("metro_attendance") || "[]").filter(r => r.staff === staffUser.name).reverse();
  document.getElementById("attendanceHistoryBody").innerHTML = data.map(r => `
    <tr><td>${r.date}</td><td>${r.in}</td><td>${r.out}</td></tr>
  `).join("") || `<tr><td colspan="3" class="text-center text-muted" style="padding:24px;">Chưa có lịch sử chấm công</td></tr>`;
}

// ---------------- LOST & FOUND (STAFF) ----------------
function renderLostFoundStaff() {
  const items = DB.getLostFound().slice().reverse();
  document.getElementById("lfStaffTableBody").innerHTML = items.map(l => `
    <tr>
      <td>${l.id}</td><td>${l.item}</td><td>${l.station}</td><td>${l.date}</td>
      <td><span class="badge ${l.status === "Đã trả" ? "badge-ok" : "badge-warn"}">${l.status}</span></td>
      <td>
        ${l.status !== "Đã trả" ? `<button class="btn btn-ghost btn-sm" onclick="markLostFoundDone('${l.id}')">Đánh dấu đã trả</button>` : "—"}
      </td>
    </tr>
  `).join("") || `<tr><td colspan="6" class="text-center text-muted" style="padding:24px;">Không có yêu cầu nào</td></tr>`;
}
function markLostFoundDone(id) {
  DB.updateLostFoundStatus(id, "Đã trả");
  renderLostFoundStaff();
  toast("Đã cập nhật trạng thái trả đồ.", "ok");
}

// ---------------- PROFILE ----------------
function renderStaffProfile() {
  document.getElementById("stName").value = staffUser.name;
  document.getElementById("stEmail").value = staffUser.email;
  document.getElementById("stPhone").value = staffUser.phone;
  document.getElementById("stPosition").value = staffUser.position;
  document.getElementById("stStation").value = staffUser.station;
}
function saveStaffProfile(e) {
  e.preventDefault();
  DB.updateUser(staffUser.id, { name: document.getElementById("stName").value, phone: document.getElementById("stPhone").value });
  staffUser = DB.currentUser();
  renderUserChip(staffUser);
  toast("Đã lưu thông tin cá nhân.", "ok");
}
