# 🚇 HCMC Metro — Hệ thống bán vé Metro Bến Thành - Suối Tiên

Website demo hệ thống bán vé & quản lý vận hành tuyến Metro số 1 (Bến Thành – Suối Tiên), TP. Hồ Chí Minh. Bao gồm **90 chức năng** chia theo 3 vai trò: **Khách hàng**, **Nhân viên**, **Quản lý/Admin**.

> ⚠️ **Đây là bản demo frontend.** Toàn bộ dữ liệu (tài khoản, vé, giao dịch...) được lưu trong `localStorage` của trình duyệt để giả lập một backend/database thật. Khi đóng trình duyệt ở chế độ ẩn danh hoặc xóa dữ liệu trang, dữ liệu demo sẽ mất. Xem mục **"Nâng cấp lên backend thật"** dưới đây để biết cách kết nối API/database thật sau này.

## 📁 Cấu trúc dự án

```
metro-project/
├── index.html              # Trang đăng nhập / đăng ký / quên mật khẩu (3 vai trò)
├── khach-hang.html          # Giao diện Khách hàng (~55 chức năng)
├── nhan-vien.html           # Giao diện Nhân viên (~13 chức năng)
├── quan-ly.html             # Giao diện Quản lý / Admin (~22 chức năng)
├── assets/
│   ├── css/
│   │   └── style.css        # Design system dùng chung (theme xanh biển)
│   └── js/
│       ├── db.js             # Lớp "database" giả lập qua localStorage
│       ├── app.js             # Hàm tiện ích chung (toast, modal, route guard...)
│       ├── khach-hang.js       # Logic trang Khách hàng
│       ├── nhan-vien.js        # Logic trang Nhân viên
│       └── quan-ly.js           # Logic trang Quản lý
└── README.md
```

## 🔑 Tài khoản demo

| Vai trò | Email | Mật khẩu |
|---|---|---|
| Khách hàng | `an.nguyen@gmail.com` | `123456` |
| Khách hàng (SV) | `bich.tran@gmail.com` | `123456` |
| Nhân viên bán vé | `phat.vo@hurc1.vn` | `123456` |
| Nhân viên kiểm vé | `ngan.ho@hurc1.vn` | `123456` |
| Quản lý vận hành | `hao.ngo@hurc1.vn` | `123456` |
| Quản trị hệ thống | `long.le@hurc1.vn` | `123456` |

Bạn cũng có thể **Đăng ký** tài khoản Khách hàng mới ngay trên trang chủ. Quên mật khẩu dùng mã OTP demo: `000000`.

## 🚀 Cách chạy / deploy

### Chạy thử trên máy (không cần cài gì)
Chỉ cần mở file `index.html` bằng trình duyệt (Chrome/Edge/Firefox). Toàn bộ chạy phía client, không cần server.

> Một số trình duyệt chặn `fetch`/module khi mở file trực tiếp bằng `file://`. Nếu gặp vấn đề, chạy 1 server tĩnh đơn giản:
> ```bash
> python3 -m http.server 8080
> ```
> rồi mở `http://localhost:8080`.

### Đẩy lên GitHub Pages
1. Tạo repo mới trên GitHub, đẩy toàn bộ thư mục này lên.
2. Vào **Settings → Pages**, chọn branch `main`, thư mục `/ (root)`.
3. Sau ~1 phút, trang sẽ có tại `https://<username>.github.io/<repo-name>/`.

## 🗂️ Danh sách 90 chức năng

### A. Khách hàng (chức năng 1–55 gốc + bổ sung)
Đăng nhập/Đăng ký/Quên mật khẩu, Hồ sơ cá nhân, Xác minh HSSV/người cao tuổi, Liên kết CCCD gắn chip, Bảo mật 2FA, Đăng nhập OTP/social, Lịch sử đăng nhập, Xóa tài khoản, Tra cứu tuyến, Danh sách 14 nhà ga, Giờ tàu chạy, Mua vé (lượt/ngày/3 ngày/tháng/nhóm), Áp dụng voucher, Vé của tôi (xem/đổi/hủy/hoàn tiền), Lịch sử giao dịch & hóa đơn, Ví điện tử, Phương thức thanh toán, Khuyến mãi, Thông báo & cài đặt thông báo, Chat hỗ trợ CSKH, Báo lỗi ứng dụng, Đánh giá dịch vụ, Lost & Found, FAQ, Cài đặt ngôn ngữ & hỗ trợ khuyết tật, Reset dữ liệu demo...

### B. Nhân viên
Trang chủ ca làm, Bán vé tại quầy (lượt/ngày/3 ngày, theo đối tượng), Vé bổ sung khi khách đi quá ga, Quét QR/kiểm vé, Lịch phân ca, Báo cáo cuối ca, Chấm công, Xử lý Lost & Found, Hồ sơ cá nhân...

### C. Quản lý / Admin
Dashboard tổng quan (KPI, biểu đồ doanh thu, phân bổ loại vé), Báo cáo doanh thu chi tiết & xuất file, Đối soát thanh toán theo phương thức, Báo cáo hiệu suất nhân sự, Quản lý tuyến & nhà ga (CRUD), Khai báo bảo trì/sự cố, Quản lý khách hàng (CRUD), Quản lý nhân viên (CRUD), Phân ca làm việc, Quản lý khuyến mãi (CRUD + bật/tắt), Quản lý phản hồi khách hàng, Quản lý Lost & Found toàn hệ thống, Gửi thông báo broadcast, Theo dõi báo lỗi, Hồ sơ cá nhân...

## 🔌 Nâng cấp lên backend thật

Toàn bộ logic dữ liệu được gói gọn trong **`assets/js/db.js`** — đây là lớp duy nhất chạm vào `localStorage`. Khi bạn có backend thật (Node.js/PHP/Java/Firebase...), chỉ cần:

1. Giữ nguyên tên các hàm trong object `DB` (ví dụ `DB.login()`, `DB.buyTicket()`, `DB.getStations()`...).
2. Đổi phần thân hàm từ đọc/ghi `localStorage` sang gọi `fetch('/api/...')`.
3. Thêm `async`/`await` vào các hàm đó và vào nơi gọi chúng trong `khach-hang.js`, `nhan-vien.js`, `quan-ly.js`.

Vì toàn bộ giao diện (`.html`) chỉ gọi qua `DB.*`, bạn **không cần sửa lại HTML hay logic hiển thị** — chỉ cần thay "ruột" của `db.js`.

## 🎨 Thiết kế

- Màu chủ đạo: **xanh biển đậm (Deep Transit Blue)** kết hợp ánh ngọc (teal) — lấy cảm hứng từ bản đồ tuyến metro.
- Motif lặp lại: đường line liền mạch với các "ga" là điểm dừng (dot) — dùng trong tra cứu tuyến, progress, divider.
- Font: Manrope (heading) + Inter (body).
- Responsive: sidebar thu gọn thành menu ☰ trên màn hình < 980px.
