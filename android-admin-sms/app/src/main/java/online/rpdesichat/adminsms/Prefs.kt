package online.rpdesichat.adminsms

import android.content.Context

object Prefs {
  private const val NAME = "adminsms"

  fun baseUrl(ctx: Context): String =
    ctx.getSharedPreferences(NAME, Context.MODE_PRIVATE)
      .getString("baseUrl", "https://rpdesichat.online")!!
      .trim()
      .trimEnd('/')

  fun token(ctx: Context): String =
    ctx.getSharedPreferences(NAME, Context.MODE_PRIVATE).getString("token", "") ?: ""

  fun adminId(ctx: Context): String =
    ctx.getSharedPreferences(NAME, Context.MODE_PRIVATE).getString("adminId", "") ?: ""

  fun lastAlertSince(ctx: Context): Long =
    ctx.getSharedPreferences(NAME, Context.MODE_PRIVATE).getLong("alertSince", 0L)

  fun saveLogin(ctx: Context, baseUrl: String, token: String, adminId: String) {
    ctx.getSharedPreferences(NAME, Context.MODE_PRIVATE).edit()
      .putString("baseUrl", baseUrl.trim().trimEnd('/'))
      .putString("token", token)
      .putString("adminId", adminId)
      .apply()
  }

  fun setAlertSince(ctx: Context, since: Long) {
    ctx.getSharedPreferences(NAME, Context.MODE_PRIVATE).edit()
      .putLong("alertSince", since)
      .apply()
  }

  fun isLoggedIn(ctx: Context): Boolean = token(ctx).isNotBlank()

  fun smsPermAsked(ctx: Context): Boolean =
    ctx.getSharedPreferences(NAME, Context.MODE_PRIVATE).getBoolean("smsPermAsked", false)

  fun setSmsPermAsked(ctx: Context, asked: Boolean = true) {
    ctx.getSharedPreferences(NAME, Context.MODE_PRIVATE).edit()
      .putBoolean("smsPermAsked", asked)
      .apply()
  }

  /** Dedupe SMS bodies for 36h so Android redelivery does not spam. */
  fun wasSmsSeen(ctx: Context, hash: String): Boolean {
    pruneSmsSeen(ctx)
    val key = "sms_$hash"
    return ctx.getSharedPreferences(NAME, Context.MODE_PRIVATE).contains(key)
  }

  fun markSmsSeen(ctx: Context, hash: String) {
    pruneSmsSeen(ctx)
    ctx.getSharedPreferences(NAME, Context.MODE_PRIVATE).edit()
      .putLong("sms_$hash", System.currentTimeMillis())
      .apply()
  }

  private fun pruneSmsSeen(ctx: Context) {
    val sp = ctx.getSharedPreferences(NAME, Context.MODE_PRIVATE)
    val cut = System.currentTimeMillis() - 36L * 3600_000L
    val ed = sp.edit()
    var changed = false
    for ((k, v) in sp.all) {
      if (!k.startsWith("sms_")) continue
      val at = (v as? Long) ?: 0L
      if (at < cut) {
        ed.remove(k)
        changed = true
      }
    }
    if (changed) ed.apply()
  }
}
