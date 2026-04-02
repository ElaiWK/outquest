import React, {
  createContext,
  useContext,
  useRef,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { View } from 'react-native';
import { useProject } from './ProjectContext';

interface DropTarget {
  type: 'beat' | 'cell' | 'chapter' | 'plot';
  id?: string;
  chapterId?: string;
  plotId?: string;
  index?: number;
}

interface LayoutRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface DragContextValue {
  isDragging: boolean;
  dragType: 'beat' | 'chapter' | 'plot' | null;
  dragId: string | null;
  dragContent: any;
  dragX: number;
  dragY: number;
  dropTarget: DropTarget | null;

  registerCellRef: (chapterId: string, plotId: string, ref: View | null) => void;
  registerBeatRef: (beatId: string, ref: View | null) => void;
  registerChapterRef: (chapterId: string, ref: View | null) => void;
  registerPlotRef: (plotId: string, ref: View | null) => void;

  startDrag: (type: 'beat' | 'chapter' | 'plot', id: string, content: any, x: number, y: number) => void;
  updateDrag: (x: number, y: number) => void;
  endDrag: () => void;
  cancelDrag: () => void;
}

const DragContext = createContext<DragContextValue | null>(null);

export function DragProvider({ children }: { children: ReactNode }) {
  const { beats, chapters, plots, moveBeat, reorderChapters, reorderPlots } = useProject();

  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState<'beat' | 'chapter' | 'plot' | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragContent, setDragContent] = useState<any>(null);
  const [dragX, setDragX] = useState(0);
  const [dragY, setDragY] = useState(0);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);

  // Refs for synchronous access in endDrag
  const dragTypeRef = useRef<'beat' | 'chapter' | 'plot' | null>(null);
  const dragIdRef = useRef<string | null>(null);
  const dropTargetRef = useRef<DropTarget | null>(null);

  const cellRefs = useRef(new Map<string, View>());
  const beatRefs = useRef(new Map<string, View>());
  const chapterRefs = useRef(new Map<string, View>());
  const plotRefs = useRef(new Map<string, View>());

  const cellRects = useRef(new Map<string, LayoutRect>());
  const beatRects = useRef(new Map<string, LayoutRect>());
  const chapterRects = useRef(new Map<string, LayoutRect>());
  const plotRects = useRef(new Map<string, LayoutRect>());

  const registerCellRef = useCallback((chapterId: string, plotId: string, ref: View | null) => {
    const key = `${chapterId}::${plotId}`;
    if (ref) cellRefs.current.set(key, ref);
    else cellRefs.current.delete(key);
  }, []);

  const registerBeatRef = useCallback((beatId: string, ref: View | null) => {
    if (ref) beatRefs.current.set(beatId, ref);
    else beatRefs.current.delete(beatId);
  }, []);

  const registerChapterRef = useCallback((chapterId: string, ref: View | null) => {
    if (ref) chapterRefs.current.set(chapterId, ref);
    else chapterRefs.current.delete(chapterId);
  }, []);

  const registerPlotRef = useCallback((plotId: string, ref: View | null) => {
    if (ref) plotRefs.current.set(plotId, ref);
    else plotRefs.current.delete(plotId);
  }, []);

  const measureView = (view: View): Promise<LayoutRect> =>
    new Promise((resolve) => {
      view.measureInWindow((x: number, y: number, width: number, height: number) => {
        resolve({ x, y, width, height });
      });
    });

  const measureAll = useCallback(async (type: 'beat' | 'chapter' | 'plot') => {
    if (type === 'beat') {
      for (const [id, ref] of cellRefs.current) {
        const rect = await measureView(ref);
        cellRects.current.set(id, rect);
      }
      for (const [id, ref] of beatRefs.current) {
        const rect = await measureView(ref);
        beatRects.current.set(id, rect);
      }
    } else if (type === 'chapter') {
      for (const [id, ref] of chapterRefs.current) {
        const rect = await measureView(ref);
        chapterRects.current.set(id, rect);
      }
    } else if (type === 'plot') {
      for (const [id, ref] of plotRefs.current) {
        const rect = await measureView(ref);
        plotRects.current.set(id, rect);
      }
    }
  }, []);

  const computeBeatDropTarget = useCallback(
    (absX: number, absY: number): DropTarget | null => {
      let targetChapterId: string | null = null;
      let targetPlotId: string | null = null;

      for (const [key, rect] of cellRects.current) {
        if (
          absX >= rect.x &&
          absX <= rect.x + rect.width &&
          absY >= rect.y &&
          absY <= rect.y + rect.height
        ) {
          const parts = key.split('::');
          targetChapterId = parts[0];
          targetPlotId = parts[1];
          break;
        }
      }

      if (!targetChapterId || !targetPlotId) {
        let minDist = Infinity;
        for (const [key, rect] of cellRects.current) {
          const cx = rect.x + rect.width / 2;
          const cy = rect.y + rect.height / 2;
          const dist = Math.sqrt((absX - cx) ** 2 + (absY - cy) ** 2);
          if (dist < minDist) {
            minDist = dist;
            const parts = key.split('::');
            targetChapterId = parts[0];
            targetPlotId = parts[1];
          }
        }
      }

      if (!targetChapterId || !targetPlotId) return null;

      const cellBeats = beats
        .filter((b) => b.chapterId === targetChapterId && b.plotId === targetPlotId)
        .sort((a, b) => a.order - b.order);

      let beatIndex = cellBeats.length;
      for (let i = 0; i < cellBeats.length; i++) {
        const rect = beatRects.current.get(cellBeats[i].id);
        if (rect && absY < rect.y + rect.height / 2) {
          beatIndex = i;
          break;
        }
      }

      return {
        type: 'cell',
        chapterId: targetChapterId,
        plotId: targetPlotId,
        index: beatIndex,
      };
    },
    [beats]
  );

  const computeChapterDropTarget = useCallback(
    (absX: number): DropTarget | null => {
      const sortedRects: Array<{ id: string; rect: LayoutRect }> = [];
      for (const [id, rect] of chapterRects.current) {
        sortedRects.push({ id, rect });
      }
      sortedRects.sort((a, b) => a.rect.x - b.rect.x);

      let insertIndex = sortedRects.length;
      for (let i = 0; i < sortedRects.length; i++) {
        const center = sortedRects[i].rect.x + sortedRects[i].rect.width / 2;
        if (absX < center) {
          insertIndex = i;
          break;
        }
      }

      return { type: 'chapter', index: insertIndex };
    },
    []
  );

  const computePlotDropTarget = useCallback(
    (absY: number): DropTarget | null => {
      const sortedRects: Array<{ id: string; rect: LayoutRect }> = [];
      for (const [id, rect] of plotRects.current) {
        sortedRects.push({ id, rect });
      }
      sortedRects.sort((a, b) => a.rect.y - b.rect.y);

      let insertIndex = sortedRects.length;
      for (let i = 0; i < sortedRects.length; i++) {
        const center = sortedRects[i].rect.y + sortedRects[i].rect.height / 2;
        if (absY < center) {
          insertIndex = i;
          break;
        }
      }

      return { type: 'plot', index: insertIndex };
    },
    []
  );

  const updateDropTarget = useCallback(
    (type: 'beat' | 'chapter' | 'plot' | null, x: number, y: number) => {
      let newTarget: DropTarget | null = null;
      if (type === 'beat') {
        newTarget = computeBeatDropTarget(x, y);
      } else if (type === 'chapter') {
        newTarget = computeChapterDropTarget(x);
      } else if (type === 'plot') {
        newTarget = computePlotDropTarget(y);
      }
      dropTargetRef.current = newTarget;
      setDropTarget(newTarget);
    },
    [computeBeatDropTarget, computeChapterDropTarget, computePlotDropTarget]
  );

  const startDrag = useCallback(
    (type: 'beat' | 'chapter' | 'plot', id: string, content: any, x: number, y: number) => {
      dragTypeRef.current = type;
      dragIdRef.current = id;
      setDragType(type);
      setDragId(id);
      setDragContent(content);
      setDragX(x);
      setDragY(y);
      setIsDragging(true);
      measureAll(type).then(() => {
        updateDropTarget(type, x, y);
      });
    },
    [measureAll, updateDropTarget]
  );

  const updateDrag = useCallback(
    (x: number, y: number) => {
      setDragX(x);
      setDragY(y);
      updateDropTarget(dragTypeRef.current, x, y);
    },
    [updateDropTarget]
  );

  const endDrag = useCallback(() => {
    const currentType = dragTypeRef.current;
    const currentDragId = dragIdRef.current;
    const currentDropTarget = dropTargetRef.current;

    if (currentType === 'beat' && currentDragId && currentDropTarget && currentDropTarget.chapterId && currentDropTarget.plotId) {
      moveBeat(currentDragId, currentDropTarget.chapterId, currentDropTarget.plotId, currentDropTarget.index ?? 0);
    } else if (currentType === 'chapter' && currentDragId && currentDropTarget) {
      const publishedChs = chapters.filter((c) => c.status === 'published');
      const without = publishedChs.filter((c) => c.id !== currentDragId);
      const draggedCh = publishedChs.find((c) => c.id === currentDragId);
      if (draggedCh) {
        const clamped = Math.max(0, Math.min(currentDropTarget.index ?? 0, without.length));
        without.splice(clamped, 0, draggedCh);
        const draftChs = chapters.filter((c) => c.status === 'draft');
        reorderChapters([...without, ...draftChs]);
      }
    } else if (currentType === 'plot' && currentDragId && currentDropTarget) {
      const without = plots.filter((p) => p.id !== currentDragId);
      const draggedPlot = plots.find((p) => p.id === currentDragId);
      if (draggedPlot) {
        const clamped = Math.max(0, Math.min(currentDropTarget.index ?? 0, without.length));
        without.splice(clamped, 0, draggedPlot);
        reorderPlots(without);
      }
    }

    dragTypeRef.current = null;
    dragIdRef.current = null;
    dropTargetRef.current = null;
    setIsDragging(false);
    setDragType(null);
    setDragId(null);
    setDragContent(null);
    setDropTarget(null);
  }, [moveBeat, reorderChapters, reorderPlots, chapters, plots]);

  const cancelDrag = useCallback(() => {
    dragTypeRef.current = null;
    dragIdRef.current = null;
    dropTargetRef.current = null;
    setIsDragging(false);
    setDragType(null);
    setDragId(null);
    setDragContent(null);
    setDropTarget(null);
  }, []);

  return (
    <DragContext.Provider
      value={{
        isDragging,
        dragType,
        dragId,
        dragContent,
        dragX,
        dragY,
        dropTarget,
        registerCellRef,
        registerBeatRef,
        registerChapterRef,
        registerPlotRef,
        startDrag,
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
