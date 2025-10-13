import React, { useState, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Alert,
  BackHandler,
  Platform,
  Linking,
  TouchableOpacity,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Network from 'expo-network';
import { COLORS, FONTS, SIZES } from '../constants/theme';
import CustomButton from '../components/CustomButton';
import CustomModal from '../components/CustomModal';
import { PhotoCard } from '../components/PhotoCard';
import CustomHeader from '../components/CustomHeader';

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

const CATEGORY_DESCRIPTIONS = {
  Roofing: 'Roof conditions, shingles, gutters',
  Exterior: 'Siding, foundation, windows',
  'Living Areas & Bedrooms': 'Main living spaces and bedrooms',
  Kitchen: 'Appliances, cabinets, counters',
  Bathroom: 'Fixtures, tiles and plumbing',
  'Basement & Foundation': 'Structure and basement areas',
  Utilities: 'HVAC, furnace, electrical, plumbing',
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

  const confirmBackNavigation = async () => {
    try {
      // Clear cache before navigating back
      await AsyncStorage.removeItem('cachedImages');
      navigation.goBack();
    } catch (error) {
      console.log('Error clearing cache:', error);
      navigation.goBack(); // Still go back even if cache clear fails
    }
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
      setAlertTitle('No photos');
      setAlertMessage('Please add some photos first!');
      setAlertShowSettings(false);
      setAlertVisible(true);
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
      <PhotoCard
        category={item}
        icon={CATEGORY_ICONS[item]}
        subtitle={CATEGORY_DESCRIPTIONS[item]}
        count={count}
        isExpanded={isExpanded}
        onPress={() => setExpandedCategory(isExpanded ? null : item)}
        onTakePhoto={() => pickImage(item, 'camera')}
        onPickFromGallery={() => pickImage(item, 'library')}
        images={images[item] || []}
        onRemoveImage={(id) => removeImage(item, id)}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        {/* <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => setBackConfirmVisible(true)}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity> */}

        <TouchableOpacity 
  style={styles.backButton} 
  onPress={() => setBackConfirmVisible(true)}
>
  <Image
    source={require('../assets/backicon.png')} // 👈 adjust path as needed
    style={styles.backIcon}
    resizeMode="contain"
  />
</TouchableOpacity>

      </View>
      
      {showOnlineBanner && (
        <View style={styles.onlineBanner}>
          <Text style={styles.onlineText}>You're online!</Text>
        </View>
      )}
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Upload Inspection Photos</Text>
          <Text style={styles.subtitle}>
            Capture or select up to 10 photos from the categories
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
        <CustomButton
          title="Upload All"
          onPress={uploadAll}
          style={styles.uploadButton}
        />
      </View>

      <CustomModal
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        onCancel={hideAlert}
        onConfirm={alertShowSettings ? openSettings : undefined}
        cancelText="OK"
        confirmText={alertShowSettings ? "Open Settings" : null}
      />

      <CustomModal
        visible={backConfirmVisible}
        title="Warning"
        message="Going back will erase all uploaded photos. Do you want to proceed?"
        onCancel={() => setBackConfirmVisible(false)}
        onConfirm={confirmBackNavigation}
        cancelText="Stay"
        confirmText="Go Back"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? SIZES.extraLarge : SIZES.base,
    backgroundColor: COLORS.background,
  },
  backButton: {
    padding: SIZES.small,
    paddingLeft: SIZES.large,
  },
  backIcon: {
  width: 20,
  height: 20,
  tintColor: COLORS.primary, // Optional, can be removed if you don’t need color tint
},

  content: {
    flex: 1,
    paddingHorizontal: SIZES.medium
  },
  onlineBanner: {
    backgroundColor: '#D4F0ED',
    padding: SIZES.base * 1.25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineText: {
    color: COLORS.text,
    fontSize: SIZES.medium,
    ...FONTS.semiBold
  },
  header: {
    paddingBottom: SIZES.base,
    marginTop: SIZES.base * 1.5
  },
  title: {
    fontSize: SIZES.extraLarge - 2,
    ...FONTS.bold,
    color: COLORS.text
  },
  subtitle: {
    marginTop: SIZES.base * 0.5,
    fontSize: SIZES.small,
    color: COLORS.textMuted
  },
  progressWrapper: {
    marginTop: SIZES.base * 1.5,
    marginBottom: SIZES.base
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  progressLabel: {
    fontSize: SIZES.large,
    ...FONTS.semiBold,
    color: COLORS.text
  },
  progressCounter: {
    fontSize: SIZES.small
  },
  progressCurrent: {
    fontSize: SIZES.large,
    ...FONTS.bold,
    color: COLORS.primary
  },
  progressTotal: {
    fontSize: SIZES.small,
    color: COLORS.text
  },
  progressBarBackground: {
    width: '100%',
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: SIZES.base * 0.5,
    marginTop: SIZES.base * 0.75,
    marginBottom: SIZES.extraLarge * 0.75,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.base * 0.5
  },
  listContent: {
    paddingBottom: SIZES.base * 1.25,
    gap: SIZES.base * 1.5
  },
  footer: {
    padding: SIZES.extraLarge,
    paddingBottom: Platform.OS === 'ios' ? SIZES.extraLarge * 2 : SIZES.extraLarge,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  uploadButton: {
    height: 52,
    borderRadius: SIZES.base * 1.5,
    marginBottom: SIZES.base * 1.5,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
});
