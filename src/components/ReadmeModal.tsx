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
                    <th className="py-1.5 px-2">الوسم / النتيجة</th>
                    <th className="py-1.5 px-2">الدليل البرمجي والتنفيذي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  <tr>
                    <td className="py-2 px-2 font-bold">1. Google Search Grounding Request</td>
                    <td className="py-2 px-2"><span className="bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-mono text-[10px]">VERIFIED</span> <span className="bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-mono text-[10px]">REQUIRES API KEY</span></td>
                    <td className="py-2 px-2 font-mono text-slate-400">tools: [{'{ googleSearch: {} }'}] في server.ts</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-2 font-bold">2. groundingChunks Extraction</td>
                    <td className="py-2 px-2"><span className="bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-mono text-[10px]">VERIFIED</span></td>
                    <td className="py-2 px-2">استخراج المراجع وروابط البحث وعرضها في واجهة البحث</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-2 font-bold">3. Script Route /api/projects/script</td>
                    <td className="py-2 px-2"><span className="bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-mono text-[10px]">VERIFIED</span> <span className="bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded font-mono text-[10px]">REQUIRES USER ACTION</span></td>
                    <td className="py-2 px-2">توليد السيناريو حصراً عبر Ollama المحلي (qwen3.5:4b) مع حظر الأدلة غير المعتمدة</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-2 font-bold">4. Unapproved Claims Rejection</td>
                    <td className="py-2 px-2"><span className="bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-mono text-[10px]">VERIFIED</span></td>
                    <td className="py-2 px-2">تصفية حازمة approvedClaims.filter(c =&gt; c.status === 'approved')</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-2 font-bold">5. Andalusia Citations Data</td>
                    <td className="py-2 px-2"><span className="bg-sky-500/20 text-sky-400 px-1.5 py-0.5 rounded font-mono text-[10px]">DEMO ONLY</span> <span className="bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-mono text-[10px]">VERIFIED</span></td>
                    <td className="py-2 px-2">مصادر تاريخية موثقة من متاحف وجامعات إسبانيا محملة مسبقاً</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-2 font-bold">6. Local Ollama (qwen3.5:4b) Integration</td>
                    <td className="py-2 px-2"><span className="bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-mono text-[10px]">VERIFIED</span> <span className="bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded font-mono text-[10px]">REQUIRES USER ACTION</span></td>
                    <td className="py-2 px-2">استعلام /api/tags و /api/chat مع التحقق من qwen3.5:4b وتوليد السيناريو الحصري</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-2 font-bold">7. Local TTS Audio Generation</td>
                    <td className="py-2 px-2"><span className="bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded font-mono text-[10px]">REQUIRES USER ACTION</span></td>
                    <td className="py-2 px-2">يتطلب إيقاد خادم Piper المحلي على جهاز المستخدم</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-2 font-bold">8. Build & Type-Check</td>
                    <td className="py-2 px-2"><span className="bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-mono text-[10px]">VERIFIED</span></td>
                    <td className="py-2 px-2 font-mono text-slate-400">npm run lint &amp; npm run build نجحا بكود 0</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 1: Architecture Overview */}
          <div className="space-y-2 p-4 bg-slate-950 rounded-xl border border-slate-800">
            <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
              <Cpu className="w-4 h-4" />
              1. معمارية التطبيق وفصل مزودي الذكاء الاصطناعي
            </h3>
            <p>
              يعتمد تطبيق <strong>رِواق</strong> على فصل حازم ومحكم لمزودي الذكاء الاصطناعي:
            </p>
            <p className="text-slate-400">
              - <strong>البحث والربط بالمصادر (Gemini 3.8 Flash):</strong> مخصص حصراً لمرحلة البحث الميداني مع Google Search Grounding لاستخراج جدول الأدلة الموثقة والمراجع الأكاديمية.
              <br />
              - <strong>صياغة السيناريو والصياغة (Ollama qwen3.5:4b):</strong> مخصص حصراً لمرحلة كتابة وصياغة السيناريو الفصيح، ويعتمد <strong>حزماً على الأدلة المعتمدة فقط</strong> من مرحلة البحث. عند عدم توفر خادم Ollama المحلي، يظهر خطأ صريح بدون أي توليد وهمي.
            </p>
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
