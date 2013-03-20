angular.module('ccdaPlayground', ['smartBox'], function($routeProvider, $locationProvider){

  $routeProvider.when('', {
    templateUrl:'/static/ccdaPlayground/templates/paste-record.html',
		controller: 'MainController'
	});

  $locationProvider.html5Mode(false);

});
