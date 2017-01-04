"use strict"

const Nightmare = require('nightmare')
const path = require('path')
const expect = require('chai').expect

const server = require(path.join(__dirname, 'server.js'))

describe('nightmare tests', () => {
	before(() => {
		server.startServer()
	})

	it('should load a page and see Hello World', (done) => {
		const nightmare = Nightmare({show: true})
		nightmare
      .goto('http://localhost:8000')
      .wait('h1')
      .evaluate(function () {
        return document.querySelector('h1').innerText
      })
      .end()
      .then(function(text) {
        expect(text).to.equal('Hello World!');
        done();
      })
	})
})