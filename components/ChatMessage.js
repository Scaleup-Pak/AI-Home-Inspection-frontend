import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import MarkdownDisplay from 'react-native-markdown-display';
import { COLORS, FONTS, SIZES } from '../constants/theme';

export default function ChatMessage({ message }) {
  return (
    <View
      style={[
        styles.messageContainer,
        message.sender === 'user' ? styles.userMessage : styles.aiMessage,
      ]}
    >
      <View style={styles.messageContent}>
        <MarkdownDisplay
          style={
            message.sender === 'user' ? styles.userMarkdown : styles.aiMarkdown
          }
        >
          {message.text || ''}
        </MarkdownDisplay>
        {message.isStreaming && (
          <View style={styles.streamingIndicator}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.streamingText}>AI is thinking...</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  messageContainer: {
    marginBottom: SIZES.base * 1.5,
    maxWidth: '80%',
    borderRadius: SIZES.large + 4,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  userMessage: {
    backgroundColor: COLORS.primary,
    alignSelf: 'flex-end',
    borderBottomRightRadius: SIZES.base * 0.5,
    marginLeft: '20%',
  },
  aiMessage: {
    backgroundColor: COLORS.background,
    alignSelf: 'flex-start',
    borderBottomLeftRadius: SIZES.base * 0.5,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: '20%',
  },
  messageContent: {
    paddingHorizontal: SIZES.medium,
    paddingVertical: SIZES.base * 1.5,
  },
  userMarkdown: {
    body: { 
      fontSize: SIZES.medium, 
      color: COLORS.background, 
      lineHeight: 22 
    },
    strong: { 
      fontWeight: 'bold', 
      color: COLORS.background 
    },
    em: { 
      fontStyle: 'italic', 
      color: COLORS.background 
    },
    paragraph: { 
      marginBottom: SIZES.base * 0.5 
    },
  },
  aiMarkdown: {
    body: { 
      fontSize: SIZES.medium, 
      color: COLORS.text, 
      lineHeight: 22 
    },
    strong: { 
      fontWeight: 'bold', 
      color: COLORS.text 
    },
    em: { 
      fontStyle: 'italic', 
      color: COLORS.text 
    },
    listItem: { 
      marginLeft: SIZES.base * 1.25 
    },
    paragraph: { 
      marginBottom: SIZES.base * 0.75 
    },
  },
  streamingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SIZES.base,
  },
  streamingText: {
    fontSize: SIZES.small,
    color: COLORS.textMuted,
    marginLeft: SIZES.base,
    fontStyle: 'italic',
  },
});