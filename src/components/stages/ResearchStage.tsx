import React, { useState, useEffect } from 'react';
import { 
  Project, 
  ResearchClaim, 
  ResearchSource, 
  ClaimStatus, 
  SourceType, 
  ResearchProviderType, 
  EvaluationProviderType,
  ResearchPlan,
  SourceEvaluationItem
} from '../../types/project';
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
  BookOpen,
  FileText,
  Download,
  ListFilter,
  ShieldCheck,
  Settings,
  Layers,
  Database,
  Info
} from 'lucide-react';

import { downloadBlob, generateResearchMarkdown, generateCitationsCSV } from '../../utils/exporters';

interface ResearchStageProps {
  project: Project;
  onUpdateProject: (updated: Project) => void;
}

export const ResearchStage: React.FC<ResearchStageProps> = ({
  project,
  onUpdateProject,
}) => {
  const [loading, setLoading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Provider Selectors
  const [researchProvider, setResearchProvider] = useState<ResearchProviderType>(
    project.research.researchProviderUsed || 'manual'
  );
  const [evaluationProvider, setEvaluationProvider] = useState<EvaluationProviderType>(
    project.research.evaluationProviderUsed || 'manual'
  );

  // Filter & Active View
  const [statusFilter, setStatusFilter] = useState<'all' | ClaimStatus>('all');
  const [activeTab, setActiveTab] = useState<'claims' | 'plan' | 'sources' | 'evaluations' | 'raw'>('claims');
  
  // Custom Provider Settings Inputs
  const [searxngUrl, setSearxngUrl] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [showConfigModal, setShowConfigModal] = useState(false);

  // Add Manual Source Form State
  const [isAddingManual, setIsAddingManual] = useState(false);
  const [manualClaimText, setManualClaimText] = useState('');
  const [manualSourceTitle, setManualSourceTitle] = useState('');
  const [manualSourceUrl, setManualSourceUrl] = useState('');
  const [manualPublisher, setManualPublisher] = useState('');
  const [manualSourceType, setManualSourceType] = useState<SourceType>('primary');
  const [manualPublicationDate, setManualPublicationDate] = useState('');
  const [manualEvidenceSummary, setManualEvidenceSummary] = useState('');
  const [manualConfidence, setManualConfidence] = useState<'high' | 'medium' | 'low'>('high');

  // Elapsed Timer
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (loading || evaluating || generatingPlan) {
      timer = setInterval(() => setElapsedSeconds(s => s + 1), 1000);
    } else {
      setElapsedSeconds(0);
    }
    return () => clearInterval(timer);
  }, [loading, evaluating, generatingPlan]);

  const claims = project.research.claims || [];
  const sources = project.research.sources || [];
  const evaluations = project.research.evaluations || [];
  const plan = project.research.plan;

  const approvedCount = claims.filter(c => c.status === 'approved').length;
  const rejectedCount = claims.filter(c => c.status === 'rejected').length;
  const pendingCount = claims.filter(c => c.status === 'pending').length;

  const filteredClaims = claims.filter(c => {
    if (statusFilter === 'all') return true;
    return c.status === statusFilter;
  });

  // 1. Generate Research Plan
  const handleGenerateResearchPlan = async () => {
    setGeneratingPlan(true);
    setError(null);
    try {
      const res = await fetch('/api/projects/research-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: project.title,
          topic: project.topic,
          targetAudience: project.targetAudience,
          durationMinutes: project.durationMinutes,
          tone: project.tone,
          angleOrQuestion: project.angleOrQuestion,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'فشل توليد خطة البحث');

      onUpdateProject({
        ...project,
        updatedAt: new Date().toISOString(),
        research: {
          ...project.research,
          plan: json.plan,
        },
      });

      setActiveTab('plan');
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء بناء خطة البحث');
    } finally {
      setGeneratingPlan(false);
    }
  };

  // 2. Execute Research
  const handleRunSearch = async () => {
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
          provider: researchProvider,
          searxngUrl,
          openaiKey,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'فشل تنفيذ طلب البحث');

      const newSources: ResearchSource[] = json.data?.sources || [];
      const newClaims: ResearchClaim[] = json.data?.claims || [];

      onUpdateProject({
        ...project,
        updatedAt: new Date().toISOString(),
        research: {
          ...project.research,
          topicSummary: json.data?.topicSummary || project.research.topicSummary,
          sources: [...sources, ...newSources],
          claims: [...claims, ...newClaims],
          rawResults: json.data?.rawResults || project.research.rawResults,
          searchGroundingQueries: json.data?.searchQueries || project.research.searchGroundingQueries,
          lastResearchedAt: new Date().toISOString(),
          researchProviderUsed: researchProvider,
        },
      });

      setActiveTab('claims');
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء تنفيذ البحث');
    } finally {
      setLoading(false);
    }
  };

  // 3. Add Manual Source
  const handleAddManualSource = () => {
    if (!manualClaimText.trim() || !manualSourceTitle.trim()) {
      setError('يرجى تقديم نص الادعاء وعنوان المصدر على الأقل');
      return;
    }

    const sId = `src-m-${Date.now()}`;
    const cId = `claim-m-${Date.now()}`;

    const newSource: ResearchSource = {
      id: sId,
      title: manualSourceTitle.trim(),
      url: manualSourceUrl.trim() || 'https://archive.org',
      publisher: manualPublisher.trim() || 'إدخال يدوي',
      sourceType: manualSourceType,
      publicationDate: manualPublicationDate.trim() || 'غير محدد',
      retrievedAt: new Date().toISOString(),
      excerptOrEvidence: manualEvidenceSummary.trim() || manualClaimText.trim(),
      providerUsed: 'manual',
    };

    const newClaim: ResearchClaim = {
      id: cId,
      claimText: manualClaimText.trim(),
      sourceIds: [sId],
      evidenceSummary: manualEvidenceSummary.trim() || manualClaimText.trim(),
      sourceType: manualSourceType,
      publisher: manualPublisher.trim() || 'إدخال يدوي',
      sourceTitle: manualSourceTitle.trim(),
      sourceUrl: manualSourceUrl.trim() || 'https://archive.org',
      publicationDate: manualPublicationDate.trim() || 'غير محدد',
      confidence: manualConfidence,
      disputeStatus: 'undisputed',
      evaluationNotes: 'مصدر يدوي — مدخل مباشرة من الباحث',
      status: 'approved', // Auto approve manual claims entered by user
      isManual: true,
      manualSourceLabel: 'Manual source — requires user review',
    };

    onUpdateProject({
      ...project,
      updatedAt: new Date().toISOString(),
      research: {
        ...project.research,
        sources: [...sources, newSource],
        claims: [...claims, newClaim],
        researchProviderUsed: 'manual',
      },
    });

    // Reset Form
    setManualClaimText('');
    setManualSourceTitle('');
    setManualSourceUrl('');
    setManualPublisher('');
    setManualEvidenceSummary('');
    setIsAddingManual(false);
  };

  // 4. Evaluate Sources Action
  const handleEvaluateSources = async () => {
    if (claims.length === 0) {
      setError('لا توجد أدلة أو مصادر لتقييمها. قم بإضافة أو جلب بعض المصادر أولاً.');
      return;
    }

    setEvaluating(true);
    setError(null);

    try {
      const res = await fetch('/api/projects/evaluate-sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claims,
          sources,
          provider: evaluationProvider,
          selectedModel: project.ollama?.model || 'qwen3.5:4b',
          baseUrl: project.ollama?.baseUrl || 'http://localhost:11434',
          openaiKey,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'فشل تقييم المصادر');

      const evalItems: SourceEvaluationItem[] = json.evaluations || [];

      // Update claims with evaluation notes and status recommendations
      const updatedClaims = claims.map(c => {
        const ev = evalItems.find(item => item.claimId === c.id);
        if (ev) {
          return {
            ...c,
            evaluationNotes: ev.evaluatorNotes,
            confidence: ev.confidence,
            status: ev.recommendation === 'approve' ? 'approved' : ev.recommendation === 'reject' ? 'rejected' : c.status,
          };
        }
        return c;
      });

      onUpdateProject({
        ...project,
        updatedAt: new Date().toISOString(),
        research: {
          ...project.research,
          claims: updatedClaims,
          evaluations: evalItems,
          lastEvaluatedAt: new Date().toISOString(),
          evaluationProviderUsed: evaluationProvider,
        },
      });

      setActiveTab('evaluations');
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء تقييم المصادر');
    } finally {
      setEvaluating(false);
    }
  };

  // Claim Status Handlers
  const handleClaimStatusChange = (claimId: string, newStatus: ClaimStatus) => {
    const updatedClaims = claims.map(c => c.id === claimId ? { ...c, status: newStatus } : c);
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

  // Export Brief
  const handleExportBrief = () => {
    const md = generateResearchMarkdown(project);
    downloadBlob(md, `riwaq_${project.title}_research_brief.md`);
  };

  // Export Claims JSON
  const handleExportClaimsJSON = () => {
    const jsonStr = JSON.stringify(claims, null, 2);
    downloadBlob(jsonStr, `riwaq_${project.title}_claims.json`, 'application/json');
  };

  // Export Sources CSV
  const handleExportSourcesCSV = () => {
    const csv = generateCitationsCSV(claims);
    downloadBlob(csv, `riwaq_${project.title}_sources.csv`, 'text/csv;charset=utf-8');
  };

  return (
    <div className="space-y-6">
      {/* HEADER BAR & STATUS BADGES */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-amber-400" />
              <h2 className="text-xl font-bold text-white">مرحلة البحث والأدلة الأكاديمية</h2>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              جمع الأدلة والمصادر، التخطيط للاستعلامات، التقييم المستقل، واعتماد الحقائق قبل توليد السيناريو.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 bg-slate-800 text-slate-300 rounded-lg text-xs font-mono border border-slate-700 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              بحث: {researchProvider.toUpperCase()}
            </span>

            <span className="px-3 py-1 bg-slate-800 text-slate-300 rounded-lg text-xs font-mono border border-slate-700 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              تقييم: {evaluationProvider.toUpperCase()}
            </span>

            <span className="px-3 py-1 bg-amber-950/80 text-amber-300 rounded-lg text-xs font-mono border border-amber-800/50 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              السيناريو: OLLAMA ONLY
            </span>

            <button
              onClick={() => setShowConfigModal(!showConfigModal)}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition"
              title="إعدادات مزودي البحث والتقييم"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* PROVIDER SELECTOR & CONTROLS TOOLBAR */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
          {/* Research Provider Selector */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">مزود البحث والاستكشاف:</label>
            <select
              value={researchProvider}
              onChange={(e) => setResearchProvider(e.target.value as ResearchProviderType)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="manual">1. إدخال يدوي (Manual Research - مجاني 100%)</option>
              <option value="gemini">2. Gemini + Google Search Grounding</option>
              <option value="openai">3. OpenAI Web Search</option>
              <option value="searxng">4. SearXNG خادم محلي</option>
            </select>
          </div>

          {/* Evaluation Provider Selector */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">مزود تقييم وتدقيق المصادر:</label>
            <select
              value={evaluationProvider}
              onChange={(e) => setEvaluationProvider(e.target.value as EvaluationProviderType)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="manual">1. تقييم يدوي (Manual Evaluation)</option>
              <option value="gemini">2. Gemini Flash Evaluator</option>
              <option value="ollama">3. Ollama (محلي qwen3.5:4b)</option>
              <option value="openai">4. OpenAI Evaluator</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex items-end gap-2">
            <button
              onClick={handleGenerateResearchPlan}
              disabled={generatingPlan || loading}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs py-2 px-3 rounded-lg border border-slate-700 font-medium transition flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              {generatingPlan ? 'جاري التخطيط...' : 'خطة البحث'}
            </button>

            <button
              onClick={handleRunSearch}
              disabled={loading || generatingPlan}
              className="flex-1 bg-amber-600 hover:bg-amber-500 text-white text-xs py-2 px-3 rounded-lg font-medium transition flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Search className="w-3.5 h-3.5" />
              {loading ? `بحث (${elapsedSeconds}ث)...` : 'تنفيذ البحث'}
            </button>
          </div>

          <div className="flex items-end gap-2">
            <button
              onClick={handleEvaluateSources}
              disabled={evaluating || claims.length === 0}
              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-xs py-2 px-3 rounded-lg font-medium transition flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              {evaluating ? `تقييم (${elapsedSeconds}ث)...` : 'تقييم المصادر'}
            </button>

            <button
              onClick={() => setIsAddingManual(!isAddingManual)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs py-2 px-3 rounded-lg font-medium transition flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              مصدر يدوي
            </button>
          </div>
        </div>

        {/* CONFIG MODAL IF OPEN */}
        {showConfigModal && (
          <div className="mt-4 p-4 bg-slate-950 border border-slate-800 rounded-lg text-xs space-y-3">
            <h4 className="font-bold text-amber-400 flex items-center gap-1.5">
              <Settings className="w-4 h-4" /> إعدادات روابط مفاتيح ومزودي البحث المحليين
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">رابط خادم SearXNG المحلي:</label>
                <input
                  type="text"
                  value={searxngUrl}
                  onChange={(e) => setSearxngUrl(e.target.value)}
                  placeholder="http://localhost:8080"
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">مفتاح OpenAI API (اختياري للبحث/التقييم):</label>
                <input
                  type="password"
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  placeholder="sk-proj-..."
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ERROR MESSAGE DISPLAY */}
      {error && (
        <div className="bg-rose-950/80 border border-rose-800/80 text-rose-200 rounded-xl p-4 text-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">تنبيه في عملية البحث أو التقييم:</p>
            <p className="text-rose-300 mt-1">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* MANUAL SOURCE IMPORT FORM */}
      {isAddingManual && (
        <div className="bg-slate-900 border border-emerald-800/60 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="font-bold text-emerald-400 flex items-center gap-2 text-sm">
              <Plus className="w-4 h-4" /> إدخال مصدر ودليل يدوي (Manual Source Entry)
            </h3>
            <span className="text-xs text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800/50">
              Manual source — requires user review
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 mb-1 font-medium">نص الادعاء / الحقيقة التاريخية *</label>
              <textarea
                value={manualClaimText}
                onChange={(e) => setManualClaimText(e.target.value)}
                placeholder="أدخل نص الادعاء الدقيق بالعربية..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 h-20 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-medium">نص الدليل / الاقتباس الموثق</label>
              <textarea
                value={manualEvidenceSummary}
                onChange={(e) => setManualEvidenceSummary(e.target.value)}
                placeholder="اقتباس أو ملخص الدليل من المصدر..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 h-20 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-medium">عنوان المصدر / الكتاب / الدراسة *</label>
              <input
                type="text"
                value={manualSourceTitle}
                onChange={(e) => setManualSourceTitle(e.target.value)}
                placeholder="مثال: نفح الطيب من غصن الأندلس الرطيب"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-medium">رابط المصدر (URL)</label>
              <input
                type="text"
                value={manualSourceUrl}
                onChange={(e) => setManualSourceUrl(e.target.value)}
                placeholder="https://archive.org/..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-medium">اسم الناشر / المؤرخ / دار النشر</label>
              <input
                type="text"
                value={manualPublisher}
                onChange={(e) => setManualPublisher(e.target.value)}
                placeholder="مثال: المقرّي التلمساني / مطبعة بولاق"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">نوع المصدر</label>
                <select
                  value={manualSourceType}
                  onChange={(e) => setManualSourceType(e.target.value as SourceType)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                >
                  <option value="primary">وثيقة/مخطوطة أولية</option>
                  <option value="academic">ورقة/كتاب أكاديمي</option>
                  <option value="museum">متحف/معروضات أثرية</option>
                  <option value="archive">أرشيف وطني</option>
                  <option value="encyclopedia">موسوعة موثوقة</option>
                  <option value="other">مصدر آخر</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">سنة/تاريخ النشر</label>
                <input
                  type="text"
                  value={manualPublicationDate}
                  onChange={(e) => setManualPublicationDate(e.target.value)}
                  placeholder="1628 م"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              onClick={() => setIsAddingManual(false)}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
            >
              إلغاء
            </button>
            <button
              onClick={handleAddManualSource}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" /> حفظ وإضافة المصدر
            </button>
          </div>
        </div>
      )}

      {/* STATS SUMMARY BAR */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400">إجمالي المصادر</p>
            <p className="text-xl font-bold text-white mt-0.5">{sources.length}</p>
          </div>
          <Database className="w-8 h-8 text-slate-600" />
        </div>

        <div className="bg-slate-900 border border-emerald-900/40 p-3 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-xs text-emerald-400 font-medium">أدلة معتمدة للسيناريو</p>
            <p className="text-xl font-bold text-emerald-300 mt-0.5">{approvedCount}</p>
          </div>
          <CheckCircle className="w-8 h-8 text-emerald-500/40" />
        </div>

        <div className="bg-slate-900 border border-amber-900/40 p-3 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-xs text-amber-400 font-medium">قيد المراجعة والتقييم</p>
            <p className="text-xl font-bold text-amber-300 mt-0.5">{pendingCount}</p>
          </div>
          <Clock className="w-8 h-8 text-amber-500/40" />
        </div>

        <div className="bg-slate-900 border border-rose-900/40 p-3 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-xs text-rose-400 font-medium">أدلة مستبعدة/مرفوضة</p>
            <p className="text-xl font-bold text-rose-300 mt-0.5">{rejectedCount}</p>
          </div>
          <XCircle className="w-8 h-8 text-rose-500/40" />
        </div>
      </div>

      {/* TABS & FILTERS NAVBAR */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 rounded-xl p-2">
        <div className="flex items-center gap-1 w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setActiveTab('claims')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
              activeTab === 'claims' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            الأدلة والادعاءات ({claims.length})
          </button>

          <button
            onClick={() => setActiveTab('plan')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
              activeTab === 'plan' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            خطة البحث ({plan ? plan.categories?.length : 0})
          </button>

          <button
            onClick={() => setActiveTab('sources')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
              activeTab === 'sources' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            المصادر المجلوبة ({sources.length})
          </button>

          <button
            onClick={() => setActiveTab('evaluations')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
              activeTab === 'evaluations' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            نتائج التقييم المستقل ({evaluations.length})
          </button>
        </div>

        {/* EXPORTS & STATUS FILTER */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {activeTab === 'claims' && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-300"
            >
              <option value="all">كل الحالات ({claims.length})</option>
              <option value="approved">المعتمدة فقط ({approvedCount})</option>
              <option value="pending">قيد المراجعة ({pendingCount})</option>
              <option value="rejected">المرفوضة ({rejectedCount})</option>
            </select>
          )}

          <div className="flex items-center gap-1">
            <button
              onClick={handleExportBrief}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs flex items-center gap-1 border border-slate-700"
              title="تصدير تقرير البحث (Markdown)"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">تقرير MD</span>
            </button>

            <button
              onClick={handleExportClaimsJSON}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs flex items-center gap-1 border border-slate-700"
              title="تصدير الأدلة JSON"
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">JSON</span>
            </button>

            <button
              onClick={handleExportSourcesCSV}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs flex items-center gap-1 border border-slate-700"
              title="تصدير جدول المراجع CSV"
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* TAB CONTENT 1: CLAIMS VIEW */}
      {activeTab === 'claims' && (
        <div className="space-y-3">
          {filteredClaims.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center space-y-3">
              <BookOpen className="w-12 h-12 text-slate-600 mx-auto" />
              <p className="text-slate-400 text-sm">لا توجد ادعاءات أو أدلة في هذه الفئة حالياً.</p>
              <p className="text-slate-500 text-xs">
                انقر على "تنفيذ البحث" لجلب مصادر بالذكاء الاصطناعي أو "مصدر يدوي" لإدخال مراجعك الخاصة.
              </p>
            </div>
          ) : (
            filteredClaims.map((claim) => (
              <div
                key={claim.id}
                className={`bg-slate-900 border rounded-xl p-4 transition space-y-3 ${
                  claim.status === 'approved'
                    ? 'border-emerald-800/80 bg-slate-900/90'
                    : claim.status === 'rejected'
                    ? 'border-rose-900/60 opacity-70'
                    : 'border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {claim.id}
                      </span>

                      {claim.isManual && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                          {claim.manualSourceLabel || 'Manual source'}
                        </span>
                      )}

                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                        claim.status === 'approved'
                          ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700'
                          : claim.status === 'rejected'
                          ? 'bg-rose-900/60 text-rose-300 border border-rose-700'
                          : 'bg-amber-900/60 text-amber-300 border border-amber-700'
                      }`}>
                        {claim.status === 'approved' ? 'معتمد للسيناريو' : claim.status === 'rejected' ? 'مرفوض/مستبعد' : 'قيد التقييم'}
                      </span>

                      <span className="text-xs text-slate-400">
                        درجة الثقة: <strong className="text-slate-200">{claim.confidence || 'high'}</strong>
                      </span>
                    </div>

                    <h4 className="text-base font-semibold text-white leading-snug pt-1">
                      {claim.claimText}
                    </h4>
                  </div>

                  {/* APPROVAL GATE CONTROLS */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleClaimStatusChange(claim.id, 'approved')}
                      className={`p-1.5 rounded-lg border transition ${
                        claim.status === 'approved'
                          ? 'bg-emerald-600 text-white border-emerald-500'
                          : 'bg-slate-800 hover:bg-emerald-950 text-slate-400 hover:text-emerald-300 border-slate-700'
                      }`}
                      title="اعتماد للدخول في توليد السيناريو"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleClaimStatusChange(claim.id, 'rejected')}
                      className={`p-1.5 rounded-lg border transition ${
                        claim.status === 'rejected'
                          ? 'bg-rose-600 text-white border-rose-500'
                          : 'bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 border-slate-700'
                      }`}
                      title="استبعاد/رفض الادعاء"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDeleteClaim(claim.id)}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-400 rounded-lg border border-slate-700 transition"
                      title="حذف الادعاء"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* EVIDENCE & SOURCE DETAILS */}
                <div className="bg-slate-950/80 border border-slate-800/80 rounded-lg p-3 text-xs space-y-1.5">
                  <p className="text-slate-300">
                    <strong className="text-amber-400">الدليل والتوثيق:</strong> {claim.evidenceSummary}
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-slate-400 pt-1 border-t border-slate-800/60">
                    <div>
                      المصدر: <strong className="text-slate-200">{claim.sourceTitle}</strong> ({claim.publisher})
                    </div>
                    {claim.sourceUrl && (
                      <a
                        href={claim.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-amber-400 hover:underline flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" /> رابط المصدر
                      </a>
                    )}
                  </div>

                  {claim.evaluationNotes && (
                    <div className="mt-2 p-2 bg-blue-950/40 border border-blue-900/50 rounded text-blue-200 text-[11px] flex items-start gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                      <div>
                        <strong>ملاحظات مقيّم المصادر:</strong> {claim.evaluationNotes}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB CONTENT 2: RESEARCH PLAN */}
      {activeTab === 'plan' && (
        <div className="space-y-4">
          {!plan ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center space-y-3">
              <Layers className="w-12 h-12 text-slate-600 mx-auto" />
              <p className="text-slate-300 font-semibold text-sm">لم يتم توليد خطة البحث الموجهة بعد.</p>
              <p className="text-slate-400 text-xs max-w-md mx-auto">
                تولد خطة البحث 15 إلى 25 استعلاماً دقيقاً مقسمة على 8 محاور أكاديمية وبصرية لتغطية موضوعك من كافة الزوايا.
              </p>
              <button
                onClick={handleGenerateResearchPlan}
                disabled={generatingPlan}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition"
              >
                {generatingPlan ? 'جاري البناء...' : 'توليد خطة البحث الآن'}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white text-sm">خطة البحث والاستعلامات الموجهة</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    إجمالي الاستعلامات: {plan.queriesCount} | تاريخ التولد: {new Date(plan.generatedAt).toLocaleTimeString('ar-EG')}
                  </p>
                </div>
                <button
                  onClick={handleGenerateResearchPlan}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs border border-slate-700"
                >
                  إعادة التوليد
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {plan.categories?.map((cat, idx) => (
                  <div key={idx} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
                    <h4 className="font-bold text-amber-400 text-xs flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                      {cat.categoryTitle} ({cat.queries?.length || 0})
                    </h4>
                    <ul className="space-y-1 text-xs text-slate-300 pr-2">
                      {cat.queries?.map((q, qIdx) => (
                        <li key={qIdx} className="bg-slate-950 border border-slate-800/80 rounded p-1.5 font-mono text-[11px] text-slate-300">
                          🔍 {q}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 3: SOURCES LIST */}
      {activeTab === 'sources' && (
        <div className="space-y-3">
          {sources.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400 text-sm">
              لا توجد مصادر رقمية مجلوبة بعد.
            </div>
          ) : (
            sources.map((src) => (
              <div key={src.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-sm">{src.title}</h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    المزود: {src.providerUsed}
                  </span>
                </div>
                <p className="text-xs text-slate-300 bg-slate-950 p-2 rounded border border-slate-800">
                  {src.excerptOrEvidence}
                </p>
                <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                  <span>الناشر: {src.publisher} ({src.publicationDate})</span>
                  {src.url && (
                    <a href={src.url} target="_blank" rel="noreferrer" className="text-amber-400 hover:underline flex items-center gap-1">
                      <ExternalLink className="w-3 h-3" /> فتح المصدر
                    </a>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB CONTENT 4: EVALUATIONS VIEW */}
      {activeTab === 'evaluations' && (
        <div className="space-y-3">
          {evaluations.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center space-y-3">
              <ShieldCheck className="w-12 h-12 text-slate-600 mx-auto" />
              <p className="text-slate-300 font-semibold text-sm">لم يتم تنفيذ تقييم تدقيق المصادر بعد.</p>
              <p className="text-slate-400 text-xs max-w-md mx-auto">
                يقوم مقيّم المصادر بفحص ثقة الناشر وصلاحية الرابط ومدى مباشرة الدليل دون صياغة أي فقرات سيناريو.
              </p>
              <button
                onClick={handleEvaluateSources}
                disabled={evaluating || claims.length === 0}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg transition"
              >
                {evaluating ? 'جاري التقييم...' : 'تقييم المصادر والأدلة الحالية'}
              </button>
            </div>
          ) : (
            evaluations.map((ev, idx) => (
              <div key={idx} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-slate-400">معرف الادعاء: {ev.claimId}</span>
                  <span className={`px-2 py-0.5 rounded font-bold ${
                    ev.recommendation === 'approve' ? 'bg-emerald-900 text-emerald-300' : 'bg-rose-900 text-rose-300'
                  }`}>
                    التوصية: {ev.recommendation === 'approve' ? 'اعتماد' : 'ملاحظات/استبعاد'}
                  </span>
                </div>
                <p className="text-slate-200 bg-slate-950 p-2.5 rounded border border-slate-800">
                  <strong>ملاحظات المقيّم الأكاديمي:</strong> {ev.evaluatorNotes}
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] text-slate-400 pt-1">
                  <div>صلاحية الرابط: <strong className="text-slate-200">{ev.urlValidity}</strong></div>
                  <div>سلطة الناشر: <strong className="text-slate-200">{ev.publisherAuthority}</strong></div>
                  <div>مباشرة الدليل: <strong className="text-slate-200">{ev.evidenceDirectness}</strong></div>
                  <div>درجة الثقة: <strong className="text-slate-200">{ev.confidence}</strong></div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
