import React, { useState } from 'react';
import {
  AlertCircle,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  Download,
  Edit2,
  FileSpreadsheet,
  Filter,
  Info,
  Lock,
  Plus,
  Printer,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Trash2,
  Unlock,
  UserCheck,
  Users
} from 'lucide-react';
import { AbsenceSubLog, CalcDetailRow, MonthlyRecord, SchoolConfig, Teacher, TeacherSummary, User } from '../types';
import { formatCount, formatCurrency } from '../services/calculationEngine';
import { exportMonthlyCalculationToExcel } from '../services/excelService';

interface CalculationViewProps {
  record: MonthlyRecord;
  currentUser: User;
  config: SchoolConfig;
  teachers?: Teacher[];
  onUpdateDetailRow: (rowId: string, absentDays: number, substituteAmount: number, notes?: string) => void;
  onRecalculateAll: () => void;
  onToggleLock: () => void;
  onAddAbsenceLog?: (log: Omit<AbsenceSubLog, 'id' | 'monthId' | 'loggedAt'>) => void;
  onDeleteAbsenceLog?: (logId: string) => void;
}

export const CalculationView: React.FC<CalculationViewProps> = ({
  record,
  currentUser,
  config,
  teachers = [],
  onUpdateDetailRow,
  onRecalculateAll,
  onToggleLock,
  onAddAbsenceLog,
  onDeleteAbsenceLog,
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'summaries' | 'absence_logs'>('details');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDuty, setFilterDuty] = useState<string>('all');
  const [editingRowId, setEditingRowId] = useState<string | null>(null);

  // Absence log modal state
  const [showLogModal, setShowLogModal] = useState(false);
  const [logDateStr, setLogDateStr] = useState('15 มิ.ย. 2569');
  const [logTeacherId, setLogTeacherId] = useState(teachers[0]?.id || '');
  const [logDutyType, setLogDutyType] = useState<'homework' | 'period' | 'daily_duty'>('period');
  const [logCategory, setLogCategory] = useState('');
  const [logDaysCount, setLogDaysCount] = useState<number>(1);
  const [logSubTeacherId, setLogSubTeacherId] = useState('');
  const [logSubAmount, setLogSubAmount] = useState<number>(460);
  const [logReason, setLogReason] = useState('ลากิจ / ไปราชการ');

  // Editing state for inline edits
  const [editAbsentDays, setEditAbsentDays] = useState<number>(0);
  const [editSubstitute, setEditSubstitute] = useState<number>(0);
  const [editNotes, setEditNotes] = useState<string>('');

  const isLocked = record.status === 'locked';

  const startEdit = (row: CalcDetailRow) => {
    if (isLocked || currentUser.role !== 'admin') return;
    setEditingRowId(row.id);
    setEditAbsentDays(row.absentDays);
    setEditSubstitute(row.substituteAmount);
    setEditNotes(row.notes || '');
  };

  const saveEdit = (rowId: string) => {
    onUpdateDetailRow(rowId, editAbsentDays, editSubstitute, editNotes);
    setEditingRowId(null);
  };

  const cancelEdit = () => {
    setEditingRowId(null);
  };

  const handleCreateAbsenceLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onAddAbsenceLog) return;
    const absentTeacher = teachers.find(t => t.id === logTeacherId);
    const subTeacher = teachers.find(t => t.id === logSubTeacherId);

    onAddAbsenceLog({
      dateStr: logDateStr,
      absentTeacherId: logTeacherId,
      absentTeacherName: absentTeacher?.scheduleName || 'ครู',
      dutyType: logDutyType,
      category: logCategory || (logDutyType === 'homework' ? 'การบ้าน' : 'คาบเสริม'),
      daysCount: logDaysCount,
      substituteTeacherId: logSubTeacherId || undefined,
      substituteTeacherName: subTeacher?.scheduleName || undefined,
      substitutePayAmount: logSubAmount,
      reason: logReason,
    });

    setShowLogModal(false);
  };

  // Filtered detail rows
  const filteredRows = record.detailRows.filter(row => {
    // If teacher, only show their own rows unless they clicked to see all
    if (currentUser.role === 'teacher' && currentUser.teacherId && row.teacherId !== currentUser.teacherId) {
      return false;
    }

    if (filterDuty !== 'all' && row.dutyType !== filterDuty) {
      return false;
    }

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchName = row.teacherName.toLowerCase().includes(q);
      const matchCat = row.category.toLowerCase().includes(q);
      const matchDuty = row.dutyName.toLowerCase().includes(q);
      return matchName || matchCat || matchDuty;
    }

    return true;
  });

  // Filtered summaries
  const filteredSummaries = record.summaries.filter(s => {
    if (currentUser.role === 'teacher' && currentUser.teacherId && s.teacherId !== currentUser.teacherId) {
      return false;
    }
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        s.teacherFullName.toLowerCase().includes(q) ||
        s.teacherScheduleName.toLowerCase().includes(q) ||
        s.department.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Totals for filtered view
  const sumGross = filteredRows.reduce((a, b) => a + b.grossAmount, 0);
  const sumDeduct = filteredRows.reduce((a, b) => a + b.deduction, 0);
  const sumSub = filteredRows.reduce((a, b) => a + b.substituteAmount, 0);
  const sumNet = filteredRows.reduce((a, b) => a + b.finalTotal, 0);

  return (
    <div className="space-y-5 pb-16">
      {/* Title & Control Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              ตารางคำนวณเงินสอนพิเศษและค่าตอบแทน
            </h1>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1 ${
                isLocked ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
              {isLocked ? 'ปิดงวดแล้ว' : 'ฉบับร่าง'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            ประจำเดือน <strong className="text-slate-700">{record.monthName}</strong> · ตัวหารวันทำงาน:{' '}
            <strong className="text-slate-700">{record.workingDaysCount} วัน</strong> (คำนวณอัตโนมัติจากตารางสอน)
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {currentUser.role === 'admin' && (
            <>
              <button
                onClick={onRecalculateAll}
                disabled={isLocked}
                title="คำนวณใหม่จากตารางสอน"
                className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  isLocked
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
                }`}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>คำนวณใหม่จากตาราง</span>
              </button>

              <button
                onClick={onToggleLock}
                className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  isLocked
                    ? 'bg-amber-100 hover:bg-amber-200 text-amber-900'
                    : 'bg-slate-800 hover:bg-slate-900 text-white'
                }`}
              >
                {isLocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                <span>{isLocked ? 'ปลดล็อกเพื่อแก้ไข' : 'ปิดงวดนี้ (Freeze)'}</span>
              </button>
            </>
          )}

          <button
            onClick={() => exportMonthlyCalculationToExcel(record, config.schoolName)}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Excel (.xlsx)</span>
          </button>

          <button
            onClick={() => window.print()}
            className="px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>พิมพ์</span>
          </button>
        </div>
      </div>

      {/* Tabs & Search / Filter Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
        {/* View Switcher */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 self-start">
          <button
            onClick={() => setActiveTab('details')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === 'details'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            มุมมองรายการ (Calc_{record.monthId})
          </button>
          <button
            onClick={() => setActiveTab('summaries')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === 'summaries'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            มุมมองสรุปรายคน (CalcSummary_{record.monthId})
          </button>
          <button
            onClick={() => setActiveTab('absence_logs')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'absence_logs'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>บันทึกขาด-สอนแทน (Phase 2)</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === 'absence_logs' ? 'bg-white text-indigo-700' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {record.absenceLogs?.length || 0}
            </span>
          </button>
        </div>

        {/* Filter and Search */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Duty Type filter */}
          {activeTab === 'details' && (
            <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={filterDuty}
                onChange={e => setFilterDuty(e.target.value)}
                className="bg-transparent border-none text-xs text-slate-700 font-medium focus:outline-none"
              >
                <option value="all">ทุกภาระหน้าที่</option>
                <option value="homework">การบ้าน (180 บ.)</option>
                <option value="period">รายคาบ (230 บ.)</option>
                <option value="daily_duty">จัดการประจำวัน (90 บ.)</option>
                <option value="special_coordinator">กศพ. (1,000 บ.)</option>
                <option value="back_office">Back Office</option>
              </select>
            </div>
          )}

          {/* Search box */}
          <div className="relative min-w-[200px] flex-1 sm:flex-initial">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ค้นหาชื่อครู, ห้อง หรือภาระ..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Notice about formula logic */}
      <div className="bg-blue-50/70 border border-blue-200/60 rounded-xl p-3 flex items-start gap-2.5 text-xs text-blue-900">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong>ตรรกะคำนวณมาตรฐาน:</strong> เฉลี่ยต่อวัน = (เงินได้เต็ม ÷ {record.workingDaysCount} วันทำงาน) ·
          หักขาด = (วันขาด × เฉลี่ยต่อวัน) · ยอดสุทธิ = (เงินได้เต็ม − หักขาด + สอนแทน) ·
          {currentUser.role === 'admin' && !isLocked
            ? ' ท่านสามารถคลิกที่ปุ่มดินสอหรือเซลล์ วันขาด / สอนแทน เพื่อแก้ไขและคำนวณใหม่ได้ทันที'
            : ' ขณะนี้อยู่ในโหมดอ่านอย่างเดียว'}
        </div>
      </div>

      {/* Main Table: Details Tab */}
      {activeTab === 'details' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-semibold select-none">
                  <th className="py-2.5 px-3 w-10 text-center">ที่</th>
                  <th className="py-2.5 px-3">ระดับชั้น/งาน</th>
                  <th className="py-2.5 px-3">ชื่อครู</th>
                  <th className="py-2.5 px-3">ภาระหน้าที่</th>
                  <th className="py-2.5 px-3 text-right">อัตรา</th>
                  <th className="py-2.5 px-3 text-right">ปริมาณ</th>
                  <th className="py-2.5 px-2 text-center">หน่วย</th>
                  <th className="py-2.5 px-3 text-right font-medium text-slate-600">เงินได้เต็ม</th>
                  <th className="py-2.5 px-3 text-center bg-amber-50/60 text-amber-900 border-x border-amber-200">
                    วันขาด
                  </th>
                  <th className="py-2.5 px-3 text-right text-slate-500">เฉลี่ย/วัน</th>
                  <th className="py-2.5 px-3 text-right text-rose-600">หักขาด</th>
                  <th className="py-2.5 px-3 text-right font-medium text-slate-700">เงินสุทธิ</th>
                  <th className="py-2.5 px-3 text-center bg-emerald-50/60 text-emerald-900 border-x border-emerald-200">
                    สอนแทน (+)
                  </th>
                  <th className="py-2.5 px-4 text-right font-bold text-indigo-900 bg-indigo-50/70">
                    รวมจ่ายสุทธิ
                  </th>
                  {currentUser.role === 'admin' && !isLocked && (
                    <th className="py-2.5 px-3 text-center w-16">แก้ไข</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150">
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={15} className="py-8 text-center text-slate-400">
                      ไม่พบข้อมูลที่ตรงกับเงื่อนไขการค้นหา
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row, idx) => {
                    const isEditing = editingRowId === row.id;

                    return (
                      <tr
                        key={row.id}
                        className={`hover:bg-slate-50 transition-colors ${
                          row.absentDays > 0 ? 'bg-amber-50/20' : ''
                        } ${row.substituteAmount > 0 ? 'bg-emerald-50/20' : ''}`}
                      >
                        <td className="py-2.5 px-3 text-center text-slate-400">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-medium text-slate-800">
                          <div>{row.category}</div>
                          {row.notes && (
                            <span className="text-[10px] text-slate-400 block truncate max-w-[140px]" title={row.notes}>
                              {row.notes}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{row.teacherName}</td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                              row.dutyType === 'homework'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : row.dutyType === 'period'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : row.dutyType === 'daily_duty'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-purple-50 text-purple-700 border border-purple-200'
                            }`}
                          >
                            {row.dutyName}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-600">{formatCurrency(row.rate)}</td>
                        <td className="py-2.5 px-3 text-right font-medium text-slate-800">
                          {row.quantity}
                        </td>
                        <td className="py-2.5 px-2 text-center text-slate-400 text-[11px]">{row.unit}</td>
                        <td className="py-2.5 px-3 text-right font-medium text-slate-700">
                          {formatCurrency(row.grossAmount)}
                        </td>

                        {/* Inline Edit or Display for Absent Days */}
                        <td className="py-2 px-2 text-center bg-amber-50/30 border-x border-amber-100">
                          {isEditing ? (
                            <input
                              type="number"
                              min={0}
                              max={record.workingDaysCount}
                              step={0.5}
                              value={editAbsentDays}
                              onChange={e => setEditAbsentDays(parseFloat(e.target.value) || 0)}
                              className="w-16 text-center py-1 border border-amber-300 rounded bg-white font-bold text-amber-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                            />
                          ) : (
                            <span
                              onClick={() => startEdit(row)}
                              className={`px-2 py-0.5 rounded cursor-pointer ${
                                row.absentDays > 0
                                  ? 'bg-rose-100 text-rose-800 font-bold'
                                  : 'text-slate-400 hover:text-slate-700 hover:underline'
                              }`}
                            >
                              {row.absentDays > 0 ? `${row.absentDays} วัน` : '0'}
                            </span>
                          )}
                        </td>

                        <td className="py-2.5 px-3 text-right text-slate-500">{formatCurrency(row.dailyRate)}</td>
                        <td className="py-2.5 px-3 text-right text-rose-600 font-medium">
                          {row.deduction > 0 ? `-${formatCurrency(row.deduction)}` : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-medium text-slate-700">
                          {formatCurrency(row.netAmount)}
                        </td>

                        {/* Inline Edit or Display for Substitute Amount */}
                        <td className="py-2 px-2 text-center bg-emerald-50/30 border-x border-emerald-100">
                          {isEditing ? (
                            <input
                              type="number"
                              min={0}
                              step={50}
                              value={editSubstitute}
                              onChange={e => setEditSubstitute(parseFloat(e.target.value) || 0)}
                              className="w-20 text-center py-1 border border-emerald-300 rounded bg-white font-bold text-emerald-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                          ) : (
                            <span
                              onClick={() => startEdit(row)}
                              className={`px-2 py-0.5 rounded cursor-pointer ${
                                row.substituteAmount > 0
                                  ? 'bg-emerald-100 text-emerald-800 font-bold'
                                  : 'text-slate-400 hover:text-slate-700 hover:underline'
                              }`}
                            >
                              {row.substituteAmount > 0 ? `+${formatCurrency(row.substituteAmount)}` : '0'}
                            </span>
                          )}
                        </td>

                        <td className="py-2.5 px-4 text-right font-bold text-indigo-800 bg-indigo-50/40 text-sm">
                          ฿{formatCurrency(row.finalTotal)}
                        </td>

                        {/* Edit Buttons */}
                        {currentUser.role === 'admin' && !isLocked && (
                          <td className="py-2 px-2 text-center">
                            {isEditing ? (
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => saveEdit(row.id)}
                                  title="บันทึก"
                                  className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-700"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={cancelEdit}
                                  title="ยกเลิก"
                                  className="p-1 rounded bg-slate-200 text-slate-700 hover:bg-slate-300"
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => startEdit(row)}
                                title="ปรับวันขาด / ค่าสอนแทน"
                                className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                  <td colSpan={7} className="py-3 px-3 text-center">
                    ยอดรวมแถวที่แสดง ({filteredRows.length} รายการ)
                  </td>
                  <td className="py-3 px-3 text-right">{formatCurrency(sumGross)}</td>
                  <td className="py-3 px-3 text-center text-slate-500 bg-amber-100/40">-</td>
                  <td className="py-3 px-3 text-right text-slate-500">-</td>
                  <td className="py-3 px-3 text-right text-rose-600">
                    {sumDeduct > 0 ? `-${formatCurrency(sumDeduct)}` : '-'}
                  </td>
                  <td className="py-3 px-3 text-right">{formatCurrency(sumGross - sumDeduct)}</td>
                  <td className="py-3 px-3 text-right text-emerald-600 bg-emerald-100/40">
                    {sumSub > 0 ? `+${formatCurrency(sumSub)}` : '-'}
                  </td>
                  <td className="py-3 px-4 text-right text-indigo-900 bg-indigo-100/60 text-base">
                    ฿{formatCurrency(sumNet)}
                  </td>
                  {currentUser.role === 'admin' && !isLocked && <td />}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Summary View Tab (SUMIF equivalent) */}
      {activeTab === 'summaries' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                <span>ตารางสรุปจ่ายรายบุคคล (CalcSummary_{record.monthId})</span>
              </h3>
              <p className="text-xs text-slate-500">
                รวมยอดอัตโนมัติจากทุกรายการภาระหน้าที่ของครูแต่ละคน
              </p>
            </div>
            <div className="text-xs font-semibold text-slate-600">
              รวมทั้งหมด {filteredSummaries.length} ท่าน
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold">
                  <th className="py-2.5 px-3 w-12 text-center">ลำดับ</th>
                  <th className="py-2.5 px-3">ชื่อ-สกุลเต็ม</th>
                  <th className="py-2.5 px-3">ชื่อในตาราง</th>
                  <th className="py-2.5 px-3">กลุ่มสาระฯ</th>
                  <th className="py-2.5 px-3 text-right">การบ้าน</th>
                  <th className="py-2.5 px-3 text-right">รายคาบ</th>
                  <th className="py-2.5 px-3 text-right">เวรจัดการ</th>
                  <th className="py-2.5 px-3 text-right">เหมาจ่าย</th>
                  <th className="py-2.5 px-3 text-right text-rose-600">หักขาด</th>
                  <th className="py-2.5 px-3 text-right text-emerald-600">สอนแทน</th>
                  <th className="py-2.5 px-4 text-right font-bold text-slate-900 bg-indigo-50/50">
                    ยอดสุทธิรับจริง
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSummaries.map((s, idx) => (
                  <tr key={s.teacherId} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 text-center text-slate-400">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{s.teacherFullName}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-medium">
                        {s.teacherScheduleName}
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
                  <td colSpan={4} className="py-3 px-3 text-center">
                    ยอดรวมสรุป ({filteredSummaries.length} ท่าน)
                  </td>
                  <td className="py-3 px-3 text-right">
                    {formatCurrency(filteredSummaries.reduce((a, b) => a + b.homeworkAmount, 0))}
                  </td>
                  <td className="py-3 px-3 text-right">
                    {formatCurrency(filteredSummaries.reduce((a, b) => a + b.periodAmount, 0))}
                  </td>
                  <td className="py-3 px-3 text-right">
                    {formatCurrency(filteredSummaries.reduce((a, b) => a + b.dailyDutyAmount, 0))}
                  </td>
                  <td className="py-3 px-3 text-right">
                    {formatCurrency(filteredSummaries.reduce((a, b) => a + b.lumpSumAmount, 0))}
                  </td>
                  <td className="py-3 px-3 text-right text-rose-600">
                    -{formatCurrency(filteredSummaries.reduce((a, b) => a + b.totalDeduction, 0))}
                  </td>
                  <td className="py-3 px-3 text-right text-emerald-600">
                    +{formatCurrency(filteredSummaries.reduce((a, b) => a + b.totalSubstitute, 0))}
                  </td>
                  <td className="py-3 px-4 text-right text-indigo-800 bg-indigo-100/60 text-base">
                    ฿{formatCurrency(filteredSummaries.reduce((a, b) => a + b.grandTotal, 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Absence & Substitution Log View (Phase 2 Automated Sync) */}
      {activeTab === 'absence_logs' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden space-y-4 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-800 text-base">
                  บันทึกการขาด-ลาและสอนแทนรายวัน (Phase 2 Auto-Sync Log)
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                  เชื่อมโยงคำนวณอัตโนมัติ
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                รายการที่บันทึกที่นี่จะถูกส่งไปคำนวณหักขาดและบวกค่าสอนแทนในตารางคำนวณทันทีโดยไม่ต้องพิมพ์มือ
              </p>
            </div>

            {currentUser.role === 'admin' && !isLocked && (
              <button
                onClick={() => setShowLogModal(true)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 shadow-2xs transition-colors self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ บันทึกการขาด/สอนแทน</span>
              </button>
            )}
          </div>

          {/* Logs Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                  <th className="py-2.5 px-3 w-12 text-center">ลำดับ</th>
                  <th className="py-2.5 px-3">วันที่เกิดเหตุ</th>
                  <th className="py-2.5 px-3">ครูที่ขาด/ลา</th>
                  <th className="py-2.5 px-3">ภาระหน้าที่ / ชั้นเรียน</th>
                  <th className="py-2.5 px-3 text-center">จำนวนวัน</th>
                  <th className="py-2.5 px-3">เหตุผล</th>
                  <th className="py-2.5 px-3">ครูผู้สอนแทน</th>
                  <th className="py-2.5 px-3 text-right">เงินสอนแทน (+)</th>
                  {currentUser.role === 'admin' && !isLocked && (
                    <th className="py-2.5 px-3 text-center w-16">จัดการ</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {!record.absenceLogs || record.absenceLogs.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      ยังไม่มีรายการบันทึกการขาดหรือสอนแทนในงวดนี้
                    </td>
                  </tr>
                ) : (
                  record.absenceLogs.map((log, idx) => (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 text-center text-slate-400">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-700">{log.dateStr}</td>
                      <td className="py-2.5 px-3 font-bold text-rose-700">{log.absentTeacherName}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-800">
                        {log.dutyType === 'homework'
                          ? 'การบ้าน'
                          : log.dutyType === 'period'
                          ? 'รายคาบ'
                          : 'เวรประจำวัน'}{' '}
                        ({log.category})
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-rose-600">
                        {log.daysCount} วัน
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">{log.reason}</td>
                      <td className="py-2.5 px-3 font-bold text-emerald-700">
                        {log.substituteTeacherName ? log.substituteTeacherName : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-600">
                        {log.substitutePayAmount > 0 ? `+฿${formatCurrency(log.substitutePayAmount)}` : '-'}
                      </td>
                      {currentUser.role === 'admin' && !isLocked && (
                        <td className="py-2.5 px-3 text-center">
                          <button
                            onClick={() => {
                              if (window.confirm('คุณต้องการลบรายการบันทึกนี้และคำนวณใหม่ใช่หรือไม่?')) {
                                onDeleteAbsenceLog && onDeleteAbsenceLog(log.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded"
                            title="ลบรายการนี้"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Add Absence Log */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateAbsenceLog}
            className="bg-white rounded-2xl p-5 sm:p-6 max-w-lg w-full shadow-2xl space-y-4 text-xs"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  บันทึกการขาด-ลาและผู้สอนแทน (Phase 2)
                </h3>
                <p className="text-[11px] text-slate-500">
                  ระบบจะหักขาดและเพิ่มค่าสอนแทนลงในตารางคำนวณให้โดยอัตโนมัติ
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowLogModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">วันที่เกิดเหตุ</label>
                <input
                  type="text"
                  value={logDateStr}
                  onChange={e => setLogDateStr(e.target.value)}
                  placeholder="เช่น 15 มิ.ย. 2569"
                  className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">ครูที่ขาด/ลา *</label>
                <select
                  value={logTeacherId}
                  onChange={e => setLogTeacherId(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
                >
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.scheduleName} ({t.fullName})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">ประเภทภาระหน้าที่</label>
                <select
                  value={logDutyType}
                  onChange={e => setLogDutyType(e.target.value as any)}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="homework">การบ้าน (180 บ./คน)</option>
                  <option value="period">รายคาบ (230 บ./คาบ)</option>
                  <option value="daily_duty">จัดการประจำวัน (90 บ./วัน)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">ห้อง / รายการภาระงาน</label>
                <input
                  type="text"
                  value={logCategory}
                  onChange={e => setLogCategory(e.target.value)}
                  placeholder="เช่น ป.1/1 หรือ คาบเสริม ENG"
                  className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">จำนวนวันที่ขาด (วัน)</label>
                <input
                  type="number"
                  min={0.5}
                  max={30}
                  step={0.5}
                  value={logDaysCount}
                  onChange={e => setLogDaysCount(parseFloat(e.target.value) || 1)}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">เหตุผลการขาด/ลา</label>
                <input
                  type="text"
                  value={logReason}
                  onChange={e => setLogReason(e.target.value)}
                  placeholder="เช่น ลากิจ, ลาป่วย, ไปราชการ"
                  className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <span className="font-bold text-slate-800 block mb-2">กรณีมีครูสอนแทน (บวกเงินเพิ่ม):</span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1">ครูผู้สอนแทน</label>
                  <select
                    value={logSubTeacherId}
                    onChange={e => setLogSubTeacherId(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="">-- ไม่มีครูสอนแทน --</option>
                    {teachers
                      .filter(t => t.id !== logTeacherId)
                      .map(t => (
                        <option key={t.id} value={t.id}>
                          {t.scheduleName} ({t.fullName})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 mb-1">เงินค่าสอนแทน (บาท)</label>
                  <input
                    type="number"
                    min={0}
                    step={50}
                    value={logSubAmount}
                    onChange={e => setLogSubAmount(parseFloat(e.target.value) || 0)}
                    disabled={!logSubTeacherId}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowLogModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
              >
                บันทึกและคำนวณให้อัตโนมัติ
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
