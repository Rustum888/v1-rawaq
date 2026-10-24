import { Project, OllamaConfig } from '../types/project';

export const DEFAULT_OLLAMA_CONFIG: OllamaConfig = {
  enabled: false,
  baseUrl: 'http://localhost:11434',
  model: 'qwen3.5:4b',
  temperature: 0.3,
  systemPrompt: 'أنت كاتب سيناريو ومصمم مشاهد وثائقيات عربي محترف متماسك الصياغة. مهمتك صياغة المسودات وإعادة الكتابة وتخطيط المشاهد البصرية بدقة وفصاحة عالية.',
  availableModels: ['qwen3.5:4b'],
};

export const DEMO_PROJECT: Project = {
  id: 'demo-andalusia-fall',
  title: 'لماذا سقطت الأندلس؟ أسرار وتحليلات ثمانية قرون من الحضارة',
  topic: 'سقوط الأندلس والتفكك السياسي والاقتصادي لمملكة غرناطة وملوك الطوائف',
  targetAudience: 'جمهور اليوتيوب المهتم بالتاريخ الإسلامي، الحضارات القديمة، والتحليل الجيوسياسي',
  durationMinutes: 12,
  tone: 'وثائقي روائي مشوق وموضوعي يعتمد الحقيقة التاريخية',
  notes: 'مشروع نموذجي تجريبي مكتمل الأركان يعرض إمكانيات منصة رِواق كاملة.',
  createdAt: '2026-10-20T10:00:00Z',
  updatedAt: '2026-10-23T12:30:00Z',
  ollama: DEFAULT_OLLAMA_CONFIG,
  currentStage: 1,
  stageProgress: {
    1: 100,
    2: 90,
    3: 85,
    4: 70,
    5: 60,
    6: 80,
  },
  research: {
    topicSummary: 'تحليل وثائقي معمق للأساب والعوامل التاريخية، الهيكلية، والجيوسياسية التي أدت إلى انحسار الحضور الإسلامي في الأندلس وصولاً إلى تسليم غرناطة عام 1492م.',
    searchGroundingQueries: [
      'سقوط الأندلس ملوك الطوائف ابن خلدون',
      'معركة العقاب 1212 نتائج تاريخية',
      'معاهدة تسليم غرناطة 1492 نصوص الوثائق'
    ],
    groundingChunks: [
      { title: 'دراسات ملوك الطوائف - جامعة UNED', url: 'https://archives.uned.es/andalus-taifas-history' },
      { title: 'المجلس الأعلى للبحوث العلمية بمديد CSIC', url: 'https://revistas.csic.es/estudios_medievales_parias' },
      { title: 'أرشيف المكتبة الوطنية الإسبانية BNE', url: 'https://manuscripts.bne.es/battle-of-las-navas' },
      { title: 'مؤسسة هيئة الحمراء وجنة العريف - غرناطة', url: 'https://alhambra-patronato.es/history-of-nasrid-granada' }
    ],
    lastResearchedAt: '2026-10-23T11:15:00Z',
    historicalContextWarningShown: true,
    claims: [
      {
        id: 'claim-1',
        claimText: 'تفتت السلطة المركزية في قرطبة بعد سقوط الخلافة العامرية عام 1031م أدى لنشوء أكثر من 22 إمارة صغيرة أُطلق عليها ملوك الطوائف.',
        sourceTitle: 'تاريخ الفكر الأندلسي ودراسة ملوك الطوائف',
        sourceUrl: 'https://archives.uned.es/andalus-taifas-history',
        publisher: 'جامعة مدريد الوطنية للتعليم عن بعد (UNED)',
        sourceType: 'university_press',
        publicationDate: '2019-05-12',
        evidenceSummary: 'تؤكد المخطوطات الأندلسية أن تشرذم الإدارات وتنافس الأمراء المحليين أضعف القوة العسكرية الشاملة للأندلس أمام الممالك الشمالية.',
        confidenceLevel: 'high',
        isDisputed: false,
        status: 'approved',
        userNotes: 'دليل محوري تم اعتماده لبناء التمهيد والمدخل'
      },
      {
        id: 'claim-2',
        claimText: 'استخدم ملك قشتالة ألفونسو السادس استراتيجية الاستنزاف المالي عبر فرض إتاوات سنوية ضخمة (البياريا Parias) على أمراء الطوائف لقاء حمايتهم وهمية.',
        sourceTitle: 'المال والسلاح في العلاقات القشتالية الأندلسية',
        sourceUrl: 'https://revistas.csic.es/estudios_medievales_parias',
        publisher: 'المجلس الأعلى للبحوث العلمية بمديد (CSIC)',
        sourceType: 'peer_reviewed',
        publicationDate: '2021-11-03',
        evidenceSummary: 'أفرغت الإتاوات خزائن الممالك الأندلسية، مما اضطر الأمراء لزيادة الضرائب على السكان المحليين وتوليد سخط شعبي عارم.',
        confidenceLevel: 'high',
        isDisputed: false,
        status: 'approved',
        userNotes: 'تم التأكد من الوثائق القشتالية والأندلسية المتبادلة'
      },
      {
        id: 'claim-3',
        claimText: 'شكلت معركة العُقاب (Las Navas de Tolosa) عام 1212م نقطة التحول الكبرى لصالح التحالف الصليبي الشمالي وكسرت شوكة الموحدين.',
        sourceTitle: 'المعارك الفاصلة في شبه الجزيرة الإيبيرية',
        sourceUrl: 'https://manuscripts.bne.es/battle-of-las-navas',
        publisher: 'المكتبة الوطنية الإسبانية - مدريد',
        sourceType: 'national_archive',
        publicationDate: '2018-08-20',
        evidenceSummary: 'فقد الموحدون معظم جيشهم المدرب في المغرب والأندلس، مما فتح الطريق لسقوط قرطبة (1236م) وإشبيلية (1248م) لاحقاً.',
        confidenceLevel: 'high',
        isDisputed: false,
        status: 'approved'
      },
      {
        id: 'claim-4',
        claimText: 'استمرت مملكة غرناطة تحت حكم بني الأحمر لأكثر من قرنين (1238م - 1492م) عبر التوازن الدبلوماسي والتضاريس الجبلية الوعرة والتبعية المباشرة لقشتالة.',
        sourceTitle: 'غرناطة والنصرية: الملاذ الأخير',
        sourceUrl: 'https://alhambra-patronato.es/history-of-nasrid-granada',
        publisher: 'مؤسسة هيئة هيئة الحمراء وجنّة العريف',
        sourceType: 'museum',
        publicationDate: '2020-02-14',
        evidenceSummary: 'استفاد النصريون من عبقرية العمران والتحصينات الهندسية كقلعة الحمراء إلى جانب المناورة السياسية بين المرينيين بالمغرب وقشتالة.',
        confidenceLevel: 'high',
        isDisputed: false,
        status: 'approved'
      },
      {
        id: 'claim-5',
        claimText: 'الصراع العائلي الداخلي بين أبو الحسن وابنه محمد الثالث عشر (الزغل) وأبي عبد الله الصغير فرق الكلمة وأتاح للملكين الكاثوليكيين الاستفراد بالحصون.',
        sourceTitle: 'نفح الطيب من غصن الأندلس الرطيب - المقري التلمساني',
        sourceUrl: 'https://al-maktaba.org/book/nafah-al-teeb',
        publisher: 'موسوعة المخطوطات والآداب العربية',
        sourceType: 'reputable_encyclopedia',
        publicationDate: '2017-06-30',
        evidenceSummary: 'تنازع أفراد الأسرة الحاكمة على السلطة بينما كانت جيوش فرناندو وإيزابيلا تحاصر قرى غرناطة وتدمر مزارعها.',
        confidenceLevel: 'high',
        isDisputed: false,
        status: 'approved'
      },
      {
        id: 'claim-6',
        claimText: 'العوامل الديموغرافية والتهجير القسري كانت السبب المباشر والأوحد لسقوط غرناطة دون أسباب اقتصادية.',
        sourceTitle: 'مقالات ورؤيات تاريخية حديثة',
        sourceUrl: 'https://example.org/disputed-demographic-claims',
        publisher: 'مدونة تحليلات تاريخية شخصية',
        sourceType: 'other',
        publicationDate: '2022-01-10',
        evidenceSummary: 'يزعم الكاتب أن الهجرة كانت العصر الوحيد، وهو ما يخالف الإجماع الأكاديمي حول التضافر الاقتصادي والسياسي.',
        confidenceLevel: 'disputed',
        isDisputed: true,
        competingInterpretations: 'يرى جمهور المؤرخين المحققين أن العامل الديموغرافي كان نتيجة ثانوية للحروب والانهيار الاقتصادي والضغط العسكري المباشر وليس سبباً أفرداً منفصلاً.',
        status: 'rejected',
        userNotes: 'ادعاء غير دقيق ومرفوض لأنه يعزو السقوط لسبب فردي متجاهلاً الاقتصاد والسياسة.'
      }
    ]
  },
  script: {
    targetWordCount: 1560,
    isGenerated: true,
    lastGeneratedAt: '2026-10-23T12:00:00Z',
    sections: [
      {
        id: 'sec-hook',
        title: 'المقدمة الجاذبة (الخطاف)',
        type: 'hook',
        content: 'في الثاني من يناير عام 1492م، انطفأ السراج الأخير لحضارة دامت ثمانية قرون في قلب أوروبا. خرج الملك أبو عبد الله الصغير من أبواب قلعة الحمراء الشاهقة وسلم مفاتيح غرناطة للملكين الكاثوليكيين فرناندو وإيزابيلا. كيف تحولت الأندلس من منارة للعلم والعمران تشع نورا على العالم، إلى مملكة معزولة تسقط ثمرة ناضجة في أيدي خصومها؟ هل كان السقوط حادثة مفاجئة، أم نتيجة مسار طويل من التفتت والوهن الداخلي؟',
        linkedClaimIds: ['claim-4', 'claim-5'],
        isLocked: true,
        wordCount: 78,
        estimatedDurationSeconds: 36
      },
      {
        id: 'sec-intro',
        title: 'التمهيد والمدخل التاريخي',
        type: 'introduction',
        content: 'كي نفهم زوال الأندلس، علينا أن نرجع الزمان إلى الوراء بأربعة قرون. في عام 1031م، انتهت الخلافة الأموية في قرطبة، وتمزقت الدولة الواحدة إلى أكثر من اثنتين وعشرين إمارة صغيرة، عُرفت في التاريخ باسم ممالك الطوائف [claim-1]. كانت كل إمارة تمتك بلاطاً وبهرجاً، لكنها تفتقر للقوة التي تحمي أرضها، مما جعلها لقمة سائغة للممالك الشمالية المتربصة.',
        linkedClaimIds: ['claim-1'],
        isLocked: false,
        wordCount: 65,
        estimatedDurationSeconds: 30
      },
      {
        id: 'sec-body-1',
        title: 'المحور الأول: استراتيجية الاستنزاف المالي والبياريا',
        type: 'body',
        content: 'لم يكتفِ الملك القشتالي ألفونسو السادس بالمواجهة العسكرية المباشرة، بل ابتكر حيلة جيوسياسية خبيثة. بدأ بفرض إتاوات مالية باهظة تُعرف باسم "البياريا" على أمراء الطوائف مقابل مهادنتهم [claim-2]. تدفقت أموال الأندلس وثرواتها المكدسة إلى خزائن قشتالة، بينما أُفرغت الخزائن الأندلسية، واضطر الأمراء لفرض ضرائب كابوسية على الرعية، مما أحدث شرخاً عميقاً بين الشعوب وحكامها.',
        linkedClaimIds: ['claim-2'],
        isLocked: false,
        wordCount: 62,
        estimatedDurationSeconds: 28
      },
      {
        id: 'sec-body-2',
        title: 'المحور الثاني: انكسار شوكة الموحدين في معركة العقاب',
        type: 'body',
        content: 'على الرغم من التدخلات الإنقاذية للمرابطين ثم الموحدين من المغرب العربي، إلا أن نقطة التحول الكبرى وقعت عام 1212م في صحراء الأندلس، وتحديداً في معركة العُقاب الشهيرة [claim-3]. تحالفت القوى الأوروبية وخاضت معركة طاحنة انتهت بهزيمة قاسية للموحدين. وبسقوط هذه القوة الرادعة، انهارت الحصون الإسلامية بسرعة متسارعة، فسقطت قرطبة العاصمة العلمية عام 1236م، وتبعتهما إشبيلية الجوهرة التجارية عام 1248م.',
        linkedClaimIds: ['claim-3'],
        isLocked: false,
        wordCount: 68,
        estimatedDurationSeconds: 31
      },
      {
        id: 'sec-body-3',
        title: 'المحور الثالث: غرناطة... الصمود الأخير بين التضاريس والصراع الأسري',
        type: 'body',
        content: 'لم يتبقَّ من الأندلس الشاسعة سوى الشريط الجنوبي الجبلي: مملكة غرناطة تحت حكم بني الأحمر [claim-4]. استطاعت هذه المملكة الصمود لأكثر من قرنين بفضل مناعة جبال البشرات والدبلوماسية الحذرة. غير أن أواخر القرن الخامس عشر شهدت مأساة حقيقية؛ إذ نشب صراع عائلي دامي بين السلطان أبي الحسن وأخيه الزغل وابنه أبي عبد الله الصغير على العرش [claim-5]. استغل الملكان فرناندو وإيزابيلا هذا الانقسام الأسري ليفرضوا حصاراً محكماً على غرناطة دمر المحاصيل وقَطَعَ المؤن.',
        linkedClaimIds: ['claim-4', 'claim-5'],
        isLocked: false,
        wordCount: 79,
        estimatedDurationSeconds: 36
      },
      {
        id: 'sec-conclusion',
        title: 'الخاتمة والدروس المستفادة',
        type: 'conclusion',
        content: 'إن سقوط الأندلس لم يكن سوى النتيجة الحتمية للتفكك الداخلي، وضياع البوصلة الاقتصادية، واستبدال المصلحة الجامعة بالخصومات الفردية. لقد تركت الأندلس خلفها إرثاً معمارياً وفكرياً وإنسانياً يظل شاخصاً يشهد على أن الحضارات لا تسقط بسلاح العدو وحده، بل عندما تضعف ركائزها من الداخل.',
        linkedClaimIds: ['claim-1', 'claim-2', 'claim-5'],
        isLocked: false,
        wordCount: 48,
        estimatedDurationSeconds: 22
      },
      {
        id: 'sec-sources',
        title: 'بيان التوثيق والمصادر',
        type: 'sources_note',
        content: 'تعتمد هذه الحلقة الوثائقية على أبحاث محكمة من المجلس الأعلى للبحوث العلمية بمدريد (CSIC)، ومخطوطات المكتبة الوطنية الإسبانية، ومصادر ابن خلدون والمقري التلمساني الموثقة.',
        linkedClaimIds: ['claim-1', 'claim-2', 'claim-3', 'claim-4', 'claim-5'],
        isLocked: true,
        wordCount: 26,
        estimatedDurationSeconds: 12
      }
    ]
  },
  scenes: [
    {
      id: 'scene-1',
      sectionId: 'sec-hook',
      sceneNumber: 1,
      startTimeCode: '00:00',
      endTimeCode: '00:36',
      durationSeconds: 36,
      narrationText: 'في الثاني من يناير عام 1492م، انطفأ السراج الأخير لحضارة دامت ثمانية قرون في قلب أوروبا. خرج الملك أبو عبد الله الصغير من أبواب قلعة الحمراء الشاهقة وسلم مفاتيح غرناطة...',
      visualType: 'illustration',
      arabicImagePrompt: 'رسم توضيحي فني ذو طابع تعليمي وتاريخي يظهر ظلال أسوار قلعة الحمراء بغرناطة في لحظة الغروب الهادئة، ألوان ترابية دافئة، نمط أندلسي تبسيطي بدون ملامح واقعية متكلفة.',
      englishImagePrompt: 'Flat educational artistic illustration of the Alhambra palace fortress in Granada at sunset, warm terracotta colors, subtle Andalusian geometry, non-photorealistic clean vector look.',
      sourceRequirements: 'مخطط هندسي لمعمار قلعة الحمراء وغرناطة في القرن 15',
      generationStatus: 'approved'
    },
    {
      id: 'scene-2',
      sectionId: 'sec-intro',
      sceneNumber: 2,
      startTimeCode: '00:36',
      endTimeCode: '01:06',
      durationSeconds: 30,
      narrationText: 'في عام 1031م، انتهت الخلافة الأموية في قرطبة، وتمزقت الدولة الواحدة إلى أكثر من اثنتين وعشرين إمارة صغيرة، عُرفت بملوك الطوائف...',
      visualType: 'map',
      arabicImagePrompt: 'خريطة تاريخية تعليمية لشبه الجزيرة الإيبيرية (الأندلس) مقسمة إلى دويلات صغيرة متعددة الألوان تظهر ملوك الطوائف كقرطبة وإشبيلية وطليطلة ورندة.',
      englishImagePrompt: 'Clean historical educational map of the Iberian Peninsula in 1031 CE showing Taifa kingdoms in distinct soft color regions with Arabic title labels.',
      sourceRequirements: 'أطلس تاريخي للأندلس - خريطة ملوك الطوائف',
      generationStatus: 'approved'
    },
    {
      id: 'scene-3',
      sectionId: 'sec-body-1',
      sceneNumber: 3,
      startTimeCode: '01:06',
      endTimeCode: '01:34',
      durationSeconds: 28,
      narrationText: 'بدأ القشتاليون بفرض إتاوات مالية باهظة تُعرف باسم "البياريا" على أمراء الطوائف مقابل مهادنتهم. تدفقت أموال الأندلس وخزائنها الوفيرة إلى قشتالة...',
      visualType: 'diagram',
      arabicImagePrompt: 'مخطط بياني توضيحي مبسط يظهر سريان التدفقات المالية والإتاوات (البياريا) من خزائن ملوك الطوائف جنوباً إلى المملكة القشتالية شمالاً مع أيقونات العملات الأندلسية.',
      englishImagePrompt: 'Minimalist infographic diagram showing tribute money flow (Parias) from southern Andalusian Taifas to northern Castile kingdom.',
      sourceRequirements: 'سجلات الإتاوات القشتالية وثائق CSIC',
      generationStatus: 'approved'
    },
    {
      id: 'scene-4',
      sectionId: 'sec-body-2',
      sceneNumber: 4,
      startTimeCode: '01:34',
      endTimeCode: '02:05',
      durationSeconds: 31,
      narrationText: 'في عام 1212م وقعت معركة العُقاب الشهيرة. تحالفت القوى الأوروبية وخاضت معركة طاحنة انتهت بهزيمة قاسية للموحدين وبدء تساقط المدن...',
      visualType: 'cartoon',
      arabicImagePrompt: 'مشهد كرتوني تعليمي بسيط يعبر عن موقعة جبلية تاريخية مع رايات وأعلام الموحدين والقشتاليين بأسلوب رسومي مسطح يبتعد عن الشحناء والواقعية.',
      englishImagePrompt: 'Flat simple educational vector scene depicting a historical mountain pass battle setting, minimalist symbols, clean stylized aesthetic.',
      sourceRequirements: 'موقع معركة العقاب بجيان جنوب إسبانيا',
      generationStatus: 'generated'
    },
    {
      id: 'scene-5',
      sectionId: 'sec-body-3',
      sceneNumber: 5,
      startTimeCode: '02:05',
      endTimeCode: '02:41',
      durationSeconds: 36,
      narrationText: 'لم يتبقَّ من الأندلس الشاسعة سوى مملكة غرناطة بين جبال البشرات. لكن الصراع العائلي بين أبي الحسن والزغل وأبي عبد الله أتاح لفرناندو وإيزابيلا تشديد الحصار...',
      visualType: 'illustration',
      arabicImagePrompt: 'لوحة رسم تعبيري تعليمي يوضح جبال البشرات المحيطة بغرناطة مع أسوار وقباب قصور بني الأحمر تحت حصار صامت وخلفية السماء المعتمة.',
      englishImagePrompt: 'Stylized educational landscape illustration of Sierra Nevada mountains surrounding the Nasrid Granada city walls.',
      sourceRequirements: 'مخططات قصر الحمراء وجبال البشرات',
      generationStatus: 'generated'
    },
    {
      id: 'scene-6',
      sectionId: 'sec-conclusion',
      sceneNumber: 6,
      startTimeCode: '02:41',
      endTimeCode: '03:03',
      durationSeconds: 22,
      narrationText: 'إن سقوط الأندلس تركت خلفه إرثاً معمارياً وفكرياً يظل شاخصاً يذكرنا بأن الحضارات لا تسقط بالسلاح وحده بل بضعف ركائزها الداخلية...',
      visualType: 'title_card',
      arabicImagePrompt: 'بطاقة عنوان وتلخيص ختامية بتصميم أندلسي فاخر، يتوسطها نقش زغرفي هندسي مع عبارات "رِواق - التوثيق التاريخي".',
      englishImagePrompt: 'Elegant Arabic typography title card with geometric Moorish patterns and gold warm background.',
      sourceRequirements: 'نقوش وزخارف مدرسة العطارين وقصر الحمراء',
      generationStatus: 'approved'
    }
  ],
  narration: {
    provider: 'not_connected',
    endpointUrl: 'http://localhost:5000/api/tts',
    voiceName: 'ar_JO-kaled-medium',
    speedRate: 1.0,
    includeDiacritics: true,
    sceneAudioMap: {},
    notes: 'يمكن الاتصال بمحرك Piper المحلي أو مزود TTS آخر لتوليد الملفات الصوتية بصيغة WAV/MP3.'
  },
  video: {
    checkList: {
      researchApproved: true,
      scriptCompleted: true,
      scenesPromptsReady: true,
      narrationExportedOrGenerated: false,
      imagesGathered: false,
      manifestGenerated: true
    },
    importedImages: {},
    importedAudio: {},
    bgMusicVolume: 0.15,
    notes: 'جاهز لتصدير البيان الكامل (video_manifest.json) واستيراد الوسائط.'
  }
};
