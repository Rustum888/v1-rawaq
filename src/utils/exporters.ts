import JSZip from 'jszip';
import { Project, ResearchClaim, ScriptSection, SceneData } from '../types/project';

// Helper to trigger browser download
export function downloadBlob(content: string | Blob, filename: string, mimeType = 'text/plain;charset=utf-8') {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * 1. Research Markdown Export
 */
export function generateResearchMarkdown(project: Project): string {
  const claims = project.research.claims;
  const approved = claims.filter(c => c.status === 'approved');
  const rejected = claims.filter(c => c.status === 'rejected');
  const pending = claims.filter(c => c.status === 'pending');

  let md = `# تقرير البحث والأدلة التاريخية: ${project.title}\n\n`;
  md += `**الموضوع:** ${project.topic}\n`;
  md += `**تاريخ التوثيق:** ${project.research.lastResearchedAt || project.updatedAt}\n`;
  md += `**الجمهور المستهدف:** ${project.targetAudience}\n\n`;

  if (project.research.topicSummary) {
    md += `## ملخص البحث الشامل\n${project.research.topicSummary}\n\n`;
  }

  md += `---\n\n## 1. الأدلة والادعاءات المعتمدة (${approved.length})\n\n`;
  approved.forEach((c, idx) => {
    md += `### ${idx + 1}. [${c.id}] ${c.claimText}\n`;
    md += `- **المصدر:** ${c.sourceTitle}\n`;
    md += `- **الناشر/المؤسسة:** ${c.publisher} (${getSourceTypeName(c.sourceType)})\n`;
    md += `- **الرابط:** [${c.sourceUrl}](${c.sourceUrl})\n`;
    md += `- **مستوى الثقة:** ${c.confidenceLevel}\n`;
    md += `- **ملخص الدليل:** ${c.evidenceSummary}\n`;
    if (c.userNotes) md += `- **ملاحظات المستخدم:** ${c.userNotes}\n`;
    md += `\n`;
  });

  if (rejected.length > 0) {
    md += `## 2. الأدلة والادعاءات المرفوضة أو المستبعدة (${rejected.length})\n\n`;
    rejected.forEach((c, idx) => {
      md += `### ${idx + 1}. [${c.id}] ${c.claimText}\n`;
      md += `- **سبب الخلاف/الرفض:** ${c.competingInterpretations || c.evidenceSummary}\n\n`;
    });
  }

  md += `\n> تنبيه موثوقية: البحث المدعوم بالربط المباشر يرفع شأن التوثيق ولكنه لا يضمن اليقين التاريخي المطلق. يرجى مراجعة المصادر قبل النشر.\n`;

  return md;
}

/**
 * 2. Citations CSV Export
 */
export function generateCitationsCSV(claims: ResearchClaim[]): string {
  const headers = ['المعرف', 'الحالة', 'نص الادعاء', 'عنوان المصدر', 'الناشر', 'نوع المصدر', 'الرابط', 'مستوى الثقة', 'محل خلاف', 'ملخص الدليل'];
  const rows = claims.map(c => [
    c.id,
    c.status,
    `"${c.claimText.replace(/"/g, '""')}"`,
    `"${c.sourceTitle.replace(/"/g, '""')}"`,
    `"${c.publisher.replace(/"/g, '""')}"`,
    getSourceTypeName(c.sourceType),
    c.sourceUrl,
    c.confidenceLevel,
    c.isDisputed ? 'نعم' : 'لا',
    `"${c.evidenceSummary.replace(/"/g, '""')}"`
  ]);

  // Include UTF-8 BOM so Excel opens Arabic correctly
  return '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

/**
 * 3. Script Markdown Export
 */
export function generateScriptMarkdown(project: Project): string {
  const sections = project.script.sections;
  let md = `# مسودة سيناريو الوثائقي: ${project.title}\n\n`;
  md += `**المدة المستهدفة:** ${project.durationMinutes} دقيقة | **عدد الكلمات الكلي:** ${sections.reduce((acc, s) => acc + s.wordCount, 0)} كلمة\n\n`;
  md += `---\n\n`;

  sections.forEach((sec) => {
    md += `## ${sec.title} (${sec.wordCount} كلمة | ~${sec.estimatedDurationSeconds} ثانية)\n`;
    md += `**الأدلة المرتبطة:** ${sec.linkedClaimIds.length > 0 ? sec.linkedClaimIds.join(', ') : 'لا يوجد'}\n\n`;
    md += `${sec.content}\n\n`;
    md += `---\n\n`;
  });

  return md;
}

/**
 * 4. Scenes JSON Export
 */
export function generateScenesJSON(scenes: SceneData[]): string {
  return JSON.stringify(scenes, null, 2);
}

/**
 * 5. Narration Text Export
 */
export function generateNarrationText(sections: ScriptSection[]): string {
  return sections
    .map(sec => `=== ${sec.title} ===\n\n${sec.content}\n`)
    .join('\n\n');
}

/**
 * 6. SSML Export
 */
export function generateNarrationSSML(project: Project): string {
  let ssml = `<speak xmlns="http://www.w3.org/2001/10/synthesis" version="1.0" xml:lang="ar">\n`;
  ssml += `  <metadata>\n    <title>${escapeXml(project.title)}</title>\n  </metadata>\n\n`;

  project.script.sections.forEach(sec => {
    ssml += `  <!-- ${escapeXml(sec.title)} -->\n`;
    ssml += `  <p>\n`;
    const paragraphs = sec.content.split('\n').filter(p => p.trim().length > 0);
    paragraphs.forEach(p => {
      ssml += `    <s>${escapeXml(p.trim())}</s>\n`;
      ssml += `    <break time="600ms"/>\n`;
    });
    ssml += `  </p>\n\n`;
  });

  ssml += `</speak>`;
  return ssml;
}

/**
 * 7. Subtitles SRT Export
 */
export function generateSubtitlesSRT(scenes: SceneData[]): string {
  if (!scenes || scenes.length === 0) return '';

  return scenes
    .map((scene, idx) => {
      const start = formatSRTTimecode(scene.startTimeCode);
      const end = formatSRTTimecode(scene.endTimeCode);
      return `${idx + 1}\n${start} --> ${end}\n${scene.narrationText}\n`;
    })
    .join('\n');
}

/**
 * 8. Video Manifest JSON Export
 */
export function generateVideoManifest(project: Project): string {
  const manifest = {
    project: {
      id: project.id,
      title: project.title,
      topic: project.topic,
      targetDurationMinutes: project.durationMinutes,
      createdAt: project.createdAt,
      exportedAt: new Date().toISOString(),
    },
    audioConfig: {
      provider: project.narration.provider,
      endpointUrl: project.narration.endpointUrl,
      voiceName: project.narration.voiceName,
      speedRate: project.narration.speedRate,
      bgMusicVolume: project.video.bgMusicVolume,
    },
    scenes: project.scenes.map(s => ({
      sceneId: s.id,
      sceneNumber: s.sceneNumber,
      startTimeCode: s.startTimeCode,
      endTimeCode: s.endTimeCode,
      durationSeconds: s.durationSeconds,
      narrationText: s.narrationText,
      visualType: s.visualType,
      arabicImagePrompt: s.arabicImagePrompt,
      englishImagePrompt: s.englishImagePrompt,
      imageFile: project.video.importedImages[s.id] || s.imageUrl || `assets/images/scene_${s.sceneNumber}.png`,
      audioFile: project.video.importedAudio[s.id] || project.narration.sceneAudioMap[s.id] || `assets/audio/scene_${s.sceneNumber}.wav`,
    })),
    credits: {
      generator: 'رِواق - صانع وثائقيات اليوتيوب',
      researchCount: project.research.claims.filter(c => c.status === 'approved').length,
    }
  };

  return JSON.stringify(manifest, null, 2);
}

/**
 * 9. ZIP Package Exporter
 */
export async function downloadProjectZip(project: Project): Promise<void> {
  const zip = new JSZip();

  zip.file('01_research_claims.md', generateResearchMarkdown(project));
  zip.file('02_citations.csv', generateCitationsCSV(project.research.claims));
  zip.file('03_script_draft.md', generateScriptMarkdown(project));
  zip.file('04_scenes_plan.json', generateScenesJSON(project.scenes));
  zip.file('05_narration.txt', generateNarrationText(project.script.sections));
  zip.file('06_narration.ssml', generateNarrationSSML(project));
  zip.file('07_subtitles.srt', generateSubtitlesSRT(project.scenes));
  zip.file('08_video_manifest.json', generateVideoManifest(project));

  const readmeContent = `# مشروع وثائقي: ${project.title}
تاريخ التصدير: ${new Date().toLocaleDateString('ar-EG')}
منصة الإنتاج: رِواق - صانع وثائقيات اليوتيوب

محتويات حزمة التصدير:
1. 01_research_claims.md - تقرير البحث والأدلة التاريخية والأكاديمية المعتمدة.
2. 02_citations.csv - جدول المراجع والمصادر متوافق مع Excel وGoogle Sheets.
3. 03_script_draft.md - نص السيناريو الكامل مقسماً إلى فقرات وأقسام.
4. 04_scenes_plan.json - خطة المشاهد البصرية مع إشارات الصور (Prompts) والتوقيتات.
5. 05_narration.txt - النص الخالي المجهز للإلقاء الصوتي.
6. 06_narration.ssml - ملف SSML جاهز لمحركات التوليد الصوتي المتقدمة.
7. 07_subtitles.srt - ملف الترجمة النصية (Subtitles) متوافق مع يوتيوب وبرامج المونتاج.
8. 08_video_manifest.json - بيان المونتاج الشامل المستهلك في برامج Shotcut, Premiere, Remotion, FFmpeg.
`;
  zip.file('README.txt', readmeContent);

  const content = await zip.generateAsync({ type: 'blob' });
  downloadBlob(content, `riwaq_${project.id}_export.zip`, 'application/zip');
}

// Helpers
function getSourceTypeName(type: string): string {
  const map: Record<string, string> = {
    primary_document: 'وثيقة أولية / مخطوطة',
    university_press: 'منشورات دار نشر جامعية',
    peer_reviewed: 'بحث أكاديمي محكم',
    museum: 'متحف وطني / معروضات أثرية',
    national_archive: 'أرشيف وثائقي وطني',
    reputable_encyclopedia: 'موسوعة علمية مأثورة',
    other: 'مصدر ثانوي أو موقع متخصص'
  };
  return map[type] || 'مصدر أثري';
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, c => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

function formatSRTTimecode(tc: string): string {
  if (!tc) return '00:00:00,000';
  const parts = tc.split(':').map(p => p.trim());
  if (parts.length === 2) {
    const min = parts[0].padStart(2, '0');
    const sec = parts[1].padStart(2, '0');
    return `00:${min}:${sec},000`;
  } else if (parts.length === 3) {
    const hr = parts[0].padStart(2, '0');
    const min = parts[1].padStart(2, '0');
    const sec = parts[2].padStart(2, '0');
    return `${hr}:${min}:${sec},000`;
  }
  return '00:00:00,000';
}
