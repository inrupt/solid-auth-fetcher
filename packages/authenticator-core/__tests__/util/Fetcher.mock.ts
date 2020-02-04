import IRequestCredentials from '../../src/authenticatedFetch/IRequestCredentials'
import { IFetcher } from '../../src/util/Fetcher'
import mFetch from 'jest-fetch-mock'
const mockFetch = mFetch as any
import URL from 'url-parse'

export default function FetcherMocks () {
  const FetcherResponse = mockFetch.mockResponse('someResponse')

  const FetcherMockFunction: jest.Mock<Promise<Response>, [IRequestCredentials, URL, RequestInit]> =
    jest.fn(
      async (creds: IRequestCredentials, url: URL, init: RequestInit) => {
        return FetcherResponse
      }
    )

  const FetcherMock: () => IFetcher = jest.fn<IFetcher, any[]>(() => ({
    fetch: FetcherMockFunction as any
  }))

  return {
    FetcherResponse,
    FetcherMock,
    FetcherMockFunction
  }
}
