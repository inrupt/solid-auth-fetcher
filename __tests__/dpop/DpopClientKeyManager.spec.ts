/**
 * Proprietary and Confidential
 *
 * Copyright 2020 Inrupt Inc. - all rights reserved.
 *
 * Do not use without explicit permission from Inrupt Inc.
 */

/**
 * Test for DPoPClientKeyManager
 */
import "reflect-metadata";
import { StorageUtilityMock } from "../../src/localStorage/__mocks__/StorageUtility";
import {
  JoseUtilityMock,
  JoseUtilityGenerateJWKResponse
} from "../../src/jose/__mocks__/JoseUtility";
import DpopClientKeyManager from "../../src/dpop/DpopClientKeyManager";
import IOidcOptions from "../../src/login/oidc/IOidcOptions";
import OidcHandlerCanHandleTests from "../login/oidc/oidcHandlers/OidcHandlerCanHandleTests";

describe("DpopClientKeyManager", () => {
  const defaultMocks = {
    joseUtility: JoseUtilityMock,
    storageUtility: StorageUtilityMock
  };
  function getDpopClientKeyManager(
    mocks: Partial<typeof defaultMocks> = defaultMocks
  ): DpopClientKeyManager {
    const dpopClientKeyManager = new DpopClientKeyManager(
      mocks.storageUtility ?? defaultMocks.storageUtility,
      mocks.joseUtility ?? defaultMocks.joseUtility
    );
    return dpopClientKeyManager;
  }

  describe("generateClientKeyIfNotAlready", () => {
    // Right now this doesn't matter, so we hard code it
    const hardCodedOidcOptions: IOidcOptions =
      OidcHandlerCanHandleTests["legacyImplicitFlowOidcHandler"][0].oidcOptions;

    it("should generate a key and save it if one does not exist", async () => {
      const storageRetrieverMock = StorageUtilityMock;
      storageRetrieverMock.safeGet.mockReturnValueOnce(Promise.resolve(null));
      const dpopClientKeyManager = getDpopClientKeyManager({
        storageUtility: storageRetrieverMock
      });

      await dpopClientKeyManager.generateClientKeyIfNotAlready(
        hardCodedOidcOptions
      );

      expect(StorageUtilityMock.set).toHaveBeenCalledWith(
        "clientKey",
        JSON.stringify(JoseUtilityGenerateJWKResponse)
      );
    });

    it("should not generate a client key and save it if one already exists", async () => {
      const storageUtilityMock = StorageUtilityMock;
      storageUtilityMock.safeGet.mockReturnValueOnce(
        Promise.resolve({ kty: "RSA" })
      );
      const dpopClientKeyManager = getDpopClientKeyManager({
        storageUtility: storageUtilityMock
      });

      await dpopClientKeyManager.generateClientKeyIfNotAlready(
        hardCodedOidcOptions
      );

      expect(storageUtilityMock.set).not.toHaveBeenCalled();
    });
  });

  describe("getClientKey", () => {
    it("should return the saved client key", async () => {
      const savedKey = { kty: "RSA" };
      const storageUtilityMock = StorageUtilityMock;
      storageUtilityMock.safeGet.mockReturnValueOnce(Promise.resolve(savedKey));
      const dpopClientKeyManager = getDpopClientKeyManager({
        storageUtility: storageUtilityMock
      });

      const clientKey = await dpopClientKeyManager.getClientKey();

      expect(clientKey).toBe(savedKey);
    });
  });
});
