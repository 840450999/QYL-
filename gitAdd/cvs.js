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

    function isExist(Q) {
        return Q !== undefined && Q !== null;
    }

    function isUnExist(Q) {
        return Q === undefined || Q === null;
    }


    var PI2 = Math.PI * 2,
        PI360 = PI2 / 360;

    var angle = momorize(function (n) {
        if (n > 360) { n = n % 360 };
        return PI360 * n;
    })

    var sin = Math.sin,
        cos = Math.cos,
        tan = Math.tan,
        random = Math.random;

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


    // 尾递归优化
    function tco(f) {
        var value;
        var active = false;
        var accumulated = [];

        return function accumulator() {
            accumulated.push(arguments);
            if (!active) {
                active = true;
                while (accumulated.length) {
                    value = f.apply(this, accumulated.shift());
                }
                active = false;
                return value;
            }
        };
    }


    function randomAB(a, b) {
        var section = b - a;
        return random() * section + a;
    }

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

    // momorize :: fn a ->  (cache)fn a
    function momorize(f) {
        var cache = Object.create(null);
        return function () {
            var arg = JSON.stringify(arguments);
            cache[arg] = cache[arg] || [f.apply(f, arguments)];
            return cache[arg][0];
        }
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
                    course = bind(course, yi)(yi.get) || function () { return; };
                    mods.push(bind(course, yi));
                    modIndex[fun] = i++;
                }
            }
            yi.$modIndex = modIndex;
            yi.$render = render;
            yi.Frender = mods;
        }
    }

    function cloneCanvas(el) {
        var cv = el.cloneNode(el);
        if (!cv.getContext) {
            initElement(cv);
        }
        return cv;
    }


    function initCv(yi) {
        var el;
        if ((el = yi.option.el)) {
            var bufferCv = cloneCanvas(el),
                type = yi.option.type || "2d";

            yi.cv = bufferCv.getContext(type)
            yi.$cv = el.getContext(type);
            yi.$el = yi.option.el;
            yi.$bufferCv = bufferCv;
        }
    }


    function initMethods(yi) {
        var methods = yi.option.methods;
        for (var key in methods) {
            key in yi || (yi[key] = bind(methods[key], yi))
        }
    }

    function initLeftcycle(yi) {
        var opt = yi.option;
        opt.end && yi.$on("end", bind(opt.end, yi));
        opt.stop && yi.$on("isStop", bind(opt.stop, yi));
        opt.create && yi.$on("create", bind(opt.create, yi))
    }

    function initGet(yi) {
        var getter = yi.option.get.call(yi);
        yi.get = Object.create(null);

        for (var key in getter) {
            yi.get[key] = bind(getter[key], yi)
        }

    }

    function _init(yi, opt) {
        if (!yi) { return; }
        yi.option = opt;

        extend(yi, new Event("Yi"));
        initLeftcycle(yi);
        initCv(yi);
        initData(yi);
        initMethods(yi);
        initGet(yi)
        initRender(yi);
    }

    var Animation = (function () {
        if ("requestAnimationFrame" in window) {
            return requestAnimationFrame;
        }
        return function (f) {
            setTimeout(f, 1);
        }
    })();


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
                self.render();
                Animation(cyclic)
            })()
    }

    Yi.prototype.oneRender = function () {
        this.render(self)
    }

    Yi.prototype.playVideo = function (src, fn) {
        var video;
        if (typeof src === "string") {
            video = document.createElement("video")
            video.src = src
        } else {
            video = src;
        }
        video.loop = true;
        video.autoplay = true
        video.muted = true;
        video.play();
        if (fn) {
            video.oncanplay = fn;
        }
        return video;
    }
    var chinese = makeMap("圆实,圆空,矩空,矩实,线,向线,着色,阴影"),
        chineseObj = {
            "圆实": "$round",
            "圆空": "",
            "矩空": "",
            "矩实": "",
            "向线": "$line",
            "线": "line",
            "线端点":"lineCap",
            "颜色": "",
            "阴影":"shadow"
        }

    Yi.prototype._ = function (type) {
        if (chinese(type)) {
            var arg = toArray(arguments);
            arg.shift();
            this[chineseObj[type]].apply(this, arg)
        }
    }

    Yi.prototype.render = function render(yi) {
        var yi = yi || this,
            el = yi.$el,
            sourse,
            Fns = yi.Frender
        yi.$emit("isStop");
        yi.$cv.clearRect(0, 0, el.width, el.height)
        for (var len = Fns.length - 1; len >= 0; len--) {
            if ((sourse = Fns[len]) instanceof Yi) {
                sourse.render(yi.get);
            } else {
                sourse(yi.get);
            }
        }

        yi.$cv.drawImage(yi.$bufferCv, 0, 0);
        yi.$emit("end")

    }
    Yi.prototype.color = function (color) {
        this.cv.fillStyle = color;
        this.cv.stroke = color;
        return this;
    }

    Yi.prototype.$round = function Eround(x, y, r, color) {
        var self = this,
            cv = this.cv;

        if (typeof color === "string") {
            cv.beginPath()
            cv.fillStyle = color;
            cv.arc(x, y, r, 0, PI2)
            cv.fill();
            return this;
        }
        if (arguments.length > 2) {
            cv.arc(x, y, r, 0, PI2)
            return this;
        }
        if (isArr(x)) {
            x.forEach(function (item) {
                $round.apply(self, item)
            })
            return this;
        }


    }

    Yi.prototype.$line = function (x, y, long, orient, width) {
        var self = this,
            cv = this.cv,
            oldWidth = cv.lineWidth;
        cv.beginPath();
        width && (cv.lineWidth = width);
        cv.moveTo(x, y)
        cv.lineTo(x + long * cos(angle(orient)), y + long * sin(angle(orient)))
        cv.stroke();
        cv.closePath()
        cv.lineWidth = oldWidth;
    }

    Yi.prototype.line = function (x, y, $x, $y, width,lineCap) {
        var self = this,
            cv = this.cv,
            oldWidth = cv.lineWidth;
        cv.beginPath();
        width && (cv.lineWidth = width);
        cv.moveTo(x, y)
        cv.lineTo($x, $y)
        cv.stroke();
        cv.closePath()
        cv.lineWidth = oldWidth;
    }
    Yi.prototype.lineCap = function (type){
           this.cv.lineCap = type;
    }

    Yi.prototype.shadow = function(color,x,y,blur){
        var cv = this.cv;
       cv.shadowColor = color;
       x&&(cv.shadowOffsetX = x);
       y&&(cv.shadowOffsetX = y);
       blur&&(cv.shadowBlur = blur);
    }


    Yi.compute = Object.create(null);
    extend(Yi.compute, {
         randomAB: randomAB,
         angle:angle
    })
    Yi.tco = tco;
    Yi.curry = curry;
    Yi.$curry = $curry;
    Yi.cache = momorize;
    Yi.thro = thro;
    Yi.ois = ois;
    Yi.extend = extend;

    return Yi;
}))

