/**
 * Funkcje aplikacji na Androida (Capacitor) z bezpiecznym zachowaniem w przeglądarce.
 *
 * W APK Capacitor wstrzykuje do WebView mostek natywny (window.Capacitor z
 * nativePromise i PluginHeaders), ale obiekty wtyczek tworzy dopiero
 * registerPlugin() z @capacitor/core. Bez bundlera bierzemy go z jednego pliku
 * vendor/native-bridge.js (kopia @capacitor/core, tools/update-native-bridge.mjs).
 *
 * W przeglądarce isNative() zwraca false i wszystko jest no-op albo używa API
 * przeglądarki (navigator.vibrate). Wywołania natywne nigdy nie rzucają wyjątków
 * do gry: błąd wtyczki kończy się cichym powrotem do wersji webowej.
 */
import { Capacitor, registerPlugin } from '../vendor/native-bridge.js';

const native = (() => {
  try {
    return Capacitor.isNativePlatform();
  } catch (error) {
    return false;
  }
})();

/** Wtyczki rejestrujemy tylko w aplikacji (w przeglądarce nie ma ich implementacji). */
const App = native ? registerPlugin('App') : null;
const Haptics = native ? registerPlugin('Haptics') : null;
const KeepAwake = native ? registerPlugin('KeepAwake') : null;

/** @returns {boolean} true w aplikacji na Androida (Capacitor), false w przeglądarce */
export function isNative() {
  return native;
}

/**
 * Podpina systemowy przycisk / gest „wstecz” Androida.
 * Gdy listener jest podpięty, Capacitor nie cofa WebView sam — decyduje handler.
 * @param {() => boolean} handler — zwraca false, gdy nie ma dokąd wrócić
 *   (ekran główny): wtedy aplikacja się zamyka
 */
export function onSystemBack(handler) {
  if (!App) {
    return;
  }
  App.addListener('backButton', () => {
    let handled = true;
    try {
      handled = handler();
    } catch (error) {
      console.error('[native] Błąd obsługi „wstecz”:', error);
    }
    if (!handled) {
      App.exitApp().catch(() => {});
    }
  }).catch((error) => console.warn('[native] Brak wtyczki App:', error));
}

/**
 * Wibracja: w aplikacji przez @capacitor/haptics, w przeglądarce navigator.vibrate.
 * @param {number} durationMs
 */
export function vibrate(durationMs) {
  if (Haptics) {
    Haptics.vibrate({ duration: durationMs }).catch(() => vibrateWeb(durationMs));
    return;
  }
  vibrateWeb(durationMs);
}

function vibrateWeb(durationMs) {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(durationMs);
    }
  } catch (error) {
    // brak wibracji nie przeszkadza w grze
  }
}

/**
 * Natywna blokada wygaszania ekranu (FLAG_KEEP_SCREEN_ON przez
 * @capacitor-community/keep-awake). Używana przez core/wake-lock.js.
 * @param {boolean} on
 * @returns {Promise<boolean>} true, gdy wywołanie natywne się udało
 */
export async function setNativeKeepAwake(on) {
  if (!KeepAwake) {
    return false;
  }
  try {
    await (on ? KeepAwake.keepAwake() : KeepAwake.allowSleep());
    return true;
  } catch (error) {
    console.warn('[native] KeepAwake niedostępne:', error);
    return false;
  }
}
