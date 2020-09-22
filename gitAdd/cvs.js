(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
        typeof define === 'function' && define.amd ? define(factory) :
            (global = global || self, global.Yi = factory());
}(this, function () {
    'use strict';


    function type(str) {
        return function (o) {
            return Object.prototype.toString.call(o) === "[object " + str + "]";
        }
    }

    var isArr = type("Array"),
        isFun = type("Function"),
        isNum = type("Number")

    var PI2 = Math.PI * 2


    function isExist(Q) {
        return Q !== undefined && Q !== null;
    }

    function isUnExist(Q) {
        return Q === undefined || Q === null;
    }


    var bind = (function () {
        if (Function.prototype.bind) {
            return function bind(fn, scrop) {
                return fn.bind(scrop)
            }
        }
        return function (fn, scrop) {
            return function bind() {
                return fn.apply(scrop, [].slice.call(arguments));
            }
        }
    })()



    function getName(f) {
        if (f.name) {
            return f.name;
        }
        return f.toString().replace(/function\s*(.*?)\(.*/, function () { return arguments[1]; });
    }

    function err(str) {
        console.error(str)
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
            var self = this;
            run = !run;
            setTimeout(function () { fn.apply(self, [].slice.call(arguments)); run = !run; }, time);
        }
    }

    //  ois :: number time -> fn a -> (ois time)fn a
    var ois = function (time, fn) {
        var tname = null;
        if (!fn) { err("ois防抖函数 第二参数fn未传 执行默认 time => 200 fn => time方案"); fn = time; time = 200; }
        return function () {
            tname && clearTimeout(tname);
            var self = this;
            tname = setTimeout(function () { fn.apply(self, [].slice.call(arguments)); }, time);
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

    function initState(yi) {

    }

    function initData(yi) {
        var data = yi.option.data
        if (isFun(data)) {
            yi.$data = data();
            return;
        }
        yi.$data = yi.option.data;
    }

    // 阴
    function initRender(yi) {
        var render = Object.create(null),
            modIndex = Object.create(null),
            mods = [],
            modData, i = 0,
            course;

        if ((modData = yi.option.render)) {
            for (var fun in modData) {
                if (isFun(course = modData[fun])) {
                    render[fun] = true;
                    course = bind(course, yi)() || function () { return; };
                    mods.push(bind(course, yi));
                    modIndex[fun] = i++;
                }
            }
            yi.$modIndex = modIndex;
            yi.$render = render;
            yi.render = mods;

        }
    }



    function initCv(yi) {
        var el;

        if ((el = yi.option.el)) {
            var bufferCv = el.cloneNode(),
                type = yi.option.type || "2d";

            yi.cv = bufferCv.getContext(type)
            yi.$cv = el.getContext(type);
            yi.$el = yi.option.el;
            yi.$bufferCv = bufferCv;
        }
    }

    function initMethods(yi) {
        var methods = yi.option.methods;
    }

    function initLeftcycle(yi) {
        var opt = yi.option;
        opt.end && yi.$on("end", bind(opt.end, yi));
        opt.stop && yi.$on("isStop", bind(opt.stop, yi));
        opt.create && yi.$on("create", bind(opt.create, yi))
    }

    function _init(yi, opt) {
        if (!yi) { return; }
        yi.option = opt;

        extend(yi, new Event("Yi"));
        initLeftcycle(yi);
        initCv(yi);
        initData(yi);
        initRender(yi);
        initMethods(yi);
    }
    function render(yi) {
        yi.$emit("isStop");
        yi.$cv.clearRect(0, 0, width, height)
        for (var len = yi.render.length - 1; len >= 0; len--) {
            yi.render[len]();
        }

        yi.$cv.drawImage(yi.$bufferCv, 0, 0);
        yi.$emit("end")

    }

    

    function Yi(opt) {
        var oneType = Object.prototype.toString.call(opt).replace(/\[object (.*?)\]/, "$1");
        if (oneType === "Object") {
            _init(this, opt);
        }
    }


    Yi.prototype.start = function () {
        var self = this;
        ; (function cyclic() {
            if (self.stop) { return; }
            render(self);
            requestAnimationFrame(cyclic)
        })()
    }

    Yi.prototype.Eround = function (x, y, r, color) {
        var cv = this.cv;
        if (color) {
            cv.beginPath()
            cv.fillStyle = color;
            cv.arc(x, y, r, 0, PI2)
            cv.fill();
            return this;
        }
        cv.arc(x, y, r, 0, PI2)
        return this;
    }


    Yi.curry = curry;
    Yi.$curry = $curry;
    Yi.cache = momorize;
    Yi.thro = thro;
    Yi.ois = ois;
    return Yi;
}))

