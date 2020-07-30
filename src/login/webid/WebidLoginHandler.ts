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

/**
 * Handles login if a user's webid was provided
 */
import ILoginHandler from "../ILoginHandler";
import ILoginOptions from "../ILoginOptions";
import ISessionInfo from "../../sessionInfo/ISessionInfo";

export default class WebidLoginHandler implements ILoginHandler {
  async canHandle(loginOptions: ILoginOptions): Promise<boolean> {
    return false;
  }

  /**
   * Handles a given WebID by first dereferencing the WebId, then creating correct login options for
   * a future login handler and triggering that login handler. For example, if a WebID contains an
   * 'oidcIssuer' triple, it will create login credentials to match that
   * @param loginOptions
   */
  async handle(loginOptions: ILoginOptions): Promise<ISessionInfo> {
    // TODO: implement
    throw new Error("Not Implemented");
  }
}
