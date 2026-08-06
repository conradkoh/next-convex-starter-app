export type OAuthFlowType = 'login' | 'connect';

function shouldUseGoogleOAuthRedirect(
  userAgent: string = typeof navigator !== 'undefined' ? navigator.userAgent : ''
): boolean {
  const isIOS = /iPad|iPhone|iPod/.test(userAgent);
  const isDesktopSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
  return isIOS || isDesktopSafari;
}

export function createOAuthState(
  flowType: OAuthFlowType,
  requestId: string,
  returnTo?: string
): string {
  return encodeURIComponent(
    JSON.stringify({
      flowType,
      requestId,
      version: 'v1',
      ...(returnTo ? { returnTo } : {}),
    })
  );
}

function parseOAuthStateReturnTo(encodedState: string): string | undefined {
  try {
    const parsed = JSON.parse(decodeURIComponent(encodedState)) as { returnTo?: string };
    return typeof parsed.returnTo === 'string' ? parsed.returnTo : undefined;
  } catch {
    return undefined;
  }
}

function getDefaultOAuthReturnTo(flowType: OAuthFlowType): string {
  return flowType === 'connect' ? '/app/profile' : '/login';
}

function parseOAuthStateFlowType(encodedState: string): OAuthFlowType | undefined {
  try {
    const parsed = JSON.parse(decodeURIComponent(encodedState)) as { flowType?: OAuthFlowType };
    return parsed.flowType;
  } catch {
    return undefined;
  }
}

// fallow-ignore-next-line unused-export
export function getOAuthCallbackReturnTo(
  encodedState: string | undefined,
  flowType: OAuthFlowType = 'login'
): string | undefined {
  if (!encodedState) return undefined;

  const returnTo = parseOAuthStateReturnTo(encodedState);
  if (returnTo) return returnTo;

  return getDefaultOAuthReturnTo(parseOAuthStateFlowType(encodedState) ?? flowType);
}

export function buildGoogleOAuthUrl(params: {
  clientId: string;
  redirectUri: string;
  state: string;
}): string {
  return `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
    client_id: params.clientId,
    redirect_uri: params.redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state: params.state,
    prompt: 'consent',
    access_type: 'offline',
  })}`;
}

const GOOGLE_OAUTH_POPUP_FEATURES =
  'width=500,height=600,scrollbars=yes,resizable=yes,status=yes,location=yes,toolbar=no,menubar=no';

const GOOGLE_OAUTH_POPUP_TIMEOUT_MS = 15 * 60 * 1000;

export type GoogleOAuthLaunchMode = 'popup' | 'redirect';

export interface LaunchGoogleOAuthOptions {
  authUrl: string;
  popupName: string;
  onPopupClosed?: () => void;
  popupPollIntervalMs?: number;
  popupTimeoutMs?: number;
  onPopupTimeout?: () => void;
}

export function launchGoogleOAuth(options: LaunchGoogleOAuthOptions): GoogleOAuthLaunchMode {
  const {
    authUrl,
    popupName,
    onPopupClosed,
    popupPollIntervalMs = 1000,
    popupTimeoutMs = GOOGLE_OAUTH_POPUP_TIMEOUT_MS,
    onPopupTimeout,
  } = options;

  if (shouldUseGoogleOAuthRedirect()) {
    window.location.assign(authUrl);
    return 'redirect';
  }

  const popup = window.open(authUrl, popupName, GOOGLE_OAUTH_POPUP_FEATURES);
  if (!popup) {
    window.location.assign(authUrl);
    return 'redirect';
  }

  const pollId = setInterval(() => {
    if (popup.closed) {
      clearInterval(pollId);
      onPopupClosed?.();
    }
  }, popupPollIntervalMs);

  if (onPopupTimeout) {
    setTimeout(() => {
      clearInterval(pollId);
      if (!popup.closed) popup.close();
      onPopupTimeout();
    }, popupTimeoutMs);
  }

  return 'popup';
}
