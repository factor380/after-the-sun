(function () {
  try {
    var r = document.documentElement;
    r.lang = "he";
    r.dir = "rtl";
    r.classList.add("locale-he");
    try {
      localStorage.removeItem("ats-locale");
    } catch (_) {}

    var stored = null;
    try {
      stored = localStorage.getItem("ats-theme");
    } catch (_) {}
    var dark =
      stored === "dark" ||
      (stored !== "light" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    r.classList.toggle("dark", dark);
    r.style.colorScheme = dark ? "dark" : "light";
  } catch (_) {}
})();