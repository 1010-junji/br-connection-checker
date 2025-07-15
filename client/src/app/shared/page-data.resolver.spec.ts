import { TestBed } from '@angular/core/testing';

import { PageDataResolver } from './page-data.resolver';

describe('PageDataResolver', () => {
  let resolver: PageDataResolver;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    resolver = TestBed.inject(PageDataResolver);
  });

  it('should be created', () => {
    expect(resolver).toBeTruthy();
  });
});
