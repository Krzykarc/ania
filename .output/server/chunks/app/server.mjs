import { version, unref, inject, useSSRContext, defineComponent, computed, ref, h, resolveComponent, mergeProps, withCtx, createVNode, createTextVNode, toDisplayString, openBlock, createBlock, Fragment, renderList, createApp, effectScope, reactive, hasInjectionContext, getCurrentInstance, provide, onErrorCaptured, onServerPrefetch, resolveDynamicComponent, toRef, shallowRef, shallowReactive, isReadonly, defineAsyncComponent, isRef, isShallow, isReactive, toRaw, nextTick } from 'vue';
import { d as useRuntimeConfig$1, h as createError$1, $ as $fetch, l as hasProtocol, p as parseURL, m as parseQuery, n as createHooks, w as withTrailingSlash, o as withoutTrailingSlash, q as withQuery, r as isScriptProtocol, j as joinURL, t as sanitizeStatusCode } from '../nitro/node-server.mjs';
import { getActiveHead } from 'unhead';
import { defineHeadPlugin } from '@unhead/shared';
import { createMemoryHistory, createRouter, START_LOCATION } from 'vue-router';
import { ssrRenderAttrs, ssrRenderClass, ssrRenderAttr, ssrRenderComponent, ssrRenderList, ssrInterpolate, ssrRenderSlot, ssrRenderSuspense, ssrRenderVNode } from 'vue/server-renderer';
import 'node:http';
import 'node:https';
import 'fs';
import 'path';
import 'node:fs';
import 'node:url';

function createContext$1(opts = {}) {
  let currentInstance;
  let isSingleton = false;
  const checkConflict = (instance) => {
    if (currentInstance && currentInstance !== instance) {
      throw new Error("Context conflict");
    }
  };
  let als;
  if (opts.asyncContext) {
    const _AsyncLocalStorage = opts.AsyncLocalStorage || globalThis.AsyncLocalStorage;
    if (_AsyncLocalStorage) {
      als = new _AsyncLocalStorage();
    } else {
      console.warn("[unctx] `AsyncLocalStorage` is not provided.");
    }
  }
  const _getCurrentInstance = () => {
    if (als && currentInstance === void 0) {
      const instance = als.getStore();
      if (instance !== void 0) {
        return instance;
      }
    }
    return currentInstance;
  };
  return {
    use: () => {
      const _instance = _getCurrentInstance();
      if (_instance === void 0) {
        throw new Error("Context is not available");
      }
      return _instance;
    },
    tryUse: () => {
      return _getCurrentInstance();
    },
    set: (instance, replace) => {
      if (!replace) {
        checkConflict(instance);
      }
      currentInstance = instance;
      isSingleton = true;
    },
    unset: () => {
      currentInstance = void 0;
      isSingleton = false;
    },
    call: (instance, callback) => {
      checkConflict(instance);
      currentInstance = instance;
      try {
        return als ? als.run(instance, callback) : callback();
      } finally {
        if (!isSingleton) {
          currentInstance = void 0;
        }
      }
    },
    async callAsync(instance, callback) {
      currentInstance = instance;
      const onRestore = () => {
        currentInstance = instance;
      };
      const onLeave = () => currentInstance === instance ? onRestore : void 0;
      asyncHandlers$1.add(onLeave);
      try {
        const r = als ? als.run(instance, callback) : callback();
        if (!isSingleton) {
          currentInstance = void 0;
        }
        return await r;
      } finally {
        asyncHandlers$1.delete(onLeave);
      }
    }
  };
}
function createNamespace$1(defaultOpts = {}) {
  const contexts = {};
  return {
    get(key, opts = {}) {
      if (!contexts[key]) {
        contexts[key] = createContext$1({ ...defaultOpts, ...opts });
      }
      contexts[key];
      return contexts[key];
    }
  };
}
const _globalThis$1 = typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : typeof global !== "undefined" ? global : {};
const globalKey$2 = "__unctx__";
const defaultNamespace = _globalThis$1[globalKey$2] || (_globalThis$1[globalKey$2] = createNamespace$1());
const getContext = (key, opts = {}) => defaultNamespace.get(key, opts);
const asyncHandlersKey$1 = "__unctx_async_handlers__";
const asyncHandlers$1 = _globalThis$1[asyncHandlersKey$1] || (_globalThis$1[asyncHandlersKey$1] = /* @__PURE__ */ new Set());

const appConfig = useRuntimeConfig$1().app;
const baseURL = () => appConfig.baseURL;
const nuxtAppCtx = /* @__PURE__ */ getContext("nuxt-app", {
  asyncContext: false
});
const NuxtPluginIndicator = "__nuxt_plugin";
function createNuxtApp(options) {
  let hydratingCount = 0;
  const nuxtApp = {
    _scope: effectScope(),
    provide: void 0,
    globalName: "nuxt",
    versions: {
      get nuxt() {
        return "3.8.0";
      },
      get vue() {
        return nuxtApp.vueApp.version;
      }
    },
    payload: reactive({
      data: {},
      state: {},
      _errors: {},
      ...{ serverRendered: true }
    }),
    static: {
      data: {}
    },
    runWithContext: (fn) => nuxtApp._scope.run(() => callWithNuxt(nuxtApp, fn)),
    isHydrating: false,
    deferHydration() {
      if (!nuxtApp.isHydrating) {
        return () => {
        };
      }
      hydratingCount++;
      let called = false;
      return () => {
        if (called) {
          return;
        }
        called = true;
        hydratingCount--;
        if (hydratingCount === 0) {
          nuxtApp.isHydrating = false;
          return nuxtApp.callHook("app:suspense:resolve");
        }
      };
    },
    _asyncDataPromises: {},
    _asyncData: {},
    _payloadRevivers: {},
    ...options
  };
  nuxtApp.hooks = createHooks();
  nuxtApp.hook = nuxtApp.hooks.hook;
  {
    async function contextCaller(hooks, args) {
      for (const hook of hooks) {
        await nuxtApp.runWithContext(() => hook(...args));
      }
    }
    nuxtApp.hooks.callHook = (name, ...args) => nuxtApp.hooks.callHookWith(contextCaller, name, ...args);
  }
  nuxtApp.callHook = nuxtApp.hooks.callHook;
  nuxtApp.provide = (name, value) => {
    const $name = "$" + name;
    defineGetter(nuxtApp, $name, value);
    defineGetter(nuxtApp.vueApp.config.globalProperties, $name, value);
  };
  defineGetter(nuxtApp.vueApp, "$nuxt", nuxtApp);
  defineGetter(nuxtApp.vueApp.config.globalProperties, "$nuxt", nuxtApp);
  {
    if (nuxtApp.ssrContext) {
      nuxtApp.ssrContext.nuxt = nuxtApp;
      nuxtApp.ssrContext._payloadReducers = {};
      nuxtApp.payload.path = nuxtApp.ssrContext.url;
    }
    nuxtApp.ssrContext = nuxtApp.ssrContext || {};
    if (nuxtApp.ssrContext.payload) {
      Object.assign(nuxtApp.payload, nuxtApp.ssrContext.payload);
    }
    nuxtApp.ssrContext.payload = nuxtApp.payload;
    nuxtApp.ssrContext.config = {
      public: options.ssrContext.runtimeConfig.public,
      app: options.ssrContext.runtimeConfig.app
    };
  }
  const runtimeConfig = options.ssrContext.runtimeConfig;
  nuxtApp.provide("config", runtimeConfig);
  return nuxtApp;
}
async function applyPlugin(nuxtApp, plugin2) {
  if (plugin2.hooks) {
    nuxtApp.hooks.addHooks(plugin2.hooks);
  }
  if (typeof plugin2 === "function") {
    const { provide: provide2 } = await nuxtApp.runWithContext(() => plugin2(nuxtApp)) || {};
    if (provide2 && typeof provide2 === "object") {
      for (const key in provide2) {
        nuxtApp.provide(key, provide2[key]);
      }
    }
  }
}
async function applyPlugins(nuxtApp, plugins2) {
  var _a, _b;
  const parallels = [];
  const errors = [];
  for (const plugin2 of plugins2) {
    if (((_a = nuxtApp.ssrContext) == null ? void 0 : _a.islandContext) && ((_b = plugin2.env) == null ? void 0 : _b.islands) === false) {
      continue;
    }
    const promise = applyPlugin(nuxtApp, plugin2);
    if (plugin2.parallel) {
      parallels.push(promise.catch((e) => errors.push(e)));
    } else {
      await promise;
    }
  }
  await Promise.all(parallels);
  if (errors.length) {
    throw errors[0];
  }
}
/*! @__NO_SIDE_EFFECTS__ */
// @__NO_SIDE_EFFECTS__
function defineNuxtPlugin(plugin2) {
  if (typeof plugin2 === "function") {
    return plugin2;
  }
  delete plugin2.name;
  return Object.assign(plugin2.setup || (() => {
  }), plugin2, { [NuxtPluginIndicator]: true });
}
function callWithNuxt(nuxt, setup, args) {
  const fn = () => args ? setup(...args) : setup();
  {
    return nuxt.vueApp.runWithContext(() => nuxtAppCtx.callAsync(nuxt, fn));
  }
}
/*! @__NO_SIDE_EFFECTS__ */
// @__NO_SIDE_EFFECTS__
function useNuxtApp() {
  var _a;
  let nuxtAppInstance;
  if (hasInjectionContext()) {
    nuxtAppInstance = (_a = getCurrentInstance()) == null ? void 0 : _a.appContext.app.$nuxt;
  }
  nuxtAppInstance = nuxtAppInstance || nuxtAppCtx.tryUse();
  if (!nuxtAppInstance) {
    {
      throw new Error("[nuxt] instance unavailable");
    }
  }
  return nuxtAppInstance;
}
/*! @__NO_SIDE_EFFECTS__ */
// @__NO_SIDE_EFFECTS__
function useRuntimeConfig() {
  return (/* @__PURE__ */ useNuxtApp()).$config;
}
function defineGetter(obj, key, val) {
  Object.defineProperty(obj, key, { get: () => val });
}
version.startsWith("3");
function resolveUnref(r) {
  return typeof r === "function" ? r() : unref(r);
}
function resolveUnrefHeadInput(ref2, lastKey = "") {
  if (ref2 instanceof Promise)
    return ref2;
  const root = resolveUnref(ref2);
  if (!ref2 || !root)
    return root;
  if (Array.isArray(root))
    return root.map((r) => resolveUnrefHeadInput(r, lastKey));
  if (typeof root === "object") {
    return Object.fromEntries(
      Object.entries(root).map(([k, v]) => {
        if (k === "titleTemplate" || k.startsWith("on"))
          return [k, unref(v)];
        return [k, resolveUnrefHeadInput(v, k)];
      })
    );
  }
  return root;
}
defineHeadPlugin({
  hooks: {
    "entries:resolve": function(ctx) {
      for (const entry2 of ctx.entries)
        entry2.resolvedInput = resolveUnrefHeadInput(entry2.input);
    }
  }
});
const headSymbol = "usehead";
const _global = typeof globalThis !== "undefined" ? globalThis : typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : {};
const globalKey$1 = "__unhead_injection_handler__";
function setHeadInjectionHandler(handler) {
  _global[globalKey$1] = handler;
}
function injectHead() {
  if (globalKey$1 in _global) {
    return _global[globalKey$1]();
  }
  const head = inject(headSymbol);
  if (!head && "production" !== "production")
    console.warn("Unhead is missing Vue context, falling back to shared context. This may have unexpected results.");
  return head || getActiveHead();
}
const PageRouteSymbol = Symbol("route");
const useRouter = () => {
  var _a;
  return (_a = /* @__PURE__ */ useNuxtApp()) == null ? void 0 : _a.$router;
};
const useRoute = () => {
  if (hasInjectionContext()) {
    return inject(PageRouteSymbol, (/* @__PURE__ */ useNuxtApp())._route);
  }
  return (/* @__PURE__ */ useNuxtApp())._route;
};
/*! @__NO_SIDE_EFFECTS__ */
// @__NO_SIDE_EFFECTS__
function defineNuxtRouteMiddleware(middleware) {
  return middleware;
}
const isProcessingMiddleware = () => {
  try {
    if ((/* @__PURE__ */ useNuxtApp())._processingMiddleware) {
      return true;
    }
  } catch {
    return true;
  }
  return false;
};
const navigateTo = (to, options) => {
  if (!to) {
    to = "/";
  }
  const toPath = typeof to === "string" ? to : withQuery(to.path || "/", to.query || {}) + (to.hash || "");
  if (options == null ? void 0 : options.open) {
    return Promise.resolve();
  }
  const isExternal = (options == null ? void 0 : options.external) || hasProtocol(toPath, { acceptRelative: true });
  if (isExternal) {
    if (!(options == null ? void 0 : options.external)) {
      throw new Error("Navigating to an external URL is not allowed by default. Use `navigateTo(url, { external: true })`.");
    }
    const protocol = parseURL(toPath).protocol;
    if (protocol && isScriptProtocol(protocol)) {
      throw new Error(`Cannot navigate to a URL with '${protocol}' protocol.`);
    }
  }
  const inMiddleware = isProcessingMiddleware();
  const router = useRouter();
  const nuxtApp = /* @__PURE__ */ useNuxtApp();
  {
    if (nuxtApp.ssrContext) {
      const fullPath = typeof to === "string" || isExternal ? toPath : router.resolve(to).fullPath || "/";
      const location2 = isExternal ? toPath : joinURL((/* @__PURE__ */ useRuntimeConfig()).app.baseURL, fullPath);
      async function redirect(response) {
        await nuxtApp.callHook("app:redirected");
        const encodedLoc = location2.replace(/"/g, "%22");
        nuxtApp.ssrContext._renderResponse = {
          statusCode: sanitizeStatusCode((options == null ? void 0 : options.redirectCode) || 302, 302),
          body: `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0; url=${encodedLoc}"></head></html>`,
          headers: { location: location2 }
        };
        return response;
      }
      if (!isExternal && inMiddleware) {
        router.afterEach((final) => final.fullPath === fullPath ? redirect(false) : void 0);
        return to;
      }
      return redirect(!inMiddleware ? void 0 : (
        /* abort route navigation */
        false
      ));
    }
  }
  if (isExternal) {
    nuxtApp._scope.stop();
    if (options == null ? void 0 : options.replace) {
      location.replace(toPath);
    } else {
      location.href = toPath;
    }
    if (inMiddleware) {
      if (!nuxtApp.isHydrating) {
        return false;
      }
      return new Promise(() => {
      });
    }
    return Promise.resolve();
  }
  return (options == null ? void 0 : options.replace) ? router.replace(to) : router.push(to);
};
const useError = () => toRef((/* @__PURE__ */ useNuxtApp()).payload, "error");
const showError = (_err) => {
  const err = createError(_err);
  try {
    const nuxtApp = /* @__PURE__ */ useNuxtApp();
    const error = useError();
    if (false)
      ;
    error.value = error.value || err;
  } catch {
    throw err;
  }
  return err;
};
const isNuxtError = (err) => !!(err && typeof err === "object" && "__nuxt_error" in err);
const createError = (err) => {
  const _err = createError$1(err);
  _err.__nuxt_error = true;
  return _err;
};
const appPageTransition = false;
const nuxtLinkDefaults = { "componentName": "NuxtLink" };
function definePayloadReducer(name, reduce) {
  {
    (/* @__PURE__ */ useNuxtApp()).ssrContext._payloadReducers[name] = reduce;
  }
}
const firstNonUndefined = (...args) => args.find((arg) => arg !== void 0);
const DEFAULT_EXTERNAL_REL_ATTRIBUTE = "noopener noreferrer";
/*! @__NO_SIDE_EFFECTS__ */
// @__NO_SIDE_EFFECTS__
function defineNuxtLink(options) {
  const componentName = options.componentName || "NuxtLink";
  const resolveTrailingSlashBehavior = (to, resolve) => {
    if (!to || options.trailingSlash !== "append" && options.trailingSlash !== "remove") {
      return to;
    }
    const normalizeTrailingSlash = options.trailingSlash === "append" ? withTrailingSlash : withoutTrailingSlash;
    if (typeof to === "string") {
      return normalizeTrailingSlash(to, true);
    }
    const path = "path" in to ? to.path : resolve(to).path;
    return {
      ...to,
      name: void 0,
      // named routes would otherwise always override trailing slash behavior
      path: normalizeTrailingSlash(path, true)
    };
  };
  return /* @__PURE__ */ defineComponent({
    name: componentName,
    props: {
      // Routing
      to: {
        type: [String, Object],
        default: void 0,
        required: false
      },
      href: {
        type: [String, Object],
        default: void 0,
        required: false
      },
      // Attributes
      target: {
        type: String,
        default: void 0,
        required: false
      },
      rel: {
        type: String,
        default: void 0,
        required: false
      },
      noRel: {
        type: Boolean,
        default: void 0,
        required: false
      },
      // Prefetching
      prefetch: {
        type: Boolean,
        default: void 0,
        required: false
      },
      noPrefetch: {
        type: Boolean,
        default: void 0,
        required: false
      },
      // Styling
      activeClass: {
        type: String,
        default: void 0,
        required: false
      },
      exactActiveClass: {
        type: String,
        default: void 0,
        required: false
      },
      prefetchedClass: {
        type: String,
        default: void 0,
        required: false
      },
      // Vue Router's `<RouterLink>` additional props
      replace: {
        type: Boolean,
        default: void 0,
        required: false
      },
      ariaCurrentValue: {
        type: String,
        default: void 0,
        required: false
      },
      // Edge cases handling
      external: {
        type: Boolean,
        default: void 0,
        required: false
      },
      // Slot API
      custom: {
        type: Boolean,
        default: void 0,
        required: false
      }
    },
    setup(props, { slots }) {
      const router = useRouter();
      const to = computed(() => {
        const path = props.to || props.href || "";
        return resolveTrailingSlashBehavior(path, router.resolve);
      });
      const isExternal = computed(() => {
        if (props.external) {
          return true;
        }
        if (props.target && props.target !== "_self") {
          return true;
        }
        if (typeof to.value === "object") {
          return false;
        }
        return to.value === "" || hasProtocol(to.value, { acceptRelative: true });
      });
      const prefetched = ref(false);
      const el = void 0;
      const elRef = void 0;
      return () => {
        var _a, _b;
        if (!isExternal.value) {
          const routerLinkProps = {
            ref: elRef,
            to: to.value,
            activeClass: props.activeClass || options.activeClass,
            exactActiveClass: props.exactActiveClass || options.exactActiveClass,
            replace: props.replace,
            ariaCurrentValue: props.ariaCurrentValue,
            custom: props.custom
          };
          if (!props.custom) {
            if (prefetched.value) {
              routerLinkProps.class = props.prefetchedClass || options.prefetchedClass;
            }
            routerLinkProps.rel = props.rel;
          }
          return h(
            resolveComponent("RouterLink"),
            routerLinkProps,
            slots.default
          );
        }
        const href = typeof to.value === "object" ? ((_a = router.resolve(to.value)) == null ? void 0 : _a.href) ?? null : to.value || null;
        const target = props.target || null;
        const rel = props.noRel ? null : firstNonUndefined(props.rel, options.externalRelAttribute, href ? DEFAULT_EXTERNAL_REL_ATTRIBUTE : "") || null;
        const navigate = () => navigateTo(href, { replace: props.replace });
        if (props.custom) {
          if (!slots.default) {
            return null;
          }
          return slots.default({
            href,
            navigate,
            get route() {
              if (!href) {
                return void 0;
              }
              const url = parseURL(href);
              return {
                path: url.pathname,
                fullPath: url.pathname,
                get query() {
                  return parseQuery(url.search);
                },
                hash: url.hash,
                // stub properties for compat with vue-router
                params: {},
                name: void 0,
                matched: [],
                redirectedFrom: void 0,
                meta: {},
                href
              };
            },
            rel,
            target,
            isExternal: isExternal.value,
            isActive: false,
            isExactActive: false
          });
        }
        return h("a", { ref: el, href, rel, target }, (_b = slots.default) == null ? void 0 : _b.call(slots));
      };
    }
  });
}
const __nuxt_component_0 = /* @__PURE__ */ defineNuxtLink(nuxtLinkDefaults);
const unhead_KgADcZ0jPj = /* @__PURE__ */ defineNuxtPlugin({
  name: "nuxt:head",
  enforce: "pre",
  setup(nuxtApp) {
    const head = nuxtApp.ssrContext.head;
    setHeadInjectionHandler(
      // need a fresh instance of the nuxt app to avoid parallel requests interfering with each other
      () => (/* @__PURE__ */ useNuxtApp()).vueApp._context.provides.usehead
    );
    nuxtApp.vueApp.use(head);
  }
});
function createContext(opts = {}) {
  let currentInstance;
  let isSingleton = false;
  const checkConflict = (instance) => {
    if (currentInstance && currentInstance !== instance) {
      throw new Error("Context conflict");
    }
  };
  let als;
  if (opts.asyncContext) {
    const _AsyncLocalStorage = opts.AsyncLocalStorage || globalThis.AsyncLocalStorage;
    if (_AsyncLocalStorage) {
      als = new _AsyncLocalStorage();
    } else {
      console.warn("[unctx] `AsyncLocalStorage` is not provided.");
    }
  }
  const _getCurrentInstance = () => {
    if (als && currentInstance === void 0) {
      const instance = als.getStore();
      if (instance !== void 0) {
        return instance;
      }
    }
    return currentInstance;
  };
  return {
    use: () => {
      const _instance = _getCurrentInstance();
      if (_instance === void 0) {
        throw new Error("Context is not available");
      }
      return _instance;
    },
    tryUse: () => {
      return _getCurrentInstance();
    },
    set: (instance, replace) => {
      if (!replace) {
        checkConflict(instance);
      }
      currentInstance = instance;
      isSingleton = true;
    },
    unset: () => {
      currentInstance = void 0;
      isSingleton = false;
    },
    call: (instance, callback) => {
      checkConflict(instance);
      currentInstance = instance;
      try {
        return als ? als.run(instance, callback) : callback();
      } finally {
        if (!isSingleton) {
          currentInstance = void 0;
        }
      }
    },
    async callAsync(instance, callback) {
      currentInstance = instance;
      const onRestore = () => {
        currentInstance = instance;
      };
      const onLeave = () => currentInstance === instance ? onRestore : void 0;
      asyncHandlers.add(onLeave);
      try {
        const r = als ? als.run(instance, callback) : callback();
        if (!isSingleton) {
          currentInstance = void 0;
        }
        return await r;
      } finally {
        asyncHandlers.delete(onLeave);
      }
    }
  };
}
function createNamespace(defaultOpts = {}) {
  const contexts = {};
  return {
    get(key, opts = {}) {
      if (!contexts[key]) {
        contexts[key] = createContext({ ...defaultOpts, ...opts });
      }
      contexts[key];
      return contexts[key];
    }
  };
}
const _globalThis = typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : typeof global !== "undefined" ? global : {};
const globalKey = "__unctx__";
_globalThis[globalKey] || (_globalThis[globalKey] = createNamespace());
const asyncHandlersKey = "__unctx_async_handlers__";
const asyncHandlers = _globalThis[asyncHandlersKey] || (_globalThis[asyncHandlersKey] = /* @__PURE__ */ new Set());
function executeAsync(function_) {
  const restores = [];
  for (const leaveHandler of asyncHandlers) {
    const restore2 = leaveHandler();
    if (restore2) {
      restores.push(restore2);
    }
  }
  const restore = () => {
    for (const restore2 of restores) {
      restore2();
    }
  };
  let awaitable = function_();
  if (awaitable && typeof awaitable === "object" && "catch" in awaitable) {
    awaitable = awaitable.catch((error) => {
      restore();
      throw error;
    });
  }
  return [awaitable, restore];
}
const _routes = [
  {
    name: "cennik",
    path: "/cennik",
    meta: {},
    alias: [],
    redirect: void 0,
    component: () => import('./_nuxt/index-7a593525.mjs').then((m) => m.default || m)
  },
  {
    name: "galeria",
    path: "/galeria",
    meta: {},
    alias: [],
    redirect: void 0,
    component: () => import('./_nuxt/index-d671dc9d.mjs').then((m) => m.default || m)
  },
  {
    name: "index",
    path: "/",
    meta: {},
    alias: [],
    redirect: void 0,
    component: () => import('./_nuxt/index-57da9218.mjs').then((m) => m.default || m)
  },
  {
    name: "o-mnie",
    path: "/o-mnie",
    meta: {},
    alias: [],
    redirect: void 0,
    component: () => Promise.resolve().then(function() {
      return index;
    }).then((m) => m.default || m)
  },
  {
    name: "start",
    path: "/start",
    meta: {},
    alias: [],
    redirect: void 0,
    component: () => Promise.resolve().then(function() {
      return index$2;
    }).then((m) => m.default || m)
  },
  {
    name: "uslugi",
    path: "/uslugi",
    meta: {},
    alias: [],
    redirect: void 0,
    component: () => Promise.resolve().then(function() {
      return index$1;
    }).then((m) => m.default || m)
  }
];
const routerOptions0 = {
  scrollBehavior(to, from, savedPosition) {
    var _a;
    const nuxtApp = /* @__PURE__ */ useNuxtApp();
    const behavior = ((_a = useRouter().options) == null ? void 0 : _a.scrollBehaviorType) ?? "auto";
    let position = savedPosition || void 0;
    const routeAllowsScrollToTop = typeof to.meta.scrollToTop === "function" ? to.meta.scrollToTop(to, from) : to.meta.scrollToTop;
    if (!position && from && to && routeAllowsScrollToTop !== false && _isDifferentRoute(from, to)) {
      position = { left: 0, top: 0 };
    }
    if (to.path === from.path) {
      if (from.hash && !to.hash) {
        return { left: 0, top: 0 };
      }
      if (to.hash) {
        return { el: to.hash, top: _getHashElementScrollMarginTop(to.hash), behavior };
      }
    }
    const hasTransition = (route) => !!(route.meta.pageTransition ?? appPageTransition);
    const hookToWait = hasTransition(from) && hasTransition(to) ? "page:transition:finish" : "page:finish";
    return new Promise((resolve) => {
      nuxtApp.hooks.hookOnce(hookToWait, async () => {
        await nextTick();
        if (to.hash) {
          position = { el: to.hash, top: _getHashElementScrollMarginTop(to.hash), behavior };
        }
        resolve(position);
      });
    });
  }
};
function _getHashElementScrollMarginTop(selector) {
  try {
    const elem = document.querySelector(selector);
    if (elem) {
      return parseFloat(getComputedStyle(elem).scrollMarginTop);
    }
  } catch {
  }
  return 0;
}
function _isDifferentRoute(from, to) {
  return to.path !== from.path || JSON.stringify(from.params) !== JSON.stringify(to.params);
}
const configRouterOptions = {};
const routerOptions = {
  ...configRouterOptions,
  ...routerOptions0
};
const validate = /* @__PURE__ */ defineNuxtRouteMiddleware(async (to) => {
  var _a;
  let __temp, __restore;
  if (!((_a = to.meta) == null ? void 0 : _a.validate)) {
    return;
  }
  useRouter();
  const result = ([__temp, __restore] = executeAsync(() => Promise.resolve(to.meta.validate(to))), __temp = await __temp, __restore(), __temp);
  if (result === true) {
    return;
  }
  {
    return result;
  }
});
const manifest_45route_45rule = /* @__PURE__ */ defineNuxtRouteMiddleware(async (to) => {
  {
    return;
  }
});
const globalMiddleware = [
  validate,
  manifest_45route_45rule
];
const namedMiddleware = {};
const plugin = /* @__PURE__ */ defineNuxtPlugin({
  name: "nuxt:router",
  enforce: "pre",
  async setup(nuxtApp) {
    var _a, _b;
    let __temp, __restore;
    let routerBase = (/* @__PURE__ */ useRuntimeConfig()).app.baseURL;
    if (routerOptions.hashMode && !routerBase.includes("#")) {
      routerBase += "#";
    }
    const history = ((_a = routerOptions.history) == null ? void 0 : _a.call(routerOptions, routerBase)) ?? createMemoryHistory(routerBase);
    const routes = ((_b = routerOptions.routes) == null ? void 0 : _b.call(routerOptions, _routes)) ?? _routes;
    let startPosition;
    const initialURL = nuxtApp.ssrContext.url;
    const router = createRouter({
      ...routerOptions,
      scrollBehavior: (to, from, savedPosition) => {
        var _a2;
        if (from === START_LOCATION) {
          startPosition = savedPosition;
          return;
        }
        router.options.scrollBehavior = routerOptions.scrollBehavior;
        return (_a2 = routerOptions.scrollBehavior) == null ? void 0 : _a2.call(routerOptions, to, START_LOCATION, startPosition || savedPosition);
      },
      history,
      routes
    });
    nuxtApp.vueApp.use(router);
    const previousRoute = shallowRef(router.currentRoute.value);
    router.afterEach((_to, from) => {
      previousRoute.value = from;
    });
    Object.defineProperty(nuxtApp.vueApp.config.globalProperties, "previousRoute", {
      get: () => previousRoute.value
    });
    const _route = shallowRef(router.resolve(initialURL));
    const syncCurrentRoute = () => {
      _route.value = router.currentRoute.value;
    };
    nuxtApp.hook("page:finish", syncCurrentRoute);
    router.afterEach((to, from) => {
      var _a2, _b2, _c, _d;
      if (((_b2 = (_a2 = to.matched[0]) == null ? void 0 : _a2.components) == null ? void 0 : _b2.default) === ((_d = (_c = from.matched[0]) == null ? void 0 : _c.components) == null ? void 0 : _d.default)) {
        syncCurrentRoute();
      }
    });
    const route = {};
    for (const key in _route.value) {
      Object.defineProperty(route, key, {
        get: () => _route.value[key]
      });
    }
    nuxtApp._route = shallowReactive(route);
    nuxtApp._middleware = nuxtApp._middleware || {
      global: [],
      named: {}
    };
    useError();
    try {
      if (true) {
        ;
        [__temp, __restore] = executeAsync(() => router.push(initialURL)), await __temp, __restore();
        ;
      }
      ;
      [__temp, __restore] = executeAsync(() => router.isReady()), await __temp, __restore();
      ;
    } catch (error2) {
      [__temp, __restore] = executeAsync(() => nuxtApp.runWithContext(() => showError(error2))), await __temp, __restore();
    }
    const initialLayout = nuxtApp.payload.state._layout;
    router.beforeEach(async (to, from) => {
      var _a2, _b2;
      to.meta = reactive(to.meta);
      if (nuxtApp.isHydrating && initialLayout && !isReadonly(to.meta.layout)) {
        to.meta.layout = initialLayout;
      }
      nuxtApp._processingMiddleware = true;
      if (!((_a2 = nuxtApp.ssrContext) == null ? void 0 : _a2.islandContext)) {
        const middlewareEntries = /* @__PURE__ */ new Set([...globalMiddleware, ...nuxtApp._middleware.global]);
        for (const component of to.matched) {
          const componentMiddleware = component.meta.middleware;
          if (!componentMiddleware) {
            continue;
          }
          if (Array.isArray(componentMiddleware)) {
            for (const entry2 of componentMiddleware) {
              middlewareEntries.add(entry2);
            }
          } else {
            middlewareEntries.add(componentMiddleware);
          }
        }
        for (const entry2 of middlewareEntries) {
          const middleware = typeof entry2 === "string" ? nuxtApp._middleware.named[entry2] || await ((_b2 = namedMiddleware[entry2]) == null ? void 0 : _b2.call(namedMiddleware).then((r) => r.default || r)) : entry2;
          if (!middleware) {
            throw new Error(`Unknown route middleware: '${entry2}'.`);
          }
          const result = await nuxtApp.runWithContext(() => middleware(to, from));
          {
            if (result === false || result instanceof Error) {
              const error2 = result || createError$1({
                statusCode: 404,
                statusMessage: `Page Not Found: ${initialURL}`
              });
              await nuxtApp.runWithContext(() => showError(error2));
              return false;
            }
          }
          if (result === true) {
            continue;
          }
          if (result || result === false) {
            return result;
          }
        }
      }
    });
    router.onError(() => {
      delete nuxtApp._processingMiddleware;
    });
    router.afterEach(async (to, _from, failure) => {
      var _a2;
      delete nuxtApp._processingMiddleware;
      if ((failure == null ? void 0 : failure.type) === 4) {
        return;
      }
      if (to.matched.length === 0 && !((_a2 = nuxtApp.ssrContext) == null ? void 0 : _a2.islandContext)) {
        await nuxtApp.runWithContext(() => showError(createError$1({
          statusCode: 404,
          fatal: false,
          statusMessage: `Page not found: ${to.fullPath}`
        })));
      } else if (to.redirectedFrom && to.fullPath !== initialURL) {
        await nuxtApp.runWithContext(() => navigateTo(to.fullPath || "/"));
      }
    });
    nuxtApp.hooks.hookOnce("app:created", async () => {
      try {
        await router.replace({
          ...router.resolve(initialURL),
          name: void 0,
          // #4920, #4982
          force: true
        });
        router.options.scrollBehavior = routerOptions.scrollBehavior;
      } catch (error2) {
        await nuxtApp.runWithContext(() => showError(error2));
      }
    });
    return { provide: { router } };
  }
});
const reducers = {
  NuxtError: (data) => isNuxtError(data) && data.toJSON(),
  EmptyShallowRef: (data) => isRef(data) && isShallow(data) && !data.value && (typeof data.value === "bigint" ? "0n" : JSON.stringify(data.value) || "_"),
  EmptyRef: (data) => isRef(data) && !data.value && (typeof data.value === "bigint" ? "0n" : JSON.stringify(data.value) || "_"),
  ShallowRef: (data) => isRef(data) && isShallow(data) && data.value,
  ShallowReactive: (data) => isReactive(data) && isShallow(data) && toRaw(data),
  Ref: (data) => isRef(data) && data.value,
  Reactive: (data) => isReactive(data) && toRaw(data)
};
const revive_payload_server_eJ33V7gbc6 = /* @__PURE__ */ defineNuxtPlugin({
  name: "nuxt:revive-payload:server",
  setup() {
    for (const reducer in reducers) {
      definePayloadReducer(reducer, reducers[reducer]);
    }
  }
});
const components_plugin_KR1HBZs4kY = /* @__PURE__ */ defineNuxtPlugin({
  name: "nuxt:global-components"
});
const plugins = [
  unhead_KgADcZ0jPj,
  plugin,
  revive_payload_server_eJ33V7gbc6,
  components_plugin_KR1HBZs4kY
];
const phoneIcon = "" + __buildAssetsURL("phone.cda3205f.png");
const emailIcon = "" + __buildAssetsURL("mail.6c900790.png");
const _sfc_main$8 = /* @__PURE__ */ defineComponent({
  __name: "TheFooter",
  __ssrInlineRender: true,
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<footer${ssrRenderAttrs(mergeProps({
        class: _ctx.style.footer
      }, _attrs))}><address class="${ssrRenderClass(_ctx.style.address)}"><a href="mailto: a.m.gorzynska@gmail.com" class="${ssrRenderClass(_ctx.style.link)}"><img${ssrRenderAttr("src", unref(emailIcon))} class="${ssrRenderClass(_ctx.style.icon)}"> a.m.gorzynska@gmail.com</a><a href="tel: +48660100318" class="${ssrRenderClass(_ctx.style.link)}"><img${ssrRenderAttr("src", unref(phoneIcon))} class="${ssrRenderClass(_ctx.style.icon)}"> 660 100 318</a></address><div class="${ssrRenderClass(_ctx.style.copyright)}">© 2024 Fizjoterapia Anna Ignaś</div></footer>`);
    };
  }
});
const footer$1 = "_footer_8r4f7_3";
const address = "_address_8r4f7_17";
const icon$2 = "_icon_8r4f7_29";
const link$1 = "_link_8r4f7_39";
const copyright = "_copyright_8r4f7_65";
const style0$6 = {
  footer: footer$1,
  address,
  icon: icon$2,
  link: link$1,
  copyright
};
const _export_sfc = (sfc, props) => {
  const target = sfc.__vccOpts || sfc;
  for (const [key, val] of props) {
    target[key] = val;
  }
  return target;
};
const cssModules$6 = {
  "style": style0$6
};
const _sfc_setup$8 = _sfc_main$8.setup;
_sfc_main$8.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("features/coreModule/TheFooter/TheFooter.vue");
  return _sfc_setup$8 ? _sfc_setup$8(props, ctx) : void 0;
};
const TheFooter = /* @__PURE__ */ _export_sfc(_sfc_main$8, [["__cssModules", cssModules$6]]);
const useScrollOnTop = () => {
  const isScrollOnTop = ref(true);
  return {
    isScrollOnTop
  };
};
const MOBILE_BREAKPOINT_PX = 768;
const useRwd = () => {
  const screenWidth = ref(0);
  const isMobile = computed(() => {
    return screenWidth.value <= MOBILE_BREAKPOINT_PX;
  });
  return {
    isMobile
  };
};
const fbLogo$1 = "" + __buildAssetsURL("facebook.f132e44b.png");
const _sfc_main$7 = /* @__PURE__ */ defineComponent({
  __name: "TheHeader",
  __ssrInlineRender: true,
  setup(__props) {
    const { isScrollOnTop } = useScrollOnTop();
    const { isMobile } = useRwd();
    const links = [
      {
        label: "Start",
        to: "#start"
      },
      {
        label: "Usługi",
        to: "#uslugi"
      },
      {
        label: "O mnie",
        to: "#o-mnie"
      }
    ];
    const isMobileMenuOpen = ref(false);
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      if (!unref(isMobile)) {
        _push(`<header${ssrRenderAttrs(mergeProps({
          class: [_ctx.style.header, _ctx.style.headerDesktop, !unref(isScrollOnTop) && _ctx.style.headerHidden]
        }, _attrs))}><nav><ul class="${ssrRenderClass(_ctx.style.linkList)}"><li class="${ssrRenderClass([_ctx.style.linkItem, unref(isScrollOnTop) && _ctx.style.fbLogo])}">`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: "https://www.facebook.com/a.m.gorzynska",
          "aria-label": "Open Facebook page"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`<img${ssrRenderAttr("src", unref(fbLogo$1))} alt="" class="${ssrRenderClass(_ctx.style.linkLogo)}"${_scopeId}>`);
            } else {
              return [
                createVNode("img", {
                  src: unref(fbLogo$1),
                  alt: "",
                  class: _ctx.style.linkLogo
                }, null, 10, ["src"])
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</li><!--[-->`);
        ssrRenderList(links, (link2) => {
          _push(`<li class="${ssrRenderClass(_ctx.style.linkItem)}">`);
          _push(ssrRenderComponent(_component_NuxtLink, {
            to: link2.to,
            class: _ctx.style.link
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`${ssrInterpolate(link2.label)}`);
              } else {
                return [
                  createTextVNode(toDisplayString(link2.label), 1)
                ];
              }
            }),
            _: 2
          }, _parent));
          _push(`</li>`);
        });
        _push(`<!--]--></ul></nav></header>`);
      } else {
        _push(`<header${ssrRenderAttrs(mergeProps({
          class: [_ctx.style.header, _ctx.style.headerMobile]
        }, _attrs))}>`);
        if (!unref(isMobileMenuOpen)) {
          _push(`<button class="${ssrRenderClass(_ctx.style.headerMobileOpenButton)}" aria-label="Otwórz menu"><div class="${ssrRenderClass(_ctx.style.hamburgerStripe)}"></div><div class="${ssrRenderClass(_ctx.style.hamburgerStripe)}"></div><div class="${ssrRenderClass(_ctx.style.hamburgerStripe)}"></div></button>`);
        } else {
          _push(`<button class="${ssrRenderClass(_ctx.style.headerMobileCloseButton)}" aria-label="Zamknij menu"><div class="${ssrRenderClass(_ctx.style.hamburgerClose)}"></div></button>`);
        }
        if (unref(isMobileMenuOpen)) {
          _push(`<nav class="${ssrRenderClass(_ctx.style.mobileNavigation)}"><ul class="${ssrRenderClass(_ctx.style.mobileLinkList)}"><li class="${ssrRenderClass([_ctx.style.linkItem, _ctx.style.fbLogo])}">`);
          _push(ssrRenderComponent(_component_NuxtLink, {
            to: "https://www.facebook.com/a.m.gorzynska",
            "aria-label": "Open Facebook page"
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`<img${ssrRenderAttr("src", unref(fbLogo$1))} alt="" class="${ssrRenderClass(_ctx.style.linkLogo)}"${_scopeId}>`);
              } else {
                return [
                  createVNode("img", {
                    src: unref(fbLogo$1),
                    alt: "",
                    class: _ctx.style.linkLogo
                  }, null, 10, ["src"])
                ];
              }
            }),
            _: 1
          }, _parent));
          _push(`</li><!--[-->`);
          ssrRenderList(links, (link2) => {
            _push(`<li class="${ssrRenderClass(_ctx.style.linkItem)}"><a${ssrRenderAttr("href", link2.to)} class="${ssrRenderClass(_ctx.style.link)}">${ssrInterpolate(link2.label)}</a></li>`);
          });
          _push(`<!--]--></ul></nav>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</header>`);
      }
    };
  }
});
const header = "_header_1kot5_7";
const headerDesktop = "_headerDesktop_1kot5_17";
const headerMobile = "_headerMobile_1kot5_37";
const headerMobileOpenButton = "_headerMobileOpenButton_1kot5_47";
const headerMobileCloseButton = "_headerMobileCloseButton_1kot5_47";
const mobileNavigation = "_mobileNavigation_1kot5_75";
const hamburgerStripe = "_hamburgerStripe_1kot5_85";
const hamburgerClose = "_hamburgerClose_1kot5_99";
const headerHidden = "_headerHidden_1kot5_145";
const fbLogo = "_fbLogo_1kot5_163";
const linkList = "_linkList_1kot5_171";
const mobileLinkList = "_mobileLinkList_1kot5_195";
const linkItem = "_linkItem_1kot5_223";
const link = "_link_1kot5_171";
const linkLogo = "_linkLogo_1kot5_253";
const style0$5 = {
  header,
  headerDesktop,
  headerMobile,
  headerMobileOpenButton,
  headerMobileCloseButton,
  mobileNavigation,
  hamburgerStripe,
  hamburgerClose,
  headerHidden,
  fbLogo,
  linkList,
  mobileLinkList,
  linkItem,
  link,
  linkLogo
};
const cssModules$5 = {
  "style": style0$5
};
const _sfc_setup$7 = _sfc_main$7.setup;
_sfc_main$7.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("features/coreModule/TheHeader/TheHeader.vue");
  return _sfc_setup$7 ? _sfc_setup$7(props, ctx) : void 0;
};
const TheHeader = /* @__PURE__ */ _export_sfc(_sfc_main$7, [["__cssModules", cssModules$5]]);
const leftToCenter = "_leftToCenter_53ohk_1";
const rightToCenter = "_rightToCenter_53ohk_1";
const h1$2 = "_h1_53ohk_1";
const h2$2 = "_h2_53ohk_1";
const h3$2 = "_h3_53ohk_1";
const h4$2 = "_h4_53ohk_1";
const headings = "_headings_53ohk_9";
const lightFont = "_lightFont_53ohk_35";
const style0$4 = {
  leftToCenter,
  rightToCenter,
  h1: h1$2,
  h2: h2$2,
  h3: h3$2,
  h4: h4$2,
  headings,
  lightFont
};
const _sfc_main$6 = {};
function _sfc_ssrRender(_ctx, _push, _parent, _attrs) {
  _push(`<div${ssrRenderAttrs(mergeProps({
    class: _ctx.style.headings
  }, _attrs))}><h1 class="${ssrRenderClass([_ctx.style.h1, _ctx.style.leftToCenter, _ctx.style.lightFont])}"> Fizjoterapeutka Anna Ignaś </h1><h2 class="${ssrRenderClass([_ctx.style.h2, _ctx.style.rightToCenter, _ctx.style.lightFont])}">Terapeutka manualna</h2></div>`);
}
const cssModules$4 = {
  "style": style0$4
};
const _sfc_setup$6 = _sfc_main$6.setup;
_sfc_main$6.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/start/index.vue");
  return _sfc_setup$6 ? _sfc_setup$6(props, ctx) : void 0;
};
const StartPage = /* @__PURE__ */ _export_sfc(_sfc_main$6, [["ssrRender", _sfc_ssrRender], ["__cssModules", cssModules$4]]);
const index$2 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  default: StartPage
});
const visitIcon = "" + __buildAssetsURL("building.71d5a127.png");
const classicalMassageIcon = "" + __buildAssetsURL("body-massage.3a8f50ee.png");
const deepMassageIcon = "" + __buildAssetsURL("massage.654a479c.png");
const kobidoIcon = "" + __buildAssetsURL("facial-massage.d3cad3a0.png");
const preventIcon = "" + __buildAssetsURL("prevention.16a4a22d.png");
const _sfc_main$5 = /* @__PURE__ */ defineComponent({
  __name: "index",
  __ssrInlineRender: true,
  setup(__props) {
    const services2 = [
      {
        label: "wizyta fizjoterapeutyczna",
        icon: visitIcon
      },
      {
        label: "masaż klasyczny",
        icon: classicalMassageIcon
      },
      {
        label: "masaż  tkanek głębokich",
        icon: deepMassageIcon
      },
      {
        label: "Kobido",
        icon: kobidoIcon
      },
      {
        label: "fizjoprofilaktyka",
        icon: preventIcon
      }
    ];
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({
        class: _ctx.style.servicesContainer
      }, _attrs))}><div class="${ssrRenderClass(_ctx.style.services)}"><article><br><h3 class="${ssrRenderClass(_ctx.style.h3)}">Usługi</h3><ul class="${ssrRenderClass(_ctx.style.servicesList)}"><!--[-->`);
      ssrRenderList(services2, (service, index2) => {
        _push(`<li class="${ssrRenderClass([_ctx.style.serviceItem, _ctx.style[`serviceItem${index2}`]])}"><figure class="${ssrRenderClass(_ctx.style.singleService)}"><img${ssrRenderAttr("src", service.icon)} class="${ssrRenderClass(_ctx.style.icon)}"><figcaption>${ssrInterpolate(service.label)}</figcaption></figure></li>`);
      });
      _push(`<!--]--></ul></article></div></div>`);
    };
  }
});
const h1$1 = "_h1_ea67n_1";
const h2$1 = "_h2_ea67n_1";
const h3$1 = "_h3_ea67n_1";
const h4$1 = "_h4_ea67n_1";
const servicesContainer = "_servicesContainer_ea67n_7";
const services = "_services_ea67n_7";
const servicesList = "_servicesList_ea67n_27";
const serviceItem = "_serviceItem_ea67n_47";
const serviceItem0 = "_serviceItem0_ea67n_57";
const serviceItem1 = "_serviceItem1_ea67n_63";
const serviceItem2 = "_serviceItem2_ea67n_69";
const serviceItem3 = "_serviceItem3_ea67n_75";
const serviceItem4 = "_serviceItem4_ea67n_81";
const singleService = "_singleService_ea67n_87";
const icon$1 = "_icon_ea67n_101";
const style0$3 = {
  h1: h1$1,
  h2: h2$1,
  h3: h3$1,
  h4: h4$1,
  servicesContainer,
  services,
  servicesList,
  serviceItem,
  serviceItem0,
  serviceItem1,
  serviceItem2,
  serviceItem3,
  serviceItem4,
  singleService,
  icon: icon$1
};
const cssModules$3 = {
  "style": style0$3
};
const _sfc_setup$5 = _sfc_main$5.setup;
_sfc_main$5.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/uslugi/index.vue");
  return _sfc_setup$5 ? _sfc_setup$5(props, ctx) : void 0;
};
const ServicesPage = /* @__PURE__ */ _export_sfc(_sfc_main$5, [["__cssModules", cssModules$3]]);
const index$1 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  default: ServicesPage
});
const leftArrowIcon = "data:image/png;base64,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";
const rightArrowIcon = "data:image/png;base64,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";
const _sfc_main$4 = /* @__PURE__ */ defineComponent({
  __name: "AppSlider",
  __ssrInlineRender: true,
  props: {
    slides: {}
  },
  setup(__props) {
    const currentSlideIndex = ref(0);
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({
        class: _ctx.style.appSlider
      }, _attrs))}><button class="${ssrRenderClass(_ctx.style.appSliderArrowContainer)}"><img${ssrRenderAttr("src", unref(leftArrowIcon))} alt="Poprzedni slajd" class="${ssrRenderClass(_ctx.style.icon)}"></button><div class="${ssrRenderClass(_ctx.style.content)}">`);
      ssrRenderSlot(_ctx.$slots, "default", {
        slide: _ctx.slides[unref(currentSlideIndex)]
      }, null, _push, _parent);
      _push(`</div><button class="${ssrRenderClass(_ctx.style.appSliderArrowContainer)}"><img${ssrRenderAttr("src", unref(rightArrowIcon))} alt="Następny slajd" class="${ssrRenderClass(_ctx.style.icon)}"></button></div>`);
    };
  }
});
const appSlider = "_appSlider_1uckf_3";
const appSliderArrowContainer = "_appSliderArrowContainer_1uckf_15";
const icon = "_icon_1uckf_39";
const content = "_content_1uckf_47";
const style0$2 = {
  appSlider,
  appSliderArrowContainer,
  icon,
  content
};
const cssModules$2 = {
  "style": style0$2
};
const _sfc_setup$4 = _sfc_main$4.setup;
_sfc_main$4.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("features/design/components/slider/AppSlider.vue");
  return _sfc_setup$4 ? _sfc_setup$4(props, ctx) : void 0;
};
const AppSlider = /* @__PURE__ */ _export_sfc(_sfc_main$4, [["__cssModules", cssModules$2]]);
const deepDocument = "" + __buildAssetsURL("anna-ignas-masaz-gleboki.d66bed74.jpg");
const backboneDocument = "" + __buildAssetsURL("anna-ignas-kregoslup.1c0a28c0.jpg");
const manualDocument = "" + __buildAssetsURL("anna-ignas-terapia-manualna.c300d4e2.jpg");
const pinoDocument = "" + __buildAssetsURL("anna-ignas-pinoterapia.05ee3361.jpg");
const studiesDocument = "" + __buildAssetsURL("anna-ignas-studia.4e31441b.jpg");
const jobDocument = "" + __buildAssetsURL("anna-ignas-prawo-wykonywania-zawodu.9f7eb695.jpg");
const profilePhoto$1 = "" + __buildAssetsURL("anna-ignas-profilowe.dab22464.jpg");
const _sfc_main$3 = /* @__PURE__ */ defineComponent({
  __name: "index",
  __ssrInlineRender: true,
  setup(__props) {
    const courses = [
      {
        date: "06-08.10.2023",
        description: [
          "Sztuka i nauka manipulacji kręgosłupa i wybranych stawów obwodowych",
          "Rafał Krasicki"
        ]
      },
      {
        date: "29.05.2023-12.06.2023r.",
        description: ["Kobido - Japoński Lifting Twarzy"]
      },
      {
        date: "16-17.06/09-10.09.2023",
        description: ["Podstawy terapii manualnej z wprowadzeniem do technik manipulacji"]
      },
      {
        date: "04.2022",
        description: [
          "Pinoterapia",
          "Organizator: FRSc by dr Składowski"
        ]
      },
      {
        date: "01.2022",
        description: [
          "Masaż tkanek głębokich i rozluźnianie mięśniowo-powięziowe z anatomią",
          "Organizator: MASAZTKANEKGLEBOKICH.PL Łukasz Czubaszewski"
        ]
      },
      {
        date: "03.2020",
        description: [
          "Kurs PJM A2/B1",
          "Organizator: Towarzystwo Tłumaczy i Wykładowców Języka Migowego „GEST”, Ubocze 300, Gryfów Śląski"
        ]
      }
    ];
    const documents2 = [
      {
        label: "Dyplom ukończenia studiów",
        file: "dyplom_ukonczenia_studiow.pdf",
        img: studiesDocument
      },
      {
        label: "Certyfikat z kursu Sztuka i nauka manipulacji kręgosłupa i wybranych stawów",
        file: "kregoslup.pdf",
        img: backboneDocument
      },
      {
        label: "Pinoterapia",
        file: "pinoterapia.pdf",
        img: pinoDocument
      },
      {
        label: "Prawo wykonywania zawodu",
        file: "prawo_wykonywania_zawodu.pdf",
        img: jobDocument
      },
      {
        label: "Certyfikat z kursu Podstawy terapii manualnej z wprowadzeniem do technik manipulacji",
        file: "terapia_manualna.pdf",
        img: manualDocument
      },
      {
        label: "Certyfikat z Masażu tkanek głębokich",
        file: "tkanki_glebokie.pdf",
        img: deepDocument
      }
    ];
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({
        class: _ctx.style.myDescriptionContainer
      }, _attrs))}><div class="${ssrRenderClass(_ctx.style.myDescription)}"><h3 class="${ssrRenderClass(_ctx.style.h3)}">O mnie</h3><div><figure><img${ssrRenderAttr("src", unref(profilePhoto$1))} class="${ssrRenderClass(_ctx.style.profilePhoto)}"><figcaption class="${ssrRenderClass([_ctx.style.paragraph, _ctx.style.center])}">mgr Anna Ignaś</figcaption></figure><article class="${ssrRenderClass(_ctx.style.paragraph)}"><p class="${ssrRenderClass(_ctx.style.center)}">Ukończyłam Uniwersytet Medyczny im. Karola Marcinkowskiego w Poznaniu. W mojej praktyce z pacjentami priorytetem jest eliminacja bólu i przywracanie pełnej funkcji. Na początku terapii stosuję delikatne techniki przeciwbólowe, a następnie przechodzę do energicznych technik PINOTERAPII, które pozwalają przywrócić zakres ruchu w stawach. Moim celem jest szybkie osiągnięcie indywidualnych wyników poprzez zastosowanie spersonalizowanych ćwiczeń, który pomagają utrwalić efekty terapii.</p><br><h4 class="${ssrRenderClass(_ctx.style.h4)}">Kursy</h4>`);
      _push(ssrRenderComponent(AppSlider, {
        slides: courses,
        class: _ctx.style.courseList
      }, {
        default: withCtx(({ slide: course }, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="${ssrRenderClass(_ctx.style.courseItem)}"${_scopeId}>${ssrInterpolate(course.date)} <!--[-->`);
            ssrRenderList(course.description, (descriptionLine) => {
              _push2(`<!--[--><br${_scopeId}> ${ssrInterpolate(descriptionLine)}<!--]-->`);
            });
            _push2(`<!--]--></div>`);
          } else {
            return [
              createVNode("div", {
                class: _ctx.style.courseItem
              }, [
                createTextVNode(toDisplayString(course.date) + " ", 1),
                (openBlock(true), createBlock(Fragment, null, renderList(course.description, (descriptionLine) => {
                  return openBlock(), createBlock(Fragment, null, [
                    createVNode("br"),
                    createTextVNode(" " + toDisplayString(descriptionLine), 1)
                  ], 64);
                }), 256))
              ], 2)
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`<h4 class="${ssrRenderClass(_ctx.style.h4)}">Dokumenty</h4><ul class="${ssrRenderClass(_ctx.style.documents)}"><!--[-->`);
      ssrRenderList(documents2, (singleDocument, index2) => {
        _push(`<li class="${ssrRenderClass(_ctx.style.document)}"><a${ssrRenderAttr("href", `./files/${singleDocument.file}`)}${ssrRenderAttr("aria-label", singleDocument.label)} target="_blank"><img${ssrRenderAttr("src", singleDocument.img)} class="${ssrRenderClass(_ctx.style.documentImage)}"></a></li>`);
      });
      _push(`<!--]--></ul></article></div></div></div>`);
    };
  }
});
const h1 = "_h1_1kfc1_1";
const h2 = "_h2_1kfc1_1";
const h3 = "_h3_1kfc1_1";
const h4 = "_h4_1kfc1_1";
const paragraph = "_paragraph_1kfc1_1";
const myDescriptionContainer = "_myDescriptionContainer_1kfc1_9";
const myDescription = "_myDescription_1kfc1_9";
const profilePhoto = "_profilePhoto_1kfc1_31";
const courseList = "_courseList_1kfc1_39";
const courseItem = "_courseItem_1kfc1_45";
const documents = "_documents_1kfc1_57";
const documentImage = "_documentImage_1kfc1_85";
const center = "_center_1kfc1_111";
const style0$1 = {
  h1,
  h2,
  h3,
  h4,
  paragraph,
  myDescriptionContainer,
  myDescription,
  profilePhoto,
  courseList,
  courseItem,
  documents,
  documentImage,
  center
};
const cssModules$1 = {
  "style": style0$1
};
const _sfc_setup$3 = _sfc_main$3.setup;
_sfc_main$3.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/o-mnie/index.vue");
  return _sfc_setup$3 ? _sfc_setup$3(props, ctx) : void 0;
};
const AboutMePage = /* @__PURE__ */ _export_sfc(_sfc_main$3, [["__cssModules", cssModules$1]]);
const index = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  default: AboutMePage
});
const _sfc_main$2 = /* @__PURE__ */ defineComponent({
  __name: "app",
  __ssrInlineRender: true,
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<!--[-->`);
      _push(ssrRenderComponent(unref(TheHeader), {
        class: _ctx.style.header
      }, null, _parent));
      _push(`<main class="${ssrRenderClass(_ctx.style.main)}"><div class="${ssrRenderClass(_ctx.style.pagesContainer)}"><div id="start" class="${ssrRenderClass(_ctx.style.page)}">`);
      _push(ssrRenderComponent(StartPage, null, null, _parent));
      _push(`</div><div id="uslugi" class="${ssrRenderClass(_ctx.style.page)}">`);
      _push(ssrRenderComponent(ServicesPage, null, null, _parent));
      _push(`</div><div id="o-mnie" class="${ssrRenderClass(_ctx.style.page)}">`);
      _push(ssrRenderComponent(AboutMePage, null, null, _parent));
      _push(`</div></div></main>`);
      _push(ssrRenderComponent(unref(TheFooter), {
        class: _ctx.style.footer
      }, null, _parent));
      _push(`<!--]-->`);
    };
  }
});
const fizjoApp = "_fizjoApp_1t7j1_1";
const footer = "_footer_1t7j1_47";
const main = "_main_1t7j1_73";
const pagesContainer = "_pagesContainer_1t7j1_99";
const page = "_page_1t7j1_99";
const style0 = {
  fizjoApp,
  footer,
  main,
  pagesContainer,
  page
};
const cssModules = {
  "style": style0
};
const _sfc_setup$2 = _sfc_main$2.setup;
_sfc_main$2.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("app.vue");
  return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
const AppComponent = /* @__PURE__ */ _export_sfc(_sfc_main$2, [["__cssModules", cssModules]]);
const _sfc_main$1 = {
  __name: "nuxt-error-page",
  __ssrInlineRender: true,
  props: {
    error: Object
  },
  setup(__props) {
    const props = __props;
    const _error = props.error;
    (_error.stack || "").split("\n").splice(1).map((line) => {
      const text = line.replace("webpack:/", "").replace(".vue", ".js").trim();
      return {
        text,
        internal: line.includes("node_modules") && !line.includes(".cache") || line.includes("internal") || line.includes("new Promise")
      };
    }).map((i) => `<span class="stack${i.internal ? " internal" : ""}">${i.text}</span>`).join("\n");
    const statusCode = Number(_error.statusCode || 500);
    const is404 = statusCode === 404;
    const statusMessage = _error.statusMessage ?? (is404 ? "Page Not Found" : "Internal Server Error");
    const description = _error.message || _error.toString();
    const stack = void 0;
    const _Error404 = /* @__PURE__ */ defineAsyncComponent(() => import('./_nuxt/error-404-02d90747.mjs').then((r) => r.default || r));
    const _Error = /* @__PURE__ */ defineAsyncComponent(() => import('./_nuxt/error-500-1dc8682b.mjs').then((r) => r.default || r));
    const ErrorTemplate = is404 ? _Error404 : _Error;
    return (_ctx, _push, _parent, _attrs) => {
      _push(ssrRenderComponent(unref(ErrorTemplate), mergeProps({ statusCode: unref(statusCode), statusMessage: unref(statusMessage), description: unref(description), stack: unref(stack) }, _attrs), null, _parent));
    };
  }
};
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/nuxt/dist/app/components/nuxt-error-page.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const ErrorComponent = _sfc_main$1;
const _sfc_main = {
  __name: "nuxt-root",
  __ssrInlineRender: true,
  setup(__props) {
    const IslandRenderer = /* @__PURE__ */ defineAsyncComponent(() => import('./_nuxt/island-renderer-32021951.mjs').then((r) => r.default || r));
    const nuxtApp = /* @__PURE__ */ useNuxtApp();
    nuxtApp.deferHydration();
    nuxtApp.ssrContext.url;
    const SingleRenderer = false;
    provide(PageRouteSymbol, useRoute());
    nuxtApp.hooks.callHookWith((hooks) => hooks.map((hook) => hook()), "vue:setup");
    const error = useError();
    onErrorCaptured((err, target, info) => {
      nuxtApp.hooks.callHook("vue:error", err, target, info).catch((hookError) => console.error("[nuxt] Error in `vue:error` hook", hookError));
      {
        const p = nuxtApp.runWithContext(() => showError(err));
        onServerPrefetch(() => p);
        return false;
      }
    });
    const islandContext = nuxtApp.ssrContext.islandContext;
    return (_ctx, _push, _parent, _attrs) => {
      ssrRenderSuspense(_push, {
        default: () => {
          if (unref(error)) {
            _push(ssrRenderComponent(unref(ErrorComponent), { error: unref(error) }, null, _parent));
          } else if (unref(islandContext)) {
            _push(ssrRenderComponent(unref(IslandRenderer), { context: unref(islandContext) }, null, _parent));
          } else if (unref(SingleRenderer)) {
            ssrRenderVNode(_push, createVNode(resolveDynamicComponent(unref(SingleRenderer)), null, null), _parent);
          } else {
            _push(ssrRenderComponent(unref(AppComponent), null, null, _parent));
          }
        },
        _: 1
      });
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/nuxt/dist/app/components/nuxt-root.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const RootComponent = _sfc_main;
if (!globalThis.$fetch) {
  globalThis.$fetch = $fetch.create({
    baseURL: baseURL()
  });
}
let entry;
{
  entry = async function createNuxtAppServer(ssrContext) {
    const vueApp = createApp(RootComponent);
    const nuxt = createNuxtApp({ vueApp, ssrContext });
    try {
      await applyPlugins(nuxt, plugins);
      await nuxt.hooks.callHook("app:created", vueApp);
    } catch (err) {
      await nuxt.hooks.callHook("app:error", err);
      nuxt.payload.error = nuxt.payload.error || err;
    }
    if (ssrContext == null ? void 0 : ssrContext._renderResponse) {
      throw new Error("skipping render");
    }
    return vueApp;
  };
}
const entry$1 = (ctx) => entry(ctx);

export { _export_sfc as _, __nuxt_component_0 as a, createError as c, entry$1 as default, injectHead as i, resolveUnrefHeadInput as r };
//# sourceMappingURL=server.mjs.map
