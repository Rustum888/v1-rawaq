import React, { useState } from 'react';
import { Project } from '../types/project';
import { X, Sparkles, Film } from 'lucide-react';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (project: Project) => void;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [targetAudience, setTargetAudience] = useState('جمهور اليوتيوب المهتم بالتاريخ والثقافة والعلوم');
  const [durationMinutes, setDurationMinutes] = useState<10 | 12 | 15>(12);
  const [tone, setTone] = useState('وثائقي روائي مشوق وموضوعي يعتمد الحقيقة التاريخية');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !topic.trim()) {
      alert('يرجى كتابة عنوان وموضوع المشروع');
      return;
    }

    const newProject: Project = {
      id: `proj-${Date.now()}`,
      title: title.trim(),
      topic: topic.trim(),
      targetAudience: targetAudience.trim(),
      durationMinutes,
      tone: tone.trim(),
      notes: notes.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      currentStage: 1,
      stageProgress: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
      research: {
        claims: [],
      },
      script: {
        targetWordCount: durationMinutes * 130,
        sections: [],
        isGenerated: false,
      },
      scenes: [],
      narration: {
        provider: 'not_connected',
        endpointUrl: 'http://localhost:5000/api/tts',
        voiceName: 'ar_JO-kaled-medium',
        speedRate: 1.0,
        includeDiacritics: true,
        sceneAudioMap: {},
      },
      video: {
        checkList: {
          researchApproved: false,
          scriptCompleted: false,
          scenesPromptsReady: false,
          narrationExportedOrGenerated: false,
          imagesGathered: false,
          manifestGenerated: false,
        },
        importedImages: {},
        importedAudio: {},
        bgMusicVolume: 0.15,
      },
    };

    onCreate(newProject);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-6 text-right">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">إنشاء مشروع وثائقي جديد</h3>
              <p className="text-xs text-slate-400">حدد خطة فيديو يوتيوب (10 - 15 دقيقة)</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              عنوان الوثائقي *
            </label>
            <input
              type="text"
              required
              placeholder="مثال: كيف غيرت المطبعة تاريخ الحضارة الإسلامية؟"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              موضوع البحث والتغطية *
            </label>
            <textarea
              required
              rows={3}
              placeholder="اكتب التفاصيل والمحاور والمؤسسات المعنية بالدراسة التاريخية أو العلمية..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                مدة الفيديو المستهدفة
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[10, 12, 15].map((d) => (
                  <button
                    type="button"
                    key={d}
                    onClick={() => setDurationMinutes(d as any)}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                      durationMinutes === d
                        ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {d} دقائق
                  </button>
                ))}
              </div>
              <span className="text-[10px] text-slate-500 block mt-1">
                المعدل التقديري: {durationMinutes * 130} كلمة
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                الجمهور المستهدف
              </label>
              <input
                type="text"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              أسلوب الطرح والإلقاء (Tone)
            </label>
            <input
              type="text"
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              ملاحظات إضافية أو مراجع خاصة (اختياري)
            </label>
            <input
              type="text"
              placeholder="أي اشتراطات خاصة بالإنتاج البصري أو الصوت..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl shadow-lg shadow-amber-500/10 transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              <span>بدء إنشاء المشروع</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
