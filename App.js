import React from 'react';
import AppNavigator from './navigation/AppNavigator';

export default function App() {
  return <AppNavigator />;
}

// Styles moved to CustomModal component
// const styles = StyleSheet.create({
//   modalOverlay: {
//     flex: 1,
//     backgroundColor: 'rgba(10,10,10,0.45)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingHorizontal: 20,
//   },
//   alertBox: {
//     width: '100%',
//     maxWidth: 420,
//     backgroundColor: '#fff',
//     padding: 20,
//     borderRadius: 14,
//     alignItems: 'center',
//     elevation: 8,
//     shadowColor: '#000',
//     shadowOpacity: 0.12,
//     shadowRadius: 12,
//     shadowOffset: { width: 0, height: 6 },
//   },
//   alertTitle: { fontSize: 18, fontWeight: '700', color: TEAL, marginBottom: 8 },
//   alertMessage: { fontSize: 15, color: TEXT_DARK, textAlign: 'center', marginBottom: 16 },
//   alertActions: { flexDirection: 'row', justifyContent: 'center', width: '100%', gap: 10 },
//   alertButton: { minWidth: 100, paddingVertical: 12, paddingHorizontal: 18, borderRadius: 10, alignItems: 'center' },
//   alertPrimary: { backgroundColor: TEAL },
//   alertSecondary: { backgroundColor: '#F0F0F0' },
//   alertButtonText: { color: '#fff', fontWeight: '700' },
//   alertButtonTextSecondary: { color: '#333', fontWeight: '700' },
// });
