import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckCircle,
  Clock,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  Layers,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Upload,
  UserCheck,
  UserX
} from 'lucide-react';
import { MonthSchedule, MonthlyRecord, ScheduleDutyRow, Teacher, User } from '../types';
import { parsePastedSchedule } from '../services/excelService';

interface ScheduleImportViewProps {
  record: MonthlyRecord;
  teachers: Teacher[];
  currentUser: User;
  onUpdateSchedule: (newSchedule: MonthSchedule) => void;
  onRunCalculation: () => void;
}

export const ScheduleImportView: React.FC<ScheduleImportViewProps> = ({
  record,
  teachers,
  currentUser,
  onUpdateSchedule,
  onRunCalculation,
}) => {
  const [selectedZone, setSelectedZone] = useState<'all' | 'homework' | 'period' | 'daily_duty'>('all');
  const [showImportModal, setShowImportModal] = useState(false);
  const [pasteContent, setPasteContent] = useState('');
  const [importError, setImportError] = useState<string | null>(null);

  // New row modal state
  const [showAddRowModal, setShowAddRowModal] = useState(false);
  const [newRowZone, setNewRowZone] = useState<'homework' | 'period' | 'daily_duty'>('period');
  const [newRowTitle, setNewRowTitle] = useState('');
  const [newRowCategory, setNewRowCategory] = useState('');

  // Cell editing state (supports multi-teacher assignment >2 teachers)
  const [editingCell, setEditingCell] = useState<{ rowId: string; day: number; val: string } | null>(null);

  const schedule = record.schedule;
  const isLocked = record.status === 'locked';

  // Registered teacher names
  const validTeacherNames = new Set(teachers.map(t => t.scheduleName.trim()));

  // Scan all cells in schedule to validate teacher names
  const unknownNamesMap = new Map<string, { count: number; rows: string[] }>();
  let totalAssignments = 0;
  let validAssignments = 0;

  schedule.rows.forEach(row => {
    schedule.activeDays.forEach(day => {
      const val = row.assignments[day.toString()];
      if (val && val.trim()) {
        const names = val.split(/[,/+\n;&]+/).map(s => s.trim()).filter(Boolean);
        names.forEach(clean => {
          totalAssignments++;
          if (validTeacherNames.has(clean)) {
            validAssignments++;
          } else {
            const prev = unknownNamesMap.get(clean) || { count: 0, rows: [] };
            prev.count++;
            if (!prev.rows.includes(row.title)) prev.rows.push(row.title);
            unknownNamesMap.set(clean, prev);
          }
        });
      }
    });
  });

  const unknownNamesList = Array.from(unknownNamesMap.entries());

  // Filter rows by zone
  const displayedRows = schedule.rows.filter(r => {
    if (selectedZone === 'all') return true;
    return r.zone === selectedZone;
  });

  // Handle cell teacher change
  const handleAssignTeacher = (rowId: string, day: number, teacherString: string) => {
    if (isLocked || currentUser.role !== 'admin') return;

    const newRows = schedule.rows.map(r => {
      if (r.id === rowId) {
        return {
          ...r,
          assignments: {
            ...r.assignments,
            [day.toString()]: teacherString.trim(),
          },
        };
      }
      return r;
    });

    onUpdateSchedule({
      ...schedule,
      rows: newRows,
    });
    setEditingCell(null);
  };

  // Toggle teacher in multi-teacher edit popover
  const toggleTeacherInCell = (teacherName: string) => {
    if (!editingCell) return;
    const currentList = editingCell.val
      ? editingCell.val.split(/[,/+\n;&]+/).map(s => s.trim()).filter(Boolean)
      : [];

    const index = currentList.indexOf(teacherName);
    let updatedList: string[];
    if (index >= 0) {
      updatedList = currentList.filter(n => n !== teacherName);
    } else {
      updatedList = [...currentList, teacherName];
    }

    setEditingCell({
      ...editingCell,
      val: updatedList.join(', '),
    });
  };

  // Quick Replace All occurrences of a misspelled name
  const handleQuickFixName = (typoName: string, correctName: string) => {
    if (isLocked || currentUser.role !== 'admin') return;

    const newRows = schedule.rows.map(r => {
      const updatedAssignments = { ...r.assignments };
      Object.keys(updatedAssignments).forEach(key => {
        if (updatedAssignments[key]?.trim() === typoName.trim()) {
          updatedAssignments[key] = correctName;
        }
      });
      return {
        ...r,
        assignments: updatedAssignments,
      };
    });

    onUpdateSchedule({
      ...schedule,
      rows: newRows,
    });
  };

  // Add new Row
  const handleAddRow = () => {
    if (!newRowTitle.trim()) return;
    const newId = `row_${Date.now()}`;
    const newRow: ScheduleDutyRow = {
      id: newId,
      zone: newRowZone,
      category: newRowCategory || newRowTitle,
      title: newRowTitle,
      assignments: {},
    };

    onUpdateSchedule({
      ...schedule,
      rows: [...schedule.rows, newRow],
    });
    setShowAddRowModal(false);
    setNewRowTitle('');
    setNewRowCategory('');
  };

  // Delete Row
  const handleDeleteRow = (rowId: string) => {
    if (isLocked || currentUser.role !== 'admin') return;
    if (!window.confirm('คุณต้องการลบแถวภาระงานนี้ใช่หรือไม่?')) return;

    onUpdateSchedule({
      ...schedule,
      rows: schedule.rows.filter(r => r.id !== rowId),
    });
  };

  // Handle text paste import
  const handlePasteImport = () => {
    setImportError(null);
    if (!pasteContent.trim()) {
      setImportError('กรุณาวางข้อมูลก่อนกดนำเข้า');
      return;
    }

    const { rows, detectedDays, errors } = parsePastedSchedule(pasteContent, schedule.activeDays);
    if (errors.length > 0) {
      setImportError(errors.join(', '));
      return;
    }

    if (rows.length === 0) {
      setImportError('ไม่พบแถวข้อมูลที่สามารถนำเข้าได้');
      return;
    }

    const formattedRows: ScheduleDutyRow[] = rows.map((r, i) => ({
      ...r,
      id: `imp_${Date.now()}_${i}`,
    }));

    onUpdateSchedule({
      ...schedule,
      activeDays: detectedDays.length > 0 ? detectedDays : schedule.activeDays,
      rows: [...schedule.rows, ...formattedRows],
    });

    setShowImportModal(false);
    setPasteContent('');
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header & 4-Step Pipeline Summary */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                ตารางสอนพิเศษและเวรจัดการประจำวัน
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-medium">
                ชีต Schedule_{schedule.monthId}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              นำเข้าตารางเพื่อใช้เป็นฐานข้อมูลนับคาบสอน (รายคาบ 230 บาท) และนับวันเวร (จัดการประจำวัน 90 บาท)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {currentUser.role === 'admin' && (
              <>
                <button
                  onClick={() => setShowImportModal(true)}
                  disabled={isLocked}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    isLocked
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>นำเข้าตาราง (Paste / Excel)</span>
                </button>

                <button
                  onClick={() => setShowAddRowModal(true)}
                  disabled={isLocked}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    isLocked
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>เพิ่มแถวภาระงาน</span>
                </button>

                <button
                  onClick={onRunCalculation}
                  disabled={isLocked}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors ${
                    isLocked
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  }`}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>ประมวลผลคำนวณ (Run Engine)</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* 4-Step Pipeline indicator */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-5 pt-4 border-t border-slate-100 text-xs">
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
            <span className="text-[10px] font-bold text-indigo-600 uppercase">ขั้นที่ 1</span>
            <div className="font-semibold text-slate-800 mt-0.5">เลือกงวดประจำเดือน</div>
            <div className="text-[11px] text-slate-500">{record.monthName} ({schedule.activeDays.length} วันทำการ)</div>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
            <span className="text-[10px] font-bold text-indigo-600 uppercase">ขั้นที่ 2</span>
            <div className="font-semibold text-slate-800 mt-0.5">นำเข้าตาราง 3 โซน</div>
            <div className="text-[11px] text-slate-500">
              {schedule.rows.length} แถวภาระงาน · {totalAssignments} ช่องการสอน
            </div>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
            <span className="text-[10px] font-bold text-indigo-600 uppercase">ขั้นที่ 3</span>
            <div className="font-semibold text-slate-800 mt-0.5">ตรวจชื่อ & คำนวณ</div>
            <div className="text-[11px] text-slate-500">
              {unknownNamesList.length > 0 ? (
                <span className="text-amber-600 font-semibold">พบ {unknownNamesList.length} ชื่อที่พิมพ์ต่าง</span>
              ) : (
                <span className="text-emerald-600 font-semibold">ตรวจชื่อผ่าน 100%</span>
              )}
            </div>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
            <span className="text-[10px] font-bold text-indigo-600 uppercase">ขั้นที่ 4</span>
            <div className="font-semibold text-slate-800 mt-0.5">ปรับวันขาด & ปิดงวด</div>
            <div className="text-[11px] text-slate-500">
              {isLocked ? 'ปิดงวดเรียบร้อยแล้ว' : 'ฉบับร่าง (แก้ไขได้)'}
            </div>
          </div>
        </div>
      </div>

      {/* Name Validator Warning Panel (Requirement 1.5 & 6) */}
      {unknownNamesList.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5 shadow-2xs">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-bold text-amber-900 text-sm">
                ตรวจพบชื่อครูในตารางที่ไม่ตรงกับทะเบียนครู ({unknownNamesList.length} รายการ)
              </h3>
              <p className="text-xs text-amber-800 mt-0.5">
                เพื่อป้องกันการนับคาบ/วันพลาด (เช่น พิมพ์วรรณยุกต์ซ้ำ พิมพ์ตัวพิมพ์เล็ก-ใหญ่ต่าง หรือสะกดผิด)
                ท่านสามารถเลือกครูในระบบเพื่อแก้ไขแทนที่ทุกช่องทันที:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                {unknownNamesList.map(([typo, data]) => (
                  <div
                    key={typo}
                    className="bg-white p-3 rounded-xl border border-amber-200 flex flex-col justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-rose-700 text-sm">"{typo}"</span>
                        <span className="text-[11px] px-2 py-0.5 bg-amber-100 text-amber-900 rounded font-medium">
                          พบ {data.count} ครั้ง
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        ในแถว: {data.rows.slice(0, 2).join(', ')}
                        {data.rows.length > 2 ? '...' : ''}
                      </div>
                    </div>

                    {currentUser.role === 'admin' && !isLocked && (
                      <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                        <span className="text-[11px] text-slate-600 font-medium">แม็ปเป็น:</span>
                        <select
                          onChange={e => {
                            if (e.target.value) {
                              handleQuickFixName(typo, e.target.value);
                            }
                          }}
                          defaultValue=""
                          className="flex-1 text-xs border border-slate-300 rounded px-2 py-1 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="" disabled>
                            -- เลือกครูที่ถูกต้อง --
                          </option>
                          {teachers.map(t => (
                            <option key={t.id} value={t.scheduleName}>
                              {t.scheduleName} ({t.fullName})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Zone Switcher & Day Count */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-100/80 p-2.5 rounded-xl border border-slate-200">
        <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 overflow-x-auto">
          <button
            onClick={() => setSelectedZone('all')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedZone === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ทุกโซน ({schedule.rows.length})
          </button>
          <button
            onClick={() => setSelectedZone('homework')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedZone === 'homework' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            โซน 1: การบ้าน ({schedule.rows.filter(r => r.zone === 'homework').length})
          </button>
          <button
            onClick={() => setSelectedZone('period')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedZone === 'period' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            โซน 2: รายคาบ ({schedule.rows.filter(r => r.zone === 'period').length})
          </button>
          <button
            onClick={() => setSelectedZone('daily_duty')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedZone === 'daily_duty' ? 'bg-amber-600 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            โซน 3: จัดการประจำวัน ({schedule.rows.filter(r => r.zone === 'daily_duty').length})
          </button>
        </div>

        <div className="text-xs text-slate-500 font-medium px-2">
          ตารางมี <strong className="text-slate-800">{schedule.activeDays.length} วันทำการ</strong> ในเดือนนี้ (คลิกเซลล์เพื่อแก้ชื่อครู)
        </div>
      </div>

      {/* Visual Schedule Matrix Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto max-h-[620px] relative">
          <table className="w-full text-xs border-collapse">
            <thead className="sticky top-0 z-20 bg-slate-100 shadow-xs">
              <tr className="border-b border-slate-200 text-slate-700 font-semibold">
                <th className="py-2.5 px-3 sticky left-0 z-30 bg-slate-100 border-r border-slate-200 min-w-[200px] text-left">
                  รายการภาระงาน / โซน
                </th>
                {schedule.activeDays.map(day => (
                  <th
                    key={day}
                    className="py-2 px-2 text-center border-r border-slate-200 min-w-[65px] font-bold text-slate-700 bg-slate-50"
                  >
                    วันที่ {day}
                  </th>
                ))}
                {currentUser.role === 'admin' && !isLocked && (
                  <th className="py-2 px-2 text-center w-12 bg-slate-100">จัดการ</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {displayedRows.map(row => {
                return (
                  <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Sticky Row Title */}
                    <td className="py-2 px-3 sticky left-0 z-10 bg-white border-r border-slate-200 font-medium text-slate-900 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="truncate max-w-[170px]" title={row.title}>
                          {row.title}
                        </span>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded font-semibold shrink-0 ml-1 ${
                            row.zone === 'homework'
                              ? 'bg-blue-50 text-blue-700'
                              : row.zone === 'period'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {row.zone === 'homework' ? 'การบ้าน' : row.zone === 'period' ? 'รายคาบ' : 'เวร'}
                        </span>
                      </div>
                    </td>

                    {/* Day Cells */}
                    {schedule.activeDays.map(day => {
                      const val = row.assignments[day.toString()] || '';
                      const isEditing = editingCell?.rowId === row.id && editingCell?.day === day;
                      const isValidName = !val || validTeacherNames.has(val.trim());

                      return (
                        <td
                          key={day}
                          className={`py-1.5 px-1.5 text-center border-r border-slate-200 relative ${
                            !isValidName && val ? 'bg-amber-100/60 font-bold' : ''
                          }`}
                        >
                          {isEditing ? (
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 z-50 bg-white border-2 border-indigo-500 rounded-xl p-3 shadow-2xl w-64 text-left">
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="font-bold text-slate-800 text-[11px]">
                                  {row.zone === 'daily_duty' ? 'ครูประจำเวร (>2 คนได้)' : 'ครูผู้รับผิดชอบ'}
                                </span>
                                <span className="text-[10px] text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded font-semibold">
                                  วันที่ {day}
                                </span>
                              </div>

                              <input
                                type="text"
                                value={editingCell.val}
                                onChange={e => setEditingCell({ ...editingCell, val: e.target.value })}
                                placeholder="พิมพ์หรือคลิกเลือกชื่อครูด้านล่าง (คั่นด้วยจุลภาค)"
                                className="w-full text-xs p-1.5 border border-slate-300 rounded mb-2 font-medium"
                              />

                              <div className="text-[10px] text-slate-500 font-semibold mb-1">
                                คลิกเพื่อเพิ่ม/ลบครูในเวรนี้:
                              </div>
                              <div className="flex flex-wrap gap-1 max-h-28 overflow-y-auto mb-2 p-1 bg-slate-50 rounded border border-slate-200">
                                {teachers.map(t => {
                                  const currentList = editingCell.val
                                    .split(/[,/+\n;&]+/)
                                    .map(s => s.trim())
                                    .filter(Boolean);
                                  const isSelected = currentList.includes(t.scheduleName);

                                  return (
                                    <button
                                      key={t.id}
                                      type="button"
                                      onClick={() => toggleTeacherInCell(t.scheduleName)}
                                      className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-all ${
                                        isSelected
                                          ? 'bg-indigo-600 text-white shadow-2xs font-bold'
                                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                                      }`}
                                    >
                                      {isSelected && '✓ '}
                                      {t.scheduleName}
                                    </button>
                                  );
                                })}
                              </div>

                              <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                                <button
                                  type="button"
                                  onClick={() => setEditingCell(null)}
                                  className="text-[11px] text-slate-500 hover:text-slate-800 px-2 py-1"
                                >
                                  ยกเลิก
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleAssignTeacher(row.id, day, editingCell.val)}
                                  className="text-[11px] bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1 rounded shadow-xs"
                                >
                                  บันทึก
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                if (currentUser.role === 'admin' && !isLocked) {
                                  setEditingCell({ rowId: row.id, day, val });
                                }
                              }}
                              className={`w-full py-1 px-1 rounded truncate text-[11px] transition-colors ${
                                val
                                  ? isValidName
                                    ? row.zone === 'daily_duty'
                                      ? 'bg-amber-50/80 text-amber-900 border border-amber-200/60 hover:bg-amber-100'
                                      : 'bg-slate-100 text-slate-800 hover:bg-indigo-50 hover:text-indigo-700'
                                    : 'bg-rose-100 text-rose-800'
                                  : 'text-slate-300 hover:bg-slate-50'
                              }`}
                              title={val || 'ว่าง (คลิกเพื่อกำหนด)'}
                            >
                              {val ? (
                                <span className="flex items-center justify-center gap-0.5">
                                  {val.split(/[,/+\n;&]+/).filter(Boolean).length > 1 && (
                                    <span className="text-[9px] px-1 rounded-full bg-indigo-600 text-white font-bold shrink-0">
                                      {val.split(/[,/+\n;&]+/).filter(Boolean).length}
                                    </span>
                                  )}
                                  <span className="truncate">{val}</span>
                                </span>
                              ) : (
                                '-'
                              )}
                            </button>
                          )}
                        </td>
                      );
                    })}

                    {/* Delete row action */}
                    {currentUser.role === 'admin' && !isLocked && (
                      <td className="py-1 px-1 text-center">
                        <button
                          onClick={() => handleDeleteRow(row.id)}
                          title="ลบแถวนี้"
                          className="p-1 text-slate-400 hover:text-rose-600 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add New Row */}
      {showAddRowModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 sm:p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="font-bold text-slate-900 text-base">เพิ่มแถวภาระงานใหม่ในตาราง</h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">เลือกโซนภาระงาน</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewRowZone('homework')}
                    className={`py-2 px-3 rounded-lg border font-medium ${
                      newRowZone === 'homework'
                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    โซน 1: การบ้าน
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewRowZone('period')}
                    className={`py-2 px-3 rounded-lg border font-medium ${
                      newRowZone === 'period'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    โซน 2: รายคาบ
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewRowZone('daily_duty')}
                    className={`py-2 px-3 rounded-lg border font-medium ${
                      newRowZone === 'daily_duty'
                        ? 'bg-amber-50 border-amber-500 text-amber-700'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    โซน 3: เวรประจำวัน
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">ชื่อภาระงาน / หัวเรื่อง</label>
                <input
                  type="text"
                  placeholder="เช่น คาบเสริมวิทยาศาสตร์ ป.6 หรือ เวรทางข้ามหน้า รร."
                  value={newRowTitle}
                  onChange={e => setNewRowTitle(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">หมวดหมู่สั้น (Category)</label>
                <input
                  type="text"
                  placeholder="เช่น วิทย์ ม.ปลาย หรือ เวรประตู"
                  value={newRowCategory}
                  onChange={e => setNewRowCategory(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowAddRowModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleAddRow}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                เพิ่มรายการ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Import Paste / Excel */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 sm:p-6 max-w-2xl w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">นำเข้าข้อมูลตารางสอนพิเศษ</h3>
                <p className="text-xs text-slate-500">
                  คัดลอก (Copy) ตารางจาก Google Sheets หรือ Excel แล้ววาง (Paste) ลงในช่องด้านล่าง
                </p>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg"
              >
                ✕
              </button>
            </div>

            {importError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                {importError}
              </div>
            )}

            <div>
              <label className="block text-slate-700 font-semibold text-xs mb-1">
                วางข้อมูลตาราง (หัวตารางต้องมี วันที่ เช่น 2, 3, 4 ... และคอลัมน์แรกเป็นชื่องาน)
              </label>
              <textarea
                rows={8}
                value={pasteContent}
                onChange={e => setPasteContent(e.target.value)}
                placeholder={"รายการภาระงาน\tวันที่ 2\tวันที่ 3\tวันที่ 4\nการบ้าน ป.1/1\tโจแอล\tสาลี่\tโจแอล\nคาบเสริม ENG\tNili\tโจแอล\tNili\nเวรจราจร\tเอกชัย\tธนกร\tเอกชัย"}
                className="w-full p-3 font-mono text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-400">
                รองรับการคัดลอกจาก Google Sheets และ Excel โดยตรง
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handlePasteImport}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>นำเข้าและผนวกเข้าตาราง</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
