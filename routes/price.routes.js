/**
* List of APIs
**/
module.exports = (app) => {
    const priceService = require('../services/price.service.js');

    // Retrieve price history for given type of chart for given from and to currency
    app.get('/chart/:fromCurrency/:toCurrency/:type', priceService.getPriceHistory);


    // get captions 
    //TODO: hardcoded
    app.get('/captions', (req, res) => {
      res.status(200).send({
          "comprar-bitcoins": "Comprar bitcoins pagando con tu saldo en euros. Aumenta tu saldo en bitcoins.",
          "vender-bitcoins": "Vender bitcoins de tu cartera. Aumenta tu saldo en euros.",
          "ingresar-euros": "Ingresar euros en tu cartera mediante una transferencia a nuestra cuenta bancaria.",
          "retirar-euros": "Retirar euros de tu cartera, recibiendo una transferencia a tu cuenta bancaria.",
          "recibir-bitcoins": "Recibir bitcoins desde un monedero de la red Bitcoin a tu cartera CRIPTAN.",
          "enviar-bitcoins": "Enviar bitcoins de tu cartera CRIPTAN a un monedero de la red Bitcoin.",
          "cartera": "Valoración total y detalle de tu cartera de criptomonedas y euros."
        })
    });

    // get prices
    //TODO: hardcoded
    app.get('/prices', (req, res) => {
      res.status(200).send({
          "market": "8534.50",
          "buy": "8700.92",
          "sell": "8368.08",
          "networkFees": "0.00000700",
          "fiatWithdrawalFee": "0.00"
        })
    });
}