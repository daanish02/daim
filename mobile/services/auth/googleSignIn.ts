import * as AuthSession from "expo-auth-session";
import Constants from "expo-constants";

export type GoogleSignInResult =
  | { type: "success"; idToken: string }
  | { type: "cancelled" }
  | { type: "error"; message: string };

type PromptAsync = () => Promise<AuthSession.AuthSessionResult>;

/**
 * Runs the Google sign-in prompt (injected as `promptAsync`, from the
 * useGoogleAuthRequest hook below) and normalizes its result. Kept
 * separate from the hook so the outcome-handling logic is testable
 * without a real native browser flow.
 */
export async function signInWithGoogle(promptAsync: PromptAsync): Promise<GoogleSignInResult> {
  const result = await promptAsync();

  if (result.type === "dismiss" || result.type === "cancel") {
    return { type: "cancelled" };
  }
  if (result.type !== "success") {
    return { type: "error", message: `Unexpected sign-in result: ${result.type}` };
  }

  const idToken = result.params?.id_token;
  if (!idToken) {
    return { type: "error", message: "Google did not return an id_token" };
  }

  return { type: "success", idToken };
}

const GOOGLE_DISCOVERY = {
  authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenEndpoint: "https://oauth2.googleapis.com/token",
};

/** Configures the Google auth request. clientId comes from app.json's expo.extra. */
export function useGoogleAuthRequest() {
  const clientId = Constants.expoConfig?.extra?.googleClientId as string | undefined;

  return AuthSession.useAuthRequest(
    {
      clientId: clientId ?? "",
      scopes: ["openid", "profile", "email"],
      redirectUri: AuthSession.makeRedirectUri({ scheme: "daim" }),
      responseType: AuthSession.ResponseType.IdToken,
      usePKCE: false,
    },
    GOOGLE_DISCOVERY,
  );
}
