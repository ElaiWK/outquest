import React, { useRef, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Beat, Plot } from '../types';
import { PLOT_COLORS, ColorKey } from '../constants';
import { useDrag } from '../context/DragContext';

interface Props {
  beat: Beat;
  plot?: Plot;
  onPress: () => void;
  showPlotLabel?: boolean;
}

export default function BeatCard({ beat, plot, onPress, showPlotLabel = false }: Props) {
  const ref = useRef<View>(null);
  const { registerBeatRef, startDrag, dragId, isDragging } = useDrag();

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
      startDrag('beat', beat.id, beat, x + width / 2, y + height / 2);
    });
  }, [beat, startDrag]);

  const isBeingDragged = isDragging && dragId === beat.id;

  const colorKey = plot?.color as ColorKey | undefined;
  const colors = colorKey && PLOT_COLORS[colorKey] ? PLOT_COLORS[colorKey] : null;
  const borderColor = colors?.text ?? '#555566';

  return (
    <Pressable onPress={onPress} onLongPress={handleLongPress} delayLongPress={400}>
      <View
        ref={setRef}
        style={[
          styles.card,
          { borderLeftColor: borderColor, backgroundColor: colors ? colors.dim : '#2c2c3a' },
          isBeingDragged && styles.cardDragging,
        ]}
      >
        {showPlotLabel && plot && (
          <View style={[styles.plotTag, { backgroundColor: colors?.dim ?? 'transparent', borderColor: borderColor }]}>
            <Text style={[styles.plotTagText, { color: borderColor }]} numberOfLines={1}>
              {plot.title}
            </Text>
          </View>
        )}
        <Text style={styles.summary} numberOfLines={2}>
          {beat.summary}
        </Text>
        {beat.description.length > 0 && (
          <View style={[styles.dot, { backgroundColor: borderColor }]} />
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 8,
    padding: 10,
    marginVertical: 4,
    marginHorizontal: 4,
    borderLeftWidth: 3,
    minHeight: 56,
    justifyContent: 'center',
  },
  cardDragging: {
    opacity: 0.2,
  },
  plotTag: {
    alignSelf: 'flex-start',
    borderRadius: 4,
    borderWidth: 1,
    paddingHorizontal: 5,
    paddingVertical: 2,
    marginBottom: 5,
  },
  plotTagText: {
    fontSize: 10,
    fontWeight: '600',
  },
  summary: {
    color: '#ffffff',
    fontSize: 13,
    lineHeight: 18,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginTop: 5,
    alignSelf: 'flex-end',
  },
});
