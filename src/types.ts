export type UserRole = 'admin' | 'teacher';

export interface User {
  id: string;
  username: string;
  displayName: string;
  role: UserRole;
  teacherId?: string; // Links to teacher record if role is 'teacher'
  email?: string;
  workspaceAccount?: string; // e.g. 'kitsaphon@tr.ac.th'
}

export type DutyType = 'homework' | 'period' | 'daily_duty' | 'special_coordinator' | 'back_office' | 'other';

export interface DutyRate {
  id: string;
  code: DutyType;
  name: string;
  rate: number;
  unit: string; // e.g. 'ต่อคน' | 'ต่อคาบ' | 'ต่อวัน' | 'เหมาจ่าย/เดือน'
  description?: string;
  isLumpSum: boolean;
}

export interface Teacher {
  id: string;
  code: string; // e.g. 'T001'
  scheduleName: string; // Exact name used in schedule e.g. 'โจแอล', 'Nili', 'สาลี่'
  fullName: string; // e.g. 'นายโจแอล มาร์ติน'
  department: string;
  isLumpSum: boolean;
  lumpSumType?: 'special_coordinator' | 'back_office' | 'none';
  lumpSumAmount?: number; // e.g. 1000 or 1200
  active: boolean;
  bankAccount?: string;
  email?: string;
}

export interface ClassRosterItem {
  id: string;
  grade: string; // e.g. 'ป.1/1', 'ป.1/2', 'ม.1/1'
  studentCount: number; // e.g. 35
  assignedTeacherIds: string[]; // 1 or 2 teachers
  splitRule: 'equal' | 'ratio'; // if 2 teachers, split 50/50 or by ratio
  customStudentCounts?: Record<string, number>; // optional custom ratio per teacher
}

export type DutyZone = 'homework' | 'period' | 'daily_duty';

export interface ScheduleDutyRow {
  id: string;
  zone: DutyZone;
  category: string; // e.g. 'ป.1/1' for homework, 'ม.เสริม 1' for period, 'จราจร' for daily_duty
  title: string;
  defaultTeacherId?: string;
  // map from day (1..31 or date string) to teacher scheduleName (supports multiple teachers separated by commas)
  assignments: Record<string, string>;
}

export interface MonthSchedule {
  monthId: string; // e.g. '2506' (มิถุนายน 2569)
  monthName: string; // 'มิถุนายน 2569'
  academicYear: string; // '2569'
  activeDays: number[]; // e.g. [2, 4, 5, 9, 10, 11, ...]
  rows: ScheduleDutyRow[];
}

export interface CalcDetailRow {
  id: string;
  teacherId: string;
  teacherName: string;
  dutyType: DutyType;
  dutyName: string;
  category: string; // 'ป.1/1' or 'คาบเสริม' or 'เวรจัดการ'
  rate: number;
  quantity: number; // e.g. student count (or half), period count, days on duty
  unit: string;
  workingDays: number; // central working days count in month
  grossAmount: number; // rate * quantity (or lump sum)
  absentDays: number; // days absent (manual or imported)
  dailyRate: number; // grossAmount / workingDays
  deduction: number; // absentDays * dailyRate
  netAmount: number; // grossAmount - deduction
  substituteAmount: number; // additional substitution pay (+)
  finalTotal: number; // netAmount + substituteAmount
  notes?: string;
}

export interface TeacherSummary {
  teacherId: string;
  teacherScheduleName: string;
  teacherFullName: string;
  department: string;
  homeworkAmount: number;
  periodAmount: number;
  dailyDutyAmount: number;
  lumpSumAmount: number;
  totalGross: number;
  totalDeduction: number;
  totalSubstitute: number;
  grandTotal: number;
  details: CalcDetailRow[];
}

export interface AbsenceSubLog {
  id: string;
  monthId: string;
  dateStr: string; // e.g. "12 มิ.ย. 2569"
  absentTeacherId: string;
  absentTeacherName: string;
  dutyType: DutyType;
  category: string;
  daysCount: number;
  substituteTeacherId?: string;
  substituteTeacherName?: string;
  substitutePayAmount: number;
  reason: string;
  loggedAt: string;
}

export interface MonthlyRecord {
  monthId: string; // e.g. '2506'
  monthName: string; // 'มิถุนายน 2569'
  year: number; // 2569
  monthNum: number; // 6
  status: 'draft' | 'locked';
  lockedAt?: string;
  workingDaysCount: number;
  schedule: MonthSchedule;
  detailRows: CalcDetailRow[];
  summaries: TeacherSummary[];
  totalSchoolBudget: number;
  absenceLogs?: AbsenceSubLog[];
  updatedAt: string;
}

export interface SchoolConfig {
  schoolName: string; // โรงเรียนตันตรารักษ์
  academicYear: string; // 2569
  currentMonthId: string; // 2506
  principalName: string; // ผู้อำนวยการโรงเรียน
  academicHeadName: string; // หัวหน้าฝ่ายวิชาการ
  financeHeadName: string; // หัวหน้าฝ่ายการเงิน
  // Phase 2 Decision flags implemented
  authMode: 'internal' | 'google_workspace';
  homeworkSplitMode: 'equal_half' | 'custom_ratio';
  absentTrackingMode: 'manual_input' | 'automated_sync';
  scheduleFormatType: 'fixed_standard' | 'dynamic_mapping';
}
