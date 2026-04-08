import { SignJWT, jwtVerify, type JWTPayload } from "jose";

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET environment variable is required but not set");
  return new TextEncoder().encode(secret);
}
const JWT_EXPIRY = "8h";

export async function signJwt(username: string): Promise<string> {
  return new SignJWT({ username })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRY)
    .sign(getJwtSecret());
}

export async function verifyJwt(
  token: string
): Promise<(JWTPayload & { username: string }) | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    if (typeof (payload as Record<string, unknown>).username !== "string") return null;
    return payload as JWTPayload & { username: string };
  } catch {
    return null;
  }
}
