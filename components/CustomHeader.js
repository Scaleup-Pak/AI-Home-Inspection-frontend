import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Platform } from 'react-native';
import { COLORS, FONTS, SIZES } from '../constants/theme';

export default function CustomHeader({ title, onBack, showImage = true }) {
    return (
        <View style={styles.header}>
            {onBack && (
           
                <TouchableOpacity
                    style={styles.backArrow}
                    onPress={onBack}
                >
                    <Image
                        source={require('../assets/backicon.png')} // 👈 adjust path as needed
                        style={styles.backIcon}
                        resizeMode="contain"
                    />
                </TouchableOpacity>
            )}
            {showImage && (
                <Image
                    source={require('../assets/inspector.png')}
                    style={styles.headerImage}
                />
            )}
            <Text style={styles.headerTitle}>{title}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: Platform.OS === 'android' ? SIZES.extraLarge : SIZES.base,
        backgroundColor: COLORS.background,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        elevation: 2,
    },
    backArrow: {
        padding: SIZES.small,
        paddingLeft: SIZES.large,
        marginRight: SIZES.base,
    },
    headerImage: {
        width: 32,
        height: 32,
        resizeMode: 'contain',
        marginRight: SIZES.base * 1.25,
    },
    headerTitle: {
        fontSize: SIZES.large,
        ...FONTS.bold,
        color: COLORS.text,
        flex: 1,
    },
    backIcon: {
        width: 20,
        height: 20,
        tintColor: COLORS.primary,
    },
});