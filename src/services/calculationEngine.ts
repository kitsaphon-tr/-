import {
  CalcDetailRow,
  ClassRosterItem,
  DutyRate,
  MonthSchedule,
  MonthlyRecord,
  Teacher,
  TeacherSummary
} from '../types';

/**
 * Convert a number to Thai Baht text format (e.g. 2500 -> "สองพันห้าร้อยบาทถ้วน")
 */
export function thaiBahtText(num: number): string {
  if (num === 0) return 'ศูนย์บาทถ้วน';
  if (isNaN(num)) return '-';

  const isNegative = num < 0;
  num = Math.abs(num);

  const numbers = ['', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
  const units = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน'];

  const parts = num.toFixed(2).split('.');
  const integerPart = parts[0];
  const decimalPart = parts[1];

  function convertGroup(nStr: string): string {
    let result = '';
    const len = nStr.length;
    for (let i = 0; i < len; i++) {
      const digit = parseInt(nStr[i], 10);
      const pos = len - i - 1;
      if (digit !== 0) {
        if (pos === 1 && digit === 1) {
          result += 'สิบ';
        } else if (pos === 1 && digit === 2) {
          result += 'ยี่สิบ';
        } else if (pos === 0 && digit === 1 && len > 1 && parseInt(nStr[len - 2], 10) !== 0) {
          result += 'เอ็ด';
        } else {
          result += numbers[digit] + units[pos];
        }
      }
    }
    return result;
  }

  let text = '';
  // Support up to millions
  if (integerPart.length > 6) {
    const millionPart = integerPart.substring(0, integerPart.length - 6);
    const lowerPart = integerPart.substring(integerPart.length - 6);
    text += convertGroup(millionPart) + 'ล้าน' + convertGroup(lowerPart);
  } else {
    text += convertGroup(integerPart);
  }

  text += 'บาท';

  const satang = parseInt(decimalPart, 10);
  if (satang === 0) {
    text += 'ถ้วน';
  } else {
    text += convertGroup(decimalPart) + 'สตางค์';
  }

  return (isNegative ? 'ลบ' : '') + text;
}

/**
 * Format currency number
 */
export function formatCurrency(amount: number): string {
  return amount.toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Format integer count
 */
export function formatCount(count: number): string {
  return count.toLocaleString('th-TH');
}

/**
 * Centralized Calculation Engine for Tantrarak School (โรงเรียนตันตรารักษ์)
 * Resolves all inconsistencies, formulas and links from the legacy spreadsheet.
 * Supports multiple teachers (> 2 teachers) per daily duty slot/cell.
 */
export function parseTeachersFromCell(cellValue: string): string[] {
  if (!cellValue || !cellValue.trim()) return [];
  return cellValue
    .split(/[,/+\n;&]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

export function runCalculationEngine(
  monthSchedule: MonthSchedule,
  teachers: Teacher[],
  dutyRates: DutyRate[],
  classRosters: ClassRosterItem[],
  existingDetailRows?: CalcDetailRow[] // preserves manual absentDays and substituteAmount if re-running
): { detailRows: CalcDetailRow[]; summaries: TeacherSummary[]; totalBudget: number; workingDays: number } {
  // 1. Determine central working days in the month
  const workingDays = monthSchedule.activeDays.length > 0 ? monthSchedule.activeDays.length : 20;

  // Rate lookups
  const homeworkRate = dutyRates.find(r => r.code === 'homework')?.rate ?? 180;
  const periodRate = dutyRates.find(r => r.code === 'period')?.rate ?? 230;
  const dailyDutyRate = dutyRates.find(r => r.code === 'daily_duty')?.rate ?? 90;
  const specialCoordRate = dutyRates.find(r => r.code === 'special_coordinator')?.rate ?? 1000;
  const defaultBackOfficeRate = dutyRates.find(r => r.code === 'back_office')?.rate ?? 1000;

  // Map existing overrides by key: `${teacherId}_${dutyType}_${category}`
  const overrideMap = new Map<string, { absentDays: number; substituteAmount: number; notes?: string }>();
  if (existingDetailRows && existingDetailRows.length > 0) {
    for (const r of existingDetailRows) {
      const key = `${r.teacherId}_${r.dutyType}_${r.category}`;
      overrideMap.set(key, {
        absentDays: r.absentDays,
        substituteAmount: r.substituteAmount,
        notes: r.notes,
      });
    }
  }

  // Teacher lookup maps
  const teacherByName = new Map<string, Teacher>();
  const teacherById = new Map<string, Teacher>();
  teachers.forEach(t => {
    if (t.active) {
      teacherByName.set(t.scheduleName.trim(), t);
      teacherById.set(t.id, t);
    }
  });

  const detailRows: CalcDetailRow[] = [];

  // ==========================================
  // Zone 1: Homework (การบ้าน)
  // Based on ClassRoster: Rate * studentCount.
  // Standardized rule: If 2 teachers are assigned to the room, each receives 50% ((D * E) / 2)
  // ==========================================
  classRosters.forEach(roster => {
    const assignedTeachers = roster.assignedTeacherIds
      .map(id => teacherById.get(id))
      .filter((t): t is Teacher => t !== undefined);

    if (assignedTeachers.length === 0) return;

    const teacherCount = assignedTeachers.length;

    assignedTeachers.forEach(t => {
      // Calculate quantity (students per teacher)
      const effectiveStudents = roster.studentCount / teacherCount;
      const gross = effectiveStudents * homeworkRate;
      const key = `${t.id}_homework_${roster.grade}`;
      const prev = overrideMap.get(key);

      const absentDays = prev?.absentDays ?? 0;
      const substituteAmount = prev?.substituteAmount ?? 0;
      const dailyRate = workingDays > 0 ? gross / workingDays : 0;
      const deduction = absentDays * dailyRate;
      const netAmount = gross - deduction;
      const finalTotal = netAmount + substituteAmount;

      detailRows.push({
        id: `hw_${roster.id}_${t.id}`,
        teacherId: t.id,
        teacherName: t.scheduleName,
        dutyType: 'homework',
        dutyName: 'การบ้าน',
        category: roster.grade,
        rate: homeworkRate,
        quantity: effectiveStudents,
        unit: 'คน',
        workingDays,
        grossAmount: Math.round(gross * 100) / 100,
        absentDays,
        dailyRate: Math.round(dailyRate * 100) / 100,
        deduction: Math.round(deduction * 100) / 100,
        netAmount: Math.round(netAmount * 100) / 100,
        substituteAmount,
        finalTotal: Math.round(finalTotal * 100) / 100,
        notes: teacherCount > 1 ? `ห้อง ${roster.grade} มีครูดูแล 2 คน (${roster.studentCount} คน ÷ 2)` : undefined,
      });
    });
  });

  // ==========================================
  // Zone 2: Tutoring Periods (รายคาบ)
  // Count occurrences of teacher name across period rows (supports multi-teacher cells)
  // ==========================================
  const periodRows = monthSchedule.rows.filter(r => r.zone === 'period');
  const periodTeacherCounts: Record<string, { count: number; categories: Set<string> }> = {};

  periodRows.forEach(row => {
    Object.values(row.assignments).forEach(cellValue => {
      const teacherNames = parseTeachersFromCell(cellValue);
      teacherNames.forEach(cleanName => {
        const teacher = teacherByName.get(cleanName);
        if (teacher) {
          if (!periodTeacherCounts[teacher.id]) {
            periodTeacherCounts[teacher.id] = { count: 0, categories: new Set() };
          }
          periodTeacherCounts[teacher.id].count += 1;
          periodTeacherCounts[teacher.id].categories.add(row.category || row.title);
        }
      });
    });
  });

  Object.entries(periodTeacherCounts).forEach(([teacherId, { count, categories }]) => {
    const teacher = teacherById.get(teacherId);
    if (!teacher || count === 0) return;

    const gross = count * periodRate;
    const catLabel = Array.from(categories).slice(0, 2).join(', ') + (categories.size > 2 ? '...' : '');
    const key = `${teacher.id}_period_รายคาบ`;
    const prev = overrideMap.get(key);

    const absentDays = prev?.absentDays ?? 0;
    const substituteAmount = prev?.substituteAmount ?? 0;
    const dailyRate = workingDays > 0 ? gross / workingDays : 0;
    const deduction = absentDays * dailyRate;
    const netAmount = gross - deduction;
    const finalTotal = netAmount + substituteAmount;

    detailRows.push({
      id: `per_${teacher.id}`,
      teacherId: teacher.id,
      teacherName: teacher.scheduleName,
      dutyType: 'period',
      dutyName: 'รายคาบ',
      category: catLabel || 'คาบเสริม',
      rate: periodRate,
      quantity: count,
      unit: 'คาบ',
      workingDays,
      grossAmount: Math.round(gross * 100) / 100,
      absentDays,
      dailyRate: Math.round(dailyRate * 100) / 100,
      deduction: Math.round(deduction * 100) / 100,
      netAmount: Math.round(netAmount * 100) / 100,
      substituteAmount,
      finalTotal: Math.round(finalTotal * 100) / 100,
      notes: `นับได้ ${count} คาบ ในตารางสอนพิเศษ`,
    });
  });

  // ==========================================
  // Zone 3: Daily Duty / Management (จัดการประจำวัน)
  // Count occurrences across daily duty rows (supports >2 teachers per duty post/day)
  // ==========================================
  const dailyDutyRows = monthSchedule.rows.filter(r => r.zone === 'daily_duty');
  const dutyTeacherCounts: Record<string, { count: number; categories: Set<string> }> = {};

  dailyDutyRows.forEach(row => {
    Object.values(row.assignments).forEach(cellValue => {
      const teacherNames = parseTeachersFromCell(cellValue);
      teacherNames.forEach(cleanName => {
        const teacher = teacherByName.get(cleanName);
        if (teacher) {
          if (!dutyTeacherCounts[teacher.id]) {
            dutyTeacherCounts[teacher.id] = { count: 0, categories: new Set() };
          }
          dutyTeacherCounts[teacher.id].count += 1;
          dutyTeacherCounts[teacher.id].categories.add(row.category || row.title);
        }
      });
    });
  });

  Object.entries(dutyTeacherCounts).forEach(([teacherId, { count, categories }]) => {
    const teacher = teacherById.get(teacherId);
    if (!teacher || count === 0) return;

    const gross = count * dailyDutyRate;
    const catLabel = Array.from(categories).slice(0, 2).join(', ') + (categories.size > 2 ? '...' : '');
    const key = `${teacher.id}_daily_duty_จัดการประจำวัน`;
    const prev = overrideMap.get(key);

    const absentDays = prev?.absentDays ?? 0;
    const substituteAmount = prev?.substituteAmount ?? 0;
    const dailyRate = workingDays > 0 ? gross / workingDays : 0;
    const deduction = absentDays * dailyRate;
    const netAmount = gross - deduction;
    const finalTotal = netAmount + substituteAmount;

    detailRows.push({
      id: `duty_${teacher.id}`,
      teacherId: teacher.id,
      teacherName: teacher.scheduleName,
      dutyType: 'daily_duty',
      dutyName: 'จัดการประจำวัน',
      category: catLabel || 'เวรประจำวัน',
      rate: dailyDutyRate,
      quantity: count,
      unit: 'วัน',
      workingDays,
      grossAmount: Math.round(gross * 100) / 100,
      absentDays,
      dailyRate: Math.round(dailyRate * 100) / 100,
      deduction: Math.round(deduction * 100) / 100,
      netAmount: Math.round(netAmount * 100) / 100,
      substituteAmount,
      finalTotal: Math.round(finalTotal * 100) / 100,
      notes: `เข้าเวรทั้งหมด ${count} วัน`,
    });
  });

  // ==========================================
  // Zone 4: Lump Sums (กศพ. และ Back office)
  // Individual teacher lump sums configured in Teachers master sheet
  // ==========================================
  teachers.forEach(t => {
    if (!t.active || !t.isLumpSum || !t.lumpSumType || t.lumpSumType === 'none') return;

    let rate = 0;
    let dutyName = '';
    let category = '';

    if (t.lumpSumType === 'special_coordinator') {
      rate = t.lumpSumAmount && t.lumpSumAmount > 0 ? t.lumpSumAmount : specialCoordRate;
      dutyName = 'กศพ.';
      category = 'ประสานงาน กศพ.';
    } else if (t.lumpSumType === 'back_office') {
      rate = t.lumpSumAmount && t.lumpSumAmount > 0 ? t.lumpSumAmount : defaultBackOfficeRate;
      dutyName = 'Back office';
      category = 'สนับสนุนระบบงาน';
    }

    const key = `${t.id}_${t.lumpSumType}_${category}`;
    const prev = overrideMap.get(key);

    const absentDays = prev?.absentDays ?? 0;
    const substituteAmount = prev?.substituteAmount ?? 0;
    const dailyRate = workingDays > 0 ? rate / workingDays : 0;
    const deduction = absentDays * dailyRate;
    const netAmount = rate - deduction;
    const finalTotal = netAmount + substituteAmount;

    detailRows.push({
      id: `lump_${t.id}_${t.lumpSumType}`,
      teacherId: t.id,
      teacherName: t.scheduleName,
      dutyType: t.lumpSumType,
      dutyName,
      category,
      rate,
      quantity: 1,
      unit: 'เดือน',
      workingDays,
      grossAmount: Math.round(rate * 100) / 100,
      absentDays,
      dailyRate: Math.round(dailyRate * 100) / 100,
      deduction: Math.round(deduction * 100) / 100,
      netAmount: Math.round(netAmount * 100) / 100,
      substituteAmount,
      finalTotal: Math.round(finalTotal * 100) / 100,
      notes: `เหมาจ่ายรายเดือนคงที่`,
    });
  });

  // Sort detail rows by teacher name then duty type
  detailRows.sort((a, b) => a.teacherName.localeCompare(b.teacherName, 'th'));

  // ==========================================
  // Aggregate Summaries per Teacher (Equivalent to SUMIF in legacy file)
  // ==========================================
  const summaryMap = new Map<string, TeacherSummary>();

  detailRows.forEach(row => {
    let summary = summaryMap.get(row.teacherId);
    const teacher = teacherById.get(row.teacherId);

    if (!summary) {
      summary = {
        teacherId: row.teacherId,
        teacherScheduleName: row.teacherName,
        teacherFullName: teacher?.fullName ?? row.teacherName,
        department: teacher?.department ?? 'ฝ่ายการสอน',
        homeworkAmount: 0,
        periodAmount: 0,
        dailyDutyAmount: 0,
        lumpSumAmount: 0,
        totalGross: 0,
        totalDeduction: 0,
        totalSubstitute: 0,
        grandTotal: 0,
        details: [],
      };
      summaryMap.set(row.teacherId, summary);
    }

    summary.details.push(row);
    summary.totalGross += row.grossAmount;
    summary.totalDeduction += row.deduction;
    summary.totalSubstitute += row.substituteAmount;
    summary.grandTotal += row.finalTotal;

    if (row.dutyType === 'homework') {
      summary.homeworkAmount += row.finalTotal;
    } else if (row.dutyType === 'period') {
      summary.periodAmount += row.finalTotal;
    } else if (row.dutyType === 'daily_duty') {
      summary.dailyDutyAmount += row.finalTotal;
    } else {
      summary.lumpSumAmount += row.finalTotal;
    }
  });

  const summaries = Array.from(summaryMap.values()).map(s => ({
    ...s,
    totalGross: Math.round(s.totalGross * 100) / 100,
    totalDeduction: Math.round(s.totalDeduction * 100) / 100,
    totalSubstitute: Math.round(s.totalSubstitute * 100) / 100,
    grandTotal: Math.round(s.grandTotal * 100) / 100,
  }));

  summaries.sort((a, b) => a.teacherScheduleName.localeCompare(b.teacherScheduleName, 'th'));

  const totalBudget = summaries.reduce((acc, curr) => acc + curr.grandTotal, 0);

  return {
    detailRows,
    summaries,
    totalBudget: Math.round(totalBudget * 100) / 100,
    workingDays,
  };
}
