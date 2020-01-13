import IRequestCredentials from '../IRequestCredentials'

export default interface IDPoPRequestCredentials extends IRequestCredentials {
  type: 'dpop',
  // TODO: actually fill in key and token
  clientKey: any,
  authToken: any
}
