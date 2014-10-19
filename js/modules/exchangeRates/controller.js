define([

    'jquery', 'underscore', 'backbone', 'marionette',
    'modules/exchangeRates/models/collectionRates',
    'modules/exchangeRates/views/currencySelection',

], function( $, _, Backbone, Marrionette, ratesCollection, vCurrencySelection ){

   return Backbone.Marionette.View.extend({
      
      el: '#currency_exchange_rate',

      events: {
         'keyup [name=currency_search]': 'filterList',
         'click [name=currency_search]': function(event){event.stopPropagation()},

         'keyup [name=from_currency_value]': 'convertToBitcoin',
         'keyup [name=bitcoin_value]': 'convertFromBitcoin',
         'click #selected_country': 'toggleDropdown'
      },

      ui: {
         searchBox: '[name=currency_search]',
         currencyInput: '[name=from_currency_value]',
         bitcoinInput: '[name=bitcoin_value]',
         countryDropDown: '#currency_selection',
         selectedCountry: '#selected_country'
      },

      selectedCurrency: false,

      baseCurrency: 'USD',

      baseCurrencyBitcoinRate: false,

      initialize: function( options ){

         this.currencies = options.currencies || false;
         this.rates      = options.rates || false;

         if ( !options.endpoints || !_.isObject(options.endpoints) ) {

            if ( !this.currencies || !this.rates ) {
               console.log('Some Error Message');
            }
         }

         this.endpoints = options.endpoints;

         this.bindUIElements();

      },

      start: function(){

         // ratesCollection is used for internal filitering
         this.ratesCollection = new ratesCollection([],{url: this.endpoints.rates});

         // ratesDisplay is what is visible to the client
         this.ratesDisplay    = new ratesCollection([]);

         // The UL element holding the country list
         this.viewCountrySelection = new vCurrencySelection( { collection: this.ratesDisplay } );

         this.listenTo( this.viewCountrySelection, 'countrySelected', this.countrySelected );

         // If there is no data, fetch it from the API
         // this.currencies === list on country codes and names
         // this.rates === base currency exchanged to various countries
         if ( !this.currencies || !this.rates ) {

            this.initializeData();

         } else {

            this.populateCurrencyList();
            this.getBaseCurrencyBitcoinRate();

            this.ui.countryDropDown.append( this.viewCountrySelection.el );
         }
      },

      /* 
       * Returns the rate to multiply by to 
       * get the bitcoin value
       *-------------------------------------*/
      _convertRateToBitcoin: function( country ) {

         if ( !this.baseCurrencyBitcoinRate ) {
            this.getBaseCurrencyBitcoinRate();
         }

         var country = this.ratesCollection.findWhere( {'country_code': country.toUpperCase()} );

         // 1 Dollar in country buys xxx USD
         var newBase = parseFloat(1 / country.get('rate'));

         return newBase * this.baseCurrencyBitcoinRate;

      },

      /* 
       * Returns the rate to multiply by to 
       * turn bitcoin into the selected
       * countries currency
       *-------------------------------------*/
      _convertRateFromBitcoin: function( country ) {

         if ( !this.baseCurrencyBitcoinRate ) {
            this.getBaseCurrencyBitcoinRate();
         }

         var bitcoinToUSD  = 1 / this.baseCurrencyBitcoinRate,
             country = this.ratesCollection.findWhere( {'country_code': country.toUpperCase()} );

         return parseFloat( country.get('rate') ) * bitcoinToUSD;

      },

      convertToBitcoin: function(){

         var userInput  = parseFloat(this.ui.currencyInput.val()).toFixed(2);

         if ( userInput && !isNaN(userInput) ){

            var multiplier = this._convertRateToBitcoin( this.selectedCurrency );
            this.ui.bitcoinInput.val( (userInput * multiplier).toFixed(2) );

         } else {

            this.ui.bitcoinInput.val('');

         }

      },

      convertFromBitcoin: function(){

         var userInput  = parseFloat(this.ui.bitcoinInput.val()).toFixed(2);

         if ( userInput && !isNaN(userInput) ){

            var multiplier = this._convertRateFromBitcoin( this.selectedCurrency );
            this.ui.currencyInput.val( (userInput * multiplier).toFixed(2) );

         } else {

            this.ui.currencyInput.val('');

         }

      },

      /* Set the rate for which the base
       * currency exchanges into bitcoins
       *-------------------------------------*/
      getBaseCurrencyBitcoinRate: function(){

         var country = this.ratesCollection.findWhere({'country_code': 'BTC'});

         this.baseCurrencyBitcoinRate = parseFloat(country.get('rate'));

      },

      /* 
       * Event handler to filter the list
       * of countries based on user input
       *-------------------------------------*/
      filterList: function( event ){

         var text = this.ui.searchBox.val();

         this.ratesDisplay.set(
            this.ratesCollection.filter( function( model ) { return model.get('country').toLowerCase().indexOf(text) == 0; })
         );

      },

      /* 
       * Toggles the display of the country
       * dropdown list and either enables
       * or disables events associated with it
       *--------------------------------------*/
      toggleDropdown: function( event ){

         if ( event ) event.stopPropagation();

         if ( this.ui.countryDropDown.hasClass('out') ) {
            this.ui.countryDropDown.removeClass('out');
            this.enableDropdownEvents();
         } else {
            this.ui.countryDropDown.addClass('out');
            this.disableDropdownEvents();
         }

      },

      /* 
       * Keeps track of what's highlighted
       * and is used as a reference point
       *-------------------------------------*/
      highlightedCountry: false,

      highlightCountry: function( view ){

         if ( this.highlightedCountry ) {

            this.highlightedCountry.$el.removeClass('highlight');

            var selectedCountry = this.viewCountrySelection.selectedCountry;

            if ( selectedCountry && selectedCountry._index == view._index ) {
               this.highlightedCountry = view;
               return true;
            } 

         }

         this.highlightedCountry = view;
         this.highlightedCountry.$el.addClass('highlight');
         this.highlightedCountry.$el[0].scrollIntoView(false);

      },

      highlightNextCountry: function(){

        var countryLength = this.viewCountrySelection.children.length,
            selectedCountry = this.viewCountrySelection.selectedCountry,
            nextIndex;

        if ( this.highlightedCountry ) {
           nextIndex = this.highlightedCountry._index + 1;
        } else if ( selectedCountry ) {
           nextIndex = selectedCountry._index + 1;
        } else {
           nextIndex = 0;
        }

        if ( nextIndex > countryLength ) return;

        this.highlightCountry( this.viewCountrySelection.children.findByIndex( nextIndex ) );

      },

      highlightPreviousCountry: function(){

        var countryLength = this.viewCountrySelection.children.length,
            selectedCountry = this.viewCountrySelection.selectedCountry,
            nextIndex;

        if ( this.highlightedCountry ) {
           if ( selectedCountry._index == this.highlightedCountry._index ) return;
           nextIndex = this.highlightedCountry._index - 1;
        } else if ( selectedCountry ) {
           nextIndex = selectedCountry._index - 1;
        } else {
            nextIndex = 0;
        }

        if ( nextIndex < 0 ) return;

        this.highlightCountry( this.viewCountrySelection.children.findByIndex( nextIndex ) );

      },

      selectHighlightedCountry: function(){
         this.highlightedCountry.$el.removeClass('highlight');
         this.countrySelected( this.highlightedCountry );
      },


      enableDropdownEvents: function(){

         var _self = this;

          /*
           * Allows you to naviagate the country
           * listing using arrow keys
           *-------------------------------------*/
          
         $(document).on('keyup.currency', function(e) {

            var keyCode = e.keyCode;

           // esc
           if (keyCode == 27) { 
               _self.toggleDropdown(e); 
               return true;
           }

           // down
           if (keyCode == 40 ) {
              _self.highlightNextCountry();
              return true;
           }

           // up 
           if ( keyCode == 38 ) {
              _self.highlightPreviousCountry();
              return true;
           }

           // enter
           if ( keyCode == 13 ) {
               _self.selectHighlightedCountry();
               return true;
           }

         });

         $(document).on('click.currency', function(e) {
            _self.toggleDropdown(e); 
         });

      },

      disableDropdownEvents: function(){

         $(document).off('keyup.currency');
         $(document).off('click.currency');

      },

      countrySelected: function( view ){

         this.selectedCurrency = view.model.get('country_code');
         this.ui.selectedCountry.text( view.model.get('country') );

         // Hide the dropdown
         this.toggleDropdown();

         // Convert existing form values, if any
         this.convertToBitcoin();

         // Allow user input
         this.ui.currencyInput.prop('disabled',false);
         this.ui.bitcoinInput.prop('disabled', false);

         // reset the dropdown selection
         this.viewCountrySelection.selectedCountry = false;

         if ( this.highlightedCountry ) {
            this.highlightedCountry.$el.removeClass('highlight');
            this.highlightedCountry = false;
         }

      },

      /* 
       * Populates rates collection, which
       * is used to display the currency 
       * drop down menu
       *
       * iterates over the data in this.rates and 
       * this.currencies to populate rates
       * collection
       *-------------------------------------*/
      populateCurrencyList: function(){

         this.ratesCollection.reset();

         for( var code in this.rates ) {

            this.ratesCollection.add({
               'country': this.currencies[code] || '',
               'rate': this.rates[code], 
               'country_code': code,
            });
         }

         this.ratesDisplay.set( this.ratesCollection.filter() );
      },

      initializing: false,

      /* 
       * Called to fetch data currency and 
       * rate data from API
       *
       * Once called the ratesCollection will
       * be updated 
       *-------------------------------------*/
      initializeData: function() {

         if ( this.initializing ) return;

         this.initializing = true;

         var _self = this;

         $.when( this.fetchCurrencies(), this.fetchRates() ).then( function( currencies, rates ){

            if ( currencies !== true && _.isArray( currencies ) ) {
               _self.currencies = currencies[0];
            }

            if ( rates !== true && _.isArray( rates ) ) {
               _self.rates = rates[0].rates;
            }

            _self.populateCurrencyList();
            _self.getBaseCurrencyBitcoinRate();
            _self.ui.countryDropDown.append( _self.viewCountrySelection.el );

         });

      },

      fetchCurrencies: function(){

         if ( this.currencies ) return true;

         return $.ajax({ url: this.endpoints.currencies });

      },

      fetchRates: function(){

         if ( this.rates ) return true;

         return $.ajax({ url: this.endpoints.rates });

      },

   });

});
