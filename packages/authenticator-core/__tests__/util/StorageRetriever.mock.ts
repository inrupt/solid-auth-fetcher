import { IStorageRetriever } from '../../src/util/StorageRetriever'

export default function StorageRetrieverMocks (result?: any) {
  let StorageRetrieverMockResponse: Object
  if (!result && result !== null) {
    StorageRetrieverMockResponse = {
      someKey: 'someString'
    }
  } else {
    StorageRetrieverMockResponse = result
  }

  const StorageRetrieverMockFunction = jest.fn(
    async (key: string) => {
      return StorageRetrieverMockResponse
    }
  )

  const StorageRetrieverMock: () => IStorageRetriever = jest.fn<IStorageRetriever, any[]>(() => ({
    retrieve: StorageRetrieverMockFunction
  }))

  return {
    StorageRetrieverMockResponse,
    StorageRetrieverMockFunction,
    StorageRetrieverMock
  }
}
