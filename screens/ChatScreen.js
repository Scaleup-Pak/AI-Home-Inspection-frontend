import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Animated,
  Keyboard,
  BackHandler,
  Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomHeader from '../components/CustomHeader';
import ChatInput from '../components/ChatInput';
import CustomModal from '../components/CustomModal';
import { getChatResponse } from '../utils/api';
import { useNavigation } from '@react-navigation/native';
import * as Network from 'expo-network';
import { COLORS, FONTS, SIZES } from '../constants/theme';
import ChatMessage from '../components/ChatMessage';

export default function ChatScreen({ route, navigation }) {
  const { images, report } = route.params || {};
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const insets = useSafeAreaInsets();
  const flatListRef = useRef(null);
  const navigationRef = useNavigation();
  const inputRef = useRef(null);
  const inputOpacity = useRef(new Animated.Value(0.6)).current;
  const [backConfirmationVisible, setBackConfirmationVisible] = useState(false);

  // System prompt that references the existing report
  const CHAT_SYSTEM_PROMPT = `You are a professional home inspection consultant. You have already analyzed property images and generated a comprehensive inspection report.

IMPORTANT CONTEXT:
- A full inspection report has already been completed for this property
- The user is now asking follow-up questions about the inspection
- You should answer based on the inspection report provided below
- Be helpful, professional, and reference specific findings from the report
- If asked about something not in the report, acknowledge that and provide general guidance

INITIAL INSPECTION REPORT:
${report || 'No report available'}

Instructions:
- Answer questions by referencing the inspection report above
- Provide clear, actionable advice
- Use professional but friendly tone
- If the question is about general home maintenance not in the report, you can provide general advice
- Stay focused on home inspection topics`;

  // Initialize with welcome message
  useEffect(() => {
    if (report) {
      setMessages([
        {
          id: '0',
          sender: 'ai',
          isWelcome: true,
          isStreaming: false,
        },
      ]);
    }
  }, [report]);

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

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        setBackConfirmationVisible(true);
        return true;
      },
    );
    return () => backHandler.remove();
  }, []);

  const confirmBack = () => {
    setBackConfirmationVisible(false);
    navigation.goBack();
  };

  const cancelBack = () => {
    setBackConfirmationVisible(false);
  };

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading || isStreaming) return;

    const trimmedInput = inputText.trim();
    
    // Clear input immediately
    setInputText('');
    
    // Small delay to ensure state is updated
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const userMessage = {
      id: Date.now().toString(),
      text: trimmedInput,
      sender: 'user',
      isStreaming: false,
    };
    
    // Update other states after ensuring input is cleared
    setInputFocused(false);
    Keyboard.dismiss();
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setIsStreaming(true);

    try {
      const state = await Network.getNetworkStateAsync();
      if (!state.isInternetReachable) {
        navigationRef.navigate('NetworkError');
        return;
      }

      // Build conversation history (exclude welcome message)
      const conversationHistory = messages
        .filter(msg => !msg.isWelcome)
        .map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: (msg.text || '').toString(),
        }));

      // Add current message
      conversationHistory.push({
        role: 'user',
        content: trimmedInput,
      });

      console.log('Sending chat request with:', {
        hasReport: !!report,
        reportLength: report?.length,
        historyLength: conversationHistory.length,
        message: trimmedInput.substring(0, 50)
      });

      // Call chat API with system prompt and report context
      const aiResponse = await getChatResponse(trimmedInput, {
        systemPrompt: CHAT_SYSTEM_PROMPT,
        context: report,
        conversationHistory: conversationHistory,
        // Don't send images - we're chatting about the report, not analyzing new images
      });

      const newId = (Date.now() + 1).toString();
      setMessages(prev => [
        ...prev,
        { id: newId, text: '', sender: 'ai', isStreaming: true },
      ]);

      // Simulate streaming effect
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
      console.error('Chat error:', error);
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

  const renderWelcomeMessage = () => (
    <View style={styles.welcomeContainer}>
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Image 
            source={require('../assets/inspector.png')} 
            style={styles.avatarImage}
            resizeMode="contain"
          />
        </View>
      </View>
      <Text style={styles.welcomeTitle}>How Can I Help You?</Text>
      <Text style={styles.welcomeSubtitle}>
        Ask me anything about your inspection report
      </Text>
    </View>
  );

  const renderMessage = ({ item }) => {
    if (item.isWelcome) {
      return renderWelcomeMessage();
    }
    return <ChatMessage message={item} />;
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <CustomHeader 
        title="AI Home Reporter" 
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
          key={isStreaming ? 'streaming' : 'ready'}
          inputText={inputText}
          setInputText={setInputText}
          isLoading={isLoading}
          isStreaming={isStreaming}
          sendMessage={sendMessage}
          inputFocused={inputFocused}
          setInputFocused={setInputFocused}
          inputOpacity={inputOpacity}
          hasInitialReport={!!report}
          style={{
            paddingBottom: Math.max(insets.bottom, 10),
            marginBottom: keyboardVisible ? keyboardHeight + 12 : 0,
          }}
        />
      </View>

      <CustomModal
        visible={backConfirmationVisible}
        title="Leave Chat?"
        message="Going back will return to the report screen."
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
  welcomeContainer: {
    alignItems: 'center',
    paddingVertical: SIZES.extraLarge * 2,
    paddingHorizontal: SIZES.large,
  },
  avatarContainer: {
    marginBottom: SIZES.extraLarge,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  avatarImage: {
    width: 60,
    height: 60,
    tintColor: COLORS.white,
  },
  welcomeTitle: {
    fontSize: SIZES.extraLarge,
    ...FONTS.bold,
    color: COLORS.text,
    marginBottom: SIZES.small,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: SIZES.medium,
    ...FONTS.regular,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
});