import { sync as gsync, hasMagic as isGlob } from 'globby';
import { EventEmitter } from 'events';
import * as through from 'through2';
import { Transform } from 'stream';
import { resolve, join, relative, dirname, parse } from 'path';
import { existsSync, statSync, Stats, writeFileSync, mkdirSync } from 'fs';
import * as vfile from 'vinyl-file';
import * as File from 'vinyl';
import { sync as rimsync } from 'rimraf';
import { sync as mksync } from 'mkdirp';
import * as multimatch from 'multimatch';
import { EOL } from 'os';
import { IGlobOptions, VinylFile, VinylState, IMap, IReadMethods, CopyTransform, SaveCallback, ThroughFilter, IVStorOptions } from './interfaces';
import { extend, isString, isPlainObject, toArray, isArray, isBuffer, isDirectory, isFile, isFunction, isUndefined, keys, noopIf, isValue } from 'chek';

const GLOB_DEFAULTS: IGlobOptions = {
  nodir: true
};

const DEFAULTS: IVStorOptions = {
  basePath: process.cwd(), // a base dir within cwd for store.
  jsonSpacer: 2, // number or string ex: '\t'.
  saveOnExit: false,  // when true call save before exit, waitOnExit will be set to true.
  waitOnExit: false // when true waits to exit until save queue is empty.
};

export class VStor extends EventEmitter {

  private _cwd = process.cwd();
  private _base = process.cwd();
  private _store: IMap<VinylFile> = {};
  private _queue: Transform[] = [];

  options: IVStorOptions;

  constructor(options?: IVStorOptions) {

    super();
    this.options = extend<IVStorOptions>({}, DEFAULTS, options);

    if (this.options.basePath)
      this._base = resolve(this._cwd, this.options.basePath);

    if (this.options.waitOnExit || this.options.saveOnExit) {
      let type = this.options.saveOnExit ? 'save' : null;
      if (type === 'save')
        this.options.waitOnExit = true;
      type = !type && this.options.waitOnExit ? 'wait' : type;
      // only add listener if type.
      if (type) {
        process.on('exit', this.exitHandler.bind(this, type));
        process.on('uncaughtException', this.exitHandler.bind(this, 'error'));
      }
    }

  }

  // UTILS //

  /**
   * Exit Handler
   *
   * @param type the type of handler.
   * @param err uncaught error.
   */
  private exitHandler(type, err) {

    if (type === 'save')
      this.save();

    // Loop until queue is empty.
    const checkQueue = () => {
      if (this._queue.length) {
        setTimeout(() => {
          checkQueue();
        }, null);
      }
      else {
        process.removeListener('exit', this.exitHandler);
        process.removeListener('uncaughtException', this.exitHandler);
        if (err) throw err;
      }
    };

    checkQueue();

  }

  /**
   * Remove Transform
   * Removes transform from queue.
   *
   * @param transform to remove.
   */
  private removeQueue(transform: Transform) {
    if (~this._queue.indexOf(transform))
      this._queue.splice(this._queue.indexOf(transform), 1);
  }

  /**
   * Extend
   * : Extends glob options.
   *
   * @param options glob options.
   */
  private extendOptions(options?: IGlobOptions) {
    return extend({}, GLOB_DEFAULTS, options);
  }

  /**
   * Common Dir
   * : Finds common path directory in array of paths.
   *
   * @param paths the file paths to find common directory for.
   */
  private commonDir(paths: string | string[]) {

    paths = toArray<string>(paths)
      .filter((p) => {
        return p !== null && p.charAt(0) !== '!';
      });

    // splits path by fwd or back slashes.
    const exp = /\/+|\\+/;

    const result =
      (paths as string[])
        .slice(1)
        .reduce((p, f) => {
          if (!f.match(/^([A-Za-z]:)?\/|\\/))
            throw new Error('Cannot get directory using base directory of undefined.');
          const s = f.split(exp);
          let i = 0;
          while (p[i] === f[i] && i < Math.min(p.length, s.length))
            i++;
          return p.slice(0, i); // slice match.
        }, paths[0].split(exp));

    return result.length > 1 ? result.join('/') : '/';

  }

  /**
   * Normalize File
   * : Normalize ensuring result is Vinyl File.
   *
   * @param path the path or File to return.
   */
  private normalizeFile(path: string | VinylFile): VinylFile {
    return isString(path) ? this.get(<string>path) : <VinylFile>path;
  }

  /**
   * Exists With Value
   * : Ensures the file exists and has a value.
   *
   * @param path the path or file to ensure exists and has contents.
   */
  private existsWithValue(path: string | VinylFile) {
    return this.exists(path) && !this.isEmpty(path);
  }

  /**
   * Is Deleted
   * : Inspects file check if has deleted flag.
   *
   * @param path the path or Vinyl File to inspect.
   */
  private isDeleted(path: string | VinylFile) {
    return this.normalizeFile(path).state === VinylState.deleted;
  }

  /**
   * Is JSON
   * : Checks if value is JSON.
   *
   * @param val the value to inspect as JSON.
   */
  private isJSON(val: any) {
    try {
      return JSON.parse(val);
    }
    catch (ex) {
      return false;
    }

  }

  /**
   * Read As
   * : Private method for reading files.
   *
   * @param path the path or VinylFile to read.
   * @param def a default value on empty.
   */
  private readAs(path: string | VinylFile, def?: any):
    IReadMethods {

    const file = this.normalizeFile(path);

    if (this.isDeleted(path) || this.isEmpty(path) && !def)
      throw new Error(`${file.relative} could NOT be found.`);

    return {
      toBuffer: (): Buffer | NodeJS.ReadableStream => {
        return (file && file.contents) || def;
      },
      toFile: (): File => {
        return file || def;
      },
      toValue: <T>(): T => {
        if (!file || !file.contents)
          return def;
        const str = file.contents.toString();
        return this.isJSON(str) || str;
      }
    };

  }

  // VINYL FILE IO //

  /**
   * Load
   * : Loads a file or creates news on failed.
   *
   * @param path the file path to load.
   */
  private load(path: string) {
    let file;
    try {
      file = vfile.readSync(path);
    }
    catch (ex) {
      file = new File({
        cwd: this._cwd,
        base: this._base,
        path: path,
        contents: null
      });
    }
    this._store[path] = file;
    return file as VinylFile;
  }

  /**
   * Get
   * : Gets file from store.
   *
   * @param path the path to get.
   */
  private get(path: string): VinylFile {
    path = this.resolveKey(path);
    return this._store[path] || this.load(path); // get from cache or load file.
  }

  /**
   * Set
   * : Set a file in the store.
   * @param file the file to save.
   */
  private put(file: VinylFile) {
    this._store[file.path] = file;
    this.emit('changed', file, this);
    return this;
  }

  /**
   * Each
   * : Iterator for stream.
   *
   * @param writer function for writing eack key and index.
   */
  private each(writer: { (file?: VinylFile, index?: any): void }) {
    keys(this._store).forEach((k, i) => {
      writer(this._store[k], i);
    });
    return this;
  }

  /**
   * Stream
   * : Streams calling iterator for each file in store.
   */
  private stream() {
    const stream: Transform = through.obj();
    setImmediate(() => {
      this.each(stream.write.bind(stream));
      stream.end();
    });
    return stream;
  }

  // GETTERS //

  get store() {
    return this._store;
  }

  /**
   * Alias to move.
   */
  get rename() {
    return this.move;
  }

  // VSTOR METHODS //

  /**
    * Globify
    * : Ensures file path is glob or append pattern.
    *
    * @param path the path or array of path and pattern.
    */
  globify(path: string | string[]) {

    if (isArray(path)) // recursion if array.
      return (path as string[]).reduce((f, p) => f.concat(this.globify(p)));

    path = this.resolveKey(<string>path);

    if (isGlob(path)) // already a glob.
      return path;

    if (!existsSync(<string>path)) {
      if (this.hasKey(path)) // not written to disc yet.
        return path;
      return [
        path,
        join(<string>path, '**')
      ];
    }

    const stats = statSync(<string>path);

    if (stats.isFile())
      return path;

    if (stats.isDirectory())  // if dir append glob pattern.
      return join(<string>path, '**');

    throw new Error('Path is neither a file or directory.');

  }

  /**
   * Is Streaming
   * Flag indicating if is streaming.
   */
  get queue() {
    return this._queue;
  }

  /**
   * Resolve Key
   * : Takes a path and resolves it relative to base.
   *
   * @param key the key/path to be resolved.
   */
  resolveKey(key: string) {
    return resolve(this._base, key || '');
  }

  /**
   * Has Key
   * : Inspects store checking if path key exists.
   *
   * @param key the key to inspect if exists in store.
   */
  hasKey(key: string) {
    key = this.resolveKey(key);
    return this._store[key];
  }

  /**
   * Exists
   * : Checks if a file exists in the store.
   *
   * @param path a path or file to inspect if exists.
   */
  exists(path: string | VinylFile) {
    const file = this.normalizeFile(path);
    return file && file.state !== VinylState.deleted;
  }

  /**
   * Is Empty
   * : Checks if file contents are null.
   *
   * @param path a path or file to inspect if is empty.
   */
  isEmpty(path: string | VinylFile) {
    const file = this.normalizeFile(path);
    return file && file.contents === null;
  }

  /**
   * Read
   * : Reads a file or path returns interace for
   * reading as Buffer, JSON, or String.
   *
   * @param path the Vinyl File or file path.
   * @param def any default values.
   */
  read(path: string | VinylFile, def?: any): IReadMethods {
    return this.readAs(path, def);
  }

  /**
   * Write
   * : Writes file to store, accepts Buffer, String or Object
   *
   * @param path the path or Vinyl File to write.
   * @param contents the contents of the file to be written.
   * @param data additinal properties to extend to contents when object.
   * @param stat an optional file Stat object.
   */
  write(path: string | VinylFile, contents: string | Buffer | IMap<any>, stat?: Stats) {

    const file = this.normalizeFile(path);

    if (!isBuffer(contents) && !isString(contents) && !isPlainObject(contents))
      throw new Error(`Cannot write ${file.relative} expected Buffer, String or Object but got ${typeof contents}`);

    if (isPlainObject(contents))
      contents = JSON.stringify(contents, null, this.options.jsonSpacer || null);

    file.isNew = this.isEmpty(file);
    file.state = VinylState.modified;

    if (stat)
      file.stat = stat;

    file.contents = isString(contents) ? new Buffer(<string>contents) : <Buffer>contents;

    this.put(file);

    return this;

  }

  /**
   * Copy
   * : Copies source to destination or multiple sources to destination.
   *
   * @param from the path or paths as from source.
   * @param to the path or destination to.
   * @param options the glob options or content transform.
   * @param transform method for transforming content.
   */
  copy(from: string | string[], to: string, options?: IGlobOptions | CopyTransform, transform?: CopyTransform) {

    const copyFile = (_from: string, _to: string) => {
      if (!this.exists(_from))
        throw new Error(`Cannot copy from source ${_from} the path does NOT exist.`);
      let file: VinylFile = this.get(_from);
      let contents = file.contents;
      if (transform) // call transform if defined.
        contents = transform(contents, file.path);
      this.write(_to, contents, file.stat);
      file = this.read(_to).toFile();
      this.emit('copied', file, this);
    };

    if (isFunction(options)) { // allows transform as third option.
      transform = <CopyTransform>options;
      options = undefined;
    }

    let rootPath;
    const origFrom = from;
    to = this.resolveKey(to); // resolve output path from base.
    options = extend<IGlobOptions>({}, GLOB_DEFAULTS, options || {});

    from = this.globify(from); // globify will resolve from base.
    let paths = gsync(from, options);
    const matches = [];

    if (!paths.length && isString(from) && this.hasKey(<string>from))
      paths = [<string>from];

    this.each((f: VinylFile) => { // iterate store find matches.
      if (multimatch([f.path], paths).length !== 0)
        matches.push(f.path);
    });

    paths = paths.concat(matches); // concat glob paths w/ store matches.

    if (!paths.length)
      throw new Error(`Cannot copy using paths of undefined.`);

    if (isArray(from) || isGlob(from) || (!isArray(from) && !this.exists(<string>from))) {
      if (!existsSync(to) && !/\..*$/.test(to)) // make the dir
        mksync(to);
      if (!isDirectory(to)) // if not dir throw error.
        throw new Error('Destination must must be directory when copying multiple.');
      rootPath = this.commonDir(origFrom);
    }

    paths.forEach((f) => {
      if (rootPath) {
        // copy multiple.
        copyFile(f, join(to, relative(<string>rootPath, f)));
      }
      else {
        // copy single file.
        copyFile(f, to);
      }
    });

    return this;

  }

  /**
   * Move
   * : Moves file from one path to another.
   *
   * @param from the from path.
   * @param to the to path.
   * @param options glob options.
   */
  move(from: string, to: string, options?: IGlobOptions) {
    options = options || {};
    if (!isValue(options.nodir))
      options.nodir = false;
    options = this.extendOptions(options);
    this.copy(from, to, options);
    this.remove(from, options);
    const file = this.read(to).toFile();
    this.emit('moved', file, this);
    return this;
  }

  /**
   * Append
   * : Appends a file with the specified contents.
   *
   * @param to the path of the file to append to.
   * @param content the content to be appended.
   * @param trim whether to not to trim trailing space.
   */
  append(to: string, content: string | Buffer | IMap<any>, trim?: boolean) {
    let contents: any =
      this.read(to)
        .toValue<string>();
    trim = !isUndefined(trim) ? trim : true;
    if (trim)
      contents = contents.replace(/\s+$/, '');
    if (isPlainObject(content) || isPlainObject(contents)) {
      if (!isPlainObject(contents) || !isPlainObject(content)) // both must be object.
        throw new Error(`Attempted to append object using type ${typeof contents}.`);
      contents = extend<IMap<any>>({}, contents, content);
    }
    else {
      contents = contents + EOL + <string>content;
    }
    this.write(to, contents);
    const file = this.read(to).toFile();
    this.emit('appended', file, this);
    return this;
  }

  /**
   * Remove
   * : Removes a file from the store.
   *
   * @param paths a path or array of paths to be removed.
   * @param options glob options used in removal.
   */
  remove(paths: string | string[], options?: IGlobOptions) {

    options = options || {};
    if (!isValue(options.nodir))
      options.nodir = false;

    options = this.extendOptions(options);

    const removeFile = (p) => {
      const f = this.get(p);
      f.state = VinylState.deleted;
      f.contents = null;
      this.put(f);
      this.emit('removed', f, this);
    };

    paths = this.globify(
      toArray<string>(paths)
        .map(p => this.resolveKey(p))
    );

    const gPaths = gsync(paths, options); // set as 'deleted';

    gPaths.forEach(p => removeFile(p));

    this.each((f: VinylFile) => { // iterate store if match remove.
      if (multimatch([f.path], paths).length)
        removeFile(f.path);
    });

    return this;

  }

  /**
   * Save
   * : Saves to store.
   *
   * @param filters transform filters which will be piped to stream.
   * @param fn a callback function on done.
   */
  save(filters?: Transform[] | SaveCallback, fn?: SaveCallback) {

    if (isFunction(filters)) {
      fn = <SaveCallback>filters;
      filters = undefined;
    }

    let self = this;
    let store = this;
    filters = filters || [];

    const modifiy = through.obj(function (file: VinylFile, enc: string, done: Function) {
      if (file.state === VinylState.modified || (file.state === VinylState.deleted && !file.isNew))
        this.push(file);
      done();
    });

    filters = (filters as Transform[]).concat(modifiy);

    const save = through.obj(function (file: VinylFile, enc: string, done: Function) {
      store.put(file);
      if (file.state === VinylState.modified) {
        const dir = dirname(file.path);
        if (!existsSync(dir))
          mksync(dir);
        writeFileSync(file.path, file.contents, {
          mode: file.stat ? file.stat.mode : null
        });
      }
      else if (file.state === VinylState.deleted) {
        rimsync(file.path);
      }
      delete file.state; // remove custom prop.
      delete file.isNew; // remove custom prop.
      done();
    });

    filters.push(save);

    const stream: Transform = filters.reduce((s: Transform, filter: any) => {
      return s.pipe(filter);
    }, this.stream());

    this._queue.push(stream);

    return new Promise((resolve, reject) => {

      stream.on('error', (err: Error) => {
        this.removeQueue(stream);
        noopIf(fn)(err);
        reject(err);
      });

      stream.on('finish', () => {
        this.removeQueue(stream);
        noopIf(fn)();
        resolve();
      });

    });

  }

}