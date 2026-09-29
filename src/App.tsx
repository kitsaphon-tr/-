/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  ClassRosterItem,
  DutyRate,
  MonthSchedule,
  MonthlyRecord,
  SchoolConfig,
  Teacher,
  User
} from './types';
import { storageService } from './services/storageService';
import { runCalculationEngine } from './services/calculationEngine';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { CalculationView } from './components/CalculationView';
import { ScheduleImportView } from './components/ScheduleImportView';
import { PayslipsView } from './components/PayslipsView';
import { ComparisonView } from './components/ComparisonView';
import { SettingsView } from './components/SettingsView';

export default function App() {
  // Master state
  const [config, setConfig] = useState<SchoolConfig>(() => storageService.getConfig());
  const [dutyRates, setDutyRates] = useState<DutyRate[]>(() => storageService.getDutyRates());
  const [teachers, setTeachers] = useState<Teacher[]>(() => storageService.getTeachers());
  const [classRosters, setClassRosters] = useState<ClassRosterItem[]>(() => storageService.getClassRosters());
  const [records, setRecords] = useState<Record<string, MonthlyRecord>>(() => storageService.getMonthlyRecords());
  const [activeMonthId, setActiveMonthId] = useState<string>(() => storageService.getActiveMonthId());
  const [currentUser, setCurrentUser] = useState<User>(() => storageService.getCurrentUser());
  const [currentTab, setCurrentTab] = useState<string>('dashboard');

  const allUsers = storageService.getUsers();
  const currentRecord = records[activeMonthId] || Object.values(records)[0];

  // Save changes to storage
  useEffect(() => {
    storageService.saveConfig(config);
  }, [config]);

  useEffect(() => {
    storageService.saveDutyRates(dutyRates);
  }, [dutyRates]);

  useEffect(() => {
    storageService.saveTeachers(teachers);
  }, [teachers]);

  useEffect(() => {
    storageService.saveClassRosters(classRosters);
  }, [classRosters]);

  useEffect(() => {
    storageService.saveMonthlyRecords(records);
  }, [records]);

  useEffect(() => {
    storageService.saveCurrentUser(currentUser);
  }, [currentUser]);

  useEffect(() => {
    storageService.saveActiveMonthId(activeMonthId);
  }, [activeMonthId]);

  // Recalculate helper
  const recalculateMonthRecord = (
    rec: MonthlyRecord,
    rates: DutyRate[] = dutyRates,
    tList: Teacher[] = teachers,
    rosters: ClassRosterItem[] = classRosters,
    currentDetailRows?: typeof rec.detailRows
  ): MonthlyRecord => {
    const calcResult = runCalculationEngine(
      rec.schedule,
      tList,
      rates,
      rosters,
      currentDetailRows || rec.detailRows
    );

    return {
      ...rec,
      workingDaysCount: calcResult.workingDays,
      detailRows: calcResult.detailRows,
      summaries: calcResult.summaries,
      totalSchoolBudget: calcResult.totalBudget,
      updatedAt: new Date().toISOString(),
    };
  };

  // Switch User
  const handleSwitchUser = (user: User) => {
    setCurrentUser(user);
  };

  // Switch Month
  const handleSelectMonth = (monthId: string) => {
    if (records[monthId]) {
      setActiveMonthId(monthId);
    }
  };

  // Create new Month (e.g. Month 2508 - สิงหาคม 2569)
  const handleCreateNewMonth = () => {
    const newMonthId = '2508';
    if (records[newMonthId]) {
      setActiveMonthId(newMonthId);
      return;
    }

    const daysAugust = [3, 4, 5, 6, 7, 10, 11, 13, 14, 17, 18, 19, 20, 21, 24, 25, 26, 27, 28, 31]; // 20 days
    const baseSchedule = currentRecord.schedule;

    const newSchedule: MonthSchedule = {
      monthId: newMonthId,
      monthName: 'สิงหาคม 2569',
      academicYear: config.academicYear,
      activeDays: daysAugust,
      rows: baseSchedule.rows.map(r => ({
        ...r,
        id: `aug_${r.id}`,
        assignments: Object.fromEntries(
          daysAugust.map((d, i) => [
            d.toString(),
            Object.values(r.assignments)[i % Object.values(r.assignments).length] || '',
          ])
        ),
      })),
    };

    const newCalc = runCalculationEngine(newSchedule, teachers, dutyRates, classRosters);

    const newRec: MonthlyRecord = {
      monthId: newMonthId,
      monthName: 'สิงหาคม 2569',
      year: 2569,
      monthNum: 8,
      status: 'draft',
      workingDaysCount: newCalc.workingDays,
      schedule: newSchedule,
      detailRows: newCalc.detailRows,
      summaries: newCalc.summaries,
      totalSchoolBudget: newCalc.totalBudget,
      updatedAt: new Date().toISOString(),
    };

    setRecords(prev => ({ ...prev, [newMonthId]: newRec }));
    setActiveMonthId(newMonthId);
  };

  // Inline row edit (absent days, substitution pay, notes)
  const handleUpdateDetailRow = (
    rowId: string,
    absentDays: number,
    substituteAmount: number,
    notes?: string
  ) => {
    if (!currentRecord || currentRecord.status === 'locked') return;

    const updatedDetailRows = currentRecord.detailRows.map(row => {
      if (row.id === rowId) {
        const dailyRate = row.workingDays > 0 ? row.grossAmount / row.workingDays : 0;
        const deduction = Math.round(absentDays * dailyRate * 100) / 100;
        const netAmount = Math.round((row.grossAmount - deduction) * 100) / 100;
        const finalTotal = Math.round((netAmount + substituteAmount) * 100) / 100;

        return {
          ...row,
          absentDays,
          deduction,
          netAmount,
          substituteAmount,
          finalTotal,
          notes: notes !== undefined ? notes : row.notes,
        };
      }
      return row;
    });

    const updatedRecord = recalculateMonthRecord(
      currentRecord,
      dutyRates,
      teachers,
      classRosters,
      updatedDetailRows
    );

    setRecords(prev => ({
      ...prev,
      [activeMonthId]: updatedRecord,
    }));
  };

  // Add Absence Sub Log (Phase 2 automated sync feature)
  const handleAddAbsenceLog = (logData: Omit<import('./types').AbsenceSubLog, 'id' | 'monthId' | 'loggedAt'>) => {
    if (!currentRecord || currentRecord.status === 'locked') return;

    const newLog: import('./types').AbsenceSubLog = {
      ...logData,
      id: `abs_${Date.now()}`,
      monthId: activeMonthId,
      loggedAt: new Date().toISOString(),
    };

    const currentLogs = currentRecord.absenceLogs || [];
    const updatedLogs = [...currentLogs, newLog];

    // Find the row of the absent teacher and update absent days
    let updatedDetailRows = currentRecord.detailRows.map(row => {
      if (row.teacherId === logData.absentTeacherId && (row.dutyType === logData.dutyType || row.category === logData.category)) {
        const newAbsentDays = row.absentDays + logData.daysCount;
        const dailyRate = row.workingDays > 0 ? row.grossAmount / row.workingDays : 0;
        const deduction = Math.round(newAbsentDays * dailyRate * 100) / 100;
        const netAmount = Math.round((row.grossAmount - deduction) * 100) / 100;
        const finalTotal = Math.round((netAmount + row.substituteAmount) * 100) / 100;
        return {
          ...row,
          absentDays: newAbsentDays,
          deduction,
          netAmount,
          finalTotal,
          notes: row.notes ? `${row.notes}, ขาด ${logData.daysCount} วัน (${logData.reason})` : `ขาด ${logData.daysCount} วัน (${logData.reason})`,
        };
      }
      return row;
    });

    // If there is a substitute teacher and substitute pay amount
    if (logData.substituteTeacherId && logData.substitutePayAmount > 0) {
      updatedDetailRows = updatedDetailRows.map(row => {
        if (row.teacherId === logData.substituteTeacherId && (row.dutyType === logData.dutyType || row.dutyType === 'period')) {
          const newSub = row.substituteAmount + logData.substitutePayAmount;
          const finalTotal = Math.round((row.netAmount + newSub) * 100) / 100;
          return {
            ...row,
            substituteAmount: newSub,
            finalTotal,
            notes: row.notes ? `${row.notes}, สอนแทน (+${logData.substitutePayAmount} บ.)` : `สอนแทน (+${logData.substitutePayAmount} บ.)`,
          };
        }
        return row;
      });
    }

    const updatedRecord = recalculateMonthRecord(
      { ...currentRecord, absenceLogs: updatedLogs },
      dutyRates,
      teachers,
      classRosters,
      updatedDetailRows
    );

    setRecords(prev => ({ ...prev, [activeMonthId]: { ...updatedRecord, absenceLogs: updatedLogs } }));
  };

  // Delete Absence Log
  const handleDeleteAbsenceLog = (logId: string) => {
    if (!currentRecord || currentRecord.status === 'locked') return;
    const currentLogs = currentRecord.absenceLogs || [];
    const updatedLogs = currentLogs.filter(l => l.id !== logId);

    // Re-evaluate from baseline
    const baseCalc = runCalculationEngine(currentRecord.schedule, teachers, dutyRates, classRosters);
    // Apply remaining logs
    let newDetailRows = [...baseCalc.detailRows];
    updatedLogs.forEach(log => {
      newDetailRows = newDetailRows.map(row => {
        if (row.teacherId === log.absentTeacherId && (row.dutyType === log.dutyType || row.category === log.category)) {
          const newAbsentDays = row.absentDays + log.daysCount;
          const dailyRate = row.workingDays > 0 ? row.grossAmount / row.workingDays : 0;
          const deduction = Math.round(newAbsentDays * dailyRate * 100) / 100;
          const netAmount = Math.round((row.grossAmount - deduction) * 100) / 100;
          return {
            ...row,
            absentDays: newAbsentDays,
            deduction,
            netAmount,
            finalTotal: netAmount + row.substituteAmount,
          };
        }
        if (log.substituteTeacherId && row.teacherId === log.substituteTeacherId && (row.dutyType === log.dutyType || row.dutyType === 'period')) {
          const newSub = row.substituteAmount + log.substitutePayAmount;
          return {
            ...row,
            substituteAmount: newSub,
            finalTotal: row.netAmount + newSub,
          };
        }
        return row;
      });
    });

    const updatedRecord = recalculateMonthRecord(
      { ...currentRecord, absenceLogs: updatedLogs },
      dutyRates,
      teachers,
      classRosters,
      newDetailRows
    );
    setRecords(prev => ({ ...prev, [activeMonthId]: { ...updatedRecord, absenceLogs: updatedLogs } }));
  };

  // Recalculate active month from schedule
  const handleRecalculateCurrentMonth = () => {
    if (!currentRecord) return;
    const recomputed = recalculateMonthRecord(currentRecord, dutyRates, teachers, classRosters);
    setRecords(prev => ({
      ...prev,
      [activeMonthId]: recomputed,
    }));
  };

  // Lock / Unlock active month
  const handleToggleLock = () => {
    if (!currentRecord) return;
    const nextStatus = currentRecord.status === 'locked' ? 'draft' : 'locked';
    const updated: MonthlyRecord = {
      ...currentRecord,
      status: nextStatus,
      lockedAt: nextStatus === 'locked' ? new Date().toISOString() : undefined,
    };
    setRecords(prev => ({
      ...prev,
      [activeMonthId]: updated,
    }));
  };

  // Update schedule
  const handleUpdateSchedule = (newSchedule: MonthSchedule) => {
    if (!currentRecord || currentRecord.status === 'locked') return;
    const updatedRecordWithSchedule: MonthlyRecord = {
      ...currentRecord,
      schedule: newSchedule,
    };
    const recomputed = recalculateMonthRecord(
      updatedRecordWithSchedule,
      dutyRates,
      teachers,
      classRosters
    );
    setRecords(prev => ({
      ...prev,
      [activeMonthId]: recomputed,
    }));
  };

  // Update Master Config
  const handleUpdateConfig = (newConfig: SchoolConfig) => {
    setConfig(newConfig);
  };

  // Update Master Duty Rates
  const handleUpdateDutyRates = (newRates: DutyRate[]) => {
    setDutyRates(newRates);
    // Propagate to current month if in draft
    if (currentRecord && currentRecord.status === 'draft') {
      const recomputed = recalculateMonthRecord(currentRecord, newRates, teachers, classRosters);
      setRecords(prev => ({
        ...prev,
        [activeMonthId]: recomputed,
      }));
    }
  };

  // Update Master Teachers
  const handleUpdateTeachers = (newTeachers: Teacher[]) => {
    setTeachers(newTeachers);
    if (currentRecord && currentRecord.status === 'draft') {
      const recomputed = recalculateMonthRecord(currentRecord, dutyRates, newTeachers, classRosters);
      setRecords(prev => ({
        ...prev,
        [activeMonthId]: recomputed,
      }));
    }
  };

  // Update Master Class Rosters
  const handleUpdateClassRosters = (newRosters: ClassRosterItem[]) => {
    setClassRosters(newRosters);
    if (currentRecord && currentRecord.status === 'draft') {
      const recomputed = recalculateMonthRecord(currentRecord, dutyRates, teachers, newRosters);
      setRecords(prev => ({
        ...prev,
        [activeMonthId]: recomputed,
      }));
    }
  };

  // Reset to default
  const handleResetData = () => {
    storageService.resetToDefault();
    setConfig(storageService.getConfig());
    setDutyRates(storageService.getDutyRates());
    setTeachers(storageService.getTeachers());
    setClassRosters(storageService.getClassRosters());
    setRecords(storageService.getMonthlyRecords());
    setCurrentUser(storageService.getCurrentUser());
    setActiveMonthId('2506');
    setCurrentTab('dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-indigo-500 selection:text-white font-['Sarabun',sans-serif]">
      {/* Navigation Header */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        config={config}
        currentUser={currentUser}
        onSwitchUser={handleSwitchUser}
        allUsers={allUsers}
        records={records}
        activeMonthId={activeMonthId}
        onSelectMonth={handleSelectMonth}
        onCreateNewMonth={handleCreateNewMonth}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 pt-5">
        {currentTab === 'dashboard' && currentRecord && (
          <DashboardView
            record={currentRecord}
            currentUser={currentUser}
            teachers={teachers}
            dutyRates={dutyRates}
            config={config}
            onNavigateTab={setCurrentTab}
            onLockToggle={handleToggleLock}
          />
        )}

        {currentTab === 'calculation' && currentRecord && (
          <CalculationView
            record={currentRecord}
            currentUser={currentUser}
            config={config}
            teachers={teachers}
            onUpdateDetailRow={handleUpdateDetailRow}
            onRecalculateAll={handleRecalculateCurrentMonth}
            onToggleLock={handleToggleLock}
            onAddAbsenceLog={handleAddAbsenceLog}
            onDeleteAbsenceLog={handleDeleteAbsenceLog}
          />
        )}

        {currentTab === 'schedule' && currentRecord && (
          <ScheduleImportView
            record={currentRecord}
            teachers={teachers}
            currentUser={currentUser}
            onUpdateSchedule={handleUpdateSchedule}
            onRunCalculation={handleRecalculateCurrentMonth}
          />
        )}

        {currentTab === 'payslips' && currentRecord && (
          <PayslipsView
            record={currentRecord}
            currentUser={currentUser}
            config={config}
          />
        )}

        {currentTab === 'comparison' && (
          <ComparisonView
            records={records}
            teachers={teachers}
            currentMonthId={activeMonthId}
          />
        )}

        {currentTab === 'settings' && (
          <SettingsView
            config={config}
            dutyRates={dutyRates}
            teachers={teachers}
            classRosters={classRosters}
            currentUser={currentUser}
            onUpdateConfig={handleUpdateConfig}
            onUpdateDutyRates={handleUpdateDutyRates}
            onUpdateTeachers={handleUpdateTeachers}
            onUpdateClassRosters={handleUpdateClassRosters}
            onResetData={handleResetData}
          />
        )}
      </main>

      {/* App Footer */}
      <footer className="no-print mt-auto border-t border-slate-200 bg-white py-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div>
            <strong className="text-slate-700">{config.schoolName}</strong> · ระบบคำนวณเงินสอนพิเศษและค่าตอบแทน (Phase 2)
          </div>
          <div className="text-[11px] text-slate-400">
            ออกแบบรองรับ Google Apps Script + Sheets + Drive · ฟอนต์ Sarabun · หน้าจอ Responsive บนมือถือและคอมพิวเตอร์
          </div>
        </div>
      </footer>
    </div>
  );
}
