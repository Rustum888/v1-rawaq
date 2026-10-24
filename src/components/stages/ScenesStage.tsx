import React, { useState } from 'react';
import { Project, SceneData, VisualType } from '../../types/project';
import { 
  Clapperboard, 
  Sparkles, 
  Image as ImageIcon, 
  Copy, 
  Check, 
  Clock, 
  Download, 
  MapPin, 
  Edit2, 
  FileCode, 
  Eye, 
  RefreshCw 
} from 'lucide-react';
import { downloadBlob, generateScenesJSON } from '../../utils/exporters';

interface ScenesStageProps {
  project: Project;
  onUpdateProject: (updated: Project) => void;
}

export const VISUAL_TYPES: Array<{ id: VisualType; label: string; description: string }> = [
  { id: 'illustration', label: 'رسم توضيحي', description: 'أسلوب أندلسي فني تبسيطي بدون ملامح واقعية متكلفة' },
  { id: 'cartoon', label: 'كرتون مبسط', description: 'رسم كرتوني متجهي أنيق وواضح للمشاهد التاريخية' },
  { id: 'map', label: 'خريطة تاريخية', description: 'أطلس جغرافيا مع تسميات عربية واضحة للحدود' },
  { id: 'diagram', label: 'مخطط بياني', description: 'انفوجرافيك لتبسيط التدفقات المالية والعسكرية' },
  { id: 'archive', label: 'صورة أرشيفية', description: 'صور معالم، آثار، مخطوطات، ومتاحف حقيقية' },
  { id: 'title_card', label: 'بطاقة عنوان', description: 'غرافيك نصي وزخارف هندسية فاخرة' },
];

export const ScenesStage: React.FC<ScenesStageProps> = ({
  project,
  onUpdateProject,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scenesProvider, setScenesProvider] = useState<'ollama' | 'gemini'>('ollama');
  const [imageEngine, setImageEngine] = useState<'pollinations' | 'gemini'>('pollinations');
  const [generatingSceneId, setGeneratingSceneId] = useState<string | null>(null);
  const [copiedSceneId, setCopiedSceneId] = useState<string | null>(null);

  const scenes = project.scenes || [];
  const scriptSections = project.script.sections || [];

  // Generate Scenes Plan from approved script
  const handleGenerateScenes = async () => {
    if (scriptSections.length === 0) {
      alert('لا توجد أقسام سيناريو متاحة! يرجى إنشاء السيناريو أولاً قبل التخطيط للمشاهد البصرية.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/projects/scenes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scriptSections,
          projectTitle: project.title,
          provider: scenesProvider,
          model: project.ollama?.model || 'qwen3.5:4b',
          baseUrl: project.ollama?.baseUrl || 'http://localhost:11434',
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'فشل في إنشاء خطة المشاهد');
      }

      const generatedScenes: SceneData[] = json.data.scenes || [];
      const updatedProject: Project = {
        ...project,
        updatedAt: new Date().toISOString(),
        scenes: generatedScenes,
      };

      onUpdateProject(updatedProject);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'حدث خطأ في إنشاء المشاهد');
    } finally {
      setLoading(false);
    }
  };

  // Generate Scene Image Preview using 100% free Pollinations or Gemini
  const handleGenerateImagePreview = async (scene: SceneData) => {
    setGeneratingSceneId(scene.id);
    try {
      const res = await fetch('/api/projects/generate-scene-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: scene.englishImagePrompt || scene.arabicImagePrompt,
          visualType: scene.visualType,
          engine: imageEngine,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.imageUrl) {
        throw new Error(json.error || 'فشل توليد معاينة الصورة');
      }

      const updatedScenes = scenes.map(s =>
        s.id === scene.id ? { ...s, imageUrl: json.imageUrl, generationStatus: 'generated' as const } : s
      );

      onUpdateProject({
        ...project,
        updatedAt: new Date().toISOString(),
        scenes: updatedScenes,
      });
    } catch (err: any) {
      alert(err.message || 'لم نتمكن من توليد معاينة الصورة');
    } finally {
      setGeneratingSceneId(null);
    }
  };

  // Update visual type or prompt directly
  const handleUpdateScene = (sceneId: string, updates: Partial<SceneData>) => {
    const updatedScenes = scenes.map(s => (s.id === sceneId ? { ...s, ...updates } : s));
    onUpdateProject({
      ...project,
      updatedAt: new Date().toISOString(),
      scenes: updatedScenes,
    });
  };

  const handleCopyPrompt = (sceneId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSceneId(sceneId);
    setTimeout(() => setCopiedSceneId(null), 2000);
  };

  return (
    <div className="space-y-6">
      
      {/* Control Banner with AI Provider & Image Engine Selectors */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-lg">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Clapperboard className="w-5 h-5 text-amber-400" />
              <h2 className="text-base font-bold text-slate-100">تخطيط المشاهد البصرية وإشارات الصور (Scene & Image Prompts)</h2>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 mr-2">
                مرحلة مستقلة
              </span>
            </div>
            <p className="text-xs text-slate-400">
              تحويل فقرات السيناريو المعتمدة إلى مشاهد زمنية محددة التوقيت بأسلوب أنمي ورسوم توضيحية بسيطة بدون أي تكاليف.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Scenes Planning Provider Selector */}
            <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs">
              <span className="text-slate-400 font-semibold px-1">تخطيط المشاهد:</span>
              <button
                type="button"
                onClick={() => setScenesProvider('ollama')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  scenesProvider === 'ollama' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Ollama (مجاني)
              </button>
              <button
                type="button"
                onClick={() => setScenesProvider('gemini')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  scenesProvider === 'gemini' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Gemini
              </button>
            </div>

            {/* Image Preview Engine Selector */}
            <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs">
              <span className="text-slate-400 font-semibold px-1">توليد الصور:</span>
              <button
                type="button"
                onClick={() => setImageEngine('pollinations')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  imageEngine === 'pollinations' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Pollinations (100% مجاني)
              </button>
              <button
                type="button"
                onClick={() => setImageEngine('gemini')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  imageEngine === 'gemini' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Gemini Image
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/80 pt-4">
          {scenes.length > 0 ? (
            <button
              onClick={() => downloadBlob(generateScenesJSON(scenes), `scenes_${project.id}.json`, 'application/json')}
              className="px-3.5 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-colors flex items-center justify-center gap-1.5"
            >
              <FileCode className="w-4 h-4 text-purple-400" />
              <span>تصدير ملف المشاهد (JSON)</span>
            </button>
          ) : <div />}

          <button
            onClick={handleGenerateScenes}
            disabled={loading || scriptSections.length === 0}
            className="flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-700 disabled:text-slate-500 rounded-xl shadow-lg shadow-amber-500/10 transition-all"
          >
            <Sparkles className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'جاري تقسيم المشاهد وتصاوير البصريات...' : 'توليد خطة المشاهد من السيناريو'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300">
          {error}
        </div>
      )}

      {/* Non-Photorealistic Discipline Reminder Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 text-xs text-slate-300 flex items-center gap-3">
        <ImageIcon className="w-5 h-5 text-amber-400 shrink-0" />
        <p>
          <strong className="text-amber-300">دستور التخطيط البصري في رِواق:</strong> نوصي باستخدام الرسومات التوضيحية الأندلسية، الخرائط التاريخية التفاعلية، الرسوم الكرتونية الأنيقة، والمخططات البيانات. نبتعد تماماً عن الصور الفوتوغرافية المزيفة أو الواقعية المفرطة.
        </p>
      </div>

      {/* Scenes List */}
      <div className="space-y-4">
        {scenes.length === 0 ? (
          <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
            <Clapperboard className="w-8 h-8 text-slate-600 mx-auto" />
            <h3 className="text-sm font-bold text-slate-300">لم يتم تقطيع المشاهد البصرية بعد</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              اضغط على "توليد خطة المشاهد من السيناريو" لإنشاء الجدول الزمني التفاعلي وإشارات الصور (Prompts) لكل مقطع.
            </p>
          </div>
        ) : (
          scenes.map((scene, idx) => {
            const isPreviewing = generatingSceneId === scene.id;

            return (
              <div
                key={scene.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 transition-all hover:border-slate-700"
              >
                {/* Scene Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-950 bg-amber-500 px-2.5 py-0.5 rounded-md tabular-nums">
                      المشهد {scene.sceneNumber || idx + 1}
                    </span>

                    <span className="font-mono text-xs font-bold text-slate-200 bg-slate-800 px-2.5 py-0.5 rounded tabular-nums border border-slate-700">
                      {scene.startTimeCode} - {scene.endTimeCode} ({scene.durationSeconds} ثانية)
                    </span>
                  </div>

                  {/* Visual Type Selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">نوع البصريات:</span>
                    <select
                      value={scene.visualType}
                      onChange={(e) => handleUpdateScene(scene.id, { visualType: e.target.value as VisualType })}
                      className="bg-slate-950 border border-slate-800 rounded-lg text-xs font-bold text-amber-400 px-2.5 py-1 focus:outline-none focus:border-amber-500"
                    >
                      {VISUAL_TYPES.map(vt => (
                        <option key={vt.id} value={vt.id}>
                          {vt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Narration Text Excerpt */}
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-slate-400 block">نص القراءة الصوتي للمشهد:</span>
                  <p className="text-xs text-slate-200 bg-slate-950 p-3 rounded-xl border border-slate-800/80 leading-relaxed font-sans">
                    "{scene.narrationText}"
                  </p>
                </div>

                {/* Grid layout: Prompts & Preview Image */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-2">
                  
                  {/* Left Column (2 cols): Prompts */}
                  <div className="lg:col-span-2 space-y-3">
                    
                    {/* Arabic Image Prompt */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-amber-400">إشارة الصورة بالعربية (Arabic Prompt):</span>
                        <button
                          onClick={() => handleCopyPrompt(scene.id, scene.arabicImagePrompt)}
                          className="flex items-center gap-1 text-slate-400 hover:text-slate-100 transition-colors"
                        >
                          {copiedSceneId === scene.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedSceneId === scene.id ? 'تم النسخ' : 'نسخ الوصف'}</span>
                        </button>
                      </div>

                      <textarea
                        rows={2}
                        value={scene.arabicImagePrompt}
                        onChange={(e) => handleUpdateScene(scene.id, { arabicImagePrompt: e.target.value })}
                        className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    {/* English Image Prompt */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-slate-400">English Prompt (لأدوات التوليد الخارجية):</span>
                      </div>

                      <textarea
                        rows={2}
                        dir="ltr"
                        value={scene.englishImagePrompt}
                        onChange={(e) => handleUpdateScene(scene.id, { englishImagePrompt: e.target.value })}
                        className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 font-mono focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    {/* Source Requirements */}
                    <div className="text-xs text-slate-400">
                      <strong>متطلبات المصادر البصرية:</strong> {scene.sourceRequirements || 'مرجع أثري أو أطلس تاريخي'}
                    </div>

                  </div>

                  {/* Right Column (1 col): Image Preview Container */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-semibold text-slate-400 block">معاينة الصورة البصرية:</span>
                    
                    <div className="aspect-video bg-slate-950 border border-slate-800 rounded-xl overflow-hidden relative flex flex-col items-center justify-center text-center p-3">
                      {scene.imageUrl ? (
                        <img
                          src={scene.imageUrl}
                          alt={`Scene ${scene.sceneNumber}`}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <div className="space-y-2 text-slate-500">
                          <ImageIcon className="w-8 h-8 mx-auto stroke-1" />
                          <span className="text-[11px] block">لا توجد صورة معاينة جارية</span>
                        </div>
                      )}

                      {/* Overlay action button */}
                      <button
                        onClick={() => handleGenerateImagePreview(scene)}
                        disabled={isPreviewing}
                        className="mt-2 flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-lg shadow-md transition-colors"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isPreviewing ? 'animate-spin' : ''}`} />
                        <span>{isPreviewing ? 'جاري التوليد...' : scene.imageUrl ? 'إعادة التوليد' : 'توليد معاينة بـ AI'}</span>
                      </button>
                    </div>
                  </div>

                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
