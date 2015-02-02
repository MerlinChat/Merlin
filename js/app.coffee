app=angular.module("MerlinChat",['ngRoute','perfect_scrollbar','monospaced.elastic']).config(($routeProvider)->

	$routeProvider.when('/',{templateUrl:'views/login.html',controller:'loginController'})
	$routeProvider.when('/dashboard',{templateUrl:'views/dashboard.html',controller:'dashboardController'})
	$routeProvider.otherwise({redirectTo:'/'})
	return
)
app.controller("mainController",($scope,$rootScope)->

	loginStatus=false
	if !loginStatus
		window.location.href= '#/'
	$scope.$on("loginSuccess",(event,args)->
		$scope.username=args.username
		loginStatus=true
		window.location.href= '#/dashboard'
		return
	)

	$scope.$on("logout",(event,args)->
		$scope.username=null
		loginStatus=false
		window.location.href= '#/'
		return

	)
	$scope.$on("statusChange",(event,args)->

		console.log(args.status)
		return
	)
	return
)
