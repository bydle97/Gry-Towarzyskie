/**
 * Blokada wygaszania ekranu (Screen Wake Lock API) — wspólna dla gier.
 *
 * requestWakeLock() zapamiętuje, że gra chce blokady, i prosi o nią przeglądarkę.
 * releaseWakeLock() zwalnia blokadę i kasuje to życzenie.
 *
 * Przeglądarka sama zdejmuje blokadę, gdy strona przestaje być widoczna (inna
 * karta, wygaszony ekran). Dopóki gra chce blokady, moduł nasłuchuje
 * visibilitychange i odnawia ją po powrocie; nasłuch znika w releaseWakeLock(),
 * więc po unmount() gry nic nie zostaje.
 *
 * Brak API (starsze przeglądarki, część WebView) i odmowa przeglądarki są
 * obsługiwane po cichu — gra działa dalej, tylko ekran może się wygasić.
 */

/** @type {WakeLockSentinel | null} */
let sentinel = null;

/** Czy któraś gra chce teraz blokady. */
let wanted = false;

let listening = false;

/** @returns {boolean} czy przeglądarka udostępnia Screen Wake Lock API */
function isSupported() {
  return (
    typeof navigator !== 'undefined' &&
    'wakeLock' in navigator &&
    navigator.wakeLock !== null &&
    typeof navigator.wakeLock?.request === 'function'
  );
}

/** Zwalnia blokadę bez rzucania wyjątków (release() bywa obietnicą). */
function releaseSentinel(lock) {
  try {
    const result = lock.release();

    if (result && typeof result.catch === 'function') {
      result.catch(() => {});
    }
  } catch (error) {
    // nie udało się zwolnić od razu — przeglądarka zwolni blokadę sama
  }
}

function handleVisibilityChange() {
  if (wanted && !sentinel && document.visibilityState === 'visible') {
    void requestWakeLock();
  }
}

function startListening() {
  if (!listening && typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', handleVisibilityChange);
    listening = true;
  }
}

function stopListening() {
  if (listening) {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    listening = false;
  }
}

/**
 * Prosi o blokadę wygaszania ekranu. Można wołać wielokrotnie (idempotentne).
 * @returns {Promise<boolean>} true, gdy blokada jest aktywna
 */
export async function requestWakeLock() {
  wanted = true;
  startListening();

  if (sentinel) {
    return true;
  }
  if (!isSupported() || document.visibilityState !== 'visible') {
    // Ukryta strona nie dostanie blokady — odnowimy ją po powrocie (visibilitychange).
    return false;
  }

  try {
    const lock = await navigator.wakeLock.request('screen');

    // W międzyczasie gra mogła zwolnić blokadę albo inna prośba już ją dostała.
    if (!wanted || sentinel) {
      releaseSentinel(lock);
      return Boolean(sentinel) && wanted;
    }

    sentinel = lock;

    if (typeof lock.addEventListener === 'function') {
      lock.addEventListener('release', () => {
        if (sentinel === lock) {
          sentinel = null;
        }
      });
    }

    return true;
  } catch (error) {
    return false;
  }
}

/** Zwalnia blokadę i przestaje ją odnawiać (wołać przy pauzie, końcu gry i w unmount()). */
export function releaseWakeLock() {
  wanted = false;
  stopListening();

  const lock = sentinel;
  sentinel = null;

  if (lock) {
    releaseSentinel(lock);
  }
}
