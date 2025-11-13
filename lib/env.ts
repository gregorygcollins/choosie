type RequirementStage = "always" | "production" | "optional";

type EnvRequirement = {
  key: string;
  stage: RequirementStage;
  description: string;
  alternatives?: string[];
  mask?: boolean;
};

const REQUIREMENTS: EnvRequirement[] = [
  { key: "DATABASE_URL", stage: "always", description: "Primary database connection string", mask: true },
  { key: "NEXTAUTH_SECRET", stage: "always", description: "NextAuth session secret", mask: true },
  { key: "NEXTAUTH_URL", stage: "production", description: "Canonical site URL for auth callbacks" },
  { key: "NEXT_PUBLIC_SITE_URL", stage: "production", description: "Public site URL for redirects" },
  { key: "ALLOWED_ORIGINS", stage: "production", description: "Comma-separated list of allowed Origins" },
  { key: "GOOGLE_CLIENT_ID", stage: "production", description: "Google OAuth client id", mask: true },
  { key: "GOOGLE_CLIENT_SECRET", stage: "production", description: "Google OAuth client secret", mask: true },
  { key: "GITHUB_CLIENT_ID", stage: "production", description: "GitHub OAuth client id", mask: true },
  { key: "GITHUB_CLIENT_SECRET", stage: "production", description: "GitHub OAuth client secret", mask: true },
  { key: "STRIPE_SECRET_KEY", stage: "production", description: "Stripe secret key", mask: true },
  {
    key: "STRIPE_PRICE_ID",
    stage: "production",
    description: "Stripe recurring price identifier",
    alternatives: ["STRIPE_PRICE_LOOKUP_KEY", "STRIPE_PRODUCT_ID"],
  },
  { key: "STRIPE_WEBHOOK_SECRET", stage: "production", description: "Stripe webhook signing secret", mask: true },
  { key: "UPSTASH_REDIS_REST_URL", stage: "production", description: "Upstash Redis REST endpoint" },
  { key: "UPSTASH_REDIS_REST_TOKEN", stage: "production", description: "Upstash Redis REST token", mask: true },
  { key: "TMDB_API_KEY", stage: "optional", description: "TMDB server API key", mask: true },
  { key: "SPOTIFY_CLIENT_ID", stage: "optional", description: "Spotify client id", mask: true },
  { key: "SPOTIFY_CLIENT_SECRET", stage: "optional", description: "Spotify client secret", mask: true },
  { key: "SPOONACULAR_API_KEY", stage: "optional", description: "Spoonacular API key", mask: true },
  { key: "GOOGLE_BOOKS_API_KEY", stage: "optional", description: "Google Books API key", mask: true },
];

export type EnvAuditEntry = {
  key: string;
  description: string;
  stage: RequirementStage;
  requiredNow: boolean;
  present: boolean;
  usingAlternative?: string;
  mask?: boolean;
  value?: string | null;
};

export type EnvAuditResult = {
  entries: EnvAuditEntry[];
  missing: string[];
};

const maskValue = (value: string): string => {
  if (value.length <= 6) return "*".repeat(value.length);
  const start = value.slice(0, 3);
  const end = value.slice(-2);
  return `${start}***${end}`;
};

const hasValue = (key: string): boolean => {
  const value = process.env[key];
  return typeof value === "string" && value.trim().length > 0;
};

export function auditEnv(options?: { throwOnError?: boolean }): EnvAuditResult {
  const isProd = process.env.NODE_ENV === "production";
  const shouldThrow = options?.throwOnError ?? isProd;

  const entries: EnvAuditEntry[] = REQUIREMENTS.map((req) => {
    const requiredNow = req.stage === "always" || (req.stage === "production" && isProd);
    const present = hasValue(req.key) || (req.alternatives?.some((alt) => hasValue(alt)) ?? false);
    const usingAlternative = !hasValue(req.key)
      ? req.alternatives?.find((alt) => hasValue(alt))
      : undefined;
    const rawValue = hasValue(req.key) ? (process.env[req.key] as string) : undefined;

    return {
      key: req.key,
      description: req.description,
      stage: req.stage,
      requiredNow,
      present,
      usingAlternative,
      mask: req.mask,
      value: rawValue
        ? req.mask
          ? maskValue(rawValue)
          : rawValue
        : usingAlternative
          ? usingAlternative
          : null,
    };
  });

  const missing = entries
    .filter((entry) => entry.requiredNow && !entry.present)
    .map((entry) => entry.key);

  if (missing.length > 0 && shouldThrow) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  return { entries, missing };
}

export function listAllowedOrigins(): string[] {
  const envOrigins = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const vercelUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined;
  const local = "http://localhost:3000";
  return [...envOrigins, siteUrl, vercelUrl, local].filter(Boolean) as string[];
}

export function maskEnvValue(key: string): string | null {
  const value = process.env[key];
  if (!value) return null;
  return maskValue(value);
}

if (process.env.NODE_ENV === "production") {
  auditEnv({ throwOnError: true });
}
