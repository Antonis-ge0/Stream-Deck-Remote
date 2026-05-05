package com.antonis_ge0.streamdeckremote

import android.Manifest
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothHidDevice
import android.bluetooth.BluetoothHidDeviceAppSdpSettings
import android.bluetooth.BluetoothProfile
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.provider.Settings
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.util.concurrent.Executors

class BluetoothKeyboardModule(
  private val reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {
  private val executor = Executors.newSingleThreadExecutor()
  private val bluetoothAdapter: BluetoothAdapter? = BluetoothAdapter.getDefaultAdapter()
  private var hidDevice: BluetoothHidDevice? = null
  private var connectedHost: BluetoothDevice? = null
  private var registered = false
  private var pendingRegisterPromise: Promise? = null
  private var lastError: String? = null

  override fun getName(): String = "BluetoothKeyboard"

  @ReactMethod
  fun addListener(eventName: String) {
    // Required by NativeEventEmitter.
  }

  @ReactMethod
  fun removeListeners(count: Int) {
    // Required by NativeEventEmitter.
  }

  @ReactMethod
  fun getStatus(promise: Promise) {
    promise.resolve(statusMap())
  }

  @ReactMethod
  fun registerKeyboard(promise: Promise) {
    if (!isSupported()) {
      promise.reject("HID_UNSUPPORTED", "Android Bluetooth HID Device requires Android 9+ and phone hardware support.")
      return
    }

    if (!hasBluetoothPermission()) {
      promise.reject("BLUETOOTH_PERMISSION", "Bluetooth permission is required before enabling phone keyboard mode.")
      return
    }

    val adapter = bluetoothAdapter
    if (adapter == null || !adapter.isEnabled) {
      promise.reject("BLUETOOTH_DISABLED", "Turn Bluetooth on before enabling phone keyboard mode.")
      return
    }

    if (registered) {
      promise.resolve(statusMap())
      return
    }

    pendingRegisterPromise = promise

    val existingProxy = hidDevice
    if (existingProxy != null) {
      registerWithProxy(existingProxy)
      return
    }

    val requested = adapter.getProfileProxy(
      reactContext,
      profileListener,
      BluetoothProfile.HID_DEVICE
    )

    if (!requested) {
      pendingRegisterPromise = null
      promise.reject("HID_PROXY_FAILED", "Could not open the Android HID device profile.")
    }
  }

  @ReactMethod
  fun unregisterKeyboard(promise: Promise) {
    try {
      hidDevice?.unregisterApp()
      registered = false
      connectedHost = null
      emitStatus()
      promise.resolve(statusMap())
    } catch (error: Exception) {
      promise.reject("HID_UNREGISTER_FAILED", error.message, error)
    }
  }

  @ReactMethod
  fun getBondedHosts(promise: Promise) {
    if (!hasBluetoothPermission()) {
      promise.reject("BLUETOOTH_PERMISSION", "Bluetooth permission is required to read paired devices.")
      return
    }

    val devices = Arguments.createArray()
    bluetoothAdapter?.bondedDevices?.forEach { device ->
      val map = Arguments.createMap()
      map.putString("name", safeDeviceName(device))
      map.putString("address", device.address)
      devices.pushMap(map)
    }

    promise.resolve(devices)
  }

  @ReactMethod
  fun connectHost(address: String, promise: Promise) {
    if (!registered || hidDevice == null) {
      promise.reject("HID_NOT_READY", "Enable phone keyboard mode first.")
      return
    }

    if (!hasBluetoothPermission()) {
      promise.reject("BLUETOOTH_PERMISSION", "Bluetooth permission is required to connect.")
      return
    }

    try {
      val device = bluetoothAdapter?.getRemoteDevice(address)
      if (device == null) {
        promise.reject("HID_HOST_NOT_FOUND", "Paired host not found.")
        return
      }

      val accepted = hidDevice?.connect(device) == true
      if (accepted) {
        promise.resolve(statusMap())
      } else {
        promise.reject("HID_CONNECT_FAILED", "Android did not accept the HID host connection request.")
      }
    } catch (error: Exception) {
      promise.reject("HID_CONNECT_FAILED", error.message, error)
    }
  }

  @ReactMethod
  fun sendKey(key: String, promise: Promise) {
    if (!registered || hidDevice == null || connectedHost == null) {
      promise.reject("HID_NOT_CONNECTED", "Pair and connect the phone keyboard before sending keys.")
      return
    }

    val keyCode = keyCodes[key]
    if (keyCode == null) {
      promise.reject("HID_UNKNOWN_KEY", "Unsupported key: $key")
      return
    }

    try {
      sendKeyboardReport(keyCode)
      promise.resolve(null)
    } catch (error: Exception) {
      promise.reject("HID_SEND_FAILED", error.message, error)
    }
  }

  @ReactMethod
  fun openBluetoothSettings(promise: Promise) {
    try {
      val intent = Intent(Settings.ACTION_BLUETOOTH_SETTINGS)
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      reactContext.startActivity(intent)
      promise.resolve(null)
    } catch (error: Exception) {
      promise.reject("BLUETOOTH_SETTINGS_FAILED", error.message, error)
    }
  }

  override fun invalidate() {
    super.invalidate()
    try {
      hidDevice?.unregisterApp()
      bluetoothAdapter?.closeProfileProxy(BluetoothProfile.HID_DEVICE, hidDevice)
    } catch (_: Exception) {
    }
    executor.shutdown()
  }

  private fun registerWithProxy(proxy: BluetoothHidDevice) {
    val sdp = BluetoothHidDeviceAppSdpSettings(
      "StreamDeck Remote Keyboard",
      "Manual phone keyboard for Windows sign-in",
      "StreamDeck Remote",
      0x40.toByte(),
      keyboardDescriptor
    )

    try {
      val accepted = proxy.registerApp(sdp, null, null, executor, hidCallback)
      if (!accepted) {
        val promise = pendingRegisterPromise
        pendingRegisterPromise = null
        promise?.reject("HID_REGISTER_FAILED", "Android did not accept the HID keyboard registration.")
      }
    } catch (error: Exception) {
      val promise = pendingRegisterPromise
      pendingRegisterPromise = null
      promise?.reject("HID_REGISTER_FAILED", error.message, error)
    }
  }

  private fun sendKeyboardReport(keyCode: Int) {
    val host = connectedHost ?: throw IllegalStateException("No connected HID host.")
    val proxy = hidDevice ?: throw IllegalStateException("HID device profile is not ready.")

    val press = bytes(0x00, 0x00, keyCode, 0x00, 0x00, 0x00, 0x00, 0x00)
    val release = bytes(0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00)

    if (!proxy.sendReport(host, 0, press)) {
      throw IllegalStateException("Android failed to send the key press.")
    }

    Thread.sleep(35)

    if (!proxy.sendReport(host, 0, release)) {
      throw IllegalStateException("Android failed to release the key.")
    }
  }

  private val profileListener = object : BluetoothProfile.ServiceListener {
    override fun onServiceConnected(profile: Int, proxy: BluetoothProfile) {
      if (profile == BluetoothProfile.HID_DEVICE) {
        hidDevice = proxy as BluetoothHidDevice
        registerWithProxy(proxy)
      }
    }

    override fun onServiceDisconnected(profile: Int) {
      if (profile == BluetoothProfile.HID_DEVICE) {
        hidDevice = null
        connectedHost = null
        registered = false
        emitStatus()
      }
    }
  }

  private val hidCallback = object : BluetoothHidDevice.Callback() {
    override fun onAppStatusChanged(pluggedDevice: BluetoothDevice?, isRegistered: Boolean) {
      registered = isRegistered
      connectedHost = pluggedDevice
      lastError = null

      val promise = pendingRegisterPromise
      pendingRegisterPromise = null

      if (isRegistered) {
        promise?.resolve(statusMap())
      } else {
        promise?.reject("HID_REGISTER_FAILED", "Android unregistered the phone keyboard. Keep the app in the foreground.")
      }

      emitStatus()
    }

    override fun onConnectionStateChanged(device: BluetoothDevice?, state: Int) {
      connectedHost = if (state == BluetoothProfile.STATE_CONNECTED) device else null
      emitStatus()
    }
  }

  private fun statusMap(): WritableMap {
    val map = Arguments.createMap()
    val host = connectedHost

    map.putBoolean("supported", isSupported())
    map.putBoolean("permissionGranted", hasBluetoothPermission())
    map.putBoolean("bluetoothEnabled", isBluetoothEnabled())
    map.putBoolean("registered", registered)
    map.putBoolean("connected", host != null)
    map.putString("connectedHostName", host?.let { safeDeviceName(it) })
    map.putString("connectedHostAddress", host?.let { safeDeviceAddress(it) })
    map.putString("lastError", lastError)

    return map
  }

  private fun emitStatus() {
    reactContext
      .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      .emit("BluetoothKeyboardStatus", statusMap())
  }

  private fun isSupported(): Boolean {
    return Build.VERSION.SDK_INT >= Build.VERSION_CODES.P &&
      bluetoothAdapter != null &&
      reactContext.packageManager.hasSystemFeature(PackageManager.FEATURE_BLUETOOTH)
  }

  private fun hasBluetoothPermission(): Boolean {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
      return true
    }

    return ContextCompat.checkSelfPermission(
      reactContext,
      Manifest.permission.BLUETOOTH_CONNECT
    ) == PackageManager.PERMISSION_GRANTED
  }

  private fun isBluetoothEnabled(): Boolean {
    return try {
      bluetoothAdapter?.isEnabled == true
    } catch (_: SecurityException) {
      false
    }
  }

  private fun safeDeviceName(device: BluetoothDevice): String {
    return if (hasBluetoothPermission()) {
      device.name ?: "Paired device"
    } else {
      "Paired device"
    }
  }

  private fun safeDeviceAddress(device: BluetoothDevice): String? {
    return if (hasBluetoothPermission()) {
      device.address
    } else {
      null
    }
  }

  private fun bytes(vararg values: Int): ByteArray {
    return values.map { it.toByte() }.toByteArray()
  }

  companion object {
    private val keyCodes = mapOf(
      "1" to 0x1e,
      "2" to 0x1f,
      "3" to 0x20,
      "4" to 0x21,
      "5" to 0x22,
      "6" to 0x23,
      "7" to 0x24,
      "8" to 0x25,
      "9" to 0x26,
      "0" to 0x27,
      "ENTER" to 0x28,
      "BACKSPACE" to 0x2a
    )

    private val keyboardDescriptor = byteArrayOf(
      0x05, 0x01,
      0x09, 0x06,
      0xa1.toByte(), 0x01,
      0x05, 0x07,
      0x19, 0xe0.toByte(),
      0x29, 0xe7.toByte(),
      0x15, 0x00,
      0x25, 0x01,
      0x75, 0x01,
      0x95.toByte(), 0x08,
      0x81.toByte(), 0x02,
      0x95.toByte(), 0x01,
      0x75, 0x08,
      0x81.toByte(), 0x01,
      0x95.toByte(), 0x05,
      0x75, 0x01,
      0x05, 0x08,
      0x19, 0x01,
      0x29, 0x05,
      0x91.toByte(), 0x02,
      0x95.toByte(), 0x01,
      0x75, 0x03,
      0x91.toByte(), 0x01,
      0x95.toByte(), 0x06,
      0x75, 0x08,
      0x15, 0x00,
      0x25, 0x65,
      0x05, 0x07,
      0x19, 0x00,
      0x29, 0x65,
      0x81.toByte(), 0x00,
      0xc0.toByte()
    )
  }
}
