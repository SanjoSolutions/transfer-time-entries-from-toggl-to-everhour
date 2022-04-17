import _ from 'lodash'
import fetch from 'node-fetch'
import * as process from 'process'

const togglApiKey = process.env.TOGGL_API_KEY
const everhourApiKey = process.env.EVERHOUR_API_KEY

export async function retrieveTimeEntries(from, to, projectID) {
  const timeEntries = await requestToggleTimeEntries(from, to)
  return timeEntries.filter(
    timeEntry => timeEntry.pid === projectID,
  )
}

async function requestToggleTimeEntries(startDate, endDate) {
  const response = await fetch(
    `https://api.track.toggl.com/api/v8/time_entries` +
    `?start_date=${ encodeDateAsURIComponent(startDate) }` +
    `&end_date=${ encodeDateAsURIComponent(endDate) }`,
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${ Buffer.from(`${ togglApiKey }:api_token`).toString('base64') }`,
      },
    },
  )
  const data = await response.json()
  return data
}

function encodeDateAsURIComponent(date) {
  return encodeURIComponent(date.toISOString())
}

export async function addTimeEntries(timeEntries, taskID) {
  const timeEntriesPerDay = groupTimeEntries(timeEntries)
  sortTimeEntryGroups(timeEntriesPerDay)
  const everhourTimeEntries = generateEverhourTimeEntries(timeEntriesPerDay)
  for (const timeEntry of everhourTimeEntries) {
    await addTimeEntry(timeEntry, taskID)
  }
}

export function groupTimeEntries(timeEntries) {
  const groups = timeEntries.reduce((groups, timeEntry) => {
    const date = toISODate(new Date(timeEntry.start))
    if (!groups.has(date)) {
      groups.set(date, [])
    }
    const group = groups.get(date)
    group.push(timeEntry)
    return groups
  }, new Map())
  return groups
}

export function sortTimeEntryGroups(timeEntryGroups) {
  for (const group of timeEntryGroups.values()) {
    group.sort(compareTimeEntry)
  }
}

export function generateEverhourTimeEntries(timeEntryGroups) {
  return Array.from(timeEntryGroups.values()).map(timeEntries => {
    const firstTimeEntry = timeEntries[0]
    return {
      time: sum(timeEntries.map(timeEntry => timeEntry.duration)),
      date: toISODate(new Date(firstTimeEntry.start)),
      comment: _.uniq(timeEntries.map(timeEntry => timeEntry.description)).join('\n'),
    }
  })
}

function compareTimeEntry(a, b) {
  return Date.parse(a.start) - Date.parse(b.start)
}

async function addTimeEntry(timeEntry, taskID) {
  const response = await fetch(
    `https://api.everhour.com/tasks/${ taskID }/time`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': everhourApiKey,
      },
      body: JSON.stringify(timeEntry),
    },
  )
  if (response.status === 429) {
    const retryAfter = parseInt(response.headers.get('Retry-After'), 10)
    await waitFor(retryAfter * 1000)
    addTimeEntry(timeEntry, taskID)
  } else if (!response.ok) {
    throw new Error('Request failed')
  }
}

function toISODate(date) {
  return (
    `${ date.getFullYear() }-` +
    `${ String(date.getMonth() + 1).padStart(2, '0') }-` +
    `${ String(date.getDate()).padStart(2, '0') }`
  )
}

function sum(numbers) {
  return numbers.reduce(add)
}

function add(a, b) {
  return a + b
}

function waitFor(duration) {
  return Promise(resolve => setTimeout(resolve, duration))
}

export function determineDateForEndOfYesterday() {
  const date = new Date()
  date.setHours(0)
  date.setMinutes(0)
  date.setSeconds(0)
  date.setMilliseconds(0)
  date.setTime(date.getTime() - 1)
  return date
}

export function parseArgs() {
  const {
    from, projectID,
  } = parseToggleArgs()

  const taskID = args[2]
  const taskIDRegExp = /ev:\d+/
  if (!taskIDRegExp.test(taskID)) {
    console.error('TaskID seems invalid.')
    process.exit(1)
  }

  return {
    from,
    projectID,
    taskID,
  }
}

export function parseToggleArgs() {
  const args = process.argv.slice(2)

  const from = new Date(args[0])
  if (isNaN(from)) {
    console.error('From date seems invalid.')
    process.exit(1)
  }

  const projectID = parseInt(args[1], 10)
  if (isNaN(projectID)) {
    console.error('ProjectID seems invalid.')
    process.exit(1)
  }

  return {
    from,
    projectID,
  }
}
