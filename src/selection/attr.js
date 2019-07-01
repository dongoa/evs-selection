import namespace from "../namespace.js";

function attrRemove(name) {
    return function() {
        this.removeAttribute(name);
    };
}

function attrRemoveNS(fullname) {
    return function() {
        this.removeAttributeNS(fullname.space, fullname.local);
    };
}

function attrConstant(name, value) {
    return function() {
        this.setAttribute(name, value);
    };
}

function attrConstantNS(fullname, value) {
    return function() {
        this.setAttributeNS(fullname.space, fullname.local, value);
    };
}

function attrFunction(name, value) {
    return function() {
        var v = value.apply(this, arguments);
        if (v == null) this.removeAttribute(name);
        else this.setAttribute(name, v);
    };
}

function attrFunctionNS(fullname, value) {
    return function() {
        var v = value.apply(this, arguments);
        if (v == null) this.removeAttributeNS(fullname.space, fullname.local);
        else this.setAttributeNS(fullname.space, fullname.local, v);
    };
}

export default function(name, value) {
    var fullname = namespace(name);//过去他的命名空间对象

    if (arguments.length < 2) {//参数只是name时
        var node = this.node();//获取当前节点node
        return fullname.local
            ? node.getAttributeNS(fullname.space, fullname.local)
            : node.getAttribute(fullname);
    }
    console.log(this);
    return this.each((value == null
        ? (fullname.local ? attrRemoveNS : attrRemove) : (typeof value === "function"
            ? (fullname.local ? attrFunctionNS : attrFunction)
            : (fullname.local ? attrConstantNS : attrConstant)))(fullname, value));
}