function importBBTickets() {
    var scriptProperties = PropertiesService.getScriptProperties()
  
    // Creds for BB auth
    var bbUsername = scriptProperties.getProperty('Username')
    var bbPassword = scriptProperties.getProperty('Password')
  
    var bbAuth = BB.getAuth(bbUsername, bbPassword)  //Set Auth for script
  
    // Creds for API auth
    var tdxBEID = scriptProperties.getProperty('BEID')
    var tdxKey = scriptProperties.getProperty('WebServicesKey')
  
    TDX.buildApiUrl('prod') // Use sandbox or prod
  
    var tdxAuth = TDX.getAuth(tdxBEID, tdxKey)
  
  
    if (bbAuth === false || tdxAuth === false) {
      Logger.log("Auth failed")
    } else {
      var bbTicketQueue = BB.getTicketQueue(100)
      var bbTicketCount = bbTicketQueue.length
  
      if (bbTicketCount < 1) {
        Logger.log("No Blackboard Tickets")
      } else {
        Logger.log(`Importing: ${bbTicketCount} Blackboard ticket(s)`)
        //Logger.log(bbTicketQueue[0])
        for (var queue in bbTicketQueue) {
  
          //Logger.log(bbTicketQueue[queue])
          var basicBBTicket = bbTicketQueue[queue]
          //var request = bbTicketQueue[i]
          var bbTicketNumber = basicBBTicket.ticket_number.split('-')[1]
          var bbTicket = BB.getTicketDetails(bbTicketNumber)
  
          Logger.log(bbTicket.summary)
  
          // Extract user info from ticket for getting other details and to be used for TDX ticket creation
          var aNumber = bbTicket['values'].find(o => o.label === 'A Number').value
          var firstName = bbTicket.customer.name.split(' ')[0]
          var lastName = bbTicket.customer.name.split(' ')[1]
  
          // Extract user phone number and email
          var searchContact = BB.getPersonDetails(firstName, lastName, aNumber)
          if (searchContact.length === 1) {
            var userPhoneNumber = searchContact[0].primary_phone
            var userEmail = searchContact[0].email
          } else {
            var userPhoneNumber = 'None Provided'
            var userEmail = 'None Provided'
          }
  
          // Start object needed to create ticket
          var ticketAttributes = {
            'AccountID': 94478, // Students(PCCSTU)
            'PriorityID': 4537, // Normal
            'ResponsibleGroupID': 11412, // USS - Service Desk
            'StatusID': 52421, // New
            'Title': bbTicket.summary,
            'TypeID': 30386, // USS - Service Desk
            'ClassificationID': '46', // Service Request
            'ServiceID': 32655, // General IT Support
            'FormID': 54995, // BlackBoard Ticket Import
            'SourceID': 2517, // Blackboard
            'IsRichHtml': true,
            'AppName': 'ITTicket',
            'Attribute': [{
              'ID': 124304,  // Blackboard Ticket Number
              'Value': bbTicketNumber
            }, {
              'ID': 124429,  // Phone Number
              'Value': userPhoneNumber
            }
            ]
          }
  
          // Get the users TDX user profile to set them as the requestor in the ticket
          if (aNumber.match(/A\d{8}/i)) {
            var tdxUser = TDX.searchPeople(aNumber)
            // Verify TDX search returned a value
            if (tdxUser.length == 1) {
  
              var tdxUserDetails = TDX.getPersonDetails(tdxUser[0].UID)
  
              // Verify A Numbers extraced from BB and TDX match
              var caseInsensitiveAnumber = RegExp(aNumber, "i");
              if (tdxUserDetails.ExternalID.match(caseInsensitiveAnumber)) {
                ticketAttributes.RequestorUid = tdxUser[0].UID
              }
              else {
                Logger.log("A Number from BB and TDX do not match")
                Logger.log(`BB: ${aNumber}`)
                Logger.log(`TDX: ${tdxUserDetails.ExternalID}`)
                ticketAttributes.RequestorUid = null
                ticketAttributes.RequestorName = bbTicket.customer.name   // The full name of the requestor associated with the ticket.
                ticketAttributes.RequestorFirstName = firstName         // The first name of the requestor associated with the ticket.
                ticketAttributes.RequestorLastName = lastName	          // The last name of the requestor associated with the ticket.
                ticketAttributes.RequestorEmail = userEmail		        // The email address of the requestor associated with the ticket.
                ticketAttributes.RequestorPhone = userPhoneNumber	    // The phone number of the requestor associated with the ticket.
              }
            }
            else {
              Logger.log("TDX profile could not be found or there are multiple results")
              Logger.log(`Total TDX Users found: ${tdxUser.length}`)
              ticketAttributes.RequestorUid = null
              ticketAttributes.RequestorName = bbTicket.customer.name  // The full name of the requestor associated with the ticket.
              ticketAttributes.RequestorFirstName = firstName          // The first name of the requestor associated with the ticket.
              ticketAttributes.RequestorLastName = lastName	          // The last name of the requestor associated with the ticket.
              ticketAttributes.RequestorEmail = userEmail		          // The email address of the requestor associated with the ticket.
              ticketAttributes.RequestorPhone = userPhoneNumber	      // The phone number of the requestor associated with the ticket.
            }
          } else {
            Logger.log(`Invalid A Number : ${aNumber}`)
            ticketAttributes.RequestorUid = null
            ticketAttributes.RequestorName = bbTicket.customer.name  // The full name of the requestor associated with the ticket.
            ticketAttributes.RequestorFirstName = firstName          // The first name of the requestor associated with the ticket.
            ticketAttributes.RequestorLastName = lastName	          // The last name of the requestor associated with the ticket.
            ticketAttributes.RequestorEmail = userEmail		          // The email address of the requestor associated with the ticket.
            ticketAttributes.RequestorPhone = userPhoneNumber	      // The phone number of the requestor associated with the ticket.
          }
  
          // Build TDX ticket description
          var caseDetails = bbTicket['values'].find(o => o.label === 'Case Details').value
          //$caseDetailsConverted = $caseDetails -replace '&nbsp;', ' '
          //$caseDetailsConverted = $caseDetailsConverted -replace '<[^>]+>', ''
          ticketAttributes.Description = `Hello ${firstName},
          <p>The IT Service Desk at Pima Community College has received your case from our Tier 1 support and we will be contacting you shortly.</p>
          <p>Case Details: <b>${caseDetails}</b></p>
          If this is an urgent matter, please call us at (520) 206-4900 and reference this ticket.
          `
          //var requestType = bbTicket['values'].find(o => o.label === 'Request Type').value
  
          // Logger.log(ticketAttributes)
          // Create TDX ticket
          var tdxTicket = null
          tdxTicket = TDX.createTicket("ITTicket", ticketAttributes)
  
          if (null != tdxTicket.ID) {
            //Logger.log(tdxTicket.ID)
  
            const historyCount = bbTicket.history.length
            //Logger.log(`History: ${historyCount}`)
            if (historyCount >= 1) {
              // Reversing history as it would put the newest comment at the bottom in TDX
              const reversedHistory = bbTicket.history.reverse()
  
              for (var i = 0; i < historyCount; i++) {
                var history = reversedHistory[i]
                if (history.comment.length > 0) {
                  //Logger.log(history.comment)
                  TDX.updateTicket("ITTicket", tdxTicket.ID, null, history.comment)
                }
              }
            }
  
            // Check if there are chat transcripts and add as a comment to TDX ticket
            if (bbTicket.chatTranscriptAttachment.length >= 1) {
              for (var attachment in bbTicket.chatTranscriptAttachment) {
                var chat = bbTicket.chatTranscriptAttachment[attachment]
                Logger.log("External chat log found, adding to the ticket")
                var chatLog = BB.getTicketFile(chat.id)
                //Logger.log(chatLog)
                TDX.updateTicket("ITTicket", tdxTicket.ID, null, chatLog, null, null, false)
              }
            }
  
            // Assign ticket to self and close on Blackboard
            var bbAssign = BB.assignTicket(bbTicketNumber)
            var bbClose = BB.closeTicket(bbTicketNumber, tdxTicket.ID)
            Logger.log(`Closing ${bbTicketNumber}`)
            Logger.log(`Closing ${tdxTicket.ID}`)
          }
        }
      }
    }
  }