var app=angular.module("XmppDebugger")

app.filter("contactList",function(){

    return function(contacts) {
    	var contactList={}
    	for(var key in contacts) {

    		if(contacts[key].status!='offline') {

    			contactList[key]=contacts[key]
    		}
    		else if(xmpp.messages[key]) {

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

	$scope.activeChat=false

	$scope.activeJid=""

	var maxHeight=window.innerHeight
	var calculatedHeight=120+80+angular.element('.text-box-container').height()

	angular.element('.sidebar .scroller').css('height',(maxHeight-57)+'px')

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



		var calculatedHeight=120+80+angular.element('.text-box-container').height()
		if(maxHeight-calculatedHeight > 100) {
			angular.element('.box .scroller').css('height',(maxHeight-calculatedHeight)+'px')
		}
	}
	$scope.$watch("streamInput", function(newValue, oldValue) {
		
		$scope.forceAdjust()
 	})

 	$scope.selectBuddy=function(jid){

 		$scope.activeChat=true
 		$scope.activeJid=jid

 	}


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
		

	})
	xmpp.registerHandler('roster',function (iq){

		
		$rootScope.$broadcast('rosterUpdate',{})
		xmpp.presence()
		
	})
	xmpp.registerHandler('message',function (message){

		
		$rootScope.$broadcast('newMessage',{message:message})

		
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
	$scope.$on("newMessage",function (event,body){
		
		$scope.roster=xmpp.getDefaultRoster()
		$scope.$apply()

	})


})


app.controller("chatController",function($scope,$rootScope){

	$scope.getName=function(jid) {


		var roster=xmpp.getDefaultRoster()
		if(roster[jid]) {

			return roster[jid].name
		}
		else return jid
	}

	$scope.getPhoto= function(jid) {

		var roster=xmpp.getDefaultRoster()
		if(roster[jid]) {

			return roster[jid].photo
		}
		else return 'views/default-propic.png'

	}

	$scope.getMessages=function(jid) {


	}

	$scope.sendMessage=function(jid,message) {


	}
	$scope.$on("newMessage",function (event,body){
	
		$scope.$apply()

		$(".box-container .scroller").scrollTop($('.box-container .box-content').height());
		$(".box-container .scroller").perfectScrollbar('update');

	})

	$scope.messages=[]

	$scope.fetchMessages=function(jid){

	
		if(xmpp.messages[jid]) {

			$scope.messages=xmpp.messages[jid]

		}
		else{

			$scope.messages=[]
		}
		return $scope.messages
	}

	$scope.renderNameLeft=function(message) {

		var name=$scope.getName(message.from)
		if(message.sent) {

			return name
		}
		return ''


	}

	$scope.renderNameRight=function(message) {

		var name=$scope.getName(message.from)
		if(!message.sent) {

			return name
		}
		return ''
	}

	$scope.streamInput=''
	$scope.sendMessage=function(jid) {

		var body=$scope.streamInput
		xmpp.sendMessage(jid,body)
		$scope.streamInput=''

	}

	$scope.getClass=function(message) {

		if(message.sent) {

			return "message message-right"
		}
		return "message message-left"


	}




})
