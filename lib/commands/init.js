const fs      = require('fs')
const path    = require('path')
const dotenv  = require('dotenv')
const chalk   = require('chalk')
const bsv     = require('bsv')

module.exports = {

  run(argv) {
    console.log('Generating new wallet…')
    this.createKeys(argv)
  },

  createKeys(argv) {
    const bitFile = path.join(process.cwd(), '.bit')
    if ( fs.existsSync(bitFile) ) {
      console.log('  ✅', '.bit config file already exists')
      return
    }

    const key = new bsv.PrivateKey();
    const bitVars = {
      ADDRESS:  key.toAddress().toString(),
      PUBLIC:   key.toPublicKey().toString(),
      PRIVATE:  key.toWIF().toString()
    }
    const content = Object.keys(bitVars).map(k => `${k}=${bitVars[k]}`).join('\n');
    fs.writeFileSync(bitFile, content)
    dotenv.config({ path: bitFile })
    console.log('  ✅', '.bit config file created')
    console.log('  🚨', chalk.bold.red('Remember to add .bit to your .gitignore file'))
  }
}