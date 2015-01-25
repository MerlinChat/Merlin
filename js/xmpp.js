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

	fetchRoster : function(){

	
		console.log("Fetching Roster")

		if(!(xmpp.customHandlers.roster)) {

			handler=function(iq){
				
				xmpp.defaultHandlers.roster(iq)

			}
		}
		else if(xmpp.customHandlers.roster.override) {
			
			handler=function(iq){

				xmpp.customHandlers.roster.handler(iq)

			}

		}

		else {
		
			handler=function(iq){

				xmpp.defaultHandlers.roster(iq)
				xmpp.customHandlers.roster.handler(iq)
			}
		}
		var iq=$iq({type:'get'}).c('query',{xmlns:'jabber:iq:roster'})
		xmpp.sendIQ(iq,handler)

	},

	fetchVcard:function(to){
		
		

		if(!(xmpp.customHandlers.vcard)) {
			
			handler=xmpp.defaultHandlers.vcard
		}
		else if(xmpp.customHandlers.vcard.override) {
			console.log("override for vcard")
			handler=function(iq){

				xmpp.customHandlers.vcard.handler(iq)

			}

		}

		else {
			
			handler=function(iq){

				xmpp.defaultHandlers.vcard(iq)
				xmpp.customHandlers.vcard.handler(iq)
			}
		}
		var iq=$iq({type:'get',to:to}).c('vCard',{xmlns:'vcard-temp'})
		xmpp.sendIQ(iq,handler)
	},

	fetchPics:function(){
		
		for(var key in xmpp.roster){
			if(xmpp.roster[key].status!='offline') {
				xmpp.fetchVcard(xmpp.roster[key].jid)
			}

		}
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
			return true
		}

		xmpp.conn.addHandler(presenceHandler,null,'presence')
		

		//IQ




		//Message
	},

	defaultHandlers:{

		roster:function(iq) {

			//Default Roster Handler. 
			//This roster is not registered using addHandler but used dynamically for sendIQ
		
			$(iq).find('item').each(function(){
				var contact={}
				contact.jid=$(this).attr('jid')
				contact.name=$(this).attr('name') || contact.jid
				contact.jid=Strophe.getBareJidFromJid(contact.jid)
				contact.status='offline'
				if(!(xmpp.roster[contact.jid])) {
					xmpp.roster[contact.jid]=contact
					xmpp.roster[contact.jid].photo='views/default-propic.png'
					xmpp.roster[contact.jid].photoStatus=true
				}
			})
		},

		vcard: function(iq) {
			var jid=$(iq).attr('from')
			jid=Strophe.getBareJidFromJid(jid)
			if($(iq).find('vCard').find('PHOTO')) {
				var photo=$(iq).find('vCard').find('PHOTO').find('BINVAL').text()

				if(xmpp.roster[jid] ) {
				
					xmpp.roster[jid].photo='data:image/png;base64,'+photo
				}
			}
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
						status='online'
						if($(presence).find('show')) {
							var show=$(presence).find('show').text()
							if(show==''||show=='chat'){

								status='online'
							} 
							else if(show=='away') {

								status='away'
							}
							else if(show=='dnd') {

								status='dnd'
							}
							else {

								status=show
							}
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