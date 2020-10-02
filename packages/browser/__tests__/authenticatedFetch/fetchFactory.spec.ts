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
import { describe, it } from "@jest/globals";
import {
  buildBearerFetch,
  buildDpopFetch,
} from "../../src/authenticatedFetch/fetchFactory";
import { decodeJWT, generateJWK } from "../../src/jose/IsomorphicJoseUtility";

jest.mock("cross-fetch");

describe("buildBearerFetch", () => {
  it("returns a fetch holding the provided token", async () => {
    const fetch = jest.requireMock("cross-fetch") as {
      fetch: jest.Mock<
        ReturnType<typeof window.fetch>,
        [RequestInfo, RequestInit?]
      >;
    };
    const myFetch = buildBearerFetch("myToken");
    await myFetch("someUrl");
    expect(fetch).toHaveBeenCalledWith("someUrl", {
      headers: {
        Authorization: "Bearer myToken",
      },
    });
  });
});

describe("buildDpopFetch", () => {
  it("returns a fetch holding the provided token and key", async () => {
    const fetch = jest.requireMock("cross-fetch") as {
      fetch: jest.Mock<
        ReturnType<typeof window.fetch>,
        [RequestInfo, RequestInit?]
      >;
    };
    const key = await generateJWK("EC", "P-256", { alg: "ES256" });
    const myFetch = await buildDpopFetch("myToken", key);
    await myFetch("http://some.url");
    // We use ts-ignore comments here only to access mock call arguments
    /* eslint-disable @typescript-eslint/ban-ts-ignore */
    // @ts-ignore
    expect(fetch.fetch.mock.calls[0][1]?.headers["Authorization"]).toEqual(
      "DPoP myToken"
    );
    // @ts-ignore
    const dpopHeader = fetch.fetch.mock.calls[0][1]?.headers["DPoP"];
    /* eslint-enable @typescript-eslint/ban-ts-ignore */
    const decodedHeader = await decodeJWT(dpopHeader, key);
    expect(decodedHeader["htu"]).toEqual("http://some.url/");
    expect(decodedHeader["htm"]).toEqual("get");
  });
});
