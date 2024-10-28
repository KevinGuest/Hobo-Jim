const config = require("./src/Configs/config.js");
require("./src/Structures/client.js").start(config);
require('./src/events/livefeed');
require('./src/events/logging');
require('./src/events/automod');


