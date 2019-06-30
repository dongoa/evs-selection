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
d3.select("body")
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

### d3.select(selector):  
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

###  d3.selectAll(selector) ：
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
d3作者讲这部分代码整合在了selection.style(src/selection/style.js)属性的代码中。


# 总计：
到这里selcetion模块的**选择元素操作的方法就**结束了。这个模块代码文件个数非常多:结构分为两部分，一部分对外开放的接口放在src/中，一部分是内部的Selection对象的方法，放在src/selection/中，其模块的结构是这样的，selection模块，该模块寄生于一个(当前选择器为document,parents为空)Selection对象，他们共享原型方法，这也使得我们可以去修改原型添加方法，当我们使用该模块选择元素的时候，最开始肯定是要对整个文档进行选取，使用evs.select/evs.selectAll，然后在使用selection.select去选择。  
**高层接口**：所以最基础的是四个方法，sev.select/selectAll是对整个文档选择，selection.select.selectAll是对已有的选择器再去嵌套选择，简单的选择操作使用这些结合选择器就够用了。  
对于其中对外开放的**其他接口**，有2个对选择器进行的操作，合并merge和过滤filter，底层还开放出了evs.selector/selectorAll、matcher这样内部使用的闭包函数，及获取根节点的window和获取样式的style。为了不让文章过长这一部分就介绍这些。如果原理部分我的文字难已说明白还非常建议结合源码食用。


# 深度阅读：  
Element.matches(selectorString)选择元素:https://developer.mozilla.org/zh-CN/docs/Web/API/Element/matches
Window.getComputedStyle()计算后的css属性值：https://developer.mozilla.org/zh-CN/docs/Web/API/Window/getComputedStyle
