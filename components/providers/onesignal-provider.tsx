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
              notifyButton: { enable: false },
            });

            // Persist player ID whenever subscription state changes
            // (covers new opt-ins and token refreshes)
            OneSignal.User.PushSubscription.addEventListener("change", async function(event) {
              var id = event.current && event.current.id;
              var optedIn = event.current && event.current.optedIn;
              if (id && optedIn) {
                fetch("/api/user/player-id", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ player_id: id }),
                }).catch(function() {});
              }
            });
          });
        `}
      </Script>
    </>
  );
}
