package online.rpdesichat.adminsms

import android.app.Notification
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.IBinder
import androidx.core.app.NotificationCompat
import org.json.JSONObject
import java.util.concurrent.Executors
import java.util.concurrent.ScheduledFuture
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicBoolean

/**
 * Polls /api/admin/alerts and fires local notifications for new users / payments / support.
 */
class AlertPollService : Service() {
  private val exec = Executors.newSingleThreadScheduledExecutor()
  private var job: ScheduledFuture<*>? = null
  private val running = AtomicBoolean(false)

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onCreate() {
    super.onCreate()
    Notify.ensureChannels(this)
    val n: Notification = NotificationCompat.Builder(this, Notify.CH_ALERTS)
      .setSmallIcon(android.R.drawable.ic_dialog_info)
      .setContentTitle("DesiChat Admin listening")
      .setContentText("SMS unlock + alerts for users / payments / support")
      .setOngoing(true)
      .setPriority(NotificationCompat.PRIORITY_LOW)
      .build()
    startForeground(42, n)
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    if (running.compareAndSet(false, true)) {
      // Seed "since" so we don't dump old history on first start
      if (Prefs.lastAlertSince(this) <= 0L) {
        Prefs.setAlertSince(this, System.currentTimeMillis())
      }
      job = exec.scheduleWithFixedDelay({ pollOnce() }, 2, 25, TimeUnit.SECONDS)
    }
    if (intent?.action == ACTION_POLL_NOW) {
      exec.execute { pollOnce() }
    }
    return START_STICKY
  }

  override fun onDestroy() {
    job?.cancel(true)
    running.set(false)
    exec.shutdownNow()
    super.onDestroy()
  }

  private fun pollOnce() {
    if (!Prefs.isLoggedIn(this)) return
    try {
      val since = Prefs.lastAlertSince(this)
      val res = ApiClient.getAlerts(Prefs.baseUrl(this), Prefs.token(this), since)
      if (!res.ok) return
      val root = JSONObject(res.body)
      val serverTime = root.optLong("serverTime", System.currentTimeMillis())
      val arr = root.optJSONArray("alerts") ?: return
      for (i in 0 until arr.length()) {
        val a = arr.optJSONObject(i) ?: continue
        val title = a.optString("title", "Admin alert")
        val body = a.optString("body", "")
        val type = a.optString("type", "alert")
        val id = (type + a.optString("userId") + a.optLong("createdAt")).hashCode()
        Notify.show(this, Notify.CH_ALERTS, id, title, body)
      }
      Prefs.setAlertSince(this, serverTime)
    } catch (_: Exception) {
    }
  }

  companion object {
    const val ACTION_POLL_NOW = "online.rpdesichat.adminsms.POLL_NOW"

    fun start(ctx: Context) {
      val i = Intent(ctx, AlertPollService::class.java)
      ctx.startForegroundService(i)
    }

    fun pollNow(ctx: Context) {
      val i = Intent(ctx, AlertPollService::class.java).setAction(ACTION_POLL_NOW)
      ctx.startForegroundService(i)
    }
  }
}
