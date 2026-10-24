import React from 'react';
import { X, BookOpen, Server, Headphones, Film, ShieldAlert, Cpu } from 'lucide-react';

interface ReadmeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReadmeModal: React.FC<ReadmeModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl my-8 p-6 sm:p-8 shadow-2xl space-y-6 text-right text-slate-100 max-h-[85vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">دليل معمارية رِواق وعقد التكامل المحلي</h2>
              <p className="text-xs text-slate-400">توجيهات البرمجيات، النطق الصوتي، وبيان المونتاج</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content sections */}
        <div className="space-y-6 text-xs text-slate-300 leading-relaxed">
          
          {/* Section 0: Concrete Verification Matrix */}
          <div className="space-y-3 p-4 bg-slate-950 rounded-xl border border-slate-800">
            <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              تقرير التحقق والاعتماد الميداني (Verification Matrix)
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-right text-[11px] border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-1.5 px-2">خاصية النظام</th>
                    <th className="py-1.5 px-2">وسم الاعتماد (Evidence Label)</th>
                    <th className="py-1.5 px-2">الدليل البرمجي والتنفيذي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  <tr>
                    <td className="py-2 px-2 font-bold">1. Google Search Grounding Research</td>
                    <td className="py-2 px-2"><span className="bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-mono text-[10px]">VERIFIED IN CODE</span></td>
                    <td className="py-2 px-2 font-mono text-slate-400">Gemini 3.8 Flash + googleSearch tools في server.ts (اختياري عند توفر المفتاح)</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-2 font-bold">2. Manual Research without Gemini Key</td>
                    <td className="py-2 px-2"><span className="bg-sky-500/20 text-sky-400 px-1.5 py-0.5 rounded font-mono text-[10px]">MANUAL RESEARCH</span></td>
                    <td className="py-2 px-2">إدخال الأدلة والمصادر يدوياً مع وسمها بـ "Manual source — requires user review"</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-2 font-bold">3. Ollama Script Generation (/api/projects/script)</td>
                    <td className="py-2 px-2"><span className="bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-mono text-[10px]">VERIFIED IN CODE</span> <span className="bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded font-mono text-[10px]">USER ACTION REQUIRED</span></td>
                    <td className="py-2 px-2">صياغة السيناريو حصراً بـ Ollama (qwen3.5:4b) مع مهلة 180s وإلغاء فوري</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-2 font-bold">4. Zero Approved Claims Rejection</td>
                    <td className="py-2 px-2"><span className="bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-mono text-[10px]">VERIFIED IN CODE</span></td>
                    <td className="py-2 px-2">رفض الطلب بكود HTTP 400 وحظر إرسال أي أدلة غير معتمدة</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-2 font-bold">5. Scene Generation (/api/projects/scenes)</td>
                    <td className="py-2 px-2"><span className="bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-mono text-[10px]">VERIFIED IN CODE</span></td>
                    <td className="py-2 px-2">تقطيع المشاهد بـ Ollama افتراضياً ودون أي fallback خفي لـ Gemini</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-2 font-bold">6. Local Piper Neural TTS</td>
                    <td className="py-2 px-2"><span className="bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded font-mono text-[10px]">USER ACTION REQUIRED</span></td>
                    <td className="py-2 px-2">يتطلب إيقاد خادم Piper أو endpoint محلي على جهاز المستخدم</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-2 font-bold">7. Final Video MP4 Rendering</td>
                    <td className="py-2 px-2"><span className="bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded font-mono text-[10px]">NOT IMPLEMENTED</span></td>
                    <td className="py-2 px-2">يصدر التطبيق Video Manifest JSON للتجميع في Shotcut / Premiere / Remotion</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-2 font-bold">8. Build & Type-Check</td>
                    <td className="py-2 px-2"><span className="bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-mono text-[10px]">VERIFIED AT BUILD TIME</span></td>
                    <td className="py-2 px-2 font-mono text-slate-400">npm run lint &amp; npm run build بنجاح (Exit code 0)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 1: Quickstart Commands */}
          <div className="space-y-2 p-4 bg-slate-950 rounded-xl border border-slate-800">
            <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
              <Server className="w-4 h-4" />
              1. أوامر التشغيل وإعداد Ollama المحلي
            </h3>
            <p className="font-bold text-slate-200">تشغيل التطبيق:</p>
            <pre className="p-3 bg-slate-900 rounded-lg border border-slate-800 font-mono text-[11px] text-amber-300 dir-ltr text-left">
              npm install
              <br />
              npm run dev
            </pre>
            <p className="font-bold text-slate-200 pt-1">إعداد وتأكيد Ollama:</p>
            <pre className="p-3 bg-slate-900 rounded-lg border border-slate-800 font-mono text-[11px] text-purple-300 dir-ltr text-left">
              ollama list
              <br />
              ollama pull qwen3.5:4b
              <br />
              ollama serve  # (تنبيه: لا تقم بتشغيل ollama serve إذا كانت الخدمة تعمل بالفعل كـ background service)
            </pre>
          </div>

          {/* Section 2: Local TTS Contract */}
          <div className="space-y-2 p-4 bg-slate-950 rounded-xl border border-slate-800">
            <h3 className="text-sm font-bold text-pink-400 flex items-center gap-2">
              <Headphones className="w-4 h-4" />
              2. عقد الاتصال مع محركات التعليق الصوتي المحلية (Local TTS Contract)
            </h3>
            <p>
              تطبيق <strong>رِواق</strong> ينتهج الشفافية الصارمة، ولا يزعم توليد ملفات صوتية وهمية عندما لا يكون المحرك المحلي متصلاً.
            </p>
            <p className="text-slate-400 font-mono text-[11px] dir-ltr text-left bg-slate-900 p-3 rounded-lg border border-slate-800 text-slate-200">
              POST http://localhost:PORT/api/tts
              <br />
              Content-Type: application/json
              <br /><br />
              &#123;
              <br />
              &nbsp;&nbsp;"text": "نص الفقرة المراد إلقاؤها بالنطق العربي...",
              <br />
              &nbsp;&nbsp;"voice": "ar_JO-kaled-medium",
              <br />
              &nbsp;&nbsp;"speed": 1.0
              <br />
              &#125;
            </p>
            <p>
              <strong>استجابة المحرك المتوقعة:</strong> يعيد المحرك استجابة بحمولة صنيعة WAV/MP3 في حقل binary أو Base64. كما يتيح التطبيق تصدير النصوص بصيغة <code>.ssml</code> و <code>.txt</code> لإدخالها يدوياً في Piper أو ElevenLabs أو Edge-TTS.
            </p>
          </div>

          {/* Section 3: Video Manifest Schema */}
          <div className="space-y-2 p-4 bg-slate-950 rounded-xl border border-slate-800">
            <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
              <Film className="w-4 h-4" />
              3. بنيان بيان المونتاج (Video Manifest JSON Schema)
            </h3>
            <p>
              يصدر المنصة ملف <code>video_manifest.json</code> لتمريره برمجياً لمحررات الفيديو مثل Shotcut أو Remotion أو سكريبتات FFmpeg/Premiere.
            </p>
            <pre className="text-[11px] font-mono dir-ltr text-left bg-slate-900 p-3 rounded-lg border border-slate-800 text-emerald-300 overflow-x-auto">
{`{
  "project": {
    "title": "لماذا سقطت الأندلس؟",
    "targetDurationMinutes": 12
  },
  "scenes": [
    {
      "sceneId": "scene-1",
      "startTimeCode": "00:00",
      "endTimeCode": "00:36",
      "durationSeconds": 36,
      "narrationText": "في الثاني من يناير عام 1492م...",
      "visualType": "illustration",
      "arabicImagePrompt": "رسم توضيحي لأسوار قصر الحمراء...",
      "imageFile": "assets/images/scene_1.png",
      "audioFile": "assets/audio/scene_1.wav"
    }
  ]
}`}
            </pre>
          </div>

          {/* Section 4: Limitations & Guidelines */}
          <div className="space-y-2 p-4 bg-amber-500/10 rounded-xl border border-amber-500/30 text-amber-200">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              4. حدود الإصدار الأول والتوجيهات
            </h3>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-amber-300/90">
              <li>البحث المدعوم بالربط المباشر يزيد من درجة التوثيق ولكنه لا يغني عن المراجعة الأكاديمية البشرية.</li>
              <li>يرفض النظام توليد صور واقعية مفرطة للشخصيات التاريخية ويشجع الرسومات والتصاميم والخرائط التعليمية المسطحة.</li>
              <li>الرندر النهائي للفيديو كملف MP3/MP4 يتم خارج المتصفح بوساطة برامج المونتاج المعتمدة استناداً لبيان المونتاج المصدَّر.</li>
            </ul>
          </div>

        </div>

        {/* Footer */}
        <div className="flex justify-end pt-4 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl transition-colors"
          >
            فهمت التوجيهات
          </button>
        </div>

      </div>
    </div>
  );
};
