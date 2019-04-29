const fs      = require('fs')
const path    = require('path')
const EventEmitter = require('events')
const chalk   = require('chalk')
const bsv     = require('bsv')
const mime    = require('mime-types')
const Router    = require('../router')
const bitdb     = require('../bitdb')
const bitindex  = require('../bitindex')
const helper    = require('../helpers')

const bProtocolPrefix = '19HxigV4QyBv3tHpQVcUEQyq1pzZVdoAut',
      routerPrefix    = '04e5e72136e5211a18a47dc9e5179dfd2309c19028f62a36e252c983d42cdfba';

module.exports = {

  run(argv) {
    if (!process.env.ADDRESS) {
      console.log('  ❗️', chalk.bold.red(`Wallet not found. Have you generated it?`))
      return false;
    }

    const publicPath = /^\//.test(argv.path) ? argv.path : path.join(process.cwd(), argv.path);
    const router = new Router({ publicPath, spa: argv.spa })

    this.attachEventEmitter()

    bitindex.getUtxos(process.env.ADDRESS)
      .then(utxos => {
        const balance = utxos
          .map(utxo => utxo.satoshis)
          .reduce((total, amt) => total + amt, 0);
        if (balance === 0) throw new Error('Insufficient balance');
        return utxos;
      })
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

  async deployFiles(argv, router) {
    const files = Object.keys(router.files)
      .filter(file => !router.files[file].exists);

    for (const file of files) {
      await new Promise((resolve, reject) => {
        console.log(`Deploying: ${ chalk.green.bold(file) }`)

        const filename  = path.basename(router.files[file].fullPath),
              data      = fs.readFileSync(router.files[file].fullPath),
              payload   = [ bProtocolPrefix, data, mime.lookup(filename), { op: 0 }, filename ];

        const eventCallback = tx => {
          if (tx.sha256 === router.files[file].sha256) {
            this.events.removeListener('tx', eventCallback)
            // Delay 1 second per 50k
            setTimeout(resolve, router.files[file].size / 500)
          }
        }
        this.events.on('tx', eventCallback)

        this.buildTx(payload)
          .then(tx    => bitindex.sendTx(tx))
          .then(txid  => console.log(chalk.gray('TXID'), chalk.white.bold(txid), '✅'))
          .catch(reject)
        
        // In case bitdb doesn't fire event, limit wait to 10 seconds
        setTimeout(_ => {
          this.events.removeListener('tx', eventCallback)
          resolve()
        }, 10000)

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

    console.log(`Deploying: ${ chalk.green.bold('@router') }`)
    const payload = [
      bProtocolPrefix, router.toString(), 'application/json', 'UTF-8', '@router', '|',
      Buffer.from(routerPrefix, 'hex')
    ];
    return this.buildTx(payload)
      .then(tx    => bitindex.sendTx(tx))
      .then(txid  => console.log(chalk.gray('TXID'), chalk.white.bold(txid), '✅'))
  },

  buildTx(data) {
    return bitindex.getUtxos(process.env.ADDRESS)
      .then(utxos => utxos.map(bsv.Transaction.UnspentOutput))
      .then(utxos => {
        const tx      = new bsv.Transaction().change(process.env.ADDRESS),
              script  = new bsv.Script();
        let   fee     = 0;

        // Add OP_RETURN output
        script.add(bsv.Opcode.OP_RETURN);
        data.forEach(item => {
          // Hex string
          if (typeof item === 'string' && /^0x/i.test(item)) {
            script.add(Buffer.from(item.slice(2), 'hex'))
          // Opcode number
          } else if (typeof item === 'number') {
            script.add(item)
          // Opcode
          } else if (typeof item === 'object' && item.hasOwnProperty('op')) {
            script.add({ opcodenum: item.op })
          // All else
          } else {
            script.add(Buffer.from(item))
          }
        })
        tx.addOutput(new bsv.Transaction.Output({ script, satoshis: 0 }))

        // Incrementally add utxo until sum of inputs covers fee + dust
        utxos.some(utxo => {
          tx.from(utxo);
          fee = tx._estimateFee();
          return helper.inputSum(tx) >= fee + 546;
        })
        tx.fee(fee);

        return tx.sign(process.env.PRIVATE)
      })
  }


}