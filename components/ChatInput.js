import React, { useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Animated,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { COLORS, FONTS, SIZES } from '../constants/theme';

export default function ChatInput({
  inputText,
  setInputText,
  isLoading,
  isStreaming,
  sendMessage,
  inputFocused,
  setInputFocused,
  inputOpacity,
  hasInitialReport,
  style,
}) {
  const inputRef = useRef(null);

  const handleInputPress = () => {
    if (!inputFocused) {
      Animated.timing(inputOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }).start();
      inputRef.current?.focus();
    }
  };

  const handleFocus = useCallback(() => {
    setInputFocused(true);
    Animated.timing(inputOpacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [inputOpacity, setInputFocused]);

  const handleBlur = useCallback(() => {
    setInputFocused(false);
    if (!inputText.trim()) {
      Animated.timing(inputOpacity, {
        toValue: 0.6,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  }, [inputOpacity, inputText, setInputFocused]);

  return (
    <View style={[styles.inputContainer, style]}>
      <TouchableOpacity
        style={styles.inputWrapper}
        onPress={handleInputPress}
        activeOpacity={1}
      >
        <Animated.View
          style={[
            styles.inputAnimatedWrapper,
            {
              opacity: inputOpacity,
              transform: [
                {
                  scale: inputOpacity.interpolate({
                    inputRange: [0.6, 1],
                    outputRange: [0.98, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <TextInput
            ref={inputRef}
            style={[
              styles.input,
              (isLoading || isStreaming) && styles.inputDisabled,
              inputFocused && styles.inputFocused,
            ]}
            value={inputText}
            onChangeText={setInputText}
            placeholder={
              isLoading || isStreaming
                ? 'AI is responding...'
                : hasInitialReport
                ? 'Ask about your inspection report...'
                : 'Ask about your inspection...'
            }
            placeholderTextColor={
              isLoading || isStreaming ? COLORS.textMuted : COLORS.textMuted
            }
            onSubmitEditing={sendMessage}
            onFocus={handleFocus}
            onBlur={handleBlur}
            editable={!isLoading && !isStreaming}
            multiline
            maxLength={500}
            pointerEvents={inputFocused ? 'auto' : 'none'}
          />
        </Animated.View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.sendButton,
          (!inputText.trim() || isLoading || isStreaming) &&
            styles.sendButtonDisabled,
        ]}
        onPress={sendMessage}
        disabled={!inputText.trim() || isLoading || isStreaming}
      >
        {isLoading || isStreaming ? (
          <ActivityIndicator size="small" color={COLORS.background} />
        ) : (
          <Text style={styles.sendButtonText}>➤</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: SIZES.medium,
    paddingTop: SIZES.base * 1.5,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    alignItems: 'flex-end',
  },
  inputWrapper: {
    flex: 1,
  },
  inputAnimatedWrapper: {
    borderRadius: SIZES.extraLarge,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  input: {
    backgroundColor: '#F9F9F9',
    borderRadius: SIZES.extraLarge,
    paddingHorizontal: SIZES.extraLarge,
    paddingVertical: SIZES.base * 1.75,
    fontSize: SIZES.medium,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    maxHeight: 100,
    textAlignVertical: 'top',
    color: COLORS.text,
  },
  inputFocused: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.background,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  inputDisabled: {
    backgroundColor: '#F0F0F0',
    color: COLORS.textMuted,
    borderColor: COLORS.border,
  },
  sendButton: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.extraLarge,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SIZES.base * 1.25,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  sendButtonDisabled: {
    backgroundColor: '#CCC',
    shadowOpacity: 0,
    elevation: 0,
  },
  sendButtonText: {
    color: COLORS.background,
    fontSize: SIZES.extraLarge - 4,
    ...FONTS.bold,
  },
});