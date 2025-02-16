// This file ensures that checks for top-level code work correctly

Object.defineProperty(exports, "__esModule", { value: true });
exports.Foo = void 0;

class Foo {
    doSomething() {
        return true;
    }
}

exports.class = Foo;
exports.instance = new Foo();
