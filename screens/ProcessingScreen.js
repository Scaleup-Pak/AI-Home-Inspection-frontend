import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { generateReport } from '../utils/api';
import { COLORS, FONTS, SIZES } from '../constants/theme';
import CustomHeader from '../components/CustomHeader';

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
        navigation.navigate('NetworkError');
      }
    };

    processImages();
  }, [images, navigation]);

  return (
    <View style={styles.container}>
      <CustomHeader title="Processing" />
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} style={styles.spinner} />
        <Text style={styles.loadingText}>Processing Photos..</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    marginBottom: SIZES.extraLarge,
  },
  loadingText: {
    fontSize: SIZES.large,
    ...FONTS.semiBold,
    color: COLORS.text,
    letterSpacing: 0.5,
  },
});