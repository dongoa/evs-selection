import {Selection} from "./index.js";
import {EnterNode} from "./enter.js";
import constant from '../constant.js';

var keyPrefix='$'; //防止像__proto__这样的key
//不输入key的情况
function bindIndex(parent,group,enter,update,exit,data){
    var i=0,
        node,
        groupLength=group.length,
        dataLength=data.length;
    //这里处理可以添加数据的元素，即按传入数据data的长度向元素添加数据
    //把非空节点加入update,所以这里update的含义可以说是可以被更新的节点数组
    //把空节点加入enter
    for(;i<dataLength;++i){
        if(node=group[i]){
            node.__data__ = data[i];
            update[i]=node;
        }else{
            enter[i]=new EnterNode(parent,data[i]);
        }
    }

    //多余的不能添加数据的节点在这里处理。加入exit
    for(;i<groupLength;++i){
        if(node = group[i]){
            exit[i]=node;
        }
    }
}
//key函数输入的情况
function bindKey(parent,group,enter,update,exit,data,key){
    var i,
        node,
        nodeByKeyValue={},//判重的hash集
        groupLength=group.length,
        dataLength=data.length,
        keyValues=new Array(groupLength),
        keyValue;

    //这里就是计算原始节点数组的调用key函数返回值情况，多余的valuekey加入exit
    //为每个节点计算key值
    //如果多个节点具有相同的key，将重复的加入exit
    for(i=0;i<groupLength;++i){
        if(node=group[i]){
            keyValues[i]=keyValue=keyPrefix+key.call(node,node.__data__,i,group);
            if(keyValue in nodeByKeyValue){
                exit[i]=node;
            }else {
                nodeByKeyValue[keyValue]=node;
            }
        }
    }

    //计算新加入的data，有哪些原始绑定的数据需要更改(update
    // 的含义就是to update)
    //使用key函数处理datum
    //如果已经存在节点与这个key关联，将其加入update
    //如果没有，或key重复，加入enter
    for(i=0;i<dataLength;++i){
        keyValue=keyPrefix+key.call(parent,data[i],i,data);
        if(node = nodeByKeyValue[keyValue]){
            update[i]=node;
            node.__data__=data[i];//to update
            nodeByKeyValue[keyValue]=null;//加入update后就删除了，重复的会到enter中
        }else{
            enter[i]=new EnterNode(parent,data[i]);
        }
    }

    //将剩余没绑定数据的节点放入exit
    for(i=0;i<groupLength;++i){
        if((node=group[i])&&(nodeByKeyValue[keyValues[i]]===node)){
            //这里计算如果原始节点调用key函数得到的valuekey中
            // 也有可能出现与新加入的data调用key函数后得到的keyvalue重复的情况，
            //就将其加入exit
            exit[i]=node;
        }
    }
}

export default function (value,key) {
    if(!value){//不传入value的情况下，返回节点上绑定的数据
        data=new Array(this.size()),j=-1;
        this.each(function(d){ data[++j]=d; });//each中的callback:callback.call(node,node.__data__,i,group);
        return data;
    }
    var bind=key?bindKey:bindIndex,
        parents=this._parents,
        groups=this._groups;

    if(typeof value !== "function") value=constant(value);
        //这里就把3种状态定义好了，其实就在添加了这么3个数组、enter、update、exit、data里面保存原始数据
    for(var m=groups.length,update=new Array(m),enter=new Array(m),exit=new Array(m),j=0;j<m;++j){
        var parent=parents[j],
            group=groups[j],
            groupLength=group.length,
            data=value.call(parent,parent&&parent.__data__,j,parents),
            dataLength=data.length,
            enterGroup=enter[j]=new Array(dataLength),
            updateGroup=update[j]=new Array(dataLength),
            exitGroup=exit[j]=new Array(groupLength);

        bind(parent,group,enterGroup,updateGroup,enterGroup,data,key);

        //现在可以做的就是将enter内的节点加入到update中
        //
        for(var i0=0,i1=0,previous,next;i0<dataLength;++i0){
            if(previous = enterGroup[i0]){
                if(i0 >= i1) i1=i0+1;//设置i1的初始值
                while(!(next = updateGroup[i1]) && ++i1 < dataLength) ;
                previous._next = next || null;
            }
        }

    }

    update=new Selectoin(update,parent);
    update._enter = enter;
    update._exit=exit;
    return update;
}
