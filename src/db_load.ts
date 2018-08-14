var fs = require('fs'),
    readline = require('readline');

var rd = readline.createInterface({
    input: fs.createReadStream('../raw_data/batters.csv'),
    console: false
});

rd.on('line', function(line: String) {
    const parts = line.split(',')
    var name = parts[0]
    var year = parts[1]
    var set = parts[2]
    var number = parts[3]
    var unique_id = `${year}-${set}-${number}`
    var team = parts[4]
    var on_base = parts[5]
    if (name == "Ken Griffey Jr.") {
        console.log(`Ken was on ${team} in ${year}`)
    }

});