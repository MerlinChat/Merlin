var app=angular.module("XmppDebugger")
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
					xmpp.fetchRoster()


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
