import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES } from '../constants/theme';

export const PhotoCard = ({
  category,
  icon,
  subtitle,
  count = 0,
  isExpanded,
  onPress,
  onTakePhoto,
  onPickFromGallery,
  images = [],
  onRemoveImage,
}) => {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={styles.cardHeader}>
        <View style={styles.iconBubble}>
          <Image
            source={icon}
            style={styles.iconImage}
            resizeMode="contain"
          />
        </View>
        <View style={styles.cardTitleWrap}>
          <Text style={styles.cardTitle}>{category}</Text>
          <Text style={styles.cardSubtitle}>{subtitle}</Text>
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
              {images.map(img => (
                <View key={`${category}-${img.id}`} style={styles.previewContainer}>
                  <Image source={{ uri: img.uri }} style={styles.preview} />
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => onRemoveImage(img.id)}
                  >
                    <Text style={styles.removeText}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={onTakePhoto}
            activeOpacity={0.9}
          >
            <Ionicons name="camera-outline" size={18} color={COLORS.background} style={{ marginRight: 6 }} />
            <Text style={styles.primaryBtnText}>Take Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={onPickFromGallery}
            activeOpacity={0.9}
          >
            <Ionicons name="image-outline" size={18} color={COLORS.primary} style={{ marginRight: 6 }} />
            <Text style={styles.secondaryBtnText}>Select from Gallery</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F3F3F3',
    borderRadius: SIZES.base * 2,
    padding: SIZES.extraLarge,
    borderWidth: 2,
    borderColor: '#ffffffff',
    marginBottom: SIZES.base * 0.5,
  },
  cardHeader: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  iconBubble: {
    width: 44,
    height: 44,
    borderRadius: SIZES.base * 1.5,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.base * 1.75,
    borderWidth: 1.5,
    borderColor: '#ffffffff',
  },
  iconImage: { 
    width: 24, 
    height: 24 
  },
  cardTitleWrap: { 
    flex: 1 
  },
  cardTitle: { 
    fontSize: SIZES.large, 
    ...FONTS.bold, 
    color: COLORS.text 
  },
  cardSubtitle: { 
    fontSize: SIZES.small, 
    color: COLORS.textMuted, 
    marginTop: 2 
  },
  countPill: {
    paddingHorizontal: SIZES.base * 1.5,
    paddingVertical: SIZES.base * 0.75,
    backgroundColor: '#EFF8F7',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D1EBE8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: { 
    fontSize: SIZES.small, 
    color: COLORS.primary, 
    ...FONTS.semiBold 
  },
  expandedBody: { 
    marginTop: SIZES.medium, 
    paddingTop: SIZES.medium, 
    borderTopWidth: 1, 
    borderTopColor: '#E1F0EE' 
  },
  photoHint: { 
    fontSize: SIZES.small, 
    color: COLORS.textMuted, 
    marginBottom: SIZES.base * 1.25, 
    ...FONTS.medium 
  },
  emptyBox: {
    borderWidth: 2,
    borderColor: '#E1F0EE',
    backgroundColor: '#FAFCFC',
    borderRadius: SIZES.base * 1.5,
    paddingVertical: SIZES.extraLarge,
    alignItems: 'center',
    marginBottom: SIZES.base * 1.75,
    borderStyle: 'dashed',
  },
  emptyText: { 
    color: COLORS.textMuted, 
    fontSize: SIZES.small, 
    ...FONTS.medium 
  },
  previewRow: { 
    flexDirection: 'row', 
    gap: SIZES.base * 1.25, 
    marginBottom: SIZES.base * 1.75 
  },
  previewContainer: { 
    position: 'relative' 
  },
  preview: { 
    width: 76, 
    height: 76, 
    borderRadius: SIZES.base * 1.5, 
    borderWidth: 2, 
    borderColor: '#E1F0EE' 
  },
  removeButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    backgroundColor: COLORS.error,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  removeText: { 
    color: COLORS.background, 
    fontSize: SIZES.small, 
    ...FONTS.bold 
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    borderRadius: SIZES.base * 1.5,
    backgroundColor: COLORS.primary,
    marginBottom: SIZES.base * 1.5,
    paddingHorizontal: SIZES.medium,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  primaryBtnText: { 
    color: COLORS.background, 
    ...FONTS.bold, 
    fontSize: SIZES.medium 
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    borderRadius: SIZES.base * 1.5,
    backgroundColor: COLORS.background,
    borderWidth: 2,
    borderColor: COLORS.primary,
    paddingHorizontal: SIZES.medium,
  },
  secondaryBtnText: { 
    color: COLORS.primary, 
    ...FONTS.bold, 
    fontSize: SIZES.medium 
  },
});