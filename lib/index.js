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
const dns     = require('./commands/dns')
const split   = require('./commands/split')
const sweep   = require('./commands/sweep')

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
    (yargs) => {
      yargs
        /**
         * Command: wallet:split
         * Split wallet UTXOs
         */
        .command('split', 'Split wallet UTXOs',
          (yargs) => {
            yargs
              .option('size', {
                alias: 's',
                describe: 'The size (in satoshis) of each split utxo',
                default: 10000
              })
          },
          (argv) => split.run(argv)
        )
        /**
         * Command: wallet:sweep
         * Split wallet UTXOs
         */
        .command('sweep [address]', 'Sweep wallet UTXOs into another address',
          (yargs) => {
            yargs
              .positional('address', {
                describe: 'Bitcoin address to send wallet balance to',
              })
              .demandOption('address', 'Address is required')
          },
          (argv) => sweep.run(argv)
        )
    },
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
        .option('spa', {
          describe: 'Serve a Single Page Application',
          coerce: (arg) => typeof arg === 'string' ? arg : '/'
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
        .option('spa', {
          describe: 'Serve a Single Page Application',
          coerce: (arg) => typeof arg === 'string' ? arg : '/'
        })
    },
    (argv) => deploy.run(argv)
  )

  /**
   * Command: deploy
   * Show DNS records
   */
  .command('dns [hostname]', 'Show DNS records',
    (yargs) => {
      yargs
        .positional('hostname', {
          describe: 'Fully qualified domain name to generate DNS records for',
        })
        .demandOption('hostname', 'Hostname is required')
    },
    (argv) => dns.run(argv)
  )

  .recommendCommands()
  .version(false)
  .argv