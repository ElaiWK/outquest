export interface Beat {
  id: string;
  chapterId: string;
  plotId: string;
  summary: string;
  description: string;
  order: number;
}

export interface Chapter {
  id: string;
  title: string;
  status: 'published' | 'draft';
}

export interface Plot {
  id: string;
  title: string;
  color: string;
}

export interface Project {
  id: string;
  title: string;
  lastUpdated: number;
  chapters: Chapter[];
  plots: Plot[];
  beats: Beat[];
}

export type ViewMode = 'timeline' | 'vertical' | 'board' | 'inbox';

export type RootStackParamList = {
  Dashboard: undefined;
  Editor: { projectId: string };
};
