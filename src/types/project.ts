export type ProjectStage = 1 | 2 | 3 | 4 | 5 | 6;

export type SourceType = 
  | 'primary' 
  | 'academic' 
  | 'museum' 
  | 'archive' 
  | 'encyclopedia' 
  | 'news' 
  | 'discussion' 
  | 'visual' 
  | 'primary_document' 
  | 'university_press' 
  | 'peer_reviewed' 
  | 'national_archive' 
  | 'reputable_encyclopedia' 
  | 'other';

export type ClaimStatus = 'pending' | 'approved' | 'rejected' | 'edited';

export type ResearchProviderType = 'manual' | 'gemini' | 'openai' | 'searxng';
export type EvaluationProviderType = 'gemini' | 'openai' | 'ollama' | 'manual';

export interface ResearchSource {
  id: string;
  title: string;
  url: string;
  publisher: string;
  sourceType: SourceType | string;
  publicationDate?: string;
  retrievedAt: string;
  excerptOrEvidence: string;
  providerUsed: ResearchProviderType;
}

export interface ResearchClaim {
  id: string;
  claimText: string;
  sourceIds: string[];
  evidenceSummary: string;
  sourceType: SourceType;
  publisher: string;
  sourceTitle: string;
  sourceUrl: string;
  publicationDate?: string;
  confidence: 'low' | 'medium' | 'high';
  confidenceLevel?: 'high' | 'medium' | 'low' | 'disputed';
  disputeStatus: 'undisputed' | 'disputed' | 'unclear';
  isDisputed?: boolean;
  competingInterpretations?: string;
  evaluationNotes?: string;
  status: ClaimStatus;
  userNotes?: string;
  isManual?: boolean;
  manualSourceLabel?: string;
}

export interface ResearchQueryCategory {
  categoryKey: 
    | 'core_facts' 
    | 'chronology' 
    | 'causes_consequences' 
    | 'academic' 
    | 'primary_sources' 
    | 'disputed' 
    | 'audience_questions' 
    | 'visual_references';
  categoryTitle: string;
  queries: string[];
}

export interface ResearchPlan {
  generatedAt: string;
  queriesCount: number;
  categories: ResearchQueryCategory[];
  angleOrQuestion?: string;
}

export interface SourceEvaluationItem {
  claimId: string;
  sourceId?: string;
  urlValidity: 'valid' | 'invalid' | 'unreachable' | 'manual_review';
  publisherAuthority: 'high' | 'medium' | 'low' | 'unknown';
  sourcePrimaryStatus: 'primary' | 'secondary' | 'tertiary';
  supportsClaim: boolean;
  evidenceDirectness: 'direct' | 'inferred' | 'weak';
  biasOrLimitations?: string;
  disagreementNotes?: string;
  confidence: 'low' | 'medium' | 'high';
  recommendation: 'approve' | 'reject' | 'needs_review';
  evaluatorNotes: string;
}

export interface ResearchData {
  topicSummary?: string;
  plan?: ResearchPlan;
  sources: ResearchSource[];
  claims: ResearchClaim[];
  evaluations?: SourceEvaluationItem[];
  rawResults?: Array<{ query: string; snippet: string; url?: string; title?: string }>;
  searchGroundingQueries?: string[];
  groundingChunks?: Array<{ title: string; url: string; snippet?: string }>;
  lastResearchedAt?: string;
  lastEvaluatedAt?: string;
  researchProviderUsed?: ResearchProviderType;
  evaluationProviderUsed?: EvaluationProviderType;
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
  sourceClaimIds?: string[];
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
  angleOrQuestion?: string;
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
