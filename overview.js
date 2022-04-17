import {
  determineDateForEndOfYesterday, generateEverhourTimeEntries,
  groupTimeEntries,
  parseToggleArgs,
  retrieveTimeEntries,
  sortTimeEntryGroups,
} from './lib.js'

const { from, projectID } = parseToggleArgs()
const to = determineDateForEndOfYesterday()
let timeEntries = await retrieveTimeEntries(from, to, projectID)
timeEntries = timeEntries.filter(timeEntry => timeEntry.duration >= 0)
const timeEntriesPerDay = groupTimeEntries(timeEntries)
sortTimeEntryGroups(timeEntriesPerDay)
console.log(timeEntriesPerDay)
const summary = generateSummary(timeEntriesPerDay)
console.log(summary)

function generateSummary(timeEntriesPerDay) {
  return generateEverhourTimeEntries(timeEntriesPerDay).map(({date, time}) => ({date, duration: formatDuration(time)}))
}

function formatDuration(duration) {
  const oneHourInSeconds = 60 * 60
  const oneMinuteInSeconds = 60
  const hours = Math.floor(duration / oneHourInSeconds)
  const minutes = Math.ceil((duration - hours * oneHourInSeconds) / oneMinuteInSeconds)
  return `${hours}h ${minutes}min`
}
