function empty() {
    return [];
}
//返回的一定是函数
export default function(selector) {
    return selector == null ? empty : function() {
        return this.querySelectorAll(selector);
    };
}