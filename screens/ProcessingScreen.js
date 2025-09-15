import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { generateReport } from '../utils/api';

export default function ProcessingScreen({ route, navigation }) {
  const { images } = route.params || {};

  useEffect(() => {
    const processImages = async () => {
      if (!images || images.length === 0) {
        Alert.alert('No images to process!');
        navigation.goBack();
        return;
      }
      try {
        console.log('Sending images to backend:', JSON.stringify(images, null, 2));
        const report = await generateReport(images);
        console.log('Received report:', report);
        navigation.navigate('Chat', { report, images });
      } catch (error) {
        console.log('Network error details:', error.message, error.stack);
        Alert.alert('Analysis failed:', error.message || 'Network request failed');
        navigation.goBack();
      }
    };

    processImages();
  }, [images]);

  return (
    <View style={styles.container}>
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#53AAA3" style={styles.spinner} />
        <Text style={styles.loadingText}>Processing Photos..</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    marginBottom: 24,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    letterSpacing: 0.5,
  },
});