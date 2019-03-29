const chalk   = require('chalk')
const qrcode  = require('qrcode-terminal')
const datapay = require('datapay')

module.exports = {

  async run(argv) {
    if (!process.env.ADDRESS) {
      console.log('  ❗️', chalk.bold.red(`Wallet not found. Have you generated it?`))
      return false;
    }
    await this.displayQRCode()
    this.displayBalance()
  },

  displayQRCode() {
    return new Promise(resolve => {
      qrcode.generate(`bitcoin:${process.env.ADDRESS}?sv`, (code) => {
        console.log('\n' + code)
        resolve()
      })
    })
  },

  displayBalance() {
    datapay.connect().getUnspentUtxos(process.env.ADDRESS, (err, utxos) => {
      if (err) throw err;
      //console.log(utxos)
      const balance = utxos
        .map(utxo => utxo.satoshis)
        .reduce((total, amt) => total + (amt/100000000), 0)
        .toFixed(8)

      console.log('\n  Address:', chalk.blue.bold(process.env.ADDRESS))
      console.log('  Balance:', chalk.white('\u20bf ' + balance))
      if (balance === 0) {
        console.log('\n  🚀', chalk.red('Get started by sending a small amount of Bitcoin SV to your address.'))
      }
    })
  }

}