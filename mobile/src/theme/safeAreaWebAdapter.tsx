import React from 'react';
import { View } from 'react-native';

export const SafeAreaProvider = ({ children }: any) => <>{children}</>;

export const SafeAreaView = ({ children, style, ...props }: any) => (
  <View style={[{ flex: 1 }, style]} {...props}>
    {children}
  </View>
);

export const useSafeAreaInsets = () => ({ top: 0, bottom: 0, left: 0, right: 0 });

export default {
  SafeAreaProvider,
  SafeAreaView,
  useSafeAreaInsets,
};
