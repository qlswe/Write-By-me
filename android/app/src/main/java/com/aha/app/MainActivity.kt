package com.aha.app

import android.annotation.SuppressLint
import android.graphics.Bitmap
import android.net.Uri
import android.os.Bundle
import android.os.Message
import android.view.View
import android.view.ViewGroup
import android.webkit.*
import android.widget.FrameLayout
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import com.aha.app.Companion.APP_URL
import com.aha.app.databinding.ActivityMainBinding

class MainActivity : AppCompatActivity() {
    private lateinit var binding: ActivityMainBinding
    private var popupWebView: WebView? = null
    private val chromeUserAgent = "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Mobile Safari/537.36"

    // Callback для передачи выбранных файлов обратно в WebView
    private var filePathCallback: ValueCallback<Array<Uri>>? = null

    // Лаунчер для выбора файлов
    private val filePickerLauncher = registerForActivityResult(ActivityResultContracts.GetMultipleContents()) { uris ->
        filePathCallback?.onReceiveValue(uris.toTypedArray())
        filePathCallback = null
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupWebView()

        if (savedInstanceState != null) {
            binding.webView.restoreState(savedInstanceState)
        } else {
            binding.webView.loadUrl(APP_URL)
        }

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (popupWebView != null) {
                    closePopup()
                } else if (binding.webView.canGoBack()) {
                    binding.webView.goBack()
                } else {
                    isEnabled = false
                    onBackPressedDispatcher.onBackPressed()
                }
            }
        })
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        val cookieManager = CookieManager.getInstance()
        cookieManager.setAcceptCookie(true)
        cookieManager.setAcceptThirdPartyCookies(binding.webView, true)

        binding.webView.apply {
            setLayerType(View.LAYER_TYPE_HARDWARE, null)

            webViewClient = object : WebViewClient() {
                override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                    return false
                }

                override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                    super.onPageStarted(view, url, favicon)
                    view?.alpha = 0f
                }

                override fun onPageFinished(view: WebView?, url: String?) {
                    super.onPageFinished(view, url)
                    view?.animate()?.alpha(1f)?.duration = 300
                    CookieManager.getInstance().flush()
                }
            }

            webChromeClient = object : WebChromeClient() {
                // Обработка выбора файлов (изображений)
                override fun onShowFileChooser(
                    webView: WebView?,
                    filePathCallback: ValueCallback<Array<Uri>>?,
                    fileChooserParams: FileChooserParams?
                ): Boolean {
                    this@MainActivity.filePathCallback?.onReceiveValue(null)
                    this@MainActivity.filePathCallback = filePathCallback

                    // Запускаем выбор только изображений.
                    // Если нужны любые файлы, замените на "*/*"
                    filePickerLauncher.launch("image/*")
                    return true
                }

                override fun onCreateWindow(view: WebView?, isDialog: Boolean, isUserGesture: Boolean, resultMsg: Message?): Boolean {
                    popupWebView = WebView(this@MainActivity).apply {
                        layoutParams = FrameLayout.LayoutParams(
                            ViewGroup.LayoutParams.MATCH_PARENT,
                            ViewGroup.LayoutParams.MATCH_PARENT
                        )
                        settings.javaScriptEnabled = true
                        settings.domStorageEnabled = true
                        settings.userAgentString = chromeUserAgent

                        webViewClient = WebViewClient()
                        webChromeClient = object : WebChromeClient() {
                            override fun onCloseWindow(window: WebView?) { closePopup() }

                            // Также добавляем поддержку файлов для попапов, если нужно
                            override fun onShowFileChooser(
                                webView: WebView?,
                                filePathCallback: ValueCallback<Array<Uri>>?,
                                fileChooserParams: FileChooserParams?
                            ): Boolean {
                                this@MainActivity.filePathCallback?.onReceiveValue(null)
                                this@MainActivity.filePathCallback = filePathCallback
                                filePickerLauncher.launch("image/*")
                                return true
                            }
                        }
                    }
                    binding.root.addView(popupWebView)
                    val transport = resultMsg?.obj as WebView.WebViewTransport
                    transport.webView = popupWebView
                    resultMsg.sendToTarget()
                    return true
                }

                override fun onCloseWindow(window: WebView?) { closePopup() }
            }

            settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true
                databaseEnabled = true

                // --- ОПТИМИЗАЦИЯ СКОРОСТИ ---
                cacheMode = WebSettings.LOAD_DEFAULT
                android.os.Process.setThreadPriority(android.os.Process.THREAD_PRIORITY_URGENT_DISPLAY)
                offscreenPreRaster = true

                // --- ГРАФИКА ---
                loadsImagesAutomatically = true
                blockNetworkImage = false

                // --- ПОВЕДЕНИЕ ---
                mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
                userAgentString = chromeUserAgent
                setSupportMultipleWindows(true)
                javaScriptCanOpenWindowsAutomatically = true
                loadWithOverviewMode = true
                useWideViewPort = true

                // Разрешаем чтение файлов (может понадобиться для некоторых типов загрузок)
                allowFileAccess = true
                allowContentAccess = true
            }
        }
    }

    private fun closePopup() {
        binding.root.removeView(popupWebView)
        popupWebView?.destroy()
        popupWebView = null
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        binding.webView.saveState(outState)
    }

    override fun onRestoreInstanceState(savedInstanceState: Bundle) {
        super.onRestoreInstanceState(savedInstanceState)
        binding.webView.restoreState(savedInstanceState)
    }
}