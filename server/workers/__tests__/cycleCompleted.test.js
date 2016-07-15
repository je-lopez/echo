/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */

import factory from '../../../test/factories'
import {withDBCleanup} from '../../../test/helpers'

import {
  processCompletedCycle,
} from '../cycleCompleted'

describe(testContext(__filename), function () {
  withDBCleanup()

  describe('processNewCycle()', function () {
    beforeEach('create stubs', function () {
      this.chatClientStub = {
        sentMessages: {},
        sendMessage: (channel, msg) => {
          this.chatClientStub.sentMessages[channel] = this.chatClientStub.sentMessages[channel] || []
          this.chatClientStub.sentMessages[channel].push(msg)
        }
      }
    })

    describe('when a cycle has completed', function () {
      beforeEach(async function () {
        this.chapter = await factory.create('chapter')
        this.cycle = await factory.create('cycle', {
          chapterId: this.chapter.id,
          cycleNumber: 3,
        })
      })

      it('sends a message to the chapter chatroom', function () {
        return processCompletedCycle(this.cycle, this.chatClientStub).then(() => {
          const msg = this.chatClientStub.sentMessages[this.chapter.channelName][0]
          expect(msg).to.match(/Cycle 3 is complete/)
        })
      })
    })
  })
})