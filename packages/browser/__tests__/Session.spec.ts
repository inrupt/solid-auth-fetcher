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

// The following is required by tsyringe
import "reflect-metadata";
import { it, describe } from "@jest/globals";
import { mockClientAuthentication } from "../src/__mocks__/ClientAuthentication";
import { Session } from "../src/Session";
import { mockStorage } from "../../core/src/storage/__mocks__/StorageUtility";
import { rejects } from "assert";
import { ISessionInfo } from "@inrupt/solid-client-authn-core";

describe("Session", () => {
  describe("constructor", () => {
    it("accepts an empty config", async () => {
      const mySession = new Session({});
      expect(mySession.info.isLoggedIn).toEqual(false);
      expect(mySession.info.sessionId).toBeDefined();
    });

    it("accepts no config", async () => {
      const mySession = new Session();
      expect(mySession.info.isLoggedIn).toEqual(false);
      expect(mySession.info.sessionId).toBeDefined();
    });

    it("does not generate a session ID if one is provided", () => {
      const mySession = new Session({}, "mySession");
      expect(mySession.info.sessionId).toEqual("mySession");
    });

    it("accepts input storage", async () => {
      const insecureStorage = mockStorage({});
      const secureStorage = mockStorage({});
      const mySession = new Session({
        insecureStorage,
        secureStorage,
      });
      const clearSecureStorage = jest.spyOn(secureStorage, "delete");
      const clearInsecureStorage = jest.spyOn(insecureStorage, "delete");
      await mySession.logout();
      expect(clearSecureStorage).toHaveBeenCalled();
      expect(clearInsecureStorage).toHaveBeenCalled();
    });

    it("accepts session info", () => {
      const mySession = new Session({
        sessionInfo: {
          sessionId: "mySession",
          isLoggedIn: false,
          webId: "https://some.webid",
        },
      });
      expect(mySession.info.isLoggedIn).toEqual(false);
      expect(mySession.info.sessionId).toEqual("mySession");
      expect(mySession.info.webId).toEqual("https://some.webid");
    });
  });

  describe("login", () => {
    it("wraps up ClientAuthentication login", async () => {
      const clientAuthentication = mockClientAuthentication();
      const clientAuthnLogin = jest.spyOn(clientAuthentication, "login");
      const mySession = new Session({ clientAuthentication });
      await mySession.login({});
      expect(clientAuthnLogin).toHaveBeenCalled();
    });
  });

  describe("logout", () => {
    it("wraps up ClientAuthentication logout", async () => {
      const clientAuthentication = mockClientAuthentication();
      const clientAuthnLogout = jest.spyOn(clientAuthentication, "logout");
      const mySession = new Session({ clientAuthentication });
      await mySession.logout();
      expect(clientAuthnLogout).toHaveBeenCalled();
    });
  });

  describe("fetch", () => {
    it("wraps up ClientAuthentication fetch", async () => {
      const clientAuthentication = mockClientAuthentication();
      const clientAuthnFetch = jest.spyOn(clientAuthentication, "fetch");
      const mySession = new Session({ clientAuthentication });
      await mySession.fetch("https://some.url");
      expect(clientAuthnFetch).toHaveBeenCalled();
    });
  });

  describe("handleincomingRedirect", () => {
    it("wraps up ClientAuthentication handleIncomingRedirect", async () => {
      const clientAuthentication = mockClientAuthentication();
      const clientAuthnHandle = jest.spyOn(
        clientAuthentication,
        "handleIncomingRedirect"
      );
      const mySession = new Session({ clientAuthentication });
      await mySession.handleIncomingRedirect("https://some.url");
      expect(clientAuthnHandle).toHaveBeenCalled();
    });

    it("updates the session's info if relevant", async () => {
      const clientAuthentication = mockClientAuthentication();
      clientAuthentication.handleIncomingRedirect = jest.fn(
        async (_url: string) => {
          return {
            isLoggedIn: true,
            sessionId: "a session ID",
            webId: "https://some.webid#them",
          };
        }
      );
      const mySession = new Session({ clientAuthentication });
      expect(mySession.info.isLoggedIn).toEqual(false);
      await mySession.handleIncomingRedirect("https://some.url");
      expect(mySession.info.isLoggedIn).toEqual(true);
      expect(mySession.info.sessionId).toEqual("a session ID");
      expect(mySession.info.webId).toEqual("https://some.webid#them");
    });

    it("leaves the session's info unchanged if no session is obtained after redirect", async () => {
      const clientAuthentication = mockClientAuthentication();
      clientAuthentication.handleIncomingRedirect = jest.fn(
        async (_url: string) => undefined
      );
      const mySession = new Session({ clientAuthentication }, "mySession");
      await mySession.handleIncomingRedirect("https://some.url");
      expect(mySession.info.isLoggedIn).toEqual(false);
      expect(mySession.info.sessionId).toEqual("mySession");
    });

    function sleep(ms: number): Promise<void> {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }

    it("prevents from hitting the token endpoint twice with the same auth code", async () => {
      const clientAuthentication = mockClientAuthentication();
      const obtainedSession: ISessionInfo = {
        isLoggedIn: true,
        sessionId: "mySession",
      };
      let secondRequestIssued = false;
      const blockingRequest = async (): Promise<ISessionInfo> => {
        while (!secondRequestIssued) {
          await sleep(100);
        }
        return obtainedSession;
      };
      // The ClientAuthn's handleIncomingRedirect will only return when the
      // second Session's handleIncomingRedirect has been called.
      clientAuthentication.handleIncomingRedirect = jest.fn(
        async (_url: string) => blockingRequest()
      );
      const mySession = new Session({ clientAuthentication });
      const firstTokenRequest = mySession.handleIncomingRedirect(
        "https://my.app/?code=someCode&state=arizona"
      );
      const secondTokenRequest = mySession.handleIncomingRedirect(
        "https://my.app/?code=someCode&state=arizona"
      );
      secondRequestIssued = true;
      const tokenRequests = await Promise.all([
        firstTokenRequest,
        secondTokenRequest,
      ]);
      // One of the two token requests should not have reached the token endpoint
      // because the other was pending.
      expect(tokenRequests).toContain(undefined);
    });
  });

  describe("onLogin", () => {
    it("calls the registered callback on login", async (done) => {
      let hasBeenCalled = false;
      const myCallback = (): void => {
        hasBeenCalled = true;
        if (done) {
          done();
        }
      };
      const clientAuthentication = mockClientAuthentication();
      clientAuthentication.handleIncomingRedirect = jest.fn(
        async (_url: string) => {
          return {
            isLoggedIn: true,
            sessionId: "a session ID",
            webId: "https://some.webid#them",
          };
        }
      );
      const mySession = new Session({ clientAuthentication });
      mySession.onLogin(myCallback);
      await mySession.handleIncomingRedirect("https://some.url");
      expect(hasBeenCalled).toEqual(true);
    });

    it("does not call the registered callback if login isn't successful", async () => {
      const failCallback = (): void => {
        throw new Error(
          "Should *NOT* call callback - this means test has failed!"
        );
      };
      const clientAuthentication = mockClientAuthentication();
      clientAuthentication.handleIncomingRedirect = jest.fn(
        async (_url: string) => {
          return {
            isLoggedIn: false,
            sessionId: "a session ID",
            webId: "https://some.webid#them",
          };
        }
      );
      const mySession = new Session({ clientAuthentication });
      mySession.onLogin(failCallback);
      await expect(
        mySession.handleIncomingRedirect("https://some.url")
      ).resolves.not.toThrow();
    });
  });

  describe("onLogout", () => {
    it("calls the registered callback on logout", async (done) => {
      const myCallback = (): void => {
        if (done) {
          done();
        }
      };
      const mySession = new Session({
        clientAuthentication: mockClientAuthentication(),
      });
      mySession.onLogout(myCallback);
      await mySession.logout();
    });
  });
});
