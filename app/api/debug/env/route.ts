import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth.server";
import { auditEnv, listAllowedOrigins } from "@/lib/env";

export async function GET(req: NextRequest) {
  // Require authentication in production
  if (process.env.NODE_ENV === "production") {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const requestOrigin =
    req.headers.get("origin") ||
    (req.headers.get("referer") ? new URL(req.headers.get("referer") as string).origin : "");

  const audit = auditEnv({ throwOnError: false });

  const variables = audit.entries.reduce<Record<string, string>>((acc, entry) => {
    let status: string;
    if (entry.present) {
      status = entry.usingAlternative
        ? `✓ Using ${entry.usingAlternative}`
        : `✓ ${entry.value ?? "Set"}`;
    } else {
      status = "✗ Missing";
    }
    acc[entry.key] = status;
    return acc;
  }, {});

  const allowedOrigins = listAllowedOrigins();

  return NextResponse.json({
    message: "Environment Variable Check",
    variables,
    missing: audit.missing,
    requestOrigin: requestOrigin || "(no origin)",
    allowedOrigins,
    timestamp: new Date().toISOString(),
  });
}
