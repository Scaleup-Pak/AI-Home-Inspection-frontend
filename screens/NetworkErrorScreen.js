import React, { useState } from 'react';
import { View, Image, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Network from 'expo-network';
import { COLORS, FONTS, SIZES } from '../constants/theme';
import CustomButton from '../components/CustomButton';

export default function NetworkErrorScreen() {
  const navigation = useNavigation();
  const [isChecking, setIsChecking] = useState(false);

  const checkConnection = async () => {
    setIsChecking(true);
    try {
      const networkState = await Network.getNetworkStateAsync();
      
      if (networkState.isInternetReachable) {
        // If internet is back, go back to previous screen
        navigation.goBack();
      } else {
        // If still offline, show error message
        setIsChecking(false);
      }
    } catch (error) {
      console.log('Network check error:', error);
      setIsChecking(false);
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/offline.png')}
        style={styles.image}
      />
      <Text style={styles.title}>You are offline!</Text>
      <Text style={styles.subtitle}>
        Please check your internet connection and try again.
      </Text>
      
      <CustomButton
        title={isChecking ? "Refreshing..." : "Refresh"}
        onPress={checkConnection}
        style={[styles.button, isChecking && styles.buttonDisabled]}
        disabled={isChecking}
        icon={isChecking ? () => <ActivityIndicator color={COLORS.background} size="small" /> : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SIZES.large,
  },
  image: {
    width: 120,
    height: 120,
    marginBottom: SIZES.large,
    tintColor: COLORS.error,
  },
  title: {
    fontSize: SIZES.large,
    ...FONTS.bold,
    color: COLORS.text,
    marginBottom: SIZES.small,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: SIZES.medium,
    ...FONTS.regular,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SIZES.extraLarge,
  },
  button: {
    backgroundColor: COLORS.error,
    paddingHorizontal: SIZES.large,
    width: '100%',
    height: 52,
    borderRadius: SIZES.base * 1.5,
    shadowColor: COLORS.error,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: COLORS.error + '80', // 50% opacity
    shadowOpacity: 0,
    elevation: 0,
  },
});
