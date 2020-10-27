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
 * Test for AuthorizationCodeWithPkceOidcHandler
 */
import "reflect-metadata";
import AuthorizationCodeWithPkceOidcHandler from "../../../../src/login/oidc/oidcHandlers/AuthorizationCodeWithPkceOidcHandler";
import canHandleTests from "./OidcHandlerCanHandleTests";
import { SessionInfoManagerMock } from "../../../../src/sessionInfo/__mocks__/SessionInfoManager";
import { standardOidcOptions } from "../../../../src/login/oidc/__mocks__/IOidcOptions";
import { RedirectorMock } from "../../../../src/login/oidc/__mocks__/Redirector";
import {
  IOidcOptions,
  StorageUtilityMock,
} from "@inrupt/solid-client-authn-core";
import { SigninRequest } from "@inrupt/oidc-dpop-client-browser";

const expectedSigninRedirectUrl = "https://test";
jest.mock("@inrupt/oidc-dpop-client-browser", () => {
  return {
    OidcClient: jest.fn().mockImplementation(() => {
      return {
        createSigninRequest: (): Promise<SigninRequest> =>
          Promise.resolve({
            url: expectedSigninRedirectUrl,
            state: "test state",
          }),
      };
    }),
  };
});

describe("AuthorizationCodeWithPkceOidcHandler", () => {
  const defaultMocks = {
    sessionCreator: SessionInfoManagerMock,
    storageUtility: StorageUtilityMock,
    redirector: RedirectorMock,
  };

  function getAuthorizationCodeWithPkceOidcHandler(
    mocks: Partial<typeof defaultMocks> = defaultMocks
  ): AuthorizationCodeWithPkceOidcHandler {
    return new AuthorizationCodeWithPkceOidcHandler(
      mocks.storageUtility ?? defaultMocks.storageUtility,
      mocks.redirector ?? defaultMocks.redirector
    );
  }

  describe("canHandle", () => {
    const authorizationCodeWithPkceOidcHandler = getAuthorizationCodeWithPkceOidcHandler();
    canHandleTests["authorizationCodeWithPkceOidcHandler"].forEach(
      (testConfig) => {
        it(testConfig.message, async () => {
          const value = await authorizationCodeWithPkceOidcHandler.canHandle(
            testConfig.oidcOptions
          );
          expect(value).toBe(testConfig.shouldPass);
        });
      }
    );
  });

  describe("handle", () => {
    it("Handles login properly with PKCE", async () => {
      const authorizationCodeWithPkceOidcHandler = getAuthorizationCodeWithPkceOidcHandler();
      const oidcOptions: IOidcOptions = {
        ...standardOidcOptions,
        issuerConfiguration: {
          ...standardOidcOptions.issuerConfiguration,
          grantTypesSupported: ["authorization_code"],
        },
      };
      await authorizationCodeWithPkceOidcHandler.handle(oidcOptions);
      expect(defaultMocks.redirector.redirect).toHaveBeenCalledWith(
        expectedSigninRedirectUrl,
        {
          handleRedirect: standardOidcOptions.handleRedirect,
        }
      );
    });

    it("handles login when a client secret is present", async () => {
      const authorizationCodeWithPkceOidcHandler = getAuthorizationCodeWithPkceOidcHandler();
      const oidcOptions: IOidcOptions = {
        ...standardOidcOptions,
        client: {
          ...standardOidcOptions.client,
          clientSecret: "I can't cook because I only drink Soylent",
        },
        issuerConfiguration: {
          ...standardOidcOptions.issuerConfiguration,
          grantTypesSupported: ["authorization_code"],
        },
      };
      await authorizationCodeWithPkceOidcHandler.handle(oidcOptions);
      expect(defaultMocks.redirector.redirect).toHaveBeenCalledWith(
        expectedSigninRedirectUrl,
        {
          handleRedirect: standardOidcOptions.handleRedirect,
        }
      );
    });
  });
});
