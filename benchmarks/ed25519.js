/* eslint-disable no-console */
'use strict'

const Benchmark = require('benchmark')

const native = require('ed25519')
const noble = require('@noble/ed25519')
const { subtle } = require('crypto').webcrypto

require('node-forge/lib/ed25519')
const forge = require('node-forge/lib/forge')

const suite = new Benchmark.Suite('ed25519 implementations')

const seed = Buffer.alloc(32)

suite.add('native ed25519', async (d) => {
  const key = native.MakeKeypair(seed)
  const message = Buffer.from('hello world ' + Math.random())
  const signature = native.Sign(message, key)

  const res = native.Verify(message, signature, key.publicKey)

  if (!res) {
    throw new Error('could not verify native signature')
  }

  d.resolve()
}, { defer: true })

suite.add('noble ed25519', async (d) => {
  const message = Buffer.from('hello world ' + Math.random())

  const privateKey = noble.utils.randomPrivateKey()
  const publicKey = await noble.getPublicKey(privateKey)
  const signature = await noble.sign(message, privateKey)

  const isSigned = await noble.verify(signature, message, publicKey)

  if (!isSigned) {
    throw new Error('could not verify noble signature')
  }

  d.resolve()
}, { defer: true })

suite.add('node-forge ed25519', async (d) => {
  const message = Buffer.from('hello world ' + Math.random())

  const key = await forge.pki.ed25519.generateKeyPair({ seed })
  const signature = await forge.pki.ed25519.sign({ message, privateKey: key.privateKey })
  const res = await forge.pki.ed25519.verify({ signature, message, publicKey: key.publicKey })

  if (!res) {
    throw new Error('could not verify node-forge signature')
  }

  d.resolve()
}, { defer: true })

suite.add('node.js ed25519', async (d) => {
  const message = Buffer.from('hello world ' + Math.random())

  const key = await subtle.generateKey({
    name: 'NODE-ED25519',
    namedCurve: 'NODE-ED25519'
  }, true, ['sign', 'verify'])
  const signature = await subtle.sign('NODE-ED25519', key.privateKey, message)
  const res = await subtle.verify('NODE-ED25519', key.publicKey, signature, message)

  if (!res) {
    throw new Error('could not verify node.js signature')
  }

  d.resolve()
}, { defer: true })

suite
  .on('cycle', (event) => console.log(String(event.target)))
  .run({ async: true })