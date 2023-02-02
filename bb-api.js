var baseURL = 'https://servicedesk.edusupportcenter.com/api/v1'
var token = ""

function makeApiRequest(apiEndpoint, requestOptions) {

  var rawResponse = UrlFetchApp.fetch(apiEndpoint, requestOptions);

  var headers = rawResponse.getHeaders();
  var contentType = headers['Content-Type'];

  switch (contentType) {
    case 'application/json;charset=UTF-8':
      var response = JSON.parse(rawResponse.getContentText())

      var responseCode = response.return_code
      switch (responseCode) {
        case 201:
          // The request was successful
          return response
        case 200:
          // The request was successful
          if (response.return_body.items) {
            return response.return_body.items
          } else {
            return response.return_body
          }
        case 429:
          // The request returned a 429 Too Many Requests error
          Utilities.sleep(60000)
          makeApiRequest(apiEndpoint, requestOptions);
          break;
        case 401:
          // Auth failed
          Logger.log("Auth failed")
          break;
        default:
          Logger.log('Error ' + responseCode + ': ' + rawResponse)
          break;
      }
      break;
    case 'text/plain;charset=utf-8':
      var text = rawResponse.getContentText();
      return text
      // Do something with the plain text data
      break;
    case 'text/html;charset=utf-8':
      var html = rawResponse.getContentText();
      // Do something with the HTML data
      break;
    case 'application/xml;charset=utf-8':
      var xml = rawResponse.getContentText();
      // Do something with the XML data
      break;
    case 'application/javascript;charset=utf-8':
      var javascript = rawResponse.getContentText();
      // Do something with the JavaScript data
      break;
    case 'application/octet-stream;charset=utf-8':
      var binary = rawResponse.getBlob();
      // Do something with the binary data
      break;
    case 'application/pdf':
      var pdf = rawResponse.getBlob();
      // Do something with the pdf data
      break;
    case 'image/jpeg':
    case 'image/png':
    case 'image/gif':
      var image = rawResponse.getBlob();
      // Do something with the image data
      break;
    default:
      // Handle other data types
      Logger.log(contentType)
      break;
  }
}

function getAuth(username, password) {

  var endpoint = `${baseURL}/login`

  var creds = {
    "username": username,
    "password": password
  }

  var options = {
    'method': 'post',
    'contentType': 'application/json',
    'payload': JSON.stringify(creds)
  }

  var bearerToken = makeApiRequest(endpoint, options)
  if (bearerToken.error_msg == "login success") {
    token = bearerToken.return_body.token
  } else {
    return false
  }
}

function getTicketQueue(pageSize) {

  var endpoint = `${baseURL}/2028/case?_queue_=976&token=${token}&_pageSize_=${pageSize}&_startPage_=1`

  var options = {
    'method': 'get',
    'contentType': 'application/json'
  }

  return makeApiRequest(endpoint, options)
}

function getTicketDetails(id) {

  var endpoint = `${baseURL}/2028/case/${id}?token=${token}&_replaceRuntime_=true&_history_=true&_source_=sd&_domain_=https://servicedesk.edusupportcenter.com`

  var options = {
    'method': 'get',
    'contentType': 'application/json'
  }

  return makeApiRequest(endpoint, options)
}

function getPersonDetails(firstName, lastName, aNumber) {

  var endpoint = `${baseURL}/2028/searchContacts?token=${token}&_pageSize_=5&_startPage_=1`

  var body = {
    'email': "",
    'extra_user_id': "",
    'fields': [],
    'firstName': "",
    'first_name': firstName,
    'lastName': lastName,
    'last_name': "",
    'primary_phone': "",
    'userId': "",
    'userName': "",
    'user_id': "",
    'user_name': aNumber
  }

  var options = {
    'method': 'post',
    'contentType': 'application/json',
    'payload': JSON.stringify(body)
  }

  return makeApiRequest(endpoint, options)
}

function assignTicket(id) {

  var endpoint = `${baseURL}/2028/case/${id}/action/31745?token=${token}`

  var body = {
    attachment: [],
    comment: "",
    csr: "",
    csrCCList: "",
    customerCCList: "",
    queue: "",
    selectedCsr: "",
    suppressExtComm: "",
    transferInstitution: "",
    transferTemplateType: "",
    useKbs: []
  }

  var options = {
    'method': 'post',
    'contentType': 'application/json',
    'payload': JSON.stringify(body)
  }

  return makeApiRequest(endpoint, options)
}

function closeTicket(id, tdxID) {

  var endpoint = `${baseURL}/2028/case/${id}/action/31734?token=${token}`

  var body = {
    attachment: [],
    comment: `Ticket has been escalated to the PCCs IT ticketing system. Ticket: https://service.pima.edu/TDClient/1920/Portal/Requests/TicketRequests/TicketDet?TicketID=${tdxID}`,
    csr: "",
    csrCCList: "",
    customerCCList: "",
    queue: "",
    selectedCsr: "",
    suppressExtComm: "",
    transferInstitution: "",
    transferTemplateType: "",
    useKbs: []
  }

  var options = {
    'method': 'post',
    'contentType': 'application/json',
    'payload': JSON.stringify(body)
  }

  return makeApiRequest(endpoint, options)
}

function getTicketFile(id) {
  var endpoint = `${baseURL}/2028/file/${id}?token=${token}`

  var options = {
    'method': 'get',
    'contentType': 'application/json'
  }

  return makeApiRequest(endpoint, options)
}