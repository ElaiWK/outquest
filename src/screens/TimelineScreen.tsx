import React, { useCallback } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  Text,
  StyleSheet,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useBook, CHAPTER_COLORS } from '../context/BookContext';
import { useDrag } from '../context/DragContext';
import ChapterColumn from '../components/ChapterColumn';
import DragOverlay from '../components/DragOverlay';

type Props = NativeStackScreenProps<RootStackParamList, 'Timeline'>;

export default function TimelineScreen({ navigation }: Props) {
  const { chapters, beats, addChapter } = useBook();
  const { isDraggingBeat, isDraggingChapter } = useDrag();

  const sortedChapters = [...chapters].sort((a, b) => a.order - b.order);

  const handleAddChapter = useCallback(() => {
    const color = CHAPTER_COLORS[chapters.length % CHAPTER_COLORS.length];
    addChapter(`Chapter ${chapters.length + 1}`, color);
  }, [chapters, addChapter]);

  return (
    <View style={styles.container}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>Outline</Text>
        <Pressable style={styles.addBtn} onPress={handleAddChapter}>
          <Text style={styles.addBtnText}>+ Chapter</Text>
        </Pressable>
      </View>

      {/* Board */}
      <ScrollView
        horizontal
        style={styles.board}
        contentContainerStyle={styles.boardContent}
        scrollEnabled={!isDraggingBeat && !isDraggingChapter}
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {sortedChapters.map((chapter) => {
          const chapterBeats = beats
            .filter((b) => b.chapterId === chapter.id)
            .sort((a, b) => a.order - b.order);

          return (
            <ChapterColumn
              key={chapter.id}
              chapter={chapter}
              beats={chapterBeats}
              navigation={navigation}
            />
          );
        })}

        {sortedChapters.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No chapters yet</Text>
            <Text style={styles.emptySubtitle}>Tap "+ Chapter" to get started</Text>
          </View>
        )}
      </ScrollView>

      {/* Drag overlay — always on top */}
      <DragOverlay />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#1c1c1e',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#333',
  },
  topBarTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  addBtn: {
    backgroundColor: '#2c2c2e',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  addBtnText: {
    color: '#6c63ff',
    fontSize: 14,
    fontWeight: '600',
  },
  board: {
    flex: 1,
  },
  boardContent: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    minWidth: 300,
  },
  emptyTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtitle: {
    color: '#8e8e93',
    fontSize: 15,
    textAlign: 'center',
  },
});
