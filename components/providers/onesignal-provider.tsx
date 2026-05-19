"use client";

import Script from "next/script";

export default function OneSignalProvider() {
  return (
    <>
      <Script
        src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"
        strategy="afterInteractive"
      />

      <Script id="onesignal-init" strategy="afterInteractive">
        {`
          window.OneSignalDeferred = window.OneSignalDeferred || [];

          OneSignalDeferred.push(async function(OneSignal) {
            await OneSignal.init({
              appId: "f3dc3a6d-ab0c-4e0e-b6f0-befd6b32b0a6",
              notifyButton: {
                enable: false,
              },
            });

            console.log("OneSignal initialized");
          });
        `}
      </Script>
    </>
  );
}