import * as __rspack_external__nestjs_common_a04939da from "@nestjs/common";
import * as __rspack_external__nestjs_config_8f4d8a2e from "@nestjs/config";
import * as __rspack_external__nestjs_core_d7b00a1a from "@nestjs/core";
import * as __rspack_external_reflect_metadata_121e451c from "reflect-metadata";
var __webpack_modules__ = ({
2(module) {

module.exports = __rspack_external__nestjs_common_a04939da;


},
5(module) {

module.exports = __rspack_external__nestjs_config_8f4d8a2e;


},
3(module) {

module.exports = __rspack_external__nestjs_core_d7b00a1a;


},
1(module) {

module.exports = __rspack_external_reflect_metadata_121e451c;


},
4(__unused_rspack___webpack_module__, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  WorkerModule: () => (WorkerModule)
});
/* import */ var _nestjs_common__rspack_import_0 = __webpack_require__(2);
/* import */ var _nestjs_config__rspack_import_1 = __webpack_require__(5);
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") {
        r = Reflect.decorate(decorators, target, key, desc);
    } else {
        for(var i = decorators.length - 1; i >= 0; i--){
            if (d = decorators[i]) {
                r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
            }
        }
    }
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}


class WorkerModule {
}
WorkerModule = _ts_decorate([
    (0,_nestjs_common__rspack_import_0.Module)({
        imports: [
            _nestjs_config__rspack_import_1.ConfigModule.forRoot({
                isGlobal: true
            })
        ]
    })
], WorkerModule);


},

});
// The module cache
var __webpack_module_cache__ = {};

// The require function
function __webpack_require__(moduleId) {

// Check if module is in cache
var cachedModule = __webpack_module_cache__[moduleId];
if (cachedModule !== undefined) {
return cachedModule.exports;
}
// Create a new module (and put it into the cache)
var module = (__webpack_module_cache__[moduleId] = {
exports: {}
});
// Execute the module function
__webpack_modules__[moduleId](module, module.exports, __webpack_require__);

// Return the exports of the module
return module.exports;

}

// webpack/runtime/define_property_getters
(() => {
__webpack_require__.d = (exports, getters, values) => {
	var define = (defs, kind) => {
		for(var key in defs) {
			if(__webpack_require__.o(defs, key) && !__webpack_require__.o(exports, key)) {
				Object.defineProperty(exports, key, { enumerable: true, [kind]: defs[key] });
			}
		}
	};
	define(getters, "get");
	define(values, "value");
};
})();
// webpack/runtime/has_own_property
(() => {
__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
})();
// webpack/runtime/make_namespace_object
(() => {
// define __esModule on exports
__webpack_require__.r = (exports) => {
	if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
		Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
	}
	Object.defineProperty(exports, '__esModule', { value: true });
};
})();
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
__webpack_require__.r(__webpack_exports__);
/* import */ var reflect_metadata__rspack_import_0 = __webpack_require__(1);
/* import */ var _nestjs_common__rspack_import_1 = __webpack_require__(2);
/* import */ var _nestjs_core__rspack_import_2 = __webpack_require__(3);
/* import */ var _worker_module__rspack_import_3 = __webpack_require__(4);




/**
 * Proceso de daemons: mismo código e imagen que la API, pero SIN HTTP.
 * Aquí viven sealer, batcher, anchor y witnesses. La llave de firma nunca
 * queda en el proceso que atiende el dashboard.
 */ async function bootstrap() {
    const app = await _nestjs_core__rspack_import_2.NestFactory.createApplicationContext(_worker_module__rspack_import_3.WorkerModule);
    // SIGTERM/SIGINT: los módulos cierran sus ciclos antes de salir.
    app.enableShutdownHooks();
    new _nestjs_common__rspack_import_1.Logger('Worker').log('worker iniciado');
}
void bootstrap();

})();


//# sourceMappingURL=worker.js.map