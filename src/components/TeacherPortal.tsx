/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Teacher, AttendanceLog, Shift } from '../types';
import { khmerNumber, formatKhmerDate } from '../utils';
import { 
  User, 
  Lock, 
  Unlock, 
  Phone, 
  BookOpen, 
  Clock, 
  Calendar, 
  CheckCircle, 
  FileText, 
  LogOut, 
  QrCode, 
  Download, 
  ArrowRight,
  Printer,
  ChevronRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

interface TeacherPortalProps {
  teachers: Teacher[];
  logs: AttendanceLog[];
  onSetManualLog: (
    teacherId: string, 
    status: 'វត្តមាន' | 'ច្បាប់' | 'អវត្តមាន', 
    note: string, 
    date: string, 
    shift: Shift
  ) => void;
  loggedInTeacherId: string | null;
  onLogin: (teacherId: string) => void;
  onLogout: () => void;
}

const getQRUrl = (data: string) => {
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=10&data=${encodeURIComponent(data)}`;
};

export default function TeacherPortal({
  teachers,
  logs,
  onSetManualLog,
  loggedInTeacherId,
  onLogin,
  onLogout,
}: TeacherPortalProps) {
  // Input form state
  const [teacherIdInput, setTeacherIdInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [authError, setAuthError] = useState('');

  // Leave Request Form inputs
  const [leaveDate, setLeaveDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [leaveReason, setLeaveReason] = useState('គ្រុនក្ដៅខ្លាំង');
  const [customReason, setCustomReason] = useState('');
  const [leaveSuccess, setLeaveSuccess] = useState('');
  const [checkInSuccess, setCheckInSuccess] = useState('');

  // Is printing card
  const [copiedId, setCopiedId] = useState(false);

  // Match logged in teacher
  const currentTeacher = teachers.find((t) => t.id === loggedInTeacherId);
  const todayStr = new Date().toISOString().split('T')[0];

  // Authentication validation
  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    const trimmedId = teacherIdInput.trim().toUpperCase();
    const trimmedPhone = phoneInput.trim();

    // Find teacher
    const foundTeacher = teachers.find(
      (t) => t.id.toUpperCase() === trimmedId && t.phone.replace(/[\s-]/g, '') === trimmedPhone.replace(/[\s-]/g, '')
    );

    if (foundTeacher) {
      onLogin(foundTeacher.id);
      setTeacherIdInput('');
      setPhoneInput('');
    } else {
      setAuthError('អត្តសញ្ញាណ ឬលេខទូរស័ព្ទទទួលបានពុំត្រឹមត្រូវទេ! សូមបញ្ជាក់ឡើងវិញ។');
    }
  };

  // Find all attendance records of current logged in teacher
  const myLogs = currentTeacher 
    ? logs.filter((log) => log.teacherId === currentTeacher.id)
    : [];

  // Find if today's attendance has been logged
  const todayLog = currentTeacher
    ? myLogs.find((l) => l.date === todayStr && l.shift === currentTeacher.shift)
    : null;

  // Statistics calculation for the current logged in teacher
  const presencesCount = myLogs.filter((l) => l.status === 'វត្តមាន').length;
  const leavesCount = myLogs.filter((l) => l.status === 'ច្បាប់').length;
  const absencesCount = myLogs.filter((l) => l.status === 'អវត្តមាន').length;

  // Handle direct check-in of Presence
  const handleDirectCheckIn = () => {
    if (!currentTeacher) return;
    onSetManualLog(
      currentTeacher.id,
      'វត្តមាន',
      'ចុះវត្តមានផ្ទាល់ខ្លួនតាមទំព័រគណនីគ្រូ',
      todayStr,
      currentTeacher.shift
    );
    setCheckInSuccess('បានកត់ត្រាវត្តមានផ្ទាល់ខ្លួនថ្ងៃនេះបានជោគជ័យ!');
    setTimeout(() => setCheckInSuccess(''), 4500);
  };

  // Handle Leave Submission
  const handleLeaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTeacher) return;

    const finalReason = leaveReason === 'ផ្សេងៗ' ? customReason : leaveReason;
    onSetManualLog(
      currentTeacher.id,
      'ច្បាប់',
      finalReason,
      leaveDate,
      currentTeacher.shift
    );
    setLeaveSuccess(`បានផ្ញើពាក្យសុំច្បាប់ ${finalReason} សម្រាប់ថ្ងៃទី ${khmerNumber(leaveDate.replace(/-/g, '/'))} ដោយជោគជ័យ!`);
    setCustomReason('');
    setTimeout(() => setLeaveSuccess(''), 4500);
  };

  const handlePrint = () => {
    window.print();
  };

  return !loggedInTeacherId || !currentTeacher ? (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 font-sans">
      {/* Left Info Panel */}
      <div className="md:col-span-12 lg:col-span-7 bg-indigo-600 text-white rounded-[32px] p-8 md:p-12 space-y-8 flex flex-col justify-between shadow-xl shadow-indigo-900/15">
        <div className="space-y-4">
          <div className="h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
            <User className="w-6 h-6 text-white" />
          </div>
          <div className="space-y-2">
            <span className="text-[10px] font-bold tracking-widest uppercase text-indigo-200">
              ប្រព័ន្ធគ្រប់គ្រងសាលា
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight leading-tight">
              ទំព័រគណនីបុគ្គលិកគ្រូបង្រៀន
            </h1>
          </div>
          <p className="text-indigo-100 text-xs md:text-sm leading-relaxed max-w-md">
            សូមស្វាគមន៍មកកាន់ទំព័រឌីជីថលបុគ្គលិកសាលាបឋមសិក្សាកំពង់ល្ពៅ។ លោកគ្រូ-អ្នកគ្រូអាចចូលប្រើគណនីផ្ទាល់ខ្លួន ដើម្បី៖
          </p>
          <div className="space-y-3 pt-2 text-xs md:text-sm text-indigo-50">
            <div className="flex items-start gap-2.5">
              <CheckCircle className="w-5 h-5 text-indigo-200 shrink-0 mt-0.5" />
              <p>ទាញយក កាតសម្គាល់ខ្លួន និង កូដ QR សម្រាប់ស្កេនវត្តមានប្រចាំថ្ងៃ</p>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle className="w-5 h-5 text-indigo-200 shrink-0 mt-0.5" />
              <p>ពិនិត្យមើល របាយការណ៍ស្ថិតិវត្តមាន និង ប្រវត្តិចុះវត្តមានផ្ទាល់ខ្លួន</p>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle className="w-5 h-5 text-indigo-200 shrink-0 mt-0.5" />
              <p>ផ្ញើពាក្យសុំច្បាប់ (Leave Request) ផ្ទាល់ខ្លួនទៅកាន់ គណៈគ្រប់គ្រងសាលា</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Login Widget Form */}
      <div className="md:col-span-12 lg:col-span-5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-[32px] p-6 md:p-8 flex flex-col justify-center space-y-6 shadow-sm">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-slate-800 dark:text-zinc-200">
            ចូលគណនីគ្រូ (Teacher Login)
          </h3>
          <p className="text-xs text-slate-400 dark:text-zinc-500">
            បញ្ចូលព័ត៌មានដែលបានចុះឈ្មោះក្នុងប្រព័ន្ធ
          </p>
        </div>

        <form onSubmit={handleAuthSubmit} className="space-y-4">
          
          {/* ID input */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">
              អត្តសញ្ញាណប័ណ្ណគ្រូ (Teacher ID) *
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="ឧទាហរណ៍៖ KPL-001"
                value={teacherIdInput}
                onChange={(e) => setTeacherIdInput(e.target.value)}
                className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-800 rounded-xl pl-11 pr-4 py-3 text-xs text-slate-800 dark:text-zinc-200 font-mono focus:outline-none focus:border-indigo-500 uppercase font-bold"
                required
              />
            </div>
          </div>

          {/* Password/Phone input */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">
              លេខទូរស័ព្ទសុវត្ថិភាព (Registered Phone Number) *
            </label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="ឧទាហរណ៍៖ 0884640290"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-800 rounded-xl pl-11 pr-4 py-3 text-xs text-slate-800 dark:text-zinc-200 font-mono focus:outline-none focus:border-indigo-500 font-bold"
                required
              />
            </div>
          </div>

          {authError && (
            <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40 rounded-xl text-xs text-red-600 dark:text-red-400 font-bold flex gap-2">
              <AlertCircle className="w-4.5 h-4.5 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-2"
          >
            <Unlock className="w-4 h-4" /> ផ្ទៀងផ្ទាត់ និងចូលប្រព័ន្ធ <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        <div className="pt-2 border-t border-slate-100 dark:border-zinc-800/60 text-center text-[10px] text-slate-400 leading-relaxed dark:text-zinc-500 font-sans">
          ក្នុងករណីលោកគ្រូអ្នកគ្រូបាត់បង់ ឬមិនចាំលេខសម្គាល់គណនី សូមទាក់ទងមកគណៈគ្រប់គ្រងសាលាគណនីដើម្បីពិនិត្យទិន្នន័យ។
        </div>
      </div>
    </div>
  ) : (
    /* ==================== TEACHER DASHBOARD PORTAL ==================== */
    <div className="space-y-6">
          
          {/* Header Bar greeting and actions */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-[32px] p-6 shadow-sm">
            <div className="flex items-center gap-3.5">
              <div className="h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 flex items-center justify-center font-bold text-lg text-indigo-600 dark:text-indigo-400 font-mono shrink-0">
                {currentTeacher.name.charAt(0)}
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  គ្រូបង្រៀនបានចូលក្នុងគណនី
                </span>
                <h2 className="font-bold text-base text-slate-800 dark:text-zinc-200 leading-none">
                  លោកគ្រូ/អ្នកគ្រូ៖ <strong className="text-slate-900 dark:text-indigo-400 font-black">{currentTeacher.name}</strong> 
                </h2>
              </div>
            </div>

            <button
              onClick={onLogout}
              className="px-4 py-2 border border-red-200 dark:border-red-950/40 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-4 h-4" /> ចាកចេញ (Logout Account)
            </button>
          </div>

          {/* Core Body Columns: Profile Card, Stats, and Requests */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* COLUMN 1: Teacher Card Badge (QR) */}
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-[32px] p-6 shadow-sm flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <h3 className="font-bold text-slate-800 dark:text-zinc-200 text-xs tracking-wider uppercase border-b border-slate-100 dark:border-zinc-800 pb-3 flex items-center gap-2">
                  <QrCode className="w-4.5 h-4.5 text-indigo-600" /> កាតសម្គាល់ខ្លួន និងស្កេន QR
                </h3>

                {/* Vertical Digital Badge */}
                <div className="border border-slate-150 dark:border-zinc-800 rounded-2xl p-5 bg-gradient-to-b from-slate-50 to-white dark:from-zinc-900 dark:to-zinc-850/20 text-center flex flex-col items-center space-y-4 shadow-inner relative overflow-hidden" id="teacher-portal-printed-badge">
                  {/* Badge Stripe decoration */}
                  <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-indigo-500 to-emerald-500"></div>

                  <div className="text-center pt-1.5">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-sans">
                      សាលាបឋមសិក្សាកំពង់ល្ពៅ
                    </span>
                    <h4 className="font-bold text-base text-slate-850 dark:text-zinc-200 mt-1">
                      {currentTeacher.name}
                    </h4>
                    <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 px-2 py-0.5 rounded-full font-bold mt-1 inline-block font-sans">
                      {currentTeacher.id}
                    </span>
                  </div>

                  {/* Built-in API generated QR */}
                  <div className="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-xs transition hover:scale-[1.02]">
                    <img
                      src={getQRUrl(currentTeacher.id)}
                      alt="Personal Badge QR Code"
                      className="w-36 h-36"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  <div className="space-y-1 text-xs text-slate-500 dark:text-zinc-400 leading-normal">
                    <p className="flex items-center justify-center gap-1">
                      <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                      បង្រៀន៖ <strong className="text-slate-800 dark:text-zinc-200">{currentTeacher.grade}({currentTeacher.section})</strong>
                    </p>
                    <p className="flex items-center justify-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      វេនសិក្សា៖ <strong className="text-slate-800 dark:text-zinc-200">{currentTeacher.shift}</strong>
                    </p>
                    <p className="flex items-center justify-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      លេខទូរស័ព្ទ៖ <strong className="text-slate-800 dark:text-zinc-200">{currentTeacher.phone}</strong>
                    </p>
                  </div>
                </div>
              </div>

              {/* Action utilities for card print and download */}
              <div className="flex gap-2.5">
                <a
                  href={getQRUrl(currentTeacher.id)}
                  download={`Badge_${currentTeacher.id}.png`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition select-none shadow-md shadow-indigo-900/10"
                >
                  <Download className="w-3.5 h-3.5" /> ទាញយក រូបភាពកាត
                </a>
                <button
                  onClick={handlePrint}
                  className="p-2.5 border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-xl font-bold text-xs flex items-center justify-center transition cursor-pointer"
                  title="បោះពុម្ពកាតភ្លាមៗ"
                >
                  <Printer className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* COLUMN 2: KPI Stats Counter & General bio details */}
            <div className="lg:col-span-2 space-y-6">

              {/* Daily Attendance Direct Check-In Widget */}
              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-[32px] p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3.5 gap-2">
                  <div className="space-y-0.5">
                    <h3 className="font-bold text-slate-800 dark:text-zinc-200 text-xs tracking-wider uppercase flex items-center gap-2">
                      <Clock className="w-4.5 h-4.5 text-indigo-600 animate-pulse" /> ការចុះវត្តមានប្រចាំថ្ងៃ (Daily Attendance Check-In)
                    </h3>
                    <p className="text-[10px] text-slate-400 dark:text-zinc-500">
                      លោកគ្រូអ្នកគ្រូអាចធ្វើការចុះវត្តមានបង្រៀនប្រចាំថ្ងៃដោយផ្ទាល់តាមរយៈប៊ូតុងខាងក្រោម
                    </p>
                  </div>
                  <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-400 bg-slate-50 dark:bg-zinc-850 px-3 py-1 rounded-full border border-slate-150 dark:border-zinc-800 align-middle self-start sm:self-center font-mono">
                    {khmerNumber(todayStr.replace(/-/g, '/'))}
                  </span>
                </div>

                {todayLog ? (
                  /* Checked-In state */
                  <div className="p-4.5 rounded-2xl bg-emerald-500/5 dark:bg-emerald-500/5 border border-emerald-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5 text-center sm:text-left self-start sm:self-center">
                      <div className={`h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 border ${
                        todayLog.status === 'វត្តមាន' 
                          ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400' 
                          : todayLog.status === 'ច្បាប់' 
                            ? 'bg-amber-500/10 border-amber-500/25 text-amber-600 dark:text-amber-500' 
                            : 'bg-red-500/10 border-red-500/25 text-red-600 dark:text-red-400'
                      }`}>
                        <CheckCircle className="w-5 h-5" />
                      </div>
                      <div className="space-y-0.5 text-left">
                        <p className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                          របាយការណ៍វត្តមានថ្ងៃនេះត្រូវបានកត់ត្រារួចរាល់!
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-relaxed font-sans">
                          ស្ថានភាព៖ <strong className="text-slate-900 dark:text-indigo-400 font-bold">{todayLog.status}</strong> 
                          {todayLog.time && <> • ម៉ោងចុះ៖ <strong className="text-slate-850 dark:text-zinc-200 font-mono">{khmerNumber(todayLog.time)}</strong></>} 
                          • វេន៖ <strong className="text-slate-800 dark:text-zinc-200">{todayLog.shift}</strong>
                        </p>
                      </div>
                    </div>

                    <span className={`px-4 py-2 rounded-xl font-black text-[11px] uppercase tracking-wider inline-block shadow-sm shrink-0 ${
                      todayLog.status === 'វត្តមាន' 
                        ? 'bg-emerald-600 text-white' 
                        : todayLog.status === 'ច្បាប់' 
                          ? 'bg-amber-500 text-white' 
                          : 'bg-red-500 text-white'
                    }`}>
                      {todayLog.status === 'វត្តមាន' ? '✓ បានចុះវត្តមាន' : todayLog.status === 'ច្បាប់' ? '⚠ សុំច្បាប់អនុញ្ញាត' : '✗ អវត្តមាន'}
                    </span>
                  </div>
                ) : (
                  /* Unrecorded / Sign-In action state */
                  <div className="p-5 rounded-2xl bg-indigo-50/20 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/30 flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
                    <div className="space-y-1.5 text-left">
                      <span className="text-[9px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-0.5 rounded-full inline-block font-sans">
                        សកម្មភាពប្រចាំថ្ងៃ
                      </span>
                      <h4 className="font-extrabold text-slate-800 dark:text-zinc-200 text-xs sm:text-sm">
                        សូមចុចប៊ូតុងដើម្បីចុះវត្តមាន សម្រាប់វេនបង្រៀន<span className="text-indigo-600 dark:text-indigo-400 font-black"> {currentTeacher.shift} </span>ថ្ងៃនេះ!
                      </h4>
                      <p className="text-[10px] text-slate-450 dark:text-zinc-450 max-w-md leading-relaxed font-sans">
                        ការចុះវត្តមានផ្ទាល់ខ្លួននេះនឹងកត់ត្រាចូលទៅក្នុងប្រព័ន្ធ និងធ្វើការសមកាលកម្មស្វ័យប្រវត្តិកែប្រែភ្លាមៗទៅកាន់ Google Sheets។
                      </p>
                    </div>

                    <button
                      onClick={handleDirectCheckIn}
                      className="px-5 py-3.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] transition-all text-white rounded-xl font-bold text-xs shrink-0 cursor-pointer flex items-center gap-1.5 shadow-md shadow-indigo-600/10"
                    >
                      <CheckCircle className="w-4 h-4" /> ចុះវត្តមានថ្ងៃនេះ
                    </button>
                  </div>
                )}

                {checkInSuccess && (
                  <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-150 dark:border-emerald-900/40 rounded-xl text-xs text-emerald-600 dark:text-emerald-400 font-bold flex gap-2">
                    <CheckCircle className="w-4.5 h-4.5" />
                    <span>{checkInSuccess}</span>
                  </div>
                )}
              </div>
              
              {/* Profile statistics cards */}
              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-[32px] p-6 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-800 dark:text-zinc-200 text-xs tracking-wider uppercase border-b border-slate-100 dark:border-zinc-800 pb-3 flex items-center gap-2">
                  <ShieldCheck className="w-4.5 h-4.5 text-indigo-500" /> ស្ថិតិវត្តមានប្រចាំខែ (My Attendance Summary)
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Presence */}
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4.5">
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase block tracking-wider">វត្តមាន (Presence)</span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-3xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">{khmerNumber(presencesCount)}</span>
                      <span className="text-[10px] font-bold text-emerald-500">ដង</span>
                    </div>
                    <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1">បានចុះសមកាលកម្មរួចរាល់</p>
                  </div>

                  {/* Leaves Requested */}
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4.5">
                    <span className="text-[10px] text-amber-600 dark:text-amber-500 font-bold uppercase block tracking-wider">ច្បាប់ (Leave/Excuse)</span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-3xl font-extrabold font-mono text-amber-600 dark:text-amber-500">{khmerNumber(leavesCount)}</span>
                      <span className="text-[10px] font-bold text-amber-500">ដង</span>
                    </div>
                    <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1">ពាក្យស្នើសុំច្បាប់ផ្លូវការ</p>
                  </div>

                  {/* Absences */}
                  <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4.5">
                    <span className="text-[10px] text-red-600 dark:text-red-400 font-bold uppercase block tracking-wider">អវត្តមាន (Absences)</span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-3xl font-extrabold font-mono text-red-600 dark:text-red-400">{khmerNumber(absencesCount)}</span>
                      <span className="text-[10px] font-bold text-red-500">ដង</span>
                    </div>
                    <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1">អវត្តមានគ្មានការអនុញ្ញាត</p>
                  </div>
                </div>
              </div>

              {/* Leave request form */}
              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-[32px] p-6 shadow-sm space-y-4">
                <div>
                  <h3 className="font-bold text-slate-850 dark:text-zinc-200 text-sm flex items-center gap-2 leading-none">
                    <FileText className="w-5 h-5 text-indigo-500" /> ផ្ញើពាក្យសុំច្បាប់តាមប្រព័ន្ធ (Leave Request Form)
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">
                    លោកគ្រូអ្នកគ្រូអាចសុំច្បាប់ទុកជាមុនដើម្បីរក្សាសង្គតិភាពការងារ និងផ្ដល់ដំណឹងដល់ Admin
                  </p>
                </div>

                <form onSubmit={handleLeaveSubmit} className="space-y-4">
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Date */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">
                        កាលបរិច្ឆេទសុំច្បាប់ *
                      </label>
                      <input
                        type="date"
                        value={leaveDate}
                        onChange={(e) => setLeaveDate(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-zinc-200 font-mono focus:outline-none focus:border-indigo-500"
                        required
                      />
                    </div>

                    {/* Standard common reasons preset */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">
                        មូលហេតុនៃការសុំច្បាប់ *
                      </label>
                      <select
                        value={leaveReason}
                        onChange={(e) => setLeaveReason(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-zinc-200 font-sans focus:outline-none"
                      >
                        <option value="គ្រុនក្ដៅខ្លាំង">គ្រុនក្ដៅខ្លាំង (ក្ដៅខ្លួន / ផ្តាសាយ)</option>
                        <option value="ធុរៈផ្ទាល់ខ្លួនប្រញាប់">ធុរៈផ្ទាល់ខ្លួនប្រញាប់</option>
                        <option value="ឈឺធ្មេញ ឬ ឈឺពោះ">ឈឺធ្មេញ ឬ ឈឺពោះ</option>
                        <option value="គ្រោះថ្នាក់ចៃដន្យ">គ្រោះថ្នាក់ចៃដន្យ</option>
                        <option value="ផ្សេងៗ">ផ្សេងៗ... (សូមសរសេរលម្អិត)</option>
                      </select>
                    </div>
                  </div>

                  {leaveReason === 'ផ្សេងៗ' && (
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">
                        សូមបញ្ជាក់មូលហេតុផ្សេងៗ *
                      </label>
                      <input
                        type="text"
                        placeholder="សរសេរមូលហេតុសុំច្បាប់របស់អ្នកទីនេះ..."
                        value={customReason}
                        onChange={(e) => setCustomReason(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-zinc-200 focus:outline-none focus:border-indigo-500"
                        required
                      />
                    </div>
                  )}

                  {leaveSuccess && (
                     <div className="p-4 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900 rounded-2xl text-xs text-indigo-600 dark:text-indigo-400 font-bold flex gap-2">
                       <CheckCircle className="w-5 h-5 shrink-0" />
                       <span>{leaveSuccess}</span>
                     </div>
                  )}

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition flex items-center gap-1.5"
                    >
                      <FileText className="w-4 h-4" /> ផ្ញើពាក្យសុំច្បាប់ឥឡូវនេះ
                    </button>
                  </div>

                </form>
              </div>

            </div>

          </div>

          {/* Teacher Attendance Log Calendar history list */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-[32px] p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-850 dark:text-zinc-205 text-sm flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600" /> ប្រវត្តិចុះវត្តមានរបស់ខ្ញុំ (My Personal Attendance Log History)
            </h3>

            {myLogs.length > 0 ? (
              <div className="overflow-x-auto rounded-2xl border border-slate-150 dark:border-zinc-800 font-sans">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-zinc-850 text-slate-450 dark:text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="px-5 py-3">កាលបរិច្ឆេទ</th>
                      <th className="px-5 py-3">ម៉ោងស្កេន</th>
                      <th className="px-5 py-3">ស្ថានភាព</th>
                      <th className="px-5 py-3">របៀបចុះ</th>
                      <th className="px-5 py-3">ថ្នាក់/វេន</th>
                      <th className="px-5 py-3">កំណត់សម្គាល់</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60 text-slate-700 dark:text-zinc-300">
                    {myLogs.map((log) => (
                      <tr 
                        key={log.id} 
                        className="hover:bg-slate-50/50 dark:hover:bg-zinc-850/30 transition-colors"
                      >
                        <td className="px-5 py-3 font-semibold text-slate-800 dark:text-zinc-200">
                          {formatKhmerDate(log.date)}
                        </td>
                        <td className="px-5 py-3 font-mono">
                          {log.time ? khmerNumber(log.time) : '-'}
                        </td>
                        <td className="px-5 py-3">
                          <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] inline-block ${
                            log.status === 'វត្តមាន' 
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' 
                              : log.status === 'ច្បាប់' 
                                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' 
                                : 'bg-red-500/15 text-red-600 dark:text-red-400'
                          }`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          {log.method}
                        </td>
                        <td className="px-5 py-3 text-slate-500 dark:text-zinc-500">
                          {log.grade}({log.section}) • វេន{log.shift}
                        </td>
                        <td className="px-5 py-3 max-w-[200px] truncate text-slate-450 italic" title={log.note}>
                          {log.note || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-10 border border-dashed border-slate-150 dark:border-zinc-800 rounded-2xl">
                <p className="text-xs text-slate-400 dark:text-zinc-500">មិនទាន់មានប្រវត្តិកត់ត្រាវត្តមានណាមួយឡើយ</p>
              </div>
            )}
          </div>

        </div>
  );
}
