const fs = require('fs-extra');
const parse = require('./src');
const glob = require('glob');
const path = require('path');

const folderName = process.argv[2];

const globe = location =>
  new Promise((resolve, reject) =>
    glob(location, {}, (err, files) => (err ? reject(err) : resolve(files)))
  );

globe(path.join(folderName, `**/*.js`))
// Promise.resolve(['test-data/test.js'])
  .then(files =>
    Promise.all(
      files.map(fl => fs.readFile(fl, 'utf-8').then(d => [fl, d]))
    ).then(fileContents =>
      Promise.all(
        fileContents.map(([file, content]) => {
          const [cPath, suffix] = file.split('.');
          return fs.writeFile(`${cPath}-parsed.${suffix}`, parse(content));
        })
      )
    )
  )
  .catch(console.error);
