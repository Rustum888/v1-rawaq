import React, { useState } from 'react';
import { Project, ProjectStage } from '../types/project';
import { 
  Film, 
  Download, 
  FolderOpen, 
  Plus, 
  FileText, 
  FileSpreadsheet, 
  FileCode, 
  Headphones, 
  HelpCircle,
  Archive,
  ChevronDown,
  Cpu
} from 'lucide-react';
import { 
  generateResearchMarkdown, 
  generateCitationsCSV, 
  generateScriptMarkdown, 
  generateScenesJSON, 
  generateNarrationText, 
  generateNarrationSSML, 
  generateSubtitlesSRT, 
  generateVideoManifest, 
  downloadBlob, 
  downloadProjectZip 
} from '../utils/exporters';

interface HeaderProps {
  project: Project;
  onOpenDashboard: () => void;
  onOpenNewProject: () => void;
  onOpenReadme: () => void;
  onOpenOllamaSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  project,
  onOpenDashboard,
  onOpenNewProject,
  onOpenReadme,
  onOpenOllamaSettings,
}) => {
  const [exportOpen, setExportOpen] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  const handleExportZip = async () => {
    setIsZipping(true);
    try {
      await downloadProjectZip(project);
    } catch (e) {
      console.error(e);
      alert('حدث خطأ أثناء حزم المشروع');
    } finally {
      setIsZipping(false);
      setExportOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Brand & Active Project Title */}
        <div className="flex items-center gap-4 shrink-0">
          <button 
            onClick={onOpenDashboard}
            className="flex items-center gap-2.5 text-right hover:opacity-90 transition-opacity focus:outline-none"
            title="العودة إلى لوحة المشاريع"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-amber-500/10">
              <Film className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-slate-100">رِواق</span>
                <span className="text-xs text-amber-400 font-medium bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  صانع وثائقيات
                </span>
              </div>
            </div>
          </button>

          <div className="hidden md:block h-6 w-px bg-slate-800" />

          {/* Current Project Name */}
          <button 
            onClick={onOpenDashboard}
            className="hidden md:flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors max-w-xs truncate"
          >
            <FolderOpen className="w-4 h-4 text-slate-500 shrink-0" />
            <span className="truncate">{project.title}</span>
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          
          {/* Ollama Settings button */}
          <button
            onClick={onOpenOllamaSettings}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
              project.ollama?.enabled
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                : 'bg-slate-800 text-slate-300 hover:text-white border-slate-700'
            }`}
            title="إعدادات نموذج Ollama المحلي (qwen3.5:4b)"
          >
            <Cpu className={`w-4 h-4 ${project.ollama?.enabled ? 'text-purple-400' : 'text-slate-400'}`} />
            <span className="hidden sm:inline">Ollama ({project.ollama?.model || 'qwen3.5:4b'})</span>
          </button>

          {/* Readme & Architecture button */}
          <button
            onClick={onOpenReadme}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-lg border border-slate-700/60 transition-colors"
            title="دليل المعمارية والربط الصوتي"
          >
            <HelpCircle className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">دليل التشغيل والمعمارية</span>
          </button>

          {/* New Project button */}
          <button
            onClick={onOpenNewProject}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-lg shadow-md transition-colors"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">مشروع جديد</span>
          </button>

          {/* Export Menu Dropdown */}
          <div className="relative">
            <button
              onClick={() => setExportOpen(!exportOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-100 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>تصدير</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {exportOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setExportOpen(false)} 
                />
                <div className="absolute left-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 py-2 text-right">
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 border-b border-slate-800">
                    خيارات تصدير أجزاء المشروع
                  </div>

                  <button
                    onClick={() => {
                      downloadBlob(generateResearchMarkdown(project), `research_${project.id}.md`);
                      setExportOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 hover:text-white transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-amber-400" />
                      تقرير البحث (Markdown)
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      downloadBlob(generateCitationsCSV(project.research.claims), `citations_${project.id}.csv`, 'text/csv;charset=utf-8');
                      setExportOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 hover:text-white transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                      جدول المصادر (CSV)
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      downloadBlob(generateScriptMarkdown(project), `script_${project.id}.md`);
                      setExportOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 hover:text-white transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-400" />
                      مسودة السيناريو (Markdown)
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      downloadBlob(generateScenesJSON(project.scenes), `scenes_${project.id}.json`, 'application/json');
                      setExportOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 hover:text-white transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <FileCode className="w-4 h-4 text-purple-400" />
                      خطة المشاهد (JSON)
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      downloadBlob(generateNarrationSSML(project), `narration_${project.id}.ssml`, 'application/ssml+xml');
                      setExportOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 hover:text-white transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Headphones className="w-4 h-4 text-pink-400" />
                      نص التعليق الصوتي (SSML)
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      downloadBlob(generateSubtitlesSRT(project.scenes), `subtitles_${project.id}.srt`);
                      setExportOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 hover:text-white transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-sky-400" />
                      ملف الترجمة (SRT)
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      downloadBlob(generateVideoManifest(project), `video_manifest_${project.id}.json`, 'application/json');
                      setExportOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 hover:text-white transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <FileCode className="w-4 h-4 text-yellow-400" />
                      بيان المونتاج (Video Manifest)
                    </span>
                  </button>

                  <div className="my-1 border-t border-slate-800" />

                  <button
                    onClick={handleExportZip}
                    disabled={isZipping}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Archive className="w-4 h-4 text-emerald-400" />
                      {isZipping ? 'جاري إنشاء الحزمة...' : 'تصدير حزمة المشروع الكاملة (ZIP)'}
                    </span>
                  </button>

                </div>
              </>
            )}
          </div>

        </div>

      </div>
    </header>
  );
};
