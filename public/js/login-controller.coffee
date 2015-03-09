app= angular.module("MerlinChat")
app.controller("loginController",($scope,$rootScope)->

	$scope.loginFormData ={

		username:"",
		password:""
	}

	$scope.fromError=false
	$scope.buttonDisable=false
	$scope.buttonLoading=false
	$scope.getClass=(element)->

		if !$scope.formError
			if element.$pristine
				return '';

		if element.$invalid
			return 'has-error'

		if element.$valid
			return 'has-success'
		else
			return ''

	$scope.login=(form)->
		a=10
		if form.$valid
			$scope.formError=false
			$scope.buttonDisable=true
			$scope.buttonLoading=true
			$rootScope.$broadcast("statusChange",{status:"Initiating jid:" + $scope.loginFormData.username})
			xmpp.connect($scope.loginFormData.username,$scope.loginFormData.password,(status)->
				if status == Strophe.Status.CONNECTING
					$rootScope.$broadcast("statusChange", {status:"Connecting"})

				if status==Strophe.Status.AUTHENTICATING
					$rootScope.$broadcast("statusChange", {status:"Authenticating"})

				if status==Strophe.Status.CONNECTED
					$rootScope.$broadcast( "statusChange", {
						status:"Connected"
					})
					$rootScope.$broadcast("loginSuccess", { username:$scope.loginFormData.username})

				if status==Strophe.Status.DISCONNECTED
					$rootScope.$broadcast("statusChange", {status:"Disconnected"})
					$rootScope.$broadcast("logout", { })
				return
			)
		else
			$scope.formError= true
		return
	return
)

