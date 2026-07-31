package online.rpdesichat.adminsms

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class BootReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent?) {
    if (intent?.action != Intent.ACTION_BOOT_COMPLETED) return
    if (Prefs.isLoggedIn(context)) {
      AlertPollService.start(context)
    }
  }
}
