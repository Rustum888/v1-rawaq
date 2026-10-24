import React, { useState } from 'react';
import { Project, ResearchClaim, ClaimStatus, SourceType } from '../../types/project';
import { 
  Search, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  ExternalLink, 
  Plus, 
  Edit, 
  Trash2, 
  Sparkles, 
  Check, 
  X,
  HelpCircle,
  BookOpen
} from 'lucide-react';

import { downloadBlob, generateResearchMarkdown } from '../../utils/exporters';

interface ResearchStageProps {
  project: Project;
  onUpdateProject: (updated: Project) => void;
}

export const ResearchStage: React.FC<ResearchStageProps> = ({
  project,
  onUpdateProject,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [researchProvider, setResearchProvider] = useState<'ollama' | 'gemini'>('ollama');
  const [statusFilter, setStatusFilter] = useState<'all' | ClaimStatus>('all');
  const [editingClaim, setEditingClaim] = useState<ResearchClaim | null>(null);
  const [isAddingClaim, setIsAddingClaim] = useState(false);

  // New Claim Form State
  const [newClaimText, setNewClaimText] = useState('');
  const [newSourceTitle, setNewSourceTitle] = useState('');
  const [newSourceUrl, setNewSourceUrl] = useState('');
  const [newPublisher, setNewPublisher] = useState('');
  const [newSourceType, setNewSourceType] = useState<SourceType>('university_press');
  const [newEvidenceSummary, setNewEvidenceSummary] = useState('');
  const [newConfidence, setNewConfidence] = useState<'high' | 'medium' | 'low' | 'disputed'>('high');
  const [newIsDisputed, setNewIsDisputed] = useState(false);
  const [newCompeting, setNewCompeting] = useState('');

  // Google Search Grounding Verification State
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [verifyQuery, setVerifyQuery] = useState('');
  const [targetClaimForVerify, setTargetClaimForVerify] = useState<ResearchClaim | null>(null);
  const [verifyingLoading, setVerifyingLoading] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [verifyResult, setVerifyResult] = useState<{
    verificationStatus?: string;
    verificationSummary?: string;
    webSearchQueries?: string[];
    groundingChunks?: Array<{ title: string; url: string }>;
    suggestedSources?: Array<{
      title: string;
      url: string;
      publisher: string;
      sourceType: SourceType;
      evidenceSummary: string;
      confidence?: 'high' | 'medium' | 'low' | 'disputed';
    }>;
  } | null>(null);

  const claims = project.research.claims || [];

  const handleOpenVerifyModal = (claim?: ResearchClaim) => {
    setVerifyResult(null);
    setVerifyError(null);
    if (claim) {
      setTargetClaimForVerify(claim);
      setVerifyQuery(claim.claimText);
    } else {
      setTargetClaimForVerify(null);
      setVerifyQuery('');
    }
    setIsVerifyModalOpen(true);
  };

  const handleExecuteVerification = async () => {
    if (!verifyQuery.trim()) {
      setVerifyError('يرجى إدخال ادعاء أو استعلام للتحقق منه');
      return;
    }
    setVerifyingLoading(true);
    setVerifyError(null);
    try {
      const res = await fetch('/api/projects/verify-claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: verifyQuery.trim(),
          claimContext: targetClaimForVerify ? `المصدر القديم: ${targetClaimForVerify.sourceTitle} (${targetClaimForVerify.publisher})` : undefined,
          provider: 'gemini', // Always prefer Gemini for Search Grounding
          model: project.ollama?.model || 'qwen3.5:4b',
          baseUrl: project.ollama?.baseUrl || 'http://localhost:11434',
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'فشل في إجراء التحقق من المصادر عبر Google Search Grounding');
      }

      setVerifyResult(json.data);
    } catch (err: any) {
      console.error('Verification error:', err);
      setVerifyError(err.message || 'حدث خطأ أثناء إجراء البحث المباشر');
    } finally {
      setVerifyingLoading(false);
    }
  };

  const handleAddVerifiedSourceToProject = (src: {
    title: string;
    url: string;
    publisher: string;
    sourceType: SourceType;
    evidenceSummary: string;
  }) => {
    const created: ResearchClaim = {
      id: `claim-${Date.now()}`,
      claimText: verifyQuery.trim() || src.evidenceSummary,
      sourceTitle: src.title,
      sourceUrl: src.url || 'https://archive.org',
      publisher: src.publisher || 'بحث جوجل المباشر',
      sourceType: src.sourceType || 'university_press',
      evidenceSummary: src.evidenceSummary || verifyQuery.trim(),
      confidenceLevel: 'high',
      isDisputed: false,
      competingInterpretations: '',
      status: 'approved',
    };

    onUpdateProject({
      ...project,
      updatedAt: new Date().toISOString(),
      research: {
        ...project.research,
        claims: [...claims, created],
      },
    });

    setIsVerifyModalOpen(false);
  };


  const filteredClaims = claims.filter(c => {
    if (statusFilter === 'all') return true;
    return c.status === statusFilter;
  });

  const approvedCount = claims.filter(c => c.status === 'approved').length;
  const rejectedCount = claims.filter(c => c.status === 'rejected').length;
  const pendingCount = claims.filter(c => c.status === 'pending').length;

  // Trigger Research API
  const handleRunResearch = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/projects/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: project.topic,
          title: project.title,
          targetAudience: project.targetAudience,
          durationMinutes: project.durationMinutes,
          tone: project.tone,
          notes: project.notes,
          provider: researchProvider,
          model: project.ollama?.model || 'qwen3.5:4b',
          baseUrl: project.ollama?.baseUrl || 'http://localhost:11434',
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'فشل في إكمال البحث');
      }

      const updatedClaims: ResearchClaim[] = json.data.claims || [];
      const updatedProject: Project = {
        ...project,
        updatedAt: new Date().toISOString(),
        research: {
          ...project.research,
          topicSummary: json.data.topicSummary || project.research.topicSummary,
          claims: updatedClaims,
          searchGroundingQueries: json.data.searchGroundingQueries || project.research.searchGroundingQueries,
          lastResearchedAt: new Date().toISOString(),
          historicalContextWarningShown: true,
        },
      };

      onUpdateProject(updatedProject);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'حدث خطأ في الاتصال بخادم البحث');
    } finally {
      setLoading(false);
    }
  };

  // Claim status handlers
  const handleSetClaimStatus = (claimId: string, status: ClaimStatus) => {
    const updatedClaims = claims.map(c => (c.id === claimId ? { ...c, status } : c));
    onUpdateProject({
      ...project,
      updatedAt: new Date().toISOString(),
      research: { ...project.research, claims: updatedClaims },
    });
  };

  const handleDeleteClaim = (claimId: string) => {
    const updatedClaims = claims.filter(c => c.id !== claimId);
    onUpdateProject({
      ...project,
      updatedAt: new Date().toISOString(),
      research: { ...project.research, claims: updatedClaims },
    });
  };

  // Add custom claim handler
  const handleSaveNewClaim = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClaimText.trim() || !newSourceTitle.trim()) {
      alert('يرجى ملء نص الادعاء وعنوان المصدر');
      return;
    }

    const created: ResearchClaim = {
      id: `claim-${Date.now()}`,
      claimText: newClaimText.trim(),
      sourceTitle: newSourceTitle.trim(),
      sourceUrl: newSourceUrl.trim() || 'https://archive.org',
      publisher: newPublisher.trim() || 'مصدر أثري موثق',
      sourceType: newSourceType,
      evidenceSummary: newEvidenceSummary.trim() || newClaimText.trim(),
      confidenceLevel: newConfidence,
      isDisputed: newIsDisputed,
      competingInterpretations: newCompeting.trim(),
      status: 'approved',
    };

    onUpdateProject({
      ...project,
      updatedAt: new Date().toISOString(),
      research: {
        ...project.research,
        claims: [...claims, created],
      },
    });

    setIsAddingClaim(false);
    resetNewClaimForm();
  };

  const resetNewClaimForm = () => {
    setNewClaimText('');
    setNewSourceTitle('');
    setNewSourceUrl('');
    setNewPublisher('');
    setNewSourceType('university_press');
    setNewEvidenceSummary('');
    setNewConfidence('high');
    setNewIsDisputed(false);
    setNewCompeting('');
  };

  return (
    <div className="space-y-6">
      
      {/* Historical Certainty Warning Banner (MANDATORY REQUIREMENT) */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 text-amber-200">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs sm:text-sm leading-relaxed">
          <span className="font-bold text-amber-300 block">
            ملاحظة مهمة حول التوثيق والأدلة التاريخية:
          </span>
          <p>
            "البحث المدعوم بالربط المباشر يرفع شأن التوثيق ولكنه لا يضمن اليقين التاريخي المطلق. يرجى مراجعة المصادر قبل النشر."
          </p>
          <p className="text-[11px] text-amber-400/80">
            * تفضل المنصة أوراق الدور النشر الجامعية، الأبحاث المحكمة، المتاحف والأرشيفات الوطنية والموسوعات المأثورة. يمنع الاعتماد الشكلي على المدونات أو وسائل التواصل.
          </p>
        </div>
      </div>

      {/* Control bar: Provider Selector + Run research + Add claim + Export */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-400" />
              <span>جدول الأدلة والادعاءات الموثقة (Evidence Table)</span>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 mr-2">
                مرحلة مستقلة
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              {project.research.lastResearchedAt
                ? `آخر بحث أجري بتاريخ: ${new Date(project.research.lastResearchedAt).toLocaleString('ar-EG')}`
                : 'يمكنك إجراء البحث وتوثيق الادعاءات بحرية أو إضافة الأدلة يدوياً ثم تصدير النتيجة مباشرة.'}
            </p>
          </div>

          {/* Provider Selector for Research */}
          <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs">
            <span className="text-slate-400 font-semibold px-2">مزود البحث:</span>
            <button
              type="button"
              onClick={() => setResearchProvider('ollama')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                researchProvider === 'ollama'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Ollama المحلي (100% مجاني)
            </button>
            <button
              type="button"
              onClick={() => setResearchProvider('gemini')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                researchProvider === 'gemini'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Gemini Grounding
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/80 pt-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAddingClaim(true)}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة دليل يدوياً</span>
            </button>

            <button
              onClick={() => handleOpenVerifyModal()}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold text-sky-300 bg-sky-500/10 hover:bg-sky-500/20 rounded-xl border border-sky-500/30 transition-colors"
            >
              <Search className="w-4 h-4 text-sky-400" />
              <span>أداة التحقق بـ Google Search Grounding</span>
            </button>

            {claims.length > 0 && (
              <button
                onClick={() => downloadBlob(generateResearchMarkdown(project), `research_${project.id}.md`, 'text/markdown;charset=utf-8')}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 rounded-xl border border-amber-500/30 transition-colors"
              >
                <span>تصدير التقرير (MD)</span>
              </button>
            )}
          </div>

          <button
            onClick={handleRunResearch}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-700 disabled:text-slate-500 rounded-xl shadow-lg shadow-amber-500/10 transition-all"
          >
            <Sparkles className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>
              {loading
                ? 'جاري التوثيق بالذكاء الاصطناعي...'
                : researchProvider === 'ollama'
                ? 'بحث موثق عبر Ollama المحلي (مجاني)'
                : 'إجراء بحث موثق بـ Google Search'}
            </span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300">
          {error}
        </div>
      )}

      {/* Topic Summary Section & Search Grounding Annotations */}
      {project.research.topicSummary && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="space-y-1">
            <span className="text-xs font-bold text-amber-400 block">الملخص الأكاديمي الشامل للموضوع:</span>
            <p className="text-xs text-slate-200 leading-relaxed">
              {project.research.topicSummary}
            </p>
          </div>

          {/* Render Google Search Grounding Citation Annotations */}
          {((project.research.groundingChunks && project.research.groundingChunks.length > 0) || 
            (project.research.searchGroundingQueries && project.research.searchGroundingQueries.length > 0)) && (
            <div className="border-t border-slate-800/80 pt-3 space-y-2">
              <span className="text-[11px] font-bold text-slate-400 block">
                مصادر واستعلامات الربط المباشر المرجعة من Google Search Grounding:
              </span>

              {project.research.searchGroundingQueries && project.research.searchGroundingQueries.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
                  <span className="font-medium text-slate-300">استعلامات البحث:</span>
                  {project.research.searchGroundingQueries.map((q, idx) => (
                    <span key={idx} className="bg-slate-800 px-2 py-0.5 rounded text-amber-300 font-mono text-[10px]">
                      "{q}"
                    </span>
                  ))}
                </div>
              )}

              {project.research.groundingChunks && project.research.groundingChunks.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {project.research.groundingChunks.map((chunk, idx) => (
                    <a
                      key={idx}
                      href={chunk.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-[11px] text-amber-400 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3 text-amber-400 shrink-0" />
                      <span className="truncate max-w-xs">{chunk.title || chunk.url}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Filter Tabs & Stats */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              statusFilter === 'all' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            الكل ({claims.length})
          </button>

          <button
            onClick={() => setStatusFilter('approved')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
              statusFilter === 'approved' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-emerald-400 hover:text-emerald-300'
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>المعتمدة ({approvedCount})</span>
          </button>

          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
              statusFilter === 'pending' ? 'bg-yellow-500 text-slate-950 font-bold' : 'text-yellow-400 hover:text-yellow-300'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>قيد المراجعة ({pendingCount})</span>
          </button>

          <button
            onClick={() => setStatusFilter('rejected')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
              statusFilter === 'rejected' ? 'bg-red-500 text-slate-950 font-bold' : 'text-red-400 hover:text-red-300'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>المرفوضة ({rejectedCount})</span>
          </button>
        </div>

        <div className="text-xs text-slate-400">
          يعتمد كتابة السيناريو <strong className="text-amber-400">فقط على الأدلة المعتمدة</strong>.
        </div>
      </div>

      {/* Claims Evidence Table / Cards List */}
      <div className="space-y-4">
        {filteredClaims.length === 0 ? (
          <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
            <Search className="w-8 h-8 text-slate-600 mx-auto" />
            <h3 className="text-sm font-bold text-slate-300">لا توجد ادعاءات في هذا التصنيف</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              اضغط على "إجراء بحث موثق بالذكاء الاصطناعي" لاستخراج الأدلة تلقائياً أو أضف دليلاً تاريخياً يدوياً.
            </p>
          </div>
        ) : (
          filteredClaims.map((claim) => (
            <div
              key={claim.id}
              className={`bg-slate-900 border rounded-2xl p-5 space-y-4 transition-all ${
                claim.status === 'approved'
                  ? 'border-emerald-500/40 bg-emerald-950/10'
                  : claim.status === 'rejected'
                  ? 'border-red-500/30 bg-red-950/10'
                  : 'border-slate-800'
              }`}
            >
              {/* Top row: ID + Status + Source Type + Confidence */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    [{claim.id}]
                  </span>

                  {/* Clean unboxed metadata separator discipline */}
                  <span className="text-xs font-semibold text-slate-300">
                    {getSourceTypeName(claim.sourceType)}
                  </span>
                  <span className="text-slate-600">·</span>
                  <span className="text-xs text-slate-400">
                    {claim.publisher}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {claim.isDisputed && (
                    <span className="text-[11px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                      محل خلاف تاريخي
                    </span>
                  )}

                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                    claim.confidenceLevel === 'high' ? 'text-emerald-400 bg-emerald-500/10' :
                    claim.confidenceLevel === 'medium' ? 'text-yellow-400 bg-yellow-500/10' :
                    'text-red-400 bg-red-500/10'
                  }`}>
                    درجة الثقة: {claim.confidenceLevel === 'high' ? 'عالية' : claim.confidenceLevel === 'medium' ? 'متوسطة' : 'منخفضة / محل خلاف'}
                  </span>
                </div>
              </div>

              {/* Claim Main Text */}
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-100 leading-snug">
                  {claim.claimText}
                </h3>
                <p className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800/60 leading-relaxed">
                  <strong className="text-amber-400/90 ml-1">ملخص الدليل/الاقتباس:</strong>
                  {claim.evidenceSummary}
                </p>
              </div>

              {/* Disputed competing views callout */}
              {claim.isDisputed && claim.competingInterpretations && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-xs text-red-200 space-y-1">
                  <span className="font-bold text-red-300 block">التفسيرات والوجهات النظر المنافسة:</span>
                  <p>{claim.competingInterpretations}</p>
                </div>
              )}

              {/* Source Link & Publisher Metadata */}
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 pt-1">
                <div className="flex items-center gap-2 max-w-lg truncate">
                  <span className="font-medium text-slate-300">المصدر: {claim.sourceTitle}</span>
                  {claim.sourceUrl && (
                    <a
                      href={claim.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-400 hover:underline flex items-center gap-1 shrink-0"
                    >
                      <span>زيارة المصدر</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                {/* Status Toggle Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenVerifyModal(claim)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-sky-300 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 transition-all"
                    title="تحقق مباشر عبر Google Search Grounding"
                  >
                    <Search className="w-3.5 h-3.5 text-sky-400" />
                    <span>تحقق بـ Google</span>
                  </button>

                  <button
                    onClick={() => handleSetClaimStatus(claim.id, 'approved')}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      claim.status === 'approved'
                        ? 'bg-emerald-500 text-slate-950 shadow-md'
                        : 'bg-slate-800 text-slate-300 hover:bg-emerald-500/20 hover:text-emerald-300'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>اعتماد الدليل</span>
                  </button>

                  <button
                    onClick={() => handleSetClaimStatus(claim.id, 'rejected')}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      claim.status === 'rejected'
                        ? 'bg-red-500 text-slate-950 shadow-md'
                        : 'bg-slate-800 text-slate-300 hover:bg-red-500/20 hover:text-red-300'
                    }`}
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>رفض</span>
                  </button>

                  <button
                    onClick={() => handleDeleteClaim(claim.id)}
                    className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                    title="حذف"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>
          ))
        )}
      </div>

      {/* Modal for Manual Add Claim */}
      {isAddingClaim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 text-right">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100">إضافة دليل أثري/تاريخي يدوياً</h3>
              <button onClick={() => setIsAddingClaim(false)} className="text-slate-400 hover:text-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewClaim} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">نص الادعاء أو الحقيقة التاريخية *</label>
                <textarea
                  required
                  rows={2}
                  value={newClaimText}
                  onChange={(e) => setNewClaimText(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">عنوان المصدر/الكتاب *</label>
                  <input
                    type="text"
                    required
                    value={newSourceTitle}
                    onChange={(e) => setNewSourceTitle(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">الناشر/المؤسسة</label>
                  <input
                    type="text"
                    value={newPublisher}
                    onChange={(e) => setNewPublisher(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">نوع المصدر</label>
                  <select
                    value={newSourceType}
                    onChange={(e) => setNewSourceType(e.target.value as any)}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="primary_document">وثيقة أولية / مخطوطة</option>
                    <option value="university_press">دار نشر جامعية</option>
                    <option value="peer_reviewed">بحث محكم</option>
                    <option value="museum">متحف وطني</option>
                    <option value="national_archive">أرشيف وطني</option>
                    <option value="reputable_encyclopedia">موسوعة مأثورة</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">رابط المصدر (URL)</label>
                  <input
                    type="url"
                    value={newSourceUrl}
                    onChange={(e) => setNewSourceUrl(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">اقتباس أو ملخص الدليل</label>
                <textarea
                  rows={2}
                  value={newEvidenceSummary}
                  onChange={(e) => setNewEvidenceSummary(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isDisputedCheck"
                  checked={newIsDisputed}
                  onChange={(e) => setNewIsDisputed(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-800 text-amber-500 focus:ring-0"
                />
                <label htmlFor="isDisputedCheck" className="text-xs text-slate-300">
                  ادعاء موضع خلاف بين المؤرخين
                </label>
              </div>

              {newIsDisputed && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">التفسيرات المنافسة</label>
                  <input
                    type="text"
                    value={newCompeting}
                    onChange={(e) => setNewCompeting(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddingClaim(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-slate-200"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl"
                >
                  حفظ واعتمد الدليل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Google Search Grounding Live Verification & Source Finder Modal */}
      {isVerifyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-5 text-right my-8 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  <Search className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                    <span>أداة التوثيق المباشر والبحث عن المصادر بـ Google Search Grounding</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    {targetClaimForVerify
                      ? `فحص وتوثيق الادعاء: [${targetClaimForVerify.id}]`
                      : 'ابحث واستكشف المصادر والأدلة الحية من محرك بحث جوجل بدون مغادرة مساحة العمل'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsVerifyModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Query Input Bar */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                نص الادعاء أو الموضوع المراد فحصه والتحقق منه حيّاً:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={verifyQuery}
                  onChange={(e) => setVerifyQuery(e.target.value)}
                  placeholder="اكتب الادعاء أو الحقيقة أو اسم المصدر للتأكد منه ببحث جوجل..."
                  className="flex-1 px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
                <button
                  type="button"
                  onClick={handleExecuteVerification}
                  disabled={verifyingLoading || !verifyQuery.trim()}
                  className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-950 bg-sky-400 hover:bg-sky-300 disabled:bg-slate-800 disabled:text-slate-500 rounded-xl shadow-md transition-colors shrink-0"
                >
                  <Sparkles className={`w-4 h-4 ${verifyingLoading ? 'animate-spin' : ''}`} />
                  <span>{verifyingLoading ? 'جاري الفحص المباشر...' : 'بحث وتحقق بـ Google'}</span>
                </button>
              </div>
            </div>

            {verifyError && (
              <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300">
                {verifyError}
              </div>
            )}

            {/* Verification Results Panel */}
            {verifyResult && (
              <div className="space-y-4 border-t border-slate-800/80 pt-4">
                
                {/* Status Badge & Summary */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">نتيجة الفحص الميداني المباشر:</span>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                      verifyResult.verificationStatus === 'verified' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                      verifyResult.verificationStatus === 'disputed' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                      'bg-slate-800 text-slate-300'
                    }`}>
                      {verifyResult.verificationStatus === 'verified' ? 'مؤكد بالمصادر' :
                       verifyResult.verificationStatus === 'disputed' ? 'محل خلاف بين المصادر' : 'نتائج فحص جوجل'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-200 leading-relaxed">
                    {verifyResult.verificationSummary}
                  </p>
                </div>

                {/* Web Search Queries Executed */}
                {verifyResult.webSearchQueries && verifyResult.webSearchQueries.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-400 block">
                      استعلامات البحث الحي المنفذة عبر Google Search:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {verifyResult.webSearchQueries.map((q, idx) => (
                        <span key={idx} className="bg-slate-800 px-2.5 py-0.5 rounded text-sky-300 font-mono text-[10px] border border-slate-700">
                          "{q}"
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Direct Web Grounding Chunks */}
                {verifyResult.groundingChunks && verifyResult.groundingChunks.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-slate-400 block">
                      المصادر والصفحات المباشرة المرجعة من محرك البحث:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {verifyResult.groundingChunks.map((chunk, idx) => (
                        <a
                          key={idx}
                          href={chunk.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs text-amber-400 transition-colors truncate"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span className="truncate">{chunk.title || chunk.url}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggested / Discovered Sources */}
                {verifyResult.suggestedSources && verifyResult.suggestedSources.length > 0 && (
                  <div className="space-y-2.5 pt-2">
                    <span className="text-xs font-bold text-slate-300 block">
                      المصادر والأدلة المستخرجة (يمكنك إضافتها للمشروع بنقرة واحدة):
                    </span>
                    <div className="space-y-2">
                      {verifyResult.suggestedSources.map((src, idx) => (
                        <div key={idx} className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2 text-xs">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="font-bold text-slate-100">{src.title}</h4>
                              <p className="text-[11px] text-slate-400">{src.publisher} · {getSourceTypeName(src.sourceType)}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleAddVerifiedSourceToProject(src)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs shrink-0 shadow transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>إضافة للمشروع</span>
                            </button>
                          </div>
                          {src.evidenceSummary && (
                            <p className="text-slate-300 bg-slate-900/80 p-2 rounded-lg border border-slate-800 text-[11px]">
                              {src.evidenceSummary}
                            </p>
                          )}
                          {src.url && (
                            <a href={src.url} target="_blank" rel="noopener noreferrer" className="text-amber-400 text-[11px] hover:underline flex items-center gap-1">
                              <span>فتح رابط المصدر</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* Modal Footer */}
            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                onClick={() => setIsVerifyModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200"
              >
                إغلاق النافذة
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

function getSourceTypeName(type: SourceType): string {
  const map: Record<SourceType, string> = {
    primary_document: 'وثيقة أولية / مخطوطة',
    university_press: 'دار نشر جامعية',
    peer_reviewed: 'بحث أكاديمي محكم',
    museum: 'متحف وطني / معروضات',
    national_archive: 'أرشيف وثائقي وطني',
    reputable_encyclopedia: 'موسوعة علمية مأثورة',
    other: 'مصدر ثانوي متخصص',
  };
  return map[type] || 'مصدر أثري';
}
