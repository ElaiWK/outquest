import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  Alert,
} from 'react-native';
import { useProject } from '../context/ProjectContext';
import BeatCard from '../components/BeatCard';

interface Props {
  onEditBeat: (beatId: string) => void;
}

export default function InboxView({ onEditBeat }: Props) {
  const {
    beats,
    plots,
    draftChapters,
    addBeat,
    addDraftChapter,
    publishDraftChapter,
    deleteChapter,
    getBeatsForCell,
  } = useProject();

  const { width } = useWindowDimensions();
  const isWide = width >= 600;

  const looseBeats = beats
    .filter((b) => b.chapterId === 'inbox')
    .sort((a, b) => a.order - b.order);

  const handlePublish = (chapterId: string, title: string) => {
    Alert.alert(
      'Publish Chapter',
      `Publish "${title}" to the main timeline? Unassigned scenes will move to the first track.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Publish',
          onPress: () => publishDraftChapter(chapterId),
        },
      ]
    );
  };

  const handleDeleteDraft = (chapterId: string, title: string) => {
    Alert.alert(
      'Delete Draft',
      `Delete "${title}"? Scenes will move to loose scenes.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteChapter(chapterId),
        },
      ]
    );
  };

  const content = (
    <>
      {/* Loose Scenes Panel */}
      <View style={[styles.panel, isWide && styles.panelHalf]}>
        <View style={styles.panelHeader}>
          <View>
            <Text style={styles.panelTitle}>Loose Scenes</Text>
            <Text style={styles.panelSubtitle}>Scenes not assigned to any chapter</Text>
          </View>
          <Pressable
            style={styles.addBtn}
            onPress={() => {
              const firstPlot = plots[0];
              onEditBeat(addBeat('inbox', firstPlot?.id ?? 'inbox'));
            }}
          >
            <Text style={styles.addBtnText}>+ Scene</Text>
          </Pressable>
        </View>
        <ScrollView style={styles.panelScroll} showsVerticalScrollIndicator={false}>
          {looseBeats.length === 0 && (
            <View style={styles.emptyPanel}>
              <Text style={styles.emptyPanelText}>No loose scenes</Text>
            </View>
          )}
          {looseBeats.map((beat) => {
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
        </ScrollView>
      </View>

      {/* Draft Chapters Panel */}
      <View style={[styles.panel, isWide && styles.panelHalf]}>
        <View style={styles.panelHeader}>
          <View>
            <Text style={styles.panelTitle}>Draft Chapters</Text>
            <Text style={styles.panelSubtitle}>Chapters not yet in the timeline</Text>
          </View>
          <Pressable style={styles.addBtn} onPress={addDraftChapter}>
            <Text style={styles.addBtnText}>+ Draft</Text>
          </Pressable>
        </View>
        <ScrollView style={styles.panelScroll} showsVerticalScrollIndicator={false}>
          {draftChapters.length === 0 && (
            <View style={styles.emptyPanel}>
              <Text style={styles.emptyPanelText}>No draft chapters</Text>
            </View>
          )}
          {draftChapters.map((chapter) => {
            const draftBeats = beats
              .filter((b) => b.chapterId === chapter.id)
              .sort((a, b) => a.order - b.order);

            return (
              <View key={chapter.id} style={styles.draftCard}>
                <View style={styles.draftCardHeader}>
                  <View style={styles.draftBadge}>
                    <Text style={styles.draftBadgeText}>DRAFT</Text>
                  </View>
                  <Text style={styles.draftTitle} numberOfLines={1}>
                    {chapter.title}
                  </Text>
                  <View style={styles.draftActions}>
                    <Pressable
                      style={styles.publishBtn}
                      onPress={() => handlePublish(chapter.id, chapter.title)}
                    >
                      <Text style={styles.publishBtnText}>Publish</Text>
                    </Pressable>
                    <Pressable
                      style={styles.deleteDraftBtn}
                      onPress={() => handleDeleteDraft(chapter.id, chapter.title)}
                    >
                      <Text style={styles.deleteDraftBtnText}>✕</Text>
                    </Pressable>
                  </View>
                </View>

                {draftBeats.map((beat) => {
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

                <Pressable
                  style={styles.addSceneBtn}
                  onPress={() => {
                    const firstPlot = plots[0];
                    onEditBeat(addBeat(chapter.id, firstPlot?.id ?? 'inbox'));
                  }}
                >
                  <Text style={styles.addSceneBtnText}>+ Add Scene</Text>
                </Pressable>
              </View>
            );
          })}
        </ScrollView>
      </View>
    </>
  );

  return (
    <View style={[styles.container, isWide && styles.containerWide]}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f13',
  },
  containerWide: {
    flexDirection: 'row',
  },
  panel: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a35',
  },
  panelHalf: {
    borderBottomWidth: 0,
    borderRightWidth: 1,
    borderRightColor: '#2a2a35',
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a35',
    backgroundColor: '#13131a',
  },
  panelTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  panelSubtitle: {
    color: '#555566',
    fontSize: 12,
    marginTop: 2,
  },
  addBtn: {
    backgroundColor: '#2a2a35',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#3a3a4a',
  },
  addBtnText: {
    color: '#eab308',
    fontSize: 13,
    fontWeight: '600',
  },
  panelScroll: {
    flex: 1,
    padding: 8,
  },
  emptyPanel: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyPanelText: {
    color: '#444455',
    fontSize: 14,
  },
  draftCard: {
    backgroundColor: '#18181f',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a2a35',
    marginBottom: 12,
    overflow: 'hidden',
  },
  draftCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a35',
    backgroundColor: '#1e1e28',
    gap: 8,
  },
  draftBadge: {
    backgroundColor: '#2a2a35',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  draftBadgeText: {
    color: '#888899',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
  draftTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  draftActions: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  publishBtn: {
    backgroundColor: '#eab308',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  publishBtnText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '700',
  },
  deleteDraftBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#3a1515',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteDraftBtnText: {
    color: '#ff4444',
    fontSize: 11,
    fontWeight: '700',
  },
  addSceneBtn: {
    paddingVertical: 8,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#2a2a35',
  },
  addSceneBtnText: {
    color: '#555566',
    fontSize: 12,
    fontWeight: '500',
  },
});
