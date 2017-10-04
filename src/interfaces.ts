import { Stats } from 'fs';
import * as File from 'vinyl';
import { Transform } from 'stream';

export type CopyTransform = (contents?: any, path?: string) => Buffer;
export type SaveCallback = (...args: any[]) => void;
export type ThroughFilter = (file: VinylFile, encoding: string, fn: Function) => void;
export type RendererMethod = (template: string, context: IMap<any>, partials?: any) => string;

export enum VinylState {
  modified = 0,
  deleted = 1
}

export interface IMap<T> {
  [key: string]: T;
}

export interface IVStorOptions {
  basePath: string;
  jsonSpacer: string | number;
}

export interface IVinylOptions {

  cwd?: string;
  base?: string;
  path?: string;
  history?: string[];
  stat?: Stats;
  contents?: Buffer | NodeJS.ReadableStream | null;
  [customOption: string]: any;

  // CUSTOM PROPS //

  state?: number;

}

/**
 * Note can't really extend typings for
 * vinyl File as it returns mutliple constructors
 * a bit hacky but we're just after the typings here.
 */
export interface VinylFile extends File {
  state?: number;
  isNew?: boolean;
}

export interface IMinimatchOptions {
  debug?: boolean;
  nobrace?: boolean;
  noglobstar?: boolean;
  dot?: boolean;
  noext?: boolean;
  nocase?: boolean;
  nonull?: boolean;
  matchBase?: boolean;
  nocomment?: boolean;
  nonegate?: boolean;
  flipNegate?: boolean;
}

export interface IGlobOptions extends IMinimatchOptions {
  cwd?: string;
  root?: string;
  dot?: boolean;
  nomount?: boolean;
  mark?: boolean;
  nosort?: boolean;
  stat?: boolean;
  silent?: boolean;
  strict?: boolean;
  cache?: { [path: string]: any /* boolean | string | string[] */ };
  statCache?: { [path: string]: Stats };
  symlinks?: any;
  sync?: boolean;
  nounique?: boolean;
  nonull?: boolean;
  debug?: boolean;
  nobrace?: boolean;
  noglobstar?: boolean;
  noext?: boolean;
  nocase?: boolean;
  matchBase?: any;
  nodir?: boolean;
  ignore?: any; /* string | string[] */
  follow?: boolean;
  realpath?: boolean;
  nonegate?: boolean;
  nocomment?: boolean;
  absolute?: boolean;
  /** Deprecated. */
  globDebug?: boolean;
}

export interface IReadMethods {
  toBuffer: () => Buffer | NodeJS.ReadableStream;
  toFile: () => VinylFile;
  toValue: <T>() => T;
}
