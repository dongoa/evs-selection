import select from './src/select.js'//这个select是全局的
import selectAll from './src/selectAll.js'
var evsselect  = select('div');
console.log(evsselect);
// //第一步调用的selection对象的方法，返回的也是Selection
var select_select = evsselect.select('p');
console.log(select_select);

// var evsselectAll  = selectAll('div');
// console.log(evsselectAll);
// //
// var selectAll_select = evsselectAll.select('p');
// console.log(selectAll_select);