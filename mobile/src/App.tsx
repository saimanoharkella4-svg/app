import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, StatusBar } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { LoginScreen } from './screens/LoginScreen';
import { AppNavigator } from './navigation/AppNavigator';
import { mobileApi, StaffProfile, mobileStorage } from './services/api';
import { colors } from './theme/colors';
import { hydrateStorage } from './services/storage';

export const App: React.FC = () => {
  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    await hydrateStorage();
    const token = mobileStorage.getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const data = await mobileApi.getProfile();
      setProfile(data);
    } catch (e) {
      mobileStorage.clearToken();
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    mobileStorage.clearToken();
    setProfile(null);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.brandPrimary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
        {!profile ? (
          <LoginScreen onLoginSuccess={checkAuth} />
        ) : (
          <AppNavigator profile={profile} onLogout={handleLogout} />
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgCanvas,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default App;
