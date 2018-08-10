"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const koa_1 = __importDefault(require("koa"));
const koa_bodyparser_1 = __importDefault(require("koa-bodyparser"));
const db_1 = require("./db");
const koa_router_1 = __importDefault(require("koa-router"));
const router = new koa_router_1.default();
const app = new koa_1.default();
const db = new db_1.Db();
router.post('/api/player', async function addPlayer(ctx, next) {
    // ctx.router available
    console.log(ctx.request.body);
    var fields = ctx.request.body;
    if (!fields) {
        // invalid stuff!
        ctx.status = 400;
        ctx.body = { error: "empty fields" };
        return;
    }
    var player_name = fields.name;
    delete fields.name;
    await db.write(player_name, fields);
    ctx.status = 200;
    ctx.body = { update: "update successful" };
});
router.get('/', async function home(ctx, next) {
    ctx.body = `
    <h1>hello world</h1>
    <form method="POST" action="/api/player">
    Player Name: <input type="text" name="name"/> <br/>
    Speed: <input type="text" name="speed"/> <br/>
    On Base: <input type="text" name="onBase"/> <br/>
    <button type="submit"> Submit </button>
    </form>
    `;
    ctx.headers["content-type"] = "text/html";
});
app
    .use(koa_bodyparser_1.default())
    .use(async (ctx, next) => {
    debugger;
    await next();
})
    .use(router.routes());
//.use(router.allowedMethods());
async function start() {
    console.log("starting");
    await db.init();
    app.listen(3000);
}
start();
//# sourceMappingURL=index.js.map