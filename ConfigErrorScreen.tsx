/**
 * Shown when the app crashes at load time (e.g. missing Firebase env).
 * This file must NOT import anything from ./src/infrastructure/firebase or App.
 */
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

interface Props {
  error: Error;
}

export function ConfigErrorScreen({ error }: Props) {
  const message = error?.message || String(error);
  const isConfigError =
    message.includes('Firebase') ||
    message.includes('environment') ||
    message.includes('EXPO_PUBLIC');

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Configuration error</Text>
        <Text style={styles.subtitle}>
          {isConfigError
            ? 'Environment variables are missing. This usually means the build was made without EAS env vars.'
            : 'The app failed to start.'}
        </Text>
        <View style={styles.box}>
          <Text style={styles.label}>Error:</Text>
          <Text style={styles.message} selectable>
            {message}
          </Text>
        </View>
        <Text style={styles.hint}>
          For production: set variables with{'\n'}
          eas env:push production --path .env --force
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: { padding: 24, paddingTop: 60 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 8, color: '#1a1a1a' },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 24, lineHeight: 22 },
  box: { backgroundColor: '#f5f5f5', padding: 16, borderRadius: 8, marginBottom: 24 },
  label: { fontSize: 12, fontWeight: '600', color: '#666', marginBottom: 4 },
  message: { fontSize: 13, color: '#c00', fontFamily: 'monospace' },
  hint: { fontSize: 12, color: '#888', lineHeight: 18 },
});
