import { IIdentityVerificationProvider } from "./types";
import { NeetixVerificationProvider } from "./providers/neetixProvider";
import { HyperVergeVerificationProvider } from "./providers/hypervergeProvider";

let neetixProviderInstance: NeetixVerificationProvider | null = null;
let lastNeetixKey: string | undefined = undefined;
let hypervergeProviderInstance: HyperVergeVerificationProvider | null = null;

export function getVerificationProvider(overrideType?: string): IIdentityVerificationProvider {
  const providerType = (
    overrideType ||
    process.env.IDENTITY_VERIFICATION_PROVIDER ||
    process.env.VERIFICATION_PROVIDER ||
    "neetix"
  ).toLowerCase();

  // If explicitly requested HyperVerge
  if (providerType === "hyperverge") {
    if (!hypervergeProviderInstance) {
      hypervergeProviderInstance = new HyperVergeVerificationProvider();
    }
    return hypervergeProviderInstance;
  }

  // Primary & default provider: Neetix Liveliness
  // Automatically reinitialize if NEETIX_API_KEY changes
  const currentKey = (process.env.NEETIX_API_KEY || "").trim();
  if (!neetixProviderInstance || lastNeetixKey !== currentKey) {
    neetixProviderInstance = new NeetixVerificationProvider();
    lastNeetixKey = currentKey;
  }
  return neetixProviderInstance;
}

export * from "./types";

