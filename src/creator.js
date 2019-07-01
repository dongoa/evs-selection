import namespace from "./namespacejs";
import {xhtml} from "./namespaces.js";
function creatorInherit(name) {
    return function() {
        var document = this.ownerDocument,
            uri = this.namespaceURI;
        return uri === xhtml && document.documentElement.namespaceURI === xhtml//这里继承父类的命名空间
            ? document.createElement(name)
            : document.createElementNS(uri, name);
    };
}

function creatorFixed(fullname) {
    return function() {
        return this.ownerDocument.createElementNS(fullname.space, fullname.local);
    };
}

export default function(name){
    var fullname=namespace(name);
    return (fullname.local
        ?creatorFixed
        :creatorInherit)(fullname);
}