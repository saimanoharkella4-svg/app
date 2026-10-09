import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { colors } from '../theme/colors';

interface CogniTrackLogoProps {
  size?: 'small' | 'medium' | 'large';
  showSubtitle?: boolean;
  subtitleText?: string;
  hideTag?: boolean;
}

export const CogniTrackLogo: React.FC<CogniTrackLogoProps> = ({
  size = 'medium',
  showSubtitle = true,
  subtitleText = 'Field Telemetry & Marketing Ops',
  hideTag = false,
}) => {
  const isSmall = size === 'small';
  const isLarge = size === 'large';

  const badgeSize = isSmall ? 34 : isLarge ? 54 : 44;
  const titleSize = isSmall ? 17 : isLarge ? 26 : 21;

  return (
    <View style={styles.container}>
      {/* Sleek Intelligent GPS / Radar Telemetry Crest */}
      <View
        style={[
          styles.badge,
          {
            width: badgeSize,
            height: badgeSize,
            borderRadius: 10,
          },
        ]}
      >
        <Svg
          width={badgeSize * 0.58}
          height={badgeSize * 0.58}
          viewBox="0 0 24 24"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Outer Radar Pulse Target */}
          <Circle cx="12" cy="12" r="9" stroke="rgba(255,255,255,0.4)" strokeWidth="1.6" />
          {/* Inner Location Beacon Target */}
          <Circle cx="12" cy="12" r="4" stroke="#06B6D4" strokeWidth="2.2" fill="#06B6D4" fillOpacity="0.25" />
          {/* Directional Telemetry Crosshairs */}
          <Path d="M12 2V5" stroke="#FFFFFF" />
          <Path d="M12 19V22" stroke="#FFFFFF" />
          <Path d="M2 12H5" stroke="#FFFFFF" />
          <Path d="M19 12H22" stroke="#FFFFFF" />
        </Svg>
      </View>

      <View style={styles.textContainer}>
        <View style={styles.titleRow}>
          <Text style={[styles.brandText, { fontSize: titleSize }]}>
            Cogni<Text style={{ color: colors.brandPrimary }}>Track</Text>
          </Text>
          {!hideTag && !isSmall && (
            <View style={styles.proTag}>
              <Text style={styles.proTagText}>FIELD</Text>
            </View>
          )}
        </View>
        {showSubtitle && (
          <Text style={styles.subtitleText}>{subtitleText}</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  badge: {
    backgroundColor: '#2563EB', // Royal Blue
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 2,
  },
  textContainer: {
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandText: {
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.6,
  },
  proTag: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  proTagText: {
    color: '#1D4ED8',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  subtitleText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
});
