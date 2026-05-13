(function (S) {
  var TIMEOUT_MS = 20000;

  function joinUrl(path) {
    var base = S.API_BASE.replace(/\/?$/, "/");
    var p = String(path || "").replace(/^\//, "");
    return base + p;
  }

  function buildUrl(path, query) {
    var url = new URL(joinUrl(path));
    if (query && typeof query === "object") {
      Object.keys(query).forEach(function (k) {
        var v = query[k];
        if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
      });
    }
    return url.toString();
  }

  function formatError(body) {
    if (typeof body !== "object" || body === null) return null;
    if (typeof body.detail === "string") return body.detail;
    if (Array.isArray(body.detail)) return body.detail.map(String).join(", ");
    var keys = Object.keys(body);
    if (keys.length) {
      var first = keys[0];
      var val = body[first];
      if (Array.isArray(val) && val.length) return first + ": " + val[0];
      if (typeof val === "string") return first + ": " + val;
    }
    return null;
  }

  function parseJson(res) {
    var ct = res.headers.get("content-type") || "";
    if (ct.indexOf("application/json") !== -1) return res.json();
    return res.text();
  }

  function withTimeout(promise) {
    return new Promise(function (resolve, reject) {
      var t = setTimeout(function () {
        reject(new Error("Request timed out"));
      }, TIMEOUT_MS);
      promise.then(
        function (v) {
          clearTimeout(t);
          resolve(v);
        },
        function (e) {
          clearTimeout(t);
          reject(e);
        }
      );
    });
  }

  function refreshAccessToken() {
    var refresh = S.storage.getRefreshToken();
    if (!refresh) return Promise.resolve(false);
    return fetch(buildUrl("auth/token/refresh/"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: refresh }),
    }).then(function (res) {
      if (!res.ok) return false;
      return res.json().then(function (data) {
        if (!data || !data.access) return false;
        S.storage.setAccessToken(data.access);
        if (data.refresh) S.storage.setRefreshToken(data.refresh);
        return true;
      });
    });
  }

  S.request = function (path, opts) {
    opts = opts || {};
    var method = opts.method || "GET";
    var body = opts.body;
    var query = opts.query;
    var auth = opts.auth !== false;

    function doFetch() {
      var token = S.storage.getAccessToken();
      var h = { "Content-Type": "application/json" };
      if (auth && token) h.Authorization = "Bearer " + token;
      return withTimeout(
        fetch(buildUrl(path, query), {
          method: method,
          headers: h,
          body: body !== undefined ? JSON.stringify(body) : undefined,
        })
      );
    }

    return doFetch()
      .then(function (res) {
        return parseJson(res).then(function (data) {
          return { res: res, data: data };
        });
      })
      .then(function (pair) {
        if (pair.res.status === 401 && auth) {
          return refreshAccessToken().then(function (ok) {
            if (!ok) return pair;
            return doFetch().then(function (res2) {
              return parseJson(res2).then(function (data2) {
                return { res: res2, data: data2 };
              });
            });
          });
        }
        return pair;
      })
      .then(function (pair) {
        var res = pair.res;
        var data = pair.data;
        if (!res.ok) {
          var msg =
            formatError(data) ||
            (typeof data === "string" && data) ||
            "Request failed (" + res.status + ")";
          var err = new Error(msg);
          err.status = res.status;
          err.body = data;
          throw err;
        }
        return data;
      });
  };

  S.requestNoJson = function (path, opts) {
    opts = opts || {};
    var method = opts.method || "GET";
    var body = opts.body;
    var query = opts.query;
    var auth = opts.auth !== false;

    function fetchOnce() {
      var t = S.storage.getAccessToken();
      var h = { "Content-Type": "application/json" };
      if (auth && t) h.Authorization = "Bearer " + t;
      return withTimeout(
        fetch(buildUrl(path, query), {
          method: method,
          headers: h,
          body: body !== undefined ? JSON.stringify(body) : undefined,
        })
      );
    }

    return fetchOnce().then(function (res) {
      if (res.status === 401 && auth) {
        return refreshAccessToken().then(function (ok) {
          if (ok) return fetchOnce();
          return res;
        });
      }
      return res;
    }).then(function (res) {
      return parseJson(res).then(function (data) {
        if (!res.ok) {
          var msg = formatError(data) || "Request failed (" + res.status + ")";
          var err = new Error(msg);
          err.status = res.status;
          throw err;
        }
        if (res.status === 204) return null;
        var ct = res.headers.get("content-type") || "";
        if (ct.indexOf("application/json") !== -1) return res.json();
        return res.text();
      });
    });
  };
})(window.ShelfSync);
