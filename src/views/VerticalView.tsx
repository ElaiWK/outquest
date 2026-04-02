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

const ROW_LABEL  = 80;   // chapter label column width
const COL_CELL   = 240;  // plot column width
const COL_HEAD   = 56;   // plot header height
const ROW_CELL   = 160;  // chapter row height

export default function VerticalView({ scale, onEditBeat, onEditPlot }: Props) {
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
        <View style={[styles.grid, { zoom: scale } as any]}>

          {/* ── Header row: corner + plot column headers ── */}
          <View style={styles.headerRow}>
            <View style={[styles.corner, { width: ROW_LABEL, height: COL_HEAD }]} />

            {filteredPlots.map((plot, plotIdx) => {
              const colorKey = plot.color as ColorKey;
              const colors = PLOT_COLORS[colorKey] ?? PLOT_COLORS.yellow;
              const isDropHere = dragType === 'plot' && dropTarget?.type === 'plot' && dropTarget?.index === plotIdx;
              return (
                <React.Fragment key={plot.id}>
                  {isDropHere && <View style={[styles.plotDropLine, { height: COL_HEAD }]} />}
                  <Pressable
                    ref={(r) => registerPlotRef(plot.id, r as any)}
                    style={[styles.plotHeader, { width: COL_CELL, height: COL_HEAD, borderBottomColor: colors.text }]}
                    onPress={() => onEditPlot(plot.id)}
                    onLongPress={() => startDrag('plot', plot.id, plot, 0, 0)}
                    delayLongPress={350}
                  >
                    <Text style={styles.plotTrackLabel}>Track</Text>
                    <View style={styles.plotHeaderTitle}>
                      <View style={[styles.plotDot, { backgroundColor: colors.bg }]} />
                      <Text style={[styles.plotTitle, { color: colors.text }]} numberOfLines={1}>{plot.title}</Text>
                    </View>
                  </Pressable>
                </React.Fragment>
              );
            })}
          </View>

          {/* ── Chapter rows ── */}
          {publishedChapters.map((chapter, idx) => {
            const isChapterDrop = dragType === 'chapter' && dropTarget?.type === 'chapter' && dropTarget?.index === idx;
            return (
              <React.Fragment key={chapter.id}>
                {isChapterDrop && <View style={styles.chapterDropLine} />}
                <View style={styles.dataRow}>
                  {/* Chapter label */}
                  <Pressable
                    ref={(r) => registerChapterRef(chapter.id, r as any)}
                    style={[styles.chapterLabel, { width: ROW_LABEL, height: ROW_CELL }]}
                    onLongPress={() => startDrag('chapter', chapter.id, chapter, 0, 0)}
                    delayLongPress={350}
                  >
                    <Text style={styles.chapterNum}>Ch.{idx + 1}</Text>
                    <TextInput
                      style={styles.chapterTitle}
                      value={chapter.title}
                      onChangeText={(t) => updateChapter(chapter.id, t)}
                      numberOfLines={3}
                      multiline
                    />
                  </Pressable>

                  {/* Cells */}
                  {filteredPlots.map((plot) => {
                    const colorKey = plot.color as ColorKey;
                    const colors = PLOT_COLORS[colorKey] ?? PLOT_COLORS.yellow;
                    const cellBeats = getBeatsForCell(chapter.id, plot.id);
                    const isCellDrop =
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
                            width: COL_CELL,
                            height: ROW_CELL,
                            backgroundColor: isCellDrop ? colors.dim : '#18181f',
                            borderColor: isCellDrop ? colors.text : '#2a2a35',
                            borderWidth: isCellDrop ? 2 : 1,
                          },
                        ]}
                      >
                        <View style={[styles.cellLine, { backgroundColor: colors.text + '22' }]} />
                        <ScrollView
                          showsVerticalScrollIndicator={false}
                          scrollEnabled={!isDragging}
                          style={styles.cellScroll}
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
    backgroundColor: '#13131a',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a35',
  },
  corner: {
    borderRightWidth: 1,
    borderRightColor: '#2a2a35',
  },
  plotHeader: {
    justifyContent: 'flex-end',
    paddingHorizontal: 12,
    paddingBottom: 10,
    borderRightWidth: 1,
    borderRightColor: '#2a2a35',
    borderBottomWidth: 2,
    gap: 4,
  },
  plotTrackLabel: { color: '#444455', fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  plotHeaderTitle: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  plotDot: { width: 8, height: 8, borderRadius: 4 },
  plotTitle: { fontSize: 14, fontWeight: '700' },

  plotDropLine: { width: 3, backgroundColor: '#eab308', borderRadius: 2 },
  chapterDropLine: { height: 3, backgroundColor: '#eab308', borderRadius: 2, marginHorizontal: 8 },

  dataRow: { flexDirection: 'row' },

  chapterLabel: {
    justifyContent: 'center',
    paddingHorizontal: 8,
    borderRightWidth: 1,
    borderRightColor: '#2a2a35',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a35',
    borderLeftWidth: 3,
    borderLeftColor: '#eab308',
    gap: 4,
  },
  chapterNum: { color: '#eab308', fontSize: 9, fontWeight: '700', textTransform: 'uppercase' },
  chapterTitle: { color: '#ffffff', fontSize: 12, fontWeight: '600', padding: 0, margin: 0 },

  cell: {
    borderRightWidth: 1,
    borderBottomWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  cellLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '50%',
    width: 2,
  },
  cellScroll: { flex: 1, padding: 6 },

  addBeatBtn: {
    paddingVertical: 8,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#2a2a35',
  },
  addBeatBtnText: { color: '#444455', fontSize: 11 },
});
