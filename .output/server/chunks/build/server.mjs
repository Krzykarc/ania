import { shallowReactive, reactive, effectScope, getCurrentScope, hasInjectionContext, getCurrentInstance, toRef, inject, shallowRef, isReadonly, isRef, isShallow, isReactive, toRaw, defineComponent, mergeProps, unref, useSSRContext, ref, h, resolveComponent, computed, withCtx, createVNode, createTextVNode, toDisplayString, createBlock, openBlock, Fragment, renderList, defineAsyncComponent, provide, onErrorCaptured, onServerPrefetch, resolveDynamicComponent, createApp } from 'vue';
import { k as createHooks, l as getContext, h as createError$1, m as toRouteMatcher, n as createRouter, o as defu, p as hasProtocol, q as joinURL, w as withQuery, r as sanitizeStatusCode, v as isScriptProtocol, x as executeAsync, y as parseQuery, z as withTrailingSlash, A as withoutTrailingSlash } from '../_/nitro.mjs';
import { START_LOCATION, createMemoryHistory, createRouter as createRouter$1 } from 'vue-router';
import { ssrRenderAttrs, ssrRenderClass, ssrRenderAttr, ssrRenderComponent, ssrRenderList, ssrInterpolate, ssrRenderSlot, ssrRenderSuspense, ssrRenderVNode } from 'vue/server-renderer';

const appPageTransition = false;
const nuxtLinkDefaults = { "componentName": "NuxtLink" };
const appId = "nuxt-app";

function getNuxtAppCtx(id = appId) {
  return getContext(id, {
    asyncContext: false
  });
}
const NuxtPluginIndicator = "__nuxt_plugin";
function createNuxtApp(options) {
  var _a;
  let hydratingCount = 0;
  const nuxtApp = {
    _id: options.id || appId || "nuxt-app",
    _scope: effectScope(),
    provide: void 0,
    globalName: "nuxt",
    versions: {
      get nuxt() {
        return "3.16.2";
      },
      get vue() {
        return nuxtApp.vueApp.version;
      }
    },
    payload: shallowReactive({
      ...((_a = options.ssrContext) == null ? void 0 : _a.payload) || {},
      data: shallowReactive({}),
      state: reactive({}),
      once: /* @__PURE__ */ new Set(),
      _errors: shallowReactive({})
    }),
    static: {
      data: {}
    },
    runWithContext(fn) {
      if (nuxtApp._scope.active && !getCurrentScope()) {
        return nuxtApp._scope.run(() => callWithNuxt(nuxtApp, fn));
      }
      return callWithNuxt(nuxtApp, fn);
    },
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
    _asyncData: shallowReactive({}),
    _payloadRevivers: {},
    ...options
  };
  {
    nuxtApp.payload.serverRendered = true;
  }
  if (nuxtApp.ssrContext) {
    nuxtApp.payload.path = nuxtApp.ssrContext.url;
    nuxtApp.ssrContext.nuxt = nuxtApp;
    nuxtApp.ssrContext.payload = nuxtApp.payload;
    nuxtApp.ssrContext.config = {
      public: nuxtApp.ssrContext.runtimeConfig.public,
      app: nuxtApp.ssrContext.runtimeConfig.app
    };
  }
  nuxtApp.hooks = createHooks();
  nuxtApp.hook = nuxtApp.hooks.hook;
  {
    const contextCaller = async function(hooks, args) {
      for (const hook of hooks) {
        await nuxtApp.runWithContext(() => hook(...args));
      }
    };
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
  const runtimeConfig = options.ssrContext.runtimeConfig;
  nuxtApp.provide("config", runtimeConfig);
  return nuxtApp;
}
function registerPluginHooks(nuxtApp, plugin) {
  if (plugin.hooks) {
    nuxtApp.hooks.addHooks(plugin.hooks);
  }
}
async function applyPlugin(nuxtApp, plugin) {
  if (typeof plugin === "function") {
    const { provide } = await nuxtApp.runWithContext(() => plugin(nuxtApp)) || {};
    if (provide && typeof provide === "object") {
      for (const key in provide) {
        nuxtApp.provide(key, provide[key]);
      }
    }
  }
}
async function applyPlugins(nuxtApp, plugins) {
  var _a, _b, _c, _d;
  const resolvedPlugins = [];
  const unresolvedPlugins = [];
  const parallels = [];
  const errors = [];
  let promiseDepth = 0;
  async function executePlugin(plugin) {
    var _a2;
    const unresolvedPluginsForThisPlugin = ((_a2 = plugin.dependsOn) == null ? void 0 : _a2.filter((name) => plugins.some((p) => p._name === name) && !resolvedPlugins.includes(name))) ?? [];
    if (unresolvedPluginsForThisPlugin.length > 0) {
      unresolvedPlugins.push([new Set(unresolvedPluginsForThisPlugin), plugin]);
    } else {
      const promise = applyPlugin(nuxtApp, plugin).then(async () => {
        if (plugin._name) {
          resolvedPlugins.push(plugin._name);
          await Promise.all(unresolvedPlugins.map(async ([dependsOn, unexecutedPlugin]) => {
            if (dependsOn.has(plugin._name)) {
              dependsOn.delete(plugin._name);
              if (dependsOn.size === 0) {
                promiseDepth++;
                await executePlugin(unexecutedPlugin);
              }
            }
          }));
        }
      });
      if (plugin.parallel) {
        parallels.push(promise.catch((e) => errors.push(e)));
      } else {
        await promise;
      }
    }
  }
  for (const plugin of plugins) {
    if (((_a = nuxtApp.ssrContext) == null ? void 0 : _a.islandContext) && ((_b = plugin.env) == null ? void 0 : _b.islands) === false) {
      continue;
    }
    registerPluginHooks(nuxtApp, plugin);
  }
  for (const plugin of plugins) {
    if (((_c = nuxtApp.ssrContext) == null ? void 0 : _c.islandContext) && ((_d = plugin.env) == null ? void 0 : _d.islands) === false) {
      continue;
    }
    await executePlugin(plugin);
  }
  await Promise.all(parallels);
  if (promiseDepth) {
    for (let i = 0; i < promiseDepth; i++) {
      await Promise.all(parallels);
    }
  }
  if (errors.length) {
    throw errors[0];
  }
}
// @__NO_SIDE_EFFECTS__
function defineNuxtPlugin(plugin) {
  if (typeof plugin === "function") {
    return plugin;
  }
  const _name = plugin._name || plugin.name;
  delete plugin.name;
  return Object.assign(plugin.setup || (() => {
  }), plugin, { [NuxtPluginIndicator]: true, _name });
}
function callWithNuxt(nuxt, setup, args) {
  const fn = () => setup();
  const nuxtAppCtx = getNuxtAppCtx(nuxt._id);
  {
    return nuxt.vueApp.runWithContext(() => nuxtAppCtx.callAsync(nuxt, fn));
  }
}
function tryUseNuxtApp(id) {
  var _a;
  let nuxtAppInstance;
  if (hasInjectionContext()) {
    nuxtAppInstance = (_a = getCurrentInstance()) == null ? void 0 : _a.appContext.app.$nuxt;
  }
  nuxtAppInstance || (nuxtAppInstance = getNuxtAppCtx(id).tryUse());
  return nuxtAppInstance || null;
}
function useNuxtApp(id) {
  const nuxtAppInstance = tryUseNuxtApp(id);
  if (!nuxtAppInstance) {
    {
      throw new Error("[nuxt] instance unavailable");
    }
  }
  return nuxtAppInstance;
}
// @__NO_SIDE_EFFECTS__
function useRuntimeConfig(_event) {
  return useNuxtApp().$config;
}
function defineGetter(obj, key, val) {
  Object.defineProperty(obj, key, { get: () => val });
}

const NUXT_ERROR_SIGNATURE = "__nuxt_error";
const useError = () => toRef(useNuxtApp().payload, "error");
const showError = (error) => {
  const nuxtError = createError(error);
  try {
    const nuxtApp = useNuxtApp();
    const error2 = useError();
    if (false) ;
    error2.value || (error2.value = nuxtError);
  } catch {
    throw nuxtError;
  }
  return nuxtError;
};
const isNuxtError = (error) => !!error && typeof error === "object" && NUXT_ERROR_SIGNATURE in error;
const createError = (error) => {
  const nuxtError = createError$1(error);
  Object.defineProperty(nuxtError, NUXT_ERROR_SIGNATURE, {
    value: true,
    configurable: false,
    writable: false
  });
  return nuxtError;
};

const unhead_k2P3m_ZDyjlr2mMYnoDPwavjsDN8hBlk9cFai0bbopU = defineNuxtPlugin({
  name: "nuxt:head",
  enforce: "pre",
  setup(nuxtApp) {
    const head = nuxtApp.ssrContext.head;
    nuxtApp.vueApp.use(head);
  }
});

function toArray(value) {
  return Array.isArray(value) ? value : [value];
}

async function getRouteRules(arg) {
  const path = typeof arg === "string" ? arg : arg.path;
  {
    useNuxtApp().ssrContext._preloadManifest = true;
    const _routeRulesMatcher = toRouteMatcher(
      createRouter({ routes: useRuntimeConfig().nitro.routeRules })
    );
    return defu({}, ..._routeRulesMatcher.matchAll(path).reverse());
  }
}

const PageRouteSymbol = Symbol("route");

const useRouter = () => {
  var _a;
  return (_a = useNuxtApp()) == null ? void 0 : _a.$router;
};
const useRoute = () => {
  if (hasInjectionContext()) {
    return inject(PageRouteSymbol, useNuxtApp()._route);
  }
  return useNuxtApp()._route;
};
// @__NO_SIDE_EFFECTS__
function defineNuxtRouteMiddleware(middleware) {
  return middleware;
}
const isProcessingMiddleware = () => {
  try {
    if (useNuxtApp()._processingMiddleware) {
      return true;
    }
  } catch {
    return false;
  }
  return false;
};
const URL_QUOTE_RE = /"/g;
const navigateTo = (to, options) => {
  to || (to = "/");
  const toPath = typeof to === "string" ? to : "path" in to ? resolveRouteObject(to) : useRouter().resolve(to).href;
  const isExternalHost = hasProtocol(toPath, { acceptRelative: true });
  const isExternal = (options == null ? void 0 : options.external) || isExternalHost;
  if (isExternal) {
    if (!(options == null ? void 0 : options.external)) {
      throw new Error("Navigating to an external URL is not allowed by default. Use `navigateTo(url, { external: true })`.");
    }
    const { protocol } = new URL(toPath, "http://localhost");
    if (protocol && isScriptProtocol(protocol)) {
      throw new Error(`Cannot navigate to a URL with '${protocol}' protocol.`);
    }
  }
  const inMiddleware = isProcessingMiddleware();
  const router = useRouter();
  const nuxtApp = useNuxtApp();
  {
    if (nuxtApp.ssrContext) {
      const fullPath = typeof to === "string" || isExternal ? toPath : router.resolve(to).fullPath || "/";
      const location2 = isExternal ? toPath : joinURL(useRuntimeConfig().app.baseURL, fullPath);
      const redirect = async function(response) {
        await nuxtApp.callHook("app:redirected");
        const encodedLoc = location2.replace(URL_QUOTE_RE, "%22");
        const encodedHeader = encodeURL(location2, isExternalHost);
        nuxtApp.ssrContext._renderResponse = {
          statusCode: sanitizeStatusCode((options == null ? void 0 : options.redirectCode) || 302, 302),
          body: `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0; url=${encodedLoc}"></head></html>`,
          headers: { location: encodedHeader }
        };
        return response;
      };
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
      (void 0).replace(toPath);
    } else {
      (void 0).href = toPath;
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
function resolveRouteObject(to) {
  return withQuery(to.path || "", to.query || {}) + (to.hash || "");
}
function encodeURL(location2, isExternalHost = false) {
  const url = new URL(location2, "http://localhost");
  if (!isExternalHost) {
    return url.pathname + url.search + url.hash;
  }
  if (location2.startsWith("//")) {
    return url.toString().replace(url.protocol, "");
  }
  return url.toString();
}

function handleHotUpdate(_router, _generateRoutes) {
}
const _routes = [
  {
    name: "index",
    path: "/",
    component: () => import('./index.vue.mjs')
  },
  {
    name: "start",
    path: "/start",
    component: () => Promise.resolve().then(function () { return index_vue$2; })
  },
  {
    name: "o-mnie",
    path: "/o-mnie",
    component: () => Promise.resolve().then(function () { return index_vue; })
  },
  {
    name: "uslugi",
    path: "/uslugi",
    component: () => Promise.resolve().then(function () { return index_vue$1; })
  }
];

const ROUTE_KEY_PARENTHESES_RE = /(:\w+)\([^)]+\)/g;
const ROUTE_KEY_SYMBOLS_RE = /(:\w+)[?+*]/g;
const ROUTE_KEY_NORMAL_RE = /:\w+/g;
function generateRouteKey(route) {
  const source = (route == null ? void 0 : route.meta.key) ?? route.path.replace(ROUTE_KEY_PARENTHESES_RE, "$1").replace(ROUTE_KEY_SYMBOLS_RE, "$1").replace(ROUTE_KEY_NORMAL_RE, (r) => {
    var _a;
    return ((_a = route.params[r.slice(1)]) == null ? void 0 : _a.toString()) || "";
  });
  return typeof source === "function" ? source(route) : source;
}
function isChangingPage(to, from) {
  if (to === from || from === START_LOCATION) {
    return false;
  }
  if (generateRouteKey(to) !== generateRouteKey(from)) {
    return true;
  }
  const areComponentsSame = to.matched.every(
    (comp, index) => {
      var _a, _b;
      return comp.components && comp.components.default === ((_b = (_a = from.matched[index]) == null ? void 0 : _a.components) == null ? void 0 : _b.default);
    }
  );
  if (areComponentsSame) {
    return false;
  }
  return true;
}

const routerOptions0 = {
  scrollBehavior(to, from, savedPosition) {
    var _a;
    const nuxtApp = useNuxtApp();
    const behavior = ((_a = useRouter().options) == null ? void 0 : _a.scrollBehaviorType) ?? "auto";
    let position = savedPosition || void 0;
    const routeAllowsScrollToTop = typeof to.meta.scrollToTop === "function" ? to.meta.scrollToTop(to, from) : to.meta.scrollToTop;
    if (!position && from && to && routeAllowsScrollToTop !== false && isChangingPage(to, from)) {
      position = { left: 0, top: 0 };
    }
    if (to.path === from.path) {
      if (from.hash && !to.hash) {
        return { left: 0, top: 0 };
      }
      if (to.hash) {
        return { el: to.hash, top: _getHashElementScrollMarginTop(to.hash), behavior };
      }
      return false;
    }
    const hasTransition = (route) => !!(route.meta.pageTransition ?? appPageTransition);
    const hookToWait = hasTransition(from) && hasTransition(to) ? "page:transition:finish" : "page:loading:end";
    return new Promise((resolve) => {
      nuxtApp.hooks.hookOnce(hookToWait, () => {
        requestAnimationFrame(() => resolve(_calculatePosition(to, "instant", position)));
      });
    });
  }
};
function _getHashElementScrollMarginTop(selector) {
  try {
    const elem = (void 0).querySelector(selector);
    if (elem) {
      return (Number.parseFloat(getComputedStyle(elem).scrollMarginTop) || 0) + (Number.parseFloat(getComputedStyle((void 0).documentElement).scrollPaddingTop) || 0);
    }
  } catch {
  }
  return 0;
}
function _calculatePosition(to, scrollBehaviorType, position) {
  if (position) {
    return position;
  }
  if (to.hash) {
    return {
      el: to.hash,
      top: _getHashElementScrollMarginTop(to.hash),
      behavior: scrollBehaviorType
    };
  }
  return { left: 0, top: 0, behavior: scrollBehaviorType };
}

const configRouterOptions = {
  hashMode: false,
  scrollBehaviorType: "auto"
};
const routerOptions = {
  ...configRouterOptions,
  ...routerOptions0
};

const validate = defineNuxtRouteMiddleware(async (to) => {
  var _a;
  let __temp, __restore;
  if (!((_a = to.meta) == null ? void 0 : _a.validate)) {
    return;
  }
  const nuxtApp = useNuxtApp();
  const router = useRouter();
  const result = ([__temp, __restore] = executeAsync(() => Promise.resolve(to.meta.validate(to))), __temp = await __temp, __restore(), __temp);
  if (result === true) {
    return;
  }
  const error = createError({
    statusCode: result && result.statusCode || 404,
    statusMessage: result && result.statusMessage || `Page Not Found: ${to.fullPath}`,
    data: {
      path: to.fullPath
    }
  });
  const unsub = router.beforeResolve((final) => {
    unsub();
    if (final === to) {
      const unsub2 = router.afterEach(async () => {
        unsub2();
        await nuxtApp.runWithContext(() => showError(error));
      });
      return false;
    }
  });
});

const manifest_45route_45rule = defineNuxtRouteMiddleware(async (to) => {
  {
    return;
  }
});

const globalMiddleware = [
  validate,
  manifest_45route_45rule
];
const namedMiddleware = {};

const plugin = defineNuxtPlugin({
  name: "nuxt:router",
  enforce: "pre",
  async setup(nuxtApp) {
    var _a, _b, _c, _d;
    let __temp, __restore;
    let routerBase = useRuntimeConfig().app.baseURL;
    const history = ((_b = (_a = routerOptions).history) == null ? void 0 : _b.call(_a, routerBase)) ?? createMemoryHistory(routerBase);
    const routes = routerOptions.routes ? ([__temp, __restore] = executeAsync(() => routerOptions.routes(_routes)), __temp = await __temp, __restore(), __temp) ?? _routes : _routes;
    let startPosition;
    const router = createRouter$1({
      ...routerOptions,
      scrollBehavior: (to, from, savedPosition) => {
        if (from === START_LOCATION) {
          startPosition = savedPosition;
          return;
        }
        if (routerOptions.scrollBehavior) {
          router.options.scrollBehavior = routerOptions.scrollBehavior;
          if ("scrollRestoration" in (void 0).history) {
            const unsub = router.beforeEach(() => {
              unsub();
              (void 0).history.scrollRestoration = "manual";
            });
          }
          return routerOptions.scrollBehavior(to, START_LOCATION, startPosition || savedPosition);
        }
      },
      history,
      routes
    });
    handleHotUpdate(router, routerOptions.routes ? routerOptions.routes : (routes2) => routes2);
    nuxtApp.vueApp.use(router);
    const previousRoute = shallowRef(router.currentRoute.value);
    router.afterEach((_to, from) => {
      previousRoute.value = from;
    });
    Object.defineProperty(nuxtApp.vueApp.config.globalProperties, "previousRoute", {
      get: () => previousRoute.value
    });
    const initialURL = nuxtApp.ssrContext.url;
    const _route = shallowRef(router.currentRoute.value);
    const syncCurrentRoute = () => {
      _route.value = router.currentRoute.value;
    };
    nuxtApp.hook("page:finish", syncCurrentRoute);
    router.afterEach((to, from) => {
      var _a2, _b2, _c2, _d2;
      if (((_b2 = (_a2 = to.matched[0]) == null ? void 0 : _a2.components) == null ? void 0 : _b2.default) === ((_d2 = (_c2 = from.matched[0]) == null ? void 0 : _c2.components) == null ? void 0 : _d2.default)) {
        syncCurrentRoute();
      }
    });
    const route = {};
    for (const key in _route.value) {
      Object.defineProperty(route, key, {
        get: () => _route.value[key],
        enumerable: true
      });
    }
    nuxtApp._route = shallowReactive(route);
    nuxtApp._middleware || (nuxtApp._middleware = {
      global: [],
      named: {}
    });
    useError();
    if (!((_c = nuxtApp.ssrContext) == null ? void 0 : _c.islandContext)) {
      router.afterEach(async (to, _from, failure) => {
        delete nuxtApp._processingMiddleware;
        if (failure) {
          await nuxtApp.callHook("page:loading:end");
        }
        if ((failure == null ? void 0 : failure.type) === 4) {
          return;
        }
        if (to.redirectedFrom && to.fullPath !== initialURL) {
          await nuxtApp.runWithContext(() => navigateTo(to.fullPath || "/"));
        }
      });
    }
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
    const resolvedInitialRoute = router.currentRoute.value;
    syncCurrentRoute();
    if ((_d = nuxtApp.ssrContext) == null ? void 0 : _d.islandContext) {
      return { provide: { router } };
    }
    const initialLayout = nuxtApp.payload.state._layout;
    router.beforeEach(async (to, from) => {
      var _a2, _b2, _c2;
      await nuxtApp.callHook("page:loading:start");
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
          for (const entry of toArray(componentMiddleware)) {
            middlewareEntries.add(entry);
          }
        }
        {
          const routeRules = await nuxtApp.runWithContext(() => getRouteRules({ path: to.path }));
          if (routeRules.appMiddleware) {
            for (const key in routeRules.appMiddleware) {
              if (routeRules.appMiddleware[key]) {
                middlewareEntries.add(key);
              } else {
                middlewareEntries.delete(key);
              }
            }
          }
        }
        for (const entry of middlewareEntries) {
          const middleware = typeof entry === "string" ? nuxtApp._middleware.named[entry] || await ((_c2 = (_b2 = namedMiddleware)[entry]) == null ? void 0 : _c2.call(_b2).then((r) => r.default || r)) : entry;
          if (!middleware) {
            throw new Error(`Unknown route middleware: '${entry}'.`);
          }
          try {
            const result = await nuxtApp.runWithContext(() => middleware(to, from));
            if (true) {
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
            if (result === false) {
              return result;
            }
            if (result) {
              if (isNuxtError(result) && result.fatal) {
                await nuxtApp.runWithContext(() => showError(result));
              }
              return result;
            }
          } catch (err) {
            const error2 = createError$1(err);
            if (error2.fatal) {
              await nuxtApp.runWithContext(() => showError(error2));
            }
            return error2;
          }
        }
      }
    });
    router.onError(async () => {
      delete nuxtApp._processingMiddleware;
      await nuxtApp.callHook("page:loading:end");
    });
    router.afterEach(async (to, _from) => {
      if (to.matched.length === 0) {
        await nuxtApp.runWithContext(() => showError(createError$1({
          statusCode: 404,
          fatal: false,
          statusMessage: `Page not found: ${to.fullPath}`,
          data: {
            path: to.fullPath
          }
        })));
      }
    });
    nuxtApp.hooks.hookOnce("app:created", async () => {
      try {
        if ("name" in resolvedInitialRoute) {
          resolvedInitialRoute.name = void 0;
        }
        await router.replace({
          ...resolvedInitialRoute,
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

function definePayloadReducer(name, reduce) {
  {
    useNuxtApp().ssrContext._payloadReducers[name] = reduce;
  }
}

const reducers = [
  ["NuxtError", (data) => isNuxtError(data) && data.toJSON()],
  ["EmptyShallowRef", (data) => isRef(data) && isShallow(data) && !data.value && (typeof data.value === "bigint" ? "0n" : JSON.stringify(data.value) || "_")],
  ["EmptyRef", (data) => isRef(data) && !data.value && (typeof data.value === "bigint" ? "0n" : JSON.stringify(data.value) || "_")],
  ["ShallowRef", (data) => isRef(data) && isShallow(data) && data.value],
  ["ShallowReactive", (data) => isReactive(data) && isShallow(data) && toRaw(data)],
  ["Ref", (data) => isRef(data) && data.value],
  ["Reactive", (data) => isReactive(data) && toRaw(data)]
];
const revive_payload_server_MVtmlZaQpj6ApFmshWfUWl5PehCebzaBf2NuRMiIbms = defineNuxtPlugin({
  name: "nuxt:revive-payload:server",
  setup() {
    for (const [reducer, fn] of reducers) {
      definePayloadReducer(reducer, fn);
    }
  }
});

const components_plugin_z4hgvsiddfKkfXTP6M8M4zG5Cb7sGnDhcryKVM45Di4 = defineNuxtPlugin({
  name: "nuxt:global-components"
});

const plugins = [
  unhead_k2P3m_ZDyjlr2mMYnoDPwavjsDN8hBlk9cFai0bbopU,
  plugin,
  revive_payload_server_MVtmlZaQpj6ApFmshWfUWl5PehCebzaBf2NuRMiIbms,
  components_plugin_z4hgvsiddfKkfXTP6M8M4zG5Cb7sGnDhcryKVM45Di4
];

const phoneIcon = "" + __buildAssetsURL("phone.D9_i9_D7.png");

const emailIcon = "" + __buildAssetsURL("mail.CoTVKf5L.png");

const addressIcon = "" + __buildAssetsURL("address.BTfPNySo.png");

const _sfc_main$8 = /* @__PURE__ */ defineComponent({
  __name: "TheFooter",
  __ssrInlineRender: true,
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<footer${ssrRenderAttrs(mergeProps({
        class: _ctx.style.footer
      }, _attrs))}><address class="${ssrRenderClass(_ctx.style.address)}"><a href="mailto: a.m.gorzynska@gmail.com" class="${ssrRenderClass(_ctx.style.link)}"><img${ssrRenderAttr("src", unref(emailIcon))} class="${ssrRenderClass(_ctx.style.icon)}">a.m.gorzynska@gmail.com</a><a href="tel: +48660100318" class="${ssrRenderClass(_ctx.style.link)}"><img${ssrRenderAttr("src", unref(phoneIcon))} class="${ssrRenderClass(_ctx.style.icon)}">660 100 318</a><a href="https://maps.app.goo.gl/Pvygm17Z8EtQACh4A" class="${ssrRenderClass(_ctx.style.link)}" target="_blank"><img${ssrRenderAttr("src", unref(addressIcon))} class="${ssrRenderClass(_ctx.style.icon)}">Jana Matejski 16/120, 78-100 Kołobrzeg</a></address><div class="${ssrRenderClass(_ctx.style.copyright)}">© 2024 Fizjoterapia Anna Ignaś</div></footer>`);
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

const firstNonUndefined = (...args) => args.find((arg) => arg !== void 0);
// @__NO_SIDE_EFFECTS__
function defineNuxtLink(options) {
  const componentName = options.componentName || "NuxtLink";
  function isHashLinkWithoutHashMode(link) {
    return typeof link === "string" && link.startsWith("#");
  }
  function resolveTrailingSlashBehavior(to, resolve) {
    if (!to || options.trailingSlash !== "append" && options.trailingSlash !== "remove") {
      return to;
    }
    if (typeof to === "string") {
      return applyTrailingSlashBehavior(to, options.trailingSlash);
    }
    const path = "path" in to && to.path !== void 0 ? to.path : resolve(to).path;
    const resolvedPath = {
      ...to,
      name: void 0,
      // named routes would otherwise always override trailing slash behavior
      path: applyTrailingSlashBehavior(path, options.trailingSlash)
    };
    return resolvedPath;
  }
  function useNuxtLink(props) {
    const router = useRouter();
    const config = useRuntimeConfig();
    const hasTarget = computed(() => !!props.target && props.target !== "_self");
    const isAbsoluteUrl = computed(() => {
      const path = props.to || props.href || "";
      return typeof path === "string" && hasProtocol(path, { acceptRelative: true });
    });
    const builtinRouterLink = resolveComponent("RouterLink");
    const useBuiltinLink = builtinRouterLink && typeof builtinRouterLink !== "string" ? builtinRouterLink.useLink : void 0;
    const isExternal = computed(() => {
      if (props.external) {
        return true;
      }
      const path = props.to || props.href || "";
      if (typeof path === "object") {
        return false;
      }
      return path === "" || isAbsoluteUrl.value;
    });
    const to = computed(() => {
      const path = props.to || props.href || "";
      if (isExternal.value) {
        return path;
      }
      return resolveTrailingSlashBehavior(path, router.resolve);
    });
    const link = isExternal.value ? void 0 : useBuiltinLink == null ? void 0 : useBuiltinLink({ ...props, to });
    const href = computed(() => {
      var _a;
      if (!to.value || isAbsoluteUrl.value || isHashLinkWithoutHashMode(to.value)) {
        return to.value;
      }
      if (isExternal.value) {
        const path = typeof to.value === "object" && "path" in to.value ? resolveRouteObject(to.value) : to.value;
        const href2 = typeof path === "object" ? router.resolve(path).href : path;
        return resolveTrailingSlashBehavior(
          href2,
          router.resolve
          /* will not be called */
        );
      }
      if (typeof to.value === "object") {
        return ((_a = router.resolve(to.value)) == null ? void 0 : _a.href) ?? null;
      }
      return resolveTrailingSlashBehavior(
        joinURL(config.app.baseURL, to.value),
        router.resolve
        /* will not be called */
      );
    });
    return {
      to,
      hasTarget,
      isAbsoluteUrl,
      isExternal,
      //
      href,
      isActive: (link == null ? void 0 : link.isActive) ?? computed(() => to.value === router.currentRoute.value.path),
      isExactActive: (link == null ? void 0 : link.isExactActive) ?? computed(() => to.value === router.currentRoute.value.path),
      route: (link == null ? void 0 : link.route) ?? computed(() => router.resolve(to.value)),
      async navigate(_e) {
        await navigateTo(href.value, { replace: props.replace, external: isExternal.value || hasTarget.value });
      }
    };
  }
  return defineComponent({
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
      prefetchOn: {
        type: [String, Object],
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
    useLink: useNuxtLink,
    setup(props, { slots }) {
      useRouter();
      const { to, href, navigate, isExternal, hasTarget, isAbsoluteUrl } = useNuxtLink(props);
      ref(false);
      const el = void 0;
      const elRef = void 0;
      async function prefetch(nuxtApp = useNuxtApp()) {
        {
          return;
        }
      }
      return () => {
        var _a;
        if (!isExternal.value && !hasTarget.value && !isHashLinkWithoutHashMode(to.value)) {
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
            routerLinkProps.rel = props.rel || void 0;
          }
          return h(
            resolveComponent("RouterLink"),
            routerLinkProps,
            slots.default
          );
        }
        const target = props.target || null;
        const rel = firstNonUndefined(
          // converts `""` to `null` to prevent the attribute from being added as empty (`rel=""`)
          props.noRel ? "" : props.rel,
          options.externalRelAttribute,
          /*
          * A fallback rel of `noopener noreferrer` is applied for external links or links that open in a new tab.
          * This solves a reverse tabnapping security flaw in browsers pre-2021 as well as improving privacy.
          */
          isAbsoluteUrl.value || hasTarget.value ? "noopener noreferrer" : ""
        ) || null;
        if (props.custom) {
          if (!slots.default) {
            return null;
          }
          return slots.default({
            href: href.value,
            navigate,
            prefetch,
            get route() {
              if (!href.value) {
                return void 0;
              }
              const url = new URL(href.value, "http://localhost");
              return {
                path: url.pathname,
                fullPath: url.pathname,
                get query() {
                  return parseQuery(url.search);
                },
                hash: url.hash,
                params: {},
                name: void 0,
                matched: [],
                redirectedFrom: void 0,
                meta: {},
                href: href.value
              };
            },
            rel,
            target,
            isExternal: isExternal.value || hasTarget.value,
            isActive: false,
            isExactActive: false
          });
        }
        return h("a", { ref: el, href: href.value || null, rel, target }, (_a = slots.default) == null ? void 0 : _a.call(slots));
      };
    }
    // }) as unknown as DefineComponent<NuxtLinkProps, object, object, ComputedOptions, MethodOptions, object, object, EmitsOptions, string, object, NuxtLinkProps, object, SlotsType<NuxtLinkSlots>>
  });
}
const __nuxt_component_0 = /* @__PURE__ */ defineNuxtLink(nuxtLinkDefaults);
function applyTrailingSlashBehavior(to, trailingSlash) {
  const normalizeFn = trailingSlash === "append" ? withTrailingSlash : withoutTrailingSlash;
  const hasProtocolDifferentFromHttp = hasProtocol(to) && !to.startsWith("http");
  if (hasProtocolDifferentFromHttp) {
    return to;
  }
  return normalizeFn(to, true);
}

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
    if (screenWidth.value === 0) {
      return null;
    }
    return screenWidth.value <= MOBILE_BREAKPOINT_PX;
  });
  return {
    isMobile
  };
};

const fbLogo$1 = "" + __buildAssetsURL("facebook.yCT9b1HG.png");

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
      if (unref(isMobile) === false) {
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
        ssrRenderList(links, (link) => {
          _push(`<li class="${ssrRenderClass(_ctx.style.linkItem)}">`);
          _push(ssrRenderComponent(_component_NuxtLink, {
            to: link.to,
            class: _ctx.style.link
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`${ssrInterpolate(link.label)}`);
              } else {
                return [
                  createTextVNode(toDisplayString(link.label), 1)
                ];
              }
            }),
            _: 2
          }, _parent));
          _push(`</li>`);
        });
        _push(`<!--]--></ul></nav></header>`);
      } else if (unref(isMobile) === true) {
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
          ssrRenderList(links, (link) => {
            _push(`<li class="${ssrRenderClass(_ctx.style.linkItem)}"><a${ssrRenderAttr("href", link.to)} class="${ssrRenderClass(_ctx.style.link)}">${ssrInterpolate(link.label)}</a></li>`);
          });
          _push(`<!--]--></ul></nav>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</header>`);
      } else {
        _push(`<!---->`);
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

const index_vue$2 = /*#__PURE__*/Object.freeze({
  __proto__: null,
  default: StartPage
});

const visitIcon = "" + __buildAssetsURL("building.B2hM6s37.png");

const classicalMassageIcon = "" + __buildAssetsURL("body-massage.Clcosnrb.png");

const deepMassageIcon = "" + __buildAssetsURL("massage.BkQy4HM9.png");

const kobidoIcon = "" + __buildAssetsURL("facial-massage.CcimryH3.png");

const preventIcon = "" + __buildAssetsURL("prevention.BRhqFDvp.png");

const lymphaticDrainageIcon = "" + __buildAssetsURL("lymphatic-drainage.Bv5c4cdx.png");

const lymphaticDrainageWithCompressionIcon = "" + __buildAssetsURL("lymphatic-drainage-with-compression.BlZzLOx6.png");

const _sfc_main$5 = /* @__PURE__ */ defineComponent({
  __name: "index",
  __ssrInlineRender: true,
  setup(__props) {
    const services = [
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
      },
      {
        label: "drenaż limfatyczny",
        icon: lymphaticDrainageIcon
      },
      {
        label: "drenaż limfatyczny z kompresoterapią",
        icon: lymphaticDrainageWithCompressionIcon
      }
    ];
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({
        class: _ctx.style.servicesContainer
      }, _attrs))}><div class="${ssrRenderClass(_ctx.style.services)}"><article><br><h3 class="${ssrRenderClass(_ctx.style.h3)}">Usługi</h3><ul class="${ssrRenderClass(_ctx.style.servicesList)}"><!--[-->`);
      ssrRenderList(services, (service, index) => {
        _push(`<li class="${ssrRenderClass([_ctx.style.serviceItem, _ctx.style[`serviceItem${index}`]])}"><figure class="${ssrRenderClass(_ctx.style.singleService)}"><img${ssrRenderAttr("src", service.icon)} class="${ssrRenderClass(_ctx.style.icon)}"><figcaption class="${ssrRenderClass(_ctx.style.iconCaption)}">${ssrInterpolate(service.label)}</figcaption></figure></li>`);
      });
      _push(`<!--]--></ul></article></div></div>`);
    };
  }
});

const h1$1 = "_h1_5hilq_1";
const h2$1 = "_h2_5hilq_1";
const h3$1 = "_h3_5hilq_1";
const h4$1 = "_h4_5hilq_1";
const servicesContainer = "_servicesContainer_5hilq_7";
const services = "_services_5hilq_7";
const servicesList = "_servicesList_5hilq_27";
const serviceItem = "_serviceItem_5hilq_47";
const serviceItem0 = "_serviceItem0_5hilq_57";
const serviceItem1 = "_serviceItem1_5hilq_63";
const serviceItem2 = "_serviceItem2_5hilq_69";
const serviceItem3 = "_serviceItem3_5hilq_75";
const serviceItem4 = "_serviceItem4_5hilq_81";
const serviceItem5 = "_serviceItem5_5hilq_87";
const serviceItem6 = "_serviceItem6_5hilq_93";
const singleService = "_singleService_5hilq_99";
const icon$1 = "_icon_5hilq_113";
const iconCaption = "_iconCaption_5hilq_121";
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
  serviceItem5,
  serviceItem6,
  singleService,
  icon: icon$1,
  iconCaption
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

const index_vue$1 = /*#__PURE__*/Object.freeze({
  __proto__: null,
  default: ServicesPage
});

const leftArrowIcon = "data:image/png;base64,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";

const rightArrowIcon = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAgAAAAIACAYAAAD0eNT6AAAACXBIWXMAAJ16AACdegHu2JUgAAAAGXRFWHRTb2Z0d2FyZQB3d3cuaW5rc2NhcGUub3Jnm+48GgAACy5JREFUeJzt2T1yHNcVhuELgrlYpVIIAWWglHkP8Cpcttfgvbi8A/9swLkCbsOypFIRTi2TualxQDZJEDPA/HT3veec5wknOtF8b3e3BgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADAFue9D4DR3bb2/Pzy8k9fffHFP//z5s1/e98DMIdnvQ+AwZ3/+/LqL62d/fFte/by5uLiuvdBAHM4630ADOz85vLqr5vWfv/hl027O9u8/c33d3c/dLwL4GQCALZ7OP4TEQAkIADgod3jPxEBQHACAO57evwnIgAITADAR/uP/0QEAEEJAHjn8PGfiAAgIAEAp4z/RAQAwQgAqjt9/CciAAhEAFDZfOM/EQFAEAKAquYf/4kIAAIQAFS03PhPRAAwOAFANcuP/0QEAAMTAFSy3vhPRAAwKAFAFeuP/0QEAAMSAFRwfn159bfW2u+6XSACgMEIALLrP/4TEQAMRACQ2TjjPxEBwCAEAFmNN/4TEQAMQACQ0bjjPxEBQGcCgGzGH/+JCAA6EgBkEmf8JyIA6EQAkEW88Z+IAKADAUAGccd/IgKAlQkAoos//hMRAKxIABBZnvGfiABgJQKAqPKN/0QEACsQAESUd/wnIgBYmAAgmvzjPxEBwIIEAKHcXF3dbjbt29baee9bVrFpd+ftl9vvXr36sfcpQC7Peh8Ah/j+p59etrP2h9Y2/+t9yyrO2sXb9uzlzcXFde9TgFy8ASCk66ur37bN5u+tnT3vfcsqfA4AZiYACEsEABxPABCaCAA4jgAgPBEAcDgBQAoiAOAwAoA0RADA/gQAqYgAgP0IANIRAQBPEwCkJAIAHicASEsEAOwmAEhNBABsJwBITwQAPCQAKEEEANwnAChDBAB8JAAoRQQAvCMAKEcEAAgAihIBQHUCgLJEAFCZAKA0EQBUJQAoTwQAFQkAaCIAqEcAwHsiAKhEAMAnRABQhQCAz4gAoAIBAFuIACA7AQA7iAAgMwEAjxABQFYCAJ4gAoCMBADsQQQA2QgA2JMIADIRAHAAEQBkIQDgQCIAyEAAwBFEABCdAIAjiQAgMgEAJxABQFQCAE4kAoCIBADMQAQA0QgAmIkIACIRADAjEQBEIQBgZiIAiEAAwAJEADA6AQALEQHAyAQALEgEAKMSALAwEQCMSADACkQAMBoBACsRAcBIBACsSAQAoxAAsDIRAIxAAEAHIgDoTQBAJyIA6EkAQEciAOhFAEBnIgDoQQDAAEQAsDYBAIMQAcCaBAAMRAQAaxEAMBgRAKxBAMCARACwNAEAgxIBwJIEAAxMBABLEQAwOBEALEEAQAAiAJibAIAgRAAwJwEAgYgAYC4CAIIRAcAcBAAEJAKAUwkACEoEAKcQABCYCACOJQAgOBEAHEMAQAIiADiUAIAkRABwCAEAiYgAYF8CAJIRAcA+BAAkJAKApwgASEoEAI8RAJCYCAB2EQCQnAgAthEAUIAIAD4nAKAIEQB8SgBAISIAmAgAKEYEAK0JAChJBAACAIoSAVCbAIDCRADUJQCgOBEANQkAQARAQQIAaK2JAKhGAAAfiACoQwAA94gAqEEAAA+IAMhPAABbiQDITQAAO4kAyEsAAI8SAZCTAACeJAIgHwEA7EUEQC4CANibCIA8BABwEBEAOQgA4GAiAOITAMBRRADEJgCAo4kAiEsAACcRARCTAABOJgIgHgEAzEIEQCwCAJiNCIA4BAAwKxEAMQgAYHYiAMb3rPcBAMD6vAEAZuXpH2IQAMBsjD/EIQCAWRh/iEUAACcz/hCPAABOYvwhJgEAHM34Q1wCADiK8YfYBABwMOMP8QkA4CDGH3IQAMDejD/kIQCAvRh/yEUAAE8y/pCPAAAeZfwhJwEA7GT8IS8BAGxl/CE3AQA8YPwhPwEA3GP8oQYBAHxg/KEOAQC01ow/VCMAAOMPBQkAKM74Q00CAAoz/lCXAICijD/UJgCgIOMPCAAoxvgDrQkAKMX4AxMBAEUYf+BTAgAKMP7A5wQAJGf8gW0EACRm/IFdBAAkZfyBxwgASMj4A08RAJCM8Qf2IQAgEeMP7EsAQBLGHziEAIAEjD9wKAEAwRl/4BgCAAIz/sCxBAAEZfyBUwgACMj4A6cSABCM8QfmIAAgEOMPzEUAQBDGH5iTAIAAjD8wNwEAgzP+wBIEAAzM+ANLEQAwKOMPLEkAwICMP7A0AQCDMf7AGgQADMT4A2sRADAI4w+sSQDAAIw/sDYBAJ0Zf6AHAQAdGX+gFwEAnRh/oCcBAB0Yf6A3AQArM/7ACAQArMj4A6MQALAS4w+MRADACow/MBoBAAsz/sCIBAAsyPgDoxIAsBDjD4xMAMACjD8wOgEAMzP+QAQCAGZk/IEoBADMxPgDkQgAmIHxB6IRAHAi4w9EJADgBMYfiEoAwJGMPxCZAIAjGH8gOgEABzL+QAYCAA5g/IEsBADsyfgDmQgA2IPxB7IRAPAE4w9kJADgEcYfyEoAwA7GH8hMAMAWxh/ITgDAZ4w/UIEAgE8Yf6AKAQDvGX+gEgEAzfgD9QgAyjP+QEUCgNKMP1CVAKAs4w9UJgAoyfgD1QkAyjH+AAKAYow/wDsCgDKMP8BHAoASjD/AfQKA9Iw/wEMCgNSMP8B2AoC0jD/AbgKAlIw/wOMEAOkYf4CnCQBSMf4A+xEApGH8AfYnAEjB+AMcRgAQnvEHOJwAIDTjD3AcAUBYxh/geAKAkIw/wGkEAOEYf4DTCQBCubm6ut1s2rettfPet6xi0+7O2y+337169WPvU4BcavyJksbPr1/fffnixTettV/3vmVx75/8/3V3Z/yB2QkAotn8/Ob1P7588eKmZY4Ar/2BhQkAIsodAcYfWIEAIKqcEWD8gZUIACLLFQHGH1iRACC6HBFg/IGVCQAyiB0Bxh/oQACQRcwIMP5AJwKATGJFgPEHOhIAZBMjAow/0JkAIKOxI8D4AwMQAGQ1ZgQYf2AQAoDMxooA4w8MRACQ3RgRYPyBwQgAKugbAcYfGJAAoIo+EWD8gUEJACpZNwKMPzAwAUA160SA8QcGJwCoaNkIMP5AAAKAqpaJAOMPBCEAqGzeCDD+QCACgOrmiQDjDwQjAODUCDD+QEACAN45LgKMPxCUAICPDosA4w8EJgDgvv0iwPgDwQkAeOjxCDD+QAICALbbHgHGH0hCAMBu9yPA+ANAHbetPb++vPzzN19//avetwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAALCo/wPPCaekbYslUQAAAABJRU5ErkJggg==";

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

const appSlider = "_appSlider_1vxs3_3";
const appSliderArrowContainer = "_appSliderArrowContainer_1vxs3_15";
const icon = "_icon_1vxs3_39";
const content = "_content_1vxs3_61";
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

const deepDocument = "" + __buildAssetsURL("anna-ignas-masaz-gleboki.-NQmqGdn.jpg");

const backboneDocument = "" + __buildAssetsURL("anna-ignas-kregoslup.DIiygnH6.jpg");

const manualDocument = "" + __buildAssetsURL("anna-ignas-terapia-manualna.DD_zs1AL.jpg");

const pinoDocument = "" + __buildAssetsURL("anna-ignas-pinoterapia.GKhe6xT1.jpg");

const studiesDocument = "" + __buildAssetsURL("anna-ignas-studia.xwaxfqjM.jpg");

const jobDocument = "" + __buildAssetsURL("anna-ignas-prawo-wykonywania-zawodu.CLd3dPHb.jpg");

const craniosacralDocument = "" + __buildAssetsURL("anna-ignas-terapia-czaszkowo-krzyzowa.CzlzZkTb.jpg");

const antiEdematousDocument = "" + __buildAssetsURL("anna-ignas-terapia-przeciwobrzekowa.CMQNJcR8.jpg");

const profilePhoto$1 = "" + __buildAssetsURL("anna-ignas-profilowe.zTFT-bmv.jpg");

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
    const documents = [
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
      },
      {
        label: "Certyfikat z kursu Terapia czaszkowo-krzyżowa",
        file: "terapia_czaszkowo_krzyzowa.pdf",
        img: craniosacralDocument
      },
      {
        label: "Certyfikat z kursu Masażu tkanek głębokich",
        file: "terapia_przeciwobrzekowa.pdf",
        img: antiEdematousDocument
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
      ssrRenderList(documents, (singleDocument, index) => {
        _push(`<li class="${ssrRenderClass(_ctx.style.documentItem)}"><a${ssrRenderAttr("href", `./files/${singleDocument.file}`)}${ssrRenderAttr("aria-label", singleDocument.label)} target="_blank"><img${ssrRenderAttr("src", singleDocument.img)} class="${ssrRenderClass(_ctx.style.documentImage)}"></a></li>`);
      });
      _push(`<!--]--></ul></article></div></div></div>`);
    };
  }
});

const h1 = "_h1_kpzob_1";
const h2 = "_h2_kpzob_1";
const h3 = "_h3_kpzob_1";
const h4 = "_h4_kpzob_1";
const paragraph = "_paragraph_kpzob_1";
const myDescriptionContainer = "_myDescriptionContainer_kpzob_9";
const myDescription = "_myDescription_kpzob_9";
const profilePhoto = "_profilePhoto_kpzob_31";
const courseList = "_courseList_kpzob_39";
const courseItem = "_courseItem_kpzob_45";
const documents = "_documents_kpzob_81";
const documentItem = "_documentItem_kpzob_97";
const documentImage = "_documentImage_kpzob_133";
const center = "_center_kpzob_159";
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
  documentItem,
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

const index_vue = /*#__PURE__*/Object.freeze({
  __proto__: null,
  default: AboutMePage
});

const _sfc_main$2 = /* @__PURE__ */ defineComponent({
  __name: "app",
  __ssrInlineRender: true,
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<!--[-->`);
      _push(ssrRenderComponent(unref(TheHeader), null, null, _parent));
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

const fizjoApp = "_fizjoApp_1rpr1_1";
const footer = "_footer_1rpr1_47";
const main = "_main_1rpr1_71";
const pagesContainer = "_pagesContainer_1rpr1_83";
const page = "_page_1rpr1_83";
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
    _error.stack ? _error.stack.split("\n").splice(1).map((line) => {
      const text = line.replace("webpack:/", "").replace(".vue", ".js").trim();
      return {
        text,
        internal: line.includes("node_modules") && !line.includes(".cache") || line.includes("internal") || line.includes("new Promise")
      };
    }).map((i) => `<span class="stack${i.internal ? " internal" : ""}">${i.text}</span>`).join("\n") : "";
    const statusCode = Number(_error.statusCode || 500);
    const is404 = statusCode === 404;
    const statusMessage = _error.statusMessage ?? (is404 ? "Page Not Found" : "Internal Server Error");
    const description = _error.message || _error.toString();
    const stack = void 0;
    const _Error404 = defineAsyncComponent(() => import('./error-404.vue.mjs'));
    const _Error = defineAsyncComponent(() => import('./error-500.vue.mjs'));
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

const _sfc_main = {
  __name: "nuxt-root",
  __ssrInlineRender: true,
  setup(__props) {
    const IslandRenderer = () => null;
    const nuxtApp = useNuxtApp();
    nuxtApp.deferHydration();
    nuxtApp.ssrContext.url;
    const SingleRenderer = false;
    provide(PageRouteSymbol, useRoute());
    nuxtApp.hooks.callHookWith((hooks) => hooks.map((hook) => hook()), "vue:setup");
    const error = useError();
    const abortRender = error.value && !nuxtApp.ssrContext.error;
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
          if (unref(abortRender)) {
            _push(`<div></div>`);
          } else if (unref(error)) {
            _push(ssrRenderComponent(unref(_sfc_main$1), { error: unref(error) }, null, _parent));
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

let entry;
{
  entry = async function createNuxtAppServer(ssrContext) {
    var _a;
    const vueApp = createApp(_sfc_main);
    const nuxt = createNuxtApp({ vueApp, ssrContext });
    try {
      await applyPlugins(nuxt, plugins);
      await nuxt.hooks.callHook("app:created", vueApp);
    } catch (error) {
      await nuxt.hooks.callHook("app:error", error);
      (_a = nuxt.payload).error || (_a.error = createError(error));
    }
    if (ssrContext == null ? void 0 : ssrContext._renderResponse) {
      throw new Error("skipping render");
    }
    return vueApp;
  };
}
const entry$1 = (ssrContext) => entry(ssrContext);

const server = /*#__PURE__*/Object.freeze({
  __proto__: null,
  default: entry$1
});

export { _export_sfc as _, __nuxt_component_0 as a, server as s, tryUseNuxtApp as t };
//# sourceMappingURL=server.mjs.map
