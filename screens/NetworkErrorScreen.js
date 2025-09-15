import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function NetworkErrorScreen() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <Image source={require('../assets/offline.png')} style={styles.image} />
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('PhotoUpload')}>
        <Text style={styles.backButtonText}>Back to Photo Upload</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F7FBFC' },
  image: { width: 200, height: 150, marginBottom: 20 }, // Adjust size as needed for your image
  title: { fontSize: 24, fontWeight: '700', color: '#233239', marginBottom: 10 },
  message: { fontSize: 16, color: '#6E7A83', textAlign: 'center', marginBottom: 20 },
  backButton: { 
    backgroundColor: '#FF6B6B', // Changed to red
    paddingVertical: 12, 
    paddingHorizontal: 30, 
    borderRadius: 8, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 4, 
    elevation: 2 
  },
  backButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
});