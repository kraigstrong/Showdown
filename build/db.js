"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("util");
const toilet = require("toiletdb");
class Db {
    async init() {
        this.db = toilet('./data.json');
        this.db.open = util_1.promisify(this.db.open);
        this.db.read = util_1.promisify(this.db.read);
        this.db.write = util_1.promisify(this.db.write);
        await this.db.open();
    }
    async read(key) {
    }
    async write(key, value) {
        console.log("writing to db now");
        await this.db.write(key, value);
    }
}
exports.Db = Db;
//# sourceMappingURL=db.js.map