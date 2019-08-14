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
    const satoshis = utxos
      .map(utxo => utxo.satoshis)
      .reduce((total, amt) => total + amt, 0);
    if (satoshis === 0) throw new Error('Insufficient balance');

    const tx = new bsv.Transaction().from(utxos);
    let fee = 0, cost = 0;
    while(cost <= satoshis) {
      tx.to(process.env.ADDRESS, argv.size)
      fee   = tx._estimateFee();
      cost  = helper.outputSum(tx) + fee + argv.size + 546;
    }
    tx.fee(fee)
      .change(process.env.ADDRESS)
      .sign(process.env.PRIVATE)
    console.log(`Splitting balance of ${ chalk.white(satoshis) } satoshis into ${ chalk.white(tx.outputs.length) } outputs…`)
    return inquirer
      .prompt([{ type: 'confirm', name: 'proceed', message: 'Continue?', default: false }])
      .then(res => res.proceed ? tx : process.exit(0))
  }
}