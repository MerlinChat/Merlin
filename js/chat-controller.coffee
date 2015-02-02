app= angular.module("MerlinChat")
app.controller("chatController",($scope,$rootScope)->


	$scope.activateEnter=true
	angular.element('textarea#streamInput').keypress((eventdata)->
		if $scope.activateEnter && !eventdata.shiftKey && eventdata.keyCode==13
				if $scope.streamInput.trim().length>0
					angular.element('.text-box-container button').trigger('click')
					return false
		return true
	)
	a=10
	angular.element('.text-box-container').click(->
		angular.element('textarea#streamInput').focus()
		return
	)

	$scope.getName=(jid)->
		if jid==xmpp.jid

			if xmpp.fullName.length>0

				return xmpp.fullName
			else
				return xmpp.jid

		roster=xmpp.getDefaultRoster()
		if roster[jid]

			return roster[jid].name

		else
			return jid

	$scope.getPhoto=(jid)->

		if jid==xmpp.jid
			return xmpp.photo

		roster=xmpp.getDefaultRoster()
		if roster[jid]

			return roster[jid].photo
		else
			return 'views/default-propic.png'

		return

	$scope.$on("newMessage",(event,body)->

		if !$scope.$$phase
			$scope.$apply()

		$(".box-container .scroller").scrollTop($('.box-container .box-content').height())
		$(".box-container .scroller").perfectScrollbar('update')
		return

	)

	$scope.messages=[]

	$scope.fetchMessages=(jid)->

		if xmpp.messages[jid]
			$scope.messages=xmpp.messages[jid]

		else
			$scope.messages=[]

		return $scope.messages


	$scope.renderNameLeft=(message)->

		name=$scope.getName(message.from)
		if message.sent
			return name

		return ''





	$scope.renderNameRight=(message)->

		name=$scope.getName(message.from)
		if !message.sent
			return name
		return ''


	$scope.streamInput= ''

	$scope.sendMessage=(jid)->

		if $scope.streamInput.trim().length>0

			body=$scope.streamInput
			xmpp.sendMessage(jid,body)
			$scope.streamInput= ''

			if !$scope.$$phase
				$scope.$apply()
		$(".box-container .scroller").scrollTop($('.box-container .box-content').height())
		$(".box-container .scroller").perfectScrollbar('update');
		angular.element('textarea#streamInput').focus()
		return



	$scope.getClass=(message)->
		if message.sent
			return "message message-right"
		return "message message-left"
	return

)
