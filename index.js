import { addTimeEntries, determineDateForEndOfYesterday, parseArgs, retrieveTimeEntries } from './lib.js'

const { from, projectID, taskID } = parseArgs()
const to = determineDateForEndOfYesterday()
let timeEntries = await retrieveTimeEntries(from, to, projectID)
timeEntries = timeEntries.filter(timeEntry => timeEntry.duration >= 0)
await addTimeEntries(timeEntries, taskID)
