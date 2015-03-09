app= angular.module("MerlinChat")
app.filter("contactList",->

	(contacts)->
		contactList={}
		contactList[key]=contact for key,contact of contacts when contact.status isnt 'offline' or xmpp.messages[key] isnt undefined
		contactList
)


app.filter("name",->
	maxsize=13
	(name)->
		if name.length>maxsize
			name=name.substr(0,maxsize-1)
			name=name+'..'
		name
)



app.controller("dashboardController",($scope,$rootScope)->


	$scope.activeChat = false
	$scope.activeJid = ""
	maxHeight=window.innerHeight
	calculatedHeight=120+80+angular.element('.text-box-container').height()
	angular.element('.sidebar .scroller').css('height',(maxHeight-57)+'px')
	angular.element('.box .scroller').css('height',(maxHeight-calculatedHeight)+'px')
	$scope.logout=->
		xmpp.disconnect()
		return

	$scope.streamInput= ""

	angular.element('textarea#streamInput').bind('change', ->
		$scope.forceAdjust()
		return
	)
	angular.element('textarea#streamInput').bind('keydown', ->
		$scope.forceAdjust()
		return
	)
	angular.element('textarea#streamInput').bind('keyup', ->
		$scope.forceAdjust()
		return
	)

	$scope.forceAdjust=->

		calculatedHeight=120+80+angular.element('.text-box-container').height()
		if maxHeight-calculatedHeight > 100
			angular.element('.box .scroller').css('height',(maxHeight-calculatedHeight)+'px')
		return

	$scope.$watch("streamInput",(newValue, oldValue)->
		$scope.forceAdjust()
		return
	)


	$scope.selectBuddy=(jid)->

		$scope.activeChat=true
		oldjid=$scope.activeJid

		$scope.activeJid=jid
		if !$scope.$$phase
			$scope.$apply()

		if oldjid != jid
			$(".box-container .scroller").scrollTop(0)

		$(".box-container .scroller").scrollTop($('.box-container .box-content').height())
		$(".box-container .scroller").perfectScrollbar('update')
		angular.element('textarea#streamInput').focus()
		return


	$scope.getSelfPhoto=->
		xmpp.photo

	$scope.getSelfName=->

		if xmpp.fullName.length>0

			return xmpp.fullName
		else
			return xmpp.jid

	xmpp.fetchSelfVcard()
	return

)


app.controller("consoleController",($scope,$rootScope)->

	$scope.$on("streamIncoming",(event,body)->
		$scope.show_traffic(body.body,'out')
		return

	)
	$scope.$on("streamOutgoing",(event,body)->
		$scope.show_traffic(body.body,'out')
		return

	)

	xmpp.conn.xmlInput=(body)->
		$rootScope.$broadcast("streamIncoming", {body:body})
		return

	xmpp.conn.xmlOutput=(body)->
		$rootScope.$broadcast("streamOutgoing", {body:body})
		return



	$scope.consoleLogs=[]

	$scope.show_traffic=(body,type)->
		$scope.consoleLogs.push({body:Strophe.serialize(body),type:type})
		if !$scope.$$phase
			$scope.$apply()
		return




	$scope.streamInput= ''

	$scope.sendStream=->

		text=$scope.streamInput
		if text.length>0
			xmpp.sendFromText(text)
		return

	return
)




