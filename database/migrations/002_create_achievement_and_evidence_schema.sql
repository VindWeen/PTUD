-- ============================================================================
-- Migration: 002_create_achievement_and_evidence_schema.sql
-- Description: Khởi tạo bảng Năm học, Giảng viên, Loại thành tích, 
--              Thành tích (XOR cá nhân/tập thể), Minh chứng và Phiên bản file.
-- Target DB: Microsoft SQL Server
-- ============================================================================

-- 1. Bảng Năm học (AcademicYears)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'AcademicYears')
BEGIN
    CREATE TABLE AcademicYears (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Code NVARCHAR(50) NOT NULL UNIQUE, -- '2023-2024'
        Name NVARCHAR(100) NOT NULL,
        StartDate DATE NOT NULL,
        EndDate DATE NOT NULL,
        IsCurrent BIT NOT NULL DEFAULT 0,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
END;
GO

-- 2. Bảng Giảng viên (Lecturers)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Lecturers')
BEGIN
    CREATE TABLE Lecturers (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        UserId INT NOT NULL UNIQUE,
        StaffCode NVARCHAR(50) NOT NULL UNIQUE,
        AcademicTitle NVARCHAR(50) NULL, -- 'Phó Giáo sư', 'Giáo sư'
        AcademicDegree NVARCHAR(50) NULL, -- 'Tiến sĩ', 'Thạc sĩ'
        Position NVARCHAR(100) NULL,      -- 'Trưởng bộ môn', 'Giảng viên'
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_Lecturers_User FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE
    );
    CREATE INDEX IX_Lecturers_StaffCode ON Lecturers(StaffCode);
END;
GO

-- 3. Bảng Phân công Giảng viên (LecturerAssignments)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'LecturerAssignments')
BEGIN
    CREATE TABLE LecturerAssignments (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        LecturerId INT NOT NULL,
        UnitId INT NOT NULL,
        ValidFrom DATE NOT NULL,
        ValidTo DATE NULL,
        IsPrimary BIT NOT NULL DEFAULT 1,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_LecturerAssignments_Lecturer FOREIGN KEY (LecturerId) REFERENCES Lecturers(Id),
        CONSTRAINT FK_LecturerAssignments_Unit FOREIGN KEY (UnitId) REFERENCES OrganizationUnits(Id)
    );
    CREATE INDEX IX_LecturerAssignments_Lookup ON LecturerAssignments(LecturerId, UnitId);
END;
GO

-- 4. Bảng Danh mục Loại thành tích (AchievementTypes)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'AchievementTypes')
BEGIN
    CREATE TABLE AchievementTypes (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Code NVARCHAR(50) NOT NULL UNIQUE,
        Name NVARCHAR(150) NOT NULL,
        Category NVARCHAR(50) NOT NULL, -- 'RESEARCH', 'TEACHING', 'AWARD', 'OTHER'
        Description NVARCHAR(255) NULL,
        IsActive BIT NOT NULL DEFAULT 1,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
END;
GO

-- 5. Bảng Hồ sơ Thành tích (Achievements)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Achievements')
BEGIN
    CREATE TABLE Achievements (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        LecturerId INT NULL,
        OrganizationUnitId INT NULL,
        ContextUnitId INT NOT NULL,
        AchievementTypeId INT NOT NULL,
        Title NVARCHAR(255) NOT NULL,
        Description NVARCHAR(MAX) NULL,
        StartDate DATE NULL,
        EndDate DATE NULL,
        RecognitionYear INT NOT NULL,
        AcademicYearId INT NULL,
        Status NVARCHAR(30) NOT NULL DEFAULT 'DRAFT',
        CreatedBy INT NOT NULL,
        SubmittedBy INT NULL,
        ReplacesAchievementId INT NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        RowVersion ROWVERSION NOT NULL,
        
        -- Ràng buộc quan hệ ngoại
        CONSTRAINT FK_Achievements_Lecturer FOREIGN KEY (LecturerId) REFERENCES Lecturers(Id),
        CONSTRAINT FK_Achievements_OrgUnit FOREIGN KEY (OrganizationUnitId) REFERENCES OrganizationUnits(Id),
        CONSTRAINT FK_Achievements_ContextUnit FOREIGN KEY (ContextUnitId) REFERENCES OrganizationUnits(Id),
        CONSTRAINT FK_Achievements_Type FOREIGN KEY (AchievementTypeId) REFERENCES AchievementTypes(Id),
        CONSTRAINT FK_Achievements_AcademicYear FOREIGN KEY (AcademicYearId) REFERENCES AcademicYears(Id),
        CONSTRAINT FK_Achievements_CreatedBy FOREIGN KEY (CreatedBy) REFERENCES Users(Id),
        CONSTRAINT FK_Achievements_SubmittedBy FOREIGN KEY (SubmittedBy) REFERENCES Users(Id),
        CONSTRAINT FK_Achievements_Replaces FOREIGN KEY (ReplacesAchievementId) REFERENCES Achievements(Id),

        -- RÀNG BUỘC CỐT LÕI (Mục 6 Blueprint): Chủ thể XOR (Cá nhân HOẶC Tập thể)
        CONSTRAINT CHK_Achievements_Owner CHECK (
            (LecturerId IS NOT NULL AND OrganizationUnitId IS NULL) OR 
            (LecturerId IS NULL AND OrganizationUnitId IS NOT NULL)
        ),
        
        -- Ràng buộc trạng thái chuẩn
        CONSTRAINT CHK_Achievements_Status CHECK (
            Status IN ('DRAFT', 'SUBMITTED', 'NEED_CORRECTION', 'VERIFIED', 'REJECTED', 'CANCELLED', 'REVOKED')
        )
    );

    CREATE INDEX IX_Achievements_LecturerId ON Achievements(LecturerId);
    CREATE INDEX IX_Achievements_OrgUnitId ON Achievements(OrganizationUnitId);
    CREATE INDEX IX_Achievements_ContextUnitId ON Achievements(ContextUnitId);
    CREATE INDEX IX_Achievements_Year_Status ON Achievements(RecognitionYear, Status);
END;
GO

-- 6. Bảng Minh chứng (Evidences)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Evidences')
BEGIN
    CREATE TABLE Evidences (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        AchievementId INT NOT NULL,
        Name NVARCHAR(255) NOT NULL,
        Description NVARCHAR(MAX) NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_Evidences_Achievement FOREIGN KEY (AchievementId) REFERENCES Achievements(Id) ON DELETE CASCADE
    );
    CREATE INDEX IX_Evidences_AchievementId ON Evidences(AchievementId);
END;
GO

-- 7. Bảng Phiên bản File Minh chứng bất biến (EvidenceFiles)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'EvidenceFiles')
BEGIN
    CREATE TABLE EvidenceFiles (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        EvidenceId INT NOT NULL,
        VersionNo INT NOT NULL DEFAULT 1,
        OriginalFileName NVARCHAR(255) NOT NULL,
        StorageFileName NVARCHAR(255) NOT NULL UNIQUE,
        FilePath NVARCHAR(500) NOT NULL,
        MimeType NVARCHAR(100) NOT NULL,
        FileSizeBytes BIGINT NOT NULL,
        FileHash NVARCHAR(64) NOT NULL, -- SHA256
        UploadedBy INT NOT NULL,
        UploadedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_EvidenceFiles_Evidence FOREIGN KEY (EvidenceId) REFERENCES Evidences(Id) ON DELETE CASCADE,
        CONSTRAINT FK_EvidenceFiles_User FOREIGN KEY (UploadedBy) REFERENCES Users(Id),
        CONSTRAINT UQ_EvidenceFiles_Version UNIQUE (EvidenceId, VersionNo)
    );
    CREATE INDEX IX_EvidenceFiles_EvidenceId ON EvidenceFiles(EvidenceId);
END;
GO

-- 8. Bảng Lần gửi Snapshot (AchievementSubmissions)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'AchievementSubmissions')
BEGIN
    CREATE TABLE AchievementSubmissions (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        AchievementId INT NOT NULL,
        RevisionNo INT NOT NULL,
        SnapshotJson NVARCHAR(MAX) NOT NULL,
        SubmittedBy INT NOT NULL,
        SubmittedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_Submissions_Achievement FOREIGN KEY (AchievementId) REFERENCES Achievements(Id),
        CONSTRAINT FK_Submissions_User FOREIGN KEY (SubmittedBy) REFERENCES Users(Id),
        CONSTRAINT UQ_Submissions_Revision UNIQUE (AchievementId, RevisionNo)
    );
END;
GO

-- 9. Bảng Nối Lần gửi với File Minh chứng cụ thể (SubmissionEvidenceFiles)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'SubmissionEvidenceFiles')
BEGIN
    CREATE TABLE SubmissionEvidenceFiles (
        SubmissionId INT NOT NULL,
        EvidenceFileId INT NOT NULL,
        PRIMARY KEY (SubmissionId, EvidenceFileId),
        CONSTRAINT FK_SubEv_Submission FOREIGN KEY (SubmissionId) REFERENCES AchievementSubmissions(Id),
        CONSTRAINT FK_SubEv_File FOREIGN KEY (EvidenceFileId) REFERENCES EvidenceFiles(Id)
    );
END;
GO

-- 10. Bảng Lịch sử Trạng thái (AchievementStatusHistories)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'AchievementStatusHistories')
BEGIN
    CREATE TABLE AchievementStatusHistories (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        AchievementId INT NOT NULL,
        SubmissionId INT NULL,
        FromStatus NVARCHAR(30) NULL,
        ToStatus NVARCHAR(30) NOT NULL,
        ActorId INT NOT NULL,
        Reason NVARCHAR(MAX) NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_Histories_Achievement FOREIGN KEY (AchievementId) REFERENCES Achievements(Id),
        CONSTRAINT FK_Histories_Submission FOREIGN KEY (SubmissionId) REFERENCES AchievementSubmissions(Id),
        CONSTRAINT FK_Histories_Actor FOREIGN KEY (ActorId) REFERENCES Users(Id)
    );
    CREATE INDEX IX_Histories_AchievementId ON AchievementStatusHistories(AchievementId);
END;
GO
