import React, { useRef, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Beat } from '../types';
import { useDrag } from '../context/DragContext';

interface Props {
  beat: Beat;
  chapterColor: string;
  onPress: () => void;
}

export default function BeatCard({ beat, chapterColor, onPress }: Props) {
  const ref = useRef<View>(null);
  const { registerBeatRef, startBeatDrag, draggingBeat, isDraggingBeat } = useDrag();

  const setRef = useCallback(
    (r: View | null) => {
      (ref as React.MutableRefObject<View | null>).current = r;
      registerBeatRef(beat.id, r);
    },
    [beat.id, registerBeatRef]
  );

  const handleLongPress = useCallback(() => {
    if (!ref.current) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    ref.current.measureInWindow((x, y, width, height) => {
      startBeatDrag(beat, x + width / 2, y + height / 2);
    });
  }, [beat, startBeatDrag]);

  const isBeingDragged = isDraggingBeat && draggingBeat?.id === beat.id;

  return (
    <Pressable onPress={onPress} onLongPress={handleLongPress} delayLongPress={400}>
      <View
        ref={setRef}
        style={[
          styles.card,
          { borderLeftColor: chapterColor },
          isBeingDragged && styles.cardDragging,
        ]}
      >
        <Text style={styles.summary} numberOfLines={2}>
          {beat.summary}
        </Text>
        {beat.description.length > 0 && (
          <View style={[styles.dot, { backgroundColor: chapterColor }]} />
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#2c2c2e',
    borderRadius: 8,
    padding: 10,
    marginVertical: 4,
    marginHorizontal: 6,
    borderLeftWidth: 3,
    minHeight: 60,
    justifyContent: 'center',
  },
  cardDragging: {
    opacity: 0.2,
  },
  summary: {
    color: '#ffffff',
    fontSize: 13,
    lineHeight: 18,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
    alignSelf: 'flex-end',
  },
});
