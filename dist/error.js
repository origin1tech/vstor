"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var os_1 = require("os");
var util_1 = require("util");
var chek_1 = require("chek");
var ErrorExtended = /** @class */ (function () {
    function ErrorExtended(message, name, meta, prune) {
        this.meta = null;
        Error.captureStackTrace(this, this.constructor);
        if (chek_1.isPlainObject(name)) {
            prune = meta;
            meta = name;
            name = undefined;
        }
        if (chek_1.isNumber(meta)) {
            prune = meta;
            meta = undefined;
        }
        this.message = message;
        this.meta = meta;
        this.name = name || this.constructor.name;
        this.stacktrace = this.prune(prune);
        this.stackframes = this.parse();
        this.stack = this.stacktrace.join(os_1.EOL);
    }
    /**
     * Split
     * : Splits a stack by newline char.
     *
     * @param stack the stack to split.
     */
    ErrorExtended.prototype.split = function (stack) {
        if (chek_1.isArray(stack))
            return stack;
        return (stack || this.stack || '').split(os_1.EOL);
    };
    /**
     * Prune
     * : Prunes a stack by the count specified.
     *
     * @param prune the rows to be pruned.
     * @param stack an optional stack to use as source.
     */
    ErrorExtended.prototype.prune = function (prune, stack) {
        prune = prune || 0;
        stack = this.split(stack);
        if (!prune)
            return stack;
        var message = stack.shift(); // remove the message.
        var pruned = stack.slice(prune);
        pruned.unshift(message);
        return pruned;
    };
    /**
     * Parse
     * : Parses out stack trace into stack frames.
     *
     * @param stack the stack to get stack frames for.
     */
    ErrorExtended.prototype.parse = function (stack) {
        stack = this.split(stack || this.stacktrace);
        function parseLine(line) {
            var obj = null;
            var method = null;
            var functionName = null;
            var typeName = null;
            var methodName = null;
            if (line[1]) {
                functionName = line[1];
                var methStart = functionName.lastIndexOf('.');
                if (functionName[methStart - 1] === '.')
                    methStart--;
                if (methStart > 0) {
                    obj = functionName.slice(0, methStart);
                    method = functionName.slice(methStart + 1);
                    var objEnd = obj.indexOf('.Module');
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
                functionName: functionName,
                typeName: typeName,
                methodName: methodName
            };
        }
        var mapped = stack.map(function (v) {
            var line = v.match(/at (?:(.+)\s+\()?(?:(.+?):(\d+)(?::(\d+))?|([^)]+))\)?/);
            if (!line)
                return;
            var parsed = parseLine(line);
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
        if (chek_1.isUndefined(mapped[0]))
            mapped.shift();
        return mapped;
    };
    /**
     * Prettify
     * : Uses util.inspect to prettify the object.
     *
     * @param stack the stack to prettify.
     * @param depth the depth of the stack to process.
     * @param color wether to colorize.
     */
    ErrorExtended.prototype.prettify = function (stack, depth, color) {
        if (chek_1.isBoolean(depth)) {
            color = depth;
            depth = null;
        }
        depth = depth || null;
        color = chek_1.isUndefined(color) ? true : color;
        stack = this.split(stack || this.stackframes);
        return util_1.inspect(stack, null, depth, color);
    };
    return ErrorExtended;
}());
exports.ErrorExtended = ErrorExtended;
//# sourceMappingURL=error.js.map