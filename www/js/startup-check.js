/**
 * Zwykły (nie modułowy) skrypt startowy: działa także przy otwarciu index.html
 * prosto z dysku (file://), gdzie przeglądarka blokuje moduły ES i fetch,
 * więc main.js w ogóle się nie uruchamia i nie może pokazać komunikatu.
 *
 * Tłumaczenia (locales/*.json) też są wtedy niedostępne, dlatego komunikat jest
 * tu zapisany wprost, w obu językach naraz (wyjątek od zasady „teksty przez i18n”,
 * tak jak komunikat awaryjny w main.js).
 */
(function () {
  if (window.location.protocol !== 'file:') {
    return;
  }

  var container = document.getElementById('app');

  if (!container) {
    return;
  }

  var pl = document.createElement('p');
  pl.textContent =
    'Aplikację trzeba otworzyć przez serwer (adres strony, np. http://127.0.0.1:5500/www/index.html), a nie z pliku na dysku.';

  var en = document.createElement('p');
  en.lang = 'en';
  en.textContent =
    'This app must be opened through a web server (a page address), not as a file from disk.';

  container.replaceChildren(pl, en);
})();
