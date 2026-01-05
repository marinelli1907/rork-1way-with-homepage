import React, { ReactNode } from 'react';
import { View, StyleSheet, ScrollView, ScrollViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import RotatingAdHeader from './RotatingAdHeader';

interface ScreenShellProps {
  children: ReactNode;
  showAd?: boolean;
  scrollable?: boolean;
  scrollViewProps?: Partial<ScrollViewProps>;
}

export default function ScreenShell({ 
  children, 
  showAd = true,
  scrollable = true,
  scrollViewProps = {}
}: ScreenShellProps) {
  const insets = useSafeAreaInsets();

  const containerStyle = [
    styles.container,
    { paddingTop: insets.top }
  ];

  if (!scrollable) {
    return (
      <View style={containerStyle}>
        {showAd && (
          <View style={styles.adContainer}>
            <RotatingAdHeader />
          </View>
        )}
        {children}
      </View>
    );
  }

  return (
    <View style={containerStyle}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        {...scrollViewProps}
      >
        {showAd && (
          <View style={styles.adContainer}>
            <RotatingAdHeader />
          </View>
        )}
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  adContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
});
