package vn.finora.app;

import android.app.Notification;
import android.content.Intent;
import android.os.Bundle;
import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;
import android.util.Log;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * TÍCH SẢN — BANK NOTIFICATION LISTENER SERVICE
 *
 * Requirements:
 * - Explicit user opt-in required.
 * - Filters strictly for recognized Vietnamese banking applications.
 * - Extracts amount, currency, direction (OUT), and reference ID on-device.
 * - Does not store or forward unrelated personal notifications.
 */
public class BankNotificationListenerService extends NotificationListenerService {

    private static final String TAG = "BankNotifListener";

    // Supported banking package identifiers
    private static final Set<String> SUPPORTED_BANK_PACKAGES = new HashSet<>(Arrays.asList(
        "com.vcbmobile",                // Vietcombank
        "com.mbmobile",                 // MBBank
        "vn.com.techcombank.bb.app",    // Techcombank
        "com.vietinbank.ipay",          // VietinBank
        "com.vnpay.bidv",               // BIDV
        "com.vnpay.vpbankonline",       // VPBank
        "com.tpb.mb.gprsandroid",       // TPBank
        "mobile.acb.com.vn",            // ACB
        "com.vnpay.sacombank",          // Sacombank
        "com.vib.myvib2",               // VIB
        "com.mservice.momotransfer",    // MoMo
        "vn.com.vng.zalopay",           // ZaloPay
        "xyz.be.cake",                  // Cake by VPBank
        "com.timo.bank"                 // Timo
    ));

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        if (sbn == null) return;

        String packageName = sbn.getPackageName();
        if (packageName == null || !SUPPORTED_BANK_PACKAGES.contains(packageName)) {
            // Ignore non-banking notifications immediately
            return;
        }

        Notification notification = sbn.getNotification();
        if (notification == null) return;

        Bundle extras = notification.extras;
        if (extras == null) return;

        CharSequence titleChar = extras.getCharSequence(Notification.EXTRA_TITLE);
        CharSequence textChar = extras.getCharSequence(Notification.EXTRA_TEXT);
        CharSequence bigTextChar = extras.getCharSequence(Notification.EXTRA_BIG_TEXT);

        String title = titleChar != null ? titleChar.toString() : "";
        String text = bigTextChar != null ? bigTextChar.toString() : (textChar != null ? textChar.toString() : "");
        String combined = (title + " " + text).trim();

        if (combined.isEmpty()) return;

        // On-device parsing for debit / expense transaction
        boolean isDebit = combined.contains("-") ||
                combined.toLowerCase().contains("trừ") ||
                combined.toLowerCase().contains("thanh toán") ||
                combined.toLowerCase().contains("chuyển khoản");

        if (!isDebit) {
            // Only care about debit (expense) transactions for payment matching
            return;
        }

        // Extract amount using regex
        Pattern pattern = Pattern.compile("(?:[-+]|\\b)(?:[0-9]{1,3}[.,]){1,4}[0-9]{3}");
        Matcher matcher = pattern.matcher(combined);
        long amount = 0;
        if (matcher.find()) {
            String clean = matcher.group().replaceAll("[^0-9]", "");
            try {
                amount = Long.parseLong(clean);
            } catch (NumberFormatException ignored) {}
        }

        if (amount <= 0) return;

        Log.i(TAG, "Recognized bank debit: " + packageName + ", amount=" + amount);

        // Broadcast to WebView or MainActivity
        Intent intent = new Intent("vn.finora.app.BANK_TRANSACTION_EVENT");
        intent.putExtra("packageName", packageName);
        intent.putExtra("amount", amount);
        intent.putExtra("direction", "OUT");
        intent.putExtra("timestamp", System.currentTimeMillis());
        sendBroadcast(intent);
    }

    @Override
    public void onNotificationRemoved(StatusBarNotification sbn) {
        // No-op
    }
}
