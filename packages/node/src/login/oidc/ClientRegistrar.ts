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

import { inject, injectable } from "tsyringe";
import {
  IStorageUtility,
  IClientRegistrar,
  IIssuerConfig,
  IClient,
  IClientRegistrarOptions,
  NotImplementedError,
} from "@inrupt/solid-client-authn-core";

/**
 * @hidden
 */
@injectable()
export default class ClientRegistrar implements IClientRegistrar {
  constructor(
    @inject("storageUtility") private storageUtility: IStorageUtility
  ) {}

  async getClient(
    options: IClientRegistrarOptions,
    _issuerConfig: IIssuerConfig
  ): Promise<IClient> {
    // If client secret and/or client id are stored in storage, use those.
    const [
      storedClientId,
      storedClientSecret,
      // storedClientName,
    ] = await Promise.all([
      this.storageUtility.getForUser(options.sessionId, "clientId", {
        // FIXME: figure out how to persist secure storage at reload
        secure: false,
      }),
      this.storageUtility.getForUser(options.sessionId, "clientSecret", {
        // FIXME: figure out how to persist secure storage at reload
        secure: false,
      }),
      // this.storageUtility.getForUser(options.sessionId, "clientName", {
      //   // FIXME: figure out how to persist secure storage at reload
      //   secure: false,
      // }),
    ]);
    if (storedClientId) {
      return {
        clientId: storedClientId,
        clientSecret: storedClientSecret,
      };
    }
    const extendedOptions = { ...options };
    // If registration access token is stored, use that.
    extendedOptions.registrationAccessToken =
      extendedOptions.registrationAccessToken ??
      (await this.storageUtility.getForUser(
        options.sessionId,
        "registrationAccessToken"
      ));
    throw new NotImplementedError("getClient not implemented for Node");
  }
}