import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Animated, Easing } from 'react-native';
import { generateReport } from '../utils/api';
import { COLORS, FONTS, SIZES } from '../constants/theme';
import * as Network from 'expo-network';

export default function ProcessingScreen({ route, navigation }) {
  const { images } = route.params || {};
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start rotation animation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [rotateAnim]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  useEffect(() => {
    const processImages = async () => {
      if (!images || images.length === 0) {
        console.log('No images to process');
        navigation.goBack();
        return;
      }

      try {
        // Check network connectivity
        const state = await Network.getNetworkStateAsync();
        if (!state.isInternetReachable) {
          console.log('No internet connection');
          navigation.navigate('NetworkError');
          return;
        }

        console.log('Generating report for', images.length, 'images...');
        const report = await generateReport(images);
        console.log('Report generated successfully, length:', report?.length);

        // Debug log to verify report data
        console.log('Report generation complete:', {
          reportLength: report?.length,
          reportPreview: report?.substring(0, 100),
          reportType: typeof report
        });

        // CRITICAL: Log what we're about to navigate with
        const navigationParams = { 
          report: report,
          images: images
        };
        console.log('⭐ NAVIGATING TO REPORT WITH PARAMS:', {
          hasReport: !!navigationParams.report,
          reportLength: navigationParams.report?.length,
          hasImages: !!navigationParams.images,
          imagesCount: navigationParams.images?.length,
          paramsKeys: Object.keys(navigationParams)
        });

        // Navigate to Report screen with the generated report
        // Using navigate instead of reset to preserve params
        navigation.replace('Report', navigationParams);

        // Log after navigation attempt
        console.log('✅ Navigation.navigate called successfully');

      } catch (error) {
        console.log('❌ Error generating report:', error);
        console.log('Error details:', error.message, error.stack);
        if (error.message.includes('Network error') || error.message.includes('Failed to fetch')) {
          navigation.navigate('NetworkError');
        } else {
          // Show error and go back
          alert('Failed to generate report. Please try again.');
          navigation.goBack();
        }
      }
    };

    processImages();
  }, [images, navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.loaderContainer}>
          <Animated.View
            style={[
              styles.circularLoader,
              { transform: [{ rotate: spin }] }
            ]}
          >
            <View style={styles.loaderArc} />
          </Animated.View>
        </View>
        
        <Text style={styles.loadingText}>Processing Photos..</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SIZES.large,
  },
  loaderContainer: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SIZES.extraLarge * 2,
  },
  circularLoader: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderArc: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 8,
    borderColor: 'transparent',
    borderTopColor: COLORS.primary,
    borderRightColor: COLORS.primary,
  },
  loadingText: {
    fontSize: SIZES.large + 2,
    ...FONTS.semiBold,
    color: COLORS.text,
    letterSpacing: 0.5,
  },
});