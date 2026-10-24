import React, { useState } from 'react';
import { Project } from '../../types/project';
import { 
  PackageCheck, 
  Archive, 
  FileText, 
  FileSpreadsheet, 
  FileCode, 
  Headphones, 
  Download, 
  CheckCircle2, 
  Sparkles, 
  Film, 
  BookOpen 
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
} from '../../utils/exporters';

interface ExportStageProps {
  project: Project;
}

export const ExportStage: React.FC<ExportStageProps> = ({ project }) => {
  const [isZipping, setIsZipping] = useState(false);

  const approvedClaimsCount = project.research.claims.filter(c => c.status === 'approved').length;
  const scriptWords = project.script.sections.reduce((acc, s) => acc + s.wordCount, 0);

  const handleExportZip = async () => {
    setIsZipping(true);
    try {
      await downloadProjectZip(project);
    } catch (e) {
      console.error(e);
      alert('حدث خطأ أثناء حزم المشروع');
    } finally {
      setIsZipping(false);
    }
  };

  const exportFiles = [
    {
      title: 'تقرير البحث والأدلة المعتمدة',
      filename: `01_research_claims_${project.id}.md`,
      desc: 'تقرير أكاديمي وموثق يضم الادعاءات والمصادر والناشرين وتدقيق الثقة.',
      icon: FileText,
      color: 'text-amber-400',
      action: () => downloadBlob(generateResearchMarkdown(project), `01_research_claims_${project.id}.md`),
    },
    {
      title: 'جدول المصادر والمراجع الموثقة',
      filename: `02_citations_${project.id}.csv`,
      desc: 'جدول بيانات CSV متوافق مع Excel و Google Sheets لتحليل المراجع.',
      icon: FileSpreadsheet,
      color: 'text-emerald-400',
      action: () => downloadBlob(generateCitationsCSV(project.research.claims), `02_citations_${project.id}.csv`, 'text/csv;charset=utf-8'),
    },
    {
      title: 'مسودة السيناريو الفصيح الكاملة',
      filename: `03_script_draft_${project.id}.md`,
      desc: 'النص المكتوب باللغة العربية الفصحى مقسماً لأقسام ومحاور ومربوطاً بالأدلة.',
      icon: FileText,
      color: 'text-blue-400',
      action: () => downloadBlob(generateScriptMarkdown(project), `03_script_draft_${project.id}.md`),
    },
    {
      title: 'خطة المشاهد وإشارات الصور',
      filename: `04_scenes_plan_${project.id}.json`,
      desc: 'جدول المشاهد والتوقيتات الزمنيّة وإشارات التوليد البصري (Prompts).',
      icon: FileCode,
      color: 'text-purple-400',
      action: () => downloadBlob(generateScenesJSON(project.scenes), `04_scenes_plan_${project.id}.json`, 'application/json'),
    },
    {
      title: 'نص التعليق الصوتي الخالي',
      filename: `05_narration_${project.id}.txt`,
      desc: 'نص UTF-8 مجهز ومصفي للإلقاء الصوتي المباشر أمام المايكروفون.',
      icon: Headphones,
      color: 'text-pink-400',
      action: () => downloadBlob(generateNarrationText(project.script.sections), `05_narration_${project.id}.txt`),
    },
    {
      title: 'نص التوليد الصوتي المتقدم SSML',
      filename: `06_narration_${project.id}.ssml`,
      desc: 'ملف SSML مهيأ للوقفات والنطق في محركات Piper و Edge-TTS.',
      icon: Headphones,
      color: 'text-pink-300',
      action: () => downloadBlob(generateNarrationSSML(project), `06_narration_${project.id}.ssml`, 'application/ssml+xml'),
    },
    {
      title: 'ملف الترجمة النصية لليوتيوب SRT',
      filename: `07_subtitles_${project.id}.srt`,
      desc: 'ملف Subtitles متناسق زمنياً للرفع المباشر على قناتك في يوتيوب.',
      icon: FileText,
      color: 'text-sky-400',
      action: () => downloadBlob(generateSubtitlesSRT(project.scenes), `07_subtitles_${project.id}.srt`),
    },
    {
      title: 'بيان المونتاج الموحد (Video Manifest)',
      filename: `08_video_manifest_${project.id}.json`,
      desc: 'البيان التجميعي المحكم المستهلك في Shotcut, Premiere, Remotion.',
      icon: FileCode,
      color: 'text-yellow-400',
      action: () => downloadBlob(generateVideoManifest(project), `08_video_manifest_${project.id}.json`, 'application/json'),
    },
  ];

  return (
    <div className="space-y-8">
      
      {/* ZIP Hero Download Section */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950/30 to-slate-900 border border-emerald-500/30 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
            <PackageCheck className="w-5 h-5" />
            <span>حزمة التصدير الشاملة المكتملة</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-100">
            تصدير جميع مخرجات مشروع "{project.title}"
          </h2>
          <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
            تضم حزمة الـ ZIP المكتملة كافة التقارير والسيناريوهات والبيانات النصية والصوتية وملفات الترجمة المجهزة للاستخدام المباشر.
          </p>
        </div>

        <button
          onClick={handleExportZip}
          disabled={isZipping}
          className="flex items-center gap-2.5 px-6 py-3.5 text-xs font-extrabold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl shadow-xl shadow-emerald-500/10 transition-all shrink-0"
        >
          <Archive className={`w-5 h-5 ${isZipping ? 'animate-bounce' : ''}`} />
          <span>{isZipping ? 'جاري تجميع الملفات...' : 'تحميل حزمة المشروع المكتملة (ZIP)'}</span>
        </button>
      </div>

      {/* Project Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[11px] text-slate-400 block">الأدلة المعتمدة</span>
          <span className="text-xl font-bold text-amber-400 tabular-nums">{approvedClaimsCount} ادعاء</span>
        </div>

        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[11px] text-slate-400 block">إجمالي كلمات السيناريو</span>
          <span className="text-xl font-bold text-slate-100 tabular-nums">{scriptWords} كلمة</span>
        </div>

        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[11px] text-slate-400 block">عدد المشاهد والتوقيتات</span>
          <span className="text-xl font-bold text-purple-400 tabular-nums">{project.scenes.length} مشهد</span>
        </div>

        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[11px] text-slate-400 block">المدة المقدرة</span>
          <span className="text-xl font-bold text-emerald-400 tabular-nums">{project.durationMinutes} دقيقة</span>
        </div>
      </div>

      {/* Individual Export Items Grid */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-100">تنزيل الملفات والمستندات بصفة منفردة</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {exportFiles.map((file, idx) => {
            const Icon = file.icon;

            return (
              <div
                key={idx}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-5 rounded-2xl flex items-start justify-between gap-4 transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2.5 rounded-xl bg-slate-950 border border-slate-800 ${file.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-100">{file.title}</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed max-w-sm">{file.desc}</p>
                    <span className="font-mono text-[10px] text-slate-500 block dir-ltr text-right">{file.filename}</span>
                  </div>
                </div>

                <button
                  onClick={file.action}
                  className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-200 transition-colors shrink-0"
                  title="تنزيل الملف"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
