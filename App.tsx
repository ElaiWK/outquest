import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AppProvider } from './src/context/AppContext';
import { ProjectProvider } from './src/context/ProjectContext';
import { DragProvider } from './src/context/DragContext';
import DashboardScreen from './src/screens/DashboardScreen';
import EditorScreen from './src/screens/EditorScreen';
import { RootStackParamList } from './src/types';

const Stack = createNativeStackNavigator<RootStackParamList>();

function EditorWrapper({ route, navigation }: any) {
  const { projectId } = route.params;
  return (
    <ProjectProvider projectId={projectId}>
      <DragProvider>
        <EditorScreen navigation={navigation} route={route} />
      </DragProvider>
    </ProjectProvider>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppProvider>
          <NavigationContainer>
            <StatusBar style="light" />
            <Stack.Navigator
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: '#0f0f13' },
              }}
            >
              <Stack.Screen name="Dashboard" component={DashboardScreen} />
              <Stack.Screen name="Editor" component={EditorWrapper} />
            </Stack.Navigator>
          </NavigationContainer>
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
