import util from 'util';

const pausar = util.promisify(setTimeout);

export interface DadosTarefa {
  descricao: string;
}

type IdTarefa = number;

// não usado por enquanto
type Tarefa = DadosTarefa & { id: IdTarefa };

let sequencial: number = 0;
const tarefas: Tarefa[] = [];

export async function cadastrarTarefa(dados: DadosTarefa): Promise<IdTarefa> {
  await pausar(100);
  sequencial++;
  const idTarefa = sequencial;
  const tarefa = {
    ...dados,
    id: idTarefa,
  };
  tarefas.push(tarefa);
  console.log('cadastrou', tarefa);
  return idTarefa;
}
