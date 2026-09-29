import React, { useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  CheckCircle,
  FileSpreadsheet,
  Filter,
  Layers,
  Minus,
  TrendingDown,
  TrendingUp,
  User,
  Users
} from 'lucide-react';
import { MonthlyRecord, Teacher } from '../types';
import { formatCurrency } from '../services/calculationEngine';

interface ComparisonViewProps {
  records: Record<string, MonthlyRecord>;
  teachers: Teacher[];
  currentMonthId: string;
}

export const ComparisonView: React.FC<ComparisonViewProps> = ({
  records,
  teachers,
  currentMonthId,
}) => {
  const monthKeys = Object.keys(records);
  const [baseMonthId, setBaseMonthId] = useState<string>(
    monthKeys[0] || currentMonthId
  );
  const [compareMonthId, setCompareMonthId] = useState<string>(
    monthKeys[1] || monthKeys[0] || currentMonthId
  );
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('all');

  const baseRecord = records[baseMonthId];
  const compareRecord = records[compareMonthId];

  if (!baseRecord || !compareRecord) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-500">
        ต้องการข้อมูลอย่างน้อย 2 เดือนเพื่อเปรียบเทียบ
      </div>
    );
  }

  // School-wide aggregates
  const baseBudget = baseRecord.totalSchoolBudget;
  const compareBudget = compareRecord.totalSchoolBudget;
  const budgetDiff = compareBudget - baseBudget;
  const budgetPercentDiff = baseBudget > 0 ? (budgetDiff / baseBudget) * 100 : 0;

  // Breakdown by duty for both months
  const getDutySums = (rec: MonthlyRecord) => {
    return {
      homework: rec.summaries.reduce((a, b) => a + b.homeworkAmount, 0),
      period: rec.summaries.reduce((a, b) => a + b.periodAmount, 0),
      dailyDuty: rec.summaries.reduce((a, b) => a + b.dailyDutyAmount, 0),
      lumpSum: rec.summaries.reduce((a, b) => a + b.lumpSumAmount, 0),
    };
  };

  const baseDuties = getDutySums(baseRecord);
  const compareDuties = getDutySums(compareRecord);

  // Compare per teacher
  const teacherRows = teachers
    .filter(t => t.active)
    .map(t => {
      const baseSummary = baseRecord.summaries.find(s => s.teacherId === t.id);
      const compareSummary = compareRecord.summaries.find(s => s.teacherId === t.id);

      const baseAmount = baseSummary ? baseSummary.grandTotal : 0;
      const compareAmount = compareSummary ? compareSummary.grandTotal : 0;
      const diff = compareAmount - baseAmount;
      const pct = baseAmount > 0 ? (diff / baseAmount) * 100 : compareAmount > 0 ? 100 : 0;

      return {
        teacher: t,
        baseAmount,
        compareAmount,
        diff,
        pct,
        baseSummary,
        compareSummary,
      };
    })
    .filter(row => {
      if (selectedTeacherId === 'all') return true;
      return row.teacher.id === selectedTeacherId;
    });

  teacherRows.sort((a, b) => b.compareAmount - a.compareAmount);

  return (
    <div className="space-y-6 pb-16">
      {/* Month Selection Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              <span>เปรียบเทียบข้อมูลค่าตอบแทนข้ามเดือน</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              วิเคราะห์งบประมาณและยอดเงินของครูแต่ละคนระหว่าง 2 เดือน
            </p>
          </div>

          {/* Month Selectors */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
              <span className="text-slate-500 font-medium">เดือนหลัก (ฐาน):</span>
              <select
                value={baseMonthId}
                onChange={e => setBaseMonthId(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 font-semibold focus:outline-none"
              >
                {monthKeys.map(id => (
                  <option key={id} value={id}>
                    {records[id]?.monthName}
                  </option>
                ))}
              </select>
            </div>

            <span className="text-slate-400 font-bold">vs</span>

            <div className="flex items-center gap-1.5 bg-indigo-50/70 p-1.5 rounded-xl border border-indigo-200">
              <span className="text-indigo-800 font-medium">เดือนเปรียบเทียบ:</span>
              <select
                value={compareMonthId}
                onChange={e => setCompareMonthId(e.target.value)}
                className="bg-white border border-indigo-300 rounded-lg px-2.5 py-1 text-indigo-900 font-semibold focus:outline-none"
              >
                {monthKeys.map(id => (
                  <option key={id} value={id}>
                    {records[id]?.monthName}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Overview Stat Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Base Month */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200">
          <span className="text-xs font-semibold text-slate-500 uppercase">
            งวดหลัก ({baseRecord.monthName})
          </span>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            ฿{formatCurrency(baseBudget)}
          </div>
          <div className="text-xs text-slate-500 mt-2">
            {baseRecord.workingDaysCount} วันทำงาน · ครู {baseRecord.summaries.length} ท่าน
          </div>
        </div>

        {/* Compare Month */}
        <div className="bg-white p-5 rounded-2xl border border-indigo-200 bg-indigo-50/20">
          <span className="text-xs font-semibold text-indigo-700 uppercase">
            งวดเปรียบเทียบ ({compareRecord.monthName})
          </span>
          <div className="text-2xl font-bold text-indigo-900 mt-1">
            ฿{formatCurrency(compareBudget)}
          </div>
          <div className="text-xs text-slate-500 mt-2">
            {compareRecord.workingDaysCount} วันทำงาน · ครู {compareRecord.summaries.length} ท่าน
          </div>
        </div>

        {/* Difference */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200">
          <span className="text-xs font-semibold text-slate-500 uppercase">ส่วนต่าง (Difference)</span>
          <div
            className={`text-2xl font-bold mt-1 flex items-center gap-1.5 ${
              budgetDiff > 0
                ? 'text-emerald-600'
                : budgetDiff < 0
                ? 'text-rose-600'
                : 'text-slate-700'
            }`}
          >
            {budgetDiff > 0 ? (
              <ArrowUpRight className="w-6 h-6" />
            ) : budgetDiff < 0 ? (
              <ArrowDownRight className="w-6 h-6" />
            ) : (
              <Minus className="w-6 h-6" />
            )}
            <span>
              {budgetDiff > 0 ? '+' : ''}
              ฿{formatCurrency(budgetDiff)}
            </span>
          </div>
          <div className="text-xs text-slate-500 mt-2">
            {budgetDiff > 0 ? 'เพิ่มขึ้น' : budgetDiff < 0 ? 'ลดลง' : 'ไม่เปลี่ยนแปลง'}{' '}
            <strong>{budgetPercentDiff.toFixed(1)}%</strong> เมื่อเทียบกับงวดฐาน
          </div>
        </div>
      </div>

      {/* Duty Category Comparison Bars */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200">
        <h3 className="font-bold text-slate-800 text-sm mb-4">
          เปรียบเทียบงบประมาณแยกตามภาระหน้าที่ (4 ภาระงาน)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Homework */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
            <span className="text-xs font-bold text-slate-700">1. การบ้าน</span>
            <div className="flex items-center justify-between text-xs mt-2 text-slate-600">
              <span>{baseRecord.monthName.split(' ')[0]}:</span>
              <strong>฿{formatCurrency(baseDuties.homework)}</strong>
            </div>
            <div className="flex items-center justify-between text-xs text-indigo-700 mt-1">
              <span>{compareRecord.monthName.split(' ')[0]}:</span>
              <strong>฿{formatCurrency(compareDuties.homework)}</strong>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-200 text-[11px] flex justify-between font-semibold">
              <span>ส่วนต่าง:</span>
              <span className={compareDuties.homework >= baseDuties.homework ? 'text-emerald-600' : 'text-rose-600'}>
                {compareDuties.homework >= baseDuties.homework ? '+' : ''}
                {formatCurrency(compareDuties.homework - baseDuties.homework)}
              </span>
            </div>
          </div>

          {/* Periods */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
            <span className="text-xs font-bold text-slate-700">2. รายคาบ</span>
            <div className="flex items-center justify-between text-xs mt-2 text-slate-600">
              <span>{baseRecord.monthName.split(' ')[0]}:</span>
              <strong>฿{formatCurrency(baseDuties.period)}</strong>
            </div>
            <div className="flex items-center justify-between text-xs text-indigo-700 mt-1">
              <span>{compareRecord.monthName.split(' ')[0]}:</span>
              <strong>฿{formatCurrency(compareDuties.period)}</strong>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-200 text-[11px] flex justify-between font-semibold">
              <span>ส่วนต่าง:</span>
              <span className={compareDuties.period >= baseDuties.period ? 'text-emerald-600' : 'text-rose-600'}>
                {compareDuties.period >= baseDuties.period ? '+' : ''}
                {formatCurrency(compareDuties.period - baseDuties.period)}
              </span>
            </div>
          </div>

          {/* Daily Duty */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
            <span className="text-xs font-bold text-slate-700">3. จัดการประจำวัน</span>
            <div className="flex items-center justify-between text-xs mt-2 text-slate-600">
              <span>{baseRecord.monthName.split(' ')[0]}:</span>
              <strong>฿{formatCurrency(baseDuties.dailyDuty)}</strong>
            </div>
            <div className="flex items-center justify-between text-xs text-indigo-700 mt-1">
              <span>{compareRecord.monthName.split(' ')[0]}:</span>
              <strong>฿{formatCurrency(compareDuties.dailyDuty)}</strong>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-200 text-[11px] flex justify-between font-semibold">
              <span>ส่วนต่าง:</span>
              <span className={compareDuties.dailyDuty >= baseDuties.dailyDuty ? 'text-emerald-600' : 'text-rose-600'}>
                {compareDuties.dailyDuty >= baseDuties.dailyDuty ? '+' : ''}
                {formatCurrency(compareDuties.dailyDuty - baseDuties.dailyDuty)}
              </span>
            </div>
          </div>

          {/* Lump Sum */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
            <span className="text-xs font-bold text-slate-700">4. กศพ. & Back Office</span>
            <div className="flex items-center justify-between text-xs mt-2 text-slate-600">
              <span>{baseRecord.monthName.split(' ')[0]}:</span>
              <strong>฿{formatCurrency(baseDuties.lumpSum)}</strong>
            </div>
            <div className="flex items-center justify-between text-xs text-indigo-700 mt-1">
              <span>{compareRecord.monthName.split(' ')[0]}:</span>
              <strong>฿{formatCurrency(compareDuties.lumpSum)}</strong>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-200 text-[11px] flex justify-between font-semibold">
              <span>ส่วนต่าง:</span>
              <span className={compareDuties.lumpSum >= baseDuties.lumpSum ? 'text-emerald-600' : 'text-rose-600'}>
                {compareDuties.lumpSum >= baseDuties.lumpSum ? '+' : ''}
                {formatCurrency(compareDuties.lumpSum - baseDuties.lumpSum)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Teacher Variance Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              <span>ตารางเปรียบเทียบยอดรายบุคคล ({baseRecord.monthName} ➔ {compareRecord.monthName})</span>
            </h3>
            <p className="text-xs text-slate-500">
              แสดงการเปลี่ยนแปลงของค่าตอบแทนที่ครูแต่ละท่านได้รับ
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">กรองเฉพาะครู:</span>
            <select
              value={selectedTeacherId}
              onChange={e => setSelectedTeacherId(e.target.value)}
              className="border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 font-medium text-slate-800 focus:outline-none"
            >
              <option value="all">ครูทั้งหมด ({teachers.filter(t => t.active).length} ท่าน)</option>
              {teachers.map(t => (
                <option key={t.id} value={t.id}>
                  {t.scheduleName} ({t.fullName})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                <th className="py-2.5 px-3 w-12 text-center">ลำดับ</th>
                <th className="py-2.5 px-3">ชื่อ-สกุล / ชื่อในตาราง</th>
                <th className="py-2.5 px-3">กลุ่มสาระฯ</th>
                <th className="py-2.5 px-3 text-right">{baseRecord.monthName} (ฐาน)</th>
                <th className="py-2.5 px-3 text-right bg-indigo-50/50 text-indigo-900 font-bold">
                  {compareRecord.monthName}
                </th>
                <th className="py-2.5 px-3 text-right">ส่วนต่าง (บาท)</th>
                <th className="py-2.5 px-3 text-right">เปลี่ยนแปลง (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {teacherRows.map((row, idx) => (
                <tr key={row.teacher.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-3 text-center text-slate-400">{idx + 1}</td>
                  <td className="py-2.5 px-3 font-semibold text-slate-800">
                    <div>{row.teacher.fullName}</div>
                    <span className="text-[10px] text-slate-500 font-normal">
                      ชื่อในตาราง: <strong className="text-indigo-600">{row.teacher.scheduleName}</strong>
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-500">{row.teacher.department}</td>
                  <td className="py-2.5 px-3 text-right text-slate-700">
                    ฿{formatCurrency(row.baseAmount)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-indigo-900 bg-indigo-50/30">
                    ฿{formatCurrency(row.compareAmount)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-semibold">
                    <span
                      className={`inline-flex items-center gap-0.5 ${
                        row.diff > 0
                          ? 'text-emerald-600'
                          : row.diff < 0
                          ? 'text-rose-600'
                          : 'text-slate-500'
                      }`}
                    >
                      {row.diff > 0 ? '+' : ''}
                      {formatCurrency(row.diff)}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        row.diff > 0
                          ? 'bg-emerald-50 text-emerald-700'
                          : row.diff < 0
                          ? 'bg-rose-50 text-rose-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {row.pct > 0 ? '+' : ''}
                      {row.pct.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
