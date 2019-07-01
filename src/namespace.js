import namespaces from "./namespaces.js";

export default function(name) {
  var prefix = name += "", i = prefix.indexOf(":");
  if (i >= 0 && (prefix = name.slice(0, i)) !== "xmlns") name = name.slice(i + 1);
  //这里xmlns比较特殊，因为xmlns 属性可以在文档中定义一个或多个可供选择的命名空间，所以如果是xmlns，也会返回name
  return namespaces.hasOwnProperty(prefix) ? {space: namespaces[prefix], local: name} : name;
}