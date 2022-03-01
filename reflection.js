function bindThis(clazz, self) {
    const methodKeys = Reflect.ownKeys(clazz.prototype).filter(k => k !== "constructor");
    for (const k of methodKeys) self[k] = clazz.prototype[k].bind(self);
}

class Parent {
    constructor() {
        this.parentVal = "PARENT";

        console.log(this);
        bindThis(Parent, this);
    }

    parentMethod() {
        console.log(this.parentVal);
    }
}

class Child extends Parent {
    constructor() {
        super();
        this.childVal = "CHILD";
        bindThis(Child, this);
    }

    childMethod() {
        console.log(this.childVal);
    }
}


const c = new Child();

//console.log(Reflect.ownKeys(Reflect.getPrototypeOf(c)), Reflect.getPrototypeOf(c))

c.parentMethod();
c.parentMethod.apply({});
c.childMethod.apply({});
