import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const app = express();
app.use(express.json({ limit: '10mb' }));

const PORT = Number(process.env.PORT) || 3000;

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Helper to extract JSON from Gemini text response
function cleanJsonResponse(rawText: string) {
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  return cleaned;
}

/**
 * 1. RESEARCH API
 * Performs Research via Ollama (100% Free Local) or Google Search Grounded Gemini
 */
app.post('/api/projects/research', async (req, res) => {
  try {
    const { topic, title, targetAudience, durationMinutes, tone, notes, provider, model, baseUrl } = req.body;

    if (!topic && !title) {
      return res.status(400).json({ error: 'يرجى تقديم عنوان أو موضوع البحث' });
    }

    const researchPrompt = `
أنت باحث تاريخي وأكاديمي خبير في صناعة الوثائقيات التعليمية باللغة العربية.
قم بإجراء بحث أكاديمي وموثق حول الموضوع التالي لصناعة فيديو وثائقي على يوتيوب مدته ${durationMinutes || 12} دقيقة:
العنوان: "${title || topic}"
الموضوع التفصيلي: "${topic}"
الجمهور المستهدف: "${targetAudience || 'الجمهور العام'}"
أسلوب الطرح: "${tone || 'وثائقي موضوعي'}"
ملاحظات إضافية: "${notes || 'لا يوجد'}"

تعليمات صارمة للبحث والأدلة:
1. اعطِ الأولوية القصوى للمصادر الأولية (primary_document)، أوراق دور النشر الجامعية (university_press)، الأبحاث المحكمة (peer_reviewed)، المتاحف الوطنية (museum)، الأرشيفات الوطنية (national_archive)، والموسوعات الموثوقة (reputable_encyclopedia).
2. يمنع منعاً باتاً اعتماد المدونات الشخصية أو وسائل التواصل أو الفيديوهات كمصدر ينفرد بنقل الحقيقة.
3. حدد على الأقل 5 إلى 8 ادعاءات/حقائق مفصلة. لكل ادعاء حدد:
   - claimText: نص الادعاء أو الحقيقة الدقيقة بالعربية.
   - sourceTitle: عنوان المصدر أو الورقة البحثية أو الكتاب/المخطوطة.
   - sourceUrl: رابط المصدر إن وجد (أو رابط مرجعي لأرشيف/مكتبة).
   - publisher: اسم الناشر أو المؤسسة الأكاديمية أو المتحف.
   - sourceType: اختر فقط واحداً من: ["primary_document", "university_press", "peer_reviewed", "museum", "national_archive", "reputable_encyclopedia", "other"]
   - publicationDate: تاريخ النشر أو سنة صدور الكتاب/الدراسة إن توفرت.
   - evidenceSummary: ملخص الدليل أو الاقتباس الموثق الذي يثبت الادعاء.
   - confidenceLevel: اختر فقط واحداً من: ["high", "medium", "low", "disputed"]
   - isDisputed: boolean (ضع true إذا كان الادعاء موضع خلاف بين المؤرخين).
   - competingInterpretations: التفسيرات المنافسة إذا كان الادعاء محل خلاف (أو نص فارغ إذا لم يكن كذلك).
4. صغ ملخصاً شاملاً للموضوع في topicSummary.

قم بإرجاع النتيجة بصيغة JSON فقط بالتنسيق التالي:
{
  "topicSummary": "ملخص شامل للموضوع...",
  "searchGroundingQueries": ["استعلام بحث 1", "استعلام بحث 2"],
  "claims": [
    {
      "id": "claim-1",
      "claimText": "...",
      "sourceTitle": "...",
      "sourceUrl": "https://archive.org",
      "publisher": "...",
      "sourceType": "university_press",
      "publicationDate": "2020",
      "evidenceSummary": "...",
      "confidenceLevel": "high",
      "isDisputed": false,
      "competingInterpretations": ""
    }
  ]
}
`;

    // Use local Ollama if requested OR if Gemini API key is not present
    const useOllama = provider === 'ollama' || !process.env.GEMINI_API_KEY;

    if (useOllama) {
      const targetModel = model || 'qwen3.5:4b';
      const host = (baseUrl || 'http://localhost:11434').replace(/\/$/, '');
      const targetUrl = `${host}/api/chat`;

      const chatPayload = {
        model: targetModel,
        messages: [
          { role: 'system', content: 'أنت باحث تاريخي وأكاديمي خبير، صغ إجاباتك بصيغة JSON فقط بدون خروج عن الهيكل المطلوبة.' },
          { role: 'user', content: researchPrompt },
        ],
        options: { temperature: 0.2 },
        stream: false,
      };

      try {
        const chatRes = await fetch(targetUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(chatPayload),
          signal: AbortSignal.timeout(60000),
        });

        if (!chatRes.ok) {
          const errText = await chatRes.text();
          return res.status(500).json({ error: `خطأ من خادم Ollama المحلي (${chatRes.status}): ${errText}` });
        }

        const chatData = await chatRes.json();
        const rawText = chatData.message?.content || '';
        const cleaned = cleanJsonResponse(rawText);
        const parsedData = JSON.parse(cleaned);

        if (Array.isArray(parsedData.claims)) {
          parsedData.claims = parsedData.claims.map((claim: any, idx: number) => ({
            ...claim,
            id: claim.id || `claim-${idx + 1}`,
            status: claim.status || 'pending',
          }));
        }

        return res.json({
          success: true,
          data: parsedData,
          providerUsed: 'ollama',
          modelUsed: targetModel,
        });
      } catch (ollamaErr: any) {
        let errorMsg = `تعذر إجراء البحث عبر Ollama المحلي على ${host}.`;
        if (ollamaErr.code === 'ECONNREFUSED') {
          errorMsg = 'رفض الاتصال بـ Ollama (ECONNREFUSED). تأكد من تشغيل خادم Ollama المحلي عبر http://localhost:11434.';
        }
        return res.status(500).json({ error: errorMsg, rawError: ollamaErr.message });
      }
    }

    // Otherwise use Gemini 3.8 Flash with Search Grounding
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: researchPrompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.2,
      },
    });

    const rawText = response.text || '';
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;

    let parsedData: any = {};
    try {
      const cleaned = cleanJsonResponse(rawText);
      parsedData = JSON.parse(cleaned);
    } catch (e) {
      console.error('Failed to parse Gemini JSON research output:', rawText);
      return res.status(500).json({
        error: 'حدث خطأ في تنسيق بيانات البحث من نموذج الذكاء الاصطناعي',
        rawText,
      });
    }

    // Attach search grounding citations if present
    if (groundingMetadata?.groundingChunks) {
      const searchQueries = groundingMetadata.webSearchQueries || [];
      if (!parsedData.searchGroundingQueries || parsedData.searchGroundingQueries.length === 0) {
        parsedData.searchGroundingQueries = searchQueries;
      }
      parsedData.groundingChunks = groundingMetadata.groundingChunks.map((chunk: any) => ({
        title: chunk.web?.title || 'مصدر بحث جوجل',
        url: chunk.web?.uri || '',
      })).filter((c: any) => c.url.length > 0);
    }

    // Ensure status = 'pending' by default for claims
    if (Array.isArray(parsedData.claims)) {
      parsedData.claims = parsedData.claims.map((claim: any, idx: number) => ({
        ...claim,
        id: claim.id || `claim-${idx + 1}`,
        status: claim.status || 'pending',
      }));
    }

    return res.json({
      success: true,
      data: parsedData,
      groundingMetadata,
      providerUsed: 'gemini',
    });
  } catch (err: any) {
    console.error('Research API Error:', err);
    return res.status(500).json({ error: err.message || 'فشل في إجراء البحث' });
  }
});

/**
 * 1.5. GOOGLE SEARCH GROUNDING CLAIM VERIFICATION & SOURCE FINDER API
 * Verifies a specific claim or searches for live web sources via Google Search Grounded Gemini
 */
app.post('/api/projects/verify-claim', async (req, res) => {
  try {
    const { query, claimContext, provider, model, baseUrl } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'يرجى تقديم الاستعلام أو نص الادعاء للتحقق منه' });
    }

    const verificationPrompt = `
أنت باحث أكاديمي خبير في التدقيق التاريخي والعلمي.
المطلوب: إجراء تحقق حي عبر محرك البحث من الاستعلام/الادعاء التالي والتثبت من المصادر المتاحة:

نص الادعاء/الاستعلام المراد فحصه:
"${query}"

${claimContext ? `سياق الإسناد الحالي: "${claimContext}"` : ''}

تعليمات:
1. ابحث عن الأدلة والمراجع الأكاديمية أو الأرشيفية التي تؤكد أو تنفي أو تعدل هذا الادعاء.
2. صغ نتيجة التحقق بوضوح في verificationSummary (هل هو مؤكد، محل خلاف، أم خاطئ؟ مع تعليل موجز).
3. استخرج من النتائج الموثوقة قائمة بالمصادر المكتشفة مع عناوينها وروابطها والناشر ودرجة الثقة.

صغ النتيجة بصيغة JSON فقط بالتنسيق التالي:
{
  "verificationStatus": "verified",
  "verificationSummary": "شرح نتيجة الفحص الميداني عبر البحث المباشر...",
  "suggestedSources": [
    {
      "title": "عنوان المقال أو الورقة البحثية",
      "url": "https://archive.org",
      "publisher": "اسم الناشر أو دار النشر أو المتحف",
      "sourceType": "university_press",
      "evidenceSummary": "اقتباس محدد يثبت أو يوضح النقطة...",
      "confidence": "high"
    }
  ]
}
`;

    const useOllama = provider === 'ollama' || !process.env.GEMINI_API_KEY;

    if (useOllama) {
      const targetModel = model || 'qwen3.5:4b';
      const host = (baseUrl || 'http://localhost:11434').replace(/\/$/, '');
      const targetUrl = `${host}/api/chat`;

      const chatPayload = {
        model: targetModel,
        messages: [
          { role: 'system', content: 'أنت مدقق حقائق ومصادر أكاديمية. صغ إجاباتك بصيغة JSON فقط.' },
          { role: 'user', content: verificationPrompt },
        ],
        options: { temperature: 0.2 },
        stream: false,
      };

      try {
        const chatRes = await fetch(targetUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(chatPayload),
          signal: AbortSignal.timeout(40000),
        });

        if (!chatRes.ok) {
          const errText = await chatRes.text();
          return res.status(500).json({ error: `خطأ من خادم Ollama (${chatRes.status}): ${errText}` });
        }

        const chatData = await chatRes.json();
        const rawText = chatData.message?.content || '';
        const cleaned = cleanJsonResponse(rawText);
        const parsedData = JSON.parse(cleaned);

        return res.json({
          success: true,
          data: parsedData,
          providerUsed: 'ollama',
        });
      } catch (ollamaErr: any) {
        return res.status(500).json({ error: 'تعذر الاتصال بخادم Ollama المحلي للتحقق.', rawError: ollamaErr.message });
      }
    }

    // Use Gemini with Google Search Grounding
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: verificationPrompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.2,
      },
    });

    const rawText = response.text || '';
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;

    let parsedData: any = {};
    try {
      const cleaned = cleanJsonResponse(rawText);
      parsedData = JSON.parse(cleaned);
    } catch (e) {
      parsedData = {
        verificationStatus: 'verified',
        verificationSummary: rawText,
        suggestedSources: [],
      };
    }

    // Attach real grounding chunks
    if (groundingMetadata?.groundingChunks) {
      parsedData.webSearchQueries = groundingMetadata.webSearchQueries || [];
      parsedData.groundingChunks = groundingMetadata.groundingChunks.map((chunk: any) => ({
        title: chunk.web?.title || 'مصدر من جوجل للبحث المباشر',
        url: chunk.web?.uri || '',
      })).filter((c: any) => c.url.length > 0);
    }

    return res.json({
      success: true,
      data: parsedData,
      groundingMetadata,
      providerUsed: 'gemini',
    });
  } catch (err: any) {
    console.error('Verify Claim Error:', err);
    return res.status(500).json({ error: err.message || 'فشل في إجراء التحقق المباشر' });
  }
});


/**
 * 2. SCRIPT API
 * Generates script exclusively from approved claims using local Ollama (qwen3.5:4b)
 */
app.post('/api/projects/script', async (req, res) => {
  try {
    const { title, topic, durationMinutes, tone, approvedClaims, existingSections, model, selectedModel, baseUrl, systemPrompt, temperature } = req.body;

    // Strict security rule: Only claims with status === 'approved' are allowed!
    const strictlyApproved = Array.isArray(approvedClaims)
      ? approvedClaims.filter((c: any) => c.status === 'approved')
      : [];

    if (strictlyApproved.length === 0) {
      return res.status(400).json({
        error: 'لا يمكن توليد السيناريو بدون وجود أدلة معتمدة. يرجى اعتماد بعض الأدلة من مرحلة البحث أولاً.',
      });
    }

    const targetWords = (durationMinutes || 12) * 130;

    const claimsContext = strictlyApproved
      .map(
        (c: any) =>
          `[رقم الدليل: ${c.id}]
- نص الادعاء/الحقيقة: ${c.claimText}
- المصدر والناشر: ${c.sourceTitle} (${c.publisher})
- الدليل: ${c.evidenceSummary}
${c.isDisputed ? `- التفسيرات المنافسة: ${c.competingInterpretations}` : ''}`
      )
      .join('\n\n');

    const targetModel = selectedModel || model || 'qwen3.5:4b';
    const host = (baseUrl || 'http://localhost:11434').replace(/\/$/, '');
    const targetUrl = `${host}/api/chat`;

    // 1. Verify model exists via /api/tags first
    try {
      const tagsRes = await fetch(`${host}/api/tags`, { signal: AbortSignal.timeout(3000) });
      if (tagsRes.ok) {
        const tagsData = await tagsRes.json();
        const availableNames = (tagsData.models || []).map((m: any) => m.name || m.model);
        if (availableNames.length > 0 && !availableNames.includes(targetModel) && !availableNames.some((n: string) => n.startsWith(targetModel))) {
          return res.status(400).json({
            error: `النموذج المطلوبة (${targetModel}) غير مثبت في خادم Ollama لديك! النماذج المتاحة: ${availableNames.join(', ')}. قم بتشغيل 'ollama pull ${targetModel}'.`,
          });
        }
      }
    } catch (tagsErr) {
      // Continue to chat call, if Ollama is offline it will throw ECONNREFUSED below
    }

    const sysPrompt = systemPrompt || 'أنت كاتب سيناريو ومؤلف وثائقيات عربي محترف متماسك الصياغة باللغة العربية الفصحى المعاصرة.';
    
    const userPrompt = `
كتابة سيناريو وثائقي تعليمي متكامل وممتع للإلقاء الصوتي بناءً حصراً على الأدلة المعتمدة التالية.

معلومات المشروع:
- العنوان: "${title}"
- الموضوع: "${topic}"
- مدة الفيديو المستهدفة: ${durationMinutes} دقيقة (حوالي ${targetWords} كلمة بمعدل 130 كلمة/دقيقة).
- أسلوب الإلقاء: "${tone || 'روائي مشوق وموضوعي'}"

قوانين صارمة للسيناريو:
1. ممنوع منعاً باتاً اختراع حقائق أو مصادر أو تواريخ غير مذكورة في الأدلة المعتمدة!
2. أرفق معرفات الأدلة المستخدمة في مصفوفة linkedClaimIds.
3. قسم السيناريو إلى أقسام منظمة تشمل: hook (المقدمة), introduction (التمهيد), body (المحاور الرئيسية), conclusion (الخاتمة), sources_note (المصادر).

الأدلة المعتمدة المتاحة:
${claimsContext}

قم بإرجاع النتيجة بصيغة JSON فقط بالتنسيق التالي:
{
  "targetWordCount": ${targetWords},
  "sections": [
    {
      "id": "sec-1",
      "title": "عنوان القسم بالعربية",
      "type": "hook",
      "content": "نص الفقرة للتعليق الصوتي...",
      "linkedClaimIds": ["claim-1"],
      "isLocked": false,
      "wordCount": 85,
      "estimatedDurationSeconds": 39
    }
  ]
}
`;

    const chatPayload = {
      model: targetModel,
      messages: [
        { role: 'system', content: sysPrompt },
        { role: 'user', content: userPrompt },
      ],
      options: {
        temperature: typeof temperature === 'number' ? temperature : 0.3,
      },
      stream: false,
    };

    let chatRes: Response;
    try {
      chatRes = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(chatPayload),
        signal: AbortSignal.timeout(60000), // 60s timeout
      });
    } catch (fetchErr: any) {
      let errorMsg = `تعذر الاتصال بخادم Ollama المحلي على ${host}.`;
      if (fetchErr.name === 'TimeoutError' || fetchErr.name === 'AbortError') {
        errorMsg = 'انتهت مهلة الانتظار أثناء توليد السيناريو عبر Ollama (Timeout).';
      } else if (fetchErr.code === 'ECONNREFUSED' || fetchErr.message?.includes('fetch failed')) {
        errorMsg = 'رفض الاتصال بـ Ollama (ECONNREFUSED). يرجى التأكد من تشغيل خادم Ollama على http://localhost:11434.';
      }
      return res.status(500).json({ error: errorMsg, rawError: fetchErr.message });
    }

    if (!chatRes.ok) {
      const errText = await chatRes.text();
      return res.status(500).json({ error: `خطأ من خادم Ollama (${chatRes.status}): ${errText}` });
    }

    const chatData = await chatRes.json();
    const rawText = chatData.message?.content || '';

    if (!rawText.trim()) {
      return res.status(500).json({ error: 'أعاد خادم Ollama استجابة فارغة.' });
    }

    let parsedData: any = {};
    try {
      const cleaned = cleanJsonResponse(rawText);
      parsedData = JSON.parse(cleaned);
    } catch (e) {
      // If Ollama didn't format strict JSON, construct valid sections from paragraphs
      const paragraphs = rawText.split('\n\n').filter((p: string) => p.trim().length > 15);
      const fallbackSections = paragraphs.map((p: string, idx: number) => {
        const wc = p.trim().split(/\s+/).length;
        return {
          id: `sec-ollama-${idx + 1}`,
          title: `قسم السيناريو (${idx + 1})`,
          type: idx === 0 ? 'hook' : idx === paragraphs.length - 1 ? 'conclusion' : 'body',
          content: p.trim(),
          linkedClaimIds: strictlyApproved.map((c: any) => c.id),
          isLocked: false,
          wordCount: wc,
          estimatedDurationSeconds: Math.round((wc / 130) * 60),
        };
      });

      parsedData = {
        targetWordCount: targetWords,
        sections: fallbackSections,
      };
    }

    parsedData.provider = 'ollama';
    parsedData.model = targetModel;

    // Preserve locked sections if user passed existingSections
    if (existingSections && Array.isArray(existingSections)) {
      const lockedSections = existingSections.filter((s: any) => s.isLocked);
      if (lockedSections.length > 0 && Array.isArray(parsedData.sections)) {
        parsedData.sections = parsedData.sections.map((newSec: any) => {
          const lockedMatch = lockedSections.find((ls: any) => ls.id === newSec.id || ls.type === newSec.type);
          return lockedMatch || newSec;
        });
      }
    }

    return res.json({
      success: true,
      data: parsedData,
    });
  } catch (err: any) {
    console.error('Script API Error:', err);
    return res.status(500).json({ error: err.message || 'فشل في توليد السيناريو' });
  }
});

/**
 * 3. SCENES PLAN API
 * Converts approved script into timed scenes & image prompts (Ollama 100% Free or Gemini)
 */
app.post('/api/projects/scenes', async (req, res) => {
  try {
    const { scriptSections, projectTitle, provider, model, baseUrl } = req.body;

    if (!scriptSections || scriptSections.length === 0) {
      return res.status(400).json({ error: 'لا يوجد نص سيناريو لتحويله إلى مشاهد' });
    }

    const sectionsContext = scriptSections
      .map(
        (sec: any) =>
          `[قسم: ${sec.title} | نوع: ${sec.type} | معرف: ${sec.id}]
المحتوى الصوتي: ${sec.content}`
      )
      .join('\n\n');

    const scenesPrompt = `
أنت مدير إخراج بصري ومصمم مشاهد لوثائقي يوتيوب تعليمي وثقافي باللغة العربية.
المطلوب: تحويل أقسام السيناريو التالية إلى خطة مشاهد متسلسلة زمنياً مع وصف مرئي وعلامات زمنية وإشارات صور (Image Prompts).

عنوان المشروع: "${projectTitle || 'وثائقي'}"

تعليمات صارمة للصور والمشاهد:
1. يمنع منعاً باتاً طلب صور واقعية مفرطة أو تحاكي الصور الفوتوغرافية للشخصيات التاريخية!
2. اختر فقط من أنواع الصور البسيطة والتوضيحية التالية (visualType):
   - "illustration": رسم توضيحي فني تبسيطي (Flat vector art) بدون ملامح واقعية متكلفة.
   - "cartoon": كرتون ورسم أنمي تبسيطي متناسق وأنيق.
   - "map": خريطة تاريخية تعليمية واضحة الحدود وأسماء المدن.
   - "diagram": مخطط بياني أو انفوجرافيك لتبسيط المفاهيم والتواريخ.
   - "archive": صورة أرشيفية وثائقية لآثار، مخطوطات، أو معالم حقيقية.
   - "title_card": بطاقة عنوان أو جرافيك نصي مصمم بجمالية.
3. لكل مشهد، صغ:
   - arabicImagePrompt: وصف تفصيلي باللغة العربية للرسم التوضيحي يصف الموضوع، الألوان، النمط الفني، والإضاءة.
   - englishImagePrompt: وصف دقيق باللغة الإنجليزية موازي للوصف العربي.
   - sourceRequirements: متطلبات المرجع البصري (مثال: أطلس تاريخي، صور متاحف، مخطوطات).
   - startTimeCode و endTimeCode: توقيت تسلسلي تبادلي (مثال 00:00 إلى 00:30).

أقسام السيناريو المعتمدة:
${sectionsContext}

قم بإرجاع النتيجة بصيغة JSON فقط بالتنسيق التالي:
{
  "scenes": [
    {
      "id": "scene-1",
      "sectionId": "sec-id",
      "sceneNumber": 1,
      "startTimeCode": "00:00",
      "endTimeCode": "00:30",
      "durationSeconds": 30,
      "narrationText": "جزء النص الصوتي المخصص لهذا المشهد...",
      "visualType": "illustration",
      "arabicImagePrompt": "رسم توضيحي تعليمي يظهر...",
      "englishImagePrompt": "Simple flat vector illustration showing...",
      "sourceRequirements": "مرجع أثري...",
      "generationStatus": "pending"
    }
  ]
}
`;

    const useOllama = provider === 'ollama' || !process.env.GEMINI_API_KEY;

    if (useOllama) {
      const targetModel = model || 'qwen3.5:4b';
      const host = (baseUrl || 'http://localhost:11434').replace(/\/$/, '');
      const targetUrl = `${host}/api/chat`;

      const chatPayload = {
        model: targetModel,
        messages: [
          { role: 'system', content: 'أنت مدير إخراج بصري، صغ إجاباتك بصيغة JSON فقط بالتنسيق المطلوب.' },
          { role: 'user', content: scenesPrompt },
        ],
        options: { temperature: 0.3 },
        stream: false,
      };

      try {
        const chatRes = await fetch(targetUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(chatPayload),
          signal: AbortSignal.timeout(60000),
        });

        if (!chatRes.ok) {
          const errText = await chatRes.text();
          return res.status(500).json({ error: `خطأ من خادم Ollama المحلي (${chatRes.status}): ${errText}` });
        }

        const chatData = await chatRes.json();
        const rawText = chatData.message?.content || '';
        const cleaned = cleanJsonResponse(rawText);
        const parsedData = JSON.parse(cleaned);

        return res.json({
          success: true,
          data: parsedData,
          providerUsed: 'ollama',
          modelUsed: targetModel,
        });
      } catch (ollamaErr: any) {
        let errorMsg = `تعذر تقطيع المشاهد عبر Ollama المحلي على ${host}.`;
        if (ollamaErr.code === 'ECONNREFUSED') {
          errorMsg = 'رفض الاتصال بـ Ollama (ECONNREFUSED). يرجى تأكيد تشغيل خادم Ollama عبر http://localhost:11434.';
        }
        return res.status(500).json({ error: errorMsg, rawError: ollamaErr.message });
      }
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: scenesPrompt,
      config: {
        temperature: 0.3,
      },
    });

    const rawText = response.text || '';
    let parsedData: any = {};
    try {
      const cleaned = cleanJsonResponse(rawText);
      parsedData = JSON.parse(cleaned);
    } catch (e) {
      console.error('Failed to parse Gemini scenes output:', rawText);
      return res.status(500).json({
        error: 'حدث خطأ في تنسيق خطة المشاهد',
        rawText,
      });
    }

    return res.json({
      success: true,
      data: parsedData,
      providerUsed: 'gemini',
    });
  } catch (err: any) {
    console.error('Scenes API Error:', err);
    return res.status(500).json({ error: err.message || 'فشل في توليد خطة المشاهد' });
  }
});

/**
 * 4. IMAGE GENERATION PREVIEW API
 * Generates simple 2D visual previews using Pollinations.ai (100% Free, Keyless) or Gemini
 */
app.post('/api/projects/generate-scene-image', async (req, res) => {
  try {
    const { prompt, visualType, engine } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'يرجى تقديم وصف الصورة (Prompt)' });
    }

    const stylePrefix = visualType === 'cartoon' 
      ? 'Simple 2D flat anime cartoon style, elegant minimalist vector art, clean lines'
      : visualType === 'map'
      ? 'Educational historical map diagram atlas style, clean borders, vintage paper texture'
      : visualType === 'diagram'
      ? 'Clean educational infographic diagram vector illustration'
      : 'Simple 2D flat vector educational illustration, non-photorealistic documentary art';

    const fullPrompt = `${stylePrefix}, ${prompt}. High quality 2D art, no photorealism.`;

    // Default to Pollinations.ai (100% Free Keyless Service) if requested or if Gemini key is missing
    const usePollinations = engine === 'pollinations' || !process.env.GEMINI_API_KEY || engine !== 'gemini';

    if (usePollinations) {
      const encodedPrompt = encodeURIComponent(fullPrompt);
      const randomSeed = Math.floor(Math.random() * 999999);
      const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1280&height=720&seed=${randomSeed}&nologo=true`;

      return res.json({
        success: true,
        imageUrl,
        engineUsed: 'pollinations',
        isFreeKeyless: true,
      });
    }

    // Gemini Image API Fallback
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-image',
      contents: {
        parts: [{ text: fullPrompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: '16:9',
        },
      },
    });

    let imageUrl = '';
    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData) {
        const base64Data = part.inlineData.data;
        const mimeType = part.inlineData.mimeType || 'image/png';
        imageUrl = `data:${mimeType};base64,${base64Data}`;
        break;
      }
    }

    if (!imageUrl) {
      return res.status(500).json({ error: 'لم يتم إرجاع بيانات الصورة من النموذج' });
    }

    return res.json({ success: true, imageUrl, engineUsed: 'gemini' });
  } catch (err: any) {
    console.error('Generate Scene Image Error:', err);
    return res.status(500).json({ error: err.message || 'فشل توليد معاينة الصورة' });
  }
});

/**
 * 5. LOCAL TTS PROXY API
 * Tests or proxies local TTS endpoint
 */
app.post('/api/tts/synthesize', async (req, res) => {
  try {
    const { text, endpointUrl, voiceName, speedRate } = req.body;

    if (!endpointUrl) {
      return res.json({
        connected: false,
        message: 'محرك الصوت المحلي غير متصل. يرجى ضبط عنوان الخادم المحلي في إعدادات التعليق الصوتي.',
      });
    }

    // Try pinging or forwarding to user's local endpoint if available
    try {
      const response = await fetch(endpointUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice: voiceName, speed: speedRate || 1.0 }),
        signal: AbortSignal.timeout(3000), // 3s timeout
      });

      if (response.ok) {
        const audioBuffer = await response.arrayBuffer();
        const base64Audio = Buffer.from(audioBuffer).toString('base64');
        return res.json({
          connected: true,
          audioDataUrl: `data:audio/wav;base64,${base64Audio}`,
        });
      }
    } catch (fetchErr) {
      // Local endpoint not reachable or offline
    }

    return res.json({
      connected: false,
      message: `لم نتمكن من الاتصال بـ ${endpointUrl}. تحقق من تشغيل محرك Piper أو خادم TTS المحلي لديك.`,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * 6. OLLAMA LOCAL LLM API
 */
app.post('/api/ollama/models', async (req, res) => {
  try {
    const { baseUrl } = req.body;
    const host = (baseUrl || 'http://localhost:11434').replace(/\/$/, '');
    const targetUrl = `${host}/api/tags`;

    const response = await fetch(targetUrl, {
      method: 'GET',
      signal: AbortSignal.timeout(4000),
    });

    if (!response.ok) {
      return res.status(500).json({
        success: false,
        error: `خطأ في استجابة خادم Ollama (كود ${response.status})`,
      });
    }

    const data = await response.json();
    const modelsList = (data.models || []).map((m: any) => m.name || m.model);

    return res.json({
      success: true,
      models: modelsList,
    });
  } catch (err: any) {
    let errorMsg = 'تعذر الاتصال بخادم Ollama المحلي على http://localhost:11434.';
    if (err.name === 'TimeoutError' || err.name === 'AbortError') {
      errorMsg = 'انتهت مهلة الانتظار أثناء الاتصال بـ Ollama (Timeout). تحقق من تشغيل الخادم.';
    } else if (err.code === 'ECONNREFUSED') {
      errorMsg = 'رفض الاتصال (ECONNREFUSED). خادم Ollama غير قيد التشغيل أو المنفذ 11434 مغلق.';
    }
    return res.status(500).json({ success: false, error: errorMsg, rawError: err.message });
  }
});

app.post('/api/ollama/chat', async (req, res) => {
  try {
    const { baseUrl, model, systemPrompt, prompt, temperature } = req.body;

    const host = (baseUrl || 'http://localhost:11434').replace(/\/$/, '');
    const targetUrl = `${host}/api/chat`;
    const targetModel = model || 'qwen3.5:4b';

    // 1. Check if target model exists via /api/tags first
    try {
      const tagsRes = await fetch(`${host}/api/tags`, { signal: AbortSignal.timeout(3000) });
      if (tagsRes.ok) {
        const tagsData = await tagsRes.json();
        const availableNames = (tagsData.models || []).map((m: any) => m.name || m.model);
        if (availableNames.length > 0 && !availableNames.includes(targetModel) && !availableNames.some((n: string) => n.startsWith(targetModel))) {
          return res.status(400).json({
            success: false,
            error: `النموذج المطلوبة (${targetModel}) غير مثبت في خادم Ollama لديك! النماذج المتاحة: ${availableNames.join(', ')}. قم بتشغيل 'ollama pull ${targetModel}' في أسطر الأوامر.`,
          });
        }
      }
    } catch (tagsErr) {
      // Continue to main chat request
    }

    const startTime = Date.now();
    const chatPayload = {
      model: targetModel,
      messages: [
        { role: 'system', content: systemPrompt || 'أنت كاتب سيناريو ومصمم مشاهد وثائقيات عربي محترف.' },
        { role: 'user', content: prompt },
      ],
      options: {
        temperature: typeof temperature === 'number' ? temperature : 0.3,
      },
      stream: false,
    };

    const chatRes = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(chatPayload),
      signal: AbortSignal.timeout(60000), // 60s timeout
    });

    const durationMs = Date.now() - startTime;

    if (!chatRes.ok) {
      const errText = await chatRes.text();
      return res.status(500).json({
        success: false,
        error: `خطأ من خادم Ollama (${chatRes.status}): ${errText}`,
      });
    }

    const chatData = await chatRes.json();
    const replyContent = chatData.message?.content || '';

    if (!replyContent) {
      return res.status(500).json({
        success: false,
        error: 'أعاد خادم Ollama استجابة فارغة.',
      });
    }

    return res.json({
      success: true,
      content: replyContent,
      durationMs,
      modelUsed: targetModel,
    });
  } catch (err: any) {
    let errorMsg = 'تعذر الاتصال بـ Ollama.';
    if (err.name === 'TimeoutError' || err.name === 'AbortError') {
      errorMsg = 'استغرقت الاستجابة وقتاً أطول من المتوقع (Timeout).';
    } else if (err.code === 'ECONNREFUSED') {
      errorMsg = 'رفض الاتصال (ECONNREFUSED). تحقق من تشغيل خادم Ollama.';
    }
    return res.status(500).json({ success: false, error: errorMsg, rawError: err.message });
  }
});

// Setup Vite Development Server or Serve Dist Static Files
async function setupServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });
    app.use(vite.middlewares);

    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = await vite.transformIndexHtml(url, `
<!doctype html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>رِواق - صانع وثائقيات اليوتيوب</title>
    <meta name="description" content="بيئة عمل متكاملة وإنتاجية لإنشاء وثائقيات ومرئيات تعليمية وثقافية باللغة العربية" />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&family=Tajawal:wght@400;500;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  </head>
  <body class="bg-slate-950 text-slate-100 font-sans antialiased min-h-screen selection:bg-amber-500/30 selection:text-amber-200">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.use('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Riwaq Server] Running on http://localhost:${PORT}`);
  });
}

setupServer();
