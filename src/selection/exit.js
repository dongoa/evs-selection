import sparse from "./sparse.js"
import {Selection} from "./index.js";
export default function () {
    return new Selection(this._exit || this.groups.map(sparse),this._parents);
}