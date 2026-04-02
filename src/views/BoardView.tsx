import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native';
import { useProject } from '../context/ProjectContext';
import { useDrag } from '../context/DragContext';
import BeatCard from '../components/BeatCard';

const COLUMN_WIDTH = 260;

interface Props {
  onEditBeat: (beatId: string) => void;
}

export default function BoardView({ onEditBeat }: Props) {
  const { publishedChapters, beats, plots, addBeat } = useProject();
  const { isDragging } = useDrag();

  return (
    <ScrollView
      horizontal
      style={styles.container}
      contentContainerStyle={styles.content}
      scrollEnabled={!isDragging}
      showsHorizontalScrollIndicator={false}
    >
      {publishedChapters.map((chapter) => {
        const chapterBeats = beats
          .filter((b) => b.chapterId === chapter.id)
          .sort((a, b) => a.order - b.order || a.plotId.localeCompare(b.plotId));

        return (
          <View key={chapter.id} style={styles.column}>
            {/* Column header */}
            <View style={styles.columnHeader}>
              <Text style={styles.columnTitle} numberOfLines={2}>
                {chapter.title}
              </Text>
              <View style={styles.beatCount}>
                <Text style={styles.beatCountText}>{chapterBeats.length}</Text>
              </View>
            </View>

            {/* Beats */}
            <ScrollView
              style={styles.columnScroll}
              showsVerticalScrollIndicator={false}
              scrollEnabled={!isDragging}
            >
              {chapterBeats.map((beat) => {
                const plot = plots.find((p) => p.id === beat.plotId);
                return (
                  <BeatCard
                    key={beat.id}
                    beat={beat}
                    plot={plot}
                    onPress={() => onEditBeat(beat.id)}
                    showPlotLabel
                  />
                );
              })}
              {chapterBeats.length === 0 && (
                <View style={styles.emptyCell}>
                  <Text style={styles.emptyCellText}>No scenes yet</Text>
                </View>
              )}
            </ScrollView>

            {/* Add beat */}
            <Pressable
              style={styles.addBeatBtn}
              onPress={() => {
                const firstPlot = plots[0];
                if (firstPlot) {
                  onEditBeat(addBeat(chapter.id, firstPlot.id));
                }
              }}
            >
              <Text style={styles.addBeatBtnText}>+ Add Scene</Text>
            </Pressable>
          </View>
        );
      })}

      {publishedChapters.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No chapters</Text>
          <Text style={styles.emptySubtitle}>Add chapters to get started</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f13',
  },
  content: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 12,
    alignItems: 'flex-start',
  },
  column: {
    width: COLUMN_WIDTH,
    backgroundColor: '#18181f',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a2a35',
    overflow: 'hidden',
    maxHeight: '100%',
  },
  columnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a35',
    backgroundColor: '#1e1e28',
    gap: 8,
  },
  columnTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  beatCount: {
    backgroundColor: '#2a2a35',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  beatCountText: {
    color: '#888899',
    fontSize: 12,
    fontWeight: '600',
  },
  columnScroll: {
    maxHeight: 480,
    padding: 4,
  },
  emptyCell: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyCellText: {
    color: '#444455',
    fontSize: 13,
  },
  addBeatBtn: {
    borderTopWidth: 1,
    borderTopColor: '#2a2a35',
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#13131a',
  },
  addBeatBtnText: {
    color: '#555566',
    fontSize: 13,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtitle: {
    color: '#555566',
    fontSize: 14,
  },
});
