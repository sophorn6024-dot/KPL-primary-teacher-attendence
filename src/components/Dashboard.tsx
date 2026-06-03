/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Teacher, AttendanceLog } from '../types';
import { khmerNumber, formatKhmerDate } from '../utils';
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Calendar, 
  Clock, 
  TrendingUp, 
  ArrowRight,
  BookOpen,
  QrCode,
  Activity,
  Check
} from 'lucide-react';

interface DashboardProps {
  teachers: Teacher[];
  logs: AttendanceLog[];
  onNavigate: (tab: string) => void;
}

export default function Dashboard({ teachers, logs, onNavigate }: DashboardProps) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayLogs = logs.filter((log) => log.date === todayStr);

  // Compute daily stats
  const totalCount = teachers.length;
  const presentCount = todayLogs.filter((l) => l.status === 'វត្តមាន').length;
  const permissionCount = todayLogs.filter((l) => l.status === 'ច្បាប់').length;
  const absentCount = todayLogs.filter((l) => l.status === 'អវត្តមាន').length;
  const unrecordedCount = Math.max(0, totalCount - (presentCount + permissionCount + absentCount));

  // Attendance rate
  const attendanceRate = totalCount > 0 ? Math.round(((presentCount + permissionCount) / totalCount) * 100) : 0;

  // Format Time in Khmer
  const hours = String(time.getHours()).padStart(2, '0');
  const minutes = String(time.getMinutes()).padStart(2, '0');
  const seconds = String(time.getSeconds()).padStart(2, '0');
  const khmerTimeStr = `${khmerNumber(hours)}:${khmerNumber(minutes)}:${khmerNumber(seconds)}`;

  // Find recent check-ins
  const recentCheckins = [...todayLogs]
    .filter((l) => l.status === 'វត្តមាន' && l.time)
    .sort((a, b) => b.time.localeCompare(a.time))
    .slice(0, 5);

  // Stats by Shift
  const morningTeachers = teachers.filter((t) => t.shift === 'ពេលព្រឹក');
  const afternoonTeachers = teachers.filter((t) => t.shift === 'ពេលរសៀល');

  const morningPresent = todayLogs.filter((l) => l.shift === 'ពេលព្រឹក' && l.status === 'វត្តមាន').length;
  const morningPerm = todayLogs.filter((l) => l.shift === 'ពេលព្រឹក' && l.status === 'ច្បាប់').length;
  const morningAbsent = todayLogs.filter((l) => l.shift === 'ពេលព្រឹក' && l.status === 'អវត្តមាន').length;

  const afternoonPresent = todayLogs.filter((l) => l.shift === 'ពេលរសៀល' && l.status === 'វត្តមាន').length;
  const afternoonPerm = todayLogs.filter((l) => l.shift === 'ពេលរសៀល' && l.status === 'ច្បាប់').length;
  const afternoonAbsent = todayLogs.filter((l) => l.shift === 'ពេលរសៀល' && l.status === 'អវត្តមាន').length;

  return (
    <div className="space-y-6">
      {/* Top Banner - Hero section & Khmer clock */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Welcome and Summary Banner */}
        <div className="lg:col-span-2 bg-gradient-to-br from-indigo-600 to-indigo-800 dark:from-indigo-900 dark:to-indigo-950 rounded-[32px] p-6 md:p-8 text-white shadow-xl shadow-indigo-100/50 dark:shadow-none flex flex-col justify-between relative overflow-hidden group">
          {/* Decorative circular shapes */}
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-700"></div>
          <div className="absolute right-1/4 -top-12 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
          
          <div className="relative z-10 space-y-4">
            <span className="bg-white/15 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase border border-white/10">
              សាលាបឋមសិក្សាកំពង់ល្ពៅ
            </span>
            <h1 className="text-2xl md:text-3.5xl font-bold font-sans tracking-tight pt-2 leading-relaxed">
              ប្រព័ន្ធគ្រប់គ្រងវត្តមានគ្រូ
            </h1>
            <p className="text-indigo-100 text-sm md:text-base font-light max-w-lg leading-relaxed">
              ស្វាគមន៍មកកាន់ប្រព័ន្ធគ្រប់គ្រង និងស្រង់វត្តមានលោកគ្រូ-អ្នកគ្រូប្រចាំថ្ងៃ សម្រាប់ថ្នាក់បឋមសិក្សា (វេនព្រឹក និងវេនរសៀល)។ ទិន្នន័យត្រូវបានរក្សាទុកដោយស្វ័យប្រវត្តិ។
            </p>
          </div>
          
          <div className="relative z-10 flex flex-wrap gap-4 pt-6 mt-4 border-t border-white/15">
            <button
              onClick={() => onNavigate('scan')}
              id="dashboard_btn_scan"
              className="px-5 py-2.5 bg-white text-indigo-805 hover:bg-neutral-100 rounded-2xl font-bold text-sm shadow-md flex items-center gap-2 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <CheckCircle className="w-4 h-4 text-indigo-600" />
              ស្កេនវត្តមាន (QR)
            </button>
            <button
              onClick={() => onNavigate('teachers')}
              id="dashboard_btn_teachers"
              className="px-5 py-2.5 bg-indigo-500/30 hover:bg-indigo-500/40 text-white rounded-2xl font-semibold text-sm border border-white/20 flex items-center gap-2 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <Users className="w-4 h-4" />
              គ្រប់គ្រងគ្រូ
            </button>
          </div>
        </div>

        {/* Dynamic Live Clock */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-[32px] p-6 md:p-8 flex flex-col justify-between shadow-sm hover:border-indigo-500/30 transition-all">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-4">
            <span className="font-bold text-slate-500 dark:text-zinc-400 text-xs tracking-wider uppercase flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-500" />ម៉ោងបច្ចុប្បន្នភាព
            </span>
            <span className="h-2 w-2 rounded-full bg-indigo-600 animate-pulse"></span>
          </div>

          <div className="py-6 flex flex-col items-center">
            {/* Khmer Big Digital Clock */}
            <span className="text-3.5xl sm:text-4xl lg:text-3.5xl xl:text-4.5xl font-bold tracking-tight text-indigo-600 dark:text-indigo-400 drop-shadow-xs transition-colors tabular-nums">
              {khmerTimeStr}
            </span>
            <span className="text-xs font-semibold text-slate-400 dark:text-zinc-500 mt-2 font-mono uppercase tracking-widest">
              Phnom Penh, Cambodia
            </span>
          </div>

          <div className="bg-slate-50 dark:bg-zinc-800/50 p-4 rounded-2xl flex items-center gap-3">
            <Calendar className="w-5 h-5 text-indigo-500 shrink-0" />
            <div className="flex flex-col">
              <span className="text-xs text-slate-400 dark:text-zinc-500 font-medium">កាលបរិច្ឆេទថ្ងៃនេះ</span>
              <span className="text-sm font-bold text-slate-800 dark:text-zinc-200 leading-relaxed">
                {formatKhmerDate(time)}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Numerical Stats Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Teachers Card */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-zinc-700 transition-all">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-400 dark:text-zinc-500">គ្រូសរុប (នាក់)</span>
              <p className="text-3xl font-mono font-bold text-slate-800 dark:text-zinc-100">
                {khmerNumber(totalCount)}
              </p>
            </div>
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-400 dark:text-zinc-500">
            ព្រឹក: <strong className="text-slate-600 dark:text-zinc-300">{khmerNumber(morningTeachers.length)}</strong> | 
            រសៀល: <strong className="text-slate-600 dark:text-zinc-300">{khmerNumber(afternoonTeachers.length)}</strong>
          </div>
        </div>

        {/* Present Today Card */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-zinc-700 transition-all">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-400 dark:text-zinc-500">វត្តមានថ្ងៃនេះ</span>
              <p className="text-3xl font-mono font-bold text-indigo-600 dark:text-indigo-400 font-sans">
                {khmerNumber(presentCount)}
              </p>
            </div>
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-zinc-500">អត្រាវត្តមាន៖</span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.5 rounded">
              {khmerNumber(attendanceRate)}%
            </span>
          </div>
        </div>

        {/* Permission (ច្បាប់) Card */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-zinc-700 transition-all">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-400 dark:text-zinc-500">សុំច្បាប់</span>
              <p className="text-3xl font-mono font-bold text-amber-600 dark:text-amber-400 font-sans">
                {khmerNumber(permissionCount)}
              </p>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-400 dark:text-zinc-500">
            ត្រូវបានកត់ត្រាដោយប្រព័ន្ធ និងមានច្បាប់ត្រឹមត្រូវ
          </div>
        </div>

        {/* Absent Card */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-zinc-700 transition-all">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-400 dark:text-zinc-500">អវត្តមាន</span>
              <p className="text-3xl font-mono font-bold text-rose-500 dark:text-rose-400 font-sans">
                {khmerNumber(absentCount)}
              </p>
            </div>
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-500 dark:text-rose-400 rounded-xl">
              <XCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-400 dark:text-zinc-500 flex justify-between">
            <span>មិនទាន់ស្រង់: <strong>{khmerNumber(unrecordedCount)}</strong></span>
            {unrecordedCount > 0 && <span className="text-rose-600 animate-pulse font-medium">ស្រង់វត្តមានឥឡូវ!</span>}
          </div>
        </div>

      </div>

      {/* Main Stats Charts & Recent Feed Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Visualized Attendance Graph / Progress indicators */}
        <div className="xl:col-span-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-[32px] p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-4 mb-4">
            <div className="space-y-1">
              <h2 className="font-bold text-slate-800 dark:text-neutral-200 text-base">ស្ថានភាពវត្តមានតាមវេនសិក្សា</h2>
              <p className="text-xs text-slate-400 dark:text-zinc-500 font-sans">ស្ថិតិសង្ខេបប្រចាំយប់ថ្ងៃនេះ (ព្រឹក-រសៀល)</p>
            </div>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 px-3 py-1 rounded-full flex items-center gap-1 font-sans">
              <TrendingUp className="w-3 h-3" /> Live
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            {/* Morning Shift Circle Progress */}
            <div className="p-5 bg-slate-50 dark:bg-zinc-800/40 rounded-2xl flex flex-col items-center text-center space-y-4">
              <div className="w-full flex justify-between items-center px-1">
                <span className="font-bold text-xs text-slate-500 dark:text-zinc-400 uppercase tracking-wider">វេនពេលព្រឹក</span>
                <span className="text-xs font-semibold text-slate-400 dark:text-zinc-500">គ្រូសរុប: {khmerNumber(morningTeachers.length)} នាក់</span>
              </div>
              
              {/* SVG Ring charts */}
              <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {/* Background Track */}
                  <circle cx="50" cy="50" r="40" className="stroke-slate-200/80 dark:stroke-zinc-700 fill-none" strokeWidth="8" />
                  {/* Attendance Ring */}
                  <circle 
                    cx="50" 
                    cy="50" 
                    r="40" 
                    className="stroke-indigo-600 fill-none transition-all duration-1000" 
                    strokeWidth="8" 
                    strokeDasharray={`${2 * Math.PI * 40}`}
                    strokeDashoffset={`${2 * Math.PI * 40 * (1 - (morningTeachers.length > 0 ? (morningPresent + morningPerm) / morningTeachers.length : 0))}`}
                    strokeLinecap="round"
                  />
                  {/* Absent Ring */}
                  <circle 
                    cx="50" 
                    cy="50" 
                    r="40" 
                    className="stroke-rose-500 fill-none" 
                    strokeWidth="8" 
                    strokeDasharray={`${2 * Math.PI * 40}`}
                    strokeDashoffset={`${2 * Math.PI * 40 * (1 - (morningTeachers.length > 0 ? morningAbsent / morningTeachers.length : 0))}`}
                    style={{ transform: `rotate(${(morningPresent + morningPerm) * 360 / (morningTeachers.length || 1)}deg)`, transformOrigin: '50px 50px' }}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute text-center">
                  <span className="text-2xl font-bold font-mono text-slate-800 dark:text-zinc-100">
                    {khmerNumber(morningTeachers.length > 0 ? Math.round(((morningPresent + morningPerm) / morningTeachers.length) * 100) : 0)}%
                  </span>
                  <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium font-sans">ក្បាលវត្តមាន</p>
                </div>
              </div>

              {/* Legend stats */}
              <div className="w-full grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/50 dark:border-zinc-800">
                <div className="text-center">
                  <p className="text-[10px] font-semibold text-slate-400 dark:text-neutral-500">វត្តមាន</p>
                  <p className="text-sm font-mono font-bold text-indigo-600 dark:text-indigo-400">{khmerNumber(morningPresent)}</p>
                </div>
                <div className="text-center border-x border-slate-200/50 dark:border-zinc-800">
                  <p className="text-[10px] font-semibold text-slate-400 dark:text-neutral-500">ច្បាប់</p>
                  <p className="text-sm font-mono font-bold text-amber-500">{khmerNumber(morningPerm)}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-semibold text-slate-400 dark:text-neutral-500">អវត្តមាន</p>
                  <p className="text-sm font-mono font-bold text-rose-500">{khmerNumber(morningAbsent)}</p>
                </div>
              </div>
            </div>

            {/* Afternoon Shift Circle Progress */}
            <div className="p-5 bg-slate-50 dark:bg-zinc-800/40 rounded-2xl flex flex-col items-center text-center space-y-4">
              <div className="w-full flex justify-between items-center px-1">
                <span className="font-bold text-xs text-slate-500 dark:text-zinc-400 uppercase tracking-wider">វេនពេលរសៀល</span>
                <span className="text-xs font-semibold text-slate-400 dark:text-zinc-500">គ្រូសរុប: {khmerNumber(afternoonTeachers.length)} នាក់</span>
              </div>
              
              <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {/* Background Track */}
                  <circle cx="50" cy="50" r="40" className="stroke-slate-200/80 dark:stroke-zinc-700 fill-none" strokeWidth="8" />
                  {/* Attendance Ring */}
                  <circle 
                    cx="50" 
                    cy="50" 
                    r="40" 
                    className="stroke-sky-500 fill-none transition-all duration-1000" 
                    strokeWidth="8" 
                    strokeDasharray={`${2 * Math.PI * 40}`}
                    strokeDashoffset={`${2 * Math.PI * 40 * (1 - (afternoonTeachers.length > 0 ? (afternoonPresent + afternoonPerm) / afternoonTeachers.length : 0))}`}
                    strokeLinecap="round"
                  />
                  {/* Absent Ring */}
                  <circle 
                    cx="50" 
                    cy="50" 
                    r="40" 
                    className="stroke-rose-500 fill-none" 
                    strokeWidth="8" 
                    strokeDasharray={`${2 * Math.PI * 40}`}
                    strokeDashoffset={`${2 * Math.PI * 40 * (1 - (afternoonTeachers.length > 0 ? afternoonAbsent / afternoonTeachers.length : 0))}`}
                    style={{ transform: `rotate(${(afternoonPresent + afternoonPerm) * 360 / (afternoonTeachers.length || 1)}deg)`, transformOrigin: '50px 50px' }}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute text-center">
                  <span className="text-2xl font-bold font-mono text-slate-800 dark:text-zinc-100">
                    {khmerNumber(afternoonTeachers.length > 0 ? Math.round(((afternoonPresent + afternoonPerm) / afternoonTeachers.length) * 100) : 0)}%
                  </span>
                  <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium font-sans">ក្បាលវត្តមាន</p>
                </div>
              </div>

              {/* Legend stats */}
              <div className="w-full grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/50 dark:border-zinc-800">
                <div className="text-center">
                  <p className="text-[10px] font-semibold text-slate-400 dark:text-neutral-500">វត្តមាន</p>
                  <p className="text-sm font-mono font-bold text-sky-600 dark:text-sky-400">{khmerNumber(afternoonPresent)}</p>
                </div>
                <div className="text-center border-x border-slate-200/50 dark:border-zinc-800">
                  <p className="text-[10px] font-semibold text-slate-400 dark:text-neutral-500">ច្បាប់</p>
                  <p className="text-sm font-mono font-bold text-amber-500">{khmerNumber(afternoonPerm)}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-semibold text-slate-400 dark:text-neutral-500">អវត្តមាន</p>
                  <p className="text-sm font-mono font-bold text-rose-500">{khmerNumber(afternoonAbsent)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Live checked in timeline */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-[32px] p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-4 mb-4">
              <h2 className="font-bold text-slate-800 dark:text-neutral-200 text-base flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-500" /> សកម្មភាពថ្មីៗ (Recent Activity)
              </h2>
              <span className="text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full font-sans">Today</span>
            </div>

            <div className="space-y-3.5 max-h-[360px] overflow-y-auto pr-1">
              {recentCheckins.length === 0 ? (
                <div className="text-center py-12 space-y-3 text-slate-400 dark:text-zinc-500">
                  <AlertCircle className="w-8 h-8 mx-auto stroke-1 text-slate-300" />
                  <p className="text-xs font-semibold">មិនទាន់មានការស្កេនវត្តមាននៅឡើយទេ</p>
                </div>
              ) : (
                recentCheckins.map((log) => (
                  <div 
                    key={log.id} 
                    className="relative overflow-hidden bg-slate-50 dark:bg-zinc-800/40 hover:bg-slate-100/50 dark:hover:bg-zinc-800 border border-slate-100 dark:border-zinc-800 rounded-2xl p-3.5 transition-all shadow-xs hover:shadow-md hover:scale-[1.01] duration-200 group"
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar / Initials Badge */}
                      <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center justify-center shrink-0 border border-indigo-100/40 dark:border-zinc-700/50">
                        {log.teacherName.charAt(0)}
                      </div>
                      
                      {/* Detail Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs md:text-sm font-bold text-slate-800 dark:text-zinc-150 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {log.teacherName}
                          </p>
                          <span className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500 font-mono shrink-0">
                            {log.teacherId}
                          </span>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 mt-1 text-[10px] text-slate-400 dark:text-zinc-500 font-medium">
                          <span className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-300 px-1.5 py-0.5 rounded text-[9px] font-sans">
                            {log.grade}({log.section})
                          </span>
                          <span>•</span>
                          <span>{log.shift}</span>
                        </div>

                        {/* Timing and Scan Method */}
                        <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-200/50 dark:border-zinc-800/60">
                          <span className="flex items-center gap-1 text-[10px] text-indigo-600 dark:text-indigo-400 font-bold font-sans">
                            <Clock className="w-3.5 h-3.5" />
                            ម៉ោង {khmerNumber(log.time.split(':')[0])}:{khmerNumber(log.time.split(':')[1])}
                          </span>
                          
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1 ${
                            log.method === 'QR' 
                              ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400' 
                              : 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400'
                          }`}>
                            {log.method === 'QR' ? (
                              <>
                                <QrCode className="w-2.5 h-2.5" />
                                QR Code
                              </>
                            ) : (
                              <>
                                <Check className="w-2.5 h-2.5" />
                                ប្រព័ន្ធ
                              </>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-zinc-800 mt-4 font-sans">
            <button
               onClick={() => onNavigate('scan')}
               id="dashboard_view_all_scans"
               className="w-full text-center text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-amber-300 flex items-center justify-center gap-1 group py-1.5 cursor-pointer"
            >
              ទៅកាន់ផ្ទាំងស្កេនវត្តមាន
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>

      </div>

      {/* Primary Classes Grid Dashboard Indicator */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-[32px] p-6 shadow-sm">
        <h2 className="font-bold text-slate-800 dark:text-neutral-200 text-base flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800 pb-4 mb-4">
          <BookOpen className="w-5 h-5 text-indigo-600" /> បញ្ជីថ្នាក់បឋមសិក្សាកំពង់ល្ពៅ និងស្ថានភាពវត្តមានគ្រូ
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {['ថ្នាក់ទី១', 'ថ្នាក់ទី២', 'ថ្នាក់ទី៣', 'ថ្នាក់ទី៤', 'ថ្នាក់ទី៥', 'ថ្នាក់ទី៦'].map((gd) => {
            // Find teachers in this grade
            const classTeachers = teachers.filter((t) => t.grade === gd);
            const classLogs = todayLogs.filter((l) => l.grade === gd);
            
            const totalInClass = classTeachers.length;
            const completedInClass = classLogs.filter((l) => ['វត្តមាន', 'ច្បាប់', 'អវត្តមាន'].includes(l.status)).length;
            const isCompleted = totalInClass > 0 && completedInClass === totalInClass;

            return (
              <div 
                key={gd} 
                onClick={() => onNavigate('logs')}
                className="p-4 bg-slate-50 dark:bg-zinc-800/40 rounded-2xl border border-slate-100 dark:border-zinc-800 hover:border-indigo-400/30 hover:border-indigo-200 dark:hover:border-zinc-700 transition-all cursor-pointer group"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-slate-800 dark:text-neutral-200 text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {gd} (ក+ខ)
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    totalInClass === 0 
                      ? 'bg-slate-200 dark:bg-zinc-700 text-slate-500 dark:text-zinc-400'
                      : isCompleted 
                        ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400' 
                        : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
                  }`}>
                    {totalInClass === 0 ? 'គ្មានគ្រូ' : isCompleted ? 'ស្រង់រួចរាល់ font-sans' : 'នៅខ្វះ'}
                  </span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-slate-400 dark:text-zinc-500 font-sans">
                    <span>គ្រូបង្រៀន {khmerNumber(totalInClass)} នាក់</span>
                    <span>ស្រង់រាយការណ៍ {khmerNumber(completedInClass)}/{khmerNumber(totalInClass)}</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-zinc-700 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${isCompleted ? 'bg-indigo-600' : 'bg-amber-500'}`}
                      style={{ width: `${totalInClass > 0 ? (completedInClass / totalInClass) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
