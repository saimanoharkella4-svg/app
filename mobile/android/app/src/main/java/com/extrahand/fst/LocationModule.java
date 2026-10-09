package com.extrahand.fst;

import android.content.Context;
import android.content.Intent;
import android.location.Location;
import android.os.Build;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

public class LocationModule extends ReactContextBaseJavaModule {

    private static ReactApplicationContext reactContext;
    private static boolean isServiceRunning = false;

    public LocationModule(ReactApplicationContext context) {
        super(context);
        reactContext = context;
    }

    @Override
    public String getName() {
        return "ForegroundLocationModule";
    }

    @ReactMethod
    public void startService(ReadableMap options, Promise promise) {
        try {
            long interval = options.hasKey("intervalMs") ? (long) options.getDouble("intervalMs") : 180000;
            float distance = options.hasKey("distanceMeters") ? (float) options.getDouble("distanceMeters") : 20.0f;

            Intent intent = new Intent(reactContext, ForegroundLocationService.class);
            intent.setAction(ForegroundLocationService.ACTION_START);
            intent.putExtra(ForegroundLocationService.EXTRA_INTERVAL, interval);
            intent.putExtra(ForegroundLocationService.EXTRA_DISTANCE, distance);

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                reactContext.startForegroundService(intent);
            } else {
                reactContext.startService(intent);
            }

            isServiceRunning = true;
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("START_SERVICE_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void stopService(Promise promise) {
        try {
            Intent intent = new Intent(reactContext, ForegroundLocationService.class);
            intent.setAction(ForegroundLocationService.ACTION_STOP);
            reactContext.startService(intent);

            isServiceRunning = false;
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("STOP_SERVICE_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void isServiceRunning(Promise promise) {
        promise.resolve(isServiceRunning);
    }

    public static void sendLocationUpdate(Location location) {
        if (reactContext == null || !reactContext.hasActiveCatalystInstance()) return;

        WritableMap params = Arguments.createMap();
        params.putDouble("latitude", location.getLatitude());
        params.putDouble("longitude", location.getLongitude());
        params.putDouble("accuracy", location.getAccuracy());
        params.putDouble("speed", location.getSpeed());
        params.putDouble("bearing", location.getBearing());
        params.putDouble("altitude", location.getAltitude());
        params.putDouble("time", location.getTime());
        params.putBoolean("isMock", location.isFromMockProvider());

        reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit("onLocationReceived", params);
    }
}
