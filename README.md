# Types-4-Strapi

Typescript interface generator for Strapi 4 models.

## Usage

- Copy types-4-strapi.js in the root of your Strapi project.
- Run `node types-4-strapi`.
- Find the generated types in the `types` folder.

## Strapi 4 quirks

In most cases, Strapi returns objects where all the properties (aside from `id`) are wrapped into an `attributes` object. For this reason, this is how types-4-strapi's interfaces are structured.

```
{
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

However, sometimes the same object is returned "flattened". This is the case, for instance, for the `/api/users` endpoint, which returns an array of objects with the following structure:

```
{
  id: number;
  username: string;
  email: string;
  provider: string;
  confirmed: boolean;
  blocked: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

The same "flat" structure is also required when submitting the body of `POST` and `PUT` requests. Here is an example using `fetch`.

```
  await fetch(https://project.com/api/users, {
    method: 'POST',
    body: JSON.stringify({
      username: 'Jon Snow',
      email: 'jon.snow@housestark.com'
    })
  });
```

In these cases, rather than creating completely new types, we recommend that you simply 'extract' the type of the `attribute` object from the entity's interface using **indexed access types**.

```
const body = {
  username: 'Jon Snow',
  email: 'jon.snow@housestark.com'
} as User['attributes'];

await fetch(https://project.com/api/users, {
  method: 'POST',
  body
});
```
