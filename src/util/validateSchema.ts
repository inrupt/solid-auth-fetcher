/**
 * Proprietary and Confidential
 *
 * Copyright 2020 Inrupt Inc. - all rights reserved.
 *
 * Do not use without explicit permission from Inrupt Inc.
 */

/**
 * A wrapper function for AJV schema validation
 */
import Ajv from "ajv";
import URL from "url-parse";
import { cloneDeep } from "lodash";

export function compileTypeof(type: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data: any): boolean => {
    return typeof data === type; // eslint-disable-line valid-typeof
  };
}

export function compileJoinedStringOf(strings: string[]) {
  return (data: string): boolean => {
    return !data.split(" ").some(value => strings.indexOf(value) === -1);
  };
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export function traverseObject(
  data: any,
  schema: any,
  parent?: any,
  parentKey?: any
): void {
  if (schema.type === "object") {
    Object.keys(data).forEach((key: string) => {
      if (schema.properties && schema.properties[key]) {
        traverseObject(data[key], schema.properties[key], data, key);
      }
    });
  } else if (schema.type === "array") {
    data.forEach((item: any, index: number) => {
      if (schema.items) {
        traverseObject(item, schema.items, data, index);
      }
    });
  } else {
    // Set custom rules here
    // Convert to URL
    if (schema.shouldConvertToUrl && parent && parentKey) {
      parent[parentKey] = new URL(data);
    }
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/**
 * Validates a given item and given schema. Throws and error if invalid
 * @param schema The schema to validate against
 * @param item The item to validate
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
export default function validateSchema(
  schema: { title?: string; [key: string]: any },
  inputItem: any
): any {
  /* eslint-enable @typescript-eslint/no-explicit-any */
  const item = cloneDeep(inputItem);
  const ajv = new Ajv();
  ajv.addKeyword("typeof", {
    compile: compileTypeof
  });
  ajv.addKeyword("joinedStringOf", {
    compile: compileJoinedStringOf
  });
  if (!ajv.validate(schema, item)) {
    let message = `${schema.title ? schema.title : "schema"} is invalid`;
    // istanbul ignore else: AJV's docs say this should always be set when validation fails,
    //                       so we cannot test it.
    if (ajv.errors) {
      message += ":";
      message += ajv.errors
        .map(err => `\n${err.dataPath} ${err.message}`)
        .toString();
    }
    throw new Error(message);
  }

  // If all is true, apply modifications
  traverseObject(item, schema);

  return item;
}
