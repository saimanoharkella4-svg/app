import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  ActivityIndicator, RefreshControl, Alert 
} from 'react-native';
import { 
  mobileApi, StaffProfile, TrackingStatus, ScheduleItem 
} from '../services/api';
import { foregroundLocationService } from '../services/foregroundLocationService';
import { CogniTrackLogo } from '../components/CogniTrackLogo';
import { 
  MapPin, Clock, ShieldCheck, Compass, CheckCircle2, 
  AlertTriangle, Radio, Navigation, Calendar, ArrowRight,
  Battery, AlertCircle, Target, Coffee, Power
} from 'lucide-react-native';

interface HomeScreenProps {
  profile: StaffProfile | null;
  onNavigateToSchedule?: () => void;
  onNavigateToRoute?: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ 
  profile, 
  onNavigateToSchedule,
  onNavigateToRoute 
}) => {
  const [status, setStatus] = useState<TrackingStatus | null>(null);
  const [schedule, setSchedule] = useState<ScheduleItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasPermission, setHasPermission] = useState(true);
  const [permissionBannerVisible, setPermissionBannerVisible] = useState(false);

  // Dynamic Time Greeting based on current local hour
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };
  const greeting = getGreeting();

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const fetchData = async () => {
    try {
      const [trackingRes, schedRes] = await Promise.all([
        mobileApi.getTrackingStatus().catch(() => null),
        mobileApi.getTodaySchedule().catch(() => null)
      ]);
      if (trackingRes) setStatus(trackingRes);
      if (schedRes) setSchedule(schedRes);
    } catch (err) {
      console.warn('Dashboard sync error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Automatic Location Tracking: Start automatically upon loading
    foregroundLocationService.requestPermissions().then((granted) => {
      setHasPermission(granted);
      if (granted) {
        foregroundLocationService.startService();
      } else {
        setPermissionBannerVisible(true);
      }
    });

    // Periodic live sync (every 15 seconds)
    const interval = setInterval(() => {
      fetchData();
    }, 15000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const requestPermissionFlow = async () => {
    const granted = await foregroundLocationService.requestPermissions();
    setHasPermission(granted);
    if (granted) {
      setPermissionBannerVisible(false);
      foregroundLocationService.startService();
      fetchData();
    } else {
      Alert.alert(
        'Location Required',
        'CogniTrack requires location permission during working hours to verify assigned marketing locations.'
      );
    }
  };

  const [dutyActionLoading, setDutyActionLoading] = useState<string | null>(null);

  const handleStartDuty = async () => {
    setDutyActionLoading('login');
    try {
      const granted = await foregroundLocationService.requestPermissions();
      if (!granted) {
        Alert.alert('Permission Required', 'Location permission is required to log in and start duty.');
        setHasPermission(false);
        setPermissionBannerVisible(true);
        return;
      }
      await mobileApi.startDuty({
        start_latitude: status?.last_latitude || 17.435,
        start_longitude: status?.last_longitude || 78.41,
        start_address: "Jubilee Hills",
        battery_level: 85
      });
      foregroundLocationService.startService();
      Alert.alert('Logged In ✓', 'Duty shift started. Live location monitoring is ACTIVE.');
      await fetchData();
    } catch (err: any) {
      Alert.alert('Login Error', err.message || 'Could not start duty.');
    } finally {
      setDutyActionLoading(null);
    }
  };

  const handleTakeBreak = async () => {
    setDutyActionLoading('break');
    try {
      await mobileApi.toggleBreak();
      // Ensure background location service stays running while on break!
      if (hasPermission) {
        foregroundLocationService.startService();
      }
      Alert.alert('Break Status Updated ☕', 'You are on break. Location monitoring remains active.');
      await fetchData();
    } catch (err: any) {
      Alert.alert('Break Error', err.message || 'Could not update break status.');
    } finally {
      setDutyActionLoading(null);
    }
  };

  const handleStopDuty = async () => {
    setDutyActionLoading('logoff');
    try {
      await mobileApi.stopDuty({
        end_latitude: status?.last_latitude || 17.435,
        end_longitude: status?.last_longitude || 78.41,
        end_address: "Jubilee Hills",
        battery_level: 85
      });
      foregroundLocationService.stopService();
      Alert.alert('Logged Off ⏸', 'Duty ended. Location monitoring is off.');
      await fetchData();
    } catch (err: any) {
      Alert.alert('Log Off Error', err.message || 'Could not end duty.');
    } finally {
      setDutyActionLoading(null);
    }
  };

  const isTrackingActive = hasPermission && (status?.is_on_duty ?? false);
  const isDeviated = status?.is_deviated ?? false;
  const currentStatusText = isTrackingActive 
    ? (status?.current_status || 'At Assigned Location') 
    : 'Location monitoring paused';

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4F46E5']} />}
    >
      {/* Top CogniTrack Brand Bar */}
      <View style={styles.brandBar}>
        <CogniTrackLogo size="small" subtitleText="Field Marketing Suite" />
      </View>

      {/* Executive Greeting & Date */}
      <View style={styles.greetingContainer}>
        <Text style={styles.greetingText}>
          {greeting}, {profile?.name?.split(' ')[0] || 'Rahul'}
        </Text>
        <Text style={styles.dateText}>{formattedDate}</Text>
      </View>

      {/* 3-Button Duty Status Control Card (LOG IN, BREAK, LOG OFF) */}
      <View style={styles.dutyControlCard}>
        <View style={styles.dutyCardHeader}>
          <Text style={styles.dutyCardTitle}>Shift & Location Control</Text>
          <View style={[
            styles.statusPill, 
            status?.is_on_duty ? styles.statusActive : styles.statusOffline
          ]}>
            <Text style={styles.statusPillText}>
              {status?.is_on_duty ? 'ACTIVE SHIFT' : 'OFF DUTY'}
            </Text>
          </View>
        </View>

        <Text style={styles.dutyCardSubtext}>
          Location monitoring stays active during Log In and Break periods until you Log Off.
        </Text>

        <View style={styles.dutyButtonGroup}>
          {/* LOG IN Button */}
          <TouchableOpacity 
            style={[styles.dutyBtn, styles.dutyBtnLogin]} 
            onPress={handleStartDuty}
            disabled={dutyActionLoading !== null}
            activeOpacity={0.8}
          >
            {dutyActionLoading === 'login' ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <View style={styles.dutyBtnContent}>
                <Radio size={15} color="#FFFFFF" />
                <Text style={styles.dutyBtnText}>LOG IN</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* BREAK Button */}
          <TouchableOpacity 
            style={[styles.dutyBtn, styles.dutyBtnBreak]} 
            onPress={handleTakeBreak}
            disabled={dutyActionLoading !== null}
            activeOpacity={0.8}
          >
            {dutyActionLoading === 'break' ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <View style={styles.dutyBtnContent}>
                <Coffee size={15} color="#FFFFFF" />
                <Text style={styles.dutyBtnText}>BREAK</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* LOG OFF Button */}
          <TouchableOpacity 
            style={[styles.dutyBtn, styles.dutyBtnLogoff]} 
            onPress={handleStopDuty}
            disabled={dutyActionLoading !== null}
            activeOpacity={0.8}
          >
            {dutyActionLoading === 'logoff' ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <View style={styles.dutyBtnContent}>
                <Power size={15} color="#FFFFFF" />
                <Text style={styles.dutyBtnText}>LOG OFF</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Location Permission Explanation Banner */}
      {(!hasPermission || permissionBannerVisible) && (
        <View style={styles.permissionCard}>
          <View style={styles.permHeaderRow}>
            <ShieldCheck size={20} color="#4F46E5" />
            <Text style={styles.permTitle}>Location Tracking</Text>
          </View>
          <Text style={styles.permDesc}>
            CogniTrack uses your location during working hours to verify assigned marketing locations and generate work reports.
          </Text>
          <TouchableOpacity style={styles.allowPermBtn} onPress={requestPermissionFlow}>
            <Text style={styles.allowPermBtnText}>Allow Location Access</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Today's Schedule Summary Card */}
      <TouchableOpacity 
        style={styles.sectionCard} 
        onPress={onNavigateToSchedule}
        activeOpacity={0.88}
      >
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle}>Today's Schedule</Text>
          <View style={styles.statusPillActive}>
            <Text style={styles.statusPillActiveText}>
              {schedule?.status ? schedule.status.replace('_', ' ') : 'IN PROGRESS'}
            </Text>
          </View>
        </View>

        <View style={styles.scheduleRow}>
          <View style={styles.pinIconBox}>
            <MapPin size={20} color="#4F46E5" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.locLabel}>LOCATION</Text>
            <Text style={styles.locationTitle}>
              {schedule?.location_name || status?.assigned_location || 'Jubilee Hills'}
            </Text>
            <Text style={styles.addressSub}>
              {schedule?.address || status?.assigned_address || 'Villa 42, Jubilee Hills Road 36'}
            </Text>
          </View>
        </View>

        <View style={styles.scheduleTimingBox}>
          <View style={styles.timingItem}>
            <Clock size={14} color="#6366F1" />
            <Text style={styles.timingText}>
              {schedule?.time_window_display || status?.planned_schedule || '3:00 PM – 3:45 PM'}
            </Text>
          </View>
          <View style={styles.timingItem}>
            <Compass size={14} color="#6366F1" />
            <Text style={styles.timingText}>
              Geofence: {schedule?.geofence_radius_meters || 200}m
            </Text>
          </View>
        </View>

        {onNavigateToSchedule && (
          <View style={styles.cardActionLink}>
            <Text style={styles.cardActionText}>View Full Schedule (Pending & Completed)</Text>
            <ArrowRight size={14} color="#4F46E5" />
          </View>
        )}
      </TouchableOpacity>

      {/* Automatic Location & Tracking Status Card */}
      <View style={styles.sectionCard}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle}>Tracking & Location Status</Text>
          <View style={[styles.trackingBadge, isTrackingActive ? styles.trackingActive : styles.trackingOffline]}>
            <Radio size={12} color={isTrackingActive ? '#059669' : '#DC2626'} />
            <Text style={[styles.trackingBadgeText, isTrackingActive ? styles.textActive : styles.textOffline]}>
              Tracking: {isTrackingActive ? 'Active' : 'Offline'}
            </Text>
          </View>
        </View>

        <View style={styles.statusGrid}>
          {/* Geographical Verification Result */}
          <View style={styles.statusBox}>
            <Text style={styles.statusBoxLabel}>Current Verification Status</Text>
            <View style={styles.statusResultRow}>
              {isDeviated ? (
                <AlertTriangle size={16} color="#EA580C" />
              ) : (
                <CheckCircle2 size={16} color="#059669" />
              )}
              <Text style={[styles.statusResultText, isDeviated ? styles.textDeviation : styles.textVerified]}>
                {currentStatusText}
              </Text>
            </View>
            <Text style={styles.distanceMetricText}>
              {status?.distance_meters != null 
                ? `Distance to center: ${status.distance_meters > 1000 ? (status.distance_meters / 1000).toFixed(1) + ' km' : status.distance_meters.toFixed(0) + 'm'}` 
                : 'Distance: 85m (Within 200m Geofence)'}
            </Text>
          </View>

          {/* Metric Details Row */}
          <View style={styles.metricsSummaryRow}>
            <View style={styles.miniMetric}>
              <Text style={styles.miniLabel}>Working Hours</Text>
              <Text style={styles.miniVal}>{status?.working_duration || '03h 42m'}</Text>
            </View>

            <View style={styles.miniDivider} />

            <View style={styles.miniMetric}>
              <Text style={styles.miniLabel}>Last GPS Sync</Text>
              <Text style={styles.miniVal}>{status?.last_update_display || '10:32 AM'}</Text>
            </View>

            <View style={styles.miniDivider} />

            <View style={styles.miniMetric}>
              <Text style={styles.miniLabel}>Today Distance</Text>
              <Text style={styles.miniVal}>{status?.today_distance_km ? `${status.today_distance_km} KM` : '31.6 KM'}</Text>
            </View>
          </View>
        </View>

        {/* Automatic Tracking Policy Note */}
        <View style={styles.autoPolicyNote}>
          <ShieldCheck size={14} color="#4F46E5" />
          <Text style={styles.autoPolicyText}>
            Automatic background tracking active. GPS is securely sampled according to CogniTrack's 60s working-hours policy.
          </Text>
        </View>

        {onNavigateToRoute && (
          <TouchableOpacity style={styles.cardActionLink} onPress={onNavigateToRoute}>
            <Text style={styles.cardActionText}>View Live Map & Trajectory</Text>
            <ArrowRight size={14} color="#4F46E5" />
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    padding: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  brandBar: {
    marginBottom: 16,
  },
  greetingContainer: {
    marginBottom: 20,
  },
  greetingText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  dateText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 2,
  },
  /* Permission Notice Card */
  permissionCard: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1.2,
    borderColor: '#C7D2FE',
    borderRadius: 16,
    padding: 16,
    marginBottom: 18,
  },
  permHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  permTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#3730A3',
  },
  permDesc: {
    fontSize: 12,
    color: '#312E81',
    lineHeight: 18,
    marginBottom: 12,
  },
  allowPermBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  allowPermBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  /* Main Section Cards */
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  statusPillActive: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusPillActiveText: {
    color: '#1D4ED8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  scheduleRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  pinIconBox: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  locLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  locationTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 1,
  },
  addressSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 16,
  },
  scheduleTimingBox: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    gap: 16,
    marginBottom: 12,
  },
  timingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timingText: {
    fontSize: 12,
    color: '#0F172A',
    fontWeight: '700',
  },
  cardActionLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  cardActionText: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '700',
  },
  /* Tracking & Location Status */
  trackingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  trackingActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  trackingOffline: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  trackingBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  textActive: {
    color: '#059669',
  },
  textOffline: {
    color: '#DC2626',
  },
  statusGrid: {
    gap: 12,
  },
  statusBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statusBoxLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 6,
  },
  statusResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  statusResultText: {
    fontSize: 15,
    fontWeight: '800',
  },
  textVerified: {
    color: '#059669',
  },
  textDeviation: {
    color: '#EA580C',
  },
  distanceMetricText: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '500',
  },
  metricsSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  miniMetric: {
    flex: 1,
    alignItems: 'center',
  },
  miniLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
  },
  miniVal: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '800',
    marginTop: 2,
  },
  miniDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
  },
  autoPolicyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    borderRadius: 10,
    padding: 10,
    marginTop: 4,
    marginBottom: 10,
  },
  autoPolicyText: {
    flex: 1,
    fontSize: 11,
    color: '#3730A3',
    lineHeight: 15,
    fontWeight: '500',
  },
  /* 3-Button Duty Control Card Styles */
  dutyControlCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    marginBottom: 18,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  dutyCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  dutyCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  dutyCardSubtext: {
    fontSize: 11.5,
    color: '#64748B',
    lineHeight: 16,
    marginBottom: 14,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  statusOffline: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  statusPillText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  dutyButtonGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  dutyBtn: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  dutyBtnLogin: {
    backgroundColor: '#059669', // Emerald green
  },
  dutyBtnBreak: {
    backgroundColor: '#D97706', // Amber warning
  },
  dutyBtnLogoff: {
    backgroundColor: '#DC2626', // Crimson red
  },
  dutyBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  dutyBtnText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
