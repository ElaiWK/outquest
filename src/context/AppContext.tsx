import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Project } from '../types';
import { DEFAULT_PROJECT } from '../constants';

const STORAGE_KEY = '@outquest_projects';

function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

interface AppContextValue {
  projects: Project[];
  isLoading: boolean;
  createProject: () => Promise<string>;
  deleteProject: (id: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

async function loadProjects(): Promise<Project[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

async function saveProjects(projects: Project[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch {}
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProjects().then((loaded) => {
      setProjects(loaded);
      setIsLoading(false);
    });
  }, []);

  const persistProjects = (updated: Project[]) => {
    setProjects(updated);
    saveProjects(updated);
  };

  const createProject = async (): Promise<string> => {
    const id = generateId();
    const newProject: Project = {
      id,
      title: DEFAULT_PROJECT.title,
      lastUpdated: Date.now(),
      chapters: DEFAULT_PROJECT.chapters.map((c) => ({ ...c })),
      plots: DEFAULT_PROJECT.plots.map((p) => ({ ...p })),
      beats: DEFAULT_PROJECT.beats.map((b) => ({ ...b, id: generateId() })),
    };
    const updated = [newProject, ...projects];
    persistProjects(updated);
    return id;
  };

  const deleteProject = (id: string) => {
    const updated = projects.filter((p) => p.id !== id);
    persistProjects(updated);
  };

  return (
    <AppContext.Provider value={{ projects, isLoading, createProject, deleteProject }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export function updateProjectInStorage(projectId: string, updater: (p: Project) => Project): void {
  // Helper called by ProjectContext to persist project changes
  AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
    try {
      const projects: Project[] = raw ? JSON.parse(raw) : [];
      const updated = projects.map((p) => (p.id === projectId ? updater(p) : p));
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  });
}
