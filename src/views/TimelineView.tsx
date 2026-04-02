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
const LABEL_W = 100;
const CELL_W  = 185;
const HEAD_H  = 48;
const CELL_H  = 145;
const BEAT_W  = 135;

function d(base: number, scale: number, min = 4): number {
  return Math.max(min, Math.round(base * scale));
}

export default function TimelineView({ scale, onEditBeat, onEditPlot }: Props) {
  const {
    publishedChapters, filteredPlots, getBeatsForCell, addBeat, updateChapter,
  } = useProject();
  const {
    registerCellRef, registerChapterRef, registerPlotRef,
    startDrag, isDragging, dragType, dropTarget,
  } = useDrag();

  const labelW = d(LABEL_W, scale, 40);
  const cellW  = d(CELL_W, scale, 60);
  const headH  = d(HEAD_H, scale, 24);
  const cellH  = d(CELL_H, scale, 50);
  const beatW  = d(BEAT_W, scale, 50);
  const pad    = d(8, scale, 3);
  const gap    = d(6, scale, 2);
  const fs9    = d(9, scale, 7);
  const fs11   = d(11, scale, 8);

  return (
    <ScrollView style={styles.root} showsVerticalScrollIndicator={false}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>

          {/* Chapter header row */}
          <View style={[styles.headRow, { height: headH }]}>
            {/* Corner spacer */}
            <View style={{ width: labelW, borderRightWidth: 1, borderRightColor: '#1c1c2a' }} />

            {publishedChapters.map((ch, i) => {
              const isDrop = dragType === 'chapter' && dropTarget?.type === 'chapter' && dropTarget?.index === i;
              return (
                <Pressable
                  key={ch.id}
                  ref={(r) => registerChapterRef(ch.id, r as any)}
                  style={[
                    styles.chHead,
                    {
                      width: cellW,
                      borderLeftWidth: isDrop ? 3 : 1,
                      borderLeftColor: isDrop ? '#eab308' : '#1c1c2a',
                    },
                  ]}
                  onLongPress={() => startDrag('chapter', ch.id, ch, 0, 0)}
                  delayLongPress={350}
                >
                  <Text style={[styles.chNum, { fontSize: fs9 }]}>CH {i + 1}</Text>
                  <Text style={[styles.chTitle, { fontSize: fs11 }]} numberOfLines={1}>
                    {ch.title || 'Chapter'}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* One row per plot track */}
          {filteredPlots.map((plot, pi) => {
            const C = PLOT_COLORS[plot.color as ColorKey] ?? PLOT_COLORS.yellow;
            const isPlotDrop = dragType === 'plot' && dropTarget?.type === 'plot' && dropTarget?.index === pi;

            return (
              <View
                key={plot.id}
                style={[
                  styles.plotRow,
                  {
                    height: cellH,
                    borderTopWidth: isPlotDrop ? 2 : 1,
                    borderTopColor: isPlotDrop ? C.text : '#1c1c2a',
                  },
                ]}
              >
                {/* Plot label */}
                <Pressable
                  ref={(r) => registerPlotRef(plot.id, r as any)}
                  style={[
                    styles.plotLabel,
                    { width: labelW, height: cellH, borderLeftColor: C.text },
                  ]}
                  onPress={() => onEditPlot(plot.id)}
                  onLongPress={() => startDrag('plot', plot.id, plot, 0, 0)}
                  delayLongPress={350}
                >
                  <Text
                    style={[styles.plotName, { fontSize: fs11, color: C.text }]}
                    numberOfLines={5}
                  >
                    {plot.title}
                  </Text>
                </Pressable>

                {/* A cell per chapter */}
                {publishedChapters.map((ch) => {
                  const beats = getBeatsForCell(ch.id, plot.id);
                  const isCellDrop =
                    dragType === 'beat' &&
                    dropTarget?.type === 'cell' &&
                    dropTarget?.chapterId === ch.id &&
                    dropTarget?.plotId === plot.id;

                  return (
                    <View
                      key={ch.id}
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
                      {/* Horizontal track line */}
                      <View
                        style={{
                          position: 'absolute',
                          left: 0,
                          right: 0,
                          top: Math.round(cellH / 2),
                          height: 1,
                          backgroundColor: C.text + '35',
                        }}
                      />

                      {/* Beat cards scroll horizontally */}
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        scrollEnabled={!isDragging}
                        style={StyleSheet.absoluteFillObject}
                        contentContainerStyle={{
                          alignItems: 'center',
                          paddingHorizontal: pad,
                          paddingVertical: pad,
                          gap,
                        }}
                      >
                        {beats.map((beat) => (
                          <View key={beat.id} style={{ width: beatW }}>
                            <BeatCard
                              beat={beat}
                              plot={plot}
                              onPress={() => onEditBeat(beat.id)}
                              scale={scale}
                            />
                          </View>
                        ))}

                        <Pressable
                          style={{
                            width: d(30, scale, 18),
                            height: d(65, scale, 30),
                            borderWidth: 1,
                            borderStyle: 'dashed',
                            borderColor: '#2a2a3c',
                            borderRadius: d(8, scale, 4),
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          onPress={() => onEditBeat(addBeat(ch.id, plot.id))}
                        >
                          <Text style={{ color: '#444455', fontSize: d(18, scale, 10) }}>+</Text>
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
  chHead: {
    justifyContent: 'flex-end',
    paddingHorizontal: 10,
    paddingBottom: 7,
    borderRightWidth: 1,
    borderRightColor: '#1c1c2a',
  },
  chNum: { color: '#eab308', fontWeight: '700', letterSpacing: 0.8, marginBottom: 2 },
  chTitle: { color: '#8888aa', fontWeight: '600' },

  plotRow: { flexDirection: 'row' },
  plotLabel: {
    justifyContent: 'center',
    paddingHorizontal: 8,
    borderRightWidth: 1,
    borderRightColor: '#1c1c2a',
    borderLeftWidth: 3,
  },
  plotName: { fontWeight: '600', lineHeight: 16 },

  cell: {
    borderRightWidth: 1,
    borderRightColor: '#1c1c2a',
    overflow: 'hidden',
    position: 'relative',
  },
});
