var xmpp={

	conn:null,
	jid:'',
	connect:function (jid,password,changeHandler){


		xmpp.conn=new Strophe.Connection("http://rohit.com:5280/http-bind");
		xmpp.conn.connect(jid,password,changeHandler)
		xmpp.jid=jid
	},
	disconnect:function(){

		xmpp.conn.disconnect()
		xmpp.roster={}

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
			if(xmpp.roster[key].status!='offline' && (xmpp.roster[key].photoStatus==false)) {
				xmpp.fetchVcard(xmpp.roster[key].jid)
			}

		}
	},
	
	sendIQ:function(iq,handler) {
	
		xmpp.conn.sendIQ(iq,handler)
	},

	sendMessage:function(jid,body) {

		xmpp.send($msg({to: jid,type: 'chat'}).c('body').t(body))
		console.log("msg sent")
		
		if(!xmpp.messages[jid]) {
			xmpp.messages[jid]=[]
		}

		xmpp.messages[jid].push({
			from:xmpp.jid,
			msg:body,
			sent:true,
			status:'read'	
		})

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

		var  messageHandler=function(message){
			
			if(xmpp.customHandlers.message){

				if(!(xmpp.customHandlers.message.override)){

					xmpp.defaultHandlers.message(message)
				}
				xmpp.customHandlers.message.handler(message)
			}
			else {
				xmpp.defaultHandlers.message(message)
			}
			

			return true
		}

		xmpp.conn.addHandler(messageHandler,null,'message','chat')


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
					xmpp.roster[contact.jid].photoStatus=false
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
				
					if($(presence).find('x').find('photo')) {
						
						var photo=$(presence).find('x').find('photo')
						
						if(photo.length>0) {

							photo=photo.text()
							if(photo.length>0) {

								
								photoOld=''
								if(xmpp.roster[jid].photoHash) {

									photoOld=xmpp.roster[jid].photoHash
								}
								if(photo!==photoOld) {
									console.log('Load photo for '+xmpp.roster[jid].name)
									xmpp.fetchVcard(jid)
									xmpp.roster[jid].photoHash=photo
								}

							}
						}
					}


				}
			}
		},
		message:function(message){


			console.log(message)
			//updates the default message cache
			var jid=$(message).attr('from')
			jid=Strophe.getBareJidFromJid(jid)
			var sentStatus=false

			if(jid==xmpp.jid) {

				sentStatus=true
				var jid=$(message).attr('to')
				jid=Strophe.getBareJidFromJid(jid)
			}

			console.log(jid)

			var body = $(message).find('html > body')
			console.log(body)
			if(body.length===0) {
			
				body = $(message).find('body')
				if (body.length > 0) {
					body = body.text()
				} 
				else {
					body = null
				}
			} 
			else {
			
				body=body.contents()
			}
			
			if(!xmpp.messages[jid]) {
				xmpp.messages[jid]=[]
			}

			if(body.length>0) {

				xmpp.messages[jid].push({

					from:jid,
					msg:body,
					sent:sentStatus,
					status:'unread'	
				})

			}
			if(!xmpp.roster[jid]) {

				var contact={}
				contact.jid=jid
				contact.name=jid
				contact.jid=Strophe.getBareJidFromJid(contact.jid)
				contact.status='offline'

				xmpp.roster[jid]=contact
				xmpp.roster[jid].photo='views/default-propic.png'
				xmpp.roster[jid].photoStatus=false
				
			}

			xmpp.roster[jid].unreadStatus=true
			if(!(xmpp.roster[jid].unreadCount)) xmpp.roster[jid].unreadCount=0
			xmpp.roster[jid].unreadCount++
			console.log(xmpp.roster)
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
	messages:{}

}