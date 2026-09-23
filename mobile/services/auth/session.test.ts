import * as SecureStore from "expo-secure-store";
import { getSessionToken, setSessionToken, clearSessionToken, SESSION_TOKEN_KEY } from "./session";

jest.mock("expo-secure-store");

describe("session token storage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("setSessionToken writes to secure store under the session key", async () => {
    await setSessionToken("abc123");
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(SESSION_TOKEN_KEY, "abc123");
  });

  test("getSessionToken reads from secure store", async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue("stored-token");
    const token = await getSessionToken();
    expect(SecureStore.getItemAsync).toHaveBeenCalledWith(SESSION_TOKEN_KEY);
    expect(token).toBe("stored-token");
  });

  test("getSessionToken returns null when nothing stored", async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
    expect(await getSessionToken()).toBeNull();
  });

  test("clearSessionToken deletes the stored token", async () => {
    await clearSessionToken();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(SESSION_TOKEN_KEY);
  });
});
