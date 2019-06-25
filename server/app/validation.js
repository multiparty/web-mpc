/**
 * Define JOI schemas to validate request payloads.
 */

const joi = require('joi');

// Use helpers to generate base joi schemas: these are building blocks for the schemas of requests.
// TODO: set length restrictions on sessionKey and userKey
const schemaTemplates = {
  sessionKeySchema: joi.string().alphanum().required(),
  userKeySchema: joi.string().alphanum().required(),
  passwordSchema: joi.string().alphanum().required(),
};
schemaTemplates.keyPasswordTemplate = {
  session: schemaTemplates.sessionKeySchema,
  password: schemaTemplates.passwordSchema
};

// Concrete Request schemas!
module.exports = {
  getStatus: {
    session: schemaTemplates.sessionKeySchema
  },

  getSessionInfo: {
    session: schemaTemplates.sessionKeySchema,
    userkey: schemaTemplates.userKeySchema
  },

  createSession: { // TODO: should be more restrictive here
    publickey: joi.string().required(),
    title: joi.string().required(),
    description: joi.string().required()
  },

  getCohorts: {
    session: schemaTemplates.sessionKeySchema,
    userkey: schemaTemplates.userKeySchema
  },

  getCohortsManage: Object.assign({}, schemaTemplates.keyPasswordTemplate),

  createNewCohort: Object.assign({
    cohort: joi.string().required(),
  }, schemaTemplates.keyPasswordTemplate),

  getClientUrls: Object.assign({}, schemaTemplates.keyPasswordTemplate),

  createClientUrls: Object.assign({
    count: joi.number().integer().min(0).max(10000).required(),
    cohort: joi.string().required()
  }, schemaTemplates.keyPasswordTemplate),

  getSubmissionHistory: Object.assign({
    last_fetch: joi.number().required() // TODO: enforce time stamp
  }, schemaTemplates.keyPasswordTemplate),

  setStatus: Object.assign({
    status: joi.only('START', 'STOP', 'PAUSE').required()
  }, schemaTemplates.keyPasswordTemplate)
};

// Export JOI schemas
for (var name in module.exports) {
  if (module.exports.hasOwnProperty(name)) {
    module.exports[name] = joi.object().keys(module.exports[name]);
  }
}
