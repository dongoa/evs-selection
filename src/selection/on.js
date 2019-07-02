var filterEvents={};

export var event=null;

if(typeof document !== "undefined"){
    var element=document.documentElement;
    if(!("onmouseenter" in element)){
        filterEvents = {mouseenter:"mouseover",mouseleave:"mouseout"};
    }
}
function parseTypenames(typenames) {
    return typenames.trim().split(/^|\s+/).map(function(t){
        var name="",i=t.indexOf(".");
        if(i >= 0) name=t.slice(i + 1),t=t.slice(0,i);
        return { type:t, name:name };
    });
}
function onRemove(typename){
    return function(){
        var on=this._on;
        if(!on) return ;
        for(var j=0,i=-1,m=o.length,o;j<m;++j){
            if(o=on[j],(!typename.type || o.type === typename.type) && o.name === typename.name){
                this.removeEventListener(o.type,o.listener,o.capture);
            }else{
                on[++i]=o;//不需要删除的从0开始重新添加
            }
        }
        if(++i) on.length=i;//这里是删除了部分
        else delete this.__on;//delete可以删除对象的属性
    }
}
function filterContextListener(listener,index,group) {//过滤掉非文本时间
    listener = contextLister(listener,index,group);
    return function (event) {
        var related = event.relatedTarget;//返回与事件的目标节点相关的节点
        if(!related || (related !== this && !(related.compareDocumentPosition(this)&8))){
            //这里判断要么related不存在，要么存在不等于this，而且不能属于this内部节点
            listener.call(this,event);
        }
    }

}
function contextListener(listener,index,group) {
    return function (event1) {
        var event0=event;//Event时可重用的,这里这种写法就是
        // 在监听函数中修改event后，event换回恢复原来的值
        event=event1;
        try{
            listener.call(this,this.__data__,index,group);
        }finally {
            event=event0;
        }
    };
}
function onAdd(typename,value,capture){
    var wrap=filterEvents.hasOwnProperty(typename.type) ? filterContextListener:contextListener;
    return function(d,i,group){
        var on=this.__on,o,listener=wrap(value,i,group);
        if(on) for(var j=0,m=on.length;j<m;++j){
            if((o=on[j]).type === typename.type && o.name === typename.name){//知道同名的事件。替换
                this.removeEventListener(o.type,o.listener,o.capture);
                this.addEventListener(o.type,o.listener=listener,o.capture=capture);
                o.value=value;
                return ;
            }
        }
        this.addEventListener(typename.type,listener,capture);//没找到的直接添加
        o={type:typename.type,name:typename.name,value:value,listener:listener,capture:capture};
        if(!on) this.__on=[o];//__on给节点一个__on属性对象数组，存储事件
        else on.push(o);
    };
}
export default function (typename,value,capture) {
    var typenames = parseTypenames(typename + ""),i,n=typenames.length,t;//解析typename字符串
    if(arguments.length < 2){//一个参数返回,查找对应的事件的value
        var on=this.node().__on;
        if(on) for(var j=0,m=on.length,o;j<m;++j){
            for(i=0,o=on[j];i<n;++i){
                if((t=typenames[i]).type === o.type && t.name === o.name){
                    return o.value;
                }
            }
        }
        return ;
    }
    //2个及以上参数的情况
    on = value?onAdd :  onRemove;//这里判断value为null时删除否则添加事件
    if(capture == null) capture =false;
    for(i=0;i<n;i++) this.each(on(typenames[i],value,capture));//这里对每个typename查找一次，效率比较低，n*n
    return this;

}

export function customEvent(event1,listener,that,args) {
    var event0=event;
    event1.sourceEvent=event;//sourceEvent作者定义的事件层级，返回最顶端的事件
    event=event1;
    try{
        return listener.apply(that,args);
    }finally {
        event=event0;
    }
}