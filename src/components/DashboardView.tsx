import React from 'react';
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  Download,
  FileSpreadsheet,
  FileText,
  Lock,
  ShieldCheck,
  TrendingUp,
  Unlock,
  UserCheck,
  Users
} from 'lucide-react';
import { DutyRate, MonthlyRecord, SchoolConfig, Teacher, User } from '../types';
import { formatCount, formatCurrency } from '../services/calculationEngine';
import { exportMonthlyCalculationToExcel } from '../services/excelService';

interface DashboardViewProps {
  record: MonthlyRecord;
  currentUser: User;
  teachers: Teacher[];
  dutyRates: DutyRate[];
  config: SchoolConfig;
  onNavigateTab: (tab: string) => void;
  onLockToggle: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  record,
  currentUser,
  teachers,
  dutyRates,
  config,
  onNavigateTab,
  onLockToggle,
}) => {
  // If user is teacher, find their summary
  const mySummary = currentUser.teacherId
    ? record.summaries.find(s => s.teacherId === currentUser.teacherId)
    : null;

  // Aggregate stats
  const totalHomework = record.summaries.reduce((a, b) => a + b.homeworkAmount, 0);
  const totalPeriods = record.summaries.reduce((a, b) => a + b.periodAmount, 0);
  const totalDailyDuty = record.summaries.reduce((a, b) => a + b.dailyDutyAmount, 0);
  const totalLumpSum = record.summaries.reduce((a, b) => a + b.lumpSumAmount, 0);
  const totalDeductions = record.summaries.reduce((a, b) => a + b.totalDeduction, 0);
  const totalSubstitutes = record.summaries.reduce((a, b) => a + b.totalSubstitute, 0);

  // Count total period slots and duty days
  const totalPeriodSlots = record.detailRows
    .filter(r => r.dutyType === 'period')
    .reduce((a, b) => a + b.quantity, 0);

  const totalDutyDaysAssigned = record.detailRows
    .filter(r => r.dutyType === 'daily_duty')
    .reduce((a, b) => a + b.quantity, 0);

  const isLocked = record.status === 'locked';

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner Alert / Period Status */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-2xl p-5 sm:p-7 shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-400/20 text-indigo-200 border border-indigo-300/30">
                {record.monthName} · งวด {record.monthId}
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  isLocked
                    ? 'bg-amber-400/20 text-amber-200 border border-amber-300/30'
                    : 'bg-emerald-400/20 text-emerald-200 border border-emerald-300/30'
                }`}
              >
                {isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                {isLocked ? 'ปิดงวดสมบูรณ์ (ตัวเลขถูกล็อก)' : 'ฉบับร่าง (กำลังตรวจสอบ/ปรับปรุง)'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              ระบบคำนวณเงินสอนพิเศษและค่าตอบแทน
            </h1>
            <p className="text-indigo-200 text-xs sm:text-sm mt-1 max-w-2xl">
              โรงเรียนตันตรารักษ์ · ตรรกะรวมศูนย์ ตรวจสอบย้อนได้ทุกขั้นตอน ปราศจากข้อผิดพลาด #VALUE!
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {currentUser.role === 'admin' && (
              <button
                onClick={onLockToggle}
                className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all shadow-xs ${
                  isLocked
                    ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                    : 'bg-amber-500 hover:bg-amber-600 text-white'
                }`}
              >
                {isLocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                <span>{isLocked ? 'ปลดล็อกเพื่อแก้ไข' : 'ปิดงวดประจำเดือน'}</span>
              </button>
            )}

            <button
              onClick={() => exportMonthlyCalculationToExcel(record, config.schoolName)}
              className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 transition-all shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>ส่งออก Excel (.xlsx)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Teacher View: Personal Highlights */}
      {currentUser.role === 'teacher' && mySummary && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-indigo-200 rounded-2xl p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-xs">
                {mySummary.teacherScheduleName.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                    ข้อมูลค่าตอบแทนของคุณ
                  </span>
                  <span className="text-xs text-slate-500">{mySummary.department}</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                  {mySummary.teacherFullName} ({mySummary.teacherScheduleName})
                </h3>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600 mt-1">
                  <span>การบ้าน: <strong>{formatCurrency(mySummary.homeworkAmount)}</strong> ฿</span>
                  <span>คาบเสริม: <strong>{formatCurrency(mySummary.periodAmount)}</strong> ฿</span>
                  <span>เวรประจำวัน: <strong>{formatCurrency(mySummary.dailyDutyAmount)}</strong> ฿</span>
                  {mySummary.lumpSumAmount > 0 && (
                    <span>เหมาจ่าย: <strong>{formatCurrency(mySummary.lumpSumAmount)}</strong> ฿</span>
                  )}
                  {mySummary.totalDeduction > 0 && (
                    <span className="text-rose-600">หักขาด: <strong>-{formatCurrency(mySummary.totalDeduction)}</strong> ฿</span>
                  )}
                  {mySummary.totalSubstitute > 0 && (
                    <span className="text-emerald-700">สอนแทน: <strong>+{formatCurrency(mySummary.totalSubstitute)}</strong> ฿</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-3 sm:pt-0 border-indigo-100">
              <div className="text-right">
                <div className="text-xs text-slate-500 font-medium">ยอดสุทธิรับจริง</div>
                <div className="text-2xl font-bold text-indigo-700">
                  ฿{formatCurrency(mySummary.grandTotal)}
                </div>
              </div>
              <button
                onClick={() => onNavigateTab('payslips')}
                className="mt-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1 transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>พิมพ์ใบสำคัญรับเงิน (สลิป)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Budget */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">ยอดจ่ายรวมทั้งโรงเรียน</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900">
            ฿{formatCurrency(record.totalSchoolBudget)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>คำนวณสุทธิแล้ว (หักขาด/บวกแทน)</span>
          </div>
        </div>

        {/* Teachers Count */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">จำนวนครูที่ได้รับ</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900">
            {formatCount(record.summaries.length)} <span className="text-xs font-normal text-slate-500">ท่าน</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            จากครูทั้งหมด {teachers.filter(t => t.active).length} ท่านในทะเบียน
          </div>
        </div>

        {/* Working Days Divider */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">วันทำงานของเดือน (ตัวหาร)</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900">
            {record.workingDaysCount} <span className="text-xs font-normal text-slate-500">วัน</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            คำนวณจากคอลัมน์วันที่ในตารางสอน
          </div>
        </div>

        {/* Periods & Duties Count */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">คาบสอนเสริม & วันเวร</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900">
            {totalPeriodSlots} <span className="text-xs font-normal text-slate-500">คาบ</span> · {totalDutyDaysAssigned} <span className="text-xs font-normal text-slate-500">วัน</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            นับอัตโนมัติจากตารางเวร/คาบ
          </div>
        </div>
      </div>

      {/* Duty Category Breakdown Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-600" />
            <span>แยกตามภาระหน้าที่ (4 ภาระงานหลัก)</span>
          </h2>
          <button
            onClick={() => onNavigateTab('calculation')}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            <span>ดูตารางคำนวณฉบับเต็ม</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Homework */}
          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-600">1. การบ้าน</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">
                180 ฿/คน
              </span>
            </div>
            <div className="text-lg font-bold text-slate-900">
              ฿{formatCurrency(totalHomework)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              จ่ายตามจำนวนนักเรียน (กรณี 2 คน หารเท่ากัน 50%)
            </p>
          </div>

          {/* Periods */}
          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-600">2. รายคาบสอนเสริม</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium">
                230 ฿/คาบ
              </span>
            </div>
            <div className="text-lg font-bold text-slate-900">
              ฿{formatCurrency(totalPeriods)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              นับจากชื่อครูในโซนคาบเสริม ({totalPeriodSlots} คาบ)
            </p>
          </div>

          {/* Daily Duty */}
          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-600">3. จัดการประจำวัน (เวร)</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-medium">
                90 ฿/วัน
              </span>
            </div>
            <div className="text-lg font-bold text-slate-900">
              ฿{formatCurrency(totalDailyDuty)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              นับจากชื่อครูในโซนเวรประจำวัน ({totalDutyDaysAssigned} วัน)
            </p>
          </div>

          {/* Lump sum */}
          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-600">4. กศพ. & Back Office</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-medium">
                1,000 - 1,200 ฿
              </span>
            </div>
            <div className="text-lg font-bold text-slate-900">
              ฿{formatCurrency(totalLumpSum)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              เหมาจ่ายรายเดือนคงที่ตามสิทธิ์รายบุคคล
            </p>
          </div>
        </div>
      </div>

      {/* Adjustments Summary Bar if any */}
      {(totalDeductions > 0 || totalSubstitutes > 0) && (
        <div className="bg-slate-100/90 border border-slate-200 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-indigo-600" />
            <span className="font-semibold text-slate-700">รายการปรับปรุงในงวดนี้:</span>
            {totalDeductions > 0 && (
              <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 font-medium">
                หักขาดรวม -฿{formatCurrency(totalDeductions)}
              </span>
            )}
            {totalSubstitutes > 0 && (
              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-medium">
                สอนแทนรวม +฿{formatCurrency(totalSubstitutes)}
              </span>
            )}
          </div>
          <span className="text-slate-500 text-[11px]">
            *คำนวณหักขาดจากสูตร วันขาด × (เงินได้เต็ม ÷ {record.workingDaysCount} วัน)
          </span>
        </div>
      )}

      {/* Teacher Summary Ranking Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              <span>สรุปค่าตอบแทนรายบุคคล ({record.monthName})</span>
            </h3>
            <p className="text-xs text-slate-500">
              เทียบเท่าตารางสรุปขวามือ (SUMIF) เดิม พร้อมแจกแจงทุกองค์ประกอบ
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigateTab('payslips')}
              className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5 text-indigo-600" />
              <span>ดูใบสำคัญรับเงินทั้งหมด</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-2.5 px-3 w-12 text-center">ลำดับ</th>
                <th className="py-2.5 px-3">ชื่อ-สกุล / ชื่อในตาราง</th>
                <th className="py-2.5 px-3">กลุ่มสาระฯ</th>
                <th className="py-2.5 px-3 text-right">การบ้าน (180)</th>
                <th className="py-2.5 px-3 text-right">รายคาบ (230)</th>
                <th className="py-2.5 px-3 text-right">เวรจัดการ (90)</th>
                <th className="py-2.5 px-3 text-right">เหมาจ่าย</th>
                <th className="py-2.5 px-3 text-right text-rose-600">หักขาด</th>
                <th className="py-2.5 px-3 text-right text-emerald-600">สอนแทน</th>
                <th className="py-2.5 px-4 text-right font-bold text-slate-900 bg-indigo-50/50">
                  รวมรับสุทธิ
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {record.summaries.map((s, idx) => (
                <tr
                  key={s.teacherId}
                  className={`hover:bg-slate-50/80 transition-colors ${
                    currentUser.teacherId === s.teacherId ? 'bg-indigo-50/60 font-medium' : ''
                  }`}
                >
                  <td className="py-2.5 px-3 text-center text-slate-400">{idx + 1}</td>
                  <td className="py-2.5 px-3 font-medium text-slate-800">
                    <div>{s.teacherFullName}</div>
                    <span className="text-[10px] text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded font-normal">
                      ชื่อในตาราง: {s.teacherScheduleName}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-500">{s.department}</td>
                  <td className="py-2.5 px-3 text-right text-slate-700">
                    {s.homeworkAmount > 0 ? formatCurrency(s.homeworkAmount) : '-'}
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-700">
                    {s.periodAmount > 0 ? formatCurrency(s.periodAmount) : '-'}
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-700">
                    {s.dailyDutyAmount > 0 ? formatCurrency(s.dailyDutyAmount) : '-'}
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-700">
                    {s.lumpSumAmount > 0 ? formatCurrency(s.lumpSumAmount) : '-'}
                  </td>
                  <td className="py-2.5 px-3 text-right text-rose-600 font-medium">
                    {s.totalDeduction > 0 ? `-${formatCurrency(s.totalDeduction)}` : '-'}
                  </td>
                  <td className="py-2.5 px-3 text-right text-emerald-600 font-medium">
                    {s.totalSubstitute > 0 ? `+${formatCurrency(s.totalSubstitute)}` : '-'}
                  </td>
                  <td className="py-2.5 px-4 text-right font-bold text-indigo-700 bg-indigo-50/30 text-sm">
                    ฿{formatCurrency(s.grandTotal)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                <td colSpan={3} className="py-3 px-3 text-center">
                  ยอดรวมทั้งสิ้น ({record.summaries.length} ท่าน)
                </td>
                <td className="py-3 px-3 text-right text-slate-900">{formatCurrency(totalHomework)}</td>
                <td className="py-3 px-3 text-right text-slate-900">{formatCurrency(totalPeriods)}</td>
                <td className="py-3 px-3 text-right text-slate-900">{formatCurrency(totalDailyDuty)}</td>
                <td className="py-3 px-3 text-right text-slate-900">{formatCurrency(totalLumpSum)}</td>
                <td className="py-3 px-3 text-right text-rose-600">
                  {totalDeductions > 0 ? `-${formatCurrency(totalDeductions)}` : '-'}
                </td>
                <td className="py-3 px-3 text-right text-emerald-600">
                  {totalSubstitutes > 0 ? `+${formatCurrency(totalSubstitutes)}` : '-'}
                </td>
                <td className="py-3 px-4 text-right text-indigo-800 bg-indigo-100/60 text-base">
                  ฿{formatCurrency(record.totalSchoolBudget)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          onClick={() => onNavigateTab('schedule')}
          className="bg-white p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-xs cursor-pointer transition-all flex items-center gap-3.5 group"
        >
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-sm text-slate-800">นำเข้า/แก้ไขตารางสอน</div>
            <div className="text-xs text-slate-500">
              อัปเดตเวรและคาบ ระบบจะนับและคำนวณใหม่ทันที
            </div>
          </div>
        </div>

        <div
          onClick={() => onNavigateTab('calculation')}
          className="bg-white p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-xs cursor-pointer transition-all flex items-center gap-3.5 group"
        >
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-sm text-slate-800">ปรับวันขาด / ค่าสอนแทน</div>
            <div className="text-xs text-slate-500">
              กรอกจำนวนวันขาดหรือเงินสอนแทนต่อแถวแบบเรียลไทม์
            </div>
          </div>
        </div>

        <div
          onClick={() => onNavigateTab('comparison')}
          className="bg-white p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-xs cursor-pointer transition-all flex items-center gap-3.5 group"
        >
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-sm text-slate-800">เปรียบเทียบแนวโน้มข้ามเดือน</div>
            <div className="text-xs text-slate-500">
              วิเคราะห์ส่วนต่าง ยอดขึ้น-ลง รายบุคคลและภาพรวม
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
