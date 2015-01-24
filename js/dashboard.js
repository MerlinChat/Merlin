var app=angular.module("XmppDebugger")
app.controller("dashboardController",function($scope,$rootScope){

	//Dashboard


	$scope.logout=function(){

		xmpp.disconnect()
	}

	$scope.$on("streamIncoming",function (event,body){

		$scope.show_traffic(body.body,'out')

	})
	$scope.$on("streamOutgoing",function (event,body){

		$scope.show_traffic(body.body,'out')

	})

	xmpp.conn.xmlInput=function(body){

		$rootScope.$broadcast("streamIncoming", {body:body})
	}
	xmpp.conn.xmlOutput=function(body){

		$rootScope.$broadcast("streamOutgoing", {body:body})
	}


	xmpp.registerHandler('presence',function (presence){
		$rootScope.$broadcast('rosterUpdate',{})
	})

	xmpp.setupHandlers()
	xmpp.presence()
	
	$scope.consoleLogs=[]
	
	$scope.show_traffic=function (body,type) {

		$scope.consoleLogs.push({body:Strophe.serialize(body),type:type})
		$scope.$apply()	
	}

	$scope.streamInput=''

	$scope.sendStream=function(){

		var text=$scope.streamInput
		
		if(text.length>0) {
			
			xmpp.sendFromText(text)
		}

	}
	$scope.roster=xmpp.getDefaultRoster()

	$scope.getRoster=function(){

		return $scope.roster;
	}
	$scope.$on("rosterUpdate",function (event,body){

		$scope.roster=xmpp.getDefaultRoster()
		$scope.apply()

	})

})