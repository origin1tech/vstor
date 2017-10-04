/// <reference types="node" />
import { EventEmitter } from 'events';
import { Transform } from 'stream';
import { Stats } from 'fs';
import { IGlobOptions, VinylFile, IMap, IReadMethods, CopyTransform, SaveCallback, IVStorOptions } from './interfaces';
export declare class VStor extends EventEmitter {
    private _cwd;
    private _base;
    private _store;
    options: IVStorOptions;
    constructor(options?: IVStorOptions);
    /**
     * Error
     * : Internal method for throwing errors.
     *
     * @param message the error's message.
     * @param meta any meta data.
     */
    private error(message, meta?);
    /**
     * Extend
     * : Extends glob options.
     *
     * @param options glob options.
     */
    private extendOptions(options?);
    /**
     * Common Dir
     * : Finds common path directory in array of paths.
     *
     * @param paths the file paths to find common directory for.
     */
    private commonDir(paths);
    /**
     * Normalize File
     * : Normalize ensuring result is Vinyl File.
     *
     * @param path the path or File to return.
     */
    private normalizeFile(path);
    /**
     * Exists With Value
     * : Ensures the file exists and has a value.
     *
     * @param path the path or file to ensure exists and has contents.
     */
    private existsWithValue(path);
    /**
     * Is Deleted
     * : Inspects file check if has deleted flag.
     *
     * @param path the path or Vinyl File to inspect.
     */
    private isDeleted(path);
    /**
     * Is JSON
     * : Checks if value is JSON.
     *
     * @param val the value to inspect as JSON.
     */
    private isJSON(val);
    private readAs(file, contents);
    /**
     * Load
     * : Loads a file or creates news on failed.
     *
     * @param path the file path to load.
     */
    private load(path);
    /**
     * Get
     * : Gets file from store.
     *
     * @param path the path to get.
     */
    private get(path);
    /**
     * Set
     * : Set a file in the store.
     * @param file the file to save.
     */
    private put(file);
    /**
     * Each
     * : Iterator for stream.
     *
     * @param writer function for writing eack key and index.
     */
    private each(writer);
    /**
     * Stream
     * : Streams calling iterator for each file in store.
     */
    private stream();
    readonly store: IMap<VinylFile>;
    /**
      * Globify
      * : Ensures file path is glob or append pattern.
      *
      * @param path the path or array of path and pattern.
      */
    private globify(path);
    /**
     * Resolve Key
     * : Takes a path and resolves it relative to base.
     *
     * @param key the key/path to be resolved.
     */
    resolveKey(key: string): string;
    /**
     * Has Key
     * : Inspects store checking if path key exists.
     *
     * @param key the key to inspect if exists in store.
     */
    hasKey(key: string): VinylFile;
    /**
     * Exists
     * : Checks if a file exists in the store.
     *
     * @param path a path or file to inspect if exists.
     */
    exists(path: string | VinylFile): boolean;
    /**
     * Is Empty
     * : Checks if file contents are null.
     *
     * @param path a path or file to inspect if is empty.
     */
    isEmpty(path: string | VinylFile): boolean;
    /**
     * Read
     * : Reads a file or path returns interace for
     * reading as Buffer, JSON, or String.
     *
     * @param path the Vinyl File or file path.
     * @param def any default values.
     */
    read(path: string | VinylFile, def?: any): IReadMethods;
    /**
     * Write
     * : Writes file to store, accepts Buffer, String or Object
     *
     * @param path the path or Vinyl File to write.
     * @param contents the contents of the file to be written.
     * @param data additinal properties to extend to contents when object.
     * @param stat an optional file Stat object.
     */
    write(path: string | VinylFile, contents: string | Buffer | IMap<any>, stat?: Stats): this;
    /**
     * Copy
     * : Copies source to destination or multiple sources to destination.
     *
     * @param from the path or paths as from source.
     * @param to the path or destination to.
     * @param options the glob options or content transform.
     * @param transform method for transforming content.
     */
    copy(from: string | string[], to: string, options?: IGlobOptions | CopyTransform, transform?: CopyTransform): this;
    /**
     * Move
     * : Moves file from one path to another.
     *
     * @param from the from path.
     * @param to the to path.
     * @param options glob options.
     */
    move(from: string, to: string, options?: IGlobOptions): this;
    /**
     * Append
     * : Appends a file with the specified contents.
     *
     * @param to the path of the file to append to.
     * @param content the content to be appended.
     * @param trim whether to not to trim trailing space.
     */
    append(to: string, content: string | Buffer | IMap<any>, trim?: boolean): this;
    /**
     * Remove
     * : Removes a file from the store.
     *
     * @param paths a path or array of paths to be removed.
     * @param options glob options used in removal.
     */
    remove(paths: string | string[], options?: IGlobOptions): this;
    /**
     * Save
     * : Saves to store.
     *
     * @param filters transform filters which will be piped to stream.
     * @param fn a callback function on done.
     */
    save(filters?: Transform[] | SaveCallback, fn?: SaveCallback): this;
}
