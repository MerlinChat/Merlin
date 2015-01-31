function Xmpp() {

	var _xmpp=this

	//Strophe Connection Object
	this.conn=null 

	//User Jid
	this.jid='' 
	
	this.fullName=''

	//Roster 

	this.roster={}
	/*


	*/

	//Messages

	this.messages={}

	//Custom Handlers
	this.customHandlers={},

	//Configuration

	this.config={

		defaultPhoto:'views/default-propic.png'
	}

	this.photo=this.config.defaultPhoto

	this.connect=function (jid,password,changeHandler){


		this.conn=new Strophe.Connection("http://bosh.metajack.im:5280/xmpp-httpbind");
		this.conn.connect(jid,password,changeHandler)
		this.jid=jid
	}


	this.disconnect=function(){

		this.conn.disconnect()
		this.roster={}

	}


	this.send=function(stanza) {

		this.conn.send(stanza)

	}

	this.textToXml=function(text) {

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
	}



	this.sendFromText=function(text){
		
		text=this.textToXml(text)
		if(text) {
			
			this.send(text)
		}
	}
	

	this.sendIQ=function(iq,handler) {
	
		this.conn.sendIQ(iq,handler)
	}

	this.sendMessage=function(jid,body) {

		this.send($msg({to: jid,type: 'chat'}).c('body').t(body))
		
		
		if(!this.messages[jid]) {
			this.messages[jid]=[]
		}

		this.messages[jid].push({
			from:this.jid,
			msg:body,
			sent:true,
			status:'read'	
		})

	}




	this.presence=function(toUid){

		if(toUid) {

			var pres=$pres({to:toUid})
		}
		else {

			var pres=$pres()
		}

		this.send(pres)

	}









	this.addContact=function(contactData,overwrite) {

		


		if(contactData.jid) {

			jid=contactData.jid
		}



		//Check if Contact Already Exists

		if(this.roster[jid]) {

			if(!overwrite) {
				this.updateContact(contactData)
				return
			} 
		}
		
		
		//Check if self

		if(this.jid==jid) {

			return
		}

		//Start Contact with all default values
		var contact={

			jid:jid,
			name:jid,
			nickName:jid,
			photoStatus:false,
			photo:this.config.defaultPhoto,
			photoHash:'',
			status:'offline',
			unreadCount:0,
			unreadStatus:false

		}



		if(contactData.name) {

			contact.name=contactData.name
		}
		if(contactData.nickName) {

			contact.nickName=contactData.nickName
		}
		if(contactData.nickName) {

			contact.nickName=contactData.nickName
		}
		if(contactData.photoStatus) {

			contact.photoStatus=contactData.photoStatus
		}
		if(contactData.photo) {

			contact.photo=contactData.photo
		}
		if(contactData.photoHash) {

			contact.photoHash=contactData.photoHash
		}

	

		this.roster[jid]=contact
		

	}

	this.updateContact=function(contactData,contactJid) {


		if(contactData.jid) {

			jid=contactData.jid
		}

		else if(contactJid) {

			contactData.jid=contactJid
			jid=contactJid
		}


		//Check if Contact Already Exists

		if(!(this.roster[jid])) {

			this.addContact(contactData)
			return
		}
		
		//Start Contact with all default values

		var contact=this.roster[jid]

		if(contactData.name) {

			contact.name=contactData.name
		}
		if(contactData.status) {

			contact.status=contactData.status
		}

		if(contactData.nickName) {

			contact.nickName=contactData.nickName
		}
		if(contactData.nickName) {

			contact.nickName=contactData.nickName
		}
		if(contactData.photoStatus) {

			contact.photoStatus=contactData.photoStatus
		}
		if(contactData.photo) {

			contact.photo=contactData.photo
		}
		if(contactData.photoHash) {

			contact.photoHash=contactData.photoHash
		}
		
		this.roster[jid]=contact
	}




	this.defaultHandlers = {

		roster:function(iq) {

			//Default Roster Handler. 
			//This  is not registered using addHandler but used dynamically for sendIQ

	
			
			$(iq).find('item').each(function(){
				
				var contact={}
				contact.jid=$(this).attr('jid')
				contact.name=$(this).attr('name') || contact.jid
				contact.jid=Strophe.getBareJidFromJid(contact.jid)
			
				_xmpp.addContact(contact)
			
			

			})

		},


		vcard:function(iq) {

			var jid=$(iq).attr('from')

			jid=Strophe.getBareJidFromJid(jid)

			if($(iq).find('vCard').find('PHOTO')) {

				var photo=$(iq).find('vCard').find('PHOTO').find('BINVAL').text()

				_xmpp.updateContact({photo:'data:image/png;base64,'+photo,photoStatus:true},jid)

			}
			if(jid==_xmpp.jid) {

				if($(iq).find('vCard').find('PHOTO')) {

					var photo=$(iq).find('vCard').find('PHOTO').find('BINVAL').text()

					_xmpp.photo='data:image/png;base64,'+photo
				}
				if($(iq).find('vCard').find('FN')) {

					var fn=$(iq).find('vCard').find('FN').text()

					_xmpp.fullName=fn
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
				if(jid!=_xmpp.jid) {

					_xmpp.updateContact({status:status},jid)
				
				}

				
				
				if($(presence).find('x').find('photo')) {
						
					var photo=$(presence).find('x').find('photo')
					
					if(photo.length>0) {

						photo=photo.text()
						if(photo.length>0) {

							
							photoOld=''
							if(_xmpp.roster[jid].photoHash) {

								photoOld=_xmpp.roster[jid].photoHash
							}

							if(photo!==photoOld) {

								_xmpp.fetchVcard(jid)

								_xmpp.roster[jid].photoHash=photo
							}

						}
					}
				}	
			}
			
		
		},

		message:function(message){

			
			var jid=$(message).attr('from')

			jid=Strophe.getBareJidFromJid(jid)

			var sentStatus=false
			
			if(jid==_xmpp.jid) {

				sentStatus=true
				var jid=$(message).attr('to')
				jid=Strophe.getBareJidFromJid(jid)
			}

	

			var body = $(message).find('html > body')


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
		

			if(!_xmpp.messages[jid]) {

				_xmpp.messages[jid]=[]
			}
			
			if(body) {

		
				_xmpp.messages[jid].push({

					from:jid,
					msg:body,
					sent:sentStatus,
					status:'unread'	
				})

				if(!_xmpp.roster[jid]) {
					_xmpp.addContact({jid:jid})
				
				}
				_xmpp.roster[jid].unreadStatus=true
				_xmpp.roster[jid].unreadCount++

			}
		

		
		},

		iq:function(){

			//Do Nothing
			//not is use currently
		}

	}


	this.setupHandlers=function(){
		
		//Presence

		var presenceHandler=function(presence){

			if(_xmpp.customHandlers.presence){

				if(!(_xmpp.customHandlers.presence.override)){

					_xmpp.defaultHandlers.presence(presence)
				}
				_xmpp.customHandlers.presence.handler(presence)
			}
			else {
				_xmpp.defaultHandlers.presence(presence)
			}
			return true
		}

		this.conn.addHandler(presenceHandler,null,'presence')
		

		//IQ

		/* Nothing here Yet */



		//Message

		var  messageHandler=function(message){
			
			

			if(_xmpp.customHandlers.message){

				if(!(_xmpp.customHandlers.message.override)){

					_xmpp.defaultHandlers.message(message)
				}
				_xmpp.customHandlers.message.handler(message)
			}
			else {
				_xmpp.defaultHandlers.message(message)
			}
			

			return true
		}

		this.conn.addHandler(messageHandler,null,'message','chat')


	}





	this.fetchRoster = function(){

		var  handler=function(iq) {
			
			if(_xmpp.customHandlers.roster){

				if(!(_xmpp.customHandlers.roster.override)){

					_xmpp.defaultHandlers.roster(iq)
				}
				_xmpp.customHandlers.roster.handler(iq)
			}
			else {
				_xmpp.defaultHandlers.roster(iq)
			}
			

			return true
		}


		var iq=$iq({type:'get'}).c('query',{xmlns:'jabber:iq:roster'})
		this.sendIQ(iq,handler)

	}

	this.fetchVcard=function(to){
		
		

		if(!(this.customHandlers.vcard)) {
			
			handler=this.defaultHandlers.vcard
		}
		else if(this.customHandlers.vcard.override) {
		
			handler=function(iq){

				_xmpp.customHandlers.vcard.handler(iq)

			}

		}

		else {
			
			handler=function(iq){

				_xmpp.defaultHandlers.vcard(iq)
				_xmpp.customHandlers.vcard.handler(iq)
			}
		}
		var iq=$iq({type:'get',to:to}).c('vCard',{xmlns:'vcard-temp'})
		this.sendIQ(iq,handler)
	}

	this.fetchSelfVcard=function() {
	
		this.fetchVcard(_xmpp.jid)
	}



	



	this.fetchPics=function(){
		
		for(var key in this.roster){
			if(this.roster[key].status!='offline' && (this.roster[key].photoStatus==false)) {
				this.fetchVcard(this.roster[key].jid)
			}

		}
	}








	//RegisteCustomHandler

	this.registerHandler=function(type,handler,override){

		if(!(override)) {
			override=false
		}
		this.customHandlers[type]={

			handler:handler,
			override:override
		}
	}



	//Return System maintained Roster

	this.getDefaultRoster=function(){

		return this.roster
	}
	



}

var xmpp=new Xmpp()
/*
xmpp.connect("rohitgeekman@jabber.hot-chilli.net","joannerowling",function(status){
	
	if(status==Strophe.Status.CONNECTING) {


	}

	if(status==Strophe.Status.AUTHENTICATING) {



	}

	if(status==Strophe.Status.CONNECTED) {

		xmpp.fetchRoster()
	}

	if(status==Strophe.Status.DISCONNECTED) {


		
	}
	

})


*/