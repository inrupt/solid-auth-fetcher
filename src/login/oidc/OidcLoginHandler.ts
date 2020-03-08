/**
 * Handles Common Oidc login functions (Like fetching the configuration)
 */

import { injectable, inject } from "tsyringe";
import ILoginHandler from "../ILoginHandler";
import ILoginOptions from "../ILoginOptions";
import IOidcHandler from "./IOidcHandler";
import IOidcOptions from "./IOidcOptions";
import ConfigurationError from "../../errors/ConfigurationError";
import { IIssuerConfigFetcher } from "./IssuerConfigFetcher";
import IIssuerConfig from "./IIssuerConfig";
import { IDpopClientKeyManager } from "../../dpop/DpopClientKeyManager";
import URL from "url-parse";

@injectable()
export default class OidcLoginHandler implements ILoginHandler {
  constructor(
    @inject("oidcHandler") private oidcHandler: IOidcHandler,
    @inject("issuerConfigFetcher")
    private issuerConfigFetcher: IIssuerConfigFetcher,
    @inject("dpopClientKeyManager")
    private dpopClientKeyManager: IDpopClientKeyManager
  ) {}

  checkOptions(options: ILoginOptions): Error | null {
    if (!options.oidcIssuer) {
      return new ConfigurationError("OidcLoginHandler requires an oidcIssuer");
    }
    return null;
  }

  async canHandle(options: ILoginOptions): Promise<boolean> {
    return !this.checkOptions(options);
  }

  async handle(options: ILoginOptions): Promise<void> {
    // Check to ensure the login options are correct
    const optionsError: Error | null = this.checkOptions(options);
    if (optionsError) {
      throw optionsError;
    }

    // Fetch OpenId Config
    const issuerConfig: IIssuerConfig = await this.issuerConfigFetcher.fetchConfig(
      // TODO: fix this with interface
      options.oidcIssuer || new URL("https://random.com")
    );

    // Construct OIDC Options
    const OidcOptions: IOidcOptions = {
      // TODO: fix this
      issuer: options.oidcIssuer || new URL("https://random.com"),
      // TODO: differentiate if DPoP should be true
      dpop: true,
      // TODO: This constrains this library to browsers. Figure out what to do with redirect
      // eslint-disable-next-line
      // @ts-ignore
      redirectUrl: new URL(window.location.href),
      issuerConfiguration: issuerConfig
    };

    // Generate DPoP Key if needed
    // TODO: it might be a good idea to put DPoP related things outside of this file
    if (OidcOptions.dpop) {
      await this.dpopClientKeyManager.generateClientKeyIfNotAlready(
        OidcOptions
      );
    }

    // Call proper OIDC Handler
    await this.oidcHandler.handle(OidcOptions);
  }
}
