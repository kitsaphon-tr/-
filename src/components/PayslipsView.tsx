import React, { useState } from 'react';
import {
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  GraduationCap,
  Printer,
  UserCheck,
  Users
} from 'lucide-react';
import { MonthlyRecord, SchoolConfig, TeacherSummary, User } from '../types';
import { formatCurrency, thaiBahtText } from '../services/calculationEngine';

interface PayslipsViewProps {
  record: MonthlyRecord;
  currentUser: User;
  config: SchoolConfig;
}

export const PayslipsView: React.FC<PayslipsViewProps> = ({
  record,
  currentUser,
  config,
}) => {
  // If teacher, can only see their own payslip
  const availableSummaries =
    currentUser.role === 'teacher' && currentUser.teacherId
      ? record.summaries.filter(s => s.teacherId === currentUser.teacherId)
      : record.summaries;

  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(
    availableSummaries[0]?.teacherId || ''
  );
  const [printMode, setPrintMode] = useState<'single' | 'all'>('single');

  const selectedSummary = availableSummaries.find(s => s.teacherId === selectedTeacherId) || availableSummaries[0];

  const handlePrint = (mode: 'single' | 'all') => {
    setPrintMode(mode);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const renderSingleSlip = (summary: TeacherSummary) => {
    const grossTotal = summary.totalGross;
    const deductionTotal = summary.totalDeduction;
    const substituteTotal = summary.totalSubstitute;
    const netTotal = summary.grandTotal;
    const bahtInWords = thaiBahtText(netTotal);

    return (
      <div
        key={summary.teacherId}
        className="bg-white border border-slate-300 p-8 sm:p-10 rounded-2xl shadow-sm max-w-3xl mx-auto text-slate-800 font-['Sarabun',sans-serif] page-break my-4"
      >
        {/* Slip Header */}
        <div className="text-center border-b-2 border-slate-800 pb-4 mb-5">
          <div className="flex items-center justify-center gap-2 mb-1">
            <GraduationCap className="w-7 h-7 text-indigo-800" />
            <span className="font-bold text-xl tracking-tight text-slate-900">{config.schoolName}</span>
          </div>
          <h2 className="text-base font-bold text-slate-800">
            ใบสำคัญรับเงินค่าตอบแทนการสอนพิเศษและภาระหน้าที่
          </h2>
          <div className="text-xs text-slate-600 mt-1 flex items-center justify-center gap-4">
            <span>
              <strong>ประจำเดือน:</strong> {record.monthName}
            </span>
            <span>
              <strong>ปีการศึกษา:</strong> {config.academicYear}
            </span>
            <span>
              <strong>วันทำการ:</strong> {record.workingDaysCount} วัน
            </span>
          </div>
        </div>

        {/* Teacher Information Box */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 mb-5 text-xs grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <span className="text-slate-500">ชื่อ-สกุล: </span>
            <strong className="text-slate-900 text-sm">{summary.teacherFullName}</strong>
          </div>
          <div>
            <span className="text-slate-500">ชื่อเรียกในตาราง: </span>
            <strong className="text-indigo-700">{summary.teacherScheduleName}</strong>
          </div>
          <div>
            <span className="text-slate-500">กลุ่มสาระการเรียนรู้/ฝ่าย: </span>
            <span className="text-slate-800">{summary.department}</span>
          </div>
          <div>
            <span className="text-slate-500">รหัสอ้างอิง: </span>
            <span className="text-slate-800 font-mono">
              SLIP-{record.monthId}-{summary.teacherId.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Itemized Table */}
        <div className="overflow-x-auto mb-5">
          <table className="w-full text-xs border border-slate-300 border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 font-semibold text-slate-700">
                <th className="py-2 px-2 border-r border-slate-300 w-10 text-center">ลำดับ</th>
                <th className="py-2 px-3 border-r border-slate-300 text-left">รายการภาระงาน</th>
                <th className="py-2 px-2 border-r border-slate-300 text-center">ปริมาณ</th>
                <th className="py-2 px-2 border-r border-slate-300 text-right">อัตรา (฿)</th>
                <th className="py-2 px-2 border-r border-slate-300 text-right">เงินได้เต็ม</th>
                <th className="py-2 px-2 border-r border-slate-300 text-right text-rose-600">หักขาด</th>
                <th className="py-2 px-2 border-r border-slate-300 text-right text-emerald-700">สอนแทน</th>
                <th className="py-2 px-3 text-right font-bold text-slate-900">ยอดสุทธิ (฿)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {summary.details.map((item, index) => (
                <tr key={item.id} className="hover:bg-slate-50/50">
                  <td className="py-2 px-2 border-r border-slate-300 text-center text-slate-500">
                    {index + 1}
                  </td>
                  <td className="py-2 px-3 border-r border-slate-300">
                    <div className="font-medium text-slate-900">
                      {item.dutyName} ({item.category})
                    </div>
                    {item.notes && (
                      <span className="text-[10px] text-slate-500">{item.notes}</span>
                    )}
                  </td>
                  <td className="py-2 px-2 border-r border-slate-300 text-center">
                    {item.quantity} {item.unit}
                  </td>
                  <td className="py-2 px-2 border-r border-slate-300 text-right">
                    {formatCurrency(item.rate)}
                  </td>
                  <td className="py-2 px-2 border-r border-slate-300 text-right">
                    {formatCurrency(item.grossAmount)}
                  </td>
                  <td className="py-2 px-2 border-r border-slate-300 text-right text-rose-600">
                    {item.deduction > 0 ? `-${formatCurrency(item.deduction)}` : '-'}
                  </td>
                  <td className="py-2 px-2 border-r border-slate-300 text-right text-emerald-700">
                    {item.substituteAmount > 0 ? `+${formatCurrency(item.substituteAmount)}` : '-'}
                  </td>
                  <td className="py-2 px-3 text-right font-semibold text-slate-900">
                    {formatCurrency(item.finalTotal)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-900">
                <td colSpan={4} className="py-2.5 px-3 border-r border-slate-300 text-center">
                  ยอดรวมทั้งสิ้น
                </td>
                <td className="py-2.5 px-2 border-r border-slate-300 text-right">
                  {formatCurrency(grossTotal)}
                </td>
                <td className="py-2.5 px-2 border-r border-slate-300 text-right text-rose-600">
                  {deductionTotal > 0 ? `-${formatCurrency(deductionTotal)}` : '-'}
                </td>
                <td className="py-2.5 px-2 border-r border-slate-300 text-right text-emerald-700">
                  {substituteTotal > 0 ? `+${formatCurrency(substituteTotal)}` : '-'}
                </td>
                <td className="py-2.5 px-3 text-right text-indigo-900 text-sm font-bold bg-indigo-50/50">
                  ฿{formatCurrency(netTotal)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Amount in Thai words */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-8 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <span className="text-slate-500 font-medium">จำนวนเงินตัวหนังสือ:</span>
          <strong className="text-indigo-900 text-sm font-semibold">{bahtInWords}</strong>
        </div>

        {/* 4 Official Signature Blocks */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center text-xs text-slate-600 pt-3 border-t border-slate-200">
          <div className="space-y-1">
            <div className="h-10 flex items-end justify-center">
              <span className="border-b border-dotted border-slate-400 w-32 inline-block" />
            </div>
            <div className="font-semibold text-slate-800">({summary.teacherFullName})</div>
            <div className="text-[10px] text-slate-500">ผู้รับเงิน</div>
          </div>

          <div className="space-y-1">
            <div className="h-10 flex items-end justify-center">
              <span className="border-b border-dotted border-slate-400 w-32 inline-block" />
            </div>
            <div className="font-semibold text-slate-800">({config.financeHeadName})</div>
            <div className="text-[10px] text-slate-500">ผู้จัดทำ / เจ้าหน้าที่การเงิน</div>
          </div>

          <div className="space-y-1">
            <div className="h-10 flex items-end justify-center">
              <span className="border-b border-dotted border-slate-400 w-32 inline-block" />
            </div>
            <div className="font-semibold text-slate-800">({config.academicHeadName})</div>
            <div className="text-[10px] text-slate-500">หัวหน้าฝ่ายวิชาการ</div>
          </div>

          <div className="space-y-1">
            <div className="h-10 flex items-end justify-center">
              <span className="border-b border-dotted border-slate-400 w-32 inline-block" />
            </div>
            <div className="font-semibold text-slate-800">({config.principalName})</div>
            <div className="text-[10px] text-slate-500">ผู้อำนวยการโรงเรียน</div>
          </div>
        </div>

        {/* Verification footer */}
        <div className="mt-8 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
          <span>ระบบค่าตอบแทน โรงเรียนตันตรารักษ์ · ตรรกะรวมศูนย์ Phase 2</span>
          <span>เอกสารพิมพ์เมื่อ: {new Date().toLocaleDateString('th-TH')}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Screen Toolbar (hidden in print) */}
      <div className="no-print bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            <span>ใบสำคัญรับเงินและสลิปค่าตอบแทน</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            จัดรูปแบบมาตรฐานฟอนต์ Sarabun พร้อมแปลงยอดเงินเป็นตัวหนังสือภาษาไทยและช่องลงนาม
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Teacher Selector for Admin */}
          {currentUser.role === 'admin' && (
            <div className="flex items-center gap-2">
              <select
                value={selectedTeacherId}
                onChange={e => setSelectedTeacherId(e.target.value)}
                className="text-xs border border-slate-300 rounded-xl px-3 py-2 bg-slate-50 font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {availableSummaries.map(s => (
                  <option key={s.teacherId} value={s.teacherId}>
                    {s.teacherScheduleName} - {s.teacherFullName} (฿{formatCurrency(s.grandTotal)})
                  </option>
                ))}
              </select>

              <button
                onClick={() => handlePrint('all')}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-900 text-white flex items-center gap-1.5 transition-colors"
                title="พิมพ์สลิปของครูทุกคนต่อเนื่องกัน"
              >
                <Users className="w-3.5 h-3.5" />
                <span>พิมพ์สลิปทุกคน (Batch)</span>
              </button>
            </div>
          )}

          <button
            onClick={() => handlePrint('single')}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>พิมพ์สลิปใบนี้ (PDF)</span>
          </button>
        </div>
      </div>

      {/* Payslip Canvas */}
      {printMode === 'all' ? (
        <div className="space-y-6">
          {availableSummaries.map(s => renderSingleSlip(s))}
        </div>
      ) : selectedSummary ? (
        renderSingleSlip(selectedSummary)
      ) : (
        <div className="bg-white p-8 rounded-2xl text-center text-slate-400">
          ไม่พบข้อมูลค่าตอบแทนในเดือนนี้
        </div>
      )}
    </div>
  );
};
