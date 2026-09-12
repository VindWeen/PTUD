# Database Management & Migrations

Thư mục quản lý lược đồ CSDL Microsoft SQL Server cho dự án PTUD.

## Cấu trúc
```text
database/
├── migrations/       # Các file migration DDL theo thứ tự tăng dần (001, 002...)
├── seed/             # Dữ liệu mẫu khởi tạo ban đầu (danh mục, vai trò, admin)
├── scripts/          # Tool Node.js tự động chạy migration
└── README.md
```

## Quy ước Đặt tên Migration
- `XXX_ten_migration.sql` trong đó `XXX` là 3 chữ số tăng dần (001, 002, 003...).
- Mỗi file migration phải có tính lặp lại an toàn (Idempotent) hoặc kiểm tra sự tồn tại của bảng/cột trước khi thực hiện.
- Mọi thay đổi schema đều phải thông qua migration file, không sửa trực tiếp bằng tay trên DB để đảm bảo môi trường phát triển đồng nhất.

## Chạy Migration
Cấu hình file `.env` ở backend hoặc truyền biến môi trường:
```bash
node database/scripts/migrate.js
```
