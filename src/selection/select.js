import {Selection} from "./index.js";
import selector from "../selector.js";

// function f(selector){
//    return  function() {
//
//         console.log(this);
//         return this.querySelector(selector);
//     };
// }
export default function(select) {
    // console.log(this);

    if (typeof select !== "function") select = selector(select);
   // select = f(select);

    for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
        console.log(subgroups,m);
        for (var group = groups[j], n = group.length, subgroup = subgroups[j] = new Array(n), node, subnode, i = 0; i < n; ++i) {
            // console.log(group,n,subgroup,subgroups[j],node,subnode);
            alert(1);
            // console.log(node.__data__);
            if ((node = group[i]) && (subnode = select.call(node, node.__data__, i, group))) {
                if ("__data__" in node) subnode.__data__ = node.__data__,console.log(node.__data__);
                subgroup[i] = subnode;
            }
        }
    }

    return new Selection(subgroups, this._parents);
}