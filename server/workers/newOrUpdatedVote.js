import fetch from 'isomorphic-fetch'
import raven from 'raven'
import url from 'url'
import {graphql} from 'graphql'
import socketCluster from 'socketcluster-client'

import r from '../../db/connect'
import {getQueue} from '../util'

import rootSchema from '../graphql/rootSchema'

const sentry = new raven.Client(process.env.SENTRY_SERVER_DSN)

const scHostname = process.env.NODE_ENV === 'development' ? 'game.learnersguild.dev' : 'game.learnersguild.org'
const socket = socketCluster.connect({hostname: scHostname})
socket.on('connect', () => console.log('... socket connected'))
socket.on('disconnect', () => console.log('socket disconnected, will try to reconnect socket ...'))
socket.on('connectAbort', () => null)
socket.on('error', error => console.warn(error.message))

// returns a Promise, resolves to null if not valid
function fetchGoalInfo(goalRepositoryURL, goalDescriptor) {
  const issueURL = githubIssueURL(goalRepositoryURL, goalDescriptor)
  if (!issueURL) {
    return Promise.resolve(null)
  }

  const fetchOptions = {
    headers: {
      Authorization: `token ${process.env.GITHUB_ORG_ADMIN_TOKEN}`,
      Accept: 'application/json',
    },
  }
  return fetch(issueURL, fetchOptions)
    .then(resp => {
      if (!resp.ok) {
        // if no issue is found at the given URL, return null
        if (resp.status === 404) {
          return null
        }
        const respBody = resp.body.read()
        const errMessage = respBody ? JSON.parse(respBody.toString()) : `FAILED: ${issueURL}`
        console.error(errMessage)
        throw new Error(`${errMessage}\n${resp.statusText}`)
      }
      return resp.json()
    })
    // if no issue is found at the given URL, return null (notify user later)
    .then(githubIssue => (githubIssue ? {
      url: githubIssue.html_url,
      title: githubIssue.title,
      githubIssue,
    } : null))
}

function githubIssueURL(goalRepositoryURL, goalDescriptor) {
  const goalRepositoryURLParts = url.parse(goalRepositoryURL)
  const goalURLParts = url.parse(goalDescriptor)
  if (goalURLParts.protocol) {
    // see: http://stackoverflow.com/questions/3446170/escape-string-for-use-in-javascript-regex
    const escapedGoalRepositoryURL = goalRepositoryURL.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&')
    const issueURLRegex = new RegExp(`^${escapedGoalRepositoryURL}\/issues\/\\d+$`)
    if (goalDescriptor.match(issueURLRegex)) {
      return `https://api.github.com/repos${goalURLParts.path}`
    }
  } else if (goalDescriptor.match(/^\d+$/)) {
    return `https://api.github.com/repos${goalRepositoryURLParts.path}/issues/${goalDescriptor}`
  }
}

function fetchGoalsInfo(vote) {
  // get the cycle (which has a nested chapter) so that we have access to
  // the goalRepositoryURL, pass in that goalRepositoryURL to fetchGoalInfo
  const query = `
query($id: ID!) {
  getCycleById(id: $id) {
    id
    chapter {
      goalRepositoryURL
    }
  }
}
  `
  const args = {id: vote.cycleId}

  return graphql(rootSchema, query, {currentUser: true}, args)
    .then(graphQLResult => {
      const {goalRepositoryURL} = graphQLResult.data.getCycleById.chapter
      const promises = vote.notYetValidatedGoalDescriptors
        .map(goalDescriptor => fetchGoalInfo(goalRepositoryURL, goalDescriptor))
      return Promise.all(promises)
    })
}

function formatGoals(prefix, goals) {
  const goalLinks = goals.map((goal, i) => {
    const rank = i === 0 ? '1st' : '2nd'
    const goalIssueNum = goal.url.match(/\/(\d+)$/)[1]
    return `[(${goalIssueNum}) ${goal.title}](${goal.url}) [${rank} choice]`
  })
  return `${prefix}:\n - ${goalLinks.join('\n- ')}`
}

function validateGoalsAndNotifyUser(vote, goals) {
  const invalidGoalDescriptors = vote.notYetValidatedGoalDescriptors
    .filter((goalDescriptor, i) => goals[i] === null)
  if (invalidGoalDescriptors.length) {
    socket.publish(`notifyUser-${vote.playerId}`, `Invalid goal(s): ${invalidGoalDescriptors.join(', ')}`)
    if (vote.goals) {
      socket.publish(`notifyUser-${vote.playerId}`, formatGoals('Falling back to previous vote', vote.goals))
    }
    return false
  }
  socket.publish(`notifyUser-${vote.playerId}`, formatGoals('You voted for', goals))
  return true
}

function updateVote(vote) {
  const newVote = Object.assign({}, vote, {updatedAt: r.now()})
  return r.table('votes')
    .get(vote.id)
    .update(newVote)
    .run()
}

function pushCandidateGoalsForCycle(vote) {
  const query = `
query($cycleId: ID) {
  getCycleVotingResults(cycleId: $cycleId) {
    id
    cycle {
      id
      cycleNumber
      startTimestamp
      state
      chapter {
        id
        name
        channelName
        timezone
        goalRepositoryURL
        githubTeamId
        cycleDuration
        cycleEpoch
      }
    }
    numEligiblePlayers
    numVotes
    candidateGoals {
      goal {
        url
        title
      }
      playerGoalRanks {
        playerId
        goalRank
      }
    }
  }
}
  `
  const args = {cycleId: vote.cycleId}

  graphql(rootSchema, query, {currentUser: true}, args)
    .then(graphQLResult => {
      socket.publish(`cycleVotingResults-${vote.cycleId}`, graphQLResult.data.getCycleVotingResults)
    })
}

async function processVote(vote) {
  try {
    const goals = await fetchGoalsInfo(vote)
    const validatedVote = Object.assign({}, vote, {
      pendingValidation: false,
      notYetValidatedGoalDescriptors: null,
    })
    if (validateGoalsAndNotifyUser(vote, goals)) {
      validatedVote.goals = goals
    }
    await updateVote(validatedVote)
    pushCandidateGoalsForCycle(validatedVote)
  } catch (err) {
    console.error(err.stack)
    sentry.captureException(err)
  }
}

export function start() {
  const newOrUpdatedVote = getQueue('newOrUpdatedVote')
  newOrUpdatedVote.process(async ({data: vote}) => processVote(vote))
}