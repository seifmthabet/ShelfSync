(function (S) {
  S.utils = {
    getQueryParam: function (name) {
      return new URLSearchParams(window.location.search).get(name);
    },
    formatDate: function (iso) {
      if (!iso) return "—";
      try {
        return new Date(iso).toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
      } catch (e) {
        return iso;
      }
    },
    formatDateTime: function (iso) {
      if (!iso) return "—";
      try {
        return new Date(iso).toLocaleString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      } catch (e) {
        return iso;
      }
    },
    badgeClass: function (status) {
      var s = String(status || "").toLowerCase();
      if (s === "pending") return "badge--warn";
      if (s === "approved" || s === "active") return "badge--ok";
      if (s === "rejected" || s === "returned") return "badge--muted";
      if (s === "overdue") return "badge--danger";
      return "badge--neutral";
    },
    pathFromApiUrl: function (fullUrl) {
      if (!fullUrl) return null;
      try {
        var u = new URL(fullUrl);
        var prefix = "/api/v1/";
        var p = u.pathname;
        var i = p.indexOf(prefix);
        if (i === -1) return null;
        return p.slice(i + prefix.length) + u.search;
      } catch (e) {
        return null;
      }
    },
    listResults: function (data) {
      if (!data) return [];
      if (Array.isArray(data)) return data;
      if (Array.isArray(data.results)) return data.results;
      return [];
    },
  };
})(window.ShelfSync);
