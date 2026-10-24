import React, { useState } from 'react';
import { Project } from '../types/project';
import { STAGES_LIST } from './StageNavigation';
import { 
  Plus, 
  Folder, 
  Clock, 
  Film, 
  Sparkles, 
  Trash2, 
  Copy, 
  Download, 
  Search,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { downloadProjectZip } from '../utils/exporters';

interface ProjectDashboardProps {
  projects: Project[];
  activeProjectId: string;
  onSelectProject: (projectId: string) => void;
  onCreateNewProject: () => void;
  onDeleteProject: (projectId: string) => void;
  onDuplicateProject: (project: Project) => void;
}

export const ProjectDashboard: React.FC<ProjectDashboardProps> = ({
  projects,
  activeProjectId,
  onSelectProject,
  onCreateNewProject,
  onDeleteProject,
  onDuplicateProject,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProjects = projects.filter(p =>
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.topic.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 p-6 sm:p-8 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
            <Sparkles className="w-4 h-4" />
            <span>منصة إنتاج المرئيات والوثائقيات باللغة العربية</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100">
            مساحة إنتاج وثائقيات اليوتيوب (10 - 15 دقيقة)
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
            بيئة عمل نمطية متكاملة تبدأ من البحث العلمي المدعوم بالربط المباشر بالمصادر الموثوقة، صياغة السيناريو الفصيح، التخطيط البصري للمشاهد، التعليق الصوتي المحلي، وحتى تصدير بيان المونتاج الشامل.
          </p>
        </div>

        <button
          onClick={onCreateNewProject}
          className="flex items-center gap-2 px-5 py-3 text-sm font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl shadow-lg shadow-amber-500/10 transition-all shrink-0"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
          <span>إنشاء مشروع وثائقي جديد</span>
        </button>
      </div>

      {/* Projects List Controls & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-slate-100">المشاريع الحالية</h2>
          <span className="text-xs text-slate-400 bg-slate-800 px-2.5 py-1 rounded-full tabular-nums">
            {projects.length} مشروع
          </span>
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="بحث في المشاريع..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-9 pl-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
          />
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((proj) => {
          const isActive = proj.id === activeProjectId;
          const approvedCount = proj.research.claims.filter(c => c.status === 'approved').length;

          return (
            <div
              key={proj.id}
              className={`bg-slate-900 rounded-2xl border transition-all flex flex-col justify-between p-5 space-y-4 relative ${
                isActive
                  ? 'border-amber-500/50 shadow-xl shadow-amber-500/5'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Card Header */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span className="tabular-nums">
                      {new Date(proj.updatedAt).toLocaleDateString('ar-EG', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>

                  <span className="text-xs text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 tabular-nums">
                    {proj.durationMinutes} دقيقة
                  </span>
                </div>

                <h3 
                  onClick={() => onSelectProject(proj.id)}
                  className="text-base font-bold text-slate-100 hover:text-amber-400 transition-colors cursor-pointer line-clamp-2 leading-snug"
                >
                  {proj.title}
                </h3>

                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {proj.topic}
                </p>
              </div>

              {/* Stage Progress Overview */}
              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>تقدم المراحل الست</span>
                  <span className="text-emerald-400 font-bold tabular-nums">
                    {approvedCount} أدلة معتمدة
                  </span>
                </div>

                <div className="grid grid-cols-6 gap-1">
                  {STAGES_LIST.map((stage) => {
                    const prog = proj.stageProgress[stage.id] || 0;
                    const isDone = prog >= 100;
                    return (
                      <div
                        key={stage.id}
                        title={`${stage.title}: ${prog}%`}
                        className={`h-1.5 rounded-full transition-all ${
                          isDone
                            ? 'bg-emerald-500'
                            : prog > 0
                            ? 'bg-amber-500'
                            : 'bg-slate-800'
                        }`}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="flex items-center justify-between gap-2 pt-2">
                <button
                  onClick={() => onSelectProject(proj.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl transition-colors"
                >
                  <span>فتح بيئة العمل</span>
                  <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => downloadProjectZip(proj)}
                    title="تصدير حزمة ZIP"
                    className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onDuplicateProject(proj)}
                    title="نسخ المشروع"
                    className="p-2 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>

                  {projects.length > 1 && (
                    <button
                      onClick={() => {
                        if (confirm(`هل أنت تأكد من حذف مشروع "${proj.title}"؟`)) {
                          onDeleteProject(proj.id);
                        }
                      }}
                      title="حذف المشروع"
                      className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
