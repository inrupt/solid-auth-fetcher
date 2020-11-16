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

import "reflect-metadata";
import { mockStorageUtility } from "@inrupt/solid-client-authn-core";
import IssuerConfigFetcher from "./IssuerConfigFetcher";

jest.mock("cross-fetch");

/**
 * Test for IssuerConfigFetcher
 */
describe("IssuerConfigFetcher", () => {
  const defaultMocks = {
    storageUtility: mockStorageUtility({}),
  };

  function getIssuerConfigFetcher(
    mocks: Partial<typeof defaultMocks> = defaultMocks
  ): IssuerConfigFetcher {
    return new IssuerConfigFetcher(
      mocks.storageUtility ?? defaultMocks.storageUtility
    );
  }

  it("should return a config based on the fetched config if none was stored in the storage", async () => {
    const { Response } = jest.requireActual("cross-fetch");
    const fetchResponse = (new Response(
      JSON.stringify({
        issuer: "https://example.com",
        // eslint-disable-next-line camelcase
        claim_types_supported: "oidc",
        bleepBloop: "Meep Moop",
      })
    ) as unknown) as Response;
    const configFetcher = getIssuerConfigFetcher({
      storageUtility: mockStorageUtility({}),
    });
    jest.requireMock("cross-fetch").mockResolvedValueOnce(fetchResponse);
    const fetchedConfig = await configFetcher.fetchConfig(
      "https://arbitrary.url"
    );
    expect(fetchedConfig.issuer.startsWith("https:")).toBeTruthy();
    expect(fetchedConfig.issuer).toBe("https://example.com");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((fetchedConfig as any).claim_types_supported).toBeUndefined();
    expect(fetchedConfig.claimTypesSupported).toBe("oidc");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((fetchedConfig as any).bleepBloop).toBeUndefined();
  });

  it("should throw an error if the fetched config could not be converted to JSON", async () => {
    const fetchResponse = {
      json: async () => {
        throw new Error("Some error");
      },
    };
    jest.requireMock("cross-fetch").mockResolvedValueOnce(fetchResponse);
    const configFetcher = new IssuerConfigFetcher(mockStorageUtility({}));

    await expect(configFetcher.fetchConfig("https://some.url")).rejects.toThrow(
      "[https://some.url] has an invalid configuration: Some error"
    );
  });
});
