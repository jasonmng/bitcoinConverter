'use strict';

define(['backbone','marionette'], function(Backbone){

   var App = new Backbone.Marionette.Application();

   App.on('initialize:after', function () { Backbone.history.start(); });

   return App;

});
