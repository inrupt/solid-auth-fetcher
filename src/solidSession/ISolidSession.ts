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

import INeededAction from "./INeededAction";

/**
 * Defines the data that should be persisted
 */
type ISolidSession = ILoggedInSolidSession | ILoggedOutSolidSession;
export default ISolidSession;

export interface ICoreSolidSession {
  localUserId: string;
  neededAction: INeededAction;
}

export interface ILoggedInSolidSession extends ICoreSolidSession {
  loggedIn: true;
  webId: string;
  state?: string;
  logout: () => Promise<void>;
  fetch: (url: RequestInfo, init?: RequestInit) => Promise<Response>;
}

export interface ILoggedOutSolidSession extends ICoreSolidSession {
  loggedIn: false;
}
