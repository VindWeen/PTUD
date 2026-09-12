-- ============================================================================
-- Migration: 001_init_identity_schema.sql
-- Description: Khởi tạo bảng quản lý migration và schema Identity, Organization
-- Target DB: Microsoft SQL Server
-- ============================================================================

-- 1. Bảng quản lý lịch sử migration
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'SchemaMigrations')
BEGIN
    CREATE TABLE SchemaMigrations (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        MigrationName NVARCHAR(255) NOT NULL UNIQUE,
        AppliedAt DATETIME2 DEFAULT SYSUTCDATETIME()
    );
END;
GO

-- 2. Bảng Vai trò (Roles)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Roles')
BEGIN
    CREATE TABLE Roles (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Code NVARCHAR(50) NOT NULL UNIQUE,
        Name NVARCHAR(100) NOT NULL,
        Description NVARCHAR(255) NULL,
        IsActive BIT NOT NULL DEFAULT 1,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
END;
GO

-- 3. Bảng Người dùng (Users)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Users')
BEGIN
    CREATE TABLE Users (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Username NVARCHAR(50) NOT NULL UNIQUE,
        Email NVARCHAR(100) NOT NULL UNIQUE,
        PasswordHash NVARCHAR(255) NOT NULL,
        FullName NVARCHAR(100) NOT NULL,
        AvatarUrl NVARCHAR(255) NULL,
        IsActive BIT NOT NULL DEFAULT 1,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
END;
GO

-- 4. Bảng Gán Vai trò (UserRoles)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'UserRoles')
BEGIN
    CREATE TABLE UserRoles (
        UserId INT NOT NULL,
        RoleId INT NOT NULL,
        AssignedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        PRIMARY KEY (UserId, RoleId),
        CONSTRAINT FK_UserRoles_User FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE,
        CONSTRAINT FK_UserRoles_Role FOREIGN KEY (RoleId) REFERENCES Roles(Id) ON DELETE CASCADE
    );
END;
GO

-- 5. Bảng Refresh Token (RefreshTokens)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'RefreshTokens')
BEGIN
    CREATE TABLE RefreshTokens (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        UserId INT NOT NULL,
        TokenHash NVARCHAR(255) NOT NULL,
        ExpiresAt DATETIME2 NOT NULL,
        RevokedAt DATETIME2 NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_RefreshTokens_User FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE
    );
    CREATE INDEX IX_RefreshTokens_UserId ON RefreshTokens(UserId);
END;
GO

-- 6. Bảng Đơn vị / Cơ cấu tổ chức (OrganizationUnits)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'OrganizationUnits')
BEGIN
    CREATE TABLE OrganizationUnits (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Code NVARCHAR(50) NOT NULL UNIQUE,
        Name NVARCHAR(150) NOT NULL,
        Type NVARCHAR(30) NOT NULL, -- 'FACULTY' (Khoa) hoặc 'DEPARTMENT' (Bộ môn)
        ParentId INT NULL,
        IsActive BIT NOT NULL DEFAULT 1,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_OrgUnits_Parent FOREIGN KEY (ParentId) REFERENCES OrganizationUnits(Id),
        CONSTRAINT CHK_OrgUnits_Type CHECK (Type IN ('FACULTY', 'DEPARTMENT'))
    );
END;
GO

-- 7. Bảng Phân quyền theo Phạm vi Đơn vị (UserUnitScopes)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'UserUnitScopes')
BEGIN
    CREATE TABLE UserUnitScopes (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        UserId INT NOT NULL,
        RoleId INT NOT NULL,
        UnitId INT NOT NULL,
        IncludeDescendants BIT NOT NULL DEFAULT 1,
        ValidFrom DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        ValidTo DATETIME2 NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_UserUnitScopes_User FOREIGN KEY (UserId) REFERENCES Users(Id),
        CONSTRAINT FK_UserUnitScopes_Role FOREIGN KEY (RoleId) REFERENCES Roles(Id),
        CONSTRAINT FK_UserUnitScopes_Unit FOREIGN KEY (UnitId) REFERENCES OrganizationUnits(Id)
    );
    CREATE INDEX IX_UserUnitScopes_Lookup ON UserUnitScopes(UserId, RoleId, UnitId);
END;
GO
