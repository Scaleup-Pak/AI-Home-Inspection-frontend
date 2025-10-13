import React from 'react';
import { TouchableOpacity, Text, Image, StyleSheet } from 'react-native';
import { COLORS, FONTS, SIZES } from '../constants/theme';

export default function CategoryItem({ 
  title, 
  icon, 
  onPress, 
  imageCount = 0,
  style 
}) {
  return (
    <TouchableOpacity 
      style={[styles.categoryButton, style]} 
      onPress={onPress}
    >
      <Image source={icon} style={styles.icon} />
      <Text style={styles.categoryText}>{title}</Text>
      {imageCount > 0 && (
        <Text style={styles.imageCount}>{imageCount} photos</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  categoryButton: {
    backgroundColor: COLORS.background,
    borderRadius: SIZES.base,
    padding: SIZES.base * 1.5,
    marginVertical: SIZES.base * 0.5,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  icon: {
    width: 32,
    height: 32,
    marginRight: SIZES.base * 1.5,
  },
  categoryText: {
    flex: 1,
    fontSize: SIZES.medium,
    ...FONTS.semiBold,
    color: COLORS.text,
  },
  imageCount: {
    fontSize: SIZES.small,
    color: COLORS.textMuted,
    ...FONTS.medium,
  },
});