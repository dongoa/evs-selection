import sourceEvent from './sourceEvent.js';
import point from "./point";
export default function (node,touches,identifier) {
    if(arguments.length < 3) identifier=touches,touches=sourceEvent().changeTouches;

    for(var i=0,n=touches ? touches.length : 0, touch; i < n ; i++){
        if((touch = touches[i]).identifier === identifier){
            return point(node,touch);
        }
    }
    return null;
}