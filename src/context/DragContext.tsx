import React, {
  createContext,
  useContext,
  useRef,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { View } from 'react-native';
import { Beat, Chapter, LayoutRect } from '../types';
import { useBook } from './BookContext';

interface DropBeatTarget {
  chapterId: string;
  beatIndex: number;
}

interface DragContextValue {
  isDraggingBeat: boolean;
  isDraggingChapter: boolean;
  draggingBeat: Beat | null;
  draggingChapter: Chapter | null;
  dragX: number;
  dragY: number;
  dropBeatTarget: DropBeatTarget | null;
  dropChapterIndex: number | null;

  registerColumnRef: (chapterId: string, ref: View | null) => void;
  registerBeatRef: (beatId: string, ref: View | null) => void;

  startBeatDrag: (beat: Beat, x: number, y: number) => void;
  startChapterDrag: (chapter: Chapter, x: number, y: number) => void;
  updateDrag: (x: number, y: number) => void;
  endDrag: () => void;
  cancelDrag: () => void;
}

const DragContext = createContext<DragContextValue | null>(null);

export function DragProvider({ children }: { children: ReactNode }) {
  const { beats, chapters, moveBeat, reorderChapters } = useBook();

  const [isDraggingBeat, setIsDraggingBeat] = useState(false);
  const [isDraggingChapter, setIsDraggingChapter] = useState(false);
  const [draggingBeat, setDraggingBeat] = useState<Beat | null>(null);
  const [draggingChapter, setDraggingChapter] = useState<Chapter | null>(null);
  const [dragX, setDragX] = useState(0);
  const [dragY, setDragY] = useState(0);
  const [dropBeatTarget, setDropBeatTarget] = useState<DropBeatTarget | null>(null);
  const [dropChapterIndex, setDropChapterIndex] = useState<number | null>(null);

  const columnRefs = useRef(new Map<string, View>());
  const beatRefs = useRef(new Map<string, View>());
  const columnRects = useRef(new Map<string, LayoutRect>());
  const beatRects = useRef(new Map<string, LayoutRect>());

  const registerColumnRef = useCallback((chapterId: string, ref: View | null) => {
    if (ref) columnRefs.current.set(chapterId, ref);
    else columnRefs.current.delete(chapterId);
  }, []);

  const registerBeatRef = useCallback((beatId: string, ref: View | null) => {
    if (ref) beatRefs.current.set(beatId, ref);
    else beatRefs.current.delete(beatId);
  }, []);

  const measureAll = useCallback(async () => {
    const measureView = (view: View): Promise<LayoutRect> =>
      new Promise((resolve) => {
        view.measureInWindow((x, y, width, height) => {
          resolve({ x, y, width, height });
        });
      });

    for (const [id, ref] of columnRefs.current) {
      const rect = await measureView(ref);
      columnRects.current.set(id, rect);
    }
    for (const [id, ref] of beatRefs.current) {
      const rect = await measureView(ref);
      beatRects.current.set(id, rect);
    }
  }, []);

  const computeDropBeatTarget = useCallback(
    (absX: number, absY: number): DropBeatTarget | null => {
      // Find target column
      let targetChapterId: string | null = null;
      let minDist = Infinity;

      for (const [chapterId, rect] of columnRects.current) {
        if (absX >= rect.x && absX <= rect.x + rect.width) {
          targetChapterId = chapterId;
          break;
        }
        const center = rect.x + rect.width / 2;
        const dist = Math.abs(absX - center);
        if (dist < minDist) {
          minDist = dist;
          targetChapterId = chapterId;
        }
      }

      if (!targetChapterId) return null;

      // Find beat index in that column
      const colBeats = beats
        .filter((b) => b.chapterId === targetChapterId)
        .sort((a, b) => a.order - b.order);

      let beatIndex = colBeats.length;
      for (let i = 0; i < colBeats.length; i++) {
        const rect = beatRects.current.get(colBeats[i].id);
        if (rect && absY < rect.y + rect.height / 2) {
          beatIndex = i;
          break;
        }
      }

      return { chapterId: targetChapterId, beatIndex };
    },
    [beats]
  );

  const computeDropChapterIndex = useCallback(
    (absX: number): number => {
      const sorted = [...chapters].sort((a, b) => a.order - b.order);
      let idx = sorted.length;
      let minDist = Infinity;

      for (let i = 0; i < sorted.length; i++) {
        const rect = columnRects.current.get(sorted[i].id);
        if (!rect) continue;
        const center = rect.x + rect.width / 2;
        if (absX < center) {
          idx = i;
          break;
        }
      }
      return idx;
    },
    [chapters]
  );

  const startBeatDrag = useCallback(
    (beat: Beat, x: number, y: number) => {
      setDraggingBeat(beat);
      setDragX(x);
      setDragY(y);
      setIsDraggingBeat(true);
      measureAll().then(() => {
        setDropBeatTarget(computeDropBeatTarget(x, y));
      });
    },
    [measureAll, computeDropBeatTarget]
  );

  const startChapterDrag = useCallback(
    (chapter: Chapter, x: number, y: number) => {
      setDraggingChapter(chapter);
      setDragX(x);
      setDragY(y);
      setIsDraggingChapter(true);
      measureAll().then(() => {
        setDropChapterIndex(computeDropChapterIndex(x));
      });
    },
    [measureAll, computeDropChapterIndex]
  );

  const updateDrag = useCallback(
    (x: number, y: number) => {
      setDragX(x);
      setDragY(y);
      if (isDraggingBeat) {
        setDropBeatTarget(computeDropBeatTarget(x, y));
      } else if (isDraggingChapter) {
        setDropChapterIndex(computeDropChapterIndex(x));
      }
    },
    [isDraggingBeat, isDraggingChapter, computeDropBeatTarget, computeDropChapterIndex]
  );

  const endDrag = useCallback(() => {
    if (isDraggingBeat && draggingBeat && dropBeatTarget) {
      moveBeat(draggingBeat.id, dropBeatTarget.chapterId, dropBeatTarget.beatIndex);
    }

    if (isDraggingChapter && draggingChapter && dropChapterIndex !== null) {
      const sorted = [...chapters].sort((a, b) => a.order - b.order);
      const without = sorted.filter((c) => c.id !== draggingChapter.id);
      const clamped = Math.max(0, Math.min(dropChapterIndex, without.length));
      without.splice(clamped, 0, draggingChapter);
      const reordered = without.map((c, i) => ({ ...c, order: i }));
      reorderChapters(reordered);
    }

    setIsDraggingBeat(false);
    setIsDraggingChapter(false);
    setDraggingBeat(null);
    setDraggingChapter(null);
    setDropBeatTarget(null);
    setDropChapterIndex(null);
  }, [
    isDraggingBeat,
    isDraggingChapter,
    draggingBeat,
    draggingChapter,
    dropBeatTarget,
    dropChapterIndex,
    moveBeat,
    reorderChapters,
    chapters,
  ]);

  const cancelDrag = useCallback(() => {
    setIsDraggingBeat(false);
    setIsDraggingChapter(false);
    setDraggingBeat(null);
    setDraggingChapter(null);
    setDropBeatTarget(null);
    setDropChapterIndex(null);
  }, []);

  return (
    <DragContext.Provider
      value={{
        isDraggingBeat,
        isDraggingChapter,
        draggingBeat,
        draggingChapter,
        dragX,
        dragY,
        dropBeatTarget,
        dropChapterIndex,
        registerColumnRef,
        registerBeatRef,
        startBeatDrag,
        startChapterDrag,
        updateDrag,
        endDrag,
        cancelDrag,
      }}
    >
      {children}
    </DragContext.Provider>
  );
}

export function useDrag(): DragContextValue {
  const ctx = useContext(DragContext);
  if (!ctx) throw new Error('useDrag must be used inside DragProvider');
  return ctx;
}
