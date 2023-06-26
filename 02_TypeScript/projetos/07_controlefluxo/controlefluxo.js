function imprimir(obj) {
    if (typeof obj === 'string') {
        console.log(obj);
    }
    else {
        for (var _i = 0, obj_1 = obj; _i < obj_1.length; _i++) {
            var x = obj_1[_i];
            console.log(x);
        }
    }
}
imprimir(['abc', 'def']);
imprimir('ghi');
