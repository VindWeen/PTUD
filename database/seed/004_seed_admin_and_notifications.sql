-- ============================================================================
-- Seed Data: 004_seed_admin_and_notifications.sql
-- Description: Nạp dữ liệu đại diện đơn vị, phân công phạm vi và thông báo mẫu
-- Target DB: Microsoft SQL Server
-- ============================================================================

DECLARE @UserIdLecturer INT;
DECLARE @UserIdManager INT;
DECLARE @UserIdAdmin INT;
DECLARE @UserIdOfficer INT;
DECLARE @UnitIdCNTT INT;
DECLARE @RoleIdManager INT;

-- 1. Lấy thông tin ID cần thiết
SELECT @UserIdLecturer = Id FROM Users WHERE Username = 'nguyenvana';
SELECT @UserIdManager = Id FROM Users WHERE Username = 'truongkhoa';
SELECT @UserIdAdmin = Id FROM Users WHERE Username = 'admin';
SELECT @UserIdOfficer = Id FROM Users WHERE Username = 'canbohoso';
SELECT @UnitIdCNTT = Id FROM OrganizationUnits WHERE Code = 'K_CNTT';
SELECT @RoleIdManager = Id FROM Roles WHERE Code = 'MANAGER';

-- 2. Seed Đại diện Đơn vị (UnitRepresentatives)
IF @UserIdLecturer IS NOT NULL AND @UnitIdCNTT IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM UnitRepresentatives WHERE UserId = @UserIdLecturer AND UnitId = @UnitIdCNTT)
    BEGIN
        INSERT INTO UnitRepresentatives (UserId, UnitId, ValidFrom, ValidTo, IsActive, AssignedBy, Notes)
        VALUES (
            @UserIdLecturer, 
            @UnitIdCNTT, 
            '2024-01-01', 
            '2026-12-31', 
            1, 
            @UserIdAdmin, 
            N'Phân công PGS.TS Nguyễn Văn A làm Đại diện kê khai thành tích tập thể Khoa CNTT'
        );
        PRINT N'Đã phân công nguyenvana làm Đại diện đơn vị Khoa CNTT.';
    END
END;

-- 3. Đảm bảo UserUnitScopes cho truongkhoa
IF @UserIdManager IS NOT NULL AND @UnitIdCNTT IS NOT NULL AND @RoleIdManager IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM UserUnitScopes WHERE UserId = @UserIdManager AND UnitId = @UnitIdCNTT)
    BEGIN
        INSERT INTO UserUnitScopes (UserId, RoleId, UnitId, IncludeDescendants, ValidFrom, ValidTo)
        VALUES (@UserIdManager, @RoleIdManager, @UnitIdCNTT, 1, '2024-01-01', '2026-12-31');
        PRINT N'Đã phân công UserUnitScopes cho truongkhoa tại Khoa CNTT.';
    END
END;

-- 4. Seed Thông báo Nội bộ mẫu (Notifications)
IF @UserIdLecturer IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM Notifications WHERE UserId = @UserIdLecturer AND Title LIKE N'%Đại diện%')
    BEGIN
        INSERT INTO Notifications (UserId, Title, Message, Type, RelatedEntityType, ActionUrl, IsRead, CreatedAt)
        VALUES (
            @UserIdLecturer,
            N'Phân công Đại diện Đơn vị',
            N'Bạn đã được Nhà trường phân công làm Đại diện kê khai thành tích tập thể cho Khoa Công nghệ Thông tin (nhiệm kỳ 2024-2026).',
            'INFO',
            'ASSIGNMENT',
            '/achievements',
            0,
            DATEADD(HOUR, -2, SYSUTCDATETIME())
        );
    END;

    IF NOT EXISTS (SELECT 1 FROM Notifications WHERE UserId = @UserIdLecturer AND Title LIKE N'%Xác nhận thành tích%')
    BEGIN
        INSERT INTO Notifications (UserId, Title, Message, Type, RelatedEntityType, ActionUrl, IsRead, CreatedAt)
        VALUES (
            @UserIdLecturer,
            N'Xác nhận thành tích thành công',
            N'Hồ sơ thành tích "Nghiên cứu ứng dụng Deep Learning trong phân loại dữ liệu y tế" của bạn đã được Trưởng khoa xác nhận (VERIFIED).',
            'SUCCESS',
            'ACHIEVEMENT',
            '/achievements',
            0,
            DATEADD(HOUR, -5, SYSUTCDATETIME())
        );
    END;
END;

IF @UserIdManager IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM Notifications WHERE UserId = @UserIdManager AND Title LIKE N'%Hồ sơ mới%')
    BEGIN
        INSERT INTO Notifications (UserId, Title, Message, Type, RelatedEntityType, ActionUrl, IsRead, CreatedAt)
        VALUES (
            @UserIdManager,
            N'Hồ sơ mới cần thẩm định',
            N'Giảng viên Nguyễn Văn A vừa nộp hồ sơ thành tích nghiên cứu khoa học năm học 2023-2024. Vui lòng kiểm tra và thẩm định.',
            'ACTION_REQUIRED',
            'ACHIEVEMENT',
            '/approvals',
            0,
            DATEADD(MINUTE, -30, SYSUTCDATETIME())
        );
    END;
END;

PRINT N'Hoàn thành nạp dữ liệu mẫu Tuần 8!';
