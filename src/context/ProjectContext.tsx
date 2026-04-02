import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Project, Chapter, Plot, Beat } from '../types';
import { ColorKey, PLOT_COLORS } from '../constants';

const STORAGE_KEY = '@outquest_projects';

function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function normalizeBeats(beats: Beat[]): Beat[] {
  // Group by cell (chapterId + plotId), sort each group, reassign order 0,1,2...
  const groups = new Map<string, Beat[]>();
  for (const b of beats) {
    const key = `${b.chapterId}::${b.plotId}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(b);
  }
  const result: Beat[] = [];
  for (const group of groups.values()) {
    group.sort((a, b) => a.order - b.order);
    group.forEach((b, i) => result.push({ ...b, order: i }));
  }
  return result;
}

interface ProjectContextValue {
  projectId: string;
  title: string;
  chapters: Chapter[];
  plots: Plot[];
  beats: Beat[];
  plotFilter: string;
  publishedChapters: Chapter[];
  draftChapters: Chapter[];
  filteredPlots: Plot[];

  setTitle: (t: string) => void;

  addChapter: () => void;
  updateChapter: (id: string, title: string) => void;
  deleteChapter: (id: string) => void;
  addDraftChapter: () => void;
  publishDraftChapter: (id: string) => void;

  addPlot: () => void;
  updatePlot: (id: string, data: Partial<Plot>) => void;
  deletePlot: (id: string) => void;

  addBeat: (chapterId: string, plotId: string) => string;
  updateBeat: (id: string, fields: Partial<Beat>) => void;
  deleteBeat: (id: string) => void;
  moveBeat: (beatId: string, targetChapterId: string, targetPlotId: string, targetIndex: number) => void;

  reorderChapters: (newOrder: Chapter[]) => void;
  reorderPlots: (newOrder: Plot[]) => void;

  setPlotFilter: (filter: string) => void;
  getBeatsForCell: (chapterId: string, plotId: string) => Beat[];
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

async function loadProject(projectId: string): Promise<Project | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const projects: Project[] = JSON.parse(raw);
      return projects.find((p) => p.id === projectId) || null;
    }
  } catch {}
  return null;
}

async function persistProjectState(
  projectId: string,
  state: { title: string; chapters: Chapter[]; plots: Plot[]; beats: Beat[] }
): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const projects: Project[] = raw ? JSON.parse(raw) : [];
    const updated = projects.map((p) =>
      p.id === projectId
        ? { ...p, ...state, lastUpdated: Date.now() }
        : p
    );
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {}
}

export function ProjectProvider({ projectId, children }: { projectId: string; children: ReactNode }) {
  const [title, setTitleState] = useState('');
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [plots, setPlots] = useState<Plot[]>([]);
  const [beats, setBeats] = useState<Beat[]>([]);
  const [plotFilter, setPlotFilter] = useState('all');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadProject(projectId).then((p) => {
      if (p) {
        setTitleState(p.title);
        setChapters(p.chapters);
        setPlots(p.plots);
        setBeats(p.beats);
      }
      setLoaded(true);
    });
  }, [projectId]);

  const persist = useCallback(
    (
      newTitle: string,
      newChapters: Chapter[],
      newPlots: Plot[],
      newBeats: Beat[]
    ) => {
      persistProjectState(projectId, {
        title: newTitle,
        chapters: newChapters,
        plots: newPlots,
        beats: newBeats,
      });
    },
    [projectId]
  );

  const setTitle = (t: string) => {
    setTitleState(t);
    persist(t, chapters, plots, beats);
  };

  // Chapter mutations
  const addChapter = () => {
    const id = generateId();
    const newChapter: Chapter = { id, title: 'New Chapter', status: 'published' };
    const updated = [...chapters, newChapter];
    setChapters(updated);
    persist(title, updated, plots, beats);
  };

  const updateChapter = (id: string, newTitle: string) => {
    const updated = chapters.map((c) => (c.id === id ? { ...c, title: newTitle } : c));
    setChapters(updated);
    persist(title, updated, plots, beats);
  };

  const deleteChapter = (id: string) => {
    const updatedChapters = chapters.filter((c) => c.id !== id);
    // Move beats from deleted chapter to inbox
    const updatedBeats = beats.map((b) =>
      b.chapterId === id ? { ...b, chapterId: 'inbox' } : b
    );
    setChapters(updatedChapters);
    setBeats(updatedBeats);
    persist(title, updatedChapters, plots, updatedBeats);
  };

  const addDraftChapter = () => {
    const id = generateId();
    const newChapter: Chapter = { id, title: 'Draft Chapter', status: 'draft' };
    const updated = [...chapters, newChapter];
    setChapters(updated);
    persist(title, updated, plots, beats);
  };

  const publishDraftChapter = (id: string) => {
    const updatedChapters = chapters.map((c) =>
      c.id === id ? { ...c, status: 'published' as const } : c
    );
    // Assign beats with plotId='inbox' in this chapter to first plot
    const firstPlot = plots[0];
    const updatedBeats = beats.map((b) =>
      b.chapterId === id && b.plotId === 'inbox' && firstPlot
        ? { ...b, plotId: firstPlot.id }
        : b
    );
    setChapters(updatedChapters);
    setBeats(updatedBeats);
    persist(title, updatedChapters, plots, updatedBeats);
  };

  // Plot mutations
  const addPlot = () => {
    const id = generateId();
    const colorKeys = Object.keys(PLOT_COLORS) as ColorKey[];
    const color = colorKeys[plots.length % colorKeys.length];
    const newPlot: Plot = { id, title: 'New Track', color };
    const updated = [...plots, newPlot];
    setPlots(updated);
    persist(title, chapters, updated, beats);
  };

  const updatePlot = (id: string, data: Partial<Plot>) => {
    const updated = plots.map((p) => (p.id === id ? { ...p, ...data } : p));
    setPlots(updated);
    persist(title, chapters, updated, beats);
  };

  const deletePlot = (id: string) => {
    const updatedPlots = plots.filter((p) => p.id !== id);
    // Move beats from deleted plot to inbox plot
    const updatedBeats = beats.map((b) =>
      b.plotId === id ? { ...b, plotId: 'inbox' } : b
    );
    setPlots(updatedPlots);
    setBeats(updatedBeats);
    persist(title, chapters, updatedPlots, updatedBeats);
  };

  // Beat mutations
  const addBeat = (chapterId: string, plotId: string): string => {
    const id = generateId();
    const cellBeats = beats.filter((b) => b.chapterId === chapterId && b.plotId === plotId);
    const order = cellBeats.length;
    const newBeat: Beat = { id, chapterId, plotId, summary: 'New Scene', description: '', order };
    const updated = [...beats, newBeat];
    setBeats(updated);
    persist(title, chapters, plots, updated);
    return id;
  };

  const updateBeat = (id: string, fields: Partial<Beat>) => {
    const updated = beats.map((b) => (b.id === id ? { ...b, ...fields } : b));
    setBeats(updated);
    persist(title, chapters, plots, updated);
  };

  const deleteBeat = (id: string) => {
    const updated = beats.filter((b) => b.id !== id);
    setBeats(updated);
    persist(title, chapters, plots, updated);
  };

  const moveBeat = (
    beatId: string,
    targetChapterId: string,
    targetPlotId: string,
    targetIndex: number
  ) => {
    // Remove beat from array
    const beat = beats.find((b) => b.id === beatId);
    if (!beat) return;
    let remaining = beats.filter((b) => b.id !== beatId);

    // Set target
    const movedBeat = { ...beat, chapterId: targetChapterId, plotId: targetPlotId };

    // Get target cell beats (already sorted)
    const targetCellBeats = remaining
      .filter((b) => b.chapterId === targetChapterId && b.plotId === targetPlotId)
      .sort((a, b) => a.order - b.order);

    // Insert at targetIndex
    targetCellBeats.splice(targetIndex, 0, movedBeat);

    // Reassign orders for target cell
    const targetCellUpdated = targetCellBeats.map((b, i) => ({ ...b, order: i }));

    // Merge back
    const otherBeats = remaining.filter(
      (b) => !(b.chapterId === targetChapterId && b.plotId === targetPlotId)
    );
    const merged = [...otherBeats, ...targetCellUpdated];
    const normalized = normalizeBeats(merged);
    setBeats(normalized);
    persist(title, chapters, plots, normalized);
  };

  const reorderChapters = (newOrder: Chapter[]) => {
    setChapters(newOrder);
    persist(title, newOrder, plots, beats);
  };

  const reorderPlots = (newOrder: Plot[]) => {
    setPlots(newOrder);
    persist(title, chapters, newOrder, beats);
  };

  const getBeatsForCell = useCallback(
    (chapterId: string, plotId: string): Beat[] => {
      return beats
        .filter((b) => b.chapterId === chapterId && b.plotId === plotId)
        .sort((a, b) => a.order - b.order);
    },
    [beats]
  );

  const publishedChapters = chapters.filter((c) => c.status === 'published');
  const draftChapters = chapters.filter((c) => c.status === 'draft');
  const filteredPlots = plotFilter === 'all' ? plots : plots.filter((p) => p.id === plotFilter);

  if (!loaded) return null;

  return (
    <ProjectContext.Provider
      value={{
        projectId,
        title,
        chapters,
        plots,
        beats,
        plotFilter,
        publishedChapters,
        draftChapters,
        filteredPlots,
        setTitle,
        addChapter,
        updateChapter,
        deleteChapter,
        addDraftChapter,
        publishDraftChapter,
        addPlot,
        updatePlot,
        deletePlot,
        addBeat,
        updateBeat,
        deleteBeat,
        moveBeat,
        reorderChapters,
        reorderPlots,
        setPlotFilter,
        getBeatsForCell,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject(): ProjectContextValue {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error('useProject must be used within ProjectProvider');
  return ctx;
}
