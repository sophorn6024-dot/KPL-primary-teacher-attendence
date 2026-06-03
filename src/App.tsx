/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Teacher, AttendanceLog, SyncSettings, AttendanceStatus, Shift } from './types';
import { INITIAL_TEACHERS, getInitialLogs } from './mockData';
import Dashboard from './components/Dashboard';
import QRAttendance from './components/QRAttendance';
import TeacherManagement from './components/TeacherManagement';
import DailyLog from './components/DailyLog';
import GoogleSheetSync from './components/GoogleSheetSync';
import TeacherPortal from './components/TeacherPortal';
import { 
  LayoutDashboard, 
  QrCode, 
  Users, 
  CalendarCheck, 
  CloudLightning,
  Sun,
  Moon,
  School,
  Menu,
  X,
  Lock,
  Unlock,
  ShieldCheck,
  LogOut,
  Key,
  User
} from 'lucide-react';

export default function App() {
  // Theme State (Default to Light)
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('kpl_dark_mode');
    return saved ? saved === 'true' : false;
  });

  // Admin Access State
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    const saved = localStorage.getItem('kpl_is_admin');
    return saved ? saved === 'true' : false;
  });

  const [adminPin, setAdminPin] = useState<string>(() => {
    return localStorage.getItem('kpl_admin_pin') || '1234';
  });

  // Logged-in Teacher Portal State
  const [loggedInTeacherId, setLoggedInTeacherId] = useState<string | null>(() => {
    return localStorage.getItem('kpl_logged_teacher_id') || null;
  });

  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');

  // Navigation Panel State
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Core Local Storage Data States
  const [teachers, setTeachers] = useState<Teacher[]>(() => {
    const saved = localStorage.getItem('kpl_teachers');
    return saved ? JSON.parse(saved) : INITIAL_TEACHERS;
  });

  const [logs, setLogs] = useState<AttendanceLog[]>(() => {
    const saved = localStorage.getItem('kpl_logs');
    return saved ? JSON.parse(saved) : getInitialLogs();
  });

  const [syncSettings, setSyncSettings] = useState<SyncSettings>(() => {
    const saved = localStorage.getItem('kpl_sync_settings');
    return saved ? JSON.parse(saved) : { googleSheetUrl: '', autoSync: false };
  });

  // Track state changes to synchronize Local Storage
  useEffect(() => {
    localStorage.setItem('kpl_teachers', JSON.stringify(teachers));
  }, [teachers]);

  useEffect(() => {
    localStorage.setItem('kpl_logs', JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    localStorage.setItem('kpl_sync_settings', JSON.stringify(syncSettings));
  }, [syncSettings]);

  useEffect(() => {
    localStorage.setItem('kpl_dark_mode', String(isDark));
  }, [isDark]);

  useEffect(() => {
    localStorage.setItem('kpl_is_admin', String(isAdmin));
  }, [isAdmin]);

  useEffect(() => {
    localStorage.setItem('kpl_admin_pin', adminPin);
  }, [adminPin]);

  useEffect(() => {
    if (loggedInTeacherId) {
      localStorage.setItem('kpl_logged_teacher_id', loggedInTeacherId);
    } else {
      localStorage.removeItem('kpl_logged_teacher_id');
    }
  }, [loggedInTeacherId]);

  // Handle Active Check-In from QR scanner
  const handleAddLog = (
    teacherId: string, 
    status: AttendanceStatus, 
    note: string = '', 
    method: 'QR' | 'ប្រព័ន្ធ' = 'QR'
  ): boolean => {
    const teacher = teachers.find((t) => t.id === teacherId);
    if (!teacher) return false;

    const todayStr = new Date().toISOString().split('T')[0];
    const timeNow = new Date().toTimeString().split(' ')[0]; // HH:MM:SS
    
    // Check if double logs exist for this specific teacher, date, and shift
    const isDoubleLog = logs.some(
      (l) => l.teacherId === teacherId && l.date === todayStr && l.shift === teacher.shift
    );

    if (isDoubleLog) {
      // Return false to notify the QR component they registered already but avoid duplicate additions
      return false;
    }

    const newLog: AttendanceLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      teacherId: teacher.id,
      teacherName: teacher.name,
      date: todayStr,
      time: timeNow,
      status,
      method,
      shift: teacher.shift,
      grade: teacher.grade,
      section: teacher.section,
      note,
    };

    const updatedLogs = [newLog, ...logs];
    setLogs(updatedLogs);

    // Dynamic Cloud Push if Auto Sync is active in connection settings
    if (syncSettings.googleSheetUrl && syncSettings.autoSync) {
      triggerSilentAutoSync(updatedLogs);
    }

    return true;
  };

  // Set Manual Grid attendance log entries (creating/mutating on check grids)
  const handleSetManualLog = (
    teacherId: string, 
    status: AttendanceStatus, 
    note: string, 
    date: string, 
    shift: Shift
  ) => {
    const teacher = teachers.find((t) => t.id === teacherId);
    if (!teacher) return;

    // Search for current matching record
    const existingLogIndex = logs.findIndex(
      (l) => l.teacherId === teacherId && l.date === date && l.shift === shift
    );

    const timeNow = new Date().toTimeString().split(' ')[0];

    const updatedLogs = [...logs];

    if (existingLogIndex !== -1) {
      // Modify existing log in-place
      updatedLogs[existingLogIndex] = {
        ...updatedLogs[existingLogIndex],
        status,
        note,
        method: 'ប្រព័ន្ធ',
      };
    } else {
      // Append a fresh custom manual register entry
      const newLog: AttendanceLog = {
        id: `m-log-${Date.now()}`,
        teacherId: teacher.id,
        teacherName: teacher.name,
        date,
        time: date === new Date().toISOString().split('T')[0] ? timeNow : '',
        status,
        method: 'ប្រព័ន្ធ',
        shift,
        grade: teacher.grade,
        section: teacher.section,
        note,
      };
      updatedLogs.unshift(newLog);
    }

    setLogs(updatedLogs);

    // Sync if auto sync enabled
    if (syncSettings.googleSheetUrl && syncSettings.autoSync) {
      triggerSilentAutoSync(updatedLogs);
    }
  };

  // Perform background auto post syncs
  const triggerSilentAutoSync = async (latestLogs: AttendanceLog[]) => {
    try {
      await fetch(syncSettings.googleSheetUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'sync_all',
          teachers,
          logs: latestLogs,
        }),
      });
    } catch (err) {
      console.warn('Background auto sync failed', err);
    }
  };

  // CRUD functions for Teachers profiles
  const handleAddTeacher = (newTeacher: Teacher) => {
    setTeachers([...teachers, newTeacher]);
  };

  const handleUpdateTeacher = (updatedTeacher: Teacher) => {
    setTeachers(teachers.map((t) => (t.id === updatedTeacher.id ? updatedTeacher : t)));
    
    // Also retroactively patch teacher name/classroom indices inside previous logs
    setLogs(
      logs.map((log) => 
        log.teacherId === updatedTeacher.id 
          ? { 
              ...log, 
              teacherName: updatedTeacher.name,
              grade: updatedTeacher.grade,
              section: updatedTeacher.section,
              shift: updatedTeacher.shift 
            } 
          : log
      )
    );
  };

  const handleDeleteTeacher = (id: string) => {
    setTeachers(teachers.filter((t) => t.id !== id));
    // Remove related logs to keep DB references intact
    setLogs(logs.filter((l) => l.teacherId !== id));
  };

  const handleBulkImport = (imported: Teacher[]) => {
    // Append and avoid duplicate keys on collision
    const existingIds = new Set(teachers.map((t) => t.id));
    const cleanImports = imported.filter((t) => !existingIds.has(t.id));
    setTeachers([...teachers, ...cleanImports]);
  };

  const handleClearAllLogs = () => {
    setLogs([]);
  };

  // Navigation choices representation
  const tabs = [
    { id: 'dashboard', val: 'ក្តារព័ត៌មាន', icon: LayoutDashboard },
    { id: 'scan', val: 'ស្កេនវត្តមាន QR', icon: QrCode },
    { id: 'teacher-portal', val: 'គណនីគ្រូបង្រៀន', icon: User },
    { id: 'teachers', val: 'គ្រប់គ្រងគ្រូ', icon: Users, restricted: true },
    { id: 'logs', val: 'ស្រង់វត្តមានប្រចាំថ្ងៃ', icon: CalendarCheck, restricted: true },
    { id: 'sync', val: 'ការសមកាលកម្ម Sheets', icon: CloudLightning, restricted: true },
  ];

  const isTabProtected = ['teachers', 'logs', 'sync'].includes(activeTab);

  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === adminPin) {
      setIsAdmin(true);
      setPinError('');
      setPinInput('');
    } else {
      setPinError('លេខកូដសម្ងាត់មិនត្រឹមត្រូវទេ! សូមព្យាយាមម្តងទៀត។');
    }
  };

  return (
    <div className={isDark ? 'dark bg-zinc-950 text-zinc-100 min-h-screen' : 'bg-slate-50 text-slate-900 min-h-screen'}>
      <div className="flex flex-col lg:flex-row min-h-screen">
        
        {/* Sidebar Panel - Desktop Layout */}
        <aside className="hidden lg:flex flex-col justify-between w-64 shrink-0 bg-white dark:bg-zinc-900 border-r border-slate-200 dark:border-zinc-800 p-6 shadow-sm">
          <div className="space-y-8">
            {/* School Header Badge */}
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-indigo-505 to-sky-600 rounded-2xl text-white shadow-md shadow-indigo-500/10">
                <School className="w-6 h-6" />
              </div>
              <div className="space-y-0.5">
                <h2 className="font-bold text-sm tracking-tight leading-none text-slate-800 dark:text-zinc-200">
                  កំពង់ល្ពៅ
                </h2>
                <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest leading-none">
                  សាលាបឋមសិក្សា
                </span>
              </div>
            </div>

            {/* Sidebar Triggers */}
            <nav className="space-y-1.5">
              {tabs.map((tab) => {
                const IconComponent = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer select-none relative ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/10 scale-[1.01]'
                        : 'text-slate-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800/55'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <IconComponent className="w-4.5 h-4.5 shrink-0" />
                      <span>{tab.val}</span>
                    </div>
                    {tab.restricted && (
                      isAdmin ? (
                        <Unlock className="w-3.5 h-3.5 text-emerald-500 shrink-0 opacity-80" />
                      ) : (
                        <Lock className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 shrink-0 opacity-75" />
                      )
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Theme Shift & Footer profiles */}
          <div className="space-y-4 pt-6 border-t border-slate-200 dark:border-zinc-800">
            {isAdmin ? (
              <div className="space-y-2 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 p-3 rounded-2xl">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> គណនី Admin
                  </span>
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsAdmin(false);
                    setActiveTab('dashboard');
                  }}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 active:scale-[0.98] text-white text-[11px] font-bold rounded-xl transition cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" /> ចាកចេញ (Logout)
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  const targetTab = ['teachers', 'logs', 'sync'].includes(activeTab) ? activeTab : 'teachers';
                  setActiveTab(targetTab);
                }}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 text-[11px] font-bold rounded-xl transition cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 text-slate-400" /> ចូលប្រើប្រាស់ជា Admin
              </button>
            )}

            <button
              onClick={() => setIsDark(!isDark)}
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-800/80 hover:bg-slate-100 dark:hover:bg-zinc-750 text-xs font-bold text-slate-700 dark:text-zinc-300 transition cursor-pointer"
            >
              <span className="flex items-center gap-2">
                {isDark ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
                {isDark ? 'រចនាបថងងឹត (Dark)' : 'រចនាបថភ្លឺ (Light)'}
              </span>
              <span className="text-[9px] bg-slate-200 dark:bg-zinc-700 text-slate-500 dark:text-zinc-400 px-1.5 py-0.5 rounded uppercase font-sans">
                Shift
              </span>
            </button>

            <div className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono text-center">
              v1.0.0 • Kampong Lpou Elementary
            </div>
          </div>
        </aside>

        {/* Mobile Header Bar */}
        <header className="lg:hidden flex justify-between items-center bg-white dark:bg-zinc-900 px-5 py-4 border-b border-slate-200 dark:border-zinc-800 shadow-xs z-30">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-sky-600 rounded-xl text-white">
              <School className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-xs uppercase text-slate-800 dark:text-zinc-200">
                សាលាបឋមសិក្សាកំពង់ល្ពៅ
              </h2>
              <span className="text-[9px] text-slate-400 dark:text-zinc-500 block leading-none mt-0.5">
                ប្រព័ន្ធគ្រប់គ្រងវត្តមានគ្រូ
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsDark(!isDark)}
              className="p-2 border border-slate-200 dark:border-zinc-800 rounded-xl hover:bg-slate-50/50 text-slate-650 dark:text-zinc-350 shrink-0"
            >
              {isDark ? <Moon className="w-4.5 h-4.5 text-indigo-400" /> : <Sun className="w-4.5 h-4.5 text-amber-500" />}
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 border border-slate-200 dark:border-zinc-800 rounded-xl hover:bg-slate-50/50 text-slate-650 dark:text-zinc-350"
            >
              {isMobileMenuOpen ? <X className="w-4.5 h-4.5" /> : <Menu className="w-4.5 h-4.5" />}
            </button>
          </div>
        </header>

        {/* Slide-out Mobile Menu Panel */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-16 inset-x-0 bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 shadow-xl p-5 space-y-4 lg:hidden z-20"
            >
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const IconComponent = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <IconComponent className="w-4.5 h-4.5" />
                        <span>{tab.val}</span>
                      </div>
                      {tab.restricted && (
                        isAdmin ? (
                          <Unlock className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Lock className="w-3.5 h-3.5 text-slate-400" />
                        )
                      )}
                    </button>
                  );
                })}
              </nav>

              <div className="pt-3 border-t border-slate-100 dark:border-zinc-800">
                {isAdmin ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsAdmin(false);
                      setActiveTab('dashboard');
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-red-500 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" /> ចាកចេញពី Admin (Logout Admin)
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('teachers');
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-100 dark:bg-zinc-800 text-slate-705 dark:text-zinc-300 text-xs font-bold rounded-xl transition border border-slate-200 dark:border-zinc-700 cursor-pointer"
                  >
                    <Lock className="w-4 h-4 text-slate-400" /> ចូលប្រើប្រាស់ជា Admin
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Primary Content Window Viewport */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto z-10 w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="max-w-6xl mx-auto h-full"
            >
              {isTabProtected && !isAdmin ? (
                <div className="flex items-center justify-center min-h-[70vh] p-4 font-sans">
                  <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-[32px] p-8 shadow-xl text-center space-y-6">
                    
                    <div className="mx-auto w-16 h-16 bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-800 text-indigo-600 dark:text-indigo-400 rounded-3xl flex items-center justify-center animate-bounce-[duration:4s]">
                      <Lock className="w-7 h-7" />
                    </div>

                    <div className="space-y-1.5">
                      <h2 className="text-base font-bold text-slate-800 dark:text-zinc-200">
                        តំបន់គណៈគ្រប់គ្រង (Admin Restricted Room)
                      </h2>
                      <p className="text-xs text-slate-400 dark:text-zinc-400 leading-relaxed max-w-sm mx-auto">
                        សូមសរសេរលេខកូដសម្រង់សម្ងាត់ជាមុនសិន ដើម្បីមានសិទ្ធិចុះឈ្មោះ កែប្រែទិន្នន័យគ្រូ កំណត់ម៉ោងវត្តមាន ឬសមកាលកម្មទិន្នន័យ (Sync) ទៅកាន់ Google Sheet។
                      </p>
                    </div>

                    <form onSubmit={handleVerifyPin} className="space-y-4">
                      <div className="space-y-2 text-left">
                        <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">
                          លេខកូដសម្ងាត់គណនី Admin
                        </label>
                        <input
                          type="password"
                          maxLength={6}
                          placeholder="••••"
                          value={pinInput}
                          onChange={(e) => {
                            setPinInput(e.target.value);
                            if (pinError) setPinError('');
                          }}
                          className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-center text-sm font-bold tracking-widest text-slate-800 dark:text-indigo-400 focus:outline-none focus:border-indigo-500 font-mono"
                          autoFocus
                          required
                        />
                      </div>

                      {pinError && (
                        <p className="text-xs text-red-500 dark:text-red-400 font-bold">{pinError}</p>
                      )}

                      <button
                        type="submit"
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
                      >
                        ផ្ទៀងផ្ទាត់ និងចូលប្រើប្រាស់
                      </button>
                    </form>

                  </div>
                </div>
              ) : (
                <>
                  {activeTab === 'dashboard' && (
                    <Dashboard 
                      teachers={teachers} 
                      logs={logs} 
                      onNavigate={(tab) => setActiveTab(tab)} 
                    />
                  )}
                  {activeTab === 'scan' && (
                    <QRAttendance 
                      teachers={teachers} 
                      logs={logs} 
                      onAddLog={handleAddLog} 
                    />
                  )}
                  {activeTab === 'teacher-portal' && (
                    <TeacherPortal
                      teachers={teachers}
                      logs={logs}
                      onSetManualLog={handleSetManualLog}
                      loggedInTeacherId={loggedInTeacherId}
                      onLogin={(id) => setLoggedInTeacherId(id)}
                      onLogout={() => setLoggedInTeacherId(null)}
                    />
                  )}
                  {activeTab === 'teachers' && (
                    <TeacherManagement
                      teachers={teachers}
                      onAddTeacher={handleAddTeacher}
                      onUpdateTeacher={handleUpdateTeacher}
                      onDeleteTeacher={handleDeleteTeacher}
                      onBulkImport={handleBulkImport}
                    />
                  )}
                  {activeTab === 'logs' && (
                    <DailyLog
                      teachers={teachers}
                      logs={logs}
                      onSetManualLog={handleSetManualLog}
                      onClearLogs={handleClearAllLogs}
                    />
                  )}
                  {activeTab === 'sync' && (
                    <GoogleSheetSync
                      settings={syncSettings}
                      teachers={teachers}
                      logs={logs}
                      onSaveSettings={(s) => setSyncSettings(s)}
                      onClearSyncDate={() => setSyncSettings({ googleSheetUrl: '', autoSync: false })}
                      adminPin={adminPin}
                      onChangePin={(newPin) => setAdminPin(newPin)}
                    />
                  )}
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </main>

      </div>
    </div>
  );
}
