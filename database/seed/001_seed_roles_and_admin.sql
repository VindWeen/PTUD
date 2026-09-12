-- ============================================================================
-- Seed: 001_seed_roles_and_admin.sql
-- Description: Dữ liệu mẫu khởi tạo các Vai trò chuẩn và Tài khoản Admin mặc định
-- Target DB: Microsoft SQL Server
-- ============================================================================

-- 1. Khởi tạo danh mục Vai trò chuẩn theo Blueprint Mục 4
MERGE INTO Roles AS Target
USING (VALUES
    ('Lecturer', N'Giảng viên', N'Tạo và nộp thành tích cá nhân, xem lịch sử'),
    ('UnitRepresentative', N'Đại diện đơn vị', N'Nộp và quản lý thành tích tập thể của đơn vị được giao'),
    ('Manager', N'Cán bộ xác nhận', N'Xem và xác nhận hồ sơ thành tích trong phạm vi được cấp'),
    ('RecordsOfficer', N'Cán bộ hồ sơ', N'Ghi nhận và điều chỉnh khen thưởng có quyết định'),
    ('Admin', N'Quản trị viên', N'Quản lý tài khoản, đơn vị, danh mục, phân công quyền và phạm vi'),
    ('Council', N'Hội đồng xét thưởng', N'Xét duyệt hồ sơ đề nghị khen thưởng (mở rộng)')
) AS Source (Code, Name, Description)
ON Target.Code = Source.Code
WHEN NOT MATCHED THEN
    INSERT (Code, Name, Description, IsActive, CreatedAt)
    VALUES (Source.Code, Source.Name, Source.Description, 1, SYSUTCDATETIME());
GO

-- 2. Khởi tạo tài khoản Admin mặc định (mật khẩu mặc định: Admin@123456)
-- Hash bcrypt của 'Admin@123456': $2b$10$tYoBxi6T7Ya/qFl1ITHmGef57fo8Cdp9Rmjmk4uA5xw2W5/HFuSK6
IF NOT EXISTS (SELECT 1 FROM Users WHERE Username = 'admin')
BEGIN
    INSERT INTO Users (Username, Email, PasswordHash, FullName, IsActive, CreatedAt, UpdatedAt)
    VALUES (
        'admin',
        'admin@lhu.edu.vn',
        '$2b$10$tYoBxi6T7Ya/qFl1ITHmGef57fo8Cdp9Rmjmk4uA5xw2W5/HFuSK6',
        N'Quản trị viên Hệ thống',
        1,
        SYSUTCDATETIME(),
        SYSUTCDATETIME()
    );

    -- Gán vai trò Admin cho tài khoản admin
    DECLARE @AdminUserId INT = (SELECT Id FROM Users WHERE Username = 'admin');
    DECLARE @AdminRoleId INT = (SELECT Id FROM Roles WHERE Code = 'Admin');

    IF @AdminUserId IS NOT NULL AND @AdminRoleId IS NOT NULL
    BEGIN
        INSERT INTO UserRoles (UserId, RoleId, AssignedAt)
        VALUES (@AdminUserId, @AdminRoleId, SYSUTCDATETIME());
    END;
END
ELSE
BEGIN
    UPDATE Users
    SET PasswordHash = '$2b$10$tYoBxi6T7Ya/qFl1ITHmGef57fo8Cdp9Rmjmk4uA5xw2W5/HFuSK6'
    WHERE Username = 'admin';
END;
GO
