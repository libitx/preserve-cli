const chalk     = require('chalk')
const inquirer  = require('inquirer')
const bsv       = require('bsv')
const emojic    = require('emojic')
const bitindex  = require('../bitindex')
const helper    = require('../helpers')

module.exports = {

  async run(argv) {
    if (!process.env.ADDRESS) {
      console.log(' ', emojic.exclamation, chalk.bold.red(`Wallet not found. Have you generated it?`))
      return false;
    }

    bitindex.getUtxos(process.env.ADDRESS)
      .then(utxos => utxos.map(bsv.Transaction.UnspentOutput))
      .then(utxos => this.buildTx(argv, utxos))
      .then(tx    => bitindex.sendTx(tx))
      .then(txid  => console.log('\n' + chalk.gray('TXID'), chalk.white.bold(txid), emojic.whiteCheckMark))
      .catch(err  => console.log('\n ', emojic.exclamation, chalk.red(err.message)))
  },

  buildTx(argv, utxos) {
    if (!utxos.length) throw new Error('No UTXOs to sweep.');

    const tx = new bsv.Transaction()
      .from(utxos)
      .change(argv.address);

    const fee = tx._estimateFee()
    tx.fee(fee).sign(process.env.PRIVATE)

    const balance = (tx.outputs[0]._satoshis / 100000000).toFixed(8);
    
    console.log(`Sweeping balance of ${ chalk.white('\u20bf ' + balance) } into ${ chalk.white(argv.address) }`)
    return inquirer
      .prompt([{ type: 'confirm', name: 'proceed', message: 'Continue?', default: false }])
      .then(res => res.proceed ? tx : process.exit(0))
  }
}