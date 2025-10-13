import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS, SIZES } from '../constants/theme';

export default function CustomButton({ 
  title, 
  onPress, 
  style, 
  textStyle,
  disabled = false,
  variant = 'primary' 
}) {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        variant === 'secondary' && styles.secondaryButton,
        disabled && styles.disabledButton,
        style
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[
        styles.buttonText,
        variant === 'secondary' && styles.secondaryButtonText,
        disabled && styles.disabledButtonText,
        textStyle
      ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  
button: {
  height: 52,
  borderRadius: SIZES.base * 1.5,
  marginBottom: SIZES.base * 1.5,
  paddingHorizontal: SIZES.extraLarge,
  backgroundColor: COLORS.primary,
  alignItems: 'center',
  justifyContent: 'center',
  shadowColor: COLORS.primary,
  shadowOpacity: 0.3,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 6 },
  elevation: 6,
},

  
  buttonText: {
    color: COLORS.background,
    fontSize: SIZES.medium,
    ...FONTS.bold,
  },
  secondaryButton: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  secondaryButtonText: {
    color: COLORS.primary,
  },
  disabledButton: {
    backgroundColor: '#CCC',
    opacity: 0.7,
  },
  disabledButtonText: {
    color: COLORS.textMuted,
  },
});