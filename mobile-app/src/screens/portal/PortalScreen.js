import React, { useEffect, useMemo, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { WebView } from 'react-native-webview';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import EmptyState from '../../components/EmptyState';
import { getToken } from '../../services/api';
import { WEBSITE_URL, ADMIN_PORTAL_URL, resolvePortalUrl } from '../../config';
import { spacing, fontSize, fontWeight, borderRadius } from '../../theme';

function buildPortalBootstrapScript(state) {
  return `
    (function() {
      var initialState = ${JSON.stringify(state)};

      function post(type, payload) {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: type, payload: payload || {} }));
        }
      }

      function readCookie(name) {
        var cookieString = document.cookie || '';
        var parts = cookieString.split('; ');
        for (var index = 0; index < parts.length; index += 1) {
          var item = parts[index];
          if (item.indexOf(name + '=') === 0) {
            return decodeURIComponent(item.slice(name.length + 1));
          }
        }
        return '';
      }

      function writeCookie(name, value) {
        document.cookie = name + '=' + encodeURIComponent(value) + '; path=/; SameSite=Lax';
      }

      function clearCookie(name) {
        document.cookie = name + '=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
      }

      function authKeys() {
        return ['sawdagar_website_token', 'sawdagar_admin_token'];
      }

      function activeToken() {
        try {
          return localStorage.getItem('sawdagar_website_token') || localStorage.getItem('sawdagar_admin_token') || readCookie('token') || '';
        } catch (error) {
          return readCookie('token') || '';
        }
      }

      function ensureViewport() {
        try {
          var viewport = document.querySelector('meta[name="viewport"]');
          if (!viewport) {
            viewport = document.createElement('meta');
            viewport.name = 'viewport';
            document.head.appendChild(viewport);
          }
          viewport.content = 'width=device-width, initial-scale=1, viewport-fit=cover';
        } catch (error) {}
      }

      window.__SAWDAGAR_STATE__ = initialState;
      window.__SAWDAGAR_SYNC__ = function(nextState) {
        window.__SAWDAGAR_STATE__ = nextState || window.__SAWDAGAR_STATE__ || {};
        var token = (window.__SAWDAGAR_STATE__ && window.__SAWDAGAR_STATE__.token) || '';

        try {
          localStorage.setItem('sawdagar_lang', window.__SAWDAGAR_STATE__.lang || 'en');
          localStorage.setItem('sawdagar_admin_lang', window.__SAWDAGAR_STATE__.lang || 'en');
          localStorage.setItem('sawdagar_theme', window.__SAWDAGAR_STATE__.themeKey || 'ocean');
          localStorage.setItem('sawdagar_theme_mode', window.__SAWDAGAR_STATE__.themeMode || 'light');
          localStorage.setItem('sawdagar_mobile_primary', window.__SAWDAGAR_STATE__.primaryColor || '#2144C8');

          authKeys().forEach(function(key) {
            if (token) localStorage.setItem(key, token);
            else localStorage.removeItem(key);
          });
        } catch (error) {}

        if (token) writeCookie('token', token);
        else clearCookie('token');

        try {
          document.documentElement.setAttribute('data-sawdagar-mobile', 'true');
          document.documentElement.style.setProperty('--sawdagar-mobile-primary', window.__SAWDAGAR_STATE__.primaryColor || '#2144C8');
        } catch (error) {}

        post('auth-state', { token: activeToken() });
      };

      if (!window.__SAWDAGAR_BRIDGE_READY__) {
        window.__SAWDAGAR_BRIDGE_READY__ = true;

        ensureViewport();

        var rawSetItem = Storage.prototype.setItem;
        Storage.prototype.setItem = function(key, value) {
          rawSetItem.apply(this, arguments);
          if (authKeys().indexOf(key) >= 0) {
            post('auth-state', { token: value || '' });
          }
        };

        var rawRemoveItem = Storage.prototype.removeItem;
        Storage.prototype.removeItem = function(key) {
          rawRemoveItem.apply(this, arguments);
          if (authKeys().indexOf(key) >= 0) {
            post('auth-state', { token: activeToken() });
          }
        };

        var rawFetch = window.fetch;
        if (rawFetch) {
          window.fetch = function(input, init) {
            var requestUrl = typeof input === 'string' ? input : (input && input.url) || '';
            var nextInit = init ? Object.assign({}, init) : {};
            var headers = new Headers(nextInit.headers || (input && input.headers) || {});
            var token = (window.__SAWDAGAR_STATE__ && window.__SAWDAGAR_STATE__.token) || '';
            var isApiRequest = requestUrl.indexOf('/api/') === 0 || requestUrl.indexOf(window.location.origin + '/api/') === 0;

            if (isApiRequest) {
              nextInit.credentials = 'include';
              if (token && !headers.get('Authorization')) {
                headers.set('Authorization', 'Bearer ' + token);
              }
            }

            nextInit.headers = headers;
            return rawFetch(input, nextInit).then(function(response) {
              if (isApiRequest && /\/api\/auth\/login$/.test(requestUrl)) {
                response.clone().json().then(function(data) {
                  if (data && data.token) {
                    window.__SAWDAGAR_SYNC__(Object.assign({}, window.__SAWDAGAR_STATE__, { token: data.token }));
                  }
                }).catch(function() {});
              }

              if (isApiRequest && /\/api\/auth\/logout$/.test(requestUrl) && response && response.ok) {
                window.__SAWDAGAR_SYNC__(Object.assign({}, window.__SAWDAGAR_STATE__, { token: '' }));
              }

              return response;
            });
          };
        }

        function notifyLocation() {
          post('location-change', { href: window.location.href, title: document.title || '' });
        }

        var rawPushState = history.pushState;
        history.pushState = function() {
          var result = rawPushState.apply(history, arguments);
          setTimeout(notifyLocation, 0);
          return result;
        };

        var rawReplaceState = history.replaceState;
        history.replaceState = function() {
          var result = rawReplaceState.apply(history, arguments);
          setTimeout(notifyLocation, 0);
          return result;
        };

        window.addEventListener('popstate', notifyLocation);
        window.addEventListener('hashchange', notifyLocation);
        window.addEventListener('load', notifyLocation);
      }

      window.__SAWDAGAR_SYNC__(initialState);
      post('location-change', { href: window.location.href, title: document.title || '' });
    })();
    true;
  `;
}

function buildPortalSyncScript(state) {
  return `
    if (window.__SAWDAGAR_SYNC__) {
      window.__SAWDAGAR_SYNC__(${JSON.stringify(state)});
    }
    true;
  `;
}

function trimUrl(url) {
  return url.replace(/^https?:\/\//i, '').replace(/^www\./i, '');
}

export default function PortalScreen({ navigation, route }) {
  const { theme, themeKey } = useTheme();
  const { lang } = useLanguage();
  const { user, syncToken } = useAuth();
  const c = theme.colors;
  const webViewRef = useRef(null);

  const title = route.params?.title || 'Portal';
  const variant = route.params?.variant === 'admin' ? 'admin' : 'website';
  const initialPath = route.params?.initialPath || '/';
  const requiresAuth = Boolean(route.params?.requiresAuth);
  const allowedRoles = route.params?.allowedRoles || null;

  const [portalReady, setPortalReady] = useState(false);
  const [portalToken, setPortalToken] = useState('');
  const [currentUrl, setCurrentUrl] = useState('');
  const [currentTitle, setCurrentTitle] = useState(title);
  const [loadProgress, setLoadProgress] = useState(0);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [webError, setWebError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  const baseUrl = variant === 'admin' ? ADMIN_PORTAL_URL : WEBSITE_URL;
  const allowedPortalHosts = useMemo(() => {
    const candidates = [WEBSITE_URL, ADMIN_PORTAL_URL];
    return Array.from(new Set(candidates.map((value) => {
      try {
        return new URL(value).host;
      } catch {
        return null;
      }
    }).filter(Boolean)));
  }, []);
  const startUrl = useMemo(() => resolvePortalUrl(baseUrl, initialPath), [baseUrl, initialPath]);
  const portalState = useMemo(() => ({
    token: portalToken,
    lang,
    themeKey,
    themeMode: theme.dark ? 'dark' : 'light',
    primaryColor: c.primary,
  }), [portalToken, lang, themeKey, theme.dark, c.primary]);

  useEffect(() => {
    let active = true;

    getToken().then((token) => {
      if (!active) return;
      setPortalToken(token || '');
      setPortalReady(true);
    }).catch(() => {
      if (!active) return;
      setPortalToken('');
      setPortalReady(true);
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!portalReady || !webViewRef.current) return;
    webViewRef.current.injectJavaScript(buildPortalSyncScript(portalState));
  }, [portalReady, portalState]);

  const syncNativeToken = async (nextToken) => {
    const currentToken = await getToken();
    if ((currentToken || '') === (nextToken || '')) return;
    setPortalToken(nextToken || '');
    await syncToken(nextToken || null);
  };

  const handleMessage = async ({ nativeEvent }) => {
    try {
      const message = JSON.parse(nativeEvent.data);
      if (message.type === 'location-change') {
        setCurrentUrl(message.payload?.href || startUrl);
        setCurrentTitle(message.payload?.title || title);
      }

      if (message.type === 'auth-state') {
        await syncNativeToken(message.payload?.token || '');
      }
    } catch (error) {}
  };

  const isAllowedPortalUrl = (value) => {
    if (!value || /^about:blank$/i.test(value) || /^data:/i.test(value)) return true;
    try {
      const parsed = new URL(value);
      return parsed.protocol === 'https:' && allowedPortalHosts.includes(parsed.host);
    } catch {
      return false;
    }
  };

  const blockedByRole = allowedRoles && (!user || !allowedRoles.includes(user.role));

  if (requiresAuth && !user) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]}> 
        <EmptyState
          icon="lock-closed-outline"
          title="Sign in required"
          subtitle="This portal uses your current Sawdagar session. Sign in first, then reopen it."
          actionLabel="Open Login"
          onAction={() => navigation.navigate('Auth')}
        />
      </SafeAreaView>
    );
  }

  if (blockedByRole) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]}> 
        <EmptyState
          icon="shield-outline"
          title="Access restricted"
          subtitle={`This workspace is available to ${allowedRoles.join(', ')} accounts.`}
        />
      </SafeAreaView>
    );
  }

  if (!portalReady) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]}> 
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={c.primary} />
          <Text style={[styles.loadingText, { color: c.textSecondary }]}>Preparing portal session…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: c.card, borderBottomColor: c.border }]}> 
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerAction}>
            <Ionicons name="arrow-back" size={22} color={c.text} />
          </TouchableOpacity>

          <View style={styles.headerCopy}>
            <Text numberOfLines={1} style={[styles.headerTitle, { color: c.text }]}>{currentTitle || title}</Text>
            <Text numberOfLines={1} style={[styles.headerUrl, { color: c.textMuted }]}>{trimUrl(currentUrl || startUrl)}</Text>
          </View>

          <View style={[styles.variantBadge, { backgroundColor: variant === 'admin' ? c.secondary + '16' : c.primary + '14' }]}> 
            <Text style={[styles.variantText, { color: variant === 'admin' ? c.secondary : c.primary }]}>{variant === 'admin' ? 'Admin' : 'Website'}</Text>
          </View>
        </View>

        <View style={styles.toolbar}>
          <ToolButton icon="arrow-back-outline" onPress={() => webViewRef.current?.goBack()} disabled={!canGoBack} c={c} />
          <ToolButton icon="arrow-forward-outline" onPress={() => webViewRef.current?.goForward()} disabled={!canGoForward} c={c} />
          <ToolButton icon="refresh-outline" onPress={() => webViewRef.current?.reload()} c={c} />
          <TouchableOpacity
            onPress={() => navigation.navigate('PortalHub')}
            style={[styles.toolbarHub, { backgroundColor: c.background }]}
          >
            <Ionicons name="layers-outline" size={16} color={c.primary} />
            <Text numberOfLines={1} maxFontSizeMultiplier={1.15} style={[styles.toolbarHubText, { color: c.primary }]}>Center</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.progressTrack, { backgroundColor: c.border }]}> 
          <View style={[styles.progressBar, { backgroundColor: c.primary, width: `${Math.max(loadProgress, 0.04) * 100}%` }]} />
        </View>
      </View>

      {webError ? (
        <View style={styles.errorWrap}>
          <EmptyState
            icon="warning-outline"
            title="Portal unavailable"
            subtitle={webError}
            actionLabel="Retry"
            onAction={() => {
              setWebError(null);
              setReloadKey((value) => value + 1);
            }}
          />
        </View>
      ) : (
        <WebView
          key={`${variant}-${reloadKey}`}
          ref={webViewRef}
          source={{ uri: startUrl }}
          originWhitelist={['*']}
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
          setSupportMultipleWindows={false}
          allowsBackForwardNavigationGestures
          injectedJavaScriptBeforeContentLoaded={buildPortalBootstrapScript(portalState)}
          onMessage={handleMessage}
          onLoadStart={() => {
            setWebError(null);
            setLoadProgress(0.08);
          }}
          onLoadProgress={({ nativeEvent }) => setLoadProgress(nativeEvent.progress)}
          onNavigationStateChange={(navState) => {
            setCanGoBack(navState.canGoBack);
            setCanGoForward(navState.canGoForward);
            setCurrentUrl(navState.url);
            setCurrentTitle(navState.title || title);
          }}
          onError={({ nativeEvent }) => setWebError(nativeEvent.description || 'The portal could not be loaded.')}
          onHttpError={({ nativeEvent }) => setWebError(`Request failed with status ${nativeEvent.statusCode}.`)}
          onShouldStartLoadWithRequest={(request) => {
            if (/^(mailto:|tel:|sms:)/i.test(request.url)) {
              Linking.openURL(request.url).catch(() => {});
              return false;
            }

            if (!isAllowedPortalUrl(request.url)) {
              if (/^https?:\/\//i.test(request.url)) {
                Linking.openURL(request.url).catch(() => {});
              }
              return false;
            }

            return true;
          }}
        />
      )}
    </SafeAreaView>
  );
}

function ToolButton({ icon, onPress, disabled, c }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[styles.toolButton, { backgroundColor: c.background, opacity: disabled ? 0.38 : 1 }]}
    >
      <Ionicons name={icon} size={18} color={c.text} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  loadingText: { fontSize: fontSize.base, marginTop: spacing.base },
  header: { borderBottomWidth: 1 },
  headerTop: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.base, paddingTop: spacing.base, paddingBottom: spacing.sm },
  headerAction: { width: 44, height: 44, borderRadius: borderRadius.full, justifyContent: 'center', alignItems: 'center' },
  headerCopy: { flex: 1, paddingHorizontal: spacing.sm },
  headerTitle: { fontSize: fontSize.base, fontWeight: fontWeight.heavy },
  headerUrl: { fontSize: fontSize.xs, marginTop: 4 },
  variantBadge: { borderRadius: borderRadius.full, paddingHorizontal: 10, paddingVertical: 6 },
  variantText: { fontSize: fontSize.xs, lineHeight: 16, fontWeight: fontWeight.bold, letterSpacing: 0.6, includeFontPadding: false, textAlignVertical: 'center' },
  toolbar: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: spacing.base, paddingBottom: spacing.base },
  toolButton: { width: 44, height: 44, borderRadius: borderRadius.full, justifyContent: 'center', alignItems: 'center' },
  toolbarHub: { minHeight: 44, marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: borderRadius.full },
  toolbarHubText: { fontSize: fontSize.xs, lineHeight: 16, fontWeight: fontWeight.heavy, letterSpacing: 0.5, includeFontPadding: false, textAlignVertical: 'center' },
  progressTrack: { height: 3, width: '100%' },
  progressBar: { height: '100%' },
  errorWrap: { flex: 1 },
});
