import faker from 'faker'

const VALID_TIMEZONES = ['America/Los_Angeles', 'America/Chicago', 'America/New_York']
const now = new Date()

export default function define(factory) {
  factory.define('user', null, {
    id: cb => cb(null, faker.random.uuid()),
    email: cb => cb(null, faker.internet.exampleEmail()),
    emails: cb => cb(null, [faker.internet.exampleEmail(), faker.internet.exampleEmail()]),
    handle: factory.sequence(n => `user${n}`),
    avatarUrl: cb => cb(null, faker.image.imageUrl()),
    profileUrl: cb => cb(null, 'http://me.com'),
    name: cb => cb(null, faker.name.findName()),
    phone: cb => cb(null, faker.phone.phoneNumber('(###) ###-####')),
    dateOfBirth: cb => cb(null, faker.date.past(21).toISOString().slice(0, 10)),
    timezone: cb => cb(null, faker.random.arrayElement(VALID_TIMEZONES)),
    active: true,
    roles: ['learner'],
    inviteCode: 'test',
    authProviders: {},
    createdAt: cb => cb(null, now),
    updatedAt: cb => cb(null, now),
  })
}
