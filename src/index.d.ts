declare module "main" {
  // Extism exports take no params and return an I32
  export function start(): I32;
  export function query_account(): I32;
  export function parse_account(): I32;
  export function notarize_account(): I32;
  export function query_tweet(): I32;
  export function notarize_tweet(): I32;
  export function config(): I32;
}

declare module "extism:host" {
  interface user {
    redirect(ptr: I64): void;
    notarize(ptr: I64): I64;
  }
}
