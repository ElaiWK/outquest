import React, { useState, useLayoutEffect, useCallback } from 'react';
import {
  View,
  TextInput,
  Text,
  Pressable,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useBook } from '../context/BookContext';

type Props = NativeStackScreenProps<RootStackParamList, 'BeatDetail'>;

export default function BeatDetailScreen({ route, navigation }: Props) {
  const { beatId } = route.params;
  const { beats, chapters, updateBeat, deleteBeat } = useBook();

  const beat = beats.find((b) => b.id === beatId);
  const chapter = beat ? chapters.find((c) => c.id === beat.chapterId) : null;

  const [summary, setSummary] = useState(beat?.summary ?? '');
  const [description, setDescription] = useState(beat?.description ?? '');

  const save = useCallback(() => {
    if (!beat) return;
    updateBeat(beat.id, { summary: summary.trim() || 'Untitled beat', description });
  }, [beat, summary, description, updateBeat]);

  const handleDelete = useCallback(() => {
    Alert.alert('Delete Beat', 'Are you sure you want to delete this beat?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          if (beat) deleteBeat(beat.id);
          navigation.goBack();
        },
      },
    ]);
  }, [beat, deleteBeat, navigation]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable onPress={handleDelete} hitSlop={12}>
          <Text style={styles.headerDeleteBtn}>Delete</Text>
        </Pressable>
      ),
      headerTitleStyle: { color: '#ffffff' },
    });
  }, [navigation, handleDelete]);

  if (!beat) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Beat not found</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={88}
    >
      {chapter && (
        <View style={[styles.chapterTag, { backgroundColor: chapter.color + '33' }]}>
          <View style={[styles.chapterDot, { backgroundColor: chapter.color }]} />
          <Text style={[styles.chapterTagText, { color: chapter.color }]}>
            {chapter.title}
          </Text>
        </View>
      )}

      <TextInput
        style={styles.summaryInput}
        value={summary}
        onChangeText={setSummary}
        onBlur={save}
        placeholder="Beat summary..."
        placeholderTextColor="#555"
        multiline={false}
        returnKeyType="done"
      />

      <View style={styles.divider} />

      <ScrollView style={styles.descriptionWrapper} keyboardShouldPersistTaps="handled">
        <TextInput
          style={styles.descriptionInput}
          value={description}
          onChangeText={setDescription}
          onBlur={save}
          placeholder="Describe what happens in this beat — characters, conflict, setting, emotions..."
          placeholderTextColor="#555"
          multiline
          textAlignVertical="top"
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingHorizontal: 20,
  },
  chapterTag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginTop: 16,
    marginBottom: 8,
  },
  chapterDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  chapterTagText: {
    fontSize: 13,
    fontWeight: '600',
  },
  summaryInput: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
    paddingVertical: 12,
    lineHeight: 30,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#333',
    marginBottom: 12,
  },
  descriptionWrapper: {
    flex: 1,
  },
  descriptionInput: {
    color: '#cccccc',
    fontSize: 16,
    lineHeight: 26,
    paddingBottom: 40,
    minHeight: 300,
  },
  headerDeleteBtn: {
    color: '#ff453a',
    fontSize: 16,
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#121212',
  },
  notFoundText: {
    color: '#8e8e93',
    fontSize: 16,
  },
});
