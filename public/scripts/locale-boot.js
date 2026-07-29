(function () {
  try {
    var l = localStorage.getItem("ats-locale");
    if (l === "he") {
      var r = document.documentElement;
      r.lang = "he";
      r.dir = "rtl";
      r.classList.add("locale-he");
    }
  } catch (e) {}
})();
