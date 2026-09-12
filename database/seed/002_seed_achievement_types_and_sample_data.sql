-- ============================================================================
-- Seed: 002_seed_achievement_types_and_sample_data.sql
-- Description: Dữ liệu danh mục Năm học, Khoa/Bộ môn, Loại thành tích và Giảng viên mẫu
-- Target DB: Microsoft SQL Server
-- ============================================================================

-- 1. Nạp Năm học chuẩn
MERGE INTO AcademicYears AS Target
USING (VALUES
    ('2023-2024', N'Năm học 2023 - 2024', '2023-09-01', '2024-08-31', 0),
    ('2024-2025', N'Năm học 2024 - 2025', '2024-09-01', '2025-08-31', 1),
    ('2025-2026', N'Năm học 2025 - 2026', '2025-09-01', '2026-08-31', 0)
) AS Source (Code, Name, StartDate, EndDate, IsCurrent)
ON Target.Code = Source.Code
WHEN NOT MATCHED THEN
    INSERT (Code, Name, StartDate, EndDate, IsCurrent, CreatedAt)
    VALUES (Source.Code, Source.Name, Source.StartDate, Source.EndDate, Source.IsCurrent, SYSUTCDATETIME());
GO

-- 2. Nạp Cơ cấu tổ chức: Khoa CNTT và các Bộ môn
MERGE INTO OrganizationUnits AS Target
USING (VALUES
    ('K_CNTT', N'Khoa Công nghệ Thông tin', 'FACULTY', NULL)
) AS Source (Code, Name, Type, ParentId)
ON Target.Code = Source.Code
WHEN NOT MATCHED THEN
    INSERT (Code, Name, Type, ParentId, IsActive, CreatedAt, UpdatedAt)
    VALUES (Source.Code, Source.Name, Source.Type, Source.ParentId, 1, SYSUTCDATETIME(), SYSUTCDATETIME());
GO

DECLARE @KhoaId INT = (SELECT Id FROM OrganizationUnits WHERE Code = 'K_CNTT');

MERGE INTO OrganizationUnits AS Target
USING (VALUES
    ('BM_KTPM', N'Bộ môn Kỹ thuật Phần mềm', 'DEPARTMENT', @KhoaId),
    ('BM_MMT', N'Bộ môn Mạng máy tính & ATTT', 'DEPARTMENT', @KhoaId)
) AS Source (Code, Name, Type, ParentId)
ON Target.Code = Source.Code
WHEN NOT MATCHED THEN
    INSERT (Code, Name, Type, ParentId, IsActive, CreatedAt, UpdatedAt)
    VALUES (Source.Code, Source.Name, Source.Type, Source.ParentId, 1, SYSUTCDATETIME(), SYSUTCDATETIME());
GO

-- 3. Nạp Danh mục Loại thành tích chuẩn
MERGE INTO AchievementTypes AS Target
USING (VALUES
    ('PAPER_Q1', N'Bài báo quốc tế ISI/Scopus Q1', 'RESEARCH', N'Bài báo công bố trên tạp chí nhóm Q1'),
    ('PAPER_Q2', N'Bài báo quốc tế ISI/Scopus Q2', 'RESEARCH', N'Bài báo công bố trên tạp chí nhóm Q2'),
    ('TOPIC_MINISTRY', N'Đề tài NCKH cấp Bộ / Tỉnh', 'RESEARCH', N'Chủ nhiệm hoặc thành viên chính đề tài cấp Bộ'),
    ('TOPIC_INSTITUTION', N'Đề tài NCKH cấp Cơ sở', 'RESEARCH', N'Đề tài NCKH được nghiệm thu cấp Trường'),
    ('PATENT', N'Bằng độc quyền Sáng chế / GPHI', 'RESEARCH', N'Bằng độc quyền sáng chế hoặc giải pháp hữu ích'),
    ('TEXTBOOK', N'Biên soạn Giáo trình đại học', 'TEACHING', N'Giáo trình đã được Hội đồng trường nghiệm thu xuất bản')
) AS Source (Code, Name, Category, Description)
ON Target.Code = Source.Code
WHEN NOT MATCHED THEN
    INSERT (Code, Name, Category, Description, IsActive, CreatedAt)
    VALUES (Source.Code, Source.Name, Source.Category, Source.Description, 1, SYSUTCDATETIME());
GO

-- 4. Tạo tài khoản mẫu Dr. Nguyễn Văn A (Giảng viên)
-- Mật khẩu mặc định: User@123456 -> hash bcrypt: $2b$10$MbBu/o0DGxmc091ofARl1O1MIWnO9vktOoFlAXl.IrCi7HEVmE/p.
IF NOT EXISTS (SELECT 1 FROM Users WHERE Username = 'nguyenvana')
BEGIN
    INSERT INTO Users (Username, Email, PasswordHash, FullName, IsActive, CreatedAt, UpdatedAt)
    VALUES (
        'nguyenvana',
        'nguyenvana@lhu.edu.vn',
        '$2b$10$MbBu/o0DGxmc091ofARl1O1MIWnO9vktOoFlAXl.IrCi7HEVmE/p.',
        N'PGS.TS. Nguyễn Văn A',
        1,
        SYSUTCDATETIME(),
        SYSUTCDATETIME()
    );

    DECLARE @UserId INT = (SELECT Id FROM Users WHERE Username = 'nguyenvana');
    DECLARE @RoleId INT = (SELECT Id FROM Roles WHERE Code = 'Lecturer');
    DECLARE @UnitId INT = (SELECT Id FROM OrganizationUnits WHERE Code = 'BM_KTPM');

    -- Gán vai trò Lecturer
    INSERT INTO UserRoles (UserId, RoleId, AssignedAt)
    VALUES (@UserId, @RoleId, SYSUTCDATETIME());

    -- Tạo hồ sơ Giảng viên
    INSERT INTO Lecturers (UserId, StaffCode, AcademicTitle, AcademicDegree, Position, CreatedAt, UpdatedAt)
    VALUES (@UserId, 'GV001', N'Phó Giáo sư', N'Tiến sĩ', N'Giảng viên chính', SYSUTCDATETIME(), SYSUTCDATETIME());

    DECLARE @LecturerId INT = (SELECT Id FROM Lecturers WHERE StaffCode = 'GV001');

    -- Phân công công tác tại Bộ môn KTPM
    INSERT INTO LecturerAssignments (LecturerId, UnitId, ValidFrom, IsPrimary, CreatedAt)
    VALUES (@LecturerId, @UnitId, '2020-01-01', 1, SYSUTCDATETIME());
END;
GO
