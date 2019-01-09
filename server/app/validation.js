/**
 * Define JOI schemas to validate request payloads.
 */

const joi = require('joi');

// Read deployment configuration
var deployment = process.env.WEBMPC_DEPLOYMENT;
if (deployment === null || deployment === undefined) {
  deployment = 'pacesetters';
}

// import config
const config = require('../config/'+deployment+'.json');
const template = require('../' + config['template']);

// Helper function: transforms the JSON template to a joi schema, where the structure of the template
// becomes the structure of the joi schema, and each field is assigned the given joiFieldType.
function templateToJoiSchema(template, joiFieldType) {
  const schema = {};
  if (!template || !template.length) {
    return joi.object().keys(schema);
  }
  for (var table of template) {
    schema[table.name] = {};

    for (var row of table.rows) {
      schema[table.name][row.key] = {};

      for (var cols of table.cols) {
        for (var col of cols) {
          schema[table.name][row.key][col.key] = joiFieldType;
        }
      }
      schema[table.name][row.key] = joi.object().keys(schema[table.name][row.key]);
    }
    schema[table.name] = joi.object().keys(schema[table.name]);
  }
  return joi.object().keys(schema).required();
}

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
  getPublicKey: {
    session: schemaTemplates.sessionKeySchema
  },
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

  getClientUrls: Object.assign({}, schemaTemplates.keyPasswordTemplate),
  getMasks: Object.assign({}, schemaTemplates.keyPasswordTemplate),
  getAggregate: Object.assign({}, schemaTemplates.keyPasswordTemplate),

  createClientUrls: Object.assign({
    count: joi.number().integer().min(0).max(10000).required()
  }, schemaTemplates.keyPasswordTemplate),

  getSubmissionHistory: Object.assign({
    last_fetch: joi.number().required() // TODO: enforce time stamp
  }, schemaTemplates.keyPasswordTemplate),

  setStatus: Object.assign({
    status: joi.only('START', 'STOP', 'PAUSE').required()
  }, schemaTemplates.keyPasswordTemplate),

  submitData: {
    mask: templateToJoiSchema(template['tables'], joi.string().required()),
    data: templateToJoiSchema(template['tables'], joi.number().required()),
    questions_public: templateToJoiSchema(template['questions'], joi.string().required()),
    session: schemaTemplates.sessionKeySchema,
    user: schemaTemplates.userKeySchema
  }
};

// Export JOI schemas
for (var name in module.exports) {
  if (module.exports.hasOwnProperty(name)) {
    module.exports[name] = joi.object().keys(module.exports[name]);
  }
}
