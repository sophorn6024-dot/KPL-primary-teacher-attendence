/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AttendanceLog, Teacher } from './types';

// Web Audio API Synthesizer beep
let audioCtx: AudioContext | null = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
}

export function playBeep() {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    // Nice friendly high-pitched "ding"
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  } catch (error) {
    console.warn('Audio play failed', error);
  }
}

export function playErrorBeep() {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    // Low double buzzy tone for error warning
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.45);
  } catch (error) {
    console.warn('Audio play failed', error);
  }
}

// Translate normal digits to Khmer digits
export function khmerNumber(num: number | string): string {
  const numStr = String(num);
  const khmerDigits = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];
  return numStr.replace(/\d/g, (match) => khmerDigits[parseInt(match, 10)]);
}

// Format Date into beautiful Khmer long calendar string
export function formatKhmerDate(dateInput: Date | string): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '';

  const dayOfWeek = date.getDay();
  const day = date.getDate();
  const month = date.getMonth();
  const year = date.getFullYear();

  const khmerDays = [
    'ថ្ងៃអាទិត្យ',
    'ថ្ងៃច័ន្ទ',
    'ថ្ងៃអង្គារ',
    'ថ្ងៃពុធ',
    'ថ្ងៃព្រហស្បតិ៍',
    'ថ្ងៃសុក្រ',
    'ថ្ងៃសៅរ៍',
  ];

  const khmerMonths = [
    'មករា',
    'កុម្ភៈ',
    'មីនា',
    'មេសា',
    'ឧសភា',
    'មិថុនា',
    'កក្កដា',
    'សីហា',
    'កញ្ញា',
    'តុលា',
    'វិច្ឆិកា',
    'ធ្នូ',
  ];

  const formattedDay = khmerNumber(String(day).padStart(2, '0'));
  const formattedYear = khmerNumber(year);

  return `${khmerDays[dayOfWeek]} ទី${formattedDay} ខែ${khmerMonths[month]} ឆ្នាំ${formattedYear}`;
}

// Convert YYYY-MM-DD to display-friendly format
export function displayKhmerShortDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  const day = khmerNumber(String(date.getDate()).padStart(2, '0'));
  const month = khmerNumber(String(date.getMonth() + 1).padStart(2, '0'));
  const year = khmerNumber(date.getFullYear());
  return `${day}/${month}/${year}`;
}

// Export logs to CSV (Unicode/UTF-8 with BOM for elegant opening in Microsoft Excel)
export function exportLogsToCSV(logs: AttendanceLog[]): void {
  const headers = [
    'កាលបរិច្ឆេទ',
    'ម៉ោងស្កេន',
    'អត្តសញ្ញាណប័ណ្ណគ្រូ',
    'ឈ្មោះគ្រូ',
    'ភេទ',
    'ថ្នាក់បង្រៀន',
    'វេនបង្រៀន',
    'ស្ថានភាព',
    'របៀបស្រង់',
    'កំណត់សម្គាល់',
  ];

  const rows = logs.map((log) => [
    log.date,
    log.time || '-',
    log.teacherId,
    log.teacherName,
    log.grade + '(' + log.section + ')',
    log.shift,
    log.status,
    log.method,
    log.note || '',
  ]);

  const csvContent =
    '\uFEFF' + // UTF-8 BOM so Excel opens Khmer characters correctly
    [headers.join(','), ...rows.map((e) => e.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `វត្តមានគ្រូ_កំពង់ល្ពៅ_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Export teacher list to CSV template or data back-up
export function exportTeachersToCSV(teachers: Teacher[]): void {
  const headers = ['id', 'Name', 'Gender', 'DOB', 'Phone Number', 'Grade', 'Section', 'Shift'];
  const rows = teachers.map((t) => [
    t.id,
    t.name,
    t.gender,
    t.dob,
    t.phone,
    t.grade,
    t.section,
    t.shift,
  ]);

  const csvContent =
    '\uFEFF' + // UTF-8 BOM
    [headers.join(','), ...rows.map((e) => e.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `បញ្ជីឈ្មោះគ្រូ_កំពង់ល្ពៅ.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Parse imported CSV text of teachers
export function parseCsvTeachers(text: string): Teacher[] {
  // Remove BOM if present
  let cleanText = text;
  if (text.startsWith('\uFEFF')) {
    cleanText = text.substring(1);
  }

  const lines = cleanText.split(/\r?\n/);
  if (lines.length < 2) return [];

  // Parse header to match columns
  const header = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
  const teachers: Teacher[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Split considering double quotes for comma-safe parsing
    const cols: string[] = [];
    let insideQuotes = false;
    let currentCol = '';

    for (let charIdx = 0; charIdx < line.length; charIdx++) {
      const char = line[charIdx];
      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === ',' && !insideQuotes) {
        cols.push(currentCol.trim().replace(/^["']|["']$/g, ''));
        currentCol = '';
      } else {
        currentCol += char;
      }
    }
    cols.push(currentCol.trim().replace(/^["']|["']$/g, ''));

    if (cols.length < 2) continue;

    // Map headers to properties (supports user requested: id, Name, Gender, DOB, Phone Number, etc.)
    const getVal = (possibleHeaders: string[]) => {
      const idx = header.findIndex(h => possibleHeaders.includes(h.toLowerCase()));
      return idx !== -1 && idx < cols.length ? cols[idx] : '';
    };

    const id = getVal(['id', 'អត្តសញ្ញាណ', 'លេខកូដ']) || `KPL-${String(i).padStart(3, '0')}`;
    const name = getVal(['name', 'ឈ្មោះ', 'គោត្តនាមនិងនាម']) || cols[1] || '';
    
    let genderRaw = getVal(['gender', 'ភេទ']) || cols[2] || 'ប្រុស';
    const gender: 'ប្រុស' | 'ស្រី' = genderRaw.includes('ស្រី') || genderRaw.toLowerCase().startsWith('f') ? 'ស្រី' : 'ប្រុស';
    
    const dob = getVal(['dob', 'dob', 'date of birth', 'ថ្ងៃខែឆ្នាំកំណើត', 'ថ្ងៃកំណើត']) || cols[3] || '1990-01-01';
    const phone = getVal(['phone number', 'phone', 'លេខទូរស័ព្ទ', 'ទូរស័ព្ទ']) || cols[4] || '';
    
    const grade = getVal(['grade', 'ថ្នាក់', 'ថ្នាក់ទី']) || cols[5] || 'ថ្នាក់ទី១';
    
    let sectionRaw = getVal(['section', 'កូដថ្នាក់']) || cols[6] || 'ក';
    const section: 'ក' | 'ខ' = sectionRaw.includes('ខ') || sectionRaw.toLowerCase().includes('b') ? 'ខ' : 'ក';
    
    let shiftRaw = getVal(['shift', 'វេន', 'វេនបង្រៀន']) || cols[7] || 'ពេលព្រឹក';
    const shift: 'ពេលព្រឹក' | 'ពេលរសៀល' = shiftRaw.includes('រសៀល') || shiftRaw.toLowerCase().includes('afternoon') ? 'ពេលរសៀល' : 'ពេលព្រឹក';

    if (name) {
      teachers.push({
        id,
        name,
        gender,
        dob,
        phone,
        grade,
        section,
        shift,
      });
    }
  }

  return teachers;
}
