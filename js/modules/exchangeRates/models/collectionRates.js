define(['modules/exchangeRates/models/modelRate', 'backbone'],function( model, Backbone ){
   return Backbone.Collection.extend({ model: model });
});
