import Koa from "koa"
import bodyParser from "koa-bodyparser"
import {Db} from "./db"
import Router from "koa-router"

const router = new Router()
const app = new Koa()
const db = new Db()

router.post('/api/player', async function addPlayer (ctx, next) {
    // ctx.router available
    console.log(ctx.request.body)
    var fields: any = ctx.request.body
    if (!fields){
        // invalid stuff!
        ctx.status = 400
        ctx.body = {error: "empty fields"}
        return
    }
    var player_name =  fields.name
    delete  fields.name
    await db.write(player_name, fields)
    ctx.status = 200
    ctx.body =  {update: "update successful"}
    ctx.response.redirect("/add")
});
router.get('/add', async function add (ctx, next) {
    ctx.body = `
    <h1>Add a player here</h1>
    <form method="POST" action="/api/player">
        Player Name: <input type="text" name="name"/> <br/>
        Speed: <input type="text" name="speed"/> <br/>
        On Base: <input type="text" name="onBase"/> <br/>
        <button type="submit"> Submit </button>
    </form>
    <form action="/">
        <button onclick="/">Home</button>
    </form>
    `
    ctx.headers["content-type"] = "text/html"
    ctx.status = 200
})
router.get('/', async function home (ctx, next) {
    ctx.body = `
    <h1>Home</h1>
    <form action="/add">
    <button type="Submit"> Add Player </button>
    </form>
    `
    ctx.headers["content-type"] = "text/html"
    ctx.status = 200
})

app
    .use(bodyParser())
    .use(async (ctx, next) => {
        debugger
        await next()
    })
    .use(router.routes())
    .use(router.allowedMethods());

async function start(){
    console.log("starting")
    await db.init()
    app.listen(3000)
}
start()
