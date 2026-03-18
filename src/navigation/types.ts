/**
 * Navigation type definitions
 */

import { NavigatorScreenParams } from '@react-navigation/native';
import { ComponentType } from '../types';

export type TabParamList = {
  HomeTab: undefined;
  BrowseTab: { componentType?: ComponentType } | undefined;
  CompareTab: { componentIds?: string[] } | undefined;
  CalculatorTab: undefined;
};

export type RootStackParamList = {
  Home: NavigatorScreenParams<TabParamList> | undefined;
  Browse: { componentType?: ComponentType } | undefined;
  ComponentDetail: { componentId: string };
  Comparison: { componentIds?: string[] } | undefined;
  BottleneckCalculator: undefined;
};
