import Koa from "koa"
import bodyParser from "koa-bodyparser"
import {Db} from "./db"

const app = new Koa()
const db = new Db()
start()
app.use(bodyParser())
app.use( async (ctx, next) => {
    await next()
    ctx.body = `
    <h1>hello world</h1>
    <form method="POST">
    Player Name: <input type="text" name="name"/> <br/>
    Speed: <input type="text" name="speed"/> <br/>
    On Base: <input type="text" name="onBase"/> <br/>
    <button type="submit"> Submit </button>
    </form>
    `
    ctx.headers["content-type"] = "text/html"
})
app.use( async (ctx, next) => {
    await next()
    if (ctx.request.method == "POST") {
        console.log(ctx.request.body)
        var fields = ctx.request.body
        var player_name =  fields.name
        delete  fields.name
        await db.write(player_name, fields)
    }
})
app.listen(3000)
async function start(){
    console.log("starting")
    await db.init()
}