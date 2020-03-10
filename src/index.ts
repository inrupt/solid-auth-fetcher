import { RequestInfo, RequestInit, Response } from "node-fetch";
import ILoginOptions from "./login/ILoginOptions";
import ISolidSession from "./ISolidSession";
import ILoginInputOptions from "./ILoginInputOptions";
import AuthFetcher from "./AuthFetcher";
import getAuthFetcherWithDependencies from "./dependencies";
import validateSchema from "./util/validateSchema";
import IStorage from "./localStorage/IStorage";
import INeededAction from "./neededAction/INeededAction";

const authFetcher = getAuthFetcherWithDependencies({});

export async function login(options: ILoginInputOptions): Promise<INeededAction> {
  return authFetcher.login(options);
}

export async function fetch(
  url: RequestInfo,
  init: RequestInit
): Promise<Response> {
  return authFetcher.fetch(url, init);
}

export async function logout(): Promise<void> {
  return authFetcher.logout();
}

export async function getSession(): Promise<ISolidSession> {
  return authFetcher.getSession();
}

export async function uniqueLogin(
  options: ILoginInputOptions
): Promise<INeededAction> {
  return authFetcher.uniqueLogin(options);
}

export function onSession(callback: (session: ISolidSession) => unknown): void {
  return authFetcher.onSession(callback);
}

export function onLogout(callback: (session: ISolidSession) => unknown): void {
  return authFetcher.onLogout(callback);
}

export async function handleRedirect(url: string): Promise<ISolidSession> {
  return authFetcher.handleRedirect(url);
}

export function customAuthFetcher(options: { storage: IStorage }): AuthFetcher {
  return getAuthFetcherWithDependencies({ storage: options.storage });
}
