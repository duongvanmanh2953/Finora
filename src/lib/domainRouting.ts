/**
 * Finora / Tích Sản — Multi-Subdomain & Environment Routing Resolver
 *
 * Hỗ trợ kiến trúc 3 phân hệ độc lập:
 *  1. Landing Page : tichsan.site (hoặc chạy port riêng 3001 ở local / preview)
 *  2. Ứng dụng chính : app.tichsan.site (hoặc chạy port 5173 / default)
 *  3. Xác thực & Đăng nhập : auth.tichsan.site (hoặc port 5174)
 */

export type AppEnvironmentMode = 'landing' | 'app' | 'auth' | 'unified';

const SESSION_COOKIE_NAME = 'tichsan_session_user';
const TOKEN_COOKIE_NAME = 'tichsan_session_token';

/**
 * Xác định phân hệ hiện tại dựa trên Hostname, Cổng (Port) hoặc Biến môi trường VITE_APP_MODE
 */
export function getAppEnvironmentMode(): AppEnvironmentMode {
  if (typeof window === 'undefined') return 'unified';

  const windowMode = (window as any).__FINORA_MODE__;
  if (windowMode === 'landing' || windowMode === 'auth' || windowMode === 'app') {
    return windowMode;
  }

  const metaEnv = (import.meta as unknown as { env?: Record<string, string | undefined> })?.env;
  const envMode = metaEnv?.VITE_APP_MODE;
  if (envMode === 'landing') return 'landing';
  if (envMode === 'auth') return 'auth';
  if (envMode === 'app') return 'app';

  const { hostname, port } = window.location;

  // 1. Nhận diện Landing Page:
  // - Domain chính: tichsan.site, www.tichsan.site
  // - Port riêng: 5175 (Dev) hoặc 7001 (Docker/Production)
  if (
    hostname === 'tichsan.site' ||
    hostname === 'www.tichsan.site' ||
    port === '5175' ||
    port === '7001'
  ) {
    return 'landing';
  }

  // 2. Nhận diện Phân hệ Auth:
  // - Subdomain: auth.tichsan.site
  // - Port riêng: 5174 (Dev) hoặc 7002
  if (hostname === 'auth.tichsan.site' || port === '5174' || port === '7002') {
    return 'auth';
  }

  // 3. Nhận diện App:
  // - Subdomain: app.tichsan.site
  // - Port riêng: 5173 (Dev) hoặc 7000 (Docker)
  if (hostname === 'app.tichsan.site' || port === '7000') {
    return 'app';
  }

  // Chế độ Unified (mặc định ở localhost hỗ trợ tất cả các route)
  return 'unified';
}

export const isLandingHost = (): boolean => getAppEnvironmentMode() === 'landing';
export const isAuthHost = (): boolean => getAppEnvironmentMode() === 'auth';
export const isAppHost = (): boolean => getAppEnvironmentMode() === 'app';

/**
 * Sinh URL điều hướng an toàn giữa các Subdomain hoặc Fallback Localhost
 */
export function getLandingUrl(): string {
  if (typeof window === 'undefined') return '/';
  const { hostname, protocol } = window.location;

  if (hostname.endsWith('tichsan.site')) {
    return `${protocol}//tichsan.site/`;
  }
  // Nếu đang ở localhost khác port landing (5175 hoặc 7001)
  if (window.location.port !== '5175' && window.location.port !== '7001') {
    return '/landing';
  }
  return '/';
}

export function getAuthUrl(mode: 'login' | 'register' | 'forgot' | 'reset' = 'login'): string {
  if (typeof window === 'undefined') return `/auth/${mode}`;
  const { hostname, protocol, port } = window.location;

  if (hostname.endsWith('tichsan.site')) {
    return `${protocol}//auth.tichsan.site/${mode}`;
  }
  if (port === '7000' || port === '7001') {
    return `http://${hostname}:7002/${mode}`;
  }
  if (port === '5173' || port === '5175') {
    return `http://${hostname}:5174/${mode}`;
  }
  return `/auth/${mode}`;
}

export function getAppUrl(path = '/'): string {
  if (typeof window === 'undefined') return path;
  const { hostname, protocol, port } = window.location;

  if (hostname.endsWith('tichsan.site')) {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${protocol}//app.tichsan.site${cleanPath}`;
  }
  if (port === '5175' || port === '5174') {
    return `http://${hostname}:5173${path.startsWith('/') ? path : `/${path}`}`;
  }
  if (port === '7001' || port === '7002') {
    return `http://${hostname}:7000${path.startsWith('/') ? path : `/${path}`}`;
  }
  return path;
}

/**
 * Điều hướng thông minh đến Auth (Login/Register) tương thích cả Subdomain Production & Dev Multi-Port
 */
export function navigateToAuth(mode: 'login' | 'register' = 'login', navigateFallback?: (path: string) => void, params?: Record<string, string>): void {
  if (typeof window === 'undefined') return;
  const envMode = getAppEnvironmentMode();
  const queryStr = params ? '?' + new URLSearchParams(params).toString() : '';

  if (envMode === 'landing' || envMode === 'app') {
    const { hostname, port } = window.location;
    if (hostname.endsWith('tichsan.site')) {
      window.location.href = `https://auth.tichsan.site/${mode}${queryStr}`;
      return;
    }
    // Ở dev local: chuyển sang Auth ở port 5174
    if (port === '5175' || port === '5173') {
      window.location.href = `http://${hostname}:5174/${mode}${queryStr}`;
      return;
    }
    // Ở Docker: chuyển sang Auth ở port 7002
    if (port === '7001' || port === '7000') {
      window.location.href = `http://${hostname}:7002/${mode}${queryStr}`;
      return;
    }
  }

  if (navigateFallback) {
    navigateFallback(`/auth/${mode}${queryStr}`);
  } else {
    window.location.href = `/auth/${mode}${queryStr}`;
  }
}

/**
 * Điều hướng thông minh đến App chính tương thích cả Subdomain Production & Dev Multi-Port
 */
export function navigateToApp(path = '/', navigateFallback?: (path: string) => void): void {
  if (typeof window === 'undefined') return;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const { hostname, port } = window.location;

  // 1. Môi trường Production Subdomain tichsan.site
  if (hostname.endsWith('tichsan.site')) {
    if (hostname !== 'app.tichsan.site') {
      window.location.href = `https://app.tichsan.site${cleanPath}`;
      return;
    }
  }

  const buildAuthQuery = () => {
    try {
      const rawUser = localStorage.getItem('finora:auth-user');
      const token = localStorage.getItem('finora:auth-token');
      if (rawUser) {
        const q = new URLSearchParams({ session: rawUser });
        if (token) q.set('token', token);
        return `?${q.toString()}`;
      }
    } catch {}
    return '';
  };

  // 2. Môi trường Dev Multi-Port (5175/5174 -> 5173)
  if (port === '5175' || port === '5174') {
    if (navigateFallback) {
      navigateFallback(cleanPath);
      return;
    }
    const authQuery = buildAuthQuery();
    window.location.href = `http://${hostname}:5173${cleanPath}${authQuery}`;
    return;
  }

  // 3. Môi trường Docker Multi-Port (7001/7002 -> 7000)
  if (port === '7001' || port === '7002') {
    if (navigateFallback) {
      navigateFallback(cleanPath);
      return;
    }
    const authQuery = buildAuthQuery();
    window.location.href = `http://${hostname}:7000${cleanPath}${authQuery}`;
    return;
  }

  // 4. Môi trường Unified (SPA trong cùng host/port)
  if (navigateFallback) {
    navigateFallback(cleanPath);
  } else {
    window.location.href = cleanPath;
  }
}

/**
 * Lưu thông tin phiên đăng nhập dùng chung cho tất cả các subdomain (.tichsan.site)
 */
export function setCrossSubdomainUserSession(userJson: string, token?: string | null): void {
  if (typeof window === 'undefined') return;

  try {
    const { hostname } = window.location;
    const isTichSanDomain = hostname.endsWith('tichsan.site');
    const domainAttribute = isTichSanDomain ? '; domain=.tichsan.site' : '';
    const secureAttribute = window.location.protocol === 'https:' ? '; Secure' : '';

    // Cookie lưu trữ tối đa 120 ngày, SameSite=Lax cho phép chuyển hướng giữa các subdomain
    const maxAge = 120 * 24 * 60 * 60;
    document.cookie = `${SESSION_COOKIE_NAME}=${encodeURIComponent(userJson)}; path=/; max-age=${maxAge}; SameSite=Lax${domainAttribute}${secureAttribute}`;
    if (token) {
      document.cookie = `${TOKEN_COOKIE_NAME}=${encodeURIComponent(token)}; path=/; max-age=${maxAge}; SameSite=Lax${domainAttribute}${secureAttribute}`;
    }
  } catch (err) {
    console.warn('[DomainRouting] Không thể ghi cookie cross-subdomain:', err);
  }
}

/**
 * Đọc thông tin phiên đăng nhập dùng chung từ cookie .tichsan.site (nếu có)
 */
export function getCrossSubdomainUserSession(): { user: string | null; token: string | null } {
  if (typeof window === 'undefined') return { user: null, token: null };

  let user: string | null = null;
  let token: string | null = null;

  try {
    const userMatch = document.cookie.match(new RegExp(`(?:^|; )${SESSION_COOKIE_NAME}=([^;]*)`));
    if (userMatch && userMatch[1]) {
      user = decodeURIComponent(userMatch[1]);
    }
    const tokenMatch = document.cookie.match(new RegExp(`(?:^|; )${TOKEN_COOKIE_NAME}=([^;]*)`));
    if (tokenMatch && tokenMatch[1]) {
      token = decodeURIComponent(tokenMatch[1]);
    }
  } catch (err) {
    console.warn('[DomainRouting] Không thể đọc cookie cross-subdomain:', err);
  }
  return { user, token };
}

/**
 * Xóa session cookie cross-subdomain khi đăng xuất
 */
export function clearCrossSubdomainUserSession(): void {
  if (typeof window === 'undefined') return;

  try {
    const { hostname } = window.location;
    const isTichSanDomain = hostname.endsWith('tichsan.site');
    const exp = 'expires=Thu, 01 Jan 1970 00:00:00 GMT';
    const cookieNames = [
      SESSION_COOKIE_NAME,
      TOKEN_COOKIE_NAME,
      'tichsan_token',
      'tichsan_refresh_token',
      'tichsan_session_user',
      'tichsan_session_token',
      'finora_token'
    ];

    for (const name of cookieNames) {
      // 1. Host-only
      document.cookie = `${name}=; path=/; ${exp}; SameSite=Lax`;
      document.cookie = `${name}=; path=/; ${exp}; SameSite=Lax; Secure`;
      // 2. Wildcard .tichsan.site
      if (isTichSanDomain) {
        document.cookie = `${name}=; path=/; domain=.tichsan.site; ${exp}; SameSite=Lax`;
        document.cookie = `${name}=; path=/; domain=.tichsan.site; ${exp}; SameSite=Lax; Secure`;
      }
    }
  } catch (err) {
    console.warn('[DomainRouting] Không thể xóa cookie cross-subdomain:', err);
  }
}
