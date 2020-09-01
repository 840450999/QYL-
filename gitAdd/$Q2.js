(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
        typeof define === 'function' && define.amd ? define(factory) :
            (global = global || self, global.Fun = factory());
}(this, function () {
    'use strict';


    function type(str) {
        return function (o) {
            return Object.prototype.toString.call(o) === "[object " + str + "]"
        }
    }

    var isArr = type("Array"),
        isFun = type("Function"),
        isNum = type("Number")

    function isExist(Q) {
        return Q !== undefined && Q !== null;
    }

    function isUnExist(Q) {
        return Q === undefined || Q === null;
    }

    var kaifaErr = true;

    function err(x) {
        kaifaErr && [].slice.call(arguments).forEach(function (x) { console.error(x) })
    }

    // extend :: Object a -> Object b ->  Object a
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

    // momorize :: fn a ->  (cache)fn a
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


    // makeMap :: string -> boolean -> fn 
    function makeMap(
        str,
        lowerCase
    ) {
        var getMap = null,
            map = Object.create(null),
            list = str.split(",");
        if (!str == "") {
            for (var i = 0, l = list.length; i < l; i++) {
                map[list[i]] = true;
            }
        }

        function set(name) { map[name] = true; }
        return lowerCase
            ? (getMap = function (val) { return map[val.toLowerCase()]; }, getMap.set = set, getMap)
            : (getMap = function (val) { return map[val]; }, getMap.set = set, getMap)
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


    function curry(f, arg, rev) {
        var arg = arg || [];
        return function () {
            var args = arg.concat([].slice.call(arguments));
            return (f.length <= args.length) ? f.apply(f, rev ? args.reverse() : args) : curry.apply(f, [f, args, rev]);
        }
    }

    function $curry(index, f, arg, rev) {
        var arg = arg || [];
        return function () {
            var args = arg.concat([].slice.call(arguments));
            return (index <= args.length) ? f.apply(f, rev ? args.reverse() : args) : $curry.apply(f, [index, f, args, rev]);
        }
    }

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

    //  ois :: number time -> fn a -> (ois time)fn a
    var ois = function (time, fn) {
        var tname = null;
        if (!fn) { err("ois防抖函数 第二参数fn未传 执行默认 time => 200 fn => time方案"); fn = time; time = 200; }
        return function () {
            tname && clearTimeout(tname);
            tname = setTimeout(function () { fn(); }, time);
        }
    }


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


    function _compose(args) {
        var arg = isArr(args) ? args : [].slice.call(arguments),
            self = this;
        if (!arg.length) { err("_compose传值为空,请检查代码"); return function (x) { return x }; }
        return function _composeChild(x) {
            if ((typeof arg[0] !== "string") && arg[0].name.search("sync") != -1) {
                asyncFn(arg[0], _compose(arg.slice(1, arg.length)), x);
                return undefined;
            }

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
                    if (i === arg.length - 1) { err("asyn为最后的函数,参数fn将不会进行任何操作"); return; }
                    asyncFn(f, _compose(arg.slice(i + 1, arg.length)), ret);
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

    function $compose(arg) {
        var names = {},
            arg = isArr(arg) ? arg : [].slice.call(arguments),
            len = arg.length - 1,
            sourse = null;

        for (var i = 0; i <= len; i++) {
            if (isFun(sourse = arg[i])) {
                names[UnBindName(sourse.name)] = i;
            }
        }

        this.names = names;
        this.$Fs = arg;
    }

    $compose.prototype.set = function (name, val) {
        var names = this.names,
            fs = this.$Fs;

        if (names[name] !== undefined) {
            var fns = extend([], fs)
            fns[names[name]] = val;
            return new $compose(fns);
        }

    }

    $compose.prototype.removeOld = function (name) {
        var names = this.names,
            fs = this.$Fs;

        if (names[name] !== undefined) {
            fs.splice(names[name], 1)
            delete this.names[name];
        }

        return this;
    }

    $compose.prototype.setOld = function (name, val) {
        var $name = this.names[name];
        if ($name !== undefined) {
            this.names[name] = $name
            this.$Fs[$name] = val;
        }
        return this;
    }

    $compose.prototype.value = function (x) {
        var self = this,
            fns = self.$Fs;
        return _compose(fns)(isExist(x) ? x : this.$data);
    }


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
        objectMethods = makeMap("maybe,noMaybe,filterObj,strGetObj"),
        custrom = makeMap(""),
        noErrorMethods = makeMap("maybeChild,noMaybeChild"),
        $custrom = {},
        $objectMethods = {
            strGetObj: function (f) {
                return curry(strGetObj)(f())
            },
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
        alert: function (x) {
            alert(x);
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
        return f1(sentry(!isNaN(+names[1]) ? names[1] : 1, f2), data);
    }

    function UnBindName(x) {
        return x.replace(/bound\s?/, "")
    }

    function $(f) {
        if (isFun(f) && f.name) {
            var name = UnBindName(f.name).split("_")[0];

            if (arrayMethods(name)) {
                return function (data) {
                    if (!isArr(data)) { err("传入数据非数组类型"); return data; }
                    return data[name](f);
                };
            }

            if (objectMethods(name)) {
                return $objectMethods[name](f);
            };

            if (custrom(name)) { return $custrom[name](f); };
        }
        if (typeof f === "string") {
            return stringMethods[f];
        }
        return f;
    }

    // 过滤函数结束

    var repMid = curry(function (spt, str) {
        str = str.replace(/([\$\(\)\[\]\*\+\.\?\/\^\|])/g, "\\$1")
        var arr = str.split(spt);
        return new RegExp(arr[0] + "\(.*?\)" + arr[1], "g");
    })


    function getMid(reg, fn, str, err) {
        var val = str.replace(reg, function (a, b) {
            return fn(b);
        })
        err && val === str && err(str);
        return val;
    }

    function strGetObj(str, obj) {
        var ret = "";
        return getMid(repMid("-", "{{-}}"), function (x) {
            curObject(function (a) { ret = a; return a }, x, obj)
            return ret;
        }, str)
    }

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

    Event.prototype.$emit = function $onEmit(name, data) {
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

    Event.prototype.$onOnce = function (name, index) {

    }

    Event.prototype.$onRemove = function (name, index) {
        (isExist(index) && (this._events[name].splice(index, 1))) || (this._events[name] = null);
    }

    Fun.event = Event;


    function initState(F, data) {

    }

    function _init(F, data) {
        if (!F) { return; }

        extend(F, new $compose(data.compose.map(function (x) {
            return isFun(x) ? x.bind(F) : x;
        })))
        F.$data = data.data;
    }


    function Fun(data) {
        var oneType = Object.prototype.toString.call(data).replace(/\[object (.*?)\]/, "$1");
        if (oneType === "Function" || oneType === "String") {
            if (arguments.length == 1) { return $(arguments[0]); }
            return _compose.apply(this, arguments)
        };
        if (oneType === "Object") {
            if (this instanceof Fun) {
                _init(this, data);
            } else {
                return new Fun(data);
            }
        }
    }


    initMethods(Fun);

    function initMethods(Fun) {
        Fun.momorize = momorize;
        Fun.curry = curry;
        Fun.$curry = $curry;
        Fun.sentry = sentry;
        extend(Fun.prototype, new Event("$Fun"), $compose.prototype,
            {
                isArr: isArr,
                isNum: isNum,
                isFun: isFun,
                sentry: sentry,
                thro: thro,
                ois: ois
            }
        );

        Fun.prototype._compose = _compose;

        Fun.prototype.extend = extend;

        Fun.prototype.$compose = $compose;

        Fun.prototype.strGetObj = strGetObj;

        Fun.prototype.momorize = momorize;

        Fun.prototype.addFun = function () {

        }
    }

    return Fun

}))

