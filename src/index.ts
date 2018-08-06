import Koa from "koa"
import bodyParser from "koa-bodyparser"
import {Db} from "./db"

const app = new Koa()
app.use(bodyParser())
app.use( async (ctx, next) => {
    await next()
    ctx.body = `
    <h1>hello world</h1>
    <form method="POST">
    <input type="text" name="box1"/>
    <button type="submit"> Submit </button>
    </form>
    `
    // ctx.status = 200
    ctx.headers["content-type"] = "text/html"
})
app.use( async (ctx, next) => {
    await next()
    if (ctx.request.method == "POST") {
        console.log(ctx.request.body)
    }
})
app.listen(3000)