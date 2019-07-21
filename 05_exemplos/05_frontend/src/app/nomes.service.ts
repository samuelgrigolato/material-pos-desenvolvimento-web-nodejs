import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { shareReplay } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class NomesService {

  private nomes: Observable<string[]>;

  constructor(private http: HttpClient) { }

  getNomes(): Observable<string[]> {
    // if (!this.nomes) {
    //   this.nomes = <Observable<string[]>>this.http
    //     .get('http://localhost:3000/nomes')
    //     .pipe(shareReplay(1));
    //   setTimeout(() => {
    //     this.nomes = null;
    //   }, 10000);
    // }
    // return this.nomes;
    return <Observable<string[]>>this.http
      .get('http://localhost:3000/nomes');
  }

}
