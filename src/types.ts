/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Gender = 'ប្រុស' | 'ស្រី';

export type Shift = 'ពេលព្រឹក' | 'ពេលរសៀល';

export type GradeSection = 'ក' | 'ខ';

export interface Teacher {
  id: string; // e.g., 'KPL-001'
  name: string;
  gender: Gender;
  dob: string; // e.g., '1985-06-15'
  phone: string;
  grade: string; // e.g., 'ថ្នាក់ទី៤'
  section: GradeSection;
  shift: Shift;
  photo?: string; // base64 or placeholder URL
}

export type AttendanceStatus = 'វត្តមាន' | 'ច្បាប់' | 'អវត្តមាន';

export interface AttendanceLog {
  id: string;
  teacherId: string;
  teacherName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm:ss
  status: AttendanceStatus;
  method: 'QR' | 'ប្រព័ន្ធ'; // QR scanned or Manual edit
  shift: Shift;
  grade: string;
  section: GradeSection;
  note?: string; // optional notes
}

export interface SyncSettings {
  googleSheetUrl: string;
  autoSync: boolean;
  lastSyncedAt?: string;
}
