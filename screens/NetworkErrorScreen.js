import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SIZES } from '../constants/theme';
import CustomHeader from '../components/CustomHeader';
import CustomButton from '../components/CustomButton';

export default function NetworkErrorScreen() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <CustomHeader title="Connection Error" />
      <View style={styles.content}>
        <Image source={require('../assets/offline.png')} style={styles.image} />
        <CustomButton
          title="Back to Photo Upload"
          onPress={() => navigation.navigate('PhotoUpload')}
          style={styles.button}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7FBFC',
  },
  image: {
    width: 200,
    height: 150,
    marginBottom: SIZES.extraLarge,
  },
  button: {
    backgroundColor: COLORS.error,
  },
});