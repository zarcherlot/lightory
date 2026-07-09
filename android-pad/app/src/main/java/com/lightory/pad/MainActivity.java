package com.lightory.pad;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;

public final class MainActivity extends Activity {
    private WebView webView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        webView = new WebView(this);
        configureWebView(webView);
        setContentView(webView);
        webView.loadUrl("file:///android_asset/www/index.html");
    }

    @SuppressLint("SetJavaScriptEnabled")
    private void configureWebView(WebView view) {
        if (BuildConfig.DEBUG) {
            WebView.setWebContentsDebuggingEnabled(true);
        }
        WebSettings settings = view.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(false);
        settings.setAllowFileAccessFromFileURLs(false);
        settings.setAllowUniversalAccessFromFileURLs(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        view.addJavascriptInterface(new LightoryBridge(), "LightoryAndroid");
    }

    @Override
    protected void onResume() {
        super.onResume();
        postLifecycle("resume");
    }

    @Override
    protected void onPause() {
        postLifecycle("pause");
        super.onPause();
    }

    @Override
    protected void onDestroy() {
        postLifecycle("destroy");
        if (webView != null) {
            webView.destroy();
            webView = null;
        }
        super.onDestroy();
    }

    private void postLifecycle(String event) {
        if (webView == null) return;
        webView.evaluateJavascript(
            "window.dispatchEvent(new CustomEvent('lightory:android-lifecycle',{detail:{event:'"
                + event
                + "'}}));",
            null
        );
    }

    public static final class LightoryBridge {
        @JavascriptInterface
        public String getAppInfo() {
            return "{\"platform\":\"android\",\"client\":\"lightory-pad\",\"version\":\"0.1.0\"}";
        }
    }
}
