import { signInWithGoogle } from "./googleSignIn";
import { GoogleSignin, statusCodes } from "@react-native-google-signin/google-signin";

jest.mock("@react-native-google-signin/google-signin", () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn().mockResolvedValue(true),
    signIn: jest.fn(),
  },
  isErrorWithCode: (err: unknown): err is { code: string } =>
    typeof err === "object" && err !== null && "code" in err,
  statusCodes: { SIGN_IN_CANCELLED: "SIGN_IN_CANCELLED" },
}));

jest.mock("expo-constants", () => ({
  default: { expoConfig: { extra: { googleWebClientId: "test-web-client-id" } } },
}));

describe("signInWithGoogle", () => {
  test("returns the id_token on success", async () => {
    (GoogleSignin.signIn as jest.Mock).mockResolvedValue({
      data: { idToken: "google-id-token-abc" },
    });

    const result = await signInWithGoogle();

    expect(result).toEqual({ type: "success", idToken: "google-id-token-abc" });
  });

  test("returns cancelled when the user cancels", async () => {
    (GoogleSignin.signIn as jest.Mock).mockRejectedValue({
      code: statusCodes.SIGN_IN_CANCELLED,
    });

    const result = await signInWithGoogle();
    expect(result).toEqual({ type: "cancelled" });
  });

  test("returns error when signIn returns no id_token", async () => {
    (GoogleSignin.signIn as jest.Mock).mockResolvedValue({ data: {} });

    const result = await signInWithGoogle();
    expect(result).toEqual({ type: "error", message: expect.any(String) });
  });
});
