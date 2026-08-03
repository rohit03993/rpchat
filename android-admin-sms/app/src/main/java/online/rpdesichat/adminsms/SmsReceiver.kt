package online.rpdesichat.adminsms

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.provider.Telephony
import org.json.JSONObject
import java.security.MessageDigest
import kotlin.concurrent.thread

class SmsReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    if (Telephony.Sms.Intents.SMS_RECEIVED_ACTION != intent.action) return
    if (!Prefs.isLoggedIn(context)) return

    val msgs = Telephony.Sms.Intents.getMessagesFromIntent(intent) ?: return
    val body = msgs.joinToString("") { it.displayMessageBody.orEmpty() }.trim()
    if (body.isBlank()) return
    if (!looksLikeBankCredit(body)) return

    // Same SMS (or multipart re-delivery) must not spam API / notifications
    val hash = sha1(body.lowercase().replace(Regex("\\s+"), " "))
    if (Prefs.wasSmsSeen(context, hash)) return
    Prefs.markSmsSeen(context, hash)

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

        // Do not notify for noise: ignored / not-a-credit / unknown pack / duplicates
        if (action == "ignored" || action == "duplicate" || action.isBlank()) {
          return@thread
        }

        val title = when (action) {
          "approve", "approve_intent" -> "Payment auto-unlocked ₹${amount ?: ""}"
          "needs_review" -> "SMS needs review ₹${amount ?: ""}"
          "no_match" -> "SMS no match ₹${amount ?: ""}"
          else -> "SMS credit: $action"
        }
        val detail = buildString {
          if (!userId.isNullOrBlank()) append("User $userId · ")
          append(reason.ifBlank { res.body.take(120) })
        }
        // Stable id so a redelivery replaces the same notification
        val notifId = (hash.hashCode() and 0x7fffffff) % 90000 + 1000
        Notify.show(context, Notify.CH_SMS, notifId, title, detail)
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

  /**
   * Only real bank/UPI CREDIT alerts — not OTP, debit, balance, failed pay, marketing.
   */
  private fun looksLikeBankCredit(body: String): Boolean {
    val t = body.lowercase().replace(Regex("\\s+"), " ")

    if (
      t.contains("otp") ||
      t.contains("one time password") ||
      t.contains("verification code") ||
      t.contains("do not share") ||
      t.contains("failed") ||
      t.contains("unsuccessful") ||
      t.contains("declined") ||
      t.contains("insufficient") ||
      t.contains("request to pay") ||
      t.contains("collect request") ||
      t.contains("payment request") ||
      t.contains("available bal") ||
      t.contains("avl bal") ||
      t.contains("a/c bal") ||
      t.contains("account balance") ||
      t.contains("mini statement") ||
      t.contains("overdue") ||
      Regex("""\bemi\b""").containsMatchIn(t)
    ) {
      return false
    }

    if (t.contains("debited") && !t.contains("credited")) return false
    if ((t.contains("paid to") || t.contains("sent to") || t.contains("withdrawn")) &&
      !t.contains("credited")
    ) {
      return false
    }

    val hasMoney =
      t.contains("₹") ||
        t.contains("inr") ||
        Regex("""\brs\.?\s*\d""").containsMatchIn(t)
    if (!hasMoney) return false

    return t.contains("credited") ||
      t.contains("has been credited") ||
      t.contains("deposited") ||
      Regex("""\bcr\b""").containsMatchIn(t) ||
      (t.contains("neft") && t.contains("credit")) ||
      (t.contains("imps") && t.contains("credit")) ||
      (t.contains("upi") && t.contains("credit")) ||
      (t.contains("received from") && (t.contains("upi") || t.contains("a/c") || t.contains("account"))) ||
      (t.contains("received") && t.contains("in your") && (t.contains("a/c") || t.contains("account")))
  }

  private fun sha1(s: String): String {
    val d = MessageDigest.getInstance("SHA-1").digest(s.toByteArray(Charsets.UTF_8))
    return d.joinToString("") { "%02x".format(it) }
  }
}
