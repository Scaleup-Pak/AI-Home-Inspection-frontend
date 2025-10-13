import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Network from 'expo-network';
import CustomButton from '../components/CustomButton';
import { COLORS, FONTS, SIZES } from '../constants/theme';

const { height } = Dimensions.get('window');

export default function WelcomeScreen({ navigation }) {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const checkNetwork = async () => {
      const state = await Network.getNetworkStateAsync();
      setIsConnected(state.isInternetReachable);
    };
    checkNetwork();

    const subscription = Network.addNetworkStateListener(state => {
      setIsConnected(state.isInternetReachable);
    });

    return () => subscription.remove();
  }, [navigation]);

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../assets/background.jpg')} 
        style={styles.image}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['transparent', 'white']}
          style={styles.gradient}
        />
      </ImageBackground>

      <View style={styles.content}>
        <Text style={styles.title}>AI Home Inspections{"\n"}Made Simple</Text>
        <Text style={styles.subtitle}>
          An AI-powered mobile app that transforms home photos into instant
          inspection reports with interactive chat support
        </Text>

        <CustomButton
          title="Start Inspection"
          onPress={() => isConnected && navigation.navigate('PhotoUpload')}
          disabled={!isConnected}
          style={{ width: '90%' }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  image: {
    width: '100%',
    height: height * 0.75,
    justifyContent: 'flex-end',
    marginTop: -20,
  },
  gradient: {
    height: 150,
    width: '100%',
  },
  content: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    paddingHorizontal: SIZES.extraLarge,
    marginTop: SIZES.base * 1.25,
    opacity: 0.9,
  },
  title: {
    fontSize: 28,
    ...FONTS.bold,
    textAlign: 'center',
    marginBottom: SIZES.base * 1.5,
    color: COLORS.text,
  },
  subtitle: {
    fontSize: SIZES.medium,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SIZES.extraLarge,
  },
});