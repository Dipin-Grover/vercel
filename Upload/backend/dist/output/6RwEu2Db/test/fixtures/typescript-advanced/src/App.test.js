"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const App_1 = __importDefault(require("./App"));
it('reads a typescript file with no syntax error', () => {
    const app = new App_1.default({});
    expect(App_1.default.foo.bar).toBe(true);
    expect(App_1.default.foo.baz.n).toBe(123);
    expect(app.n).toBe(123);
});
