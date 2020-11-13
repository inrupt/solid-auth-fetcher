"use strict";
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
exports.__esModule = true;
var testcafe_1 = require("testcafe");
var FetchPage = /** @class */ (function () {
    function FetchPage() {
        this.fetchUriTextbox = testcafe_1.Selector("*").withAttribute("data-testid", "fetch_uri_textbox");
        this.fetchResponseTextbox = testcafe_1.Selector("*").withAttribute("data-testid", "fetch_response_textbox");
        this.fetchButton = testcafe_1.Selector("button").withText("Fetch");
        this.logoutButton = testcafe_1.Selector("button").withText("Log Out");
    }
    return FetchPage;
}());
exports["default"] = new FetchPage();
