const path    = require('path')
const chalk   = require('chalk')
const Table   = require('cli-table2')
const prettyBytes = require('pretty-bytes')
const Router  = require('../router')

module.exports = {

  run(argv) {
    const publicPath = /^\//.test(argv.path) ? argv.path : path.join(process.cwd(), argv.path);
    const router = new Router({ publicPath })

    console.log('Building sitemap…\n')
    router.ready(_ => {
      //console.log(router.sitemap)
      this.displayFileList(argv, router)
    })
  },

  displayFileList(argv, router) {
    const table = new Table({
      head: ['File', 'Size', 'Live'],
      chars: {
        'top': '' , 'top-mid': '' , 'top-left': '' , 'top-right': '' ,
        'bottom': '' , 'bottom-mid': '' , 'bottom-left': '' , 'bottom-right': '' ,
        'left': '' , 'left-mid': '' , 'mid': '' , 'mid-mid': '' ,
        'right': '' , 'right-mid': '' , 'middle': ' '
      },
      style: { 'padding-left': 0, 'padding-right': 0 }
    });

    if (argv.show === 'all' ||
        argv.show === 'draft' && !router.exists ||
        argv.show === 'live' && router.exists) {
      table.push([
        chalk.green.bold('@router') + '\n' + chalk.grey(router.sha256),
        { vAlign: 'bottom', content: chalk.grey.italic(prettyBytes(router.size)) },
        { vAlign: 'bottom', content: router.exists ? '✅' : '❌' }
      ])
    }

    Object.keys(router.files)
      .filter(file => {
        if (argv.show === 'all')    return true;
        if (argv.show === 'draft')  return !router.files[file].exists;
        if (argv.show === 'live')   return router.files[file].exists;
      })
      .forEach(file => {
        table.push([
          chalk.green.bold(file) + '\n' + chalk.grey(router.files[file].sha256),
          { vAlign: 'bottom', content: chalk.grey.italic(prettyBytes(router.files[file].size)) },
          { vAlign: 'bottom', content: router.files[file].exists ? '✅' : '❌' }
        ])
      })
    console.log(table.toString())
  }

}