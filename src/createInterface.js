const fs = require('fs');
const { pascalCase, isOptional } = require('./utils');

module.exports = (schemaPath, interfaceName) => {
  var tsImports = [];
  var tsInterface = `\n`;
  tsInterface += `export interface ${interfaceName} {\n`;
  tsInterface += `  id: number;\n`;
  tsInterface += `  attributes: {\n`;
  var schemaFile;
  var schema;
  try {
    schemaFile = fs.readFileSync(schemaPath, 'utf8');
    schema = JSON.parse(schemaFile);
  } catch (e) {
    console.log(`Skipping ${schemaPath}: could not parse schema`, e);
    return null;
  }
  const isComponentSchema = schemaPath.includes('src/components/');
  const attributes = Object.entries(schema.attributes);
  for (const attribute of attributes) {
    var attributeName = attribute[0];
    const attributeValue = attribute[1];
    if (isOptional(attributeValue)) attributeName += '?';
    var tsPropertyType;
    var tsProperty;
    // -------------------------------------------------
    // Relation
    // -------------------------------------------------
    if (attributeValue.type === 'relation') {
      tsPropertyType = attributeValue.target.includes('::user')
        ? 'User'
        : `${pascalCase(attributeValue.target.split('.')[1])}`;
      var path = isComponentSchema
        ? `../${tsPropertyType}` // component imports api type
        : `./${tsPropertyType}`; // api type imports api type
      if (tsImports.every((x) => x.path !== path))
        tsImports.push({
          type: tsPropertyType,
          path,
        });
      const isArray = attributeValue.relation === 'oneToMany';
      const bracketsIfArray = isArray ? '[]' : '';
      tsProperty = `    ${attributeName}: { data: ${tsPropertyType}${bracketsIfArray} } | number${bracketsIfArray};\n`;
    }
    // -------------------------------------------------
    // Component
    // -------------------------------------------------
    else if (attributeValue.type === 'component') {
      tsPropertyType =
        attributeValue.target === 'plugin::users-permissions.user'
          ? 'User'
          : pascalCase(attributeValue.component.split('.')[1]);
      var path = isComponentSchema
        ? `./${tsPropertyType}` // ........... component imports component
        : `./components/${tsPropertyType}`; // api type imports component
      if (tsImports.every((x) => x.path !== path))
        tsImports.push({
          type: tsPropertyType,
          path,
        });
      const isArray = attributeValue.repeatable;
      const bracketsIfArray = isArray ? '[]' : '';
      tsProperty = `    ${attributeName}: { data: ${tsPropertyType}${bracketsIfArray} } | number${bracketsIfArray};\n`;
    }
    // -------------------------------------------------
    // Dynamic zone
    // -------------------------------------------------
    else if (attributeValue.type === 'dynamiczone') {
      tsPropertyType = '';
      for (const component of attributeValue.components) {
        if (!tsPropertyType) tsPropertyType = '[\n';
        tsPropertyType += `      | ({ __component: '${component}'; } & ${type})\n`;
        tsImports.push({
          type: pascalCase(component.split('.')[1]),
          path: `./components/${type}`,
        });
      }
      if (tsPropertyType) tsPropertyType += '    ]';
      tsProperty = `    ${attributeName}: ${tsPropertyType};\n`;
    }
    // -------------------------------------------------
    // Media
    // -------------------------------------------------
    else if (attributeValue.type === 'media') {
      tsPropertyType = 'Media';
      path = isComponentSchema ? '../Media' : './Media';
      if (tsImports.every((x) => x.path !== path))
        tsImports.push({
          type: tsPropertyType,
          path,
        });
      tsProperty = `    ${attributeName}: { data: ${tsPropertyType}${
        attributeValue.multiple ? '[]' : ''
      } };\n`;
    }
    // -------------------------------------------------
    // Enumeration
    // -------------------------------------------------
    else if (attributeValue.type === 'enumeration') {
      const enumOptions = attributeValue.enum.map((v) => `'${v}'`).join(' | ');
      tsProperty = `    ${attributeName}: ${enumOptions};\n`;
    }
    // -------------------------------------------------
    // Text, RichText, Email, UID
    // -------------------------------------------------
    else if (
      attributeValue.type === 'string' ||
      attributeValue.type === 'text' ||
      attributeValue.type === 'richtext' ||
      attributeValue.type === 'email' ||
      attributeValue.type === 'uid'
    ) {
      tsPropertyType = 'string';
      tsProperty = `    ${attributeName}: ${tsPropertyType};\n`;
    }
    // -------------------------------------------------
    // Json
    // -------------------------------------------------
    else if (attributeValue.type === 'json') {
      tsPropertyType = 'any';
      tsProperty = `    ${attributeName}: ${tsPropertyType};\n`;
    }
    // -------------------------------------------------
    // Password
    // -------------------------------------------------
    else if (attributeValue.type === 'password') {
      tsProperty = '';
    }
    // -------------------------------------------------
    // Number
    // -------------------------------------------------
    else if (
      attributeValue.type === 'integer' ||
      attributeValue.type === 'biginteger' ||
      attributeValue.type === 'decimal' ||
      attributeValue.type === 'float'
    ) {
      tsPropertyType = 'number';
      tsProperty = `    ${attributeName}: ${tsPropertyType};\n`;
    }
    // -------------------------------------------------
    // Date
    // -------------------------------------------------
    else if (
      attributeValue.type === 'date' ||
      attributeValue.type === 'datetime' ||
      attributeValue.type === 'time'
    ) {
      tsPropertyType = 'Date';
      tsProperty = `    ${attributeName}: ${tsPropertyType};\n`;
    }
    // -------------------------------------------------
    // Boolean
    // -------------------------------------------------
    else if (attributeValue.type === 'boolean') {
      tsPropertyType = 'boolean';
      tsProperty = `    ${attributeName}: ${tsPropertyType};\n`;
    }
    // -------------------------------------------------
    // Others
    // -------------------------------------------------
    else {
      tsPropertyType = 'any';
      tsProperty = `    ${attributeName}: ${tsPropertyType};\n`;
    }
    tsInterface += tsProperty;
  }
  tsInterface += `  }\n`;
  tsInterface += '}';
  for (const tsImport of tsImports) {
    tsInterface =
      `import { ${tsImport.type} } from '${tsImport.path}';\n` + tsInterface;
  }
  return tsInterface;
};
