import { expect } from 'chai';
import { parse2AST, ASTRewrite2Query } from '../../src/troop/queryParser';

describe('QueryParser', () => {
  describe('verify parse2AST', () => {
    it('verify undefined case', () => {
      const query = 'undefined';
      expect(parse2AST(query)).to.eql([]);
    });

    it('verify test!123', () => {
      const query = 'test!123';
      expect(parse2AST(query)).to.eql([
        {
          op: '!',
          text: 'test!123',
          raw: 'test!123'
        }
      ]);
    });

    it('verify test!123|xxx!321', () => {
      const query = 'test!123|xxx!321';
      expect(parse2AST(query)).to.eql([
        {
          op: '!',
          text: 'test!123',
          raw: 'test!123'
        },
        {
          op: '!',
          text: 'xxx!321',
          raw: 'xxx!321'
        }
      ]);
    });

    it('test!123.p1.p2', () => {
      const query = 'test!123.p1.p2';
      expect(parse2AST(query)).to.eql([
        {
          op: '!',
          text: 'test!123',
          raw: 'test!123'
        },
        {
          op: '.',
          text: 'p1',
          raw: 'p1'
        },
        {
          op: '.',
          text: 'p2',
          raw: 'p2'
        }
      ]);
    });

    it('test!123.p1,.p2', () => {
      const query = 'test!123.p1,.p2';
      expect(parse2AST(query)).to.eql([
        {
          op: '!',
          text: 'test!123',
          raw: 'test!123'
        },
        {
          op: '.',
          text: 'p1',
          raw: 'p1'
        },
        {
          op: ',',
          text: '',
          raw: ''
        },
        {
          op: '.',
          text: 'p2',
          raw: 'p2'
        }
      ]);
    });

    it("test!'123 321'", () => {
      const query = "test!'123 321'";
      expect(parse2AST(query)).to.eql([
        {
          op: '!',
          text: "test!'123 321'",
          raw: 'test!123 321'
        }
      ]);
    });
  });

  describe('verify ASTRewrite2Query', () => {
    it('to test!123|xxx!321', () => {
      const ast = [
        {
          op: '!',
          text: 'test!123',
          raw: 'test!123'
        },
        {
          op: '!',
          text: 'xxx!321',
          raw: 'xxx!321'
        }
      ];

      expect(ASTRewrite2Query(ast)).to.equals('test!123|xxx!321');
    });

    it('to test!123.p1,.p2', () => {
      const ast = [
        {
          op: '!',
          text: 'test!123',
          raw: 'test!123'
        },
        {
          op: '.',
          text: 'p1',
          raw: 'p1'
        },
        {
          op: ',',
          text: '',
          raw: ''
        },
        {
          op: '.',
          text: 'p2',
          raw: 'p2'
        }
      ];
      expect(ASTRewrite2Query(ast)).to.equals('test!123.p1|test!123.p2');
    });
  });
});
