import React from 'react';
import { ProjectStage } from '../types/project';
import { Search, FileText, Clapperboard, Mic, Film, PackageCheck, CheckCircle2 } from 'lucide-react';

interface StageNavigationProps {
  currentStage: ProjectStage;
  onSelectStage: (stage: ProjectStage) => void;
  stageProgress: Record<ProjectStage, number>;
}

export const STAGES_LIST: Array<{
  id: ProjectStage;
  title: string;
  subtitle: string;
  icon: React.ElementType;
}> = [
  { id: 1, title: 'البحث والموثوقية', subtitle: 'استخراج وتوثيق الأدلة', icon: Search },
  { id: 2, title: 'السيناريو', subtitle: 'صياغة النص الفصيح', icon: FileText },
  { id: 3, title: 'المشاهد والصور', subtitle: 'إشارات البصريات والتوقيت', icon: Clapperboard },
  { id: 4, title: 'التعليق الصوتي', subtitle: 'النطق المحلي والتفريغ', icon: Mic },
  { id: 5, title: 'تجميع الفيديو', subtitle: 'الخط الزمني والوسائط', icon: Film },
  { id: 6, title: 'تصدير المشروع', subtitle: 'الحزمة الشاملة والبيانات', icon: PackageCheck },
];

export const StageNavigation: React.FC<StageNavigationProps> = ({
  currentStage,
  onSelectStage,
  stageProgress,
}) => {
  return (
    <div className="bg-slate-900/60 border-b border-slate-800 py-3 px-4 sm:px-6 overflow-x-auto scrollbar-none">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 min-w-[720px]">
        {STAGES_LIST.map((stage, idx) => {
          const Icon = stage.icon;
          const isActive = currentStage === stage.id;
          const progress = stageProgress[stage.id] || 0;
          const isComplete = progress >= 100;

          return (
            <button
              key={stage.id}
              onClick={() => onSelectStage(stage.id)}
              className={`flex-1 flex flex-col items-start p-2.5 rounded-xl transition-all relative border text-right focus:outline-none ${
                isActive
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-200 shadow-lg shadow-amber-500/5'
                  : 'bg-slate-800/40 hover:bg-slate-800/80 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {/* Top row: Number badge + Icon + Status */}
              <div className="flex items-center justify-between w-full mb-1">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold tabular-nums ${
                      isActive
                        ? 'bg-amber-500 text-slate-950'
                        : isComplete
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {stage.id}
                  </span>
                  <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                </div>

                {isComplete && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                )}
              </div>

              {/* Title & Subtitle */}
              <div className="text-xs font-bold text-slate-100 truncate w-full">
                {stage.title}
              </div>
              <div className="text-[10px] text-slate-400 truncate w-full mt-0.5">
                {stage.subtitle}
              </div>

              {/* Mini progress bar */}
              <div className="w-full h-1 bg-slate-800 rounded-full mt-2 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    isComplete ? 'bg-emerald-500' : isActive ? 'bg-amber-500' : 'bg-slate-600'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
