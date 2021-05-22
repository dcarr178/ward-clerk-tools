# Ward clerk tools
Helpful open-source software tools for ward clerks.

## Overview
Church systems have come a long way and LCR is a tremendous resource to help us perform common tasks. However, adaptations in different countries, stakes, and wards
are not always handled well by our one-size-fits-all application. Also, sometimes church programs change abruptly and it takes months or years for church systems
to adapt to the new rules.

The software tools in this repository exist to simply bridge a gap between church systems are now and where we hope they will be in the future. They provide needed
functionality that so far is lacking in the church's formal systems or isn't fully developed.

### IMPORTANT! No developer support
The church provides no support or documentation for their api endpoints and browser
application so the implicit system contracts these tools rely on could break at any time without notice, rendering
the tools worthless without additional code maintenance and tweaks.

## Initialization
Prior to installing this software, you must have [git](https://git-scm.com/downloads) and [nodejs/npm](https://nodejs.org/en/download/) installed on your computer.

```bash
git clone git@github.com:dcarr178/ward-clerk-tools.git
cd ward-clerk-tools
yarn install
cp .env-example .env
vi .env # enter your church login credentials
```

Cypress may have additional installation requirements depending on your operating system. Check https://docs.cypress.io/guides/getting-started/installing-cypress for more information.

## Use cases

1. The bishopric needs a quick list of who hasn't been set apart yet in their new callings, so they can schedule appointments.

   ```bash
   npm run callings
   ```
   This creates a csv file with all ward callings, member name, date called, and whether they have been set apart.

   NOTE: You can also access this report at https://lcr.churchofjesuschrist.org/orgs/members-with-callings now and while you can't filter out
   just those that need to be set apart, you can find the network response in developer tools and copy/paste it to https://www.convertcsv.com/json-to-csv.htm
   and then download the csv and manipulate it in Microsoft Excel or Google Sheets to filter to the dataset you need.


2. Some ward members may still have callings in the system which they have been released from. It's good to do a periodic audit of individuals who have held
callings for the longest and perform a manual review if these individuals still hold the same positions.

   ```bash
   npm run callings
   ```
   This creates a csv file with all ward callings, member name, date called, and whether they have been set apart.

   NOTE: You can also access this report at https://lcr.churchofjesuschrist.org/orgs/members-with-callings now and while you can't filter out
   just those that need to be set apart, you can find the network response in developer tools and copy/paste it to https://www.convertcsv.com/json-to-csv.htm
   and then download the csv and manipulate it in Microsoft Excel or Google Sheets to filter to the dataset you need.


3. Church systems now offer many reports that help ward members know who has moved in or moved out. However, all of these are *pull* mechanisms where ward members have to proactively run the report and often they forget to or don't remember how to. Additionally, many ward members would like to know when callings have changed in the ward and aren't always present when sustainings occur in sacrament meeting. What members want is a *push* mechanism they can subscribe to and have messages automatically pushed to their preferred channel (email, sms, slack) whenever significant events occur including move ins, move outs, and new callings.

   ```bash
   npm run changes
   ```
   This runs new membership and calling reports, compares them to the last report that was ran, and pushes any members moved in, members moved out,
   new callings, or new releases as push notifications to slack and email.

4. Class attendance doesn't always get entered correctly in a timely manner so at the end of each quarter (or nearing the end of a quarter), identify
all members for each organization who have not attended and email the organization leader with that list of names. By reviewing this information, the organization leader can enter attendance before the quarterly report is due.

   ```bash
   npm run attendance
   ```
   This creates a csv file with all members, the classes they belong to, and whether they have attended this quarter.



## Push communication channels
These are the communication channels we currently support for notifications of member move ins, move outs, and calling changes:

### Email via Sendgrid
Configuration steps:
1. Go to https://sendgrid.com and sign up for a free account.
2. Create a verified sender email. This sends an email to your email address which you have to click on to verify you own this email account.
3. Create a sendgrid email api key
4. Add the sendgrid details to this application environment file `.env` as follows:
```
SENDGRID_API_KEY="yyyyyy"
VERIFIED_SENDGRID_SENDER_EMAIL="mySender@gmail.com"
SEND_EMAIL_TO="user1@gmail.com;user2@zumint.com"
```
SEND_EMAIL_TO can be a single email address or a semicolon-delimited list of addresses.

### Slack via webhook
Follow the instructions here https://api.slack.com/messaging/webhooks. Configuration steps:
1. Create a slack app
2. Enable incoming webhooks
3. Create an incoming webhook. Select which slack channel this application should post to.
4. Step 3 will produce a unique url for your webhook. Add this to `.env`:
```
SLACK_WEBHOOK_URL="yyyyyyy"
```


### These are the communication channels we'd like to eventually support
* SMS via Twilio
* Church Circles mobile application
* Other?

## Testing
```bash
yarn cli # local developer testing without build
yarn build # build for public use
```

## Online resources

### Leader and Clerk Resources (LCR)
[https://lcr.churchofjesuschrist.org/](https://lcr.churchofjesuschrist.org/)

The hub of ward administration online. Contains most membership/financial information. Most of the clerk's job can be done using LCR.

### Member Leadership Software (MLS)
Software available on the church computer in the clerk's office. Still can be used for membership/financial tasks (though the church actively pushes to LCR when it can). MLS is still the only place you can record donations, though.

### Tech Forum
[https://tech.churchofjesuschrist.org/forum/](https://tech.churchofjesuschrist.org/forum/)

An online forum where you can connect with other clerks across the world to find answers to specific problems.

### Help Center
[https://www.churchofjesuschrist.org/help/support/record-keeping/membership](https://www.churchofjesuschrist.org/help/support/record-keeping/membership)

Training center where you'll find calling-specific articles and training videos.

