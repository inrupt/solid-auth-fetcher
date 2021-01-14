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

import "reflect-metadata";
import { StorageUtilityMock } from "@inrupt/solid-client-authn-core";
import TokenSaver from "../../../../src/login/oidc/redirectHandler/TokenSaver";
import { SessionInfoManagerMock } from "../../../../src/sessionInfo/__mocks__/SessionInfoManager";

/**
 * Test for TokenSaver
 */
describe("TokenSaver", () => {
  const defaultMocks = {
    sessionCreator: SessionInfoManagerMock,
    storageUtility: StorageUtilityMock,
  };
  function getTokenSaver(
    mocks: Partial<typeof defaultMocks> = defaultMocks
  ): TokenSaver {
    return new TokenSaver(mocks.storageUtility ?? defaultMocks.storageUtility);
  }

  describe("saveTokenAndGetSession", () => {
    // TODO: Delete support for the implicit flow

    // eslint-disable-next-line jest/expect-expect
    it("Saves token and returns session", async () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const tokenSaver = getTokenSaver();
      // TODO: write this test once you have the right tokens
    });
  });
});
