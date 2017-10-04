
import { EOL } from 'os';
import { IMap } from './interfaces';
import { inspect } from 'util';
import { isNumber, isPlainObject, isString, isArray, isBoolean, isUndefined } from 'chek';

export interface IStackFrame {
  fileName: string;
  lineNumber: number;
  functionName: string;
  typeName: string;
  methodName: string;
  columnNumber: number;
  'native': boolean;
}

export class ErrorExtended {

  name: string;
  message: string;
  stack: string;
  meta: IMap<any> = null;
  stacktrace: string[];
  stackframes: any[];

  constructor(message: string,
    name?: string | IMap<any>,
    meta?: IMap<any> | number,
    prune?: number) {

    Error.captureStackTrace(this, this.constructor);

    if (isPlainObject(name)) {
      prune = <number>meta;
      meta = <IMap<any>>name;
      name = undefined;
    }

    if (isNumber(meta)) {
      prune = <number>meta;
      meta = undefined;
    }

    const constructName = this.constructor['name'];
    this.message = message;
    this.meta = <IMap<any>>meta;
    this.name = <string>name || constructName;
    this.stacktrace = this.prune(<number>prune);
    this.stackframes = this.parse();
    this.stack = this.stacktrace.join(EOL);
  }

  /**
   * Split
   * : Splits a stack by newline char.
   *
   * @param stack the stack to split.
   */
  split(stack?: string | string[]): string[] {
    if (isArray(stack))
      return stack as string[];
    return (<string>stack || this.stack || '').split(EOL);
  }

  /**
   * Prune
   * : Prunes a stack by the count specified.
   *
   * @param prune the rows to be pruned.
   * @param stack an optional stack to use as source.
   */
  prune(prune?: number, stack?: string | string[]) {

    prune = prune || 0;
    stack = this.split(stack);

    if (!prune)
      return stack as string[];

    const message = stack.shift(); // remove the message.
    const pruned = stack.slice(prune) as string[];
    pruned.unshift(message);
    return pruned;

  }

  /**
   * Parse
   * : Parses out stack trace into stack frames.
   *
   * @param stack the stack to get stack frames for.
   */
  parse(stack?: string | string[]): IStackFrame[] {

    stack = this.split(stack || this.stacktrace);

    function parseLine(line) {

      let obj = null;
      let method = null;
      let functionName = null;
      let typeName = null;
      let methodName = null;

      if (line[1]) {

        functionName = line[1];
        let methStart = functionName.lastIndexOf('.');

        if (functionName[methStart - 1] === '.')
          methStart--;

        if (methStart > 0) {

          obj = functionName.slice(0, methStart);
          method = functionName.slice(methStart + 1);

          let objEnd = obj.indexOf('.Module');

          if (objEnd > 0) {
            functionName = functionName.slice(objEnd + 1);
            obj = obj.slice(0, objEnd);
          }

        }

        typeName = null;
      }

      if (method) {
        typeName = obj;
        methodName = method;
      }

      if (method === '<anonymous>') {
        methodName = null;
        functionName = null;
      }

      return {
        functionName,
        typeName,
        methodName
      };

    }

    const mapped = stack.map((v) => {
      const line = v.match(/at (?:(.+)\s+\()?(?:(.+?):(\d+)(?::(\d+))?|([^)]+))\)?/);
      if (!line)
        return;
      const parsed = parseLine(line);
      return {
        fileName: line[2] || null,
        lineNumber: parseInt(line[3], 10) || null,
        functionName: parsed.functionName,
        typeName: parsed.typeName,
        methodName: parsed.methodName,
        columnNumber: parseInt(line[4], 10) || null,
        'native': line[5] === 'native'
      };
    });

    if (isUndefined(mapped[0]))
      mapped.shift();

    return mapped;

  }

  /**
   * Prettify
   * : Uses util.inspect to prettify the object.
   *
   * @param stack the stack to prettify.
   * @param depth the depth of the stack to process.
   * @param color wether to colorize.
   */
  prettify(stack?: string | string[], depth?: number | boolean, color?: boolean) {

    if (isBoolean(depth)) {
      color = <boolean>depth;
      depth = null;
    }

    depth = depth || null;
    color = isUndefined(color) ? true : color;

    stack = this.split(stack || this.stackframes);
    return inspect(stack, null, <number>depth, <boolean>color);

  }

}
