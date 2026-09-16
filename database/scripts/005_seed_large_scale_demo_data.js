/**
 * ============================================================================
 * Script: 005_seed_large_scale_demo_data.js
 * Description: Nạp bộ dữ liệu giả lập quy mô lớn chuẩn Blueprint Tuần 10:
 *              - >= 10 Đơn vị đào tạo (Khoa/Bộ môn)
 *              - >= 100 Giảng viên (Users + Lecturers + LecturerAssignments)
 *              - >= 5.000 Hồ sơ Thành tích (2020-2024, đủ 7 trạng thái, XOR cá nhân/tập thể)
 *              - Minh chứng số, Lịch sử trạng thái, Quyết định và Khen thưởng
 * ============================================================================
 */

const path = require('path');
const fs = require('fs');

// Auto-resolve dependencies from backend/node_modules
const backendNodeModules = path.resolve(__dirname, '../../backend/node_modules');
if (fs.existsSync(backendNodeModules)) {
  module.paths.unshift(backendNodeModules);
}

const bcrypt = require('bcryptjs');
const { getPool, sql } = require('../../backend/src/config/database');

// Danh sách họ, đệm, tên tiếng Việt để sinh họ tên ngẫu nhiên thực tế
const HO = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Lý'];
const DEM = ['Văn', 'Thị', 'Đình', 'Hữu', 'Đức', 'Thành', 'Minh', 'Ngọc', 'Xuân', 'Thanh', 'Quốc', 'Gia', 'Bảo', 'Kim'];
const TEN = ['An', 'Bình', 'Cường', 'Dũng', 'Đạt', 'Giang', 'Hải', 'Huy', 'Khoa', 'Long', 'Minh', 'Nam', 'Nghĩa', 'Phúc', 'Quân', 'Sơn', 'Tài', 'Thắng', 'Trí', 'Trung', 'Tùng', 'Vinh', 'Vũ', 'Yên', 'Hương', 'Lan', 'Linh', 'Mai', 'Ngọc', 'Phương', 'Quỳnh', 'Trang', 'Thảo', 'Uyên', 'Vy'];

const HOC_HAM = ['Giáo sư', 'Phó Giáo sư', null, null, null, null, null];
const HOC_VI = ['Tiến sĩ', 'Thạc sĩ', 'Thạc sĩ', 'Tiến sĩ', 'Kỹ sư'];
const CHUC_VU = ['Giảng viên chính', 'Giảng viên', 'Giảng viên', 'Phó Trưởng bộ môn', 'Nghiên cứu viên'];

// Mẫu tiêu đề thành tích nghiên cứu, giảng dạy, giải thưởng
const RES_PREFIXES = [
  'Nghiên cứu ứng dụng trí tuệ nhân tạo trong',
  'Phát triển thuật toán học sâu tối ưu hóa cho',
  'Thiết kế và chế tạo hệ thống tự động hóa',
  'Phân tích thực nghiệm và đánh giá hiệu năng của',
  'Mô hình toán học dự báo biến đổi trong',
  'Đánh giá hoạt tính sinh học và chiết xuất hợp chất từ',
  'Nghiên cứu giải pháp bảo mật dữ liệu dựa trên Blockchain cho',
  'Xây dựng hệ thống nhúng thông minh giám sát',
  'Ứng dụng thị giác máy tính và IoT trong nông nghiệp công nghệ cao tại',
  'Nghiên cứu tổng hợp vật liệu nano ứng dụng trong'
];

const RES_TOPICS = [
  'chẩn đoán hình ảnh y tế',
  'lưới điện thông minh LHU Smart Grid',
  'robot tự hành trong công nghiệp sản xuất linh kiện',
  'nhận dạng tiếng nói tiếng Việt thời gian thực',
  'xử lý nước thải công nghiệp vùng Đông Nam Bộ',
  'dược liệu quý tại tỉnh Đồng Nai',
  'quản lý chuỗi cung ứng logistics cảng biển',
  'hệ thống điều khiển xe tự hành',
  'phát hiện sớm gian lận giao dịch tài chính số',
  'năng lượng tái tạo và pin mặt trời hiệu suất cao'
];

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateFullName() {
  return `${getRandomItem(HO)} ${getRandomItem(DEM)} ${getRandomItem(TEN)}`;
}

async function run() {
  console.log('🚀 Bắt đầu nạp bộ dữ liệu thử nghiệm quy mô lớn Tuần 10...');
  const pool = await getPool();
  const startTime = Date.now();

  // 1. Kiểm tra và bổ sung Đơn vị Tổ chức (Mục tiêu: >= 10 đơn vị)
  console.log('\n--- 1. Bổ sung Đơn vị Tổ chức (Khoa & Bộ môn) ---');
  const orgUnits = [
    { code: 'K_CNTT', name: 'Khoa Công nghệ Thông tin', type: 'FACULTY', parentCode: null },
    { code: 'K_CDDT', name: 'Khoa Cơ điện - Điện tử', type: 'FACULTY', parentCode: null },
    { code: 'K_DUOC', name: 'Khoa Dược', type: 'FACULTY', parentCode: null },
    { code: 'K_QTKT', name: 'Khoa Quản trị Kinh tế Quốc tế', type: 'FACULTY', parentCode: null },
    { code: 'K_NNA', name: 'Khoa Ngôn ngữ Anh', type: 'FACULTY', parentCode: null },
    // Bộ môn thuộc CNTT
    { code: 'BM_CNPM', name: 'Bộ môn Công nghệ Phần mềm', type: 'DEPARTMENT', parentCode: 'K_CNTT' },
    { code: 'BM_MMT', name: 'Bộ môn Mạng máy tính & An ninh thông tin', type: 'DEPARTMENT', parentCode: 'K_CNTT' },
    { code: 'BM_HTTT', name: 'Bộ môn Hệ thống Thông tin', type: 'DEPARTMENT', parentCode: 'K_CNTT' },
    { code: 'BM_TTNT', name: 'Bộ môn Trí tuệ Nhân tạo', type: 'DEPARTMENT', parentCode: 'K_CNTT' },
    // Bộ môn thuộc Cơ điện - Điện tử
    { code: 'BM_TDH', name: 'Bộ môn Tự động hóa & Robot', type: 'DEPARTMENT', parentCode: 'K_CDDT' },
    { code: 'BM_DTTH', name: 'Bộ môn Điện tử - Viễn thông', type: 'DEPARTMENT', parentCode: 'K_CDDT' },
    // Bộ môn thuộc Dược & Kinh tế
    { code: 'BM_DLS', name: 'Bộ môn Dược lâm sàng', type: 'DEPARTMENT', parentCode: 'K_DUOC' },
    { code: 'BM_QTDN', name: 'Bộ môn Quản trị Doanh nghiệp', type: 'DEPARTMENT', parentCode: 'K_QTKT' },
  ];

  for (const u of orgUnits) {
    const check = await pool.request().input('code', sql.NVarChar(50), u.code).query('SELECT Id FROM OrganizationUnits WHERE Code = @code');
    if (check.recordset.length === 0) {
      let parentId = null;
      if (u.parentCode) {
        const pRes = await pool.request().input('pCode', sql.NVarChar(50), u.parentCode).query('SELECT Id FROM OrganizationUnits WHERE Code = @pCode');
        parentId = pRes.recordset[0]?.Id || null;
      }
      await pool.request()
        .input('code', sql.NVarChar(50), u.code)
        .input('name', sql.NVarChar(150), u.name)
        .input('type', sql.NVarChar(30), u.type)
        .input('parentId', sql.Int, parentId)
        .query('INSERT INTO OrganizationUnits (Code, Name, Type, ParentId) VALUES (@code, @name, @type, @parentId)');
    }
  }

  const allUnitsRes = await pool.request().query('SELECT Id, Code, Name, Type, ParentId FROM OrganizationUnits WHERE IsActive = 1');
  const allUnits = allUnitsRes.recordset;
  const deptUnits = allUnits.filter(u => u.Type === 'DEPARTMENT');
  const facultyUnits = allUnits.filter(u => u.Type === 'FACULTY');
  console.log(`✅ Hiện có tổng cộng ${allUnits.length} Đơn vị tổ chức (${facultyUnits.length} Khoa, ${deptUnits.length} Bộ môn).`);

  // 2. Tạo Giảng viên & Người dùng (Mục tiêu: >= 100 Giảng viên)
  console.log('\n--- 2. Tạo Giảng viên & Người dùng mẫu (Mục tiêu >= 100 GV) ---');
  const currentLecturerCountRes = await pool.request().query('SELECT COUNT(*) AS Cnt FROM Lecturers');
  let currentLecturerCount = currentLecturerCountRes.recordset[0].Cnt;
  const targetLecturers = 105;
  const passwordHash = await bcrypt.hash('User@123456', 10);

  if (currentLecturerCount < targetLecturers) {
    const needed = targetLecturers - currentLecturerCount;
    console.log(`Đang khởi tạo thêm ${needed} Giảng viên...`);

    const roleLecturerId = 2; // Role LECTURER
    for (let i = 1; i <= needed; i++) {
      const gvIndex = currentLecturerCount + i;
      const username = `gv_lhu_${String(gvIndex).padStart(3, '0')}`;
      const email = `${username}@lhu.edu.vn`;
      const fullName = generateFullName();
      const staffCode = `LHU_${String(gvIndex).padStart(4, '0')}`;
      const title = getRandomItem(HOC_HAM);
      const degree = getRandomItem(HOC_VI);
      const position = getRandomItem(CHUC_VU);
      const assignedUnit = getRandomItem(deptUnits.length > 0 ? deptUnits : allUnits);

      // Insert User
      const userRes = await pool.request()
        .input('username', sql.NVarChar(50), username)
        .input('email', sql.NVarChar(100), email)
        .input('pass', sql.NVarChar(255), passwordHash)
        .input('name', sql.NVarChar(100), fullName)
        .query(`
          INSERT INTO Users (Username, Email, PasswordHash, FullName)
          OUTPUT inserted.Id
          VALUES (@username, @email, @pass, @name);
        `);
      const newUserId = userRes.recordset[0].Id;

      // Assign LECTURER Role
      await pool.request()
        .input('uid', sql.Int, newUserId)
        .input('rid', sql.Int, roleLecturerId)
        .query('INSERT INTO UserRoles (UserId, RoleId) VALUES (@uid, @rid)');

      // Insert Lecturer profile
      const lRes = await pool.request()
        .input('uid', sql.Int, newUserId)
        .input('code', sql.NVarChar(50), staffCode)
        .input('title', sql.NVarChar(50), title)
        .input('degree', sql.NVarChar(50), degree)
        .input('pos', sql.NVarChar(100), position)
        .query(`
          INSERT INTO Lecturers (UserId, StaffCode, AcademicTitle, AcademicDegree, Position)
          OUTPUT inserted.Id
          VALUES (@uid, @code, @title, @degree, @pos);
        `);
      const newLecturerId = lRes.recordset[0].Id;

      // Assign Primary Unit
      await pool.request()
        .input('lid', sql.Int, newLecturerId)
        .input('unitId', sql.Int, assignedUnit.Id)
        .input('from', sql.Date, '2020-01-01')
        .query(`
          INSERT INTO LecturerAssignments (LecturerId, UnitId, ValidFrom, IsPrimary)
          VALUES (@lid, @unitId, @from, 1);
        `);
    }
  }

  const allLecturersRes = await pool.request().query(`
    SELECT l.Id AS LecturerId, l.UserId, la.UnitId, u.FullName
    FROM Lecturers l
    JOIN Users u ON l.UserId = u.Id
    LEFT JOIN LecturerAssignments la ON l.Id = la.LecturerId AND la.IsPrimary = 1
  `);
  const allLecturers = allLecturersRes.recordset;
  console.log(`✅ Tổng số Giảng viên hiện có: ${allLecturers.length}`);

  // Phân công một số Đại diện Đơn vị cho các Bộ môn (Rule 2)
  console.log('\n--- 2.1. Phân công Đại diện Đơn vị cho các Bộ môn (Rule 2) ---');
  for (const dept of deptUnits) {
    const checkRep = await pool.request().input('uId', sql.Int, dept.Id).query('SELECT Id FROM UnitRepresentatives WHERE UnitId = @uId AND IsActive = 1');
    if (checkRep.recordset.length === 0) {
      const repLecturer = allLecturers.find(l => l.UnitId === dept.Id) || allLecturers[0];
      if (repLecturer) {
        await pool.request()
          .input('uid', sql.Int, repLecturer.UserId)
          .input('unitId', sql.Int, dept.Id)
          .input('notes', sql.NVarChar(255), 'Phân công đại diện kê khai thành tích tập thể')
          .query(`
            INSERT INTO UnitRepresentatives (UserId, UnitId, ValidFrom, ValidTo, IsActive, Notes)
            VALUES (@uid, @unitId, '2020-01-01', '2026-12-31', 1, @notes);
          `);
      }
    }
  }
  console.log('✅ Đã phân công Đại diện cho tất cả các đơn vị đào tạo.');

  // 3. Sinh 5.000 Hồ sơ Thành tích (Achievements)
  console.log('\n--- 3. Sinh 5.000 Hồ sơ Thành tích (Achievements) ---');
  const currentAchCountRes = await pool.request().query('SELECT COUNT(*) AS Cnt FROM Achievements');
  let currentAchCount = currentAchCountRes.recordset[0].Cnt;
  const targetAchievements = 5000;

  if (currentAchCount < targetAchievements) {
    const needed = targetAchievements - currentAchCount;
    console.log(`Cần tạo thêm ${needed} thành tích. Tiến hành sinh dữ liệu theo khối (Batch Bulk Insert)...`);

    // Lấy các loại thành tích
    const typesRes = await pool.request().query('SELECT Id, Name, Category FROM AchievementTypes WHERE IsActive = 1');
    const achievementTypes = typesRes.recordset;

    const years = [2020, 2021, 2022, 2023, 2024];
    // Phân bổ trạng thái theo tỷ lệ: VERIFIED (60%), SUBMITTED (15%), NEED_CORRECTION (5%), REJECTED (5%), REVOKED (5%), DRAFT (8%), CANCELLED (2%)
    const statusPool = [
      ...Array(60).fill('VERIFIED'),
      ...Array(15).fill('SUBMITTED'),
      ...Array(5).fill('NEED_CORRECTION'),
      ...Array(5).fill('REJECTED'),
      ...Array(5).fill('REVOKED'),
      ...Array(8).fill('DRAFT'),
      ...Array(2).fill('CANCELLED'),
    ];

    const batchSize = 500;
    const totalBatches = Math.ceil(needed / batchSize);

    for (let b = 0; b < totalBatches; b++) {
      const countInBatch = Math.min(batchSize, needed - b * batchSize);
      const rows = [];

      for (let j = 0; j < countInBatch; j++) {
        const achIndex = currentAchCount + b * batchSize + j + 1;
        const isIndividual = Math.random() < 0.85; // 85% cá nhân, 15% tập thể
        const achType = getRandomItem(achievementTypes);
        const year = getRandomItem(years);
        const status = getRandomItem(statusPool);
        const title = `${getRandomItem(RES_PREFIXES)} ${getRandomItem(RES_TOPICS)} (Công trình #${achIndex})`;
        const description = 'Công trình nghiên cứu khoa học và cải tiến công nghệ được thực hiện bởi tập thể giảng viên và nhà nghiên cứu LHU.';

        let lecturerId = null;
        let organizationUnitId = null;
        let contextUnitId = 1;
        let createdBy = 1; // Admin hoặc lecturer

        if (isIndividual) {
          const l = getRandomItem(allLecturers);
          lecturerId = l.LecturerId;
          contextUnitId = l.UnitId || 1;
          createdBy = l.UserId;
        } else {
          const u = getRandomItem(allUnits);
          organizationUnitId = u.Id;
          contextUnitId = u.Id;
          createdBy = 1;
        }

        rows.push({
          lecturerId,
          organizationUnitId,
          contextUnitId,
          typeId: achType.Id,
          title,
          description,
          year,
          status,
          createdBy
        });
      }

      // Tạo câu lệnh SQL bulk insert
      const valuesSql = rows.map((r, idx) => {
        const lId = r.lecturerId ? r.lecturerId : 'NULL';
        const ouId = r.organizationUnitId ? r.organizationUnitId : 'NULL';
        const cleanTitle = r.title.replace(/'/g, "''");
        const cleanDesc = r.description.replace(/'/g, "''");
        return `(${lId}, ${ouId}, ${r.contextUnitId}, ${r.typeId}, N'${cleanTitle}', N'${cleanDesc}', '${r.year}-01-15', '${r.year}-11-30', ${r.year}, '${r.status}', ${r.createdBy})`;
      }).join(',\n');

      await pool.request().query(`
        INSERT INTO Achievements (LecturerId, OrganizationUnitId, ContextUnitId, AchievementTypeId, Title, Description, StartDate, EndDate, RecognitionYear, Status, CreatedBy)
        VALUES ${valuesSql};
      `);

      process.stdout.write(`\rĐã nạp batch ${b + 1}/${totalBatches} (${(b + 1) * batchSize < needed ? (b + 1) * batchSize : needed}/${needed} thành tích)...`);
    }
    console.log('\n✅ Hoàn tất sinh và nạp 5.000 Thành tích!');
  } else {
    console.log(`✅ Đã có sẵn ${currentAchCount} Thành tích (>= 5.000).`);
  }

  // 4. Sinh Quyết định và Sổ Khen thưởng mẫu (Mục tiêu: >= 300 Khen thưởng)
  console.log('\n--- 4. Sinh Quyết định Ban hành & Sổ Khen thưởng (AwardRecords) ---');
  const currentAwardCountRes = await pool.request().query('SELECT COUNT(*) AS Cnt FROM AwardRecords');
  let currentAwardCount = currentAwardCountRes.recordset[0].Cnt;
  const targetAwards = 350;

  if (currentAwardCount < targetAwards) {
    const awardTypesRes = await pool.request().query('SELECT Id, Code, Name FROM AwardTypes WHERE IsActive = 1');
    const awardTypes = awardTypesRes.recordset;

    // Sinh thêm 40 quyết định khen thưởng
    for (let d = 1; d <= 40; d++) {
      const year = 2020 + (d % 5);
      const decNum = `${100 + d}/QĐ-ĐHLH-${year}`;
      const checkDec = await pool.request().input('dNum', sql.NVarChar(50), decNum).query('SELECT Id FROM AwardDecisions WHERE DecisionNumber = @dNum');
      if (checkDec.recordset.length === 0) {
        await pool.request()
          .input('num', sql.NVarChar(50), decNum)
          .input('date', sql.Date, `${year}-11-20`)
          .input('issuer', sql.NVarChar(150), 'Trường Đại học Lạc Hồng')
          .input('title', sql.NVarChar(100), 'Hiệu trưởng')
          .input('signer', sql.NVarChar(100), 'TS. Lâm Thành Hiển')
          .input('notes', sql.NVarChar(sql.MAX), 'Về việc khen thưởng thành tích thi đua xuất sắc năm học')
          .input('by', sql.Int, 1)
          .query(`
            INSERT INTO AwardDecisions (DecisionNumber, SignDate, IssuingAuthority, SignerTitle, SignerName, Notes, CreatedBy)
            VALUES (@num, @date, @issuer, @title, @signer, @notes, @by);
          `);
      }
    }

    const allDecisionsRes = await pool.request().query('SELECT Id, DecisionNumber, YEAR(SignDate) AS Year FROM AwardDecisions');
    const allDecisions = allDecisionsRes.recordset;

    const neededAwards = targetAwards - currentAwardCount;
    console.log(`Đang sinh thêm ${neededAwards} bản ghi Khen thưởng...`);

    let addedAwards = 0;
    for (let a = 0; a < neededAwards; a++) {
      const dec = getRandomItem(allDecisions);
      const at = getRandomItem(awardTypes);
      const isInd = Math.random() < 0.8;
      const status = Math.random() < 0.9 ? 'RECORDED' : 'REVOKED';
      const year = dec.Year || 2024;

      let lId = null;
      let ouId = null;
      let contextUnitId = 1;

      if (isInd) {
        const l = getRandomItem(allLecturers);
        lId = l.LecturerId;
        contextUnitId = l.UnitId || 1;
      } else {
        const u = getRandomItem(allUnits);
        ouId = u.Id;
        contextUnitId = u.Id;
      }

      // Kiểm tra tránh trùng lặp Rule 9
      const dupCheck = await pool.request()
        .input('dId', sql.Int, dec.Id)
        .input('atId', sql.Int, at.Id)
        .input('lId', sql.Int, lId)
        .input('ouId', sql.Int, ouId)
        .query(`
          SELECT Id FROM AwardRecords 
          WHERE DecisionId = @dId AND AwardTypeId = @atId AND Status = 'RECORDED'
            AND (LecturerId = @lId OR (@lId IS NULL AND LecturerId IS NULL))
            AND (OrganizationUnitId = @ouId OR (@ouId IS NULL AND OrganizationUnitId IS NULL))
        `);

      if (dupCheck.recordset.length === 0) {
        await pool.request()
          .input('lId', sql.Int, lId)
          .input('ouId', sql.Int, ouId)
          .input('cUnit', sql.Int, contextUnitId)
          .input('atId', sql.Int, at.Id)
          .input('dId', sql.Int, dec.Id)
          .input('year', sql.Int, year)
          .input('status', sql.NVarChar(30), status)
          .input('recordedBy', sql.Int, 1)
          .input('createdBy', sql.Int, 1)
          .query(`
            INSERT INTO AwardRecords (LecturerId, OrganizationUnitId, ContextUnitId, AwardTypeId, DecisionId, RecognitionYear, Status, RecordedBy, CreatedBy)
            VALUES (@lId, @ouId, @cUnit, @atId, @dId, @year, @status, @recordedBy, @createdBy);
          `);
        addedAwards++;
      }
    }
    console.log(`✅ Đã nạp thành công ${addedAwards} bản ghi Khen thưởng.`);
  }

  // 5. Kiểm tra tổng kết số lượng sau khi nạp
  const finalSummary = await pool.request().query(`
    SELECT 
      (SELECT COUNT(*) FROM Users) AS UsersCount,
      (SELECT COUNT(*) FROM Lecturers) AS LecturersCount,
      (SELECT COUNT(*) FROM OrganizationUnits WHERE IsActive = 1) AS UnitsCount,
      (SELECT COUNT(*) FROM Achievements) AS AchievementsCount,
      (SELECT COUNT(*) FROM Achievements WHERE Status = 'VERIFIED') AS VerifiedAchievementsCount,
      (SELECT COUNT(*) FROM Achievements WHERE Status = 'REVOKED') AS RevokedAchievementsCount,
      (SELECT COUNT(*) FROM AwardDecisions) AS DecisionsCount,
      (SELECT COUNT(*) FROM AwardRecords) AS AwardsCount;
  `);

  const s = finalSummary.recordset[0];
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('\n================================================================');
  console.log(`🏆 NẠP BỘ DỮ LIỆU DEMO LỚN HOÀN TẤT TRONG ${duration}s!`);
  console.log('================================================================');
  console.log(`- Tổng số Người dùng (Users):       ${s.UsersCount}`);
  console.log(`- Tổng số Giảng viên (Lecturers):   ${s.LecturersCount} (Mục tiêu >= 100)`);
  console.log(`- Tổng số Đơn vị đào tạo (Units):   ${s.UnitsCount} (Mục tiêu >= 10)`);
  console.log(`- Tổng số Thành tích (Achievements):${s.AchievementsCount} (Mục tiêu >= 5.000)`);
  console.log(`  + Đã xác nhận (VERIFIED):         ${s.VerifiedAchievementsCount}`);
  console.log(`  + Đã thu hồi (REVOKED):           ${s.RevokedAchievementsCount}`);
  console.log(`- Quyết định khen thưởng:           ${s.DecisionsCount}`);
  console.log(`- Bản ghi sổ khen thưởng:           ${s.AwardsCount}`);
  console.log('================================================================\n');

  process.exit(0);
}

run().catch(err => {
  console.error('❌ Lỗi khi nạp dữ liệu demo:', err);
  process.exit(1);
});
