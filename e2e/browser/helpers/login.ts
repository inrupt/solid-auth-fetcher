// Login via ESS Broker using various Auth0 workflows.

import { Selector, t } from 'testcafe';
import loginPage from '../page-models/loginPage';

// Login using NSS User
export async function nssLogin(brokerURL, username, password) {

    // Log in via ESS Broker service
    await loginPage.submitLoginForm(brokerURL);

    await t
        .typeText('#username', username)
        .typeText('#password', password)
        .click('#login');
};


// Login using Google
export async function essGoogleLogin(brokerURL, username, password) {

    console.log("STARTING GOOGLE LOGIN");
    // Log in via ESS Broker service
    await loginPage.submitLoginForm(brokerURL);

    // Select Google
    await t
        .click('#wrap [alt="Google"]');

    // Enter login information
    await t
        .typeText('#identifierId', username)
        .click('#identifierNext .VfPpkd-RLmnJb')
        .typeText('#password .whsOnd.zHQkBf', password)
        .click('#passwordNext .VfPpkd-RLmnJb');

    // Authorize the application
    await t
        .click('#wrap .btn.btn-success.btn-large');
};


// Login using Twitter
export async function essTwitterLogin(brokerURL, username, password) {

    // Log in via ESS Broker service
    await loginPage.submitLoginForm(brokerURL);

    await t
        .click('#wrap [alt="Auth0"]');

    await t
        .click(Selector('#auth0-lock-container-1 div').withText('Sign in with Twitter').nth(19));

    await t
        .typeText('#username_or_email', username)
        .typeText('#password', password)
        .click('#allow');

    await t
        .click('#wrap > div.container.main > div > form > div:nth-child(2) > input.btn.btn-success.btn-large');
};


// ESS (GitHub) User
export async function essGithubLogin(brokerURL, username, password) {
    
    // Log in via ESS Broker service
    await loginPage.submitLoginForm(brokerURL);

    await t
        .click('#wrap [alt="Auth0"]');

    await t
        .click(Selector('#auth0-lock-container-1 div').withText('Sign in with GitHub').nth(19));

    await t
        .typeText('main .form-control.input-block', username)
        .typeText(Selector('main .form-control.form-control.input-block').nth(1), password)
        .click('main .btn.btn-primary.btn-block');

    await t
        .click('#wrap .btn.btn-success.btn-large');
};
