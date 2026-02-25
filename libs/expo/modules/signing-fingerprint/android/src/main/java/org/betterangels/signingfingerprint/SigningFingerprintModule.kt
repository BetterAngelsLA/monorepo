package org.betterangels.signingfingerprint

import android.content.pm.PackageManager
import android.os.Build
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.security.MessageDigest

class SigningFingerprintModule : Module() {
    override fun definition() = ModuleDefinition {
        Name("SigningFingerprint")

        Function("getFingerprint") {
            val context = appContext.reactContext ?: return@Function null
            val packageName = context.packageName

            @Suppress("DEPRECATION")
            val signatures = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                val info = context.packageManager.getPackageInfo(
                    packageName,
                    PackageManager.GET_SIGNING_CERTIFICATES
                )
                info.signingInfo?.apkContentsSigners
            } else {
                val info = context.packageManager.getPackageInfo(
                    packageName,
                    PackageManager.GET_SIGNATURES
                )
                info.signatures
            }

            val cert = signatures?.firstOrNull() ?: return@Function null
            val md = MessageDigest.getInstance("SHA-1")
            val digest = md.digest(cert.toByteArray())
            digest.joinToString("") { "%02X".format(it) }
        }
    }
}
