import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { app } from "./index";
import { encrypt, decrypt } from "./quickbooksCrypto";
import { getValidQuickBooksTokens } from "./quickbooks";

const mockDb = vi.hoisted(() => ({
  workspace: {
    findUnique: vi.fn(),
  },
  quickBooksConnection: {
    upsert: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock("@po2order/db", () => ({
  db: mockDb,
}));

describe("QuickBooks OAuth", () => {
  const envBackup = { ...process.env };

  beforeEach(() => {
    mockDb.workspace.findUnique.mockReset();
    mockDb.quickBooksConnection.upsert.mockReset();
    mockDb.quickBooksConnection.findFirst.mockReset();
    mockDb.quickBooksConnection.findUnique.mockReset();
    mockDb.quickBooksConnection.update.mockReset();

    process.env.QUICKBOOKS_CLIENT_ID = "client-id";
    process.env.QUICKBOOKS_CLIENT_SECRET = "client-secret";
    process.env.QUICKBOOKS_REDIRECT_URI = "https://example.com/callback";
    process.env.QUICKBOOKS_SCOPES = "com.intuit.quickbooks.accounting";
    process.env.QUICKBOOKS_ENCRYPTION_KEY = Buffer.from("a".repeat(32)).toString("base64");
  });

  afterEach(() => {
    process.env = { ...envBackup };
    vi.restoreAllMocks();
  });

  it("redirects to QuickBooks auth on connect", async () => {
    mockDb.workspace.findUnique.mockResolvedValue({ id: "ws-1" });
    mockDb.quickBooksConnection.upsert.mockResolvedValue({ id: "conn-1" });

    const response = await app.request("/api/quickbooks/connect?workspaceId=ws-1");

    expect(response.status).toBe(302);
    const location = response.headers.get("location");
    expect(location).toBeTruthy();

    const url = new URL(location!);
    expect(url.origin + url.pathname).toBe("https://appcenter.intuit.com/connect/oauth2");
    expect(url.searchParams.get("client_id")).toBe("client-id");
    expect(url.searchParams.get("redirect_uri")).toBe("https://example.com/callback");
    expect(url.searchParams.get("response_type")).toBe("code");
    expect(url.searchParams.get("scope")).toBe("com.intuit.quickbooks.accounting");

    const state = url.searchParams.get("state");
    expect(state).toBeTruthy();
    const upsertArgs = mockDb.quickBooksConnection.upsert.mock.calls[0][0];
    expect(upsertArgs.update.state).toBe(state);
  });

  it("handles OAuth callback and stores encrypted tokens", async () => {
    mockDb.quickBooksConnection.findFirst.mockResolvedValue({
      id: "conn-1",
      workspaceId: "ws-1",
      state: "state-123",
    });
    mockDb.quickBooksConnection.update.mockResolvedValue({ id: "conn-1" });

    const tokenResponse = {
      access_token: "access-token",
      refresh_token: "refresh-token",
      token_type: "bearer",
      expires_in: 3600,
      x_refresh_token_expires_in: 7200,
      scope: "com.intuit.quickbooks.accounting",
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => tokenResponse,
    });

    vi.stubGlobal("fetch", fetchMock);

    const response = await app.request(
      "/api/quickbooks/callback?code=abc&state=state-123&realmId=realm-1",
    );

    expect(response.status).toBe(200);
    const updateArgs = mockDb.quickBooksConnection.update.mock.calls[0][0];
    expect(updateArgs.data.realmId).toBe("realm-1");
    expect(updateArgs.data.accessTokenEnc).not.toBe("access-token");
    expect(updateArgs.data.refreshTokenEnc).not.toBe("refresh-token");

    const decryptedAccess = decrypt(updateArgs.data.accessTokenEnc);
    expect(decryptedAccess).toBe("access-token");
  });

  it("refreshes token when expired", async () => {
    const accessTokenEnc = encrypt("old-access");
    const refreshTokenEnc = encrypt("old-refresh");

    mockDb.quickBooksConnection.findUnique.mockResolvedValue({
      workspaceId: "ws-1",
      accessTokenEnc,
      refreshTokenEnc,
      expiresAt: new Date(Date.now() - 1000),
      tokenType: "bearer",
      scope: "scope",
    });

    mockDb.quickBooksConnection.update.mockResolvedValue({
      workspaceId: "ws-1",
      expiresAt: new Date(Date.now() + 3600 * 1000),
      tokenType: "bearer",
      scope: "scope",
    });

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: "new-access",
        refresh_token: "new-refresh",
        token_type: "bearer",
        expires_in: 3600,
        x_refresh_token_expires_in: 7200,
        scope: "scope",
      }),
    });

    vi.stubGlobal("fetch", fetchMock);

    const tokens = await getValidQuickBooksTokens("ws-1");
    expect(tokens.accessToken).toBe("new-access");
    expect(mockDb.quickBooksConnection.update).toHaveBeenCalled();
  });
});
