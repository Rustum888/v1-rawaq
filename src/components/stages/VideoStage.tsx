import React, { useState } from 'react';
import { Project, SceneData } from '../../types/project';
import { 
  Film, 
  CheckSquare, 
  Square, 
  Upload, 
  Play, 
  Pause, 
  Download, 
  FileCode, 
  Image as ImageIcon, 
  Volume2, 
  AlertCircle, 
  ChevronRight, 
  ChevronLeft 
} from 'lucide-react';
import { downloadBlob, generateVideoManifest } from '../../utils/exporters';

interface VideoStageProps {
  project: Project;
  onUpdateProject: (updated: Project) => void;
}

export const VideoStage: React.FC<VideoStageProps> = ({
  project,
  onUpdateProject,
}) => {
  const [activeSceneIdx, setActiveSceneIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const scenes = project.scenes || [];
  const activeScene = scenes[activeSceneIdx] || null;

  // Import local image file for active scene
  const handleImageFileUpload = (sceneId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const updatedImages = { ...project.video.importedImages, [sceneId]: dataUrl };
      
      onUpdateProject({
        ...project,
        updatedAt: new Date().toISOString(),
        video: { ...project.video, importedImages: updatedImages },
      });
    };
    reader.readAsDataURL(file);
  };

  // Import local audio file for active scene
  const handleAudioFileUpload = (sceneId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const updatedAudio = { ...project.video.importedAudio, [sceneId]: dataUrl };

      onUpdateProject({
        ...project,
        updatedAt: new Date().toISOString(),
        video: { ...project.video, importedAudio: updatedAudio },
      });
    };
    reader.readAsDataURL(file);
  };

  const checklistItems = [
    { key: 'researchApproved', label: 'اعتماد أدلة ومصادر البحث (Stage 1)', isDone: project.research.claims.filter(c => c.status === 'approved').length > 0 },
    { key: 'scriptCompleted', label: 'صياغة وقفل مسودة السيناريو (Stage 2)', isDone: project.script.sections.length > 0 },
    { key: 'scenesPromptsReady', label: 'تقطيع المشاهد وإعداد Prompts الصور (Stage 3)', isDone: scenes.length > 0 },
    { key: 'narrationExportedOrGenerated', label: 'تجهيز نصوص أو ملفات التعليق الصوتي (Stage 4)', isDone: project.narration.provider !== 'not_connected' || Object.keys(project.video.importedAudio).length > 0 },
    { key: 'imagesGathered', label: 'تجميع واستيراد اللوحات والبصريات لكل مشهد', isDone: Object.keys(project.video.importedImages).length > 0 || scenes.some(s => !!s.imageUrl) },
    { key: 'manifestGenerated', label: 'إنشاء بيان المونتاج الشامل (Video Manifest)', isDone: true },
  ];

  return (
    <div className="space-y-6">
      
      {/* Control Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Film className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-slate-100">تجميع الفيديو والخط الزمني (Video Timeline & Assembly)</h2>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 mr-2">
              مرحلة مستقلة
            </span>
          </div>
          <p className="text-xs text-slate-400">
            مراجعة القائمة الميدانية، استيراد البصريات والصوتيات لكل مشهد، ومعاينة التسلسل الزمني التفاعلي للوثائقي.
          </p>
        </div>

        <button
          onClick={() => downloadBlob(generateVideoManifest(project), `video_manifest_${project.id}.json`, 'application/json')}
          className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl shadow-lg shadow-amber-500/10 transition-colors shrink-0"
        >
          <FileCode className="w-4 h-4 fill-slate-950" />
          <span>تصدير بيان المونتاج (Video Manifest JSON)</span>
        </button>
      </div>

      {/* Manifest Explanation Callout */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-start gap-3 text-xs text-slate-300">
        <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-slate-100 block">حول الرندر والتجميع في الاصدار الأول:</span>
          <p>
            تتم عملية رندر الفيديو النهائي بلغة فائقة الجودة داخل محركات المونتاج الخارجية مثل Shotcut أو Adobe Premiere أو Remotion. يقوم <strong>رِواق</strong> بتمرير <strong>Video Manifest JSON</strong> محكم الربط يحتوي على توقيت المشاهد، مسارات الوسائط، والنصوص.
          </p>
        </div>
      </div>

      {/* Assembly Checklist Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <h3 className="text-xs font-bold text-slate-100 flex items-center justify-between">
          <span>قائمة مراجعة التجميع الإنتاجي (Assembly Checklist)</span>
          <span className="text-amber-400 tabular-nums">
            مكتمل: {checklistItems.filter(i => i.isDone).length} / {checklistItems.length}
          </span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {checklistItems.map(item => (
            <div
              key={item.key}
              className={`p-3 rounded-xl border flex items-center gap-3 text-xs transition-colors ${
                item.isDone
                  ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
                  : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              {item.isDone ? (
                <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <Square className="w-4 h-4 text-slate-600 shrink-0" />
              )}
              <span className="font-medium truncate">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Timeline & Media Preview Player */}
      {scenes.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Film className="w-4 h-4 text-amber-400" />
              <span>مشغل ومعاين الخط الزمني (Interactive Timeline Player)</span>
            </h3>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveSceneIdx(Math.max(0, activeSceneIdx - 1))}
                disabled={activeSceneIdx === 0}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-lg text-slate-200"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <span className="text-xs font-bold text-amber-400 font-mono tabular-nums">
                المشهد {activeSceneIdx + 1} من {scenes.length}
              </span>

              <button
                onClick={() => setActiveSceneIdx(Math.min(scenes.length - 1, activeSceneIdx + 1))}
                disabled={activeSceneIdx === scenes.length - 1}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-lg text-slate-200"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Player Viewport */}
          {activeScene && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
              
              {/* Media Display Viewport */}
              <div className="aspect-video bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden relative flex flex-col items-center justify-center p-4">
                {project.video.importedImages[activeScene.id] || activeScene.imageUrl ? (
                  <img
                    src={project.video.importedImages[activeScene.id] || activeScene.imageUrl}
                    alt={`Scene ${activeScene.sceneNumber}`}
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <div className="text-center space-y-2 text-slate-500">
                    <ImageIcon className="w-12 h-12 mx-auto stroke-1" />
                    <span className="text-xs block font-medium">لوحة المشهد غير مستوردة بعد</span>
                  </div>
                )}

                {/* Subtitle Bar Overlay */}
                <div className="absolute bottom-3 inset-x-3 bg-slate-950/85 backdrop-blur-md p-3 rounded-xl border border-slate-800/80 text-center text-xs text-slate-100 font-bold leading-relaxed">
                  {activeScene.narrationText}
                </div>
              </div>

              {/* Media Controls & Upload Options */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-amber-400">التوقيت الزمني للمشهد:</span>
                  <div className="font-mono text-sm font-bold text-slate-100 bg-slate-950 p-2.5 rounded-xl border border-slate-800 tabular-nums">
                    {activeScene.startTimeCode} - {activeScene.endTimeCode} ({activeScene.durationSeconds} ثانية)
                  </div>
                </div>

                {/* Upload Image for Active Scene */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">
                    استيراد صورة لهذا المشهد (PNG / JPG):
                  </label>
                  <label className="flex items-center gap-2 p-3 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-xl cursor-pointer text-xs text-slate-300 transition-colors">
                    <Upload className="w-4 h-4 text-amber-400" />
                    <span>
                      {project.video.importedImages[activeScene.id] ? 'تم استيراد الصورة المحلية (انقر للتغيير)' : 'اختر ملف الصورة من جهازك'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageFileUpload(activeScene.id, e)}
                    />
                  </label>
                </div>

                {/* Upload Audio for Active Scene */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">
                    استيراد تعليق صوتي لهذا المشهد (WAV / MP3):
                  </label>
                  <label className="flex items-center gap-2 p-3 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-xl cursor-pointer text-xs text-slate-300 transition-colors">
                    <Volume2 className="w-4 h-4 text-emerald-400" />
                    <span>
                      {project.video.importedAudio[activeScene.id] ? 'تم استيراد الملف الصوتي' : 'اختر ملف الصوت من جهازك'}
                    </span>
                    <input
                      type="file"
                      accept="audio/*"
                      className="hidden"
                      onChange={(e) => handleAudioFileUpload(activeScene.id, e)}
                    />
                  </label>
                </div>

                {/* Audio Player preview if imported */}
                {project.video.importedAudio[activeScene.id] && (
                  <audio
                    controls
                    src={project.video.importedAudio[activeScene.id]}
                    className="w-full mt-2"
                  />
                )}
              </div>

            </div>
          )}

          {/* Timeline Ribbon Buttons */}
          <div className="space-y-2 pt-4 border-t border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400 block">شريط الخط الزمني الشامل:</span>
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {scenes.map((sc, idx) => (
                <button
                  key={sc.id}
                  onClick={() => setActiveSceneIdx(idx)}
                  className={`px-3 py-2 rounded-xl border text-xs font-bold shrink-0 transition-all ${
                    activeSceneIdx === idx
                      ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  مشهد {sc.sceneNumber || idx + 1} ({sc.startTimeCode})
                </button>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
