import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Modal,
  ScrollView,
  StyleSheet,
  Animated,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Beat } from '../types';
import { useProject } from '../context/ProjectContext';

interface Props {
  beatId: string | null;
  onClose: () => void;
}

export default function BeatEditModal({ beatId, onClose }: Props) {
  const {
    beats,
    chapters,
    plots,
    publishedChapters,
    draftChapters,
    updateBeat,
    deleteBeat,
  } = useProject();

  const beat = beats.find((b) => b.id === beatId) ?? null;

  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPlotId, setSelectedPlotId] = useState('inbox');
  const [selectedChapterId, setSelectedChapterId] = useState('inbox');

  const slideAnim = useRef(new Animated.Value(600)).current;

  useEffect(() => {
    if (beat) {
      setSummary(beat.summary);
      setDescription(beat.description);
      setSelectedPlotId(beat.plotId);
      setSelectedChapterId(beat.chapterId);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 600,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [beat, beatId]);

  const handleSave = useCallback(() => {
    if (!beat) return;
    updateBeat(beat.id, {
      summary: summary.trim() || 'Untitled Scene',
      description,
      plotId: selectedPlotId,
      chapterId: selectedChapterId,
    });
    onClose();
  }, [beat, summary, description, selectedPlotId, selectedChapterId, updateBeat, onClose]);

  const handleDelete = useCallback(() => {
    if (!beat) return;
    Alert.alert(
      'Delete Scene',
      `Delete "${beat.summary}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteBeat(beat.id);
            onClose();
          },
        },
      ]
    );
  }, [beat, deleteBeat, onClose]);

  const visible = beatId !== null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.kavContainer}
        >
          <Animated.View
            style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}
          >
            {/* Handle */}
            <View style={styles.handle} />

            {/* Header */}
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Edit Scene</Text>
              <Pressable style={styles.closeBtn} onPress={onClose}>
                <Text style={styles.closeBtnText}>✕</Text>
              </Pressable>
            </View>

            <ScrollView
              style={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Story Track */}
              <Text style={styles.label}>Story Track</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.optionRow}
                contentContainerStyle={styles.optionRowContent}
              >
                <Pressable
                  style={[styles.optionChip, selectedPlotId === 'inbox' && styles.optionChipActive]}
                  onPress={() => setSelectedPlotId('inbox')}
                >
                  <Text style={[styles.optionChipText, selectedPlotId === 'inbox' && styles.optionChipTextActive]}>
                    Unassigned
                  </Text>
                </Pressable>
                {plots.map((p) => (
                  <Pressable
                    key={p.id}
                    style={[styles.optionChip, selectedPlotId === p.id && styles.optionChipActive]}
                    onPress={() => setSelectedPlotId(p.id)}
                  >
                    <Text style={[styles.optionChipText, selectedPlotId === p.id && styles.optionChipTextActive]}>
                      {p.title}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>

              {/* Timeline Position */}
              <Text style={styles.label}>Timeline Position</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.optionRow}
                contentContainerStyle={styles.optionRowContent}
              >
                <Pressable
                  style={[styles.optionChip, selectedChapterId === 'inbox' && styles.optionChipActive]}
                  onPress={() => setSelectedChapterId('inbox')}
                >
                  <Text style={[styles.optionChipText, selectedChapterId === 'inbox' && styles.optionChipTextActive]}>
                    Inbox
                  </Text>
                </Pressable>
                {draftChapters.length > 0 && (
                  <View style={styles.sectionDivider}>
                    <Text style={styles.sectionDividerText}>DRAFTS</Text>
                  </View>
                )}
                {draftChapters.map((c) => (
                  <Pressable
                    key={c.id}
                    style={[styles.optionChip, selectedChapterId === c.id && styles.optionChipActive]}
                    onPress={() => setSelectedChapterId(c.id)}
                  >
                    <Text style={[styles.optionChipText, selectedChapterId === c.id && styles.optionChipTextActive]}>
                      {c.title}
                    </Text>
                  </Pressable>
                ))}
                {publishedChapters.length > 0 && (
                  <View style={styles.sectionDivider}>
                    <Text style={styles.sectionDividerText}>PUBLISHED</Text>
                  </View>
                )}
                {publishedChapters.map((c) => (
                  <Pressable
                    key={c.id}
                    style={[styles.optionChip, selectedChapterId === c.id && styles.optionChipActive]}
                    onPress={() => setSelectedChapterId(c.id)}
                  >
                    <Text style={[styles.optionChipText, selectedChapterId === c.id && styles.optionChipTextActive]}>
                      {c.title}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>

              {/* Summary */}
              <Text style={styles.label}>Summary</Text>
              <TextInput
                style={styles.summaryInput}
                value={summary}
                onChangeText={setSummary}
                placeholder="Scene summary..."
                placeholderTextColor="#555566"
                multiline
                returnKeyType="default"
              />

              {/* Description */}
              <Text style={styles.label}>Notes / Description</Text>
              <TextInput
                style={styles.descriptionInput}
                value={description}
                onChangeText={setDescription}
                placeholder="Additional notes..."
                placeholderTextColor="#555566"
                multiline
                textAlignVertical="top"
              />

              <View style={styles.buttonRow}>
                <Pressable style={styles.deleteButton} onPress={handleDelete}>
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </Pressable>
                <Pressable style={styles.saveButton} onPress={handleSave}>
                  <Text style={styles.saveButtonText}>Save</Text>
                </Pressable>
              </View>
              <View style={styles.bottomSpacer} />
            </ScrollView>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  kavContainer: {
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#18181f',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    borderTopWidth: 1,
    borderColor: '#2a2a35',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#444455',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a35',
  },
  sheetTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#2a2a35',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: '#aaaacc',
    fontSize: 14,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  label: {
    color: '#aaaacc',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    marginTop: 18,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  optionRow: {
    flexGrow: 0,
  },
  optionRowContent: {
    paddingBottom: 4,
    gap: 8,
    alignItems: 'center',
  },
  optionChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#2a2a35',
    borderWidth: 1,
    borderColor: '#3a3a4a',
  },
  optionChipActive: {
    backgroundColor: '#eab308',
    borderColor: '#eab308',
  },
  optionChipText: {
    color: '#aaaacc',
    fontSize: 13,
    fontWeight: '500',
  },
  optionChipTextActive: {
    color: '#000000',
    fontWeight: '700',
  },
  sectionDivider: {
    paddingHorizontal: 8,
    alignSelf: 'center',
  },
  sectionDividerText: {
    color: '#555566',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  summaryInput: {
    backgroundColor: '#24242f',
    borderRadius: 10,
    padding: 14,
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '500',
    minHeight: 60,
    borderWidth: 1,
    borderColor: '#3a3a4a',
  },
  descriptionInput: {
    backgroundColor: '#24242f',
    borderRadius: 10,
    padding: 14,
    color: '#ffffff',
    fontSize: 14,
    minHeight: 100,
    borderWidth: 1,
    borderColor: '#3a3a4a',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#3a1515',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#8b0000',
  },
  deleteButtonText: {
    color: '#ff4444',
    fontSize: 15,
    fontWeight: '700',
  },
  saveButton: {
    flex: 2,
    backgroundColor: '#eab308',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '700',
  },
  bottomSpacer: {
    height: 32,
  },
});
