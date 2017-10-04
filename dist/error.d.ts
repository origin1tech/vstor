import { IMap } from './interfaces';
export interface IStackFrame {
    fileName: string;
    lineNumber: number;
    functionName: string;
    typeName: string;
    methodName: string;
    columnNumber: number;
    'native': boolean;
}
export declare class ErrorExtended {
    name: string;
    message: string;
    stack: string;
    meta: IMap<any>;
    stacktrace: string[];
    stackframes: any[];
    constructor(message: string, name?: string | IMap<any>, meta?: IMap<any> | number, prune?: number);
    /**
     * Split
     * : Splits a stack by newline char.
     *
     * @param stack the stack to split.
     */
    split(stack?: string | string[]): string[];
    /**
     * Prune
     * : Prunes a stack by the count specified.
     *
     * @param prune the rows to be pruned.
     * @param stack an optional stack to use as source.
     */
    prune(prune?: number, stack?: string | string[]): string[];
    /**
     * Parse
     * : Parses out stack trace into stack frames.
     *
     * @param stack the stack to get stack frames for.
     */
    parse(stack?: string | string[]): IStackFrame[];
    /**
     * Prettify
     * : Uses util.inspect to prettify the object.
     *
     * @param stack the stack to prettify.
     * @param depth the depth of the stack to process.
     * @param color wether to colorize.
     */
    prettify(stack?: string | string[], depth?: number | boolean, color?: boolean): string;
}
