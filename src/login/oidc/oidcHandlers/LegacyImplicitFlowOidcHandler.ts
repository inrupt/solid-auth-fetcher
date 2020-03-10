/**
 * Handler for the Legacy Implicit Flow
 */
import IOidcHandler from "../IOidcHandler";
import IOidcOptions from "../IOidcOptions";
import URL from "url-parse";
import { inject, injectable } from "tsyringe";
import { IFetcher } from "../../../util/Fetcher";
import { IDpopHeaderCreator } from "../../../dpop/DpopHeaderCreator";
import INeededAction from "../../../neededAction/INeededAction";
import INeededRedirectAction from "../../../neededAction/INeededRedirectAction";

@injectable()
export default class LegacyImplicitFlowOidcHandler implements IOidcHandler {
  constructor(
    @inject("fetcher") private fetcher: IFetcher,
    @inject("dpopHeaderCreator") private dpopHeaderCreator: IDpopHeaderCreator
  ) {}

  async canHandle(oidcLoginOptions: IOidcOptions): Promise<boolean> {
    return !!(
      oidcLoginOptions.issuerConfiguration.grantTypesSupported &&
      oidcLoginOptions.issuerConfiguration.grantTypesSupported.indexOf(
        "implicit"
      ) > -1
    );
  }

  async handle(oidcLoginOptions: IOidcOptions): Promise<INeededAction> {
    const requestUrl = new URL(
      oidcLoginOptions.issuerConfiguration.authorizationEndpoint.toString()
    );
    // TODO: include client_id, state, and nonce
    // Disable camel case rule because this query requires camel case
    /* eslint-disable @typescript-eslint/camelcase */
    const query: { [key: string]: string } = {
      response_type: "id_token token",
      redirect_url: oidcLoginOptions.redirectUrl.toString(),
      scope: "openid id_vc"
    };
    /* eslint-enable @typescript-eslint/camelcase */
    if (oidcLoginOptions.dpop) {
      query.dpop = await this.dpopHeaderCreator.createHeaderToken(
        oidcLoginOptions.issuer,
        "GET"
      );
    }
    requestUrl.set("query", query);

    // TODO: A lot of this seems to be sharable between different flows. Consider making sharable
    // code
    return {
      actionType: "redirect",
      redirectUrl: requestUrl.toString()
    } as INeededRedirectAction;
  }
}
