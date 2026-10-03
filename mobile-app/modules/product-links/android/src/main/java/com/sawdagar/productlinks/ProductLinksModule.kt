package com.sawdagar.productlinks

import android.os.Handler
import android.os.Looper
import com.android.installreferrer.api.InstallReferrerClient
import com.android.installreferrer.api.InstallReferrerStateListener
import com.facebook.react.bridge.*

class ProductLinksModule(context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
    override fun getName() = "SawdagarProductLinks"

    @ReactMethod
    fun getInstallReferrer(promise: Promise) {
        // Referrer retrieval never blocks navigation indefinitely. A temporary
        // service failure can be retried next launch; successful reads are
        // acknowledged in JS only after validation and navigation handoff.
        val handler = Handler(Looper.getMainLooper())
        handler.post {
            val client = InstallReferrerClient.newBuilder(reactApplicationContext).build()
            var finished = false
            lateinit var timeout: Runnable
            fun finish(value: String?) {
                if (finished) return
                finished = true
                handler.removeCallbacks(timeout)
                try { client.endConnection() } catch (_: Exception) { }
                promise.resolve(value)
            }
            timeout = Runnable { finish(null) }
            handler.postDelayed(timeout, 2500)
            try {
                client.startConnection(object : InstallReferrerStateListener {
                    override fun onInstallReferrerSetupFinished(code: Int) {
                        handler.post {
                            if (finished) return@post
                            if (code == InstallReferrerClient.InstallReferrerResponse.OK) {
                                try { finish(client.installReferrer.installReferrer) }
                                catch (_: Exception) { finish(null) }
                            } else { finish(null) }
                        }
                    }
                    override fun onInstallReferrerServiceDisconnected() {
                        handler.post { finish(null) }
                    }
                })
            } catch (_: Exception) { finish(null) }
        }
    }
}
