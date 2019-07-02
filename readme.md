# evs-selection
数据可视化以数据为主，那对数据集的选择就尤为重要，这个模块允许对DOM进行强大的数据驱动的转换，如设置属性(attributes)、样式、属性(properties)、html以及文本等，通过绑定和解绑数据，就可以直接添加和删除对应的元素。  
选取方法返回当前选择集或一个新的选择集，支持链式操作，例如设置当前文档的所有段落元素的类和颜色样式：  
```
evs.selectAll("p")
    .attr("class", "graf")
    .style("color", "red");
```
操作相当于：  
```
var p = evs.selectAll("p");
p.attr("class", "graf");
p.style("color", "red");
```
对于缩进控制，推荐使用选择器时使用两个缩进，设置属性方法时使用四个缩进，有助于解释代码：  
```
evs.select("body")
  .append("svg")
    .attr("width", 960)
    .attr("height", 500)
  .append("g")
    .attr("transform", "translate(20,20)")
  .append("rect")
    .attr("width", 920)
    .attr("height", 460);
```
注意一下，选择集是不可变的，选择集发生变化后会返回一个新的选择集，然后驱动元素发声明变化，这也是d3数据驱动的主要思想。  
## 该模块结构
+ 选择元素(本章的内容)
+ 修改元素
+ 加入数据
+ 处理事件
+ 控制流
+ 局部变量
+ 命名空间

# API参考与算法解析：  
## 选择元素 
后面我把改方法叫做**选择器**，其接收[W3C选择器字符串格式](https://www.w3.org/TR/selectors-api/)，如.fancy选择fancy类，div选择div元素，有两种形式：**select**和**selctAll**，前者匹配第一个匹配成功的元素，后者匹配所有合适的元素，在最顶层选择时使用esv.select和esv.selectAll会搜索整个文档，而selection.select和selection.selectAll会在指定的选择集中在进行选取.  
### evs.selection()  
选择根元素，document.documentElement即html，该方法可以用来检测类型或扩展其原型prototype,如下一个例子，添加一个checked方法检查checkbox设置其checked属性  
```
evs.selection.prototype.checked = function(value) {
  return arguments.length < 1
      ? this.property("checked")
      : this.property("checked", !!value);
};
```
然后就可以使用：  
```
evs.selectAll("input[type=checkbox]").checked(true);
```
*代码实现*：**selection/index.js**:代码中实现了两个对象，Selection和selection，他们的原型(prototype)相同即共享方法,selection寄生于Selction,这里用到的应该是**寄生构造模式同时组合了原型模式**设计模式没看完还不知道有没有专门的名字：  
```
//js高程160页源码寄生构造模式复习下：
function Person(name,age,job){
  var o=new Object();
  o.name = name;
  o.age=age;
  o.job=job;
  o.sayName=function(){
    alert(this.name);
  }
}
```
只是多了一些变形，让两个对象selection和Selection的原型都指向一个对象字面量，共享这些方法。被寄生的Selection属性有两个，第一个是存放选择集的数组，第二个作为它的父节点，其构造函数也是接收这两个参数、如下：  
```
export function Selection(groups, parents) {
  this._groups = groups;
  this._parents = parents;
}

function selection() {
  return new Selection([[document.documentElement]], root);
}
```

### evs.select(selector):  
根据selector选择第一个匹配到的元素，没有返回空，匹配到多个返回第一个，使用方法如下：  
```
const anchor = evs.select("a");
```
如果选择器不是字符串，则选择为指定的节点，特别是当你已经有一个节点的引用时非常有用，例如使用在事件监听器中的this或全局的document.body中的global，下面这个例子将单击的段落设为红色：  
```
evs.selectAll("p").on("click", function() {
  d3.select(this).style("color", "red");
});
```
*代码实现*：**select.js**：用document.querySelector封装了选择器，或者直接引入节点,\_parents默认为document.documentElement，引入节点时的parents为存在index.js中的root  

###  evs.selectAll(selector) ：
选择匹配的所有元素,例如选择所有段落：  
```
const paragraph = evs.selectAll("p");
```
*代码实现*：**selectAll.js**：与上面完全相同，无非就是querySelector换成了querySelectorAll  
### selection.select(selector): 
选择与当前指定的选择器的中匹配的第一个后代元素，如果没有，则当前索引处元素在返回的选择器中的值为null，如果selector为空，则选择器为空，同时具有关联的数据也会传到元素上(具体数据关联在后面的文章说明，不属于这个模块)，例如选择每个段落的第一个粗体元素：  
```
const b = evs.selectAll("p").select("b");
```
如果selector是一个函数，则调用该函数计算当前选择器中每个元素，这其中用到了call方法传递参数，将函数计算结果覆盖原来的DOM，无匹配返回空，示例选择每个段落的上个兄弟节点：  
```
const previous = d3.selectAll("p").select(function() {
  return this.previousElementSibling;
});
```
与selection.selectAll不同，selection.select不会改变原有的分组结构，并可以将绑定的数据传递下去，关于分组的原理[Nested Selections](https://bost.ocks.org/mike/nest/)与它是怎么工作的[How Selections Work](https://bost.ocks.org/mike/selection/)原理可以点击链接查看，后面我也写一下。  
*代码实现*：**selection/select.js**：这个模块的接口有两个部分，一部分是src中的，抽象出的对外的接口，另一部在src/selection中，为Selection对象的方法接口，这一部分用到了**闭包**，我们知道闭包中this是咋他被调用时的this，所以代码中保存一个闭包函数，然后就是对当前对象的_groups处理，先看下源码：  
```
export default function(select) {
    if (typeof select !== "function") select = selector(select);
    for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
        for (var group = groups[j], n = group.length, subgroup = subgroups[j] = new Array(n), node, subnode, i = 0; i < n; ++i) {
            if ((node = group[i]) && (subnode = select.call(node, node.__data__, i, group))) {
                if ("__data__" in node) subnode.__data__ = node.__data__;
                subgroup[i] = subnode;
            }
        }
    }
    return new Selection(subgroups, this._parents);
}
```
这里有两个非常好的用法:一个前面提到了闭包的问题，所有传入select的this是node，select函数内部用的还是this.querySelector(),另一个是最后反回时用的subgroups，看到subgroup和subgroups[j]引用的是同一数组对象，即后面更改subgroup[i]中的值的时候，subgroups中的值一样更改了，实际上他们都是一样对象的两个不同指针而已。  
### selection.selectAll(selector)： 
从当前选择器每个元素选择匹配的所有后代，与上一个select不同的是无法继承数据，需要selection.data传给子节点,例如匹配所有段落的粗体元素  
```
const b = evs.selectAll("p").selectAll("b");
```
如果selector是函数，必须返回数组，示例，匹配每个段落的上一个和下一个兄弟节点：  
```
const sibling = evs.selectAll("p").selectAll(function() {
  return [
    this.previousElementSibling,
    this.nextElementSibling
  ];
});
```
关于分组，每个后代根据其父元素分组。这里要注意，与selection.select不同，selectAll会改变原有的分组，因为原有的分组会被分成子节点数组。  
*代码实现*：**selection/selectAll.js**与select不同的是，如果选择器中的某个元素没有匹配到，就会忽略掉，即造成数组变小，同样parents需要记录，最后传入新的parents  
### selection.filter(filter)： 
过滤当前选择器的元素，过滤操作对于处理数据来说是必须的，返回仅包含过滤器为true的元素的新选择器，过滤器可为选择器或函数。  
例如，选去表格中的奇数行：  
```
const even = evs.selectAll("tr").filter(":nth-child(even)");
```
类似与使用selectAll(),但是索引值可能会不同  
```
const even = evs.selectAll("tr:nth-child(even)");
```
使用函数：  
```
const even = evs.selectAll("tr").filter((d, i) => i & 1);
```
同理可以使用selection.select，这里要避免使用箭头函数，因为要引用this指针  
```
const even = evs.selectAll("tr").select(function(d, i) { return i & 1 ? this : null; });
```
这里要注意nth-child伪类是基于 的索引，上述的过滤功能与nth-child的含义并不完全相同，他们依赖于选择索引而不是dom的数量的索引。  
返回值同样保留parents，类似与array.filter，他不会保留被过滤掉的元素的父节点的记录，只是单纯传递了parents，需要保留
使用selection.select  
### selection.merge(other) 
合并两个选择器，返回的groups和parents数量相等 ，为最小的长度 
再绑定数据后该方法在内部使用selection.join输入和更新选择器，也可以显示合并，由于合并基于索引，所以使用保留索引的操作，selection.selecter而不是selection.filter，使用方法如下：  
```
const odd = selection.select(function(d, i) { return i & 1 ? this : null; ));
const even = selection.select(function(d, i) { return i & 1 ? null : this; ));
const merged = odd.merge(even);
```
该方法不是用来连接选择器的，如果同位置处两个元素都存在，就会忽略一个，其内部实现就是使用一个或操作来保存结果。  
###  evs.selector(selector)： 
整个模块抽象出来的是selection，即evs.selector是selection的方法，给定指定的选择器，返回一个函数，匹配第一个元素的后代，内部实现其实是返回了一个封装了this.querySelector的闭包。 该方法在selection.select内部使用  
```
const div = selection.select("div");
```
```
const div = selection.select(d3.selector("div"));
```
两个方式结果相同。  
###  evs.selectorAll(selector)   
给定指定的选择器，返回一个函数，匹配所有后代，也是在selection。selectAll内部使用，下面两个方式相同  
```
const div = selection.selectAll("div");
```
```
const div = selection.selectAll(d3.selectorAll("div"));
```
###  evs.window(node)：
返回制定节点的所有者的窗口，如果是window，返回node节点，否则否则返回父节点或该节点默认视图。实现中用到DOM的ownerDocument，返回节点的根节点，以及defaultView返回默认视图。  
其实这个接口的作用就是获取当前节点根节点的默认窗口，如果是window自然没有defaultView属性就直接返回window。  
### evs.style(node, name) 
返回node节点的name的style属性,如果没有该name，返回计算后属性值(computed property)。代码部分与selection。style关联。  
底层实现上，使用getPropertyValue方法返回指定css属性的值，如果没有使用：就用到了上面的window接口，可以说上面的window正好服务于这里，通过获取默认视图的计算属性然后查找对应name的css属性，代码如下：  
```
export function styleValue(node, name) {
  return node.style.getPropertyValue(name)
      || defaultView(node).getComputedStyle(node, null).getPropertyValue(name);
}
```
d3作者将这部分代码整合在了selection.style(src/selection/style.js)属性的代码中。

# 总结：
到这里selcetion模块的**选择元素操作的方法就**结束了。这个模块代码文件个数非常多:结构分为两部分，一部分对外开放的接口放在src/中，一部分是内部的Selection对象的方法，放在src/selection/中，其模块的结构是这样的，selection模块，该模块寄生于一个(当前选择器为document,parents为空)Selection对象，他们共享原型方法，这也使得我们可以去修改原型添加方法，当我们使用该模块选择元素的时候，最开始肯定是要对整个文档进行选取，使用evs.select/evs.selectAll，然后在使用selection.select去选择。  
**高层接口**：所以最基础的是四个方法，sev.select/selectAll是对整个文档选择，selection.select.selectAll是对已有的选择器再去嵌套选择，简单的选择操作使用这些结合选择器就够用了。  
对于其中对外开放的**其他接口**，有2个对选择器进行的操作，合并merge和过滤filter，底层还开放出了evs.selector/selectorAll、matcher这样内部使用的闭包函数，及获取根节点的window和获取样式的style。为了不让文章过长这一部分就介绍这些。如果原理部分我的文字难已说明白还非常建议结合源码食用[地址](https://github.com/dongoa/evs-selection)。  
想这样一个问题，如果让你设计一个对元素进行选择的模块会怎么做？d3的作者就用嵌套选择和选择器结合的方法，就非常简单的4个api解决了这个问题，可以完成对任意元素或元素集的选取，虽然是对querySelector进行的封装，对于结果数组的结构和链式方法应用是不一样的。该部分内容我们可以了解到**链式调用的实现方法**、**闭包this的使用**、domAPI获取节点css属性及计算属性的api、以及模块设计模式，非常有益。  

# 深度阅读：  
源码及解析：https://github.com/dongoa/evs-selection  
Element.matches(selectorString)选择元素:https://developer.mozilla.org/zh-CN/docs/Web/API/Element/matches  
Window.getComputedStyle()计算后的css属性值：https://developer.mozilla.org/zh-CN/docs/Web/API/Window/getComputedStyle  

## 选择元素 
选择元素后，设置文档的不同属性，例如设置a的name和color：  
```
evs.select("a")
    .attr("name", "fred")
    .style("color", "red");
```
可以直接去d3js.org官网在控制台中做实验。  
### selection.attr(name[, value]) ：
如果指定了value，则将为name的attribute设置为value，并返回选择器，value为常量，则对应属性都设置为该值，如果为函数，会传入数据(d)、索引(i)、当前节点(node)，使用返回值来设置属性，空值会删除对应属性。  
如果未指定value，返回选择器中第一个非空元素的指定属性的值。  
其中name可能会包含命名空间前缀，如xlink:href，参阅evs.spacenames，额外命名空间也可添加。  
代码实现中，首先单个参数会直接返回对应属性，封装的getAttribute和getAttributeNS，传入两个参数时，value为null直接删除，封装removeAttribute，传入函数的情况又用到了闭包,在外部使用this.each(callback)传递。
```
function attrFunction(name, value) {
    return function() {
        var v = value.apply(this, arguments);
        if (v == null) this.removeAttribute(name);
        else this.setAttribute(name, v);
    };
}
```
### selection.classed(names[, value])  
如果指定了value，在该选择器元素下可以将names添加或删除，修改classList属性吗，例如将类foo和bar添加到选择器。  
```
selection.classed("foo bar", true);
```
如果value为true，所有选择器中元素会添加指定的类，否则不会添加。若value为函数，计算返回值判断是否添加，例如foo类随机数大于0.5时添加  
```
selection.classed("foo", () => Math.random() > 0.5);
```
没指定value时，对第一个非空的节点进行判断，返回true或false。  
代码实现中：防止不支持classList作者自定义了一个对象ClassList,以及对classList的添加删除包含操作，代码如下：  
```
function ClassList(node) {
    this._node = node;
    this._names = classArray(node.getAttribute("class") || "");
}

ClassList.prototype = {
    add: function(name) {
        var i = this._names.indexOf(name);
        if (i < 0) {
            this._names.push(name);
            this._node.setAttribute("class", this._names.join(" "));
        }
    },
    remove: function(name) {
        var i = this._names.indexOf(name);
        if (i >= 0) {
            this._names.splice(i, 1);
            this._node.setAttribute("class", this._names.join(" "));
        }
    },
    contains: function(name) {
        return this._names.indexOf(name) >= 0;
    }
};
```
### selection.style(name[, value[, priority]])  
设置选择器元素的style属性，value为常数则全部设置为此值，同样可以为函数，按返回值设置是否添加该项，同时可以设置优先级null/important.  
未指定value，返回第一个非空元素的属性，如果存在会先否会inline样式，否则返回计算样式。注意:svg中设置3px与3是不同的，某些浏览器会自动添加，ie不会。  
代码实现同样用到了Selection的each每个元素进行操作，传入闭包函数。  
```
export default function(name, value, priority) {
    return arguments.length > 1
        ? this.each((value == null
            ? styleRemove : typeof value === "function"//value传入null，将其style-name删除
                ? styleFunction//传入函数
                : styleConstant)(name, value, priority == null ? "" : priority))//常量时设置这个值
        : styleValue(this.node(), name);//参数一个时返回其对应样式属性
}
```
###  selection.property(name[, value])| selection.text([value])| selection.html([value])
第一个方法对些些无法寻址找到的属性修改，如表单字段文本，checkbox的checked的boolean值。使用方法与selection.class相同，后面就是改变文本和html，实现上他们封装的方法分别是[]、textContent、innerHTML.  
在d3中完全可以利用selection.append/insert去创建数据驱动的内部节点,该html方法是不支持svg的，可以尝试[XMLSerializer](https://developer.mozilla.org/en-US/docs/XMLSerializer)[innersvg polyfill](https://code.google.com/p/innersvg/)这两个方法使得innerHTML支持svg  
*以上这些方法attr、classed、style、property、text、html，都是对selection的属性、文本、html进行更改*  
###  selection.append(type) 
如果type是字符串，为添加为选择器元素的最后一个子元素，或根据绑定的数据来添加元素(如果在enter selection中)，并可以通过selection.order调整顺序。  
如果为函数，传入d,i,nodes，并将返回的节点作为添加元素，例如讲div添加到p中：  
```
d3.selectAll("p").append("div");//value为字符串
d3.selectAll("p").append(() => document.createElement("div"));//value为函数
```
与下面结果相同：  
```
d3.selectAll("p").select(function() {
  return this.appendChild(document.createElement("div"));
});
```
这里也是支持包含命名空间的元素的情况。  
源码部分使用了create去保存命名空间，或得到父节点的命名空间，然后调用selection.select(function):  
```
import creator from '../creator.js'

export default function(name){
    var create = typeof  name === "function" ? name:creator(name);//
    return this.select(function(){
        return this.appendChild(create.apply(this,arguments));//这里传出去的仍是闭包，相当于调用select(f)的arguments仍是在select.js中出入的
    })
}
```
### selection.insert(type[, before]) 
type为字符串时，在指定的选择器before前添加元素，无before时为默认为null。  
type和before也可以都是函数，type返回要出入的节点，before返回要插入元素的子元素，下面这个例子是向p中插入div。  
```
d3.selectAll("p").insert("div");
d3.selectAll("p").insert(() => document.createElement("div"));//函数
```
效果与下面相同：  
```
d3.selectAll("p").select(function() {
  return this.insertBefore(document.createElement("div"), null);
});
```
返回值同样是新选择器以及具有一样的命名空间搜索与定义机制。其内部封装insertBefore，并且复用了selector。
###  selection.remove() 
删除文档中的当前这个选择器中的元素并返回，当前换没有api可以添加回dom，但是可以将返回值传给append、insert重新添加。  
```
function remove(){
    var parent=this.parentNode;
    if(parent) parent.removeChild(this);
}
export default function () {
    return this.each(remove);
}
```
代码实现中通过获取父节点，删除该子节点，调用each为每个元素执行该方法，each的返回值正好是元素。  
### selection.clone([deep]) 
向选择器插入当前选择器的克隆，返回添加后的选择器，deep为真时也会克隆后代节点。  
其代码实现封装了cloneNode(true/flase).  
###  selection.sort(compare)  
根据compare函数对选择器中元素的拷贝的**数据**排序，后返回新选择器，默认为升序。源码如下：   
```
export default function (compare) {
    if(!compare) compare=ascending;
    function compareNode(a,b){
        return a && b ? compare(a.__data__,b.__data__):!a-!b;
    }
    for(var groups=this._groups,m=groups.length,sortgroups=new Array(m),j=0;j<m;++j){
        for(var group=groups[j],n=group.length,sortgroup=sortgroups[j]=new Array(n),node,i=0;i<n;i++){
            if(node=group[i]){
                sortgroup[i]=node;
            }
        }
        sortgroup.sort(compareNode);
    }
    return new Selection(sortgroups,this._parents).oder();
}
function ascending(a,b){
    return a<b?-1:a>b?1:a>=b?0:NaN;
}
```
排序函数值红处理空值的函数非常简洁!a-!b保持原来的节点顺序，最后返回时应用order方法，因为这里只是在选择器中数据排序，并没有应用到文档上。  
### selection.order() 
将元素重新插入doucment,相当于调用selection.sort,如果已经排序，速度快很多。  
```
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
```
### selection.raise()
重新插入元素，作为父节点的最后一个子节点，内部使用each方法添加子节点，与下面结果一致：  
```
selection.each(function() {
  this.parentNode.appendChild(this);
});
```
### selection.lower() 
与上面相反，添加为父节点的第一个孩子。相当于  
```
selection.each(function() {
  this.parentNode.insertBefore(this, this.parentNode.firstChild);
});
```
### d3.create(name) 
创建一个docuemnt下的分离元素name.内部使用select创建，因为返回的是匿名函数，this为其调用时的
开始看还很纠结，他没有删除原节点，怎么又添加了一遍，但appenChild的dom操作是直接把节点移动到最后了。  
###  d3.creator(name)
创建一个元素，实际上就是封装了createElement/NS,组合了命名空间，下面用法相同：   
```
selection.append("div");
selection.append(d3.creator("div"));
```
## 命名空间namespace
XML中使用相同元素时是需要添加命名空间的。否则会造成冲突，元素的命名空间格式为\<h:table\>,不同的类型也有不同的默认空间，见evs.namespace   
```
xmlns="namespaceURI"
```
### evs.namespace(name)  
根据name判断该名称有没有命名空间，如果包含冒号，冒号前解析为空间前缀，后面解析为本地属性，只要该前缀在evs.namespaces中注册了，就会返回
```
d3.namespace("svg:text"); // {space: "http://www.w3.org/2000/svg", local: "text"}
```
这里xmlns比较特殊，因为xmlns属性可以在文档中定义一个或多个可供选择的命名空间，所以如果是xmlns，也会返回name不含冒号，也会直接返回名称。
### ves.namespaces 
已注册名称命名空间的映射。 初始值是：  
```
{
  svg: "http://www.w3.org/2000/svg",
  xhtml: "http://www.w3.org/1999/xhtml",
  xlink: "http://www.w3.org/1999/xlink",
  xml: "http://www.w3.org/XML/1998/namespace",
  xmlns: "http://www.w3.org/2000/xmlns/"
}
```
# 总结
到这里完成了对元素进行修改的selection部分以及命名空间的两个方法，我把对选择器的操作所有方法分为两部分，第一部分是对选择器中元素属性的操作，attr、classed、style、property、text、html，第二部分是对这些元素的node节点进行操作，append、insert、remove、clone、sort、order、raise、lower、create、creator，其中大部分还是对domAPI的封装，比如createElement、appendChild等等。能让我方便的以数据驱动的方式设置属性和操作节点增删改查创建排序等等。   
简单使用时最频繁的还是attr、style、text以及append，设置节点的属性,以及向选择器中添加节点，就能解决大多数问题。  
# 深度阅读：  
源码及解析：https://github.com/dongoa/evs-selection  
XML命名空间：http://www.w3school.com.cn/xml/xml_namespaces.asp  
DOM classList属性： https://www.runoob.com/jsref/prop-element-classlist.html  
HTML attribute和property的区别：https://segmentfault.com/a/1190000008781121?utm_source=tag-newest
JS判断类型4种方法：https://www.cnblogs.com/onepixel/p/5126046.html  
Node.compareDocumentPosition():https://developer.mozilla.org/en-US/docs/Web/API/Node/compareDocumentPosition  

## 添加数据
这部分开始介绍Join，讲解的两个文章[selection.join notebook](https://observablehq.com/@d3/selection-join)[Thinking With Joins](https://bost.ocks.org/mike/join/)  
### selection.data([data[, key]])  
讲述数据数组绑定到元素上，返回绑定成功的selection表示update状态，同时也定义了enter，exit状态在返回的选择器上，数据可以为任意数组(数字，对象数组...)或者一个返回数组函数，存储在选择器的__data__属性中，从而使数据具有“粘滞性”。  
结合join、enter、exit、append、remove，可以以数据驱动的方式添加、更新、删除元素，如下例子从matrix中创建html：  
```
const matrix = [
  [11975,  5871, 8916, 2868],
  [ 1951, 10048, 2060, 6171],
  [ 8010, 16145, 8090, 8045],
  [ 1013,   990,  940, 6907]
];
evs.select("body")
  .append("table")
  .selectAll("tr")
  .data(matrix)
  .join("tr")
  .selectAll("td")
  .data(d => d)
  .join("td")
    .text(d => d);
```
再该例子中，通过matrix的长度添加table行数。 
如果没有指定key，则按数本身据顺序进行添加，如果key为函数，为每个元素执行该函数返回的字符串添加为当前元素(这里就只源码中的keyValue，类似于一个标记位)，并把数据节点合并到enter中。  
**data源码解析**如果只看文档真是一头雾水，这里设计的原则就是为选择器添加了几个数组类属性，目前现在可以理解为data、enter、update、exit，当我们data一个数据的时候，会先根据data中的数据分别向这三个数组中添加元素，数据驱动的含义也在这里，update为更新过的数组，即原来的该节点的数据中和新加入的data冲突了，更新原来已有的节点已绑定数据的数据，enter就是data中去掉了更新的那部分剩余的数据，相当于添加新元素节点，exit会存放哪些无法与数据匹配上的，或数据长度就那么多，多余出来的原先存在的节点，相当于删除掉哪些节点了。当然最后作者删掉了update，因为这只是一个过程变量，不需要进行存储了。  
你可以简单理解为enter会向原节点添加进去绑定数据，以方便以该数据驱动添加节点，exit数组存储的则为删除与数据不匹配的节点，update就是最后的返回值。源代码：不想看就跳过，但我觉着看一下代码就豁然开朗了：  
```
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
```  
例如这个文档：  
```
<div id="Ford"></div>
<div id="Jarrah"></div>
<div id="Kwon"></div>
<div id="Locke"></div>
<div id="Reyes"></div>
<div id="Shephard"></div>
```
通过key函数添加数据：  
```
const data = [
  {name: "Locke", number: 4},
  {name: "Reyes", number: 8},
  {name: "Ford", number: 15},
  {name: "Jarrah", number: 16},
  {name: "Shephard", number: 23},
  {name: "Kwon", number: 42}
];
d3.selectAll("div")
  .data(data, function(d) { return d ? d.name : this.id; })
    .text(d => d.number);

```
key函数通过判断d是否存在，返回name或id，以为当前选择器元素没有绑定过数据，元素上的数据(datum)即上面代码证d为空，如果元素绑定过了数据，则d为费空。  
更新(update)和添加(enter)以数据顺序进行，删除状态(exit)保留原有的顺序，也许在指定了key时选择器中的元素顺序与文档中的元素顺序不一致，此时需要用前面提到的selection.order或sort对文档排序，关于key函数的更多理解[Let’s Make a Bar Chart, II](https://bost.ocks.org/mike/bar/2/)[Object Constancy](https://bost.ocks.org/mike/constancy/)  
如果没有指定data，则返回选择器元素的数据数组，该方法不能用来清除绑定数据，使用selection.datum.  
### selection.join(enter[, update][, exit]) 
根据之前绑定的数据data，对元素添加、删除、重新排序，是enter、exit、append、remove、oreder的显示替换。代码实现也是封装的这些函数。用法如下  
```
svg.selectAll("circle")
  .data(data)
  .join("circle")
    .attr("fill", "none")
    .attr("stroke", "black");
```
并且可以传入函数控制每个操作：  
```
svg.selectAll("circle")
  .data(data)
  .join(
    enter => enter.append("circle").attr("fill", "green"),
    update => update.attr("fill", "blue")
  )
    .attr("stroke", "black");
```
换可以通过第三个函数删除，返回值会合并enter和update并返回通过分隔enter和update，以及在data中添加key函数，可以最小化对dom的更改以优化性能。  
还可以通过在enter、update、exit中创建过渡来设置动画，为避免破坏方法链用selection.call创建过渡,或返回一个未定义的enter、update组织合并。  
### selection.enter() 
返回选择器的enter状态，对于每个绑定好的数据(datum)没有对应DOM元素的占位符节点，如果没有selection.data掉用后使用，返回值为空。  
选择器的enter状态通常用于创建与新数据缺失的元素，如下根据数组数据创建div：  
```
const div = d3.select("body")
  .selectAll("div")
  .data([4, 8, 15, 16, 23, 42])
  .enter().append("div")
    .text(d => d);
```
如果body为空，该程序会创建6个div，根据数组数据的顺序，将其文本内容指定为关联数据(强制为字符串类型)。  
```
<div>4</div>
<div>8</div>
<div>15</div>
<div>16</div>
<div>23</div>
<div>42</div>
```
从概念上讲，enter桩体的占位符是指向父元素的指针(上面例子中为body)，该方法通常用于添加元素，添加后与update状态的选择器合并，使得应用于enter和update两个状态。  
enter的实现原理是在enter.js中定义了一个enterNode对象，给选择器添加这个对象，前面提到的进入enter状态，就是返回一个新的选择器，这个选择器构造是传入的是上一条链路选择器的.\_enter,及其父节点。源码如下   
```
import sparse from './sparse.js'
import {Selection} from '.index.js'

export default function () {
    return new Selection(this._enter || this._groups.map(sparse),this._parents);
}
//在这里定义了enternode对象 这里也是构造函数加原型模式
export function EnterNode(parent,datum) {
    this.ownerDocument = parent.ownerDocument;
    this.namespaceURI=parent.namespaceURI;
    this._next = null;
    this._parent = parent;
    this.__data__=datum;
}
EnterNode.prototype={
    constructor:EnterNode,
    appendChild:function(child){  return this._parent.insertBefore(child, this._next); },
    insertBefore:function(child,next){ return this._parent.insertBefore(child,next); },
    querySelector:function(selector){ return this._parent.querySelector(selector); },
    querySelectorAll:function(selector) { return this._parent.querySelectorAll(selector); }
};
```
### selection.exit() 
返回删除的selection元素，文档中没有被添加数据的节点。通常用于添加新数组前删除旧数据与多余元素。  
```
div = div.data([1, 2, 4, 8, 16, 32], d => d);
```
data操作根据前面enter中的数据已经传入了[4, 8, 15, 16, 23, 42]，新数据重复的有4,8,16，因此update这三个，可以使用enter添加1,2,32三个新元素。  
```
div.enter().append("div").text(d => d);
```
删除旧数据中的15,23,42：  
```
div.exit().remove();
```
现在文档是这样：  
```
<div>1</div>
<div>2</div>
<div>4</div>
<div>8</div>
<div>16</div>
<div>32</div>
```
这里DOM的顺序与数据一致因为新旧数据都是一样的顺序，如果新加入的顺序不同，使用selection.order重新排序。  
### selection.datum([value]) 
获取或设置每个元素的绑定数据，这种方法不selection.data不同。不会join，也不影响enter和exit，其内部实现实际上是this.node().\_\_data\_\_直接获取或设置数据。  
在指定了value的情况下，如果是常量则赋值，函数的话返回值设置为数据(在每个节点上数据绑定的名称为\_\_data\_\_)，为null会删除该元素绑定的数据。  
如果没有指定值，返回第一个非空节点绑定的数据，这在只有一个节点时很有用，  
此方法在对于H5中的自定义属性非常有效，例如给定如下元素：  
```
<ul id="list">
  <li data-username="shawnbot">Shawn Allen</li>
  <li data-username="mbostock">Mike Bostock</li>
</ul>
```
通过此方法将元素上绑定的数据设置为内置dataset属性。  
```
selection.datum(function() { return this.dataset; })
```
# 总结
这一份是对数据绑定原理的解析，以及数据的几个状态，当我们分析数据时，最有效的几个操作添加数据、删除数据、更新数据，d3的作者用这几个简答的api全部解答了，换绑定到了dom上，使得dom可以根据数据进行同样的添加删除更新。其中基本的原理还视在selection对象上，我们给selection添加了这么几个属性enter(存储添加元素的数据节点数组)、exit(存储删除了的节点数组)、update(这个是根据新数据更新的数据绑定的节点数组)以及__data__(单个节点上的数据属性，保存数据内容)。这几个api中，data是必须的，data后可以对selectin进行enter、exit操作，以及datum查看或设置data值，以及一个抽象出来的join函数，简化enter、exit操作优化了速度。  
高层接口：在我使用时就可以直接使用data.enter.进行数据绑定，其他操作在需要时添加即可。
# 深度阅读：  
源码及解析：https://github.com/dongoa/evs-selection 
点个赞再走！

## 事件处理  
出于交互考虑，selection支持监听(listening)和分派(dispatching)事件。  
### selection.on(typenames[, listener[, options]]) 
根据typenames向元素添加或删除事件监听，类型为字符串如click、mouseover、[DOM event type](https://developer.mozilla.org/en-US/docs/Web/Events#Standard_events)都支持，可以通过click.foo添加回调函数，多个name用空格分隔。  
当一个事件分派到元素上，lisetener总是会看到最后的数据，如果之前已经绑定了事件会更新事件，传入null删除事件，.foo删除所有监听。  
option设置监听器的特性，capturing还是passive，详情查看[addEventListener](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener)  
未指定监听器时会返回监听器(第一个)。  
源码实现中给selection添加了一个__on的数组对象存储事件，并区分了事件类型进行调用filterContextListener/contextListener,首先解析typenames,然后根据参数去判断添加删除  
```
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
```
### selection.dispatch(type[, parameters])  
按顺序将指定类型的自定义事件发送到元素，parameters有这几个选项，bubbles，反向树的顺序即冒泡事件，cancelable，event.preventDefault阻止事件传播，detail，关联自定义数据，如果是个函数计算后返回上述选项。  
代码实现上使用CustomEvent、createEvent、initEvent创建自定义事件。  
```
function dispatchEvent(node,type,params) {
    var window = defaultView(node),
        event=window.CustomEvent;
    if(typeof event === "function"){
        event = new event(type,params);//>>>
    }else{
        event = window.document.createEvent("Event");
        if(params) event.initEvent(type,params.bubbles,params.cancelable),event.detail=params.detail;
        else event.initEvent(type,false,false);
    }
    node.dispatchEvent(event);
}
```
### d3.event
保存当前的事件(存在时)，这是在调用监听器时设置并在终止后重置，使用此选项可以访问标准事件字段如[ event.timeStamp](https://www.w3.org/TR/dom/#dom-event-timestamp)[ event.preventDefault](https://www.w3.org/TR/dom/#dom-event-preventdefault),虽然可以使用event.pageX,event.pageY,但使用d3.mouse,d3.touch,d3.touches,转化为本地坐标更容易。  
### d3.customEvent(event, listener[, that[, arguments]]) 
使用that作为this传入arguments参数调用event事件，在调用期间，d3.event设置为指定事件，函数返回后回调，此外，将event.sourceEvent设为先前的d3.event，允许用户自定义事件对原生事件的引用，返回listener返回的值。  
源码d3.event就是存储在on.js中的一个变量，回调的这种方式不会影响原来的值；  
```
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
```
### d3.mouse(container)   
返回当前事件对应容器(HTML或SVG元素)的[x,y]坐标，点击后的坐标位置转换方法如下(point.js)  
```
export default function (node, event) {
    var svg=node.ownerSVGElement || node;

    if(svg.createSVGPoint){
        var point=svg.createSVGPoint();
        point.x  =event.clientX, point.y=event.clientY;
        point = point.matrixTransform(node.getScreenCTM().inverse());
        return [point.x,point.y];
    }
    var rect=node.getBoundingClientRect();
    return [event.clientX - rect.left - node.clientLeft,event.clientY-rect.top-node.clientTop];
}
```
### d3.touch(container[, touches], identifier)  
返回指定识别码identifier容器下的触摸坐标[x,y],如果在指定identifier下touch事件，返回null，这对于忽略在触摸移动实践中只有部分触摸移动的情况非常有效，默认为changeTouches。  
代码实现中利用changeTouches，去寻找指定的事件点发生的位置。  
### d3.touches(container[, touches]) 
以双元数组形式返回触摸事件点[[x1, y1], [x2, y2], …]。  
### d3.clientPoint(container, event)
返回指定事件相对于容器的坐标[x,y],如上面(point.js)  

## 控制流
对于高级用法，selections提供了用户自定义控制流的方法。  
### selection.each(function)
类似于数组的each，为每个元素调用function，代码实现当然为selection自己的数据结构而配置的。对于创建同时访问父元素和子元素上下文非常有用。    
```
parent.each(function(p, j) {
  d3.select(this)
    .selectAll(".child")
      .text(d => `child ${d.name} of ${p.name}`);
});
```
稍微分析一下，this是parent的上下文，我们再去选择chiild此时text中的d的this就成了孩子节点的上下文，在此同时也是可以访问p.namem,就达到同时访问的目的了。  
### selection.call(function[, arguments…])
调用指定函数一次，传入参数返回selection，相当于手动调用函数，但这个方法支持链式调用，例如下面可重用的设置样式的函数：  
```
function name(selection, first, last) {
  selection
      .attr("first-name", first)
      .attr("last-name", last);
}
```
然后调用：  
```
d3.selectAll("div").call(name, "John", "Snow");
```
与下面结果相同：  
```
name(d3.selectAll("div"), "John", "Snow");
```
唯一的区别是selection.call为了支持链式调用会返回selection，而不是name的返回值。  
###  selection.empty() 
如果selection不包含元素，返回true  
###  selection.nodes() 
返回选择器中所有元素  
### selection.node()
返回选择器第一个非空节点  
### selection.size() 
返回选择器中节点的数量  

## 局部变量
d3 local允许你定义独立于数据的状态，例如在渲染时间序列时，您可能需要使用相同的x比例尺以及不同的y比例尺
### d3.local() 
声明一个新的局部变量  
```
const foo = d3.local();
```
与var相同的是每一个local是唯一的，不同的是local的范围由DOM确定。  
### local.set(node, value) 
给该local设置值，并返回value：  
```
selection.each(function(d) { foo.set(this, d.value); });
```
如果只添加了一个变量，也可以这样：  
```
selection.property(foo, d => d.value);
```
从这就可以看出，我们可以给元素添加多个local。  
### local.get(node)  
返回节点上的local值,如果未定义local返回最近祖先上的值，没有返回undefined。  
### local.remove(node)  
删除该节点上的local值，如果删除之前定义了local则返回true，该节点没有local返回false，祖先上的local不受影响，因此local.get仍返回值。  
### local.toString()  
返回local自动生成标识符，类似于一个识别码用来唯一之别nodelocal上的value的值，换可以通过element[local]\(这里是因为local也是个对象，传入时会自动去调用toString\)或者selection.property来设置或获取local的value。
源代码：  
```
var nextId=0;
export default function local() {
    return new Local;
}

function Local() {
    this._="@"+(++nextId).toString(36);
    //Number.prototype.toString([radix])中的
    // radix 指定要用于数字到字符串的转换的基数(从2到36)。
    // 如果未指定 radix 参数，则默认值为 10。所有不在范围内的基数会报错
}
Local.prototype=local.prototype={
    constructor:Local,
    get:function (node) {
        var id=this._;
        while(!(id in node)) if (!(node=node.parentNode)) return;
        return node[id];
    },
    set:function (node,value) {
        return node[this._]=value;
    },
    remove:function (node) {
        return this._ in node && delete node[this._];
    },
    toString: function () {
        return this._;
    }
}
```
总之local方便用户在局部范围进行操作，这个范围指元素节点，实现原理就是给节点添加属性，为了名字不重复定义了一个自动生成的标识符this.\_来取得唯一的名字，并把他们统一到一个对象Local中。  
# 总结
selection的事件处理，最核心的是on方法，灵活多变的事件添加，其次就是用户自定义事件的customEvent和触发dispatch，对于在svg画图的情况下，我们非常有必有知道的是触发事件相对于svg下的坐标，mouse、touch、touches、clienPoint解决了这个问题。
对于控制流中的函数，是作者在完成整个selection模块时产生的一些中间组件，作者把他们抽象出来，可以让用户在使用时更加便利。  
对于局部变量部分，local的定义就是一个对selection局部进行操作的变量。  
到这里就把selection模块的内容分4篇文章说完了，其中最主要的还是数据绑定部分，这也是d3数据驱动的最大的特色，算是d3js的核心了。然后目前为止完成了3个模块的源码解析，任重而道远啊！
# 深度阅读：  
源码及解析：https://github.com/dongoa/evs-selection  
MouseEvent.relatedTarget事件属性：https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/relatedTarget  
timeStamp 事件属性：https://www.w3cschool.cn/jsref/event-timestamp.html   
CustomEvent自定义事件：https://www.jianshu.com/p/1cf1c80c0586  
changedTouches:https://www.cnblogs.com/mengff/p/6005516.html  
SVGElement:https://developer.mozilla.org/zh-CN/docs/Web/API/SVGElement  
SVG窗口坐标系的转换：http://blog.iderzheng.com/something-about-svg-with-javascript/  
offsetLeft,Left,clientLeft的区别:https://www.cnblogs.com/panjun-Donet/articles/1294033.html  
changedTouches：https://segmentfault.com/q/1010000002870710  
TouchEvent:https://developer.apple.com/documentation/webkitjs/touchevent#//apple_ref/javascript/instp/TouchEvent/changedTouches  
