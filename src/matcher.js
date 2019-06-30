export default function(selector) {
    return function() {
        return this.matches(selector);
        //match 返回true/false
    };
}