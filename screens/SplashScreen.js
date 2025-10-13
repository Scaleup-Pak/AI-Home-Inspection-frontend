import React, { useState, useEffect } from 'react';
import { View, Image, StyleSheet, ImageBackground } from 'react-native';
import * as Network from 'expo-network';
import { COLORS } from '../constants/theme';

export default function SplashScreen({ navigation }) {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const checkNetwork = async () => {
      const state = await Network.getNetworkStateAsync();
      setIsConnected(state.isInternetReachable);
      if (state.isInternetReachable) {
        const timer = setTimeout(() => {
          navigation.replace('Welcome');
        }, 1500);
        return () => clearTimeout(timer);
      }
    };
    checkNetwork();

    const subscription = Network.addNetworkStateListener(state => {
      setIsConnected(state.isInternetReachable);
      if (state.isInternetReachable) {
        const timer = setTimeout(() => {
          navigation.replace('Welcome');
        }, 1500);
        return () => clearTimeout(timer);
      }
    });

    return () => subscription.remove();
  }, [navigation]);

  return (
    <ImageBackground
      source={require('../assets/Splash.jpg')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <Image source={require('../assets/Frame 103.png')} style={styles.logo} />
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: `${COLORS.background}BF`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
  },
});