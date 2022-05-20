(function(modules) {
    function require(id) {
        const [fn, map] = modules[id];

        function localRequire(relativePath) {
            return require(map[relativePath]);
        }
        const module = {
            exports: {}
        }
        fn(localRequire, module, module.exports)
        return module.exports;
    }
    require(0)
})({
    0: [
        function(require, module, exports) {
            "use strict";

            var _person = _interopRequireDefault(require("./person.js"));

            function _interopRequireDefault(obj) {
                return obj && obj.__esModule ? obj : {
                    "default": obj
                };
            }

            console.log("person", "this person name is ".concat(_person["default"].name));
        },
        {
            "./person.js": 1
        },
    ],
    1: [
        function(require, module, exports) {
            "use strict";

            Object.defineProperty(exports, "__esModule", {
                value: true
            });
            exports["default"] = void 0;

            var _name = require("./name.js");

            var person = {
                name: _name.name
            };
            var _default = person;
            exports["default"] = _default;
        },
        {
            "./name.js": 2
        },
    ],
    2: [
        function(require, module, exports) {
            "use strict";

            Object.defineProperty(exports, "__esModule", {
                value: true
            });
            exports.name = void 0;
            var name = "ljz";
            exports.name = name;
        },
        {},
    ],
})
