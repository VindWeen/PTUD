-- ============================================================================
-- Migration: 004_create_admin_and_notification_schema.sql
-- Description: Khởi tạo bảng Đại diện Đơn vị (UnitRepresentatives), 
--              Thông báo Nội bộ (Notifications), và Nhật ký Kiểm toán (AuditLogs).
-- Target DB: Microsoft SQL Server
-- ============================================================================

-- 1. Bảng Đại diện Đơn vị (UnitRepresentatives)
-- Đại diện được phân công nộp hồ sơ thành tích tập thể cho Khoa/Bộ môn
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'UnitRepresentatives')
BEGIN
    CREATE TABLE UnitRepresentatives (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        UserId INT NOT NULL,
        UnitId INT NOT NULL,
        ValidFrom DATE NOT NULL DEFAULT CAST(SYSUTCDATETIME() AS DATE),
        ValidTo DATE NULL,
        IsActive BIT NOT NULL DEFAULT 1,
        AssignedBy INT NULL,
        Notes NVARCHAR(255) NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_UnitRepresentatives_User FOREIGN KEY (UserId) REFERENCES Users(Id),
        CONSTRAINT FK_UnitRepresentatives_Unit FOREIGN KEY (UnitId) REFERENCES OrganizationUnits(Id),
        CONSTRAINT FK_UnitRepresentatives_AssignedBy FOREIGN KEY (AssignedBy) REFERENCES Users(Id)
    );
    CREATE INDEX IX_UnitRepresentatives_Lookup ON UnitRepresentatives(UserId, UnitId, IsActive);
    CREATE INDEX IX_UnitRepresentatives_Unit ON UnitRepresentatives(UnitId, IsActive);
END;
GO

-- 2. Bảng Thông báo Nội bộ (Notifications)
-- Lưu trữ thông báo gửi cho người dùng khi có sự kiện (Nộp hồ sơ, Duyệt, Bổ sung, Khen thưởng...)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Notifications')
BEGIN
    CREATE TABLE Notifications (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        UserId INT NOT NULL,
        Title NVARCHAR(200) NOT NULL,
        Message NVARCHAR(MAX) NOT NULL,
        Type NVARCHAR(50) NOT NULL DEFAULT 'INFO', -- 'INFO', 'SUCCESS', 'WARNING', 'ACTION_REQUIRED'
        RelatedEntityType NVARCHAR(50) NULL,      -- 'ACHIEVEMENT', 'AWARD', 'ASSIGNMENT', 'SYSTEM'
        RelatedEntityId INT NULL,
        ActionUrl NVARCHAR(255) NULL,
        IsRead BIT NOT NULL DEFAULT 0,
        ReadAt DATETIME2 NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_Notifications_User FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE
    );
    CREATE INDEX IX_Notifications_UserUnread ON Notifications(UserId, IsRead, CreatedAt DESC);
END;
GO

-- 3. Bảng Nhật ký Kiểm toán Quản trị (AuditLogs)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'AuditLogs')
BEGIN
    CREATE TABLE AuditLogs (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        UserId INT NULL,
        Action NVARCHAR(100) NOT NULL,            -- 'USER_CREATE', 'ROLE_ASSIGN', 'SCOPE_ASSIGN', 'REP_ASSIGN', 'UNIT_UPDATE'
        EntityType NVARCHAR(50) NOT NULL,         -- 'USER', 'ROLE', 'UNIT', 'SCOPE', 'REPRESENTATIVE'
        EntityId INT NULL,
        OldValues NVARCHAR(MAX) NULL,
        NewValues NVARCHAR(MAX) NULL,
        IpAddress NVARCHAR(50) NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_AuditLogs_User FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE SET NULL
    );
    CREATE INDEX IX_AuditLogs_Lookup ON AuditLogs(EntityType, EntityId, CreatedAt DESC);
    CREATE INDEX IX_AuditLogs_User ON AuditLogs(UserId, CreatedAt DESC);
END;
GO
