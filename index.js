const config = require("./src/Configs/config.js");
require("./src/Structures/client.js").start(config);
require('./src/Events/livefeed.js');
require('./src/Events/events.js');
require('./src/Events/logging.js');
require('./src/Events/automod.js');


