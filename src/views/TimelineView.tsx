import React, { useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  TextInput,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useProject } from '../context/ProjectContext';
import { useDrag } from '../context/DragContext';
import BeatCard from '../components/BeatCard';
import { PLOT_COLORS, CELL_WIDTH, CELL_HEIGHT, PLOT_LABEL_WIDTH, CHAPTER_HEADER_HEIGHT, ColorKey } from '../constants';

interface Props {
  scale: number;
  onEditBeat: (beatId: string) => void;
  onEditPlot: (plotId: string) => void;
}

export default function TimelineView({ scale, onEditBeat, onEditPlot }: Props) {
  const {
    publishedChapters,
    filteredPlots,
    getBeatsForCell,
    addBeat,
    updateChapter,
    addChapter,
  } = useProject();

  const { registerCellRef, registerChapterRef, registerPlotRef, startDrag, isDragging, dragId, dragType, dropTarget } = useDrag();

  const headerScrollRef = useRef<ScrollView>(null);
  const rowScrollRefs = useRef<(ScrollView | null)[]>([]);
  const isSyncing = useRef(false);

  const syncScroll = useCallback((x: number) => {
    if (isSyncing.current) return;
    isSyncing.current = true;
    headerScrollRef.current?.scrollTo({ x, animated: false });
    rowScrollRefs.current.forEach((ref) => ref?.scrollTo({ x, animated: false }));
    isSyncing.current = false;
  }, []);

  const handleRowScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      syncScroll(e.nativeEvent.contentOffset.x);
    },
    [syncScroll]
  );

  const totalWidth = publishedChapters.length * CELL_WIDTH * scale;

  return (
    <View style={styles.container}>
      {/* Column: plot labels (fixed left) + chapter header corner */}
      <View style={styles.leftColumn}>
        {/* Top-left corner */}
        <View style={[styles.cornerCell, { height: CHAPTER_HEADER_HEIGHT * scale }]} />

        {/* Plot labels */}
        <ScrollView
          scrollEnabled={false}
          style={styles.plotLabelScroll}
          showsVerticalScrollIndicator={false}
        >
          {filteredPlots.map((plot) => {
            const colorKey = plot.color as ColorKey;
            const colors = PLOT_COLORS[colorKey] ?? PLOT_COLORS.yellow;
            return (
              <View
                key={plot.id}
                ref={(r) => registerPlotRef(plot.id, r)}
                style={[
                  styles.plotLabelCell,
                  { height: CELL_HEIGHT * scale, borderLeftColor: colors.text },
                ]}
              >
                <Pressable
                  style={styles.plotLabelInner}
                  onLongPress={() => startDrag('plot', plot.id, plot, 0, 0)}
                  onPress={() => onEditPlot(plot.id)}
                  delayLongPress={400}
                >
                  <View style={[styles.plotColorDot, { backgroundColor: colors.bg }]} />
                  <Text style={styles.plotLabelText} numberOfLines={3}>
                    {plot.title}
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </ScrollView>
      </View>

      {/* Main scrollable area */}
      <View style={styles.gridArea}>
        {/* Chapter headers row */}
        <ScrollView
          ref={headerScrollRef}
          horizontal
          scrollEnabled={false}
          showsHorizontalScrollIndicator={false}
          style={[styles.headerRow, { height: CHAPTER_HEADER_HEIGHT * scale }]}
          contentContainerStyle={styles.headerRowContent}
        >
          {publishedChapters.map((chapter, idx) => {
            const isDropTarget =
              dragType === 'chapter' && dropTarget?.type === 'chapter' && dropTarget?.index === idx;
            return (
              <React.Fragment key={chapter.id}>
                {isDropTarget && (
                  <View style={[styles.chapterDropIndicator, { height: CHAPTER_HEADER_HEIGHT * scale }]} />
                )}
                <View
                  ref={(r) => registerChapterRef(chapter.id, r)}
                  style={[
                    styles.chapterHeaderCell,
                    {
                      width: CELL_WIDTH * scale,
                      height: CHAPTER_HEADER_HEIGHT * scale,
                    },
                  ]}
                >
                  <Pressable
                    style={styles.chapterDragHandle}
                    onLongPress={() => {
                      startDrag('chapter', chapter.id, chapter, 0, 0);
                    }}
                    delayLongPress={400}
                  >
                    <Text style={styles.dragHandleText}>⠿</Text>
                  </Pressable>
                  <TextInput
                    style={[styles.chapterTitle, { fontSize: 13 * scale }]}
                    value={chapter.title}
                    onChangeText={(t) => updateChapter(chapter.id, t)}
                    numberOfLines={1}
                    multiline={false}
                  />
                </View>
              </React.Fragment>
            );
          })}
          {dragType === 'chapter' && dropTarget?.type === 'chapter' && dropTarget?.index === publishedChapters.length && (
            <View style={[styles.chapterDropIndicator, { height: CHAPTER_HEADER_HEIGHT * scale }]} />
          )}
        </ScrollView>

        {/* Plot rows */}
        <ScrollView
          style={styles.plotRows}
          showsVerticalScrollIndicator={false}
          scrollEnabled={!isDragging}
        >
          {filteredPlots.map((plot, plotIdx) => {
            const colorKey = plot.color as ColorKey;
            const colors = PLOT_COLORS[colorKey] ?? PLOT_COLORS.yellow;
            const isPlotDropTarget =
              dragType === 'plot' && dropTarget?.type === 'plot' && dropTarget?.index === plotIdx;

            return (
              <React.Fragment key={plot.id}>
                {isPlotDropTarget && (
                  <View style={styles.plotDropIndicator} />
                )}
                <ScrollView
                  ref={(r) => {
                    rowScrollRefs.current[plotIdx] = r;
                  }}
                  horizontal
                  scrollEnabled={!isDragging}
                  onScroll={handleRowScroll}
                  scrollEventThrottle={16}
                  showsHorizontalScrollIndicator={false}
                  style={{ height: CELL_HEIGHT * scale }}
                  contentContainerStyle={styles.rowContent}
                >
                  {publishedChapters.map((chapter) => {
                    const cellBeats = getBeatsForCell(chapter.id, plot.id);
                    const isCellDropTarget =
                      dragType === 'beat' &&
                      dropTarget?.type === 'cell' &&
                      dropTarget?.chapterId === chapter.id &&
                      dropTarget?.plotId === plot.id;

                    return (
                      <View
                        key={chapter.id}
                        ref={(r) => registerCellRef(chapter.id, plot.id, r)}
                        style={[
                          styles.cell,
                          {
                            width: CELL_WIDTH * scale,
                            height: CELL_HEIGHT * scale,
                            backgroundColor: isCellDropTarget ? colors.dim : '#18181f',
                            borderColor: isCellDropTarget ? colors.text : '#2a2a35',
                            borderWidth: isCellDropTarget ? 2 : 1,
                          },
                        ]}
                      >
                        <ScrollView
                          style={styles.cellScroll}
                          showsVerticalScrollIndicator={false}
                          scrollEnabled={!isDragging}
                        >
                          {cellBeats.map((beat) => (
                            <BeatCard
                              key={beat.id}
                              beat={beat}
                              plot={plot}
                              onPress={() => onEditBeat(beat.id)}
                            />
                          ))}
                        </ScrollView>
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
              </React.Fragment>
            );
          })}
          {dragType === 'plot' && dropTarget?.type === 'plot' && dropTarget?.index === filteredPlots.length && (
            <View style={styles.plotDropIndicator} />
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#0f0f13',
  },
  leftColumn: {
    width: PLOT_LABEL_WIDTH,
    backgroundColor: '#0f0f13',
    borderRightWidth: 1,
    borderRightColor: '#2a2a35',
    zIndex: 10,
  },
  cornerCell: {
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a35',
    justifyContent: 'flex-end',
    paddingBottom: 8,
    paddingLeft: 10,
  },
  plotLabelScroll: {
    flex: 1,
  },
  plotLabelCell: {
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a35',
    borderLeftWidth: 3,
    overflow: 'hidden',
  },
  plotLabelInner: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: 8,
    gap: 5,
  },
  plotColorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  plotLabelText: {
    color: '#ccccdd',
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 14,
  },
  gridArea: {
    flex: 1,
    overflow: 'hidden',
  },
  headerRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a35',
    backgroundColor: '#13131a',
  },
  headerRowContent: {
    alignItems: 'center',
  },
  chapterHeaderCell: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#2a2a35',
    paddingHorizontal: 8,
    gap: 6,
  },
  chapterDragHandle: {
    padding: 4,
  },
  dragHandleText: {
    color: '#444455',
    fontSize: 16,
  },
  chapterTitle: {
    flex: 1,
    color: '#ffffff',
    fontWeight: '600',
  },
  chapterDropIndicator: {
    width: 4,
    backgroundColor: '#eab308',
    borderRadius: 2,
  },
  plotRows: {
    flex: 1,
  },
  rowContent: {
    alignItems: 'stretch',
  },
  cell: {
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#2a2a35',
    overflow: 'hidden',
  },
  cellScroll: {
    flex: 1,
    padding: 4,
  },
  addBeatBtn: {
    borderTopWidth: 1,
    borderTopColor: '#2a2a35',
    paddingVertical: 6,
    alignItems: 'center',
    backgroundColor: '#13131a',
  },
  addBeatBtnText: {
    color: '#555566',
    fontSize: 11,
    fontWeight: '500',
  },
  plotDropIndicator: {
    height: 4,
    backgroundColor: '#eab308',
    borderRadius: 2,
    marginHorizontal: 8,
  },
});
