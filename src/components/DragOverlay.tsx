import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  Animated,
} from 'react-native';
import { useDrag } from '../context/DragContext';
import { useBook } from '../context/BookContext';

export default function DragOverlay() {
  const {
    isDraggingBeat,
    isDraggingChapter,
    draggingBeat,
    draggingChapter,
    dragX,
    dragY,
    updateDrag,
    endDrag,
    cancelDrag,
  } = useDrag();

  const { chapters } = useBook();
  const isActive = isDraggingBeat || isDraggingChapter;

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

  if (!isActive) return null;

  const cardWidth = 188;
  const cardLeft = dragX - cardWidth / 2;
  const cardTop = dragY - 35;

  if (isDraggingBeat && draggingBeat) {
    const chapter = chapters.find((c) => c.id === draggingBeat.chapterId);
    const color = chapter?.color ?? '#6c63ff';

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
              borderLeftColor: color,
              width: cardWidth,
            },
          ]}
        >
          <Text style={styles.floatingText} numberOfLines={2}>
            {draggingBeat.summary}
          </Text>
        </View>
      </View>
    );
  }

  if (isDraggingChapter && draggingChapter) {
    return (
      <View
        style={StyleSheet.absoluteFillObject}
        {...panResponder.panHandlers}
        pointerEvents="box-only"
      >
        <View
          style={[
            styles.floatingHeader,
            {
              left: cardLeft,
              top: cardTop - 10,
              borderTopColor: draggingChapter.color,
              width: cardWidth,
            },
          ]}
        >
          <Text style={styles.floatingTitle} numberOfLines={1}>
            {draggingChapter.title}
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
    backgroundColor: '#3a3a3c',
    borderRadius: 8,
    padding: 10,
    borderLeftWidth: 3,
    minHeight: 60,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
    transform: [{ scale: 1.05 }],
  },
  floatingText: {
    color: '#ffffff',
    fontSize: 13,
    lineHeight: 18,
  },
  floatingHeader: {
    position: 'absolute',
    backgroundColor: '#303030',
    borderRadius: 8,
    padding: 12,
    borderTopWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
    transform: [{ scale: 1.05 }],
  },
  floatingTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
});
