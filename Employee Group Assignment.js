function myFunction() {
    // Use sandbox or not
    TDX.buildApiUrl('sandbox') // Use sandbox or prod
  
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
      Logger.log(allStaff[0])
  
      var response = TDX.getGroupUsers("21711") // All Staff group
  
      var targetGroup = JSON.parse(response)
  
      Logger.log(`Total staff : ${allStaff.length}`)
      var addList = []
      for (var staff in allStaff) {
        Logger.log(staff)
        // Check to see if the staff is already in the group
        var findUser = targetGroup.findIndex(user => user.UID === staff.UID)
        //Logger.log(findUser)
        if (staff.TypeID === 1 && findUser === -1) { // Verify the staff is a User and is not in the All Staff group
          Logger.log(`Working on : ${staff.UserName}`)
          addList.push(staff.UID)
          //var response = TDX.setGroup(staff.UID, '21711') // All Staff group
        } else {
          //Logger.log(`No need : ${staff.UserName}`)
        }
      }
  
      TDX.setGroupUsers('21711', addList)
    }
  }