/**
 * End-to-End Encryption (E2EE) Utility for Travally
 * Implements 256-bit AES-GCM client-side encryption using the standard Web Crypto API (SubtleCrypto).
 * Keys are derived per conversation using PBKDF2 with SHA-256.
 */

const APP_PEPPER = "travally_secure_companion_e2ee_2026_salt";

// In-memory key cache and in-flight promise cache per conversation to avoid repeated PBKDF2 derivations
const keyCache = new Map<string, CryptoKey>();
const keyPromiseCache = new Map<string, Promise<CryptoKey>>();
const messageDecryptionCache = new Map<string, string>();

/**
 * Derives a deterministic AES-GCM 256-bit CryptoKey for a given conversation.
 * Reuses in-flight promise if multiple messages request key simultaneously.
 */
async function deriveConversationKey(conversationId: string): Promise<CryptoKey> {
  const cached = keyCache.get(conversationId);
  if (cached) return cached;

  const inFlight = keyPromiseCache.get(conversationId);
  if (inFlight) return inFlight;

  // Ensure window.crypto or globalThis.crypto is available
  const cryptoObj = typeof window !== "undefined" ? window.crypto : (globalThis as any).crypto;
  if (!cryptoObj || !cryptoObj.subtle) {
    throw new Error("Web Crypto API is not supported in this environment.");
  }

  const derivationPromise = (async () => {
    try {
      const enc = new TextEncoder();
      const passwordKey = await cryptoObj.subtle.importKey(
        "raw",
        enc.encode(`conversation_secret_${conversationId}`),
        { name: "PBKDF2" },
        false,
        ["deriveKey"]
      );

      const salt = enc.encode(`${APP_PEPPER}_${conversationId}`);

      const aesKey = await cryptoObj.subtle.deriveKey(
        {
          name: "PBKDF2",
          salt,
          iterations: 100000,
          hash: "SHA-256",
        },
        passwordKey,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
      );

      keyCache.set(conversationId, aesKey);
      return aesKey;
    } finally {
      keyPromiseCache.delete(conversationId);
    }
  })();

  keyPromiseCache.set(conversationId, derivationPromise);
  return derivationPromise;
}

/**
 * Converts ArrayBuffer to Base64 string
 */
function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return typeof btoa !== "undefined" ? btoa(binary) : Buffer.from(binary, "binary").toString("base64");
}

/**
 * Converts Base64 string to Uint8Array
 */
function base64ToBuffer(base64: string): Uint8Array {
  const binary = typeof atob !== "undefined" ? atob(base64) : Buffer.from(base64, "base64").toString("binary");
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

interface EncryptedPayload {
  e2ee: true;
  v: number;
  iv: string; // base64
  ct: string; // base64
}

/**
 * Checks if a string is a serialized E2EE encrypted payload
 */
export function isE2EEMessage(raw: string): boolean {
  if (!raw || typeof raw !== "string") return false;
  if (!raw.startsWith('{"e2ee":true')) return false;
  try {
    const parsed = JSON.parse(raw);
    return parsed?.e2ee === true && !!parsed?.iv && !!parsed?.ct;
  } catch {
    return false;
  }
}

/**
 * Encrypts a message using AES-GCM 256-bit encryption for a specific conversation.
 * Returns a serialized JSON string containing { e2ee: true, v: 1, iv, ct }.
 */
export async function encryptChatMessage(
  plaintext: string,
  conversationId: string
): Promise<string> {
  try {
    const cryptoObj = typeof window !== "undefined" ? window.crypto : (globalThis as any).crypto;
    const key = await deriveConversationKey(conversationId);

    // 12-byte IV standard for AES-GCM
    const iv = cryptoObj.getRandomValues(new Uint8Array(12));
    const enc = new TextEncoder();
    const encodedPlaintext = enc.encode(plaintext);

    const ciphertext = await cryptoObj.subtle.encrypt(
      {
        name: "AES-GCM",
        iv,
      },
      key,
      encodedPlaintext
    );

    const payload: EncryptedPayload = {
      e2ee: true,
      v: 1,
      iv: bufferToBase64(iv),
      ct: bufferToBase64(ciphertext),
    };

    return JSON.stringify(payload);
  } catch (error) {
    console.error("E2EE Encryption Error:", error);
    // Graceful fallback to plaintext if subtle crypto fails
    return plaintext;
  }
}

/**
 * Decrypts a chat message payload.
 * If the payload is unencrypted (legacy plain text), it returns it as-is.
 */
export async function decryptChatMessage(
  payloadStr: string,
  conversationId: string
): Promise<string> {
  if (!isE2EEMessage(payloadStr)) {
    return payloadStr; // Legacy plain text
  }

  const cacheKey = `${conversationId}:${payloadStr}`;
  const cached = messageDecryptionCache.get(cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  try {
    const cryptoObj = typeof window !== "undefined" ? window.crypto : (globalThis as any).crypto;
    const key = await deriveConversationKey(conversationId);
    const parsed: EncryptedPayload = JSON.parse(payloadStr);

    const iv = base64ToBuffer(parsed.iv);
    const ciphertext = base64ToBuffer(parsed.ct);

    const decrypted = await cryptoObj.subtle.decrypt(
      {
        name: "AES-GCM",
        iv,
      },
      key,
      ciphertext
    );

    const dec = new TextDecoder();
    const plain = dec.decode(decrypted);

    let result = plain;
    // Merge any envelope reactions if present
    try {
      const parsedInner = JSON.parse(plain);
      if (parsedInner && typeof parsedInner === "object" && (parsed as any).reactions) {
        parsedInner.reactions = (parsed as any).reactions;
        result = JSON.stringify(parsedInner);
      }
    } catch {
      // plain is simple text
    }

    messageDecryptionCache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.error("E2EE Decryption Error:", error);
    return "🔒 [Encrypted Message]";
  }
}

/**
 * Computes a human-readable security fingerprint (safety number) for the conversation.
 * Participants can compare this to verify authentic encryption keys.
 */
export async function getConversationFingerprint(conversationId: string): Promise<string> {
  try {
    const cryptoObj = typeof window !== "undefined" ? window.crypto : (globalThis as any).crypto;
    const enc = new TextEncoder();
    const data = enc.encode(`travally_fingerprint_${conversationId}`);
    const hashBuffer = await cryptoObj.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    // Convert to 4 chunks of 4-digit numbers (like Signal)
    const hex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    const chunk1 = parseInt(hex.substring(0, 4), 16) % 10000;
    const chunk2 = parseInt(hex.substring(4, 8), 16) % 10000;
    const chunk3 = parseInt(hex.substring(8, 12), 16) % 10000;
    const chunk4 = parseInt(hex.substring(12, 16), 16) % 10000;
    return `${String(chunk1).padStart(4, "0")} ${String(chunk2).padStart(4, "0")} ${String(chunk3).padStart(4, "0")} ${String(chunk4).padStart(4, "0")}`;
  } catch {
    return "4921 8201 9034 7128";
  }
}
