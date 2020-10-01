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

/**
 * Handler for the Authorization Code with PKCE Flow
 */
import {
  IOidcHandler,
  IOidcOptions,
  IRedirector,
  IStorageUtility,
} from "@inrupt/solid-client-authn-core";
import { injectable, inject } from "tsyringe";
import { OidcClient, SigninRequest } from "@inrupt/oidc-dpop-client-browser";

/**
 * @hidden
 */
@injectable()
export default class AuthorizationCodeWithPkceOidcHandler
  implements IOidcHandler {
  constructor(
    @inject("storageUtility") private storageUtility: IStorageUtility,
    @inject("redirector") private redirector: IRedirector
  ) {}

  async canHandle(oidcLoginOptions: IOidcOptions): Promise<boolean> {
    return !!(
      oidcLoginOptions.issuerConfiguration.grantTypesSupported &&
      oidcLoginOptions.issuerConfiguration.grantTypesSupported.indexOf(
        "authorization_code"
      ) > -1
    );
  }

  async handle(oidcLoginOptions: IOidcOptions): Promise<void> {
    /* eslint-disable @typescript-eslint/camelcase */
    const oidcOptions = {
      authority: oidcLoginOptions.issuer?.toString(),
      client_id: oidcLoginOptions.client.clientId,
      client_secret: oidcLoginOptions.client.clientSecret,
      redirect_uri: oidcLoginOptions.redirectUrl?.toString(),
      post_logout_redirect_uri: oidcLoginOptions.redirectUrl?.toString(),
      response_type: "code",
      // TODO: The 'webid' scope is still a spec discussion topic
      //  https://github.com/solid/specification/issues/203, i.e. the 'webid'
      //  scope does not yet appear in the Solid specification (it's not even
      //  mentioned in the WebID-OIDC spec).
      scope: "openid webid offline_access",
      filterProtocolClaims: true,
      loadUserInfo: true,
      code_verifier: true,
    };
    /* eslint-enable @typescript-eslint/camelcase */

    const oidcClientLibrary = new OidcClient(oidcOptions);

    const redirector = this.redirector;
    const storage = this.storageUtility;

    return (
      oidcClientLibrary
        .createSigninRequest()
        .then(async function (req: SigninRequest) {
          // We use the OAuth 'state' value (which should be crypto-random) as
          // the key in our storage to store our actual SessionID. We do this 'cos
          // we'll need to lookup our session information again when the browser
          // is redirected back to us (i.e. the OAuth client application) from the
          // Authorization Server.
          // We don't want to use our session ID as the OAuth 'state' value, as
          // that session ID can be any developer-specified value, and therefore
          // may not be appropriate (since the OAuth 'state' value should really
          // be an unguessable crypto-random value).
          await Promise.all([
            storage.setForUser(req.state._id, {
              sessionId: oidcLoginOptions.sessionId,
            }),
            storage.setForUser(oidcLoginOptions.sessionId, {
              codeVerifier: req.state._code_verifier,
              issuer: oidcLoginOptions.issuer.toString(),
              redirectUri: oidcLoginOptions.redirectUrl.toString(),
            }),
          ]);

          redirector.redirect(req.url.toString(), {
            handleRedirect: oidcLoginOptions.handleRedirect,
          });
        })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .catch((err: unknown) => {
          console.error(err);
        })
    );
  }
}
