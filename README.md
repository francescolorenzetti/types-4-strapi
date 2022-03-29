# Types-4-Strapi

Typescript interface generator for Strapi 4 models.

## Install locally

```bash
npm i --save-dev types-4-strapi
```

Add t4s to your scripts:

```json
"scripts": {
  "develop": "strapi develop",
  "start": "strapi start",
  "build": "strapi build",
  "strapi": "strapi",
  "t4s": "t4s"
}
```

Then run with:

```bash
npm run t4s
```

## Install globally

```bash
npm i -g types-4-strapi
```

Then run with:

```bash
t4s
```

## Attributes

For some inscrutable reason, Strapi 4 returns objects where all the properties (aside from `id`) are wrapped into an `attributes` object. The resulting interfaces will look like this:

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

However, for some even more inscrutable reason, sometimes the same object is returned "flattened", without an `attributes` object. This is the case, for instance, for the `/api/users` endpoint, which returns an array of Users with the following structure:

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

```ts
// correct
await fetch('https://project.com/api/users', {
  method: 'POST',
  body: JSON.stringify({
    username: 'Jon Snow',
    email: 'jon.snow@housestark.com',
  }),
});

// incorrect
await fetch('https://project.com/api/users', {
  method: 'POST',
  body: JSON.stringify({
    attributes: {
      username: 'Jon Snow',
      email: 'jon.snow@housestark.com',
    },
  }),
});
```

In these cases, rather than creating completely new types, we recommend that you simply 'extract' the type of the `attribute` object from the entity's interface using **indexed access types**.

```ts
type UserAttributes = User['attributes'];

await fetch('https://project.com/api/users', {
  method: 'POST',
  body: {
    username: 'Jon Snow',
    email: 'jon.snow@housestark.com',
  } as UserAttributes
});
```
