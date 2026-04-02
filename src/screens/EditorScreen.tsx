import React, { useState, useCallback, useRef, useEffect } from 'react';
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

type Props = NativeStackScreenProps<RootStackParamList, 'Editor'> & { navigation: any };

const MIN_SCALE = 0.35;
const MAX_SCALE = 2.0;
const SCALE_STEP = 0.1;

const VIEW_MODES: Array<{ key: ViewMode; icon: string }> = [
  { key: 'timeline', icon: '⊞' },
  { key: 'vertical', icon: '☰' },
  { key: 'board',    icon: '⬜' },
  { key: 'inbox',    icon: '◫' },
];

export default function EditorScreen({ navigation }: Props) {
  const {
    title, setTitle,
    plots, plotFilter, setPlotFilter,
    addPlot, addChapter,
  } = useProject();

  const [viewMode, setViewMode] = useState<ViewMode>('timeline');
  const [scale, setScale] = useState(1.0);
  const [editingBeatId, setEditingBeatId] = useState<string | null>(null);
  const [editingPlotId, setEditingPlotId] = useState<string | null>(null);
  const [titleEditing, setTitleEditing] = useState(false);
  const [showFilter, setShowFilter] = useState(false);

  const scaleRef = useRef(scale);
  useEffect(() => { scaleRef.current = scale; }, [scale]);

  // Pinch-to-zoom (works in web browser)
  const gridRef = useRef<View>(null);
  useEffect(() => {
    if (viewMode === 'inbox') return;
    const el = gridRef.current as any;
    if (!el?.addEventListener) return;

    let initDist = 0;
    let initScale = 1;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        initDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        initScale = scaleRef.current;
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const next = Math.max(MIN_SCALE, Math.min(MAX_SCALE, initScale * (dist / initDist)));
        setScale(parseFloat(next.toFixed(2)));
      }
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
    };
  }, [viewMode]);

  const filterLabel = plotFilter === 'all'
    ? 'All Tracks'
    : (plots.find(p => p.id === plotFilter)?.title ?? 'Track');

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>

        {/* ── Single compact header row ── */}
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
              <Text style={styles.titleText} numberOfLines={1}>{title}</Text>
            </Pressable>
          )}

          {/* View mode pill */}
          <View style={styles.modePill}>
            {VIEW_MODES.map(vm => (
              <Pressable
                key={vm.key}
                style={[styles.modeTab, viewMode === vm.key && styles.modeTabActive]}
                onPress={() => setViewMode(vm.key)}
              >
                <Text style={[styles.modeIcon, viewMode === vm.key && styles.modeIconActive]}>
                  {vm.icon}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Filter button */}
          <Pressable
            style={[styles.filterBtn, showFilter && styles.filterBtnActive]}
            onPress={() => setShowFilter(v => !v)}
          >
            <Text style={[styles.filterText, showFilter && styles.filterTextActive]} numberOfLines={1}>
              {filterLabel.length > 8 ? filterLabel.slice(0, 8) + '…' : filterLabel}
            </Text>
          </Pressable>

          {/* Add chapter / draft */}
          <Pressable style={styles.addBtn} onPress={viewMode === 'inbox' ? addPlot : addChapter}>
            <Text style={styles.addBtnText}>+</Text>
          </Pressable>
        </View>

        {/* Filter dropdown */}
        {showFilter && (
          <View style={styles.filterDropdown}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
              {[{ id: 'all', title: 'All Tracks' }, ...plots].map(p => (
                <Pressable
                  key={p.id}
                  style={[styles.filterChip, plotFilter === p.id && styles.filterChipActive]}
                  onPress={() => { setPlotFilter(p.id); setShowFilter(false); }}
                >
                  <Text style={[styles.filterChipText, plotFilter === p.id && styles.filterChipTextActive]}>
                    {p.title}
                  </Text>
                </Pressable>
              ))}
              <Pressable style={styles.filterChip} onPress={() => { addPlot(); setShowFilter(false); }}>
                <Text style={styles.addTrackText}>+ Track</Text>
              </Pressable>
            </ScrollView>
          </View>
        )}

        {/* Main view */}
        <View ref={gridRef} style={styles.viewContainer}>
          {viewMode === 'timeline' && (
            <TimelineView scale={scale} onEditBeat={setEditingBeatId} onEditPlot={setEditingPlotId} />
          )}
          {viewMode === 'vertical' && (
            <VerticalView scale={scale} onEditBeat={setEditingBeatId} onEditPlot={setEditingPlotId} />
          )}
          {viewMode === 'board' && (
            <BoardView onEditBeat={setEditingBeatId} />
          )}
          {viewMode === 'inbox' && (
            <InboxView onEditBeat={setEditingBeatId} />
          )}
        </View>

        {/* Zoom controls (bottom-right, hidden in inbox) */}
        {viewMode !== 'inbox' && (
          <View style={styles.zoom}>
            <Pressable style={styles.zoomBtn} onPress={() => setScale(s => Math.max(MIN_SCALE, +(s - SCALE_STEP).toFixed(1)))}>
              <Text style={styles.zoomBtnText}>−</Text>
            </Pressable>
            <Text style={styles.zoomLabel}>{Math.round(scale * 100)}%</Text>
            <Pressable style={styles.zoomBtn} onPress={() => setScale(s => Math.min(MAX_SCALE, +(s + SCALE_STEP).toFixed(1)))}>
              <Text style={styles.zoomBtnText}>+</Text>
            </Pressable>
          </View>
        )}

        <BeatEditModal beatId={editingBeatId} onClose={() => setEditingBeatId(null)} />
        <PlotEditModal plotId={editingPlotId} onClose={() => setEditingPlotId(null)} />
        <DragOverlay />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0f0f13' },
  container: { flex: 1, backgroundColor: '#0f0f13' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: '#13131a',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a35',
    gap: 6,
    height: 48,
  },
  backBtn: {
    width: 30,
    height: 30,
    borderRadius: 7,
    backgroundColor: '#2a2a35',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  backBtnText: { color: '#fff', fontSize: 20, lineHeight: 24 },

  titleBtn: { flex: 1, paddingVertical: 4, paddingHorizontal: 6 },
  titleText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
  titleInput: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    backgroundColor: '#2a2a35',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  modePill: {
    flexDirection: 'row',
    backgroundColor: '#1e1e28',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2a2a35',
    overflow: 'hidden',
    flexShrink: 0,
  },
  modeTab: { paddingHorizontal: 7, paddingVertical: 5 },
  modeTabActive: { backgroundColor: '#2a2a3f' },
  modeIcon: { color: '#555566', fontSize: 13 },
  modeIconActive: { color: '#eab308' },

  filterBtn: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 7,
    backgroundColor: '#1e1e28',
    borderWidth: 1,
    borderColor: '#2a2a35',
    flexShrink: 0,
    maxWidth: 90,
  },
  filterBtnActive: { borderColor: '#eab308' },
  filterText: { color: '#888899', fontSize: 11, fontWeight: '500' },
  filterTextActive: { color: '#eab308' },

  addBtn: {
    width: 30,
    height: 30,
    borderRadius: 7,
    backgroundColor: '#eab308',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  addBtnText: { color: '#000', fontSize: 20, lineHeight: 24, fontWeight: '700' },

  filterDropdown: {
    backgroundColor: '#13131a',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a35',
  },
  filterRow: { paddingHorizontal: 10, paddingVertical: 8, gap: 6 },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#2a2a35',
    borderWidth: 1,
    borderColor: '#3a3a4a',
  },
  filterChipActive: { backgroundColor: '#eab308', borderColor: '#eab308' },
  filterChipText: { color: '#aaaacc', fontSize: 12, fontWeight: '500' },
  filterChipTextActive: { color: '#000', fontWeight: '700' },
  addTrackText: { color: '#eab308', fontSize: 12, fontWeight: '600' },

  viewContainer: { flex: 1, overflow: 'hidden' },

  zoom: {
    position: 'absolute',
    bottom: 16,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e1e28',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2a2a35',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },
  zoomBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomBtnText: { color: '#fff', fontSize: 18, fontWeight: '400' },
  zoomLabel: {
    color: '#aaaacc',
    fontSize: 11,
    fontWeight: '600',
    minWidth: 36,
    textAlign: 'center',
  },
});
