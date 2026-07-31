package online.rpdesichat.adminsms

import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.util.concurrent.TimeUnit

object ApiClient {
  private val http = OkHttpClient.Builder()
    .connectTimeout(20, TimeUnit.SECONDS)
    .readTimeout(30, TimeUnit.SECONDS)
    .build()

  private val json = "application/json; charset=utf-8".toMediaType()

  data class Result(val ok: Boolean, val code: Int, val body: String)

  fun adminLogin(baseUrl: String, adminId: String, password: String): Result {
    val payload = JSONObject()
      .put("adminId", adminId)
      .put("password", password)
      .toString()
      .toRequestBody(json)
    val req = Request.Builder()
      .url("${baseUrl.trimEnd('/')}/api/auth/admin-login")
      .post(payload)
      .build()
    return execute(req)
  }

  fun postSmsCredit(baseUrl: String, token: String, smsText: String): Result {
    val payload = JSONObject().put("smsText", smsText).toString().toRequestBody(json)
    val req = Request.Builder()
      .url("${baseUrl.trimEnd('/')}/api/admin/sms-credit")
      .addHeader("Authorization", "Bearer $token")
      .post(payload)
      .build()
    return execute(req)
  }

  fun getAlerts(baseUrl: String, token: String, since: Long): Result {
    val req = Request.Builder()
      .url("${baseUrl.trimEnd('/')}/api/admin/alerts?since=$since")
      .addHeader("Authorization", "Bearer $token")
      .get()
      .build()
    return execute(req)
  }

  private fun execute(req: Request): Result {
    http.newCall(req).execute().use { res ->
      val body = res.body?.string().orEmpty()
      return Result(res.isSuccessful, res.code, body)
    }
  }
}
