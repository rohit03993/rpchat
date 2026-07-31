# Admin Android SMS auto-unlock

Private APK for **you only** (sideload — not Play Store). Reads bank/UPI credit SMS and posts to your server.

## Safe match (server)

1. UTR matches pending payment (UTR field or remark) + screenshot → auto-approve  
2. Else exactly **one** pending with same ₹ + screenshot → auto-approve  
3. Else 2+ same ₹ → `needs_review` (manual)  
4. Else no match / unknown pack amount → ignore  

## Test without Android first

```bash
node scripts/test-sms-match.js
```

On admin site → **Payments** → paste SMS → **Match SMS → unlock**.

API (admin Bearer token):

```http
POST /api/admin/sms-credit
{ "smsText": "Rs.130 credited ... UTR 412345678901" }
```

## Build APK (Android Studio)

1. Open folder `android-admin-sms` in Android Studio (or create new Empty Activity project and copy `app/src/main` files).
2. Set your site URL + admin login in `MainActivity` / `local.properties` (see `SmsForwarder.kt`).
3. Grant SMS permission when prompted.
4. Install on the phone that receives UPI credit SMS.

Minimal files are under `app/src/main/` — wire package name `online.rpdesichat.adminsms`.
