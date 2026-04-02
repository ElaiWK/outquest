import React, { useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useApp } from '../context/AppContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

function formatDate(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function DashboardScreen({ navigation }: Props) {
  const { projects, isLoading, createProject, deleteProject } = useApp();
  const { width } = useWindowDimensions();
  const numColumns = width >= 600 ? 2 : 1;

  const handleCreate = useCallback(async () => {
    const id = await createProject();
    navigation.navigate('Editor', { projectId: id });
  }, [createProject, navigation]);

  const handleOpen = useCallback(
    (id: string) => {
      navigation.navigate('Editor', { projectId: id });
    },
    [navigation]
  );

  const handleDelete = useCallback(
    (id: string, title: string) => {
      Alert.alert(
        'Delete Project',
        `Delete "${title}"? This cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => deleteProject(id),
          },
        ]
      );
    },
    [deleteProject]
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#eab308" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <Text style={styles.logoText}>
            STORY<Text style={styles.logoBold}>LINE</Text> PRO
          </Text>
        </View>
        <Pressable style={styles.newBtn} onPress={handleCreate}>
          <Text style={styles.newBtnText}>+ New Outline</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.grid,
          numColumns === 2 && styles.gridTwo,
        ]}
      >
        {projects.length === 0 && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No projects yet</Text>
            <Text style={styles.emptySubtitle}>Tap "New Outline" to get started</Text>
            <Pressable style={styles.emptyBtn} onPress={handleCreate}>
              <Text style={styles.emptyBtnText}>Create Your First Story</Text>
            </Pressable>
          </View>
        )}

        {projects.map((project) => (
          <Pressable
            key={project.id}
            style={[styles.card, numColumns === 2 && styles.cardHalf]}
            onPress={() => handleOpen(project.id)}
          >
            <View style={styles.cardInner}>
              <View style={styles.cardTopRow}>
                <Text style={styles.cardTitle} numberOfLines={2}>
                  {project.title}
                </Text>
                <Pressable
                  hitSlop={12}
                  style={styles.deleteBtn}
                  onPress={() => handleDelete(project.id, project.title)}
                >
                  <Text style={styles.deleteBtnText}>✕</Text>
                </Pressable>
              </View>
              <Text style={styles.cardMeta}>
                {project.chapters.filter((c) => c.status === 'published').length} chapters •{' '}
                {project.plots.length} tracks
              </Text>
              <Text style={styles.cardDate}>
                Updated {formatDate(project.lastUpdated)}
              </Text>
            </View>
            <View style={styles.cardAccent} />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f13',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0f0f13',
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 20,
    backgroundColor: '#18181f',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a35',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    color: '#8888aa',
    fontSize: 18,
    fontWeight: '300',
    letterSpacing: 3,
  },
  logoBold: {
    color: '#ffffff',
    fontWeight: '700',
  },
  newBtn: {
    backgroundColor: '#eab308',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
  },
  newBtnText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  grid: {
    padding: 16,
    gap: 12,
  },
  gridTwo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  emptyCard: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#333344',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    marginTop: 20,
    width: '100%',
  },
  emptyTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtitle: {
    color: '#666688',
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
  },
  emptyBtn: {
    backgroundColor: '#eab308',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyBtnText: {
    color: '#000000',
    fontWeight: '700',
    fontSize: 15,
  },
  card: {
    backgroundColor: '#18181f',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2a2a35',
    marginBottom: 4,
  },
  cardHalf: {
    width: '48%',
    marginHorizontal: '1%',
  },
  cardInner: {
    padding: 18,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardTitle: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  deleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2a2a35',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnText: {
    color: '#888899',
    fontSize: 12,
    fontWeight: '600',
  },
  cardMeta: {
    color: '#888899',
    fontSize: 13,
    marginBottom: 4,
  },
  cardDate: {
    color: '#555566',
    fontSize: 12,
  },
  cardAccent: {
    height: 3,
    backgroundColor: '#eab308',
  },
});
