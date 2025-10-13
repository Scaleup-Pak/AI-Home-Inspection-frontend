import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Animated,
  Platform,
  Keyboard,
  BackHandler,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomHeader from '../components/CustomHeader';
import ChatInput from '../components/ChatInput';
import CustomModal from '../components/CustomModal';
import { generateReport, getChatResponse } from '../utils/api';
import { useNavigation } from '@react-navigation/native';
import * as Network from 'expo-network';
import { COLORS, FONTS, SIZES } from '../constants/theme';
import ChatMessage from '../components/ChatMessage';

export default function ChatScreen({ route, navigation }) {
  const { images, report: initialReport } = route.params || {};
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [initialReportText, setInitialReportText] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
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
  const inputOpacity = useRef(new Animated.Value(0.6)).current;

  // Back confirmation modal state
  const [backConfirmationVisible, setBackConfirmationVisible] = useState(false);

   const ENHANCED_SYSTEM_PROMPT = `You are a highly professional home inspection consultant evaluating residential properties. You have access to inspection photos and reports.

RESPONSE RULES:
- If the uploaded images clearly show property inspection content (structural elements, HVAC, electrical, plumbing, roofing, interior/exterior issues), provide a **detailed professional analysis**.
- If the uploaded images are NOT related to home inspection (people, vehicles, pets, landscapes, random objects, etc.), respond with ONLY this short strict message:
  "I specialize in home inspection analysis. The uploaded image doesn't appear to show property inspection content. Please upload images of structural elements, systems, or areas you'd like me to inspect."
- Never generate long explanations or reports for non-inspection images.

Key capabilities for PROPERTY inspection images:
- Structural integrity assessment
- Safety hazard identification
- Maintenance recommendations with priority levels
- Building code compliance evaluation
- Budget estimates for repairs
- Explanation of technical terminology

IMPORTANT:
- Always reference the initial inspection report when answering questions.
- Keep tone professional and authoritative.
- Stay concise unless detailed findings are required.`;

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
        {
          id: '1',
          text: initialReport,
          sender: 'ai',
          isStreaming: false,
        },
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

  // Enhanced keyboard handling
  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardVisible(true);
      setKeyboardHeight(e.endCoordinates.height);
    });
    
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

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
- The initial report contains: ${
        conversationContext.initialReport
          ? 'Complete inspection findings and analysis'
          : 'Analysis in progress'
      }
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
    <ChatMessage message={item} />
  );

  return (
    <SafeAreaView style={styles.safeContainer}>
      <CustomHeader 
        title="AI Inspector Report" 
        onBack={() => setBackConfirmationVisible(true)}
        showImage={true}
      />

      <View style={styles.container}>
        <View style={styles.chatWrapper}>
          <FlatList
            ref={flatListRef}
            data={[...messages].reverse()}
            renderItem={renderMessage}
            keyExtractor={item => item.id}
            contentContainerStyle={[
              styles.chatContainer,
              keyboardVisible && { paddingBottom: keyboardHeight + 20 }
            ]}
            inverted
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          />
        </View>

        <ChatInput
          inputText={inputText}
          setInputText={setInputText}
          isLoading={isLoading}
          isStreaming={isStreaming}
          sendMessage={sendMessage}
          inputFocused={inputFocused}
          setInputFocused={setInputFocused}
          inputOpacity={inputOpacity}
          hasInitialReport={!!conversationContext.initialReport}
          style={{
            paddingBottom: Math.max(insets.bottom, 10),
            marginBottom: keyboardVisible ? keyboardHeight + 12 : 0,
          }}
        />
      </View>

      <CustomModal
        visible={backConfirmationVisible}
        title="Leave Chat?"
        message="Going back will lose the report and conversation. You'll need to upload photos again to generate a new report."
        onCancel={cancelBack}
        onConfirm={confirmBack}
        cancelText="Stay"
        confirmText="Go Back"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
  },
  chatWrapper: {
    flex: 1,
  },
  chatContainer: {
    paddingHorizontal: SIZES.medium,
    paddingTop: SIZES.base * 1.5,
    paddingBottom: SIZES.large * 1.25,
  },
});
