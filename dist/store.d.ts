/// <reference types="node" />
import { EventEmitter } from 'events';
import { Transform } from 'stream';
import * as File from 'vinyl';
import { IVinylOptions, VinylFile, IVStorOptions } from './interfaces';
export declare class VStorIO extends EventEmitter {
    private _cwd;
    private _base;
    private _store;
    options: IVinylOptions;
    constructor(options?: IVStorOptions);
    /**
     * Load
     * : Loads a file or creates news on failed.
     *
     * @param path the file path to load.
     */
    private load(path);
    /**
     * Create
     * : Creates a new Vinyl file.
     *
     * @param path the path to the file.
     * @param contents the file contents.
     */
    create(path: string, contents?: Buffer | NodeJS.ReadableStream): File;
    /**
     * Get
     * : Gets file from store.
     *
     * @param path the path to get.
     */
    get(path: string): VinylFile;
    /**
     * Set
     * : Set a file in the store.
     * @param file the file to save.
     */
    put(file: VinylFile): this;
    /**
     * Each
     * : Iterator for stream.
     *
     * @param writer function for writing eack key and index.
     */
    each(writer: {
        (file?: VinylFile, index?: any): void;
    }): this;
    /**
     * Stream
     * : Streams calling iterator for each file in store.
     */
    stream(): Transform;
}
