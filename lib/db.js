const mysql = require("mysql2");
const { URL } = require('url');

let promisePool = null;

try {
  const mysqlUri = process.env.MYSQL_URI;

  if (!mysqlUri) {
    throw new Error("MYSQL_URI environment variable is not set or accessible.");
  }

  console.log("Parsing MYSQL_URI:", mysqlUri);

  const parsedUrl = new URL(mysqlUri);

  let sslOptions = null;
  const sslParam = parsedUrl.searchParams.get('ssl');

  if (sslParam) {
    try {
      sslOptions = JSON.parse(sslParam);
      console.log("Successfully parsed SSL options:", sslOptions);

      if (sslOptions.rejectUnauthorized !== true) {
        console.warn("Warning: rejectUnauthorized in SSL options is not explicitly true. TiDB Cloud Serverless requires it.");
      }
    } catch (e) {
      console.error("!!! Error parsing SSL JSON from URI parameter:", sslParam, e);
      throw new Error("Invalid SSL JSON format in MYSQL_URI.");
    }
  } else {
    console.error("!!! Error: SSL parameter is missing in MYSQL_URI. TiDB Cloud Serverless requires SSL.");
    throw new Error("SSL configuration is missing in MYSQL_URI.");
  }

  const dbConfig = {
    host: parsedUrl.hostname,
    port: parsedUrl.port,
    user: decodeURIComponent(parsedUrl.username),
    password: decodeURIComponent(parsedUrl.password),
    database: parsedUrl.pathname.slice(1),
    ssl: sslOptions,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  };

  console.log("Attempting to create MySQL pool with config:", {
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user ? '******' : '[Not Set]',
      database: dbConfig.database,
      ssl: dbConfig.ssl
  });

  const mysqlPool = mysql.createPool(dbConfig);

  promisePool = mysqlPool.promise();

  console.log("MySQL connection pool created successfully.");

} catch (error) {
  console.error("!!!!!! CRITICAL ERROR: Failed to initialize MySQL connection pool !!!!!!");
  console.error(error);
}

export { promisePool };