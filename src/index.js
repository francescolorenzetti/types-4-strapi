#!/usr/bin/env node

const fs = require('fs');
const createInterface = require('./createInterface');
const createComponentInterface = require('./createComponentInterface');
const { pascalCase, isOptional, createFile } = require('./utils');

const typesDir = 'types';

const args = process.argv;

const strapiSrcPathArg = args[2];

if (!fs.existsSync(typesDir)) fs.mkdirSync(typesDir);

// --------------------------------------------
// Payload
// --------------------------------------------

const payloadTsInterface = `export interface Payload<T> {
  data: T;
  meta: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    }
  };
}
`;

createFile(`${typesDir}/Payload.ts`, payloadTsInterface);

// --------------------------------------------
// User
// --------------------------------------------

const userTsInterface = `export interface User {
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
`;

createFile(`${typesDir}/User.ts`, userTsInterface);

// --------------------------------------------
// MediaFormat
// --------------------------------------------

var mediaFormatTsInterface = `export interface MediaFormat {
  name: string;
  hash: string;
  ext: string;
  mime: string;
  width: number;
  height: number;
  size: number;
  path: string;
  url: string;
}
`;

createFile(`${typesDir}/MediaFormat.ts`, mediaFormatTsInterface);

// --------------------------------------------
// Media
// --------------------------------------------

var mediaTsInterface = `import { MediaFormat } from './MediaFormat';

export interface Media {
  id: number;
  attributes: {
    name: string;
    alternativeText: string;
    caption: string;
    width: number;
    height: number;
    formats: { thumbnail: MediaFormat; medium: MediaFormat; small: MediaFormat; };
    hash: string;
    ext: string;
    mime: string;
    size: number;
    url: string;
    previewUrl: string;
    provider: string;
    createdAt: Date;
    updatedAt: Date;
  }
}
`;

createFile(`${typesDir}/Media.ts`, mediaTsInterface);

// --------------------------------------------
// API Types
// --------------------------------------------

const strapiSrcPath = strapiSrcPathArg || './src';

const strapiBackendApiPath = strapiSrcPathArg
  ? `${strapiSrcPathArg}/api`
  : './src/api';

const strapiBackendComponentsPath = strapiSrcPathArg
  ? `${strapiSrcPathArg}/components`
  : './src/components';

var apiFolders;
try {
  apiFolders = fs
    .readdirSync(strapiBackendApiPath)
    .filter((x) => !x.startsWith('.'));
} catch (e) {
  console.log('No API types found. Skipping...');
}

if (apiFolders)
  for (const apiFolder of apiFolders) {
    const interfaceName = pascalCase(apiFolder);
    const interface = createInterface(
      `${strapiBackendApiPath}/${apiFolder}/content-types/${apiFolder}/schema.json`,
      interfaceName
    );

    if (interface) {
      createFile(`${typesDir}/${interfaceName}.ts`, interface);
    }
  }

// --------------------------------------------
// Components
// --------------------------------------------

var componentCategoryFolders;
try {
  componentCategoryFolders = fs.readdirSync(strapiBackendComponentsPath);
} catch (e) {
  console.log('No Component types found. Skipping...');
}

if (componentCategoryFolders) {
  const targetFolder = 'types/components';

  if (!fs.existsSync(targetFolder)) fs.mkdirSync(targetFolder);

  for (const componentCategoryFolder of componentCategoryFolders) {
    var componentSchemas = fs.readdirSync(
      `${strapiBackendComponentsPath}/${componentCategoryFolder}`
    );
    for (const componentSchema of componentSchemas) {
      const interfaceName = pascalCase(componentSchema.replace('.json', ''));
      const interface = createComponentInterface(
        `${strapiBackendComponentsPath}/${componentCategoryFolder}/${componentSchema}`,
        interfaceName
      );
      if (interface) {
        createFile(`${targetFolder}/${interfaceName}.ts`, interface);
      }
    }
  }
}
