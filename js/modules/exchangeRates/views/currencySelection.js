define([ 
   'marionette', 
   'backbone', 
   'modules/exchangeRates/views/itemViewRate' 
],function( Marionette, Backbone, rateView ){

   return Backbone.Marionette.CollectionView.extend({

      tagName: 'ul',

      childView: rateView,

      childEvents: {
         'countrySelected': 'countrySelected'
      },

      selectedCountry: false,

      countrySelected: function( view ){

         if ( this.selectedCountry ) {

            if ( this.selectedCountry.cid == view.cid ){
               return;
            }

            // this.selectedCountry.$el.removeClass('selected');

         }

         this.selectedCountry = view;

         // this.selectedCountry.$el.addClass('selected');

         this.trigger('countrySelected', this.selectedCountry);

      }

   });

});
