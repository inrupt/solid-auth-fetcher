import { EventEmitter } from 'events'
import ISolidSession from './ISolidSession'
import { injectable, inject } from 'tsyringe'
import IStorage from './IStorage'
import IRequestInfo from '../authenticatedFetch/IRequestInfo'
import IResponseInfo from '../authenticatedFetch/IResponseInfo'
import IAuthenticatedFetcher from '../authenticatedFetch/IAuthenticatedFetcher'
import { URL } from 'url'
import ILoginHandler from '../login/ILoginHandler'
import ILoginOptions from '../login/ILoginOptions'
import NotImplementedError from '../util/NotImplementedError'

@injectable()
export default class Authenticator extends EventEmitter {

  constructor (
    @inject('storage') private storage: IStorage,
    @inject('authenticatedFetcher') private authenticatedFetcher: IAuthenticatedFetcher,
    @inject('loginHandler') private loginHandler: ILoginHandler
  ) {
    super()
  }

  trackSession (callback: (session?: ISolidSession) => any): void {
    this.on('session', callback)
  }

  async fetch (requestInfo: IRequestInfo): Promise<IResponseInfo> {
    // TODO: implement
    // const authToken = this.storage.get('requestCredentials')
    // return this.authenticatedFetcher.handle(authToken)
    throw new NotImplementedError('authenticator.fetch')
  }

  async login (loginOptions: ILoginOptions): Promise<void> {
    await this.loginHandler.handle(loginOptions)
  }
}
