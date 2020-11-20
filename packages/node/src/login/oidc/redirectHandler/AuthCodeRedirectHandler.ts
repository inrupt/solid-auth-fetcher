/*
 * Copyright 2020 Inrupt Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the
 * Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
 * INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
 * PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

/**
 * @hidden
 * @packageDocumentation
 */

import { inject, injectable } from "tsyringe";
import {
  IClient,
  IClientRegistrar,
  IIssuerConfig,
  IIssuerConfigFetcher,
  IRedirectHandler,
  ISessionInfo,
  ISessionInfoManager,
  IStorageUtility,
} from "@inrupt/solid-client-authn-core";
import { URL } from "url";
import { Issuer, TokenSet } from "openid-client";
import type { KeyObject } from "crypto";
import { JWTPayload } from "jose/jwt/verify";
import { configToIssuerMetadata } from "../IssuerConfigFetcher";
import {
  buildBearerFetch,
  buildDpopFetch,
  fetchType,
} from "../../../authenticatedFetch/fetchFactory";
// import generateKeyPair from "jose/util/generate_key_pair";
const { default: generateKeyPair } = require("jose/util/generate_key_pair");

type OidcContext = {
  sessionId: string;
  issuerConfig: IIssuerConfig;
  codeVerifier: string;
  redirectUri: string;
  dpop: boolean;
};

/**
 * Based on the provided state, this looks up contextual information stored
 * before redirecting the user to the OIDC issuer.
 * @param oauthState The state (~ correlation ID) of the OIDC request
 * @param storageUtility
 * @param configFetcher
 * @returns Information stored about the client issuing the request
 */
async function retrieveContextFromStorage(
  oauthState: string,
  storageUtility: IStorageUtility,
  configFetcher: IIssuerConfigFetcher
): Promise<OidcContext> {
  // Since we throw if not found, the type assertion are ok too
  const storedSessionId = (await storageUtility.getForUser(
    oauthState,
    "sessionId",
    {
      errorIfNull: true,
    }
  )) as string;

  const [issueIri, codeVerifier, storedRedirectIri, dpop] = (await Promise.all([
    storageUtility.getForUser(storedSessionId, "issuer", { errorIfNull: true }),
    storageUtility.getForUser(storedSessionId, "codeVerifier", {
      errorIfNull: true,
    }),
    storageUtility.getForUser(storedSessionId, "redirectUri", {
      errorIfNull: true,
    }),
    storageUtility.getForUser(storedSessionId, "dpop", { errorIfNull: true }),
  ])) as string[];

  // Unlike openid-client, this looks up the configuration from storage
  const issuerConfig = await configFetcher.fetchConfig(issueIri);
  return {
    sessionId: storedSessionId,
    codeVerifier,
    redirectUri: storedRedirectIri,
    issuerConfig,
    dpop: dpop === "true",
  };
}

async function saveSessionInfoInStorage(
  storageUtility: IStorageUtility,
  sessionId: string,
  idToken: string,
  webId: string,
  isLoggedIn: string,
  refreshToken?: string
): Promise<void> {
  if (refreshToken !== undefined) {
    await storageUtility.setForUser(
      sessionId,
      {
        refreshToken,
      },
      { secure: true }
    );
  }
  await storageUtility.setForUser(
    sessionId,
    {
      idToken,
      webId,
      isLoggedIn,
    },
    { secure: true }
  );
}

/**
 * Extract a WebID from an ID token payload. Note that this does not yet implement the
 * user endpoint lookup, and only checks for webid or IRI-like sub claims.
 *
 * @param idToken the payload of the ID token from which the WebID can be extracted.
 * @returns a WebID extracted from the ID token.
 */
async function deriveWebidFromTokenPayload(
  idToken: JWTPayload
): Promise<string> {
  if (idToken.webid !== undefined) {
    return idToken.webid;
  }
  try {
    if (idToken.sub === undefined) {
      throw new Error(
        `Bad ID token, missing a 'sub' claim: ${JSON.stringify(idToken)}`
      );
    }
    const webid = new URL(idToken.sub);
    return webid.href;
  } catch (e) {
    throw new Error(
      `The ID token has a malformed 'sub' claim (${idToken.sub}), and no 'webid' claim.`
    );
  }
}

/**
 * @hidden
 */
@injectable()
export class AuthCodeRedirectHandler implements IRedirectHandler {
  constructor(
    @inject("storageUtility") private storageUtility: IStorageUtility,
    @inject("sessionInfoManager")
    private sessionInfoManager: ISessionInfoManager,
    @inject("issuerConfigFetcher")
    private issuerConfigFetcher: IIssuerConfigFetcher,
    @inject("clientRegistrar") private clientRegistrar: IClientRegistrar
  ) {}

  async canHandle(redirectUrl: string): Promise<boolean> {
    try {
      const myUrl = new URL(redirectUrl);
      return (
        myUrl.searchParams.get("code") !== null &&
        myUrl.searchParams.get("state") !== null
      );
    } catch (e) {
      throw new Error(
        `[${redirectUrl}] is not a valid URL, and cannot be used as a redirect URL: ${e.toString()}`
      );
    }
  }

  async handle(
    redirectUrl: string
  ): Promise<ISessionInfo & { fetch: fetchType }> {
    if (!(await this.canHandle(redirectUrl))) {
      throw new Error(
        `AuthCodeRedirectHandler cannot handle [${redirectUrl}]: it is missing one of [code, state].`
      );
    }

    const url = new URL(redirectUrl);
    // The type assertion is ok, because we checked in canHandle for the presence of a state
    const oauthState = url.searchParams.get("state") as string;

    const {
      sessionId,
      issuerConfig,
      codeVerifier,
      redirectUri,
      dpop,
    } = await retrieveContextFromStorage(
      oauthState,
      this.storageUtility,
      this.issuerConfigFetcher
    );

    const issuer = new Issuer(configToIssuerMetadata(issuerConfig));

    // This should also retrieve the client from storage
    const clientInfo: IClient = await this.clientRegistrar.getClient(
      { sessionId },
      issuerConfig
    );

    const client = new issuer.Client({
      client_id: clientInfo.clientId,
      client_secret: clientInfo.clientSecret,
    });

    const params = client.callbackParams(redirectUrl);
    let dpopKey: KeyObject;
    let tokens: TokenSet;
    let authFetch: typeof fetch;

    if (dpop) {
      // const { privateKey } = await generateKeyPair('PS256');
      // FIXME
      dpopKey = (undefined as unknown) as KeyObject; // privateKey as KeyObject;
      tokens = await client.callback(
        redirectUri,
        params,
        { code_verifier: codeVerifier },
        { DPoP: dpopKey }
      );
      if (tokens.access_token === undefined || tokens.id_token === undefined) {
        throw new Error("The IdP did not return the expected tokens.");
      }
      authFetch = await buildDpopFetch(
        tokens.access_token,
        tokens.refresh_token,
        // TODO: buildDpopFetch isn't implemented yet
        dpopKey as any
      );
    } else {
      tokens = await client.callback(redirectUri, params, {
        code_verifier: codeVerifier,
      });
      if (tokens.access_token === undefined || tokens.id_token === undefined) {
        throw new Error("The IdP did not return the expected tokens.");
      }
      authFetch = buildBearerFetch(tokens.access_token, tokens.refresh_token);
    }

    const webid = await deriveWebidFromTokenPayload(tokens.claims());

    await saveSessionInfoInStorage(
      this.storageUtility,
      sessionId,
      tokens.id_token,
      webid,
      "true",
      tokens.refresh_token
    );

    const sessionInfo = await this.sessionInfoManager.get(sessionId);
    if (!sessionInfo) {
      throw new Error(`Could not retrieve session: [${sessionId}].`);
    }

    return Object.assign(sessionInfo, {
      fetch: authFetch,
    });
  }
}
