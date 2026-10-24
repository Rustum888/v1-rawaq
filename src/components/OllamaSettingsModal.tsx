import React, { useState, useEffect } from 'react';
import { OllamaConfig } from '../types/project';
import { DEFAULT_OLLAMA_CONFIG } from '../data/demoProject';
import { 
  Cpu, 
  X, 
  RefreshCw, 
  Play, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Sliders, 
  Sparkles, 
  Server,
  Zap
} from 'lucide-react';

interface OllamaSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config?: OllamaConfig;
  onSaveConfig: (updated: OllamaConfig) => void;
}

export const OllamaSettingsModal: React.FC<OllamaSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
}) => {
  const currentConfig: OllamaConfig = config || DEFAULT_OLLAMA_CONFIG;

  const [enabled, setEnabled] = useState(currentConfig.enabled);
  const [baseUrl, setBaseUrl] = useState(currentConfig.baseUrl || 'http://localhost:11434');
  const [model, setModel] = useState(currentConfig.model || 'qwen3.5:4b');
  const [temperature, setTemperature] = useState(currentConfig.temperature ?? 0.3);
  const [systemPrompt, setSystemPrompt] = useState(currentConfig.systemPrompt);
  const [availableModels, setAvailableModels] = useState<string[]>(currentConfig.availableModels || ['qwen3.5:4b']);

  // Connection & Test state
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ isSuccess: boolean; text: string } | null>(null);
  const [testResponse, setTestResponse] = useState<{ content: string; durationMs: number; modelUsed: string } | null>(null);

  useEffect(() => {
    if (config) {
      setEnabled(config.enabled);
      setBaseUrl(config.baseUrl || 'http://localhost:11434');
      setModel(config.model || 'qwen3.5:4b');
      setTemperature(config.temperature ?? 0.3);
      setSystemPrompt(config.systemPrompt);
      setAvailableModels(config.availableModels || ['qwen3.5:4b']);
    }
  }, [config]);

  if (!isOpen) return null;

  // 1. Refresh Models from GET /api/tags
  const handleRefreshModels = async () => {
    setIsFetchingModels(true);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/ollama/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baseUrl }),
      });

      const json = await res.json();
      if (json.success && Array.isArray(json.models)) {
        setAvailableModels(json.models);
        if (json.models.length > 0 && !json.models.includes(model)) {
          setModel(json.models[0]);
        }
        setStatusMessage({
          isSuccess: true,
          text: `تم العثور على ${json.models.length} نموذج مثبت في خادم Ollama المحلي.`,
        });
      } else {
        setStatusMessage({
          isSuccess: false,
          text: json.error || 'فشل الاتصال بـ Ollama.',
        });
      }
    } catch (err: any) {
      setStatusMessage({
        isSuccess: false,
        text: 'خطأ في الاتصال بـ Ollama عبر خادم التطبيق.',
      });
    } finally {
      setIsFetchingModels(false);
    }
  };

  // 2. Test Ollama Request
  const handleTestOllama = async () => {
    setIsTesting(true);
    setStatusMessage(null);
    setTestResponse(null);

    const testPrompt = 'اكتب مقطوعة قصيرة من سطرين عن أهمية توثيق التاريخ العربي والعلوم.';

    try {
      const res = await fetch('/api/ollama/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseUrl,
          model,
          systemPrompt,
          prompt: testPrompt,
          temperature,
        }),
      });

      const json = await res.json();
      if (json.success && json.content) {
        setTestResponse({
          content: json.content,
          durationMs: json.durationMs,
          modelUsed: json.modelUsed || model,
        });
        setStatusMessage({
          isSuccess: true,
          text: `تم استلام الاستجابة الحقيقية بنجاح في ${json.durationMs} ملي ثانية!`,
        });
      } else {
        setStatusMessage({
          isSuccess: false,
          text: json.error || 'تعذر استلام استجابة من نموذج Ollama.',
        });
      }
    } catch (err: any) {
      setStatusMessage({
        isSuccess: false,
        text: 'خطأ في تنفيذ اختبار Ollama.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  // 3. Save Config
  const handleSave = () => {
    const updated: OllamaConfig = {
      enabled,
      baseUrl,
      model,
      temperature,
      systemPrompt,
      availableModels,
      lastConnectedAt: new Date().toISOString(),
      lastError: statusMessage && !statusMessage.isSuccess ? statusMessage.text : undefined,
    };
    onSaveConfig(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl my-8 p-6 sm:p-8 shadow-2xl space-y-6 text-right text-slate-100 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">إعدادات نموذج Ollama المحلي (Local Model qwen3.5:4b)</h2>
              <p className="text-xs text-slate-400">استخدام النموذج المحلي للصياغة وإعادة الكتابة والتخطيط فقط</p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Enable / Disable Toggle */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-slate-100 block">تفعيل خيار التوليد عبر Ollama المحلي</span>
            <span className="text-[11px] text-slate-400 block">
              يُستخدم فقط للمسودات وإعادة الصياغة وإشارات المشاهد. (البحث والتوثيق يظلان حكراً على Gemini Search Grounding).
            </span>
          </div>

          <button
            type="button"
            onClick={() => setEnabled(!enabled)}
            className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
              enabled ? 'bg-amber-500 justify-end' : 'bg-slate-800 justify-start'
            }`}
          >
            <div className="w-4 h-4 rounded-full bg-slate-950 shadow-md" />
          </button>
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                عنوان الخادم المحلي (Base URL)
              </label>
              <input
                type="text"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="http://localhost:11434"
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-500 dir-ltr text-left"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-300">
                  النموذج المحدد (Model)
                </label>
                <button
                  type="button"
                  onClick={handleRefreshModels}
                  disabled={isFetchingModels}
                  className="text-[10px] text-amber-400 hover:underline flex items-center gap-1"
                >
                  <RefreshCw className={`w-3 h-3 ${isFetchingModels ? 'animate-spin' : ''}`} />
                  <span>تحديث القائمة (/api/tags)</span>
                </button>
              </div>

              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-amber-300 focus:outline-none focus:border-amber-500"
              >
                {availableModels.length > 0 ? (
                  availableModels.map((m) => (
                    <option key={m} value={m}>
                      {m} {m.includes('qwen3.5') ? '★ (مستهدف)' : ''}
                    </option>
                  ))
                ) : (
                  <option value="qwen3.5:4b">qwen3.5:4b (افتراضي)</option>
                )}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              درجة حرارة التوليد (Temperature: {temperature})
            </label>
            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.05"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              التوجيه النظامي العربي (System Prompt)
            </label>
            <textarea
              rows={3}
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 leading-relaxed focus:outline-none focus:border-amber-500"
            />
          </div>

        </div>

        {/* Status Message Display */}
        {statusMessage && (
          <div className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
            statusMessage.isSuccess 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200' 
              : 'bg-red-500/10 border-red-500/30 text-red-200'
          }`}>
            {statusMessage.isSuccess ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Real Test Response Box */}
        {testResponse && (
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-400">
              <span className="font-bold text-amber-400">الاستجابة الحقيقية من {testResponse.modelUsed}:</span>
              <span className="font-mono text-emerald-400 tabular-nums">زمن الاستجابة: {testResponse.durationMs} ms</span>
            </div>
            <p className="text-slate-200 leading-relaxed bg-slate-900/90 p-3 rounded-lg border border-slate-800 font-sans">
              "{testResponse.content}"
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={handleTestOllama}
            disabled={isTesting}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-100 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 rounded-xl transition-colors shadow-lg shadow-purple-600/10"
          >
            <Zap className={`w-4 h-4 ${isTesting ? 'animate-spin' : ''}`} />
            <span>{isTesting ? 'جاري اختبار نموذج qwen3.5:4b...' : 'اختبار اتصال Ollama الحقيقي (Test Ollama)'}</span>
          </button>

          <div className="flex items-center gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs text-slate-400 hover:text-slate-200">
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2.5 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl transition-colors shadow-lg shadow-amber-500/10"
            >
              حفظ الإعدادات
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
