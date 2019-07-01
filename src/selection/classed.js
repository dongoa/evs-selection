function classArray(string) {
    return string.trim().split(/^|\s+/);//用到正则表达式，遇到空白符就分隔
}

function classList(node) {
    return node.classList || new ClassList(node);//返回该节点的classList 没有则新建一个
}

function ClassList(node) {
    this._node = node;
    this._names = classArray(node.getAttribute("class") || "");
}

ClassList.prototype = {
    add: function(name) {
        var i = this._names.indexOf(name);
        if (i < 0) {
            this._names.push(name);
            this._node.setAttribute("class", this._names.join(" "));
        }
    },
    remove: function(name) {
        var i = this._names.indexOf(name);
        if (i >= 0) {
            this._names.splice(i, 1);
            this._node.setAttribute("class", this._names.join(" "));
        }
    },
    contains: function(name) {
        return this._names.indexOf(name) >= 0;
    }
};

function classedAdd(node, names) {
    var list = classList(node), i = -1, n = names.length;
    while (++i < n) list.add(names[i]);
}

function classedRemove(node, names) {
    var list = classList(node), i = -1, n = names.length;
    while (++i < n) list.remove(names[i]);
}

function classedTrue(names) {
    return function() {
        classedAdd(this, names);
    };
}

function classedFalse(names) {
    return function() {
        classedRemove(this, names);
    };
}

function classedFunction(names, value) {
    return function() {
        //这里的this在each中出入，为node节点
        (value.apply(this, arguments) ? classedAdd : classedRemove)(this, names);
    };
}

export default function(name, value) {
    var names = classArray(name + "");

    if (arguments.length < 2) {
        var list = classList(this.node()), i = -1, n = names.length;
        while (++i < n) if (!list.contains(names[i])) return false;
        return true;
    }

    return this.each((typeof value === "function"
        ? classedFunction : value
            ? classedTrue
            : classedFalse)(names, value));
}