const fs      = require('fs')
const path    = require('path')
const mime    = require('mime-types')
const datapay = require('datapay')
const chalk   = require('chalk')
const EventEmitter = require('events')
const Router  = require('../router')
const bitdb   = require('../bitdb')

const bProtocolPrefix = '19HxigV4QyBv3tHpQVcUEQyq1pzZVdoAut',
      routerPrefix    = 'e7126a4d7a0b35608ab4e8f3c703f5d2a36c529f467d87f4fea3579f9d9893b1';

module.exports = {

  run(argv) {
    if (!process.env.ADDRESS) {
      console.log('  ❗️', chalk.bold.red(`Wallet not found. Have you generated it?`))
      return false;
    }

    const publicPath = /^\//.test(argv.path) ? argv.path : path.join(process.cwd(), argv.path);
    const router = new Router({ publicPath })

    this.attachEventEmitter()

    this.checkBalance()
      .then(_ => {
        console.log('Building sitemap…')
        return router._promise;
      })
      .then(_ => {
        const allValid = Object.keys(router.files)
          .every(file => router.files[file].valid)
        if (!allValid) throw new Error('Sitemap contains invalid files (too large)');
      })
      .then(_ => this.deployFiles(argv, router))
      .then(_ => this.deployRouter(argv, router))
      .then(_ => this.socket.close())
      .catch(err => {
        console.log('\n  ❗️', chalk.red(err.message))
        this.socket.close()
      })
  },

  attachEventEmitter() {
    this.events = new EventEmitter()
    this.socket = bitdb.openSocket(process.env.ADDRESS)
    this.socket.onmessage = (e) => {
      const msg = JSON.parse(e.data)
      msg.data.forEach(tx => this.events.emit('tx', tx))
    }
  },

  checkBalance() {
    return new Promise((resolve, reject) => {
      datapay.connect().getUnspentUtxos(process.env.ADDRESS, (err, utxos) => {
        if (err) reject(err);
        const balance = utxos
          .map(utxo => utxo.satoshis)
          .reduce((total, amt) => total + (amt/100000000), 0)
          .toFixed(8)

        balance > 0 ? resolve() : reject(new Error('Insufficient balance'));
      })
    })
  },

  async deployFiles(argv, router) {
    const files = Object.keys(router.files)
      .filter(file => !router.files[file].exists);

    for (const file of files) {
      await new Promise((resolve, reject) => {
        const eventCallback = tx => {
          if (tx.sha256 === router.files[file].sha256) {
            console.log('✅')
            this.events.removeListener('connection', eventCallback)
            resolve()
          }
        }
        this.events.on('tx', eventCallback)

        process.stdout.write(`Deploying: ${ chalk.green.bold(file) }`)
        const payload = this.buildPayload(router.files[file])
        this.deployFile(payload)
          .then(_ => process.stdout.write(chalk.gray.italic(' \ttx sent… ')))
          .catch(reject)
      }).catch(err => {
        console.log('\n  ❗️', chalk.red(err.message))
        process.exit(0)
      });
    }

    // Rebuild sitemap to include new txids
    if (files.length) return router.checkRemote();
  },

  deployRouter(argv, router) {
    const ready = Object.keys(router.files).every(file => router.files[file].exists);
    if (!ready || router.exists) return;

    process.stdout.write(`Deploying: ${ chalk.green.bold('@router') }`)
    const payload = {
      data: [
        bProtocolPrefix, router.toString(), 'application/json', 'UTF-8', '@router', '|',
        Buffer.from(routerPrefix, 'hex')
      ],
      pay: { key: process.env.PRIVATE }
    }
    return this.deployFile(payload)
      .then(_ => console.log(chalk.gray.italic(' \ttx sent… ') + '✅'))
      .catch(err => console.log('\n  ❗️', chalk.red(err.message)));
  },

  buildPayload(file) {
    const filename  = path.basename(file.fullPath),
          data      = fs.readFileSync(file.fullPath);
    return {
      data: [bProtocolPrefix, data, mime.lookup(filename), { op: 0 }, filename],
      pay: { key: process.env.PRIVATE }
    }
  },

  deployFile(payload) {
    return new Promise((resolve, reject) => {
      datapay.send(payload, (err, tx) => {
        if (err) reject(err);
        resolve()
      })
    })
  }


}