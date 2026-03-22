package com.informatica.app

import android.content.ComponentName
import android.content.pm.PackageManager
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class LauncherIconModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "LauncherIconModule"

  @ReactMethod
  fun setLauncherIcon(iconKey: String, promise: Promise) {
    try {
      val packageName = reactApplicationContext.packageName
      val defaultAlias = ComponentName(packageName, "$packageName.DefaultLauncherAlias")
      val eleccionesAlias = ComponentName(packageName, "$packageName.EleccionesLauncherAlias")

      val selectedIsElecciones = iconKey == "elecciones"

      val pm = reactApplicationContext.packageManager
      pm.setComponentEnabledSetting(
        defaultAlias,
        if (selectedIsElecciones) {
          PackageManager.COMPONENT_ENABLED_STATE_DISABLED
        } else {
          PackageManager.COMPONENT_ENABLED_STATE_ENABLED
        },
        PackageManager.DONT_KILL_APP,
      )

      pm.setComponentEnabledSetting(
        eleccionesAlias,
        if (selectedIsElecciones) {
          PackageManager.COMPONENT_ENABLED_STATE_ENABLED
        } else {
          PackageManager.COMPONENT_ENABLED_STATE_DISABLED
        },
        PackageManager.DONT_KILL_APP,
      )

      promise.resolve(if (selectedIsElecciones) "elecciones" else "default")
    } catch (e: Exception) {
      promise.reject("launcher_icon_error", e.message, e)
    }
  }
}
