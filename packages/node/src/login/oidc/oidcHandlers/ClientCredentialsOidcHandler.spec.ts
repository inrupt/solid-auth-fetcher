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
import { StorageUtilityMock } from "@inrupt/solid-client-authn-core";
import AuthorizationCodeWithPkceOidcHandler from "./AuthorizationCodeWithPkceOidcHandler";
import { SessionInfoManagerMock } from "../../../sessionInfo/__mocks__/SessionInfoManager";
import { standardOidcOptions } from "../__mocks__/IOidcOptions";
import { RedirectorMock } from "../__mocks__/Redirector";
import ClientCredentialsOidcHandler from "./ClientCredentialsOidcHandler";

describe("ClientCredentialsOidcHandler", () => {
  const defaultMocks = {
    sessionCreator: SessionInfoManagerMock,
    storageUtility: StorageUtilityMock,
    redirector: RedirectorMock,
  };

  function getClientCredentialsOidcHandler(
    mocks: Partial<typeof defaultMocks> = defaultMocks
  ): ClientCredentialsOidcHandler {
    return new AuthorizationCodeWithPkceOidcHandler(
      mocks.storageUtility ?? defaultMocks.storageUtility,
      mocks.redirector ?? defaultMocks.redirector
    );
  }

  describe("canHandle", () => {
    it("doesn't handle anything", async () => {
      const clientCredentialsOidcHandler = getClientCredentialsOidcHandler();
      await expect(
        clientCredentialsOidcHandler.canHandle(standardOidcOptions)
      ).resolves.toEqual(false);
    });
  });

  describe("handle", () => {
    it("isn't implemented yet", async () => {
      const clientCredentialsOidcHandler = getClientCredentialsOidcHandler();
      await expect(() =>
        clientCredentialsOidcHandler.handle(standardOidcOptions)
      ).rejects.toThrow("not implemented");
    });
  });
});