export type ProjectStage = 1 | 2 | 3 | 4 | 5 | 6;

export type SourceType = 
  | 'primary_document' 
  | 'university_press' 
  | 'peer_reviewed' 
  | 'museum' 
  | 'national_archive' 
  | 'reputable_encyclopedia' 
  | 'other';

export type ClaimStatus = 'approved' | 'rejected' | 'pending';

export interface ResearchClaim {
  id: string;
  claimText: string;
  sourceTitle: string;
  sourceUrl: string;
  publisher: string;
  sourceType: SourceType;
  publicationDate?: string;
  evidenceSummary: string;
  confidenceLevel: 'high' | 'medium' | 'low' | 'disputed';
  isDisputed: boolean;
  competingInterpretations?: string;
  status: ClaimStatus;
  userNotes?: string;
}

export interface ResearchData {
  topicSummary?: string;
  claims: ResearchClaim[];
  searchGroundingQueries?: string[];
  groundingChunks?: Array<{ title: string; url: string; snippet?: string }>;
  lastResearchedAt?: string;
  historicalContextWarningShown?: boolean;
}

export type SectionType = 'hook' | 'introduction' | 'body' | 'transition' | 'conclusion' | 'sources_note';

export interface ScriptSection {
  id: string;
  title: string;
  type: SectionType;
  content: string;
  linkedClaimIds: string[];
  isLocked: boolean;
  wordCount: number;
  estimatedDurationSeconds: number;
}

export interface ScriptData {
  targetWordCount: number;
  sections: ScriptSection[];
  isGenerated: boolean;
  lastGeneratedAt?: string;
  provider?: 'ollama';
  model?: string;
  notes?: string;
}

export type VisualType = 'illustration' | 'cartoon' | 'map' | 'diagram' | 'archive' | 'title_card';

export interface SceneData {
  id: string;
  sectionId: string;
  sceneNumber: number;
  startTimeCode: string;
  endTimeCode: string;
  durationSeconds: number;
  narrationText: string;
  visualType: VisualType;
  arabicImagePrompt: string;
  englishImagePrompt: string;
  sourceRequirements: string;
  generationStatus: 'pending' | 'generated' | 'approved';
  imageUrl?: string;
  audioUrl?: string;
}

export type TTSProvider = 'piper_local' | 'custom_endpoint' | 'not_connected';

export interface NarrationData {
  provider: TTSProvider;
  endpointUrl: string;
  voiceName: string;
  speedRate: number;
  includeDiacritics: boolean;
  sceneAudioMap: Record<string, string>;
  notes?: string;
}

export interface AssemblyChecklist {
  researchApproved: boolean;
  scriptCompleted: boolean;
  scenesPromptsReady: boolean;
  narrationExportedOrGenerated: boolean;
  imagesGathered: boolean;
  manifestGenerated: boolean;
}

export interface VideoData {
  checkList: AssemblyChecklist;
  importedImages: Record<string, string>; // sceneId -> data URL or path
  importedAudio: Record<string, string>;  // sceneId -> data URL or path
  bgMusicVolume: number;
  notes?: string;
}

export interface OllamaConfig {
  enabled: boolean;
  baseUrl: string;
  model: string;
  temperature: number;
  systemPrompt: string;
  availableModels: string[];
  lastConnectedAt?: string;
  lastError?: string;
}

export interface Project {
  id: string;
  title: string;
  topic: string;
  targetAudience: string;
  durationMinutes: 10 | 12 | 15;
  tone: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  currentStage: ProjectStage;
  stageProgress: Record<ProjectStage, number>;
  research: ResearchData;
  script: ScriptData;
  scenes: SceneData[];
  narration: NarrationData;
  video: VideoData;
  ollama?: OllamaConfig;
}
