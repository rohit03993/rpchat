# DesiChat Admin — full admin on your phone

Private sideload APK (**not** Play Store).

## What you get

1. **Full admin** — same as `admin.html` (Users, Payments, Support, AI reports, Pay setup) inside the app  
2. **SMS auto-unlock** — credit SMS → `/api/admin/sms-credit`  
3. **Notifications** — new users, payments, support, SMS auto-approves  

Open the app → login once → use admin like the website, while SMS + alerts run in the background.

## Server APIs

```http
POST /api/auth/admin-login
GET  /api/admin/alerts?since=<ms>
POST /api/admin/sms-credit
```

Deploy latest `main` on VPS first.

## Build

1. Android Studio → **Open** folder `android-admin-sms`  
2. Gradle sync → Run on phone (USB debugging) or **Build APK**  
3. Install on the phone that receives **UPI/bank credit SMS**

## First run

1. Allow **SMS** + **Notifications**  
2. Site URL `https://rpdesichat.online`  
3. Admin ID + password  
4. **Open full admin**  
5. Use Users / Payments / Support as usual  
6. Keep app installed — strip at bottom = SMS + alerts listening  

## Notes

- Admin UI is the real mobile admin site (WebView) — all features work  
- SMS matching still uses safe rules (unique pay-intent / screenshot / UTR)  
- After reboot, alerts restart if you were logged in  
