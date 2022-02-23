# types-4-strapi

Typescript interface generator for Strapi 4 models

## Usage

- Copy types-4-strapi.js in the root of your Strapi project
- Run `node types-4-strapi`
- Find the generated types in the `types` folder

## Strapi 4 quirks

The `user` object returned by the `/users` endpoint is different from the one returned by other endpoints when `user` is one of their child properties. For this reason, types-4-strapi generates two different types: `IUser` and `INestedUser`:

```
export interface IUser {
  id: number;
  username: string;
  email: string;
  provider: string;
  confirmed: boolean;
  blocked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface INestedUser {
  id: number;
  attributes: {
    username: string;
    email: string;
    provider: string;
    confirmed: boolean;
    blocked: boolean;
    createdAt: Date;
    updatedAt: Date;
  }
}
```
