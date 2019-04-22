const path    = require('path')
const chalk   = require('chalk')
const Table   = require('cli-table2')
const prettyBytes = require('pretty-bytes')
const Router  = require('../router')

module.exports = {

  run(argv) {
    const publicPath = /^\//.test(argv.path) ? argv.path : path.join(process.cwd(), argv.path);
    const router = new Router({ publicPath, spa: argv.spa })

    console.log('Building sitemap…\n')
    router.ready(_ => {
      //console.log(router.sitemap)
      //console.log(router.toString())
      this.displayFileList(argv, router)
    })
  },

  displayFileList(argv, router) {
    const table = new Table({
      head: ['File', 'Size', '🌐'],
      chars: {
        'top': '' , 'top-mid': '' , 'top-left': '' , 'top-right': '' ,
        'bottom': '' , 'bottom-mid': '' , 'bottom-left': '' , 'bottom-right': '' ,
        'left': '' , 'left-mid': '' , 'mid': '' , 'mid-mid': '' ,
        'right': '' , 'right-mid': '' , 'middle': ' '
      },
      style: { 'padding-left': 0, 'padding-right': 0 }
    });

    const ready = Object.keys(router.files)
      .every(file => router.files[file].exists && router.files[file].valid);

    if (argv.show === 'all' ||
        argv.show === 'draft' && !router.exists ||
        argv.show === 'live' && router.exists) {
      table.push([
        chalk.green.bold('@router') + '\n' + chalk.grey(ready ? router.sha256 : "Can't calculate sitemap hash until all files deployed…"),
        { vAlign: 'bottom', content: router.valid ? chalk.grey.italic(prettyBytes(router.size)) : chalk.red.bold(prettyBytes(router.size)) },
        { vAlign: 'bottom', content: router.exists ? '✅' : '❌' }
      ])                
    }

    Object.keys(router.files)
      .filter(file => {
        const { exists } = router.files[file];
        if (argv.show === 'all')    return true;
        if (argv.show === 'draft')  return !exists;
        if (argv.show === 'live')   return exists;
      })
      .forEach(file => {
        const { exists, size, sha256, valid } = router.files[file];
        table.push([
          chalk.green.bold(file) + '\n' + chalk.grey(sha256),
          { vAlign: 'bottom', content: valid ? chalk.grey.italic(prettyBytes(size)) : chalk.red.bold(prettyBytes(size)) },
          { vAlign: 'bottom', content: valid ? (router.files[file].exists ? '✅' : '❌') : '⚠️' }
        ])
      })
    console.log(table.toString())
  }

}