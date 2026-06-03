/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Teacher, Gender, Shift, GradeSection } from '../types';
import { GRADELIST } from '../mockData';
import { 
  exportTeachersToCSV, 
  parseCsvTeachers,
  khmerNumber,
  displayKhmerShortDate
} from '../utils';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Download, 
  Upload, 
  X, 
  Filter, 
  Phone, 
  MapPin, 
  Calendar,
  AlertCircle,
  FileSpreadsheet,
  User,
  Heart
} from 'lucide-react';

interface TeacherManagementProps {
  teachers: Teacher[];
  onAddTeacher: (teacher: Teacher) => void;
  onUpdateTeacher: (teacher: Teacher) => void;
  onDeleteTeacher: (id: string) => void;
  onBulkImport: (teachers: Teacher[]) => void;
}

export default function TeacherManagement({
  teachers,
  onAddTeacher,
  onUpdateTeacher,
  onDeleteTeacher,
  onBulkImport,
}: TeacherManagementProps) {
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState('គ្រប់ថ្នាក់');
  const [selectedShiftFilter, setSelectedShiftFilter] = useState('គ្រប់វេន');

  // Form states (Modal)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  
  const [formId, setFormId] = useState('');
  const [formName, setFormName] = useState('');
  const [formGender, setFormGender] = useState<Gender>('ប្រុស');
  const [formDob, setFormDob] = useState('1990-01-01');
  const [formPhone, setFormPhone] = useState('');
  const [formGrade, setFormGrade] = useState('ថ្នាក់ទី១');
  const [formSection, setFormSection] = useState<GradeSection>('ក');
  const [formShift, setFormShift] = useState<Shift>('ពេលព្រឹក');
  const [formPhoto, setFormPhoto] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // File import states
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importedPreview, setImportedPreview] = useState<Teacher[]>([]);
  const [importFileName, setImportFileName] = useState('');

  // Auto-generate new ID based on school initials KPL
  const generateNewId = () => {
    const existingIds = teachers.map(t => {
      const match = t.id.match(/KPL-(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    });
    const maxNum = existingIds.length > 0 ? Math.max(...existingIds) : 0;
    return `KPL-${String(maxNum + 1).padStart(3, '0')}`;
  };

  const openAddModal = () => {
    setEditingTeacher(null);
    setFormId(generateNewId());
    setFormName('');
    setFormGender('ប្រុស');
    setFormDob('1990-01-01');
    setFormPhone('');
    setFormGrade('ថ្នាក់ទី១');
    setFormSection('ក');
    setFormShift('ពេលព្រឹក');
    setFormPhoto('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setFormId(teacher.id);
    setFormName(teacher.name);
    setFormGender(teacher.gender);
    setFormDob(teacher.dob);
    setFormPhone(teacher.phone);
    setFormGrade(teacher.grade);
    setFormSection(teacher.section);
    setFormShift(teacher.shift);
    setFormPhoto(teacher.photo || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setFormError('រូបភាពធំពេក! សូមជ្រើសរើសរូបភាពក្រោម ២MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formName.trim()) {
      setFormError('សូមបំពេញឈ្មោះលោកគ្រូ-អ្នកគ្រូ!');
      return;
    }

    if (!formPhone.trim()) {
      setFormError('សូមបំពេញលេខទូរស័ព្ទ!');
      return;
    }

    // Verify unique ID on add transition
    if (!editingTeacher && teachers.some((t) => t.id === formId)) {
      setFormError('អត្តសញ្ញាណប័ណ្ណ (ID) នេះមានរួចរាល់ហើយក្នុងប្រព័ន្ធ!');
      return;
    }

    const tData: Teacher = {
      id: formId.trim().toUpperCase(),
      name: formName.trim(),
      gender: formGender,
      dob: formDob,
      phone: formPhone.trim(),
      grade: formGrade,
      section: formSection,
      shift: formShift,
      photo: formPhoto || undefined,
    };

    if (editingTeacher) {
      onUpdateTeacher(tData);
    } else {
      onAddTeacher(tData);
    }
    setIsModalOpen(false);
  };

  // CSV Drag/Drop Import Parsing
  const handleCsvFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImportFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const parsed = parseCsvTeachers(text);
        setImportedPreview(parsed);
      };
      reader.readAsText(file, 'utf-8');
    }
  };

  const handleConfirmBulkImport = () => {
    if (importedPreview.length > 0) {
      onBulkImport(importedPreview);
      setIsImportModalOpen(false);
      setImportedPreview([]);
      setImportFileName('');
    }
  };

  // Filters logic
  const filteredTeachers = teachers.filter((t) => {
    const sTerm = searchTerm.toLowerCase();
    const matchSearch = 
      t.name.toLowerCase().includes(sTerm) || 
      t.id.toLowerCase().includes(sTerm) || 
      t.phone.includes(sTerm);

    const matchGrade = selectedGradeFilter === 'គ្រប់ថ្នាក់' || t.grade === selectedGradeFilter;
    const matchShift = selectedShiftFilter === 'គ្រប់វេន' || t.shift === selectedShiftFilter;

    return matchSearch && matchGrade && matchShift;
  });

  const downloadTemplate = () => {
    const mockTemplate: Teacher[] = [
      {
        id: 'KPL-001',
        name: 'សេង សុភាន់',
        gender: 'ប្រុស',
        dob: '1988-04-12',
        phone: '0884640290',
        grade: 'ថ្នាក់ទី៤',
        section: 'ក',
        shift: 'ពេលរសៀល'
      },
      {
        id: 'KPL-002',
        name: 'ចាន់ ស្រីនីុ',
        gender: 'ស្រី',
        dob: '1992-10-05',
        phone: '0975544332',
        grade: 'ថ្នាក់ទី១',
        section: 'ក',
        shift: 'ពេលព្រឹក'
      }
    ];
    exportTeachersToCSV(mockTemplate);
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Search and Action Bar */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-[32px] p-5 shadow-sm flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
        
        {/* Search Input bar */}
        <div className="flex-1 min-w-[280px] relative">
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
          <input
            type="text"
            placeholder="ស្វែងរកឈ្មោះគ្រូ, លេខទូរស័ព្ទ ឬ លេខកូដសម្គាល់គ្រូ (ID)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            id="control_search_teachers"
            className="w-full bg-slate-50 dark:bg-zinc-850 text-slate-800 dark:text-zinc-200 pl-11 pr-4 py-2.5 rounded-2xl text-xs font-medium placeholder-slate-400 dark:placeholder-zinc-500 border border-transparent shadow-inner focus:outline-none focus:border-indigo-500/50 focus:bg-white dark:focus:bg-zinc-900 transition-all font-sans"
          />
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={openAddModal}
            id="btn_add_teacher_new"
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" /> បន្ថែមគ្រូថ្មី
          </button>

          <button
            onClick={() => setIsImportModalOpen(true)}
            id="btn_import_excel_modal"
            className="px-4 py-2.5 border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-850 text-slate-700 dark:text-slate-350 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <Upload className="w-4 h-4 text-indigo-600" /> នាំចូលទិន្នន័យ (Excel/CSV)
          </button>

          <button
            onClick={() => exportTeachersToCSV(teachers)}
            id="btn_export_teacher_list"
            className="px-4 py-2.5 border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-850 text-slate-700 dark:text-slate-350 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <Download className="w-4 h-4 text-indigo-600" /> ទាញយកបញ្ជី (CSV)
          </button>
        </div>

      </div>

      {/* Advanced Filter Indicators row */}
      <div className="flex flex-wrap items-center gap-4 bg-slate-50 dark:bg-zinc-800/20 px-5 py-3 rounded-2xl border border-slate-200 dark:border-zinc-800/50">
        <span className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1 shrink-0 font-sans">
          <Filter className="w-3.5 h-3.5 text-indigo-500" /> ត្រងទិន្នន័យទម្រង់:
        </span>

        {/* Grade filters */}
        <div className="flex flex-wrap gap-2">
          {['គ្រប់ថ្នាក់', ...GRADELIST].map((g) => (
            <button
              key={g}
              onClick={() => setSelectedGradeFilter(g)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedGradeFilter === g
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-500 hover:border-indigo-500/20'
              }`}
            >
              {g}
            </button>
          ))}
        </div>

        <div className="h-4 w-px bg-slate-200 dark:bg-zinc-800 hidden md:block"></div>

        {/* Shift filters */}
        <div className="flex gap-2">
          {['គ្រប់វេន', 'ពេលព្រឹក', 'ពេលរសៀល'].map((sf) => (
            <button
              key={sf}
              onClick={() => setSelectedShiftFilter(sf)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedShiftFilter === sf
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-500 hover:border-indigo-500/20'
              }`}
            >
              {sf}
            </button>
          ))}
        </div>
      </div>

      {/* Teachers Display grid */}
      {filteredTeachers.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-[32px] p-16 text-center border border-slate-200 dark:border-zinc-800 space-y-4">
          <div className="w-16 h-16 bg-slate-50 dark:bg-zinc-800/40 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <Search className="w-8 h-8 text-indigo-500" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-slate-800 dark:text-neutral-250">មិនរកឃើញឈ្មោះគ្រូបង្រៀន</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">មិនមានទិន្នន័យគ្រូត្រូវគ្នាជាមួយលក្ខខណ្ឌស្រាវជ្រាវ ឬតម្រងដែលបានកំណត់ខាងលើឡើយ។</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTeachers.map((t) => (
            <div
              key={t.id}
              className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-[32px] p-6 shadow-sm shadow-slate-100/30 hover:shadow-xs hover:border-indigo-500/30 dark:hover:border-zinc-700 transition relative overflow-hidden group"
            >
              {/* Card visual layout */}
              <div className="absolute top-0 right-0 h-16 w-16 bg-gradient-to-bl from-slate-50 dark:from-zinc-800/40 to-transparent rounded-bl-3xl -z-10"></div>
              
              <div className="flex items-start gap-4">
                
                {/* Image/Avatar */}
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-50 to-sky-50 dark:from-indigo-950/40 dark:to-sky-950/40 border border-indigo-100 dark:border-indigo-900/30 flex items-center justify-center shrink-0 font-bold overflow-hidden">
                  {t.photo ? (
                    <img src={t.photo} alt={t.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <span className="text-indigo-700 dark:text-indigo-400 text-xl font-bold font-sans">
                      {t.name.split(' ').pop()?.[0] || 'T'}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded">
                      {t.id}
                    </span>
                    <span className="text-[10px] text-slate-450 dark:text-zinc-500 font-medium font-sans">
                      {t.gender}
                    </span>
                  </div>
                  
                  <h3 className="font-bold text-slate-850 dark:text-zinc-200 text-base leading-snug truncate">
                    {t.name}
                  </h3>

                  <p className="text-xs text-slate-400 dark:text-zinc-500 flex items-center gap-1 pt-0.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400/80" /> {t.phone}
                  </p>
                </div>

              </div>

              {/* Classroom settings section */}
              <div className="grid grid-cols-2 gap-3 mt-5 pt-4 border-t border-slate-100 dark:border-zinc-800/80 text-xs">
                <div className="flex items-center gap-2 text-slate-550 dark:text-zinc-400 font-medium font-sans">
                  <MapPin className="w-4 h-4 text-indigo-500/80 shrink-0" />
                  <span>{t.grade}({t.section})</span>
                </div>
                <div className="flex items-center gap-2 text-slate-550 dark:text-zinc-400 font-medium font-sans">
                  <Calendar className="w-4 h-4 text-indigo-500/80 shrink-0" />
                  <span>{t.shift}</span>
                </div>
              </div>

              {/* Edit/Trash Actions overlay */}
              <div className="flex justify-end gap-1.5 mt-5 pt-3.5 border-t border-slate-100 dark:border-zinc-800/50">
                <button
                  type="button"
                  onClick={() => openEditModal(t)}
                  id={`btn_edit_teacher_${t.id}`}
                  className="p-2 text-slate-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-zinc-850 rounded-xl transition cursor-pointer"
                  title="កែសម្រួលព័ត៌មាន"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`តើអ្នកពិតជាចង់លុបលោកគ្រូ-អ្នកគ្រូឈ្មោះ "${t.name}" នេះពិតមែនទេ? ទិន្នន័យស្កេនទាំងអស់នឹងត្រូវលុបដូចគ្នា។`)) {
                      onDeleteTeacher(t.id);
                    }
                  }}
                  id={`btn_delete_teacher_${t.id}`}
                  className="p-2 text-slate-500 dark:text-zinc-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition cursor-pointer"
                  title="លុបឈ្មោះ"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* CRUD Edit/Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-[32px] w-full max-w-xl overflow-hidden shadow-2xl animate-[slideDown_0.25s_ease-out]">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-800 px-6 py-4.5 bg-slate-50 dark:bg-zinc-800/20 font-sans">
              <h3 className="font-bold text-slate-800 dark:text-neutral-100 text-base leading-relaxed flex items-center gap-2">
                <User className="w-5 h-5 text-indigo-600" />
                {editingTeacher ? 'កែសម្រួលព័ត៌មានគ្រូ' : 'ចុះឈ្មោះលោកគ្រូ-អ្នកគ្រូថ្មី'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 dark:text-zinc-500 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              
              {formError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-950 text-red-600 dark:text-red-400 rounded-xl text-xs flex gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* ID Input */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 dark:text-zinc-500">អត្តសញ្ញាណប័ណ្ណ (ID) *</label>
                  <input
                    type="text"
                    value={formId}
                    onChange={(e) => setFormId(e.target.value)}
                    disabled={!!editingTeacher}
                    id="form_input_id"
                    placeholder="ឧ. KPL-001"
                    className="w-full bg-slate-50 dark:bg-zinc-800 disabled:bg-slate-100 dark:disabled:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-xs font-semibold uppercase text-slate-800 dark:text-zinc-200 focus:outline-none focus:border-indigo-500 font-mono"
                    required
                  />
                </div>

                {/* Name Input */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 dark:text-zinc-500">ឈ្មោះពេញ (Khmer) *</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    id="form_input_name"
                    placeholder="ឈ្មោះរបស់លោកគ្រូ-អ្នកគ្រូ"
                    className="w-full bg-slate-50 dark:bg-zinc-850 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 dark:text-zinc-200 focus:outline-none focus:border-indigo-500 font-sans"
                    required
                  />
                </div>

                {/* Gender Select */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 dark:text-zinc-500">ភេទ *</label>
                  <select
                    value={formGender}
                    onChange={(e) => setFormGender(e.target.value as Gender)}
                    id="form_select_gender"
                    className="w-full bg-slate-50 dark:bg-zinc-850 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-slate-750 dark:text-zinc-300 font-sans focus:outline-none form-select"
                  >
                    <option value="ប្រុស">ប្រុស</option>
                    <option value="ស្រី">ស្រី</option>
                  </select>
                </div>

                {/* Date of Birth Picker */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 dark:text-zinc-500">ថ្ងៃខែឆ្នាំកំណើត</label>
                  <input
                    type="date"
                    value={formDob}
                    onChange={(e) => setFormDob(e.target.value)}
                    id="form_input_dob"
                    className="w-full bg-slate-50 dark:bg-zinc-850 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-slate-750 dark:text-zinc-300 font-sans focus:outline-none"
                  />
                </div>

                {/* Phone number */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 dark:text-zinc-500">លេខទូរស័ព្ទ *</label>
                  <input
                    type="tel"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    id="form_input_phone"
                    placeholder="ឧ. 0884640290"
                    className="w-full bg-slate-50 dark:bg-zinc-850 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-slate-850 dark:text-zinc-200 focus:outline-none focus:border-indigo-500 font-mono"
                    required
                  />
                </div>

                {/* Grade Section Selection */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 dark:text-zinc-500">ថ្នាក់បង្រៀន *</label>
                    <select
                      value={formGrade}
                      onChange={(e) => setFormGrade(e.target.value)}
                      id="form_select_grade"
                      className="w-full bg-slate-50 dark:bg-zinc-850 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-slate-750 dark:text-zinc-300 font-sans focus:outline-none"
                    >
                      {GRADELIST.map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 dark:text-zinc-500">បន្ទប់ថ្នាក់ (ក/ខ) *</label>
                    <select
                      value={formSection}
                      onChange={(e) => setFormSection(e.target.value as GradeSection)}
                      id="form_select_section"
                      className="w-full bg-slate-50 dark:bg-zinc-850 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-slate-750 dark:text-zinc-300 font-sans focus:outline-none"
                    >
                      <option value="ក">ក</option>
                      <option value="ខ">ខ</option>
                    </select>
                  </div>
                </div>

                {/* Shift Selector */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 dark:text-zinc-500">វេនសិក្សា *</label>
                  <select
                    value={formShift}
                    onChange={(e) => setFormShift(e.target.value as Shift)}
                    id="form_select_shift"
                    className="w-full bg-slate-50 dark:bg-zinc-850 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-slate-750 dark:text-zinc-300 font-sans focus:outline-none"
                  >
                    <option value="ពេលព្រឹក">ពេលព្រឹក</option>
                    <option value="ពេលរសៀល">ពេលរសៀល</option>
                  </select>
                </div>

                {/* Photo local upload */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 dark:text-zinc-500">រូបថតគ្រូ (អាចមានឬអត់)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    id="form_upload_photo"
                    className="w-full text-xs text-slate-500 dark:text-zinc-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-[10px] file:font-semibold file:bg-slate-100 dark:file:bg-zinc-800 file:text-indigo-700 dark:file:text-indigo-400 hover:file:bg-slate-200 dark:hover:file:bg-zinc-700 cursor-pointer text-sans"
                  />
                </div>

              </div>

              {/* Photo preview container */}
              {formPhoto && (
                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-zinc-800/30 rounded-2xl border border-slate-200 dark:border-zinc-800 w-fit">
                  <img src={formPhoto} alt="Review" className="h-14 w-14 object-cover rounded-xl border border-slate-250" referrerPolicy="no-referrer" />
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-indigo-650">រូបថតភ្ជាប់ជោគជ័យ</span>
                    <button
                      type="button"
                      onClick={() => setFormPhoto('')}
                      id="form_clear_photo"
                      className="text-[10px] text-red-500 font-bold hover:underline block cursor-pointer"
                    >
                      លុបរូបភាពចេញ
                    </button>
                  </div>
                </div>
              )}

              {/* Footer CTA */}
              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-zinc-800 font-sans">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  id="form_btn_close"
                  className="px-4 py-2 border border-slate-200 dark:border-zinc-800 text-slate-550 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-850 rounded-xl font-bold text-xs cursor-pointer"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  id="form_btn_submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 hover:scale-[1.01] active:scale-[0.99] text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-900/15 cursor-pointer font-sans"
                >
                  {editingTeacher ? 'រក្សាទុកការកែប្រែ' : 'យល់ព្រមចុះឈ្មោះ'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* CSV Bulk Importer Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-[32px] w-full max-w-2xl overflow-hidden shadow-2xl animate-[slideDown_0.25s_ease-out] font-sans">
            
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-800 px-6 py-4.5 bg-slate-50 dark:bg-zinc-800/20 animate-fade-in">
              <h3 className="font-bold text-slate-800 dark:text-neutral-100 text-base leading-relaxed flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
                នាំចូលឈ្មោះគ្រូបង្គោលជាក្រុម (Excel/CSV Bulk Importer)
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportedPreview([]);
                  setImportFileName('');
                }}
                className="p-1.5 text-slate-400 dark:text-zinc-500 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              
              {/* Instructions and templates */}
              <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/10 border border-indigo-100/50 dark:border-indigo-900/20 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs">
                <div className="space-y-1">
                  <h4 className="font-bold text-indigo-800 dark:text-indigo-400">ទាញយកគំរូទម្រង់ Excel (Template CSV)</h4>
                  <p className="text-slate-500 dark:text-zinc-400 max-w-md leading-relaxed">
                    គំរូត្រូវមានចំណងជើងជួរឈរខ្ទង់: <code className="font-mono bg-white dark:bg-zinc-900 px-1 py-0.5 rounded border">id, Name, Gender, DOB, Phone Number, Grade, Section, Shift</code> ដើម្បីធានាការតម្រង់ទិន្នន័យបានត្រឹមត្រូវ។
                  </p>
                </div>
                <button
                  type="button"
                  onClick={downloadTemplate}
                  id="csv_download_template"
                  className="px-4 py-2 bg-indigo-100 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-200/80 rounded-xl font-bold inline-flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Download className="w-4 h-4" /> ទាញយកគំរូស្ដង់ដា
                </button>
              </div>

              {/* Upload Dropzone */}
              <div className="border-2 border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl p-8 hover:border-indigo-500/50 dark:hover:border-zinc-700 transition relative flex flex-col items-center justify-center text-center gap-3">
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleCsvFile}
                  id="csv_upload_input"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="h-12 w-12 bg-slate-50 dark:bg-zinc-800 rounded-full flex items-center justify-center text-indigo-500">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-800 dark:text-zinc-200">
                    {importFileName ? `ឯកសារជ្រើសរើស: ${importFileName}` : 'អូសទម្លាក់ ឬ ចុចទីនេះដើម្បីបញ្ចូលឯកសារ Excel (.csv)'}
                  </h4>
                  <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1">គាំទ្រតែប្រភេទឯកសារ UTF-8 CSV ប៉ុណ្ណោះ</p>
                </div>
              </div>

              {/* Preview Grid */}
              {importedPreview.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-800 dark:text-neutral-200 text-xs flex items-center gap-1.5">
                    <Heart className="w-4 h-4 text-indigo-500" /> ទិដ្ឋភាពទូទៅទិន្នន័យត្រៀមនាំចូល (រកឃើញ {khmerNumber(importedPreview.length)} នាក់)
                  </h4>
                  
                  <div className="max-h-56 overflow-y-auto border border-slate-200 dark:border-zinc-800 rounded-2xl">
                    <table className="w-full border-collapse text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-zinc-800/50 text-[10px] font-bold text-slate-400 uppercase border-b border-slate-200 dark:border-zinc-800">
                        <tr>
                          <th className="px-4 py-2.5 font-sans">ID</th>
                          <th className="px-4 py-2.5">ឈ្មោះគ្រូ</th>
                          <th className="px-4 py-2.5">ភេទ</th>
                          <th className="px-4 py-2.5">លេខទូរស័ព្ទ</th>
                          <th className="px-4 py-2.5">ថ្នាក់</th>
                          <th className="px-4 py-2.5">វេន</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80 text-slate-650 dark:text-zinc-400">
                        {importedPreview.map((pt, index) => (
                          <tr key={index} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/20">
                            <td className="px-4 py-2 font-mono font-bold text-slate-800 dark:text-zinc-300">{pt.id}</td>
                            <td className="px-4 py-2 font-bold">{pt.name}</td>
                            <td className="px-4 py-2">{pt.gender}</td>
                            <td className="px-4 py-2 font-mono">{pt.phone}</td>
                            <td className="px-4 py-2">{pt.grade}({pt.section})</td>
                            <td className="px-4 py-2">{pt.shift}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Footer CTA */}
              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsImportModalOpen(false);
                    setImportedPreview([]);
                    setImportFileName('');
                  }}
                  id="csv_modal_cancel"
                  className="px-4 py-2 border border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-xl font-bold text-xs cursor-pointer"
                >
                  បោះបង់
                </button>
                <button
                  type="button"
                  onClick={handleConfirmBulkImport}
                  disabled={importedPreview.length === 0}
                  id="csv_modal_confirm"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white rounded-xl font-bold text-xs shadow-md cursor-pointer select-none"
                >
                  នាំចូលព័ត៌មាន ({khmerNumber(importedPreview.length)} នាក់)
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
