# KỊCH BẢN DEMO NGHIỆP VỤ HỆ THỐNG QUẢN LÝ HỒ SƠ THÀNH TÍCH SỐ & KHEN THƯỞNG LHU
**Phiên bản nghiệm thu**: Tuần 10 (Đóng tính năng bắt buộc; Dữ liệu demo quy mô lớn 5.000 bản ghi)  
**Tài liệu tham chiếu**: [PROJECT_DEVELOPMENT_BLUEPRINT.md](../PROJECT_DEVELOPMENT_BLUEPRINT.md) (Mục 14.2 & Mục 15)

---

## 1. Danh sách Tài khoản & Phân vai Demo

Hệ thống được thiết lập sẵn các tài khoản demo đại diện cho 5 vai trò nghiệp vụ chủ chốt của Trường Đại học Lạc Hồng:

| STT | Vai trò (Role) | Username | Mật khẩu | Họ và tên | Chức danh / Đơn vị | Ghi chú quyền hạn |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | **Admin** | `admin` | `Admin@123456` | Quản trị viên Hệ thống | Phòng Tổ chức - Cán bộ | Toàn quyền quản trị người dùng, cây đơn vị, phân quyền phạm vi duyệt (Rule 1, 2) |
| 2 | **Manager** (Trưởng khoa) | `truongkhoa` | `Manager@123456` | TS. Trần Văn B | Trưởng Khoa CNTT | Thẩm định hồ sơ thành tích trong phạm vi Khoa CNTT, yêu cầu bổ sung, xác nhận, từ chối, thu hồi |
| 3 | **Lecturer** (Giảng viên) | `nguyenvana` | `User@123456` | PGS.TS. Nguyễn Văn A | Giảng viên Bộ môn CNPM | Kê khai thành tích cá nhân, tải minh chứng số, nộp hồ sơ, điều chỉnh sau phản hồi |
| 4 | **UnitRepresentative** (Đại diện) | `nguyenvana` | `User@123456` | PGS.TS. Nguyễn Văn A | Đại diện Bộ môn CNPM | Được ủy quyền đại diện kê khai thành tích tập thể cho đơn vị (Rule 2) |
| 5 | **RecordsOfficer** (Cán bộ hồ sơ) | `canbohoso` | `Officer@123456` | ThS. Nguyễn Thị Cán Bộ Hồ Sơ | Phòng NCKH & ĐBCL | Ban hành quyết định khen thưởng, ghi vào Sổ khen thưởng, áp dụng Rule 9 chống trùng lặp |

> [!NOTE]
> Ngoài các tài khoản cốt lõi trên, cơ sở dữ liệu đã được nạp sẵn **105 Giảng viên** (`gv_lhu_001` đến `gv_lhu_105`, mật khẩu `User@123456`), **18 Đơn vị** (5 Khoa, 13 Bộ môn) và **5.000 Hồ sơ Thành tích** từ 2020 đến 2024.

---

## 2. Chu trình Nghiệp vụ 9 Bước Khép kín

### Bước 1: Quản trị Hệ thống (Admin)
- **Mục tiêu**: Kiểm tra cấu trúc phân cấp cây đơn vị đào tạo và phân công phạm vi quản lý.
- **Thao tác**:
  1. Đăng nhập tài khoản `admin` / `Admin@123456`.
  2. Truy cập menu **"Quản trị Hệ thống"** -> Tab **"Cây đơn vị"**.
  3. Kiểm tra danh sách Khoa và các Bộ môn trực thuộc (Khoa CNTT gồm BM Công nghệ Phần mềm, BM Mạng máy tính, BM Hệ thống thông tin, BM Trí tuệ nhân tạo).
  4. Chuyển sang Tab **"Phân quyền Phạm vi (Scopes)"**: Xác nhận tài khoản `truongkhoa` được giao phạm vi quản lý Khoa CNTT (`InheritSubUnits = true`).

### Bước 2: Kê khai Thành tích Tập thể (UnitRepresentative - Rule 2)
- **Mục tiêu**: Kiểm tra tính năng kê khai thành tích cho Đơn vị và ràng buộc ủy quyền đại diện.
- **Thao tác**:
  1. Đăng nhập tài khoản `nguyenvana` / `User@123456`.
  2. Truy cập trang **"Hồ sơ Thành tích"** -> Nhấn nút **"+ Kê khai thành tích"**.
  3. Tại mục **"Chủ thể thành tích"**, chọn radio button: **"Tập thể Đơn vị"**.
  4. Danh sách thả xuống sẽ hiển thị đơn vị mà giảng viên được phân công làm đại diện (Bộ môn CNPM).
  5. Điền thông tin:
     - **Tiêu đề**: `Tập thể Lao động Xuất sắc Khối Đào tạo và Nghiên cứu năm 2024`.
     - **Loại thành tích**: Chọn `Đề tài & Công trình NCKH`.
     - **Năm ghi nhận**: `2024`.
  6. Nhấn **"Lưu bản nháp"**.

### Bước 3: Kê khai Thành tích Cá nhân & Tải Minh chứng Số (Lecturer)
- **Mục tiêu**: Kê khai công trình khoa học cá nhân kèm tài liệu minh chứng bảo chứng mã băm SHA-256 (Rule Tuần 4).
- **Thao tác**:
  1. Tại tài khoản `nguyenvana`, nhấn **"+ Kê khai thành tích"** -> Chọn **"Cá nhân"**.
  2. Điền thông tin:
     - **Tiêu đề**: `Nghiên cứu ứng dụng Deep Learning trong phát hiện sớm bất thường trên ảnh X-quang`.
     - **Loại thành tích**: `Bài báo Tạp chí Khoa học Quốc tế (Scopus/WoS)`.
     - **Năm ghi nhận**: `2024`.
  3. Nhấn **"Lưu bản nháp"**.
  4. Mở chi tiết hồ sơ vừa tạo, tại khu vực **"Tài liệu Minh chứng Số"**, nhấn **"Tải lên minh chứng"**.
  5. Chọn một file PDF hoặc hình ảnh giấy chứng nhận. Hệ thống tự động tính toán mã băm SHA-256 bất biến.

### Bước 4: Nộp Hồ sơ Thẩm định (Lecturer)
- **Mục tiêu**: Nộp hồ sơ xét duyệt; kiểm tra ràng buộc bắt buộc minh chứng trước khi nộp.
- **Thao tác**:
  1. Tại chi tiết thành tích, nhấn nút **"Nộp hồ sơ xét duyệt"**.
  2. Xác nhận hộp thoại nộp.
  3. Trạng thái hồ sơ chuyển từ `DRAFT` (Bản nháp) sang `SUBMITTED` (Chờ xét duyệt).
  4. Phiên bản được đánh dấu `Revision No: 1` và tạo Snapshot lần gửi.

### Bước 5: Thẩm định & Yêu cầu Bổ sung (Manager)
- **Mục tiêu**: Trưởng khoa kiểm tra hồ sơ trong hàng chờ và gửi phản hồi yêu cầu bổ sung (Rule Tuần 6).
- **Thao tác**:
  1. Đăng xuất và đăng nhập tài khoản `truongkhoa` / `Manager@123456`.
  2. Truy cập menu **"Xét duyệt Khen thưởng"** -> Tab **"Chờ xét duyệt"**.
  3. Tìm thấy hồ sơ của PGS.TS. Nguyễn Văn A vừa nộp.
  4. Nhấn nút **"Yêu cầu bổ sung"** (Màu cam).
  5. Nhập nội dung: `Đề nghị bổ sung thêm quyết định nghiệm thu đề tài cấp cơ sở có ký duyệt của Hội đồng`.
  6. Nhấn **"Xác nhận gửi yêu cầu"**.
  7. Hồ sơ chuyển sang trạng thái `NEED_CORRECTION` và gửi thông báo chuông tức thời đến Giảng viên.

### Bước 6: Điều chỉnh Hồ sơ & Nộp lại (Lecturer)
- **Mục tiêu**: Giảng viên tiếp nhận yêu cầu, cập nhật minh chứng, nộp lại tăng số Revision (Tuần 6).
- **Thao tác**:
  1. Đăng nhập lại `nguyenvana`. Quan sát **Chuông thông báo** ở góc trên có thông báo mới màu cam.
  2. Mở hồ sơ ở trạng thái `Cần bổ sung`, nhấn nút **"Chỉnh sửa"**.
  3. Bổ sung thêm minh chứng số thứ 2 hoặc cập nhật mô tả giải trình.
  4. Nhấn nút **"Nộp lại hồ sơ"**.
  5. Trạng thái hồ sơ trở về `SUBMITTED`, số phiên bản tăng lên `Revision No: 2`.

### Bước 7: Phê duyệt Chính thức (Manager)
- **Mục tiêu**: Trưởng khoa xác nhận thành tích hợp lệ, khóa dữ liệu bất biến.
- **Thao tác**:
  1. Đăng nhập lại `truongkhoa`. Mở tab **"Chờ xét duyệt"**.
  2. Nhấn vào hồ sơ nộp lại, kiểm tra lịch sử trạng thái (Timeline) hiển thị đầy đủ chu trình: `DRAFT -> SUBMITTED -> NEED_CORRECTION -> SUBMITTED (Rev 2)`.
  3. Nhấn nút **"Xác nhận phê duyệt (VERIFIED)"** (Màu xanh).
  4. Nhập ghi chú thẩm định: `Hồ sơ đầy đủ tính pháp lý và minh chứng đạt chuẩn`.
  5. Nhấn **"Đồng ý phê duyệt"**.
  6. Hồ sơ được đánh dấu `VERIFIED`, chuyển sang Tab **"Đã xác nhận"** và khóa mọi quyền sửa xóa.

### Bước 8: Ban hành Quyết định & Ghi nhận Khen thưởng (RecordsOfficer)
- **Mục tiêu**: Cán bộ hồ sơ ban hành văn bản quyết định và ghi danh vào Sổ Khen thưởng (Rule 9).
- **Thao tác**:
  1. Đăng xuất và đăng nhập `canbohoso` / `Officer@123456`.
  2. Truy cập menu **"Sổ Khen thưởng"** -> Tab **"Văn bản Quyết định"**.
  3. Kiểm tra danh sách quyết định ban hành khen thưởng.
  4. Chuyển sang Tab **"Sổ Khen thưởng"**, nhấn nút **"+ Ghi nhận Khen thưởng"**.
  5. Điền thông tin:
     - Chọn Quyết định: `101/QĐ-ĐHLH-2024`.
     - Loại khen thưởng: `Chiến sĩ Thi đua Cấp Cơ sở`.
     - Chủ thể: Chọn `Cá nhân Giảng viên` -> Chọn `PGS.TS. Nguyễn Văn A`.
     - Năm công nhận: `2024`.
  6. Nhấn **"Lưu vào Sổ Khen thưởng"**.
  7. *Kiểm tra Rule 9 Chống trùng lặp*: Thử ghi nhận lại đúng bộ `(Quyết định, Loại khen thưởng, Giảng viên)` một lần nữa -> Hệ thống từ chối với thông báo chặn trùng lặp rõ ràng.

### Bước 9: Tổng hợp Số liệu & Báo cáo Trích xuất (Admin / Manager)
- **Mục tiêu**: Xem Dashboard thời gian thực trên 5.000 bản ghi, lọc cá nhân/tập thể, xuất báo cáo CSV an toàn.
- **Thao tác**:
  1. Đăng nhập tài khoản `admin` hoặc `truongkhoa`.
  2. Truy cập trang **"Tổng quan (Dashboard)"**:
     - Xem 4 thẻ chỉ số: Tổng thành tích, Đã xác nhận, Tỷ lệ duyệt, Tổng khen thưởng.
     - Kiểm tra biểu đồ phân bổ trạng thái (VERIFIED ~60%, REVOKED ~5% được tách riêng - Ca 11).
     - Bấm chuyển đổi Toggle **"Toàn bộ / Cá nhân / Tập thể"** để thấy số liệu biến thiên độc lập (Ca 7).
  3. Truy cập menu **"Báo cáo & Thống kê"**:
     - Tab **"Báo cáo Thành tích"**: Lọc năm 2024, lọc theo Khoa CNTT.
     - Tab **"Báo cáo Khen thưởng"**: Lọc danh hiệu khen thưởng.
     - Nhấn nút **"Xuất báo cáo CSV"**: Tải về file CSV chuẩn UTF-8 BOM, an toàn chống công kích chèn lệnh bảng tính (Rule 11).

---

## 3. Các Ràng buộc Nghiệp vụ Cốt lõi Cần Nghiệm thu

| STT | Mã Quy tắc | Nội dung Ràng buộc | Kết quả Nghiệm thu |
| :---: | :--- | :--- | :---: |
| 1 | **Rule XOR** | Thành tích/Khen thưởng chỉ thuộc về đúng 1 Cá nhân hoặc 1 Đơn vị | ✅ Đạt (Ràng buộc DB `CHK_Achievements_Owner` & UI Toggle) |
| 2 | **Rule 2** | Đại diện đơn vị chỉ được kê khai trong phạm vi đơn vị được giao | ✅ Đạt (HTTP 403 khi thao tác sai đơn vị đại diện) |
| 3 | **Rule 4** | Bắt buộc đính kèm tối thiểu 1 minh chứng số trước khi nộp hồ sơ | ✅ Đạt (`MIN_EVIDENCE_REQUIRED` chặn nộp khi thiếu minh chứng) |
| 4 | **Rule 6** | Cơ chế RowVersion khóa lạc quan chống ghi đè đồng thời | ✅ Đạt (HTTP 409 khi xung đột phiên bản cập nhật) |
| 5 | **Rule 7** | Độc lập số liệu thống kê giữa Thành tích và Khen thưởng | ✅ Đạt (Hai nguồn dữ liệu và pipeline tổng hợp riêng biệt) |
| 6 | **Rule 8** | Ghi nhận ContextUnitId theo đơn vị công tác thời điểm kê khai | ✅ Đạt (Bảo toàn lịch sử phân bổ đơn vị) |
| 7 | **Rule 9** | Chống trùng lặp khen thưởng trên cùng văn bản quyết định | ✅ Đạt (Filtered Unique Index DB & HTTP 400 chặn trùng) |
| 8 | **Rule 11** | Chống tấn công CSV Injection khi xuất file báo cáo | ✅ Đạt (Tiền tố dấu nháy đơn bảo vệ ký tự `=`, `+`, `-`, `@`) |
| 9 | **SLA Performance** | Tải danh sách phân trang và báo cáo p95 < 2.0 giây trên 5.000 records | ✅ Đạt (Thực tế đạt trung bình < 25ms nhờ chỉ mục tối ưu) |
