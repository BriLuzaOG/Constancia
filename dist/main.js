import * as __rspack_external__nestjs_common_a04939da from "@nestjs/common";
import * as __rspack_external__nestjs_config_8f4d8a2e from "@nestjs/config";
import * as __rspack_external__nestjs_core_d7b00a1a from "@nestjs/core";
import * as __rspack_external__nestjs_serve_static_2107a822 from "@nestjs/serve-static";
import * as __rspack_external_node_crypto_2e7c4b46 from "node:crypto";
import * as __rspack_external_node_fs_1b05aee1 from "node:fs";
import * as __rspack_external_node_path_806ed179 from "node:path";
import * as __rspack_external_reflect_metadata_121e451c from "reflect-metadata";
import * as __rspack_external_rxjs from "rxjs";
import * as __rspack_external_viem from "viem";
import * as __rspack_external_viem_accounts_82e6a90e from "viem/accounts";
import * as __rspack_external_viem_chains_03180bdc from "viem/chains";
var __webpack_modules__ = ({
2(module) {

module.exports = __rspack_external__nestjs_common_a04939da;


},
7(module) {

module.exports = __rspack_external__nestjs_config_8f4d8a2e;


},
3(module) {

module.exports = __rspack_external__nestjs_core_d7b00a1a;


},
8(module) {

module.exports = __rspack_external__nestjs_serve_static_2107a822;


},
17(module) {

module.exports = __rspack_external_node_crypto_2e7c4b46;


},
5(module) {

module.exports = __rspack_external_node_fs_1b05aee1;


},
6(module) {

module.exports = __rspack_external_node_path_806ed179;


},
1(module) {

module.exports = __rspack_external_reflect_metadata_121e451c;


},
14(module) {

module.exports = __rspack_external_rxjs;


},
21(module) {

module.exports = __rspack_external_viem;


},
22(module) {

module.exports = __rspack_external_viem_accounts_82e6a90e;


},
23(module) {

module.exports = __rspack_external_viem_chains_03180bdc;


},
4(__unused_rspack___webpack_module__, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  AppModule: () => (AppModule)
});
/* import */ var node_fs__rspack_import_0 = __webpack_require__(5);
/* import */ var node_path__rspack_import_1 = __webpack_require__(6);
/* import */ var _nestjs_common__rspack_import_2 = __webpack_require__(2);
/* import */ var _nestjs_config__rspack_import_3 = __webpack_require__(7);
/* import */ var _nestjs_serve_static__rspack_import_4 = __webpack_require__(8);
/* import */ var _core_alerts_alerts_module__rspack_import_5 = __webpack_require__(9);
/* import */ var _core_anchor_anchor_module__rspack_import_6 = __webpack_require__(11);
/* import */ var _core_chaos_chaos_module__rspack_import_7 = __webpack_require__(26);
/* import */ var _core_evidence_evidence_module__rspack_import_8 = __webpack_require__(12);
/* import */ var _core_health_health_module__rspack_import_9 = __webpack_require__(28);
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










// En desarrollo el front corre en Vite (5173) y este directorio no existe.
// En producción Nest sirve el build estático desde el mismo origen: una URL,
// cero CORS.
const webDist = (0,node_path__rspack_import_1.join)(process.cwd(), 'web', 'dist');
class AppModule {
}
AppModule = _ts_decorate([
    (0,_nestjs_common__rspack_import_2.Module)({
        imports: [
            _nestjs_config__rspack_import_3.ConfigModule.forRoot({
                isGlobal: true
            }),
            _core_alerts_alerts_module__rspack_import_5.AlertsModule,
            _core_health_health_module__rspack_import_9.HealthModule,
            _core_evidence_evidence_module__rspack_import_8.EvidenceModule,
            _core_anchor_anchor_module__rspack_import_6.AnchorModule,
            _core_chaos_chaos_module__rspack_import_7.ChaosModule,
            ...(0,node_fs__rspack_import_0.existsSync)(webDist) ? [
                _nestjs_serve_static__rspack_import_4.ServeStaticModule.forRoot({
                    rootPath: webDist,
                    exclude: [
                        '/api/{*path}',
                        '/events'
                    ]
                })
            ] : []
        ]
    })
], AppModule);


},
9(__unused_rspack___webpack_module__, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  AlertsModule: () => (AlertsModule)
});
/* import */ var _nestjs_common__rspack_import_0 = __webpack_require__(2);
/* import */ var _alerts_service__rspack_import_1 = __webpack_require__(10);
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


class AlertsModule {
}
AlertsModule = _ts_decorate([
    (0,_nestjs_common__rspack_import_0.Module)({
        providers: [
            _alerts_service__rspack_import_1.AlertsService
        ],
        exports: [
            _alerts_service__rspack_import_1.AlertsService
        ]
    })
], AlertsModule);


},
10(__unused_rspack___webpack_module__, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  AlertsService: () => (AlertsService)
});
/* import */ var _nestjs_common__rspack_import_0 = __webpack_require__(2);
/* import */ var _nestjs_config__rspack_import_1 = __webpack_require__(7);
function _define_property(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else obj[key] = value;
    return obj;
}
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
function _ts_metadata(metadataKey, metadataValue) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") {
        return Reflect.metadata(metadataKey, metadataValue);
    }
}


class AlertsService {
    async send(text) {
        const token = this.config.get('TELEGRAM_TOKEN');
        const chatId = this.config.get('TELEGRAM_CHAT_ID');
        if (!token || !chatId) {
            this.logger.warn(`[alerta] ${text}`);
            return;
        }
        try {
            await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                method: 'POST',
                headers: {
                    'content-type': 'application/json'
                },
                body: JSON.stringify({
                    chat_id: chatId,
                    text
                })
            });
        } catch (cause) {
            this.logger.error(`No se pudo enviar la alerta: ${String(cause)}`);
        }
    }
    constructor(config){
        _define_property(this, "config", void 0);
        _define_property(this, "logger", void 0);
        this.config = config;
        this.logger = new _nestjs_common__rspack_import_0.Logger(AlertsService.name);
    }
}
AlertsService = _ts_decorate([
    (0,_nestjs_common__rspack_import_0.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _nestjs_config__rspack_import_1.ConfigService === "undefined" ? Object : _nestjs_config__rspack_import_1.ConfigService
    ])
], AlertsService);


},
19(__unused_rspack___webpack_module__, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  AnchorController: () => (AnchorController)
});
/* import */ var _nestjs_common__rspack_import_0 = __webpack_require__(2);
/* import */ var _anchor_service__rspack_import_1 = __webpack_require__(20);
function _define_property(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else obj[key] = value;
    return obj;
}
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
function _ts_metadata(metadataKey, metadataValue) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") {
        return Reflect.metadata(metadataKey, metadataValue);
    }
}
function _ts_param(paramIndex, decorator) {
    return function(target, key) {
        decorator(target, key, paramIndex);
    };
}


class AnchorController {
    anchorSession(sessionId) {
        return this.anchor.anchorSession(sessionId);
    }
    constructor(anchor){
        _define_property(this, "anchor", void 0);
        this.anchor = anchor;
    }
}
_ts_decorate([
    (0,_nestjs_common__rspack_import_0.Post)(':sessionId'),
    _ts_param(0, (0,_nestjs_common__rspack_import_0.Param)('sessionId')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", typeof Promise === "undefined" ? Object : Promise)
], AnchorController.prototype, "anchorSession", null);
AnchorController = _ts_decorate([
    (0,_nestjs_common__rspack_import_0.Controller)('api/anchor'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _anchor_service__rspack_import_1.AnchorService === "undefined" ? Object : _anchor_service__rspack_import_1.AnchorService
    ])
], AnchorController);


},
25(__unused_rspack___webpack_module__, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  AnchorJob: () => (AnchorJob)
});
/* import */ var _nestjs_common__rspack_import_0 = __webpack_require__(2);
/* import */ var _nestjs_config__rspack_import_1 = __webpack_require__(7);
/* import */ var _evidence_evidence_store__rspack_import_2 = __webpack_require__(15);
/* import */ var _anchor_service__rspack_import_3 = __webpack_require__(20);
function _define_property(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else obj[key] = value;
    return obj;
}
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
function _ts_metadata(metadataKey, metadataValue) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") {
        return Reflect.metadata(metadataKey, metadataValue);
    }
}




class AnchorJob {
    onModuleInit() {
        const interval = Number(this.config.get('ANCHOR_INTERVAL_MS') ?? 30_000);
        this.timer = setInterval(()=>{
            void this.run();
        }, interval);
        this.logger.log(`anclaje cada ${interval} ms`);
    }
    onModuleDestroy() {
        if (this.timer) {
            clearInterval(this.timer);
        }
    }
    async run() {
        await Promise.all(this.store.sessionIds().map((sessionId)=>this.anchor.anchorSession(sessionId)));
    }
    constructor(anchor, store, config){
        _define_property(this, "anchor", void 0);
        _define_property(this, "store", void 0);
        _define_property(this, "config", void 0);
        _define_property(this, "logger", void 0);
        _define_property(this, "timer", void 0);
        this.anchor = anchor;
        this.store = store;
        this.config = config;
        this.logger = new _nestjs_common__rspack_import_0.Logger(AnchorJob.name);
    }
}
AnchorJob = _ts_decorate([
    (0,_nestjs_common__rspack_import_0.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _anchor_service__rspack_import_3.AnchorService === "undefined" ? Object : _anchor_service__rspack_import_3.AnchorService,
        typeof _evidence_evidence_store__rspack_import_2.EvidenceStore === "undefined" ? Object : _evidence_evidence_store__rspack_import_2.EvidenceStore,
        typeof _nestjs_config__rspack_import_1.ConfigService === "undefined" ? Object : _nestjs_config__rspack_import_1.ConfigService
    ])
], AnchorJob);


},
11(__unused_rspack___webpack_module__, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  AnchorModule: () => (AnchorModule)
});
/* import */ var _nestjs_common__rspack_import_0 = __webpack_require__(2);
/* import */ var _evidence_evidence_module__rspack_import_1 = __webpack_require__(12);
/* import */ var _anchor_controller__rspack_import_2 = __webpack_require__(19);
/* import */ var _anchor_job__rspack_import_3 = __webpack_require__(25);
/* import */ var _anchor_service__rspack_import_4 = __webpack_require__(20);
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





class AnchorModule {
}
AnchorModule = _ts_decorate([
    (0,_nestjs_common__rspack_import_0.Module)({
        imports: [
            _evidence_evidence_module__rspack_import_1.EvidenceModule
        ],
        controllers: [
            _anchor_controller__rspack_import_2.AnchorController
        ],
        providers: [
            _anchor_service__rspack_import_4.AnchorService,
            _anchor_job__rspack_import_3.AnchorJob
        ],
        exports: [
            _anchor_service__rspack_import_4.AnchorService
        ]
    })
], AnchorModule);


},
20(__unused_rspack___webpack_module__, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  AnchorService: () => (AnchorService)
});
/* import */ var _nestjs_common__rspack_import_0 = __webpack_require__(2);
/* import */ var _nestjs_config__rspack_import_1 = __webpack_require__(7);
/* import */ var viem__rspack_import_2 = __webpack_require__(21);
/* import */ var viem_accounts__rspack_import_3 = __webpack_require__(22);
/* import */ var viem_chains__rspack_import_4 = __webpack_require__(23);
/* import */ var _evidence_evidence_store__rspack_import_5 = __webpack_require__(15);
/* import */ var _evidence_merkle__rspack_import_6 = __webpack_require__(24);
function _define_property(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else obj[key] = value;
    return obj;
}
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
function _ts_metadata(metadataKey, metadataValue) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") {
        return Reflect.metadata(metadataKey, metadataValue);
    }
}







const ABI = (0,viem__rspack_import_2.parseAbi)([
    'function anchor(bytes32 root, string sessionId)'
]);
class AnchorService {
    async anchorSession(sessionId) {
        const events = this.store.list(sessionId);
        const root = (0,_evidence_merkle__rspack_import_6.merkleRoot)(events.map((event)=>event.hash));
        const config = this.readConfig();
        if (config === null) {
            this.logger.warn(`[anchor] dry-run ${sessionId} ${root}`);
            return {
                mode: 'dry-run',
                sessionId,
                root,
                txHash: null
            };
        }
        const account = (0,viem_accounts__rspack_import_3.privateKeyToAccount)(config.privateKey);
        const wallet = (0,viem__rspack_import_2.createWalletClient)({
            account,
            chain: viem_chains__rspack_import_4.sepolia,
            transport: (0,viem__rspack_import_2.http)(config.rpcUrl)
        });
        const txHash = await wallet.writeContract({
            address: config.contract,
            abi: ABI,
            functionName: 'anchor',
            args: [
                `0x${root.replace('sha256:', '')}`,
                sessionId
            ]
        });
        this.logger.log(`[anchor] ${sessionId} ${root} tx=${txHash}`);
        return {
            mode: 'onchain',
            sessionId,
            root,
            txHash
        };
    }
    /**
   * Un placeholder como `PRIVATE_KEY=0x` no es una llave válida. Si no
   * cumple el formato exacto, el demo corre en dry-run en lugar de romper.
   */ readConfig() {
        const rpcUrl = this.config.get('RPC_URL');
        const privateKey = this.config.get('PRIVATE_KEY');
        const contract = this.config.get('CONTRACT_ADDRESS');
        if (typeof rpcUrl !== 'string' || !/^https?:\/\//.test(rpcUrl) || typeof privateKey !== 'string' || !/^0x[0-9a-fA-F]{64}$/.test(privateKey) || typeof contract !== 'string' || !/^0x[0-9a-fA-F]{40}$/.test(contract)) {
            return null;
        }
        return {
            rpcUrl,
            privateKey: privateKey,
            contract: contract
        };
    }
    constructor(config, store){
        _define_property(this, "config", void 0);
        _define_property(this, "store", void 0);
        _define_property(this, "logger", void 0);
        this.config = config;
        this.store = store;
        this.logger = new _nestjs_common__rspack_import_0.Logger(AnchorService.name);
    }
}
AnchorService = _ts_decorate([
    (0,_nestjs_common__rspack_import_0.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _nestjs_config__rspack_import_1.ConfigService === "undefined" ? Object : _nestjs_config__rspack_import_1.ConfigService,
        typeof _evidence_evidence_store__rspack_import_5.EvidenceStore === "undefined" ? Object : _evidence_evidence_store__rspack_import_5.EvidenceStore
    ])
], AnchorService);


},
27(__unused_rspack___webpack_module__, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  ChaosController: () => (ChaosController)
});
/* import */ var _nestjs_common__rspack_import_0 = __webpack_require__(2);
/* import */ var _alerts_alerts_service__rspack_import_1 = __webpack_require__(10);
/* import */ var _evidence_evidence_store__rspack_import_2 = __webpack_require__(15);
function _define_property(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else obj[key] = value;
    return obj;
}
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
function _ts_metadata(metadataKey, metadataValue) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") {
        return Reflect.metadata(metadataKey, metadataValue);
    }
}
function _ts_param(paramIndex, decorator) {
    return function(target, key) {
        decorator(target, key, paramIndex);
    };
}



class ChaosController {
    async tamper(sessionId, seq) {
        const ok = this.store.tamper(sessionId, Number(seq), {
            forged: true
        });
        if (ok) {
            await this.alerts.send(`Evidencia alterada en ${sessionId}, seq ${seq}`);
        }
        return {
            ok
        };
    }
    async remove(sessionId, seq) {
        const ok = this.store.remove(sessionId, Number(seq));
        if (ok) {
            await this.alerts.send(`Evidencia borrada en ${sessionId}, seq ${seq}`);
        }
        return {
            ok
        };
    }
    async kill(sessionId) {
        const ok = this.store.kill(sessionId);
        await this.alerts.send(`Kill switch activado en ${sessionId}`);
        return {
            ok
        };
    }
    constructor(store, alerts){
        _define_property(this, "store", void 0);
        _define_property(this, "alerts", void 0);
        this.store = store;
        this.alerts = alerts;
    }
}
_ts_decorate([
    (0,_nestjs_common__rspack_import_0.Post)(':sessionId/tamper/:seq'),
    _ts_param(0, (0,_nestjs_common__rspack_import_0.Param)('sessionId')),
    _ts_param(1, (0,_nestjs_common__rspack_import_0.Param)('seq')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], ChaosController.prototype, "tamper", null);
_ts_decorate([
    (0,_nestjs_common__rspack_import_0.Post)(':sessionId/delete/:seq'),
    _ts_param(0, (0,_nestjs_common__rspack_import_0.Param)('sessionId')),
    _ts_param(1, (0,_nestjs_common__rspack_import_0.Param)('seq')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], ChaosController.prototype, "remove", null);
_ts_decorate([
    (0,_nestjs_common__rspack_import_0.Post)(':sessionId/kill'),
    _ts_param(0, (0,_nestjs_common__rspack_import_0.Param)('sessionId')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], ChaosController.prototype, "kill", null);
ChaosController = _ts_decorate([
    (0,_nestjs_common__rspack_import_0.Controller)('api/chaos'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _evidence_evidence_store__rspack_import_2.EvidenceStore === "undefined" ? Object : _evidence_evidence_store__rspack_import_2.EvidenceStore,
        typeof _alerts_alerts_service__rspack_import_1.AlertsService === "undefined" ? Object : _alerts_alerts_service__rspack_import_1.AlertsService
    ])
], ChaosController);


},
26(__unused_rspack___webpack_module__, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  ChaosModule: () => (ChaosModule)
});
/* import */ var _nestjs_common__rspack_import_0 = __webpack_require__(2);
/* import */ var _alerts_alerts_module__rspack_import_1 = __webpack_require__(9);
/* import */ var _evidence_evidence_module__rspack_import_2 = __webpack_require__(12);
/* import */ var _chaos_controller__rspack_import_3 = __webpack_require__(27);
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




class ChaosModule {
}
ChaosModule = _ts_decorate([
    (0,_nestjs_common__rspack_import_0.Module)({
        imports: [
            _evidence_evidence_module__rspack_import_2.EvidenceModule,
            _alerts_alerts_module__rspack_import_1.AlertsModule
        ],
        controllers: [
            _chaos_controller__rspack_import_3.ChaosController
        ]
    })
], ChaosModule);


},
13(__unused_rspack___webpack_module__, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  EventsController: () => (EventsController)
});
/* import */ var _nestjs_common__rspack_import_0 = __webpack_require__(2);
/* import */ var rxjs__rspack_import_1 = __webpack_require__(14);
/* import */ var _evidence_store__rspack_import_2 = __webpack_require__(15);
function _define_property(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else obj[key] = value;
    return obj;
}
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
function _ts_metadata(metadataKey, metadataValue) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") {
        return Reflect.metadata(metadataKey, metadataValue);
    }
}



class EventsController {
    stream() {
        const initial = (0,rxjs__rspack_import_1.of)({
            data: {
                at: Date.now()
            }
        });
        const updates = this.store.changes$.pipe((0,rxjs__rspack_import_1.map)(()=>({
                data: {
                    at: Date.now()
                }
            })));
        return (0,rxjs__rspack_import_1.merge)(initial, updates);
    }
    constructor(store){
        _define_property(this, "store", void 0);
        this.store = store;
    }
}
_ts_decorate([
    (0,_nestjs_common__rspack_import_0.Sse)('events'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", []),
    _ts_metadata("design:returntype", typeof Observable === "undefined" ? Object : Observable)
], EventsController.prototype, "stream", null);
EventsController = _ts_decorate([
    (0,_nestjs_common__rspack_import_0.Controller)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _evidence_store__rspack_import_2.EvidenceStore === "undefined" ? Object : _evidence_store__rspack_import_2.EvidenceStore
    ])
], EventsController);


},
18(__unused_rspack___webpack_module__, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  EvidenceController: () => (EvidenceController)
});
/* import */ var _nestjs_common__rspack_import_0 = __webpack_require__(2);
/* import */ var _evidence_store__rspack_import_1 = __webpack_require__(15);
/* import */ var _hash_chain__rspack_import_2 = __webpack_require__(16);
function _define_property(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else obj[key] = value;
    return obj;
}
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
function _ts_metadata(metadataKey, metadataValue) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") {
        return Reflect.metadata(metadataKey, metadataValue);
    }
}
function _ts_param(paramIndex, decorator) {
    return function(target, key) {
        decorator(target, key, paramIndex);
    };
}



class EvidenceController {
    append(body) {
        return this.store.append(body.sessionId, body.type, body.payload);
    }
    sessions() {
        return this.store.sessionIds();
    }
    reset(sessionId) {
        return {
            ok: this.store.reset(sessionId)
        };
    }
    state(sessionId) {
        return {
            sessionId,
            quarantined: this.store.isQuarantined(sessionId),
            head: this.store.head(sessionId) ?? null
        };
    }
    events(sessionId) {
        return this.store.list(sessionId);
    }
    verify(sessionId) {
        // La cabeza se pasa aparte: si el rogue borra el último evento, el
        // hueco está entre el último presente y la cabeza.
        return (0,_hash_chain__rspack_import_2.verifyChain)(this.store.list(sessionId), this.store.head(sessionId));
    }
    constructor(store){
        _define_property(this, "store", void 0);
        this.store = store;
    }
}
_ts_decorate([
    (0,_nestjs_common__rspack_import_0.Post)('events'),
    _ts_param(0, (0,_nestjs_common__rspack_import_0.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof AppendBody === "undefined" ? Object : AppendBody
    ]),
    _ts_metadata("design:returntype", typeof EvidenceEvent === "undefined" ? Object : EvidenceEvent)
], EvidenceController.prototype, "append", null);
_ts_decorate([
    (0,_nestjs_common__rspack_import_0.Get)('sessions'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", []),
    _ts_metadata("design:returntype", Array)
], EvidenceController.prototype, "sessions", null);
_ts_decorate([
    (0,_nestjs_common__rspack_import_0.Delete)('sessions/:sessionId'),
    _ts_param(0, (0,_nestjs_common__rspack_import_0.Param)('sessionId')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", Object)
], EvidenceController.prototype, "reset", null);
_ts_decorate([
    (0,_nestjs_common__rspack_import_0.Get)('sessions/:sessionId/state'),
    _ts_param(0, (0,_nestjs_common__rspack_import_0.Param)('sessionId')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", typeof SessionState === "undefined" ? Object : SessionState)
], EvidenceController.prototype, "state", null);
_ts_decorate([
    (0,_nestjs_common__rspack_import_0.Get)('sessions/:sessionId/events'),
    _ts_param(0, (0,_nestjs_common__rspack_import_0.Param)('sessionId')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", Array)
], EvidenceController.prototype, "events", null);
_ts_decorate([
    (0,_nestjs_common__rspack_import_0.Get)('sessions/:sessionId/verify'),
    _ts_param(0, (0,_nestjs_common__rspack_import_0.Param)('sessionId')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", typeof ChainVerification === "undefined" ? Object : ChainVerification)
], EvidenceController.prototype, "verify", null);
EvidenceController = _ts_decorate([
    (0,_nestjs_common__rspack_import_0.Controller)('api'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _evidence_store__rspack_import_1.EvidenceStore === "undefined" ? Object : _evidence_store__rspack_import_1.EvidenceStore
    ])
], EvidenceController);


},
12(__unused_rspack___webpack_module__, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  EvidenceModule: () => (EvidenceModule)
});
/* import */ var _nestjs_common__rspack_import_0 = __webpack_require__(2);
/* import */ var _events_controller__rspack_import_1 = __webpack_require__(13);
/* import */ var _evidence_controller__rspack_import_2 = __webpack_require__(18);
/* import */ var _evidence_store__rspack_import_3 = __webpack_require__(15);
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




class EvidenceModule {
}
EvidenceModule = _ts_decorate([
    (0,_nestjs_common__rspack_import_0.Module)({
        controllers: [
            _evidence_controller__rspack_import_2.EvidenceController,
            _events_controller__rspack_import_1.EventsController
        ],
        providers: [
            _evidence_store__rspack_import_3.EvidenceStore
        ],
        exports: [
            _evidence_store__rspack_import_3.EvidenceStore
        ]
    })
], EvidenceModule);


},
15(__unused_rspack___webpack_module__, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  EvidenceStore: () => (EvidenceStore)
});
/* import */ var node_fs__rspack_import_0 = __webpack_require__(5);
/* import */ var node_path__rspack_import_1 = __webpack_require__(6);
/* import */ var _nestjs_common__rspack_import_2 = __webpack_require__(2);
/* import */ var rxjs__rspack_import_3 = __webpack_require__(14);
/* import */ var _hash_chain__rspack_import_4 = __webpack_require__(16);
function _define_property(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else obj[key] = value;
    return obj;
}
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
function _ts_metadata(metadataKey, metadataValue) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") {
        return Reflect.metadata(metadataKey, metadataValue);
    }
}





class EvidenceStore {
    append(sessionId, type, payload) {
        if (this.quarantined.has(sessionId)) {
            throw new _nestjs_common__rspack_import_2.ForbiddenException(`sesión ${sessionId} en cuarentena`);
        }
        const events = this.sessions.get(sessionId) ?? [];
        const event = (0,_hash_chain__rspack_import_4.seal)(sessionId, type, payload, events.at(-1));
        events.push(event);
        this.sessions.set(sessionId, events);
        this.persistEvents(sessionId, events);
        this.heads.set(sessionId, {
            sessionId,
            seq: event.seq,
            hash: event.hash
        });
        this.persistHead(sessionId);
        this.notify();
        return event;
    }
    list(sessionId) {
        return [
            ...this.sessions.get(sessionId) ?? []
        ];
    }
    sessionIds() {
        return [
            ...this.sessions.keys()
        ];
    }
    head(sessionId) {
        return this.heads.get(sessionId);
    }
    isQuarantined(sessionId) {
        return this.quarantined.has(sessionId);
    }
    /** Ataque del rogue: altera el payload sin recalcular el hash. */ tamper(sessionId, seq, payload) {
        const events = this.sessions.get(sessionId);
        const event = events?.find((item)=>item.seq === seq);
        if (!events || !event) {
            return false;
        }
        event.payload = payload;
        this.persistEvents(sessionId, events);
        this.notify();
        return true;
    }
    /** Ataque del rogue: borra un evento y deja el hueco. */ remove(sessionId, seq) {
        const events = this.sessions.get(sessionId);
        if (!events) {
            return false;
        }
        const index = events.findIndex((item)=>item.seq === seq);
        if (index === -1) {
            return false;
        }
        events.splice(index, 1);
        this.persistEvents(sessionId, events);
        this.notify();
        return true;
    }
    /** Kill switch: el agente ya no puede escribir en esta sesión. */ kill(sessionId) {
        this.quarantined.add(sessionId);
        const path = this.quarantinePath(sessionId);
        (0,node_fs__rspack_import_0.writeFileSync)(path, JSON.stringify({
            sessionId,
            at: new Date().toISOString()
        }));
        this.notify();
        this.logger.warn(`sesión ${sessionId} en cuarentena`);
        return true;
    }
    reset(sessionId) {
        const safe = this.safeName(sessionId);
        const existed = this.sessions.delete(sessionId) || this.heads.delete(sessionId) || this.quarantined.delete(sessionId);
        for (const path of [
            (0,node_path__rspack_import_1.join)(this.dataDir, 'events', `${safe}.jsonl`),
            (0,node_path__rspack_import_1.join)(this.dataDir, 'heads', `${safe}.json`),
            (0,node_path__rspack_import_1.join)(this.dataDir, 'quarantine', `${safe}.json`)
        ]){
            if ((0,node_fs__rspack_import_0.existsSync)(path)) {
                (0,node_fs__rspack_import_0.rmSync)(path);
            }
        }
        this.notify();
        return existed;
    }
    load() {
        const eventsDir = (0,node_path__rspack_import_1.join)(this.dataDir, 'events');
        for (const file of (0,node_fs__rspack_import_0.readdirSync)(eventsDir)){
            if (!file.endsWith('.jsonl')) {
                continue;
            }
            const sessionId = file.slice(0, -'.jsonl'.length);
            const events = (0,node_fs__rspack_import_0.readFileSync)((0,node_path__rspack_import_1.join)(eventsDir, file), 'utf8').split('\n').filter((line)=>line.trim() !== '').map((line)=>JSON.parse(line));
            this.sessions.set(sessionId, events);
            const headPath = this.headPath(sessionId);
            if ((0,node_fs__rspack_import_0.existsSync)(headPath)) {
                this.heads.set(sessionId, JSON.parse((0,node_fs__rspack_import_0.readFileSync)(headPath, 'utf8')));
            }
            if ((0,node_fs__rspack_import_0.existsSync)(this.quarantinePath(sessionId))) {
                this.quarantined.add(sessionId);
            }
        }
    }
    persistEvents(sessionId, events) {
        const body = events.map((event)=>JSON.stringify(event)).join('\n');
        (0,node_fs__rspack_import_0.writeFileSync)((0,node_path__rspack_import_1.join)(this.dataDir, 'events', `${this.safeName(sessionId)}.jsonl`), `${body}\n`);
    }
    persistHead(sessionId) {
        const head = this.heads.get(sessionId);
        if (!head) {
            return;
        }
        (0,node_fs__rspack_import_0.writeFileSync)(this.headPath(sessionId), JSON.stringify(head));
    }
    headPath(sessionId) {
        return (0,node_path__rspack_import_1.join)(this.dataDir, 'heads', `${this.safeName(sessionId)}.json`);
    }
    quarantinePath(sessionId) {
        return (0,node_path__rspack_import_1.join)(this.dataDir, 'quarantine', `${this.safeName(sessionId)}.json`);
    }
    safeName(sessionId) {
        return sessionId.replaceAll(/[^a-zA-Z0-9_-]/g, '_');
    }
    notify() {
        this.changes.next();
    }
    constructor(){
        _define_property(this, "sessions", new Map());
        _define_property(this, "heads", new Map());
        _define_property(this, "quarantined", new Set());
        _define_property(this, "changes", new rxjs__rspack_import_3.Subject());
        _define_property(this, "logger", new _nestjs_common__rspack_import_2.Logger(EvidenceStore.name));
        _define_property(this, "dataDir", void 0);
        _define_property(this, "changes$", this.changes.asObservable());
        this.dataDir = process.env.DATA_DIR ?? (0,node_path__rspack_import_1.join)(process.cwd(), 'data');
        (0,node_fs__rspack_import_0.mkdirSync)((0,node_path__rspack_import_1.join)(this.dataDir, 'events'), {
            recursive: true
        });
        (0,node_fs__rspack_import_0.mkdirSync)((0,node_path__rspack_import_1.join)(this.dataDir, 'heads'), {
            recursive: true
        });
        (0,node_fs__rspack_import_0.mkdirSync)((0,node_path__rspack_import_1.join)(this.dataDir, 'quarantine'), {
            recursive: true
        });
        this.load();
    }
}
EvidenceStore = _ts_decorate([
    (0,_nestjs_common__rspack_import_2.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [])
], EvidenceStore);


},
16(__unused_rspack___webpack_module__, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  hashEvent: () => (hashEvent),
  seal: () => (seal),
  verifyChain: () => (verifyChain)
});
/* import */ var node_crypto__rspack_import_0 = __webpack_require__(17);

const GENESIS = 'sha256:genesis';
function hashEvent(event) {
    const canonical = JSON.stringify({
        seq: event.seq,
        sessionId: event.sessionId,
        type: event.type,
        payload: event.payload,
        ts: event.ts,
        prevHash: event.prevHash
    });
    return `sha256:${(0,node_crypto__rspack_import_0.createHash)('sha256').update(canonical).digest('hex')}`;
}
function seal(sessionId, type, payload, previous) {
    const base = {
        seq: (previous?.seq ?? 0) + 1,
        sessionId,
        type,
        payload,
        ts: new Date().toISOString(),
        prevHash: previous?.hash ?? GENESIS
    };
    return {
        ...base,
        hash: hashEvent(base)
    };
}
/**
 * Recomputa la cadena y reporta dos ataques distintos:
 * - alteración: el hash recalculado no coincide con el guardado
 * - borrado: falta un `seq` en la secuencia
 *
 * Un borrado del ÚLTIMO evento no deja hueco. Ese caso solo se detecta
 * contra la cabeza anclada, que es el siguiente paso.
 */ function verifyChain(events, head) {
    const sorted = events.toSorted((a, b)=>a.seq - b.seq);
    const missing = [];
    let brokenAt = null;
    let previous;
    for (const event of sorted){
        const expectedSeq = (previous?.seq ?? 0) + 1;
        if (event.seq !== expectedSeq) {
            for(let seq = expectedSeq; seq < event.seq; seq += 1){
                missing.push(seq);
            }
        }
        const { hash, ...base } = event;
        const recomputed = hashEvent(base);
        const chainBroken = previous !== undefined && event.prevHash !== previous.hash;
        if ((recomputed !== hash || chainBroken) && brokenAt === null) {
            // No se corta el recorrido: un borrado posterior sigue siendo
            // detectable aunque antes haya un hash roto.
            brokenAt = event.seq;
        }
        previous = event;
    }
    // La cabeza vive fuera del store. Si el rogue borra el ÚLTIMO evento,
    // no hay hueco en la secuencia: el hueco está entre el último evento
    // presente y la cabeza.
    const lastSeq = previous?.seq ?? 0;
    if (head !== undefined && head.seq > lastSeq) {
        for(let seq = lastSeq + 1; seq <= head.seq; seq += 1){
            missing.push(seq);
        }
    }
    if (head !== undefined) {
        const headEvent = sorted.find((event)=>event.seq === head.seq);
        if (headEvent !== undefined && headEvent.hash !== head.hash && brokenAt === null) {
            brokenAt = head.seq;
        }
    }
    const tampered = brokenAt !== null;
    const deleted = missing.length > 0;
    return {
        ok: !tampered && !deleted,
        brokenAt,
        missing,
        reason: tampered && deleted ? 'tampered_and_deleted' : tampered ? 'tampered' : deleted ? 'deleted' : 'intact'
    };
}


},
24(__unused_rspack___webpack_module__, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  merkleRoot: () => (merkleRoot)
});
/* import */ var node_crypto__rspack_import_0 = __webpack_require__(17);

function sha256(input) {
    return (0,node_crypto__rspack_import_0.createHash)('sha256').update(input).digest('hex');
}
/**
 * Raíz Merkle de los hashes de una sesión. Si el nivel tiene un número
 * impar de nodos, el último se duplica: el resultado es determinista y
 * cualquier cambio en una hoja cambia la raíz.
 */ function merkleRoot(hashes) {
    if (hashes.length === 0) {
        return `sha256:${sha256('')}`;
    }
    let level = hashes.map((hash)=>hash.replace(/^sha256:/, ''));
    while(level.length > 1){
        const next = [];
        for(let index = 0; index < level.length; index += 2){
            const left = level[index];
            const right = level[index + 1] ?? left;
            next.push(sha256(`${left}${right}`));
        }
        level = next;
    }
    return `sha256:${level[0]}`;
}


},
29(__unused_rspack___webpack_module__, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  HealthController: () => (HealthController)
});
/* import */ var _nestjs_common__rspack_import_0 = __webpack_require__(2);
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
function _ts_metadata(metadataKey, metadataValue) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") {
        return Reflect.metadata(metadataKey, metadataValue);
    }
}

class HealthController {
    check() {
        return {
            status: 'ok',
            service: 'trust-api',
            timestamp: new Date().toISOString()
        };
    }
}
_ts_decorate([
    (0,_nestjs_common__rspack_import_0.Get)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", []),
    _ts_metadata("design:returntype", Object)
], HealthController.prototype, "check", null);
HealthController = _ts_decorate([
    (0,_nestjs_common__rspack_import_0.Controller)('health')
], HealthController);


},
28(__unused_rspack___webpack_module__, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  HealthModule: () => (HealthModule)
});
/* import */ var _nestjs_common__rspack_import_0 = __webpack_require__(2);
/* import */ var _health_controller__rspack_import_1 = __webpack_require__(29);
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


class HealthModule {
}
HealthModule = _ts_decorate([
    (0,_nestjs_common__rspack_import_0.Module)({
        controllers: [
            _health_controller__rspack_import_1.HealthController
        ]
    })
], HealthModule);


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
/* import */ var _app_module__rspack_import_3 = __webpack_require__(4);




async function bootstrap() {
    const app = await _nestjs_core__rspack_import_2.NestFactory.create(_app_module__rspack_import_3.AppModule);
    // Los agentes no hablan con esta API. Solo el dashboard y la página pública.
    app.enableShutdownHooks();
    const port = Number(process.env.PORT ?? 3000);
    await app.listen(port, '0.0.0.0');
    new _nestjs_common__rspack_import_1.Logger('Bootstrap').log(`api escuchando en http://0.0.0.0:${port}`);
}
void bootstrap();

})();


//# sourceMappingURL=main.js.map