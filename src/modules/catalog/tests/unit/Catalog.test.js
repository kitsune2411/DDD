const Catalog = require('../../domain/Catalog');

describe('Catalog Domain Entity', () => {
  it('should create a valid instance', () => {
    const entity = new Catalog({ name: 'Test Item' });
    expect(entity.id).toBeDefined();
    expect(entity.name).toBe('Test Item');
  });

  it('should throw error if name is empty', () => {
    expect(() => new Catalog({ name: '' })).toThrow();
  });
});
