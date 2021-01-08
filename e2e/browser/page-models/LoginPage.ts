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

import { t, Selector } from "testcafe";

class LoginPage {
  loginButton: Selector;
  identityProviderTextbox: Selector;

  constructor() {
    this.loginButton = Selector("button").withText("Log In");
    this.identityProviderTextbox = Selector("*").withAttribute(
      "data-testid",
      "identity_provider_textbox"
    );
  }

  async submitLoginForm(identityServerUri: string) {
    // If this select fails, it probably means our client application is not
    // running (since all we're trying to do here is select the identity
    // provider IRI textbox from a client application, so we can log into that
    // provider).
    // See our README, which recommends running 'demoClientApp' from the
    // examples within our browser package.
    await t
      .selectText(this.identityProviderTextbox)
      .typeText(this.identityProviderTextbox, identityServerUri)
      .click(this.loginButton);
  }
}

export default new LoginPage();
