"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const koa_1 = __importDefault(require("koa"));
const koa_bodyparser_1 = __importDefault(require("koa-bodyparser"));
const app = new koa_1.default();
app.use(koa_bodyparser_1.default());
app.use(async (ctx, next) => {
    await next();
    ctx.body = `
    <h1>hello world</h1>
    <form method="POST">
    <input type="text" name="box1"/>
    <button type="submit"> Submit </button>
    </form>
    `;
    // ctx.status = 200
    ctx.headers["content-type"] = "text/html";
});
app.use(async (ctx, next) => {
    await next();
    if (ctx.request.method == "POST") {
        console.log(ctx.request.body);
    }
});
app.listen(3000);
