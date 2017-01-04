"use strict";

const fs = require('fs');
const p = require('path');
const id3 = require('musicmetadata');
const validExt = /(\.mp3)|(\.m4a)|(\.aac)$/;

module.exports.readdir = (path, callback) => {
  const fullPath = path
  const list = []

  fs.readdir(fullPath, (err, files) => {
    if (err) return callback(err)

    let pending = files.length
    if (!pending) return callback(null, list)

    files.forEach((file) => {
      let filePath = p.join(fullPath, file)
      fs.stat(filePath, (_err, stats) => {
        if (_err) return callback(_err)

        if (stats.isDirectory())
          list.push({
            'name': file,
            'path': p.join(path, file),
            'isDirectory': true
          })
        else {
          if (p.extname(filePath).match(validExt))
            list.push({
              'name': file,
              'path': p.join(path, file)
            })
        }

        pending -= 1
        if (!pending) {
          return callback(null, list)
        }
      })
    })
  })
};

function readfiles(path, callback) {
  const fullPath = path

  let list = []

  fs.readdir(fullPath, (err, files) => {
    if (err) return callback(err)

    var pending = files.length
    if (!pending) return callback(null, list)

    files.forEach((file) => {
      var filePath = p.join(fullPath, file)
      fs.stat(filePath, (_err, stats) => {
        if (_err) return callback(_err)

        if (stats.isDirectory()) {
          if (!p.basename(filePath).match(/^\./))
            readfiles(filePath, (__err, res) => {
              if (__err) return callback(__err)

              list = list.concat(res)
              pending -= 1
              if (!pending) return callback(null, list)
            })
          else {
            pending -= 1
            if (!pending) return callback(null, list)
          }
        } else {
          if (p.extname(filePath).match(validExt))
            id3(fs.createReadStream(filePath), (err, tags) => {
              list.push({
                'path': filePath,
                'tags': tags
              })

              pending -= 1
              if (!pending) return callback(null, list)
            })
          else {
            pending -= 1
            if (!pending) return callback(null, list)
          }
        }
      })
    })
  })
}

module.exports.readfiles = readfiles;
