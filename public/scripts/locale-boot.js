(function () {
  try {
    var r = document.documentElement;
    r.lang = "he";
    r.dir = "rtl";
    r.classList.add("locale-he");
    try {
      localStorage.removeItem("ats-locale");
    } catch (_) {}
  } catch (_) {}
})();