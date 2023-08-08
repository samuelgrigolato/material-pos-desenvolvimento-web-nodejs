
export interface OpcoesDePergunta {
  contexto?: string;
  entrada?: string;
}

export interface Chatbot {
  perguntarListaDeFrases(opcoesDePergunta: OpcoesDePergunta): Promise<string[]>;
  perguntarFraseUnica(opcoesDePergunta: OpcoesDePergunta): Promise<string>;
}
