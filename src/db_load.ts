import {Db} from "./db"

const db = new Db()

var fs = require('fs'),
    readline = require('readline');

async function start(){
    console.log("starting db")
    await db.init()

    var rd = readline.createInterface({
        input: fs.createReadStream('../raw_data/batters.csv'),
        console: false
    });
    
    rd.on('line', function(line: String) {
        const parts = line.split(',')
        var [name, year] = parts
        var set = parts[2]
        var number = parts[3]
        var unique_id = `${year}-${set}-${number}`
        var team = parts[4]
        var on_base = parts[5]
    
        if (name == "Ken Griffey Jr.") {
            db.write(unique_id, `{team: ${team}, on_base: ${on_base}}`)
        }
    });
}

start()