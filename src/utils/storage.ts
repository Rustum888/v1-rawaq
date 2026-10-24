import { Project } from '../types/project';
import { DEMO_PROJECT } from '../data/demoProject';

const STORAGE_KEY = 'riwaq_projects_v1';
const ACTIVE_PROJECT_KEY = 'riwaq_active_project_id';

export function getStoredProjects(): Project[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Seed initial demo project
      const initial = [DEMO_PROJECT];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([DEMO_PROJECT]));
      return [DEMO_PROJECT];
    }
    return parsed;
  } catch (e) {
    console.error('Failed to load projects from storage', e);
    return [DEMO_PROJECT];
  }
}

export function saveProjectsToStorage(projects: Project[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch (e) {
    console.error('Failed to save projects to storage', e);
  }
}

export function getStoredActiveProjectId(): string {
  return localStorage.getItem(ACTIVE_PROJECT_KEY) || DEMO_PROJECT.id;
}

export function saveActiveProjectId(id: string): void {
  localStorage.setItem(ACTIVE_PROJECT_KEY, id);
}

export function calculateStageProgress(project: Project): Record<number, number> {
  const approvedClaims = project.research.claims.filter(c => c.status === 'approved').length;
  const totalClaims = project.research.claims.length;
  const researchProg = totalClaims > 0 ? Math.min(100, Math.round((approvedClaims / totalClaims) * 100)) : 0;

  const scriptProg = project.script.isGenerated || project.script.sections.length > 0 ? 100 : 0;
  
  const scenesProg = project.scenes.length > 0 
    ? Math.round((project.scenes.filter(s => s.arabicImagePrompt && s.arabicImagePrompt.length > 10).length / project.scenes.length) * 100) 
    : 0;

  const narrationProg = project.narration.provider !== 'not_connected' || Object.keys(project.narration.sceneAudioMap).length > 0 ? 100 : 30;

  const videoProg = project.video.checkList.manifestGenerated ? 100 : 50;

  const exportProg = (researchProg + scriptProg + scenesProg) >= 200 ? 100 : 50;

  return {
    1: researchProg,
    2: scriptProg,
    3: scenesProg,
    4: narrationProg,
    5: videoProg,
    6: exportProg,
  };
}
