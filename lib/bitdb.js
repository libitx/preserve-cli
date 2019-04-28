const axios       = require('axios')
const EventSource = require('eventsource')

const headers = {
  key: '12mu6FQU8PhGn6iC38AQVBDL2C5JsNUGXs'
}

const client = axios.create({
  baseURL: 'https://data.bitdb.network/q/1KuUr2pSJDao97XM8Jsq8zwLS6W1WtFfLg/',
  headers
})

const bitdb = {
  client,

  checkRemote(hashes) {
    const query = {
      "v": 3,
      "q": {
        "find": {
          "c": { "$in": hashes }
        },
        "project": { "c": 1, "tx.h": 1 },
        "limit": hashes.length
      },
      "r": {
        "f": "[ .[] | { sha256: .c, txid: .tx.h }]"
      }
    }
    return this.client.get(this._path(query))
      .then(r => r.data.u.concat(r.data.c))
  },

  openSocket(address) {
    const query = {
      "v": 3,
      "q": {
        "find": {
          "in.e.a": address
        },
        "project": { "c": 1, "tx.h": 1 }
      },
      "r": {
        "f": "[ .[] | { sha256: .c, txid: .tx.h }]"
      }
    }
    const url = 'https://data.bitdb.network/s/1KuUr2pSJDao97XM8Jsq8zwLS6W1WtFfLg/' + this._path(query);
    return new EventSource(url, { headers })
  },

  _path(query) {
    return Buffer.from(JSON.stringify(query)).toString('base64')
  }
}

module.exports = bitdb;