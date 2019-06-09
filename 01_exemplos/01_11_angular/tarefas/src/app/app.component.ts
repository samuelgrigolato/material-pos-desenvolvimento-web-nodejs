import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';


interface Tarefa {
  id: number;
  descricao: string;
  previsao?: Date;
  concluida: boolean;
}


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  tarefas: Tarefa[] = [];

  formGroup: FormGroup;

  constructor(private builder: FormBuilder,
              private http: HttpClient) {
  }

  ngOnInit() {
    this.formGroup = this.builder.group({
      descricao: ['', Validators.required],
      previsao: [null]
    });
    this.carregar();
  }

  private carregar() {
    this.http.get('http://localhost:8080/tarefas').subscribe(tarefas => {
      this.tarefas = <Tarefa[]>tarefas;
    });
  }

  concluir(tarefa: Tarefa) {
    this.http.post(`http://localhost:8080/tarefas/${tarefa.id}/finalizar`, {}).subscribe(() => {
      tarefa.concluida = true;
    });
  }

  reabrir(tarefa: Tarefa) {
    this.http.post(`http://localhost:8080/tarefas/${tarefa.id}/reabrir`, {}).subscribe(() => {
      tarefa.concluida = false;
    });
  }

  remover(tarefa: Tarefa) {
    this.http.delete(`http://localhost:8080/tarefas/${tarefa.id}`).subscribe(() => {
      this.tarefas.splice(this.tarefas.indexOf(tarefa), 1);
    });
  }

  cadastrar() {
    const dados = this.formGroup.value;
    this.http.post(`http://localhost:8080/tarefas`, dados).subscribe(() => {
      this.formGroup.setValue({
        descricao: "",
        previsao: null
      });
      this.carregar();
    });
  }

}
