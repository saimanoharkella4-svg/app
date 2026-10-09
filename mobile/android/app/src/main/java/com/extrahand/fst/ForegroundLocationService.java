package com.extrahand.fst;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.Build;
import android.os.Bundle;
import android.os.IBinder;
import android.os.PowerManager;
import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

public class ForegroundLocationService extends Service implements LocationListener {

    private static final String CHANNEL_ID = "FST_LOCATION_SERVICE_CHANNEL";
    private static final int NOTIFICATION_ID = 1001;

    private LocationManager locationManager;
    private PowerManager.WakeLock wakeLock;
    private boolean isTracking = false;

    // Default battery-efficient tracking configuration (3 minutes, 20 meters)
    private long trackingIntervalMs = 180000; // 3 minutes (configurable)
    private float minDistanceMeters = 20.0f;  // 20 meters

    public static final String ACTION_START = "ACTION_START";
    public static final String ACTION_STOP = "ACTION_STOP";
    public static final String EXTRA_INTERVAL = "EXTRA_INTERVAL";
    public static final String EXTRA_DISTANCE = "EXTRA_DISTANCE";

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
        locationManager = (LocationManager) getSystemService(Context.LOCATION_SERVICE);

        PowerManager powerManager = (PowerManager) getSystemService(Context.POWER_SERVICE);
        if (powerManager != null) {
            wakeLock = powerManager.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "FST::ForegroundLocationWakeLock");
        }
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && intent.getAction() != null) {
            String action = intent.getAction();
            if (ACTION_START.equals(action)) {
                trackingIntervalMs = intent.getLongExtra(EXTRA_INTERVAL, 180000);
                minDistanceMeters = intent.getFloatExtra(EXTRA_DISTANCE, 20.0f);
                startForegroundTracking();
            } else if (ACTION_STOP.equals(action)) {
                stopForegroundTracking();
            }
        }
        return START_STICKY;
    }

    private void startForegroundTracking() {
        if (isTracking) return;
        isTracking = true;

        if (wakeLock != null && !wakeLock.isHeld()) {
            wakeLock.acquire(12 * 60 * 60 * 1000L); // Max 12 hours duty lock
        }

        Notification notification = buildForegroundNotification();
        startForeground(NOTIFICATION_ID, notification);

        try {
            // Register for GPS Provider
            if (locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER)) {
                locationManager.requestLocationUpdates(
                        LocationManager.GPS_PROVIDER,
                        trackingIntervalMs,
                        minDistanceMeters,
                        this
                );
            }
            // Also register for Network Provider for coarse/indoor backup
            if (locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)) {
                locationManager.requestLocationUpdates(
                        LocationManager.NETWORK_PROVIDER,
                        trackingIntervalMs,
                        minDistanceMeters,
                        this
                );
            }
        } catch (SecurityException e) {
            e.printStackTrace();
        }
    }

    private void stopForegroundTracking() {
        isTracking = false;
        try {
            locationManager.removeUpdates(this);
        } catch (SecurityException e) {
            e.printStackTrace();
        }

        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
        }

        stopForeground(true);
        stopSelf();
    }

    private Notification buildForegroundNotification() {
        Intent notificationIntent = new Intent(this, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(
                this, 0, notificationIntent,
                Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0
        );

        return new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("ExtraHand FST")
                .setContentText("Location tracking is active. You are currently on duty.")
                .setSmallIcon(android.R.drawable.ic_menu_mylocation)
                .setContentIntent(pendingIntent)
                .setOngoing(true)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setCategory(NotificationCompat.CATEGORY_SERVICE)
                .build();
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "Field Staff Location Service",
                    NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Background location tracking during active duty session");
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }

    @Override
    public void onLocationChanged(Location location) {
        if (location != null) {
            // Forward location to React Native JavaScript layer
            LocationModule.sendLocationUpdate(location);
        }
    }

    @Override
    public void onStatusChanged(String provider, int status, Bundle extras) {}

    @Override
    public void onProviderEnabled(String provider) {}

    @Override
    public void onProviderDisabled(String provider) {}

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onDestroy() {
        stopForegroundTracking();
        super.onDestroy();
    }
}
