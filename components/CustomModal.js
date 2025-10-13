import React from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { COLORS, FONTS, SIZES } from '../constants/theme';

export default function CustomModal({
  visible,
  title,
  message,
  onCancel,
  onConfirm,
  cancelText = 'Cancel',
  confirmText = 'Confirm'
}) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.alertBox}>
          <Text style={styles.alertTitle}>{title}</Text>
          <Text style={styles.alertMessage}>{message}</Text>
          <View style={[styles.alertActions, !confirmText && styles.singleButtonContainer]}>
            {confirmText ? (
              <>
                <Pressable 
                  style={[styles.alertButton, styles.alertSecondary]} 
                  onPress={onCancel}
                >
                  <Text style={styles.alertButtonTextSecondary}>{cancelText}</Text>
                </Pressable>
                <Pressable 
                  style={[styles.alertButton, styles.alertPrimary]} 
                  onPress={onConfirm}
                >
                  <Text style={styles.alertButtonText}>{confirmText}</Text>
                </Pressable>
              </>
            ) : (
              <Pressable 
                style={[styles.alertButton, styles.alertPrimary, styles.singleButton]} 
                onPress={onCancel}
              >
                <Text style={styles.alertButtonText}>{cancelText}</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10,10,10,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SIZES.extraLarge,
  },
  alertBox: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: COLORS.background,
    padding: SIZES.extraLarge,
    borderRadius: 14,
    alignItems: 'center',
  },
  alertTitle: {
    fontSize: SIZES.large,
    ...FONTS.bold,
    color: COLORS.primary,
    marginBottom: SIZES.base,
  },
  alertMessage: {
    fontSize: SIZES.medium,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SIZES.medium,
  },
  alertActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    gap: SIZES.base * 1.25,
  },
  alertButton: {
    minWidth: 100,
    paddingVertical: SIZES.base * 1.5,
    paddingHorizontal: SIZES.extraLarge * 0.75,
    borderRadius: SIZES.base * 1.25,
    alignItems: 'center',
  },
  alertPrimary: { 
    backgroundColor: COLORS.primary 
  },
  alertSecondary: { 
    backgroundColor: '#F0F0F0' 
  },
  alertButtonText: { 
    color: COLORS.background, 
    ...FONTS.bold 
  },
  alertButtonTextSecondary: { 
    color: COLORS.text, 
    ...FONTS.bold 
  },
  singleButtonContainer: {
    justifyContent: 'center',
    gap: 0,
  },
  singleButton: {
    minWidth: 140,
    paddingHorizontal: SIZES.extraLarge,
  },
});