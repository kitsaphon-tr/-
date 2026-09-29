import * as XLSX from 'xlsx';
import { CalcDetailRow, MonthlyRecord, ScheduleDutyRow, TeacherSummary } from '../types';

/**
 * Export Monthly Calculation and Summary to real Excel (.xlsx) file
 */
export function exportMonthlyCalculationToExcel(
  record: MonthlyRecord,
  schoolName: string = 'โรงเรียนตันตรารักษ์'
): void {
  const wb = XLSX.utils.book_new();

  // 1. Sheet: Calc_YYYYMM (ตารางคำนวณรายละเอียด)
  const calcData: (string | number)[][] = [
    [schoolName],
    [`ตารางคำนวณเงินสอนพิเศษและค่าตอบแทน ประจำเดือน ${record.monthName}`],
    [`จำนวนวันทำงานของเดือน: ${record.workingDaysCount} วัน`, `สถานะ: ${record.status === 'locked' ? 'ปิดงวดแล้ว' : 'ฉบับร่าง'}`],
    [], // blank row
    [
      'ลำดับ',
      'ระดับชั้น/งาน',
      'ชื่อครูผู้สอน',
      'ภาระหน้าที่',
      'อัตรา (บาท)',
      'ปริมาณ',
      'หน่วย',
      'วันทำงาน',
      'เงินได้เต็ม (บาท)',
      'วันขาด',
      'เฉลี่ย/วัน (บาท)',
      'หักขาด (บาท)',
      'เงินได้สุทธิ (บาท)',
      'สอนแทน (+) (บาท)',
      'รวมจ่ายสุทธิ (บาท)',
      'หมายเหตุ',
    ],
  ];

  record.detailRows.forEach((row, idx) => {
    calcData.push([
      idx + 1,
      row.category,
      row.teacherName,
      row.dutyName,
      row.rate,
      row.quantity,
      row.unit,
      row.workingDays,
      row.grossAmount,
      row.absentDays,
      row.dailyRate,
      row.deduction,
      row.netAmount,
      row.substituteAmount,
      row.finalTotal,
      row.notes || '',
    ]);
  });

  // Total summary row
  const grossSum = record.detailRows.reduce((a, b) => a + b.grossAmount, 0);
  const deductSum = record.detailRows.reduce((a, b) => a + b.deduction, 0);
  const netSum = record.detailRows.reduce((a, b) => a + b.netAmount, 0);
  const subSum = record.detailRows.reduce((a, b) => a + b.substituteAmount, 0);
  const grandSum = record.detailRows.reduce((a, b) => a + b.finalTotal, 0);

  calcData.push([
    '',
    'รวมทั้งหมด',
    '',
    '',
    '',
    '',
    '',
    '',
    grossSum,
    '',
    '',
    deductSum,
    netSum,
    subSum,
    grandSum,
    '',
  ]);

  const wsCalc = XLSX.utils.aoa_to_sheet(calcData);
  XLSX.utils.book_append_sheet(wb, wsCalc, `Calc_${record.monthId}`);

  // 2. Sheet: CalcSummary_YYYYMM (สรุปยอดรายบุคคล)
  const summaryData: (string | number)[][] = [
    [schoolName],
    [`สรุปเงินได้ค่าตอบแทนรายบุคคล ประจำเดือน ${record.monthName}`],
    [],
    [
      'ลำดับ',
      'ชื่อ-สกุล',
      'ชื่อในตาราง',
      'กลุ่มสาระ/ฝ่าย',
      'การบ้าน (บาท)',
      'รายคาบ (บาท)',
      'จัดการประจำวัน (บาท)',
      'เหมาจ่าย/กศพ./Backoffice (บาท)',
      'เงินได้รวม (บาท)',
      'หักขาด (บาท)',
      'บวกสอนแทน (บาท)',
      'ยอดสุทธิรับจริง (บาท)',
    ],
  ];

  record.summaries.forEach((s, idx) => {
    summaryData.push([
      idx + 1,
      s.teacherFullName,
      s.teacherScheduleName,
      s.department,
      s.homeworkAmount,
      s.periodAmount,
      s.dailyDutyAmount,
      s.lumpSumAmount,
      s.totalGross,
      s.totalDeduction,
      s.totalSubstitute,
      s.grandTotal,
    ]);
  });

  summaryData.push([
    '',
    'ยอดรวมทั้งโรงเรียน',
    '',
    '',
    record.summaries.reduce((a, b) => a + b.homeworkAmount, 0),
    record.summaries.reduce((a, b) => a + b.periodAmount, 0),
    record.summaries.reduce((a, b) => a + b.dailyDutyAmount, 0),
    record.summaries.reduce((a, b) => a + b.lumpSumAmount, 0),
    record.summaries.reduce((a, b) => a + b.totalGross, 0),
    record.summaries.reduce((a, b) => a + b.totalDeduction, 0),
    record.summaries.reduce((a, b) => a + b.totalSubstitute, 0),
    record.totalSchoolBudget,
  ]);

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, `CalcSummary_${record.monthId}`);

  // 3. Sheet: Schedule_YYYYMM (ตารางสอนที่นำเข้า)
  const days = record.schedule.activeDays;
  const scheduleData: (string | number)[][] = [
    [schoolName],
    [`ตารางเวรและคาบสอนพิเศษ ประจำเดือน ${record.monthName}`],
    [],
    ['โซนภาระงาน', 'รายการ/ห้อง', ...days.map(d => `วันที่ ${d}`)],
  ];

  record.schedule.rows.forEach(r => {
    const zoneName =
      r.zone === 'homework'
        ? 'โซน 1: การบ้าน'
        : r.zone === 'period'
        ? 'โซน 2: คาบเสริม'
        : 'โซน 3: เวรประจำวัน';

    const rowValues = [zoneName, r.title];
    days.forEach(d => {
      rowValues.push(r.assignments[d.toString()] || '');
    });
    scheduleData.push(rowValues);
  });

  const wsSchedule = XLSX.utils.aoa_to_sheet(scheduleData);
  XLSX.utils.book_append_sheet(wb, wsSchedule, `Schedule_${record.monthId}`);

  // Trigger download in browser
  const filename = `ระบบสอนพิเศษและค่าตอบแทน_${record.monthId}_${record.monthName.replace(/\s+/g, '_')}.xlsx`;
  XLSX.writeFile(wb, filename);
}

/**
 * Parse uploaded Excel or pasted text to extract schedule rows
 */
export function parsePastedSchedule(
  text: string,
  days: number[]
): { rows: Omit<ScheduleDutyRow, 'id'>[]; detectedDays: number[]; errors: string[] } {
  const errors: string[] = [];
  const lines = text.trim().split(/\r?\n/).filter(line => line.trim().length > 0);

  if (lines.length < 2) {
    return { rows: [], detectedDays: [], errors: ['ข้อมูลที่วางต้องมีอย่างน้อยแถวหัวตารางและแถวข้อมูล'] };
  }

  // Parse header
  const headerCols = lines[0].split('\t').map(c => c.trim());
  let detectedDays: number[] = [];

  // Look for day numbers in header
  headerCols.forEach(col => {
    const num = parseInt(col.replace(/[^0-9]/g, ''), 10);
    if (!isNaN(num) && num >= 1 && num <= 31) {
      detectedDays.push(num);
    }
  });

  if (detectedDays.length === 0) {
    detectedDays = days;
  }

  const rows: Omit<ScheduleDutyRow, 'id'>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split('\t').map(c => c.trim());
    if (cols.length < 2) continue;

    const title = cols[0];
    let zone: 'homework' | 'period' | 'daily_duty' = 'period';
    if (title.includes('การบ้าน') || title.includes('ป.') || title.includes('ม.')) {
      zone = 'homework';
    } else if (title.includes('เวร') || title.includes('จราจร') || title.includes('ประตู')) {
      zone = 'daily_duty';
    }

    const assignments: Record<string, string> = {};
    detectedDays.forEach((day, colIdx) => {
      const val = cols[colIdx + 1] || '';
      if (val) {
        assignments[day.toString()] = val;
      }
    });

    rows.push({
      zone,
      category: title,
      title,
      assignments,
    });
  }

  return { rows, detectedDays, errors };
}
