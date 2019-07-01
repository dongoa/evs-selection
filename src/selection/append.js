import creator from '../creator.js'

export default function(name){
    var create = typeof  name === "function" ? name:creator(name);//
    return this.select(function(){
        return this.appendChild(create.apply(this,arguments));//这里传出去的仍是闭包，相当于调用select(f)的arguments扔是在select.js中出入的
    })
}