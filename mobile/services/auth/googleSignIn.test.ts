import { signInWithGoogle } from "./googleSignIn";

describe("signInWithGoogle", () => {
  test("returns the id_token on success", async () => {
    const mockPromptAsync = jest.fn().mockResolvedValue({
      type: "success",
      params: { id_token: "google-id-token-abc" },
    });

    const result = await signInWithGoogle(mockPromptAsync);

    expect(result).toEqual({ type: "success", idToken: "google-id-token-abc" });
  });

  test("returns cancelled when the user dismisses the prompt", async () => {
    const mockPromptAsync = jest.fn().mockResolvedValue({ type: "dismiss" });
    const result = await signInWithGoogle(mockPromptAsync);
    expect(result).toEqual({ type: "cancelled" });
  });

  test("returns error when the response has no id_token", async () => {
    const mockPromptAsync = jest.fn().mockResolvedValue({ type: "success", params: {} });
    const result = await signInWithGoogle(mockPromptAsync);
    expect(result).toEqual({ type: "error", message: expect.any(String) });
  });
});
