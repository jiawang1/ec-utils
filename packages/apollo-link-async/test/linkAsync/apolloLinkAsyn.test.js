import { expect } from 'chai';
import { constructTroopQuery, getSelection, getTypeFromDirective } from '../../src/apolloLinkAsync';

const queryData = require('./query.json');

const directives = [
  {
    kind: 'Directive',
    name: { kind: 'Name', value: 'troop' },
    arguments: [
      {
        kind: 'Argument',
        name: { kind: 'Name', value: 'type' },
        value: { kind: 'StringValue', value: 'student_course_enrollment', block: false }
      },
      {
        kind: 'Argument',
        name: { kind: 'Name', value: 'id' },
        value: { kind: 'StringValue', value: 'current', block: false }
      },
      {
        kind: 'Argument',
        name: { kind: 'Name', value: 'command' },
        value: {
          kind: 'StringValue',
          value: 'school/enrollment/UpdateCurrentEnrollment',
          block: false
        }
      }
    ]
  }
];

describe('verify apollo async link', () => {
  describe('verify construct troop query', () => {
    it('construct troop query from graphql selection', () => {
      const { selections } = queryData.definitions[0].selectionSet;
      const __query = constructTroopQuery(selections, '');
      expect(__query).to.equal(
        `.student_course_enrollment.studentLevel.progress,.student_course_enrollment.studentLevel.children.progress,.student_course_enrollment.studentCourse.courseLocation`
      );
    });
  });

  describe('verify getSelection', () => {
    it('verify getSelection', () => {
      const sel = getSelection(queryData, 'student_course_enrollment');
      expect(sel).to.equal(queryData.definitions[0].selectionSet.selections[0]);
    });

    it('verify getSelection undefined case', () => {
      const sel = getSelection(queryData, 'test');
      expect(sel).to.equal(undefined);
    });
  });

  describe('verify retrieve query type from graphql directive', () => {
    it('verify empty case', () => {
      const empty = getTypeFromDirective(queryData.definitions[0].directives);
      expect(empty).to.equal(null);
    });

    it('verify troop type', () => {
      const troopType = getTypeFromDirective(directives);
      expect(troopType).to.equal('student_course_enrollment');
    });
  });
});
