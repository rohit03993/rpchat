package online.rpdesichat.adminsms

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat

object Notify {
  const val CH_ALERTS = "admin_alerts"
  const val CH_SMS = "sms_credit"

  fun ensureChannels(ctx: Context) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    val nm = ctx.getSystemService(NotificationManager::class.java) ?: return
    nm.createNotificationChannel(
      NotificationChannel(CH_ALERTS, ctx.getString(R.string.channel_alerts), NotificationManager.IMPORTANCE_HIGH)
    )
    nm.createNotificationChannel(
      NotificationChannel(CH_SMS, ctx.getString(R.string.channel_sms), NotificationManager.IMPORTANCE_HIGH)
    )
  }

  fun show(ctx: Context, channel: String, id: Int, title: String, body: String) {
    ensureChannels(ctx)
    val open = Intent(ctx, MainActivity::class.java)
    val pi = PendingIntent.getActivity(
      ctx,
      id,
      open,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )
    val n = NotificationCompat.Builder(ctx, channel)
      .setSmallIcon(android.R.drawable.ic_dialog_info)
      .setContentTitle(title)
      .setContentText(body)
      .setStyle(NotificationCompat.BigTextStyle().bigText(body))
      .setPriority(NotificationCompat.PRIORITY_HIGH)
      .setAutoCancel(true)
      .setContentIntent(pi)
      .build()
    try {
      NotificationManagerCompat.from(ctx).notify(id, n)
    } catch (_: SecurityException) {
      // POST_NOTIFICATIONS not granted
    }
  }
}
