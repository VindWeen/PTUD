# Hệ thống Quản lý Hồ sơ Thành tích Số & Khen thưởng (PTUD)

Dự án thuộc học phần Phát triển Ứng dụng (PTUD) - Đại học Lạc Hồng (LHU).

Chi tiết kiến trúc và kế hoạch triển khai xem tại: [PROJECT_DEVELOPMENT_BLUEPRINT.md](./PROJECT_DEVELOPMENT_BLUEPRINT.md).

---

## Cấu trúc Dự án

Dự án được phân tách thành 2 ứng dụng độc lập hoàn toàn:

```text
PTUD/
├── backend/          # REST API Server (Node.js, Express, MSSQL)
├── frontend/         # Web Application (React, Vite, Tailwind CSS Soft UI)
├── database/         # Database Migrations & Seed Scripts
├── storage/          # Local Private Storage cho Minh chứng/Quyết định
├── docs/             # Tài liệu dự án (SRS, Architecture, API, Test Plan...)
├── Page_Design/      # Thiết kế giao diện mẫu (Soft UI Light/Dark mode)
└── PROJECT_DEVELOPMENT_BLUEPRINT.md
```

---

## Hướng dẫn Khởi chạy (2 Terminal riêng biệt)

### 1. Khởi động Backend (Terminal 1)
```bash
cd backend
npm install           # Cài đặt thư viện (lần đầu)
cp .env.example .env  # Cấu hình chuỗi kết nối MSSQL, JWT Secret
npm run dev           # Khởi chạy chế độ phát triển (nodemon, port 5000)
```
* Khi deploy production:
```bash
cd backend
npm start             # Chạy node server.js
```

### 2. Khởi động Frontend (Terminal 2)
```bash
cd frontend
npm install           # Cài đặt thư viện (lần đầu)
npm run dev           # Khởi chạy Vite dev server (port 5173)
```
* Khi đóng gói deploy:
```bash
cd frontend
npm run build         # Build ra thư mục dist/
```

---

## Thông tin Nhóm & Liên hệ
- Nhóm sinh viên thực hiện: Nhóm 2 người
- Môn học: Phát triển ứng dụng (PTUD)
- Giảng viên hướng dẫn: Đại học Lạc Hồng
