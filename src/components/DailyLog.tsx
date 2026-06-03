/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Teacher, AttendanceLog, AttendanceStatus, GradeSection, Shift } from '../types';
import { GRADELIST } from '../mockData';
import { 
  exportLogsToCSV, 
  khmerNumber, 
  formatKhmerDate,
  displayKhmerShortDate
} from '../utils';
import { 
  Check, 
  X, 
  AlertCircle, 
  Calendar, 
  Download, 
  Filter, 
  Search, 
  CheckCircle2, 
  Clock, 
  PlusCircle, 
  BookOpen,
  Printer
} from 'lucide-react';

interface DailyLogProps {
  teachers: Teacher[];
  logs: AttendanceLog[];
  onSetManualLog: (
    teacherId: string, 
    status: AttendanceStatus, 
    note: string, 
    date: string, 
    shift: Shift
  ) => void;
  onClearLogs: () => void;
}

export default function DailyLog({
  teachers,
  logs,
  onSetManualLog,
  onClearLogs,
}: DailyLogProps) {
  const todayStr = new Date().toISOString().split('T')[0];
  
  // Grid Filter States
  const [targetDate, setTargetDate] = useState(todayStr);
  const [targetGrade, setTargetGrade] = useState('ថ្នាក់ទី៤');
  const [targetSection, setTargetSection] = useState<GradeSection>('ក');
  const [targetShift, setTargetShift] = useState<Shift>('ពេលរសៀល');

  // History Tab Filter States
  const [activeTab, setActiveTab] = useState<'grid' | 'history'>('grid');
  const [historySearchTerm, setHistorySearchTerm] = useState('');
  const [historyStatusFilter, setHistoryStatusFilter] = useState('គ្រប់ស្ថានភាព');

  // Filtered teachers list matching active Grid criteria
  const classTeachers = teachers.filter(
    (t) => t.grade === targetGrade && t.section === targetSection && t.shift === targetShift
  );

  // Find corresponding daily log of a teacher
  const getLogForTeacher = (teacherId: string) => {
    return logs.find(
      (log) => 
        log.teacherId === teacherId && 
        log.date === targetDate && 
        log.shift === targetShift
    );
  };

  const handleStatusChange = (teacherId: string, status: AttendanceStatus) => {
    const existingLog = getLogForTeacher(teacherId);
    const note = existingLog?.note || '';
    onSetManualLog(teacherId, status, note, targetDate, targetShift);
  };

  const handleNoteChange = (teacherId: string, note: string) => {
    const existingLog = getLogForTeacher(teacherId);
    const status = existingLog?.status || 'អវត្តមាន'; // default status if none set yet
    onSetManualLog(teacherId, status, note, targetDate, targetShift);
  };

  // Filtered attendance history log listing
  const filteredHistory = logs.filter((log) => {
    const sTerm = historySearchTerm.toLowerCase();
    const matchSearch = 
      log.teacherName.toLowerCase().includes(sTerm) || 
      log.teacherId.toLowerCase().includes(sTerm);
    
    const matchStatus = historyStatusFilter === 'គ្រប់ស្ថានភាព' || log.status === historyStatusFilter;
    
    return matchSearch && matchStatus;
  }).sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time));

  return (
    <div className="space-y-6 font-sans">
      
      {/* Tab Switch Controls */}
      <div className="flex gap-2.5 bg-slate-100 dark:bg-zinc-800/60 p-1 w-fit rounded-2xl border border-slate-200/60 dark:border-zinc-800">
        <button
          onClick={() => setActiveTab('grid')}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'grid'
              ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-md font-sans'
              : 'text-slate-500 hover:text-slate-700 dark:text-zinc-400 font-sans'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          ស្រង់វត្តមានតាមថ្នាក់រៀន
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'history'
              ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-md font-sans'
              : 'text-slate-500 hover:text-slate-700 dark:text-zinc-400 font-sans'
          }`}
        >
          <Clock className="w-4 h-4" />
          ប្រវត្តិកំណត់ត្រា (Logs)
        </button>
      </div>

      {activeTab === 'grid' ? (
        /* Classroom Grid Attendance Form */
        <div className="space-y-6">
          
          {/* Grid Selection Filters */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-[32px] p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 dark:text-neutral-200 text-xs tracking-wider uppercase flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-zinc-800">
              <Filter className="w-4.5 h-4.5 text-indigo-600" /> ជ្រើសរើសព័ត៌មានថ្នាក់ និងវេនសិក្សាសម្រាប់ការស្រង់វត្តមាន
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-medium">
              
              {/* Date Input */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 dark:text-zinc-500">កាលបរិច្ឆេទ</label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  id="log_input_date"
                  className="w-full bg-slate-50 dark:bg-zinc-850 border border-slate-200 dark:border-zinc-800 px-3.5 py-2.5 rounded-xl text-slate-750 dark:text-zinc-300 focus:outline-none"
                />
              </div>

              {/* Grade Selector */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 dark:text-zinc-500">ថ្នាក់បង្រៀន</label>
                <select
                  value={targetGrade}
                  onChange={(e) => setTargetGrade(e.target.value)}
                  id="log_select_grade"
                  className="w-full bg-slate-50 dark:bg-zinc-850 border border-slate-200 dark:border-zinc-800 px-3.5 py-2.5 rounded-xl text-slate-750 dark:text-zinc-300 focus:outline-none"
                >
                  {GRADELIST.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              {/* Section Selector */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 dark:text-zinc-500">បន្ទប់ថ្នាក់</label>
                <select
                  value={targetSection}
                  onChange={(e) => setTargetSection(e.target.value as GradeSection)}
                  id="log_select_section"
                  className="w-full bg-slate-50 dark:bg-zinc-850 border border-slate-200 dark:border-zinc-800 px-3.5 py-2.5 rounded-xl text-slate-750 dark:text-zinc-300 focus:outline-none"
                >
                  <option value="ក">ក</option>
                  <option value="ខ">ខ</option>
                </select>
              </div>

              {/* Shift Selector */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 dark:text-zinc-500">វេនសិក្សា</label>
                <select
                  value={targetShift}
                  onChange={(e) => setTargetShift(e.target.value as Shift)}
                  id="log_select_shift"
                  className="w-full bg-slate-50 dark:bg-zinc-850 border border-slate-200 dark:border-zinc-800 px-3.5 py-2.5 rounded-xl text-slate-750 dark:text-zinc-300 focus:outline-none"
                >
                  <option value="ពេលព្រឹក">ពេលព្រឹក (៧:០០ - ១១:០០)</option>
                  <option value="ពេលរសៀល">ពេលរសៀល (១៣:០០ - ១៧:០០)</option>
                </select>
              </div>

            </div>
          </div>

          {/* Grid attendance list */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-[32px] p-6 shadow-sm overflow-hidden">
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 dark:border-zinc-800 pb-4 mb-4 gap-3">
              <div className="space-y-1">
                <h4 className="font-bold text-slate-800 dark:text-zinc-200 text-sm">
                  បញ្ជីឈ្មោះលោកគ្រូ-អ្នកគ្រូប្រចាំថ្នាក់ {targetGrade}({targetSection})
                </h4>
                <p className="text-xs text-slate-400 dark:text-zinc-500">
                  វេន{targetShift} • ថ្ងៃទី {displayKhmerShortDate(targetDate)}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-4.5 w-full sm:w-auto justify-between sm:justify-end">
                <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">
                  គ្រូសរុបប្រចាំថ្នាក់នេះ: <strong className="text-indigo-600 dark:text-indigo-400 font-mono text-sm">{khmerNumber(classTeachers.length)}</strong> នាក់
                </span>
                {classTeachers.length > 0 && (
                  <button
                    onClick={() => {
                      window.print();
                    }}
                    className="px-4.5 py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-[0.98] transition text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md shadow-rose-600/10 cursor-pointer print:hidden"
                    title="ទាញយក ឬបោះពុម្ពបញ្ជីវត្តមានថ្ងៃនេះជា PDF"
                  >
                    <Printer className="w-4 h-4" /> នាំចេញជា PDF
                  </button>
                )}
              </div>
            </div>

            {classTeachers.length === 0 ? (
              <div className="text-center py-12 space-y-3 text-slate-400 dark:text-zinc-550">
                <AlertCircle className="w-10 h-10 mx-auto stroke-1 text-slate-350" />
                <p className="text-xs font-medium">គ្មានលោកគ្រូ-អ្នកគ្រូបង្រៀនក្នុងថ្នាក់ {targetGrade}({targetSection}) វេន{targetShift} នេះឡើយ។</p>
                <p className="text-[11px] max-w-sm mx-auto">សូមបញ្ចូលឈ្មោះគ្រូបង្រៀន ឬផ្លាស់ប្ដូរថ្នាក់ និងវេនសិក្សា ដើម្បីជាជំនួយក្នុងការស្វែងរក។</p>
              </div>
            ) : (
              <div className="space-y-4">
                {classTeachers.map((t) => {
                  const log = getLogForTeacher(t.id);
                  const currentStatus = log?.status;

                  return (
                    <div
                      key={t.id}
                      className="p-4 border border-slate-150 dark:border-zinc-800/80 rounded-2xl hover:border-indigo-300/30 bg-slate-50/10 dark:bg-zinc-900/40 hover:bg-slate-50/40 dark:hover:bg-zinc-850/10 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 transition"
                    >
                      {/* Left Block - Profile info */}
                      <div className="flex items-center gap-3.5 min-w-[200px]">
                        <div className="h-11 w-11 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold text-sm border border-indigo-100/40 dark:border-indigo-900/30 rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
                          {t.photo ? (
                            <img src={t.photo} alt={t.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            t.name.split(' ').pop()?.[0] || 'T'
                          )}
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 font-mono">{t.id}</p>
                          <h4 className="font-bold text-sm text-slate-800 dark:text-zinc-200 truncate">{t.name}</h4>
                          <span className="text-[10px] text-slate-450 block dark:text-zinc-500 font-medium">
                            ភេទ: {t.gender} • ទូរស័ព្ទ: {t.phone}
                          </span>
                        </div>
                      </div>

                      {/* Middle Block - Custom 3-state radio selection buttons */}
                      <div className="flex gap-2">
                        {/* Status buttons: Present, Leave, Absent */}
                        {(['វត្តមាន', 'ច្បាប់', 'អវត្តមាន'] as AttendanceStatus[]).map((st) => {
                          const isSelected = currentStatus === st;
                          
                          let clName = '';
                          if (st === 'វត្តមាន') {
                            clName = isSelected 
                              ? 'bg-indigo-600 text-white font-bold' 
                              : 'bg-white dark:bg-zinc-900 dark:border-zinc-800 border-slate-200 text-slate-500 hover:bg-indigo-50/40 dark:hover:bg-zinc-850';
                          } else if (st === 'ច្បាប់') {
                            clName = isSelected 
                              ? 'bg-amber-500 text-white font-bold' 
                              : 'bg-white dark:bg-zinc-900 dark:border-zinc-800 border-slate-200 text-slate-500 hover:bg-amber-50/40 dark:hover:bg-zinc-850';
                          } else {
                            clName = isSelected 
                              ? 'bg-red-500 text-white font-bold' 
                              : 'bg-white dark:bg-zinc-900 dark:border-zinc-800 border-slate-200 text-slate-500 hover:bg-red-50/40';
                          }

                          return (
                            <button
                              key={st}
                              type="button"
                              onClick={() => handleStatusChange(t.id, st)}
                              className={`px-3.5 py-2 rounded-xl text-xs flex items-center gap-1 border border-transparent shadow-xs shrink-0 transition-all cursor-pointer select-none ${clName}`}
                            >
                              {isSelected && <Check className="w-3.5 h-3.5" />}
                              {st}
                            </button>
                          );
                        })}
                      </div>

                      {/* Right Block - Custom comment input */}
                      <div className="flex-1 min-w-[180px]">
                        <input
                          type="text"
                          placeholder="បញ្ចូលកំណត់សម្គាល់ (ឧ. មកយឺត, ឈឺអនុញ្ញាត)..."
                          value={log?.note || ''}
                          onChange={(e) => handleNoteChange(t.id, e.target.value)}
                          className="w-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-zinc-300 focus:outline-none focus:border-indigo-500 transition-colors"
                        />
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      ) : (
        /* History Logs Tab list */
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-[32px] p-6 shadow-sm space-y-6">
          
          {/* History Search filter bar */}
          <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 border-b border-slate-100 dark:border-zinc-800 pb-5">
            <div className="flex-1 min-w-[280px] relative">
              <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
              <input
                type="text"
                placeholder="ស្វែងរកប្រវត្តិតាមឈ្មោះ សិស្ស/គ្រូ ឬ កូដ ID..."
                value={historySearchTerm}
                onChange={(e) => setHistorySearchTerm(e.target.value)}
                className="w-full bg-slate-50 dark:bg-zinc-850 pl-11 pr-4 py-2.5 rounded-2xl text-xs font-semibold placeholder-slate-400 dark:placeholder-zinc-500 border border-transparent focus:outline-none focus:border-indigo-500/50 focus:bg-white transition"
              />
            </div>

            <div className="flex gap-2.5">
              <select
                value={historyStatusFilter}
                onChange={(e) => setHistoryStatusFilter(e.target.value)}
                className="bg-slate-50 dark:bg-zinc-850 border border-slate-200 dark:border-zinc-800 px-3.5 py-2 rounded-xl text-xs text-slate-700 dark:text-zinc-350 transition focus:outline-none"
              >
                <option value="គ្រប់ស្ថានភាព">គ្រប់ស្ថានភាព</option>
                <option value="វត្តមាន">វត្តមាន</option>
                <option value="ច្បាប់">ច្បាប់</option>
                <option value="អវត្តមាន">អវត្តមាន</option>
              </select>

              <button
                onClick={() => exportLogsToCSV(logs)}
                className="px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/20 dark:hover:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
              >
                <Download className="w-4 h-4" /> នាំចេញ Excel/CSV Logs
              </button>
            </div>
          </div>

          {/* List Display logs table */}
          {filteredHistory.length === 0 ? (
            <div className="text-center py-16 text-slate-400 space-y-2">
              <AlertCircle className="w-8 h-8 mx-auto text-slate-300 stroke-1" />
              <p className="text-xs">មិនរកឃើញព័ត៌មានកំណត់ត្រាឡើយ!</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-zinc-800">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50/50 dark:bg-zinc-800/40 border-b border-slate-200 dark:border-zinc-800 text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                  <tr>
                    <th className="px-5 py-3.5 font-sans">កាលបរិច្ឆេទ & ម៉ោង</th>
                    <th className="px-5 py-3.5">គ្រូបង្រៀន</th>
                    <th className="px-5 py-3.5 text-center">ថ្នាក់ & វេនសិក្សា</th>
                    <th className="px-5 py-3.5 text-center">ស្ថានភាព</th>
                    <th className="px-5 py-3.5 text-center">របៀបស្រង់</th>
                    <th className="px-5 py-3.5">កំណត់សម្គាល់</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/85 text-slate-700 dark:text-zinc-350 bg-white dark:bg-zinc-900">
                  {filteredHistory.map((lg) => {
                    let badgeClass = '';
                    if (lg.status === 'វត្តមាន') {
                      badgeClass = 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30';
                    } else if (lg.status === 'ច្បាប់') {
                      badgeClass = 'bg-amber-50 dark:bg-amber-950/40 text-amber-650 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30';
                    } else {
                      badgeClass = 'bg-red-50 dark:bg-red-950/40 text-red-500 dark:text-red-400 border border-red-100 dark:border-red-900/30';
                    }

                    return (
                      <tr key={lg.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-850/10">
                        <td className="px-5 py-3.5 space-y-0.5 whitespace-nowrap">
                          <p className="font-bold text-slate-800 dark:text-zinc-200">{displayKhmerShortDate(lg.date)}</p>
                          <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono">
                            {lg.time ? khmerNumber(lg.time) : '-'}
                          </span>
                        </td>
                        
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <p className="font-bold text-slate-800 dark:text-zinc-250">{lg.teacherName}</p>
                          <span className="text-[10px] font-mono text-slate-400 block dark:text-zinc-550">{lg.teacherId}</span>
                        </td>

                        <td className="px-5 py-3.5 text-center whitespace-nowrap">
                          <p className="font-semibold text-slate-600 dark:text-zinc-300">{lg.grade}({lg.section})</p>
                          <span className="text-[10px] text-slate-400 block dark:text-zinc-550 leading-relaxed">{lg.shift}</span>
                        </td>

                        <td className="px-5 py-3.5 text-center whitespace-nowrap">
                          <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold ${badgeClass}`}>
                            {lg.status}
                          </span>
                        </td>

                        <td className="px-5 py-3.5 text-center whitespace-nowrap">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-sans bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400">
                            {lg.method}
                          </span>
                        </td>

                        <td className="px-5 py-3.5 max-w-[150px] truncate">
                          <span className="text-xs text-slate-500 dark:text-zinc-400 font-sans" title={lg.note}>
                            {lg.note || '-'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Delete all data utility with safe constraints */}
          <div className="flex justify-end pt-4">
            <button
              onClick={() => {
                if (window.confirm('តើអ្នកពិតជាចង់លុបប្រវត្តិកំណត់ត្រាវត្តមានទាំងអស់ចេញពីប្រព័ន្ធមែនទេ? សកម្មភាពនេះមិនអាចបញ្ច្រាសបានឡើយ!')) {
                  onClearLogs();
                }
              }}
              id="btn_clear_all_logs"
              className="px-4 py-2 border border-red-200 hover:bg-red-50 dark:border-red-950/40 dark:hover:bg-red-950/20 text-red-600 dark:text-red-400 rounded-xl font-bold text-xs cursor-pointer inline-flex items-center gap-1 transition"
            >
              <X className="w-3.5 h-3.5" /> លុបប្រវត្តិទាំងអស់ចោល
            </button>
          </div>

        </div>
      )}

      {/* Printable Sheet for Export to PDF/Print */}
      <div id="printable-daily-log" className="hidden print:block bg-white text-black p-10 font-sans min-h-screen leading-relaxed">
        {/* National Header */}
        <div className="flex justify-between items-start border-b border-stone-200 pb-5 mb-6">
          <div className="text-left">
            <h2 className="font-extrabold text-[15px] text-stone-900">សាលាបឋមសិក្សាកំពង់ល្ពៅ</h2>
            <p className="text-[11px] text-stone-500 font-medium">ស្រុកកំពង់ល្ពៅ ខេត្តបាត់ដំបង</p>
            <p className="text-[10px] text-stone-400 font-mono mt-0.5">កូដសាលា៖ KPL-20459</p>
          </div>
          <div className="text-center space-y-1">
            <h3 className="font-black text-[15px] tracking-wide text-stone-900">ព្រះរាជាណាចក្រកម្ពុជា</h3>
            <h4 className="font-bold text-[11px] tracking-wider text-stone-700">ជាតិ សាសនា ព្រះមហាក្សត្រ</h4>
            <div className="w-20 h-[1.5px] bg-stone-300 mx-auto mt-0.5"></div>
          </div>
        </div>

        {/* Report Title */}
        <div className="text-center my-6 space-y-1">
          <h1 className="text-lg font-black text-stone-900 tracking-tight">សន្លឹករបាយការណ៍ស្រង់វត្តមានបុគ្គលិកគ្រូបង្រៀនប្រចាំថ្ងៃ</h1>
          <p className="text-[10px] text-stone-400 font-medium uppercase tracking-wider font-mono">Daily Teacher Attendance Log Sheet (Official Document)</p>
        </div>

        {/* Informative Table Grid / Meta summary details */}
        <div className="grid grid-cols-2 gap-4 border border-stone-200 rounded-2xl p-4 text-xs mb-6 bg-stone-50/50">
          <div className="space-y-2 border-r border-stone-200 pr-4">
            <p className="flex justify-between">
              <span className="text-stone-500">កាលបរិច្ឆេទ (Date)៖</span>
              <strong className="text-stone-850 font-bold">{formatKhmerDate(targetDate)}</strong>
            </p>
            <p className="flex justify-between">
              <span className="text-stone-500">វេនសិក្សា (Shift)៖</span>
              <strong className="text-stone-850 font-bold">{targetShift}</strong>
            </p>
          </div>
          <div className="space-y-2 pl-4">
            <p className="flex justify-between">
              <span className="text-stone-500">ថ្នាក់បង្រៀន (Grade & Section)៖</span>
              <strong className="text-stone-850 font-bold">{targetGrade} ({targetSection})</strong>
            </p>
            <p className="flex justify-between">
              <span className="text-stone-500">បុគ្គលិកគ្រូសរុប (Total Teachers)៖</span>
              <strong className="text-stone-850 font-extrabold font-mono text-xs">{khmerNumber(classTeachers.length)} នាក់</strong>
            </p>
          </div>
        </div>

        {/* Stat Summary Box */}
        <div className="grid grid-cols-3 gap-3.5 mb-6 text-center">
          <div className="p-3 border border-emerald-200 bg-emerald-500/5 rounded-xl">
            <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider block">វត្តមាន (Presence)</span>
            <p className="text-xl font-black font-sans text-emerald-800 mt-1">
              {khmerNumber(classTeachers.filter((t) => getLogForTeacher(t.id)?.status === 'វត្តមាន').length)} <span className="text-xs font-semibold">នាក់</span>
            </p>
          </div>
          <div className="p-3 border border-amber-200 bg-amber-500/5 rounded-xl">
            <span className="text-[10px] text-amber-700 font-bold uppercase tracking-wider block">ច្បាប់ (Leave)</span>
            <p className="text-xl font-black font-sans text-amber-800 mt-1">
              {khmerNumber(classTeachers.filter((t) => getLogForTeacher(t.id)?.status === 'ច្បាប់').length)} <span className="text-xs font-semibold">នាក់</span>
            </p>
          </div>
          <div className="p-3 border border-red-200 bg-red-500/5 rounded-xl">
            <span className="text-[10px] text-red-700 font-bold uppercase tracking-wider block">អវត្តមាន (Absent)</span>
            <p className="text-xl font-black font-sans text-red-800 mt-1">
              {khmerNumber(classTeachers.filter((t) => !getLogForTeacher(t.id) || getLogForTeacher(t.id)?.status === 'អវត្តមាន').length)} <span className="text-xs font-semibold">នាក់</span>
            </p>
          </div>
        </div>

        {/* Detailed Table Grid */}
        <div className="border border-stone-200 rounded-2xl overflow-hidden mb-8">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                <th className="px-4 py-3 text-center border-r border-stone-200 w-12 font-sans">ល.រ</th>
                <th className="px-4 py-3 border-r border-stone-200">អត្តសញ្ញាណ ID</th>
                <th className="px-4 py-3 border-r border-stone-200">គោត្តនាម - នាមខ្លួន</th>
                <th className="px-4 py-3 border-r border-stone-200 text-center w-16">ភេទ</th>
                <th className="px-4 py-3 border-r border-stone-200 text-center">លេខទូរស័ព្ទ</th>
                <th className="px-4 py-3 border-r border-stone-200 text-center">ម៉ោងចុះ</th>
                <th className="px-4 py-3 border-r border-stone-200 text-center">ស្ថានភាព</th>
                <th className="px-4 py-3">កំណត់សម្គាល់ផ្សេងៗ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 text-stone-800">
              {classTeachers.map((t, idx) => {
                const l = getLogForTeacher(t.id);
                return (
                  <tr key={t.id} className="hover:bg-stone-50/50">
                    <td className="px-4 py-3 text-center border-r border-stone-200 font-mono">{khmerNumber(idx + 1)}</td>
                    <td className="px-4 py-3 border-r border-stone-200 font-mono font-bold text-indigo-700">{t.id}</td>
                    <td className="px-4 py-3 border-r border-stone-200 font-bold">{t.name}</td>
                    <td className="px-4 py-3 border-r border-stone-200 text-center">{t.gender}</td>
                    <td className="px-4 py-3 border-r border-stone-200 text-center font-mono">{t.phone}</td>
                    <td className="px-4 py-3 border-r border-stone-200 text-center font-mono">{l?.time ? khmerNumber(l.time) : '-'}</td>
                    <td className="px-4 py-3 border-r border-stone-200 text-center">
                      <span className={`font-black text-[11px] ${
                        l?.status === 'វត្តមាន' 
                          ? 'text-emerald-700 font-sans' 
                          : l?.status === 'ច្បាប់' 
                            ? 'text-amber-600 font-sans' 
                            : 'text-red-700 font-sans'
                      }`}>
                        {l?.status || 'អវត្តមាន'}
                      </span>
                    </td>
                    <td className="px-4 py-3 italic text-stone-500 text-[11px] max-w-[150px] truncate">{l?.note || '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Print-only Note */}
        <p className="text-[9px] text-stone-400 italic mb-8">
          * របាយការណ៍នេះត្រូវបានបង្កើតឡើងស្វ័យប្រវត្តិតាមរយៈប្រព័ន្ធគ្រប់គ្រងសាលាឌីជីថល (School Management App) និងសមកាលកម្មរួចរាល់ជាមួយ Google Sheets។
        </p>

        {/* School Sign-offs block footer banner */}
        <div className="grid grid-cols-2 gap-8 text-center text-xs mt-12 pt-8 border-t border-stone-200">
          <div className="space-y-1">
            <p className="text-stone-500 font-medium">អ្នករៀបចំរបាយការណ៍ (Reporter's Signature)</p>
            <p className="text-[10px] text-stone-400 font-mono">ថ្ងៃទី ............. ខែ ............. ឆ្នាំ .............</p>
            <div className="h-20"></div>
            <p className="font-bold text-stone-850">........................................................................</p>
          </div>
          <div className="space-y-1">
            <p className="text-stone-500 font-medium">គណៈគ្រប់គ្រងសាលា / នាយកសាលា (School Director's Approval)</p>
            <p className="text-[10px] text-stone-400 font-mono">ថ្ងៃទី ............. ខែ ............. ឆ្នាំ .............</p>
            <div className="h-20"></div>
            <p className="font-bold text-stone-850">........................................................................</p>
          </div>
        </div>
      </div>

    </div>
  );
}
