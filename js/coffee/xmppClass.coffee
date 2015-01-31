class Xmpp
    constructor:->
        _xmpp=this
        @conn=null
        @jid=''
        @fullName=''
        @roster={}
        @messages={}
        @customHandlers={}
        @config={ defaultPhoto:'views/default-propic.png',boshService:"http://bosh.metajack.im:5280/xmpp-httpbind"}
        @photo=@config.defaultPhoto
        @defaultHandlers = {
            roster: (iq,_xmpp)->
                ###
                Default Roster Handler.
                This  is not registered using addHandler but used dynamically for sendIQ
                ###
                $(iq).find('item').each ->
                    contact={}
                    contact.jid=$(this).attr('jid')
                    contact.name=$(this).attr('name') || contact.jid
                    contact.jid=Strophe.getBareJidFromJid(contact.jid)
                    _xmpp.addContact(contact)
                    return true
                return true
            ,


            vcard:(iq,_xmpp)->

                jid=$(iq).attr('from')

                jid=Strophe.getBareJidFromJid(jid)

                if $(iq).find('vCard').find('PHOTO')

                    photo=$(iq).find('vCard').find('PHOTO').find('BINVAL').text()

                    _xmpp.updateContact({photo:'data:image/png;base64,'+photo,photoStatus:true},jid)


                if jid==_xmpp.jid

                    if $(iq).find('vCard').find('PHOTO')

                        photo=$(iq).find('vCard').find('PHOTO').find('BINVAL').text()

                        _xmpp.photo='data:image/png;base64,'+photo

                    if $(iq).find('vCard').find('FN')

                        fn=$(iq).find('vCard').find('FN').text()

                        _xmpp.fullName=fn





                true
            ,

            presence: (presence,_xmpp)->

                #Default Presence handler updates the presence of default roster only
                #Registerd using addHandler

                type=$(presence).attr('type')
                from=$(presence).attr('from')

                if type!='error'
                    status='offline'

                    jid=Strophe.getBareJidFromJid(from)
                    if type!='unavailable'

                        status='online'

                        if $(presence).find('show')
                            show=$(presence).find('show').text()
                            if show==''||show=='chat'

                                status='online'

                            else if show=='away'

                                status='away'

                            else if show=='dnd'

                                status='dnd'

                            else

                                status=show


                    if jid!=_xmpp.jid

                        _xmpp.updateContact({status:status},jid)



                    if $(presence).find('x').find('photo')

                        photo=$(presence).find('x').find('photo')

                        if photo.length>0

                            photo=photo.text()
                            if photo.length>0


                                photoOld=''
                                if _xmpp.roster[jid].photoHash

                                    photoOld=_xmpp.roster[jid].photoHash


                                if photo !=photoOld

                                    _xmpp.fetchVcard(jid)

                                    _xmpp.roster[jid].photoHash=photo
                true
            ,

            message:(message,_xmpp)->


                jid=$(message).attr('from')

                jid=Strophe.getBareJidFromJid(jid)

                sentStatus=false

                if jid==_xmpp.jid

                    sentStatus=true
                    jid=$(message).attr('to')
                    jid=Strophe.getBareJidFromJid(jid)




                body = $(message).find('html > body')


                if body.length==0

                    body = $(message).find('body')

                    if  body.length > 0
                        body = body.text()

                    else
                        body = null


                else

                    body=body.contents()



                if !_xmpp.messages[jid]

                    _xmpp.messages[jid]=[]


                if body


                    _xmpp.messages[jid].push({

                        from:jid,
                        msg:body,
                        sent:sentStatus,
                        status:'unread'
                    })

                    if !_xmpp.roster[jid]
                        _xmpp.addContact({jid:jid})


                    _xmpp.roster[jid].unreadStatus=true
                    _xmpp.roster[jid].unreadCount++

                true


        }


    connect:(jid,password,changeHandler)->
        @conn=new Strophe.Connection @config.boshService
        @conn.connect jid,password,changeHandler
        @jid=jid
        @

    disconnect:->
        @conn.disconnect()
        @conn=null
        @jid=''
        @fullName=''
        @roster={}
        @messages={}
        @customHandlers={}
        @

    send:(stanza)->
        @conn.send(stanza)
        @

    textToXml:(text)->

        if window['DOMParser']

            parser=new DOMParser()
            doc=parser.parseFromString(text,'text/xml')

        else if(window['ActiveXObject'])

            doc.async = false;
            doc.loadXML text;

        else
            output=null

        elem = doc.documentElement;
        if $(elem).filter('parsererror').length > 0

            output=null
        else
            output=elem
        output


    sendFromText: (text)->

        text=@textToXml(text)
        if text

            @send(text)

        @

    sendIQ:(iq,handler)->

        @conn.sendIQ(iq,handler)
        @

    sendMessage:(jid,body)->

        @send($msg({to: jid,type: 'chat'}).c('body').t(body))
        if !@messages[jid]
            @messages[jid]=[]
        @messages[jid].push({from:@jid, msg:body, sent:true, status:'read'})
        @

    presence:(toUid)->

        if toUid
            pres=$pres({to:toUid})
        else
            pres=$pres()
        @send(pres)
        @

    addContact : (contactData,overwrite)->




        if contactData.jid

            jid=contactData.jid




        #Check if Contact Already Exists

        if @roster[jid]

            if !overwrite
                @updateContact(contactData)
                return true



        if @jid==jid

            return true


        #Start Contact with all default values

        contact={

            jid:jid,
            name:jid,
            nickName:jid,
            photoStatus:false,
            photo:@config.defaultPhoto,
            photoHash:'',
            status:'offline',
            unreadCount:0,
            unreadStatus:false

        }



        if contactData.name

            contact.name=contactData.name

        if contactData.nickName

            contact.nickName=contactData.nickName

        if contactData.nickName

            contact.nickName=contactData.nickName

        if contactData.photoStatus

            contact.photoStatus=contactData.photoStatus

        if contactData.photo

            contact.photo=contactData.photo

        if contactData.photoHash

            contact.photoHash=contactData.photoHash




        @roster[jid]=contact
        @











    updateContact: (contactData,contactJid)->


        if contactData.jid

            jid=contactData.jid


        else if contactJid

            contactData.jid=contactJid
            jid=contactJid



        #Check if Contact Already Exists

        if !@roster[jid]

            @addContact(contactData)
            return true


        #Start Contact with all default values

        contact=@roster[jid]

        if contactData.name

            contact.name=contactData.name

        if contactData.status

            contact.status=contactData.status

        if contactData.nickName

            contact.nickName=contactData.nickName

        if contactData.nickName

            contact.nickName=contactData.nickName

        if contactData.photoStatus

            contact.photoStatus=contactData.photoStatus

        if contactData.photo

            contact.photo=contactData.photo

        if contactData.photoHash

            contact.photoHash=contactData.photoHash


        @roster[jid]=contact
        @

    #setuphandlers

    setupHandlers:->

        #Establis Alias
        _xmpp=this
        #Presence
        presenceHandler=(presence)->

            if _xmpp.customHandlers.presence

                if !_xmpp.customHandlers.presence.override

                    _xmpp.defaultHandlers.presence(presence,_xmpp)

                _xmpp.customHandlers.presence.handler(presence)

            else
                _xmpp.defaultHandlers.presence(presence,_xmpp)

            return true

        this.conn.addHandler(presenceHandler,null,'presence')

        #Message

        messageHandler=(message)->

            if _xmpp.customHandlers.message

                if !_xmpp.customHandlers.message.override

                    _xmpp.defaultHandlers.message(message,_xmpp)

                _xmpp.customHandlers.message.handler(message)

            else
                _xmpp.defaultHandlers.message(message,_xmpp)



            return true


        this.conn.addHandler(messageHandler,null,'message','chat')

        @

    #send iq to fetch roster

    fetchRoster : ->

        #setup Alias
        _xmpp=this
        handler=(iq)->

            if _xmpp.customHandlers.roster

                if ! _xmpp.customHandlers.roster.override

                    _xmpp.defaultHandlers.roster(iq,_xmpp)

                _xmpp.customHandlers.roster.handler(iq)

            else
                _xmpp.defaultHandlers.roster(iq,_xmpp)



            return true



        iq=$iq({type:'get'}).c('query',{xmlns:'jabber:iq:roster'})
        @sendIQ(iq,handler)

        @

    #send an iq to get a vcard

    fetchVcard:(to)->


        #establish Alias

        _xmpp=this
        handler=(iq)->

            if _xmpp.customHandlers.vcard

                if ! _xmpp.customHandlers.vcard.override

                    _xmpp.defaultHandlers.vcard(iq,_xmpp)

                _xmpp.customHandlers.vcard.handler(iq)

            else
                _xmpp.defaultHandlers.vcard(iq,_xmpp)



            return true

        iq=$iq({type:'get',to:to}).c('vCard',{xmlns:'vcard-temp'})

        @sendIQ(iq,handler)
        @

    #fetchvcard of self
    fetchSelfVcard:->

        @fetchVcard(@jid)

        @




    #fetch pictures all at once

    fetchPics:->


        @fetchVcard roster.jid for roster in @roster when roster.status isnt 'offline' and roster.photoStatus is false

        @

    #RegisteCustomHandler

    registerHandler:(type,handler,override)->

        if ! override
            override=false

        @customHandlers[type]={

            handler:handler,
            override:override
        }

        this


    #Return System maintained Roster

    getDefaultRoster:->

        @roster






xmpp=new Xmpp
