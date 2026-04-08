import { SignJWT, jwtVerify, type JWTPayload } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "163musicpro-fallback-secret-change-me"
);
const JWT_EXPIRY = "8h";

export async function signJwt(username: string): Promise<string> {
  return new SignJWT({ username })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRY)
    .sign(JWT_SECRET);
}

export async function verifyJwt(
  token: string
): Promise<(JWTPayload & { username: string }) | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (typeof (payload as Record<string, unknown>).username !== "string") return null;
    return payload as JWTPayload & { username: string };
  } catch {
    return null;
  }
}
