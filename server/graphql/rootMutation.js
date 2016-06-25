import {GraphQLObjectType} from 'graphql'
import chapter from './models/Chapter/mutation'
import player from './models/Player/mutation'
import cycle from './models/Cycle/mutation'
import vote from './models/Vote/mutation'
import response from './models/Response/mutation'
import project from './models/Project/mutation'

const rootFields = Object.assign(chapter, player, cycle, vote, response, project)

export default new GraphQLObjectType({
  name: 'RootMutation',
  fields: () => rootFields
})
