import crypto from "node:crypto";
import { Hono } from "hono";
import { db } from "@po2order/db";
import { encrypt, decrypt } from "./quickbooksCrypto";

const QUICKBOOKS_AUTH_URL = "https://appcenter.intuit.com/connect/oauth2";
const QUICKBOOKS_TOKEN_URL = "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer";

const STATE_TTL_MS = 10 * 60 * 1000;
const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000;

type QuickBooksTokenResponse = {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  x_refresh_token_expires_in?: number;
  scope?: string;
};

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function getQuickBooksConfig() {
  return {
    clientId: requireEnv("QUICKBOOKS_CLIENT_ID"),
    clientSecret: requireEnv("QUICKBOOKS_CLIENT_SECRET"),
    redirectUri: requireEnv("QUICKBOOKS_REDIRECT_URI"),
    scopes: process.env.QUICKBOOKS_SCOPES || "com.intuit.quickbooks.accounting",
  };
}

function buildAuthUrl(state: string) {
  const { clientId, redirectUri, scopes } = getQuickBooksConfig();
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    scope: scopes,
    redirect_uri: redirectUri,
    state,
  });
  return `${QUICKBOOKS_AUTH_URL}?${params.toString()}`;
}

async function exchangeAuthorizationCode(code: string): Promise<QuickBooksTokenResponse> {
  const { clientId, clientSecret, redirectUri } = getQuickBooksConfig();
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const response = await fetch(QUICKBOOKS_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${auth}`,
      Accept: "application/json",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }).toString(),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`QuickBooks token exchange failed: ${response.status} ${text}`);
  }

  return (await response.json()) as QuickBooksTokenResponse;
}

async function refreshAccessToken(refreshToken: string): Promise<QuickBooksTokenResponse> {
  const { clientId, clientSecret } = getQuickBooksConfig();
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const response = await fetch(QUICKBOOKS_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${auth}`,
      Accept: "application/json",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }).toString(),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`QuickBooks token refresh failed: ${response.status} ${text}`);
  }

  return (await response.json()) as QuickBooksTokenResponse;
}

function getExpiryDate(expiresInSeconds?: number): Date | null {
  if (!expiresInSeconds) return null;
  return new Date(Date.now() + expiresInSeconds * 1000);
}

export async function getValidQuickBooksTokens(workspaceId: string) {
  const connection = await db.quickBooksConnection.findUnique({
    where: { workspaceId },
  });

  if (!connection?.accessTokenEnc || !connection.refreshTokenEnc) {
    throw new Error("QuickBooks connection missing tokens");
  }

  const accessToken = decrypt(connection.accessTokenEnc);
  const refreshToken = decrypt(connection.refreshTokenEnc);

  const shouldRefresh =
    connection.expiresAt &&
    connection.expiresAt.getTime() - Date.now() <= TOKEN_REFRESH_BUFFER_MS;

  if (!shouldRefresh) {
    return {
      accessToken,
      refreshToken,
      expiresAt: connection.expiresAt,
      tokenType: connection.tokenType,
      scope: connection.scope,
    };
  }

  const refreshed = await refreshAccessToken(refreshToken);
  const expiresAt = getExpiryDate(refreshed.expires_in);
  const refreshTokenExpiresAt = getExpiryDate(refreshed.x_refresh_token_expires_in);

  const updated = await db.quickBooksConnection.update({
    where: { workspaceId },
    data: {
      accessTokenEnc: encrypt(refreshed.access_token),
      refreshTokenEnc: encrypt(refreshed.refresh_token),
      tokenType: refreshed.token_type,
      scope: refreshed.scope,
      expiresAt,
      refreshTokenExpiresAt,
    },
  });

  return {
    accessToken: refreshed.access_token,
    refreshToken: refreshed.refresh_token,
    expiresAt: updated.expiresAt,
    tokenType: updated.tokenType,
    scope: updated.scope,
  };
}

export const quickBooksRouter = new Hono();

quickBooksRouter.get("/connect", async (c) => {
  const workspaceId = c.req.query("workspaceId");
  if (!workspaceId) {
    return c.json({ error: "workspaceId is required" }, 400);
  }

  const workspace = await db.workspace.findUnique({ where: { id: workspaceId } });
  if (!workspace) {
    return c.json({ error: "Workspace not found" }, 404);
  }

  const state = crypto.randomUUID();
  const stateExpiresAt = new Date(Date.now() + STATE_TTL_MS);

  await db.quickBooksConnection.upsert({
    where: { workspaceId },
    update: { state, stateExpiresAt },
    create: { workspaceId, state, stateExpiresAt },
  });

  return c.redirect(buildAuthUrl(state));
});

quickBooksRouter.get("/callback", async (c) => {
  const code = c.req.query("code");
  const state = c.req.query("state");
  const realmId = c.req.query("realmId");

  if (!code || !state) {
    return c.json({ error: "Missing code or state" }, 400);
  }

  const connection = await db.quickBooksConnection.findFirst({
    where: {
      state,
      stateExpiresAt: {
        gt: new Date(),
      },
    },
  });

  if (!connection) {
    return c.json({ error: "Invalid or expired state" }, 400);
  }

  try {
    const tokens = await exchangeAuthorizationCode(code);
    const expiresAt = getExpiryDate(tokens.expires_in);
    const refreshTokenExpiresAt = getExpiryDate(tokens.x_refresh_token_expires_in);

    await db.quickBooksConnection.update({
      where: { id: connection.id },
      data: {
        realmId,
        accessTokenEnc: encrypt(tokens.access_token),
        refreshTokenEnc: encrypt(tokens.refresh_token),
        tokenType: tokens.token_type,
        scope: tokens.scope,
        expiresAt,
        refreshTokenExpiresAt,
        state: null,
        stateExpiresAt: null,
      },
    });

    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: (error as Error).message }, 502);
  }
});
