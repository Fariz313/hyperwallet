export function registerServiceWorker(): void {
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", () => {
    void navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("[pwa] Service worker registered:", registration.scope);

        // Check for updates on page load
        registration.addEventListener("updatefound", () => {
          const installing = registration.installing;
          if (!installing) return;

          installing.addEventListener("statechange", () => {
            if (
              installing.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              // New version available — notify user to reload
              console.log(
                "[pwa] New version available. Reload to update.",
              );
            }
          });
        });
      })
      .catch((error) => {
        console.warn("[pwa] Service worker registration failed:", error);
      });

    // Reload page when a new service worker takes over
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      window.location.reload();
    });
  });
}
