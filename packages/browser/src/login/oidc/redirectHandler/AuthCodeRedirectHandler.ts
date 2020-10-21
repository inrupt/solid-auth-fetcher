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

import URL from "url-parse";
import ConfigurationError from "../../..//errors/ConfigurationError";
import { inject, injectable } from "tsyringe";
import { ITokenRequester } from "../TokenRequester";
import {
  IRedirector,
  IRedirectHandler,
  ISessionInfo,
  ISessionInfoManager,
  IStorageUtility,
} from "@inrupt/solid-client-authn-core";

/**
 * @hidden
 */
@injectable()
export default class AuthCodeRedirectHandler implements IRedirectHandler {
  constructor(
    @inject("storageUtility") private storageUtility: IStorageUtility,
    @inject("redirector") private redirector: IRedirector,
    @inject("tokenRequester") private tokenRequester: ITokenRequester,
    @inject("sessionInfoManager")
    private sessionInfoManager: ISessionInfoManager
  ) {}

  async canHandle(redirectUrl: string): Promise<boolean> {
    const url = new URL(redirectUrl, true);
    return !!(url.query && url.query.code && url.query.state);
  }

  async handle(redirectUrl: string): Promise<ISessionInfo | undefined> {
    if (!(await this.canHandle(redirectUrl))) {
      throw new ConfigurationError(
        `Cannot handle redirect url [${redirectUrl}]`
      );
    }
    const url = new URL(redirectUrl, true);
    const sessionId = url.query.state as string;
    const [codeVerifier, redirectUri] = await Promise.all([
      (await this.storageUtility.getForUser(sessionId, "codeVerifier", {
        errorIfNull: true,
      }
    )) as string;

    let signinResponse;
    try {
      signinResponse = await new OidcClient({
        // TODO: We should look at the various interfaces being used for storage,
        //  i.e. between oidc-client-js (WebStorageStoreState), localStorage
        //  (which has an interface Storage), and our own proprietary interface
        //  IStorage - i.e. we should really just be using the browser Web Storage
        //  API, e.g. "stateStore: window.localStorage,".

        // We are instantiating a new instance here, so the only value we need to
        // explicitly provide is the response mode (default otherwise will look
        // for a hash '#' fragment!).
        // eslint-disable-next-line @typescript-eslint/camelcase
        response_mode: "query",
      }).processSigninResponse(redirectUrl.toString());
    } catch (err) {
      throw new Error(
        `Problem handling Auth Code Grant (Flow) redirect - URL [${redirectUrl}]: ${err}`
      );
    }
    
    const sessionInfo = await this.sessionInfoManager.get(sessionId);
    if (!sessionInfo) {
      throw new Error("There was a problem creating a session.");
    }
    try {
      this.redirector.redirect(url.toString(), {
        redirectByReplacingState: true,
      });
    } catch (err) {
      // Do nothing
      // This step of the flow should happen in a browser, and redirection
      // should never fail there.
    }

    return Object.assign(sessionInfo, {
      // TODO: When handling DPoP, both the key and the token should be returned
      // by the redirect handler.
      fetch: buildBearerFetch(signinResponse.access_token),
    });
  }
}
