define([ 
   'marionette', 
   'backbone', 
   'underscore', 
   'text!modules/exchangeRates/views/templates/rate.html'
],function( Marionette, Backbone, _, tmplRate ){

   return Backbone.Marionette.ItemView.extend({

      tagName: 'li',

      template: _.template( tmplRate ),

      events: {
         'click': 'countrySelected'
      },

      countrySelected: function(event){

         // stopped so clicks away from the list can close out the drop down
         event.stopPropagation();

         this.trigger('countrySelected');
      }

   });

});
