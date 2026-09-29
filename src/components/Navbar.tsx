import React from 'react';
import {
  Calendar,
  ChevronDown,
  DollarSign,
  FileSpreadsheet,
  FileText,
  GraduationCap,
  Layers,
  Lock,
  LogOut,
  Sliders,
  TrendingUp,
  Unlock,
  UserCheck,
  Users
} from 'lucide-react';
import { MonthlyRecord, SchoolConfig, User } from '../types';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  config: SchoolConfig;
  currentUser: User;
  onSwitchUser: (user: User) => void;
  allUsers: User[];
  records: Record<string, MonthlyRecord>;
  activeMonthId: string;
  onSelectMonth: (monthId: string) => void;
  onCreateNewMonth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  config,
  currentUser,
  onSwitchUser,
  allUsers,
  records,
  activeMonthId,
  onSelectMonth,
  onCreateNewMonth,
}) => {
  const [showUserDropdown, setShowUserDropdown] = React.useState(false);
  const [showMonthDropdown, setShowMonthDropdown] = React.useState(false);

  const activeRecord = records[activeMonthId];
  const isLocked = activeRecord?.status === 'locked';

  const navItems = [
    { id: 'dashboard', label: 'แดชบอร์ด', icon: Layers },
    { id: 'calculation', label: 'ตารางคำนวณ', icon: DollarSign },
    { id: 'schedule', label: 'ตารางสอน & นำเข้า', icon: FileSpreadsheet },
    { id: 'payslips', label: 'สลิปค่าตอบแทน', icon: FileText },
    { id: 'comparison', label: 'เปรียบเทียบเดือน', icon: TrendingUp },
    { id: 'settings', label: 'ตั้งค่า & มาสเตอร์', icon: Sliders },
  ];

  return (
    <header className="no-print bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & School Title */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onSelectTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-700 to-blue-500 flex items-center justify-center text-white shadow-sm ring-2 ring-indigo-100">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-base sm:text-lg tracking-tight">
                  {config.schoolName}
                </span>
                <span className="hidden sm:inline-flex px-2 py-0.5 text-xs font-semibold bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">
                  ระบบค่าตอบแทนสอนพิเศษ
                </span>
                <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Google Workspace (@tr.ac.th)
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                ปีการศึกษา {config.academicYear} · ศูนย์คำนวณรวม (Phase 2)
              </p>
            </div>
          </div>

          {/* Center/Right: Month Selector & User Switcher */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Month Selector Pill */}
            <div className="relative">
              <button
                onClick={() => setShowMonthDropdown(!showMonthDropdown)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs sm:text-sm font-medium text-slate-700 transition-colors shadow-2xs"
              >
                <Calendar className="w-4 h-4 text-indigo-600" />
                <span>{activeRecord ? activeRecord.monthName : `งวด ${activeMonthId}`}</span>
                {isLocked ? (
                  <span className="inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                    <Lock className="w-3 h-3" /> ปิดงวด
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    <Unlock className="w-3 h-3" /> ร่าง
                  </span>
                )}
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showMonthDropdown && (
                <div
                  className="absolute right-0 mt-1.5 w-60 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-xs"
                  onClick={() => setShowMonthDropdown(false)}
                >
                  <div className="px-3 py-1 font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
                    เลือกงวดประจำเดือน
                  </div>
                  {Object.values(records).map(rec => (
                    <button
                      key={rec.monthId}
                      onClick={() => onSelectMonth(rec.monthId)}
                      className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-indigo-50 transition-colors ${
                        rec.monthId === activeMonthId ? 'bg-indigo-50 text-indigo-900 font-semibold' : 'text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                        <span>{rec.monthName}</span>
                      </div>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded ${
                          rec.status === 'locked'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {rec.status === 'locked' ? 'ปิดงวด' : 'ร่าง'}
                      </span>
                    </button>
                  ))}
                  {currentUser.role === 'admin' && (
                    <div className="pt-1 mt-1 border-t border-slate-100 px-1">
                      <button
                        onClick={onCreateNewMonth}
                        className="w-full text-left px-2 py-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 font-medium flex items-center gap-1.5"
                      >
                        <span>+ สร้างงวดเดือนถัดไป (ส.ค. 2569)</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* User Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors text-xs sm:text-sm shadow-2xs"
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white ${
                    currentUser.role === 'admin' ? 'bg-purple-600' : 'bg-blue-600'
                  }`}
                >
                  {currentUser.role === 'admin' ? 'A' : 'T'}
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-xs font-semibold text-slate-800 truncate max-w-[130px]">
                    {currentUser.displayName}
                  </div>
                  <div className="text-[10px] text-slate-400 capitalize">
                    {currentUser.role === 'admin' ? 'ฝ่ายวิชาการ/การเงิน' : 'ครูผู้สอน'}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showUserDropdown && (
                <div
                  className="absolute right-0 mt-1.5 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 text-xs"
                  onClick={() => setShowUserDropdown(false)}
                >
                  <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    สลับบทบาททดสอบระบบ (Switch User)
                  </div>
                  <div className="px-3 py-1.5 bg-slate-50 border-y border-slate-100 mb-1">
                    <span className="text-[10px] text-slate-500">
                      คุณกำลังใช้งานในฐานะ: <strong className="text-slate-800">{currentUser.displayName}</strong>
                    </span>
                  </div>
                  {allUsers.map(user => (
                    <button
                      key={user.id}
                      onClick={() => onSwitchUser(user)}
                      className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-indigo-50 transition-colors ${
                        user.id === currentUser.id ? 'bg-indigo-50/70 font-semibold text-indigo-900' : 'text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${
                            user.role === 'admin' ? 'bg-purple-600' : 'bg-blue-500'
                          }`}
                        >
                          {user.role === 'admin' ? 'A' : 'T'}
                        </span>
                        <div>
                          <div>{user.displayName}</div>
                          <div className="text-[10px] text-slate-400">
                            {user.role === 'admin' ? 'สิทธิ์เต็ม (ฝ่ายวิชาการ/การเงิน)' : 'ดูเฉพาะยอดตนเองและสลิป'}
                          </div>
                        </div>
                      </div>
                      {user.id === currentUser.id && <UserCheck className="w-4 h-4 text-indigo-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs (Mobile scrollable) */}
      <nav className="border-t border-slate-200 bg-slate-50/80 px-2 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex space-x-1 sm:space-x-2 overflow-x-auto py-1 scrollbar-none">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            // If user is teacher, some tabs have badge or note
            const isTeacherRestricted =
              currentUser.role === 'teacher' && (item.id === 'settings');

            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{item.label}</span>
                {item.id === 'payslips' && currentUser.role === 'teacher' && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500 text-white">
                    ของฉัน
                  </span>
                )}
                {isTeacherRestricted && (
                  <span className="ml-1 text-[9px] px-1 py-0.2 rounded bg-slate-200 text-slate-600">
                    อ่านอย่างเดียว
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </header>
  );
};
