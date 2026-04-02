import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Modal,
  StyleSheet,
  Alert,
} from 'react-native';
import { Plot } from '../types';
import { PLOT_COLORS, COLOR_KEYS, ColorKey } from '../constants';
import { useProject } from '../context/ProjectContext';

interface Props {
  plotId: string | null;
  onClose: () => void;
}

export default function PlotEditModal({ plotId, onClose }: Props) {
  const { plots, updatePlot, deletePlot } = useProject();
  const plot = plots.find((p) => p.id === plotId) ?? null;

  const [title, setTitle] = useState('');
  const [selectedColor, setSelectedColor] = useState<ColorKey>('yellow');

  useEffect(() => {
    if (plot) {
      setTitle(plot.title);
      setSelectedColor((plot.color as ColorKey) ?? 'yellow');
    }
  }, [plot, plotId]);

  const handleSave = useCallback(() => {
    if (!plot) return;
    updatePlot(plot.id, { title: title.trim() || 'New Track', color: selectedColor });
    onClose();
  }, [plot, title, selectedColor, updatePlot, onClose]);

  const handleDelete = useCallback(() => {
    if (!plot) return;
    Alert.alert(
      'Delete Track',
      `Delete "${plot.title}"? All beats in this track will be moved to unassigned.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deletePlot(plot.id);
            onClose();
          },
        },
      ]
    );
  }, [plot, deletePlot, onClose]);

  return (
    <Modal
      visible={plotId !== null}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.dialog}>
          <Text style={styles.title}>Edit Story Track</Text>

          <Text style={styles.label}>Track Name</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Track name..."
            placeholderTextColor="#555566"
            autoFocus
            selectTextOnFocus
          />

          <Text style={styles.label}>Color</Text>
          <View style={styles.colorRow}>
            {COLOR_KEYS.map((key) => {
              const colors = PLOT_COLORS[key];
              const isSelected = selectedColor === key;
              return (
                <Pressable
                  key={key}
                  style={[
                    styles.colorCircle,
                    { backgroundColor: colors.bg },
                    isSelected && styles.colorCircleSelected,
                  ]}
                  onPress={() => setSelectedColor(key)}
                >
                  {isSelected && <Text style={styles.checkmark}>✓</Text>}
                </Pressable>
              );
            })}
          </View>

          <View style={styles.buttonRow}>
            <Pressable style={styles.deleteBtn} onPress={handleDelete}>
              <Text style={styles.deleteBtnText}>Delete</Text>
            </Pressable>
            <Pressable style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>Save</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  dialog: {
    backgroundColor: '#1e1e28',
    borderRadius: 16,
    padding: 24,
    width: 320,
    borderWidth: 1,
    borderColor: '#2a2a35',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 16,
  },
  title: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 20,
  },
  label: {
    color: '#aaaacc',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#24242f',
    borderRadius: 8,
    padding: 12,
    color: '#ffffff',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#3a3a4a',
    marginBottom: 18,
  },
  colorRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  colorCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorCircleSelected: {
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  deleteBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#3a1515',
    borderWidth: 1,
    borderColor: '#8b0000',
  },
  deleteBtnText: {
    color: '#ff4444',
    fontWeight: '700',
    fontSize: 14,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#2a2a35',
  },
  cancelBtnText: {
    color: '#aaaacc',
    fontWeight: '600',
    fontSize: 14,
  },
  saveBtn: {
    flex: 1.5,
    paddingVertical: 11,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#eab308',
  },
  saveBtnText: {
    color: '#000000',
    fontWeight: '700',
    fontSize: 14,
  },
});
