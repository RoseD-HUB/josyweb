export interface CspOptions {
  isDev: boolean;
  includeFrameAncestors: boolean;
  allowAiStudioPreview?: boolean;
}

export const PRODUCTION_PRIMARY_ORIGIN = 'https://josyweb.onrender.com';

export function getStrictAllowedOrigins(isProd: boolean): Set<string> {
  const allowed = new Set<string>([PRODUCTION_PRIMARY_ORIGIN]);

  if (!isProd) {
    allowed.add('http://localhost:3000');
    allowed.add('http://localhost:5173');
  }

  const rawEnv = [process.env.APP_URL, process.env.ALLOWED_ORIGINS]
    .filter(Boolean)
    .join(',');

  for (const entry of rawEnv.split(',')) {
    const trimmed = entry.trim().replace(/\/+$/, '');
    if (trimmed.startsWith('https://') || (!isProd && trimmed.startsWith('http://'))) {
      allowed.add(trimmed);
    }
  }

  return allowed;
}

export function buildContentSecurityPolicy(options: CspOptions): string {
  const scriptSrc = options.isDev
    ? "'self' 'unsafe-inline' https://apis.google.com https://accounts.google.com"
    : "'self' https://apis.google.com https://accounts.google.com";

  const directives: string[] = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "form-action 'self'",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self'",
    "img-src 'self' data: blob: https://lh3.googleusercontent.com",
    "connect-src 'self' https://firestore.googleapis.com wss://firestore.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://www.googleapis.com https://apis.google.com https://seismic-asset-501dl.firebaseapp.com",
    "frame-src 'self' https://seismic-asset-501dl.firebaseapp.com https://accounts.google.com",
  ];

  if (options.includeFrameAncestors) {
    if (options.allowAiStudioPreview) {
      directives.push(
        "frame-ancestors 'self' https://aistudio.google.com https://*.google.com https://*.googleusercontent.com"
      );
    } else {
      directives.push("frame-ancestors 'none'");
    }
  }

  if (!options.isDev && options.includeFrameAncestors) {
    directives.push('upgrade-insecure-requests');
  }

  return directives.join('; ');
}
