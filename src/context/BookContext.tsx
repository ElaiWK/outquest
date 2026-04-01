import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Beat, Chapter } from '../types';

const STORAGE_KEY = '@outquest_data';

export const CHAPTER_COLORS = [
  '#ff6b6b',
  '#ffd166',
  '#06d6a0',
  '#118ab2',
  '#6c63ff',
  '#ff8fab',
  '#fb8500',
  '#8ecae6',
];

function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

interface BookState {
  chapters: Chapter[];
  beats: Beat[];
}

type BookAction =
  | { type: 'LOAD'; payload: BookState }
  | { type: 'ADD_CHAPTER'; title: string; color: string }
  | { type: 'UPDATE_CHAPTER'; id: string; title: string }
  | { type: 'DELETE_CHAPTER'; id: string }
  | { type: 'REORDER_CHAPTERS'; chapters: Chapter[] }
  | { type: 'ADD_BEAT'; chapterId: string }
  | { type: 'UPDATE_BEAT'; id: string; summary?: string; description?: string }
  | { type: 'DELETE_BEAT'; id: string }
  | { type: 'MOVE_BEAT'; beatId: string; targetChapterId: string; targetIndex: number };

function moveBeatHelper(
  beats: Beat[],
  beatId: string,
  targetChapterId: string,
  targetIndex: number
): Beat[] {
  const moving = beats.find((b) => b.id === beatId);
  if (!moving) return beats;

  const sourceChapterId = moving.chapterId;
  const without = beats.filter((b) => b.id !== beatId);

  // Build target chapter list with the moving beat inserted
  const targetBeats = without
    .filter((b) => b.chapterId === targetChapterId)
    .sort((a, b) => a.order - b.order);

  const clamped = Math.max(0, Math.min(targetIndex, targetBeats.length));
  targetBeats.splice(clamped, 0, { ...moving, chapterId: targetChapterId });

  const reorderedTarget = targetBeats.map((b, i) => ({ ...b, order: i }));

  // Reorder source chapter (only if different)
  const reorderedSource =
    sourceChapterId !== targetChapterId
      ? without
          .filter((b) => b.chapterId === sourceChapterId)
          .sort((a, b) => a.order - b.order)
          .map((b, i) => ({ ...b, order: i }))
      : [];

  const rest = without.filter(
    (b) =>
      b.chapterId !== targetChapterId &&
      (sourceChapterId === targetChapterId || b.chapterId !== sourceChapterId)
  );

  return [...rest, ...reorderedTarget, ...reorderedSource];
}

function reducer(state: BookState, action: BookAction): BookState {
  switch (action.type) {
    case 'LOAD':
      return action.payload;

    case 'ADD_CHAPTER': {
      const chapter: Chapter = {
        id: generateId(),
        title: action.title,
        color: action.color,
        order: state.chapters.length,
      };
      return { ...state, chapters: [...state.chapters, chapter] };
    }

    case 'UPDATE_CHAPTER':
      return {
        ...state,
        chapters: state.chapters.map((c) =>
          c.id === action.id ? { ...c, title: action.title } : c
        ),
      };

    case 'DELETE_CHAPTER':
      return {
        ...state,
        chapters: state.chapters.filter((c) => c.id !== action.id),
        beats: state.beats.filter((b) => b.chapterId !== action.id),
      };

    case 'REORDER_CHAPTERS':
      return { ...state, chapters: action.chapters };

    case 'ADD_BEAT': {
      const count = state.beats.filter((b) => b.chapterId === action.chapterId).length;
      const beat: Beat = {
        id: generateId(),
        chapterId: action.chapterId,
        order: count,
        summary: 'New beat',
        description: '',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      return { ...state, beats: [...state.beats, beat] };
    }

    case 'UPDATE_BEAT':
      return {
        ...state,
        beats: state.beats.map((b) =>
          b.id === action.id
            ? {
                ...b,
                ...(action.summary !== undefined && { summary: action.summary }),
                ...(action.description !== undefined && { description: action.description }),
                updatedAt: Date.now(),
              }
            : b
        ),
      };

    case 'DELETE_BEAT':
      return { ...state, beats: state.beats.filter((b) => b.id !== action.id) };

    case 'MOVE_BEAT':
      return {
        ...state,
        beats: moveBeatHelper(
          state.beats,
          action.beatId,
          action.targetChapterId,
          action.targetIndex
        ),
      };

    default:
      return state;
  }
}

const INITIAL_STATE: BookState = {
  chapters: [
    { id: 'ch1', title: 'Act I', order: 0, color: '#ff6b6b' },
    { id: 'ch2', title: 'Act II', order: 1, color: '#06d6a0' },
    { id: 'ch3', title: 'Act III', order: 2, color: '#6c63ff' },
  ],
  beats: [
    { id: 'b1', chapterId: 'ch1', order: 0, summary: 'Hero wakes up', description: '', createdAt: 0, updatedAt: 0 },
    { id: 'b2', chapterId: 'ch1', order: 1, summary: 'Inciting incident', description: '', createdAt: 0, updatedAt: 0 },
    { id: 'b3', chapterId: 'ch1', order: 2, summary: 'Hero refuses call', description: '', createdAt: 0, updatedAt: 0 },
    { id: 'b4', chapterId: 'ch2', order: 0, summary: 'Hero accepts quest', description: '', createdAt: 0, updatedAt: 0 },
    { id: 'b5', chapterId: 'ch2', order: 1, summary: 'First obstacle', description: '', createdAt: 0, updatedAt: 0 },
    { id: 'b6', chapterId: 'ch2', order: 2, summary: 'Midpoint revelation', description: '', createdAt: 0, updatedAt: 0 },
    { id: 'b7', chapterId: 'ch3', order: 0, summary: 'Dark night of the soul', description: '', createdAt: 0, updatedAt: 0 },
    { id: 'b8', chapterId: 'ch3', order: 1, summary: 'Climax', description: '', createdAt: 0, updatedAt: 0 },
    { id: 'b9', chapterId: 'ch3', order: 2, summary: 'Resolution', description: '', createdAt: 0, updatedAt: 0 },
  ],
};

interface BookContextValue {
  chapters: Chapter[];
  beats: Beat[];
  addChapter: (title: string, color: string) => void;
  updateChapter: (id: string, title: string) => void;
  deleteChapter: (id: string) => void;
  reorderChapters: (chapters: Chapter[]) => void;
  addBeat: (chapterId: string) => void;
  updateBeat: (id: string, fields: { summary?: string; description?: string }) => void;
  deleteBeat: (id: string) => void;
  moveBeat: (beatId: string, targetChapterId: string, targetIndex: number) => void;
}

const BookContext = createContext<BookContextValue | null>(null);

export function BookProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          dispatch({ type: 'LOAD', payload: JSON.parse(raw) });
        } catch {}
      }
    });
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const value: BookContextValue = {
    chapters: state.chapters,
    beats: state.beats,
    addChapter: (title, color) => dispatch({ type: 'ADD_CHAPTER', title, color }),
    updateChapter: (id, title) => dispatch({ type: 'UPDATE_CHAPTER', id, title }),
    deleteChapter: (id) => dispatch({ type: 'DELETE_CHAPTER', id }),
    reorderChapters: (chapters) => dispatch({ type: 'REORDER_CHAPTERS', chapters }),
    addBeat: (chapterId) => dispatch({ type: 'ADD_BEAT', chapterId }),
    updateBeat: (id, fields) => dispatch({ type: 'UPDATE_BEAT', id, ...fields }),
    deleteBeat: (id) => dispatch({ type: 'DELETE_BEAT', id }),
    moveBeat: (beatId, targetChapterId, targetIndex) =>
      dispatch({ type: 'MOVE_BEAT', beatId, targetChapterId, targetIndex }),
  };

  return <BookContext.Provider value={value}>{children}</BookContext.Provider>;
}

export function useBook(): BookContextValue {
  const ctx = useContext(BookContext);
  if (!ctx) throw new Error('useBook must be used inside BookProvider');
  return ctx;
}
