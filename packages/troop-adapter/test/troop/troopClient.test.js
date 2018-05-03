import { expect } from 'chai';
import fetch from 'whatwg-fetch'; // eslint-disable-line
import troopClient from '../../src/troop/troopClient';

const fetchMock = require('fetch-mock');

fetchMock
  .get('/troop/test', { hello: 'world' })
  .post('/troop/test', (url, ops) => {
    const response = { data: JSON.parse(ops.body), status: '200' };
    return response;
  })
  .post(/\/services\/api\/proxy\/queryproxy.*/, (url, ops) => {
    if (ops.body.indexOf('user!current') >= 0) {
      expect(url).to.include('c=countrycode');
      return [
        {
          id: 'user!current',
          userName: 'test'
        }
      ];
    }
    if (ops.body.indexOf('command!*') >= 0) {
      expect(ops.body).to.eql('q=user!test%7Ccommand!*');
      return [
        {
          id: 'user!test',
          userName: 'test'
        },
        {
          id: 'command!*',
          results: {
            'axis/behaviorcommand/LogTrack': {
              type: 'POST'
            }
          }
        }
      ];
    }

    if (ops.body.indexOf('student_course_enrollment') >= 0) {
      return [
        {
          id: 'student_course_enrollment!current',
          studentLevel: {
            collapsed: true,
            id: 'student_level!3ecc6a0b-c18b-4112-a7cb-8da2cf061ae6'
          }
        },
        {
          id: 'student_level!3ecc6a0b-c18b-4112-a7cb-8da2cf061ae6',
          collapsed: false,
          levelCode: 8
        }
      ];
    }

    return {};
  })
  .catch({
    throws: {
      status: 404,
      message: 'failed'
    }
  });

describe('verify troop client', () => {
  it('verify basic get function', async () => {
    const response = await troopClient.getJson('/troop/test');
    expect(response).to.eql({ hello: 'world' });
  });

  it('verify post Json', async () => {
    const response = await troopClient.postJson('/troop/test', { id: 'test!123' });
    expect(response.data).to.eql({ id: 'test!123' });
  });

  it('verify get function with incorrect url', async () => {
    try {
      const response = await troopClient.getJson('test');
      expect(response).to.be.fail();
    } catch (err) {
      expect(err.status).to.eql(404);
      expect(err.message).to.eql('failed');
    }
  });

  it('verify troop query', async () => {
    const response = await troopClient.query('/services/api/proxy/queryproxy', 'user!current', {
      troopContext: { values: { countrycode: { value: 'ZH' }, languagecode: { value: 'en' } } }
    });
    expect(response[0]).to.eql({
      id: 'user!current',
      userName: 'test'
    });
  });

  it('verify multiple query', async () => {
    const response = await troopClient.query('/services/api/proxy/queryproxy', 'user!test|command!*', {
      troopContext: { values: { countrycode: { value: 'ZH' }, languagecode: { value: 'en' } } }
    });
    expect(response.length).to.equal(2);
  });

  it('verify nested query', async () => {
    const response = await troopClient.query('/services/api/proxy/queryproxy', 'student_course_enrollment!current.studentLevel', {
      troopContext: { values: { countrycode: { value: 'ZH' }, languagecode: { value: 'en' } } }
    });
    const enrollment = response[0];
    expect(typeof enrollment.studentLevel).to.eql('object');
    expect(enrollment.studentLevel.levelCode).to.eql(8);
  });
});
