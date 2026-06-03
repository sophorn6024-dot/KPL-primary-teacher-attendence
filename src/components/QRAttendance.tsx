/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';
import { Teacher, AttendanceLog } from '../types';
import { playBeep, playErrorBeep, formatKhmerDate, khmerNumber } from '../utils';
import { 
  Camera, 
  RefreshCw, 
  CheckCircle, 
  Smartphone, 
  Printer, 
  AlertCircle, 
  UserCheck, 
  Volume2, 
  QrCode, 
  Download,
  Info
} from 'lucide-react';

interface QRAttendanceProps {
  teachers: Teacher[];
  logs: AttendanceLog[];
  onAddLog: (teacherId: string, status: 'វត្តមាន' | 'ច្បាប់' | 'អវត្តមាន', note?: string, method?: 'QR' | 'ប្រព័ន្ធ') => boolean;
}

export default function QRAttendance({ teachers, logs, onAddLog }: QRAttendanceProps) {
  const [useCamera, setUseCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<{ teacher: Teacher; logTime: string; isNew: boolean } | null>(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [showGateQR, setShowGateQR] = useState(false);
  const [selectedBadgeTeacher, setSelectedBadgeTeacher] = useState<Teacher | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanTimeoutRef = useRef<any>(null);

  // Set default selected teacher for simulator
  useEffect(() => {
    if (teachers.length > 0 && !selectedTeacherId) {
      setSelectedTeacherId(teachers[0].id);
      setSelectedBadgeTeacher(teachers[0]);
    }
  }, [teachers]);

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setCameraError(null);
    setUseCamera(true);
    setScanResult(null);

    // Give browser brief window to render video tag
    setTimeout(async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true'); // Required for iOS
          videoRef.current.play();
          requestAnimationFrame(tick);
        }
      } catch (err: any) {
        console.error('Camera access error:', err);
        setCameraError(
          'មិនអាចបើកកាមេរ៉ាបានទេ! សូមពិនិត្យមើលការអនុញ្ញាតសិទ្ធិកាមេរ៉ាក្នុងកម្មវិធីរុករក (Browser) របស់អ្នក។'
        );
        setUseCamera(false);
      }
    }, 100);
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setUseCamera(false);
  };

  const tick = () => {
    if (!streamRef.current) {
      return;
    }

    if (videoRef.current && !videoRef.current.paused && !videoRef.current.ended) {
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (context && videoRef.current.videoWidth > 0) {
          canvas.width = videoRef.current.videoWidth;
          canvas.height = videoRef.current.videoHeight;
          context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          });

          if (code) {
            handleDecodedId(code.data);
          }
        }
      }
    }

    if (streamRef.current) {
      requestAnimationFrame(tick);
    }
  };

  // Decode internal teacher ID
  const handleDecodedId = (id: string) => {
    // Prevent double scanning within 4 seconds of the same success message
    if (scanTimeoutRef.current) return;

    const cleanId = id.trim();
    const teacher = teachers.find((t) => t.id === cleanId);

    if (teacher) {
      // Add log
      const timeNow = new Date().toLocaleTimeString('en-US', { hour12: false });
      const wasAdded = onAddLog(teacher.id, 'វត្តមាន', 'ស្កេនតាមរយៈ QR Code', 'QR');

      if (wasAdded) {
        playBeep();
        setScanResult({
          teacher,
          logTime: timeNow,
          isNew: true,
        });
      } else {
        // Already checked in today but let's show status
        playBeep();
        setScanResult({
          teacher,
          logTime: 'បានចុះតាំងពីដំបូងរួចរាល់',
          isNew: false,
        });
      }

      // Lock scanner for 4 seconds
      scanTimeoutRef.current = setTimeout(() => {
        setScanResult(null);
        scanTimeoutRef.current = null;
      }, 4000);

    } else {
      // QR contains string but not a matching teacher
      playErrorBeep();
      scanTimeoutRef.current = setTimeout(() => {
        scanTimeoutRef.current = null;
      }, 3000);
    }
  };

  // Simulate a QR scan inside the UI
  const handleSimulateScan = () => {
    if (!selectedTeacherId) return;
    setIsSimulating(true);
    setScanResult(null);

    setTimeout(() => {
      handleDecodedId(selectedTeacherId);
      setIsSimulating(false);
    }, 1200); // 1.2s sweep animation
  };

  // QR rendering using QRServer API
  const getQRUrl = (data: string) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=10&data=${encodeURIComponent(data)}`;
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Dynamic scan panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left scanning card */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-[32px] p-6 shadow-sm overflow-hidden relative flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-800 pb-4 mb-4">
              <div className="space-y-0.5">
                <h2 className="font-bold text-slate-800 dark:text-neutral-200 text-lg flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-indigo-500" /> ម៉ាស៊ីនស្រង់វត្តមាន (QR Scanner)
                </h2>
                <p className="text-xs text-slate-400 dark:text-zinc-500">ស្កេនកាតសម្គាល់ខ្លួន ឬ QR កូដរបស់លោកគ្រូអ្នកគ្រូ</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-slate-50 dark:bg-zinc-800 rounded-lg text-slate-500 dark:text-neutral-400">
                  <Volume2 className="w-4 h-4 cursor-help" title="សំឡេងស្កេនបើកដំណើរការ" />
                </span>
                <span className="h-2 w-2 rounded-full bg-indigo-600 animate-pulse"></span>
              </div>
            </div>

            {/* Simulated Live Camera block */}
            <div className="relative bg-neutral-950 rounded-2xl w-full h-[320px] overflow-hidden flex items-center justify-center text-white mb-6">
              
              {useCamera ? (
                <>
                  <video
                    ref={videoRef}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  
                  {/* Hologram scan overlays */}
                  <div className="absolute inset-0 border-[24px] border-black/40 flex items-center justify-center">
                    <div className="relative w-48 h-48 border-2 border-indigo-500/60 rounded-xl">
                      {/* Scanning laser line */}
                      <div className="absolute left-0 right-0 h-[3px] bg-indigo-500 shadow-[0_0_8px_#6366f1] animate-[bounce_2s_infinite]"></div>
                      {/* Four corners */}
                      <div className="absolute -top-[3px] -left-[3px] w-4 h-4 border-t-4 border-l-4 border-indigo-500 rounded-tl"></div>
                      <div className="absolute -top-[3px] -right-[3px] w-4 h-4 border-t-4 border-r-4 border-indigo-500 rounded-tr"></div>
                      <div className="absolute -bottom-[3px] -left-[3px] w-4 h-4 border-b-4 border-l-4 border-indigo-500 rounded-bl"></div>
                      <div className="absolute -bottom-[3px] -right-[3px] w-4 h-4 border-b-4 border-r-4 border-indigo-500 rounded-br"></div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center p-6 space-y-4">
                  {isSimulating ? (
                    <div className="space-y-3">
                      <div className="w-12 h-12 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin mx-auto"></div>
                      <span className="text-sm font-medium text-indigo-400 block animate-pulse">កំពុងស៊ើបស្កេន QR...</span>
                      {/* Laser simulation */}
                      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5 bg-red-500 shadow-md shadow-red-500"></div>
                    </div>
                  ) : (
                    <>
                      <div className="h-16 w-16 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center mx-auto text-zinc-500">
                        <Camera className="w-8 h-8" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-bold text-sm text-neutral-300">ស្កេនតាមកាមេរ៉ាឧបករណ៍</h3>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto">ប្រើប្រាស់កាមេរ៉ាប្លង់ក្រោយ ឬកាមេរ៉ាកុំព្យូទ័រ ដើម្បីដំណើរការស្កេនកូដវត្តមានជាក់ស្ដែង</p>
                      </div>
                      <button
                        onClick={startCamera}
                        id="qr_btn_start_camera"
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs inline-flex items-center gap-2 shadow-lg shadow-indigo-950/20 cursor-pointer"
                      >
                        <Camera className="w-4 h-4" />
                        បើកដំណើរការកាមេរ៉ា
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* Status Alert Banner overlay upon success */}
              {scanResult && (
                <div className="absolute bottom-4 inset-x-4 bg-indigo-950/95 backdrop-blur border border-indigo-500 rounded-xl p-4 text-white flex items-center gap-4 animate-[slideUp_0.3s_ease-out] z-20 shadow-xl font-sans">
                  <div className="h-12 w-12 bg-white text-indigo-800 rounded-full flex items-center justify-center font-bold text-lg shrink-0">
                    <UserCheck className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold bg-indigo-500 px-2 py-0.5 rounded-full uppercase">
                      ស្កេនវត្តមានដោយជោគជ័យ
                    </span>
                    <h4 className="font-bold text-sm truncate mt-1">{scanResult.teacher.name}</h4>
                    <p className="text-xs text-indigo-200">
                      ID: {scanResult.teacher.id} • {scanResult.teacher.grade}({scanResult.teacher.section}) • វេន{scanResult.teacher.shift}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-indigo-200 block font-sans">Time</span>
                    <span className="text-sm font-mono font-bold">{khmerNumber(scanResult.logTime.split(' ')[0])}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Simulator Quick Testing Box */}
            <div className="bg-slate-50 dark:bg-zinc-800/40 p-4 rounded-2xl border border-slate-200 dark:border-zinc-800">
              <div className="flex items-center gap-2 text-slate-500 dark:text-zinc-400 text-xs font-bold mb-3">
                <Info className="w-4 h-4 text-indigo-500" />
                <span>ឧបករណ៍សាកល្បងម៉ាស៊ីន ( simulator សម្រាប់តេស្តក្នុងកម្មវិធី )</span>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <select
                    value={selectedTeacherId}
                    onChange={(e) => setSelectedTeacherId(e.target.value)}
                    id="qr_select_teacher_sim"
                    className="w-full bg-white dark:bg-zinc-900 border border-slate-202 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-800 dark:text-zinc-200 shadow-sm focus:outline-none focus:border-indigo-500 font-sans"
                  >
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.id} - {t.name} (វេន{t.shift})
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleSimulateScan}
                  disabled={isSimulating || useCamera}
                  id="qr_btn_simulate"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-zinc-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 border border-indigo-500 cursor-pointer select-none transition-all shadow-sm"
                >
                  <RefreshCw className={`w-4 h-4 ${isSimulating ? 'animate-spin' : ''}`} />
                  ចុចសាកល្បងស្កេន
                </button>
              </div>
            </div>
          </div>

          {cameraError && (
            <div className="mt-4 p-3.5 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900 text-red-600 dark:text-red-400 rounded-xl text-xs flex gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{cameraError}</span>
            </div>
          )}

          {useCamera && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={stopCamera}
                id="qr_btn_stop_camera"
                className="px-4 py-2 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs hover:bg-slate-200 dark:hover:bg-zinc-700 transition cursor-pointer"
              >
                បិទកាមេរ៉ា
              </button>
            </div>
          )}
        </div>

        {/* Right download Common QR Badge Panel */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-[32px] p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="font-bold text-slate-800 dark:text-neutral-200 text-base border-b border-slate-100 dark:border-zinc-800 pb-3">
              កូដ QR រួម និងកាតគ្រូ
            </h3>

            {/* Toggle tabs for single QR vs Individual badging */}
            <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-zinc-800 p-1 rounded-xl">
              <button
                onClick={() => setShowGateQR(true)}
                className={`py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                  showGateQR ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-xs animate-none' : 'text-slate-500 dark:text-zinc-400'
                }`}
              >
                QR រួមរបស់សាលា
              </button>
              <button
                onClick={() => setShowGateQR(false)}
                className={`py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                  !showGateQR ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-xs animate-none' : 'text-slate-500 dark:text-zinc-400'
                }`}
              >
                កាតគ្រូសម្គាល់ខ្លួន
              </button>
            </div>

            {/* Display panel */}
            {showGateQR ? (
              /* High quality Common QR card card printable format */
              <div className="border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 bg-gradient-to-b from-slate-50 to-white dark:from-zinc-900 dark:to-zinc-800/30 flex flex-col items-center text-center space-y-4 shadow-inner" id="printable-gate-qr">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-full font-sans">
                    សាលាបឋមសិក្សាកំពង់ល្ពៅ
                  </span>
                  <h4 className="font-bold text-sm text-slate-800 dark:text-zinc-200">
                    តារាងស្កេនវត្តមានរួមប្រចាំថ្ងៃ
                  </h4>
                </div>

                {/* Big QR Server display */}
                <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
                  <img
                    src={getQRUrl('KAMPONG_LPOU_CHECK_IN')}
                    alt="School gate common QR code"
                    className="w-40 h-40"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <p className="text-[11px] text-slate-400 dark:text-zinc-500 leading-relaxed">
                  គ្រូអាចស្កេន QR នេះជាមួយទូរស័ព្ទដៃ ដើម្បីចូលកាន់ទំព័រស្រង់ ឬប្រើប្រាស់ឧបករណ៍ស្កេនមេរបស់ការិយាល័យ។
                </p>

                <div className="flex gap-2 w-full">
                  <a
                    href={getQRUrl('KAMPONG_LPOU_CHECK_IN')}
                    download="QR_រួម_សាលាបឋមសិក្សាកំពង់ល្ពៅ.png"
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/20 dark:hover:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition select-none"
                  >
                    <Download className="w-3.5 h-3.5" /> ទាញយក QR
                  </a>
                  <button
                    onClick={() => window.print()}
                    className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-slate-700 dark:text-zinc-300 rounded-xl font-bold text-xs flex items-center justify-center transition cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              /* Custom teacher badge card presentation */
              <div className="space-y-4 font-sans">
                <div className="grid grid-cols-1 gap-4">
                  {selectedBadgeTeacher ? (
                    <div className="border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 bg-white dark:bg-zinc-950 shadow-xs hover:border-indigo-500/20 transition-all flex flex-col items-center text-center space-y-3 relative overflow-hidden" id="printable-teacher-badge">
                      {/* Badge Top Design Line */}
                      <div className="absolute top-0 inset-x-0 h-2.5 bg-gradient-to-r from-indigo-500 to-sky-600"></div>

                      <div className="pt-2 text-center">
                        <span className="text-[9px] font-bold text-slate-400 block tracking-widest uppercase">
                          សាលាបឋមសិក្សាកំពង់ល្ពៅ
                        </span>
                        <h4 className="font-bold text-sm text-slate-800 dark:text-zinc-300 mt-1">
                          {selectedBadgeTeacher.name}
                        </h4>
                        <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 px-2 py-0.5 rounded mt-0.5 inline-block font-sans">
                          {selectedBadgeTeacher.id}
                        </span>
                      </div>

                      {/* Decoded QR representation */}
                      <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-inner">
                        <img
                          src={getQRUrl(selectedBadgeTeacher.id)}
                          alt="Teacher individual card code"
                          className="w-28 h-28"
                          referrerPolicy="no-referrer"
                        />
                      </div>

                      <div className="text-xs text-slate-500 space-y-0.5 leading-relaxed dark:text-zinc-400">
                        <p>បង្រៀន: <strong className="text-slate-700 dark:text-zinc-300">{selectedBadgeTeacher.grade}({selectedBadgeTeacher.section})</strong></p>
                        <p>វេនសិក្សា: <strong className="text-slate-700 dark:text-zinc-300">{selectedBadgeTeacher.shift}</strong></p>
                      </div>

                      <div className="flex gap-2 w-full pt-1">
                        <a
                          href={getQRUrl(selectedBadgeTeacher.id)}
                          download={`Badge_${selectedBadgeTeacher.id}.png`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 py-1.5 border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900 rounded-xl font-bold text-[10px] text-slate-600 dark:text-zinc-400 flex items-center justify-center gap-1 transition"
                        >
                          <Download className="w-3.5 h-3.5" /> សង្គ្រោះរូបភាព
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-xs text-slate-400">សូមបង្កើតគ្រូក្នុងប្រព័ន្ធជាមុនសិន</div>
                  )}
                </div>

                {/* Dropdown switch badge focus */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 hover:text-zinc-500">ជ្រើសរើសកាតរបស់គ្រូ:</label>
                  <select
                    value={selectedBadgeTeacher?.id || ''}
                    onChange={(e) => {
                      const found = teachers.find((t) => t.id === e.target.value);
                      if (found) setSelectedBadgeTeacher(found);
                    }}
                    id="qr_select_badge_focus"
                    className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-slate-700 dark:text-zinc-300 font-sans focus:outline-none"
                  >
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.id})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-zinc-800 mt-6 text-[11px] text-slate-400 dark:text-zinc-500 leading-relaxed space-y-1 font-sans">
            <strong>របៀបកាតជោគជ័យ:</strong>
            <p>គ្រូត្រូវគ្រាន់តែដាក់កូដ QR របស់ពួកគេនៅពីមុខកាមេរ៉ា។ ប្រព័ន្ធនឹងធ្វើការស្រង់វត្តមានដោយស្វ័យប្រវត្តិតាមពេលវេលានោះភ្លាមៗ!</p>
          </div>
        </div>

      </div>
    </div>
  );
}
