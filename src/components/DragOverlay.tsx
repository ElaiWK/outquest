import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
} from 'react-native';
import { useDrag } from '../context/DragContext';
import { useProject } from '../context/ProjectContext';
import { PLOT_COLORS, ColorKey } from '../constants';

export default function DragOverlay() {
  const {
    isDragging,
    dragType,
    dragId,
    dragContent,
    dragX,
    dragY,
    updateDrag,
    endDrag,
    cancelDrag,
  } = useDrag();

  const { plots } = useProject();

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (e) => {
        updateDrag(e.nativeEvent.pageX, e.nativeEvent.pageY);
      },
      onPanResponderRelease: () => {
        endDrag();
      },
      onPanResponderTerminate: () => {
        cancelDrag();
      },
    })
  ).current;

  if (!isDragging) return null;

  const cardWidth = 200;
  const cardLeft = dragX - cardWidth / 2;
  const cardTop = dragY - 30;

  if (dragType === 'beat' && dragContent) {
    const beat = dragContent;
    const plot = plots.find((p) => p.id === beat.plotId);
    const colorKey = plot?.color as ColorKey | undefined;
    const colors = colorKey && PLOT_COLORS[colorKey] ? PLOT_COLORS[colorKey] : null;
    const borderColor = colors?.text ?? '#eab308';

    return (
      <View
        style={StyleSheet.absoluteFillObject}
        {...panResponder.panHandlers}
        pointerEvents="box-only"
      >
        <View
          style={[
            styles.floatingCard,
            {
              left: cardLeft,
              top: cardTop,
              borderLeftColor: borderColor,
              backgroundColor: colors ? colors.dim : 'rgba(234,179,8,0.1)',
              width: cardWidth,
            },
          ]}
        >
          <Text style={styles.floatingText} numberOfLines={2}>
            {beat.summary}
          </Text>
        </View>
      </View>
    );
  }

  if (dragType === 'chapter' && dragContent) {
    return (
      <View
        style={StyleSheet.absoluteFillObject}
        {...panResponder.panHandlers}
        pointerEvents="box-only"
      >
        <View
          style={[
            styles.floatingPill,
            {
              left: cardLeft,
              top: cardTop,
              width: cardWidth,
            },
          ]}
        >
          <Text style={styles.floatingPillText} numberOfLines={1}>
            {dragContent.title}
          </Text>
        </View>
      </View>
    );
  }

  if (dragType === 'plot' && dragContent) {
    const plot = dragContent;
    const colorKey = plot?.color as ColorKey | undefined;
    const colors = colorKey && PLOT_COLORS[colorKey] ? PLOT_COLORS[colorKey] : null;

    return (
      <View
        style={StyleSheet.absoluteFillObject}
        {...panResponder.panHandlers}
        pointerEvents="box-only"
      >
        <View
          style={[
            styles.floatingPill,
            {
              left: cardLeft,
              top: cardTop,
              width: cardWidth,
              borderColor: colors?.text ?? '#eab308',
              borderWidth: 2,
            },
          ]}
        >
          <View style={[styles.plotDot, { backgroundColor: colors?.bg ?? '#eab308' }]} />
          <Text style={styles.floatingPillText} numberOfLines={1}>
            {dragContent.title}
          </Text>
        </View>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  floatingCard: {
    position: 'absolute',
    borderRadius: 8,
    padding: 10,
    borderLeftWidth: 3,
    minHeight: 56,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 12,
    transform: [{ scale: 1.05 }],
  },
  floatingText: {
    color: '#ffffff',
    fontSize: 13,
    lineHeight: 18,
  },
  floatingPill: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a3a',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 12,
    transform: [{ scale: 1.05 }],
    gap: 8,
  },
  floatingPillText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  plotDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
