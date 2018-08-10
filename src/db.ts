import { promisify } from "util";

const toilet = require("toiletdb")

export class Db {
    db: any
    async init() {
        this.db = toilet('./data.json')
        this.db.open = promisify(this.db.open)
        this.db.read = promisify(this.db.read)
        this.db.write = promisify(this.db.write)
        await this.db.open()
    }
    async read(key: string) {

    }
    async write(key: string, value: string|number) {
        console.log("writing to db now")
        await this.db.write(key, value)
    }
}