/**
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

// Required by TSyringe:
import "reflect-metadata";
import {
  LoginHandlerMock,
  LoginHandlerResponse
} from "../src/login/__mocks__/LoginHandler";
import {
  RedirectHandlerMock,
  RedirectHandlerResponse
} from "../src/login/oidc/redirectHandler/__mocks__/RedirectHandler";
import { LogoutHandlerMock } from "../src/logout/__mocks__/LogoutHandler";
import {
  SessionCreatorMock,
  SessionCreatorCreateResponse
} from "../src/solidSession/__mocks__/SessionCreator";
import {
  AuthenticatedFetcherMock,
  AuthenticatedFetcherResponse
} from "../src/authenticatedFetch/__mocks__/AuthenticatedFetcher";
import { EnvironmentDetectorMock } from "../src/util/__mocks__/EnvironmentDetector";
import AuthFetcher from "../src/AuthFetcher";
import URL from "url-parse";

describe("AuthFetcher", () => {
  const defaultMocks = {
    loginHandler: LoginHandlerMock,
    redirectHandler: RedirectHandlerMock,
    logoutHandler: LogoutHandlerMock,
    sessionCreator: SessionCreatorMock,
    authenticatedFetcher: AuthenticatedFetcherMock,
    environmentDetector: EnvironmentDetectorMock
  };
  function getAuthFetcher(
    mocks: Partial<typeof defaultMocks> = defaultMocks
  ): AuthFetcher {
    return new AuthFetcher(
      mocks.loginHandler ?? defaultMocks.loginHandler,
      mocks.redirectHandler ?? defaultMocks.redirectHandler,
      mocks.logoutHandler ?? defaultMocks.logoutHandler,
      mocks.sessionCreator ?? defaultMocks.sessionCreator,
      mocks.authenticatedFetcher ?? defaultMocks.authenticatedFetcher,
      mocks.environmentDetector ?? defaultMocks.environmentDetector
    );
  }

  describe("login", () => {
    it("calls login", async () => {
      const authFetcher = getAuthFetcher();
      const session = await authFetcher.login({
        clientId: "coolApp",
        redirect: "https://coolapp.com/redirect",
        oidcIssuer: "https://idp.com"
      });
      expect(session).toBe(LoginHandlerResponse);
      expect(defaultMocks.loginHandler.handle).toHaveBeenCalledWith({
        localUserId: "global",
        clientId: "coolApp",
        redirect: new URL("https://coolapp.com/redirect"),
        oidcIssuer: new URL("https://idp.com")
      });
    });
  });

  describe("fetch", () => {
    it("calls fetch", async () => {
      const authFetcher = getAuthFetcher();
      const response = await authFetcher.fetch("https://zombo.com");
      expect(response).toBe(AuthenticatedFetcherResponse);
      expect(defaultMocks.authenticatedFetcher.handle).toHaveBeenCalledWith(
        {
          localUserId: "global",
          type: "dpop"
        },
        "https://zombo.com",
        undefined
      );
    });
  });

  describe("logout", () => {
    it("calls logout", async () => {
      const authFetcher = getAuthFetcher();
      await authFetcher.logout();
      expect(defaultMocks.logoutHandler.handle).toHaveBeenCalledWith("global");
    });
  });

  describe("getSession", () => {
    it("creates a session for the global user", async () => {
      const authFetcher = getAuthFetcher();
      const session = await authFetcher.getSession();
      expect(session).toBe(SessionCreatorCreateResponse);
      expect(defaultMocks.sessionCreator.getSession).toHaveBeenCalledWith(
        "global"
      );
    });
  });

  describe("uniqueLogin", () => {
    it("calls login without a local user", async () => {
      const authFetcher = getAuthFetcher();
      const session = await authFetcher.uniqueLogin({
        clientId: "coolApp",
        redirect: "https://coolapp.com/redirect",
        oidcIssuer: "https://idp.com"
      });
      expect(session).toBe(LoginHandlerResponse);
      expect(defaultMocks.loginHandler.handle).toHaveBeenCalledWith({
        clientId: "coolApp",
        redirect: new URL("https://coolapp.com/redirect"),
        oidcIssuer: new URL("https://idp.com")
      });
    });
  });

  describe("onSession", () => {
    it("Automatically calls the callback if the session is present", async () => {
      const authFetcher = getAuthFetcher();
      const callback = jest.fn();
      await authFetcher.onSession(callback);
      expect(callback).toHaveBeenCalledWith(SessionCreatorCreateResponse);
    });

    it("Does not automatically call the callback if the session is not present", async () => {
      defaultMocks.sessionCreator.getSession.mockResolvedValueOnce(null);
      const authFetcher = getAuthFetcher();
      const callback = jest.fn();
      await authFetcher.onSession(callback);
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe("onLogout", () => {
    it("Temp throws an error", () => {
      const authFetcher = getAuthFetcher();
      expect(() =>
        authFetcher.onLogout(() => {
          /* do nothing */
        })
      ).rejects.toThrowError("Not Implemented");
    });
  });

  describe("handleRedirect", () => {
    it("calls handle redirect", async () => {
      const authFetcher = getAuthFetcher();
      const url =
        "https://coolapp.com/redirect?state=userId&id_token=idToken&access_token=accessToken";
      const session = await authFetcher.handleRedirect(url);
      expect(session).toBe(RedirectHandlerResponse);
      expect(defaultMocks.redirectHandler.handle).toHaveBeenCalledWith(url);
    });
  });

  describe("automaticallyHandleRedirect", () => {
    it("handles redirect when in the browser", async () => {
      const authFetcher = getAuthFetcher();
      await authFetcher.automaticallyHandleRedirect();
      expect(defaultMocks.redirectHandler.handle).toHaveBeenCalledWith(
        "http://localhost/"
      );
    });

    it("does not handle redirect when not in the browser", async () => {
      defaultMocks.environmentDetector.detect.mockReturnValueOnce("server");
      const authFetcher = getAuthFetcher();
      await authFetcher.automaticallyHandleRedirect();
      expect(defaultMocks.redirectHandler.handle).not.toHaveBeenCalled();
    });
  });

  describe("customAuthFetcher", () => {
    it("Temp throws an error", () => {
      const authFetcher = getAuthFetcher();
      expect(() => authFetcher.customAuthFetcher({})).toThrowError();
    });
  });
});
