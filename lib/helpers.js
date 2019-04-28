// TX helpers
const helpers = {
  // Returns sum of all tx inputs
  inputSum(tx) {
    return tx.inputs.reduce(function(acc, input) {
      return acc + input.output.satoshis;
    }, 0)
  },

  // Returns sum of all tx outputs
  outputSum(tx) {
    return tx.outputs.reduce(function(acc, output) {
      return acc + output.satoshis;
    }, 0)
  }
}

module.exports = helpers;