package com.mamaair.motion

import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorManager
import android.hardware.TriggerEvent
import android.hardware.TriggerEventListener
import android.util.Log
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule

/**
 * MotionGate — bridges Android motion APIs to React Native.
 *
 * Only signal: TYPE_SIGNIFICANT_MOTION (hardware-batched, low-power, Doze-aware,
 * one-shot — must be re-armed inside the trigger callback). No Play Services
 * dependency: the previous version used Activity Recognition Transition API and
 * crashed with IncompatibleClassChangeError on CIS-region devices whose bundled
 * Play Services Location classes don't match what we compiled against.
 *
 * Without Activity Recognition, motion-gating logic is simpler: any sigmotion
 * event resets the tracker's stop-deadline. Absence of sigmotion for the
 * configured idle interval lets the deadline elapse, transitioning the tracker
 * to idle. STILL transitions are no longer emitted explicitly — they're
 * inferred from silence.
 *
 * Events are emitted to JS via DeviceEventManagerModule under the name "MotionGate".
 */
class MotionGateModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        const val TAG = "MotionGate"
        const val EVENT_NAME = "MotionGate"

        @JvmStatic
        @Volatile
        var staticInstance: MotionGateModule? = null
    }

    private val sensorManager: SensorManager? =
        reactContext.getSystemService(Context.SENSOR_SERVICE) as? SensorManager
    private val sigMotionSensor: Sensor? =
        sensorManager?.getDefaultSensor(Sensor.TYPE_SIGNIFICANT_MOTION)

    @Volatile private var started: Boolean = false

    private val sigMotionListener = object : TriggerEventListener() {
        override fun onTrigger(event: TriggerEvent?) {
            Log.i(TAG, "Significant motion triggered")
            emitEvent("sigmotion")
            if (started && sigMotionSensor != null) {
                sensorManager?.requestTriggerSensor(this, sigMotionSensor)
            }
        }
    }

    init {
        synchronized(MotionGateModule::class.java) {
            staticInstance = this
        }
    }

    override fun getName(): String = "MotionGate"

    override fun invalidate() {
        synchronized(MotionGateModule::class.java) {
            if (staticInstance === this) {
                staticInstance = null
            }
        }
        super.invalidate()
    }

    @ReactMethod
    fun start(promise: Promise) {
        try {
            if (started) {
                promise.resolve(true)
                return
            }

            if (sigMotionSensor != null) {
                val armed = sensorManager?.requestTriggerSensor(sigMotionListener, sigMotionSensor)
                Log.i(TAG, "Significant motion armed: $armed")
            } else {
                Log.w(TAG, "TYPE_SIGNIFICANT_MOTION not available on this device")
            }

            started = true
            promise.resolve(true)
        } catch (t: Throwable) {
            Log.e(TAG, "start failed: ${t.message}", t)
            promise.reject("MOTION_GATE_START", t)
        }
    }

    @ReactMethod
    fun stop(promise: Promise) {
        try {
            started = false
            // cancelTriggerSensor with null sensor crashes on some OEMs
            if (sigMotionSensor != null) {
                sensorManager?.cancelTriggerSensor(sigMotionListener, sigMotionSensor)
            }
            promise.resolve(true)
        } catch (t: Throwable) {
            promise.reject("MOTION_GATE_STOP", t)
        }
    }

    /** Required for NativeEventEmitter — no-op since we emit via DeviceEventManagerModule. */
    @ReactMethod
    fun addListener(eventName: String) { /* no-op */ }

    @ReactMethod
    fun removeListeners(count: Int) { /* no-op */ }

    private fun emitEvent(type: String) {
        val params: WritableMap = Arguments.createMap().apply {
            putString("type", type)
        }
        try {
            reactApplicationContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                ?.emit(EVENT_NAME, params)
        } catch (e: Exception) {
            Log.w(TAG, "emit failed (JS context may be down): ${e.message}")
        }
    }
}
