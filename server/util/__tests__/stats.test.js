/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */
import {
  aggregateBuildCycles,
  relativeContribution,
  expectedContribution,
  expectedContributionDelta,
  effectiveContributionCycles,
  learningSupport,
  cultureContrbution,
  teamPlay,
  scoreMargins,
  eloRatings,
} from 'src/server/util/stats'

describe(testContext(__filename), function () {
  describe('aggregateBuildCycles()', function () {
    it('default build cycles (1)', function () {
      const numPlayers = 4
      const abc = aggregateBuildCycles(numPlayers)
      expect(abc).to.eq(4)
    })

    it('build cycles > 1', function () {
      const numPlayers = 4
      const numBuildCycles = 3
      const abc = aggregateBuildCycles(numPlayers, numBuildCycles)
      expect(abc).to.eq(12)
    })
  })

  describe('relativeContribution()', function () {
    it('none', function () {
      const rc = relativeContribution([])
      expect(rc).to.eq(0)
    })

    it('even', function () {
      const rc = relativeContribution([10, 20, 20, 30])
      expect(rc).to.eq(20)
    })

    it('round up', function () {
      const rc = relativeContribution([10, 10, 21, 21])
      expect(rc).to.eq(16)
    })

    it('round down', function () {
      const rc = relativeContribution([10, 10, 21, 20])
      expect(rc).to.eq(15)
    })
  })

  describe('expectedContribution()', function () {
    it('none', function () {
      const playerHours = 0
      const teamHours = 0
      const ec = expectedContribution(playerHours, teamHours)
      expect(ec).to.eq(0)
    })

    it('normal', function () {
      const playerHours = 20
      const teamHours = 100
      const ec = expectedContribution(playerHours, teamHours)
      expect(ec).to.eq(20)
    })
  })

  describe('expectedContributionDelta()', function () {
    it('none', function () {
      const rc = 0
      const ec = 0
      const ecd = expectedContributionDelta(ec, rc)
      expect(ecd).to.eq(0)
    })

    it('positive', function () {
      const rc = 35
      const ec = 30
      const ecd = expectedContributionDelta(ec, rc)
      expect(ecd).to.eq(5)
    })

    it('negative', function () {
      const rc = 30
      const ec = 35
      const ecd = expectedContributionDelta(ec, rc)
      expect(ecd).to.eq(-5)
    })

    it('exact', function () {
      const rc = 30
      const ec = 30
      const ecd = expectedContributionDelta(ec, rc)
      expect(ecd).to.eq(0)
    })
  })

  describe('effectiveContributionCycles()', function () {
    const abc = 4
    const rc = 25
    const ecc = effectiveContributionCycles(abc, rc)
    expect(ecc).to.eq(100)
  })

  describe('learningSupport()', function () {
    it('none', function () {
      const ls = learningSupport([])
      expect(ls).to.eq(0)
    })

    it('round down', function () {
      const ls = learningSupport([5, 6, 7])
      expect(ls).to.eq(83)
    })

    it('round up', function () {
      const ls = learningSupport([5, 7, 7])
      expect(ls).to.eq(89)
    })
  })

  describe('cultureContrbution()', function () {
    it('none', function () {
      const cc = cultureContrbution([])
      expect(cc).to.eq(0)
    })

    it('round down', function () {
      const cc = cultureContrbution([5, 6, 7])
      expect(cc).to.eq(83)
    })

    it('round up', function () {
      const cc = cultureContrbution([5, 7, 7])
      expect(cc).to.eq(89)
    })
  })

  describe('teamPlay()', function () {
    it('none', function () {
      const tp = teamPlay([])
      expect(tp).to.eq(0)
    })

    it('round down', function () {
      const tp = teamPlay([5, 6, 7])
      expect(tp).to.eq(83)
    })

    it('round up', function () {
      const tp = teamPlay([5, 7, 7])
      expect(tp).to.eq(89)
    })
  })

  describe('scoreMargins()', function () {
    it('valid, total loss', function () {
      const margins = scoreMargins([0, 0])
      expect(margins[0]).to.eq(0)
      expect(margins[0]).to.eq(0)
    })

    it('valid, large loss', function () {
      const margins = scoreMargins([30, 1000])
      expect(margins[0]).to.eq(0.03)
      expect(margins[1]).to.eq(0.97)
    })

    it('valid, slight loss', function () {
      const margins = scoreMargins([1, 0])
      expect(margins[0]).to.eq(1)
      expect(margins[1]).to.eq(0)
    })
  })

  describe('eloRatings()', function () {
    it('valid, diff ratings, same scores', function () {
      const playerA = {rating: 1300, score: 0.57, kFactor: 100}
      const playerB = {rating: 1000, score: 0.57, kFactor: 100}

      const matchResults = eloRatings([playerA, playerB])

      expect(matchResults[0]).to.eq(1265)
      expect(matchResults[1]).to.eq(1035)
    })

    it('valid, diff ratings, diff scores', function () {
      const playerA = {rating: 1020, score: 2.23, kFactor: 20}
      const playerB = {rating: 1256, score: 3.53, kFactor: 20}

      const matchResults = eloRatings([playerA, playerB])

      expect(matchResults[0]).to.eq(1024)
      expect(matchResults[1]).to.eq(1252)
    })
  })
})
