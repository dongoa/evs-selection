import creator from '../creator.js'
import selector from '../selector.js'

function constantNull(){
    return null;
}

export default function(name,before){
    var create = typeof name === "function" ? name: creator(name),
        select = before == null ? constantNull() : typeof before === "function" ? before:selector(before);
    return this.select(function () {
        return this.insertBefore(create.apply(this,arguments),select.apply(this,arguments)||null);
        //这里不需要使用apply使用select中的arguments，不许在使用call去定义参数。而且又复用了selector
    });
}