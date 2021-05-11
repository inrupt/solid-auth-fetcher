# Solid-client-authn-* architecture

This document summarizes the architecture of the `@inrupt/solid-client-authn-*`
modules. It applies to both `@inrupt/solid-client-authn-node` and `@inrupt/solid-client-authn-browser`.

## Module map

https://github.com/inrupt/solid-client-authn-js is a lerna-based monorepo, which
means this single git repository actually hosts several NPM modules which are
related to each other. The following diagram shows an overview of the modules and their relations.

![Module dependencies](./documentation/diagrams/module_map.svg)

`@inrupt/solid-client-authn-node` and `@inrupt/solid-client-authn-browser`, grouped
under the "Client libraries" label are the modules we expect developers to import.
As their names imply, each  of these modules is specific to a given environment 
(NodeJS or the browser). However, they both have a very similar API and architecture,
and mostly differ by their main dependency, namely the third-party library implementing the
[OpenID Connect](https://openid.net/specs/openid-connect-core-1_0.html) protocol.
`@inrupt/solid-client-authn-node` depends on [`openid-client`](https://github.com/panva/node-openid-client/).
`@inrupt/solid-client-authn-browser` depends on `@inrupt/oidc-client-ext`. 
`@inrupt/oidc-client-ext` itself depends on [`oidc-client`](https://github.com/IdentityModel/oidc-client-js),
extending it with features we need, namely support for
[DPoP tokens](https://tools.ietf.org/html/draft-ietf-oauth-dpop-01) and 
[Dynamic Client Registration](https://openid.net/specs/openid-connect-registration-1_0.html).

The four modules are available in the [packages directory](./packages).

## OAuth2.0/OpenID Connect

The client libraries aim at helping developers authenticating users to their applications
using the [OpenID Connect](https://openid.net/specs/openid-connect-core-1_0.html)
protocol (often abbreviated OIDC). OIDC is a protocol based on the
[OAuth2.0](https://tools.ietf.org/html/rfc6749) framework. In order to understand
how the library internally works, some understanding of OAuth/OIDC is preferable.

### Helpful resources

Here is a list of things that helped this library's developers get a better
understanding of OAuth/OIDC: 
- [OAuth 2 in Action](https://www.manning.com/books/oauth-2-in-action), by Justin Richer and Antonio Sanso
- [OAuth masterclass](https://www.youtube.com/watch?v=egfyV2NV9Mw), by Justin Richer
- [How To Securely Implement Authentication in Single Page Applications](https://betterprogramming.pub/how-to-securely-implement-authentication-in-single-page-applications-670534da746f), by Dennis Stötzel

### Solid-OIDC

With the [Solid-OIDC specification](https://solid.github.io/authentication-panel/solid-oidc/), 
Solid extends the OIDC protocol in order to make it fit into a decentralized ecosystem.

In particular, Solid-OIDC introduces the notion of Client WebID, which enables
Client-managed identifiers instead of Issuer-managed identifiers. By using identifiers
they control, Clients are no longer required to get their identifiers from the Issuer
through either static or dynamic client registration. Solid-OIDC also makes the support for [Key-bound Access Tokens](https://tools.ietf.org/html/draft-fett-oauth-dpop-04)
(referred to as DPoP tokens) mandatory: it is only optional in traditional OIDC, where
Bearer tokens are the default option. DPoP tokens cannot be replayed by a Resource
Server to another Resource Server, which is an important security feature in a
decentralized ecosystem such as Solid's.

### A short glossary

Here is a list of terms having a specific meaning in the context of OIDC:
- **Resource Server**: The server hosting private resources. In our case, a Solid
server. A Resource Server receives requests authenticated with an Access Token.
Example: https://pod.inrupt.com. 
- **Resource Owner**: the user, who owns some private resources 
- **OIDC issuer**: the Solid Identity Provider, which issues Access Tokens, ID
tokens, and Refresh Tokens. These tokens tell the Resource Server that the user
has control over a certain identity (WebID), which can then use that information
to decide whether to give or deny access. Example: https://broker.pod.inrupt.com.
- **Client**: the application the Resource Owner uses to access its resources on
the Resource Server. Technically, OAuth is a delegation protocol: the Resource
Owner allows the Client to interact with the Resource Server on its behalf. Example:
https://podbrowser.inrupt.com.

## Codemap of the client library modules

Most architectural specificities are found in both client libraries modules. This
section will give a high-level description of the inner workings of both 
`@inrupt/solid-client-authn-node` and `@inrupt/solid-client-authn-browser`, leaving
aside anything too module-specific.

### The API

Most of the code for these modules is internal, and hidden from the user. The
public API is located in a file available directly in `packages/*/src/`, namely
in the `Session.ts` file. Users are expected to build a `Session` object, and to
use it to interact with the session. How users are expected to use the public API
is documented in our [public documentation](https://docs.inrupt.com/developer-tools/javascript/client-libraries/tutorial/authenticate/).

### The Handler pattern

Important components of this library are based on the Handler design pattern.
Given data contained in a request, a set of classes implementing a similar API
will declare whether or not they may handle said request. Handlers declare two
functions: `canHandle(request)` and `handle(request)`. `canHandle` simply returns
a boolean indicating the ability of the handler to handle the request, and `handle`
actually processes it. All of the handlers for a given type of requests are tracked
by a handler aggregator, which will have the first handle for which `canHandle`
returns `true` process the request. The handler aggregator has the same API as
the handlers it aggregates, and brokers the request to the underlying handlers.
More on that in the Dependency Injection section.

In the context of this library, a request is an API call to execute some OIDC-related
operation, for instance redirect the Resource Owner to the OIDC issuer, or process
the data sent by the OIDC issuer to the Client. Handlers will determine whether 
they can handle the request based on the options specified by the code snippet making
the call.

#### Login

Logging in is an operation initiated by the Client. It may result in one of the following:
- a redirection of the Resource Owner to the Issuer's authorization endpoint
- a request by the Client to the Issuer's token endpoint
Handlers for the login operation are located in `packages/*/src/login/oidc/oidcHandlers/*Handler.ts`.

#### Incoming redirect

The incoming redirect is an operation initiated by the Issuer.
At the Issuer webpage, the Resource Owner authenticates (e.g. by entering a username
and a password), after which the Issuer sends them to a webpage under the Client
app's control (its `redirect_uri`), to which it appends some query parameters that
it can use to complete the login flow. This is done when the developer calls 
`handleIncomingRedirect`, and the Handlers for the incoming redirect are located
in `packages/*/src/login/oidc/redirectHandler/*Handler.ts`.

### Dependency injection

An important architectural component of this library is dependency injection,
implemented here using [TSyringe](https://github.com/Microsoft/tsyringe). Dependencies
are declared in `packages/*/src/dependencies.ts`.

#### Declaring order

Something important to realize is that the order in which the dependencies are
declared (for a given container) matters. Let's have a look at some code to make
things clearer.

```
container.register<IOidcHandler>("browser:oidcHandler", {
  useClass: AggregateOidcHandler,
});
container.register<IOidcHandler>("browser:oidcHandlers", {
  useClass: RefreshTokenOidcHandler,
});
container.register<IOidcHandler>("browser:oidcHandlers", {
  useClass: AuthorizationCodeWithPkceOidcHandler,
});
container.register<IOidcHandler>("browser:oidcHandlers", {
  useClass: ClientCredentialsOidcHandler,
});
```

Here, `AggregateOidcHandler` is the handler aggregator (as defined in the Handler
Pattern section), and `RefreshTokenOidcHandler`, `AuthorizationCodeWithPkceOidcHandler`
and `ClientCredentialsOidcHandler` are its underlying handlers. When receiving a
request, `AggregateOidcHandler` will first call to its instance of `RefreshTokenOidcHandler`
to check if it can handle it. If so, the instance of `RefreshTokenOidcHandler`
will handle the request, and the instances of `AuthorizationCodeWithPkceOidcHandler`
or `ClientCredentialsOidcHandler` will not be called. This means that it is
important to declare the dependencies from the most specialized to the most generic,
because if a fallback handler that can handle all requests is declared first,
the other more specialized handlers will not be called.

Note that the label for the containers of the aggregator and the underlying handlers
differ (respectively `browser:oidcHandler` and `browser:oidcHandlers`, with an 's',
in the above example). In this case, the order in which the dependencies are
declared is irrelevant, because they do not relate to the same container. The
Aggregator implements the class from `packages/core/src/util/handlerPattern/AggregateHandler.ts`,
and uses the `@injectAll` annotation to receive all the handlers registered to a
given container.

#### Mocks and tests

Dependency injection makes the codebase more flexible, because it is only at
runtime that each component will be presented with the dependencies it declared,
which means it is easier to add a dependency to a component without changing the
whole codebase.

However, mocking dependency injection in test code wouldn't bring any value.
Instead, the object we want to test can be constructed with mocked dependencies
provided to its constructor. For instance, a class such as

```
@injectable()
export default class RefreshTokenOidcHandler implements IOidcHandler {
  constructor(
    @inject("node:tokenRefresher") private tokenRefresher: ITokenRefresher,
    @inject("node:storageUtility") private storageUtility: IStorageUtility
  ) {}
  // ...
```

can be tested as follows: 
```
const refreshTokenOidcHandler = new RefreshTokenOidcHandler(
  someMockedTokenRefresher,
  someMockedStorageUtility
);
```

## Mapping OIDC flows to the code

### Unsupported flows

There are some OIDC flows that we intentionally don't plan on supporting:
- The [Implicit flow](https://openid.net/specs/openid-connect-core-1_0.html#ImplicitFlowAuth),
which is widely recognized as having security issues, and doesn't bring value compared
to the Auth Code flow.
- The Refresh flow **in a browser context**. We do implement the efresh flow for
NodeJS, but there are limitations that prevent it from being applicable in a
browser context:
  - Users must always be prompted when a refresh token is requested, which prevents
  silent authentication.
  - There is no secure place where the Refresh Token may be stored in the browser
  across page reload,  which means the token would be lost on reload, which defeats
  the purpose of having a long-lived token anyway. The 
  [best security practices document for OAuth](https://tools.ietf.org/html/draft-ietf-oauth-security-topics-18#section-4.13)
  contains some recommandations on handling Refresh Tokens securely.

### Auth code flow

![Module dependencies](./documentation/diagrams/auth_code_flow.svg)

- Discovery: `packages/*/src/login/oidc/IssuerConfigFetcher.ts`
- Registration: `packages/*/src/login/oidc/ClientRegistrar.ts`
- OIDC handler: `packages/*/src/login/oidc/oidcHandlers/AuthorizationCodeWithPkceOidcHandler.ts`
- Handle incoming redirect: `packages/*/src/login/oidc/redirectHandler/*Handler.ts`,
the specific Handler depends on which Handler's `canHandle()` method first returns
`true`.

### Refresh flow

![Module dependencies](./documentation/diagrams/refresh_flow.svg)

- OIDC handler: `packages/*/src/login/oidc/oidcHandlers/RefreshTokenOidcHandler.ts`

Note that in this case, no redirection happens (i.e. there's only a Back channel
exchange): the Access Token is received directly as a response to the request
containing the Refresh Token.
