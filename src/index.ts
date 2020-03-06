import { RequestInfo, RequestInit, Response } from "node-fetch";
import ILoginOptions from "./login/ILoginOptions";
import ISolidSession from "./authenticator/ISolidSession";

export async function login(options: ILoginOptions): Promise<void> {
  throw new Error("Not Implemented");
}

export async function fetch(
  url: RequestInfo,
  init: RequestInit
): Promise<Response> {
  throw new Error("Not Implemented");
}

export async function logout(): Promise<void> {
  throw new Error("Not Implemented");
}

export async function getSession(): Promise<ISolidSession> {
  throw new Error("Not Implemented");
}

export async function uniqueLogin(options: ILoginOptions): Promise<void> {
  throw new Error("Not Implemented");
}

export function onSession(callback: (session: ISolidSession) => unknown): void {
  throw new Error("Not Implemented");
}

export async function handleRedirect(url: string): Promise<void> {
  throw new Error("Not Implemented");
}

export function customAuthFetcher(options: {}): unknown {
  throw new Error("Not Implemented");
}
