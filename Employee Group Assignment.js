function myFunction() {
  // Use sandbox or not
  TDX.buildApiUrl('prod') // Use sandbox or prod

  // Creds for API auth
  var scriptProperties = PropertiesService.getScriptProperties()
  var tdxBEID = scriptProperties.getProperty('BEID')
  var tdxKey = scriptProperties.getProperty('WebServicesKey')

  var header = TDX.getAuth(tdxBEID, tdxKey)
  if (header === false) {
    Logger.log("Auth failed")
  } else {

    // Search for those with an email with only @pima.edu.
    var response = TDX.getPeopleList("@pima.edu")

    const allStaff = JSON.parse(response)

    var response = TDX.getGroupUsers("21759") // All Staff group

    var targetGroup = JSON.parse(response)

    Logger.log(`Total staff : ${allStaff.length}`)
    var addList = []
    for (var staffEntry in allStaff) {
      var staff = allStaff[staffEntry]

      // Check to see if the staff is already in the group
      var findUser = targetGroup.findIndex(user => user.UID === staff.UID)

      if (staff.TypeID === 1 && findUser === -1) { // Verify the staff is a User and is not already in the All Staff group
        addList.push(staff.UID)
      } else {
        // user not staff or already in the group
        //Logger.log(`No need : ${staff.UserName}`)
      }
    }
    Logger.log(`Total Add : ${addList.length}`)
    TDX.setGroupUsers('21759', addList)
  }
}