import React, { useState, useEffect } from 'react';
import { Project, ProjectStage } from './types/project';
import { DEMO_PROJECT } from './data/demoProject';
import { 
  getStoredProjects, 
  saveProjectsToStorage, 
  getStoredActiveProjectId, 
  saveActiveProjectId, 
  calculateStageProgress 
} from './utils/storage';
import { Header } from './components/Header';
import { StageNavigation } from './components/StageNavigation';
import { ProjectDashboard } from './components/ProjectDashboard';
import { NewProjectModal } from './components/NewProjectModal';
import { ReadmeModal } from './components/ReadmeModal';
import { OllamaSettingsModal } from './components/OllamaSettingsModal';
import { ResearchStage } from './components/stages/ResearchStage';
import { ScriptStage } from './components/stages/ScriptStage';
import { ScenesStage } from './components/stages/ScenesStage';
import { NarrationStage } from './components/stages/NarrationStage';
import { VideoStage } from './components/stages/VideoStage';
import { ExportStage } from './components/stages/ExportStage';

export default function App() {
  const [projects, setProjects] = useState<Project[]>(() => getStoredProjects());
  const [activeProjectId, setActiveProjectId] = useState<string>(() => getStoredActiveProjectId());
  const [viewMode, setViewMode] = useState<'workspace' | 'dashboard'>('workspace');
  
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isReadmeModalOpen, setIsReadmeModalOpen] = useState(false);
  const [isOllamaModalOpen, setIsOllamaModalOpen] = useState(false);

  // Sync projects to storage whenever they change
  useEffect(() => {
    saveProjectsToStorage(projects);
  }, [projects]);

  // Sync active project id
  useEffect(() => {
    saveActiveProjectId(activeProjectId);
  }, [activeProjectId]);

  // Active project selection
  const activeProject = projects.find(p => p.id === activeProjectId) || projects[0] || DEMO_PROJECT;

  // Handle stage selection
  const handleSelectStage = (stage: ProjectStage) => {
    const updatedProjects = projects.map(p => {
      if (p.id === activeProject.id) {
        const updated = { ...p, currentStage: stage, updatedAt: new Date().toISOString() };
        updated.stageProgress = calculateStageProgress(updated);
        return updated;
      }
      return p;
    });
    setProjects(updatedProjects);
  };

  // Update active project
  const handleUpdateProject = (updated: Project) => {
    updated.stageProgress = calculateStageProgress(updated);
    const updatedProjects = projects.map(p => (p.id === updated.id ? updated : p));
    setProjects(updatedProjects);
  };

  // Create new project
  const handleCreateNewProject = (newProj: Project) => {
    newProj.stageProgress = calculateStageProgress(newProj);
    const updatedProjects = [newProj, ...projects];
    setProjects(updatedProjects);
    setActiveProjectId(newProj.id);
    setViewMode('workspace');
  };

  // Duplicate project
  const handleDuplicateProject = (proj: Project) => {
    const copy: Project = {
      ...JSON.parse(JSON.stringify(proj)),
      id: `proj-${Date.now()}`,
      title: `${proj.title} (نسخة)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    copy.stageProgress = calculateStageProgress(copy);
    setProjects([copy, ...projects]);
    setActiveProjectId(copy.id);
    setViewMode('workspace');
  };

  // Delete project
  const handleDeleteProject = (projId: string) => {
    const remaining = projects.filter(p => p.id !== projId);
    if (remaining.length === 0) {
      setProjects([DEMO_PROJECT]);
      setActiveProjectId(DEMO_PROJECT.id);
    } else {
      setProjects(remaining);
      if (activeProjectId === projId) {
        setActiveProjectId(remaining[0].id);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      
      {/* Header Bar */}
      <Header
        project={activeProject}
        onOpenDashboard={() => setViewMode('dashboard')}
        onOpenNewProject={() => setIsNewProjectModalOpen(true)}
        onOpenReadme={() => setIsReadmeModalOpen(true)}
        onOpenOllamaSettings={() => setIsOllamaModalOpen(true)}
      />

      {/* Main Workspace vs Dashboard View */}
      {viewMode === 'dashboard' ? (
        <main className="flex-1">
          <ProjectDashboard
            projects={projects}
            activeProjectId={activeProjectId}
            onSelectProject={(id) => {
              setActiveProjectId(id);
              setViewMode('workspace');
            }}
            onCreateNewProject={() => setIsNewProjectModalOpen(true)}
            onDeleteProject={handleDeleteProject}
            onDuplicateProject={handleDuplicateProject}
          />
        </main>
      ) : (
        <div className="flex-1 flex flex-col">
          
          {/* Stage Navigation Stepper (6 Stages) */}
          <StageNavigation
            currentStage={activeProject.currentStage}
            onSelectStage={handleSelectStage}
            stageProgress={activeProject.stageProgress || calculateStageProgress(activeProject)}
          />

          {/* Active Stage Container */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {activeProject.currentStage === 1 && (
              <ResearchStage
                project={activeProject}
                onUpdateProject={handleUpdateProject}
              />
            )}

            {activeProject.currentStage === 2 && (
              <ScriptStage
                project={activeProject}
                onUpdateProject={handleUpdateProject}
              />
            )}

            {activeProject.currentStage === 3 && (
              <ScenesStage
                project={activeProject}
                onUpdateProject={handleUpdateProject}
              />
            )}

            {activeProject.currentStage === 4 && (
              <NarrationStage
                project={activeProject}
                onUpdateProject={handleUpdateProject}
              />
            )}

            {activeProject.currentStage === 5 && (
              <VideoStage
                project={activeProject}
                onUpdateProject={handleUpdateProject}
              />
            )}

            {activeProject.currentStage === 6 && (
              <ExportStage project={activeProject} />
            )}
          </main>

        </div>
      )}

      {/* Modals */}
      <NewProjectModal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        onCreate={handleCreateNewProject}
      />

      <ReadmeModal
        isOpen={isReadmeModalOpen}
        onClose={() => setIsReadmeModalOpen(false)}
      />

      <OllamaSettingsModal
        isOpen={isOllamaModalOpen}
        onClose={() => setIsOllamaModalOpen(false)}
        config={activeProject.ollama}
        onSaveConfig={(updatedOllama) => {
          handleUpdateProject({
            ...activeProject,
            updatedAt: new Date().toISOString(),
            ollama: updatedOllama,
          });
        }}
      />

    </div>
  );
}
