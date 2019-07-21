import { Request } from "express";


export function extrairNome(req: Request): string {
    return req.query.nome;
}
