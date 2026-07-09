var e = (e, t) => () => (t || (e((t = { exports: {} }).exports, t), (e = null)), t.exports);
(function () {
  let e = document.createElement(`link`).relList;
  if (e && e.supports && e.supports(`modulepreload`)) return;
  for (let e of document.querySelectorAll(`link[rel="modulepreload"]`)) n(e);
  new MutationObserver((e) => {
    for (let t of e)
      if (t.type === `childList`)
        for (let e of t.addedNodes) e.tagName === `LINK` && e.rel === `modulepreload` && n(e);
  }).observe(document, { childList: !0, subtree: !0 });
  function t(e) {
    let t = {};
    return (
      e.integrity && (t.integrity = e.integrity),
      e.referrerPolicy && (t.referrerPolicy = e.referrerPolicy),
      e.crossOrigin === `use-credentials`
        ? (t.credentials = `include`)
        : e.crossOrigin === `anonymous`
          ? (t.credentials = `omit`)
          : (t.credentials = `same-origin`),
      t
    );
  }
  function n(e) {
    if (e.ep) return;
    e.ep = !0;
    let n = t(e);
    fetch(e.href, n);
  }
})();
var t = e((e) => {
    var t = Symbol.for(`react.transitional.element`),
      n = Symbol.for(`react.portal`),
      r = Symbol.for(`react.fragment`),
      i = Symbol.for(`react.strict_mode`),
      a = Symbol.for(`react.profiler`),
      o = Symbol.for(`react.consumer`),
      s = Symbol.for(`react.context`),
      c = Symbol.for(`react.forward_ref`),
      l = Symbol.for(`react.suspense`),
      u = Symbol.for(`react.memo`),
      d = Symbol.for(`react.lazy`),
      f = Symbol.for(`react.activity`),
      p = Symbol.iterator;
    function m(e) {
      return typeof e != `object` || !e
        ? null
        : ((e = (p && e[p]) || e[`@@iterator`]), typeof e == `function` ? e : null);
    }
    var h = {
        isMounted: function () {
          return !1;
        },
        enqueueForceUpdate: function () {},
        enqueueReplaceState: function () {},
        enqueueSetState: function () {},
      },
      g = Object.assign,
      _ = {};
    function v(e, t, n) {
      ((this.props = e), (this.context = t), (this.refs = _), (this.updater = n || h));
    }
    ((v.prototype.isReactComponent = {}),
      (v.prototype.setState = function (e, t) {
        if (typeof e != `object` && typeof e != `function` && e != null)
          throw Error(
            `takes an object of state variables to update or a function which returns an object of state variables.`,
          );
        this.updater.enqueueSetState(this, e, t, `setState`);
      }),
      (v.prototype.forceUpdate = function (e) {
        this.updater.enqueueForceUpdate(this, e, `forceUpdate`);
      }));
    function y() {}
    y.prototype = v.prototype;
    function b(e, t, n) {
      ((this.props = e), (this.context = t), (this.refs = _), (this.updater = n || h));
    }
    var x = (b.prototype = new y());
    ((x.constructor = b), g(x, v.prototype), (x.isPureReactComponent = !0));
    var S = Array.isArray;
    function C() {}
    var w = { H: null, A: null, T: null, S: null },
      T = Object.prototype.hasOwnProperty;
    function E(e, n, r) {
      var i = r.ref;
      return { $$typeof: t, type: e, key: n, ref: i === void 0 ? null : i, props: r };
    }
    function ee(e, t) {
      return E(e.type, t, e.props);
    }
    function D(e) {
      return typeof e == `object` && !!e && e.$$typeof === t;
    }
    function O(e) {
      var t = { '=': `=0`, ':': `=2` };
      return (
        `$` +
        e.replace(/[=:]/g, function (e) {
          return t[e];
        })
      );
    }
    var k = /\/+/g;
    function te(e, t) {
      return typeof e == `object` && e && e.key != null ? O(`` + e.key) : t.toString(36);
    }
    function ne(e) {
      switch (e.status) {
        case `fulfilled`:
          return e.value;
        case `rejected`:
          throw e.reason;
        default:
          switch (
            (typeof e.status == `string`
              ? e.then(C, C)
              : ((e.status = `pending`),
                e.then(
                  function (t) {
                    e.status === `pending` && ((e.status = `fulfilled`), (e.value = t));
                  },
                  function (t) {
                    e.status === `pending` && ((e.status = `rejected`), (e.reason = t));
                  },
                )),
            e.status)
          ) {
            case `fulfilled`:
              return e.value;
            case `rejected`:
              throw e.reason;
          }
      }
      throw e;
    }
    function re(e, r, i, a, o) {
      var s = typeof e;
      (s === `undefined` || s === `boolean`) && (e = null);
      var c = !1;
      if (e === null) c = !0;
      else
        switch (s) {
          case `bigint`:
          case `string`:
          case `number`:
            c = !0;
            break;
          case `object`:
            switch (e.$$typeof) {
              case t:
              case n:
                c = !0;
                break;
              case d:
                return ((c = e._init), re(c(e._payload), r, i, a, o));
            }
        }
      if (c)
        return (
          (o = o(e)),
          (c = a === `` ? `.` + te(e, 0) : a),
          S(o)
            ? ((i = ``),
              c != null && (i = c.replace(k, `$&/`) + `/`),
              re(o, r, i, ``, function (e) {
                return e;
              }))
            : o != null &&
              (D(o) &&
                (o = ee(
                  o,
                  i +
                    (o.key == null || (e && e.key === o.key)
                      ? ``
                      : (`` + o.key).replace(k, `$&/`) + `/`) +
                    c,
                )),
              r.push(o)),
          1
        );
      c = 0;
      var l = a === `` ? `.` : a + `:`;
      if (S(e))
        for (var u = 0; u < e.length; u++)
          ((a = e[u]), (s = l + te(a, u)), (c += re(a, r, i, s, o)));
      else if (((u = m(e)), typeof u == `function`))
        for (e = u.call(e), u = 0; !(a = e.next()).done; )
          ((a = a.value), (s = l + te(a, u++)), (c += re(a, r, i, s, o)));
      else if (s === `object`) {
        if (typeof e.then == `function`) return re(ne(e), r, i, a, o);
        throw (
          (r = String(e)),
          Error(
            `Objects are not valid as a React child (found: ` +
              (r === `[object Object]`
                ? `object with keys {` + Object.keys(e).join(`, `) + `}`
                : r) +
              `). If you meant to render a collection of children, use an array instead.`,
          )
        );
      }
      return c;
    }
    function ie(e, t, n) {
      if (e == null) return e;
      var r = [],
        i = 0;
      return (
        re(e, r, ``, ``, function (e) {
          return t.call(n, e, i++);
        }),
        r
      );
    }
    function ae(e) {
      if (e._status === -1) {
        var t = e._result;
        ((t = t()),
          t.then(
            function (t) {
              (e._status === 0 || e._status === -1) && ((e._status = 1), (e._result = t));
            },
            function (t) {
              (e._status === 0 || e._status === -1) && ((e._status = 2), (e._result = t));
            },
          ),
          e._status === -1 && ((e._status = 0), (e._result = t)));
      }
      if (e._status === 1) return e._result.default;
      throw e._result;
    }
    var A =
        typeof reportError == `function`
          ? reportError
          : function (e) {
              if (typeof window == `object` && typeof window.ErrorEvent == `function`) {
                var t = new window.ErrorEvent(`error`, {
                  bubbles: !0,
                  cancelable: !0,
                  message:
                    typeof e == `object` && e && typeof e.message == `string`
                      ? String(e.message)
                      : String(e),
                  error: e,
                });
                if (!window.dispatchEvent(t)) return;
              } else if (typeof process == `object` && typeof process.emit == `function`) {
                process.emit(`uncaughtException`, e);
                return;
              }
              console.error(e);
            },
      j = {
        map: ie,
        forEach: function (e, t, n) {
          ie(
            e,
            function () {
              t.apply(this, arguments);
            },
            n,
          );
        },
        count: function (e) {
          var t = 0;
          return (
            ie(e, function () {
              t++;
            }),
            t
          );
        },
        toArray: function (e) {
          return (
            ie(e, function (e) {
              return e;
            }) || []
          );
        },
        only: function (e) {
          if (!D(e))
            throw Error(`React.Children.only expected to receive a single React element child.`);
          return e;
        },
      };
    ((e.Activity = f),
      (e.Children = j),
      (e.Component = v),
      (e.Fragment = r),
      (e.Profiler = a),
      (e.PureComponent = b),
      (e.StrictMode = i),
      (e.Suspense = l),
      (e.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = w),
      (e.__COMPILER_RUNTIME = {
        __proto__: null,
        c: function (e) {
          return w.H.useMemoCache(e);
        },
      }),
      (e.cache = function (e) {
        return function () {
          return e.apply(null, arguments);
        };
      }),
      (e.cacheSignal = function () {
        return null;
      }),
      (e.cloneElement = function (e, t, n) {
        if (e == null)
          throw Error(`The argument must be a React element, but you passed ` + e + `.`);
        var r = g({}, e.props),
          i = e.key;
        if (t != null)
          for (a in (t.key !== void 0 && (i = `` + t.key), t))
            !T.call(t, a) ||
              a === `key` ||
              a === `__self` ||
              a === `__source` ||
              (a === `ref` && t.ref === void 0) ||
              (r[a] = t[a]);
        var a = arguments.length - 2;
        if (a === 1) r.children = n;
        else if (1 < a) {
          for (var o = Array(a), s = 0; s < a; s++) o[s] = arguments[s + 2];
          r.children = o;
        }
        return E(e.type, i, r);
      }),
      (e.createContext = function (e) {
        return (
          (e = {
            $$typeof: s,
            _currentValue: e,
            _currentValue2: e,
            _threadCount: 0,
            Provider: null,
            Consumer: null,
          }),
          (e.Provider = e),
          (e.Consumer = { $$typeof: o, _context: e }),
          e
        );
      }),
      (e.createElement = function (e, t, n) {
        var r,
          i = {},
          a = null;
        if (t != null)
          for (r in (t.key !== void 0 && (a = `` + t.key), t))
            T.call(t, r) && r !== `key` && r !== `__self` && r !== `__source` && (i[r] = t[r]);
        var o = arguments.length - 2;
        if (o === 1) i.children = n;
        else if (1 < o) {
          for (var s = Array(o), c = 0; c < o; c++) s[c] = arguments[c + 2];
          i.children = s;
        }
        if (e && e.defaultProps)
          for (r in ((o = e.defaultProps), o)) i[r] === void 0 && (i[r] = o[r]);
        return E(e, a, i);
      }),
      (e.createRef = function () {
        return { current: null };
      }),
      (e.forwardRef = function (e) {
        return { $$typeof: c, render: e };
      }),
      (e.isValidElement = D),
      (e.lazy = function (e) {
        return { $$typeof: d, _payload: { _status: -1, _result: e }, _init: ae };
      }),
      (e.memo = function (e, t) {
        return { $$typeof: u, type: e, compare: t === void 0 ? null : t };
      }),
      (e.startTransition = function (e) {
        var t = w.T,
          n = {};
        w.T = n;
        try {
          var r = e(),
            i = w.S;
          (i !== null && i(n, r),
            typeof r == `object` && r && typeof r.then == `function` && r.then(C, A));
        } catch (e) {
          A(e);
        } finally {
          (t !== null && n.types !== null && (t.types = n.types), (w.T = t));
        }
      }),
      (e.unstable_useCacheRefresh = function () {
        return w.H.useCacheRefresh();
      }),
      (e.use = function (e) {
        return w.H.use(e);
      }),
      (e.useActionState = function (e, t, n) {
        return w.H.useActionState(e, t, n);
      }),
      (e.useCallback = function (e, t) {
        return w.H.useCallback(e, t);
      }),
      (e.useContext = function (e) {
        return w.H.useContext(e);
      }),
      (e.useDebugValue = function () {}),
      (e.useDeferredValue = function (e, t) {
        return w.H.useDeferredValue(e, t);
      }),
      (e.useEffect = function (e, t) {
        return w.H.useEffect(e, t);
      }),
      (e.useEffectEvent = function (e) {
        return w.H.useEffectEvent(e);
      }),
      (e.useId = function () {
        return w.H.useId();
      }),
      (e.useImperativeHandle = function (e, t, n) {
        return w.H.useImperativeHandle(e, t, n);
      }),
      (e.useInsertionEffect = function (e, t) {
        return w.H.useInsertionEffect(e, t);
      }),
      (e.useLayoutEffect = function (e, t) {
        return w.H.useLayoutEffect(e, t);
      }),
      (e.useMemo = function (e, t) {
        return w.H.useMemo(e, t);
      }),
      (e.useOptimistic = function (e, t) {
        return w.H.useOptimistic(e, t);
      }),
      (e.useReducer = function (e, t, n) {
        return w.H.useReducer(e, t, n);
      }),
      (e.useRef = function (e) {
        return w.H.useRef(e);
      }),
      (e.useState = function (e) {
        return w.H.useState(e);
      }),
      (e.useSyncExternalStore = function (e, t, n) {
        return w.H.useSyncExternalStore(e, t, n);
      }),
      (e.useTransition = function () {
        return w.H.useTransition();
      }),
      (e.version = `19.2.6`));
  }),
  n = e((e, n) => {
    n.exports = t();
  }),
  r = e((e) => {
    function t(e, t) {
      var n = e.length;
      e.push(t);
      a: for (; 0 < n; ) {
        var r = (n - 1) >>> 1,
          a = e[r];
        if (0 < i(a, t)) ((e[r] = t), (e[n] = a), (n = r));
        else break a;
      }
    }
    function n(e) {
      return e.length === 0 ? null : e[0];
    }
    function r(e) {
      if (e.length === 0) return null;
      var t = e[0],
        n = e.pop();
      if (n !== t) {
        e[0] = n;
        a: for (var r = 0, a = e.length, o = a >>> 1; r < o; ) {
          var s = 2 * (r + 1) - 1,
            c = e[s],
            l = s + 1,
            u = e[l];
          if (0 > i(c, n))
            l < a && 0 > i(u, c)
              ? ((e[r] = u), (e[l] = n), (r = l))
              : ((e[r] = c), (e[s] = n), (r = s));
          else if (l < a && 0 > i(u, n)) ((e[r] = u), (e[l] = n), (r = l));
          else break a;
        }
      }
      return t;
    }
    function i(e, t) {
      var n = e.sortIndex - t.sortIndex;
      return n === 0 ? e.id - t.id : n;
    }
    if (
      ((e.unstable_now = void 0),
      typeof performance == `object` && typeof performance.now == `function`)
    ) {
      var a = performance;
      e.unstable_now = function () {
        return a.now();
      };
    } else {
      var o = Date,
        s = o.now();
      e.unstable_now = function () {
        return o.now() - s;
      };
    }
    var c = [],
      l = [],
      u = 1,
      d = null,
      f = 3,
      p = !1,
      m = !1,
      h = !1,
      g = !1,
      _ = typeof setTimeout == `function` ? setTimeout : null,
      v = typeof clearTimeout == `function` ? clearTimeout : null,
      y = typeof setImmediate < `u` ? setImmediate : null;
    function b(e) {
      for (var i = n(l); i !== null; ) {
        if (i.callback === null) r(l);
        else if (i.startTime <= e) (r(l), (i.sortIndex = i.expirationTime), t(c, i));
        else break;
        i = n(l);
      }
    }
    function x(e) {
      if (((h = !1), b(e), !m))
        if (n(c) !== null) ((m = !0), S || ((S = !0), D()));
        else {
          var t = n(l);
          t !== null && te(x, t.startTime - e);
        }
    }
    var S = !1,
      C = -1,
      w = 5,
      T = -1;
    function E() {
      return g ? !0 : !(e.unstable_now() - T < w);
    }
    function ee() {
      if (((g = !1), S)) {
        var t = e.unstable_now();
        T = t;
        var i = !0;
        try {
          a: {
            ((m = !1), h && ((h = !1), v(C), (C = -1)), (p = !0));
            var a = f;
            try {
              b: {
                for (b(t), d = n(c); d !== null && !(d.expirationTime > t && E()); ) {
                  var o = d.callback;
                  if (typeof o == `function`) {
                    ((d.callback = null), (f = d.priorityLevel));
                    var s = o(d.expirationTime <= t);
                    if (((t = e.unstable_now()), typeof s == `function`)) {
                      ((d.callback = s), b(t), (i = !0));
                      break b;
                    }
                    (d === n(c) && r(c), b(t));
                  } else r(c);
                  d = n(c);
                }
                if (d !== null) i = !0;
                else {
                  var u = n(l);
                  (u !== null && te(x, u.startTime - t), (i = !1));
                }
              }
              break a;
            } finally {
              ((d = null), (f = a), (p = !1));
            }
            i = void 0;
          }
        } finally {
          i ? D() : (S = !1);
        }
      }
    }
    var D;
    if (typeof y == `function`)
      D = function () {
        y(ee);
      };
    else if (typeof MessageChannel < `u`) {
      var O = new MessageChannel(),
        k = O.port2;
      ((O.port1.onmessage = ee),
        (D = function () {
          k.postMessage(null);
        }));
    } else
      D = function () {
        _(ee, 0);
      };
    function te(t, n) {
      C = _(function () {
        t(e.unstable_now());
      }, n);
    }
    ((e.unstable_IdlePriority = 5),
      (e.unstable_ImmediatePriority = 1),
      (e.unstable_LowPriority = 4),
      (e.unstable_NormalPriority = 3),
      (e.unstable_Profiling = null),
      (e.unstable_UserBlockingPriority = 2),
      (e.unstable_cancelCallback = function (e) {
        e.callback = null;
      }),
      (e.unstable_forceFrameRate = function (e) {
        0 > e || 125 < e
          ? console.error(
              `forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported`,
            )
          : (w = 0 < e ? Math.floor(1e3 / e) : 5);
      }),
      (e.unstable_getCurrentPriorityLevel = function () {
        return f;
      }),
      (e.unstable_next = function (e) {
        switch (f) {
          case 1:
          case 2:
          case 3:
            var t = 3;
            break;
          default:
            t = f;
        }
        var n = f;
        f = t;
        try {
          return e();
        } finally {
          f = n;
        }
      }),
      (e.unstable_requestPaint = function () {
        g = !0;
      }),
      (e.unstable_runWithPriority = function (e, t) {
        switch (e) {
          case 1:
          case 2:
          case 3:
          case 4:
          case 5:
            break;
          default:
            e = 3;
        }
        var n = f;
        f = e;
        try {
          return t();
        } finally {
          f = n;
        }
      }),
      (e.unstable_scheduleCallback = function (r, i, a) {
        var o = e.unstable_now();
        switch (
          (typeof a == `object` && a
            ? ((a = a.delay), (a = typeof a == `number` && 0 < a ? o + a : o))
            : (a = o),
          r)
        ) {
          case 1:
            var s = -1;
            break;
          case 2:
            s = 250;
            break;
          case 5:
            s = 1073741823;
            break;
          case 4:
            s = 1e4;
            break;
          default:
            s = 5e3;
        }
        return (
          (s = a + s),
          (r = {
            id: u++,
            callback: i,
            priorityLevel: r,
            startTime: a,
            expirationTime: s,
            sortIndex: -1,
          }),
          a > o
            ? ((r.sortIndex = a),
              t(l, r),
              n(c) === null && r === n(l) && (h ? (v(C), (C = -1)) : (h = !0), te(x, a - o)))
            : ((r.sortIndex = s), t(c, r), m || p || ((m = !0), S || ((S = !0), D()))),
          r
        );
      }),
      (e.unstable_shouldYield = E),
      (e.unstable_wrapCallback = function (e) {
        var t = f;
        return function () {
          var n = f;
          f = t;
          try {
            return e.apply(this, arguments);
          } finally {
            f = n;
          }
        };
      }));
  }),
  i = e((e, t) => {
    t.exports = r();
  }),
  a = e((e) => {
    var t = n();
    function r(e) {
      var t = `https://react.dev/errors/` + e;
      if (1 < arguments.length) {
        t += `?args[]=` + encodeURIComponent(arguments[1]);
        for (var n = 2; n < arguments.length; n++)
          t += `&args[]=` + encodeURIComponent(arguments[n]);
      }
      return (
        `Minified React error #` +
        e +
        `; visit ` +
        t +
        ` for the full message or use the non-minified dev environment for full errors and additional helpful warnings.`
      );
    }
    function i() {}
    var a = {
        d: {
          f: i,
          r: function () {
            throw Error(r(522));
          },
          D: i,
          C: i,
          L: i,
          m: i,
          X: i,
          S: i,
          M: i,
        },
        p: 0,
        findDOMNode: null,
      },
      o = Symbol.for(`react.portal`);
    function s(e, t, n) {
      var r = 3 < arguments.length && arguments[3] !== void 0 ? arguments[3] : null;
      return {
        $$typeof: o,
        key: r == null ? null : `` + r,
        children: e,
        containerInfo: t,
        implementation: n,
      };
    }
    var c = t.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
    function l(e, t) {
      if (e === `font`) return ``;
      if (typeof t == `string`) return t === `use-credentials` ? t : ``;
    }
    ((e.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = a),
      (e.createPortal = function (e, t) {
        var n = 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null;
        if (!t || (t.nodeType !== 1 && t.nodeType !== 9 && t.nodeType !== 11)) throw Error(r(299));
        return s(e, t, null, n);
      }),
      (e.flushSync = function (e) {
        var t = c.T,
          n = a.p;
        try {
          if (((c.T = null), (a.p = 2), e)) return e();
        } finally {
          ((c.T = t), (a.p = n), a.d.f());
        }
      }),
      (e.preconnect = function (e, t) {
        typeof e == `string` &&
          (t
            ? ((t = t.crossOrigin),
              (t = typeof t == `string` ? (t === `use-credentials` ? t : ``) : void 0))
            : (t = null),
          a.d.C(e, t));
      }),
      (e.prefetchDNS = function (e) {
        typeof e == `string` && a.d.D(e);
      }),
      (e.preinit = function (e, t) {
        if (typeof e == `string` && t && typeof t.as == `string`) {
          var n = t.as,
            r = l(n, t.crossOrigin),
            i = typeof t.integrity == `string` ? t.integrity : void 0,
            o = typeof t.fetchPriority == `string` ? t.fetchPriority : void 0;
          n === `style`
            ? a.d.S(e, typeof t.precedence == `string` ? t.precedence : void 0, {
                crossOrigin: r,
                integrity: i,
                fetchPriority: o,
              })
            : n === `script` &&
              a.d.X(e, {
                crossOrigin: r,
                integrity: i,
                fetchPriority: o,
                nonce: typeof t.nonce == `string` ? t.nonce : void 0,
              });
        }
      }),
      (e.preinitModule = function (e, t) {
        if (typeof e == `string`)
          if (typeof t == `object` && t) {
            if (t.as == null || t.as === `script`) {
              var n = l(t.as, t.crossOrigin);
              a.d.M(e, {
                crossOrigin: n,
                integrity: typeof t.integrity == `string` ? t.integrity : void 0,
                nonce: typeof t.nonce == `string` ? t.nonce : void 0,
              });
            }
          } else t ?? a.d.M(e);
      }),
      (e.preload = function (e, t) {
        if (typeof e == `string` && typeof t == `object` && t && typeof t.as == `string`) {
          var n = t.as,
            r = l(n, t.crossOrigin);
          a.d.L(e, n, {
            crossOrigin: r,
            integrity: typeof t.integrity == `string` ? t.integrity : void 0,
            nonce: typeof t.nonce == `string` ? t.nonce : void 0,
            type: typeof t.type == `string` ? t.type : void 0,
            fetchPriority: typeof t.fetchPriority == `string` ? t.fetchPriority : void 0,
            referrerPolicy: typeof t.referrerPolicy == `string` ? t.referrerPolicy : void 0,
            imageSrcSet: typeof t.imageSrcSet == `string` ? t.imageSrcSet : void 0,
            imageSizes: typeof t.imageSizes == `string` ? t.imageSizes : void 0,
            media: typeof t.media == `string` ? t.media : void 0,
          });
        }
      }),
      (e.preloadModule = function (e, t) {
        if (typeof e == `string`)
          if (t) {
            var n = l(t.as, t.crossOrigin);
            a.d.m(e, {
              as: typeof t.as == `string` && t.as !== `script` ? t.as : void 0,
              crossOrigin: n,
              integrity: typeof t.integrity == `string` ? t.integrity : void 0,
            });
          } else a.d.m(e);
      }),
      (e.requestFormReset = function (e) {
        a.d.r(e);
      }),
      (e.unstable_batchedUpdates = function (e, t) {
        return e(t);
      }),
      (e.useFormState = function (e, t, n) {
        return c.H.useFormState(e, t, n);
      }),
      (e.useFormStatus = function () {
        return c.H.useHostTransitionStatus();
      }),
      (e.version = `19.2.6`));
  }),
  o = e((e, t) => {
    function n() {
      if (
        !(
          typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > `u` ||
          typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != `function`
        )
      )
        try {
          __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(n);
        } catch (e) {
          console.error(e);
        }
    }
    (n(), (t.exports = a()));
  }),
  s = e((e) => {
    var t = i(),
      r = n(),
      a = o();
    function s(e) {
      var t = `https://react.dev/errors/` + e;
      if (1 < arguments.length) {
        t += `?args[]=` + encodeURIComponent(arguments[1]);
        for (var n = 2; n < arguments.length; n++)
          t += `&args[]=` + encodeURIComponent(arguments[n]);
      }
      return (
        `Minified React error #` +
        e +
        `; visit ` +
        t +
        ` for the full message or use the non-minified dev environment for full errors and additional helpful warnings.`
      );
    }
    function c(e) {
      return !(!e || (e.nodeType !== 1 && e.nodeType !== 9 && e.nodeType !== 11));
    }
    function l(e) {
      var t = e,
        n = e;
      if (e.alternate) for (; t.return; ) t = t.return;
      else {
        e = t;
        do ((t = e), t.flags & 4098 && (n = t.return), (e = t.return));
        while (e);
      }
      return t.tag === 3 ? n : null;
    }
    function u(e) {
      if (e.tag === 13) {
        var t = e.memoizedState;
        if ((t === null && ((e = e.alternate), e !== null && (t = e.memoizedState)), t !== null))
          return t.dehydrated;
      }
      return null;
    }
    function d(e) {
      if (e.tag === 31) {
        var t = e.memoizedState;
        if ((t === null && ((e = e.alternate), e !== null && (t = e.memoizedState)), t !== null))
          return t.dehydrated;
      }
      return null;
    }
    function f(e) {
      if (l(e) !== e) throw Error(s(188));
    }
    function p(e) {
      var t = e.alternate;
      if (!t) {
        if (((t = l(e)), t === null)) throw Error(s(188));
        return t === e ? e : null;
      }
      for (var n = e, r = t; ; ) {
        var i = n.return;
        if (i === null) break;
        var a = i.alternate;
        if (a === null) {
          if (((r = i.return), r !== null)) {
            n = r;
            continue;
          }
          break;
        }
        if (i.child === a.child) {
          for (a = i.child; a; ) {
            if (a === n) return (f(i), e);
            if (a === r) return (f(i), t);
            a = a.sibling;
          }
          throw Error(s(188));
        }
        if (n.return !== r.return) ((n = i), (r = a));
        else {
          for (var o = !1, c = i.child; c; ) {
            if (c === n) {
              ((o = !0), (n = i), (r = a));
              break;
            }
            if (c === r) {
              ((o = !0), (r = i), (n = a));
              break;
            }
            c = c.sibling;
          }
          if (!o) {
            for (c = a.child; c; ) {
              if (c === n) {
                ((o = !0), (n = a), (r = i));
                break;
              }
              if (c === r) {
                ((o = !0), (r = a), (n = i));
                break;
              }
              c = c.sibling;
            }
            if (!o) throw Error(s(189));
          }
        }
        if (n.alternate !== r) throw Error(s(190));
      }
      if (n.tag !== 3) throw Error(s(188));
      return n.stateNode.current === n ? e : t;
    }
    function m(e) {
      var t = e.tag;
      if (t === 5 || t === 26 || t === 27 || t === 6) return e;
      for (e = e.child; e !== null; ) {
        if (((t = m(e)), t !== null)) return t;
        e = e.sibling;
      }
      return null;
    }
    var h = Object.assign,
      g = Symbol.for(`react.element`),
      _ = Symbol.for(`react.transitional.element`),
      v = Symbol.for(`react.portal`),
      y = Symbol.for(`react.fragment`),
      b = Symbol.for(`react.strict_mode`),
      x = Symbol.for(`react.profiler`),
      S = Symbol.for(`react.consumer`),
      C = Symbol.for(`react.context`),
      w = Symbol.for(`react.forward_ref`),
      T = Symbol.for(`react.suspense`),
      E = Symbol.for(`react.suspense_list`),
      ee = Symbol.for(`react.memo`),
      D = Symbol.for(`react.lazy`),
      O = Symbol.for(`react.activity`),
      k = Symbol.for(`react.memo_cache_sentinel`),
      te = Symbol.iterator;
    function ne(e) {
      return typeof e != `object` || !e
        ? null
        : ((e = (te && e[te]) || e[`@@iterator`]), typeof e == `function` ? e : null);
    }
    var re = Symbol.for(`react.client.reference`);
    function ie(e) {
      if (e == null) return null;
      if (typeof e == `function`) return e.$$typeof === re ? null : e.displayName || e.name || null;
      if (typeof e == `string`) return e;
      switch (e) {
        case y:
          return `Fragment`;
        case x:
          return `Profiler`;
        case b:
          return `StrictMode`;
        case T:
          return `Suspense`;
        case E:
          return `SuspenseList`;
        case O:
          return `Activity`;
      }
      if (typeof e == `object`)
        switch (e.$$typeof) {
          case v:
            return `Portal`;
          case C:
            return e.displayName || `Context`;
          case S:
            return (e._context.displayName || `Context`) + `.Consumer`;
          case w:
            var t = e.render;
            return (
              (e = e.displayName),
              (e ||=
                ((e = t.displayName || t.name || ``),
                e === `` ? `ForwardRef` : `ForwardRef(` + e + `)`)),
              e
            );
          case ee:
            return ((t = e.displayName || null), t === null ? ie(e.type) || `Memo` : t);
          case D:
            ((t = e._payload), (e = e._init));
            try {
              return ie(e(t));
            } catch {}
        }
      return null;
    }
    var ae = Array.isArray,
      A = r.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,
      j = a.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,
      oe = { pending: !1, data: null, method: null, action: null },
      se = [],
      ce = -1;
    function le(e) {
      return { current: e };
    }
    function ue(e) {
      0 > ce || ((e.current = se[ce]), (se[ce] = null), ce--);
    }
    function M(e, t) {
      (ce++, (se[ce] = e.current), (e.current = t));
    }
    var de = le(null),
      fe = le(null),
      pe = le(null),
      me = le(null);
    function he(e, t) {
      switch ((M(pe, t), M(fe, e), M(de, null), t.nodeType)) {
        case 9:
        case 11:
          e = (e = t.documentElement) && (e = e.namespaceURI) ? Vd(e) : 0;
          break;
        default:
          if (((e = t.tagName), (t = t.namespaceURI))) ((t = Vd(t)), (e = Hd(t, e)));
          else
            switch (e) {
              case `svg`:
                e = 1;
                break;
              case `math`:
                e = 2;
                break;
              default:
                e = 0;
            }
      }
      (ue(de), M(de, e));
    }
    function ge() {
      (ue(de), ue(fe), ue(pe));
    }
    function _e(e) {
      e.memoizedState !== null && M(me, e);
      var t = de.current,
        n = Hd(t, e.type);
      t !== n && (M(fe, e), M(de, n));
    }
    function ve(e) {
      (fe.current === e && (ue(de), ue(fe)), me.current === e && (ue(me), (Qf._currentValue = oe)));
    }
    var ye, be;
    function xe(e) {
      if (ye === void 0)
        try {
          throw Error();
        } catch (e) {
          var t = e.stack.trim().match(/\n( *(at )?)/);
          ((ye = (t && t[1]) || ``),
            (be =
              -1 <
              e.stack.indexOf(`
    at`)
                ? ` (<anonymous>)`
                : -1 < e.stack.indexOf(`@`)
                  ? `@unknown:0:0`
                  : ``));
        }
      return (
        `
` +
        ye +
        e +
        be
      );
    }
    var Se = !1;
    function Ce(e, t) {
      if (!e || Se) return ``;
      Se = !0;
      var n = Error.prepareStackTrace;
      Error.prepareStackTrace = void 0;
      try {
        var r = {
          DetermineComponentFrameRoot: function () {
            try {
              if (t) {
                var n = function () {
                  throw Error();
                };
                if (
                  (Object.defineProperty(n.prototype, 'props', {
                    set: function () {
                      throw Error();
                    },
                  }),
                  typeof Reflect == `object` && Reflect.construct)
                ) {
                  try {
                    Reflect.construct(n, []);
                  } catch (e) {
                    var r = e;
                  }
                  Reflect.construct(e, [], n);
                } else {
                  try {
                    n.call();
                  } catch (e) {
                    r = e;
                  }
                  e.call(n.prototype);
                }
              } else {
                try {
                  throw Error();
                } catch (e) {
                  r = e;
                }
                (n = e()) && typeof n.catch == `function` && n.catch(function () {});
              }
            } catch (e) {
              if (e && r && typeof e.stack == `string`) return [e.stack, r.stack];
            }
            return [null, null];
          },
        };
        r.DetermineComponentFrameRoot.displayName = `DetermineComponentFrameRoot`;
        var i = Object.getOwnPropertyDescriptor(r.DetermineComponentFrameRoot, `name`);
        i &&
          i.configurable &&
          Object.defineProperty(r.DetermineComponentFrameRoot, 'name', {
            value: `DetermineComponentFrameRoot`,
          });
        var a = r.DetermineComponentFrameRoot(),
          o = a[0],
          s = a[1];
        if (o && s) {
          var c = o.split(`
`),
            l = s.split(`
`);
          for (i = r = 0; r < c.length && !c[r].includes(`DetermineComponentFrameRoot`); ) r++;
          for (; i < l.length && !l[i].includes(`DetermineComponentFrameRoot`); ) i++;
          if (r === c.length || i === l.length)
            for (r = c.length - 1, i = l.length - 1; 1 <= r && 0 <= i && c[r] !== l[i]; ) i--;
          for (; 1 <= r && 0 <= i; r--, i--)
            if (c[r] !== l[i]) {
              if (r !== 1 || i !== 1)
                do
                  if ((r--, i--, 0 > i || c[r] !== l[i])) {
                    var u =
                      `
` + c[r].replace(` at new `, ` at `);
                    return (
                      e.displayName &&
                        u.includes(`<anonymous>`) &&
                        (u = u.replace(`<anonymous>`, e.displayName)),
                      u
                    );
                  }
                while (1 <= r && 0 <= i);
              break;
            }
        }
      } finally {
        ((Se = !1), (Error.prepareStackTrace = n));
      }
      return (n = e ? e.displayName || e.name : ``) ? xe(n) : ``;
    }
    function we(e, t) {
      switch (e.tag) {
        case 26:
        case 27:
        case 5:
          return xe(e.type);
        case 16:
          return xe(`Lazy`);
        case 13:
          return e.child !== t && t !== null ? xe(`Suspense Fallback`) : xe(`Suspense`);
        case 19:
          return xe(`SuspenseList`);
        case 0:
        case 15:
          return Ce(e.type, !1);
        case 11:
          return Ce(e.type.render, !1);
        case 1:
          return Ce(e.type, !0);
        case 31:
          return xe(`Activity`);
        default:
          return ``;
      }
    }
    function Te(e) {
      try {
        var t = ``,
          n = null;
        do ((t += we(e, n)), (n = e), (e = e.return));
        while (e);
        return t;
      } catch (e) {
        return (
          `
Error generating stack: ` +
          e.message +
          `
` +
          e.stack
        );
      }
    }
    var Ee = Object.prototype.hasOwnProperty,
      De = t.unstable_scheduleCallback,
      Oe = t.unstable_cancelCallback,
      ke = t.unstable_shouldYield,
      Ae = t.unstable_requestPaint,
      je = t.unstable_now,
      Me = t.unstable_getCurrentPriorityLevel,
      Ne = t.unstable_ImmediatePriority,
      Pe = t.unstable_UserBlockingPriority,
      Fe = t.unstable_NormalPriority,
      Ie = t.unstable_LowPriority,
      Le = t.unstable_IdlePriority,
      Re = t.log,
      ze = t.unstable_setDisableYieldValue,
      Be = null,
      Ve = null;
    function He(e) {
      if ((typeof Re == `function` && ze(e), Ve && typeof Ve.setStrictMode == `function`))
        try {
          Ve.setStrictMode(Be, e);
        } catch {}
    }
    var Ue = Math.clz32 ? Math.clz32 : Ke,
      We = Math.log,
      Ge = Math.LN2;
    function Ke(e) {
      return ((e >>>= 0), e === 0 ? 32 : (31 - ((We(e) / Ge) | 0)) | 0);
    }
    var qe = 256,
      Je = 262144,
      Ye = 4194304;
    function Xe(e) {
      var t = e & 42;
      if (t !== 0) return t;
      switch (e & -e) {
        case 1:
          return 1;
        case 2:
          return 2;
        case 4:
          return 4;
        case 8:
          return 8;
        case 16:
          return 16;
        case 32:
          return 32;
        case 64:
          return 64;
        case 128:
          return 128;
        case 256:
        case 512:
        case 1024:
        case 2048:
        case 4096:
        case 8192:
        case 16384:
        case 32768:
        case 65536:
        case 131072:
          return e & 261888;
        case 262144:
        case 524288:
        case 1048576:
        case 2097152:
          return e & 3932160;
        case 4194304:
        case 8388608:
        case 16777216:
        case 33554432:
          return e & 62914560;
        case 67108864:
          return 67108864;
        case 134217728:
          return 134217728;
        case 268435456:
          return 268435456;
        case 536870912:
          return 536870912;
        case 1073741824:
          return 0;
        default:
          return e;
      }
    }
    function Ze(e, t, n) {
      var r = e.pendingLanes;
      if (r === 0) return 0;
      var i = 0,
        a = e.suspendedLanes,
        o = e.pingedLanes;
      e = e.warmLanes;
      var s = r & 134217727;
      return (
        s === 0
          ? ((s = r & ~a),
            s === 0
              ? o === 0
                ? n || ((n = r & ~e), n !== 0 && (i = Xe(n)))
                : (i = Xe(o))
              : (i = Xe(s)))
          : ((r = s & ~a),
            r === 0
              ? ((o &= s), o === 0 ? n || ((n = s & ~e), n !== 0 && (i = Xe(n))) : (i = Xe(o)))
              : (i = Xe(r))),
        i === 0
          ? 0
          : t !== 0 &&
              t !== i &&
              (t & a) === 0 &&
              ((a = i & -i), (n = t & -t), a >= n || (a === 32 && n & 4194048))
            ? t
            : i
      );
    }
    function Qe(e, t) {
      return (e.pendingLanes & ~(e.suspendedLanes & ~e.pingedLanes) & t) === 0;
    }
    function $e(e, t) {
      switch (e) {
        case 1:
        case 2:
        case 4:
        case 8:
        case 64:
          return t + 250;
        case 16:
        case 32:
        case 128:
        case 256:
        case 512:
        case 1024:
        case 2048:
        case 4096:
        case 8192:
        case 16384:
        case 32768:
        case 65536:
        case 131072:
        case 262144:
        case 524288:
        case 1048576:
        case 2097152:
          return t + 5e3;
        case 4194304:
        case 8388608:
        case 16777216:
        case 33554432:
          return -1;
        case 67108864:
        case 134217728:
        case 268435456:
        case 536870912:
        case 1073741824:
          return -1;
        default:
          return -1;
      }
    }
    function et() {
      var e = Ye;
      return ((Ye <<= 1), !(Ye & 62914560) && (Ye = 4194304), e);
    }
    function tt(e) {
      for (var t = [], n = 0; 31 > n; n++) t.push(e);
      return t;
    }
    function nt(e, t) {
      ((e.pendingLanes |= t),
        t !== 268435456 && ((e.suspendedLanes = 0), (e.pingedLanes = 0), (e.warmLanes = 0)));
    }
    function rt(e, t, n, r, i, a) {
      var o = e.pendingLanes;
      ((e.pendingLanes = n),
        (e.suspendedLanes = 0),
        (e.pingedLanes = 0),
        (e.warmLanes = 0),
        (e.expiredLanes &= n),
        (e.entangledLanes &= n),
        (e.errorRecoveryDisabledLanes &= n),
        (e.shellSuspendCounter = 0));
      var s = e.entanglements,
        c = e.expirationTimes,
        l = e.hiddenUpdates;
      for (n = o & ~n; 0 < n; ) {
        var u = 31 - Ue(n),
          d = 1 << u;
        ((s[u] = 0), (c[u] = -1));
        var f = l[u];
        if (f !== null)
          for (l[u] = null, u = 0; u < f.length; u++) {
            var p = f[u];
            p !== null && (p.lane &= -536870913);
          }
        n &= ~d;
      }
      (r !== 0 && it(e, r, 0),
        a !== 0 && i === 0 && e.tag !== 0 && (e.suspendedLanes |= a & ~(o & ~t)));
    }
    function it(e, t, n) {
      ((e.pendingLanes |= t), (e.suspendedLanes &= ~t));
      var r = 31 - Ue(t);
      ((e.entangledLanes |= t),
        (e.entanglements[r] = e.entanglements[r] | 1073741824 | (n & 261930)));
    }
    function at(e, t) {
      var n = (e.entangledLanes |= t);
      for (e = e.entanglements; n; ) {
        var r = 31 - Ue(n),
          i = 1 << r;
        ((i & t) | (e[r] & t) && (e[r] |= t), (n &= ~i));
      }
    }
    function ot(e, t) {
      var n = t & -t;
      return ((n = n & 42 ? 1 : st(n)), (n & (e.suspendedLanes | t)) === 0 ? n : 0);
    }
    function st(e) {
      switch (e) {
        case 2:
          e = 1;
          break;
        case 8:
          e = 4;
          break;
        case 32:
          e = 16;
          break;
        case 256:
        case 512:
        case 1024:
        case 2048:
        case 4096:
        case 8192:
        case 16384:
        case 32768:
        case 65536:
        case 131072:
        case 262144:
        case 524288:
        case 1048576:
        case 2097152:
        case 4194304:
        case 8388608:
        case 16777216:
        case 33554432:
          e = 128;
          break;
        case 268435456:
          e = 134217728;
          break;
        default:
          e = 0;
      }
      return e;
    }
    function ct(e) {
      return ((e &= -e), 2 < e ? (8 < e ? (e & 134217727 ? 32 : 268435456) : 8) : 2);
    }
    function lt() {
      var e = j.p;
      return e === 0 ? ((e = window.event), e === void 0 ? 32 : mp(e.type)) : e;
    }
    function ut(e, t) {
      var n = j.p;
      try {
        return ((j.p = e), t());
      } finally {
        j.p = n;
      }
    }
    var dt = Math.random().toString(36).slice(2),
      ft = `__reactFiber$` + dt,
      pt = `__reactProps$` + dt,
      mt = `__reactContainer$` + dt,
      ht = `__reactEvents$` + dt,
      gt = `__reactListeners$` + dt,
      _t = `__reactHandles$` + dt,
      vt = `__reactResources$` + dt,
      yt = `__reactMarker$` + dt;
    function bt(e) {
      (delete e[ft], delete e[pt], delete e[ht], delete e[gt], delete e[_t]);
    }
    function xt(e) {
      var t = e[ft];
      if (t) return t;
      for (var n = e.parentNode; n; ) {
        if ((t = n[mt] || n[ft])) {
          if (((n = t.alternate), t.child !== null || (n !== null && n.child !== null)))
            for (e = df(e); e !== null; ) {
              if ((n = e[ft])) return n;
              e = df(e);
            }
          return t;
        }
        ((e = n), (n = e.parentNode));
      }
      return null;
    }
    function St(e) {
      if ((e = e[ft] || e[mt])) {
        var t = e.tag;
        if (t === 5 || t === 6 || t === 13 || t === 31 || t === 26 || t === 27 || t === 3) return e;
      }
      return null;
    }
    function Ct(e) {
      var t = e.tag;
      if (t === 5 || t === 26 || t === 27 || t === 6) return e.stateNode;
      throw Error(s(33));
    }
    function wt(e) {
      var t = e[vt];
      return ((t ||= e[vt] = { hoistableStyles: new Map(), hoistableScripts: new Map() }), t);
    }
    function N(e) {
      e[yt] = !0;
    }
    var P = new Set(),
      F = {};
    function I(e, t) {
      (Tt(e, t), Tt(e + `Capture`, t));
    }
    function Tt(e, t) {
      for (F[e] = t, e = 0; e < t.length; e++) P.add(t[e]);
    }
    var Et = RegExp(
        `^[:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD][:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040]*$`,
      ),
      Dt = {},
      Ot = {};
    function kt(e) {
      return Ee.call(Ot, e)
        ? !0
        : Ee.call(Dt, e)
          ? !1
          : Et.test(e)
            ? (Ot[e] = !0)
            : ((Dt[e] = !0), !1);
    }
    function At(e, t, n) {
      if (kt(t))
        if (n === null) e.removeAttribute(t);
        else {
          switch (typeof n) {
            case `undefined`:
            case `function`:
            case `symbol`:
              e.removeAttribute(t);
              return;
            case `boolean`:
              var r = t.toLowerCase().slice(0, 5);
              if (r !== `data-` && r !== `aria-`) {
                e.removeAttribute(t);
                return;
              }
          }
          e.setAttribute(t, `` + n);
        }
    }
    function jt(e, t, n) {
      if (n === null) e.removeAttribute(t);
      else {
        switch (typeof n) {
          case `undefined`:
          case `function`:
          case `symbol`:
          case `boolean`:
            e.removeAttribute(t);
            return;
        }
        e.setAttribute(t, `` + n);
      }
    }
    function Mt(e, t, n, r) {
      if (r === null) e.removeAttribute(n);
      else {
        switch (typeof r) {
          case `undefined`:
          case `function`:
          case `symbol`:
          case `boolean`:
            e.removeAttribute(n);
            return;
        }
        e.setAttributeNS(t, n, `` + r);
      }
    }
    function Nt(e) {
      switch (typeof e) {
        case `bigint`:
        case `boolean`:
        case `number`:
        case `string`:
        case `undefined`:
          return e;
        case `object`:
          return e;
        default:
          return ``;
      }
    }
    function Pt(e) {
      var t = e.type;
      return (e = e.nodeName) && e.toLowerCase() === `input` && (t === `checkbox` || t === `radio`);
    }
    function Ft(e, t, n) {
      var r = Object.getOwnPropertyDescriptor(e.constructor.prototype, t);
      if (
        !e.hasOwnProperty(t) &&
        r !== void 0 &&
        typeof r.get == `function` &&
        typeof r.set == `function`
      ) {
        var i = r.get,
          a = r.set;
        return (
          Object.defineProperty(e, t, {
            configurable: !0,
            get: function () {
              return i.call(this);
            },
            set: function (e) {
              ((n = `` + e), a.call(this, e));
            },
          }),
          Object.defineProperty(e, t, { enumerable: r.enumerable }),
          {
            getValue: function () {
              return n;
            },
            setValue: function (e) {
              n = `` + e;
            },
            stopTracking: function () {
              ((e._valueTracker = null), delete e[t]);
            },
          }
        );
      }
    }
    function It(e) {
      if (!e._valueTracker) {
        var t = Pt(e) ? `checked` : `value`;
        e._valueTracker = Ft(e, t, `` + e[t]);
      }
    }
    function Lt(e) {
      if (!e) return !1;
      var t = e._valueTracker;
      if (!t) return !0;
      var n = t.getValue(),
        r = ``;
      return (
        e && (r = Pt(e) ? (e.checked ? `true` : `false`) : e.value),
        (e = r),
        e === n ? !1 : (t.setValue(e), !0)
      );
    }
    function Rt(e) {
      if (((e ||= typeof document < `u` ? document : void 0), e === void 0)) return null;
      try {
        return e.activeElement || e.body;
      } catch {
        return e.body;
      }
    }
    var zt = /[\n"\\]/g;
    function Bt(e) {
      return e.replace(zt, function (e) {
        return `\\` + e.charCodeAt(0).toString(16) + ` `;
      });
    }
    function Vt(e, t, n, r, i, a, o, s) {
      ((e.name = ``),
        o != null && typeof o != `function` && typeof o != `symbol` && typeof o != `boolean`
          ? (e.type = o)
          : e.removeAttribute(`type`),
        t == null
          ? (o !== `submit` && o !== `reset`) || e.removeAttribute(`value`)
          : o === `number`
            ? ((t === 0 && e.value === ``) || e.value != t) && (e.value = `` + Nt(t))
            : e.value !== `` + Nt(t) && (e.value = `` + Nt(t)),
        t == null
          ? n == null
            ? r != null && e.removeAttribute(`value`)
            : Ut(e, o, Nt(n))
          : Ut(e, o, Nt(t)),
        i == null && a != null && (e.defaultChecked = !!a),
        i != null && (e.checked = i && typeof i != `function` && typeof i != `symbol`),
        s != null && typeof s != `function` && typeof s != `symbol` && typeof s != `boolean`
          ? (e.name = `` + Nt(s))
          : e.removeAttribute(`name`));
    }
    function Ht(e, t, n, r, i, a, o, s) {
      if (
        (a != null &&
          typeof a != `function` &&
          typeof a != `symbol` &&
          typeof a != `boolean` &&
          (e.type = a),
        t != null || n != null)
      ) {
        if (!((a !== `submit` && a !== `reset`) || t != null)) {
          It(e);
          return;
        }
        ((n = n == null ? `` : `` + Nt(n)),
          (t = t == null ? n : `` + Nt(t)),
          s || t === e.value || (e.value = t),
          (e.defaultValue = t));
      }
      ((r ??= i),
        (r = typeof r != `function` && typeof r != `symbol` && !!r),
        (e.checked = s ? e.checked : !!r),
        (e.defaultChecked = !!r),
        o != null &&
          typeof o != `function` &&
          typeof o != `symbol` &&
          typeof o != `boolean` &&
          (e.name = o),
        It(e));
    }
    function Ut(e, t, n) {
      (t === `number` && Rt(e.ownerDocument) === e) ||
        e.defaultValue === `` + n ||
        (e.defaultValue = `` + n);
    }
    function Wt(e, t, n, r) {
      if (((e = e.options), t)) {
        t = {};
        for (var i = 0; i < n.length; i++) t[`$` + n[i]] = !0;
        for (n = 0; n < e.length; n++)
          ((i = t.hasOwnProperty(`$` + e[n].value)),
            e[n].selected !== i && (e[n].selected = i),
            i && r && (e[n].defaultSelected = !0));
      } else {
        for (n = `` + Nt(n), t = null, i = 0; i < e.length; i++) {
          if (e[i].value === n) {
            ((e[i].selected = !0), r && (e[i].defaultSelected = !0));
            return;
          }
          t !== null || e[i].disabled || (t = e[i]);
        }
        t !== null && (t.selected = !0);
      }
    }
    function Gt(e, t, n) {
      if (t != null && ((t = `` + Nt(t)), t !== e.value && (e.value = t), n == null)) {
        e.defaultValue !== t && (e.defaultValue = t);
        return;
      }
      e.defaultValue = n == null ? `` : `` + Nt(n);
    }
    function Kt(e, t, n, r) {
      if (t == null) {
        if (r != null) {
          if (n != null) throw Error(s(92));
          if (ae(r)) {
            if (1 < r.length) throw Error(s(93));
            r = r[0];
          }
          n = r;
        }
        ((n ??= ``), (t = n));
      }
      ((n = Nt(t)),
        (e.defaultValue = n),
        (r = e.textContent),
        r === n && r !== `` && r !== null && (e.value = r),
        It(e));
    }
    function qt(e, t) {
      if (t) {
        var n = e.firstChild;
        if (n && n === e.lastChild && n.nodeType === 3) {
          n.nodeValue = t;
          return;
        }
      }
      e.textContent = t;
    }
    var Jt = new Set(
      `animationIterationCount aspectRatio borderImageOutset borderImageSlice borderImageWidth boxFlex boxFlexGroup boxOrdinalGroup columnCount columns flex flexGrow flexPositive flexShrink flexNegative flexOrder gridArea gridRow gridRowEnd gridRowSpan gridRowStart gridColumn gridColumnEnd gridColumnSpan gridColumnStart fontWeight lineClamp lineHeight opacity order orphans scale tabSize widows zIndex zoom fillOpacity floodOpacity stopOpacity strokeDasharray strokeDashoffset strokeMiterlimit strokeOpacity strokeWidth MozAnimationIterationCount MozBoxFlex MozBoxFlexGroup MozLineClamp msAnimationIterationCount msFlex msZoom msFlexGrow msFlexNegative msFlexOrder msFlexPositive msFlexShrink msGridColumn msGridColumnSpan msGridRow msGridRowSpan WebkitAnimationIterationCount WebkitBoxFlex WebKitBoxFlexGroup WebkitBoxOrdinalGroup WebkitColumnCount WebkitColumns WebkitFlex WebkitFlexGrow WebkitFlexPositive WebkitFlexShrink WebkitLineClamp`.split(
        ` `,
      ),
    );
    function Yt(e, t, n) {
      var r = t.indexOf(`--`) === 0;
      n == null || typeof n == `boolean` || n === ``
        ? r
          ? e.setProperty(t, ``)
          : t === `float`
            ? (e.cssFloat = ``)
            : (e[t] = ``)
        : r
          ? e.setProperty(t, n)
          : typeof n != `number` || n === 0 || Jt.has(t)
            ? t === `float`
              ? (e.cssFloat = n)
              : (e[t] = (`` + n).trim())
            : (e[t] = n + `px`);
    }
    function Xt(e, t, n) {
      if (t != null && typeof t != `object`) throw Error(s(62));
      if (((e = e.style), n != null)) {
        for (var r in n)
          !n.hasOwnProperty(r) ||
            (t != null && t.hasOwnProperty(r)) ||
            (r.indexOf(`--`) === 0
              ? e.setProperty(r, ``)
              : r === `float`
                ? (e.cssFloat = ``)
                : (e[r] = ``));
        for (var i in t) ((r = t[i]), t.hasOwnProperty(i) && n[i] !== r && Yt(e, i, r));
      } else for (var a in t) t.hasOwnProperty(a) && Yt(e, a, t[a]);
    }
    function Zt(e) {
      if (e.indexOf(`-`) === -1) return !1;
      switch (e) {
        case `annotation-xml`:
        case `color-profile`:
        case `font-face`:
        case `font-face-src`:
        case `font-face-uri`:
        case `font-face-format`:
        case `font-face-name`:
        case `missing-glyph`:
          return !1;
        default:
          return !0;
      }
    }
    var Qt = new Map([
        [`acceptCharset`, `accept-charset`],
        [`htmlFor`, `for`],
        [`httpEquiv`, `http-equiv`],
        [`crossOrigin`, `crossorigin`],
        [`accentHeight`, `accent-height`],
        [`alignmentBaseline`, `alignment-baseline`],
        [`arabicForm`, `arabic-form`],
        [`baselineShift`, `baseline-shift`],
        [`capHeight`, `cap-height`],
        [`clipPath`, `clip-path`],
        [`clipRule`, `clip-rule`],
        [`colorInterpolation`, `color-interpolation`],
        [`colorInterpolationFilters`, `color-interpolation-filters`],
        [`colorProfile`, `color-profile`],
        [`colorRendering`, `color-rendering`],
        [`dominantBaseline`, `dominant-baseline`],
        [`enableBackground`, `enable-background`],
        [`fillOpacity`, `fill-opacity`],
        [`fillRule`, `fill-rule`],
        [`floodColor`, `flood-color`],
        [`floodOpacity`, `flood-opacity`],
        [`fontFamily`, `font-family`],
        [`fontSize`, `font-size`],
        [`fontSizeAdjust`, `font-size-adjust`],
        [`fontStretch`, `font-stretch`],
        [`fontStyle`, `font-style`],
        [`fontVariant`, `font-variant`],
        [`fontWeight`, `font-weight`],
        [`glyphName`, `glyph-name`],
        [`glyphOrientationHorizontal`, `glyph-orientation-horizontal`],
        [`glyphOrientationVertical`, `glyph-orientation-vertical`],
        [`horizAdvX`, `horiz-adv-x`],
        [`horizOriginX`, `horiz-origin-x`],
        [`imageRendering`, `image-rendering`],
        [`letterSpacing`, `letter-spacing`],
        [`lightingColor`, `lighting-color`],
        [`markerEnd`, `marker-end`],
        [`markerMid`, `marker-mid`],
        [`markerStart`, `marker-start`],
        [`overlinePosition`, `overline-position`],
        [`overlineThickness`, `overline-thickness`],
        [`paintOrder`, `paint-order`],
        [`panose-1`, `panose-1`],
        [`pointerEvents`, `pointer-events`],
        [`renderingIntent`, `rendering-intent`],
        [`shapeRendering`, `shape-rendering`],
        [`stopColor`, `stop-color`],
        [`stopOpacity`, `stop-opacity`],
        [`strikethroughPosition`, `strikethrough-position`],
        [`strikethroughThickness`, `strikethrough-thickness`],
        [`strokeDasharray`, `stroke-dasharray`],
        [`strokeDashoffset`, `stroke-dashoffset`],
        [`strokeLinecap`, `stroke-linecap`],
        [`strokeLinejoin`, `stroke-linejoin`],
        [`strokeMiterlimit`, `stroke-miterlimit`],
        [`strokeOpacity`, `stroke-opacity`],
        [`strokeWidth`, `stroke-width`],
        [`textAnchor`, `text-anchor`],
        [`textDecoration`, `text-decoration`],
        [`textRendering`, `text-rendering`],
        [`transformOrigin`, `transform-origin`],
        [`underlinePosition`, `underline-position`],
        [`underlineThickness`, `underline-thickness`],
        [`unicodeBidi`, `unicode-bidi`],
        [`unicodeRange`, `unicode-range`],
        [`unitsPerEm`, `units-per-em`],
        [`vAlphabetic`, `v-alphabetic`],
        [`vHanging`, `v-hanging`],
        [`vIdeographic`, `v-ideographic`],
        [`vMathematical`, `v-mathematical`],
        [`vectorEffect`, `vector-effect`],
        [`vertAdvY`, `vert-adv-y`],
        [`vertOriginX`, `vert-origin-x`],
        [`vertOriginY`, `vert-origin-y`],
        [`wordSpacing`, `word-spacing`],
        [`writingMode`, `writing-mode`],
        [`xmlnsXlink`, `xmlns:xlink`],
        [`xHeight`, `x-height`],
      ]),
      $t =
        /^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*:/i;
    function en(e) {
      return $t.test(`` + e)
        ? `javascript:throw new Error('React has blocked a javascript: URL as a security precaution.')`
        : e;
    }
    function tn() {}
    var nn = null;
    function rn(e) {
      return (
        (e = e.target || e.srcElement || window),
        e.correspondingUseElement && (e = e.correspondingUseElement),
        e.nodeType === 3 ? e.parentNode : e
      );
    }
    var an = null,
      on = null;
    function sn(e) {
      var t = St(e);
      if (t && (e = t.stateNode)) {
        var n = e[pt] || null;
        a: switch (((e = t.stateNode), t.type)) {
          case `input`:
            if (
              (Vt(
                e,
                n.value,
                n.defaultValue,
                n.defaultValue,
                n.checked,
                n.defaultChecked,
                n.type,
                n.name,
              ),
              (t = n.name),
              n.type === `radio` && t != null)
            ) {
              for (n = e; n.parentNode; ) n = n.parentNode;
              for (
                n = n.querySelectorAll(`input[name="` + Bt(`` + t) + `"][type="radio"]`), t = 0;
                t < n.length;
                t++
              ) {
                var r = n[t];
                if (r !== e && r.form === e.form) {
                  var i = r[pt] || null;
                  if (!i) throw Error(s(90));
                  Vt(
                    r,
                    i.value,
                    i.defaultValue,
                    i.defaultValue,
                    i.checked,
                    i.defaultChecked,
                    i.type,
                    i.name,
                  );
                }
              }
              for (t = 0; t < n.length; t++) ((r = n[t]), r.form === e.form && Lt(r));
            }
            break a;
          case `textarea`:
            Gt(e, n.value, n.defaultValue);
            break a;
          case `select`:
            ((t = n.value), t != null && Wt(e, !!n.multiple, t, !1));
        }
      }
    }
    var cn = !1;
    function ln(e, t, n) {
      if (cn) return e(t, n);
      cn = !0;
      try {
        return e(t);
      } finally {
        if (
          ((cn = !1),
          (an !== null || on !== null) &&
            (bu(), an && ((t = an), (e = on), (on = an = null), sn(t), e)))
        )
          for (t = 0; t < e.length; t++) sn(e[t]);
      }
    }
    function L(e, t) {
      var n = e.stateNode;
      if (n === null) return null;
      var r = n[pt] || null;
      if (r === null) return null;
      n = r[t];
      a: switch (t) {
        case `onClick`:
        case `onClickCapture`:
        case `onDoubleClick`:
        case `onDoubleClickCapture`:
        case `onMouseDown`:
        case `onMouseDownCapture`:
        case `onMouseMove`:
        case `onMouseMoveCapture`:
        case `onMouseUp`:
        case `onMouseUpCapture`:
        case `onMouseEnter`:
          ((r = !r.disabled) ||
            ((e = e.type),
            (r = !(e === `button` || e === `input` || e === `select` || e === `textarea`))),
            (e = !r));
          break a;
        default:
          e = !1;
      }
      if (e) return null;
      if (n && typeof n != `function`) throw Error(s(231, t, typeof n));
      return n;
    }
    var un = !(
        typeof window > `u` ||
        window.document === void 0 ||
        window.document.createElement === void 0
      ),
      dn = !1;
    if (un)
      try {
        var fn = {};
        (Object.defineProperty(fn, 'passive', {
          get: function () {
            dn = !0;
          },
        }),
          window.addEventListener(`test`, fn, fn),
          window.removeEventListener(`test`, fn, fn));
      } catch {
        dn = !1;
      }
    var pn = null,
      mn = null,
      hn = null;
    function gn() {
      if (hn) return hn;
      var e,
        t = mn,
        n = t.length,
        r,
        i = `value` in pn ? pn.value : pn.textContent,
        a = i.length;
      for (e = 0; e < n && t[e] === i[e]; e++);
      var o = n - e;
      for (r = 1; r <= o && t[n - r] === i[a - r]; r++);
      return (hn = i.slice(e, 1 < r ? 1 - r : void 0));
    }
    function _n(e) {
      var t = e.keyCode;
      return (
        `charCode` in e ? ((e = e.charCode), e === 0 && t === 13 && (e = 13)) : (e = t),
        e === 10 && (e = 13),
        32 <= e || e === 13 ? e : 0
      );
    }
    function vn() {
      return !0;
    }
    function yn() {
      return !1;
    }
    function bn(e) {
      function t(t, n, r, i, a) {
        for (var o in ((this._reactName = t),
        (this._targetInst = r),
        (this.type = n),
        (this.nativeEvent = i),
        (this.target = a),
        (this.currentTarget = null),
        e))
          e.hasOwnProperty(o) && ((t = e[o]), (this[o] = t ? t(i) : i[o]));
        return (
          (this.isDefaultPrevented = (
            i.defaultPrevented == null ? !1 === i.returnValue : i.defaultPrevented
          )
            ? vn
            : yn),
          (this.isPropagationStopped = yn),
          this
        );
      }
      return (
        h(t.prototype, {
          preventDefault: function () {
            this.defaultPrevented = !0;
            var e = this.nativeEvent;
            e &&
              (e.preventDefault
                ? e.preventDefault()
                : typeof e.returnValue != `unknown` && (e.returnValue = !1),
              (this.isDefaultPrevented = vn));
          },
          stopPropagation: function () {
            var e = this.nativeEvent;
            e &&
              (e.stopPropagation
                ? e.stopPropagation()
                : typeof e.cancelBubble != `unknown` && (e.cancelBubble = !0),
              (this.isPropagationStopped = vn));
          },
          persist: function () {},
          isPersistent: vn,
        }),
        t
      );
    }
    var xn = {
        eventPhase: 0,
        bubbles: 0,
        cancelable: 0,
        timeStamp: function (e) {
          return e.timeStamp || Date.now();
        },
        defaultPrevented: 0,
        isTrusted: 0,
      },
      Sn = bn(xn),
      Cn = h({}, xn, { view: 0, detail: 0 }),
      wn = bn(Cn),
      Tn,
      En,
      Dn,
      On = h({}, Cn, {
        screenX: 0,
        screenY: 0,
        clientX: 0,
        clientY: 0,
        pageX: 0,
        pageY: 0,
        ctrlKey: 0,
        shiftKey: 0,
        altKey: 0,
        metaKey: 0,
        getModifierState: zn,
        button: 0,
        buttons: 0,
        relatedTarget: function (e) {
          return e.relatedTarget === void 0
            ? e.fromElement === e.srcElement
              ? e.toElement
              : e.fromElement
            : e.relatedTarget;
        },
        movementX: function (e) {
          return `movementX` in e
            ? e.movementX
            : (e !== Dn &&
                (Dn && e.type === `mousemove`
                  ? ((Tn = e.screenX - Dn.screenX), (En = e.screenY - Dn.screenY))
                  : (En = Tn = 0),
                (Dn = e)),
              Tn);
        },
        movementY: function (e) {
          return `movementY` in e ? e.movementY : En;
        },
      }),
      kn = bn(On),
      An = bn(h({}, On, { dataTransfer: 0 })),
      jn = bn(h({}, Cn, { relatedTarget: 0 })),
      Mn = bn(h({}, xn, { animationName: 0, elapsedTime: 0, pseudoElement: 0 })),
      Nn = bn(
        h({}, xn, {
          clipboardData: function (e) {
            return `clipboardData` in e ? e.clipboardData : window.clipboardData;
          },
        }),
      ),
      Pn = bn(h({}, xn, { data: 0 })),
      Fn = {
        Esc: `Escape`,
        Spacebar: ` `,
        Left: `ArrowLeft`,
        Up: `ArrowUp`,
        Right: `ArrowRight`,
        Down: `ArrowDown`,
        Del: `Delete`,
        Win: `OS`,
        Menu: `ContextMenu`,
        Apps: `ContextMenu`,
        Scroll: `ScrollLock`,
        MozPrintableKey: `Unidentified`,
      },
      In = {
        8: `Backspace`,
        9: `Tab`,
        12: `Clear`,
        13: `Enter`,
        16: `Shift`,
        17: `Control`,
        18: `Alt`,
        19: `Pause`,
        20: `CapsLock`,
        27: `Escape`,
        32: ` `,
        33: `PageUp`,
        34: `PageDown`,
        35: `End`,
        36: `Home`,
        37: `ArrowLeft`,
        38: `ArrowUp`,
        39: `ArrowRight`,
        40: `ArrowDown`,
        45: `Insert`,
        46: `Delete`,
        112: `F1`,
        113: `F2`,
        114: `F3`,
        115: `F4`,
        116: `F5`,
        117: `F6`,
        118: `F7`,
        119: `F8`,
        120: `F9`,
        121: `F10`,
        122: `F11`,
        123: `F12`,
        144: `NumLock`,
        145: `ScrollLock`,
        224: `Meta`,
      },
      Ln = { Alt: `altKey`, Control: `ctrlKey`, Meta: `metaKey`, Shift: `shiftKey` };
    function Rn(e) {
      var t = this.nativeEvent;
      return t.getModifierState ? t.getModifierState(e) : (e = Ln[e]) ? !!t[e] : !1;
    }
    function zn() {
      return Rn;
    }
    var Bn = bn(
        h({}, Cn, {
          key: function (e) {
            if (e.key) {
              var t = Fn[e.key] || e.key;
              if (t !== `Unidentified`) return t;
            }
            return e.type === `keypress`
              ? ((e = _n(e)), e === 13 ? `Enter` : String.fromCharCode(e))
              : e.type === `keydown` || e.type === `keyup`
                ? In[e.keyCode] || `Unidentified`
                : ``;
          },
          code: 0,
          location: 0,
          ctrlKey: 0,
          shiftKey: 0,
          altKey: 0,
          metaKey: 0,
          repeat: 0,
          locale: 0,
          getModifierState: zn,
          charCode: function (e) {
            return e.type === `keypress` ? _n(e) : 0;
          },
          keyCode: function (e) {
            return e.type === `keydown` || e.type === `keyup` ? e.keyCode : 0;
          },
          which: function (e) {
            return e.type === `keypress`
              ? _n(e)
              : e.type === `keydown` || e.type === `keyup`
                ? e.keyCode
                : 0;
          },
        }),
      ),
      Vn = bn(
        h({}, On, {
          pointerId: 0,
          width: 0,
          height: 0,
          pressure: 0,
          tangentialPressure: 0,
          tiltX: 0,
          tiltY: 0,
          twist: 0,
          pointerType: 0,
          isPrimary: 0,
        }),
      ),
      Hn = bn(
        h({}, Cn, {
          touches: 0,
          targetTouches: 0,
          changedTouches: 0,
          altKey: 0,
          metaKey: 0,
          ctrlKey: 0,
          shiftKey: 0,
          getModifierState: zn,
        }),
      ),
      Un = bn(h({}, xn, { propertyName: 0, elapsedTime: 0, pseudoElement: 0 })),
      Wn = bn(
        h({}, On, {
          deltaX: function (e) {
            return `deltaX` in e ? e.deltaX : `wheelDeltaX` in e ? -e.wheelDeltaX : 0;
          },
          deltaY: function (e) {
            return `deltaY` in e
              ? e.deltaY
              : `wheelDeltaY` in e
                ? -e.wheelDeltaY
                : `wheelDelta` in e
                  ? -e.wheelDelta
                  : 0;
          },
          deltaZ: 0,
          deltaMode: 0,
        }),
      ),
      Gn = bn(h({}, xn, { newState: 0, oldState: 0 })),
      Kn = [9, 13, 27, 32],
      qn = un && `CompositionEvent` in window,
      Jn = null;
    un && `documentMode` in document && (Jn = document.documentMode);
    var Yn = un && `TextEvent` in window && !Jn,
      Xn = un && (!qn || (Jn && 8 < Jn && 11 >= Jn)),
      Zn = ` `,
      Qn = !1;
    function $n(e, t) {
      switch (e) {
        case `keyup`:
          return Kn.indexOf(t.keyCode) !== -1;
        case `keydown`:
          return t.keyCode !== 229;
        case `keypress`:
        case `mousedown`:
        case `focusout`:
          return !0;
        default:
          return !1;
      }
    }
    function er(e) {
      return ((e = e.detail), typeof e == `object` && `data` in e ? e.data : null);
    }
    var tr = !1;
    function nr(e, t) {
      switch (e) {
        case `compositionend`:
          return er(t);
        case `keypress`:
          return t.which === 32 ? ((Qn = !0), Zn) : null;
        case `textInput`:
          return ((e = t.data), e === Zn && Qn ? null : e);
        default:
          return null;
      }
    }
    function rr(e, t) {
      if (tr)
        return e === `compositionend` || (!qn && $n(e, t))
          ? ((e = gn()), (hn = mn = pn = null), (tr = !1), e)
          : null;
      switch (e) {
        case `paste`:
          return null;
        case `keypress`:
          if (!(t.ctrlKey || t.altKey || t.metaKey) || (t.ctrlKey && t.altKey)) {
            if (t.char && 1 < t.char.length) return t.char;
            if (t.which) return String.fromCharCode(t.which);
          }
          return null;
        case `compositionend`:
          return Xn && t.locale !== `ko` ? null : t.data;
        default:
          return null;
      }
    }
    var ir = {
      color: !0,
      date: !0,
      datetime: !0,
      'datetime-local': !0,
      email: !0,
      month: !0,
      number: !0,
      password: !0,
      range: !0,
      search: !0,
      tel: !0,
      text: !0,
      time: !0,
      url: !0,
      week: !0,
    };
    function ar(e) {
      var t = e && e.nodeName && e.nodeName.toLowerCase();
      return t === `input` ? !!ir[e.type] : t === `textarea`;
    }
    function or(e, t, n, r) {
      (an ? (on ? on.push(r) : (on = [r])) : (an = r),
        (t = Ed(t, `onChange`)),
        0 < t.length &&
          ((n = new Sn(`onChange`, `change`, null, n, r)), e.push({ event: n, listeners: t })));
    }
    var sr = null,
      cr = null;
    function lr(e) {
      yd(e, 0);
    }
    function ur(e) {
      if (Lt(Ct(e))) return e;
    }
    function dr(e, t) {
      if (e === `change`) return t;
    }
    var fr = !1;
    if (un) {
      var pr;
      if (un) {
        var mr = `oninput` in document;
        if (!mr) {
          var hr = document.createElement(`div`);
          (hr.setAttribute(`oninput`, `return;`), (mr = typeof hr.oninput == `function`));
        }
        pr = mr;
      } else pr = !1;
      fr = pr && (!document.documentMode || 9 < document.documentMode);
    }
    function gr() {
      sr && (sr.detachEvent(`onpropertychange`, _r), (cr = sr = null));
    }
    function _r(e) {
      if (e.propertyName === `value` && ur(cr)) {
        var t = [];
        (or(t, cr, e, rn(e)), ln(lr, t));
      }
    }
    function vr(e, t, n) {
      e === `focusin`
        ? (gr(), (sr = t), (cr = n), sr.attachEvent(`onpropertychange`, _r))
        : e === `focusout` && gr();
    }
    function yr(e) {
      if (e === `selectionchange` || e === `keyup` || e === `keydown`) return ur(cr);
    }
    function br(e, t) {
      if (e === `click`) return ur(t);
    }
    function xr(e, t) {
      if (e === `input` || e === `change`) return ur(t);
    }
    function Sr(e, t) {
      return (e === t && (e !== 0 || 1 / e == 1 / t)) || (e !== e && t !== t);
    }
    var Cr = typeof Object.is == `function` ? Object.is : Sr;
    function wr(e, t) {
      if (Cr(e, t)) return !0;
      if (typeof e != `object` || !e || typeof t != `object` || !t) return !1;
      var n = Object.keys(e),
        r = Object.keys(t);
      if (n.length !== r.length) return !1;
      for (r = 0; r < n.length; r++) {
        var i = n[r];
        if (!Ee.call(t, i) || !Cr(e[i], t[i])) return !1;
      }
      return !0;
    }
    function Tr(e) {
      for (; e && e.firstChild; ) e = e.firstChild;
      return e;
    }
    function Er(e, t) {
      var n = Tr(e);
      e = 0;
      for (var r; n; ) {
        if (n.nodeType === 3) {
          if (((r = e + n.textContent.length), e <= t && r >= t)) return { node: n, offset: t - e };
          e = r;
        }
        a: {
          for (; n; ) {
            if (n.nextSibling) {
              n = n.nextSibling;
              break a;
            }
            n = n.parentNode;
          }
          n = void 0;
        }
        n = Tr(n);
      }
    }
    function Dr(e, t) {
      return e && t
        ? e === t
          ? !0
          : e && e.nodeType === 3
            ? !1
            : t && t.nodeType === 3
              ? Dr(e, t.parentNode)
              : `contains` in e
                ? e.contains(t)
                : e.compareDocumentPosition
                  ? !!(e.compareDocumentPosition(t) & 16)
                  : !1
        : !1;
    }
    function Or(e) {
      e =
        e != null && e.ownerDocument != null && e.ownerDocument.defaultView != null
          ? e.ownerDocument.defaultView
          : window;
      for (var t = Rt(e.document); t instanceof e.HTMLIFrameElement; ) {
        try {
          var n = typeof t.contentWindow.location.href == `string`;
        } catch {
          n = !1;
        }
        if (n) e = t.contentWindow;
        else break;
        t = Rt(e.document);
      }
      return t;
    }
    function kr(e) {
      var t = e && e.nodeName && e.nodeName.toLowerCase();
      return (
        t &&
        ((t === `input` &&
          (e.type === `text` ||
            e.type === `search` ||
            e.type === `tel` ||
            e.type === `url` ||
            e.type === `password`)) ||
          t === `textarea` ||
          e.contentEditable === `true`)
      );
    }
    var Ar = un && `documentMode` in document && 11 >= document.documentMode,
      jr = null,
      Mr = null,
      Nr = null,
      Pr = !1;
    function Fr(e, t, n) {
      var r = n.window === n ? n.document : n.nodeType === 9 ? n : n.ownerDocument;
      Pr ||
        jr == null ||
        jr !== Rt(r) ||
        ((r = jr),
        `selectionStart` in r && kr(r)
          ? (r = { start: r.selectionStart, end: r.selectionEnd })
          : ((r = ((r.ownerDocument && r.ownerDocument.defaultView) || window).getSelection()),
            (r = {
              anchorNode: r.anchorNode,
              anchorOffset: r.anchorOffset,
              focusNode: r.focusNode,
              focusOffset: r.focusOffset,
            })),
        (Nr && wr(Nr, r)) ||
          ((Nr = r),
          (r = Ed(Mr, `onSelect`)),
          0 < r.length &&
            ((t = new Sn(`onSelect`, `select`, null, t, n)),
            e.push({ event: t, listeners: r }),
            (t.target = jr))));
    }
    function Ir(e, t) {
      var n = {};
      return (
        (n[e.toLowerCase()] = t.toLowerCase()),
        (n[`Webkit` + e] = `webkit` + t),
        (n[`Moz` + e] = `moz` + t),
        n
      );
    }
    var Lr = {
        animationend: Ir(`Animation`, `AnimationEnd`),
        animationiteration: Ir(`Animation`, `AnimationIteration`),
        animationstart: Ir(`Animation`, `AnimationStart`),
        transitionrun: Ir(`Transition`, `TransitionRun`),
        transitionstart: Ir(`Transition`, `TransitionStart`),
        transitioncancel: Ir(`Transition`, `TransitionCancel`),
        transitionend: Ir(`Transition`, `TransitionEnd`),
      },
      Rr = {},
      zr = {};
    un &&
      ((zr = document.createElement(`div`).style),
      `AnimationEvent` in window ||
        (delete Lr.animationend.animation,
        delete Lr.animationiteration.animation,
        delete Lr.animationstart.animation),
      `TransitionEvent` in window || delete Lr.transitionend.transition);
    function Br(e) {
      if (Rr[e]) return Rr[e];
      if (!Lr[e]) return e;
      var t = Lr[e],
        n;
      for (n in t) if (t.hasOwnProperty(n) && n in zr) return (Rr[e] = t[n]);
      return e;
    }
    var Vr = Br(`animationend`),
      Hr = Br(`animationiteration`),
      Ur = Br(`animationstart`),
      Wr = Br(`transitionrun`),
      Gr = Br(`transitionstart`),
      Kr = Br(`transitioncancel`),
      qr = Br(`transitionend`),
      Jr = new Map(),
      Yr =
        `abort auxClick beforeToggle cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel`.split(
          ` `,
        );
    Yr.push(`scrollEnd`);
    function Xr(e, t) {
      (Jr.set(e, t), I(t, [e]));
    }
    var Zr =
        typeof reportError == `function`
          ? reportError
          : function (e) {
              if (typeof window == `object` && typeof window.ErrorEvent == `function`) {
                var t = new window.ErrorEvent(`error`, {
                  bubbles: !0,
                  cancelable: !0,
                  message:
                    typeof e == `object` && e && typeof e.message == `string`
                      ? String(e.message)
                      : String(e),
                  error: e,
                });
                if (!window.dispatchEvent(t)) return;
              } else if (typeof process == `object` && typeof process.emit == `function`) {
                process.emit(`uncaughtException`, e);
                return;
              }
              console.error(e);
            },
      Qr = [],
      $r = 0,
      ei = 0;
    function ti() {
      for (var e = $r, t = (ei = $r = 0); t < e; ) {
        var n = Qr[t];
        Qr[t++] = null;
        var r = Qr[t];
        Qr[t++] = null;
        var i = Qr[t];
        Qr[t++] = null;
        var a = Qr[t];
        if (((Qr[t++] = null), r !== null && i !== null)) {
          var o = r.pending;
          (o === null ? (i.next = i) : ((i.next = o.next), (o.next = i)), (r.pending = i));
        }
        a !== 0 && ai(n, i, a);
      }
    }
    function ni(e, t, n, r) {
      ((Qr[$r++] = e),
        (Qr[$r++] = t),
        (Qr[$r++] = n),
        (Qr[$r++] = r),
        (ei |= r),
        (e.lanes |= r),
        (e = e.alternate),
        e !== null && (e.lanes |= r));
    }
    function ri(e, t, n, r) {
      return (ni(e, t, n, r), oi(e));
    }
    function ii(e, t) {
      return (ni(e, null, null, t), oi(e));
    }
    function ai(e, t, n) {
      e.lanes |= n;
      var r = e.alternate;
      r !== null && (r.lanes |= n);
      for (var i = !1, a = e.return; a !== null; )
        ((a.childLanes |= n),
          (r = a.alternate),
          r !== null && (r.childLanes |= n),
          a.tag === 22 && ((e = a.stateNode), e === null || e._visibility & 1 || (i = !0)),
          (e = a),
          (a = a.return));
      return e.tag === 3
        ? ((a = e.stateNode),
          i &&
            t !== null &&
            ((i = 31 - Ue(n)),
            (e = a.hiddenUpdates),
            (r = e[i]),
            r === null ? (e[i] = [t]) : r.push(t),
            (t.lane = n | 536870912)),
          a)
        : null;
    }
    function oi(e) {
      if (50 < du) throw ((du = 0), (fu = null), Error(s(185)));
      for (var t = e.return; t !== null; ) ((e = t), (t = e.return));
      return e.tag === 3 ? e.stateNode : null;
    }
    var si = {};
    function ci(e, t, n, r) {
      ((this.tag = e),
        (this.key = n),
        (this.sibling =
          this.child =
          this.return =
          this.stateNode =
          this.type =
          this.elementType =
            null),
        (this.index = 0),
        (this.refCleanup = this.ref = null),
        (this.pendingProps = t),
        (this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null),
        (this.mode = r),
        (this.subtreeFlags = this.flags = 0),
        (this.deletions = null),
        (this.childLanes = this.lanes = 0),
        (this.alternate = null));
    }
    function li(e, t, n, r) {
      return new ci(e, t, n, r);
    }
    function ui(e) {
      return ((e = e.prototype), !(!e || !e.isReactComponent));
    }
    function di(e, t) {
      var n = e.alternate;
      return (
        n === null
          ? ((n = li(e.tag, t, e.key, e.mode)),
            (n.elementType = e.elementType),
            (n.type = e.type),
            (n.stateNode = e.stateNode),
            (n.alternate = e),
            (e.alternate = n))
          : ((n.pendingProps = t),
            (n.type = e.type),
            (n.flags = 0),
            (n.subtreeFlags = 0),
            (n.deletions = null)),
        (n.flags = e.flags & 65011712),
        (n.childLanes = e.childLanes),
        (n.lanes = e.lanes),
        (n.child = e.child),
        (n.memoizedProps = e.memoizedProps),
        (n.memoizedState = e.memoizedState),
        (n.updateQueue = e.updateQueue),
        (t = e.dependencies),
        (n.dependencies = t === null ? null : { lanes: t.lanes, firstContext: t.firstContext }),
        (n.sibling = e.sibling),
        (n.index = e.index),
        (n.ref = e.ref),
        (n.refCleanup = e.refCleanup),
        n
      );
    }
    function fi(e, t) {
      e.flags &= 65011714;
      var n = e.alternate;
      return (
        n === null
          ? ((e.childLanes = 0),
            (e.lanes = t),
            (e.child = null),
            (e.subtreeFlags = 0),
            (e.memoizedProps = null),
            (e.memoizedState = null),
            (e.updateQueue = null),
            (e.dependencies = null),
            (e.stateNode = null))
          : ((e.childLanes = n.childLanes),
            (e.lanes = n.lanes),
            (e.child = n.child),
            (e.subtreeFlags = 0),
            (e.deletions = null),
            (e.memoizedProps = n.memoizedProps),
            (e.memoizedState = n.memoizedState),
            (e.updateQueue = n.updateQueue),
            (e.type = n.type),
            (t = n.dependencies),
            (e.dependencies =
              t === null ? null : { lanes: t.lanes, firstContext: t.firstContext })),
        e
      );
    }
    function pi(e, t, n, r, i, a) {
      var o = 0;
      if (((r = e), typeof e == `function`)) ui(e) && (o = 1);
      else if (typeof e == `string`)
        o = Uf(e, n, de.current) ? 26 : e === `html` || e === `head` || e === `body` ? 27 : 5;
      else
        a: switch (e) {
          case O:
            return ((e = li(31, n, t, i)), (e.elementType = O), (e.lanes = a), e);
          case y:
            return mi(n.children, i, a, t);
          case b:
            ((o = 8), (i |= 24));
            break;
          case x:
            return ((e = li(12, n, t, i | 2)), (e.elementType = x), (e.lanes = a), e);
          case T:
            return ((e = li(13, n, t, i)), (e.elementType = T), (e.lanes = a), e);
          case E:
            return ((e = li(19, n, t, i)), (e.elementType = E), (e.lanes = a), e);
          default:
            if (typeof e == `object` && e)
              switch (e.$$typeof) {
                case C:
                  o = 10;
                  break a;
                case S:
                  o = 9;
                  break a;
                case w:
                  o = 11;
                  break a;
                case ee:
                  o = 14;
                  break a;
                case D:
                  ((o = 16), (r = null));
                  break a;
              }
            ((o = 29), (n = Error(s(130, e === null ? `null` : typeof e, ``))), (r = null));
        }
      return ((t = li(o, n, t, i)), (t.elementType = e), (t.type = r), (t.lanes = a), t);
    }
    function mi(e, t, n, r) {
      return ((e = li(7, e, r, t)), (e.lanes = n), e);
    }
    function hi(e, t, n) {
      return ((e = li(6, e, null, t)), (e.lanes = n), e);
    }
    function gi(e) {
      var t = li(18, null, null, 0);
      return ((t.stateNode = e), t);
    }
    function _i(e, t, n) {
      return (
        (t = li(4, e.children === null ? [] : e.children, e.key, t)),
        (t.lanes = n),
        (t.stateNode = {
          containerInfo: e.containerInfo,
          pendingChildren: null,
          implementation: e.implementation,
        }),
        t
      );
    }
    var vi = new WeakMap();
    function yi(e, t) {
      if (typeof e == `object` && e) {
        var n = vi.get(e);
        return n === void 0 ? ((t = { value: e, source: t, stack: Te(t) }), vi.set(e, t), t) : n;
      }
      return { value: e, source: t, stack: Te(t) };
    }
    var bi = [],
      xi = 0,
      Si = null,
      Ci = 0,
      wi = [],
      Ti = 0,
      Ei = null,
      Di = 1,
      Oi = ``;
    function ki(e, t) {
      ((bi[xi++] = Ci), (bi[xi++] = Si), (Si = e), (Ci = t));
    }
    function Ai(e, t, n) {
      ((wi[Ti++] = Di), (wi[Ti++] = Oi), (wi[Ti++] = Ei), (Ei = e));
      var r = Di;
      e = Oi;
      var i = 32 - Ue(r) - 1;
      ((r &= ~(1 << i)), (n += 1));
      var a = 32 - Ue(t) + i;
      if (30 < a) {
        var o = i - (i % 5);
        ((a = (r & ((1 << o) - 1)).toString(32)),
          (r >>= o),
          (i -= o),
          (Di = (1 << (32 - Ue(t) + i)) | (n << i) | r),
          (Oi = a + e));
      } else ((Di = (1 << a) | (n << i) | r), (Oi = e));
    }
    function ji(e) {
      e.return !== null && (ki(e, 1), Ai(e, 1, 0));
    }
    function Mi(e) {
      for (; e === Si; ) ((Si = bi[--xi]), (bi[xi] = null), (Ci = bi[--xi]), (bi[xi] = null));
      for (; e === Ei; )
        ((Ei = wi[--Ti]),
          (wi[Ti] = null),
          (Oi = wi[--Ti]),
          (wi[Ti] = null),
          (Di = wi[--Ti]),
          (wi[Ti] = null));
    }
    function Ni(e, t) {
      ((wi[Ti++] = Di), (wi[Ti++] = Oi), (wi[Ti++] = Ei), (Di = t.id), (Oi = t.overflow), (Ei = e));
    }
    var Pi = null,
      R = null,
      z = !1,
      Fi = null,
      Ii = !1,
      Li = Error(s(519));
    function Ri(e) {
      throw (
        Wi(
          yi(
            Error(
              s(
                418,
                1 < arguments.length && arguments[1] !== void 0 && arguments[1] ? `text` : `HTML`,
                ``,
              ),
            ),
            e,
          ),
        ),
        Li
      );
    }
    function zi(e) {
      var t = e.stateNode,
        n = e.type,
        r = e.memoizedProps;
      switch (((t[ft] = e), (t[pt] = r), n)) {
        case `dialog`:
          (Q(`cancel`, t), Q(`close`, t));
          break;
        case `iframe`:
        case `object`:
        case `embed`:
          Q(`load`, t);
          break;
        case `video`:
        case `audio`:
          for (n = 0; n < _d.length; n++) Q(_d[n], t);
          break;
        case `source`:
          Q(`error`, t);
          break;
        case `img`:
        case `image`:
        case `link`:
          (Q(`error`, t), Q(`load`, t));
          break;
        case `details`:
          Q(`toggle`, t);
          break;
        case `input`:
          (Q(`invalid`, t),
            Ht(t, r.value, r.defaultValue, r.checked, r.defaultChecked, r.type, r.name, !0));
          break;
        case `select`:
          Q(`invalid`, t);
          break;
        case `textarea`:
          (Q(`invalid`, t), Kt(t, r.value, r.defaultValue, r.children));
      }
      ((n = r.children),
        (typeof n != `string` && typeof n != `number` && typeof n != `bigint`) ||
        t.textContent === `` + n ||
        !0 === r.suppressHydrationWarning ||
        Md(t.textContent, n)
          ? (r.popover != null && (Q(`beforetoggle`, t), Q(`toggle`, t)),
            r.onScroll != null && Q(`scroll`, t),
            r.onScrollEnd != null && Q(`scrollend`, t),
            r.onClick != null && (t.onclick = tn),
            (t = !0))
          : (t = !1),
        t || Ri(e, !0));
    }
    function Bi(e) {
      for (Pi = e.return; Pi; )
        switch (Pi.tag) {
          case 5:
          case 31:
          case 13:
            Ii = !1;
            return;
          case 27:
          case 3:
            Ii = !0;
            return;
          default:
            Pi = Pi.return;
        }
    }
    function Vi(e) {
      if (e !== Pi) return !1;
      if (!z) return (Bi(e), (z = !0), !1);
      var t = e.tag,
        n;
      if (
        ((n = t !== 3 && t !== 27) &&
          ((n = t === 5) &&
            ((n = e.type), (n = !(n !== `form` && n !== `button`) || Ud(e.type, e.memoizedProps))),
          (n = !n)),
        n && R && Ri(e),
        Bi(e),
        t === 13)
      ) {
        if (((e = e.memoizedState), (e = e === null ? null : e.dehydrated), !e))
          throw Error(s(317));
        R = uf(e);
      } else if (t === 31) {
        if (((e = e.memoizedState), (e = e === null ? null : e.dehydrated), !e))
          throw Error(s(317));
        R = uf(e);
      } else
        t === 27
          ? ((t = R), Zd(e.type) ? ((e = lf), (lf = null), (R = e)) : (R = t))
          : (R = Pi ? cf(e.stateNode.nextSibling) : null);
      return !0;
    }
    function Hi() {
      ((R = Pi = null), (z = !1));
    }
    function Ui() {
      var e = Fi;
      return (e !== null && (Zl === null ? (Zl = e) : Zl.push.apply(Zl, e), (Fi = null)), e);
    }
    function Wi(e) {
      Fi === null ? (Fi = [e]) : Fi.push(e);
    }
    var Gi = le(null),
      Ki = null,
      qi = null;
    function Ji(e, t, n) {
      (M(Gi, t._currentValue), (t._currentValue = n));
    }
    function Yi(e) {
      ((e._currentValue = Gi.current), ue(Gi));
    }
    function Xi(e, t, n) {
      for (; e !== null; ) {
        var r = e.alternate;
        if (
          ((e.childLanes & t) === t
            ? r !== null && (r.childLanes & t) !== t && (r.childLanes |= t)
            : ((e.childLanes |= t), r !== null && (r.childLanes |= t)),
          e === n)
        )
          break;
        e = e.return;
      }
    }
    function Zi(e, t, n, r) {
      var i = e.child;
      for (i !== null && (i.return = e); i !== null; ) {
        var a = i.dependencies;
        if (a !== null) {
          var o = i.child;
          a = a.firstContext;
          a: for (; a !== null; ) {
            var c = a;
            a = i;
            for (var l = 0; l < t.length; l++)
              if (c.context === t[l]) {
                ((a.lanes |= n),
                  (c = a.alternate),
                  c !== null && (c.lanes |= n),
                  Xi(a.return, n, e),
                  r || (o = null));
                break a;
              }
            a = c.next;
          }
        } else if (i.tag === 18) {
          if (((o = i.return), o === null)) throw Error(s(341));
          ((o.lanes |= n),
            (a = o.alternate),
            a !== null && (a.lanes |= n),
            Xi(o, n, e),
            (o = null));
        } else o = i.child;
        if (o !== null) o.return = i;
        else
          for (o = i; o !== null; ) {
            if (o === e) {
              o = null;
              break;
            }
            if (((i = o.sibling), i !== null)) {
              ((i.return = o.return), (o = i));
              break;
            }
            o = o.return;
          }
        i = o;
      }
    }
    function Qi(e, t, n, r) {
      e = null;
      for (var i = t, a = !1; i !== null; ) {
        if (!a) {
          if (i.flags & 524288) a = !0;
          else if (i.flags & 262144) break;
        }
        if (i.tag === 10) {
          var o = i.alternate;
          if (o === null) throw Error(s(387));
          if (((o = o.memoizedProps), o !== null)) {
            var c = i.type;
            Cr(i.pendingProps.value, o.value) || (e === null ? (e = [c]) : e.push(c));
          }
        } else if (i === me.current) {
          if (((o = i.alternate), o === null)) throw Error(s(387));
          o.memoizedState.memoizedState !== i.memoizedState.memoizedState &&
            (e === null ? (e = [Qf]) : e.push(Qf));
        }
        i = i.return;
      }
      (e !== null && Zi(t, e, n, r), (t.flags |= 262144));
    }
    function $i(e) {
      for (e = e.firstContext; e !== null; ) {
        if (!Cr(e.context._currentValue, e.memoizedValue)) return !0;
        e = e.next;
      }
      return !1;
    }
    function ea(e) {
      ((Ki = e), (qi = null), (e = e.dependencies), e !== null && (e.firstContext = null));
    }
    function ta(e) {
      return ra(Ki, e);
    }
    function na(e, t) {
      return (Ki === null && ea(e), ra(e, t));
    }
    function ra(e, t) {
      var n = t._currentValue;
      if (((t = { context: t, memoizedValue: n, next: null }), qi === null)) {
        if (e === null) throw Error(s(308));
        ((qi = t), (e.dependencies = { lanes: 0, firstContext: t }), (e.flags |= 524288));
      } else qi = qi.next = t;
      return n;
    }
    var ia =
        typeof AbortController < `u`
          ? AbortController
          : function () {
              var e = [],
                t = (this.signal = {
                  aborted: !1,
                  addEventListener: function (t, n) {
                    e.push(n);
                  },
                });
              this.abort = function () {
                ((t.aborted = !0),
                  e.forEach(function (e) {
                    return e();
                  }));
              };
            },
      aa = t.unstable_scheduleCallback,
      oa = t.unstable_NormalPriority,
      sa = {
        $$typeof: C,
        Consumer: null,
        Provider: null,
        _currentValue: null,
        _currentValue2: null,
        _threadCount: 0,
      };
    function ca() {
      return { controller: new ia(), data: new Map(), refCount: 0 };
    }
    function la(e) {
      (e.refCount--,
        e.refCount === 0 &&
          aa(oa, function () {
            e.controller.abort();
          }));
    }
    var ua = null,
      da = 0,
      fa = 0,
      pa = null;
    function ma(e, t) {
      if (ua === null) {
        var n = (ua = []);
        ((da = 0),
          (fa = dd()),
          (pa = {
            status: `pending`,
            value: void 0,
            then: function (e) {
              n.push(e);
            },
          }));
      }
      return (da++, t.then(ha, ha), t);
    }
    function ha() {
      if (--da === 0 && ua !== null) {
        pa !== null && (pa.status = `fulfilled`);
        var e = ua;
        ((ua = null), (fa = 0), (pa = null));
        for (var t = 0; t < e.length; t++) (0, e[t])();
      }
    }
    function ga(e, t) {
      var n = [],
        r = {
          status: `pending`,
          value: null,
          reason: null,
          then: function (e) {
            n.push(e);
          },
        };
      return (
        e.then(
          function () {
            ((r.status = `fulfilled`), (r.value = t));
            for (var e = 0; e < n.length; e++) (0, n[e])(t);
          },
          function (e) {
            for (r.status = `rejected`, r.reason = e, e = 0; e < n.length; e++) (0, n[e])(void 0);
          },
        ),
        r
      );
    }
    var _a = A.S;
    A.S = function (e, t) {
      ((eu = je()),
        typeof t == `object` && t && typeof t.then == `function` && ma(e, t),
        _a !== null && _a(e, t));
    };
    var va = le(null);
    function ya() {
      var e = va.current;
      return e === null ? q.pooledCache : e;
    }
    function ba(e, t) {
      t === null ? M(va, va.current) : M(va, t.pool);
    }
    function xa() {
      var e = ya();
      return e === null ? null : { parent: sa._currentValue, pool: e };
    }
    var Sa = Error(s(460)),
      Ca = Error(s(474)),
      wa = Error(s(542)),
      Ta = { then: function () {} };
    function Ea(e) {
      return ((e = e.status), e === `fulfilled` || e === `rejected`);
    }
    function Da(e, t, n) {
      switch (
        ((n = e[n]), n === void 0 ? e.push(t) : n !== t && (t.then(tn, tn), (t = n)), t.status)
      ) {
        case `fulfilled`:
          return t.value;
        case `rejected`:
          throw ((e = t.reason), ja(e), e);
        default:
          if (typeof t.status == `string`) t.then(tn, tn);
          else {
            if (((e = q), e !== null && 100 < e.shellSuspendCounter)) throw Error(s(482));
            ((e = t),
              (e.status = `pending`),
              e.then(
                function (e) {
                  if (t.status === `pending`) {
                    var n = t;
                    ((n.status = `fulfilled`), (n.value = e));
                  }
                },
                function (e) {
                  if (t.status === `pending`) {
                    var n = t;
                    ((n.status = `rejected`), (n.reason = e));
                  }
                },
              ));
          }
          switch (t.status) {
            case `fulfilled`:
              return t.value;
            case `rejected`:
              throw ((e = t.reason), ja(e), e);
          }
          throw ((ka = t), Sa);
      }
    }
    function Oa(e) {
      try {
        var t = e._init;
        return t(e._payload);
      } catch (e) {
        throw typeof e == `object` && e && typeof e.then == `function` ? ((ka = e), Sa) : e;
      }
    }
    var ka = null;
    function Aa() {
      if (ka === null) throw Error(s(459));
      var e = ka;
      return ((ka = null), e);
    }
    function ja(e) {
      if (e === Sa || e === wa) throw Error(s(483));
    }
    var Ma = null,
      Na = 0;
    function Pa(e) {
      var t = Na;
      return ((Na += 1), Ma === null && (Ma = []), Da(Ma, e, t));
    }
    function Fa(e, t) {
      ((t = t.props.ref), (e.ref = t === void 0 ? null : t));
    }
    function Ia(e, t) {
      throw t.$$typeof === g
        ? Error(s(525))
        : ((e = Object.prototype.toString.call(t)),
          Error(
            s(
              31,
              e === `[object Object]` ? `object with keys {` + Object.keys(t).join(`, `) + `}` : e,
            ),
          ));
    }
    function La(e) {
      function t(t, n) {
        if (e) {
          var r = t.deletions;
          r === null ? ((t.deletions = [n]), (t.flags |= 16)) : r.push(n);
        }
      }
      function n(n, r) {
        if (!e) return null;
        for (; r !== null; ) (t(n, r), (r = r.sibling));
        return null;
      }
      function r(e) {
        for (var t = new Map(); e !== null; )
          (e.key === null ? t.set(e.index, e) : t.set(e.key, e), (e = e.sibling));
        return t;
      }
      function i(e, t) {
        return ((e = di(e, t)), (e.index = 0), (e.sibling = null), e);
      }
      function a(t, n, r) {
        return (
          (t.index = r),
          e
            ? ((r = t.alternate),
              r === null
                ? ((t.flags |= 67108866), n)
                : ((r = r.index), r < n ? ((t.flags |= 67108866), n) : r))
            : ((t.flags |= 1048576), n)
        );
      }
      function o(t) {
        return (e && t.alternate === null && (t.flags |= 67108866), t);
      }
      function c(e, t, n, r) {
        return t === null || t.tag !== 6
          ? ((t = hi(n, e.mode, r)), (t.return = e), t)
          : ((t = i(t, n)), (t.return = e), t);
      }
      function l(e, t, n, r) {
        var a = n.type;
        return a === y
          ? d(e, t, n.props.children, r, n.key)
          : t !== null &&
              (t.elementType === a ||
                (typeof a == `object` && a && a.$$typeof === D && Oa(a) === t.type))
            ? ((t = i(t, n.props)), Fa(t, n), (t.return = e), t)
            : ((t = pi(n.type, n.key, n.props, null, e.mode, r)), Fa(t, n), (t.return = e), t);
      }
      function u(e, t, n, r) {
        return t === null ||
          t.tag !== 4 ||
          t.stateNode.containerInfo !== n.containerInfo ||
          t.stateNode.implementation !== n.implementation
          ? ((t = _i(n, e.mode, r)), (t.return = e), t)
          : ((t = i(t, n.children || [])), (t.return = e), t);
      }
      function d(e, t, n, r, a) {
        return t === null || t.tag !== 7
          ? ((t = mi(n, e.mode, r, a)), (t.return = e), t)
          : ((t = i(t, n)), (t.return = e), t);
      }
      function f(e, t, n) {
        if ((typeof t == `string` && t !== ``) || typeof t == `number` || typeof t == `bigint`)
          return ((t = hi(`` + t, e.mode, n)), (t.return = e), t);
        if (typeof t == `object` && t) {
          switch (t.$$typeof) {
            case _:
              return (
                (n = pi(t.type, t.key, t.props, null, e.mode, n)),
                Fa(n, t),
                (n.return = e),
                n
              );
            case v:
              return ((t = _i(t, e.mode, n)), (t.return = e), t);
            case D:
              return ((t = Oa(t)), f(e, t, n));
          }
          if (ae(t) || ne(t)) return ((t = mi(t, e.mode, n, null)), (t.return = e), t);
          if (typeof t.then == `function`) return f(e, Pa(t), n);
          if (t.$$typeof === C) return f(e, na(e, t), n);
          Ia(e, t);
        }
        return null;
      }
      function p(e, t, n, r) {
        var i = t === null ? null : t.key;
        if ((typeof n == `string` && n !== ``) || typeof n == `number` || typeof n == `bigint`)
          return i === null ? c(e, t, `` + n, r) : null;
        if (typeof n == `object` && n) {
          switch (n.$$typeof) {
            case _:
              return n.key === i ? l(e, t, n, r) : null;
            case v:
              return n.key === i ? u(e, t, n, r) : null;
            case D:
              return ((n = Oa(n)), p(e, t, n, r));
          }
          if (ae(n) || ne(n)) return i === null ? d(e, t, n, r, null) : null;
          if (typeof n.then == `function`) return p(e, t, Pa(n), r);
          if (n.$$typeof === C) return p(e, t, na(e, n), r);
          Ia(e, n);
        }
        return null;
      }
      function m(e, t, n, r, i) {
        if ((typeof r == `string` && r !== ``) || typeof r == `number` || typeof r == `bigint`)
          return ((e = e.get(n) || null), c(t, e, `` + r, i));
        if (typeof r == `object` && r) {
          switch (r.$$typeof) {
            case _:
              return ((e = e.get(r.key === null ? n : r.key) || null), l(t, e, r, i));
            case v:
              return ((e = e.get(r.key === null ? n : r.key) || null), u(t, e, r, i));
            case D:
              return ((r = Oa(r)), m(e, t, n, r, i));
          }
          if (ae(r) || ne(r)) return ((e = e.get(n) || null), d(t, e, r, i, null));
          if (typeof r.then == `function`) return m(e, t, n, Pa(r), i);
          if (r.$$typeof === C) return m(e, t, n, na(t, r), i);
          Ia(t, r);
        }
        return null;
      }
      function h(i, o, s, c) {
        for (
          var l = null, u = null, d = o, h = (o = 0), g = null;
          d !== null && h < s.length;
          h++
        ) {
          d.index > h ? ((g = d), (d = null)) : (g = d.sibling);
          var _ = p(i, d, s[h], c);
          if (_ === null) {
            d === null && (d = g);
            break;
          }
          (e && d && _.alternate === null && t(i, d),
            (o = a(_, o, h)),
            u === null ? (l = _) : (u.sibling = _),
            (u = _),
            (d = g));
        }
        if (h === s.length) return (n(i, d), z && ki(i, h), l);
        if (d === null) {
          for (; h < s.length; h++)
            ((d = f(i, s[h], c)),
              d !== null && ((o = a(d, o, h)), u === null ? (l = d) : (u.sibling = d), (u = d)));
          return (z && ki(i, h), l);
        }
        for (d = r(d); h < s.length; h++)
          ((g = m(d, i, h, s[h], c)),
            g !== null &&
              (e && g.alternate !== null && d.delete(g.key === null ? h : g.key),
              (o = a(g, o, h)),
              u === null ? (l = g) : (u.sibling = g),
              (u = g)));
        return (
          e &&
            d.forEach(function (e) {
              return t(i, e);
            }),
          z && ki(i, h),
          l
        );
      }
      function g(i, o, c, l) {
        if (c == null) throw Error(s(151));
        for (
          var u = null, d = null, h = o, g = (o = 0), _ = null, v = c.next();
          h !== null && !v.done;
          g++, v = c.next()
        ) {
          h.index > g ? ((_ = h), (h = null)) : (_ = h.sibling);
          var y = p(i, h, v.value, l);
          if (y === null) {
            h === null && (h = _);
            break;
          }
          (e && h && y.alternate === null && t(i, h),
            (o = a(y, o, g)),
            d === null ? (u = y) : (d.sibling = y),
            (d = y),
            (h = _));
        }
        if (v.done) return (n(i, h), z && ki(i, g), u);
        if (h === null) {
          for (; !v.done; g++, v = c.next())
            ((v = f(i, v.value, l)),
              v !== null && ((o = a(v, o, g)), d === null ? (u = v) : (d.sibling = v), (d = v)));
          return (z && ki(i, g), u);
        }
        for (h = r(h); !v.done; g++, v = c.next())
          ((v = m(h, i, g, v.value, l)),
            v !== null &&
              (e && v.alternate !== null && h.delete(v.key === null ? g : v.key),
              (o = a(v, o, g)),
              d === null ? (u = v) : (d.sibling = v),
              (d = v)));
        return (
          e &&
            h.forEach(function (e) {
              return t(i, e);
            }),
          z && ki(i, g),
          u
        );
      }
      function b(e, r, a, c) {
        if (
          (typeof a == `object` && a && a.type === y && a.key === null && (a = a.props.children),
          typeof a == `object` && a)
        ) {
          switch (a.$$typeof) {
            case _:
              a: {
                for (var l = a.key; r !== null; ) {
                  if (r.key === l) {
                    if (((l = a.type), l === y)) {
                      if (r.tag === 7) {
                        (n(e, r.sibling), (c = i(r, a.props.children)), (c.return = e), (e = c));
                        break a;
                      }
                    } else if (
                      r.elementType === l ||
                      (typeof l == `object` && l && l.$$typeof === D && Oa(l) === r.type)
                    ) {
                      (n(e, r.sibling), (c = i(r, a.props)), Fa(c, a), (c.return = e), (e = c));
                      break a;
                    }
                    n(e, r);
                    break;
                  } else t(e, r);
                  r = r.sibling;
                }
                a.type === y
                  ? ((c = mi(a.props.children, e.mode, c, a.key)), (c.return = e), (e = c))
                  : ((c = pi(a.type, a.key, a.props, null, e.mode, c)),
                    Fa(c, a),
                    (c.return = e),
                    (e = c));
              }
              return o(e);
            case v:
              a: {
                for (l = a.key; r !== null; ) {
                  if (r.key === l)
                    if (
                      r.tag === 4 &&
                      r.stateNode.containerInfo === a.containerInfo &&
                      r.stateNode.implementation === a.implementation
                    ) {
                      (n(e, r.sibling), (c = i(r, a.children || [])), (c.return = e), (e = c));
                      break a;
                    } else {
                      n(e, r);
                      break;
                    }
                  else t(e, r);
                  r = r.sibling;
                }
                ((c = _i(a, e.mode, c)), (c.return = e), (e = c));
              }
              return o(e);
            case D:
              return ((a = Oa(a)), b(e, r, a, c));
          }
          if (ae(a)) return h(e, r, a, c);
          if (ne(a)) {
            if (((l = ne(a)), typeof l != `function`)) throw Error(s(150));
            return ((a = l.call(a)), g(e, r, a, c));
          }
          if (typeof a.then == `function`) return b(e, r, Pa(a), c);
          if (a.$$typeof === C) return b(e, r, na(e, a), c);
          Ia(e, a);
        }
        return (typeof a == `string` && a !== ``) || typeof a == `number` || typeof a == `bigint`
          ? ((a = `` + a),
            r !== null && r.tag === 6
              ? (n(e, r.sibling), (c = i(r, a)), (c.return = e), (e = c))
              : (n(e, r), (c = hi(a, e.mode, c)), (c.return = e), (e = c)),
            o(e))
          : n(e, r);
      }
      return function (e, t, n, r) {
        try {
          Na = 0;
          var i = b(e, t, n, r);
          return ((Ma = null), i);
        } catch (t) {
          if (t === Sa || t === wa) throw t;
          var a = li(29, t, null, e.mode);
          return ((a.lanes = r), (a.return = e), a);
        }
      };
    }
    var Ra = La(!0),
      za = La(!1),
      Ba = !1;
    function Va(e) {
      e.updateQueue = {
        baseState: e.memoizedState,
        firstBaseUpdate: null,
        lastBaseUpdate: null,
        shared: { pending: null, lanes: 0, hiddenCallbacks: null },
        callbacks: null,
      };
    }
    function Ha(e, t) {
      ((e = e.updateQueue),
        t.updateQueue === e &&
          (t.updateQueue = {
            baseState: e.baseState,
            firstBaseUpdate: e.firstBaseUpdate,
            lastBaseUpdate: e.lastBaseUpdate,
            shared: e.shared,
            callbacks: null,
          }));
    }
    function Ua(e) {
      return { lane: e, tag: 0, payload: null, callback: null, next: null };
    }
    function Wa(e, t, n) {
      var r = e.updateQueue;
      if (r === null) return null;
      if (((r = r.shared), K & 2)) {
        var i = r.pending;
        return (
          i === null ? (t.next = t) : ((t.next = i.next), (i.next = t)),
          (r.pending = t),
          (t = oi(e)),
          ai(e, null, n),
          t
        );
      }
      return (ni(e, r, t, n), oi(e));
    }
    function Ga(e, t, n) {
      if (((t = t.updateQueue), t !== null && ((t = t.shared), n & 4194048))) {
        var r = t.lanes;
        ((r &= e.pendingLanes), (n |= r), (t.lanes = n), at(e, n));
      }
    }
    function Ka(e, t) {
      var n = e.updateQueue,
        r = e.alternate;
      if (r !== null && ((r = r.updateQueue), n === r)) {
        var i = null,
          a = null;
        if (((n = n.firstBaseUpdate), n !== null)) {
          do {
            var o = { lane: n.lane, tag: n.tag, payload: n.payload, callback: null, next: null };
            (a === null ? (i = a = o) : (a = a.next = o), (n = n.next));
          } while (n !== null);
          a === null ? (i = a = t) : (a = a.next = t);
        } else i = a = t;
        ((n = {
          baseState: r.baseState,
          firstBaseUpdate: i,
          lastBaseUpdate: a,
          shared: r.shared,
          callbacks: r.callbacks,
        }),
          (e.updateQueue = n));
        return;
      }
      ((e = n.lastBaseUpdate),
        e === null ? (n.firstBaseUpdate = t) : (e.next = t),
        (n.lastBaseUpdate = t));
    }
    var qa = !1;
    function Ja() {
      if (qa) {
        var e = pa;
        if (e !== null) throw e;
      }
    }
    function Ya(e, t, n, r) {
      qa = !1;
      var i = e.updateQueue;
      Ba = !1;
      var a = i.firstBaseUpdate,
        o = i.lastBaseUpdate,
        s = i.shared.pending;
      if (s !== null) {
        i.shared.pending = null;
        var c = s,
          l = c.next;
        ((c.next = null), o === null ? (a = l) : (o.next = l), (o = c));
        var u = e.alternate;
        u !== null &&
          ((u = u.updateQueue),
          (s = u.lastBaseUpdate),
          s !== o && (s === null ? (u.firstBaseUpdate = l) : (s.next = l), (u.lastBaseUpdate = c)));
      }
      if (a !== null) {
        var d = i.baseState;
        ((o = 0), (u = l = c = null), (s = a));
        do {
          var f = s.lane & -536870913,
            p = f !== s.lane;
          if (p ? (Y & f) === f : (r & f) === f) {
            (f !== 0 && f === fa && (qa = !0),
              u !== null &&
                (u = u.next =
                  { lane: 0, tag: s.tag, payload: s.payload, callback: null, next: null }));
            a: {
              var m = e,
                g = s;
              f = t;
              var _ = n;
              switch (g.tag) {
                case 1:
                  if (((m = g.payload), typeof m == `function`)) {
                    d = m.call(_, d, f);
                    break a;
                  }
                  d = m;
                  break a;
                case 3:
                  m.flags = (m.flags & -65537) | 128;
                case 0:
                  if (
                    ((m = g.payload), (f = typeof m == `function` ? m.call(_, d, f) : m), f == null)
                  )
                    break a;
                  d = h({}, d, f);
                  break a;
                case 2:
                  Ba = !0;
              }
            }
            ((f = s.callback),
              f !== null &&
                ((e.flags |= 64),
                p && (e.flags |= 8192),
                (p = i.callbacks),
                p === null ? (i.callbacks = [f]) : p.push(f)));
          } else
            ((p = { lane: f, tag: s.tag, payload: s.payload, callback: s.callback, next: null }),
              u === null ? ((l = u = p), (c = d)) : (u = u.next = p),
              (o |= f));
          if (((s = s.next), s === null)) {
            if (((s = i.shared.pending), s === null)) break;
            ((p = s),
              (s = p.next),
              (p.next = null),
              (i.lastBaseUpdate = p),
              (i.shared.pending = null));
          }
        } while (1);
        (u === null && (c = d),
          (i.baseState = c),
          (i.firstBaseUpdate = l),
          (i.lastBaseUpdate = u),
          a === null && (i.shared.lanes = 0),
          (Gl |= o),
          (e.lanes = o),
          (e.memoizedState = d));
      }
    }
    function Xa(e, t) {
      if (typeof e != `function`) throw Error(s(191, e));
      e.call(t);
    }
    function Za(e, t) {
      var n = e.callbacks;
      if (n !== null) for (e.callbacks = null, e = 0; e < n.length; e++) Xa(n[e], t);
    }
    var Qa = le(null),
      $a = le(0);
    function eo(e, t) {
      ((e = Ul), M($a, e), M(Qa, t), (Ul = e | t.baseLanes));
    }
    function to() {
      (M($a, Ul), M(Qa, Qa.current));
    }
    function no() {
      ((Ul = $a.current), ue(Qa), ue($a));
    }
    var ro = le(null),
      io = null;
    function ao(e) {
      var t = e.alternate;
      (M(B, B.current & 1),
        M(ro, e),
        io === null && (t === null || Qa.current !== null || t.memoizedState !== null) && (io = e));
    }
    function oo(e) {
      (M(B, B.current), M(ro, e), io === null && (io = e));
    }
    function so(e) {
      e.tag === 22 ? (M(B, B.current), M(ro, e), io === null && (io = e)) : co(e);
    }
    function co() {
      (M(B, B.current), M(ro, ro.current));
    }
    function lo(e) {
      (ue(ro), io === e && (io = null), ue(B));
    }
    var B = le(0);
    function uo(e) {
      for (var t = e; t !== null; ) {
        if (t.tag === 13) {
          var n = t.memoizedState;
          if (n !== null && ((n = n.dehydrated), n === null || af(n) || of(n))) return t;
        } else if (
          t.tag === 19 &&
          (t.memoizedProps.revealOrder === `forwards` ||
            t.memoizedProps.revealOrder === `backwards` ||
            t.memoizedProps.revealOrder === `unstable_legacy-backwards` ||
            t.memoizedProps.revealOrder === `together`)
        ) {
          if (t.flags & 128) return t;
        } else if (t.child !== null) {
          ((t.child.return = t), (t = t.child));
          continue;
        }
        if (t === e) break;
        for (; t.sibling === null; ) {
          if (t.return === null || t.return === e) return null;
          t = t.return;
        }
        ((t.sibling.return = t.return), (t = t.sibling));
      }
      return null;
    }
    var fo = 0,
      V = null,
      H = null,
      po = null,
      mo = !1,
      ho = !1,
      go = !1,
      _o = 0,
      vo = 0,
      yo = null,
      bo = 0;
    function xo() {
      throw Error(s(321));
    }
    function So(e, t) {
      if (t === null) return !1;
      for (var n = 0; n < t.length && n < e.length; n++) if (!Cr(e[n], t[n])) return !1;
      return !0;
    }
    function Co(e, t, n, r, i, a) {
      return (
        (fo = a),
        (V = t),
        (t.memoizedState = null),
        (t.updateQueue = null),
        (t.lanes = 0),
        (A.H = e === null || e.memoizedState === null ? zs : Bs),
        (go = !1),
        (a = n(r, i)),
        (go = !1),
        ho && (a = To(t, n, r, i)),
        wo(e),
        a
      );
    }
    function wo(e) {
      A.H = Rs;
      var t = H !== null && H.next !== null;
      if (((fo = 0), (po = H = V = null), (mo = !1), (vo = 0), (yo = null), t)) throw Error(s(300));
      e === null || rc || ((e = e.dependencies), e !== null && $i(e) && (rc = !0));
    }
    function To(e, t, n, r) {
      V = e;
      var i = 0;
      do {
        if ((ho && (yo = null), (vo = 0), (ho = !1), 25 <= i)) throw Error(s(301));
        if (((i += 1), (po = H = null), e.updateQueue != null)) {
          var a = e.updateQueue;
          ((a.lastEffect = null),
            (a.events = null),
            (a.stores = null),
            a.memoCache != null && (a.memoCache.index = 0));
        }
        ((A.H = Vs), (a = t(n, r)));
      } while (ho);
      return a;
    }
    function Eo() {
      var e = A.H,
        t = e.useState()[0];
      return (
        (t = typeof t.then == `function` ? Mo(t) : t),
        (e = e.useState()[0]),
        (H === null ? null : H.memoizedState) !== e && (V.flags |= 1024),
        t
      );
    }
    function Do() {
      var e = _o !== 0;
      return ((_o = 0), e);
    }
    function Oo(e, t, n) {
      ((t.updateQueue = e.updateQueue), (t.flags &= -2053), (e.lanes &= ~n));
    }
    function ko(e) {
      if (mo) {
        for (e = e.memoizedState; e !== null; ) {
          var t = e.queue;
          (t !== null && (t.pending = null), (e = e.next));
        }
        mo = !1;
      }
      ((fo = 0), (po = H = V = null), (ho = !1), (vo = _o = 0), (yo = null));
    }
    function Ao() {
      var e = { memoizedState: null, baseState: null, baseQueue: null, queue: null, next: null };
      return (po === null ? (V.memoizedState = po = e) : (po = po.next = e), po);
    }
    function U() {
      if (H === null) {
        var e = V.alternate;
        e = e === null ? null : e.memoizedState;
      } else e = H.next;
      var t = po === null ? V.memoizedState : po.next;
      if (t !== null) ((po = t), (H = e));
      else {
        if (e === null) throw V.alternate === null ? Error(s(467)) : Error(s(310));
        ((H = e),
          (e = {
            memoizedState: H.memoizedState,
            baseState: H.baseState,
            baseQueue: H.baseQueue,
            queue: H.queue,
            next: null,
          }),
          po === null ? (V.memoizedState = po = e) : (po = po.next = e));
      }
      return po;
    }
    function jo() {
      return { lastEffect: null, events: null, stores: null, memoCache: null };
    }
    function Mo(e) {
      var t = vo;
      return (
        (vo += 1),
        yo === null && (yo = []),
        (e = Da(yo, e, t)),
        (t = V),
        (po === null ? t.memoizedState : po.next) === null &&
          ((t = t.alternate), (A.H = t === null || t.memoizedState === null ? zs : Bs)),
        e
      );
    }
    function No(e) {
      if (typeof e == `object` && e) {
        if (typeof e.then == `function`) return Mo(e);
        if (e.$$typeof === C) return ta(e);
      }
      throw Error(s(438, String(e)));
    }
    function Po(e) {
      var t = null,
        n = V.updateQueue;
      if ((n !== null && (t = n.memoCache), t == null)) {
        var r = V.alternate;
        r !== null &&
          ((r = r.updateQueue),
          r !== null &&
            ((r = r.memoCache),
            r != null &&
              (t = {
                data: r.data.map(function (e) {
                  return e.slice();
                }),
                index: 0,
              })));
      }
      if (
        ((t ??= { data: [], index: 0 }),
        n === null && ((n = jo()), (V.updateQueue = n)),
        (n.memoCache = t),
        (n = t.data[t.index]),
        n === void 0)
      )
        for (n = t.data[t.index] = Array(e), r = 0; r < e; r++) n[r] = k;
      return (t.index++, n);
    }
    function Fo(e, t) {
      return typeof t == `function` ? t(e) : t;
    }
    function Io(e) {
      return Lo(U(), H, e);
    }
    function Lo(e, t, n) {
      var r = e.queue;
      if (r === null) throw Error(s(311));
      r.lastRenderedReducer = n;
      var i = e.baseQueue,
        a = r.pending;
      if (a !== null) {
        if (i !== null) {
          var o = i.next;
          ((i.next = a.next), (a.next = o));
        }
        ((t.baseQueue = i = a), (r.pending = null));
      }
      if (((a = e.baseState), i === null)) e.memoizedState = a;
      else {
        t = i.next;
        var c = (o = null),
          l = null,
          u = t,
          d = !1;
        do {
          var f = u.lane & -536870913;
          if (f === u.lane ? (fo & f) === f : (Y & f) === f) {
            var p = u.revertLane;
            if (p === 0)
              (l !== null &&
                (l = l.next =
                  {
                    lane: 0,
                    revertLane: 0,
                    gesture: null,
                    action: u.action,
                    hasEagerState: u.hasEagerState,
                    eagerState: u.eagerState,
                    next: null,
                  }),
                f === fa && (d = !0));
            else if ((fo & p) === p) {
              ((u = u.next), p === fa && (d = !0));
              continue;
            } else
              ((f = {
                lane: 0,
                revertLane: u.revertLane,
                gesture: null,
                action: u.action,
                hasEagerState: u.hasEagerState,
                eagerState: u.eagerState,
                next: null,
              }),
                l === null ? ((c = l = f), (o = a)) : (l = l.next = f),
                (V.lanes |= p),
                (Gl |= p));
            ((f = u.action), go && n(a, f), (a = u.hasEagerState ? u.eagerState : n(a, f)));
          } else
            ((p = {
              lane: f,
              revertLane: u.revertLane,
              gesture: u.gesture,
              action: u.action,
              hasEagerState: u.hasEagerState,
              eagerState: u.eagerState,
              next: null,
            }),
              l === null ? ((c = l = p), (o = a)) : (l = l.next = p),
              (V.lanes |= f),
              (Gl |= f));
          u = u.next;
        } while (u !== null && u !== t);
        if (
          (l === null ? (o = a) : (l.next = c),
          !Cr(a, e.memoizedState) && ((rc = !0), d && ((n = pa), n !== null)))
        )
          throw n;
        ((e.memoizedState = a), (e.baseState = o), (e.baseQueue = l), (r.lastRenderedState = a));
      }
      return (i === null && (r.lanes = 0), [e.memoizedState, r.dispatch]);
    }
    function Ro(e) {
      var t = U(),
        n = t.queue;
      if (n === null) throw Error(s(311));
      n.lastRenderedReducer = e;
      var r = n.dispatch,
        i = n.pending,
        a = t.memoizedState;
      if (i !== null) {
        n.pending = null;
        var o = (i = i.next);
        do ((a = e(a, o.action)), (o = o.next));
        while (o !== i);
        (Cr(a, t.memoizedState) || (rc = !0),
          (t.memoizedState = a),
          t.baseQueue === null && (t.baseState = a),
          (n.lastRenderedState = a));
      }
      return [a, r];
    }
    function zo(e, t, n) {
      var r = V,
        i = U(),
        a = z;
      if (a) {
        if (n === void 0) throw Error(s(407));
        n = n();
      } else n = t();
      var o = !Cr((H || i).memoizedState, n);
      if (
        (o && ((i.memoizedState = n), (rc = !0)),
        (i = i.queue),
        us(Ho.bind(null, r, i, e), [e]),
        i.getSnapshot !== t || o || (po !== null && po.memoizedState.tag & 1))
      ) {
        if (
          ((r.flags |= 2048),
          as(9, { destroy: void 0 }, Vo.bind(null, r, i, n, t), null),
          q === null)
        )
          throw Error(s(349));
        a || fo & 127 || Bo(r, t, n);
      }
      return n;
    }
    function Bo(e, t, n) {
      ((e.flags |= 16384),
        (e = { getSnapshot: t, value: n }),
        (t = V.updateQueue),
        t === null
          ? ((t = jo()), (V.updateQueue = t), (t.stores = [e]))
          : ((n = t.stores), n === null ? (t.stores = [e]) : n.push(e)));
    }
    function Vo(e, t, n, r) {
      ((t.value = n), (t.getSnapshot = r), Uo(t) && Wo(e));
    }
    function Ho(e, t, n) {
      return n(function () {
        Uo(t) && Wo(e);
      });
    }
    function Uo(e) {
      var t = e.getSnapshot;
      e = e.value;
      try {
        var n = t();
        return !Cr(e, n);
      } catch {
        return !0;
      }
    }
    function Wo(e) {
      var t = ii(e, 2);
      t !== null && hu(t, e, 2);
    }
    function Go(e) {
      var t = Ao();
      if (typeof e == `function`) {
        var n = e;
        if (((e = n()), go)) {
          He(!0);
          try {
            n();
          } finally {
            He(!1);
          }
        }
      }
      return (
        (t.memoizedState = t.baseState = e),
        (t.queue = {
          pending: null,
          lanes: 0,
          dispatch: null,
          lastRenderedReducer: Fo,
          lastRenderedState: e,
        }),
        t
      );
    }
    function Ko(e, t, n, r) {
      return ((e.baseState = n), Lo(e, H, typeof r == `function` ? r : Fo));
    }
    function qo(e, t, n, r, i) {
      if (Fs(e)) throw Error(s(485));
      if (((e = t.action), e !== null)) {
        var a = {
          payload: i,
          action: e,
          next: null,
          isTransition: !0,
          status: `pending`,
          value: null,
          reason: null,
          listeners: [],
          then: function (e) {
            a.listeners.push(e);
          },
        };
        (A.T === null ? (a.isTransition = !1) : n(!0),
          r(a),
          (n = t.pending),
          n === null
            ? ((a.next = t.pending = a), Jo(t, a))
            : ((a.next = n.next), (t.pending = n.next = a)));
      }
    }
    function Jo(e, t) {
      var n = t.action,
        r = t.payload,
        i = e.state;
      if (t.isTransition) {
        var a = A.T,
          o = {};
        A.T = o;
        try {
          var s = n(i, r),
            c = A.S;
          (c !== null && c(o, s), Yo(e, t, s));
        } catch (n) {
          Zo(e, t, n);
        } finally {
          (a !== null && o.types !== null && (a.types = o.types), (A.T = a));
        }
      } else
        try {
          ((a = n(i, r)), Yo(e, t, a));
        } catch (n) {
          Zo(e, t, n);
        }
    }
    function Yo(e, t, n) {
      typeof n == `object` && n && typeof n.then == `function`
        ? n.then(
            function (n) {
              Xo(e, t, n);
            },
            function (n) {
              return Zo(e, t, n);
            },
          )
        : Xo(e, t, n);
    }
    function Xo(e, t, n) {
      ((t.status = `fulfilled`),
        (t.value = n),
        Qo(t),
        (e.state = n),
        (t = e.pending),
        t !== null &&
          ((n = t.next), n === t ? (e.pending = null) : ((n = n.next), (t.next = n), Jo(e, n))));
    }
    function Zo(e, t, n) {
      var r = e.pending;
      if (((e.pending = null), r !== null)) {
        r = r.next;
        do ((t.status = `rejected`), (t.reason = n), Qo(t), (t = t.next));
        while (t !== r);
      }
      e.action = null;
    }
    function Qo(e) {
      e = e.listeners;
      for (var t = 0; t < e.length; t++) (0, e[t])();
    }
    function $o(e, t) {
      return t;
    }
    function es(e, t) {
      if (z) {
        var n = q.formState;
        if (n !== null) {
          a: {
            var r = V;
            if (z) {
              if (R) {
                b: {
                  for (var i = R, a = Ii; i.nodeType !== 8; ) {
                    if (!a) {
                      i = null;
                      break b;
                    }
                    if (((i = cf(i.nextSibling)), i === null)) {
                      i = null;
                      break b;
                    }
                  }
                  ((a = i.data), (i = a === `F!` || a === `F` ? i : null));
                }
                if (i) {
                  ((R = cf(i.nextSibling)), (r = i.data === `F!`));
                  break a;
                }
              }
              Ri(r);
            }
            r = !1;
          }
          r && (t = n[0]);
        }
      }
      return (
        (n = Ao()),
        (n.memoizedState = n.baseState = t),
        (r = {
          pending: null,
          lanes: 0,
          dispatch: null,
          lastRenderedReducer: $o,
          lastRenderedState: t,
        }),
        (n.queue = r),
        (n = Ms.bind(null, V, r)),
        (r.dispatch = n),
        (r = Go(!1)),
        (a = Ps.bind(null, V, !1, r.queue)),
        (r = Ao()),
        (i = { state: t, dispatch: null, action: e, pending: null }),
        (r.queue = i),
        (n = qo.bind(null, V, i, a, n)),
        (i.dispatch = n),
        (r.memoizedState = e),
        [t, n, !1]
      );
    }
    function ts(e) {
      return ns(U(), H, e);
    }
    function ns(e, t, n) {
      if (
        ((t = Lo(e, t, $o)[0]),
        (e = Io(Fo)[0]),
        typeof t == `object` && t && typeof t.then == `function`)
      )
        try {
          var r = Mo(t);
        } catch (e) {
          throw e === Sa ? wa : e;
        }
      else r = t;
      t = U();
      var i = t.queue,
        a = i.dispatch;
      return (
        n !== t.memoizedState &&
          ((V.flags |= 2048), as(9, { destroy: void 0 }, rs.bind(null, i, n), null)),
        [r, a, e]
      );
    }
    function rs(e, t) {
      e.action = t;
    }
    function is(e) {
      var t = U(),
        n = H;
      if (n !== null) return ns(t, n, e);
      (U(), (t = t.memoizedState), (n = U()));
      var r = n.queue.dispatch;
      return ((n.memoizedState = e), [t, r, !1]);
    }
    function as(e, t, n, r) {
      return (
        (e = { tag: e, create: n, deps: r, inst: t, next: null }),
        (t = V.updateQueue),
        t === null && ((t = jo()), (V.updateQueue = t)),
        (n = t.lastEffect),
        n === null
          ? (t.lastEffect = e.next = e)
          : ((r = n.next), (n.next = e), (e.next = r), (t.lastEffect = e)),
        e
      );
    }
    function os() {
      return U().memoizedState;
    }
    function ss(e, t, n, r) {
      var i = Ao();
      ((V.flags |= e),
        (i.memoizedState = as(1 | t, { destroy: void 0 }, n, r === void 0 ? null : r)));
    }
    function cs(e, t, n, r) {
      var i = U();
      r = r === void 0 ? null : r;
      var a = i.memoizedState.inst;
      H !== null && r !== null && So(r, H.memoizedState.deps)
        ? (i.memoizedState = as(t, a, n, r))
        : ((V.flags |= e), (i.memoizedState = as(1 | t, a, n, r)));
    }
    function ls(e, t) {
      ss(8390656, 8, e, t);
    }
    function us(e, t) {
      cs(2048, 8, e, t);
    }
    function ds(e) {
      V.flags |= 4;
      var t = V.updateQueue;
      if (t === null) ((t = jo()), (V.updateQueue = t), (t.events = [e]));
      else {
        var n = t.events;
        n === null ? (t.events = [e]) : n.push(e);
      }
    }
    function fs(e) {
      var t = U().memoizedState;
      return (
        ds({ ref: t, nextImpl: e }),
        function () {
          if (K & 2) throw Error(s(440));
          return t.impl.apply(void 0, arguments);
        }
      );
    }
    function ps(e, t) {
      return cs(4, 2, e, t);
    }
    function ms(e, t) {
      return cs(4, 4, e, t);
    }
    function hs(e, t) {
      if (typeof t == `function`) {
        e = e();
        var n = t(e);
        return function () {
          typeof n == `function` ? n() : t(null);
        };
      }
      if (t != null)
        return (
          (e = e()),
          (t.current = e),
          function () {
            t.current = null;
          }
        );
    }
    function gs(e, t, n) {
      ((n = n == null ? null : n.concat([e])), cs(4, 4, hs.bind(null, t, e), n));
    }
    function _s() {}
    function vs(e, t) {
      var n = U();
      t = t === void 0 ? null : t;
      var r = n.memoizedState;
      return t !== null && So(t, r[1]) ? r[0] : ((n.memoizedState = [e, t]), e);
    }
    function ys(e, t) {
      var n = U();
      t = t === void 0 ? null : t;
      var r = n.memoizedState;
      if (t !== null && So(t, r[1])) return r[0];
      if (((r = e()), go)) {
        He(!0);
        try {
          e();
        } finally {
          He(!1);
        }
      }
      return ((n.memoizedState = [r, t]), r);
    }
    function bs(e, t, n) {
      return n === void 0 || (fo & 1073741824 && !(Y & 261930))
        ? (e.memoizedState = t)
        : ((e.memoizedState = n), (e = mu()), (V.lanes |= e), (Gl |= e), n);
    }
    function xs(e, t, n, r) {
      return Cr(n, t)
        ? n
        : Qa.current === null
          ? !(fo & 42) || (fo & 1073741824 && !(Y & 261930))
            ? ((rc = !0), (e.memoizedState = n))
            : ((e = mu()), (V.lanes |= e), (Gl |= e), t)
          : ((e = bs(e, n, r)), Cr(e, t) || (rc = !0), e);
    }
    function Ss(e, t, n, r, i) {
      var a = j.p;
      j.p = a !== 0 && 8 > a ? a : 8;
      var o = A.T,
        s = {};
      ((A.T = s), Ps(e, !1, t, n));
      try {
        var c = i(),
          l = A.S;
        (l !== null && l(s, c),
          typeof c == `object` && c && typeof c.then == `function`
            ? Ns(e, t, ga(c, r), pu(e))
            : Ns(e, t, r, pu(e)));
      } catch (n) {
        Ns(e, t, { then: function () {}, status: `rejected`, reason: n }, pu());
      } finally {
        ((j.p = a), o !== null && s.types !== null && (o.types = s.types), (A.T = o));
      }
    }
    function Cs() {}
    function ws(e, t, n, r) {
      if (e.tag !== 5) throw Error(s(476));
      var i = Ts(e).queue;
      Ss(
        e,
        i,
        t,
        oe,
        n === null
          ? Cs
          : function () {
              return (Es(e), n(r));
            },
      );
    }
    function Ts(e) {
      var t = e.memoizedState;
      if (t !== null) return t;
      t = {
        memoizedState: oe,
        baseState: oe,
        baseQueue: null,
        queue: {
          pending: null,
          lanes: 0,
          dispatch: null,
          lastRenderedReducer: Fo,
          lastRenderedState: oe,
        },
        next: null,
      };
      var n = {};
      return (
        (t.next = {
          memoizedState: n,
          baseState: n,
          baseQueue: null,
          queue: {
            pending: null,
            lanes: 0,
            dispatch: null,
            lastRenderedReducer: Fo,
            lastRenderedState: n,
          },
          next: null,
        }),
        (e.memoizedState = t),
        (e = e.alternate),
        e !== null && (e.memoizedState = t),
        t
      );
    }
    function Es(e) {
      var t = Ts(e);
      (t.next === null && (t = e.alternate.memoizedState), Ns(e, t.next.queue, {}, pu()));
    }
    function Ds() {
      return ta(Qf);
    }
    function Os() {
      return U().memoizedState;
    }
    function ks() {
      return U().memoizedState;
    }
    function As(e) {
      for (var t = e.return; t !== null; ) {
        switch (t.tag) {
          case 24:
          case 3:
            var n = pu();
            e = Ua(n);
            var r = Wa(t, e, n);
            (r !== null && (hu(r, t, n), Ga(r, t, n)), (t = { cache: ca() }), (e.payload = t));
            return;
        }
        t = t.return;
      }
    }
    function js(e, t, n) {
      var r = pu();
      ((n = {
        lane: r,
        revertLane: 0,
        gesture: null,
        action: n,
        hasEagerState: !1,
        eagerState: null,
        next: null,
      }),
        Fs(e) ? Is(t, n) : ((n = ri(e, t, n, r)), n !== null && (hu(n, e, r), Ls(n, t, r))));
    }
    function Ms(e, t, n) {
      Ns(e, t, n, pu());
    }
    function Ns(e, t, n, r) {
      var i = {
        lane: r,
        revertLane: 0,
        gesture: null,
        action: n,
        hasEagerState: !1,
        eagerState: null,
        next: null,
      };
      if (Fs(e)) Is(t, i);
      else {
        var a = e.alternate;
        if (
          e.lanes === 0 &&
          (a === null || a.lanes === 0) &&
          ((a = t.lastRenderedReducer), a !== null)
        )
          try {
            var o = t.lastRenderedState,
              s = a(o, n);
            if (((i.hasEagerState = !0), (i.eagerState = s), Cr(s, o)))
              return (ni(e, t, i, 0), q === null && ti(), !1);
          } catch {}
        if (((n = ri(e, t, i, r)), n !== null)) return (hu(n, e, r), Ls(n, t, r), !0);
      }
      return !1;
    }
    function Ps(e, t, n, r) {
      if (
        ((r = {
          lane: 2,
          revertLane: dd(),
          gesture: null,
          action: r,
          hasEagerState: !1,
          eagerState: null,
          next: null,
        }),
        Fs(e))
      ) {
        if (t) throw Error(s(479));
      } else ((t = ri(e, n, r, 2)), t !== null && hu(t, e, 2));
    }
    function Fs(e) {
      var t = e.alternate;
      return e === V || (t !== null && t === V);
    }
    function Is(e, t) {
      ho = mo = !0;
      var n = e.pending;
      (n === null ? (t.next = t) : ((t.next = n.next), (n.next = t)), (e.pending = t));
    }
    function Ls(e, t, n) {
      if (n & 4194048) {
        var r = t.lanes;
        ((r &= e.pendingLanes), (n |= r), (t.lanes = n), at(e, n));
      }
    }
    var Rs = {
      readContext: ta,
      use: No,
      useCallback: xo,
      useContext: xo,
      useEffect: xo,
      useImperativeHandle: xo,
      useLayoutEffect: xo,
      useInsertionEffect: xo,
      useMemo: xo,
      useReducer: xo,
      useRef: xo,
      useState: xo,
      useDebugValue: xo,
      useDeferredValue: xo,
      useTransition: xo,
      useSyncExternalStore: xo,
      useId: xo,
      useHostTransitionStatus: xo,
      useFormState: xo,
      useActionState: xo,
      useOptimistic: xo,
      useMemoCache: xo,
      useCacheRefresh: xo,
    };
    Rs.useEffectEvent = xo;
    var zs = {
        readContext: ta,
        use: No,
        useCallback: function (e, t) {
          return ((Ao().memoizedState = [e, t === void 0 ? null : t]), e);
        },
        useContext: ta,
        useEffect: ls,
        useImperativeHandle: function (e, t, n) {
          ((n = n == null ? null : n.concat([e])), ss(4194308, 4, hs.bind(null, t, e), n));
        },
        useLayoutEffect: function (e, t) {
          return ss(4194308, 4, e, t);
        },
        useInsertionEffect: function (e, t) {
          ss(4, 2, e, t);
        },
        useMemo: function (e, t) {
          var n = Ao();
          t = t === void 0 ? null : t;
          var r = e();
          if (go) {
            He(!0);
            try {
              e();
            } finally {
              He(!1);
            }
          }
          return ((n.memoizedState = [r, t]), r);
        },
        useReducer: function (e, t, n) {
          var r = Ao();
          if (n !== void 0) {
            var i = n(t);
            if (go) {
              He(!0);
              try {
                n(t);
              } finally {
                He(!1);
              }
            }
          } else i = t;
          return (
            (r.memoizedState = r.baseState = i),
            (e = {
              pending: null,
              lanes: 0,
              dispatch: null,
              lastRenderedReducer: e,
              lastRenderedState: i,
            }),
            (r.queue = e),
            (e = e.dispatch = js.bind(null, V, e)),
            [r.memoizedState, e]
          );
        },
        useRef: function (e) {
          var t = Ao();
          return ((e = { current: e }), (t.memoizedState = e));
        },
        useState: function (e) {
          e = Go(e);
          var t = e.queue,
            n = Ms.bind(null, V, t);
          return ((t.dispatch = n), [e.memoizedState, n]);
        },
        useDebugValue: _s,
        useDeferredValue: function (e, t) {
          return bs(Ao(), e, t);
        },
        useTransition: function () {
          var e = Go(!1);
          return ((e = Ss.bind(null, V, e.queue, !0, !1)), (Ao().memoizedState = e), [!1, e]);
        },
        useSyncExternalStore: function (e, t, n) {
          var r = V,
            i = Ao();
          if (z) {
            if (n === void 0) throw Error(s(407));
            n = n();
          } else {
            if (((n = t()), q === null)) throw Error(s(349));
            Y & 127 || Bo(r, t, n);
          }
          i.memoizedState = n;
          var a = { value: n, getSnapshot: t };
          return (
            (i.queue = a),
            ls(Ho.bind(null, r, a, e), [e]),
            (r.flags |= 2048),
            as(9, { destroy: void 0 }, Vo.bind(null, r, a, n, t), null),
            n
          );
        },
        useId: function () {
          var e = Ao(),
            t = q.identifierPrefix;
          if (z) {
            var n = Oi,
              r = Di;
            ((n = (r & ~(1 << (32 - Ue(r) - 1))).toString(32) + n),
              (t = `_` + t + `R_` + n),
              (n = _o++),
              0 < n && (t += `H` + n.toString(32)),
              (t += `_`));
          } else ((n = bo++), (t = `_` + t + `r_` + n.toString(32) + `_`));
          return (e.memoizedState = t);
        },
        useHostTransitionStatus: Ds,
        useFormState: es,
        useActionState: es,
        useOptimistic: function (e) {
          var t = Ao();
          t.memoizedState = t.baseState = e;
          var n = {
            pending: null,
            lanes: 0,
            dispatch: null,
            lastRenderedReducer: null,
            lastRenderedState: null,
          };
          return ((t.queue = n), (t = Ps.bind(null, V, !0, n)), (n.dispatch = t), [e, t]);
        },
        useMemoCache: Po,
        useCacheRefresh: function () {
          return (Ao().memoizedState = As.bind(null, V));
        },
        useEffectEvent: function (e) {
          var t = Ao(),
            n = { impl: e };
          return (
            (t.memoizedState = n),
            function () {
              if (K & 2) throw Error(s(440));
              return n.impl.apply(void 0, arguments);
            }
          );
        },
      },
      Bs = {
        readContext: ta,
        use: No,
        useCallback: vs,
        useContext: ta,
        useEffect: us,
        useImperativeHandle: gs,
        useInsertionEffect: ps,
        useLayoutEffect: ms,
        useMemo: ys,
        useReducer: Io,
        useRef: os,
        useState: function () {
          return Io(Fo);
        },
        useDebugValue: _s,
        useDeferredValue: function (e, t) {
          return xs(U(), H.memoizedState, e, t);
        },
        useTransition: function () {
          var e = Io(Fo)[0],
            t = U().memoizedState;
          return [typeof e == `boolean` ? e : Mo(e), t];
        },
        useSyncExternalStore: zo,
        useId: Os,
        useHostTransitionStatus: Ds,
        useFormState: ts,
        useActionState: ts,
        useOptimistic: function (e, t) {
          return Ko(U(), H, e, t);
        },
        useMemoCache: Po,
        useCacheRefresh: ks,
      };
    Bs.useEffectEvent = fs;
    var Vs = {
      readContext: ta,
      use: No,
      useCallback: vs,
      useContext: ta,
      useEffect: us,
      useImperativeHandle: gs,
      useInsertionEffect: ps,
      useLayoutEffect: ms,
      useMemo: ys,
      useReducer: Ro,
      useRef: os,
      useState: function () {
        return Ro(Fo);
      },
      useDebugValue: _s,
      useDeferredValue: function (e, t) {
        var n = U();
        return H === null ? bs(n, e, t) : xs(n, H.memoizedState, e, t);
      },
      useTransition: function () {
        var e = Ro(Fo)[0],
          t = U().memoizedState;
        return [typeof e == `boolean` ? e : Mo(e), t];
      },
      useSyncExternalStore: zo,
      useId: Os,
      useHostTransitionStatus: Ds,
      useFormState: is,
      useActionState: is,
      useOptimistic: function (e, t) {
        var n = U();
        return H === null ? ((n.baseState = e), [e, n.queue.dispatch]) : Ko(n, H, e, t);
      },
      useMemoCache: Po,
      useCacheRefresh: ks,
    };
    Vs.useEffectEvent = fs;
    function Hs(e, t, n, r) {
      ((t = e.memoizedState),
        (n = n(r, t)),
        (n = n == null ? t : h({}, t, n)),
        (e.memoizedState = n),
        e.lanes === 0 && (e.updateQueue.baseState = n));
    }
    var Us = {
      enqueueSetState: function (e, t, n) {
        e = e._reactInternals;
        var r = pu(),
          i = Ua(r);
        ((i.payload = t),
          n != null && (i.callback = n),
          (t = Wa(e, i, r)),
          t !== null && (hu(t, e, r), Ga(t, e, r)));
      },
      enqueueReplaceState: function (e, t, n) {
        e = e._reactInternals;
        var r = pu(),
          i = Ua(r);
        ((i.tag = 1),
          (i.payload = t),
          n != null && (i.callback = n),
          (t = Wa(e, i, r)),
          t !== null && (hu(t, e, r), Ga(t, e, r)));
      },
      enqueueForceUpdate: function (e, t) {
        e = e._reactInternals;
        var n = pu(),
          r = Ua(n);
        ((r.tag = 2),
          t != null && (r.callback = t),
          (t = Wa(e, r, n)),
          t !== null && (hu(t, e, n), Ga(t, e, n)));
      },
    };
    function Ws(e, t, n, r, i, a, o) {
      return (
        (e = e.stateNode),
        typeof e.shouldComponentUpdate == `function`
          ? e.shouldComponentUpdate(r, a, o)
          : t.prototype && t.prototype.isPureReactComponent
            ? !wr(n, r) || !wr(i, a)
            : !0
      );
    }
    function Gs(e, t, n, r) {
      ((e = t.state),
        typeof t.componentWillReceiveProps == `function` && t.componentWillReceiveProps(n, r),
        typeof t.UNSAFE_componentWillReceiveProps == `function` &&
          t.UNSAFE_componentWillReceiveProps(n, r),
        t.state !== e && Us.enqueueReplaceState(t, t.state, null));
    }
    function Ks(e, t) {
      var n = t;
      if (`ref` in t) for (var r in ((n = {}), t)) r !== `ref` && (n[r] = t[r]);
      if ((e = e.defaultProps))
        for (var i in (n === t && (n = h({}, n)), e)) n[i] === void 0 && (n[i] = e[i]);
      return n;
    }
    function qs(e) {
      Zr(e);
    }
    function Js(e) {
      console.error(e);
    }
    function Ys(e) {
      Zr(e);
    }
    function Xs(e, t) {
      try {
        var n = e.onUncaughtError;
        n(t.value, { componentStack: t.stack });
      } catch (e) {
        setTimeout(function () {
          throw e;
        });
      }
    }
    function Zs(e, t, n) {
      try {
        var r = e.onCaughtError;
        r(n.value, { componentStack: n.stack, errorBoundary: t.tag === 1 ? t.stateNode : null });
      } catch (e) {
        setTimeout(function () {
          throw e;
        });
      }
    }
    function Qs(e, t, n) {
      return (
        (n = Ua(n)),
        (n.tag = 3),
        (n.payload = { element: null }),
        (n.callback = function () {
          Xs(e, t);
        }),
        n
      );
    }
    function $s(e) {
      return ((e = Ua(e)), (e.tag = 3), e);
    }
    function ec(e, t, n, r) {
      var i = n.type.getDerivedStateFromError;
      if (typeof i == `function`) {
        var a = r.value;
        ((e.payload = function () {
          return i(a);
        }),
          (e.callback = function () {
            Zs(t, n, r);
          }));
      }
      var o = n.stateNode;
      o !== null &&
        typeof o.componentDidCatch == `function` &&
        (e.callback = function () {
          (Zs(t, n, r),
            typeof i != `function` && (ru === null ? (ru = new Set([this])) : ru.add(this)));
          var e = r.stack;
          this.componentDidCatch(r.value, { componentStack: e === null ? `` : e });
        });
    }
    function tc(e, t, n, r, i) {
      if (((n.flags |= 32768), typeof r == `object` && r && typeof r.then == `function`)) {
        if (((t = n.alternate), t !== null && Qi(t, n, i, !0), (n = ro.current), n !== null)) {
          switch (n.tag) {
            case 31:
            case 13:
              return (
                io === null ? Du() : n.alternate === null && Wl === 0 && (Wl = 3),
                (n.flags &= -257),
                (n.flags |= 65536),
                (n.lanes = i),
                r === Ta
                  ? (n.flags |= 16384)
                  : ((t = n.updateQueue),
                    t === null ? (n.updateQueue = new Set([r])) : t.add(r),
                    Gu(e, r, i)),
                !1
              );
            case 22:
              return (
                (n.flags |= 65536),
                r === Ta
                  ? (n.flags |= 16384)
                  : ((t = n.updateQueue),
                    t === null
                      ? ((t = {
                          transitions: null,
                          markerInstances: null,
                          retryQueue: new Set([r]),
                        }),
                        (n.updateQueue = t))
                      : ((n = t.retryQueue), n === null ? (t.retryQueue = new Set([r])) : n.add(r)),
                    Gu(e, r, i)),
                !1
              );
          }
          throw Error(s(435, n.tag));
        }
        return (Gu(e, r, i), Du(), !1);
      }
      if (z)
        return (
          (t = ro.current),
          t === null
            ? (r !== Li && ((t = Error(s(423), { cause: r })), Wi(yi(t, n))),
              (e = e.current.alternate),
              (e.flags |= 65536),
              (i &= -i),
              (e.lanes |= i),
              (r = yi(r, n)),
              (i = Qs(e.stateNode, r, i)),
              Ka(e, i),
              Wl !== 4 && (Wl = 2))
            : (!(t.flags & 65536) && (t.flags |= 256),
              (t.flags |= 65536),
              (t.lanes = i),
              r !== Li && ((e = Error(s(422), { cause: r })), Wi(yi(e, n)))),
          !1
        );
      var a = Error(s(520), { cause: r });
      if (((a = yi(a, n)), Xl === null ? (Xl = [a]) : Xl.push(a), Wl !== 4 && (Wl = 2), t === null))
        return !0;
      ((r = yi(r, n)), (n = t));
      do {
        switch (n.tag) {
          case 3:
            return (
              (n.flags |= 65536),
              (e = i & -i),
              (n.lanes |= e),
              (e = Qs(n.stateNode, r, e)),
              Ka(n, e),
              !1
            );
          case 1:
            if (
              ((t = n.type),
              (a = n.stateNode),
              !(n.flags & 128) &&
                (typeof t.getDerivedStateFromError == `function` ||
                  (a !== null &&
                    typeof a.componentDidCatch == `function` &&
                    (ru === null || !ru.has(a)))))
            )
              return (
                (n.flags |= 65536),
                (i &= -i),
                (n.lanes |= i),
                (i = $s(i)),
                ec(i, e, n, r),
                Ka(n, i),
                !1
              );
        }
        n = n.return;
      } while (n !== null);
      return !1;
    }
    var nc = Error(s(461)),
      rc = !1;
    function ic(e, t, n, r) {
      t.child = e === null ? za(t, null, n, r) : Ra(t, e.child, n, r);
    }
    function ac(e, t, n, r, i) {
      n = n.render;
      var a = t.ref;
      if (`ref` in r) {
        var o = {};
        for (var s in r) s !== `ref` && (o[s] = r[s]);
      } else o = r;
      return (
        ea(t),
        (r = Co(e, t, n, o, a, i)),
        (s = Do()),
        e !== null && !rc
          ? (Oo(e, t, i), kc(e, t, i))
          : (z && s && ji(t), (t.flags |= 1), ic(e, t, r, i), t.child)
      );
    }
    function oc(e, t, n, r, i) {
      if (e === null) {
        var a = n.type;
        return typeof a == `function` && !ui(a) && a.defaultProps === void 0 && n.compare === null
          ? ((t.tag = 15), (t.type = a), sc(e, t, a, r, i))
          : ((e = pi(n.type, null, r, t, t.mode, i)),
            (e.ref = t.ref),
            (e.return = t),
            (t.child = e));
      }
      if (((a = e.child), !Ac(e, i))) {
        var o = a.memoizedProps;
        if (((n = n.compare), (n = n === null ? wr : n), n(o, r) && e.ref === t.ref))
          return kc(e, t, i);
      }
      return ((t.flags |= 1), (e = di(a, r)), (e.ref = t.ref), (e.return = t), (t.child = e));
    }
    function sc(e, t, n, r, i) {
      if (e !== null) {
        var a = e.memoizedProps;
        if (wr(a, r) && e.ref === t.ref)
          if (((rc = !1), (t.pendingProps = r = a), Ac(e, i))) e.flags & 131072 && (rc = !0);
          else return ((t.lanes = e.lanes), kc(e, t, i));
      }
      return hc(e, t, n, r, i);
    }
    function cc(e, t, n, r) {
      var i = r.children,
        a = e === null ? null : e.memoizedState;
      if (
        (e === null &&
          t.stateNode === null &&
          (t.stateNode = {
            _visibility: 1,
            _pendingMarkers: null,
            _retryCache: null,
            _transitions: null,
          }),
        r.mode === `hidden`)
      ) {
        if (t.flags & 128) {
          if (((a = a === null ? n : a.baseLanes | n), e !== null)) {
            for (r = t.child = e.child, i = 0; r !== null; )
              ((i = i | r.lanes | r.childLanes), (r = r.sibling));
            r = i & ~a;
          } else ((r = 0), (t.child = null));
          return uc(e, t, a, n, r);
        }
        if (n & 536870912)
          ((t.memoizedState = { baseLanes: 0, cachePool: null }),
            e !== null && ba(t, a === null ? null : a.cachePool),
            a === null ? to() : eo(t, a),
            so(t));
        else return ((r = t.lanes = 536870912), uc(e, t, a === null ? n : a.baseLanes | n, n, r));
      } else
        a === null
          ? (e !== null && ba(t, null), to(), co(t))
          : (ba(t, a.cachePool), eo(t, a), co(t), (t.memoizedState = null));
      return (ic(e, t, i, n), t.child);
    }
    function lc(e, t) {
      return (
        (e !== null && e.tag === 22) ||
          t.stateNode !== null ||
          (t.stateNode = {
            _visibility: 1,
            _pendingMarkers: null,
            _retryCache: null,
            _transitions: null,
          }),
        t.sibling
      );
    }
    function uc(e, t, n, r, i) {
      var a = ya();
      return (
        (a = a === null ? null : { parent: sa._currentValue, pool: a }),
        (t.memoizedState = { baseLanes: n, cachePool: a }),
        e !== null && ba(t, null),
        to(),
        so(t),
        e !== null && Qi(e, t, r, !0),
        (t.childLanes = i),
        null
      );
    }
    function dc(e, t) {
      return (
        (t = wc({ mode: t.mode, children: t.children }, e.mode)),
        (t.ref = e.ref),
        (e.child = t),
        (t.return = e),
        t
      );
    }
    function fc(e, t, n) {
      return (
        Ra(t, e.child, null, n),
        (e = dc(t, t.pendingProps)),
        (e.flags |= 2),
        lo(t),
        (t.memoizedState = null),
        e
      );
    }
    function pc(e, t, n) {
      var r = t.pendingProps,
        i = (t.flags & 128) != 0;
      if (((t.flags &= -129), e === null)) {
        if (z) {
          if (r.mode === `hidden`) return ((e = dc(t, r)), (t.lanes = 536870912), lc(null, e));
          if (
            (oo(t),
            (e = R)
              ? ((e = rf(e, Ii)),
                (e = e !== null && e.data === `&` ? e : null),
                e !== null &&
                  ((t.memoizedState = {
                    dehydrated: e,
                    treeContext: Ei === null ? null : { id: Di, overflow: Oi },
                    retryLane: 536870912,
                    hydrationErrors: null,
                  }),
                  (n = gi(e)),
                  (n.return = t),
                  (t.child = n),
                  (Pi = t),
                  (R = null)))
              : (e = null),
            e === null)
          )
            throw Ri(t);
          return ((t.lanes = 536870912), null);
        }
        return dc(t, r);
      }
      var a = e.memoizedState;
      if (a !== null) {
        var o = a.dehydrated;
        if ((oo(t), i))
          if (t.flags & 256) ((t.flags &= -257), (t = fc(e, t, n)));
          else if (t.memoizedState !== null) ((t.child = e.child), (t.flags |= 128), (t = null));
          else throw Error(s(558));
        else if ((rc || Qi(e, t, n, !1), (i = (n & e.childLanes) !== 0), rc || i)) {
          if (((r = q), r !== null && ((o = ot(r, n)), o !== 0 && o !== a.retryLane)))
            throw ((a.retryLane = o), ii(e, o), hu(r, e, o), nc);
          (Du(), (t = fc(e, t, n)));
        } else
          ((e = a.treeContext),
            (R = cf(o.nextSibling)),
            (Pi = t),
            (z = !0),
            (Fi = null),
            (Ii = !1),
            e !== null && Ni(t, e),
            (t = dc(t, r)),
            (t.flags |= 4096));
        return t;
      }
      return (
        (e = di(e.child, { mode: r.mode, children: r.children })),
        (e.ref = t.ref),
        (t.child = e),
        (e.return = t),
        e
      );
    }
    function mc(e, t) {
      var n = t.ref;
      if (n === null) e !== null && e.ref !== null && (t.flags |= 4194816);
      else {
        if (typeof n != `function` && typeof n != `object`) throw Error(s(284));
        (e === null || e.ref !== n) && (t.flags |= 4194816);
      }
    }
    function hc(e, t, n, r, i) {
      return (
        ea(t),
        (n = Co(e, t, n, r, void 0, i)),
        (r = Do()),
        e !== null && !rc
          ? (Oo(e, t, i), kc(e, t, i))
          : (z && r && ji(t), (t.flags |= 1), ic(e, t, n, i), t.child)
      );
    }
    function gc(e, t, n, r, i, a) {
      return (
        ea(t),
        (t.updateQueue = null),
        (n = To(t, r, n, i)),
        wo(e),
        (r = Do()),
        e !== null && !rc
          ? (Oo(e, t, a), kc(e, t, a))
          : (z && r && ji(t), (t.flags |= 1), ic(e, t, n, a), t.child)
      );
    }
    function _c(e, t, n, r, i) {
      if ((ea(t), t.stateNode === null)) {
        var a = si,
          o = n.contextType;
        (typeof o == `object` && o && (a = ta(o)),
          (a = new n(r, a)),
          (t.memoizedState = a.state !== null && a.state !== void 0 ? a.state : null),
          (a.updater = Us),
          (t.stateNode = a),
          (a._reactInternals = t),
          (a = t.stateNode),
          (a.props = r),
          (a.state = t.memoizedState),
          (a.refs = {}),
          Va(t),
          (o = n.contextType),
          (a.context = typeof o == `object` && o ? ta(o) : si),
          (a.state = t.memoizedState),
          (o = n.getDerivedStateFromProps),
          typeof o == `function` && (Hs(t, n, o, r), (a.state = t.memoizedState)),
          typeof n.getDerivedStateFromProps == `function` ||
            typeof a.getSnapshotBeforeUpdate == `function` ||
            (typeof a.UNSAFE_componentWillMount != `function` &&
              typeof a.componentWillMount != `function`) ||
            ((o = a.state),
            typeof a.componentWillMount == `function` && a.componentWillMount(),
            typeof a.UNSAFE_componentWillMount == `function` && a.UNSAFE_componentWillMount(),
            o !== a.state && Us.enqueueReplaceState(a, a.state, null),
            Ya(t, r, a, i),
            Ja(),
            (a.state = t.memoizedState)),
          typeof a.componentDidMount == `function` && (t.flags |= 4194308),
          (r = !0));
      } else if (e === null) {
        a = t.stateNode;
        var s = t.memoizedProps,
          c = Ks(n, s);
        a.props = c;
        var l = a.context,
          u = n.contextType;
        ((o = si), typeof u == `object` && u && (o = ta(u)));
        var d = n.getDerivedStateFromProps;
        ((u = typeof d == `function` || typeof a.getSnapshotBeforeUpdate == `function`),
          (s = t.pendingProps !== s),
          u ||
            (typeof a.UNSAFE_componentWillReceiveProps != `function` &&
              typeof a.componentWillReceiveProps != `function`) ||
            ((s || l !== o) && Gs(t, a, r, o)),
          (Ba = !1));
        var f = t.memoizedState;
        ((a.state = f),
          Ya(t, r, a, i),
          Ja(),
          (l = t.memoizedState),
          s || f !== l || Ba
            ? (typeof d == `function` && (Hs(t, n, d, r), (l = t.memoizedState)),
              (c = Ba || Ws(t, n, c, r, f, l, o))
                ? (u ||
                    (typeof a.UNSAFE_componentWillMount != `function` &&
                      typeof a.componentWillMount != `function`) ||
                    (typeof a.componentWillMount == `function` && a.componentWillMount(),
                    typeof a.UNSAFE_componentWillMount == `function` &&
                      a.UNSAFE_componentWillMount()),
                  typeof a.componentDidMount == `function` && (t.flags |= 4194308))
                : (typeof a.componentDidMount == `function` && (t.flags |= 4194308),
                  (t.memoizedProps = r),
                  (t.memoizedState = l)),
              (a.props = r),
              (a.state = l),
              (a.context = o),
              (r = c))
            : (typeof a.componentDidMount == `function` && (t.flags |= 4194308), (r = !1)));
      } else {
        ((a = t.stateNode),
          Ha(e, t),
          (o = t.memoizedProps),
          (u = Ks(n, o)),
          (a.props = u),
          (d = t.pendingProps),
          (f = a.context),
          (l = n.contextType),
          (c = si),
          typeof l == `object` && l && (c = ta(l)),
          (s = n.getDerivedStateFromProps),
          (l = typeof s == `function` || typeof a.getSnapshotBeforeUpdate == `function`) ||
            (typeof a.UNSAFE_componentWillReceiveProps != `function` &&
              typeof a.componentWillReceiveProps != `function`) ||
            ((o !== d || f !== c) && Gs(t, a, r, c)),
          (Ba = !1),
          (f = t.memoizedState),
          (a.state = f),
          Ya(t, r, a, i),
          Ja());
        var p = t.memoizedState;
        o !== d || f !== p || Ba || (e !== null && e.dependencies !== null && $i(e.dependencies))
          ? (typeof s == `function` && (Hs(t, n, s, r), (p = t.memoizedState)),
            (u =
              Ba ||
              Ws(t, n, u, r, f, p, c) ||
              (e !== null && e.dependencies !== null && $i(e.dependencies)))
              ? (l ||
                  (typeof a.UNSAFE_componentWillUpdate != `function` &&
                    typeof a.componentWillUpdate != `function`) ||
                  (typeof a.componentWillUpdate == `function` && a.componentWillUpdate(r, p, c),
                  typeof a.UNSAFE_componentWillUpdate == `function` &&
                    a.UNSAFE_componentWillUpdate(r, p, c)),
                typeof a.componentDidUpdate == `function` && (t.flags |= 4),
                typeof a.getSnapshotBeforeUpdate == `function` && (t.flags |= 1024))
              : (typeof a.componentDidUpdate != `function` ||
                  (o === e.memoizedProps && f === e.memoizedState) ||
                  (t.flags |= 4),
                typeof a.getSnapshotBeforeUpdate != `function` ||
                  (o === e.memoizedProps && f === e.memoizedState) ||
                  (t.flags |= 1024),
                (t.memoizedProps = r),
                (t.memoizedState = p)),
            (a.props = r),
            (a.state = p),
            (a.context = c),
            (r = u))
          : (typeof a.componentDidUpdate != `function` ||
              (o === e.memoizedProps && f === e.memoizedState) ||
              (t.flags |= 4),
            typeof a.getSnapshotBeforeUpdate != `function` ||
              (o === e.memoizedProps && f === e.memoizedState) ||
              (t.flags |= 1024),
            (r = !1));
      }
      return (
        (a = r),
        mc(e, t),
        (r = (t.flags & 128) != 0),
        a || r
          ? ((a = t.stateNode),
            (n = r && typeof n.getDerivedStateFromError != `function` ? null : a.render()),
            (t.flags |= 1),
            e !== null && r
              ? ((t.child = Ra(t, e.child, null, i)), (t.child = Ra(t, null, n, i)))
              : ic(e, t, n, i),
            (t.memoizedState = a.state),
            (e = t.child))
          : (e = kc(e, t, i)),
        e
      );
    }
    function vc(e, t, n, r) {
      return (Hi(), (t.flags |= 256), ic(e, t, n, r), t.child);
    }
    var yc = { dehydrated: null, treeContext: null, retryLane: 0, hydrationErrors: null };
    function bc(e) {
      return { baseLanes: e, cachePool: xa() };
    }
    function xc(e, t, n) {
      return ((e = e === null ? 0 : e.childLanes & ~n), t && (e |= Jl), e);
    }
    function Sc(e, t, n) {
      var r = t.pendingProps,
        i = !1,
        a = (t.flags & 128) != 0,
        o;
      if (
        ((o = a) || (o = e !== null && e.memoizedState === null ? !1 : (B.current & 2) != 0),
        o && ((i = !0), (t.flags &= -129)),
        (o = (t.flags & 32) != 0),
        (t.flags &= -33),
        e === null)
      ) {
        if (z) {
          if (
            (i ? ao(t) : co(t),
            (e = R)
              ? ((e = rf(e, Ii)),
                (e = e !== null && e.data !== `&` ? e : null),
                e !== null &&
                  ((t.memoizedState = {
                    dehydrated: e,
                    treeContext: Ei === null ? null : { id: Di, overflow: Oi },
                    retryLane: 536870912,
                    hydrationErrors: null,
                  }),
                  (n = gi(e)),
                  (n.return = t),
                  (t.child = n),
                  (Pi = t),
                  (R = null)))
              : (e = null),
            e === null)
          )
            throw Ri(t);
          return (of(e) ? (t.lanes = 32) : (t.lanes = 536870912), null);
        }
        var c = r.children;
        return (
          (r = r.fallback),
          i
            ? (co(t),
              (i = t.mode),
              (c = wc({ mode: `hidden`, children: c }, i)),
              (r = mi(r, i, n, null)),
              (c.return = t),
              (r.return = t),
              (c.sibling = r),
              (t.child = c),
              (r = t.child),
              (r.memoizedState = bc(n)),
              (r.childLanes = xc(e, o, n)),
              (t.memoizedState = yc),
              lc(null, r))
            : (ao(t), Cc(t, c))
        );
      }
      var l = e.memoizedState;
      if (l !== null && ((c = l.dehydrated), c !== null)) {
        if (a)
          t.flags & 256
            ? (ao(t), (t.flags &= -257), (t = Tc(e, t, n)))
            : t.memoizedState === null
              ? (co(t),
                (c = r.fallback),
                (i = t.mode),
                (r = wc({ mode: `visible`, children: r.children }, i)),
                (c = mi(c, i, n, null)),
                (c.flags |= 2),
                (r.return = t),
                (c.return = t),
                (r.sibling = c),
                (t.child = r),
                Ra(t, e.child, null, n),
                (r = t.child),
                (r.memoizedState = bc(n)),
                (r.childLanes = xc(e, o, n)),
                (t.memoizedState = yc),
                (t = lc(null, r)))
              : (co(t), (t.child = e.child), (t.flags |= 128), (t = null));
        else if ((ao(t), of(c))) {
          if (((o = c.nextSibling && c.nextSibling.dataset), o)) var u = o.dgst;
          ((o = u),
            (r = Error(s(419))),
            (r.stack = ``),
            (r.digest = o),
            Wi({ value: r, source: null, stack: null }),
            (t = Tc(e, t, n)));
        } else if ((rc || Qi(e, t, n, !1), (o = (n & e.childLanes) !== 0), rc || o)) {
          if (((o = q), o !== null && ((r = ot(o, n)), r !== 0 && r !== l.retryLane)))
            throw ((l.retryLane = r), ii(e, r), hu(o, e, r), nc);
          (af(c) || Du(), (t = Tc(e, t, n)));
        } else
          af(c)
            ? ((t.flags |= 192), (t.child = e.child), (t = null))
            : ((e = l.treeContext),
              (R = cf(c.nextSibling)),
              (Pi = t),
              (z = !0),
              (Fi = null),
              (Ii = !1),
              e !== null && Ni(t, e),
              (t = Cc(t, r.children)),
              (t.flags |= 4096));
        return t;
      }
      return i
        ? (co(t),
          (c = r.fallback),
          (i = t.mode),
          (l = e.child),
          (u = l.sibling),
          (r = di(l, { mode: `hidden`, children: r.children })),
          (r.subtreeFlags = l.subtreeFlags & 65011712),
          u === null ? ((c = mi(c, i, n, null)), (c.flags |= 2)) : (c = di(u, c)),
          (c.return = t),
          (r.return = t),
          (r.sibling = c),
          (t.child = r),
          lc(null, r),
          (r = t.child),
          (c = e.child.memoizedState),
          c === null
            ? (c = bc(n))
            : ((i = c.cachePool),
              i === null
                ? (i = xa())
                : ((l = sa._currentValue), (i = i.parent === l ? i : { parent: l, pool: l })),
              (c = { baseLanes: c.baseLanes | n, cachePool: i })),
          (r.memoizedState = c),
          (r.childLanes = xc(e, o, n)),
          (t.memoizedState = yc),
          lc(e.child, r))
        : (ao(t),
          (n = e.child),
          (e = n.sibling),
          (n = di(n, { mode: `visible`, children: r.children })),
          (n.return = t),
          (n.sibling = null),
          e !== null &&
            ((o = t.deletions), o === null ? ((t.deletions = [e]), (t.flags |= 16)) : o.push(e)),
          (t.child = n),
          (t.memoizedState = null),
          n);
    }
    function Cc(e, t) {
      return ((t = wc({ mode: `visible`, children: t }, e.mode)), (t.return = e), (e.child = t));
    }
    function wc(e, t) {
      return ((e = li(22, e, null, t)), (e.lanes = 0), e);
    }
    function Tc(e, t, n) {
      return (
        Ra(t, e.child, null, n),
        (e = Cc(t, t.pendingProps.children)),
        (e.flags |= 2),
        (t.memoizedState = null),
        e
      );
    }
    function Ec(e, t, n) {
      e.lanes |= t;
      var r = e.alternate;
      (r !== null && (r.lanes |= t), Xi(e.return, t, n));
    }
    function Dc(e, t, n, r, i, a) {
      var o = e.memoizedState;
      o === null
        ? (e.memoizedState = {
            isBackwards: t,
            rendering: null,
            renderingStartTime: 0,
            last: r,
            tail: n,
            tailMode: i,
            treeForkCount: a,
          })
        : ((o.isBackwards = t),
          (o.rendering = null),
          (o.renderingStartTime = 0),
          (o.last = r),
          (o.tail = n),
          (o.tailMode = i),
          (o.treeForkCount = a));
    }
    function Oc(e, t, n) {
      var r = t.pendingProps,
        i = r.revealOrder,
        a = r.tail;
      r = r.children;
      var o = B.current,
        s = (o & 2) != 0;
      if (
        (s ? ((o = (o & 1) | 2), (t.flags |= 128)) : (o &= 1),
        M(B, o),
        ic(e, t, r, n),
        (r = z ? Ci : 0),
        !s && e !== null && e.flags & 128)
      )
        a: for (e = t.child; e !== null; ) {
          if (e.tag === 13) e.memoizedState !== null && Ec(e, n, t);
          else if (e.tag === 19) Ec(e, n, t);
          else if (e.child !== null) {
            ((e.child.return = e), (e = e.child));
            continue;
          }
          if (e === t) break a;
          for (; e.sibling === null; ) {
            if (e.return === null || e.return === t) break a;
            e = e.return;
          }
          ((e.sibling.return = e.return), (e = e.sibling));
        }
      switch (i) {
        case `forwards`:
          for (n = t.child, i = null; n !== null; )
            ((e = n.alternate), e !== null && uo(e) === null && (i = n), (n = n.sibling));
          ((n = i),
            n === null ? ((i = t.child), (t.child = null)) : ((i = n.sibling), (n.sibling = null)),
            Dc(t, !1, i, n, a, r));
          break;
        case `backwards`:
        case `unstable_legacy-backwards`:
          for (n = null, i = t.child, t.child = null; i !== null; ) {
            if (((e = i.alternate), e !== null && uo(e) === null)) {
              t.child = i;
              break;
            }
            ((e = i.sibling), (i.sibling = n), (n = i), (i = e));
          }
          Dc(t, !0, n, null, a, r);
          break;
        case `together`:
          Dc(t, !1, null, null, void 0, r);
          break;
        default:
          t.memoizedState = null;
      }
      return t.child;
    }
    function kc(e, t, n) {
      if (
        (e !== null && (t.dependencies = e.dependencies), (Gl |= t.lanes), (n & t.childLanes) === 0)
      )
        if (e !== null) {
          if ((Qi(e, t, n, !1), (n & t.childLanes) === 0)) return null;
        } else return null;
      if (e !== null && t.child !== e.child) throw Error(s(153));
      if (t.child !== null) {
        for (
          e = t.child, n = di(e, e.pendingProps), t.child = n, n.return = t;
          e.sibling !== null;
        )
          ((e = e.sibling), (n = n.sibling = di(e, e.pendingProps)), (n.return = t));
        n.sibling = null;
      }
      return t.child;
    }
    function Ac(e, t) {
      return (e.lanes & t) === 0 ? ((e = e.dependencies), !!(e !== null && $i(e))) : !0;
    }
    function jc(e, t, n) {
      switch (t.tag) {
        case 3:
          (he(t, t.stateNode.containerInfo), Ji(t, sa, e.memoizedState.cache), Hi());
          break;
        case 27:
        case 5:
          _e(t);
          break;
        case 4:
          he(t, t.stateNode.containerInfo);
          break;
        case 10:
          Ji(t, t.type, t.memoizedProps.value);
          break;
        case 31:
          if (t.memoizedState !== null) return ((t.flags |= 128), oo(t), null);
          break;
        case 13:
          var r = t.memoizedState;
          if (r !== null)
            return r.dehydrated === null
              ? (n & t.child.childLanes) === 0
                ? (ao(t), (e = kc(e, t, n)), e === null ? null : e.sibling)
                : Sc(e, t, n)
              : (ao(t), (t.flags |= 128), null);
          ao(t);
          break;
        case 19:
          var i = (e.flags & 128) != 0;
          if (
            ((r = (n & t.childLanes) !== 0), (r ||= (Qi(e, t, n, !1), (n & t.childLanes) !== 0)), i)
          ) {
            if (r) return Oc(e, t, n);
            t.flags |= 128;
          }
          if (
            ((i = t.memoizedState),
            i !== null && ((i.rendering = null), (i.tail = null), (i.lastEffect = null)),
            M(B, B.current),
            r)
          )
            break;
          return null;
        case 22:
          return ((t.lanes = 0), cc(e, t, n, t.pendingProps));
        case 24:
          Ji(t, sa, e.memoizedState.cache);
      }
      return kc(e, t, n);
    }
    function Mc(e, t, n) {
      if (e !== null)
        if (e.memoizedProps !== t.pendingProps) rc = !0;
        else {
          if (!Ac(e, n) && !(t.flags & 128)) return ((rc = !1), jc(e, t, n));
          rc = !!(e.flags & 131072);
        }
      else ((rc = !1), z && t.flags & 1048576 && Ai(t, Ci, t.index));
      switch (((t.lanes = 0), t.tag)) {
        case 16:
          a: {
            var r = t.pendingProps;
            if (((e = Oa(t.elementType)), (t.type = e), typeof e == `function`))
              ui(e)
                ? ((r = Ks(e, r)), (t.tag = 1), (t = _c(null, t, e, r, n)))
                : ((t.tag = 0), (t = hc(null, t, e, r, n)));
            else {
              if (e != null) {
                var i = e.$$typeof;
                if (i === w) {
                  ((t.tag = 11), (t = ac(null, t, e, r, n)));
                  break a;
                } else if (i === ee) {
                  ((t.tag = 14), (t = oc(null, t, e, r, n)));
                  break a;
                }
              }
              throw ((t = ie(e) || e), Error(s(306, t, ``)));
            }
          }
          return t;
        case 0:
          return hc(e, t, t.type, t.pendingProps, n);
        case 1:
          return ((r = t.type), (i = Ks(r, t.pendingProps)), _c(e, t, r, i, n));
        case 3:
          a: {
            if ((he(t, t.stateNode.containerInfo), e === null)) throw Error(s(387));
            r = t.pendingProps;
            var a = t.memoizedState;
            ((i = a.element), Ha(e, t), Ya(t, r, null, n));
            var o = t.memoizedState;
            if (
              ((r = o.cache),
              Ji(t, sa, r),
              r !== a.cache && Zi(t, [sa], n, !0),
              Ja(),
              (r = o.element),
              a.isDehydrated)
            )
              if (
                ((a = { element: r, isDehydrated: !1, cache: o.cache }),
                (t.updateQueue.baseState = a),
                (t.memoizedState = a),
                t.flags & 256)
              ) {
                t = vc(e, t, r, n);
                break a;
              } else if (r !== i) {
                ((i = yi(Error(s(424)), t)), Wi(i), (t = vc(e, t, r, n)));
                break a;
              } else {
                switch (((e = t.stateNode.containerInfo), e.nodeType)) {
                  case 9:
                    e = e.body;
                    break;
                  default:
                    e = e.nodeName === `HTML` ? e.ownerDocument.body : e;
                }
                for (
                  R = cf(e.firstChild),
                    Pi = t,
                    z = !0,
                    Fi = null,
                    Ii = !0,
                    n = za(t, null, r, n),
                    t.child = n;
                  n;
                )
                  ((n.flags = (n.flags & -3) | 4096), (n = n.sibling));
              }
            else {
              if ((Hi(), r === i)) {
                t = kc(e, t, n);
                break a;
              }
              ic(e, t, r, n);
            }
            t = t.child;
          }
          return t;
        case 26:
          return (
            mc(e, t),
            e === null
              ? (n = kf(t.type, null, t.pendingProps, null))
                ? (t.memoizedState = n)
                : z ||
                  ((n = t.type),
                  (e = t.pendingProps),
                  (r = Bd(pe.current).createElement(n)),
                  (r[ft] = t),
                  (r[pt] = e),
                  Pd(r, n, e),
                  N(r),
                  (t.stateNode = r))
              : (t.memoizedState = kf(t.type, e.memoizedProps, t.pendingProps, e.memoizedState)),
            null
          );
        case 27:
          return (
            _e(t),
            e === null &&
              z &&
              ((r = t.stateNode = ff(t.type, t.pendingProps, pe.current)),
              (Pi = t),
              (Ii = !0),
              (i = R),
              Zd(t.type) ? ((lf = i), (R = cf(r.firstChild))) : (R = i)),
            ic(e, t, t.pendingProps.children, n),
            mc(e, t),
            e === null && (t.flags |= 4194304),
            t.child
          );
        case 5:
          return (
            e === null &&
              z &&
              ((i = r = R) &&
                ((r = tf(r, t.type, t.pendingProps, Ii)),
                r === null
                  ? (i = !1)
                  : ((t.stateNode = r), (Pi = t), (R = cf(r.firstChild)), (Ii = !1), (i = !0))),
              i || Ri(t)),
            _e(t),
            (i = t.type),
            (a = t.pendingProps),
            (o = e === null ? null : e.memoizedProps),
            (r = a.children),
            Ud(i, a) ? (r = null) : o !== null && Ud(i, o) && (t.flags |= 32),
            t.memoizedState !== null && ((i = Co(e, t, Eo, null, null, n)), (Qf._currentValue = i)),
            mc(e, t),
            ic(e, t, r, n),
            t.child
          );
        case 6:
          return (
            e === null &&
              z &&
              ((e = n = R) &&
                ((n = nf(n, t.pendingProps, Ii)),
                n === null ? (e = !1) : ((t.stateNode = n), (Pi = t), (R = null), (e = !0))),
              e || Ri(t)),
            null
          );
        case 13:
          return Sc(e, t, n);
        case 4:
          return (
            he(t, t.stateNode.containerInfo),
            (r = t.pendingProps),
            e === null ? (t.child = Ra(t, null, r, n)) : ic(e, t, r, n),
            t.child
          );
        case 11:
          return ac(e, t, t.type, t.pendingProps, n);
        case 7:
          return (ic(e, t, t.pendingProps, n), t.child);
        case 8:
          return (ic(e, t, t.pendingProps.children, n), t.child);
        case 12:
          return (ic(e, t, t.pendingProps.children, n), t.child);
        case 10:
          return ((r = t.pendingProps), Ji(t, t.type, r.value), ic(e, t, r.children, n), t.child);
        case 9:
          return (
            (i = t.type._context),
            (r = t.pendingProps.children),
            ea(t),
            (i = ta(i)),
            (r = r(i)),
            (t.flags |= 1),
            ic(e, t, r, n),
            t.child
          );
        case 14:
          return oc(e, t, t.type, t.pendingProps, n);
        case 15:
          return sc(e, t, t.type, t.pendingProps, n);
        case 19:
          return Oc(e, t, n);
        case 31:
          return pc(e, t, n);
        case 22:
          return cc(e, t, n, t.pendingProps);
        case 24:
          return (
            ea(t),
            (r = ta(sa)),
            e === null
              ? ((i = ya()),
                i === null &&
                  ((i = q),
                  (a = ca()),
                  (i.pooledCache = a),
                  a.refCount++,
                  a !== null && (i.pooledCacheLanes |= n),
                  (i = a)),
                (t.memoizedState = { parent: r, cache: i }),
                Va(t),
                Ji(t, sa, i))
              : ((e.lanes & n) !== 0 && (Ha(e, t), Ya(t, null, null, n), Ja()),
                (i = e.memoizedState),
                (a = t.memoizedState),
                i.parent === r
                  ? ((r = a.cache), Ji(t, sa, r), r !== i.cache && Zi(t, [sa], n, !0))
                  : ((i = { parent: r, cache: r }),
                    (t.memoizedState = i),
                    t.lanes === 0 && (t.memoizedState = t.updateQueue.baseState = i),
                    Ji(t, sa, r))),
            ic(e, t, t.pendingProps.children, n),
            t.child
          );
        case 29:
          throw t.pendingProps;
      }
      throw Error(s(156, t.tag));
    }
    function Nc(e) {
      e.flags |= 4;
    }
    function Pc(e, t, n, r, i) {
      if (((t = (e.mode & 32) != 0) && (t = !1), t)) {
        if (((e.flags |= 16777216), (i & 335544128) === i))
          if (e.stateNode.complete) e.flags |= 8192;
          else if (wu()) e.flags |= 8192;
          else throw ((ka = Ta), Ca);
      } else e.flags &= -16777217;
    }
    function Fc(e, t) {
      if (t.type !== `stylesheet` || t.state.loading & 4) e.flags &= -16777217;
      else if (((e.flags |= 16777216), !Wf(t)))
        if (wu()) e.flags |= 8192;
        else throw ((ka = Ta), Ca);
    }
    function Ic(e, t) {
      (t !== null && (e.flags |= 4),
        e.flags & 16384 && ((t = e.tag === 22 ? 536870912 : et()), (e.lanes |= t), (Yl |= t)));
    }
    function Lc(e, t) {
      if (!z)
        switch (e.tailMode) {
          case `hidden`:
            t = e.tail;
            for (var n = null; t !== null; ) (t.alternate !== null && (n = t), (t = t.sibling));
            n === null ? (e.tail = null) : (n.sibling = null);
            break;
          case `collapsed`:
            n = e.tail;
            for (var r = null; n !== null; ) (n.alternate !== null && (r = n), (n = n.sibling));
            r === null
              ? t || e.tail === null
                ? (e.tail = null)
                : (e.tail.sibling = null)
              : (r.sibling = null);
        }
    }
    function W(e) {
      var t = e.alternate !== null && e.alternate.child === e.child,
        n = 0,
        r = 0;
      if (t)
        for (var i = e.child; i !== null; )
          ((n |= i.lanes | i.childLanes),
            (r |= i.subtreeFlags & 65011712),
            (r |= i.flags & 65011712),
            (i.return = e),
            (i = i.sibling));
      else
        for (i = e.child; i !== null; )
          ((n |= i.lanes | i.childLanes),
            (r |= i.subtreeFlags),
            (r |= i.flags),
            (i.return = e),
            (i = i.sibling));
      return ((e.subtreeFlags |= r), (e.childLanes = n), t);
    }
    function Rc(e, t, n) {
      var r = t.pendingProps;
      switch ((Mi(t), t.tag)) {
        case 16:
        case 15:
        case 0:
        case 11:
        case 7:
        case 8:
        case 12:
        case 9:
        case 14:
          return (W(t), null);
        case 1:
          return (W(t), null);
        case 3:
          return (
            (n = t.stateNode),
            (r = null),
            e !== null && (r = e.memoizedState.cache),
            t.memoizedState.cache !== r && (t.flags |= 2048),
            Yi(sa),
            ge(),
            n.pendingContext && ((n.context = n.pendingContext), (n.pendingContext = null)),
            (e === null || e.child === null) &&
              (Vi(t)
                ? Nc(t)
                : e === null ||
                  (e.memoizedState.isDehydrated && !(t.flags & 256)) ||
                  ((t.flags |= 1024), Ui())),
            W(t),
            null
          );
        case 26:
          var i = t.type,
            a = t.memoizedState;
          return (
            e === null
              ? (Nc(t), a === null ? (W(t), Pc(t, i, null, r, n)) : (W(t), Fc(t, a)))
              : a
                ? a === e.memoizedState
                  ? (W(t), (t.flags &= -16777217))
                  : (Nc(t), W(t), Fc(t, a))
                : ((e = e.memoizedProps), e !== r && Nc(t), W(t), Pc(t, i, e, r, n)),
            null
          );
        case 27:
          if ((ve(t), (n = pe.current), (i = t.type), e !== null && t.stateNode != null))
            e.memoizedProps !== r && Nc(t);
          else {
            if (!r) {
              if (t.stateNode === null) throw Error(s(166));
              return (W(t), null);
            }
            ((e = de.current), Vi(t) ? zi(t, e) : ((e = ff(i, r, n)), (t.stateNode = e), Nc(t)));
          }
          return (W(t), null);
        case 5:
          if ((ve(t), (i = t.type), e !== null && t.stateNode != null))
            e.memoizedProps !== r && Nc(t);
          else {
            if (!r) {
              if (t.stateNode === null) throw Error(s(166));
              return (W(t), null);
            }
            if (((a = de.current), Vi(t))) zi(t, a);
            else {
              var o = Bd(pe.current);
              switch (a) {
                case 1:
                  a = o.createElementNS(`http://www.w3.org/2000/svg`, i);
                  break;
                case 2:
                  a = o.createElementNS(`http://www.w3.org/1998/Math/MathML`, i);
                  break;
                default:
                  switch (i) {
                    case `svg`:
                      a = o.createElementNS(`http://www.w3.org/2000/svg`, i);
                      break;
                    case `math`:
                      a = o.createElementNS(`http://www.w3.org/1998/Math/MathML`, i);
                      break;
                    case `script`:
                      ((a = o.createElement(`div`)),
                        (a.innerHTML = `<script><\/script>`),
                        (a = a.removeChild(a.firstChild)));
                      break;
                    case `select`:
                      ((a =
                        typeof r.is == `string`
                          ? o.createElement(`select`, { is: r.is })
                          : o.createElement(`select`)),
                        r.multiple ? (a.multiple = !0) : r.size && (a.size = r.size));
                      break;
                    default:
                      a =
                        typeof r.is == `string`
                          ? o.createElement(i, { is: r.is })
                          : o.createElement(i);
                  }
              }
              ((a[ft] = t), (a[pt] = r));
              a: for (o = t.child; o !== null; ) {
                if (o.tag === 5 || o.tag === 6) a.appendChild(o.stateNode);
                else if (o.tag !== 4 && o.tag !== 27 && o.child !== null) {
                  ((o.child.return = o), (o = o.child));
                  continue;
                }
                if (o === t) break a;
                for (; o.sibling === null; ) {
                  if (o.return === null || o.return === t) break a;
                  o = o.return;
                }
                ((o.sibling.return = o.return), (o = o.sibling));
              }
              t.stateNode = a;
              a: switch ((Pd(a, i, r), i)) {
                case `button`:
                case `input`:
                case `select`:
                case `textarea`:
                  r = !!r.autoFocus;
                  break a;
                case `img`:
                  r = !0;
                  break a;
                default:
                  r = !1;
              }
              r && Nc(t);
            }
          }
          return (
            W(t),
            Pc(t, t.type, e === null ? null : e.memoizedProps, t.pendingProps, n),
            null
          );
        case 6:
          if (e && t.stateNode != null) e.memoizedProps !== r && Nc(t);
          else {
            if (typeof r != `string` && t.stateNode === null) throw Error(s(166));
            if (((e = pe.current), Vi(t))) {
              if (((e = t.stateNode), (n = t.memoizedProps), (r = null), (i = Pi), i !== null))
                switch (i.tag) {
                  case 27:
                  case 5:
                    r = i.memoizedProps;
                }
              ((e[ft] = t),
                (e = !!(
                  e.nodeValue === n ||
                  (r !== null && !0 === r.suppressHydrationWarning) ||
                  Md(e.nodeValue, n)
                )),
                e || Ri(t, !0));
            } else ((e = Bd(e).createTextNode(r)), (e[ft] = t), (t.stateNode = e));
          }
          return (W(t), null);
        case 31:
          if (((n = t.memoizedState), e === null || e.memoizedState !== null)) {
            if (((r = Vi(t)), n !== null)) {
              if (e === null) {
                if (!r) throw Error(s(318));
                if (((e = t.memoizedState), (e = e === null ? null : e.dehydrated), !e))
                  throw Error(s(557));
                e[ft] = t;
              } else (Hi(), !(t.flags & 128) && (t.memoizedState = null), (t.flags |= 4));
              (W(t), (e = !1));
            } else
              ((n = Ui()),
                e !== null && e.memoizedState !== null && (e.memoizedState.hydrationErrors = n),
                (e = !0));
            if (!e) return t.flags & 256 ? (lo(t), t) : (lo(t), null);
            if (t.flags & 128) throw Error(s(558));
          }
          return (W(t), null);
        case 13:
          if (
            ((r = t.memoizedState),
            e === null || (e.memoizedState !== null && e.memoizedState.dehydrated !== null))
          ) {
            if (((i = Vi(t)), r !== null && r.dehydrated !== null)) {
              if (e === null) {
                if (!i) throw Error(s(318));
                if (((i = t.memoizedState), (i = i === null ? null : i.dehydrated), !i))
                  throw Error(s(317));
                i[ft] = t;
              } else (Hi(), !(t.flags & 128) && (t.memoizedState = null), (t.flags |= 4));
              (W(t), (i = !1));
            } else
              ((i = Ui()),
                e !== null && e.memoizedState !== null && (e.memoizedState.hydrationErrors = i),
                (i = !0));
            if (!i) return t.flags & 256 ? (lo(t), t) : (lo(t), null);
          }
          return (
            lo(t),
            t.flags & 128
              ? ((t.lanes = n), t)
              : ((n = r !== null),
                (e = e !== null && e.memoizedState !== null),
                n &&
                  ((r = t.child),
                  (i = null),
                  r.alternate !== null &&
                    r.alternate.memoizedState !== null &&
                    r.alternate.memoizedState.cachePool !== null &&
                    (i = r.alternate.memoizedState.cachePool.pool),
                  (a = null),
                  r.memoizedState !== null &&
                    r.memoizedState.cachePool !== null &&
                    (a = r.memoizedState.cachePool.pool),
                  a !== i && (r.flags |= 2048)),
                n !== e && n && (t.child.flags |= 8192),
                Ic(t, t.updateQueue),
                W(t),
                null)
          );
        case 4:
          return (ge(), e === null && Sd(t.stateNode.containerInfo), W(t), null);
        case 10:
          return (Yi(t.type), W(t), null);
        case 19:
          if ((ue(B), (r = t.memoizedState), r === null)) return (W(t), null);
          if (((i = (t.flags & 128) != 0), (a = r.rendering), a === null))
            if (i) Lc(r, !1);
            else {
              if (Wl !== 0 || (e !== null && e.flags & 128))
                for (e = t.child; e !== null; ) {
                  if (((a = uo(e)), a !== null)) {
                    for (
                      t.flags |= 128,
                        Lc(r, !1),
                        e = a.updateQueue,
                        t.updateQueue = e,
                        Ic(t, e),
                        t.subtreeFlags = 0,
                        e = n,
                        n = t.child;
                      n !== null;
                    )
                      (fi(n, e), (n = n.sibling));
                    return (M(B, (B.current & 1) | 2), z && ki(t, r.treeForkCount), t.child);
                  }
                  e = e.sibling;
                }
              r.tail !== null &&
                je() > tu &&
                ((t.flags |= 128), (i = !0), Lc(r, !1), (t.lanes = 4194304));
            }
          else {
            if (!i)
              if (((e = uo(a)), e !== null)) {
                if (
                  ((t.flags |= 128),
                  (i = !0),
                  (e = e.updateQueue),
                  (t.updateQueue = e),
                  Ic(t, e),
                  Lc(r, !0),
                  r.tail === null && r.tailMode === `hidden` && !a.alternate && !z)
                )
                  return (W(t), null);
              } else
                2 * je() - r.renderingStartTime > tu &&
                  n !== 536870912 &&
                  ((t.flags |= 128), (i = !0), Lc(r, !1), (t.lanes = 4194304));
            r.isBackwards
              ? ((a.sibling = t.child), (t.child = a))
              : ((e = r.last), e === null ? (t.child = a) : (e.sibling = a), (r.last = a));
          }
          return r.tail === null
            ? (W(t), null)
            : ((e = r.tail),
              (r.rendering = e),
              (r.tail = e.sibling),
              (r.renderingStartTime = je()),
              (e.sibling = null),
              (n = B.current),
              M(B, i ? (n & 1) | 2 : n & 1),
              z && ki(t, r.treeForkCount),
              e);
        case 22:
        case 23:
          return (
            lo(t),
            no(),
            (r = t.memoizedState !== null),
            e === null
              ? r && (t.flags |= 8192)
              : (e.memoizedState !== null) !== r && (t.flags |= 8192),
            r
              ? n & 536870912 && !(t.flags & 128) && (W(t), t.subtreeFlags & 6 && (t.flags |= 8192))
              : W(t),
            (n = t.updateQueue),
            n !== null && Ic(t, n.retryQueue),
            (n = null),
            e !== null &&
              e.memoizedState !== null &&
              e.memoizedState.cachePool !== null &&
              (n = e.memoizedState.cachePool.pool),
            (r = null),
            t.memoizedState !== null &&
              t.memoizedState.cachePool !== null &&
              (r = t.memoizedState.cachePool.pool),
            r !== n && (t.flags |= 2048),
            e !== null && ue(va),
            null
          );
        case 24:
          return (
            (n = null),
            e !== null && (n = e.memoizedState.cache),
            t.memoizedState.cache !== n && (t.flags |= 2048),
            Yi(sa),
            W(t),
            null
          );
        case 25:
          return null;
        case 30:
          return null;
      }
      throw Error(s(156, t.tag));
    }
    function zc(e, t) {
      switch ((Mi(t), t.tag)) {
        case 1:
          return ((e = t.flags), e & 65536 ? ((t.flags = (e & -65537) | 128), t) : null);
        case 3:
          return (
            Yi(sa),
            ge(),
            (e = t.flags),
            e & 65536 && !(e & 128) ? ((t.flags = (e & -65537) | 128), t) : null
          );
        case 26:
        case 27:
        case 5:
          return (ve(t), null);
        case 31:
          if (t.memoizedState !== null) {
            if ((lo(t), t.alternate === null)) throw Error(s(340));
            Hi();
          }
          return ((e = t.flags), e & 65536 ? ((t.flags = (e & -65537) | 128), t) : null);
        case 13:
          if ((lo(t), (e = t.memoizedState), e !== null && e.dehydrated !== null)) {
            if (t.alternate === null) throw Error(s(340));
            Hi();
          }
          return ((e = t.flags), e & 65536 ? ((t.flags = (e & -65537) | 128), t) : null);
        case 19:
          return (ue(B), null);
        case 4:
          return (ge(), null);
        case 10:
          return (Yi(t.type), null);
        case 22:
        case 23:
          return (
            lo(t),
            no(),
            e !== null && ue(va),
            (e = t.flags),
            e & 65536 ? ((t.flags = (e & -65537) | 128), t) : null
          );
        case 24:
          return (Yi(sa), null);
        case 25:
          return null;
        default:
          return null;
      }
    }
    function Bc(e, t) {
      switch ((Mi(t), t.tag)) {
        case 3:
          (Yi(sa), ge());
          break;
        case 26:
        case 27:
        case 5:
          ve(t);
          break;
        case 4:
          ge();
          break;
        case 31:
          t.memoizedState !== null && lo(t);
          break;
        case 13:
          lo(t);
          break;
        case 19:
          ue(B);
          break;
        case 10:
          Yi(t.type);
          break;
        case 22:
        case 23:
          (lo(t), no(), e !== null && ue(va));
          break;
        case 24:
          Yi(sa);
      }
    }
    function Vc(e, t) {
      try {
        var n = t.updateQueue,
          r = n === null ? null : n.lastEffect;
        if (r !== null) {
          var i = r.next;
          n = i;
          do {
            if ((n.tag & e) === e) {
              r = void 0;
              var a = n.create,
                o = n.inst;
              ((r = a()), (o.destroy = r));
            }
            n = n.next;
          } while (n !== i);
        }
      } catch (e) {
        Z(t, t.return, e);
      }
    }
    function Hc(e, t, n) {
      try {
        var r = t.updateQueue,
          i = r === null ? null : r.lastEffect;
        if (i !== null) {
          var a = i.next;
          r = a;
          do {
            if ((r.tag & e) === e) {
              var o = r.inst,
                s = o.destroy;
              if (s !== void 0) {
                ((o.destroy = void 0), (i = t));
                var c = n,
                  l = s;
                try {
                  l();
                } catch (e) {
                  Z(i, c, e);
                }
              }
            }
            r = r.next;
          } while (r !== a);
        }
      } catch (e) {
        Z(t, t.return, e);
      }
    }
    function Uc(e) {
      var t = e.updateQueue;
      if (t !== null) {
        var n = e.stateNode;
        try {
          Za(t, n);
        } catch (t) {
          Z(e, e.return, t);
        }
      }
    }
    function Wc(e, t, n) {
      ((n.props = Ks(e.type, e.memoizedProps)), (n.state = e.memoizedState));
      try {
        n.componentWillUnmount();
      } catch (n) {
        Z(e, t, n);
      }
    }
    function Gc(e, t) {
      try {
        var n = e.ref;
        if (n !== null) {
          switch (e.tag) {
            case 26:
            case 27:
            case 5:
              var r = e.stateNode;
              break;
            case 30:
              r = e.stateNode;
              break;
            default:
              r = e.stateNode;
          }
          typeof n == `function` ? (e.refCleanup = n(r)) : (n.current = r);
        }
      } catch (n) {
        Z(e, t, n);
      }
    }
    function Kc(e, t) {
      var n = e.ref,
        r = e.refCleanup;
      if (n !== null)
        if (typeof r == `function`)
          try {
            r();
          } catch (n) {
            Z(e, t, n);
          } finally {
            ((e.refCleanup = null), (e = e.alternate), e != null && (e.refCleanup = null));
          }
        else if (typeof n == `function`)
          try {
            n(null);
          } catch (n) {
            Z(e, t, n);
          }
        else n.current = null;
    }
    function qc(e) {
      var t = e.type,
        n = e.memoizedProps,
        r = e.stateNode;
      try {
        a: switch (t) {
          case `button`:
          case `input`:
          case `select`:
          case `textarea`:
            n.autoFocus && r.focus();
            break a;
          case `img`:
            n.src ? (r.src = n.src) : n.srcSet && (r.srcset = n.srcSet);
        }
      } catch (t) {
        Z(e, e.return, t);
      }
    }
    function Jc(e, t, n) {
      try {
        var r = e.stateNode;
        (Fd(r, e.type, n, t), (r[pt] = t));
      } catch (t) {
        Z(e, e.return, t);
      }
    }
    function Yc(e) {
      return (
        e.tag === 5 || e.tag === 3 || e.tag === 26 || (e.tag === 27 && Zd(e.type)) || e.tag === 4
      );
    }
    function Xc(e) {
      a: for (;;) {
        for (; e.sibling === null; ) {
          if (e.return === null || Yc(e.return)) return null;
          e = e.return;
        }
        for (
          e.sibling.return = e.return, e = e.sibling;
          e.tag !== 5 && e.tag !== 6 && e.tag !== 18;
        ) {
          if ((e.tag === 27 && Zd(e.type)) || e.flags & 2 || e.child === null || e.tag === 4)
            continue a;
          ((e.child.return = e), (e = e.child));
        }
        if (!(e.flags & 2)) return e.stateNode;
      }
    }
    function Zc(e, t, n) {
      var r = e.tag;
      if (r === 5 || r === 6)
        ((e = e.stateNode),
          t
            ? (n.nodeType === 9
                ? n.body
                : n.nodeName === `HTML`
                  ? n.ownerDocument.body
                  : n
              ).insertBefore(e, t)
            : ((t = n.nodeType === 9 ? n.body : n.nodeName === `HTML` ? n.ownerDocument.body : n),
              t.appendChild(e),
              (n = n._reactRootContainer),
              n != null || t.onclick !== null || (t.onclick = tn)));
      else if (
        r !== 4 &&
        (r === 27 && Zd(e.type) && ((n = e.stateNode), (t = null)), (e = e.child), e !== null)
      )
        for (Zc(e, t, n), e = e.sibling; e !== null; ) (Zc(e, t, n), (e = e.sibling));
    }
    function Qc(e, t, n) {
      var r = e.tag;
      if (r === 5 || r === 6) ((e = e.stateNode), t ? n.insertBefore(e, t) : n.appendChild(e));
      else if (r !== 4 && (r === 27 && Zd(e.type) && (n = e.stateNode), (e = e.child), e !== null))
        for (Qc(e, t, n), e = e.sibling; e !== null; ) (Qc(e, t, n), (e = e.sibling));
    }
    function $c(e) {
      var t = e.stateNode,
        n = e.memoizedProps;
      try {
        for (var r = e.type, i = t.attributes; i.length; ) t.removeAttributeNode(i[0]);
        (Pd(t, r, n), (t[ft] = e), (t[pt] = n));
      } catch (t) {
        Z(e, e.return, t);
      }
    }
    var el = !1,
      tl = !1,
      nl = !1,
      rl = typeof WeakSet == `function` ? WeakSet : Set,
      il = null;
    function al(e, t) {
      if (((e = e.containerInfo), (Rd = sp), (e = Or(e)), kr(e))) {
        if (`selectionStart` in e) var n = { start: e.selectionStart, end: e.selectionEnd };
        else
          a: {
            n = ((n = e.ownerDocument) && n.defaultView) || window;
            var r = n.getSelection && n.getSelection();
            if (r && r.rangeCount !== 0) {
              n = r.anchorNode;
              var i = r.anchorOffset,
                a = r.focusNode;
              r = r.focusOffset;
              try {
                (n.nodeType, a.nodeType);
              } catch {
                n = null;
                break a;
              }
              var o = 0,
                c = -1,
                l = -1,
                u = 0,
                d = 0,
                f = e,
                p = null;
              b: for (;;) {
                for (
                  var m;
                  f !== n || (i !== 0 && f.nodeType !== 3) || (c = o + i),
                    f !== a || (r !== 0 && f.nodeType !== 3) || (l = o + r),
                    f.nodeType === 3 && (o += f.nodeValue.length),
                    (m = f.firstChild) !== null;
                )
                  ((p = f), (f = m));
                for (;;) {
                  if (f === e) break b;
                  if (
                    (p === n && ++u === i && (c = o),
                    p === a && ++d === r && (l = o),
                    (m = f.nextSibling) !== null)
                  )
                    break;
                  ((f = p), (p = f.parentNode));
                }
                f = m;
              }
              n = c === -1 || l === -1 ? null : { start: c, end: l };
            } else n = null;
          }
        n ||= { start: 0, end: 0 };
      } else n = null;
      for (zd = { focusedElem: e, selectionRange: n }, sp = !1, il = t; il !== null; )
        if (((t = il), (e = t.child), t.subtreeFlags & 1028 && e !== null))
          ((e.return = t), (il = e));
        else
          for (; il !== null; ) {
            switch (((t = il), (a = t.alternate), (e = t.flags), t.tag)) {
              case 0:
                if (e & 4 && ((e = t.updateQueue), (e = e === null ? null : e.events), e !== null))
                  for (n = 0; n < e.length; n++) ((i = e[n]), (i.ref.impl = i.nextImpl));
                break;
              case 11:
              case 15:
                break;
              case 1:
                if (e & 1024 && a !== null) {
                  ((e = void 0),
                    (n = t),
                    (i = a.memoizedProps),
                    (a = a.memoizedState),
                    (r = n.stateNode));
                  try {
                    var h = Ks(n.type, i);
                    ((e = r.getSnapshotBeforeUpdate(h, a)),
                      (r.__reactInternalSnapshotBeforeUpdate = e));
                  } catch (e) {
                    Z(n, n.return, e);
                  }
                }
                break;
              case 3:
                if (e & 1024) {
                  if (((e = t.stateNode.containerInfo), (n = e.nodeType), n === 9)) ef(e);
                  else if (n === 1)
                    switch (e.nodeName) {
                      case `HEAD`:
                      case `HTML`:
                      case `BODY`:
                        ef(e);
                        break;
                      default:
                        e.textContent = ``;
                    }
                }
                break;
              case 5:
              case 26:
              case 27:
              case 6:
              case 4:
              case 17:
                break;
              default:
                if (e & 1024) throw Error(s(163));
            }
            if (((e = t.sibling), e !== null)) {
              ((e.return = t.return), (il = e));
              break;
            }
            il = t.return;
          }
    }
    function ol(e, t, n) {
      var r = n.flags;
      switch (n.tag) {
        case 0:
        case 11:
        case 15:
          (bl(e, n), r & 4 && Vc(5, n));
          break;
        case 1:
          if ((bl(e, n), r & 4))
            if (((e = n.stateNode), t === null))
              try {
                e.componentDidMount();
              } catch (e) {
                Z(n, n.return, e);
              }
            else {
              var i = Ks(n.type, t.memoizedProps);
              t = t.memoizedState;
              try {
                e.componentDidUpdate(i, t, e.__reactInternalSnapshotBeforeUpdate);
              } catch (e) {
                Z(n, n.return, e);
              }
            }
          (r & 64 && Uc(n), r & 512 && Gc(n, n.return));
          break;
        case 3:
          if ((bl(e, n), r & 64 && ((e = n.updateQueue), e !== null))) {
            if (((t = null), n.child !== null))
              switch (n.child.tag) {
                case 27:
                case 5:
                  t = n.child.stateNode;
                  break;
                case 1:
                  t = n.child.stateNode;
              }
            try {
              Za(e, t);
            } catch (e) {
              Z(n, n.return, e);
            }
          }
          break;
        case 27:
          t === null && r & 4 && $c(n);
        case 26:
        case 5:
          (bl(e, n), t === null && r & 4 && qc(n), r & 512 && Gc(n, n.return));
          break;
        case 12:
          bl(e, n);
          break;
        case 31:
          (bl(e, n), r & 4 && dl(e, n));
          break;
        case 13:
          (bl(e, n),
            r & 4 && fl(e, n),
            r & 64 &&
              ((e = n.memoizedState),
              e !== null &&
                ((e = e.dehydrated), e !== null && ((n = Ju.bind(null, n)), sf(e, n)))));
          break;
        case 22:
          if (((r = n.memoizedState !== null || el), !r)) {
            ((t = (t !== null && t.memoizedState !== null) || tl), (i = el));
            var a = tl;
            ((el = r),
              (tl = t) && !a ? Sl(e, n, (n.subtreeFlags & 8772) != 0) : bl(e, n),
              (el = i),
              (tl = a));
          }
          break;
        case 30:
          break;
        default:
          bl(e, n);
      }
    }
    function sl(e) {
      var t = e.alternate;
      (t !== null && ((e.alternate = null), sl(t)),
        (e.child = null),
        (e.deletions = null),
        (e.sibling = null),
        e.tag === 5 && ((t = e.stateNode), t !== null && bt(t)),
        (e.stateNode = null),
        (e.return = null),
        (e.dependencies = null),
        (e.memoizedProps = null),
        (e.memoizedState = null),
        (e.pendingProps = null),
        (e.stateNode = null),
        (e.updateQueue = null));
    }
    var G = null,
      cl = !1;
    function ll(e, t, n) {
      for (n = n.child; n !== null; ) (ul(e, t, n), (n = n.sibling));
    }
    function ul(e, t, n) {
      if (Ve && typeof Ve.onCommitFiberUnmount == `function`)
        try {
          Ve.onCommitFiberUnmount(Be, n);
        } catch {}
      switch (n.tag) {
        case 26:
          (tl || Kc(n, t),
            ll(e, t, n),
            n.memoizedState
              ? n.memoizedState.count--
              : n.stateNode && ((n = n.stateNode), n.parentNode.removeChild(n)));
          break;
        case 27:
          tl || Kc(n, t);
          var r = G,
            i = cl;
          (Zd(n.type) && ((G = n.stateNode), (cl = !1)),
            ll(e, t, n),
            pf(n.stateNode),
            (G = r),
            (cl = i));
          break;
        case 5:
          tl || Kc(n, t);
        case 6:
          if (((r = G), (i = cl), (G = null), ll(e, t, n), (G = r), (cl = i), G !== null))
            if (cl)
              try {
                (G.nodeType === 9
                  ? G.body
                  : G.nodeName === `HTML`
                    ? G.ownerDocument.body
                    : G
                ).removeChild(n.stateNode);
              } catch (e) {
                Z(n, t, e);
              }
            else
              try {
                G.removeChild(n.stateNode);
              } catch (e) {
                Z(n, t, e);
              }
          break;
        case 18:
          G !== null &&
            (cl
              ? ((e = G),
                Qd(
                  e.nodeType === 9 ? e.body : e.nodeName === `HTML` ? e.ownerDocument.body : e,
                  n.stateNode,
                ),
                Np(e))
              : Qd(G, n.stateNode));
          break;
        case 4:
          ((r = G),
            (i = cl),
            (G = n.stateNode.containerInfo),
            (cl = !0),
            ll(e, t, n),
            (G = r),
            (cl = i));
          break;
        case 0:
        case 11:
        case 14:
        case 15:
          (Hc(2, n, t), tl || Hc(4, n, t), ll(e, t, n));
          break;
        case 1:
          (tl ||
            (Kc(n, t),
            (r = n.stateNode),
            typeof r.componentWillUnmount == `function` && Wc(n, t, r)),
            ll(e, t, n));
          break;
        case 21:
          ll(e, t, n);
          break;
        case 22:
          ((tl = (r = tl) || n.memoizedState !== null), ll(e, t, n), (tl = r));
          break;
        default:
          ll(e, t, n);
      }
    }
    function dl(e, t) {
      if (
        t.memoizedState === null &&
        ((e = t.alternate), e !== null && ((e = e.memoizedState), e !== null))
      ) {
        e = e.dehydrated;
        try {
          Np(e);
        } catch (e) {
          Z(t, t.return, e);
        }
      }
    }
    function fl(e, t) {
      if (
        t.memoizedState === null &&
        ((e = t.alternate),
        e !== null && ((e = e.memoizedState), e !== null && ((e = e.dehydrated), e !== null)))
      )
        try {
          Np(e);
        } catch (e) {
          Z(t, t.return, e);
        }
    }
    function pl(e) {
      switch (e.tag) {
        case 31:
        case 13:
        case 19:
          var t = e.stateNode;
          return (t === null && (t = e.stateNode = new rl()), t);
        case 22:
          return (
            (e = e.stateNode),
            (t = e._retryCache),
            t === null && (t = e._retryCache = new rl()),
            t
          );
        default:
          throw Error(s(435, e.tag));
      }
    }
    function ml(e, t) {
      var n = pl(e);
      t.forEach(function (t) {
        if (!n.has(t)) {
          n.add(t);
          var r = Yu.bind(null, e, t);
          t.then(r, r);
        }
      });
    }
    function hl(e, t) {
      var n = t.deletions;
      if (n !== null)
        for (var r = 0; r < n.length; r++) {
          var i = n[r],
            a = e,
            o = t,
            c = o;
          a: for (; c !== null; ) {
            switch (c.tag) {
              case 27:
                if (Zd(c.type)) {
                  ((G = c.stateNode), (cl = !1));
                  break a;
                }
                break;
              case 5:
                ((G = c.stateNode), (cl = !1));
                break a;
              case 3:
              case 4:
                ((G = c.stateNode.containerInfo), (cl = !0));
                break a;
            }
            c = c.return;
          }
          if (G === null) throw Error(s(160));
          (ul(a, o, i),
            (G = null),
            (cl = !1),
            (a = i.alternate),
            a !== null && (a.return = null),
            (i.return = null));
        }
      if (t.subtreeFlags & 13886) for (t = t.child; t !== null; ) (_l(t, e), (t = t.sibling));
    }
    var gl = null;
    function _l(e, t) {
      var n = e.alternate,
        r = e.flags;
      switch (e.tag) {
        case 0:
        case 11:
        case 14:
        case 15:
          (hl(t, e), vl(e), r & 4 && (Hc(3, e, e.return), Vc(3, e), Hc(5, e, e.return)));
          break;
        case 1:
          (hl(t, e),
            vl(e),
            r & 512 && (tl || n === null || Kc(n, n.return)),
            r & 64 &&
              el &&
              ((e = e.updateQueue),
              e !== null &&
                ((r = e.callbacks),
                r !== null &&
                  ((n = e.shared.hiddenCallbacks),
                  (e.shared.hiddenCallbacks = n === null ? r : n.concat(r))))));
          break;
        case 26:
          var i = gl;
          if ((hl(t, e), vl(e), r & 512 && (tl || n === null || Kc(n, n.return)), r & 4)) {
            var a = n === null ? null : n.memoizedState;
            if (((r = e.memoizedState), n === null))
              if (r === null)
                if (e.stateNode === null) {
                  a: {
                    ((r = e.type), (n = e.memoizedProps), (i = i.ownerDocument || i));
                    b: switch (r) {
                      case `title`:
                        ((a = i.getElementsByTagName(`title`)[0]),
                          (!a ||
                            a[yt] ||
                            a[ft] ||
                            a.namespaceURI === `http://www.w3.org/2000/svg` ||
                            a.hasAttribute(`itemprop`)) &&
                            ((a = i.createElement(r)),
                            i.head.insertBefore(a, i.querySelector(`head > title`))),
                          Pd(a, r, n),
                          (a[ft] = e),
                          N(a),
                          (r = a));
                        break a;
                      case `link`:
                        var o = Vf(`link`, `href`, i).get(r + (n.href || ``));
                        if (o) {
                          for (var c = 0; c < o.length; c++)
                            if (
                              ((a = o[c]),
                              a.getAttribute(`href`) ===
                                (n.href == null || n.href === `` ? null : n.href) &&
                                a.getAttribute(`rel`) === (n.rel == null ? null : n.rel) &&
                                a.getAttribute(`title`) === (n.title == null ? null : n.title) &&
                                a.getAttribute(`crossorigin`) ===
                                  (n.crossOrigin == null ? null : n.crossOrigin))
                            ) {
                              o.splice(c, 1);
                              break b;
                            }
                        }
                        ((a = i.createElement(r)), Pd(a, r, n), i.head.appendChild(a));
                        break;
                      case `meta`:
                        if ((o = Vf(`meta`, `content`, i).get(r + (n.content || ``)))) {
                          for (c = 0; c < o.length; c++)
                            if (
                              ((a = o[c]),
                              a.getAttribute(`content`) ===
                                (n.content == null ? null : `` + n.content) &&
                                a.getAttribute(`name`) === (n.name == null ? null : n.name) &&
                                a.getAttribute(`property`) ===
                                  (n.property == null ? null : n.property) &&
                                a.getAttribute(`http-equiv`) ===
                                  (n.httpEquiv == null ? null : n.httpEquiv) &&
                                a.getAttribute(`charset`) ===
                                  (n.charSet == null ? null : n.charSet))
                            ) {
                              o.splice(c, 1);
                              break b;
                            }
                        }
                        ((a = i.createElement(r)), Pd(a, r, n), i.head.appendChild(a));
                        break;
                      default:
                        throw Error(s(468, r));
                    }
                    ((a[ft] = e), N(a), (r = a));
                  }
                  e.stateNode = r;
                } else Hf(i, e.type, e.stateNode);
              else e.stateNode = If(i, r, e.memoizedProps);
            else
              a === r
                ? r === null && e.stateNode !== null && Jc(e, e.memoizedProps, n.memoizedProps)
                : (a === null
                    ? n.stateNode !== null && ((n = n.stateNode), n.parentNode.removeChild(n))
                    : a.count--,
                  r === null ? Hf(i, e.type, e.stateNode) : If(i, r, e.memoizedProps));
          }
          break;
        case 27:
          (hl(t, e),
            vl(e),
            r & 512 && (tl || n === null || Kc(n, n.return)),
            n !== null && r & 4 && Jc(e, e.memoizedProps, n.memoizedProps));
          break;
        case 5:
          if ((hl(t, e), vl(e), r & 512 && (tl || n === null || Kc(n, n.return)), e.flags & 32)) {
            i = e.stateNode;
            try {
              qt(i, ``);
            } catch (t) {
              Z(e, e.return, t);
            }
          }
          (r & 4 &&
            e.stateNode != null &&
            ((i = e.memoizedProps), Jc(e, i, n === null ? i : n.memoizedProps)),
            r & 1024 && (nl = !0));
          break;
        case 6:
          if ((hl(t, e), vl(e), r & 4)) {
            if (e.stateNode === null) throw Error(s(162));
            ((r = e.memoizedProps), (n = e.stateNode));
            try {
              n.nodeValue = r;
            } catch (t) {
              Z(e, e.return, t);
            }
          }
          break;
        case 3:
          if (
            ((Bf = null),
            (i = gl),
            (gl = gf(t.containerInfo)),
            hl(t, e),
            (gl = i),
            vl(e),
            r & 4 && n !== null && n.memoizedState.isDehydrated)
          )
            try {
              Np(t.containerInfo);
            } catch (t) {
              Z(e, e.return, t);
            }
          nl && ((nl = !1), yl(e));
          break;
        case 4:
          ((r = gl), (gl = gf(e.stateNode.containerInfo)), hl(t, e), vl(e), (gl = r));
          break;
        case 12:
          (hl(t, e), vl(e));
          break;
        case 31:
          (hl(t, e),
            vl(e),
            r & 4 && ((r = e.updateQueue), r !== null && ((e.updateQueue = null), ml(e, r))));
          break;
        case 13:
          (hl(t, e),
            vl(e),
            e.child.flags & 8192 &&
              (e.memoizedState !== null) != (n !== null && n.memoizedState !== null) &&
              ($l = je()),
            r & 4 && ((r = e.updateQueue), r !== null && ((e.updateQueue = null), ml(e, r))));
          break;
        case 22:
          i = e.memoizedState !== null;
          var l = n !== null && n.memoizedState !== null,
            u = el,
            d = tl;
          if (((el = u || i), (tl = d || l), hl(t, e), (tl = d), (el = u), vl(e), r & 8192))
            a: for (
              t = e.stateNode,
                t._visibility = i ? t._visibility & -2 : t._visibility | 1,
                i && (n === null || l || el || tl || xl(e)),
                n = null,
                t = e;
              ;
            ) {
              if (t.tag === 5 || t.tag === 26) {
                if (n === null) {
                  l = n = t;
                  try {
                    if (((a = l.stateNode), i))
                      ((o = a.style),
                        typeof o.setProperty == `function`
                          ? o.setProperty(`display`, `none`, `important`)
                          : (o.display = `none`));
                    else {
                      c = l.stateNode;
                      var f = l.memoizedProps.style,
                        p = f != null && f.hasOwnProperty(`display`) ? f.display : null;
                      c.style.display = p == null || typeof p == `boolean` ? `` : (`` + p).trim();
                    }
                  } catch (e) {
                    Z(l, l.return, e);
                  }
                }
              } else if (t.tag === 6) {
                if (n === null) {
                  l = t;
                  try {
                    l.stateNode.nodeValue = i ? `` : l.memoizedProps;
                  } catch (e) {
                    Z(l, l.return, e);
                  }
                }
              } else if (t.tag === 18) {
                if (n === null) {
                  l = t;
                  try {
                    var m = l.stateNode;
                    i ? $d(m, !0) : $d(l.stateNode, !1);
                  } catch (e) {
                    Z(l, l.return, e);
                  }
                }
              } else if (
                ((t.tag !== 22 && t.tag !== 23) || t.memoizedState === null || t === e) &&
                t.child !== null
              ) {
                ((t.child.return = t), (t = t.child));
                continue;
              }
              if (t === e) break a;
              for (; t.sibling === null; ) {
                if (t.return === null || t.return === e) break a;
                (n === t && (n = null), (t = t.return));
              }
              (n === t && (n = null), (t.sibling.return = t.return), (t = t.sibling));
            }
          r & 4 &&
            ((r = e.updateQueue),
            r !== null && ((n = r.retryQueue), n !== null && ((r.retryQueue = null), ml(e, n))));
          break;
        case 19:
          (hl(t, e),
            vl(e),
            r & 4 && ((r = e.updateQueue), r !== null && ((e.updateQueue = null), ml(e, r))));
          break;
        case 30:
          break;
        case 21:
          break;
        default:
          (hl(t, e), vl(e));
      }
    }
    function vl(e) {
      var t = e.flags;
      if (t & 2) {
        try {
          for (var n, r = e.return; r !== null; ) {
            if (Yc(r)) {
              n = r;
              break;
            }
            r = r.return;
          }
          if (n == null) throw Error(s(160));
          switch (n.tag) {
            case 27:
              var i = n.stateNode;
              Qc(e, Xc(e), i);
              break;
            case 5:
              var a = n.stateNode;
              (n.flags & 32 && (qt(a, ``), (n.flags &= -33)), Qc(e, Xc(e), a));
              break;
            case 3:
            case 4:
              var o = n.stateNode.containerInfo;
              Zc(e, Xc(e), o);
              break;
            default:
              throw Error(s(161));
          }
        } catch (t) {
          Z(e, e.return, t);
        }
        e.flags &= -3;
      }
      t & 4096 && (e.flags &= -4097);
    }
    function yl(e) {
      if (e.subtreeFlags & 1024)
        for (e = e.child; e !== null; ) {
          var t = e;
          (yl(t), t.tag === 5 && t.flags & 1024 && t.stateNode.reset(), (e = e.sibling));
        }
    }
    function bl(e, t) {
      if (t.subtreeFlags & 8772)
        for (t = t.child; t !== null; ) (ol(e, t.alternate, t), (t = t.sibling));
    }
    function xl(e) {
      for (e = e.child; e !== null; ) {
        var t = e;
        switch (t.tag) {
          case 0:
          case 11:
          case 14:
          case 15:
            (Hc(4, t, t.return), xl(t));
            break;
          case 1:
            Kc(t, t.return);
            var n = t.stateNode;
            (typeof n.componentWillUnmount == `function` && Wc(t, t.return, n), xl(t));
            break;
          case 27:
            pf(t.stateNode);
          case 26:
          case 5:
            (Kc(t, t.return), xl(t));
            break;
          case 22:
            t.memoizedState === null && xl(t);
            break;
          case 30:
            xl(t);
            break;
          default:
            xl(t);
        }
        e = e.sibling;
      }
    }
    function Sl(e, t, n) {
      for (n &&= (t.subtreeFlags & 8772) != 0, t = t.child; t !== null; ) {
        var r = t.alternate,
          i = e,
          a = t,
          o = a.flags;
        switch (a.tag) {
          case 0:
          case 11:
          case 15:
            (Sl(i, a, n), Vc(4, a));
            break;
          case 1:
            if ((Sl(i, a, n), (r = a), (i = r.stateNode), typeof i.componentDidMount == `function`))
              try {
                i.componentDidMount();
              } catch (e) {
                Z(r, r.return, e);
              }
            if (((r = a), (i = r.updateQueue), i !== null)) {
              var s = r.stateNode;
              try {
                var c = i.shared.hiddenCallbacks;
                if (c !== null)
                  for (i.shared.hiddenCallbacks = null, i = 0; i < c.length; i++) Xa(c[i], s);
              } catch (e) {
                Z(r, r.return, e);
              }
            }
            (n && o & 64 && Uc(a), Gc(a, a.return));
            break;
          case 27:
            $c(a);
          case 26:
          case 5:
            (Sl(i, a, n), n && r === null && o & 4 && qc(a), Gc(a, a.return));
            break;
          case 12:
            Sl(i, a, n);
            break;
          case 31:
            (Sl(i, a, n), n && o & 4 && dl(i, a));
            break;
          case 13:
            (Sl(i, a, n), n && o & 4 && fl(i, a));
            break;
          case 22:
            (a.memoizedState === null && Sl(i, a, n), Gc(a, a.return));
            break;
          case 30:
            break;
          default:
            Sl(i, a, n);
        }
        t = t.sibling;
      }
    }
    function Cl(e, t) {
      var n = null;
      (e !== null &&
        e.memoizedState !== null &&
        e.memoizedState.cachePool !== null &&
        (n = e.memoizedState.cachePool.pool),
        (e = null),
        t.memoizedState !== null &&
          t.memoizedState.cachePool !== null &&
          (e = t.memoizedState.cachePool.pool),
        e !== n && (e != null && e.refCount++, n != null && la(n)));
    }
    function wl(e, t) {
      ((e = null),
        t.alternate !== null && (e = t.alternate.memoizedState.cache),
        (t = t.memoizedState.cache),
        t !== e && (t.refCount++, e != null && la(e)));
    }
    function Tl(e, t, n, r) {
      if (t.subtreeFlags & 10256) for (t = t.child; t !== null; ) (El(e, t, n, r), (t = t.sibling));
    }
    function El(e, t, n, r) {
      var i = t.flags;
      switch (t.tag) {
        case 0:
        case 11:
        case 15:
          (Tl(e, t, n, r), i & 2048 && Vc(9, t));
          break;
        case 1:
          Tl(e, t, n, r);
          break;
        case 3:
          (Tl(e, t, n, r),
            i & 2048 &&
              ((e = null),
              t.alternate !== null && (e = t.alternate.memoizedState.cache),
              (t = t.memoizedState.cache),
              t !== e && (t.refCount++, e != null && la(e))));
          break;
        case 12:
          if (i & 2048) {
            (Tl(e, t, n, r), (e = t.stateNode));
            try {
              var a = t.memoizedProps,
                o = a.id,
                s = a.onPostCommit;
              typeof s == `function` &&
                s(o, t.alternate === null ? `mount` : `update`, e.passiveEffectDuration, -0);
            } catch (e) {
              Z(t, t.return, e);
            }
          } else Tl(e, t, n, r);
          break;
        case 31:
          Tl(e, t, n, r);
          break;
        case 13:
          Tl(e, t, n, r);
          break;
        case 23:
          break;
        case 22:
          ((a = t.stateNode),
            (o = t.alternate),
            t.memoizedState === null
              ? a._visibility & 2
                ? Tl(e, t, n, r)
                : ((a._visibility |= 2), Dl(e, t, n, r, (t.subtreeFlags & 10256) != 0 || !1))
              : a._visibility & 2
                ? Tl(e, t, n, r)
                : Ol(e, t),
            i & 2048 && Cl(o, t));
          break;
        case 24:
          (Tl(e, t, n, r), i & 2048 && wl(t.alternate, t));
          break;
        default:
          Tl(e, t, n, r);
      }
    }
    function Dl(e, t, n, r, i) {
      for (i &&= (t.subtreeFlags & 10256) != 0 || !1, t = t.child; t !== null; ) {
        var a = e,
          o = t,
          s = n,
          c = r,
          l = o.flags;
        switch (o.tag) {
          case 0:
          case 11:
          case 15:
            (Dl(a, o, s, c, i), Vc(8, o));
            break;
          case 23:
            break;
          case 22:
            var u = o.stateNode;
            (o.memoizedState === null
              ? ((u._visibility |= 2), Dl(a, o, s, c, i))
              : u._visibility & 2
                ? Dl(a, o, s, c, i)
                : Ol(a, o),
              i && l & 2048 && Cl(o.alternate, o));
            break;
          case 24:
            (Dl(a, o, s, c, i), i && l & 2048 && wl(o.alternate, o));
            break;
          default:
            Dl(a, o, s, c, i);
        }
        t = t.sibling;
      }
    }
    function Ol(e, t) {
      if (t.subtreeFlags & 10256)
        for (t = t.child; t !== null; ) {
          var n = e,
            r = t,
            i = r.flags;
          switch (r.tag) {
            case 22:
              (Ol(n, r), i & 2048 && Cl(r.alternate, r));
              break;
            case 24:
              (Ol(n, r), i & 2048 && wl(r.alternate, r));
              break;
            default:
              Ol(n, r);
          }
          t = t.sibling;
        }
    }
    var kl = 8192;
    function Al(e, t, n) {
      if (e.subtreeFlags & kl) for (e = e.child; e !== null; ) (jl(e, t, n), (e = e.sibling));
    }
    function jl(e, t, n) {
      switch (e.tag) {
        case 26:
          (Al(e, t, n),
            e.flags & kl &&
              e.memoizedState !== null &&
              Gf(n, gl, e.memoizedState, e.memoizedProps));
          break;
        case 5:
          Al(e, t, n);
          break;
        case 3:
        case 4:
          var r = gl;
          ((gl = gf(e.stateNode.containerInfo)), Al(e, t, n), (gl = r));
          break;
        case 22:
          e.memoizedState === null &&
            ((r = e.alternate),
            r !== null && r.memoizedState !== null
              ? ((r = kl), (kl = 16777216), Al(e, t, n), (kl = r))
              : Al(e, t, n));
          break;
        default:
          Al(e, t, n);
      }
    }
    function Ml(e) {
      var t = e.alternate;
      if (t !== null && ((e = t.child), e !== null)) {
        t.child = null;
        do ((t = e.sibling), (e.sibling = null), (e = t));
        while (e !== null);
      }
    }
    function Nl(e) {
      var t = e.deletions;
      if (e.flags & 16) {
        if (t !== null)
          for (var n = 0; n < t.length; n++) {
            var r = t[n];
            ((il = r), Il(r, e));
          }
        Ml(e);
      }
      if (e.subtreeFlags & 10256) for (e = e.child; e !== null; ) (Pl(e), (e = e.sibling));
    }
    function Pl(e) {
      switch (e.tag) {
        case 0:
        case 11:
        case 15:
          (Nl(e), e.flags & 2048 && Hc(9, e, e.return));
          break;
        case 3:
          Nl(e);
          break;
        case 12:
          Nl(e);
          break;
        case 22:
          var t = e.stateNode;
          e.memoizedState !== null &&
          t._visibility & 2 &&
          (e.return === null || e.return.tag !== 13)
            ? ((t._visibility &= -3), Fl(e))
            : Nl(e);
          break;
        default:
          Nl(e);
      }
    }
    function Fl(e) {
      var t = e.deletions;
      if (e.flags & 16) {
        if (t !== null)
          for (var n = 0; n < t.length; n++) {
            var r = t[n];
            ((il = r), Il(r, e));
          }
        Ml(e);
      }
      for (e = e.child; e !== null; ) {
        switch (((t = e), t.tag)) {
          case 0:
          case 11:
          case 15:
            (Hc(8, t, t.return), Fl(t));
            break;
          case 22:
            ((n = t.stateNode), n._visibility & 2 && ((n._visibility &= -3), Fl(t)));
            break;
          default:
            Fl(t);
        }
        e = e.sibling;
      }
    }
    function Il(e, t) {
      for (; il !== null; ) {
        var n = il;
        switch (n.tag) {
          case 0:
          case 11:
          case 15:
            Hc(8, n, t);
            break;
          case 23:
          case 22:
            if (n.memoizedState !== null && n.memoizedState.cachePool !== null) {
              var r = n.memoizedState.cachePool.pool;
              r != null && r.refCount++;
            }
            break;
          case 24:
            la(n.memoizedState.cache);
        }
        if (((r = n.child), r !== null)) ((r.return = n), (il = r));
        else
          a: for (n = e; il !== null; ) {
            r = il;
            var i = r.sibling,
              a = r.return;
            if ((sl(r), r === n)) {
              il = null;
              break a;
            }
            if (i !== null) {
              ((i.return = a), (il = i));
              break a;
            }
            il = a;
          }
      }
    }
    var Ll = {
        getCacheForType: function (e) {
          var t = ta(sa),
            n = t.data.get(e);
          return (n === void 0 && ((n = e()), t.data.set(e, n)), n);
        },
        cacheSignal: function () {
          return ta(sa).controller.signal;
        },
      },
      Rl = typeof WeakMap == `function` ? WeakMap : Map,
      K = 0,
      q = null,
      J = null,
      Y = 0,
      X = 0,
      zl = null,
      Bl = !1,
      Vl = !1,
      Hl = !1,
      Ul = 0,
      Wl = 0,
      Gl = 0,
      Kl = 0,
      ql = 0,
      Jl = 0,
      Yl = 0,
      Xl = null,
      Zl = null,
      Ql = !1,
      $l = 0,
      eu = 0,
      tu = 1 / 0,
      nu = null,
      ru = null,
      iu = 0,
      au = null,
      ou = null,
      su = 0,
      cu = 0,
      lu = null,
      uu = null,
      du = 0,
      fu = null;
    function pu() {
      return K & 2 && Y !== 0 ? Y & -Y : A.T === null ? lt() : dd();
    }
    function mu() {
      if (Jl === 0)
        if (!(Y & 536870912) || z) {
          var e = Je;
          ((Je <<= 1), !(Je & 3932160) && (Je = 262144), (Jl = e));
        } else Jl = 536870912;
      return ((e = ro.current), e !== null && (e.flags |= 32), Jl);
    }
    function hu(e, t, n) {
      (((e === q && (X === 2 || X === 9)) || e.cancelPendingCommit !== null) &&
        (Su(e, 0), yu(e, Y, Jl, !1)),
        nt(e, n),
        (!(K & 2) || e !== q) &&
          (e === q && (!(K & 2) && (Kl |= n), Wl === 4 && yu(e, Y, Jl, !1)), rd(e)));
    }
    function gu(e, t, n) {
      if (K & 6) throw Error(s(327));
      var r = (!n && (t & 127) == 0 && (t & e.expiredLanes) === 0) || Qe(e, t),
        i = r ? Au(e, t) : Ou(e, t, !0),
        a = r;
      do {
        if (i === 0) {
          Vl && !r && yu(e, t, 0, !1);
          break;
        } else {
          if (((n = e.current.alternate), a && !vu(n))) {
            ((i = Ou(e, t, !1)), (a = !1));
            continue;
          }
          if (i === 2) {
            if (((a = t), e.errorRecoveryDisabledLanes & a)) var o = 0;
            else
              ((o = e.pendingLanes & -536870913),
                (o = o === 0 ? (o & 536870912 ? 536870912 : 0) : o));
            if (o !== 0) {
              t = o;
              a: {
                var c = e;
                i = Xl;
                var l = c.current.memoizedState.isDehydrated;
                if ((l && (Su(c, o).flags |= 256), (o = Ou(c, o, !1)), o !== 2)) {
                  if (Hl && !l) {
                    ((c.errorRecoveryDisabledLanes |= a), (Kl |= a), (i = 4));
                    break a;
                  }
                  ((a = Zl),
                    (Zl = i),
                    a !== null && (Zl === null ? (Zl = a) : Zl.push.apply(Zl, a)));
                }
                i = o;
              }
              if (((a = !1), i !== 2)) continue;
            }
          }
          if (i === 1) {
            (Su(e, 0), yu(e, t, 0, !0));
            break;
          }
          a: {
            switch (((r = e), (a = i), a)) {
              case 0:
              case 1:
                throw Error(s(345));
              case 4:
                if ((t & 4194048) !== t) break;
              case 6:
                yu(r, t, Jl, !Bl);
                break a;
              case 2:
                Zl = null;
                break;
              case 3:
              case 5:
                break;
              default:
                throw Error(s(329));
            }
            if ((t & 62914560) === t && ((i = $l + 300 - je()), 10 < i)) {
              if ((yu(r, t, Jl, !Bl), Ze(r, 0, !0) !== 0)) break a;
              ((su = t),
                (r.timeoutHandle = Kd(
                  _u.bind(null, r, n, Zl, nu, Ql, t, Jl, Kl, Yl, Bl, a, `Throttled`, -0, 0),
                  i,
                )));
              break a;
            }
            _u(r, n, Zl, nu, Ql, t, Jl, Kl, Yl, Bl, a, null, -0, 0);
          }
        }
        break;
      } while (1);
      rd(e);
    }
    function _u(e, t, n, r, i, a, o, s, c, l, u, d, f, p) {
      if (((e.timeoutHandle = -1), (d = t.subtreeFlags), d & 8192 || (d & 16785408) == 16785408)) {
        ((d = {
          stylesheets: null,
          count: 0,
          imgCount: 0,
          imgBytes: 0,
          suspenseyImages: [],
          waitingForImages: !0,
          waitingForViewTransition: !1,
          unsuspend: tn,
        }),
          jl(t, a, d));
        var m = (a & 62914560) === a ? $l - je() : (a & 4194048) === a ? eu - je() : 0;
        if (((m = qf(d, m)), m !== null)) {
          ((su = a),
            (e.cancelPendingCommit = m(Lu.bind(null, e, t, a, n, r, i, o, s, c, u, d, null, f, p))),
            yu(e, a, o, !l));
          return;
        }
      }
      Lu(e, t, a, n, r, i, o, s, c);
    }
    function vu(e) {
      for (var t = e; ; ) {
        var n = t.tag;
        if (
          (n === 0 || n === 11 || n === 15) &&
          t.flags & 16384 &&
          ((n = t.updateQueue), n !== null && ((n = n.stores), n !== null))
        )
          for (var r = 0; r < n.length; r++) {
            var i = n[r],
              a = i.getSnapshot;
            i = i.value;
            try {
              if (!Cr(a(), i)) return !1;
            } catch {
              return !1;
            }
          }
        if (((n = t.child), t.subtreeFlags & 16384 && n !== null)) ((n.return = t), (t = n));
        else {
          if (t === e) break;
          for (; t.sibling === null; ) {
            if (t.return === null || t.return === e) return !0;
            t = t.return;
          }
          ((t.sibling.return = t.return), (t = t.sibling));
        }
      }
      return !0;
    }
    function yu(e, t, n, r) {
      ((t &= ~ql),
        (t &= ~Kl),
        (e.suspendedLanes |= t),
        (e.pingedLanes &= ~t),
        r && (e.warmLanes |= t),
        (r = e.expirationTimes));
      for (var i = t; 0 < i; ) {
        var a = 31 - Ue(i),
          o = 1 << a;
        ((r[a] = -1), (i &= ~o));
      }
      n !== 0 && it(e, n, t);
    }
    function bu() {
      return K & 6 ? !0 : (id(0, !1), !1);
    }
    function xu() {
      if (J !== null) {
        if (X === 0) var e = J.return;
        else ((e = J), (qi = Ki = null), ko(e), (Ma = null), (Na = 0), (e = J));
        for (; e !== null; ) (Bc(e.alternate, e), (e = e.return));
        J = null;
      }
    }
    function Su(e, t) {
      var n = e.timeoutHandle;
      (n !== -1 && ((e.timeoutHandle = -1), qd(n)),
        (n = e.cancelPendingCommit),
        n !== null && ((e.cancelPendingCommit = null), n()),
        (su = 0),
        xu(),
        (q = e),
        (J = n = di(e.current, null)),
        (Y = t),
        (X = 0),
        (zl = null),
        (Bl = !1),
        (Vl = Qe(e, t)),
        (Hl = !1),
        (Yl = Jl = ql = Kl = Gl = Wl = 0),
        (Zl = Xl = null),
        (Ql = !1),
        t & 8 && (t |= t & 32));
      var r = e.entangledLanes;
      if (r !== 0)
        for (e = e.entanglements, r &= t; 0 < r; ) {
          var i = 31 - Ue(r),
            a = 1 << i;
          ((t |= e[i]), (r &= ~a));
        }
      return ((Ul = t), ti(), n);
    }
    function Cu(e, t) {
      ((V = null),
        (A.H = Rs),
        t === Sa || t === wa
          ? ((t = Aa()), (X = 3))
          : t === Ca
            ? ((t = Aa()), (X = 4))
            : (X = t === nc ? 8 : typeof t == `object` && t && typeof t.then == `function` ? 6 : 1),
        (zl = t),
        J === null && ((Wl = 1), Xs(e, yi(t, e.current))));
    }
    function wu() {
      var e = ro.current;
      return e === null
        ? !0
        : (Y & 4194048) === Y
          ? io === null
          : (Y & 62914560) === Y || Y & 536870912
            ? e === io
            : !1;
    }
    function Tu() {
      var e = A.H;
      return ((A.H = Rs), e === null ? Rs : e);
    }
    function Eu() {
      var e = A.A;
      return ((A.A = Ll), e);
    }
    function Du() {
      ((Wl = 4),
        Bl || ((Y & 4194048) !== Y && ro.current !== null) || (Vl = !0),
        (!(Gl & 134217727) && !(Kl & 134217727)) || q === null || yu(q, Y, Jl, !1));
    }
    function Ou(e, t, n) {
      var r = K;
      K |= 2;
      var i = Tu(),
        a = Eu();
      ((q !== e || Y !== t) && ((nu = null), Su(e, t)), (t = !1));
      var o = Wl;
      a: do
        try {
          if (X !== 0 && J !== null) {
            var s = J,
              c = zl;
            switch (X) {
              case 8:
                (xu(), (o = 6));
                break a;
              case 3:
              case 2:
              case 9:
              case 6:
                ro.current === null && (t = !0);
                var l = X;
                if (((X = 0), (zl = null), Pu(e, s, c, l), n && Vl)) {
                  o = 0;
                  break a;
                }
                break;
              default:
                ((l = X), (X = 0), (zl = null), Pu(e, s, c, l));
            }
          }
          (ku(), (o = Wl));
          break;
        } catch (t) {
          Cu(e, t);
        }
      while (1);
      return (
        t && e.shellSuspendCounter++,
        (qi = Ki = null),
        (K = r),
        (A.H = i),
        (A.A = a),
        J === null && ((q = null), (Y = 0), ti()),
        o
      );
    }
    function ku() {
      for (; J !== null; ) Mu(J);
    }
    function Au(e, t) {
      var n = K;
      K |= 2;
      var r = Tu(),
        i = Eu();
      q !== e || Y !== t ? ((nu = null), (tu = je() + 500), Su(e, t)) : (Vl = Qe(e, t));
      a: do
        try {
          if (X !== 0 && J !== null) {
            t = J;
            var a = zl;
            b: switch (X) {
              case 1:
                ((X = 0), (zl = null), Pu(e, t, a, 1));
                break;
              case 2:
              case 9:
                if (Ea(a)) {
                  ((X = 0), (zl = null), Nu(t));
                  break;
                }
                ((t = function () {
                  ((X !== 2 && X !== 9) || q !== e || (X = 7), rd(e));
                }),
                  a.then(t, t));
                break a;
              case 3:
                X = 7;
                break a;
              case 4:
                X = 5;
                break a;
              case 7:
                Ea(a) ? ((X = 0), (zl = null), Nu(t)) : ((X = 0), (zl = null), Pu(e, t, a, 7));
                break;
              case 5:
                var o = null;
                switch (J.tag) {
                  case 26:
                    o = J.memoizedState;
                  case 5:
                  case 27:
                    var c = J;
                    if (o ? Wf(o) : c.stateNode.complete) {
                      ((X = 0), (zl = null));
                      var l = c.sibling;
                      if (l !== null) J = l;
                      else {
                        var u = c.return;
                        u === null ? (J = null) : ((J = u), Fu(u));
                      }
                      break b;
                    }
                }
                ((X = 0), (zl = null), Pu(e, t, a, 5));
                break;
              case 6:
                ((X = 0), (zl = null), Pu(e, t, a, 6));
                break;
              case 8:
                (xu(), (Wl = 6));
                break a;
              default:
                throw Error(s(462));
            }
          }
          ju();
          break;
        } catch (t) {
          Cu(e, t);
        }
      while (1);
      return (
        (qi = Ki = null),
        (A.H = r),
        (A.A = i),
        (K = n),
        J === null ? ((q = null), (Y = 0), ti(), Wl) : 0
      );
    }
    function ju() {
      for (; J !== null && !ke(); ) Mu(J);
    }
    function Mu(e) {
      var t = Mc(e.alternate, e, Ul);
      ((e.memoizedProps = e.pendingProps), t === null ? Fu(e) : (J = t));
    }
    function Nu(e) {
      var t = e,
        n = t.alternate;
      switch (t.tag) {
        case 15:
        case 0:
          t = gc(n, t, t.pendingProps, t.type, void 0, Y);
          break;
        case 11:
          t = gc(n, t, t.pendingProps, t.type.render, t.ref, Y);
          break;
        case 5:
          ko(t);
        default:
          (Bc(n, t), (t = J = fi(t, Ul)), (t = Mc(n, t, Ul)));
      }
      ((e.memoizedProps = e.pendingProps), t === null ? Fu(e) : (J = t));
    }
    function Pu(e, t, n, r) {
      ((qi = Ki = null), ko(t), (Ma = null), (Na = 0));
      var i = t.return;
      try {
        if (tc(e, i, t, n, Y)) {
          ((Wl = 1), Xs(e, yi(n, e.current)), (J = null));
          return;
        }
      } catch (t) {
        if (i !== null) throw ((J = i), t);
        ((Wl = 1), Xs(e, yi(n, e.current)), (J = null));
        return;
      }
      t.flags & 32768
        ? (z || r === 1
            ? (e = !0)
            : Vl || Y & 536870912
              ? (e = !1)
              : ((Bl = e = !0),
                (r === 2 || r === 9 || r === 3 || r === 6) &&
                  ((r = ro.current), r !== null && r.tag === 13 && (r.flags |= 16384))),
          Iu(t, e))
        : Fu(t);
    }
    function Fu(e) {
      var t = e;
      do {
        if (t.flags & 32768) {
          Iu(t, Bl);
          return;
        }
        e = t.return;
        var n = Rc(t.alternate, t, Ul);
        if (n !== null) {
          J = n;
          return;
        }
        if (((t = t.sibling), t !== null)) {
          J = t;
          return;
        }
        J = t = e;
      } while (t !== null);
      Wl === 0 && (Wl = 5);
    }
    function Iu(e, t) {
      do {
        var n = zc(e.alternate, e);
        if (n !== null) {
          ((n.flags &= 32767), (J = n));
          return;
        }
        if (
          ((n = e.return),
          n !== null && ((n.flags |= 32768), (n.subtreeFlags = 0), (n.deletions = null)),
          !t && ((e = e.sibling), e !== null))
        ) {
          J = e;
          return;
        }
        J = e = n;
      } while (e !== null);
      ((Wl = 6), (J = null));
    }
    function Lu(e, t, n, r, i, a, o, c, l) {
      e.cancelPendingCommit = null;
      do Hu();
      while (iu !== 0);
      if (K & 6) throw Error(s(327));
      if (t !== null) {
        if (t === e.current) throw Error(s(177));
        if (
          ((a = t.lanes | t.childLanes),
          (a |= ei),
          rt(e, n, a, o, c, l),
          e === q && ((J = q = null), (Y = 0)),
          (ou = t),
          (au = e),
          (su = n),
          (cu = a),
          (lu = i),
          (uu = r),
          t.subtreeFlags & 10256 || t.flags & 10256
            ? ((e.callbackNode = null),
              (e.callbackPriority = 0),
              Xu(Fe, function () {
                return (Uu(), null);
              }))
            : ((e.callbackNode = null), (e.callbackPriority = 0)),
          (r = (t.flags & 13878) != 0),
          t.subtreeFlags & 13878 || r)
        ) {
          ((r = A.T), (A.T = null), (i = j.p), (j.p = 2), (o = K), (K |= 4));
          try {
            al(e, t, n);
          } finally {
            ((K = o), (j.p = i), (A.T = r));
          }
        }
        ((iu = 1), Ru(), zu(), Bu());
      }
    }
    function Ru() {
      if (iu === 1) {
        iu = 0;
        var e = au,
          t = ou,
          n = (t.flags & 13878) != 0;
        if (t.subtreeFlags & 13878 || n) {
          ((n = A.T), (A.T = null));
          var r = j.p;
          j.p = 2;
          var i = K;
          K |= 4;
          try {
            _l(t, e);
            var a = zd,
              o = Or(e.containerInfo),
              s = a.focusedElem,
              c = a.selectionRange;
            if (o !== s && s && s.ownerDocument && Dr(s.ownerDocument.documentElement, s)) {
              if (c !== null && kr(s)) {
                var l = c.start,
                  u = c.end;
                if ((u === void 0 && (u = l), `selectionStart` in s))
                  ((s.selectionStart = l), (s.selectionEnd = Math.min(u, s.value.length)));
                else {
                  var d = s.ownerDocument || document,
                    f = (d && d.defaultView) || window;
                  if (f.getSelection) {
                    var p = f.getSelection(),
                      m = s.textContent.length,
                      h = Math.min(c.start, m),
                      g = c.end === void 0 ? h : Math.min(c.end, m);
                    !p.extend && h > g && ((o = g), (g = h), (h = o));
                    var _ = Er(s, h),
                      v = Er(s, g);
                    if (
                      _ &&
                      v &&
                      (p.rangeCount !== 1 ||
                        p.anchorNode !== _.node ||
                        p.anchorOffset !== _.offset ||
                        p.focusNode !== v.node ||
                        p.focusOffset !== v.offset)
                    ) {
                      var y = d.createRange();
                      (y.setStart(_.node, _.offset),
                        p.removeAllRanges(),
                        h > g
                          ? (p.addRange(y), p.extend(v.node, v.offset))
                          : (y.setEnd(v.node, v.offset), p.addRange(y)));
                    }
                  }
                }
              }
              for (d = [], p = s; (p = p.parentNode); )
                p.nodeType === 1 && d.push({ element: p, left: p.scrollLeft, top: p.scrollTop });
              for (typeof s.focus == `function` && s.focus(), s = 0; s < d.length; s++) {
                var b = d[s];
                ((b.element.scrollLeft = b.left), (b.element.scrollTop = b.top));
              }
            }
            ((sp = !!Rd), (zd = Rd = null));
          } finally {
            ((K = i), (j.p = r), (A.T = n));
          }
        }
        ((e.current = t), (iu = 2));
      }
    }
    function zu() {
      if (iu === 2) {
        iu = 0;
        var e = au,
          t = ou,
          n = (t.flags & 8772) != 0;
        if (t.subtreeFlags & 8772 || n) {
          ((n = A.T), (A.T = null));
          var r = j.p;
          j.p = 2;
          var i = K;
          K |= 4;
          try {
            ol(e, t.alternate, t);
          } finally {
            ((K = i), (j.p = r), (A.T = n));
          }
        }
        iu = 3;
      }
    }
    function Bu() {
      if (iu === 4 || iu === 3) {
        ((iu = 0), Ae());
        var e = au,
          t = ou,
          n = su,
          r = uu;
        t.subtreeFlags & 10256 || t.flags & 10256
          ? (iu = 5)
          : ((iu = 0), (ou = au = null), Vu(e, e.pendingLanes));
        var i = e.pendingLanes;
        if (
          (i === 0 && (ru = null),
          ct(n),
          (t = t.stateNode),
          Ve && typeof Ve.onCommitFiberRoot == `function`)
        )
          try {
            Ve.onCommitFiberRoot(Be, t, void 0, (t.current.flags & 128) == 128);
          } catch {}
        if (r !== null) {
          ((t = A.T), (i = j.p), (j.p = 2), (A.T = null));
          try {
            for (var a = e.onRecoverableError, o = 0; o < r.length; o++) {
              var s = r[o];
              a(s.value, { componentStack: s.stack });
            }
          } finally {
            ((A.T = t), (j.p = i));
          }
        }
        (su & 3 && Hu(),
          rd(e),
          (i = e.pendingLanes),
          n & 261930 && i & 42 ? (e === fu ? du++ : ((du = 0), (fu = e))) : (du = 0),
          id(0, !1));
      }
    }
    function Vu(e, t) {
      (e.pooledCacheLanes &= t) === 0 &&
        ((t = e.pooledCache), t != null && ((e.pooledCache = null), la(t)));
    }
    function Hu() {
      return (Ru(), zu(), Bu(), Uu());
    }
    function Uu() {
      if (iu !== 5) return !1;
      var e = au,
        t = cu;
      cu = 0;
      var n = ct(su),
        r = A.T,
        i = j.p;
      try {
        ((j.p = 32 > n ? 32 : n), (A.T = null), (n = lu), (lu = null));
        var a = au,
          o = su;
        if (((iu = 0), (ou = au = null), (su = 0), K & 6)) throw Error(s(331));
        var c = K;
        if (
          ((K |= 4),
          Pl(a.current),
          El(a, a.current, o, n),
          (K = c),
          id(0, !1),
          Ve && typeof Ve.onPostCommitFiberRoot == `function`)
        )
          try {
            Ve.onPostCommitFiberRoot(Be, a);
          } catch {}
        return !0;
      } finally {
        ((j.p = i), (A.T = r), Vu(e, t));
      }
    }
    function Wu(e, t, n) {
      ((t = yi(n, t)),
        (t = Qs(e.stateNode, t, 2)),
        (e = Wa(e, t, 2)),
        e !== null && (nt(e, 2), rd(e)));
    }
    function Z(e, t, n) {
      if (e.tag === 3) Wu(e, e, n);
      else
        for (; t !== null; ) {
          if (t.tag === 3) {
            Wu(t, e, n);
            break;
          } else if (t.tag === 1) {
            var r = t.stateNode;
            if (
              typeof t.type.getDerivedStateFromError == `function` ||
              (typeof r.componentDidCatch == `function` && (ru === null || !ru.has(r)))
            ) {
              ((e = yi(n, e)),
                (n = $s(2)),
                (r = Wa(t, n, 2)),
                r !== null && (ec(n, r, t, e), nt(r, 2), rd(r)));
              break;
            }
          }
          t = t.return;
        }
    }
    function Gu(e, t, n) {
      var r = e.pingCache;
      if (r === null) {
        r = e.pingCache = new Rl();
        var i = new Set();
        r.set(t, i);
      } else ((i = r.get(t)), i === void 0 && ((i = new Set()), r.set(t, i)));
      i.has(n) || ((Hl = !0), i.add(n), (e = Ku.bind(null, e, t, n)), t.then(e, e));
    }
    function Ku(e, t, n) {
      var r = e.pingCache;
      (r !== null && r.delete(t),
        (e.pingedLanes |= e.suspendedLanes & n),
        (e.warmLanes &= ~n),
        q === e &&
          (Y & n) === n &&
          (Wl === 4 || (Wl === 3 && (Y & 62914560) === Y && 300 > je() - $l)
            ? !(K & 2) && Su(e, 0)
            : (ql |= n),
          Yl === Y && (Yl = 0)),
        rd(e));
    }
    function qu(e, t) {
      (t === 0 && (t = et()), (e = ii(e, t)), e !== null && (nt(e, t), rd(e)));
    }
    function Ju(e) {
      var t = e.memoizedState,
        n = 0;
      (t !== null && (n = t.retryLane), qu(e, n));
    }
    function Yu(e, t) {
      var n = 0;
      switch (e.tag) {
        case 31:
        case 13:
          var r = e.stateNode,
            i = e.memoizedState;
          i !== null && (n = i.retryLane);
          break;
        case 19:
          r = e.stateNode;
          break;
        case 22:
          r = e.stateNode._retryCache;
          break;
        default:
          throw Error(s(314));
      }
      (r !== null && r.delete(t), qu(e, n));
    }
    function Xu(e, t) {
      return De(e, t);
    }
    var Zu = null,
      Qu = null,
      $u = !1,
      ed = !1,
      td = !1,
      nd = 0;
    function rd(e) {
      (e !== Qu && e.next === null && (Qu === null ? (Zu = Qu = e) : (Qu = Qu.next = e)),
        (ed = !0),
        $u || (($u = !0), ud()));
    }
    function id(e, t) {
      if (!td && ed) {
        td = !0;
        do
          for (var n = !1, r = Zu; r !== null; ) {
            if (!t)
              if (e !== 0) {
                var i = r.pendingLanes;
                if (i === 0) var a = 0;
                else {
                  var o = r.suspendedLanes,
                    s = r.pingedLanes;
                  ((a = (1 << (31 - Ue(42 | e) + 1)) - 1),
                    (a &= i & ~(o & ~s)),
                    (a = a & 201326741 ? (a & 201326741) | 1 : a ? a | 2 : 0));
                }
                a !== 0 && ((n = !0), ld(r, a));
              } else
                ((a = Y),
                  (a = Ze(
                    r,
                    r === q ? a : 0,
                    r.cancelPendingCommit !== null || r.timeoutHandle !== -1,
                  )),
                  !(a & 3) || Qe(r, a) || ((n = !0), ld(r, a)));
            r = r.next;
          }
        while (n);
        td = !1;
      }
    }
    function ad() {
      od();
    }
    function od() {
      ed = $u = !1;
      var e = 0;
      nd !== 0 && Gd() && (e = nd);
      for (var t = je(), n = null, r = Zu; r !== null; ) {
        var i = r.next,
          a = sd(r, t);
        (a === 0
          ? ((r.next = null), n === null ? (Zu = i) : (n.next = i), i === null && (Qu = n))
          : ((n = r), (e !== 0 || a & 3) && (ed = !0)),
          (r = i));
      }
      ((iu !== 0 && iu !== 5) || id(e, !1), nd !== 0 && (nd = 0));
    }
    function sd(e, t) {
      for (
        var n = e.suspendedLanes,
          r = e.pingedLanes,
          i = e.expirationTimes,
          a = e.pendingLanes & -62914561;
        0 < a;
      ) {
        var o = 31 - Ue(a),
          s = 1 << o,
          c = i[o];
        (c === -1
          ? ((s & n) === 0 || (s & r) !== 0) && (i[o] = $e(s, t))
          : c <= t && (e.expiredLanes |= s),
          (a &= ~s));
      }
      if (
        ((t = q),
        (n = Y),
        (n = Ze(e, e === t ? n : 0, e.cancelPendingCommit !== null || e.timeoutHandle !== -1)),
        (r = e.callbackNode),
        n === 0 || (e === t && (X === 2 || X === 9)) || e.cancelPendingCommit !== null)
      )
        return (
          r !== null && r !== null && Oe(r),
          (e.callbackNode = null),
          (e.callbackPriority = 0)
        );
      if (!(n & 3) || Qe(e, n)) {
        if (((t = n & -n), t === e.callbackPriority)) return t;
        switch ((r !== null && Oe(r), ct(n))) {
          case 2:
          case 8:
            n = Pe;
            break;
          case 32:
            n = Fe;
            break;
          case 268435456:
            n = Le;
            break;
          default:
            n = Fe;
        }
        return (
          (r = cd.bind(null, e)),
          (n = De(n, r)),
          (e.callbackPriority = t),
          (e.callbackNode = n),
          t
        );
      }
      return (
        r !== null && r !== null && Oe(r),
        (e.callbackPriority = 2),
        (e.callbackNode = null),
        2
      );
    }
    function cd(e, t) {
      if (iu !== 0 && iu !== 5) return ((e.callbackNode = null), (e.callbackPriority = 0), null);
      var n = e.callbackNode;
      if (Hu() && e.callbackNode !== n) return null;
      var r = Y;
      return (
        (r = Ze(e, e === q ? r : 0, e.cancelPendingCommit !== null || e.timeoutHandle !== -1)),
        r === 0
          ? null
          : (gu(e, r, t),
            sd(e, je()),
            e.callbackNode != null && e.callbackNode === n ? cd.bind(null, e) : null)
      );
    }
    function ld(e, t) {
      if (Hu()) return null;
      gu(e, t, !0);
    }
    function ud() {
      Yd(function () {
        K & 6 ? De(Ne, ad) : od();
      });
    }
    function dd() {
      if (nd === 0) {
        var e = fa;
        (e === 0 && ((e = qe), (qe <<= 1), !(qe & 261888) && (qe = 256)), (nd = e));
      }
      return nd;
    }
    function fd(e) {
      return e == null || typeof e == `symbol` || typeof e == `boolean`
        ? null
        : typeof e == `function`
          ? e
          : en(`` + e);
    }
    function pd(e, t) {
      var n = t.ownerDocument.createElement(`input`);
      return (
        (n.name = t.name),
        (n.value = t.value),
        e.id && n.setAttribute(`form`, e.id),
        t.parentNode.insertBefore(n, t),
        (e = new FormData(e)),
        n.parentNode.removeChild(n),
        e
      );
    }
    function md(e, t, n, r, i) {
      if (t === `submit` && n && n.stateNode === i) {
        var a = fd((i[pt] || null).action),
          o = r.submitter;
        o &&
          ((t = (t = o[pt] || null) ? fd(t.formAction) : o.getAttribute(`formAction`)),
          t !== null && ((a = t), (o = null)));
        var s = new Sn(`action`, `action`, null, r, i);
        e.push({
          event: s,
          listeners: [
            {
              instance: null,
              listener: function () {
                if (r.defaultPrevented) {
                  if (nd !== 0) {
                    var e = o ? pd(i, o) : new FormData(i);
                    ws(n, { pending: !0, data: e, method: i.method, action: a }, null, e);
                  }
                } else
                  typeof a == `function` &&
                    (s.preventDefault(),
                    (e = o ? pd(i, o) : new FormData(i)),
                    ws(n, { pending: !0, data: e, method: i.method, action: a }, a, e));
              },
              currentTarget: i,
            },
          ],
        });
      }
    }
    for (var hd = 0; hd < Yr.length; hd++) {
      var gd = Yr[hd];
      Xr(gd.toLowerCase(), `on` + (gd[0].toUpperCase() + gd.slice(1)));
    }
    (Xr(Vr, `onAnimationEnd`),
      Xr(Hr, `onAnimationIteration`),
      Xr(Ur, `onAnimationStart`),
      Xr(`dblclick`, `onDoubleClick`),
      Xr(`focusin`, `onFocus`),
      Xr(`focusout`, `onBlur`),
      Xr(Wr, `onTransitionRun`),
      Xr(Gr, `onTransitionStart`),
      Xr(Kr, `onTransitionCancel`),
      Xr(qr, `onTransitionEnd`),
      Tt(`onMouseEnter`, [`mouseout`, `mouseover`]),
      Tt(`onMouseLeave`, [`mouseout`, `mouseover`]),
      Tt(`onPointerEnter`, [`pointerout`, `pointerover`]),
      Tt(`onPointerLeave`, [`pointerout`, `pointerover`]),
      I(`onChange`, `change click focusin focusout input keydown keyup selectionchange`.split(` `)),
      I(
        `onSelect`,
        `focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange`.split(
          ` `,
        ),
      ),
      I(`onBeforeInput`, [`compositionend`, `keypress`, `textInput`, `paste`]),
      I(`onCompositionEnd`, `compositionend focusout keydown keypress keyup mousedown`.split(` `)),
      I(
        `onCompositionStart`,
        `compositionstart focusout keydown keypress keyup mousedown`.split(` `),
      ),
      I(
        `onCompositionUpdate`,
        `compositionupdate focusout keydown keypress keyup mousedown`.split(` `),
      ));
    var _d =
        `abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting`.split(
          ` `,
        ),
      vd = new Set(
        `beforetoggle cancel close invalid load scroll scrollend toggle`.split(` `).concat(_d),
      );
    function yd(e, t) {
      t = (t & 4) != 0;
      for (var n = 0; n < e.length; n++) {
        var r = e[n],
          i = r.event;
        r = r.listeners;
        a: {
          var a = void 0;
          if (t)
            for (var o = r.length - 1; 0 <= o; o--) {
              var s = r[o],
                c = s.instance,
                l = s.currentTarget;
              if (((s = s.listener), c !== a && i.isPropagationStopped())) break a;
              ((a = s), (i.currentTarget = l));
              try {
                a(i);
              } catch (e) {
                Zr(e);
              }
              ((i.currentTarget = null), (a = c));
            }
          else
            for (o = 0; o < r.length; o++) {
              if (
                ((s = r[o]),
                (c = s.instance),
                (l = s.currentTarget),
                (s = s.listener),
                c !== a && i.isPropagationStopped())
              )
                break a;
              ((a = s), (i.currentTarget = l));
              try {
                a(i);
              } catch (e) {
                Zr(e);
              }
              ((i.currentTarget = null), (a = c));
            }
        }
      }
    }
    function Q(e, t) {
      var n = t[ht];
      n === void 0 && (n = t[ht] = new Set());
      var r = e + `__bubble`;
      n.has(r) || (Cd(t, e, 2, !1), n.add(r));
    }
    function bd(e, t, n) {
      var r = 0;
      (t && (r |= 4), Cd(n, e, r, t));
    }
    var xd = `_reactListening` + Math.random().toString(36).slice(2);
    function Sd(e) {
      if (!e[xd]) {
        ((e[xd] = !0),
          P.forEach(function (t) {
            t !== `selectionchange` && (vd.has(t) || bd(t, !1, e), bd(t, !0, e));
          }));
        var t = e.nodeType === 9 ? e : e.ownerDocument;
        t === null || t[xd] || ((t[xd] = !0), bd(`selectionchange`, !1, t));
      }
    }
    function Cd(e, t, n, r) {
      switch (mp(t)) {
        case 2:
          var i = cp;
          break;
        case 8:
          i = lp;
          break;
        default:
          i = up;
      }
      ((n = i.bind(null, t, n, e)),
        (i = void 0),
        !dn || (t !== `touchstart` && t !== `touchmove` && t !== `wheel`) || (i = !0),
        r
          ? i === void 0
            ? e.addEventListener(t, n, !0)
            : e.addEventListener(t, n, { capture: !0, passive: i })
          : i === void 0
            ? e.addEventListener(t, n, !1)
            : e.addEventListener(t, n, { passive: i }));
    }
    function wd(e, t, n, r, i) {
      var a = r;
      if (!(t & 1) && !(t & 2) && r !== null)
        a: for (;;) {
          if (r === null) return;
          var o = r.tag;
          if (o === 3 || o === 4) {
            var s = r.stateNode.containerInfo;
            if (s === i) break;
            if (o === 4)
              for (o = r.return; o !== null; ) {
                var c = o.tag;
                if ((c === 3 || c === 4) && o.stateNode.containerInfo === i) return;
                o = o.return;
              }
            for (; s !== null; ) {
              if (((o = xt(s)), o === null)) return;
              if (((c = o.tag), c === 5 || c === 6 || c === 26 || c === 27)) {
                r = a = o;
                continue a;
              }
              s = s.parentNode;
            }
          }
          r = r.return;
        }
      ln(function () {
        var r = a,
          i = rn(n),
          o = [];
        a: {
          var s = Jr.get(e);
          if (s !== void 0) {
            var c = Sn,
              u = e;
            switch (e) {
              case `keypress`:
                if (_n(n) === 0) break a;
              case `keydown`:
              case `keyup`:
                c = Bn;
                break;
              case `focusin`:
                ((u = `focus`), (c = jn));
                break;
              case `focusout`:
                ((u = `blur`), (c = jn));
                break;
              case `beforeblur`:
              case `afterblur`:
                c = jn;
                break;
              case `click`:
                if (n.button === 2) break a;
              case `auxclick`:
              case `dblclick`:
              case `mousedown`:
              case `mousemove`:
              case `mouseup`:
              case `mouseout`:
              case `mouseover`:
              case `contextmenu`:
                c = kn;
                break;
              case `drag`:
              case `dragend`:
              case `dragenter`:
              case `dragexit`:
              case `dragleave`:
              case `dragover`:
              case `dragstart`:
              case `drop`:
                c = An;
                break;
              case `touchcancel`:
              case `touchend`:
              case `touchmove`:
              case `touchstart`:
                c = Hn;
                break;
              case Vr:
              case Hr:
              case Ur:
                c = Mn;
                break;
              case qr:
                c = Un;
                break;
              case `scroll`:
              case `scrollend`:
                c = wn;
                break;
              case `wheel`:
                c = Wn;
                break;
              case `copy`:
              case `cut`:
              case `paste`:
                c = Nn;
                break;
              case `gotpointercapture`:
              case `lostpointercapture`:
              case `pointercancel`:
              case `pointerdown`:
              case `pointermove`:
              case `pointerout`:
              case `pointerover`:
              case `pointerup`:
                c = Vn;
                break;
              case `toggle`:
              case `beforetoggle`:
                c = Gn;
            }
            var d = (t & 4) != 0,
              f = !d && (e === `scroll` || e === `scrollend`),
              p = d ? (s === null ? null : s + `Capture`) : s;
            d = [];
            for (var m = r, h; m !== null; ) {
              var g = m;
              if (
                ((h = g.stateNode),
                (g = g.tag),
                (g !== 5 && g !== 26 && g !== 27) ||
                  h === null ||
                  p === null ||
                  ((g = L(m, p)), g != null && d.push(Td(m, g, h))),
                f)
              )
                break;
              m = m.return;
            }
            0 < d.length && ((s = new c(s, u, null, n, i)), o.push({ event: s, listeners: d }));
          }
        }
        if (!(t & 7)) {
          a: {
            if (
              ((s = e === `mouseover` || e === `pointerover`),
              (c = e === `mouseout` || e === `pointerout`),
              s && n !== nn && (u = n.relatedTarget || n.fromElement) && (xt(u) || u[mt]))
            )
              break a;
            if (
              (c || s) &&
              ((s =
                i.window === i
                  ? i
                  : (s = i.ownerDocument)
                    ? s.defaultView || s.parentWindow
                    : window),
              c
                ? ((u = n.relatedTarget || n.toElement),
                  (c = r),
                  (u = u ? xt(u) : null),
                  u !== null &&
                    ((f = l(u)), (d = u.tag), u !== f || (d !== 5 && d !== 27 && d !== 6)) &&
                    (u = null))
                : ((c = null), (u = r)),
              c !== u)
            ) {
              if (
                ((d = kn),
                (g = `onMouseLeave`),
                (p = `onMouseEnter`),
                (m = `mouse`),
                (e === `pointerout` || e === `pointerover`) &&
                  ((d = Vn), (g = `onPointerLeave`), (p = `onPointerEnter`), (m = `pointer`)),
                (f = c == null ? s : Ct(c)),
                (h = u == null ? s : Ct(u)),
                (s = new d(g, m + `leave`, c, n, i)),
                (s.target = f),
                (s.relatedTarget = h),
                (g = null),
                xt(i) === r &&
                  ((d = new d(p, m + `enter`, u, n, i)),
                  (d.target = h),
                  (d.relatedTarget = f),
                  (g = d)),
                (f = g),
                c && u)
              )
                b: {
                  for (d = Dd, p = c, m = u, h = 0, g = p; g; g = d(g)) h++;
                  g = 0;
                  for (var _ = m; _; _ = d(_)) g++;
                  for (; 0 < h - g; ) ((p = d(p)), h--);
                  for (; 0 < g - h; ) ((m = d(m)), g--);
                  for (; h--; ) {
                    if (p === m || (m !== null && p === m.alternate)) {
                      d = p;
                      break b;
                    }
                    ((p = d(p)), (m = d(m)));
                  }
                  d = null;
                }
              else d = null;
              (c !== null && Od(o, s, c, d, !1), u !== null && f !== null && Od(o, f, u, d, !0));
            }
          }
          a: {
            if (
              ((s = r ? Ct(r) : window),
              (c = s.nodeName && s.nodeName.toLowerCase()),
              c === `select` || (c === `input` && s.type === `file`))
            )
              var v = dr;
            else if (ar(s))
              if (fr) v = xr;
              else {
                v = yr;
                var y = vr;
              }
            else
              ((c = s.nodeName),
                !c || c.toLowerCase() !== `input` || (s.type !== `checkbox` && s.type !== `radio`)
                  ? r && Zt(r.elementType) && (v = dr)
                  : (v = br));
            if ((v &&= v(e, r))) {
              or(o, v, n, i);
              break a;
            }
            (y && y(e, s, r),
              e === `focusout` &&
                r &&
                s.type === `number` &&
                r.memoizedProps.value != null &&
                Ut(s, `number`, s.value));
          }
          switch (((y = r ? Ct(r) : window), e)) {
            case `focusin`:
              (ar(y) || y.contentEditable === `true`) && ((jr = y), (Mr = r), (Nr = null));
              break;
            case `focusout`:
              Nr = Mr = jr = null;
              break;
            case `mousedown`:
              Pr = !0;
              break;
            case `contextmenu`:
            case `mouseup`:
            case `dragend`:
              ((Pr = !1), Fr(o, n, i));
              break;
            case `selectionchange`:
              if (Ar) break;
            case `keydown`:
            case `keyup`:
              Fr(o, n, i);
          }
          var b;
          if (qn)
            b: {
              switch (e) {
                case `compositionstart`:
                  var x = `onCompositionStart`;
                  break b;
                case `compositionend`:
                  x = `onCompositionEnd`;
                  break b;
                case `compositionupdate`:
                  x = `onCompositionUpdate`;
                  break b;
              }
              x = void 0;
            }
          else
            tr
              ? $n(e, n) && (x = `onCompositionEnd`)
              : e === `keydown` && n.keyCode === 229 && (x = `onCompositionStart`);
          (x &&
            (Xn &&
              n.locale !== `ko` &&
              (tr || x !== `onCompositionStart`
                ? x === `onCompositionEnd` && tr && (b = gn())
                : ((pn = i), (mn = `value` in pn ? pn.value : pn.textContent), (tr = !0))),
            (y = Ed(r, x)),
            0 < y.length &&
              ((x = new Pn(x, e, null, n, i)),
              o.push({ event: x, listeners: y }),
              b ? (x.data = b) : ((b = er(n)), b !== null && (x.data = b)))),
            (b = Yn ? nr(e, n) : rr(e, n)) &&
              ((x = Ed(r, `onBeforeInput`)),
              0 < x.length &&
                ((y = new Pn(`onBeforeInput`, `beforeinput`, null, n, i)),
                o.push({ event: y, listeners: x }),
                (y.data = b))),
            md(o, e, r, n, i));
        }
        yd(o, t);
      });
    }
    function Td(e, t, n) {
      return { instance: e, listener: t, currentTarget: n };
    }
    function Ed(e, t) {
      for (var n = t + `Capture`, r = []; e !== null; ) {
        var i = e,
          a = i.stateNode;
        if (
          ((i = i.tag),
          (i !== 5 && i !== 26 && i !== 27) ||
            a === null ||
            ((i = L(e, n)),
            i != null && r.unshift(Td(e, i, a)),
            (i = L(e, t)),
            i != null && r.push(Td(e, i, a))),
          e.tag === 3)
        )
          return r;
        e = e.return;
      }
      return [];
    }
    function Dd(e) {
      if (e === null) return null;
      do e = e.return;
      while (e && e.tag !== 5 && e.tag !== 27);
      return e || null;
    }
    function Od(e, t, n, r, i) {
      for (var a = t._reactName, o = []; n !== null && n !== r; ) {
        var s = n,
          c = s.alternate,
          l = s.stateNode;
        if (((s = s.tag), c !== null && c === r)) break;
        ((s !== 5 && s !== 26 && s !== 27) ||
          l === null ||
          ((c = l),
          i
            ? ((l = L(n, a)), l != null && o.unshift(Td(n, l, c)))
            : i || ((l = L(n, a)), l != null && o.push(Td(n, l, c)))),
          (n = n.return));
      }
      o.length !== 0 && e.push({ event: t, listeners: o });
    }
    var kd = /\r\n?/g,
      Ad = /\u0000|\uFFFD/g;
    function jd(e) {
      return (typeof e == `string` ? e : `` + e)
        .replace(
          kd,
          `
`,
        )
        .replace(Ad, ``);
    }
    function Md(e, t) {
      return ((t = jd(t)), jd(e) === t);
    }
    function $(e, t, n, r, i, a) {
      switch (n) {
        case `children`:
          typeof r == `string`
            ? t === `body` || (t === `textarea` && r === ``) || qt(e, r)
            : (typeof r == `number` || typeof r == `bigint`) && t !== `body` && qt(e, `` + r);
          break;
        case `className`:
          jt(e, `class`, r);
          break;
        case `tabIndex`:
          jt(e, `tabindex`, r);
          break;
        case `dir`:
        case `role`:
        case `viewBox`:
        case `width`:
        case `height`:
          jt(e, n, r);
          break;
        case `style`:
          Xt(e, r, a);
          break;
        case `data`:
          if (t !== `object`) {
            jt(e, `data`, r);
            break;
          }
        case `src`:
        case `href`:
          if (r === `` && (t !== `a` || n !== `href`)) {
            e.removeAttribute(n);
            break;
          }
          if (
            r == null ||
            typeof r == `function` ||
            typeof r == `symbol` ||
            typeof r == `boolean`
          ) {
            e.removeAttribute(n);
            break;
          }
          ((r = en(`` + r)), e.setAttribute(n, r));
          break;
        case `action`:
        case `formAction`:
          if (typeof r == `function`) {
            e.setAttribute(
              n,
              `javascript:throw new Error('A React form was unexpectedly submitted. If you called form.submit() manually, consider using form.requestSubmit() instead. If you\\'re trying to use event.stopPropagation() in a submit event handler, consider also calling event.preventDefault().')`,
            );
            break;
          } else
            typeof a == `function` &&
              (n === `formAction`
                ? (t !== `input` && $(e, t, `name`, i.name, i, null),
                  $(e, t, `formEncType`, i.formEncType, i, null),
                  $(e, t, `formMethod`, i.formMethod, i, null),
                  $(e, t, `formTarget`, i.formTarget, i, null))
                : ($(e, t, `encType`, i.encType, i, null),
                  $(e, t, `method`, i.method, i, null),
                  $(e, t, `target`, i.target, i, null)));
          if (r == null || typeof r == `symbol` || typeof r == `boolean`) {
            e.removeAttribute(n);
            break;
          }
          ((r = en(`` + r)), e.setAttribute(n, r));
          break;
        case `onClick`:
          r != null && (e.onclick = tn);
          break;
        case `onScroll`:
          r != null && Q(`scroll`, e);
          break;
        case `onScrollEnd`:
          r != null && Q(`scrollend`, e);
          break;
        case `dangerouslySetInnerHTML`:
          if (r != null) {
            if (typeof r != `object` || !(`__html` in r)) throw Error(s(61));
            if (((n = r.__html), n != null)) {
              if (i.children != null) throw Error(s(60));
              e.innerHTML = n;
            }
          }
          break;
        case `multiple`:
          e.multiple = r && typeof r != `function` && typeof r != `symbol`;
          break;
        case `muted`:
          e.muted = r && typeof r != `function` && typeof r != `symbol`;
          break;
        case `suppressContentEditableWarning`:
        case `suppressHydrationWarning`:
        case `defaultValue`:
        case `defaultChecked`:
        case `innerHTML`:
        case `ref`:
          break;
        case `autoFocus`:
          break;
        case `xlinkHref`:
          if (
            r == null ||
            typeof r == `function` ||
            typeof r == `boolean` ||
            typeof r == `symbol`
          ) {
            e.removeAttribute(`xlink:href`);
            break;
          }
          ((n = en(`` + r)), e.setAttributeNS(`http://www.w3.org/1999/xlink`, `xlink:href`, n));
          break;
        case `contentEditable`:
        case `spellCheck`:
        case `draggable`:
        case `value`:
        case `autoReverse`:
        case `externalResourcesRequired`:
        case `focusable`:
        case `preserveAlpha`:
          r != null && typeof r != `function` && typeof r != `symbol`
            ? e.setAttribute(n, `` + r)
            : e.removeAttribute(n);
          break;
        case `inert`:
        case `allowFullScreen`:
        case `async`:
        case `autoPlay`:
        case `controls`:
        case `default`:
        case `defer`:
        case `disabled`:
        case `disablePictureInPicture`:
        case `disableRemotePlayback`:
        case `formNoValidate`:
        case `hidden`:
        case `loop`:
        case `noModule`:
        case `noValidate`:
        case `open`:
        case `playsInline`:
        case `readOnly`:
        case `required`:
        case `reversed`:
        case `scoped`:
        case `seamless`:
        case `itemScope`:
          r && typeof r != `function` && typeof r != `symbol`
            ? e.setAttribute(n, ``)
            : e.removeAttribute(n);
          break;
        case `capture`:
        case `download`:
          !0 === r
            ? e.setAttribute(n, ``)
            : !1 !== r && r != null && typeof r != `function` && typeof r != `symbol`
              ? e.setAttribute(n, r)
              : e.removeAttribute(n);
          break;
        case `cols`:
        case `rows`:
        case `size`:
        case `span`:
          r != null && typeof r != `function` && typeof r != `symbol` && !isNaN(r) && 1 <= r
            ? e.setAttribute(n, r)
            : e.removeAttribute(n);
          break;
        case `rowSpan`:
        case `start`:
          r == null || typeof r == `function` || typeof r == `symbol` || isNaN(r)
            ? e.removeAttribute(n)
            : e.setAttribute(n, r);
          break;
        case `popover`:
          (Q(`beforetoggle`, e), Q(`toggle`, e), At(e, `popover`, r));
          break;
        case `xlinkActuate`:
          Mt(e, `http://www.w3.org/1999/xlink`, `xlink:actuate`, r);
          break;
        case `xlinkArcrole`:
          Mt(e, `http://www.w3.org/1999/xlink`, `xlink:arcrole`, r);
          break;
        case `xlinkRole`:
          Mt(e, `http://www.w3.org/1999/xlink`, `xlink:role`, r);
          break;
        case `xlinkShow`:
          Mt(e, `http://www.w3.org/1999/xlink`, `xlink:show`, r);
          break;
        case `xlinkTitle`:
          Mt(e, `http://www.w3.org/1999/xlink`, `xlink:title`, r);
          break;
        case `xlinkType`:
          Mt(e, `http://www.w3.org/1999/xlink`, `xlink:type`, r);
          break;
        case `xmlBase`:
          Mt(e, `http://www.w3.org/XML/1998/namespace`, `xml:base`, r);
          break;
        case `xmlLang`:
          Mt(e, `http://www.w3.org/XML/1998/namespace`, `xml:lang`, r);
          break;
        case `xmlSpace`:
          Mt(e, `http://www.w3.org/XML/1998/namespace`, `xml:space`, r);
          break;
        case `is`:
          At(e, `is`, r);
          break;
        case `innerText`:
        case `textContent`:
          break;
        default:
          (!(2 < n.length) || (n[0] !== `o` && n[0] !== `O`) || (n[1] !== `n` && n[1] !== `N`)) &&
            ((n = Qt.get(n) || n), At(e, n, r));
      }
    }
    function Nd(e, t, n, r, i, a) {
      switch (n) {
        case `style`:
          Xt(e, r, a);
          break;
        case `dangerouslySetInnerHTML`:
          if (r != null) {
            if (typeof r != `object` || !(`__html` in r)) throw Error(s(61));
            if (((n = r.__html), n != null)) {
              if (i.children != null) throw Error(s(60));
              e.innerHTML = n;
            }
          }
          break;
        case `children`:
          typeof r == `string`
            ? qt(e, r)
            : (typeof r == `number` || typeof r == `bigint`) && qt(e, `` + r);
          break;
        case `onScroll`:
          r != null && Q(`scroll`, e);
          break;
        case `onScrollEnd`:
          r != null && Q(`scrollend`, e);
          break;
        case `onClick`:
          r != null && (e.onclick = tn);
          break;
        case `suppressContentEditableWarning`:
        case `suppressHydrationWarning`:
        case `innerHTML`:
        case `ref`:
          break;
        case `innerText`:
        case `textContent`:
          break;
        default:
          if (!F.hasOwnProperty(n))
            a: {
              if (
                n[0] === `o` &&
                n[1] === `n` &&
                ((i = n.endsWith(`Capture`)),
                (t = n.slice(2, i ? n.length - 7 : void 0)),
                (a = e[pt] || null),
                (a = a == null ? null : a[n]),
                typeof a == `function` && e.removeEventListener(t, a, i),
                typeof r == `function`)
              ) {
                (typeof a != `function` &&
                  a !== null &&
                  (n in e ? (e[n] = null) : e.hasAttribute(n) && e.removeAttribute(n)),
                  e.addEventListener(t, r, i));
                break a;
              }
              n in e ? (e[n] = r) : !0 === r ? e.setAttribute(n, ``) : At(e, n, r);
            }
      }
    }
    function Pd(e, t, n) {
      switch (t) {
        case `div`:
        case `span`:
        case `svg`:
        case `path`:
        case `a`:
        case `g`:
        case `p`:
        case `li`:
          break;
        case `img`:
          (Q(`error`, e), Q(`load`, e));
          var r = !1,
            i = !1,
            a;
          for (a in n)
            if (n.hasOwnProperty(a)) {
              var o = n[a];
              if (o != null)
                switch (a) {
                  case `src`:
                    r = !0;
                    break;
                  case `srcSet`:
                    i = !0;
                    break;
                  case `children`:
                  case `dangerouslySetInnerHTML`:
                    throw Error(s(137, t));
                  default:
                    $(e, t, a, o, n, null);
                }
            }
          (i && $(e, t, `srcSet`, n.srcSet, n, null), r && $(e, t, `src`, n.src, n, null));
          return;
        case `input`:
          Q(`invalid`, e);
          var c = (a = o = i = null),
            l = null,
            u = null;
          for (r in n)
            if (n.hasOwnProperty(r)) {
              var d = n[r];
              if (d != null)
                switch (r) {
                  case `name`:
                    i = d;
                    break;
                  case `type`:
                    o = d;
                    break;
                  case `checked`:
                    l = d;
                    break;
                  case `defaultChecked`:
                    u = d;
                    break;
                  case `value`:
                    a = d;
                    break;
                  case `defaultValue`:
                    c = d;
                    break;
                  case `children`:
                  case `dangerouslySetInnerHTML`:
                    if (d != null) throw Error(s(137, t));
                    break;
                  default:
                    $(e, t, r, d, n, null);
                }
            }
          Ht(e, a, c, l, u, o, i, !1);
          return;
        case `select`:
          for (i in (Q(`invalid`, e), (r = o = a = null), n))
            if (n.hasOwnProperty(i) && ((c = n[i]), c != null))
              switch (i) {
                case `value`:
                  a = c;
                  break;
                case `defaultValue`:
                  o = c;
                  break;
                case `multiple`:
                  r = c;
                default:
                  $(e, t, i, c, n, null);
              }
          ((t = a),
            (n = o),
            (e.multiple = !!r),
            t == null ? n != null && Wt(e, !!r, n, !0) : Wt(e, !!r, t, !1));
          return;
        case `textarea`:
          for (o in (Q(`invalid`, e), (a = i = r = null), n))
            if (n.hasOwnProperty(o) && ((c = n[o]), c != null))
              switch (o) {
                case `value`:
                  r = c;
                  break;
                case `defaultValue`:
                  i = c;
                  break;
                case `children`:
                  a = c;
                  break;
                case `dangerouslySetInnerHTML`:
                  if (c != null) throw Error(s(91));
                  break;
                default:
                  $(e, t, o, c, n, null);
              }
          Kt(e, r, i, a);
          return;
        case `option`:
          for (l in n)
            if (n.hasOwnProperty(l) && ((r = n[l]), r != null))
              switch (l) {
                case `selected`:
                  e.selected = r && typeof r != `function` && typeof r != `symbol`;
                  break;
                default:
                  $(e, t, l, r, n, null);
              }
          return;
        case `dialog`:
          (Q(`beforetoggle`, e), Q(`toggle`, e), Q(`cancel`, e), Q(`close`, e));
          break;
        case `iframe`:
        case `object`:
          Q(`load`, e);
          break;
        case `video`:
        case `audio`:
          for (r = 0; r < _d.length; r++) Q(_d[r], e);
          break;
        case `image`:
          (Q(`error`, e), Q(`load`, e));
          break;
        case `details`:
          Q(`toggle`, e);
          break;
        case `embed`:
        case `source`:
        case `link`:
          (Q(`error`, e), Q(`load`, e));
        case `area`:
        case `base`:
        case `br`:
        case `col`:
        case `hr`:
        case `keygen`:
        case `meta`:
        case `param`:
        case `track`:
        case `wbr`:
        case `menuitem`:
          for (u in n)
            if (n.hasOwnProperty(u) && ((r = n[u]), r != null))
              switch (u) {
                case `children`:
                case `dangerouslySetInnerHTML`:
                  throw Error(s(137, t));
                default:
                  $(e, t, u, r, n, null);
              }
          return;
        default:
          if (Zt(t)) {
            for (d in n)
              n.hasOwnProperty(d) && ((r = n[d]), r !== void 0 && Nd(e, t, d, r, n, void 0));
            return;
          }
      }
      for (c in n) n.hasOwnProperty(c) && ((r = n[c]), r != null && $(e, t, c, r, n, null));
    }
    function Fd(e, t, n, r) {
      switch (t) {
        case `div`:
        case `span`:
        case `svg`:
        case `path`:
        case `a`:
        case `g`:
        case `p`:
        case `li`:
          break;
        case `input`:
          var i = null,
            a = null,
            o = null,
            c = null,
            l = null,
            u = null,
            d = null;
          for (m in n) {
            var f = n[m];
            if (n.hasOwnProperty(m) && f != null)
              switch (m) {
                case `checked`:
                  break;
                case `value`:
                  break;
                case `defaultValue`:
                  l = f;
                default:
                  r.hasOwnProperty(m) || $(e, t, m, null, r, f);
              }
          }
          for (var p in r) {
            var m = r[p];
            if (((f = n[p]), r.hasOwnProperty(p) && (m != null || f != null)))
              switch (p) {
                case `type`:
                  a = m;
                  break;
                case `name`:
                  i = m;
                  break;
                case `checked`:
                  u = m;
                  break;
                case `defaultChecked`:
                  d = m;
                  break;
                case `value`:
                  o = m;
                  break;
                case `defaultValue`:
                  c = m;
                  break;
                case `children`:
                case `dangerouslySetInnerHTML`:
                  if (m != null) throw Error(s(137, t));
                  break;
                default:
                  m !== f && $(e, t, p, m, r, f);
              }
          }
          Vt(e, o, c, l, u, d, a, i);
          return;
        case `select`:
          for (a in ((m = o = c = p = null), n))
            if (((l = n[a]), n.hasOwnProperty(a) && l != null))
              switch (a) {
                case `value`:
                  break;
                case `multiple`:
                  m = l;
                default:
                  r.hasOwnProperty(a) || $(e, t, a, null, r, l);
              }
          for (i in r)
            if (((a = r[i]), (l = n[i]), r.hasOwnProperty(i) && (a != null || l != null)))
              switch (i) {
                case `value`:
                  p = a;
                  break;
                case `defaultValue`:
                  c = a;
                  break;
                case `multiple`:
                  o = a;
                default:
                  a !== l && $(e, t, i, a, r, l);
              }
          ((t = c),
            (n = o),
            (r = m),
            p == null
              ? !!r != !!n && (t == null ? Wt(e, !!n, n ? [] : ``, !1) : Wt(e, !!n, t, !0))
              : Wt(e, !!n, p, !1));
          return;
        case `textarea`:
          for (c in ((m = p = null), n))
            if (((i = n[c]), n.hasOwnProperty(c) && i != null && !r.hasOwnProperty(c)))
              switch (c) {
                case `value`:
                  break;
                case `children`:
                  break;
                default:
                  $(e, t, c, null, r, i);
              }
          for (o in r)
            if (((i = r[o]), (a = n[o]), r.hasOwnProperty(o) && (i != null || a != null)))
              switch (o) {
                case `value`:
                  p = i;
                  break;
                case `defaultValue`:
                  m = i;
                  break;
                case `children`:
                  break;
                case `dangerouslySetInnerHTML`:
                  if (i != null) throw Error(s(91));
                  break;
                default:
                  i !== a && $(e, t, o, i, r, a);
              }
          Gt(e, p, m);
          return;
        case `option`:
          for (var h in n)
            if (((p = n[h]), n.hasOwnProperty(h) && p != null && !r.hasOwnProperty(h)))
              switch (h) {
                case `selected`:
                  e.selected = !1;
                  break;
                default:
                  $(e, t, h, null, r, p);
              }
          for (l in r)
            if (
              ((p = r[l]), (m = n[l]), r.hasOwnProperty(l) && p !== m && (p != null || m != null))
            )
              switch (l) {
                case `selected`:
                  e.selected = p && typeof p != `function` && typeof p != `symbol`;
                  break;
                default:
                  $(e, t, l, p, r, m);
              }
          return;
        case `img`:
        case `link`:
        case `area`:
        case `base`:
        case `br`:
        case `col`:
        case `embed`:
        case `hr`:
        case `keygen`:
        case `meta`:
        case `param`:
        case `source`:
        case `track`:
        case `wbr`:
        case `menuitem`:
          for (var g in n)
            ((p = n[g]),
              n.hasOwnProperty(g) && p != null && !r.hasOwnProperty(g) && $(e, t, g, null, r, p));
          for (u in r)
            if (
              ((p = r[u]), (m = n[u]), r.hasOwnProperty(u) && p !== m && (p != null || m != null))
            )
              switch (u) {
                case `children`:
                case `dangerouslySetInnerHTML`:
                  if (p != null) throw Error(s(137, t));
                  break;
                default:
                  $(e, t, u, p, r, m);
              }
          return;
        default:
          if (Zt(t)) {
            for (var _ in n)
              ((p = n[_]),
                n.hasOwnProperty(_) &&
                  p !== void 0 &&
                  !r.hasOwnProperty(_) &&
                  Nd(e, t, _, void 0, r, p));
            for (d in r)
              ((p = r[d]),
                (m = n[d]),
                !r.hasOwnProperty(d) ||
                  p === m ||
                  (p === void 0 && m === void 0) ||
                  Nd(e, t, d, p, r, m));
            return;
          }
      }
      for (var v in n)
        ((p = n[v]),
          n.hasOwnProperty(v) && p != null && !r.hasOwnProperty(v) && $(e, t, v, null, r, p));
      for (f in r)
        ((p = r[f]),
          (m = n[f]),
          !r.hasOwnProperty(f) || p === m || (p == null && m == null) || $(e, t, f, p, r, m));
    }
    function Id(e) {
      switch (e) {
        case `css`:
        case `script`:
        case `font`:
        case `img`:
        case `image`:
        case `input`:
        case `link`:
          return !0;
        default:
          return !1;
      }
    }
    function Ld() {
      if (typeof performance.getEntriesByType == `function`) {
        for (
          var e = 0, t = 0, n = performance.getEntriesByType(`resource`), r = 0;
          r < n.length;
          r++
        ) {
          var i = n[r],
            a = i.transferSize,
            o = i.initiatorType,
            s = i.duration;
          if (a && s && Id(o)) {
            for (o = 0, s = i.responseEnd, r += 1; r < n.length; r++) {
              var c = n[r],
                l = c.startTime;
              if (l > s) break;
              var u = c.transferSize,
                d = c.initiatorType;
              u && Id(d) && ((c = c.responseEnd), (o += u * (c < s ? 1 : (s - l) / (c - l))));
            }
            if ((--r, (t += (8 * (a + o)) / (i.duration / 1e3)), e++, 10 < e)) break;
          }
        }
        if (0 < e) return t / e / 1e6;
      }
      return navigator.connection && ((e = navigator.connection.downlink), typeof e == `number`)
        ? e
        : 5;
    }
    var Rd = null,
      zd = null;
    function Bd(e) {
      return e.nodeType === 9 ? e : e.ownerDocument;
    }
    function Vd(e) {
      switch (e) {
        case `http://www.w3.org/2000/svg`:
          return 1;
        case `http://www.w3.org/1998/Math/MathML`:
          return 2;
        default:
          return 0;
      }
    }
    function Hd(e, t) {
      if (e === 0)
        switch (t) {
          case `svg`:
            return 1;
          case `math`:
            return 2;
          default:
            return 0;
        }
      return e === 1 && t === `foreignObject` ? 0 : e;
    }
    function Ud(e, t) {
      return (
        e === `textarea` ||
        e === `noscript` ||
        typeof t.children == `string` ||
        typeof t.children == `number` ||
        typeof t.children == `bigint` ||
        (typeof t.dangerouslySetInnerHTML == `object` &&
          t.dangerouslySetInnerHTML !== null &&
          t.dangerouslySetInnerHTML.__html != null)
      );
    }
    var Wd = null;
    function Gd() {
      var e = window.event;
      return e && e.type === `popstate` ? (e === Wd ? !1 : ((Wd = e), !0)) : ((Wd = null), !1);
    }
    var Kd = typeof setTimeout == `function` ? setTimeout : void 0,
      qd = typeof clearTimeout == `function` ? clearTimeout : void 0,
      Jd = typeof Promise == `function` ? Promise : void 0,
      Yd =
        typeof queueMicrotask == `function`
          ? queueMicrotask
          : Jd === void 0
            ? Kd
            : function (e) {
                return Jd.resolve(null).then(e).catch(Xd);
              };
    function Xd(e) {
      setTimeout(function () {
        throw e;
      });
    }
    function Zd(e) {
      return e === `head`;
    }
    function Qd(e, t) {
      var n = t,
        r = 0;
      do {
        var i = n.nextSibling;
        if ((e.removeChild(n), i && i.nodeType === 8))
          if (((n = i.data), n === `/$` || n === `/&`)) {
            if (r === 0) {
              (e.removeChild(i), Np(t));
              return;
            }
            r--;
          } else if (n === `$` || n === `$?` || n === `$~` || n === `$!` || n === `&`) r++;
          else if (n === `html`) pf(e.ownerDocument.documentElement);
          else if (n === `head`) {
            ((n = e.ownerDocument.head), pf(n));
            for (var a = n.firstChild; a; ) {
              var o = a.nextSibling,
                s = a.nodeName;
              (a[yt] ||
                s === `SCRIPT` ||
                s === `STYLE` ||
                (s === `LINK` && a.rel.toLowerCase() === `stylesheet`) ||
                n.removeChild(a),
                (a = o));
            }
          } else n === `body` && pf(e.ownerDocument.body);
        n = i;
      } while (n);
      Np(t);
    }
    function $d(e, t) {
      var n = e;
      e = 0;
      do {
        var r = n.nextSibling;
        if (
          (n.nodeType === 1
            ? t
              ? ((n._stashedDisplay = n.style.display), (n.style.display = `none`))
              : ((n.style.display = n._stashedDisplay || ``),
                n.getAttribute(`style`) === `` && n.removeAttribute(`style`))
            : n.nodeType === 3 &&
              (t
                ? ((n._stashedText = n.nodeValue), (n.nodeValue = ``))
                : (n.nodeValue = n._stashedText || ``)),
          r && r.nodeType === 8)
        )
          if (((n = r.data), n === `/$`)) {
            if (e === 0) break;
            e--;
          } else (n !== `$` && n !== `$?` && n !== `$~` && n !== `$!`) || e++;
        n = r;
      } while (n);
    }
    function ef(e) {
      var t = e.firstChild;
      for (t && t.nodeType === 10 && (t = t.nextSibling); t; ) {
        var n = t;
        switch (((t = t.nextSibling), n.nodeName)) {
          case `HTML`:
          case `HEAD`:
          case `BODY`:
            (ef(n), bt(n));
            continue;
          case `SCRIPT`:
          case `STYLE`:
            continue;
          case `LINK`:
            if (n.rel.toLowerCase() === `stylesheet`) continue;
        }
        e.removeChild(n);
      }
    }
    function tf(e, t, n, r) {
      for (; e.nodeType === 1; ) {
        var i = n;
        if (e.nodeName.toLowerCase() !== t.toLowerCase()) {
          if (!r && (e.nodeName !== `INPUT` || e.type !== `hidden`)) break;
        } else if (!r)
          if (t === `input` && e.type === `hidden`) {
            var a = i.name == null ? null : `` + i.name;
            if (i.type === `hidden` && e.getAttribute(`name`) === a) return e;
          } else return e;
        else if (!e[yt])
          switch (t) {
            case `meta`:
              if (!e.hasAttribute(`itemprop`)) break;
              return e;
            case `link`:
              if (
                ((a = e.getAttribute(`rel`)),
                (a === `stylesheet` && e.hasAttribute(`data-precedence`)) ||
                  a !== i.rel ||
                  e.getAttribute(`href`) !== (i.href == null || i.href === `` ? null : i.href) ||
                  e.getAttribute(`crossorigin`) !==
                    (i.crossOrigin == null ? null : i.crossOrigin) ||
                  e.getAttribute(`title`) !== (i.title == null ? null : i.title))
              )
                break;
              return e;
            case `style`:
              if (e.hasAttribute(`data-precedence`)) break;
              return e;
            case `script`:
              if (
                ((a = e.getAttribute(`src`)),
                (a !== (i.src == null ? null : i.src) ||
                  e.getAttribute(`type`) !== (i.type == null ? null : i.type) ||
                  e.getAttribute(`crossorigin`) !==
                    (i.crossOrigin == null ? null : i.crossOrigin)) &&
                  a &&
                  e.hasAttribute(`async`) &&
                  !e.hasAttribute(`itemprop`))
              )
                break;
              return e;
            default:
              return e;
          }
        if (((e = cf(e.nextSibling)), e === null)) break;
      }
      return null;
    }
    function nf(e, t, n) {
      if (t === ``) return null;
      for (; e.nodeType !== 3; )
        if (
          ((e.nodeType !== 1 || e.nodeName !== `INPUT` || e.type !== `hidden`) && !n) ||
          ((e = cf(e.nextSibling)), e === null)
        )
          return null;
      return e;
    }
    function rf(e, t) {
      for (; e.nodeType !== 8; )
        if (
          ((e.nodeType !== 1 || e.nodeName !== `INPUT` || e.type !== `hidden`) && !t) ||
          ((e = cf(e.nextSibling)), e === null)
        )
          return null;
      return e;
    }
    function af(e) {
      return e.data === `$?` || e.data === `$~`;
    }
    function of(e) {
      return e.data === `$!` || (e.data === `$?` && e.ownerDocument.readyState !== `loading`);
    }
    function sf(e, t) {
      var n = e.ownerDocument;
      if (e.data === `$~`) e._reactRetry = t;
      else if (e.data !== `$?` || n.readyState !== `loading`) t();
      else {
        var r = function () {
          (t(), n.removeEventListener(`DOMContentLoaded`, r));
        };
        (n.addEventListener(`DOMContentLoaded`, r), (e._reactRetry = r));
      }
    }
    function cf(e) {
      for (; e != null; e = e.nextSibling) {
        var t = e.nodeType;
        if (t === 1 || t === 3) break;
        if (t === 8) {
          if (
            ((t = e.data),
            t === `$` ||
              t === `$!` ||
              t === `$?` ||
              t === `$~` ||
              t === `&` ||
              t === `F!` ||
              t === `F`)
          )
            break;
          if (t === `/$` || t === `/&`) return null;
        }
      }
      return e;
    }
    var lf = null;
    function uf(e) {
      e = e.nextSibling;
      for (var t = 0; e; ) {
        if (e.nodeType === 8) {
          var n = e.data;
          if (n === `/$` || n === `/&`) {
            if (t === 0) return cf(e.nextSibling);
            t--;
          } else (n !== `$` && n !== `$!` && n !== `$?` && n !== `$~` && n !== `&`) || t++;
        }
        e = e.nextSibling;
      }
      return null;
    }
    function df(e) {
      e = e.previousSibling;
      for (var t = 0; e; ) {
        if (e.nodeType === 8) {
          var n = e.data;
          if (n === `$` || n === `$!` || n === `$?` || n === `$~` || n === `&`) {
            if (t === 0) return e;
            t--;
          } else (n !== `/$` && n !== `/&`) || t++;
        }
        e = e.previousSibling;
      }
      return null;
    }
    function ff(e, t, n) {
      switch (((t = Bd(n)), e)) {
        case `html`:
          if (((e = t.documentElement), !e)) throw Error(s(452));
          return e;
        case `head`:
          if (((e = t.head), !e)) throw Error(s(453));
          return e;
        case `body`:
          if (((e = t.body), !e)) throw Error(s(454));
          return e;
        default:
          throw Error(s(451));
      }
    }
    function pf(e) {
      for (var t = e.attributes; t.length; ) e.removeAttributeNode(t[0]);
      bt(e);
    }
    var mf = new Map(),
      hf = new Set();
    function gf(e) {
      return typeof e.getRootNode == `function`
        ? e.getRootNode()
        : e.nodeType === 9
          ? e
          : e.ownerDocument;
    }
    var _f = j.d;
    j.d = { f: vf, r: yf, D: Sf, C: Cf, L: wf, m: Tf, X: Df, S: Ef, M: Of };
    function vf() {
      var e = _f.f(),
        t = bu();
      return e || t;
    }
    function yf(e) {
      var t = St(e);
      t !== null && t.tag === 5 && t.type === `form` ? Es(t) : _f.r(e);
    }
    var bf = typeof document > `u` ? null : document;
    function xf(e, t, n) {
      var r = bf;
      if (r && typeof t == `string` && t) {
        var i = Bt(t);
        ((i = `link[rel="` + e + `"][href="` + i + `"]`),
          typeof n == `string` && (i += `[crossorigin="` + n + `"]`),
          hf.has(i) ||
            (hf.add(i),
            (e = { rel: e, crossOrigin: n, href: t }),
            r.querySelector(i) === null &&
              ((t = r.createElement(`link`)), Pd(t, `link`, e), N(t), r.head.appendChild(t))));
      }
    }
    function Sf(e) {
      (_f.D(e), xf(`dns-prefetch`, e, null));
    }
    function Cf(e, t) {
      (_f.C(e, t), xf(`preconnect`, e, t));
    }
    function wf(e, t, n) {
      _f.L(e, t, n);
      var r = bf;
      if (r && e && t) {
        var i = `link[rel="preload"][as="` + Bt(t) + `"]`;
        t === `image` && n && n.imageSrcSet
          ? ((i += `[imagesrcset="` + Bt(n.imageSrcSet) + `"]`),
            typeof n.imageSizes == `string` && (i += `[imagesizes="` + Bt(n.imageSizes) + `"]`))
          : (i += `[href="` + Bt(e) + `"]`);
        var a = i;
        switch (t) {
          case `style`:
            a = Af(e);
            break;
          case `script`:
            a = Pf(e);
        }
        mf.has(a) ||
          ((e = h(
            { rel: `preload`, href: t === `image` && n && n.imageSrcSet ? void 0 : e, as: t },
            n,
          )),
          mf.set(a, e),
          r.querySelector(i) !== null ||
            (t === `style` && r.querySelector(jf(a))) ||
            (t === `script` && r.querySelector(Ff(a))) ||
            ((t = r.createElement(`link`)), Pd(t, `link`, e), N(t), r.head.appendChild(t)));
      }
    }
    function Tf(e, t) {
      _f.m(e, t);
      var n = bf;
      if (n && e) {
        var r = t && typeof t.as == `string` ? t.as : `script`,
          i = `link[rel="modulepreload"][as="` + Bt(r) + `"][href="` + Bt(e) + `"]`,
          a = i;
        switch (r) {
          case `audioworklet`:
          case `paintworklet`:
          case `serviceworker`:
          case `sharedworker`:
          case `worker`:
          case `script`:
            a = Pf(e);
        }
        if (
          !mf.has(a) &&
          ((e = h({ rel: `modulepreload`, href: e }, t)), mf.set(a, e), n.querySelector(i) === null)
        ) {
          switch (r) {
            case `audioworklet`:
            case `paintworklet`:
            case `serviceworker`:
            case `sharedworker`:
            case `worker`:
            case `script`:
              if (n.querySelector(Ff(a))) return;
          }
          ((r = n.createElement(`link`)), Pd(r, `link`, e), N(r), n.head.appendChild(r));
        }
      }
    }
    function Ef(e, t, n) {
      _f.S(e, t, n);
      var r = bf;
      if (r && e) {
        var i = wt(r).hoistableStyles,
          a = Af(e);
        t ||= `default`;
        var o = i.get(a);
        if (!o) {
          var s = { loading: 0, preload: null };
          if ((o = r.querySelector(jf(a)))) s.loading = 5;
          else {
            ((e = h({ rel: `stylesheet`, href: e, 'data-precedence': t }, n)),
              (n = mf.get(a)) && Rf(e, n));
            var c = (o = r.createElement(`link`));
            (N(c),
              Pd(c, `link`, e),
              (c._p = new Promise(function (e, t) {
                ((c.onload = e), (c.onerror = t));
              })),
              c.addEventListener(`load`, function () {
                s.loading |= 1;
              }),
              c.addEventListener(`error`, function () {
                s.loading |= 2;
              }),
              (s.loading |= 4),
              Lf(o, t, r));
          }
          ((o = { type: `stylesheet`, instance: o, count: 1, state: s }), i.set(a, o));
        }
      }
    }
    function Df(e, t) {
      _f.X(e, t);
      var n = bf;
      if (n && e) {
        var r = wt(n).hoistableScripts,
          i = Pf(e),
          a = r.get(i);
        a ||
          ((a = n.querySelector(Ff(i))),
          a ||
            ((e = h({ src: e, async: !0 }, t)),
            (t = mf.get(i)) && zf(e, t),
            (a = n.createElement(`script`)),
            N(a),
            Pd(a, `link`, e),
            n.head.appendChild(a)),
          (a = { type: `script`, instance: a, count: 1, state: null }),
          r.set(i, a));
      }
    }
    function Of(e, t) {
      _f.M(e, t);
      var n = bf;
      if (n && e) {
        var r = wt(n).hoistableScripts,
          i = Pf(e),
          a = r.get(i);
        a ||
          ((a = n.querySelector(Ff(i))),
          a ||
            ((e = h({ src: e, async: !0, type: `module` }, t)),
            (t = mf.get(i)) && zf(e, t),
            (a = n.createElement(`script`)),
            N(a),
            Pd(a, `link`, e),
            n.head.appendChild(a)),
          (a = { type: `script`, instance: a, count: 1, state: null }),
          r.set(i, a));
      }
    }
    function kf(e, t, n, r) {
      var i = (i = pe.current) ? gf(i) : null;
      if (!i) throw Error(s(446));
      switch (e) {
        case `meta`:
        case `title`:
          return null;
        case `style`:
          return typeof n.precedence == `string` && typeof n.href == `string`
            ? ((t = Af(n.href)),
              (n = wt(i).hoistableStyles),
              (r = n.get(t)),
              r || ((r = { type: `style`, instance: null, count: 0, state: null }), n.set(t, r)),
              r)
            : { type: `void`, instance: null, count: 0, state: null };
        case `link`:
          if (
            n.rel === `stylesheet` &&
            typeof n.href == `string` &&
            typeof n.precedence == `string`
          ) {
            e = Af(n.href);
            var a = wt(i).hoistableStyles,
              o = a.get(e);
            if (
              (o ||
                ((i = i.ownerDocument || i),
                (o = {
                  type: `stylesheet`,
                  instance: null,
                  count: 0,
                  state: { loading: 0, preload: null },
                }),
                a.set(e, o),
                (a = i.querySelector(jf(e))) && !a._p && ((o.instance = a), (o.state.loading = 5)),
                mf.has(e) ||
                  ((n = {
                    rel: `preload`,
                    as: `style`,
                    href: n.href,
                    crossOrigin: n.crossOrigin,
                    integrity: n.integrity,
                    media: n.media,
                    hrefLang: n.hrefLang,
                    referrerPolicy: n.referrerPolicy,
                  }),
                  mf.set(e, n),
                  a || Nf(i, e, n, o.state))),
              t && r === null)
            )
              throw Error(s(528, ``));
            return o;
          }
          if (t && r !== null) throw Error(s(529, ``));
          return null;
        case `script`:
          return (
            (t = n.async),
            (n = n.src),
            typeof n == `string` && t && typeof t != `function` && typeof t != `symbol`
              ? ((t = Pf(n)),
                (n = wt(i).hoistableScripts),
                (r = n.get(t)),
                r || ((r = { type: `script`, instance: null, count: 0, state: null }), n.set(t, r)),
                r)
              : { type: `void`, instance: null, count: 0, state: null }
          );
        default:
          throw Error(s(444, e));
      }
    }
    function Af(e) {
      return `href="` + Bt(e) + `"`;
    }
    function jf(e) {
      return `link[rel="stylesheet"][` + e + `]`;
    }
    function Mf(e) {
      return h({}, e, { 'data-precedence': e.precedence, precedence: null });
    }
    function Nf(e, t, n, r) {
      e.querySelector(`link[rel="preload"][as="style"][` + t + `]`)
        ? (r.loading = 1)
        : ((t = e.createElement(`link`)),
          (r.preload = t),
          t.addEventListener(`load`, function () {
            return (r.loading |= 1);
          }),
          t.addEventListener(`error`, function () {
            return (r.loading |= 2);
          }),
          Pd(t, `link`, n),
          N(t),
          e.head.appendChild(t));
    }
    function Pf(e) {
      return `[src="` + Bt(e) + `"]`;
    }
    function Ff(e) {
      return `script[async]` + e;
    }
    function If(e, t, n) {
      if ((t.count++, t.instance === null))
        switch (t.type) {
          case `style`:
            var r = e.querySelector(`style[data-href~="` + Bt(n.href) + `"]`);
            if (r) return ((t.instance = r), N(r), r);
            var i = h({}, n, {
              'data-href': n.href,
              'data-precedence': n.precedence,
              href: null,
              precedence: null,
            });
            return (
              (r = (e.ownerDocument || e).createElement(`style`)),
              N(r),
              Pd(r, `style`, i),
              Lf(r, n.precedence, e),
              (t.instance = r)
            );
          case `stylesheet`:
            i = Af(n.href);
            var a = e.querySelector(jf(i));
            if (a) return ((t.state.loading |= 4), (t.instance = a), N(a), a);
            ((r = Mf(n)),
              (i = mf.get(i)) && Rf(r, i),
              (a = (e.ownerDocument || e).createElement(`link`)),
              N(a));
            var o = a;
            return (
              (o._p = new Promise(function (e, t) {
                ((o.onload = e), (o.onerror = t));
              })),
              Pd(a, `link`, r),
              (t.state.loading |= 4),
              Lf(a, n.precedence, e),
              (t.instance = a)
            );
          case `script`:
            return (
              (a = Pf(n.src)),
              (i = e.querySelector(Ff(a)))
                ? ((t.instance = i), N(i), i)
                : ((r = n),
                  (i = mf.get(a)) && ((r = h({}, n)), zf(r, i)),
                  (e = e.ownerDocument || e),
                  (i = e.createElement(`script`)),
                  N(i),
                  Pd(i, `link`, r),
                  e.head.appendChild(i),
                  (t.instance = i))
            );
          case `void`:
            return null;
          default:
            throw Error(s(443, t.type));
        }
      else
        t.type === `stylesheet` &&
          !(t.state.loading & 4) &&
          ((r = t.instance), (t.state.loading |= 4), Lf(r, n.precedence, e));
      return t.instance;
    }
    function Lf(e, t, n) {
      for (
        var r = n.querySelectorAll(
            `link[rel="stylesheet"][data-precedence],style[data-precedence]`,
          ),
          i = r.length ? r[r.length - 1] : null,
          a = i,
          o = 0;
        o < r.length;
        o++
      ) {
        var s = r[o];
        if (s.dataset.precedence === t) a = s;
        else if (a !== i) break;
      }
      a
        ? a.parentNode.insertBefore(e, a.nextSibling)
        : ((t = n.nodeType === 9 ? n.head : n), t.insertBefore(e, t.firstChild));
    }
    function Rf(e, t) {
      ((e.crossOrigin ??= t.crossOrigin),
        (e.referrerPolicy ??= t.referrerPolicy),
        (e.title ??= t.title));
    }
    function zf(e, t) {
      ((e.crossOrigin ??= t.crossOrigin),
        (e.referrerPolicy ??= t.referrerPolicy),
        (e.integrity ??= t.integrity));
    }
    var Bf = null;
    function Vf(e, t, n) {
      if (Bf === null) {
        var r = new Map(),
          i = (Bf = new Map());
        i.set(n, r);
      } else ((i = Bf), (r = i.get(n)), r || ((r = new Map()), i.set(n, r)));
      if (r.has(e)) return r;
      for (r.set(e, null), n = n.getElementsByTagName(e), i = 0; i < n.length; i++) {
        var a = n[i];
        if (
          !(a[yt] || a[ft] || (e === `link` && a.getAttribute(`rel`) === `stylesheet`)) &&
          a.namespaceURI !== `http://www.w3.org/2000/svg`
        ) {
          var o = a.getAttribute(t) || ``;
          o = e + o;
          var s = r.get(o);
          s ? s.push(a) : r.set(o, [a]);
        }
      }
      return r;
    }
    function Hf(e, t, n) {
      ((e = e.ownerDocument || e),
        e.head.insertBefore(n, t === `title` ? e.querySelector(`head > title`) : null));
    }
    function Uf(e, t, n) {
      if (n === 1 || t.itemProp != null) return !1;
      switch (e) {
        case `meta`:
        case `title`:
          return !0;
        case `style`:
          if (typeof t.precedence != `string` || typeof t.href != `string` || t.href === ``) break;
          return !0;
        case `link`:
          if (
            typeof t.rel != `string` ||
            typeof t.href != `string` ||
            t.href === `` ||
            t.onLoad ||
            t.onError
          )
            break;
          switch (t.rel) {
            case `stylesheet`:
              return ((e = t.disabled), typeof t.precedence == `string` && e == null);
            default:
              return !0;
          }
        case `script`:
          if (
            t.async &&
            typeof t.async != `function` &&
            typeof t.async != `symbol` &&
            !t.onLoad &&
            !t.onError &&
            t.src &&
            typeof t.src == `string`
          )
            return !0;
      }
      return !1;
    }
    function Wf(e) {
      return !(e.type === `stylesheet` && !(e.state.loading & 3));
    }
    function Gf(e, t, n, r) {
      if (
        n.type === `stylesheet` &&
        (typeof r.media != `string` || !1 !== matchMedia(r.media).matches) &&
        !(n.state.loading & 4)
      ) {
        if (n.instance === null) {
          var i = Af(r.href),
            a = t.querySelector(jf(i));
          if (a) {
            ((t = a._p),
              typeof t == `object` &&
                t &&
                typeof t.then == `function` &&
                (e.count++, (e = Jf.bind(e)), t.then(e, e)),
              (n.state.loading |= 4),
              (n.instance = a),
              N(a));
            return;
          }
          ((a = t.ownerDocument || t),
            (r = Mf(r)),
            (i = mf.get(i)) && Rf(r, i),
            (a = a.createElement(`link`)),
            N(a));
          var o = a;
          ((o._p = new Promise(function (e, t) {
            ((o.onload = e), (o.onerror = t));
          })),
            Pd(a, `link`, r),
            (n.instance = a));
        }
        (e.stylesheets === null && (e.stylesheets = new Map()),
          e.stylesheets.set(n, t),
          (t = n.state.preload) &&
            !(n.state.loading & 3) &&
            (e.count++,
            (n = Jf.bind(e)),
            t.addEventListener(`load`, n),
            t.addEventListener(`error`, n)));
      }
    }
    var Kf = 0;
    function qf(e, t) {
      return (
        e.stylesheets && e.count === 0 && Xf(e, e.stylesheets),
        0 < e.count || 0 < e.imgCount
          ? function (n) {
              var r = setTimeout(function () {
                if ((e.stylesheets && Xf(e, e.stylesheets), e.unsuspend)) {
                  var t = e.unsuspend;
                  ((e.unsuspend = null), t());
                }
              }, 6e4 + t);
              0 < e.imgBytes && Kf === 0 && (Kf = 62500 * Ld());
              var i = setTimeout(
                function () {
                  if (
                    ((e.waitingForImages = !1),
                    e.count === 0 && (e.stylesheets && Xf(e, e.stylesheets), e.unsuspend))
                  ) {
                    var t = e.unsuspend;
                    ((e.unsuspend = null), t());
                  }
                },
                (e.imgBytes > Kf ? 50 : 800) + t,
              );
              return (
                (e.unsuspend = n),
                function () {
                  ((e.unsuspend = null), clearTimeout(r), clearTimeout(i));
                }
              );
            }
          : null
      );
    }
    function Jf() {
      if ((this.count--, this.count === 0 && (this.imgCount === 0 || !this.waitingForImages))) {
        if (this.stylesheets) Xf(this, this.stylesheets);
        else if (this.unsuspend) {
          var e = this.unsuspend;
          ((this.unsuspend = null), e());
        }
      }
    }
    var Yf = null;
    function Xf(e, t) {
      ((e.stylesheets = null),
        e.unsuspend !== null &&
          (e.count++, (Yf = new Map()), t.forEach(Zf, e), (Yf = null), Jf.call(e)));
    }
    function Zf(e, t) {
      if (!(t.state.loading & 4)) {
        var n = Yf.get(e);
        if (n) var r = n.get(null);
        else {
          ((n = new Map()), Yf.set(e, n));
          for (
            var i = e.querySelectorAll(`link[data-precedence],style[data-precedence]`), a = 0;
            a < i.length;
            a++
          ) {
            var o = i[a];
            (o.nodeName === `LINK` || o.getAttribute(`media`) !== `not all`) &&
              (n.set(o.dataset.precedence, o), (r = o));
          }
          r && n.set(null, r);
        }
        ((i = t.instance),
          (o = i.getAttribute(`data-precedence`)),
          (a = n.get(o) || r),
          a === r && n.set(null, i),
          n.set(o, i),
          this.count++,
          (r = Jf.bind(this)),
          i.addEventListener(`load`, r),
          i.addEventListener(`error`, r),
          a
            ? a.parentNode.insertBefore(i, a.nextSibling)
            : ((e = e.nodeType === 9 ? e.head : e), e.insertBefore(i, e.firstChild)),
          (t.state.loading |= 4));
      }
    }
    var Qf = {
      $$typeof: C,
      Provider: null,
      Consumer: null,
      _currentValue: oe,
      _currentValue2: oe,
      _threadCount: 0,
    };
    function $f(e, t, n, r, i, a, o, s, c) {
      ((this.tag = 1),
        (this.containerInfo = e),
        (this.pingCache = this.current = this.pendingChildren = null),
        (this.timeoutHandle = -1),
        (this.callbackNode =
          this.next =
          this.pendingContext =
          this.context =
          this.cancelPendingCommit =
            null),
        (this.callbackPriority = 0),
        (this.expirationTimes = tt(-1)),
        (this.entangledLanes =
          this.shellSuspendCounter =
          this.errorRecoveryDisabledLanes =
          this.expiredLanes =
          this.warmLanes =
          this.pingedLanes =
          this.suspendedLanes =
          this.pendingLanes =
            0),
        (this.entanglements = tt(0)),
        (this.hiddenUpdates = tt(null)),
        (this.identifierPrefix = r),
        (this.onUncaughtError = i),
        (this.onCaughtError = a),
        (this.onRecoverableError = o),
        (this.pooledCache = null),
        (this.pooledCacheLanes = 0),
        (this.formState = c),
        (this.incompleteTransitions = new Map()));
    }
    function ep(e, t, n, r, i, a, o, s, c, l, u, d) {
      return (
        (e = new $f(e, t, n, o, c, l, u, d, s)),
        (t = 1),
        !0 === a && (t |= 24),
        (a = li(3, null, null, t)),
        (e.current = a),
        (a.stateNode = e),
        (t = ca()),
        t.refCount++,
        (e.pooledCache = t),
        t.refCount++,
        (a.memoizedState = { element: r, isDehydrated: n, cache: t }),
        Va(a),
        e
      );
    }
    function tp(e) {
      return e ? ((e = si), e) : si;
    }
    function np(e, t, n, r, i, a) {
      ((i = tp(i)),
        r.context === null ? (r.context = i) : (r.pendingContext = i),
        (r = Ua(t)),
        (r.payload = { element: n }),
        (a = a === void 0 ? null : a),
        a !== null && (r.callback = a),
        (n = Wa(e, r, t)),
        n !== null && (hu(n, e, t), Ga(n, e, t)));
    }
    function rp(e, t) {
      if (((e = e.memoizedState), e !== null && e.dehydrated !== null)) {
        var n = e.retryLane;
        e.retryLane = n !== 0 && n < t ? n : t;
      }
    }
    function ip(e, t) {
      (rp(e, t), (e = e.alternate) && rp(e, t));
    }
    function ap(e) {
      if (e.tag === 13 || e.tag === 31) {
        var t = ii(e, 67108864);
        (t !== null && hu(t, e, 67108864), ip(e, 67108864));
      }
    }
    function op(e) {
      if (e.tag === 13 || e.tag === 31) {
        var t = pu();
        t = st(t);
        var n = ii(e, t);
        (n !== null && hu(n, e, t), ip(e, t));
      }
    }
    var sp = !0;
    function cp(e, t, n, r) {
      var i = A.T;
      A.T = null;
      var a = j.p;
      try {
        ((j.p = 2), up(e, t, n, r));
      } finally {
        ((j.p = a), (A.T = i));
      }
    }
    function lp(e, t, n, r) {
      var i = A.T;
      A.T = null;
      var a = j.p;
      try {
        ((j.p = 8), up(e, t, n, r));
      } finally {
        ((j.p = a), (A.T = i));
      }
    }
    function up(e, t, n, r) {
      if (sp) {
        var i = dp(r);
        if (i === null) (wd(e, t, r, fp, n), Cp(e, r));
        else if (Tp(i, e, t, n, r)) r.stopPropagation();
        else if ((Cp(e, r), t & 4 && -1 < Sp.indexOf(e))) {
          for (; i !== null; ) {
            var a = St(i);
            if (a !== null)
              switch (a.tag) {
                case 3:
                  if (((a = a.stateNode), a.current.memoizedState.isDehydrated)) {
                    var o = Xe(a.pendingLanes);
                    if (o !== 0) {
                      var s = a;
                      for (s.pendingLanes |= 2, s.entangledLanes |= 2; o; ) {
                        var c = 1 << (31 - Ue(o));
                        ((s.entanglements[1] |= c), (o &= ~c));
                      }
                      (rd(a), !(K & 6) && ((tu = je() + 500), id(0, !1)));
                    }
                  }
                  break;
                case 31:
                case 13:
                  ((s = ii(a, 2)), s !== null && hu(s, a, 2), bu(), ip(a, 2));
              }
            if (((a = dp(r)), a === null && wd(e, t, r, fp, n), a === i)) break;
            i = a;
          }
          i !== null && r.stopPropagation();
        } else wd(e, t, r, null, n);
      }
    }
    function dp(e) {
      return ((e = rn(e)), pp(e));
    }
    var fp = null;
    function pp(e) {
      if (((fp = null), (e = xt(e)), e !== null)) {
        var t = l(e);
        if (t === null) e = null;
        else {
          var n = t.tag;
          if (n === 13) {
            if (((e = u(t)), e !== null)) return e;
            e = null;
          } else if (n === 31) {
            if (((e = d(t)), e !== null)) return e;
            e = null;
          } else if (n === 3) {
            if (t.stateNode.current.memoizedState.isDehydrated)
              return t.tag === 3 ? t.stateNode.containerInfo : null;
            e = null;
          } else t !== e && (e = null);
        }
      }
      return ((fp = e), null);
    }
    function mp(e) {
      switch (e) {
        case `beforetoggle`:
        case `cancel`:
        case `click`:
        case `close`:
        case `contextmenu`:
        case `copy`:
        case `cut`:
        case `auxclick`:
        case `dblclick`:
        case `dragend`:
        case `dragstart`:
        case `drop`:
        case `focusin`:
        case `focusout`:
        case `input`:
        case `invalid`:
        case `keydown`:
        case `keypress`:
        case `keyup`:
        case `mousedown`:
        case `mouseup`:
        case `paste`:
        case `pause`:
        case `play`:
        case `pointercancel`:
        case `pointerdown`:
        case `pointerup`:
        case `ratechange`:
        case `reset`:
        case `resize`:
        case `seeked`:
        case `submit`:
        case `toggle`:
        case `touchcancel`:
        case `touchend`:
        case `touchstart`:
        case `volumechange`:
        case `change`:
        case `selectionchange`:
        case `textInput`:
        case `compositionstart`:
        case `compositionend`:
        case `compositionupdate`:
        case `beforeblur`:
        case `afterblur`:
        case `beforeinput`:
        case `blur`:
        case `fullscreenchange`:
        case `focus`:
        case `hashchange`:
        case `popstate`:
        case `select`:
        case `selectstart`:
          return 2;
        case `drag`:
        case `dragenter`:
        case `dragexit`:
        case `dragleave`:
        case `dragover`:
        case `mousemove`:
        case `mouseout`:
        case `mouseover`:
        case `pointermove`:
        case `pointerout`:
        case `pointerover`:
        case `scroll`:
        case `touchmove`:
        case `wheel`:
        case `mouseenter`:
        case `mouseleave`:
        case `pointerenter`:
        case `pointerleave`:
          return 8;
        case `message`:
          switch (Me()) {
            case Ne:
              return 2;
            case Pe:
              return 8;
            case Fe:
            case Ie:
              return 32;
            case Le:
              return 268435456;
            default:
              return 32;
          }
        default:
          return 32;
      }
    }
    var hp = !1,
      gp = null,
      _p = null,
      vp = null,
      yp = new Map(),
      bp = new Map(),
      xp = [],
      Sp =
        `mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset`.split(
          ` `,
        );
    function Cp(e, t) {
      switch (e) {
        case `focusin`:
        case `focusout`:
          gp = null;
          break;
        case `dragenter`:
        case `dragleave`:
          _p = null;
          break;
        case `mouseover`:
        case `mouseout`:
          vp = null;
          break;
        case `pointerover`:
        case `pointerout`:
          yp.delete(t.pointerId);
          break;
        case `gotpointercapture`:
        case `lostpointercapture`:
          bp.delete(t.pointerId);
      }
    }
    function wp(e, t, n, r, i, a) {
      return e === null || e.nativeEvent !== a
        ? ((e = {
            blockedOn: t,
            domEventName: n,
            eventSystemFlags: r,
            nativeEvent: a,
            targetContainers: [i],
          }),
          t !== null && ((t = St(t)), t !== null && ap(t)),
          e)
        : ((e.eventSystemFlags |= r),
          (t = e.targetContainers),
          i !== null && t.indexOf(i) === -1 && t.push(i),
          e);
    }
    function Tp(e, t, n, r, i) {
      switch (t) {
        case `focusin`:
          return ((gp = wp(gp, e, t, n, r, i)), !0);
        case `dragenter`:
          return ((_p = wp(_p, e, t, n, r, i)), !0);
        case `mouseover`:
          return ((vp = wp(vp, e, t, n, r, i)), !0);
        case `pointerover`:
          var a = i.pointerId;
          return (yp.set(a, wp(yp.get(a) || null, e, t, n, r, i)), !0);
        case `gotpointercapture`:
          return ((a = i.pointerId), bp.set(a, wp(bp.get(a) || null, e, t, n, r, i)), !0);
      }
      return !1;
    }
    function Ep(e) {
      var t = xt(e.target);
      if (t !== null) {
        var n = l(t);
        if (n !== null) {
          if (((t = n.tag), t === 13)) {
            if (((t = u(n)), t !== null)) {
              ((e.blockedOn = t),
                ut(e.priority, function () {
                  op(n);
                }));
              return;
            }
          } else if (t === 31) {
            if (((t = d(n)), t !== null)) {
              ((e.blockedOn = t),
                ut(e.priority, function () {
                  op(n);
                }));
              return;
            }
          } else if (t === 3 && n.stateNode.current.memoizedState.isDehydrated) {
            e.blockedOn = n.tag === 3 ? n.stateNode.containerInfo : null;
            return;
          }
        }
      }
      e.blockedOn = null;
    }
    function Dp(e) {
      if (e.blockedOn !== null) return !1;
      for (var t = e.targetContainers; 0 < t.length; ) {
        var n = dp(e.nativeEvent);
        if (n === null) {
          n = e.nativeEvent;
          var r = new n.constructor(n.type, n);
          ((nn = r), n.target.dispatchEvent(r), (nn = null));
        } else return ((t = St(n)), t !== null && ap(t), (e.blockedOn = n), !1);
        t.shift();
      }
      return !0;
    }
    function Op(e, t, n) {
      Dp(e) && n.delete(t);
    }
    function kp() {
      ((hp = !1),
        gp !== null && Dp(gp) && (gp = null),
        _p !== null && Dp(_p) && (_p = null),
        vp !== null && Dp(vp) && (vp = null),
        yp.forEach(Op),
        bp.forEach(Op));
    }
    function Ap(e, n) {
      e.blockedOn === n &&
        ((e.blockedOn = null),
        hp || ((hp = !0), t.unstable_scheduleCallback(t.unstable_NormalPriority, kp)));
    }
    var jp = null;
    function Mp(e) {
      jp !== e &&
        ((jp = e),
        t.unstable_scheduleCallback(t.unstable_NormalPriority, function () {
          jp === e && (jp = null);
          for (var t = 0; t < e.length; t += 3) {
            var n = e[t],
              r = e[t + 1],
              i = e[t + 2];
            if (typeof r != `function`) {
              if (pp(r || n) === null) continue;
              break;
            }
            var a = St(n);
            a !== null &&
              (e.splice(t, 3),
              (t -= 3),
              ws(a, { pending: !0, data: i, method: n.method, action: r }, r, i));
          }
        }));
    }
    function Np(e) {
      function t(t) {
        return Ap(t, e);
      }
      (gp !== null && Ap(gp, e),
        _p !== null && Ap(_p, e),
        vp !== null && Ap(vp, e),
        yp.forEach(t),
        bp.forEach(t));
      for (var n = 0; n < xp.length; n++) {
        var r = xp[n];
        r.blockedOn === e && (r.blockedOn = null);
      }
      for (; 0 < xp.length && ((n = xp[0]), n.blockedOn === null); )
        (Ep(n), n.blockedOn === null && xp.shift());
      if (((n = (e.ownerDocument || e).$$reactFormReplay), n != null))
        for (r = 0; r < n.length; r += 3) {
          var i = n[r],
            a = n[r + 1],
            o = i[pt] || null;
          if (typeof a == `function`) o || Mp(n);
          else if (o) {
            var s = null;
            if (a && a.hasAttribute(`formAction`)) {
              if (((i = a), (o = a[pt] || null))) s = o.formAction;
              else if (pp(i) !== null) continue;
            } else s = o.action;
            (typeof s == `function` ? (n[r + 1] = s) : (n.splice(r, 3), (r -= 3)), Mp(n));
          }
        }
    }
    function Pp() {
      function e(e) {
        e.canIntercept &&
          e.info === `react-transition` &&
          e.intercept({
            handler: function () {
              return new Promise(function (e) {
                return (i = e);
              });
            },
            focusReset: `manual`,
            scroll: `manual`,
          });
      }
      function t() {
        (i !== null && (i(), (i = null)), r || setTimeout(n, 20));
      }
      function n() {
        if (!r && !navigation.transition) {
          var e = navigation.currentEntry;
          e &&
            e.url != null &&
            navigation.navigate(e.url, {
              state: e.getState(),
              info: `react-transition`,
              history: `replace`,
            });
        }
      }
      if (typeof navigation == `object`) {
        var r = !1,
          i = null;
        return (
          navigation.addEventListener(`navigate`, e),
          navigation.addEventListener(`navigatesuccess`, t),
          navigation.addEventListener(`navigateerror`, t),
          setTimeout(n, 100),
          function () {
            ((r = !0),
              navigation.removeEventListener(`navigate`, e),
              navigation.removeEventListener(`navigatesuccess`, t),
              navigation.removeEventListener(`navigateerror`, t),
              i !== null && (i(), (i = null)));
          }
        );
      }
    }
    function Fp(e) {
      this._internalRoot = e;
    }
    ((Ip.prototype.render = Fp.prototype.render =
      function (e) {
        var t = this._internalRoot;
        if (t === null) throw Error(s(409));
        var n = t.current;
        np(n, pu(), e, t, null, null);
      }),
      (Ip.prototype.unmount = Fp.prototype.unmount =
        function () {
          var e = this._internalRoot;
          if (e !== null) {
            this._internalRoot = null;
            var t = e.containerInfo;
            (np(e.current, 2, null, e, null, null), bu(), (t[mt] = null));
          }
        }));
    function Ip(e) {
      this._internalRoot = e;
    }
    Ip.prototype.unstable_scheduleHydration = function (e) {
      if (e) {
        var t = lt();
        e = { blockedOn: null, target: e, priority: t };
        for (var n = 0; n < xp.length && t !== 0 && t < xp[n].priority; n++);
        (xp.splice(n, 0, e), n === 0 && Ep(e));
      }
    };
    var Lp = r.version;
    if (Lp !== `19.2.6`) throw Error(s(527, Lp, `19.2.6`));
    j.findDOMNode = function (e) {
      var t = e._reactInternals;
      if (t === void 0)
        throw typeof e.render == `function`
          ? Error(s(188))
          : ((e = Object.keys(e).join(`,`)), Error(s(268, e)));
      return ((e = p(t)), (e = e === null ? null : m(e)), (e = e === null ? null : e.stateNode), e);
    };
    var Rp = {
      bundleType: 0,
      version: `19.2.6`,
      rendererPackageName: `react-dom`,
      currentDispatcherRef: A,
      reconcilerVersion: `19.2.6`,
    };
    if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < `u`) {
      var zp = __REACT_DEVTOOLS_GLOBAL_HOOK__;
      if (!zp.isDisabled && zp.supportsFiber)
        try {
          ((Be = zp.inject(Rp)), (Ve = zp));
        } catch {}
    }
    e.createRoot = function (e, t) {
      if (!c(e)) throw Error(s(299));
      var n = !1,
        r = ``,
        i = qs,
        a = Js,
        o = Ys;
      return (
        t != null &&
          (!0 === t.unstable_strictMode && (n = !0),
          t.identifierPrefix !== void 0 && (r = t.identifierPrefix),
          t.onUncaughtError !== void 0 && (i = t.onUncaughtError),
          t.onCaughtError !== void 0 && (a = t.onCaughtError),
          t.onRecoverableError !== void 0 && (o = t.onRecoverableError)),
        (t = ep(e, 1, !1, null, null, n, r, null, i, a, o, Pp)),
        (e[mt] = t.current),
        Sd(e),
        new Fp(t)
      );
    };
  }),
  c = e((e, t) => {
    function n() {
      if (
        !(
          typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > `u` ||
          typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != `function`
        )
      )
        try {
          __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(n);
        } catch (e) {
          console.error(e);
        }
    }
    (n(), (t.exports = s()));
  }),
  l = n(),
  u = c();
function d(e) {
  let t = e.split(`.`);
  return t.length >= 2 ? `${t[0]}.${t[1]}` : e;
}
var f = `https://github.com/zarcherlot/lightory`,
  p = [
    {
      version: `1.3`,
      sections: [
        {
          title: `Features`,
          items: [
            `Lightory is now branded and packaged as an independent project`,
            `Codex and OpenCode providers use Lightory-owned hook discovery paths`,
            `Education role tasks can run through the selected local provider`,
            `The browser app supports edit/play flows for role collaboration`,
          ],
        },
        {
          title: `Project`,
          items: [
            `Repository, documentation, package metadata, and issue templates point to zarcherlot/lightory`,
            `Local runtime state is stored under ~/.lightory for new installs`,
          ],
        },
        {
          title: `Credits`,
          items: [
            `Lightory started from MIT-licensed Pixel Agents code and now evolves independently`,
          ],
        },
      ],
      contributors: [],
    },
  ],
  m = e((e) => {
    var t = Symbol.for(`react.transitional.element`),
      n = Symbol.for(`react.fragment`);
    function r(e, n, r) {
      var i = null;
      if ((r !== void 0 && (i = `` + r), n.key !== void 0 && (i = `` + n.key), `key` in n))
        for (var a in ((r = {}), n)) a !== `key` && (r[a] = n[a]);
      else r = n;
      return (
        (n = r.ref),
        { $$typeof: t, type: e, key: i, ref: n === void 0 ? null : n, props: r }
      );
    }
    ((e.Fragment = n), (e.jsx = r), (e.jsxs = r));
  }),
  h = e((e, t) => {
    t.exports = m();
  })(),
  g = `border-2 rounded-none cursor-pointer`,
  _ = {
    sm: `py-1 px-8 text-sm`,
    md: `py-2 px-12`,
    lg: `py-3 px-14 text-lg`,
    xl: `py-6 px-24 text-xl`,
    icon: `p-0 w-16 h-16 flex items-center justify-center`,
    icon_lg: `p-0 w-40 h-40 flex items-center justify-center`,
  },
  v = {
    default: `${g} bg-btn-bg border-transparent hover:bg-btn-hover`,
    active: `${g} bg-active-bg border-accent`,
    disabled: `${g} bg-btn-bg border-transparent cursor-default opacity-[var(--btn-disabled-opacity)]`,
    accent: `${g} bg-accent! hover:bg-accent-bright! border-accent hover:border-accent-bright`,
    ghost: `${g} bg-transparent text-text-muted border-transparent hover:text-text`,
  };
function y({ variant: e = `default`, size: t = `lg`, className: n = ``, ...r }) {
  return (0, h.jsx)(`button`, { className: `${v[e]} ${_[t]} ${n}`, ...r });
}
function b({ isOpen: e, onClose: t, title: n, children: r, zIndex: i = 50, className: a = `` }) {
  return e
    ? (0, h.jsxs)(h.Fragment, {
        children: [
          (0, h.jsx)(`div`, {
            className: `fixed inset-0 bg-black/50`,
            style: { zIndex: i },
            onClick: t,
          }),
          (0, h.jsxs)(`div`, {
            className: `fixed top-1/2 left-1/2 max-h-[calc(100vh-32px)] -translate-x-1/2 -translate-y-1/2 bg-bg border-2 border-border rounded-none shadow-pixel p-4 min-w-xs flex flex-col overflow-hidden ${a}`,
            style: { zIndex: i + 1 },
            children: [
              (0, h.jsxs)(`div`, {
                className: `shrink-0 flex items-center justify-between py-4 px-10 border-b border-border mb-4`,
                children: [
                  (0, h.jsx)(`span`, { className: `text-accent-bright text-2xl`, children: n }),
                  (0, h.jsx)(y, { variant: `ghost`, size: `icon`, onClick: t, children: `x` }),
                ],
              }),
              (0, h.jsx)(`div`, { className: `min-h-0 flex-1 overflow-y-auto`, children: r }),
            ],
          }),
        ],
      })
    : null;
}
function x({ isOpen: e, onClose: t, currentVersion: n }) {
  let r = d(n),
    i = p.find((e) => e.version === r) ?? p[0];
  return i
    ? (0, h.jsxs)(b, {
        isOpen: e,
        onClose: t,
        title: (0, h.jsxs)(`span`, {
          className: `text-4xl`,
          children: [`What's New in v`, i.version],
        }),
        zIndex: 51,
        className: `min-w-sm!`,
        children: [
          (0, h.jsxs)(`div`, {
            className: `py-4 px-10 max-h-[60vh] overflow-y-auto`,
            children: [
              i.sections.map((e) =>
                (0, h.jsxs)(
                  `div`,
                  {
                    className: `mb-12`,
                    children: [
                      (0, h.jsx)(`div`, {
                        className: `text-lg text-accent-bright mb-4`,
                        children: e.title,
                      }),
                      (0, h.jsx)(`ul`, {
                        className: `m-0 pl-18 list-disc`,
                        children: e.items.map((e, t) =>
                          (0, h.jsx)(`li`, { className: `text-sm mb-2`, children: e }, t),
                        ),
                      }),
                    ],
                  },
                  e.title,
                ),
              ),
              i.contributors.length > 0 &&
                (0, h.jsxs)(`div`, {
                  className: `mb-8`,
                  children: [
                    (0, h.jsx)(`div`, {
                      className: `text-lg text-accent-bright mb-4`,
                      children: `Contributors`,
                    }),
                    (0, h.jsx)(`ul`, {
                      className: `m-0 pl-18 list-disc`,
                      children: i.contributors.map((e) =>
                        (0, h.jsxs)(
                          `li`,
                          {
                            className: `text-sm mb-2`,
                            children: [
                              (0, h.jsx)(`a`, {
                                href: e.url,
                                target: `_blank`,
                                rel: `noopener noreferrer`,
                                className: `text-accent-bright hover:text-accent no-underline`,
                                children: e.name,
                              }),
                              ` — `,
                              e.description,
                            ],
                          },
                          e.name,
                        ),
                      ),
                    }),
                  ],
                }),
            ],
          }),
          (0, h.jsx)(`div`, {
            className: `py-6 px-10 border-t border-border mt-4 flex justify-center`,
            children: (0, h.jsx)(`a`, {
              href: `${f}/blob/main/CHANGELOG.md`,
              target: `_blank`,
              rel: `noopener noreferrer`,
              className: `text-lg no-underline cursor-pointer transition-colors duration-200 hover:text-accent-bright`,
              children: `View on GitHub`,
            }),
          }),
        ],
      })
    : null;
}
var S = class {
  ws = null;
  handlers = [];
  url;
  reconnectAttempts = 0;
  reconnectTimer = null;
  disposed = !1;
  pendingMessages = [];
  constructor(e) {
    this.url = e;
  }
  connect() {
    this.disposed ||
      ((this.ws = new WebSocket(this.url)),
      (this.ws.onopen = () => {
        ((this.reconnectAttempts = 0), console.log(`[Transport] WebSocket connected`));
        for (let e of this.pendingMessages) this.ws.send(JSON.stringify(e));
        this.pendingMessages = [];
      }),
      (this.ws.onmessage = (e) => {
        try {
          let t = JSON.parse(e.data);
          for (let e of this.handlers) e(t);
        } catch {}
      }),
      (this.ws.onclose = () => {
        this.disposed || this.scheduleReconnect();
      }),
      (this.ws.onerror = () => {}));
  }
  send(e) {
    this.ws?.readyState === WebSocket.OPEN
      ? this.ws.send(JSON.stringify(e))
      : this.pendingMessages.push(e);
  }
  onMessage(e) {
    return (
      this.handlers.push(e),
      () => {
        this.handlers = this.handlers.filter((t) => t !== e);
      }
    );
  }
  dispose() {
    ((this.disposed = !0),
      (this.reconnectTimer &&= (clearTimeout(this.reconnectTimer), null)),
      this.ws?.close(),
      (this.ws = null),
      (this.handlers = []),
      (this.pendingMessages = []));
  }
  scheduleReconnect() {
    let e = Math.min(1e3 * 2 ** this.reconnectAttempts, 3e4);
    (this.reconnectAttempts++,
      console.log(
        `[Transport] WebSocket reconnecting in ${e}ms (attempt ${this.reconnectAttempts})`,
      ),
      (this.reconnectTimer = setTimeout(() => {
        ((this.reconnectTimer = null), this.connect());
      }, e)));
  }
};
function C() {
  let e = new S(
    `${window.location.protocol === `https:` ? `wss:` : `ws:`}//${window.location.host}/ws`,
  );
  return (e.connect(), e);
}
var w = C();
function T({ tool: e }) {
  return (0, h.jsx)(`span`, {
    className: `w-6 h-6 rounded-full inline-block shrink-0 ${e.done ? `bg-status-success` : e.permissionWait ? `bg-status-permission` : `bg-status-active`} ${e.done ? `` : `pixel-pulse`}`,
  });
}
function E({ tool: e }) {
  return (0, h.jsxs)(`span`, {
    className: `text-base flex items-center gap-5 ${e.done ? `opacity-50` : `opacity-80`}`,
    children: [
      (0, h.jsx)(T, { tool: e }),
      e.permissionWait && !e.done ? `Needs approval` : e.status,
    ],
  });
}
function ee(e) {
  if (e === 0) return `never`;
  let t = Math.round((Date.now() - e) / 1e3);
  return t < 2
    ? `just now`
    : t < 60
      ? `${t}s ago`
      : t < 3600
        ? `${Math.floor(t / 60)}m ago`
        : `${Math.floor(t / 3600)}h ago`;
}
function D({
  agents: e,
  selectedAgent: t,
  agentTools: n,
  agentStatuses: r,
  subagentTools: i,
  officeState: a,
  onSelectAgent: o,
}) {
  let [s, c] = (0, l.useState)({});
  return (
    (0, l.useEffect)(() => {
      w.send({ type: `requestDiagnostics` });
      let e = setInterval(() => {
        w.send({ type: `requestDiagnostics` });
      }, 2e3);
      return () => clearInterval(e);
    }, []),
    (0, l.useEffect)(() => {
      let e = (e) => {
        let t = e.data;
        if (t.type === `agentDiagnostics`) {
          let e = {};
          for (let n of t.agents) e[n.id] = n;
          c(e);
        }
      };
      return (
        window.addEventListener(`message`, e),
        () => window.removeEventListener(`message`, e)
      );
    }, []),
    (0, h.jsx)(`div`, {
      className: `absolute inset-0 overflow-auto bg-bg z-15`,
      children: (0, h.jsxs)(`div`, {
        className: `px-12 py-6 text-2xl`,
        children: [
          (0, h.jsx)(`h2`, { className: `text-3xl font-bold mb-8`, children: `Debug View` }),
          (0, h.jsx)(`div`, {
            className: `flex flex-col gap-6`,
            children: e.map((e) => {
              let c = t === e,
                l = n[e] || [],
                u = i[e] || {},
                d = r[e],
                f = l.some((e) => !e.done),
                p = s[e];
              return (0, h.jsxs)(
                `div`,
                {
                  className: `rounded-none py-6 px-8 border-2 cursor-pointer ${c ? `border-accent bg-active-bg` : `border-border`}`,
                  onClick: () => o(e),
                  children: [
                    (0, h.jsxs)(`span`, {
                      className: `flex items-center justify-between`,
                      children: [
                        (0, h.jsxs)(`span`, {
                          className: `rounded-none py-6 px-10 text-xl ${c ? `text-white font-bold` : ``}`,
                          children: [`Agent #`, e],
                        }),
                        (0, h.jsx)(y, {
                          variant: `ghost`,
                          size: `sm`,
                          onClick: (t) => {
                            (t.stopPropagation(), w.send({ type: `closeAgent`, id: e }));
                          },
                          className: `opacity-70 ${c ? `text-white` : ``}`,
                          title: `Close agent`,
                          children: `✕`,
                        }),
                      ],
                    }),
                    (l.length > 0 || d === `waiting`) &&
                      (0, h.jsxs)(`div`, {
                        className: `flex flex-col gap-[1px] mt-4 pl-4`,
                        children: [
                          l.map((e) =>
                            (0, h.jsxs)(
                              `div`,
                              {
                                children: [
                                  (0, h.jsx)(E, { tool: e }),
                                  u[e.toolId] &&
                                    u[e.toolId].length > 0 &&
                                    (0, h.jsx)(`div`, {
                                      className: `ml-3 pl-8 mt-[1px] flex flex-col gap-[1px] border-l-2 border-border`,
                                      children: u[e.toolId].map((e) =>
                                        (0, h.jsx)(E, { tool: e }, e.toolId),
                                      ),
                                    }),
                                ],
                              },
                              e.toolId,
                            ),
                          ),
                          d === `waiting` &&
                            !f &&
                            a.characters.get(e)?.waitingAwaitingInput &&
                            (0, h.jsxs)(`span`, {
                              className: `text-base opacity-85 flex items-center gap-5`,
                              children: [
                                (0, h.jsx)(`span`, {
                                  className: `w-6 h-6 rounded-full inline-block shrink-0 bg-status-permission`,
                                }),
                                `Waiting for input`,
                              ],
                            }),
                        ],
                      }),
                    p &&
                      (0, h.jsxs)(`div`, {
                        className: `mt-6 py-4 px-6 text-xs opacity-70 flex flex-col gap-2 border-t border-white/8`,
                        children: [
                          (0, h.jsxs)(`span`, {
                            children: [
                              (0, h.jsx)(`span`, {
                                className: p.jsonlExists
                                  ? `text-status-success`
                                  : `text-status-error`,
                                children: p.jsonlExists ? `JSONL connected` : `JSONL not found`,
                              }),
                              ` | `,
                              `Lines: `,
                              p.linesProcessed,
                              ` | `,
                              `Last data: `,
                              ee(p.lastDataAt),
                            ],
                          }),
                          (0, h.jsx)(`span`, {
                            className: `opacity-60 text-2xs break-all`,
                            children: p.jsonlFile,
                          }),
                          !p.projectDirExists &&
                            (0, h.jsxs)(`span`, {
                              className: `text-2xs text-status-error`,
                              children: [`Project dir does not exist: `, p.projectDir],
                            }),
                          p.jsonlExists &&
                            p.fileSize > 0 &&
                            p.linesProcessed === 0 &&
                            (0, h.jsxs)(`span`, {
                              className: `text-2xs text-status-permission`,
                              children: [
                                `File has data (`,
                                p.fileSize,
                                ` bytes) but 0 lines parsed. Possible format issue.`,
                              ],
                            }),
                        ],
                      }),
                  ],
                },
                e,
              );
            }),
          }),
        ],
      }),
    })
  );
}
function O({ editor: e, editorState: t }) {
  let [n, r] = (0, l.useState)(!1),
    i = t.undoStack.length === 0,
    a = t.redoStack.length === 0;
  return (0, h.jsxs)(`div`, {
    className: `absolute top-8 left-1/2 -translate-x-1/2 z-10 flex gap-4 items-center pixel-panel p-4`,
    children: [
      (0, h.jsx)(y, {
        variant: i ? `disabled` : `default`,
        size: `md`,
        onClick: i ? void 0 : e.handleUndo,
        title: `Undo (Ctrl+Z)`,
        children: `Undo`,
      }),
      (0, h.jsx)(y, {
        variant: a ? `disabled` : `default`,
        size: `md`,
        onClick: a ? void 0 : e.handleRedo,
        title: `Redo (Ctrl+Y)`,
        children: `Redo`,
      }),
      (0, h.jsx)(y, {
        variant: `default`,
        size: `md`,
        onClick: e.handleSave,
        title: `Save layout`,
        children: `Save`,
      }),
      n
        ? (0, h.jsxs)(`div`, {
            className: `flex gap-4 items-center`,
            children: [
              (0, h.jsx)(`span`, { className: `text-base text-reset-text`, children: `Reset?` }),
              (0, h.jsx)(y, {
                variant: `default`,
                size: `md`,
                className: `bg-danger text-white`,
                onClick: () => {
                  (r(!1), e.handleReset());
                },
                children: `Yes`,
              }),
              (0, h.jsx)(y, {
                variant: `default`,
                size: `md`,
                onClick: () => r(!1),
                children: `No`,
              }),
            ],
          })
        : (0, h.jsx)(y, {
            variant: `default`,
            size: `md`,
            onClick: () => r(!0),
            title: `Reset to last saved layout`,
            children: `Reset`,
          }),
    ],
  });
}
var k = 0.15,
  te = 0.3,
  ne = 0.3,
  re = 0.3,
  ie = `#ccffcc`,
  ae = (e) => `rgba(0, 255, 65, ${e})`,
  A = (e) => `rgba(0, 170, 40, ${e})`,
  j = (e) => `rgba(0, 85, 20, ${e})`,
  oe = 0.6,
  se = 0.5,
  ce = 0.5,
  le = 0.001,
  ue = 0.5,
  M = 0.5,
  de = 0.25,
  fe = [4, 3],
  pe = 0.45,
  me = 1.5,
  he = 0.5,
  ge = 0.5,
  _e = 0.55,
  ve = `#808080`,
  ye = `rgba(0, 127, 212, 0.35)`,
  be = `rgba(0, 200, 80, 0.35)`,
  xe = `rgba(220, 50, 50, 0.35)`,
  Se = `rgba(255,255,255,0.12)`,
  Ce = `rgba(255,255,255,0.08)`,
  we = [2, 2],
  Te = `rgba(60, 130, 220, 0.25)`,
  Ee = `rgba(60, 130, 220, 0.5)`,
  De = `rgba(255, 255, 255, 0.06)`,
  Oe = `#00ff00`,
  ke = `#ff0000`,
  Ae = `#007fd4`,
  je = `rgba(200, 50, 50, 0.85)`,
  Me = `rgba(50, 120, 200, 0.85)`,
  Ne = `#fff`,
  Pe = `#FF00FF`,
  Fe = `#3A3A5C`,
  Ie = `#f8fbff`,
  Le = `#2a2a3a`,
  Re = `#ffd25a`,
  ze = `#ffbf3f`,
  Be = `#b9c4d8`,
  Ve = `#3794ff`,
  He = `#74b9ff`,
  Ue = `#ffbf3f`,
  We = `#ffb86b`,
  Ge = `#58c77a`,
  Ke = `#9d8cff`,
  qe = `#2a2a3a`,
  Je = `#f8fbff`,
  Ye = 0.1,
  Xe = 1500,
  Ze = 2e3,
  Qe = 0.25,
  $e = { h: 35, s: 30, b: 15, c: 0 },
  et = { h: 240, s: 25, b: 0, c: 0 },
  tt = { h: 0, s: 0, b: 0, c: 0 },
  nt = 659.25,
  rt = 1318.51,
  it = 0.1,
  at = 0.18,
  ot = 0.14,
  st = 659.25,
  ct = 0.12,
  lt = 0.15,
  ut = 0.12,
  dt = 0.2,
  ft = 2e4,
  pt = 1e3,
  mt = 0.1,
  ht = 0.3,
  gt = 2e5,
  _t = `#44cc44`,
  vt = `#ffcc00`,
  yt = `#ff8800`,
  bt = `#ff2222`,
  xt = 0.15,
  St = 0.3,
  Ct = [0, 1, 0, 2],
  wt = [0, 1, 2, 1],
  N = {
    WALL: 0,
    FLOOR_1: 1,
    FLOOR_2: 2,
    FLOOR_3: 3,
    FLOOR_4: 4,
    FLOOR_5: 5,
    FLOOR_6: 6,
    FLOOR_7: 7,
    FLOOR_8: 8,
    FLOOR_9: 9,
    VOID: 255,
  },
  P = { IDLE: `idle`, WALK: `walk`, TYPE: `type`, BUSY: `busy` },
  F = { DOWN: 0, LEFT: 1, RIGHT: 2, UP: 3 },
  I = {
    TILE_PAINT: `tile_paint`,
    WALL_PAINT: `wall_paint`,
    FURNITURE_PLACE: `furniture_place`,
    FURNITURE_PICK: `furniture_pick`,
    SELECT: `select`,
    EYEDROPPER: `eyedropper`,
    ERASE: `erase`,
    PETS: `pets`,
  },
  Tt = { IDLE: `idle`, WALK: `walk`, FOLLOW: `follow` },
  Et = 9e3,
  Dt = [
    {
      id: `storyteller`,
      name: `任务规划员`,
      title: `任务规划员`,
      palette: 0,
      taskFile: `roles/storyteller.md`,
      abilityCards: [`任务规划员`],
      resultCard: `任务规划员`,
      responsibility: `把用户意图拆成 robot-plan/v1，决定工具、假设、风险和确认需求。`,
      roleTaskIcon: `card`,
    },
    {
      id: `checker`,
      name: `安全监督员`,
      title: `安全监督员`,
      palette: 1,
      taskFile: `roles/checker.md`,
      abilityCards: [`安全监督员`],
      resultCard: `安全监督员`,
      responsibility: `检查高风险动作、用户确认、lease、速度、禁区和急停状态。`,
      roleTaskIcon: `card`,
    },
    {
      id: `weather`,
      name: `家庭记忆员`,
      title: `家庭记忆员`,
      palette: 2,
      taskFile: `roles/weather.md`,
      abilityCards: [`家庭记忆员`],
      resultCard: `家庭记忆员`,
      responsibility: `持久记录家庭 POI、房间别名、禁行区和用户环境声明。`,
      roleTaskIcon: `weather`,
    },
    {
      id: `travel`,
      name: `底盘驾驶员`,
      title: `底盘驾驶员`,
      palette: 3,
      taskFile: `roles/travel.md`,
      abilityCards: [`底盘驾驶员`],
      resultCard: `底盘驾驶员`,
      responsibility: `执行底盘状态查询、低速路径跟随、停止和 base lease。`,
      roleTaskIcon: `travel`,
    },
    {
      id: `dresser`,
      name: `机械臂操作员`,
      title: `机械臂操作员`,
      palette: 4,
      taskFile: `roles/dresser.md`,
      abilityCards: [`机械臂操作员`],
      resultCard: `机械臂操作员`,
      responsibility: `把抓取、放置、递送和机械臂停止动作拆成安全步骤。`,
      roleTaskIcon: `dresser`,
    },
    {
      id: `encyclopedia`,
      name: `视觉观察员`,
      title: `视觉观察员`,
      palette: 5,
      taskFile: `roles/encyclopedia.md`,
      abilityCards: [`视觉观察员`],
      resultCard: `视觉观察员`,
      responsibility: `读取视觉传感器画面，描述物体、人体、通道和危险。`,
      roleTaskIcon: `card`,
    },
    {
      id: `captain`,
      name: `语音播报员`,
      title: `语音播报员`,
      palette: 0,
      taskFile: `roles/captain.md`,
      abilityCards: [`语音播报员`],
      resultCard: `语音播报员`,
      responsibility: `把确认、提醒、结果转成适合扬声器播放的短句。`,
      roleTaskIcon: `captain`,
    },
    {
      id: `poster`,
      name: `LED 表情员`,
      title: `LED 表情员`,
      palette: 1,
      taskFile: `roles/poster.md`,
      abilityCards: [`LED 表情员`],
      resultCard: `LED 表情员`,
      responsibility: `把等待、执行中、成功、错误和安全状态转成 LED 灯效。`,
      roleTaskIcon: `card`,
    },
  ];
function Ot(e) {
  let t = Dt.findIndex((t) => t.id === e);
  return Et + Math.max(0, t);
}
function kt(e) {
  return Dt.find((t) => t.id === e);
}
var At = {
    家庭记忆员: `var(--education-card-route)`,
    机械臂操作员: `var(--education-card-dresser)`,
    底盘驾驶员: `var(--education-card-travel)`,
    语音播报员: `var(--education-card-plan)`,
    视觉观察员: `var(--education-card-knowledge)`,
    任务规划员: `var(--education-card-story)`,
    'LED 表情员': `var(--education-card-poster)`,
    安全监督员: `var(--education-card-check)`,
  },
  jt = {
    storyteller: [`家庭记忆员`, `视觉观察员`],
    checker: [`任务规划员`, `视觉观察员`, `家庭记忆员`],
    weather: [`任务规划员`, `视觉观察员`],
    travel: [`任务规划员`, `安全监督员`, `家庭记忆员`, `视觉观察员`],
    dresser: [`任务规划员`, `安全监督员`, `视觉观察员`],
    encyclopedia: [`任务规划员`, `安全监督员`],
    captain: [`任务规划员`, `安全监督员`, `底盘驾驶员`, `机械臂操作员`],
    poster: [`任务规划员`, `安全监督员`, `底盘驾驶员`, `机械臂操作员`],
  };
function Mt({
  officeState: e,
  activeRoleIds: t,
  isEditMode: n,
  runStatus: r,
  containerRef: i,
  zoom: a,
  panRef: o,
  onConfigureRole: s,
  onRunTeam: c,
  onPauseRun: u,
  onResumeRun: d,
  onStopRun: f,
  onBackToEdit: p,
}) {
  let [, m] = (0, l.useState)(0),
    [g, _] = (0, l.useState)(null),
    [v, b] = (0, l.useState)(null),
    [x, S] = (0, l.useState)(null),
    [C, w] = (0, l.useState)(null),
    [T, E] = (0, l.useState)([]),
    [ee, D] = (0, l.useState)([]),
    [O, k] = (0, l.useState)(null),
    [te, ne] = (0, l.useState)({}),
    re = (0, l.useRef)(0),
    ie = (0, l.useRef)([]);
  ((0, l.useEffect)(() => {
    let e = 0,
      t = () => {
        (m((e) => e + 1), (e = requestAnimationFrame(t)));
      };
    return ((e = requestAnimationFrame(t)), () => cancelAnimationFrame(e));
  }, []),
    (0, l.useEffect)(() => {
      let e = i.current;
      if (!e) return;
      let t = (t, n) => {
          let r = e.getBoundingClientRect(),
            i = t - r.left,
            a = n - r.top;
          return (
            ie.current.find(
              (e) => Math.abs(e.screenX - i) <= 52 && Math.abs(e.screenY - 42 - a) <= 52,
            ) ?? null
          );
        },
        r = (e) => {
          let n = t(e.clientX, e.clientY);
          S((e) => (e === n?.roleId ? e : (n?.roleId ?? null)));
        },
        a = () => S(null),
        o = (e) => {
          let r = t(e.clientX, e.clientY);
          r && (w((e) => (e === r.roleId ? null : r.roleId)), n && s(r.roleId));
        };
      return (
        e.addEventListener(`mousemove`, r),
        e.addEventListener(`mouseleave`, a),
        e.addEventListener(`click`, o),
        () => {
          (e.removeEventListener(`mousemove`, r),
            e.removeEventListener(`mouseleave`, a),
            e.removeEventListener(`click`, o));
        }
      );
    }, [i, n, s]));
  let ae = i.current;
  if (!ae) return null;
  let A = ae.getBoundingClientRect(),
    j = window.devicePixelRatio || 1,
    oe = Math.round(A.width * j),
    se = Math.round(A.height * j),
    ce = e.getLayout(),
    le = ce.cols * 16 * a,
    ue = ce.rows * 16 * a,
    M = Math.floor((oe - le) / 2) + Math.round(o.current.x),
    de = Math.floor((se - ue) / 2) + Math.round(o.current.y),
    fe = Dt.filter((e) => t.has(e.id)),
    pe = fe.length > 0,
    me = Dt.map((t) => {
      let n = e.characters.get(Ot(t.id));
      if (!n) return null;
      let r = n.state === P.TYPE || n.state === P.BUSY ? 6 : 0;
      return { roleId: t.id, screenX: (M + n.x * a) / j, screenY: (de + (n.y + r - 32) * a) / j };
    }).filter((e) => e !== null);
  ie.current = me;
  let he = (e) => me.find((t) => t.roleId === e) ?? null,
    ge = (e, t, n) => t !== n && (jt[n] ?? []).includes(e),
    _e = (e) => `${e.sourceRoleId}->${e.targetRoleId}:${e.card}`,
    ve = (e) =>
      e
        ? new Set(T.filter((t) => t.sourceRoleId === e || t.targetRoleId === e).map(_e))
        : new Set(),
    ye = ve(x),
    be = ve(C),
    xe = ye.size > 0 ? ye : be,
    Se = xe.size > 0,
    Ce = (e) => {
      let t = ++re.current;
      (k({ id: t, text: e }),
        window.setTimeout(() => {
          k((e) => (e?.id === t ? null : e));
        }, 2e3));
    },
    we = (e, t, n) => {
      let r = ++re.current;
      (E((r) =>
        r.some((r) => r.sourceRoleId === e && r.targetRoleId === t && r.card === n)
          ? r
          : [...r, { sourceRoleId: e, targetRoleId: t, card: n }],
      ),
        D((i) => [...i, { id: r, sourceRoleId: e, targetRoleId: t, card: n }]),
        ne((e) => {
          if (!e[t]) return e;
          let n = { ...e };
          return (delete n[t], n);
        }),
        window.setTimeout(() => {
          D((e) => e.filter((e) => e.id !== r));
        }, 1900));
    },
    Te = () => {
      let e = new Set(fe.map((e) => e.id)),
        t = {};
      for (let n of fe) {
        let r = jt[n.id] ?? [];
        if (
          r.length === 0 ||
          T.filter(
            (t) => t.targetRoleId === n.id && e.has(t.sourceRoleId) && r.includes(t.card),
          ).map((e) => e.card).length > 0
        )
          continue;
        let i = r
          .filter((e) => fe.some((t) => t.id !== n.id && t.abilityCards.includes(e)))
          .slice(0, 3);
        if (i.length === 0) continue;
        let a = ++re.current;
        t[n.id] = { id: a, text: `我还缺${i.join(`或`)}的输入。` };
      }
      return t;
    },
    Ee = () => {
      let e = Te();
      if (Object.keys(e).length > 0) {
        (ne(e), Ce(`有角色还缺输入，先把协作关系连好。`));
        return;
      }
      (ne({}), c(T));
    },
    De = (e, t) => {
      let n = Dt.find((e) => e.id === t),
        r = fe.find((t) => (jt[t.id] ?? []).includes(e));
      return r
        ? `${n?.name ?? `这个角色`}不需要${e}，可以交给${r.name}。`
        : `${n?.name ?? `这个角色`}暂时不能接收${e}。`;
    },
    Oe = n
      ? null
      : r === `running`
        ? `运行中`
        : r === `pausing`
          ? `准备暂停`
          : r === `paused`
            ? `已暂停`
            : r === `completed`
              ? `已完成`
              : r === `error`
                ? `遇到问题`
                : `已停止`;
  return (0, h.jsxs)(h.Fragment, {
    children: [
      (0, h.jsxs)(`div`, {
        className: `absolute top-10 left-10 z-30 pixel-panel px-10 py-8 max-w-360`,
        children: [
          (0, h.jsxs)(`div`, {
            className: `flex items-center justify-between gap-8 mb-4`,
            children: [
              (0, h.jsx)(`div`, {
                className: `text-sm leading-tight text-text-muted`,
                children: `角色编排`,
              }),
              Oe
                ? (0, h.jsx)(`div`, {
                    className: `text-xs leading-none text-text-muted`,
                    children: Oe,
                  })
                : null,
            ],
          }),
          (0, h.jsx)(`div`, {
            className: `text-base leading-tight mb-8`,
            children: `桌面机器人：理解、导航、操作并反馈`,
          }),
          n
            ? (0, h.jsx)(y, {
                variant: pe ? `accent` : `disabled`,
                size: `icon_lg`,
                disabled: !pe,
                onClick: Ee,
                title: pe ? `运行小队` : `先把角色拖进房间`,
                'aria-label': `运行小队`,
                children: (0, h.jsx)(Nt, { label: `运行`, children: `▶` }),
              })
            : r === `running` || r === `pausing`
              ? (0, h.jsxs)(`div`, {
                  className: `flex flex-wrap gap-6`,
                  children: [
                    (0, h.jsx)(y, {
                      variant: r === `pausing` ? `disabled` : `default`,
                      size: `icon_lg`,
                      disabled: r === `pausing`,
                      onClick: u,
                      title: `当前这批角色完成后暂停`,
                      'aria-label': `暂停`,
                      children: (0, h.jsx)(Nt, { label: `暂停`, children: `Ⅱ` }),
                    }),
                    (0, h.jsx)(y, {
                      variant: `default`,
                      size: `icon_lg`,
                      onClick: f,
                      title: `停止后续角色运行`,
                      'aria-label': `停止`,
                      children: (0, h.jsx)(Nt, { label: `停止`, children: `■` }),
                    }),
                  ],
                })
              : r === `paused`
                ? (0, h.jsxs)(`div`, {
                    className: `flex flex-wrap gap-6`,
                    children: [
                      (0, h.jsx)(y, {
                        variant: `accent`,
                        size: `icon_lg`,
                        onClick: d,
                        title: `继续运行下一批角色`,
                        'aria-label': `继续运行`,
                        children: (0, h.jsx)(Nt, { label: `继续`, children: `▶` }),
                      }),
                      (0, h.jsx)(y, {
                        variant: `default`,
                        size: `icon_lg`,
                        onClick: f,
                        title: `停止后续角色运行`,
                        'aria-label': `停止`,
                        children: (0, h.jsx)(Nt, { label: `停止`, children: `■` }),
                      }),
                    ],
                  })
                : r === `completed`
                  ? (0, h.jsxs)(`div`, {
                      className: `flex flex-wrap gap-6`,
                      children: [
                        (0, h.jsx)(y, {
                          variant: `accent`,
                          size: `icon_lg`,
                          onClick: Ee,
                          title: `按当前连接再运行一次`,
                          'aria-label': `再跑一次`,
                          children: (0, h.jsx)(Nt, { label: `再跑一次`, children: `↻` }),
                        }),
                        (0, h.jsx)(y, {
                          variant: `default`,
                          size: `icon_lg`,
                          onClick: p,
                          title: `回到编辑模式调整小队`,
                          'aria-label': `回到编辑`,
                          children: (0, h.jsx)(Nt, { label: `回到编辑`, children: `✎` }),
                        }),
                      ],
                    })
                  : r === `error`
                    ? (0, h.jsxs)(`div`, {
                        className: `flex flex-wrap gap-6`,
                        children: [
                          (0, h.jsx)(y, {
                            variant: `accent`,
                            size: `icon_lg`,
                            onClick: Ee,
                            title: `重新运行当前小队`,
                            'aria-label': `再试一次`,
                            children: (0, h.jsx)(Nt, { label: `再试一次`, children: `↻` }),
                          }),
                          (0, h.jsx)(y, {
                            variant: `default`,
                            size: `icon_lg`,
                            onClick: p,
                            title: `回到编辑模式修正连接`,
                            'aria-label': `回到编辑`,
                            children: (0, h.jsx)(Nt, { label: `回到编辑`, children: `✎` }),
                          }),
                        ],
                      })
                    : (0, h.jsxs)(`div`, {
                        className: `flex flex-wrap gap-6`,
                        children: [
                          (0, h.jsx)(y, {
                            variant: `accent`,
                            size: `icon_lg`,
                            onClick: Ee,
                            title: `按当前连接重新运行`,
                            'aria-label': `再跑一次`,
                            children: (0, h.jsx)(Nt, { label: `再跑一次`, children: `↻` }),
                          }),
                          (0, h.jsx)(y, {
                            variant: `default`,
                            size: `icon_lg`,
                            onClick: p,
                            title: `回到编辑模式`,
                            'aria-label': `回到编辑`,
                            children: (0, h.jsx)(Nt, { label: `回到编辑`, children: `✎` }),
                          }),
                        ],
                      }),
        ],
      }),
      n &&
        g &&
        (0, h.jsx)(`div`, {
          className: `absolute inset-0 z-32 pointer-events-none`,
          children: me.map((e) => {
            let t = ge(g.card, g.sourceRoleId, e.roleId),
              n = v === e.roleId;
            return (0, h.jsx)(
              `div`,
              {
                className: `absolute -translate-x-1/2 -translate-y-1/2 border-2 shadow-pixel ${t ? `border-status-success bg-status-success/20` : `border-danger bg-danger/15`} ${n ? `scale-110` : ``}`,
                style: {
                  left: e.screenX,
                  top: e.screenY - 42,
                  width: 112,
                  height: 112,
                  pointerEvents: `auto`,
                  transition: `transform 120ms ease`,
                },
                onDragEnter: () => b(e.roleId),
                onDragLeave: () => b((t) => (t === e.roleId ? null : t)),
                onDragOver: (e) => {
                  (e.preventDefault(), (e.dataTransfer.dropEffect = t ? `copy` : `none`));
                },
                onDrop: (t) => {
                  t.preventDefault();
                  let n = t.dataTransfer.getData(`application/x-education-card`),
                    r = g;
                  if (n)
                    try {
                      r = JSON.parse(n);
                    } catch {
                      r = g;
                    }
                  r &&
                    (ge(r.card, r.sourceRoleId, e.roleId)
                      ? we(r.sourceRoleId, e.roleId, r.card)
                      : Ce(De(r.card, e.roleId)),
                    _(null),
                    b(null));
                },
              },
              e.roleId,
            );
          }),
        }),
      n &&
        (T.length > 0 || ee.length > 0) &&
        (0, h.jsxs)(`svg`, {
          className: `absolute inset-0 z-33 pointer-events-none w-full h-full`,
          children: [
            (0, h.jsx)(`defs`, {
              children: (0, h.jsxs)(`filter`, {
                id: `education-pulse-glow`,
                x: `-80%`,
                y: `-80%`,
                width: `260%`,
                height: `260%`,
                children: [
                  (0, h.jsx)(`feGaussianBlur`, { stdDeviation: `4`, result: `blur` }),
                  (0, h.jsxs)(`feMerge`, {
                    children: [
                      (0, h.jsx)(`feMergeNode`, { in: `blur` }),
                      (0, h.jsx)(`feMergeNode`, { in: `SourceGraphic` }),
                    ],
                  }),
                ],
              }),
            }),
            T.map((e) => {
              let t = he(e.sourceRoleId),
                r = he(e.targetRoleId);
              return !t || !r
                ? null
                : (0, h.jsx)(
                    Pt,
                    {
                      source: t,
                      target: r,
                      card: e.card,
                      persistent: !0,
                      emphasized: !Se || xe.has(_e(e)),
                      muted: Se && !xe.has(_e(e)),
                      showLoopPulse: n,
                    },
                    `${e.sourceRoleId}-${e.targetRoleId}-${e.card}`,
                  );
            }),
            ee.map((e) => {
              let t = he(e.sourceRoleId),
                n = he(e.targetRoleId);
              return !t || !n
                ? null
                : (0, h.jsx)(
                    Pt,
                    {
                      source: t,
                      target: n,
                      card: e.card,
                      persistent: !1,
                      emphasized: !0,
                      muted: !1,
                      showLoopPulse: !1,
                    },
                    e.id,
                  );
            }),
          ],
        }),
      O &&
        (0, h.jsx)(
          `div`,
          {
            className: `absolute left-1/2 top-92 -translate-x-1/2 z-40 pixel-panel px-12 py-7 text-sm leading-tight max-w-420 text-center border-danger`,
            children: O.text,
          },
          O.id,
        ),
      Dt.map((t) => {
        let r = e.characters.get(Ot(t.id));
        if (!r) return null;
        let i = r.state === P.TYPE || r.state === P.BUSY ? 6 : 0,
          o = (M + r.x * a) / j,
          s = (de + (r.y + i - 32) * a) / j;
        return n
          ? (0, h.jsxs)(
              `div`,
              {
                className: `absolute z-34 flex flex-col items-center gap-4 -translate-x-1/2 pointer-events-none`,
                style: { left: o, top: s - 92 },
                children: [
                  t.abilityCards.map((e) =>
                    (0, h.jsx)(
                      `div`,
                      {
                        draggable: !0,
                        className: `px-8 py-4 bg-bg border-2 shadow-pixel text-sm leading-none whitespace-nowrap pointer-events-auto select-none ${T.some((n) => n.sourceRoleId === t.id && n.card === e) ? `border-status-success` : `border-accent`}`,
                        style: { cursor: `grab`, borderColor: At[e] ?? void 0 },
                        onDragStart: (n) => {
                          let r = { sourceRoleId: t.id, card: e };
                          (_(r),
                            n.dataTransfer.setData(
                              `application/x-education-card`,
                              JSON.stringify(r),
                            ),
                            (n.dataTransfer.effectAllowed = `copy`));
                        },
                        onDragEnd: () => {
                          (_(null), b(null));
                        },
                        title: `拖动${e}到需要它的角色身上`,
                        children: e,
                      },
                      e,
                    ),
                  ),
                  te[t.id]
                    ? (0, h.jsx)(
                        `div`,
                        {
                          className: `pixel-panel px-7 py-5 max-w-220 text-xs leading-tight text-center border-warning bg-bg/95`,
                          children: te[t.id].text,
                        },
                        te[t.id].id,
                      )
                    : null,
                ],
              },
              t.id,
            )
          : null;
      }),
    ],
  });
}
function Nt({ children: e, label: t }) {
  return (0, h.jsxs)(h.Fragment, {
    children: [
      (0, h.jsx)(`span`, { 'aria-hidden': `true`, className: `text-lg leading-none`, children: e }),
      (0, h.jsx)(`span`, { className: `sr-only`, children: t }),
    ],
  });
}
function Pt({
  source: e,
  target: t,
  card: n,
  persistent: r,
  emphasized: i,
  muted: a,
  showLoopPulse: o,
}) {
  let s = e.screenY - 104,
    c = t.screenY - 56,
    l = Math.min(s, c) - 72,
    u = At[n] ?? `var(--color-accent-bright)`,
    d = (e.screenX + t.screenX) / 2,
    f = l - 8,
    p = a ? `0.08` : i ? (r ? `0.34` : `0.5`) : `0.22`,
    m = Ft(e, t);
  return (0, h.jsxs)(`g`, {
    className: r ? `education-connection-persistent` : `education-connection-feedback`,
    children: [
      i &&
        !a &&
        (0, h.jsx)(`path`, {
          className: `education-connection-sheen`,
          d: m,
          fill: `none`,
          stroke: u,
          strokeWidth: `7`,
          strokeLinecap: `round`,
          opacity: r ? `0.08` : `0.16`,
        }),
      (0, h.jsx)(`path`, {
        d: m,
        fill: `none`,
        stroke: u,
        strokeWidth: i && !a ? `4` : `3`,
        strokeLinecap: `round`,
        opacity: p,
      }),
      (0, h.jsx)(`text`, {
        x: d,
        y: f,
        textAnchor: `middle`,
        fill: u,
        stroke: `var(--education-card-label-stroke)`,
        strokeWidth: `4`,
        paintOrder: `stroke`,
        opacity: a ? `0.18` : `0.82`,
        style: { fontSize: 18 },
        children: n,
      }),
      o &&
        !a &&
        (0, h.jsxs)(h.Fragment, {
          children: [
            (0, h.jsx)(`circle`, {
              r: `14`,
              fill: u,
              opacity: `0.18`,
              filter: `url(#education-pulse-glow)`,
              children: (0, h.jsx)(`animateMotion`, {
                dur: `2.6s`,
                repeatCount: `indefinite`,
                path: m,
              }),
            }),
            (0, h.jsx)(`circle`, {
              r: `6`,
              fill: u,
              opacity: `0.9`,
              filter: `url(#education-pulse-glow)`,
              children: (0, h.jsx)(`animateMotion`, {
                dur: `2.6s`,
                repeatCount: `indefinite`,
                path: m,
              }),
            }),
            (0, h.jsx)(`circle`, {
              r: `10`,
              fill: u,
              opacity: `0.1`,
              filter: `url(#education-pulse-glow)`,
              children: (0, h.jsx)(`animateMotion`, {
                begin: `1.3s`,
                dur: `2.6s`,
                repeatCount: `indefinite`,
                path: m,
              }),
            }),
          ],
        }),
    ],
  });
}
function Ft(e, t) {
  let n = e.screenY - 104,
    r = t.screenY - 56,
    i = Math.min(n, r) - 72;
  return `M ${e.screenX} ${n} C ${e.screenX} ${i}, ${t.screenX} ${i}, ${t.screenX} ${r}`;
}
function It({ onDismiss: e }) {
  return (0, h.jsx)(`div`, {
    className: `absolute inset-0 bg-black/70 flex items-center justify-center z-100`,
    onClick: e,
    children: (0, h.jsxs)(`div`, {
      className: `pixel-panel py-24 px-32 max-w-xl text-center leading-[1.3]`,
      onClick: (e) => e.stopPropagation(),
      children: [
        (0, h.jsx)(`div`, {
          className: `text-5xl mb-12 text-accent`,
          children: `We owe you an apology!`,
        }),
        (0, h.jsx)(`p`, {
          className: `text-xl m-0 mb-12`,
          children: `We've just migrated to fully open-source assets, all built from scratch with love. Unfortunately, this means your previous layout had to be reset.`,
        }),
        (0, h.jsx)(`p`, {
          className: `text-xl m-0 mb-12`,
          children: `We're really sorry about that.`,
        }),
        (0, h.jsx)(`p`, {
          className: `text-xl m-0 mb-12`,
          children: `The good news? This was a one-time thing, and it paves the way for some genuinely exciting updates ahead.`,
        }),
        (0, h.jsx)(`p`, {
          className: `text-xl m-0 mb-20`,
          children: `Stay tuned, and thanks for using Lightory!`,
        }),
        (0, h.jsx)(y, { variant: `accent`, size: `xl`, onClick: e, children: `Got it` }),
      ],
    }),
  });
}
var Lt = {
    city: `主卧、客厅、厨房、充电桩`,
    date: `今天`,
    outputs: { condition: !0, temperature: !0, rain: !0, wind: !0, airQuality: !1 },
  },
  Rt = {
    activity: `把桌上的小物品递给用户`,
    style: `低速、避开人手、确认抓取目标`,
    outputs: { top: !0, bottom: !0, shoes: !0, accessories: !0 },
  },
  zt = {
    destination: `主卧`,
    transport: `轮式底盘低速移动`,
    outputs: { umbrella: !0, waterBottle: !0, sunProtection: !0, safety: !0 },
  },
  Bt = {
    audience: `家庭用户`,
    tone: `简短、明确、可确认`,
    outputs: { weatherSummary: !0, clothingSummary: !0, travelSummary: !0, checklist: !0 },
  },
  Vt = {
    navigator: {
      heading: `领航员任务`,
      persona: `你是桌面机器人的领航员，负责读取地图记忆、POI 和视觉事实，规划底盘路线。`,
      cardName: `路线输入`,
      defaultTopic: `从当前位置移动到主卧`,
      defaultStyle: `低速、安全、可执行`,
      defaultInclude: `目标 POI、关键路标、禁行区、到达判定`,
    },
    encyclopedia: {
      heading: `视觉观察员任务`,
      persona: `你是桌面机器人的视觉观察员，负责把摄像头画面整理成可给规划和安全角色使用的事实。`,
      cardName: `视觉观察员`,
      defaultTopic: `观察桌面、通道、人物和目标物`,
      defaultStyle: `客观、结构化、只描述可见事实`,
      defaultInclude: `物体、方位、距离估计、通道、风险`,
    },
    calculator: {
      heading: `状态诊断员任务`,
      persona: `你是桌面机器人的状态诊断员，负责汇总硬件与软件运行状态。`,
      cardName: `状态诊断`,
      defaultTopic: `检查移动、机械臂、视觉、麦克风、扬声器和电量状态`,
      defaultStyle: `简短、分级、可排障`,
      defaultInclude: `可用能力、异常状态、是否允许继续执行`,
    },
    translator: {
      heading: `听觉监听员任务`,
      persona: `你是桌面机器人的听觉监听员，负责把麦克风输入整理成事实。`,
      cardName: `听觉监听员`,
      defaultTopic: `识别用户说话、确认回复和环境声音`,
      defaultStyle: `准确、保留不确定性`,
      defaultInclude: `原话摘要、说话人、置信度、是否为打断或确认`,
    },
    storyteller: {
      heading: `任务规划员任务`,
      persona: `你是桌面机器人的任务规划员，负责把用户意图拆成可协调的角色步骤。`,
      cardName: `任务规划员`,
      defaultTopic: `用户要求机器人去主卧并递一个物品`,
      defaultStyle: `可执行、可中断、先安全后动作`,
      defaultInclude: `目标、前置确认、观察、导航、移动、操作、反馈`,
    },
    poster: {
      heading: `LED 表情员任务`,
      persona: `你是桌面机器人的 LED 表情员，负责把机器人状态转换成灯效。`,
      cardName: `LED 表情员`,
      defaultTopic: `为等待确认、执行中、成功、错误和安全停止设计灯效`,
      defaultStyle: `清晰、克制、不打扰`,
      defaultInclude: `颜色、闪烁节奏、触发状态、结束条件`,
    },
    checker: {
      heading: `安全监督员任务`,
      persona: `你是桌面机器人的安全监督员，负责审查移动和机械臂动作。`,
      cardName: `安全监督员`,
      defaultTopic: `检查去主卧和递物动作是否安全`,
      defaultStyle: `保守、明确、必要时要求确认`,
      defaultInclude: `允许/禁止、风险点、需要用户确认的问题、停止条件`,
    },
    summarizer: {
      heading: `交互入口员任务`,
      persona: `你是桌面机器人的交互入口员，负责接收用户输入并判断输入类型。`,
      cardName: `用户意图`,
      defaultTopic: `用户说：这里是主卧，之后把眼镜递给我`,
      defaultStyle: `短句、结构化、可路由`,
      defaultInclude: `输入类型、用户意图、环境声明、需要确认的字段`,
    },
    questioner: {
      heading: `确认追问员任务`,
      persona: `你是桌面机器人的确认追问员，负责在信息不足或动作有风险时向用户发起确认。`,
      cardName: `确认请求`,
      defaultTopic: `确认目标房间、目标物和是否允许机械臂靠近用户`,
      defaultStyle: `一次只问关键问题`,
      defaultInclude: `问题、默认安全动作、可接受回答`,
    },
  };
function Ht(e) {
  switch (e.simple.roleId) {
    case `weather`:
      return Ut(e.simple.weather);
    case `dresser`:
      return Wt(e.simple.dresser);
    case `travel`:
      return Gt(e.simple.travel);
    case `captain`:
      return Kt(e.simple.captain);
    default:
      return qt(e.simple.roleId, e.simple.generic);
  }
}
function Ut(e) {
  let t = [
    e.outputs.condition ? `房间或 POI 名称` : null,
    e.outputs.temperature ? `当前位置声明` : null,
    e.outputs.rain ? `物品位置` : null,
    e.outputs.wind ? `禁行区或通道提示` : null,
    e.outputs.airQuality ? `置信度或来源` : null,
  ].filter(Boolean);
  return [
    `# 家庭记忆员任务`,
    ``,
    `你是桌面机器人的家庭记忆员，负责维护家庭 POI、房间别名、禁行区和用户环境声明。`,
    ``,
    `任务：`,
    ``,
    `- 已知家庭线索：${e.city}。`,
    `- 记录时间范围：${e.date}。`,
    `- 家庭记忆员必须包含：${t.join(`、`) || `POI 和环境声明`}。`,
    `- 如果用户声明“这里是主卧”之类信息，请整理成可持久化 POI 记录。`,
    ``,
    `输出格式：`,
    ``,
    `家庭记忆员：<POI、房间别名、物品位置或待确认字段>`,
  ].join(`
`);
}
function Wt(e) {
  let t = [
    e.outputs.top ? `目标物` : null,
    e.outputs.bottom ? `动作序列` : null,
    e.outputs.shoes ? `速度/力度约束` : null,
    e.outputs.accessories ? `停止条件` : null,
  ].filter(Boolean);
  return [
    `# 机械臂操作员任务`,
    ``,
    `你是桌面机器人的机械臂操作员，负责把取、放、推、递等动作拆成机械臂可执行步骤。`,
    ``,
    `任务：`,
    ``,
    `- 操作目标：${e.activity}。`,
    `- 操作约束：${e.style}。`,
    `- 机械臂操作员必须包含：${t.join(`、`) || `动作、约束、停止条件`}。`,
    `- 如果缺少视觉事实或安全许可，请要求先确认，不要输出执行动作。`,
    ``,
    `输出格式：`,
    ``,
    `机械臂操作员：<机械臂动作、约束、停止条件或需要确认的问题>`,
  ].join(`
`);
}
function Gt(e) {
  let t = [
    e.outputs.umbrella ? `路线段` : null,
    e.outputs.waterBottle ? `速度限制` : null,
    e.outputs.sunProtection ? `避障策略` : null,
    e.outputs.safety ? `停止条件` : null,
  ].filter(Boolean);
  return [
    `# 底盘驾驶员任务`,
    ``,
    `你是桌面机器人的底盘驾驶员，负责执行轮式底盘移动。`,
    ``,
    `任务：`,
    ``,
    `- 目标地点：${e.destination}。`,
    `- 移动方式：${e.transport}。`,
    `- 底盘驾驶员必须包含：${t.join(`、`) || `动作序列、进度、停止条件`}。`,
    `- 如果缺少路线输入或安全许可，请停止并说明缺口。`,
    ``,
    `输出格式：`,
    ``,
    `底盘驾驶员：<底盘动作序列、进度、失败原因或停止条件>`,
  ].join(`
`);
}
function Kt(e) {
  let t = [
    e.outputs.weatherSummary ? `确认问题` : null,
    e.outputs.clothingSummary ? `执行提醒` : null,
    e.outputs.travelSummary ? `结果反馈` : null,
    e.outputs.checklist ? `错误说明` : null,
  ].filter(Boolean);
  return [
    `# 语音播报员任务`,
    ``,
    `你是桌面机器人的语音播报员，负责把确认、提醒、错误和结果转成适合扬声器播放的短句。`,
    ``,
    `任务：`,
    ``,
    `- 重点读取确认请求、任务规划员、底盘驾驶员、机械臂操作员或状态诊断。`,
    `- 输出一句到三句可直接朗读的话。`,
    `- 面向${e.audience}播报。`,
    `- 语气要求：${e.tone}。`,
    `- 语音播报员必须包含：${t.join(`、`) || `确认、提醒、结果`}。`,
    `- 对确认问题保持简短，一次只问关键问题。`,
    ``,
    `输出格式：`,
    ``,
    `语音播报员：<可朗读文本>`,
  ].join(`
`);
}
function qt(e, t) {
  let n = Vt[e];
  return [
    `# ${n.heading}`,
    ``,
    n.persona,
    ``,
    `任务：`,
    ``,
    `- 主题：${t.topic}。`,
    `- 面向：${t.audience}。`,
    `- 风格：${t.style}。`,
    `- 必须包含：${t.include}。`,
    `- 如果收到上游角色输入，请优先参考上游角色输入；如果信息不够，请说清楚还需要什么。`,
    ``,
    `输出格式：`,
    ``,
    `${n.cardName}：<你的结果>`,
  ].join(`
`);
}
function Jt(e) {
  switch (e) {
    case `dresser`:
      return Qt(`dresser`, { roleId: `dresser`, dresser: Rt });
    case `travel`:
      return Qt(`travel`, { roleId: `travel`, travel: zt });
    case `captain`:
      return Qt(`captain`, { roleId: `captain`, captain: Bt });
    case `navigator`:
    case `encyclopedia`:
    case `calculator`:
    case `translator`:
    case `storyteller`:
    case `poster`:
    case `checker`:
    case `summarizer`:
    case `questioner`:
      return Qt(e, { roleId: e, generic: Zt(e) });
    default:
      return Qt(`weather`, { roleId: `weather`, weather: Lt });
  }
}
function Yt(e) {
  return { ...e, markdown: Ht(e) };
}
function Xt(e) {
  switch (e.simple.roleId) {
    case `weather`:
      return { ...e, simple: { roleId: `weather`, weather: $t(e.markdown, e.simple.weather) } };
    case `dresser`:
      return { ...e, simple: { roleId: `dresser`, dresser: en(e.markdown, e.simple.dresser) } };
    case `travel`:
      return { ...e, simple: { roleId: `travel`, travel: tn(e.markdown, e.simple.travel) } };
    case `captain`:
      return { ...e, simple: { roleId: `captain`, captain: nn(e.markdown, e.simple.captain) } };
    default:
      return {
        ...e,
        simple: { roleId: e.simple.roleId, generic: rn(e.markdown, e.simple.generic) },
      };
  }
}
function Zt(e) {
  let t = Vt[e];
  return {
    topic: t.defaultTopic,
    audience: `小朋友`,
    style: t.defaultStyle,
    include: t.defaultInclude,
  };
}
function Qt(e, t) {
  return Yt({ roleId: e, mode: `simple`, simple: t, markdown: `` });
}
function $t(e, t) {
  let { city: n, date: r } = on(an(e, /查询(.+?)的天气[。.\n]/u), t.city, t.date),
    i = sn(e, `家庭记忆员必须包含`);
  return {
    city: n,
    date: r,
    outputs: {
      condition: cn(i, `天气情况`, t.outputs.condition),
      temperature: cn(i, `温度`, t.outputs.temperature),
      rain: cn(i, `是否下雨`, t.outputs.rain),
      wind: cn(i, `风力`, t.outputs.wind),
      airQuality: cn(i, `空气质量`, t.outputs.airQuality),
    },
  };
}
function en(e, t) {
  let n = sn(e, `机械臂操作员必须包含`);
  return {
    activity: an(e, /为“(.+?)”给出穿衣建议/u) ?? t.activity,
    style: an(e, /穿衣风格要偏向：(.+?)[。.\n]/u) ?? t.style,
    outputs: {
      top: cn(n, `上衣`, t.outputs.top),
      bottom: cn(n, `下装`, t.outputs.bottom),
      shoes: cn(n, `鞋子`, t.outputs.shoes),
      accessories: cn(n, `可选配件`, t.outputs.accessories),
    },
  };
}
function tn(e, t) {
  let n = sn(e, `底盘驾驶员必须包含`);
  return {
    destination: an(e, /为去“(.+?)”给出出行提醒/u) ?? t.destination,
    transport: an(e, /默认出行方式：(.+?)[。.\n]/u) ?? t.transport,
    outputs: {
      umbrella: cn(n, `是否带伞`, t.outputs.umbrella),
      waterBottle: cn(n, `水杯`, t.outputs.waterBottle),
      sunProtection: cn(n, `防晒或防风`, t.outputs.sunProtection),
      safety: cn(n, `安全提醒`, t.outputs.safety),
    },
  };
}
function nn(e, t) {
  let n = sn(e, `广播必须包含`);
  return {
    audience: an(e, /面向(.+?)进行广播/u) ?? t.audience,
    tone: an(e, /语气要求：(.+?)[。.\n]/u) ?? t.tone,
    outputs: {
      weatherSummary: cn(n, `天气摘要`, t.outputs.weatherSummary),
      clothingSummary: cn(n, `穿衣摘要`, t.outputs.clothingSummary),
      travelSummary: cn(n, `出行摘要`, t.outputs.travelSummary),
      checklist: cn(n, `最终准备清单`, t.outputs.checklist),
    },
  };
}
function rn(e, t) {
  return {
    topic: an(e, /主题：(.+?)[。.\n]/u) ?? t.topic,
    audience: an(e, /面向：(.+?)[。.\n]/u) ?? t.audience,
    style: an(e, /风格：(.+?)[。.\n]/u) ?? t.style,
    include: an(e, /必须包含：(.+?)[。.\n]/u) ?? t.include,
  };
}
function an(e, t) {
  return e.match(t)?.[1]?.trim() || null;
}
function on(e, t, n) {
  if (!e) return { city: t, date: n };
  let r = [`本周末`, `后天`, `明天`, `今天`].find((t) => e.endsWith(t));
  return r ? { city: e.slice(0, -r.length).trim() || t, date: r } : { city: e, date: n };
}
function sn(e, t) {
  let n = an(e, RegExp(`${ln(t)}：(.+?)[。.\\n]`, `u`));
  return n
    ? n
        .split(`、`)
        .map((e) => e.trim())
        .filter(Boolean)
    : null;
}
function cn(e, t, n) {
  return e ? e.includes(t) : n;
}
function ln(e) {
  return e.replace(/[.*+?^${}()|[\]\\]/g, `\\$&`);
}
function L({ checked: e, onChange: t, label: n, className: r = `` }) {
  return (0, h.jsxs)(`button`, {
    onClick: t,
    className: `flex items-center justify-between w-full py-6 px-10 bg-transparent border-none rounded-none cursor-pointer text-left hover:bg-btn-bg ${r}`,
    children: [
      (0, h.jsx)(`span`, { children: n }),
      (0, h.jsx)(`span`, {
        className: `w-14 h-14 border-2 border-white/50 rounded-none shrink-0 flex items-center justify-center text-2xs pl-1.5 pb-4 leading-none text-white ${e ? `bg-accent` : `bg-transparent`}`,
        children: e ? `x` : ``,
      }),
    ],
  });
}
function un({ roleId: e, config: t, onClose: n, onSave: r, onRunRole: i }) {
  let a = e ? kt(e) : void 0,
    [o, s] = (0, l.useState)(() => (e ? (t ?? Jt(e)) : Jt(`weather`)));
  if (
    ((0, l.useEffect)(() => {
      e && s(t ?? Jt(e));
    }, [t, e]),
    !e || !a)
  )
    return null;
  let c = (e) => (e.mode === `markdown` ? Xt(e) : Yt(e));
  return (0, h.jsx)(b, {
    isOpen: !0,
    onClose: n,
    title: a.name,
    className: `w-[min(760px,calc(100vw-32px))] max-h-[calc(100vh-40px)] overflow-y-auto`,
    zIndex: 70,
    children: (0, h.jsxs)(`div`, {
      className: `px-10 pb-10`,
      children: [
        (0, h.jsxs)(`div`, {
          className: `text-sm leading-tight text-text-muted mb-10`,
          children: [`我负责：`, a.responsibility],
        }),
        (0, h.jsxs)(`div`, {
          className: `flex gap-6 mb-12`,
          children: [
            (0, h.jsx)(y, {
              variant: o.mode === `simple` ? `active` : `default`,
              size: `sm`,
              onClick: () => s((e) => ({ ...Xt(e), mode: `simple` })),
              children: `简单模式`,
            }),
            (0, h.jsx)(y, {
              variant: o.mode === `markdown` ? `active` : `default`,
              size: `sm`,
              onClick: () => s((e) => ({ ...Yt(e), mode: `markdown` })),
              children: `Markdown 模式`,
            }),
          ],
        }),
        o.mode === `simple`
          ? (0, h.jsx)(dn, { draft: o, onChange: s })
          : (0, h.jsx)(`textarea`, {
              className: `w-full h-300 resize-none bg-bg-dark border-2 border-border text-text p-10 text-sm leading-snug outline-none focus:border-accent`,
              value: o.markdown,
              onChange: (e) => s((t) => ({ ...t, markdown: e.target.value })),
            }),
        (0, h.jsxs)(`div`, {
          className: `flex flex-wrap justify-end gap-6 mt-12`,
          children: [
            (0, h.jsx)(y, { variant: `default`, size: `md`, onClick: n, children: `取消` }),
            (0, h.jsx)(y, {
              variant: `default`,
              size: `md`,
              onClick: () => i(c(o)),
              children: `运行这个角色`,
            }),
            (0, h.jsx)(y, {
              variant: `accent`,
              size: `md`,
              onClick: () => {
                (r(c(o)), n());
              },
              children: `保存`,
            }),
          ],
        }),
      ],
    }),
  });
}
function dn({ draft: e, onChange: t }) {
  switch (e.simple.roleId) {
    case `weather`:
      return (0, h.jsx)(fn, {
        config: e.simple.weather,
        onChange: (n) => t({ ...e, simple: { roleId: `weather`, weather: n }, markdown: Ut(n) }),
      });
    case `dresser`:
      return (0, h.jsx)(pn, {
        config: e.simple.dresser,
        onChange: (n) => t({ ...e, simple: { roleId: `dresser`, dresser: n }, markdown: Wt(n) }),
      });
    case `travel`:
      return (0, h.jsx)(mn, {
        config: e.simple.travel,
        onChange: (n) => t({ ...e, simple: { roleId: `travel`, travel: n }, markdown: Gt(n) }),
      });
    case `captain`:
      return (0, h.jsx)(hn, {
        config: e.simple.captain,
        onChange: (n) => t({ ...e, simple: { roleId: `captain`, captain: n }, markdown: Kt(n) }),
      });
    default: {
      let n = e.simple.roleId;
      return (0, h.jsx)(gn, {
        roleId: n,
        config: e.simple.generic,
        onChange: (r) => t({ ...e, simple: { roleId: n, generic: r }, markdown: qt(n, r) }),
      });
    }
  }
}
function fn({ config: e, onChange: t }) {
  let n = (n) => t({ ...e, ...n }),
    r = (n) => t({ ...e, outputs: { ...e.outputs, [n]: !e.outputs[n] } });
  return (0, h.jsxs)(yn, {
    children: [
      (0, h.jsx)(_n, { label: `家庭线索`, value: e.city, onChange: (e) => n({ city: e }) }),
      (0, h.jsx)(vn, {
        label: `记录范围`,
        value: e.date,
        options: [`今天`, `本次对话`, `长期记忆`, `待确认`],
        onChange: (e) => n({ date: e }),
      }),
      (0, h.jsxs)(bn, {
        title: `家庭记忆员包含`,
        children: [
          (0, h.jsx)(L, {
            checked: e.outputs.condition,
            onChange: () => r(`condition`),
            label: `房间或 POI`,
          }),
          (0, h.jsx)(L, {
            checked: e.outputs.temperature,
            onChange: () => r(`temperature`),
            label: `当前位置`,
          }),
          (0, h.jsx)(L, { checked: e.outputs.rain, onChange: () => r(`rain`), label: `物品位置` }),
          (0, h.jsx)(L, { checked: e.outputs.wind, onChange: () => r(`wind`), label: `禁行区` }),
          (0, h.jsx)(L, {
            checked: e.outputs.airQuality,
            onChange: () => r(`airQuality`),
            label: `置信度`,
          }),
        ],
      }),
    ],
  });
}
function pn({ config: e, onChange: t }) {
  let n = (n) => t({ ...e, ...n }),
    r = (n) => t({ ...e, outputs: { ...e.outputs, [n]: !e.outputs[n] } });
  return (0, h.jsxs)(yn, {
    children: [
      (0, h.jsx)(_n, { label: `操作目标`, value: e.activity, onChange: (e) => n({ activity: e }) }),
      (0, h.jsx)(vn, {
        label: `操作约束`,
        value: e.style,
        options: [`低速、避开人手、确认抓取目标`, `只观察不抓取`, `轻力抓取`, `等待用户确认`],
        onChange: (e) => n({ style: e }),
      }),
      (0, h.jsxs)(bn, {
        title: `机械臂操作员包含`,
        children: [
          (0, h.jsx)(L, { checked: e.outputs.top, onChange: () => r(`top`), label: `目标物` }),
          (0, h.jsx)(L, {
            checked: e.outputs.bottom,
            onChange: () => r(`bottom`),
            label: `动作序列`,
          }),
          (0, h.jsx)(L, {
            checked: e.outputs.shoes,
            onChange: () => r(`shoes`),
            label: `速度/力度`,
          }),
          (0, h.jsx)(L, {
            checked: e.outputs.accessories,
            onChange: () => r(`accessories`),
            label: `停止条件`,
          }),
        ],
      }),
    ],
  });
}
function mn({ config: e, onChange: t }) {
  let n = (n) => t({ ...e, ...n }),
    r = (n) => t({ ...e, outputs: { ...e.outputs, [n]: !e.outputs[n] } });
  return (0, h.jsxs)(yn, {
    children: [
      (0, h.jsx)(_n, {
        label: `目标地点`,
        value: e.destination,
        onChange: (e) => n({ destination: e }),
      }),
      (0, h.jsx)(vn, {
        label: `移动方式`,
        value: e.transport,
        options: [`轮式底盘低速移动`, `原地转向`, `贴边慢行`, `停止等待`],
        onChange: (e) => n({ transport: e }),
      }),
      (0, h.jsxs)(bn, {
        title: `底盘驾驶员包含`,
        children: [
          (0, h.jsx)(L, {
            checked: e.outputs.umbrella,
            onChange: () => r(`umbrella`),
            label: `路线段`,
          }),
          (0, h.jsx)(L, {
            checked: e.outputs.waterBottle,
            onChange: () => r(`waterBottle`),
            label: `速度限制`,
          }),
          (0, h.jsx)(L, {
            checked: e.outputs.sunProtection,
            onChange: () => r(`sunProtection`),
            label: `避障策略`,
          }),
          (0, h.jsx)(L, {
            checked: e.outputs.safety,
            onChange: () => r(`safety`),
            label: `停止条件`,
          }),
        ],
      }),
    ],
  });
}
function hn({ config: e, onChange: t }) {
  let n = (n) => t({ ...e, ...n }),
    r = (n) => t({ ...e, outputs: { ...e.outputs, [n]: !e.outputs[n] } });
  return (0, h.jsxs)(yn, {
    children: [
      (0, h.jsx)(_n, { label: `播报对象`, value: e.audience, onChange: (e) => n({ audience: e }) }),
      (0, h.jsx)(vn, {
        label: `播报语气`,
        value: e.tone,
        options: [`简短、明确、可确认`, `温和提醒`, `错误说明`, `等待确认`],
        onChange: (e) => n({ tone: e }),
      }),
      (0, h.jsxs)(bn, {
        title: `语音播报员包含`,
        children: [
          (0, h.jsx)(L, {
            checked: e.outputs.weatherSummary,
            onChange: () => r(`weatherSummary`),
            label: `确认问题`,
          }),
          (0, h.jsx)(L, {
            checked: e.outputs.clothingSummary,
            onChange: () => r(`clothingSummary`),
            label: `执行提醒`,
          }),
          (0, h.jsx)(L, {
            checked: e.outputs.travelSummary,
            onChange: () => r(`travelSummary`),
            label: `结果反馈`,
          }),
          (0, h.jsx)(L, {
            checked: e.outputs.checklist,
            onChange: () => r(`checklist`),
            label: `错误说明`,
          }),
        ],
      }),
    ],
  });
}
function gn({ config: e, onChange: t }) {
  let n = (n) => t({ ...e, ...n });
  return (0, h.jsxs)(yn, {
    children: [
      (0, h.jsx)(_n, { label: `主题`, value: e.topic, onChange: (e) => n({ topic: e }) }),
      (0, h.jsx)(_n, { label: `面向谁`, value: e.audience, onChange: (e) => n({ audience: e }) }),
      (0, h.jsx)(_n, { label: `风格`, value: e.style, onChange: (e) => n({ style: e }) }),
      (0, h.jsx)(_n, { label: `包含内容`, value: e.include, onChange: (e) => n({ include: e }) }),
    ],
  });
}
function _n({ label: e, value: t, onChange: n }) {
  return (0, h.jsxs)(`label`, {
    className: `flex flex-col gap-4 text-sm leading-tight`,
    children: [
      e,
      (0, h.jsx)(`input`, {
        className: `bg-bg-dark border-2 border-border px-8 py-6 text-text outline-none focus:border-accent`,
        value: t,
        onChange: (e) => n(e.target.value),
      }),
    ],
  });
}
function vn({ label: e, value: t, options: n, onChange: r }) {
  return (0, h.jsxs)(`label`, {
    className: `flex flex-col gap-4 text-sm leading-tight`,
    children: [
      e,
      (0, h.jsx)(`select`, {
        className: `bg-bg-dark border-2 border-border px-8 py-6 text-text outline-none focus:border-accent`,
        value: t,
        onChange: (e) => r(e.target.value),
        children: n.map((e) => (0, h.jsx)(`option`, { value: e, children: e }, e)),
      }),
    ],
  });
}
function yn({ children: e }) {
  return (0, h.jsx)(`div`, {
    className: `grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-10`,
    children: e,
  });
}
function bn({ title: e, children: t }) {
  return (0, h.jsxs)(`div`, {
    className: `md:col-span-2 pixel-panel`,
    children: [
      (0, h.jsx)(`div`, {
        className: `px-10 py-6 text-sm leading-tight text-text-muted border-b border-border`,
        children: e,
      }),
      t,
    ],
  });
}
function xn({
  entries: e,
  isSettingsOpen: t,
  robotConnected: n = !1,
  robotStatusText: r = `Robot disconnected`,
  hasActiveRobotPlan: i = !1,
  hasPendingRobotConfirmation: a = !1,
  onToggleSettings: o,
  onSubmitInput: s,
  onRobotEmergencyStop: c,
  onConfirmRobotPlan: u,
  onCancelRobotPlan: d,
}) {
  let f = (0, l.useRef)(null),
    [p, m] = (0, l.useState)(``);
  (0, l.useEffect)(() => {
    let e = f.current;
    e && (e.scrollTop = e.scrollHeight);
  }, [e]);
  let g = () => {
    let e = p.trim();
    e && ((s?.(e) ?? !1) || w.send({ type: `consoleUserInput`, content: e }), m(``));
  };
  return (0, h.jsxs)(`section`, {
    className: `absolute right-0 top-0 bottom-0 z-[25] w-360 max-w-[42vw] bg-bg-dark border-l-2 border-border shadow-pixel flex flex-col`,
    children: [
      (0, h.jsxs)(`div`, {
        className: `h-32 px-12 flex items-center justify-between border-b-2 border-border bg-bg`,
        children: [
          (0, h.jsx)(`span`, { className: `text-sm text-text`, children: `Console` }),
          (0, h.jsxs)(`div`, {
            className: `flex items-center gap-8`,
            children: [
              (0, h.jsx)(`span`, {
                className: n ? `text-2xs text-status-success` : `text-2xs text-text-muted`,
                children: r,
              }),
              (0, h.jsx)(`button`, {
                type: `button`,
                className: `w-44 h-20 border-2 border-danger bg-danger text-white text-2xs leading-none cursor-pointer shadow-pixel disabled:opacity-50 disabled:cursor-default`,
                onClick: c,
                disabled: !n && !i,
                title: `Emergency stop`,
                'aria-label': `Emergency stop`,
                children: `急停`,
              }),
              (0, h.jsxs)(`button`, {
                type: `button`,
                className: `w-20 h-20 border-2 flex items-center justify-center text-sm leading-none cursor-pointer ${t ? `bg-active-bg border-accent text-text` : `bg-btn-bg border-transparent text-text-muted hover:bg-btn-hover hover:text-text`}`,
                onClick: o,
                title: `Settings`,
                'aria-label': `Settings`,
                children: [`⚙`, (0, h.jsx)(`span`, { className: `sr-only`, children: `Settings` })],
              }),
            ],
          }),
        ],
      }),
      (0, h.jsx)(`div`, {
        ref: f,
        className: `flex-1 overflow-y-auto px-12 py-8 text-2xs leading-tight`,
        children:
          e.length === 0
            ? (0, h.jsx)(`div`, {
                className: `text-text-muted`,
                children: `输入环境信息或控制命令，例如：这里是主卧、去主卧、说你好。`,
              })
            : e.map((e) =>
                (0, h.jsxs)(
                  `pre`,
                  {
                    className: `m-0 whitespace-pre-wrap break-words ${e.stream === `stderr` ? `text-status-error` : e.stream === `system` ? `text-status-success` : `text-text`}`,
                    children: [Sn(e.roleId), `：`, Cn(e.content)],
                  },
                  e.id,
                ),
              ),
      }),
      a &&
        (0, h.jsxs)(`div`, {
          className: `border-t-2 border-border bg-bg px-8 py-8 flex items-center gap-6`,
          children: [
            (0, h.jsx)(`span`, {
              className: `min-w-0 flex-1 text-2xs text-warning`,
              children: `高风险移动计划等待用户确认`,
            }),
            (0, h.jsx)(`button`, {
              type: `button`,
              className: `w-52 border-2 border-accent bg-accent text-white text-2xs leading-none cursor-pointer shadow-pixel`,
              onClick: u,
              children: `确认`,
            }),
            (0, h.jsx)(`button`, {
              type: `button`,
              className: `w-52 border-2 border-border bg-btn-bg text-text text-2xs leading-none cursor-pointer`,
              onClick: d,
              children: `取消`,
            }),
          ],
        }),
      (0, h.jsxs)(`form`, {
        className: `border-t-2 border-border bg-bg px-8 py-8 flex gap-6`,
        onSubmit: (e) => {
          (e.preventDefault(), g());
        },
        children: [
          (0, h.jsx)(`input`, {
            className: `min-w-0 flex-1 bg-bg-dark border-2 border-border px-8 py-6 text-xs text-text outline-none focus:border-accent`,
            value: p,
            onChange: (e) => m(e.target.value),
            placeholder: `用户输入 / 环境声明 / 确认回复`,
            'aria-label': `Console user input`,
          }),
          (0, h.jsx)(`button`, {
            type: `submit`,
            className: `w-56 border-2 border-accent bg-accent text-white text-xs leading-none cursor-pointer shadow-pixel disabled:opacity-50 disabled:cursor-default`,
            disabled: !p.trim(),
            title: `Send console input`,
            children: `发送`,
          }),
        ],
      }),
    ],
  });
}
function Sn(e) {
  return e === `user` ? `Console` : (kt(e)?.name ?? e);
}
function Cn(e) {
  return e.replace(/^\s*(?:[^：:\n]{1,16}卡|趣味广播)[：:]\s*/u, ``);
}
var wn = typeof window < `u` && window.__LIGHTORY_E2E === !0,
  Tn = !0,
  En = null;
function Dn(e) {
  !wn ||
    typeof window > `u` ||
    (window.__lightoryTestHooks || (window.__lightoryTestHooks = {}),
    window.__lightoryTestHooks.playedSounds || (window.__lightoryTestHooks.playedSounds = []),
    window.__lightoryTestHooks.playedSounds.push({ kind: e, at: Date.now() }));
}
function On(e) {
  Tn = e;
}
function kn() {
  return Tn;
}
function An(e, t, n, r = at, i = ot) {
  let a = e.currentTime + n,
    o = e.createOscillator(),
    s = e.createGain();
  ((o.type = `sine`),
    o.frequency.setValueAtTime(t, a),
    s.gain.setValueAtTime(i, a),
    s.gain.exponentialRampToValueAtTime(0.001, a + r),
    o.connect(s),
    s.connect(e.destination),
    o.start(a),
    o.stop(a + r));
}
async function jn() {
  if ((Dn(`done`), Tn))
    try {
      ((En ||= new AudioContext()),
        En.state === `suspended` && (await En.resume()),
        An(En, nt, 0),
        An(En, rt, it));
    } catch {}
}
async function Mn() {
  if ((Dn(`permission`), Tn))
    try {
      ((En ||= new AudioContext()),
        En.state === `suspended` && (await En.resume()),
        An(En, 880, 0, lt, ut),
        An(En, st, ct, lt, ut));
    } catch {}
}
function Nn() {
  try {
    ((En ||= new AudioContext()), En.state === `suspended` && En.resume());
  } catch {}
}
function Pn({ onClick: e, children: t, right: n, className: r = `` }) {
  return (0, h.jsxs)(`button`, {
    onClick: e,
    className: `flex items-center justify-between w-full py-6 px-10 bg-transparent border-none rounded-none cursor-pointer text-left hover:bg-btn-bg ${r}`,
    children: [(0, h.jsx)(`span`, { children: t }), n],
  });
}
function Fn({
  isOpen: e,
  onClose: t,
  isDebugMode: n,
  onToggleDebugMode: r,
  alwaysShowOverlay: i,
  onToggleAlwaysShowOverlay: a,
  showRoleVisualizer: o,
  onToggleRoleVisualizer: s,
  externalAssetDirectories: c,
  watchAllSessions: u,
  onToggleWatchAllSessions: d,
  hooksEnabled: f,
  onToggleHooksEnabled: p,
  robotConfig: m,
  robotConnected: g,
  robotStatusText: _,
  robotTools: v,
  onRobotConfigChange: x,
}) {
  let [S, C] = (0, l.useState)(kn),
    [T, E] = (0, l.useState)(m);
  return (
    (0, l.useEffect)(() => {
      e && E(m);
    }, [e, m]),
    (0, h.jsxs)(b, {
      isOpen: e,
      onClose: t,
      title: `Settings`,
      children: [
        (0, h.jsx)(Pn, {
          onClick: () => {
            (w.send({ type: `openSessionsFolder` }), t());
          },
          children: `Open Sessions Folder`,
        }),
        (0, h.jsx)(Pn, {
          onClick: () => {
            (w.send({ type: `exportLayout` }), t());
          },
          children: `Export Layout`,
        }),
        (0, h.jsx)(Pn, {
          onClick: () => {
            (w.send({ type: `importLayout` }), t());
          },
          children: `Import Layout`,
        }),
        (0, h.jsx)(Pn, {
          onClick: () => {
            (w.send({ type: `addExternalAssetDirectory` }), t());
          },
          children: `Add Asset Directory`,
        }),
        c.map((e) =>
          (0, h.jsxs)(
            `div`,
            {
              className: `flex items-center justify-between py-4 px-10 gap-8`,
              children: [
                (0, h.jsx)(`span`, {
                  className: `text-xs text-text-muted overflow-hidden text-ellipsis whitespace-nowrap`,
                  title: e,
                  children: e.split(/[/\\]/).pop() ?? e,
                }),
                (0, h.jsx)(y, {
                  variant: `ghost`,
                  size: `sm`,
                  onClick: () => w.send({ type: `removeExternalAssetDirectory`, path: e }),
                  className: `shrink-0`,
                  children: `x`,
                }),
              ],
            },
            e,
          ),
        ),
        (0, h.jsx)(L, {
          label: `Sound Notifications`,
          checked: S,
          onChange: () => {
            let e = !kn();
            (On(e), C(e), w.send({ type: `setSoundEnabled`, enabled: e }));
          },
        }),
        (0, h.jsx)(L, { label: `Watch All Sessions`, checked: u, onChange: d }),
        (0, h.jsx)(L, { label: `Instant Detection (Hooks)`, checked: f, onChange: p }),
        (0, h.jsx)(L, { label: `Always Show Labels`, checked: i, onChange: a }),
        (0, h.jsx)(L, { label: `Role Visualizer`, checked: o, onChange: s }),
        (0, h.jsx)(L, { label: `Debug View`, checked: n, onChange: r }),
        (0, h.jsxs)(`div`, {
          className: `mt-10 pt-8 border-t-2 border-border`,
          children: [
            (0, h.jsxs)(`div`, {
              className: `px-10 mb-6 flex items-center justify-between gap-8`,
              children: [
                (0, h.jsx)(`span`, { className: `text-sm text-text`, children: `Robot API` }),
                (0, h.jsx)(`span`, {
                  className: g ? `text-2xs text-status-success` : `text-2xs text-text-muted`,
                  children: _,
                }),
              ],
            }),
            (0, h.jsx)(L, {
              label: `Use Mock Robot`,
              checked: T.mode === `mock`,
              onChange: () => E((e) => ({ ...e, mode: e.mode === `mock` ? `real` : `mock` })),
            }),
            (0, h.jsxs)(`label`, {
              className: `block px-10 py-4 text-2xs text-text-muted`,
              children: [
                `Base URL`,
                (0, h.jsx)(`input`, {
                  className: `mt-2 w-full bg-bg-dark border-2 border-border px-6 py-4 text-xs text-text outline-none focus:border-accent`,
                  value: T.baseUrl,
                  onChange: (e) => E((t) => ({ ...t, baseUrl: e.target.value })),
                  disabled: T.mode === `mock`,
                }),
              ],
            }),
            (0, h.jsxs)(`label`, {
              className: `block px-10 py-4 text-2xs text-text-muted`,
              children: [
                `Token`,
                (0, h.jsx)(`input`, {
                  className: `mt-2 w-full bg-bg-dark border-2 border-border px-6 py-4 text-xs text-text outline-none focus:border-accent`,
                  value: T.token,
                  onChange: (e) => E((t) => ({ ...t, token: e.target.value })),
                  disabled: T.mode === `mock`,
                }),
              ],
            }),
            (0, h.jsxs)(`label`, {
              className: `block px-10 py-4 text-2xs text-text-muted`,
              children: [
                `Certificate Fingerprint`,
                (0, h.jsx)(`input`, {
                  className: `mt-2 w-full bg-bg-dark border-2 border-border px-6 py-4 text-xs text-text outline-none focus:border-accent`,
                  value: T.certificateFingerprint,
                  onChange: (e) => E((t) => ({ ...t, certificateFingerprint: e.target.value })),
                  disabled: T.mode === `mock`,
                }),
              ],
            }),
            (0, h.jsx)(`div`, {
              className: `px-10 py-4`,
              children: (0, h.jsx)(y, {
                size: `sm`,
                variant: `accent`,
                onClick: () => x(T),
                children: `Save Robot`,
              }),
            }),
            (0, h.jsx)(`div`, {
              className: `px-10 py-4 max-h-120 overflow-y-auto`,
              children:
                v.length === 0
                  ? (0, h.jsx)(`div`, {
                      className: `text-2xs text-text-muted`,
                      children: `No robot tools loaded.`,
                    })
                  : v.map((e) =>
                      (0, h.jsxs)(
                        `div`,
                        {
                          className: `py-2 border-b border-border/60`,
                          children: [
                            (0, h.jsx)(`div`, {
                              className: `text-2xs text-text`,
                              children: e.name,
                            }),
                            (0, h.jsxs)(`div`, {
                              className: `text-2xs text-text-muted`,
                              children: [
                                e.risk,
                                e.requiresConfirmation ? ` confirmation` : ``,
                                e.requiresLease ? ` lease:${e.requiresLease}` : ``,
                              ],
                            }),
                          ],
                        },
                        e.name,
                      ),
                    ),
            }),
          ],
        }),
      ],
    })
  );
}
var In = {
  'top-right': { top: 8, right: 52 },
  'top-left': { top: 8, left: 8 },
  'bottom-right': { bottom: 8, right: 52 },
  'bottom-left': { bottom: 8, left: 8 },
};
function Ln({ title: e, onDismiss: t, position: n = `top-right`, children: r }) {
  return (0, h.jsxs)(`div`, {
    className: `absolute z-20 pixel-panel whitespace-nowrap p-0`,
    style: In[n],
    children: [
      (0, h.jsxs)(`div`, {
        className: `flex items-center justify-between py-4 px-8 border-b border-border`,
        children: [
          (0, h.jsx)(`span`, { className: `text-base text-accent font-bold`, children: e }),
          (0, h.jsx)(`button`, {
            onClick: t,
            className: `bg-transparent border-none text-text-muted cursor-pointer text-sm px-2 leading-none`,
            children: `x`,
          }),
        ],
      }),
      (0, h.jsx)(`div`, { className: `py-6 px-8`, children: r }),
    ],
  });
}
function Rn({ currentVersion: e, lastSeenVersion: t, onDismiss: n, onOpenChangelog: r }) {
  let [i, a] = (0, l.useState)(!1),
    [o, s] = (0, l.useState)(!1),
    [c, u] = (0, l.useState)(!1),
    f = d(e),
    p = f !== t && !i;
  ((0, l.useEffect)(() => {
    if (!p || o) return;
    let e = setTimeout(() => s(!0), ft);
    return () => clearTimeout(e);
  }, [p, o]),
    (0, l.useEffect)(() => {
      if (!o) return;
      let e = setTimeout(() => {
        (a(!0), n());
      }, pt);
      return () => clearTimeout(e);
    }, [o, n]));
  let m = (0, l.useCallback)(
      (e) => {
        (e.stopPropagation(), a(!0), n());
      },
      [n],
    ),
    g = (0, l.useCallback)(() => {
      (a(!0), r());
    }, [r]);
  return e
    ? (0, h.jsxs)(h.Fragment, {
        children: [
          p &&
            (0, h.jsxs)(`div`, {
              onClick: g,
              className: `absolute bottom-232 right-28 z-20 pixel-panel px-10 pt-8 pb-9 cursor-pointer flex flex-col gap-8 max-w-2xs`,
              style: { opacity: +!o, transition: `opacity ${1e3 / 1e3}s ease-out` },
              children: [
                (0, h.jsxs)(`div`, {
                  className: `flex justify-between items-center gap-10`,
                  children: [
                    (0, h.jsxs)(`span`, {
                      className: `text-lg text-accent-bright leading-none`,
                      children: [`Updated to v`, f, `!`],
                    }),
                    (0, h.jsx)(y, {
                      variant: `ghost`,
                      size: `icon`,
                      onClick: m,
                      className: `leading-none`,
                      children: `x`,
                    }),
                  ],
                }),
                (0, h.jsx)(`span`, {
                  className: `text-sm whitespace-nowrap`,
                  children: `See what's new`,
                }),
              ],
            }),
          !p &&
            c &&
            (0, h.jsx)(`div`, {
              onClick: g,
              className: `absolute bottom-232 right-28 z-20 pixel-panel py-6 px-12 cursor-pointer text-sm whitespace-nowrap`,
              children: `See what's new!`,
            }),
          (0, h.jsxs)(`div`, {
            onMouseEnter: () => u(!0),
            onMouseLeave: () => u(!1),
            onClick: g,
            className: `absolute bottom-198 right-28 z-20 text-lg cursor-pointer select-none pr-2 transition-opacity duration-200`,
            style: { opacity: c ? 0.8 : 0.4 },
            children: [`v`, f],
          }),
        ],
      })
    : null;
}
function zn({ zoom: e, onZoomChange: t }) {
  let [n, r] = (0, l.useState)(!1),
    [i, a] = (0, l.useState)(!1),
    o = (0, l.useRef)(null),
    s = (0, l.useRef)(null),
    c = (0, l.useRef)(e),
    u = e <= 1,
    d = e >= 10;
  return (
    (0, l.useEffect)(() => {
      if (e !== c.current)
        return (
          (c.current = e),
          o.current && clearTimeout(o.current),
          s.current && clearTimeout(s.current),
          r(!0),
          a(!1),
          (s.current = setTimeout(() => {
            a(!0);
          }, Xe)),
          (o.current = setTimeout(() => {
            (r(!1), a(!1));
          }, Ze)),
          () => {
            (o.current && clearTimeout(o.current), s.current && clearTimeout(s.current));
          }
        );
    }, [e]),
    (0, h.jsxs)(h.Fragment, {
      children: [
        n &&
          (0, h.jsxs)(`div`, {
            className: `absolute top-10 left-1/2 -translate-x-1/2 z-10 pixel-panel pb-4 px-16 text-lg select-none pointer-events-none`,
            style: { opacity: +!i, transition: `opacity 0.5s ease-out` },
            children: [e, `x`],
          }),
        (0, h.jsxs)(`div`, {
          className: `absolute top-8 left-8 z-10 flex flex-col gap-4`,
          children: [
            (0, h.jsx)(y, {
              size: `icon_lg`,
              onClick: () => t(e + 1),
              disabled: d,
              className: `border-border! shadow-pixel disabled:hover:bg-btn-bg disabled:cursor-default disabled:opacity-(--btn-disabled-opacity)`,
              title: `Zoom in (Ctrl+Scroll)`,
              children: (0, h.jsxs)(`svg`, {
                width: `18`,
                height: `18`,
                viewBox: `0 0 18 18`,
                fill: `none`,
                children: [
                  (0, h.jsx)(`line`, {
                    x1: `9`,
                    y1: `3`,
                    x2: `9`,
                    y2: `15`,
                    stroke: `currentColor`,
                    strokeWidth: `2`,
                    strokeLinecap: `round`,
                  }),
                  (0, h.jsx)(`line`, {
                    x1: `3`,
                    y1: `9`,
                    x2: `15`,
                    y2: `9`,
                    stroke: `currentColor`,
                    strokeWidth: `2`,
                    strokeLinecap: `round`,
                  }),
                ],
              }),
            }),
            (0, h.jsx)(y, {
              size: `icon_lg`,
              onClick: () => t(e - 1),
              disabled: u,
              className: `border-border! shadow-pixel disabled:hover:bg-btn-bg disabled:cursor-default disabled:opacity-(--btn-disabled-opacity)`,
              title: `Zoom out (Ctrl+Scroll)`,
              children: (0, h.jsx)(`svg`, {
                width: `18`,
                height: `18`,
                viewBox: `0 0 18 18`,
                fill: `none`,
                children: (0, h.jsx)(`line`, {
                  x1: `3`,
                  y1: `9`,
                  x2: `15`,
                  y2: `9`,
                  stroke: `currentColor`,
                  strokeWidth: `2`,
                  strokeLinecap: `round`,
                }),
              }),
            }),
          ],
        }),
      ],
    })
  );
}
var Bn = new Map(),
  Vn = new Map(),
  Hn = new Map(),
  Un = new Map(),
  Wn = new Map(),
  Gn = null,
  Kn = null,
  qn = null;
function Jn(e) {
  if (!e?.catalog || !e?.sprites) return !1;
  let t = e.catalog
    .map((t) => {
      let n = e.sprites[t.id];
      return n
        ? {
            type: t.id,
            label: t.label,
            footprintW: t.footprintW,
            footprintH: t.footprintH,
            sprite: n,
            isDesk: t.isDesk,
            category: t.category,
            ...(t.orientation ? { orientation: t.orientation } : {}),
            ...(t.canPlaceOnSurfaces ? { canPlaceOnSurfaces: !0 } : {}),
            ...(t.backgroundTiles ? { backgroundTiles: t.backgroundTiles } : {}),
            ...(t.canPlaceOnWalls ? { canPlaceOnWalls: !0 } : {}),
            ...(t.mirrorSide ? { mirrorSide: !0 } : {}),
          }
        : (console.warn(`No sprite data for asset ${t.id}`), null);
    })
    .filter((e) => e !== null);
  for (let n of e.catalog)
    if (n.mirrorSide && n.orientation === `side`) {
      let e = t.find((e) => e.type === n.id);
      e && t.push({ ...e, type: `${n.id}:left`, orientation: `left`, mirrorSide: !0 });
    }
  if (t.length === 0) return !1;
  (Bn.clear(), Vn.clear(), Hn.clear(), Un.clear(), Wn.clear());
  let n = new Map();
  for (let t of e.catalog)
    if (t.groupId && t.orientation) {
      if (t.state && t.state !== `off`) continue;
      let e = n.get(t.groupId);
      (e || ((e = new Map()), n.set(t.groupId, e)),
        t.orientation === `side`
          ? (e.set(`right`, t.id), t.mirrorSide && e.set(`left`, `${t.id}:left`))
          : e.set(t.orientation, t.id));
    }
  let r = new Map();
  for (let t of e.catalog) t.groupId && t.rotationScheme && r.set(t.groupId, t.rotationScheme);
  let i = new Set(),
    a = [`front`, `right`, `back`, `left`];
  for (let [e, t] of n) {
    if (t.size < 2) continue;
    let n = r.get(e),
      o = a;
    n === `2-way` && (o = [`front`, `right`]);
    let s = o.filter((e) => t.has(e));
    if (s.length < 2) continue;
    let c = {};
    for (let e of s) c[e] = t.get(e);
    let l = { orientations: s, members: c },
      u = new Set();
    for (let e of Object.values(c)) u.has(e) || (Bn.set(e, l), u.add(e));
    for (let [e, t] of Object.entries(c)) e !== `front` && i.add(t);
  }
  let o = new Map();
  for (let t of e.catalog)
    if (t.groupId && t.state) {
      let e = `${t.groupId}|${t.orientation || ``}`,
        n = o.get(e);
      if (
        (n || ((n = new Map()), o.set(e, n)), t.animationGroup && t.frame !== void 0 && t.frame > 0)
      )
        continue;
      n.set(t.state, t.id);
    }
  for (let e of o.values()) {
    let t = e.get(`on`),
      n = e.get(`off`);
    t && n && (Vn.set(t, n), Vn.set(n, t), Hn.set(n, t), Un.set(t, n));
  }
  for (let t of e.catalog)
    if (t.groupId && t.orientation && t.state === `on`) {
      if (t.animationGroup && t.frame !== void 0 && t.frame > 0) continue;
      let e = Vn.get(t.id);
      if (e) {
        let t = Bn.get(e);
        if (t) {
          let e = {};
          for (let n of t.orientations) {
            let r = t.members[n];
            e[n] = Vn.get(r) ?? r;
          }
          let n = { orientations: t.orientations, members: e };
          for (let t of Object.values(e)) Bn.has(t) || Bn.set(t, n);
        }
      }
    }
  let s = new Map();
  for (let t of e.catalog)
    if (t.animationGroup && t.frame !== void 0) {
      let e = s.get(t.animationGroup);
      (e || ((e = []), s.set(t.animationGroup, e)), e.push({ id: t.id, frame: t.frame }));
    }
  for (let [e, t] of s)
    (t.sort((e, t) => e.frame - t.frame),
      Wn.set(
        e,
        t.map((e) => e.id),
      ));
  let c = new Set();
  for (let t of e.catalog) t.state === `on` && c.add(t.id);
  Gn = t;
  let l = t.filter((e) => !i.has(e.type) && !c.has(e.type));
  for (let e of l)
    (Bn.has(e.type) || Vn.has(e.type)) &&
      (e.label = e.label
        .replace(/ - Front - Off$/, ``)
        .replace(/ - Front$/, ``)
        .replace(/ - Off$/, ``));
  ((Kn = l),
    (qn = Array.from(new Set(l.map((e) => e.category)))
      .filter((e) => !!e)
      .sort()));
  let u = new Set(Array.from(Bn.values())).size,
    d = Wn.size;
  return (
    console.log(
      `✓ Built dynamic catalog with ${t.length} assets (${l.length} visible, ${u} rotation groups, ${Vn.size / 2} state pairs, ${d} animation groups)`,
    ),
    !0
  );
}
function Yn(e) {
  return Gn ? Gn.find((t) => t.type === e) : Kn?.find((t) => t.type === e);
}
function Xn(e) {
  return (Kn ?? []).filter((t) => t.category === e);
}
function Zn() {
  let e = qn ?? [];
  return Qn.filter((t) => e.includes(t.id));
}
var Qn = [
  { id: `desks`, label: `Desks` },
  { id: `chairs`, label: `Chairs` },
  { id: `storage`, label: `Storage` },
  { id: `electronics`, label: `Tech` },
  { id: `decor`, label: `Decor` },
  { id: `wall`, label: `Wall` },
  { id: `misc`, label: `Misc` },
];
function $n(e, t) {
  let n = Bn.get(e);
  if (!n) return null;
  let r = n.orientations.map((e) => n.members[e]),
    i = r.indexOf(e);
  return i === -1 ? null : r[(i + (t === `cw` ? 1 : -1) + r.length) % r.length];
}
function er(e) {
  return Vn.get(e) ?? null;
}
function tr(e) {
  return Hn.get(e) ?? e;
}
function nr(e) {
  return Bn.has(e);
}
function rr(e) {
  for (let [, t] of Wn) if (t.includes(e)) return t;
  return null;
}
function ir(e) {
  let t = Bn.get(e);
  if (t) {
    for (let [n, r] of Object.entries(t.members)) if (r === e) return n;
  }
}
var ar = new Map();
function or(e, t, n) {
  let r = ar.get(e);
  if (r) return r;
  let i = n.colorize ? cr(t, n) : mr(t, n);
  return (ar.set(e, i), i);
}
function sr() {
  ar.clear();
}
function cr(e, t) {
  let { h: n, s: r, b: i, c: a } = t,
    o = [];
  for (let t of e) {
    let e = [];
    for (let o of t) {
      if (o === ``) {
        e.push(``);
        continue;
      }
      let t = parseInt(o.slice(1, 3), 16),
        s = parseInt(o.slice(3, 5), 16),
        c = parseInt(o.slice(5, 7), 16),
        l = (0.299 * t + 0.587 * s + 0.114 * c) / 255;
      if (a !== 0) {
        let e = (100 + a) / 100;
        l = 0.5 + (l - 0.5) * e;
      }
      (i !== 0 && (l += i / 200), (l = Math.max(0, Math.min(1, l))));
      let u = lr(o),
        d = dr(n, r / 100, l);
      e.push(ur(d, u));
    }
    o.push(e);
  }
  return o;
}
function lr(e) {
  return e.length > 7 ? parseInt(e.slice(7, 9), 16) : 255;
}
function ur(e, t) {
  return t >= 255 ? e : `${e}${t.toString(16).padStart(2, `0`).toUpperCase()}`;
}
function dr(e, t, n) {
  let r = (1 - Math.abs(2 * n - 1)) * t,
    i = e / 60,
    a = r * (1 - Math.abs((i % 2) - 1)),
    o = 0,
    s = 0,
    c = 0;
  i < 1
    ? ((o = r), (s = a), (c = 0))
    : i < 2
      ? ((o = a), (s = r), (c = 0))
      : i < 3
        ? ((o = 0), (s = r), (c = a))
        : i < 4
          ? ((o = 0), (s = a), (c = r))
          : i < 5
            ? ((o = a), (s = 0), (c = r))
            : ((o = r), (s = 0), (c = a));
  let l = n - r / 2,
    u = Math.round((o + l) * 255),
    d = Math.round((s + l) * 255),
    f = Math.round((c + l) * 255);
  return `#${fr(u).toString(16).padStart(2, `0`)}${fr(d).toString(16).padStart(2, `0`)}${fr(f).toString(16).padStart(2, `0`)}`.toUpperCase();
}
function fr(e) {
  return Math.max(0, Math.min(255, e));
}
function pr(e, t, n) {
  let r = e / 255,
    i = t / 255,
    a = n / 255,
    o = Math.max(r, i, a),
    s = Math.min(r, i, a),
    c = (o + s) / 2;
  if (o === s) return [0, 0, c];
  let l = o - s,
    u = c > 0.5 ? l / (2 - o - s) : l / (o + s),
    d = 0;
  return (
    (d =
      o === r
        ? ((i - a) / l + (i < a ? 6 : 0)) * 60
        : o === i
          ? ((a - r) / l + 2) * 60
          : ((r - i) / l + 4) * 60),
    [d, u, c]
  );
}
function mr(e, t) {
  let { h: n, s: r, b: i, c: a } = t,
    o = [];
  for (let t of e) {
    let e = [];
    for (let o of t) {
      if (o === ``) {
        e.push(``);
        continue;
      }
      let t = parseInt(o.slice(1, 3), 16),
        s = parseInt(o.slice(3, 5), 16),
        c = parseInt(o.slice(5, 7), 16),
        l = lr(o),
        [u, d, f] = pr(t, s, c),
        p = (((u + n) % 360) + 360) % 360,
        m = Math.max(0, Math.min(1, d + r / 100)),
        h = f;
      if (a !== 0) {
        let e = (100 + a) / 100;
        h = 0.5 + (h - 0.5) * e;
      }
      (i !== 0 && (h += i / 200), (h = Math.max(0, Math.min(1, h))));
      let g = dr(p, m, h);
      e.push(ur(g, l));
    }
    o.push(e);
  }
  return o;
}
function hr(e) {
  let t = [];
  for (let n = 0; n < e.rows; n++) {
    let r = [];
    for (let t = 0; t < e.cols; t++) r.push(e.tiles[n * e.cols + t]);
    t.push(r);
  }
  return t;
}
function gr(e) {
  let t = new Map();
  for (let n of e) {
    let e = Yn(n.type);
    if (!e || !e.isDesk) continue;
    let r = n.row * 16 + e.sprite.length;
    for (let i = 0; i < e.footprintH; i++)
      for (let a = 0; a < e.footprintW; a++) {
        let e = `${n.col + a},${n.row + i}`,
          o = t.get(e);
        (o === void 0 || r > o) && t.set(e, r);
      }
  }
  let n = [];
  for (let r of e) {
    let e = Yn(r.type);
    if (!e) continue;
    let i = r.col * 16,
      a = r.row * 16,
      o = a + e.sprite.length;
    if (
      (e.category === `chairs` &&
        (o = e.orientation === `back` ? (r.row + e.footprintH) * 16 + 1 : (r.row + 1) * 16),
      e.canPlaceOnSurfaces)
    )
      for (let n = 0; n < e.footprintH; n++)
        for (let i = 0; i < e.footprintW; i++) {
          let e = t.get(`${r.col + i},${r.row + n}`);
          e !== void 0 && e + 0.5 > o && (o = e + 0.5);
        }
    let s = e.sprite;
    if (r.color) {
      let { h: t, s: n, b: i, c: a } = r.color;
      s = or(`furn-${r.type}-${t}-${n}-${i}-${a}-${+!!r.color.colorize}`, e.sprite, r.color);
    }
    let c = !1;
    (e.mirrorSide && ir(r.type) === `left` && (c = !0),
      n.push({ sprite: s, x: i, y: a, zY: o, ...(c ? { mirrored: !0 } : {}) }));
  }
  return n;
}
function _r(e, t) {
  let n = new Set();
  for (let r of e) {
    let e = Yn(r.type);
    if (!e) continue;
    let i = e.backgroundTiles || 0;
    for (let a = 0; a < e.footprintH; a++)
      if (!(a < i))
        for (let i = 0; i < e.footprintW; i++) {
          let e = `${r.col + i},${r.row + a}`;
          (t && t.has(e)) || n.add(e);
        }
  }
  return n;
}
function vr(e, t) {
  let n = new Set();
  for (let r of e) {
    if (r.uid === t) continue;
    let e = Yn(r.type);
    if (!e) continue;
    let i = e.backgroundTiles || 0;
    for (let t = 0; t < e.footprintH; t++)
      if (!(t < i)) for (let i = 0; i < e.footprintW; i++) n.add(`${r.col + i},${r.row + t}`);
  }
  return n;
}
function yr(e) {
  switch (e) {
    case `front`:
      return F.DOWN;
    case `back`:
      return F.UP;
    case `left`:
      return F.LEFT;
    case `right`:
    case `side`:
      return F.RIGHT;
    default:
      return F.DOWN;
  }
}
function br(e) {
  let t = new Map(),
    n = new Set();
  for (let t of e) {
    let e = Yn(t.type);
    if (!(!e || !e.isDesk))
      for (let r = 0; r < e.footprintH; r++)
        for (let i = 0; i < e.footprintW; i++) n.add(`${t.col + i},${t.row + r}`);
  }
  let r = [
    { dc: 0, dr: -1, facing: F.UP },
    { dc: 0, dr: 1, facing: F.DOWN },
    { dc: -1, dr: 0, facing: F.LEFT },
    { dc: 1, dr: 0, facing: F.RIGHT },
  ];
  for (let i of e) {
    let e = Yn(i.type);
    if (!e || e.category !== `chairs`) continue;
    let a = 0,
      o = e.backgroundTiles ?? 0;
    for (let s = o; s < e.footprintH; s++)
      for (let o = 0; o < e.footprintW; o++) {
        let c = i.col + o,
          l = i.row + s,
          u = F.DOWN;
        if (e.orientation) u = yr(e.orientation);
        else
          for (let e of r)
            if (n.has(`${c + e.dc},${l + e.dr}`)) {
              u = e.facing;
              break;
            }
        let d = a === 0 ? i.uid : `${i.uid}:${a}`;
        (t.set(d, { uid: d, seatCol: c, seatRow: l, facingDir: u, assigned: !1 }), a++);
      }
  }
  return t;
}
var xr = { h: 35, s: 30, b: 15, c: 0 },
  Sr = { h: 25, s: 45, b: 5, c: 10 };
function Cr() {
  let e = N.WALL,
    t = N.FLOOR_1,
    n = N.FLOOR_2,
    r = [],
    i = [];
  for (let a = 0; a < 11; a++)
    for (let o = 0; o < 20; o++)
      a === 0 || a === 10 || o === 0 || o === 19
        ? (r.push(e), i.push(null))
        : o < 10
          ? (r.push(t), i.push(xr))
          : (r.push(n), i.push(Sr));
  return { version: 1, cols: 20, rows: 11, tiles: r, tileColors: i, furniture: [] };
}
var wr = {
  desk: `DESK_FRONT`,
  chair: `WOODEN_CHAIR_FRONT`,
  bookshelf: `BOOKSHELF`,
  plant: `PLANT`,
  cooler: null,
  whiteboard: `WHITEBOARD`,
  pc: `PC_FRONT_OFF`,
  lamp: null,
};
function Tr(e) {
  let t = [];
  for (let n of e) {
    let e = wr[n.type];
    e === void 0 ? t.push(n) : e !== null && t.push({ ...n, type: e });
  }
  return t;
}
function Er(e) {
  return Dr(e);
}
function Dr(e) {
  if (
    ((e = { ...e, furniture: Tr(e.furniture) }),
    !e.layoutRevision &&
      e.tiles.includes(8) &&
      (e = { ...e, tiles: e.tiles.map((e) => (e === 8 ? N.VOID : e)) }),
    e.pets || (e = { ...e, pets: [] }),
    e.tileColors && e.tileColors.length === e.tiles.length)
  )
    return e;
  let t = [];
  for (let n of e.tiles)
    switch (n) {
      case 0:
        t.push(null);
        break;
      case 1:
        t.push(xr);
        break;
      case 2:
        t.push(Sr);
        break;
      case 3:
        t.push({ h: 280, s: 40, b: -5, c: 0 });
        break;
      case 4:
        t.push({ h: 35, s: 25, b: 10, c: 0 });
        break;
      default:
        t.push(n > 0 && n !== N.VOID ? { h: 0, s: 0, b: 0, c: 0 } : null);
    }
  return { ...e, tileColors: t };
}
function Or(e, t, n, r, i) {
  let a = n * e.cols + t;
  if (a < 0 || a >= e.tiles.length) return e;
  let o = e.tileColors || Array(e.tiles.length).fill(null),
    s = i ?? (r === N.WALL || r === N.VOID ? null : { ...tt });
  if (e.tiles[a] === r) {
    let t = o[a];
    if (
      (s === null && t === null) ||
      (s &&
        t &&
        s.h === t.h &&
        s.s === t.s &&
        s.b === t.b &&
        s.c === t.c &&
        !!s.colorize == !!t.colorize)
    )
      return e;
  }
  let c = [...e.tiles];
  c[a] = r;
  let l = [...o];
  return ((l[a] = s), { ...e, tiles: c, tileColors: l });
}
function kr(e, t) {
  return Fr(e, t.type, t.col, t.row) ? { ...e, furniture: [...e.furniture, t] } : e;
}
function Ar(e, t) {
  let n = e.furniture.filter((e) => e.uid !== t);
  return n.length === e.furniture.length ? e : { ...e, furniture: n };
}
function jr(e, t, n, r) {
  let i = e.furniture.find((e) => e.uid === t);
  return !i || !Fr(e, i.type, n, r, t)
    ? e
    : { ...e, furniture: e.furniture.map((e) => (e.uid === t ? { ...e, col: n, row: r } : e)) };
}
function Mr(e, t, n) {
  let r = e.furniture.find((e) => e.uid === t);
  if (!r) return e;
  let i = $n(r.type, n);
  return i ? { ...e, furniture: e.furniture.map((e) => (e.uid === t ? { ...e, type: i } : e)) } : e;
}
function Nr(e, t) {
  let n = e.furniture.find((e) => e.uid === t);
  if (!n) return e;
  let r = er(n.type);
  return r ? { ...e, furniture: e.furniture.map((e) => (e.uid === t ? { ...e, type: r } : e)) } : e;
}
function Pr(e, t) {
  let n = Yn(e);
  return n?.canPlaceOnWalls ? t - (n.footprintH - 1) : t;
}
function Fr(e, t, n, r, i) {
  let a = Yn(t);
  if (!a) return !1;
  if (a.canPlaceOnWalls) {
    let t = r + a.footprintH - 1;
    if (n < 0 || n + a.footprintW > e.cols || t < 0 || t >= e.rows) return !1;
  } else if (n < 0 || r < 0 || n + a.footprintW > e.cols || r + a.footprintH > e.rows) return !1;
  let o = a.backgroundTiles || 0;
  for (let t = 0; t < a.footprintH; t++)
    if (!(t < o) && !(r + t < 0) && !(a.canPlaceOnWalls && t < a.footprintH - 1))
      for (let i = 0; i < a.footprintW; i++) {
        let o = (r + t) * e.cols + (n + i),
          s = e.tiles[o];
        if (a.canPlaceOnWalls) {
          if (s !== N.WALL) return !1;
        } else if (s === N.VOID || s === N.WALL) return !1;
      }
  let s = vr(e.furniture, i),
    c = null;
  if (a.canPlaceOnSurfaces) {
    c = new Set();
    for (let t of e.furniture) {
      if (t.uid === i) continue;
      let e = Yn(t.type);
      if (!(!e || !e.isDesk))
        for (let n = 0; n < e.footprintH; n++)
          for (let r = 0; r < e.footprintW; r++) c.add(`${t.col + r},${t.row + n}`);
    }
  }
  let l = a.backgroundTiles || 0;
  for (let e = 0; e < a.footprintH; e++)
    if (!(e < l) && !(r + e < 0))
      for (let t = 0; t < a.footprintW; t++) {
        let i = `${n + t},${r + e}`;
        if (s.has(i) && !c?.has(i)) return !1;
      }
  return !0;
}
function Ir(e, t) {
  let { cols: n, rows: r, tiles: i, furniture: a, tileColors: o } = e,
    s = o || Array(i.length).fill(null),
    c = n,
    l = r,
    u = 0,
    d = 0;
  if (
    (t === `right`
      ? (c = n + 1)
      : t === `left`
        ? ((c = n + 1), (u = 1))
        : t === `down`
          ? (l = r + 1)
          : t === `up` && ((l = r + 1), (d = 1)),
    c > 64 || l > 64)
  )
    return null;
  let f = Array(c * l).fill(N.VOID),
    p = Array(c * l).fill(null);
  for (let e = 0; e < r; e++)
    for (let t = 0; t < n; t++) {
      let r = e * n + t,
        a = (e + d) * c + (t + u);
      ((f[a] = i[r]), (p[a] = s[r]));
    }
  let m = a.map((e) => ({ ...e, col: e.col + u, row: e.row + d }));
  return {
    layout: { ...e, cols: c, rows: l, tiles: f, tileColors: p, furniture: m },
    shift: { col: u, row: d },
  };
}
var Lr = {
  Reading: `Read`,
  Searching: `Grep`,
  Globbing: `Glob`,
  Fetching: `WebFetch`,
  'Searching web': `WebSearch`,
  Writing: `Write`,
  Editing: `Edit`,
  Running: `Bash`,
  Task: `Task`,
};
function Rr(e) {
  for (let [t, n] of Object.entries(Lr)) if (e.startsWith(t)) return n;
  return e.split(/[\s:]/)[0] || null;
}
function zr() {
  let e = window.devicePixelRatio || 1;
  return Math.max(1, Math.round(2 * e));
}
var Br = { readingTools: new Set(), subagentToolNames: new Set() };
function Vr(e) {
  ((Br.readingTools = new Set(e.readingTools)),
    (Br.subagentToolNames = new Set(e.subagentToolNames)));
}
function Hr(e) {
  return typeof e == `string` && Br.readingTools.has(e);
}
function Ur(e) {
  return typeof e == `string` && Br.subagentToolNames.has(e);
}
function Wr(e, t) {
  let [n, r] = (0, l.useState)(() => ((t.isEditMode = !0), !0)),
    [i, a] = (0, l.useState)(0),
    [o, s] = (0, l.useState)(!1),
    [c, u] = (0, l.useState)(zr),
    d = (0, l.useRef)(null),
    f = (0, l.useRef)({ x: 0, y: 0 }),
    p = (0, l.useRef)(null),
    m = (0, l.useCallback)((e) => {
      p.current = structuredClone(e);
    }, []),
    h = (0, l.useCallback)((e) => {
      (d.current && clearTimeout(d.current),
        (d.current = setTimeout(() => {
          w.send({ type: `saveLayout`, layout: e });
        }, 500)));
    }, []),
    g = (0, l.useCallback)(
      (n) => {
        let r = e();
        (t.pushUndo(r.getLayout()),
          t.clearRedo(),
          (t.isDirty = !0),
          s(!0),
          r.rebuildFromLayout(n),
          h(n),
          a((e) => e + 1));
      },
      [e, t, h],
    ),
    _ = (0, l.useCallback)(
      (n) => {
        if (((t.isEditMode = n), n)) {
          let n = e().getLayout();
          if (n.tileColors) {
            for (let e = 0; e < n.tiles.length; e++)
              if (n.tiles[e] === N.WALL && n.tileColors[e]) {
                t.wallColor = { ...n.tileColors[e] };
                break;
              }
          }
        } else (t.clearSelection(), t.clearGhost(), t.clearDrag(), (S.current = !1));
        r(n);
      },
      [t, e],
    ),
    v = (0, l.useCallback)(() => {
      _(!t.isEditMode);
    }, [t, _]),
    y = (0, l.useCallback)(
      (e) => {
        (t.activeTool === e ? (t.activeTool = I.SELECT) : (t.activeTool = e),
          t.clearSelection(),
          t.clearGhost(),
          t.clearDrag(),
          (E.current = null),
          (S.current = !1),
          a((e) => e + 1));
      },
      [t],
    ),
    b = (0, l.useCallback)(
      (e) => {
        ((t.selectedTileType = e), a((e) => e + 1));
      },
      [t],
    ),
    x = (0, l.useCallback)(
      (e) => {
        ((t.floorColor = e), a((e) => e + 1));
      },
      [t],
    ),
    S = (0, l.useRef)(!1),
    C = (0, l.useCallback)(
      (n) => {
        t.wallColor = n;
        let r = e(),
          i = r.getLayout(),
          o = [...(i.tileColors || Array(i.tiles.length).fill(null))],
          c = !1;
        for (let e = 0; e < i.tiles.length; e++)
          i.tiles[e] === N.WALL && ((o[e] = { ...n }), (c = !0));
        if (c) {
          S.current ||= (t.pushUndo(i), t.clearRedo(), !0);
          let e = { ...i, tileColors: o };
          ((t.isDirty = !0), s(!0), r.rebuildFromLayout(e), h(e));
        }
        a((e) => e + 1);
      },
      [t, e, h],
    ),
    T = (0, l.useCallback)(
      (e) => {
        ((t.selectedWallSet = e), a((e) => e + 1));
      },
      [t],
    ),
    E = (0, l.useRef)(null),
    ee = (0, l.useCallback)(
      (n) => {
        let r = t.selectedFurnitureUid;
        if (!r) return;
        let i = e(),
          o = i.getLayout();
        E.current !== r && (t.pushUndo(o), t.clearRedo(), (E.current = r));
        let c = o.furniture.map((e) => (e.uid === r ? { ...e, color: n ?? void 0 } : e)),
          l = { ...o, furniture: c };
        ((t.isDirty = !0), s(!0), i.rebuildFromLayout(l), h(l), a((e) => e + 1));
      },
      [e, t, h],
    ),
    D = (0, l.useCallback)(
      (e) => {
        (t.selectedFurnitureType === e
          ? ((t.selectedFurnitureType = ``), t.clearGhost())
          : (t.selectedFurnitureType = e),
          a((e) => e + 1));
      },
      [t],
    ),
    O = (0, l.useCallback)(() => {
      let n = t.selectedFurnitureUid;
      if (!n) return;
      let r = e(),
        i = Ar(r.getLayout(), n);
      i !== r.getLayout() && (g(i), t.clearSelection(), (E.current = null));
    }, [e, t, g]),
    k = (0, l.useCallback)(() => {
      if (t.activeTool === I.FURNITURE_PLACE) {
        let e = $n(t.selectedFurnitureType, `cw`);
        e && ((t.selectedFurnitureType = e), a((e) => e + 1));
        return;
      }
      let n = t.selectedFurnitureUid;
      if (!n) return;
      let r = e(),
        i = Mr(r.getLayout(), n, `cw`);
      i !== r.getLayout() && g(i);
    }, [e, t, g]),
    te = (0, l.useCallback)(() => {
      if (t.activeTool === I.FURNITURE_PLACE) {
        let e = er(t.selectedFurnitureType);
        e && ((t.selectedFurnitureType = e), a((e) => e + 1));
        return;
      }
      let n = t.selectedFurnitureUid;
      if (!n) return;
      let r = e(),
        i = Nr(r.getLayout(), n);
      i !== r.getLayout() && g(i);
    }, [e, t, g]),
    ne = (0, l.useCallback)(() => {
      let n = t.popUndo();
      if (!n) return;
      let r = e();
      (t.pushRedo(r.getLayout()),
        r.rebuildFromLayout(n),
        h(n),
        (t.isDirty = !0),
        s(!0),
        a((e) => e + 1));
    }, [e, t, h]),
    re = (0, l.useCallback)(() => {
      let n = t.popRedo();
      if (!n) return;
      let r = e();
      (t.pushUndo(r.getLayout()),
        r.rebuildFromLayout(n),
        h(n),
        (t.isDirty = !0),
        s(!0),
        a((e) => e + 1));
    }, [e, t, h]),
    ie = (0, l.useCallback)(() => {
      p.current && (g(structuredClone(p.current)), t.reset(), s(!1));
    }, [t, g]),
    ae = (0, l.useCallback)(() => {
      d.current &&= (clearTimeout(d.current), null);
      let n = e().getLayout();
      ((p.current = structuredClone(n)),
        w.send({ type: `saveLayout`, layout: n }),
        (t.isDirty = !1),
        s(!1));
    }, [e, t]),
    A = (0, l.useCallback)(() => {
      ((E.current = null), a((e) => e + 1));
    }, []),
    j = (0, l.useCallback)((e) => {
      u(Math.max(1, Math.min(10, e)));
    }, []),
    oe = (0, l.useCallback)(
      (t, n, r) => {
        let i = e().getLayout(),
          a = jr(i, t, n, r);
        a !== i && g(a);
      },
      [e, g],
    ),
    se = (0, l.useCallback)((e, t, n) => {
      if (t >= 0 && t < e.cols && n >= 0 && n < e.rows) return null;
      let r = [];
      (t < 0 && r.push(`left`),
        t >= e.cols && r.push(`right`),
        n < 0 && r.push(`up`),
        n >= e.rows && r.push(`down`));
      let i = e,
        a = 0,
        o = 0;
      for (let e of r) {
        let t = Ir(i, e);
        if (!t) return null;
        ((i = t.layout), (a += t.shift.col), (o += t.shift.row));
      }
      return { layout: i, col: t + a, row: n + o, shift: { col: a, row: o } };
    }, []),
    ce = (0, l.useCallback)(
      (t, n) => {
        let r = e().getLayout(),
          i = r.pets ?? [],
          a;
        if (n) {
          if (i.some((e) => e.petType === t)) return;
          a = [...i, { id: crypto.randomUUID(), petType: t }];
        } else if (((a = i.filter((e) => e.petType !== t)), a.length === i.length)) return;
        g({ ...r, pets: a });
      },
      [e, g],
    );
  return {
    isEditMode: n,
    editorTick: i,
    isDirty: o,
    zoom: c,
    panRef: f,
    saveTimerRef: d,
    setLastSavedLayout: m,
    handleToggleEditMode: v,
    handleSetEditMode: _,
    handleToolChange: y,
    handleTileTypeChange: b,
    handleFloorColorChange: x,
    handleWallColorChange: C,
    handleWallSetChange: T,
    handleSelectedFurnitureColorChange: ee,
    handleFurnitureTypeChange: D,
    handleDeleteSelected: O,
    handleRotateSelected: k,
    handleToggleState: te,
    handleUndo: ne,
    handleRedo: re,
    handleReset: ie,
    handleSave: ae,
    handleZoomChange: j,
    handleEditorTileAction: (0, l.useCallback)(
      (n, r) => {
        let i = e(),
          o = i.getLayout(),
          s = n,
          c = r;
        if (t.activeTool === I.TILE_PAINT || t.activeTool === I.WALL_PAINT) {
          let e = se(o, n, r);
          e && ((o = e.layout), (s = e.col), (c = e.row), i.rebuildFromLayout(o, e.shift));
        }
        if (t.activeTool === I.TILE_PAINT) {
          let e = Or(o, s, c, t.selectedTileType, t.floorColor);
          e !== o && g(e);
        } else if (t.activeTool === I.WALL_PAINT) {
          let e = c * o.cols + s,
            n = o.tiles[e] === N.WALL;
          if ((t.wallDragAdding === null && (t.wallDragAdding = !n), t.wallDragAdding)) {
            let e = Or(o, s, c, N.WALL, t.wallColor);
            e !== o && g(e);
          } else if (n) {
            let e = Or(o, s, c, t.selectedTileType, t.floorColor);
            e !== o && g(e);
          }
        } else if (t.activeTool === I.ERASE) {
          if (n < 0 || n >= o.cols || r < 0 || r >= o.rows) return;
          let e = r * o.cols + n;
          if (o.tiles[e] === N.VOID) return;
          let t = Or(o, n, r, N.VOID);
          t !== o && g(t);
        } else if (t.activeTool === I.FURNITURE_PLACE) {
          let e = t.selectedFurnitureType;
          if (e === ``) {
            let e = o.furniture.find((e) => {
              let t = Yn(e.type);
              return t
                ? n >= e.col && n < e.col + t.footprintW && r >= e.row && r < e.row + t.footprintH
                : !1;
            });
            ((t.selectedFurnitureUid = e ? e.uid : null), a((e) => e + 1));
          } else {
            let i = Pr(e, r);
            if (!Fr(o, e, n, i)) return;
            let a = {
              uid: `f-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              type: e,
              col: n,
              row: i,
            };
            t.pickedFurnitureColor && (a.color = { ...t.pickedFurnitureColor });
            let s = kr(o, a);
            s !== o && g(s);
          }
        } else if (t.activeTool === I.FURNITURE_PICK) {
          let e = o.furniture.find((e) => {
            let t = Yn(e.type);
            return t
              ? n >= e.col && n < e.col + t.footprintW && r >= e.row && r < e.row + t.footprintH
              : !1;
          });
          (e &&
            ((t.selectedFurnitureType = e.type),
            (t.pickedFurnitureColor = e.color ? { ...e.color } : null),
            (t.activeTool = I.FURNITURE_PLACE)),
            a((e) => e + 1));
        } else if (t.activeTool === I.EYEDROPPER) {
          let e = r * o.cols + n,
            i = o.tiles[e];
          if (i !== void 0 && i !== N.WALL && i !== N.VOID) {
            t.selectedTileType = i;
            let n = o.tileColors?.[e];
            (n && (t.floorColor = { ...n }), (t.activeTool = I.TILE_PAINT));
          } else if (i === N.WALL) {
            let n = o.tileColors?.[e];
            (n && (t.wallColor = { ...n }), (t.activeTool = I.WALL_PAINT));
          }
          a((e) => e + 1);
        } else if (t.activeTool === I.SELECT) {
          let e = o.furniture.find((e) => {
            let t = Yn(e.type);
            return t
              ? n >= e.col && n < e.col + t.footprintW && r >= e.row && r < e.row + t.footprintH
              : !1;
          });
          ((t.selectedFurnitureUid = e ? e.uid : null), a((e) => e + 1));
        }
      },
      [e, t, g, se],
    ),
    handleEditorEraseAction: (0, l.useCallback)(
      (t, n) => {
        let r = e().getLayout();
        if (t < 0 || t >= r.cols || n < 0 || n >= r.rows) return;
        let i = n * r.cols + t;
        if (r.tiles[i] === N.VOID) return;
        let a = Or(r, t, n, N.VOID);
        a !== r && g(a);
      },
      [e, g],
    ),
    handleEditorSelectionChange: A,
    handleDragMove: oe,
    handlePetToggle: ce,
  };
}
function Gr(e, t, n, r, i, a, o, s, c) {
  (0, l.useEffect)(() => {
    if (!e) return;
    let l = (e) => {
      if (e.key === `Escape`) {
        if (t.activeTool === I.FURNITURE_PICK) ((t.activeTool = I.FURNITURE_PLACE), t.clearGhost());
        else if (t.activeTool === I.FURNITURE_PLACE && t.selectedFurnitureType !== ``)
          ((t.selectedFurnitureType = ``), t.clearGhost());
        else if (t.activeTool !== I.SELECT) ((t.activeTool = I.SELECT), t.clearGhost());
        else if (t.selectedFurnitureUid) t.clearSelection();
        else {
          c();
          return;
        }
        (t.clearDrag(), s());
      } else
        e.key === `Delete` || e.key === `Backspace`
          ? t.selectedFurnitureUid && n()
          : e.key === `r` || e.key === `R`
            ? r()
            : e.key === `t` || e.key === `T`
              ? i()
              : e.key === `z` && (e.ctrlKey || e.metaKey) && !e.shiftKey
                ? (e.preventDefault(), a())
                : ((e.key === `y` && (e.ctrlKey || e.metaKey)) ||
                    (e.key === `z` && (e.ctrlKey || e.metaKey) && e.shiftKey)) &&
                  (e.preventDefault(), o());
    };
    return (window.addEventListener(`keydown`, l), () => window.removeEventListener(`keydown`, l));
  }, [e, t, n, r, i, a, o, s, c]);
}
var Kr = Array.from({ length: 16 }, () => Array(16).fill(ve)),
  qr = [];
function Jr(e) {
  ((qr = e), sr());
}
function Yr(e) {
  let t = e - 1;
  return t < 0 ? null : t < qr.length ? qr[t] : qr.length === 0 && e >= 1 ? Kr : null;
}
function Xr() {
  return !0;
}
function Zr() {
  return qr.length > 0 ? qr.length : 1;
}
function Qr(e, t) {
  let n = `floor-${e}-${t.h}-${t.s}-${t.b}-${t.c}`,
    r = Yr(e);
  return r
    ? or(n, r, { ...t, colorize: !0 })
    : Array.from({ length: 16 }, () => Array(16).fill(Pe));
}
function $r(e) {
  return e.map((e) => [...e].reverse());
}
function ei(e) {
  return [e[0], e[1], e[2]];
}
var ti = null,
  ni = [];
function ri(e, t) {
  let n = [],
    r = [];
  for (let i = 0; i < e.length; i++) {
    let a = e[i];
    if (
      !a ||
      !a.walkDown ||
      a.walkDown.length < 3 ||
      !a.idleDown ||
      a.idleDown.length < 3 ||
      !a.walkUp ||
      a.walkUp.length < 3 ||
      !a.idleUp ||
      a.idleUp.length < 3 ||
      !a.walkRight ||
      a.walkRight.length < 3
    )
      continue;
    let o = ei(a.walkDown),
      s = ei(a.idleDown),
      c = ei(a.walkUp),
      l = ei(a.idleUp),
      u = ei(a.walkRight),
      d = [$r(u[0]), $r(u[1]), $r(u[2])];
    (n.push({
      walkDown: o,
      idleDown: s,
      walkUp: c,
      idleUp: l,
      walkRight: u,
      walkLeft: d,
      idleRight: s,
      idleLeft: l,
    }),
      r.push(t?.[i] ?? `Pet ${i + 1}`));
  }
  ((ti = n), (ni = r));
}
function ii(e) {
  return !ti || e < 0 || e >= ti.length ? null : ti[e];
}
function ai() {
  return ti?.length ?? 0;
}
function oi(e) {
  return ni[e] ?? `Pet ${e + 1}`;
}
var si = {
    name: `bubble-permission`,
    description: `Permission bubble: white square with '...' in amber, and a tail pointer (11x13)`,
    width: 11,
    height: 13,
    palette: { _: ``, B: `#555566`, F: `#EEEEFF`, A: `#CCA700` },
    pixels: [
      [`B`, `B`, `B`, `B`, `B`, `B`, `B`, `B`, `B`, `B`, `B`],
      [`B`, `F`, `F`, `F`, `F`, `F`, `F`, `F`, `F`, `F`, `B`],
      [`B`, `F`, `F`, `F`, `F`, `F`, `F`, `F`, `F`, `F`, `B`],
      [`B`, `F`, `F`, `F`, `F`, `F`, `F`, `F`, `F`, `F`, `B`],
      [`B`, `F`, `F`, `F`, `F`, `F`, `F`, `F`, `F`, `F`, `B`],
      [`B`, `F`, `F`, `A`, `F`, `A`, `F`, `A`, `F`, `F`, `B`],
      [`B`, `F`, `F`, `F`, `F`, `F`, `F`, `F`, `F`, `F`, `B`],
      [`B`, `F`, `F`, `F`, `F`, `F`, `F`, `F`, `F`, `F`, `B`],
      [`B`, `F`, `F`, `F`, `F`, `F`, `F`, `F`, `F`, `F`, `B`],
      [`B`, `B`, `B`, `B`, `B`, `B`, `B`, `B`, `B`, `B`, `B`],
      [`_`, `_`, `_`, `_`, `B`, `B`, `B`, `_`, `_`, `_`, `_`],
      [`_`, `_`, `_`, `_`, `_`, `B`, `_`, `_`, `_`, `_`, `_`],
      [`_`, `_`, `_`, `_`, `_`, `_`, `_`, `_`, `_`, `_`, `_`],
    ],
  },
  ci = {
    name: `bubble-pet`,
    description: `Heart bubble: shown when a pet is petted (11x13)`,
    width: 11,
    height: 13,
    palette: { _: ``, B: `#555566`, F: `#EEEEFF`, H: `#E64566` },
    pixels: [
      [`_`, `B`, `B`, `B`, `B`, `B`, `B`, `B`, `B`, `B`, `_`],
      [`B`, `F`, `F`, `F`, `F`, `F`, `F`, `F`, `F`, `F`, `B`],
      [`B`, `F`, `F`, `H`, `H`, `F`, `H`, `H`, `F`, `F`, `B`],
      [`B`, `F`, `H`, `H`, `H`, `H`, `H`, `H`, `H`, `F`, `B`],
      [`B`, `F`, `H`, `H`, `H`, `H`, `H`, `H`, `H`, `F`, `B`],
      [`B`, `F`, `H`, `H`, `H`, `H`, `H`, `H`, `H`, `F`, `B`],
      [`B`, `F`, `F`, `H`, `H`, `H`, `H`, `H`, `F`, `F`, `B`],
      [`B`, `F`, `F`, `F`, `H`, `H`, `H`, `F`, `F`, `F`, `B`],
      [`B`, `F`, `F`, `F`, `F`, `H`, `F`, `F`, `F`, `F`, `B`],
      [`_`, `B`, `B`, `B`, `B`, `B`, `B`, `B`, `B`, `B`, `_`],
      [`_`, `_`, `_`, `_`, `B`, `B`, `B`, `_`, `_`, `_`, `_`],
      [`_`, `_`, `_`, `_`, `_`, `B`, `_`, `_`, `_`, `_`, `_`],
      [`_`, `_`, `_`, `_`, `_`, `_`, `_`, `_`, `_`, `_`, `_`],
    ],
  },
  li = {
    name: `bubble-waiting`,
    description: `Waiting bubble: white square with green checkmark, and a tail pointer (11x13)`,
    width: 11,
    height: 13,
    palette: { _: ``, B: `#555566`, F: `#EEEEFF`, G: `#44BB66` },
    pixels: [
      [`_`, `B`, `B`, `B`, `B`, `B`, `B`, `B`, `B`, `B`, `_`],
      [`B`, `F`, `F`, `F`, `F`, `F`, `F`, `F`, `F`, `F`, `B`],
      [`B`, `F`, `F`, `F`, `F`, `F`, `F`, `F`, `F`, `F`, `B`],
      [`B`, `F`, `F`, `F`, `F`, `F`, `F`, `F`, `G`, `F`, `B`],
      [`B`, `F`, `F`, `F`, `F`, `F`, `F`, `G`, `F`, `F`, `B`],
      [`B`, `F`, `F`, `G`, `F`, `F`, `G`, `F`, `F`, `F`, `B`],
      [`B`, `F`, `F`, `F`, `G`, `G`, `F`, `F`, `F`, `F`, `B`],
      [`B`, `F`, `F`, `F`, `F`, `F`, `F`, `F`, `F`, `F`, `B`],
      [`B`, `F`, `F`, `F`, `F`, `F`, `F`, `F`, `F`, `F`, `B`],
      [`_`, `B`, `B`, `B`, `B`, `B`, `B`, `B`, `B`, `B`, `_`],
      [`_`, `_`, `_`, `_`, `B`, `B`, `B`, `_`, `_`, `_`, `_`],
      [`_`, `_`, `_`, `_`, `_`, `B`, `_`, `_`, `_`, `_`, `_`],
      [`_`, `_`, `_`, `_`, `_`, `_`, `_`, `_`, `_`, `_`, `_`],
    ],
  };
function ui(e) {
  return e.pixels.map((t) => t.map((t) => e.palette[t] ?? t));
}
var di = ui(si),
  fi = ui(li),
  pi = ui(ci),
  mi = null;
function hi(e) {
  ((mi = e), vi.clear());
}
function gi() {
  return mi ? mi.length : 6;
}
function _i(e) {
  return e.map((e) => [...e].reverse());
}
var vi = new Map();
function yi(e, t) {
  let n = { h: t, s: 0, b: 0, c: 0 },
    r = (e) => mr(e, n),
    i = (e) => [r(e[0]), r(e[1]), r(e[2]), r(e[3])],
    a = (e) => [r(e[0]), r(e[1])];
  return {
    walk: {
      [F.DOWN]: i(e.walk[F.DOWN]),
      [F.UP]: i(e.walk[F.UP]),
      [F.RIGHT]: i(e.walk[F.RIGHT]),
      [F.LEFT]: i(e.walk[F.LEFT]),
    },
    typing: {
      [F.DOWN]: a(e.typing[F.DOWN]),
      [F.UP]: a(e.typing[F.UP]),
      [F.RIGHT]: a(e.typing[F.RIGHT]),
      [F.LEFT]: a(e.typing[F.LEFT]),
    },
    reading: {
      [F.DOWN]: a(e.reading[F.DOWN]),
      [F.UP]: a(e.reading[F.UP]),
      [F.RIGHT]: a(e.reading[F.RIGHT]),
      [F.LEFT]: a(e.reading[F.LEFT]),
    },
  };
}
function bi(e, t) {
  let n = [];
  for (let r = 0; r < t; r++) n.push(Array(e).fill(``));
  return n;
}
function xi(e, t = 0) {
  let n = `${e}:${t}`,
    r = vi.get(n);
  if (r) return r;
  let i;
  if (mi) {
    let t = mi[e % mi.length],
      n = t.down,
      r = t.up,
      a = t.right,
      o = _i;
    i = {
      walk: {
        [F.DOWN]: [n[0], n[1], n[2], n[1]],
        [F.UP]: [r[0], r[1], r[2], r[1]],
        [F.RIGHT]: [a[0], a[1], a[2], a[1]],
        [F.LEFT]: [o(a[0]), o(a[1]), o(a[2]), o(a[1])],
      },
      typing: {
        [F.DOWN]: [n[3], n[4]],
        [F.UP]: [r[3], r[4]],
        [F.RIGHT]: [a[3], a[4]],
        [F.LEFT]: [o(a[3]), o(a[4])],
      },
      reading: {
        [F.DOWN]: [n[5], n[6]],
        [F.UP]: [r[5], r[6]],
        [F.RIGHT]: [a[5], a[6]],
        [F.LEFT]: [o(a[5]), o(a[6])],
      },
    };
  } else {
    let e = bi(16, 32),
      t = [e, e, e, e],
      n = [e, e];
    i = {
      walk: { [F.DOWN]: t, [F.UP]: t, [F.RIGHT]: t, [F.LEFT]: t },
      typing: { [F.DOWN]: n, [F.UP]: n, [F.RIGHT]: n, [F.LEFT]: n },
      reading: { [F.DOWN]: n, [F.UP]: n, [F.RIGHT]: n, [F.LEFT]: n },
    };
  }
  return (t !== 0 && (i = yi(i, t)), vi.set(n, i), i);
}
var Si = [];
function Ci(e) {
  Si = e;
}
function wi() {
  return Si.length > 0;
}
function Ti() {
  return Si.length;
}
function Ei(e) {
  let t = Si[e];
  return t ? (t[0] ?? null) : null;
}
function Di(e, t, n) {
  let r = n.length,
    i = r > 0 ? n[0].length : 0,
    a = 0;
  return (
    t > 0 && n[t - 1][e] === N.WALL && (a |= 1),
    e < i - 1 && n[t][e + 1] === N.WALL && (a |= 2),
    t < r - 1 && n[t + 1][e] === N.WALL && (a |= 4),
    e > 0 && n[t][e - 1] === N.WALL && (a |= 8),
    a
  );
}
function Oi(e, t, n, r = 0) {
  if (Si.length === 0) return null;
  let i = (Si[r] ?? Si[0])[Di(e, t, n)];
  return i ? { sprite: i, offsetY: 16 - i.length } : null;
}
function ki(e, t, n, r, i = 0) {
  if (Si.length === 0) return null;
  let a = Si[i] ?? Si[0],
    o = Di(e, t, n),
    s = a[o];
  return s
    ? {
        sprite: or(`wall-${i}-${o}-${r.h}-${r.s}-${r.b}-${r.c}`, s, { ...r, colorize: !0 }),
        offsetY: 16 - s.length,
      }
    : null;
}
function Ai(e, t, n) {
  if (Si.length === 0) return [];
  let r = e.length,
    i = r > 0 ? e[0].length : 0,
    a = n ?? i,
    o = [];
  for (let n = 0; n < r; n++)
    for (let r = 0; r < i; r++) {
      if (e[n][r] !== N.WALL) continue;
      let i = n * a + r,
        s = t?.[i],
        c = s ? ki(r, n, e, s) : Oi(r, n, e);
      c && o.push({ sprite: c.sprite, x: r * 16, y: n * 16 + c.offsetY, zY: (n + 1) * 16 });
    }
  return o;
}
function ji(e) {
  let { h: t, s: n, b: r, c: i } = e,
    a = 0.5;
  if (i !== 0) {
    let e = (100 + i) / 100;
    a = 0.5 + (a - 0.5) * e;
  }
  (r !== 0 && (a += r / 200), (a = Math.max(0, Math.min(1, a))));
  let o = n / 100,
    s = (1 - Math.abs(2 * a - 1)) * o,
    c = t / 60,
    l = s * (1 - Math.abs((c % 2) - 1)),
    u = 0,
    d = 0,
    f = 0;
  c < 1
    ? ((u = s), (d = l), (f = 0))
    : c < 2
      ? ((u = l), (d = s), (f = 0))
      : c < 3
        ? ((u = 0), (d = s), (f = l))
        : c < 4
          ? ((u = 0), (d = l), (f = s))
          : c < 5
            ? ((u = l), (d = 0), (f = s))
            : ((u = s), (d = 0), (f = l));
  let p = a - s / 2,
    m = (e) => Math.max(0, Math.min(255, Math.round((e + p) * 255)));
  return `#${m(u).toString(16).padStart(2, `0`)}${m(d).toString(16).padStart(2, `0`)}${m(f).toString(16).padStart(2, `0`)}`;
}
function Mi(e) {
  let t = {};
  for (let n of e.characters.values())
    n.isSubagent || (t[n.id] = { palette: n.palette, hueShift: n.hueShift, seatId: n.seatId });
  w.send({ type: `saveAgentSeats`, seats: t });
}
function Ni(e, t, n) {
  let [r, i] = (0, l.useState)([]),
    [a, o] = (0, l.useState)(null),
    [s, c] = (0, l.useState)({}),
    [u, d] = (0, l.useState)({}),
    [f, p] = (0, l.useState)({}),
    [m, h] = (0, l.useState)({}),
    [g, _] = (0, l.useState)([]),
    [v, y] = (0, l.useState)(!1),
    [b, x] = (0, l.useState)(!1),
    [S, C] = (0, l.useState)(),
    [T, E] = (0, l.useState)([]),
    [ee, D] = (0, l.useState)(``),
    [O, k] = (0, l.useState)(``),
    [te, ne] = (0, l.useState)(!1),
    [re, ie] = (0, l.useState)(!1),
    [ae, A] = (0, l.useState)(!0),
    [j, oe] = (0, l.useState)(!0),
    [se, ce] = (0, l.useState)([]),
    [le, ue] = (0, l.useState)(null),
    M = (0, l.useRef)(0),
    de = (0, l.useRef)(!1);
  return (
    (0, l.useEffect)(() => {
      let r = [],
        a = w.onMessage((a) => {
          let s = e();
          if (
            (wn &&
              typeof window < `u` &&
              (window.__lightoryTestHooks || (window.__lightoryTestHooks = {}),
              window.__lightoryTestHooks.messageLog || (window.__lightoryTestHooks.messageLog = []),
              window.__lightoryTestHooks.messageLog.push({
                at: Date.now(),
                type: a.type,
                id: a.id,
                toolName: a.toolName,
                status: a.status,
                awaitingInput: a.awaitingInput,
                toolId: a.toolId,
                parentToolId: a.parentToolId,
              })),
            a.type === `providerCapabilities`)
          ) {
            Vr({ readingTools: a.readingTools, subagentToolNames: a.subagentToolNames });
            return;
          }
          if (a.type === `roleTaskStatus`) {
            let e = a.roleId,
              t = Ot(e),
              n = a.status;
            ((n === `started` || n === `done` || n === `error`) &&
              ue({ runId: a.runId, roleId: e, status: n }),
              n === `started`
                ? s.setRoleTaskWorking(t)
                : n === `done`
                  ? s.setRoleTaskWeather(t, a.weatherIcon ?? `cloud`)
                  : n === `error` && s.clearRoleTaskState(t));
          } else if (a.type === `roleTaskConsole`) {
            let e = ++M.current;
            ce((t) =>
              [
                ...t,
                {
                  id: e,
                  runId: a.runId,
                  roleId: a.roleId,
                  status: a.status,
                  stream: a.stream,
                  content: a.content,
                },
              ].slice(-500),
            );
          } else if (a.type === `layoutLoaded`) {
            if (de.current && n?.()) {
              console.log(`[Webview] Skipping external layout update — editor has unsaved changes`);
              return;
            }
            let e = a.layout,
              i = e && e.version === 1 ? Er(e) : null;
            i ? (s.rebuildFromLayout(i), t?.(i)) : t?.(s.getLayout());
            for (let e of r) s.addAgent(e.id, e.palette, e.hueShift, e.seatId, !0, e.folderName);
            ((r = []),
              (de.current = !0),
              y(!0),
              a.wasReset && x(!0),
              s.characters.size > 0 && Mi(s));
          } else if (a.type === `agentCreated`) {
            let e = a.id,
              t = a.folderName,
              n = a.isTeammate,
              r = a.teammateName,
              c = a.parentAgentId,
              l = a.teamName;
            if ((i((t) => (t.includes(e) ? t : [...t, e])), n || o(e), n && c !== void 0)) {
              let t = s.characters.get(c),
                n = t ? t.palette : void 0,
                i = t ? t.hueShift : void 0;
              s.addAgent(e, n, i, void 0, void 0, t?.folderName);
              let a = s.characters.get(e);
              a && ((a.leadAgentId = c), (a.teamName = l ?? t?.teamName), (a.agentName = r));
            } else s.addAgent(e, void 0, void 0, void 0, void 0, t);
            Mi(s);
          } else if (a.type === `agentClosed`) {
            let e = a.id;
            (i((t) => t.filter((t) => t !== e)),
              o((t) => (t === e ? null : t)),
              c((t) => {
                if (!(e in t)) return t;
                let n = { ...t };
                return (delete n[e], n);
              }),
              d((t) => {
                if (!(e in t)) return t;
                let n = { ...t };
                return (delete n[e], n);
              }),
              p((t) => {
                if (!(e in t)) return t;
                let n = { ...t };
                return (delete n[e], n);
              }),
              h((t) => {
                if (!(e in t)) return t;
                let n = { ...t };
                return (delete n[e], n);
              }),
              s.removeAllSubagents(e),
              _((t) => t.filter((t) => t.parentAgentId !== e)),
              s.removeAgent(e));
          } else if (a.type === `existingAgents`) {
            let e = a.agents,
              t = a.agentMeta || {},
              n = a.folderNames || {};
            for (let i of e) {
              let e = t[i];
              r.push({
                id: i,
                palette: e?.palette,
                hueShift: e?.hueShift,
                seatId: e?.seatId,
                folderName: n[i],
              });
            }
            i((t) => {
              let n = new Set(t),
                r = [...t];
              for (let t of e) n.has(t) || r.push(t);
              return r.sort((e, t) => e - t);
            });
          } else if (a.type === `agentToolStart`) {
            let e = a.id,
              t = a.toolId,
              n = a.status,
              r = a.permissionActive;
            c((i) => {
              let a = i[e] || [];
              return a.some((e) => e.toolId === t)
                ? i
                : {
                    ...i,
                    [e]: [...a, { toolId: t, status: n, done: !1, permissionWait: r || !1 }],
                  };
            });
            let i = a.toolName ?? Rr(n);
            (s.setAgentTool(e, i), s.setAgentActive(e, !0), r || s.clearPermissionBubble(e));
            let o = a.runInBackground,
              l = !!s.characters.get(e)?.teamName;
            if (Ur(i) && (!o || !l)) {
              let r = n.startsWith(`Subtask:`) ? n.slice(8).trim() : ``,
                i = s.addSubagent(e, t);
              _((n) =>
                n.some((e) => e.id === i)
                  ? n
                  : [...n, { id: i, parentAgentId: e, parentToolId: t, label: r }],
              );
            }
          } else if (a.type === `agentToolDone`) {
            let e = a.id,
              t = a.toolId;
            c((n) => {
              let r = n[e];
              return r ? { ...n, [e]: r.map((e) => (e.toolId === t ? { ...e, done: !0 } : e)) } : n;
            });
          } else if (a.type === `agentToolsClear`) {
            let e = a.id;
            (c((t) => {
              if (!(e in t)) return t;
              let n = { ...t };
              return (delete n[e], n);
            }),
              h((t) => {
                if (!(e in t)) return t;
                let n = { ...t };
                return (delete n[e], n);
              }));
            let t = s.characters.get(e);
            ((t?.teamName && t?.isTeamLead && !t?.teamUsesTmux) ||
              (s.removeAllSubagents(e), _((t) => t.filter((t) => t.parentAgentId !== e))),
              s.setAgentTool(e, null),
              s.clearPermissionBubble(e));
          } else if (a.type === `agentStatus`) {
            let e = a.id,
              t = a.status;
            (d((n) => {
              if (t === `active`) {
                if (!(e in n)) return n;
                let t = { ...n };
                return (delete t[e], t);
              }
              return { ...n, [e]: t };
            }),
              p((n) => {
                if (t === `active`) {
                  if (!(e in n)) return n;
                  let t = { ...n };
                  return (delete t[e], t);
                }
                return { ...n, [e]: a.awaitingInput === !0 };
              }),
              s.setAgentActive(e, t === `active`),
              t === `waiting` && (s.showWaitingBubble(e, a.awaitingInput === !0), jn()));
          } else if (a.type === `agentToolPermission`) {
            let e = a.id;
            (c((t) => {
              let n = t[e];
              return n
                ? { ...t, [e]: n.map((e) => (e.done ? e : { ...e, permissionWait: !0 })) }
                : t;
            }),
              s.showPermissionBubble(e),
              Mn());
          } else if (a.type === `subagentToolPermission`) {
            let e = a.id,
              t = a.parentToolId,
              n = s.getSubagentId(e, t);
            n !== null && s.showPermissionBubble(n);
          } else if (a.type === `agentToolPermissionClear`) {
            let e = a.id;
            (c((t) => {
              let n = t[e];
              return !n || !n.some((e) => e.permissionWait)
                ? t
                : {
                    ...t,
                    [e]: n.map((e) => (e.permissionWait ? { ...e, permissionWait: !1 } : e)),
                  };
            }),
              s.clearPermissionBubble(e));
            for (let [t, n] of s.subagentMeta) n.parentAgentId === e && s.clearPermissionBubble(t);
          } else if (a.type === `subagentToolStart`) {
            let e = a.id,
              t = a.parentToolId,
              n = a.toolId,
              r = a.status;
            h((i) => {
              let a = i[e] || {},
                o = a[t] || [];
              return o.some((e) => e.toolId === n)
                ? i
                : { ...i, [e]: { ...a, [t]: [...o, { toolId: n, status: r, done: !1 }] } };
            });
            let i = s.getSubagentId(e, t);
            if (i !== null) {
              let e = Rr(r);
              (s.setAgentTool(i, e), s.setAgentActive(i, !0));
            }
          } else if (a.type === `subagentToolDone`) {
            let e = a.id,
              t = a.parentToolId,
              n = a.toolId;
            h((r) => {
              let i = r[e];
              if (!i) return r;
              let a = i[t];
              return a
                ? {
                    ...r,
                    [e]: { ...i, [t]: a.map((e) => (e.toolId === n ? { ...e, done: !0 } : e)) },
                  }
                : r;
            });
          } else if (a.type === `subagentClear`) {
            let e = a.id,
              t = a.parentToolId;
            (h((n) => {
              let r = n[e];
              if (!r || !(t in r)) return n;
              let i = { ...r };
              if ((delete i[t], Object.keys(i).length === 0)) {
                let t = { ...n };
                return (delete t[e], t);
              }
              return { ...n, [e]: i };
            }),
              s.removeSubagent(e, t),
              _((n) => n.filter((n) => !(n.parentAgentId === e && n.parentToolId === t))));
          } else if (a.type === `characterSpritesLoaded`) {
            let e = a.characters;
            (console.log(`[Webview] Received ${e.length} pre-colored character sprites`), hi(e));
          } else if (a.type === `petSpritesLoaded`) {
            let e = a.pets;
            if (!Array.isArray(e)) return;
            let t = Array.isArray(a.petNames) ? a.petNames : void 0;
            (console.log(`[Webview] Received ${e.length} pet sprites`), ri(e, t));
          } else if (a.type === `floorTilesLoaded`) {
            let e = a.sprites;
            (console.log(`[Webview] Received ${e.length} floor tile patterns`), Jr(e));
          } else if (a.type === `wallTilesLoaded`) {
            let e = a.sets;
            (console.log(`[Webview] Received ${e.length} wall tile set(s)`), Ci(e));
          } else if (a.type === `settingsLoaded`) {
            let e = a.soundEnabled;
            (On(e),
              typeof a.watchAllSessions == `boolean` && ne(a.watchAllSessions),
              typeof a.alwaysShowLabels == `boolean` && ie(a.alwaysShowLabels),
              typeof a.hooksEnabled == `boolean` && A(a.hooksEnabled),
              typeof a.hooksInfoShown == `boolean` && oe(a.hooksInfoShown),
              Array.isArray(a.externalAssetDirectories) && E(a.externalAssetDirectories),
              typeof a.lastSeenVersion == `string` && D(a.lastSeenVersion),
              typeof a.extensionVersion == `string` && k(a.extensionVersion));
          } else if (a.type === `externalAssetDirectoriesUpdated`)
            Array.isArray(a.dirs) && E(a.dirs);
          else if (a.type === `furnitureAssetsLoaded`)
            try {
              let e = a.catalog,
                t = a.sprites;
              (console.log(`📦 Webview: Loaded ${e.length} furniture assets`),
                Jn({ catalog: e, sprites: t }),
                C({ catalog: e, sprites: t }));
            } catch (e) {
              console.error(`❌ Webview: Error processing furnitureAssetsLoaded:`, e);
            }
          else if (a.type === `agentTeamInfo`) {
            let e = a.id;
            s.setTeamInfo(e, a.teamName, a.agentName, a.isTeamLead, a.leadAgentId, a.teamUsesTmux);
          } else if (a.type === `agentTokenUsage`) {
            let e = a.id;
            s.setAgentTokens(e, a.inputTokens, a.outputTokens);
          }
        });
      return (w.send({ type: `webviewReady` }), a);
    }, [e]),
    {
      agents: r,
      selectedAgent: a,
      agentTools: s,
      agentStatuses: u,
      agentAwaitingInput: f,
      subagentTools: m,
      subagentCharacters: g,
      layoutReady: v,
      layoutWasReset: b,
      loadedAssets: S,
      externalAssetDirectories: T,
      lastSeenVersion: ee,
      extensionVersion: O,
      watchAllSessions: te,
      setWatchAllSessions: ne,
      alwaysShowLabels: re,
      hooksEnabled: ae,
      setHooksEnabled: A,
      hooksInfoShown: j,
      roleTaskConsoleEntries: se,
      lastRoleTaskStatus: le,
    }
  );
}
function Pi(e, t) {
  let n = e.getContext(`2d`);
  n.imageSmoothingEnabled = !1;
  let r = 0,
    i = 0,
    a = !1,
    o = (e) => {
      if (a) return;
      let s = r === 0 ? 0 : Math.min((e - r) / 1e3, mt);
      ((r = e),
        t.update(s),
        (n.imageSmoothingEnabled = !1),
        t.render(n),
        (i = requestAnimationFrame(o)));
    };
  return (
    (i = requestAnimationFrame(o)),
    () => {
      ((a = !0), cancelAnimationFrame(i));
    }
  );
}
var R = new Map(),
  z = new WeakMap();
function Fi(e) {
  let t = z.get(e);
  if (t) return t;
  let n = e.length,
    r = e[0].length,
    i = [];
  for (let e = 0; e < n + 2; e++) i.push(Array(r + 2).fill(``));
  for (let t = 0; t < n; t++)
    for (let n = 0; n < r; n++) {
      if (e[t][n] === ``) continue;
      let r = t + 1,
        a = n + 1;
      (i[r - 1][a] === `` && (i[r - 1][a] = `#FFFFFF`),
        i[r + 1][a] === `` && (i[r + 1][a] = `#FFFFFF`),
        i[r][a - 1] === `` && (i[r][a - 1] = `#FFFFFF`),
        i[r][a + 1] === `` && (i[r][a + 1] = `#FFFFFF`));
    }
  for (let t = 0; t < n; t++) for (let n = 0; n < r; n++) e[t][n] !== `` && (i[t + 1][n + 1] = ``);
  return (z.set(e, i), i);
}
function Ii(e, t) {
  let n = R.get(t);
  n || ((n = new WeakMap()), R.set(t, n));
  let r = n.get(e);
  if (r) return r;
  let i = e.length,
    a = e[0].length,
    o = document.createElement(`canvas`);
  ((o.width = a * t), (o.height = i * t));
  let s = o.getContext(`2d`);
  s.imageSmoothingEnabled = !1;
  for (let n = 0; n < i; n++)
    for (let r = 0; r < a; r++) {
      let i = e[n][r];
      i !== `` && ((s.fillStyle = i), s.fillRect(r * t, n * t, t, t));
    }
  return (n.set(e, o), o);
}
function Li(e, t, n, r) {
  let i = n.length,
    a = i > 0 ? n[0].length : 0;
  if (t < 0 || t >= i || e < 0 || e >= a) return !1;
  let o = n[t][e];
  return !(o === N.WALL || o === N.VOID || r.has(`${e},${t}`));
}
function Ri(e, t) {
  let n = e.length,
    r = n > 0 ? e[0].length : 0,
    i = [];
  for (let a = 0; a < n; a++)
    for (let n = 0; n < r; n++) Li(n, a, e, t) && i.push({ col: n, row: a });
  return i;
}
function zi(e, t, n, r, i, a) {
  if (e === n && t === r) return [];
  let o = (e, t) => `${e},${t}`,
    s = o(e, t),
    c = o(n, r);
  if (!Li(n, r, i, a)) return [];
  let l = new Set();
  l.add(s);
  let u = new Map(),
    d = [{ col: e, row: t }],
    f = [
      { dc: 0, dr: -1 },
      { dc: 0, dr: 1 },
      { dc: -1, dr: 0 },
      { dc: 1, dr: 0 },
    ];
  for (; d.length > 0; ) {
    let e = d.shift(),
      t = o(e.col, e.row);
    if (t === c) {
      let e = [],
        t = c;
      for (; t !== s; ) {
        let [n, r] = t.split(`,`).map(Number);
        (e.unshift({ col: n, row: r }), (t = u.get(t)));
      }
      return e;
    }
    for (let n of f) {
      let r = e.col + n.dc,
        s = e.row + n.dr,
        c = o(r, s);
      l.has(c) || (Li(r, s, i, a) && (l.add(c), u.set(c, t), d.push({ col: r, row: s })));
    }
  }
  return [];
}
function Bi(e) {
  return e ? Hr(e) : !1;
}
function Vi(e, t) {
  return { x: e * 16 + 16 / 2, y: t * 16 + 16 / 2 };
}
function Hi(e, t, n, r) {
  let i = n - e,
    a = r - t;
  return i > 0 ? F.RIGHT : i < 0 ? F.LEFT : a > 0 ? F.DOWN : F.UP;
}
function Ui(e, t, n, r, i = 0) {
  let a = r ? r.seatCol : 1,
    o = r ? r.seatRow : 1,
    s = Vi(a, o);
  return {
    id: e,
    state: P.TYPE,
    dir: r ? r.facingDir : F.DOWN,
    x: s.x,
    y: s.y,
    tileCol: a,
    tileRow: o,
    path: [],
    moveProgress: 0,
    currentTool: null,
    roleTaskState: `idle`,
    palette: t,
    hueShift: i,
    frame: 0,
    frameTimer: 0,
    wanderTimer: 0,
    wanderCount: 0,
    wanderLimit: Ji(3, 6),
    isActive: !0,
    seatId: n,
    bubbleType: null,
    bubbleTimer: 0,
    seatTimer: 0,
    isSubagent: !1,
    parentAgentId: null,
    matrixEffect: null,
    matrixEffectTimer: 0,
    matrixEffectSeeds: [],
    inputTokens: 0,
    outputTokens: 0,
  };
}
function Wi(e, t, n, r, i, a) {
  switch (((e.frameTimer += t), e.state)) {
    case P.TYPE:
      if ((Ki(e), !e.isActive)) {
        if (e.seatTimer > 0) {
          e.seatTimer -= t;
          break;
        }
        ((e.seatTimer = 0),
          (e.state = P.IDLE),
          (e.frame = 0),
          (e.frameTimer = 0),
          (e.wanderTimer = qi(2, 20)),
          (e.wanderCount = 0),
          (e.wanderLimit = Ji(3, 6)));
      }
      break;
    case P.BUSY:
      (Ki(e),
        e.isActive ||
          ((e.state = P.IDLE), (e.frame = 0), (e.frameTimer = 0), (e.wanderTimer = qi(2, 20))));
      break;
    case P.IDLE:
      if (((e.frame = 0), e.seatTimer < 0 && (e.seatTimer = 0), e.isActive)) {
        if (!e.seatId) {
          ((e.state = e.roleTaskState === `busy` ? P.BUSY : P.TYPE),
            (e.frame = 0),
            (e.frameTimer = 0));
          break;
        }
        let t = r.get(e.seatId);
        if (t) {
          let n = zi(e.tileCol, e.tileRow, t.seatCol, t.seatRow, i, a);
          n.length > 0
            ? ((e.path = n),
              (e.moveProgress = 0),
              (e.state = P.WALK),
              (e.frame = 0),
              (e.frameTimer = 0))
            : ((e.state = e.roleTaskState === `busy` ? P.BUSY : P.TYPE),
              (e.dir = t.facingDir),
              (e.frame = 0),
              (e.frameTimer = 0));
        }
        break;
      }
      if (((e.wanderTimer -= t), e.wanderTimer <= 0)) {
        if (e.wanderCount >= e.wanderLimit && e.seatId) {
          let t = r.get(e.seatId);
          if (t) {
            let n = zi(e.tileCol, e.tileRow, t.seatCol, t.seatRow, i, a);
            if (n.length > 0) {
              ((e.path = n),
                (e.moveProgress = 0),
                (e.state = P.WALK),
                (e.frame = 0),
                (e.frameTimer = 0));
              break;
            }
          }
        }
        if (n.length > 0) {
          let t = n[Math.floor(Math.random() * n.length)],
            r = zi(e.tileCol, e.tileRow, t.col, t.row, i, a);
          r.length > 0 &&
            ((e.path = r),
            (e.moveProgress = 0),
            (e.state = P.WALK),
            (e.frame = 0),
            (e.frameTimer = 0),
            e.wanderCount++);
        }
        e.wanderTimer = qi(2, 20);
      }
      break;
    case P.WALK: {
      if (
        (e.frameTimer >= 0.15 && ((e.frameTimer -= k), (e.frame = (e.frame + 1) % 4)),
        e.path.length === 0)
      ) {
        let t = Vi(e.tileCol, e.tileRow);
        if (((e.x = t.x), (e.y = t.y), e.isActive))
          if (!e.seatId) e.state = e.roleTaskState === `busy` ? P.BUSY : P.TYPE;
          else {
            let t = r.get(e.seatId);
            t && e.tileCol === t.seatCol && e.tileRow === t.seatRow
              ? ((e.state = e.roleTaskState === `busy` ? P.BUSY : P.TYPE), (e.dir = t.facingDir))
              : (e.state = P.IDLE);
          }
        else {
          if (e.seatId) {
            let t = r.get(e.seatId);
            if (t && e.tileCol === t.seatCol && e.tileRow === t.seatRow) {
              ((e.state = P.TYPE),
                (e.dir = t.facingDir),
                e.seatTimer < 0 ? (e.seatTimer = 0) : (e.seatTimer = qi(120, 240)),
                (e.wanderCount = 0),
                (e.wanderLimit = Ji(3, 6)),
                (e.frame = 0),
                (e.frameTimer = 0));
              break;
            }
          }
          ((e.state = P.IDLE), (e.wanderTimer = qi(2, 20)));
        }
        ((e.frame = 0), (e.frameTimer = 0));
        break;
      }
      let n = e.path[0];
      ((e.dir = Hi(e.tileCol, e.tileRow, n.col, n.row)), (e.moveProgress += (48 / 16) * t));
      let o = Vi(e.tileCol, e.tileRow),
        s = Vi(n.col, n.row),
        c = Math.min(e.moveProgress, 1);
      if (
        ((e.x = o.x + (s.x - o.x) * c),
        (e.y = o.y + (s.y - o.y) * c),
        e.moveProgress >= 1 &&
          ((e.tileCol = n.col),
          (e.tileRow = n.row),
          (e.x = s.x),
          (e.y = s.y),
          e.path.shift(),
          (e.moveProgress = 0)),
        e.isActive && e.seatId)
      ) {
        let t = r.get(e.seatId);
        if (t) {
          let n = e.path[e.path.length - 1];
          if (!n || n.col !== t.seatCol || n.row !== t.seatRow) {
            let n = zi(e.tileCol, e.tileRow, t.seatCol, t.seatRow, i, a);
            n.length > 0 && ((e.path = n), (e.moveProgress = 0));
          }
        }
      }
      break;
    }
  }
}
function Gi(e, t) {
  switch (e.state) {
    case P.TYPE:
    case P.BUSY:
      return Bi(e.currentTool) ? t.reading[e.dir][e.frame % 2] : t.typing[e.dir][e.frame % 2];
    case P.WALK:
      return t.walk[e.dir][e.frame % 4];
    case P.IDLE:
      return t.walk[e.dir][1];
    default:
      return t.walk[e.dir][1];
  }
}
function Ki(e) {
  e.frameTimer >= 0.3 && ((e.frameTimer -= te), (e.frame = (e.frame + 1) % 2));
}
function qi(e, t) {
  return e + Math.random() * (t - e);
}
function Ji(e, t) {
  return e + Math.floor(Math.random() * (t - e + 1));
}
function Yi(e, t, n) {
  let r = Math.floor(n * 30);
  return ((e * 7 + t * 13 + r * 31) & 255) < 180;
}
function Xi() {
  let e = [];
  for (let t = 0; t < 16; t++) e.push(Math.random());
  return e;
}
function Zi(e, t, n, r, i, a) {
  let o = t.matrixEffectTimer / ne,
    s = t.matrixEffect === `spawn`,
    c = t.matrixEffectTimer;
  for (let l = 0; l < 16; l++) {
    let u = (t.matrixEffectSeeds[l] ?? 0) * re,
      d = Math.max(0, Math.min(1, (o - u) / (1 - re))) * 30;
    for (let t = 0; t < 24; t++) {
      let o = n[t]?.[l],
        u = o && o !== ``,
        f = d - t,
        p = r + l * a,
        m = i + t * a;
      if (s) {
        if (f < 0) continue;
        if (f < 1) ((e.fillStyle = ie), e.fillRect(p, m, a, a));
        else if (f < 6) {
          let n = f / 6;
          if (u) {
            ((e.fillStyle = o), e.fillRect(p, m, a, a));
            let r = (1 - n) * oe;
            Yi(l, t, c) && ((e.fillStyle = ae(r)), e.fillRect(p, m, a, a));
          } else if (Yi(l, t, c)) {
            let t = (1 - n) * se;
            ((e.fillStyle = n < 0.33 ? ae(t) : n < 0.66 ? A(t) : j(t)), e.fillRect(p, m, a, a));
          }
        } else u && ((e.fillStyle = o), e.fillRect(p, m, a, a));
      } else if (f < 0) u && ((e.fillStyle = o), e.fillRect(p, m, a, a));
      else if (f < 1) ((e.fillStyle = ie), e.fillRect(p, m, a, a));
      else if (f < 6 && Yi(l, t, c)) {
        let t = f / 6,
          n = (1 - t) * se;
        ((e.fillStyle = t < 0.33 ? ae(n) : t < 0.66 ? A(n) : j(n)), e.fillRect(p, m, a, a));
      }
    }
  }
}
function Qi(e, t) {
  return e + Math.random() * (t - e);
}
function $i(e, t) {
  return { x: e * 16 + 16 / 2, y: t * 16 + 16 / 2 };
}
function ea(e, t, n, r) {
  let i = n - e,
    a = r - t;
  return i > 0 ? F.RIGHT : i < 0 ? F.LEFT : a > 0 ? F.DOWN : F.UP;
}
function ta(e, t, n, r) {
  return Math.abs(e - n) + Math.abs(t - r);
}
function na(e, t) {
  let n = null,
    r = 1 / 0;
  for (let i of t.values()) {
    if (i.matrixEffect === `despawn`) continue;
    let t = ta(e.tileCol, e.tileRow, i.tileCol, i.tileRow);
    t > 3 || (t < r && ((n = i), (r = t)));
  }
  return n;
}
function ra(e, t, n) {
  let r = [
    { col: e.tileCol, row: e.tileRow - 1 },
    { col: e.tileCol, row: e.tileRow + 1 },
    { col: e.tileCol - 1, row: e.tileRow },
    { col: e.tileCol + 1, row: e.tileRow },
  ];
  for (let e of r) if (Li(e.col, e.row, t, n)) return e;
  return null;
}
function ia(e, t) {
  ((e.frameTimer += t),
    e.frameTimer >= 0.15 && ((e.frameTimer -= xt), (e.frame = (e.frame + 1) % 4)));
}
function aa(e, t) {
  ((e.frameTimer += t),
    e.frameTimer >= 0.3 && ((e.frameTimer -= St), (e.frame = (e.frame + 1) % 4)));
}
function oa(e, t) {
  if (e.path.length === 0) return;
  let n = e.path[0];
  ((e.dir = ea(e.tileCol, e.tileRow, n.col, n.row)), (e.moveProgress += (32 / 16) * t));
  let r = $i(e.tileCol, e.tileRow),
    i = $i(n.col, n.row),
    a = Math.min(e.moveProgress, 1);
  ((e.x = r.x + (i.x - r.x) * a),
    (e.y = r.y + (i.y - r.y) * a),
    e.moveProgress >= 1 &&
      ((e.tileCol = n.col),
      (e.tileRow = n.row),
      (e.x = i.x),
      (e.y = i.y),
      e.path.shift(),
      (e.moveProgress = 0)));
}
function sa(e, t, n, r) {
  let i = $i(n, r);
  return {
    id: e,
    name: ``,
    petType: t,
    state: Tt.IDLE,
    dir: F.DOWN,
    x: i.x,
    y: i.y,
    tileCol: n,
    tileRow: r,
    path: [],
    moveProgress: 0,
    frame: 0,
    frameTimer: 0,
    wanderTimer: Qi(3, 15),
    followTargetId: null,
    followRecalcTimer: 0,
    followDuration: 0,
    followDurationLimit: 0,
    bubbleType: null,
    bubbleTimer: 0,
  };
}
function ca(e, t, n, r, i, a) {
  switch (e.state) {
    case Tt.IDLE:
      if ((aa(e, t), (e.wanderTimer -= t), e.wanderTimer > 0)) break;
      if (Math.random() < 0.3) {
        let t = na(e, r);
        if (t) {
          ((e.state = Tt.FOLLOW),
            (e.followTargetId = t.id),
            (e.followDuration = 0),
            (e.followRecalcTimer = 0),
            (e.followDurationLimit = Qi(5, 15)),
            (e.frame = 0),
            (e.frameTimer = 0));
          break;
        }
      }
      if (n.length > 0) {
        let t = n.filter((t) => t.col !== e.tileCol || t.row !== e.tileRow);
        if (t.length > 0) {
          let n = t[Math.floor(Math.random() * t.length)],
            r = zi(e.tileCol, e.tileRow, n.col, n.row, i, a);
          r.length > 0 &&
            ((e.state = Tt.WALK),
            (e.path = r),
            (e.moveProgress = 0),
            (e.frame = 0),
            (e.frameTimer = 0));
        }
      }
      e.wanderTimer = Qi(3, 15);
      break;
    case Tt.WALK:
      (ia(e, t),
        oa(e, t),
        e.path.length === 0 &&
          e.moveProgress === 0 &&
          ((e.state = Tt.IDLE), (e.wanderTimer = Qi(3, 15)), (e.frame = 0), (e.frameTimer = 0)));
      break;
    case Tt.FOLLOW: {
      e.followDuration += t;
      let n = e.followTargetId === null ? void 0 : r.get(e.followTargetId);
      if (!n) {
        ((e.state = Tt.IDLE),
          (e.followTargetId = null),
          (e.path = []),
          (e.moveProgress = 0),
          (e.frame = 0),
          (e.frameTimer = 0),
          (e.wanderTimer = Qi(3, 15)));
        break;
      }
      if (e.followDuration >= e.followDurationLimit) {
        ((e.state = Tt.IDLE),
          (e.followTargetId = null),
          (e.path = []),
          (e.moveProgress = 0),
          (e.frame = 0),
          (e.frameTimer = 0),
          (e.wanderTimer = Qi(3, 15)));
        break;
      }
      let o = ta(e.tileCol, e.tileRow, n.tileCol, n.tileRow);
      if (o <= 1) {
        (o === 1 && (e.dir = ea(e.tileCol, e.tileRow, n.tileCol, n.tileRow)),
          (e.state = Tt.IDLE),
          (e.followTargetId = null),
          (e.path = []),
          (e.moveProgress = 0),
          (e.frame = 0),
          (e.frameTimer = 0),
          (e.wanderTimer = Qi(3, 15)));
        break;
      }
      if (((e.followRecalcTimer -= t), e.followRecalcTimer <= 0)) {
        let t = ra(n, i, a);
        if (t) {
          let n = zi(e.tileCol, e.tileRow, t.col, t.row, i, a);
          n.length > 0 && ((e.path = n), (e.moveProgress = 0));
        }
        e.followRecalcTimer = 1;
      }
      (ia(e, t), oa(e, t));
      break;
    }
  }
}
function la(e, t) {
  if (!t) return null;
  if (e.state === Tt.IDLE) {
    let n = wt[e.frame % wt.length];
    switch (e.dir) {
      case F.DOWN:
        return t.idleDown[n];
      case F.UP:
        return t.idleUp[n];
      case F.RIGHT:
        return t.idleRight[n];
      case F.LEFT:
        return t.idleLeft[n];
    }
  }
  let n = Ct[e.frame % Ct.length];
  switch (e.dir) {
    case F.DOWN:
      return t.walkDown[n];
    case F.UP:
      return t.walkUp[n];
    case F.RIGHT:
      return t.walkRight[n];
    case F.LEFT:
      return t.walkLeft[n];
  }
}
function ua(e, t, n, r, i, a, o) {
  let s = 16 * i,
    c = Xr(),
    l = t.length,
    u = l > 0 ? t[0].length : 0,
    d = o ?? u;
  for (let o = 0; o < l; o++)
    for (let l = 0; l < u; l++) {
      let u = t[o][l];
      if (u === N.VOID) continue;
      if (u === N.WALL || !c) {
        if (u === N.WALL) {
          let t = o * d + l,
            n = a?.[t];
          e.fillStyle = n ? ji(n) : Fe;
        } else e.fillStyle = ve;
        e.fillRect(n + l * s, r + o * s, s, s);
        continue;
      }
      let f = o * d + l,
        p = Ii(Qr(u, a?.[f] ?? { h: 0, s: 0, b: 0, c: 0 }), i);
      e.drawImage(p, n + l * s, r + o * s);
    }
}
function da(e, t, n, r, i, a, o, s, c = []) {
  let l = [];
  for (let e of t) {
    let t = Ii(e.sprite, a),
      n = r + e.x * a,
      o = i + e.y * a;
    e.mirrored
      ? l.push({
          zY: e.zY,
          draw: (e) => {
            (e.save(),
              e.translate(n + t.width, o),
              e.scale(-1, 1),
              e.drawImage(t, 0, 0),
              e.restore());
          },
        })
      : l.push({
          zY: e.zY,
          draw: (e) => {
            e.drawImage(t, n, o);
          },
        });
  }
  for (let e of n) {
    let t = Gi(e, xi(e.palette, e.hueShift)),
      n = Ii(t, a),
      c = e.state === P.TYPE || e.state === P.BUSY ? 6 : 0,
      u = Math.round(r + e.x * a - n.width / 2),
      d = Math.round(i + (e.y + c) * a - n.height),
      f = e.y + 16 / 2 + ce;
    if (e.matrixEffect) {
      let n = u,
        r = d,
        i = t,
        o = e;
      l.push({
        zY: f,
        draw: (e) => {
          Zi(e, o, i, n, r, a);
        },
      });
      continue;
    }
    let p = o !== null && e.id === o,
      m = s !== null && e.id === s;
    if (p || m) {
      let e = p ? 1 : ue,
        n = Ii(Fi(t), a),
        r = u - a,
        i = d - a;
      l.push({
        zY: f - le,
        draw: (t) => {
          (t.save(), (t.globalAlpha = e), t.drawImage(n, r, i), t.restore());
        },
      });
    }
    l.push({
      zY: f,
      draw: (e) => {
        e.drawImage(n, u, d);
      },
    });
  }
  for (let e of c) {
    let t = la(e, ii(e.petType));
    if (!t) continue;
    let n = Ii(t, a),
      o = Math.round(r + e.x * a - n.width / 2),
      s = Math.round(i + e.y * a - n.height),
      c = e.y + 16 / 2;
    l.push({
      zY: c,
      draw: (e) => {
        e.drawImage(n, o, s);
      },
    });
  }
  l.sort((e, t) => e.zY - t.zY);
  for (let t of l) t.draw(e);
}
function fa(e, t, n, r, i, a, o, s) {
  if (r === null || !i) return;
  let c = n.get(r);
  if (c)
    for (let [n, r] of t) {
      if (r.seatCol !== i.col || r.seatRow !== i.row) continue;
      let t = 16 * s,
        l = a + r.seatCol * t,
        u = o + r.seatRow * t;
      (c.seatId === n ? (e.fillStyle = ye) : r.assigned ? (e.fillStyle = xe) : (e.fillStyle = be),
        e.fillRect(l, u, t, t));
      break;
    }
}
function pa(e, t, n, r, i, a, o) {
  let s = 16 * r;
  ((e.strokeStyle = Se), (e.lineWidth = 1), e.beginPath());
  for (let r = 0; r <= i; r++) {
    let i = t + r * s + 0.5;
    (e.moveTo(i, n), e.lineTo(i, n + a * s));
  }
  for (let r = 0; r <= a; r++) {
    let a = n + r * s + 0.5;
    (e.moveTo(t, a), e.lineTo(t + i * s, a));
  }
  if ((e.stroke(), o)) {
    (e.save(), (e.strokeStyle = Ce), (e.lineWidth = 1), e.setLineDash(we));
    for (let r = 0; r < a; r++)
      for (let a = 0; a < i; a++)
        o[r]?.[a] === N.VOID && e.strokeRect(t + a * s + 0.5, n + r * s + 0.5, s - 1, s - 1);
    e.restore();
  }
}
function ma(e, t, n, r, i, a, o, s) {
  let c = 16 * r;
  e.save();
  let l = [];
  for (let e = -1; e <= i; e++) (l.push({ c: e, r: -1 }), l.push({ c: e, r: a }));
  for (let e = 0; e < a; e++) (l.push({ c: -1, r: e }), l.push({ c: i, r: e }));
  for (let { c: r, r: i } of l) {
    let a = t + r * c,
      l = n + i * c,
      u = r === o && i === s;
    (u && ((e.fillStyle = Te), e.fillRect(a, l, c, c)),
      (e.strokeStyle = u ? Ee : De),
      (e.lineWidth = 1),
      e.setLineDash(we),
      e.strokeRect(a + 0.5, l + 0.5, c - 1, c - 1));
  }
  e.restore();
}
function ha(e, t, n, r, i, a, o, s, c = !1) {
  let l = Ii(t, s),
    u = a + n * 16 * s,
    d = o + r * 16 * s;
  (e.save(),
    (e.globalAlpha = M),
    c ? (e.translate(u + l.width, d), e.scale(-1, 1), e.drawImage(l, 0, 0)) : e.drawImage(l, u, d),
    e.restore(),
    e.save(),
    (e.globalAlpha = de),
    (e.fillStyle = i ? Oe : ke),
    e.fillRect(u, d, l.width, l.height),
    e.restore());
}
function ga(e, t, n, r, i, a, o, s) {
  let c = 16 * s,
    l = a + t * c,
    u = o + n * c;
  (e.save(),
    (e.strokeStyle = Ae),
    (e.lineWidth = 2),
    e.setLineDash(fe),
    e.strokeRect(l + 1, u + 1, r * c - 2, i * c - 2),
    e.restore());
}
function _a(e, t, n, r, i, a, o, s) {
  let c = 16 * s,
    l = a + (t + r) * c + 1,
    u = o + n * c - 1,
    d = Math.max(6, s * 3);
  (e.save(),
    e.beginPath(),
    e.arc(l, u, d, 0, Math.PI * 2),
    (e.fillStyle = je),
    e.fill(),
    (e.strokeStyle = Ne),
    (e.lineWidth = Math.max(me, s * he)),
    (e.lineCap = `round`));
  let f = d * pe;
  return (
    e.beginPath(),
    e.moveTo(l - f, u - f),
    e.lineTo(l + f, u + f),
    e.moveTo(l + f, u - f),
    e.lineTo(l - f, u + f),
    e.stroke(),
    e.restore(),
    { cx: l, cy: u, radius: d }
  );
}
function va(e, t, n, r, i, a, o, s) {
  let c = 16 * s,
    l = Math.max(6, s * 3),
    u = a + t * c - 1,
    d = o + n * c - 1;
  (e.save(),
    e.beginPath(),
    e.arc(u, d, l, 0, Math.PI * 2),
    (e.fillStyle = Me),
    e.fill(),
    (e.strokeStyle = Ne),
    (e.lineWidth = Math.max(me, s * he)),
    (e.lineCap = `round`));
  let f = l * pe;
  (e.beginPath(), e.arc(u, d, f, -Math.PI * 0.8, Math.PI * 0.7), e.stroke());
  let p = Math.PI * 0.7,
    m = u + f * Math.cos(p),
    h = d + f * Math.sin(p),
    g = l * 0.35;
  return (
    e.beginPath(),
    e.moveTo(m + g * 0.6, h - g * 0.3),
    e.lineTo(m, h),
    e.lineTo(m + g * 0.7, h + g * 0.5),
    e.stroke(),
    e.restore(),
    { cx: u, cy: d, radius: l }
  );
}
function ya(e, t, n, r, i) {
  for (let a of t) {
    if (!a.bubbleType || (a.bubbleType === `waiting` && a.waitingAwaitingInput)) continue;
    let t = a.bubbleType === `permission` ? di : fi,
      o = 1;
    a.bubbleType === `waiting` && a.bubbleTimer < 0.5 && (o = a.bubbleTimer / ge);
    let s = Ii(t, i),
      c = a.state === P.TYPE || a.state === P.BUSY ? 10 : 0,
      l = Math.round(n + a.x * i - s.width / 2),
      u = Math.round(r + (a.y + c - 24) * i - s.height - 1 * i);
    (e.save(), o < 1 && (e.globalAlpha = o), e.drawImage(s, l, u), e.restore());
  }
}
function ba(e, t, n, r, i) {
  for (let a of t) {
    if (a.roleTaskState !== `busy` && a.roleTaskState !== `weather`) continue;
    let t = a.state === P.TYPE || a.state === P.BUSY ? 10 : 0,
      o = Math.round(n + a.x * i),
      s = Math.round(r + (a.y + t - 24) * i),
      c = Math.max(18, Math.round(14 * i)),
      l = o - c / 2,
      u = s - c - 2 * i;
    if (
      (e.save(),
      (e.fillStyle = Ie),
      (e.strokeStyle = Le),
      (e.lineWidth = Math.max(2, Math.round(i))),
      e.beginPath(),
      e.roundRect(l, u, c, c, Math.max(3, Math.round(2 * i))),
      e.fill(),
      e.stroke(),
      a.roleTaskState === `busy` && a.roleTaskIcon === `weather`)
    ) {
      let t = [`sun`, `cloud`, `rain`, `snow`, `storm`];
      Ea(e, l, u, c, t[Math.floor((a.roleBusyIconTimer ?? 0) / _e) % t.length]);
    } else
      a.roleTaskIcon === `weather`
        ? Ea(e, l, u, c, a.weatherIcon ?? `cloud`)
        : xa(e, l, u, c, a.roleTaskIcon ?? `card`);
    e.restore();
  }
}
function xa(e, t, n, r, i) {
  if (i === `dresser`) {
    Sa(e, t, n, r);
    return;
  }
  if (i === `travel`) {
    Ca(e, t, n, r);
    return;
  }
  if (i === `captain`) {
    wa(e, t, n, r);
    return;
  }
  Ta(e, t, n, r);
}
function Sa(e, t, n, r) {
  ((e.fillStyle = We),
    e.beginPath(),
    e.moveTo(t + r * 0.36, n + r * 0.25),
    e.lineTo(t + r * 0.47, n + r * 0.34),
    e.lineTo(t + r * 0.53, n + r * 0.34),
    e.lineTo(t + r * 0.64, n + r * 0.25),
    e.lineTo(t + r * 0.82, n + r * 0.42),
    e.lineTo(t + r * 0.7, n + r * 0.55),
    e.lineTo(t + r * 0.66, n + r * 0.48),
    e.lineTo(t + r * 0.66, n + r * 0.78),
    e.lineTo(t + r * 0.34, n + r * 0.78),
    e.lineTo(t + r * 0.34, n + r * 0.48),
    e.lineTo(t + r * 0.3, n + r * 0.55),
    e.lineTo(t + r * 0.18, n + r * 0.42),
    e.closePath(),
    e.fill(),
    (e.strokeStyle = qe),
    (e.lineWidth = Math.max(1, r * 0.055)),
    e.stroke());
}
function Ca(e, t, n, r) {
  ((e.strokeStyle = qe),
    (e.lineWidth = Math.max(1, r * 0.06)),
    e.beginPath(),
    e.arc(t + r * 0.5, n + r * 0.33, r * 0.14, Math.PI, Math.PI * 2),
    e.stroke(),
    (e.fillStyle = Ge),
    e.fillRect(t + r * 0.32, n + r * 0.36, r * 0.36, r * 0.42),
    e.strokeRect(t + r * 0.32, n + r * 0.36, r * 0.36, r * 0.42),
    (e.fillStyle = Je),
    e.fillRect(t + r * 0.39, n + r * 0.52, r * 0.22, r * 0.12));
}
function wa(e, t, n, r) {
  ((e.fillStyle = Ke),
    e.fillRect(t + r * 0.3, n + r * 0.26, r * 0.4, r * 0.52),
    (e.strokeStyle = qe),
    (e.lineWidth = Math.max(1, r * 0.055)),
    e.strokeRect(t + r * 0.3, n + r * 0.26, r * 0.4, r * 0.52),
    (e.fillStyle = qe),
    e.fillRect(t + r * 0.4, n + r * 0.2, r * 0.2, r * 0.11),
    (e.strokeStyle = Je),
    (e.lineWidth = Math.max(1, r * 0.045)));
  for (let i of [0.42, 0.56, 0.7])
    (e.beginPath(),
      e.moveTo(t + r * 0.38, n + r * i),
      e.lineTo(t + r * 0.44, n + r * (i + 0.05)),
      e.lineTo(t + r * 0.62, n + r * (i - 0.04)),
      e.stroke());
}
function Ta(e, t, n, r) {
  ((e.fillStyle = Je),
    e.fillRect(t + r * 0.28, n + r * 0.28, r * 0.44, r * 0.48),
    (e.strokeStyle = qe),
    (e.lineWidth = Math.max(1, r * 0.055)),
    e.strokeRect(t + r * 0.28, n + r * 0.28, r * 0.44, r * 0.48),
    (e.fillStyle = qe),
    e.fillRect(t + r * 0.36, n + r * 0.42, r * 0.28, r * 0.06),
    e.fillRect(t + r * 0.36, n + r * 0.56, r * 0.22, r * 0.06));
}
function Ea(e, t, n, r, i) {
  if (i === `sun`) {
    Da(e, t, n, r);
    return;
  }
  if (i === `snow`) {
    (Oa(e, t, n, r), ka(e, t, n, r, He, !0));
    return;
  }
  if (i === `rain`) {
    (Oa(e, t, n, r), ka(e, t, n, r, Ve, !1));
    return;
  }
  if (i === `storm`) {
    (Oa(e, t, n, r),
      (e.fillStyle = Ue),
      e.beginPath(),
      e.moveTo(t + r * 0.48, n + r * 0.5),
      e.lineTo(t + r * 0.38, n + r * 0.72),
      e.lineTo(t + r * 0.5, n + r * 0.7),
      e.lineTo(t + r * 0.42, n + r * 0.9),
      e.lineTo(t + r * 0.64, n + r * 0.62),
      e.lineTo(t + r * 0.52, n + r * 0.64),
      e.closePath(),
      e.fill());
    return;
  }
  Oa(e, t, n, r);
}
function Da(e, t, n, r) {
  let i = t + r / 2,
    a = n + r / 2;
  ((e.strokeStyle = ze), (e.lineWidth = Math.max(1, r * 0.08)));
  for (let t = 0; t < 8; t++) {
    let n = (Math.PI * 2 * t) / 8;
    (e.beginPath(),
      e.moveTo(i + Math.cos(n) * r * 0.25, a + Math.sin(n) * r * 0.25),
      e.lineTo(i + Math.cos(n) * r * 0.38, a + Math.sin(n) * r * 0.38),
      e.stroke());
  }
  ((e.fillStyle = Re), e.beginPath(), e.arc(i, a, r * 0.2, 0, Math.PI * 2), e.fill());
}
function Oa(e, t, n, r) {
  ((e.fillStyle = Be),
    e.beginPath(),
    e.arc(t + r * 0.38, n + r * 0.52, r * 0.16, Math.PI, Math.PI * 2),
    e.arc(t + r * 0.52, n + r * 0.43, r * 0.2, Math.PI, Math.PI * 2),
    e.arc(t + r * 0.66, n + r * 0.54, r * 0.15, Math.PI, Math.PI * 2),
    e.lineTo(t + r * 0.78, n + r * 0.64),
    e.lineTo(t + r * 0.25, n + r * 0.64),
    e.closePath(),
    e.fill());
}
function ka(e, t, n, r, i, a) {
  e.fillStyle = i;
  for (let i of [0.38, 0.52, 0.66])
    a
      ? e.fillRect(t + r * i, n + r * 0.72, Math.max(2, r * 0.08), Math.max(2, r * 0.08))
      : (e.beginPath(),
        e.ellipse(t + r * i, n + r * 0.76, r * 0.035, r * 0.09, 0, 0, Math.PI * 2),
        e.fill());
}
function Aa(e, t, n, r, i) {
  for (let a of t) {
    if (!a.bubbleType) continue;
    let t = pi,
      o = 1;
    a.bubbleTimer < 0.5 && (o = Math.max(0, a.bubbleTimer / ge));
    let s = Ii(t, i),
      c = Math.round(n + a.x * i - s.width / 2),
      l = Math.round(r + (a.y - 16) * i - s.height - 1 * i);
    (e.save(), o < 1 && (e.globalAlpha = o), e.drawImage(s, c, l), e.restore());
  }
}
function ja(e, t, n, r, i, a, o, s, c, l, u, d, f, p, m) {
  e.clearRect(0, 0, t, n);
  let h = f ?? (r.length > 0 ? r[0].length : 0),
    g = p ?? r.length,
    _ = h * 16 * o,
    v = g * 16 * o,
    y = Math.floor((t - _) / 2) + Math.round(s),
    b = Math.floor((n - v) / 2) + Math.round(c);
  (ua(e, r, y, b, o, d, f),
    l && fa(e, l.seats, l.characters, l.selectedAgentId, l.hoveredTile, y, b, o));
  let x = wi() ? Ai(r, d, f) : [];
  return (
    da(
      e,
      x.length > 0 ? [...x, ...i] : i,
      a,
      y,
      b,
      o,
      l?.selectedAgentId ?? null,
      l?.hoveredAgentId ?? null,
      m ?? [],
    ),
    ya(e, a, y, b, o),
    ba(e, a, y, b, o),
    m && m.length > 0 && Aa(e, m, y, b, o),
    u &&
      (u.showGrid && pa(e, y, b, o, h, g, r),
      u.showGhostBorder && ma(e, y, b, o, h, g, u.ghostBorderHoverCol, u.ghostBorderHoverRow),
      u.ghostSprite &&
        u.ghostCol >= 0 &&
        ha(e, u.ghostSprite, u.ghostCol, u.ghostRow, u.ghostValid, y, b, o, u.ghostMirrored),
      u.hasSelection
        ? (ga(e, u.selectedCol, u.selectedRow, u.selectedW, u.selectedH, y, b, o),
          (u.deleteButtonBounds = _a(
            e,
            u.selectedCol,
            u.selectedRow,
            u.selectedW,
            u.selectedH,
            y,
            b,
            o,
          )),
          u.isRotatable
            ? (u.rotateButtonBounds = va(
                e,
                u.selectedCol,
                u.selectedRow,
                u.selectedW,
                u.selectedH,
                y,
                b,
                o,
              ))
            : (u.rotateButtonBounds = null))
        : ((u.deleteButtonBounds = null), (u.rotateButtonBounds = null))),
    { offsetX: y, offsetY: b }
  );
}
function Ma(e) {
  if (e.hitId !== null || e.petId !== null) return `pointer`;
  if (e.selectedAgentId !== null && e.tile) {
    let t = e.getSeatAtTile(e.tile.col, e.tile.row);
    if (t) {
      let n = e.getSeat(t);
      if (n) {
        let r = e.getCharacter(e.selectedAgentId);
        if (!n.assigned || (r && r.seatId === t)) return `pointer`;
      }
    }
  }
  return `default`;
}
function Na({
  officeState: e,
  onClick: t,
  isEditMode: n,
  editorState: r,
  onEditorTileAction: i,
  onEditorEraseAction: a,
  onEditorSelectionChange: o,
  onDeleteSelected: s,
  onRotateSelected: c,
  onDragMove: u,
  onRoleDrop: d,
  editorTick: f,
  zoom: p,
  onZoomChange: m,
  panRef: g,
}) {
  let _ = (0, l.useRef)(null),
    v = (0, l.useRef)(null),
    y = (0, l.useRef)({ x: 0, y: 0 }),
    b = (0, l.useRef)(!1),
    x = (0, l.useRef)({ mouseX: 0, mouseY: 0, panX: 0, panY: 0 }),
    S = (0, l.useRef)(null),
    C = (0, l.useRef)(null),
    T = (0, l.useRef)(!1),
    E = (0, l.useRef)(0),
    ee = (0, l.useCallback)(
      (t, n) => {
        let r = _.current;
        if (!r) return { x: t, y: n };
        let i = e.getLayout(),
          a = i.cols * 16 * p,
          o = i.rows * 16 * p,
          s = r.width * Qe,
          c = r.height * Qe,
          l = a / 2 + r.width / 2 - s,
          u = o / 2 + r.height / 2 - c;
        return { x: Math.max(-l, Math.min(l, t)), y: Math.max(-u, Math.min(u, n)) };
      },
      [e, p],
    ),
    D = (0, l.useCallback)(() => {
      let e = _.current,
        t = v.current;
      if (!e || !t) return;
      let n = t.getBoundingClientRect(),
        r = window.devicePixelRatio || 1;
      ((e.width = Math.round(n.width * r)),
        (e.height = Math.round(n.height * r)),
        (e.style.width = `${n.width}px`),
        (e.style.height = `${n.height}px`));
    }, []);
  (0, l.useEffect)(() => {
    let t = _.current;
    if (!t) return;
    D();
    let i = new ResizeObserver(() => D());
    v.current && i.observe(v.current);
    let a = Pi(t, {
      update: (t) => {
        e.update(t);
      },
      render: (i) => {
        let a = t.width,
          o = t.height,
          s;
        if (n) {
          let t =
            r.activeTool === I.TILE_PAINT ||
            r.activeTool === I.WALL_PAINT ||
            r.activeTool === I.ERASE;
          if (
            ((s = {
              showGrid: !0,
              ghostSprite: null,
              ghostMirrored: !1,
              ghostCol: r.ghostCol,
              ghostRow: r.ghostRow,
              ghostValid: r.ghostValid,
              selectedCol: 0,
              selectedRow: 0,
              selectedW: 0,
              selectedH: 0,
              hasSelection: !1,
              isRotatable: !1,
              deleteButtonBounds: null,
              rotateButtonBounds: null,
              showGhostBorder: t,
              ghostBorderHoverCol: t ? r.ghostCol : -999,
              ghostBorderHoverRow: t ? r.ghostRow : -999,
            }),
            r.activeTool === I.FURNITURE_PLACE && r.ghostCol >= 0)
          ) {
            let t = Yn(r.selectedFurnitureType);
            if (t) {
              let n = Pr(r.selectedFurnitureType, r.ghostRow);
              ((s.ghostSprite = t.sprite),
                (s.ghostRow = n),
                (s.ghostMirrored = !!t.mirrorSide && r.selectedFurnitureType.endsWith(`:left`)),
                (s.ghostValid = Fr(e.getLayout(), r.selectedFurnitureType, r.ghostCol, n)));
            }
          }
          if (r.isDragMoving && r.dragUid && r.ghostCol >= 0) {
            let t = e.getLayout().furniture.find((e) => e.uid === r.dragUid);
            if (t) {
              let n = Yn(t.type);
              if (n) {
                let i = r.ghostCol - r.dragOffsetCol,
                  a = r.ghostRow - r.dragOffsetRow;
                ((s.ghostSprite = n.sprite),
                  (s.ghostCol = i),
                  (s.ghostRow = a),
                  (s.ghostMirrored = !!n.mirrorSide && t.type.endsWith(`:left`)),
                  (s.ghostValid = Fr(e.getLayout(), t.type, i, a, r.dragUid)));
              }
            }
          }
          if (r.selectedFurnitureUid && !r.isDragMoving) {
            let t = e.getLayout().furniture.find((e) => e.uid === r.selectedFurnitureUid);
            if (t) {
              let e = Yn(t.type);
              e &&
                ((s.hasSelection = !0),
                (s.selectedCol = t.col),
                (s.selectedRow = t.row),
                (s.selectedW = e.footprintW),
                (s.selectedH = e.footprintH),
                (s.isRotatable = nr(t.type)));
            }
          }
        }
        if (e.cameraFollowId !== null) {
          let t = e.characters.get(e.cameraFollowId);
          if (t) {
            let n = e.getLayout(),
              r = n.cols * 16 * p,
              i = n.rows * 16 * p,
              a = r / 2 - t.x * p,
              o = i / 2 - t.y * p,
              s = a - g.current.x,
              c = o - g.current.y;
            Math.abs(s) < 0.5 && Math.abs(c) < 0.5
              ? (g.current = { x: a, y: o })
              : (g.current = { x: g.current.x + s * Ye, y: g.current.y + c * Ye });
          }
        }
        let c = {
            selectedAgentId: e.selectedAgentId,
            hoveredAgentId: e.hoveredAgentId,
            hoveredTile: e.hoveredTile,
            seats: e.seats,
            characters: e.characters,
          },
          { offsetX: l, offsetY: u } = ja(
            i,
            a,
            o,
            e.tileMap,
            e.furniture,
            e.getCharacters(),
            p,
            g.current.x,
            g.current.y,
            c,
            s,
            e.getLayout().tileColors,
            e.getLayout().cols,
            e.getLayout().rows,
            e.pets,
          );
        ((y.current = { x: l, y: u }),
          (S.current = s?.deleteButtonBounds ?? null),
          (C.current = s?.rotateButtonBounds ?? null));
      },
    });
    return () => {
      (a(), i.disconnect());
    };
  }, [e, D, n, r, f, p, g]);
  let O = (0, l.useCallback)(
      (e, t) => {
        let n = _.current;
        if (!n) return null;
        let r = n.getBoundingClientRect(),
          i = window.devicePixelRatio || 1,
          a = e - r.left,
          o = t - r.top,
          s = a * i,
          c = o * i;
        return {
          worldX: (s - y.current.x) / p,
          worldY: (c - y.current.y) / p,
          screenX: a,
          screenY: o,
          deviceX: s,
          deviceY: c,
        };
      },
      [p],
    ),
    k = (0, l.useCallback)(
      (t, i) => {
        let a = O(t, i);
        if (!a) return null;
        let o = Math.floor(a.worldX / 16),
          s = Math.floor(a.worldY / 16),
          c = e.getLayout();
        return n &&
          (r.activeTool === I.TILE_PAINT ||
            r.activeTool === I.WALL_PAINT ||
            r.activeTool === I.ERASE)
          ? o < -1 || o > c.cols || s < -1 || s > c.rows
            ? null
            : { col: o, row: s }
          : o < 0 || o >= c.cols || s < 0 || s >= c.rows
            ? null
            : { col: o, row: s };
      },
      [O, e, n, r],
    ),
    te = (0, l.useCallback)((e, t) => {
      let n = S.current;
      if (!n) return !1;
      let r = e - n.cx,
        i = t - n.cy;
      return r * r + i * i <= (n.radius + 2) * (n.radius + 2);
    }, []),
    ne = (0, l.useCallback)((e, t) => {
      let n = C.current;
      if (!n) return !1;
      let r = e - n.cx,
        i = t - n.cy;
      return r * r + i * i <= (n.radius + 2) * (n.radius + 2);
    }, []),
    re = (0, l.useCallback)(
      (t) => {
        if (b.current) {
          let e = window.devicePixelRatio || 1,
            n = (t.clientX - x.current.mouseX) * e,
            r = (t.clientY - x.current.mouseY) * e;
          g.current = ee(x.current.panX + n, x.current.panY + r);
          return;
        }
        if (n) {
          let n = k(t.clientX, t.clientY);
          if (n) {
            if (
              ((r.ghostCol = n.col),
              (r.ghostRow = n.row),
              r.dragUid &&
                !r.isDragMoving &&
                (n.col !== r.dragStartCol || n.row !== r.dragStartRow) &&
                (r.isDragMoving = !0),
              r.isDragging &&
                (r.activeTool === I.TILE_PAINT ||
                  r.activeTool === I.WALL_PAINT ||
                  r.activeTool === I.ERASE) &&
                !r.dragUid &&
                i(n.col, n.row),
              T.current &&
                (r.activeTool === I.TILE_PAINT ||
                  r.activeTool === I.WALL_PAINT ||
                  r.activeTool === I.ERASE))
            ) {
              let t = e.getLayout();
              n.col >= 0 && n.col < t.cols && n.row >= 0 && n.row < t.rows && a(n.col, n.row);
            }
          } else ((r.ghostCol = -1), (r.ghostRow = -1));
          let o = _.current;
          if (o)
            if (r.isDragMoving) o.style.cursor = `grabbing`;
            else {
              let i = O(t.clientX, t.clientY);
              if (i && (te(i.deviceX, i.deviceY) || ne(i.deviceX, i.deviceY)))
                o.style.cursor = `pointer`;
              else if (r.activeTool === I.FURNITURE_PICK && n) {
                let t = e.getLayout().furniture.find((e) => {
                  let t = Yn(e.type);
                  return t
                    ? n.col >= e.col &&
                        n.col < e.col + t.footprintW &&
                        n.row >= e.row &&
                        n.row < e.row + t.footprintH
                    : !1;
                });
                o.style.cursor = t ? `pointer` : `crosshair`;
              } else if (
                (r.activeTool === I.SELECT ||
                  (r.activeTool === I.FURNITURE_PLACE && r.selectedFurnitureType === ``)) &&
                n
              ) {
                let t = e.getLayout().furniture.find((e) => {
                  let t = Yn(e.type);
                  return t
                    ? n.col >= e.col &&
                        n.col < e.col + t.footprintW &&
                        n.row >= e.row &&
                        n.row < e.row + t.footprintH
                    : !1;
                });
                o.style.cursor = t ? `grab` : `crosshair`;
              } else o.style.cursor = `crosshair`;
            }
          return;
        }
        let o = O(t.clientX, t.clientY);
        if (!o) return;
        let s = e.getCharacterAt(o.worldX, o.worldY),
          c = s === null ? e.getPetAt(o.worldX, o.worldY) : null,
          l = k(t.clientX, t.clientY);
        e.hoveredTile = l;
        let u = _.current;
        (u &&
          (u.style.cursor = Ma({
            hitId: s,
            petId: c,
            selectedAgentId: e.selectedAgentId,
            tile: l,
            getSeatAtTile: (t, n) => e.getSeatAtTile(t, n),
            getSeat: (t) => e.seats.get(t),
            getCharacter: (t) => e.characters.get(t),
          })),
          (e.hoveredAgentId = s));
      },
      [e, O, k, n, r, i, a, g, te, ne, ee],
    ),
    ie = (0, l.useCallback)(
      (t) => {
        if ((Nn(), t.button === 1)) {
          (t.preventDefault(),
            (e.cameraFollowId = null),
            (b.current = !0),
            (x.current = {
              mouseX: t.clientX,
              mouseY: t.clientY,
              panX: g.current.x,
              panY: g.current.y,
            }));
          let n = _.current;
          n && (n.style.cursor = `grabbing`);
          return;
        }
        if (t.button === 2 && n) {
          let n = k(t.clientX, t.clientY);
          if (
            n &&
            (r.activeTool === I.TILE_PAINT ||
              r.activeTool === I.WALL_PAINT ||
              r.activeTool === I.ERASE)
          ) {
            let t = e.getLayout();
            n.col >= 0 &&
              n.col < t.cols &&
              n.row >= 0 &&
              n.row < t.rows &&
              ((T.current = !0), a(n.col, n.row));
          }
          return;
        }
        if (!n) return;
        let l = O(t.clientX, t.clientY);
        if (l && ne(l.deviceX, l.deviceY)) {
          c();
          return;
        }
        if (l && te(l.deviceX, l.deviceY)) {
          s();
          return;
        }
        let u = k(t.clientX, t.clientY);
        if (
          (r.activeTool === I.SELECT ||
            (r.activeTool === I.FURNITURE_PLACE && r.selectedFurnitureType === ``)) &&
          u
        ) {
          let t = e.getLayout(),
            n = null;
          for (let e of t.furniture) {
            let t = Yn(e.type);
            t &&
              u.col >= e.col &&
              u.col < e.col + t.footprintW &&
              u.row >= e.row &&
              u.row < e.row + t.footprintH &&
              (!n || t.canPlaceOnSurfaces) &&
              (n = e);
          }
          if (n) {
            r.startDrag(n.uid, u.col, u.row, u.col - n.col, u.row - n.row);
            return;
          } else (r.clearSelection(), o());
        }
        ((r.isDragging = !0), u && i(u.col, u.row));
      },
      [e, n, r, k, O, i, a, o, s, c, te, ne, g],
    ),
    ae = (0, l.useCallback)(
      (t) => {
        if (t.button === 1) {
          b.current = !1;
          let e = _.current;
          e && (e.style.cursor = n ? `crosshair` : `default`);
          return;
        }
        if (t.button === 2) {
          T.current = !1;
          return;
        }
        if (r.dragUid) {
          if (r.isDragMoving) {
            let t = r.ghostCol - r.dragOffsetCol,
              n = r.ghostRow - r.dragOffsetRow,
              i = e.getLayout().furniture.find((e) => e.uid === r.dragUid);
            (i && Fr(e.getLayout(), i.type, t, n, r.dragUid) && u(r.dragUid, t, n),
              r.clearSelection());
          } else
            r.selectedFurnitureUid === r.dragUid
              ? r.clearSelection()
              : (r.selectedFurnitureUid = r.dragUid);
          (r.clearDrag(), o());
          let t = _.current;
          t && (t.style.cursor = `crosshair`);
          return;
        }
        ((r.isDragging = !1), (r.wallDragAdding = null));
      },
      [r, n, e, u, o],
    ),
    A = (0, l.useCallback)(
      (r) => {
        if (n) return;
        let i = O(r.clientX, r.clientY);
        if (!i) return;
        let a = e.getCharacterAt(i.worldX, i.worldY);
        if (a !== null) {
          (e.dismissBubble(a),
            e.selectedAgentId === a
              ? ((e.selectedAgentId = null), (e.cameraFollowId = null))
              : ((e.selectedAgentId = a), (e.cameraFollowId = a)),
            t(a));
          return;
        }
        let o = e.getPetAt(i.worldX, i.worldY);
        if (o !== null) {
          e.pets.find((e) => e.id === o)?.bubbleType ? e.dismissPetBubble(o) : e.showPetBubble(o);
          return;
        }
        if (e.selectedAgentId !== null) {
          let t = e.characters.get(e.selectedAgentId);
          if (t && !t.isSubagent) {
            let n = k(r.clientX, r.clientY);
            if (n) {
              let r = e.getSeatAtTile(n.col, n.row);
              if (r) {
                let n = e.seats.get(r);
                if (n && t) {
                  if (t.seatId === r) {
                    (e.sendToSeat(e.selectedAgentId),
                      (e.selectedAgentId = null),
                      (e.cameraFollowId = null));
                    return;
                  } else if (!n.assigned) {
                    (e.reassignSeat(e.selectedAgentId, r),
                      (e.selectedAgentId = null),
                      (e.cameraFollowId = null));
                    let t = {};
                    for (let n of e.characters.values())
                      n.isSubagent ||
                        (t[n.id] = { palette: n.palette, hueShift: n.hueShift, seatId: n.seatId });
                    w.send({ type: `saveAgentSeats`, seats: t });
                    return;
                  }
                }
              }
            }
          }
          ((e.selectedAgentId = null), (e.cameraFollowId = null));
        }
      },
      [e, t, O, k, n],
    ),
    j = (0, l.useCallback)(() => {
      if (
        ((b.current = !1),
        (T.current = !1),
        (r.isDragging = !1),
        (r.wallDragAdding = null),
        r.clearDrag(),
        (r.ghostCol = -1),
        (r.ghostRow = -1),
        (e.hoveredAgentId = null),
        (e.hoveredTile = null),
        !n)
      ) {
        let e = _.current;
        e && (e.style.cursor = `default`);
      }
    }, [e, r, n]),
    oe = (0, l.useCallback)(
      (t) => {
        if ((t.preventDefault(), !n && e.selectedAgentId !== null)) {
          let n = k(t.clientX, t.clientY);
          n && e.walkToTile(e.selectedAgentId, n.col, n.row);
        }
      },
      [n, e, k],
    ),
    se = (0, l.useCallback)(
      (t) => {
        if ((t.preventDefault(), t.ctrlKey || t.metaKey)) {
          if (((E.current += t.deltaY), Math.abs(E.current) >= 50)) {
            let e = E.current < 0 ? 1 : -1;
            E.current = 0;
            let t = Math.max(1, Math.min(10, p + e));
            t !== p && m(t);
          }
        } else {
          let n = window.devicePixelRatio || 1;
          ((e.cameraFollowId = null),
            (g.current = ee(g.current.x - t.deltaX * n, g.current.y - t.deltaY * n)));
        }
      },
      [p, m, e, g, ee],
    );
  (0, l.useEffect)(() => {
    let e = _.current;
    if (e)
      return (
        e.addEventListener(`wheel`, se, { passive: !1 }),
        () => e.removeEventListener(`wheel`, se)
      );
  }, [se]);
  let ce = (0, l.useCallback)((e) => {
    e.button === 1 && e.preventDefault();
  }, []);
  return (0, h.jsx)(`div`, {
    ref: v,
    onDragOver: (0, l.useCallback)(
      (e) => {
        !d ||
          !n ||
          (e.dataTransfer.types.includes(`application/x-pixel-role`) &&
            (e.preventDefault(), (e.dataTransfer.dropEffect = `copy`)));
      },
      [n, d],
    ),
    onDrop: (0, l.useCallback)(
      (e) => {
        if (!d || !n) return;
        let t = e.dataTransfer.getData(`application/x-pixel-role`);
        if (!t) return;
        let r = k(e.clientX, e.clientY);
        r && (e.preventDefault(), d(t, r.col, r.row));
      },
      [n, d, k],
    ),
    className: `w-full h-full relative overflow-hidden bg-bg`,
    children: (0, h.jsx)(`canvas`, {
      ref: _,
      onMouseMove: re,
      onMouseDown: ie,
      onMouseUp: ae,
      onClick: A,
      onAuxClick: ce,
      onMouseLeave: j,
      onContextMenu: oe,
      className: `block`,
    }),
  });
}
var Pa = `Waiting for input`;
function Fa(e, t, n, r, i) {
  if (r === `permission`) return `Needs approval`;
  if (r === `waiting` && i) return Pa;
  let a = t[e];
  if (a && a.length > 0) {
    let e = [...a].reverse().find((e) => !e.done);
    if (e) return e.permissionWait ? `Needs approval` : e.status;
    if (n) {
      let e = a[a.length - 1];
      if (e) return e.status;
    }
  }
  return `Idle`;
}
function Ia(e) {
  return e >= 0.95 ? bt : e >= 0.8 ? yt : e >= 0.6 ? vt : _t;
}
function La({
  officeState: e,
  agents: t,
  agentTools: n,
  agentAwaitingInput: r,
  subagentCharacters: i,
  containerRef: a,
  zoom: o,
  panRef: s,
  onCloseAgent: c,
  alwaysShowOverlay: u,
}) {
  let [, d] = (0, l.useState)(0);
  (0, l.useEffect)(() => {
    let e = 0,
      t = () => {
        (d((e) => e + 1), (e = requestAnimationFrame(t)));
      };
    return ((e = requestAnimationFrame(t)), () => cancelAnimationFrame(e));
  }, []);
  let f = a.current;
  if (!f) return null;
  let p = f.getBoundingClientRect(),
    m = window.devicePixelRatio || 1,
    g = Math.round(p.width * m),
    _ = Math.round(p.height * m),
    v = e.getLayout(),
    b = v.cols * 16 * o,
    x = v.rows * 16 * o,
    S = Math.floor((g - b) / 2) + Math.round(s.current.x),
    C = Math.floor((_ - x) / 2) + Math.round(s.current.y),
    w = e.selectedAgentId,
    T = e.hoveredAgentId;
  return (0, h.jsx)(h.Fragment, {
    children: [...t, ...i.map((e) => e.id)].map((t) => {
      let a = e.characters.get(t);
      if (!a) return null;
      let s = w === t,
        l = T === t,
        d = a.isSubagent;
      if (!u && !s && !l) return null;
      let f = a.state === P.TYPE || a.state === P.BUSY ? 6 : 0,
        p = (S + a.x * o) / m,
        g = (C + (a.y + f - 32) * o) / m;
      if (a.bubbleType === `waiting` && !a.waitingAwaitingInput && !s && !l)
        return (0, h.jsx)(
          `div`,
          {
            className: `absolute`,
            style: { left: p, top: g, pointerEvents: `none` },
            'data-testid': `agent-overlay`,
            'data-agent-id': t,
          },
          t,
        );
      let _ = a.bubbleType === `waiting`,
        v = d && a.bubbleType === `permission`,
        b;
      if (_ && a.waitingAwaitingInput) b = Pa;
      else if (!d && r[t]) b = Pa;
      else if (d)
        if (v) b = `Needs approval`;
        else {
          let e = i.find((e) => e.id === t);
          b = e ? e.label : `Subtask`;
        }
      else b = Fa(t, n, a.isActive, a.bubbleType, a.waitingAwaitingInput ?? !1);
      let x = n[t],
        E = v || x?.some((e) => e.permissionWait && !e.done),
        ee = x?.some((e) => !e.done),
        D = a.isActive,
        O = a.bubbleType === `waiting`,
        k = null;
      E || O
        ? (k = `var(--color-status-permission)`)
        : D && ee && (k = `var(--color-status-active)`);
      let te = !!a.teamName,
        ne = a.isTeamLead ? `LEAD` : a.agentName || null,
        re = a.inputTokens + a.outputTokens,
        ie = re / gt;
      return (0, h.jsxs)(
        `div`,
        {
          className: `absolute flex flex-col items-center -translate-x-1/2`,
          style: {
            left: p,
            top: g - (a.folderName || ne ? 34 : 28),
            pointerEvents: s ? `auto` : `none`,
            opacity: u && !s && !l ? (d ? 0.5 : 0.75) : 1,
            zIndex: s ? 42 : 41,
          },
          'data-testid': `agent-overlay`,
          'data-agent-id': t,
          children: [
            (0, h.jsxs)(`div`, {
              className: `flex items-center border-border px-8 pt-2 pb-4 gap-5 pixel-panel whitespace-nowrap max-w-2xs`,
              children: [
                k &&
                  (0, h.jsx)(`span`, {
                    className: `w-6 h-6 rounded-full shrink-0 ${D && !E && !O ? `pixel-pulse` : ``}`,
                    style: { background: k },
                  }),
                (0, h.jsxs)(`div`, {
                  className: `flex flex-col gap-0 overflow-hidden`,
                  children: [
                    ne &&
                      (0, h.jsx)(`span`, {
                        className: `overflow-hidden text-ellipsis block leading-none`,
                        style: {
                          fontSize: `18px`,
                          color: a.isTeamLead ? `#ffd700` : `#66aaff`,
                          fontWeight: a.isTeamLead ? `bold` : void 0,
                        },
                        children: ne,
                      }),
                    (0, h.jsx)(`span`, {
                      className: `overflow-hidden text-ellipsis block leading-none`,
                      style: { fontSize: d ? `20px` : `22px`, fontStyle: d ? `italic` : void 0 },
                      children: b,
                    }),
                    a.folderName &&
                      (0, h.jsx)(`span`, {
                        className: `text-2xs leading-none overflow-hidden text-ellipsis block`,
                        children: a.folderName,
                      }),
                  ],
                }),
                s &&
                  !d &&
                  (0, h.jsx)(y, {
                    variant: `ghost`,
                    size: `icon`,
                    onClick: (e) => {
                      (e.stopPropagation(), c(t));
                    },
                    title: `Close agent`,
                    className: `ml-2 shrink-0 leading-none`,
                    children: `×`,
                  }),
              ],
            }),
            te &&
              re > 0 &&
              (0, h.jsx)(`div`, {
                style: { width: 40, height: 4, background: `#222`, marginTop: 2 },
                title: `${Math.round(ie * 100)}% context used (${(re / 1e3).toFixed(0)}k tokens)`,
                children: (0, h.jsx)(`div`, {
                  style: {
                    width: `${Math.min(ie * 100, 100)}%`,
                    height: `100%`,
                    background: Ia(ie),
                  },
                }),
              }),
          ],
        },
        t,
      );
    }),
  });
}
var Ra = class {
  isEditMode = !1;
  activeTool = I.SELECT;
  selectedTileType = N.FLOOR_1;
  selectedFurnitureType = ``;
  floorColor = { ...$e };
  wallColor = { ...et };
  selectedWallSet = 0;
  wallDragAdding = null;
  pickedFurnitureColor = null;
  ghostCol = -1;
  ghostRow = -1;
  ghostValid = !1;
  selectedFurnitureUid = null;
  isDragging = !1;
  undoStack = [];
  redoStack = [];
  isDirty = !1;
  dragUid = null;
  dragStartCol = 0;
  dragStartRow = 0;
  dragOffsetCol = 0;
  dragOffsetRow = 0;
  isDragMoving = !1;
  pushUndo(e) {
    (this.undoStack.push(e), this.undoStack.length > 50 && this.undoStack.shift());
  }
  popUndo() {
    return this.undoStack.pop() || null;
  }
  pushRedo(e) {
    (this.redoStack.push(e), this.redoStack.length > 50 && this.redoStack.shift());
  }
  popRedo() {
    return this.redoStack.pop() || null;
  }
  clearRedo() {
    this.redoStack = [];
  }
  clearSelection() {
    this.selectedFurnitureUid = null;
  }
  clearGhost() {
    ((this.ghostCol = -1), (this.ghostRow = -1), (this.ghostValid = !1));
  }
  startDrag(e, t, n, r, i) {
    ((this.dragUid = e),
      (this.dragStartCol = t),
      (this.dragStartRow = n),
      (this.dragOffsetCol = r),
      (this.dragOffsetRow = i),
      (this.isDragMoving = !1));
  }
  clearDrag() {
    ((this.dragUid = null), (this.isDragMoving = !1));
  }
  reset() {
    ((this.activeTool = I.SELECT),
      (this.selectedFurnitureUid = null),
      (this.ghostCol = -1),
      (this.ghostRow = -1),
      (this.ghostValid = !1),
      (this.isDragging = !1),
      (this.wallDragAdding = null),
      (this.undoStack = []),
      (this.redoStack = []),
      (this.isDirty = !1),
      (this.dragUid = null),
      (this.isDragMoving = !1));
  }
};
function za({ label: e, value: t, min: n, max: r, onChange: i }) {
  return (0, h.jsxs)(`div`, {
    className: `flex items-center gap-4`,
    children: [
      (0, h.jsx)(`span`, {
        className: `text-sm text-text-muted w-28 text-right shrink-0`,
        children: e,
      }),
      (0, h.jsx)(`input`, {
        type: `range`,
        min: n,
        max: r,
        value: t,
        onChange: (e) => i(Number(e.target.value)),
        className: `flex-1 h-12 accent-accent`,
      }),
      (0, h.jsx)(`span`, {
        className: `text-sm text-text-muted w-48 text-right shrink-0`,
        children: t,
      }),
    ],
  });
}
function Ba({ value: e, onChange: t, colorize: n, showColorizeToggle: r }) {
  let i = (n, r) => {
      t({ ...e, [n]: r });
    },
    a = n || !!e.colorize;
  return (0, h.jsxs)(`div`, {
    className: `flex flex-col gap-3 py-4 px-6 bg-bg-dark border-2 border-border rounded-none`,
    children: [
      (0, h.jsx)(za, {
        label: `H`,
        value: e.h,
        min: a ? 0 : -180,
        max: a ? 360 : 180,
        onChange: (e) => i(`h`, e),
      }),
      (0, h.jsx)(za, {
        label: `S`,
        value: e.s,
        min: a ? 0 : -100,
        max: 100,
        onChange: (e) => i(`s`, e),
      }),
      (0, h.jsx)(za, { label: `B`, value: e.b, min: -100, max: 100, onChange: (e) => i(`b`, e) }),
      (0, h.jsx)(za, { label: `C`, value: e.c, min: -100, max: 100, onChange: (e) => i(`c`, e) }),
      r &&
        (0, h.jsxs)(`label`, {
          className: `flex items-center gap-4 text-sm text-text-muted cursor-pointer`,
          children: [
            (0, h.jsx)(`input`, {
              type: `checkbox`,
              checked: !!e.colorize,
              onChange: (n) => t({ ...e, colorize: n.target.checked || void 0 }),
              className: `accent-accent`,
            }),
            `Colorize`,
          ],
        }),
    ],
  });
}
function Va({ width: e, height: t, selected: n, onClick: r, title: i, draw: a, deps: o }) {
  let s = (0, l.useRef)(null);
  return (
    (0, l.useEffect)(() => {
      let n = s.current;
      if (!n) return;
      let r = n.getContext(`2d`);
      r &&
        ((n.width = e),
        (n.height = t),
        (r.imageSmoothingEnabled = !1),
        r.clearRect(0, 0, e, t),
        a(r, e, t));
    }, o),
    (0, h.jsx)(`button`, {
      onClick: r,
      title: i,
      className: `p-0 rounded-none cursor-pointer overflow-hidden shrink-0 border-2 flex items-center justify-center ${n ? `border-accent` : `border-transparent`}`,
      style: { width: e, height: t },
      children: (0, h.jsx)(`canvas`, { ref: s, style: { width: e, height: t, display: `block` } }),
    })
  );
}
var Ha = 2,
  Ua = { h: 0, s: 0, b: 0, c: 0 };
function Wa({
  activeTool: e,
  selectedTileType: t,
  selectedFurnitureType: n,
  selectedFurnitureUid: r,
  selectedFurnitureColor: i,
  floorColor: a,
  wallColor: o,
  selectedWallSet: s,
  onToolChange: c,
  onTileTypeChange: u,
  onFloorColorChange: d,
  onWallColorChange: f,
  onWallSetChange: p,
  onSelectedFurnitureColorChange: m,
  onFurnitureTypeChange: g,
  loadedAssets: _,
  activePetTypes: v,
  petCount: b,
  onPetToggle: x,
}) {
  let [S, C] = (0, l.useState)(`desks`),
    [w, T] = (0, l.useState)(!1),
    [E, ee] = (0, l.useState)(!1),
    [D, O] = (0, l.useState)(!1);
  (0, l.useEffect)(() => {
    if (_)
      try {
        console.log(`[EditorToolbar] Building dynamic catalog with ${_.catalog.length} assets...`);
        let e = Jn(_);
        console.log(`[EditorToolbar] Catalog build result: ${e}`);
        let t = Zn();
        if (t.length > 0) {
          let e = t[0]?.id;
          e && (console.log(`[EditorToolbar] Setting active category to: ${e}`), C(e));
        }
      } catch (e) {
        console.error(`[EditorToolbar] Error building dynamic catalog:`, e);
      }
  }, [_]);
  let k = i ?? Ua,
    te = Xn(S),
    ne = Zr(),
    re = Array.from({ length: ne }, (e, t) => t + 1),
    ie = e === I.TILE_PAINT || e === I.EYEDROPPER,
    ae = e === I.WALL_PAINT,
    A = e === I.ERASE,
    j = e === I.FURNITURE_PLACE || e === I.FURNITURE_PICK,
    oe = e === I.PETS;
  return (0, h.jsxs)(`div`, {
    className: `absolute bottom-76 left-10 z-10 pixel-panel p-4 flex flex-col-reverse gap-4 max-w-[calc(100vw-20px)]`,
    children: [
      (0, h.jsxs)(`div`, {
        className: `flex gap-4 flex-wrap`,
        children: [
          (0, h.jsx)(y, {
            variant: j ? `active` : `default`,
            size: `md`,
            onClick: () => c(I.FURNITURE_PLACE),
            title: `Place furniture`,
            children: `Furniture`,
          }),
          (0, h.jsx)(y, {
            variant: ie ? `active` : `default`,
            size: `md`,
            onClick: () => c(I.TILE_PAINT),
            title: `Paint floor tiles`,
            children: `Floor`,
          }),
          (0, h.jsx)(y, {
            variant: ae ? `active` : `default`,
            size: `md`,
            onClick: () => c(I.WALL_PAINT),
            title: `Paint walls (click to toggle)`,
            children: `Wall`,
          }),
          (0, h.jsx)(y, {
            variant: A ? `active` : `default`,
            size: `md`,
            onClick: () => c(I.ERASE),
            title: `Erase tiles to void`,
            children: `Erase`,
          }),
          (0, h.jsx)(y, {
            variant: oe ? `active` : `default`,
            size: `md`,
            onClick: () => c(I.PETS),
            title: `Place pets`,
            children: `Pets`,
          }),
        ],
      }),
      ie &&
        (0, h.jsxs)(`div`, {
          className: `flex flex-col-reverse gap-4`,
          children: [
            (0, h.jsxs)(`div`, {
              className: `flex gap-4 items-center`,
              children: [
                (0, h.jsx)(y, {
                  variant: w ? `active` : `default`,
                  size: `sm`,
                  onClick: () => T((e) => !e),
                  title: `Adjust floor color`,
                  children: `Color`,
                }),
                (0, h.jsx)(y, {
                  variant: e === I.EYEDROPPER ? `active` : `ghost`,
                  size: `sm`,
                  onClick: () => c(I.EYEDROPPER),
                  title: `Pick floor pattern + color from existing tile`,
                  children: `Pick`,
                }),
              ],
            }),
            w && (0, h.jsx)(Ba, { value: a, onChange: d, colorize: !0 }),
            (0, h.jsx)(`div`, {
              className: `carousel`,
              children: re.map((e) =>
                (0, h.jsx)(
                  Va,
                  {
                    width: 32,
                    height: 32,
                    selected: t === e,
                    onClick: () => u(e),
                    title: `Floor ${e}`,
                    deps: [e, a],
                    draw: (t, n, r) => {
                      if (!Xr()) {
                        ((t.fillStyle = `#444`), t.fillRect(0, 0, n, r));
                        return;
                      }
                      let i = Qr(e, a);
                      t.drawImage(Ii(i, Ha), 0, 0);
                    },
                  },
                  e,
                ),
              ),
            }),
          ],
        }),
      ae &&
        (0, h.jsxs)(`div`, {
          className: `flex flex-col-reverse gap-4`,
          children: [
            (0, h.jsx)(`div`, {
              className: `flex gap-4 items-center`,
              children: (0, h.jsx)(y, {
                variant: E ? `active` : `default`,
                size: `sm`,
                onClick: () => ee((e) => !e),
                title: `Adjust wall color`,
                children: `Color`,
              }),
            }),
            E && (0, h.jsx)(Ba, { value: o, onChange: f, colorize: !0 }),
            Ti() > 0 &&
              (0, h.jsx)(`div`, {
                className: `carousel`,
                children: Array.from({ length: Ti() }, (e, t) =>
                  (0, h.jsx)(
                    Va,
                    {
                      width: 32,
                      height: 64,
                      selected: s === t,
                      onClick: () => p(t),
                      title: `Wall ${t + 1}`,
                      deps: [t, o],
                      draw: (e, n, r) => {
                        let i = Ei(t);
                        if (!i) {
                          ((e.fillStyle = `#444`), e.fillRect(0, 0, n, r));
                          return;
                        }
                        let a = or(`wall-preview-${t}-${o.h}-${o.s}-${o.b}-${o.c}`, i, {
                          ...o,
                          colorize: !0,
                        });
                        e.drawImage(Ii(a, Ha), 0, 0);
                      },
                    },
                    t,
                  ),
                ),
              }),
          ],
        }),
      oe &&
        b > 0 &&
        (0, h.jsx)(`div`, {
          className: `flex flex-col-reverse gap-4`,
          children: (0, h.jsx)(`div`, {
            className: `carousel`,
            'data-testid': `pets-carousel`,
            children: Array.from({ length: b }, (e, t) => {
              let n = ii(t),
                r = v.includes(t);
              return (0, h.jsx)(
                Va,
                {
                  width: 32,
                  height: 64,
                  selected: r,
                  onClick: () => x(t, !r),
                  title: oi(t),
                  deps: [t, r],
                  draw: (e, t, r) => {
                    if (!n) {
                      ((e.fillStyle = `#333`), e.fillRect(0, 0, t, r));
                      return;
                    }
                    let i = Ii(n.idleDown[0], 2),
                      a = Math.min(t / i.width, r / i.height) * 0.85,
                      o = i.width * a,
                      s = i.height * a;
                    e.drawImage(i, (t - o) / 2, (r - s) / 2, o, s);
                  },
                },
                t,
              );
            }),
          }),
        }),
      j &&
        (0, h.jsxs)(`div`, {
          className: `flex flex-col-reverse gap-4`,
          children: [
            (0, h.jsxs)(`div`, {
              className: `flex gap-4 flex-wrap items-center`,
              children: [
                Zn().map((e) =>
                  (0, h.jsx)(
                    y,
                    {
                      variant: S === e.id ? `active` : `ghost`,
                      size: `sm`,
                      onClick: () => C(e.id),
                      children: e.label,
                    },
                    e.id,
                  ),
                ),
                (0, h.jsx)(`div`, { className: `w-[1px] h-14 bg-white/15 mx-2 shrink-0` }),
                (0, h.jsx)(y, {
                  variant: e === I.FURNITURE_PICK ? `active` : `ghost`,
                  size: `sm`,
                  onClick: () => c(I.FURNITURE_PICK),
                  title: `Pick furniture type from placed item`,
                  children: `Pick`,
                }),
              ],
            }),
            (0, h.jsx)(`div`, {
              className: `carousel`,
              children: te.map((e) =>
                (0, h.jsx)(
                  Va,
                  {
                    width: 42,
                    height: 42,
                    selected: n === e.type,
                    onClick: () => g(e.type),
                    title: e.label,
                    deps: [e.type, e.sprite],
                    draw: (t, n, r) => {
                      let i = Ii(e.sprite, 2),
                        a = Math.min(n / i.width, r / i.height) * 0.85,
                        o = i.width * a,
                        s = i.height * a;
                      t.drawImage(i, (n - o) / 2, (r - s) / 2, o, s);
                    },
                  },
                  e.type,
                ),
              ),
            }),
          ],
        }),
      r &&
        (0, h.jsxs)(`div`, {
          className: `flex flex-col-reverse gap-4`,
          children: [
            (0, h.jsxs)(`div`, {
              className: `flex gap-4 items-center`,
              children: [
                (0, h.jsx)(y, {
                  variant: D ? `active` : `default`,
                  size: `sm`,
                  onClick: () => O((e) => !e),
                  title: `Adjust selected furniture color`,
                  children: `Color`,
                }),
                i &&
                  (0, h.jsx)(y, {
                    variant: `ghost`,
                    size: `sm`,
                    onClick: () => m(null),
                    title: `Remove color (restore original)`,
                    children: `Clear`,
                  }),
              ],
            }),
            D && (0, h.jsx)(Ba, { value: k, onChange: m, showColorizeToggle: !0 }),
          ],
        }),
    ],
  });
}
var Ga = class {
    layout;
    tileMap;
    seats;
    blockedTiles;
    furniture;
    walkableTiles;
    characters = new Map();
    pets = [];
    furnitureAnimTimer = 0;
    selectedAgentId = null;
    cameraFollowId = null;
    hoveredAgentId = null;
    hoveredTile = null;
    subagentIdMap = new Map();
    subagentMeta = new Map();
    nextSubagentId = -1;
    constructor(e) {
      ((this.layout = e || Cr()),
        (this.tileMap = hr(this.layout)),
        (this.seats = br(this.layout.furniture)),
        (this.blockedTiles = _r(this.layout.furniture)),
        (this.furniture = gr(this.layout.furniture)),
        (this.walkableTiles = Ri(this.tileMap, this.blockedTiles)),
        this.rebuildPetsFromLayout(this.layout));
    }
    rebuildFromLayout(e, t) {
      if (
        ((this.layout = e),
        (this.tileMap = hr(e)),
        (this.seats = br(e.furniture)),
        (this.blockedTiles = _r(e.furniture)),
        this.rebuildFurnitureInstances(),
        (this.walkableTiles = Ri(this.tileMap, this.blockedTiles)),
        t && (t.col !== 0 || t.row !== 0))
      )
        for (let e of this.characters.values())
          ((e.tileCol += t.col),
            (e.tileRow += t.row),
            (e.x += t.col * 16),
            (e.y += t.row * 16),
            (e.path = []),
            (e.moveProgress = 0));
      if (t && (t.col !== 0 || t.row !== 0))
        for (let e of this.pets)
          ((e.tileCol += t.col),
            (e.tileRow += t.row),
            (e.x += t.col * 16),
            (e.y += t.row * 16),
            (e.path = []),
            (e.moveProgress = 0));
      for (let e of this.seats.values()) e.assigned = !1;
      for (let e of this.characters.values()) {
        if (e.seatId && this.seats.has(e.seatId)) {
          let t = this.seats.get(e.seatId);
          if (!t.assigned) {
            ((t.assigned = !0), (e.tileCol = t.seatCol), (e.tileRow = t.seatRow));
            let n = t.seatCol * 16 + 16 / 2,
              r = t.seatRow * 16 + 16 / 2;
            ((e.x = n), (e.y = r), (e.dir = t.facingDir));
            continue;
          }
        }
        e.seatId = null;
      }
      for (let e of this.characters.values()) {
        if (e.seatId) continue;
        let t = this.findFreeSeat();
        if (t) {
          ((this.seats.get(t).assigned = !0), (e.seatId = t));
          let n = this.seats.get(t);
          ((e.tileCol = n.seatCol),
            (e.tileRow = n.seatRow),
            (e.x = n.seatCol * 16 + 16 / 2),
            (e.y = n.seatRow * 16 + 16 / 2),
            (e.dir = n.facingDir));
        }
      }
      for (let t of this.characters.values())
        t.seatId ||
          ((t.tileCol < 0 || t.tileCol >= e.cols || t.tileRow < 0 || t.tileRow >= e.rows) &&
            this.relocateCharacterToWalkable(t));
      for (let t of this.pets)
        if (
          (t.tileCol < 0 ||
            t.tileCol >= e.cols ||
            t.tileRow < 0 ||
            t.tileRow >= e.rows ||
            !Li(t.tileCol, t.tileRow, this.tileMap, this.blockedTiles)) &&
          this.walkableTiles.length > 0
        ) {
          let e = this.walkableTiles[Math.floor(Math.random() * this.walkableTiles.length)];
          ((t.tileCol = e.col),
            (t.tileRow = e.row),
            (t.x = e.col * 16 + 16 / 2),
            (t.y = e.row * 16 + 16 / 2),
            (t.path = []),
            (t.moveProgress = 0),
            (t.state = Tt.IDLE),
            (t.frame = 0),
            (t.frameTimer = 0),
            (t.followTargetId = null));
        }
      this.rebuildPetsFromLayout(e);
    }
    relocateCharacterToWalkable(e) {
      if (this.walkableTiles.length === 0) return;
      let t = this.walkableTiles[Math.floor(Math.random() * this.walkableTiles.length)];
      ((e.tileCol = t.col),
        (e.tileRow = t.row),
        (e.x = t.col * 16 + 16 / 2),
        (e.y = t.row * 16 + 16 / 2),
        (e.path = []),
        (e.moveProgress = 0));
    }
    getLayout() {
      return this.layout;
    }
    ownSeatKey(e) {
      if (!e.seatId) return null;
      let t = this.seats.get(e.seatId);
      return t ? `${t.seatCol},${t.seatRow}` : null;
    }
    withOwnSeatUnblocked(e, t) {
      let n = this.ownSeatKey(e);
      n && this.blockedTiles.delete(n);
      let r = t();
      return (n && this.blockedTiles.add(n), r);
    }
    findFreeSeat() {
      let e = new Set();
      for (let t of this.layout.furniture) {
        let n = Yn(t.type);
        if (!(!n || n.category !== `electronics`))
          for (let r = 0; r < n.footprintH; r++)
            for (let i = 0; i < n.footprintW; i++) e.add(`${t.col + i},${t.row + r}`);
      }
      let t = [],
        n = [];
      for (let [r, i] of this.seats) {
        if (i.assigned) continue;
        let a = !1,
          o = i.facingDir === F.RIGHT ? 1 : i.facingDir === F.LEFT ? -1 : 0,
          s = i.facingDir === F.DOWN ? 1 : i.facingDir === F.UP ? -1 : 0;
        for (let t = 1; t <= 3 && !a; t++) {
          let n = i.seatCol + o * t,
            r = i.seatRow + s * t;
          if (e.has(`${n},${r}`)) {
            a = !0;
            break;
          }
          if (o !== 0) {
            if (e.has(`${n},${r - 1}`) || e.has(`${n},${r + 1}`)) {
              a = !0;
              break;
            }
          } else if (e.has(`${n - 1},${r}`) || e.has(`${n + 1},${r}`)) {
            a = !0;
            break;
          }
        }
        (a ? t : n).push(r);
      }
      return t.length > 0
        ? t[Math.floor(Math.random() * t.length)]
        : n.length > 0
          ? n[Math.floor(Math.random() * n.length)]
          : null;
    }
    pickDiversePalette() {
      let e = gi(),
        t = Array(e).fill(0);
      for (let n of this.characters.values()) n.isSubagent || (n.palette < e && t[n.palette]++);
      let n = Math.min(...t),
        r = [];
      for (let i = 0; i < e; i++) t[i] === n && r.push(i);
      let i = r[Math.floor(Math.random() * r.length)],
        a = 0;
      return (n > 0 && (a = 45 + Math.floor(Math.random() * 271)), { palette: i, hueShift: a });
    }
    addAgent(e, t, n, r, i, a) {
      if (this.characters.has(e)) return;
      let o, s;
      if (t !== void 0) ((o = t), (s = n ?? 0));
      else {
        let e = this.pickDiversePalette();
        ((o = e.palette), (s = e.hueShift));
      }
      let c = null;
      (r && this.seats.has(r) && (this.seats.get(r).assigned || (c = r)),
        (c ||= this.findFreeSeat()));
      let l;
      if (c) {
        let t = this.seats.get(c);
        ((t.assigned = !0), (l = Ui(e, o, c, t, s)));
      } else {
        let t =
          this.walkableTiles.length > 0
            ? this.walkableTiles[Math.floor(Math.random() * this.walkableTiles.length)]
            : { col: 1, row: 1 };
        ((l = Ui(e, o, null, null, s)),
          (l.x = t.col * 16 + 16 / 2),
          (l.y = t.row * 16 + 16 / 2),
          (l.tileCol = t.col),
          (l.tileRow = t.row));
      }
      (a && (l.folderName = a),
        i || ((l.matrixEffect = `spawn`), (l.matrixEffectTimer = 0), (l.matrixEffectSeeds = Xi())),
        this.characters.set(e, l));
    }
    addRoleAgentAtTile(e, t, n, r, i) {
      let a = this.findNearestWalkableTile(n, r),
        o = this.characters.get(e);
      if (o) {
        if (o.seatId) {
          let e = this.seats.get(o.seatId);
          e && (e.assigned = !1);
        }
        ((o.palette = t),
          (o.hueShift = 0),
          (o.folderName = i),
          (o.tileCol = a.col),
          (o.tileRow = a.row),
          (o.x = a.col * 16 + 16 / 2),
          (o.y = a.row * 16 + 16 / 2),
          (o.path = []),
          (o.moveProgress = 0),
          (o.seatId = null),
          (o.state = P.IDLE),
          (o.isActive = !1),
          (o.roleTaskState = `idle`),
          (o.weatherIcon = void 0),
          (o.matrixEffect = null),
          (o.bubbleType = null),
          this.rebuildFurnitureInstances());
        return;
      }
      let s = Ui(e, t, null, null, 0);
      ((s.x = a.col * 16 + 16 / 2),
        (s.y = a.row * 16 + 16 / 2),
        (s.tileCol = a.col),
        (s.tileRow = a.row),
        (s.state = P.IDLE),
        (s.isActive = !1),
        (s.roleTaskState = `idle`),
        (s.folderName = i),
        (s.matrixEffect = `spawn`),
        (s.matrixEffectTimer = 0),
        (s.matrixEffectSeeds = Xi()),
        this.characters.set(e, s),
        this.rebuildFurnitureInstances());
    }
    findNearestWalkableTile(e, t) {
      if (Li(e, t, this.tileMap, this.blockedTiles)) return { col: e, row: t };
      let n = this.walkableTiles[0] ?? { col: 1, row: 1 },
        r = 1 / 0;
      for (let i of this.walkableTiles) {
        let a = Math.abs(i.col - e) + Math.abs(i.row - t);
        a < r && ((n = i), (r = a));
      }
      return n;
    }
    removeAgent(e) {
      let t = this.characters.get(e);
      if (t && t.matrixEffect !== `despawn`) {
        if (t.seatId) {
          let e = this.seats.get(t.seatId);
          e && (e.assigned = !1);
        }
        (this.selectedAgentId === e && (this.selectedAgentId = null),
          this.cameraFollowId === e && (this.cameraFollowId = null),
          (t.matrixEffect = `despawn`),
          (t.matrixEffectTimer = 0),
          (t.matrixEffectSeeds = Xi()),
          (t.bubbleType = null));
      }
    }
    getSeatAtTile(e, t) {
      for (let [n, r] of this.seats) if (r.seatCol === e && r.seatRow === t) return n;
      return null;
    }
    reassignSeat(e, t) {
      let n = this.characters.get(e);
      if (!n) return;
      if (n.seatId) {
        let e = this.seats.get(n.seatId);
        e && (e.assigned = !1);
      }
      let r = this.seats.get(t);
      if (!r || r.assigned) return;
      ((r.assigned = !0), (n.seatId = t));
      let i = this.withOwnSeatUnblocked(n, () =>
        zi(n.tileCol, n.tileRow, r.seatCol, r.seatRow, this.tileMap, this.blockedTiles),
      );
      i.length > 0
        ? ((n.path = i),
          (n.moveProgress = 0),
          (n.state = P.WALK),
          (n.frame = 0),
          (n.frameTimer = 0))
        : ((n.state = P.TYPE),
          (n.dir = r.facingDir),
          (n.frame = 0),
          (n.frameTimer = 0),
          n.isActive || (n.seatTimer = 3 + Math.random() * 2));
    }
    sendToSeat(e) {
      let t = this.characters.get(e);
      if (!t || !t.seatId) return;
      let n = this.seats.get(t.seatId);
      if (!n) return;
      let r = this.withOwnSeatUnblocked(t, () =>
        zi(t.tileCol, t.tileRow, n.seatCol, n.seatRow, this.tileMap, this.blockedTiles),
      );
      r.length > 0
        ? ((t.path = r),
          (t.moveProgress = 0),
          (t.state = P.WALK),
          (t.frame = 0),
          (t.frameTimer = 0))
        : ((t.state = P.TYPE),
          (t.dir = n.facingDir),
          (t.frame = 0),
          (t.frameTimer = 0),
          t.isActive || (t.seatTimer = 3 + Math.random() * 2));
    }
    walkToTile(e, t, n) {
      let r = this.characters.get(e);
      if (!r || r.isSubagent) return !1;
      if (!Li(t, n, this.tileMap, this.blockedTiles)) {
        let e = this.ownSeatKey(r);
        if (!e || e !== `${t},${n}`) return !1;
      }
      let i = this.withOwnSeatUnblocked(r, () =>
        zi(r.tileCol, r.tileRow, t, n, this.tileMap, this.blockedTiles),
      );
      return i.length === 0
        ? !1
        : ((r.path = i),
          (r.moveProgress = 0),
          (r.state = P.WALK),
          (r.frame = 0),
          (r.frameTimer = 0),
          !0);
    }
    addSubagent(e, t) {
      let n = `${e}:${t}`;
      if (this.subagentIdMap.has(n)) return this.subagentIdMap.get(n);
      let r = this.nextSubagentId--,
        i = this.characters.get(e),
        a = i ? i.palette : 0,
        o = i ? i.hueShift : 0,
        s = i ? i.tileCol : 0,
        c = i ? i.tileRow : 0,
        l = (e, t) => Math.abs(e - s) + Math.abs(t - c),
        u = new Set();
      for (let [, e] of this.characters) u.add(`${e.tileCol},${e.tileRow}`);
      let d = { col: s, row: c };
      if (this.walkableTiles.length > 0) {
        let e = this.walkableTiles[0],
          t = 1 / 0;
        for (let n of this.walkableTiles) {
          if (u.has(`${n.col},${n.row}`)) continue;
          let r = l(n.col, n.row);
          r < t && ((e = n), (t = r));
        }
        d = e;
      }
      let f = Ui(r, a, null, null, o);
      return (
        (f.x = d.col * 16 + 16 / 2),
        (f.y = d.row * 16 + 16 / 2),
        (f.tileCol = d.col),
        (f.tileRow = d.row),
        i && (f.dir = i.dir),
        (f.isSubagent = !0),
        (f.parentAgentId = e),
        (f.matrixEffect = `spawn`),
        (f.matrixEffectTimer = 0),
        (f.matrixEffectSeeds = Xi()),
        this.characters.set(r, f),
        this.subagentIdMap.set(n, r),
        this.subagentMeta.set(r, { parentAgentId: e, parentToolId: t }),
        r
      );
    }
    removeSubagent(e, t) {
      let n = `${e}:${t}`,
        r = this.subagentIdMap.get(n);
      if (r === void 0) return;
      let i = this.characters.get(r);
      if (i) {
        if (i.matrixEffect === `despawn`) {
          (this.subagentIdMap.delete(n), this.subagentMeta.delete(r));
          return;
        }
        if (i.seatId) {
          let e = this.seats.get(i.seatId);
          e && (e.assigned = !1);
        }
        ((i.matrixEffect = `despawn`),
          (i.matrixEffectTimer = 0),
          (i.matrixEffectSeeds = Xi()),
          (i.bubbleType = null));
      }
      (this.subagentIdMap.delete(n),
        this.subagentMeta.delete(r),
        this.selectedAgentId === r && (this.selectedAgentId = null),
        this.cameraFollowId === r && (this.cameraFollowId = null));
    }
    removeAllSubagents(e) {
      let t = [];
      for (let [n, r] of this.subagentIdMap) {
        let i = this.subagentMeta.get(r);
        if (i && i.parentAgentId === e) {
          let e = this.characters.get(r);
          if (e) {
            if (e.matrixEffect === `despawn`) {
              (this.subagentMeta.delete(r), t.push(n));
              continue;
            }
            if (e.seatId) {
              let t = this.seats.get(e.seatId);
              t && (t.assigned = !1);
            }
            ((e.matrixEffect = `despawn`),
              (e.matrixEffectTimer = 0),
              (e.matrixEffectSeeds = Xi()),
              (e.bubbleType = null));
          }
          (this.subagentMeta.delete(r),
            this.selectedAgentId === r && (this.selectedAgentId = null),
            this.cameraFollowId === r && (this.cameraFollowId = null),
            t.push(n));
        }
      }
      for (let e of t) this.subagentIdMap.delete(e);
    }
    getSubagentId(e, t) {
      return this.subagentIdMap.get(`${e}:${t}`) ?? null;
    }
    setAgentActive(e, t) {
      let n = this.characters.get(e);
      n &&
        ((n.isActive = t),
        t || ((n.seatTimer = -1), (n.path = []), (n.moveProgress = 0)),
        this.rebuildFurnitureInstances());
    }
    rebuildFurnitureInstances() {
      let e = new Set();
      for (let t of this.characters.values()) {
        if (!t.isActive || !t.seatId) continue;
        let n = this.seats.get(t.seatId);
        if (!n) continue;
        let r = n.facingDir === F.RIGHT ? 1 : n.facingDir === F.LEFT ? -1 : 0,
          i = n.facingDir === F.DOWN ? 1 : n.facingDir === F.UP ? -1 : 0;
        for (let t = 1; t <= 3; t++) {
          let a = n.seatCol + r * t,
            o = n.seatRow + i * t;
          e.add(`${a},${o}`);
        }
        for (let t = 1; t <= 2; t++) {
          let a = n.seatCol + r * t,
            o = n.seatRow + i * t;
          r === 0
            ? (e.add(`${a - 1},${o}`), e.add(`${a + 1},${o}`))
            : (e.add(`${a},${o - 1}`), e.add(`${a},${o + 1}`));
        }
      }
      if (e.size === 0) {
        this.furniture = gr(this.layout.furniture);
        return;
      }
      let t = Math.floor(this.furnitureAnimTimer / dt),
        n = this.layout.furniture.map((n) => {
          let r = Yn(n.type);
          if (!r) return n;
          for (let i = 0; i < r.footprintH; i++)
            for (let a = 0; a < r.footprintW; a++)
              if (e.has(`${n.col + a},${n.row + i}`)) {
                let e = tr(n.type);
                if (e !== n.type) {
                  let r = rr(e);
                  return (r && r.length > 1 && (e = r[t % r.length]), { ...n, type: e });
                }
                return n;
              }
          return n;
        });
      this.furniture = gr(n);
    }
    setAgentTool(e, t) {
      let n = this.characters.get(e);
      n && (n.currentTool = t);
    }
    setRoleTaskWorking(e) {
      let t = this.characters.get(e);
      if (!t) return;
      if (
        ((t.roleTaskState = `busy`),
        (t.weatherIcon = void 0),
        (t.roleBusyIconTimer = 0),
        (t.roleWeatherTimer = 0),
        (t.currentTool = `websearch`),
        (t.isActive = !0),
        (t.bubbleType = null),
        (t.waitingAwaitingInput = !1),
        !t.seatId)
      ) {
        let e = this.findFreeSeat();
        e && ((this.seats.get(e).assigned = !0), (t.seatId = e));
      }
      let n = t.seatId ? this.seats.get(t.seatId) : null;
      (n
        ? this.withOwnSeatUnblocked(t, () => {
            let e = zi(t.tileCol, t.tileRow, n.seatCol, n.seatRow, this.tileMap, this.blockedTiles);
            e.length > 0
              ? ((t.path = e), (t.moveProgress = 0), (t.state = P.WALK))
              : ((t.state = P.BUSY), (t.dir = n.facingDir));
          })
        : (t.state = P.BUSY),
        this.rebuildFurnitureInstances());
    }
    setRoleTaskWeather(e, t) {
      let n = this.characters.get(e);
      n &&
        ((n.roleTaskState = `weather`),
        (n.weatherIcon = t),
        (n.roleWeatherTimer = 8),
        (n.roleBusyIconTimer = 0),
        (n.currentTool = null),
        (n.isActive = !1),
        (n.state = P.IDLE),
        (n.path = []),
        (n.moveProgress = 0),
        (n.bubbleType = null),
        (n.waitingAwaitingInput = !1),
        this.rebuildFurnitureInstances());
    }
    clearRoleTaskState(e) {
      let t = this.characters.get(e);
      t &&
        ((t.roleTaskState = `idle`),
        (t.weatherIcon = void 0),
        (t.roleWeatherTimer = 0),
        (t.roleBusyIconTimer = 0),
        (t.currentTool = null),
        (t.isActive = !1),
        (t.state = P.IDLE),
        (t.path = []),
        (t.moveProgress = 0),
        this.rebuildFurnitureInstances());
    }
    showPermissionBubble(e) {
      let t = this.characters.get(e);
      t && ((t.bubbleType = `permission`), (t.bubbleTimer = 0));
    }
    clearPermissionBubble(e) {
      let t = this.characters.get(e);
      t && t.bubbleType === `permission` && ((t.bubbleType = null), (t.bubbleTimer = 0));
    }
    showWaitingBubble(e, t = !1) {
      let n = this.characters.get(e);
      n && ((n.bubbleType = `waiting`), (n.waitingAwaitingInput = t), (n.bubbleTimer = 2));
    }
    dismissBubble(e) {
      let t = this.characters.get(e);
      !t ||
        !t.bubbleType ||
        (t.bubbleType === `permission`
          ? ((t.bubbleType = null), (t.bubbleTimer = 0))
          : t.bubbleType === `waiting` && (t.bubbleTimer = Math.min(t.bubbleTimer, ht)));
    }
    addPet(e) {
      if (
        typeof e.id != `string` ||
        e.id.length === 0 ||
        e.id.length > 128 ||
        !Number.isInteger(e.petType) ||
        e.petType < 0 ||
        e.petType >= ai() ||
        this.pets.some((t) => t.id === e.id) ||
        this.walkableTiles.length === 0
      )
        return;
      let t = this.walkableTiles[Math.floor(Math.random() * this.walkableTiles.length)],
        n = sa(e.id, e.petType, t.col, t.row);
      ((n.name = oi(e.petType)), this.pets.push(n), this.syncLayoutPets());
    }
    removePet(e) {
      let t = this.pets.length;
      ((this.pets = this.pets.filter((t) => t.id !== e)),
        this.pets.length !== t && this.syncLayoutPets());
    }
    getPets() {
      return this.pets.slice();
    }
    getActivePetTypes() {
      let e = new Set();
      for (let t of this.pets) e.add(t.petType);
      return Array.from(e);
    }
    getPetAt(e, t) {
      let n = this.pets.slice().sort((e, t) => t.y - e.y);
      for (let r of n) {
        let n = r.x - 8,
          i = r.x + 8,
          a = r.y - 16,
          o = r.y;
        if (e >= n && e <= i && t >= a && t <= o) return r.id;
      }
      return null;
    }
    showPetBubble(e) {
      let t = this.pets.find((t) => t.id === e);
      t && ((t.bubbleType = `heart`), (t.bubbleTimer = 2));
    }
    dismissPetBubble(e) {
      let t = this.pets.find((t) => t.id === e);
      !t || !t.bubbleType || (t.bubbleTimer = Math.min(t.bubbleTimer, ht));
    }
    rebuildPetsFromLayout(e) {
      let t = e.pets ?? [],
        n = new Set(t.map((e) => e.id));
      this.pets = this.pets.filter((e) => n.has(e.id));
      let r = new Set(this.pets.map((e) => e.id));
      for (let e of t) r.has(e.id) || this.addPet(e);
      this.syncLayoutPets();
    }
    syncLayoutPets() {
      this.layout.pets = this.pets.map((e) => ({ id: e.id, petType: e.petType }));
    }
    setTeamInfo(e, t, n, r, i, a) {
      let o = this.characters.get(e);
      o &&
        ((o.teamName = t),
        (o.agentName = n),
        (o.isTeamLead = r),
        (o.leadAgentId = i),
        a !== void 0 && (o.teamUsesTmux = a));
    }
    setAgentTokens(e, t, n) {
      let r = this.characters.get(e);
      r && ((r.inputTokens = t), (r.outputTokens = n));
    }
    update(e) {
      let t = Math.floor(this.furnitureAnimTimer / dt);
      ((this.furnitureAnimTimer += e),
        Math.floor(this.furnitureAnimTimer / 0.2) !== t && this.rebuildFurnitureInstances());
      let n = [];
      for (let t of this.characters.values()) {
        if (t.matrixEffect) {
          ((t.matrixEffectTimer += e),
            t.matrixEffectTimer >= 0.3 &&
              (t.matrixEffect === `spawn`
                ? ((t.matrixEffect = null), (t.matrixEffectTimer = 0), (t.matrixEffectSeeds = []))
                : n.push(t.id)));
          continue;
        }
        (this.withOwnSeatUnblocked(t, () =>
          Wi(t, e, this.walkableTiles, this.seats, this.tileMap, this.blockedTiles),
        ),
          t.roleTaskState === `busy`
            ? ((t.roleBusyIconTimer = (t.roleBusyIconTimer ?? 0) + e),
              t.roleBusyIconTimer > 0.55 * 5 && (t.roleBusyIconTimer %= _e * 5))
            : t.roleTaskState === `weather` &&
              ((t.roleWeatherTimer = (t.roleWeatherTimer ?? 0) - e),
              t.roleWeatherTimer <= 0 &&
                ((t.roleTaskState = `idle`), (t.weatherIcon = void 0), (t.roleWeatherTimer = 0))),
          t.bubbleType === `waiting` &&
            !t.waitingAwaitingInput &&
            ((t.bubbleTimer -= e),
            t.bubbleTimer <= 0 && ((t.bubbleType = null), (t.bubbleTimer = 0))));
      }
      for (let e of n) this.characters.delete(e);
      for (let t of this.pets)
        (ca(t, e, this.walkableTiles, this.characters, this.tileMap, this.blockedTiles),
          t.bubbleType &&
            ((t.bubbleTimer -= e),
            t.bubbleTimer <= 0 && ((t.bubbleType = null), (t.bubbleTimer = 0))));
    }
    getCharacters() {
      return Array.from(this.characters.values());
    }
    getCharacterAt(e, t) {
      let n = this.getCharacters().sort((e, t) => t.y - e.y);
      for (let r of n) {
        if (r.matrixEffect === `despawn`) continue;
        let n = r.state === P.TYPE || r.state === P.BUSY ? 6 : 0,
          i = r.y + n,
          a = r.x - 8,
          o = r.x + 8,
          s = i - 24;
        if (e >= a && e <= o && t >= s && t <= i) return r.id;
      }
      return null;
    }
  },
  Ka = (e) =>
    e
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/gu, `-`)
      .replace(/^-|-$/g, ``)
      .slice(0, 36) || `plan`;
function qa(e, t, n, r, i, a, o, s) {
  let c = new Date().toISOString();
  return {
    schemaVersion: `robot-plan/v1`,
    planId: `${t}_${Ka(n)}_${Date.now().toString(36)}`,
    createdAt: c,
    createdBy: {
      padId: e.padId,
      sessionId: e.sessionId,
      agentRunId: `agent_${Date.now().toString(36)}`,
    },
    intent: n,
    risk: r,
    requiresUserConfirmation: i,
    assumptions: s,
    steps: a,
    constraints: {
      maxDurationMs: o,
      maxSteps: Math.max(a.length, 1),
      allowedTools: [...new Set(a.map((e) => e.tool))],
    },
  };
}
function Ja(e, t) {
  return qa(
    e,
    `plan_memory`,
    `用户声明这里是${t}`,
    `medium`,
    !1,
    [
      { id: `s1`, tool: `base.state`, args: {} },
      {
        id: `s2`,
        tool: `memory.upsertPoi`,
        dependsOn: [`s1`],
        args: { poi: { name: t, aliases: [t], type: `room`, source: `user`, confidence: 0.8 } },
      },
    ],
    3e3,
    [`当前位置来自机器人当前定位`],
  );
}
function Ya(e, t) {
  return qa(
    e,
    `plan_move`,
    `移动到${t}`,
    `high`,
    !0,
    [
      { id: `s1`, tool: `speech.say`, args: { text: `我准备移动到${t}。` } },
      { id: `s2`, tool: `memory.getPoi`, args: { name: t } },
      { id: `s3`, tool: `watchdog.acquire`, args: { resource: `base`, ttlMs: 1500 } },
      {
        id: `s4`,
        tool: `base.followPath`,
        dependsOn: [`s2`, `s3`],
        args: { targetPoi: t, maxSpeedMps: 0.15 },
        timeoutMs: 3e4,
        safety: { requiresLease: `base`, stopOnObstacle: !0, maxSpeedMps: 0.15 },
      },
      { id: `s5`, tool: `watchdog.release`, dependsOn: [`s4`], args: { resource: `base` } },
      { id: `s6`, tool: `led.setMode`, dependsOn: [`s5`], args: { mode: `idle` } },
    ],
    3e4,
    [`${t} POI 已存在`, `机器人定位可用`],
  );
}
function Xa(e, t) {
  return qa(
    e,
    `plan_speech`,
    `语音播报：${t}`,
    `low`,
    !1,
    [{ id: `s1`, tool: `speech.say`, args: { text: t } }],
    5e3,
    [],
  );
}
function Za(e, t) {
  return qa(
    e,
    `plan_led`,
    `设置 LED：${t}`,
    `low`,
    !1,
    [{ id: `s1`, tool: `led.setMode`, args: { mode: t } }],
    2e3,
    [],
  );
}
function Qa(e) {
  let t = e.trim(),
    n = t.match(/^这里是(.+)$/u) ?? t.match(/^这是(.+)$/u);
  if (n?.[1]) return { type: `rememberPoi`, poiName: n[1].trim() };
  let r = t.match(/^去(.+)$/u) ?? t.match(/^移动到(.+)$/u) ?? t.match(/^前往(.+)$/u);
  if (r?.[1]) return { type: `moveToPoi`, poiName: r[1].trim() };
  let i = t.match(/^说(.+)$/u) ?? t.match(/^播报(.+)$/u);
  if (i?.[1]) return { type: `speech`, text: i[1].trim() };
  let a = t.match(/^led[:： ](.+)$/iu) ?? t.match(/^灯光[:： ](.+)$/u);
  return a?.[1] ? { type: `led`, mode: a[1].trim() } : null;
}
function $a(e, t) {
  return t.type === `rememberPoi`
    ? Ja(e, t.poiName)
    : t.type === `moveToPoi`
      ? Ya(e, t.poiName)
      : t.type === `speech`
        ? Xa(e, t.text)
        : Za(e, t.mode);
}
var eo = { low: 0, medium: 1, high: 2, critical: 3 };
function to(e, t) {
  let n = new Map(t.map((e) => [e.name, e])),
    r = [],
    i = [];
  (e.schemaVersion !== `robot-plan/v1` &&
    r.push({ code: `schema_version`, message: `Unsupported robot plan schema.` }),
    e.steps.length > e.constraints.maxSteps &&
      r.push({ code: `max_steps`, message: `Plan exceeds maxSteps.` }),
    e.constraints.maxDurationMs <= 0 &&
      r.push({ code: `max_duration`, message: `Plan maxDurationMs must be positive.` }));
  let a = new Set();
  for (let t of e.steps) {
    (a.has(t.id) &&
      r.push({ code: `duplicate_step`, message: `Duplicate step ${t.id}.`, stepId: t.id }),
      a.add(t.id));
    let i = n.get(t.tool);
    if (!i) {
      r.push({
        code: `missing_tool`,
        message: `Robot tool ${t.tool} is unavailable.`,
        stepId: t.id,
      });
      continue;
    }
    (e.constraints.allowedTools.includes(t.tool) ||
      r.push({
        code: `tool_not_allowed`,
        message: `Tool ${t.tool} is not in allowedTools.`,
        stepId: t.id,
      }),
      e.constraints.forbiddenTools?.includes(t.tool) &&
        r.push({ code: `tool_forbidden`, message: `Tool ${t.tool} is forbidden.`, stepId: t.id }),
      eo[i.risk] > eo[e.risk] &&
        r.push({
          code: `risk_mismatch`,
          message: `Tool ${t.tool} risk exceeds plan risk.`,
          stepId: t.id,
        }),
      (i.risk === `high` || i.risk === `critical`) &&
        !e.requiresUserConfirmation &&
        r.push({
          code: `confirmation_required`,
          message: `Tool ${t.tool} requires user confirmation.`,
          stepId: t.id,
        }),
      i.requiresLease &&
        t.safety?.requiresLease !== i.requiresLease &&
        r.push({
          code: `lease_required`,
          message: `Tool ${t.tool} requires ${i.requiresLease} lease.`,
          stepId: t.id,
        }));
  }
  for (let t of e.steps)
    for (let e of t.dependsOn ?? [])
      a.has(e) ||
        r.push({ code: `missing_dependency`, message: `Missing dependency ${e}.`, stepId: t.id });
  return (
    no(e) && r.push({ code: `cycle`, message: `Plan dependencies contain a cycle.` }),
    e.steps.some((e) => e.tool === `base.stop` || e.tool === `watchdog.release`) ||
      i.push({
        code: `no_stop_fallback`,
        message: `Plan has no explicit stop or release fallback.`,
      }),
    {
      ok: r.length === 0,
      planId: e.planId,
      normalizedPlan: r.length === 0 ? e : void 0,
      errors: r,
      warnings: i,
    }
  );
}
function no(e) {
  let t = new Set(),
    n = new Set(),
    r = new Map(e.steps.map((e) => [e.id, e])),
    i = (e) => {
      if (t.has(e)) return !0;
      if (n.has(e)) return !1;
      t.add(e);
      for (let t of r.get(e)?.dependsOn ?? []) if (i(t)) return !0;
      return (t.delete(e), n.add(e), !1);
    };
  return e.steps.some((e) => i(e.id));
}
var ro = [
    oo(`speech.say`, `speech`, `low`, !1, 5e3, `扬声器播报短句`),
    oo(`led.setMode`, `led`, `low`, !1, 2e3, `设置 LED 状态`),
    oo(`memory.getPoi`, `memory`, `low`, !1, 2e3, `查询 POI`),
    oo(`memory.upsertPoi`, `memory`, `medium`, !1, 3e3, `写入 POI`),
    oo(`base.state`, `base`, `low`, !1, 1e3, `查询底盘状态`),
    oo(`base.stop`, `base`, `critical`, !1, 1e3, `底盘急停`),
    oo(`base.followPath`, `base`, `high`, !0, 3e4, `低速路径执行`, `base`),
    oo(`arm.state`, `arm`, `low`, !1, 1e3, `查询机械臂状态`),
    oo(`arm.stop`, `arm`, `critical`, !1, 1e3, `机械臂急停`),
    oo(`arm.grasp`, `arm`, `high`, !0, 15e3, `抓取物体`, `arm`),
    oo(`arm.place`, `arm`, `high`, !0, 15e3, `放置物体`, `arm`),
    oo(`vision.snapshot`, `vision`, `low`, !1, 2e3, `获取低频视觉摘要`),
    oo(`watchdog.acquire`, `watchdog`, `medium`, !1, 1e3, `获取动作 lease`),
    oo(`watchdog.heartbeat`, `watchdog`, `medium`, !1, 1e3, `维持动作 lease`),
    oo(`watchdog.release`, `watchdog`, `medium`, !1, 1e3, `释放动作 lease`),
  ],
  io = class {
    handlers = new Set();
    eventSeq = 0;
    async connect() {
      this.emit({
        type: `robot.status`,
        data: { connected: !0, batteryPercent: 88, mode: `mock` },
      });
    }
    subscribe(e) {
      return (this.handlers.add(e), () => this.handlers.delete(e));
    }
    close() {
      this.handlers.clear();
    }
    emit(e) {
      let t = { ...e, eventId: `mock_evt_${++this.eventSeq}` };
      for (let e of this.handlers) e(t);
    }
  },
  ao = class {
    plans = new Map();
    events;
    constructor(e) {
      this.events = e;
    }
    async getHealth() {
      return { ok: !0, robotId: `mock-robot-001`, softwareVersion: `mock-0.1.0` };
    }
    async getTools() {
      return ro;
    }
    async getTool(e) {
      let t = ro.find((t) => t.name === e);
      if (!t) throw Error(`Unknown mock tool ${e}`);
      return t;
    }
    async validatePlan(e) {
      return e.intent.includes(`validate-fail`)
        ? {
            ok: !1,
            planId: e.planId,
            errors: [{ code: `mock_validate_failed`, message: `Mock validation failure.` }],
            warnings: [],
          }
        : to(e, ro);
    }
    async submitPlan(e) {
      let t = so(e);
      return (
        this.plans.set(e.planId, { plan: e, state: t }),
        this.events.emit({ type: `plan.accepted`, planId: e.planId }),
        t
      );
    }
    async executePlan(e) {
      let t = this.requirePlan(e);
      return (
        (t.state.status = `running`),
        this.events.emit({ type: `plan.started`, planId: e }),
        this.runPlan(t.plan, t.state),
        t.state
      );
    }
    async stopPlan(e, t) {
      let n = this.requirePlan(e);
      n.state.status = `stopped`;
      for (let e of n.state.steps)
        (e.status === `pending` || e.status === `running`) && (e.status = `skipped`);
      return (this.events.emit({ type: `plan.stopped`, planId: e, reason: t }), n.state);
    }
    async getPlanState(e) {
      return this.requirePlan(e).state;
    }
    async stopAll(e) {
      for (let [t, n] of this.plans.entries())
        n.state.status === `running` && (await this.stopPlan(t, e));
      this.events.emit({ type: `safety.blocked`, reason: e });
    }
    requirePlan(e) {
      let t = this.plans.get(e);
      if (!t) throw Error(`Unknown plan ${e}`);
      return t;
    }
    async runPlan(e, t) {
      for (let n of t.steps) {
        if (t.status !== `running`) return;
        if (
          ((t.currentStepId = n.id),
          (n.status = `running`),
          (n.startedAt = new Date().toISOString()),
          this.events.emit({ type: `plan.step.started`, planId: e.planId, stepId: n.id }),
          await lo(420),
          e.intent.includes(`step-fail`) && n.id === `s2`)
        ) {
          ((n.status = `failed`), (t.status = `failed`));
          let r = co(!1, `Step ${n.id} failed`);
          ((n.result = r),
            this.events.emit({
              type: `plan.step.failed`,
              planId: e.planId,
              stepId: n.id,
              result: r,
            }),
            this.events.emit({
              type: `plan.failed`,
              planId: e.planId,
              error: { code: `mock_step_failed`, retryable: !1 },
            }));
          return;
        }
        ((n.status = `done`), (n.endedAt = new Date().toISOString()));
        let r = co(!0, `${n.tool} done`);
        ((n.result = r),
          this.events.emit({ type: `plan.step.done`, planId: e.planId, stepId: n.id, result: r }));
      }
      ((t.currentStepId = void 0),
        (t.status = `done`),
        this.events.emit({ type: `plan.done`, planId: e.planId }));
    }
  };
function oo(e, t, n, r, i, a, o) {
  return {
    name: e,
    version: `1.0.0`,
    category: t,
    description: a,
    inputSchema: { type: `object` },
    outputSchema: { type: `object` },
    risk: n,
    requiresConfirmation: r,
    requiresLease: o,
    timeoutMs: i,
  };
}
function so(e) {
  return {
    planId: e.planId,
    status: `pending`,
    steps: e.steps.map((e) => ({ id: e.id, tool: e.tool, status: `pending` })),
  };
}
function co(e, t) {
  let n = new Date().toISOString();
  return {
    schemaVersion: `robot-api/v1`,
    ok: e,
    requestId: `mock_req_${Date.now().toString(36)}`,
    status: e ? `done` : `hardware_error`,
    message: t,
    data: {},
    timing: { startedAt: n, endedAt: n, durationMs: 0 },
    robot: { robotId: `mock-robot-001`, hostname: `mock-robot`, softwareVersion: `mock-0.1.0` },
  };
}
function lo(e) {
  return new Promise((t) => globalThis.setTimeout(t, e));
}
function B(e, t, n, r) {
  let i = Error(e);
  return ((i.category = t), (i.retryable = n), (i.status = r), i);
}
var uo = class {
  config;
  constructor(e) {
    this.config = e;
  }
  getHealth() {
    return this.request(`GET`, `/api/health`);
  }
  getTools() {
    return this.request(`GET`, `/api/tools`);
  }
  getTool(e) {
    return this.request(`GET`, `/api/tools/${encodeURIComponent(e)}`);
  }
  validatePlan(e) {
    return this.request(`POST`, `/api/plans/validate`, e, e.planId);
  }
  submitPlan(e) {
    return this.request(`POST`, `/api/plans`, e, e.planId);
  }
  executePlan(e) {
    return this.request(`POST`, `/api/plans/${encodeURIComponent(e)}/execute`, void 0, e);
  }
  stopPlan(e, t) {
    return this.request(`POST`, `/api/plans/${encodeURIComponent(e)}/stop`, { reason: t }, e);
  }
  getPlanState(e) {
    return this.request(`GET`, `/api/plans/${encodeURIComponent(e)}`);
  }
  async stopAll(e) {
    await this.request(`POST`, `/api/watchdog/stop-all`, { reason: e }, `stop-all-${Date.now()}`);
  }
  startVideo(e) {
    return this.request(`POST`, `/api/video/start`, { profile: e }, `video-${e}`);
  }
  async request(e, t, n, r) {
    let i = crypto.randomUUID(),
      a = new URL(t, fo(this.config.baseUrl));
    (a.searchParams.set(`requestId`, i), r && a.searchParams.set(`idempotencyKey`, r));
    let o;
    try {
      o = await fetch(a, {
        method: e,
        headers: {
          Accept: `application/json`,
          'Content-Type': `application/json`,
          'X-Request-Id': i,
          ...(r ? { 'Idempotency-Key': r } : {}),
          ...(this.config.token ? { Authorization: `Bearer ${this.config.token}` } : {}),
        },
        body: n === void 0 ? void 0 : JSON.stringify(n),
      });
    } catch {
      throw B(`Robot API is offline.`, `offline`, !0);
    }
    let s;
    try {
      s = await o.json();
    } catch {
      throw B(`Robot API returned non-JSON response.`, `protocol`, !1, o.status);
    }
    if (s.schemaVersion !== `robot-api/v1`)
      throw B(`Robot API envelope schema mismatch.`, `protocol`, !1, o.status);
    if (!o.ok || !s.ok) {
      let e = V(o.status, s.status);
      throw B(
        s.message || s.error?.detail || `Robot API request failed.`,
        e,
        !!s.error?.retryable,
        o.status,
      );
    }
    return s.data;
  }
};
function fo(e) {
  let t = e.trim();
  return t ? (t.endsWith(`/`) ? t : `${t}/`) : window.location.origin;
}
function V(e, t) {
  return e === 401 || e === 403
    ? `auth`
    : t === `invalid_request`
      ? `validation`
      : t === `unsafe` || t === `blocked`
        ? `business`
        : e >= 500 || t === `unavailable` || t === `timeout`
          ? `offline`
          : `business`;
}
var H = class {
  config;
  handlers = new Set();
  socket = null;
  reconnectTimer = null;
  lastEventId = ``;
  closed = !1;
  constructor(e) {
    this.config = e;
  }
  async connect() {
    ((this.closed = !1), this.openSocket());
  }
  subscribe(e) {
    return (this.handlers.add(e), () => this.handlers.delete(e));
  }
  close() {
    ((this.closed = !0),
      this.reconnectTimer !== null && window.clearTimeout(this.reconnectTimer),
      this.socket?.close(),
      (this.socket = null));
  }
  openSocket() {
    let e = new URL(`/api/events`, po(this.config.baseUrl));
    (this.lastEventId && e.searchParams.set(`lastEventId`, this.lastEventId),
      this.config.token && e.searchParams.set(`token`, this.config.token),
      (this.socket = new WebSocket(e)),
      (this.socket.onmessage = (e) => {
        let t = JSON.parse(String(e.data));
        `eventId` in t && t.eventId && (this.lastEventId = t.eventId);
        for (let e of this.handlers) e(t);
      }),
      (this.socket.onclose = () => this.scheduleReconnect()),
      (this.socket.onerror = () => this.scheduleReconnect()));
  }
  scheduleReconnect() {
    this.closed ||
      this.reconnectTimer !== null ||
      (this.reconnectTimer = window.setTimeout(() => {
        ((this.reconnectTimer = null), this.openSocket());
      }, 1200));
  }
};
function po(e) {
  let t = new URL(e.trim() || window.location.origin);
  return ((t.protocol = t.protocol === `https:` ? `wss:` : `ws:`), t.toString());
}
var mo = class {
    config;
    constructor(e) {
      this.config = e;
    }
    start(e) {
      return this.request(`POST`, `/api/video/start`, { profile: e }, `video-${e}`);
    }
    async stop(e) {
      await this.request(`POST`, `/api/video/stop`, { streamId: e }, e);
    }
    getState(e) {
      return this.request(`GET`, `/api/video/state?streamId=${encodeURIComponent(e)}`);
    }
    async request(e, t, n, r) {
      let i = crypto.randomUUID(),
        a = new URL(t, go(this.config.baseUrl));
      (a.searchParams.set(`requestId`, i), r && a.searchParams.set(`idempotencyKey`, r));
      let o;
      try {
        o = await fetch(a, {
          method: e,
          headers: {
            Accept: `application/json`,
            'Content-Type': `application/json`,
            'X-Request-Id': i,
            ...(r ? { 'Idempotency-Key': r } : {}),
            ...(this.config.token ? { Authorization: `Bearer ${this.config.token}` } : {}),
          },
          body: n === void 0 ? void 0 : JSON.stringify(n),
        });
      } catch {
        throw B(`Robot video API is offline.`, `offline`, !0);
      }
      let s;
      try {
        s = await o.json();
      } catch {
        throw B(`Robot video API returned non-JSON response.`, `protocol`, !1, o.status);
      }
      if (s.schemaVersion !== `robot-api/v1`)
        throw B(`Robot video API envelope schema mismatch.`, `protocol`, !1, o.status);
      if (!o.ok || !s.ok)
        throw B(
          s.message || s.error?.detail || `Robot video API request failed.`,
          o.status === 401 || o.status === 403 ? `auth` : `business`,
          !!s.error?.retryable,
          o.status,
        );
      return s.data;
    }
  },
  ho = class {
    streams = new Map();
    async start(e) {
      let t = {
        streamId: `mock_video_${Date.now().toString(36)}`,
        profile: e,
        transport: e === `teleop` ? `webrtc` : `mjpeg`,
        url: e === `teleop` ? void 0 : `mock://robot/video.mjpeg`,
        signalingUrl: e === `teleop` ? `mock://robot/webrtc-signaling` : void 0,
        token: `mock_video_token_${Date.now().toString(36)}`,
        expiresAt: new Date(Date.now() + 300 * 1e3).toISOString(),
        resolution: { width: 1280, height: 720 },
        fps: e === `snapshot` ? 1 : 15,
        latencyTargetMs: e === `teleop` ? 120 : 600,
      };
      return (this.streams.set(t.streamId, t), t);
    }
    async stop(e) {
      this.streams.delete(e);
    }
    async getState(e) {
      return this.streams.get(e) ?? null;
    }
  };
function go(e) {
  let t = e.trim();
  return t ? (t.endsWith(`/`) ? t : `${t}/`) : window.location.origin;
}
var _o = `lightory.robot.connection`,
  vo = `travel`;
function yo({ getOfficeState: e }) {
  let [t, n] = (0, l.useState)(Do),
    [r, i] = (0, l.useState)([]),
    [a, o] = (0, l.useState)(!1),
    [s, c] = (0, l.useState)(`Robot disconnected`),
    [u, d] = (0, l.useState)([]),
    [f, p] = (0, l.useState)(null),
    [m, h] = (0, l.useState)(null),
    g = (0, l.useRef)(1e5),
    _ = (0, l.useRef)(null),
    v = (0, l.useRef)(null),
    y = (0, l.useRef)([]),
    b = (0, l.useMemo)(() => bo(t), [t]);
  ((0, l.useEffect)(() => {
    _.current = f;
  }, [f]),
    (0, l.useEffect)(() => {
      y.current = r;
    }, [r]));
  let x = (0, l.useCallback)((e, t = `running`, n = `system`) => {
    d((r) =>
      [
        ...r,
        {
          id: ++g.current,
          runId: _.current ?? `robot-runtime`,
          roleId: `robot`,
          status: t,
          stream: n,
          content: e,
        },
      ].slice(-500),
    );
  }, []);
  (0, l.useEffect)(() => {
    let t = !1;
    (o(!1),
      c(`Connecting robot...`),
      i([]),
      b.api
        .getHealth()
        .then((e) => {
          if (!t) return (o(!0), c(`${e.robotId} ${e.softwareVersion}`), b.api.getTools());
        })
        .then((e) => {
          !t && e && (i(e), x(`Robot registry loaded: ${e.length} tools.`, `done`));
        })
        .catch((e) => {
          t || (o(!1), c(e.message), x(`Robot connection failed: ${e.message}`, `error`, `stderr`));
        }),
      b.events.connect());
    let n = b.events.subscribe((t) => {
      (xo(t, x, e),
        t.type === `plan.started` && p(t.planId),
        (t.type === `plan.done` || t.type === `plan.failed` || t.type === `plan.stopped`) &&
          p(null));
    });
    return () => {
      ((t = !0), n(), b.events.close());
    };
  }, [x, b, e]);
  let S = (0, l.useCallback)((e) => {
      (localStorage.setItem(_o, JSON.stringify(e)), n(e));
    }, []),
    C = (0, l.useCallback)(
      async (e, t) => {
        if (!t.ok) {
          x(Co(t), `error`, `stderr`);
          return;
        }
        (x(`Submit plan ${e.planId}: ${e.intent}`, `running`),
          p(e.planId),
          await b.api.submitPlan(e),
          await b.api.executePlan(e.planId));
      },
      [x, b.api],
    ),
    w = (0, l.useCallback)(
      async (e) => {
        let t = $a({ padId: `pad-webview`, sessionId: Oo() }, e);
        x(`Build robot-plan/v1 ${t.planId}: ${t.intent}`);
        let n = to(t, y.current);
        if (!n.ok) return { plan: t, validation: n };
        let r = await b.api.validatePlan(t);
        return (
          x(Co(r), r.ok ? `done` : `error`, r.ok ? `system` : `stderr`),
          { plan: t, validation: r }
        );
      },
      [x, b.api],
    );
  return {
    config: t,
    setConfig: S,
    tools: r,
    connected: a,
    statusText: s,
    entries: u,
    activePlanId: f,
    pendingConfirmation: m,
    handleConsoleInput: (0, l.useCallback)(
      (e) => {
        let t = To(e);
        if (t) return (wo(t, b.video, v, x), !0);
        let n = Qa(e);
        return n
          ? (x(`Console intent: ${e}`, `running`),
            w(n)
              .then(({ plan: e, validation: t }) => {
                if (!t.ok) {
                  x(Co(t), `error`, `stderr`);
                  return;
                }
                if (e.requiresUserConfirmation) {
                  (h({ plan: e, validation: t }),
                    x(`High-risk plan waiting for confirmation: ${e.intent}`, `running`));
                  return;
                }
                C(e, t);
              })
              .catch((e) => x(`Robot plan failed: ${e.message}`, `error`, `stderr`)),
            !0)
          : !1;
      },
      [x, b.video, C, w],
    ),
    confirmPendingPlan: (0, l.useCallback)(() => {
      let e = m;
      e &&
        (h(null),
        C(e.plan, e.validation).catch((e) =>
          x(`Robot execute failed: ${e.message}`, `error`, `stderr`),
        ));
    }, [x, C, m]),
    cancelPendingPlan: (0, l.useCallback)(() => {
      m && (x(`Cancelled plan ${m.plan.planId}.`, `done`), h(null));
    }, [x, m]),
    emergencyStop: (0, l.useCallback)(() => {
      let e = _.current;
      (x(`Emergency stop requested.`, `running`, `stderr`),
        Promise.all([
          e ? b.api.stopPlan(e, `pad emergency stop`) : Promise.resolve(),
          b.api.stopAll(`pad emergency stop`),
        ]).catch((e) => x(`Emergency stop failed: ${e.message}`, `error`, `stderr`)));
    }, [x, b.api]),
  };
}
function bo(e) {
  if (e.mode === `mock`) {
    let e = new io();
    return { api: new ao(e), events: e, video: new ho() };
  }
  return { api: new uo(e), events: new H(e), video: new mo(e) };
}
function xo(e, t, n) {
  let r = n(),
    i = Ot(vo);
  ((e.type === `plan.started` || e.type === `plan.step.started`) && r.setRoleTaskWorking(i),
    e.type === `plan.done` && r.setRoleTaskWeather(i, `sun`),
    (e.type === `plan.failed` || e.type === `safety.blocked`) && r.clearRoleTaskState(i),
    t(
      So(e),
      e.type.includes(`failed`) ? `error` : `running`,
      e.type.includes(`failed`) ? `stderr` : `system`,
    ));
}
function So(e) {
  return e.type === `plan.step.started`
    ? `Event ${e.type}: ${e.planId} ${e.stepId}`
    : e.type === `plan.step.done` || e.type === `plan.step.failed`
      ? `Event ${e.type}: ${e.planId} ${e.stepId} ${e.result.message}`
      : e.type === `plan.stopped`
        ? `Event ${e.type}: ${e.planId} ${e.reason}`
        : e.type === `safety.blocked`
          ? `Event ${e.type}: ${e.reason}`
          : e.type === `robot.status`
            ? `Event ${e.type}: ${e.data.mode ?? `online`}`
            : `planId` in e
              ? `Event ${e.type}: ${e.planId}`
              : `Event ${e.type}`;
}
function Co(e) {
  if (e.ok) {
    let t = e.warnings.map((e) => e.code).join(`, `);
    return `Validate ${e.planId}: ok${t ? `, warnings: ${t}` : ``}`;
  }
  return `Validate ${e.planId}: ${e.errors.map((e) => `${e.code} ${e.message}`).join(`; `)}`;
}
function wo(e, t, n, r) {
  if (e.type === `start`) {
    (r(`Start ${e.profile} video stream.`, `running`),
      t
        .start(e.profile)
        .then((e) => {
          ((n.current = e.streamId), r(Eo(e), `done`));
        })
        .catch((e) => r(`Robot video failed: ${e.message}`, `error`, `stderr`)));
    return;
  }
  let i = n.current;
  if (!i) {
    r(`No active video stream.`, `done`);
    return;
  }
  if (e.type === `status`) {
    (r(`Query video stream ${i}.`, `running`),
      t
        .getState(i)
        .then((e) => r(e ? Eo(e) : `Video ${i}: stopped`, `done`))
        .catch((e) => r(`Robot video state failed: ${e.message}`, `error`, `stderr`)));
    return;
  }
  (r(`Stop video stream ${i}.`, `running`),
    t
      .stop(i)
      .then(() => {
        ((n.current = null), r(`Video ${i}: stopped`, `done`));
      })
      .catch((e) => r(`Robot video stop failed: ${e.message}`, `error`, `stderr`)));
}
function To(e) {
  let t = e.trim().toLowerCase();
  return /视频|video|摄像头/u.test(t)
    ? /状态|state|查询/u.test(t)
      ? { type: `status` }
      : /停止|关闭|stop|close/u.test(t)
        ? { type: `stop` }
        : /teleop|遥控|远程操控/u.test(t)
          ? { type: `start`, profile: `teleop` }
          : /snapshot|快照/u.test(t)
            ? { type: `start`, profile: `snapshot` }
            : { type: `start`, profile: `monitor` }
    : null;
}
function Eo(e) {
  let t = e.signalingUrl ?? e.url ?? `native video channel`;
  return `Video ${e.streamId}: ${e.profile}/${e.transport} ${e.resolution.width}x${e.resolution.height}@${e.fps}fps, latency ${e.latencyTargetMs}ms, endpoint ${t}`;
}
function Do() {
  let e = {
      mode: `mock`,
      baseUrl: `https://mock.robot.local`,
      robotId: `mock-robot-001`,
      token: ``,
      certificateFingerprint: ``,
    },
    t = localStorage.getItem(_o);
  if (!t) return e;
  try {
    return { ...e, ...JSON.parse(t) };
  } catch {
    return e;
  }
}
function Oo() {
  let e = `lightory.robot.sessionId`,
    t = sessionStorage.getItem(e);
  if (t) return t;
  let n = `sess_${Date.now().toString(36)}`;
  return (sessionStorage.setItem(e, n), n);
}
function ko(e) {
  if (typeof window > `u`) return;
  window.__lightoryTestHooks || (window.__lightoryTestHooks = {});
  let t = window.__lightoryTestHooks;
  ((t.addAgentLog ||= []),
    (t.getCharacters = () => {
      let t = e.current;
      return t
        ? Array.from(t.characters.values()).map((e) => ({
            id: e.id,
            matrixEffect: e.matrixEffect,
            bubbleType: e.bubbleType,
            waitingAwaitingInput: e.waitingAwaitingInput,
            isActive: e.isActive,
          }))
        : [];
    }),
    (t.selectAgent = (t) => {
      let n = e.current;
      n && (n.selectedAgentId = t);
    }),
    (t.getPets = () => {
      let t = e.current;
      return t
        ? t.pets.map((e) => ({
            id: e.id,
            name: e.name,
            petType: e.petType,
            state: e.state,
            x: e.x,
            y: e.y,
            bubbleType: e.bubbleType,
          }))
        : [];
    }),
    (t.petClick = (t) => {
      let n = e.current;
      if (!n) return;
      let r = n.pets.find((e) => e.id === t);
      r && (r.bubbleType ? n.dismissPetBubble(t) : n.showPetBubble(t));
    }));
  let n = Ga.prototype.addAgent;
  Ga.prototype.addAgent = function (e, r, i, a, o, s) {
    n.call(this, e, r, i, a, o, s);
    let c = this.characters.get(e);
    t.addAgentLog?.push({
      id: e,
      skipSpawnEffect: o,
      matrixEffectAtCreation: c?.matrixEffect ?? null,
    });
  };
}
var Ao = { current: null },
  U = new Ra(),
  jo = 3,
  Mo = () => Object.fromEntries(Dt.map((e) => [e.id, Jt(e.id)])),
  No = [
    `storyteller`,
    `checker`,
    `weather`,
    `travel`,
    `dresser`,
    `encyclopedia`,
    `captain`,
    `poster`,
  ];
wn && ko(Ao);
function Po() {
  return ((Ao.current ||= new Ga()), Ao.current);
}
function Fo(e, t) {
  let n = Dt.map((e) => e.id).filter((t) => e.has(t)),
    r = new Set(n),
    i = new Map(),
    a = new Map();
  for (let e of n) (i.set(e, new Set()), a.set(e, new Set()));
  for (let e of t)
    !r.has(e.sourceRoleId) ||
      !r.has(e.targetRoleId) ||
      (i.get(e.targetRoleId)?.add(e.sourceRoleId), a.get(e.sourceRoleId)?.add(e.targetRoleId));
  let o = [],
    s = new Set(n);
  for (; s.size > 0; ) {
    let e = n.filter((e) => s.has(e) && [...(i.get(e) ?? [])].every((e) => !s.has(e)));
    if (e.length === 0) {
      o.push(n.filter((e) => s.has(e)));
      break;
    }
    o.push(e);
    for (let t of e) {
      s.delete(t);
      for (let e of a.get(t) ?? []) i.get(e)?.delete(t);
    }
  }
  return o;
}
function Io() {
  (0, l.useEffect)(() => {}, []);
  let e = Wr(Po, U),
    t = (0, l.useCallback)(() => e.isEditMode && e.isDirty, [e.isEditMode, e.isDirty]),
    {
      agents: n,
      selectedAgent: r,
      agentTools: i,
      agentStatuses: a,
      agentAwaitingInput: o,
      subagentTools: s,
      subagentCharacters: c,
      layoutReady: u,
      layoutWasReset: f,
      loadedAssets: p,
      externalAssetDirectories: m,
      lastSeenVersion: g,
      extensionVersion: _,
      watchAllSessions: v,
      setWatchAllSessions: y,
      alwaysShowLabels: S,
      hooksEnabled: C,
      setHooksEnabled: T,
      hooksInfoShown: E,
      roleTaskConsoleEntries: ee,
      lastRoleTaskStatus: k,
    } = Ni(Po, e.setLastSavedLayout, t),
    [te, ne] = (0, l.useState)(!1),
    re = f && !te,
    [ie, ae] = (0, l.useState)(!1),
    [A, j] = (0, l.useState)(!1),
    [oe, se] = (0, l.useState)(!1),
    [ce, le] = (0, l.useState)(!1),
    [ue, M] = (0, l.useState)(!1),
    [de, fe] = (0, l.useState)(!1),
    [pe, me] = (0, l.useState)(!0),
    [he, ge] = (0, l.useState)(() => new Set()),
    [_e, ve] = (0, l.useState)(Mo),
    [ye, be] = (0, l.useState)(null),
    xe = (0, l.useRef)(Mo()),
    [Se, Ce] = (0, l.useState)(`idle`),
    we = (0, l.useRef)([]),
    Te = (0, l.useRef)([]),
    Ee = (0, l.useRef)(null),
    De = (0, l.useRef)(!1),
    Oe = (0, l.useRef)(new Set()),
    ke = (0, l.useRef)(new Map()),
    Ae = (0, l.useRef)(new Map()),
    je = (0, l.useRef)(new Set()),
    Me = (0, l.useRef)(!1),
    Ne = d(_);
  (0, l.useEffect)(() => {
    xe.current = _e;
  }, [_e]);
  let Pe = (0, l.useCallback)(() => {
      w.send({ type: `setLastSeenVersion`, version: Ne });
    }, [Ne]),
    Fe = (0, l.useCallback)(() => {
      (ae(!0), w.send({ type: `setLastSeenVersion`, version: Ne }));
    }, [Ne]);
  (0, l.useEffect)(() => {
    fe(S);
  }, [S]);
  let Ie = (0, l.useCallback)(() => M((e) => !e), []),
    Le = (0, l.useCallback)(() => {
      fe((e) => {
        let t = !e;
        return (w.send({ type: `setAlwaysShowLabels`, enabled: t }), t);
      });
    }, []),
    Re = (0, l.useCallback)((e) => {
      w.send({ type: `focusAgent`, id: e });
    }, []),
    ze = (0, l.useRef)(null),
    [Be, Ve] = (0, l.useState)(0),
    He = yo({ getOfficeState: Po });
  Gr(
    e.isEditMode,
    U,
    e.handleDeleteSelected,
    e.handleRotateSelected,
    e.handleToggleState,
    e.handleUndo,
    e.handleRedo,
    (0, l.useCallback)(() => Ve((e) => e + 1), []),
    e.handleToggleEditMode,
  );
  let Ue = (0, l.useCallback)((e) => {
      w.send({ type: `closeAgent`, id: e });
    }, []),
    We = (0, l.useCallback)((e) => {
      let t = Po().subagentMeta.get(e),
        n = t ? t.parentAgentId : e;
      w.send({ type: `focusAgent`, id: n });
    }, []),
    Ge = (0, l.useCallback)((e, t, n) => {
      let r = kt(e);
      if (!r) return;
      let i = Ot(e),
        a = Po();
      a.addRoleAgentAtTile(i, r.palette, t, n, r.name);
      let o = a.characters.get(i);
      (o && (o.roleTaskIcon = r.roleTaskIcon),
        (a.selectedAgentId = i),
        (a.cameraFollowId = i),
        ge((t) => new Set(t).add(e)));
    }, []),
    Ke = (0, l.useCallback)((e) => {
      let t = Po(),
        n = t.getLayout(),
        r = Math.max(1, Math.floor(n.cols / 2) - Math.floor(e.length / 2)),
        i = Math.max(1, n.rows - 3);
      (me(!0),
        ge((n) => {
          let a = new Set(n);
          return (
            e.forEach((e, n) => {
              if (a.has(e)) return;
              let o = kt(e);
              if (!o) return;
              let s = Ot(e);
              t.addRoleAgentAtTile(s, o.palette, r + n, i, o.name);
              let c = t.characters.get(s);
              (c && (c.roleTaskIcon = o.roleTaskIcon), a.add(e));
            }),
            a
          );
        }));
    }, []),
    qe = (0, l.useCallback)(
      (e) => {
        e && Ke(Lo(e));
      },
      [Ke],
    );
  ((0, l.useEffect)(() => {
    !u || Me.current || ((Me.current = !0), Ke(No));
  }, [Ke, u]),
    (0, l.useEffect)(() => {
      for (let e of ee)
        if (
          !je.current.has(e.id) &&
          (je.current.add(e.id), e.status === `done` && e.content.trim())
        ) {
          let t = e.content.trim();
          Ae.current.set(e.roleId, t);
        }
    }, [ee]));
  let Je = (0, l.useCallback)(
      (e) =>
        Te.current
          .filter((t) => t.targetRoleId === e)
          .map((e) => {
            let t =
              Ae.current.get(e.sourceRoleId) ??
              [...ee]
                .reverse()
                .find((t) => t.roleId === e.sourceRoleId && t.status === `done` && t.content.trim())
                ?.content.trim();
            return t ? { sourceRoleId: e.sourceRoleId, card: e.card, content: t } : null;
          })
          .filter((e) => e !== null),
      [ee],
    ),
    Ye = (0, l.useCallback)(
      (e) => {
        let t = Po(),
          n = xe.current[e];
        ke.current.set(e, (ke.current.get(e) ?? 0) + 1);
        let r = Ot(e);
        t.setRoleTaskWorking(r);
        let i = t.characters.get(r);
        w.send({
          type: `startRoleTask`,
          roleId: e,
          col: i?.tileCol ?? 0,
          row: i?.tileRow ?? 0,
          inputCards: Je(e),
          taskOverride: n?.markdown.trim() ? { markdown: n.markdown } : void 0,
        });
      },
      [Je],
    ),
    Xe = (0, l.useCallback)((e) => {
      let t = Po();
      for (let n of e) t.clearRoleTaskState(Ot(n));
    }, []),
    Ze = (0, l.useCallback)(
      (e) => {
        (Ce(`running`), (Oe.current = new Set(e)));
        for (let t of e) Ye(t);
      },
      [Ye],
    ),
    Qe = (0, l.useCallback)(
      (t) => {
        if (he.size === 0) return;
        (e.handleSetEditMode(!1),
          Ce(`running`),
          (De.current = !1),
          (Ee.current = null),
          (ke.current = new Map()),
          (Ae.current = new Map()),
          (je.current = new Set()),
          (Te.current = t));
        let n = Fo(he, t),
          r = n.shift();
        ((we.current = n), r && Ze(r));
      },
      [he, e, Ze],
    );
  (0, l.useEffect)(() => {
    if (!k || (k.status !== `done` && k.status !== `error`)) return;
    if (!Oe.current.has(k.roleId)) {
      Se !== `running` && Se !== `pausing` && Xe([k.roleId]);
      return;
    }
    if (k.status === `error`) {
      if ((ke.current.get(k.roleId) ?? 1) < jo) {
        Ye(k.roleId);
        return;
      }
      ((Oe.current = new Set()),
        (we.current = []),
        (Ee.current = null),
        (De.current = !1),
        Ce(`error`));
      return;
    }
    let e = new Set(Oe.current);
    if ((e.delete(k.roleId), (Oe.current = e), e.size > 0)) return;
    let t = we.current.shift();
    if (t) {
      if (De.current) {
        ((Ee.current = t), (De.current = !1), Xe(Dt.map((e) => e.id)), Ce(`paused`));
        return;
      }
      Ze(t);
      return;
    }
    Ce(`completed`);
  }, [Xe, Se, k, Ze, Ye]);
  let $e = (0, l.useCallback)(() => {
      Se === `running` && ((De.current = !0), Ce(`pausing`));
    }, [Se]),
    et = (0, l.useCallback)(() => {
      if (Se !== `paused`) return;
      let e = Ee.current ?? we.current.shift();
      if (((Ee.current = null), (De.current = !1), e)) {
        Ze(e);
        return;
      }
      Ce(`completed`);
    }, [Se, Ze]),
    tt = (0, l.useCallback)(() => {
      (Xe(Dt.map((e) => e.id)),
        (Oe.current = new Set()),
        (we.current = []),
        (Ee.current = null),
        (De.current = !1),
        Ce(`idle`));
    }, [Xe]),
    nt = (0, l.useCallback)(() => {
      (Xe(Dt.map((e) => e.id)),
        (Oe.current = new Set()),
        (we.current = []),
        (Ee.current = null),
        (De.current = !1),
        Ce(`idle`),
        e.handleSetEditMode(!0));
    }, [Xe, e]),
    rt = (0, l.useCallback)((e) => {
      be(e);
    }, []),
    it = (0, l.useCallback)((e) => {
      ((xe.current = { ...xe.current, [e.roleId]: e }), ve((t) => ({ ...t, [e.roleId]: e })));
    }, []),
    at = (0, l.useCallback)(
      (t) => {
        ((xe.current = { ...xe.current, [t.roleId]: t }),
          ve((e) => ({ ...e, [t.roleId]: t })),
          be(null),
          e.handleSetEditMode(!1),
          Ce(`running`),
          (De.current = !1),
          (Ee.current = null),
          (ke.current = new Map()),
          (Ae.current = new Map()),
          (je.current = new Set()),
          (Te.current = []),
          (we.current = []),
          window.setTimeout(() => Ze([t.roleId]), 0));
      },
      [e, Ze],
    ),
    ot = Po(),
    st =
      e.isEditMode &&
      (() => {
        if (U.selectedFurnitureUid) {
          let e = ot.getLayout().furniture.find((e) => e.uid === U.selectedFurnitureUid);
          if (e && nr(e.type)) return !0;
        }
        return !!(U.activeTool === I.FURNITURE_PLACE && nr(U.selectedFurnitureType));
      })();
  return u
    ? (0, h.jsxs)(`div`, {
        ref: ze,
        className: `w-full h-full relative overflow-hidden`,
        children: [
          (0, h.jsx)(Na, {
            officeState: ot,
            onClick: We,
            isEditMode: e.isEditMode,
            editorState: U,
            onEditorTileAction: e.handleEditorTileAction,
            onEditorEraseAction: e.handleEditorEraseAction,
            onEditorSelectionChange: e.handleEditorSelectionChange,
            onDeleteSelected: e.handleDeleteSelected,
            onRotateSelected: e.handleRotateSelected,
            onDragMove: e.handleDragMove,
            onRoleDrop: Ge,
            editorTick: e.editorTick,
            zoom: e.zoom,
            onZoomChange: e.handleZoomChange,
            panRef: e.panRef,
          }),
          ue
            ? (0, h.jsx)(D, {
                agents: n,
                selectedAgent: r,
                agentTools: i,
                agentStatuses: a,
                subagentTools: s,
                officeState: ot,
                onSelectAgent: Re,
              })
            : (0, h.jsxs)(h.Fragment, {
                children: [
                  (0, h.jsx)(zn, { zoom: e.zoom, onZoomChange: e.handleZoomChange }),
                  (0, h.jsx)(`div`, {
                    className: `absolute inset-0 pointer-events-none`,
                    style: { background: `var(--vignette)` },
                  }),
                  e.isEditMode && e.isDirty && (0, h.jsx)(O, { editor: e, editorState: U }),
                  st &&
                    (0, h.jsx)(`div`, {
                      className: `absolute left-1/2 -translate-x-1/2 z-11 bg-accent-bright text-white text-sm py-3 px-8 rounded-none border-2 border-accent shadow-pixel pointer-events-none whitespace-nowrap`,
                      style: { top: e.isDirty ? 64 : 8 },
                      children: `Rotate (R)`,
                    }),
                  e.isEditMode &&
                    (() => {
                      let t = U.selectedFurnitureUid,
                        n = t
                          ? (ot.getLayout().furniture.find((e) => e.uid === t)?.color ?? null)
                          : null;
                      return (0, h.jsx)(Wa, {
                        activeTool: U.activeTool,
                        selectedTileType: U.selectedTileType,
                        selectedFurnitureType: U.selectedFurnitureType,
                        selectedFurnitureUid: t,
                        selectedFurnitureColor: n,
                        floorColor: U.floorColor,
                        wallColor: U.wallColor,
                        selectedWallSet: U.selectedWallSet,
                        onToolChange: e.handleToolChange,
                        onTileTypeChange: e.handleTileTypeChange,
                        onFloorColorChange: e.handleFloorColorChange,
                        onWallColorChange: e.handleWallColorChange,
                        onWallSetChange: e.handleWallSetChange,
                        onSelectedFurnitureColorChange: e.handleSelectedFurnitureColorChange,
                        onFurnitureTypeChange: e.handleFurnitureTypeChange,
                        loadedAssets: p,
                        activePetTypes: ot.getActivePetTypes(),
                        petCount: ai(),
                        onPetToggle: e.handlePetToggle,
                      });
                    })(),
                  (0, h.jsx)(La, {
                    officeState: ot,
                    agents: n,
                    agentTools: i,
                    agentAwaitingInput: o,
                    subagentCharacters: c,
                    containerRef: ze,
                    zoom: e.zoom,
                    panRef: e.panRef,
                    onCloseAgent: Ue,
                    alwaysShowOverlay: de,
                  }),
                  pe &&
                    (0, h.jsx)(Mt, {
                      officeState: ot,
                      activeRoleIds: he,
                      isEditMode: e.isEditMode,
                      runStatus: Se,
                      containerRef: ze,
                      zoom: e.zoom,
                      panRef: e.panRef,
                      onConfigureRole: rt,
                      onRunTeam: Qe,
                      onPauseRun: $e,
                      onResumeRun: et,
                      onStopRun: tt,
                      onBackToEdit: nt,
                    }),
                  (0, h.jsx)(un, {
                    roleId: ye,
                    config: ye ? _e[ye] : void 0,
                    onClose: () => be(null),
                    onSave: it,
                    onRunRole: at,
                  }),
                ],
              }),
          !E &&
            !ce &&
            (0, h.jsx)(Ln, {
              title: `Instant Detection Active`,
              position: `top-right`,
              onDismiss: () => {
                (le(!0), w.send({ type: `setHooksInfoShown` }));
              },
              children: (0, h.jsxs)(`span`, {
                className: `text-sm text-text leading-none`,
                children: [
                  `Your agents now respond in real-time.`,
                  ` `,
                  (0, h.jsx)(`span`, {
                    className: `text-accent cursor-pointer underline`,
                    onClick: () => {
                      (se(!0), le(!0), w.send({ type: `setHooksInfoShown` }));
                    },
                    children: `View more`,
                  }),
                ],
              }),
            }),
          (0, h.jsx)(b, {
            isOpen: oe,
            onClose: () => se(!1),
            title: `Instant Detection is ON`,
            zIndex: 52,
            children: (0, h.jsxs)(`div`, {
              className: `text-base text-text px-10`,
              style: { lineHeight: 1.4 },
              children: [
                (0, h.jsx)(`p`, {
                  className: `mb-8`,
                  children: `Your Lightory office now reacts in real-time:`,
                }),
                (0, h.jsxs)(`ul`, {
                  className: `mb-8 pl-18 list-disc m-0`,
                  children: [
                    (0, h.jsx)(`li`, {
                      className: `text-sm mb-2`,
                      children: `Permission prompts appear instantly`,
                    }),
                    (0, h.jsx)(`li`, {
                      className: `text-sm mb-2`,
                      children: `Turn completions detected the moment they happen`,
                    }),
                    (0, h.jsx)(`li`, {
                      className: `text-sm mb-2`,
                      children: `Sound notifications play immediately`,
                    }),
                  ],
                }),
                (0, h.jsx)(`p`, {
                  className: `mb-12 text-text-muted`,
                  children: `This works through Claude Code Hooks, small event listeners that notify Lightory whenever something happens in your Claude sessions.`,
                }),
                (0, h.jsx)(`div`, {
                  className: `text-center`,
                  children: (0, h.jsx)(`button`, {
                    onClick: () => se(!1),
                    className: `py-4 px-20 text-lg bg-accent text-white border-2 border-accent rounded-none cursor-pointer shadow-pixel`,
                    children: `Got it`,
                  }),
                }),
                (0, h.jsxs)(`p`, {
                  className: `mt-8 text-xs text-text-muted text-center`,
                  children: [`To disable, go to Settings `, `>`, ` Instant Detection`],
                }),
              ],
            }),
          }),
          (0, h.jsx)(xn, {
            entries: [...ee, ...He.entries],
            isSettingsOpen: A,
            robotConnected: He.connected,
            robotStatusText: He.statusText,
            hasActiveRobotPlan: He.activePlanId !== null,
            hasPendingRobotConfirmation: He.pendingConfirmation !== null,
            onToggleSettings: () => j((e) => !e),
            onSubmitInput: (e) => (qe(Qa(e)), He.handleConsoleInput(e)),
            onRobotEmergencyStop: He.emergencyStop,
            onConfirmRobotPlan: He.confirmPendingPlan,
            onCancelRobotPlan: He.cancelPendingPlan,
          }),
          (0, h.jsx)(Rn, {
            currentVersion: _,
            lastSeenVersion: g,
            onDismiss: Pe,
            onOpenChangelog: Fe,
          }),
          (0, h.jsx)(x, { isOpen: ie, onClose: () => ae(!1), currentVersion: _ }),
          (0, h.jsx)(Fn, {
            isOpen: A,
            onClose: () => j(!1),
            isDebugMode: ue,
            onToggleDebugMode: Ie,
            alwaysShowOverlay: de,
            onToggleAlwaysShowOverlay: Le,
            showRoleVisualizer: pe,
            onToggleRoleVisualizer: () => me((e) => !e),
            externalAssetDirectories: m,
            watchAllSessions: v,
            onToggleWatchAllSessions: () => {
              let e = !v;
              (y(e), w.send({ type: `setWatchAllSessions`, enabled: e }));
            },
            hooksEnabled: C,
            onToggleHooksEnabled: () => {
              let e = !C;
              (T(e), w.send({ type: `setHooksEnabled`, enabled: e }));
            },
            robotConfig: He.config,
            robotConnected: He.connected,
            robotStatusText: He.statusText,
            robotTools: He.tools,
            onRobotConfigChange: He.setConfig,
          }),
          re && (0, h.jsx)(It, { onDismiss: () => ne(!0) }),
        ],
      })
    : (0, h.jsx)(`div`, {
        className: `w-full h-full flex items-center justify-center `,
        children: `Loading...`,
      });
}
function Lo(e) {
  return e.type === `rememberPoi`
    ? [`storyteller`, `weather`]
    : e.type === `moveToPoi`
      ? [`storyteller`, `checker`, `weather`, `travel`, `encyclopedia`, `captain`, `poster`]
      : e.type === `speech`
        ? [`storyteller`, `captain`]
        : e.type === `led`
          ? [`storyteller`, `poster`]
          : No;
}
(0, u.createRoot)(document.getElementById(`root`)).render(
  (0, h.jsx)(l.StrictMode, { children: (0, h.jsx)(Io, {}) }),
);
