#!/usr/bin/env node
const path    = require('path')
const dotenv  = require('dotenv')
const yargs   = require('yargs')
const chalk   = require('chalk')

dotenv.config({
  path: path.resolve(process.cwd(), '.bit')
})

const version = require('../package.json').version
const init    = require('./commands/init')
const wallet  = require('./commands/wallet')
const status  = require('./commands/status')
const deploy  = require('./commands/deploy')

console.log('\n' + chalk.blue.bold('Preserve') + chalk.gray('      v'+ version))
console.log(chalk.grey('====================') + '\n')

yargs
  /**
   * Command: init
   * Create wallet in current working directory
   */
  .command('init', 'Create wallet in current working directory',
    (yargs) => {},
    (argv) => init.run(argv)
  )

  /**
   * Command: wallet
   * Show wallet balance and deposit address
   */
  .command('wallet', 'Show wallet balance and deposit address',
    (yargs) => {},
    (argv) => wallet.run(argv)
  )

  /**
   * Command: status
   * Show sitemap status
   */
  .command('status [path]', 'Show sitemap status',
    (yargs) => {
      yargs
        .positional('path', {
          describe: 'Path to public folder containing static assets',
          default: '.'
        })
        .option('show', {
          alias: 's',
          describe: 'Only show draft files',
          choices: ['all', 'draft', 'live'],
          default: 'all'
        })
    },
    (argv) => status.run(argv)
  )

  /**
   * Command: deploy
   * Deploy all draft files to the blockchain
   */
  .command('deploy [path]', 'Deploy all draft files to the blockchain',
    (yargs) => {
      yargs
        .positional('path', {
          describe: 'Path to public folder containing static assets',
          default: '.'
        })
    },
    (argv) => deploy.run(argv)
  )

  // dns info
  // split utxo

  .recommendCommands()
  .version(false)
  .argv