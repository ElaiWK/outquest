import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  TextInput,
} from 'react-native';
import { useProject } from '../context/ProjectContext';
import { useDrag } from '../context/DragContext';
import BeatCard from '../components/BeatCard';
import { PLOT_COLORS, ColorKey } from '../constants';

interface Props {
  scale: number;
  onEditBeat: (beatId: string) => void;
  onEditPlot: (plotId: string) => void;
}

const COL_LABEL = 130;
const COL_CELL  = 220;
const ROW_HEAD  = 60;
const ROW_CELL  = 150;

export default function TimelineView({ scale, onEditBeat, onEditPlot }: Props) {
  const {
    publishedChapters,
    filteredPlots,
    getBeatsForCell,
    addBeat,
    updateChapter,
    deleteChapter,
  } = useProject();

  const { registerCellRef, registerChapterRef, registerPlotRef, startDrag, isDragging, dragType, dropTarget } = useDrag();

  return (
    <ScrollView style={styles.outer} showsVerticalScrollIndicator={false}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {/* everything inside here scales with zoom */}
        <View style={[styles.grid, { zoom: scale } as any]}>

          {/* ── Header row: corner + chapter titles ── */}
          <View style={styles.headerRow}>
            {/* corner spacer */}
            <View style={[styles.corner, { width: COL_LABEL, height: ROW_HEAD }]}>
              <Text style={styles.cornerLabel}>Story Tracks</Text>
            </View>

            {publishedChapters.map((chapter, idx) => {
              const isDropHere = dragType === 'chapter' && dropTarget?.type === 'chapter' && dropTarget?.index === idx;
              return (
                <React.Fragment key={chapter.id}>
                  {isDropHere && <View style={[styles.chapterDropLine, { height: ROW_HEAD }]} />}
                  <View
                    ref={(r) => registerChapterRef(chapter.id, r)}
                    style={[styles.chapterHeader, { width: COL_CELL, height: ROW_HEAD }]}
                  >
                    <Pressable
                      style={styles.dragHandle}
                      onLongPress={() => startDrag('chapter', chapter.id, chapter, 0, 0)}
                      delayLongPress={350}
                    >
                      <Text style={styles.dragHandleText}>⠿</Text>
                    </Pressable>
                    <View style={styles.chapterTitleWrap}>
                      <Text style={styles.chapterNum}>Chapter {idx + 1}</Text>
                      <TextInput
                        style={styles.chapterTitle}
                        value={chapter.title}
                        onChangeText={(t) => updateChapter(chapter.id, t)}
                        numberOfLines={1}
                      />
                    </View>
                    <Pressable onPress={() => deleteChapter(chapter.id)} style={styles.deleteBtn}>
                      <Text style={styles.deleteBtnText}>✕</Text>
                    </Pressable>
                  </View>
                </React.Fragment>
              );
            })}
          </View>

          {/* ── Data rows: plot label + cells ── */}
          {filteredPlots.map((plot, plotIdx) => {
            const colorKey = plot.color as ColorKey;
            const colors = PLOT_COLORS[colorKey] ?? PLOT_COLORS.yellow;
            const isPlotDrop = dragType === 'plot' && dropTarget?.type === 'plot' && dropTarget?.index === plotIdx;

            return (
              <React.Fragment key={plot.id}>
                {isPlotDrop && <View style={styles.plotDropLine} />}
                <View style={styles.dataRow}>
                  {/* Plot label */}
                  <Pressable
                    ref={(r) => registerPlotRef(plot.id, r as any)}
                    style={[styles.plotLabel, { width: COL_LABEL, height: ROW_CELL, borderLeftColor: colors.text }]}
                    onPress={() => onEditPlot(plot.id)}
                    onLongPress={() => startDrag('plot', plot.id, plot, 0, 0)}
                    delayLongPress={350}
                  >
                    <View style={[styles.plotDot, { backgroundColor: colors.bg }]} />
                    <Text style={styles.plotLabelText} numberOfLines={3}>{plot.title}</Text>
                  </Pressable>

                  {/* Cells */}
                  {publishedChapters.map((chapter) => {
                    const cellBeats = getBeatsForCell(chapter.id, plot.id);
                    const isCellDrop =
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
                            width: COL_CELL,
                            height: ROW_CELL,
                            backgroundColor: isCellDrop ? colors.dim : '#18181f',
                            borderColor: isCellDrop ? colors.text : '#2a2a35',
                            borderWidth: isCellDrop ? 2 : 1,
                          },
                        ]}
                      >
                        {/* horizontal line through cell */}
                        <View style={[styles.cellLine, { backgroundColor: colors.text + '33' }]} />

                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          scrollEnabled={!isDragging}
                          style={styles.beatRow}
                          contentContainerStyle={styles.beatRowContent}
                        >
                          {cellBeats.map((beat) => (
                            <View key={beat.id} style={styles.beatCardWrap}>
                              <BeatCard
                                beat={beat}
                                plot={plot}
                                onPress={() => onEditBeat(beat.id)}
                              />
                            </View>
                          ))}
                          <Pressable
                            style={[styles.addBeatBtn, cellBeats.length > 0 && styles.addBeatBtnSmall]}
                            onPress={() => onEditBeat(addBeat(chapter.id, plot.id))}
                          >
                            <Text style={styles.addBeatBtnText}>+</Text>
                          </Pressable>
                        </ScrollView>
                      </View>
                    );
                  })}
                </View>
              </React.Fragment>
            );
          })}

        </View>
      </ScrollView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  outer: { flex: 1, backgroundColor: '#0f0f13' },
  grid:  { flexDirection: 'column' },

  headerRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a35',
    backgroundColor: '#13131a',
  },
  corner: {
    justifyContent: 'flex-end',
    paddingHorizontal: 10,
    paddingBottom: 8,
    borderRightWidth: 1,
    borderRightColor: '#2a2a35',
  },
  cornerLabel: { color: '#444455', fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },

  chapterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#2a2a35',
    paddingHorizontal: 8,
    gap: 6,
  },
  dragHandle: { padding: 4 },
  dragHandleText: { color: '#444455', fontSize: 14 },
  chapterTitleWrap: { flex: 1 },
  chapterNum: { color: '#eab308', fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  chapterTitle: { color: '#ffffff', fontSize: 13, fontWeight: '600', padding: 0, margin: 0 },
  deleteBtn: { padding: 4 },
  deleteBtnText: { color: '#444455', fontSize: 11 },

  chapterDropLine: { width: 3, backgroundColor: '#eab308', borderRadius: 2 },

  dataRow: { flexDirection: 'row' },

  plotLabel: {
    justifyContent: 'center',
    paddingHorizontal: 10,
    borderRightWidth: 1,
    borderRightColor: '#2a2a35',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a35',
    borderLeftWidth: 3,
    gap: 6,
  },
  plotDot: { width: 8, height: 8, borderRadius: 4 },
  plotLabelText: { color: '#ccccdd', fontSize: 11, fontWeight: '500', lineHeight: 15 },

  plotDropLine: { height: 3, backgroundColor: '#eab308', borderRadius: 2, marginHorizontal: 8 },

  cell: {
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#2a2a35',
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
  },
  cellLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    top: '50%',
  },
  beatRow: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  beatRowContent: {
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 6,
    gap: 4,
    minHeight: ROW_CELL,
  },
  beatCardWrap: { width: 160 },

  addBeatBtn: {
    width: 44,
    height: 80,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#2a2a35',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBeatBtnSmall: {
    width: 32,
    height: 60,
    borderColor: '#2a2a3a',
  },
  addBeatBtnText: { color: '#444455', fontSize: 20 },
});
