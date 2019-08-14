const chalk   = require('chalk')
const bsv     = require('bsv')
const Message = require('bsv/message')
const emojic  = require('emojic')

module.exports = {
  run(argv) {
    if (!process.env.PRIVATE) {
      console.log(' ', emojic.exclamation, chalk.bold.red(`Wallet not found. Have you generated it?`))
      return false;
    }

    console.log('Please create the following 2 DNS records…')
    this.displayDNS(argv)
  },

  displayDNS(argv) {
    const address   = process.env.ADDRESS,
          privKey   = bsv.PrivateKey.fromWIF(process.env.PRIVATE),
          hostname  = argv.hostname,
          signature = Message.sign(argv.hostname, privKey);

    console.log( '\n' + chalk.gray('Host:\t'), chalk.white(hostname) )
    console.log( chalk.gray('Type:\t'), chalk.white('CNAME') )
    console.log( chalk.gray('Data:\t'), chalk.white('dns.preserve.bitpaste.app') )

    console.log( '\n' + chalk.gray('Host:\t'), chalk.white(`id._bsv.${ hostname }`) )
    console.log( chalk.gray('Type:\t'), chalk.white('TXT') )
    console.log( chalk.gray('Data:\t'), chalk.white(`a=${ address }; s=${ signature }`) )

    console.log('\n ', emojic.globeWithMeridians, 'View site at:', chalk.blue.bold('http://'+hostname))
  }
}