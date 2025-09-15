import React, { useState, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  SafeAreaView,
  Modal,
  Pressable,
  Linking,
  Platform,
  Alert,
  BackHandler,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Network from 'expo-network';

const CATEGORIES = [
  'Roofing',
  'Exterior',
  'Living Areas & Bedrooms',
  'Kitchen',
  'Bathroom',
  'Basement & Foundation',
  'Utilities',
];

const CATEGORY_ICONS = {
  Roofing: require('../assets/roofing.png'),
  Exterior: require('../assets/exterior.png'),
  'Living Areas & Bedrooms': require('../assets/bedroom.png'),
  Kitchen: require('../assets/kitchen.png'),
  Bathroom: require('../assets/washroom.png'),
  'Basement & Foundation': require('../assets/basement.png'),
  Utilities: require('../assets/utilities.png'),
};

export default function PhotoUploadScreen({ navigation }) {
  const [images, setImages] = useState({});
  const [totalCount, setTotalCount] = useState(0);
  const [expandedCategory, setExpandedCategory] = useState(null); // Resets on app restart
  const [photoIdCounter, setPhotoIdCounter] = useState(0);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('Notice');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertShowSettings, setAlertShowSettings] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [showOnlineBanner, setShowOnlineBanner] = useState(false);
  const [backConfirmVisible, setBackConfirmVisible] = useState(false);

  // Clear cache on app start/restart
  useEffect(() => {
    const clearCacheOnAppStart = async () => {
      try {
        await AsyncStorage.removeItem('cachedImages');
        console.log('Cleared cached images on fresh app start');
      } catch (err) {
        console.log('Failed to clear cache on start:', err);
      }
    };
    clearCacheOnAppStart();
  }, []);

  useFocusEffect(
    useCallback(() => {
      // Reset to empty state when screen comes into focus
      setImages({});
      setTotalCount(0);
      setPhotoIdCounter(0);
      setExpandedCategory(null);
    }, [])
  );

  useEffect(() => {
    const checkNetwork = async () => {
      try {
        const state = await Network.getNetworkStateAsync();
        setIsConnected(state.isInternetReachable);
        if (state.isInternetReachable && !isConnected) {
          setShowOnlineBanner(true);
          setTimeout(() => setShowOnlineBanner(false), 3000);
        }
      } catch (error) {
        console.log('Error checking network:', error);
        setIsConnected(false);
      }
    };

    checkNetwork();

    const subscription = Network.addNetworkStateListener(state => {
      setIsConnected(state.isInternetReachable);
      if (!isConnected && state.isInternetReachable) {
        setShowOnlineBanner(true);
        setTimeout(() => setShowOnlineBanner(false), 3000);
      }
    });

    return () => subscription.remove();
  }, [isConnected]);

  // Back handler for confirming data loss
  useEffect(() => {
    const backAction = () => {
      setBackConfirmVisible(true);
      return true;
    };
    const subscription = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => subscription.remove();
  }, []);

  const confirmBackNavigation = () => {
    // Clear cache and navigate back
    AsyncStorage.removeItem('cachedImages').then(() => {
      navigation.navigate('WelcomeScreen');
    });
  };

  const showAlert = ({ title = 'Notice', message = '', showSettings = false }) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertShowSettings(showSettings);
    setAlertVisible(true);
  };

  const hideAlert = () => {
    setAlertVisible(false);
    setAlertShowSettings(false);
    setAlertMessage('');
    setAlertTitle('Notice');
  };

  const openSettings = async () => {
    try {
      if (Platform.OS === 'ios') {
        await Linking.openURL('app-settings:');
      } else {
        await Linking.openSettings();
      }
    } catch (err) {
      console.warn('Could not open settings:', err);
    } finally {
      hideAlert();
    }
  };

  const pickImage = async (category, source) => {
    try {
      if (totalCount >= 10) {
        showAlert({ title: 'Limit reached', message: 'Max 10 photos reached' });
        return;
      }
      if ((images[category]?.length || 0) >= 3) {
        showAlert({ title: 'Limit reached', message: 'Max 3 photos per category' });
        return;
      }

      let permission;
      if (source === 'camera') {
        permission = await ImagePicker.requestCameraPermissionsAsync();
        if (permission.status !== 'granted') {
          showAlert({
            title: 'Camera Permission',
            message: 'We need camera permission to take photos. Open settings to allow access.',
            showSettings: true,
          });
          return;
        }
      } else {
        permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permission.status !== 'granted') {
          showAlert({
            title: 'Photos Permission',
            message: 'We need permission to access your photos. Open settings to allow access.',
            showSettings: true,
          });
          return;
        }
      }

      let result;
      if (source === 'camera') {
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 1,
          allowsEditing: false,
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 1,
          allowsEditing: false,
        });
      }

      if (!result || result.canceled) return;

      const assets = result.assets || [];
      if (assets.length === 0) return;

      const asset = assets[0];
      const uri = asset.uri;
      const fileSize = asset.fileSize || 0;

      if (fileSize > 4 * 1024 * 1024) {
        showAlert({ title: 'File too large', message: 'File size exceeds 4MB limit!' });
        return;
      }

      const newId = photoIdCounter + 1;
      setPhotoIdCounter(newId);
      setImages(prev => {
        const newImages = {
          ...prev,
          [category]: [...(prev[category] || []), { id: newId, uri }],
        };
        return newImages;
      });
      setTotalCount(prev => prev + 1);
    } catch (error) {
      console.log('pickImage error:', error);
      showAlert({ title: 'Error', message: 'Failed to pick image. Please try again.' });
    }
  };

  const removeImage = (category, id) => {
    setImages(prev => {
      const updatedImages = (prev[category] || []).filter(img => img.id !== id);
      const newImages = { ...prev, [category]: updatedImages };
      const newCount = Object.values(newImages).reduce((sum, imgs) => sum + imgs.length, 0);
      setTotalCount(newCount);
      return newImages;
    });
  };

  const uploadAll = async () => {
    if (totalCount === 0) {
      showAlert({ title: 'No photos', message: 'Please add some photos first!' });
      return;
    }

    // Check latest network state
    const state = await Network.getNetworkStateAsync();
    if (!state.isInternetReachable) {
      // Only cache when offline and trying to upload
      try {
        await AsyncStorage.setItem('cachedImages', JSON.stringify(images));
        console.log('Images cached due to no internet connection');
      } catch (error) {
        console.log('Failed to cache images:', error);
      }
      showAlert({ title: 'Offline', message: 'You are offline. Your photos have been saved and will be uploaded when you reconnect.' });
      return;
    }

    const flatImages = Object.entries(images).flatMap(([cat, imgs]) =>
      imgs.map(img => ({ category: cat, uri: img.uri }))
    );

    try {
      navigation.navigate('Chat', { images: flatImages, report: '' });
    } catch (error) {
      console.log('uploadAll error:', error);
      showAlert({ title: 'Error', message: 'Failed to proceed to chat screen.' });
    }
  };

  const renderCategory = ({ item }) => {
    const count = images[item]?.length || 0;
    const isExpanded = expandedCategory === item;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => setExpandedCategory(isExpanded ? null : item)}
        activeOpacity={0.9}
      >
        <View style={styles.cardHeader}>
          <View style={styles.iconBubble}>
            <Image
              source={CATEGORY_ICONS[item]}
              style={styles.iconImage}
              resizeMode="contain"
            />
          </View>
          <View style={styles.cardTitleWrap}>
            <Text style={styles.cardTitle}>{item}</Text>
            <Text style={styles.cardSubtitle}>
              {item === 'Roofing'
                ? 'Roof conditions, shingles, gutters'
                : item === 'Exterior'
                ? 'Siding, foundation, windows'
                : item === 'Living Areas & Bedrooms'
                ? 'Main living spaces and bedrooms'
                : item === 'Kitchen'
                ? 'Appliances, cabinets, counters'
                : item === 'Bathroom'
                ? 'Fixtures, tiles and plumbing'
                : item === 'Basement & Foundation'
                ? 'Structure and basement areas'
                : item === 'Utilities'
                ? 'HVAC, furnace, electrical, plumbing'
                : 'Category'}
            </Text>
          </View>
          <View style={styles.countPill}>
            <Text style={styles.countText}>{count}/3</Text>
          </View>
        </View>

        {isExpanded && (
          <View style={styles.expandedBody}>
            <Text style={styles.photoHint}>Photos (Up to 3 Photos)</Text>
            {count === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>No Photo Uploaded Yet!</Text>
              </View>
            ) : (
              <View style={styles.previewRow}>
                {images[item].map(img => (
                  <View key={`${item}-${img.id}`} style={styles.previewContainer}>
                    <Image source={{ uri: img.uri }} style={styles.preview} />
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => removeImage(item, img.id)}
                    >
                      <Text style={styles.removeText}>×</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => pickImage(item, 'camera')}
              activeOpacity={0.9}
            >
              <Ionicons name="camera-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.primaryBtnText}>Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => pickImage(item, 'library')}
              activeOpacity={0.9}
            >
              <Ionicons name="image-outline" size={18} color={TEAL} style={{ marginRight: 6 }} />
              <Text style={styles.secondaryBtnText}>Select from Gallery</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {showOnlineBanner && (
        <View style={styles.onlineBanner}>
          <Text style={styles.onlineText}>You're online!</Text>
        </View>
      )}
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Upload Inspection Photos</Text>
          <Text style={styles.subtitle}>
            Capture or select up to 10 photos from 3+ categories
          </Text>
        </View>

        <View style={styles.progressWrapper}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Photos Uploaded</Text>
            <Text style={styles.progressCounter}>
              <Text style={styles.progressCurrent}>{totalCount}</Text>
              <Text style={styles.progressTotal}>/10</Text>
            </Text>
          </View>
          <View style={styles.progressBarBackground}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${(totalCount / 10) * 100}%` },
              ]}
            />
          </View>
        </View>

        <FlatList
          data={CATEGORIES}
          keyExtractor={item => item}
          renderItem={renderCategory}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.uploadAllBtn}
          onPress={uploadAll}
          activeOpacity={0.9}
        >
          <Text style={styles.uploadAllText}>Upload All</Text>
        </TouchableOpacity>
      </View>

      {/* Standard Alerts */}
      <Modal visible={alertVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.alertBox}>
            <Text style={styles.alertTitle}>{alertTitle}</Text>
            <Text style={styles.alertMessage}>{alertMessage}</Text>

            <View style={styles.alertActions}>
              {alertShowSettings ? (
                <>
                  <Pressable style={[styles.alertButton, styles.alertSecondary]} onPress={hideAlert}>
                    <Text style={styles.alertButtonTextSecondary}>Cancel</Text>
                  </Pressable>
                  <Pressable style={[styles.alertButton, styles.alertPrimary]} onPress={openSettings}>
                    <Text style={styles.alertButtonText}>Open Settings</Text>
                  </Pressable>
                </>
              ) : (
                <Pressable style={[styles.alertButton, styles.alertPrimary]} onPress={hideAlert}>
                  <Text style={styles.alertButtonText}>OK</Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* Back confirmation modal */}
      <Modal visible={backConfirmVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.alertBox}>
            <Text style={styles.alertTitle}>Warning</Text>
            <Text style={styles.alertMessage}>Going back will erase all uploaded photos. Do you want to proceed?</Text>
            <View style={styles.alertActions}>
              <Pressable style={[styles.alertButton, styles.alertSecondary]} onPress={() => setBackConfirmVisible(false)}>
                <Text style={styles.alertButtonTextSecondary}>Stay</Text>
              </Pressable>
              <Pressable style={[styles.alertButton, styles.alertPrimary]} onPress={confirmBackNavigation}>
                <Text style={styles.alertButtonText}>Go Back</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

// All original styles unchanged
const { width } = Dimensions.get('window');
const TEAL = '#53AAA3';
const LIGHT = '#F5FAF9';
const BORDER = '#E7ECEF';
const TEXT_DARK = '#233239';
const TEXT_MUTED = '#6E7A83';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { flex: 1, paddingHorizontal: 16 },
  onlineBanner: {
    backgroundColor: '#D4F0ED',
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineText: { color: '#233239', fontSize: 16, fontWeight: '600' },

  header: { paddingBottom: 8, marginTop: 12 },
  title: { fontSize: 22, fontWeight: '700', color: TEXT_DARK },
  subtitle: { marginTop: 4, fontSize: 13, color: TEXT_MUTED },

  progressWrapper: { marginTop: 12, marginBottom: 8 },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  progressLabel: { fontSize: 18, fontWeight: '600', color: '#000000' },
  progressCounter: { fontSize: 14 },
  progressCurrent: { fontSize: 18, fontWeight: 'bold', color: TEAL },
  progressTotal: { fontSize: 14, color: '#000' },

  progressBarBackground: {
    width: '100%',
    height: 8,
    backgroundColor: '#E7ECEF',
    borderRadius: 4,
    marginTop: 6,
    marginBottom: 20,
    overflow: 'hidden',
  },
  progressBarFill: { height: '100%', backgroundColor: TEAL, borderRadius: 4 },

  listContent: { paddingBottom: 10, gap: 12 },

  card: {
    backgroundColor: '#F3F3F3',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#ffffffff',
    marginBottom: 4,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  iconBubble: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    borderWidth: 1.5,
    borderColor: '#ffffffff',
  },
  iconImage: { width: 24, height: 24 },
  cardTitleWrap: { flex: 1 },
  cardTitle: { fontSize: 17, fontWeight: '700', color: TEXT_DARK },
  cardSubtitle: { fontSize: 13, color: TEXT_MUTED, marginTop: 2 },
  countPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#EFF8F7',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D1EBE8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: { fontSize: 12, color: TEAL, fontWeight: '600' },

  expandedBody: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#E1F0EE' },
  photoHint: { fontSize: 12, color: TEXT_MUTED, marginBottom: 10, fontWeight: '500' },
  emptyBox: {
    borderWidth: 2,
    borderColor: '#E1F0EE',
    backgroundColor: '#FAFCFC',
    borderRadius: 12,
    paddingVertical: 24,
    alignItems: 'center',
    marginBottom: 14,
    borderStyle: 'dashed',
  },
  emptyText: { color: TEXT_MUTED, fontSize: 13, fontWeight: '500' },
  previewRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  previewContainer: { position: 'relative' },
  preview: { width: 76, height: 76, borderRadius: 12, borderWidth: 2, borderColor: '#E1F0EE' },
  removeButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    backgroundColor: '#FF6B6B',
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  removeText: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },

  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    borderRadius: 12,
    backgroundColor: TEAL,
    marginBottom: 12,
    paddingHorizontal: 16,
    shadowColor: TEAL,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: TEAL,
    paddingHorizontal: 16,
  },
  secondaryBtnText: { color: TEAL, fontWeight: '700', fontSize: 15 },

  footer: {
    padding: 20,
    paddingBottom: 55,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  uploadAllBtn: {
    height: 52,
    borderRadius: 12,
    backgroundColor: TEAL,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: TEAL,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  uploadAllText: { color: '#fff', fontSize: 16, fontWeight: '700' },

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
  alertButton: {
    minWidth: 100,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
    alignItems: 'center',
  },
  alertPrimary: { backgroundColor: TEAL },
  alertSecondary: { backgroundColor: '#F0F0F0' },
  alertButtonText: { color: '#fff', fontWeight: '700' },
  alertButtonTextSecondary: { color: '#333', fontWeight: '700' },
});