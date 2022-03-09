class Parent {
    constructor() {
        console.log(this.constructor.name);
    }
}

class test extends Parent {
    constructor() {
        super();
    }
}


new Parent();
