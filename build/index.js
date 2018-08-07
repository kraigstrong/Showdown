"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const koa_1 = __importDefault(require("koa"));
const koa_bodyparser_1 = __importDefault(require("koa-bodyparser"));
const db_1 = require("./db");
const app = new koa_1.default();
const db = new db_1.Db();
start();
app.use(koa_bodyparser_1.default());
app.use(async (ctx, next) => {
    await next();
    ctx.body = `
    <h1>hello world</h1>
    <form method="POST">
    Player Name: <input type="text" name="name"/> <br/>
    Speed: <input type="text" name="speed"/> <br/>
    On Base: <input type="text" name="onBase"/> <br/>
    <button type="submit"> Submit </button>
    </form>
    `;
    ctx.headers["content-type"] = "text/html";
});
app.use(async (ctx, next) => {
    await next();
    if (ctx.request.method == "POST") {
        console.log(ctx.request.body);
        var fields = ctx.request.body;
        var player_name = fields.name;
        delete fields.name;
        await db.write(player_name, fields);
    }
});
app.listen(3000);
async function start() {
    console.log("starting");
    await db.init();
}
//# sourceMappingURL=index.js.map