import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  BackHandler,
} from 'react-native';
import CustomHeader from '../components/CustomHeader';
import CustomButton from '../components/CustomButton';
import CustomModal from '../components/CustomModal';
import { COLORS, FONTS, SIZES } from '../constants/theme';

export default function ReportScreen({ route, navigation }) {
  const [backConfirmVisible, setBackConfirmVisible] = useState(false);
  const [parsedContent, setParsedContent] = useState([]);
  
  const { report, images } = route.params || {};
  
  useEffect(() => {
    console.log('ReportScreen - Report received:', { 
      hasReport: !!report, 
      reportType: typeof report,
      length: report?.length,
      hasImages: !!images,
      imagesCount: images?.length
    });

    if (report) {
      const parsed = parseReportWithFormatting(report);
      setParsedContent(parsed);
    }
  }, [report, images]);

  // Parse report and separate headings from content
  const parseReportWithFormatting = (text) => {
    if (!text) return [];
    
    const lines = text.split('\n');
    const content = [];
    
    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      
      // Check if it's a heading (starts with ###)
      if (trimmed.startsWith('###')) {
        // Remove all leading hash characters and whitespace
        const heading = trimmed.replace(/^#+\s*/, '');
        content.push({ type: 'heading', text: heading });
      } 
      // Check if it's a bullet point
      else if (trimmed.startsWith('-')) {
        const bulletText = trimmed.replace(/^-\s*/, '').replace(/\*\*/g, '');
        content.push({ type: 'bullet', text: bulletText });
      }
      // Regular text
      else {
        content.push({ type: 'text', text: trimmed.replace(/\*\*/g, '') });
      }
    });
    
    return content;
  };

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        setBackConfirmVisible(true);
        return true;
      }
    );
    return () => backHandler.remove();
  }, []);

  const confirmBack = () => {
    setBackConfirmVisible(false);
    navigation.goBack();

  };

  const handleChatWithReporter = () => {
    console.log('Navigating to Chat with report:', !!report);
    navigation.navigate('Chat', { 
      report: report,
      images: images 
    });
  };

  const renderContent = () => {
    return parsedContent.map((item, index) => {
      if (item.type === 'heading') {
        return (
          <Text key={index} style={styles.heading}>
            {item.text}
          </Text>
        );
      } else if (item.type === 'bullet') {
        return (
          <View key={index} style={styles.bulletContainer}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>{item.text}</Text>
          </View>
        );
      } else {
        return (
          <Text key={index} style={styles.regularText}>
            {item.text}
          </Text>
        );
      }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <CustomHeader 
        title="Generated Report" 
        onBack={() => setBackConfirmVisible(true)}
      />

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {report ? (
          <View style={styles.reportCard}>
            {renderContent()}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No report data available</Text>
            <Text style={styles.emptySubtext}>
              Please go back and upload photos to generate a report
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <CustomButton
          title="Chat With Reporter"
          onPress={handleChatWithReporter}
          style={styles.chatButton}
          disabled={!report}
        />
      </View>

      <CustomModal
        visible={backConfirmVisible}
        title="Leave Report?"
        message="Going back will return to photo upload. You'll need to process photos again."
        onCancel={() => setBackConfirmVisible(false)}
        onConfirm={confirmBack}
        cancelText="Stay"
        confirmText="Go Back"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: SIZES.large,
    paddingTop: SIZES.medium,
    paddingBottom: SIZES.large,
  },
  reportCard: {
    backgroundColor: COLORS.white || '#FFFFFF',
    borderRadius: SIZES.base * 1.5,
    padding: SIZES.large,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  heading: {
    fontSize: SIZES.large,
    ...FONTS.bold,
    color: COLORS.text,
    marginTop: SIZES.medium,
    marginBottom: SIZES.small,
  },
  bulletContainer: {
    flexDirection: 'row',
    marginBottom: SIZES.small,
    paddingLeft: SIZES.small,
  },
  bullet: {
    fontSize: SIZES.medium,
    ...FONTS.regular,
    color: COLORS.text,
    marginRight: SIZES.small,
  },
  bulletText: {
    flex: 1,
    fontSize: SIZES.medium,
    ...FONTS.regular,
    color: COLORS.text,
    lineHeight: SIZES.large + 4,
  },
  regularText: {
    fontSize: SIZES.medium,
    ...FONTS.regular,
    color: COLORS.text,
    lineHeight: SIZES.large + 6,
    marginBottom: SIZES.small,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.extraLarge * 3,
    paddingHorizontal: SIZES.large,
  },
  emptyText: {
    fontSize: SIZES.large,
    ...FONTS.semiBold,
    color: COLORS.text,
    marginBottom: SIZES.small,
  },
  emptySubtext: {
    fontSize: SIZES.medium,
    ...FONTS.regular,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  footer: {
    padding: SIZES.large,
    paddingBottom: SIZES.extraLarge,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  chatButton: {
    height: 52,
    borderRadius: SIZES.base * 1.5,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
});