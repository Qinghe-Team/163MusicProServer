import crypto from "crypto";

// Re-export JWT utilities (Edge-compatible, implemented in lib/jwt.ts)
export { signJwt, verifyJwt } from "@/lib/jwt";

// ---------------------------------------------------------------------------
// RSA key pair (in-memory, generated once per server instance)
// Used to let clients encrypt credentials before sending over the wire.
// ---------------------------------------------------------------------------
let rsaKeyPair: { publicKey: crypto.KeyObject; privateKey: crypto.KeyObject } | null = null;

function getRsaKeyPair() {
  if (!rsaKeyPair) {
    const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
      modulusLength: 2048,
    });
    rsaKeyPair = { publicKey, privateKey };
  }
  return rsaKeyPair;
}

export function getRsaPublicKeyPem(): string {
  return getRsaKeyPair().publicKey.export({ type: "pkcs1", format: "pem" }) as string;
}

export function rsaDecrypt(encryptedBase64: string): string {
  const buffer = Buffer.from(encryptedBase64, "base64");
  const decrypted = crypto.privateDecrypt(
    {
      key: getRsaKeyPair().privateKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: "sha256",
    },
    buffer
  );
  return decrypted.toString("utf8");
}
