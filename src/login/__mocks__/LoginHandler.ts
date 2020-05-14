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

import ILoginHandler from "../ILoginHandler";
import { ILoggedOutSolidSession } from "../../solidSession/ISolidSession";
import INeededRedirectAction from "../../solidSession/INeededRedirectAction";
import ILoginOptions from "../ILoginOptions";

export const LoginHandlerResponse: ILoggedOutSolidSession = {
  loggedIn: false,
  localUserId: "global",
  neededAction: {
    actionType: "redirect",
    redirectUrl: "http://coolSite.com/redirect"
  } as INeededRedirectAction
};

export const LoginHandlerMock: jest.Mocked<ILoginHandler> = {
  canHandle: jest.fn((options: ILoginOptions) => Promise.resolve(true)),
  handle: jest.fn((options: ILoginOptions) =>
    Promise.resolve(LoginHandlerResponse)
  )
};
