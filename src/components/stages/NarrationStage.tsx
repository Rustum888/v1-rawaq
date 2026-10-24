import React, { useState } from 'react';
import { Project, TTSProvider } from '../../types/project';
import { 
  Mic, 
  Settings, 
  Download, 
  Server, 
  Play, 
  AlertCircle, 
  CheckCircle2, 
  Headphones, 
  FileText, 
  Sparkles, 
  Volume2 
} from 'lucide-react';
import { downloadBlob, generateNarrationText, generateNarrationSSML } from '../../utils/exporters';

interface NarrationStageProps {
  project: Project;
  onUpdateProject: (updated: Project) => void;
}

export const NarrationStage: React.FC<NarrationStageProps> = ({
  project,
  onUpdateProject,
}) => {
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionMessage, setConnectionMessage] = useState<{ isConnected: boolean; text: string } | null>(null);

  const narration = project.narration;
  const scriptSections = project.script.sections || [];

  // Update narration provider settings
  const handleUpdateNarration = (updates: Partial<typeof narration>) => {
    onUpdateProject({
      ...project,
      updatedAt: new Date().toISOString(),
      narration: { ...narration, ...updates },
    });
  };

  // Test local TTS endpoint
  const handleTestConnection = async () => {
    if (narration.provider === 'not_connected') {
      setConnectionMessage({
        isConnected: false,
        text: 'يرجى اختيار مزود صوتي محلي مثل Local Piper أو Local Custom Endpoint أولاً.',
      });
      return;
    }

    setTestingConnection(true);
    setConnectionMessage(null);

    try {
      const sampleText = 'هذا تجريب لنظام التعليق الصوتي العربي في منصة رِواق.';
      const res = await fetch('/api/tts/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: sampleText,
          endpointUrl: narration.endpointUrl,
          voiceName: narration.voiceName,
          speedRate: narration.speedRate,
        }),
      });

      const json = await res.json();
      if (json.connected) {
        setConnectionMessage({
          isConnected: true,
          text: 'تم الاتصال بمحرك التوليد الصوتي المحلي بنجاح!',
        });
      } else {
        setConnectionMessage({
          isConnected: false,
          text: json.message || 'لم نتمكن من الوصول للمحرك المحلي. استعرض دليل المعمارية لإيقاد الخادم.',
        });
      }
    } catch (e: any) {
      setConnectionMessage({
        isConnected: false,
        text: 'خطأ في اختبار خادم الصوت المحلي.',
      });
    } finally {
      setTestingConnection(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Control Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Mic className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-slate-100">إعدادات ونصوص التعليق الصوتي (Arabic Narration Script)</h2>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 mr-2">
              مرحلة مستقلة
            </span>
          </div>
          <p className="text-xs text-slate-400">
            تجهيز نصوص النطق بصيغ UTF-8 و SSML، وتوصيل المحرك الصوتي المحلي (Local Piper / Custom TTS Endpoint) دون ادعاء وهمي للتوليد.
          </p>
        </div>

        {/* Quick Export Downloads */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => downloadBlob(generateNarrationText(scriptSections), `narration_${project.id}.txt`)}
            className="px-3.5 py-2.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5"
          >
            <FileText className="w-4 h-4 text-amber-400" />
            <span>نص UTF-8</span>
          </button>

          <button
            onClick={() => downloadBlob(generateNarrationSSML(project), `narration_${project.id}.ssml`, 'application/ssml+xml')}
            className="px-3.5 py-2.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5"
          >
            <Headphones className="w-4 h-4 text-pink-400" />
            <span>تصدير SSML</span>
          </button>
        </div>
      </div>

      {/* Provider Abstraction Settings Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
        <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3">
          <Settings className="w-4 h-4 text-amber-400" />
          <span>تحديد مزود خدمة التعليق الصوتي المحلي (TTS Provider Abstraction)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Provider Option: Not Connected */}
          <button
            type="button"
            onClick={() => handleUpdateNarration({ provider: 'not_connected' })}
            className={`p-4 rounded-xl border text-right transition-all flex flex-col justify-between space-y-2 ${
              narration.provider === 'not_connected'
                ? 'bg-amber-500/10 border-amber-500/50 text-amber-200'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs">غير متصل (Not Connected)</span>
              {narration.provider === 'not_connected' && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              المواصفات القياسية الافتراضية. يمكنك تصدير النصوص يدوياً أو التقديم الصوتي البشري.
            </p>
          </button>

          {/* Provider Option: Local Piper */}
          <button
            type="button"
            onClick={() => handleUpdateNarration({ provider: 'piper_local' })}
            className={`p-4 rounded-xl border text-right transition-all flex flex-col justify-between space-y-2 ${
              narration.provider === 'piper_local'
                ? 'bg-amber-500/10 border-amber-500/50 text-amber-200'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs">Local Piper Neural TTS</span>
              {narration.provider === 'piper_local' && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              محرك خفيف وسريع يعمل محلياً على جهازك لتوليد الصوت العربي دون إنترنت.
            </p>
          </button>

          {/* Provider Option: Local Custom Endpoint */}
          <button
            type="button"
            onClick={() => handleUpdateNarration({ provider: 'custom_endpoint' })}
            className={`p-4 rounded-xl border text-right transition-all flex flex-col justify-between space-y-2 ${
              narration.provider === 'custom_endpoint'
                ? 'bg-amber-500/10 border-amber-500/50 text-amber-200'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs">Local Custom TTS Endpoint</span>
              {narration.provider === 'custom_endpoint' && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              الاتصال بخادمك الخاص عبر واجهة برمجة تطبيقات خفيفة (e.g. http://localhost:5000).
            </p>
          </button>

        </div>

        {/* Integration Details Form if Connected */}
        {narration.provider !== 'not_connected' && (
          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4 pt-4">
            <h4 className="text-xs font-bold text-amber-400 flex items-center gap-2">
              <Server className="w-4 h-4" />
              <span>إعدادات خادم الصوت المحلي</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  عنوان خادم الصوت (Endpoint URL)
                </label>
                <input
                  type="text"
                  value={narration.endpointUrl}
                  onChange={(e) => handleUpdateNarration({ endpointUrl: e.target.value })}
                  placeholder="http://localhost:5000/api/tts"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  اسم الصوت / النموذج (Voice Name)
                </label>
                <input
                  type="text"
                  value={narration.voiceName}
                  onChange={(e) => handleUpdateNarration({ voiceName: e.target.value })}
                  placeholder="ar_JO-kaled-medium"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  سرعة الإلقاء (Speed Rate: {narration.speedRate}x)
                </label>
                <input
                  type="range"
                  min="0.8"
                  max="1.3"
                  step="0.05"
                  value={narration.speedRate}
                  onChange={(e) => handleUpdateNarration({ speedRate: parseFloat(e.target.value) })}
                  className="w-full accent-amber-500 cursor-pointer mt-2"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testingConnection}
                className="px-4 py-2 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl flex items-center gap-1.5 transition-colors"
              >
                <Play className="w-3.5 h-3.5 fill-slate-950" />
                <span>{testingConnection ? 'جاري اختبار الاتصال...' : 'اختبار خادم الصوت المحلي'}</span>
              </button>

              {connectionMessage && (
                <div className={`text-xs px-3 py-1.5 rounded-lg font-medium ${
                  connectionMessage.isConnected ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'
                }`}>
                  {connectionMessage.text}
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Honest Provider Status Callout */}
      {narration.provider === 'not_connected' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-start gap-3.5 text-slate-300">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <span className="font-bold text-slate-100 block">حالة التوصيل الصوتي الحالية: غير متصل (Not Connected)</span>
            <p>
              تنتهج منصة <strong>رِواق</strong> الشفافية الصارمة ولا تقوم بإنشاء ملفات صوتية وهمية. يمكنك تصدير نص القراءة المجهز بصيغتي UTF-8 و SSML لإدخالها في برامج التوليد الصوتي المفضلة لديك أو استخدام التقديم الصوتي البشري.
            </p>
          </div>
        </div>
      )}

      {/* Editable Split Narration Script Per Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-100">نصوص القراءة المقسمة حسب الأقسام</h3>

        {scriptSections.length === 0 ? (
          <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl text-xs text-slate-500">
            لم يتم إضافة نصوص سيناريو بعد. قم بصياغة السيناريو أولاً.
          </div>
        ) : (
          scriptSections.map((sec, idx) => (
            <div key={sec.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-xs">
                <span className="font-bold text-slate-200">
                  {idx + 1}. {sec.title}
                </span>
                <span className="text-slate-400 tabular-nums">
                  {sec.wordCount} كلمة | ~{sec.estimatedDurationSeconds} ثانية
                </span>
              </div>

              <textarea
                rows={3}
                value={sec.content}
                onChange={(e) => {
                  const newContent = e.target.value;
                  const updatedSections = scriptSections.map(s => s.id === sec.id ? { ...s, content: newContent } : s);
                  onUpdateProject({
                    ...project,
                    updatedAt: new Date().toISOString(),
                    script: { ...project.script, sections: updatedSections },
                  });
                }}
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-200 leading-relaxed font-sans focus:outline-none focus:border-amber-500"
              />
            </div>
          ))
        )}
      </div>

    </div>
  );
};
