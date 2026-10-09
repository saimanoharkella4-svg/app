import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, 
  TouchableOpacity, TextInput, ActivityIndicator, Alert 
} from 'react-native';
import { StaffProfile, mobileStorage, mobileApi } from '../services/api';
import { colors } from '../theme/colors';
import { 
  User, Mail, Phone, ShieldCheck, Battery, 
  LogOut, Lock, KeyRound, CheckCircle2, AlertCircle, 
  Compass, Eye, EyeOff 
} from 'lucide-react-native';

interface ProfileScreenProps {
  profile: StaffProfile | null;
  onLogout: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ profile, onLogout }) => {
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [changingPass, setChangingPass] = useState(false);
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');

  const handleLogoutPress = () => {
    mobileStorage.clearToken();
    onLogout();
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      setPassError('Please fill in both current and new password');
      return;
    }
    if (newPassword.length < 6) {
      setPassError('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassError('New passwords do not match');
      return;
    }

    setChangingPass(true);
    setPassError('');
    setPassSuccess('');
    try {
      await mobileApi.changePassword(currentPassword, newPassword);
      setPassSuccess('Password updated successfully!');
      setTimeout(() => {
        setShowPasswordModal(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setPassSuccess('');
      }, 1500);
    } catch (err: any) {
      setPassError(err.message || 'Failed to update password');
    } finally {
      setChangingPass(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Profile Header Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarChar}>{(profile?.name || 'R').charAt(0)}</Text>
        </View>
        <Text style={styles.nameText}>{profile?.name || 'Rahul Kumar'}</Text>
        <Text style={styles.subText}>CogniTrack Marketing Executive</Text>

        <View style={styles.badgeRow}>
          <View style={styles.statusPill}>
            <View style={styles.activeDot} />
            <Text style={styles.statusText}>{profile?.status || 'ACTIVE'}</Text>
          </View>
          <View style={styles.codePill}>
            <Text style={styles.codeText}>{profile?.employee_code || 'EMP101'}</Text>
          </View>
        </View>
      </View>

      {/* Profile Details List */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Executive Credentials</Text>

        <View style={styles.infoRow}>
          <User size={16} color="#4F46E5" />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.infoLabel}>Full Name</Text>
            <Text style={styles.infoVal}>{profile?.name || 'Rahul Kumar'}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Compass size={16} color="#4F46E5" />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.infoLabel}>Employee ID</Text>
            <Text style={styles.infoVal}>{profile?.employee_code || 'EMP101'}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Phone size={16} color="#4F46E5" />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.infoLabel}>Mobile Number</Text>
            <Text style={styles.infoVal}>{profile?.phone || '+91 98765 43210'}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Mail size={16} color="#4F46E5" />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.infoLabel}>Email Address</Text>
            <Text style={styles.infoVal}>{profile?.email || 'rahul@cognitrack.io'}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <ShieldCheck size={16} color="#059669" />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.infoLabel}>Role & Permissions</Text>
            <Text style={styles.infoVal}>Marketing Executive (CogniTrack Mobile)</Text>
          </View>
        </View>
      </View>

      {/* Security & Password Change */}
      <View style={styles.card}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <KeyRound size={16} color="#4F46E5" />
            <Text style={styles.cardTitle}>Account Security</Text>
          </View>
          <TouchableOpacity 
            style={styles.changePassBtn}
            onPress={() => setShowPasswordModal(!showPasswordModal)}
          >
            <Text style={styles.changePassBtnText}>
              {showPasswordModal ? 'Cancel' : 'Change Password'}
            </Text>
          </TouchableOpacity>
        </View>

        {showPasswordModal ? (
          <View style={styles.passForm}>
            {passError ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{passError}</Text>
              </View>
            ) : null}
            {passSuccess ? (
              <View style={styles.successBox}>
                <Text style={styles.successText}>{passSuccess}</Text>
              </View>
            ) : null}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Current Password</Text>
              <TextInput
                style={styles.textInput}
                secureTextEntry={!showPass}
                placeholder="Enter current password"
                placeholderTextColor="#94A3B8"
                value={currentPassword}
                onChangeText={setCurrentPassword}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>New Password (min 6 chars)</Text>
              <TextInput
                style={styles.textInput}
                secureTextEntry={!showPass}
                placeholder="Enter new password"
                placeholderTextColor="#94A3B8"
                value={newPassword}
                onChangeText={setNewPassword}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirm New Password</Text>
              <TextInput
                style={styles.textInput}
                secureTextEntry={!showPass}
                placeholder="Confirm new password"
                placeholderTextColor="#94A3B8"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            </View>

            <TouchableOpacity 
              style={styles.savePassBtn}
              onPress={handleChangePassword}
              disabled={changingPass}
            >
              {changingPass ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.savePassBtnText}>Update Password</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={styles.securitySub}>
            Your session is secured using encrypted JWT tokens. You can update your password at any time.
          </Text>
        )}
      </View>

      {/* Battery Optimization & OS Settings */}
      <View style={styles.card}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Battery size={18} color="#059669" />
          <Text style={styles.cardTitle}>Background Location Policy</Text>
        </View>
        <Text style={styles.cardDesc}>
          CogniTrack automatically tracks marketing location during working hours according to policy:
        </Text>

        <View style={styles.checkItem}>
          <CheckCircle2 size={15} color="#059669" />
          <Text style={styles.checkText}>Battery usage set to "Optimized 60s Interval"</Text>
        </View>
        <View style={styles.checkItem}>
          <CheckCircle2 size={15} color="#059669" />
          <Text style={styles.checkText}>Precise GPSFine location granted</Text>
        </View>
        <View style={styles.checkItem}>
          <CheckCircle2 size={15} color="#059669" />
          <Text style={styles.checkText}>PostGIS distance verification enabled</Text>
        </View>
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogoutPress}>
        <LogOut size={18} color="#DC2626" />
        <Text style={styles.logoutText}>Sign Out of CogniTrack</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    padding: 18,
    paddingTop: 24,
    paddingBottom: 40,
  },
  profileCard: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 22,
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EEF2FF',
    borderWidth: 2,
    borderColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarChar: {
    color: '#4338CA',
    fontSize: 24,
    fontWeight: '800',
  },
  nameText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  subText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 3,
    gap: 5,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#059669',
  },
  statusText: {
    color: '#059669',
    fontSize: 10.5,
    fontWeight: '800',
  },
  codePill: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  codeText: {
    color: '#64748B',
    fontSize: 10.5,
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    marginBottom: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  infoLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  infoVal: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '700',
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 4,
  },
  changePassBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  changePassBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4338CA',
  },
  securitySub: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },
  passForm: {
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 10,
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    padding: 8,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 11.5,
    fontWeight: '600',
  },
  successBox: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 8,
    padding: 8,
  },
  successText: {
    color: '#059669',
    fontSize: 11.5,
    fontWeight: '600',
  },
  inputGroup: {},
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
  },
  textInput: {
    height: 38,
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 10,
    fontSize: 13,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
  },
  savePassBtn: {
    backgroundColor: '#4F46E5',
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  savePassBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  cardDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 8,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 3,
  },
  checkText: {
    fontSize: 11.5,
    color: '#334155',
    fontWeight: '500',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 14,
    height: 44,
    gap: 8,
    marginTop: 6,
  },
  logoutText: {
    color: '#DC2626',
    fontSize: 13.5,
    fontWeight: '700',
  },
});
