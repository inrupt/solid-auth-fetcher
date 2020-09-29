import { googleLogin } from '../helpers/login.js';

// Page Models
import fetchPage from '../page-models/fetchPage.js';

import { applicationURL, podUsername, podPassword, essPodServer, essBrokerService } from '../variables.js';

// Resources to test
const resources = require('./resources.json');

// Fetch Tests
fixture('Fetch tests (Google)')
    //.disablePageCaching
    //.disablePageReloads
    .page(applicationURL)
    .beforeEach( async t => {

        // Using Roles causes a sessionID error
        //await t.useRole(essGoogleUser);

        // Login
        await googleLogin('https://' + essBrokerService + '.' + essPodServer, podUsername, podPassword);
        await t.wait(2000);
        await t.expect(fetchPage.fetchButton.exists).ok("Logged in");
    });

// Process all of the resources
resources.forEach(data => {
    test(`Resource: '${data.Name}'`, async t => {

        await t
            .selectText(fetchPage.fetchURI)
            .typeText(fetchPage.fetchURI, data.URI)
            .click(fetchPage.fetchButton)
            .wait(2000)
            .expect(fetchPage.fetchResponse.textContent).contains(data.AuthorisedResponse, "Authorized");

    });
});
