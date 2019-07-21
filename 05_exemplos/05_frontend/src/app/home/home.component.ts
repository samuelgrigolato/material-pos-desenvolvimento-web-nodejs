import { Component, OnInit } from '@angular/core';

import { NomesService } from '../nomes.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  nomes: string[];

  constructor(private nomesService: NomesService) { }

  ngOnInit() {
    this.nomesService
      .getNomes()
      .subscribe(nomes => this.nomes = nomes);
  }

}
