import React, { useState } from 'react';
import { Text, TouchableOpacity, Modal, View, Pressable, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import WelcomeScreen from './screens/WelcomeScreen';
import PhotoUploadScreen from './screens/PhotoUploadScreen';
import ProcessingScreen from './screens/ProcessingScreen';
import ChatScreen from './screens/ChatScreen';
import SplashScreen from './screens/SplashScreen';
import NetworkErrorScreen from './screens/NetworkErrorScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Stack = createStackNavigator();

// Custom Back Button with modal style
function PhotoUploadBackButton({ navigation }) {
  const [modalVisible, setModalVisible] = useState(false);

  const handleBackPress = () => setModalVisible(true);
  const confirmBack = async () => {
    try {
      await AsyncStorage.removeItem('cachedImages');
    } catch (e) {
      console.log('Failed to clear cache:', e);
    }
    setModalVisible(false);
    navigation.navigate('Welcome');
  };

  return (
    <>
      <TouchableOpacity onPress={handleBackPress}>
        <Text style={{ color: '#53AAA3', fontSize: 22, fontWeight: 'bold' }}>←</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.alertBox}>
            <Text style={styles.alertTitle}>Warning</Text>
            <Text style={styles.alertMessage}>Going back will erase all uploaded photos. Do you want to proceed?</Text>
            <View style={styles.alertActions}>
              <Pressable style={[styles.alertButton, styles.alertSecondary]} onPress={() => setModalVisible(false)}>
                <Text style={styles.alertButtonTextSecondary}>Stay</Text>
              </Pressable>
              <Pressable style={[styles.alertButton, styles.alertPrimary]} onPress={confirmBack}>
                <Text style={styles.alertButtonText}>Go Back</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Splash">
        <Stack.Screen
          name="Splash"
          component={SplashScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Welcome"
          component={WelcomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="PhotoUpload"
          component={PhotoUploadScreen}
          options={({ navigation }) => ({
            headerLeft: () => null,
            headerTitle: () => <PhotoUploadBackButton navigation={navigation} />,
          })}
        />
        <Stack.Screen
          name="Processing"
          component={ProcessingScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Chat"
          component={ChatScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
  name="NetworkErrorScreen"
  component={NetworkErrorScreen}
  options={{ headerShown: false }}
/>
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const TEAL = '#53AAA3';
const TEXT_DARK = '#233239';

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10,10,10,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  alertBox: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 14,
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  alertTitle: { fontSize: 18, fontWeight: '700', color: TEAL, marginBottom: 8 },
  alertMessage: { fontSize: 15, color: TEXT_DARK, textAlign: 'center', marginBottom: 16 },
  alertActions: { flexDirection: 'row', justifyContent: 'center', width: '100%', gap: 10 },
  alertButton: { minWidth: 100, paddingVertical: 12, paddingHorizontal: 18, borderRadius: 10, alignItems: 'center' },
  alertPrimary: { backgroundColor: TEAL },
  alertSecondary: { backgroundColor: '#F0F0F0' },
  alertButtonText: { color: '#fff', fontWeight: '700' },
  alertButtonTextSecondary: { color: '#333', fontWeight: '700' },
});
