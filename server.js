"use strict"

const path = require('path')
const fs = require('fs')
const reader = require('./lib/reader.js')
const player = require('./lib/player.js')

const express = require('express')
const app = express()
const http = require('http').Server(app)
const io = require('socket.io')(http)

let list = []
let busy = false

function play(path) {
  if (player.playing)
    player.stop();

  player.play({
    file: path
  }, function() {
    // Done playing
    io.emit('status', 'stopped')
  });
}

function stop() {
  console.log('stopping');
  player.stop();
}

function pause() {
  console.log('pausing');
  player.pause();
}

function resume() {
  console.log('resuming');
  player.resume();
}

function refresh() {
  io.emit('refresh', 'reading')
  reader.readfiles('/Users/dbond/Desktop', (err, tracks) => {
    if (err) console.log(err)

    busy = false
  	list = tracks
    fs.writeFile('/Users/dbond/Desktop/.db', JSON.stringify(tracks))

    io.emit('refresh', 'done')
  })
}

function startServer(port) {
	app.use(express.static(__dirname + '/www'))

	app.get('/dir', (req, res) => {
	  const path = req.query.d ? req.query.d : '/'
	  console.log('reading dir', path)

	  if (!busy) {
	    list = []
	    busy = true
	    reader.readdir(path, (err, files) => {
	      if (err)
	        console.log(err)

	      list = files
	      busy = false
	      io.emit('refresh', 'done')
	    })
	  }

	  res.send({
	    status: 'reading'
	  })
	})

	app.get('/list', (req, res) => {
	  console.log('sending list')
	  res.send(list)
	})

	app.get('/tracks', (req, res) => {
	  if (!busy) {
	    list = []

	    fs.stat('/Users/dbond/Desktop/.db', (err) => {
	      if (err) {
	        console.log('refreshing list')
	        refresh()
	      } else {
	        busy = true
	        console.log('reading db')
	        fs.readFile('/Users/dbond/Desktop/.db', (_err, data) => {
	          if (err) console.log(_err)

	          list = JSON.parse(data.toString())
	          busy = false

	          io.emit('refresh', 'done')
	        });
	      }
	    });
	  }

	  res.send({
	    status: 'reading'
	  });
	});

	io.on('connection', (socket) => {
	  socket.on('play', (path) => {
	    console.log('emitting status')
	    io.emit('status', 'playing')
	  })

	  socket.on('refresh', () => {
	  	console.log('refreshing list')
	    if (!busy) {
	      list = []
	      busy = true
	      refresh()
	    }
	  })
	})

	http.listen(port || 8000, () => {
	  console.log("Server listening");
	})
}

module.exports.startServer = startServer