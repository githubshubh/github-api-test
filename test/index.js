const glob = require("globby");
const path = require("path");
glob("../views").then((_) =>
  console.log(_.map((fullPath) => path.relative("../views", fullPath)))
);
