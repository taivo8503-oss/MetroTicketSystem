/**
 * quan-ly.js — Logic cho quan-ly.html
 */

let adminUser = requireRole("quan_ly");

document.addEventListener("DOMContentLoaded", () => {
  if (!adminUser) return;
  renderUserChip(adminUser);
  fillAdminSelects();
  renderDashboard();
  renderRevenueReport();
  renderRecon();
  renderHrReport();
  renderStationAdmin();
  renderMaintenanceList();
  renderCustomersAdmin();
  renderStaffAdmin();
  renderAllShifts();
  renderPromoAdmin();
  renderFeedbackAdmin();
  renderLostFoundAdmin();
  renderNotifAdminList();
  renderAdminProfile();
});

function fillAdminSelects() {
  const stations = DB.getStations();
  ["maintStation", "shiftStation", "newStaffStation"].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = stations.map(s => `<option value="${s.name}">${s.id}. ${s.name}</option>`).join("");
  });
  const staffSelect = document.getElementById("shiftStaffSelect");
  staffSelect.innerHTML = DB.allUsers("nhan_vien").map(s => `<option value="${s.id}">${s.name} (${s.position})</option>`).join("");
}

// ---------------- DASHBOARD ----------------
function renderDashboard() {
  const stats = DB.getDashboardStats();
  document.getElementById("dashRevenue").textContent = money(stats.totalRevenue);
  document.getElementById("dashTickets").textContent = stats.totalTickets;
  document.getElementById("dashCustomers").textContent = stats.totalCustomers;
  document.getElementById("dashStaff").textContent = stats.totalStaff;

  // Bar chart giả lập 7 ngày gần nhất dựa trên transactions thật + dữ liệu mô phỏng
  const tx = DB.getAllTransactions();
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(5, 10));
  }
  const baseRevenue = tx.reduce((s, t) => s + t.amount, 0) || 100000;
  const simulated = days.map((d, i) => Math.round(baseRevenue * (0.5 + Math.random() * 0.8) / 3));
  const max = Math.max(...simulated, 1);
  document.getElementById("revenueBarChart").innerHTML = days.map((d, i) => `
    <div class="bar-col">
      <div class="bar" style="height:${Math.max(6, (simulated[i] / max) * 150)}px;" title="${money(simulated[i])}"></div>
      <div class="bar-label">${d}</div>
    </div>
  `).join("");

  const tickets = DB.getAllTickets();
  const types = {};
  tickets.forEach(t => { types[t.type] = (types[t.type] || 0) + 1; });
  const totalT = tickets.length || 1;
  document.getElementById("ticketTypeBreakdown").innerHTML = Object.entries(types).map(([type, count]) => `
    <div>
      <div class="flex-between text-sm mb-8"><span>${type}</span><strong>${count}</strong></div>
      <div style="height:8px; background:var(--line-soft); border-radius:4px; overflow:hidden;">
        <div style="height:100%; width:${(count/totalT*100).toFixed(0)}%; background:var(--blue-600);"></div>
      </div>
    </div>
  `).join("") || `<div class="empty-state"><div class="ico">🎫</div><strong>Chưa có dữ liệu vé</strong></div>`;

  document.getElementById("recentActivityBody").innerHTML = tx.slice().reverse().slice(0, 8).map(t => `
    <tr><td>${t.id}</td><td>${money(t.amount)}</td><td>${t.method}</td><td>${t.date}</td></tr>
  `).join("") || `<tr><td colspan="4" class="text-center text-muted" style="padding:24px;">Chưa có giao dịch nào</td></tr>`;
}

// ---------------- REVENUE REPORT ----------------
function renderRevenueReport() {
  const tx = DB.getAllTransactions().slice().reverse();
  const users = DB.allUsers();
  document.getElementById("revenueReportBody").innerHTML = tx.map(t => {
    const u = users.find(x => x.id === t.userId);
    return `<tr><td>${t.id}</td><td>${u ? u.name : "Khách lẻ tại quầy"}</td><td>${t.ticketId}</td><td>${money(t.amount)}</td><td>${t.method}</td><td>${t.date}</td></tr>`;
  }).join("") || `<tr><td colspan="6" class="text-center text-muted" style="padding:24px;">Chưa có dữ liệu</td></tr>`;
}
function exportReport() {
  toast("Đã xuất báo cáo (demo) — file sẽ được gửi đến email quản trị.", "ok");
}

// ---------------- RECON ----------------
function renderRecon() {
  const tx = DB.getAllTransactions();
  const methods = {};
  tx.forEach(t => {
    if (!methods[t.method]) methods[t.method] = { count: 0, total: 0 };
    methods[t.method].count++;
    methods[t.method].total += t.amount;
  });
  document.getElementById("reconTableBody").innerHTML = Object.entries(methods).map(([m, v]) => `
    <tr><td>${m}</td><td>${v.count}</td><td>${money(v.total)}</td><td><span class="badge badge-ok">Đã khớp</span></td></tr>
  `).join("") || `<tr><td colspan="4" class="text-center text-muted" style="padding:24px;">Chưa có dữ liệu</td></tr>`;
}

// ---------------- HR REPORT ----------------
function renderHrReport() {
  const staff = DB.allUsers("nhan_vien");
  const shifts = DB.getAllShifts();
  document.getElementById("hrReportBody").innerHTML = staff.map(s => {
    const shift = shifts.find(sh => sh.userId === s.id);
    return `<tr><td>${s.name}</td><td>${s.position}</td><td>${s.station}</td><td>${shift ? shift.ticketsSold : 0}</td><td>${money(shift ? shift.revenue : 0)}</td></tr>`;
  }).join("");
}

// ---------------- STATIONS ADMIN ----------------
function renderStationAdmin() {
  const stations = DB.getStations();
  document.getElementById("stationAdminBody").innerHTML = stations.map(s => `
    <tr>
      <td>${s.id}</td><td>${s.name}</td><td>${s.zone}</td><td>${s.district}</td>
      <td><button class="btn btn-danger btn-sm" onclick="deleteStationAction(${s.id})">Xóa</button></td>
    </tr>
  `).join("");
}
function addStationSubmit(e) {
  e.preventDefault();
  DB.addStation({
    name: document.getElementById("newStationName").value,
    zone: document.getElementById("newStationZone").value,
    district: document.getElementById("newStationDistrict").value,
    lat: 10.8, lng: 106.7, facilities: ["Vé tự động"],
  });
  closeModal("addStationModal");
  renderStationAdmin();
  e.target.reset();
  toast("Đã thêm nhà ga mới.", "ok");
}
function deleteStationAction(id) {
  if (!confirm("Xác nhận xóa nhà ga này?")) return;
  DB.deleteStation(id);
  renderStationAdmin();
  toast("Đã xóa nhà ga.", "ok");
}

// ---------------- MAINTENANCE ----------------
function submitMaintenance(e) {
  e.preventDefault();
  const station = document.getElementById("maintStation").value;
  const type = document.getElementById("maintType").value;
  const desc = document.getElementById("maintDesc").value;
  const data = JSON.parse(localStorage.getItem("metro_maintenance") || "[]");
  data.push({ id: "MT" + Date.now(), station, type, desc, date: new Date().toISOString().slice(0, 10) });
  localStorage.setItem("metro_maintenance", JSON.stringify(data));
  DB.addNotification({ title: `${type}: Ga ${station}`, message: desc || `Ga ${station} đang được ${type.toLowerCase()}.` });
  renderMaintenanceList();
  e.target.reset();
  toast("Đã khai báo sự cố và gửi thông báo đến khách hàng.", "ok");
}
function renderMaintenanceList() {
  const data = JSON.parse(localStorage.getItem("metro_maintenance") || "[]").reverse();
  document.getElementById("maintenanceListBox").innerHTML = data.map(m => `
    <div class="card" style="box-shadow:none; padding:14px;">
      <div class="flex-between"><strong class="text-sm">${m.type}</strong><span class="text-sm text-muted">${m.date}</span></div>
      <div class="text-sm text-muted mt-8">Ga ${m.station} — ${m.desc || "(không có mô tả)"}</div>
    </div>
  `).join("") || `<div class="empty-state"><div class="ico">✅</div><strong>Không có sự cố nào được ghi nhận</strong></div>`;
}

// ---------------- CUSTOMERS ADMIN ----------------
function renderCustomersAdmin(query) {
  let customers = DB.allUsers("khach_hang");
  if (query) customers = customers.filter(c => c.name.toLowerCase().includes(query.toLowerCase()) || c.email.toLowerCase().includes(query.toLowerCase()));
  document.getElementById("customersAdminBody").innerHTML = customers.map(c => `
    <tr>
      <td>${c.id}</td><td>${c.name}</td><td>${c.email}</td><td>${c.type}</td><td>${money(c.wallet)}</td>
      <td><button class="btn btn-danger btn-sm" onclick="deleteCustomerAction('${c.id}')">Xóa</button></td>
    </tr>
  `).join("") || `<tr><td colspan="6" class="text-center text-muted" style="padding:24px;">Không tìm thấy khách hàng</td></tr>`;
}
function deleteCustomerAction(id) {
  if (!confirm("Xác nhận xóa khách hàng này?")) return;
  DB.deleteUser(id);
  renderCustomersAdmin();
  renderDashboard();
  toast("Đã xóa tài khoản khách hàng.", "ok");
}

// ---------------- STAFF ADMIN ----------------
function renderStaffAdmin() {
  const staff = DB.allUsers("nhan_vien");
  document.getElementById("staffAdminBody").innerHTML = staff.map(s => `
    <tr>
      <td>${s.id}</td><td>${s.name}</td><td>${s.position}</td><td>${s.station}</td><td>${s.email}</td>
      <td><button class="btn btn-danger btn-sm" onclick="deleteStaffAction('${s.id}')">Xóa</button></td>
    </tr>
  `).join("");
}
function addStaffSubmit(e) {
  e.preventDefault();
  const data = DB.allUsers();
  const newStaff = {
    id: "S" + Date.now(), role: "nhan_vien",
    name: document.getElementById("newStaffName").value,
    email: document.getElementById("newStaffEmail").value,
    phone: document.getElementById("newStaffPhone").value,
    password: "123456",
    position: document.getElementById("newStaffPosition").value,
    station: document.getElementById("newStaffStation").value,
  };
  const raw = JSON.parse(localStorage.getItem("metro_hcmc_db_v1"));
  raw.users.push(newStaff);
  localStorage.setItem("metro_hcmc_db_v1", JSON.stringify(raw));
  closeModal("addStaffModal");
  renderStaffAdmin();
  fillAdminSelects();
  renderDashboard();
  e.target.reset();
  toast("Đã thêm nhân viên mới (mật khẩu mặc định: 123456).", "ok");
}
function deleteStaffAction(id) {
  if (!confirm("Xác nhận xóa nhân viên này?")) return;
  DB.deleteUser(id);
  renderStaffAdmin();
  fillAdminSelects();
  renderDashboard();
  toast("Đã xóa nhân viên.", "ok");
}

// ---------------- SHIFTS ADMIN ----------------
function assignShift(e) {
  e.preventDefault();
  const raw = JSON.parse(localStorage.getItem("metro_hcmc_db_v1"));
  const staffId = document.getElementById("shiftStaffSelect").value;
  raw.shifts.push({
    id: "SH" + Date.now(), userId: staffId,
    date: document.getElementById("shiftDate").value,
    time: document.getElementById("shiftTime").value,
    station: document.getElementById("shiftStation").value,
    ticketsSold: 0, revenue: 0,
  });
  localStorage.setItem("metro_hcmc_db_v1", JSON.stringify(raw));
  renderAllShifts();
  e.target.reset();
  toast("Đã phân ca thành công.", "ok");
}
function renderAllShifts() {
  const shifts = DB.getAllShifts();
  const staff = DB.allUsers("nhan_vien");
  document.getElementById("allShiftsBody").innerHTML = shifts.map(s => {
    const u = staff.find(x => x.id === s.userId);
    return `<tr><td>${u ? u.name : s.userId}</td><td>${s.date}</td><td>${s.time}</td><td>${s.station}</td></tr>`;
  }).join("") || `<tr><td colspan="4" class="text-center text-muted" style="padding:24px;">Chưa có ca nào</td></tr>`;
}

// ---------------- PROMOTIONS ADMIN ----------------
function renderPromoAdmin() {
  const promos = DB.getPromotions();
  document.getElementById("promoAdminBox").innerHTML = promos.map(p => `
    <div class="promo-edit-card">
      <div class="flex-between mb-8">
        <strong>${p.name}</strong>
        <label class="switch"><input type="checkbox" ${p.active ? "checked" : ""} onchange="togglePromo('${p.id}', this.checked)"><span class="slider"></span></label>
      </div>
      <div class="text-sm text-muted mb-16">${p.desc}</div>
      <button class="btn btn-danger btn-sm" onclick="deletePromoAction('${p.id}')">Xóa khuyến mãi</button>
    </div>
  `).join("");
}
function togglePromo(id, active) {
  DB.updatePromotion(id, { active });
  toast(active ? "Đã bật khuyến mãi." : "Đã tắt khuyến mãi.", "ok");
}
function deletePromoAction(id) {
  if (!confirm("Xác nhận xóa khuyến mãi này?")) return;
  DB.deletePromotion(id);
  renderPromoAdmin();
  toast("Đã xóa khuyến mãi.", "ok");
}
function addPromoSubmit(e) {
  e.preventDefault();
  DB.addPromotion({ name: document.getElementById("newPromoName").value, desc: document.getElementById("newPromoDesc").value, active: true });
  closeModal("addPromoModal");
  renderPromoAdmin();
  e.target.reset();
  toast("Đã tạo khuyến mãi mới.", "ok");
}

// ---------------- FEEDBACK ADMIN ----------------
function renderFeedbackAdmin() {
  const fbs = DB.getFeedback().slice().reverse();
  const users = DB.allUsers();
  document.getElementById("feedbackAdminBody").innerHTML = fbs.map(f => {
    const u = users.find(x => x.id === f.userId);
    return `<tr>
      <td>${u ? u.name : f.userId}</td>
      <td>${"★".repeat(f.rating)}</td>
      <td>${f.message || "(không có)"}</td>
      <td>${f.date}</td>
      <td><span class="badge ${f.status === "Đã xem" ? "badge-ok" : "badge-warn"}">${f.status}</span></td>
      <td>${f.status !== "Đã xem" ? `<button class="btn btn-ghost btn-sm" onclick="markFeedbackSeen('${f.id}')">Đánh dấu đã xem</button>` : "—"}</td>
    </tr>`;
  }).join("") || `<tr><td colspan="6" class="text-center text-muted" style="padding:24px;">Chưa có phản hồi nào</td></tr>`;
}
function markFeedbackSeen(id) {
  DB.updateFeedbackStatus(id, "Đã xem");
  renderFeedbackAdmin();
  toast("Đã đánh dấu phản hồi.", "ok");
}

// ---------------- LOST & FOUND ADMIN ----------------
function renderLostFoundAdmin() {
  const items = DB.getLostFound().slice().reverse();
  document.getElementById("lostFoundAdminBody").innerHTML = items.map(l => `
    <tr><td>${l.id}</td><td>${l.item}</td><td>${l.station}</td><td>${l.date}</td>
    <td><span class="badge ${l.status === "Đã trả" ? "badge-ok" : "badge-warn"}">${l.status}</span></td></tr>
  `).join("") || `<tr><td colspan="5" class="text-center text-muted" style="padding:24px;">Không có dữ liệu</td></tr>`;
}

// ---------------- NOTIFICATIONS ADMIN ----------------
function sendBroadcastNotif(e) {
  e.preventDefault();
  DB.addNotification({ title: document.getElementById("notifTitle").value, message: document.getElementById("notifMsg").value });
  renderNotifAdminList();
  e.target.reset();
  toast("Đã gửi thông báo đến tất cả khách hàng.", "ok");
}
function renderNotifAdminList() {
  const notifs = DB.getNotifications();
  document.getElementById("notifAdminList").innerHTML = notifs.map(n => `
    <div class="card" style="box-shadow:none; padding:14px;">
      <div class="flex-between"><strong class="text-sm">${n.title}</strong><span class="text-sm text-muted">${n.date}</span></div>
      <div class="text-sm text-muted mt-8">${n.message}</div>
    </div>
  `).join("") || `<div class="empty-state"><div class="ico">📢</div><strong>Chưa gửi thông báo nào</strong></div>`;
}

// ---------------- PROFILE ----------------
function renderAdminProfile() {
  document.getElementById("adName").value = adminUser.name;
  document.getElementById("adEmail").value = adminUser.email;
  document.getElementById("adPhone").value = adminUser.phone;
  document.getElementById("adPosition").value = adminUser.position;
}
function saveAdminProfile(e) {
  e.preventDefault();
  DB.updateUser(adminUser.id, { name: document.getElementById("adName").value, phone: document.getElementById("adPhone").value });
  adminUser = DB.currentUser();
  renderUserChip(adminUser);
  toast("Đã lưu thông tin cá nhân.", "ok");
}
