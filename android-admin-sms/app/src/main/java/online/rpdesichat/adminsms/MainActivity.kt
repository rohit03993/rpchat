package online.rpdesichat.adminsms

import android.Manifest
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Bundle
import android.provider.Telephony
import android.widget.Button
import android.widget.EditText
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.util.concurrent.Executors

/**
 * Sideload admin helper: paste API base + admin token, listen for credit SMS.
 * Build with Android Studio; add OkHttp dependency.
 */
class MainActivity : AppCompatActivity() {
  private val http = OkHttpClient()
  private val io = Executors.newSingleThreadExecutor()

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    setContentView(R.layout.activity_main)

    val baseUrl = findViewById<EditText>(R.id.baseUrl)
    val token = findViewById<EditText>(R.id.adminToken)
    val status = findViewById<TextView>(R.id.status)
    val saveBtn = findViewById<Button>(R.id.saveBtn)
    val testBtn = findViewById<Button>(R.id.testBtn)

    val prefs = getSharedPreferences("adminsms", MODE_PRIVATE)
    baseUrl.setText(prefs.getString("baseUrl", "https://rpdesichat.online"))
    token.setText(prefs.getString("token", ""))

    saveBtn.setOnClickListener {
      prefs.edit()
        .putString("baseUrl", baseUrl.text.toString().trim().trimEnd('/'))
        .putString("token", token.text.toString().trim())
        .apply()
      Toast.makeText(this, "Saved", Toast.LENGTH_SHORT).show()
      ensureSmsPermission()
    }

    testBtn.setOnClickListener {
      val sample =
        "Dear Customer, Rs.130.00 credited to A/c XX1234 via UPI. UTR 412345678901."
      postSms(sample) { msg -> runOnUiThread { status.text = msg } }
    }

    ensureSmsPermission()
  }

  private fun ensureSmsPermission() {
    if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECEIVE_SMS)
      != PackageManager.PERMISSION_GRANTED
    ) {
      ActivityCompat.requestPermissions(
        this,
        arrayOf(Manifest.permission.RECEIVE_SMS, Manifest.permission.READ_SMS),
        42
      )
    }
  }

  fun postSms(smsText: String, done: (String) -> Unit) {
    val prefs = getSharedPreferences("adminsms", MODE_PRIVATE)
    val base = prefs.getString("baseUrl", "") ?: ""
    val tok = prefs.getString("token", "") ?: ""
    if (base.isBlank() || tok.isBlank()) {
      done("Set base URL + admin token first")
      return
    }
    io.execute {
      try {
        val body =
          JSONObject().put("smsText", smsText).toString()
            .toRequestBody("application/json".toMediaType())
        val req = Request.Builder()
          .url("$base/api/admin/sms-credit")
          .addHeader("Authorization", "Bearer $tok")
          .post(body)
          .build()
        http.newCall(req).execute().use { res ->
          val text = res.body?.string() ?: ""
          done("HTTP ${res.code}: $text")
        }
      } catch (e: Exception) {
        done("Error: ${e.message}")
      }
    }
  }
}

class SmsReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    if (Telephony.Sms.Intents.SMS_RECEIVED_ACTION != intent.action) return
    val msgs = Telephony.Sms.Intents.getMessagesFromIntent(intent) ?: return
    val body = msgs.joinToString("") { it.displayMessageBody ?: "" }
    if (!body.contains(Regex("credited|INR|Rs\\.?|₹|UPI", RegexOption.IGNORE_CASE))) return

    // Reuse MainActivity helper via application context prefs + OkHttp
    val prefs = context.getSharedPreferences("adminsms", Context.MODE_PRIVATE)
    val base = prefs.getString("baseUrl", "") ?: return
    val tok = prefs.getString("token", "") ?: return
    if (base.isBlank() || tok.isBlank()) return

    Thread {
      try {
        val client = OkHttpClient()
        val json = JSONObject().put("smsText", body).toString()
          .toRequestBody("application/json".toMediaType())
        val req = Request.Builder()
          .url("${base.trimEnd('/')}/api/admin/sms-credit")
          .addHeader("Authorization", "Bearer $tok")
          .post(json)
          .build()
        client.newCall(req).execute().close()
      } catch (_: Exception) {
      }
    }.start()
  }
}
