/**
 * A wrapper function for AJV schema validation
 */
import Ajv from 'ajv'

export function compileTypeof (type: string) {
  return (data: any) => {
    return typeof data === type // eslint-disable-line valid-typeof
  }
}

export function compileJoinedStringOf (strings: string[]) {
  return (data: string) => {
    return !data.split(' ').some(value => strings.includes(value))
  }
}

/**
 * Validates a given item and given schema. Throws and error if invalid
 * @param schema The schema to validate against
 * @param item The item to validate
 */
export default function validateSchema (
  schema: { title?: string, [key: string]: any },
  item: any,
  options: Partial<{
    throwError: boolean
  }> = {}
): boolean {
  const ajv = new Ajv()
  ajv.addKeyword('typeof', {
    compile: compileTypeof
  })
  ajv.addKeyword('joinedStringOf', {
    compile: compileJoinedStringOf
  })
  if (!ajv.validate(schema, item)) {
    let message = `${schema.title ? schema.title : 'schema'} is invalid`
    // istanbul ignore else: AJV's docs say this should always be set when validation fails,
    //                       so we cannot test it.
    if (ajv.errors) {
      message += ':'
      message += ajv.errors.map(err => `\n${err.dataPath} ${err.message}`).toString()
    }
    if (options.throwError) {
      throw new Error(message)
    }
    return false
  }
  return true
}
