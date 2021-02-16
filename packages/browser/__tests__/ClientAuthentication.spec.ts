/*
 * Copyright 2021 Inrupt Inc.
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

// Required by TSyringe:
import "reflect-metadata";
import {
  mockStorageUtility,
  StorageUtility,
} from "@inrupt/solid-client-authn-core";
import { mockStorage } from "@inrupt/solid-client-authn-core/dist/storage/__mocks__/StorageUtility";
import { LoginHandlerMock } from "../src/login/__mocks__/LoginHandler";
import {
  RedirectHandlerMock,
  RedirectHandlerResponse,
} from "../src/login/oidc/redirectHandler/__mocks__/RedirectHandler";
import { LogoutHandlerMock } from "../src/logout/__mocks__/LogoutHandler";
import { mockSessionInfoManager } from "../src/sessionInfo/__mocks__/SessionInfoManager";
import ClientAuthentication from "../src/ClientAuthentication";
import { KEY_CURRENT_URL } from "../src/constant";

describe("ClientAuthentication", () => {
  const defaultMocks = {
    loginHandler: LoginHandlerMock,
    redirectHandler: RedirectHandlerMock,
    logoutHandler: LogoutHandlerMock,
    sessionInfoManager: mockSessionInfoManager(mockStorageUtility({})),
  };

  function getClientAuthentication(
    mocks: Partial<typeof defaultMocks> = defaultMocks
  ): ClientAuthentication {
    return new ClientAuthentication(
      mocks.loginHandler ?? defaultMocks.loginHandler,
      mocks.redirectHandler ?? defaultMocks.redirectHandler,
      mocks.logoutHandler ?? defaultMocks.logoutHandler,
      mocks.sessionInfoManager ?? defaultMocks.sessionInfoManager
    );
  }

  describe("login", () => {
    it("calls login, and defaults to a DPoP token", async () => {
      const clientAuthn = getClientAuthentication();
      await clientAuthn.login("mySession", {
        clientId: "coolApp",
        redirectUrl: "https://coolapp.com/redirect",
        oidcIssuer: "https://idp.com",
      });
      expect(defaultMocks.loginHandler.handle).toHaveBeenCalledWith({
        sessionId: "mySession",
        clientId: "coolApp",
        redirectUrl: "https://coolapp.com/redirect",
        oidcIssuer: "https://idp.com",
        popUp: false,
        clientName: "coolApp",
        clientSecret: undefined,
        handleRedirect: undefined,
        tokenType: "DPoP",
      });
    });

    it("request a bearer token if specified", async () => {
      const clientAuthn = getClientAuthentication();
      await clientAuthn.login("mySession", {
        clientId: "coolApp",
        redirectUrl: "https://coolapp.com/redirect",
        oidcIssuer: "https://idp.com",
        tokenType: "Bearer",
      });
      expect(defaultMocks.loginHandler.handle).toHaveBeenCalledWith({
        sessionId: "mySession",
        clientId: "coolApp",
        redirectUrl: "https://coolapp.com/redirect",
        oidcIssuer: "https://idp.com",
        popUp: false,
        clientName: "coolApp",
        clientSecret: undefined,
        handleRedirect: undefined,
        tokenType: "Bearer",
      });
    });

    it("should clear the local storage when logging in", async () => {
      const nonEmptyStorage = mockStorageUtility({
        someUser: { someKey: "someValue" },
      });
      await nonEmptyStorage.setForUser(
        "someUser",
        { someKey: "someValue" },
        { secure: true }
      );
      const clientAuthn = getClientAuthentication({
        sessionInfoManager: mockSessionInfoManager(nonEmptyStorage),
      });
      await clientAuthn.login("someUser", {
        clientId: "coolApp",
        clientName: "coolApp Name",
        redirectUrl: "https://coolapp.com/redirect",
        oidcIssuer: "https://idp.com",
      });
      await expect(
        nonEmptyStorage.getForUser("someUser", "someKey", { secure: true })
      ).resolves.toBeUndefined();
      await expect(
        nonEmptyStorage.getForUser("someUser", "someKey", { secure: false })
      ).resolves.toBeUndefined();
      // This test is only necessary until the key is stored safely
      await expect(
        nonEmptyStorage.get("clientKey", { secure: false })
      ).resolves.toBeUndefined();
    });
  });

  describe("fetch", () => {
    it("calls fetch using the browser cookies if available", async () => {
      window.fetch = jest.fn();
      const clientAuthn = getClientAuthentication();
      await clientAuthn.fetch("https://html5zombo.com");
      expect(window.fetch).toHaveBeenCalledWith("https://html5zombo.com", {
        credentials: "include",
      });
    });
  });

  describe("logout", () => {
    it("reverts back to un-authenticated fetch on logout", async () => {
      window.fetch = jest.fn();
      // eslint-disable-next-line no-restricted-globals
      history.replaceState = jest.fn();
      const clientAuthn = getClientAuthentication();

      const unauthFetch = clientAuthn.fetch;

      const url =
        "https://coolapp.com/redirect?state=userId&id_token=idToken&access_token=accessToken";
      await clientAuthn.handleIncomingRedirect(url);

      // Calling the redirect handler should give us an authenticated fetch.
      expect(clientAuthn.fetch).not.toBe(unauthFetch);

      await clientAuthn.logout("mySession");
      const spyFetch = jest.spyOn(window, "fetch");
      await clientAuthn.fetch("https://example.com", {
        credentials: "omit",
      });
      // Calling logout should revert back to our un-authenticated fetch.
      expect(spyFetch).toHaveBeenCalledWith("https://example.com", {
        credentials: "omit",
      });
    });
  });

  describe("getAllSessionInfo", () => {
    it("creates a session for the global user", async () => {
      const clientAuthn = getClientAuthentication();
      await expect(() => clientAuthn.getAllSessionInfo()).rejects.toThrow(
        "Not implemented"
      );
    });
  });

  describe("getSessionInfo", () => {
    it("creates a session for the global user", async () => {
      const sessionInfo = {
        isLoggedIn: "true",
        sessionId: "mySession",
        webId: "https://pod.com/profile/card#me",
      };
      const clientAuthn = getClientAuthentication({
        sessionInfoManager: mockSessionInfoManager(
          mockStorageUtility(
            {
              "solidClientAuthenticationUser:mySession": { ...sessionInfo },
            },
            true
          )
        ),
      });
      const session = await clientAuthn.getSessionInfo("mySession");
      // isLoggedIn is stored as a string under the hood, but deserialized as a boolean
      expect(session).toEqual({ ...sessionInfo, isLoggedIn: true });
    });
  });

  describe("handleIncomingRedirect", () => {
    it("calls handle redirect", async () => {
      // eslint-disable-next-line no-restricted-globals
      history.replaceState = jest.fn();
      const clientAuthn = getClientAuthentication();
      const unauthFetch = clientAuthn.fetch;
      const url =
        "https://coolapp.com/redirect?state=userId&id_token=idToken&access_token=accessToken";
      const redirectInfo = await clientAuthn.handleIncomingRedirect(url);
      expect(redirectInfo).toEqual({
        ...RedirectHandlerResponse,
      });
      expect(defaultMocks.redirectHandler.handle).toHaveBeenCalledWith(url);

      // Calling the redirect handler should have updated the fetch.
      expect(clientAuthn.fetch).not.toBe(unauthFetch);
    });

    it("clears the current IRI from OAuth query parameters in the auth code flow", async () => {
      // eslint-disable-next-line no-restricted-globals
      history.replaceState = jest.fn();
      const clientAuthn = getClientAuthentication();
      const url =
        "https://coolapp.com/redirect?state=someState&code=someAuthCode";
      await clientAuthn.handleIncomingRedirect(url);
      // eslint-disable-next-line no-restricted-globals
      expect(history.replaceState).toHaveBeenCalledWith(
        null,
        "",
        "https://coolapp.com/redirect"
      );
    });

    it("clears the current IRI from OAuth query parameters in the implicit flow", async () => {
      // eslint-disable-next-line no-restricted-globals
      history.replaceState = jest.fn();
      const clientAuthn = getClientAuthentication();
      const url =
        "https://coolapp.com/redirect?state=someState&id_token=idToken&access_token=accessToken";
      await clientAuthn.handleIncomingRedirect(url);
      // eslint-disable-next-line no-restricted-globals
      expect(history.replaceState).toHaveBeenCalledWith(
        null,
        "",
        "https://coolapp.com/redirect"
      );
    });

    it("preserves non-OAuth query strings", async () => {
      // eslint-disable-next-line no-restricted-globals
      history.replaceState = jest.fn();
      const clientAuthn = getClientAuthentication();
      const url =
        "https://coolapp.com/redirect?state=someState&code=someAuthCode&someQuery=someValue";
      await clientAuthn.handleIncomingRedirect(url);
      // eslint-disable-next-line no-restricted-globals
      expect(history.replaceState).toHaveBeenCalledWith(
        null,
        "",
        "https://coolapp.com/redirect?someQuery=someValue"
      );
    });

    it("saves current window location if we have stored ID Token", async () => {
      const existingLocalStorage = window.localStorage;

      const storageData: Record<string, string> = {};
      const localStorageMock = {
        getItem: jest.fn((key) => JSON.stringify(storageData[key])),
        setItem: jest.fn((key, value) => {
          storageData[key] = value;
        }),
      };

      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
        writable: true,
      });

      try {
        // eslint-disable-next-line no-restricted-globals
        history.replaceState = jest.fn();

        const clientAuthn = getClientAuthentication({
          // Awkward here - we need to be logged in (which is state stored in
          // 'secure' storage), and have an ID Token (which is stored in
          // 'insecure' storage).
          sessionInfoManager: mockSessionInfoManager(
            new StorageUtility(
              mockStorage({
                "solidClientAuthenticationUser:global": {
                  isLoggedIn: "true",
                },
              }),
              mockStorage({
                "solidClientAuthenticationUser:global": {
                  idToken: "value doesn't matter",
                },
              })
            )
          ),
        });

        await clientAuthn.handleIncomingRedirect("https://ex.com/redirect");

        // In unit tests, the window location with just be localhost. All we're
        // really testing here is that a location was persisted (so we could
        // change this assertion to just ensure a value exists and is non-empty.
        expect(window.localStorage.getItem(KEY_CURRENT_URL)).toContain(
          "http://localhost/"
        );
      } finally {
        // Remove the mocked method:
        Object.defineProperty(window, "localStorage", {
          value: existingLocalStorage,
        });
      }
    });
  });
});
