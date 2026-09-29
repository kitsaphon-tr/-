import {
  ClassRosterItem,
  DutyRate,
  MonthSchedule,
  MonthlyRecord,
  SchoolConfig,
  Teacher,
  User
} from '../types';
import { runCalculationEngine } from '../services/calculationEngine';

export const initialSchoolConfig: SchoolConfig = {
  schoolName: 'โรงเรียนตันตรารักษ์',
  academicYear: '2569',
  currentMonthId: '2506',
  principalName: 'ดร.วิชัย ตันตรานนท์',
  academicHeadName: 'นางสาวศิริพร บุญยืน',
  financeHeadName: 'นางกาญจนา มงคลสุข',
  authMode: 'google_workspace',
  homeworkSplitMode: 'equal_half',
  absentTrackingMode: 'automated_sync',
  scheduleFormatType: 'fixed_standard',
};

export const initialDutyRates: DutyRate[] = [
  {
    id: 'rate_1',
    code: 'homework',
    name: 'การบ้าน',
    rate: 180,
    unit: 'ต่อจำนวนผู้เรียน (คน)',
    description: 'จ่ายตามจำนวนนักเรียนในห้อง (กรณีมีครู 2 คน หารเท่ากันคนละครึ่ง)',
    isLumpSum: false,
  },
  {
    id: 'rate_2',
    code: 'period',
    name: 'รายคาบ',
    rate: 230,
    unit: 'ต่อคาบที่สอนจริง',
    description: 'นับจำนวนคาบที่ปรากฏชื่อในตารางสอนเสริม/รายคาบ',
    isLumpSum: false,
  },
  {
    id: 'rate_3',
    code: 'daily_duty',
    name: 'จัดการประจำวัน',
    rate: 90,
    unit: 'ต่อวันที่เข้าเวรจริง',
    description: 'นับจำนวนวันที่เข้าเวรจัดการดูแลนักเรียนในตารางเวร',
    isLumpSum: false,
  },
  {
    id: 'rate_4',
    code: 'special_coordinator',
    name: 'กศพ.',
    rate: 1000,
    unit: 'เหมาจ่ายต่อเดือน',
    description: 'ค่าตอบแทนคณะกรรมการผู้ประสานงานพิเศษ กศพ.',
    isLumpSum: true,
  },
  {
    id: 'rate_5',
    code: 'back_office',
    name: 'Back office',
    rate: 1000,
    unit: 'เหมาจ่ายต่อเดือน',
    description: 'ค่าสนับสนุนระบบงานและธุรการ (1,000 หรือ 1,200 ตามที่กำหนดเฉพาะคน)',
    isLumpSum: true,
  },
];

export const initialTeachers: Teacher[] = [
  {
    id: 't_01',
    code: 'T001',
    scheduleName: 'โจแอล',
    fullName: 'นายโจแอล มาร์ติน (Joel Martin)',
    department: 'กลุ่มสาระฯ ภาษาต่างประเทศ',
    isLumpSum: false,
    active: true,
    bankAccount: '058-2-34918-1 ธ.กรุงไทย',
  },
  {
    id: 't_02',
    code: 'T002',
    scheduleName: 'Nili',
    fullName: 'นางสาวนีลี ชาร์มา (Nili Sharma)',
    department: 'กลุ่มสาระฯ ภาษาต่างประเทศ',
    isLumpSum: false,
    active: true,
    bankAccount: '112-4-88392-0 ธ.กสิกรไทย',
  },
  {
    id: 't_03',
    code: 'T003',
    scheduleName: 'สาลี่',
    fullName: 'นางสาวสาลี่ แสนสุข',
    department: 'กลุ่มสาระฯ ภาษาไทย',
    isLumpSum: false,
    active: true,
    bankAccount: '402-1-98765-4 ธ.กรุงเทพ',
  },
  {
    id: 't_04',
    code: 'T004',
    scheduleName: 'กิตติพงษ์',
    fullName: 'นายกิตติพงษ์ วัฒนาพาณิชย์',
    department: 'กลุ่มสาระฯ คณิตศาสตร์',
    isLumpSum: false,
    active: true,
    bankAccount: '772-0-12345-6 ธ.ไทยพาณิชย์',
  },
  {
    id: 't_05',
    code: 'T005',
    scheduleName: 'พัชรี',
    fullName: 'นางพัชรี สุวรรณเมธา',
    department: 'กลุ่มสาระฯ วิทยาศาสตร์และเทคโนโลยี',
    isLumpSum: true,
    lumpSumType: 'special_coordinator',
    lumpSumAmount: 1000,
    active: true,
    bankAccount: '901-3-45678-9 ธ.กรุงไทย',
  },
  {
    id: 't_06',
    code: 'T006',
    scheduleName: 'ธนกร',
    fullName: 'นายธนกร สดใสศิริ',
    department: 'กลุ่มสาระฯ สังคมศึกษา ศาสนา และวัฒนธรรม',
    isLumpSum: true,
    lumpSumType: 'back_office',
    lumpSumAmount: 1200,
    active: true,
    bankAccount: '330-2-99881-2 ธ.กรุงศรีอยุธยา',
  },
  {
    id: 't_07',
    code: 'T007',
    scheduleName: 'สมศรี',
    fullName: 'นางสมศรี มีสุขเจริญ',
    department: 'กลุ่มการศึกษาปฐมวัย/ประถมศึกษา',
    isLumpSum: false,
    active: true,
    bankAccount: '445-8-22119-0 ธ.กรุงไทย',
  },
  {
    id: 't_08',
    code: 'T008',
    scheduleName: 'เอกชัย',
    fullName: 'นายเอกชัย ใจดีเลิศ',
    department: 'กลุ่มสาระฯ สุขศึกษาและพลศึกษา',
    isLumpSum: false,
    active: true,
    bankAccount: '612-5-77443-1 ธ.กสิกรไทย',
  },
  {
    id: 't_09',
    code: 'T009',
    scheduleName: 'นภัสสร',
    fullName: 'นางสาวนภัสสร รักษ์ถิ่นไทย',
    department: 'กลุ่มสาระฯ ศิลปะ',
    isLumpSum: false,
    active: true,
    bankAccount: '298-0-11223-4 ธ.ไทยพาณิชย์',
  },
  {
    id: 't_10',
    code: 'T010',
    scheduleName: 'วาสนา',
    fullName: 'นางวาสนา รุ่งโรจน์สกุล',
    department: 'งานเทคโนโลยีและข้อมูลสารสนเทศ',
    isLumpSum: true,
    lumpSumType: 'back_office',
    lumpSumAmount: 1000,
    active: true,
    bankAccount: '821-6-55443-2 ธ.กรุงไทย',
  },
];

export const initialClassRosters: ClassRosterItem[] = [
  {
    id: 'cr_01',
    grade: 'ป.1/1',
    studentCount: 32,
    assignedTeacherIds: ['t_01', 't_03'], // โจแอล & สาลี่ (แบ่ง 2 คน)
    splitRule: 'equal',
  },
  {
    id: 'cr_02',
    grade: 'ป.1/2',
    studentCount: 28,
    assignedTeacherIds: ['t_03'], // สาลี่
    splitRule: 'equal',
  },
  {
    id: 'cr_03',
    grade: 'ป.2/1',
    studentCount: 30,
    assignedTeacherIds: ['t_04'], // กิตติพงษ์
    splitRule: 'equal',
  },
  {
    id: 'cr_04',
    grade: 'ป.2/2',
    studentCount: 32,
    assignedTeacherIds: ['t_04', 't_05'], // กิตติพงษ์ & พัชรี (แบ่ง 2 คน)
    splitRule: 'equal',
  },
  {
    id: 'cr_05',
    grade: 'ป.3/1',
    studentCount: 34,
    assignedTeacherIds: ['t_05'], // พัชรี
    splitRule: 'equal',
  },
  {
    id: 'cr_06',
    grade: 'ป.4/1',
    studentCount: 30,
    assignedTeacherIds: ['t_06'], // ธนกร
    splitRule: 'equal',
  },
  {
    id: 'cr_07',
    grade: 'ป.5/1',
    studentCount: 29,
    assignedTeacherIds: ['t_07'], // สมศรี
    splitRule: 'equal',
  },
  {
    id: 'cr_08',
    grade: 'ป.6/1',
    studentCount: 31,
    assignedTeacherIds: ['t_08'], // เอกชัย
    splitRule: 'equal',
  },
  {
    id: 'cr_09',
    grade: 'ม.1/1',
    studentCount: 26,
    assignedTeacherIds: ['t_09'], // นภัสสร
    splitRule: 'equal',
  },
  {
    id: 'cr_10',
    grade: 'ม.2/1',
    studentCount: 24,
    assignedTeacherIds: ['t_10'], // วาสนา
    splitRule: 'equal',
  },
];

// Helper to build assignments for schedule dates
const daysJune = [2, 3, 4, 5, 8, 9, 10, 11, 12, 15, 16, 17, 18, 19, 22, 23, 24, 25, 26, 29, 30];

function generateAssignments(pattern: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  daysJune.forEach((day, index) => {
    result[day.toString()] = pattern[index % pattern.length];
  });
  return result;
}

export const initialJuneSchedule: MonthSchedule = {
  monthId: '2506',
  monthName: 'มิถุนายน 2569',
  academicYear: '2569',
  activeDays: daysJune,
  rows: [
    // Zone 1: Homework
    {
      id: 'sch_hw_1',
      zone: 'homework',
      category: 'ป.1/1',
      title: 'การบ้าน ป.1/1 (32 คน)',
      assignments: generateAssignments(['โจแอล', 'สาลี่']),
    },
    {
      id: 'sch_hw_2',
      zone: 'homework',
      category: 'ป.1/2',
      title: 'การบ้าน ป.1/2 (28 คน)',
      assignments: generateAssignments(['สาลี่']),
    },
    {
      id: 'sch_hw_3',
      zone: 'homework',
      category: 'ป.2/1',
      title: 'การบ้าน ป.2/1 (30 คน)',
      assignments: generateAssignments(['กิตติพงษ์']),
    },
    {
      id: 'sch_hw_4',
      zone: 'homework',
      category: 'ป.2/2',
      title: 'การบ้าน ป.2/2 (32 คน)',
      assignments: generateAssignments(['กิตติพงษ์', 'พัชรี']),
    },
    {
      id: 'sch_hw_5',
      zone: 'homework',
      category: 'ป.3/1',
      title: 'การบ้าน ป.3/1 (34 คน)',
      assignments: generateAssignments(['พัชรี']),
    },
    {
      id: 'sch_hw_6',
      zone: 'homework',
      category: 'ป.4/1',
      title: 'การบ้าน ป.4/1 (30 คน)',
      assignments: generateAssignments(['ธนกร']),
    },
    {
      id: 'sch_hw_7',
      zone: 'homework',
      category: 'ป.5/1',
      title: 'การบ้าน ป.5/1 (29 คน)',
      assignments: generateAssignments(['สมศรี']),
    },
    {
      id: 'sch_hw_8',
      zone: 'homework',
      category: 'ป.6/1',
      title: 'การบ้าน ป.6/1 (31 คน)',
      assignments: generateAssignments(['เอกชัย']),
    },

    // Zone 2: Period teaching (คาบเสริม)
    {
      id: 'sch_p_1',
      zone: 'period',
      category: 'ENG เสริม 1',
      title: 'คาบเสริมภาษาอังกฤษ ป.1-3',
      assignments: generateAssignments(['โจแอล', 'Nili', 'โจแอล', 'Nili', 'โจแอล']),
    },
    {
      id: 'sch_p_2',
      zone: 'period',
      category: 'ENG เสริม 2',
      title: 'คาบเสริมภาษาอังกฤษ ป.4-6',
      assignments: generateAssignments(['Nili', 'Nili', 'โจแอล', 'Nili', 'โจแอล']),
    },
    {
      id: 'sch_p_3',
      zone: 'period',
      category: 'คณิตเข้มข้น',
      title: 'คาบเสริมคณิตศาสตร์เตรียมสอบ',
      assignments: generateAssignments(['กิตติพงษ์', 'กิตติพงษ์', 'กิตติพงษ์', 'สาลี่', 'กิตติพงษ์']),
    },
    {
      id: 'sch_p_4',
      zone: 'period',
      category: 'วิทย์ทดลอง',
      title: 'คาบเสริมปฏิบัติการวิทย์ ม.ต้น',
      assignments: generateAssignments(['พัชรี', 'พัชรี', 'นภัสสร', 'พัชรี', 'พัชรี']),
    },

    // Zone 3: Daily duty (จัดการประจำวัน) - แต่ละวันจะมีครูประจำมากกว่า 2 คน
    {
      id: 'sch_d_1',
      zone: 'daily_duty',
      category: 'เวรจราจรหน้า รร.',
      title: 'เวรดูแลความปลอดภัยและการจราจรเช้า (3 คน/วัน)',
      assignments: generateAssignments([
        'เอกชัย, ธนกร, กิตติพงษ์',
        'เอกชัย, ธนกร, สมศรี',
        'ธนกร, กิตติพงษ์, เอกชัย',
        'เอกชัย, กิตติพงษ์, วาสนา',
      ]),
    },
    {
      id: 'sch_d_2',
      zone: 'daily_duty',
      category: 'เวรประตู/คัดกรอง',
      title: 'เวรต้อนรับและคัดกรองนักเรียนเช้า (3 คน/วัน)',
      assignments: generateAssignments([
        'สมศรี, สาลี่, นภัสสร',
        'สาลี่, วาสนา, พัชรี',
        'สมศรี, นภัสสร, พัชรี',
        'วาสนา, พัชรี, สาลี่',
      ]),
    },
    {
      id: 'sch_d_3',
      zone: 'daily_duty',
      category: 'เวรประจำอาคาร/กลางวัน',
      title: 'เวรตรวจความเรียบร้อยมื้อกลางวัน (3-4 คน/วัน)',
      assignments: generateAssignments([
        'โจแอล, Nili, สาลี่, สมศรี',
        'Nili, โจแอล, ธนกร, พัชรี',
        'สาลี่, สมศรี, โจแอล, Nili',
        'พัชรี, ธนกร, Nili, สมศรี',
      ]),
    },
    {
      id: 'sch_d_4',
      zone: 'daily_duty',
      category: 'เวรรถรับส่ง/เย็น',
      title: 'เวรดูแลนักเรียนขึ้นรถรับส่งตอนเย็น (3 คน/วัน)',
      assignments: generateAssignments([
        'เอกชัย, วาสนา, กิตติพงษ์',
        'เอกชัย, ธนกร, นภัสสร',
        'วาสนา, กิตติพงษ์, เอกชัย',
        'กิตติพงษ์, นภัสสร, ธนกร',
      ]),
    },
  ],
};

// Also generate July 2569 (2507) for cross-month comparison demonstration
const daysJuly = [1, 2, 3, 6, 7, 8, 9, 10, 13, 14, 15, 16, 17, 20, 21, 22, 23, 24, 27, 28, 29, 30]; // 22 days

export const initialJulySchedule: MonthSchedule = {
  monthId: '2507',
  monthName: 'กรกฎาคม 2569',
  academicYear: '2569',
  activeDays: daysJuly,
  rows: [
    ...initialJuneSchedule.rows.map(r => ({
      ...r,
      id: `jul_${r.id}`,
      assignments: Object.fromEntries(
        daysJuly.map((d, i) => [d.toString(), Object.values(r.assignments)[i % Object.values(r.assignments).length]])
      ),
    })),
  ],
};

export const initialUsers: User[] = [
  {
    id: 'u_kitsaphon',
    username: 'kitsaphon',
    displayName: 'อ.กฤษณะพงศ์ (ฝ่ายวิชาการ/การเงิน)',
    role: 'admin',
    email: 'kitsaphon@tr.ac.th',
    workspaceAccount: 'kitsaphon@tr.ac.th',
  },
  {
    id: 'u_admin',
    username: 'admin',
    displayName: 'อ.ศิริพร (ฝ่ายวิชาการ/การเงิน)',
    role: 'admin',
    email: 'academic@tr.ac.th',
    workspaceAccount: 'academic@tr.ac.th',
  },
  {
    id: 'u_joel',
    username: 'joel',
    displayName: 'โจแอล มาร์ติน (ครู)',
    role: 'teacher',
    teacherId: 't_01',
    email: 'joel@tr.ac.th',
    workspaceAccount: 'joel@tr.ac.th',
  },
  {
    id: 'u_nili',
    username: 'nili',
    displayName: 'Nili Sharma (ครู)',
    role: 'teacher',
    teacherId: 't_02',
    email: 'nili@tr.ac.th',
    workspaceAccount: 'nili@tr.ac.th',
  },
  {
    id: 'u_salee',
    username: 'salee',
    displayName: 'สาลี่ แสนสุข (ครู)',
    role: 'teacher',
    teacherId: 't_03',
    email: 'salee@tr.ac.th',
    workspaceAccount: 'salee@tr.ac.th',
  },
  {
    id: 'u_kittipong',
    username: 'kittipong',
    displayName: 'กิตติพงษ์ วัฒนาพาณิชย์ (ครู)',
    role: 'teacher',
    teacherId: 't_04',
    email: 'kittipong@tr.ac.th',
    workspaceAccount: 'kittipong@tr.ac.th',
  },
  {
    id: 'u_patcharee',
    username: 'patcharee',
    displayName: 'พัชรี สุวรรณเมธา (ครู/กศพ.)',
    role: 'teacher',
    teacherId: 't_05',
    email: 'patcharee@tr.ac.th',
    workspaceAccount: 'patcharee@tr.ac.th',
  },
  {
    id: 'u_thanakorn',
    username: 'thanakorn',
    displayName: 'ธนกร สดใสศิริ (ครู/Back Office)',
    role: 'teacher',
    teacherId: 't_06',
    email: 'thanakorn@tr.ac.th',
    workspaceAccount: 'thanakorn@tr.ac.th',
  },
];

// Initialize pre-calculated monthly records
export function createInitialMonthRecords(): Record<string, MonthlyRecord> {
  const juneResult = runCalculationEngine(
    initialJuneSchedule,
    initialTeachers,
    initialDutyRates,
    initialClassRosters
  );

  // Add realistic absence and substitution adjustments for June demonstration
  // e.g. สาลี่ ขาด 1 วัน, กิตติพงษ์ สอนแทน 500 บาท
  const adjustedJuneRows = juneResult.detailRows.map(row => {
    if (row.teacherName === 'สาลี่' && row.dutyType === 'homework') {
      const absentDays = 1;
      const deduction = Math.round(absentDays * row.dailyRate * 100) / 100;
      const net = row.grossAmount - deduction;
      return {
        ...row,
        absentDays,
        deduction,
        netAmount: net,
        finalTotal: net,
        notes: 'ลากิจ 1 วัน (หักตามสัดส่วนเฉลี่ยวันทำงาน)',
      };
    }
    if (row.teacherName === 'กิตติพงษ์' && row.dutyType === 'period') {
      const substituteAmount = 460; // สอนแทน 2 คาบ
      return {
        ...row,
        substituteAmount,
        finalTotal: row.netAmount + substituteAmount,
        notes: 'สอนแทนคาบเสริมวิทย์ 2 คาบ (+460 บาท)',
      };
    }
    return row;
  });

  const reJune = runCalculationEngine(
    initialJuneSchedule,
    initialTeachers,
    initialDutyRates,
    initialClassRosters,
    adjustedJuneRows
  );

  const initialAbsenceLogs = [
    {
      id: 'abs_01',
      monthId: '2506',
      dateStr: '12 มิ.ย. 2569',
      absentTeacherId: 't_03',
      absentTeacherName: 'สาลี่',
      dutyType: 'homework' as const,
      category: 'ป.1/1',
      daysCount: 1,
      reason: 'ลากิจไปติดต่อราชการ',
      substitutePayAmount: 0,
      loggedAt: new Date().toISOString(),
    },
    {
      id: 'abs_02',
      monthId: '2506',
      dateStr: '17 มิ.ย. 2569',
      absentTeacherId: 't_05',
      absentTeacherName: 'พัชรี',
      dutyType: 'period' as const,
      category: 'วิทย์ทดลอง',
      daysCount: 1,
      substituteTeacherId: 't_04',
      substituteTeacherName: 'กิตติพงษ์',
      substitutePayAmount: 460,
      reason: 'ไปราชการอบรม สพฐ. (กิตติพงษ์ สอนแทน 2 คาบ)',
      loggedAt: new Date().toISOString(),
    },
  ];

  const juneRecord: MonthlyRecord = {
    monthId: '2506',
    monthName: 'มิถุนายน 2569',
    year: 2569,
    monthNum: 6,
    status: 'draft',
    workingDaysCount: juneResult.workingDays,
    schedule: initialJuneSchedule,
    detailRows: reJune.detailRows,
    summaries: reJune.summaries,
    totalSchoolBudget: reJune.totalBudget,
    absenceLogs: initialAbsenceLogs,
    updatedAt: new Date().toISOString(),
  };

  const julyResult = runCalculationEngine(
    initialJulySchedule,
    initialTeachers,
    initialDutyRates,
    initialClassRosters
  );

  const julyRecord: MonthlyRecord = {
    monthId: '2507',
    monthName: 'กรกฎาคม 2569',
    year: 2569,
    monthNum: 7,
    status: 'draft',
    workingDaysCount: julyResult.workingDays,
    schedule: initialJulySchedule,
    detailRows: julyResult.detailRows,
    summaries: julyResult.summaries,
    totalSchoolBudget: julyResult.totalBudget,
    updatedAt: new Date().toISOString(),
  };

  return {
    '2506': juneRecord,
    '2507': julyRecord,
  };
}
