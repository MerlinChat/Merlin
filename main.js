var xmpp={

	conn:null,
	connect:function (jid,password,changeHandler){


		xmpp.conn=new Strophe.Connection("http://rohit.com:5280/http-bind");
		xmpp.conn.connect(jid,password,changeHandler)
	},
	disconnect:function(){

		xmpp.conn.disconnect()
	},
	presence:function(toUid){

		if(to) {

			var pres=$pres({to:toUid})
		}
		else {

			var pres=$pres()
		}

		xmpp.send(pres)

	},

	send:function(stanza) {

		xmpp.conn.send(stanza)

	},

}



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

})

app.controller("loginController",function($scope,$rootScope){

	//Wait
	$scope.loginFormData ={

		username:"",
		password:""
	}

	$scope.fromError=false;
	$scope.buttonDisable=false;
	$scope.buttonLoading=false;

	$scope.getClass=function (element) {

		if(!$scope.formError) {
			if(element.$pristine) return '';
		}
		if(element.$invalid) return 'has-error';
		else if(element.$valid) return 'has-success';
		else return '';
	}

	$scope.login=function(form) {

		if(form.$valid) {

			$scope.formError=false;
			$scope.buttonDisable=true;
			$scope.buttonLoading=true;
			$rootScope.$broadcast("statusChange", {status:"Initiating jid:"+ $scope.loginFormData.username})
			xmpp.connect($scope.loginFormData.username,$scope.loginFormData.password,function(status){
				
				if(status==Strophe.Status.CONNECTING) {

					$rootScope.$broadcast("statusChange", {status:"Connecting"})
				}

				if(status==Strophe.Status.AUTHENTICATING) {

					$rootScope.$broadcast("statusChange", {status:"Authenticating"})

				}

				if(status==Strophe.Status.CONNECTED) {

					$rootScope.$broadcast("statusChange", {status:"Connected"})
					$rootScope.$broadcast("loginSuccess", { username:$scope.loginFormData.username})


				}

				if(status==Strophe.Status.DISCONNECTED) {

					$rootScope.$broadcast("statusChange", {status:"Disconnected"})
					$rootScope.$broadcast("logout", { })
					
				}
				
				

			})

			
		}
		else {
			$scope.formError=true;
		}
	}

})



app.controller("dashboardController",function($scope){

	//Dashboard
	$scope.logout=function(){

		xmpp.disconnect()
	}
})

app.controller("logController",function($scope) {
	
	$scope.logs=[]

	$scope.$on("statusChange",function (event,args){

		$scope.logs.push(args.status)
	})

})