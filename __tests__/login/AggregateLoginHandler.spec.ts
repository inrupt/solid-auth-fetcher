/**
 * Proprietary and Confidential
 *
 * Copyright 2020 Inrupt Inc. - all rights reserved.
 *
 * Do not use without explicit permission from Inrupt Inc.
 */

jest.mock("../../src/util/handlerPattern/AggregateHandler");

// Required by TSyringe:
import "reflect-metadata";
import AggregateLoginHandler from "../../src/login/AggregateLoginHandler";
import ILoginHandler from "../../src/login/ILoginHandler";
import AggregateHandler from "../../src/util/handlerPattern/AggregateHandler";

describe("AggregateLoginHandler", () => {
  it("should pass injected handlers to its superclass", () => {
    new AggregateLoginHandler((["Some handler"] as unknown) as ILoginHandler[]);

    expect((AggregateHandler as jest.Mock).mock.calls).toEqual([
      [["Some handler"]]
    ]);
  });
});
