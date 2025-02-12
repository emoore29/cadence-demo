// const winston = require("winston");

// const logger = winston.createLogger({
//   level: "info",
//   format: winston.format.combine(
//     winston.format.timestamp({
//       format: "DD/MM/YYYY, h:mm:ss a",
//     }),
//     winston.format.printf((info) => {
//       return `${info.timestamp}: ${info.message}`;
//     })
//   ),
//   transports: [
//     // Write to file
//     new winston.transports.File({ filename: "error.log", level: "error" }),
//     new winston.transports.File({ filename: "combined.log" }),
//     // Also write to console in development
//     new winston.transports.Console(),
//   ],
// });

// module.exports = logger;
