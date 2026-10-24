import React, { useState } from 'react';
import { Project, ScriptSection, ResearchClaim } from '../../types/project';
import { 
  FileText, 
  Lock, 
  Unlock, 
  Plus, 
  Trash2, 
  AlertCircle, 
  Edit3, 
  Save, 
  BookMarked,
  Cpu
} from 'lucide-react';

import { downloadBlob, generateScriptMarkdown } from '../../utils/exporters';

/**
 * Helper function that strictly filters research claims to only include those marked 'approved'.
 */
export function getApprovedResearchClaims(claims?: ResearchClaim[]): ResearchClaim[] {
  if (!Array.isArray(claims)) return [];
  return claims.filter((claim): claim is ResearchClaim => claim.status === 'approved');
}

interface ScriptStageProps {
  project: Project;
  onUpdateProject: (updated: Project) => void;
}

export const ScriptStage: React.FC<ScriptStageProps> = ({
  project,
  onUpdateProject,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editContentText, setEditContentText] = useState('');

  const approvedClaims = getApprovedResearchClaims(project.research?.claims);
  const sections = project.script.sections || [];

  // Live word count calculation
  const totalWords = sections.reduce((acc, s) => acc + (s.wordCount || countArabicWords(s.content)), 0);
  const targetWords = project.durationMinutes * 130;
  const estimatedTotalMinutes = Math.round((totalWords / 130) * 10) / 10;

  const ollamaModel = project.ollama?.model || 'qwen3.5:4b';
  const ollamaBaseUrl = project.ollama?.baseUrl || 'http://localhost:11434';

  // Generate Script ONLY via Local Ollama API (qwen3.5:4b)
  const handleGenerateScriptWithOllama = async () => {
    // Strictly filter claims with status === 'approved' using helper function
    const validApprovedClaims = getApprovedResearchClaims(project.research?.claims);

    if (validApprovedClaims.length === 0) {
      setError('لا توجد أدلة معتمدة في مرحلة البحث! يرجى الانتقال إلى مرحلة "البحث والموثوقية" واعتمد بعض الأدلة والمصادر قبل صياغة السيناريو عبر Ollama.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/projects/script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: project.title,
          topic: project.topic,
          durationMinutes: project.durationMinutes,
          tone: project.tone,
          approvedClaims: validApprovedClaims, // ONLY approved research claims included in payload
          provider: 'ollama',
          selectedModel: ollamaModel,
          model: ollamaModel, // Exclusively qwen3.5:4b or configured Ollama model
          baseUrl: ollamaBaseUrl,
          systemPrompt: project.ollama?.systemPrompt,
          temperature: project.ollama?.temperature ?? 0.3,
          existingSections: sections, // preserve locked sections
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'تعذر الحصول على استجابة من نموذج Ollama المحلي.');
      }

      const generatedSections: ScriptSection[] = (json.data.sections || []).map((sec: any) => ({
        ...sec,
        wordCount: countArabicWords(sec.content),
        estimatedDurationSeconds: Math.round((countArabicWords(sec.content) / 130) * 60),
      }));

      const updatedProject: Project = {
        ...project,
        updatedAt: new Date().toISOString(),
        script: {
          ...project.script,
          targetWordCount: targetWords,
          sections: generatedSections,
          isGenerated: true,
          provider: 'ollama',
          model: json.data.model || ollamaModel,
          lastGeneratedAt: new Date().toISOString(),
        },
      };

      onUpdateProject(updatedProject);
    } catch (err: any) {
      console.error('Ollama Script Generation Failure:', err);
      let errorText = err.message || 'حدث خطأ في الاتصال بخادم Ollama المحلي.';
      if (err.name === 'TypeError' || errorText.includes('Failed to fetch')) {
        errorText = `تعذر الاتصال بـ Ollama على ${ollamaBaseUrl}. يرجى التأكد من تشغيل الخادم عبر 'ollama serve' وسحب النموذج بـ 'ollama pull ${ollamaModel}'.`;
      }
      setError(errorText);
    } finally {
      setLoading(false);
    }
  };

  // Toggle Lock
  const handleToggleLock = (sectionId: string) => {
    const updatedSections = sections.map(s => (s.id === sectionId ? { ...s, isLocked: !s.isLocked } : s));
    onUpdateProject({
      ...project,
      updatedAt: new Date().toISOString(),
      script: { ...project.script, sections: updatedSections },
    });
  };

  // Edit section text
  const handleStartEdit = (sec: ScriptSection) => {
    setEditingSectionId(sec.id);
    setEditContentText(sec.content);
  };

  const handleSaveEdit = (sectionId: string) => {
    const updatedSections = sections.map(s => {
      if (s.id === sectionId) {
        const wc = countArabicWords(editContentText);
        return {
          ...s,
          content: editContentText,
          wordCount: wc,
          estimatedDurationSeconds: Math.round((wc / 130) * 60),
        };
      }
      return s;
    });

    onUpdateProject({
      ...project,
      updatedAt: new Date().toISOString(),
      script: { ...project.script, sections: updatedSections },
    });

    setEditingSectionId(null);
  };

  // Delete section
  const handleDeleteSection = (sectionId: string) => {
    const updatedSections = sections.filter(s => s.id !== sectionId);
    onUpdateProject({
      ...project,
      updatedAt: new Date().toISOString(),
      script: { ...project.script, sections: updatedSections },
    });
  };

  // Add blank section
  const handleAddBlankSection = () => {
    const newSec: ScriptSection = {
      id: `sec-${Date.now()}`,
      title: 'قسم سيناريو يدوي',
      type: 'body',
      content: 'اكتب نص القراءة للإلقاء الصوتي هنا...',
      linkedClaimIds: approvedClaims.length > 0 ? [approvedClaims[0].id] : [],
      isLocked: false,
      wordCount: 7,
      estimatedDurationSeconds: 3,
    };

    onUpdateProject({
      ...project,
      updatedAt: new Date().toISOString(),
      script: { ...project.script, sections: [...sections, newSec] },
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Control Header & Word Counter */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-lg">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-400" />
              <h2 className="text-base font-bold text-slate-100">صياغة السيناريو الفصيح عبر نموذج Ollama المحلي حصراً</h2>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 mr-2">
                مرحلة مستقلة
              </span>
            </div>
            <p className="text-xs text-slate-400">
              يصاغ السيناريو حصرياً بوساطة النموذج المحلي <strong className="text-purple-400">{ollamaModel}</strong> بناءً على <strong className="text-amber-400">{approvedClaims.length} أدلة معتمدة</strong> من مرحلة البحث.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 w-full md:w-auto">
            {sections.length > 0 && (
              <button
                onClick={() => downloadBlob(generateScriptMarkdown(project), `script_${project.id}.md`, 'text/markdown;charset=utf-8')}
                className="px-3 py-2.5 text-xs font-semibold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 rounded-xl border border-amber-500/30 transition-colors"
              >
                <span>تصدير السيناريو (Markdown)</span>
              </button>
            )}

            <button
              onClick={handleAddBlankSection}
              className="px-3.5 py-2.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-colors flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة قسم يدوي</span>
            </button>

            <button
              onClick={handleGenerateScriptWithOllama}
              disabled={loading || approvedClaims.length === 0}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold text-purple-950 bg-purple-400 hover:bg-purple-300 disabled:bg-slate-700 disabled:text-slate-500 rounded-xl shadow-lg shadow-purple-500/10 transition-all"
            >
              <Cpu className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'جاري الصياغة بـ Ollama...' : `صياغة السيناريو عبر Ollama (${ollamaModel})`}</span>
            </button>
          </div>
        </div>

        {/* Live Word Count & Provider Status Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-800">
          
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 block">إجمالي كلمات السيناريو</span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-slate-100 tabular-nums">{totalWords}</span>
              <span className="text-xs text-slate-500 tabular-nums">/ المستهدف {targetWords} كلمة</span>
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 block">المدة الزمنية التقديرية</span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-amber-400 tabular-nums">{estimatedTotalMinutes} دقيقة</span>
              <span className="text-xs text-slate-500 tabular-nums">(المخطط: {project.durationMinutes} دقيقة)</span>
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 block">مزود الصياغة المعتمد</span>
            <div className="flex items-baseline gap-2">
              <span className="text-xs font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20 font-mono">
                Ollama: {project.script.model || ollamaModel}
              </span>
            </div>
          </div>

        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300">
          {error}
        </div>
      )}

      {/* Warning if no claims approved */}
      {approvedClaims.length === 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4 flex items-center gap-3 text-xs text-yellow-200">
          <AlertCircle className="w-5 h-5 text-yellow-400 shrink-0" />
          <p>
            تنبيه: لا يوجد أي دليل معتمد في مرحلة البحث. انتقل إلى مرحلة "البحث والموثوقية" واعتمد بعض الأدلة التاريخية لتشغيل التوليد عبر Ollama.
          </p>
        </div>
      )}

      {/* Script Sections Render */}
      <div className="space-y-4">
        {sections.length === 0 ? (
          <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
            <FileText className="w-8 h-8 text-slate-600 mx-auto" />
            <h3 className="text-sm font-bold text-slate-300">لم يتم إنشاء أقسام السيناريو بعد</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              اضغط على "صياغة السيناريو عبر Ollama ({ollamaModel})" لتحويل أدلة البحث الموثقة إلى نص وثائقي مشوق ومجهز للإلقاء.
            </p>
          </div>
        ) : (
          sections.map((sec, idx) => {
            const isEditing = editingSectionId === sec.id;

            return (
              <div
                key={sec.id}
                className={`bg-slate-900 border rounded-2xl p-5 space-y-4 transition-all ${
                  sec.isLocked
                    ? 'border-amber-500/40 bg-amber-950/5'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Section Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-950 bg-amber-500 px-2.5 py-0.5 rounded-md tabular-nums">
                      {idx + 1}
                    </span>
                    <h3 className="text-sm font-bold text-slate-100">{sec.title}</h3>

                    {/* Unboxed metadata separator discipline */}
                    <span className="text-slate-600">·</span>
                    <span className="text-xs text-slate-400 tabular-nums">
                      {sec.wordCount} كلمة (~{sec.estimatedDurationSeconds} ثانية)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Lock toggle button */}
                    <button
                      onClick={() => handleToggleLock(sec.id)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                        sec.isLocked
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                      title={sec.isLocked ? 'القسم مقفول لمنع الاستبدال في التوليد القادم' : 'انقر لقفل القسم'}
                    >
                      {sec.isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                      <span>{sec.isLocked ? 'مقفول' : 'قابل للتحديث'}</span>
                    </button>

                    <button
                      onClick={() => handleDeleteSection(sec.id)}
                      className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                      title="حذف القسم"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Section Content Editing vs Viewing */}
                {isEditing ? (
                  <div className="space-y-3">
                    <textarea
                      rows={5}
                      value={editContentText}
                      onChange={(e) => setEditContentText(e.target.value)}
                      className="w-full p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 leading-relaxed focus:outline-none focus:border-amber-500"
                    />

                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setEditingSectionId(null)}
                        className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
                      >
                        إلغاء
                      </button>
                      <button
                        onClick={() => handleSaveEdit(sec.id)}
                        className="flex items-center gap-1 px-4 py-1.5 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-lg"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>حفظ التعديلات</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line font-sans">
                      {sec.content}
                    </p>

                    <div className="flex items-center justify-between text-xs border-t border-slate-800/60 pt-3">
                      {/* Linked Claim IDs */}
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <BookMarked className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>الأدلة المعتمدة المرتبطة:</span>
                        {sec.linkedClaimIds && sec.linkedClaimIds.length > 0 ? (
                          sec.linkedClaimIds.map(cid => (
                            <span key={cid} className="font-mono text-[11px] text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                              {cid}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-500">عام</span>
                        )}
                      </div>

                      <button
                        onClick={() => handleStartEdit(sec)}
                        className="flex items-center gap-1 text-slate-400 hover:text-amber-400 transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>تعديل النص</span>
                      </button>
                    </div>
                  </div>
                )}

              </div>
            );
          })
        )}
      </div>

    </div>
  );
};

function countArabicWords(text: string): number {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(w => w.length > 0).length;
}
