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
}
