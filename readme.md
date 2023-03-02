one time tasks: 

1. install NodeJS version >= 13
2. run "npm install"

to use it:

1. update the current.txt file with timesheet (refer to sample.txt)
2. keep in mind that the fields are separated with the tab character (to make it easy to copy from google spreadsheet)
3. login to the timetracker
4. inspect the network tab for requests to any https://employees.bairesdev.com/api/v1/employees endpoints
5. grab the value for authorization header
6. replace it in the index.mjs file
7. the date constant should reflect the year and month (the day doesn't matter) of the records being added (remember that january is the month 0)
8. run "npm start"
