function none() {}

export default function(selector) {
    return selector == null ? none : function() {

        console.log(this);
        return this.querySelector(selector);
    };
}