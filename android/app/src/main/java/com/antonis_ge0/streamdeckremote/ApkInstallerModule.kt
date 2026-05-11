package com.antonis_ge0.streamdeckremote

import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import androidx.core.content.FileProvider
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.UiThreadUtil
import java.io.File
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.Executors

class ApkInstallerModule(
  private val reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {
  private val executor = Executors.newSingleThreadExecutor()

  override fun getName(): String = "ApkInstaller"

  @ReactMethod
  fun installFromUrl(url: String, fileName: String, promise: Promise) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O &&
      !reactContext.packageManager.canRequestPackageInstalls()
    ) {
      promise.reject(
        "INSTALL_PERMISSION_REQUIRED",
        "Install permission is required before Android can install APK updates."
      )
      return
    }

    executor.execute {
      try {
        val apkFile = downloadApk(url, fileName)

        UiThreadUtil.runOnUiThread {
          try {
            openInstaller(apkFile)
            promise.resolve(null)
          } catch (error: Exception) {
            promise.reject("APK_INSTALL_FAILED", error.message, error)
          }
        }
      } catch (error: Exception) {
        promise.reject("APK_DOWNLOAD_FAILED", error.message, error)
      }
    }
  }

  @ReactMethod
  fun openInstallPermissionSettings(promise: Promise) {
    try {
      val intent =
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
          Intent(
            Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
            Uri.parse("package:${reactContext.packageName}")
          )
        } else {
          Intent(Settings.ACTION_SECURITY_SETTINGS)
        }

      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      reactContext.startActivity(intent)
      promise.resolve(null)
    } catch (error: Exception) {
      promise.reject("INSTALL_SETTINGS_FAILED", error.message, error)
    }
  }

  override fun invalidate() {
    super.invalidate()
    executor.shutdown()
  }

  private fun downloadApk(url: String, fileName: String): File {
    val safeName = sanitizeFileName(fileName.ifBlank { "stream-pad-remote-update.apk" })
    val apkFile = File(reactContext.cacheDir, safeName)
    val connection = (URL(url).openConnection() as HttpURLConnection).apply {
      connectTimeout = 20_000
      readTimeout = 60_000
      instanceFollowRedirects = true
      requestMethod = "GET"
    }

    try {
      val responseCode = connection.responseCode

      if (responseCode !in 200..299) {
        throw IllegalStateException("Update download failed with HTTP $responseCode.")
      }

      connection.inputStream.use { input ->
        apkFile.outputStream().use { output ->
          input.copyTo(output)
        }
      }
    } finally {
      connection.disconnect()
    }

    if (!apkFile.exists() || apkFile.length() <= 0L) {
      throw IllegalStateException("The downloaded update APK was empty.")
    }

    return apkFile
  }

  private fun openInstaller(apkFile: File) {
    val uri = FileProvider.getUriForFile(
      reactContext,
      "${reactContext.packageName}.fileprovider",
      apkFile
    )

    val intent = Intent(Intent.ACTION_INSTALL_PACKAGE).apply {
      setDataAndType(uri, "application/vnd.android.package-archive")
      addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
      putExtra(Intent.EXTRA_RETURN_RESULT, false)
      putExtra(Intent.EXTRA_INSTALLER_PACKAGE_NAME, reactContext.packageName)
    }

    reactContext.startActivity(intent)
  }

  private fun sanitizeFileName(fileName: String): String {
    val sanitized = fileName.replace(Regex("[^A-Za-z0-9._-]"), "-")
    return if (sanitized.lowercase().endsWith(".apk")) sanitized else "$sanitized.apk"
  }
}
