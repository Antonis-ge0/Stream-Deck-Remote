package com.antonis_ge0.streamdeckremote

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.net.DatagramPacket
import java.net.DatagramSocket
import java.net.InetAddress
import java.util.concurrent.Executors

class WakeOnLanModule(
  reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {
  private val executor = Executors.newSingleThreadExecutor()

  override fun getName(): String = "WakeOnLan"

  @ReactMethod
  fun send(macAddress: String, broadcastAddress: String, port: Int, promise: Promise) {
    executor.execute {
      try {
        val packet = createMagicPacket(macAddress)
        val address = InetAddress.getByName(broadcastAddress)

        DatagramSocket().use { socket ->
          socket.broadcast = true

          repeat(3) {
            socket.send(DatagramPacket(packet, packet.size, address, port))
            Thread.sleep(80)
          }
        }

        promise.resolve(null)
      } catch (error: Exception) {
        promise.reject("WOL_SEND_FAILED", error.message, error)
      }
    }
  }

  override fun invalidate() {
    super.invalidate()
    executor.shutdown()
  }

  private fun createMagicPacket(macAddress: String): ByteArray {
    val normalized = macAddress.replace(Regex("[^A-Fa-f0-9]"), "").uppercase()

    if (normalized.length != 12) {
      throw IllegalArgumentException("Enter a valid 12-digit MAC address.")
    }

    val macBytes = normalized.chunked(2).map { it.toInt(16).toByte() }
    val packet = ByteArray(102)

    for (index in 0 until 6) {
      packet[index] = 0xff.toByte()
    }

    for (repeatIndex in 0 until 16) {
      for (byteIndex in macBytes.indices) {
        packet[6 + repeatIndex * 6 + byteIndex] = macBytes[byteIndex]
      }
    }

    return packet
  }
}
