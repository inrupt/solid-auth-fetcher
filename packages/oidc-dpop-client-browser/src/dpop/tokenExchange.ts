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

import { IClient, IIssuerConfig } from "../common/types";
import { JSONWebKey } from "jose";
import { createDpopHeader, decodeJwt } from "./dpop";
import { generateJwkForDpop } from "./keyGeneration";
import formurlencoded from "form-urlencoded";

function hasAccessToken(
  value: { access_token: string } | Record<string, unknown>
): value is { access_token: string } {
  return value.access_token && typeof value.access_token === "string";
}

function hasIdToken(
  value: { id_token: string } | Record<string, unknown>
): value is { id_token: string } {
  return value.id_token && typeof value.id_token === "string";
}

function hasRefreshToken(
  value: { refresh_token: string } | Record<string, unknown>
): value is { refresh_token: string } {
  return value.refresh_token && typeof value.refresh_token === "string";
}

function hasTokenType(
  value: { token_type: string } | Record<string, unknown>
): value is { token_type: string } {
  return value.token_type && typeof value.token_type === "string";
}

export type TokenEndpointResponse = {
  accessToken: string;
  idToken: string;
  webId: string;
  refreshToken?: string;
  dpopJwk?: string;
};

export type TokenEndpointInput = {
  grantType: string;
  redirectUri: string;
  code: string;
  codeVerifier: string;
};

type WebIdOidcIdToken = {
  sub: string;
  iss: string;
  webId?: string;
};

function isWebIdOidcIdToken(
  token: WebIdOidcIdToken | Record<string, unknown>
): token is WebIdOidcIdToken {
  return (
    (token.sub &&
      typeof token.sub === "string" &&
      token.iss &&
      typeof token.iss === "string" &&
      !token.webId) ||
    typeof token.webId === "string"
  );
}

/**
 * Extracts a WebId from an ID token based on https://github.com/solid/webid-oidc-spec.
 * The upcoming spec is still a work in progress.
 *
 * Note: this function does not implement the userinfo WebId lookup yet.
 * @param idToken
 */
async function deriveWebIdFromIdToken(idToken: string): Promise<string> {
  const decoded = await decodeJwt(idToken);
  if (!isWebIdOidcIdToken(decoded)) {
    throw new Error(
      `Invalid ID token: ${JSON.stringify(
        decoded
      )} is missing 'sub' or 'iss' claims`
    );
  }
  if (decoded.webId) {
    return decoded.webId;
  }
  if (!decoded.sub.match(/^https?:\/\/.+\..+$/)) {
    throw new Error(
      `Cannot extract WebID from ID token: the ID token returned by ${decoded.iss} has no 'webid' claim, nor an IRI-like sub claim: [${decoded.sub}]`
    );
  }
  return decoded.sub;
}

function validatePreconditions(
  issuer: IIssuerConfig,
  data: TokenEndpointInput
): void {
  if (
    data.grantType &&
    (!issuer.grantTypesSupported ||
      !issuer.grantTypesSupported.includes(data.grantType))
  ) {
    throw new Error(
      `The issuer [${issuer.issuer.toString()}] does not support the [${
        data.grantType
      }] grant`
    );
  }
  if (!issuer.tokenEndpoint) {
    throw new Error(
      `This issuer [${issuer.issuer.toString()}] does not have a token endpoint`
    );
  }
}

function validateTokenEndpointResponse(
  tokenResponse: Record<string, unknown>,
  dpop: boolean
): Record<string, unknown> & { access_token: string; id_token: string } {
  if (!hasAccessToken(tokenResponse)) {
    throw new Error(
      `Invalid token endpoint response: ${JSON.stringify(
        tokenResponse
      )} is missing an access_token.`
    );
  }

  if (!hasIdToken(tokenResponse)) {
    throw new Error(
      `Invalid token endpoint response: ${JSON.stringify(
        tokenResponse
      )} is missing an id_token.`
    );
  }

  if (!hasTokenType(tokenResponse)) {
    throw new Error(
      `Invalid token endpoint response: ${JSON.stringify(
        tokenResponse
      )} is missing an token_type.`
    );
  }

  if (dpop && tokenResponse.token_type.toLowerCase() !== "dpop") {
    throw new Error(
      `Invalid token endpoint response: requested a [DPoP] token, got a token_type [${tokenResponse.token_type}].`
    );
  }

  if (!dpop && tokenResponse.token_type.toLowerCase() !== "bearer") {
    throw new Error(
      `Invalid token endpoint response: requested a [Bearer] token, got a token_type [${tokenResponse.token_type}].`
    );
  }
  return tokenResponse;
}

export async function getTokens(
  issuer: IIssuerConfig,
  client: IClient,
  data: TokenEndpointInput,
  dpop: boolean
): Promise<TokenEndpointResponse | undefined> {
  validatePreconditions(issuer, data);
  const headers: Record<string, string> = {
    "content-type": "application/x-www-form-urlencoded",
  };
  let dpopJwk: JSONWebKey | undefined = undefined;
  if (dpop) {
    dpopJwk = await generateJwkForDpop();
    headers["DPoP"] = await createDpopHeader(
      issuer.tokenEndpoint,
      "POST",
      dpopJwk
    );
  }
  // TODO: is this necessary ? it's present in OAuth2 in action book, but not in spec
  // if (client.clientSecret) {
  //   headers["Authorization"] = `Basic ${this.btoa(
  //     `${client.clientId}:${client.clientSecret}`
  // }
  const tokenRequestInit: RequestInit & {
    headers: Record<string, string>;
  } = {
    method: "POST",
    headers,
    body: formurlencoded({
      /* eslint-disable @typescript-eslint/camelcase */
      grant_type: data.grantType,
      redirect_uri: data.redirectUri,
      code: data.code,
      code_verifier: data.codeVerifier,
      client_id: client.clientId,
      /* eslint-enable @typescript-eslint/camelcase */
    }),
  };

  const rawTokenResponse = (await (
    await fetch(issuer.tokenEndpoint.toString(), tokenRequestInit)
  ).json()) as Record<string, unknown>;

  const tokenResponse = validateTokenEndpointResponse(rawTokenResponse, dpop);
  const webId = await deriveWebIdFromIdToken(tokenResponse.id_token);

  return {
    accessToken: tokenResponse.access_token,
    idToken: tokenResponse.id_token,
    refreshToken: hasRefreshToken(tokenResponse)
      ? tokenResponse.refresh_token
      : undefined,
    webId: webId,
    dpopJwk: dpopJwk ? JSON.stringify(dpopJwk) : undefined,
  };
}
