import React, { useState } from 'react';
import {
  AlertCircle,
  Building,
  Check,
  CheckCircle2,
  Database,
  Edit2,
  HelpCircle,
  Layers,
  Plus,
  RefreshCcw,
  Save,
  Sliders,
  Trash2,
  UserCheck,
  Users
} from 'lucide-react';
import { ClassRosterItem, DutyRate, SchoolConfig, Teacher, User } from '../types';
import { formatCurrency } from '../services/calculationEngine';

interface SettingsViewProps {
  config: SchoolConfig;
  dutyRates: DutyRate[];
  teachers: Teacher[];
  classRosters: ClassRosterItem[];
  currentUser: User;
  onUpdateConfig: (newConfig: SchoolConfig) => void;
  onUpdateDutyRates: (newRates: DutyRate[]) => void;
  onUpdateTeachers: (newTeachers: Teacher[]) => void;
  onUpdateClassRosters: (newRosters: ClassRosterItem[]) => void;
  onResetData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  config,
  dutyRates,
  teachers,
  classRosters,
  currentUser,
  onUpdateConfig,
  onUpdateDutyRates,
  onUpdateTeachers,
  onUpdateClassRosters,
  onResetData,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'rates' | 'teachers' | 'rosters' | 'school' | 'decisions'>('rates');

  // Rates edit state
  const [editingRateId, setEditingRateId] = useState<string | null>(null);
  const [editRateValue, setEditRateValue] = useState<number>(0);

  // New Teacher Modal
  const [showAddTeacher, setShowAddTeacher] = useState(false);
  const [newTeacherScheduleName, setNewTeacherScheduleName] = useState('');
  const [newTeacherFullName, setNewTeacherFullName] = useState('');
  const [newTeacherDept, setNewTeacherDept] = useState('');
  const [newTeacherLumpSum, setNewTeacherLumpSum] = useState<'none' | 'special_coordinator' | 'back_office'>('none');
  const [newTeacherLumpAmount, setNewTeacherLumpAmount] = useState<number>(1000);

  // School config state
  const [localConfig, setLocalConfig] = useState<SchoolConfig>(config);
  const [configSaved, setConfigSaved] = useState(false);

  const isAdmin = currentUser.role === 'admin';

  const handleSaveRate = (rateId: string) => {
    if (!isAdmin) return;
    const updated = dutyRates.map(r => (r.id === rateId ? { ...r, rate: editRateValue } : r));
    onUpdateDutyRates(updated);
    setEditingRateId(null);
  };

  const handleAddTeacher = () => {
    if (!newTeacherScheduleName.trim() || !newTeacherFullName.trim()) return;
    const newT: Teacher = {
      id: `t_${Date.now()}`,
      code: `T${String(teachers.length + 1).padStart(3, '0')}`,
      scheduleName: newTeacherScheduleName.trim(),
      fullName: newTeacherFullName.trim(),
      department: newTeacherDept.trim() || 'กลุ่มสาระฯ ทั่วไป',
      isLumpSum: newTeacherLumpSum !== 'none',
      lumpSumType: newTeacherLumpSum,
      lumpSumAmount: newTeacherLumpSum !== 'none' ? newTeacherLumpAmount : undefined,
      active: true,
    };
    onUpdateTeachers([...teachers, newT]);
    setShowAddTeacher(false);
    setNewTeacherScheduleName('');
    setNewTeacherFullName('');
    setNewTeacherDept('');
    setNewTeacherLumpSum('none');
  };

  const handleToggleTeacherActive = (tId: string) => {
    if (!isAdmin) return;
    const updated = teachers.map(t => (t.id === tId ? { ...t, active: !t.active } : t));
    onUpdateTeachers(updated);
  };

  const handleSaveSchoolConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    onUpdateConfig(localConfig);
    setConfigSaved(true);
    setTimeout(() => setConfigSaved(false), 3000);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Title */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-600" />
            <span>ตั้งค่าระบบและฐานข้อมูลมาสเตอร์</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            จัดการชีตแม่แบบ (DutyRates, Teachers, ClassRoster, Config) และบันทึกข้อตัดสินใจสถาปัตยกรรม Phase 2
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => {
              if (window.confirm('คุณต้องการรีเซ็ตข้อมูลทั้งหมดกลับสู่ค่าเริ่มต้นของโรงเรียนตันตรารักษ์ใช่หรือไม่?')) {
                onResetData();
              }
            }}
            className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 flex items-center gap-1.5 transition-colors self-start sm:self-auto"
          >
            <RefreshCcw className="w-3.5 h-3.5" />
            <span>รีเซ็ตข้อมูลตัวอย่างเริ่มต้น</span>
          </button>
        )}
      </div>

      {/* Sub Tabs */}
      <div className="flex border-b border-slate-200 gap-2 sm:gap-4 overflow-x-auto scrollbar-none text-xs font-semibold">
        <button
          onClick={() => setActiveSubTab('rates')}
          className={`py-2.5 px-3 border-b-2 whitespace-nowrap transition-all ${
            activeSubTab === 'rates'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          อัตราค่าตอบแทน (DutyRates)
        </button>
        <button
          onClick={() => setActiveSubTab('teachers')}
          className={`py-2.5 px-3 border-b-2 whitespace-nowrap transition-all ${
            activeSubTab === 'teachers'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          ทะเบียนครู & แม็ปชื่อ (Teachers)
        </button>
        <button
          onClick={() => setActiveSubTab('rosters')}
          className={`py-2.5 px-3 border-b-2 whitespace-nowrap transition-all ${
            activeSubTab === 'rosters'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          ผังห้อง & นร. (ClassRoster)
        </button>
        <button
          onClick={() => setActiveSubTab('decisions')}
          className={`py-2.5 px-3 border-b-2 whitespace-nowrap transition-all ${
            activeSubTab === 'decisions'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          ข้อตัดสินใจ Phase 2 (4 ประเด็น)
        </button>
        <button
          onClick={() => setActiveSubTab('school')}
          className={`py-2.5 px-3 border-b-2 whitespace-nowrap transition-all ${
            activeSubTab === 'school'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          ข้อมูลโรงเรียน & ผู้ลงนาม (Config)
        </button>
      </div>

      {/* SubTab 1: DutyRates */}
      {activeSubTab === 'rates' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-200">
            <h3 className="font-bold text-slate-800 text-sm">
              อัตราค่าตอบแทนต่อภาระหน้าที่ (ช่วง O4:P9 ในไฟล์เดิม)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              สามารถแก้ไขอัตราได้จากหน้านี้โดยตรง ระบบจะไม่ Hardcode ตัวเลขไว้ในโค้ด
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                  <th className="py-3 px-4">ภาระหน้าที่</th>
                  <th className="py-3 px-4">รหัสระบบ</th>
                  <th className="py-3 px-4 text-right">อัตราปัจจุบัน (บาท)</th>
                  <th className="py-3 px-4">หน่วยที่จ่าย</th>
                  <th className="py-3 px-4">คำอธิบาย</th>
                  {isAdmin && <th className="py-3 px-4 text-center w-24">แก้ไข</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dutyRates.map(rate => {
                  const isEditing = editingRateId === rate.id;
                  return (
                    <tr key={rate.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-bold text-slate-800">{rate.name}</td>
                      <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">{rate.code}</td>
                      <td className="py-3 px-4 text-right font-bold text-indigo-700 text-sm">
                        {isEditing ? (
                          <input
                            type="number"
                            min={0}
                            step={10}
                            value={editRateValue}
                            onChange={e => setEditRateValue(parseFloat(e.target.value) || 0)}
                            className="w-24 text-right p-1 border border-indigo-400 rounded bg-white"
                          />
                        ) : (
                          `฿${formatCurrency(rate.rate)}`
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{rate.unit}</td>
                      <td className="py-3 px-4 text-slate-500 text-[11px]">{rate.description}</td>
                      {isAdmin && (
                        <td className="py-3 px-4 text-center">
                          {isEditing ? (
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleSaveRate(rate.id)}
                                className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setEditingRateId(null)}
                                className="p-1 bg-slate-200 text-slate-700 rounded hover:bg-slate-300"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingRateId(rate.id);
                                setEditRateValue(rate.rate);
                              }}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SubTab 2: Teachers Master */}
      {activeSubTab === 'teachers' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">
                ทะเบียนครู (Teachers Sheet) & ชื่อที่ใช้ในตาราง
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                ชื่อที่ใช้ในตาราง (Schedule Name) ต้องตรงกับที่พิมพ์ในตารางสอนเป๊ะ เพื่อให้นับคาบ/วันได้ถูกต้อง
              </p>
            </div>

            {isAdmin && (
              <button
                onClick={() => setShowAddTeacher(true)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 transition-colors self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>เพิ่มครูในทะเบียน</span>
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                  <th className="py-2.5 px-3 w-16">รหัส</th>
                  <th className="py-2.5 px-3">ชื่อในตาราง (Alias)</th>
                  <th className="py-2.5 px-3">ชื่อ-สกุลเต็ม</th>
                  <th className="py-2.5 px-3">กลุ่มสาระฯ</th>
                  <th className="py-2.5 px-3">เหมาจ่ายรายเดือน</th>
                  <th className="py-2.5 px-3">เลขบัญชี</th>
                  <th className="py-2.5 px-3 text-center">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teachers.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-mono text-slate-500">{t.code}</td>
                    <td className="py-2.5 px-3 font-bold text-indigo-700">
                      <span className="bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                        {t.scheduleName}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{t.fullName}</td>
                    <td className="py-2.5 px-3 text-slate-500">{t.department}</td>
                    <td className="py-2.5 px-3">
                      {t.isLumpSum ? (
                        <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-medium text-[11px]">
                          {t.lumpSumType === 'special_coordinator' ? 'กศพ.' : 'Back Office'} (฿
                          {formatCurrency(t.lumpSumAmount || 1000)})
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 text-[11px] font-mono">
                      {t.bankAccount || '-'}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => handleToggleTeacherActive(t.id)}
                        disabled={!isAdmin}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          t.active
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {t.active ? 'ใช้งาน' : 'ระงับ'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SubTab 3: Class Roster */}
      {activeSubTab === 'rosters' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-200">
            <h3 className="font-bold text-slate-800 text-sm">
              ผังห้องและนักเรียน (ClassRoster Sheet)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              กำหนดจำนวนนักเรียนต่อห้อง และระบุครูผู้รับผิดชอบการบ้าน (หากมี 2 คน ระบบจะหารเฉลี่ย 50/50 อัตโนมัติ)
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                  <th className="py-2.5 px-4 w-20">ระดับชั้น</th>
                  <th className="py-2.5 px-4 text-right">จำนวนนักเรียน (คน)</th>
                  <th className="py-2.5 px-4">ครูรับผิดชอบการบ้าน</th>
                  <th className="py-2.5 px-4">กฎการคิดเงินการบ้าน</th>
                  <th className="py-2.5 px-4 text-right">เงินต่อครู 1 คน (บาท)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {classRosters.map(roster => {
                  const teacherNames = roster.assignedTeacherIds
                    .map(id => teachers.find(t => t.id === id)?.scheduleName)
                    .filter(Boolean)
                    .join(' และ ');

                  const count = roster.assignedTeacherIds.length || 1;
                  const perTeacherStudents = roster.studentCount / count;
                  const homeworkRate = dutyRates.find(r => r.code === 'homework')?.rate || 180;
                  const perTeacherAmount = perTeacherStudents * homeworkRate;

                  return (
                    <tr key={roster.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-bold text-slate-900">{roster.grade}</td>
                      <td className="py-3 px-4 text-right font-semibold text-slate-800">
                        {roster.studentCount} คน
                      </td>
                      <td className="py-3 px-4 font-medium text-indigo-700">
                        {teacherNames || 'ยังไม่ได้กำหนด'}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {count > 1 ? (
                          <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-[11px] font-medium">
                            แบ่งครึ่งเท่ากัน ({roster.studentCount} ÷ {count} = {perTeacherStudents} คน/ท่าน)
                          </span>
                        ) : (
                          <span className="text-slate-600">รับผิดชอบเดี่ยวเต็มห้อง</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        ฿{formatCurrency(perTeacherAmount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SubTab 4: Phase 2 Decision Points (Crucial Section 10 from brief!) */}
      {activeSubTab === 'decisions' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white p-5 rounded-2xl shadow-sm">
            <h3 className="font-bold text-base flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-indigo-400" />
              <span>ประเด็นการตัดสินใจสถาปัตยกรรมก่อนเข้า Phase 2</span>
            </h3>
            <p className="text-indigo-200 text-xs mt-1">
              เอกสารออกแบบกำหนด 4 ข้อที่ต้องตัดสินใจ ระบบจำลองการตั้งค่าและสวิตช์ทั้ง 4 ประเด็นไว้ให้ทดสอบล่วงหน้าได้ทันที
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Decision 1 */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                  ประเด็นที่ 1: บัญชีล็อกอิน
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  {localConfig.authMode === 'google_workspace' ? 'Google Workspace' : 'Internal Login'}
                </span>
              </div>
              <h4 className="font-bold text-slate-900 text-sm">
                การยืนยันตัวตนของผู้ใช้งาน
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                ครูทุกคนมีบัญชี Google Workspace ของโรงเรียน (@tr.ac.th) ครบทุกคนหรือไม่?
                หากมีครบ สามารถล็อกอินด้วย SSO บัญชีโรงเรียนได้อัตโนมัติ
              </p>
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="authMode"
                    checked={localConfig.authMode === 'internal'}
                    onChange={() => {
                      const updated = { ...localConfig, authMode: 'internal' as const };
                      setLocalConfig(updated);
                      onUpdateConfig(updated);
                    }}
                    className="text-indigo-600"
                  />
                  <span>ใช้ Username / Password ภายใน (ระบบ Users Sheet + Session Token)</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="authMode"
                    checked={localConfig.authMode === 'google_workspace'}
                    onChange={() => {
                      const updated = { ...localConfig, authMode: 'google_workspace' as const };
                      setLocalConfig(updated);
                      onUpdateConfig(updated);
                    }}
                    className="text-indigo-600"
                  />
                  <span>ใช้ Google Workspace Login อัตโนมัติ (Session.getActiveUser().getEmail())</span>
                </label>
              </div>
            </div>

            {/* Decision 2 */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  ประเด็นที่ 2: กฎหารเงินการบ้าน
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  {localConfig.homeworkSplitMode === 'equal_half' ? 'หารครึ่ง 50/50' : 'ตามสัดส่วนนักเรียน'}
                </span>
              </div>
              <h4 className="font-bold text-slate-900 text-sm">
                การแบ่งเงินค่าการบ้านกรณีมีครู 2 คนในห้อง
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                ในไฟล์เดิมทำแบบไม่สม่ำเสมอ บางแถวหารสอง บางแถวไม่หาร ระบบใหม่รวมศูนย์ตรรกะไว้ที่ Engine
              </p>
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="homeworkSplitMode"
                    checked={localConfig.homeworkSplitMode === 'equal_half'}
                    onChange={() => {
                      const updated = { ...localConfig, homeworkSplitMode: 'equal_half' as const };
                      setLocalConfig(updated);
                      onUpdateConfig(updated);
                    }}
                    className="text-indigo-600"
                  />
                  <span>หารครึ่งเท่ากันเสมอ 50/50 (สูตรมาตรฐาน (อัตรา × จำนวน นร.) ÷ 2)</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="homeworkSplitMode"
                    checked={localConfig.homeworkSplitMode === 'custom_ratio'}
                    onChange={() => {
                      const updated = { ...localConfig, homeworkSplitMode: 'custom_ratio' as const };
                      setLocalConfig(updated);
                      onUpdateConfig(updated);
                    }}
                    className="text-indigo-600"
                  />
                  <span>แบ่งตามสัดส่วนรายชื่อนักเรียนที่ครูแต่ละคนดูแลจริง</span>
                </label>
              </div>
            </div>

            {/* Decision 3 */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  ประเด็นที่ 3: วันขาดและสอนแทน
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  {localConfig.absentTrackingMode === 'manual_input' ? 'กรอกมือ (Phase 1)' : 'ดึงจากระบบเช็คชื่อ'}
                </span>
              </div>
              <h4 className="font-bold text-slate-900 text-sm">
                ที่มาของข้อมูลการขาดงานและการสอนแทน
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                ใน Phase 1 ใช้วิธีให้ฝ่ายวิชาการกรอกตัวเลขวันขาดและเงินสอนแทนโดยตรงในตารางคำนวณ
              </p>
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="absentTrackingMode"
                    checked={localConfig.absentTrackingMode === 'manual_input'}
                    onChange={() => {
                      const updated = { ...localConfig, absentTrackingMode: 'manual_input' as const };
                      setLocalConfig(updated);
                      onUpdateConfig(updated);
                    }}
                    className="text-indigo-600"
                  />
                  <span>ฝ่ายวิชาการกรอกมือในหน้าตารางคำนวณ (Inline Edit)</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="absentTrackingMode"
                    checked={localConfig.absentTrackingMode === 'automated_sync'}
                    onChange={() => {
                      const updated = { ...localConfig, absentTrackingMode: 'automated_sync' as const };
                      setLocalConfig(updated);
                      onUpdateConfig(updated);
                    }}
                    className="text-indigo-600"
                  />
                  <span>เชื่อมโยงตารางบันทึกการสอนแทนและสแกนนิ้วเช็คชื่ออัตโนมัติ (Phase 2)</span>
                </label>
              </div>
            </div>

            {/* Decision 4 */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                  ประเด็นที่ 4: รูปแบบตารางนำเข้า
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  {localConfig.scheduleFormatType === 'fixed_standard' ? 'โครงสร้าง 3 โซนคงที่' : 'ปรับคอลัมน์ยืดหยุ่น'}
                </span>
              </div>
              <h4 className="font-bold text-slate-900 text-sm">
                ความสม่ำเสมอของไฟล์ตารางสอนที่โรงเรียนใช้
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                โรงเรียนใช้โครงสร้าง 3 โซน (การบ้าน / รายคาบ / เวรประจำวัน) เหมือนเดิมทุกเดือนหรือไม่
              </p>
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="scheduleFormatType"
                    checked={localConfig.scheduleFormatType === 'fixed_standard'}
                    onChange={() => {
                      const updated = { ...localConfig, scheduleFormatType: 'fixed_standard' as const };
                      setLocalConfig(updated);
                      onUpdateConfig(updated);
                    }}
                    className="text-indigo-600"
                  />
                  <span>โครงสร้างคงที่ตามตัวอย่างไฟล์เดิม (อ่าน 3 โซนตรง ๆ รวดเร็ว)</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="scheduleFormatType"
                    checked={localConfig.scheduleFormatType === 'dynamic_mapping'}
                    onChange={() => {
                      const updated = { ...localConfig, scheduleFormatType: 'dynamic_mapping' as const };
                      setLocalConfig(updated);
                      onUpdateConfig(updated);
                    }}
                    className="text-indigo-600"
                  />
                  <span>มีขั้นตอนแม็ปคอลัมน์และโซนก่อนนำเข้าทุกครั้ง (กรณีแบบฟอร์มเปลี่ยนบ่อย)</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SubTab 5: School Config */}
      {activeSubTab === 'school' && (
        <form onSubmit={handleSaveSchoolConfig} className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4 max-w-2xl">
          <h3 className="font-bold text-slate-800 text-base">
            ข้อมูลโรงเรียนและรายชื่อผู้ลงนามบนสลิป (Config Sheet)
          </h3>

          {configSaved && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>บันทึกการตั้งค่าเรียบร้อยแล้ว</span>
            </div>
          )}

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">ชื่อโรงเรียน / สถาบัน</label>
              <input
                type="text"
                disabled={!isAdmin}
                value={localConfig.schoolName}
                onChange={e => setLocalConfig({ ...localConfig, schoolName: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">ปีการศึกษา</label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={localConfig.academicYear}
                  onChange={e => setLocalConfig({ ...localConfig, academicYear: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">รหัสเดือนเริ่มต้น</label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={localConfig.currentMonthId}
                  onChange={e => setLocalConfig({ ...localConfig, currentMonthId: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">ชื่อผู้อำนวยการโรงเรียน (ผู้มีอำนาจอนุมัติ)</label>
              <input
                type="text"
                disabled={!isAdmin}
                value={localConfig.principalName}
                onChange={e => setLocalConfig({ ...localConfig, principalName: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">ชื่อหัวหน้าฝ่ายวิชาการ</label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={localConfig.academicHeadName}
                  onChange={e => setLocalConfig({ ...localConfig, academicHeadName: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">ชื่อหัวหน้าฝ่ายการเงิน / ผู้จัดทำ</label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={localConfig.financeHeadName}
                  onChange={e => setLocalConfig({ ...localConfig, financeHeadName: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {isAdmin && (
            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>บันทึกการตั้งค่า</span>
              </button>
            </div>
          )}
        </form>
      )}

      {/* Modal: Add New Teacher */}
      {showAddTeacher && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 sm:p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="font-bold text-slate-900 text-base">เพิ่มครูใหม่ในทะเบียน (Teachers Sheet)</h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  ชื่อที่ใช้พิมพ์ในตารางสอน (Schedule Name) *ต้องตรงกับในตารางเป๊ะ*
                </label>
                <input
                  type="text"
                  placeholder="เช่น นิลิน, กานต์, Teacher John"
                  value={newTeacherScheduleName}
                  onChange={e => setNewTeacherScheduleName(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">ชื่อ-สกุลเต็ม (สำหรับใบเสร็จ/สลิป)</label>
                <input
                  type="text"
                  placeholder="เช่น นายกานต์ ศรีสมบัติ"
                  value={newTeacherFullName}
                  onChange={e => setNewTeacherFullName(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">กลุ่มสาระการเรียนรู้ / แผนก</label>
                <input
                  type="text"
                  placeholder="เช่น กลุ่มสาระฯ ภาษาต่างประเทศ"
                  value={newTeacherDept}
                  onChange={e => setNewTeacherDept(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">ประเภทค่าเหมาจ่ายรายเดือน</label>
                <select
                  value={newTeacherLumpSum}
                  onChange={e => setNewTeacherLumpSum(e.target.value as any)}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="none">ไม่มี (คิดตามจำนวนคาบ/เวร/การบ้านปกติ)</option>
                  <option value="special_coordinator">กศพ. (ผู้ประสานงานพิเศษ)</option>
                  <option value="back_office">Back Office (ธุรการและสนับสนุนงาน)</option>
                </select>
              </div>

              {newTeacherLumpSum !== 'none' && (
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">จำนวนเงินเหมาจ่าย (บาท/เดือน)</label>
                  <input
                    type="number"
                    min={0}
                    step={100}
                    value={newTeacherLumpAmount}
                    onChange={e => setNewTeacherLumpAmount(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowAddTeacher(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleAddTeacher}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                บันทึกครูในระบบ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
