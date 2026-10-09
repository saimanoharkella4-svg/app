import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  ActivityIndicator, RefreshControl, Alert, Linking 
} from 'react-native';
import { mobileApi, ScheduleItem } from '../services/api';
import { colors } from '../theme/colors';
import { 
  Calendar, MapPin, Compass, ShieldCheck, 
  CheckCircle2, AlertTriangle, Navigation, ExternalLink
} from 'lucide-react-native';

export const ScheduleScreen: React.FC = () => {
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED'>('ALL');
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const todayDateDisplay = new Date().toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  });

  const fetchSchedules = async () => {
    try {
      const data = await mobileApi.getMySchedules();
      setSchedules(data);
    } catch (err) {
      console.warn('Failed to load schedules from backend:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSchedules();
  };

  const handleStatusChange = async (scheduleId: number, targetStatus: string) => {
    setActionLoadingId(scheduleId);
    try {
      await mobileApi.updateScheduleStatus(scheduleId, targetStatus);
      Alert.alert(
        'Location Visit Completed',
        'Location visit recorded and logged successfully.'
      );
      fetchSchedules();
    } catch (err: any) {
      Alert.alert('Update Failed', err.message || 'Could not update visit status.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const openInMaps = (latitude?: number, longitude?: number, name?: string) => {
    const lat = latitude || 17.4440;
    const lon = longitude || 78.4670;
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Maps Navigation', `GPS Location Coordinates: ${lat}, ${lon}`);
    });
  };

  const todaySchedules = schedules.map(item => ({
    ...item,
    date_display: todayDateDisplay
  }));

  const filtered = todaySchedules.filter((s) => {
    if (filter === 'PENDING') {
      return s.status !== 'COMPLETED';
    }
    if (filter === 'COMPLETED') {
      return s.status === 'COMPLETED';
    }
    return true;
  });

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563EB']} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Assigned Places & Schedule</Text>
        <Text style={styles.headerSubtitle}>
          Assigned locations to visit for today's field operations
        </Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {(['ALL', 'PENDING', 'COMPLETED'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.filterChip, filter === tab && styles.filterChipActive]}
            onPress={() => setFilter(tab)}
          >
            <Text style={[styles.filterText, filter === tab && styles.filterTextActive]}>
              {tab === 'ALL' ? 'All Assigned Places' : tab === 'PENDING' ? 'Missed Areas' : 'Visited ✓'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Fetching assigned locations...</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.emptyCard}>
          <Calendar size={36} color="#94A3B8" />
          <Text style={styles.emptyTitle}>No Assigned Locations</Text>
          <Text style={styles.emptyDesc}>
            Your assigned marketing visit locations will appear here once published by the Admin Portal.
          </Text>
        </View>
      ) : (
        <View style={styles.scheduleList}>
          {filtered.map((item) => {
            const isCompleted = item.status === 'COMPLETED';
            const isUpdating = actionLoadingId === item.id;
            const latNum = item.latitude || 17.4440;
            const lonNum = item.longitude || 78.4670;
            const latStr = latNum.toFixed(4);
            const lonStr = lonNum.toFixed(4);

            return (
              <View key={item.id} style={[styles.card, isCompleted ? styles.cardCompleted : styles.cardMissed]}>
                {/* Top Row: Date & Status Badge */}
                <View style={styles.cardTopRow}>
                  <View style={styles.dateTag}>
                    <Calendar size={13} color="#64748B" />
                    <Text style={styles.dateText}>{item.date_display}</Text>
                  </View>
                  <View style={[
                    styles.statusBadge,
                    isCompleted ? styles.statusCompleted : styles.statusMissed
                  ]}>
                    <Text style={[
                      styles.statusBadgeText,
                      isCompleted ? styles.textCompleted : styles.textMissed
                    ]}>
                      {isCompleted ? 'VISITED ✓' : 'MISSED AREA'}
                    </Text>
                  </View>
                </View>

                {/* Location Title & Exact Address (Clickable to open Maps) */}
                <TouchableOpacity 
                  style={styles.locationRow}
                  onPress={() => openInMaps(latNum, lonNum, item.location_name)}
                  activeOpacity={0.75}
                >
                  <View style={[styles.pinIconBox, isCompleted ? { backgroundColor: '#ECFDF5' } : { backgroundColor: '#FEF2F2' }]}>
                    <MapPin size={18} color={isCompleted ? '#10B981' : '#EF4444'} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.locationName}>{item.location_name}</Text>
                      <ExternalLink size={13} color="#2563EB" />
                    </View>
                    <Text style={styles.addressText}>{item.address}</Text>
                  </View>
                </TouchableOpacity>

                {/* Exact Location Point & Geofence Details (Clickable Location Point to open Maps) */}
                <View style={styles.detailsGrid}>
                  <TouchableOpacity 
                    style={[styles.detailItem, styles.clickableDetailItem]}
                    onPress={() => openInMaps(latNum, lonNum, item.location_name)}
                    activeOpacity={0.7}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Navigation size={13} color="#2563EB" />
                      <Text style={styles.detailLabel}>Location Point</Text>
                      <ExternalLink size={10} color="#2563EB" />
                    </View>
                    <Text style={[styles.detailValue, styles.clickableValue]}>{latStr}° N, {lonStr}° E</Text>
                  </TouchableOpacity>

                  <View style={styles.detailItem}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Compass size={13} color="#2563EB" />
                      <Text style={styles.detailLabel}>Telemetry Geofence</Text>
                    </View>
                    <Text style={styles.detailValue}>{item.geofence_radius_meters || 200}m Radius</Text>
                  </View>
                </View>

                {/* Service Type Tag */}
                {item.service_type && (
                  <View style={styles.cardFooter}>
                    <ShieldCheck size={13} color="#2563EB" />
                    <Text style={styles.footerText}>{item.service_type}</Text>
                  </View>
                )}

                {/* Action Button: Complete Visit */}
                {!isCompleted && (
                  <View style={{ marginTop: 12 }}>
                    <TouchableOpacity
                      style={styles.btnCompleteVisit}
                      disabled={isUpdating}
                      onPress={() => handleStatusChange(item.id, 'COMPLETED')}
                    >
                      {isUpdating ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <>
                          <CheckCircle2 size={16} color="#FFFFFF" />
                          <Text style={styles.btnActionText}>Complete Visit</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}
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
  header: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 3,
    fontWeight: '500',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  filterText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  filterTextActive: {
    color: '#1D4ED8',
    fontWeight: '800',
  },
  loadingBox: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 10,
  },
  loadingText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  emptyCard: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 32,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 10,
  },
  emptyDesc: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  scheduleList: {
    gap: 14,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  cardMissed: {
    borderColor: '#FECACA',
    backgroundColor: '#FFFDFD',
  },
  cardCompleted: {
    borderColor: '#BBF7D0',
    backgroundColor: '#FAFCF9',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dateText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusMissed: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  statusCompleted: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  textMissed: {
    color: '#DC2626',
  },
  textCompleted: {
    color: '#059669',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 14,
  },
  pinIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  addressText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 16,
  },
  detailsGrid: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    gap: 12,
  },
  detailItem: {
    flex: 1,
  },
  clickableDetailItem: {
    backgroundColor: '#EFF6FF',
    padding: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  detailLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 12,
    color: '#0F172A',
    fontWeight: '700',
    marginTop: 2,
  },
  clickableValue: {
    color: '#2563EB',
    textDecorationLine: 'underline',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  footerText: {
    fontSize: 11,
    color: '#2563EB',
    fontWeight: '600',
  },
  btnCompleteVisit: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  btnActionText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
});
