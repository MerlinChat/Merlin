var app=angular.module("XmppDebugger")

app.filter("contactList",function(){

    return function(contacts) {
    	var contactList={}
    	for(var key in contacts) {

    		if(contacts[key].status!='offline') {

    			contactList[key]=contacts[key]
    		}
    	}
    	return contactList
    }
})
app.filter("name",function(){
	var maxsize=13
    return function(name) {
    	if(name.length>maxsize) {

    		name=name.substr(0,maxsize-1)
    		name=name+'..'

    	}
    	return name
    }
})



app.controller("dashboardController",function($scope,$rootScope){

	//Dashboard Controller

	var maxHeight=window.innerHeight
	var calculatedHeight=120+50+angular.element('.text-box-container').height()

	angular.element('.sidebar .scroller').css('height',(maxHeight-62)+'px')

	angular.element('.box .scroller').css('height',(maxHeight-calculatedHeight)+'px')
	$scope.logout=function(){

		xmpp.disconnect()
	}
	$scope.streamInput=""
	angular.element('textarea#streamInput').bind('change',function(){
	
		$scope.forceAdjust()
	})

	angular.element('textarea#streamInput').bind('keydown',function(){
	
		$scope.forceAdjust()
	})

	angular.element('textarea#streamInput').bind('keyup',function(){
		$scope.forceAdjust()
	})
	$scope.forceAdjust=function(){



		var calculatedHeight=120+50+angular.element('.text-box-container').height()
		if(maxHeight-calculatedHeight > 100) {
			angular.element('.box .scroller').css('height',(maxHeight-calculatedHeight)+'px')
		}
	}
	$scope.$watch("streamInput", function(newValue, oldValue) {
		
		$scope.forceAdjust()
 	})


})


app.controller("consoleController",function($scope,$rootScope){

	//Console Controller

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





}) 


app.controller("rosterController",function($scope,$rootScope){

	//Roster Controller

	xmpp.registerHandler('presence',function (presence){

		
		$rootScope.$broadcast('rosterUpdate',{})
		xmpp.fetchPics()

	})
	xmpp.registerHandler('roster',function (iq){

		
		$rootScope.$broadcast('rosterUpdate',{})
		xmpp.presence()
		
	})

	xmpp.registerHandler('vcard',function (iq){
		$rootScope.$broadcast('rosterUpdate',{})
	})

	
	xmpp.setupHandlers()
	
	xmpp.fetchRoster()
	
	
	
	$scope.roster=xmpp.getDefaultRoster()

	$scope.getRoster=function(){

		return $scope.roster;
	}
	$scope.getStatusIcon=function(jid){
		
		var classIcon="fa "
		if($scope.roster[jid]) {

			if($scope.roster[jid].status=="online") {
				classIcon +=' online fa-circle'

			}
			else if($scope.roster[jid].status=="away") {
				classIcon +=' away fa-arrow-circle-right'

			}
			else if($scope.roster[jid].status=="offline") {
				classIcon +=' offline fa-times-circle'

			}
			else if($scope.roster[jid].status=="dnd") {
				classIcon +='dnd fa-minus-circle'

			}
			else {
				classIcon +=$scope.roster[jid].status
			}
		}
		return classIcon
	}
	
	$scope.$on("rosterUpdate",function (event,body){

		$scope.roster=xmpp.getDefaultRoster()
		$scope.$apply()

	})

})
