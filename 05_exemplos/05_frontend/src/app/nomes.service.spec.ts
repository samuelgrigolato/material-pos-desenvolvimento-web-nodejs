import { TestBed } from '@angular/core/testing';

import { NomesService } from './nomes.service';

describe('NomesService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: NomesService = TestBed.get(NomesService);
    expect(service).toBeTruthy();
  });
});
