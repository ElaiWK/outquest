import React, { useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useProject } from '../context/ProjectContext';
import { useDrag } from '../context/DragContext';
import BeatCard from '../components/BeatCard';
import { PLOT_COLORS, CELL_WIDTH, CELL_HEIGHT, ColorKey } from '../constants';

const CHAPTER_LABEL_HEIGHT = 56;
const PLOT_HEADER_WIDTH = 140;

interface Props {
  scale: number;
  onEditBeat: (beatId: string) => void;
  onEditPlot: (plotId: string) => void;
}

export default function VerticalView({ scale, onEditBeat, onEditPlot }: Props) {
  const {
    publishedChapters,
    filteredPlots,
    getBeatsForCell,
    addBeat,
    updateChapter,
  } = useProject();

  const { registerCellRef, isDragging, dropTarget, dragType } = useDrag();

  const colScrollRefs = useRef<(ScrollView | null)[]>([]);
  const headerScrollRef = useRef<ScrollView>(null);
  const isSyncing = useRef(false);

  const syncScroll = (x: number) => {
    if (isSyncing.current) return;
    isSyncing.current = true;
    headerScrollRef.current?.scrollTo({ x, animated: false });
    colScrollRefs.current.forEach((ref) => ref?.scrollTo({ x, animated: false }));
    setTimeout(() => { isSyncing.current = false; }, 50);
  };

  const handleColScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    syncScroll(e.nativeEvent.contentOffset.x);
  };

  return (
    <View style={styles.container}>
      {/* Plot headers row (fixed at top, scrolls horizontally) */}
      <View style={styles.topRow}>
        {/* Corner */}
        <View style={[styles.cornerCell, { width: PLOT_HEADER_WIDTH }]} />
        <ScrollView
          ref={headerScrollRef}
          horizontal
          scrollEnabled={false}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.plotHeadersContent}
        >
          {filteredPlots.map((plot) => {
            const colorKey = plot.color as ColorKey;
            const colors = PLOT_COLORS[colorKey] ?? PLOT_COLORS.yellow;
            return (
              <View
                key={plot.id}
                style={[
                  styles.plotHeader,
                  {
                    width: CELL_WIDTH * scale,
                    borderBottomColor: colors.text,
                  },
                ]}
              >
                <View style={[styles.plotColorDot, { backgroundColor: colors.bg }]} />
                <Text style={styles.plotHeaderText} numberOfLines={1}>
                  {plot.title}
                </Text>
                <Pressable onPress={() => onEditPlot(plot.id)} style={styles.gearBtn}>
                  <Text style={styles.gearBtnText}>⚙</Text>
                </Pressable>
              </View>
            );
          })}
        </ScrollView>
      </View>

      {/* Chapter rows */}
      <ScrollView style={styles.chapterRows} showsVerticalScrollIndicator={false}>
        {publishedChapters.map((chapter, chIdx) => (
          <View key={chapter.id} style={styles.chapterRow}>
            {/* Chapter label (fixed left) */}
            <View style={[styles.chapterLabel, { width: PLOT_HEADER_WIDTH }]}>
              <Text style={styles.chapterLabelText} numberOfLines={3}>
                {chapter.title}
              </Text>
            </View>

            {/* Cells */}
            <ScrollView
              ref={(r) => { colScrollRefs.current[chIdx] = r; }}
              horizontal
              scrollEnabled={!isDragging}
              onScroll={handleColScroll}
              scrollEventThrottle={16}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.cellsRowContent}
            >
              {filteredPlots.map((plot) => {
                const cellBeats = getBeatsForCell(chapter.id, plot.id);
                const colorKey = plot.color as ColorKey;
                const colors = PLOT_COLORS[colorKey] ?? PLOT_COLORS.yellow;
                const isCellDropTarget =
                  dragType === 'beat' &&
                  dropTarget?.type === 'cell' &&
                  dropTarget?.chapterId === chapter.id &&
                  dropTarget?.plotId === plot.id;

                return (
                  <View
                    key={plot.id}
                    ref={(r) => registerCellRef(chapter.id, plot.id, r)}
                    style={[
                      styles.cell,
                      {
                        width: CELL_WIDTH * scale,
                        minHeight: CELL_HEIGHT * scale,
                        backgroundColor: isCellDropTarget ? colors.dim : '#18181f',
                        borderColor: isCellDropTarget ? colors.text : '#2a2a35',
                        borderWidth: isCellDropTarget ? 2 : 1,
                      },
                    ]}
                  >
                    {cellBeats.map((beat) => (
                      <BeatCard
                        key={beat.id}
                        beat={beat}
                        plot={plot}
                        onPress={() => onEditBeat(beat.id)}
                      />
                    ))}
                    <Pressable
                      style={styles.addBeatBtn}
                      onPress={() => onEditBeat(addBeat(chapter.id, plot.id))}
                    >
                      <Text style={styles.addBeatBtnText}>+ scene</Text>
                    </Pressable>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f13',
  },
  topRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a35',
    backgroundColor: '#13131a',
    zIndex: 10,
  },
  cornerCell: {
    borderRightWidth: 1,
    borderRightColor: '#2a2a35',
  },
  plotHeadersContent: {
    alignItems: 'stretch',
  },
  plotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRightWidth: 1,
    borderRightColor: '#2a2a35',
    borderBottomWidth: 3,
    gap: 8,
  },
  plotColorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  plotHeaderText: {
    color: '#ccccdd',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  gearBtn: {
    padding: 4,
  },
  gearBtnText: {
    color: '#666677',
    fontSize: 13,
  },
  chapterRows: {
    flex: 1,
  },
  chapterRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a35',
  },
  chapterLabel: {
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRightWidth: 1,
    borderRightColor: '#2a2a35',
    backgroundColor: '#13131a',
  },
  chapterLabelText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  cellsRowContent: {
    alignItems: 'stretch',
  },
  cell: {
    borderRightWidth: 1,
    borderColor: '#2a2a35',
    padding: 4,
  },
  addBeatBtn: {
    paddingVertical: 6,
    alignItems: 'center',
  },
  addBeatBtnText: {
    color: '#555566',
    fontSize: 11,
    fontWeight: '500',
  },
});
