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

		if(toUid) {

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

	textToXml:function(text) {

		if(window['DOMParser']) {

			var parser=new DOMParser()
			var doc=parser.parseFromString(text,'text/xml')
		}
		else if(window['ActiveXObject']) {

			doc.async = false;
			doc.loadXML(text);
			
		}
		var elem = doc.documentElement;
		if ($(elem).filter('parsererror').length > 0) {
			return null
		}
		return elem
	},

	sendFromText:function(text){
		
		text=xmpp.textToXml(text)
		if(text) {
			
			xmpp.send(text)
		}
	},

	fetchRoster:function(customHandler){

		if(!(customHandler)) {
			handler=xmpp.defaultHandlers.roster
		}
		else {

			handler=function(iq){

				xmpp.defaultHandlers.roster(iq)
				customHandler(iq)
			}
		}
		var iq=$iq({type:'get'}).c('query',{xmlns:'jabber:iq:roster'})
		xmpp.sendIQ(iq,handler)

	},
	
	sendIQ:function(iq,handler) {
	
		xmpp.conn.sendIQ(iq,handler)
	},

	setupHandlers:function(){
		
		//Presence

		var presenceHandler=function(presence){

			if(xmpp.customHandlers.presence){

				
				if(!(xmpp.customHandlers.presence.override)){

					xmpp.defaultHandlers.presence(presence)
				}
				xmpp.customHandlers.presence.handler(presence)
			}
			else {
				xmpp.defaultHandlers.presence(presence)
			}
		}

		xmpp.conn.addHandler(presenceHandler,null,'presence')
		

		//IQ




		//Message
	},

	defaultHandlers:{

		roster:function(iq) {

			//Default Roster Handler. 
			//This roster is not registered using addHandler but used dynamically for sendIQ

			console.log(iq)
			$(iq).find('item').each(function(){
				var contact={}
				contact.jid=$(this).attr('jid')
				contact.name=$(this).attr('name') || contact.jid
				contact.jid=Strophe.getBareJidFromJid(contact.jid)
				contact.presence='offline'
				xmpp.roster[contact.jid]=contact

			})
		},

		
		presence:function(presence){

			//Default Presence handler updates the presence of default roster only
			//Registerd using addHandler

			var type=$(presence).attr('type')
			var from=$(presence).attr('from')
			if(type!=='error') {
				var status='offline'
				var jid=Strophe.getBareJidFromJid(from)
				if(xmpp.roster[jid]) {

					if(type!=='unavailable') {

						var show=$(presence).find('show').text()
						if(show==''||show=='chat'){

							status='online'
						} 
						else {

							status='away'
						}

					}
					xmpp.roster[jid].status=status
				}
			}
		},

		iq:function(){

			//Do Nothing
			//not is use currently
		}

	},

	customHandlers:{},

	//RegisteCustomHandler

	registerHandler:function(type,handler,override){

		if(!(override)) {
			override=false
		}
		xmpp.customHandlers[type]={

			handler:handler,
			override:override
		}
	},



	//Return System maintained Roster

	getDefaultRoster:function(){

		return xmpp.roster
	},
	
	//System maintained roster, requires use od default handlers for proper update

	roster:{},

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
	$scope.$on("statusChange",function (event,args){

		console.log(args.status)
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


