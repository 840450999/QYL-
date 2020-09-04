//  通用节流函数
// thro :: number -> fn a -> (thro time)fn a
var thro = function (time, fn) {
    var run = true;
    if (!fn) { err("thro节流函数 第二参数fn未传 执行默认 time => 200 fn => time方案"); fn = time; time = 200; }

    return function () {
        if (!run) { return; }
        run = !run;
        setTimeout(function () { fn(); run = !run; }, time);
    }
}
// 通用防抖函数
//  ois :: number time -> fn a -> (ois time)fn a
var ois = function (time, fn) {
    var tname = null;
    if (!fn) { err("ois防抖函数 第二参数fn未传 执行默认 time => 200 fn => time方案"); fn = time; time = 200; }
    return function () {
        tname && clearTimeout(tname);
        tname = setTimeout(function () { fn(); }, time);
    }
}

// 计算缓存结果函数（function不支持）
// momorize :: fn a ->  (cache)fn a
function momorize(f) {
    var cache = Object.create(null);
    return function () {
        var arg = JSON.stringify(arguments);
        cache[arg] = cache[arg] || [f.apply(f, arguments)];
        return cache[arg][0];
    }
}

// 柯里化函数（不限次数非严格版本，可以允许传入参数大于函数本身定义参数，参数足够或大于才会执行传参操作）
function curry(f, arg, rev) {
    var arg = arg || [];
    return function () {
        var args = arg.concat([].slice.call(arguments));
        return (f.length <= args.length) ? f.apply(f, rev ? args.reverse() : args) : curry.apply(f, [f, args, rev]);
    }
}

// 规定次数柯里化函数（首个参数接受函数应当具备的参数个数，超出或等于该数值才会执行函数）
function $curry(index, f, arg, rev) {
    var arg = arg || [];
    return function () {
        var args = arg.concat([].slice.call(arguments));
        return (index <= args.length) ? f.apply(f, rev ? args.reverse() : args) : $curry.apply(f, [index, f, args, rev]);
    }
}

// 需要配合curry柯里化函数使用
// 哨兵函数（用于处理多次的异步操作,规定次数后同时传入最后要执行的函数后，
// 会返回一个函数,该函数每次接受一个名称与值,该名称与值会在最后函数执行的时候作为对象的属性名和属性值传入
// 需要执行次数达到最初规定的次数才会执行最初传入的函数）
// sentry :: number ->  fn a -> (curry)fn a
function sentry(index, fn) {
    var i = 0,
        cache = {};

    return curry(function sentryChild(key, value) {
        i++;
        cache[key] = value;
        i >= index && fn(cache);
    })
}

// 一个会对传入参数进行方法过滤的函数，可以使用该函数对传入参数进行过滤或者修改，组合成一个新的函数
function fArg(f, filters) {
    if (this instanceof fArg) {
        this._f = f;
        this.filters = filters || {};
    } else {
        return new fArg(f, filters);
    }
}

fArg.prototype.set = function (x, f) {
    this.filters[x] = f;
    return this;
}

fArg.prototype.get = function () {
    var filters = this.filters,
        f = this._f;

    return function () {
        var arg = [].slice.apply(arguments);

        for (var i in filters) {
            arg[i] = filters[i](arg[i]);
        }

        return f.apply(f, arg);
    }
}