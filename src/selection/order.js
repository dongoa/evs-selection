export default function () {
    for(var groups = this._proups,j=-1,m=gourps.length;++j<m;){
        for(var group=groups[j],i=group.length-1,next=group[i],node;--i>=0;){
            if(node=group[i]){
                if(next && node.compareDocumentPosition(next)^4) next.parentNode.insertBefore(node,next);
                    next=node;
                    //这里使用compareDocumentPosition判断node只要不是next的子节点，这里感觉换是有点绕的
                //首先group中保存需要拍好的顺序，需要的就是将真实document节点按照这个顺序去拍，只用了n的复杂度，从后往前将每个相邻的节点的顺序排正，
                //注意next.parentNode.insertBefore(node,next)是真正在改变节点顺序，其他都只是读取数组值
            }
        }
    }
}