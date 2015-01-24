var app=angular.module("XmppDebugger",['ngRoute'])
.config(function ($routeProvider) {

	$routeProvider.when('/',{

		templateUrl:'views/login.html',
		controller:'loginController'
	})

	$routeProvider.when('/dashboard',{

		templateUrl:'views/dashboard.html',
		controller:'dashboardController'

	})
	$routeProvider.otherwise({

		redirectTo:'/'
	})
})

app.controller("mainController",function($scope,$rootScope){

	//Wait
	var loginStatus=false
	if(!loginStatus){

		window.location.href='#/'
	}
	$scope.$on("loginSuccess",function (event,args) {

		$scope.username=args.username
		loginStatus=true

		window.location.href='#/dashboard'

	})

	$scope.$on("logout",function (event,args) {

		$scope.username=null
		loginStatus=false
		window.location.href='#/'

	})
	$scope.$on("statusChange",function (event,args){

		console.log(args.status)
	})


})