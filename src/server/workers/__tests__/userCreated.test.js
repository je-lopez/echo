/* eslint-env mocha */
/* global expect, assert, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */

import factory from 'src/test/factories'
import {resetDB} from 'src/test/helpers'
import {gitHubService} from 'src/test/stubs'
import {Member} from 'src/server/services/dataService'
import {processUserCreated} from 'src/server/workers/userCreated'

describe(testContext(__filename), function () {
  beforeEach(resetDB)

  beforeEach(function () {
    gitHubService.enable()
  })

  afterEach(function () {
    gitHubService.disable()
  })

  describe('processUserCreated', function () {
    describe('when there is a new user', function () {
      beforeEach(async function () {
        this.chapter = await factory.create('chapter', {
          inviteCodes: ['test']
        })
        this.user = await factory.build('user')
        this.phase = await factory.create('phase', {
          number: 1
        })
      })

      describe('for a new member', function () {
        it('initializes the member', async function () {
          await processUserCreated(this.user)
          const member = await Member.get(this.user.id)

          expect(member).to.exist
          expect(member.chapterId).to.eq(this.chapter.id, 'member should have chapter ID for invite code')
          // TODO: fix - should assert github service function called w/ correct args
        })

        describe('if the new user has role of \'learner\'', function () {
          it('should assign a default phase', async function () {
            await processUserCreated(this.user)
            const user = await Member.get(this.user.id)

            expect(user.phaseId).to.eq(this.phase.id)
          })
        })

        describe('if the new user does not have role of \'learner\'', function () {
          it('should not assign a default phase', async function () {
            this.user = await factory.build('user', {roles: ['admin']})
            await processUserCreated(this.user)
            const user = await Member.get(this.user.id)

            expect(user.phaseId).to.not.exist
          })
        })
      })

      describe('for an existing member', function () {
        it('does not replace the given member', async function () {
          await processUserCreated(this.user)
          const oldMember = await Member.get(this.user.id)

          assert.doesNotThrow(async function () {
            await processUserCreated(this.user)
          }, Error)

          await processUserCreated({...this.user, name: 'new name'})
          const updatedUser = await Member.get(this.user.id)

          expect(updatedUser.createdAt).to.eql(oldMember.createdAt)
        })
      })
    })
  })
})
