import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Keyboard,
  ActivityIndicator,
  BackHandler,
  Modal,
  Pressable,
  Image,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MarkdownDisplay from 'react-native-markdown-display';
import { generateReport, getChatResponse } from '../utils/api';
import { useNavigation } from '@react-navigation/native';
import * as Network from 'expo-network';

export default function ChatScreen({ route, navigation }) {
  const { images, report: initialReport } = route.params || {};
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [initialReportText, setInitialReportText] = useState('');
  const [conversationContext, setConversationContext] = useState({
    systemPrompt: '',
    initialReport: '',
    images: null,
  });
  const insets = useSafeAreaInsets();
  const flatListRef = useRef(null);
  const navigationRef = useNavigation();
  const inputRef = useRef(null);

  // Animation values for smooth transitions
  const inputContainerAnimation = useRef(new Animated.Value(0)).current;
  const inputOpacity = useRef(new Animated.Value(0.6)).current;

  // Back confirmation modal state
  const [backConfirmationVisible, setBackConfirmationVisible] = useState(false);

  const ENHANCED_SYSTEM_PROMPT = `You are a highly professional home inspection consultant evaluating residential properties. You have access to detailed inspection reports and can answer follow-up questions about the analysis. 

Key capabilities:
- Provide detailed explanations of inspection findings
- Offer specific maintenance recommendations
- Explain building codes and safety standards
- Assess repair priorities and budget estimates
- Clarify technical terminology
- Address homeowner concerns professionally

Always maintain a professional, authoritative tone while being helpful and accessible to homeowners.

IMPORTANT: You have access to the complete inspection report and images from this property inspection. Always reference the specific findings from the initial report when answering questions. Maintain continuity with the original inspection analysis.`;

  // Initialize conversation context
  useEffect(() => {
    setConversationContext({
      systemPrompt: ENHANCED_SYSTEM_PROMPT,
      initialReport: initialReport || '',
      images: images,
    });
  }, [images, initialReport]);

  useEffect(() => {
    const processInitialReport = async () => {
      if (initialReport || !images) return;

      const newId = Date.now().toString();
      setIsLoading(true);
      setIsStreaming(true);

      setMessages(prev => [
        ...prev,
        {
          id: newId,
          text: '🤖 Your AI Inspector is analyzing the images...',
          sender: 'ai',
          isStreaming: true,
        },
      ]);

      try {
        const state = await Network.getNetworkStateAsync();
        if (!state.isInternetReachable) {
          navigationRef.navigate('NetworkError');
          return;
        }

        const reportText = await generateReport(images);
        setInitialReportText(reportText);
        
        // Update conversation context with the generated report
        setConversationContext(prev => ({
          ...prev,
          initialReport: reportText,
        }));

        let i = 0;
        const streamingInterval = setInterval(() => {
          if (i < reportText.length) {
            setMessages(prev =>
              prev.map(m =>
                m.id === newId
                  ? {
                      ...m,
                      text: reportText.slice(0, i + 1),
                      isStreaming: i < reportText.length - 1,
                    }
                  : m,
              ),
            );
            i++;
          } else {
            clearInterval(streamingInterval);
            setIsStreaming(false);
            setMessages(prev =>
              prev.map(m =>
                m.id === newId ? { ...m, isStreaming: false } : m,
              ),
            );
          }
        }, 20);
      } catch (error) {
        if (error.message.includes('Network error')) {
          navigationRef.navigate('NetworkError');
        } else {
          setMessages(prev =>
            prev.map(m =>
              m.id === newId
                ? {
                    ...m,
                    text: '❌ Error: Could not generate report. Please check your connection and try again.',
                    isStreaming: false,
                  }
                : m,
            ),
          );
          setIsStreaming(false);
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (initialReport) {
      setMessages([
        { id: '1', text: initialReport, sender: 'ai', isStreaming: false },
      ]);
      setInitialReportText(initialReport);
      setConversationContext(prev => ({
        ...prev,
        initialReport: initialReport,
      }));
    } else {
      processInitialReport();
    }
  }, [images, initialReport, navigationRef]);

  // Enhanced keyboard handling with smooth animations
  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
      // Animate input container up when keyboard shows
      Animated.spring(inputContainerAnimation, {
        toValue: 1,
        useNativeDriver: false,
        tension: 100,
        friction: 8,
      }).start();
    });

    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
      // Animate input container back to original position
      Animated.spring(inputContainerAnimation, {
        toValue: 0,
        useNativeDriver: false,
        tension: 100,
        friction: 8,
      }).start();
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [inputContainerAnimation]);

  // Back button handling
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (messages.length > 0) {
          setBackConfirmationVisible(true);
          return true;
        }
        return false;
      },
    );

    return () => backHandler.remove();
  }, [messages.length]);

  const confirmBack = () => {
    setBackConfirmationVisible(false);
    navigation.goBack();
  };

  const cancelBack = () => {
    setBackConfirmationVisible(false);
  };

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading || isStreaming) return;

    const userMessage = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      isStreaming: false,
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputText;
    setInputText('');
    setIsLoading(true);
    setIsStreaming(true);

    // Dismiss keyboard after sending
    Keyboard.dismiss();

    try {
      const state = await Network.getNetworkStateAsync();
      if (!state.isInternetReachable) {
        navigationRef.navigate('NetworkError');
        return;
      }

      // Build comprehensive conversation history including ALL messages
      const conversationHistory = messages.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: (msg.text || '').toString(),
      }));

      // Add the current user message to history
      conversationHistory.push({
        role: 'user',
        content: currentInput,
      });

      // Prepare context with initial report and system instructions
      const contextualPrompt = `${conversationContext.systemPrompt}

INSPECTION CONTEXT:
- You have previously provided a detailed inspection report for this property
- The initial report contains: ${conversationContext.initialReport ? 'Complete inspection findings and analysis' : 'Analysis in progress'}
- You have access to the uploaded images from this inspection
- Maintain continuity with all previous responses in this conversation

Initial Inspection Report Summary:
${conversationContext.initialReport || 'Report being generated...'}

Continue the conversation while maintaining full context of the inspection and all previous exchanges.`;

      const aiResponse = await getChatResponse(currentInput, {
        systemPrompt: contextualPrompt,
        context: conversationContext.initialReport,
        conversationHistory: conversationHistory,
        images: conversationContext.images, // Include images in context if your API supports it
      });

      const newId = (Date.now() + 1).toString();
      setMessages(prev => [
        ...prev,
        { id: newId, text: '', sender: 'ai', isStreaming: true },
      ]);

      let i = 0;
      const streamingInterval = setInterval(() => {
        if (i < aiResponse.length) {
          setMessages(prev =>
            prev.map(m =>
              m.id === newId
                ? {
                    ...m,
                    text: aiResponse.slice(0, i + 1),
                    isStreaming: i < aiResponse.length - 1,
                  }
                : m,
            ),
          );
          i++;
        } else {
          clearInterval(streamingInterval);
          setIsStreaming(false);
          setMessages(prev =>
            prev.map(m =>
              m.id === newId ? { ...m, isStreaming: false } : m,
            ),
          );
        }
      }, 20);
    } catch (error) {
      if (error.message.includes('Network error')) {
        navigationRef.navigate('NetworkError');
      } else {
        setMessages(prev => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            text: '❌ Error: Could not get response. Please check your connection and try again.',
            sender: 'ai',
            isStreaming: false,
          },
        ]);
        setIsStreaming(false);
      }
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  const handleInputPress = () => {
    if (!inputFocused) {
      // Animate input to active state
      Animated.parallel([
        Animated.timing(inputOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start();

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
  }, [inputOpacity]);

  const handleBlur = useCallback(() => {
    setInputFocused(false);
    if (!inputText.trim()) {
      Animated.timing(inputOpacity, {
        toValue: 0.6,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  }, [inputOpacity, inputText]);

  const renderMessage = ({ item }) => (
    <View
      style={[
        styles.messageContainer,
        item.sender === 'user' ? styles.userMessage : styles.aiMessage,
      ]}
    >
      <View style={styles.messageContent}>
        <MarkdownDisplay
          style={item.sender === 'user' ? styles.userMarkdown : styles.aiMarkdown}
        >
          {item.text || ''}
        </MarkdownDisplay>
        {item.isStreaming && (
          <View style={styles.streamingIndicator}>
            <ActivityIndicator size="small" color="#2FA69A" />
            <Text style={styles.streamingText}>AI is thinking...</Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeContainer}>
      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setBackConfirmationVisible(true)}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>

        <Image
          source={require('../assets/inspector.png')}
          style={styles.headerImage}
        />

        <Text style={styles.headerTitle}>AI Inspector Report</Text>
        
        {/* Context indicator */}
        {conversationContext.initialReport && (
          <View style={styles.contextIndicator}>
            <Text style={styles.contextText}>📋</Text>
          </View>
        )}
      </View>

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.chatWrapper}>
          <FlatList
            ref={flatListRef}
            data={[...messages].reverse()}
            renderItem={renderMessage}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.chatContainer}
            inverted
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          />
        </View>

        {/* Enhanced Animated Input Bar */}
        <Animated.View
          style={[
            styles.inputContainer,
            {
              paddingBottom: Platform.OS === 'ios' ? insets.bottom || 10 : 15,
              transform: [
                {
                  translateY: inputContainerAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -20],
                  }),
                },
              ],
            },
          ]}
        >
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
                    : conversationContext.initialReport
                    ? 'Ask about your inspection report...'
                    : 'Ask about your inspection...'
                }
                placeholderTextColor={isLoading || isStreaming ? '#999' : '#6E7A83'} 
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
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.sendButtonText}>➤</Text>
            )}
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>

      {/* Back Confirmation Modal */}
      <Modal visible={backConfirmationVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.alertBox}>
            <Text style={styles.alertTitle}>Leave Chat?</Text>
            <Text style={styles.alertMessage}>
              Going back will lose the report and conversation. You'll need to upload
              photos again to generate a new report.
            </Text>
            <View style={styles.alertActions}>
              <Pressable
                style={[styles.alertButton, styles.alertSecondary]}
                onPress={cancelBack}
              >
                <Text style={styles.alertButtonTextSecondary}>Stay</Text>
              </Pressable>
              <Pressable
                style={[styles.alertButton, styles.alertPrimary]}
                onPress={confirmBack}
              >
                <Text style={styles.alertButtonText}>Go Back</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#F7FBFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? 50 : 0,
    paddingHorizontal: 26,
    paddingVertical: 15,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E7ECEF',
    elevation: 2,
  },
  backArrow: {
    fontSize: 22,
    color: '#2FA69A',
    fontWeight: 'bold',
    marginRight: 12,
  },
  headerImage: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    flex: 1,
  },
  contextIndicator: {
    backgroundColor: '#2FA69A',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  contextText: {
    fontSize: 12,
    color: '#FFF',
  },
  container: {
    flex: 1,
  },
  chatWrapper: {
    flex: 1,
  },
  chatContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
  },
  messageContainer: {
    marginBottom: 12,
    maxWidth: '80%',
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  userMessage: {
    backgroundColor: '#2FA69A',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
    marginLeft: '20%',
  },
  aiMessage: {
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E7ECEF',
    marginRight: '20%',
  },
  messageContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userMarkdown: {
    body: { fontSize: 16, color: '#FFFFFF', lineHeight: 22 },
    strong: { fontWeight: 'bold', color: '#FFFFFF' },
    em: { fontStyle: 'italic', color: '#FFFFFF' },
    paragraph: { marginBottom: 4 },
  },
  aiMarkdown: {
    body: { fontSize: 16, color: '#233239', lineHeight: 22 },
    strong: { fontWeight: 'bold', color: '#233239' },
    em: { fontStyle: 'italic', color: '#233239' },
    listItem: { marginLeft: 10 },
    paragraph: { marginBottom: 6 },
  },
  streamingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  streamingText: {
    fontSize: 12,
    color: '#6E7A83',
    marginLeft: 8,
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingTop: 12,
    paddingBottom: 50,
    marginBottom: Platform.OS === 'ios' ? 0 : 20,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E7ECEF',
    alignItems: 'flex-end',
  },
  inputWrapper: {
    flex: 1,
  },
  inputAnimatedWrapper: {
    borderRadius: 25,
    shadowColor: '#2FA69A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  input: {
    backgroundColor: '#F9F9F9',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 14,
    fontSize: 16,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    maxHeight: 100,
    textAlignVertical: 'top',
    
    color: '#233239',
  },
  inputFocused: {
    borderColor: '#2FA69A',
    backgroundColor: '#FFFFFF',
    shadowColor: '#2FA69A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    
  },
  inputDisabled: {
    backgroundColor: '#F0F0F0',
    color: '#999',
    borderColor: '#D0D0D0',
  },
  sendButton: {
    backgroundColor: '#2FA69A',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    shadowColor: '#2FA69A',
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
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
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
  alertTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#53AAA3',
    marginBottom: 8,
  },
  alertMessage: {
    fontSize: 15,
    color: '#233239',
    textAlign: 'center',
    marginBottom: 16,
  },
  alertActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    gap: 10,
  },
  alertButton: {
    minWidth: 100,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
    alignItems: 'center',
  },
  alertPrimary: { backgroundColor: '#53AAA3' },
  alertSecondary: { backgroundColor: '#F0F0F0' },
  alertButtonText: { color: '#fff', fontWeight: '700' },
  alertButtonTextSecondary: { color: '#333', fontWeight: '700' },
});