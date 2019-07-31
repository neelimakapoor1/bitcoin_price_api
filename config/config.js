module.exports = {
    db: {
        url: 'mongodb://localhost:27017/pricesdb'
    },
    coin_api: {
        base_url: 'rest.coinapi.io',
        api_key: '1BD6338A-046C-4550-B990-35A52B8D5D64',
        retries: 0
    },
    port: 5000,
    interval_in_sec: 2 * 60 * 60,
    to_currency: 'BTC',
    from_currency: 'EUR',
    to_currency_name: 'Bitcoins',
    from_currency_name: 'Euros',
    load_previous: false 
}