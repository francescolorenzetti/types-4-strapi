var fs = require('fs');

// --------------------------------------------
// IUser
// --------------------------------------------

var userTsInterface = '';
userTsInterface += `export interface IUser {\n`;
userTsInterface += `  id: number;\n`;
userTsInterface += `  username: string;\n`;
userTsInterface += `  email: string;\n`;
userTsInterface += `  provider: string;\n`;
userTsInterface += `  confirmed: boolean;\n`;
userTsInterface += `  blocked: boolean;\n`;
userTsInterface += `  createdAt: Date;\n`;
userTsInterface += `  updatedAt: Date;\n`;
userTsInterface += `}\n`;
fs.writeFileSync(`types/IUser.ts`, userTsInterface);

// --------------------------------------------
// INestedUser (when User is a child of another entity)
// --------------------------------------------

var nestedUserTsInterface = '';
nestedUserTsInterface += `export interface INestedUser {\n`;
nestedUserTsInterface += `  id: number;\n`;
nestedUserTsInterface += `  attributes: {\n`;
nestedUserTsInterface += `    username: string;\n`;
nestedUserTsInterface += `    email: string;\n`;
nestedUserTsInterface += `    provider: string;\n`;
nestedUserTsInterface += `    confirmed: boolean;\n`;
nestedUserTsInterface += `    blocked: boolean;\n`;
nestedUserTsInterface += `    createdAt: Date;\n`;
nestedUserTsInterface += `    updatedAt: Date;\n`;
nestedUserTsInterface += `  }\n`;
nestedUserTsInterface += `}\n`;
fs.writeFileSync(`types/INestedUser.ts`, nestedUserTsInterface);

// --------------------------------------------
// IMediaFormat
// --------------------------------------------

var mediaFormatTsInterface = '';
mediaFormatTsInterface += `export interface IMediaFormat {\n`;
mediaFormatTsInterface += `  name: string;\n`;
mediaFormatTsInterface += `  hash: string;\n`;
mediaFormatTsInterface += `  ext: string;\n`;
mediaFormatTsInterface += `  mime: string;\n`;
mediaFormatTsInterface += `  width: number;\n`;
mediaFormatTsInterface += `  height: number;\n`;
mediaFormatTsInterface += `  size: number;\n`;
mediaFormatTsInterface += `  path: string;\n`;
mediaFormatTsInterface += `  url: string;\n`;
mediaFormatTsInterface += `}\n`;
fs.writeFileSync(`types/IMediaFormat.ts`, mediaFormatTsInterface);

// --------------------------------------------
// IMedia
// --------------------------------------------

var mediaTsInterface = '';
mediaTsInterface += `import { IMediaFormat } from './IMediaFormat';\n`;
mediaTsInterface += `\n`;
mediaTsInterface += `export interface IMedia {\n`;
mediaTsInterface += `  id: number;\n`;
mediaTsInterface += `  attributes: {\n`;
mediaTsInterface += `    name: string;\n`;
mediaTsInterface += `    alternativeText: string;\n`;
mediaTsInterface += `    caption: string;\n`;
mediaTsInterface += `    width: number;\n`;
mediaTsInterface += `    height: number;\n`;
mediaTsInterface += `    formats: { thumbnail: IMediaFormat; medium: IMediaFormat; small: IMediaFormat; };\n`;
mediaTsInterface += `    hash: string;\n`;
mediaTsInterface += `    ext: string;\n`;
mediaTsInterface += `    mime: string;\n`;
mediaTsInterface += `    size: number;\n`;
mediaTsInterface += `    url: string;\n`;
mediaTsInterface += `    previewUrl: string;\n`;
mediaTsInterface += `    provider: string;\n`;
mediaTsInterface += `    createdAt: Date;\n`;
mediaTsInterface += `    updatedAt: Date;\n`;
mediaTsInterface += `  }\n`;
mediaTsInterface += `}\n`;
fs.writeFileSync(`types/IMedia.ts`, mediaTsInterface);

// --------------------------------------------
// API Types
// --------------------------------------------

var root = fs.readdirSync('./src/api').filter(x => !x.startsWith('.'));

for (const path of root) {
    var tsImports = [];
    var tsInterface = `\n`;
    tsInterface += `export interface I${capitalize(path)} {\n`;
    tsInterface += `  id: number;\n`;
    tsInterface += `  attributes: {\n`;
    var schema = JSON.parse(fs.readFileSync(`./src/api/${path}/content-types/${path}/schema.json`, 'utf8'));
    const attributes = Object.entries(schema.attributes);
    for (const attribute of attributes) {
        const key = attribute[0];
        const value = attribute[1];
        var type = value.type;
        var tsProperty;
        if (type === 'relation') {
            type = value.target === 'plugin::users-permissions.user' ?
                'INestedUser' :
                `I${capitalize(value.target.split('.')[1])}`;
            if (tsImports.every(x => x !== type)) tsImports.push(type);
            const isArray = value.relation === 'oneToMany';
            tsProperty = `    ${key}: { data: ${type}${isArray ? '[]' : ''} };\n`;
        }
        else if (type === 'media') {
            type = 'IMedia';
            if (tsImports.every(x => x !== type)) tsImports.push(type);
            tsProperty = `    ${key}: { data: ${type}${value.multiple ? '[]' : ''} };\n`;
        }
        else if (type === 'enumeration' || type === 'richtext' || type === 'email') {
            type = 'string';
            tsProperty = `    ${key}: ${type};\n`;
        }
        else if (type === 'json') {
            type = 'any';
            tsProperty = `    ${key}: ${type};\n`;
        }
        else if (type === 'password') {
            tsProperty = '';
        }
        else {
            tsProperty = `    ${key}: ${type};\n`;
        }
        tsInterface += tsProperty;
    }
    tsInterface += `  }\n`;
    tsInterface += '}'
    for (const tsImport of tsImports) {
        tsInterface = `import { ${tsImport} } from './${tsImport}';\n` + tsInterface;
    }
    fs.writeFileSync(`types/I${capitalize(path)}.ts`, tsInterface);
}

function capitalize(str) {
    if (!str) return;
    return str.charAt(0).toUpperCase() + str.slice(1);
}
