'use strict';

define([
   'application', 
   'jquery', 
   'modules/exchangeRates/controller',
   'modules/exchangeRates/data'
], function( App, $, cExchangeRates, data ){

   App.module('exchangeRates', function( exchangeRates, App, Backbone, Marionette, $) {

      exchangeRates.addInitializer( function(){
         exchangeRates.controller = new cExchangeRates({

            /* Comment these out to get fresh data
             *-------------------------------------*/
            currencies: data.currencies,
            rates: data.rates,

            endpoints: {
               rates: 'http://openexchangerates.org/api/latest.json?app_id=f61845d8b3df4e76b1665c288ccbfe78',
               currencies: 'http://openexchangerates.org/api/currencies.json?app_id=f61845d8b3df4e76b1665c288ccbfe78'
            }

         });

         exchangeRates.controller.start();
      });

   });

   return App;

});

