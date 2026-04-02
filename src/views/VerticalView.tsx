import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useProject } from '../context/ProjectContext';
import { useDrag } from '../context/DragContext';
import BeatCard from '../components/BeatCard';
import { PLOT_COLORS, ColorKey } from '../constants';

interface Props {
  scale: number;
  onEditBeat: (beatId: string) => void;
  onEditPlot: (plotId: string) => void;
}

// Base dimensions at scale = 1
const CH_LABEL_W = 50;   // narrow chapter label column
const CELL_W     = 200;
const PLOT_HEAD  = 50;   // plot header row height
const CELL_H     = 160;

function d(base: number, scale: number, min = 4): number {
  return Math.max(min, Math.round(base * scale));
}

export default function VerticalView({ scale, onEditBeat, onEditPlot }: Props) {
  const {
    publishedChapters, filteredPlots, getBeatsForCell, addBeat, updateChapter,
  } = useProject();
  const {
    registerCellRef, registerChapterRef, registerPlotRef,
    startDrag, isDragging, dragType, dropTarget,
  } = useDrag();

  const chW    = d(CH_LABEL_W, scale, 24);
  const cellW  = d(CELL_W, scale, 60);
  const headH  = d(PLOT_HEAD, scale, 24);
  const cellH  = d(CELL_H, scale, 50);
  const pad    = d(8, scale, 3);
  const gap    = d(4, scale, 2);
  const fs9    = d(9, scale, 7);
  const fs11   = d(11, scale, 8);
  const fs13   = d(13, scale, 9);

  return (
    <ScrollView style={styles.root} showsVerticalScrollIndicator={false}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>

          {/* Plot column headers */}
          <View style={[styles.headRow, { height: headH }]}>
            {/* Corner */}
            <View style={{ width: chW, borderRightWidth: 1, borderRightColor: '#1c1c2a' }} />

            {filteredPlots.map((plot, pi) => {
              const C = PLOT_COLORS[plot.color as ColorKey] ?? PLOT_COLORS.yellow;
              const isDrop = dragType === 'plot' && dropTarget?.type === 'plot' && dropTarget?.index === pi;
              return (
                <Pressable
                  key={plot.id}
                  ref={(r) => registerPlotRef(plot.id, r as any)}
                  style={[
                    styles.plotHead,
                    {
                      width: cellW,
                      borderBottomWidth: 2,
                      borderBottomColor: isDrop ? '#eab308' : C.text + '88',
                    },
                  ]}
                  onPress={() => onEditPlot(plot.id)}
                  onLongPress={() => startDrag('plot', plot.id, plot, 0, 0)}
                  delayLongPress={350}
                >
                  <Text style={[styles.plotTrack, { fontSize: fs9 }]}>TRACK</Text>
                  <Text style={[styles.plotTitle, { fontSize: fs13, color: C.text }]} numberOfLines={1}>
                    {plot.title}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* One row per chapter */}
          {publishedChapters.map((ch, ci) => {
            const isChDrop = dragType === 'chapter' && dropTarget?.type === 'chapter' && dropTarget?.index === ci;
            return (
              <View
                key={ch.id}
                style={[
                  styles.chRow,
                  {
                    borderTopWidth: isChDrop ? 2 : 1,
                    borderTopColor: isChDrop ? '#eab308' : '#1c1c2a',
                  },
                ]}
              >
                {/* Chapter label */}
                <Pressable
                  ref={(r) => registerChapterRef(ch.id, r as any)}
                  style={[styles.chLabel, { width: chW, height: cellH }]}
                  onLongPress={() => startDrag('chapter', ch.id, ch, 0, 0)}
                  delayLongPress={350}
                >
                  <Text style={[styles.chNum, { fontSize: fs9 }]}>
                    {ci + 1}
                  </Text>
                </Pressable>

                {/* A cell per plot */}
                {filteredPlots.map((plot) => {
                  const C = PLOT_COLORS[plot.color as ColorKey] ?? PLOT_COLORS.yellow;
                  const beats = getBeatsForCell(ch.id, plot.id);
                  const isCellDrop =
                    dragType === 'beat' &&
                    dropTarget?.type === 'cell' &&
                    dropTarget?.chapterId === ch.id &&
                    dropTarget?.plotId === plot.id;

                  return (
                    <View
                      key={plot.id}
                      ref={(r) => registerCellRef(ch.id, plot.id, r)}
                      style={[
                        styles.cell,
                        {
                          width: cellW,
                          height: cellH,
                          backgroundColor: isCellDrop ? C.dim : 'transparent',
                          borderLeftWidth: isCellDrop ? 2 : 1,
                          borderLeftColor: isCellDrop ? C.text : '#1c1c2a',
                        },
                      ]}
                    >
                      <ScrollView
                        showsVerticalScrollIndicator={false}
                        scrollEnabled={!isDragging}
                        contentContainerStyle={{ padding: pad, gap }}
                      >
                        {beats.map((beat) => (
                          <BeatCard
                            key={beat.id}
                            beat={beat}
                            plot={plot}
                            onPress={() => onEditBeat(beat.id)}
                            scale={scale}
                          />
                        ))}
                        <Pressable
                          style={[
                            styles.addBtn,
                            { height: d(28, scale, 18) },
                          ]}
                          onPress={() => onEditBeat(addBeat(ch.id, plot.id))}
                        >
                          <Text style={[styles.addBtnTxt, { fontSize: d(10, scale, 7) }]}>
                            + scene
                          </Text>
                        </Pressable>
                      </ScrollView>
                    </View>
                  );
                })}
              </View>
            );
          })}

        </View>
      </ScrollView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0e0e14' },

  headRow: {
    flexDirection: 'row',
    backgroundColor: '#0e0e14',
    borderBottomWidth: 1,
    borderBottomColor: '#1c1c2a',
  },
  plotHead: {
    justifyContent: 'flex-end',
    paddingHorizontal: 10,
    paddingBottom: 8,
    borderRightWidth: 1,
    borderRightColor: '#1c1c2a',
  },
  plotTrack: { color: '#444455', fontWeight: '700', letterSpacing: 0.8, marginBottom: 2 },
  plotTitle: { fontWeight: '700' },

  chRow: { flexDirection: 'row' },
  chLabel: {
    borderRightWidth: 1,
    borderRightColor: '#1c1c2a',
    borderLeftWidth: 2,
    borderLeftColor: '#eab308',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chNum: { color: '#eab308', fontWeight: '700', textAlign: 'center' },

  cell: {
    borderRightWidth: 1,
    borderRightColor: '#1c1c2a',
    overflow: 'hidden',
  },

  addBtn: {
    borderTopWidth: 1,
    borderTopColor: '#1c1c2a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnTxt: { color: '#444455', fontWeight: '500' },
});
