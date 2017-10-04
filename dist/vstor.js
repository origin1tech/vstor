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
var globby_1 = require("globby");
var events_1 = require("events");
var through = require("through2");
var path_1 = require("path");
var fs_1 = require("fs");
var vfile = require("vinyl-file");
var File = require("vinyl");
var rimraf_1 = require("rimraf");
var mkdirp_1 = require("mkdirp");
var multimatch = require("multimatch");
var os_1 = require("os");
var error_1 = require("./error");
var interfaces_1 = require("./interfaces");
var chek_1 = require("chek");
var GLOB_DEFAULTS = {
    nodir: true
};
var DEFAULTS = {
    basePath: process.cwd(),
    jsonSpacer: 2 // number or string ex: '\t'.
};
var VStor = /** @class */ (function (_super) {
    __extends(VStor, _super);
    function VStor(options) {
        var _this = _super.call(this) || this;
        _this._cwd = process.cwd();
        _this._base = process.cwd();
        _this._store = {};
        _this.options = chek_1.extend({}, DEFAULTS, options);
        if (_this.options.basePath)
            _this._base = path_1.resolve(_this._cwd, _this.options.basePath);
        return _this;
    }
    // UTILS //
    /**
     * Error
     * : Internal method for throwing errors.
     *
     * @param message the error's message.
     * @param meta any meta data.
     */
    VStor.prototype.error = function (message, meta) {
        var name = 'Vstor:FileSys';
        throw new error_1.ErrorExtended(message, name, meta, 1);
    };
    /**
     * Extend
     * : Extends glob options.
     *
     * @param options glob options.
     */
    VStor.prototype.extendOptions = function (options) {
        return chek_1.extend({}, GLOB_DEFAULTS, options);
    };
    /**
     * Common Dir
     * : Finds common path directory in array of paths.
     *
     * @param paths the file paths to find common directory for.
     */
    VStor.prototype.commonDir = function (paths) {
        var _this = this;
        paths = chek_1.toArray(paths)
            .filter(function (p) {
            return p !== null && p.charAt(0) !== '!';
        });
        // splits path by fwd or back slashes.
        var exp = /\/+|\\+/;
        var result = paths
            .slice(1)
            .reduce(function (p, f) {
            if (!f.match(/^([A-Za-z]:)?\/|\\/))
                _this.error('cannot get directory using base directory of undefined.');
            var s = f.split(exp);
            var i = 0;
            while (p[i] === f[i] && i < Math.min(p.length, s.length))
                i++;
            return p.slice(0, i); // slice match.
        }, paths[0].split(exp));
        return result.length > 1 ? result.join('/') : '/';
    };
    /**
     * Normalize File
     * : Normalize ensuring result is Vinyl File.
     *
     * @param path the path or File to return.
     */
    VStor.prototype.normalizeFile = function (path) {
        return chek_1.isString(path) ? this.get(path) : path;
    };
    /**
     * Exists With Value
     * : Ensures the file exists and has a value.
     *
     * @param path the path or file to ensure exists and has contents.
     */
    VStor.prototype.existsWithValue = function (path) {
        return this.exists(path) && !this.isEmpty(path);
    };
    /**
     * Is Deleted
     * : Inspects file check if has deleted flag.
     *
     * @param path the path or Vinyl File to inspect.
     */
    VStor.prototype.isDeleted = function (path) {
        return this.normalizeFile(path).state === interfaces_1.VinylState.deleted;
    };
    /**
     * Is JSON
     * : Checks if value is JSON.
     *
     * @param val the value to inspect as JSON.
     */
    VStor.prototype.isJSON = function (val) {
        try {
            return JSON.parse(val);
        }
        catch (ex) {
            return false;
        }
    };
    VStor.prototype.readAs = function (file, contents) {
        var _this = this;
        return {
            toBuffer: function () {
                return contents;
            },
            toFile: function () {
                return file;
            },
            toValue: function () {
                var str = contents.toString();
                return _this.isJSON(str) || str;
            }
        };
    };
    // VINYL FILE IO //
    /**
     * Load
     * : Loads a file or creates news on failed.
     *
     * @param path the file path to load.
     */
    VStor.prototype.load = function (path) {
        var file;
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
        return file;
    };
    /**
     * Get
     * : Gets file from store.
     *
     * @param path the path to get.
     */
    VStor.prototype.get = function (path) {
        path = this.resolveKey(path);
        return this._store[path] || this.load(path); // get from cache or load file.
    };
    /**
     * Set
     * : Set a file in the store.
     * @param file the file to save.
     */
    VStor.prototype.put = function (file) {
        this._store[file.path] = file;
        this.emit('changed', file, this);
        return this;
    };
    /**
     * Each
     * : Iterator for stream.
     *
     * @param writer function for writing eack key and index.
     */
    VStor.prototype.each = function (writer) {
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
    VStor.prototype.stream = function () {
        var _this = this;
        var stream = through.obj();
        setImmediate(function () {
            _this.each(stream.write.bind(stream));
            stream.end();
        });
        return stream;
    };
    Object.defineProperty(VStor.prototype, "store", {
        // GETTERS //
        get: function () {
            return this._store;
        },
        enumerable: true,
        configurable: true
    });
    // VSTOR METHODS //
    /**
      * Globify
      * : Ensures file path is glob or append pattern.
      *
      * @param path the path or array of path and pattern.
      */
    VStor.prototype.globify = function (path) {
        var _this = this;
        if (chek_1.isArray(path))
            return path.reduce(function (f, p) { return f.concat(_this.globify(p)); });
        path = this.resolveKey(path);
        if (globby_1.hasMagic(path))
            return path;
        if (!fs_1.existsSync(path)) {
            if (this.hasKey(path))
                return path;
            return [
                path,
                path_1.join(path, '**')
            ];
        }
        var stats = fs_1.statSync(path);
        if (stats.isFile())
            return path;
        if (stats.isDirectory())
            return path_1.join(path, '**');
        this.error('path is neither a file or directory.');
    };
    /**
     * Resolve Key
     * : Takes a path and resolves it relative to base.
     *
     * @param key the key/path to be resolved.
     */
    VStor.prototype.resolveKey = function (key) {
        return path_1.resolve(this._base, key || '');
    };
    /**
     * Has Key
     * : Inspects store checking if path key exists.
     *
     * @param key the key to inspect if exists in store.
     */
    VStor.prototype.hasKey = function (key) {
        key = this.resolveKey(key);
        return this._store[key];
    };
    /**
     * Exists
     * : Checks if a file exists in the store.
     *
     * @param path a path or file to inspect if exists.
     */
    VStor.prototype.exists = function (path) {
        var file = this.normalizeFile(path);
        return file && file.state !== interfaces_1.VinylState.deleted;
    };
    /**
     * Is Empty
     * : Checks if file contents are null.
     *
     * @param path a path or file to inspect if is empty.
     */
    VStor.prototype.isEmpty = function (path) {
        var file = this.normalizeFile(path);
        return file && file.contents === null;
    };
    /**
     * Read
     * : Reads a file or path returns interace for
     * reading as Buffer, JSON, or String.
     *
     * @param path the Vinyl File or file path.
     * @param def any default values.
     */
    VStor.prototype.read = function (path, def) {
        var file = this.normalizeFile(path);
        if (this.isDeleted(path) || this.isEmpty(path)) {
            if (!def)
                this.error(file.relative + " could NOT be found.");
            return def;
        }
        return this.readAs(file, file.contents);
    };
    /**
     * Write
     * : Writes file to store, accepts Buffer, String or Object
     *
     * @param path the path or Vinyl File to write.
     * @param contents the contents of the file to be written.
     * @param data additinal properties to extend to contents when object.
     * @param stat an optional file Stat object.
     */
    VStor.prototype.write = function (path, contents, stat) {
        var file = this.normalizeFile(path);
        if (!chek_1.isBuffer(contents) && !chek_1.isString(contents) && !chek_1.isPlainObject(contents))
            this.error("cannot write " + file.relative + " expected Buffer or String but got " + typeof contents);
        if (chek_1.isPlainObject(contents))
            contents = JSON.stringify(contents, null, this.options.jsonSpacer || null);
        file.isNew = this.isEmpty(file);
        file.state = interfaces_1.VinylState.modified;
        if (stat)
            file.stat = stat;
        file.contents = chek_1.isString(contents) ? new Buffer(contents) : contents;
        this.put(file);
        return this;
    };
    /**
     * Copy
     * : Copies source to destination or multiple sources to destination.
     *
     * @param from the path or paths as from source.
     * @param to the path or destination to.
     * @param options the glob options or content transform.
     * @param transform method for transforming content.
     */
    VStor.prototype.copy = function (from, to, options, transform) {
        var _this = this;
        var copyFile = function (_from, _to) {
            if (!_this.exists(_from))
                _this.error("cannot copy from source " + _from + " the path does NOT exist.");
            var file = _this.get(_from);
            var contents = file.contents;
            if (transform)
                contents = transform(contents, file.path);
            _this.write(_to, contents, file.stat);
            file = _this.read(_to).toFile();
            _this.emit('copied', file, _this);
        };
        if (chek_1.isFunction(options)) {
            transform = options;
            options = undefined;
        }
        var rootPath;
        var origFrom = from;
        to = this.resolveKey(to); // resolve output path from base.
        options = chek_1.extend({}, GLOB_DEFAULTS, options || {});
        from = this.globify(from); // globify will resolve from base.
        var paths = globby_1.sync(from, options);
        var matches = [];
        if (!paths.length && chek_1.isString(from) && this.hasKey(from))
            paths = [from];
        this.each(function (f) {
            if (multimatch([f.path], paths).length !== 0)
                matches.push(f.path);
        });
        paths = paths.concat(matches); // concat glob paths w/ store matches.
        if (!paths.length)
            this.error("cannot copy using paths of undefined.");
        if (chek_1.isArray(from) || globby_1.hasMagic(from) || (!chek_1.isArray(from) && !this.exists(from))) {
            if (!fs_1.existsSync(to) && !/\..*$/.test(to))
                mkdirp_1.sync(to);
            if (!chek_1.isDirectory(to))
                this.error('destination must must be directory when copying multiple.');
            rootPath = this.commonDir(origFrom);
        }
        paths.forEach(function (f) {
            if (rootPath)
                copyFile(f, path_1.join(to, path_1.relative(rootPath, f)));
            else
                copyFile(f, to);
        });
        return this;
    };
    /**
     * Move
     * : Moves file from one path to another.
     *
     * @param from the from path.
     * @param to the to path.
     * @param options glob options.
     */
    VStor.prototype.move = function (from, to, options) {
        this.copy(from, to, options);
        this.remove(from, options);
        var file = this.read(to).toFile();
        this.emit('moved', file, this);
        return this;
    };
    /**
     * Append
     * : Appends a file with the specified contents.
     *
     * @param to the path of the file to append to.
     * @param content the content to be appended.
     * @param trim whether to not to trim trailing space.
     */
    VStor.prototype.append = function (to, content, trim) {
        var contents = this.read(to)
            .toValue();
        trim = !chek_1.isUndefined(trim) ? trim : true;
        if (trim)
            contents = contents.replace(/\s+$/, '');
        if (chek_1.isPlainObject(content) || chek_1.isPlainObject(contents)) {
            if (!chek_1.isPlainObject(contents) || !chek_1.isPlainObject(content))
                this.error("attempted to append object using type " + typeof contents + ".");
            contents = chek_1.extend({}, contents, content);
        }
        else {
            contents = contents + os_1.EOL + content;
        }
        this.write(to, contents);
        var file = this.read(to).toFile();
        this.emit('appended', file, this);
        return this;
    };
    /**
     * Remove
     * : Removes a file from the store.
     *
     * @param paths a path or array of paths to be removed.
     * @param options glob options used in removal.
     */
    VStor.prototype.remove = function (paths, options) {
        var _this = this;
        options = this.extendOptions(options);
        var removeFile = function (p) {
            var f = _this.get(p);
            f.state = interfaces_1.VinylState.deleted;
            f.contents = null;
            _this.put(f);
            _this.emit('removed', f, _this);
        };
        paths = this.globify(chek_1.toArray(paths)
            .map(function (p) { return _this.resolveKey(p); }));
        globby_1.sync(paths, options) // set as 'deleted';
            .forEach(function (p) { return removeFile(p); });
        this.each(function (f) {
            if (multimatch([f.path], paths).length)
                removeFile(f.path);
        });
        return this;
    };
    /**
     * Save
     * : Saves to store.
     *
     * @param filters transform filters which will be piped to stream.
     * @param fn a callback function on done.
     */
    VStor.prototype.save = function (filters, fn) {
        if (chek_1.isFunction(filters)) {
            fn = filters;
            filters = undefined;
        }
        var self = this;
        var store = this;
        filters = filters || [];
        var modifiy = through.obj(function (file, enc, done) {
            if (file.state === interfaces_1.VinylState.modified || (file.state === interfaces_1.VinylState.deleted && !file.isNew))
                this.push(file);
            done();
        });
        filters = [modifiy].concat(filters);
        var save = through.obj(function (file, enc, done) {
            store.put(file);
            if (file.state === interfaces_1.VinylState.modified) {
                var dir = path_1.dirname(file.path);
                if (!fs_1.existsSync(dir))
                    mkdirp_1.sync(dir);
                fs_1.writeFileSync(file.path, file.contents, {
                    mode: file.stat ? file.stat.mode : null
                });
            }
            else if (file.state === interfaces_1.VinylState.deleted) {
                rimraf_1.sync(file.path);
            }
            delete file.state; // remove custom prop.
            delete file.isNew; // remove custom prop.
            done();
        });
        filters.push(save);
        var stream = filters.reduce(function (stream, filter) {
            return stream.pipe(filter);
        }, this.stream());
        stream.on('finish', chek_1.noopIf(fn));
        return this;
    };
    return VStor;
}(events_1.EventEmitter));
exports.VStor = VStor;
//# sourceMappingURL=vstor.js.map