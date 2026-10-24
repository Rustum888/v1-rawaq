# 📊 تقرير المعمارية والدليل التشغيلي الشامل لمشروع "رِواق" (Riwaq Arabic Documentary Production)

**تاريخ التقرير:** 24 أكتوبر 2026  
**المعد:** المهندس المسؤول وقائد تطوير منصة "رِواق"  
**مدير الحزم المعترف به:** `npm`  

---

## 1. التثبيت والتشغيل السريع (Installation & Quickstart)

لتثبيت وتشغيل تطبيق **رِواق** محلياً على جهازك باستخدام `npm`:

```bash
# 1. تثبيت الحزم والاعتماديات
npm install

# 2. تشغيل خادم التطبيق وتحديث العميل
npm run dev
```

التطبيق يعمل ببيئة Express + Vite على الميناء `http://localhost:3000`.

---

## 2. إعداد وتأكيد Ollama المحلي (Ollama Setup)

لتشغيل نموذج **qwen3.5:4b** المحلي لصياغة السيناريو وتخطيط المشاهد:

```bash
# 1. عرض النماذج المثبتة
ollama list

# 2. سحب النموذج المستهدف
ollama pull qwen3.5:4b

# 3. تشغيل خادم Ollama (تنبيه: لا تقم بتشغيل هذا الأمر إذا كانت الخدمة تعمل بالفعل كـ Background Service في جهازك)
ollama serve
```

---

## 3. معمارية التطبيق وفصل مزودي الذكاء الاصطناعي (Provider Architecture)

| المرحلة البرمجية | المزود والمحرك المعلم | السياسة وقواعد العمل | وسم الاعتماد الميداني |
| :--- | :--- | :--- | :--- |
| **مرحلة البحث والموثوقية** | Gemini 3.8 Flash + Google Search Grounding | يُستخدم فقط عند وجود `GEMINI_API_KEY`. عند غيابه يعمل **البحث اليدوي** فقط، ولا يُستخدم Ollama إطلاقاً كبديل للبحث على الإنترنت. | `VERIFIED IN CODE` / `MANUAL RESEARCH` |
| **مرحلة صياغة السيناريو** | Local Ollama (`qwen3.5:4b`) | صياغة السيناريو تتم **حصراً عبر Ollama المحلي**. يُحظر استخدام Gemini إطلاقاً في السيناريو، ويُرفض أي طلب بدون أدلة معتمدة بكود `400`. | `VERIFIED IN CODE` / `USER ACTION REQUIRED` |
| **مرحلة تخطيط المشاهد** | Local Ollama (افتراضي) | تقطيع المشاهد يتم عبر Ollama افتراضياً. ولا يوجد أي fallback خفي لـ Gemini. | `VERIFIED IN CODE` |
| **معاينة الصور البصرية** | Pollinations.ai (مجاني) / Gemini Image | مفصولة عن توليد النصوص ويتم عرض اسم المزود الفعلي المستخدم بوضوح. | `VERIFIED IN CODE` |
| **التعليق الصوتي والنطق** | Local Piper / Custom TTS Endpoint | يتطلب اتصال خادم TTS محلي حقيقي وتستخرج نصوص `SSML` و `UTF-8`. | `USER ACTION REQUIRED` |
| **تجميع رندر الفيديو** | Video Manifest Schema | المنصة تصدر `video_manifest.json` للتجميع في برامج المونتاج مثل Shotcut/Premiere/Remotion. الرندر النهائي لـ MP4 غير مدمج داخل المتصفح. | `NOT IMPLEMENTED` |

---

## 4. جدول التحقق الميداني والاعتماد (Verification Matrix)

| خاصية النظام / المسار | الحالة الميدانية | الدليل البرمجي والملفات المفحوصة |
| :--- | :--- | :--- |
| **npm install & npm run dev** | `VERIFIED AT BUILD TIME` | تم التنفيذ وحل الاعتماديات و `esbuild ^0.28.2` بنجاح |
| **npm run lint & npm run build** | `VERIFIED AT BUILD TIME` | `tsc --noEmit` و `vite build` نجحا بكود خروج 0 |
| **Google Search Grounding Research** | `VERIFIED IN CODE` | `server.ts` يدعم `tools: [{ googleSearch: {} }]` لربط الأدلة حيّاً |
| **Manual Research Without Gemini Key** | `MANUAL RESEARCH` | إتاحة استمارة إدخال المصادر يدوياً ووسمها بـ *"Manual source — requires user review"* |
| **Script Generation (`POST /api/projects/script`)** | `VERIFIED IN CODE` | حظر الأدلة غير المعتمدة (HTTP 400)، مهلة 180 ثانية، إلغاء فوري بـ AbortController |
| **Scene Generation (`POST /api/projects/scenes`)** | `VERIFIED IN CODE` | استخدام Ollama افتراضياً مع مهلة 180 ثانية وعرض الحالة والوقت المنقضي |
| **Local TTS Audio Check (`POST /api/tts/synthesize`)** | `USER ACTION REQUIRED` | يتطلب إيقاد خادم Piper المحلي على جهاز المستخدم |
| **Final Video MP4 Rendering** | `NOT IMPLEMENTED` | غير مدمج داخل المتصفح، ويتم التجميع استناداً لبيان المونتاج المصدَّر |

---

## 5. حدود التشغيل والشبكة والأمان (Security & Limits)

1. **حماية أسرار البيئة:** مفتاح `GEMINI_API_KEY` يظل محفوفاً ببيئة الخادم فقط ولا يُكشف كود العميل مطلقاً.
2. **اتصال localhost:** يعمل خادم Ollama المباشر عبر `http://localhost:11434` عندما يعمل خادم رِواق محلياً على جهاز العميل.
3. **توليد السيناريو بـ Ollama:** المهلة المحددة لكل طلب صياغة أو مشاهد هي **180 ثانية (3 دقائق)** لمنح النماذج الضخمة وقتاً كافياً للمعالجة مع إمكانية الإلغاء في أي لحظة.
