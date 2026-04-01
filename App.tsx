import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { BookProvider } from './src/context/BookContext';
import { DragProvider } from './src/context/DragContext';
import TimelineScreen from './src/screens/TimelineScreen';
import BeatDetailScreen from './src/screens/BeatDetailScreen';
import { RootStackParamList } from './src/types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <BookProvider>
          <DragProvider>
            <NavigationContainer>
              <StatusBar style="light" />
              <Stack.Navigator
                screenOptions={{
                  headerStyle: { backgroundColor: '#1c1c1e' },
                  headerTintColor: '#ffffff',
                  contentStyle: { backgroundColor: '#121212' },
                  headerShadowVisible: false,
                }}
              >
                <Stack.Screen
                  name="Timeline"
                  component={TimelineScreen}
                  options={{ title: 'OutQuest', headerShown: false }}
                />
                <Stack.Screen
                  name="BeatDetail"
                  component={BeatDetailScreen}
                  options={{ title: 'Beat Detail' }}
                />
              </Stack.Navigator>
            </NavigationContainer>
          </DragProvider>
        </BookProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
