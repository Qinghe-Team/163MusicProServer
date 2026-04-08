"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./login.module.css";

async function encryptWithPublicKey(publicKeyPem: string, text: string): Promise<string> {
  // Use Web Crypto API (SubtleCrypto) to encrypt with RSA-OAEP
  const pemContents = publicKeyPem
    .replace(/-----BEGIN RSA PUBLIC KEY-----/, "")
    .replace(/-----END RSA PUBLIC KEY-----/, "")
    .replace(/\s/g, "");

  const binaryDer = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));

  // PKCS#1 public key needs to be imported as SPKI. We need to convert it.
  // Node generates PKCS#1 format; browsers expect SPKI. Use a tiny SPKI wrapper.
  const spkiDer = pkcs1ToSpki(binaryDer);

  const cryptoKey = await crypto.subtle.importKey(
    "spki",
    spkiDer.buffer as ArrayBuffer,
    { name: "RSA-OAEP", hash: "SHA-256" },
    false,
    ["encrypt"]
  );

  const encoded = new TextEncoder().encode(text);
  const encrypted = await crypto.subtle.encrypt({ name: "RSA-OAEP" }, cryptoKey, encoded);
  return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
}

// Wrap a PKCS#1 RSA public key DER into a SPKI DER structure
function pkcs1ToSpki(pkcs1Der: Uint8Array): Uint8Array {
  // SPKI wraps PKCS#1 with an AlgorithmIdentifier ASN.1 header
  const algorithmIdentifier = new Uint8Array([
    0x30, 0x0d, // SEQUENCE
    0x06, 0x09, // OID tag + length
    0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01, // rsaEncryption OID
    0x05, 0x00, // NULL
  ]);

  // BIT STRING wrapping: 0x03 tag + length + 0x00 (no unused bits)
  const bitStringHeader = encodeDerLength(pkcs1Der.length + 1);
  const bitString = new Uint8Array([0x03, ...bitStringHeader, 0x00, ...pkcs1Der]);

  const spkiBody = new Uint8Array([...algorithmIdentifier, ...bitString]);
  const spkiHeader = encodeDerLength(spkiBody.length);

  return new Uint8Array([0x30, ...spkiHeader, ...spkiBody]);
}

function encodeDerLength(len: number): Uint8Array {
  if (len < 0x80) return new Uint8Array([len]);
  if (len < 0x100) return new Uint8Array([0x81, len]);
  return new Uint8Array([0x82, (len >> 8) & 0xff, len & 0xff]);
}

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // If already logged in, redirect to dashboard
  useEffect(() => {
    const token = sessionStorage.getItem("dash_token");
    if (token) router.replace("/dash");
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 1. Fetch RSA public key
      const pkRes = await fetch("/dash/api/auth/pubkey");
      if (!pkRes.ok) throw new Error("Failed to fetch public key");
      const pkData = await pkRes.json();
      const publicKey: string = pkData.data.publicKey;

      // 2. Encrypt credentials
      const encryptedUsername = await encryptWithPublicKey(publicKey, username);
      const encryptedPassword = await encryptWithPublicKey(publicKey, password);

      // 3. Login
      const loginRes = await fetch("/dash/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ encryptedUsername, encryptedPassword }),
      });
      const loginData = await loginRes.json();

      if (loginData.code !== 200) {
        setError(loginData.message ?? "Login failed");
        return;
      }

      sessionStorage.setItem("dash_token", loginData.data.token);
      router.push("/dash");
    } catch (err) {
      console.error(err);
      setError("Login error, please try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>♫</div>
        <h1 className={styles.title}>管理面板</h1>
        <p className={styles.subtitle}>163MusicPro</p>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="username">用户名</label>
            <input
              id="username"
              className={styles.input}
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="password">密码</label>
            <input
              id="password"
              className={styles.input}
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          {error && <p className={styles.error}>{error}</p>}
          <button className={styles.btn} type="submit" disabled={loading}>
            {loading ? "登录中…" : "登录"}
          </button>
        </form>
      </div>
    </div>
  );
}
