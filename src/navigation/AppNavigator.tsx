/**
 * Main App Navigator
 */

import React from 'react';
import { Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList, TabParamList } from './types';
import { colors } from '../constants/colors';

// Screens
import { HomeScreen } from '../screens/HomeScreen';
import { BrowseScreen } from '../screens/BrowseScreen';
import { ComponentDetailScreen } from '../screens/ComponentDetailScreen';
import { ComparisonScreen } from '../screens/ComparisonScreen';
import { BottleneckCalculatorScreen } from '../screens/BottleneckCalculatorScreen';

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function HomeTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarIcon: ({ color, size }) => (
          <Ionicons name="ellipse-outline" size={size ?? 20} color={color} />
        ),
        tabBarStyle: {
          backgroundColor: colors.background.primary,
          borderTopColor: colors.border.default,
          borderTopWidth: 1,
          height: Platform.OS === 'web' ? 60 : 64,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.accent.blue,
        tabBarInactiveTintColor: colors.text.secondary,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          letterSpacing: 0.5,
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: 'HOME',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="flash-outline" size={size ?? 20} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="BrowseTab"
        component={BrowseScreen}
        options={{
          tabBarLabel: 'BROWSE',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search-outline" size={size ?? 20} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="CompareTab"
        component={ComparisonScreen}
        options={{
          tabBarLabel: 'COMPARE',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="copy-outline" size={size ?? 20} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="CalculatorTab"
        component={BottleneckCalculatorScreen}
        options={{
          tabBarLabel: 'BOTTLENECK',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="analytics-outline" size={size ?? 20} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.background.primary,
          },
          headerTintColor: colors.text.primary,
          headerTitleStyle: {
            fontWeight: '600',
          },
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeTabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Browse"
          component={BrowseScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ComponentDetail"
          component={ComponentDetailScreen}
          options={{ title: 'Details' }}
        />
        <Stack.Screen
          name="Comparison"
          component={ComparisonScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="BottleneckCalculator"
          component={BottleneckCalculatorScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
