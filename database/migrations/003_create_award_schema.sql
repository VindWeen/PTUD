-- ============================================================================
-- Migration: 003_create_award_schema.sql
-- Description: Khởi tạo bảng Danh mục khen thưởng, Quyết định khen thưởng,
--              File quyết định, Bản ghi khen thưởng (XOR chủ thể),
--              Liên kết thành tích căn cứ và Lịch sử trạng thái khen thưởng.
-- Target DB: Microsoft SQL Server
-- ============================================================================

-- 1. Bảng Danh mục Loại khen thưởng / Danh hiệu thi đua (AwardTypes)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'AwardTypes')
BEGIN
    CREATE TABLE AwardTypes (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Code NVARCHAR(50) NOT NULL UNIQUE,       -- 'LDTT', 'CSTDKS', 'BK_BGD', 'HCLD3'
        Name NVARCHAR(150) NOT NULL,             -- 'Lao động tiên tiến', 'Chiến sĩ thi đua cơ sở'...
        Category NVARCHAR(50) NOT NULL,          -- 'TITLE' (Danh hiệu), 'AWARD' (Hình thức), 'MEDAL' (Huân/Huy chương)
        AwardLevel NVARCHAR(50) NOT NULL,        -- 'UNIVERSITY', 'MINISTRY', 'PROVINCE', 'STATE'
        ApplicableTo NVARCHAR(30) NOT NULL DEFAULT 'ALL', -- 'ALL', 'LECTURER', 'ORGANIZATION'
        Description NVARCHAR(255) NULL,
        IsActive BIT NOT NULL DEFAULT 1,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
END;
GO

-- 2. Bảng Văn bản Quyết định Khen thưởng (AwardDecisions)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'AwardDecisions')
BEGIN
    CREATE TABLE AwardDecisions (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        DecisionNumber NVARCHAR(100) NOT NULL UNIQUE, -- '125/QĐ-ĐHLH', '45/QĐ-BGDĐT'
        SignDate DATE NOT NULL,
        SignerTitle NVARCHAR(100) NULL,              -- 'Hiệu trưởng', 'Bộ trưởng'
        SignerName NVARCHAR(100) NULL,               -- 'TS. Lâm Thành Hiển'
        IssuingAuthority NVARCHAR(150) NOT NULL,     -- 'Trường Đại học Lạc Hồng', 'Bộ GD&ĐT'
        Notes NVARCHAR(MAX) NULL,
        CreatedBy INT NOT NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_AwardDecisions_User FOREIGN KEY (CreatedBy) REFERENCES Users(Id)
    );
    CREATE INDEX IX_AwardDecisions_Number ON AwardDecisions(DecisionNumber);
END;
GO

-- 3. Bảng File Văn bản Quyết định Bất biến (AwardDecisionFiles)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'AwardDecisionFiles')
BEGIN
    CREATE TABLE AwardDecisionFiles (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        DecisionId INT NOT NULL,
        OriginalFileName NVARCHAR(255) NOT NULL,
        StorageFileName NVARCHAR(255) NOT NULL UNIQUE,
        FilePath NVARCHAR(500) NOT NULL,
        MimeType NVARCHAR(100) NOT NULL,
        FileSizeBytes BIGINT NOT NULL,
        FileHash NVARCHAR(64) NOT NULL, -- SHA-256
        UploadedBy INT NOT NULL,
        UploadedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_AwardDecisionFiles_Decision FOREIGN KEY (DecisionId) REFERENCES AwardDecisions(Id) ON DELETE CASCADE,
        CONSTRAINT FK_AwardDecisionFiles_User FOREIGN KEY (UploadedBy) REFERENCES Users(Id)
    );
    CREATE INDEX IX_AwardDecisionFiles_DecisionId ON AwardDecisionFiles(DecisionId);
END;
GO

-- 4. Bảng Kết quả Khen thưởng (AwardRecords)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'AwardRecords')
BEGIN
    CREATE TABLE AwardRecords (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        LecturerId INT NULL,
        OrganizationUnitId INT NULL,
        ContextUnitId INT NOT NULL,
        AwardTypeId INT NOT NULL,
        DecisionId INT NOT NULL,
        RecognitionYear INT NOT NULL,
        AcademicYearId INT NULL,
        PeriodStart DATE NULL,
        PeriodEnd DATE NULL,
        Status NVARCHAR(30) NOT NULL DEFAULT 'DRAFT',
        RecordedBy INT NULL,
        RecordedAt DATETIME2 NULL,
        ReplacesAwardRecordId INT NULL,
        Notes NVARCHAR(MAX) NULL,
        CreatedBy INT NOT NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        RowVersion ROWVERSION NOT NULL,

        -- Khóa ngoại
        CONSTRAINT FK_AwardRecords_Lecturer FOREIGN KEY (LecturerId) REFERENCES Lecturers(Id),
        CONSTRAINT FK_AwardRecords_Unit FOREIGN KEY (OrganizationUnitId) REFERENCES OrganizationUnits(Id),
        CONSTRAINT FK_AwardRecords_ContextUnit FOREIGN KEY (ContextUnitId) REFERENCES OrganizationUnits(Id),
        CONSTRAINT FK_AwardRecords_AwardType FOREIGN KEY (AwardTypeId) REFERENCES AwardTypes(Id),
        CONSTRAINT FK_AwardRecords_Decision FOREIGN KEY (DecisionId) REFERENCES AwardDecisions(Id),
        CONSTRAINT FK_AwardRecords_AcademicYear FOREIGN KEY (AcademicYearId) REFERENCES AcademicYears(Id),
        CONSTRAINT FK_AwardRecords_RecordedBy FOREIGN KEY (RecordedBy) REFERENCES Users(Id),
        CONSTRAINT FK_AwardRecords_CreatedBy FOREIGN KEY (CreatedBy) REFERENCES Users(Id),
        CONSTRAINT FK_AwardRecords_Replaces FOREIGN KEY (ReplacesAwardRecordId) REFERENCES AwardRecords(Id),

        -- RÀNG BUỘC CỐT LÕI (Mục 6 Blueprint): Chủ thể XOR (Cá nhân HOẶC Tập thể)
        CONSTRAINT CHK_AwardRecords_Owner CHECK (
            (LecturerId IS NOT NULL AND OrganizationUnitId IS NULL) OR 
            (LecturerId IS NULL AND OrganizationUnitId IS NOT NULL)
        ),

        -- Ràng buộc trạng thái chuẩn
        CONSTRAINT CHK_AwardRecords_Status CHECK (
            Status IN ('DRAFT', 'RECORDED', 'REVOKED')
        )
    );

    -- Chỉ mục tra cứu
    CREATE INDEX IX_AwardRecords_LecturerId ON AwardRecords(LecturerId);
    CREATE INDEX IX_AwardRecords_UnitId ON AwardRecords(OrganizationUnitId);
    CREATE INDEX IX_AwardRecords_ContextUnitId ON AwardRecords(ContextUnitId);
    CREATE INDEX IX_AwardRecords_Year_Status ON AwardRecords(RecognitionYear, Status);
    CREATE INDEX IX_AwardRecords_DecisionId ON AwardRecords(DecisionId);

    -- RÀNG BUỘC BLUEPRINT RULE 9: Chặn trùng chủ thể + loại khen thưởng + quyết định cho trạng thái RECORDED
    CREATE UNIQUE INDEX UQ_AwardRecords_Lecturer_Recorded 
        ON AwardRecords(LecturerId, AwardTypeId, DecisionId) 
        WHERE LecturerId IS NOT NULL AND Status = 'RECORDED';

    CREATE UNIQUE INDEX UQ_AwardRecords_Unit_Recorded 
        ON AwardRecords(OrganizationUnitId, AwardTypeId, DecisionId) 
        WHERE OrganizationUnitId IS NOT NULL AND Status = 'RECORDED';
END;
GO

-- 5. Bảng Liên kết Khen thưởng với Thành tích làm căn cứ (AwardRecordAchievements)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'AwardRecordAchievements')
BEGIN
    CREATE TABLE AwardRecordAchievements (
        AwardRecordId INT NOT NULL,
        AchievementId INT NOT NULL,
        Notes NVARCHAR(255) NULL,
        PRIMARY KEY (AwardRecordId, AchievementId),
        CONSTRAINT FK_AwardRecAch_AwardRecord FOREIGN KEY (AwardRecordId) REFERENCES AwardRecords(Id) ON DELETE CASCADE,
        CONSTRAINT FK_AwardRecAch_Achievement FOREIGN KEY (AchievementId) REFERENCES Achievements(Id)
    );
END;
GO

-- 6. Bảng Lịch sử Trạng thái Khen thưởng (AwardRecordHistories)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'AwardRecordHistories')
BEGIN
    CREATE TABLE AwardRecordHistories (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        AwardRecordId INT NOT NULL,
        FromStatus NVARCHAR(30) NULL,
        ToStatus NVARCHAR(30) NOT NULL,
        ActorId INT NOT NULL,
        Reason NVARCHAR(MAX) NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_AwardHistories_AwardRecord FOREIGN KEY (AwardRecordId) REFERENCES AwardRecords(Id) ON DELETE CASCADE,
        CONSTRAINT FK_AwardHistories_Actor FOREIGN KEY (ActorId) REFERENCES Users(Id)
    );
    CREATE INDEX IX_AwardHistories_AwardRecordId ON AwardRecordHistories(AwardRecordId);
END;
GO
