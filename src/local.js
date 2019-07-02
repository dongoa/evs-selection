var nextId=0;
export default function local() {
    return new Local;
}

function Local() {
    this._="@"+(++nextId).toString(36);
    //Number.prototype.toString([radix])中的
    // radix 指定要用于数字到字符串的转换的基数(从2到36)。
    // 如果未指定 radix 参数，则默认值为 10。所有不在范围内的基数会报错
}
Local.prototype=local.prototype={
    constructor:Local,
    get:function (node) {
        var id=this._;
        while(!(id in node)) if (!(node=node.parentNode)) return;
        return node[id];
    },
    set:function (node,value) {
        return node[this._]=value;
    },
    remove:function (node) {
        return this._ in node && delete node[this._];
    },
    toString: function () {
        return this._;
    }
}