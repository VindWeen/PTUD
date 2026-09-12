const reportsRepo = require('./reports.repository');
const { getPool, sql } = require('../../config/database');

/**
 * Phòng chống CSV Injection (Rule 11 Blueprint)
 * Chặn thực thi mã/công thức nguy hiểm trong Microsoft Excel khi mở CSV
 * Nếu chuỗi bắt đầu bằng '=', '+', '-', '@', '\t', '\r' -> Chèn tiền tố dấu nháy đơn `'`
 */
function sanitizeCsvCell(value) {
  if (value === null || value === undefined) return '""';
  let str = String(value).trim();
  
  // Rule 11: CSV Injection Sanitization
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  // Escape nháy kép và bao bọc toàn bộ chuỗi
  return `"${str.replace(/"/g, '""')}"`;
}

/**
 * Lấy số liệu thống kê Dashboard theo chế độ Cá nhân hoặc Đơn vị
 */
async function getDashboardSummary(currentUser, query = {}) {
  const { mode = 'personal', year, unitId } = query;
  const pool = await getPool();

  let lecturerId = null;
  let targetUnitId = null;

  if (mode === 'personal') {
    const lRes = await pool.request()
      .input('userId', sql.Int, currentUser.id)
      .query('SELECT Id FROM Lecturers WHERE UserId = @userId');
    if (lRes.recordset[0]) {
      lecturerId = lRes.recordset[0].Id;
    }
  } else {
    // Mode Unit / Faculty
    if (unitId) {
      targetUnitId = parseInt(unitId, 10);
    } else {
      // Lấy đơn vị của user hiện tại
      const uRes = await pool.request()
        .input('userId', sql.Int, currentUser.id)
        .query(`
          SELECT TOP 1 la.UnitId 
          FROM Lecturers l 
          JOIN LecturerAssignments la ON l.Id = la.LecturerId 
          WHERE l.UserId = @userId AND la.IsPrimary = 1
        `);
      targetUnitId = uRes.recordset[0]?.UnitId || 1; // Default Khoa CNTT
    }
  }

  return await reportsRepo.getDashboardSummary({
    userId: currentUser.id,
    lecturerId,
    unitId: targetUnitId,
    year: year ? parseInt(year, 10) : null
  });
}

/**
 * Lấy báo cáo chi tiết thành tích
 */
async function getAchievementsReport(query) {
  return await reportsRepo.getAchievementsReport(query);
}

/**
 * Lấy báo cáo chi tiết khen thưởng
 */
async function getAwardsReport(query) {
  return await reportsRepo.getAwardsReport(query);
}

/**
 * Xuất dữ liệu CSV an toàn (chống CSV Injection, UTF-8 BOM)
 */
async function exportCsv(type = 'achievements', filters = {}) {
  const BOM = '\uFEFF'; // UTF-8 Byte Order Mark cho Excel

  if (type === 'awards') {
    const records = await reportsRepo.getAwardsForExport(filters);
    const headers = [
      'STT',
      'Mã khen thưởng',
      'Năm công nhận',
      'Quyết định ban hành',
      'Ngày ban hành',
      'Danh hiệu / Hình thức',
      'Cấp khen thưởng',
      'Chủ thể thụ hưởng',
      'Phân loại chủ thể',
      'Mã GV (nếu có)',
      'Đơn vị bối cảnh',
      'Trạng thái'
    ];

    const rows = records.map((r, idx) => [
      sanitizeCsvCell(idx + 1),
      sanitizeCsvCell(`AR_${r.Id}`),
      sanitizeCsvCell(r.RecognitionYear),
      sanitizeCsvCell(r.DecisionNumber),
      sanitizeCsvCell(r.IssuedDate ? new Date(r.IssuedDate).toLocaleDateString('vi-VN') : ''),
      sanitizeCsvCell(r.AwardTypeName),
      sanitizeCsvCell(r.AwardLevel),
      sanitizeCsvCell(r.SubjectName),
      sanitizeCsvCell(r.SubjectType),
      sanitizeCsvCell(r.StaffCode),
      sanitizeCsvCell(r.ContextUnitName),
      sanitizeCsvCell(r.Status)
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    return {
      filename: `Bao-cao-khen-thuong-${new Date().toISOString().split('T')[0]}.csv`,
      content: BOM + csvContent
    };
  }

  // Mặc định xuất Thành tích (Achievements)
  const records = await reportsRepo.getAchievementsForExport(filters);
  const headers = [
    'STT',
    'Mã hồ sơ',
    'Tên thành tích / Công trình',
    'Năm công nhận',
    'Danh mục',
    'Loại thành tích',
    'Chủ thể kê khai',
    'Phân loại chủ thể',
    'Mã GV (nếu có)',
    'Đơn vị bối cảnh ghi nhận (ContextUnit)',
    'Trạng thái hồ sơ'
  ];

  const rows = records.map((r, idx) => [
    sanitizeCsvCell(idx + 1),
    sanitizeCsvCell(`ACH_${r.Id}`),
    sanitizeCsvCell(r.Title),
    sanitizeCsvCell(r.RecognitionYear),
    sanitizeCsvCell(r.TypeCategory),
    sanitizeCsvCell(r.TypeName),
    sanitizeCsvCell(r.SubjectName),
    sanitizeCsvCell(r.SubjectType),
    sanitizeCsvCell(r.StaffCode),
    sanitizeCsvCell(r.ContextUnitName),
    sanitizeCsvCell(r.Status)
  ]);

  const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  return {
    filename: `Bao-cao-thanh-tich-${new Date().toISOString().split('T')[0]}.csv`,
    content: BOM + csvContent
  };
}

module.exports = {
  sanitizeCsvCell,
  getDashboardSummary,
  getAchievementsReport,
  getAwardsReport,
  exportCsv
};
