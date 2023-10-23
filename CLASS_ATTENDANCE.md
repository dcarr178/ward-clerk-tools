# Who did not attend class/quorum this quarter?

The ward quarterly report includes the number and percents of individuals who did/did not attend a class or quorum meeting this quarter. When dealing with large numbers of individuals who serve outside of their class/quorum (i.e. primary instead of Elders quorum), who serve outside of the ward in a stake calling, or in a calling outside of the stake, the question that needs to be answered is this:

**Which members are marked as NOT ATTENDED a class/quorum this quarter?**

Once you know the answer to this, then do a sanity check to verify there aren't names in that group that you know are serving somewhere where they cannot attend their class/quorum.

## How to answer the question
1. While logged in as the ward clerk, navigate your browser to the class/quorum attendance webpage https://lcr.churchofjesuschrist.org/report/class-and-quorum-attendance/overview?lang=eng.
2. Press F12 to open your browser's developer console.
3. By default, only 5 Sundays are shown in the browser and only up to 100 individuals at a time, which would require a lot of clicks to figure out which members attended no class this quarter. With the develoer console open, click the left arrow next to the earliest week to show the previous 5 Sundays.
4. Now go to the developer console and search for a network request that looks like this: https://lcr.churchofjesuschrist.org/api/umlu/v1/class-and-quorum/attendance/overview/unitNumber/374938/start/2023-05-14/end/2023-06-11?lang=eng. Your dates will be different depending on when you perform this action. This url tells you what your ward unit number is.
5. Edit the configuration parameters below and then copy/paste this code into your browser javascript console:

```javascript
// configure parameters for your report
const wardUnitNumber = "374938"
const quarterStartDate = "2023-04-01"
const quarterEndDate = "2023-06-30"

// fetch the member list
const memberListUrl = `https://lcr.churchofjesuschrist.org/api/umlu/report/member-list?lang=eng&unitNumber=${wardUnitNumber}`
const memberList = await fetch(memberListUrl).then(response => response.json()).then(data => {
    members = {}
    data.forEach(member => {
        members[member["uuid"]] = member
    })
    return members
})

// fetch attendance data
const classAttendanceUrl = `https://lcr.churchofjesuschrist.org/api/umlu/v1/class-and-quorum/attendance/overview/unitNumber/${wardUnitNumber}/start/${quarterStartDate}/end/${quarterEndDate}?lang=eng`
const attendanceData = await fetch(classAttendanceUrl).then(response => response.json())

// identify members who did not attend a class
membersNotAttended = []
attendanceData["attendanceData"]["attendees"].forEach(member => {
  attended = false
  member["entries"].forEach(entry => {
      if (entry["isMarkedAttended"]) attended = true
  })
  if (!attended) {
    const uuid = member["uuid"]
    membersNotAttended.push(memberList[uuid]["nameListPreferredLocal"])
  }
})
membersNotAttended.sort()
console.log(membersNotAttended)
```

You can copy and paste the printed output into your own list or right-click the variable and choose "copy object" to do something else interesting with it.

Once you find individuals who you believe did attend a class, go to the class attendance page and enter an attendance record for them during the quarter you are analyzing Then come back and re-run this code to see your change.
