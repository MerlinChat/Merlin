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
				if(!(xmpp.roster[contact.jid])) {
					xmpp.roster[contact.jid]=contact
				}
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