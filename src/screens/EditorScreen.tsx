import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, ViewMode } from '../types';
import { useProject } from '../context/ProjectContext';
import TimelineView from '../views/TimelineView';
import VerticalView from '../views/VerticalView';
import BoardView from '../views/BoardView';
import InboxView from '../views/InboxView';
import BeatEditModal from '../components/BeatEditModal';
import PlotEditModal from '../components/PlotEditModal';
import DragOverlay from '../components/DragOverlay';

type Props = NativeStackScreenProps<RootStackParamList, 'Editor'> & {
  navigation: any;
};

const MIN_SCALE = 0.4;
const MAX_SCALE = 2.0;
const SCALE_STEP = 0.1;

export default function EditorScreen({ navigation }: Props) {
  const {
    title,
    setTitle,
    plots,
    plotFilter,
    setPlotFilter,
    addPlot,
    addChapter,
    publishedChapters,
    draftChapters,
  } = useProject();

  const [viewMode, setViewMode] = useState<ViewMode>('timeline');
  const [scale, setScale] = useState(1.0);
  const [editingBeatId, setEditingBeatId] = useState<string | null>(null);
  const [editingPlotId, setEditingPlotId] = useState<string | null>(null);
  const [titleEditing, setTitleEditing] = useState(false);
  const [showPlotFilter, setShowPlotFilter] = useState(false);

  const handleZoomIn = () => setScale((s) => Math.min(MAX_SCALE, +(s + SCALE_STEP).toFixed(1)));
  const handleZoomOut = () => setScale((s) => Math.max(MIN_SCALE, +(s - SCALE_STEP).toFixed(1)));
  const zoomPercent = Math.round(scale * 100);

  const handleEditBeat = useCallback((beatId: string) => {
    setEditingBeatId(beatId);
  }, []);

  const handleEditPlot = useCallback((plotId: string) => {
    setEditingPlotId(plotId);
  }, []);

  const closeBeatModal = useCallback(() => setEditingBeatId(null), []);
  const closePlotModal = useCallback(() => setEditingPlotId(null), []);

  const viewModes: Array<{ key: ViewMode; label: string; icon: string }> = [
    { key: 'timeline', label: 'Timeline', icon: '⬛' },
    { key: 'vertical', label: 'Vertical', icon: '☰' },
    { key: 'board', label: 'Board', icon: '⬜' },
    { key: 'inbox', label: 'Inbox', icon: '◫' },
  ];

  const showZoom = viewMode !== 'inbox';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnText}>‹</Text>
          </Pressable>

          {titleEditing ? (
            <TextInput
              style={styles.titleInput}
              value={title}
              onChangeText={setTitle}
              onBlur={() => setTitleEditing(false)}
              autoFocus
              selectTextOnFocus
            />
          ) : (
            <Pressable onPress={() => setTitleEditing(true)} style={styles.titleBtn}>
              <Text style={styles.titleText} numberOfLines={1}>
                {title}
              </Text>
            </Pressable>
          )}

          <View style={styles.headerRight}>
            {/* Plot filter */}
            <Pressable
              style={[styles.filterBtn, showPlotFilter && styles.filterBtnActive]}
              onPress={() => setShowPlotFilter((v) => !v)}
            >
              <Text style={[styles.filterBtnText, showPlotFilter && styles.filterBtnTextActive]}>
                {plotFilter === 'all'
                  ? 'All Tracks'
                  : plots.find((p) => p.id === plotFilter)?.title ?? 'Track'}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Plot filter dropdown */}
        {showPlotFilter && (
          <View style={styles.filterDropdown}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterOptions}>
              <Pressable
                style={[styles.filterOption, plotFilter === 'all' && styles.filterOptionActive]}
                onPress={() => { setPlotFilter('all'); setShowPlotFilter(false); }}
              >
                <Text style={[styles.filterOptionText, plotFilter === 'all' && styles.filterOptionTextActive]}>
                  All Tracks
                </Text>
              </Pressable>
              {plots.map((p) => (
                <Pressable
                  key={p.id}
                  style={[styles.filterOption, plotFilter === p.id && styles.filterOptionActive]}
                  onPress={() => { setPlotFilter(p.id); setShowPlotFilter(false); }}
                >
                  <Text style={[styles.filterOptionText, plotFilter === p.id && styles.filterOptionTextActive]}>
                    {p.title}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {/* View tabs */}
        <View style={styles.tabs}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsContent}
          >
            {viewModes.map((vm) => (
              <Pressable
                key={vm.key}
                style={[styles.tab, viewMode === vm.key && styles.tabActive]}
                onPress={() => setViewMode(vm.key)}
              >
                <Text style={[styles.tabText, viewMode === vm.key && styles.tabTextActive]}>
                  {vm.label}
                </Text>
              </Pressable>
            ))}

            <View style={styles.tabSeparator} />

            <Pressable style={styles.actionBtn} onPress={addPlot}>
              <Text style={styles.actionBtnText}>+ Track</Text>
            </Pressable>

            {viewMode !== 'inbox' && (
              <Pressable style={styles.actionBtn} onPress={addChapter}>
                <Text style={styles.actionBtnText}>+ Chapter</Text>
              </Pressable>
            )}

            {viewMode === 'inbox' && (
              <View style={styles.inboxCount}>
                <Text style={styles.inboxCountText}>
                  {draftChapters.length} draft{draftChapters.length !== 1 ? 's' : ''}
                </Text>
              </View>
            )}
          </ScrollView>
        </View>

        {/* Main view */}
        <View style={styles.viewContainer}>
          {viewMode === 'timeline' && (
            <TimelineView
              scale={scale}
              onEditBeat={handleEditBeat}
              onEditPlot={handleEditPlot}
            />
          )}
          {viewMode === 'vertical' && (
            <VerticalView
              scale={scale}
              onEditBeat={handleEditBeat}
              onEditPlot={handleEditPlot}
            />
          )}
          {viewMode === 'board' && (
            <BoardView onEditBeat={handleEditBeat} />
          )}
          {viewMode === 'inbox' && (
            <InboxView onEditBeat={handleEditBeat} />
          )}
        </View>

        {/* Zoom controls */}
        {showZoom && (
          <View style={styles.zoomControls}>
            <Pressable style={styles.zoomBtn} onPress={handleZoomOut}>
              <Text style={styles.zoomBtnText}>−</Text>
            </Pressable>
            <View style={styles.zoomValue}>
              <Text style={styles.zoomValueText}>{zoomPercent}%</Text>
            </View>
            <Pressable style={styles.zoomBtn} onPress={handleZoomIn}>
              <Text style={styles.zoomBtnText}>+</Text>
            </Pressable>
          </View>
        )}

        {/* Modals */}
        <BeatEditModal beatId={editingBeatId} onClose={closeBeatModal} />
        <PlotEditModal plotId={editingPlotId} onClose={closePlotModal} />

        {/* Drag overlay — always on top */}
        <DragOverlay />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f0f13',
  },
  container: {
    flex: 1,
    backgroundColor: '#0f0f13',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#13131a',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a35',
    gap: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#2a2a35',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  backBtnText: {
    color: '#ffffff',
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '300',
  },
  titleBtn: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  titleText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  titleInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    backgroundColor: '#2a2a35',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  filterBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 7,
    backgroundColor: '#2a2a35',
    borderWidth: 1,
    borderColor: '#3a3a4a',
  },
  filterBtnActive: {
    borderColor: '#eab308',
    backgroundColor: 'rgba(234,179,8,0.1)',
  },
  filterBtnText: {
    color: '#888899',
    fontSize: 12,
    fontWeight: '500',
  },
  filterBtnTextActive: {
    color: '#eab308',
  },
  filterDropdown: {
    backgroundColor: '#1e1e28',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a35',
  },
  filterOptions: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  filterOption: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: '#2a2a35',
    borderWidth: 1,
    borderColor: '#3a3a4a',
  },
  filterOptionActive: {
    backgroundColor: '#eab308',
    borderColor: '#eab308',
  },
  filterOptionText: {
    color: '#aaaacc',
    fontSize: 13,
    fontWeight: '500',
  },
  filterOptionTextActive: {
    color: '#000000',
    fontWeight: '700',
  },
  tabs: {
    backgroundColor: '#13131a',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a35',
  },
  tabsContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
    alignItems: 'center',
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 7,
    backgroundColor: 'transparent',
  },
  tabActive: {
    backgroundColor: '#2a2a35',
  },
  tabText: {
    color: '#666677',
    fontSize: 13,
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  tabSeparator: {
    width: 1,
    height: 18,
    backgroundColor: '#2a2a35',
    marginHorizontal: 4,
  },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 7,
    backgroundColor: '#2a2a35',
    borderWidth: 1,
    borderColor: '#3a3a4a',
  },
  actionBtnText: {
    color: '#eab308',
    fontSize: 13,
    fontWeight: '600',
  },
  inboxCount: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: '#2a2a35',
  },
  inboxCountText: {
    color: '#888899',
    fontSize: 12,
  },
  viewContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  zoomControls: {
    position: 'absolute',
    bottom: 20,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e1e28',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2a2a35',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  zoomBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2a2a35',
  },
  zoomBtnText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '500',
  },
  zoomValue: {
    paddingHorizontal: 10,
  },
  zoomValueText: {
    color: '#aaaacc',
    fontSize: 12,
    fontWeight: '600',
    minWidth: 38,
    textAlign: 'center',
  },
});
