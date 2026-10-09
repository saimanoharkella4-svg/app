import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { HomeScreen } from '../screens/HomeScreen';
import { ScheduleScreen } from '../screens/ScheduleScreen';
import { TrackingScreen } from '../screens/TrackingScreen';
import { RouteScreen } from '../screens/RouteScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { StaffProfile } from '../services/api';
import { colors } from '../theme/colors';
import { MapPin, Navigation, Radio, User, Home, Satellite, Route, Calendar } from 'lucide-react-native';

interface AppNavigatorProps {
  profile: StaffProfile | null;
  onLogout: () => void;
}

export const AppNavigator: React.FC<AppNavigatorProps> = ({ profile, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'home' | 'schedule' | 'tracking' | 'route' | 'profile'>('home');

  return (
    <View style={styles.container}>
      {/* Screen Body */}
      <View style={styles.body}>
        {activeTab === 'home' && (
          <HomeScreen
            profile={profile}
            onNavigateToSchedule={() => setActiveTab('schedule')}
            onNavigateToRoute={() => setActiveTab('route')}
          />
        )}
        {activeTab === 'schedule' && <ScheduleScreen />}
        {activeTab === 'tracking' && <TrackingScreen />}
        {activeTab === 'route' && <RouteScreen />}
        {activeTab === 'profile' && <ProfileScreen profile={profile} onLogout={onLogout} />}
      </View>

      {/* Bottom Tabs Bar Matching CogniTrack Light Theme */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('home')}
        >
          <Home size={20} color={activeTab === 'home' ? '#4F46E5' : '#64748B'} />
          <Text style={[styles.tabLabel, activeTab === 'home' && styles.tabLabelActive]}>
            Home
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('schedule')}
        >
          <Calendar size={20} color={activeTab === 'schedule' ? '#4F46E5' : '#64748B'} />
          <Text style={[styles.tabLabel, activeTab === 'schedule' && styles.tabLabelActive]}>
            Schedule
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('tracking')}
        >
          <Radio size={20} color={activeTab === 'tracking' ? '#4F46E5' : '#64748B'} />
          <Text style={[styles.tabLabel, activeTab === 'tracking' && styles.tabLabelActive]}>
            Tracking
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('route')}
        >
          <Route size={20} color={activeTab === 'route' ? '#4F46E5' : '#64748B'} />
          <Text style={[styles.tabLabel, activeTab === 'route' && styles.tabLabelActive]}>
            Route
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('profile')}
        >
          <User size={20} color={activeTab === 'profile' ? '#4F46E5' : '#64748B'} />
          <Text style={[styles.tabLabel, activeTab === 'profile' && styles.tabLabelActive]}>
            Profile
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgCanvas,
  },
  body: {
    flex: 1,
  },
  tabBar: {
    height: 62,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: 4,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    flex: 1,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  tabLabelActive: {
    color: '#4F46E5',
    fontWeight: '800',
  },
});
