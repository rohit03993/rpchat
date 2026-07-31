package online.rpdesichat.adminsms

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.provider.Telephony
import org.json.JSONObject
import kotlin.concurrent.thread

class SmsReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    if (Telephony.Sms.Intents.SMS_RECEIVED_ACTION != intent.action) return
    if (!Prefs.isLoggedIn(context)) return

    val msgs = Telephony.Sms.Intents.getMessagesFromIntent(intent) ?: return
    val body = msgs.joinToString("") { it.displayMessageBody.orEmpty() }
    if (!looksLikeCredit(body)) return

    val pending = goAsync()
    thread {
      try {
        val res = ApiClient.postSmsCredit(Prefs.baseUrl(context), Prefs.token(context), body)
        val json = runCatching { JSONObject(res.body) }.getOrNull()
        val action = json?.optString("action").orEmpty()
        val reason = json?.optString("reason").orEmpty()
        val amount = json?.optJSONObject("parsed")?.optInt("amountInr")
        val userId = json?.optJSONObject("payment")?.optString("userId")
          ?: json?.optJSONObject("credit")?.optString("userId")

        val title = when (action) {
          "approve" -> "Payment auto-unlocked ₹${amount ?: ""}"
          "needs_review" -> "SMS needs review ₹${amount ?: ""}"
          "no_match" -> "SMS no match ₹${amount ?: ""}"
          else -> "SMS credit: $action"
        }
        val detail = buildString {
          if (!userId.isNullOrBlank()) append("User $userId · ")
          append(reason.ifBlank { res.body.take(120) })
        }
        Notify.show(context, Notify.CH_SMS, (System.currentTimeMillis() % 100000).toInt(), title, detail)
      } catch (e: Exception) {
        Notify.show(
          context,
          Notify.CH_SMS,
          9001,
          "SMS forward failed",
          e.message ?: "network error"
        )
      } finally {
        pending.finish()
      }
    }
  }

  private fun looksLikeCredit(body: String): Boolean {
    val t = body.lowercase()
    if (!t.contains("rs") && !t.contains("inr") && !t.contains("₹") && !t.contains("upi")) return false
    if (t.contains("debited") && !t.contains("credited")) return false
    return t.contains("credit") || t.contains("received") || t.contains("deposited") ||
      t.contains("upi") || Regex("rs\\.?\\s*\\d").containsMatchIn(t)
  }
}
