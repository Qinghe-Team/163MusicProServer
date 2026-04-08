import { NextRequest, NextResponse } from "next/server";
import { verifyJwt } from "@/lib/jwt";

export async function proxy(req: NextRequest): Promise<NextResponse> {
  const { pathname } = req.nextUrl;

  // Protect all /dash/api/* routes except the login and pubkey endpoints
  if (pathname.startsWith("/dash/api/")) {
    const isPublic =
      pathname === "/dash/api/login" ||
      pathname.startsWith("/dash/api/auth/");

    if (!isPublic) {
      const authHeader = req.headers.get("authorization");
      const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

      if (!token) {
        return NextResponse.json(
          { code: 401, message: "Unauthorized" },
          { status: 401 }
        );
      }

      const payload = await verifyJwt(token);
      if (!payload) {
        return NextResponse.json(
          { code: 401, message: "Invalid or expired token" },
          { status: 401 }
        );
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dash/api/:path*"],
};
