import React, { useRef, useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  StyleSheet,
  Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Beat, Chapter } from '../types';
import { useBook } from '../context/BookContext';
import { useDrag } from '../context/DragContext';
import BeatCard from './BeatCard';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

interface Props {
  chapter: Chapter;
  beats: Beat[];
  navigation: NativeStackNavigationProp<RootStackParamList, 'Timeline'>;
}

export default function ChapterColumn({ chapter, beats, navigation }: Props) {
  const ref = useRef<View>(null);
  const { updateChapter, deleteChapter, addBeat } = useBook();
  const {
    registerColumnRef,
    startChapterDrag,
    isDraggingBeat,
    dropBeatTarget,
    dropChapterIndex,
    isDraggingChapter,
    draggingChapter,
  } = useDrag();

  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(chapter.title);

  const setRef = useCallback(
    (r: View | null) => {
      (ref as React.MutableRefObject<View | null>).current = r;
      registerColumnRef(chapter.id, r);
    },
    [chapter.id, registerColumnRef]
  );

  const handleHeaderLongPress = useCallback(() => {
    if (!ref.current) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    ref.current.measureInWindow((x, y, width, height) => {
      startChapterDrag(chapter, x + width / 2, y + height / 2);
    });
  }, [chapter, startChapterDrag]);

  const handleDeleteChapter = useCallback(() => {
    Alert.alert('Delete Chapter', `Delete "${chapter.title}" and all its beats?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteChapter(chapter.id),
      },
    ]);
  }, [chapter, deleteChapter]);

  const isBeingDragged = isDraggingChapter && draggingChapter?.id === chapter.id;

  const dropIndicatorIndex =
    dropBeatTarget?.chapterId === chapter.id ? dropBeatTarget.beatIndex : null;

  return (
    <View
      ref={setRef}
      style={[styles.column, isBeingDragged && styles.columnDragging]}
    >
      {/* Header */}
      <Pressable onLongPress={handleHeaderLongPress} delayLongPress={400}>
        <View style={[styles.header, { borderTopColor: chapter.color }]}>
          {editingTitle ? (
            <TextInput
              style={styles.titleInput}
              value={titleDraft}
              onChangeText={setTitleDraft}
              autoFocus
              onBlur={() => {
                setEditingTitle(false);
                if (titleDraft.trim()) {
                  updateChapter(chapter.id, titleDraft.trim());
                } else {
                  setTitleDraft(chapter.title);
                }
              }}
              onSubmitEditing={() => {
                setEditingTitle(false);
                if (titleDraft.trim()) {
                  updateChapter(chapter.id, titleDraft.trim());
                }
              }}
            />
          ) : (
            <Pressable onPress={() => setEditingTitle(true)} style={styles.titleWrapper}>
              <Text style={styles.title} numberOfLines={1}>
                {chapter.title}
              </Text>
            </Pressable>
          )}
          <Pressable onPress={handleDeleteChapter} style={styles.deleteBtn} hitSlop={8}>
            <Text style={styles.deleteBtnText}>✕</Text>
          </Pressable>
        </View>
      </Pressable>

      {/* Beats */}
      <ScrollView
        style={styles.beatList}
        scrollEnabled={!isDraggingBeat}
        showsVerticalScrollIndicator={false}
      >
        {beats.map((beat, index) => (
          <React.Fragment key={beat.id}>
            {dropIndicatorIndex === index && (
              <View style={[styles.dropIndicator, { backgroundColor: chapter.color }]} />
            )}
            <BeatCard
              beat={beat}
              chapterColor={chapter.color}
              onPress={() => navigation.navigate('BeatDetail', { beatId: beat.id })}
            />
          </React.Fragment>
        ))}
        {dropIndicatorIndex === beats.length && (
          <View style={[styles.dropIndicator, { backgroundColor: chapter.color }]} />
        )}

        {/* Add Beat button */}
        <Pressable
          style={styles.addBeatBtn}
          onPress={() => addBeat(chapter.id)}
        >
          <Text style={[styles.addBeatText, { color: chapter.color }]}>+ Beat</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  column: {
    width: 200,
    backgroundColor: '#1e1e1e',
    borderRadius: 10,
    marginHorizontal: 6,
    marginVertical: 8,
    overflow: 'hidden',
    flex: 1,
  },
  columnDragging: {
    opacity: 0.25,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderTopWidth: 3,
    backgroundColor: '#252525',
  },
  titleWrapper: {
    flex: 1,
  },
  title: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  titleInput: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    padding: 0,
    margin: 0,
  },
  deleteBtn: {
    marginLeft: 8,
    padding: 4,
  },
  deleteBtnText: {
    color: '#8e8e93',
    fontSize: 12,
  },
  beatList: {
    flex: 1,
    paddingVertical: 4,
  },
  dropIndicator: {
    height: 3,
    marginHorizontal: 6,
    borderRadius: 2,
    marginVertical: 2,
  },
  addBeatBtn: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  addBeatText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
