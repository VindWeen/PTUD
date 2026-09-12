-- ============================================================================
-- Seed: 003_seed_awards_and_sample_decisions.sql
-- Description: Dữ liệu mẫu danh mục loại khen thưởng, tài khoản Cán bộ hồ sơ,
--              Quyết định khen thưởng và bản ghi khen thưởng mẫu.
-- Target DB: Microsoft SQL Server
-- ============================================================================

-- 1. Nạp danh mục Loại khen thưởng / Danh hiệu thi đua chuẩn
MERGE INTO AwardTypes AS Target
USING (VALUES
    ('LDTT', N'Lao động tiên tiến', 'TITLE', 'UNIVERSITY', 'ALL', N'Danh hiệu thi đua cấp trường hàng năm'),
    ('CSTDKS', N'Chiến sĩ thi đua cơ sở', 'TITLE', 'UNIVERSITY', 'LECTURER', N'Đạt danh hiệu Lao động tiên tiến và có sáng kiến/NCKH'),
    ('CSTDB', N'Chiến sĩ thi đua cấp Bộ', 'TITLE', 'MINISTRY', 'LECTURER', N'Có 3 lần liên tục đạt danh hiệu Chiến sĩ thi đua cơ sở'),
    ('TTLĐXS', N'Tập thể Lao động xuất sắc', 'TITLE', 'MINISTRY', 'ORGANIZATION', N'Tập thể hoàn thành xuất sắc nhiệm vụ và có phong trào thi đua'),
    ('BK_BGD', N'Bằng khen Bộ trưởng Bộ Giáo dục và Đào tạo', 'AWARD', 'MINISTRY', 'ALL', N'Khen thưởng chuyên đề hoặc 2 năm liên tục hoàn thành xuất sắc'),
    ('BK_TTCP', N'Bằng khen Thủ tướng Chính phủ', 'AWARD', 'STATE', 'ALL', N'Khen thưởng cấp quốc gia'),
    ('HCLD3', N'Huân chương Lao động hạng Ba', 'MEDAL', 'STATE', 'ALL', N'Cống hiến đặc biệt xuất sắc cho sự nghiệp giáo dục'),
    ('GIAITHUONG_LHU', N'Giải thưởng Nhà khoa học trẻ xuất sắc LHU', 'AWARD', 'UNIVERSITY', 'LECTURER', N'Giải thưởng tôn vinh giảng viên có công bố quốc tế tiêu biểu')
) AS Source (Code, Name, Category, AwardLevel, ApplicableTo, Description)
ON Target.Code = Source.Code
WHEN NOT MATCHED THEN
    INSERT (Code, Name, Category, AwardLevel, ApplicableTo, Description, IsActive, CreatedAt)
    VALUES (Source.Code, Source.Name, Source.Category, Source.AwardLevel, Source.ApplicableTo, Source.Description, 1, SYSUTCDATETIME());
GO

-- 2. Nạp tài khoản Cán bộ hồ sơ (canbohoso / Officer@123456)
IF NOT EXISTS (SELECT 1 FROM Users WHERE Username = 'canbohoso')
BEGIN
    INSERT INTO Users (Username, Email, PasswordHash, FullName, IsActive, CreatedAt, UpdatedAt)
    VALUES (
        'canbohoso',
        'canbohoso@lhu.edu.vn',
        '$2b$10$qq1HJC7lICuyBtk38sGK4ulcQeYRoChnfnH1C/H.4mFDGMBHt4JT6',
        N'ThS. Nguyễn Thị Cán Bộ Hồ Sơ',
        1,
        SYSUTCDATETIME(),
        SYSUTCDATETIME()
    );

    DECLARE @OfficerUserId INT = (SELECT Id FROM Users WHERE Username = 'canbohoso');
    DECLARE @OfficerRoleId INT = (SELECT Id FROM Roles WHERE Code = 'RecordsOfficer');

    IF @OfficerUserId IS NOT NULL AND @OfficerRoleId IS NOT NULL
    BEGIN
        INSERT INTO UserRoles (UserId, RoleId, AssignedAt)
        VALUES (@OfficerUserId, @OfficerRoleId, SYSUTCDATETIME());
    END;
END;
GO

-- 3. Nạp Quyết định khen thưởng mẫu
DECLARE @AdminId INT = (SELECT TOP 1 Id FROM Users WHERE Username = 'admin');
DECLARE @OfficerId INT = (SELECT TOP 1 Id FROM Users WHERE Username = 'canbohoso');
DECLARE @DecisionId INT;

IF NOT EXISTS (SELECT 1 FROM AwardDecisions WHERE DecisionNumber = N'125/QĐ-ĐHLH')
BEGIN
    INSERT INTO AwardDecisions (DecisionNumber, SignDate, SignerTitle, SignerName, IssuingAuthority, Notes, CreatedBy)
    VALUES (
        N'125/QĐ-ĐHLH',
        '2024-06-25',
        N'Hiệu trưởng',
        N'TS. Lâm Thành Hiển',
        N'Trường Đại học Lạc Hồng',
        N'Quyết định về việc công nhận danh hiệu thi đua và hình thức khen thưởng năm học 2023-2024',
        ISNULL(@OfficerId, @AdminId)
    );
    SET @DecisionId = SCOPE_IDENTITY();

    -- File đính kèm quyết định mẫu
    INSERT INTO AwardDecisionFiles (DecisionId, OriginalFileName, StorageFileName, FilePath, MimeType, FileSizeBytes, FileHash, UploadedBy)
    VALUES (
        @DecisionId,
        '125_QD_DHLH_khen_thuong_2024.pdf',
        'decision_125_signed_sample.pdf',
        'storage/decisions/125_QD_DHLH_khen_thuong_2024.pdf',
        'application/pdf',
        245120,
        'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        ISNULL(@OfficerId, @AdminId)
    );

    -- 4. Bản ghi khen thưởng Cá nhân cho Giảng viên nguyenvana (CSTDKS)
    DECLARE @LecturerId INT = (SELECT TOP 1 l.Id FROM Lecturers l INNER JOIN Users u ON l.UserId = u.Id WHERE u.Username = 'nguyenvana');
    DECLARE @UnitCnttId INT = (SELECT TOP 1 Id FROM OrganizationUnits WHERE Code = 'K_CNTT');
    DECLARE @AwardTypeCstdId INT = (SELECT TOP 1 Id FROM AwardTypes WHERE Code = 'CSTDKS');
    DECLARE @AwardTypeTtlId INT = (SELECT TOP 1 Id FROM AwardTypes WHERE Code = 'TTLĐXS');

    IF @LecturerId IS NOT NULL AND @AwardTypeCstdId IS NOT NULL
    BEGIN
        INSERT INTO AwardRecords (
            LecturerId, OrganizationUnitId, ContextUnitId, AwardTypeId, DecisionId,
            RecognitionYear, Status, RecordedBy, RecordedAt, Notes, CreatedBy
        )
        VALUES (
            @LecturerId, NULL, @UnitCnttId, @AwardTypeCstdId, @DecisionId,
            2024, 'RECORDED', ISNULL(@OfficerId, @AdminId), SYSUTCDATETIME(),
            N'Đạt danh hiệu Chiến sĩ thi đua cấp cơ sở năm học 2023-2024 nhờ thành tích xuất sắc trong NCKH và bài báo Q1.',
            ISNULL(@OfficerId, @AdminId)
        );

        DECLARE @RecId1 INT = SCOPE_IDENTITY();

        -- Ghi nhận lịch sử chuyển trạng thái
        INSERT INTO AwardRecordHistories (AwardRecordId, FromStatus, ToStatus, ActorId, Reason)
        VALUES (
            @RecId1, 'DRAFT', 'RECORDED', ISNULL(@OfficerId, @AdminId),
            N'Nhập và ghi nhận chính thức theo Quyết định số 125/QĐ-ĐHLH ngày 25/06/2024'
        );
    END;

    -- 5. Bản ghi khen thưởng Tập thể cho Khoa CNTT (TTLĐXS) trong cùng quyết định
    IF @UnitCnttId IS NOT NULL AND @AwardTypeTtlId IS NOT NULL
    BEGIN
        INSERT INTO AwardRecords (
            LecturerId, OrganizationUnitId, ContextUnitId, AwardTypeId, DecisionId,
            RecognitionYear, Status, RecordedBy, RecordedAt, Notes, CreatedBy
        )
        VALUES (
            NULL, @UnitCnttId, @UnitCnttId, @AwardTypeTtlId, @DecisionId,
            2024, 'RECORDED', ISNULL(@OfficerId, @AdminId), SYSUTCDATETIME(),
            N'Khoa CNTT đạt danh hiệu Tập thể Lao động Xuất sắc năm học 2023-2024.',
            ISNULL(@OfficerId, @AdminId)
        );

        DECLARE @RecId2 INT = SCOPE_IDENTITY();

        -- Ghi nhận lịch sử chuyển trạng thái
        INSERT INTO AwardRecordHistories (AwardRecordId, FromStatus, ToStatus, ActorId, Reason)
        VALUES (
            @RecId2, 'DRAFT', 'RECORDED', ISNULL(@OfficerId, @AdminId),
            N'Nhập và ghi nhận chính thức cho tập thể theo Quyết định số 125/QĐ-ĐHLH ngày 25/06/2024'
        );
    END;
END;
GO
