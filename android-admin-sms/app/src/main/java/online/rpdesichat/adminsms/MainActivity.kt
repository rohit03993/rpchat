package online.rpdesichat.adminsms

import android.Manifest
import android.annotation.SuppressLint
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.view.View
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Button
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.google.android.material.textfield.TextInputEditText
import org.json.JSONObject
import java.util.concurrent.Executors

/**
 * Full admin experience = mobile /admin.html inside WebView.
 * Plus native SMS credit forward + alert notifications.
 */
class MainActivity : AppCompatActivity() {
  private val io = Executors.newSingleThreadExecutor()

  private lateinit var web: WebView
  private lateinit var loginPanel: ScrollView
  private lateinit var listenBar: LinearLayout
  private lateinit var status: TextView
  private lateinit var listenLabel: TextView
  private var tokenInjected = false

  @SuppressLint("SetJavaScriptEnabled")
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    setContentView(R.layout.activity_main)
    Notify.ensureChannels(this)

    web = findViewById(R.id.adminWeb)
    loginPanel = findViewById(R.id.loginPanel)
    listenBar = findViewById(R.id.listenBar)
    status = findViewById(R.id.status)
    listenLabel = findViewById(R.id.listenLabel)

    val baseUrl = findViewById<TextInputEditText>(R.id.baseUrl)
    val adminId = findViewById<TextInputEditText>(R.id.adminId)
    val adminPass = findViewById<TextInputEditText>(R.id.adminPass)
    val loginBtn = findViewById<Button>(R.id.loginBtn)
    val logoutBtn = findViewById<Button>(R.id.logoutBtn)

    baseUrl.setText(Prefs.baseUrl(this))
    adminId.setText(Prefs.adminId(this))

    setupWebView()

    loginBtn.setOnClickListener {
      requestPerms()
      val url = baseUrl.text?.toString()?.trim().orEmpty()
      val id = adminId.text?.toString()?.trim().orEmpty()
      val pass = adminPass.text?.toString()?.trim().orEmpty()
      if (url.isBlank() || id.isBlank() || pass.isBlank()) {
        Toast.makeText(this, "Fill URL, admin ID, password", Toast.LENGTH_SHORT).show()
        return@setOnClickListener
      }
      status.text = "Logging in…"
      io.execute {
        try {
          val res = ApiClient.adminLogin(url, id, pass)
          val json = runCatching { JSONObject(res.body) }.getOrNull()
          val token = json?.optString("token").orEmpty()
          runOnUiThread {
            if (!res.ok || token.isBlank()) {
              status.text = "Login failed (${res.code})"
              return@runOnUiThread
            }
            Prefs.saveLogin(this, url, token, id)
            Prefs.setAlertSince(this, System.currentTimeMillis())
            AlertPollService.start(this)
            openAdminWeb(forceReload = true)
            Toast.makeText(this, "Full admin + SMS alerts on", Toast.LENGTH_SHORT).show()
          }
        } catch (e: Exception) {
          runOnUiThread { status.text = e.message ?: "Login error" }
        }
      }
    }

    logoutBtn.setOnClickListener {
      Prefs.saveLogin(this, Prefs.baseUrl(this), "", Prefs.adminId(this))
      tokenInjected = false
      showLogin()
      Toast.makeText(this, "Logged out", Toast.LENGTH_SHORT).show()
    }

    onBackPressedDispatcher.addCallback(
      this,
      object : OnBackPressedCallback(true) {
        override fun handleOnBackPressed() {
          if (web.visibility == View.VISIBLE && web.canGoBack()) {
            web.goBack()
          } else {
            isEnabled = false
            onBackPressedDispatcher.onBackPressed()
          }
        }
      }
    )

    if (Prefs.isLoggedIn(this)) {
      requestPerms()
      AlertPollService.start(this)
      openAdminWeb(forceReload = false)
    } else {
      showLogin()
    }
  }

  @SuppressLint("SetJavaScriptEnabled")
  private fun setupWebView() {
    val s: WebSettings = web.settings
    s.javaScriptEnabled = true
    s.domStorageEnabled = true
    s.databaseEnabled = true
    s.loadWithOverviewMode = true
    s.useWideViewPort = true
    s.builtInZoomControls = false
    s.displayZoomControls = false
    s.mixedContentMode = WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE
    web.webChromeClient = WebChromeClient()
    web.webViewClient = object : WebViewClient() {
      override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
        return false
      }

      override fun onPageFinished(view: WebView, url: String) {
        injectAdminToken()
      }
    }
  }

  private fun injectAdminToken() {
    val token = Prefs.token(this)
    if (token.isBlank()) return
    // admin.js boots from localStorage.adminToken — set then reload once per WebView session
    val js =
      "(function(){try{" +
        "localStorage.setItem('adminToken'," + JSONObject.quote(token) + ");" +
        "if(sessionStorage.getItem('desiAdminTok')==='1')return;" +
        "sessionStorage.setItem('desiAdminTok','1');" +
        "location.reload();" +
        "}catch(e){}})();"
    web.evaluateJavascript(js, null)
    tokenInjected = true
  }

  private fun openAdminWeb(forceReload: Boolean) {
    loginPanel.visibility = View.GONE
    web.visibility = View.VISIBLE
    listenBar.visibility = View.VISIBLE
    listenLabel.text = "SMS unlock + alerts on · full admin below"
    val url = Prefs.baseUrl(this) + "/admin.html"
    if (forceReload || web.url.isNullOrBlank()) {
      tokenInjected = false
      web.loadUrl(url)
    } else {
      injectAdminToken()
    }
  }

  private fun showLogin() {
    web.visibility = View.GONE
    listenBar.visibility = View.GONE
    loginPanel.visibility = View.VISIBLE
    status.text = "Login to open full admin on this phone"
  }

  private fun requestPerms() {
    val need = mutableListOf(
      Manifest.permission.RECEIVE_SMS,
      Manifest.permission.READ_SMS
    )
    if (Build.VERSION.SDK_INT >= 33) {
      need += Manifest.permission.POST_NOTIFICATIONS
    }
    val missing = need.filter {
      ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
    }
    if (missing.isNotEmpty()) {
      ActivityCompat.requestPermissions(this, missing.toTypedArray(), 42)
    }
  }
}
