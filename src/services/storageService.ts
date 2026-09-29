import {
  ClassRosterItem,
  DutyRate,
  MonthlyRecord,
  SchoolConfig,
  Teacher,
  User
} from '../types';
import {
  createInitialMonthRecords,
  initialClassRosters,
  initialDutyRates,
  initialSchoolConfig,
  initialTeachers,
  initialUsers
} from '../data/initialData';

const KEYS = {
  CONFIG: 'thantararak_config_v1',
  RATES: 'thantararak_duty_rates_v1',
  TEACHERS: 'thantararak_teachers_v1',
  ROSTERS: 'thantararak_rosters_v1',
  RECORDS: 'thantararak_records_v1',
  CURRENT_USER: 'thantararak_current_user_v1',
  ACTIVE_MONTH: 'thantararak_active_month_v1',
};

export const storageService = {
  getConfig(): SchoolConfig {
    const data = localStorage.getItem(KEYS.CONFIG);
    if (!data) return initialSchoolConfig;
    try {
      return { ...initialSchoolConfig, ...JSON.parse(data) };
    } catch {
      return initialSchoolConfig;
    }
  },

  saveConfig(config: SchoolConfig): void {
    localStorage.setItem(KEYS.CONFIG, JSON.stringify(config));
  },

  getDutyRates(): DutyRate[] {
    const data = localStorage.getItem(KEYS.RATES);
    if (!data) return initialDutyRates;
    try {
      return JSON.parse(data);
    } catch {
      return initialDutyRates;
    }
  },

  saveDutyRates(rates: DutyRate[]): void {
    localStorage.setItem(KEYS.RATES, JSON.stringify(rates));
  },

  getTeachers(): Teacher[] {
    const data = localStorage.getItem(KEYS.TEACHERS);
    if (!data) return initialTeachers;
    try {
      return JSON.parse(data);
    } catch {
      return initialTeachers;
    }
  },

  saveTeachers(teachers: Teacher[]): void {
    localStorage.setItem(KEYS.TEACHERS, JSON.stringify(teachers));
  },

  getClassRosters(): ClassRosterItem[] {
    const data = localStorage.getItem(KEYS.ROSTERS);
    if (!data) return initialClassRosters;
    try {
      return JSON.parse(data);
    } catch {
      return initialClassRosters;
    }
  },

  saveClassRosters(rosters: ClassRosterItem[]): void {
    localStorage.setItem(KEYS.ROSTERS, JSON.stringify(rosters));
  },

  getMonthlyRecords(): Record<string, MonthlyRecord> {
    const data = localStorage.getItem(KEYS.RECORDS);
    if (!data) {
      const init = createInitialMonthRecords();
      localStorage.setItem(KEYS.RECORDS, JSON.stringify(init));
      return init;
    }
    try {
      return JSON.parse(data);
    } catch {
      const init = createInitialMonthRecords();
      return init;
    }
  },

  saveMonthlyRecords(records: Record<string, MonthlyRecord>): void {
    localStorage.setItem(KEYS.RECORDS, JSON.stringify(records));
  },

  getCurrentUser(): User {
    const data = localStorage.getItem(KEYS.CURRENT_USER);
    if (!data) return initialUsers[0]; // Admin by default
    try {
      return JSON.parse(data);
    } catch {
      return initialUsers[0];
    }
  },

  saveCurrentUser(user: User): void {
    localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user));
  },

  getActiveMonthId(): string {
    return localStorage.getItem(KEYS.ACTIVE_MONTH) || '2506';
  },

  saveActiveMonthId(monthId: string): void {
    localStorage.setItem(KEYS.ACTIVE_MONTH, monthId);
  },

  getUsers(): User[] {
    return initialUsers;
  },

  resetToDefault(): void {
    localStorage.removeItem(KEYS.CONFIG);
    localStorage.removeItem(KEYS.RATES);
    localStorage.removeItem(KEYS.TEACHERS);
    localStorage.removeItem(KEYS.ROSTERS);
    localStorage.removeItem(KEYS.RECORDS);
    localStorage.removeItem(KEYS.CURRENT_USER);
    localStorage.removeItem(KEYS.ACTIVE_MONTH);
  },
};
