const { z } = require('zod');

const createAchievementSchema = {
  body: z
    .object({
      lecturerId: z.number().int().positive().nullable().optional(),
      organizationUnitId: z.number().int().positive().nullable().optional(),
      contextUnitId: z.number().int().positive().nullable().optional(),
      achievementTypeId: z.number().int().positive({ message: 'Vui lòng chọn loại thành tích' }),
      title: z.string().min(3, 'Tiêu đề thành tích phải có ít nhất 3 ký tự').max(255),
      description: z.string().optional().nullable(),
      startDate: z.string().optional().nullable(),
      endDate: z.string().optional().nullable(),
      recognitionYear: z
        .number()
        .int()
        .min(2000, 'Năm ghi nhận không hợp lệ')
        .max(2100, 'Năm ghi nhận không hợp lệ'),
      academicYearId: z.number().int().positive().nullable().optional(),
    })
    .refine(
      (data) => {
        const hasLecturer = !!data.lecturerId;
        const hasUnit = !!data.organizationUnitId;
        // Ràng buộc XOR: Không được phép có cả Giảng viên và Đơn vị
        return !(hasLecturer && hasUnit);
      },
      {
        message: 'Thành tích không thể đồng thời thuộc về cả Giảng viên và Đơn vị (XOR Rule)',
        path: ['lecturerId'],
      }
    ),
};

module.exports = {
  createAchievementSchema,
};
