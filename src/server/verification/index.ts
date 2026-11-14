import { IIdentityVerificationProvider } from "./types";
import { NativeVerificationProvider } from "./providers/nativeProvider";

let nativeProviderInstance: NativeVerificationProvider | null = null;

export function getVerificationProvider(_overrideType?: string): IIdentityVerificationProvider {
  if (!nativeProviderInstance) {
    nativeProviderInstance = new NativeVerificationProvider();
  }
  return nativeProviderInstance;
}

export * from "./types";
