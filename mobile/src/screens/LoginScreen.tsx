import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, 
  StyleSheet, ActivityIndicator, ScrollView, Alert 
} from 'react-native';
import { mobileApi } from '../services/api';
import { colors } from '../theme/colors';
import { CogniTrackLogo } from '../components/CogniTrackLogo';
import { 
  Lock, User, ArrowRight, Eye, EyeOff, Sparkles, ShieldCheck 
} from 'lucide-react-native';

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [employeeCode, setEmployeeCode] = useState('EMP101');
  const [password, setPassword] = useState('Password@123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const requestLocationPermission = (): Promise<GeolocationPosition | null> => {
    return new Promise((resolve) => {
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        resolve(null);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => resolve(position),
        (_err) => {
          // Fallback gracefully if location permission is denied or restricted in preview
          console.warn("Location permission unavailable; falling back to default field coordinates.");
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    });
  };

  const handleLogin = async (codeToUse?: string) => {
    setLoading(true);
    setErrorMsg('');
    try {
      await requestLocationPermission();
      await mobileApi.login(codeToUse || employeeCode, password);
      onLoginSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    Alert.alert(
      'Forgot Password',
      'Please contact your CogniTrack Operations Manager or System Administrator to reset your employee password.'
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.contentWrapper}>
          {/* CogniTrack Brand Logo at Top */}
          <View style={styles.logoRow}>
            <CogniTrackLogo size="large" showSubtitle={false} hideTag={false} />
          </View>

          {/* Header Title */}
          <Text style={styles.title}>Field Executive Login</Text>

          {/* Royal Blue Accent Line */}
          <View style={styles.accentBar} />

          {/* Subtitle */}
          <Text style={styles.subtitle}>
            Sign in to start your field shift{'\n'}and automated location tracking
          </Text>

          {/* Error message if any */}
          {errorMsg ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}

          {/* Form Container */}
          <View style={styles.form}>
            {/* Employee ID Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Employee ID</Text>
              <View style={styles.inputWrapper}>
                <User size={16} color="#2563EB" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter Employee ID (e.g. EMP101)"
                  placeholderTextColor="#94A3B8"
                  value={employeeCode}
                  onChangeText={setEmployeeCode}
                  autoCapitalize="characters"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrapper}>
                <Lock size={16} color="#2563EB" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor="#94A3B8"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity 
                  style={styles.eyeBtn}
                  onPress={() => setShowPassword(!showPassword)}
                  activeOpacity={0.7}
                >
                  {showPassword ? (
                    <EyeOff size={16} color="#64748B" />
                  ) : (
                    <Eye size={16} color="#64748B" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Sign In Button */}
            <TouchableOpacity
              style={styles.signInBtn}
              onPress={() => handleLogin()}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <View style={styles.btnContent}>
                  <Text style={styles.signInBtnText}>Sign In to CogniTrack</Text>
                  <ArrowRight size={17} color="#FFFFFF" strokeWidth={2.4} />
                </View>
              )}
            </TouchableOpacity>

            {/* Forgot Password Link */}
            <TouchableOpacity 
              style={styles.forgotBtn}
              onPress={handleForgotPassword}
              activeOpacity={0.7}
            >
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Quick Demo Staff Accounts */}
            <View style={styles.quickPresets}>
              <View style={styles.presetHeader}>
                <Sparkles size={11} color="#2563EB" />
                <Text style={styles.presetLabel}>QUICK TEST LOGIN</Text>
              </View>
              <View style={styles.presetGrid}>
                {[
                  { code: 'EMP101', name: 'Rahul (Field Rep)' },
                  { code: 'EMP102', name: 'Suresh (Field Rep)' },
                  { code: 'EMP104', name: 'Priya (Area Lead)' }
                ].map((staff) => (
                  <TouchableOpacity
                    key={staff.code}
                    style={[
                      styles.presetChip,
                      employeeCode === staff.code && styles.presetChipActive
                    ]}
                    onPress={() => {
                      setEmployeeCode(staff.code);
                      handleLogin(staff.code);
                    }}
                  >
                    <Text style={[styles.presetName, employeeCode === staff.code && styles.presetTextActive]}>
                      {staff.code}
                    </Text>
                    <Text style={styles.presetSkill}>
                      {staff.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
  },
  contentWrapper: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
  },
  logoRow: {
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  accentBar: {
    width: 32,
    height: 3,
    backgroundColor: '#2563EB', // Royal Blue
    borderRadius: 2,
    marginTop: 8,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: '#64748B',
    fontWeight: '500',
    textAlign: 'center',
  },
  errorBox: {
    width: '100%',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    padding: 8,
    marginTop: 10,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 11.5,
    fontWeight: '600',
    textAlign: 'center',
  },
  form: {
    width: '100%',
    marginTop: 16,
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 11,
    height: 42,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '500',
    height: '100%',
    paddingVertical: 0,
  },
  eyeBtn: {
    padding: 5,
    marginLeft: 4,
  },
  signInBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 2,
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  signInBtnText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  forgotBtn: {
    marginTop: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  forgotText: {
    color: '#2563EB',
    fontSize: 12.5,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  quickPresets: {
    marginTop: 18,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    width: '100%',
  },
  presetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginBottom: 8,
  },
  presetLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#2563EB',
    letterSpacing: 0.5,
  },
  presetGrid: {
    flexDirection: 'row',
    gap: 6,
  },
  presetChip: {
    flex: 1,
    paddingHorizontal: 5,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  presetChipActive: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  presetName: {
    color: '#0F172A',
    fontSize: 10.5,
    fontWeight: '700',
  },
  presetSkill: {
    color: '#64748B',
    fontSize: 8.5,
    marginTop: 2,
    textAlign: 'center',
  },
  presetTextActive: {
    color: '#1D4ED8',
    fontWeight: '800',
  },
});
