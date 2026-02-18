"use strict";
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const absoluteLoad_1 = __importDefault(require("absoluteLoad"));
let App = (() => {
    let _classDecorators = [annotation];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _decorated_decorators;
    let _decorated_initializers = [];
    let _decorated_extraInitializers = [];
    var App = _classThis = class {
        constructor() {
            this.n = App.foo.baz.n;
            this.decorated = __runInitializers(this, _decorated_initializers, 5);
            this.users = (__runInitializers(this, _decorated_extraInitializers), (0, absoluteLoad_1.default)());
        }
    };
    __setFunctionName(_classThis, "App");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _decorated_decorators = [propertyDecorator];
        __esDecorate(null, null, _decorated_decorators, { kind: "field", name: "decorated", static: false, private: false, access: { has: obj => "decorated" in obj, get: obj => obj.decorated, set: (obj, value) => { obj.decorated = value; } }, metadata: _metadata }, _decorated_initializers, _decorated_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        App = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
    })();
    _classThis.foo = { bar: true, baz: { n: 123 } };
    (() => {
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return App = _classThis;
})();
function annotation(target) {
    target.annotated = true;
}
function propertyDecorator(target, key) {
    arguments[2].initializer = function () {
        return 42;
    };
}
exports.default = App;
