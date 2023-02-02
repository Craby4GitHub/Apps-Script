var baseURL = ''
var appIDTicket = '1257'
var appIDAsset = '1258'
var header = {}

function buildApiUrl(useSandbox) {
  switch (useSandbox) {
    case 'sandbox':
      baseURL = 'https://service.pima.edu/SBTDWebApi/api'
      break
    case 'prod':
      baseURL = 'https://service.pima.edu/TDWebApi/api'
      break
    default:
      baseURL = 'https://service.pima.edu/SBTDWebApi/api'
      break
  }
}

function getAppID(appName) {
  switch (appName) {
    case "ITTicket":
      return '1257'
    case "ITAsset":
      return '1258'
    case "D2LTicket":
      return '1755'
    default:
      Logger.log(`${appName} does not exist`)
  }
}

function makeApiRequest(apiEndpoint, requestOptions) {

  var response = UrlFetchApp.fetch(apiEndpoint, requestOptions);

  var responseCode = response.getResponseCode();
  //Logger.log(`Response: ${responseCode}`)

  // Use a switch statement to handle different response codes
  switch (responseCode) {
    case 200:
      // The request was successful
      return response
    case 201:
      // The request was successful
      return response
    case 429:
      // The request returned a 429 Too Many Requests error
      Utilities.sleep(60000)
      makeApiRequest(apiEndpoint, requestOptions);
      break;
    default:
      Logger.log('Error ' + responseCode + ': ' + response.getContentText())
      break;
  }
}

function getAuth(beid, key) {

  var authEndpoint = `${baseURL}/auth/loginadmin`

  var creds = {
    "BEID": beid,
    "WebServicesKey": key
  }

  var options = {
    'method': 'post',
    'contentType': 'application/json',
    'payload': JSON.stringify(creds)
  }

  try {
    var bearerToken = makeApiRequest(authEndpoint, options)
    //var bearerToken = UrlFetchApp.fetch(authEndpoint, options)
    if (bearerToken.getResponseCode() == 200) {
      // Build header which will be used in subsequent API calls
      header = {
        "Authorization": `Bearer ${bearerToken}`
      }
      return header
    }
  } catch (error) {
    Logger.log(`getAuth Failed`)
    Logger.log(error)
    return false
  }
}

function getPeopleList(searchText, accountIDs, maxResults, referenceIDs, externalID, alternateID, userName, securityRoleID, isActive, isEmployee, isConfidential) {

  var endpoint = `${baseURL}/people/search`

  var options = {
    'method': 'post',
    'contentType': 'application/json',
    'headers': header,
    'payload': JSON.stringify({
      'searchtext': searchText,
      'accountIDs': accountIDs,
      'maxResults': maxResults,
      'referenceIDs': referenceIDs,
      'externalID': externalID,
      'alternateID': alternateID,
      'userName': userName,
      'securityRoleID': securityRoleID,
      'isActive': isActive,
      'isEmployee': isEmployee,
      'isConfidential': isConfidential
    })
  }

  try {
    var response = makeApiRequest(endpoint, options)
    if (response.getResponseCode() == 200) {
      return response
    }
  } catch (error) {
    Logger.log(`getPeopleList Failed on ${searchText}`)
    Logger.log(error)
  }
}

function searchPeople(searchText, maxResults) {

  var endpoint = `${baseURL}/people/lookup?searchText=${searchText}&maxResults=${maxResults}`

  var options = {
    'method': 'get',
    'contentType': 'application/json',
    'headers': header,
  }

  try {
    var response = makeApiRequest(endpoint, options)
    if (response.getResponseCode() == 200) {
      return JSON.parse(response)
    }
  } catch (error) {
    Logger.log(`searchPeople Failed on ${searchText}`)
    Logger.log(error)
  }
}

function getPersonDetails(uid) {

  var endpoint = `${baseURL}/people/${uid}`

  var options = {
    'method': 'get',
    'contentType': 'application/json',
    'headers': header,
  }

  try {
    var response = makeApiRequest(endpoint, options)
    if (response.getResponseCode() == 200) {
      return JSON.parse(response)
    }
  } catch (error) {
    Logger.log(`getPersonDetails Failed on ${uid}`)
    Logger.log(error)
  }
}

function setGroup(uid, targetGroup) {

  var peopleGroupAddEndpoint = `${TDX.baseURL}/people/${uid}/groups/${targetGroup}`
  var options = {
    'method': 'put',
    'contentType': 'application/json',
    'headers': header,
    'muteHttpExceptions': true
  }

  try {

    var response = makeApiRequest(peopleGroupAddEndpoint, options)
    if (response.getResponseCode() == 200) {
      return response
    }
  } catch (error) {
    Logger.log(`setGroup Failed on ${uid}`)
    Logger.log(error)
  }
}

function getGroupUsers(groupID) {

  var peopleGroupGetEndpoint = `${baseURL}/groups/${groupID}/members`
  var options = {
    'method': 'get',
    'contentType': 'application/json',
    'headers': header,
    'muteHttpExceptions': true
  }

  try {

    var response = makeApiRequest(peopleGroupGetEndpoint, options)
    if (response.getResponseCode() == 200) {
      return response
    }
  } catch (error) {
    Logger.log(`getGroupUsers Failed on ${groupID}`)
    Logger.log(error)
  }
}

function setGroupUsers(groupID, uids, isPrimary = false, isNotified = false, isManager = false) {

  var endpoint = `${baseURL}groups/${groupID}/members?isPrimary=${isPrimary}&isNotified=${isNotified}&isManager=${isManager}`

  var body = {
    'uids': uids
  }

  var options = {
    'method': 'post',
    'contentType': 'application/json',
    'headers': header,
    'payload': JSON.stringify(body)
  }

  try {
    var response = makeApiRequest(endpoint, options)
    if (response.getResponseCode() == 200) {
      return response
    }
  } catch (error) {
    Logger.log(`setGroupUsers Failed on ${groupID}`)
    Logger.log(error)
  }
}

function createTicket(appName, ticketAttributes, enableNotifyReviewer = false, notifyRequestor = true, notifyResponsible = true, allowRequestorCreation = false) {

  var appID = getAppID(appName)

  var endpoint = `${baseURL}/${appID}/tickets?EnableNotifyReviewer=${enableNotifyReviewer}&NotifyRequestor=${notifyRequestor}&NotifyResponsible=${notifyResponsible}&AllowRequestorCreation=${allowRequestorCreation}`

  var options = {
    'method': 'post',
    'contentType': 'application/json; charset=utf-8',
    'headers': header,
    'payload': JSON.stringify(ticketAttributes)
  }

  var response = makeApiRequest(endpoint, options)

  var parsedResponse = JSON.parse(response)

  // Ticket ID gets set to a float, this converts it back
  parsedResponse.ID = parsedResponse.ID.toFixed()
  return parsedResponse
}

function updateTicket(appName, ticketID, statusID, comment, notifyEmail, isPrivate = true, isRichHtml = true) {

  var appID = getAppID(appName)

  var endpoint = `${baseURL}/${appID}/tickets/${ticketID}/feed`

  var body = {
    'NewStatusID': statusID,     // Int32	This field is nullable.	The ID of the new status for the ticket. Leave null or 0 to not change the status.
    'Comments': comment,      // String		The comments of the feed entry.
    'Notify': notifyEmail,  // String[]	This field is nullable.	The email addresses to notify associated with the feed entry.
    'IsPrivate': isPrivate,    // Boolean		The private status of the feed entry.
    'IsRichHtml': isRichHtml,   // Boolean		Indicates if the feed entry is rich-text or plain-text.   
  }

  var options = {
    'method': 'post',
    'contentType': 'application/json',
    'headers': header,
    'payload': JSON.stringify(body)
  }

  try {
    var response = makeApiRequest(endpoint, options)
    if (response.getResponseCode() == 200) {
      return response
    }
  } catch (error) {
    Logger.log(`updateTicket Failed on ${ticketID}`)
    Logger.log(error)
  }
}

function editTicket(appName, ticketID, ticketUpdate, notifyNewResponsible = false) {

  var appID = getAppID(appName)

  var endpoint = `${baseURL}/${appID}/tickets/${ticketID}?notifyNewResponsible=${notifyNewResponsible}`

  var body = {
    'NewStatusID': statusID,     // Int32	This field is nullable.	The ID of the new status for the ticket. Leave null or 0 to not change the status.
    'Comments': comment,      // String		The comments of the feed entry.
    'Notify': notifyEmail,  // String[]	This field is nullable.	The email addresses to notify associated with the feed entry.
    'IsPrivate': isPrivate,    // Boolean		The private status of the feed entry.
    'IsRichHtml': isRichHtml,   // Boolean		Indicates if the feed entry is rich-text or plain-text.   
  }

  var options = {
    'method': 'patch',
    'contentType': 'application/json',
    'headers': header,
    'payload': JSON.stringify(body)
  }

  try {
    var response = makeApiRequest(endpoint, options)
    if (response.getResponseCode() == 200) {
      return response
    }
  } catch (error) {
    Logger.log(`editTicket Failed on ${ticketID}`)
    Logger.log(error)
  }
}