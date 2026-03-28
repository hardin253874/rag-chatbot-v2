import dotenv from 'dotenv';
dotenv.config();

export type Environment = 'local' | 'cloud';
export type QueryMode = 'raw' | 'rewrite';

export function setVectorStore(env: Environment): void {
  process.env.VECTOR_STORE = env;
  console.log(`[VECTOR_STORE=${env}]`);
}

export function setQueryMode(mode: QueryMode): void {
  process.env.QUERY_MODE = mode;
  console.log(`[QUERY_MODE=${mode}]`);
}
