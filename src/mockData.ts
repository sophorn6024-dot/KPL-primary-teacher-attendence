/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Teacher, AttendanceLog } from './types';

// Let's pre-populate mock teachers
export const INITIAL_TEACHERS: Teacher[] = [
  {
    id: 'KPL-001',
    name: 'សេង សុភាន់',
    gender: 'ប្រុស',
    dob: '1988-04-12',
    phone: '0884640290',
    grade: 'ថ្នាក់ទី៤',
    section: 'ក',
    shift: 'ពេលរសៀល',
  },
  {
    id: 'KPL-002',
    name: 'ចាន់ ស្រីនីុ',
    gender: 'ស្រី',
    dob: '1992-10-05',
    phone: '0975544332',
    grade: 'ថ្នាក់ទី១',
    section: 'ក',
    shift: 'ពេលព្រឹក',
  },
  {
    id: 'KPL-003',
    name: 'លី មិនាហ្សក',
    gender: 'ប្រុស',
    dob: '1985-07-22',
    phone: '012987654',
    grade: 'ថ្នាក់ទី៥',
    section: 'ខ',
    shift: 'ពេលព្រឹក',
  },
  {
    id: 'KPL-004',
    name: 'សឿន ធីតា',
    gender: 'ស្រី',
    dob: '1995-12-30',
    phone: '089123456',
    grade: 'ថ្នាក់ទី៦',
    section: 'ក',
    shift: 'ពេលរសៀល',
  },
  {
    id: 'KPL-005',
    name: 'កែវ សុខា',
    gender: 'ប្រុស',
    dob: '1981-01-15',
    phone: '077654321',
    grade: 'ថ្នាក់ទី៣',
    section: 'ខ',
    shift: 'ពេលព្រឹក',
  },
  {
    id: 'KPL-006',
    name: 'ឈន លីដា',
    gender: 'ស្រី',
    dob: '1990-08-18',
    phone: '0961122334',
    grade: 'ថ្នាក់ទី២',
    section: 'ក',
    shift: 'ពេលរសៀល',
  },
];

// Generate previous days logs (yesterday and today early check-ins)
export const getInitialLogs = (): AttendanceLog[] => {
  const currentDate = new Date();
  const format = (d: Date) => d.toISOString().split('T')[0];
  
  const todayStr = format(currentDate);
  const tempDate = new Date();
  tempDate.setDate(currentDate.getDate() - 1);
  const yesterdayStr = format(tempDate);
  
  return [
    // Yesterday morning checked in via QR
    {
      id: 'log-y-1',
      teacherId: 'KPL-002',
      teacherName: 'ចាន់ ស្រីនីុ',
      date: yesterdayStr,
      time: '06:54:12',
      status: 'វត្តមាន',
      method: 'QR',
      shift: 'ពេលព្រឹក',
      grade: 'ថ្នាក់ទី១',
      section: 'ក',
    },
    {
      id: 'log-y-2',
      teacherId: 'KPL-003',
      teacherName: 'លី មិនាហ្សក',
      date: yesterdayStr,
      time: '07:05:33',
      status: 'វត្តមាន',
      method: 'QR',
      shift: 'ពេលព្រឹក',
      grade: 'ថ្នាក់ទី៥',
      section: 'ខ',
    },
    {
      id: 'log-y-3',
      teacherId: 'KPL-005',
      teacherName: 'កែវ សុខា',
      date: yesterdayStr,
      time: '06:48:00',
      status: 'វត្តមាន',
      method: 'QR',
      shift: 'ពេលព្រឹក',
      grade: 'ថ្នាក់ទី៣',
      section: 'ខ',
    },
    // Yesterday afternoon
    {
      id: 'log-y-4',
      teacherId: 'KPL-001',
      teacherName: 'សេង សុភាន់',
      date: yesterdayStr,
      time: '12:45:22',
      status: 'វត្តមាន',
      method: 'QR',
      shift: 'ពេលរសៀល',
      grade: 'ថ្នាក់ទី៤',
      section: 'ក',
    },
    {
      id: 'log-y-5',
      teacherId: 'KPL-004',
      teacherName: 'សឿន ធីតា',
      date: yesterdayStr,
      time: '13:02:11',
      status: 'វត្តមាន',
      method: 'QR',
      shift: 'ពេលរសៀល',
      grade: 'ថ្នាក់ទី៦',
      section: 'ក',
    },
    {
      id: 'log-y-6',
      teacherId: 'KPL-006',
      teacherName: 'ឈន លីដា',
      date: yesterdayStr,
      time: '', // Absent log
      status: 'អវត្តមាន',
      method: 'ប្រព័ន្ធ',
      shift: 'ពេលរសៀល',
      grade: 'ថ្នាក់ទី២',
      section: 'ក',
      note: 'អវត្តមានគ្មានច្បាប់',
    },
    // Today checkins (only morning teachers registered so far)
    {
      id: 'log-t-1',
      teacherId: 'KPL-002',
      teacherName: 'ចាន់ ស្រីនីុ',
      date: todayStr,
      time: '06:50:45',
      status: 'វត្តមាន',
      method: 'QR',
      shift: 'ពេលព្រឹក',
      grade: 'ថ្នាក់ទី១',
      section: 'ក',
    },
    {
      id: 'log-t-2',
      teacherId: 'KPL-003',
      teacherName: 'លី មិនាហ្សក',
      date: todayStr,
      time: '', 
      status: 'ច្បាប់',
      method: 'ប្រព័ន្ធ',
      shift: 'ពេលព្រឹក',
      grade: 'ថ្នាក់ទី៥',
      section: 'ខ',
      note: 'ឈឺសុំច្បាប់',
    },
    {
      id: 'log-t-3',
      teacherId: 'KPL-005',
      teacherName: 'កែវ សុខា',
      date: todayStr,
      time: '06:55:01',
      status: 'វត្តមាន',
      method: 'QR',
      shift: 'ពេលព្រឹក',
      grade: 'ថ្នាក់ទី៣',
      section: 'ខ',
    }
  ];
};

export const GRADELIST = [
  'ថ្នាក់ទី១',
  'ថ្នាក់ទី២',
  'ថ្នាក់ទី៣',
  'ថ្នាក់ទី៤',
  'ថ្នាក់ទី៥',
  'ថ្នាក់ទី៦',
];
