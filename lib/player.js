"use strict";

const p = require('path');
const spawn = require('child_process').spawn;

let stream, output;

function spawnFaad(infile) {
  // infile = p.join('/mnt/sda1/', infile);
  return spawn('faad', ['-q', '-w', '-f', '2', infile], {stdio: [null, 'pipe', 'inherit']});
}

function spawnMad(infile) {
  // infile = p.join('/mnt/sda1/', infile);
  return spawn('madplay', ['--bit-depth=16', '--sample-rate=48000', '--output=raw:-', infile], {stdio: [null, 'pipe', 'inherit']});
}

function spawnAplay() {
  // return spawn('play', ['--interactive', '-c', '2', '-b', '16', '-e', 'signed-integer', '-t', 'raw', '-r', '48k', '-'], {stdio: ['pipe', 'pipe', 'inherit']});
  return spawn('aplay', ['-q', '-i', '-c', '2', '-t', 'raw', '-f', 'dat', '-'], {stdio: ['pipe', 'pipe', 'inherit']});
}

function getDecoder(infile) {
  if (infile.match(/\.mp3$/)) return 'mp3';
  if (infile.match(/\.m4a$/)) return 'aac';
  if (infile.match(/\.aac$/)) return 'aac';
}

module.exports = () => {
  return this;
};

module.exports.prototype.pause = () => {
  this.playing = false;
  try {
    this.stream.kill('SIGSTOP');
  } catch (x) {
    console.log('paused');
  }
};

module.exports.prototype.resume = () => {
  this.playing = true;
  try {
    this.stream.kill('SIGCONT');
  } catch (x) {
    console.log('resumed');
  }
};

module.exports.prototype.stop = () => {
  this.playing = false;
  try {
    this.stream.kill('SIGINT');
  } catch (x) {
    console.log('stopped')
  }
};

module.exports.prototype.play = (opts, callback) => {
  if (!opts)
    return;

  opts.decoder = opts.decoder || getDecoder(opts.file);

  var output;
  if (opts.decoder === 'aac')
    output = spawnFaad(opts.file);
  else if (opts.decoder === 'mp3')
    output = spawnMad(opts.file);

  if (!output)
    return;

  this.playing = true;
  this.stream = spawnAplay();
  output.stdout.pipe(stream.stdin);
  this.stream.on('close', function() {
    this.playing = false;
    callback();
  });
  this.stream.stdin.on('error', function(err) {
    console.log('stream err',err);
  });
  this.stream.on('error', function(err) {
    console.log('aplay err', err);
  });
};
