import { NavigationContainerRef } from '@react-navigation/native';
import { AuthStackParamList } from '../types/navigation';

let navigationRef: NavigationContainerRef<AuthStackParamList> | null = null;

export const setNavigationRef = (ref: NavigationContainerRef<AuthStackParamList>) => {
  navigationRef = ref;
};

export const getNavigationState = () => {
  return navigationRef?.getState();
};

export const getNavigation = () => {
  return navigationRef;
};

export const navigate = (name: string, params?: any) => {
  navigationRef?.navigate(name as any, params);
};
