import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Network from 'expo-network';

const { height } = Dimensions.get('window');

export default function OnboardingScreen({ navigation }) {
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

        <TouchableOpacity
          style={styles.button}
          onPress={() => isConnected && navigation.navigate('PhotoUpload')}
          disabled={!isConnected}
        >
          <Text style={styles.buttonText}>Start Inspection</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  image: {
    width: '100%',
    height: height * 0.75,
    justifyContent: 'flex-end',
  },
  gradient: {
    height: 150,
    width: '100%',
  },
  content: {
    flex: 1,
    backgroundColor: 'white',
    alignItems: 'center',
    paddingHorizontal: 25,
    marginTop: 10,
    opacity: 0.9,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 25,
  },
  button: {
    backgroundColor: '#53AAA3',
    paddingVertical: 15,
    paddingHorizontal: 113,
    borderRadius: 6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});