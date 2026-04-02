import React, { useRef, useCallback } from 'react';
import { View, Text, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Beat, Plot } from '../types';
import { PLOT_COLORS, ColorKey } from '../constants';
import { useDrag } from '../context/DragContext';

interface Props {
  beat: Beat;
  plot?: Plot;
  onPress: () => void;
  showPlotLabel?: boolean;
  scale?: number;
}

export default function BeatCard({ beat, plot, onPress, showPlotLabel = false, scale = 1 }: Props) {
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

  const s = Math.max(0.35, scale);
  const colorKey = plot?.color as ColorKey | undefined;
  const colors = colorKey && PLOT_COLORS[colorKey] ? PLOT_COLORS[colorKey] : null;
  const borderColor = colors?.text ?? '#555566';
  const isBeingDragged = isDragging && dragId === beat.id;

  return (
    <Pressable onPress={onPress} onLongPress={handleLongPress} delayLongPress={400}>
      <View
        ref={setRef}
        style={[
          {
            borderRadius: Math.round(7 * s),
            paddingHorizontal: Math.round(9 * s),
            paddingVertical: Math.round(8 * s),
            borderLeftWidth: Math.max(2, Math.round(3 * s)),
            borderLeftColor: borderColor,
            backgroundColor: colors ? colors.dim : '#1e1e2a',
            minHeight: Math.round(48 * s),
            justifyContent: 'center',
            opacity: isBeingDragged ? 0.2 : 1,
          },
        ]}
      >
        {showPlotLabel && plot && colors && (
          <View
            style={{
              alignSelf: 'flex-start',
              borderRadius: Math.round(4 * s),
              borderWidth: 1,
              borderColor,
              paddingHorizontal: Math.round(5 * s),
              paddingVertical: Math.round(2 * s),
              marginBottom: Math.round(5 * s),
            }}
          >
            <Text style={{ color: borderColor, fontSize: Math.max(7, Math.round(10 * s)), fontWeight: '600' }} numberOfLines={1}>
              {plot.title}
            </Text>
          </View>
        )}
        <Text
          style={{
            color: '#e8e8f0',
            fontSize: Math.max(8, Math.round(12 * s)),
            lineHeight: Math.max(12, Math.round(17 * s)),
          }}
          numberOfLines={3}
        >
          {beat.summary || 'New beat'}
        </Text>
        {beat.description.length > 0 && (
          <View
            style={{
              width: Math.max(3, Math.round(5 * s)),
              height: Math.max(3, Math.round(5 * s)),
              borderRadius: 3,
              marginTop: Math.round(4 * s),
              alignSelf: 'flex-end',
              backgroundColor: borderColor,
            }}
          />
        )}
      </View>
    </Pressable>
  );
}
