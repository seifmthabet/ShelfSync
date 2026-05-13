(function (S) {
  var container = null;

  function ensureContainer() {
    if (container) return container;
    container = document.createElement("div");
    container.className = "toast-stack";
    document.body.appendChild(container);
    return container;
  }

  S.toast = function (message, variant) {
    variant = variant || "info";
    var wrap = ensureContainer();
    var el = document.createElement("div");
    el.className = "toast toast--" + variant;
    el.textContent = message;
    wrap.appendChild(el);
    requestAnimationFrame(function () {
      el.classList.add("toast--show");
    });
    setTimeout(function () {
      el.classList.remove("toast--show");
      setTimeout(function () {
        el.remove();
      }, 300);
    }, 4200);
  };
})(window.ShelfSync);
