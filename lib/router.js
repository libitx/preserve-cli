const fs    = require('fs')
const path  = require('path')
const forge = require('node-forge')
const glob  = require('glob')

const bitdb = require('./bitdb')

class Sitemap {
  constructor(opts = {}) {
    this.publicPath = opts.publicPath
    this.spa = opts.spa
    this.scanFiles()
    this.checkRemote()
  }

  get sitemap() {
    const options = {
      spa: this.spa
    }
    const routes = Object.keys(this.files)
      .reduce((obj, file) => {
        obj[file] = {
          b: this.files[file].txid,
          c: this.files[file].sha256
        };
        return obj;
      }, {})

    return {
      options,
      routes
    }
  }

  toString() {
    return JSON.stringify(this.sitemap);
  }

  ready(callback) {
    this._promise.then(callback)
  }

  scanFiles() {
    this.files = glob
      .sync('**', { cwd: this.publicPath, nodir: true })
      .reduce((obj, file) => {
        const fullPath = path.join(this.publicPath, file),
              data = fs.readFileSync(fullPath);
        obj[path.join('/', file)] = {
          fullPath,
          size:   data.length,
          sha256: this._sha256(data),
          txid:   null,
          get exists() { return !!this.txid },
          get valid() { return this.size < 99500 }
        };
        return obj;
      }, {})
  }

  checkRemote() {
    const files = Object.keys(this.files),
          hashes = files.map(file => this.files[file].sha256);

    this._promise = bitdb.checkRemote(hashes)
      .then(txs => {
        files.forEach(file => {
          const tx = txs.find(tx => tx.sha256 === this.files[file].sha256)
          if (tx) this.files[file].txid = tx.txid;
        })
      })
      .then(_ => {
        this.size   = this.toString().length
        this.sha256 = this._sha256(this.toString())
        return bitdb.checkRemote([this.sha256])
      })
      .then(txs => {
        this.exists = !!txs.find(tx => tx.sha256 === this.sha256)
        this.valid  = this.size < 99500
      })

    return this._promise;
  }

  _sha256(data) {
    const md = forge.md.sha256.create();
    md.update(data.toString('binary'))
    return md.digest().toHex();
  }
}

module.exports = Sitemap;