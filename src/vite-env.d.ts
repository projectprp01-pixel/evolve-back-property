/// <reference types="vite/client" />

declare module 'country-telephone-data' {
  interface Country {
    name: string;
    iso2: string;
    dialCode: string;
    priority: number;
    format?: string;
    areaCodes?: string[] | null;
  }
  export const allCountries: Country[];
}
