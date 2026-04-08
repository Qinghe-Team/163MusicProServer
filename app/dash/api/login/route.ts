import { NextRequest, NextResponse } from "next/server";
import { rsaDecrypt, signJwt } from "@/lib/auth";

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ code: 400, message: "Invalid JSON body" }, { status: 400 });
  }

  const { encryptedUsername, encryptedPassword } = body as {
    encryptedUsername?: string;
    encryptedPassword?: string;
  };

  if (typeof encryptedUsername !== "string" || typeof encryptedPassword !== "string") {
    return NextResponse.json(
      { code: 400, message: "encryptedUsername and encryptedPassword are required" },
      { status: 400 }
    );
  }

  let username: string;
  let password: string;
  try {
    username = rsaDecrypt(encryptedUsername);
    password = rsaDecrypt(encryptedPassword);
  } catch {
    return NextResponse.json(
      { code: 400, message: "Failed to decrypt credentials" },
      { status: 400 }
    );
  }

  const expectedUsername = process.env.ADMIN_USERNAME;
  const expectedPassword = process.env.ADMIN_PASSWORD;

  if (!expectedUsername || !expectedPassword) {
    return NextResponse.json(
      { code: 500, message: "Admin credentials not configured" },
      { status: 500 }
    );
  }

  if (username !== expectedUsername || password !== expectedPassword) {
    return NextResponse.json(
      { code: 401, message: "Invalid username or password" },
      { status: 401 }
    );
  }

  const token = await signJwt(username);
  return NextResponse.json({ code: 200, data: { token } });
}
