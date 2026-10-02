import { GoogleSignin, isErrorWithCode, statusCodes } from "@react-native-google-signin/google-signin";
import Constants from "expo-constants";

export type GoogleSignInResult =
  | { type: "success"; idToken: string }
  | { type: "cancelled" }
  | { type: "error"; message: string };

export function configureGoogleSignIn() {
  const webClientId = Constants.expoConfig?.extra?.googleWebClientId as string | undefined;
  GoogleSignin.configure({ webClientId: webClientId ?? "" });
}

export async function signInWithGoogle(): Promise<GoogleSignInResult> {
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();
    const idToken = response.data?.idToken;
    if (!idToken) {
      return { type: "error", message: "Google did not return an id_token" };
    }
    return { type: "success", idToken };
  } catch (err: unknown) {
    if (isErrorWithCode(err) && err.code === statusCodes.SIGN_IN_CANCELLED) {
      return { type: "cancelled" };
    }
    const message = err instanceof Error ? err.message : "Unknown error";
    return { type: "error", message };
  }
}
