// Deprecated: the project now uses MongoDB. This shim keeps old commands working.
console.log("[db] PostgreSQL is no longer used. Starting MongoDB instead...\n");
require("./mongo-server.js");