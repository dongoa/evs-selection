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
Node.compareDocumentPosition():
https://developer.mozilla.org/en-US/docs/Web/API/Node/compareDocumentPosition  
