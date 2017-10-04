"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var events_1 = require("events");
var path_1 = require("path");
var vfile = require("vinyl-file");
var File = require("vinyl");
var through = require("through2");
var chek_1 = require("chek");
var DEFAULTS = {
    base: process.cwd() // a base dir within cwd for store.
};
var VStorIO = (function (_super) {
    __extends(VStorIO, _super);
    function VStorIO(options) {
        var _this = _super.call(this) || this;
        _this._cwd = process.cwd();
        _this._base = process.cwd();
        _this._store = {};
        _this.options = chek_1.extend({}, DEFAULTS, options);
        if (_this.options.base)
            _this._base = path_1.resolve(_this._cwd, _this.options.base);
        return _this;
    }
    /**
     * Load
     * : Loads a file or creates news on failed.
     *
     * @param path the file path to load.
     */
    VStorIO.prototype.load = function (path) {
        var file;
        try {
            file = vfile.readSync(path);
        }
        catch (ex) {
            file = this.create(path);
        }
        this._store[path] = file;
        return file;
    };
    /**
     * Create
     * : Creates a new Vinyl file.
     *
     * @param path the path to the file.
     * @param contents the file contents.
     */
    VStorIO.prototype.create = function (path, contents) {
        return new File({
            cwd: this._cwd,
            base: this._base,
            path: path,
            contents: contents || null
        });
    };
    /**
     * Get
     * : Gets file from store.
     *
     * @param path the path to get.
     */
    VStorIO.prototype.get = function (path) {
        path = path_1.resolve(this._base, path);
        return this._store[path] || this.load(path); // get from cache or load file.
    };
    /**
     * Set
     * : Set a file in the store.
     * @param file the file to save.
     */
    VStorIO.prototype.put = function (file) {
        this._store[file.path] = file;
        this.emit('change', file, this);
        return this;
    };
    /**
     * Each
     * : Iterator for stream.
     *
     * @param writer function for writing eack key and index.
     */
    VStorIO.prototype.each = function (writer) {
        var _this = this;
        chek_1.keys(this._store).forEach(function (k, i) {
            writer(_this._store[k], i);
        });
        return this;
    };
    /**
     * Stream
     * : Streams calling iterator for each file in store.
     */
    VStorIO.prototype.stream = function () {
        var _this = this;
        var stream = through.obj();
        setImmediate(function () {
            _this.each(stream.write);
            stream.end();
        });
        return stream;
    };
    return VStorIO;
}(events_1.EventEmitter));
exports.VStorIO = VStorIO;
//# sourceMappingURL=store.js.map