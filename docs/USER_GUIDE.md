# HƯỚNG DẪN SỬ DỤNG HỆ THỐNG QUẢN LÝ HỒ SƠ THÀNH TÍCH SỐ & KHEN THƯỞNG LHU
**Trường Đại học Lạc Hồng (LHU)**  
**Dành cho các vai trò**: Quản trị viên (Admin), Trưởng đơn vị (Manager), Giảng viên (Lecturer), Cán bộ hồ sơ (RecordsOfficer), Đại diện đơn vị (UnitRepresentative).

---

## 1. Giới thiệu Tổng quan

Hệ thống Quản lý Hồ sơ Thành tích Số và Hỗ trợ Xét duyệt Khen thưởng Thông minh (LHU Digital Achievement & Award Management System) là nền tảng quản trị số khép kín, phục vụ:
- Số hóa toàn bộ hồ sơ thành tích khoa học, giảng dạy và cống hiến của cá nhân và tập thể đơn vị.
- Chu trình thẩm định, xét duyệt đa cấp minh bạch, toàn vẹn với mã băm SHA-256 bất biến và lịch sử thay đổi Snapshot.
- Quản lý sổ khen thưởng, quyết định ban hành và chống trùng lặp khen thưởng theo quy chuẩn thi đua khen thưởng đại học.
- Phân tích số liệu và trích xuất báo cáo phân cấp thời gian thực phục vụ công tác kiểm định chất lượng giáo dục.

---

## 2. Hướng dẫn dành cho Giảng viên (Lecturer)

### 2.1. Đăng nhập & Quản lý Thông tin Cá nhân
1. Truy cập vào trang web hệ thống: `http://localhost:5173`.
2. Nhập tên đăng nhập (ví dụ: `nguyenvana`) và mật khẩu, nhấn **"Đăng nhập"**.
3. Tại trang **"Hồ sơ cá nhân"** (`/profile`):
   - Kiểm tra mã cán bộ, học hàm, học vị, đơn vị công tác chính.
   - Xem tính năng **AI Dự báo Thi đua Khen thưởng**: Hệ thống tự động phân tích hồ sơ thành tích hiện có và đưa ra dự báo xác suất đạt danh hiệu thi đua (Chiến sĩ thi đua cơ sở, Giảng viên tiêu biểu...).

### 2.2. Kê khai Thành tích Cá nhân
1. Vào mục **"Thành tích"** -> Nhấn nút **"+ Kê khai thành tích"**.
2. Chọn hình thức **"Cá nhân"**.
3. Điền thông tin công trình:
   - **Tên thành tích**: Tiêu đề bài báo, đề tài nghiên cứu hoặc giải thưởng.
   - **Danh mục / Loại thành tích**: Bài báo quốc tế, Bài báo trong nước, Đề tài NCKH các cấp, Giáo trình - Sách, Sáng kiến cải tiến...
   - **Năm công nhận**: Năm nghiệm thu hoặc công bố chính thức.
   - **Mô tả / Tóm tắt**: Tóm tắt nội dung đóng góp khoa học.
4. Nhấn **"Lưu bản nháp"** (Hồ sơ ở trạng thái `DRAFT`).

### 2.3. Tải Minh chứng Số & Nộp Hồ sơ Xét duyệt
1. Nhấn vào tên hồ sơ vừa tạo trong bảng danh sách để mở chi tiết.
2. Tại khối **"Minh chứng kèm theo"**, tải lên file scan (PDF, PNG, JPG) của quyết định, chứng nhận hoặc bài báo.
   - *Lưu ý*: Hệ thống tự động mã hóa SHA-256 để bảo chứng tính toàn vẹn của file.
3. Khi đã có ít nhất 1 minh chứng hợp lệ, nhấn nút **"Nộp hồ sơ xét duyệt"**.
4. Trạng thái chuyển sang `SUBMITTED` (Chờ xét duyệt).

### 2.4. Xử lý Yêu cầu Bổ sung từ Trưởng Đơn vị
1. Nếu hồ sơ cần chỉnh lý, chuông thông báo sẽ hiển thị tin nhắn màu cam từ Trưởng khoa.
2. Trạng thái hồ sơ chuyển thành `NEED_CORRECTION` (Cần bổ sung).
3. Mở hồ sơ, đọc lý do yêu cầu từ Trưởng khoa.
4. Nhấn **"Chỉnh sửa"** để cập nhật thông tin hoặc tải thêm minh chứng.
5. Nhấn **"Nộp lại hồ sơ"**. Hệ thống sẽ tự động tăng số phiên bản `Revision` và gửi lại vào hàng chờ của Trưởng khoa.

---

## 3. Hướng dẫn dành cho Đại diện Đơn vị (UnitRepresentative)

### 3.1. Phân công & Phạm vi Ủy quyền (Rule 2)
- Giảng viên được bổ nhiệm làm Đại diện Đơn vị (Bộ môn hoặc Khoa) sẽ có quyền thay mặt tập thể kê khai thành tích tập thể.
- Quyền kê khai chỉ có hiệu lực trong phạm vi đơn vị được giao và trong khoảng thời gian phân công còn hiệu lực.

### 3.2. Kê khai Thành tích Tập thể cho Đơn vị
1. Vào mục **"Thành tích"** -> Nhấn **"+ Kê khai thành tích"**.
2. Chọn hình thức: **"Tập thể Đơn vị"**.
3. Chọn đơn vị đại diện trong danh sách được phân quyền.
4. Điền tên thành tích tập thể, loại thành tích và tải minh chứng tương tự như cá nhân.
5. Hồ sơ tập thể tuân thủ nghiêm ngặt quy tắc XOR (chỉ gắn với Đơn vị, không gắn với bất kỳ cá nhân nào).

---

## 4. Hướng dẫn dành cho Trưởng Đơn vị / Manager (Trưởng khoa, Trưởng bộ môn)

### 4.1. Hàng chờ Xét duyệt trong Phạm vi (Scopes)
1. Đăng nhập tài khoản Manager (ví dụ: `truongkhoa`).
2. Vào menu **"Xét duyệt"** -> Tab **"Chờ xét duyệt"** (`/approvals`).
3. Danh sách chỉ hiển thị các hồ sơ nộp từ các giảng viên hoặc tập thể trực thuộc phạm vi quản lý của đơn vị mình.
   - *Nguyên tắc Chống tự duyệt*: Quản lý không thể tự duyệt hồ sơ thành tích của chính mình.

### 4.2. Thẩm định & Thao tác Phê duyệt
- **Xác nhận phê duyệt (VERIFIED)**: Khi minh chứng đầy đủ và hợp lệ -> Nhấn **"Phê duyệt"**, nhập ghi chú xác nhận. Hồ sơ lập tức chuyển sang trạng thái `VERIFIED` và khóa mọi quyền sửa đổi dữ liệu.
- **Yêu cầu bổ sung (NEED_CORRECTION)**: Khi minh chứng mờ, thiếu quyết định nghiệm thu -> Nhấn **"Yêu cầu bổ sung"**, nhập nội dung giải thích rõ ràng gửi lại giảng viên.
- **Từ chối (REJECTED)**: Hồ sơ vi phạm liêm chính khoa học hoặc không đạt chuẩn -> Nhấn **"Từ chối"**, nhập lý do chính đáng.
- **Thu hồi (REVOKED)**: Nếu phát hiện sai sót sau khi đã phê duyệt -> Mở tab **"Đã xác nhận"**, chọn hồ sơ và nhấn **"Thu hồi"**, ghi rõ lý do hủy kết quả.

---

## 5. Hướng dẫn dành cho Cán bộ Hồ sơ (RecordsOfficer)

### 5.1. Quản lý Văn bản Quyết định Khen thưởng
1. Đăng nhập tài khoản Cán bộ hồ sơ (ví dụ: `canbohoso`).
2. Vào menu **"Sổ Khen thưởng"** -> Tab **"Văn bản Quyết định"**.
3. Nhấn **"+ Thêm quyết định"** để nhập các văn bản quyết định do Hiệu trưởng hoặc Bộ GD&ĐT ban hành:
   - Số quyết định (ví dụ: `105/QĐ-ĐHLH-2024`).
   - Ngày ký ban hành.
   - Cơ quan ban hành, Người ký và Chức danh người ký.
   - Trích yếu / Tóm tắt nội dung khen thưởng.

### 5.2. Ghi nhận Khen thưởng vào Sổ Khen thưởng (AwardRecords)
1. Chuyển sang Tab **"Sổ Khen thưởng"** -> Nhấn **"+ Ghi nhận Khen thưởng"**.
2. Chọn Văn bản quyết định tương ứng.
3. Chọn Loại danh hiệu khen thưởng (Bằng khen, Chiến sĩ thi đua, Lao động tiên tiến...).
4. Chọn Chủ thể:
   - Nếu khen cá nhân: Chọn Giảng viên.
   - Nếu khen tập thể: Chọn Đơn vị.
5. Nhấn **"Lưu bản ghi"**.
   - *Ràng buộc Rule 9 Chống trùng lặp*: Hệ thống tự động kiểm tra xem cá nhân/tập thể đó đã được ghi nhận danh hiệu này trong cùng quyết định hay chưa. Nếu đã có, hệ thống sẽ từ chối để bảo vệ tính toàn vẹn của sổ khen thưởng.

---

## 6. Hướng dẫn dành cho Quản trị viên Hệ thống (Admin)

### 6.1. Quản lý Tài khoản & Phân quyền Người dùng
1. Vào menu **"Quản trị Hệ thống"** (`/admin`) -> Tab **"Người dùng"**.
2. Thêm mới tài khoản, đặt lại mật khẩu, kích hoạt hoặc tạm khóa tài khoản.
3. Phân vai trò hệ thống: `ADMIN`, `MANAGER`, `LECTURER`, `RECORDS_OFFICER`.

### 6.2. Quản trị Cây Đơn vị Tổ chức (OrganizationUnits)
1. Mở Tab **"Cây đơn vị"**.
2. Xem cấu trúc phân cấp hai tầng: Khoa (Faculty) và Bộ môn (Department) trực thuộc.
3. Thêm mới hoặc chỉnh sửa thông tin các đơn vị đào tạo.

### 6.3. Phân quyền Phạm vi Quản lý (UserUnitScopes)
1. Mở Tab **"Phân quyền Phạm vi"**.
2. Phân công một người dùng quản lý (Trưởng khoa) phụ trách đơn vị cụ thể, bật cờ `Kèm đơn vị con (InheritSubUnits)` để áp dụng thẩm quyền xét duyệt cho toàn bộ các bộ môn trực thuộc khoa.

### 6.4. Phân công Đại diện Đơn vị (UnitRepresentatives)
1. Mở Tab **"Đại diện Đơn vị"**.
2. Gán quyền đại diện kê khai thành tích tập thể cho giảng viên theo đơn vị và thời hạn công tác cụ thể.

---

## 7. Khai thác Dashboard & Xuất Báo cáo Thống kê

### 7.1. Dashboard Phân tích Số liệu Thời gian Thực
1. Truy cập menu **"Tổng quan"** (`/dashboard`).
2. Xem tổng hợp chỉ số thành tích và khen thưởng trên toàn bộ dữ liệu 5.000 bản ghi.
3. Sử dụng công tắc chuyển đổi:
   - **Tất cả**: Thống kê tổng hợp toàn diện.
   - **Cá nhân**: Chỉ lọc các công trình do giảng viên cá nhân thực hiện.
   - **Tập thể**: Chỉ lọc các công trình và khen thưởng của đơn vị.
4. Xem biểu đồ cơ cấu theo trạng thái: Đã xác nhận (`VERIFIED`), Chờ duyệt (`SUBMITTED`), Cần bổ sung (`NEED_CORRECTION`), Đã thu hồi (`REVOKED`).

### 7.2. Báo cáo Chi tiết & Trích xuất File CSV An toàn
1. Truy cập menu **"Báo cáo"** (`/reports`).
2. Tab **"Báo cáo Thành tích"**: Lọc theo năm, trạng thái, khoa/bộ môn.
3. Tab **"Báo cáo Khen thưởng"**: Lọc theo năm công nhận, quyết định ban hành, loại danh hiệu.
4. Nhấn nút **"Xuất file CSV"**:
   - Hệ thống kết xuất file `.csv` chuẩn UTF-8 có BOM hiển thị tiếng Việt hoàn hảo trên Excel.
   - Cơ chế bảo mật Rule 11 tự động tiền tố dấu nháy đơn `'` cho các ô có ký tự đặc biệt (`=`, `@`, `+`, `-`) nhằm triệt tiêu hoàn toàn nguy cơ Formula Injection độc hại.
