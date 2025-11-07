import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth.server";

export async function GET() {
  // Require authentication in production
  if (process.env.NODE_ENV === "production") {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    // Test database connection
    await prisma.$connect();
    
    // Try a simple query
    const userCount = await prisma.user.count();
    const accountCount = await prisma.account.count();
    const sessionCount = await prisma.session.count();

    return NextResponse.json({
      status: "success",
      message: "Database connection successful",
      tables: {
        users: userCount,
        accounts: accountCount,
        sessions: sessionCount,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Database connection error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Database connection failed",
        error: error.message,
        code: error.code,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
