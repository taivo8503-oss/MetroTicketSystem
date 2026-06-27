/**
 * db.js — Lớp giả lập Database bằng localStorage
 * ----------------------------------------------------------------
 * Đây là lớp DUY NHẤT chạm vào localStorage trong toàn bộ ứng dụng.
 * Khi nối backend thật, chỉ cần viết lại các hàm trong object DB bên dưới
 * để gọi fetch('/api/...') thay vì đọc/ghi localStorage — toàn bộ code
 * giao diện (app.js, các trang .html) gọi qua DB.* nên KHÔNG cần sửa.
 *
 * Quy ước:
 *  - Mọi hàm DB.* trả về dữ liệu (object/array), không trả Promise (demo đồng bộ).
 *  - Khi nối API thật: đổi các hàm này thành `async function` + `await fetch()`,
 *    rồi ở nơi gọi thêm `await` — cấu trúc gọi hàm giữ nguyên.
 */

const DB_KEY = "metro_hcmc_db_v1";

const STATIONS = [
  { id: 1, name: "Bến Thành", zone: "Ngầm", district: "Quận 1", lat: 10.7720, lng: 106.6980, facilities: ["Vé tự động", "Thang máy", "Nhà vệ sinh", "Trung tâm thương mại ngầm"] },
  { id: 2, name: "Nhà hát Thành phố", zone: "Ngầm", district: "Quận 1", lat: 10.7765, lng: 106.7032, facilities: ["Vé tự động", "Thang máy", "Lối đi bộ kết nối phố đi bộ"] },
  { id: 3, name: "Ba Son", zone: "Ngầm", district: "Quận 1", lat: 10.7842, lng: 106.7115, facilities: ["Vé tự động", "Bãi giữ xe", "Kết nối bến tàu thủy"] },
  { id: 4, name: "Văn Thánh", zone: "Trên cao", district: "Bình Thạnh", lat: 10.7965, lng: 106.7186, facilities: ["Vé tự động", "Bãi giữ xe máy"] },
  { id: 5, name: "Tân Cảng", zone: "Trên cao", district: "Bình Thạnh", lat: 10.7998, lng: 106.7228, facilities: ["Vé tự động", "Thang máy"] },
  { id: 6, name: "Thảo Điền", zone: "Trên cao", district: "Thủ Đức", lat: 10.8042, lng: 106.7345, facilities: ["Vé tự động", "Bãi giữ xe"] },
  { id: 7, name: "An Phú", zone: "Trên cao", district: "Thủ Đức", lat: 10.8038, lng: 106.7458, facilities: ["Vé tự động", "Kết nối xe buýt"] },
  { id: 8, name: "Rạch Chiếc", zone: "Trên cao", district: "Thủ Đức", lat: 10.8045, lng: 106.7568, facilities: ["Vé tự động", "Bãi giữ xe"] },
  { id: 9, name: "Phước Long", zone: "Trên cao", district: "Thủ Đức", lat: 10.8125, lng: 106.7655, facilities: ["Vé tự động"] },
  { id: 10, name: "Bình Thái", zone: "Trên cao", district: "Thủ Đức", lat: 10.8225, lng: 106.7702, facilities: ["Vé tự động", "Kết nối xe buýt 168"] },
  { id: 11, name: "Thủ Đức", zone: "Trên cao", district: "Thủ Đức", lat: 10.8312, lng: 106.7720, facilities: ["Vé tự động", "Bãi giữ xe", "Trung tâm thương mại"] },
  { id: 12, name: "Khu Công nghệ cao", zone: "Trên cao", district: "Thủ Đức", lat: 10.8412, lng: 106.7878, facilities: ["Vé tự động"] },
  { id: 13, name: "Đại học Quốc gia", zone: "Trên cao", district: "Thủ Đức", lat: 10.8705, lng: 106.8022, facilities: ["Vé tự động", "Kết nối xe buýt 166", "Bãi giữ xe"] },
  { id: 14, name: "Bến xe Suối Tiên", zone: "Trên cao", district: "Thủ Đức", lat: 10.8782, lng: 106.8068, facilities: ["Vé tự động", "Kết nối Bến xe Miền Đông mới", "Bãi giữ xe lớn"] },
];

// Bậc giá theo số ga đi qua (mô phỏng giá vé lượt thực tế 7.000–20.000đ)
function fareByDistance(fromId, toId) {
  const n = Math.abs(toId - fromId);
  if (n === 0) return 0;
  if (n <= 2) return 7000;
  if (n <= 4) return 9000;
  if (n <= 6) return 12000;
  if (n <= 9) return 15000;
  if (n <= 11) return 17000;
  return 20000;
}

const TICKET_PRICES = {
  luot_min: 7000,
  luot_max: 20000,
  ngay: 40000,
  ba_ngay: 90000,
  thang: 300000,
  thang_hssv: 150000,
};

const PROMOTIONS = [
  { id: "P1", name: "Giảm giá HSSV", desc: "Giảm 50% vé tháng cho học sinh, sinh viên có thẻ xác thực", active: true },
  { id: "P2", name: "Miễn phí người cao tuổi", desc: "Miễn phí 100% cho người từ 60 tuổi trở lên", active: true },
  { id: "P3", name: "Miễn phí trẻ em dưới 6 tuổi", desc: "Trẻ em dưới 6 tuổi đi kèm người lớn được miễn phí", active: true },
  { id: "P4", name: "Ưu đãi giờ thấp điểm", desc: "Giảm 20% vé lượt ngoài giờ cao điểm (9h-16h)", active: true },
  { id: "P5", name: "Khuyến mãi lễ 30/4 - 1/5", desc: "Giảm 30% toàn bộ vé lượt trong 2 ngày lễ", active: false },
];

function seedDefault() {
  return {
    users: [
      { id: "U1", role: "khach_hang", name: "Nguyễn Văn An", email: "an.nguyen@gmail.com", phone: "0901234567", password: "123456", type: "Phổ thông", wallet: 250000, createdAt: "2026-01-10" },
      { id: "U2", role: "khach_hang", name: "Trần Thị Bích", email: "bich.tran@gmail.com", phone: "0907654321", password: "123456", type: "Sinh viên", wallet: 50000, createdAt: "2026-02-15" },
      { id: "S1", role: "nhan_vien", name: "Võ Tấn Phát", email: "phat.vo@hurc1.vn", phone: "0911111111", password: "123456", position: "Nhân viên bán vé", station: "Bến Thành" },
      { id: "S2", role: "nhan_vien", name: "Hồ Thị Thúy Ngân", email: "ngan.ho@hurc1.vn", phone: "0922222222", password: "123456", position: "Nhân viên kiểm vé", station: "Suối Tiên" },
      { id: "A1", role: "quan_ly", name: "Ngô Quang Hào", email: "hao.ngo@hurc1.vn", phone: "0933333333", password: "123456", position: "Quản lý vận hành" },
      { id: "A2", role: "quan_ly", name: "Lê Văn Long", email: "long.le@hurc1.vn", phone: "0944444444", password: "123456", position: "Quản trị viên hệ thống" },
    ],
    tickets: [
      { id: "TK1001", userId: "U1", type: "Vé lượt", from: "Bến Thành", to: "Suối Tiên", price: 20000, status: "Đã dùng", date: "2026-06-20", qr: "TK1001-QR" },
      { id: "TK1002", userId: "U1", type: "Vé tháng", from: "-", to: "-", price: 300000, status: "Còn hiệu lực", date: "2026-06-01", expiry: "2026-07-01", qr: "TK1002-QR" },
      { id: "TK1003", userId: "U2", type: "Vé tháng HSSV", from: "-", to: "-", price: 150000, status: "Còn hiệu lực", date: "2026-06-05", expiry: "2026-07-05", qr: "TK1003-QR" },
    ],
    transactions: [
      { id: "GD5001", userId: "U1", ticketId: "TK1001", amount: 20000, method: "Ví MoMo", status: "Thành công", date: "2026-06-20 08:12" },
      { id: "GD5002", userId: "U1", ticketId: "TK1002", amount: 300000, method: "Thẻ ngân hàng", status: "Thành công", date: "2026-06-01 19:45" },
      { id: "GD5003", userId: "U2", ticketId: "TK1003", amount: 150000, method: "Ví MoMo", status: "Thành công", date: "2026-06-05 10:02" },
    ],
    feedback: [
      { id: "FB1", userId: "U1", subject: "Tàu chạy đúng giờ", message: "Trải nghiệm rất tốt, tàu sạch và đúng giờ.", rating: 5, date: "2026-06-21", status: "Đã xem" },
    ],
    lostFound: [
      { id: "LF1", userId: "U2", item: "Ví da màu nâu", station: "Bến Thành", date: "2026-06-18", status: "Đang xử lý" },
    ],
    notifications: [
      { id: "N1", title: "Bảo trì ga Văn Thánh", message: "Ga Văn Thánh tạm đóng cửa ra vào lúc 22h-23h ngày 28/6 để bảo trì.", date: "2026-06-25", read: false },
      { id: "N2", title: "Khuyến mãi giờ thấp điểm", message: "Giảm 20% vé lượt khung giờ 9h-16h hàng ngày.", date: "2026-06-24", read: false },
    ],
    shifts: [
      { id: "SH1", userId: "S1", date: "2026-06-26", time: "06:00 - 14:00", station: "Bến Thành", ticketsSold: 142, revenue: 1820000 },
      { id: "SH2", userId: "S2", date: "2026-06-26", time: "14:00 - 22:00", station: "Suối Tiên", ticketsSold: 0, revenue: 0 },
    ],
    stations: STATIONS,
    promotions: PROMOTIONS,
    settings: { lang: "vi", maintenance: [] },
  };
}

function load() {
  const raw = localStorage.getItem(DB_KEY);
  if (!raw) {
    const seeded = seedDefault();
    localStorage.setItem(DB_KEY, JSON.stringify(seeded));
    return seeded;
  }
  try { return JSON.parse(raw); } catch (e) { const s = seedDefault(); localStorage.setItem(DB_KEY, JSON.stringify(s)); return s; }
}

function save(data) {
  localStorage.setItem(DB_KEY, JSON.stringify(data));
}

function uid(prefix) {
  return prefix + Math.random().toString(36).slice(2, 8).toUpperCase();
}

const DB = {
  // ---------- AUTH ----------
  findUserByEmail(email) {
    return load().users.find(u => u.email.toLowerCase() === String(email).toLowerCase());
  },
  login(email, password) {
    const u = this.findUserByEmail(email);
    if (!u) return { ok: false, msg: "Email không tồn tại trong hệ thống." };
    if (u.password !== password) return { ok: false, msg: "Sai mật khẩu. Vui lòng thử lại." };
    sessionStorage.setItem("metro_session", JSON.stringify({ id: u.id, role: u.role }));
    return { ok: true, user: u };
  },
  logout() { sessionStorage.removeItem("metro_session"); },
  currentSession() {
    try { return JSON.parse(sessionStorage.getItem("metro_session")); } catch (e) { return null; }
  },
  currentUser() {
    const s = this.currentSession();
    if (!s) return null;
    return load().users.find(u => u.id === s.id) || null;
  },
  register({ name, email, phone, password, type }) {
    const data = load();
    if (this.findUserByEmail(email)) return { ok: false, msg: "Email đã được sử dụng." };
    const newUser = { id: uid("U"), role: "khach_hang", name, email, phone, password, type: type || "Phổ thông", wallet: 0, createdAt: new Date().toISOString().slice(0, 10) };
    data.users.push(newUser);
    save(data);
    return { ok: true, user: newUser };
  },
  updateUser(userId, patch) {
    const data = load();
    const u = data.users.find(x => x.id === userId);
    if (!u) return { ok: false };
    Object.assign(u, patch);
    save(data);
    return { ok: true, user: u };
  },
  deleteUser(userId) {
    const data = load();
    data.users = data.users.filter(u => u.id !== userId);
    save(data);
    return { ok: true };
  },
  allUsers(role) {
    const data = load();
    return role ? data.users.filter(u => u.role === role) : data.users;
  },

  // ---------- STATIONS ----------
  getStations() { return load().stations; },
  getStationByName(name) { return load().stations.find(s => s.name === name); },
  calcFare(fromName, toName) {
    const data = load();
    const a = data.stations.find(s => s.name === fromName);
    const b = data.stations.find(s => s.name === toName);
    if (!a || !b) return 0;
    return fareByDistance(a.id, b.id);
  },
  addStation(station) {
    const data = load();
    station.id = data.stations.length ? Math.max(...data.stations.map(s => s.id)) + 1 : 1;
    data.stations.push(station);
    save(data);
    return station;
  },
  updateStation(id, patch) {
    const data = load();
    const s = data.stations.find(x => x.id === id);
    if (s) Object.assign(s, patch);
    save(data);
    return s;
  },
  deleteStation(id) {
    const data = load();
    data.stations = data.stations.filter(s => s.id !== id);
    save(data);
  },

  // ---------- TICKETS ----------
  getTicketsByUser(userId) { return load().tickets.filter(t => t.userId === userId); },
  getAllTickets() { return load().tickets; },
  buyTicket({ userId, type, from, to, price }) {
    const data = load();
    const ticket = {
      id: uid("TK"), userId, type, from: from || "-", to: to || "-", price,
      status: "Còn hiệu lực", date: new Date().toISOString().slice(0, 10), qr: uid("QR"),
    };
    if (type.includes("tháng")) {
      const d = new Date(); d.setDate(d.getDate() + 30);
      ticket.expiry = d.toISOString().slice(0, 10);
    }
    data.tickets.push(ticket);
    save(data);
    return ticket;
  },
  cancelTicket(ticketId) {
    const data = load();
    const t = data.tickets.find(x => x.id === ticketId);
    if (t) t.status = "Đã hủy";
    save(data);
    return t;
  },
  updateTicket(ticketId, patch) {
    const data = load();
    const t = data.tickets.find(x => x.id === ticketId);
    if (t) Object.assign(t, patch);
    save(data);
    return t;
  },
  verifyTicket(qrCode) {
    const data = load();
    const t = data.tickets.find(x => x.qr === qrCode || x.id === qrCode);
    if (!t) return { ok: false, msg: "Không tìm thấy vé." };
    if (t.status === "Đã hủy" || t.status === "Đã hoàn tiền") return { ok: false, msg: "Vé đã bị hủy hoặc đã hoàn tiền, không còn hiệu lực." };
    if (t.type === "Vé lượt" && t.status === "Đã dùng") return { ok: false, msg: "Vé lượt này đã được sử dụng." };
    if (t.expiry) {
      const today = new Date().toISOString().slice(0, 10);
      if (today > t.expiry) return { ok: false, msg: "Vé đã hết hạn." };
    }
    return { ok: true, ticket: t };
  },

  // ---------- TRANSACTIONS ----------
  getTransactionsByUser(userId) { return load().transactions.filter(t => t.userId === userId); },
  getAllTransactions() { return load().transactions; },
  addTransaction({ userId, ticketId, amount, method }) {
    const data = load();
    const tx = { id: uid("GD"), userId, ticketId, amount, method, status: "Thành công", date: new Date().toLocaleString("vi-VN") };
    data.transactions.push(tx);
    save(data);
    return tx;
  },
  refund(ticketId) {
    const data = load();
    const t = data.tickets.find(x => x.id === ticketId);
    if (!t) return { ok: false };
    t.status = "Đã hoàn tiền";
    save(data);
    return { ok: true };
  },

  // ---------- WALLET ----------
  topUpWallet(userId, amount) {
    const data = load();
    const u = data.users.find(x => x.id === userId);
    if (u) u.wallet = (u.wallet || 0) + amount;
    save(data);
    return u;
  },
  deductWallet(userId, amount) {
    const data = load();
    const u = data.users.find(x => x.id === userId);
    if (!u || (u.wallet || 0) < amount) return { ok: false, msg: "Số dư ví không đủ." };
    u.wallet -= amount;
    save(data);
    return { ok: true, user: u };
  },

  // ---------- PROMOTIONS ----------
  getPromotions() { return load().promotions; },
  addPromotion(p) {
    const data = load();
    p.id = uid("P");
    data.promotions.push(p);
    save(data);
    return p;
  },
  updatePromotion(id, patch) {
    const data = load();
    const p = data.promotions.find(x => x.id === id);
    if (p) Object.assign(p, patch);
    save(data);
    return p;
  },
  deletePromotion(id) {
    const data = load();
    data.promotions = data.promotions.filter(p => p.id !== id);
    save(data);
  },

  // ---------- FEEDBACK ----------
  addFeedback({ userId, subject, message, rating }) {
    const data = load();
    const fb = { id: uid("FB"), userId, subject, message, rating, date: new Date().toISOString().slice(0, 10), status: "Mới" };
    data.feedback.push(fb);
    save(data);
    return fb;
  },
  getFeedback() { return load().feedback; },
  updateFeedbackStatus(id, status) {
    const data = load();
    const fb = data.feedback.find(x => x.id === id);
    if (fb) fb.status = status;
    save(data);
  },

  // ---------- LOST & FOUND ----------
  addLostItem({ userId, item, station }) {
    const data = load();
    const lf = { id: uid("LF"), userId, item, station, date: new Date().toISOString().slice(0, 10), status: "Đang xử lý" };
    data.lostFound.push(lf);
    save(data);
    return lf;
  },
  getLostFound() { return load().lostFound; },
  getLostFoundByUser(userId) { return load().lostFound.filter(l => l.userId === userId); },
  updateLostFoundStatus(id, status) {
    const data = load();
    const lf = data.lostFound.find(x => x.id === id);
    if (lf) lf.status = status;
    save(data);
  },

  // ---------- NOTIFICATIONS ----------
  getNotifications() { return load().notifications; },
  addNotification({ title, message }) {
    const data = load();
    const n = { id: uid("N"), title, message, date: new Date().toISOString().slice(0, 10), read: false };
    data.notifications.unshift(n);
    save(data);
    return n;
  },
  markNotificationRead(id) {
    const data = load();
    const n = data.notifications.find(x => x.id === id);
    if (n) n.read = true;
    save(data);
  },

  // ---------- SHIFTS (Nhân viên) ----------
  getShiftsByUser(userId) { return load().shifts.filter(s => s.userId === userId); },
  getAllShifts() { return load().shifts; },

  // ---------- STATS (Dashboard / Báo cáo) ----------
  getDashboardStats() {
    const data = load();
    const totalRevenue = data.transactions.reduce((sum, t) => sum + (t.status === "Thành công" ? t.amount : 0), 0);
    const totalTickets = data.tickets.length;
    const totalCustomers = data.users.filter(u => u.role === "khach_hang").length;
    const totalStaff = data.users.filter(u => u.role === "nhan_vien").length;
    return { totalRevenue, totalTickets, totalCustomers, totalStaff };
  },

  // ---------- RESET (tiện ích demo) ----------
  resetAll() {
    localStorage.removeItem(DB_KEY);
    load();
  },
};

window.DB = DB;
window.STATIONS = STATIONS;
window.TICKET_PRICES = TICKET_PRICES;
