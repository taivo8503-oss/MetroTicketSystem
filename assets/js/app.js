/**
 * app.js — Hàm tiện ích dùng chung toàn site
 * (toast, modal, format tiền/ngày, bảo vệ trang theo vai trò, điều hướng tab)
 */

// ---------- FORMAT ----------
function money(n) {
  return Number(n || 0).toLocaleString("vi-VN") + "đ";
}
function shortId(id) { return id ? id.toString() : ""; }
function initials(name) {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  return (parts[parts.length - 1][0] || "").toUpperCase();
}

// ---------- TOAST ----------
function ensureToastStack() {
  let stack = document.querySelector(".toast-stack");
  if (!stack) {
    stack = document.createElement("div");
    stack.className = "toast-stack";
    document.body.appendChild(stack);
  }
  return stack;
}
function toast(message, type = "default") {
  const stack = ensureToastStack();
  const el = document.createElement("div");
  el.className = "toast " + (type === "ok" ? "ok" : type === "error" ? "error" : "");
  el.textContent = message;
  stack.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

// ---------- MODAL ----------
function openModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.add("open");
}
function closeModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.remove("open");
}
document.addEventListener("click", (e) => {
  if (e.target.classList && e.target.classList.contains("modal-overlay")) {
    e.target.classList.remove("open");
  }
});

// ---------- TAB NAVIGATION (sidebar / pill tabs) ----------
function showTab(tabId, navEl) {
  document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
  const panel = document.getElementById(tabId);
  if (panel) panel.classList.add("active");

  document.querySelectorAll(".nav-item[data-tab]").forEach(n => n.classList.remove("active"));
  if (navEl) navEl.classList.add("active");
  else {
    const matching = document.querySelector(`.nav-item[data-tab="${tabId}"]`);
    if (matching) matching.classList.add("active");
  }

  const topTitle = document.querySelector(".js-page-title");
  const clicked = navEl || document.querySelector(`.nav-item[data-tab="${tabId}"]`);
  if (topTitle && clicked) topTitle.textContent = clicked.dataset.label || clicked.textContent.trim();

  window.scrollTo({ top: 0, behavior: "instant" });
  // Đóng sidebar mobile sau khi chọn
  const sidebar = document.querySelector(".sidebar");
  if (sidebar && window.innerWidth <= 980) sidebar.classList.remove("open");

  try { localStorage.setItem("metro_last_tab_" + location.pathname, tabId); } catch (e) {}
}
function toggleSidebar() {
  const sidebar = document.querySelector(".sidebar");
  if (sidebar) sidebar.classList.toggle("open");
}

// ---------- ROUTE GUARD ----------
function requireRole(expectedRole, loginPage = "index.html") {
  const user = DB.currentUser();
  if (!user || user.role !== expectedRole) {
    window.location.href = loginPage;
    return null;
  }
  return user;
}

function renderUserChip(user) {
  const chip = document.querySelector(".js-user-chip");
  if (!chip || !user) return;
  chip.innerHTML = `
    <div class="avatar">${initials(user.name)}</div>
    <div class="user-chip-text">
      <strong>${user.name}</strong>
      <span>${user.position || user.type || "Khách hàng"}</span>
    </div>
  `;
}

function logoutAndRedirect() {
  DB.logout();
  window.location.href = "index.html";
}

// ---------- INIT DB on load (đảm bảo localStorage đã được seed) ----------
document.addEventListener("DOMContentLoaded", () => {
  DB.allUsers(); // gọi 1 hàm public bất kỳ để trigger seed dữ liệu nếu chưa có
});
