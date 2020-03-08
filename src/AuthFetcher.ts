import { RequestInfo, RequestInit, Response } from "node-fetch";
import ISolidSession from "./ISolidSession";
import ILoginInputOptions, {
  loginInputOptionsSchema
} from "./ILoginInputOptions";
import { injectable, inject } from "tsyringe";
import ILoginHandler from "./login/ILoginHandler";
import ILoginOptions from "./login/ILoginOptions";
import validateSchema from "./util/validateSchema";

@injectable()
export default class AuthFetcher {
  constructor(@inject("loginHandler") private loginHandler: ILoginHandler) {}

  async login(options: ILoginInputOptions): Promise<string> {
    throw new Error("Not Implemented");
  }

  async fetch(url: RequestInfo, init: RequestInit): Promise<Response> {
    throw new Error("Not Implemented");
  }

  async logout(): Promise<void> {
    throw new Error("Not Implemented");
  }

  async getSession(): Promise<ISolidSession> {
    throw new Error("Not Implemented");
  }

  async uniqueLogin(options: ILoginInputOptions): Promise<string> {
    // TODO: this should be improved. It mutates the input
    validateSchema(loginInputOptionsSchema, options, { throwError: true });
    // TODO: this type conversion is really bad
    return this.loginHandler.handle((options as unknown) as ILoginOptions);
  }

  onSession(callback: (session: ISolidSession) => unknown): void {
    throw new Error("Not Implemented");
  }

  async handleRedirect(url: string): Promise<void> {
    throw new Error("Not Implemented");
  }

  customAuthFetcher(options: {}): unknown {
    throw new Error("Not Implemented");
  }
}
