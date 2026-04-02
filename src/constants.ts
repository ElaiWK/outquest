export const PLOT_COLORS = {
  yellow: { bg: '#eab308', text: '#eab308', dim: 'rgba(234,179,8,0.15)' },
  cyan:   { bg: '#06b6d4', text: '#06b6d4', dim: 'rgba(6,182,212,0.15)' },
  pink:   { bg: '#ec4899', text: '#ec4899', dim: 'rgba(236,72,153,0.15)' },
  purple: { bg: '#a855f7', text: '#a855f7', dim: 'rgba(168,85,247,0.15)' },
  green:  { bg: '#22c55e', text: '#22c55e', dim: 'rgba(34,197,94,0.15)' },
} as const;

export type ColorKey = keyof typeof PLOT_COLORS;
export const COLOR_KEYS = Object.keys(PLOT_COLORS) as ColorKey[];

export const APP_ID = 'outquest-mobile-app';
export const CELL_WIDTH = 220;
export const CELL_HEIGHT = 160;
export const PLOT_LABEL_WIDTH = 150;
export const CHAPTER_HEADER_HEIGHT = 64;

export const DEFAULT_PROJECT = {
  title: 'Untitled Story',
  chapters: [
    { id: 'c1', title: 'Act 1: The Setup', status: 'published' as const },
    { id: 'c2', title: 'Act 2: The Journey', status: 'published' as const },
    { id: 'c3', title: 'Act 3: The Climax', status: 'published' as const },
  ],
  plots: [
    { id: 'p1', title: 'Main Plot (A-Story)', color: 'yellow' as ColorKey },
    { id: 'p2', title: 'Romance (B-Story)', color: 'cyan' as ColorKey },
  ],
  beats: [
    { id: 'b1', chapterId: 'c1', plotId: 'p1', summary: 'The Ordinary World', description: 'Introduce the protagonist.', order: 0 },
    { id: 'b2', chapterId: 'c1', plotId: 'p1', summary: 'Inciting Incident', description: 'The event that disrupts the world.', order: 1 },
    { id: 'b3', chapterId: 'c1', plotId: 'p2', summary: 'Meet Cute', description: 'The protagonist meets their love interest.', order: 0 },
    { id: 'b4', chapterId: 'c2', plotId: 'p1', summary: 'Crossing the Threshold', description: 'Committing to the journey.', order: 0 },
  ],
};
