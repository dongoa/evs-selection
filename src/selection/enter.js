import sparse from './sparse.js'
import {Selection} from '.index.js'

export default function () {
    return new Selection(this._enter || this._groups.map(sparse),this._parents);
}
//在这里定义了enternode对象 这里也是构造函数加原型模式
export function EnterNode(parent,datum) {
    this.ownerDocument = parent.ownerDocument;
    this.namespaceURI=parent.namespaceURI;
    this._next = null;
    this._parent = parent;
    this.__data__=datum;
}

EnterNode.prototype={
    constructor:EnterNode,
    appendChild:function(child){  return this._parent.insertBefore(child, this._next); },
    insertBefore:function(child,next){ return this._parent.insertBefore(child,next); },
    querySelector:function(selector){ return this._parent.querySelector(selector); },
    querySelectorAll:function(selector) { return this._parent.querySelectorAll(selector); }
};