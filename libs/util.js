/**
 * @author: prozac <516060659@qq.com>
 * @createTime: 2018-7-3
 * @copyRight: UNDEFINED
 */

 /*------------------------------------------------------------------------------------*/
 Array.prototype.remove = function(item) {
     var index = this.indexOf(item);
     if(index !== -1){
         this.splice(index, 1);
     }
     return this;
 };

 Array.prototype.merge = function(arr) {
     var mergeResult = [];
     this.map(item => {
         mergeResult.push(item);
     });
     arr.map(item => {
         mergeResult.push(item);
     });
     return mergeResult;
 };

 Array.prototype.isEmpty = function() {
     return this.length == 0;
 };

 Array.prototype.showInList = function() {
     function formatList(list) {
         var result = "[";
         list.map(item => {
             if (Array.isArray(item)) {
                result = result + formatList(item);
             }else {
                result = result + String(item);
             }
             if (list.indexOf(item) !== list.length - 1) {
                 result = result + ", ";
             }
         });

         return result + "]";
     }

     return formatList(this);
 };

 /*------------------------------------------------------------------------------------*/
 function isUndefined(obj) {
     if(typeof(obj) == "undefined"){
         return true;
     }else{
         return false;
     }
 }

 function myLog(base, num){
     return Math.log(num) / Math.log(base);
 }

 function isEven(num) {
     return num % 2 == 0;
 }

/*------------------------------------------------------------------------------------*/
function normalLine(t, p1, p2){
    return [t * p1[0] + (1 - t) * p2[0],
            t * p1[1] + (1 - t) * p2[1]];
}

/*------------------------------------------------------------------------------------*/
function isEmptyObject(obj){
    if (JSON.stringify(obj) == '{}') {
        return true;
    } else {
        return false;
    }
}
