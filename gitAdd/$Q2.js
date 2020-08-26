(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
        typeof define === 'function' && define.amd ? define(factory) :
            (global = global || self, global.$Q = factory());
}(this, function () {
    'use strict';


    function type(str) {
        return function (o) {
            return Object.prototype.toString.call(o) === "[object " + str + "]"
        }
    }



    var isObject = type("Object"),
        isString = type("String"),
        isRegExp = type("RegExp"),
        isArr = type("Array"),
        isFun = type("Function"),
        isNum = type("Number")


    function _isObject(obj) {
        return obj !== null && typeof obj === 'object'
    }

    function isExist(Q) {
        return Q !== undefined && Q !== null;
    }

    function isUnExist(Q) {
        return Q === undefined || Q === null;
    }


    function isTrue(Q) {
        return Q === true;
    }

    function isFalse(Q) {
        return Q === false;
    }

    var kaifaErr = true;



    function err(x) {
        kaifaErr && [].slice.call(arguments).forEach(function (x) { console.error(x) })
    }




    function extend(target, sourse) {
        var i = 1,
            args = [].slice.apply(arguments),
            isTrue = typeof args[args.length] == "boolean" ? args.pop() : true;

        if (args.length == 1) {
            target == this instanceof window ? {} : this;
            i = 0;
        }

        while (sourse = args[i++]) {
            for (var key in sourse) {
                if (!(key in target) || isTrue) {
                    target[key] = sourse[key];
                }
            }
        }
        return target;
    }


    function momorize(f) {
        var cache = Object.create(null);
        return function () {
            var arg = JSON.stringify(arguments);
            cache[arg] = cache[arg] || [f.apply(f, arguments)];
            return cache[arg][0];
        }
    }


    function remove(arr, item) {
        if (arr.length) {
            var index = arr.indexOf(item);
            if (index > -1) {
                return arr.splice(index, 1);
            }
        }
    }

    function toNumber(val) {
        var n = parseFloat(val);
        return isNaN(n) ? val : parseFloat(val);
    }


    function define(obj, key, val, enumerable) {
        Object.defineProperty(obj, key, {
            value: val,
            configurable: false,
            writable: true,
            enumerable: !!enumerable
        })
        return val;
    }


    // str -> bool -> fn 
    function makeMap(
        str,
        lowerCase
    ) {
        var map = Object.create(null),
            list = str.split(",");
        for (var i = 0, l = list.length; i < l; i++) {
            map[list[i]] = true;
        }
        return lowerCase
            ? function (val) { return map[val.toLowerCase()]; }
            : function (val) { return map[val]; }
    }


    function toArray(list, start) {
        start = start || 0;
        var i = list.length - start
        var ret = new Array(i);
        while (i--) {
            ret[i] = list[i + start];
        }
        return ret;
    }


    // 特性函数区
    function curry(f, arg, rev) {
        var arg = arg || [];
        return function () {
            var args = arg.concat([].slice.call(arguments));
            return (f.length <= args.length) ? f.apply(f, rev ? args.reverse() : args) : curry.apply(f, [f, args, rev]);
        }
    }
    $Q.curry = curry;

    function $curry(index, f, arg, rev) {
        var arg = arg || [];
        return function () {
            var args = arg.concat([].slice.call(arguments));
            return (index <= args.length) ? f.apply(f, rev ? args.reverse() : args) : $curry.apply(f, [index, f, args, rev]);
        }
    }


    function sentry(index, fn) {
        var i = 0,
            cache = {};

        return curry(function sentryChild(key, value) {
            i++;
            cache[key] = value;
            i >= index && fn(cache);
        })
    }

    var thro = function (time, fn) {
        var run = true;
        if (!fn) { err("thro节流函数 第二参数fn未传 执行默认 time => 200 fn => time方案"); fn = time; time = 200; }

        return function () {
            if (!run) { return; }
            run = !run;
            setTimeout(function () { fn(); run = !run; }, time);
        }
    }

    var ois = function (time, fn) {
        var tname = null;
        if (!fn) { err("ois防抖函数 第二参数fn未传 执行默认 time => 200 fn => time方案"); fn = time; time = 200; }
        return function () {
            tname && clearTimeout(tname);
            tname = setTimeout(function () { fn(); }, time);
        }
    }

    // 特性函数区结束


    // 过滤函数

    //   filterArg :: Fa(a -> b) ->Fb(a -> b) -> Number -> Number -> Fa(Fb(a) -> b ) 
    function filterArg(fn, filter, start, index) {
        index = isUnExist(index) ? 1 : index;
        start = isUnExist(start) ? 0 : start;
        return function () {
            var arg = [].slice.call(arguments);
            while (index--) { arg.splice(start + index, 1, filter(arg[start + index])) };
            return fn.apply(fn, arg);
        }
    }

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

    // var a=sentry(2,function(){console.log("我执行了",arguments)})
    // a("name",2)
    // a("aa",2)

    //  compose :: (a -> b) -> (a -> b) -> a
    // function compose() {
    //     var arg = [].slice.call(arguments);
    //     return function (x) {
    //         for (
    //             var l = arg.length - 2,
    //             sourse = arg[l + 1](x),
    //             fn = arg[l];
    //             l + 1;
    //             fn = arg[--l]
    //         ) {
    //             sourse = fn(sourse)
    //         }
    //         return sourse;
    //     }
    // }

    //  compose :: (a -> b) -> (a -> b) -> a
    // function compose() {
    //     if (!arguments.length) { return; }
    //     var arg = [].slice.call(arguments);
    //     return function (x) {
    //         for (
    //             var l = arg.length - 1,
    //             i=1,
    //             sourse = arg[0](x),
    //             fn = arg[1];
    //             i < l;
    //             fn = arg[++i]
    //         ) { 
    //             sourse = fn(sourse)
    //         }
    //         return sourse;
    //     }
    // }

    function $compose() {
        var arg = [].slice.call(arguments);
        return function (x) {
            arg.reduce(function (a, b) {
                return $(b)(a);
            }, $(arg.shift())(x))
        }
    }


    function _compose() {
        var arg = [].slice.call(arguments);

        return function _composeChild(x) {
            var oneFn = arg.shift(),
                $oneFn = $(oneFn),
                ret = $oneFn(x),
                index = 0,
                sync = true,
                fname = "";
            if (arg.length === 0) { return ret; }
            if (!ret) {
                if (noErrorMethods($oneFn.name)) { return; }
                err("函数" + oneFn + "断开,同步位置", 0); return;
            }

            arg.every(function (f, i) {
                if ((fname = f.name) && fname.search("sync") != -1) {
                    sync = false;
                    asyncFn(f, _compose.apply(this, arg.splice(i + 1, arg.length - 1)), ret);
                    return undefined;
                }
                index = i;
                return ret = ($oneFn = $(f))(ret);
            })

            arg.unshift(oneFn);

            if (index + 1 != (arg.length - 1) && sync) {
                if (noErrorMethods($oneFn.name)) { return; }
                err("函数" + arg[index + 1] + "断开,同步位置" + (index + 1))
            }
            return ret;
        }
    }

    // function _compose() {
    //     return compose2.apply(this,
    //         [].slice.call(arguments).map(function (x) {
    //             return $(x);
    //         })
    //     )
    // }

    // function $compose() {
    //     return compose.apply(this,
    //         [].slice.call(arguments).map(function (x) {
    //             return $(x);
    //         })
    //     )
    // }


    function curObject(fn, str, obj) {
        var items = str.split(".")
        items.reduce(function (cur, key, index) {
            if (!cur[key]) { console.error("对象", cur[key], "索引" + key + "不存在"); return cur };
            items.length - 1 === index && (cur[key] = fn(cur[key]));
            return cur[key];
        }, obj)
        return obj;
    }

    var arrayMethods = makeMap("filter,every,some,map,forEach,reduce,reduceRight,sort"),
        objectMethods = makeMap("maybe,noMaybe,filterObj"),
        noErrorMethods = makeMap("maybeChild,noMaybeChild"),
        $objectMethods = {
            maybe: function maybe(f) {
                var fns = f(),
                    items = null;

                return function maybeChild(obj) {
                    for (var i in fns) {
                        curObject(fns[i], i, obj);
                    }
                    return obj;
                }
            },
            noMaybe: function noMaybe(f) {
                var fns = f(),
                    items = "";

                return function noMaybeChild(obj) {
                    for (var i in fns) {
                        curObject(
                            function (x) {
                                return items = fns[i](x);
                            }, i, obj);

                        if (!items) { return items };
                    }
                    return obj;
                }
            }
        }

    var stringMethods = {
        console: function (x) {
            console.log("console=>", x);
            return x;
        },
        empty: function empty(x) {
            for (var i in x) {
                var item = x[i];
                (!item) && console.error(x, i + "为空");
                if (typeof item == "object") {
                    empty(item);
                }
            }
            return x;
        }
    }
    function asyncFn(f1, f2, data) {
        var names = f1.name.split("_");
        return f1(sentry(names[1], f2), data);
    }

    function $(f) {
        if (isFun(f) && f.name) {
            var name = f.name.split("_")[0];
            if (arrayMethods(name)) {
                return curry(function (fn, data) {
                    if (!isArr(data)) { err("传入数据非数组类型"); return data; }
                    return data[name](fn);
                })(f);
            }
            if (objectMethods(name)) {
                return $objectMethods[name](f);
            }

        }
        if (typeof f === "string") {
            return stringMethods[f]
        }
        return f;
    }

    // compose(function () { return 2 }, alert, function () { return 2 })()


    function filter_left5(a) {
        return a < 5;
    }

    function async_2_a(a, b) {
        setTimeout(() => a("name", extend({ name: 33333333 }, b)), 200);
        a("name2", 2)
        console.log("async执行")
    }

    function noMaybe_a(x) {
        return {
            "a": function (x) {
                // console.log(x, 2);
                return x;
            }
        }
    }


    // _compose(
    //     function filter_right_5(x) {
    //         return x > 5;
    //     },
    //     "console",
    //     function sort(a, b) {
    //         return a-b;
    //     },
    //     "console",
    //     function sync_2_fn(fn, data) {
    //         setTimeout(function () {
    //             fn("name")("异步定义的名称");
    //         }, 2000)
    //         fn("大于五", data);
    //     },
    //     "console",
    //     (x)=>document.body.innerHTML = x["大于五"]
    // )
    //     ([2,3,4,11,2,3,100,6,7])
    
    $compose(function (x) {
        return x.filter(function (i) {
            return i > 5;
        })
    },
        function (x) {
            console.log(x)
        })
        ([1, 2, 6, 7, 8, 9, 22])

    _compose(
        function filter_noName(x, i, key) {
            return x.age > 20;
        }
        , "console"
    )
        ([{ name: "a1", age: 18 }, { name: "a2", age: 20 }, { name: "a3", age: 21 }, { name: "a4", age: 25 }])

    // function allFn(fn, data) {
    //     var ret;
    //     if (isArr(data)) {
    //         ret = [];
    //         for (var i = data.length; i; i--) {
    //             ret.unshift(fn(data[i]));
    //         }
    //     }

    //     if (isObject(data)) {
    //         ret = Object.create(null);
    //         for (var i in data) {
    //             ret[i] = fn(data[i])
    //         }
    //     }
    //     if (isFun(data)) { ret = fn(data); }
    //     return ret;
    // }



    // 过滤函数结束

    var repMid = curry(function (spt, str) {
        str = str.replace(/([\$\(\)\[\]\*\+\.\?\/\^\|])/g, "\\$1")
        var arr = str.split(spt);
        return new RegExp(arr[0] + "\(.*?\)" + arr[1], "g");
    })


    function getMid(reg, str, fn, err) {
        var val = str.replace(reg, function (a, b) {
            return fn(b);
        })
        err && val === str && err(str);
        return val;
    }

    $Q.strMod = curry(
        fArg(getMid)
            .set(0, repMid("-"))
            .get()
    );;


    function Event(name) {
        this._events = Object.create(null);
        define(this._events, "__name", name);
        this.evList = Object.create(null);
    }

    Event.prototype.$on = function $on(name) {
        var self = this,
            fns = [].slice.call(arguments, 1);

        if (isArr(name)) {
            for (var i = 0, l = name.length; i < l; i++) {
                self.$on.apply(self, [name[i]].concat(fns));
            }
        } else {
            self.evList[name] = true;
            self._events[name] = (self._events[name] || []).concat(fns);
        }
        return self;
    }

    Event.prototype.$unEmit = function (name) {
        this.evList[name] = false;
    }

    Event.prototype.$emit = function $emit(name, data) {
        var self = this,
            datas = [].slice.call(arguments, 1),
            evs = null,
            scope = null;
        if (!self.evList[name]) { return; }
        if (isArr(name)) {
            for (var i = 0, l = name.length; i < l; i++) {
                evs = this._events[name[i]]
                if (isUnExist(self._events[name][i])) { err("没有该事件 --- " + name); return; }
                for (var e = 0, n = evs.length; e < n; e++) {
                    scope = evs[e];
                    scope.apply(scope, datas);
                }
            }
            return self;
        } else {
            if (isUnExist(self._events[name])) { err("没有该事件 --- " + name); return; }
            evs = self._events[name];
            for (var i = 0, l = evs.length; i < l; i++) {
                scope = evs[i];
                scope.apply(self, datas);
            }
        }
        return self;
    }

    Event.prototype.$once = function (name, index) {

    }

    Event.prototype.$remove = function (name, index) {
        (isExist(index) && (this._events[name].splice(index, 1))) || (this._events[name] = null);
    }

    $Q.event = Event;


    var $KFjudge = new $Q.event("judge");


    // jiance :: a ->  temp [b]
    function jiance(name, data) {
        var temp = [];
        if (isObject(data)) {
            for (var i in data) {
                !data[i] && (temp.push(i), err(name + "  注意--->值: " + i + "为空 => " + data[i], ";"));
                (isObject(data[i]) || isArr(data[i])) && jiance(i, data[i]);
            }
        }

        if (isArr(data)) {
            data.forEach(function (a, b) {
                !a && (temp.push(a), err(name + "  注意--->数组位置: " + b + "为空 => " + data[i], ";"));
                (isObject(a) || isArr(a)) && jiance(a, a);
            })
        }
        return temp;
    }

    $KFjudge.$on("empty", jiance)


    function initState(Q, data) {
        Q._data = data;
        $Q.$KF && $KFjudge.$emit("empty", "外层对象", data);
    }

    function _init(Q, data) {
        if (!Q) { return; }
        initState(Q, data);
    }



    function $Q(data) {
        if (this instanceof $Q) {
            _init(this, data)
        } else {
            return new $Q(data);
        }
    }

    $Q.myError = false;
    initMethods($Q);



    function initMethods($Q) {
        var extend2 = $curry(2, extend);


        $Q.prototype.maybe = function _maybe() {
            var fn = maybe.apply(this, arguments);
            this._data = fn(this._data);
            return this;
        }

        $Q.prototype.extend = function _extend() {
            var ex = extend2(this._data);
            this._data = ex.apply(this, arguments);
            return this;
        }

        extend($Q.prototype, new Event("QEvent"));
    }


    return $Q

}))

