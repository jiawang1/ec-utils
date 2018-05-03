import { expect } from 'chai';
import { serialize, __prepareContextURL } from '../../src/troop/simpleQuery';

const mockJson = [
  {
    id: 'student_unit!1',
    collapsed: false,
    itemTypeId: 22
  },
  {
    id: 'test!1',
    levelTest: { id: 'student_levelTest!1', collapsed: true },
    children: [
      {
        id: 'student_unit!1',
        collapsed: true
      },
      {
        id: 'student_unit!2',
        collapsed: true
      }
    ]
  },
  {
    id: 'student_levelTest!1',
    collapsed: false,
    itemTypeId: 21
  },

  {
    id: 'student_unit!2',
    collapsed: false,
    itemTypeId: 23
  },
  {
    id: 'user!current',
    collapsed: false,
    itemTypeId: 24
  }
];

const mockContext = {
  values: {
    countrycode: { value: 'cn' },
    culturecode: { value: 'zh-CN' },
    languagecode: { value: 'cs' },
    partnercode: { value: 'None' },
    siteversion: { value: 'development' },
    studentcountrycode: { value: 'de' }
  }
};

const mockContextURL =
  'countrycode%3Dcn%7Cculturecode%3Dzh-CN%7Clanguagecode%3Dcs%7Cpartnercode%3DNone%7Csiteversion%3Ddevelopment%7Cstudentcountrycode%3Dde';
const mockContextURL2 =
  'test%3D1%7Ccountrycode%3Dcn%7Cculturecode%3Dzh-CN%7Clanguagecode%3Dcs%7Cpartnercode%3DNone%7Csiteversion%3Ddevelopment%7Cstudentcountrycode%3Dde';

describe('unit test for simplequery', () => {
  it('verify serialize method', () => {
    const oCache = serialize(mockJson);
    expect(oCache['test!1'].levelTest.itemTypeId).is.equals(21);
    expect(oCache['student_levelTest!1'].itemTypeId).is.equals(21);
    expect(oCache['user!current'].itemTypeId).is.equals(24);
    expect(oCache['test!1'].children.map(unit => unit.itemTypeId)).to.eql([22, 23]);
  });

  it('verify construct context object', () => {
    const url = '/queryproxy';
    expect(__prepareContextURL(url, mockContext)).to.include(mockContextURL);
  });

  it('verify url with context', () => {
    const url = '/queryproxy?c=test%3D1&show=error';
    expect(__prepareContextURL(url, mockContext)).to.include(mockContextURL2);
  });
});
